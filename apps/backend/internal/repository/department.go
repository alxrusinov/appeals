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

func (r *departmentRepository) Create(ctx context.Context, name string) (*domain.Department, error) {
	result, err := r.db.ExecContext(ctx, `INSERT INTO departments (name) VALUES (?)`, name)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &domain.Department{ID: int(id), Name: name}, nil
}

func (r *departmentRepository) Delete(ctx context.Context, id int) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM departments WHERE id = ?`, id)
	return err
}
