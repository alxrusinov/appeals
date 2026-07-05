package v1

import (
	"appeals/apps/backend/internal/domain"

	"github.com/kataras/iris/v12"
)

// getUsers обрабатывает GET /api/v1/admin/users
func (h *Handler) getUsers(ctx iris.Context) {
	users, err := h.adminUC.GetAllUsers(ctx.Request().Context())
	if err != nil {
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.JSON(iris.Map{"error": "Не удалось получить список пользователей"})
		return
	}
	ctx.JSON(users)
}

// createUser обрабатывает POST /api/v1/admin/users
func (h *Handler) createUser(ctx iris.Context) {
	var user domain.User
	if err := ctx.ReadJSON(&user); err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.JSON(iris.Map{"error": "Неверный формат данных"})
		return
	}

	err := h.adminUC.CreateUser(ctx.Request().Context(), &user)
	if err != nil {
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.JSON(iris.Map{"error": "Не удалось создать пользователя"})
		return
	}

	ctx.StatusCode(iris.StatusCreated)
	ctx.JSON(user)
}

// updateUser обрабатывает PUT /api/v1/admin/users/{id}
func (h *Handler) updateUser(ctx iris.Context) {
	id, _ := ctx.Params().GetInt("id")
	var user domain.User
	if err := ctx.ReadJSON(&user); err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.JSON(iris.Map{"error": "Неверный формат данных"})
		return
	}
	user.ID = id

	err := h.adminUC.UpdateUser(ctx.Request().Context(), &user)
	if err != nil {
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.JSON(iris.Map{"error": "Не удалось обновить данные пользователя"})
		return
	}
	ctx.StatusCode(iris.StatusOK)
	ctx.JSON(user)
}
