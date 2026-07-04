import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logout = () => {
    // 1. Удаляем JWT-токен из браузера
    localStorage.removeItem("token");

    // Если вы сохраняли роль в sessionStorage (как делали на странице Unauthorized)
    sessionStorage.removeItem("user_role");

    // 2. Сбрасываем стейт авторизации в кэше React Query
    queryClient.setQueryData(["auth", "me"], null);

    // 3. Глубокая очистка всего кэша (стирает обращения, статистику и т.д.)
    queryClient.clear();

    // 4. Перенаправляем пользователя на страницу логина через роутер
    navigate("/login");
  };

  return logout;
};
