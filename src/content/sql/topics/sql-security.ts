import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  note,
  warn,
  table,
  def,
  wrongRight,
  beforeAfter,
  annotated,
  steps,
  diagram,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const sqlSecurity: Topic = {
  id: "sql.sql-security",
  slug: "sql-security",
  domain: "sql",
  module: "production",
  title: "Безопасность SQL: инъекции, права, строковая защита",
  titleEn: "SQL Security: Injection, Privileges, Row-Level Security",
  summary:
    "Безопасность базы данных держится на трёх слоях: запросы, которые нельзя подменить вводом пользователя, права, которые выдают по принципу наименьших привилегий, и защита на уровне строк. Тема на замерах PostgreSQL 16.14: склейка строки `x' OR '1'='1` вернула все 3 строки против 0 у параметризованного запроса, а добавленная команда `DELETE FROM users` через склейку удалила все 3 строки (параметр оставил 3), параметры не допускают нескольких команд в одном запросе (`cannot insert multiple commands into a prepared statement`); динамический SQL в функции с `||` выполнил вредный ввод `tmp_cache; DELETE FROM secrets` и опустошил обе таблицы, а `format('%I')` превратил тот же ввод в несуществующее имя; читатель с правом на три столбца получил `permission denied` при выборке четвёртого и при `INSERT`, а писатель с `SELECT, INSERT` — при `UPDATE` и `DELETE`; политика `tenant = current_user` показала арендатору 2 из 4 строк и отклонила чужую вставку; обычная роль в PostgreSQL 16 не может создавать таблицы в схеме `public`; функция `SECURITY DEFINER` отдала сумму 400 при запрещённом чтении таблицы; пароли с солью дали разные хеши при верной проверке.",
  minutes: 100,
  prerequisites: ["sql.keys-constraints", "sql.acid-transactions", "sql.migrations-safe-ddl"],
  tags: ["SQL injection", "parameterized queries", "prepared statements", "GRANT", "REVOKE", "roles", "least privilege", "row-level security", "RLS", "SECURITY DEFINER", "search_path", "format %I %L", "pgcrypto", "bcrypt", "public schema"],
  keyConcepts: [
    { term: "Ввод пользователя — это данные, а не код", text: "Склейка `'… WHERE email = '' + ввод + ''`: ввод `x' OR '1'='1` вернул 3 строки вместо 0; параметр `$1` с тем же текстом — 0 строк." },
    { term: "Инъекция позволяет выполнять новые команды", text: "Через склейку `x'; DELETE FROM users; --` строк в `users` стало 0 вместо 3; с параметром команда осталась обычной строкой, строк по-прежнему 3." },
    { term: "Динамический SQL экранируют `format(%I, %L)` и `USING`", text: "`EXECUTE 'DELETE FROM ' || tbl` с вводом `tmp_cache; DELETE FROM secrets` очистил обе таблицы; `format('DELETE FROM %I', tbl)` вернул ошибку «relation … does not exist»." },
    { term: "Права выдаются явно и минимально", text: "Читателю — `SELECT (id, name, email)`; запросы к `card_last4`, `INSERT` и `DELETE` ответили `permission denied`. Писатель получил `INSERT`, но не `UPDATE` и `DELETE`." },
    { term: "Row-Level Security фильтрует строки по роли", text: "Политика `USING (tenant = current_user)`: арендатор видит 2 из 4 строк, вставка чужой строки отклонена; владелец таблицы политики обходит." },
    { term: "SECURITY DEFINER — мост через права", text: "Функция с правами владельца вернула сумму 400, хотя прямой `SELECT card FROM payments` для вызывающего запрещён; обязательно фиксируйте `search_path`." },
  ],
  sections: [
    section("definition", [
      def("SQL-инъекция", "Уязвимость, при которой данные пользователя попадают в текст SQL-запроса и меняют его смысл (добавляют условия или целые команды).", "SQL injection"),
      def("Параметризованный запрос", "Запрос, в котором значения передаются отдельно от текста (`$1`, `?`): СУБД трактует их как данные и не разбирает как SQL.", "parameterized query / prepared statement"),
      def("Роль", "Именованная учётная запись или группа в PostgreSQL; обладает привилегиями и может быть членом других ролей. Роли общие для всего кластера.", "role"),
      def("Принцип наименьших привилегий", "Каждая роль получает только права, необходимые для её работы: приложение — не суперпользователь, аналитик — только чтение.", "least privilege"),
      def("GRANT / REVOKE", "Команды выдачи и отзыва привилегий (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `EXECUTE`, `USAGE`, `CREATE`) на таблицы, столбцы, схемы, функции.", "GRANT / REVOKE"),
      def("Защита на уровне строк (RLS)", "Механизм политик, который ограничивает видимые и изменяемые строки таблицы в зависимости от роли или параметров сеанса.", "row-level security"),
      def("SECURITY DEFINER", "Свойство функции: она выполняется с правами владельца, а не вызывающего; позволяет отдавать ограниченный доступ, но требует аккуратности (`search_path`).", "SECURITY DEFINER"),
      def("Соль и хеш пароля", "Пароль хранится не текстом, а результатом медленной односторонней функции со случайной солью, чтобы одинаковые пароли давали разные хеши.", "salted password hash"),
    ]),

    section("why", [
      h("Данные — самая ценная часть системы"),
      p("Для злоумышленника база — главная цель: в ней клиенты, платежи, пароли. Типичные взломы — не изощрённые атаки на сервер, а обычные ошибки: ввод пользователя склеен в запрос, приложение подключено под суперпользователем, сотрудник аналитики может прочитать номера карт. Защита строится слоями, чтобы одна ошибка не открывала всё: **безопасные запросы**, **минимальные права**, **ограничение строк**, **безопасное хранение секретов**."),
      ul(
        "**Инъекции** позволяют читать, менять и удалять данные от имени приложения.",
        "**Избыточные права** превращают любую уязвимость в катастрофу: взломанное приложение с правами `DROP` может уничтожить базу.",
        "**Мультиарендность** требует, чтобы клиент никогда не видел чужие строки — RLS делает это правилом базы, а не соглашением в коде.",
        "**Хранение паролей** — ответственность разработчика: утечка базы не должна раскрывать пароли.",
      ),
      note("Все сценарии темы выполнены на тестовых данных в изолированной базе и показывают атаки только на собственных примерах. Не проверяйте уязвимости на чужих системах без разрешения."),
    ]),

    section("mental-model", [
      h("Границы доверия: что приходит снаружи, то — данные"),
      p("Любая строка, пришедшая от пользователя, из файла или чужого сервиса, — недоверенная. Её нельзя превращать в **структуру** запроса (ключевые слова, имена таблиц, условия): только в **значение**, передаваемое отдельно. Тогда что бы ни ввёл пользователь, это не станет командой. Вторая граница — роль, под которой выполняется запрос: даже при ошибке в коде роль не должна иметь возможности сделать больше необходимого. Третья — строки: даже при доступе к таблице можно видеть только свои."),
      diagram(
        `
        Пользователь ──ввод──► Приложение ──запрос + параметры──► СУБД ──роль app──► таблицы
                                    │                                    │
                          (1) параметры, а не склейка        (2) права роли: минимум
                                                              (3) политики RLS: свои строки
        `,
        "Три слоя защиты: параметризованные запросы, минимальные права, политики строк.",
      ),
      h("Порядок защиты"),
      steps(
        [
          ["Параметры везде", "Значения — через `$1`, имена таблиц — через белый список или `format(%I)`."],
          ["Роли по назначению", "Владелец схемы (миграции), приложение (CRUD), аналитик (чтение), без суперпользователя в приложении."],
          ["Права на минимум", "`GRANT` только нужного; столбцы и представления вместо целых таблиц."],
          ["Политики строк", "RLS для мультиарендных и персональных данных."],
          ["Секреты", "Пароли — хеши с солью; ключи и строки подключения — вне кода; шифрование соединения."],
        ],
        "Слои защиты",
      ),
    ]),

    section("technical", [
      h("Привилегии и объекты"),
      table(
        ["Объект", "Привилегии", "Заметка"],
        [
          ["Таблица", "`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`", "Можно выдавать на отдельные столбцы"],
          ["Столбец", "`SELECT (col)`, `INSERT (col)`, `UPDATE (col)`", "Скрывает чувствительные поля (замер: `card_last4`)"],
          ["Схема", "`USAGE`, `CREATE`", "В PostgreSQL 15+ у обычных ролей нет `CREATE` в схеме `public`"],
          ["Функция", "`EXECUTE`", "По умолчанию выдаётся `PUBLIC`: отзывайте при `SECURITY DEFINER`"],
          ["База", "`CONNECT`, `CREATE`, `TEMP`", "Ограничивают подключение и создание схем"],
        ],
        "Привилегии PostgreSQL",
      ),
      h("Типовой набор ролей"),
      ul(
        "**Владелец схемы / `migrator`:** создаёт и меняет объекты; используется только при миграциях.",
        "**`app`:** `SELECT`, `INSERT`, `UPDATE` (иногда `DELETE`) на нужные таблицы; без прав на DDL.",
        "**`analyst` / `readonly`:** `SELECT` на представления без персональных данных.",
        "**Суперпользователь:** только для администрирования, не для приложения.",
      ),
      h("Правила безопасных запросов"),
      ul(
        "Значения — только параметрами (`$1`, `?`, именованные); никакой склейки строки.",
        "Списки значений — `= ANY($1)` с массивом, а не склейка `IN (…)`.",
        "Имена таблиц и столбцов от пользователя — белый список; в динамическом SQL — `format(%I)` и `%L` или `EXECUTE … USING`.",
        "Права приложения — минимальные: даже при инъекции ущерб ограничен.",
        "Ошибки базы не показывать пользователю: сообщения раскрывают структуру.",
      ),
      warn("Экранирование «вручную» (замена кавычек) — ненадёжно: диалекты, кодировки и контекст (идентификаторы, `LIKE`) ломают самодельные правила. Используйте параметры и встроенные функции квотирования."),
    ]),

    section("syntax", [
      p("Политика построчной защиты: `ENABLE ROW LEVEL SECURITY` включает механизм, `CREATE POLICY` задаёт условия видимости (`USING`) и допустимости записи (`WITH CHECK`)."),
      annotated(
        "sql",
        `CREATE ROLE tenant_a NOLOGIN;
CREATE ROLE tenant_b NOLOGIN;

CREATE TABLE invoices (id integer PRIMARY KEY, tenant text NOT NULL, amount integer NOT NULL);
INSERT INTO invoices VALUES (1, 'tenant_a', 100), (2, 'tenant_a', 250), (3, 'tenant_b', 400);
GRANT SELECT, INSERT ON invoices TO tenant_a, tenant_b;

-- Защита на уровне строк: каждая роль видит и добавляет только строки своего арендатора
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_rows ON invoices
  USING (tenant = current_user)
  WITH CHECK (tenant = current_user);

\\echo '--- tenant_a'
SET ROLE tenant_a;
SELECT id, tenant, amount FROM invoices ORDER BY id;
INSERT INTO invoices VALUES (4, 'tenant_a', 50);
INSERT INTO invoices VALUES (5, 'tenant_b', 999);
RESET ROLE;

\\echo '--- tenant_b'
SET ROLE tenant_b;
SELECT id, tenant, amount FROM invoices ORDER BY id;
RESET ROLE;

\\echo '--- владелец таблицы (политики его не касаются, пока не включено FORCE)'
SELECT count(*) AS owner_sees_all FROM invoices;

-- Уборка
DROP OWNED BY tenant_a, tenant_b;
DROP ROLE tenant_a, tenant_b;`,
        [
          { line: [1, 2], text: "Две роли-арендатора; имена совпадают со значением столбца `tenant`." },
          { line: [4, 5], text: "Таблица счетов: у каждой строки владелец-арендатор." },
          { line: 6, text: "Обычные права на таблицу: RLS ограничивает строки только внутри уже выданных прав." },
          { line: 9, text: "`ENABLE ROW LEVEL SECURITY` включает политики для таблицы; без политик обычным ролям строки недоступны." },
          { line: [10, 12], text: "Политика `own_rows`: `USING` определяет, какие строки видны и затрагиваются; `WITH CHECK` — какие строки можно записать. Условие `tenant = current_user` привязывает строку к роли." },
        ],
        "03-rls.pg.sql",
      ),
      code("text", `CREATE ROLE
CREATE ROLE
CREATE TABLE
INSERT 0 3
GRANT
ALTER TABLE
CREATE POLICY
--- tenant_a
SET
 id |  tenant  | amount 
----+----------+--------
  1 | tenant_a |    100
  2 | tenant_a |    250
(2 rows)

INSERT 0 1
ERROR:  new row violates row-level security policy for table "invoices"
RESET
--- tenant_b
SET
 id |  tenant  | amount 
----+----------+--------
  3 | tenant_b |    400
(1 row)

RESET
--- владелец таблицы (политики его не касаются, пока не включено FORCE)
 owner_sees_all 
----------------
              4
(1 row)

DROP OWNED
DROP ROLE`, { filename: "результат (PostgreSQL 16.14)" }),
    ]),

    section("minimal-example", [
      p("Инъекция в чистом виде. Приложение ищет пользователя по e-mail. В таблице три пользователя; сценарий выполняется на тестовой базе клиентом на Node.js."),
      code("text", `== 1. Склейка строки: ввод пользователя становится частью запроса ==
SQL: SELECT id, email FROM users WHERE email = 'x' OR '1'='1'
строк получено: 3 (ожидалось 0)

== 2. Тот же ввод параметром: это просто значение ==
SQL: SELECT id, email FROM users WHERE email = $1   -- $1 = "x' OR '1'='1"
строк получено: 0

== 3. Дополнительная команда через склейку ==
строк в users до: 3
строк в users после: 0

== 4. Та же строка параметром: команда не выполняется ==
строк получено: 0, строк в users: 3

== 5. Даже если команды склеены в тексте запроса с параметрами ==
ошибка [42601]: cannot insert multiple commands into a prepared statement
строк в users: 3`, { filename: "01: склейка против параметров (PostgreSQL 16.14)" }),
      ul(
        "**Склейка строки:** ввод `x' OR '1'='1` превратил условие в «всегда истина» — вернулись все 3 пользователя вместо 0.",
        "**Параметр:** тот же текст — просто значение, которого нет в таблице: 0 строк.",
        "**Дополнительная команда:** через склейку `x'; DELETE FROM users; --` выполнилась вторая команда — таблица опустела (3 → 0). Параметр оставил 3 строки.",
        "**Подстраховка протокола:** запрос с параметрами не принимает несколько команд (`cannot insert multiple commands into a prepared statement`) — но полагаться только на это нельзя.",
      ),
    ]),

    section("detailed-example", [
      h("Динамический SQL внутри базы"),
      code("sql", `CREATE TABLE tmp_cache (id integer);
CREATE TABLE secrets (id integer PRIMARY KEY, token text NOT NULL);
INSERT INTO tmp_cache VALUES (1), (2);
INSERT INTO secrets VALUES (1, 'секрет');

-- Динамический SQL: имя таблицы приходит от пользователя
CREATE FUNCTION clear_table_unsafe(tbl text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE 'DELETE FROM ' || tbl;                -- склейка строки
END $$;

CREATE FUNCTION clear_table_safe(tbl text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('DELETE FROM %I', tbl);        -- %I оформляет имя как идентификатор
END $$;

\\echo '--- безопасная функция, вредный ввод'
SELECT clear_table_safe('tmp_cache; DELETE FROM secrets');
SELECT (SELECT count(*) FROM tmp_cache) AS cache_rows, (SELECT count(*) FROM secrets) AS secrets_rows;

\\echo '--- небезопасная функция, тот же ввод'
SELECT clear_table_unsafe('tmp_cache; DELETE FROM secrets');
SELECT (SELECT count(*) FROM tmp_cache) AS cache_rows, (SELECT count(*) FROM secrets) AS secrets_rows;

\\echo '--- значение: %L добавляет кавычки и экранирует их'
SELECT format('SELECT * FROM users WHERE email = %L', 'x'' OR ''1''=''1') AS quoted_literal;`, { filename: "06-dynamic-sql.pg.sql" }),
      code("text", `CREATE TABLE
CREATE TABLE
INSERT 0 2
INSERT 0 1
CREATE FUNCTION
CREATE FUNCTION
--- безопасная функция, вредный ввод
ERROR:  relation "tmp_cache; DELETE FROM secrets" does not exist
LINE 1: DELETE FROM "tmp_cache; DELETE FROM secrets"
                    ^
QUERY:  DELETE FROM "tmp_cache; DELETE FROM secrets"
CONTEXT:  PL/pgSQL function clear_table_safe(text) line 3 at EXECUTE
 cache_rows | secrets_rows 
------------+--------------
          2 |            1
(1 row)

--- небезопасная функция, тот же ввод
 clear_table_unsafe 
--------------------
 
(1 row)

 cache_rows | secrets_rows 
------------+--------------
          0 |            0
(1 row)

--- значение: %L добавляет кавычки и экранирует их
                    quoted_literal                    
------------------------------------------------------
 SELECT * FROM users WHERE email = 'x'' OR ''1''=''1'
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Небезопасная функция склеила `'DELETE FROM ' || tbl`: ввод `tmp_cache; DELETE FROM secrets` выполнился как две команды — и таблица `secrets` тоже опустела (0 и 0).",
        "Безопасная `format('DELETE FROM %I', tbl)` оформила весь ввод как **одно имя таблицы** (`\"tmp_cache; DELETE FROM secrets\"`) и вернула ошибку: ничего не удалено (2 и 1).",
        "Значения подставляют `%L` (кавычки и экранирование добавляются автоматически) или передают через `EXECUTE … USING`. Для имён, выбираемых пользователем, добавляют ещё и белый список.",
      ),
      h("Права: читатель, писатель, отзыв"),
      code("sql", `-- Роли принадлежат кластеру, а не базе; права на таблицы выдаются командой GRANT
CREATE ROLE app_reader NOLOGIN;
CREATE ROLE app_writer NOLOGIN;

CREATE TABLE customers (id integer PRIMARY KEY, name text NOT NULL, email text NOT NULL, card_last4 text);
INSERT INTO customers VALUES (1, 'Анна', 'anna@example.com', '4242'), (2, 'Борис', 'boris@example.com', '1111');

-- Наименьшие привилегии: читателю — SELECT без номера карты, писателю — SELECT и INSERT
GRANT SELECT (id, name, email) ON customers TO app_reader;
GRANT SELECT, INSERT ON customers TO app_writer;

\\echo '--- app_reader'
SET ROLE app_reader;
SELECT id, name FROM customers ORDER BY id;
SELECT card_last4 FROM customers;
INSERT INTO customers VALUES (3, 'Вера', 'vera@example.com', NULL);
RESET ROLE;

\\echo '--- app_writer'
SET ROLE app_writer;
INSERT INTO customers VALUES (3, 'Вера', 'vera@example.com', NULL);
UPDATE customers SET name = 'Взлом' WHERE id = 1;
DELETE FROM customers WHERE id = 1;
RESET ROLE;

\\echo '--- право забрали: REVOKE INSERT'
REVOKE INSERT ON customers FROM app_writer;
SET ROLE app_writer;
INSERT INTO customers VALUES (4, 'Глеб', 'gleb@example.com', NULL);
RESET ROLE;
SELECT count(*) AS customers_total FROM customers;

-- Уборка: роли общие для кластера
DROP OWNED BY app_reader, app_writer;
DROP ROLE app_reader, app_writer;`, { filename: "02-privileges.pg.sql" }),
      code("text", `CREATE ROLE
CREATE ROLE
CREATE TABLE
INSERT 0 2
GRANT
GRANT
--- app_reader
SET
 id | name  
----+-------
  1 | Анна
  2 | Борис
(2 rows)

ERROR:  permission denied for table customers
ERROR:  permission denied for table customers
RESET
--- app_writer
SET
INSERT 0 1
ERROR:  permission denied for table customers
ERROR:  permission denied for table customers
RESET
--- право забрали: REVOKE INSERT
REVOKE
SET
ERROR:  permission denied for table customers
RESET
 customers_total 
-----------------
               3
(1 row)

DROP OWNED
DROP ROLE`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "`app_reader` с правом на три столбца: `SELECT id, name` работает; `SELECT card_last4` и `INSERT` — `permission denied`.",
        "`app_writer` с `SELECT, INSERT`: `INSERT` прошёл; `UPDATE` и `DELETE` отклонены.",
        "После `REVOKE INSERT` писатель тоже не может вставлять; в таблице осталось 3 строки (две исходные и одна, вставленная писателем).",
      ),
    ]),

    section("analysis", [
      table(
        ["Сценарий", "Результат (замер)", "Вывод"],
        [
          ["Склейка: ввод `x' OR '1'='1`", "3 строки вместо 0", "Ввод изменил смысл условия"],
          ["Параметр: тот же ввод", "0 строк", "Параметр — данные, а не код"],
          ["Склейка: `…; DELETE FROM users`", "3 → 0 строк", "Инъекция выполняет новые команды"],
          ["`format('%I')` против `||` в динамическом SQL", "Ошибка и неизменные данные против опустошённых двух таблиц", "Квотируйте идентификаторы"],
          ["Читатель: `SELECT card_last4` / `INSERT`", "`permission denied`", "Права на столбцы и операции"],
          ["RLS: арендатор `tenant_a`", "2 из 4 строк; чужая вставка отклонена", "Политика ограничивает чтение и запись"],
          ["Обычная роль: `CREATE` в `public`", "`permission denied for schema public`", "PostgreSQL 15+ безопаснее по умолчанию"],
          ["Пароли: `crypt` + `gen_salt('bf')`", "Хеши различаются; проверка true/false", "Соль и медленный хеш"],
        ],
        "Что показали замеры PostgreSQL 16.14",
      ),
      h("Мультиарендность: RLS"),
      p("Политика `tenant = current_user` показала арендатору `tenant_a` две его строки (из четырёх в таблице) и отклонила вставку `INSERT … 'tenant_b'` ошибкой `new row violates row-level security policy`. `tenant_b` видит только свою единственную строку. Владелец таблицы политику обходит (видит все 4 строки), пока не включён режим `FORCE ROW LEVEL SECURITY`; суперпользователи и роли с `BYPASSRLS` обходят её всегда. В реальных системах вместо `current_user` часто используют параметр сеанса (`current_setting('app.tenant_id')`), который приложение выставляет при подключении."),
      h("Схема public и новые роли"),
      code("sql", `CREATE ROLE newbie NOLOGIN;
-- В PostgreSQL 15 и новее обычная роль не может создавать объекты в схеме public
SELECT has_schema_privilege('newbie', 'public', 'USAGE')  AS can_use_public,
       has_schema_privilege('newbie', 'public', 'CREATE') AS can_create_in_public;
SET ROLE newbie;
CREATE TABLE public.junk (id integer);
RESET ROLE;
DROP ROLE newbie;`, { filename: "04-public-schema.pg.sql" }),
      code("text", `CREATE ROLE
 can_use_public | can_create_in_public 
----------------+----------------------
 t              | f
(1 row)

SET
ERROR:  permission denied for schema public
LINE 1: CREATE TABLE public.junk (id integer);
                     ^
RESET
DROP ROLE`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Начиная с PostgreSQL 15, у обычных ролей нет права `CREATE` в схеме `public` (замер: `can_create_in_public = f`), хотя `USAGE` остаётся. В старых версиях любой пользователь мог создавать там объекты — источник путаницы и атак с подменой имён. В унаследованных кластерах право отзывают явно: `REVOKE CREATE ON SCHEMA public FROM PUBLIC`."),
    ]),

    section("internals", [
      h("SECURITY DEFINER: ограниченный доступ через функцию"),
      code("sql", `CREATE ROLE report_user NOLOGIN;
CREATE TABLE payments (id integer PRIMARY KEY, card text NOT NULL, amount integer NOT NULL);
INSERT INTO payments VALUES (1, '4242 4242 4242 4242', 100), (2, '1111 1111 1111 1111', 300);

-- Функция выполняется с правами владельца и отдаёт только сводку, а не карты
CREATE FUNCTION payments_total() RETURNS bigint LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public AS
  $$ SELECT sum(amount) FROM public.payments $$;
REVOKE ALL ON FUNCTION payments_total() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION payments_total() TO report_user;

\\echo '--- report_user'
SET ROLE report_user;
SELECT payments_total() AS total;
SELECT card FROM payments;
RESET ROLE;

-- Уборка
DROP OWNED BY report_user;
DROP ROLE report_user;`, { filename: "05-security-definer.pg.sql" }),
      code("text", `CREATE ROLE
CREATE TABLE
INSERT 0 2
CREATE FUNCTION
REVOKE
GRANT
--- report_user
SET
 total 
-------
   400
(1 row)

ERROR:  permission denied for table payments
RESET
DROP OWNED
DROP ROLE`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Роль `report_user` не имеет прав на таблицу `payments` (`SELECT card` отклонён), но может вызвать функцию, которая выполняется с правами владельца и отдаёт только сумму (400). Так выдают доступ к агрегатам или к операциям без доступа к сырым данным. Две обязательные меры: `SET search_path = pg_catalog, public` внутри функции (иначе вызывающий может подсунуть свои объекты с теми же именами) и `REVOKE ALL … FROM PUBLIC` с выдачей `EXECUTE` только нужным ролям."),
      h("Хранение паролей"),
      code("sql", `CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Пароль хранится как хеш с солью (bcrypt), а не как текст
CREATE TABLE accounts (id integer PRIMARY KEY, login text NOT NULL, password_hash text NOT NULL);
INSERT INTO accounts VALUES (1, 'anna', crypt('правильный пароль', gen_salt('bf'))), (2, 'boris', crypt('правильный пароль', gen_salt('bf')));

-- Одинаковые пароли дают разные хеши (соль), а проверка работает
SELECT (SELECT password_hash FROM accounts WHERE id = 1) <> (SELECT password_hash FROM accounts WHERE id = 2) AS hashes_differ,
       substr((SELECT password_hash FROM accounts WHERE id = 1), 1, 4) AS hash_prefix;
SELECT login,
       password_hash = crypt('правильный пароль', password_hash) AS correct_password,
       password_hash = crypt('другой пароль', password_hash)     AS wrong_password
FROM accounts ORDER BY id;`, { filename: "07-passwords.pg.sql" }),
      code("text", ` hashes_differ | hash_prefix 
---------------+-------------
 t             | $2a$
(1 row)

 login | correct_password | wrong_password 
-------+------------------+----------------
 anna  | t                | f
 boris | t                | f
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Одинаковый пароль у двух пользователей даёт **разные** хеши (`hashes_differ = t`): соль у каждого своя.",
        "Хеш начинается с `$2a$` — это bcrypt; проверка `password_hash = crypt(введённый, password_hash)`: верный пароль — `t`, неверный — `f`.",
        "Пароль нельзя хранить открытым текстом, шифровать обратимо или хешировать быстрой функцией без соли. Чаще хеширование выполняют в приложении (bcrypt, scrypt, Argon2); расширение `pgcrypto` показывает принцип.",
      ),
      h("Эффективные права: смотрите, что на самом деле выдано"),
      p("Права складываются из прямых выдач, членства в ролях и умолчаний (`PUBLIC`, `ALTER DEFAULT PRIVILEGES`). Проверка — функции `has_table_privilege`, `has_schema_privilege`, `has_function_privilege` и представления `information_schema.table_privileges`. Регулярно проверяйте, что у приложения нет лишнего."),
    ]),

    section("mistakes", [
      h("Ошибка: склейка строк вместо параметров"),
      wrongRight(
        "js",
        { title: "Склейка", code: `const q = "SELECT id FROM users WHERE email = '" + input + "'";\nawait client.query(q);`, note: "Ввод `x' OR '1'='1` вернул все 3 строки; `x'; DELETE FROM users; --` опустошил таблицу." },
        { title: "Параметр", code: `await client.query(\n  "SELECT id FROM users WHERE email = $1",\n  [input]\n);`, note: "Ввод — значение: 0 строк, таблица цела." },
      ),
      h("Ошибка: приложение под суперпользователем"),
      p("Суперпользователь обходит все права и RLS. Любая инъекция получает полный контроль, включая чтение файлов и выполнение программ на сервере. Приложению нужна роль с минимальными правами."),
      h("Ошибка: доверять экранированию вручную"),
      p("Замена `'` на `''` не защищает идентификаторы, `LIKE`-шаблоны, числовые контексты и не учитывает кодировки. Параметры и `format(%I, %L)` разработаны именно для этого."),
      h("Ошибка: SECURITY DEFINER без search_path"),
      p("Функция с правами владельца, не фиксирующая `search_path`, может обратиться к объекту, подсунутому вызывающим в его схеме. Всегда задавайте `SET search_path = pg_catalog, public` и ограничивайте `EXECUTE`."),
      h("Ошибка: RLS «включена», но владелец подключается приложением"),
      p("Владелец таблицы политики обходит (замер: `owner_sees_all = 4`). Приложение должно работать под ролью, не являющейся владельцем, либо включите `FORCE ROW LEVEL SECURITY`."),
      h("Ошибка: показывать пользователю сообщения СУБД"),
      p("Тексты ошибок (`relation \"…\" does not exist`, `permission denied for table customers`) раскрывают структуру базы. Логируйте подробности на сервере, пользователю возвращайте общий ответ."),
    ]),

    section("antipatterns", [
      ul(
        "**Склейка SQL из пользовательского ввода,** включая «только числа» и «только имена».",
        "**Одна роль на всё** (приложение, миграции, отчёты) и под суперпользователем.",
        "**Динамический SQL без `format(%I, %L)` и белого списка.**",
        "**Права «на всякий случай»:** `GRANT ALL`, членство в `pg_write_all_data` без необходимости.",
        "**Пароли открытым текстом или быстрым хешем без соли.**",
        "**Секреты в репозитории и в логах запросов** (параметры в `log_statement`).",
        "**Мультиарендность через `WHERE tenant_id = …` в каждом запросе** без политик строк: одна забытая строка раскрывает чужие данные.",
        "**Подключение без шифрования** (`sslmode=disable`) по недоверенной сети.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Параметризованные запросы везде;** списки — `= ANY($1)`; идентификаторы — белый список или `format(%I)`.",
        "**Отдельные роли:** владелец схемы, приложение, аналитик; суперпользователь — только администраторам.",
        "**Наименьшие привилегии:** права на столбцы и представления вместо всей таблицы; регулярный аудит выданного.",
        "**`REVOKE CREATE ON SCHEMA public FROM PUBLIC`** в унаследованных кластерах; схемы по назначению.",
        "**RLS** для мультиарендных и персональных данных; приложение — не владелец таблиц.",
        "**`SECURITY DEFINER`** только с зафиксированным `search_path` и узким `EXECUTE`.",
        "**Пароли — bcrypt/scrypt/Argon2;** секреты — в хранилище секретов, не в коде; шифрование соединения (`sslmode=verify-full`).",
        "**Логирование и аудит:** не писать секреты, включить журнал изменений критичных таблиц (триггеры, расширение pgaudit).",
        "**Тестируйте безопасность:** негативные тесты прав и инъекций в наборе проверок.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**ORM и построители запросов** защищают при использовании параметров, но «сырые» фрагменты (`raw`, `literal`) снова склейка — проверяйте их.",
        "**`LIKE` и параметры:** символы `%` и `_` внутри значения остаются шаблонными; для точного поиска их экранируют.",
        "**Хранимые процедуры** не защищают сами по себе: `EXECUTE` со склейкой уязвим (замер).",
        "**Второй порядок:** значение, сохранённое в базе без проблем, может стать инъекцией при последующем использовании в склейке.",
        "**RLS и производительность:** условие политики применяется к каждому запросу; индексируйте столбец политики и проверяйте планы `EXPLAIN`.",
        "**Представления:** выполняются с правами владельца представления (если не `security_invoker`, PostgreSQL 15+) — основа отчётного доступа без доступа к таблицам.",
        "**SQLite:** встроенной системы ролей и RLS нет; защита — параметры запросов и права файла/процесса.",
      ),
    ]),

    section("related", [
      ul(
        "[Ключи и ограничения](/learn/sql/keys-constraints) — защита целостности: ограничения работают независимо от кода приложения.",
        "[Транзакции и ACID](/learn/sql/acid-transactions) — атомарные операции и откат при нарушении.",
        "[Миграции и безопасный DDL](/learn/sql/migrations-safe-ddl) — отдельная роль владельца для миграций.",
        "[Паттерны проектирования схем](/learn/sql/schema-patterns) — журналы изменений и аудит.",
        "[Оптимизация запросов](/learn/sql/query-tuning) — параметры и `= ANY(массив)` вместо склейки списков.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Динамический SQL склейкой",
          code: `CREATE FUNCTION clear_table_unsafe(tbl text) RETURNS void AS $$\nBEGIN\n  EXECUTE 'DELETE FROM ' || tbl;\nEND $$ LANGUAGE plpgsql;`,
          note: "Ввод `tmp_cache; DELETE FROM secrets` очистил обе таблицы (замер: 0 и 0).",
        },
        {
          title: "Квотирование идентификатора",
          code: `CREATE FUNCTION clear_table_safe(tbl text) RETURNS void AS $$\nBEGIN\n  EXECUTE format('DELETE FROM %I', tbl);\nEND $$ LANGUAGE plpgsql;`,
          note: "Тот же ввод стал одним несуществующим именем: ошибка, данные целы (замер: 2 и 1).",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.sql-security.ex1",
      title: "Кто что может",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Читателю выданы права `SELECT (id, name, email)` на таблицу `customers`, писателю — `SELECT, INSERT`. Определите, какие из операций выполнятся: читатель — `SELECT card_last4`, `INSERT`; писатель — `INSERT`, `UPDATE`, `DELETE`. Затем сверьтесь с замером."),
      ],
      hints: ["Распространяется ли право на столбцы на столбец `card_last4`?", "Входят ли `UPDATE` и `DELETE` в выданные писателю привилегии?"],
      checks: ["Читатель: оба запроса отклонены", "Писатель: `INSERT` проходит, `UPDATE` и `DELETE` — `permission denied`"],
      solution: [
        code("text", `CREATE ROLE
CREATE ROLE
CREATE TABLE
INSERT 0 2
GRANT
GRANT
--- app_reader
SET
 id | name  
----+-------
  1 | Анна
  2 | Борис
(2 rows)

ERROR:  permission denied for table customers
ERROR:  permission denied for table customers
RESET
--- app_writer
SET
INSERT 0 1
ERROR:  permission denied for table customers
ERROR:  permission denied for table customers
RESET
--- право забрали: REVOKE INSERT
REVOKE
SET
ERROR:  permission denied for table customers
RESET
 customers_total 
-----------------
               3
(1 row)

DROP OWNED
DROP ROLE`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Право на столбцы не распространяется на `card_last4`, а `INSERT` читателю не выдавался — отказ. Писателю выдан только `INSERT` (и `SELECT`), поэтому `UPDATE` и `DELETE` отклонены. Права складываются только из того, что выдано явно."),
      ],
    }),
    exercise({
      id: "sql.sql-security.ex2",
      title: "Форма входа возвращает всех",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Приложение ищет пользователя по e-mail склейкой строки. Тестировщик ввёл `x' OR '1'='1` и увидел список всех пользователей, а затем — пустую таблицу после ввода `x'; DELETE FROM users; --`. Найдите причину и исправьте."),
        code("js", `const q = "SELECT id, email FROM users WHERE email = '" + email + "'";\nconst rows = (await client.query(q)).rows;`, { filename: "уязвимый код" }),
      ],
      hints: ["Что в итоге попадает в текст запроса?", "Как передать значение отдельно от текста?"],
      checks: ["Ввод становится частью SQL", "Исправление: `client.query(\"SELECT … WHERE email = $1\", [email])`"],
      solution: [
        code("text", `== 1. Склейка строки: ввод пользователя становится частью запроса ==
SQL: SELECT id, email FROM users WHERE email = 'x' OR '1'='1'
строк получено: 3 (ожидалось 0)

== 2. Тот же ввод параметром: это просто значение ==
SQL: SELECT id, email FROM users WHERE email = $1   -- $1 = "x' OR '1'='1"
строк получено: 0

== 3. Дополнительная команда через склейку ==
строк в users до: 3
строк в users после: 0

== 4. Та же строка параметром: команда не выполняется ==
строк получено: 0, строк в users: 3

== 5. Даже если команды склеены в тексте запроса с параметрами ==
ошибка [42601]: cannot insert multiple commands into a prepared statement
строк в users: 3`, { filename: "воспроизведение и исправление (PostgreSQL 16.14)" }),
        p("Склейка превращает ввод в часть SQL: `x' OR '1'='1` делает условие истинным для всех строк, а `'; DELETE …; --` добавляет вторую команду. Параметр `$1` передаётся отдельно и всегда остаётся значением: 0 строк, таблица цела. Дополнительная мера — роль приложения без права `DELETE`: тогда даже успешная инъекция не смогла бы очистить таблицу."),
      ],
    }),
    exercise({
      id: "sql.sql-security.ex3",
      title: "Счета арендаторов",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("В таблице `invoices` счета нескольких арендаторов. Нужно, чтобы каждая роль-арендатор видела и добавляла только свои строки, не меняя запросы приложения. Опишите политику и покажите её работу: чтение, допустимая и недопустимая вставка."),
      ],
      hints: ["Какие две части у политики и за что отвечает каждая?", "Почему владелец таблицы видит всё и что с этим делать?"],
      checks: ["`ENABLE ROW LEVEL SECURITY` и `CREATE POLICY … USING (…) WITH CHECK (…)`", "Чужая вставка отклонена `violates row-level security policy`"],
      solution: [
        code("sql", `CREATE ROLE tenant_a NOLOGIN;
CREATE ROLE tenant_b NOLOGIN;

CREATE TABLE invoices (id integer PRIMARY KEY, tenant text NOT NULL, amount integer NOT NULL);
INSERT INTO invoices VALUES (1, 'tenant_a', 100), (2, 'tenant_a', 250), (3, 'tenant_b', 400);
GRANT SELECT, INSERT ON invoices TO tenant_a, tenant_b;

-- Защита на уровне строк: каждая роль видит и добавляет только строки своего арендатора
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_rows ON invoices
  USING (tenant = current_user)
  WITH CHECK (tenant = current_user);

\\echo '--- tenant_a'
SET ROLE tenant_a;
SELECT id, tenant, amount FROM invoices ORDER BY id;
INSERT INTO invoices VALUES (4, 'tenant_a', 50);
INSERT INTO invoices VALUES (5, 'tenant_b', 999);
RESET ROLE;

\\echo '--- tenant_b'
SET ROLE tenant_b;
SELECT id, tenant, amount FROM invoices ORDER BY id;
RESET ROLE;

\\echo '--- владелец таблицы (политики его не касаются, пока не включено FORCE)'
SELECT count(*) AS owner_sees_all FROM invoices;

-- Уборка
DROP OWNED BY tenant_a, tenant_b;
DROP ROLE tenant_a, tenant_b;`, { filename: "03-rls.pg.sql", lineNumbers: true }),
        code("text", `CREATE ROLE
CREATE ROLE
CREATE TABLE
INSERT 0 3
GRANT
ALTER TABLE
CREATE POLICY
--- tenant_a
SET
 id |  tenant  | amount 
----+----------+--------
  1 | tenant_a |    100
  2 | tenant_a |    250
(2 rows)

INSERT 0 1
ERROR:  new row violates row-level security policy for table "invoices"
RESET
--- tenant_b
SET
 id |  tenant  | amount 
----+----------+--------
  3 | tenant_b |    400
(1 row)

RESET
--- владелец таблицы (политики его не касаются, пока не включено FORCE)
 owner_sees_all 
----------------
              4
(1 row)

DROP OWNED
DROP ROLE`, { filename: "результат (PostgreSQL 16.14)" }),
        p("`USING` определяет видимые строки, `WITH CHECK` — допустимые для записи: `tenant_a` видит 2 своих строки, вставка `tenant_a` проходит, вставка строки `tenant_b` отклонена. Владелец таблицы политику обходит (видит все 4 строки), поэтому приложение подключают не владельцем либо включают `FORCE ROW LEVEL SECURITY`."),
      ],
    }),
  ],

  challenge: {
    id: "sql.sql-security.challenge",
    title: "Три роли для интернет-магазина",
    scenario: [
      p("В магазине три потребителя базы: приложение (создаёт и меняет заказы, читает клиентов), аналитик (отчёты без e-mail клиентов) и владелец схемы (миграции). Нужно выдать права так, чтобы ошибка или взлом любой из ролей причиняли минимальный ущерб, и доказать это проверками."),
    ],
    requirements: [
      "Роль `app`: `SELECT` на клиентов; `SELECT`, `INSERT`, `UPDATE` на заказы; без `DELETE` и без изменения клиентов",
      "Роль `analyst`: только отчётное представление без e-mail",
      "Проверка разрешённых и запрещённых операций для каждой роли",
      "Роли удаляются в конце (роли общие для кластера)",
    ],
    constraints: [
      "Никаких прав на таблицы для `analyst`",
      "Приложение не может выполнять DDL",
    ],
    acceptance: [
      "`app`: чтение клиентов, вставка и изменение заказа проходят; `DELETE` заказа и `UPDATE` клиента — `permission denied`",
      "`analyst`: отчёт по клиентам (Анна — 700, Борис — 450) проходит; `SELECT email` и `SELECT * FROM orders` — `permission denied`",
    ],
    hints: [
      "Представление выполняется с правами своего владельца, поэтому аналитику хватает `GRANT SELECT` на представление.",
      "Для проверки роли — `SET ROLE …` и `RESET ROLE`.",
    ],
    solution: [
      code("sql", `-- Три роли: app (работает с заказами), analyst (отчёты без персональных данных), владелец схемы (миграции)
CREATE ROLE app NOLOGIN;
CREATE ROLE analyst NOLOGIN;

CREATE TABLE customers (id integer PRIMARY KEY, name text NOT NULL, email text NOT NULL);
CREATE TABLE orders (id integer PRIMARY KEY, customer_id integer NOT NULL REFERENCES customers (id), total integer NOT NULL);
INSERT INTO customers VALUES (1, 'Анна', 'anna@example.com'), (2, 'Борис', 'boris@example.com');
INSERT INTO orders VALUES (1, 1, 500), (2, 2, 300), (3, 1, 200);

-- Отчётное представление без e-mail
CREATE VIEW orders_report AS
SELECT o.id AS order_id, c.name AS customer, o.total FROM orders AS o JOIN customers AS c ON c.id = o.customer_id;

-- Приложение: читает клиентов, создаёт и меняет заказы, но не удаляет их
GRANT SELECT ON customers TO app;
GRANT SELECT, INSERT, UPDATE ON orders TO app;
-- Аналитик: только отчётное представление
GRANT SELECT ON orders_report TO analyst;

\\echo '--- app: разрешённое'
SET ROLE app;
SELECT count(*) AS customers_visible FROM customers;
INSERT INTO orders VALUES (4, 2, 100);
UPDATE orders SET total = 150 WHERE id = 4;
\\echo '--- app: запрещённое'
DELETE FROM orders WHERE id = 4;
UPDATE customers SET email = 'x@example.com' WHERE id = 1;
RESET ROLE;

\\echo '--- analyst: разрешённое'
SET ROLE analyst;
SELECT customer, sum(total) AS spent FROM orders_report GROUP BY customer ORDER BY customer;
\\echo '--- analyst: запрещённое'
SELECT email FROM customers;
SELECT * FROM orders;
RESET ROLE;

-- Уборка
DROP OWNED BY app, analyst;
DROP ROLE app, analyst;`, { filename: "08-challenge.pg.sql", lineNumbers: true }),
      code("text", `CREATE ROLE
CREATE ROLE
CREATE TABLE
CREATE TABLE
INSERT 0 2
INSERT 0 3
CREATE VIEW
GRANT
GRANT
GRANT
--- app: разрешённое
SET
 customers_visible 
-------------------
                 2
(1 row)

INSERT 0 1
UPDATE 1
--- app: запрещённое
ERROR:  permission denied for table orders
ERROR:  permission denied for table customers
RESET
--- analyst: разрешённое
SET
 customer | spent 
----------+-------
 Анна     |   700
 Борис    |   450
(2 rows)

--- analyst: запрещённое
ERROR:  permission denied for table customers
ERROR:  permission denied for table orders
RESET
DROP OWNED
DROP ROLE`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Приложение читает клиентов, создаёт и меняет заказы, но `DELETE` и правки клиентов отклонены. Аналитик видит только агрегат через представление (Анна — 700, Борис — 450 с учётом заказа 4 на 150, созданного приложением) и не может прочитать таблицы напрямую. Проверки в сценарии — это набор негативных тестов: каждое запрещённое действие обязано падать."),
    ],
  },

  interview: [
    iq("sql.sql-security.i1", "basic", "Что такое SQL-инъекция и как от неё защититься?", [
      ul(
        "Подмена смысла запроса вводом пользователя, попавшим в текст SQL: `x' OR '1'='1` вернул все строки (замер), `'; DELETE …` удалил данные.",
        "Защита — параметризованные запросы: значение передаётся отдельно (`$1`) и остаётся данными.",
        "Дополнительно: минимальные права роли приложения, белый список для идентификаторов, скрытие ошибок СУБД.",
      ),
    ]),
    iq("sql.sql-security.i2", "basic", "Что такое принцип наименьших привилегий в базе данных?", [
      ul(
        "Каждая роль получает только необходимые права: читателю — `SELECT` (при необходимости на столбцы), приложению — `INSERT/UPDATE` на нужные таблицы.",
        "Замер: `SELECT card_last4`, `UPDATE`, `DELETE` у ролей без этих прав завершились `permission denied`.",
        "Ограничивает ущерб от ошибок и взломов: инъекция под ролью без `DELETE` не очистит таблицу.",
      ),
    ]),
    iq("sql.sql-security.i3", "intermediate", "Как безопасно передавать список значений в IN и имя таблицы в запрос?", [
      ul(
        "Список: `WHERE id = ANY($1)` с массивом параметром, а не склейка `IN (…)`.",
        "Имя таблицы/столбца нельзя передать параметром: белый список допустимых имён либо `format('%I', name)` в динамическом SQL.",
        "Склейка имени `'… FROM ' || tbl` в замере выполнила вредный ввод и очистила две таблицы.",
      ),
    ]),
    iq("sql.sql-security.i4", "intermediate", "Что такое Row-Level Security и когда она нужна?", [
      ul(
        "Политики таблицы, ограничивающие видимые (`USING`) и записываемые (`WITH CHECK`) строки в зависимости от роли или параметра сеанса.",
        "Нужна для мультиарендности и персональных данных: в замере арендатор видел 2 из 4 строк, чужая вставка отклонена.",
        "Владелец таблицы, суперпользователь и роли с `BYPASSRLS` её обходят; для владельца — `FORCE ROW LEVEL SECURITY`.",
      ),
    ]),
    iq("sql.sql-security.i5", "intermediate", "Для чего нужен SECURITY DEFINER и в чём его опасность?", [
      ul(
        "Функция выполняется с правами владельца: можно дать доступ к агрегату или операции без доступа к таблице (в замере сумма 400 при запрещённом `SELECT card`).",
        "Опасность — подмена объектов через `search_path` вызывающего: фиксируйте `SET search_path = pg_catalog, public`.",
        "Права на выполнение — `REVOKE ALL … FROM PUBLIC`, `GRANT EXECUTE` только нужным ролям.",
      ),
    ]),
    iq("sql.sql-security.i6", "advanced", "Как правильно хранить пароли пользователей?", [
      ul(
        "Только в виде хеша с солью, вычисленного медленной функцией (bcrypt, scrypt, Argon2): одинаковые пароли дают разные хеши (замер).",
        "Проверка — вычисление хеша введённого пароля с солью из сохранённого и сравнение.",
        "Нельзя: открытый текст, обратимое шифрование, быстрые хеши без соли (MD5, SHA-1).",
      ),
    ]),
    iq("sql.sql-security.i7", "advanced", "Приложение подключается под суперпользователем «чтобы всё работало». Чем это опасно и как исправить?", [
      ul(
        "Суперпользователь обходит права и RLS: любая инъекция даёт полный контроль над данными и сервером.",
        "Исправление: отдельные роли — владелец схемы для миграций, `app` с минимальными правами, `analyst` для чтения.",
        "Выдать права по таблицам и операциям, проверить негативными тестами, отозвать лишнее (`REVOKE`, `public`).",
      ),
    ]),
    iq("sql.sql-security.i8", "engineering", "Как построить безопасную мультиарендную систему на PostgreSQL?", [
      ul(
        "Строка каждого арендатора помечена идентификатором; политики RLS (`tenant_id = current_setting('app.tenant_id')`) ограничивают чтение и запись.",
        "Приложение подключается ролью не-владельцем без `BYPASSRLS` и выставляет параметр сеанса при каждом подключении/транзакции.",
        "Индекс по `tenant_id` в каждой таблице; проверка планов — условие политики влияет на производительность.",
        "Негативные тесты: арендатор A не видит и не меняет строки B (в замере чужая вставка отклонена).",
        "Дополнительно: ограничения целостности с `tenant_id` в составных ключах, аудит доступа.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.sql-security.e1", "foundation", "Какой способ передачи пользовательского ввода в запрос безопасен?", ["Склейка строки с экранированием кавычек", "Замена пробелов", "Параметр `$1`", "Конкатенация `||` внутри SQL"], 2, "Параметр передаётся отдельно от текста запроса и всегда остаётся значением (замер: 0 строк против 3 при склейке)."),
    mcq("sql.sql-security.e2", "foundation", "Что вернёт `SELECT … WHERE email = '` + `x' OR '1'='1` + `'` при склейке?", ["Все строки таблицы (3)", "0 строк", "Ошибку синтаксиса", "1 строку"], 0, "Ввод превращает условие в «всегда истина» (`email = 'x' OR '1'='1'`): вернулись все 3 пользователя."),
    mcq("sql.sql-security.e3", "foundation", "Какой командой отзывают право у роли?", ["`DENY`", "`REMOVE`", "`DROP`", "`REVOKE`"], 3, "`REVOKE` отзывает привилегии; после `REVOKE INSERT` писатель получил `permission denied` (замер)."),
    mcq("sql.sql-security.e4", "intermediate", "Как безопасно подставить имя таблицы в динамический SQL внутри функции?", ["`'DELETE FROM ' || tbl`", "`format('DELETE FROM %I', tbl)` (и белый список)", "`replace(tbl, ';', '')`", "Передать как параметр `$1`"], 1, "`%I` оформляет ввод как один идентификатор: вредный ввод стал несуществующим именем, данные остались целы."),
    mcq("sql.sql-security.e5", "intermediate", "Что делает политика `USING (tenant = current_user) WITH CHECK (tenant = current_user)`?", ["Блокирует таблицу", "Шифрует данные", "Удаляет чужие строки", "Показывает и разрешает записывать только строки своего арендатора"], 3, "`USING` ограничивает видимые строки (2 из 4 в замере), `WITH CHECK` — записываемые: чужая вставка отклонена."),
    mcq("sql.sql-security.e6", "intermediate", "Кто обходит политики RLS по умолчанию?", ["Никто", "Только анонимные роли", "Владелец таблицы и суперпользователь", "Все роли с `SELECT`"], 2, "В замере владелец увидел все 4 строки; `FORCE ROW LEVEL SECURITY` распространяет политики и на владельца."),
    mcq("sql.sql-security.e7", "advanced", "Почему в SECURITY DEFINER-функции нужно задавать `search_path`?", ["Для ускорения", "Чтобы вызывающий не подменил объекты, на которые ссылается функция, своими", "Это требование синтаксиса", "Чтобы отключить права"], 1, "Функция выполняется с правами владельца: без фиксированного `search_path` вызывающий мог бы подсунуть одноимённый объект в своей схеме."),
    open("sql.sql-security.e8", "intermediate", "Опишите набор ролей и прав для веб-приложения с отчётами, чтобы взлом приложения нанёс минимальный ущерб.", [
      ul(
        "Роль владельца схемы (`migrator`) для миграций — не используется приложением.",
        "Роль `app`: `SELECT/INSERT/UPDATE` на нужные таблицы, без `DELETE` там, где оно не нужно, без DDL, не суперпользователь.",
        "Роль `analyst`: `SELECT` только на представления без персональных данных.",
        "Для мультиарендных данных — RLS; чувствительные столбцы — через права на столбцы или представления.",
        "Параметризованные запросы, шифрование соединения, секреты вне кода, негативные тесты прав.",
      ),
    ], ["Разделение ролей", "Права app и analyst", "RLS и права на столбцы", "Параметры, TLS, секреты, тесты"], { format: "architecture" }),
  ],

  mastery: [
    mcq("sql.sql-security.m1", "intermediate", "Что вернул `SELECT … WHERE email = $1` с параметром `x'; DELETE FROM users; --` (замер)?", ["0 строк, таблица цела (3 строки)", "Удалил таблицу", "Ошибку", "Все строки"], 0, "Параметр передаётся как значение: строки с таким e-mail нет, а команда `DELETE` не разбирается."),
    mcq("sql.sql-security.m2", "advanced", "Роль читателя выполнила `SELECT payments_total()` (SECURITY DEFINER) успешно, а `SELECT card FROM payments` — с ошибкой. Почему?", ["Функция обходит базу", "Ошибка в таблице", "Функция выполняется с правами владельца, а прямой доступ к таблице у роли не выдан", "У роли есть `BYPASSRLS`"], 2, "`SECURITY DEFINER` даёт функции права владельца: так отдают агрегат без доступа к сырым данным."),
    mcq("sql.sql-security.m3", "advanced", "После апгрейда на PostgreSQL 15+ новая обычная роль не может создавать таблицы в `public`. Почему?", ["Права `CREATE` на схему `public` у `PUBLIC` отозваны по умолчанию", "Баг", "У роли нет `USAGE`", "Роль не `LOGIN`"], 0, "Замер: `can_use_public = t`, `can_create_in_public = f`; старые кластеры могут сохранять прежнее поведение — права проверяют."),
    open("sql.sql-security.m4", "advanced", "Аудит нашёл, что у сервиса отчётов есть права `UPDATE` на таблицу платежей и доступ ко всем столбцам клиентов. Как вы исправите, не сломав сервис?", [
      ul(
        "Определить реальные потребности: какие таблицы, столбцы и операции использует сервис (журнал запросов, `pg_stat_statements`).",
        "Создать отдельную роль `analyst` с `SELECT` на представления без чувствительных столбцов; отозвать `UPDATE` и прямой доступ к таблицам (`REVOKE`).",
        "Переключить сервис на новую роль на тестовом окружении, проверить негативные сценарии (запрещённое должно падать) и позитивные.",
        "Включить RLS там, где нужны ограничения по строкам; зафиксировать выдачи в миграциях.",
        "Мониторить ошибки `permission denied` после переключения; план отката — возможность вернуть права на время.",
      ),
    ], ["Анализ реального использования", "Новая роль и представления", "Проверка позитивных и негативных сценариев", "Мониторинг и откат"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.sql-security.f1", front: "Инъекция и защита?", back: "Ввод попал в текст SQL. Защита: параметры ($1), белый список идентификаторов, format(%I, %L), минимальные права роли." },
    { id: "sql.sql-security.f2", front: "Склейка vs параметр (замер)?", back: "x' OR '1'='1: склейка — 3 строки, параметр — 0. «; DELETE FROM users»: склейка 3 → 0 строк, параметр — 3." },
    { id: "sql.sql-security.f3", front: "Наименьшие привилегии?", back: "Роль получает только нужное: GRANT SELECT (столбцы), SELECT/INSERT; всё остальное — permission denied. Приложение не суперпользователь." },
    { id: "sql.sql-security.f4", front: "RLS?", back: "ENABLE ROW LEVEL SECURITY + CREATE POLICY USING (видимость) WITH CHECK (запись). Владелец и superuser обходят; FORCE для владельца." },
    { id: "sql.sql-security.f5", front: "SECURITY DEFINER?", back: "Функция с правами владельца: доступ к агрегатам без доступа к таблице. Обязательно SET search_path и REVOKE ALL FROM PUBLIC." },
    { id: "sql.sql-security.f6", front: "Схема public (PG 15+)?", back: "У обычных ролей нет CREATE в public (USAGE остаётся). В старых кластерах: REVOKE CREATE ON SCHEMA public FROM PUBLIC." },
    { id: "sql.sql-security.f7", front: "Пароли?", back: "Хеш с солью медленной функцией (bcrypt, scrypt, Argon2); одинаковые пароли — разные хеши. Не открытый текст и не быстрый хеш." },
    { id: "sql.sql-security.f8", front: "Динамический SQL?", back: "EXECUTE 'DELETE FROM ' || tbl — инъекция. Безопасно: format('… %I', tbl), %L для значений, EXECUTE … USING, белый список." },
  ],

  sources: [
    { title: "PostgreSQL 16: Privileges", url: "https://www.postgresql.org/docs/16/ddl-priv.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: GRANT", url: "https://www.postgresql.org/docs/16/sql-grant.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Row Security Policies", url: "https://www.postgresql.org/docs/16/ddl-rowsecurity.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: CREATE FUNCTION (writing SECURITY DEFINER functions safely)", url: "https://www.postgresql.org/docs/16/sql-createfunction.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Executing Dynamic Commands (PL/pgSQL)", url: "https://www.postgresql.org/docs/16/plpgsql-statements.html#PLPGSQL-STATEMENTS-EXECUTING-DYN", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Schemas — usage patterns", url: "https://www.postgresql.org/docs/16/ddl-schemas.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: pgcrypto", url: "https://www.postgresql.org/docs/16/pgcrypto.html", publisher: "PostgreSQL" },
    { title: "OWASP: SQL Injection Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html", publisher: "Other" },
  ],
};
