import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';

// Импорт хуков
import { useCitizenAppeals } from '../features/appeals/hooks/useAppeals';
// Импорт компонентов
import { NewAppealModal } from '../features/appeals/components/NewAppealModal';
// ПОДКЛЮЧАЕМ НОВЫЙ ТИП ЗДЕСЬ:
import type { Appeal } from '../features/appeals/types';


export const CitizenPage = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const { data: appeals, isLoading, isFetching } = useCitizenAppeals();

    // 1. Кастомный рендер статуса с правильной подсветкой (must-have для UI)
    const statusBodyTemplate = (rowData: Appeal) => {
        const severityMap = {
            done: 'success',
            in_work: 'info',
            overdue: 'danger'
        };

        const labelMap = {
            done: 'Решено',
            in_work: 'В работе',
            overdue: 'Просрочено ведомством'
        };

        return (
            <Tag
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                severity={severityMap[rowData.status] as any}
                value={labelMap[rowData.status]}
                className="uppercase text-xs tracking-wider px-3 py-1"
            />
        );
    };

    // 2. Форматирование дат для красивого вывода
    const dateTemplate = (field: 'created_at' | 'deadline_at' | 'executed_at') => (rowData: Appeal) => {
        const val = rowData[field];
        if (!val) return <span className="text-gray-400">—</span>;
        return new Date(val).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 3. Вычисление быстрой минии-статистики для ЛК
    const totalCount = appeals?.length || 0;
    const inWorkCount = appeals?.filter(a => a.status === 'in_work').length || 0;
    const doneCount = appeals?.filter(a => a.status === 'done').length || 0;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Панель приветствия и кнопка создания */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Личный кабинет гражданина</h1>
                    <p className="text-gray-500 mt-1">Здесь вы можете подавать заявления и отслеживать статус их исполнения</p>
                </div>
                <Button
                    label="Подать новое обращение"
                    icon="pi pi-plus"
                    severity="success"
                    className="p-button-raised font-semibold shadow-md"
                    onClick={() => setModalVisible(true)}
                />
            </div>

            {/* Виджеты мини-статистики гражданина */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="shadow-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Всего подано обращений</span>
                        <i className="pi pi-folder text-blue-500 text-2xl" />
                    </div>
                    <p className="text-2xl font-bold mt-2 text-gray-800">{isLoading ? '...' : totalCount}</p>
                </Card>
                <Card className="shadow-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium font-medium">Сейчас на рассмотрении</span>
                        <i className="pi pi-clock text-amber-500 text-2xl" />
                    </div>
                    <p className="text-2xl font-bold mt-2 text-amber-600">{isLoading ? '...' : inWorkCount}</p>
                </Card>
                <Card className="shadow-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Успешно решено</span>
                        <i className="pi pi-check-circle text-green-500 text-2xl" />
                    </div>
                    <p className="text-2xl font-bold mt-2 text-green-600">{isLoading ? '...' : doneCount}</p>
                </Card>
            </div>

            {/* Основная таблица PrimeReact */}
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                    value={appeals || []}
                    loading={isLoading || isFetching}
                    paginator
                    rows={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    emptyMessage="Вы еще не отправляли обращений в организацию."
                    className="p-datatable-sm"
                    stripedRows
                    dataKey="id"
                >
                    <Column field="id" header="№" sortable className="w-16 font-semibold text-gray-500" />
                    <Column field="title" header="Тема обращения" className="font-medium text-gray-800" />
                    <Column field="department_name" header="Целевое ведомство"
                        body={(r: Appeal) => r.department_name || <span className="text-gray-400">На модерации</span>}
                    />
                    <Column field="created_at" header="Дата подачи" sortable body={dateTemplate('created_at')} />
                    <Column field="deadline_at" header="Ожидаемый срок" body={dateTemplate('deadline_at')} />
                    <Column field="status" header="Статус" body={statusBodyTemplate} sortable className="w-48" />
                </DataTable>
            </div>

            {/* Модальное окно создания заявления */}
            <NewAppealModal visible={modalVisible} onHide={() => setModalVisible(false)} />
        </div>
    );
};
