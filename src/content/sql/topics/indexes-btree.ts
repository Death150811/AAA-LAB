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

export const indexesBtree: Topic = {
  id: "sql.indexes-btree",
  slug: "indexes-btree",
  domain: "sql",
  module: "performance",
  title: "Индексы и B-дерево: как база находит строки",
  titleEn: "Indexes and B-Trees: How the Database Finds Rows",
  summary:
    "Индекс — отдельная отсортированная структура, которая позволяет найти строки, не читая всю таблицу. Тема на замерах PostgreSQL 16.14 с таблицей из 200 000 заказов (12 MB, 1472 страницы): запрос по `customer_id = 42` без индекса читает все 1472 страницы ради 40 строк (`Rows Removed by Filter: 199960`), с индексом — 42 страницы (`Bitmap Heap Scan`); составной индекс `(customer_id, created_at)` работает при условии на ведущий столбец и не помогает при условии только на `created_at` (снова 1472 страницы); покрывающий индекс даёт `Index Only Scan` с `Heap Fetches: 0`, а после `UPDATE` — 80 обращений к таблице до `VACUUM`; при 60 % подходящих строк индекс не нужен (`Seq Scan`), а при 10 % всё равно читаются 1451 страница; частичный индекс по 10 % строк занимает 152 kB против 1480 kB; `ORDER BY … LIMIT 10` с индексом читает 12 страниц вместо 1472; у B-дерева первичного ключа корень на уровне 2, поиск строки — 4 страницы; пять индексов увеличили объём с 16 до 24 MB.",
  minutes: 100,
  prerequisites: ["sql.select-where", "sql.order-limit-distinct", "sql.keys-constraints"],
  tags: ["index", "B-tree", "composite index", "covering index", "INCLUDE", "partial index", "expression index", "Index Scan", "Bitmap Heap Scan", "Index Only Scan", "Seq Scan", "selectivity", "EXPLAIN ANALYZE", "pageinspect", "CREATE INDEX CONCURRENTLY"],
  keyConcepts: [
    { term: "Индекс заменяет чтение всей таблицы поиском по дереву", text: "`WHERE customer_id = 42`: без индекса — `Seq Scan` и 1472 прочитанные страницы ради 40 строк, с индексом — 42 страницы. У B-дерева первичного ключа поиск одной строки читает 4 страницы (3 уровня индекса + 1 страница таблицы)." },
    { term: "Порядок столбцов в составном индексе имеет значение", text: "Индекс `(customer_id, created_at)` обслужил запрос с `customer_id` (и диапазоном по дате), но не запрос только по `created_at`: он прочитал всю таблицу (1472 страницы)." },
    { term: "Индекс не всегда нужен: решает селективность", text: "`status = 'paid'` (60 % строк) — планировщик выбрал `Seq Scan`; `status = 'new'` (10 %) — индекс используется, но строки разбросаны по таблице, и прочитано 1451 из 1472 страниц." },
    { term: "Покрывающий индекс избавляет от чтения таблицы", text: "Все столбцы запроса в индексе → `Index Only Scan`, `Heap Fetches: 0`, 4 страницы. После `UPDATE` пришлось заглядывать в таблицу (80 обращений), `VACUUM` вернул 0." },
    { term: "Частичный индекс меньше и точнее", text: "Индекс по `created_at` только для `status = 'new'` — 152 kB против 1480 kB у полного; запрос с тем же условием его использует." },
    { term: "Индексы стоят места и времени записи", text: "Таблица с первичным ключом занимала 16 MB, с пятью индексами — 24 MB; неиспользуемые индексы (`idx_scan = 0`) только замедляют запись." },
  ],
  sections: [
    section("definition", [
      def("Индекс", "Дополнительная структура данных, хранящая значения одного или нескольких столбцов в отсортированном виде со ссылками на строки таблицы; ускоряет поиск, сортировку и соединения, но занимает место и замедляет запись.", "index"),
      def("B-дерево", "Сбалансированное дерево страниц: внутренние страницы направляют поиск, листовые хранят отсортированные значения и ссылки на строки; глубина растёт логарифмически.", "B-tree"),
      def("Последовательное чтение", "Метод доступа, при котором читаются все страницы таблицы подряд (`Seq Scan`) и каждая строка проверяется условием.", "sequential scan"),
      def("Индексное чтение", "Метод доступа по индексу: `Index Scan` (строка за строкой), `Bitmap Heap Scan` (сначала собирается карта страниц), `Index Only Scan` (только из индекса).", "index scan"),
      def("Селективность", "Доля строк, удовлетворяющих условию. Чем ниже (меньше строк), тем выгоднее индекс.", "selectivity"),
      def("Составной индекс", "Индекс по нескольким столбцам; значения упорядочены по первому, внутри него — по второму и т.д. Эффективен для условий, использующих **ведущие** столбцы.", "multicolumn index"),
      def("Покрывающий индекс", "Индекс, содержащий все столбцы запроса (в ключе или в `INCLUDE`): позволяет выполнить запрос без чтения таблицы (`Index Only Scan`).", "covering index"),
      def("Частичный индекс", "Индекс, построенный только по строкам, удовлетворяющим условию `WHERE`: меньше по размеру и точнее для типичных запросов.", "partial index"),
    ]),

    section("why", [
      h("Без индекса растёт стоимость каждого запроса"),
      p("Таблица в сто строк читается мгновенно, и индексы не нужны. Но данные растут: через год «найти заказы клиента» превращается в чтение миллионов строк. Индекс делает стоимость поиска почти независимой от размера таблицы (глубина дерева растёт логарифмически), и это единственный способ получить ответ за миллисекунды, а не за секунды."),
      ul(
        "**Быстрый поиск и фильтрация:** `WHERE customer_id = 42`, диапазоны дат, уникальность.",
        "**Сортировка и топ-N:** `ORDER BY created_at LIMIT 10` без сортировки всей таблицы.",
        "**Соединения:** индекс по внешнему ключу делает `JOIN` и удаление родителей дешёвыми.",
        "**Ограничения:** `PRIMARY KEY` и `UNIQUE` реализуются уникальными индексами.",
      ),
      note("Индекс — компромисс: он ускоряет чтение и замедляет запись, занимает место и требует обслуживания. Хороший индекс создают под конкретный запрос и проверяют планом выполнения."),
    ]),

    section("mental-model", [
      h("Индекс — это оглавление или указатель в конце книги"),
      p("Чтобы найти слово в книге без указателя, надо листать все страницы (`Seq Scan`). С указателем вы открываете его на нужной букве, находите слово и номера страниц, затем идёте прямо к ним. B-дерево устроено так же, но многоуровнево: страница-корень говорит, в какой «раздел» идти, внутренние страницы сужают диапазон, лист указывает на строки. Поэтому для 200 000 ключей достаточно трёх страниц индекса, а не 551 листовой."),
      diagram(
        `
        [ корень ]                                   уровень 2 (в замере для 200 000 ключей)
            │  выбирает нужную ветку
        [ внутренние страницы ]                      уровень 1
            │  сужают диапазон
        [ листья: упорядоченные ключи → (страница, строка) таблицы ]   уровень 0

        Поиск id = 123456: корень → внутренняя страница → лист → строка таблицы = 4 страницы (замер).
        `,
        "Условная схема: поиск идёт от корня к листу, число страниц индекса равно глубине дерева.",
      ),
      h("Как рассуждать о запросе"),
      steps(
        [
          ["Сколько строк нужно?", "Если почти все — индекс бесполезен; если малая доля — полезен."],
          ["По каким столбцам фильтр и сортировка?", "Равенства — в начало составного индекса, диапазон — после них."],
          ["Нужны ли столбцы, которых нет в индексе?", "Если нет — возможен `Index Only Scan`; если да — чтение таблицы."],
          ["Не мешает ли выражение?", "Функция или приведение типа над столбцом отключают обычный индекс."],
          ["Проверить планом", "`EXPLAIN (ANALYZE, BUFFERS)`: сколько страниц прочитано до и после."],
        ],
        "Подбор индекса",
      ),
    ]),

    section("technical", [
      h("Типы индексов PostgreSQL"),
      table(
        ["Тип", "Для чего", "Операции"],
        [
          ["B-tree (по умолчанию)", "Равенство, диапазоны, сортировка, префиксы, `IS NULL`", "`<`, `<=`, `=`, `>=`, `>`, `BETWEEN`, `IN`"],
          ["Hash", "Только равенство", "`=`"],
          ["GIN", "Составные значения: массивы, `jsonb`, полнотекстовый поиск", "`@>`, `?`, `@@`"],
          ["GiST / SP-GiST", "Геометрия, диапазоны, ближайшие соседи, деревья поиска", "Зависит от класса операторов"],
          ["BRIN", "Огромные таблицы с естественным порядком (время): очень маленький индекс", "Диапазоны значений блоков"],
        ],
        "Основные типы индексов",
      ),
      h("Когда индекс используется"),
      ul(
        "Условия по **ведущим** столбцам индекса: равенства и диапазон по следующему.",
        "Селективность: планировщик сравнивает стоимость доступа по индексу и последовательного чтения по статистике (`ANALYZE`).",
        "Сортировка: индекс отдаёт строки в нужном порядке, и `ORDER BY … LIMIT` не сортирует всю таблицу.",
        "Совпадение выражения: `WHERE lower(email) = …` использует индекс по `lower(email)`, но не по `email`.",
      ),
      h("Когда индекс НЕ используется"),
      ul(
        "Нет ведущего столбца в условии (`created_at = …` при индексе `(customer_id, created_at)`).",
        "Условие затрагивает большую долю строк (60 % — дешевле прочитать таблицу).",
        "Над столбцом стоит функция или приведение типа: `customer_id::text = '42'`.",
        "Статистика устарела: планировщик ошибся в оценке числа строк.",
        "Таблица мала: проще прочитать её целиком.",
      ),
      warn("Индекс — не бесплатное «ускорение». Каждая вставка и изменение индексируемых столбцов обновляют все индексы таблицы. Измеряйте: пять индексов в замере добавили 8 MB к 16 MB."),
    ]),

    section("syntax", [
      p("Варианты `CREATE INDEX` под разные задачи; последний выполняется без блокировки записи (нельзя внутри транзакции). Данные теста — таблица `orders_big` из 200 000 строк (подготовка показана ниже)."),
      annotated(
        "sql",
        `-- Обычный индекс: по умолчанию B-дерево
CREATE INDEX orders_big_customer_idx ON orders_big (customer_id);
-- Составной: порядок столбцов важен, направление сортировки задаётся для каждого
CREATE INDEX orders_big_cust_date_idx ON orders_big (customer_id, created_at DESC);
-- Покрывающий: INCLUDE хранит столбец в листьях, но не участвует в поиске и порядке
CREATE INDEX orders_big_cover_idx ON orders_big (status) INCLUDE (amount);
-- Частичный: индексируются только строки, подходящие под условие
CREATE INDEX orders_big_new_idx ON orders_big (created_at) WHERE status = 'new';
-- По выражению: запрос должен использовать то же выражение
CREATE INDEX orders_big_year_idx ON orders_big ((extract(year FROM created_at)));
-- Без блокировки записи (нельзя внутри транзакции)
CREATE INDEX CONCURRENTLY orders_big_amount_idx ON orders_big (amount);

SELECT indexname FROM pg_indexes WHERE tablename = 'orders_big' ORDER BY indexname;`,
        [
          { line: [1, 2], text: "Обычный индекс — B-дерево по умолчанию: подходит для равенства и диапазонов." },
          { line: [3, 4], text: "Составной индекс: порядок столбцов важен (ведущий — `customer_id`); для каждого можно задать `ASC`/`DESC`." },
          { line: [5, 6], text: "Покрывающий: `INCLUDE (amount)` кладёт столбец в листья, чтобы запрос мог обойтись без таблицы; в поиске и порядке он не участвует." },
          { line: [7, 8], text: "Частичный: в индекс попадают только строки `status = 'new'`; запросы с этим условием его используют." },
          { line: [9, 10], text: "Индекс по выражению: запрос должен содержать то же выражение; функция в нём обязана быть `IMMUTABLE`." },
          { line: [11, 12], text: "`CONCURRENTLY` строит индекс, не блокируя запись (дольше и нельзя в транзакции)." },
          { line: 14, text: "Проверка: список индексов таблицы." },
        ],
        "15-index-syntax.pg.sql",
      ),
      code("text", `        indexname         
--------------------------
 orders_big_amount_idx
 orders_big_cover_idx
 orders_big_cust_date_idx
 orders_big_customer_idx
 orders_big_new_idx
 orders_big_pkey
 orders_big_year_idx
(7 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
    ]),

    section("minimal-example", [
      p("Данные: 200 000 заказов, у каждого из 5000 клиентов по 40. Подготовка выполняется один раз перед примерами; автоочистка отключена, чтобы замеры были стабильными."),
      code("sql", `-- 200 000 заказов: у каждого из 5000 клиентов по 40 заказов; статусы 60 / 25 / 10 / 5 %
CREATE TABLE orders_big AS
SELECT g AS id,
       1 + (g * 7919) % 5000 AS customer_id,
       (ARRAY['paid','paid','paid','paid','paid','paid','paid','paid','paid','paid','paid','paid',
              'shipped','shipped','shipped','shipped','shipped','new','new','cancelled'])[1 + g % 20] AS status,
       DATE '2023-01-01' + (g % 730) AS created_at,
       (100 + (g * 31) % 9000)::numeric(10,2) AS amount
FROM generate_series(1, 200000) AS g;
ALTER TABLE orders_big ADD PRIMARY KEY (id);
ALTER TABLE orders_big SET (autovacuum_enabled = false);   -- для стабильных замеров
VACUUM ANALYZE orders_big;`, { filename: "setup.sql" }),
      p("Запрос по клиенту без индекса и тот же запрос после `CREATE INDEX`. В выводе `Buffers: shared hit=N` — число прочитанных страниц (8 КБ): стабильный показатель работы запроса. Строки `\\o /dev/null` в примерах — прогрев кэша (вывод скрыт); блок `Planning: Buffers` из плана опущен."),
      code("sql", `-- Параллельные планы отключаем, чтобы вывод был стабильным
SET max_parallel_workers_per_gather = 0;

SELECT pg_size_pretty(pg_relation_size('orders_big')) AS table_size,
       pg_relation_size('orders_big') / 8192          AS table_pages;

-- Без индекса по customer_id: читается вся таблица ради 40 строк
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE customer_id = 42;`, { filename: "01-seq-scan.pg.sql" }),
      code("text", ` table_size | table_pages 
------------+-------------
 12 MB      |        1472
(1 row)

                   QUERY PLAN                    
-------------------------------------------------
 Seq Scan on orders_big (actual rows=40 loops=1)
   Filter: (customer_id = 42)
   Rows Removed by Filter: 199960
   Buffers: shared hit=1472
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      code("sql", `SET max_parallel_workers_per_gather = 0;
CREATE INDEX orders_big_customer_idx ON orders_big (customer_id);

-- Первый запуск прогревает кэш (вывод скрыт), второй показан
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE customer_id = 42;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE customer_id = 42;

SELECT pg_size_pretty(pg_relation_size('orders_big_customer_idx')) AS index_size,
       pg_size_pretty(pg_relation_size('orders_big'))              AS table_size;`, { filename: "02-create-index.pg.sql" }),
      code("text", `                                 QUERY PLAN                                  
-----------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big (actual rows=40 loops=1)
   Recheck Cond: (customer_id = 42)
   Heap Blocks: exact=40
   Buffers: shared hit=42
   ->  Bitmap Index Scan on orders_big_customer_idx (actual rows=40 loops=1)
         Index Cond: (customer_id = 42)
         Buffers: shared hit=2
(7 rows)

 index_size | table_size 
------------+------------
 1400 kB    | 12 MB
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Без индекса: `Seq Scan`, 1472 страницы (вся таблица, 12 MB) и 199 960 отброшенных строк ради 40 нужных.",
        "С индексом: 42 страницы — 2 страницы индекса и 40 страниц таблицы (по странице на строку: заказы клиента разбросаны по таблице).",
        "Индекс весит 1400 kB, около 11 % от таблицы — цена ускорения.",
      ),
    ]),

    section("detailed-example", [
      h("Порядок столбцов в составном индексе"),
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- Составной индекс: первый столбец — по равенству, второй — по диапазону
CREATE INDEX orders_big_cust_date_idx ON orders_big (customer_id, created_at);

\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE customer_id = 42 AND created_at >= '2024-01-01';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE created_at = '2024-01-01';
\\o
-- Условие по обоим столбцам, начиная с ведущего: индекс работает
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE customer_id = 42 AND created_at >= '2024-01-01';

-- Условие только по второму столбцу: ведущего нет — индекс не помогает
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE created_at = '2024-01-01';`, { filename: "03-composite.pg.sql" }),
      code("text", `                                   QUERY PLAN                                    
---------------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big (actual rows=20 loops=1)
   Recheck Cond: ((customer_id = 42) AND (created_at >= '2024-01-01'::date))
   Heap Blocks: exact=20
   Buffers: shared hit=23
   ->  Bitmap Index Scan on orders_big_cust_date_idx (actual rows=20 loops=1)
         Index Cond: ((customer_id = 42) AND (created_at >= '2024-01-01'::date))
         Buffers: shared hit=3
(7 rows)

                    QUERY PLAN                    
--------------------------------------------------
 Seq Scan on orders_big (actual rows=274 loops=1)
   Filter: (created_at = '2024-01-01'::date)
   Rows Removed by Filter: 199726
   Buffers: shared hit=1472
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Запрос с `customer_id = 42 AND created_at >= '2024-01-01'` использовал индекс: 23 страницы (20 строк). Запрос только с `created_at` не смог начать поиск — в индексе значения упорядочены по `customer_id` сначала — и прочитал всю таблицу (1472 страницы). Правило: условие по равенству — в начало, диапазон — после, а столбец, по которому нет условия, ведущим быть не должен."),
      h("Покрывающий индекс и Index Only Scan"),
      code("sql", `SET max_parallel_workers_per_gather = 0;
CREATE INDEX orders_big_cust_date_idx ON orders_big (customer_id, created_at);

-- Все нужные столбцы есть в индексе: таблица не читается, если страницы помечены «видимыми»
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT customer_id, created_at FROM orders_big WHERE customer_id = 42;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT customer_id, created_at FROM orders_big WHERE customer_id = 42;

-- Изменение строк снимает пометку «видимости»: индексу приходится заглядывать в таблицу
UPDATE orders_big SET amount = amount + 1 WHERE customer_id = 42;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT customer_id, created_at FROM orders_big WHERE customer_id = 42;

-- VACUUM возвращает пометки
VACUUM orders_big;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT customer_id, created_at FROM orders_big WHERE customer_id = 42;`, { filename: "04-covering.pg.sql" }),
      code("text", `                                      QUERY PLAN                                       
---------------------------------------------------------------------------------------
 Index Only Scan using orders_big_cust_date_idx on orders_big (actual rows=40 loops=1)
   Index Cond: (customer_id = 42)
   Heap Fetches: 0
   Buffers: shared hit=4
(4 rows)

                                      QUERY PLAN                                       
---------------------------------------------------------------------------------------
 Index Only Scan using orders_big_cust_date_idx on orders_big (actual rows=40 loops=1)
   Index Cond: (customer_id = 42)
   Heap Fetches: 80
   Buffers: shared hit=84
(4 rows)

                                      QUERY PLAN                                       
---------------------------------------------------------------------------------------
 Index Only Scan using orders_big_cust_date_idx on orders_big (actual rows=40 loops=1)
   Index Cond: (customer_id = 42)
   Heap Fetches: 0
   Buffers: shared hit=4
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Запрос читает только `customer_id` и `created_at`, поэтому все данные есть в индексе: `Index Only Scan`, 4 страницы и `Heap Fetches: 0`. После `UPDATE` строки клиента пометки «все версии видимы» сброшены, и индексу пришлось заглядывать в таблицу: 80 обращений и 84 страницы. `VACUUM` пометки вернул. Покрывающие индексы ускоряют чтение, но работают лучше на редко изменяемых данных."),
    ]),

    section("analysis", [
      table(
        ["Запрос / приём", "Результат (замер)", "Вывод"],
        [
          ["`customer_id = 42` без индекса", "`Seq Scan`, 1472 страницы", "Читается вся таблица ради 40 строк"],
          ["То же с индексом", "`Bitmap Heap Scan`, 42 страницы", "Ускорение по числу страниц ≈ в 35 раз"],
          ["`customer_id` и диапазон `created_at` (составной индекс)", "23 страницы", "Индекс работает по ведущим столбцам"],
          ["Только `created_at` при индексе `(customer_id, created_at)`", "`Seq Scan`, 1472 страницы", "Без ведущего столбца индекс бесполезен"],
          ["Покрывающий запрос", "`Index Only Scan`, 4 страницы, `Heap Fetches: 0`", "Таблица не читается"],
          ["`status = 'paid'` (60 %)", "`Seq Scan`, 1472 страницы", "Низкая селективность: индекс не нужен"],
          ["`status = 'new'` (10 %)", "Индекс, 1470 страниц", "Строки по всей таблице — читаются почти все страницы"],
          ["`ORDER BY created_at LIMIT 10`: без индекса / с индексом", "1472 страницы + сортировка / 12 страниц", "Индекс отдаёт строки по порядку"],
        ],
        "Что показали замеры PostgreSQL 16.14 (200 000 строк)",
      ),
      h("Селективность и разброс строк"),
      code("sql", `SET max_parallel_workers_per_gather = 0;
CREATE INDEX orders_big_status_idx ON orders_big (status);
ANALYZE orders_big;

SELECT status, count(*) AS rows, round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS percent
FROM orders_big GROUP BY status ORDER BY rows DESC;

\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE status = 'paid';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE status = 'new';
\\o
-- 60% строк: индекс бесполезен, дешевле прочитать всю таблицу
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE status = 'paid';

-- 10% строк: индекс используется, но строки разбросаны по всей таблице — читаются почти все страницы
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE status = 'new';`, { filename: "05-selectivity.pg.sql" }),
      code("text", `  status   |  rows  | percent 
-----------+--------+---------
 paid      | 120000 |    60.0
 shipped   |  50000 |    25.0
 new       |  20000 |    10.0
 cancelled |  10000 |     5.0
(4 rows)

                     QUERY PLAN                      
-----------------------------------------------------
 Seq Scan on orders_big (actual rows=120000 loops=1)
   Filter: (status = 'paid'::text)
   Rows Removed by Filter: 80000
   Buffers: shared hit=1472
(4 rows)

                                  QUERY PLAN                                  
------------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big (actual rows=20000 loops=1)
   Recheck Cond: (status = 'new'::text)
   Heap Blocks: exact=1451
   Buffers: shared hit=1470
   ->  Bitmap Index Scan on orders_big_status_idx (actual rows=20000 loops=1)
         Index Cond: (status = 'new'::text)
         Buffers: shared hit=19
(7 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "60 % строк (`paid`): планировщик выбрал `Seq Scan` — прочитать таблицу целиком дешевле, чем 120 000 раз ходить по индексу.",
        "10 % строк (`new`): индекс использован (`Bitmap Heap Scan`), но строки с этим статусом есть почти на каждой странице, поэтому прочитано 1451 страниц таблицы из 1472 — выигрыша нет. Индекс по низкоселективному столбцу (4 значения) почти никогда не нужен.",
      ),
      h("Частичный индекс"),
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- Индекс только по «новым» заказам: в него попадает 10% строк
CREATE INDEX orders_big_new_idx ON orders_big (created_at) WHERE status = 'new';
CREATE INDEX orders_big_created_idx ON orders_big (created_at);

SELECT pg_size_pretty(pg_relation_size('orders_big_new_idx'))     AS partial_index,
       pg_size_pretty(pg_relation_size('orders_big_created_idx')) AS full_index;

DROP INDEX orders_big_created_idx;
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE status = 'new' AND created_at >= '2024-06-01';
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE status = 'new' AND created_at >= '2024-06-01';`, { filename: "06-partial.pg.sql" }),
      code("text", ` partial_index | full_index 
---------------+------------
 152 kB        | 1480 kB
(1 row)

                                   QUERY PLAN                                    
---------------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big (actual rows=6026 loops=1)
   Recheck Cond: ((created_at >= '2024-06-01'::date) AND (status = 'new'::text))
   Heap Blocks: exact=671
   Buffers: shared hit=678
   ->  Bitmap Index Scan on orders_big_new_idx (actual rows=6026 loops=1)
         Index Cond: (created_at >= '2024-06-01'::date)
         Buffers: shared hit=7
(7 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Частичный индекс только по «новым» заказам занял 152 kB вместо 1480 kB у полного и обслужил запрос с тем же условием: в плане `Index Cond: (created_at >= …)` и `status = 'new'` в `Recheck Cond`. Частичные индексы подходят, когда запросы стабильно касаются небольшого подмножества (активные, неархивные, неоплаченные строки)."),
    ]),

    section("internals", [
      h("Сортировка и LIMIT"),
      code("sql", `SET max_parallel_workers_per_gather = 0;

-- Без индекса по created_at: читаются все строки и сортируются
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big ORDER BY created_at LIMIT 10;

CREATE INDEX orders_big_created_idx ON orders_big (created_at);
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big ORDER BY created_at LIMIT 10;
\\o
-- С индексом строки идут уже по порядку: чтение останавливается после десятой
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big ORDER BY created_at LIMIT 10;`, { filename: "07-sort.pg.sql" }),
      code("text", `                           QUERY PLAN                            
-----------------------------------------------------------------
 Limit (actual rows=10 loops=1)
   Buffers: shared hit=1472
   ->  Sort (actual rows=10 loops=1)
         Sort Key: created_at
         Sort Method: top-N heapsort  Memory: 25kB
         Buffers: shared hit=1472
         ->  Seq Scan on orders_big (actual rows=200000 loops=1)
               Buffers: shared hit=1472
(8 rows)

                                      QUERY PLAN                                      
--------------------------------------------------------------------------------------
 Limit (actual rows=10 loops=1)
   Buffers: shared hit=12
   ->  Index Scan using orders_big_created_idx on orders_big (actual rows=10 loops=1)
         Buffers: shared hit=12
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Без индекса десять самых ранних заказов требовали прочитать 200 000 строк и отсортировать (`top-N heapsort`): 1472 страницы. С индексом по `created_at` строки идут уже по порядку, `Limit` останавливается после десятой — 12 страниц. Индекс служит не только поиску, но и порядку."),
      h("Глубина B-дерева"),
      code("sql", `CREATE EXTENSION IF NOT EXISTS pageinspect;

-- Уровень корня B-дерева первичного ключа (листья — уровень 0) и размер индекса
SELECT level AS root_level FROM bt_metap('orders_big_pkey');
SELECT relname, relpages AS pages, reltuples::int AS rows
FROM pg_class WHERE relname IN ('orders_big', 'orders_big_pkey') ORDER BY relname;

-- Поиск одной строки по ключу: сколько страниц прочитано
SET max_parallel_workers_per_gather = 0;
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE id = 123456;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE id = 123456;`, { filename: "08-btree-height.pg.sql" }),
      code("text", ` root_level 
------------
          2
(1 row)

     relname     | pages |  rows  
-----------------+-------+--------
 orders_big      |  1472 | 200000
 orders_big_pkey |   551 | 200000
(2 rows)

                               QUERY PLAN                               
------------------------------------------------------------------------
 Index Scan using orders_big_pkey on orders_big (actual rows=1 loops=1)
   Index Cond: (id = 123456)
   Buffers: shared hit=4
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Индекс первичного ключа на 200 000 значений занимает 551 страницу, но корень находится на уровне 2 (листья — уровень 0): поиск проходит корень, внутреннюю страницу и лист — три страницы индекса плюс одна страница таблицы, всего `shared hit=4`. Рост таблицы в 100 раз добавил бы лишь один-два уровня."),
      h("Цена индексов и неиспользуемые индексы"),
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- Каждый индекс занимает место и обновляется при каждой записи
SELECT pg_size_pretty(pg_total_relation_size('orders_big')) AS total_with_pkey_only;

CREATE INDEX i1 ON orders_big (customer_id);
CREATE INDEX i2 ON orders_big (created_at);
CREATE INDEX i3 ON orders_big (status, created_at);
CREATE INDEX i4 ON orders_big (amount);

SELECT pg_size_pretty(pg_total_relation_size('orders_big')) AS total_with_5_indexes,
       pg_size_pretty(pg_relation_size('orders_big'))        AS table_only;

-- Статистика использования: i1 нужен, остальные ни разу не применялись
SELECT count(*) AS queries FROM orders_big WHERE customer_id = 7;
SELECT count(*) AS queries FROM orders_big WHERE customer_id = 8;
\\o /dev/null
SELECT pg_stat_force_next_flush();
\\o
SELECT indexrelname, idx_scan FROM pg_stat_user_indexes WHERE relname = 'orders_big' ORDER BY indexrelname;`, { filename: "09-index-cost.pg.sql" }),
      code("text", ` total_with_pkey_only 
----------------------
 16 MB
(1 row)

 total_with_5_indexes | table_only 
----------------------+------------
 24 MB                | 12 MB
(1 row)

 queries 
---------
      40
(1 row)

 queries 
---------
      40
(1 row)

  indexrelname   | idx_scan 
-----------------+----------
 i1              |        2
 i2              |        0
 i3              |        0
 i4              |        0
 orders_big_pkey |        0
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Таблица с первичным ключом занимала 16 MB; с четырьмя дополнительными индексами — 24 MB.",
        "Статистика `pg_stat_user_indexes`: по `i1` выполнено 2 обращения (два запроса), по остальным — 0. Индексы с `idx_scan = 0` за долгий период наблюдения — кандидаты на удаление: они замедляют каждую запись и ничего не ускоряют.",
        "В реальной системе период наблюдения должен охватывать все регулярные нагрузки (включая месячные отчёты), прежде чем удалять индекс.",
      ),
    ]),

    section("mistakes", [
      h("Ошибка: приведение типа или функция над индексируемым столбцом"),
      wrongRight(
        "sql",
        { title: "Функция над столбцом", code: `SELECT * FROM orders_big WHERE customer_id::text = '42';`, note: "Индекс по `customer_id` не применим: читается вся таблица (замер: 1472 страницы, 199 960 строк отброшено)." },
        { title: "Сравнение без преобразования", code: `SELECT * FROM orders_big WHERE customer_id = 42;`, note: "Тот же результат за 42 страницы. Если преобразование неизбежно — индекс по выражению `((customer_id::text))`." },
      ),
      h("Ошибка: неверный порядок столбцов в составном индексе"),
      p("Индекс `(created_at, customer_id)` вместо `(customer_id, created_at)` не помог бы запросам по клиенту. Ведущие столбцы — те, по которым есть условие равенства во всех нужных запросах."),
      h("Ошибка: индекс по столбцу с малым числом значений"),
      p("Индекс по `status` (4 значения) не нужен: при 60 % строк планировщик его игнорирует, при 10 % — читает почти всю таблицу. Для таких столбцов бывают полезны частичные индексы по редкому значению."),
      h("Ошибка: «индекс на каждый столбец»"),
      p("Пять индексов увеличили объём с 16 до 24 MB, а четыре из них ни разу не использовались. Каждая запись обновляет все индексы. Создавайте индексы под конкретные запросы."),
      h("Ошибка: не проверять план"),
      p("Индекс «должен» использоваться, но планировщик выбрал иное по статистике или из-за выражения. Единственный способ узнать — `EXPLAIN (ANALYZE, BUFFERS)` на реальных данных."),
      h("Ошибка: `CREATE INDEX` без CONCURRENTLY на рабочей таблице"),
      p("Обычный `CREATE INDEX` блокирует запись в таблицу на время построения. На рабочей базе используйте `CREATE INDEX CONCURRENTLY` (дольше, но без остановки записи; при ошибке остаётся «недействительный» индекс, который нужно удалить)."),
    ]),

    section("antipatterns", [
      ul(
        "**Индекс на каждый столбец «на всякий случай».**",
        "**Индекс по низкоселективному столбцу** (булевы, статусы с 3–5 значениями) без частичного условия.",
        "**Функции и приведения типов над индексируемым столбцом** (`lower(email)` при индексе по `email`).",
        "**Дубли индексов:** `(customer_id)` и `(customer_id, created_at)` — первый обычно лишний.",
        "**Индексы, которые никто не проверял на использование** (`idx_scan = 0` месяцами).",
        "**Создание индекса без замера до и после.**",
        "**Блокирующий `CREATE INDEX` на рабочей таблице.**",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Индексируйте под запросы:** сначала медленный запрос и план, затем индекс.",
        "**Внешние ключи** индексируйте почти всегда (соединения и удаление родителей).",
        "**Составные индексы:** равенства — в начало, диапазон/сортировка — после; проверьте, не покрывает ли один индекс несколько запросов.",
        "**Частичные индексы** для стабильных подмножеств, **покрывающие** — для горячих запросов на мало изменяемых данных.",
        "**Измеряйте до и после:** `EXPLAIN (ANALYZE, BUFFERS)` и размер индекса.",
        "**Следите за использованием:** `pg_stat_user_indexes`; неиспользуемые индексы удаляйте после достаточного периода наблюдения.",
        "**На рабочей базе** — `CREATE INDEX CONCURRENTLY`; после массовых загрузок — `ANALYZE`.",
        "**Поддерживайте статистику и очистку:** индексы бесполезны, если статистика неверна.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**`NULL` в B-дереве хранятся** и ищутся через `IS NULL`; порядок `NULLS FIRST/LAST` можно включить в определение индекса.",
        "**Уникальные индексы** считают `NULL` различными значениями: допускают несколько `NULL`.",
        "**Префиксный поиск `LIKE 'abc%'`** использует B-дерево только при подходящей сортировке (класс операторов `text_pattern_ops` или C-collation); `LIKE '%abc'` — нет (нужны триграммы GIN).",
        "**Неявные приведения:** сравнение `integer`-столбца с `numeric` или `text`-параметром может отключить индекс; проверяйте типы параметров запроса.",
        "**Раздутые индексы (bloat):** после массовых изменений индекс разрастается; помогает `REINDEX` (лучше `REINDEX CONCURRENTLY`).",
        "**SQLite:** B-деревья используются так же; `EXPLAIN QUERY PLAN` показывает `SCAN` или `SEARCH … USING INDEX`; `INCLUDE` и `CONCURRENTLY` не поддерживаются.",
      ),
    ]),

    section("related", [
      ul(
        "[Ключи и ограничения](/learn/sql/keys-constraints) — первичные и уникальные ключи реализованы индексами.",
        "[SELECT и WHERE](/learn/sql/select-where) — условия, которые индекс обслуживает.",
        "[ORDER BY, LIMIT и DISTINCT](/learn/sql/order-limit-distinct) — сортировка и топ-N.",
        "[Связи между таблицами](/learn/sql/relationships) — индексы по внешним ключам.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Без индекса",
          code: `SELECT * FROM orders_big WHERE customer_id = 42;`,
          note: "`Seq Scan`: прочитано 1472 страницы и отброшено 199 960 строк ради 40 нужных.",
        },
        {
          title: "С индексом",
          code: `CREATE INDEX orders_big_customer_idx ON orders_big (customer_id);\nSELECT * FROM orders_big WHERE customer_id = 42;`,
          note: "`Bitmap Heap Scan`: 42 страницы (2 индекса + 40 таблицы); цена — 1400 kB места и обновление индекса при записи.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.indexes-btree.ex1",
      title: "Какие запросы подхватят составной индекс",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Есть индекс `(customer_id, created_at)`. Не запуская, определите по каждому из трёх запросов, будет ли он использован и для чего. Затем сверьтесь с планами."),
        code("sql", `SET max_parallel_workers_per_gather = 0;
CREATE INDEX orders_big_cust_date_idx ON orders_big (customer_id, created_at);
ANALYZE orders_big;

-- Какие из запросов смогут использовать составной индекс (customer_id, created_at)?
EXPLAIN (COSTS OFF) SELECT * FROM orders_big WHERE customer_id = 42;
EXPLAIN (COSTS OFF) SELECT * FROM orders_big WHERE created_at = '2024-01-01';
EXPLAIN (COSTS OFF) SELECT * FROM orders_big WHERE customer_id = 42 ORDER BY created_at;`, { filename: "10-ex-predict.pg.sql" }),
      ],
      hints: ["Есть ли в условии ведущий столбец индекса?", "Что остаётся в плане третьего запроса после индекса — сортировка?"],
      checks: ["1: индекс используется (`Bitmap Index Scan`)", "2: `Seq Scan` — нет ведущего столбца", "3: индекс используется для фильтра, `Sort` остаётся (строк мало)"],
      solution: [
        code("text", `                     QUERY PLAN                      
-----------------------------------------------------
 Bitmap Heap Scan on orders_big
   Recheck Cond: (customer_id = 42)
   ->  Bitmap Index Scan on orders_big_cust_date_idx
         Index Cond: (customer_id = 42)
(4 rows)

                 QUERY PLAN                  
---------------------------------------------
 Seq Scan on orders_big
   Filter: (created_at = '2024-01-01'::date)
(2 rows)

                        QUERY PLAN                         
-----------------------------------------------------------
 Sort
   Sort Key: created_at
   ->  Bitmap Heap Scan on orders_big
         Recheck Cond: (customer_id = 42)
         ->  Bitmap Index Scan on orders_big_cust_date_idx
               Index Cond: (customer_id = 42)
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "Первый запрос использует ведущий столбец `customer_id` — `Bitmap Index Scan`.",
          "Второй — только `created_at`, ведущего столбца нет: `Seq Scan`.",
          "Третий: индекс работает для фильтра по клиенту, а сортировка по `created_at` выполняется отдельным узлом `Sort` — клиентских строк всего 40, дешевле отсортировать их, чем идти по индексу.",
        ),
      ],
    }),
    exercise({
      id: "sql.indexes-btree.ex2",
      title: "Индекс есть, а запрос его игнорирует",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Индекс по `customer_id` создан, но запрос ниже читает всю таблицу. Найдите причину и предложите два исправления."),
        code("sql", `SET max_parallel_workers_per_gather = 0;
CREATE INDEX orders_big_customer_idx ON orders_big (customer_id);
ANALYZE orders_big;

-- Индекс по customer_id есть, но запрос читает всю таблицу
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE customer_id::text = '42';`, { filename: "11-ex-fix.pg.sql" }),
        code("text", `                   QUERY PLAN                    
-------------------------------------------------
 Seq Scan on orders_big (actual rows=40 loops=1)
   Filter: ((customer_id)::text = '42'::text)
   Rows Removed by Filter: 199960
   Buffers: shared hit=1472
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ],
      hints: ["Что стоит в левой части условия: столбец или выражение над ним?", "Можно ли изменить запрос или создать индекс под выражение?"],
      checks: ["Причина: `customer_id::text` — приведение типа над столбцом", "Исправления: `customer_id = 42` или индекс по `((customer_id::text))`"],
      solution: [
        code("sql", `SET max_parallel_workers_per_gather = 0;
CREATE INDEX orders_big_customer_idx ON orders_big (customer_id);
ANALYZE orders_big;

-- Вариант 1: сравнивать столбец с числом — приведение типа не нужно
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE customer_id = 42;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE customer_id = 42;

-- Вариант 2: если приведение неизбежно — индекс по выражению
CREATE INDEX orders_big_customer_text_idx ON orders_big ((customer_id::text));
ANALYZE orders_big;
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE customer_id::text = '42';
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE customer_id::text = '42';`, { filename: "12-fix-solution.pg.sql" }),
        code("text", `                                 QUERY PLAN                                  
-----------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big (actual rows=40 loops=1)
   Recheck Cond: (customer_id = 42)
   Heap Blocks: exact=40
   Buffers: shared hit=42
   ->  Bitmap Index Scan on orders_big_customer_idx (actual rows=40 loops=1)
         Index Cond: (customer_id = 42)
         Buffers: shared hit=2
(7 rows)

                                    QUERY PLAN                                    
----------------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big (actual rows=40 loops=1)
   Recheck Cond: ((customer_id)::text = '42'::text)
   Heap Blocks: exact=40
   Buffers: shared hit=42
   ->  Bitmap Index Scan on orders_big_customer_text_idx (actual rows=40 loops=1)
         Index Cond: ((customer_id)::text = '42'::text)
         Buffers: shared hit=2
(7 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Условие `customer_id::text = '42'` сравнивает выражение, а не столбец: обычный индекс по `customer_id` к нему не применим. Первое решение — не приводить тип (`customer_id = 42`); второе — индекс по выражению, который хранит уже приведённые значения. Оба дают 42 страницы вместо 1472."),
      ],
    }),
    exercise({
      id: "sql.indexes-btree.ex3",
      title: "Последние 20 заказов клиента",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Страница «История заказов» показывает 20 последних заказов клиента: `WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20`. Подберите индекс и покажите разницу в прочитанных страницах и узлах плана относительно индекса только по `customer_id`."),
      ],
      hints: ["Какой индекс может отдать строки клиента уже в нужном порядке?", "Что исчезнет из плана, если порядок обеспечивает индекс?"],
      checks: ["Индекс `(customer_id, created_at)`", "План без `Sort`: `Index Scan Backward`", "Меньше страниц, чем при индексе только по `customer_id`"],
      solution: [
        code("sql", `SET max_parallel_workers_per_gather = 0;
-- Последние 20 заказов клиента. Сначала индекс только по customer_id
CREATE INDEX orders_big_customer_idx ON orders_big (customer_id);
ANALYZE orders_big;
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;

-- Составной индекс: фильтр и порядок обслуживает один индекс
DROP INDEX orders_big_customer_idx;
CREATE INDEX orders_big_cust_date_idx ON orders_big (customer_id, created_at);
ANALYZE orders_big;
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;`, { filename: "13-ex-last20.pg.sql", lineNumbers: true }),
        code("text", `                                       QUERY PLAN                                        
-----------------------------------------------------------------------------------------
 Limit (actual rows=20 loops=1)
   Buffers: shared hit=42
   ->  Sort (actual rows=20 loops=1)
         Sort Key: created_at DESC
         Sort Method: quicksort  Memory: 27kB
         Buffers: shared hit=42
         ->  Bitmap Heap Scan on orders_big (actual rows=40 loops=1)
               Recheck Cond: (customer_id = 42)
               Heap Blocks: exact=40
               Buffers: shared hit=42
               ->  Bitmap Index Scan on orders_big_customer_idx (actual rows=40 loops=1)
                     Index Cond: (customer_id = 42)
                     Buffers: shared hit=2
(13 rows)

                                           QUERY PLAN                                            
-------------------------------------------------------------------------------------------------
 Limit (actual rows=20 loops=1)
   Buffers: shared hit=23
   ->  Index Scan Backward using orders_big_cust_date_idx on orders_big (actual rows=20 loops=1)
         Index Cond: (customer_id = 42)
         Buffers: shared hit=23
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("С индексом только по `customer_id` читаются все 40 заказов клиента (42 страницы) и сортируются. Составной индекс `(customer_id, created_at)` отдаёт строки клиента в порядке даты: `Index Scan Backward` читает с конца и останавливается на двадцатой строке — 23 страницы, узла `Sort` нет."),
      ],
    }),
  ],

  challenge: {
    id: "sql.indexes-btree.challenge",
    title: "Два индекса на три запроса",
    scenario: [
      p("Команда аналитики использует три регулярных запроса к `orders_big`: заказы клиента, заказы клиента за период и новые заказы за период. Администратор разрешил добавить не более двух индексов, и нужно доказать планами, что каждый запрос их использует."),
    ],
    requirements: [
      "Q1: `WHERE customer_id = 42`",
      "Q2: `WHERE customer_id = 42 AND created_at >= '2024-06-01'`",
      "Q3: `WHERE status = 'new' AND created_at >= '2024-06-01'`",
      "Не более двух индексов; показать план и число страниц для каждого запроса, размеры индексов",
    ],
    constraints: [
      "Не создавать индекс по `status` целиком (низкая селективность)",
      "Параллельные планы отключены ради стабильности вывода",
    ],
    acceptance: [
      "Q1 и Q2 используют один составной индекс `(customer_id, created_at)` (43 и 15 страниц)",
      "Q3 использует частичный индекс по `created_at` для `status = 'new'` (152 kB)",
    ],
    hints: [
      "Один составной индекс обслуживает запросы по ведущему столбцу и по паре столбцов.",
      "Для редкого значения (`new`, 10 %) подойдёт частичный индекс по `created_at`.",
    ],
    solution: [
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- Три отчётных запроса, не больше двух индексов:
--   Q1: заказы клиента;  Q2: заказы клиента за период;  Q3: новые заказы за период
CREATE INDEX orders_big_cust_date_idx ON orders_big (customer_id, created_at);
CREATE INDEX orders_big_new_idx ON orders_big (created_at) WHERE status = 'new';
ANALYZE orders_big;

\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE customer_id = 42;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE customer_id = 42 AND created_at >= '2024-06-01';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE status = 'new' AND created_at >= '2024-06-01';
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE customer_id = 42;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE customer_id = 42 AND created_at >= '2024-06-01';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE status = 'new' AND created_at >= '2024-06-01';

SELECT pg_size_pretty(pg_relation_size('orders_big_cust_date_idx')) AS composite,
       pg_size_pretty(pg_relation_size('orders_big_new_idx'))       AS partial;`, { filename: "14-challenge.pg.sql", lineNumbers: true }),
      code("text", `                                  QUERY PLAN                                  
------------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big (actual rows=40 loops=1)
   Recheck Cond: (customer_id = 42)
   Heap Blocks: exact=40
   Buffers: shared hit=43
   ->  Bitmap Index Scan on orders_big_cust_date_idx (actual rows=40 loops=1)
         Index Cond: (customer_id = 42)
         Buffers: shared hit=3
(7 rows)

                                   QUERY PLAN                                    
---------------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big (actual rows=12 loops=1)
   Recheck Cond: ((customer_id = 42) AND (created_at >= '2024-06-01'::date))
   Heap Blocks: exact=12
   Buffers: shared hit=15
   ->  Bitmap Index Scan on orders_big_cust_date_idx (actual rows=12 loops=1)
         Index Cond: ((customer_id = 42) AND (created_at >= '2024-06-01'::date))
         Buffers: shared hit=3
(7 rows)

                                   QUERY PLAN                                    
---------------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big (actual rows=6026 loops=1)
   Recheck Cond: ((created_at >= '2024-06-01'::date) AND (status = 'new'::text))
   Heap Blocks: exact=671
   Buffers: shared hit=678
   ->  Bitmap Index Scan on orders_big_new_idx (actual rows=6026 loops=1)
         Index Cond: (created_at >= '2024-06-01'::date)
         Buffers: shared hit=7
(7 rows)

 composite | partial 
-----------+---------
 4408 kB   | 152 kB
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Составной индекс `(customer_id, created_at)` обслужил Q1 (по ведущему столбцу, 43 страницы) и Q2 (по обоим, 15 страниц) — второй индекс по `customer_id` не нужен. Q3 использовал частичный индекс: в нём только 10 % строк, он занимает 152 kB (композитный — 4408 kB). Итого два индекса и три использующих их запроса."),
    ],
  },

  interview: [
    iq("sql.indexes-btree.i1", "basic", "Что такое индекс и зачем он нужен?", [
      ul(
        "Отсортированная вспомогательная структура (в PostgreSQL по умолчанию B-дерево), позволяющая находить строки без чтения всей таблицы.",
        "В замере поиск `customer_id = 42`: 1472 страницы без индекса и 42 с индексом.",
        "Цена: место и замедление записи (каждый `INSERT`/`UPDATE` обновляет индексы).",
      ),
    ]),
    iq("sql.indexes-btree.i2", "basic", "Для каких операций годится B-дерево?", [
      ul(
        "Равенство и диапазоны (`=`, `<`, `>`, `BETWEEN`), `IN`, `IS NULL`.",
        "Сортировка (`ORDER BY`, `ORDER BY … LIMIT`): индекс отдаёт строки по порядку.",
        "Префиксный поиск `LIKE 'abc%'` — при подходящей collation/классе операторов; не подходит для `LIKE '%abc'`.",
      ),
    ]),
    iq("sql.indexes-btree.i3", "intermediate", "Почему составной индекс не помогает, если в условии нет первого столбца?", [
      ul(
        "Значения упорядочены по первому столбцу, внутри — по второму; по второму одному «нет начала» для поиска.",
        "В замере `created_at = …` при индексе `(customer_id, created_at)` дал `Seq Scan` и 1472 страницы.",
        "Правило: ведущие столбцы — те, по которым есть условие равенства.",
      ),
    ]),
    iq("sql.indexes-btree.i4", "intermediate", "Что такое селективность и почему планировщик иногда игнорирует индекс?", [
      ul(
        "Селективность — доля строк, подходящих под условие; чем она меньше, тем выгоднее индекс.",
        "При 60 % подходящих строк планировщик выбрал `Seq Scan`: дешевле прочитать таблицу целиком.",
        "Даже при 10 % индекс может прочитать почти все страницы (1451 из 1472), если строки разбросаны по таблице.",
      ),
    ]),
    iq("sql.indexes-btree.i5", "intermediate", "Что такое покрывающий индекс и Index Only Scan?", [
      ul(
        "Индекс, содержащий все нужные запросу столбцы (в ключе или `INCLUDE`): таблица не читается.",
        "В замере: 4 страницы и `Heap Fetches: 0`.",
        "Работает, когда страницы помечены видимыми (после `VACUUM`); после изменений часть строк проверяется по таблице (80 обращений до `VACUUM`).",
      ),
    ]),
    iq("sql.indexes-btree.i6", "advanced", "Когда полезен частичный индекс?", [
      ul(
        "Когда запросы стабильно касаются подмножества строк (`status = 'new'`, `deleted_at IS NULL`).",
        "Меньше размер (152 kB против 1480 kB), дешевле поддержка, точнее статистика.",
        "Запрос должен содержать условие, из которого следует условие индекса.",
      ),
    ]),
    iq("sql.indexes-btree.i7", "advanced", "Как понять, что индекс не нужен, и как безопасно его удалить?", [
      ul(
        "`pg_stat_user_indexes.idx_scan = 0` за достаточно долгий период, охватывающий все регулярные нагрузки.",
        "Убедиться, что индекс не обеспечивает ограничение (`UNIQUE`, `PRIMARY KEY`) и не нужен редким отчётам.",
        "Удалять `DROP INDEX CONCURRENTLY` и наблюдать за планами; иметь возможность быстро пересоздать.",
      ),
    ]),
    iq("sql.indexes-btree.i8", "engineering", "Запрос по таблице в 100 млн строк стал медленным после роста данных. Как вы подойдёте к ускорению?", [
      ul(
        "`EXPLAIN (ANALYZE, BUFFERS)`: какой метод доступа, сколько страниц и строк, где ошибка оценки.",
        "Проверить статистику (`ANALYZE`) и типы параметров; нет ли функций над столбцами.",
        "Подобрать индекс под условия, сортировку и выбираемые столбцы; рассмотреть частичный/покрывающий.",
        "Создать индекс `CONCURRENTLY`, замерить до и после, проверить влияние на запись и размер.",
        "Если запрос читает слишком много данных по смыслу — менять запрос или модель (предагрегаты, партиционирование).",
      ),
    ]),
  ],

  exam: [
    mcq("sql.indexes-btree.e1", "foundation", "Какой индекс создаётся в PostgreSQL по умолчанию?", ["Hash", "GIN", "B-tree", "BRIN"], 2, "Без указания `USING` создаётся B-дерево: подходит для равенства, диапазонов и сортировки."),
    mcq("sql.indexes-btree.e2", "foundation", "Что показал `Seq Scan` в плане запроса по `customer_id = 42` без индекса?", ["Чтение всей таблицы (1472 страницы) ради 40 строк", "Чтение по индексу", "Чтение только 40 страниц", "Ошибку"], 0, "`Seq Scan` читает всю таблицу и проверяет условие для каждой строки: 199 960 строк было отброшено."),
    mcq("sql.indexes-btree.e3", "foundation", "Что стоит за созданием лишнего индекса?", ["Ничего", "Потеря данных", "Только ускорение", "Место на диске и замедление записи"], 3, "Каждый индекс обновляется при записи и занимает место: пять индексов увеличили объём с 16 до 24 MB."),
    mcq("sql.indexes-btree.e4", "intermediate", "Индекс `(customer_id, created_at)`. Запрос `WHERE created_at = '2024-01-01'` — что в плане?", ["`Index Scan`", "`Seq Scan`", "`Index Only Scan`", "Ошибка"], 1, "Ведущего столбца нет: индекс не помогает, и читается вся таблица (замер: 1472 страницы)."),
    mcq("sql.indexes-btree.e5", "intermediate", "Почему запрос `WHERE customer_id::text = '42'` не использует индекс по `customer_id`?", ["Индекс сломан", "Мало строк", "Нужен `ANALYZE`", "Над столбцом стоит приведение типа — это другое выражение"], 3, "Индекс хранит значения `customer_id`, а запрос ищет `customer_id::text`; решение — убрать приведение или индекс по выражению."),
    mcq("sql.indexes-btree.e6", "intermediate", "Какой план выбрал PostgreSQL для `status = 'paid'` (60 % строк) при индексе по `status`?", ["`Index Scan`", "`Bitmap Heap Scan`", "`Seq Scan`", "`Index Only Scan`"], 2, "При низкой селективности прочитать таблицу целиком дешевле, чем 120 000 раз обращаться к ней по индексу."),
    mcq("sql.indexes-btree.e7", "advanced", "Что такое `Heap Fetches: 0` в `Index Only Scan`?", ["Ошибка", "Строки проверялись в индексе, обращений к таблице не было", "Индекс пуст", "Таблица пуста"], 1, "Страницы помечены видимыми, и данные взяты из индекса; после `UPDATE` в замере было 80 обращений к таблице."),
    open("sql.indexes-btree.e8", "intermediate", "Запрос «заказы клиента за последний месяц, от новых к старым» работает 2 секунды на таблице в 50 млн строк. Какие шаги вы предпримете?", [
      ul(
        "Посмотреть `EXPLAIN (ANALYZE, BUFFERS)`: `Seq Scan`, `Sort`, число страниц и отброшенных строк.",
        "Создать составной индекс `(customer_id, created_at DESC)` (равенство — ведущий столбец, диапазон/порядок — второй), на рабочей базе `CONCURRENTLY`.",
        "Проверить, что план без `Sort` (`Index Scan`) и число страниц упало; сравнить размер индекса и влияние на запись.",
        "При необходимости — покрывающий индекс (`INCLUDE`) для часто выбираемых столбцов.",
        "Проверить статистику (`ANALYZE`) и типы параметров запроса.",
      ),
    ], ["Анализ плана", "Составной индекс под фильтр и порядок", "Проверка результата", "Покрывающий индекс и статистика"], { format: "sql" }),
  ],

  mastery: [
    mcq("sql.indexes-btree.m1", "intermediate", "Сколько страниц прочитал поиск одной строки по первичному ключу в таблице из 200 000 строк?", ["4 (корень, внутренняя, лист + страница таблицы)", "1", "551", "1472"], 0, "Корень B-дерева на уровне 2: три страницы индекса и одна страница таблицы (`shared hit=4`)."),
    mcq("sql.indexes-btree.m2", "advanced", "Почему индекс по `status` при 10 % строк `new` прочитал 1451 страницу из 1472?", ["Индекс повреждён", "Индекс не использовался", "Строки со статусом `new` разбросаны почти по каждой странице таблицы", "Таблица была пустой"], 2, "Индекс помогает найти строки, но не сгруппировать их; если нужные строки есть на каждой странице, читать приходится почти все."),
    mcq("sql.indexes-btree.m3", "advanced", "Что даёт `INCLUDE (amount)` в индексе?", ["Хранение `amount` в листьях для `Index Only Scan` без участия в порядке и поиске", "Участие `amount` в поиске", "Уникальность `amount`", "Сжатие индекса"], 0, "Включаемые столбцы не входят в ключ, но позволяют выдать их без чтения таблицы."),
    open("sql.indexes-btree.m4", "advanced", "В таблице `events` (2 млрд строк) 15 индексов, запись замедлилась. Как вы решите, какие индексы удалять?", [
      ul(
        "Собрать статистику использования: `pg_stat_user_indexes` (`idx_scan`, размер) за период, охватывающий недельные и месячные отчёты.",
        "Найти дубли и префиксные перекрытия (`(a)` и `(a, b)`), индексы по низкоселективным столбцам.",
        "Исключить индексы, обеспечивающие ограничения (`UNIQUE`, `PRIMARY KEY`, внешние ключи).",
        "Удалять по одному `DROP INDEX CONCURRENTLY`, наблюдая за планами и задержками; держать скрипты для быстрого пересоздания.",
        "Оценить выигрыш по записи и размеру до и после.",
      ),
    ], ["Статистика использования", "Дубли и перекрытия", "Индексы ограничений", "Осторожное удаление и замеры"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.indexes-btree.f1", front: "Индекс (B-tree)?", back: "Отсортированное сбалансированное дерево страниц со ссылками на строки: поиск, диапазоны, сортировка. Цена — место и запись." },
    { id: "sql.indexes-btree.f2", front: "Seq Scan или индекс?", back: "Решает селективность: 60 % строк — Seq Scan; малая доля — индекс. Но разброс строк по страницам важен: 10 % могли дать 1451 из 1472 страниц." },
    { id: "sql.indexes-btree.f3", front: "Составной индекс?", back: "Работает для условий по ведущим столбцам: (customer_id, created_at) обслуживает customer_id и пару, но не created_at один." },
    { id: "sql.indexes-btree.f4", front: "Index Only Scan?", back: "Все столбцы запроса в индексе (ключ или INCLUDE), таблица не читается; нужны помеченные видимыми страницы (VACUUM)." },
    { id: "sql.indexes-btree.f5", front: "Частичный индекс?", back: "CREATE INDEX … WHERE условие: только нужные строки; 152 kB против 1480 kB в замере." },
    { id: "sql.indexes-btree.f6", front: "Что отключает индекс?", back: "Функция или приведение типа над столбцом, нет ведущего столбца, низкая селективность, устаревшая статистика." },
    { id: "sql.indexes-btree.f7", front: "ORDER BY … LIMIT?", back: "Индекс отдаёт строки по порядку: 12 страниц вместо 1472 и сортировки." },
    { id: "sql.indexes-btree.f8", front: "Рабочая база?", back: "CREATE INDEX CONCURRENTLY; индексы с idx_scan = 0 за долгий период — кандидаты на удаление." },
  ],

  sources: [
    { title: "PostgreSQL 16: Indexes", url: "https://www.postgresql.org/docs/16/indexes.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Index Types", url: "https://www.postgresql.org/docs/16/indexes-types.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Multicolumn Indexes", url: "https://www.postgresql.org/docs/16/indexes-multicolumn.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Partial Indexes", url: "https://www.postgresql.org/docs/16/indexes-partial.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Index-Only Scans and Covering Indexes", url: "https://www.postgresql.org/docs/16/indexes-index-only-scans.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: CREATE INDEX", url: "https://www.postgresql.org/docs/16/sql-createindex.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: B-Tree Indexes", url: "https://www.postgresql.org/docs/16/btree.html", publisher: "PostgreSQL" },
    { title: "SQLite: The SQLite Query Planner", url: "https://www.sqlite.org/queryplanner.html", publisher: "Other" },
  ],
};
