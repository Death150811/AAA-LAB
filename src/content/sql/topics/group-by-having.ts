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
  diagram,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const groupByHaving: Topic = {
  id: "sql.group-by-having",
  slug: "group-by-having",
  domain: "sql",
  module: "queries",
  title: "Агрегаты, GROUP BY и HAVING",
  titleEn: "Aggregates, GROUP BY and HAVING",
  summary:
    "Агрегатные функции сворачивают много строк в одно значение, `GROUP BY` делает это отдельно для каждой группы, `WHERE` отбирает строки до группировки, а `HAVING` — группы после неё. Тема на замерах PostgreSQL 16.14 и SQLite 3.49 показывает, как посчитать число, сумму, среднее, минимум и максимум (10 товаров, сумма 8220, среднее 822), почему PostgreSQL отвергает «голый» столбец вне `GROUP BY` (а SQLite его молча принимает), чем `WHERE price >= 250` отличается от `HAVING count(*) >= 3`, как `FILTER` заменяет серию `CASE`, что возвращают агрегаты на пустом наборе (`count = 0`, остальное `NULL`) и как `ROLLUP` добавляет итоговые строки.",
  minutes: 75,
  prerequisites: ["sql.select-where", "sql.data-types-null"],
  tags: ["GROUP BY", "HAVING", "aggregate", "count", "sum", "avg", "min", "max", "FILTER", "ROLLUP", "string_agg", "group_concat", "grouping", "WHERE vs HAVING"],
  keyConcepts: [
    { term: "Агрегат сворачивает группу в одно значение", text: "`count`, `sum`, `avg`, `min`, `max` читают много строк и возвращают одно значение. Без `GROUP BY` вся таблица — одна группа: в замере 10 товаров дали `sum = 8220.00` и `avg = 822`." },
    { term: "GROUP BY — одна строка на группу", text: "Результат содержит ровно по строке на каждое значение ключа: три категории — три строки (3, 4 и 3 товара)." },
    { term: "WHERE до группировки, HAVING после", text: "`WHERE price >= 250` отбирает строки, `HAVING count(*) >= 3` — группы. Агрегаты в `WHERE` недопустимы." },
    { term: "Каждый столбец — в GROUP BY или в агрегате", text: "PostgreSQL отвергает `SELECT category, title, max(price) … GROUP BY category` (какой `title`?). SQLite принимает и выбирает значение из какой-то строки группы." },
    { term: "Пустой набор: одна строка или ни одной", text: "Агрегат без `GROUP BY` на пустом наборе возвращает одну строку (`count = 0`, `sum = NULL`); с `GROUP BY` — ноль строк." },
  ],
  sections: [
    section("definition", [
      def("Агрегатная функция", "Функция, которая принимает набор значений и возвращает одно: `count`, `sum`, `avg`, `min`, `max`, `string_agg`. `NULL` игнорируются (кроме `count(*)`).", "aggregate function"),
      def("GROUP BY", "Разбивает строки на группы по значениям ключа (одного или нескольких выражений); агрегаты вычисляются отдельно для каждой группы.", "GROUP BY"),
      def("HAVING", "Условие, применяемое к группам после вычисления агрегатов: `HAVING count(*) >= 3`.", "HAVING"),
      def("FILTER", "Дополнение к агрегату: `count(*) FILTER (WHERE status = 'paid')` учитывает только строки, удовлетворяющие условию (PostgreSQL 9.4+, SQLite 3.30+).", "FILTER clause"),
      def("Группировочный ключ", "Выражение в `GROUP BY`: все строки с одинаковым значением ключа попадают в одну группу; `NULL` образуют отдельную группу.", "grouping key"),
      def("ROLLUP / GROUPING SETS", "Расширения PostgreSQL: добавляют итоговые строки (по категориям и общий итог) к результату группировки.", "ROLLUP / GROUPING SETS"),
      def("Мера и измерение", "Мера — то, что считают (`sum(price)`), измерение — то, по чему разбивают (`category`, месяц). Отчёт — это «меры по измерениям».", "measure / dimension"),
    ]),

    section("why", [
      h("От строк к ответам"),
      p("Бизнес спрашивает не про отдельные заказы, а про итоги: «сколько продаж по месяцам», «какие категории приносят больше всего», «у каких клиентов больше двух заказов». Всё это — группировка и агрегаты. Именно здесь запросы чаще всего дают **правдоподобно неверные** числа: пропущенный фильтр до группировки, агрегат после `JOIN`, который размножил строки, `NULL` в среднем."),
      ul(
        "**Отчёты:** суммы, средние, доли, топы — на агрегатах строится вся аналитика.",
        "**Корректность:** `WHERE` или `HAVING`, `count(*)` или `count(DISTINCT …)`, `avg` с `NULL` или без — каждый выбор меняет число.",
        "**Производительность:** лучше отфильтровать строки в `WHERE` до группировки, чем в `HAVING` после.",
        "**Переносимость:** SQLite и PostgreSQL по-разному относятся к «голым» столбцам.",
      ),
    ]),

    section("mental-model", [
      h("Три шага: отобрать, разбить, свернуть"),
      p("Представьте стопку карточек-заказов. `WHERE` убирает ненужные карточки. `GROUP BY` раскладывает оставшиеся по пачкам с одинаковым ключом. Агрегат превращает каждую пачку в одну карточку-итог (`count`, `sum`). `HAVING` убирает итоги, которые вам не подходят. Именно в таком порядке."),
      diagram(
        `
        products (10 строк)
          │  WHERE price >= 250          ← отбор строк
          ▼
        8 строк
          │  GROUP BY category           ← пачки
          ▼
        напитки: 3 строки   посуда: 4 строки   продукты: 1 строка
          │  count(*), avg(price)        ← свёртка пачек
          ▼
        (напитки, 3, 610)  (посуда, 4, 1410)  (продукты, 1, 520)
          │  HAVING count(*) >= 3        ← отбор итогов
          ▼
        итог
        `,
        "Условие по строкам (`WHERE`) сокращает входные данные; условие по итогам (`HAVING`) — выходные.",
      ),
      h("Правило «каждый столбец — в ключе или в агрегате»"),
      p("После свёртки группы в одну строку остаётся один `category`, но много разных `title`. Какой показать? Стандарт SQL отвечает: **никакой, если вы не указали**. Поэтому в списке выбора разрешены только ключи группировки и агрегаты (а ещё столбцы, функционально зависящие от ключа — например, всё, если ключ — `PRIMARY KEY`)."),
    ]),

    section("technical", [
      h("Стандартные агрегаты"),
      table(
        ["Функция", "Результат", "NULL", "Пустой набор"],
        [
          ["`count(*)`", "Число строк", "Считает строки", "`0`"],
          ["`count(x)`", "Число непустых значений", "Пропускает", "`0`"],
          ["`count(DISTINCT x)`", "Число различных непустых значений", "Пропускает", "`0`"],
          ["`sum(x)`", "Сумма", "Пропускает", "`NULL`"],
          ["`avg(x)`", "Среднее", "Пропускает", "`NULL`"],
          ["`min(x)`, `max(x)`", "Минимум, максимум", "Пропускает", "`NULL`"],
          ["`string_agg(x, sep)` (PostgreSQL) / `group_concat(x, sep)` (SQLite)", "Склейка значений", "Пропускает", "`NULL`"],
        ],
        "Агрегаты и NULL",
      ),
      h("WHERE, GROUP BY, HAVING"),
      ul(
        "**`WHERE`** работает со строками до группировки: агрегатов в нём нет и быть не может.",
        "**`GROUP BY`** принимает столбцы и выражения (`substr(…, 1, 7)`, `date_trunc('month', …)`); в PostgreSQL можно ссылаться на псевдоним или номер столбца.",
        "**`HAVING`** работает с группами: агрегаты и ключи; условия только по ключам лучше переносить в `WHERE` — отфильтровать строки раньше дешевле.",
        "**Порядок вычисления:** `FROM` → `WHERE` → `GROUP BY` → агрегаты → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`.",
      ),
      h("Расширения группировки (PostgreSQL)"),
      ul(
        "`GROUP BY ROLLUP (a, b)` — группы по `(a, b)`, по `a` и общий итог.",
        "`GROUP BY CUBE (a, b)` — все комбинации ключей.",
        "`GROUP BY GROUPING SETS ((a), (b), ())` — произвольный набор группировок одним запросом.",
        "`grouping(a)` помогает отличить настоящий `NULL` в данных от «итогового» `NULL`.",
      ),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `-- WHERE фильтрует строки ДО группировки, HAVING — группы ПОСЛЕ неё
SELECT category, count(*) AS products, avg(price) AS average
FROM products
WHERE price >= 250
GROUP BY category
HAVING count(*) >= 3
ORDER BY category;`,
        [
          { line: 1, text: "Комментарий формулирует главное: `WHERE` — до группировки, `HAVING` — после." },
          { line: 2, text: "Список выбора: ключ группировки `category` и два агрегата. Других столбцов быть не должно." },
          { line: 3, text: "`FROM products` — источник строк." },
          { line: 4, text: "`WHERE price >= 250` отбрасывает дешёвые товары **до** группировки: Сахар (90) и Печенье (140) в группы не попадают." },
          { line: 5, text: "`GROUP BY category` — одна строка результата на каждую категорию из оставшихся." },
          { line: 6, text: "`HAVING count(*) >= 3` оставляет только группы с тремя и более строками." },
          { line: 7, text: "`ORDER BY category` задаёт порядок результата." },
        ],
        "03-having.sql",
      ),
    ]),

    section("minimal-example", [
      p("Без `GROUP BY` вся таблица — одна группа, и результат — одна строка с итогами. Нажмите «Выполнить» — в песочнице те же числа."),
      code("sql", `SELECT count(*)    AS products,
       min(price)  AS cheapest,
       max(price)  AS most_expensive,
       sum(price)  AS total,
       avg(price)  AS average
FROM products;`, { filename: "01-aggregates.sql", runnable: true, fixture: "shop" }),
      code("text", ` products | cheapest | most_expensive |  total  |       average        
----------+----------+----------------+---------+----------------------
       10 |    90.00 |        2300.00 | 8220.00 | 822.0000000000000000
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Десять товаров, самый дешёвый — 90.00, самый дорогой — 2300.00, сумма цен 8220.00, среднее 822. Среднее в PostgreSQL выводится с шестнадцатью знаками (`numeric`); значение — 822."),
    ]),

    section("detailed-example", [
      p("Теперь та же таблица по категориям: `GROUP BY` разбивает товары на три группы, и каждая получает свои итоги."),
      code("sql", `SELECT category,
       count(*)   AS products,
       min(price) AS cheapest,
       max(price) AS most_expensive,
       avg(price) AS average
FROM products
GROUP BY category
ORDER BY category;`, { filename: "02-group-by.sql", runnable: true, fixture: "shop" }),
      code("text", ` category | products | cheapest | most_expensive |        average        
----------+----------+----------+----------------+-----------------------
 напитки  |        3 |   250.00 |        1200.00 |  610.0000000000000000
 посуда   |        4 |   450.00 |        2300.00 | 1410.0000000000000000
 продукты |        3 |    90.00 |         520.00 |  250.0000000000000000
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Три строки — по числу категорий; 3 + 4 + 3 = 10 товаров. Добавим условия: `WHERE` убирает дешёвые товары до группировки, `HAVING` оставляет только крупные группы:"),
      code("sql", `-- WHERE фильтрует строки ДО группировки, HAVING — группы ПОСЛЕ неё
SELECT category, count(*) AS products, avg(price) AS average
FROM products
WHERE price >= 250
GROUP BY category
HAVING count(*) >= 3
ORDER BY category;`, { filename: "03-having.sql", runnable: true, fixture: "shop" }),
      code("text", ` category | products |        average        
----------+----------+-----------------------
 напитки  |        3 |  610.0000000000000000
 посуда   |        4 | 1410.0000000000000000
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Категория «продукты» после `WHERE price >= 250` осталась с одним товаром (520), и `HAVING count(*) >= 3` её отбросил; «напитки» (3) и «посуда» (4) прошли. Обратите внимание, что средние не изменились: `250` — самый дешёвый напиток и подходит под `price >= 250`."),
    ]),

    section("analysis", [
      table(
        ["Условие", "Где", "Результат на «shop»"],
        [
          ["`WHERE price >= 250`", "До группировки", "Из 10 товаров остаётся 8"],
          ["`GROUP BY category`", "Разбиение", "3 группы: напитки (3), посуда (4), продукты (1)"],
          ["`HAVING count(*) >= 3`", "После агрегатов", "Остаются напитки и посуда"],
          ["`count(*) FILTER (WHERE status = 'paid')`", "Внутри агрегата", "7 оплаченных заказов из 13 (замер)"],
          ["`sum(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)`", "Переносимая запись `FILTER`", "Тоже 7"],
        ],
        "Где выполняется каждая часть",
      ),
      code("sql", `SELECT count(*)                                  AS orders_total,
       count(*) FILTER (WHERE status = 'paid')    AS paid,
       count(*) FILTER (WHERE status = 'shipped') AS shipped,
       count(*) FILTER (WHERE status IN ('new', 'cancelled')) AS other
FROM orders;

-- переносимая запись через CASE
SELECT sum(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_via_case FROM orders;`, { filename: "05-filter.sql", runnable: true, fixture: "shop" }),
      code("text", ` orders_total | paid | shipped | other 
--------------+------+---------+-------
           13 |    7 |       3 |     3
(1 row)

 paid_via_case 
---------------
             7
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Один проход по таблице даёт сразу несколько условных счётчиков: 13 заказов, из них 7 оплачены, 3 отгружены и 3 прочие (`new` и `cancelled`).",
        "`FILTER` читается лучше, чем `sum(CASE …)`; оба варианта эквивалентны и работают в SQLite 3.30+.",
      ),
    ]),

    section("internals", [
      h("Как СУБД считает группы"),
      p("Планировщик выбирает одну из стратегий: **`HashAggregate`** (хэш-таблица ключей, хорош при небольшом числе групп), **`GroupAggregate`** (сортировка по ключу или индекс по порядку, затем один проход) и параллельные варианты. Для всех них входные данные читаются один раз, а ключи и состояния агрегатов копятся в памяти, пока группы не закончатся."),
      h("Группировка по выражению"),
      code("sql", `-- Заказы по месяцам: группируем по выражению
SELECT substr(CAST(ordered_on AS text), 1, 7) AS month, count(*) AS orders
FROM orders
GROUP BY substr(CAST(ordered_on AS text), 1, 7)
ORDER BY month;`, { filename: "06-group-expression.sql", runnable: true, fixture: "shop" }),
      code("text", `  month  | orders 
---------+--------
 2024-01 |      1
 2024-02 |      2
 2024-03 |      3
 2024-04 |      3
 2024-05 |      2
 2024-06 |      2
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Шесть месяцев — 1, 2, 3, 3, 2 и 2 заказа, всего 13. В PostgreSQL для месяца обычно используют `date_trunc('month', ordered_on)`; здесь запись через `substr(CAST(… AS text), 1, 7)` одинаково работает и в SQLite."),
      h("Итоги: ROLLUP"),
      code("sql", `SELECT category, status_group, count(*) AS products
FROM (SELECT category, CASE WHEN price >= 1000 THEN 'дорогие' ELSE 'доступные' END AS status_group FROM products) AS t
GROUP BY ROLLUP (category, status_group)
ORDER BY category NULLS LAST, status_group NULLS LAST;`, { filename: "08-rollup.pg.sql" }),
      code("text", ` category | status_group | products 
----------+--------------+----------
 напитки  | дорогие      |        1
 напитки  | доступные    |        2
 напитки  |              |        3
 посуда   | дорогие      |        2
 посуда   | доступные    |        2
 посуда   |              |        4
 продукты | доступные    |        3
 продукты |              |        3
          |              |       10
(9 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`ROLLUP (category, status_group)` добавил подитоги по каждой категории (пустая вторая колонка) и общий итог 10. Пустые значения здесь — не `NULL` данных, а маркер итоговой строки; различить помогает функция `grouping()`."),
      h("Конкатенация значений группы"),
      code("sql", `SELECT category, string_agg(title, ', ' ORDER BY price DESC) AS titles
FROM products
GROUP BY category
ORDER BY category;`, { filename: "09-string-agg.pg.sql" }),
      code("text", ` category |                             titles                             
----------+----------------------------------------------------------------
 напитки  | Кофе зерновой 1 кг, Какао 250 г, Чай чёрный 100 г
 посуда   | Чайник стальной, Френч-пресс, Термокружка, Кружка керамическая
 продукты | Мёд 300 г, Печенье овсяное, Сахар 1 кг
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`string_agg(title, ', ' ORDER BY price DESC)` собрал названия в порядке убывания цены. В SQLite аналог — `group_concat(title, ', ')`, порядок внутри которого не гарантирован."),
    ]),

    section("mistakes", [
      h("Ошибка: столбец вне GROUP BY и агрегата"),
      code("sql", `-- «Покажите самый дорогой товар каждой категории вместе с названием»
SELECT category, title, max(price) AS top_price FROM products GROUP BY category;`, { filename: "12-ex-fix.pg.sql", runnable: true, fixture: "shop" }),
      code("text", `ERROR:  column "products.title" must appear in the GROUP BY clause or be used in an aggregate function
LINE 1: SELECT category, title, max(price) AS top_price FROM product...
                         ^`, { filename: "результат (PostgreSQL 16.14)" }),
      p("PostgreSQL требует, чтобы каждый столбец списка был в `GROUP BY` или внутри агрегата: какое из названий показать для категории, непонятно. Выполните блок в браузере — SQLite запрос **выполнит**: для `max(price)` он берёт название из строки с максимумом (особая «фича» SQLite), а для `avg` — из произвольной строки группы (замер: «Кружка керамическая»). Такой код нельзя переносить в PostgreSQL."),
      code("sql", `-- Этот запрос PostgreSQL отвергает. SQLite его выполняет: «голый» столбец берётся из какой-то строки группы.
SELECT category, title, max(price) AS top_price FROM products GROUP BY category ORDER BY category;
SELECT category, title, avg(price) AS average    FROM products GROUP BY category ORDER BY category;`, { filename: "15-sqlite-bare.sql", runnable: true, fixture: "shop" }),
      h("Ошибка: агрегат в WHERE"),
      wrongRight(
        "sql",
        { title: "Агрегат в WHERE", code: `SELECT category FROM products GROUP BY category WHERE count(*) > 2;`, note: "Синтаксическая ошибка: `WHERE` вычисляется до группировки, агрегатов в нём ещё нет." },
        { title: "Условие на группу — в HAVING", code: `SELECT category FROM products GROUP BY category HAVING count(*) > 2;`, note: "`HAVING` применяется к готовым группам." },
      ),
      h("Ошибка: фильтр по ключу в HAVING"),
      p("`GROUP BY category HAVING category = 'посуда'` даст верный ответ, но сначала сгруппирует всё, а потом выбросит лишнее. `WHERE category = 'посуда'` отсечёт строки до группировки, и результат будет тем же — дешевле."),
      h("Ошибка: count(*) после JOIN"),
      p("После соединения с таблицей позиций заказа строка клиента повторяется по числу позиций. Поэтому в запросе выручки по клиентам заказы считают `count(DISTINCT o.id)`, а не `count(*)`:"),
      code("sql", `-- Выручка по клиентам: соединяем таблицы, группируем, фильтруем группы
SELECT c.name,
       count(DISTINCT o.id)       AS orders,
       sum(oi.qty * p.price)      AS revenue
FROM customers AS c
JOIN orders      AS o  ON o.customer_id = c.id AND o.status <> 'cancelled'
JOIN order_items AS oi ON oi.order_id = o.id
JOIN products    AS p  ON p.id = oi.product_id
GROUP BY c.id, c.name
HAVING sum(oi.qty * p.price) > 2000
ORDER BY revenue DESC, c.name;`, { filename: "07-revenue.sql", runnable: true, fixture: "shop" }),
      code("text", ` name  | orders | revenue 
-------+--------+---------
 Анна  |      4 | 8760.00
 Вера  |      2 | 4210.00
 Борис |      2 | 3320.00
 Жанна |      1 | 2150.00
 Дарья |      1 | 2100.00
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Выручка считается по неотменённым заказам; `HAVING sum(oi.qty * p.price) > 2000` оставил пять клиентов из шести с заказами. Анна: 4 заказа, 8760; без `DISTINCT` количество заказов было бы равно числу позиций."),
    ]),

    section("antipatterns", [
      ul(
        "**`SELECT *` с `GROUP BY`** — бессмысленно и запрещено стандартом.",
        "**Голые столбцы (MySQL/SQLite-стиль)** — неопределённый результат; полагаться на них нельзя.",
        "**Условия по ключам в `HAVING`** вместо `WHERE`.",
        "**`count(*)` вместо `count(DISTINCT id)` после соединений**, размножающих строки.",
        "**Среднее от средних:** `avg(avg_x)` по группам разного размера искажает результат — считайте по исходным строкам.",
        "**Округление до группировки:** `sum(round(x))` и `round(sum(x))` — разные числа.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Фильтруйте строки в `WHERE`, группы — в `HAVING`.**",
        "**Перечисляйте ключи группировки явно** и держите список выбора только из ключей и агрегатов.",
        "**Давайте агрегатам имена** (`AS orders`, `AS revenue`): отчёт станет самодокументированным.",
        "**Для условных счётчиков — `FILTER`** (или `sum(CASE …)` для переносимости).",
        "**Для уникальных сущностей — `count(DISTINCT id)`.**",
        "**Проверяйте итоги сверкой:** сумма по группам = итог без `GROUP BY`; число групп = число различных ключей.",
        "**Не забывайте про `NULL`:** `NULL` в ключе образует свою группу; агрегаты пропускают `NULL`.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Пустой набор:** без `GROUP BY` — одна строка (`count = 0`, остальное `NULL`); с `GROUP BY` — ни одной строки.",
        "**`NULL` в ключе группировки:** все `NULL` образуют одну группу (в `customers` клиент без города даёт группу «`NULL`»).",
        "**`count(*)` и `count(x)`:** разные числа при `NULL` (в замере 8 и 7).",
        "**Целочисленное `avg`:** `avg(integer)` в PostgreSQL возвращает `numeric` (4.000…), а не целое; `sum(integer)` — `bigint`.",
        "**`HAVING` без `GROUP BY`:** вся таблица — одна группа: `SELECT count(*) FROM t HAVING count(*) > 5`.",
        "**Порядок групп без `ORDER BY` не определён** — даже если «обычно» по ключу.",
        "**SQLite:** допускает голые столбцы, нестрогий порядок и `group_concat` без `ORDER BY` внутри.",
      ),
      code("sql", `SELECT count(*) AS n, sum(price) AS total, max(price) AS top FROM products WHERE price > 100000;
SELECT category, count(*) FROM products WHERE price > 100000 GROUP BY category;
SELECT 'после запроса с GROUP BY строк нет, а без него — одна строка с count = 0' AS comment;`, { filename: "10-empty.sql", runnable: true, fixture: "shop" }),
      code("text", ` n | total | top 
---+-------+-----
 0 |       |    
(1 row)

 category | count 
----------+-------
(0 rows)

                                 comment                                  
--------------------------------------------------------------------------
 после запроса с GROUP BY строк нет, а без него — одна строка с count = 0
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
    ]),

    section("related", [
      ul(
        "[SELECT и WHERE](/learn/sql/select-where) — фильтрация строк до группировки.",
        "[Типы данных и NULL](/learn/sql/data-types-null) — агрегаты и `NULL`.",
        "[ORDER BY, LIMIT и DISTINCT](/learn/sql/order-limit-distinct) — `DISTINCT` как группировка.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Фильтр по ключу в HAVING",
          code: `
            SELECT category, count(*) FROM products
            GROUP BY category
            HAVING category = 'посуда';
          `,
          note: "Сначала группируются все категории, потом лишние выбрасываются — лишняя работа.",
        },
        {
          title: "Фильтр в WHERE",
          code: `
            SELECT category, count(*) FROM products
            WHERE category = 'посуда'
            GROUP BY category;
          `,
          note: "Строки других категорий отбрасываются до группировки; при индексе по `category` читаются только нужные.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.group-by-having.ex1",
      title: "Предскажите результат",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская запросы, определите результат каждого из четырёх (набор «shop»: 8 клиентов, 10 товаров, 13 заказов)."),
        code("sql", `SELECT count(*), count(city), count(DISTINCT city) FROM customers;
SELECT category, count(*) FROM products WHERE price < 500 GROUP BY category ORDER BY category;
SELECT status, count(*) AS n FROM orders GROUP BY status HAVING count(*) > 2 ORDER BY status;
SELECT customer_id, count(*) AS n FROM orders WHERE status = 'paid' GROUP BY customer_id ORDER BY n DESC, customer_id LIMIT 2;`, { filename: "11-ex-predict.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["Сколько клиентов с известным городом и сколько различных городов?", "Какие товары дешевле 500?", "Сколько заказов в каждом статусе?", "Кто чаще всех платил?"],
      checks: ["Первый: 8, 7, 3", "Второй: напитки 2, посуда 1, продукты 2", "Третий: paid 7, shipped 3", "Четвёртый: клиент 1 — 3 оплаты, клиент 3 — 2"],
      solution: [
        code("text", ` count | count | count 
-------+-------+-------
     8 |     7 |     3
(1 row)

 category | count 
----------+-------
 напитки  |     2
 посуда   |     1
 продукты |     2
(3 rows)

 status  | n 
---------+---
 paid    | 7
 shipped | 3
(2 rows)

 customer_id | n 
-------------+---
           1 | 3
           3 | 2
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "`count(*)` = 8 строк, `count(city)` = 7 (у Егора `NULL`), `count(DISTINCT city)` = 3 города.",
          "Дешевле 500: чай 250, кружка 450, сахар 90, печенье 140, какао 380 → напитки 2 (чай, какао), посуда 1 (кружка), продукты 2.",
          "Статусы с числом заказов больше 2: `paid` — 7, `shipped` — 3 (`new` — 1, `cancelled` — 2 отсеяны `HAVING`).",
          "Оплаченные заказы по клиентам: клиент 1 — 3 (заказы 1, 2, 7), клиент 3 — 2 (4, 11), остальные по одному; `LIMIT 2` берёт двоих лидеров.",
        ),
      ],
    }),
    exercise({
      id: "sql.group-by-having.ex2",
      title: "Самый дорогой товар категории",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Нужно показать для каждой категории самый дорогой товар вместе с названием. Запрос падает с ошибкой в PostgreSQL. Объясните причину и перепишите двумя способами: через подзапрос с максимумом и (если знаете) через `DISTINCT ON`."),
        code("sql", `-- «Покажите самый дорогой товар каждой категории вместе с названием»
SELECT category, title, max(price) AS top_price FROM products GROUP BY category;`, { filename: "12-ex-fix.pg.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["Какое из названий категории следует показать — решает не группировка, а вы.", "Сначала найдите максимум цены на категорию, затем соедините с исходной таблицей."],
      checks: ["Названа причина: столбец вне `GROUP BY` и агрегата", "Решение: подзапрос с `max(price)` + `JOIN`", "Ожидаемо: Кофе зерновой, Чайник стальной, Мёд"],
      solution: [
        code("sql", `SELECT p.category, p.title, p.price AS top_price
FROM products AS p
JOIN (SELECT category, max(price) AS top_price FROM products GROUP BY category) AS m
  ON m.category = p.category AND m.top_price = p.price
ORDER BY p.category;`, { filename: "13-fix-solution.sql", runnable: true, fixture: "shop" }),
        code("text", ` category |       title        | top_price 
----------+--------------------+-----------
 напитки  | Кофе зерновой 1 кг |   1200.00
 посуда   | Чайник стальной    |   2300.00
 продукты | Мёд 300 г          |    520.00
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Подзапрос `m` находит максимальную цену в каждой категории, а соединение по паре «категория и цена» возвращает строку с названием. Если у двух товаров совпадёт максимум, вернутся оба — добавьте правило выбора. В PostgreSQL проще `DISTINCT ON (category) … ORDER BY category, price DESC`, а универсальный способ — оконная функция `row_number()` (тема о них впереди)."),
      ],
    }),
    exercise({
      id: "sql.group-by-having.ex3",
      title: "Отчёт по статусам заказов",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Составьте отчёт: для каждого статуса заказов — число заказов, число различных клиентов и долю от общего числа заказов в процентах (одна цифра после запятой). Выведите только статусы, у которых не меньше двух заказов; порядок — по убыванию числа заказов, затем по статусу."),
      ],
      hints: ["Как посчитать общее число заказов внутри запроса?", "Как избежать целочисленного деления?", "Где задаётся условие «не меньше двух»?"],
      checks: ["`GROUP BY status`", "`count(DISTINCT customer_id)`", "`100.0 * count(*) / (SELECT count(*) FROM orders)` и `round(…, 1)`", "`HAVING count(*) >= 2`"],
      solution: [
        code("sql", `-- Отчёт по статусам: сколько заказов, сколько клиентов, доля в процентах от всех заказов
SELECT status,
       count(*)                                AS orders,
       count(DISTINCT customer_id)             AS customers,
       round(100.0 * count(*) / (SELECT count(*) FROM orders), 1) AS percent
FROM orders
GROUP BY status
HAVING count(*) >= 2
ORDER BY orders DESC, status;`, { filename: "14-challenge.sql", runnable: true, fixture: "shop" }),
        code("text", `  status   | orders | customers | percent 
-----------+--------+-----------+---------
 paid      |      7 |         4 |    53.8
 shipped   |      3 |         3 |    23.1
 cancelled |      2 |         2 |    15.4
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Статус `new` (один заказ) отсечён `HAVING`; проценты — 7/13 = 53.8, 3/13 = 23.1, 2/13 = 15.4. Множитель `100.0` делает деление десятичным: `100 * 7 / 13` дало бы целое число."),
      ],
    }),
  ],

  challenge: {
    id: "sql.group-by-having.challenge",
    title: "Выручка по клиентам без размножения строк",
    scenario: [
      p("Финансисты просят выручку по клиентам за неотменённые заказы: имя, число заказов, выручка (цена × количество), только клиенты с выручкой больше 2000, от большей к меньшей. Прежние отчёты завышали число заказов — после соединения с позициями строки задваивались."),
    ],
    requirements: [
      "Соединить клиентов, заказы, позиции заказов и товары; отменённые заказы не учитывать",
      "Число заказов считать так, чтобы заказ с несколькими позициями учитывался один раз",
      "Выручка = `sum(qty * price)`",
      "Оставить клиентов с выручкой больше 2000; порядок — по выручке по убыванию, затем по имени",
    ],
    constraints: [
      "Условие по статусу — в `JOIN … ON` или `WHERE`, а не в `HAVING`",
      "Условие по выручке — в `HAVING`",
    ],
    acceptance: [
      "Пять клиентов: Анна (4 заказа, 8760), Вера (2, 4210), Борис (2, 3320), Жанна (1, 2150), Дарья (1, 2100)",
      "Число заказов Анны — 4 (а не число позиций)",
    ],
    hints: [
      "`count(DISTINCT o.id)` защищает от размножения.",
      "`GROUP BY c.id, c.name` — ключом лучше брать первичный ключ клиента.",
    ],
    solution: [
      code("sql", `-- Выручка по клиентам: соединяем таблицы, группируем, фильтруем группы
SELECT c.name,
       count(DISTINCT o.id)       AS orders,
       sum(oi.qty * p.price)      AS revenue
FROM customers AS c
JOIN orders      AS o  ON o.customer_id = c.id AND o.status <> 'cancelled'
JOIN order_items AS oi ON oi.order_id = o.id
JOIN products    AS p  ON p.id = oi.product_id
GROUP BY c.id, c.name
HAVING sum(oi.qty * p.price) > 2000
ORDER BY revenue DESC, c.name;`, { filename: "07-revenue.sql", runnable: true, fixture: "shop" }),
      code("text", ` name  | orders | revenue 
-------+--------+---------
 Анна  |      4 | 8760.00
 Вера  |      2 | 4210.00
 Борис |      2 | 3320.00
 Жанна |      1 | 2150.00
 Дарья |      1 | 2100.00
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Соединение с `order_items` размножает каждый заказ по числу позиций, поэтому число заказов — `count(DISTINCT o.id)`. Статус отфильтрован в `ON` соединения (до группировки), а `HAVING` работает только с агрегатом. Группировка по `c.id, c.name` безопасна: два клиента с одинаковым именем не сольются."),
    ],
  },

  interview: [
    iq("sql.group-by-having.i1", "basic", "Чем WHERE отличается от HAVING?", [
      ul(
        "`WHERE` фильтрует строки до группировки; в нём нет агрегатов.",
        "`HAVING` фильтрует группы после вычисления агрегатов.",
        "Условия по обычным столбцам лучше держать в `WHERE`: меньше строк уходит в группировку.",
      ),
    ]),
    iq("sql.group-by-having.i2", "basic", "Чем count(*) отличается от count(column)?", [
      ul(
        "`count(*)` считает строки; `count(column)` — строки, где значение не `NULL`.",
        "В замере для `customers`: 8 и 7 (у одного клиента город неизвестен).",
        "`count(DISTINCT column)` — число различных непустых значений (3 города).",
      ),
    ]),
    iq("sql.group-by-having.i3", "intermediate", "Почему SELECT category, title, max(price) … GROUP BY category падает в PostgreSQL?", [
      ul(
        "`title` не входит в `GROUP BY` и не обёрнут в агрегат; в группе много названий, и СУБД не знает, какое показать.",
        "SQLite такой запрос выполнит и для `max`/`min` подставит значение из строки с экстремумом — но для других агрегатов результат произволен.",
        "Решения: подзапрос с максимумом + `JOIN`, `DISTINCT ON` (PostgreSQL), оконная функция `row_number()`.",
      ),
    ]),
    iq("sql.group-by-having.i4", "intermediate", "Что возвращает агрегат на пустом наборе строк?", [
      ul(
        "Без `GROUP BY` — одну строку: `count` = 0, `sum`/`avg`/`min`/`max` = `NULL`.",
        "С `GROUP BY` — ноль строк (групп нет).",
        "Для отчётов `COALESCE(sum(x), 0)` превращает `NULL` в 0.",
      ),
    ]),
    iq("sql.group-by-having.i5", "intermediate", "Как посчитать несколько условных счётчиков за один проход по таблице?", [
      ul(
        "`count(*) FILTER (WHERE status = 'paid')` — PostgreSQL 9.4+, SQLite 3.30+.",
        "Переносимо: `sum(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)`.",
        "Один проход вместо нескольких запросов (замер: 13 заказов, 7 `paid`, 3 `shipped`, 3 прочие).",
      ),
    ]),
    iq("sql.group-by-having.i6", "advanced", "Почему после JOIN count(*) может завышать число заказов и как исправить?", [
      ul(
        "Соединение с таблицей «многие» размножает строку «одного»: заказ повторяется по числу позиций.",
        "Исправления: `count(DISTINCT o.id)`, агрегирование позиций в подзапросе до соединения, `EXISTS` вместо `JOIN`.",
        "Суммы по «многим» (`sum(qty * price)`) считаются верно, а суммы по «одному» после соединения — завышаются.",
      ),
    ]),
    iq("sql.group-by-having.i7", "engineering", "Как выбрать между HashAggregate и GroupAggregate и как это влияет на запрос?", [
      ul(
        "`HashAggregate` строит хэш-таблицу ключей: быстро при небольшом числе групп, не требует порядка, расходует память.",
        "`GroupAggregate` идёт по отсортированному входу (сортировка или индекс по ключу): экономит память, выдаёт группы по порядку.",
        "Планировщик выбирает по оценке числа групп и статистике; влиять можно индексами, `work_mem` и актуальной статистикой (`ANALYZE`).",
      ),
    ]),
    iq("sql.group-by-having.i8", "debugging", "Сумма по категориям не сходится с общим итогом. Что проверить?", [
      ul(
        "`NULL` в ключе группировки: группа «без категории» может теряться при фильтрации.",
        "Условия в `WHERE`/`JOIN`, исключающие часть строк в одном запросе и не исключающие в другом.",
        "Размножение строк после `JOIN`; сверка `count(*)` с `count(DISTINCT id)`.",
        "Округление до группировки; `sum(round(x))` против `round(sum(x))`.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.group-by-having.e1", "foundation", "Какая часть запроса фильтрует группы после агрегирования?", ["`WHERE`", "`ORDER BY`", "`HAVING`", "`LIMIT`"], 2, "`HAVING` применяется к группам и может использовать агрегаты; `WHERE` работает со строками до группировки."),
    mcq("sql.group-by-having.e2", "foundation", "Что вернёт `SELECT count(*) FROM products WHERE price > 100000`?", ["Одну строку со значением 0", "Ни одной строки", "`NULL`", "Ошибку"], 0, "Агрегат без `GROUP BY` всегда возвращает одну строку; `count` на пустом наборе — 0 (замер)."),
    mcq("sql.group-by-having.e3", "foundation", "Сколько строк вернёт `SELECT category, count(*) FROM products GROUP BY category` на наборе «shop»?", ["10", "4", "1", "3"], 3, "Одна строка на каждую из трёх категорий (3 + 4 + 3 товара)."),
    mcq("sql.group-by-having.e4", "intermediate", "Какой из запросов корректен в PostgreSQL?", ["`SELECT category, title, max(price) FROM products GROUP BY category`", "`SELECT category, max(price) FROM products GROUP BY category`", "`SELECT category FROM products GROUP BY category WHERE count(*) > 2`", "`SELECT * FROM products GROUP BY category`"], 1, "В списке только ключ группировки и агрегат; остальные варианты нарушают правила `GROUP BY` или `WHERE`."),
    mcq("sql.group-by-having.e5", "intermediate", "Что выведет `count(*) FILTER (WHERE status = 'paid')` для набора «shop» (13 заказов, 7 оплаченных)?", ["13", "`NULL`", "6", "7"], 3, "`FILTER` учитывает только строки, удовлетворяющие условию: 7 (замер)."),
    mcq("sql.group-by-having.e6", "intermediate", "Какие условия лучше перенести из `HAVING` в `WHERE`? Выберите все.", ["`category = 'посуда'`", "`count(*) >= 3`", "`price >= 250`", "`avg(price) > 300`"], [0, 2], "Условия по обычным столбцам фильтруют строки до группировки и дешевле; условия с агрегатами обязаны остаться в `HAVING`."),
    mcq("sql.group-by-having.e7", "advanced", "Почему `count(*)` после соединения заказов с позициями завышает число заказов?", ["Из-за ошибки `JOIN`", "`count(*)` считает `NULL` дважды", "Каждый заказ повторяется по числу его позиций", "Из-за `HAVING`"], 2, "Соединение «один ко многим» размножает строку «одного»: для заказа с тремя позициями — три строки; нужен `count(DISTINCT o.id)`."),
    open("sql.group-by-having.e8", "intermediate", "Объясните, в чём разница между `WHERE` и `HAVING`, и приведите случай, когда условие нельзя перенести из `HAVING` в `WHERE`.", [
      ul(
        "`WHERE` — фильтр строк до группировки; `HAVING` — фильтр групп после агрегатов.",
        "Условие с агрегатом (`count(*) >= 3`, `avg(price) > 300`) относится к группе и возможно только в `HAVING`.",
        "Условие по обычным столбцам лучше держать в `WHERE`: меньше строк попадает в группировку.",
        "Логический порядок: `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT`.",
      ),
    ], ["Названа разница в порядке вычисления", "Приведён пример условия с агрегатом", "Отмечено преимущество WHERE по производительности"], { format: "concept" }),
  ],

  mastery: [
    mcq("sql.group-by-having.m1", "intermediate", "Что вернёт `SELECT category, count(*) FROM products WHERE price < 500 GROUP BY category ORDER BY category` для набора «shop»?", ["напитки 3, посуда 4, продукты 3", "напитки 2, посуда 1, продукты 2", "напитки 2, посуда 1, продукты 3", "Только посуда 1"], 1, "Дешевле 500: чай и какао (напитки), кружка (посуда), сахар и печенье (продукты) — 2, 1 и 2 (замер)."),
    mcq("sql.group-by-having.m2", "advanced", "Что вернёт SQLite на `SELECT category, title, avg(price) … GROUP BY category`?", ["`title` из произвольной строки группы", "Ошибку, как PostgreSQL", "`NULL` в `title`", "Среднее название"], 0, "SQLite допускает «голые» столбцы: для `min`/`max` берёт значение из строки экстремума, для остальных агрегатов — из произвольной строки (замер: «Кружка керамическая»)."),
    mcq("sql.group-by-having.m3", "advanced", "В `ROLLUP (category, status_group)` итоговая строка по всем данным в результате PostgreSQL выглядит как…", ["Пустая строка без значений", "Ошибка группировки", "Строка, где оба ключа `NULL`, а агрегат равен общему итогу (10)", "Первая строка с `count = 1`"], 2, "ROLLUP добавляет подитоги (второй ключ `NULL`) и общий итог (оба ключа `NULL`); в замере общий итог — 10."),
    open("sql.group-by-having.m4", "advanced", "Дашборд показывает «число заказов по клиентам» через `count(*)` после `JOIN` с позициями, и цифры выше, чем в бухгалтерии. Опишите диагностику и два способа исправления.", [
      ul(
        "Гипотеза: `JOIN` с `order_items` размножил заказы: строка заказа повторяется по числу позиций.",
        "Проверка: сравнить `count(*)` и `count(DISTINCT o.id)` для клиента; на примере одного заказа с тремя позициями показать три строки.",
        "Исправление 1: `count(DISTINCT o.id)` (и осторожно с суммами: суммы по позициям корректны, суммы по заказу — нет).",
        "Исправление 2: сначала агрегировать позиции в подзапросе (`GROUP BY order_id`), затем соединять с заказами; либо считать заказы отдельным запросом/CTE.",
        "Профилактика: тест на контрольные суммы (сумма по клиентам = общий итог), код-ревью соединений «один ко многим».",
      ),
    ], ["Названа причина (размножение строк)", "Предложена диагностика сравнением счётчиков", "Два способа исправления", "Профилактика контрольными суммами"], { format: "debug" }),
  ],

  flashcards: [
    { id: "sql.group-by-having.f1", front: "WHERE и HAVING?", back: "WHERE — строки до группировки (без агрегатов). HAVING — группы после агрегатов." },
    { id: "sql.group-by-having.f2", front: "Правило GROUP BY?", back: "В SELECT только ключи группировки и агрегаты. Иначе PostgreSQL — ошибка; SQLite — произвольное значение." },
    { id: "sql.group-by-having.f3", front: "count(*) и count(x)?", back: "count(*) — строки; count(x) — непустые значения; count(DISTINCT x) — различные непустые." },
    { id: "sql.group-by-having.f4", front: "Пустой набор?", back: "Без GROUP BY: одна строка (count=0, sum/avg/min/max=NULL). С GROUP BY: ноль строк." },
    { id: "sql.group-by-having.f5", front: "FILTER?", back: "count(*) FILTER (WHERE cond) — условный агрегат; переносимо: sum(CASE WHEN cond THEN 1 ELSE 0 END)." },
    { id: "sql.group-by-having.f6", front: "Размножение после JOIN?", back: "Строки «одного» повторяются по числу «многих». Нужен count(DISTINCT id) или агрегация до соединения." },
    { id: "sql.group-by-having.f7", front: "NULL в ключе?", back: "Все NULL образуют одну группу." },
    { id: "sql.group-by-having.f8", front: "ROLLUP?", back: "PostgreSQL: подитоги и общий итог. Итоговые строки отличают функцией grouping()." },
    { id: "sql.group-by-having.f9", front: "Склейка значений группы?", back: "PostgreSQL: string_agg(x, sep ORDER BY …). SQLite: group_concat(x, sep) без гарантии порядка." },
  ],

  sources: [
    { title: "PostgreSQL 16: Aggregate Functions", url: "https://www.postgresql.org/docs/16/functions-aggregate.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: The GROUP BY and HAVING Clauses", url: "https://www.postgresql.org/docs/16/queries-table-expressions.html#QUERIES-GROUP", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Aggregate Expressions (FILTER)", url: "https://www.postgresql.org/docs/16/sql-expressions.html#SYNTAX-AGGREGATES", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: GROUPING SETS, CUBE, and ROLLUP", url: "https://www.postgresql.org/docs/16/queries-table-expressions.html#QUERIES-GROUPING-SETS", publisher: "PostgreSQL" },
    { title: "SQLite: Aggregate Functions", url: "https://www.sqlite.org/lang_aggfunc.html", publisher: "Other" },
    { title: "SQLite: Bare columns in an aggregate query", url: "https://www.sqlite.org/lang_select.html#bareagg", publisher: "Other" },
  ],
};
