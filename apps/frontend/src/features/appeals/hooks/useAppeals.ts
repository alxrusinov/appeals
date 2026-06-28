import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import type { Appeal, CreateAppealInput } from '../types'; // если вынесешь типы, либо оставь интерфейс прямо здесь

// 1. Хук для получения списка обращений гражданина
export const useCitizenAppeals = () => {
    return useQuery<Appeal[]>({
        queryKey: ['appeals', 'citizen'],
        queryFn: async () => {
            const { data } = await api.get('/citizen/appeals');
            return data;
        }
    });
};

// 2. Твой хук для создания нового обращения
export const useCreateAppeal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newAppeal: CreateAppealInput) => {
            const { data } = await api.post('/citizen/appeals', newAppeal);
            return data;
        },
        onSuccess: () => {
            // Мгновенно обновляем список обращений у гражданина в кэше,
            // чтобы новая запись сразу появилась в таблице PrimeReact
            queryClient.invalidateQueries({ queryKey: ['appeals', 'citizen'] });
        },
        onError: (error) => {
            console.error('Ошибка при создании обращения:', error);
        }
    });
};
