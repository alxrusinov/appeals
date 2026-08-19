package domain

import (
	"context"
	"time"
)

type UserRole string

const (
	RoleCitizen  UserRole = "citizen"
	RoleEmployee UserRole = "employee"
	RoleAdmin    UserRole = "admin"
)

// Статусы учетной записи (поле users.status). "Заблокирован" используется как
// результат мягкого удаления — физически строка не удаляется, но вход запрещен.
const (
	StatusActive  = "Активен"
	StatusOnLeave = "В отпуске"
	StatusBlocked = "Заблокирован"
)

type User struct {
	ID           int       `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"` // Хеш пароля никогда не отдается в JSON
	FullName     string    `json:"name" db:"full_name"`
	Role         UserRole  `json:"role" db:"role"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	Status       string    `json:"status" db:"status"`
	// DepartmentID — ведомство сотрудника (задается администратором при создании/
	// редактировании учетной записи). При назначении сотрудника исполнителем на
	// обращение это значение автоматически переносится в Appeal.DepartmentID
	// (см. usecase/appeal.go), чтобы ведомство обращения не могло разойтись с
	// реальным ведомством того, кто его исполняет.
	DepartmentID *int `json:"department_id,omitempty" db:"department_id"`
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
	FetchUsers(ctx context.Context) ([]User, error)
	Update(ctx context.Context, user *User) error
	// UpdatePassword перезаписывает хеш пароля пользователя, не трогая остальные поля
	UpdatePassword(ctx context.Context, userID int, newPasswordHash string) error
}

// AuthUsecase — контракт для бизнес-логики (слой usecase)
type AuthUsecase interface {
	Register(ctx context.Context, fullName, email, password string) error
	Login(ctx context.Context, email, password string) (accessToken, refreshToken string, user *User, err error)
	GetProfile(ctx context.Context, userID int) (*User, error)
	// ChangePassword проверяет старый пароль и заменяет его на новый.
	// Актуально в том числе для пользователей, заведенных администратором с
	// временным паролем (см. AdminUsecase.CreateUser) — им нужно способ его сменить.
	ChangePassword(ctx context.Context, userID int, oldPassword, newPassword string) error
}

type AdminUsecase interface {
	GetAllUsers(ctx context.Context) ([]User, error)
	// CreateUser заводит пользователя и возвращает сгенерированный временный пароль
	CreateUser(ctx context.Context, user *User) (tempPassword string, err error)
	UpdateUser(ctx context.Context, user *User) error
	// DeactivateUser — мягкое удаление: переводит пользователя в статус StatusBlocked,
	// физически строка (и история его обращений) в БД не удаляется.
	DeactivateUser(ctx context.Context, id int) error
}
