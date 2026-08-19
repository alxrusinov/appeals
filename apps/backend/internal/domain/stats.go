package domain

import (
	"context"
	"time"
)

// Срез реального времени (для счетчиков верхнего уровня). В отличие от SummaryStats
// не привязан к периоду создания обращения — считает по текущему состоянию всех
// (в рамках доступа actor'а) обращений на момент запроса.
type RealtimeStats struct {
	ActiveTotal  int `json:"active_total"`
	InWorkCount  int `json:"in_work_count"`
	OverdueCount int `json:"overdue_count"`
	DoneCount    int `json:"done_count"`
}

// Агрегированная статистика сотрудника
type AssigneeStat struct {
	ID      int    `json:"id" db:"id"`
	Name    string `json:"name" db:"name"`
	Total   int    `json:"total"`
	Done    int    `json:"done"`
	Overdue int    `json:"overdue"`
}

// Агрегированная статистика отдела
type DepartmentStat struct {
	ID      int    `json:"id" db:"id"`
	Name    string `json:"name" db:"name"`
	Total   int    `json:"total"`
	Done    int    `json:"done"`
	Overdue int    `json:"overdue"`
}

// Итоговый JSON-ответ исторической аналитики
type SummaryStats struct {
	TotalCount    int              `json:"total_count"`
	ByStatus      map[string]int   `json:"by_status"`
	OverdueRatio  float64          `json:"overdue_ratio"`
	ByAssignees   []AssigneeStat   `json:"by_assignees"`
	ByDepartments []DepartmentStat `json:"by_departments"`
}

type StatsUsecase interface {
	// actorID/actorRole — тот, кто запрашивает статистику: для сотрудника (RoleEmployee)
	// оба метода считают только по обращениям, назначенным лично ему (как и
	// GetListForEmployee), для администратора — по всем.
	GetRealtime(ctx context.Context, actorID int, actorRole UserRole) (*RealtimeStats, error)
	GetSummary(ctx context.Context, from, to time.Time, actorID int, actorRole UserRole) (*SummaryStats, error)
}
