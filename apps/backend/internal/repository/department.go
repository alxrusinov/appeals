package repository

import (
	"context"

	"appeals/apps/backend/internal/domain"

	"github.com/jmoiron/sqlx"
)

type departmentRepository struct {
	db *sqlx.DB
}

func NewDepartmentRepository(db *sqlx.DB) domain.DepartmentRepository {
	return &departmentRepository{db: db}
}

func (r *departmentRepository) GetAll(ctx context.Context) ([]domain.Department, error) {
	query := `SELECT id, name FROM departments ORDER BY name ASC`
	var departments []domain.Department

	err := r.db.SelectContext(ctx, &departments, query)
	if err != nil {
		return nil, err
	}
	return departments, nil
}
