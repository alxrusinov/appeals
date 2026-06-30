/* eslint-disable @typescript-eslint/no-explicit-any */
import { http, HttpResponse } from "msw";

// Указываем базовый путь, соответствующий вашему API
const BASE_URL = "http://localhost:8080/api/v1";

let mockTickets = [
  {
    id: 3401,
    title: "Не работает авторизация через ЕЛК",
    category: "Техническая поддержка",
    priority: "Высокий",
    createdAt: "2026-06-29 09:15",
    status: "Новое",
    author: "Петров С.А. (Студент)",
    description: "При попытке зайти в личный кабинет выдает ошибку 500.",
    resolution: "",
  },
  // ... остальные данные
];

export const employeeHandlers = [
  // 1. Статистика
  http.get(`${BASE_URL}/employee/stats`, () => {
    return HttpResponse.json([
      {
        title: "Новые обращения",
        count: mockTickets.filter(t => t.status === "Новое").length,
        icon: "pi-bell",
        color: "bg-blue-500",
        text: "text-blue-500",
      },
      {
        title: "Взято в работу",
        count: mockTickets.filter(t => t.status === "В работе").length,
        icon: "pi-spin pi-spinner",
        color: "bg-amber-500",
        text: "text-amber-500",
      },
      {
        title: "Решенные задачи",
        count: mockTickets.filter(t => t.status === "Решено").length,
        icon: "pi-check",
        color: "bg-emerald-500",
        text: "text-emerald-500",
      },
    ]);
  }),

  // 2. Список задач
  http.get(`${BASE_URL}/employee/tickets`, () => {
    return HttpResponse.json(mockTickets);
  }),

  // 3. Создание задачи
  http.post(`${BASE_URL}/employee/tickets`, async ({ request }) => {
    const data = (await request.json()) as any;
    const newTicket = {
      id: Math.max(...mockTickets.map(t => t.id), 3400) + 1,
      ...data,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "Новое",
      author: "Я (Сотрудник)",
      resolution: "",
    };
    mockTickets = [newTicket, ...mockTickets];
    return HttpResponse.json(newTicket, { status: 201 });
  }),

  // 4. Обновление задачи
  http.put(`${BASE_URL}/employee/tickets/:id`, async ({ request, params }) => {
    const { id } = params;
    const updatedData = (await request.json()) as any;
    mockTickets = mockTickets.map(t =>
      t.id === Number(id) ? { ...t, ...updatedData } : t,
    );
    return HttpResponse.json(updatedData);
  }),

  // 5. Отчет
  http.get(`${BASE_URL}/employee/report`, () => {
    const csvContent =
      "ID;Title;Category;Priority;Status;CreatedAt\n" +
      mockTickets
        .map(
          t =>
            `${t.id};${t.title};${t.category};${t.priority};${t.status};${t.createdAt}`,
        )
        .join("\n");
    return new HttpResponse(csvContent, {
      status: 200,
      headers: { "Content-Type": "text/csv;charset=utf-8;" },
    });
  }),
];
