package v1

import (
	"strings"

	"github.com/kataras/iris/v12"
)

type createDepartmentInput struct {
	Name string `json:"name"`
}

// GET /api/v1/users/employees
// Возвращает список всех сотрудников ведомства для назначения их исполнителями
func (h *Handler) getEmployeesDictionary(ctx iris.Context) {
	employees, err := h.userRepo.GetEmployees(ctx.Request().Context())
	if err != nil {
		ctx.Application().Logger().Errorf("Ошибка получения справочника сотрудников: %v", err)
		respondError(ctx, iris.StatusInternalServerError, "не удалось загрузить список сотрудников")
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
		respondError(ctx, iris.StatusInternalServerError, "не удалось загрузить список отделов")
		return
	}

	ctx.JSON(depts)
}

// POST /api/v1/admin/departments — добавление нового ведомства (только администратор)
func (h *Handler) createDepartment(ctx iris.Context) {
	var input createDepartmentInput
	if err := ctx.ReadJSON(&input); err != nil {
		respondError(ctx, iris.StatusBadRequest, "невалидный JSON")
		return
	}

	name := strings.TrimSpace(input.Name)
	if name == "" {
		respondError(ctx, iris.StatusBadRequest, "название ведомства не может быть пустым")
		return
	}

	dept, err := h.deptRepo.Create(ctx.Request().Context(), name)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			respondError(ctx, iris.StatusConflict, "ведомство с таким названием уже существует")
			return
		}
		respondError(ctx, iris.StatusInternalServerError, "не удалось добавить ведомство")
		return
	}

	ctx.StatusCode(iris.StatusCreated)
	ctx.JSON(dept)
}

// DELETE /api/v1/admin/departments/{id} — удаление ведомства из справочника
// (только администратор). Обращения, ссылавшиеся на него, не удаляются.
func (h *Handler) deleteDepartment(ctx iris.Context) {
	id, err := ctx.Params().GetInt("id")
	if err != nil {
		respondError(ctx, iris.StatusBadRequest, "невалидный ID ведомства")
		return
	}

	if err := h.deptRepo.Delete(ctx.Request().Context(), id); err != nil {
		respondError(ctx, iris.StatusInternalServerError, "не удалось удалить ведомство")
		return
	}

	ctx.JSON(iris.Map{"message": "ведомство удалено"})
}
