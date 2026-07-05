/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

// Описание интерфейса пользователя в соответствии с моделью СУБД
export interface User {
    id: number;
    email: string;
    full_name: string;
    role: 'citizen' | 'employee' | 'admin';
    department_id?: number;
}

// Интерфейс ответа бэкенда при успешном логине
interface LoginResponse {
    access_token: string;
    token_type: string;
    user: User;

}

export const useAuth = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Проверяем физическое наличие токена в браузере
    const token = localStorage.getItem('token');

    // 1. Проверка сессии (Запрос /auth/me)
    const { data: user, isLoading } = useQuery<User | null>({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/auth/me');
                return data;
            } catch {
                // Если бэкенд ответил ошибкой (токен истек или заблокирован) — чистим мусор
                localStorage.removeItem('token');
                return null;
            }
        },
        // Запрос сработает только если у нас в принципе есть токен
        enabled: !!token,
        // Важно для диплома: отключаем повторные попытки (retries) при ошибках 401/403,
        // чтобы не спамить бэкенд в консоли
        retry: false,
        // Профиль пользователя меняется редко, кэшируем на 5 минут
        staleTime: 1000 * 60 * 5,
    });

    // 2. Мутация авторизации (Логин)
    const loginMutation = useMutation({
        mutationFn: async (credentials: Record<string, string>) => {
            const { data } = await api.post<LoginResponse>('/auth/login', credentials);
            return data;
        },
        onSuccess: (data) => {
            // Сохраняем полученный JWT-токен
            console.log("Успешный логин! Ответ сервера:", data);
            localStorage.setItem('token', data.access_token);

            // Синьорский трюк: ручная запись юзера в кэш React Query.
            // Нам не нужно делать лишний сетевой запрос к /auth/me, данные уже у нас.
            queryClient.setQueryData(['auth', 'me'], data.user);
            console.log("Пытаюсь сделать navigate на:", data.user.role === 'citizen' ? '/cabinet' : '/workspace')
            // Автоматическое перенаправление на нужный экран на основе роли
            switch (data.user.role) {
                case 'citizen':
                    navigate('/cabinet');
                    break;
                case 'admin':
                    navigate('/admin/dashboard');
                    break;
                default:
                    navigate('/workspace'); // Экран для employee
            }
        },
        onError: (err) => {
        console.error("Ошибка при логине:", err); // ПОСМОТРИ СЮДА
        alert("Не удалось войти: " + (err as any).response?.data?.error || "Неизвестная ошибка");
    }
    });

    // 3. Безопасный выход из системы (Логаут)
    const logout = () => {
        // Удаляем токен авторизации
        localStorage.removeItem('token');

        // Сбрасываем стейт пользователя
        queryClient.setQueryData(['auth', 'me'], null);

        // Критически важно для ИБ: полностью вычищаем кэш React Query!
        // Если этого не сделать, при логине под другим аккаунтом на этом же ПК
        // на секунду могут мелькнуть старые списки обращений или графики.
        queryClient.clear();

        // Возвращаем на форму входа
        navigate('/login');
    };

    return {
        // Если токена нет изначально, принудительно возвращаем null (минуя состояние кэша)
        user: token ? user : null,
        isLoading: token ? isLoading : false,

        // Проксируем методы мутации наружу для формы LoginForm
        login: loginMutation.mutate,
        isLoggingIn: loginMutation.isPending,
        loginError: loginMutation.error,

        logout
    };
};
