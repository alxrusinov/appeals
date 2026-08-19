package v1

import (
	"appeals/apps/backend/internal/domain"

	"github.com/kataras/iris/v12"
)

// getUsers обрабатывает GET /api/v1/admin/users
func (h *Handler) getUsers(ctx iris.Context) {
	users, err := h.adminUC.GetAllUsers(ctx.Request().Context())
	if err != nil {
		respondError(ctx, iris.StatusInternalServerError, "Не удалось получить список пользователей")
		return
	}
	ctx.JSON(users)
}

// createUser обрабатывает POST /api/v1/admin/users
func (h *Handler) createUser(ctx iris.Context) {
	var user domain.User
	if err := ctx.ReadJSON(&user); err != nil {
		respondError(ctx, iris.StatusBadRequest, "Неверный формат данных")
		return
	}

	tempPassword, err := h.adminUC.CreateUser(ctx.Request().Context(), &user)
	if err != nil {
		respondError(ctx, iris.StatusInternalServerError, "Не удалось создать пользователя")
		return
	}

	ctx.StatusCode(iris.StatusCreated)
	// temp_password отдается один раз — фронтенд должен показать его администратору
	// и не сохранять, но никогда больше не сможет получить повторно.
	ctx.JSON(iris.Map{
		"user":          user,
		"temp_password": tempPassword,
	})
}

// updateUser обрабатывает PUT /api/v1/admin/users/{id}
func (h *Handler) updateUser(ctx iris.Context) {
	id, _ := ctx.Params().GetInt("id")
	var user domain.User
	if err := ctx.ReadJSON(&user); err != nil {
		respondError(ctx, iris.StatusBadRequest, "Неверный формат данных")
		return
	}
	user.ID = id

	err := h.adminUC.UpdateUser(ctx.Request().Context(), &user)
	if err != nil {
		respondError(ctx, iris.StatusInternalServerError, "Не удалось обновить данные пользователя")
		return
	}
	ctx.StatusCode(iris.StatusOK)
	ctx.JSON(user)
}

// deleteUser обрабатывает DELETE /api/v1/admin/users/{id} — мягкое удаление
// (перевод в статус "Заблокирован"), история и авторство обращений сохраняются.
func (h *Handler) deleteUser(ctx iris.Context) {
	id, err := ctx.Params().GetInt("id")
	if err != nil {
		respondError(ctx, iris.StatusBadRequest, "невалидный ID пользователя")
		return
	}

	if err := h.adminUC.DeactivateUser(ctx.Request().Context(), id); err != nil {
		respondError(ctx, iris.StatusInternalServerError, "не удалось деактивировать пользователя")
		return
	}

	ctx.JSON(iris.Map{"message": "пользователь деактивирован"})
}
