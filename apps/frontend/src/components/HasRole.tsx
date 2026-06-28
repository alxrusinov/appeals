import React from 'react';

interface Props {
    allowedRoles: string[];
    userRole: string | undefined;
    children: React.ReactNode;
}

export const HasRole = ({ allowedRoles, userRole, children }: Props) => {
    if (!userRole || !allowedRoles.includes(userRole)) {
        return null; // Просто не рендерим кнопку/блок
    }
    return <>{children}</>;
};
