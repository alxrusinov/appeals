package v1

import (
	"appeals/apps/backend/internal/domain"

	"github.com/kataras/iris/v12"
)

// respondError — единая точка отправки ошибок клиенту, чтобы не повторять
// пару "ctx.StatusCode(...); ctx.JSON(iris.Map{"error": ...})" в каждом хендлере.
func respondError(ctx iris.Context, statusCode int, message string) {
	ctx.StatusCode(statusCode)
	ctx.JSON(iris.Map{"error": message})
}

// getUserID достает ID текущего пользователя, положенный в контекст AuthMiddleware.
func getUserID(ctx iris.Context) int {
	return ctx.Values().GetDefault("user_id", 0).(int)
}

// getUserRole достает роль текущего пользователя, положенную в контекст AuthMiddleware.
func getUserRole(ctx iris.Context) domain.UserRole {
	return domain.UserRole(ctx.Values().GetDefault("user_role", "").(string))
}
