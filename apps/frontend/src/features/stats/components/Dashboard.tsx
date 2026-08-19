/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Card } from 'primereact/card';
import { Calendar } from 'primereact/calendar';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useRealtimeStats, useHistoricalStats } from '../hooks/useStats';

export const Dashboard = () => {
    const [period, setPeriod] = useState<[Date | null, Date | null]>([
        new Date(new Date().setDate(new Date().getDate() - 30)), // -30 дней
        new Date()
    ]);

    const { data: rt } = useRealtimeStats();
    const { data: history } = useHistoricalStats(period);

    // Подготовка данных для PieChart (Распределение по статусам)
    const statusData = history ? [
        { name: 'В работе', value: history.by_status.in_work, color: '#3B82F6' },
        { name: 'Исполнено', value: history.by_status.done, color: '#10B981' },
        { name: 'Просрочено', value: history.by_status.overdue, color: '#EF4444' }
    ] : [];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Аналитика по обращениям</h2>

            {/* Блок 1: Realtime счетчики */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card title="Активные обращения" className="border-l-4 border-blue-500">
                    <p className="text-3xl font-bold">{rt?.active_total || 0}</p>
                </Card>
                <Card title="В работе (в сроке)" className="border-l-4 border-green-500">
                    <p className="text-3xl font-bold text-green-600">{rt?.in_work_count || 0}</p>
                </Card>
                <Card title="Критическая просрочка" className="border-l-4 border-red-500">
                    <p className="text-3xl font-bold text-red-600">{rt?.overdue_count || 0}</p>
                </Card>
            </div>

            {/* Блок 2: Фильтр периода для исторических данных */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex items-center gap-4">
                <span className="font-semibold">Аналитический период:</span>
                <Calendar value={period} onChange={(e) => setPeriod(e.value as any)} selectionMode="range" readOnlyInput showIcon />
                {history && (
                    <div className="ml-auto text-sm bg-red-50 text-red-700 px-3 py-1 rounded-full font-medium">
                        Доля просрочки за период: {history.overdue_ratio}%
                    </div>
                )}
            </div>

            {/* Блок 3: Графики */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Круговая диаграмма статусов */}
                <Card title="Структура обращений по статусам">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {statusData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Столбчатая диаграмма по отделам */}
                <Card title="Нагрузка по департаментам">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={history?.by_departments || []}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="total" name="Всего заявок" fill="#6366F1" />
                                <Bar dataKey="overdue" name="Из них просрочено" fill="#EF4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};
