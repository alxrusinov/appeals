/* eslint-disable @typescript-eslint/no-explicit-any */
import { http, HttpResponse } from "msw";

const BASE_URL = "http://localhost:8080/api/v1";

let mockUsers = [
  {
    id: 1,
    name: "Иван Иванов",
    email: "ivan@sibguti.ru",
    role: "Администратор",
    status: "Активен",
  },
  {
    id: 2,
    name: "Пётр Петров",
    email: "petr@sibguti.ru",
    role: "Оператор",
    status: "Активен",
  },
  {
    id: 3,
    name: "Сергей Сидоров",
    email: "sidorov@sibguti.ru",
    role: "Исполнитель",
    status: "В отпуске",
  },
];

export const adminHandlers = [
  // Статистика
  http.get(`${BASE_URL}/admin/stats`, () => {
    return HttpResponse.json([
      {
        title: "Всего обращений",
        count: 1240,
        icon: "pi-ticket",
        color: "bg-blue-500",
        text: "text-blue-500",
      },
      {
        title: "В работе",
        count: 42,
        icon: "pi-spin pi-spinner",
        color: "bg-amber-500",
        text: "text-amber-500",
      },
      {
        title: "Активные операторы",
        count: mockUsers.filter(u => u.role === "Оператор").length,
        icon: "pi-users",
        color: "bg-green-500",
        text: "text-green-500",
      },
    ]);
  }),

  // Пользователи
  http.get(`${BASE_URL}/admin/users`, () => {
    return HttpResponse.json(mockUsers);
  }),

  // Редактирование
  http.put(`${BASE_URL}/admin/users/:id`, async ({ request, params }) => {
    const { id } = params;
    const updatedData = (await request.json()) as any;
    mockUsers = mockUsers.map(user =>
      user.id === Number(id) ? { ...user, ...updatedData } : user,
    );
    return HttpResponse.json(updatedData);
  }),

  http.post(`${BASE_URL}/admin/users`, async ({ request }) => {
    const newUser = (await request.json()) as any;

    // Генерируем инкрементальный ID на основе максимального существующего
    const nextId =
      mockUsers.length > 0 ? Math.max(...mockUsers.map(u => u.id)) + 1 : 1;

    const createdUser = {
      id: nextId,
      ...newUser,
    };

    mockUsers.push(createdUser); // Сохраняем в нашу in-memory базу

    return HttpResponse.json(createdUser, { status: 201 });
  }),

  // Редактирование существующего (PUT — оставляем как было)
  http.put(`${BASE_URL}/admin/users/:id`, async ({ request, params }) => {
    const { id } = params;
    const updatedData = (await request.json()) as any;
    mockUsers = mockUsers.map(user =>
      user.id === Number(id) ? { ...user, ...updatedData } : user,
    );
    return HttpResponse.json(updatedData);
  }),

  http.get(`${BASE_URL}/admin/report`, () => {
    // 1. Формируем шапку таблицы и строки из нашего мок-массива
    const headers = [
      "ID",
      "ФИО сотрудника",
      "Email",
      "Роль в системе",
      "Статус",
    ];
    const rows = mockUsers.map(u => [u.id, u.name, u.email, u.role, u.status]);

    // 2. Склеиваем в CSV-формат (разделитель — запятая или точка с запятой)
    // \uFEFF — это BOM-маркер, чтобы Excel сразу понял, что кодировка UTF-8, и не ломал кириллицу
    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(";"))
        .join("\n");

    // 3. Возвращаем файл как текстовый поток с правильными заголовками
    return new HttpResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8;",
        "Content-Disposition": 'attachment; filename="employees_report.csv"',
      },
    });
  }),
];
