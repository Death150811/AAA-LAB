import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p03JoinReports: Project = {
  id: "sql.p03-join-reports",
  domain: "sql",
  order: 3,
  title: "Отчёты по связям",
  subtitle: "Десять отчётов на JOIN: клиенты без заказов, выручка с нулями, долги по оплатам, иерархия сотрудников, пары и матрица — без потерянных строк и размножения сумм",
  level: "core",
  estimatedHours: 10,
  buildsOn: ["sql.p02-sales-analytics"],
  topics: ["sql.inner-left-joins", "sql.other-joins", "sql.join-pitfalls", "sql.group-by-having", "sql.keys-constraints"],
  objective:
    "Написать файл `queries.sql` с **десятью отчётами**, каждый из которых требует соединения таблиц. Проект про выбор вида `JOIN` и про его ловушки: `INNER` теряет клиентов без заказов, фильтр в `WHERE` превращает `LEFT JOIN` во внутреннее соединение, соединение двух «дочерних» таблиц размножает суммы, а `NULL` в ключе ломает сравнение. Результат каждого отчёта сверяется с эталоном по столбцам, строкам и порядку.",
  scenario: [
    p("Бухгалтер «Кофейни» просит отчёты: какие клиенты ни разу не покупали, сколько выручки принесли все клиенты (в том числе нулевые), по каким заказам не хватает оплат, кто кому подчиняется. Данные лежат в шести таблицах (`customers`, `products`, `orders`, `order_items`, `payments`, `employees`; скрипт `data.sql`), и ни один вопрос не решается одной таблицей."),
    p("В файле `queries.sql` комментарий `-- qNN` открывает ответ на вопрос NN; под ним — **один** `SELECT`. Проверка `check.mjs` создаёт временную базу, загружает `data.sql`, выполняет ответы и сравнивает с эталоном; затем проверяет текст запросов: `LEFT JOIN` в q02 и q04, `COALESCE` в q03, самосоединение в q08, `CROSS JOIN` в q10. Всего **17 проверок**."),
    code("sql", `-- Заготовка проекта «Отчёты по связям». Под каждым комментарием напишите один SELECT (завершайте точкой с запятой).
-- Проверка: node check.mjs queries.sql   (данные — data.sql: таблицы магазина, оплаты и сотрудники)
-- Формат: строка «-- qNN» открывает ответ на вопрос NN; порядок и число столбцов заданы вопросом.

-- q01 Все заказы с именем клиента: номер заказа, имя клиента, статус; по номеру заказа
-- TODO: SELECT …;

-- q02 Клиенты, у которых нет ни одного заказа: только имена, по алфавиту
-- TODO: SELECT …;

-- q03 Выручка по каждому клиенту без отменённых заказов (0, если заказов нет): имя и выручка; по убыванию выручки, затем по имени
-- TODO: SELECT …;

-- q04 Товары, которые ни разу не продавались ни в одном заказе: только названия, по алфавиту
-- TODO: SELECT …;

-- q05 Сколько штук продано в каждой категории (отменённые заказы не считаются): категория и количество; по категории
-- TODO: SELECT …;

-- q06 Для каждого не отменённого заказа: номер, сумма позиций и сумма оплат (0, если оплат нет); по номеру заказа
-- TODO: SELECT …;

-- q07 Заказы с долгом (сумма позиций больше оплаченного; отменённые не считаются): номер заказа и долг; по номеру
-- TODO: SELECT …;

-- q08 Сотрудники и их руководители (у главы руководителя нет): имя сотрудника и имя руководителя; по идентификатору сотрудника
-- TODO: SELECT …;

-- q09 Пары клиентов из одного города (каждая пара один раз): город, первый клиент, второй клиент; по городу и именам
-- TODO: SELECT …;

-- q10 Матрица «клиент из Москвы × категория»: имя, категория и число заказанных штук (0, если не заказывал; отменённые не считаются); по имени и категории
-- TODO: SELECT …;`, { filename: "starter/queries.sql", collapsed: true }),
    table(
      ["№", "Отчёт", "Вид соединения и ловушка"],
      [
        ["q01", "Заказы с именем клиента и статусом", "`INNER JOIN` по внешнему ключу"],
        ["q02", "Клиенты без единого заказа", "`LEFT JOIN … IS NULL` (антисоединение)"],
        ["q03", "Выручка по клиентам без отменённых заказов, с нулями", "`LEFT JOIN` цепочкой; условие по статусу — в `ON`, а не в `WHERE`; `COALESCE`"],
        ["q04", "Товары, которые не продавались", "`LEFT JOIN … IS NULL`; `= NULL` не работает"],
        ["q05", "Продано штук по категориям без отменённых заказов", "Три таблицы, агрегат по `sum(qty)`, а не по числу заказов"],
        ["q06", "Сумма заказа и сумма оплат по каждому заказу", "Агрегаты каждой «дочерней» таблицы — **до** соединения"],
        ["q07", "Заказы с долгом", "То же + условие «заказано больше, чем оплачено»"],
        ["q08", "Сотрудники и руководители", "Самосоединение `LEFT JOIN`: у главы руководителя нет"],
        ["q09", "Пары клиентов из одного города", "Самосоединение с условием `a.name < b.name` (пара один раз)"],
        ["q10", "Матрица «клиент из Москвы × категория»", "`CROSS JOIN` + `LEFT JOIN` на агрегат; нули"],
      ],
      "Отчёты проекта",
    ),
  ],
  requirements: [
    "`queries.sql` содержит ответы `q01`…`q10`; под каждым маркером `-- qNN` — ровно один запрос `SELECT`.",
    "Результат каждого отчёта совпадает с эталоном по числу и порядку столбцов, строкам и их порядку (имена столбцов не проверяются, `ORDER BY` задан в формулировке).",
    "q02 и q04 — «нет связанных строк»: `LEFT JOIN` и проверка `IS NULL` по столбцу правой таблицы.",
    "q03: все восемь клиентов, включая Егора и Игоря с нулевой выручкой; отменённые заказы не учитываются, но клиенты с отменёнными заказами остаются; условие по статусу записано в `ON`.",
    "q05: категории считаются по штукам (`sum(qty)`); q06 и q07: суммы позиций и оплат вычисляются отдельными агрегатами **до** соединения с заказами — иначе оплаты умножаются на число позиций.",
    "q08: все двенадцать сотрудников, руководитель главы — `NULL`; q09: каждая пара клиентов из одного города один раз.",
    "q10: девять строк (три клиента из Москвы × три категории), нули там, где клиент ничего не заказывал в категории.",
  ],
  constraints: [
    "Только `SELECT`; подзапрос в `FROM` допустим там, где нужно свернуть данные до соединения (q06, q07, q10); оконные функции и `CTE` — не нужны.",
    "Нельзя заменять соединения подзапросами в `SELECT`-списке и подставлять значения вручную.",
    "Нельзя использовать `SELECT *`; столбцы названы явно в заданном порядке.",
    "Нельзя менять данные и схему; один запрос на вопрос.",
    "Фильтр по правой таблице `LEFT JOIN` не должен убирать строки левой, для которых совпадений нет.",
  ],
  expected: [
    "`node check.mjs queries.sql` печатает `Пройдено проверок: 17 из 17`.",
    "Заготовка проходит 1 проверку из 17 (маркеры на месте).",
    "Каждый из восьми «плохих» вариантов проваливает ровно одну проверку.",
    "q03 возвращает восемь строк: у Анны 8 760, у Егора и Игоря — 0; q06 — одиннадцать заказов, q07 — семь заказов с долгом.",
  ],
  technical: [
    "`INNER JOIN` оставляет только совпавшие строки, `LEFT JOIN` — все строки левой стороны; несовпавшая правая сторона заполняется `NULL`.",
    "Антисоединение «нет связанных строк»: `LEFT JOIN … WHERE правая.ключ IS NULL`. Проверять нужно столбец правой таблицы, который не бывает `NULL` у совпавшей строки (обычно её ключ).",
    "Условие на правую таблицу `LEFT JOIN` в `WHERE` отбрасывает строки с `NULL` — соединение становится внутренним. Условия, которые должны лишь **ограничить совпадения**, записывают в `ON`.",
    "Если присоединить к заказу и позиции, и оплаты, строка заказа размножается на (позиции × оплаты): суммы раздуваются. Лечение — свернуть каждую дочернюю таблицу до одной строки на заказ (`GROUP BY order_id`) и присоединять свёртки.",
    "`COALESCE(sum(...), 0)` превращает «нет данных» в 0; сам `sum` по пустому набору возвращает `NULL`.",
    "Самосоединение — обычный `JOIN` таблицы с самой собой под разными псевдонимами; условие `a.name < b.name` оставляет каждую пару один раз и убирает пары «сам с собой».",
    "`CROSS JOIN` даёт все сочетания; чтобы показать нули, к нему присоединяют агрегат через `LEFT JOIN` и подставляют `COALESCE`.",
  ],
  acceptance: [
    "`node check.mjs queries.sql` — 17 из 17.",
    "Заготовка проходит 1 из 17; каждый из восьми плохих вариантов проваливает ровно одну проверку.",
    "В q03 условие `status <> 'cancelled'` находится в `ON`, в q06 и q07 суммы вычисляются до соединения.",
    "Нет `SELECT *`, `NOT IN` по столбцам с `NULL` и ручных идентификаторов.",
  ],
  hints: [
    "q03 вернул шесть строк вместо восьми? Клиенты без подходящих заказов исчезли — вероятно, `INNER JOIN` или условие по статусу в `WHERE`. Перенесите условие в `ON`.",
    "q04 пуст, хотя непроданный товар есть: проверьте `IS NULL` и то, что условие стоит по столбцу правой таблицы, а не `= NULL`.",
    "Суммы оплат в q06 слишком большие: заказ с несколькими позициями и оплатами размножился. Сверните позиции и оплаты отдельными подзапросами `GROUP BY order_id`.",
    "q09 вернул десять строк вместо пяти: условие `a.name <> b.name` даёт каждую пару дважды; нужно `<`.",
    "q08 потерял главу — соединение внутреннее; нужен `LEFT JOIN`, а руководитель главы будет `NULL`.",
    "q10: сначала `CROSS JOIN` клиентов Москвы и категорий, потом `LEFT JOIN` свёртки «клиент, категория, штуки»; не забудьте `COALESCE`.",
    "Если сомневаетесь в размере результата, посчитайте строки до и после соединения: рост числа строк — признак размножения.",
  ],
  advanced: [
    "Решите q02 тремя способами — `LEFT JOIN … IS NULL`, `NOT EXISTS`, `NOT IN` — и объясните, при каком условии `NOT IN` вернёт неверный (пустой) результат.",
    "Добавьте `FULL JOIN` для сверки «заказы без оплат и оплаты без заказов» и подготовьте данные, при которых вторая часть не пуста.",
    "Перепишите q06 с `WITH` (CTE) и сравните читаемость с подзапросами в `FROM`.",
    "Найдите в q03 и q10 места, где изменение порядка соединений не меняет результат, и места, где меняет.",
    "Постройте на большой таблице заказов `EXPLAIN` для q03 и объясните, какой алгоритм соединения выбран и какие индексы по внешним ключам его улучшат.",
  ],
  failureModes: [
    "**`INNER JOIN` вместо `LEFT JOIN` в q03:** клиенты без заказов (Егор, Игорь) и без подходящих заказов теряются (1 из 17).",
    "**Фильтр по статусу в `WHERE`:** `LEFT JOIN` вырождается во внутреннее, строки с `NULL` отбрасываются (1 из 17).",
    "**Размножение сумм в q06:** суммы позиций и оплат соединены напрямую, итоги раздуты (1 из 17).",
    "**`INNER JOIN` для руководителей:** глава без руководителя исчезает из q08 (1 из 17).",
    "**`a.name <> b.name` в q09:** каждая пара выводится дважды (1 из 17).",
    "**`= NULL` вместо `IS NULL` в q04:** непроданный товар не находится, результат пуст (1 из 17).",
    "**Подсчёт заказов вместо штук в q05:** `count(DISTINCT o.id)` не равно `sum(qty)` (1 из 17).",
    "**Нет `CROSS JOIN` в q10:** результат совпадает, но нарушено требование к форме запроса; проверка текста краснеет (1 из 17).",
  ],
  rubric: [
    { criterion: "Выбор вида соединения", weight: 25, description: "`INNER` там, где нужны совпадения; `LEFT` там, где нельзя потерять строки; `CROSS` для матрицы; самосоединения." },
    { criterion: "Антисоединения и NULL", weight: 15, description: "`LEFT JOIN … IS NULL`, `COALESCE`, условия в `ON`, а не в `WHERE`; нули для клиентов без заказов." },
    { criterion: "Суммы без размножения", weight: 25, description: "Свёртка дочерних таблиц до соединения; верные суммы позиций и оплат; `sum(qty)`." },
    { criterion: "Корректность результатов", weight: 25, description: "Совпадение всех десяти отчётов с эталоном по столбцам, строкам и порядку." },
    { criterion: "Читаемость", weight: 10, description: "Псевдонимы таблиц, выровненные `JOIN … ON`, явные столбцы, понятная структура подзапросов." },
  ],
  solution: [
    p("Эталон — файл `queries.sql` из десяти отчётов (около 80 строк). Он проходит все 17 проверок; заготовка проходит 1 из 17, а каждый из восьми намеренно испорченных вариантов проваливает ровно одну проверку. Ниже — решение, проверяющий скрипт и результаты запусков на PostgreSQL 16.14."),
    h("queries.sql"),
    code("sql", `-- Отчёты по связям «Кофейни»: десять запросов к таблицам customers, products, orders, order_items, payments и employees

-- q01 Все заказы с именем клиента: номер заказа, имя клиента, статус; по номеру заказа
SELECT o.id, c.name, o.status
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
ORDER BY o.id;

-- q02 Клиенты, у которых нет ни одного заказа: только имена, по алфавиту
SELECT c.name
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.name;

-- q03 Выручка по каждому клиенту без отменённых заказов (0, если заказов нет): имя и выручка; по убыванию выручки, затем по имени
SELECT c.name, COALESCE(sum(oi.qty * p.price), 0) AS revenue
FROM customers AS c
LEFT JOIN orders      AS o  ON o.customer_id = c.id AND o.status <> 'cancelled'
LEFT JOIN order_items AS oi ON oi.order_id = o.id
LEFT JOIN products    AS p  ON p.id = oi.product_id
GROUP BY c.id, c.name
ORDER BY revenue DESC, c.name;

-- q04 Товары, которые ни разу не продавались ни в одном заказе: только названия, по алфавиту
SELECT p.title
FROM products AS p
LEFT JOIN order_items AS oi ON oi.product_id = p.id
WHERE oi.order_id IS NULL
ORDER BY p.title;

-- q05 Сколько штук продано в каждой категории (отменённые заказы не считаются): категория и количество; по категории
SELECT p.category, sum(oi.qty) AS qty
FROM order_items AS oi
JOIN orders   AS o ON o.id = oi.order_id AND o.status <> 'cancelled'
JOIN products AS p ON p.id = oi.product_id
GROUP BY p.category
ORDER BY p.category;

-- q06 Для каждого не отменённого заказа: номер, сумма позиций и сумма оплат (0, если оплат нет); по номеру заказа
SELECT o.id, t.order_total, COALESCE(pay.paid_total, 0) AS paid_total
FROM orders AS o
JOIN (SELECT oi.order_id, sum(oi.qty * p.price) AS order_total
      FROM order_items AS oi JOIN products AS p ON p.id = oi.product_id
      GROUP BY oi.order_id) AS t ON t.order_id = o.id
LEFT JOIN (SELECT order_id, sum(amount) AS paid_total FROM payments GROUP BY order_id) AS pay ON pay.order_id = o.id
WHERE o.status <> 'cancelled'
ORDER BY o.id;

-- q07 Заказы с долгом (сумма позиций больше оплаченного; отменённые не считаются): номер заказа и долг; по номеру
SELECT o.id, t.order_total - COALESCE(pay.paid_total, 0) AS debt
FROM orders AS o
JOIN (SELECT oi.order_id, sum(oi.qty * p.price) AS order_total
      FROM order_items AS oi JOIN products AS p ON p.id = oi.product_id
      GROUP BY oi.order_id) AS t ON t.order_id = o.id
LEFT JOIN (SELECT order_id, sum(amount) AS paid_total FROM payments GROUP BY order_id) AS pay ON pay.order_id = o.id
WHERE o.status <> 'cancelled' AND t.order_total > COALESCE(pay.paid_total, 0)
ORDER BY o.id;

-- q08 Сотрудники и их руководители (у главы руководителя нет): имя сотрудника и имя руководителя; по идентификатору сотрудника
SELECT e.name AS employee, m.name AS manager
FROM employees AS e
LEFT JOIN employees AS m ON m.id = e.manager_id
ORDER BY e.id;

-- q09 Пары клиентов из одного города (каждая пара один раз): город, первый клиент, второй клиент; по городу и именам
SELECT a.city, a.name AS first_customer, b.name AS second_customer
FROM customers AS a
JOIN customers AS b ON b.city = a.city AND a.name < b.name
ORDER BY a.city, a.name, b.name;

-- q10 Матрица «клиент из Москвы × категория»: имя, категория и число заказанных штук (0, если не заказывал; отменённые не считаются); по имени и категории
SELECT c.name, cat.category, COALESCE(s.qty, 0) AS qty
FROM customers AS c
CROSS JOIN (SELECT DISTINCT category FROM products) AS cat
LEFT JOIN (SELECT o.customer_id, p.category, sum(oi.qty) AS qty
           FROM orders AS o
           JOIN order_items AS oi ON oi.order_id = o.id
           JOIN products AS p ON p.id = oi.product_id
           WHERE o.status <> 'cancelled'
           GROUP BY o.customer_id, p.category) AS s ON s.customer_id = c.id AND s.category = cat.category
WHERE c.city = 'Москва'
ORDER BY c.name, cat.category;`, { filename: "queries.sql", lineNumbers: true }),
    ul(
      "**q03:** три `LEFT JOIN` подряд; условие `o.status <> 'cancelled'` — в `ON` первого из них, поэтому клиенты без подходящих заказов остаются с `NULL`, а `COALESCE(sum(...), 0)` даёт им 0.",
      "**q06/q07:** каждая «дочерняя» таблица сворачивается в подзапросе `GROUP BY order_id`, и только свёртки присоединяются к заказам — размножение исключено.",
      "**q08/q09:** самосоединения; `LEFT JOIN` сохраняет главу, `a.name < b.name` убирает дубли пар.",
      "**q10:** `CROSS JOIN` даёт все пары «клиент × категория», `LEFT JOIN` присоединяет свёртку штук, `COALESCE` подставляет нули.",
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

-- Платежи: заказ 4 оплачен двумя платежами (2000 + 1480 = 3480), заказ 2 — двумя по 825 (1650)
CREATE TABLE payments (
  id       integer PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders (id),
  amount   numeric(10, 2) NOT NULL CHECK (amount > 0)
);
INSERT INTO payments (id, order_id, amount) VALUES
  (1, 1, 1380), (2, 2, 825), (3, 2, 825), (4, 4, 2000), (5, 4, 1480), (6, 7, 1370);
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
  q01: {"cols":3,"rows":[[1,"Анна","paid"],[2,"Анна","paid"],[3,"Борис","shipped"],[4,"Вера","paid"],[5,"Вера","cancelled"],[6,"Глеб","new"],[7,"Анна","paid"],[8,"Дарья","shipped"],[9,"Борис","paid"],[10,"Жанна","paid"],[11,"Вера","paid"],[12,"Анна","shipped"],[13,"Дарья","cancelled"]]},
  q02: {"cols":1,"rows":[["Егор"],["Игорь"]]},
  q03: {"cols":2,"rows":[["Анна",8760],["Вера",4210],["Борис",3320],["Жанна",2150],["Дарья",2100],["Глеб",850],["Егор",0],["Игорь",0]]},
  q04: {"cols":1,"rows":[["Термокружка"]]},
  q05: {"cols":2,"rows":[["напитки",18],["посуда",7],["продукты",20]]},
  q06: {"cols":3,"rows":[[1,1380,1380],[2,1650,1650],[3,1900,0],[4,3480,3480],[6,850,0],[7,1370,1370],[8,2100,0],[9,1420,0],[10,2150,0],[11,730,0],[12,4360,0]]},
  q07: {"cols":2,"rows":[[3,1900],[6,850],[8,2100],[9,1420],[10,2150],[11,730],[12,4360]]},
  q08: {"cols":2,"rows":[["Ирина",null],["Павел","Ирина"],["Ольга","Павел"],["Семён","Павел"],["Тимур","Ольга"],["Ульяна","Ольга"],["Фёдор","Ирина"],["Хлоя","Фёдор"],["Цезарь","Фёдор"],["Эльвира","Хлоя"],["Юлия","Фёдор"],["Яков","Юлия"]]},
  q09: {"cols":3,"rows":[["Казань","Борис","Дарья"],["Москва","Анна","Вера"],["Москва","Анна","Жанна"],["Москва","Вера","Жанна"],["Самара","Глеб","Игорь"]]},
  q10: {"cols":3,"rows":[["Анна","напитки",11],["Анна","посуда",3],["Анна","продукты",5],["Вера","напитки",2],["Вера","посуда",0],["Вера","продукты",12],["Жанна","напитки",1],["Жанна","посуда",1],["Жанна","продукты",0]]},
};
// Дополнительные требования к тексту запроса: [регулярное выражение, описание]
const RULES = [
  ["q02", /left\\s+join/i, "использует LEFT JOIN"],
  ["q02", /is\\s+null/i, "ищет отсутствие через IS NULL"],
  ["q03", /coalesce/i, "подставляет 0 через COALESCE"],
  ["q04", /left\\s+join/i, "использует LEFT JOIN"],
  ["q08", /employees\\s+(as\\s+)?\\w+\\s+left\\s+join\\s+employees|join\\s+employees/i, "соединяет employees с самой собой"],
  ["q10", /cross\\s+join/i, "использует CROSS JOIN"],
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
✗ q09: запрос написан — нет запроса
✗ q10: запрос написан — нет запроса
✗ q02: использует LEFT JOIN — 
✗ q02: ищет отсутствие через IS NULL — 
✗ q03: подставляет 0 через COALESCE — 
✗ q04: использует LEFT JOIN — 
✗ q08: соединяет employees с самой собой — 
✗ q10: использует CROSS JOIN — 
Пройдено проверок: 1 из 17
Не прошли: 16`, { filename: "результат node check.mjs starter.sql (заготовка)" }),
    code("text", `b1-inner-join-customers: Пройдено проверок: 16 из 17
b2-filter-in-where: Пройдено проверок: 16 из 17
b3-fan-out-sum: Пройдено проверок: 16 из 17
b4-manager-inner-join: Пройдено проверок: 16 из 17
b5-pairs-both-orders: Пройдено проверок: 16 из 17
b6-anti-join-equals-null: Пройдено проверок: 16 из 17
b7-count-orders-not-qty: Пройдено проверок: 16 из 17
b8-no-cross-join: Пройдено проверок: 16 из 17`, { filename: "результат check.mjs для вариантов с ошибками (mutants/)" }),
    tip("Эталонные результаты записаны прямо в `check.mjs` (объект `EXPECTED`), поэтому проверка воспроизводима без эталонного решения. Нужны `psql` в `PATH` и пакет `pg` (`npm i pg`)."),
    warn("Размножение строк не всегда видно по результату: суммы могут просто оказаться больше. Привыкайте сравнивать число строк до и после соединения и сверять итоги с независимым подсчётом."),
  ],
};
