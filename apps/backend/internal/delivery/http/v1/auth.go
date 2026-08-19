package v1

import (
	"github.com/kataras/iris/v12"
)

type registerInput struct {
	FullName string `json:"full_name" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type loginInput struct {
	Email    string `json:"email" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type changePasswordInput struct {
	OldPassword string `json:"old_password" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=6"`
}

func (h *Handler) register(ctx iris.Context) {
	var input registerInput
	if err := ctx.ReadJSON(&input); err != nil {
		respondError(ctx, iris.StatusBadRequest, "неверный формат тела запроса")
		return
	}

	if err := h.authUC.Register(ctx.Request().Context(), input.FullName, input.Email, input.Password); err != nil {
		respondError(ctx, iris.StatusBadRequest, err.Error())
		return
	}

	ctx.StatusCode(iris.StatusCreated)
	ctx.JSON(iris.Map{"message": "регистрация успешно завершена"})
}

func (h *Handler) login(ctx iris.Context) {
	var input loginInput
	if err := ctx.ReadJSON(&input); err != nil {
		respondError(ctx, iris.StatusBadRequest, "неверный формат запроса")
		return
	}

	access, refresh, user, err := h.authUC.Login(ctx.Request().Context(), input.Email, input.Password)
	if err != nil {
		respondError(ctx, iris.StatusUnauthorized, err.Error())
		return
	}

	// Выставляем Refresh Token в безопасную HttpOnly куку
	ctx.SetCookieKV("refresh_token", refresh, iris.CookieHTTPOnly(true), iris.CookiePath("/"))

	ctx.JSON(iris.Map{
		"access_token": access,
		"token_type":   "Bearer",
		"user":         user,
	})
}

func (h *Handler) logout(ctx iris.Context) {
	// Стираем HttpOnly сессию
	ctx.RemoveCookie("refresh_token", iris.CookiePath("/"))
	ctx.JSON(iris.Map{"message": "сессия успешно завершена"})
}

func (h *Handler) me(ctx iris.Context) {
	userID := getUserID(ctx)

	user, err := h.authUC.GetProfile(ctx.Request().Context(), userID)
	if err != nil {
		respondError(ctx, iris.StatusNotFound, "профиль не найден")
		return
	}
	ctx.JSON(user)
}

// changePassword обрабатывает POST /api/v1/auth/change-password (доступно любой
// авторизованной роли). Актуально в том числе для пользователей с временным
// паролем, выданным администратором при создании учетной записи.
func (h *Handler) changePassword(ctx iris.Context) {
	var input changePasswordInput
	if err := ctx.ReadJSON(&input); err != nil {
		respondError(ctx, iris.StatusBadRequest, "неверный формат запроса")
		return
	}

	err := h.authUC.ChangePassword(ctx.Request().Context(), getUserID(ctx), input.OldPassword, input.NewPassword)
	if err != nil {
		respondError(ctx, iris.StatusBadRequest, err.Error())
		return
	}

	ctx.JSON(iris.Map{"message": "пароль успешно изменен"})
}
