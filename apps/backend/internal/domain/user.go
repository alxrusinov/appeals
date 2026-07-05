package domain

import (
	"context"
	"time"
)

type UserRole string

const (
	RoleCitizen  UserRole = "citizen"
	RoleEmployee UserRole = "employee"
)

type User struct {
	ID           int       `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"` // Хеш пароля никогда не отдается в JSON
	FullName     string    `json:"full_name" db:"full_name"`
	Role         UserRole  `json:"role" db:"role"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// Реестр сотрудников (DTO для выпадающих списков)
type EmployeeRecord struct {
	ID       int    `json:"id" db:"id"`
	FullName string `json:"full_name" db:"full_name"`
}

// UserRepository — контракт для работы с БД (слой repository)
type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id int) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetEmployees(ctx context.Context) ([]EmployeeRecord, error)
}

// AuthUsecase — контракт для бизнес-логики (слой usecase)
type AuthUsecase interface {
	Register(ctx context.Context, fullName, email, password string) error
	Login(ctx context.Context, email, password string) (accessToken, refreshToken string, user *User, err error)
	GetProfile(ctx context.Context, userID int) (*User, error)
}
