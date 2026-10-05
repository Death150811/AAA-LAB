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

export const queryTuning: Topic = {
  id: "sql.query-tuning",
  slug: "query-tuning",
  domain: "sql",
  module: "performance",
  title: "Оптимизация запросов: пишем так, чтобы индекс работал",
  titleEn: "Query Tuning: Writing Queries the Planner Can Optimize",
  summary:
    "Большинство медленных запросов исправляется не «магией», а переписыванием условия так, чтобы планировщик мог использовать индекс и не читать лишнее. Тема на замерах PostgreSQL 16.14 (200 000 заказов): функция над столбцом (`to_char(created_at, …)`) читает 1472 страницы, а тот же смысл диапазоном — 10; пагинация `OFFSET 150000` читает и отбрасывает 150 020 строк (1500 страниц), а keyset-страница `WHERE id > 150000` — 4; поиск подстроки `LIKE '%7a3f9%'` без индекса читает 1920 страниц, с триграммным GIN-индексом — 18; `OR` с одной неиндексируемой веткой возвращается к чтению всей таблицы (1472), а с индексами на обе ветки — 67 страниц; `EXISTS`, `IN` и `JOIN` дают разные результаты по смыслу (495 клиентов против 2196 строк при JOIN), `NOT IN` и `NOT EXISTS` планируются по-разному, 100 отдельных запросов — около 4200 страниц и 101 обращение, а лента с составным индексом и keyset — 23 страницы вместо 1472.",
  minutes: 100,
  prerequisites: ["sql.indexes-btree", "sql.explain-plans", "sql.subqueries"],
  tags: ["query optimization", "sargable", "pagination", "OFFSET", "keyset pagination", "LIKE", "pg_trgm", "GIN", "OR", "EXISTS", "NOT IN", "N+1", "count(*)", "bitmap", "row-wise comparison"],
  keyConcepts: [
    { term: "Функция над столбцом отключает индекс", text: "`WHERE to_char(created_at, 'YYYY-MM') = '2024-06'` — `Seq Scan`, 1472 страницы; `created_at >= '2024-06-01' AND created_at < '2024-07-01'` — `Index Only Scan`, 10 страниц. Такие условия называют «sargable»: пригодными для индекса." },
    { term: "OFFSET читает и отбрасывает строки", text: "`LIMIT 20 OFFSET 150000` — 150 020 прочитанных строк (1500 страниц); `WHERE id > 150000 ORDER BY id LIMIT 20` — 20 строк, 4 страницы." },
    { term: "LIKE '%…%' требует триграммного индекса", text: "Обычный индекс не помогает при подстроке в середине: `Seq Scan`, 1920 страниц. GIN по триграммам (`pg_trgm`) — 18 страниц, но индекс весит 15 MB (как сама таблица)." },
    { term: "OR требует индекса на каждую ветку", text: "`customer_id = 42 OR amount = 150` без индекса по `amount` — `Seq Scan` (1472), с индексом — `BitmapOr` (67)." },
    { term: "EXISTS, IN и JOIN — разные по смыслу", text: "`EXISTS` и `IN` вернули 495 клиентов, а `JOIN` — 2196 строк (клиент повторяется по числу заказов). Для «есть ли связанные строки» берите `EXISTS`." },
    { term: "Keyset-страница с составным индексом", text: "Лента по `(created_at, id)`: `WHERE (created_at, id) > (…) ORDER BY created_at, id LIMIT 20` — 23 страницы вместо 1472 с функцией над столбцом и `OFFSET`." },
  ],
  sections: [
    section("definition", [
      def("Sargable-условие", "Условие, которое индекс может использовать для поиска: столбец сравнивается с выражением без преобразований над самим столбцом (`created_at >= …`, а не `to_char(created_at, …) = …`).", "search ARGument ABLE"),
      def("Keyset-пагинация", "Постраничный вывод «после последней увиденной строки» (`WHERE (ключ) > (последний ключ) ORDER BY ключ LIMIT n`), а не «пропустить n строк». Стоимость страницы не зависит от её номера.", "keyset / seek pagination"),
      def("OFFSET-пагинация", "Постраничный вывод через `LIMIT n OFFSET m`: чтобы выдать страницу, база читает и отбрасывает первые m строк.", "offset pagination"),
      def("Полуоткрытый интервал", "Диапазон `[начало, конец)`: `>= начало AND < конец`; удобен для дат и времени — не нужно знать «последнюю секунду» периода.", "half-open range"),
      def("Полусоединение и антисоединение", "Semi Join — «есть хотя бы одна подходящая строка» (`EXISTS`, `IN`); Anti Join — «нет ни одной» (`NOT EXISTS`); не размножают строки в отличие от обычного `JOIN`.", "semi join / anti join"),
      def("Триграммный индекс", "GIN-индекс (расширение `pg_trgm`) по трёхсимвольным фрагментам текста: ускоряет `LIKE '%…%'`, `ILIKE` и поиск по сходству.", "trigram index"),
      def("N+1", "Паттерн, при котором приложение выполняет один запрос за списком и ещё по одному запросу на каждую строку списка; множит обращения к серверу.", "N+1 queries"),
    ]),

    section("why", [
      h("Лучший способ ускорить запрос — уменьшить работу, а не железо"),
      p("Когда запрос медленный, соблазнительно увеличить память, добавить процессор или поставить кэш. Но чаще всего запрос делает ненужную работу: читает всю таблицу из-за функции над столбцом, отбрасывает сто тысяч строк ради страницы пагинации, размножает строки соединением. Исправление — переписать запрос так, чтобы планировщик мог сделать меньше. Эффект — не на проценты, а в разы и на порядки."),
      ul(
        "**Предсказуемость:** условие, пригодное для индекса, держит время запроса при росте таблицы.",
        "**Правильность:** `EXISTS` вместо `JOIN` избавляет от дублей, `NOT EXISTS` вместо `NOT IN` — от ловушки с `NULL`.",
        "**Масштабируемость:** keyset-пагинация одинаково быстра на первой и на стотысячной странице.",
        "**Экономия:** меньше страниц — меньше нагрузка на диск, кэш и соседние запросы.",
      ),
      note("Оптимизация без измерения — самообман. Каждый приём этой темы показан замером `Buffers` до и после; в вашей системе проверьте то же `EXPLAIN (ANALYZE, BUFFERS)`."),
    ]),

    section("mental-model", [
      h("Помогайте планировщику: что он видит в вашем запросе"),
      p("Планировщик не угадывает намерение. Он смотрит на форму условия: «столбец оператор константа» — можно искать по индексу; «функция(столбец) оператор константа» — нельзя, ведь в индексе лежат значения столбца, а не результаты функции. Он смотрит на `ORDER BY` и `LIMIT`: порядок индекса позволяет остановиться после нужного числа строк. Он смотрит на форму подзапроса: `EXISTS` — достаточно найти одну строку, `JOIN` — надо отдать все совпадения. Ваша задача — выражать смысл в форме, которая даёт ему больше свободы."),
      diagram(
        `
        Плохо для индекса                        Хорошо для индекса
        ──────────────────────────────────────   ─────────────────────────────────────────
        f(столбец) = значение                    столбец >= начало AND столбец < конец
        OFFSET 150000                            WHERE ключ > последний_ключ
        title LIKE '%подстрока%'                 триграммный индекс (pg_trgm) или поиск по префиксу
        a = 1 OR b = 2   (нет индекса на b)      индекс на каждую ветку OR или UNION ALL
        JOIN + DISTINCT для «есть ли»            EXISTS (…)
        NOT IN (подзапрос)                       NOT EXISTS (…)
        `,
        "Пары «плохо — хорошо»: форма запроса определяет, сможет ли планировщик использовать индекс.",
      ),
      h("Порядок оптимизации"),
      steps(
        [
          ["Измерить", "`EXPLAIN (ANALYZE, BUFFERS)`: где читается больше всего страниц."],
          ["Уменьшить объём", "Фильтры раньше, только нужные столбцы и строки, пагинация без `OFFSET`."],
          ["Привести условия к sargable-виду", "Диапазоны вместо функций, сравнение без приведения типов."],
          ["Выбрать форму подзапроса", "`EXISTS`/`NOT EXISTS` для проверки существования."],
          ["Подобрать индекс под итоговую форму запроса", "Затем снова измерить: число страниц должно упасть."],
        ],
        "Как оптимизировать запрос",
      ),
    ]),

    section("technical", [
      h("Типовые превращения"),
      table(
        ["Было", "Стало", "Эффект (замер)"],
        [
          ["`to_char(created_at, 'YYYY-MM') = '2024-06'`", "`created_at >= '2024-06-01' AND created_at < '2024-07-01'`", "1472 → 10 страниц"],
          ["`LIMIT 20 OFFSET 150000`", "`WHERE id > 150000 ORDER BY id LIMIT 20`", "1500 → 4 страницы"],
          ["`title LIKE '%7a3f9%'`", "GIN-индекс `gin_trgm_ops`", "1920 → 18 страниц"],
          ["`a = … OR b = …`, индекс только на `a`", "Индекс на каждую ветку: `BitmapOr`", "1472 → 67 страниц"],
          ["`JOIN` для «есть ли заказ»", "`EXISTS`", "2196 строк → 495 клиентов без `DISTINCT`"],
          ["`NOT IN (подзапрос)`", "`NOT EXISTS`", "`NOT (SubPlan)` → `Anti Join`"],
        ],
        "Приёмы переписывания",
      ),
      h("Принципы"),
      ul(
        "**Столбец — без преобразований:** функции, арифметика, приведение типов переносятся на другую сторону сравнения.",
        "**Диапазоны для дат:** полуоткрытый интервал `[от, до)` вместо `BETWEEN` с «последней секундой».",
        "**Пагинация:** keyset по уникальному упорядоченному ключу; для сортировки по неуникальному столбцу в ключ добавляют `id`.",
        "**Существование — `EXISTS`;** подсчёт — `count(*)`; список — `JOIN`.",
        "**Только нужные столбцы:** узкая выборка позволяет `Index Only Scan` и уменьшает память сортировок.",
        "**Пакетная работа:** один запрос с `IN`/`JOIN`/`ANY(array)` вместо цикла из N запросов.",
      ),
      warn("Не оптимизируйте то, что не измерено: переписывание без плана часто ничего не меняет, а читаемость ухудшает. Фиксируйте число страниц до и после."),
    ]),

    section("syntax", [
      p("Шаблон страницы ленты: диапазон вместо функции, сравнение пары значений для «после последней увиденной строки» и тот же порядок, что в составном индексе."),
      annotated(
        "sql",
        `-- Следующая страница ленты: 20 заказов после последней увиденной пары (created_at, id)
SELECT id, created_at, amount
FROM orders_big
WHERE created_at >= '2024-06-01' AND created_at < '2024-07-01'
  AND (created_at, id) > ('2024-06-15', 100000)
ORDER BY created_at, id
LIMIT 20;`,
        [
          { line: 1, text: "Комментарий формулирует задачу: следующая страница после последней увиденной строки." },
          { line: 4, text: "Границы месяца — полуоткрытый диапазон по столбцу: индекс по `created_at` применим." },
          { line: 5, text: "`(created_at, id) > ('2024-06-15', 100000)` — сравнение строк как пар: «позже по дате или та же дата и больший `id`». Индекс `(created_at, id)` позволяет перейти сразу к этому месту." },
          { line: 6, text: "Порядок обязан совпадать с порядком ключа пагинации и индекса: `created_at, id`." },
          { line: 7, text: "`LIMIT 20` — размер страницы; чтение останавливается на двадцатой строке." },
        ],
        "13-keyset-syntax.pg.sql",
      ),
    ]),

    section("minimal-example", [
      p("Данные теста — 200 000 заказов с индексами по `customer_id` и `created_at`, 5000 клиентов и 200 000 товаров с «случайными» названиями. Подготовка выполняется один раз перед примерами (автоочистка отключена ради стабильных замеров)."),
      code("sql", `-- Данные темы: 200 000 заказов, 5000 клиентов и 200 000 товаров с «случайными» названиями
CREATE TABLE orders_big AS
SELECT g AS id,
       1 + (g * 7919) % 5000 AS customer_id,
       (ARRAY['paid','paid','paid','paid','paid','paid','paid','paid','paid','paid','paid','paid',
              'shipped','shipped','shipped','shipped','shipped','new','new','cancelled'])[1 + g % 20] AS status,
       DATE '2023-01-01' + (g % 730) AS created_at,
       (100 + (g * 31) % 9000)::numeric(10,2) AS amount
FROM generate_series(1, 200000) AS g;
ALTER TABLE orders_big ADD PRIMARY KEY (id);
CREATE INDEX orders_big_customer_idx ON orders_big (customer_id);
CREATE INDEX orders_big_created_idx ON orders_big (created_at);

CREATE TABLE customers_big AS
SELECT g AS id, 'Клиент ' || g AS name, (ARRAY['Москва','Казань','Самара','Тула','Омск'])[1 + g % 5] AS city
FROM generate_series(1, 5000) AS g;
ALTER TABLE customers_big ADD PRIMARY KEY (id);

CREATE TABLE products_big AS
SELECT g AS id, 'Товар ' || md5(g::text) AS title FROM generate_series(1, 200000) AS g;
ALTER TABLE products_big ADD PRIMARY KEY (id);

ALTER TABLE orders_big SET (autovacuum_enabled = false);
ALTER TABLE customers_big SET (autovacuum_enabled = false);
ALTER TABLE products_big SET (autovacuum_enabled = false);
VACUUM ANALYZE orders_big;
VACUUM ANALYZE customers_big;
VACUUM ANALYZE products_big;`, { filename: "setup.sql" }),
      p("Заказы за июнь 2024: условие с функцией против диапазона. В выводе `Buffers: shared hit=N` — число прочитанных страниц, строки `\\o /dev/null` — прогрев кэша (вывод скрыт), блок `Planning` из планов опущен."),
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- Нужны заказы июня 2024. Индекс по created_at есть (создан в подготовке данных)
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT count(*) FROM orders_big WHERE to_char(created_at, 'YYYY-MM') = '2024-06';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT count(*) FROM orders_big WHERE created_at >= '2024-06-01' AND created_at < '2024-07-01';
\\o
-- Функция над столбцом: индекс не может помочь, читается вся таблица
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT count(*) FROM orders_big WHERE to_char(created_at, 'YYYY-MM') = '2024-06';

-- Тот же смысл диапазоном: индекс используется (полуоткрытый интервал [июнь, июль))
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT count(*) FROM orders_big WHERE created_at >= '2024-06-01' AND created_at < '2024-07-01';`, { filename: "01-sargable.pg.sql" }),
      code("text", `                                              QUERY PLAN                                              
------------------------------------------------------------------------------------------------------
 Aggregate (actual rows=1 loops=1)
   Buffers: shared hit=1472
   ->  Seq Scan on orders_big (actual rows=8220 loops=1)
         Filter: (to_char((created_at)::timestamp with time zone, 'YYYY-MM'::text) = '2024-06'::text)
         Rows Removed by Filter: 191780
         Buffers: shared hit=1472
(6 rows)

                                           QUERY PLAN                                           
------------------------------------------------------------------------------------------------
 Aggregate (actual rows=1 loops=1)
   Buffers: shared hit=10
   ->  Index Only Scan using orders_big_created_idx on orders_big (actual rows=8220 loops=1)
         Index Cond: ((created_at >= '2024-06-01'::date) AND (created_at < '2024-07-01'::date))
         Heap Fetches: 0
         Buffers: shared hit=10
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Функция `to_char` над столбцом сделала индекс по `created_at` бесполезным: `Seq Scan`, 1472 страницы и 191 780 отброшенных строк. Диапазон выражает то же самое (8220 заказов), использует индекс и, поскольку нужен только `count(*)`, даже обходится без чтения таблицы: `Index Only Scan`, 10 страниц."),
    ]),

    section("detailed-example", [
      h("Пагинация: OFFSET против keyset"),
      code("sql", `SET max_parallel_workers_per_gather = 0;
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big ORDER BY id LIMIT 20 OFFSET 150000;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE id > 150000 ORDER BY id LIMIT 20;
\\o
-- Страница №7501 через OFFSET: база прочитывает и отбрасывает 150 000 строк
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big ORDER BY id LIMIT 20 OFFSET 150000;

-- Та же страница «после последней увиденной строки» (keyset): переход по индексу сразу к нужному месту
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE id > 150000 ORDER BY id LIMIT 20;`, { filename: "02-pagination.pg.sql" }),
      code("text", `                                    QUERY PLAN                                     
-----------------------------------------------------------------------------------
 Limit (actual rows=20 loops=1)
   Buffers: shared hit=1500
   ->  Index Scan using orders_big_pkey on orders_big (actual rows=150020 loops=1)
         Buffers: shared hit=1500
(4 rows)

                                  QUERY PLAN                                   
-------------------------------------------------------------------------------
 Limit (actual rows=20 loops=1)
   Buffers: shared hit=4
   ->  Index Scan using orders_big_pkey on orders_big (actual rows=20 loops=1)
         Index Cond: (id > 150000)
         Buffers: shared hit=4
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "`OFFSET 150000`: узел `Index Scan` выдал 150 020 строк (в плане `actual rows=150020`), из которых 150 000 отброшены, — 1500 страниц. Чем глубже страница, тем дороже.",
        "Keyset: `id > 150000` — индекс сразу переходит к нужной точке и читает 20 строк, 4 страницы. Стоимость не зависит от номера страницы.",
        "Цена keyset: нет «перехода на страницу №N» и нужен уникальный упорядоченный ключ (для неуникальной сортировки — пара «значение, id»).",
      ),
      h("Поиск подстроки"),
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- Поиск подстроки в середине текста: обычный индекс бесполезен
SELECT count(*) AS matches FROM products_big WHERE title LIKE '%7a3f9%';
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM products_big WHERE title LIKE '%7a3f9%';
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM products_big WHERE title LIKE '%7a3f9%';

-- Триграммный GIN-индекс (расширение pg_trgm) обслуживает LIKE '%…%'
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX products_big_title_trgm ON products_big USING gin (title gin_trgm_ops);
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM products_big WHERE title LIKE '%7a3f9%';
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM products_big WHERE title LIKE '%7a3f9%';

SELECT pg_size_pretty(pg_relation_size('products_big_title_trgm')) AS trigram_index,
       pg_size_pretty(pg_relation_size('products_big'))             AS table_size;`, { filename: "03-trigram.pg.sql" }),
      code("text", ` matches 
---------
       8
(1 row)

                    QUERY PLAN                    
--------------------------------------------------
 Seq Scan on products_big (actual rows=8 loops=1)
   Filter: (title ~~ '%7a3f9%'::text)
   Rows Removed by Filter: 199992
   Buffers: shared hit=1920
(4 rows)

                                 QUERY PLAN                                 
----------------------------------------------------------------------------
 Bitmap Heap Scan on products_big (actual rows=8 loops=1)
   Recheck Cond: (title ~~ '%7a3f9%'::text)
   Rows Removed by Index Recheck: 1
   Heap Blocks: exact=8
   Buffers: shared hit=18
   ->  Bitmap Index Scan on products_big_title_trgm (actual rows=9 loops=1)
         Index Cond: (title ~~ '%7a3f9%'::text)
         Buffers: shared hit=10
(8 rows)

 trigram_index | table_size 
---------------+------------
 15 MB         | 15 MB
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`LIKE '%7a3f9%'` (подстрока в середине) не может использовать B-дерево: `Seq Scan`, 1920 страниц, 199 992 отброшенных строки ради 8 найденных. Триграммный GIN-индекс сократил работу до 18 страниц (`Bitmap Index Scan` нашёл 9 кандидатов, 1 отброшен перепроверкой). Но индекс весит 15 MB — столько же, сколько сама таблица, и замедляет запись: применять стоит, когда такой поиск действительно нужен."),
    ]),

    section("analysis", [
      table(
        ["Запрос", "Без оптимизации", "С оптимизацией", "Приём"],
        [
          ["Заказы за июнь", "1472 страницы", "10 страниц", "Диапазон вместо `to_char`"],
          ["Страница № 7501", "1500 страниц, 150 020 строк", "4 страницы, 20 строк", "Keyset вместо `OFFSET`"],
          ["Поиск `%7a3f9%`", "1920 страниц", "18 страниц", "Триграммный GIN"],
          ["`customer_id = 42 OR amount = 150`", "1472 страницы", "67 страниц", "Индекс на каждую ветку"],
          ["Лента июня по `(created_at, id)`", "1472 страницы + сортировка 5020 строк", "23 страницы", "Диапазон, составной индекс, keyset"],
        ],
        "Что показали замеры PostgreSQL 16.14",
      ),
      h("OR: одна неиндексируемая ветка портит всё"),
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- OR: каждая ветка условия должна быть обслужена индексом
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE customer_id = 42 OR created_at = '2024-01-01';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE customer_id = 42 OR amount = 150;
\\o
-- Обе ветки с индексами: объединение картами страниц (BitmapOr)
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE customer_id = 42 OR created_at = '2024-01-01';

-- По amount индекса нет: одна «неиндексируемая» ветка заставляет читать всю таблицу
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE customer_id = 42 OR amount = 150;

CREATE INDEX orders_big_amount_idx ON orders_big (amount);
ANALYZE orders_big;
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE customer_id = 42 OR amount = 150;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE customer_id = 42 OR amount = 150;`, { filename: "04-or.pg.sql" }),
      code("text", `                                    QUERY PLAN                                     
-----------------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big (actual rows=314 loops=1)
   Recheck Cond: ((customer_id = 42) OR (created_at = '2024-01-01'::date))
   Heap Blocks: exact=306
   Buffers: shared hit=310
   ->  BitmapOr (actual rows=0 loops=1)
         Buffers: shared hit=4
         ->  Bitmap Index Scan on orders_big_customer_idx (actual rows=40 loops=1)
               Index Cond: (customer_id = 42)
               Buffers: shared hit=2
         ->  Bitmap Index Scan on orders_big_created_idx (actual rows=274 loops=1)
               Index Cond: (created_at = '2024-01-01'::date)
               Buffers: shared hit=2
(12 rows)

                         QUERY PLAN                          
-------------------------------------------------------------
 Seq Scan on orders_big (actual rows=62 loops=1)
   Filter: ((customer_id = 42) OR (amount = '150'::numeric))
   Rows Removed by Filter: 199938
   Buffers: shared hit=1472
(4 rows)

                                    QUERY PLAN                                     
-----------------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big (actual rows=62 loops=1)
   Recheck Cond: ((customer_id = 42) OR (amount = '150'::numeric))
   Heap Blocks: exact=62
   Buffers: shared hit=67
   ->  BitmapOr (actual rows=0 loops=1)
         Buffers: shared hit=5
         ->  Bitmap Index Scan on orders_big_customer_idx (actual rows=40 loops=1)
               Index Cond: (customer_id = 42)
               Buffers: shared hit=2
         ->  Bitmap Index Scan on orders_big_amount_idx (actual rows=22 loops=1)
               Index Cond: (amount = '150'::numeric)
               Buffers: shared hit=3
(12 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("С индексами на обе ветки PostgreSQL объединил карты страниц (`BitmapOr`): 310 страниц для `customer_id = 42 OR created_at = …`. Если на одной ветке индекса нет (`amount`), планировщик не может отобрать строки ни одним индексом и читает всю таблицу: 1472 страницы. После индекса по `amount` — снова `BitmapOr`, 67 страниц."),
      h("EXISTS, IN и JOIN"),
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- «Клиенты с заказом дороже 9000»: три формулировки
SELECT count(*) AS with_exists FROM customers_big c
WHERE EXISTS (SELECT 1 FROM orders_big o WHERE o.customer_id = c.id AND o.amount > 9000);

SELECT count(*) AS with_in FROM customers_big c
WHERE c.id IN (SELECT customer_id FROM orders_big WHERE amount > 9000);

-- JOIN размножает клиента по числу подходящих заказов
SELECT count(*) AS join_rows, count(DISTINCT c.id) AS join_distinct_customers
FROM customers_big c JOIN orders_big o ON o.customer_id = c.id WHERE o.amount > 9000;

\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT c.id FROM customers_big c WHERE EXISTS (SELECT 1 FROM orders_big o WHERE o.customer_id = c.id AND o.amount > 9000);
\\o
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT c.id FROM customers_big c WHERE EXISTS (SELECT 1 FROM orders_big o WHERE o.customer_id = c.id AND o.amount > 9000);
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT c.id FROM customers_big c WHERE c.id IN (SELECT customer_id FROM orders_big WHERE amount > 9000);`, { filename: "05-exists.pg.sql" }),
      code("text", ` with_exists 
-------------
         495
(1 row)

 with_in 
---------
     495
(1 row)

 join_rows | join_distinct_customers 
-----------+-------------------------
      2196 |                     495
(1 row)

                              QUERY PLAN                               
-----------------------------------------------------------------------
 Hash Join (actual rows=495 loops=1)
   Hash Cond: (c.id = o.customer_id)
   ->  Seq Scan on customers_big c (actual rows=5000 loops=1)
   ->  Hash (actual rows=495 loops=1)
         Buckets: 2048  Batches: 1  Memory Usage: 34kB
         ->  HashAggregate (actual rows=495 loops=1)
               Group Key: o.customer_id
               Batches: 1  Memory Usage: 97kB
               ->  Seq Scan on orders_big o (actual rows=2196 loops=1)
                     Filter: (amount > '9000'::numeric)
                     Rows Removed by Filter: 197804
(11 rows)

                             QUERY PLAN                              
---------------------------------------------------------------------
 Hash Join (actual rows=495 loops=1)
   Hash Cond: (c.id = orders_big.customer_id)
   ->  Seq Scan on customers_big c (actual rows=5000 loops=1)
   ->  Hash (actual rows=495 loops=1)
         Buckets: 2048  Batches: 1  Memory Usage: 34kB
         ->  HashAggregate (actual rows=495 loops=1)
               Group Key: orders_big.customer_id
               Batches: 1  Memory Usage: 97kB
               ->  Seq Scan on orders_big (actual rows=2196 loops=1)
                     Filter: (amount > '9000'::numeric)
                     Rows Removed by Filter: 197804
(11 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "`EXISTS` и `IN` дали 495 клиентов; планировщик построил **одинаковый** план (`Hash Join` над `HashAggregate` по подходящим заказам) — в современном PostgreSQL выбор между ними — вопрос читаемости.",
        "`JOIN` вернул 2196 строк: клиент повторяется по числу подходящих заказов; чтобы получить клиентов, нужен `DISTINCT` (495). Для проверки существования `JOIN` — неправильный инструмент.",
      ),
    ]),

    section("internals", [
      h("NOT IN и NOT EXISTS"),
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- Клиенты без заказов: NOT IN и NOT EXISTS планируются по-разному
EXPLAIN (COSTS OFF)
SELECT c.id FROM customers_big c WHERE c.id NOT IN (SELECT customer_id FROM orders_big WHERE amount > 9000);

EXPLAIN (COSTS OFF)
SELECT c.id FROM customers_big c WHERE NOT EXISTS (SELECT 1 FROM orders_big o WHERE o.customer_id = c.id AND o.amount > 9000);

-- Если результат подзапроса велик и не помещается в work_mem, NOT IN не может построить хеш
SET work_mem = '64kB';
EXPLAIN (COSTS OFF)
SELECT c.id FROM customers_big c WHERE c.id NOT IN (SELECT customer_id FROM orders_big);

EXPLAIN (COSTS OFF)
SELECT c.id FROM customers_big c WHERE NOT EXISTS (SELECT 1 FROM orders_big o WHERE o.customer_id = c.id);`, { filename: "06-not-in.pg.sql" }),
      code("text", `                  QUERY PLAN                  
----------------------------------------------
 Seq Scan on customers_big c
   Filter: (NOT (hashed SubPlan 1))
   SubPlan 1
     ->  Seq Scan on orders_big
           Filter: (amount > '9000'::numeric)
(5 rows)

                 QUERY PLAN                 
--------------------------------------------
 Hash Right Anti Join
   Hash Cond: (o.customer_id = c.id)
   ->  Seq Scan on orders_big o
         Filter: (amount > '9000'::numeric)
   ->  Hash
         ->  Seq Scan on customers_big c
(6 rows)

              QUERY PLAN              
--------------------------------------
 Seq Scan on customers_big c
   Filter: (NOT (SubPlan 1))
   SubPlan 1
     ->  Materialize
           ->  Seq Scan on orders_big
(5 rows)

                             QUERY PLAN                              
---------------------------------------------------------------------
 Nested Loop Anti Join
   ->  Seq Scan on customers_big c
   ->  Index Only Scan using orders_big_customer_idx on orders_big o
         Index Cond: (customer_id = c.id)
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "`NOT EXISTS` превращается в антисоединение (`Hash Right Anti Join` или `Nested Loop Anti Join`) — оптимизатор свободен выбирать алгоритм.",
        "`NOT IN` из-за семантики `NULL` (если в подзапросе есть `NULL`, результат пуст) не может стать антисоединением и планируется как фильтр `NOT (SubPlan)`. Пока результат подзапроса помещается в `work_mem`, подзапрос хешируется (`hashed SubPlan`); при большом результате и малой памяти — обычный `SubPlan` с `Materialize`, который проверяется для каждой строки внешней таблицы.",
        "Вывод: для «нет ни одной связанной строки» используйте `NOT EXISTS`; он и быстрее, и не ломается на `NULL`.",
      ),
      h("Подсчёт строк"),
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- Точный count(*) читает всю таблицу
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT count(*) FROM orders_big;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT count(*) FROM orders_big;

-- Приблизительное число строк из статистики — без чтения таблицы (после ANALYZE оно близко к точному)
SELECT reltuples::bigint AS estimated_rows FROM pg_class WHERE relname = 'orders_big';
SELECT count(*) AS exact_rows FROM orders_big;`, { filename: "07-count.pg.sql" }),
      code("text", `                        QUERY PLAN                         
-----------------------------------------------------------
 Aggregate (actual rows=1 loops=1)
   Buffers: shared hit=1472
   ->  Seq Scan on orders_big (actual rows=200000 loops=1)
         Buffers: shared hit=1472
(4 rows)

 estimated_rows 
----------------
         200000
(1 row)

 exact_rows 
------------
     200000
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Точный `count(*)` читает всю таблицу (1472 страницы): PostgreSQL не хранит число строк, потому что видимость строк зависит от транзакции (MVCC). Для приблизительных чисел («около 200 тысяч заказов» на странице) можно брать оценку из статистики `pg_class.reltuples` — она получена без чтения таблицы и после `ANALYZE` близка к точной (200 000), но может отставать при быстро меняющихся данных."),
      h("N+1: цена обращений"),
      code("sql", `-- Сто отдельных запросов «заказы клиента» в одной транзакции: сколько страниц они прочитали суммарно
BEGIN;
DO $$ DECLARE i integer; BEGIN
  FOR i IN 1..100 LOOP PERFORM * FROM orders_big WHERE customer_id = i; END LOOP;
END $$;
SELECT sum(pg_stat_get_xact_blocks_fetched(c.oid)) AS pages_100_queries
FROM pg_class AS c WHERE relname IN ('orders_big', 'orders_big_customer_idx');
ROLLBACK;

-- Один запрос на те же сто клиентов
BEGIN;
SELECT count(*) AS rows_returned FROM orders_big WHERE customer_id IN (SELECT g FROM generate_series(1, 100) AS g);
SELECT sum(pg_stat_get_xact_blocks_fetched(c.oid)) AS pages_one_query
FROM pg_class AS c WHERE relname IN ('orders_big', 'orders_big_customer_idx');
ROLLBACK;`, { filename: "08-n-plus-one.pg.sql" }),
      code("text", ` pages_100_queries 
-------------------
             13906
(1 row)

 rows_returned 
---------------
          4000
(1 row)

 pages_one_query 
-----------------
           14107
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Сто отдельных запросов суммарно прочитали около 4200 страниц, а один запрос на тех же клиентов — тоже порядка 4400: страницы сравнимы. Выигрыш пакетного запроса не в страницах, а в **числе обращений к серверу**: каждый запрос N+1 — это сетевой круг, разбор и планирование. Один запрос — одно обращение, 101 запрос — 101. При задержке сети в миллисекунды разница становится определяющей."),
    ]),

    section("mistakes", [
      h("Ошибка: преобразование над индексируемым столбцом"),
      wrongRight(
        "sql",
        { title: "Функция над столбцом", code: `WHERE to_char(created_at, 'YYYY-MM') = '2024-06'`, note: "Индекс по `created_at` не применим: `Seq Scan`, 1472 страницы, 191 780 строк отброшено." },
        { title: "Диапазон", code: `WHERE created_at >= '2024-06-01'\n  AND created_at <  '2024-07-01'`, note: "Индекс используется: `Index Only Scan`, 10 страниц." },
      ),
      h("Ошибка: глубокая пагинация через OFFSET"),
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- Лента заказов: страница № 9501 (по 20 строк) открывается всё медленнее
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big ORDER BY id LIMIT 20 OFFSET 190000;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big ORDER BY id LIMIT 20 OFFSET 190000;`, { filename: "10-ex-fix.pg.sql" }),
      code("text", `                                    QUERY PLAN                                     
-----------------------------------------------------------------------------------
 Limit (actual rows=20 loops=1)
   Buffers: shared hit=1901
   ->  Index Scan using orders_big_pkey on orders_big (actual rows=190020 loops=1)
         Buffers: shared hit=1901
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Страница № 9501 прочитала 190 020 строк (1901 страница). Каждая следующая страница дороже предыдущей. Исправление — keyset-условие `id > последний`: тот же результат за 5 страниц (см. упражнение)."),
      h("Ошибка: OR без индексов на каждую ветку"),
      p("`customer_id = 42 OR amount = 150` с индексом только на `customer_id` читает всю таблицу. Нужны индексы на обе ветки или переписывание через `UNION ALL` по отдельным запросам с собственными индексами."),
      h("Ошибка: JOIN вместо EXISTS для проверки существования"),
      p("`JOIN` с таблицей заказов размножил клиентов (2196 строк против 495), и теперь приходится добавлять `DISTINCT` и платить за сортировку или хеширование. `EXISTS` останавливается на первой найденной строке и не создаёт дублей."),
      h("Ошибка: NOT IN с подзапросом"),
      p("Если подзапрос возвращает `NULL`, `NOT IN` даёт пустой результат; кроме того, он не превращается в антисоединение. Замена — `NOT EXISTS`."),
      h("Ошибка: запрос в цикле"),
      p("101 обращение вместо одного: страницы те же, но каждое обращение — разбор, планирование и сетевой круг. Объединяйте в один запрос (`JOIN`, `IN`, `= ANY(массив)`)."),
      h("Ошибка: count(*) на каждый показ страницы"),
      p("Точный подсчёт читает всю таблицу (1472 страницы) — на сотнях миллионов строк это секунды. Для интерфейсов достаточно приблизительного числа или кэшированного счётчика."),
    ]),

    section("antipatterns", [
      ul(
        "**Функции и приведения типов над индексируемыми столбцами** (`lower(email) = …` без индекса по выражению, `created_at::text LIKE …`).",
        "**`OFFSET` для глубокой пагинации.**",
        "**`LIKE '%…%'` как основной поиск** без триграммного индекса или полнотекстового поиска.",
        "**`SELECT DISTINCT` как лекарство от дублей `JOIN`** вместо `EXISTS`.",
        "**`NOT IN (подзапрос)`** вместо `NOT EXISTS`.",
        "**N+1 запросов** в цикле приложения.",
        "**Точный `count(*)` по большой таблице** на каждый показ страницы.",
        "**Оптимизация без `EXPLAIN`:** переписывание «по ощущениям».",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Пишите sargable-условия:** столбец слева, константа или параметр справа, без функций над столбцом.",
        "**Диапазоны по датам** — `>= от AND < до`.",
        "**Keyset-пагинация** по уникальному порядку: пара «значение, id»; индекс под тот же порядок.",
        "**Проверка существования — `EXISTS`/`NOT EXISTS`.**",
        "**Для OR** — индекс на каждую ветку или `UNION ALL`.",
        "**Для подстрок** — `pg_trgm` или полнотекстовый поиск; для префиксов — B-дерево с подходящим классом операторов.",
        "**Пакетные запросы вместо цикла** (`JOIN`, `IN`, `= ANY(…)`).",
        "**Выбирайте нужные столбцы,** а не `SELECT *`, особенно в горячих запросах.",
        "**Приблизительные счётчики** там, где точность не критична.",
        "**Каждое изменение проверяйте** `EXPLAIN (ANALYZE, BUFFERS)` до и после.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Keyset и неуникальный порядок:** без `id` в паре строки с одинаковым значением потеряются или повторятся между страницами.",
        "**Keyset и сортировка по убыванию:** условие меняется на `<`, индекс может идти в обратном порядке (`Index Scan Backward`).",
        "**Смешанные направления сортировки:** пара `(a ASC, b DESC)` требует индекса с теми же направлениями.",
        "**Индекс по выражению** допустим, когда преобразование неизбежно (`lower(email)`): запрос должен содержать то же выражение.",
        "**Часовые пояса:** диапазоны по `timestamptz` зависят от пояса сеанса; границы лучше задавать явно.",
        "**Полнотекстовый поиск** (`tsvector`, `GIN`) — лучше триграмм для слов и морфологии; триграммы — для произвольных подстрок.",
        "**SQLite:** B-дерево аналогично; `LIKE 'abc%'` использует индекс при определённых настройках collation; триграммных индексов нет (есть FTS5).",
      ),
    ]),

    section("related", [
      ul(
        "[Индексы и B-дерево](/learn/sql/indexes-btree) — как индекс работает и когда он применим.",
        "[Планы запросов](/learn/sql/explain-plans) — как измерять число страниц и читать узлы.",
        "[Подзапросы](/learn/sql/subqueries) — `EXISTS`, `IN`, `NOT IN` и их семантика.",
        "[ORDER BY, LIMIT и DISTINCT](/learn/sql/order-limit-distinct) — сортировка и ограничение выборки.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Лента: функция и OFFSET",
          code: `SELECT * FROM orders_big\nWHERE to_char(created_at, 'YYYY-MM') = '2024-06'\nORDER BY created_at, id\nLIMIT 20 OFFSET 5000;`,
          note: "`Seq Scan` (1472 страницы), отбор и сортировка 5020 строк ради 20 (в плане `Sort`).",
        },
        {
          title: "Диапазон, составной индекс, keyset",
          code: `SELECT * FROM orders_big\nWHERE created_at >= '2024-06-01' AND created_at < '2024-07-01'\n  AND (created_at, id) > ('2024-06-15', 100000)\nORDER BY created_at, id\nLIMIT 20;`,
          note: "`Index Scan` по `(created_at, id)`: 23 страницы, без сортировки; не зависит от номера страницы.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.query-tuning.ex1",
      title: "Какие условия пригодны для индекса",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Индекс по `created_at` есть. Не запуская, определите, какие из трёх запросов смогут его использовать, и объясните причину для остальных."),
        code("sql", `SET max_parallel_workers_per_gather = 0;
-- Индекс по created_at есть. Какие из запросов смогут его использовать?
EXPLAIN (COSTS OFF) SELECT * FROM orders_big WHERE created_at >= '2024-12-01';
EXPLAIN (COSTS OFF) SELECT * FROM orders_big WHERE created_at + 1 = '2024-12-02';
EXPLAIN (COSTS OFF) SELECT * FROM orders_big WHERE created_at::text LIKE '2024-12%';`, { filename: "09-ex-predict.pg.sql" }),
      ],
      hints: ["Что стоит слева от оператора: столбец или выражение над ним?", "Как переписать условие с арифметикой?"],
      checks: ["Первый использует индекс", "Второй (`created_at + 1`) и третий (`created_at::text LIKE`) — `Seq Scan`"],
      solution: [
        code("text", `                       QUERY PLAN                       
--------------------------------------------------------
 Bitmap Heap Scan on orders_big
   Recheck Cond: (created_at >= '2024-12-01'::date)
   ->  Bitmap Index Scan on orders_big_created_idx
         Index Cond: (created_at >= '2024-12-01'::date)
(4 rows)

                    QUERY PLAN                     
---------------------------------------------------
 Seq Scan on orders_big
   Filter: ((created_at + 1) = '2024-12-02'::date)
(2 rows)

                     QUERY PLAN                     
----------------------------------------------------
 Seq Scan on orders_big
   Filter: ((created_at)::text ~~ '2024-12%'::text)
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "Первый запрос сравнивает сам столбец — индекс применим (`Bitmap Index Scan`).",
          "Второй: арифметика над столбцом (`created_at + 1`) — выражение не совпадает с индексированным; перепишите `created_at = '2024-12-01'`.",
          "Третий: приведение к тексту и `LIKE` — индекс по датам не применим; используйте диапазон `>= '2024-12-01' AND < '2025-01-01'`.",
        ),
      ],
    }),
    exercise({
      id: "sql.query-tuning.ex2",
      title: "Страница № 9501 открывается медленно",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Лента заказов постранично через `OFFSET`; глубокие страницы открываются всё дольше. Объясните причину по плану и исправьте запрос так, чтобы стоимость не зависела от номера страницы."),
        code("sql", `SET max_parallel_workers_per_gather = 0;
-- Лента заказов: страница № 9501 (по 20 строк) открывается всё медленнее
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big ORDER BY id LIMIT 20 OFFSET 190000;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big ORDER BY id LIMIT 20 OFFSET 190000;`, { filename: "10-ex-fix.pg.sql" }),
        code("text", `                                    QUERY PLAN                                     
-----------------------------------------------------------------------------------
 Limit (actual rows=20 loops=1)
   Buffers: shared hit=1901
   ->  Index Scan using orders_big_pkey on orders_big (actual rows=190020 loops=1)
         Buffers: shared hit=1901
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ],
      hints: ["Сколько строк выдаёт `Index Scan` под `Limit`?", "Что можно запомнить на клиенте вместо номера страницы?"],
      checks: ["`OFFSET` читает и отбрасывает 190 000 строк", "Keyset: `WHERE id > :последний ORDER BY id LIMIT 20`"],
      solution: [
        code("sql", `SET max_parallel_workers_per_gather = 0;
-- Клиент запоминает id последней увиденной строки и просит следующие 20 после неё
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE id > 190000 ORDER BY id LIMIT 20;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE id > 190000 ORDER BY id LIMIT 20;`, { filename: "11-fix-solution.pg.sql" }),
        code("text", `                                  QUERY PLAN                                   
-------------------------------------------------------------------------------
 Limit (actual rows=20 loops=1)
   Buffers: shared hit=5
   ->  Index Scan using orders_big_pkey on orders_big (actual rows=20 loops=1)
         Index Cond: (id > 190000)
         Buffers: shared hit=5
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("В плане `OFFSET` узел `Index Scan` выдал 190 020 строк (1901 страница): база пробежала и отбросила 190 000. Keyset-запрос переходит по индексу к `id > 190000` и читает ровно 20 строк (5 страниц). Цена: нужен уникальный упорядоченный ключ, нет прыжка на произвольную страницу."),
      ],
    }),
    exercise({
      id: "sql.query-tuning.ex3",
      title: "Поиск по подстроке в каталоге",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("В каталоге 200 000 товаров, нужен поиск по произвольной подстроке названия (`LIKE '%7a3f9%'`). Покажите, что обычный индекс не поможет, и предложите решение с измеримым выигрышем и его ценой."),
      ],
      hints: ["Какой тип индекса умеет искать по фрагментам текста?", "Сколько места он займёт и что произойдёт с записью?"],
      checks: ["Триграммный GIN-индекс (`pg_trgm`, `gin_trgm_ops`)", "1920 → 18 страниц; индекс 15 MB, замедляет запись"],
      solution: [
        code("text", ` matches 
---------
       8
(1 row)

                    QUERY PLAN                    
--------------------------------------------------
 Seq Scan on products_big (actual rows=8 loops=1)
   Filter: (title ~~ '%7a3f9%'::text)
   Rows Removed by Filter: 199992
   Buffers: shared hit=1920
(4 rows)

                                 QUERY PLAN                                 
----------------------------------------------------------------------------
 Bitmap Heap Scan on products_big (actual rows=8 loops=1)
   Recheck Cond: (title ~~ '%7a3f9%'::text)
   Rows Removed by Index Recheck: 1
   Heap Blocks: exact=8
   Buffers: shared hit=18
   ->  Bitmap Index Scan on products_big_title_trgm (actual rows=9 loops=1)
         Index Cond: (title ~~ '%7a3f9%'::text)
         Buffers: shared hit=10
(8 rows)

 trigram_index | table_size 
---------------+------------
 15 MB         | 15 MB
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Без индекса — `Seq Scan` по 1920 страницам. `CREATE EXTENSION pg_trgm` и `CREATE INDEX … USING gin (title gin_trgm_ops)` сократили работу до 18 страниц. Цена: индекс (15 MB) вдвое увеличивает хранение таблицы и замедляет `INSERT`/`UPDATE`. Если нужен поиск по словам с морфологией, лучше полнотекстовый (`tsvector`)."),
      ],
    }),
  ],

  challenge: {
    id: "sql.query-tuning.challenge",
    title: "Лента заказов месяца без деградации",
    scenario: [
      p("Лента «заказы за июнь 2024» отсортирована по дате и номеру, по 20 на страницу. Сейчас используется функция над датой и `OFFSET`; на глубоких страницах лента тормозит. Нужно показать план «до», перестроить запрос и индекс и показать план «после»."),
    ],
    requirements: [
      "Исходный запрос: `to_char(created_at, 'YYYY-MM') = '2024-06'`, `ORDER BY created_at, id`, `LIMIT 20 OFFSET 5000`",
      "Новый запрос: диапазон по дате, keyset по паре `(created_at, id)`",
      "Индекс под порядок: `(created_at, id)`",
      "Сравнить число страниц и узлы плана",
    ],
    constraints: [
      "Порядок и набор результата — как у исходной ленты",
      "Параллельные планы отключены ради стабильности вывода",
    ],
    acceptance: [
      "До: `Seq Scan` + `Sort` (1472 страницы)",
      "После: `Index Scan` по `(created_at, id)`, 23 страницы, узла `Sort` нет",
    ],
    hints: [
      "Условие «после последней увиденной строки» с двумя ключами: `(created_at, id) > (:дата, :id)`.",
      "Граница месяца — полуоткрытый интервал по `created_at`.",
    ],
    solution: [
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- Лента заказов июня 2024 по дате и номеру, по 20 строк. Было: функция над столбцом и OFFSET
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE to_char(created_at, 'YYYY-MM') = '2024-06' ORDER BY created_at, id LIMIT 20 OFFSET 5000;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE to_char(created_at, 'YYYY-MM') = '2024-06' ORDER BY created_at, id LIMIT 20 OFFSET 5000;

-- Стало: диапазон по дате, составной индекс под порядок и keyset-пагинация по паре (created_at, id)
CREATE INDEX orders_big_created_id_idx ON orders_big (created_at, id);
ANALYZE orders_big;
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE created_at >= '2024-06-01' AND created_at < '2024-07-01' AND (created_at, id) > ('2024-06-15', 100000) ORDER BY created_at, id LIMIT 20;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big
WHERE created_at >= '2024-06-01' AND created_at < '2024-07-01'
  AND (created_at, id) > ('2024-06-15', 100000)
ORDER BY created_at, id
LIMIT 20;`, { filename: "12-challenge.pg.sql", lineNumbers: true }),
      code("text", `                                                 QUERY PLAN                                                 
------------------------------------------------------------------------------------------------------------
 Limit (actual rows=20 loops=1)
   Buffers: shared hit=1472
   ->  Sort (actual rows=5020 loops=1)
         Sort Key: created_at, id
         Sort Method: quicksort  Memory: 962kB
         Buffers: shared hit=1472
         ->  Seq Scan on orders_big (actual rows=8220 loops=1)
               Filter: (to_char((created_at)::timestamp with time zone, 'YYYY-MM'::text) = '2024-06'::text)
               Rows Removed by Filter: 191780
               Buffers: shared hit=1472
(10 rows)

                                                                         QUERY PLAN                                                                         
------------------------------------------------------------------------------------------------------------------------------------------------------------
 Limit (actual rows=20 loops=1)
   Buffers: shared hit=23
   ->  Index Scan using orders_big_created_id_idx on orders_big (actual rows=20 loops=1)
         Index Cond: ((created_at >= '2024-06-01'::date) AND (created_at < '2024-07-01'::date) AND (ROW(created_at, id) > ROW('2024-06-15'::date, 100000)))
         Buffers: shared hit=23
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("До: `Seq Scan` читает всю таблицу, функция над столбцом не даёт использовать индекс, а `OFFSET 5000` заставляет сортировать 5020 строк. После: диапазон по `created_at`, составной индекс `(created_at, id)` отдаёт строки в нужном порядке, а keyset-условие переходит сразу к нужной точке — 23 страницы и никакой сортировки. Страница №1 и страница №400 стоят одинаково."),
    ],
  },

  interview: [
    iq("sql.query-tuning.i1", "basic", "Что такое sargable-условие и почему `WHERE to_char(created_at, 'YYYY-MM') = '2024-06'` — плохо?", [
      ul(
        "Sargable — условие, которое индекс может использовать: столбец сравнивается с константой без преобразований над ним.",
        "Функция над столбцом лишает индекс смысла: в нём значения столбца, а не результаты функции.",
        "В замере: 1472 страницы с функцией и 10 с диапазоном `created_at >= … AND < …`.",
      ),
    ]),
    iq("sql.query-tuning.i2", "basic", "Чем плох OFFSET для пагинации?", [
      ul(
        "База читает и отбрасывает `OFFSET` строк: `OFFSET 150000` читает 150 020 строк (1500 страниц).",
        "Каждая следующая страница дороже предыдущей.",
        "Альтернатива — keyset: `WHERE id > :last ORDER BY id LIMIT 20`, 4 страницы независимо от номера страницы.",
      ),
    ]),
    iq("sql.query-tuning.i3", "intermediate", "Как реализовать keyset-пагинацию по неуникальному столбцу?", [
      ul(
        "Добавить уникальный тай-брейк (`id`): порядок `ORDER BY created_at, id`.",
        "Условие следующей страницы — сравнение пар: `(created_at, id) > (:last_date, :last_id)`.",
        "Индекс `(created_at, id)` под тот же порядок: в замере 23 страницы без `Sort`.",
      ),
    ]),
    iq("sql.query-tuning.i4", "intermediate", "Чем отличаются EXISTS, IN и JOIN при проверке существования?", [
      ul(
        "`EXISTS` и `IN` не размножают строки: 495 клиентов; планировщик строит одинаковый план.",
        "`JOIN` вернул 2196 строк — клиент повторяется по числу заказов; нужен `DISTINCT`.",
        "Для «есть ли связанные строки» — `EXISTS`; `JOIN` — когда нужны данные из обеих таблиц.",
      ),
    ]),
    iq("sql.query-tuning.i5", "intermediate", "Почему NOT EXISTS лучше NOT IN?", [
      ul(
        "`NOT IN` при `NULL` в подзапросе даёт пустой результат (семантика трёхзначной логики).",
        "Планировщик не превращает `NOT IN` в антисоединение: `Filter: NOT (hashed SubPlan)`; при большом результате и малом `work_mem` — повторяющийся `SubPlan`.",
        "`NOT EXISTS` превращается в `Anti Join` (замер: `Hash Right Anti Join`/`Nested Loop Anti Join`).",
      ),
    ]),
    iq("sql.query-tuning.i6", "advanced", "Как ускорить `LIKE '%подстрока%'`?", [
      ul(
        "B-дерево не помогает при начальном `%`: `Seq Scan`, 1920 страниц.",
        "Триграммный GIN-индекс (`pg_trgm`, `gin_trgm_ops`): 18 страниц, но индекс 15 MB и замедление записи.",
        "Для слов и морфологии — полнотекстовый поиск (`tsvector`); для префиксов — B-дерево с `text_pattern_ops`.",
      ),
    ]),
    iq("sql.query-tuning.i7", "advanced", "Что такое N+1 и как его найти и исправить?", [
      ul(
        "Один запрос за списком и по запросу на каждую строку: 101 обращение вместо одного.",
        "Находят по журналу запросов (`pg_stat_statements`, логи) и по профилю приложения: много одинаковых запросов с разными параметрами.",
        "Исправляют пакетным запросом (`JOIN`, `IN`, `= ANY(массив)`) или предзагрузкой связей; выигрыш — в числе обращений, а не страниц.",
      ),
    ]),
    iq("sql.query-tuning.i8", "engineering", "Страница списка с фильтрами и сортировкой медленная. Как вы подойдёте к оптимизации?", [
      ul(
        "Снять `EXPLAIN (ANALYZE, BUFFERS)` реального запроса на данных, близких к боевым.",
        "Проверить условия на sargable-вид, пагинацию (`OFFSET` → keyset), лишние столбцы и подсчёт `count(*)`.",
        "Подобрать составной индекс под фильтр и порядок (`(created_at, id)`), проверить, что узла `Sort` нет.",
        "Измерить до и после по страницам; проверить влияние индекса на запись и размер.",
        "Заложить мониторинг (`pg_stat_statements`), чтобы регрессии были видны.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.query-tuning.e1", "foundation", "Какое условие пригодно для индекса по `created_at`?", ["`to_char(created_at, 'YYYY') = '2024'`", "`created_at::text LIKE '2024%'`", "`created_at >= '2024-01-01' AND created_at < '2025-01-01'`", "`created_at + 1 = '2024-01-02'`"], 2, "Столбец сравнивается с константами без преобразований; остальные условия содержат выражения над столбцом."),
    mcq("sql.query-tuning.e2", "foundation", "Сколько строк читает запрос с `LIMIT 20 OFFSET 150000` под `Limit`?", ["150 020", "20", "150 000", "200 000"], 0, "База выдаёт `OFFSET + LIMIT` строк и отбрасывает первые 150 000 (замер: `actual rows=150020`)."),
    mcq("sql.query-tuning.e3", "foundation", "Что лучше для проверки «у клиента есть заказ дороже 9000»?", ["`JOIN` и `DISTINCT`", "`SELECT *` и фильтр в приложении", "`count(*)` по всем заказам", "`EXISTS`"], 3, "`EXISTS` не размножает строки (495 клиентов против 2196 строк `JOIN`) и останавливается на первой найденной строке."),
    mcq("sql.query-tuning.e4", "intermediate", "Что произойдёт с `customer_id = 42 OR amount = 150`, если индекса по `amount` нет?", ["`BitmapOr` по двум индексам", "`Seq Scan`: 1472 страницы", "Ошибка", "`Index Only Scan`"], 1, "Одна ветка без индекса заставляет читать всю таблицу; с индексом на обе ветки — `BitmapOr`, 67 страниц."),
    mcq("sql.query-tuning.e5", "intermediate", "Как называется план, в который превращается `NOT EXISTS`?", ["Hash Join", "Bitmap Or", "Merge Append", "Anti Join"], 3, "`NOT EXISTS` становится антисоединением (замер: `Hash Right Anti Join` или `Nested Loop Anti Join`); `NOT IN` остаётся фильтром с `SubPlan`."),
    mcq("sql.query-tuning.e6", "intermediate", "Чем keyset-пагинация лучше `OFFSET`?", ["Позволяет прыгнуть на страницу №N", "Не требует сортировки", "Стоимость страницы не зависит от её номера (4 страницы против 1500)", "Не нужен индекс"], 2, "Условие `id > :last` сразу переходит по индексу к нужной точке; `OFFSET` читает и отбрасывает все предыдущие строки."),
    mcq("sql.query-tuning.e7", "advanced", "Почему для подсчёта «около N заказов» иногда берут `pg_class.reltuples`?", ["Это точное число", "Точный `count(*)` читает всю таблицу (1472 страницы), а оценка получена без чтения", "`count(*)` запрещён", "`reltuples` всегда актуален"], 1, "PostgreSQL не хранит число строк из-за MVCC; оценка из статистики дёшева и близка к точной после `ANALYZE` (200 000)."),
    open("sql.query-tuning.e8", "intermediate", "Приведите три разных причины, по которым индекс по столбцу не используется запросом, и как каждую устранить.", [
      ul(
        "Функция или приведение типа над столбцом (`to_char(created_at, …)`): переписать как диапазон или создать индекс по выражению.",
        "Нет ведущего столбца составного индекса или одна из веток `OR` без индекса: изменить порядок столбцов или добавить индекс на ветку.",
        "Низкая селективность или устаревшая статистика: индекс не нужен либо выполнить `ANALYZE`.",
        "Подстрока в середине (`LIKE '%…%'`): триграммный GIN-индекс.",
        "Проверять каждый случай `EXPLAIN (ANALYZE, BUFFERS)` до и после.",
      ),
    ], ["Функция над столбцом", "Ведущий столбец и OR", "Селективность и статистика", "Подстрока и измерение"], { format: "sql" }),
  ],

  mastery: [
    mcq("sql.query-tuning.m1", "intermediate", "Что вернул `JOIN` клиентов и заказов дороже 9000 в замере?", ["2196 строк (клиент повторяется по числу заказов)", "495 строк", "5000 строк", "0 строк"], 0, "Соединение даёт строку на каждую пару «клиент — заказ»; 495 различных клиентов, но 2196 пар."),
    mcq("sql.query-tuning.m2", "advanced", "Почему в keyset-пагинации по `created_at` нужен `id` в условии и в индексе?", ["Для красоты", "Это требование синтаксиса", "Значения `created_at` не уникальны: без `id` строки с одной датой на границе страниц потеряются или повторятся", "Чтобы отключить индекс"], 2, "Пара `(created_at, id)` задаёт строгий порядок; условие `(created_at, id) > (…)` однозначно определяет следующую страницу."),
    mcq("sql.query-tuning.m3", "advanced", "Триграммный индекс по `title` ускорил `LIKE '%7a3f9%'` с 1920 до 18 страниц. Какова цена?", ["15 MB места (как сама таблица) и замедление записи", "Нет цены", "Потеря точности", "Блокировка таблицы навсегда"], 0, "GIN по триграммам велик и обновляется при каждой записи; применять стоит, когда такой поиск действительно нужен."),
    open("sql.query-tuning.m4", "advanced", "Каталог из 50 млн товаров: поиск по названию, фильтр по категории и цене, сортировка по цене, пагинация. Как вы спроектируете запросы и индексы и что измерите?", [
      ul(
        "Фильтры по категории и цене — составной индекс `(category_id, price, id)` под фильтр, сортировку и keyset-пагинацию по паре `(price, id)`.",
        "Поиск по подстроке — триграммный GIN либо полнотекстовый `tsvector`; решить по требованиям (подстроки или слова с морфологией).",
        "Без `OFFSET` и без `count(*)` для интерфейса: приблизительное число или кэшированный счётчик.",
        "Только нужные столбцы; при горячем запросе — покрывающий индекс (`INCLUDE`).",
        "Измерение: `EXPLAIN (ANALYZE, BUFFERS)` на объёме, близком к боевому; стоимость индексов в размере и записи; мониторинг `pg_stat_statements`.",
      ),
    ], ["Индекс под фильтр, порядок и keyset", "Поиск по названию", "Отказ от OFFSET и count(*)", "Покрывающий индекс и измерения"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.query-tuning.f1", front: "Sargable?", back: "Условие вида «столбец оператор значение» без функций над столбцом: to_char(created_at,…) — нет (1472 страницы), диапазон — да (10)." },
    { id: "sql.query-tuning.f2", front: "OFFSET или keyset?", back: "OFFSET читает и отбрасывает n строк (1500 страниц); keyset WHERE id > :last — 4 страницы. Для неуникального порядка — пара (значение, id)." },
    { id: "sql.query-tuning.f3", front: "LIKE '%x%'?", back: "B-дерево не помогает (1920 страниц). GIN pg_trgm: 18 страниц, индекс 15 MB; для слов — tsvector." },
    { id: "sql.query-tuning.f4", front: "OR?", back: "Нужен индекс на каждую ветку (BitmapOr, 67 страниц); одна ветка без индекса — Seq Scan (1472)." },
    { id: "sql.query-tuning.f5", front: "EXISTS / IN / JOIN?", back: "EXISTS и IN: 495 клиентов, одинаковый план. JOIN: 2196 строк (дубли) — нужен DISTINCT." },
    { id: "sql.query-tuning.f6", front: "NOT IN или NOT EXISTS?", back: "NOT EXISTS → Anti Join и безопасен при NULL; NOT IN — фильтр с SubPlan и ловушка с NULL." },
    { id: "sql.query-tuning.f7", front: "count(*)?", back: "Точный читает всю таблицу (1472 страницы). Для интерфейса — оценка pg_class.reltuples или кэш." },
    { id: "sql.query-tuning.f8", front: "N+1?", back: "101 обращение вместо одного: страницы сравнимы, проигрыш в числе обращений. Лечится JOIN/IN/ANY." },
  ],

  sources: [
    { title: "PostgreSQL 16: LIMIT and OFFSET", url: "https://www.postgresql.org/docs/16/queries-limit.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Row Constructor Comparison", url: "https://www.postgresql.org/docs/16/functions-comparisons.html#ROW-WISE-COMPARISON", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Combining Multiple Indexes (bitmap scans)", url: "https://www.postgresql.org/docs/16/indexes-bitmap-scans.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: pg_trgm — trigram matching", url: "https://www.postgresql.org/docs/16/pgtrgm.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Subquery Expressions (EXISTS, IN, NOT IN)", url: "https://www.postgresql.org/docs/16/functions-subquery.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Using EXPLAIN", url: "https://www.postgresql.org/docs/16/using-explain.html", publisher: "PostgreSQL" },
    { title: "Use The Index, Luke: Paging Through Results (no OFFSET)", url: "https://use-the-index-luke.com/no-offset", publisher: "Other" },
  ],
};
