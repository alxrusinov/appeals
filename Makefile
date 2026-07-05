# Переменные для удобства (если изменятся имена сервисов)
DB_SERVICE = db
BACKEND_SERVICE = backend
FRONTEND_SERVICE = frontend

.PHONY: help up down restart build logs clean ps status

# Команда по умолчанию (если просто ввести `make` в консоли)
help:
	@echo "Доступные команды для управления деплоем:"
	@echo "  make up       - Собрать и запустить все контейнеры в фоне"
	@echo "  make down     - Остановить и удалить контейнеры"
	@echo "  make restart  - Перезапустить всю систему"
	@echo "  make build    - Принудительно пересобрать образы фронта и бэка без кэша"
	@echo "  make logs     - Показать логи всех сервисов в реальном времени"
	@echo "  make ps       - Показать статус запущенных контейнеров"
	@echo "  make clean    - Полная очистка: удалить контейнеры, сети и базу данных (volume)"

# Запуск проекта
up:
	docker compose up -d

# Остановка проекта
down:
	docker compose down

# Перезапуск системы
restart: down up

# Сборка образов с флагом --no-cache (полезно, чтобы сбросить старые слои уязвимостей)
build:
	docker compose build --no-cache

# Просмотр логов
logs:
	docker compose logs -f

# Просмотр статуса контейнеров
ps:
	docker compose ps

# Жесткая очистка (сброс базы данных к начальным демо-данным из сидов)
clean:
	docker compose down -v
