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

func (h *Handler) register(ctx iris.Context) {
	var input registerInput
	if err := ctx.ReadJSON(&input); err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.JSON(iris.Map{"error": "неверный формат тела запроса"})
		return
	}

	if err := h.authUC.Register(ctx.Request().Context(), input.FullName, input.Email, input.Password); err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.JSON(iris.Map{"error": err.Error()})
		return
	}

	ctx.StatusCode(iris.StatusCreated)
	ctx.JSON(iris.Map{"message": "регистрация успешно завершена"})
}

func (h *Handler) login(ctx iris.Context) {
	var input loginInput
	if err := ctx.ReadJSON(&input); err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.JSON(iris.Map{"error": "неверный формат запроса"})
		return
	}

	access, refresh, user, err := h.authUC.Login(ctx.Request().Context(), input.Email, input.Password)
	if err != nil {
		ctx.StatusCode(iris.StatusUnauthorized)
		ctx.JSON(iris.Map{"error": err.Error()})
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
	userID := ctx.Values().GetDefault("user_id", 0).(int)

	user, err := h.authUC.GetProfile(ctx.Request().Context(), userID)
	if err != nil {
		ctx.StatusCode(iris.StatusNotFound)
		ctx.JSON(iris.Map{"error": "профиль не найден"})
		return
	}
	ctx.JSON(user)
}
