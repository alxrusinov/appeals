package domain

import "context"

type Department struct {
	ID   int    `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
}

type DepartmentRepository interface {
	GetAll(ctx context.Context) ([]Department, error)
}
