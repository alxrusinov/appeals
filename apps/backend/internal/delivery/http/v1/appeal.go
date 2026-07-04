package v1

import (
	"time"

	"appeals/apps/backend/internal/domain"

	"github.com/kataras/iris/v12"
)

type citizenAppealInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type employeeAppealInput struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CitizenID   int       `json:"citizen_id"`
	AssigneeID  int       `json:"assignee_id"`
	DeadlineAt  time.Time `json:"deadline_at"`
}

type updateStatusInput struct {
	Status     string `json:"status"`
	AssigneeID *int   `json:"assignee_id"`
	Resolution string `json:"resolution"`
}

// ГРАЖДАНЕ: Получение личных обращений
func (h *Handler) getCitizenAppeals(ctx iris.Context) {
	citizenID := ctx.Values().GetDefault("user_id", 0).(int)
	appeals, err := h.appealUC.GetListForCitizen(ctx.Request().Context(), citizenID)
	if err != nil {
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.JSON(iris.Map{"error": err.Error()})
		return
	}
	ctx.JSON(appeals)
}

// ГРАЖДАНЕ: Подача заявления
func (h *Handler) createCitizenAppeal(ctx iris.Context) {
	citizenID := ctx.Values().GetDefault("user_id", 0).(int)
	var input citizenAppealInput
	if err := ctx.ReadJSON(&input); err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.JSON(iris.Map{"error": "невалидный JSON"})
		return
	}

	appeal, err := h.appealUC.CreateByCitizen(ctx.Request().Context(), citizenID, input.Title, input.Description)
	if err != nil {
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.JSON(iris.Map{"error": err.Error()})
		return
	}
	ctx.StatusCode(iris.StatusCreated)
	ctx.JSON(appeal)
}

// СОТРУДНИКИ: Вывод общей таблицы мониторинга (с фильтрами)
func (h *Handler) getEmployeeAppeals(ctx iris.Context) {
	filter := domain.AppealFilter{
		Search:       ctx.URLParam("search"),
		Status:       ctx.URLParam("status"),
		CreatedFrom:  ctx.URLParam("created_from"),
		CreatedTo:    ctx.URLParam("created_to"),
		ExecutedFrom: ctx.URLParam("executed_from"),
		ExecutedTo:   ctx.URLParam("executed_to"),
		AssigneeID:   ctx.URLParamIntDefault("assignee_id", 0),
		DepartmentID: ctx.URLParamIntDefault("department_id", 0),
		SortBy:       ctx.URLParamDefault("sort_by", "created_at"),
		Order:        ctx.URLParamDefault("order", "desc"),
		Limit:        ctx.URLParamIntDefault("limit", 20),
		Offset:       ctx.URLParamIntDefault("offset", 0),
	}

	appeals, err := h.appealUC.GetListForEmployee(ctx.Request().Context(), filter)
	if err != nil {
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.JSON(iris.Map{"error": err.Error()})
		return
	}
	ctx.JSON(appeals)
}

// СОТРУДНИКИ: Ручное добавление
func (h *Handler) createEmployeeAppeal(ctx iris.Context) {
	var input employeeAppealInput
	if err := ctx.ReadJSON(&input); err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.JSON(iris.Map{"error": "невалидный JSON"})
		return
	}

	appeal, err := h.appealUC.CreateByEmployee(ctx.Request().Context(), input.Title, input.Description, input.CitizenID, input.AssigneeID, input.DeadlineAt)
	if err != nil {
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.JSON(iris.Map{"error": err.Error()})
		return
	}
	ctx.StatusCode(iris.StatusCreated)
	ctx.JSON(appeal)
}

// СОТРУДНИКИ: Обновление статуса и закрытие (PATCH)
func (h *Handler) updateAppealStatus(ctx iris.Context) {
	id, err := ctx.Params().GetInt("id")
	if err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.JSON(iris.Map{"error": "невалидный ID обращения"})
		return
	}

	var input updateStatusInput
	if err := ctx.ReadJSON(&input); err != nil {
		ctx.StatusCode(iris.StatusBadRequest)
		ctx.JSON(iris.Map{"error": "невалидный JSON"})
		return
	}

	err = h.appealUC.UpdateStatus(ctx.Request().Context(), id, domain.AppealStatus(input.Status), input.AssigneeID, input.Resolution)
	if err != nil {
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.JSON(iris.Map{"error": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"status": "успешно обновлено"})
}
