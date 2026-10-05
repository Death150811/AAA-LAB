import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  note,
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

export const dataTypesNull: Topic = {
  id: "sql.data-types-null",
  slug: "data-types-null",
  domain: "sql",
  module: "relational",
  title: "Типы данных и NULL",
  titleEn: "Data Types and NULL",
  summary:
    "Тип столбца определяет, что можно хранить, какие операции допустимы и как округляются числа; `NULL` — не значение, а признак «неизвестно», из-за которого логика SQL трёхзначная. Тема на замерах PostgreSQL 16.14 и SQLite 3.49 показывает, почему `NULL = NULL` не истина, как `NULL` «съедает» строки в `WHERE` (из 8 клиентов `<> 'Москва'` вернул 4, а не 5), как ловушка `NOT IN` с `NULL` даёт 0 строк вместо 6, чем `avg` по столбцу с пропусками (`4.0`) отличается от среднего с нулями (`3.0`), почему `0.1 + 0.2 = 0.3` истинно для `numeric` и ложно для `float`, как переполняется `integer`, и чем PostgreSQL строго отличается от SQLite, который приводит типы мягко.",
  minutes: 70,
  prerequisites: ["sql.relational-model"],
  tags: ["data types", "NULL", "three-valued logic", "COALESCE", "NULLIF", "numeric", "float", "integer", "text", "timestamp", "timestamptz", "boolean", "cast", "IS DISTINCT FROM", "NOT IN", "PostgreSQL", "SQLite"],
  keyConcepts: [
    { term: "NULL — «неизвестно», а не значение", text: "`NULL` не равен ничему, даже самому себе: `NULL = NULL` даёт не истину, а `NULL`. Проверка — только `IS NULL` / `IS NOT NULL` / `IS DISTINCT FROM`." },
    { term: "Трёхзначная логика", text: "Условие бывает истинным, ложным или неизвестным. `WHERE` оставляет только истинные строки: из 8 клиентов `city <> 'Москва'` вернул 4 (клиент с `NULL` пропал), `IS DISTINCT FROM` — 5." },
    { term: "Агрегаты пропускают NULL", text: "`count(score)` = 3 при 4 строках, `avg(score)` = 4.0 (по трём известным), а `avg(COALESCE(score, 0))` = 3.0. Что считать «ноль или неизвестно» — решение предметной области." },
    { term: "Деньги — в `numeric` или в целых копейках", text: "`float` хранит двоичные дроби: `0.1 + 0.2 = 0.3` ложно (`0.30000000000000004`), `numeric` точен. Целые копейки (`amount_cents`) — самый надёжный вариант." },
    { term: "Строгие и мягкие типы", text: "PostgreSQL отвергает `'abc'` для `integer` и `varchar(3)` не вместит 4 символа; SQLite хранит значение как есть. Поэтому запросы нужно проверять в целевой СУБД." },
  ],
  sections: [
    section("definition", [
      def("Тип данных", "Набор допустимых значений столбца и операций над ними (`integer`, `numeric`, `text`, `boolean`, `date`, `timestamptz`…). Тип проверяется при записи и определяет сравнение, сортировку и округление.", "data type"),
      def("NULL", "Специальный маркер «значение отсутствует или неизвестно». Не ноль, не пустая строка, не `false`. Результат любого сравнения с `NULL` — `NULL` (неизвестно).", "NULL"),
      def("Трёхзначная логика", "Логика с тремя значениями: истина, ложь, неизвестно (`UNKNOWN`). `WHERE`, `HAVING`, `ON` пропускают только строки, для которых условие истинно.", "three-valued logic"),
      def("COALESCE", "Возвращает первое не `NULL` значение из списка аргументов: `COALESCE(city, 'не указан')`.", "COALESCE"),
      def("NULLIF", "`NULLIF(a, b)` возвращает `NULL`, если `a = b`, иначе `a`. Применяют, чтобы превратить «опасное» значение в `NULL` (например, ноль в знаменателе).", "NULLIF"),
      def("numeric", "Точный десятичный тип произвольной точности: `numeric(10, 2)` — до 10 цифр, из них 2 после запятой. Подходит для денег и всего, где нельзя терять копейки.", "numeric / decimal"),
      def("Приведение типов (cast)", "Явное преобразование значения: `CAST(x AS integer)` или `x::integer` (PostgreSQL). Некорректная строка вызывает ошибку.", "cast"),
      def("timestamptz", "Тип «момент времени»: PostgreSQL хранит его в UTC и показывает в часовом поясе сессии. Тип `timestamp` без пояса хранит «часы на стене» без привязки к моменту.", "timestamp with time zone"),
    ]),

    section("why", [
      h("Тип — это первая и самая дешёвая проверка данных"),
      p("Если столбец `price` имеет тип `numeric(8,2)`, в него невозможно записать `'много'`; если `signed_up` — `date`, в него не попадёт `'31 февраля'` (замер: `date/time field value out of range`). Тип защищает данные до первого запроса и подсказывает СУБД, как их хранить, сравнивать и индексировать. Неверный тип — источник тихих ошибок: деньги в `float`, даты в `text`, идентификаторы в `integer` до первого переполнения."),
      h("NULL нужен, но опасен"),
      p("В реальных данных что-то всегда неизвестно: у клиента нет телефона, у платежа нет комментария, у сотрудника ещё не назначен бонус. `NULL` честно говорит «не знаем» — это лучше, чем подставлять `0` или `'нет'`, которые выглядят как данные. Цена — особая логика: любое сравнение с `NULL` неизвестно, а `WHERE` пропускает только истинное. Большая часть «странных» результатов SQL — это `NULL`."),
      ul(
        "**Корректность отчётов:** `avg` по столбцу с пропусками и среднее с нулями — разные числа, и бизнес должен выбрать, какое ему нужно.",
        "**Безопасность запросов:** `NOT IN` с одним `NULL` в подзапросе молча возвращает 0 строк.",
        "**Переносимость:** SQLite и PostgreSQL по-разному приводят типы и упорядочивают `NULL`.",
      ),
    ]),

    section("mental-model", [
      h("NULL — это «неизвестно», а не «ничего»"),
      p("Представьте, что `NULL` — закрытый конверт. Вопрос «равно ли содержимое двух закрытых конвертов?» не имеет ответа «да» или «нет» — ответ «неизвестно». Поэтому `NULL = NULL` — тоже `NULL`. Вопрос «пуст ли конверт?» — отдельный: для него есть специальная проверка `IS NULL`."),
      diagram(
        `
        AND        TRUE  FALSE  UNKNOWN        OR         TRUE  FALSE  UNKNOWN
        TRUE       TRUE  FALSE  UNKNOWN        TRUE       TRUE  TRUE   TRUE
        FALSE      FALSE FALSE  FALSE          FALSE      TRUE  FALSE  UNKNOWN
        UNKNOWN    UNKNOWN FALSE UNKNOWN       UNKNOWN    TRUE  UNKNOWN UNKNOWN

        NOT TRUE = FALSE     NOT FALSE = TRUE     NOT UNKNOWN = UNKNOWN
        `,
        "Таблицы истинности трёхзначной логики. Ложь «побеждает» в `AND`, истина — в `OR`; во всём остальном неизвестность распространяется.",
      ),
      h("Тип — договор о представлении"),
      p("Тип отвечает на три вопроса: **что допустимо** (диапазон, длина), **как сравнивать и сортировать** (числа по величине, строки по правилам сортировки) и **что делать при вычислениях** (целочисленное деление, округление). Разные типы одной «величины» — разные договоры: сумма в `float` и в `numeric` — не одно и то же."),
      steps(
        [
          ["Выберите тип по смыслу", "Количество — `integer`, деньги — `numeric` или целые копейки, момент — `timestamptz`, флаг — `boolean`, имя — `text`."],
          ["Решите, допустим ли NULL", "Если значение обязательно — `NOT NULL`. Если «неизвестно» — осмысленное состояние, оставьте `NULL`, но запишите, что оно означает."],
          ["Ограничьте значения", "`CHECK (amount_cents > 0)` отвергает невозможные данные уже при записи."],
          ["Проверьте запросы на NULL", "Для каждого условия спросите: что будет, если здесь `NULL`?"],
        ],
        "Как выбирать тип и допустимость NULL",
      ),
    ]),

    section("technical", [
      h("Основные типы PostgreSQL"),
      table(
        ["Тип", "Что хранит", "Заметки"],
        [
          ["`smallint`, `integer`, `bigint`", "Целые 2, 4, 8 байт", "`integer` — до 2 147 483 647; при выходе за границу — ошибка `integer out of range`"],
          ["`numeric(p, s)`", "Точные десятичные", "Деньги и ставки; вычисления медленнее целых"],
          ["`real`, `double precision`", "Двоичные дроби (float)", "Быстро, но неточно: `0.1 + 0.2 ≠ 0.3`; для измерений, не для денег"],
          ["`text`, `varchar(n)`, `char(n)`", "Строки", "`text` и `varchar` в PostgreSQL одинаково быстры; `varchar(n)` проверяет длину"],
          ["`boolean`", "`true`, `false`, `NULL`", "В `psql` выводится как `t` и `f`; в SQLite — целые 1 и 0"],
          ["`date`, `time`, `timestamp`, `timestamptz`", "Даты и моменты времени", "Для моментов используйте `timestamptz`"],
          ["`uuid`, `jsonb`", "Идентификаторы, документы", "Особые типы PostgreSQL; в SQLite отсутствуют как типы"],
        ],
        "Типы, которые нужны в первых проектах",
      ),
      h("NULL в выражениях и условиях"),
      ul(
        "**Арифметика и конкатенация:** `1 + NULL` → `NULL`, `'abc' || NULL` → `NULL`.",
        "**Сравнения:** `x = NULL`, `x <> NULL` всегда `NULL`; используйте `IS NULL`, `IS NOT NULL`, `IS DISTINCT FROM`, `IS NOT DISTINCT FROM`.",
        "**Фильтры:** `WHERE` оставляет строки, где условие **истинно**; ложь и неизвестность отбрасываются.",
        "**Агрегаты:** `count(*)` считает строки; `count(x)`, `sum(x)`, `avg(x)`, `min`, `max` пропускают `NULL`. Если все значения `NULL`, `sum`/`avg` вернут `NULL`, а `count` — 0.",
        "**`NOT IN`:** `x NOT IN (…, NULL)` никогда не истинно, поэтому строки пропадают; безопаснее `NOT EXISTS`.",
        "**Сортировка:** в PostgreSQL `NULL` считается «больше всех»: в `ASC` идёт последним, в `DESC` — первым; в SQLite наоборот. Явно: `NULLS FIRST` / `NULLS LAST`.",
        "**Ограничения:** `UNIQUE` допускает несколько `NULL` (каждый — «неизвестно»); `CHECK` пропускает `NULL`, если выражение неизвестно.",
      ),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `CREATE TABLE staff_pay (
  name   text NOT NULL,
  salary integer NOT NULL,
  bonus  integer,
  hours  integer NOT NULL
);
INSERT INTO staff_pay (name, salary, bonus, hours) VALUES
  ('Анна',  100000, 20000, 160),
  ('Борис',  90000, NULL,  160),
  ('Вера',   80000, 0,      0),
  ('Глеб',   70000, 5000,  120);

SELECT name,
       salary + COALESCE(bonus, 0)               AS total,
       bonus IS NULL                             AS no_bonus_info,
       salary / NULLIF(hours, 0)                 AS per_hour
FROM staff_pay
ORDER BY bonus DESC NULLS LAST, name;

SELECT count(*)                  AS people,
       count(bonus)              AS with_bonus_info,
       avg(bonus)                AS avg_bonus_known,
       avg(COALESCE(bonus, 0))   AS avg_bonus_all
FROM staff_pay;`,
        [
          { line: [1, 6], text: "Таблица с обязательными `name`, `salary`, `hours` и необязательным `bonus` — `NULL` означает «бонус не определён»." },
          { line: [7, 11], text: "Четыре строки: у Бориса `bonus` неизвестен, у Веры бонус `0` и `hours = 0` — это разные ситуации: «неизвестно» и «ноль»." },
          { line: [13, 17], text: "`COALESCE(bonus, 0)` подставляет 0 только в вычислении суммы; `bonus IS NULL` показывает, что бонуса нет; `NULLIF(hours, 0)` превращает деление на ноль в `NULL`, а не в ошибку." },
          { line: 18, text: "`ORDER BY bonus DESC NULLS LAST` задаёт место `NULL` явно, чтобы результат не зависел от СУБД." },
          { line: [20, 24], text: "`count(bonus)` считает известные бонусы, `avg(bonus)` усредняет только их, а `avg(COALESCE(bonus, 0))` усредняет всех, считая неизвестное нулём." },
        ],
        "16-challenge.sql",
      ),
    ]),

    section("minimal-example", [
      p("Самый короткий опыт с `NULL`: сравнения. Выполните блок в браузере — SQLite даст те же значения (в PostgreSQL пустая ячейка — это `NULL`)."),
      code("sql", `SELECT 1 = NULL        AS one_eq_null,
       NULL = NULL     AS null_eq_null,
       NULL IS NULL    AS null_is_null,
       1 IS NOT NULL   AS one_is_not_null;`, { filename: "01-null-compare.sql", runnable: true }),
      code("text", ` one_eq_null | null_eq_null | null_is_null | one_is_not_null 
-------------+--------------+--------------+-----------------
             |              | t            | t
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`1 = NULL` и `NULL = NULL` — неизвестны (пустые ячейки), а `NULL IS NULL` — истина (`t`). Для проверки на отсутствие значения существует только `IS NULL`."),
    ]),

    section("detailed-example", [
      p("Сначала таблицы истинности. Девять комбинаций «истина — ложь — неизвестно» показывают, где неизвестность превращается в определённый ответ: `ЛОЖЬ AND неизвестно` — ложь, `ИСТИНА OR неизвестно` — истина."),
      code("sql", `WITH v(name, val) AS (
  VALUES ('TRUE', 1 = 1), ('FALSE', 1 = 0), ('UNKNOWN', 1 = NULL)
)
SELECT a.name AS a, b.name AS b,
       (a.val AND b.val) AS a_and_b,
       (a.val OR  b.val) AS a_or_b
FROM v AS a CROSS JOIN v AS b
ORDER BY a.name DESC, b.name DESC;`, { filename: "02-truth-table.sql", runnable: true }),
      code("text", `    a    |    b    | a_and_b | a_or_b 
---------+---------+---------+--------
 UNKNOWN | UNKNOWN |         | 
 UNKNOWN | TRUE    |         | t
 UNKNOWN | FALSE   | f       | 
 TRUE    | UNKNOWN |         | t
 TRUE    | TRUE    | t       | t
 TRUE    | FALSE   | f       | t
 FALSE   | UNKNOWN | f       | 
 FALSE   | TRUE    | f       | t
 FALSE   | FALSE   | f       | f
(9 rows)`, { filename: "результат (PostgreSQL 16.14): t — истина, f — ложь, пусто — NULL" }),
      p("Теперь влияние на настоящий фильтр. В наборе «shop» 8 клиентов, у одного (Егор) город неизвестен. Сумма «из Москвы» и «не из Москвы» не даёт 8:"),
      code("sql", `SELECT
  count(*)                                              AS all_customers,
  count(*) FILTER (WHERE city = 'Москва')               AS moscow,
  count(*) FILTER (WHERE city <> 'Москва')              AS not_moscow,
  count(*) FILTER (WHERE city IS NULL)                  AS unknown_city,
  count(*) FILTER (WHERE city IS DISTINCT FROM 'Москва') AS not_moscow_or_unknown
FROM customers;`, { filename: "03-where-null.sql", runnable: true, fixture: "shop" }),
      code("text", ` all_customers | moscow | not_moscow | unknown_city | not_moscow_or_unknown 
---------------+--------+------------+--------------+-----------------------
             8 |      3 |          4 |            1 |                     5
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "`3 + 4 = 7`, а клиентов 8: Егор не попал ни в `= 'Москва'`, ни в `<> 'Москва'` — для него оба условия неизвестны.",
        "`IS DISTINCT FROM` считает `NULL` обычным различимым значением и возвращает 5 (4 из других городов + Егор).",
        "`IS NULL` находит единственного клиента с неизвестным городом.",
      ),
    ]),

    section("analysis", [
      table(
        ["Выражение", "Результат", "Почему"],
        [
          ["`city = 'Москва'`", "3 строки", "Для `NULL` условие неизвестно — строка отброшена"],
          ["`city <> 'Москва'`", "4 строки", "Снова неизвестно для `NULL`: Егор пропадает"],
          ["`city IS NULL`", "1 строка", "Специальная проверка на отсутствие значения"],
          ["`city IS DISTINCT FROM 'Москва'`", "5 строк", "`NULL` считается отличным от `'Москва'`"],
          ["`1 + NULL`", "`NULL`", "Арифметика с неизвестным — неизвестна"],
          ["`COALESCE(NULL, NULL, 3)`", "`3`", "Первое не `NULL`"],
        ],
        "Влияние NULL на фильтры и выражения (замеры PostgreSQL 16.14)",
      ),
      note("`WHERE` принимает только истинные строки. Это не баг, а следствие трёхзначной логики: «неизвестно» не доказывает, что строка подходит."),
    ]),

    section("internals", [
      h("Как PostgreSQL хранит NULL"),
      p("Каждая строка имеет заголовок и необязательный **битовый массив `NULL`**: по одному биту на столбец. Значение `NULL` не занимает места в данных строки — хранится только бит. Поэтому широкие таблицы с редкими значениями дёшевы, а проверка `IS NULL` — чтение одного бита."),
      h("Числа: целые, точные, приблизительные"),
      p("Целые (`integer`) вычисляются аппаратно и точно в пределах диапазона. `numeric` хранит цифры в десятичном виде и вычисляет точно. `float8` хранит двоичную дробь (IEEE 754), где `0.1` не представимо точно — отсюда погрешности."),
      code("sql", `SELECT 0.1 + 0.2 = 0.3                         AS numeric_literals,
       0.1::float8 + 0.2::float8 = 0.3::float8 AS double_precision,
       (0.1::float8 + 0.2::float8)::text       AS float_sum_text,
       (0.1::numeric + 0.2::numeric)::text     AS numeric_sum_text;`, { filename: "08-float.pg.sql" }),
      code("text", ` numeric_literals | double_precision |   float_sum_text    | numeric_sum_text 
------------------+------------------+---------------------+------------------
 t                | f                | 0.30000000000000004 | 0.3
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Десятичные литералы PostgreSQL (`0.1`) — типа `numeric`, поэтому `0.1 + 0.2 = 0.3` истинно. Те же числа как `float8` дают сумму `0.30000000000000004` и равенство ложно. В SQLite десятичные литералы — вещественные: в замере на sql.js `0.1 + 0.2 = 0.3` вернул `0`."),
      h("Переполнение целых"),
      code("sql", `SELECT 2147483647 + 1;
SELECT 2147483647::bigint + 1 AS bigint_ok;
SELECT 9223372036854775807 + 1;
SELECT 9223372036854775807::numeric + 1 AS numeric_ok;`, { filename: "10-overflow.pg.sql" }),
      code("text", `ERROR:  integer out of range
 bigint_ok  
------------
 2147483648
(1 row)

ERROR:  bigint out of range
     numeric_ok      
---------------------
 9223372036854775808
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("PostgreSQL выбирает тип по операндам и ловит выход за границу ошибкой, а не молчаливой потерей. SQLite при переполнении 64-битного целого тихо переходит к вещественным числам (замер: `typeof(9223372036854775807 + 1)` → `real`)."),
      h("Строки и даты"),
      code("sql", `SELECT length('привет')       AS chars,
       octet_length('привет') AS bytes,
       upper('привет')        AS upper_cyr;

CREATE TABLE codes (code varchar(3));
INSERT INTO codes VALUES ('abc');
INSERT INTO codes VALUES ('abcd');
SELECT code FROM codes;`, { filename: "11-text-lengths.pg.sql" }),
      code("text", ` chars | bytes | upper_cyr 
-------+-------+-----------
     6 |    12 | ПРИВЕТ
(1 row)

ERROR:  value too long for type character varying(3)
 code 
------
 abc
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`length` считает символы (6), а `octet_length` — байты в UTF-8 (12: кириллица — по два байта). Ограничение `varchar(3)` в PostgreSQL отвергло строку из четырёх символов; SQLite длину не проверяет (замер: `'abcd'` сохранилась)."),
      code("sql", `CREATE TABLE events (id integer, at_tz timestamptz, at_plain timestamp);
INSERT INTO events VALUES (1, '2024-03-10 12:00:00+00', '2024-03-10 12:00:00');

SET TIME ZONE 'UTC';
SELECT at_tz, at_plain FROM events;

SET TIME ZONE 'Asia/Yekaterinburg';
SELECT at_tz, at_plain FROM events;`, { filename: "12-timestamps.pg.sql" }),
      code("text", `         at_tz          |      at_plain       
------------------------+---------------------
 2024-03-10 12:00:00+00 | 2024-03-10 12:00:00
(1 row)

         at_tz          |      at_plain       
------------------------+---------------------
 2024-03-10 17:00:00+05 | 2024-03-10 12:00:00
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Один и тот же момент `timestamptz` показан как `12:00+00` и `17:00+05` в разных часовых поясах сессии — это одна точка во времени. `timestamp` без пояса вывелся одинаково: это просто «12:00» без привязки к моменту; сменив пояс сервера, вы не узнаете, какой момент имелся в виду."),
    ]),

    section("mistakes", [
      h("Ошибка: сравнивать с NULL через `=`"),
      wrongRight(
        "sql",
        { title: "Всегда пусто", code: `SELECT name FROM customers WHERE city = NULL;`, note: "Условие неизвестно для каждой строки — результат пуст, даже если Егор с `NULL` существует." },
        { title: "Проверка на отсутствие", code: `SELECT name FROM customers WHERE city IS NULL;`, note: "`IS NULL` возвращает истину для строк с отсутствующим значением." },
      ),
      h("Ошибка: `NOT IN` с подзапросом, который может вернуть NULL"),
      code("sql", `-- В подзапросе есть NULL (у Егора город неизвестен)
SELECT name
FROM customers
WHERE city NOT IN (SELECT city FROM customers WHERE name IN ('Анна', 'Егор'))
ORDER BY name;

-- Исправление 1: убрать NULL из подзапроса
SELECT name
FROM customers
WHERE city NOT IN (SELECT city FROM customers WHERE name IN ('Анна', 'Егор') AND city IS NOT NULL)
ORDER BY name;

-- Исправление 2: NOT EXISTS ведёт себя предсказуемо
SELECT c.name
FROM customers AS c
WHERE NOT EXISTS (
  SELECT 1 FROM customers AS x
  WHERE x.name IN ('Анна', 'Егор') AND x.city = c.city
)
ORDER BY c.name;`, { filename: "04-not-in-trap.sql", runnable: true, fixture: "shop" }),
      code("text", ` name 
------
(0 rows)

 name  
-------
 Борис
 Глеб
 Дарья
 Игорь
(4 rows)

 name  
-------
 Борис
 Глеб
 Дарья
 Егор
 Игорь
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Первый запрос вернул **0 строк**: в подзапросе есть `NULL`, поэтому `city NOT IN ('Москва', NULL)` для любой строки либо ложно (город — Москва), либо неизвестно (всё остальное). Исправление — убрать `NULL` из подзапроса (4 клиента) или использовать `NOT EXISTS` (5 клиентов, включая Егора: у него нет города, значит совпадения нет — смысл разный, поэтому выбирайте осознанно)."),
      h("Ошибка: деньги в float"),
      p("Суммы в `real`/`double precision` накапливают погрешность: `0.1 + 0.2 ≠ 0.3`. Для денег — `numeric(p, s)` или целые минимальные единицы (`amount_cents`). Пример ниже использует целые копейки: сумма и счётчики точны."),
      code("sql", `CREATE TABLE payments (
  id           integer PRIMARY KEY,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency     text    NOT NULL CHECK (length(currency) = 3),
  paid_at      text    NOT NULL,
  note         text
);

INSERT INTO payments (id, amount_cents, currency, paid_at, note) VALUES
  (1, 129900, 'RUB', '2024-03-10 12:00:00', 'кофемашина'),
  (2,     50, 'RUB', '2024-03-10 12:05:00', NULL),
  (3,   9990, 'EUR', '2024-03-11 09:30:00', 'подписка');

SELECT currency, sum(amount_cents) AS total_cents, count(note) AS with_note, count(*) AS payments
FROM payments
GROUP BY currency
ORDER BY currency;`, { filename: "15-payments.sql", runnable: true }),
      code("text", ` currency | total_cents | with_note | payments 
----------+-------------+-----------+----------
 EUR      |        9990 |         1 |        1
 RUB      |      129950 |         1 |        2
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      h("Ошибка: тихое приведение типов"),
      code("sql", `SELECT CAST('42' AS integer) AS parsed, '42'::integer + 1 AS shorthand;
SELECT CAST(3.7 AS integer)  AS from_numeric;
SELECT CAST('3.7' AS integer);
SELECT CAST('abc' AS integer);
SELECT '2024-02-30'::date;`, { filename: "13-casts.pg.sql" }),
      code("text", ` parsed | shorthand 
--------+-----------
     42 |        43
(1 row)

 from_numeric 
--------------
            4
(1 row)

ERROR:  invalid input syntax for type integer: "3.7"
LINE 1: SELECT CAST('3.7' AS integer);
                    ^
ERROR:  invalid input syntax for type integer: "abc"
LINE 1: SELECT CAST('abc' AS integer);
                    ^
ERROR:  date/time field value out of range: "2024-02-30"
LINE 1: SELECT '2024-02-30'::date;
               ^`, { filename: "результат (PostgreSQL 16.14)" }),
      p("PostgreSQL округляет `CAST(3.7 AS integer)` до 4, но не разбирает `'3.7'` как целое (ошибка), не принимает `'abc'` и несуществующую дату `2024-02-30`. SQLite мягче: все эти преобразования проходят (замер: `3`, `3`, `0`, а `date('2024-02-30')` → `2024-03-01`) — ошибки превращаются в тихо неверные данные."),
    ]),

    section("antipatterns", [
      ul(
        "**«Магические значения» вместо NULL:** `-1`, `0`, `'1970-01-01'`, `'нет'` в роли «неизвестно» портят суммы, средние и сортировку.",
        "**`NULL` без смысла:** столбец допускает `NULL`, но никто не знает, что это означает (не заполнено? не применимо? ошибка загрузки?).",
        "**Даты и деньги в `text`:** нельзя сравнить диапазоном, посчитать, проиндексировать по смыслу; «10» < «9» в строковой сортировке.",
        "**`float` для денег.**",
        "**Всё в `varchar(255)`** «на всякий случай»: в PostgreSQL это не ускоряет работу и скрывает настоящие ограничения предметной области.",
        "**`SELECT … WHERE x = NULL`** и `NOT IN (SELECT nullable …)` без проверки.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Помечайте обязательные столбцы `NOT NULL`** и допускайте `NULL` только осознанно; документируйте его смысл.",
        "**Сравнивайте с `NULL` только операторами** `IS NULL`, `IS NOT NULL`, `IS [NOT] DISTINCT FROM`.",
        "**Задавайте место `NULL` в сортировке** (`NULLS FIRST/LAST`), если порядок виден пользователю или переносится между СУБД.",
        "**Деньги — `numeric(p, s)` или целые минимальные единицы**; валюту храните отдельным столбцом.",
        "**Моменты времени — `timestamptz`**, даты без времени — `date`; `timestamp` без пояса — только если «часы на стене» действительно то, что нужно.",
        "**Используйте `NOT EXISTS` вместо `NOT IN`** с подзапросами, которые могут вернуть `NULL`.",
        "**Приводите типы явно** (`CAST`) и ловите ошибки: молчаливая «мягкая» конвертация хуже ошибки.",
        "**Задавайте `CHECK`** для допустимых диапазонов: `CHECK (amount_cents > 0)`.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**`NULL` в `UNIQUE`.** Несколько строк с `NULL` в уникальном столбце допустимы: каждый `NULL` считается неизвестным значением, а не одинаковым. (PostgreSQL 15 добавил `UNIQUE NULLS NOT DISTINCT`.)",
        "**`count(*)` и `count(x)`** по пустой таблице: `0` в обоих случаях; `sum(x)` по пустой таблице — `NULL`, а не 0. Для отчётов оборачивайте: `COALESCE(sum(x), 0)`.",
        "**Целочисленное деление:** `7 / 2` — `3`, а `-7 / 2` — `-3` (усечение к нулю); `7 / 2.0` — `3.5` (в замере PostgreSQL вывел `3.5000000000000000`).",
        "**`boolean` и `NULL`:** `WHERE flag` отбрасывает строки с `NULL` так же, как `false`.",
        "**Пустая строка и `NULL` — разные значения** (кроме Oracle, где они совпадают).",
        "**Сортировка `NULL`:** PostgreSQL — последние при `ASC`; SQLite — первые. Явный `NULLS LAST` выравнивает поведение.",
        "**Языки и регистр:** `upper('привет')` в PostgreSQL даёт `ПРИВЕТ` (правила сортировки и регистра задаёт локаль базы), а сортировка строк зависит от collation.",
      ),
      h("Пока в браузере: чем SQLite отличается"),
      p("Выполните блок: каждый запрос здесь возвращает в SQLite не то, что в PostgreSQL. Замеры на sql.js: сумма `0.1 + 0.2` не равна `0.3`, `CAST(3.7 AS integer)` усекает до `3`, `CAST('abc' AS integer)` даёт `0`, переполнение превращает число в `real`, несуществующая дата превращается в `2024-03-01`, а `NULL` при сортировке идёт **первым**."),
      code("sql", `-- Те же идеи, но SQLite ведёт себя иначе. Выполните блок в браузере и сравните с PostgreSQL.
SELECT 0.1 + 0.2 = 0.3                  AS sum_equals;
SELECT CAST(3.7 AS integer)             AS cast_numeric, CAST('3.7' AS integer) AS cast_text, CAST('abc' AS integer) AS cast_garbage;
SELECT typeof(9223372036854775807 + 1)  AS overflow_type;
SELECT date('2024-02-30')               AS impossible_date;
SELECT name, city FROM customers ORDER BY city, name;`, { filename: "14-sqlite-differences.sql", runnable: true, fixture: "shop" }),
      code("sql", `SELECT name, city FROM customers ORDER BY city, name;
SELECT name, city FROM customers ORDER BY city DESC, name;`, { filename: "07b-order-default.pg.sql" }),
      code("text", ` name  |  city  
-------+--------
 Борис | Казань
 Дарья | Казань
 Анна  | Москва
 Вера  | Москва
 Жанна | Москва
 Глеб  | Самара
 Игорь | Самара
 Егор  | 
(8 rows)

 name  |  city  
-------+--------
 Егор  | 
 Глеб  | Самара
 Игорь | Самара
 Анна  | Москва
 Вера  | Москва
 Жанна | Москва
 Борис | Казань
 Дарья | Казань
(8 rows)`, { filename: "результат (PostgreSQL 16.14): NULL — последний при ASC, первый при DESC" }),
    ]),

    section("related", [
      ul(
        "[Реляционная модель и первые таблицы](/learn/sql/relational-model) — таблицы, строки, ограничения.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Магическое значение вместо NULL",
          code: `
            -- bonus = -1 означает «не определён»
            SELECT avg(bonus) FROM staff_pay;          -- среднее портят «-1»
            SELECT * FROM staff_pay WHERE bonus < 5000; -- «-1» попадает в выборку
          `,
          note: "Служебное значение смешивается с данными: средние, суммы и фильтры начинают ошибаться, причём тихо.",
        },
        {
          title: "NULL и явная обработка",
          code: `
            SELECT avg(bonus) FROM staff_pay;                    -- считает только известные
            SELECT * FROM staff_pay WHERE bonus < 5000 OR bonus IS NULL;
            SELECT avg(COALESCE(bonus, 0)) FROM staff_pay;       -- если «неизвестно» = 0
          `,
          note: "Неизвестное остаётся неизвестным; решение «считать нулём» принимается явно в конкретном запросе.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.data-types-null.ex1",
      title: "Предскажите результат с NULL",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("В `customers` 8 клиентов, у Егора `city` неизвестен, из Москвы — 3. Не запуская, скажите, что вернёт каждый запрос, и объясните последний (`a`, `b`, `c`)."),
        code("sql", `SELECT count(*) FROM customers WHERE city = 'Москва' OR city <> 'Москва';
SELECT count(*) FROM customers WHERE NOT (city = 'Москва');
SELECT count(*) FROM customers WHERE city IS NULL OR city = 'Москва';
SELECT 1 + NULL AS a, 'abc' || NULL AS b, COALESCE(NULL, NULL, 3) AS c;`, { filename: "17-ex-predict.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["Попадёт ли строка с `NULL` в `city = 'Москва' OR city <> 'Москва'`?", "Чему равно `NOT UNKNOWN`?", "Что возвращает любая арифметика и конкатенация с `NULL`?"],
      checks: ["Первый: 7", "Второй: 4", "Третий: 4 (3 из Москвы + 1 с NULL)", "Последний: a = NULL, b = NULL, c = 3"],
      solution: [
        code("text", ` count 
-------
     7
(1 row)

 count 
-------
     4
(1 row)

 count 
-------
     4
(1 row)

 a | b | c 
---+---+---
   |   | 3
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "`city = 'Москва' OR city <> 'Москва'` — для Егора и то и другое неизвестно, `неизвестно OR неизвестно` = неизвестно: строка отброшена, итог 3 + 4 = 7.",
          "`NOT (city = 'Москва')` — `NOT` от неизвестного — снова неизвестно; Егор исключён, остаётся 4.",
          "`city IS NULL OR city = 'Москва'` объединяет 1 + 3 = 4.",
          "`1 + NULL` и `'abc' || NULL` — `NULL`; `COALESCE` возвращает первое известное значение — 3.",
        ),
      ],
    }),
    exercise({
      id: "sql.data-types-null.ex2",
      title: "Запрос возвращает 0 строк",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Нужны клиенты, у которых нет записи в `refs` (список клиентов со специальным статусом). Первый запрос возвращает 0 строк, хотя такие клиенты есть. Объясните причину и исправьте двумя способами."),
        code("sql", `-- Клиенты, у которых нет заказов — но запрос возвращает 0 строк
CREATE TABLE refs (customer_id integer);
INSERT INTO refs VALUES (1), (2), (NULL);

SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM refs) ORDER BY name;

SELECT name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM refs r WHERE r.customer_id = c.id) ORDER BY name;`, { filename: "18-ex-fix.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["Что содержит `refs.customer_id`?", "Чему равно `3 NOT IN (1, 2, NULL)`?"],
      checks: ["Названа причина: `NULL` в подзапросе `NOT IN`", "Исправление 1: `NOT EXISTS`", "Исправление 2: исключить `NULL` в подзапросе или `LEFT JOIN … IS NULL`"],
      solution: [
        code("text", ` name 
------
(0 rows)

 name  
-------
 Вера
 Глеб
 Дарья
 Егор
 Жанна
 Игорь
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("В `refs` есть `NULL`, поэтому `id NOT IN (1, 2, NULL)` для любого `id`, кроме 1 и 2, равно «неизвестно» (3 ≠ NULL — неизвестно), и все строки отбрасываются. `NOT EXISTS` не сравнивает с `NULL` — он ищет совпадающие строки и вернул 6 клиентов. Второй вариант — `WHERE customer_id IS NOT NULL` внутри подзапроса."),
      ],
    }),
    exercise({
      id: "sql.data-types-null.ex3",
      title: "Таблица платежей без потерь",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Спроектируйте таблицу `payments`: сумма хранится точно (без `float`), валюта — трёхбуквенный код, время платежа обязательно, комментарий необязателен. Сумма должна быть положительной. Покажите по валюте общую сумму, число платежей и сколько из них с комментарием."),
      ],
      hints: ["Какой тип надёжнее для денег: `float` или целые минимальные единицы?", "Чем `count(*)` отличается от `count(note)`?"],
      checks: ["Сумма — целое число копеек (или `numeric`) с `CHECK (> 0)`", "Валюта — `NOT NULL` с проверкой длины", "Комментарий допускает `NULL`", "Итоговый запрос с `GROUP BY` и тремя числами"],
      solution: [
        code("sql", `CREATE TABLE payments (
  id           integer PRIMARY KEY,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency     text    NOT NULL CHECK (length(currency) = 3),
  paid_at      text    NOT NULL,
  note         text
);

INSERT INTO payments (id, amount_cents, currency, paid_at, note) VALUES
  (1, 129900, 'RUB', '2024-03-10 12:00:00', 'кофемашина'),
  (2,     50, 'RUB', '2024-03-10 12:05:00', NULL),
  (3,   9990, 'EUR', '2024-03-11 09:30:00', 'подписка');

SELECT currency, sum(amount_cents) AS total_cents, count(note) AS with_note, count(*) AS payments
FROM payments
GROUP BY currency
ORDER BY currency;`, { filename: "15-payments.sql", runnable: true }),
        code("text", ` currency | total_cents | with_note | payments 
----------+-------------+-----------+----------
 EUR      |        9990 |         1 |        1
 RUB      |      129950 |         1 |        2
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Сумма хранится в целых копейках — сложение точное. `CHECK (amount_cents > 0)` отвергает ноль и отрицательные платежи. `count(note)` считает только платежи с комментарием: у рублёвых — 1 из 2."),
      ],
    }),
  ],

  challenge: {
    id: "sql.data-types-null.challenge",
    title: "Расчёт оплаты без ловушек NULL",
    scenario: [
      p("Бухгалтерия присылает таблицу выплат: у части сотрудников бонус ещё не определён (`NULL`), у одного нулевые часы. Нужно посчитать итоговую сумму, стоимость часа и средние бонусы так, чтобы отчёт не падал и не искажался."),
    ],
    requirements: [
      "Для каждого сотрудника вывести итоговую сумму `salary + бонус`, считая неизвестный бонус нулём",
      "Показать признак «бонус неизвестен» отдельным столбцом",
      "Вывести стоимость часа `salary / hours` так, чтобы нулевые часы давали `NULL`, а не ошибку",
      "Отсортировать по убыванию бонуса, неизвестные — в конце, затем по имени",
      "Вторым запросом показать число людей, число известных бонусов, средний бонус по известным и средний по всем (неизвестный = 0)",
    ],
    constraints: [
      "Без `WHERE bonus = NULL`",
      "Порядок `NULL` задан явно, результат одинаков в PostgreSQL и SQLite",
    ],
    acceptance: [
      "Итоги: Анна 120000, Глеб 75000, Вера 80000, Борис 90000",
      "У Веры `per_hour` пустой (`NULL`), запрос не падает",
      "Средний бонус по известным — `8333.33…`, по всем — `6250`",
      "Порядок строк: Анна, Глеб, Вера, Борис",
    ],
    hints: [
      "`COALESCE(bonus, 0)` для суммы, `bonus IS NULL` для признака.",
      "`NULLIF(hours, 0)` в знаменателе.",
      "`ORDER BY bonus DESC NULLS LAST, name`.",
    ],
    solution: [
      code("sql", `CREATE TABLE staff_pay (
  name   text NOT NULL,
  salary integer NOT NULL,
  bonus  integer,
  hours  integer NOT NULL
);
INSERT INTO staff_pay (name, salary, bonus, hours) VALUES
  ('Анна',  100000, 20000, 160),
  ('Борис',  90000, NULL,  160),
  ('Вера',   80000, 0,      0),
  ('Глеб',   70000, 5000,  120);

SELECT name,
       salary + COALESCE(bonus, 0)               AS total,
       bonus IS NULL                             AS no_bonus_info,
       salary / NULLIF(hours, 0)                 AS per_hour
FROM staff_pay
ORDER BY bonus DESC NULLS LAST, name;

SELECT count(*)                  AS people,
       count(bonus)              AS with_bonus_info,
       avg(bonus)                AS avg_bonus_known,
       avg(COALESCE(bonus, 0))   AS avg_bonus_all
FROM staff_pay;`, { filename: "16-challenge.sql", runnable: true, lineNumbers: true }),
      code("text", ` name  | total  | no_bonus_info | per_hour 
-------+--------+---------------+----------
 Анна  | 120000 | f             |      625
 Глеб  |  75000 | f             |      583
 Вера  |  80000 | f             |         
 Борис |  90000 | t             |      562
(4 rows)

 people | with_bonus_info |    avg_bonus_known    |     avg_bonus_all     
--------+-----------------+-----------------------+-----------------------
      4 |               3 | 8333.3333333333333333 | 6250.0000000000000000
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Вера с бонусом `0` идёт перед Борисом с неизвестным бонусом: известный ноль выше, чем «неизвестно». Среднее по известным (три значения: 20000, 0, 5000) — 8333.33, по всем четырём — 6250: разница показывает, как решение «что такое NULL» меняет отчёт."),
    ],
  },

  interview: [
    iq("sql.data-types-null.i1", "basic", "Что такое NULL и чем он отличается от нуля и пустой строки?", [
      ul(
        "`NULL` — отсутствие или неизвестность значения, а не значение.",
        "Ноль — число, пустая строка — строка (в PostgreSQL это разные значения); обе — известные данные.",
        "Любое сравнение с `NULL` даёт `NULL`, поэтому проверять нужно `IS NULL`.",
      ),
    ]),
    iq("sql.data-types-null.i2", "basic", "Как правильно проверить, что значение отсутствует?", [
      ul(
        "`x IS NULL` и `x IS NOT NULL`.",
        "Для сравнения двух значений, где `NULL` считается обычным: `a IS DISTINCT FROM b` / `IS NOT DISTINCT FROM`.",
        "`x = NULL` всегда неизвестно и никогда не истинно.",
      ),
    ]),
    iq("sql.data-types-null.i3", "intermediate", "Почему сумма «из Москвы» и «не из Москвы» может не равняться числу строк?", [
      ul(
        "Строки с `NULL` в `city` дают для обоих условий «неизвестно» и отбрасываются `WHERE`.",
        "В замере: 3 + 4 = 7 при 8 клиентах.",
        "Решения: учесть `IS NULL` явно или использовать `IS DISTINCT FROM`.",
      ),
    ]),
    iq("sql.data-types-null.i4", "intermediate", "Почему `NOT IN` с подзапросом может вернуть пустой результат?", [
      ul(
        "Если подзапрос возвращает хотя бы один `NULL`, то `x NOT IN (…, NULL)` для любого `x`, не равного известным значениям, неизвестно, а не истинно.",
        "Поэтому строки отбрасываются; в замере запрос вернул 0 строк вместо 4.",
        "Безопасные способы: `NOT EXISTS`, `LEFT JOIN … WHERE … IS NULL` или исключение `NULL` в подзапросе (`WHERE col IS NOT NULL`).",
      ),
    ]),
    iq("sql.data-types-null.i5", "intermediate", "Как агрегатные функции обращаются с NULL? Чем `count(*)` отличается от `count(col)`?", [
      ul(
        "`count(*)` считает строки; `count(col)`, `sum`, `avg`, `min`, `max` игнорируют `NULL`.",
        "В замере: 4 строки, `count(score)` = 3, `avg(score)` = 4.0 (по трём), `avg(COALESCE(score,0))` = 3.0.",
        "Если все значения `NULL` — `sum`/`avg` вернут `NULL`, `count(col)` — 0; для отчётов часто пишут `COALESCE(sum(x), 0)`.",
      ),
    ]),
    iq("sql.data-types-null.i6", "advanced", "Почему деньги нельзя хранить в float? Чем заменить?", [
      ul(
        "Двоичные дроби не представляют `0.1` точно: `0.1 + 0.2` даёт `0.30000000000000004`, равенство с `0.3` ложно (замер PostgreSQL).",
        "Погрешности копятся при суммировании и ломают сверки.",
        "Замена: `numeric(p, s)` (точно, чуть медленнее) или целые минимальные единицы (`amount_cents`) плюс столбец валюты.",
      ),
    ]),
    iq("sql.data-types-null.i7", "engineering", "Чем `timestamp` отличается от `timestamptz` в PostgreSQL и какой выбрать для времени события?", [
      ul(
        "`timestamptz` хранит момент (UTC) и показывает его в часовом поясе сессии: `12:00+00` и `17:00+05` — один и тот же момент (замер).",
        "`timestamp` хранит «часы на стене» без пояса: смена пояса сервера не меняет значения и не позволяет восстановить момент.",
        "Для времён событий (создание заказа, платёж) выбирают `timestamptz`; `timestamp` — для локальных расписаний («открывается в 09:00»).",
      ),
    ]),
    iq("sql.data-types-null.i8", "debugging", "Запрос работает в SQLite и ломается в PostgreSQL на приведении типов. Первые гипотезы?", [
      ul(
        "SQLite приводит типы «мягко»: `CAST('abc' AS integer)` — 0, `CAST('3.7' AS integer)` — 3, `'abcd'` помещается в `varchar(3)`.",
        "PostgreSQL выбрасывает `invalid input syntax for type integer` — проверьте, какие данные приводятся.",
        "Исправление: чистить данные до приведения, использовать `CAST` явно, ловить нечисловые значения проверкой (`~ '^\\d+$'`) или дать столбцу правильный тип.",
        "Проверка: выполнить запрос на целевой СУБД с реальными данными.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.data-types-null.e1", "foundation", "Что вернёт `SELECT NULL = NULL`?", ["`true`", "`false`", "`NULL`", "Ошибку"], 2, "Сравнение с `NULL` даёт `NULL` (неизвестно); проверять отсутствие значения нужно `IS NULL`."),
    mcq("sql.data-types-null.e2", "foundation", "Какое выражение проверяет, что `city` не задан?", ["`city IS NULL`", "`city = NULL`", "`city == NULL`", "`city = ''`"], 0, "Только `IS NULL` корректно проверяет отсутствие значения; `= NULL` всегда неизвестно."),
    mcq("sql.data-types-null.e3", "foundation", "Какой тип подходит для хранения точной денежной суммы?", ["`real`", "`double precision`", "`text`", "`numeric(10, 2)`"], 3, "`numeric` точен; `real` и `double precision` — двоичные дроби с погрешностью."),
    mcq("sql.data-types-null.e4", "intermediate", "В таблице `scores` строки 5, 3, `NULL`, 4. Чему равен `avg(score)`?", ["3.0", "4.0", "3.75", "`NULL`"], 1, "`avg` игнорирует `NULL`: (5 + 3 + 4) / 3 = 4.0 (замер PostgreSQL)."),
    mcq("sql.data-types-null.e5", "intermediate", "Какие выражения возвращают `NULL`? Выберите все.", ["`1 + NULL`", "`'abc' || NULL`", "`COALESCE(NULL, 3)`", "`NULLIF(5, 5)`"], [0, 1, 3], "Арифметика и конкатенация с `NULL` дают `NULL`; `NULLIF(5, 5)` возвращает `NULL` при равенстве; `COALESCE(NULL, 3)` вернёт 3."),
    mcq("sql.data-types-null.e6", "intermediate", "Что вернёт `SELECT 10 / NULLIF(0, 0)`?", ["Ошибку деления на ноль", "`0`", "`10`", "`NULL`"], 3, "`NULLIF(0, 0)` превращает ноль в `NULL`, а деление на `NULL` даёт `NULL`, а не ошибку."),
    mcq("sql.data-types-null.e7", "advanced", "Почему `WHERE city NOT IN (SELECT city FROM t)` вернёт пустой результат, если в подзапросе есть `NULL`?", ["Так работает любой `NOT IN`", "`NULL` считается равным пустой строке", "Сравнение с `NULL` неизвестно, поэтому условие не бывает истинным", "`NOT IN` не работает с подзапросами"], 2, "`x NOT IN (…, NULL)` для значений, не совпавших с известными, неизвестно; `WHERE` отбрасывает такие строки (замер: 0 строк)."),
    open("sql.data-types-null.e8", "intermediate", "Объясните, как выбрать между `NULL` и значением по умолчанию (например, `0` или `'нет'`) для необязательного столбца, и какие проблемы приносят «магические значения».", [
      ul(
        "`NULL` честно обозначает «неизвестно/не применимо» и исключается из `avg`, `sum`, `count(col)` — отчёты не искажаются.",
        "Значение по умолчанию уместно, когда оно **действительно** является данными (например, количество по умолчанию 0, статус `'new'`), а не заменой неизвестности.",
        "«Магическое значение» (`-1`, `'1970-01-01'`, `'нет'`) смешивается с настоящими данными: оно попадает в средние, фильтры и сортировку и ломает их без ошибки.",
        "Если `NULL` допустим — документируйте смысл; если нет — `NOT NULL` с `DEFAULT`/`CHECK`.",
      ),
    ], ["Названо свойство NULL в агрегатах", "Критерий выбора default", "Названа проблема магических значений"], { format: "concept" }),
  ],

  mastery: [
    mcq("sql.data-types-null.m1", "intermediate", "Сколько строк вернёт `SELECT * FROM customers WHERE city IS DISTINCT FROM 'Москва'` в наборе «shop» (8 клиентов, 3 из Москвы, 1 с `NULL`)?", ["4", "5", "3", "8"], 1, "`IS DISTINCT FROM` считает `NULL` отличным от `'Москва'`: 4 клиента из других городов и Егор — 5 (замер)."),
    mcq("sql.data-types-null.m2", "advanced", "`ORDER BY city` в PostgreSQL по умолчанию ставит `NULL`…", ["Последними", "Первыми", "В случайном месте", "Не допускает `NULL`"], 0, "В PostgreSQL `NULL` считается больше любого значения: при `ASC` идёт последним, при `DESC` — первым; в SQLite наоборот."),
    mcq("sql.data-types-null.m3", "advanced", "Что вернёт `SELECT 7 / 2, -7 / 2, 7 / 2.0` в PostgreSQL?", ["`4`, `-4`, `3.5`", "`3.5`, `-3.5`, `3.5`", "`3`, `-3`, `3.5000000000000000`", "`3`, `-4`, `3.5`"], 2, "Целочисленное деление усекает к нулю: 3 и −3; с десятичным делителем результат — `numeric` `3.5000000000000000` (замер)."),
    open("sql.data-types-null.m4", "advanced", "Отчёт «средний чек» по заказам показывает 4.0, а бизнес ожидает 3.0, где пропущенные оценки считаются нулями. Как вы разберётесь, какая цифра верна, и что предложите?", [
      ul(
        "Выяснить смысл `NULL`: «оценка не выставлена» (тогда она не участвует в среднем) или «оценка 0».",
        "Показать оба расчёта рядом (`avg(x)` и `avg(COALESCE(x, 0))`) и число строк (`count(*)`, `count(x)`), чтобы стало видно, сколько значений пропущено.",
        "Зафиксировать определение метрики письменно и в коде (комментарий, представление `VIEW`), чтобы отчёты не расходились.",
        "Если `NULL` разных смыслов — завести отдельный столбец-признак или отдельное значение статуса вместо перегруженного `NULL`.",
      ),
    ], ["Выяснен смысл NULL", "Показаны оба расчёта и счётчики", "Зафиксировано определение метрики", "Предложено разделить смыслы NULL при необходимости"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.data-types-null.f1", front: "NULL = NULL?", back: "NULL (неизвестно), не true. Проверка отсутствия — только IS NULL / IS NOT NULL." },
    { id: "sql.data-types-null.f2", front: "WHERE и неизвестность?", back: "WHERE оставляет только строки, где условие истинно. Ложь и NULL (unknown) отбрасываются." },
    { id: "sql.data-types-null.f3", front: "IS DISTINCT FROM?", back: "Сравнение, где NULL считается обычным значением: NULL IS DISTINCT FROM 'x' → true." },
    { id: "sql.data-types-null.f4", front: "NOT IN и NULL?", back: "Если в подзапросе есть NULL, NOT IN не вернёт строк. Используйте NOT EXISTS." },
    { id: "sql.data-types-null.f5", front: "Агрегаты и NULL?", back: "count(*) считает строки; count(x), sum, avg, min, max пропускают NULL. avg(x) ≠ avg(COALESCE(x,0))." },
    { id: "sql.data-types-null.f6", front: "COALESCE / NULLIF?", back: "COALESCE(a,b,…) — первое не NULL. NULLIF(a,b) — NULL, если a = b (защита от деления на ноль)." },
    { id: "sql.data-types-null.f7", front: "Деньги?", back: "numeric(p,s) или целые минимальные единицы (копейки) + валюта. Не float: 0.1 + 0.2 ≠ 0.3." },
    { id: "sql.data-types-null.f8", front: "timestamp или timestamptz?", back: "Для момента события — timestamptz (UTC внутри, пояс сессии при выводе). timestamp — «часы на стене» без пояса." },
    { id: "sql.data-types-null.f9", front: "Сортировка NULL?", back: "PostgreSQL: ASC — последним, DESC — первым. SQLite — наоборот. Задавайте NULLS FIRST/LAST явно." },
  ],

  sources: [
    { title: "PostgreSQL 16: Data Types", url: "https://www.postgresql.org/docs/16/datatype.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Numeric Types", url: "https://www.postgresql.org/docs/16/datatype-numeric.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Date/Time Types", url: "https://www.postgresql.org/docs/16/datatype-datetime.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Comparison Functions and Operators (IS DISTINCT FROM)", url: "https://www.postgresql.org/docs/16/functions-comparison.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Conditional Expressions (COALESCE, NULLIF)", url: "https://www.postgresql.org/docs/16/functions-conditional.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Sorting Rows (NULLS FIRST/LAST)", url: "https://www.postgresql.org/docs/16/queries-order.html", publisher: "PostgreSQL" },
    { title: "SQLite: Datatypes In SQLite", url: "https://www.sqlite.org/datatype3.html", publisher: "Other" },
    { title: "SQLite: NULL Handling in SQLite", url: "https://www.sqlite.org/nulls.html", publisher: "Other" },
  ],
};
