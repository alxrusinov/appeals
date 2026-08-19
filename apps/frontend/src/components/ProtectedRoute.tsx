import { Navigate, Outlet } from 'react-router-dom';
import { hasAllowedRole } from '../utils/roles';

interface Props {
    allowedRoles: string[];
    userRole: string | undefined;
}

export const ProtectedRoute = ({ allowedRoles, userRole }: Props) => {
    if (!userRole) {
        // Если не авторизован — на страницу логина
        return <Navigate to="/login" replace />;
    }

    if (!hasAllowedRole(userRole, allowedRoles)) {
        // Если роль не подходит — на дефолтную страницу роли (или 403)
        return <Navigate to="/unauthorized" replace />;
    }

    // Если всё ок — рендерим дочерние компоненты (страницы)
    return <Outlet />;
};
