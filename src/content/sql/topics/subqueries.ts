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

export const subqueries: Topic = {
  id: "sql.subqueries",
  slug: "subqueries",
  domain: "sql",
  module: "advanced-sql",
  title: "Подзапросы: скалярные, IN, EXISTS, коррелированные",
  titleEn: "Subqueries: Scalar, IN, EXISTS, Correlated",
  summary:
    "Подзапрос — это запрос внутри запроса; результат — значение, список или таблица, которую можно использовать как выражение, источник или условие. Тема на замерах PostgreSQL 16.14 и SQLite 3.49 показывает скалярные подзапросы (4 товара дороже среднего 822), три равнозначных способа найти покупателей кофе (`IN`, `EXISTS`, `JOIN` — одни и те же Анна, Вера и Дарья), коррелированные подзапросы («дороже среднего по своей категории»), производные таблицы в `FROM`, ошибку «more than one row returned», а также планы выполнения: `EXISTS` и `IN` раскрываются в хэш-соединения, `NOT EXISTS` — в антисоединение, а коррелированный подзапрос в списке выбора выполнялся 8 раз (`loops=8`) — по разу на строку.",
  minutes: 75,
  prerequisites: ["sql.inner-left-joins", "sql.group-by-having"],
  tags: ["subquery", "scalar subquery", "correlated subquery", "IN", "EXISTS", "ANY", "ALL", "derived table", "semi-join", "anti-join", "SubPlan", "decorrelation", "more than one row"],
  keyConcepts: [
    { term: "Подзапрос — запрос в скобках, который используется как значение, список или таблица", text: "Скалярный даёт одно значение (`avg(price) = 822`), `IN`/`ANY` — множество значений, подзапрос в `FROM` — таблицу, `EXISTS` — истину или ложь." },
    { term: "Коррелированный подзапрос зависит от строки внешнего запроса", text: "`(SELECT max(o.ordered_on) FROM orders o WHERE o.customer_id = c.id)` вычисляется для каждого клиента; в замере `SubPlan` выполнился `loops=8` раз." },
    { term: "EXISTS не размножает строки", text: "`IN`, `EXISTS` и `JOIN + DISTINCT` вернули одних и тех же трёх покупателей кофе, но `EXISTS` останавливается на первой найденной паре и не требует `DISTINCT`." },
    { term: "Скалярный подзапрос — не больше одной строки", text: "Если вернулось две и более строки — ошибка `more than one row returned by a subquery used as an expression`; ноль строк — `NULL`." },
    { term: "Планировщик «разворачивает» подзапросы", text: "`EXISTS` и `IN` превратились в соединение с хэш-агрегатом, `NOT EXISTS` — в `Hash Right Anti Join`: хорошо написанный подзапрос не медленнее `JOIN`." },
  ],
  sections: [
    section("definition", [
      def("Подзапрос", "Оператор `SELECT` внутри другого оператора, заключённый в скобки. Может стоять в списке выбора, в `FROM`, в `WHERE`, `HAVING` и в правой части `IN`/`EXISTS`.", "subquery"),
      def("Скалярный подзапрос", "Подзапрос, возвращающий ровно одно значение (одна строка, один столбец); используется как обычное выражение. Ноль строк даёт `NULL`, больше одной — ошибку.", "scalar subquery"),
      def("Коррелированный подзапрос", "Подзапрос, ссылающийся на столбцы внешнего запроса; логически выполняется для каждой строки внешнего.", "correlated subquery"),
      def("Производная таблица", "Подзапрос в `FROM` с псевдонимом: `FROM (SELECT … ) AS t`. Позволяет агрегировать «поверх» агрегата.", "derived table / inline view"),
      def("EXISTS", "Предикат «подзапрос вернул хотя бы одну строку». Содержимое списка выбора неважно (принято `SELECT 1`). Не зависит от `NULL`.", "EXISTS"),
      def("Полусоединение и антисоединение", "Внутренние операции планировщика: «есть хотя бы одна пара» (semi) и «нет ни одной пары» (anti); получаются из `EXISTS`/`IN` и `NOT EXISTS`.", "semi-join / anti-join"),
      def("SubPlan", "Узел плана, означающий подзапрос, который выполняется отдельно (иногда многократно — для каждой строки внешнего запроса).", "SubPlan"),
    ]),

    section("why", [
      h("Многие вопросы естественно задаются вопросом внутри вопроса"),
      p("«Товары дороже среднего» — сначала нужно узнать среднее. «Клиенты, заказывавшие кофе» — сначала найти заказы с кофе. «Последний заказ клиента» — для каждого клиента отдельный поиск. Подзапрос позволяет записать такие задачи так, как они формулируются, без громоздких соединений и без размножения строк."),
      ul(
        "**Читаемость:** подзапрос выражает «внутренний вопрос» отдельно от основной выборки.",
        "**Корректность:** `EXISTS` не размножает строки, в отличие от `JOIN`.",
        "**Гибкость:** результат агрегата можно использовать как константу, диапазон, источник строк.",
        "**Производительность:** понимание, как СУБД выполняет подзапрос (один раз или для каждой строки), отличает быстрый запрос от медленного.",
      ),
    ]),

    section("mental-model", [
      h("Подзапрос — это вычисляемое значение, список или таблица"),
      p("Мысленно замените подзапрос тем, что он возвращает. `price > (SELECT avg(price) …)` превращается в `price > 822`. `id IN (SELECT …)` — в `id IN (1, 3, 5)`. `FROM (SELECT …) t` — в обычную таблицу `t`. Для коррелированного подзапроса замена своя для каждой строки внешнего запроса."),
      diagram(
        `
        SELECT title FROM products WHERE price > ( SELECT avg(price) FROM products )
                                                    └────── один раз: 822 ──────┘

        SELECT c.name, ( SELECT max(o.ordered_on) FROM orders o WHERE o.customer_id = c.id )
                         └── для каждого клиента отдельно: 2024-06-01, 2024-04-30, … ──┘
        `,
        "Некоррелированный подзапрос достаточно вычислить один раз; коррелированный зависит от строки снаружи.",
      ),
      h("Какой вид подзапроса выбрать"),
      table(
        ["Нужно", "Подходит", "Замечание"],
        [
          ["Одно число для сравнения", "Скалярный подзапрос", "Должен вернуть не больше одной строки"],
          ["Принадлежность множеству", "`IN (подзапрос)`", "Осторожно с `NULL` в `NOT IN`"],
          ["Есть ли связанные строки", "`EXISTS` / `NOT EXISTS`", "Не размножает, безопасен с `NULL`"],
          ["Агрегат поверх агрегата", "Подзапрос в `FROM`", "Нужен псевдоним"],
          ["Значение «для этой строки»", "Коррелированный подзапрос", "Проверьте план: многократное выполнение"],
          ["Сравнение со всеми / хотя бы с одним", "`ALL` / `ANY` (PostgreSQL)", "Нет в SQLite; замена — `max()`/`min()`"],
        ],
        "Подбор вида подзапроса",
      ),
    ]),

    section("technical", [
      h("Где можно использовать подзапрос"),
      ul(
        "**В списке выбора** — только скалярный: `SELECT (SELECT …) AS x`.",
        "**В `WHERE` и `HAVING`** — скалярный (со сравнением), `IN`, `EXISTS`, `ANY`/`ALL`.",
        "**В `FROM`** — любая таблица с обязательным псевдонимом.",
        "**В `INSERT … SELECT`, `UPDATE … SET x = (подзапрос)`, `DELETE … WHERE … IN (подзапрос)`.**",
      ),
      h("Правила результата"),
      ul(
        "Скалярный подзапрос с несколькими строками — ошибка выполнения (`more than one row returned by a subquery used as an expression`).",
        "Скалярный подзапрос без строк — `NULL`; без `LIMIT 1`/агрегата убедитесь, что строка единственная.",
        "`IN` допускает подзапрос с одним столбцом; `NULL` в результате ломает `NOT IN`.",
        "`EXISTS` не смотрит на значения — только на наличие строк.",
      ),
      h("Подзапрос и JOIN"),
      p("Большинство подзапросов можно переписать соединением и наоборот; разница — в **кардинальности** (соединение может размножить строки), **читаемости** и **плане**. Современные планировщики раскрывают `IN`/`EXISTS` в полу- и антисоединения и часто строят одинаковый план. Решение «JOIN или подзапрос» принимайте по смыслу: нужны **столбцы** из другой таблицы — `JOIN`; нужно только **условие наличия** — `EXISTS`."),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `-- Коррелированный подзапрос зависит от строки внешнего запроса
SELECT c.name,
       (SELECT max(o.ordered_on) FROM orders o WHERE o.customer_id = c.id) AS last_order
FROM customers c
ORDER BY c.id;

-- Товары дороже среднего по СВОЕЙ категории
SELECT p.category, p.title, p.price
FROM products p
WHERE p.price > (SELECT avg(x.price) FROM products x WHERE x.category = p.category)
ORDER BY p.category, p.price DESC;`,
        [
          { line: 1, text: "Комментарий: коррелированный подзапрос зависит от строки внешнего запроса." },
          { line: [2, 3], text: "Скалярный подзапрос в списке выбора: для каждого клиента `c` находит дату его последнего заказа." },
          { line: 3, text: "`o.customer_id = c.id` — ссылка на внешнюю строку (`c`), поэтому подзапрос коррелирован." },
          { line: [4, 5], text: "Внешний запрос перечисляет всех клиентов; для клиентов без заказов `max` по пустому набору — `NULL`, строка не пропадает." },
          { line: [7, 10], text: "Второй запрос: подзапрос в `WHERE` сравнивает цену товара со средним **по его категории** (`x.category = p.category`)." },
        ],
        "03-correlated.sql",
      ),
    ]),

    section("minimal-example", [
      p("Скалярный подзапрос: «товары дороже среднего». Среднее считается один раз — 822 — и используется в сравнении и в вычислении разницы."),
      code("sql", `-- Скалярный подзапрос возвращает одно значение и используется как число
SELECT title, price,
       price - (SELECT avg(price) FROM products) AS above_average
FROM products
WHERE price > (SELECT avg(price) FROM products)
ORDER BY price DESC;`, { filename: "01-scalar.sql", runnable: true, fixture: "shop" }),
      code("text", `       title        |  price  |     above_average     
--------------------+---------+-----------------------
 Чайник стальной    | 2300.00 | 1478.0000000000000000
 Френч-пресс        | 1900.00 | 1078.0000000000000000
 Кофе зерновой 1 кг | 1200.00 |  378.0000000000000000
 Термокружка        |  990.00 |  168.0000000000000000
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Четыре товара дороже 822: Чайник (на 1478 дороже среднего), Френч-пресс, Кофе и Термокружка. Подзапрос записан дважды, потому что `WHERE` не видит псевдоним из `SELECT`; в большом запросе его выносят в CTE (следующие темы)."),
    ]),

    section("detailed-example", [
      p("Три способа спросить «кто заказывал кофе»: `IN`, `EXISTS` и `JOIN` с `DISTINCT`. Результат одинаков, различия — в смысле и плане."),
      code("sql", `-- Кто заказывал кофе (товар 1)? Три равнозначных способа
SELECT name FROM customers
WHERE id IN (SELECT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE oi.product_id = 1)
ORDER BY name;

SELECT name FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.customer_id = c.id AND oi.product_id = 1)
ORDER BY name;

SELECT DISTINCT c.name FROM customers c
JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = 1
ORDER BY c.name;`, { filename: "02-in-exists.sql", runnable: true, fixture: "shop" }),
      code("text", ` name  
-------
 Анна
 Вера
 Дарья
(3 rows)

 name  
-------
 Анна
 Вера
 Дарья
(3 rows)

 name  
-------
 Анна
 Вера
 Дарья
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Все три запроса вернули Анну, Веру и Дарью.",
        "`IN` строит множество клиентов с кофе и проверяет принадлежность.",
        "`EXISTS` для каждого клиента отвечает «есть ли заказ с кофе» и останавливается на первой найденной паре.",
        "`JOIN … DISTINCT` сначала размножает клиента по числу покупок кофе, затем склеивает.",
      ),
      h("Коррелированные подзапросы"),
      code("sql", `-- Коррелированный подзапрос зависит от строки внешнего запроса
SELECT c.name,
       (SELECT max(o.ordered_on) FROM orders o WHERE o.customer_id = c.id) AS last_order
FROM customers c
ORDER BY c.id;

-- Товары дороже среднего по СВОЕЙ категории
SELECT p.category, p.title, p.price
FROM products p
WHERE p.price > (SELECT avg(x.price) FROM products x WHERE x.category = p.category)
ORDER BY p.category, p.price DESC;`, { filename: "03-correlated.sql", runnable: true, fixture: "shop" }),
      code("text", ` name  | last_order 
-------+------------
 Анна  | 2024-06-01
 Борис | 2024-04-30
 Вера  | 2024-05-21
 Глеб  | 2024-03-20
 Дарья | 2024-06-18
 Егор  | 
 Жанна | 2024-05-06
 Игорь | 
(8 rows)

 category |       title        |  price  
----------+--------------------+---------
 напитки  | Кофе зерновой 1 кг | 1200.00
 посуда   | Чайник стальной    | 2300.00
 посуда   | Френч-пресс        | 1900.00
 продукты | Мёд 300 г          |  520.00
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Первый запрос показывает дату последнего заказа каждого клиента (у Егора и Игоря — пусто). Второй выбирает товары дороже среднего **по своей категории**: Кофе (1200 против 610), Чайник и Френч-пресс (посуда: среднее 1410), Мёд (продукты: 250)."),
      h("Производная таблица"),
      code("sql", `-- Подзапрос в FROM — «производная таблица»: сначала считаем заказы клиентов, затем усредняем
SELECT count(*) AS customers_with_orders,
       avg(n)   AS average_orders,
       max(n)   AS max_orders
FROM (SELECT customer_id, count(*) AS n FROM orders GROUP BY customer_id) AS per_customer;`, { filename: "04-derived.sql", runnable: true, fixture: "shop" }),
      code("text", ` customers_with_orders |   average_orders   | max_orders 
-----------------------+--------------------+------------
                     6 | 2.1666666666666667 |          4
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Внутренний запрос считает заказы по клиентам (6 клиентов с заказами), внешний усредняет эти числа: в среднем 2,17 заказа, максимум — 4. Агрегат поверх агрегата без подзапроса в `FROM` невозможен."),
    ]),

    section("analysis", [
      table(
        ["Запрос", "Результат", "Объяснение"],
        [
          ["`price > (SELECT avg(price) FROM products)`", "4 товара", "Среднее 822 вычислено один раз"],
          ["`id IN (SELECT customer_id FROM orders WHERE status = 'new')`", "Глеб", "Единственный клиент с новым заказом"],
          ["`price = (SELECT max(price) FROM products WHERE category = 'продукты')`", "Мёд 300 г", "Самый дорогой продукт — 520"],
          ["`EXISTS (… status = 'cancelled')`", "2 клиента", "Вера и Дарья имеют отменённые заказы"],
          ["Коррелированный `max(ordered_on)`", "8 строк", "У двух клиентов без заказов — `NULL`"],
        ],
        "Что вернули запросы (замеры PostgreSQL 16.14)",
      ),
      code("sql", `SELECT count(*) FROM products WHERE price > (SELECT avg(price) FROM products);
SELECT title FROM products WHERE price = (SELECT max(price) FROM products WHERE category = 'продукты');
SELECT count(*) FROM customers WHERE EXISTS (SELECT 1 FROM orders WHERE orders.customer_id = customers.id AND status = 'cancelled');
SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders WHERE status = 'new');`, { filename: "08-ex-predict.sql", runnable: true, fixture: "shop" }),
      code("text", ` count 
-------
     4
(1 row)

   title   
-----------
 Мёд 300 г
(1 row)

 count 
-------
     2
(1 row)

 name 
------
 Глеб
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
    ]),

    section("internals", [
      h("План: как СУБД выполняет подзапросы"),
      code("sql", `ANALYZE;
EXPLAIN (COSTS OFF) SELECT name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
EXPLAIN (COSTS OFF) SELECT name FROM customers c WHERE c.id IN (SELECT customer_id FROM orders);
EXPLAIN (COSTS OFF) SELECT name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT c.name, (SELECT max(o.ordered_on) FROM orders o WHERE o.customer_id = c.id) FROM customers c;`, { filename: "07-plans.pg.sql" }),
      code("text", `               QUERY PLAN               
----------------------------------------
 Hash Join
   Hash Cond: (c.id = o.customer_id)
   ->  Seq Scan on customers c
   ->  Hash
         ->  HashAggregate
               Group Key: o.customer_id
               ->  Seq Scan on orders o
(7 rows)

                 QUERY PLAN                  
---------------------------------------------
 Hash Join
   Hash Cond: (c.id = orders.customer_id)
   ->  Seq Scan on customers c
   ->  Hash
         ->  HashAggregate
               Group Key: orders.customer_id
               ->  Seq Scan on orders
(7 rows)

             QUERY PLAN              
-------------------------------------
 Hash Right Anti Join
   Hash Cond: (o.customer_id = c.id)
   ->  Seq Scan on orders o
   ->  Hash
         ->  Seq Scan on customers c
(5 rows)

                         QUERY PLAN                         
------------------------------------------------------------
 Seq Scan on customers c (actual rows=8 loops=1)
   SubPlan 1
     ->  Aggregate (actual rows=1 loops=8)
           ->  Seq Scan on orders o (actual rows=2 loops=8)
                 Filter: (customer_id = c.id)
                 Rows Removed by Filter: 11
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "**`EXISTS` и `IN`** раскрыты в соединение с `HashAggregate` по `customer_id` из `orders`: планировщик сначала получает уникальные ключи заказов, затем соединяет с клиентами — полусоединение без размножения.",
        "**`NOT EXISTS`** превращён в `Hash Right Anti Join`: клиент остаётся, если пары справа нет.",
        "**Коррелированный подзапрос в списке выбора** — узел `SubPlan` с `loops=8`: для каждой из 8 строк `customers` выполнен отдельный проход по `orders` (в среднем отфильтровано 11 строк за проход). На больших таблицах без индекса по `orders(customer_id)` такой запрос превращается в квадратичный.",
      ),
      h("Правило: коррелированный подзапрос стоит как внутренний цикл"),
      p("Планировщик иногда «разворачивает» (decorrelate) подзапрос в соединение, но не всегда: скалярные подзапросы в списке выбора обычно остаются `SubPlan`. Если внутренний запрос обращается к большой таблице, ему нужен индекс по столбцу корреляции; иначе безопаснее переписать на `JOIN` с агрегатом или оконную функцию."),
      h("Ошибки результата скалярного подзапроса"),
      code("sql", `-- Скалярный подзапрос обязан вернуть не больше одной строки
SELECT name, (SELECT id FROM orders o WHERE o.customer_id = c.id) AS some_order FROM customers c;

-- Ноль строк — это NULL, а не ошибка
SELECT (SELECT id FROM orders WHERE customer_id = 999) AS no_such_order;`, { filename: "05-scalar-errors.pg.sql" }),
      code("text", `ERROR:  more than one row returned by a subquery used as an expression
 no_such_order 
---------------
              
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("У клиентов по несколько заказов, поэтому «заказ клиента» не скаляр — PostgreSQL останавливает запрос. Ноль строк (`customer_id = 999`) даёт `NULL`. Скаляр нужно гарантировать: агрегатом (`max`), `LIMIT 1` с `ORDER BY` или ограничением `UNIQUE`."),
      h("ANY и ALL"),
      code("sql", `-- Товары дороже ВСЕХ напитков и дороже ХОТЯ БЫ ОДНОГО напитка
SELECT title, price FROM products
WHERE price > ALL (SELECT price FROM products WHERE category = 'напитки')
ORDER BY price DESC;

SELECT count(*) AS above_some_drink FROM products
WHERE price > ANY (SELECT price FROM products WHERE category = 'напитки');`, { filename: "06-any-all.pg.sql" }),
      code("text", `      title      |  price  
-----------------+---------
 Чайник стальной | 2300.00
 Френч-пресс     | 1900.00
(2 rows)

 above_some_drink 
------------------
                7
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`> ALL (…)` — больше каждого значения (то же, что `> max`), `> ANY (…)` — больше хотя бы одного (`> min`). В SQLite этих операторов нет; используйте `(SELECT max(…))`/`(SELECT min(…))`."),
    ]),

    section("mistakes", [
      h("Ошибка: скалярный подзапрос с несколькими строками"),
      p("Подзапрос внутри выражения должен вернуть не больше одной строки — иначе `more than one row returned by a subquery used as an expression`. Часто ошибка появляется не сразу, а когда в данных появляется второй подходящий ряд. Гарантируйте единственность: агрегат, `LIMIT 1`, ключ."),
      h("Ошибка: максимум по всей таблице вместо группы"),
      code("sql", `-- «Покажите самый дорогой товар категории» через подзапрос — но результат содержит лишние строки
SELECT category, title, price
FROM products
WHERE price = (SELECT max(price) FROM products)
ORDER BY category;`, { filename: "09-ex-fix.sql", runnable: true, fixture: "shop" }),
      code("text", ` category |      title      |  price  
----------+-----------------+---------
 посуда   | Чайник стальной | 2300.00
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Хотели самый дорогой товар каждой категории, получили один товар: подзапрос `max(price)` не зависит от категории. Нужна корреляция по категории:"),
      code("sql", `SELECT p.category, p.title, p.price
FROM products AS p
WHERE p.price = (SELECT max(x.price) FROM products AS x WHERE x.category = p.category)
ORDER BY p.category;`, { filename: "10-fix-solution.sql", runnable: true, fixture: "shop" }),
      code("text", ` category |       title        |  price  
----------+--------------------+---------
 напитки  | Кофе зерновой 1 кг | 1200.00
 посуда   | Чайник стальной    | 2300.00
 продукты | Мёд 300 г          |  520.00
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      h("Ошибка: NOT IN с подзапросом, который может вернуть NULL"),
      p("Один `NULL` в результате подзапроса превращает `NOT IN` в «ничего не подходит» (см. тему о `NULL`). Используйте `NOT EXISTS`: он не зависит от `NULL`."),
      h("Ошибка: коррелированный подзапрос без индекса на большой таблице"),
      p("На 8 строках `loops=8` незаметно; на миллионе клиентов — миллион проходов по заказам. Проверяйте план (`SubPlan`, `loops`) и добавляйте индекс по столбцу корреляции либо переписывайте на агрегат с соединением."),
      h("Ошибка: «подзапрос вместо JOIN», когда нужны столбцы"),
      p("`EXISTS`/`IN` отвечают только «есть ли связь». Чтобы показать имя клиента рядом с заказом, нужен `JOIN`; тащить столбцы через скалярные подзапросы по одному — медленно и громоздко."),
    ]),

    section("antipatterns", [
      ul(
        "**Несколько одинаковых скалярных подзапросов** в одном запросе вместо CTE или `JOIN`.",
        "**Скалярные подзапросы в списке выбора на больших таблицах** без индекса по столбцу корреляции.",
        "**`NOT IN (SELECT nullable_col …)`.**",
        "**`SELECT *` внутри `EXISTS`** (бесполезно: достаточно `SELECT 1`), а также `COUNT(*) > 0` вместо `EXISTS`.",
        "**Подзапрос в `SELECT` для данных, которые лучше получить `JOIN`-ом** (столбцы одной и той же строки).",
        "**Подзапрос, зависящий от порядка** (`LIMIT 1` без `ORDER BY`).",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Для проверки наличия — `EXISTS`/`NOT EXISTS`**, а не `COUNT(*) > 0` и не `NOT IN`.",
        "**Скаляр гарантируйте** агрегатом, `LIMIT 1 ORDER BY …` или уникальным ключом.",
        "**Давайте производным таблицам понятные псевдонимы** и выносите повторяющиеся подзапросы в CTE.",
        "**Смотрите план (`EXPLAIN`)**: `SubPlan` с большим `loops` — повод переписать.",
        "**Индексируйте столбцы корреляции** (`orders.customer_id`).",
        "**Выбирайте между `JOIN` и подзапросом по смыслу**: нужны столбцы — `JOIN`, нужно условие — `EXISTS`.",
        "**Проверяйте на пустых и повторяющихся данных**: ноль строк, две строки, `NULL`.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Подзапрос в `FROM` обязан иметь псевдоним** (в PostgreSQL; в SQLite — нет, но лучше писать).",
        "**`IN` с пустым подзапросом** — ложь для всех строк; `NOT IN` с пустым — истина.",
        "**`EXISTS` и `NULL`:** содержимое не важно, только наличие строки — `EXISTS (SELECT NULL)` истинно.",
        "**Имена в подзапросе** сначала ищутся в самом подзапросе, затем во внешнем — одноимённые столбцы лучше квалифицировать псевдонимами.",
        "**Подзапросы в `ORDER BY`/`GROUP BY`** допустимы, но часто есть лучший способ.",
        "**SQLite:** нет `ANY`/`ALL`; коррелированные подзапросы поддерживаются.",
        "**`LATERAL`** (PostgreSQL) — подзапрос в `FROM`, который видит предыдущие источники (см. соединения).",
      ),
    ]),

    section("related", [
      ul(
        "[INNER и LEFT JOIN](/learn/sql/inner-left-joins) — соединения как альтернатива подзапросам.",
        "[RIGHT, FULL, CROSS и SELF JOIN](/learn/sql/other-joins) — `LATERAL` и полусоединение.",
        "[Типы данных и NULL](/learn/sql/data-types-null) — ловушка `NOT IN`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "COUNT(*) > 0 и NOT IN",
          code: `
            SELECT name FROM customers c
            WHERE (SELECT count(*) FROM orders o WHERE o.customer_id = c.id) > 0;

            SELECT name FROM customers
            WHERE id NOT IN (SELECT customer_id FROM refs);       -- NULL в refs → пусто
          `,
          note: "Первый подсчитывает все заказы ради проверки «есть ли хоть один»; второй ломается из-за `NULL`.",
        },
        {
          title: "EXISTS и NOT EXISTS",
          code: `
            SELECT name FROM customers c
            WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);

            SELECT name FROM customers c
            WHERE NOT EXISTS (SELECT 1 FROM refs r WHERE r.customer_id = c.id);
          `,
          note: "Поиск останавливается на первой найденной паре; `NULL` в `refs` не влияет на результат.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.subqueries.ex1",
      title: "Предскажите результат",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская, определите результат каждого запроса (цены: 1200, 250, 450, 1900, 90, 140, 520, 2300, 380, 990; среднее 822)."),
        code("sql", `SELECT count(*) FROM products WHERE price > (SELECT avg(price) FROM products);
SELECT title FROM products WHERE price = (SELECT max(price) FROM products WHERE category = 'продукты');
SELECT count(*) FROM customers WHERE EXISTS (SELECT 1 FROM orders WHERE orders.customer_id = customers.id AND status = 'cancelled');
SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders WHERE status = 'new');`, { filename: "08-ex-predict.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["Сколько товаров дороже 822?", "Самая высокая цена среди продуктов?", "Кто имеет отменённые заказы?", "Кто имеет заказ в статусе `new`?"],
      checks: ["Первый: 4", "Второй: Мёд 300 г", "Третий: 2 клиента", "Четвёртый: Глеб"],
      solution: [
        code("text", ` count 
-------
     4
(1 row)

   title   
-----------
 Мёд 300 г
(1 row)

 count 
-------
     2
(1 row)

 name 
------
 Глеб
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "Дороже 822: 1200, 1900, 2300, 990 — четыре товара.",
          "Продукты: сахар 90, печенье 140, мёд 520 — максимум 520, то есть «Мёд 300 г».",
          "Отменённые заказы 5 (Вера) и 13 (Дарья) — два клиента.",
          "Статус `new` — заказ 6 клиента Глеба.",
        ),
      ],
    }),
    exercise({
      id: "sql.subqueries.ex2",
      title: "Самый дорогой товар каждой категории",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Запрос должен вернуть самый дорогой товар **каждой** категории, но возвращает один товар. Объясните причину и исправьте с помощью коррелированного подзапроса."),
        code("sql", `-- «Покажите самый дорогой товар категории» через подзапрос — но результат содержит лишние строки
SELECT category, title, price
FROM products
WHERE price = (SELECT max(price) FROM products)
ORDER BY category;`, { filename: "09-ex-fix.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["От чего зависит `max(price)` в подзапросе?", "Как сделать так, чтобы максимум считался внутри категории строки?"],
      checks: ["Причина: подзапрос не коррелирован", "Исправление: `WHERE x.category = p.category`", "Три строки: Кофе, Чайник, Мёд"],
      solution: [
        code("sql", `SELECT p.category, p.title, p.price
FROM products AS p
WHERE p.price = (SELECT max(x.price) FROM products AS x WHERE x.category = p.category)
ORDER BY p.category;`, { filename: "10-fix-solution.sql", runnable: true, fixture: "shop" }),
        code("text", ` category |       title        |  price  
----------+--------------------+---------
 напитки  | Кофе зерновой 1 кг | 1200.00
 посуда   | Чайник стальной    | 2300.00
 продукты | Мёд 300 г          |  520.00
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Подзапрос `max(price)` без `WHERE` берёт максимум по всей таблице (2300) — подходит только Чайник. Корреляция по категории (`x.category = p.category`) вычисляет максимум отдельно для каждой строки внешнего запроса."),
      ],
    }),
    exercise({
      id: "sql.subqueries.ex3",
      title: "Последний заказ и «всегда платил»",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Составьте два запроса: (1) клиенты, чей **последний** заказ отменён (последний — по дате, при равенстве — по `id`); (2) клиенты, у которых есть заказы и **все** они оплачены (`paid`)."),
      ],
      hints: ["Как найти последний заказ клиента скалярным подзапросом?", "Как выразить «все оплачены»: нет ни одного неоплаченного?", "Нужна ли проверка, что заказы вообще есть?"],
      checks: ["(1): Дарья (последний заказ 13 отменён)", "(2): Жанна", "Для (2) `EXISTS` + `NOT EXISTS`"],
      solution: [
        code("sql", `-- Клиенты, чей последний заказ — отменённый, и клиенты, у которых все заказы оплачены
SELECT c.name, o.id AS last_order_id, o.status
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
WHERE o.id = (SELECT x.id FROM orders AS x WHERE x.customer_id = c.id ORDER BY x.ordered_on DESC, x.id DESC LIMIT 1)
  AND o.status = 'cancelled'
ORDER BY c.name;

SELECT c.name
FROM customers AS c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status <> 'paid')
ORDER BY c.name;`, { filename: "11-challenge.sql", runnable: true, fixture: "shop" }),
        code("text", ` name  | last_order_id |  status   
-------+---------------+-----------
 Дарья |            13 | cancelled
(1 row)

 name  
-------
 Жанна
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("«Последний заказ» — скалярный подзапрос с `ORDER BY … LIMIT 1` по тем же ключам, что дают детерминированный порядок. «Все оплачены» = «заказы есть» (`EXISTS`) и «неоплаченных нет» (`NOT EXISTS`); без первой части в результат попали бы клиенты вовсе без заказов (Егор, Игорь). Анна не подходит: у неё есть отгруженный заказ."),
      ],
    }),
  ],

  challenge: {
    id: "sql.subqueries.challenge",
    title: "Покупатели кофе без размножения и без NULL-ловушек",
    scenario: [
      p("Нужен список клиентов, которые когда-либо заказывали кофе, и список клиентов, которые **не** заказывали кофе ни разу — оба точные, без дублей и независимые от `NULL`. Команда спорит: `IN`, `EXISTS` или `JOIN`?"),
    ],
    requirements: [
      "Список «заказывали кофе»: тремя способами (`IN`, `EXISTS`, `JOIN` с `DISTINCT`) — и убедиться, что результаты совпадают",
      "Список «не заказывали кофе»: через `NOT EXISTS`",
      "Показать план `EXISTS`/`NOT EXISTS` и объяснить, почему он не хуже соединения",
    ],
    constraints: [
      "Без `NOT IN` по столбцу, который может быть `NULL`",
      "Результаты отсортированы по имени",
    ],
    acceptance: [
      "«Заказывали»: Анна, Вера, Дарья — во всех трёх вариантах",
      "«Не заказывали»: Борис, Глеб, Егор, Жанна, Игорь",
      "В плане `EXISTS` — соединение с хэш-агрегатом, `NOT EXISTS` — Anti Join",
    ],
    hints: [
      "`NOT EXISTS (SELECT 1 FROM orders o JOIN order_items oi … WHERE o.customer_id = c.id AND oi.product_id = 1)`.",
    ],
    solution: [
      code("sql", `-- «Заказывали кофе» тремя способами
SELECT name FROM customers WHERE id IN (SELECT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE oi.product_id = 1) ORDER BY name;
SELECT name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.customer_id = c.id AND oi.product_id = 1) ORDER BY name;
SELECT DISTINCT c.name FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = 1 ORDER BY c.name;

-- «Не заказывали кофе ни разу»
SELECT name FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.customer_id = c.id AND oi.product_id = 1)
ORDER BY name;`, { filename: "12-challenge.sql", runnable: true, fixture: "shop" }),
      code("text", ` name  
-------
 Анна
 Вера
 Дарья
(3 rows)

 name  
-------
 Анна
 Вера
 Дарья
(3 rows)

 name  
-------
 Анна
 Вера
 Дарья
(3 rows)

 name  
-------
 Борис
 Глеб
 Егор
 Жанна
 Игорь
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`IN`, `EXISTS` и `JOIN + DISTINCT` вернули одних и тех же клиентов; для «не заказывали» выбран `NOT EXISTS` — он не боится `NULL` и раскрывается в Anti Join. Планировщик превращает `EXISTS`/`IN` в одно и то же соединение, поэтому выбор — вопрос ясности, а не скорости."),
    ],
  },

  interview: [
    iq("sql.subqueries.i1", "basic", "Что такое подзапрос и где его можно использовать?", [
      ul(
        "Запрос в скобках внутри другого запроса.",
        "В списке выбора (скаляр), в `WHERE`/`HAVING` (скаляр, `IN`, `EXISTS`, `ANY`/`ALL`), в `FROM` (производная таблица), в `INSERT … SELECT`, `UPDATE`, `DELETE`.",
        "Результат — значение, список значений или таблица.",
      ),
    ]),
    iq("sql.subqueries.i2", "basic", "Что будет, если скалярный подзапрос вернёт несколько строк? А ни одной?", [
      ul(
        "Несколько строк — ошибка `more than one row returned by a subquery used as an expression`.",
        "Ни одной строки — результат `NULL`.",
        "Гарантия единственности: агрегат, `LIMIT 1` с `ORDER BY`, уникальный ключ.",
      ),
    ]),
    iq("sql.subqueries.i3", "intermediate", "Чем коррелированный подзапрос отличается от некоррелированного?", [
      ul(
        "Коррелированный ссылается на столбцы внешнего запроса, значит зависит от текущей строки (в замере `SubPlan` с `loops=8`).",
        "Некоррелированный не зависит от внешнего запроса и вычисляется один раз.",
        "Коррелированный может быть дорог на больших таблицах: нужен индекс по столбцу корреляции или переписывание на `JOIN`/окно.",
      ),
    ]),
    iq("sql.subqueries.i4", "intermediate", "IN, EXISTS или JOIN: что выбрать?", [
      ul(
        "Нужны столбцы другой таблицы — `JOIN`.",
        "Нужно только «есть ли связанная строка» — `EXISTS` (не размножает, не боится `NULL`, останавливается на первой паре).",
        "`IN` читается естественно для небольших списков и подзапросов с одним столбцом; `NOT IN` опасен из-за `NULL`.",
        "Планировщик часто строит одинаковый план для `IN` и `EXISTS` (в замере — соединение с хэш-агрегатом).",
      ),
    ]),
    iq("sql.subqueries.i5", "intermediate", "Зачем подзапросу в FROM псевдоним и когда он нужен?", [
      ul(
        "Производной таблице нужно имя, чтобы ссылаться на её столбцы (в PostgreSQL обязательно).",
        "Нужен для агрегата поверх агрегата (среднее число заказов на клиента), для оконных функций с фильтром, для разбиения сложного запроса на шаги.",
        "Для повторного использования подзапроса — CTE.",
      ),
    ]),
    iq("sql.subqueries.i6", "advanced", "Как PostgreSQL выполняет EXISTS, NOT EXISTS и коррелированный скалярный подзапрос?", [
      ul(
        "`EXISTS`/`IN` раскрываются в полусоединение (в замере — `Hash Join` с `HashAggregate` по ключу).",
        "`NOT EXISTS` — в антисоединение (`Hash Right Anti Join`).",
        "Коррелированный скаляр в списке выбора остаётся `SubPlan`, выполняемым для каждой строки (в замере `loops=8`).",
        "Читайте план (`EXPLAIN ANALYZE`), смотрите `loops` и `Rows Removed by Filter`.",
      ),
    ]),
    iq("sql.subqueries.i7", "engineering", "Как переписать «последняя запись для каждой группы» без коррелированного подзапроса?", [
      ul(
        "Оконная функция: `row_number() OVER (PARTITION BY customer_id ORDER BY ordered_on DESC, id DESC)` и фильтр `= 1`.",
        "PostgreSQL: `DISTINCT ON (customer_id) … ORDER BY customer_id, ordered_on DESC, id DESC`.",
        "Агрегат по группе (`max(ordered_on)`) и соединение — при условии уникальности пары (учтите равные даты).",
        "Выбор зависит от объёма и индексов; сравните планы.",
      ),
    ]),
    iq("sql.subqueries.i8", "debugging", "Запрос с подзапросом внезапно стал медленным на проде. Что проверите?", [
      ul(
        "План: `SubPlan` с огромным `loops`, `Seq Scan` внутри коррелированного подзапроса.",
        "Индекс по столбцу корреляции (`orders.customer_id`) и актуальная статистика (`ANALYZE`).",
        "`NOT IN` вместо `NOT EXISTS`: не раскрывается в антисоединение.",
        "Переписывание: `JOIN` с агрегатом, окно, `LATERAL`.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.subqueries.e1", "foundation", "Что вернёт скалярный подзапрос, если он не нашёл ни одной строки?", ["Ошибку", "`0`", "`NULL`", "Пустую строку"], 2, "Скалярный подзапрос без строк даёт `NULL` (замер: `no_such_order` пуст)."),
    mcq("sql.subqueries.e2", "foundation", "Что делает `EXISTS (подзапрос)`?", ["Проверяет, что подзапрос вернул хотя бы одну строку", "Возвращает значения подзапроса", "Считает строки подзапроса", "Сортирует результат"], 0, "`EXISTS` возвращает истину, если подзапрос дал хотя бы одну строку; значения не важны."),
    mcq("sql.subqueries.e3", "foundation", "Что нужно подзапросу в `FROM` в PostgreSQL?", ["Индекс", "`DISTINCT`", "`LIMIT`", "Псевдоним"], 3, "Производная таблица должна иметь псевдоним (`AS t`)."),
    mcq("sql.subqueries.e4", "intermediate", "Какой подзапрос коррелированный?", ["`WHERE price > (SELECT avg(price) FROM products)`", "`WHERE price > (SELECT avg(x.price) FROM products x WHERE x.category = p.category)`", "`FROM (SELECT customer_id, count(*) FROM orders GROUP BY 1) t`", "`WHERE id IN (SELECT customer_id FROM orders)`"], 1, "Во втором подзапрос ссылается на `p.category` внешнего запроса — зависит от его строки."),
    mcq("sql.subqueries.e5", "intermediate", "Какие утверждения верны для `NOT EXISTS`? Выберите все.", ["Не зависит от `NULL` в связанных столбцах", "Раскрывается планировщиком в антисоединение", "Возвращает клиентов без связанных строк", "Всегда медленнее `NOT IN`"], [0, 1, 2], "`NOT EXISTS` безопасен с `NULL`, раскрывается в Anti Join (замер) и находит строки без пары; быстрее или не медленнее `NOT IN`."),
    mcq("sql.subqueries.e6", "intermediate", "Сколько раз в замере выполнился коррелированный подзапрос в списке выбора для 8 клиентов?", ["1", "64", "13", "8"], 3, "В плане `Aggregate (actual rows=1 loops=8)` — по разу на каждую строку внешнего запроса."),
    mcq("sql.subqueries.e7", "advanced", "Запрос `WHERE price = (SELECT max(price) FROM products)` вместо «самого дорогого товара каждой категории» вернул одну строку. Почему?", ["Из-за `NULL`", "Из-за индекса", "Подзапрос не зависит от категории и возвращает глобальный максимум", "Ошибка планировщика"], 2, "Без корреляции `max(price)` вычисляется по всей таблице (2300) — подходит один товар (замер)."),
    open("sql.subqueries.e8", "intermediate", "Объясните разницу между `IN`, `EXISTS` и `JOIN` на примере «клиенты, заказывавшие товар X», и когда выберете каждый.", [
      ul(
        "`JOIN` размножает клиента по числу покупок и требует `DISTINCT`; нужен, если в результате нужны столбцы заказа или товара.",
        "`EXISTS` проверяет наличие хотя бы одной связанной строки и не размножает: идеален для «есть ли».",
        "`IN` читается как «клиент из множества»; для `NOT IN` опасен `NULL` в подзапросе.",
        "Все три в замере вернули одних и тех же клиентов; планировщик раскрывает `IN`/`EXISTS` в одно и то же полусоединение.",
      ),
    ], ["Названо размножение у JOIN", "Названо назначение EXISTS", "Названа ловушка NOT IN", "Упомянут одинаковый план"], { format: "sql" }),
  ],

  mastery: [
    mcq("sql.subqueries.m1", "intermediate", "Какой результат даст `SELECT count(*) FROM products WHERE price > (SELECT avg(price) FROM products)` для набора «shop»?", ["3", "4", "5", "6"], 1, "Среднее 822; дороже — 1200, 1900, 2300 и 990: 4 товара (замер)."),
    mcq("sql.subqueries.m2", "advanced", "Почему коррелированный скалярный подзапрос в списке выбора опасен на больших таблицах без индекса?", ["Он выполняется для каждой строки внешнего запроса — квадратичная стоимость", "Он не поддерживается", "Он всегда возвращает `NULL`", "Он блокирует таблицу"], 0, "`SubPlan` с `loops = число строк` и просмотром таблицы на каждом проходе."),
    mcq("sql.subqueries.m3", "advanced", "Что вернёт `WHERE price > ALL (SELECT price FROM products WHERE category = 'напитки')`?", ["Все товары", "Товары дороже самого дешёвого напитка", "Товары дороже самого дорогого напитка", "Пустой результат"], 2, "`> ALL` — больше каждого значения, то есть больше максимума (1200): Чайник и Френч-пресс (замер)."),
    open("sql.subqueries.m4", "advanced", "Дан запрос с тремя одинаковыми скалярными подзапросами `(SELECT avg(price) FROM products)` в списке выбора и в `WHERE`. Как упростить и ускорить, и что проверите после?", [
      ul(
        "Вынести подзапрос в CTE (`WITH avg_price AS (SELECT avg(price) AS v FROM products)`) и соединить (`CROSS JOIN avg_price`) — вычисляется один раз и читается проще.",
        "Либо использовать оконную функцию `avg(price) OVER ()`, если нужно значение рядом с каждой строкой.",
        "Проверить, что результат не изменился: сравнить на тестовом наборе, включая пустой и с `NULL`.",
        "Посмотреть план до и после (`EXPLAIN ANALYZE`): число узлов `SubPlan`/`InitPlan`, время.",
      ),
    ], ["Предложен CTE или окно", "Объяснено вычисление один раз", "Проверка эквивалентности результата", "Сравнение планов"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.subqueries.f1", front: "Скалярный подзапрос?", back: "Одно значение: 0 строк → NULL, >1 строки → ошибка. Агрегат/LIMIT 1/ключ гарантируют единственность." },
    { id: "sql.subqueries.f2", front: "Коррелированный?", back: "Ссылается на строку внешнего запроса; выполняется для каждой строки (SubPlan loops=N). Нужен индекс по столбцу корреляции." },
    { id: "sql.subqueries.f3", front: "EXISTS?", back: "Есть ли хоть одна строка. Не размножает, не боится NULL, останавливается на первой паре." },
    { id: "sql.subqueries.f4", front: "IN и NOT IN?", back: "IN — принадлежность множеству. NOT IN с NULL в подзапросе даёт пусто; используйте NOT EXISTS." },
    { id: "sql.subqueries.f5", front: "Подзапрос в FROM?", back: "Производная таблица с псевдонимом: агрегат поверх агрегата, шаги запроса." },
    { id: "sql.subqueries.f6", front: "ANY / ALL?", back: "> ALL = больше максимума; > ANY = больше минимума. PostgreSQL; в SQLite нет." },
    { id: "sql.subqueries.f7", front: "План EXISTS?", back: "Раскрывается в полусоединение; NOT EXISTS — в антисоединение (Hash Right Anti Join)." },
    { id: "sql.subqueries.f8", front: "JOIN или подзапрос?", back: "Нужны столбцы — JOIN. Нужен факт наличия — EXISTS. Выбор по смыслу и кардинальности." },
  ],

  sources: [
    { title: "PostgreSQL 16: Subquery Expressions", url: "https://www.postgresql.org/docs/16/functions-subquery.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Scalar Subqueries", url: "https://www.postgresql.org/docs/16/sql-expressions.html#SQL-SYNTAX-SCALAR-SUBQUERIES", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Subqueries in FROM", url: "https://www.postgresql.org/docs/16/queries-table-expressions.html#QUERIES-SUBQUERIES", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Using EXPLAIN", url: "https://www.postgresql.org/docs/16/using-explain.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL wiki: Subquery pull-up (planner)", url: "https://www.postgresql.org/docs/16/planner-optimizer.html", publisher: "PostgreSQL" },
    { title: "SQLite: Subqueries", url: "https://www.sqlite.org/lang_expr.html#subq", publisher: "Other" },
    { title: "SQLite: The IN and NOT IN operators", url: "https://www.sqlite.org/lang_expr.html#in_op", publisher: "Other" },
  ],
};
