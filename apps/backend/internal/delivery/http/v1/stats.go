package v1

import (
	"time"

	"github.com/kataras/iris/v12"
)

// GET /api/v1/stats/realtime
// Возвращает оперативный срез счетчиков (активные, в работе, просроченные) для дашборда
func (h *Handler) getStatsRealtime(ctx iris.Context) {
	// Передаем контекст запроса для поддержки отмены таймаутов
	stats, err := h.statsUC.GetRealtime(ctx.Request().Context(), getUserID(ctx), getUserRole(ctx))
	if err != nil {
		ctx.Application().Logger().Errorf("Ошибка получения realtime статистики: %v", err)
		respondError(ctx, iris.StatusInternalServerError, "не удалось собрать оперативную статистику")
		return
	}

	ctx.JSON(stats)
}

// GET /api/v1/stats/summary?from=2026-06-01&to=2026-07-01
// Возвращает историческую аналитику за указанный период с группировками
func (h *Handler) getStatsSummary(ctx iris.Context) {
	fromStr := ctx.URLParam("from")
	toStr := ctx.URLParam("to")

	var from, to time.Time
	var err error

	// 🎓 Изюминка для диплома: Безопасный парсинг дат с дефолтными значениями (Fallbacks)
	// Если фронтенд не передал даты или они кривые — бэкенд не падает, а берет последние 30 дней.
	if fromStr != "" {
		from, err = time.Parse(time.DateOnly, fromStr) // Формат "2006-01-02"
		if err != nil {
			respondError(ctx, iris.StatusBadRequest, "неверный формат параметра 'from'. Используйте YYYY-MM-DD")
			return
		}
	} else {
		// По умолчанию — 30 дней назад от текущего момента
		from = time.Now().AddDate(0, 0, -30)
	}

	if toStr != "" {
		to, err = time.Parse(time.DateOnly, toStr)
		if err != nil {
			respondError(ctx, iris.StatusBadRequest, "неверный формат параметра 'to'. Используйте YYYY-MM-DD")
			return
		}
		// Чтобы захватить весь последний день до конца суток (23:59:59), сдвигаем границу
		to = to.Add(24 * time.Hour).Add(-time.Second)
	} else {
		to = time.Now()
	}

	// Защита от логической ошибки "дата начала позже даты конца"
	if from.After(to) {
		respondError(ctx, iris.StatusBadRequest, "дата начала периода (from) не может быть позже даты окончания (to)")
		return
	}

	stats, err := h.statsUC.GetSummary(ctx.Request().Context(), from, to, getUserID(ctx), getUserRole(ctx))
	if err != nil {
		ctx.Application().Logger().Errorf("Ошибка расчета сводной статистики: %v", err)
		respondError(ctx, iris.StatusInternalServerError, "критическая ошибка при обработке аналитических данных")
		return
	}

	ctx.JSON(stats)
}
