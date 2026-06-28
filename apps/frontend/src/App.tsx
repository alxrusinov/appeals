import { Route, Routes, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";

// 1. Импорт страниц строго по утвержденной архитектуре
import { LoginPage } from "./pages/LoginPage";
import { CitizenPage } from "./pages/CitizenPage";
import { EmployeePage } from "./pages/EmployeePage";
import { AdminPage } from "./pages/AdminPage";
import { Unauthorized } from "./pages/Unauthorized";

// 2. Хук авторизации для динамического получения роли
import { useAuth } from "./features/auth/hooks/useAuth";

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
      {/* Публичные маршруты */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

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

      {/* Умный редирект: если роут не найден, кидаем юзера на его домашний экран в зависимости от роли */}
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
