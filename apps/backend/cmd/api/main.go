package main

import (
	"context"
	"time"

	"appeals/apps/backend/internal/config"
	v1 "appeals/apps/backend/internal/delivery/http/v1"

	// 👑 Обязательно добавьте импорты ваших слоев репозиториев и юзкейсов.
	// Замените пути ниже на реальные, если они называются иначе (например, internal/usecase/auth)
	"appeals/apps/backend/internal/repository"
	"appeals/apps/backend/internal/usecase"

	_ "github.com/go-sql-driver/mysql"
	"github.com/iris-contrib/middleware/cors"
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

	crs := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost", "http://localhost:80"},
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		// AllowedHeaders:   []string{"Content-Type", "Authorization", "Accept", "X-Requested-With"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
		Debug:            true,
	})

	// Настройка глобального промежуточного ПО (Middleware)
	app.UseRouter(recover.New())
	app.UseRouter(logger.New())
	app.UseRouter(crs)

	// 3. Подключение к Базе Данных (MySQL)
	db, err := sqlx.Connect("mysql", cfg.MySQL.DSN())
	if err != nil {
		app.Logger().Fatalf("Ошибка подключения к БД: %v", err)
	}
	defer db.Close()

	db.SetMaxOpenConns(cfg.MySQL.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MySQL.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.MySQL.ConnMaxLifetime)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		app.Logger().Fatalf("БД недоступна: %v", err)
	}
	app.Logger().Info("Успешное подключение к MySQL Database")

	// 4. Глобальный Health Check
	app.Get("/health", func(ctx iris.Context) {
		ctx.JSON(iris.Map{"status": "OK", "timestamp": time.Now().Format(time.RFC3339)})
	})

	// =========================================================================
	// 5. 🛠️ ИНИЦИАЛИЗАЦИЯ СЛОЕВ АРХИТЕКТУРЫ (Dependency Injection)
	// =========================================================================

	// Шаг 5.1: Инициализируем репозитории (Data Access Layer)
	userRepo := repository.NewUserRepository(db)
	deptRepo := repository.NewDepartmentRepository(db)
	appealRepo := repository.NewAppealRepository(db) // Слой работы с обращениями в БД

	// Шаг 5.2: Инициализируем бизнес-логику (Business Logic / Usecases)
	// Передаем им зависимости в виде созданных выше репозиториев
	authUC := usecase.NewAuthUsecase(userRepo, cfg)
	appealUC := usecase.NewAppealUsecase(appealRepo)
	statsUC := usecase.NewStatsUsecase(appealRepo)

	// Шаг 5.3: Создаем главный Хэндлер и связываем все маршруты
	handler := v1.NewHandler(authUC, appealUC, statsUC, userRepo, deptRepo, cfg)

	// Передаем APIContainer от нашего приложения в метод InitRoutes,
	// который автоматически развернет дерево путей (/api/v1/auth, /api/v1/appeals и т.д.)
	handler.InitRoutes(app)

	// =========================================================================
	// 6. ЗАПУСК СЕРВЕРА
	// =========================================================================
	addr := ":" + cfg.HTTPServer.Port
	app.Logger().Infof("Сервер запускается на порту %s в режиме [%s]", cfg.HTTPServer.Port, cfg.Env)
	if err := app.Listen(addr); err != nil {
		app.Logger().Fatalf("Ошибка при старте сервера: %v", err)
	}
}
