package usecase

import (
	"appeals/apps/backend/internal/domain"
	"context"
	"crypto/rand"
	"encoding/base64"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// generateTempPassword создает криптографически случайный временный пароль
// для пользователей, заводимых администратором вручную.
func generateTempPassword() (string, error) {
	buf := make([]byte, 12)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

type AdminUsecase struct {
	repo domain.UserRepository
}

func NewAdminUsecase(repo domain.UserRepository) *AdminUsecase {
	return &AdminUsecase{repo: repo}
}

func (u *AdminUsecase) GetAllUsers(ctx context.Context) ([]domain.User, error) {
	return u.repo.FetchUsers(ctx)
}

// CreateUser заводит нового пользователя (сотрудника/админа) и генерирует ему
// временный пароль. Пароль возвращается открытым текстом ровно один раз —
// вызывающий код (хендлер) обязан передать его администратору и нигде не сохранять.
func (u *AdminUsecase) CreateUser(ctx context.Context, user *domain.User) (string, error) {
	user.CreatedAt = time.Now()

	tempPassword, err := generateTempPassword()
	if err != nil {
		return "", err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	user.PasswordHash = string(hashedPassword)

	if user.Status == "" {
		user.Status = domain.StatusActive
	}

	if err := u.repo.Create(ctx, user); err != nil {
		return "", err
	}
	return tempPassword, nil
}

func (u *AdminUsecase) UpdateUser(ctx context.Context, user *domain.User) error {
	// Здесь можно добавить валидацию ролей перед обновлением
	return u.repo.Update(ctx, user)
}

// DeactivateUser — мягкое удаление пользователя: физически строка (и ссылающаяся
// на нее история обращений) не удаляется, только блокируется вход.
func (u *AdminUsecase) DeactivateUser(ctx context.Context, id int) error {
	user, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	user.Status = domain.StatusBlocked
	return u.repo.Update(ctx, user)
}
