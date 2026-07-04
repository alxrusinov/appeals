/* eslint-disable @typescript-eslint/no-explicit-any */
import { http, HttpResponse } from "msw";

// 🎯 Указываем точный адрес, куда стучится твой Axios
const BASE_URL = "http://localhost:8080/api/v1";

export const authHandlers = [
  // 1. Перехват профиля
  http.get(`${BASE_URL}/auth/me`, () => {
    const currentRole = sessionStorage.getItem("user_role") || "admin";
    return HttpResponse.json({
      id: 777,
      name: "Александр Администраторов",
      email: "admin@sibguti.ru",
      role: currentRole,
    });
  }),

  // 2. Перехват Логина (теперь он поймает твой POST запрос!)
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as any;

    if (body.password === "employee") {
      sessionStorage.setItem("user_role", "employee");
    } else if (body.password === "citizen") {
      sessionStorage.setItem("user_role", "citizen");
    } else {
      sessionStorage.setItem("user_role", "admin");
    }

    return HttpResponse.json({
      token: "mock-jwt-token-xyz",
      user: {
        id: 777,
        email: body.email,
        role: sessionStorage.getItem("user_role"),
      },
    });
  }),

  // 3. Перехват Логаута
  http.post(`${BASE_URL}/auth/logout`, () => {
    sessionStorage.removeItem("user_role");
    return new HttpResponse(null, { status: 200 });
  }),
];
