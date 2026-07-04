package v1

import (
	"github.com/kataras/iris/v12"
)

// GET /api/v1/users/employees
// Возвращает список всех сотрудников ведомства для назначения их исполнителями
func (h *Handler) getEmployeesDictionary(ctx iris.Context) {
	employees, err := h.userRepo.GetEmployees(ctx.Request().Context())
	if err != nil {
		ctx.Application().Logger().Errorf("Ошибка получения справочника сотрудников: %v", err)
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.JSON(iris.Map{"error": "не удалось загрузить список сотрудников"})
		return
	}

	// Iris автоматически преобразует срез структур domain.EmployeeRecord в валидный JSON-массив
	ctx.JSON(employees)
}

// GET /api/v1/departments
// Возвращает список всех существующих отделов/департаментов для фильтрации
func (h *Handler) getDepartmentsDictionary(ctx iris.Context) {
	depts, err := h.deptRepo.GetAll(ctx.Request().Context())
	if err != nil {
		ctx.Application().Logger().Errorf("Ошибка получения справочника ведомств: %v", err)
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.JSON(iris.Map{"error": "не удалось загрузить список отделов"})
		return
	}

	ctx.JSON(depts)
}
