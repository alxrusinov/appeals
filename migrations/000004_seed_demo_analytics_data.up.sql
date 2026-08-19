-- Эта миграция специально не переписывает 000002/000003 (уже применены на
-- существующих БД — golang-migrate помнит номер версии и не перезапустит их
-- повторно, даже если поменять содержимое файла), а доводит данные до нужного
-- состояния поверх того, что уже накатано.

-- 1. Ведомство для сотрудников, заведенных в 000002 (department_id тогда еще
--    не существовал как колонка — появился только в 000003_add_user_department).
--    Ведомства соответствуют тому, что было изначально проставлено вручную на их
--    обращениях в 000002 — теперь источник правды переехал на самого сотрудника.
UPDATE users
SET department_id = (SELECT id FROM departments WHERE name = 'Департамент ЖКХ и благоустройства')
WHERE email = 'employee@appeals.gov';

UPDATE users
SET department_id = (SELECT id FROM departments WHERE name = 'Комитет по транспорту и дорожному хозяйству')
WHERE email = 'petrova@appeals.gov';

-- 2. Третий сотрудник — единственное ведомство без единого сотрудника
--    (Министерство здравоохранения) иначе никогда не появится в разбивке
--    "по ведомствам" на графиках аналитики.
INSERT INTO
    users (full_name, email, password_hash, role, status, department_id, created_at)
VALUES
    (
        'Смирнова Ольга Дмитриевна',
        'smirnova@appeals.gov',
        '$2a$10$1RSakkJWULpMWJEI9DSyDOW.Jj1qD3nT6iPt71djjRKBJpgpew5HO', -- пароль: password
        'employee',
        'Активен',
        (SELECT id FROM departments WHERE name = 'Министерство здравоохранения'),
        NOW()
    );

-- 3. Пара дополнительных граждан-заявителей для разнообразия демо-данных.
INSERT INTO
    users (full_name, email, password_hash, role, status, created_at)
VALUES
    (
        'Морозова Татьяна Сергеевна',
        'morozova@mail.ru',
        '$2a$10$1RSakkJWULpMWJEI9DSyDOW.Jj1qD3nT6iPt71djjRKBJpgpew5HO',
        'citizen',
        'Активен',
        NOW()
    ),
    (
        'Волков Дмитрий Александрович',
        'volkov@mail.ru',
        '$2a$10$1RSakkJWULpMWJEI9DSyDOW.Jj1qD3nT6iPt71djjRKBJpgpew5HO',
        'citizen',
        'Активен',
        NOW()
    );

-- 4. Обращения на разных стадиях, ведомствах и датах — чтобы графики аналитики
--    (структура по статусам, нагрузка по ведомствам, доля просрочки) показывали
--    содержательную картину, а не 4 строки из 000002. citizen_id/assignee_id/
--    department_id находятся подзапросами по email/названию — так миграция не
--    завязана на конкретные числовые ID и безопасна вне зависимости от того,
--    что еще успело накопиться в таблице users на момент применения.
INSERT INTO
    appeals (
        title, description, status,
        citizen_id, assignee_id, department_id,
        created_at, deadline_at, executed_at, resolution
    )
VALUES
    -- Ведомство: ЖКХ (Иванов) — 3 обращения на разных стадиях
    (
        'Протекает крыша в подъезде',
        'После дождя в подъезде №2 течет крыша, вода доходит до электрощитка.',
        'in_work',
        (SELECT id FROM users WHERE email = 'citizen@mail.ru'),
        (SELECT id FROM users WHERE email = 'employee@appeals.gov'),
        (SELECT id FROM departments WHERE name = 'Департамент ЖКХ и благоустройства'),
        NOW() - INTERVAL 3 DAY, NOW() + INTERVAL 27 DAY, NULL, NULL
    ),
    (
        'Не убирают мусор во дворе',
        'Контейнерная площадка не очищалась больше двух недель, скопился мусор.',
        'done',
        (SELECT id FROM users WHERE email = 'kuznetsova@yandex.ru'),
        (SELECT id FROM users WHERE email = 'employee@appeals.gov'),
        (SELECT id FROM departments WHERE name = 'Департамент ЖКХ и благоустройства'),
        NOW() - INTERVAL 45 DAY, NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 20 DAY,
        'Заключен договор с новым подрядчиком на вывоз ТКО, площадка очищена.'
    ),
    (
        'Не работает освещение во дворе',
        'Уже три недели не горят фонари во дворе дома, вечером очень темно и небезопасно.',
        'in_work',
        (SELECT id FROM users WHERE email = 'morozova@mail.ru'),
        (SELECT id FROM users WHERE email = 'employee@appeals.gov'),
        (SELECT id FROM departments WHERE name = 'Департамент ЖКХ и благоустройства'),
        NOW() - INTERVAL 50 DAY, NOW() - INTERVAL 20 DAY, NULL, NULL -- дедлайн прошел -> просрочено
    ),

    -- Ведомство: Транспорт (Петрова) — 4 обращения
    (
        'Автобус систематически опаздывает',
        'Маршрут №12 регулярно опаздывает на 20-30 минут по будням в час пик.',
        'in_work',
        (SELECT id FROM users WHERE email = 'citizen@mail.ru'),
        (SELECT id FROM users WHERE email = 'petrova@appeals.gov'),
        (SELECT id FROM departments WHERE name = 'Комитет по транспорту и дорожному хозяйству'),
        NOW() - INTERVAL 5 DAY, NOW() + INTERVAL 25 DAY, NULL, NULL
    ),
    (
        'Отсутствует пешеходный переход',
        'У школы №34 нет разметки пешеходного перехода, дети переходят оживленную дорогу.',
        'done',
        (SELECT id FROM users WHERE email = 'volkov@mail.ru'),
        (SELECT id FROM users WHERE email = 'petrova@appeals.gov'),
        (SELECT id FROM departments WHERE name = 'Комитет по транспорту и дорожному хозяйству'),
        NOW() - INTERVAL 60 DAY, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 35 DAY,
        'Нанесена дорожная разметка, установлен знак "Пешеходный переход".'
    ),
    (
        'Яма на проезжей части',
        'Глубокая яма на пересечении ул. Мира и пр. Победы, риск повреждения подвески.',
        'in_work',
        (SELECT id FROM users WHERE email = 'kuznetsova@yandex.ru'),
        (SELECT id FROM users WHERE email = 'petrova@appeals.gov'),
        (SELECT id FROM departments WHERE name = 'Комитет по транспорту и дорожному хозяйству'),
        NOW() - INTERVAL 40 DAY, NOW() - INTERVAL 10 DAY, NULL, NULL -- просрочено
    ),
    (
        'Не работает светофор',
        'На перекрестке ул. Советской и ул. Гагарина второй день не работает светофор.',
        'done',
        (SELECT id FROM users WHERE email = 'morozova@mail.ru'),
        (SELECT id FROM users WHERE email = 'petrova@appeals.gov'),
        (SELECT id FROM departments WHERE name = 'Комитет по транспорту и дорожному хозяйству'),
        NOW() - INTERVAL 15 DAY, NOW() + INTERVAL 15 DAY, NOW() - INTERVAL 2 DAY,
        'Выездная бригада заменила контроллер светофора, движение восстановлено.'
    ),

    -- Ведомство: Здравоохранение (Смирнова) — 4 обращения
    (
        'Долгая запись к терапевту',
        'Ближайшая свободная запись к терапевту в поликлинике №3 — только через месяц.',
        'in_work',
        (SELECT id FROM users WHERE email = 'citizen@mail.ru'),
        (SELECT id FROM users WHERE email = 'smirnova@appeals.gov'),
        (SELECT id FROM departments WHERE name = 'Министерство здравоохранения'),
        NOW() - INTERVAL 2 DAY, NOW() + INTERVAL 28 DAY, NULL, NULL
    ),
    (
        'Отсутствие пандуса в поликлинике',
        'В поликлинике №7 нет пандуса для маломобильных пациентов, только высокое крыльцо.',
        'in_work',
        (SELECT id FROM users WHERE email = 'volkov@mail.ru'),
        (SELECT id FROM users WHERE email = 'smirnova@appeals.gov'),
        (SELECT id FROM departments WHERE name = 'Министерство здравоохранения'),
        NOW() - INTERVAL 33 DAY, NOW() - INTERVAL 3 DAY, NULL, NULL -- просрочено
    ),
    (
        'Жалоба на очередь в регистратуру',
        'Очередь в регистратуру поликлиники №3 растягивается на 1.5-2 часа с самого утра.',
        'done',
        (SELECT id FROM users WHERE email = 'kuznetsova@yandex.ru'),
        (SELECT id FROM users WHERE email = 'smirnova@appeals.gov'),
        (SELECT id FROM departments WHERE name = 'Министерство здравоохранения'),
        NOW() - INTERVAL 20 DAY, NOW() + INTERVAL 10 DAY, NOW() - INTERVAL 1 DAY,
        'Открыто дополнительное окно электронной регистратуры, среднее время ожидания снижено.'
    ),
    (
        'Нехватка талонов на УЗИ',
        'Талоны на плановое УЗИ в поликлинике №3 заканчиваются в первые минуты после открытия записи.',
        'in_work',
        (SELECT id FROM users WHERE email = 'morozova@mail.ru'),
        (SELECT id FROM users WHERE email = 'smirnova@appeals.gov'),
        (SELECT id FROM departments WHERE name = 'Министерство здравоохранения'),
        NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 1 DAY, NULL, NULL -- недавно просрочено
    ),

    -- Свежее необработанное обращение — еще не назначено ни исполнителю, ни ведомству
    (
        'Бродячие собаки во дворе',
        'В районе детской площадки собралась стая бродячих собак, пугают детей.',
        'in_work',
        (SELECT id FROM users WHERE email = 'volkov@mail.ru'),
        NULL,
        NULL,
        NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 29 DAY, NULL, NULL
    );
