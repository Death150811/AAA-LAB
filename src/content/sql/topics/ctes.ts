import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  table,
  def,
  beforeAfter,
  annotated,
  diagram,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const ctes: Topic = {
  id: "sql.ctes",
  slug: "ctes",
  domain: "sql",
  module: "advanced-sql",
  title: "CTE: именованные шаги запроса",
  titleEn: "Common Table Expressions (WITH)",
  summary:
    "CTE (`WITH имя AS (запрос)`) даёт подзапросу имя и позволяет строить сложный запрос как конвейер читаемых шагов. Тема на замерах PostgreSQL 16.14 и SQLite 3.49 показывает, как разложить отчёт на шаги «заказы → клиенты → доля в выручке» (Анна — 41,0%), как использовать одно вычисление несколько раз, как изменилось выполнение CTE в PostgreSQL 12+ (CTE, использованная один раз, подставляется в запрос — узла CTE в плане нет; использованная дважды — материализуется и читается узлом `CTE Scan`; `NOT MATERIALIZED` подставляет её и в этом случае), почему CTE с нестабильной функцией не подставляется ни при каких условиях и как модифицирующие CTE (`WITH … UPDATE … RETURNING`) изменяют цены и пишут журнал одним оператором.",
  minutes: 70,
  prerequisites: ["sql.subqueries", "sql.group-by-having"],
  tags: ["CTE", "WITH", "MATERIALIZED", "NOT MATERIALIZED", "CTE Scan", "inline", "data-modifying CTE", "query readability", "pipeline", "optimization fence", "derived table"],
  keyConcepts: [
    { term: "CTE — именованный шаг запроса", text: "`WITH order_totals AS (…), customer_totals AS (…) SELECT …` читается сверху вниз, как конвейер: каждый шаг получает имя и может использовать предыдущие." },
    { term: "Одно вычисление — много использований", text: "`stats` с `avg(price)` и `max(price)` посчитана один раз и использована в двух выражениях (разница от среднего и доля от максимума)." },
    { term: "PostgreSQL 12+: подстановка и материализация", text: "CTE, на которую есть одна ссылка и которая без побочных эффектов, подставляется в запрос (в плане нет узла CTE); с двумя ссылками — материализуется (`CTE Scan on expensive`); `NOT MATERIALIZED` подставляет и её." },
    { term: "Нестабильные функции не подставляются", text: "CTE с `random()` осталась в плане (`CTE r`) даже с `NOT MATERIALIZED`: оба обращения увидели одно значение (`same_value = t`)." },
    { term: "Модифицирующие CTE", text: "`WITH changed AS (UPDATE … RETURNING …) INSERT INTO log SELECT … FROM changed` — изменение данных и запись журнала одним атомарным оператором (в замере 4 строки посуды подорожали на 5%)." },
  ],
  sections: [
    section("definition", [
      def("CTE", "Common Table Expression — именованный подзапрос в предложении `WITH`, видимый только внутри одного оператора. Может ссылаться на предыдущие CTE того же `WITH`.", "common table expression"),
      def("Материализация", "Однократное вычисление результата CTE с сохранением его (в памяти или на диске) и последующим чтением узлом `CTE Scan`.", "materialization"),
      def("Подстановка (inlining)", "Планировщик встраивает определение CTE в основной запрос, как будто это обычный подзапрос — это позволяет передавать условия внутрь и использовать индексы.", "inlining"),
      def("Забор оптимизации", "Историческое свойство CTE в PostgreSQL до 12: всегда материализовалась и мешала планировщику оптимизировать запрос «сквозь» неё.", "optimization fence"),
      def("Модифицирующая CTE", "CTE с `INSERT`/`UPDATE`/`DELETE … RETURNING`: изменяет данные и отдаёт строки следующим шагам запроса (PostgreSQL).", "data-modifying CTE"),
      def("Конвейер запроса", "Организация сложного запроса как последовательности CTE, где каждый шаг решает одну небольшую задачу и называется по смыслу.", "query pipeline"),
    ]),

    section("why", [
      h("Читаемость — главный довод"),
      p("Запросы-отчёты с вложенными подзапросами в три-четыре уровня читать и проверять трудно: чтобы понять внешний запрос, нужно мысленно «раскрыть» всё содержимое. CTE разворачивает вложенность в список: «сначала посчитаем итоги заказов, затем сложим по клиентам, затем найдём долю». Каждый шаг можно запустить отдельно и проверить на глаз."),
      ul(
        "**Читаемость и сопровождение:** имена шагов документируют замысел.",
        "**Повторное использование:** одно вычисление используется несколько раз в одном запросе.",
        "**Отладка:** выделите шаг в отдельный `SELECT` и проверьте промежуточный результат.",
        "**Атомарные многошаговые изменения:** модифицирующие CTE объединяют изменение и запись следов в одну команду.",
        "**Основа рекурсии:** `WITH RECURSIVE` строится на том же синтаксисе (следующая тема).",
      ),
    ]),

    section("mental-model", [
      h("Временные имена на один запрос"),
      p("Представьте, что перед основным запросом вы объявляете несколько временных «таблиц», которые существуют только пока выполняется этот запрос. Они не создаются в схеме, не хранятся после выполнения и не видны другим запросам. Это не отдельный объект базы данных, а часть одного оператора."),
      diagram(
        `
        WITH order_totals    AS ( … заказы → суммы заказов … ),
             customer_totals AS ( … SELECT … FROM order_totals … ),     ← видит предыдущую CTE
             grand           AS ( … SELECT sum(revenue) FROM customer_totals … )
        SELECT … FROM customer_totals JOIN grand …                        ← видит все
        `,
        "CTE объявляются сверху вниз; каждая может использовать любую из предыдущих, но не последующие (кроме рекурсии).",
      ),
      h("CTE, подзапрос или представление?"),
      table(
        ["Приём", "Область видимости", "Когда выбирать"],
        [
          ["Подзапрос в `FROM`", "Один запрос, одно место", "Простой шаг, использованный один раз"],
          ["CTE", "Один запрос, много мест", "Несколько шагов, повторное использование, читаемость"],
          ["Представление (`VIEW`)", "Вся база данных", "Повторяется в разных запросах и разными людьми"],
          ["Временная таблица", "Сессия", "Дорогой промежуточный результат нужен многим запросам или нужны индексы"],
        ],
        "Выбор способа именовать промежуточный результат",
      ),
    ]),

    section("technical", [
      h("Синтаксис"),
      ul(
        "`WITH a AS (SELECT …), b AS (SELECT … FROM a) SELECT … FROM b;` — несколько CTE через запятую, без повторного слова `WITH`.",
        "Список столбцов: `WITH t(x, y) AS (VALUES (1, 'a'))`.",
        "`WITH` можно ставить перед `SELECT`, `INSERT`, `UPDATE`, `DELETE`.",
        "`WITH RECURSIVE` — рекурсивные CTE (отдельная тема).",
      ),
      h("Как PostgreSQL выполняет CTE (12+)"),
      table(
        ["Условие", "Поведение"],
        [
          ["CTE используется **один раз**, без побочных эффектов и нестабильных функций", "Подставляется в основной запрос (inline): условия и индексы работают «сквозь»"],
          ["CTE используется **несколько раз**", "Материализуется: вычисляется один раз, читается узлом `CTE Scan`"],
          ["`AS MATERIALIZED`", "Всегда материализуется (забор оптимизации — намеренно)"],
          ["`AS NOT MATERIALIZED`", "Подставляется, даже если используется несколько раз (вычисляется на каждое использование)"],
          ["Содержит `INSERT`/`UPDATE`/`DELETE` или нестабильную функцию", "Не подставляется: выполняется ровно один раз"],
        ],
        "Подстановка и материализация (PostgreSQL 12+)",
      ),
      h("SQLite"),
      p("SQLite поддерживает CTE с версии 3.8.3 и рекурсию; `MATERIALIZED`/`NOT MATERIALIZED` — с 3.35. Модифицирующих CTE нет."),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `-- Шаг 1: сумма каждого неотменённого заказа. Шаг 2: клиенты, чья выручка выше средней по клиентам.
WITH order_totals AS (
  SELECT o.id AS order_id, o.customer_id, sum(oi.qty * p.price) AS total
  FROM orders AS o
  JOIN order_items AS oi ON oi.order_id = o.id
  JOIN products AS p ON p.id = oi.product_id
  WHERE o.status <> 'cancelled'
  GROUP BY o.id, o.customer_id
),
customer_totals AS (
  SELECT customer_id, sum(total) AS revenue, count(*) AS orders
  FROM order_totals
  GROUP BY customer_id
)
SELECT c.name, ct.orders, ct.revenue
FROM customer_totals AS ct
JOIN customers AS c ON c.id = ct.customer_id
WHERE ct.revenue > (SELECT avg(revenue) FROM customer_totals)
ORDER BY ct.revenue DESC;`,
        [
          { line: 1, text: "Комментарий формулирует два шага и итоговую выборку." },
          { line: [2, 9], text: "Первая CTE `order_totals` считает сумму каждого неотменённого заказа (соединение с позициями и товарами, группировка по заказу)." },
          { line: [10, 14], text: "Вторая CTE `customer_totals` использует первую: суммирует заказы клиента и считает их число." },
          { line: [15, 17], text: "Основной запрос соединяет итоги с клиентами." },
          { line: 18, text: "В `WHERE` — подзапрос по той же CTE: средняя выручка по клиентам; CTE используется дважды (в `FROM` и в подзапросе)." },
          { line: 19, text: "`ORDER BY` — детерминированный порядок результата." },
        ],
        "01-basic.sql",
      ),
    ]),

    section("minimal-example", [
      p("Отчёт в два шага: сначала суммы заказов, затем суммы по клиентам и сравнение со средним. Нажмите «Выполнить в браузере» — CTE работают и в SQLite."),
      code("sql", `-- Шаг 1: сумма каждого неотменённого заказа. Шаг 2: клиенты, чья выручка выше средней по клиентам.
WITH order_totals AS (
  SELECT o.id AS order_id, o.customer_id, sum(oi.qty * p.price) AS total
  FROM orders AS o
  JOIN order_items AS oi ON oi.order_id = o.id
  JOIN products AS p ON p.id = oi.product_id
  WHERE o.status <> 'cancelled'
  GROUP BY o.id, o.customer_id
),
customer_totals AS (
  SELECT customer_id, sum(total) AS revenue, count(*) AS orders
  FROM order_totals
  GROUP BY customer_id
)
SELECT c.name, ct.orders, ct.revenue
FROM customer_totals AS ct
JOIN customers AS c ON c.id = ct.customer_id
WHERE ct.revenue > (SELECT avg(revenue) FROM customer_totals)
ORDER BY ct.revenue DESC;`, { filename: "01-basic.sql", runnable: true, fixture: "shop", lineNumbers: true }),
      code("text", ` name | orders | revenue 
------+--------+---------
 Анна |      4 | 8760.00
 Вера |      2 | 4210.00
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Средняя выручка по шести клиентам с неотменёнными заказами — 3565; выше неё только Анна (8760) и Вера (4210)."),
    ]),

    section("detailed-example", [
      p("Одно вычисление — несколько использований. Раньше `avg(price)` пришлось бы писать подзапросом дважды; здесь `stats` содержит оба агрегата и соединяется один раз:"),
      code("sql", `-- Одно вычисление используется несколько раз: среднее считается один раз
WITH stats AS (SELECT avg(price) AS avg_price, max(price) AS max_price FROM products)
SELECT p.title, p.price,
       round(p.price - s.avg_price, 2)            AS diff_from_average,
       round(100.0 * p.price / s.max_price, 1)    AS percent_of_max
FROM products AS p CROSS JOIN stats AS s
WHERE p.price > s.avg_price
ORDER BY p.price DESC;`, { filename: "02-reuse.sql", runnable: true, fixture: "shop" }),
      code("text", `       title        |  price  | diff_from_average | percent_of_max 
--------------------+---------+-------------------+----------------
 Чайник стальной    | 2300.00 |           1478.00 |          100.0
 Френч-пресс        | 1900.00 |           1078.00 |           82.6
 Кофе зерновой 1 кг | 1200.00 |            378.00 |           52.2
 Термокружка        |  990.00 |            168.00 |           43.0
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      h("Конвейер из трёх шагов"),
      code("sql", `-- Конвейер: заказы → клиенты → доля клиента в общей выручке
WITH order_totals AS (
  SELECT o.customer_id, sum(oi.qty * p.price) AS total
  FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id
  WHERE o.status <> 'cancelled'
  GROUP BY o.id, o.customer_id
),
per_customer AS (SELECT customer_id, sum(total) AS revenue FROM order_totals GROUP BY customer_id),
grand AS (SELECT sum(revenue) AS all_revenue FROM per_customer)
SELECT c.name, pc.revenue, round(100.0 * pc.revenue / g.all_revenue, 1) AS share_percent
FROM per_customer AS pc
JOIN customers AS c ON c.id = pc.customer_id
CROSS JOIN grand AS g
ORDER BY pc.revenue DESC
LIMIT 4;`, { filename: "03-pipeline.sql", runnable: true, fixture: "shop" }),
      code("text", ` name  | revenue | share_percent 
-------+---------+---------------
 Анна  | 8760.00 |          41.0
 Вера  | 4210.00 |          19.7
 Борис | 3320.00 |          15.5
 Жанна | 2150.00 |          10.1
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Заказы → клиенты → доля клиента в общей выручке (21 390): Анна — 41,0%, Вера — 19,7%, Борис — 15,5%, Жанна — 10,1%. Каждую из трёх CTE можно выполнить отдельно, чтобы проверить промежуточный итог (например, суммы по клиентам должны давать 21 390)."),
    ]),

    section("analysis", [
      table(
        ["Шаг", "Что считает", "Контроль"],
        [
          ["`order_totals`", "Сумма `qty × price` по каждому неотменённому заказу", "Число строк = число неотменённых заказов (11 из 13)"],
          ["`per_customer`", "Выручка клиента как сумма его заказов", "Сумма по клиентам = 21 390"],
          ["`grand`", "Общая выручка", "Один ряд — число"],
          ["Основной запрос", "Доля клиента: `100 × revenue / all_revenue`", "Сумма долей всех клиентов = 100%"],
        ],
        "Шаги конвейера и способы их проверки",
      ),
      ul(
        "Каждая CTE — одна мысль; название отвечает на вопрос «что это».",
        "Промежуточные шаги легко проверить: добавьте `SELECT * FROM шаг LIMIT …` перед отправкой отчёта.",
        "Контрольные суммы на каждом шаге ловят размножение строк (см. тему о ловушках соединений).",
      ),
    ]),

    section("internals", [
      h("Подставить или материализовать?"),
      code("sql", `ANALYZE;
-- CTE используется один раз: PostgreSQL 12+ подставляет её в запрос (inline), в плане нет узла CTE
EXPLAIN (COSTS OFF)
WITH big AS (SELECT * FROM products WHERE price > 1000) SELECT title FROM big;

-- CTE используется дважды: вычисляется один раз и хранится (CTE Scan)
EXPLAIN (COSTS OFF)
WITH expensive AS (SELECT * FROM products WHERE price > 1000)
SELECT a.title, b.title FROM expensive a JOIN expensive b ON a.id < b.id;

-- Принудительно: не материализовать / материализовать
EXPLAIN (COSTS OFF)
WITH expensive AS NOT MATERIALIZED (SELECT * FROM products WHERE price > 1000)
SELECT a.title, b.title FROM expensive a JOIN expensive b ON a.id < b.id;

-- Нестабильная функция (random()) запрещает подстановку: CTE остаётся в плане даже с NOT MATERIALIZED
EXPLAIN (COSTS OFF)
WITH r AS NOT MATERIALIZED (SELECT random() AS v) SELECT a.v = b.v AS same FROM r a, r b;
WITH r AS NOT MATERIALIZED (SELECT random() AS v) SELECT a.v = b.v AS same_value FROM r a, r b;`, { filename: "04-materialize.pg.sql" }),
      code("text", `             QUERY PLAN              
-------------------------------------
 Seq Scan on products
   Filter: (price > '1000'::numeric)
(2 rows)

                 QUERY PLAN                  
---------------------------------------------
 Nested Loop
   Join Filter: (a.id < b.id)
   CTE expensive
     ->  Seq Scan on products
           Filter: (price > '1000'::numeric)
   ->  CTE Scan on expensive a
   ->  CTE Scan on expensive b
(7 rows)

                   QUERY PLAN                    
-------------------------------------------------
 Nested Loop
   Join Filter: (products.id < products_1.id)
   ->  Seq Scan on products
         Filter: (price > '1000'::numeric)
   ->  Materialize
         ->  Seq Scan on products products_1
               Filter: (price > '1000'::numeric)
(7 rows)

      QUERY PLAN       
-----------------------
 Nested Loop
   CTE r
     ->  Result
   ->  CTE Scan on r a
   ->  CTE Scan on r b
(5 rows)

 same_value 
------------
 t
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "**Одна ссылка:** план — обычный `Seq Scan on products` с условием: CTE подставлена, узла `CTE` нет.",
        "**Две ссылки:** узел `CTE expensive` вычисляется один раз, а `CTE Scan on expensive a` и `… b` читают сохранённый результат.",
        "**`NOT MATERIALIZED`:** CTE подставлена в оба места (`Seq Scan on products` и `products_1`), вычисляется дважды, зато каждый раз можно применить условия и индексы.",
        "**Нестабильная функция (`random()`):** CTE `r` осталась в плане (`CTE r`) даже с `NOT MATERIALIZED`; оба обращения вернули одно значение (`same_value = t`).",
      ),
      h("Когда принудительно материализовать"),
      p("`MATERIALIZED` полезен, если подставление приводит к многократному выполнению **дорогого** вычисления (например, функции с внешним обращением) или к плохому плану: материализация фиксирует результат. `NOT MATERIALIZED` — когда CTE используется несколько раз, но дешёвая, и сквозная оптимизация важнее. По умолчанию доверяйте планировщику и проверяйте `EXPLAIN`."),
      h("Модифицирующие CTE"),
      code("sql", `CREATE TABLE price_log (product_id integer, old_price numeric(8,2), new_price numeric(8,2));

-- Одним оператором: изменить цены посуды и записать старые/новые значения в журнал
WITH changed AS (
  UPDATE products AS p SET price = round(price * 1.05, 2)
  FROM (SELECT id, price AS old_price FROM products WHERE category = 'посуда') AS before
  WHERE p.id = before.id
  RETURNING p.id, before.old_price, p.price AS new_price
)
INSERT INTO price_log SELECT id, old_price, new_price FROM changed;

SELECT product_id, old_price, new_price FROM price_log ORDER BY product_id;`, { filename: "05-data-modifying.pg.sql" }),
      code("text", ` product_id | old_price | new_price 
------------+-----------+-----------
          3 |    450.00 |    472.50
          4 |   1900.00 |   1995.00
          8 |   2300.00 |   2415.00
         10 |    990.00 |   1039.50
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Единственный оператор изменил цены четырёх товаров посуды (+5%) и записал в журнал старую и новую цену: `RETURNING` отдаёт данные следующему шагу. Все части CTE видят **один снимок** данных, а побочные эффекты выполняются один раз и независимо от того, читает ли основной запрос результат."),
    ]),

    section("mistakes", [
      h("Ошибка: считать CTE «временной таблицей»"),
      p("CTE существует только в пределах оператора и не хранит данные для других запросов. Повторное обращение в другом запросе вычисляет её заново. Если нужен дорогой результат, который используют многие запросы, — временная таблица или материализованное представление."),
      h("Ошибка: «CTE всегда быстрее/медленнее подзапроса»"),
      p("До PostgreSQL 12 CTE всегда материализовалась — и часто тормозила; с 12-й версии одна ссылка подставляется. Поэтому утверждения «CTE медленнее» и «CTE быстрее» зависят от версии и числа обращений. Проверяйте план (`EXPLAIN`)."),
      h("Ошибка: громоздкий запрос без CTE"),
      code("sql", `-- Хотели: для каждой категории среднюю цену и число товаров дороже этой средней. Запрос громоздкий и повторяет подзапрос
SELECT p.category,
       (SELECT avg(price) FROM products x WHERE x.category = p.category) AS avg_price,
       count(*) FILTER (WHERE p.price > (SELECT avg(price) FROM products x WHERE x.category = p.category)) AS above_avg
FROM products AS p
GROUP BY p.category
ORDER BY p.category;`, { filename: "07-ex-fix.sql", runnable: true, fixture: "shop" }),
      code("text", ` category |       avg_price       | above_avg 
----------+-----------------------+-----------
 напитки  |  610.0000000000000000 |         1
 посуда   | 1410.0000000000000000 |         2
 продукты |  250.0000000000000000 |         1
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Результат верный, но подзапрос `avg(price)` повторён дважды, а его корреляция по категории вычисляется для каждой строки. С CTE среднее по категории считается один раз и соединяется:"),
      code("sql", `WITH category_avg AS (SELECT category, avg(price) AS avg_price FROM products GROUP BY category)
SELECT ca.category, round(ca.avg_price, 2) AS avg_price,
       count(*) FILTER (WHERE p.price > ca.avg_price) AS above_avg
FROM products AS p
JOIN category_avg AS ca ON ca.category = p.category
GROUP BY ca.category, ca.avg_price
ORDER BY ca.category;`, { filename: "08-fix-solution.sql", runnable: true, fixture: "shop" }),
      code("text", ` category | avg_price | above_avg 
----------+-----------+-----------
 напитки  |    610.00 |         1
 посуда   |   1410.00 |         2
 продукты |    250.00 |         1
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      h("Ошибка: побочные эффекты и порядок"),
      p("Модифицирующие CTE выполняются ровно один раз и «одновременно» с основным запросом: нельзя рассчитывать, что одна CTE увидит изменения другой; в основном запросе таблицу видно в состоянии **до** изменений. Для обмена данными между шагами используйте `RETURNING`."),
      h("Ошибка: бесконечная вложенность CTE вместо схемы"),
      p("Десять CTE в одном запросе читаются не лучше, чем десять вложенных подзапросов. Если шаги повторяются в разных запросах — выделите представление или функцию."),
    ]),

    section("antipatterns", [
      ul(
        "**CTE ради CTE:** обернуть простую выборку в `WITH` без выгоды.",
        "**`MATERIALIZED` «на всякий случай»**: блокирует передачу условий внутрь и может ухудшить план.",
        "**CTE как способ «спрятать» плохой запрос**, не проверив план.",
        "**Длинные цепочки CTE без контрольных сумм** — ошибки размножения прячутся глубоко.",
        "**Именование `a`, `b`, `cte1`** вместо смысловых имён.",
        "**Надежда на «вызов один раз»** для функций с побочными эффектами в обычной (не модифицирующей) CTE.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Называйте CTE по смыслу** (`order_totals`, `per_customer`), а не по порядку.",
        "**Одна CTE — одна мысль**; сложную логику разбивайте на шаги.",
        "**Проверяйте шаги по отдельности** и добавляйте контрольные суммы.",
        "**Смотрите `EXPLAIN`:** есть ли узел `CTE Scan`, что подставлено, что материализовано.",
        "**Используйте `MATERIALIZED`/`NOT MATERIALIZED` осознанно** и только после замеров.",
        "**Повторяющиеся шаги в разных запросах** — вынесите в представление.",
        "**Модифицирующие CTE** — для атомарных связок «изменить и записать след» (с `RETURNING`).",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Имена CTE «перекрывают» таблицы** с теми же именами в пределах оператора — осторожно с `WITH orders AS (…)`.",
        "**Порядок объявления:** CTE видит только объявленные выше (кроме рекурсивных).",
        "**`WITH` перед `INSERT`:** `WITH … INSERT INTO t SELECT …` допустим.",
        "**Одна и та же модифицирующая CTE не может быть обработана дважды:** результат `RETURNING` читается столько раз, сколько нужно, но изменение выполняется ровно один раз.",
        "**Столбцы CTE:** при совпадении имён в `SELECT` придётся задавать псевдонимы или список столбцов.",
        "**SQLite:** `MATERIALIZED` с 3.35; модифицирующих CTE нет, но `INSERT … RETURNING` есть.",
      ),
    ]),

    section("related", [
      ul(
        "[Подзапросы](/learn/sql/subqueries) — CTE как именованные подзапросы.",
        "[Агрегаты, GROUP BY и HAVING](/learn/sql/group-by-having) — агрегаты на шагах конвейера.",
        "[Ловушки соединений](/learn/sql/join-pitfalls) — свёртки до соединения удобно оформлять как CTE.",
        "[Upsert и RETURNING](/learn/sql/upsert-returning) — модифицирующие CTE с `RETURNING`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Вложенные подзапросы",
          code: `
            SELECT c.name, t.revenue
            FROM (SELECT customer_id, sum(total) AS revenue
                  FROM (SELECT o.customer_id, sum(oi.qty * p.price) AS total
                        FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id
                        WHERE o.status <> 'cancelled' GROUP BY o.id, o.customer_id) AS x
                  GROUP BY customer_id) AS t
            JOIN customers c ON c.id = t.customer_id;
          `,
          note: "Читать нужно изнутри наружу, а повторить любой шаг можно только копированием текста.",
        },
        {
          title: "Конвейер CTE",
          code: `
            WITH order_totals AS (...),
                 customer_totals AS (SELECT customer_id, sum(total) AS revenue FROM order_totals GROUP BY customer_id)
            SELECT c.name, ct.revenue
            FROM customer_totals ct JOIN customers c ON c.id = ct.customer_id;
          `,
          note: "Читается сверху вниз, каждый шаг имеет имя и проверяется отдельно.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.ctes.ex1",
      title: "Предскажите результат",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская, определите результат трёх запросов (в `order_items` всего 25 позиций; три товара дешевле 300: чай 250, сахар 90, печенье 140; оплаченные заказы — у 4 различных клиентов)."),
        code("sql", `WITH a AS (SELECT 1 AS x), b AS (SELECT x + 1 AS y FROM a), c AS (SELECT y * 10 AS z FROM b)
SELECT x, y, z FROM a, b, c;

WITH cheap AS (SELECT id FROM products WHERE price < 300)
SELECT count(*) FROM order_items WHERE product_id IN (SELECT id FROM cheap);

WITH paid AS (SELECT customer_id FROM orders WHERE status = 'paid')
SELECT count(*) AS rows_in_cte, count(DISTINCT customer_id) AS customers FROM paid;`, { filename: "06-ex-predict.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["Что даёт цепочка `a`, `b`, `c`?", "Сколько позиций заказов относится к товарам 2, 5 и 6?", "Сколько заказов оплачено и у скольких различных клиентов?"],
      checks: ["Первый: `1 | 2 | 20`", "Второй: 9", "Третий: 7 строк и 4 клиента"],
      solution: [
        code("text", ` x | y | z  
---+---+----
 1 | 2 | 20
(1 row)

 count 
-------
     9
(1 row)

 rows_in_cte | customers 
-------------+-----------
           7 |         4
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "Цепочка: `x = 1`, `y = x + 1 = 2`, `z = y × 10 = 20`; перекрёстное соединение даёт одну строку.",
          "Товары дешевле 300: 2 (чай), 5 (сахар), 6 (печенье); позиций с ними — 3 + 3 + 3 = 9 (заказы 1, 2, 4, 6, 7, 11 и др.).",
          "Оплаченных заказов 7, у четырёх разных клиентов (Анна, Борис, Вера, Жанна).",
        ),
      ],
    }),
    exercise({
      id: "sql.ctes.ex2",
      title: "Упростите повторяющийся подзапрос",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Запрос считает по категориям среднюю цену и число товаров дороже этой средней, но подзапрос со средним повторён дважды. Перепишите с CTE так, чтобы среднее по категории вычислялось один раз."),
        code("sql", `-- Хотели: для каждой категории среднюю цену и число товаров дороже этой средней. Запрос громоздкий и повторяет подзапрос
SELECT p.category,
       (SELECT avg(price) FROM products x WHERE x.category = p.category) AS avg_price,
       count(*) FILTER (WHERE p.price > (SELECT avg(price) FROM products x WHERE x.category = p.category)) AS above_avg
FROM products AS p
GROUP BY p.category
ORDER BY p.category;`, { filename: "07-ex-fix.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["Что можно вычислить заранее по категории?", "Как соединить CTE с товарами по категории?"],
      checks: ["CTE `category_avg` с `GROUP BY category`", "Соединение по категории", "Результат: напитки 1, посуда 2, продукты 1"],
      solution: [
        code("sql", `WITH category_avg AS (SELECT category, avg(price) AS avg_price FROM products GROUP BY category)
SELECT ca.category, round(ca.avg_price, 2) AS avg_price,
       count(*) FILTER (WHERE p.price > ca.avg_price) AS above_avg
FROM products AS p
JOIN category_avg AS ca ON ca.category = p.category
GROUP BY ca.category, ca.avg_price
ORDER BY ca.category;`, { filename: "08-fix-solution.sql", runnable: true, fixture: "shop" }),
        code("text", ` category | avg_price | above_avg 
----------+-----------+-----------
 напитки  |    610.00 |         1
 посуда   |   1410.00 |         2
 продукты |    250.00 |         1
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Среднее по категории считается один раз в `category_avg` и используется и для вывода, и для условия `FILTER`. Запрос короче, и имя шага объясняет его смысл."),
      ],
    }),
    exercise({
      id: "sql.ctes.ex3",
      title: "Месяцы выше среднего с накопительным итогом",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Постройте отчёт в три шага: (1) выручка неотменённых заказов по месяцам; (2) накопительный итог (сумма выручки месяцев до текущего включительно) через коррелированный подзапрос; (3) оставьте только месяцы, где выручка выше средней по месяцам. Выведите месяц, выручку и накопительный итог."),
      ],
      hints: ["Какой ключ группировки задаёт месяц?", "Как посчитать сумму месяцев «до текущего включительно»?", "Где вычислить среднюю по месяцам?"],
      checks: ["CTE `monthly`", "CTE с накопительным итогом", "Месяцы 2024-03, 2024-04, 2024-06", "Накопительные итоги 9260, 14150, 21390"],
      solution: [
        code("sql", `-- Отчёт в три шага: выручка по месяцам → накопительный итог через подзапрос → месяцы выше среднего
WITH monthly AS (
  SELECT substr(CAST(o.ordered_on AS text), 1, 7) AS month, sum(oi.qty * p.price) AS revenue
  FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id
  WHERE o.status <> 'cancelled'
  GROUP BY substr(CAST(o.ordered_on AS text), 1, 7)
),
with_running AS (
  SELECT m.month, m.revenue, (SELECT sum(x.revenue) FROM monthly x WHERE x.month <= m.month) AS running_total
  FROM monthly m
)
SELECT month, revenue, running_total
FROM with_running
WHERE revenue > (SELECT avg(revenue) FROM monthly)
ORDER BY month;`, { filename: "09-challenge.sql", runnable: true, fixture: "shop", lineNumbers: true }),
        code("text", `  month  | revenue | running_total 
---------+---------+---------------
 2024-03 | 4330.00 |       9260.00
 2024-04 | 4890.00 |      14150.00
 2024-06 | 4360.00 |      21390.00
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Средняя месячная выручка — 3565. Выше неё три месяца; накопительные итоги вычислены к концу каждого месяца (последний — общая выручка 21 390). В следующих темах такой накопительный итог станет оконной функцией — короче и быстрее."),
      ],
    }),
  ],

  challenge: {
    id: "sql.ctes.challenge",
    title: "Отчёт «клиенты, доля и разрыв до лидера»",
    scenario: [
      p("Руководство просит отчёт: выручка клиентов по неотменённым заказам, доля каждого в общей выручке и отставание от лидера. Запрос должен быть читаемым и проверяемым: каждый шаг — отдельная CTE, сумма долей — 100%."),
    ],
    requirements: [
      "CTE `order_totals` — сумма каждого неотменённого заказа",
      "CTE `per_customer` — выручка клиента",
      "CTE `stats` — общая выручка и максимум",
      "В итоговой выборке: имя, выручка, доля в процентах (1 знак), отставание от лидера",
    ],
    constraints: [
      "Без повторяющихся подзапросов: общие значения берутся из `stats`",
      "Сумма долей проверяется отдельным запросом",
    ],
    acceptance: [
      "Анна — 41,0%, отставание 0",
      "Сумма выручки по клиентам — 21 390",
    ],
    hints: [
      "`CROSS JOIN stats` даёт общие значения каждой строке.",
      "Доля: `100.0 * revenue / all_revenue`.",
    ],
    solution: [
      code("sql", `-- Конвейер: заказы → клиенты → доля клиента в общей выручке
WITH order_totals AS (
  SELECT o.customer_id, sum(oi.qty * p.price) AS total
  FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id
  WHERE o.status <> 'cancelled'
  GROUP BY o.id, o.customer_id
),
per_customer AS (SELECT customer_id, sum(total) AS revenue FROM order_totals GROUP BY customer_id),
grand AS (SELECT sum(revenue) AS all_revenue FROM per_customer)
SELECT c.name, pc.revenue, round(100.0 * pc.revenue / g.all_revenue, 1) AS share_percent
FROM per_customer AS pc
JOIN customers AS c ON c.id = pc.customer_id
CROSS JOIN grand AS g
ORDER BY pc.revenue DESC
LIMIT 4;`, { filename: "03-pipeline.sql", runnable: true, fixture: "shop" }),
      code("text", ` name  | revenue | share_percent 
-------+---------+---------------
 Анна  | 8760.00 |          41.0
 Вера  | 4210.00 |          19.7
 Борис | 3320.00 |          15.5
 Жанна | 2150.00 |          10.1
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Три CTE называют шаги; общая выручка берётся из `grand` один раз. Для задачи добавьте столбец `max_revenue - revenue` в `stats`-CTE и в выборку. Контроль: сумма всех долей равна 100 (проверьте отдельным запросом по `per_customer`)."),
    ],
  },

  interview: [
    iq("sql.ctes.i1", "basic", "Что такое CTE и чем она отличается от подзапроса в FROM?", [
      ul(
        "CTE — именованный подзапрос в `WITH`, видимый в одном операторе; может использоваться несколько раз и ссылаться на предыдущие CTE.",
        "Подзапрос в `FROM` анонимен и используется в одном месте.",
        "CTE улучшает читаемость; на производительность влияет через подстановку/материализацию.",
      ),
    ]),
    iq("sql.ctes.i2", "basic", "Является ли CTE временной таблицей?", [
      ul(
        "Нет: существует только в пределах одного оператора, не сохраняется и не видна другим запросам.",
        "Результат может быть материализован внутри плана выполнения, но это деталь выполнения, а не объект базы.",
        "Для результата, нужного многим запросам, — временная таблица или материализованное представление.",
      ),
    ]),
    iq("sql.ctes.i3", "intermediate", "Как изменилось поведение CTE в PostgreSQL 12?", [
      ul(
        "До 12: CTE всегда материализовалась — забор оптимизации.",
        "С 12: CTE без побочных эффектов, использованная один раз, подставляется в запрос; использованная несколько раз — материализуется.",
        "Управление: `AS MATERIALIZED` / `AS NOT MATERIALIZED`. В замере: одна ссылка — нет узла CTE; две — `CTE Scan` ×2; `NOT MATERIALIZED` — подстановка в оба места.",
      ),
    ]),
    iq("sql.ctes.i4", "intermediate", "Когда стоит указать MATERIALIZED?", [
      ul(
        "Когда подстановка заставит многократно выполнять дорогое вычисление (тяжёлая функция, большой агрегат).",
        "Когда нужно «заморозить» результат, чтобы план остался предсказуемым.",
        "Когда CTE — единственное место с побочными эффектами (материализация по умолчанию).",
        "Во всех остальных случаях — доверять планировщику и проверять `EXPLAIN`.",
      ),
    ]),
    iq("sql.ctes.i5", "intermediate", "Что делают модифицирующие CTE и зачем они нужны?", [
      ul(
        "`WITH x AS (UPDATE/DELETE/INSERT … RETURNING …)` изменяет данные и отдаёт строки следующим шагам запроса.",
        "Позволяют атомарно выполнить «изменить и записать след» (журнал цен, перенос в архив) одним оператором.",
        "Выполняются ровно один раз; все части видят один снимок данных до изменений (PostgreSQL).",
      ),
    ]),
    iq("sql.ctes.i6", "advanced", "Почему CTE с random() не подставляется даже при NOT MATERIALIZED?", [
      ul(
        "Подстановка нестабильной функции изменила бы число её вычислений и результат; планировщик такое не делает.",
        "В замере план сохранил узел `CTE r`, а оба обращения вернули одно значение (`same_value = t`).",
        "Общее правило: CTE с побочными эффектами или нестабильными функциями выполняется один раз.",
      ),
    ]),
    iq("sql.ctes.i7", "engineering", "Как организовать длинный аналитический запрос, чтобы его можно было поддерживать?", [
      ul(
        "Конвейер CTE с говорящими именами, по одной мысли на шаг.",
        "Контрольные суммы после ключевых шагов (итог не меняется, число строк ожидаемо).",
        "Повторяющиеся шаги — в представления; дорогие общие — в материализованные представления или таблицы-витрины.",
        "Проверка плана и тестовые данные с «неудобными» случаями.",
      ),
    ]),
    iq("sql.ctes.i8", "debugging", "Запрос с CTE стал медленнее после обновления PostgreSQL до 12+ (или быстрее). Что проверить?", [
      ul(
        "Подстановка вместо материализации: CTE вычисляется на каждое использование — используйте `MATERIALIZED`, если вычисление дорогое.",
        "Или наоборот: раньше материализация блокировала оптимизацию, теперь условия проходят внутрь — это может ускорить.",
        "Сравнить планы до и после (`EXPLAIN ANALYZE`): исчез ли `CTE Scan`, изменился ли порядок соединений.",
        "Актуальная статистика: `ANALYZE`.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.ctes.e1", "foundation", "Какое ключевое слово начинает определение CTE?", ["`CTE`", "`DEFINE`", "`WITH`", "`TEMP`"], 2, "CTE определяются предложением `WITH имя AS (запрос)`."),
    mcq("sql.ctes.e2", "foundation", "Как долго существует CTE?", ["Один оператор", "Всю сессию", "Пока не удалена командой `DROP`", "Пока открыта транзакция"], 0, "CTE видна только внутри оператора, в котором объявлена."),
    mcq("sql.ctes.e3", "foundation", "Можно ли в `WITH` объявить несколько CTE?", ["Нет", "Только рекурсивные", "Да, но они не видят друг друга", "Да, через запятую; поздние видят ранние"], 3, "Несколько CTE перечисляются через запятую; каждая видит предыдущие."),
    mcq("sql.ctes.e4", "intermediate", "Что показывает план PostgreSQL 12+ для CTE, на которую есть две ссылки?", ["Подстановку без узла CTE", "Узел `CTE` и два `CTE Scan`", "Ошибку", "Два независимых `Seq Scan`"], 1, "CTE с несколькими ссылками материализуется и читается узлами `CTE Scan` (замер)."),
    mcq("sql.ctes.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["CTE с одной ссылкой без побочных эффектов подставляется в запрос", "`NOT MATERIALIZED` может подставить CTE и при нескольких ссылках", "CTE создаёт постоянный объект в схеме", "CTE с `UPDATE … RETURNING` выполняется ровно один раз"], [0, 1, 3], "CTE не создаёт объектов схемы; остальные утверждения верны для PostgreSQL 12+."),
    mcq("sql.ctes.e6", "intermediate", "Что изменит `AS MATERIALIZED`?", ["Подставит CTE в запрос", "Сделает CTE видимой другим сессиям", "Создаст индекс", "Заставит вычислить CTE один раз и хранить результат"], 3, "`MATERIALIZED` фиксирует результат CTE: она вычисляется один раз независимо от числа ссылок."),
    mcq("sql.ctes.e7", "advanced", "Почему CTE с `random()` не подставляется даже при `NOT MATERIALIZED`?", ["Из-за ошибки", "Потому что `random()` медленная", "Нестабильная функция: подстановка изменила бы число вычислений", "`NOT MATERIALIZED` не существует"], 2, "Планировщик не подставляет CTE с нестабильными функциями; в замере узел `CTE r` остался в плане."),
    open("sql.ctes.e8", "intermediate", "Когда вы выберете CTE, когда — подзапрос в FROM, а когда — представление или временную таблицу?", [
      ul(
        "Подзапрос в `FROM` — простой шаг, один раз.",
        "CTE — несколько шагов или несколько обращений в одном запросе, нужна читаемость.",
        "Представление — логика повторяется в разных запросах и у разных людей.",
        "Временная таблица / материализованное представление — дорогой результат нужен многим запросам или нужны индексы.",
      ),
    ], ["Названы 4 способа", "Критерий каждого", "Различие области видимости", "Упомянута стоимость"], { format: "architecture" }),
  ],

  mastery: [
    mcq("sql.ctes.m1", "intermediate", "Сколько раз вычисляется CTE, использованная дважды в PostgreSQL 16, если не указан `MATERIALIZED`/`NOT MATERIALIZED`?", ["Дважды", "Один раз, результат хранится", "Ноль", "Столько, сколько строк"], 1, "Две ссылки приводят к материализации: одно вычисление и два `CTE Scan` (замер)."),
    mcq("sql.ctes.m2", "advanced", "Что показывает контрольная сумма после шага `per_customer` в конвейере отчёта?", ["Совпадение с общим итогом: ловит размножение и потерю строк", "Что индексы работают", "Скорость запроса", "Размер таблиц"], 0, "Сумма по клиентам должна равняться итогу по заказам (21 390 в замере); расхождение — ошибка в соединениях."),
    mcq("sql.ctes.m3", "advanced", "Что произойдёт при `WITH changed AS (UPDATE … RETURNING …) INSERT INTO log SELECT … FROM changed`?", ["Изменение выполнится дважды", "Ошибка: нельзя изменять в CTE", "Изменение и запись журнала в одном атомарном операторе; `UPDATE` выполнится один раз", "`INSERT` выполнится первым"], 2, "Модифицирующая CTE выполняется ровно один раз; её `RETURNING` читает основной запрос (замер: 4 строки в журнале)."),
    open("sql.ctes.m4", "advanced", "После миграции с PostgreSQL 11 на 14 отчётный запрос с CTE ускорился в 10 раз. Объясните вероятную причину и как вы это докажете.", [
      ul(
        "Причина: в 11 CTE всегда материализовалась и мешала передаче условий внутрь; с 12 CTE с одной ссылкой подставляется в запрос, индексы и условия работают «сквозь».",
        "Доказательство: сравнить планы до/после — исчез узел `CTE Scan`, появился индексный поиск внутри; на новой версии принудительно `AS MATERIALIZED` вернёт прежнее время.",
        "Проверка корректности: результат не изменился (контрольные суммы), статистика актуальна (`ANALYZE`).",
        "Вывод: поведение CTE зависит от версии — фиксировать ожидание в тестах производительности.",
      ),
    ], ["Названа подстановка с 12", "План до и после", "Эксперимент с MATERIALIZED", "Проверка результата"], { format: "debug" }),
  ],

  flashcards: [
    { id: "sql.ctes.f1", front: "CTE?", back: "WITH имя AS (запрос): именованный шаг внутри одного оператора. Не объект схемы и не временная таблица." },
    { id: "sql.ctes.f2", front: "PG 12+: подстановка?", back: "Одна ссылка и без побочных эффектов — подставляется (нет узла CTE). Несколько ссылок — материализуется (CTE Scan)." },
    { id: "sql.ctes.f3", front: "MATERIALIZED / NOT MATERIALIZED?", back: "Принудительно материализовать / подставлять. Для CTE с нестабильными функциями и DML подстановка запрещена." },
    { id: "sql.ctes.f4", front: "Модифицирующая CTE?", back: "WITH x AS (UPDATE … RETURNING …): изменение и использование результата в одном операторе; выполняется один раз." },
    { id: "sql.ctes.f5", front: "CTE и представление?", back: "CTE живёт в одном запросе; VIEW — объект базы, доступный всем запросам." },
    { id: "sql.ctes.f6", front: "Читаемость?", back: "Конвейер: имя по смыслу, одна мысль на шаг, контрольные суммы между шагами." },
    { id: "sql.ctes.f7", front: "Контрольная сумма?", back: "Сумма по шагу = итог из исходной таблицы: ловит размножение и потери." },
    { id: "sql.ctes.f8", front: "SQLite и CTE?", back: "CTE с 3.8.3, MATERIALIZED с 3.35; модифицирующих CTE нет." },
  ],

  sources: [
    { title: "PostgreSQL 16: WITH Queries (Common Table Expressions)", url: "https://www.postgresql.org/docs/16/queries-with.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: SELECT — WITH Clause", url: "https://www.postgresql.org/docs/16/sql-select.html#SQL-WITH", publisher: "PostgreSQL" },
    { title: "PostgreSQL 12 release notes: CTE inlining", url: "https://www.postgresql.org/docs/12/release-12.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Data-Modifying Statements in WITH", url: "https://www.postgresql.org/docs/16/queries-with.html#QUERIES-WITH-MODIFYING", publisher: "PostgreSQL" },
    { title: "SQLite: WITH clause", url: "https://www.sqlite.org/lang_with.html", publisher: "Other" },
    { title: "SQLite: Materialization of CTEs", url: "https://www.sqlite.org/lang_with.html#materialization_hints", publisher: "Other" },
  ],
};
