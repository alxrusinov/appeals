package v1

import (
	"appeals/apps/backend/internal/config"
	"appeals/apps/backend/internal/delivery/http/middleware"
	"appeals/apps/backend/internal/domain"

	"github.com/kataras/iris/v12"
)

type Handler struct {
	authUC   domain.AuthUsecase
	appealUC domain.AppealUsecase
	statsUC  domain.StatsUsecase
	adminUC  domain.AdminUsecase
	userRepo domain.UserRepository
	deptRepo domain.DepartmentRepository
	cfg      *config.Config
}

func NewHandler(
	authUC domain.AuthUsecase,
	appealUC domain.AppealUsecase,
	statsUC domain.StatsUsecase,
	adminUC domain.AdminUsecase,
	userRepo domain.UserRepository,
	deptRepo domain.DepartmentRepository,
	cfg *config.Config,
) *Handler {
	return &Handler{
		authUC:   authUC,
		appealUC: appealUC,
		statsUC:  statsUC,
		adminUC:  adminUC,
		userRepo: userRepo,
		deptRepo: deptRepo,
		cfg:      cfg,
	}
}

// InitRoutes настраивает дерево путей в Iris
func (h *Handler) InitRoutes(api iris.Party) {
	v1 := api.Party("/api/v1")

	// Публичные маршруты аутентификации
	auth := v1.Party("/auth")
	{
		auth.Post("/register", h.register)
		auth.Post("/login", h.login)
		auth.Post("/logout", h.logout)
		auth.Get("/me", middleware.AuthMiddleware(h.cfg), h.me)
	}

	// Защищенная зона (требуется авторизация)
	protected := v1.Party("/")
	protected.Use(middleware.AuthMiddleware(h.cfg))

	// Модуль АДМИНИСТРАТОРА
	admin := protected.Party("/admin")
	// Предполагаем, что у вас есть RoleAdmin в domain.Role
	admin.Use(middleware.RoleMiddleware(domain.RoleAdmin))
	{
		// Пользователи
		admin.Get("/users", h.getUsers)
		admin.Post("/users", h.createUser)
		admin.Put("/users/{id:int}", h.updateUser)

		// Статистика (которую вы вызывали в коде как /admin/stats)
		admin.Get("/stats", h.getStatsSummary)
	}

	// Эндпоинты ГРАЖДАН (Личный кабинет)
	citizenAppeals := protected.Party("/citizen/appeals")
	citizenAppeals.Use(middleware.RoleMiddleware(domain.RoleCitizen))
	{
		citizenAppeals.Get("/", h.getCitizenAppeals)
		citizenAppeals.Post("/", h.createCitizenAppeal)
	}

	// Эндпоинты СОТРbackgroundУДНИКОВ (Панель мониторинга)
	employeeAppeals := protected.Party("/appeals")
	employeeAppeals.Use(middleware.RoleMiddleware(domain.RoleEmployee, domain.RoleAdmin))
	{
		employeeAppeals.Get("/", h.getEmployeeAppeals)
		employeeAppeals.Post("/", h.createEmployeeAppeal)
		employeeAppeals.Patch("/{id:int}", h.updateAppealStatus)
	}

	// Модуль статистики (Только сотрудники/админы)
	stats := protected.Party("/stats")
	employeeAppeals.Use(middleware.RoleMiddleware(domain.RoleEmployee, domain.RoleAdmin))
	{
		stats.Get("/summary", h.getStatsSummary)
		stats.Get("/realtime", h.getStatsRealtime)
	}

	// Справочники (Доступны авторизованным сотрудникам для селектов)
	protected.Get("/users/employees", h.getEmployeesDictionary)
	protected.Get("/departments", h.getDepartmentsDictionary)
}
