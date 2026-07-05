-- 1. Таблица ведомств / отделов
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Таблица пользователей (граждане + сотрудники)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'citizen' или 'employee'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Индекс для быстрой выборки только сотрудников в справочниках
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Таблица обращений граждан
CREATE TABLE IF NOT EXISTS appeals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'in_work', -- 'in_work', 'done'
    citizen_id INT NOT NULL,
    assignee_id INT NULL,
    department_id INT NULL,
    created_at TIMESTAMP NOT NULL,
    deadline_at TIMESTAMP NOT NULL,
    executed_at TIMESTAMP NULL,
    resolution TEXT NULL,

    -- Связи между таблицами (Внешние ключи)
    CONSTRAINT fk_appeals_citizen FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_appeals_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_appeals_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,

    -- 🎓 Индексы для оптимизации поиска и фильтрации в панели сотрудников
    INDEX idx_appeals_status (status),
    INDEX idx_appeals_created (created_at),
    INDEX idx_appeals_deadline (deadline_at),
    INDEX idx_appeals_citizen (citizen_id),
    INDEX idx_appeals_assignee (assignee_id),
    INDEX idx_appeals_dept (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
