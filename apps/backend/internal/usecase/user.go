package usecase

import (
	"appeals/apps/backend/internal/domain"
	"context"
	"time"
)

type AdminUsecase struct {
	repo domain.UserRepository
}

func NewAdminUsecase(repo domain.UserRepository) *AdminUsecase {
	return &AdminUsecase{repo: repo}
}

func (u *AdminUsecase) RelinkRepo(repo domain.UserRepository) {
	u.repo = repo
}

func (u *AdminUsecase) Relink(repo domain.UserRepository) {
	u.repo = repo
}

func (u *AdminUsecase) GetAllUsers(ctx context.Context) ([]domain.User, error) {
	return u.repo.FetchUsers(ctx)
}

func (u *AdminUsecase) CreateUser(ctx context.Context, user *domain.User) error {
	user.CreatedAt = time.Now()
	// В реальном проекте здесь должен быть bcrypt-хеш сгенерированного пароля
	// Для демонстрации ставим заглушку, так как поле NOT NULL
	user.PasswordHash = "$2a$10$FakeHashForDefaultPassword1234567890"

	if user.Status == "" {
		user.Status = "Активен"
	}
	return u.repo.Create(ctx, user)
}

func (u *AdminUsecase) UpdateUser(ctx context.Context, user *domain.User) error {
	// Здесь можно добавить валидацию ролей перед обновлением
	return u.repo.Update(ctx, user)
}

func (u *AdminUsecase) GetStatsSummary(ctx context.Context) ([]domain.StatRecord, error) {
	return u.repo.GetStatsSummary(ctx)
}
