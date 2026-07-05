package middleware

import (
	"log"
	"strings"

	"appeals/apps/backend/internal/config"
	"appeals/apps/backend/internal/domain"

	"github.com/golang-jwt/jwt/v5"
	"github.com/kataras/iris/v12"
)

// AuthMiddleware проверяет валидность JWT-токена
func AuthMiddleware(cfg *config.Config) iris.Handler {
	return func(ctx iris.Context) {
		var tokenStr string

		// 1. Пытаемся взять токен из заголовка Authorization
		authHeader := ctx.GetHeader("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		}

		// 2. Fallback: если в заголовке нет, ищем в куках (HttpOnly)
		if tokenStr == "" {
			tokenStr = ctx.GetCookie("access_token")
		}

		if tokenStr == "" {
			ctx.StopWithJSON(iris.StatusUnauthorized, iris.Map{"error": "отсутствует токен авторизации"})
			return
		}

		// Парсим и валидируем токен
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(cfg.JWT.Secret), nil
		})

		if err != nil {
			log.Printf("[DEBUG] JWT Parse Error: %v", err)
			ctx.StopWithJSON(iris.StatusUnauthorized, iris.Map{"error": "невалидный или просроченный токен"})
			return
		}

		if !token.Valid {
			ctx.StopWithJSON(iris.StatusUnauthorized, iris.Map{"error": "токен невалиден"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			ctx.StopWithJSON(iris.StatusUnauthorized, iris.Map{"error": "ошибка чтения claims"})
			return
		}

		// Сохраняем данные пользователя в контекст запроса Iris
		ctx.Values().Set("user_id", int(claims["sub"].(float64)))
		ctx.Values().Set("user_role", claims["role"].(string))

		ctx.Next()
	}
}

// RoleMiddleware ограничивает доступ к эндпоинту на основе роли
func RoleMiddleware(allowedRole domain.UserRole) iris.Handler {
	return func(ctx iris.Context) {
		role := ctx.Values().GetString("user_role")
		if role != string(allowedRole) {
			ctx.StopWithJSON(iris.StatusForbidden, iris.Map{"error": "доступ запрещен для вашей роли"})
			return
		}
		ctx.Next()
	}
}
