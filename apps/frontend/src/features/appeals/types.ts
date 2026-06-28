// Строго перечисляем возможные статусы обращения
export type AppealStatus = 'in_work' | 'done' | 'overdue';

// Основной интерфейс сущности Обращения (совпадает со схемой СУБД на Go бэкенде)
export interface Appeal {
    id: number;
    title: string;
    description: string;
    status: AppealStatus;
    created_at: string;
    deadline_at: string;
    executed_at?: string | null; // Время закрытия (может быть пустым)
    department_name?: string | null; // Ведомство (может быть не назначено на этапе модерации)
    citizen_id?: number;
    employee_id?: number | null;
}

// Тип данных для формы отправки нового обращения (DTO)
export interface CreateAppealInput {
    title: string;
    description: string;
}
