package repository

import (
	"context"
	"database/sql"
	"errors"

	"appeals/apps/backend/internal/domain"

	"github.com/jmoiron/sqlx"
)

type userRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) domain.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (full_name, email, password_hash, role, created_at)
		VALUES (?, ?, ?, ?, ?)
	`
	result, err := r.db.ExecContext(ctx, query, user.FullName, user.Email, user.PasswordHash, user.Role, user.CreatedAt)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	user.ID = int(id)
	return nil
}

func (r *userRepository) GetByID(ctx context.Context, id int) (*domain.User, error) {
	query := `SELECT id, full_name, email, password_hash, role, created_at FROM users WHERE id = ?`
	var user domain.User

	err := r.db.GetContext(ctx, &user, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("пользователь не найден")
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `SELECT id, full_name, email, password_hash, role, created_at FROM users WHERE email = ?`
	var user domain.User

	err := r.db.GetContext(ctx, &user, query, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("пользователь не найден")
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetEmployees(ctx context.Context) ([]domain.EmployeeRecord, error) {
	query := `SELECT id, full_name FROM users WHERE role = 'employee' ORDER BY full_name ASC`
	var employees []domain.EmployeeRecord

	err := r.db.SelectContext(ctx, &employees, query)
	if err != nil {
		return nil, err
	}
	return employees, nil
}
