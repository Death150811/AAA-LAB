import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
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

export const innerLeftJoins: Topic = {
  id: "sql.inner-left-joins",
  slug: "inner-left-joins",
  domain: "sql",
  module: "joins",
  title: "INNER и LEFT JOIN",
  titleEn: "INNER and LEFT JOIN",
  summary:
    "`JOIN` собирает факты из нескольких таблиц по связи между ними. `INNER JOIN` оставляет только пары, у которых есть совпадение; `LEFT JOIN` сохраняет все строки левой таблицы и подставляет `NULL`, если справа пары нет. Тема на замерах PostgreSQL 16.14 и SQLite 3.49 показывает, как условие соединения `ON` отличается от `WHERE` (условие на правую таблицу в `WHERE` превратило `LEFT JOIN` в `INNER`: вместо 8 клиентов — 4), как найти «клиентов без заказов» (Егор и Игорь) через `LEFT JOIN … IS NULL`, почему забытое условие даёт 104 строки вместо 13, как `NATURAL JOIN` по одноимённому `id` вернул 8 вместо 13 и как соединение размножает строки (13 заказов × позиции = 25 строк).",
  minutes: 80,
  prerequisites: ["sql.keys-constraints", "sql.select-where"],
  tags: ["JOIN", "INNER JOIN", "LEFT JOIN", "ON vs WHERE", "anti-join", "cardinality", "NATURAL JOIN", "USING", "table alias", "cross join by mistake", "Hash Join", "Nested Loop"],
  keyConcepts: [
    { term: "JOIN строит пары строк по условию", text: "`orders JOIN customers ON customers.id = orders.customer_id` соединяет заказ с его клиентом. Связь описывают внешним ключом, а соединение её **использует**." },
    { term: "INNER — только совпадения, LEFT — все слева", text: "`customers INNER JOIN orders` вернул 13 строк (только клиенты с заказами), `LEFT JOIN` — 15: добавились Егор и Игорь с `NULL` справа." },
    { term: "ON и WHERE — не одно и то же для LEFT JOIN", text: "`LEFT JOIN … ON … AND o.status = 'paid'` оставил всех 8 клиентов (у четверых 0 оплаченных), а то же условие в `WHERE` сократило результат до 4 клиентов." },
    { term: "Забытое условие — декартово произведение", text: "`FROM customers, orders` без `WHERE` вернул 8 × 13 = 104 строки; с условием связи — 13." },
    { term: "Соединение размножает строки", text: "13 заказов и 25 позиций дают 25 строк соединения: на одну строку заказа — столько строк, сколько позиций. Агрегаты по «одному» после такого соединения завышаются." },
  ],
  sections: [
    section("definition", [
      def("JOIN", "Операция соединения: для каждой пары строк двух источников, удовлетворяющей условию `ON`, формирует одну строку результата со столбцами обеих.", "join"),
      def("INNER JOIN", "Соединение «только совпадения»: строки без пары в другой таблице в результат не попадают. Слово `INNER` можно опустить.", "inner join"),
      def("LEFT JOIN", "Внешнее соединение: все строки левой таблицы сохраняются; если пары справа нет, столбцы правой таблицы равны `NULL`. Синоним — `LEFT OUTER JOIN`.", "left (outer) join"),
      def("Условие соединения", "Выражение в `ON` (или список столбцов в `USING`), определяющее, какие строки считаются парой; чаще всего — равенство внешнего ключа первичному.", "join condition"),
      def("Псевдоним таблицы", "Короткое имя (`customers AS c`), которое позволяет ссылаться на таблицу и различать столбцы с одинаковыми именами (`c.id`, `o.id`).", "table alias"),
      def("Антисоединение", "Выборка строк, для которых пары нет: `LEFT JOIN … WHERE правая.ключ IS NULL` или `NOT EXISTS`.", "anti-join"),
      def("Декартово произведение", "Все возможные пары строк двух таблиц (`CROSS JOIN`): M × N строк. Возникает и «по ошибке», если забыто условие соединения.", "Cartesian product"),
    ]),

    section("why", [
      h("Реляционные данные намеренно разбиты на таблицы"),
      p("Клиент хранится один раз, а его заказы — отдельно; товар — один раз, а позиции заказа ссылаются на него. Это защищает от дублирования и противоречий, но значит, что нужный ответ («кто купил что и на какую сумму») раскидан по нескольким таблицам. `JOIN` — способ собрать его обратно. Почти каждый отчёт в SQL — это соединения и фильтры."),
      ul(
        "**Выбор типа соединения определяет, какие строки вы потеряете или получите лишними:** «только клиенты с заказами» и «все клиенты, у кого заказов может не быть» — разные вопросы.",
        "**Самые частые ошибки отчётов** — потерянные строки (`INNER` вместо `LEFT`, условие в `WHERE`) и размноженные (соединение «один ко многим» перед агрегатом).",
        "**Производительность:** порядок и тип соединений определяет планировщик, но от вашего запроса зависит, сколько строк он вынужден рассмотреть.",
      ),
    ]),

    section("mental-model", [
      h("Две стопки карточек и правило «подходит ли пара»"),
      p("Возьмите стопку карточек-заказов и стопку карточек-клиентов. `INNER JOIN` — для каждого заказа найти карточку клиента, у которого `id` совпадает; если пары нет, заказ откладывается. `LEFT JOIN` — то же, но каждая левая карточка обязательно остаётся: если пары нет, к ней прикладывается «пустая» карточка с `NULL`."),
      diagram(
        `
        customers (левая)         orders (правая)
        ┌────┬───────┐            ┌────┬─────────────┐
        │  1 │ Анна  │───────────▶│  1 │ customer 1  │      INNER:   Анна—заказ 1, Анна—заказ 2, …
        │  1 │       │───────────▶│  2 │ customer 1  │      LEFT:    + Егор — NULL, Игорь — NULL
        │  6 │ Егор  │───── нет пары ───────────────        (левая карточка не теряется)
        │  8 │ Игорь │───── нет пары ───────────────
        └────┴───────┘            └────┴─────────────┘
        `,
        "Соединение сопоставляет каждую левую строку со всеми подходящими правыми; у `LEFT JOIN` левая строка без пары остаётся с `NULL` справа.",
      ),
      h("ON выбирает пары, WHERE — отбрасывает готовые строки"),
      p("`ON` участвует **в построении пар**: для `LEFT JOIN` левая строка сохранится, даже если ни одна правая не подошла. `WHERE` работает **после** соединения, по готовым строкам: условие на столбец правой таблицы отбросит строки с `NULL`, то есть и те самые «пустые» пары. Поэтому для внешних соединений условия, относящиеся к правой таблице, пишут в `ON`."),
      steps(
        [
          ["Выберите левую таблицу", "Ту, чьи строки обязаны остаться в результате (клиенты, товары)."],
          ["Опишите связь в ON", "`customers.id = orders.customer_id` — и условия, которые относятся к правой таблице."],
          ["Фильтруйте левую таблицу в WHERE", "Условия на левую таблицу безопасны в `WHERE`."],
          ["Проверьте число строк", "Сравните `count(*)` до и после соединения: ожидаемо ли размножение или потеря?"],
        ],
        "Как писать внешнее соединение",
      ),
    ]),

    section("technical", [
      h("Синтаксис"),
      table(
        ["Форма", "Результат", "Замечание"],
        [
          ["`A [INNER] JOIN B ON условие`", "Только пары, где условие истинно", "Основная форма"],
          ["`A LEFT [OUTER] JOIN B ON условие`", "Все строки `A`; без пары — `NULL` справа", "Для «есть ли связанные данные»"],
          ["`A JOIN B USING (col)`", "Соединение по равенству одноимённых столбцов", "Столбец `col` в результате один; безопаснее `NATURAL`"],
          ["`A NATURAL JOIN B`", "По **всем** одноимённым столбцам", "Опасно: добавление столбца с тем же именем меняет смысл запроса"],
          ["`FROM A, B WHERE …`", "Старый синтаксис: произведение + фильтр", "Забытое условие — декартово произведение"],
          ["`A CROSS JOIN B`", "Все пары (M × N)", "Календари × товары, генерация комбинаций"],
        ],
        "Формы соединений",
      ),
      h("Алгоритмы соединения"),
      ul(
        "**Nested Loop** — для каждой строки левой стороны ищем пары справа (эффективен, если справа есть индекс по ключу или мало строк).",
        "**Hash Join** — правую сторону загружают в хэш-таблицу по ключу, затем левую «пробегают» (хорош для больших несортированных наборов и равенства).",
        "**Merge Join** — обе стороны отсортированы по ключу и сливаются (хорош, если порядок уже есть: индекс или сортировка нужна всё равно).",
        "Выбор делает планировщик по статистике; вы можете помочь индексами и актуальной статистикой (`ANALYZE`).",
      ),
      h("Порядок записи и логика"),
      p("Для `INNER JOIN` порядок таблиц в тексте не важен логически: `A JOIN B` и `B JOIN A` дают те же строки (планировщик сам выберет порядок). Для `LEFT JOIN` порядок важен: сохраняется **левая** сторона."),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `-- Строки заказа 4 с названиями товаров и суммой по каждой позиции
SELECT o.id AS order_id, p.title, oi.qty, p.price, oi.qty * p.price AS line_total
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
JOIN products    AS p  ON p.id = oi.product_id
WHERE o.id = 4
ORDER BY p.title;`,
        [
          { line: 1, text: "Комментарий: что хотим получить — позиции заказа с названиями товаров и суммой строки." },
          { line: 2, text: "Список выбора берёт столбцы из трёх таблиц и вычисляет `qty * price`; псевдонимы `o`, `oi`, `p` различают таблицы." },
          { line: 3, text: "Начинаем с заказов." },
          { line: 4, text: "Первое соединение: позиции принадлежат заказу (`oi.order_id = o.id`)." },
          { line: 5, text: "Второе соединение: у каждой позиции есть товар (`p.id = oi.product_id`)." },
          { line: 6, text: "`WHERE o.id = 4` ограничивает результат одним заказом." },
          { line: 7, text: "`ORDER BY p.title` — порядок результата задан явно." },
        ],
        "02-three-tables.sql",
      ),
    ]),

    section("minimal-example", [
      p("Простейшее соединение: заказ плюс данные клиента. Нажмите «Выполнить в браузере» — набор «shop» создаётся автоматически."),
      code("sql", `SELECT o.id AS order_id, o.ordered_on, c.name AS customer, c.city
FROM orders AS o
INNER JOIN customers AS c ON c.id = o.customer_id
ORDER BY o.id
LIMIT 5;`, { filename: "01-inner.sql", runnable: true, fixture: "shop" }),
      code("text", ` order_id | ordered_on | customer |  city  
----------+------------+----------+--------
        1 | 2024-01-10 | Анна     | Москва
        2 | 2024-02-14 | Анна     | Москва
        3 | 2024-02-20 | Борис    | Казань
        4 | 2024-03-01 | Вера     | Москва
        5 | 2024-03-15 | Вера     | Москва
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Каждая строка — заказ, к которому присоединены имя и город его клиента. У Анны два заказа, поэтому она встречается дважды: соединение даёт по строке на **пару**."),
    ]),

    section("detailed-example", [
      p("Три таблицы в одном запросе: заказ → позиции → товары. Для заказа 4 получаем три строки с суммами, из которых легко посчитать итог (`2400 + 520 + 560 = 3480`)."),
      code("sql", `-- Строки заказа 4 с названиями товаров и суммой по каждой позиции
SELECT o.id AS order_id, p.title, oi.qty, p.price, oi.qty * p.price AS line_total
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
JOIN products    AS p  ON p.id = oi.product_id
WHERE o.id = 4
ORDER BY p.title;`, { filename: "02-three-tables.sql", runnable: true, fixture: "shop" }),
      code("text", ` order_id |       title        | qty |  price  | line_total 
----------+--------------------+-----+---------+------------
        4 | Кофе зерновой 1 кг |   2 | 1200.00 |    2400.00
        4 | Мёд 300 г          |   1 |  520.00 |     520.00
        4 | Печенье овсяное    |   4 |  140.00 |     560.00
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      h("LEFT JOIN: все клиенты, включая бездетных"),
      code("sql", `-- Все клиенты и число их заказов (ноль — тоже ответ)
SELECT c.id, c.name, count(o.id) AS orders
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY orders DESC, c.id;`, { filename: "03-left-join.sql", runnable: true, fixture: "shop" }),
      code("text", ` id | name  | orders 
----+-------+--------
  1 | Анна  |      4
  3 | Вера  |      3
  2 | Борис |      2
  5 | Дарья |      2
  4 | Глеб  |      1
  7 | Жанна |      1
  6 | Егор  |      0
  8 | Игорь |      0
(8 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Егор и Игорь присутствуют с нулём заказов: `count(o.id)` считает непустые значения `o.id`, а для клиентов без заказов справа `NULL`. `count(*)` дал бы 1 даже для них — одна строка с `NULL` справа. Это классическая ловушка: считайте по столбцу правой таблицы."),
      h("Антисоединение: у кого нет заказов"),
      code("sql", `-- Клиенты без единого заказа: LEFT JOIN + проверка «справа пусто»
SELECT c.id, c.name
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.id;`, { filename: "04-anti-join.sql", runnable: true, fixture: "shop" }),
      code("text", ` id | name  
----+-------
  6 | Егор
  8 | Игорь
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`LEFT JOIN … WHERE o.id IS NULL` оставляет только строки, у которых пары справа не нашлось — Егор и Игорь. Условие проверяют по **столбцу, который не бывает `NULL`** в настоящих данных (первичный ключ правой таблицы)."),
    ]),

    section("analysis", [
      table(
        ["Запрос", "Строк", "Что произошло"],
        [
          ["`orders`", "13", "Исходная таблица заказов"],
          ["`order_items`", "25", "Позиции заказов"],
          ["`orders JOIN order_items`", "25", "Каждая позиция имеет заказ: строк столько, сколько позиций"],
          ["`customers JOIN orders`", "13", "Только клиенты, у которых есть заказы (6 из 8)"],
          ["`customers LEFT JOIN orders`", "15", "13 пар + Егор и Игорь с `NULL`"],
          ["`FROM customers, orders` без условия", "104", "8 × 13: декартово произведение"],
        ],
        "Число строк в разных соединениях (замеры на наборе «shop»)",
      ),
      code("sql", `SELECT (SELECT count(*) FROM orders)                                                      AS orders,
       (SELECT count(*) FROM order_items)                                                 AS items,
       (SELECT count(*) FROM orders o JOIN order_items i ON i.order_id = o.id)            AS orders_join_items,
       (SELECT count(*) FROM customers c LEFT JOIN orders o ON o.customer_id = c.id)      AS customers_left_orders,
       (SELECT count(*) FROM customers c JOIN orders o ON o.customer_id = c.id)           AS customers_inner_orders;`, { filename: "08-cardinality.sql", runnable: true, fixture: "shop" }),
      code("text", ` orders | items | orders_join_items | customers_left_orders | customers_inner_orders 
--------+-------+-------------------+-----------------------+------------------------
     13 |    25 |                25 |                    15 |                     13
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "**Размножение:** соединение «один ко многим» даёт по строке на каждое «многое» — именно поэтому `count(*)` после соединения завышает число заказов.",
        "**Потеря:** `INNER JOIN` отбрасывает строки без пары (в замере: 15 − 13 = 2 клиента).",
        "**Сверка:** число строк после соединения всегда стоит сравнить с ожидаемым.",
      ),
    ]),

    section("internals", [
      h("План соединения"),
      p("PostgreSQL выбирает алгоритм по оценкам. На маленьких таблицах «shop» после `ANALYZE` оба запроса используют **Hash Join**: меньшая таблица (`customers` с фильтром) строится в хэш, большая сканируется последовательно."),
      code("sql", `ANALYZE;
EXPLAIN (COSTS OFF)
SELECT c.name, o.id
FROM customers AS c JOIN orders AS o ON o.customer_id = c.id
WHERE c.city = 'Москва';

EXPLAIN (COSTS OFF)
SELECT c.name, count(*) FROM customers AS c JOIN orders AS o ON o.customer_id = c.id JOIN order_items AS i ON i.order_id = o.id GROUP BY c.name;`, { filename: "09-join-plan.pg.sql" }),
      code("text", `                  QUERY PLAN                   
-----------------------------------------------
 Hash Join
   Hash Cond: (o.customer_id = c.id)
   ->  Seq Scan on orders o
   ->  Hash
         ->  Seq Scan on customers c
               Filter: (city = 'Москва'::text)
(6 rows)

                  QUERY PLAN                  
----------------------------------------------
 HashAggregate
   Group Key: c.name
   ->  Hash Join
         Hash Cond: (o.customer_id = c.id)
         ->  Hash Join
               Hash Cond: (i.order_id = o.id)
               ->  Seq Scan on order_items i
               ->  Hash
                     ->  Seq Scan on orders o
         ->  Hash
               ->  Seq Scan on customers c
(11 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Во втором плане три таблицы: сначала `order_items` соединяется с `orders`, затем результат — с `customers`; порядок в тексте запроса (`customers`, `orders`, `order_items`) планировщик изменил.",
        "`HashAggregate` — группировка по `name` хэшированием.",
        "На больших таблицах с индексами по внешним ключам планировщик выберет `Nested Loop` с индексным поиском или `Merge Join` — подробно в теме об индексах и планах.",
      ),
      h("Почему условие в WHERE ломает LEFT JOIN"),
      p("Логически `LEFT JOIN` сначала строит пары и добавляет «пустые» строки для левых без пары; затем `WHERE` отбрасывает строки, где условие не истинно. У «пустой» строки столбцы правой таблицы равны `NULL`, `NULL = 'paid'` неизвестно — строка отбрасывается. Планировщик понимает это и **заменяет `LEFT JOIN` на `INNER JOIN`** (так называемое упрощение внешнего соединения), поэтому результаты совпадают."),
    ]),

    section("mistakes", [
      h("Ошибка: условие правой таблицы в WHERE"),
      code("sql", `-- Условие на правую таблицу в ON: клиенты сохраняются, считаются только оплаченные заказы
SELECT c.name, count(o.id) AS paid_orders
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id AND o.status = 'paid'
GROUP BY c.id, c.name
ORDER BY c.id;

-- То же условие в WHERE: клиенты без оплаченных заказов исчезают — LEFT JOIN превратился в INNER
SELECT c.name, count(o.id) AS paid_orders
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.status = 'paid'
GROUP BY c.id, c.name
ORDER BY c.id;`, { filename: "05-where-vs-on.sql", runnable: true, fixture: "shop" }),
      code("text", ` name  | paid_orders 
-------+-------------
 Анна  |           3
 Борис |           1
 Вера  |           2
 Глеб  |           0
 Дарья |           0
 Егор  |           0
 Жанна |           1
 Игорь |           0
(8 rows)

 name  | paid_orders 
-------+-------------
 Анна  |           3
 Борис |           1
 Вера  |           2
 Жанна |           1
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Первый запрос с условием в `ON` вернул всех 8 клиентов (у Глеба, Дарьи, Егора и Игоря — 0 оплаченных). Второй, с тем же условием в `WHERE`, потерял четверых: для «пустых» строк `o.status` — `NULL`, условие не выполняется, строки отброшены. Результат — `INNER JOIN`, хотя написан `LEFT JOIN`."),
      h("Ошибка: забытое условие соединения"),
      code("sql", `-- Забытое условие превращает соединение в декартово произведение
SELECT count(*) AS customers_x_orders FROM customers, orders;
SELECT count(*) AS with_condition FROM customers AS c, orders AS o WHERE o.customer_id = c.id;`, { filename: "07-cross-by-mistake.sql", runnable: true, fixture: "shop" }),
      code("text", ` customers_x_orders 
--------------------
                104
(1 row)

 with_condition 
----------------
             13
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("104 = 8 × 13: каждая пара «клиент — заказ». С явным `JOIN … ON` забыть условие синтаксически труднее — ещё один довод против запятой в `FROM`."),
      h("Ошибка: NATURAL JOIN"),
      code("sql", `SELECT count(*) AS inner_on_customer_id
FROM customers AS c JOIN orders AS o ON o.customer_id = c.id;

-- NATURAL JOIN соединяет по ВСЕМ одноимённым столбцам. У обеих таблиц есть id — и он становится условием!
SELECT count(*) AS natural_join_rows
FROM customers NATURAL JOIN orders;`, { filename: "06-using-natural.sql", runnable: true, fixture: "shop" }),
      code("text", ` inner_on_customer_id 
----------------------
                   13
(1 row)

 natural_join_rows 
-------------------
                 8
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`NATURAL JOIN` соединил `customers` и `orders` по **обоим** одноимённым столбцам — по `id`, а не по `customer_id`: клиент 3 «получил» заказ 3, клиент 7 — заказ 7. Получилось 8 строк вместо 13, и все они неверны. Используйте явное `ON`."),
      h("Ошибка: count(*) вместо count(правая.ключ)"),
      wrongRight(
        "sql",
        { title: "Нули превращаются в единицы", code: `SELECT c.name, count(*) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name;`, note: "Для клиента без заказов есть одна строка с `NULL` справа: `count(*)` вернёт 1." },
        { title: "Считаем непустые значения", code: `SELECT c.name, count(o.id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name;`, note: "`count(o.id)` игнорирует `NULL`: для клиента без заказов — 0." },
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Соединения через запятую** (`FROM a, b WHERE …`) — легко потерять условие и получить произведение.",
        "**`NATURAL JOIN`** — смысл меняется при добавлении столбца.",
        "**`DISTINCT` для устранения «лишних» строк после соединения** без понимания причины.",
        "**`LEFT JOIN` с условием правой таблицы в `WHERE`.**",
        "**Соединение «по всему подряд»** без индексов по ключам на больших таблицах.",
        "**Соединение таблиц по нетипичным признакам** (имя, регистр, диапазоны) вместо ключей.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Всегда используйте явный `JOIN … ON`** и понятные псевдонимы (`c`, `o`, `oi`).",
        "**Условия правой таблицы в внешнем соединении — в `ON`**, условия левой — в `WHERE`.",
        "**Считайте по ключу правой таблицы** (`count(o.id)`), а не `count(*)`.",
        "**Сверяйте число строк** до и после соединений; ожидайте размножения при связи «один ко многим».",
        "**Индексируйте столбцы внешних ключей** (`orders.customer_id`) — на них опираются соединения.",
        "**Для «нет связанных данных»** используйте `NOT EXISTS` или `LEFT JOIN … IS NULL`.",
        "**Держите соединения читаемыми:** по одному на строку, условия связи рядом с таблицей.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**`NULL` в ключе соединения** не совпадает ни с чем (`NULL = NULL` неизвестно): строки с `NULL` в `customer_id` не соединятся при `INNER`/`LEFT` (для сравнения «как значения» — `IS NOT DISTINCT FROM`).",
        "**Несколько совпадений:** если справа несколько подходящих строк, левая строка повторяется для каждой.",
        "**Условие в `ON` не по равенству:** допустимы неравенства и диапазоны (`o.ordered_on >= c.signed_up`) — но это нетипично и медленно.",
        "**`LEFT JOIN` цепочкой:** каждое следующее соединение применяется к результату предыдущего; условия на «пустые» строки нужно писать аккуратно (см. challenge).",
        "**Порядок `JOIN` и `LEFT JOIN`** в одном запросе влияет на результат: сначала внутренние, потом внешние — обычно безопаснее.",
        "**`USING (col)`** возвращает один столбец `col`; `ON a.col = b.col` — оба.",
      ),
    ]),

    section("related", [
      ul(
        "[Ключи и ограничения](/learn/sql/keys-constraints) — внешние ключи, по которым строятся соединения.",
        "[Агрегаты, GROUP BY и HAVING](/learn/sql/group-by-having) — агрегаты после соединений.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Запятая и фильтр",
          code: `
            SELECT c.name, o.id
            FROM customers c, orders o
            WHERE o.customer_id = c.id AND o.status = 'paid';
          `,
          note: "Связь и фильтр смешаны в `WHERE`; при редактировании легко потерять условие связи и получить произведение.",
        },
        {
          title: "Явный JOIN",
          code: `
            SELECT c.name, o.id
            FROM customers AS c
            JOIN orders AS o ON o.customer_id = c.id
            WHERE o.status = 'paid';
          `,
          note: "Связь описана в `ON`, фильтр — в `WHERE`: читается как «клиенты и их оплаченные заказы».",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.inner-left-joins.ex1",
      title: "Предскажите число строк",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская, определите результат каждого запроса. Помните: в `order_items` 25 строк, а один товар (Термокружка) не продавался ни разу."),
        code("sql", `SELECT count(*) FROM products p JOIN order_items oi ON oi.product_id = p.id;
SELECT count(*) FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id;
SELECT p.title FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id WHERE oi.order_id IS NULL;
SELECT count(DISTINCT p.id) FROM products p JOIN order_items oi ON oi.product_id = p.id;`, { filename: "10-ex-predict.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["Сколько строк даёт соединение «товар — позиция», если у каждой позиции есть товар?", "Что добавляет `LEFT JOIN` для товаров без позиций?", "Как найти левые строки без пары?"],
      checks: ["Первый: 25", "Второй: 26 (25 + товар без продаж)", "Третий: Термокружка", "Четвёртый: 9 различных проданных товаров"],
      solution: [
        code("text", ` count 
-------
    25
(1 row)

 count 
-------
    26
(1 row)

    title    
-------------
 Термокружка
(1 row)

 count 
-------
     9
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "`INNER JOIN` даёт столько строк, сколько позиций заказов (25): у каждой позиции ровно один товар.",
          "`LEFT JOIN` добавляет одну строку для товара без позиций — 26.",
          "`WHERE oi.order_id IS NULL` оставляет левые строки без пары: «Термокружка».",
          "Различных проданных товаров 9 из 10.",
        ),
      ],
    }),
    exercise({
      id: "sql.inner-left-joins.ex2",
      title: "Пропали клиенты без отменённых заказов",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Нужно показать всех клиентов и число их **отменённых** заказов (у большинства — 0). Запрос возвращает только двух клиентов. Объясните причину и исправьте."),
        code("sql", `-- Нужно: все клиенты и число их ОТМЕНЁННЫХ заказов (у многих — 0). Получаем только двоих:
SELECT c.name, count(o.id) AS cancelled_orders
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.status = 'cancelled'
GROUP BY c.id, c.name
ORDER BY c.id;`, { filename: "11-ex-fix.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["Что содержит `o.status` для клиентов без заказов?", "Где должно стоять условие на правую таблицу при `LEFT JOIN`?"],
      checks: ["Причина: условие в `WHERE` отбросило «пустые» строки", "Исправление: перенести условие в `ON`", "Восемь клиентов, у Веры и Дарьи по 1"],
      solution: [
        code("sql", `SELECT c.name, count(o.id) AS cancelled_orders
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id AND o.status = 'cancelled'
GROUP BY c.id, c.name
ORDER BY c.id;`, { filename: "12-fix-solution.sql", runnable: true, fixture: "shop" }),
        code("text", ` name  | cancelled_orders 
-------+------------------
 Анна  |                0
 Борис |                0
 Вера  |                1
 Глеб  |                0
 Дарья |                1
 Егор  |                0
 Жанна |                0
 Игорь |                0
(8 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("В `ON` условие участвует в подборе пар: клиенты без отменённых заказов сохраняются с `NULL` справа и `count(o.id) = 0`. В `WHERE` те же строки были бы отброшены (`NULL = 'cancelled'` неизвестно)."),
      ],
    }),
    exercise({
      id: "sql.inner-left-joins.ex3",
      title: "Продажи по товарам с нулями",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Для каждого из десяти товаров выведите число проданных штук в **неотменённых** заказах, включая товары без продаж (0). Попытка с двумя `LEFT JOIN` и условием в `WHERE` потеряла Чайник (он продан только в отменённом заказе) — найдите причину и напишите верный запрос."),
      ],
      hints: ["Какие строки получают `NULL` в `o.id` — и почему `WHERE` их отбрасывает?", "Как сначала получить «проданные в неотменённых», а потом присоединить к товарам?"],
      checks: ["Все 10 товаров в результате", "Чайник и Термокружка — 0", "Печенье — 9, Сахар — 8, Кофе — 7"],
      solution: [
        code("sql", `-- Корректный вариант: считаем только строки из неотменённых заказов, сохраняя товары без продаж
SELECT p.id, p.title, COALESCE(sum(sold.qty), 0) AS sold
FROM products AS p
LEFT JOIN (
  SELECT oi.product_id, oi.qty
  FROM order_items AS oi JOIN orders AS o ON o.id = oi.order_id AND o.status <> 'cancelled'
) AS sold ON sold.product_id = p.id
GROUP BY p.id, p.title
ORDER BY sold DESC, p.id;`, { filename: "14-challenge-fix.sql", runnable: true, fixture: "shop" }),
        code("text", ` id |        title        | sold 
----+---------------------+------
  6 | Печенье овсяное     |    9
  5 | Сахар 1 кг          |    8
  1 | Кофе зерновой 1 кг  |    7
  2 | Чай чёрный 100 г    |    6
  3 | Кружка керамическая |    5
  9 | Какао 250 г         |    5
  7 | Мёд 300 г           |    3
  4 | Френч-пресс         |    2
  8 | Чайник стальной     |    0
 10 | Термокружка         |    0
(10 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Подзапрос `sold` содержит только позиции неотменённых заказов; `LEFT JOIN` от товаров сохраняет все 10 строк, а `COALESCE(sum(...), 0)` превращает `NULL` в 0. Вариант с условием `WHERE o.id IS NOT NULL OR oi.order_id IS NULL` теряет Чайник: его единственная позиция относится к отменённому заказу, поэтому у неё `o.id` — `NULL`, но `oi.order_id` не `NULL`."),
      ],
    }),
  ],

  challenge: {
    id: "sql.inner-left-joins.challenge",
    title: "Отчёт «клиенты и покупки» без потерь",
    scenario: [
      p("Менеджер просит единый отчёт: каждый клиент, число его оплаченных заказов и сумма оплаченных покупок. Клиенты без оплаченных заказов должны остаться в отчёте с нулями. Прежний отчёт терял четверых клиентов и завышал число заказов."),
    ],
    requirements: [
      "Все 8 клиентов в результате",
      "Число оплаченных заказов (`count(DISTINCT o.id)`) и сумма `sum(oi.qty * p.price)` по оплаченным заказам",
      "Для клиентов без оплаченных заказов — 0 заказов и сумма 0",
      "Порядок: по сумме по убыванию, затем по имени",
    ],
    constraints: [
      "Условие `status = 'paid'` — в `ON`, а не в `WHERE`",
      "Заказ с несколькими позициями учитывается один раз",
    ],
    acceptance: [
      "Анна: 3 заказа, 4400; Вера: 2, 4210; Жанна: 1, 2150; Борис: 1, 1420 — именно в таком порядке",
      "Глеб, Дарья, Егор, Игорь — 0 заказов и сумма 0",
    ],
    hints: [
      "Цепочка `LEFT JOIN orders ON … AND status = 'paid'` → `LEFT JOIN order_items` → `LEFT JOIN products`.",
      "`COALESCE(sum(…), 0)` для сумм.",
    ],
    solution: [
      code("sql", `SELECT c.name,
       count(DISTINCT o.id)                AS paid_orders,
       COALESCE(sum(oi.qty * p.price), 0)  AS paid_total
FROM customers AS c
LEFT JOIN orders      AS o  ON o.customer_id = c.id AND o.status = 'paid'
LEFT JOIN order_items AS oi ON oi.order_id = o.id
LEFT JOIN products    AS p  ON p.id = oi.product_id
GROUP BY c.id, c.name
ORDER BY paid_total DESC, c.name;`, { filename: "15-challenge.sql", runnable: true, fixture: "shop" }),
      code("text", ` name  | paid_orders | paid_total 
-------+-------------+------------
 Анна  |           3 |    4400.00
 Вера  |           2 |    4210.00
 Жанна |           1 |    2150.00
 Борис |           1 |    1420.00
 Глеб  |           0 |          0
 Дарья |           0 |          0
 Егор  |           0 |          0
 Игорь |           0 |          0
(8 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Условие по статусу в `ON` сохраняет всех клиентов; `count(DISTINCT o.id)` защищает от размножения позициями; `COALESCE` превращает отсутствующие суммы в 0. Сверка: сумма по клиентам равна сумме по оплаченным заказам без группировки."),
    ],
  },

  interview: [
    iq("sql.inner-left-joins.i1", "basic", "Чем INNER JOIN отличается от LEFT JOIN?", [
      ul(
        "`INNER JOIN` оставляет только строки, у которых есть совпадение с обеих сторон.",
        "`LEFT JOIN` сохраняет все строки левой таблицы; если пары справа нет, столбцы правой — `NULL`.",
        "В замере `customers JOIN orders` — 13 строк, `LEFT JOIN` — 15 (добавились два клиента без заказов).",
      ),
    ]),
    iq("sql.inner-left-joins.i2", "basic", "Как найти записи одной таблицы, у которых нет связанных записей в другой?", [
      ul(
        "`LEFT JOIN … WHERE правая.ключ IS NULL`.",
        "`NOT EXISTS (SELECT 1 FROM … WHERE …)` — часто читается лучше.",
        "Избегайте `NOT IN` с подзапросом, возвращающим `NULL`.",
      ),
    ]),
    iq("sql.inner-left-joins.i3", "intermediate", "В чём разница между условием в ON и в WHERE для LEFT JOIN?", [
      ul(
        "`ON` участвует в подборе пар: левая строка сохраняется, даже если пары нет.",
        "`WHERE` фильтрует готовые строки: условие по правой таблице отбросит «пустые» строки с `NULL` — и `LEFT JOIN` превратится в `INNER`.",
        "В замере то же условие по статусу: в `ON` — 8 клиентов, в `WHERE` — 4.",
      ),
    ]),
    iq("sql.inner-left-joins.i4", "intermediate", "Почему count(*) после LEFT JOIN показывает 1 для клиента без заказов?", [
      ul(
        "Для клиента без заказов результат содержит одну строку с `NULL` справа; `count(*)` считает строки.",
        "`count(o.id)` игнорирует `NULL` и вернёт 0.",
        "Всегда считайте по столбцу правой таблицы, который не бывает `NULL` в настоящих данных.",
      ),
    ]),
    iq("sql.inner-left-joins.i5", "intermediate", "Почему NATURAL JOIN считается опасным?", [
      ul(
        "Соединяет по всем одноимённым столбцам: у `customers` и `orders` есть `id`, поэтому условие — `customers.id = orders.id`, а не по внешнему ключу.",
        "В замере 8 неверных строк вместо 13.",
        "Добавление столбца с тем же именем в одну из таблиц молча меняет результат. Используйте явное `ON` или `USING (…)`.",
      ),
    ]),
    iq("sql.inner-left-joins.i6", "advanced", "Какие алгоритмы соединения использует PostgreSQL и когда?", [
      ul(
        "Nested Loop: левая строка → поиск справа (индекс); хорош для небольших левых наборов и индексированных правых.",
        "Hash Join: хэш-таблица по одной стороне, проход по другой; хорош для равенства на больших несортированных наборах (в замере на «shop»).",
        "Merge Join: слияние отсортированных входов; хорош, если порядок уже есть (индекс) или нужен для `ORDER BY`.",
        "Выбор — по статистике (`ANALYZE`) и стоимости.",
      ),
    ]),
    iq("sql.inner-left-joins.i7", "engineering", "Как защитить отчёт от размножения строк при соединении «один ко многим»?", [
      ul(
        "`count(DISTINCT id)` для счёта сущностей «одного» после соединения.",
        "Агрегировать «многое» до соединения (подзапрос `GROUP BY order_id`), затем соединять агрегат.",
        "Использовать `EXISTS`/`IN` вместо `JOIN`, если нужны только факт наличия.",
        "Контрольные суммы: итог по группам = итог без соединения.",
      ),
    ]),
    iq("sql.inner-left-joins.i8", "debugging", "Запрос с LEFT JOIN неожиданно возвращает меньше строк, чем в левой таблице. Что проверить?", [
      ul(
        "Условие на правую таблицу в `WHERE` (должно быть в `ON`).",
        "`INNER JOIN` в цепочке после `LEFT JOIN`: следующее внутреннее соединение отбрасывает «пустые» строки.",
        "Фильтр по правой таблице в `HAVING`/`DISTINCT`.",
        "Сравнить `count(*)` левой таблицы и результата, найти исчезнувшие ключи через антисоединение.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.inner-left-joins.e1", "foundation", "Какие строки вернёт `INNER JOIN`?", ["Все строки левой таблицы", "Все строки обеих таблиц", "Только пары с совпадением по условию", "Только строки без совпадений"], 2, "`INNER JOIN` оставляет пары, для которых условие `ON` истинно."),
    mcq("sql.inner-left-joins.e2", "foundation", "Что будет в столбцах правой таблицы для строки левой без пары при `LEFT JOIN`?", ["`NULL`", "`0`", "Пустая строка", "Ошибка"], 0, "Для левой строки без пары правые столбцы равны `NULL`."),
    mcq("sql.inner-left-joins.e3", "foundation", "Сколько строк вернёт `FROM customers, orders` без условия при 8 клиентах и 13 заказах?", ["13", "21", "8", "104"], 3, "Декартово произведение: 8 × 13 = 104 (замер)."),
    mcq("sql.inner-left-joins.e4", "intermediate", "Куда поместить условие `o.status = 'cancelled'`, чтобы сохранить всех клиентов при `LEFT JOIN`?", ["В `WHERE`", "В `ON`", "В `HAVING`", "В `ORDER BY`"], 1, "Условие правой таблицы в `ON` участвует в подборе пар и не отбрасывает «пустые» строки."),
    mcq("sql.inner-left-joins.e5", "intermediate", "Какие запросы найдут клиентов без заказов? Выберите все.", ["`LEFT JOIN orders o ON … WHERE o.id IS NULL`", "`WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)`", "`INNER JOIN orders` ... `WHERE o.id IS NULL`", "`WHERE c.id NOT IN (SELECT customer_id FROM orders)` при `NOT NULL`-ключе"], [0, 1, 3], "`INNER JOIN` не вернёт клиентов без пары; остальные три варианта корректны (последний — если в подзапросе нет `NULL`)."),
    mcq("sql.inner-left-joins.e6", "intermediate", "Что вернёт `count(*)` для клиента без заказов в `customers LEFT JOIN orders … GROUP BY c.id`?", ["0", "Ошибка", "`NULL`", "1"], 3, "В группе одна строка с `NULL` справа; `count(*)` считает строки, `count(o.id)` — 0."),
    mcq("sql.inner-left-joins.e7", "advanced", "Почему `NATURAL JOIN` `customers` и `orders` вернул 8 строк вместо 13?", ["Из-за дублей в таблицах", "Потому что клиентов 8", "Соединил по одноимённому `id`, а не по `customer_id`", "Из-за `NULL` в `city`"], 2, "У обеих таблиц есть `id`: условие `customers.id = orders.id` даёт 8 несвязанных пар."),
    open("sql.inner-left-joins.e8", "intermediate", "Объясните, почему условие `WHERE o.status = 'paid'` после `LEFT JOIN orders o` фактически превращает его в `INNER JOIN`, и как сохранить всех клиентов.", [
      ul(
        "Для клиентов без заказов правая часть — строка из `NULL`; `NULL = 'paid'` неизвестно, поэтому `WHERE` отбрасывает эти строки.",
        "Остаются только клиенты с оплаченными заказами — это результат `INNER JOIN`; планировщик тоже упрощает внешнее соединение.",
        "Исправление: условие в `ON` — `LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'`; клиенты без таких заказов сохранятся с `NULL`.",
        "Для подсчёта используйте `count(o.id)`.",
      ),
    ], ["Объяснена роль NULL в WHERE", "Названо упрощение до INNER", "Предложено условие в ON", "Упомянут count(o.id)"], { format: "sql" }),
  ],

  mastery: [
    mcq("sql.inner-left-joins.m1", "intermediate", "Сколько строк вернёт `products LEFT JOIN order_items` на наборе «shop» (10 товаров, 25 позиций, один товар не продавался)?", ["25", "26", "10", "35"], 1, "Каждая позиция даёт строку (25) плюс одна строка для товара без позиций: 26 (замер)."),
    mcq("sql.inner-left-joins.m2", "advanced", "Какой план PostgreSQL выбрал для соединения `customers` (с фильтром по городу) и `orders` на маленьких таблицах после `ANALYZE`?", ["Hash Join", "Merge Join", "Nested Loop по индексу", "Cross Join"], 0, "В замере — `Hash Join`: меньшая таблица строится в хэш, большая сканируется."),
    mcq("sql.inner-left-joins.m3", "advanced", "Почему в запросе «товары и продано штук в неотменённых заказах» с `WHERE o.id IS NOT NULL OR oi.order_id IS NULL` пропал Чайник?", ["У Чайника нет цены", "Из-за `COALESCE`", "Его позиция только в отменённом заказе: `o.id` — `NULL`, а `oi.order_id` — нет, поэтому условие ложно", "Из-за `GROUP BY`"], 2, "Условие отбросило строку «позиция есть, но её заказ отменён»; верное решение — подзапрос с неотменёнными позициями."),
    open("sql.inner-left-joins.m4", "advanced", "Отчёт «число заказов по клиентам» через `LEFT JOIN` показывает одну единицу у клиентов без заказов, а у клиентов с позициями завышает числа. Объясните обе причины и перепишите запрос.", [
      ul(
        "Единицы: `count(*)` считает строку с `NULL` справа; нужно `count(o.id)`.",
        "Завышение: соединение с позициями размножает заказ по числу позиций; нужно `count(DISTINCT o.id)` или не соединять позиции вовсе, если они не нужны.",
        "Запрос: `SELECT c.id, c.name, count(DISTINCT o.id) FROM customers c LEFT JOIN orders o ON o.customer_id = c.id [LEFT JOIN order_items i ON i.order_id = o.id] GROUP BY c.id, c.name`.",
        "Проверка: сумма по клиентам равна `count(*)` заказов; для клиентов без заказов — 0.",
      ),
    ], ["Названа причина единиц", "Названа причина завышения", "Исправленный запрос", "Контрольная сверка"], { format: "sql" }),
  ],

  flashcards: [
    { id: "sql.inner-left-joins.f1", front: "INNER и LEFT JOIN?", back: "INNER — только совпадения. LEFT — все строки левой, без пары справа — NULL." },
    { id: "sql.inner-left-joins.f2", front: "ON и WHERE в LEFT JOIN?", back: "Условия правой таблицы — в ON. В WHERE они отбросят NULL-строки и превратят LEFT в INNER." },
    { id: "sql.inner-left-joins.f3", front: "Антисоединение?", back: "LEFT JOIN … WHERE правая.pk IS NULL или NOT EXISTS: строки без пары." },
    { id: "sql.inner-left-joins.f4", front: "count после LEFT JOIN?", back: "count(правая.pk), а не count(*): count(*) считает строку с NULL как 1." },
    { id: "sql.inner-left-joins.f5", front: "NATURAL JOIN?", back: "Соединяет по всем одноимённым столбцам (например id). Опасно; используйте ON/USING." },
    { id: "sql.inner-left-joins.f6", front: "Забытое условие?", back: "FROM a, b без WHERE = M × N строк (8 × 13 = 104)." },
    { id: "sql.inner-left-joins.f7", front: "Размножение строк?", back: "Связь «один ко многим»: строка «одного» повторяется по числу «многих». count(DISTINCT id)." },
    { id: "sql.inner-left-joins.f8", front: "Алгоритмы JOIN?", back: "Nested Loop (индекс), Hash Join (равенство, большие наборы), Merge Join (отсортированные входы)." },
  ],

  sources: [
    { title: "PostgreSQL 16: Joined Tables", url: "https://www.postgresql.org/docs/16/queries-table-expressions.html#QUERIES-JOIN", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Tutorial — Joins Between Tables", url: "https://www.postgresql.org/docs/16/tutorial-join.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Planner/Optimizer — Join Strategies", url: "https://www.postgresql.org/docs/16/planner-optimizer.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Using EXPLAIN", url: "https://www.postgresql.org/docs/16/using-explain.html", publisher: "PostgreSQL" },
    { title: "SQLite: JOIN clause", url: "https://www.sqlite.org/syntax/join-clause.html", publisher: "Other" },
    { title: "SQLite: The LEFT JOIN strength reduction optimization", url: "https://www.sqlite.org/optoverview.html#leftjoinreduction", publisher: "Other" },
  ],
};
