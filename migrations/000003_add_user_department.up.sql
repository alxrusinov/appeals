-- Ведомство теперь атрибут сотрудника (задается один раз при заведении учетной
-- записи), а не независимое поле на обращении. При назначении исполнителя на
-- обращение бэкенд сам проставляет appeals.department_id по department_id
-- назначенного сотрудника — так appeals.department_id и "чье ведомство на
-- самом деле работает над обращением" никогда не могут разойтись.
ALTER TABLE users
    ADD COLUMN department_id INT NULL AFTER role,
    ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    ADD INDEX idx_users_department (department_id);
