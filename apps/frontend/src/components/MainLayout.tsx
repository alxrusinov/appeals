import { NavLink, Outlet } from "react-router-dom";
import { Button } from "primereact/button";
import { useAuth } from "../features/auth/hooks/useAuth";

interface MainLayoutProps {
  user:
    | {
        role: string;
        name?: string;
      }
    | null
    | undefined;
}

export const MainLayout = ({ user }: MainLayoutProps) => {
  const { logout } = useAuth();

  // Функция для стилизации активных ссылок
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-transparent ${
      isActive
        ? "bg-green-50 text-green-700 border-green-100 shadow-xs"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  // Получаем текстовое описание роли для вывода в шапке
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "employee":
        return "Сотрудник";
      case "citizen":
        return "Гражданин";
      default:
        return "Гость";
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50/50 box-border">
      {/* ГЛОБАЛЬНЫЙ HEADER */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between box-border shadow-xs">
        {/* Логотип */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center shadow-md shadow-green-200">
            <i className="pi pi-desktop text-white text-lg" />
          </div>
          <span className="font-bold text-gray-900 tracking-tight hidden sm:inline-block">
            СибГУТИ <span className="text-green-600">Service Desk</span>
          </span>
        </div>

        {/* ДИНАМИЧЕСКАЯ НАВИГАЦИЯ НА ОСНОВЕ РОЛИ */}
        <nav className="flex items-center gap-2">
          {user?.role === "citizen" && (
            <NavLink to="/cabinet" className={linkClass}>
              <i className="pi pi-user" />
              <span>Личный кабинет</span>
            </NavLink>
          )}

          {(user?.role === "employee" || user?.role === "admin") && (
            <NavLink to="/workspace" className={linkClass}>
              <i className="pi pi-briefcase" />
              <span>Рабочее пространство</span>
            </NavLink>
          )}

          {user?.role === "admin" && (
            <NavLink to="/admin/dashboard" className={linkClass}>
              <i className="pi pi-sliders-h" />
              <span className="hidden md:inline">Администрирование</span>
            </NavLink>
          )}
        </nav>

        {/* БЛОК ПОЛЬЗОВАТЕЛЯ И ВЫХОД */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              {getRoleLabel(user?.role)}
            </span>
          </div>

          <Button
            icon="pi pi-sign-out"
            label="Выйти"
            severity="danger"
            text
            onClick={logout}
            className="gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-medium text-sm transition-colors"
          />
        </div>
      </header>

      {/* ЗОНА ВЫВОДА КОНТЕНТА СТРАНИЦ */}
      <main className="flex-grow w-full flex flex-col box-border">
        <Outlet />
      </main>
    </div>
  );
};
