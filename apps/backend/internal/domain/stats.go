package domain

import (
	"context"
	"time"
)

// Срез реального времени (для счетчиков верхнего уровня)
type RealtimeStats struct {
	ActiveTotal  int `json:"active_total"`
	InWorkCount  int `json:"in_work_count"`
	OverdueCount int `json:"overdue_count"`
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
	GetRealtime(ctx context.Context) (*RealtimeStats, error)
	GetSummary(ctx context.Context, from, to time.Time) (*SummaryStats, error)
}
