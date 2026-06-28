/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Отключаем перезапрос при фокусе на окно браузера (спасает на демонстрации)
            refetchOnWindowFocus: false,

            // Количество попыток перезапроса при ошибке (ставим 1, чтобы консоль не забивалась ошибками)
            retry: 1,

            // Время, в течение которого данные считаются свежими (30 секунд)
            staleTime: 1000 * 30,

            // Время хранения данных в кэше перед их автоматическим удалением (5 минут)
            gcTime: 1000 * 60 * 5,
        },
        mutations: {
            // Глобальная обработка ошибок для мутаций (логин, отправка формы)
            onError: (error: any) => {
                const message = error?.response?.data?.message || 'Произошла непредвиденная ошибка';
                console.error(`[Global Mutation Error]: ${message}`);
                // Здесь в будущем можно подключить PrimeReact Toast для красивых уведомлений
            }
        }
    },
});
