package domain

import "context"

type Department struct {
	ID   int    `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
}

type DepartmentRepository interface {
	GetAll(ctx context.Context) ([]Department, error)
	// Create добавляет новое ведомство в справочник
	Create(ctx context.Context, name string) (*Department, error)
	// Delete удаляет ведомство. Обращения, ссылавшиеся на него, не удаляются —
	// department_id по внешнему ключу (ON DELETE SET NULL) просто становится пустым.
	Delete(ctx context.Context, id int) error
}
