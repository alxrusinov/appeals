// Общая проверка: есть ли у пользователя одна из разрешенных ролей.
// Используется и в роутинге (ProtectedRoute), и в точечном скрытии UI (HasRole).
export const hasAllowedRole = (
  userRole: string | undefined,
  allowedRoles: string[],
): boolean => !!userRole && allowedRoles.includes(userRole);
