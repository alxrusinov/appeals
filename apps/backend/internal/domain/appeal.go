package domain

import (
	"context"
	"errors"
	"time"
)

var (
	ErrAppealNotFound = errors.New("обращение не найдено")
	// ErrForbidden — сотрудник пытается назначить/переназначить исполнителя
	// (это право только у администратора) либо изменить не назначенное ему обращение.
	ErrForbidden = errors.New("недостаточно прав для этого действия")
)

type AppealStatus string

const (
	StatusInWork  AppealStatus = "in_work"
	StatusDone    AppealStatus = "done"
	StatusOverdue AppealStatus = "overdue" // Вычисляется динамически
)

type Appeal struct {
	ID           int          `json:"id" db:"id"`
	Title        string       `json:"title" db:"title"`
	Description  string       `json:"description" db:"description"`
	Status       AppealStatus `json:"status" db:"status"`
	CitizenID    int          `json:"citizen_id" db:"citizen_id"`
	AssigneeID   *int         `json:"assignee_id,omitempty" db:"assignee_id"`
	DepartmentID *int         `json:"department_id,omitempty" db:"department_id"`
	CreatedAt    time.Time    `json:"created_at" db:"created_at"`
	DeadlineAt   time.Time    `json:"deadline_at" db:"deadline_at"`
	ExecutedAt   *time.Time   `json:"executed_at,omitempty" db:"executed_at"`

	// Поля для джойнов, необходимые фронтенду
	DepartmentName *string `json:"department_name,omitempty" db:"department_name"`
	AssigneeName   *string `json:"assignee_name,omitempty" db:"assignee_name"`
	Resolution     *string `json:"resolution,omitempty" db:"resolution"`
	AuthorName     *string `json:"author_name,omitempty" db:"author_name"`
}

// 🎓 Метод динамического расчета просрочки (бизнес-логика UseCase уровня)
// Защищает от расхождения данных, если статус в БД числится как 'in_work', но дедлайн прошел
func (a *Appeal) ComputeDynamicStatus() {
	if a.Status == StatusInWork && time.Now().After(a.DeadlineAt) {
		a.Status = StatusOverdue
	}
}

// ApplyDynamicStatuses пересчитывает динамический статус (см. ComputeDynamicStatus)
// для каждого обращения в срезе. Вынесено отдельно, чтобы не повторять один и тот же
// цикл в usecase-слое статистики и обращений.
func ApplyDynamicStatuses(appeals []Appeal) {
	for i := range appeals {
		appeals[i].ComputeDynamicStatus()
	}
}

// Фильтры для панели мониторинга сотрудника
type AppealFilter struct {
	Search       string
	Status       string
	CreatedFrom  string
	CreatedTo    string
	ExecutedFrom string
	ExecutedTo   string
	AssigneeID   int
	DepartmentID int
	SortBy       string // created_at, deadline_at, executed_at
	Order        string // asc, desc
	Limit        int
	Offset       int
}

type AppealRepository interface {
	Create(ctx context.Context, appeal *Appeal) error
	GetByID(ctx context.Context, id int) (*Appeal, error)
	Fetch(ctx context.Context, filter AppealFilter) ([]Appeal, error)
	FetchByCitizenID(ctx context.Context, citizenID int) ([]Appeal, error)
	Update(ctx context.Context, appeal *Appeal) error
}

type AppealUsecase interface {
	CreateByCitizen(ctx context.Context, citizenID int, title, description string) (*Appeal, error)
	CreateByEmployee(ctx context.Context, title, description string, citizenID, assigneeID int, deadlineAt time.Time) (*Appeal, error)
	GetListForEmployee(ctx context.Context, filter AppealFilter) ([]Appeal, error)
	GetListForCitizen(ctx context.Context, citizenID int) ([]Appeal, error)
	// UpdateStatus меняет статус/резолюцию (и, если actorRole == RoleAdmin, исполнителя).
	// actorID/actorRole — тот, кто выполняет запрос: сотруднику разрешено менять только
	// обращения, назначенные лично ему, и он не может задавать assigneeID (см. ErrForbidden).
	UpdateStatus(ctx context.Context, id int, status AppealStatus, assigneeID *int, resolution string, actorID int, actorRole UserRole) error
}
