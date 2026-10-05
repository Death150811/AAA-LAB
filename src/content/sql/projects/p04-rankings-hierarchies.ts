import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p04RankingsHierarchies: Project = {
  id: "sql.p04-rankings-hierarchies",
  domain: "sql",
  order: 4,
  title: "Рейтинги и иерархии",
  subtitle: "Восемь запросов на подзапросах, CTE, оконных функциях и рекурсии: средние и EXISTS, места с ничьими, последний заказ, нарастающий итог, lag и обход дерева сотрудников",
  level: "intermediate",
  estimatedHours: 12,
  buildsOn: ["sql.p03-join-reports"],
  topics: ["sql.subqueries", "sql.ctes", "sql.recursive-ctes", "sql.window-functions", "sql.inner-left-joins"],
  objective:
    "Написать файл `queries.sql` с **восемью запросами повышенной сложности**: сравнение с агрегатом через подзапрос и CTE, проверка существования через `EXISTS`, ранжирование и топ-N в группе оконными функциями, нарастающие итоги и `lag`, рекурсивный обход иерархии сотрудников и агрегаты по поддеревьям. Проект про выбор правильного инструмента и про тонкости: ничьи при ранжировании, порядок внутри окна, начало рекурсии, граница «подчинённые без руководителя».",
  scenario: [
    p("Директор «Кофейни» просит аналитику уровня выше: какие заказы крупнее среднего, кто из клиентов делал дорогие покупки, как распределены зарплаты внутри отделов с учётом равных зарплат, какой был последний заказ клиента, как растёт выручка нарастающим итогом, сколько людей в команде у каждого руководителя. Данные — таблицы магазина и сотрудников (`data.sql`)."),
    p("В файле `queries.sql` комментарий `-- qNN` открывает ответ на вопрос NN; под ним — один запрос (допустим `WITH … SELECT`). Проверка `check.mjs` создаёт временную базу, загружает `data.sql`, выполняет ответы и сравнивает с эталоном, а затем проверяет форму запросов: `EXISTS`, `rank()`, `row_number()`, оконная `sum`, `lag`, `WITH RECURSIVE`. Всего **17 проверок**."),
    code("sql", `-- Заготовка проекта «Рейтинги и иерархии». Под каждым комментарием напишите один запрос (WITH … SELECT или SELECT), завершайте точкой с запятой.
-- Проверка: node check.mjs queries.sql   (данные — data.sql: таблицы магазина и сотрудников)
-- Формат: строка «-- qNN» открывает ответ на вопрос NN; порядок и число столбцов заданы вопросом.

-- q01 Заказы (без отменённых), сумма которых выше средней суммы заказа: номер и сумма; по номеру
-- TODO: запрос …;

-- q02 Клиенты, у которых есть заказ дороже 3000 (отменённые не считаются): только имена, по алфавиту
-- TODO: запрос …;

-- q03 Место сотрудника по зарплате внутри отдела (равные зарплаты делят место, следующее пропускается): отдел, имя, зарплата, место; по отделу, месту, имени
-- TODO: запрос …;

-- q04 Последний заказ каждого клиента (при одинаковой дате — с большим номером): идентификатор клиента, номер заказа, дата, статус; по идентификатору клиента
-- TODO: запрос …;

-- q05 Выручка по месяцам без отменённых заказов и накопленная выручка: месяц «ГГГГ-ММ», выручка за месяц, нарастающий итог; по месяцу
-- TODO: запрос …;

-- q06 Изменение суммы заказа клиента относительно его предыдущего заказа (без отменённых): идентификатор клиента, номер заказа, сумма, сумма предыдущего заказа (у первого NULL); по клиенту и дате, затем по номеру
-- TODO: запрос …;

-- q07 Все подчинённые Павла (id 2) на любую глубину: имя и уровень (прямые подчинённые — 1); по уровню и имени
-- TODO: запрос …;

-- q08 Размер команды (все подчинённые на любой глубине, без самого руководителя) и фонд зарплат команды вместе с руководителем — только для тех, у кого есть подчинённые: имя, размер, фонд; по убыванию фонда
-- TODO: запрос …;`, { filename: "starter/queries.sql", collapsed: true }),
    table(
      ["№", "Вопрос", "Инструмент"],
      [
        ["q01", "Заказы (без отменённых) с суммой выше средней", "CTE `totals` + скалярный подзапрос `avg`"],
        ["q02", "Клиенты с заказом дороже 3000", "`EXISTS` с агрегатом в коррелированном подзапросе"],
        ["q03", "Место сотрудника по зарплате в отделе (ничьи делят место)", "`rank() OVER (PARTITION BY …)`"],
        ["q04", "Последний заказ каждого клиента", "`row_number()` + обёртка, тай-брейк по номеру"],
        ["q05", "Выручка по месяцам и нарастающий итог", "CTE + `sum(...) OVER (ORDER BY month)`"],
        ["q06", "Сумма заказа и сумма предыдущего заказа клиента", "`lag()` по разбиению на клиентов"],
        ["q07", "Все подчинённые Павла на любую глубину", "`WITH RECURSIVE`, якорь — прямые подчинённые"],
        ["q08", "Размер команды и фонд зарплат каждого руководителя", "Рекурсия с `root_id` + `GROUP BY`"],
      ],
      "Вопросы проекта",
    ),
  ],
  requirements: [
    "`queries.sql` содержит ответы `q01`…`q08`; под каждым маркером — один запрос (допустим `WITH … SELECT`).",
    "Результат каждого запроса совпадает с эталоном по числу и порядку столбцов, строкам и их порядку (имена столбцов не проверяются).",
    "q01: суммы заказов считаются один раз в CTE или подзапросе; среднее берётся по тем же заказам (без отменённых); результат — четыре заказа.",
    "q02: условие «есть заказ дороже 3000» — через `EXISTS`; сумму заказа внутри подзапроса вычисляйте группировкой по заказу.",
    "q03: ничьи (Ольга и Семён по 180 000, Хлоя и Цезарь по 110 000) делят место, следующее место пропускается — это `rank`, а не `dense_rank` и не `row_number`.",
    "q04: ровно одна строка на клиента (шесть клиентов); при одинаковой дате побеждает больший номер заказа; у Дарьи последний заказ — отменённый (статус не фильтруется).",
    "q05: накопленная выручка по месяцам — оконная `sum`; q06: `lag` по клиенту, у первого заказа — `NULL`.",
    "q07: четыре подчинённых Павла (Ольга, Семён — уровень 1; Тимур, Ульяна — 2); q08: шесть руководителей, у Ирины 11 подчинённых и фонд 1 830 000, фонд включает самого руководителя.",
  ],
  constraints: [
    "Только `SELECT` (с `WITH`); данные и схему менять нельзя; один запрос на вопрос.",
    "Нельзя выводить ответ вручную (перечислением идентификаторов) и использовать `SELECT *`.",
    "Рекурсивные запросы обязаны содержать `WITH RECURSIVE`; обход выполняйте рекурсией, а не серией самосоединений фиксированной глубины.",
    "Ранжирование и «последняя запись» — оконными функциями, а не коррелированными подзапросами с `max`.",
    "Диалект — PostgreSQL 16.",
  ],
  expected: [
    "`node check.mjs queries.sql` печатает `Пройдено проверок: 17 из 17`.",
    "Заготовка проходит 1 проверку из 17 (маркеры на месте).",
    "Каждый из восьми «плохих» вариантов проваливает 1–2 проверки.",
    "q01 — 4 строки, q03 — 12, q04 — 6, q05 — 6 месяцев (итог 21 390), q06 — 11 заказов, q07 — 4, q08 — 6.",
  ],
  technical: [
    "CTE даёт запросу имя и читаемость: `totals` вычисляется один раз и используется и в сравнении, и в агрегате (в PostgreSQL 12+ он встраивается или материализуется планировщиком).",
    "`EXISTS` останавливается на первой подходящей строке и не размножает результат; условие с агрегатом в нём записывается как `GROUP BY … HAVING`.",
    "Окно вычисляется после `WHERE`, `GROUP BY` и `HAVING`; фильтровать по результату окна можно только на следующем уровне запроса (обёртка или CTE).",
    "`rank()` — «спортивные» места с пропусками; `dense_rank()` — без пропусков; `row_number()` — уникальные номера, при ничьей порядок зависит от дополнительных ключей.",
    "Нарастающий итог по умолчанию считается с рамкой `RANGE … CURRENT ROW`; при уникальных значениях порядка (`month`) это совпадает с `ROWS`.",
    "Рекурсивная CTE: якорь (`WHERE manager_id = 2`) и рекурсивный шаг (`JOIN team ON e.manager_id = t.id`) через `UNION ALL`; остановка — когда шаг не возвращает строк.",
    "Агрегаты по поддеревьям: якорь «каждый — свой корень» (`id AS root_id`), шаг переносит `root_id`, итог группируется по `root_id`.",
  ],
  acceptance: [
    "`node check.mjs queries.sql` — 17 из 17.",
    "Заготовка проходит 1 из 17; каждый из восьми плохих вариантов проваливает 1–2 проверки.",
    "Нет `SELECT *`, ручных идентификаторов и рекурсии с фиксированной глубиной.",
    "В q03 использован именно `rank()`, в q04 — `row_number()` с тай-брейком, в q07 и q08 — `WITH RECURSIVE`.",
  ],
  hints: [
    "q01: сначала CTE `totals(id, total)`; затем `WHERE total > (SELECT avg(total) FROM totals)`. Если вернулось не четыре строки, проверьте, не попали ли отменённые заказы в среднее.",
    "q03: если место Тимура — 3, а не 4, вы взяли `dense_rank`; если у Семёна 3, а не 2 — `row_number`.",
    "q04: оконную функцию нельзя поставить в `WHERE`. Вычислите `rn` во внутреннем запросе, фильтруйте `rn = 1` во внешнем.",
    "q05: сначала CTE «месяц, выручка», потом окно `sum(revenue) OVER (ORDER BY month)`. `OVER ()` без порядка даст общий итог в каждой строке.",
    "q06: `lag(total) OVER (PARTITION BY customer_id ORDER BY ordered_on, order_id)`; `lead` смотрит вперёд, а не назад.",
    "q07: якорь — **прямые подчинённые** Павла (`manager_id = 2`), уровень 1. Если в результате есть сам Павел, якорь взят неверно.",
    "q08: `count(*) - 1` — без самого руководителя; `sum(salary)` — вместе с ним (корень входит в своё поддерево с уровнем 0).",
  ],
  advanced: [
    "Решите q01 и без CTE: подзапрос в `FROM` и подзапрос в `WHERE`. Какие варианты читаются лучше и почему?",
    "Добавьте путь от корня (`Ирина > Фёдор > Хлоя`) и защиту от цикла в q07; проверьте на данных, где у кого-то руководитель — он сам.",
    "Реализуйте q04 ещё и через `DISTINCT ON (customer_id)` (PostgreSQL) и сравните планы `EXPLAIN`.",
    "Рассчитайте скользящее среднее выручки за три месяца (`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`) и объясните, почему у первых двух месяцев окно короче.",
    "Постройте таблицу «руководитель → глубина самого длинного пути вниз» и покажите, чем рекурсия лучше серии самосоединений.",
  ],
  failureModes: [
    "**`dense_rank` вместо `rank`:** места после ничьей не пропускаются, Тимур получает 3 вместо 4 (1 из 17).",
    "**`row_number` вместо `rank`:** равные зарплаты получают разные места; проваливаются результат и требование к форме (2 из 17).",
    "**Самый ранний заказ вместо последнего:** порядок окна не убывающий (1 из 17).",
    "**`sum(...) OVER ()` вместо нарастающего:** во всех месяцах общий итог 21 390 (1 из 17).",
    "**`lead` вместо `lag`:** вместо предыдущей суммы — следующая; проваливаются результат и форма (2 из 17).",
    "**Якорь рекурсии «сам Павел»:** в результат попадает сам руководитель с уровнем 0 (1 из 17).",
    "**`count(*)` вместо `count(*) - 1`:** размер команды включает самого руководителя (1 из 17).",
    "**Среднее по всем заказам, включая отменённые:** граница «выше среднего» смещается, список заказов меняется (1 из 17).",
  ],
  rubric: [
    { criterion: "Подзапросы и CTE", weight: 20, description: "Один вычисленный набор для среднего и сравнения, `EXISTS` с агрегатом, корректные фильтры (без отменённых)." },
    { criterion: "Оконные функции", weight: 30, description: "`rank`, `row_number` с тай-брейком, оконная `sum`, `lag`; правильные `PARTITION BY` и порядок; топ-N через обёртку." },
    { criterion: "Рекурсия и иерархии", weight: 25, description: "Якорь и шаг, уровни, агрегаты по поддеревьям через `root_id`, без самосоединений фиксированной глубины." },
    { criterion: "Корректность результатов", weight: 15, description: "Все восемь результатов совпадают с эталоном по столбцам, строкам и порядку." },
    { criterion: "Читаемость", weight: 10, description: "Осмысленные имена CTE, выровненные окна и соединения, явные столбцы, комментарии к нетривиальным местам." },
  ],
  solution: [
    p("Эталон — файл `queries.sql` из восьми запросов (около 100 строк). Он проходит все 17 проверок; заготовка проходит 1 из 17, а каждый из восьми намеренно испорченных вариантов проваливает 1–2 проверки. Ниже — решение, проверяющий скрипт и результаты запусков на PostgreSQL 16.14."),
    h("queries.sql"),
    code("sql", `-- Рейтинги и иерархии «Кофейни»: восемь запросов на подзапросах, CTE, оконных функциях и рекурсии

-- q01 Заказы (без отменённых), сумма которых выше средней суммы заказа: номер и сумма; по номеру
WITH totals AS (
  SELECT o.id, sum(oi.qty * p.price) AS total
  FROM orders AS o
  JOIN order_items AS oi ON oi.order_id = o.id
  JOIN products AS p ON p.id = oi.product_id
  WHERE o.status <> 'cancelled'
  GROUP BY o.id
)
SELECT id, total
FROM totals
WHERE total > (SELECT avg(total) FROM totals)
ORDER BY id;

-- q02 Клиенты, у которых есть заказ дороже 3000 (отменённые не считаются): только имена, по алфавиту
SELECT c.name
FROM customers AS c
WHERE EXISTS (
  SELECT 1
  FROM orders AS o
  JOIN order_items AS oi ON oi.order_id = o.id
  JOIN products AS p ON p.id = oi.product_id
  WHERE o.customer_id = c.id AND o.status <> 'cancelled'
  GROUP BY o.id
  HAVING sum(oi.qty * p.price) > 3000
)
ORDER BY c.name;

-- q03 Место сотрудника по зарплате внутри отдела (равные зарплаты делят место, следующее пропускается): отдел, имя, зарплата, место; по отделу, месту, имени
SELECT dept, name, salary, rank() OVER (PARTITION BY dept ORDER BY salary DESC) AS place
FROM employees
ORDER BY dept, place, name;

-- q04 Последний заказ каждого клиента (при одинаковой дате — с большим номером): идентификатор клиента, номер заказа, дата, статус; по идентификатору клиента
SELECT customer_id, order_id, ordered_on, status
FROM (
  SELECT customer_id, id AS order_id, ordered_on, status,
         row_number() OVER (PARTITION BY customer_id ORDER BY ordered_on DESC, id DESC) AS rn
  FROM orders
) AS t
WHERE rn = 1
ORDER BY customer_id;

-- q05 Выручка по месяцам без отменённых заказов и накопленная выручка: месяц «ГГГГ-ММ», выручка за месяц, нарастающий итог; по месяцу
WITH monthly AS (
  SELECT substr(CAST(o.ordered_on AS text), 1, 7) AS month, sum(oi.qty * p.price) AS revenue
  FROM orders AS o
  JOIN order_items AS oi ON oi.order_id = o.id
  JOIN products AS p ON p.id = oi.product_id
  WHERE o.status <> 'cancelled'
  GROUP BY substr(CAST(o.ordered_on AS text), 1, 7)
)
SELECT month, revenue, sum(revenue) OVER (ORDER BY month) AS running_total
FROM monthly
ORDER BY month;

-- q06 Изменение суммы заказа клиента относительно его предыдущего заказа (без отменённых): идентификатор клиента, номер заказа, сумма, сумма предыдущего заказа (у первого NULL); по клиенту и дате, затем по номеру
WITH totals AS (
  SELECT o.customer_id, o.id AS order_id, o.ordered_on, sum(oi.qty * p.price) AS total
  FROM orders AS o
  JOIN order_items AS oi ON oi.order_id = o.id
  JOIN products AS p ON p.id = oi.product_id
  WHERE o.status <> 'cancelled'
  GROUP BY o.customer_id, o.id, o.ordered_on
)
SELECT customer_id, order_id, total,
       lag(total) OVER (PARTITION BY customer_id ORDER BY ordered_on, order_id) AS prev_total
FROM totals
ORDER BY customer_id, ordered_on, order_id;

-- q07 Все подчинённые Павла (id 2) на любую глубину: имя и уровень (прямые подчинённые — 1); по уровню и имени
WITH RECURSIVE team(id, name, depth) AS (
  SELECT id, name, 1 FROM employees WHERE manager_id = 2
  UNION ALL
  SELECT e.id, e.name, t.depth + 1 FROM employees AS e JOIN team AS t ON e.manager_id = t.id
)
SELECT name, depth
FROM team
ORDER BY depth, name;

-- q08 Размер команды (все подчинённые на любой глубине, без самого руководителя) и фонд зарплат команды вместе с руководителем — только для тех, у кого есть подчинённые: имя, размер, фонд; по убыванию фонда
WITH RECURSIVE tree(root_id, id, salary) AS (
  SELECT id, id, salary FROM employees
  UNION ALL
  SELECT t.root_id, e.id, e.salary FROM employees AS e JOIN tree AS t ON e.manager_id = t.id
)
SELECT r.name, count(*) - 1 AS team_size, sum(t.salary) AS payroll
FROM tree AS t
JOIN employees AS r ON r.id = t.root_id
GROUP BY r.id, r.name
HAVING count(*) > 1
ORDER BY payroll DESC, r.name;`, { filename: "queries.sql", lineNumbers: true }),
    ul(
      "**q01:** CTE `totals` вычисляется один раз; `WHERE total > (SELECT avg(total) FROM totals)` сравнивает с тем же набором.",
      "**q03/q04:** `rank()` с `PARTITION BY dept` — места с пропусками; `row_number()` с тай-брейком `ordered_on DESC, id DESC` в обёртке — ровно одна строка на клиента.",
      "**q05/q06:** CTE готовит данные, оконные функции работают поверх: `sum(...) OVER (ORDER BY month)` и `lag(...) OVER (PARTITION BY ...)`.",
      "**q07:** якорь — прямые подчинённые, шаг — `JOIN team ON e.manager_id = t.id`, уровень растёт на 1.",
      "**q08:** якорь «каждый — свой корень» (`root_id`), группировка по корню; `count(*) - 1` — команда без руководителя, `sum(salary)` — вместе с ним.",
    ),
    h("data.sql"),
    code("sql", `CREATE TABLE customers (
  id        integer PRIMARY KEY,
  name      text    NOT NULL,
  city      text,
  signed_up date    NOT NULL
);
CREATE TABLE products (
  id       integer PRIMARY KEY,
  title    text    NOT NULL,
  category text    NOT NULL,
  price    numeric(8,2) NOT NULL CHECK (price >= 0)
);
CREATE TABLE orders (
  id          integer PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customers (id),
  ordered_on  date    NOT NULL,
  status      text    NOT NULL CHECK (status IN ('new', 'paid', 'shipped', 'cancelled'))
);
CREATE TABLE order_items (
  order_id   integer NOT NULL REFERENCES orders (id),
  product_id integer NOT NULL REFERENCES products (id),
  qty        integer NOT NULL CHECK (qty > 0),
  PRIMARY KEY (order_id, product_id)
);

INSERT INTO customers (id, name, city, signed_up) VALUES
  (1, 'Анна',  'Москва', '2023-01-15'),
  (2, 'Борис', 'Казань', '2023-02-20'),
  (3, 'Вера',  'Москва', '2023-03-05'),
  (4, 'Глеб',  'Самара', '2023-03-18'),
  (5, 'Дарья', 'Казань', '2023-05-02'),
  (6, 'Егор',  NULL,     '2023-06-10'),
  (7, 'Жанна', 'Москва', '2023-07-22'),
  (8, 'Игорь', 'Самара', '2023-09-01');

INSERT INTO products (id, title, category, price) VALUES
  (1,  'Кофе зерновой 1 кг', 'напитки', 1200.00),
  (2,  'Чай чёрный 100 г',   'напитки',  250.00),
  (3,  'Кружка керамическая', 'посуда',   450.00),
  (4,  'Френч-пресс',        'посуда',  1900.00),
  (5,  'Сахар 1 кг',         'продукты',   90.00),
  (6,  'Печенье овсяное',    'продукты',  140.00),
  (7,  'Мёд 300 г',          'продукты',  520.00),
  (8,  'Чайник стальной',    'посуда',  2300.00),
  (9,  'Какао 250 г',        'напитки',  380.00),
  (10, 'Термокружка',        'посуда',   990.00);

INSERT INTO orders (id, customer_id, ordered_on, status) VALUES
  (1,  1, '2024-01-10', 'paid'),
  (2,  1, '2024-02-14', 'paid'),
  (3,  2, '2024-02-20', 'shipped'),
  (4,  3, '2024-03-01', 'paid'),
  (5,  3, '2024-03-15', 'cancelled'),
  (6,  4, '2024-03-20', 'new'),
  (7,  1, '2024-04-02', 'paid'),
  (8,  5, '2024-04-11', 'shipped'),
  (9,  2, '2024-04-30', 'paid'),
  (10, 7, '2024-05-06', 'paid'),
  (11, 3, '2024-05-21', 'paid'),
  (12, 1, '2024-06-01', 'shipped'),
  (13, 5, '2024-06-18', 'cancelled');

INSERT INTO order_items (order_id, product_id, qty) VALUES
  (1, 1, 1), (1, 5, 2),
  (2, 2, 3), (2, 3, 2),
  (3, 4, 1),
  (4, 1, 2), (4, 6, 4), (4, 7, 1),
  (5, 8, 1),
  (6, 9, 2), (6, 5, 1),
  (7, 3, 1), (7, 2, 2), (7, 6, 3),
  (8, 1, 1), (8, 3, 2),
  (9, 7, 2), (9, 9, 1),
  (10, 4, 1), (10, 2, 1),
  (11, 5, 5), (11, 6, 2),
  (12, 1, 3), (12, 9, 2),
  (13, 3, 1);
CREATE TABLE employees (
  id         integer PRIMARY KEY,
  name       text    NOT NULL,
  dept       text    NOT NULL,
  salary     integer NOT NULL CHECK (salary > 0),
  manager_id integer REFERENCES employees (id),
  hired_on   date    NOT NULL
);

INSERT INTO employees (id, name, dept, salary, manager_id, hired_on) VALUES
  (1,  'Ирина',   'правление',   300000, NULL, '2019-03-01'),
  (2,  'Павел',   'разработка',  220000, 1,    '2019-06-15'),
  (3,  'Ольга',   'разработка',  180000, 2,    '2020-02-10'),
  (4,  'Семён',   'разработка',  180000, 2,    '2020-09-01'),
  (5,  'Тимур',   'разработка',  140000, 3,    '2021-04-12'),
  (6,  'Ульяна',  'разработка',  120000, 3,    '2022-01-20'),
  (7,  'Фёдор',   'продажи',     200000, 1,    '2019-11-05'),
  (8,  'Хлоя',    'продажи',     110000, 7,    '2021-08-30'),
  (9,  'Цезарь',  'продажи',     110000, 7,    '2022-05-16'),
  (10, 'Эльвира', 'продажи',      95000, 8,    '2023-02-01'),
  (11, 'Юлия',    'поддержка',    90000, 7,    '2022-10-03'),
  (12, 'Яков',    'поддержка',    85000, 11,   '2023-06-19');`, { filename: "data.sql", collapsed: true }),
    h("check.mjs"),
    code("js", `// check.mjs — проверка запросов. Запуск: node check.mjs queries.sql   (нужны PostgreSQL 16 и пакет pg: npm i pg)
// Подключение — переменные окружения PGHOST, PGPORT, PGUSER, PGPASSWORD. Для проверки создаётся и удаляется временная база,
// в неё загружается data.sql; затем каждый запрос выполняется и сравнивается с эталонным результатом.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) { console.error("usage: node check.mjs queries.sql"); process.exit(2); }

// Эталонные результаты: число столбцов и строки (числа сравниваются как числа, даты — как текст)
const EXPECTED = {
  q01: {"cols":2,"rows":[[4,3480],[8,2100],[10,2150],[12,4360]]},
  q02: {"cols":1,"rows":[["Анна"],["Вера"]]},
  q03: {"cols":4,"rows":[["поддержка","Юлия",90000,1],["поддержка","Яков",85000,2],["правление","Ирина",300000,1],["продажи","Фёдор",200000,1],["продажи","Хлоя",110000,2],["продажи","Цезарь",110000,2],["продажи","Эльвира",95000,4],["разработка","Павел",220000,1],["разработка","Ольга",180000,2],["разработка","Семён",180000,2],["разработка","Тимур",140000,4],["разработка","Ульяна",120000,5]]},
  q04: {"cols":4,"rows":[[1,12,"2024-06-01","shipped"],[2,9,"2024-04-30","paid"],[3,11,"2024-05-21","paid"],[4,6,"2024-03-20","new"],[5,13,"2024-06-18","cancelled"],[7,10,"2024-05-06","paid"]]},
  q05: {"cols":3,"rows":[["2024-01",1380,1380],["2024-02",3550,4930],["2024-03",4330,9260],["2024-04",4890,14150],["2024-05",2880,17030],["2024-06",4360,21390]]},
  q06: {"cols":4,"rows":[[1,1,1380,null],[1,2,1650,1380],[1,7,1370,1650],[1,12,4360,1370],[2,3,1900,null],[2,9,1420,1900],[3,4,3480,null],[3,11,730,3480],[4,6,850,null],[5,8,2100,null],[7,10,2150,null]]},
  q07: {"cols":2,"rows":[["Ольга",1],["Семён",1],["Тимур",2],["Ульяна",2]]},
  q08: {"cols":3,"rows":[["Ирина",11,1830000],["Павел",4,840000],["Фёдор",5,690000],["Ольга",2,440000],["Хлоя",1,205000],["Юлия",1,175000]]},
};
// Дополнительные требования к тексту запроса: [регулярное выражение, описание]
const RULES = [
  ["q01", /with\\s+\\w+\\s+as|from\\s*\\(\\s*select/i, "считает суммы заказов отдельным шагом (CTE или подзапрос)"],
  ["q02", /exists/i, "использует EXISTS"],
  ["q03", /rank\\s*\\(\\s*\\)\\s+over\\s*\\(\\s*partition\\s+by/i, "использует rank() с PARTITION BY"],
  ["q04", /row_number\\s*\\(\\s*\\)\\s+over/i, "использует row_number()"],
  ["q05", /sum\\s*\\([^)]*\\)\\s+over/i, "считает нарастающий итог оконной суммой"],
  ["q06", /lag\\s*\\(/i, "использует lag()"],
  ["q07", /with\\s+recursive/i, "использует WITH RECURSIVE"],
  ["q08", /with\\s+recursive/i, "использует WITH RECURSIVE"],
];

pg.types.setTypeParser(1082, (v) => v);                       // date → строка «ГГГГ-ММ-ДД»
const norm = (v) => (typeof v === "string" && /^-?\\d+(\\.\\d+)?$/.test(v) ? Number(v) : v instanceof Date ? v.toISOString() : v);

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });

// Разбор файла на ответы: строка «-- qNN» открывает ответ NN
const text = readFileSync(file, "utf8");
const answers = {};
let current = null;
for (const line of text.split("\\n")) {
  const m = line.match(/^--\\s*(q\\d\\d)\\b/i);
  if (m) { current = m[1].toLowerCase(); answers[current] = ""; continue; }
  if (current && !/^\\s*--/.test(line)) answers[current] += line + "\\n";
}
const sql = (id) => (answers[id] ?? "").trim();
check(\`файл содержит все \${Object.keys(EXPECTED).length} ответов (q01…)\`, Object.keys(EXPECTED).every((id) => id in answers), \`найдены: \${Object.keys(answers).join(", ") || "ни одного"}\`);

const admin = new pg.Client({ database: "postgres" });
await admin.connect();
const dbName = "chk_" + Math.random().toString(36).slice(2, 10);
await admin.query(\`create database \${dbName}\`);
try {
  execFileSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-d", dbName, "-f", "data.sql"], { stdio: ["ignore", "ignore", "pipe"] });
  const c = new pg.Client({ database: dbName });
  await c.connect();
  for (const [id, want] of Object.entries(EXPECTED)) {
    const text = sql(id).replace(/;\\s*$/, "");
    if (!text || /TODO/.test(text)) { check(\`\${id}: запрос написан\`, false, "нет запроса"); continue; }
    let res;
    try { res = await c.query({ text, rowMode: "array" }); }
    catch (e) { check(\`\${id}: запрос выполняется\`, false, e.message.split("\\n")[0]); continue; }
    if (Array.isArray(res)) { check(\`\${id}: один запрос на вопрос\`, false, \`команд: \${res.length}\`); continue; }
    const cols = res.fields.length;
    const rows = res.rows.map((r) => r.map(norm));
    const same = cols === want.cols && JSON.stringify(rows) === JSON.stringify(want.rows);
    check(\`\${id}: результат совпадает с эталоном\`, same,
      cols !== want.cols ? \`столбцов \${cols}, ожидалось \${want.cols}\` : \`строк \${rows.length}, ожидалось \${want.rows.length}; первое расхождение: \${JSON.stringify(rows.find((r, i) => JSON.stringify(r) !== JSON.stringify(want.rows[i])) ?? null)}\`);
  }
  await c.end();
} finally {
  await admin.query(\`drop database \${dbName} with (force)\`);
  await admin.end();
}
// Требования к тексту запросов
for (const [id, re, what] of RULES) check(\`\${id}: \${what}\`, re.test ? re.test(sql(id)) : new RegExp(re, "i").test(sql(id)));

const failed = results.filter((r) => !r.ok);
for (const r of failed) console.log(\`✗ \${r.name} — \${r.detail}\`);
console.log(\`Пройдено проверок: \${results.length - failed.length} из \${results.length}\`);
if (failed.length) console.log(\`Не прошли: \${failed.length}\`);
process.exit(failed.length ? 1 : 0);`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 17 из 17`, { filename: "результат node check.mjs solution.sql (PostgreSQL 16.14)" }),
    code("text", `✗ q01: запрос написан — нет запроса
✗ q02: запрос написан — нет запроса
✗ q03: запрос написан — нет запроса
✗ q04: запрос написан — нет запроса
✗ q05: запрос написан — нет запроса
✗ q06: запрос написан — нет запроса
✗ q07: запрос написан — нет запроса
✗ q08: запрос написан — нет запроса
✗ q01: считает суммы заказов отдельным шагом (CTE или подзапрос) — 
✗ q02: использует EXISTS — 
✗ q03: использует rank() с PARTITION BY — 
✗ q04: использует row_number() — 
✗ q05: считает нарастающий итог оконной суммой — 
✗ q06: использует lag() — 
✗ q07: использует WITH RECURSIVE — 
✗ q08: использует WITH RECURSIVE — 
Пройдено проверок: 1 из 17
Не прошли: 16`, { filename: "результат node check.mjs starter.sql (заготовка)" }),
    code("text", `b1-dense-rank: Пройдено проверок: 16 из 17
b2-row-number-for-ties: Пройдено проверок: 15 из 17
b3-earliest-order: Пройдено проверок: 16 из 17
b4-total-not-running: Пройдено проверок: 16 из 17
b5-lead-not-lag: Пройдено проверок: 15 из 17
b6-anchor-includes-root: Пройдено проверок: 16 из 17
b7-team-size-counts-root: Пройдено проверок: 16 из 17
b8-average-with-cancelled: Пройдено проверок: 16 из 17`, { filename: "результат check.mjs для вариантов с ошибками (mutants/)" }),
    tip("Эталонные результаты записаны в `check.mjs` (объект `EXPECTED`), поэтому проверка воспроизводима без эталонного решения. Нужны `psql` в `PATH` и пакет `pg` (`npm i pg`)."),
    warn("Оконные функции легко «почти» дают правильный ответ на ваших данных: ничьи и границы групп проявляются на пограничных случаях. Проверяйте запросы на данных с равными значениями, пустыми группами и единственными элементами."),
  ],
};
