import { Route, Routes, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/MainLayout";

// 1. Импорт страниц строго по утвержденной архитектуре
import { LoginPage } from "./pages/LoginPage";
import { CitizenPage } from "./pages/CitizenPage";
import { EmployeePage } from "./pages/EmployeePage";
import { AdminPage } from "./pages/AdminPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";

// 2. Хук авторизации для динамического получения роли
import { useAuth } from "./features/auth/hooks/useAuth";

import "primereact/resources/themes/lara-light-green/theme.css"; // или ваша тема
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./index.css";

function App() {
  // Получаем данные текущего юзера и статус загрузки (проверки токена) из React Query
  const { user, isLoading } = useAuth();

  // Пока бэкенд проверяет валидность токена из localStorage, крутим спиннер PrimeReact
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <i className="pi pi-spin pi-spinner text-4xl text-green-600" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Публичные маршруты (БЕЗ глобальной шапки и меню) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* 🎯 ВСЕ ЗАЩИЩЕННЫЕ МАРШРУТЫ ВНУТРИ ГЛОБАЛЬНОГО МАКЕТА */}
      <Route element={<MainLayout user={user} />}>
        {/* Доступно только Гражданам */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["citizen"]} userRole={user?.role} />
          }
        >
          <Route path="/cabinet" element={<CitizenPage />} />
        </Route>

        {/* Доступно Сотрудникам и Админам */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["employee", "admin"]}
              userRole={user?.role}
            />
          }
        >
          <Route path="/workspace" element={<EmployeePage />} />
        </Route>

        {/* Доступно ТОЛЬКО Админам */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["admin"]} userRole={user?.role} />
          }
        >
          <Route path="/admin/dashboard" element={<AdminPage />} />
        </Route>
      </Route>

      {/* Умный редирект */}
      <Route
        path="*"
        element={
          user ? (
            user.role === "citizen" ? (
              <Navigate to="/cabinet" replace />
            ) : user.role === "admin" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/workspace" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
