// Статусы, которые приходят с бэка
export enum BackendStatus {
  InWork = "in_work",
  Done = "done",
  Overdue = "overdue",
}

// Конфигурация отображения
export const getAppealStatusDisplay = (status: string, assigneeId: number | null) => {
  // Логика: если in_work, но исполнителя нет — значит "Новая"
  if (status === BackendStatus.InWork && !assigneeId) {
    return { label: "Новые", colorClass: "bg-blue-50 text-blue-700 border-blue-200" };
  }

  // Маппинг остальных статусов
  const map: Record<string, { label: string; colorClass: string }> = {
    [BackendStatus.InWork]: { label: "В работе", colorClass:  "bg-amber-50 text-amber-700 border-amber-200" },
    [BackendStatus.Done]: { label: "Решенные", colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    [BackendStatus.Overdue]: { label: "Просроченные", colorClass: "bg-red-50 text-red-700 border-red-200" },
  };

  return map[status] || { label: "Неизвестно", colorClass: "bg-gray-100 text-gray-700 border-gray-200" };
};
