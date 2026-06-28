import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';

export const useRealtimeStats = () => {
    return useQuery({
        queryKey: ['stats', 'realtime'],
        queryFn: async () => {
            const { data } = await api.get('/stats/realtime');
            return data; // Мапится на Go-структуру Realtime response
        }
    });
};

export const useHistoricalStats = (period: [Date | null, Date | null]) => {
    return useQuery({
        queryKey: ['stats', 'historical', period],
        queryFn: async () => {
            if (!period[0] || !period[1]) return null;
            const { data } = await api.get('/stats/summary', {
                params: {
                    from: period[0].toISOString(),
                    to: period[1].toISOString()
                }
            });
            return data;
        },
        enabled: !!period[0] && !!period[1] // Запрос пойдет только когда выбран период
    });
};
