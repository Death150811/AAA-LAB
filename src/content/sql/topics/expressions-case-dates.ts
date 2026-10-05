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

export const expressionsCaseDates: Topic = {
  id: "sql.expressions-case-dates",
  slug: "expressions-case-dates",
  domain: "sql",
  module: "queries",
  title: "Выражения, CASE и даты",
  titleEn: "Expressions, CASE and Dates",
  summary:
    "Выражения вычисляют новые значения прямо в запросе: арифметика, строки, `CASE`, `COALESCE`, приведение типов, функции дат и времени. Тема на замерах PostgreSQL 16.14 и SQLite 3.49 показывает, как `CASE` классифицирует строки и строит «сводные» отчёты (по месяцам: 1, 2, 3, 3, 2, 2 заказа), почему `count(CASE … ELSE 0 END)` возвращает 13 вместо 10 (счёт идёт по непустым), чем `round(2.5)` для `numeric` (3) отличается от `float8` (2), как PostgreSQL прибавляет месяц к 31 января (`2024-02-29`), а SQLite — `2024-03-02`, и чем `+ interval '1 day'` отличается от `+ interval '24 hours'` при переходе на летнее время (12:00 против 13:00).",
  minutes: 75,
  prerequisites: ["sql.select-where", "sql.data-types-null"],
  tags: ["CASE", "COALESCE", "NULLIF", "string functions", "round", "cast", "date", "timestamp", "interval", "date_trunc", "extract", "DST", "time zone", "pivot", "strftime", "expressions"],
  keyConcepts: [
    { term: "CASE — условное выражение", text: "`CASE WHEN cond THEN a … ELSE b END` вычисляет ветки по порядку и возвращает первую подходящую; без `ELSE` результат `NULL`. Ветки, которые не выбраны, не вычисляются — этим защищаются от деления на ноль." },
    { term: "count считает непустые значения", text: "`count(CASE WHEN … THEN 1 ELSE 0 END)` возвращает 13 для обоих счётчиков: `0` — тоже не `NULL`. Правильно: `count(CASE WHEN … THEN 1 END)` (10 закрытых и 1 новый) или `sum(… ELSE 0 …)`." },
    { term: "Округление зависит от типа", text: "`round(2.5)` для `numeric` — 3 (от нуля), для `float8` — 2 (к чётному); `round(3.5::float8)` — 4. В SQLite `round(2.5)` — 3." },
    { term: "Месяц — не 30 дней", text: "`date '2024-01-31' + interval '1 month'` → `2024-02-29` (PostgreSQL ограничивает последним днём месяца); SQLite `date('2024-01-31', '+1 month')` → `2024-03-02`." },
    { term: "Сутки и 24 часа различаются", text: "В часовом поясе Europe/Berlin `+ interval '1 day'` от 30.03 12:00 дало `31.03 12:00`, а `+ interval '24 hours'` — `31.03 13:00` (в этот день часы переводятся на час вперёд)." },
  ],
  sections: [
    section("definition", [
      def("Выражение", "Комбинация значений, столбцов, операторов и функций, которая вычисляется в значение: `price * qty`, `upper(name)`, `CASE …`. Может стоять в списке выбора, `WHERE`, `ORDER BY`, `GROUP BY`.", "expression"),
      def("CASE", "Условное выражение. «Поисковая» форма — `CASE WHEN условие THEN … END`, «простая» — `CASE x WHEN значение THEN … END`. Возвращает результат первой истинной ветки.", "CASE expression"),
      def("Скалярная функция", "Функция, возвращающая одно значение для каждой строки (`length`, `round`, `substr`), в отличие от агрегата, сворачивающего группу.", "scalar function"),
      def("Интервал", "Тип PostgreSQL для промежутка времени (`1 month`, `24 hours`); хранит месяцы, дни и время отдельно, поэтому «месяц» и «30 дней» — разные вещи.", "interval"),
      def("Усечение даты", "`date_trunc('month', ts)` отбрасывает младшие части времени, оставляя начало периода: основа группировки по месяцам, неделям, дням.", "date_trunc"),
      def("Часовой пояс сессии", "Настройка соединения `TimeZone`: определяет, как `timestamptz` показывается и как разбираются литералы без явного пояса.", "session time zone"),
      def("Сводная таблица (pivot)", "Отчёт, где значения группировочного ключа становятся столбцами; в SQL строится условными агрегатами `sum(CASE …)` или `FILTER`.", "pivot"),
    ]),

    section("why", [
      h("Данные редко хранятся в том виде, в котором нужны"),
      p("Вам нужны не статусы `paid`, а «Оплачен»; не цена, а ценовая категория; не дата, а месяц; не `NULL`, а «не указан». Всё это — выражения. Умение вычислять значения в запросе освобождает от лишних столбцов в таблицах и от обработки в приложении, где легко разойтись с отчётом."),
      ul(
        "**Отчёты:** группировка по месяцам, ценовым категориям, сегментам требует выражений.",
        "**Корректность:** округление, деление, границы дат — типичные источники расхождений в деньгах.",
        "**Время:** часовые пояса, переход на летнее время, длина месяца — одни из самых дорогих ошибок.",
        "**Безопасность вычислений:** `CASE` и `NULLIF` защищают от деления на ноль и неопределённых значений.",
      ),
    ]),

    section("mental-model", [
      h("Выражение — это маленькая функция от строки"),
      p("Для каждой строки СУБД подставляет значения столбцов в выражение и получает значение. `CASE` — ветвление внутри этого вычисления; функции — преобразования. Результат — столбец, который можно использовать так же, как обычный: сортировать, группировать, фильтровать (с учётом порядка вычисления)."),
      diagram(
        `
        строка: (title='Кружка', price=450.00)
                       │
                       ▼
        CASE WHEN price >= 1500 THEN 'премиум'      ← проверяется сверху вниз,
             WHEN price >=  400 THEN 'средний'      ← берётся первая истинная ветка,
             ELSE 'доступный' END                   ← остальные не вычисляются
                       │
                       ▼
                   'средний'
        `,
        "Порядок веток важен: если поменять первую и вторую, все дорогие товары окажутся «средними».",
      ),
      h("Время — это моменты, календарь и пояса"),
      p("Дата («17 марта») — пункт календаря; момент (`timestamptz`) — точка на оси времени; «часы на стене» (`timestamp`) — показания без привязки к оси. Операции над ними разные: «через день» по календарю и «через 24 часа» по оси — не одно и то же, если между ними перевод часов."),
    ]),

    section("technical", [
      h("CASE и связанные функции"),
      table(
        ["Конструкция", "Смысл", "Замечание"],
        [
          ["`CASE WHEN c THEN a [WHEN …] [ELSE b] END`", "Первая истинная ветка", "Без `ELSE` — `NULL`; типы веток приводятся к общему"],
          ["`CASE x WHEN 1 THEN … END`", "Сравнение `x = значение`", "С `NULL` не работает: `NULL = NULL` неизвестно"],
          ["`COALESCE(a, b, …)`", "Первое не `NULL`", "Остальные аргументы могут не вычисляться"],
          ["`NULLIF(a, b)`", "`NULL`, если `a = b`", "Защита от деления на ноль"],
          ["`GREATEST(…)`, `LEAST(…)` (PostgreSQL)", "Наибольшее/наименьшее из списка", "Игнорируют `NULL`; в SQLite — скалярные `max(a, b)`, `min(a, b)`"],
          ["`IIF(c, a, b)` (SQLite)", "Сокращение `CASE`", "Нет в PostgreSQL"],
        ],
        "Условные выражения",
      ),
      h("Строки и числа"),
      ul(
        "**Строки:** `||` (склейка; с `NULL` даёт `NULL`), `length`, `substr(s, from, count)`, `replace`, `trim`, `lower`, `upper` (в SQLite только для ASCII), `position`, `split_part` (PostgreSQL).",
        "**Числа:** `+ - * /`, `%`, `round(x, n)`, `ceil`, `floor`, `trunc` (PostgreSQL), `abs`, `mod`. Деление двух `integer` — целочисленное.",
        "**Приведение:** `CAST(x AS type)` или `x::type` (PostgreSQL). Некорректное значение — ошибка.",
      ),
      h("Даты и время в PostgreSQL"),
      ul(
        "Типы: `date`, `time`, `timestamp`, `timestamptz`, `interval`.",
        "Арифметика: `date + integer` (дни), `date - date` (дни как целое), `timestamp ± interval`.",
        "`date_trunc('month', ts)`, `extract(year FROM d)`, `to_char(d, 'DD.MM.YYYY')`, `age(a, b)`, `generate_series(start, stop, step)`.",
        "`now()` и `current_timestamp` — момент начала транзакции; `clock_timestamp()` — реальный текущий момент.",
        "Часовой пояс: `SET TIME ZONE …`, `ts AT TIME ZONE 'UTC'`.",
      ),
      h("Даты в SQLite"),
      p("Типов даты нет: значения — текст ISO-8601 (`'2024-03-17'`), числа Юлианских дней или Unix-время. Функции: `date()`, `datetime()`, `strftime(формат, значение)`, `julianday()` с модификаторами `'+30 days'`, `'start of month'`."),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `-- Карточка заказа с человекочитаемым статусом, возрастом заказа и приоритетом сортировки
SELECT o.id,
       c.name,
       CASE o.status
         WHEN 'new'       THEN 'Новый'
         WHEN 'paid'      THEN 'Оплачен'
         WHEN 'shipped'   THEN 'Отгружен'
         ELSE 'Отменён'
       END                                   AS status_ru,
       COALESCE(c.city, 'город не указан')   AS city,
       substr(CAST(o.ordered_on AS text), 1, 4) || '/' || substr(CAST(o.ordered_on AS text), 6, 2) AS period
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
ORDER BY CASE o.status WHEN 'new' THEN 0 WHEN 'paid' THEN 1 WHEN 'shipped' THEN 2 ELSE 3 END, o.id
LIMIT 6;`,
        [
          { line: 2, text: "Столбец `o.id` — обычное значение строки." },
          { line: [4, 9], text: "«Простая» форма `CASE o.status WHEN … THEN …` переводит код статуса в русское название; `ELSE` ловит остальное (`cancelled`)." },
          { line: 10, text: "`COALESCE(c.city, 'город не указан')` — подстановка при `NULL`." },
          { line: 11, text: "Склейка `||` из двух `substr`: год и месяц из даты, приведённой к тексту." },
          { line: [12, 13], text: "Соединение заказов с клиентами." },
          { line: 14, text: "В `ORDER BY` — тоже `CASE`: задаёт нестандартный приоритет статусов (`new` первыми), затем `id`." },
        ],
        "13-challenge.sql",
      ),
    ]),

    section("minimal-example", [
      p("Классификация товаров по цене: порядок веток — сверху вниз. Измените границы и нажмите «Выполнить»."),
      code("sql", `SELECT title,
       price,
       CASE
         WHEN price >= 1500 THEN 'премиум'
         WHEN price >= 400  THEN 'средний'
         ELSE 'доступный'
       END AS tier
FROM products
ORDER BY price DESC;`, { filename: "01-case.sql", runnable: true, fixture: "shop" }),
      code("text", `        title        |  price  |   tier    
---------------------+---------+-----------
 Чайник стальной     | 2300.00 | премиум
 Френч-пресс         | 1900.00 | премиум
 Кофе зерновой 1 кг  | 1200.00 | средний
 Термокружка         |  990.00 | средний
 Мёд 300 г           |  520.00 | средний
 Кружка керамическая |  450.00 | средний
 Какао 250 г         |  380.00 | доступный
 Чай чёрный 100 г    |  250.00 | доступный
 Печенье овсяное     |  140.00 | доступный
 Сахар 1 кг          |   90.00 | доступный
(10 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Два премиальных товара (от 1500), четыре «средних» (от 400) и четыре «доступных». Ветка `>= 400` не проверяется для 2300 и 1900: первая подходящая ветка уже найдена."),
    ]),

    section("detailed-example", [
      p("`CASE` внутри агрегата превращает значения в столбцы. Отчёт «заказы по месяцам и статусам» — по одной строке на месяц, по столбцу на статус:"),
      code("sql", `-- «Сводная» таблица: заказы по месяцам и статусам в столбцах
SELECT substr(CAST(ordered_on AS text), 1, 7) AS month,
       sum(CASE WHEN status = 'paid'      THEN 1 ELSE 0 END) AS paid,
       sum(CASE WHEN status = 'shipped'   THEN 1 ELSE 0 END) AS shipped,
       sum(CASE WHEN status IN ('new', 'cancelled') THEN 1 ELSE 0 END) AS other,
       count(*)                                                       AS total
FROM orders
GROUP BY substr(CAST(ordered_on AS text), 1, 7)
ORDER BY month;`, { filename: "02-case-aggregate.sql", runnable: true, fixture: "shop" }),
      code("text", `  month  | paid | shipped | other | total 
---------+------+---------+-------+-------
 2024-01 |    1 |       0 |     0 |     1
 2024-02 |    1 |       1 |     0 |     2
 2024-03 |    1 |       0 |     2 |     3
 2024-04 |    2 |       1 |     0 |     3
 2024-05 |    2 |       0 |     0 |     2
 2024-06 |    0 |       1 |     1 |     2
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("В каждой строке `paid + shipped + other = total`: статусы покрывают все заказы. Если столбцы не сходятся с `total` — в данных появился неучтённый статус; это тоже полезная проверка."),
      h("Защита от деления на ноль"),
      code("sql", `-- CASE вычисляет ветки по порядку и не вычисляет лишние: деление на ноль не происходит
SELECT x, CASE WHEN x <> 0 THEN 100 / x ELSE NULL END AS safe
FROM (SELECT 0 AS x UNION ALL SELECT 4 UNION ALL SELECT 5) AS t
ORDER BY x;`, { filename: "09-case-guard.sql", runnable: true }),
      code("text", ` x | safe 
---+------
 0 |     
 4 |   25
 5 |   20
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Для `x = 0` ветка деления не вычисляется — получаем `NULL`. `CASE` — один из немногих конструкций, где порядок вычисления гарантирован стандартом; в `WHERE x <> 0 AND 100 / x > 1` такой гарантии нет."),
    ]),

    section("analysis", [
      table(
        ["Выражение", "Результат", "Пояснение"],
        [
          ["`CASE WHEN 5 > 3 THEN 'a' WHEN 5 > 1 THEN 'b' ELSE 'c' END`", "`a`", "Первая истинная ветка; остальные не вычисляются"],
          ["`CASE WHEN NULL = NULL THEN 'равны' ELSE 'иначе' END`", "`иначе`", "Условие неизвестно, ветка `THEN` не выбирается"],
          ["`COALESCE(NULLIF('', ''), 'пусто')`", "`пусто`", "`NULLIF` превращает пустую строку в `NULL`, `COALESCE` подставляет значение"],
          ["`'ab' || 'cd' || 1`", "`abcd1`", "Число приводится к тексту; в PostgreSQL операнд `1` — `integer`, но `||` допускает любой тип"],
          ["`7 / 2`, `7.0 / 2`, `7 % 2`", "`3`, `3.5…`, `1`", "Целочисленное деление и остаток"],
        ],
        "Вычисления с известным ответом (замеры PostgreSQL 16.14)",
      ),
      code("sql", `SELECT 'Hello' || ', ' || 'World'      AS joined,
       upper('abc')                    AS upper_latin,
       lower('ABC')                    AS lower_latin,
       replace('a-b-c', '-', '_')      AS replaced,
       substr('database', 1, 4)        AS first_four,
       trim('  x  ')                   AS trimmed,
       length('привет')                AS chars,
       'abc' || NULL                   AS concat_null;`, { filename: "03-strings.sql", runnable: true }),
      code("text", `    joined    | upper_latin | lower_latin | replaced | first_four | trimmed | chars | concat_null 
--------------+-------------+-------------+----------+------------+---------+-------+-------------
 Hello, World | ABC         | abc         | a_b_c    | data       | x       |     6 | 
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Склейка с `NULL` даёт `NULL` (последний столбец пуст): для пропусков используйте `COALESCE` или `concat()` (PostgreSQL игнорирует `NULL`).",
        "`length('привет')` вернул 6 — функции строк считают символы, а не байты.",
      ),
    ]),

    section("internals", [
      h("Числа: точность и округление"),
      code("sql", `SELECT round(2.5)            AS round_numeric,
       round(2.5::float8)    AS round_float_2_5,
       round(3.5::float8)    AS round_float_3_5,
       round(1234.5678, 2)   AS two_digits,
       round(1234.5678, -2)  AS to_hundreds,
       ceil(-1.5)            AS ceil_neg,
       floor(-1.5)           AS floor_neg,
       trunc(-1.5)           AS trunc_neg,
       mod(-7, 3)            AS mod_neg,
       10 % 4                AS remainder;`, { filename: "04-numeric.pg.sql" }),
      code("text", ` round_numeric | round_float_2_5 | round_float_3_5 | two_digits | to_hundreds | ceil_neg | floor_neg | trunc_neg | mod_neg | remainder 
---------------+-----------------+-----------------+------------+-------------+----------+-----------+-----------+---------+-----------
             3 |               2 |               4 |    1234.57 |        1200 |       -1 |        -2 |        -1 |      -1 |         2
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "`round(2.5)` для `numeric` — `3` (от нуля), а для `float8` — `2` (к ближайшему чётному, аппаратное округление); `round(3.5::float8)` — `4`. Для денег используйте `numeric`.",
        "`round(1234.5678, -2)` округляет до сотен: `1200`.",
        "Для отрицательных чисел: `ceil(-1.5)` = −1, `floor(-1.5)` = −2, `trunc(-1.5)` = −1 (к нулю), `mod(-7, 3)` = −1 (знак делимого).",
      ),
      h("Даты: календарь, арифметика, усечение"),
      code("sql", `SELECT date '2024-03-10' + 30                      AS plus_days,
       date '2024-03-10' - date '2024-01-01'        AS days_between,
       date_trunc('month', timestamp '2024-03-17 15:45') AS month_start,
       extract(year  FROM date '2024-03-17')        AS year,
       extract(dow   FROM date '2024-03-17')        AS dow_sunday_is_0,
       extract(isodow FROM date '2024-03-17')       AS isodow_sunday_is_7,
       to_char(date '2024-03-17', 'DD.MM.YYYY')     AS formatted,
       age(date '2024-03-17', date '1990-05-20')    AS age_interval;`, { filename: "05-dates.pg.sql" }),
      code("text", ` plus_days  | days_between |     month_start     | year | dow_sunday_is_0 | isodow_sunday_is_7 | formatted  |      age_interval       
------------+--------------+---------------------+------+-----------------+--------------------+------------+-------------------------
 2024-04-09 |           69 | 2024-03-01 00:00:00 | 2024 |               0 |                  7 | 17.03.2024 | 33 years 9 mons 28 days
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Вычитание дат даёт целое число дней (69 с 1 января по 10 марта високосного года), `date_trunc('month', …)` — начало месяца, `extract(dow …)` нумерует воскресенье нулём, а `isodow` — семёркой; `age()` возвращает календарный интервал `33 years 9 mons 28 days`."),
      h("Концы месяцев"),
      code("sql", `SELECT date '2024-01-31' + interval '1 month'  AS jan31_plus_month,
       date '2024-02-29' + interval '1 year'   AS leap_plus_year,
       date '2024-03-31' - interval '1 month'  AS mar31_minus_month;

-- Первые числа месяцев и последний день февраля
SELECT m::date AS month_start,
       (m + interval '1 month' - interval '1 day')::date AS month_end
FROM generate_series(timestamp '2024-01-01', timestamp '2024-04-01', interval '1 month') AS m;`, { filename: "06-month-end.pg.sql" }),
      code("text", `  jan31_plus_month   |   leap_plus_year    |  mar31_minus_month  
---------------------+---------------------+---------------------
 2024-02-29 00:00:00 | 2025-02-28 00:00:00 | 2024-02-29 00:00:00
(1 row)

 month_start | month_end  
-------------+------------
 2024-01-01  | 2024-01-31
 2024-02-01  | 2024-02-29
 2024-03-01  | 2024-03-31
 2024-04-01  | 2024-04-30
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("PostgreSQL ограничивает результат последним днём месяца: `31 января + 1 месяц` = `29 февраля 2024`, а `29 февраля + 1 год` = `28 февраля 2025`. `generate_series` по месяцам с вычислением конца месяца даёт календарь 2024 года без ручных таблиц (в високосный февраль — 29)."),
      h("Летнее время"),
      code("sql", `SET TIME ZONE 'Europe/Berlin';
SELECT timestamptz '2024-03-30 12:00' + interval '1 day'    AS plus_1_day,
       timestamptz '2024-03-30 12:00' + interval '24 hours' AS plus_24_hours;

SET TIME ZONE 'UTC';
SELECT timestamptz '2024-03-30 12:00 Europe/Berlin' AT TIME ZONE 'UTC' AS berlin_noon_in_utc;`, { filename: "07-dst.pg.sql" }),
      code("text", `       plus_1_day       |     plus_24_hours      
------------------------+------------------------
 2024-03-31 12:00:00+02 | 2024-03-31 13:00:00+02
(1 row)

 berlin_noon_in_utc  
---------------------
 2024-03-30 11:00:00
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("В ночь на 31 марта 2024 в Берлине часы переведены вперёд на час. `+ interval '1 day'` сохраняет «настенное» время (12:00, прошло 23 часа), а `+ interval '24 hours'` отсчитывает ровно 24 часа (13:00). Одно и то же событие в UTC — `11:00` (Берлин зимой UTC+1)."),
    ]),

    section("mistakes", [
      h("Ошибка: count вместо sum для условного подсчёта"),
      code("sql", `-- Хотим: сколько заказов «закрыто» (paid, shipped) и сколько «в работе» (new). Результат неверный:
SELECT count(CASE WHEN status IN ('paid', 'shipped') THEN 1 ELSE 0 END) AS closed,
       count(CASE WHEN status = 'new' THEN 1 ELSE 0 END)                AS in_progress
FROM orders;`, { filename: "11-ex-fix.sql", runnable: true, fixture: "shop" }),
      code("text", ` closed | in_progress 
--------+-------------
     13 |          13
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Оба счётчика равны 13: `count` считает непустые значения, а `0` — непустое. Исправление: опустить `ELSE` (`count(CASE WHEN … THEN 1 END)`) или использовать `sum(CASE … THEN 1 ELSE 0 END)`; рядом — `FILTER`."),
      code("sql", `SELECT count(CASE WHEN status IN ('paid', 'shipped') THEN 1 END) AS closed,
       count(CASE WHEN status = 'new' THEN 1 END)                AS in_progress,
       sum(CASE WHEN status IN ('paid', 'shipped') THEN 1 ELSE 0 END) AS closed_via_sum
FROM orders;`, { filename: "12-fix-solution.sql", runnable: true, fixture: "shop" }),
      code("text", ` closed | in_progress | closed_via_sum 
--------+-------------+----------------
     10 |           1 |             10
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      h("Ошибка: неверный порядок веток CASE"),
      wrongRight(
        "sql",
        { title: "Широкое условие впереди", code: `CASE WHEN price >= 400 THEN 'средний' WHEN price >= 1500 THEN 'премиум' ELSE 'доступный' END`, note: "Всё, что дороже 400, стало «средним»: ветка `>= 1500` недостижима." },
        { title: "Узкое условие впереди", code: `CASE WHEN price >= 1500 THEN 'премиум' WHEN price >= 400 THEN 'средний' ELSE 'доступный' END`, note: "Ветки идут от самого узкого условия к широкому." },
      ),
      h("Ошибка: «месяц» как 30 дней и «сутки» как 24 часа"),
      p("Прибавление 30 дней к 31 января даёт 1 марта, а не конец февраля; месяц — календарная единица. Для промежутков между моментами по оси времени используйте часы, а для календарных сдвигов — `interval '1 day'`/`'1 month'`; помните про перевод часов."),
      h("Ошибка: даты как текст в SQLite"),
      p("В SQLite нет типа даты: сравнение строк работает для ISO-формата, но формат `'17.03.2024'` сортируется неверно. В замере SQLite `date('2024-01-31', '+1 month')` вернул `2024-03-02` — переполнение дней переносится на следующий месяц (в PostgreSQL — `2024-02-29`). Выполните блок:"),
      code("sql", `-- SQLite: даты — это текст, функции другие. Выполните блок в браузере.
SELECT date('2024-03-10', '+30 days')          AS plus_days,
       date('2024-01-31', '+1 month')          AS jan31_plus_month,
       strftime('%Y-%m', '2024-03-17')         AS year_month,
       strftime('%w', '2024-03-17')            AS dow_sunday_is_0,
       julianday('2024-03-10') - julianday('2024-01-01') AS days_between,
       round(2.5)                              AS round_2_5,
       round(3.5)                              AS round_3_5;`, { filename: "08-sqlite-dates.sql", runnable: true }),
    ]),

    section("antipatterns", [
      ul(
        "**Даты в `text`** («17.03.2024», «март 2024») — нельзя сортировать, сравнивать и группировать надёжно.",
        "**Время без часового пояса** для событий разных регионов (`timestamp` вместо `timestamptz`).",
        "**`WHERE date(created_at) = '2024-03-17'`** — функция над столбцом мешает индексу; используйте диапазон `>= … AND < …`.",
        "**Длинные цепочки вложенных `CASE`** вместо справочной таблицы: правила классификации лучше хранить данными.",
        "**Округление в промежуточных шагах** денежных расчётов.",
        "**`count(CASE … ELSE 0 END)`.**",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Порядок веток `CASE` — от узкого к широкому**, всегда добавляйте `ELSE` (или осознанно оставляйте `NULL`).",
        "**Условные счётчики:** `count(… THEN 1 END)`, `sum(… THEN 1 ELSE 0 END)` или `FILTER`.",
        "**Деньги — `numeric`**, округляйте один раз в конце.",
        "**События — `timestamptz`**, календарные даты — `date`; пояс сессии задавайте явно.",
        "**Диапазоны времени — полуоткрытые** (`>= начало AND < следующее начало`).",
        "**Группируйте по `date_trunc`** (PostgreSQL) или `strftime`/`substr` (SQLite).",
        "**Справочники вместо `CASE`**, если правил много или они меняются.",
        "**Тестируйте даты на границах:** конец месяца, високосный год, переход на летнее время.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**`CASE` без `ELSE`** возвращает `NULL`; типы веток должны приводиться к одному типу.",
        "**`CASE x WHEN NULL`** никогда не сработает (`x = NULL` неизвестно): используйте `CASE WHEN x IS NULL`.",
        "**Целочисленное деление:** `7 / 2` = 3; `-7 / 2` = −3; результат зависит от типов операндов.",
        "**`now()`** одинаков внутри транзакции; `clock_timestamp()` меняется.",
        "**`extract(dow …)`:** воскресенье = 0, `isodow`: воскресенье = 7; SQLite `strftime('%w')` вернул текст `'0'`.",
        "**Неоднозначные локальные времена:** при переходе назад час «повторяется», при переходе вперёд часа «нет» — арифметика на `timestamptz` с поясом избавляет от таких ошибок.",
        "**Функции дат в SQLite** возвращают текст; с несуществующей датой (`2024-02-30`) работают «мягко» и нормализуют результат.",
      ),
    ]),

    section("related", [
      ul(
        "[Типы данных и NULL](/learn/sql/data-types-null) — `COALESCE`, `NULLIF`, приведение типов.",
        "[SELECT и WHERE](/learn/sql/select-where) — условия и список выбора.",
        "[Агрегаты, GROUP BY и HAVING](/learn/sql/group-by-having) — `FILTER` и условные агрегаты.",
        "[Оконные функции](/learn/sql/window-functions) — выражения над окнами и скользящие периоды.",
        "[Паттерны схем](/learn/sql/schema-patterns) — как хранить время, деньги и справочники.",
        "[Настройка запросов](/learn/sql/query-tuning) — `WHERE` с функциями над столбцом и индексы.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Условный подсчёт через count",
          code: `
            SELECT count(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) FROM orders;
          `,
          note: "Возвращает число всех заказов: `0` — непустое значение, `count` его тоже считает.",
        },
        {
          title: "Через FILTER или sum",
          code: `
            SELECT count(*) FILTER (WHERE status = 'paid') FROM orders;
            SELECT sum(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) FROM orders;
          `,
          note: "Считает именно оплаченные заказы; `FILTER` читается лучше, `sum(CASE …)` переносимо.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.expressions-case-dates.ex1",
      title: "Предскажите результат",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская, определите результат каждого запроса и объясните последний."),
        code("sql", `SELECT CASE WHEN 5 > 3 THEN 'a' WHEN 5 > 1 THEN 'b' ELSE 'c' END;
SELECT CASE WHEN NULL = NULL THEN 'равны' ELSE 'иначе' END;
SELECT COALESCE(NULLIF('', ''), 'пусто');
SELECT 'ab' || 'cd' || 1;
SELECT 7 / 2, 7.0 / 2, 7 % 2;`, { filename: "10-ex-predict.sql", runnable: true }),
      ],
      hints: ["Какая ветка первой окажется истинной?", "Что делает `NULL = NULL` внутри `CASE WHEN`?", "Что вернёт `NULLIF('', '')`?", "Целочисленное деление и остаток"],
      checks: ["Первый: `a`", "Второй: `иначе`", "Третий: `пусто`", "Четвёртый: `abcd1`", "Пятый: 3, 3.5, 1"],
      solution: [
        code("text", ` case 
------
 a
(1 row)

 case  
-------
 иначе
(1 row)

 coalesce 
----------
 пусто
(1 row)

 ?column? 
----------
 abcd1
(1 row)

 ?column? |      ?column?      | ?column? 
----------+--------------------+----------
        3 | 3.5000000000000000 |        1
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "`CASE` возвращает первую истинную ветку: `5 > 3` — `a`.",
          "`NULL = NULL` неизвестно, поэтому ветка `WHEN` не срабатывает — `иначе`.",
          "`NULLIF('', '')` — `NULL`, `COALESCE` берёт следующее значение — `пусто`.",
          "Склейка приводит число к тексту: `abcd1`.",
          "`7 / 2` — целочисленное (3), `7.0 / 2` — десятичное (3.5…), `7 % 2` — остаток 1.",
        ),
      ],
    }),
    exercise({
      id: "sql.expressions-case-dates.ex2",
      title: "Счётчики показывают 13 и 13",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Нужно посчитать «закрытые» (paid, shipped) и «новые» заказы. Запрос возвращает по 13 для обоих счётчиков, хотя заказов разных статусов разное число. Объясните причину и исправьте тремя способами."),
        code("sql", `-- Хотим: сколько заказов «закрыто» (paid, shipped) и сколько «в работе» (new). Результат неверный:
SELECT count(CASE WHEN status IN ('paid', 'shipped') THEN 1 ELSE 0 END) AS closed,
       count(CASE WHEN status = 'new' THEN 1 ELSE 0 END)                AS in_progress
FROM orders;`, { filename: "11-ex-fix.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["Что считает `count(x)`?", "Является ли `0` пустым значением?", "Какой результат даёт `CASE` без `ELSE`?"],
      checks: ["Причина: `count` считает все непустые, включая `0`", "Исправление 1: убрать `ELSE`", "Исправление 2: `sum(… ELSE 0 …)`", "Исправление 3: `FILTER`"],
      solution: [
        code("sql", `SELECT count(CASE WHEN status IN ('paid', 'shipped') THEN 1 END) AS closed,
       count(CASE WHEN status = 'new' THEN 1 END)                AS in_progress,
       sum(CASE WHEN status IN ('paid', 'shipped') THEN 1 ELSE 0 END) AS closed_via_sum
FROM orders;`, { filename: "12-fix-solution.sql", runnable: true, fixture: "shop" }),
        code("text", ` closed | in_progress | closed_via_sum 
--------+-------------+----------------
     10 |           1 |             10
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Закрытых — 10 (7 `paid` + 3 `shipped`), новых — 1. Без `ELSE` ветка возвращает `NULL`, которую `count` не считает; `sum` суммирует единицы и нули. В PostgreSQL третий способ — `count(*) FILTER (WHERE status IN ('paid', 'shipped'))`."),
      ],
    }),
    exercise({
      id: "sql.expressions-case-dates.ex3",
      title: "Карточка заказа",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Сформируйте список заказов: номер, имя клиента, статус по-русски (Новый, Оплачен, Отгружен, Отменён), город (или «город не указан»), период `ГГГГ/ММ`. Заказы сортируйте по приоритету статуса (новые первыми, затем оплаченные, отгруженные, отменённые), внутри — по номеру. Покажите первые шесть."),
      ],
      hints: ["Простая форма `CASE o.status WHEN … THEN …`", "`COALESCE` для города", "`substr` для года и месяца", "`CASE` в `ORDER BY` для приоритета"],
      checks: ["Русские названия статусов", "Город с подстановкой", "Период `2024/03`", "Первым идёт заказ `6` со статусом «Новый»"],
      solution: [
        code("sql", `-- Карточка заказа с человекочитаемым статусом, возрастом заказа и приоритетом сортировки
SELECT o.id,
       c.name,
       CASE o.status
         WHEN 'new'       THEN 'Новый'
         WHEN 'paid'      THEN 'Оплачен'
         WHEN 'shipped'   THEN 'Отгружен'
         ELSE 'Отменён'
       END                                   AS status_ru,
       COALESCE(c.city, 'город не указан')   AS city,
       substr(CAST(o.ordered_on AS text), 1, 4) || '/' || substr(CAST(o.ordered_on AS text), 6, 2) AS period
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
ORDER BY CASE o.status WHEN 'new' THEN 0 WHEN 'paid' THEN 1 WHEN 'shipped' THEN 2 ELSE 3 END, o.id
LIMIT 6;`, { filename: "13-challenge.sql", runnable: true, fixture: "shop" }),
        code("text", ` id | name  | status_ru |  city  | period  
----+-------+-----------+--------+---------
  6 | Глеб  | Новый     | Самара | 2024/03
  1 | Анна  | Оплачен   | Москва | 2024/01
  2 | Анна  | Оплачен   | Москва | 2024/02
  4 | Вера  | Оплачен   | Москва | 2024/03
  7 | Анна  | Оплачен   | Москва | 2024/04
  9 | Борис | Оплачен   | Казань | 2024/04
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Единственный новый заказ (6) идёт первым, дальше оплаченные по возрастанию номера. Приоритет статуса задан отдельным `CASE` в `ORDER BY`, а русские названия — в списке выбора: сортировка не зависит от того, как называются статусы на экране."),
      ],
    }),
  ],

  challenge: {
    id: "sql.expressions-case-dates.challenge",
    title: "Календарь месяцев и сводка заказов",
    scenario: [
      p("Для дашборда нужна сводка заказов по месяцам первого полугодия 2024 года: даже месяцы без заказов должны присутствовать (с нулями), а границы месяцев — быть корректными для високосного года."),
    ],
    requirements: [
      "Сформировать календарь месяцев с января по июнь 2024 (`generate_series`)",
      "Для каждого месяца вывести начало, последний день и число заказов (включая нулевые)",
      "Использовать полуоткрытые границы `>= начало AND < начало следующего месяца`",
    ],
    constraints: [
      "PostgreSQL-специфичные функции допустимы",
      "Нельзя считать месяц как 30 дней",
    ],
    acceptance: [
      "Шесть строк; последний день февраля — `2024-02-29`",
      "Числа заказов по месяцам: 1, 2, 3, 3, 2, 2 (всего 13)",
    ],
    hints: [
      "`generate_series(timestamp '2024-01-01', timestamp '2024-06-01', interval '1 month')`.",
      "`LEFT JOIN` календаря с заказами, чтобы месяцы без заказов остались.",
      "Последний день: `(m + interval '1 month' - interval '1 day')::date`.",
    ],
    solution: [
      code("sql", `SELECT m::date                                           AS month_start,
       (m + interval '1 month' - interval '1 day')::date AS month_end,
       count(o.id)                                       AS orders
FROM generate_series(timestamp '2024-01-01', timestamp '2024-06-01', interval '1 month') AS m
LEFT JOIN orders AS o
       ON o.ordered_on >= m AND o.ordered_on < m + interval '1 month'
GROUP BY m
ORDER BY m;`, { filename: "14-challenge.pg.sql", lineNumbers: true }),
      code("text", ` month_start | month_end  | orders 
-------------+------------+--------
 2024-01-01  | 2024-01-31 |      1
 2024-02-01  | 2024-02-29 |      2
 2024-03-01  | 2024-03-31 |      3
 2024-04-01  | 2024-04-30 |      3
 2024-05-01  | 2024-05-31 |      2
 2024-06-01  | 2024-06-30 |      2
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Календарь генерируется, а не хранится; `LEFT JOIN` сохраняет месяцы без заказов (если бы заказов в марте не было, строка осталась бы с нулём). Границы полуоткрытые, поэтому конец месяца не зависит от времени суток."),
    ],
  },

  interview: [
    iq("sql.expressions-case-dates.i1", "basic", "Как работает CASE и что вернёт, если ни одно условие не подошло?", [
      ul(
        "Условия проверяются сверху вниз, возвращается результат первой истинной ветки.",
        "Если подходящей ветки нет и нет `ELSE`, результат `NULL`.",
        "Порядок важен: узкие условия пишут раньше широких.",
      ),
    ]),
    iq("sql.expressions-case-dates.i2", "basic", "Что делают COALESCE и NULLIF?", [
      ul(
        "`COALESCE(a, b, …)` возвращает первое не `NULL`.",
        "`NULLIF(a, b)` возвращает `NULL`, если `a = b`, иначе `a`.",
        "Вместе: `COALESCE(NULLIF(x, ''), 'нет')` превращает пустую строку и `NULL` в значение по умолчанию; `x / NULLIF(y, 0)` защищает от деления на ноль.",
      ),
    ]),
    iq("sql.expressions-case-dates.i3", "intermediate", "Почему count(CASE WHEN … THEN 1 ELSE 0 END) возвращает общее число строк?", [
      ul(
        "`count(expr)` считает непустые значения, а `0` — непустое значение.",
        "В замере оба условных счётчика вернули 13 (число всех заказов).",
        "Исправление: убрать `ELSE` (получится `NULL`), использовать `sum(… ELSE 0)` или `FILTER`.",
      ),
    ]),
    iq("sql.expressions-case-dates.i4", "intermediate", "Чем round(2.5) отличается для numeric и float8?", [
      ul(
        "`numeric` округляет «от нуля»: `round(2.5)` = 3.",
        "`float8` использует округление к ближайшему чётному: `round(2.5::float8)` = 2, `round(3.5::float8)` = 4 (замер).",
        "Для денег нужен `numeric` и единое правило округления в конце вычислений.",
      ),
    ]),
    iq("sql.expressions-case-dates.i5", "intermediate", "Что вернёт date '2024-01-31' + interval '1 month' в PostgreSQL и что в SQLite?", [
      ul(
        "PostgreSQL: `2024-02-29` — результат ограничивается последним днём месяца.",
        "SQLite: `date('2024-01-31', '+1 month')` → `2024-03-02` — переполнение дней переносится в следующий месяц (замер).",
        "Вывод: арифметику календарных месяцев нужно проверять в целевой СУБД и тестировать на конце месяца.",
      ),
    ]),
    iq("sql.expressions-case-dates.i6", "advanced", "Чем «+ interval '1 day'» отличается от «+ interval '24 hours'» для timestamptz?", [
      ul(
        "`1 day` — календарный сдвиг, сохраняющий местное время; `24 hours` — ровно 24 часа на оси времени.",
        "При переходе на летнее время они расходятся: в замере для Europe/Berlin 30.03 12:00 + 1 day = 31.03 12:00, а + 24 hours = 31.03 13:00.",
        "Выбор зависит от смысла: «в то же время завтра» — сутки, «через 24 часа» — часы.",
      ),
    ]),
    iq("sql.expressions-case-dates.i7", "engineering", "Как хранить и показывать время событий для пользователей в разных часовых поясах?", [
      ul(
        "Хранить `timestamptz` (внутри UTC) и IANA-имя пояса пользователя отдельно (`Europe/Berlin`), не смещение.",
        "Показывать через `AT TIME ZONE` или настройку `TimeZone` сессии; расчёты по календарю пользователя — в его поясе.",
        "Не хранить «часы на стене» без пояса для событий; тестировать переходы на летнее/зимнее время.",
      ),
    ]),
    iq("sql.expressions-case-dates.i8", "debugging", "Отчёт «по месяцам» теряет заказы последнего дня месяца и месяцы без заказов. Что проверить?", [
      ul(
        "Границы: `BETWEEN` с датой конца месяца теряет время суток; используйте `>= начало AND < начало следующего`.",
        "Месяцы без заказов исчезают при группировке только по данным: нужен календарь (`generate_series`) и `LEFT JOIN`.",
        "Часовой пояс: заказ в 23:30 по местному времени может попасть в другой день по UTC.",
        "Тип столбца: `date` или `timestamp`, и правильно ли приведены литералы.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.expressions-case-dates.e1", "foundation", "Что вернёт `CASE WHEN 1 = 2 THEN 'a' END`?", ["`'a'`", "Пустую строку", "`NULL`", "Ошибку"], 2, "Без подходящей ветки и без `ELSE` `CASE` возвращает `NULL`."),
    mcq("sql.expressions-case-dates.e2", "foundation", "Чему равно `7 / 2` для целых чисел в PostgreSQL?", ["`3`", "`3.5`", "`4`", "`2`"], 0, "Деление двух `integer` целочисленное: 3 (замер)."),
    mcq("sql.expressions-case-dates.e3", "foundation", "Что делает `COALESCE(city, 'нет')`?", ["Заменяет любой город на «нет»", "Проверяет, равно ли `city` «нет»", "Удаляет строки с `NULL`", "Возвращает `city`, а при `NULL` — «нет»"], 3, "`COALESCE` возвращает первое не `NULL` значение из списка."),
    mcq("sql.expressions-case-dates.e4", "intermediate", "Какой из вариантов правильно считает число оплаченных заказов?", ["`count(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)`", "`sum(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)`", "`count(status = 'paid')`", "`max(CASE WHEN status = 'paid' THEN 1 END)`"], 1, "`sum` суммирует единицы; `count` с `ELSE 0` посчитает все строки, `count(boolean)` — все непустые, `max` вернёт 1."),
    mcq("sql.expressions-case-dates.e5", "intermediate", "Какие утверждения верны для PostgreSQL? Выберите все.", ["`round(2.5)` для `numeric` равно 3", "`round(2.5::float8)` равно 2", "`date '2024-01-31' + interval '1 month'` равно `2024-03-02`", "`length('привет')` равно 6"], [0, 1, 3], "Замеры: `3`, `2`, `2024-02-29` (а не 03-02), `6` символов."),
    mcq("sql.expressions-case-dates.e6", "intermediate", "Чем `timestamptz` отличается от `timestamp`?", ["Ничем", "Второй точнее на микросекунды", "Первый хранит только дату", "Первый хранит момент времени (UTC) и учитывает пояс сессии; второй — «часы на стене» без пояса"], 3, "`timestamptz` — момент на оси времени; `timestamp` — показания часов без привязки к поясу."),
    mcq("sql.expressions-case-dates.e7", "advanced", "Как в Europe/Berlin отличаются `ts + interval '1 day'` и `ts + interval '24 hours'` при ts = 30.03.2024 12:00?", ["Результаты одинаковы", "`1 day` даёт 31.03 13:00, `24 hours` — 31.03 12:00", "`1 day` даёт 31.03 12:00, `24 hours` — 31.03 13:00", "Оба дают 30.03 12:00"], 2, "В ночь на 31 марта часы переведены вперёд: календарные сутки сохраняют местное время, 24 часа — ось времени (замер)."),
    open("sql.expressions-case-dates.e8", "intermediate", "Постройте запрос «заказы по месяцам со столбцами по статусам» и объясните, чем условные агрегаты лучше нескольких отдельных запросов.", [
      ul(
        "`SELECT date_trunc('month', ordered_on) AS month, count(*) FILTER (WHERE status = 'paid') AS paid, count(*) FILTER (WHERE status = 'shipped') AS shipped, … FROM orders GROUP BY 1 ORDER BY 1` (или `sum(CASE WHEN … THEN 1 ELSE 0 END)`).",
        "Один проход по таблице вместо нескольких запросов: быстрее и согласованнее (все цифры из одного снимка данных).",
        "Контроль: сумма статусов равна `count(*)` по месяцу; несхождение — повод искать неучтённый статус.",
        "Месяцы без заказов добавляются календарём (`generate_series`) и `LEFT JOIN`.",
      ),
    ], ["Использован условный агрегат", "Объяснено преимущество одного прохода", "Названа контрольная сверка", "Упомянут календарь для пустых месяцев"], { format: "sql" }),
  ],

  mastery: [
    mcq("sql.expressions-case-dates.m1", "intermediate", "Что вернёт `SELECT count(CASE WHEN status = 'new' THEN 1 ELSE 0 END) FROM orders` при 13 заказах, из которых 1 новый?", ["1", "13", "12", "0"], 1, "`count` считает непустые значения, а `0` — непустое: результат 13 (замер)."),
    mcq("sql.expressions-case-dates.m2", "advanced", "Что вернёт SQLite для `date('2024-01-31', '+1 month')`?", ["`2024-03-02`", "`2024-02-29`", "`2024-02-31`", "`NULL`"], 0, "SQLite нормализует переполнение дней: 31 февраля = 2 марта (замер); PostgreSQL ограничил бы 29 февраля."),
    mcq("sql.expressions-case-dates.m3", "advanced", "Почему `CASE WHEN x <> 0 THEN 100 / x END` защищает от деления на ноль, а `WHERE x <> 0 AND 100 / x > 1` — нет гарантии?", ["`CASE` быстрее", "В `WHERE` деление запрещено", "`CASE` гарантирует порядок вычисления веток, а условия `AND` СУБД вправе переупорядочить", "`CASE` проверяет типы"], 2, "Стандарт гарантирует порядок вычисления ветвей `CASE`; планировщик может проверить условия `WHERE` в любом порядке."),
    open("sql.expressions-case-dates.m4", "advanced", "Платёжный сервис хранит время платежей как `timestamp` без пояса, а клиенты находятся в разных странах. Отчёты «за вчера» расходятся с бухгалтерией. Опишите диагностику и план исправления.", [
      ul(
        "Выяснить, в каком поясе записываются значения (UTC, сервер, клиент): сравнить с известными платежами и логами.",
        "Показать конкретные платежи около полуночи, которые попадают в разные «дни» в разных поясах.",
        "Миграция: добавить `timestamptz`, заполнить с явным указанием исходного пояса (`AT TIME ZONE`), переключить запись и чтение, затем удалить старый столбец; хранить IANA-пояс клиента для отчётов.",
        "Определить «день» отчёта: в поясе бухгалтерии; границы — полуоткрытые интервалы в этом поясе.",
        "Тесты: полночь, перевод часов, високосный день.",
      ),
    ], ["Выявлен пояс исходных данных", "Показаны примеры пограничных платежей", "План миграции на timestamptz", "Определён «день» отчёта и граничные тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.expressions-case-dates.f1", front: "CASE?", back: "Условия сверху вниз; первая истинная ветка. Без ELSE — NULL. Порядок: от узкого к широкому." },
    { id: "sql.expressions-case-dates.f2", front: "Условный счёт?", back: "count(CASE … THEN 1 END), sum(CASE … THEN 1 ELSE 0 END) или count(*) FILTER (WHERE …). count(… ELSE 0) считает всё." },
    { id: "sql.expressions-case-dates.f3", front: "round(2.5)?", back: "numeric: 3. float8: 2 (к чётному). Деньги — numeric." },
    { id: "sql.expressions-case-dates.f4", front: "Месяц + 31 января?", back: "PostgreSQL: 29 февраля 2024. SQLite date('2024-01-31','+1 month') → 2024-03-02." },
    { id: "sql.expressions-case-dates.f5", front: "1 day и 24 hours?", back: "1 day — календарь (то же время), 24 hours — ось времени. При переходе на летнее время расходятся." },
    { id: "sql.expressions-case-dates.f6", front: "timestamp и timestamptz?", back: "timestamptz — момент (UTC внутри, пояс сессии при выводе); timestamp — часы на стене без пояса." },
    { id: "sql.expressions-case-dates.f7", front: "Защита от деления на ноль?", back: "x / NULLIF(y, 0) или CASE WHEN y <> 0 THEN x / y END. Порядок веток CASE гарантирован." },
    { id: "sql.expressions-case-dates.f8", front: "Группировка по месяцу?", back: "PostgreSQL: date_trunc('month', ts). SQLite: strftime('%Y-%m', d) или substr." },
    { id: "sql.expressions-case-dates.f9", front: "Пустые месяцы в отчёте?", back: "generate_series календарь + LEFT JOIN; границы полуоткрытые." },
  ],

  sources: [
    { title: "PostgreSQL 16: Conditional Expressions (CASE, COALESCE, NULLIF, GREATEST)", url: "https://www.postgresql.org/docs/16/functions-conditional.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Date/Time Functions and Operators", url: "https://www.postgresql.org/docs/16/functions-datetime.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Date/Time Types", url: "https://www.postgresql.org/docs/16/datatype-datetime.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Mathematical Functions and Operators", url: "https://www.postgresql.org/docs/16/functions-math.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: String Functions and Operators", url: "https://www.postgresql.org/docs/16/functions-string.html", publisher: "PostgreSQL" },
    { title: "SQLite: Date And Time Functions", url: "https://www.sqlite.org/lang_datefunc.html", publisher: "Other" },
    { title: "SQLite: Core Functions", url: "https://www.sqlite.org/lang_corefunc.html", publisher: "Other" },
  ],
};
