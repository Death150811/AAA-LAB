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

export const schemaPatterns: Topic = {
  id: "sql.schema-patterns",
  slug: "schema-patterns",
  domain: "sql",
  module: "design",
  title: "Паттерны проектирования схем: статусы, удаление, история, иерархии",
  titleEn: "Schema Design Patterns: Statuses, Deletion, History, Hierarchies",
  summary:
    "Типовые задачи схемы имеют типовые решения — и типовые ловушки. Тема на замерах PostgreSQL 16.14 и SQLite 3.49 разбирает: допустимые значения (справочник против `CHECK` и `ENUM`: порядок enum — по объявлению, значение вне списка отклонено), идентификаторы (откат оставил «дыру»: id 1 и 3), мягкое удаление (частичный уникальный индекс позволил повторно занять email, обычный `UNIQUE` — отказал), историю (цена на дату заказа 11 800 против 12 200 по нынешним ценам; перекрывающийся период отклонён ограничением-исключением; триггер записал INSERT, UPDATE, DELETE), гибкие атрибуты (EAV требует самосоединений, `jsonb @>` — один оператор), деньги (`float`: 0.1 + 0.2 ≠ 0.3, тысяча платежей по 0,10 дала 99.9999999999986; `numeric` — ровно 100.00) и три способа хранить дерево (перенос команды Ольги: 1 строка в списке смежности, 3 в пути, 6 + 6 в таблице замыканий).",
  minutes: 100,
  prerequisites: ["sql.normalization", "sql.relationships", "sql.keys-constraints"],
  tags: ["schema design", "lookup table", "enum", "surrogate key", "identity", "soft delete", "partial index", "temporal data", "audit log", "trigger", "EAV", "jsonb", "money", "numeric", "adjacency list", "materialized path", "closure table", "ltree", "exclusion constraint"],
  keyConcepts: [
    { term: "Допустимые значения — справочник, CHECK или ENUM", text: "Справочник со внешним ключом меняется вставкой строки (новый статус `refunded` — один `INSERT`), `ENUM` PostgreSQL сортируется в порядке объявления (`draft`, `sent`, `accepted`), `CHECK` со списком требует изменения схемы." },
    { term: "Идентификаторы не обязаны идти подряд", text: "Последовательность не откатывается: после `ROLLBACK` вторая вставка получила id 3, а не 2. Разрывы нумерации — норма, а не ошибка." },
    { term: "Мягкое удаление требует частичного уникального индекса", text: "`UNIQUE (email) WHERE deleted_at IS NULL` позволил зарегистрировать тот же email повторно (3 строки, 2 активные); обычный `UNIQUE` ответил `duplicate key`." },
    { term: "История — это данные с периодом действия", text: "Цена на дату заказа даёт выручку 11 800 против 12 200 по нынешним ценам; граница периода — `[valid_from, valid_to)`: 2024-03-01 уже по новой цене." },
    { term: "Гибкие атрибуты: JSONB лучше EAV", text: "Условие «цвет red и размер L» в EAV — самосоединение таблицы атрибутов, в `jsonb` — `attrs @> '{...}'`; а числа в EAV-текстах сравниваются как строки (вес 300 не прошёл `> '50'`)." },
    { term: "Деньги — numeric или целые минимальные единицы", text: "`float8`: `0.1 + 0.2` не равно `0.3`; сумма тысячи по 0,10 — `99.9999999999986`; `numeric` дал ровно `100.00`." },
    { term: "Дерево можно хранить тремя способами", text: "Перенос команды Ольги (3 человека): список смежности — 1 строка, материализованный путь — 3 строки, таблица замыканий — 6 удалённых и 6 добавленных. После переноса все три способа показали 8 подчинённых Фёдора." },
  ],
  sections: [
    section("definition", [
      def("Справочник (lookup-таблица)", "Таблица допустимых значений (статусы, страны, категории), на которую ссылаются внешние ключи; значения меняются данными, а не схемой.", "lookup table"),
      def("Суррогатный ключ", "Искусственный идентификатор (`id`), не несущий смысла предметной области и не меняющийся при изменении данных.", "surrogate key"),
      def("Мягкое удаление", "Пометка строки удалённой (`deleted_at`) вместо физического `DELETE`: строка остаётся для истории и ссылок.", "soft delete"),
      def("Частичный индекс", "Индекс, построенный только по строкам, удовлетворяющим условию (`WHERE deleted_at IS NULL`); позволяет делать уникальность «среди активных».", "partial index"),
      def("Темпоральные данные", "Данные с периодом действия (`valid_from`, `valid_to`): позволяют узнать значение на любую дату.", "temporal data"),
      def("Журнал изменений (аудит)", "Таблица, в которую триггер или приложение записывают, кто и что изменил: старое и новое состояние строки.", "audit log"),
      def("EAV", "Entity–Attribute–Value: атрибуты хранятся строками «сущность — имя — значение»; гибко, но ломает типы, ограничения и запросы.", "entity-attribute-value"),
      def("Список смежности, материализованный путь, таблица замыканий", "Три способа хранить деревья: ссылка на родителя; путь от корня строкой; все пары «предок — потомок».", "adjacency list / materialized path / closure table"),
    ]),

    section("why", [
      h("Одни и те же задачи — на каждом проекте"),
      p("У любой бизнес-системы есть статусы, удаляемые записи, история изменений цен, гибкие характеристики товаров, деньги и деревья категорий. Каждый раз изобретать решение заново — значит повторять известные ошибки: «удалили пользователя — email навсегда занят», «поменяли цену — старые заказы пересчитались», «в таблице атрибутов вес — текст». Паттерны — это проверенные решения вместе со знанием цены, которую за них платят."),
      ul(
        "**Статусы и справочники:** как добавить значение, не меняя схему и не ломая порядок.",
        "**Удаление:** как сохранить историю и связи, но не блокировать повторное использование уникальных значений.",
        "**История:** цена на дату, журнал изменений, неизменность прошлого.",
        "**Гибкие данные:** где остановиться между «схемой на всё» и «JSON на всё».",
        "**Деньги и деревья:** ошибки точности и стоимость изменений структуры.",
      ),
      note("Паттерн — не обязанность. Каждый из них добавляет столбцы, ограничения и правила в запросах; применяйте его, когда проблема реальна, а не «на будущее»."),
    ]),

    section("mental-model", [
      h("Каждый паттерн — компромисс с видимой ценой"),
      p("Мягкое удаление сохраняет историю, но каждый запрос теперь обязан помнить про `deleted_at IS NULL`. История цен делает выручку правильной, но усложняет соединение. `jsonb` даёт гибкость, но отдаёт проверку типов приложению. Хороший проектировщик не выбирает «лучший» паттерн, а называет, **за что именно** платит и кто эту цену оплачивает: запросы, миграции, место на диске или внимательность разработчиков."),
      diagram(
        `
        Задача                          Паттерн                         Цена
        ──────────────────────────────  ──────────────────────────────  ─────────────────────────────
        Допустимые значения             справочник + FK / ENUM / CHECK  ENUM: сложнее менять; CHECK: миграция
        Идентификатор                   суррогатный id (identity)       дыры в нумерации
        «Удалить», но помнить           deleted_at + частичный индекс   фильтр во всех запросах
        Значение на дату                период [from, to)               соединение по периоду
        Что и кто менял                 журнал (триггер)                замедление записи, рост таблицы
        Разные атрибуты у товаров       jsonb (не EAV)                  типы и ограничения — на вас
        Деньги                          numeric / целые копейки         —
        Дерево                          смежность / путь / замыкание    скорость чтения ↔ цена переноса
        `,
        "Паттерны и цена, которую за них платят.",
      ),
      h("Как выбирать"),
      steps(
        [
          ["Назвать проблему", "Какой сбой или неудобство вы устраняете: потеря истории, занятый email, неверные суммы?"],
          ["Подобрать паттерн", "Сопоставить с типовым решением и выписать его цену."],
          ["Проверить на данных", "Воспроизвести проблему и решение коротким скриптом (как в примерах темы)."],
          ["Закрепить ограничением", "Правило должно защищаться схемой, а не только кодом."],
          ["Записать решение", "Один абзац в документации схемы: что выбрано, почему, какая цена."],
        ],
        "Применение паттерна",
      ),
    ]),

    section("technical", [
      h("Допустимые значения"),
      table(
        ["Способ", "Как менять набор", "Плюсы", "Минусы"],
        [
          ["Справочник + внешний ключ", "`INSERT INTO statuses`", "Данные, а не схема; дополнительные столбцы (название, `is_final`)", "Соединение для отображения"],
          ["`CHECK (status IN (…))`", "`ALTER TABLE … DROP/ADD CONSTRAINT`", "Просто, без соединений", "Миграция при каждом изменении; нет метаданных"],
          ["`ENUM` (PostgreSQL)", "`ALTER TYPE … ADD VALUE`", "Компактно, порядок по объявлению", "Нельзя удалить значение; тип привязан к PostgreSQL"],
        ],
        "Способы хранить допустимые значения",
      ),
      h("Идентификаторы"),
      ul(
        "**Суррогатный `id`** (`GENERATED ALWAYS AS IDENTITY` в PostgreSQL) не меняется при правке данных и компактен для внешних ключей.",
        "**Естественный ключ** (`email`, код страны) оставляют `UNIQUE`, но не используют как ссылку, если он может измениться.",
        "**Нумерация с дырами** — свойство последовательностей: значение выдаётся и не возвращается при откате.",
        "**`UUID`** удобен для распределённых систем, но крупнее и хуже локален для индексов.",
      ),
      h("История и гибкие данные"),
      ul(
        "**Период действия:** `valid_from` включительно, `valid_to` исключительно (`[from, to)`); `NULL` в `valid_to` — «до сих пор».",
        "**Снимок значения:** копия цены в позиции заказа (`unit_price`) — самый простой способ зафиксировать прошлое.",
        "**Журнал (аудит):** триггер `AFTER INSERT OR UPDATE OR DELETE` пишет `old_row`/`new_row` в `jsonb`.",
        "**Системно-версионных таблиц SQL:2011** в PostgreSQL 16 нет: историю ведут таблицей периодов или журналом.",
        "**`jsonb`** подходит для редких и разнородных атрибутов; всё, что фильтруется и соединяется постоянно, лучше вынести в столбцы.",
      ),
      warn("Универсальные решения («одна таблица на всё», EAV, `target_type + target_id`) выглядят гибкими и разрушают проверки: типы, внешние ключи и ограничения перестают работать."),
    ]),

    section("syntax", [
      p("Мягкое удаление в чистом виде: столбец-метка и частичный уникальный индекс, который следит за уникальностью только среди «живых» строк."),
      annotated(
        "sql",
        `-- Мягкое удаление: строка остаётся в таблице, но помечена. Уникальность — только среди «живых» строк
CREATE TABLE users (
  id         integer PRIMARY KEY,
  email      text NOT NULL,
  deleted_at text
);
CREATE UNIQUE INDEX users_email_active ON users (email) WHERE deleted_at IS NULL;

INSERT INTO users VALUES (1, 'anna@example.com', NULL), (2, 'boris@example.com', NULL);
UPDATE users SET deleted_at = '2024-05-01' WHERE id = 1;       -- Анну «удалили»
INSERT INTO users VALUES (3, 'anna@example.com', NULL);        -- тот же email зарегистрирован заново

SELECT id, email, deleted_at FROM users ORDER BY id;
SELECT count(*) AS all_rows, count(*) FILTER (WHERE deleted_at IS NULL) AS active FROM users;`,
        [
          { line: 1, text: "Комментарий называет паттерн и его главный риск — конфликт уникальности." },
          { line: [2, 6], text: "Таблица пользователей с меткой `deleted_at`: `NULL` — активен, значение — когда «удалён» (в рабочей схеме — `timestamptz`)." },
          { line: 7, text: "Частичный уникальный индекс: `email` уникален только среди строк `WHERE deleted_at IS NULL` — «удалённые» адреса не мешают." },
          { line: 10, text: "«Удаление» Анны — обновление метки, строка остаётся (на неё могут ссылаться внешние ключи)." },
          { line: 11, text: "Тот же email зарегистрирован заново: индекс не видит удалённую строку, вставка проходит." },
          { line: [13, 14], text: "Проверка: в таблице 3 строки, из них 2 активные (`FILTER (WHERE deleted_at IS NULL)`)." },
        ],
        "02-soft-delete.sql",
      ),
      code("text", ` id |       email       | deleted_at 
----+-------------------+------------
  1 | anna@example.com  | 2024-05-01
  2 | boris@example.com | 
  3 | anna@example.com  | 
(3 rows)

 all_rows | active 
----------+--------
        3 |      2
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
    ]),

    section("minimal-example", [
      p("Справочник вместо жёсткого списка: новое допустимое значение — обычная вставка, а внешний ключ по-прежнему не пропускает ничего лишнего."),
      code("sql", `-- Допустимые значения статуса: справочник со внешним ключом вместо CHECK со списком
CREATE TABLE order_statuses (code text PRIMARY KEY, title text NOT NULL, is_final integer NOT NULL DEFAULT 0);
INSERT INTO order_statuses VALUES ('new', 'Новый', 0), ('paid', 'Оплачен', 0), ('shipped', 'Отправлен', 1), ('cancelled', 'Отменён', 1);
CREATE TABLE orders2 (id integer PRIMARY KEY, status text NOT NULL REFERENCES order_statuses (code));
INSERT INTO orders2 VALUES (1, 'new'), (2, 'paid'), (3, 'paid'), (4, 'cancelled');

-- Новый статус — обычная вставка данных, а не изменение схемы
INSERT INTO order_statuses VALUES ('refunded', 'Возврат', 1);
UPDATE orders2 SET status = 'refunded' WHERE id = 4;

SELECT s.title, s.is_final, count(o.id) AS orders
FROM order_statuses AS s LEFT JOIN orders2 AS o ON o.status = s.code
GROUP BY s.code, s.title, s.is_final
ORDER BY s.code;`, { filename: "01-lookup.sql", runnable: true }),
      code("text", `   title   | is_final | orders 
-----------+----------+--------
 Отменён   |        1 |      0
 Новый     |        0 |      1
 Оплачен   |        0 |      2
 Возврат   |        1 |      1
 Отправлен |        1 |      0
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Статус `refunded` добавлен без изменения схемы, заказ 4 переведён в него; `LEFT JOIN` показывает и статусы без заказов (`Отменён`, `Отправлен` — 0). Столбец `is_final` — то, чего не дал бы `CHECK`: метаданные значения."),
      h("Перечисление PostgreSQL"),
      code("sql", `-- Перечисление PostgreSQL: порядок сортировки — порядок объявления значений, а не алфавит
CREATE TYPE offer_status AS ENUM ('draft', 'sent', 'accepted');
CREATE TABLE offers (id integer PRIMARY KEY, status offer_status NOT NULL);
INSERT INTO offers VALUES (1, 'accepted'), (2, 'draft'), (3, 'sent');
SELECT id, status FROM offers ORDER BY status;

-- Новое значение добавляется командой ALTER TYPE; позицию выбираем сами
ALTER TYPE offer_status ADD VALUE 'rejected' AFTER 'sent';
SELECT enumlabel, enumsortorder FROM pg_enum WHERE enumtypid = 'offer_status'::regtype ORDER BY enumsortorder;

-- Значения вне списка отклоняются
INSERT INTO offers VALUES (4, 'lost');`, { filename: "17-enum.pg.sql" }),
      code("text", ` id |  status  
----+----------
  2 | draft
  3 | sent
  1 | accepted
(3 rows)

 enumlabel | enumsortorder 
-----------+---------------
 draft     |             1
 sent      |             2
 rejected  |           2.5
 accepted  |             3
(4 rows)

ERROR:  invalid input value for enum offer_status: "lost"
LINE 1: INSERT INTO offers VALUES (4, 'lost');
                                      ^`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`ORDER BY status` дал `draft`, `sent`, `accepted` — порядок объявления, а не алфавит (алфавитно `accepted` шёл бы первым). Новое значение вставили между существующими (`enumsortorder = 2.5`), а значение вне списка отклонено. Удалить значение из `ENUM` нельзя — для часто меняющихся наборов берите справочник."),
    ]),

    section("detailed-example", [
      h("Идентификаторы и «дыры»"),
      code("sql", `-- Последовательности не откатываются: откат транзакции оставляет «дыру» в нумерации
CREATE TABLE tickets (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, title text NOT NULL);
INSERT INTO tickets (title) VALUES ('первый');
BEGIN;
INSERT INTO tickets (title) VALUES ('откатим');
ROLLBACK;
INSERT INTO tickets (title) VALUES ('третий');
SELECT id, title FROM tickets ORDER BY id;
-- Вручную задать идентификатор нельзя
INSERT INTO tickets (id, title) VALUES (10, 'свой номер');`, { filename: "18-identity.pg.sql" }),
      code("text", ` id | title  
----+--------
  1 | первый
  3 | третий
(2 rows)

ERROR:  cannot insert a non-DEFAULT value into column "id"
DETAIL:  Column "id" is an identity column defined as GENERATED ALWAYS.
HINT:  Use OVERRIDING SYSTEM VALUE to override.`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Откатанная вставка «съела» номер 2, поэтому «третий» получил id 3. Требовать «нумерацию без дыр» от `IDENTITY` бессмысленно: выдача номеров не участвует в откате транзакций. А `GENERATED ALWAYS` не позволил подставить свой id."),
      h("Мягкое удаление: что даёт обычный UNIQUE"),
      code("sql", `CREATE TABLE users (id integer PRIMARY KEY, email text NOT NULL UNIQUE, deleted_at timestamptz);
INSERT INTO users VALUES (1, 'anna@example.com', NULL);
UPDATE users SET deleted_at = now() WHERE id = 1;
-- Обычный UNIQUE не знает о «мягком» удалении
INSERT INTO users VALUES (2, 'anna@example.com', NULL);`, { filename: "03-soft-delete-conflict.pg.sql" }),
      code("text", `ERROR:  duplicate key value violates unique constraint "users_email_key"
DETAIL:  Key (email)=(anna@example.com) already exists.`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Обычное ограничение `UNIQUE (email)` считает «удалённую» строку живой: адрес навсегда занят. Частичный индекс (пример выше) решает это; альтернатива — не хранить удалённые данные в той же таблице (отдельный архив)."),
      h("История: цена на дату заказа"),
      code("sql", `-- История цен: у каждой цены период действия. Сумма позиции считается по цене на дату заказа
CREATE TABLE product_prices (
  product_id integer NOT NULL REFERENCES products (id),
  price      integer NOT NULL,
  valid_from date    NOT NULL,
  valid_to   date,                    -- NULL: действует до сих пор
  PRIMARY KEY (product_id, valid_from)
);
INSERT INTO product_prices VALUES
  (1, 1000, '2023-01-01', '2024-03-01'),
  (1, 1200, '2024-03-01', NULL),
  (4, 1700, '2023-01-01', '2024-05-01'),
  (4, 1900, '2024-05-01', NULL);

-- Позиции с кофе и френч-прессом: цена на дату заказа и нынешняя цена из products
SELECT o.id AS order_id, o.ordered_on, p.title,
       pp.price AS price_then, p.price AS price_now, oi.qty
FROM orders AS o
JOIN order_items    AS oi ON oi.order_id = o.id
JOIN products       AS p  ON p.id = oi.product_id
JOIN product_prices AS pp ON pp.product_id = p.id
                         AND o.ordered_on >= pp.valid_from
                         AND (pp.valid_to IS NULL OR o.ordered_on < pp.valid_to)
ORDER BY o.id, p.id;

-- Выручка по этим позициям: по ценам на дату заказа и по нынешним
SELECT sum(pp.price * oi.qty) AS revenue_then, sum(p.price * oi.qty) AS revenue_now
FROM orders AS o
JOIN order_items    AS oi ON oi.order_id = o.id
JOIN products       AS p  ON p.id = oi.product_id
JOIN product_prices AS pp ON pp.product_id = p.id
                         AND o.ordered_on >= pp.valid_from
                         AND (pp.valid_to IS NULL OR o.ordered_on < pp.valid_to);`, { filename: "04-history.sql", runnable: true, fixture: "shop" }),
      code("text", ` order_id | ordered_on |       title        | price_then | price_now | qty 
----------+------------+--------------------+------------+-----------+-----
        1 | 2024-01-10 | Кофе зерновой 1 кг |       1000 |   1200.00 |   1
        3 | 2024-02-20 | Френч-пресс        |       1700 |   1900.00 |   1
        4 | 2024-03-01 | Кофе зерновой 1 кг |       1200 |   1200.00 |   2
        8 | 2024-04-11 | Кофе зерновой 1 кг |       1200 |   1200.00 |   1
       10 | 2024-05-06 | Френч-пресс        |       1900 |   1900.00 |   1
       12 | 2024-06-01 | Кофе зерновой 1 кг |       1200 |   1200.00 |   3
(6 rows)

 revenue_then | revenue_now 
--------------+-------------
        11800 |    12200.00
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Соединение по периоду: `o.ordered_on >= pp.valid_from AND (pp.valid_to IS NULL OR o.ordered_on < pp.valid_to)`.",
        "Заказ 4 сделан 2024-03-01 — в день смены цены на кофе: граница исключающая, поэтому цена уже новая (1200).",
        "Выручка по этим позициям: 11 800 по ценам на дату заказа и 12 200 по нынешним ценам из `products` — разница 400 возникла бы в отчётах за прошлое.",
      ),
    ]),

    section("analysis", [
      table(
        ["Паттерн / проблема", "Результат (замер)", "Вывод"],
        [
          ["Справочник статусов", "Новый статус — один `INSERT`", "Набор значений — данные"],
          ["`ENUM` сортировка", "`draft`, `sent`, `accepted`", "Порядок объявления"],
          ["Откат вставки в `IDENTITY`", "id 1 и 3", "Дыры в нумерации — норма"],
          ["Мягкое удаление + частичный индекс", "3 строки, 2 активные", "Email можно занять повторно"],
          ["Цена на дату заказа", "11 800 против 12 200", "Прошлое не должно зависеть от нынешних цен"],
          ["EAV: «red и L»", "самосоединение; вес `> '50'` — пусто", "Типы и условия ломаются"],
          ["`float8` для денег", "`0.30000000000000004`; 99.9999999999986", "Нужен `numeric` или целые копейки"],
          ["Перенос команды Ольги", "1 / 3 / 6 + 6 строк", "Цена перемещения зависит от способа хранения дерева"],
        ],
        "Что показали замеры PostgreSQL 16.14",
      ),
      h("Журнал изменений триггером"),
      code("sql", `-- Журнал изменений: триггер записывает старое и новое состояние строки
CREATE TABLE accounts (id integer PRIMARY KEY, owner text NOT NULL, balance integer NOT NULL);
CREATE TABLE accounts_audit (
  id        bigserial PRIMARY KEY,
  op        text  NOT NULL,
  row_id    integer NOT NULL,
  old_row   jsonb,
  new_row   jsonb
);
CREATE FUNCTION accounts_audit_fn() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO accounts_audit (op, row_id, new_row) VALUES (TG_OP, NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO accounts_audit (op, row_id, old_row, new_row) VALUES (TG_OP, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSE
    INSERT INTO accounts_audit (op, row_id, old_row) VALUES (TG_OP, OLD.id, to_jsonb(OLD));
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER accounts_audit_trg AFTER INSERT OR UPDATE OR DELETE ON accounts
FOR EACH ROW EXECUTE FUNCTION accounts_audit_fn();

INSERT INTO accounts VALUES (1, 'Анна', 1000);
UPDATE accounts SET balance = balance - 300 WHERE id = 1;
DELETE FROM accounts WHERE id = 1;

SELECT id, op, old_row, new_row FROM accounts_audit ORDER BY id;`, { filename: "06-audit.pg.sql" }),
      code("text", ` id |   op   |                   old_row                   |                   new_row                   
----+--------+---------------------------------------------+---------------------------------------------
  1 | INSERT |                                             | {"id": 1, "owner": "Анна", "balance": 1000}
  2 | UPDATE | {"id": 1, "owner": "Анна", "balance": 1000} | {"id": 1, "owner": "Анна", "balance": 700}
  3 | DELETE | {"id": 1, "owner": "Анна", "balance": 700}  | 
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Три операции — три записи: вставка (только `new_row`), обновление (баланс 1000 → 700 в обоих состояниях), удаление (только `old_row`). Журнал восстанавливает историю строки, но замедляет запись и растёт; для аудита добавляют пользователя и время (`current_user`, `now()`), а таблицу журнала разбивают по периодам."),
      h("Периоды без перекрытий"),
      code("sql", `-- PostgreSQL запрещает перекрывающиеся периоды ограничением-исключением (нужно расширение btree_gist)
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE product_prices (
  product_id integer NOT NULL,
  price      integer NOT NULL,
  period     daterange NOT NULL,
  EXCLUDE USING gist (product_id WITH =, period WITH &&)
);
INSERT INTO product_prices VALUES (1, 1000, '[2023-01-01,2024-03-01)');
INSERT INTO product_prices VALUES (1, 1200, '[2024-03-01,)');
-- Период, перекрывающий существующий
INSERT INTO product_prices VALUES (1, 1100, '[2024-02-01,2024-04-01)');
SELECT product_id, price, period FROM product_prices ORDER BY period;`, { filename: "05-no-overlap.pg.sql" }),
      code("text", `ERROR:  conflicting key value violates exclusion constraint "product_prices_product_id_period_excl"
DETAIL:  Key (product_id, period)=(1, [2024-02-01,2024-04-01)) conflicts with existing key (product_id, period)=(1, [2023-01-01,2024-03-01)).
 product_id | price |         period          
------------+-------+-------------------------
          1 |  1000 | [2023-01-01,2024-03-01)
          1 |  1200 | [2024-03-01,)
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Ограничение-исключение `EXCLUDE USING gist (product_id WITH =, period WITH &&)` отклонило период, пересекающийся с существующим для того же товара. Без него нарушения («две цены в один день») выявляются только запросом-проверкой."),
    ]),

    section("internals", [
      h("Гибкие атрибуты: EAV и jsonb"),
      code("sql", `-- EAV («сущность — атрибут — значение»): гибко, но каждое условие — ещё одно соединение или сводка
CREATE TABLE product_attrs (product_id integer NOT NULL, attr text NOT NULL, value text NOT NULL, PRIMARY KEY (product_id, attr));
INSERT INTO product_attrs VALUES
  (1, 'color', 'red'),   (1, 'size', 'L'), (1, 'weight', '300'),
  (2, 'color', 'red'),   (2, 'size', 'M'),
  (3, 'color', 'green'), (3, 'size', 'L');

-- Товары, у которых цвет red И размер L: самосоединение по каждому атрибуту
SELECT a.product_id
FROM product_attrs AS a
JOIN product_attrs AS b ON b.product_id = a.product_id
WHERE a.attr = 'color' AND a.value = 'red'
  AND b.attr = 'size'  AND b.value = 'L';

-- Веса хранятся текстом: сравнение «больше 50» работает как сравнение строк
SELECT product_id, value FROM product_attrs WHERE attr = 'weight' AND value > '50';`, { filename: "07-eav.sql", runnable: true }),
      code("text", ` product_id 
------------
          1
(1 row)

 product_id | value 
------------+-------
(0 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      code("sql", `-- Атрибуты в jsonb: условие по нескольким ключам — один оператор содержания
CREATE TABLE products_j (id integer PRIMARY KEY, title text NOT NULL, attrs jsonb NOT NULL DEFAULT '{}');
INSERT INTO products_j VALUES
  (1, 'Футболка',  '{"color": "red",   "size": "L", "weight": 300}'),
  (2, 'Кепка',     '{"color": "red",   "size": "M"}'),
  (3, 'Рюкзак',    '{"color": "green", "size": "L"}');
CREATE INDEX products_j_attrs_gin ON products_j USING gin (attrs);

SELECT id, title FROM products_j WHERE attrs @> '{"color": "red", "size": "L"}';
-- Числовое значение остаётся числом: сравнение настоящее
SELECT id, title FROM products_j WHERE (attrs->>'weight')::int > 50;`, { filename: "08-jsonb.pg.sql" }),
      code("text", ` id |  title   
----+----------
  1 | Футболка
(1 row)

 id |  title   
----+----------
  1 | Футболка
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "EAV: условие по двум атрибутам — самосоединение таблицы атрибутов; каждое следующее условие — ещё одно.",
        "В EAV значения — текст: вес `'300'` сравнивается как строка, и `> '50'` не нашёл его (пустой результат).",
        "`jsonb`: `attrs @> '{\"color\": \"red\", \"size\": \"L\"}'` — один оператор, поддерживается GIN-индексом; числовой вес остаётся числом (`(attrs->>'weight')::int > 50`).",
        "Платите вы за это: ограничения (`NOT NULL`, внешние ключи) на ключи внутри `jsonb` не наложить — часто используемые атрибуты лучше вынести в столбцы.",
      ),
      h("Деньги"),
      code("sql", `-- Деньги: двоичные дроби дают погрешность, numeric и целые копейки — нет
SELECT 0.1::float8 + 0.2::float8 AS float_sum,
       (0.1::float8 + 0.2::float8 = 0.3::float8) AS float_equal,
       0.1::numeric + 0.2::numeric AS numeric_sum,
       (0.1::numeric + 0.2::numeric = 0.3::numeric) AS numeric_equal;

-- Тысяча платежей по 0,10: сумма в двоичной дроби и в numeric
SELECT sum(0.10::float8) AS float_total, sum(0.10::numeric) AS numeric_total
FROM generate_series(1, 1000);`, { filename: "09-money.pg.sql" }),
      code("text", `      float_sum      | float_equal | numeric_sum | numeric_equal 
---------------------+-------------+-------------+---------------
 0.30000000000000004 | f           |         0.3 | t
(1 row)

   float_total    | numeric_total 
------------------+---------------
 99.9999999999986 |        100.00
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Двоичные числа с плавающей точкой не представляют `0.1` точно: сумма 1000 платежей по 0,10 — `99.9999999999986`, а `numeric` даёт ровно `100.00`. Для денег используйте `numeric(p, s)` или целые минимальные единицы (копейки) с отдельным столбцом валюты."),
      h("Деревья: три способа и цена перемещения"),
      code("sql", `-- Три способа хранить дерево: список смежности, материализованный путь и таблица замыканий (подчинённые Павла)
CREATE TABLE emp_path AS
WITH RECURSIVE t(id, name, manager_id, path) AS (
  SELECT id, name, manager_id, '/' || id || '/' FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.manager_id, t.path || e.id || '/' FROM employees AS e JOIN t ON e.manager_id = t.id
)
SELECT id, name, path FROM t;

CREATE TABLE emp_closure (ancestor integer NOT NULL, descendant integer NOT NULL, depth integer NOT NULL, PRIMARY KEY (ancestor, descendant));
INSERT INTO emp_closure
WITH RECURSIVE c(ancestor, descendant, depth) AS (
  SELECT id, id, 0 FROM employees
  UNION ALL
  SELECT c.ancestor, e.id, c.depth + 1 FROM employees AS e JOIN c ON e.manager_id = c.descendant
)
SELECT ancestor, descendant, depth FROM c;

-- Подчинённые Павла (id 2), без него самого — тремя способами
SELECT 'смежность (рекурсивный CTE)' AS method, count(*) AS n FROM (
  WITH RECURSIVE s(id) AS (SELECT id FROM employees WHERE manager_id = 2 UNION ALL SELECT e.id FROM employees AS e JOIN s ON e.manager_id = s.id)
  SELECT id FROM s) AS x
UNION ALL
SELECT 'путь (LIKE по префиксу)', count(*) FROM emp_path WHERE path LIKE '/1/2/%' AND id <> 2
UNION ALL
SELECT 'замыкание (один JOIN)', count(*) FROM emp_closure WHERE ancestor = 2 AND depth > 0;`, { filename: "10-tree.sql", runnable: true, fixture: "staff" }),
      code("text", `           method            | n 
-----------------------------+---
 смежность (рекурсивный CTE) | 4
 путь (LIKE по префиксу)     | 4
 замыкание (один JOIN)       | 4
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Подчинённых Павла три способа дали одинаково — четыре. Различие — в цене изменений:"),
      code("sql", `-- Цена перемещения: перевести Ольгу (id 3) с командой от Павла (id 2) к Фёдору (id 7)
CREATE TABLE emp_path AS
WITH RECURSIVE t(id, name, manager_id, path) AS (
  SELECT id, name, manager_id, '/' || id || '/' FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.manager_id, t.path || e.id || '/' FROM employees AS e JOIN t ON e.manager_id = t.id
)
SELECT id, name, manager_id, path FROM t;
CREATE TABLE emp_closure (ancestor integer NOT NULL, descendant integer NOT NULL, depth integer NOT NULL, PRIMARY KEY (ancestor, descendant));
INSERT INTO emp_closure
WITH RECURSIVE c(ancestor, descendant, depth) AS (
  SELECT id, id, 0 FROM employees
  UNION ALL
  SELECT c.ancestor, e.id, c.depth + 1 FROM employees AS e JOIN c ON e.manager_id = c.descendant
)
SELECT ancestor, descendant, depth FROM c;

-- Список смежности: меняется одна строка
WITH moved AS (UPDATE employees SET manager_id = 7 WHERE id = 3 RETURNING id)
SELECT count(*) AS adjacency_rows_changed FROM moved;

-- Материализованный путь: переписывается путь у всех строк поддерева
WITH moved AS (
  UPDATE emp_path SET path = '/1/7/' || substr(path, length('/1/2/') + 1) WHERE path LIKE '/1/2/3/%' RETURNING id
)
SELECT count(*) AS path_rows_rewritten FROM moved;

-- Таблица замыканий: удалить связи поддерева со старыми предками и добавить новые
WITH gone AS (
  DELETE FROM emp_closure
  WHERE descendant IN (SELECT descendant FROM emp_closure WHERE ancestor = 3)
    AND ancestor IN (SELECT ancestor FROM emp_closure WHERE descendant = 3 AND ancestor <> 3)
  RETURNING 1
)
SELECT count(*) AS closure_rows_deleted FROM gone;
WITH added AS (
  INSERT INTO emp_closure
  SELECT a.ancestor, d.descendant, a.depth + d.depth + 1
  FROM emp_closure AS a CROSS JOIN emp_closure AS d
  WHERE a.descendant = 7 AND d.ancestor = 3
  RETURNING 1
)
SELECT count(*) AS closure_rows_added FROM added;

-- После перемещения три способа согласованы: у Фёдора 8 подчинённых (было 5)
SELECT 'смежность' AS method, count(*) AS n FROM (
  WITH RECURSIVE s(id) AS (SELECT id FROM employees WHERE manager_id = 7 UNION ALL SELECT e.id FROM employees AS e JOIN s ON e.manager_id = s.id)
  SELECT id FROM s) AS x
UNION ALL
SELECT 'путь', count(*) FROM emp_path WHERE path LIKE '/1/7/%' AND id <> 7
UNION ALL
SELECT 'замыкание', count(*) FROM emp_closure WHERE ancestor = 7 AND depth > 0;`, { filename: "11-tree-move.pg.sql" }),
      code("text", ` adjacency_rows_changed 
------------------------
                      1
(1 row)

 path_rows_rewritten 
---------------------
                   3
(1 row)

 closure_rows_deleted 
----------------------
                    6
(1 row)

 closure_rows_added 
--------------------
                  6
(1 row)

  method   | n 
-----------+---
 смежность | 8
 путь      | 8
 замыкание | 8
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      table(
        ["Способ", "Чтение поддерева", "Перенос команды из 3 человек (замер)"],
        [
          ["Список смежности (`manager_id`)", "Рекурсивный CTE", "1 строка"],
          ["Материализованный путь (`/1/2/3/`)", "`LIKE 'префикс%'` (быстро с индексом)", "3 строки (путь каждого)"],
          ["Таблица замыканий", "Один `JOIN` без рекурсии", "6 удалено + 6 добавлено"],
        ],
        "Способы хранения иерархий",
      ),
      p("После переноса все три способа согласованно показали 8 подчинённых Фёдора (было 5). Выбор зависит от соотношения чтений и перемещений: смежность — просто и дёшево менять, путь и замыкание — быстро читать большие поддеревья. В PostgreSQL для пути есть расширение `ltree`."),
    ]),

    section("mistakes", [
      h("Ошибка: «удалять» физически там, где нужна история"),
      p("Физический `DELETE` ломает ссылки (или запрещён внешним ключом) и стирает данные, нужные для отчётов и аудита. Для сущностей, на которые ссылаются заказы и платежи, обычно применяют архивирование (`deleted_at`, `archived_at`)."),
      h("Ошибка: мягкое удаление без частичного индекса"),
      wrongRight(
        "sql",
        { title: "Обычный UNIQUE", code: `CREATE TABLE users (id integer PRIMARY KEY, email text NOT NULL UNIQUE, deleted_at timestamptz);`, note: "«Удалённый» email навсегда занят: повторная регистрация даёт `duplicate key` (замер)." },
        { title: "Частичный уникальный индекс", code: `CREATE UNIQUE INDEX users_email_active ON users (email) WHERE deleted_at IS NULL;`, note: "Уникальность только среди активных строк; повторная регистрация проходит (3 строки, 2 активные)." },
      ),
      h("Ошибка: забыть фильтр deleted_at"),
      code("sql", `CREATE TABLE users (id integer PRIMARY KEY, email text NOT NULL, deleted_at text);
INSERT INTO users VALUES (1, 'anna@example.com', NULL), (2, 'boris@example.com', '2024-03-01'), (3, 'vera@example.com', NULL);
CREATE TABLE logins (user_id integer NOT NULL REFERENCES users (id), at text NOT NULL);
INSERT INTO logins VALUES (1, '2024-04-01'), (2, '2024-02-01'), (3, '2024-04-02'), (3, '2024-04-03');

-- Отчёт «сколько у нас пользователей и входов» считает и удалённых
SELECT count(DISTINCT u.id) AS users, count(l.at) AS logins
FROM users AS u LEFT JOIN logins AS l ON l.user_id = u.id;`, { filename: "13-ex-fix.sql", runnable: true }),
      code("text", ` users | logins 
-------+--------
     3 |      4
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Отчёт посчитал и удалённого Бориса: 3 пользователя и 4 входа вместо 2 и 3. Фильтр в каждом запросе обязательно забудут — вынесите его в представление (`active_users`)."),
      h("Ошибка: хранить прошлое ссылкой на нынешнее значение"),
      p("Заказ ссылается на товар, цена берётся из `products.price` — после изменения цены старые заказы «пересчитываются». Фиксируйте цену в позиции (`unit_price`) или ведите историю периодов."),
      h("Ошибка: float для денег"),
      p("`0.1 + 0.2 = 0.30000000000000004`, а сумма тысячи платежей по 0,10 — `99.9999999999986`. Используйте `numeric` или целые копейки."),
      h("Ошибка: EAV «чтобы не менять схему»"),
      p("Все значения — текст, нет ограничений и внешних ключей, а каждый фильтр — самосоединение. Для редких разнородных атрибутов берите `jsonb`, для постоянных — столбцы."),
      h("Ошибка: требовать нумерацию без дыр"),
      p("Откат оставляет «дыры» в `IDENTITY`/`SERIAL`. Если нужны подряд идущие номера (счета для налоговой), выделяйте их отдельным, осознанно блокирующим механизмом."),
    ]),

    section("antipatterns", [
      ul(
        "**`CHECK (status IN (…))` в десятках таблиц:** изменение набора — миграция всех.",
        "**Естественный ключ, который меняется** (`email`, `phone`), как внешний ключ.",
        "**Мягкое удаление без представления и без частичного индекса.**",
        "**Единая таблица «журнал всего»** без структуры и индексов.",
        "**EAV / «универсальные» таблицы атрибутов** для данных, которые фильтруются и соединяются.",
        "**`float`/`double` для денег.**",
        "**Дерево как строка с запятыми** (`'1,2,3'`) без ограничений и индексов.",
        "**Хранение прошлого ссылками на изменяемые справочные значения.**",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Допустимые значения** — справочник (меняется данными), `ENUM` только для стабильных наборов.",
        "**Суррогатный `id`** + `UNIQUE` на естественных ключах.",
        "**Не обещайте нумерацию без дыр** на уровне `IDENTITY`.",
        "**Мягкое удаление** — `deleted_at`, частичные уникальные индексы и представление «активных».",
        "**Прошлое фиксируйте:** снимок значения в позиции или таблица периодов `[from, to)`; в PostgreSQL — ограничение-исключение против перекрытий.",
        "**Журнал изменений** — триггер с `jsonb`, пользователь и время; план очистки и партиционирования.",
        "**Гибкие атрибуты** — `jsonb` с GIN-индексом; частые поля — столбцы.",
        "**Деньги** — `numeric(p, s)` или целые копейки; валюта отдельным столбцом.",
        "**Иерархии** — смежность по умолчанию; путь или замыкание, когда чтений много, а перемещений мало.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Периоды с `NULL` в `valid_to`:** сравнения нужно писать `valid_to IS NULL OR …`; PostgreSQL умеет `daterange`/`tstzrange` с открытой границей.",
        "**Часовые пояса и истории:** метки журнала — `timestamptz`, иначе перевод времени порождает неоднозначные записи.",
        "**Триггерный аудит и массовые операции:** триггер на строку срабатывает для каждой; для больших `UPDATE` это заметная нагрузка.",
        "**Мягкое удаление и внешние ключи:** дочерние строки остаются ссылаться на «удалённого» родителя — это ожидаемо, но отчёты должны это учитывать.",
        "**Права и персональные данные:** мягкое удаление не удаляет данные физически; требования о стирании (GDPR, 152-ФЗ) нужно закрывать отдельной процедурой.",
        "**SQLite:** частичные индексы поддерживаются, `ENUM`, `daterange`, `EXCLUDE`, `jsonb` — нет; в песочнице курса соответствующие примеры помечены как PostgreSQL.",
      ),
    ]),

    section("related", [
      ul(
        "[Нормализация](/learn/sql/normalization) — зачем разделять факты и когда копия допустима.",
        "[Связи между таблицами](/learn/sql/relationships) — внешние ключи, каскады и исключающая дуга.",
        "[Ключи и ограничения](/learn/sql/keys-constraints) — `UNIQUE`, `CHECK`, составные ключи.",
        "[Рекурсивные CTE](/learn/sql/recursive-ctes) — чтение иерархий в списке смежности.",
        "[Индексы и B-дерево](/learn/sql/indexes-btree) — частичные индексы и индексы для путей.",
        "[Миграции и безопасный DDL](/learn/sql/migrations-safe-ddl) — как добавить `deleted_at`, журнал или справочник на живой базе.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Цена из текущего справочника",
          code: `
            SELECT o.id, sum(p.price * oi.qty) AS total
            FROM orders AS o
            JOIN order_items AS oi ON oi.order_id = o.id
            JOIN products AS p ON p.id = oi.product_id
            GROUP BY o.id;
          `,
          note: "После изменения цены в `products` старые заказы получают новые суммы: выручка прошлого меняется (в замере 12 200 вместо 11 800).",
        },
        {
          title: "Цена на дату заказа",
          code: `
            JOIN product_prices AS pp ON pp.product_id = p.id
                                     AND o.ordered_on >= pp.valid_from
                                     AND (pp.valid_to IS NULL OR o.ordered_on < pp.valid_to)
          `,
          note: "Период `[valid_from, valid_to)` фиксирует цену на дату: выручка прошлого не меняется (11 800). Проще и надёжнее — копия цены в позиции заказа.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.schema-patterns.ex1",
      title: "Предскажите итог мягкого удаления",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Таблица `users` с частичным уникальным индексом `email WHERE deleted_at IS NULL`. Предскажите итог: сколько строк в таблице и сколько из них активных. Обратите внимание на третью вставку (`ON CONFLICT DO NOTHING`)."),
        code("sql", `CREATE TABLE users (id integer PRIMARY KEY, email text NOT NULL, deleted_at text);
CREATE UNIQUE INDEX users_email_active ON users (email) WHERE deleted_at IS NULL;

INSERT INTO users VALUES (1, 'a@example.com', NULL);
UPDATE users SET deleted_at = '2024-01-01' WHERE id = 1;
INSERT INTO users VALUES (2, 'a@example.com', NULL);
INSERT INTO users VALUES (3, 'a@example.com', NULL) ON CONFLICT DO NOTHING;

SELECT count(*) AS total, count(*) FILTER (WHERE deleted_at IS NULL) AS active FROM users;`, { filename: "12-ex-predict.sql", runnable: true }),
      ],
      hints: ["Видит ли индекс удалённую строку 1 при второй вставке?", "Что произойдёт с третьей вставкой, когда активный адрес уже занят строкой 2?"],
      checks: ["Всего строк: 2", "Активных: 1"],
      solution: [
        code("text", ` total | active 
-------+--------
     2 |      1
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "Строка 1 «удалена» — индекс её не учитывает, поэтому строка 2 с тем же email вставилась.",
          "Строка 3 конфликтует с активной строкой 2, и `ON CONFLICT DO NOTHING` её молча пропустил. Итого 2 строки, 1 активная.",
        ),
      ],
    }),
    exercise({
      id: "sql.schema-patterns.ex2",
      title: "Удалённые попадают в отчёт",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Отчёт «сколько пользователей и входов» считает и «удалённого» Бориса. Исправьте так, чтобы фильтр не приходилось помнить в каждом запросе."),
        code("sql", `CREATE TABLE users (id integer PRIMARY KEY, email text NOT NULL, deleted_at text);
INSERT INTO users VALUES (1, 'anna@example.com', NULL), (2, 'boris@example.com', '2024-03-01'), (3, 'vera@example.com', NULL);
CREATE TABLE logins (user_id integer NOT NULL REFERENCES users (id), at text NOT NULL);
INSERT INTO logins VALUES (1, '2024-04-01'), (2, '2024-02-01'), (3, '2024-04-02'), (3, '2024-04-03');

-- Отчёт «сколько у нас пользователей и входов» считает и удалённых
SELECT count(DISTINCT u.id) AS users, count(l.at) AS logins
FROM users AS u LEFT JOIN logins AS l ON l.user_id = u.id;`, { filename: "13-ex-fix.sql", runnable: true }),
      ],
      hints: ["Как гарантировать, что приложение видит только «живых» пользователей?", "Что поменять во `FROM` отчёта?"],
      checks: ["Представление `active_users`", "Отчёт читает представление: 2 пользователя и 3 входа"],
      solution: [
        code("sql", `CREATE TABLE users (id integer PRIMARY KEY, email text NOT NULL, deleted_at text);
INSERT INTO users VALUES (1, 'anna@example.com', NULL), (2, 'boris@example.com', '2024-03-01'), (3, 'vera@example.com', NULL);
CREATE TABLE logins (user_id integer NOT NULL REFERENCES users (id), at text NOT NULL);
INSERT INTO logins VALUES (1, '2024-04-01'), (2, '2024-02-01'), (3, '2024-04-02'), (3, '2024-04-03');

-- Фильтр «только живые» выносим в представление: приложение читает его, а не таблицу
CREATE VIEW active_users AS SELECT id, email FROM users WHERE deleted_at IS NULL;

SELECT count(DISTINCT u.id) AS users, count(l.at) AS logins
FROM active_users AS u LEFT JOIN logins AS l ON l.user_id = u.id;`, { filename: "14-fix-solution.sql", runnable: true }),
        code("text", ` users | logins 
-------+--------
     2 |      3
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Представление `active_users` содержит только строки с `deleted_at IS NULL`; отчёт обращается к нему, а не к таблице, и показывает 2 пользователя и 3 входа. Вход удалённого Бориса отсеялся вместе с ним, потому что `LEFT JOIN` идёт от представления."),
      ],
    }),
    exercise({
      id: "sql.schema-patterns.ex3",
      title: "Цена на дату и граница периода",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("У кофе две цены: 1000 до 2024-03-01 и 1200 с этой даты. Напишите запрос, возвращающий цену на каждую из дат 2024-02-15, 2024-02-29, 2024-03-01, 2024-12-31 (даты лежат в таблице `probe_days`). Периоды трактуются как `[valid_from, valid_to)`. Заготовка (таблицы и даты):"),
        code("sql", `CREATE TABLE product_prices (
  product_id integer NOT NULL REFERENCES products (id),
  price      integer NOT NULL,
  valid_from date    NOT NULL,
  valid_to   date,
  PRIMARY KEY (product_id, valid_from)
);
INSERT INTO product_prices VALUES (1, 1000, '2023-01-01', '2024-03-01'), (1, 1200, '2024-03-01', NULL);
CREATE TABLE probe_days (day date PRIMARY KEY);
INSERT INTO probe_days VALUES ('2024-02-15'), ('2024-02-29'), ('2024-03-01'), ('2024-12-31');`, { filename: "15a-asof-setup.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["Какая граница периода включена, а какая исключена?", "Как записать открытый период, у которого `valid_to` равен `NULL`?"],
      checks: ["`d.day >= valid_from AND (valid_to IS NULL OR d.day < valid_to)`", "Результат: 1000, 1000, 1200, 1200"],
      solution: [
        code("sql", `CREATE TABLE product_prices (
  product_id integer NOT NULL REFERENCES products (id),
  price      integer NOT NULL,
  valid_from date    NOT NULL,
  valid_to   date,
  PRIMARY KEY (product_id, valid_from)
);
INSERT INTO product_prices VALUES (1, 1000, '2023-01-01', '2024-03-01'), (1, 1200, '2024-03-01', NULL);
CREATE TABLE probe_days (day date PRIMARY KEY);
INSERT INTO probe_days VALUES ('2024-02-15'), ('2024-02-29'), ('2024-03-01'), ('2024-12-31');

-- Цена кофе на каждую дату; период закрыт слева и открыт справа: [valid_from, valid_to)
SELECT d.day, pp.price
FROM probe_days AS d
JOIN product_prices AS pp
  ON pp.product_id = 1 AND d.day >= pp.valid_from AND (pp.valid_to IS NULL OR d.day < pp.valid_to)
ORDER BY d.day;`, { filename: "15-ex-asof.sql", runnable: true, fixture: "shop", lineNumbers: true }),
        code("text", `    day     | price 
------------+-------
 2024-02-15 |  1000
 2024-02-29 |  1000
 2024-03-01 |  1200
 2024-12-31 |  1200
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Первого марта действует уже новая цена: граница `valid_to = 2024-03-01` исключающая, а `valid_from = 2024-03-01` у следующей строки — включающая. Поэтому каждая дата попадает ровно в один период."),
      ],
    }),
  ],

  challenge: {
    id: "sql.schema-patterns.challenge",
    title: "Магазин: статусы, архив товаров и неизменная цена продажи",
    scenario: [
      p("Магазин хочет: (1) допустимые статусы продаж хранить справочником, (2) снимать товары с продажи без потери истории и позволять завести товар с тем же названием заново, (3) чтобы сумма проданного не менялась при изменении цен в каталоге."),
    ],
    requirements: [
      "Справочник `statuses` и внешний ключ из `sales`",
      "Товары с меткой архивирования и уникальным названием среди неархивных",
      "Позиции продаж с копией цены на момент продажи",
      "Сценарий: цена кофе выросла, чай архивирован и заведён заново дороже; показать, что сумма продажи не изменилась",
    ],
    constraints: [
      "Уникальность названия — частичным индексом, а не проверкой в запросе",
      "Ни одной ссылки из позиции продажи на изменяемую цену",
    ],
    acceptance: [
      "Сумма продажи — 2 500, а по нынешним ценам была бы 2 900",
      "Активных товаров два: кофе (1 200) и новый чай (280)",
    ],
    hints: [
      "Копия цены — столбец `unit_price`, заполняемый при вставке позиции из текущего каталога.",
      "Архивирование — `UPDATE … SET archived_at`, а не `DELETE`: на товар ссылаются позиции.",
    ],
    solution: [
      code("sql", `-- Справочник статусов, архив товаров без потери истории и цена, зафиксированная в позиции продажи
CREATE TABLE statuses (code text PRIMARY KEY);
INSERT INTO statuses VALUES ('new'), ('paid');

CREATE TABLE goods (
  id          integer PRIMARY KEY,
  title       text    NOT NULL,
  price       integer NOT NULL CHECK (price >= 0),
  archived_at text
);
CREATE UNIQUE INDEX goods_title_active ON goods (title) WHERE archived_at IS NULL;

CREATE TABLE sales (id integer PRIMARY KEY, status text NOT NULL REFERENCES statuses (code));
CREATE TABLE sale_lines (
  sale_id    integer NOT NULL REFERENCES sales (id),
  good_id    integer NOT NULL REFERENCES goods (id),
  qty        integer NOT NULL CHECK (qty > 0),
  unit_price integer NOT NULL,                -- цена на момент продажи: копия, которая не меняется
  PRIMARY KEY (sale_id, good_id)
);

INSERT INTO goods VALUES (1, 'Кофе', 1000, NULL), (2, 'Чай', 250, NULL);
INSERT INTO sales VALUES (1, 'paid');
INSERT INTO sale_lines SELECT 1, id, 2, price FROM goods;

-- Жизнь продолжается: цена кофе выросла, чай снят с продажи и заведён заново дороже
UPDATE goods SET price = 1200 WHERE id = 1;
UPDATE goods SET archived_at = '2024-06-01' WHERE id = 2;
INSERT INTO goods VALUES (3, 'Чай', 280, NULL);

SELECT sum(unit_price * qty) AS sale_total FROM sale_lines WHERE sale_id = 1;
SELECT sum(g.price * l.qty) AS if_current_prices FROM sale_lines AS l JOIN goods AS g ON g.id = l.good_id WHERE l.sale_id = 1;
SELECT id, title, price FROM goods WHERE archived_at IS NULL ORDER BY id;`, { filename: "16-challenge.sql", runnable: true, lineNumbers: true }),
      code("text", ` sale_total 
------------
       2500
(1 row)

 if_current_prices 
-------------------
              2900
(1 row)

 id | title | price 
----+-------+-------
  1 | Кофе  |  1200
  3 | Чай   |   280
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Позиции хранят `unit_price` — копию цены в момент продажи, поэтому сумма продажи остаётся 2 500 (2×1000 + 2×250), хотя по каталогу было бы 2 900 (2×1200 + 2×250). Старый чай архивирован, но физически остался: на него ссылается позиция. Новый «Чай» занял освободившееся название благодаря частичному индексу. Это осознанная денормализация: копия — не ошибка, а исторический факт."),
    ],
  },

  interview: [
    iq("sql.schema-patterns.i1", "basic", "Чем справочник статусов лучше CHECK со списком значений?", [
      ul(
        "Новый статус добавляется вставкой строки, без миграции схемы (замер: `refunded` — один `INSERT`).",
        "В справочнике можно хранить метаданные (название, признак финальности).",
        "Внешний ключ защищает так же, как `CHECK`; цена — дополнительное соединение для отображения.",
      ),
    ]),
    iq("sql.schema-patterns.i2", "basic", "Почему нельзя использовать float для денег?", [
      ul(
        "Двоичная дробь не представляет `0.1` точно: `0.1 + 0.2 = 0.30000000000000004`.",
        "В замере сумма 1000 платежей по 0,10 дала `99.9999999999986`, а `numeric` — `100.00`.",
        "Решение: `numeric(p, s)` или целое число копеек и отдельный столбец валюты.",
      ),
    ]),
    iq("sql.schema-patterns.i3", "intermediate", "Как реализовать мягкое удаление и не потерять уникальность email?", [
      ul(
        "Столбец `deleted_at`; обычный `UNIQUE (email)` навсегда занимает адрес «удалённого» (ошибка `duplicate key`).",
        "Частичный уникальный индекс `UNIQUE (email) WHERE deleted_at IS NULL` проверяет только активные строки.",
        "Фильтр «только активные» выносят в представление, чтобы не забывать в запросах.",
      ),
    ]),
    iq("sql.schema-patterns.i4", "intermediate", "Как хранить цену товара так, чтобы старые заказы не менялись при изменении прайса?", [
      ul(
        "Копия цены в позиции заказа (`unit_price`) — самый простой способ.",
        "Либо таблица периодов `(product_id, price, valid_from, valid_to)` и соединение по дате заказа; периоды `[from, to)`.",
        "В замере выручка по ценам на дату — 11 800, по нынешним — 12 200; в PostgreSQL перекрытия периодов запрещает `EXCLUDE USING gist`.",
      ),
    ]),
    iq("sql.schema-patterns.i5", "intermediate", "Почему в IDENTITY/SERIAL бывают пропуски номеров и что с этим делать?", [
      ul(
        "Номера выдаются последовательностью вне транзакции: откат вставки не возвращает номер (замер: id 1 и 3).",
        "Пропуски безвредны для технических идентификаторов.",
        "Для номеров без дыр (юридические документы) нужен отдельный механизм с блокировкой и осознанной ценой.",
      ),
    ]),
    iq("sql.schema-patterns.i6", "advanced", "Сравните EAV и jsonb для разнородных атрибутов товаров.", [
      ul(
        "EAV: условия по нескольким атрибутам — самосоединения, значения — текст (вес `'300'` не прошёл `> '50'`), нет типов и ограничений.",
        "`jsonb`: один оператор содержания `@>`, GIN-индекс, числа остаются числами.",
        "Но и `jsonb` не даёт внешних ключей на внутренние значения: частые фильтруемые атрибуты лучше вынести в столбцы.",
      ),
    ]),
    iq("sql.schema-patterns.i7", "advanced", "Какие способы хранения иерархий вы знаете и как выбирать?", [
      ul(
        "Список смежности (`parent_id`): простая запись и перенос (1 строка в замере), чтение — рекурсивным CTE.",
        "Материализованный путь (`/1/2/3/`, `ltree`): быстрые поддеревья по префиксу, перенос переписывает пути (3 строки).",
        "Таблица замыканий: поддерево одним `JOIN`, перенос дорогой (6 + 6 строк).",
        "Выбор — по соотношению чтений и перемещений и размеру деревьев; всё проверять на своих данных.",
      ),
    ]),
    iq("sql.schema-patterns.i8", "engineering", "Вам нужно добавить аудит изменений критичной таблицы в нагруженной системе. Как вы подойдёте к решению?", [
      ul(
        "Определить, что нужно записывать (кто, когда, что, старое и новое) и как долго хранить.",
        "Триггер `AFTER INSERT OR UPDATE OR DELETE FOR EACH ROW` пишет в журнал `jsonb` (в замере три операции — три записи).",
        "Замерить накладные расходы: триггер срабатывает на каждую строку массовых операций; журнал партиционировать по времени.",
        "Пользователя передавать через `current_user` или `SET LOCAL`-параметр сессии, время — `now()`.",
        "Права: приложение не должно уметь править журнал; план очистки и выгрузки.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.schema-patterns.e1", "foundation", "Как проще всего добавить новый допустимый статус заказа, если статусы хранятся справочником?", ["`ALTER TABLE`", "Пересоздать базу", "Вставить строку в справочник", "Изменить `CHECK` во всех таблицах"], 2, "Набор значений — данные: новый статус — один `INSERT` (в замере `refunded`), схема не меняется."),
    mcq("sql.schema-patterns.e2", "foundation", "Какой тип подходит для денежных сумм в PostgreSQL?", ["`numeric(p, s)`", "`float8`", "`real`", "`text`"], 0, "`numeric` хранит десятичные значения точно (`0.1 + 0.2 = 0.3`), а `float8` дал `0.30000000000000004`."),
    mcq("sql.schema-patterns.e3", "foundation", "Что означает `deleted_at IS NULL` в схеме с мягким удалением?", ["Строка удалена", "Столбец повреждён", "Строка заблокирована", "Строка активна"], 3, "`NULL` — метка отсутствует, значит строка не удалена; значение — момент «удаления»."),
    mcq("sql.schema-patterns.e4", "intermediate", "Зачем нужен частичный уникальный индекс `UNIQUE (email) WHERE deleted_at IS NULL`?", ["Для скорости `SELECT *`", "Чтобы уникальность проверялась только среди неудалённых строк", "Чтобы запретить удаление", "Чтобы хранить NULL"], 1, "Обычный `UNIQUE` занимал бы адрес навсегда; частичный позволяет зарегистрировать email заново (3 строки, 2 активные)."),
    mcq("sql.schema-patterns.e5", "intermediate", "Период цены `[valid_from, valid_to)`: к какой цене относится заказ от даты, равной `valid_to` старой цены?", ["К старой", "К обеим", "Ни к какой", "К новой"], 3, "Правая граница исключающая, левая — включающая: 2024-03-01 уже по новой цене 1200 (замер)."),
    mcq("sql.schema-patterns.e6", "intermediate", "После `INSERT; ROLLBACK; INSERT` в таблицу с `IDENTITY` вторая вставка получила id…", ["1", "2", "3", "NULL"], 2, "Последовательность не откатывается: номер 2 «потрачен» откатанной вставкой, поэтому следующая запись получила 3 (замер)."),
    mcq("sql.schema-patterns.e7", "advanced", "Что дороже всего при переносе поддерева из 3 человек в таблице замыканий?", ["Одна строка `UPDATE`", "Удаление и добавление пар «предок — потомок» (6 и 6 строк в замере)", "Ничего", "Только индексы"], 1, "Замыкание хранит все пары, поэтому перенос удаляет связи со старыми предками и создаёт связи с новыми; список смежности менял бы одну строку."),
    open("sql.schema-patterns.e8", "intermediate", "Нужно хранить товары с очень разными характеристиками (одежда, электроника, продукты) и искать по ним. Как вы спроектируете хранение и чем обоснуете выбор?", [
      ul(
        "Общие поля (название, цена, категория) — обычные столбцы с ограничениями и индексами.",
        "Редкие разнородные характеристики — столбец `jsonb` с GIN-индексом: запрос `attrs @> '{\"color\": \"red\"}'` — один оператор.",
        "Часто фильтруемые и соединяемые атрибуты (бренд, размер) — отдельные столбцы или справочники с внешними ключами.",
        "EAV отвергается: все значения — текст, каждое условие — самосоединение, нет ограничений.",
        "Проверка: `EXPLAIN ANALYZE` на реальных данных и тест целостности (какие ключи обязательны).",
      ),
    ], ["Общие столбцы", "jsonb для разнородных", "Вынос частых атрибутов", "Отказ от EAV с обоснованием"], { format: "architecture" }),
  ],

  mastery: [
    mcq("sql.schema-patterns.m1", "intermediate", "Что показал запрос «red и L» на EAV-таблице?", ["Нужно самосоединение по каждому атрибуту", "Он решается одним `WHERE`", "EAV не поддерживает `JOIN`", "Он всегда быстрый"], 0, "Каждый атрибут — отдельная строка, поэтому условие по двум атрибутам требует двух соединений таблицы с собой."),
    mcq("sql.schema-patterns.m2", "advanced", "Почему `value > '50'` не нашёл вес `'300'` в EAV?", ["Ошибка в данных", "Индекс не использован", "Значения — текст и сравниваются как строки: '3' меньше '5'", "`NULL` в столбце"], 2, "В EAV всё хранится текстом; числовое сравнение требует приведения типа, которого схема не гарантирует."),
    mcq("sql.schema-patterns.m3", "advanced", "Что отклоняет `EXCLUDE USING gist (product_id WITH =, period WITH &&)`?", ["Периоды цены, пересекающиеся для одного товара", "Любые две цены на товар", "Пустые периоды", "Периоды с `NULL`"], 0, "Ограничение-исключение запрещает пару строк с одинаковым товаром и перекрывающимися периодами (замер: пересекающийся период отклонён)."),
    open("sql.schema-patterns.m4", "advanced", "В системе заказов нужно доказать, какие цены видел клиент в момент покупки, и при этом иметь аналитику по изменению прайса. Какие две модели хранения вы сравните и что выберете?", [
      ul(
        "Снимок: копия `unit_price` в позиции заказа — просто, быстро, неизменно; прайс при этом ведётся отдельно.",
        "Таблица периодов цен `[valid_from, valid_to)`: даёт аналитику изменений прайса и цену на любую дату, но требует соединения по периоду и ограничения против перекрытий.",
        "Рекомендация: хранить снимок в позиции (юридический факт покупки) и вести историю прайса для аналитики — это две разные задачи.",
        "Риски: рассинхрон при ошибке записи снимка; решение — заполнять `unit_price` из каталога при вставке позиции в одной транзакции.",
      ),
    ], ["Снимок", "Периоды цен", "Раздельные задачи", "Согласованность записи"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.schema-patterns.f1", front: "Допустимые значения?", back: "Справочник + FK (меняется данными), ENUM (порядок по объявлению, значения не удаляются), CHECK (миграция при изменении)." },
    { id: "sql.schema-patterns.f2", front: "IDENTITY и дыры?", back: "Последовательность не откатывается: INSERT; ROLLBACK; INSERT даёт id 1 и 3." },
    { id: "sql.schema-patterns.f3", front: "Мягкое удаление?", back: "deleted_at + частичный UNIQUE ... WHERE deleted_at IS NULL + представление «активных»." },
    { id: "sql.schema-patterns.f4", front: "История цены?", back: "Период [valid_from, valid_to): левая граница включена, правая исключена; либо снимок unit_price в позиции." },
    { id: "sql.schema-patterns.f5", front: "Аудит?", back: "Триггер AFTER INSERT/UPDATE/DELETE пишет old_row/new_row (jsonb) в журнал; цена — замедление записи и рост таблицы." },
    { id: "sql.schema-patterns.f6", front: "EAV vs jsonb?", back: "EAV: самосоединения, значения-текст. jsonb: attrs @> '{...}' + GIN; частые поля — в столбцы." },
    { id: "sql.schema-patterns.f7", front: "Деньги?", back: "numeric(p, s) или целые копейки. float8: 0.1 + 0.2 ≠ 0.3." },
    { id: "sql.schema-patterns.f8", front: "Три способа хранить дерево?", back: "Смежность (перенос — 1 строка), путь (3 в замере), замыкание (6 + 6): чтение быстрее, перенос дороже." },
  ],

  sources: [
    { title: "PostgreSQL 16: Constraints (CHECK, UNIQUE, exclusion)", url: "https://www.postgresql.org/docs/16/ddl-constraints.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Partial Indexes", url: "https://www.postgresql.org/docs/16/indexes-partial.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Enumerated Types", url: "https://www.postgresql.org/docs/16/datatype-enum.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Numeric Types (arbitrary precision)", url: "https://www.postgresql.org/docs/16/datatype-numeric.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: JSON Types and containment operators", url: "https://www.postgresql.org/docs/16/datatype-json.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: ltree — hierarchical tree-like structures", url: "https://www.postgresql.org/docs/16/ltree.html", publisher: "PostgreSQL" },
    { title: "SQLite: Partial Indexes", url: "https://www.sqlite.org/partialindex.html", publisher: "Other" },
  ],
};
