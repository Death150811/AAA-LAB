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

export const explainPlans: Topic = {
  id: "sql.explain-plans",
  slug: "explain-plans",
  domain: "sql",
  module: "performance",
  title: "Планы запросов: EXPLAIN и EXPLAIN ANALYZE",
  titleEn: "Query Plans: EXPLAIN and EXPLAIN ANALYZE",
  summary:
    "План запроса — дерево операций, которое СУБД выбрала для выполнения, и главный инструмент оптимизации. Тема на замерах PostgreSQL 16.14 (200 000 заказов, 5000 клиентов): стоимость `Seq Scan` складывается из страниц и строк (1472 × 1 + 200 000 × 0,01 = 3472, с условием +500 = 3972), `EXPLAIN` оценивает, а `EXPLAIN ANALYZE` выполняет и показывает факт (в замере `UPDATE` реально изменил данные: 166 360 → 166 400 внутри транзакции), три алгоритма соединения на одних данных (вложенные циклы — 45 страниц для одного клиента; хеш-соединение — 1512; слияние — 230; принудительные вложенные циклы с 5000 проб — 10 041), устаревшая статистика (оценка `rows=1` при фактических 100 000: вложенный цикл с 300 546 страницами вместо хеш-соединения с 554 после `ANALYZE`), сортировка, ушедшая на диск (`external merge Disk: 6864kB`) против памяти (`quicksort Memory: 16926kB`), и индекс по дате, который помог трём запросам по-разному (1472 → 750, 276 и 7 страниц).",
  minutes: 100,
  prerequisites: ["sql.indexes-btree", "sql.inner-left-joins", "sql.group-by-having"],
  tags: ["EXPLAIN", "EXPLAIN ANALYZE", "query plan", "cost", "Seq Scan", "Index Scan", "Bitmap Heap Scan", "Nested Loop", "Hash Join", "Merge Join", "statistics", "ANALYZE", "work_mem", "Buffers", "estimate", "planner"],
  keyConcepts: [
    { term: "План — дерево операций с оценкой стоимости", text: "`Seq Scan on orders_big (cost=0.00..3972.00 rows=… width=22)`: стоимость = 1472 страницы × 1 + 200 000 строк × 0,01 + 200 000 проверок × 0,0025 = 3972 условных единицы." },
    { term: "EXPLAIN оценивает, EXPLAIN ANALYZE выполняет", text: "`EXPLAIN ANALYZE UPDATE` реально изменил данные (сумма 166 360 → 166 400 внутри транзакции): команды с побочными эффектами оборачивайте в `BEGIN … ROLLBACK`." },
    { term: "Ищите расхождение оценки и факта", text: "`rows=1` в плане против `actual rows=100000`: планировщик выбрал вложенные циклы (300 546 страниц), а после `ANALYZE` — хеш-соединение (554 страницы)." },
    { term: "Алгоритм соединения зависит от объёма данных", text: "Один клиент → `Nested Loop` (45 страниц); соединение всех заказов → `Hash Join` (1512), при запрете хеширования — `Merge Join` (230), при запрете и его — 5000 проб индекса (10 041 страница)." },
    { term: "Сортировка может уйти на диск", text: "При `work_mem = 64kB` сортировка 200 000 строк: `external merge Disk: 6864kB`; при 64MB — `quicksort Memory: 16926kB`." },
    { term: "Индекс помогает неодинаково", text: "Индекс по `created_at`: диапазон на 29 % строк — 1472 → 750 страниц, равенство на 274 строки — 276, `ORDER BY … LIMIT 5` — 7." },
  ],
  sections: [
    section("definition", [
      def("План выполнения", "Дерево операций (узлов), по которому СУБД выполняет запрос: способы чтения таблиц, алгоритмы соединения, сортировки, агрегации. Каждый узел получает строки от дочерних и передаёт результат родителю.", "query plan"),
      def("Планировщик (оптимизатор)", "Компонент СУБД, который из множества эквивалентных планов выбирает тот, у которого меньше оценка стоимости, опираясь на статистику по данным.", "query planner"),
      def("Стоимость (cost)", "Условная оценка работы узла в единицах, привязанных к чтению страницы (`seq_page_cost = 1`); показывается как `старт..всего` и определяется параметрами модели и статистикой.", "cost"),
      def("Оценка и факт", "`rows=` — число строк, которое ожидает планировщик; `actual rows=` — сколько строк реально прошло через узел (только в `EXPLAIN ANALYZE`).", "estimated vs actual rows"),
      def("Статистика", "Данные о таблицах и столбцах (число строк, распределение значений, число различных), по которым планировщик оценивает селективность; обновляется `ANALYZE` и автоочисткой.", "planner statistics"),
      def("Buffers", "Счётчики страниц: `shared hit` — найдено в кэше PostgreSQL, `read` — прочитано извне, `dirtied` — изменено; основной показатель работы запроса, не зависящий от нагрузки машины.", "buffer usage"),
      def("Узлы соединения", "Nested Loop (для каждой строки левой стороны искать правую), Hash Join (построить хеш-таблицу меньшей стороны и пробовать ею большую), Merge Join (слить две отсортированные стороны).", "join nodes"),
      def("work_mem", "Параметр: сколько памяти на одну операцию (сортировка, хеш) можно использовать, прежде чем промежуточные данные уйдут на диск.", "work_mem"),
    ]),

    section("why", [
      h("Без плана оптимизация — гадание"),
      p("Запрос «тормозит», и возникает соблазн добавить индекс, поднять `work_mem` или «переписать подзапрос». Но без плана неизвестно, **где** тратится работа: в чтении таблицы, в соединении, в сортировке или в промахе оценки. План даёт ответ и позволяет проверить гипотезу: измерить число страниц и строк до и после изменения."),
      ul(
        "**Диагностика:** какой узел читает больше всего страниц, где оценка сильно расходится с фактом.",
        "**Выбор средства:** индекс, переписывание, `ANALYZE`, увеличение памяти — по виду проблемы, а не наугад.",
        "**Проверка:** сравнить планы и `Buffers` до и после.",
        "**Профилактика:** понимание плана позволяет писать запросы, дружелюбные к планировщику.",
      ),
      note("План зависит от данных и статистики: один и тот же запрос на маленькой и на большой таблице исполняется по-разному. Анализируйте план на данных, сопоставимых с боевыми."),
    ]),

    section("mental-model", [
      h("План — это рецепт, а стоимость — оценка по времени и ресурсам"),
      p("Представьте, что вам нужно подготовить блюдо из многих шагов. Планировщик заранее прикидывает, сколько будет стоить каждый способ (чистить овощи вручную или купить нарезанные), исходя из того, **что он знает о продуктах** (статистика), и выбирает дешёвый рецепт. Если знание устарело («в холодильнике один огурец», а там ящик), рецепт окажется плохим. `EXPLAIN` показывает рецепт и оценки, `EXPLAIN ANALYZE` — и фактически затраченное."),
      diagram(
        `
        HashAggregate            ← 4. группировка по городу
         └─ Hash Join            ← 3. соединение: строки orders пробуют хеш клиентов
             ├─ Seq Scan on orders_big      ← 2а. читаем все заказы (внешняя сторона)
             └─ Hash                         ← 2б. строим хеш-таблицу
                 └─ Seq Scan on customers_big   ← 1. читаем клиентов

        Выполнение идёт «снизу вверх»: самые вложенные узлы дают строки родителям.
        `,
        "План читают от самых вложенных узлов к корню; у соединения первый дочерний узел — внешняя сторона, второй — внутренняя.",
      ),
      h("Как читать план"),
      steps(
        [
          ["Найти самый дорогой узел", "По `Buffers`, `actual rows`, `loops`; в `EXPLAIN ANALYZE` — и по времени."],
          ["Сравнить `rows` и `actual rows`", "Расхождение в разы — признак плохой статистики; от него «поплывёт» весь план."],
          ["Проверить способ чтения", "`Seq Scan` с большим `Rows Removed by Filter` — кандидат на индекс; `Index Scan` с огромным числом `loops` — тоже сигнал."],
          ["Посмотреть соединения и сортировки", "Алгоритм соответствует объёму? Не ушла ли сортировка или хеш на диск?"],
          ["Изменить и сравнить", "Одно изменение за раз, затем снова `EXPLAIN (ANALYZE, BUFFERS)`."],
        ],
        "Разбор плана",
      ),
    ]),

    section("technical", [
      h("Параметры EXPLAIN"),
      table(
        ["Параметр", "Что делает", "Заметка"],
        [
          ["`ANALYZE`", "Выполняет запрос и добавляет фактические значения", "Команды с побочными эффектами выполнятся по-настоящему"],
          ["`BUFFERS`", "Показывает число страниц (`shared hit/read/dirtied`)", "Стабильнее времени; используйте вместе с `ANALYZE`"],
          ["`COSTS OFF`", "Скрывает оценки стоимости и числа строк", "Удобно для сравнения структуры плана"],
          ["`TIMING OFF`", "Отключает замеры времени узлов", "Уменьшает накладные расходы замера"],
          ["`VERBOSE`, `SETTINGS`, `WAL`", "Подробности: столбцы, изменённые настройки, объём журнала", "По необходимости"],
          ["`FORMAT JSON`", "Вывод для инструментов визуализации", "Содержит те же данные"],
        ],
        "Основные параметры EXPLAIN",
      ),
      h("Основные узлы"),
      table(
        ["Узел", "Что делает", "Когда выбирается"],
        [
          ["`Seq Scan`", "Читает всю таблицу", "Нужна большая доля строк, таблица мала или нет подходящего индекса"],
          ["`Index Scan`", "Идёт по индексу и читает строки таблицы", "Мало строк или нужен порядок индекса"],
          ["`Bitmap Index Scan` + `Bitmap Heap Scan`", "Сначала собирает карту страниц, затем читает их по порядку", "Средняя селективность"],
          ["`Index Only Scan`", "Данные берутся из индекса", "Все столбцы запроса есть в индексе"],
          ["`Nested Loop`", "Для каждой строки внешней стороны ищет строки внутренней", "Мало строк снаружи; внутри — индекс"],
          ["`Hash Join`", "Хеш-таблица по одной стороне, проба другой", "Много строк, равенство в условии"],
          ["`Merge Join`", "Слияние двух отсортированных потоков", "Данные уже отсортированы (индексы) или объёмы велики"],
          ["`Sort`, `HashAggregate`, `GroupAggregate`, `Limit`", "Сортировка, группировка, ограничение", "По запросу; зависят от `work_mem`"],
        ],
        "Основные узлы плана PostgreSQL",
      ),
      h("На что смотреть"),
      ul(
        "**`rows` и `actual rows`:** расхождение на порядок и более — повод проверить статистику.",
        "**`loops`:** при `loops > 1` значения `actual rows` — среднее на выполнение (5000 циклов × 40 строк = 200 000).",
        "**`Rows Removed by Filter`:** много отброшенных строк — читаем лишнее.",
        "**`Buffers: shared hit/read`:** сколько страниц прочитано.",
        "**`Sort Method` и `Batches`:** `external merge Disk` или `Batches > 1` — не хватило `work_mem`.",
        "**`Heap Fetches`:** обращения к таблице при `Index Only Scan`.",
      ),
      warn("`EXPLAIN ANALYZE` выполняет запрос по-настоящему. Для `INSERT`, `UPDATE`, `DELETE` оборачивайте в транзакцию и откатывайте: `BEGIN; EXPLAIN ANALYZE …; ROLLBACK;`."),
    ]),

    section("syntax", [
      p("Анатомия вывода: запрос по одному клиенту с соединением. Вывод PostgreSQL ниже снабжён пояснениями по строкам."),
      annotated(
        "text",
        `                                                       QUERY PLAN                                                        
-------------------------------------------------------------------------------------------------------------------------
 Nested Loop  (cost=4.89..154.02 rows=40 width=21) (actual rows=40 loops=1)
   Buffers: shared hit=45
   ->  Index Scan using customers_big_pkey on customers_big c  (cost=0.28..8.30 rows=1 width=21) (actual rows=1 loops=1)
         Index Cond: (id = 42)
         Buffers: shared hit=3
   ->  Bitmap Heap Scan on orders_big o  (cost=4.60..145.32 rows=40 width=8) (actual rows=40 loops=1)
         Recheck Cond: (customer_id = 42)
         Heap Blocks: exact=40
         Buffers: shared hit=42
         ->  Bitmap Index Scan on orders_big_customer_idx  (cost=0.00..4.59 rows=40 width=0) (actual rows=40 loops=1)
               Index Cond: (customer_id = 42)
               Buffers: shared hit=2
(12 rows)`,
        [
          { line: 3, text: "Корень: `Nested Loop`. В скобках: `cost=старт..всего`, `rows` — оценка числа строк, `width` — средняя ширина строки в байтах; во втором блоке — фактическое `actual rows` и `loops`." },
          { line: 4, text: "`Buffers: shared hit=45` — суммарно 45 страниц найдено в кэше для узла и его потомков." },
          { line: [5, 7], text: "Внешняя сторона соединения (первая ветка): поиск клиента по первичному ключу — одна строка, три страницы индекса." },
          { line: [8, 11], text: "Внутренняя сторона: `Bitmap Heap Scan` читает заказы клиента — 40 страниц таблицы (`Heap Blocks: exact=40`), всего 42 с индексом." },
          { line: [12, 14], text: "`Bitmap Index Scan` — дочерний узел: ищет в индексе по `customer_id`, `Index Cond` — условие поиска, 2 страницы индекса." },
          { line: 15, text: "Число строк вывода: строки плана, а не результата запроса." },
        ],
        "08-anatomy.pg.sql (вывод)",
      ),
    ]),

    section("minimal-example", [
      p("Из чего складывается стоимость простого чтения. Параметры модели по умолчанию: страница — 1, строка — 0,01, проверка условия — 0,0025."),
      code("sql", `SET max_parallel_workers_per_gather = 0;

-- Параметры модели стоимости (значения по умолчанию)
SELECT current_setting('seq_page_cost')      AS seq_page_cost,
       current_setting('cpu_tuple_cost')     AS cpu_tuple_cost,
       current_setting('cpu_operator_cost')  AS cpu_operator_cost,
       current_setting('random_page_cost')   AS random_page_cost;

-- Размер таблицы по статистике
SELECT relpages, reltuples::bigint AS reltuples FROM pg_class WHERE relname = 'orders_big';

-- Полное чтение без условия
EXPLAIN SELECT * FROM orders_big;
-- То же с условием: к стоимости добавляется проверка условия для каждой строки
EXPLAIN SELECT * FROM orders_big WHERE amount > 5000;

-- Проверка арифметики: страницы × seq_page_cost + строки × cpu_tuple_cost (+ строки × cpu_operator_cost)
SELECT 1472 * 1 + 200000 * 0.01                  AS cost_without_filter,
       1472 * 1 + 200000 * 0.01 + 200000 * 0.0025 AS cost_with_filter;

-- Индексный доступ: оценка 40 строк по статистике
EXPLAIN SELECT * FROM orders_big WHERE customer_id = 42;`, { filename: "01-costs.pg.sql" }),
      code("text", ` seq_page_cost | cpu_tuple_cost | cpu_operator_cost | random_page_cost 
---------------+----------------+-------------------+------------------
 1             | 0.01           | 0.0025            | 4
(1 row)

 relpages | reltuples 
----------+-----------
     1472 |    200000
(1 row)

                            QUERY PLAN                             
-------------------------------------------------------------------
 Seq Scan on orders_big  (cost=0.00..3472.00 rows=200000 width=22)
(1 row)

                            QUERY PLAN                            
------------------------------------------------------------------
 Seq Scan on orders_big  (cost=0.00..3972.00 rows=90388 width=22)
   Filter: (amount > '5000'::numeric)
(2 rows)

 cost_without_filter | cost_with_filter 
---------------------+------------------
             3472.00 |        3972.0000
(1 row)

                                      QUERY PLAN                                       
---------------------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big  (cost=4.60..145.32 rows=40 width=22)
   Recheck Cond: (customer_id = 42)
   ->  Bitmap Index Scan on orders_big_customer_idx  (cost=0.00..4.59 rows=40 width=0)
         Index Cond: (customer_id = 42)
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Полное чтение: 1472 страницы × 1 + 200 000 строк × 0,01 = 3472 — именно эта цифра в плане `Seq Scan … cost=0.00..3472.00`.",
        "С условием к каждой строке добавляется проверка: +200 000 × 0,0025 = +500 → 3972, как в плане для `amount > 5000`.",
        "Для `customer_id = 42` планировщик по статистике ожидает 40 строк и выбирает `Bitmap Heap Scan`: оценка около 145 условных единиц — в десятки раз дешевле полного чтения (3972).",
        "Точное число оценённых строк для условий вроде `amount > 5000` зависит от случайной выборки при `ANALYZE` и слегка меняется от запуска к запуску.",
      ),
    ]),

    section("detailed-example", [
      h("Оценка и факт: EXPLAIN против EXPLAIN ANALYZE"),
      code("sql", `SET max_parallel_workers_per_gather = 0;

-- EXPLAIN показывает оценку и не выполняет запрос; EXPLAIN ANALYZE выполняет и добавляет фактические значения
EXPLAIN (COSTS OFF)
SELECT * FROM orders_big WHERE amount > 5000;

EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE amount > 5000;

-- Оценка числа строк и факт для нескольких условий
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE amount > 5000;
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE status = 'new';
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE status = 'xyz';`, { filename: "02-estimate-vs-actual.pg.sql" }),
      code("text", `              QUERY PLAN              
--------------------------------------
 Seq Scan on orders_big
   Filter: (amount > '5000'::numeric)
(2 rows)

                     QUERY PLAN                     
----------------------------------------------------
 Seq Scan on orders_big (actual rows=91070 loops=1)
   Filter: (amount > '5000'::numeric)
   Rows Removed by Filter: 108930
(3 rows)

                                          QUERY PLAN                                          
----------------------------------------------------------------------------------------------
 Seq Scan on orders_big  (cost=0.00..3972.00 rows=90415 width=22) (actual rows=91070 loops=1)
   Filter: (amount > '5000'::numeric)
   Rows Removed by Filter: 108930
(3 rows)

                                          QUERY PLAN                                          
----------------------------------------------------------------------------------------------
 Seq Scan on orders_big  (cost=0.00..3972.00 rows=19920 width=22) (actual rows=20000 loops=1)
   Filter: (status = 'new'::text)
   Rows Removed by Filter: 180000
(3 rows)

                                      QUERY PLAN                                      
--------------------------------------------------------------------------------------
 Seq Scan on orders_big  (cost=0.00..3972.00 rows=1 width=22) (actual rows=0 loops=1)
   Filter: (status = 'xyz'::text)
   Rows Removed by Filter: 200000
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Простой `EXPLAIN` запрос не выполняет: фактических строк нет. `EXPLAIN ANALYZE` добавил `actual rows=91070` и `Rows Removed by Filter: 108930` (в сумме 200 000). Оценка для `amount > 5000` — порядка 91 тысяч строк против фактических 91 070; для `status = 'new'` — порядка 20 тысяч против 20 000; для несуществующего значения — 1 против 0. Небольшие расхождения нормальны; настораживают отличия на порядки."),
      h("Три алгоритма соединения"),
      code("sql", `SET max_parallel_workers_per_gather = 0;

-- 1. Выборочный запрос: мало строк слева — вложенные циклы (Nested Loop)
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT o.id, c.name FROM orders_big o JOIN customers_big c ON c.id = o.customer_id WHERE o.customer_id = 42;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT o.id, c.name FROM orders_big o JOIN customers_big c ON c.id = o.customer_id WHERE o.customer_id = 42;

-- 2. Соединяются все строки: хеш-соединение (Hash Join)
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT c.city, count(*) FROM orders_big o JOIN customers_big c ON c.id = o.customer_id GROUP BY c.city;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT c.city, count(*) FROM orders_big o JOIN customers_big c ON c.id = o.customer_id GROUP BY c.city;

-- 3. Тот же запрос, если запретить хеш-соединение: слиянием (Merge Join)
SET enable_hashjoin = off;
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT c.city, count(*) FROM orders_big o JOIN customers_big c ON c.id = o.customer_id GROUP BY c.city;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT c.city, count(*) FROM orders_big o JOIN customers_big c ON c.id = o.customer_id GROUP BY c.city;

-- 4. И без слияния: вложенные циклы — 5000 проб индекса
SET enable_mergejoin = off;
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT c.city, count(*) FROM orders_big o JOIN customers_big c ON c.id = o.customer_id GROUP BY c.city;
\\o
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT c.city, count(*) FROM orders_big o JOIN customers_big c ON c.id = o.customer_id GROUP BY c.city;`, { filename: "03-joins.pg.sql" }),
      code("text", `                                      QUERY PLAN                                      
--------------------------------------------------------------------------------------
 Nested Loop (actual rows=40 loops=1)
   Buffers: shared hit=45
   ->  Index Scan using customers_big_pkey on customers_big c (actual rows=1 loops=1)
         Index Cond: (id = 42)
         Buffers: shared hit=3
   ->  Bitmap Heap Scan on orders_big o (actual rows=40 loops=1)
         Recheck Cond: (customer_id = 42)
         Heap Blocks: exact=40
         Buffers: shared hit=42
         ->  Bitmap Index Scan on orders_big_customer_idx (actual rows=40 loops=1)
               Index Cond: (customer_id = 42)
               Buffers: shared hit=2
(12 rows)

                                QUERY PLAN                                
--------------------------------------------------------------------------
 HashAggregate (actual rows=5 loops=1)
   Group Key: c.city
   Batches: 1  Memory Usage: 24kB
   Buffers: shared hit=1512
   ->  Hash Join (actual rows=200000 loops=1)
         Hash Cond: (o.customer_id = c.id)
         Buffers: shared hit=1512
         ->  Seq Scan on orders_big o (actual rows=200000 loops=1)
               Buffers: shared hit=1472
         ->  Hash (actual rows=5000 loops=1)
               Buckets: 8192  Batches: 1  Memory Usage: 311kB
               Buffers: shared hit=40
               ->  Seq Scan on customers_big c (actual rows=5000 loops=1)
                     Buffers: shared hit=40
(14 rows)

                                               QUERY PLAN                                               
--------------------------------------------------------------------------------------------------------
 HashAggregate (actual rows=5 loops=1)
   Group Key: c.city
   Batches: 1  Memory Usage: 24kB
   Buffers: shared hit=230
   ->  Merge Join (actual rows=200000 loops=1)
         Merge Cond: (o.customer_id = c.id)
         Buffers: shared hit=230
         ->  Index Only Scan using orders_big_customer_idx on orders_big o (actual rows=200000 loops=1)
               Heap Fetches: 0
               Buffers: shared hit=175
         ->  Index Scan using customers_big_pkey on customers_big c (actual rows=5000 loops=1)
               Buffers: shared hit=55
(12 rows)

                                              QUERY PLAN                                               
-------------------------------------------------------------------------------------------------------
 HashAggregate (actual rows=5 loops=1)
   Group Key: c.city
   Batches: 1  Memory Usage: 24kB
   Buffers: shared hit=10041
   ->  Nested Loop (actual rows=200000 loops=1)
         Buffers: shared hit=10041
         ->  Seq Scan on customers_big c (actual rows=5000 loops=1)
               Buffers: shared hit=40
         ->  Index Only Scan using orders_big_customer_idx on orders_big o (actual rows=40 loops=5000)
               Index Cond: (customer_id = c.id)
               Heap Fetches: 0
               Buffers: shared hit=10001
(12 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "**Один клиент** (40 заказов): `Nested Loop` — найти клиента по ключу и заказы по индексу, всего 45 страниц.",
        "**Все заказы:** `Hash Join` — хеш-таблица из 5000 клиентов (311 kB), один проход по таблице заказов: 1512 страниц.",
        "**Хеширование запрещено** (`enable_hashjoin = off`): `Merge Join` по двум индексам, 230 страниц — здесь даже дешевле по страницам (данные берутся из индексов, без чтения таблицы), но планировщик считает полную стоимость, а не только страницы.",
        "**И слияние запрещено:** `Nested Loop` с 5000 пробами индекса (`loops=5000`) — 10 041 страница. Именно такой план получается, когда планировщик ошибается в оценке числа строк.",
        "Параметры `enable_*` служат только для экспериментов: в рабочей системе настраивают статистику и запросы, а не запрещают алгоритмы.",
      ),
    ]),

    section("analysis", [
      table(
        ["Сценарий", "Результат (замер)", "Вывод"],
        [
          ["`Seq Scan` без условия / с условием", "Стоимость 3472 / 3972", "1472 × 1 + 200 000 × 0,01; +500 за проверку условия"],
          ["`EXPLAIN ANALYZE UPDATE`", "Сумма 166 360 → 166 400 внутри транзакции, 166 360 после отката", "`ANALYZE` выполняет команду: нужен `ROLLBACK`"],
          ["Соединение с одним клиентом", "`Nested Loop`, 45 страниц", "Мало строк — вложенные циклы"],
          ["Соединение всех заказов", "`Hash Join`, 1512 страниц", "Много строк — хеш"],
          ["Принудительные вложенные циклы", "`loops=5000`, 10 041 страница", "Плохой выбор при большом числе строк"],
          ["Устаревшая статистика", "Оценка 1, факт 100 000; 300 546 страниц", "Планировщик ошибся из-за неактуальной статистики"],
          ["После `ANALYZE`", "`Hash Join`, 554 страницы", "Верная оценка — верный план"],
          ["Сортировка при `work_mem = 64kB`", "`external merge Disk: 6864kB`", "Не хватило памяти, данные ушли на диск"],
        ],
        "Что показали замеры PostgreSQL 16.14",
      ),
      h("Устаревшая статистика"),
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- Маленькая таблица событий (1000 «кликов») и справочник тегов; статистика собрана
CREATE TABLE tags AS SELECT g AS id, 'tag ' || g AS name FROM generate_series(1, 1000) AS g;
ALTER TABLE tags ADD PRIMARY KEY (id);
CREATE TABLE events (id integer, kind text NOT NULL, tag_id integer NOT NULL);
ALTER TABLE events SET (autovacuum_enabled = false);
INSERT INTO events SELECT g, 'click', 1 + g % 1000 FROM generate_series(1, 1000) AS g;
ANALYZE events;
ANALYZE tags;

-- Загрузили 100 000 ошибок, ANALYZE не выполнен: статистика устарела
INSERT INTO events SELECT 1000 + g, 'error', 1 + (g * 7) % 1000 FROM generate_series(1, 100000) AS g;

\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, SUMMARY OFF) SELECT t.name, count(*) FROM events e JOIN tags t ON t.id = e.tag_id WHERE e.kind = 'error' GROUP BY t.name;
\\o
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, SUMMARY OFF)
SELECT t.name, count(*) FROM events e JOIN tags t ON t.id = e.tag_id WHERE e.kind = 'error' GROUP BY t.name;

-- После ANALYZE планировщик знает о 100 000 «error»
ANALYZE events;
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, SUMMARY OFF) SELECT t.name, count(*) FROM events e JOIN tags t ON t.id = e.tag_id WHERE e.kind = 'error' GROUP BY t.name;
\\o
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, SUMMARY OFF)
SELECT t.name, count(*) FROM events e JOIN tags t ON t.id = e.tag_id WHERE e.kind = 'error' GROUP BY t.name;`, { filename: "04-stale-stats.pg.sql" }),
      code("text", `                                                       QUERY PLAN                                                       
------------------------------------------------------------------------------------------------------------------------
 GroupAggregate  (cost=1691.82..1691.84 rows=1 width=15) (actual rows=1000 loops=1)
   Group Key: t.name
   Buffers: shared hit=300546
   ->  Sort  (cost=1691.82..1691.82 rows=1 width=7) (actual rows=100000 loops=1)
         Sort Key: t.name
         Sort Method: quicksort  Memory: 4021kB
         Buffers: shared hit=300546
         ->  Nested Loop  (cost=0.28..1691.81 rows=1 width=7) (actual rows=100000 loops=1)
               Buffers: shared hit=300546
               ->  Seq Scan on events e  (cost=0.00..1683.50 rows=1 width=4) (actual rows=100000 loops=1)
                     Filter: (kind = 'error'::text)
                     Rows Removed by Filter: 1000
                     Buffers: shared hit=546
               ->  Index Scan using tags_pkey on tags t  (cost=0.28..8.29 rows=1 width=11) (actual rows=1 loops=100000)
                     Index Cond: (id = e.tag_id)
                     Buffers: shared hit=300000
(16 rows)

                                               QUERY PLAN                                                
---------------------------------------------------------------------------------------------------------
 HashAggregate  (cost=2602.82..2612.82 rows=1000 width=15) (actual rows=1000 loops=1)
   Group Key: t.name
   Batches: 1  Memory Usage: 129kB
   Buffers: shared hit=554
   ->  Hash Join  (cost=30.50..2102.68 rows=100027 width=7) (actual rows=100000 loops=1)
         Hash Cond: (e.tag_id = t.id)
         Buffers: shared hit=554
         ->  Seq Scan on events e  (cost=0.00..1808.50 rows=100027 width=4) (actual rows=100000 loops=1)
               Filter: (kind = 'error'::text)
               Rows Removed by Filter: 1000
               Buffers: shared hit=546
         ->  Hash  (cost=18.00..18.00 rows=1000 width=11) (actual rows=1000 loops=1)
               Buckets: 1024  Batches: 1  Memory Usage: 51kB
               Buffers: shared hit=8
               ->  Seq Scan on tags t  (cost=0.00..18.00 rows=1000 width=11) (actual rows=1000 loops=1)
                     Buffers: shared hit=8
(16 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "После загрузки 100 000 «ошибок» статистика всё ещё описывала только 1000 «кликов»: планировщик ожидал `rows=1` для `kind = 'error'`, а фактически строк — 100 000.",
        "Из-за этого он выбрал `Nested Loop` с внутренним `Index Scan` и 100 000 проб (`loops=100000`, 300 546 страниц).",
        "После `ANALYZE` оценка стала около 100 000, план сменился на `Hash Join` и прочитано 554 страницы — в 500 раз меньше.",
        "Автоочистка в рабочих системах обычно обновляет статистику сама; после крупных загрузок `ANALYZE` запускают явно.",
      ),
    ]),

    section("internals", [
      h("Память и диск: work_mem"),
      code("sql", `SET max_parallel_workers_per_gather = 0;

-- Мало памяти для сортировки (work_mem): промежуточные данные уходят на диск
SET work_mem = '64kB';
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big ORDER BY amount;

-- Достаточно памяти: сортировка целиком в оперативной памяти
SET work_mem = '64MB';
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big ORDER BY amount;`, { filename: "05-sort-spill.pg.sql" }),
      code("text", `                        QUERY PLAN                         
-----------------------------------------------------------
 Sort (actual rows=200000 loops=1)
   Sort Key: amount
   Sort Method: external merge  Disk: 6864kB
   ->  Seq Scan on orders_big (actual rows=200000 loops=1)
(4 rows)

                        QUERY PLAN                         
-----------------------------------------------------------
 Sort (actual rows=200000 loops=1)
   Sort Key: amount
   Sort Method: quicksort  Memory: 16926kB
   ->  Seq Scan on orders_big (actual rows=200000 loops=1)
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Сортировка 200 000 строк при `work_mem = 64kB` не поместилась в памяти и использовала внешнюю сортировку на диске (6864 kB); при `64MB` — быстрая `quicksort` в памяти (16 926 kB). Увеличивать `work_mem` глобально опасно: параметр действует на **каждую** операцию каждого сеанса, и при множестве параллельных запросов память исчерпается. Лучше повышать его для конкретной транзакции (`SET LOCAL work_mem`) или создать индекс, который избавит от сортировки."),
      h("EXPLAIN ANALYZE для изменяющих команд"),
      code("sql", `SET max_parallel_workers_per_gather = 0;

-- EXPLAIN ANALYZE выполняет команду по-настоящему: изменения откатываем
SELECT sum(amount) AS total_before FROM orders_big WHERE customer_id = 42;
BEGIN;
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF)
UPDATE orders_big SET amount = amount + 1 WHERE customer_id = 42;
SELECT sum(amount) AS total_inside FROM orders_big WHERE customer_id = 42;
ROLLBACK;
SELECT sum(amount) AS total_after FROM orders_big WHERE customer_id = 42;`, { filename: "06-explain-dml.pg.sql" }),
      code("text", ` total_before 
--------------
    166360.00
(1 row)

                                    QUERY PLAN                                     
-----------------------------------------------------------------------------------
 Update on orders_big (actual rows=0 loops=1)
   ->  Bitmap Heap Scan on orders_big (actual rows=40 loops=1)
         Recheck Cond: (customer_id = 42)
         Heap Blocks: exact=40
         ->  Bitmap Index Scan on orders_big_customer_idx (actual rows=40 loops=1)
               Index Cond: (customer_id = 42)
(6 rows)

 total_inside 
--------------
    166400.00
(1 row)

 total_after 
-------------
   166360.00
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Внутри транзакции после `EXPLAIN ANALYZE UPDATE` сумма заказов клиента 42 выросла на 40 (по 1 на каждый из 40 заказов) — команда выполнилась. После `ROLLBACK` вернулась прежняя сумма. В плане корень — `Update on orders_big`, а чтение строк — дочерний узел."),
      h("Как планировщик оценивает селективность"),
      p("Статистика хранится в `pg_class` (число страниц и строк) и `pg_stats` (для каждого столбца — доля `NULL`, число различных значений, частые значения и гистограмма границ). Оценка числа строк = число строк в таблице × селективность условия. `ANALYZE` собирает статистику по случайной выборке строк (до 30 000 при настройке по умолчанию), поэтому оценки на больших таблицах слегка отличаются от запуска к запуску. Для коррелированных столбцов и выражений планировщик ошибается чаще: в таких случаях помогает расширенная статистика (`CREATE STATISTICS`)."),
    ]),

    section("mistakes", [
      h("Ошибка: смотреть только на время"),
      p("Время запроса зависит от загрузки машины и кэша. Для сравнения вариантов надёжнее счётчики `Buffers` и `actual rows`: они воспроизводимы (в замерах — одни и те же числа от запуска к запуску)."),
      h("Ошибка: запускать EXPLAIN ANALYZE для UPDATE/DELETE на рабочих данных"),
      wrongRight(
        "sql",
        { title: "Выполнится по-настоящему", code: `EXPLAIN ANALYZE UPDATE orders_big SET amount = amount + 1 WHERE customer_id = 42;`, note: "Изменения применены (в замере сумма выросла на 40) и зафиксированы автокоммитом." },
        { title: "В транзакции с откатом", code: `BEGIN;\nEXPLAIN ANALYZE UPDATE orders_big SET amount = amount + 1 WHERE customer_id = 42;\nROLLBACK;`, note: "Получаем план и факт, данные остаются прежними." },
      ),
      h("Ошибка: игнорировать расхождение оценки и факта"),
      p("`rows=1` против `actual rows=100000` — главный признак того, что план построен на ложных данных. Исправление — обновить статистику (`ANALYZE`), а не переписывать запрос."),
      h("Ошибка: «чинить» план параметрами enable_*"),
      p("`SET enable_hashjoin = off` полезен в эксперименте, но в рабочем коде он скрывает причину (плохая статистика, отсутствие индекса) и ломает планы других запросов."),
      h("Ошибка: анализировать план на пустой или маленькой таблице"),
      p("На маленькой таблице планировщик верно выберет `Seq Scan`, а на боевой — совсем другое. Проверяйте на данных, сопоставимых по объёму и распределению."),
      h("Ошибка: поднимать work_mem глобально"),
      p("Параметр действует на каждую операцию каждого сеанса. Повышайте его точечно (`SET LOCAL`) или устраняйте причину большой сортировки (индекс, выборка меньшего числа строк)."),
    ]),

    section("antipatterns", [
      ul(
        "**Оптимизация «по ощущениям»** без `EXPLAIN (ANALYZE, BUFFERS)`.",
        "**Индекс на каждый медленный запрос** без проверки, что он изменит план.",
        "**Отключение алгоритмов (`enable_*`) в рабочей конфигурации.**",
        "**Редкий или отключённый `ANALYZE`** после крупных загрузок и изменений распределения.",
        "**Подсказки как постоянное решение:** план должен исправляться статистикой и схемой.",
        "**Сравнение планов на несопоставимых данных.**",
        "**`EXPLAIN ANALYZE` для изменяющих команд без транзакции.**",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Всегда начинайте с `EXPLAIN (ANALYZE, BUFFERS)`** на данных, похожих на боевые.",
        "**Сравнивайте оценки и факт:** расхождение на порядок — повод обновить статистику.",
        "**Опирайтесь на `Buffers` и число строк,** а не на время одного запуска.",
        "**Меняйте одну вещь за раз** (индекс, переписывание, `ANALYZE`) и повторяйте замер.",
        "**Изменяющие команды анализируйте внутри `BEGIN … ROLLBACK`.**",
        "**После крупных загрузок** выполняйте `ANALYZE`; для коррелированных столбцов — `CREATE STATISTICS`.",
        "**Настраивайте `work_mem` точечно** (`SET LOCAL`), следите за `Sort Method` и `Batches`.",
        "**Включите `auto_explain` и `pg_stat_statements`** в рабочей системе, чтобы находить дорогие запросы и сохранять их планы.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Параллельные планы:** узлы `Gather` и рабочие процессы меняют вывод и число страниц; в замерах параллельность отключена (`max_parallel_workers_per_gather = 0`) ради стабильности.",
        "**Подготовленные запросы:** универсальный и индивидуальный планы могут отличаться; `plan_cache_mode` управляет выбором.",
        "**Кэш:** первый запуск читает страницы с диска (`read`), повторные — из кэша (`hit`); для сравнения запускайте запрос дважды.",
        "**Время узлов:** `TIMING` добавляет накладные расходы; `TIMING OFF` делает замер дешевле.",
        "**Оценка при `loops > 1`:** фактическое число строк и время — среднее на цикл.",
        "**SQLite:** `EXPLAIN QUERY PLAN` показывает `SCAN` или `SEARCH … USING INDEX`; стоимости и `Buffers` нет.",
      ),
    ]),

    section("related", [
      ul(
        "[Индексы и B-дерево](/learn/sql/indexes-btree) — как индексы меняют планы и число страниц.",
        "[INNER и LEFT JOIN](/learn/sql/inner-left-joins) — запросы, которые планировщик превращает в соединения.",
        "[GROUP BY и HAVING](/learn/sql/group-by-having) — узлы `HashAggregate` и `GroupAggregate`.",
        "[Уровни изоляции](/learn/sql/isolation-levels) — почему долгие транзакции мешают очистке и статистике.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Статистика устарела",
          code: `-- после загрузки 100 000 строк ANALYZE не выполнялся\nEXPLAIN ANALYZE SELECT … WHERE e.kind = 'error' …;`,
          note: "`rows=1` при факте 100 000: `Nested Loop` с 100 000 пробами индекса, 300 546 страниц.",
        },
        {
          title: "После ANALYZE",
          code: `ANALYZE events;\nEXPLAIN ANALYZE SELECT … WHERE e.kind = 'error' …;`,
          note: "Оценка около 100 000: `Hash Join`, 554 страницы — в 500 с лишним раз меньше работы.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.explain-plans.ex1",
      title: "Прочитайте план",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Ниже — план запроса «заказы клиента 42 с его именем». Ответьте: какой алгоритм соединения выбран, какая сторона внешняя, сколько страниц прочитано всего и сколько приходится на таблицу заказов, по какому условию ищется в индексе."),
        code("text", `                                                       QUERY PLAN                                                        
-------------------------------------------------------------------------------------------------------------------------
 Nested Loop  (cost=4.89..154.02 rows=40 width=21) (actual rows=40 loops=1)
   Buffers: shared hit=45
   ->  Index Scan using customers_big_pkey on customers_big c  (cost=0.28..8.30 rows=1 width=21) (actual rows=1 loops=1)
         Index Cond: (id = 42)
         Buffers: shared hit=3
   ->  Bitmap Heap Scan on orders_big o  (cost=4.60..145.32 rows=40 width=8) (actual rows=40 loops=1)
         Recheck Cond: (customer_id = 42)
         Heap Blocks: exact=40
         Buffers: shared hit=42
         ->  Bitmap Index Scan on orders_big_customer_idx  (cost=0.00..4.59 rows=40 width=0) (actual rows=40 loops=1)
               Index Cond: (customer_id = 42)
               Buffers: shared hit=2
(12 rows)`, { filename: "план запроса (PostgreSQL 16.14)" }),
      ],
      hints: ["Какая ветка у `Nested Loop` первая и что она делает?", "Куда относятся `Buffers` каждого узла: только узла или вместе с потомками?"],
      checks: ["`Nested Loop`; внешняя сторона — `customers_big` (1 строка по ключу)", "Всего 45 страниц, из них 42 — для таблицы заказов (2 индекса + 40 таблицы)", "Условие индекса `customer_id = 42`"],
      solution: [
        ul(
          "Выбран `Nested Loop`: для единственной строки клиента (поиск по первичному ключу, 3 страницы) ищутся его заказы.",
          "Внутренняя сторона — `Bitmap Heap Scan` по заказам: `Bitmap Index Scan` по `orders_big_customer_idx` (`customer_id = 42`, 2 страницы) и 40 страниц таблицы — 42.",
          "Всего `shared hit=45` на корне: 3 + 42 (счётчики вложенных узлов суммируются в родителе).",
        ),
      ],
    }),
    exercise({
      id: "sql.explain-plans.ex2",
      title: "Отчёт по ошибкам вдруг замедлился",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("После ночной загрузки 100 000 событий-ошибок отчёт «ошибки по тегам» стал работать в разы дольше. Ниже — первый план после загрузки. Найдите причину и исправьте."),
        code("text", `                                                       QUERY PLAN                                                       
------------------------------------------------------------------------------------------------------------------------
 GroupAggregate  (cost=1691.82..1691.84 rows=1 width=15) (actual rows=1000 loops=1)
   Group Key: t.name
   Buffers: shared hit=300546
   ->  Sort  (cost=1691.82..1691.82 rows=1 width=7) (actual rows=100000 loops=1)
         Sort Key: t.name
         Sort Method: quicksort  Memory: 4021kB
         Buffers: shared hit=300546
         ->  Nested Loop  (cost=0.28..1691.81 rows=1 width=7) (actual rows=100000 loops=1)
               Buffers: shared hit=300546
               ->  Seq Scan on events e  (cost=0.00..1683.50 rows=1 width=4) (actual rows=100000 loops=1)
                     Filter: (kind = 'error'::text)
                     Rows Removed by Filter: 1000
                     Buffers: shared hit=546
               ->  Index Scan using tags_pkey on tags t  (cost=0.28..8.29 rows=1 width=11) (actual rows=1 loops=100000)
                     Index Cond: (id = e.tag_id)
                     Buffers: shared hit=300000
(16 rows)

                                               QUERY PLAN                                                
---------------------------------------------------------------------------------------------------------
 HashAggregate  (cost=2602.69..2612.69 rows=1000 width=15) (actual rows=1000 loops=1)
   Group Key: t.name
   Batches: 1  Memory Usage: 129kB
   Buffers: shared hit=554
   ->  Hash Join  (cost=30.50..2102.64 rows=100010 width=7) (actual rows=100000 loops=1)
         Hash Cond: (e.tag_id = t.id)
         Buffers: shared hit=554
         ->  Seq Scan on events e  (cost=0.00..1808.50 rows=100010 width=4) (actual rows=100000 loops=1)
               Filter: (kind = 'error'::text)
               Rows Removed by Filter: 1000
               Buffers: shared hit=546
         ->  Hash  (cost=18.00..18.00 rows=1000 width=11) (actual rows=1000 loops=1)
               Buckets: 1024  Batches: 1  Memory Usage: 51kB
               Buffers: shared hit=8
               ->  Seq Scan on tags t  (cost=0.00..18.00 rows=1000 width=11) (actual rows=1000 loops=1)
                     Buffers: shared hit=8
(16 rows)`, { filename: "планы до и после ANALYZE (PostgreSQL 16.14)" }),
      ],
      hints: ["Сравните `rows` и `actual rows` у `Seq Scan on events`.", "Что планировщик знает о таблице к моменту выбора плана?"],
      checks: ["Оценка `rows=1`, факт 100 000 — статистика устарела", "Исправление: `ANALYZE events`; план сменится на `Hash Join` (554 страницы вместо 300 546)"],
      solution: [
        p("Расхождение `rows=1` против `actual rows=100000` показывает, что статистика не знает о загруженных строках. Поэтому планировщик выбрал `Nested Loop` с проб индекса на каждую из 100 000 строк. `ANALYZE events` обновил статистику, и план сменился на `Hash Join` с одним проходом по таблицам: 554 страницы вместо 300 546. Профилактика: `ANALYZE` после крупных загрузок и настроенная автоочистка."),
      ],
    }),
    exercise({
      id: "sql.explain-plans.ex3",
      title: "Сортировка ушла на диск",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Запрос `SELECT * FROM orders_big ORDER BY amount` сортирует 200 000 строк и использует диск. Объясните, как это видно в плане, и предложите два способа избежать диска — с оговорками."),
        code("text", `                        QUERY PLAN                         
-----------------------------------------------------------
 Sort (actual rows=200000 loops=1)
   Sort Key: amount
   Sort Method: external merge  Disk: 6864kB
   ->  Seq Scan on orders_big (actual rows=200000 loops=1)
(4 rows)

                        QUERY PLAN                         
-----------------------------------------------------------
 Sort (actual rows=200000 loops=1)
   Sort Key: amount
   Sort Method: quicksort  Memory: 16926kB
   ->  Seq Scan on orders_big (actual rows=200000 loops=1)
(4 rows)`, { filename: "сортировка при разных work_mem (PostgreSQL 16.14)" }),
      ],
      hints: ["Что показывает строка `Sort Method`?", "Какие ещё способы получить порядок, кроме большой памяти?"],
      checks: ["`Sort Method: external merge Disk: 6864kB` — сортировка на диске", "Решения: `SET LOCAL work_mem`, индекс по `amount` (порядок без сортировки), `LIMIT`"],
      solution: [
        ul(
          "В плане: `Sort Method: external merge  Disk: 6864kB` — данные не поместились в `work_mem`; при достаточной памяти метод `quicksort` и `Memory: 16926kB`.",
          "Способ 1: поднять `work_mem` для транзакции (`SET LOCAL work_mem = '32MB'`), не глобально — параметр действует на каждую операцию каждого сеанса.",
          "Способ 2: индекс по `amount`, который отдаёт строки уже по порядку (для запросов с `LIMIT` — особенно выгодно); либо выбирать меньше строк и столбцов.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "sql.explain-plans.challenge",
    title: "Поможет ли индекс по дате?",
    scenario: [
      p("Для трёх запросов к `orders_big` предложили один и тот же индекс по `created_at`. Нужно проверить планами, какому запросу он реально поможет и насколько, чтобы не создавать лишний индекс «на веру»."),
    ],
    requirements: [
      "Q-A: `WHERE created_at >= '2024-06-01'` (около 29 % строк)",
      "Q-B: `WHERE created_at = '2024-06-01'` (несколько сотен строк)",
      "Q-C: `ORDER BY created_at DESC LIMIT 5`",
      "Для каждого — план и число прочитанных страниц до и после индекса",
    ],
    constraints: [
      "Один индекс `(created_at)`; перед замером после индекса выполнить `ANALYZE`",
      "Параллельные планы отключены ради стабильности вывода",
    ],
    acceptance: [
      "Q-A: 1472 → 750 страниц; Q-B: 1472 → 276; Q-C: 1472 → 7",
      "У Q-C исчезает узел `Sort` (`Index Scan Backward`)",
    ],
    hints: [
      "Сравнивайте `Buffers: shared hit` в корне плана до и после `CREATE INDEX`.",
      "Для Q-C смотрите на узлы: был `Sort` над `Seq Scan`, стал `Limit` над `Index Scan Backward`.",
    ],
    solution: [
      code("sql", `SET max_parallel_workers_per_gather = 0;
-- Три запроса к orders_big по дате. Поможет ли индекс по created_at каждому?
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE created_at >= '2024-06-01';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE created_at = '2024-06-01';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big ORDER BY created_at DESC LIMIT 5;
\\o
\\echo '--- A: диапазон (около 30 % строк), без индекса'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE created_at >= '2024-06-01';
\\echo '--- B: равенство (несколько сотен строк), без индекса'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE created_at = '2024-06-01';
\\echo '--- C: пять последних заказов, без индекса'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big ORDER BY created_at DESC LIMIT 5;

CREATE INDEX orders_big_created_idx ON orders_big (created_at);
ANALYZE orders_big;
\\o /dev/null
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE created_at >= '2024-06-01';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big WHERE created_at = '2024-06-01';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) SELECT * FROM orders_big ORDER BY created_at DESC LIMIT 5;
\\o
\\echo '--- A: после создания индекса'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE created_at >= '2024-06-01';
\\echo '--- B: после создания индекса'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big WHERE created_at = '2024-06-01';
\\echo '--- C: после создания индекса'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders_big ORDER BY created_at DESC LIMIT 5;`, { filename: "07-challenge.pg.sql", lineNumbers: true }),
      code("text", `--- A: диапазон (около 30 % строк), без индекса
                     QUERY PLAN                     
----------------------------------------------------
 Seq Scan on orders_big (actual rows=58343 loops=1)
   Filter: (created_at >= '2024-06-01'::date)
   Rows Removed by Filter: 141657
   Buffers: shared hit=1472
(4 rows)

--- B: равенство (несколько сотен строк), без индекса
                    QUERY PLAN                    
--------------------------------------------------
 Seq Scan on orders_big (actual rows=274 loops=1)
   Filter: (created_at = '2024-06-01'::date)
   Rows Removed by Filter: 199726
   Buffers: shared hit=1472
(4 rows)

--- C: пять последних заказов, без индекса
                           QUERY PLAN                            
-----------------------------------------------------------------
 Limit (actual rows=5 loops=1)
   Buffers: shared hit=1472
   ->  Sort (actual rows=5 loops=1)
         Sort Key: created_at DESC
         Sort Method: top-N heapsort  Memory: 25kB
         Buffers: shared hit=1472
         ->  Seq Scan on orders_big (actual rows=200000 loops=1)
               Buffers: shared hit=1472
(8 rows)

--- A: после создания индекса
                                  QUERY PLAN                                   
-------------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big (actual rows=58343 loops=1)
   Recheck Cond: (created_at >= '2024-06-01'::date)
   Heap Blocks: exact=695
   Buffers: shared hit=750
   ->  Bitmap Index Scan on orders_big_created_idx (actual rows=58343 loops=1)
         Index Cond: (created_at >= '2024-06-01'::date)
         Buffers: shared hit=55
(7 rows)

--- B: после создания индекса
                                 QUERY PLAN                                  
-----------------------------------------------------------------------------
 Bitmap Heap Scan on orders_big (actual rows=274 loops=1)
   Recheck Cond: (created_at = '2024-06-01'::date)
   Heap Blocks: exact=274
   Buffers: shared hit=276
   ->  Bitmap Index Scan on orders_big_created_idx (actual rows=274 loops=1)
         Index Cond: (created_at = '2024-06-01'::date)
         Buffers: shared hit=2
(7 rows)

--- C: после создания индекса
                                          QUERY PLAN                                          
----------------------------------------------------------------------------------------------
 Limit (actual rows=5 loops=1)
   Buffers: shared hit=7
   ->  Index Scan Backward using orders_big_created_idx on orders_big (actual rows=5 loops=1)
         Buffers: shared hit=7
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Индекс помог всем трём, но по-разному: диапазон на 29 % строк — примерно вдвое (750 из 1472 страниц, потому что даты в данных сгруппированы по страницам), равенство на 274 строки — в 5 раз (276 страниц), а `ORDER BY … LIMIT 5` — в 200 раз (7 страниц, сортировка исчезла). Вывод: индекс подбирают под конкретный запрос и проверяют планом; ожидаемый выигрыш зависит от доли строк и их расположения в таблице."),
    ],
  },

  interview: [
    iq("sql.explain-plans.i1", "basic", "Чем EXPLAIN отличается от EXPLAIN ANALYZE?", [
      ul(
        "`EXPLAIN` показывает план и оценки, запрос не выполняет.",
        "`EXPLAIN ANALYZE` выполняет запрос и добавляет фактические строки, циклы и (с `BUFFERS`) число страниц.",
        "Для `UPDATE`/`DELETE` `ANALYZE` изменяет данные (в замере сумма выросла на 40) — оборачивайте в `BEGIN … ROLLBACK`.",
      ),
    ]),
    iq("sql.explain-plans.i2", "basic", "Что означают cost, rows и actual rows в плане?", [
      ul(
        "`cost=старт..всего` — условная оценка работы; `rows` — ожидаемое число строк.",
        "`actual rows` — фактическое число строк (при `loops > 1` — среднее на цикл).",
        "Стоимость `Seq Scan` складывается из страниц и строк: 1472 × 1 + 200 000 × 0,01 = 3472.",
      ),
    ]),
    iq("sql.explain-plans.i3", "intermediate", "Какие алгоритмы соединения есть и когда выбирается каждый?", [
      ul(
        "`Nested Loop` — мало строк снаружи и индекс внутри (один клиент: 45 страниц).",
        "`Hash Join` — много строк и условие равенства (все заказы: 1512 страниц).",
        "`Merge Join` — обе стороны отсортированы (индексы) или очень велики (230 страниц в замере при запрещённом хешировании).",
      ),
    ]),
    iq("sql.explain-plans.i4", "intermediate", "Что делать, если оценка rows сильно расходится с actual rows?", [
      ul(
        "Проверить статистику: `ANALYZE` после крупных изменений (замер: `rows=1` против 100 000 — после `ANALYZE` план сменился и страниц стало в 500 раз меньше).",
        "Для коррелированных столбцов и выражений — расширенная статистика `CREATE STATISTICS`.",
        "Повысить `default_statistics_target` для столбцов с неравномерным распределением.",
      ),
    ]),
    iq("sql.explain-plans.i5", "intermediate", "Что значит `Sort Method: external merge Disk` и как это исправить?", [
      ul(
        "Сортировка не поместилась в `work_mem`, часть данных ушла на диск (замер: 6864 kB при 64 kB памяти).",
        "Исправления: `SET LOCAL work_mem` для запроса, индекс, избавляющий от сортировки, выбор меньшего числа строк и столбцов.",
        "Глобальное увеличение `work_mem` рискованно: параметр действует на каждую операцию каждого сеанса.",
      ),
    ]),
    iq("sql.explain-plans.i6", "advanced", "Почему loops > 1 влияет на чтение плана?", [
      ul(
        "Внутренняя сторона `Nested Loop` выполняется для каждой внешней строки: `loops=5000`.",
        "Значения `actual rows` и время показываются на одно выполнение: 5000 × 40 = 200 000 строк.",
        "Итоговая работа = значение × `loops`; поэтому «дешёвый» узел с огромным `loops` может быть самым дорогим (10 041 страница).",
      ),
    ]),
    iq("sql.explain-plans.i7", "advanced", "Как безопасно получить план для DELETE на рабочей базе?", [
      ul(
        "Простой `EXPLAIN` (без `ANALYZE`): оценка без выполнения.",
        "Для фактических значений — `BEGIN; EXPLAIN (ANALYZE, BUFFERS) DELETE …; ROLLBACK;` и учесть блокировки и нагрузку.",
        "На копии данных или реплике для тяжёлых команд.",
      ),
    ]),
    iq("sql.explain-plans.i8", "engineering", "Как построить процесс поиска и разбора медленных запросов в продакшене?", [
      ul(
        "Собирать статистику запросов (`pg_stat_statements`): суммарное время, число вызовов, строки.",
        "Включить `auto_explain` для запросов дольше порога и сохранять планы.",
        "Разбирать топ по суммарному времени: план, расхождение оценок, `Buffers`, узлы `Seq Scan`/`Sort`.",
        "Исправлять по причине (статистика, индекс, запрос, память), проверять `EXPLAIN (ANALYZE, BUFFERS)` на копии данных.",
        "Фиксировать результат: до/после по страницам и времени; следить за регрессиями после релизов.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.explain-plans.e1", "foundation", "Что делает `EXPLAIN` без `ANALYZE`?", ["Выполняет запрос и показывает время", "Удаляет план из кэша", "Показывает выбранный план и оценки, не выполняя запрос", "Создаёт индекс"], 2, "`EXPLAIN` только строит план по статистике: фактических значений в нём нет."),
    mcq("sql.explain-plans.e2", "foundation", "Что показывает `Buffers: shared hit=1472` у `Seq Scan`?", ["Число страниц, найденных в кэше: прочитана вся таблица", "Размер результата", "Число индексов", "Объём памяти сортировки"], 0, "1472 страницы — это размер таблицы: последовательное чтение прошло по каждой."),
    mcq("sql.explain-plans.e3", "foundation", "Что нужно сделать, если анализируется `UPDATE` через `EXPLAIN ANALYZE`?", ["Ничего", "Отключить кэш", "Добавить индекс", "Выполнить в транзакции и откатить, иначе изменения останутся"], 3, "`ANALYZE` выполняет команду по-настоящему (в замере сумма выросла на 40)."),
    mcq("sql.explain-plans.e4", "intermediate", "План: `rows=1` при `actual rows=100000`. Какой первый шаг?", ["Добавить индекс", "Выполнить `ANALYZE` — статистика устарела", "Увеличить `work_mem`", "Переписать запрос на подзапрос"], 1, "Расхождение на пять порядков — признак устаревшей статистики; после `ANALYZE` план сменился на `Hash Join` и страниц стало 554 вместо 300 546."),
    mcq("sql.explain-plans.e5", "intermediate", "Какой узел соединения выбирается для одного клиента (40 заказов) с индексом по ключам?", ["`Hash Join`", "`Seq Scan`", "`Merge Join`", "`Nested Loop`"], 3, "Мало строк снаружи и индекс внутри: поиск по ключу даёт 45 страниц."),
    mcq("sql.explain-plans.e6", "intermediate", "Что означает `Sort Method: external merge Disk: 6864kB`?", ["Сортировка прошла в памяти", "Индекс отсортирован", "Сортировке не хватило `work_mem`, данные использовали диск", "Ошибка"], 2, "Внешняя сортировка применяется при нехватке памяти; при 64MB — `quicksort` в памяти."),
    mcq("sql.explain-plans.e7", "advanced", "Узел `Index Scan … (actual rows=40 loops=5000)`. Сколько строк он суммарно выдал?", ["40", "200 000", "5000", "45 000"], 1, "При `loops > 1` значения даны на одно выполнение: 5000 × 40 = 200 000 строк (замер: 10 041 страница)."),
    open("sql.explain-plans.e8", "intermediate", "Отчёт неожиданно стал в 10 раз медленнее после релиза. Опишите, как вы будете разбираться с помощью планов.", [
      ul(
        "Получить план и факт: `EXPLAIN (ANALYZE, BUFFERS)` на данных, близких к боевым; сравнить с планом до релиза (`auto_explain` или сохранённый).",
        "Найти самый дорогой узел по `Buffers`, `loops` и `actual rows`; сравнить `rows` и `actual rows`.",
        "Определить причину: устаревшая статистика (`ANALYZE`), потерянный индекс или функция над столбцом, сменившийся алгоритм соединения, сортировка на диске.",
        "Исправить причину и повторить замер: число страниц до и после.",
        "Закрепить: тест регрессии планов или мониторинг `pg_stat_statements`.",
      ),
    ], ["Получение и сравнение планов", "Поиск дорогого узла и расхождения оценок", "Классификация причины", "Проверка и профилактика"], { format: "sql" }),
  ],

  mastery: [
    mcq("sql.explain-plans.m1", "intermediate", "Почему стоимость `Seq Scan` по `orders_big` без условия равна 3472?", ["1472 страницы × 1 + 200 000 строк × 0,01", "Случайное число", "200 000 / 1472", "Размер таблицы в килобайтах"], 0, "`seq_page_cost` = 1 за страницу и `cpu_tuple_cost` = 0,01 за строку: 1472 + 2000 = 3472; условие добавляет 500."),
    mcq("sql.explain-plans.m2", "advanced", "Индекс по `created_at` помог запросу `ORDER BY created_at DESC LIMIT 5` сильнее всего (7 страниц). Почему?", ["Из-за низкой селективности", "Из-за `Hash Join`", "Индекс отдаёт строки по порядку, а `Limit` останавливает чтение после пятой", "Из-за `work_mem`"], 2, "Без индекса читаются все 1472 страницы и сортируются; с индексом — `Index Scan Backward` и остановка на пятой строке."),
    mcq("sql.explain-plans.m3", "advanced", "Что произойдёт с планом, если запретить `enable_hashjoin` и `enable_mergejoin` для соединения всех заказов с клиентами?", ["Останутся вложенные циклы с 5000 пробами индекса: 10 041 страница", "План станет лучше", "Запрос откажет", "План не изменится"], 0, "При большом числе строк вложенные циклы с `loops=5000` читают больше страниц, чем хеш-соединение (1512)."),
    open("sql.explain-plans.m4", "advanced", "Запрос, использующий два соединения и группировку, на тестовой копии работает быстро, а на боевой — в 50 раз дольше при схожих данных. Какие гипотезы вы проверите по планам?", [
      ul(
        "Различие статистики: на боевой устарела или собрана иначе — сравнить `rows` и `actual rows`, дату последнего `ANALYZE`/автоочистки.",
        "Различие настроек: `work_mem`, параллелизм, стоимость страниц; `SETTINGS` в `EXPLAIN` покажет изменённые параметры.",
        "Различие данных: распределение значений, разброс строк по страницам (корреляция), раздутые таблицы и индексы.",
        "Нагрузка и блокировки: ожидание блокировок и конкуренция за кэш.",
        "Метод: сравнить планы, затем менять по одной причине и измерять `Buffers`.",
      ),
    ], ["Статистика", "Настройки", "Данные и раздутие", "Метод проверки"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.explain-plans.f1", front: "EXPLAIN vs EXPLAIN ANALYZE?", back: "EXPLAIN — план и оценки без выполнения; ANALYZE — выполняет и добавляет actual rows, loops, Buffers. DML анализируют в BEGIN … ROLLBACK." },
    { id: "sql.explain-plans.f2", front: "Стоимость Seq Scan?", back: "Страницы × seq_page_cost(1) + строки × cpu_tuple_cost(0,01) (+ строки × cpu_operator_cost(0,0025) за условие): 1472 + 2000 (+500)." },
    { id: "sql.explain-plans.f3", front: "Что смотреть в плане?", back: "rows vs actual rows, loops, Buffers, Rows Removed by Filter, Sort Method/Batches, Heap Fetches." },
    { id: "sql.explain-plans.f4", front: "Алгоритмы соединения?", back: "Nested Loop — мало строк и индекс; Hash Join — много строк, равенство; Merge Join — отсортированные входы." },
    { id: "sql.explain-plans.f5", front: "rows=1 при actual 100000?", back: "Устаревшая статистика: ANALYZE. Иначе планировщик выберет неудачный план (в замере 300 546 страниц против 554)." },
    { id: "sql.explain-plans.f6", front: "loops > 1?", back: "actual rows и время — среднее на выполнение; итог = значение × loops." },
    { id: "sql.explain-plans.f7", front: "external merge Disk?", back: "Сортировка не поместилась в work_mem: SET LOCAL work_mem, индекс, меньше строк; глобально work_mem повышать опасно." },
    { id: "sql.explain-plans.f8", front: "enable_* параметры?", back: "Только для экспериментов: скрывают причину плохого плана; в рабочей системе чинят статистику, индексы и запрос." },
  ],

  sources: [
    { title: "PostgreSQL 16: Using EXPLAIN", url: "https://www.postgresql.org/docs/16/using-explain.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: EXPLAIN (command reference)", url: "https://www.postgresql.org/docs/16/sql-explain.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Planner/Optimizer", url: "https://www.postgresql.org/docs/16/planner-optimizer.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Statistics Used by the Planner", url: "https://www.postgresql.org/docs/16/planner-stats.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Planner Cost Constants", url: "https://www.postgresql.org/docs/16/runtime-config-query.html#RUNTIME-CONFIG-QUERY-CONSTANTS", publisher: "PostgreSQL" },
    { title: "SQLite: EXPLAIN QUERY PLAN", url: "https://www.sqlite.org/eqp.html", publisher: "Other" },
  ],
};
