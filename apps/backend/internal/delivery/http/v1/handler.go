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
		admin.Delete("/users/{id:int}", h.deleteUser)

		// Статистика (которую вы вызывали в коде как /admin/stats)
		admin.Get("/stats", h.getStatsSummary)

		// Ведомства/отделы — справочник читают все авторизованные (dictionary.go),
		// а добавлять/удалять записи может только администратор
		admin.Post("/departments", h.createDepartment)
		admin.Delete("/departments/{id:int}", h.deleteDepartment)
	}

	// Эндпоинты ГРАЖДАН (Личный кабинет)
	citizenAppeals := protected.Party("/citizen/appeals")
	citizenAppeals.Use(middleware.RoleMiddleware(domain.RoleCitizen))
	{
		citizenAppeals.Get("/", h.getCitizenAppeals)
		citizenAppeals.Post("/", h.createCitizenAppeal)
	}

	// Эндпоинты СОТРУДНИКОВ (Панель мониторинга).
	// Сотрудник видит и правит только обращения, назначенные ему администратором
	// (проверяется внутри getEmployeeAppeals/updateAppealStatus); полный доступ
	// и право назначать/переназначать исполнителя — только у администратора.
	employeeAppeals := protected.Party("/appeals")
	employeeAppeals.Use(middleware.RoleMiddleware(domain.RoleEmployee, domain.RoleAdmin))
	{
		employeeAppeals.Get("/", h.getEmployeeAppeals)
		// Ручное создание обращения с назначением исполнителя — только администратор
		employeeAppeals.Post("/", middleware.RoleMiddleware(domain.RoleAdmin), h.createEmployeeAppeal)
		employeeAppeals.Patch("/{id:int}", h.updateAppealStatus)
	}

	// Модуль статистики (Только сотрудники/админы)
	stats := protected.Party("/stats")
	stats.Use(middleware.RoleMiddleware(domain.RoleEmployee, domain.RoleAdmin))
	{
		stats.Get("/summary", h.getStatsSummary)
		stats.Get("/realtime", h.getStatsRealtime)
	}

	// Справочники (Доступны авторизованным сотрудникам для селектов)
	protected.Get("/users/employees", h.getEmployeesDictionary)
	protected.Get("/departments", h.getDepartmentsDictionary)
}
