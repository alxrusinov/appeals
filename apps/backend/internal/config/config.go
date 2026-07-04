package config

import (
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/ilyakaznacheev/cleanenv"
)

// Config описывает всю конфигурацию Go-бэкенда
type Config struct {
	Env        string     `yaml:"env" env:"APP_ENV" env-default:"development"`
	HTTPServer HTTPServer `yaml:"http_server"`
	MySQL      MySQL      `yaml:"mysql"`
	JWT        JWT        `yaml:"jwt"`
}

// HTTPServer содержит настройки Iris-сервера
type HTTPServer struct {
	Port           string        `yaml:"port" env:"HTTP_PORT" env-default:"8080"`
	Timeout        time.Duration `yaml:"timeout" env:"HTTP_TIMEOUT" env-default:"5s"`
	IdleTimeout    time.Duration `yaml:"idle_timeout" env:"HTTP_IDLE_TIMEOUT" env-default:"60s"`
	MaxHeaderBytes int           `yaml:"max_header_bytes" env:"HTTP_MAX_HEADER_BYTES" env-default:"1048576"` // 1 MB
}

// MySQL содержит параметры подключения к базе данных
type MySQL struct {
	Host            string        `yaml:"host" env:"DB_HOST" env-default:"localhost"`
	Port            string        `yaml:"port" env:"DB_PORT" env-default:"3306"`
	User            string        `yaml:"user" env:"DB_USER" env-default:"root"`
	Password        string        `yaml:"password" env:"DB_PASSWORD" env-default:""`
	Name            string        `yaml:"name" env:"DB_NAME" env-default:"appeals_db"`
	MaxOpenConns    int           `yaml:"max_open_conns" env:"DB_MAX_OPEN_CONNS" env-default:"25"`
	MaxIdleConns    int           `yaml:"max_idle_conns" env:"DB_MAX_IDLE_CONNS" env-default:"25"`
	ConnMaxLifetime time.Duration `yaml:"conn_max_lifetime" env:"DB_CONN_MAX_LIFETIME" env-default:"5m"`
}

// JWT хранит секреты и время жизни токенов для авторизации
type JWT struct {
	// env-required:"true" принудительно уронит приложение при старте, если секрет не задан
	Secret     string        `yaml:"secret" env:"JWT_SECRET" env-required:"true"`
	AccessTTL  time.Duration `yaml:"access_ttl" env:"JWT_ACCESS_TTL" env-default:"15m"`
	RefreshTTL time.Duration `yaml:"refresh_ttl" env:"JWT_REFRESH_TTL" env-default:"720h"` // 30 дней
}

var (
	cfg  *Config
	once sync.Once
)

// MustLoad инициализирует синглтон конфигурации.
// Если конфигурация невалидна или отсутствует обязательное поле — приложение завершает работу (panic/fatal).
func MustLoad() *Config {
	once.Do(func() {
		cfg = &Config{}

		// 1. Проверяем локальный файл .env (удобно для локальной разработки)
		if _, err := os.Stat(".env"); err == nil {
			if err := cleanenv.ReadConfig(".env", cfg); err != nil {
				log.Fatalf("Критическая ошибка при чтении файла .env: %v", err)
			}
			return
		}

		// 2. Если файла .env нет, читаем переменные окружения напрямую (актуально для Docker / K8s / Production)
		if err := cleanenv.ReadEnv(cfg); err != nil {
			log.Fatalf("Критическая ошибка при чтении переменных окружения: %v", err)
		}
	})

	return cfg
}

// DSN (Data Source Name) генерирует строку подключения, совместимую с драйвером go-sql-driver/mysql
func (m MySQL) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&loc=Local",
		m.User, m.Password, m.Host, m.Port, m.Name)
}
