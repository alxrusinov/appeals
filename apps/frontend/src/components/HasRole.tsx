import React from 'react';
import { hasAllowedRole } from '../utils/roles';

interface Props {
    allowedRoles: string[];
    userRole: string | undefined;
    children: React.ReactNode;
}

export const HasRole = ({ allowedRoles, userRole, children }: Props) => {
    if (!hasAllowedRole(userRole, allowedRoles)) {
        return null; // Просто не рендерим кнопку/блок
    }
    return <>{children}</>;
};
