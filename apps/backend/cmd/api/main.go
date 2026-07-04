package main

import (
	"context"
	"time"

	"appeals/apps/backend/internal/config"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/middleware/logger"
	"github.com/kataras/iris/v12/middleware/recover"
)

func main() {
	// 1. Инициализация конфигурации
	cfg := config.MustLoad()

	// 2. Инициализация Iris приложения
	app := iris.New()
	app.Logger().SetLevel(cfg.Env)

	// Настройка дефолтного логгера и восстановления после паники
	app.UseRouter(recover.New())
	app.UseRouter(logger.New())

	// 3. Подключение к Базе Данных (MySQL)
	db, err := sqlx.Connect("mysql", cfg.MySQL.DSN())
	if err != nil {
		app.Logger().Fatalf("Ошибка подключения к БД: %v", err)
	}
	defer db.Close()

	// Настройки пула соединений (важно для продакшна)
	db.SetMaxOpenConns(cfg.MySQL.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MySQL.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.MySQL.ConnMaxLifetime)

	// Проверка связи
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		app.Logger().Fatalf("БД недоступна: %v", err)
	}
	app.Logger().Info("Успешное подключение к MySQL Database")

	// 4. Простейший Health Check
	app.Get("/health", func(ctx iris.Context) {
		ctx.JSON(iris.Map{"status": "OK", "timestamp": time.Now().Format(time.RFC3339)})
	})

	// 5. Регистрация API Маршрутов (Будет расширяться слоем delivery/http/v1)
	apiV1 := app.Party("/api/v1")
	{
		apiV1.Get("/ping", func(ctx iris.Context) {
			ctx.WriteString("pong")
		})
	}

	// 6. Запуск сервера
	addr := ":" + cfg.HTTPServer.Port
	app.Logger().Infof("Сервер запускается на порту %s в режиме [%s]", cfg.HTTPServer.Port, cfg.Env)
	if err := app.Listen(addr); err != nil {
		app.Logger().Fatalf("Ошибка при старте сервера: %v", err)
	}
}
