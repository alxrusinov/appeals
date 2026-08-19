package middleware

import (
	"log"
	"strings"

	"appeals/apps/backend/internal/config"

	"github.com/golang-jwt/jwt/v5"
	"github.com/kataras/iris/v12"
)

// AuthMiddleware проверяет валидность JWT-токена
func AuthMiddleware(cfg *config.Config) iris.Handler {
	return func(ctx iris.Context) {
		if ctx.Method() == "OPTIONS" {
			ctx.Next()
			return
		}

		var tokenStr string

		// Access-токен передается только через заголовок Authorization: Bearer.
		// В куках хранится исключительно refresh_token (HttpOnly), он не годится
		// для авторизации API-запросов, поэтому фолбэка на куки здесь нет.
		authHeader := ctx.GetHeader("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
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
