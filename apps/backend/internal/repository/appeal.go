package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"appeals/apps/backend/internal/domain"

	"github.com/jmoiron/sqlx"
)

type appealRepository struct {
	db *sqlx.DB
}

func NewAppealRepository(db *sqlx.DB) domain.AppealRepository {
	return &appealRepository{db: db}
}

func (r *appealRepository) Create(ctx context.Context, appeal *domain.Appeal) error {
	query := `
		INSERT INTO appeals (title, description, status, citizen_id, assignee_id, department_id, created_at, deadline_at, executed_at, resolution)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	result, err := r.db.ExecContext(ctx, query,
		appeal.Title, appeal.Description, appeal.Status, appeal.CitizenID,
		appeal.AssigneeID, appeal.DepartmentID, appeal.CreatedAt, appeal.DeadlineAt,
		appeal.ExecutedAt, appeal.Resolution,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	appeal.ID = int(id)
	return nil
}

func (r *appealRepository) GetByID(ctx context.Context, id int) (*domain.Appeal, error) {
	query := `
		SELECT
			a.*,
			d.name as department_name,
			u.full_name as assignee_name
		FROM appeals a
		LEFT JOIN departments d ON a.department_id = d.id
		LEFT JOIN users u ON a.assignee_id = u.id
		WHERE a.id = ?
	`
	var appeal domain.Appeal
	err := r.db.GetContext(ctx, &appeal, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("обращение не найдено")
		}
		return nil, err
	}
	return &appeal, nil
}

func (r *appealRepository) FetchByCitizenID(ctx context.Context, citizenID int) ([]domain.Appeal, error) {
	query := `
		SELECT
			a.*,
			d.name as department_name,
			u.full_name as assignee_name
		FROM appeals a
		LEFT JOIN departments d ON a.department_id = d.id
		LEFT JOIN users u ON a.assignee_id = u.id
		WHERE a.citizen_id = ?
		ORDER BY a.created_at DESC
	`
	var appeals []domain.Appeal
	err := r.db.SelectContext(ctx, &appeals, query, citizenID)
	if err != nil {
		return nil, err
	}
	return appeals, nil
}

// Fetch формирует гибкую выборку с фильтрацией и пагинацией для сотрудников
func (r *appealRepository) Fetch(ctx context.Context, filter domain.AppealFilter) ([]domain.Appeal, error) {
	var args []interface{}
	var conditions []string

	// Базовый запрос с JOIN-ами для получения читаемых имен вместо пустых ID
	baseQuery := `
		SELECT
			a.*,
			d.name as department_name,
			u.full_name as assignee_name
		FROM appeals a
		LEFT JOIN departments d ON a.department_id = d.id
		LEFT JOIN users u ON a.assignee_id = u.id
	`

	// 1. Полнотекстовый поиск по теме обращения
	if filter.Search != "" {
		conditions = append(conditions, "a.title LIKE ?")
		args = append(args, "%"+filter.Search+"%")
	}

	// 2. 🎓 Умная фильтрация по динамическому статусу Overdue
	if filter.Status != "" {
		if filter.Status == string(domain.StatusOverdue) {
			conditions = append(conditions, "a.status = 'in_work' AND NOW() > a.deadline_at")
		} else if filter.Status == string(domain.StatusInWork) {
			conditions = append(conditions, "a.status = 'in_work' AND NOW() <= a.deadline_at")
		} else {
			conditions = append(conditions, "a.status = ?")
			args = append(args, filter.Status)
		}
	}

	// 3. Фильтрация по периодам поступления и исполнения
	if filter.CreatedFrom != "" {
		conditions = append(conditions, "a.created_at >= ?")
		args = append(args, filter.CreatedFrom)
	}
	if filter.CreatedTo != "" {
		conditions = append(conditions, "a.created_at <= ?")
		args = append(args, filter.CreatedTo)
	}
	if filter.ExecutedFrom != "" {
		conditions = append(conditions, "a.executed_at >= ?")
		args = append(args, filter.ExecutedFrom)
	}
	if filter.ExecutedTo != "" {
		conditions = append(conditions, "a.executed_at <= ?")
		args = append(args, filter.ExecutedTo)
	}

	// 4. Фильтрация по внешним ключам (FK)
	if filter.AssigneeID > 0 {
		conditions = append(conditions, "a.assignee_id = ?")
		args = append(args, filter.AssigneeID)
	}
	if filter.DepartmentID > 0 {
		conditions = append(conditions, "a.department_id = ?")
		args = append(args, filter.DepartmentID)
	}

	// Собираем секцию WHERE
	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	// 5. Безопасная валидация сортировки (Защита от SQL-Injection через параметры ORDER BY)
	sortBy := "a.created_at" // Дефолт
	switch filter.SortBy {
	case "deadline_at":
		sortBy = "a.deadline_at"
	case "executed_at":
		sortBy = "a.executed_at"
	}

	order := "DESC"
	if strings.ToLower(filter.Order) == "asc" {
		order = "ASC"
	}
	baseQuery += fmt.Sprintf(" ORDER BY %s %s", sortBy, order)

	// 6. Пагинация
	if filter.Limit > 0 {
		baseQuery += " LIMIT ?"
		args = append(args, filter.Limit)

		if filter.Offset > 0 {
			baseQuery += " OFFSET ?"
			args = append(args, filter.Offset)
		}
	}

	var appeals []domain.Appeal
	err := r.db.SelectContext(ctx, &appeals, baseQuery, args...)
	if err != nil {
		return nil, err
	}
	return appeals, nil
}

func (r *appealRepository) Update(ctx context.Context, appeal *domain.Appeal) error {
	query := `
		UPDATE appeals
		SET title = ?, description = ?, status = ?, assignee_id = ?,
		    department_id = ?, deadline_at = ?, executed_at = ?, resolution = ?
		WHERE id = ?
	`
	_, err := r.db.ExecContext(ctx, query,
		appeal.Title, appeal.Description, appeal.Status, appeal.AssigneeID,
		appeal.DepartmentID, appeal.DeadlineAt, appeal.ExecutedAt, appeal.Resolution,
		appeal.ID,
	)
	return err
}
