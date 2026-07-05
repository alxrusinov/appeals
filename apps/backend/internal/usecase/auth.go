package usecase

import (
	"context"
	"errors"
	"log"
	"time"

	"appeals/apps/backend/internal/config"
	"appeals/apps/backend/internal/domain"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type authUsecase struct {
	userRepo domain.UserRepository
	cfg      *config.Config
}

func NewAuthUsecase(userRepo domain.UserRepository, cfg *config.Config) domain.AuthUsecase {
	return &authUsecase{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

func (u *authUsecase) Register(ctx context.Context, fullName, email, password string) error {
	// Проверяем, не занят ли email
	existingUser, _ := u.userRepo.GetByEmail(ctx, email)
	if existingUser != nil {
		return errors.New("пользователь с таким email уже существует")
	}

	// Хешируем пароль (Bcrypt)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := &domain.User{
		FullName:     fullName,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         domain.RoleCitizen, // По умолчанию всегда регистрируется гражданин
		CreatedAt:    time.Now(),
	}

	return u.userRepo.Create(ctx, user)
}

func (u *authUsecase) Login(ctx context.Context, email, password string) (string, string, *domain.User, error) {
	user, err := u.userRepo.GetByEmail(ctx, email)

	if err != nil {
		log.Printf("Ошибка поиска пользователя: %v", err)
		return "", "", nil, errors.New("неверный email или пароль")
	}
	log.Printf("[DEBUG] Введенный пароль из запроса: '%s' (длина: %d)", password, len(password))
	// Сверяем хеш пароля
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		log.Printf("[DEBUG] Пользователь из БД: ID=%d, Email=%s, Hash=%s", user.ID, user.Email, user.PasswordHash)
		return "", "", nil, errors.New("неверный email или пароль")
	}

	// Генерируем токены
	accessToken, err := u.generateToken(user.ID, string(user.Role), u.cfg.JWT.AccessTTL)
	if err != nil {
		return "", "", nil, err
	}

	refreshToken, err := u.generateToken(user.ID, string(user.Role), u.cfg.JWT.RefreshTTL)
	if err != nil {
		return "", "", nil, err
	}

	return accessToken, refreshToken, user, nil
}

func (u *authUsecase) GetProfile(ctx context.Context, userID int) (*domain.User, error) {
	return u.userRepo.GetByID(ctx, userID)
}

// Вспомогательный метод для сборки JWT
func (u *authUsecase) generateToken(userID int, role string, ttl time.Duration) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"exp":  time.Now().Add(ttl).Unix(),
		"iat":  time.Now().Unix(),
	})

	return token.SignedString([]byte(u.cfg.JWT.Secret))
}
