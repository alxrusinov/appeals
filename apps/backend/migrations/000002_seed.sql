-- Заполнение ведомств
INSERT INTO departments (id, name) VALUES
(1, 'Департамент ЖКХ и благоустройства'),
(2, 'Министерство здравоохранения'),
(3, 'Комитет по транспорту и дорожному хозяйству');

-- Заполнение пользователей (пароль у всех: password)
INSERT INTO users (id, full_name, email, password_hash, role, created_at) VALUES
-- Сотрудники (Исполнители)
(1, 'Иванов Сергей Петрович', 'ivanov@appeals.gov', '$2a$10$ByI5qFRLbBc6UvB1TGBF5.d8/6tB1E3gXqW/0t29p.k3Y3hG3g2sK', 'employee', NOW()),
(2, 'Петрова Анна Владимировна', 'petrova@appeals.gov', '$2a$10$ByI5qFRLbBc6UvB1TGBF5.d8/6tB1E3gXqW/0t29p.k3Y3hG3g2sK', 'employee', NOW()),

-- Граждане (Заявители)
(3, 'Сидоров Алексей Николаевич', 'sidorov@mail.ru', '$2a$10$ByI5qFRLbBc6UvB1TGBF5.d8/6tB1E3gXqW/0t29p.k3Y3hG3g2sK', 'citizen', NOW()),
(4, 'Кузнецова Елена Игоревна', 'kuznetsova@yandex.ru', '$2a$10$ByI5qFRLbBc6UvB1TGBF5.d8/6tB1E3gXqW/0t29p.k3Y3hG3g2sK', 'citizen', NOW());

-- Заполнение обращений
INSERT INTO appeals (title, description, status, citizen_id, assignee_id, department_id, created_at, deadline_at, executed_at, resolution) VALUES
-- 1. Новое обращение в работе (ЖКХ), дедлайн еще не наступил
(
    'Яма во дворе дома',
    'Прошу устранить глубокую яму во дворе по адресу ул. Ленина, д. 12. Повреждаются автомобили.',
    'in_work', 3, 1, 1,
    NOW() - INTERVAL 2 DAY,
    NOW() + INTERVAL 28 DAY,
    NULL, NULL
),

-- 2. Успешно решенное обращение (Транспорт) с текстом ответа
(
    'Не работает валидатор в автобусе',
    'В автобусе маршрута №45 не работают терминалы оплаты картой. Кондуктор требовал наличные.',
    'done', 3, 2, 3,
    NOW() - INTERVAL 10 DAY,
    NOW() + INTERVAL 20 DAY,
    NOW() - INTERVAL 1 DAY,
    'Проверка проведена. Перевозчику вынесено предупреждение, оборудование заменено на исправное.'
),

-- 3. 🎓 ПРОСРОЧЕННОЕ ОБРАЩЕНИЕ (Специальный кейс для проверки бизнес-логики!)
-- В базе данных статус числится как 'in_work', но так как дедлайн был 5 дней назад,
-- метод ComputeDynamicStatus() на бэкенде подсветит его как 'overdue'.
(
    'Жалоба на качество горячей воды',
    'Из крана горячей воды течет ржавая вода уже неделю. Прошу провести проверку бойлерной.',
    'in_work', 4, 1, 1,
    NOW() - INTERVAL 35 DAY,
    NOW() - INTERVAL 5 DAY,
    NULL, NULL
),

-- 4. Новое обращение, на которое еще не назначен исполнитель и ведомство
(
    'Шумные строительные работы ночью',
    'Рядом с жилым домом ведется стройка в ночное время (после 23:00). Грохот мешает спать.',
    'in_work', 4, NULL, NULL,
    NOW(),
    NOW() + INTERVAL 30 DAY,
    NULL, NULL
);
