# ==========================================
# ЭТАП 1: Сборка бинарного файла
# ==========================================
FROM golang:1.26-alpine AS builder

RUN apk update && apk add --no-cache git ca-certificates tzdata

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/appeals-backend ./cmd/api/main.go

# ==========================================
# ЭТАП 2: Финальный минимальный образ для рантайма
# ==========================================
FROM alpine:3.20 AS runner

# Добавляем сертификаты безопасности и часовые пояса (критично для логики дедлайнов в СУБД)
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Копируем скомпилированный бинарник из предыдущего этапа сборщика
COPY --from=builder /app/appeals-backend .

# (Опционально) Если вы используете локальный .env файл, его можно скопировать,
# но на проде надежнее прокидывать переменные через docker-compose или K8s env.
# COPY --from=builder /app/.env .

# Открываем порт, который указан у нас в config (HTTP_PORT=8080)
EXPOSE 8080

# Запуск приложения
CMD ["./appeals-backend"]
