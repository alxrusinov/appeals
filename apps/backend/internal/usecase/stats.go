package usecase

import (
	"context"
	"math"
	"time"

	"appeals/apps/backend/internal/domain"
)

type statsUsecase struct {
	appealRepo domain.AppealRepository
}

func NewStatsUsecase(appealRepo domain.AppealRepository) domain.StatsUsecase {
	return &statsUsecase{
		appealRepo: appealRepo,
	}
}

// Срез счетчиков на текущую секунду для дашборда
func (u *statsUsecase) GetRealtime(ctx context.Context, actorID int, actorRole domain.UserRole) (*domain.RealtimeStats, error) {
	filter := domain.AppealFilter{Limit: 10000}
	// Сотрудник видит статистику только по обращениям, назначенным ему администратором
	// (см. domain.ErrForbidden в usecase/appeal.go — та же граница доступа)
	if actorRole == domain.RoleEmployee {
		filter.AssigneeID = actorID
	}

	appeals, err := u.appealRepo.Fetch(ctx, filter)
	if err != nil {
		return nil, err
	}

	domain.ApplyDynamicStatuses(appeals)

	stats := &domain.RealtimeStats{}
	for i := range appeals {
		if appeals[i].Status == domain.StatusInWork {
			stats.InWorkCount++
			stats.ActiveTotal++
		} else if appeals[i].Status == domain.StatusOverdue {
			stats.OverdueCount++
			stats.ActiveTotal++
		} else if appeals[i].Status == domain.StatusDone {
			stats.DoneCount++
		}
	}

	return stats, nil
}

// Историческая глубокая аналитика за период
func (u *statsUsecase) GetSummary(ctx context.Context, from, to time.Time, actorID int, actorRole domain.UserRole) (*domain.SummaryStats, error) {
	filter := domain.AppealFilter{
		CreatedFrom: from.Format(time.RFC3339),
		CreatedTo:   to.Format(time.RFC3339),
		Limit:       10000,
	}
	// Та же граница доступа, что и в GetRealtime/GetListForEmployee: сотрудник видит
	// аналитику только по своим обращениям, администратор — по всем.
	if actorRole == domain.RoleEmployee {
		filter.AssigneeID = actorID
	}

	// Фильтруем обращения по дате создания
	appeals, err := u.appealRepo.Fetch(ctx, filter)
	if err != nil {
		return nil, err
	}

	summary := &domain.SummaryStats{
		TotalCount: len(appeals),
		ByStatus: map[string]int{
			"in_work": 0,
			"done":    0,
			"overdue": 0,
		},
		ByAssignees:   []domain.AssigneeStat{},
		ByDepartments: []domain.DepartmentStat{},
	}

	if summary.TotalCount == 0 {
		return summary, nil
	}

	// Вспомогательные мапы для агрегации сотрудников и отделов
	assigneeMap := make(map[int]*domain.AssigneeStat)
	deptMap := make(map[int]*domain.DepartmentStat)

	overdueCount := 0

	domain.ApplyDynamicStatuses(appeals)

	for i := range appeals {
		statusStr := string(appeals[i].Status)
		summary.ByStatus[statusStr]++

		if appeals[i].Status == domain.StatusOverdue {
			overdueCount++
		}

		// Агрегируем по исполнителям (если исполнитель назначен)
		if appeals[i].AssigneeID != nil {
			aID := *appeals[i].AssigneeID
			name := "Неизвестный сотрудник"
			if appeals[i].AssigneeName != nil {
				name = *appeals[i].AssigneeName
			}

			if _, exists := assigneeMap[aID]; !exists {
				assigneeMap[aID] = &domain.AssigneeStat{ID: aID, Name: name}
			}
			assigneeMap[aID].Total++
			if appeals[i].Status == domain.StatusDone {
				assigneeMap[aID].Done++
			} else if appeals[i].Status == domain.StatusOverdue {
				assigneeMap[aID].Overdue++
			}
		}

		// Агрегируем по департаментам (если департамент назначен)
		if appeals[i].DepartmentID != nil {
			dID := *appeals[i].DepartmentID
			dName := "Без отдела"
			if appeals[i].DepartmentName != nil {
				dName = *appeals[i].DepartmentName
			}

			if _, exists := deptMap[dID]; !exists {
				deptMap[dID] = &domain.DepartmentStat{ID: dID, Name: dName}
			}
			deptMap[dID].Total++
			if appeals[i].Status == domain.StatusDone {
				deptMap[dID].Done++
			} else if appeals[i].Status == domain.StatusOverdue {
				deptMap[dID].Overdue++
			}
		}
	}

	// Рассчитываем процент просрочки до сотых долей
	ratio := (float64(overdueCount) / float64(summary.TotalCount)) * 100
	summary.OverdueRatio = math.Round(ratio*100) / 100

	// Сливаем мапы в итоговые срезы JSON-ответа
	for _, stat := range assigneeMap {
		summary.ByAssignees = append(summary.ByAssignees, *stat)
	}
	for _, stat := range deptMap {
		summary.ByDepartments = append(summary.ByDepartments, *stat)
	}

	return summary, nil
}
