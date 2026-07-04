/* eslint-disable @typescript-eslint/no-explicit-any */
import { http, HttpResponse } from "msw";
import type { Appeal } from "../../features/appeals/types";

const BASE_URL = "http://localhost:8080/api/v1";

// Внутреннее хранилище моков (строго структуры типа Appeal из контракта)
let mockCitizenAppeals: Appeal[] = [
  {
    id: 1024,
    title: "Проблема с доступом к Wi-Fi в общежитии №4",
    description:
      "В комнате 315 постоянно обрывается соединение с точкой доступа NSTU-Academic. Прошу проверить оборудование.",
    department_name: "Департамент IT и связи",
    status: "in_work", // В работе
    created_at: "2026-07-02T11:30:00.000Z",
    deadline_at: "2026-08-02T11:30:00.000Z",
    executed_at: undefined,
  },
  {
    id: 987,
    title: "Просьба выдать дубликат студенческого билета",
    description:
      "Потерял оригинал в общественном транспорте. Заявление на имя декана написал.",
    department_name: "Студенческий отдел кадров",
    status: "done", // Решено
    created_at: "2026-06-15T14:00:00.000Z",
    deadline_at: "2026-07-15T14:00:00.000Z",
    executed_at: "2026-06-18T10:00:00.000Z",
    // Кастомное поле для вывода ответа в модалке детализации
    resolution:
      "Дубликат изготовлен. Вы можете забрать его в студенческом отделе кадров (корпус 1, каб. 202) с 10:00 до 16:00.",
  } as any,
];

export const citizenHandlers = [
  // 1. GET /api/v1/citizen/appeals — Список обращений авторизованного гражданина
  http.get(`${BASE_URL}/citizen/appeals`, () => {
    return HttpResponse.json(mockCitizenAppeals);
  }),

  // 2. POST /api/v1/citizen/appeals — Подача нового заявления гражданином
  http.post(`${BASE_URL}/citizen/appeals`, async ({ request }) => {
    const body = (await request.json()) as {
      title: string;
      description: string;
    };

    const now = new Date();
    // Имитируем регламентированный срок ответа бэкенда (например, +30 дней)
    const deadline = new Date();
    deadline.setDate(now.getDate() + 30);

    // Собираем объект строго по правилам бэкенда
    const newAppeal: Appeal = {
      id: Math.max(...mockCitizenAppeals.map(a => a.id), 1000) + 1,
      title: body.title,
      description: body.description,
      status: "in_work", // По дефолту статус "В работе" (in_work)
      department_name: undefined, // Исполнитель пустой -> в UI отобразится "На модерации"
      created_at: now.toISOString(),
      deadline_at: deadline.toISOString(),
      executed_at: undefined,
    };

    // Добавляем в начало списка
    mockCitizenAppeals = [newAppeal, ...mockCitizenAppeals];

    return HttpResponse.json(newAppeal, { status: 201 });
  }),
];
