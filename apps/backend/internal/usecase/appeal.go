package usecase

import (
	"context"
	"time"

	"appeals/apps/backend/internal/domain"
)

type appealUsecase struct {
	appealRepo domain.AppealRepository
}

func NewAppealUsecase(appealRepo domain.AppealRepository) domain.AppealUsecase {
	return &appealUsecase{
		appealRepo: appealRepo,
	}
}

// Создание обращения гражданином из Личного Кабинета
func (u *appealUsecase) CreateByCitizen(ctx context.Context, citizenID int, title, description string) (*domain.Appeal, error) {
	now := time.Now()
	// По регламенту на обработку обращения дается ровно 30 дней
	deadline := now.AddDate(0, 0, 30)

	appeal := &domain.Appeal{
		Title:        title,
		Description:  description,
		Status:       domain.StatusInWork, // Дефолтный статус
		CitizenID:    citizenID,
		AssigneeID:   nil, // Исполнитель изначально пуст
		DepartmentID: nil, // Отдел изначально пуст
		CreatedAt:    now,
		DeadlineAt:   deadline,
	}

	if err := u.appealRepo.Create(ctx, appeal); err != nil {
		return nil, err
	}

	return appeal, nil
}

// Создание обращения сотрудником (например, по звонку или на личном приеме)
func (u *appealUsecase) CreateByEmployee(ctx context.Context, title, description string, citizenID, assigneeID int, deadlineAt time.Time) (*domain.Appeal, error) {
	appeal := &domain.Appeal{
		Title:       title,
		Description: description,
		Status:      domain.StatusInWork,
		CitizenID:   citizenID,
		AssigneeID:  &assigneeID,
		CreatedAt:   time.Now(),
		DeadlineAt:  deadlineAt,
	}

	if err := u.appealRepo.Create(ctx, appeal); err != nil {
		return nil, err
	}

	return appeal, nil
}

// Получение списка обращений для панели мониторинга сотрудников
func (u *appealUsecase) GetListForEmployee(ctx context.Context, filter domain.AppealFilter) ([]domain.Appeal, error) {
	appeals, err := u.appealRepo.Fetch(ctx, filter)
	if err != nil {
		return nil, err
	}

	// 🎓 Изюминка диплома: Пересчитываем статус на лету перед передачей в контроллер
	domain.ApplyDynamicStatuses(appeals)

	return appeals, nil
}

// Получение изолированного списка обращений гражданина
func (u *appealUsecase) GetListForCitizen(ctx context.Context, citizenID int) ([]domain.Appeal, error) {
	appeals, err := u.appealRepo.FetchByCitizenID(ctx, citizenID)
	if err != nil {
		return nil, err
	}

	// Пересчитываем статусы для ЛК
	domain.ApplyDynamicStatuses(appeals)

	return appeals, nil
}

// Изменение статуса, назначение ответственного или закрытие обращения.
// Назначать/переназначать исполнителя (assigneeID) может только администратор;
// сотрудник может менять только те обращения, что назначены лично ему.
func (u *appealUsecase) UpdateStatus(ctx context.Context, id int, status domain.AppealStatus, assigneeID *int, resolution string, actorID int, actorRole domain.UserRole) error {
	appeal, err := u.appealRepo.GetByID(ctx, id)
	if err != nil {
		return domain.ErrAppealNotFound
	}

	if actorRole != domain.RoleAdmin {
		if assigneeID != nil {
			return domain.ErrForbidden
		}
		if appeal.AssigneeID == nil || *appeal.AssigneeID != actorID {
			return domain.ErrForbidden
		}
	}

	if assigneeID != nil {
		if *assigneeID == 0 {
			// 0 — явная просьба снять исполнителя (JSON null неотличим от "поле не передано",
			// поэтому используем 0 как отдельный сигнал очистки; реальные ID начинаются с 1)
			appeal.AssigneeID = nil
		} else {
			appeal.AssigneeID = assigneeID
		}
	}

	appeal.Status = status

	// Если статус меняется на "done" (Решено) — фиксируем время выполнения и текст ответа
	if status == domain.StatusDone {
		now := time.Now()
		appeal.ExecutedAt = &now
		if resolution != "" {
			appeal.Resolution = &resolution
		}
	}

	return u.appealRepo.Update(ctx, appeal)
}
