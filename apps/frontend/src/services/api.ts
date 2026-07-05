import axios from 'axios';
import { queryClient } from './queryClient';

// 1. Инициализация инстанса с базовыми настройками
export const api = axios.create({
    // Берем URL из .env файла (для Vite нужен префикс VITE_), либо ставим локальный дефолт
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    timeout: 10000, // Таймаут 10 секунд (полезно для защиты, чтобы сеть не зависала бесконечно)
    headers: {
        'Content-Type': 'application/json',
    }
});

// 2. Перехватчик запросов (Request Interceptor)
// Автоматически добавляет JWT-токен в заголовки, если он есть в хранилище
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        // Если токен найден и заголовки существуют, инжектим Bearer-токен
       if (token && token !== 'undefined' && token !== 'null') {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Перехватчик ответов (Response Interceptor)
// Отлавливает системные ошибки бэкенда, в частности 401 Unauthorized
api.interceptors.response.use(
    (response) => response, // Если всё хорошо, просто пробрасываем ответ дальше
    (error) => {
        // Проверяем, что бэкенд вообще ответил и код ошибки — 401 (Токен протух или подделан)
        if (error.response && error.response.status === 401) {
            console.warn('[API Interceptor]: Токен невалиден или истек. Принудительный логаут.');

            // Шаг А: Физически уничтожаем токен в браузере
            localStorage.removeItem('token');

            // Шаг Б: Сбрасываем стейт авторизации в кэше React Query
            queryClient.setQueryData(['auth', 'me'], null);

            // Шаг В: Глубокая очистка кэша, чтобы стереть старые данные обращений
            queryClient.clear();

            // Шаг Г: Перенаправляем пользователя на логин.
            // Так как мы вне React-компонента, используем нативный window.location
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        // Возвращаем ошибку дальше, чтобы локальные хуки (например, форма логина)
        // могли вывести конкретный текст ошибки пользователю
        return Promise.reject(error);
    }
);
