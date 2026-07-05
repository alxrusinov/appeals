package middleware

import (
	"appeals/apps/backend/internal/domain"

	"github.com/kataras/iris/v12"
)

func RoleMiddleware(allowedRoles ...domain.UserRole) iris.Handler {
	return func(ctx iris.Context) {
		roleVal := ctx.Values().Get("user_role")
		if roleVal == nil {
			ctx.StatusCode(iris.StatusUnauthorized)
			ctx.JSON(iris.Map{"error": "токен валиден, но роль в контексте не найдена"})
			return
		}

		// 🛡️ Безопасное извлечение роли (обрабатываем и string, и domain.UserRole)
		var userRole domain.UserRole

		if str, ok := roleVal.(string); ok {
			userRole = domain.UserRole(str) // приводим строку к нашему доменному типу
		} else if r, ok := roleVal.(domain.UserRole); ok {
			userRole = r
		} else {
			ctx.StatusCode(iris.StatusForbidden)
			ctx.JSON(iris.Map{"error": "неподдерживаемый формат роли в токене"})
			return
		}

		// Проверяем наличие роли в списке разрешенных
		for _, role := range allowedRoles {
			if userRole == role {
				ctx.Next()
				return
			}
		}

		// Если роль не совпала
		ctx.StatusCode(iris.StatusForbidden)
		ctx.JSON(iris.Map{"error": "доступ запрещен для вашей роли"})
	}
}
