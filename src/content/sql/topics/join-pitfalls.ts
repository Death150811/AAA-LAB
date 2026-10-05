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

export const joinPitfalls: Topic = {
  id: "sql.join-pitfalls",
  slug: "join-pitfalls",
  domain: "sql",
  module: "joins",
  title: "Ловушки соединений",
  titleEn: "Join Pitfalls",
  summary:
    "Неверные соединения не падают с ошибкой — они возвращают правдоподобные, но неверные числа. Тема на замерах PostgreSQL 16.14 и SQLite 3.49 разбирает главные ловушки: размножение строк при двух связях «один ко многим» (сумма платежей Веры выросла с 3480 до 10440, потому что у заказа 3 позиции), «ловушку веера» (3 позиции × 2 платежа = 6 строк), `NULL` в ключах (`a.k = b.k` не соединил две `NULL`-строки, `IS NOT DISTINCT FROM` — соединил), дубли в справочнике (итог 2500 вместо 1500), «лечение» через `sum(DISTINCT …)` (825 вместо 1650) и показывает надёжный приём — агрегировать каждую «многую» сторону отдельно и сверять итоги (7880 против 20610 после размножения).",
  minutes: 80,
  prerequisites: ["sql.inner-left-joins", "sql.group-by-having"],
  tags: ["fan-out", "fan trap", "double counting", "join cardinality", "NULL keys", "IS NOT DISTINCT FROM", "sum DISTINCT", "aggregate before join", "reconciliation", "duplicate dimension", "chasm trap"],
  keyConcepts: [
    { term: "Размножение строк — главный источник неверных сумм", text: "Соединив заказ одновременно с позициями и платежами, получаем строк «позиции × платежи»: у заказа 4 из 3 позиций и 2 платежей вышло 6 строк, и `sum(amount)` утроился (10440 вместо 3480)." },
    { term: "DISTINCT не лечит суммы", text: "`sum(DISTINCT amount)` отбрасывает равные суммы: два платежа по 825 дали 825 вместо 1650. `DISTINCT` скрывает дубли строк, но уничтожает настоящие повторы." },
    { term: "Агрегируйте «многие» стороны отдельно", text: "Сначала подзапросы `GROUP BY order_id` для платежей и позиций, затем соединение по ключу «одного»: платежи Анны — 4400, Веры — 3480, как и должно быть." },
    { term: "NULL не равен NULL и в соединении", text: "`a.k = b.k` не соединил строки с `NULL` (1 пара вместо 2); `IS NOT DISTINCT FROM` считает `NULL` равными и вернул обе пары." },
    { term: "Контрольная сверка ловит ошибку", text: "Итог платежей — 7880; после соединения с позициями тот же `sum` равен 20610. Расхождение с суммой без соединений — признак размножения." },
  ],
  sections: [
    section("definition", [
      def("Размножение строк (fan-out)", "Ситуация, когда соединение «один ко многим» повторяет строку «одного» по числу связанных «многих»; агрегаты по «одному» после этого завышаются.", "fan-out"),
      def("Ловушка веера (fan trap)", "Две независимые связи «один ко многим» от одной таблицы (заказ → позиции, заказ → платежи), соединённые в одном запросе: строки перемножаются.", "fan trap / chasm trap"),
      def("Кардинальность соединения", "Число строк результата относительно исходных: 1:1 не меняет число строк, 1:N — размножает, N:M — перемножает. Её нужно знать до написания агрегата.", "join cardinality"),
      def("Агрегат до соединения", "Приём: «многую» сторону сначала сворачивают `GROUP BY` ключа связи и только потом соединяют с «одним».", "pre-aggregation"),
      def("IS NOT DISTINCT FROM", "Сравнение, считающее два `NULL` равными: `a IS NOT DISTINCT FROM b` истинно, если `a = b` или оба `NULL`.", "IS NOT DISTINCT FROM"),
      def("Контрольная сверка", "Проверка, что итог отчёта совпадает с итогом, вычисленным независимо (без соединений или другим способом).", "reconciliation check"),
      def("Справочник с дублями", "Таблица-измерение, где ключ повторяется (две записи курса для одной валюты): соединение с ней размножает факты.", "duplicated dimension"),
    ]),

    section("why", [
      h("Такие ошибки не видны, пока на них не посмотрит бухгалтер"),
      p("Запрос не падает, форма результата правильная, числа «похожи на настоящие». Только они в два-три раза больше. Размножение строк — самая дорогая ошибка в отчётности: выручка, суммы к оплате, числа клиентов. Хуже всего, что при малых тестовых данных (одна позиция в заказе) ошибки нет — она появляется, когда у заказа становится две позиции."),
      ul(
        "**Размножение** — соединение «один ко многим» перед агрегатом по «одному».",
        "**Ловушка веера** — два «многих» в одном запросе.",
        "**Потери** — `INNER JOIN` и `NULL` в ключах отбрасывают строки (см. предыдущую тему).",
        "**Дубли справочников** — тихо удваивают суммы.",
        "**Ложные лекарства** — `DISTINCT` и `sum(DISTINCT …)` прячут симптом и искажают данные.",
      ),
    ]),

    section("mental-model", [
      h("Перед каждым соединением спросите: «сколько строк на ключ?»"),
      p("Для каждого `JOIN` задайте вопрос: сколько строк правой таблицы приходится на одну строку левой? Если «не больше одной» — число строк не вырастет. Если «много» — левая строка повторится, и всё, что вы считаете **по левой** (`sum`, `count`), нужно защищать. Если соединяются **две** стороны с «многими» — вы получаете произведение."),
      diagram(
        `
        orders (заказ 4)
           │
           ├── order_items  : 3 строки ──┐
           │                             ├── JOIN обоих →  3 × 2 = 6 строк
           └── payments     : 2 строки ──┘

        sum(payments.amount) по этим 6 строкам = 3 × (2000 + 1480) = 10440   ← завышено в 3 раза
        правильно:  sum по payments = 2000 + 1480 = 3480
        `,
        "Платёж повторяется для каждой позиции заказа: сумма умножается на число позиций.",
      ),
      h("Свёртка «многих» перед соединением"),
      p("Правило: **агрегируйте каждую «многую» сторону отдельно, сгруппировав по ключу связи, а затем соединяйте полученные строки** — по одной на заказ. После свёртки правая сторона — «один к одному», размножение исчезает."),
      steps(
        [
          ["Определите «одного»", "Сущность, по которой строится отчёт (клиент, заказ)."],
          ["Для каждой «многой» стороны напишите подзапрос", "`SELECT order_id, sum(amount) FROM payments GROUP BY order_id` — по строке на ключ."],
          ["Соедините подзапросы с «одним»", "`LEFT JOIN`, чтобы не потерять строки без платежей или позиций."],
          ["Сверьте итоги", "Сумма отчёта должна совпасть с суммой из исходной таблицы."],
        ],
        "Как избежать размножения",
      ),
    ]),

    section("technical", [
      h("Каталог ловушек"),
      table(
        ["Ловушка", "Симптом", "Защита"],
        [
          ["Агрегат по «одному» после `JOIN` «многого»", "Суммы и счётчики завышены в N раз", "Агрегат до соединения; `count(DISTINCT id)` для счёта сущностей"],
          ["Ловушка веера (две связи «ко многим»)", "Строк M × N вместо M + N; суммы перемножены", "Две отдельные свёртки и соединение по ключу «одного»"],
          ["`NULL` в ключе соединения", "Строки пропадают (`INNER`) или не получают пары", "`IS NOT DISTINCT FROM`, заполнение ключей, `NOT NULL`"],
          ["Дубли в справочнике", "Все факты с этим ключом удвоены", "`UNIQUE` на ключ справочника; проверка `GROUP BY … HAVING count(*) > 1`"],
          ["`DISTINCT` / `sum(DISTINCT)`", "Потеря настоящих повторов (825 вместо 1650)", "Не лечить симптом — устранить размножение"],
          ["Условие правой таблицы в `WHERE` при `LEFT JOIN`", "Пропали строки без пары", "Условие — в `ON`"],
          ["Соединение по неуникальному неключевому признаку", "Непредсказуемое размножение", "Соединять по ключам; в иных случаях проверять кардинальность"],
        ],
        "Основные ловушки соединений",
      ),
      h("Какие агрегаты чувствительны к размножению"),
      ul(
        "**`sum`, `count(*)`, `avg`** по столбцам «одного» после `JOIN` «многого» — искажаются (одно значение учтено N раз).",
        "**`min`, `max`** — не искажаются размножением (но искажаются потерей строк).",
        "**`count(DISTINCT key)`** — защищает счёт сущностей, но не суммы.",
        "**`avg`** — смещается к значениям тех строк, у которых больше «многих».",
      ),
      h("Сверка и тесты"),
      p("Для каждого отчёта придумайте независимый контроль: сумма по группам равна общему итогу; число клиентов в отчёте равно `count(*)` клиентов; сумма платежей по клиентам равна сумме платежей по таблице. Такие проверки превращают тихую ошибку в красный тест."),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `-- Надёжный приём: агрегировать каждую «многую» сторону отдельно, затем соединять по ключу «одного»
SELECT c.name,
       count(o.id)                    AS orders,
       COALESCE(sum(pay.paid), 0)     AS paid,
       COALESCE(sum(it.units), 0)     AS units
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
LEFT JOIN (SELECT order_id, sum(amount) AS paid FROM payments GROUP BY order_id) AS pay ON pay.order_id = o.id
LEFT JOIN (SELECT order_id, sum(qty)    AS units FROM order_items GROUP BY order_id) AS it ON it.order_id = o.id
GROUP BY c.id, c.name
ORDER BY c.id;`,
        [
          { line: 1, text: "Комментарий формулирует правило: «многие» стороны агрегируются отдельно." },
          { line: [2, 5], text: "Список выбора: клиент, число заказов и две суммы — платежи и штуки; `COALESCE` превращает отсутствующие суммы в 0." },
          { line: [6, 7], text: "Клиенты и их заказы — первое соединение «один ко многим»." },
          { line: 8, text: "Платежи свёрнуты до одной строки на заказ (`GROUP BY order_id`) и присоединены `LEFT JOIN`." },
          { line: 9, text: "Позиции тоже свёрнуты до одной строки на заказ: две «многие» стороны больше не перемножаются." },
          { line: [10, 11], text: "Итоговая группировка по клиенту: каждая сумма посчитана верно." },
        ],
        "03-aggregate-first.sql",
      ),
    ]),

    section("minimal-example", [
      p("Набор «shop» плюс таблица платежей: заказ 4 оплачен двумя платежами (2000 и 1480), у него три позиции. Сначала неверный запрос — платежи соединены ещё и с позициями:"),
      code("sql", `CREATE TABLE payments (
  id       integer PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders (id),
  amount   numeric(10, 2) NOT NULL CHECK (amount > 0)
);
-- заказ 4 оплачен двумя платежами (2000 + 1480 = 3480), заказ 2 — двумя по 825 (1650)
INSERT INTO payments (id, order_id, amount) VALUES
  (1, 1, 1380), (2, 2, 825), (3, 2, 825), (4, 4, 2000), (5, 4, 1480), (6, 7, 1370);`, { filename: "00-payments.sql (создаётся перед примерами)", collapsed: true }),
      code("sql", `-- Сколько клиент заплатил? Неверно: платежи размножаются позициями заказа
SELECT c.name, sum(p.amount) AS paid_wrong
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
JOIN payments AS p ON p.order_id = o.id
JOIN order_items AS oi ON oi.order_id = o.id
GROUP BY c.id, c.name
ORDER BY c.id;

-- Верно: платежи считаются отдельно, без соединения с позициями
SELECT c.name, sum(p.amount) AS paid
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
JOIN payments AS p ON p.order_id = o.id
GROUP BY c.id, c.name
ORDER BY c.id;`, { filename: "01-fanout-sum.sql" }),
      code("text", ` name | paid_wrong 
------+------------
 Анна |   10170.00
 Вера |   10440.00
(2 rows)

 name |  paid   
------+---------
 Анна | 4400.00
 Вера | 3480.00
(2 rows)`, { filename: "результат (PostgreSQL 16.14; набор «shop-payments» — «shop» плюс таблица платежей)" }),
      p("Вера заплатила 3480, но запрос показал 10440: платежи заказа 4 умножены на три позиции. У Анны — 10170 вместо 4400 (заказы с 2, 2 и 3 позициями). Второй запрос, без лишнего соединения, даёт верные суммы."),
    ]),

    section("detailed-example", [
      p("Ловушку веера удобно увидеть по числу строк: заказ 4 имеет три позиции и два платежа, а соединение с обоими даёт 6 строк."),
      code("sql", `-- Заказ 4: 3 позиции и 2 платежа. Соединив оба набора, получаем 3 × 2 = 6 строк
SELECT count(*) AS rows_after_join, count(DISTINCT oi.product_id) AS items, count(DISTINCT p.id) AS payments
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
JOIN payments    AS p  ON p.order_id = o.id
WHERE o.id = 4;`, { filename: "02-fan-trap.sql" }),
      code("text", ` rows_after_join | items | payments 
-----------------+-------+----------
               6 |     3 |        2
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Шесть строк при трёх различных позициях и двух различных платежах — перемножение. Любая сумма по одной из сторон теперь завышена."),
      h("Правильный отчёт: агрегаты до соединения"),
      code("sql", `-- Надёжный приём: агрегировать каждую «многую» сторону отдельно, затем соединять по ключу «одного»
SELECT c.name,
       count(o.id)                    AS orders,
       COALESCE(sum(pay.paid), 0)     AS paid,
       COALESCE(sum(it.units), 0)     AS units
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
LEFT JOIN (SELECT order_id, sum(amount) AS paid FROM payments GROUP BY order_id) AS pay ON pay.order_id = o.id
LEFT JOIN (SELECT order_id, sum(qty)    AS units FROM order_items GROUP BY order_id) AS it ON it.order_id = o.id
GROUP BY c.id, c.name
ORDER BY c.id;`, { filename: "03-aggregate-first.sql" }),
      code("text", ` name  | orders |  paid   | units 
-------+--------+---------+-------
 Анна  |      4 | 4400.00 |    19
 Борис |      2 |       0 |     4
 Вера  |      3 | 3480.00 |    15
 Глеб  |      1 |       0 |     3
 Дарья |      2 |       0 |     4
 Жанна |      1 |       0 |     2
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Теперь у каждого заказа одна строка платежей и одна строка позиций, поэтому суммы верны: Анна — 4400 и 19 штук, Вера — 3480 и 15 штук (в отчёте участвуют и отменённые заказы; их исключение — в challenge). Борис и остальные не платили — нули благодаря `LEFT JOIN` и `COALESCE`."),
    ]),

    section("analysis", [
      table(
        ["Проверка", "Значение", "Вывод"],
        [
          ["`sum(amount)` по `payments`", "7880", "Эталон"],
          ["`sum` по клиентам, платежи свёрнуты до соединения", "7880", "Сошлось"],
          ["`sum(p.amount)` после соединения с позициями", "20610", "Размножение (почти ×2,6)"],
          ["Строк для заказа 4: позиции × платежи", "6", "3 × 2"],
          ["Платежи Веры: неверно / верно", "10440 / 3480", "Множитель — число позиций"],
        ],
        "Сверка итогов (замеры PostgreSQL 16.14)",
      ),
      code("sql", `-- Контрольная сверка: итог по группам должен совпасть с итогом без соединений
SELECT (SELECT sum(amount) FROM payments)                                    AS total_payments,
       (SELECT sum(x.paid) FROM (SELECT o.customer_id, sum(p.amount) AS paid
                                 FROM orders o JOIN payments p ON p.order_id = o.id GROUP BY o.customer_id) x) AS total_by_customer,
       (SELECT sum(p.amount) FROM payments p JOIN order_items oi ON oi.order_id = p.order_id) AS total_after_fanout;`, { filename: "07-reconcile.sql" }),
      code("text", ` total_payments | total_by_customer | total_after_fanout 
----------------+-------------------+--------------------
        7880.00 |           7880.00 |           20610.00
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "**Контрольная сверка** — недорогая страховка: один запрос показывает, совпадают ли итоги до и после соединений.",
        "Если итог после соединений больше эталона — где-то размножение; если меньше — потеря строк (`INNER JOIN`, `WHERE`, `NULL`).",
      ),
    ]),

    section("internals", [
      h("Почему DISTINCT и sum(DISTINCT) не помогают"),
      code("sql", `-- Заказ 2 оплачен двумя платежами по 825. «Лечение» DISTINCT-ом теряет второй платёж
SELECT sum(p.amount)          AS honest_sum,
       sum(DISTINCT p.amount) AS sum_distinct_wrong
FROM payments AS p
WHERE p.order_id = 2;`, { filename: "06-sum-distinct.sql" }),
      code("text", ` honest_sum | sum_distinct_wrong 
------------+--------------------
    1650.00 |             825.00
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`sum(DISTINCT amount)` складывает **различные значения**, а не различные платежи: два платежа по 825 превратились в один. Такая «защита» от размножения ломается, как только равные суммы появляются у разных строк. Чинить нужно причину (соединение), а не симптом."),
      h("Дубли в справочнике"),
      code("sql", `-- Справочник «курс валюты» случайно получил две записи для EUR: суммы удвоятся
CREATE TABLE rates (currency text, rate numeric(8, 2));
INSERT INTO rates VALUES ('RUB', 1), ('EUR', 100), ('EUR', 100);
CREATE TABLE sales (id integer PRIMARY KEY, currency text, amount integer);
INSERT INTO sales VALUES (1, 'RUB', 500), (2, 'EUR', 10);

SELECT sum(s.amount * r.rate) AS total_rub_wrong FROM sales AS s JOIN rates AS r ON r.currency = s.currency;
SELECT sum(s.amount * r.rate) AS total_rub_expected FROM sales AS s JOIN (SELECT DISTINCT currency, rate FROM rates) AS r ON r.currency = s.currency;
-- Поиск дублей справочника до соединения:
SELECT currency, count(*) AS n FROM rates GROUP BY currency HAVING count(*) > 1;`, { filename: "05-dup-dimension.sql" }),
      code("text", ` total_rub_wrong 
-----------------
         2500.00
(1 row)

 total_rub_expected 
--------------------
            1500.00
(1 row)

 currency | n 
----------+---
 EUR      | 2
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Из-за двух записей курса EUR продажа в евро учтена дважды: 2500 вместо 1500. Последний запрос показывает приём диагностики — искать повторы ключа справочника. Предотвращает проблему `UNIQUE (currency)` на ключе справочника."),
      h("NULL в ключах соединения"),
      code("sql", `CREATE TABLE a (k integer, label text);
CREATE TABLE b (k integer, label text);
INSERT INTO a VALUES (1, 'a1'), (NULL, 'a-null');
INSERT INTO b VALUES (1, 'b1'), (NULL, 'b-null');

SELECT a.label AS left_label, b.label AS right_label FROM a JOIN b ON a.k = b.k ORDER BY a.label;
SELECT a.label AS left_label, b.label AS right_label FROM a JOIN b ON a.k IS NOT DISTINCT FROM b.k ORDER BY a.label;`, { filename: "04-null-keys.sql", runnable: true }),
      code("text", ` left_label | right_label 
------------+-------------
 a1         | b1
(1 row)

 left_label | right_label 
------------+-------------
 a-null     | b-null
 a1         | b1
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`a.k = b.k` соединило только `1 = 1`: для `NULL = NULL` результат неизвестен. `IS NOT DISTINCT FROM` считает два `NULL` равными и даёт вторую пару. Выбор зависит от смысла: чаще правильна именно «несоединяемость» `NULL`; специальное сравнение нужно осознанно (миграции, сверки)."),
    ]),

    section("mistakes", [
      h("Ошибка: платежи и позиции в одном запросе"),
      code("sql", `-- Отчёт «выручка и число позиций по заказам»: выручка завышена в заказах с несколькими позициями
SELECT o.id, sum(p.amount) AS paid, count(oi.product_id) AS items
FROM orders AS o
JOIN payments AS p ON p.order_id = o.id
JOIN order_items AS oi ON oi.order_id = o.id
GROUP BY o.id
ORDER BY o.id;`, { filename: "09-ex-fix.sql", runnable: true, fixture: "shop-payments" }),
      code("text", ` id |   paid   | items 
----+----------+-------
  1 |  2760.00 |     2
  2 |  3300.00 |     4
  4 | 10440.00 |     6
  7 |  4110.00 |     3
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Выручка заказа 1 вышла 2760 вместо 1380 (две позиции), заказа 4 — 10440 вместо 3480 (три позиции, два платежа: `count(oi.product_id)` тоже завышен — 6 вместо 3 позиций). Исправление — свёртки до соединения:"),
      code("sql", `SELECT o.id, pay.paid, it.items
FROM orders AS o
JOIN (SELECT order_id, sum(amount) AS paid FROM payments GROUP BY order_id) AS pay ON pay.order_id = o.id
JOIN (SELECT order_id, count(*) AS items FROM order_items GROUP BY order_id) AS it ON it.order_id = o.id
ORDER BY o.id;`, { filename: "10-fix-solution.sql", runnable: true, fixture: "shop-payments" }),
      code("text", ` id |  paid   | items 
----+---------+-------
  1 | 1380.00 |     2
  2 | 1650.00 |     2
  4 | 3480.00 |     3
  7 | 1370.00 |     3
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      h("Ошибка: «лечить» DISTINCT"),
      wrongRight(
        "sql",
        { title: "DISTINCT внутри агрегата", code: `SELECT sum(DISTINCT p.amount) FROM orders o JOIN payments p ON p.order_id = o.id JOIN order_items oi ON oi.order_id = o.id;`, note: "Разные платежи с равной суммой «склеиваются»: результат неверен, и ошибка заметна лишь на специфичных данных." },
        { title: "Агрегат до соединения", code: `SELECT sum(paid) FROM (SELECT order_id, sum(amount) AS paid FROM payments GROUP BY order_id) AS x;`, note: "Каждый платёж посчитан ровно один раз; никаких зависимостей от значений." },
      ),
      h("Ошибка: не проверять справочник на дубли"),
      p("Ключи справочников (курсы, тарифы, категории) должны быть уникальны. Добавьте `UNIQUE` и проверяйте данные до соединения. Иначе однажды случайный дубль удвоит отчёт."),
      h("Ошибка: считать, что тестовых данных достаточно"),
      p("Ошибка размножения не видна, если в тестовых данных в каждом заказе по одной позиции. Тестовые наборы должны включать **заказы с несколькими позициями, несколько платежей, клиентов без заказов, `NULL` в ключах и дубли** — иначе тесты зелёные, а отчёт неверный."),
    ]),

    section("antipatterns", [
      ul(
        "**Один «большой» запрос на все метрики** с цепочкой соединений вместо нескольких свёрток.",
        "**`SELECT DISTINCT` как лекарство** от размножения.",
        "**`sum(DISTINCT x)`** для денег и количеств.",
        "**Агрегаты по «одному» после `JOIN` «многого»** без контрольной сверки.",
        "**Справочники без `UNIQUE`.**",
        "**Отчёты без независимых контрольных сумм.**",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Определите «одного» и каждую «многую» сторону**, прежде чем писать агрегат.",
        "**Сворачивайте «многие» стороны подзапросами `GROUP BY` ключа связи**, затем соединяйте.",
        "**Для счёта сущностей — `count(DISTINCT id)`**, для сумм — агрегат до соединения.",
        "**Контрольная сверка:** итог отчёта = итог из исходной таблицы; число строк = ожидаемое.",
        "**`UNIQUE` на ключах справочников**, `NOT NULL` на ключах соединений.",
        "**Тестовые данные с «неудобными» случаями:** несколько позиций, несколько платежей, пустые связи, `NULL`.",
        "**Читаемость:** вынесите свёртки в CTE или представления с говорящими именами.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**`avg` после размножения** смещается к «многолюдным» группам: среднее чека по позициям — не среднее по заказам.",
        "**`min`/`max`** размножением не искажаются — но их можно получить из тех же строк, и они дают ложное чувство надёжности (а `sum` рядом врёт).",
        "**Связь N:M через таблицу связи:** два соединения «через мост» перемножают строки; свёртка до моста помогает.",
        "**Соединение по неуникальному столбцу без ключа** (по имени, дате): результат непредсказуем; проверяйте кардинальность `GROUP BY … HAVING count(*) > 1`.",
        "**`LEFT JOIN` + агрегат + `WHERE` по правой таблице:** одновременно потеря и размножение.",
        "**`NULL` в `sum` после `LEFT JOIN`:** клиент без платежей получает `NULL`, а не 0 — оборачивайте в `COALESCE`.",
      ),
    ]),

    section("related", [
      ul(
        "[INNER и LEFT JOIN](/learn/sql/inner-left-joins) — основы соединений и размножение строк.",
        "[RIGHT, FULL, CROSS и SELF JOIN](/learn/sql/other-joins) — остальные виды соединений.",
        "[Агрегаты, GROUP BY и HAVING](/learn/sql/group-by-having) — `count(DISTINCT)` и агрегаты после соединений.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Две связи «ко многим» в одном запросе",
          code: `
            SELECT o.id, sum(p.amount) AS paid, count(oi.product_id) AS items
            FROM orders o
            JOIN payments p ON p.order_id = o.id
            JOIN order_items oi ON oi.order_id = o.id
            GROUP BY o.id;
          `,
          note: "Платежи размножены позициями, позиции — платежами: для заказа 4 получилось 6 строк, `paid` = 10440, `items` = 6.",
        },
        {
          title: "Свёртки до соединения",
          code: `
            SELECT o.id, pay.paid, it.items
            FROM orders o
            JOIN (SELECT order_id, sum(amount) AS paid FROM payments GROUP BY order_id) pay ON pay.order_id = o.id
            JOIN (SELECT order_id, count(*) AS items FROM order_items GROUP BY order_id) it ON it.order_id = o.id;
          `,
          note: "По одной строке на заказ с каждой стороны: `paid` = 3480, `items` = 3.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.join-pitfalls.ex1",
      title: "Сколько строк и какая сумма",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("У заказа 7: три позиции и один платёж (1370). У заказа 4: три позиции и два платежа (2000 и 1480). Не запуская, определите результаты четырёх запросов."),
        code("sql", `SELECT count(*) FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.id = 7;
SELECT count(*) FROM orders o JOIN payments p ON p.order_id = o.id WHERE o.id = 4;
SELECT count(*) FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN payments p ON p.order_id = o.id WHERE o.id = 4;
SELECT sum(p.amount) FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN payments p ON p.order_id = o.id WHERE o.id = 4;`, { filename: "08-ex-predict.sql", runnable: true, fixture: "shop-payments" }),
      ],
      hints: ["Сколько строк даёт соединение «заказ — позиции» для заказа 7?", "Сколько строк при соединении с позициями и платежами для заказа 4?", "Во сколько раз размножится платёж?"],
      checks: ["Первый: 3", "Второй: 2", "Третий: 6", "Четвёртый: 3 × 3480 = 10440"],
      solution: [
        code("text", ` count 
-------
     3
(1 row)

 count 
-------
     2
(1 row)

 count 
-------
     6
(1 row)

   sum    
----------
 10440.00
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "Заказ 7 с тремя позициями: 3 строки (только позиции).",
          "Заказ 4 с двумя платежами: 2 строки (только платежи).",
          "С обоими наборами: 3 × 2 = 6 строк.",
          "Сумма: каждый из двух платежей повторён 3 раза — 3 × (2000 + 1480) = 10440 вместо 3480.",
        ),
      ],
    }),
    exercise({
      id: "sql.join-pitfalls.ex2",
      title: "Выручка завышена",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Отчёт «выручка и число позиций по заказам» показывает слишком большие суммы. Найдите причину и перепишите запрос так, чтобы выручка заказа 4 была 3480, а позиций — 3."),
        code("sql", `-- Отчёт «выручка и число позиций по заказам»: выручка завышена в заказах с несколькими позициями
SELECT o.id, sum(p.amount) AS paid, count(oi.product_id) AS items
FROM orders AS o
JOIN payments AS p ON p.order_id = o.id
JOIN order_items AS oi ON oi.order_id = o.id
GROUP BY o.id
ORDER BY o.id;`, { filename: "09-ex-fix.sql", runnable: true, fixture: "shop-payments" }),
      ],
      hints: ["Сколько «многих» сторон соединено с заказом?", "Как получить по одной строке на заказ с каждой стороны?"],
      checks: ["Причина: перемножение позиций и платежей", "Исправление: подзапросы `GROUP BY order_id`", "Результат: 1380/2, 1650/2, 3480/3, 1370/3"],
      solution: [
        code("sql", `SELECT o.id, pay.paid, it.items
FROM orders AS o
JOIN (SELECT order_id, sum(amount) AS paid FROM payments GROUP BY order_id) AS pay ON pay.order_id = o.id
JOIN (SELECT order_id, count(*) AS items FROM order_items GROUP BY order_id) AS it ON it.order_id = o.id
ORDER BY o.id;`, { filename: "10-fix-solution.sql", runnable: true, fixture: "shop-payments" }),
        code("text", ` id |  paid   | items 
----+---------+-------
  1 | 1380.00 |     2
  2 | 1650.00 |     2
  4 | 3480.00 |     3
  7 | 1370.00 |     3
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Каждая сторона свёрнута до одной строки на заказ, поэтому соединение «один к одному» ничего не размножает. В исходном запросе заказ 4 давал 6 строк (3 × 2), а `sum(p.amount)` и `count(oi.product_id)` относились к размноженным строкам."),
      ],
    }),
    exercise({
      id: "sql.join-pitfalls.ex3",
      title: "Штуки и деньги по клиентам, без отменённых",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Для каждого клиента с неотменёнными заказами выведите число заказанных штук и уплаченную сумму. Оба показателя должны быть верны одновременно; клиенты без платежей получают 0. Порядок: по уплаченной сумме по убыванию, затем по имени."),
      ],
      hints: ["Как исключить отменённые заказы, не теряя клиентов?", "Сколько свёрток нужно?", "Как защититься от `NULL` в суммах?"],
      checks: ["Две свёртки по `order_id`", "`COALESCE` для сумм", "Анна — 19 штук, 4400; Вера — 14 штук, 3480 (отменённый заказ 5 исключён)"],
      solution: [
        code("sql", `-- Сколько заказано (штук) и сколько уплачено по каждому клиенту: оба показателя верны одновременно
SELECT c.name,
       COALESCE(sum(it.units), 0) AS units,
       COALESCE(sum(pay.paid), 0) AS paid
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id AND o.status <> 'cancelled'
LEFT JOIN (SELECT order_id, sum(qty)    AS units FROM order_items GROUP BY order_id) AS it  ON it.order_id  = o.id
LEFT JOIN (SELECT order_id, sum(amount) AS paid  FROM payments    GROUP BY order_id) AS pay ON pay.order_id = o.id
GROUP BY c.id, c.name
HAVING COALESCE(sum(it.units), 0) > 0
ORDER BY paid DESC, c.name;`, { filename: "11-challenge.sql", runnable: true, fixture: "shop-payments" }),
        code("text", ` name  | units |  paid   
-------+-------+---------
 Анна  |    19 | 4400.00
 Вера  |    14 | 3480.00
 Борис |     4 |       0
 Глеб  |     3 |       0
 Дарья |     3 |       0
 Жанна |     2 |       0
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Условие `status <> 'cancelled'` стоит в `ON` соединения заказов; позиции и платежи свёрнуты отдельно, поэтому штуки и деньги не искажают друг друга. У Веры 14 штук (заказы 4 и 11; отменённый заказ 5 исключён), платежи 3480. Клиенты с `HAVING … > 0` — только те, у кого есть неотменённые заказы."),
      ],
    }),
  ],

  challenge: {
    id: "sql.join-pitfalls.challenge",
    title: "Отчёт, которому можно верить",
    scenario: [
      p("Финансовый отчёт «по клиентам» показывает сумму платежей, которая не сходится с бухгалтерией: 20610 против 7880. Нужно найти причину, исправить запрос и добавить контрольную сверку, которая будет ловить подобные ошибки."),
    ],
    requirements: [
      "Воспроизвести завышение: сумма платежей после соединения с позициями",
      "Исправить: свёртки до соединения; сумма по клиентам должна равняться 7880",
      "Добавить запрос-сверку: итог из таблицы, итог по клиентам, итог после размножения — в одной строке",
    ],
    constraints: [
      "Не использовать `DISTINCT` для исправления",
      "Результат не должен зависеть от того, равны ли суммы платежей",
    ],
    acceptance: [
      "`total_payments` = 7880, `total_by_customer` = 7880, `total_after_fanout` = 20610",
      "В исправленном отчёте суммы Анны 4400 и Веры 3480",
    ],
    hints: [
      "Свёртка `SELECT order_id, sum(amount) FROM payments GROUP BY order_id`.",
      "Сверка — три скалярных подзапроса в одном `SELECT`.",
    ],
    solution: [
      code("sql", `-- Контрольная сверка: итог по группам должен совпасть с итогом без соединений
SELECT (SELECT sum(amount) FROM payments)                                    AS total_payments,
       (SELECT sum(x.paid) FROM (SELECT o.customer_id, sum(p.amount) AS paid
                                 FROM orders o JOIN payments p ON p.order_id = o.id GROUP BY o.customer_id) x) AS total_by_customer,
       (SELECT sum(p.amount) FROM payments p JOIN order_items oi ON oi.order_id = p.order_id) AS total_after_fanout;`, { filename: "07-reconcile.sql" }),
      code("text", ` total_payments | total_by_customer | total_after_fanout 
----------------+-------------------+--------------------
        7880.00 |           7880.00 |           20610.00
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Три числа в одной строке сразу показывают проблему: платежи по таблице и по клиентам совпали (7880), а после соединения с позициями вырастали до 20610. Такую сверку удобно оформить как автоматический тест отчёта: `assert total_by_customer = total_payments`."),
    ],
  },

  interview: [
    iq("sql.join-pitfalls.i1", "basic", "Что такое размножение строк при JOIN и чем оно опасно?", [
      ul(
        "При связи «один ко многим» строка «одного» повторяется для каждой связанной строки «многих».",
        "`sum`, `count(*)`, `avg` по «одному» после такого соединения завышаются (в замере платежи Веры: 10440 вместо 3480).",
        "Защита: агрегат до соединения, `count(DISTINCT id)`, контрольная сверка.",
      ),
    ]),
    iq("sql.join-pitfalls.i2", "basic", "Почему sum(DISTINCT amount) — плохая идея для денег?", [
      ul(
        "`DISTINCT` отбрасывает равные значения, а не дубли строк: два платежа по 825 дали сумму 825 вместо 1650 (замер).",
        "Ошибка проявляется только на определённых данных и потому долго остаётся незамеченной.",
        "Правильно: устранить размножение (агрегат до соединения), а не прятать его.",
      ),
    ]),
    iq("sql.join-pitfalls.i3", "intermediate", "Что такое ловушка веера (fan trap) и как её обойти?", [
      ul(
        "Две независимые связи «один ко многим» от одной таблицы соединены в одном запросе: строки перемножаются (3 позиции × 2 платежа = 6).",
        "Суммы по любой из сторон завышаются.",
        "Обход: агрегировать каждую сторону отдельно по ключу связи (подзапросы/CTE) и соединять свёртки.",
      ),
    ]),
    iq("sql.join-pitfalls.i4", "intermediate", "Как соединять по столбцам, которые могут быть NULL?", [
      ul(
        "`a.k = b.k` не соединяет `NULL` с `NULL` (неизвестно).",
        "Если нужно считать `NULL` равными — `a.k IS NOT DISTINCT FROM b.k` (в замере вернул вторую пару).",
        "Чаще лучше сделать ключ `NOT NULL` или заполнить значение: `NULL` в ключе соединения — обычно признак проблемы данных.",
      ),
    ]),
    iq("sql.join-pitfalls.i5", "intermediate", "Какие агрегаты чувствительны к размножению строк, а какие нет?", [
      ul(
        "Чувствительны: `sum`, `count(*)`, `avg` — одно значение учитывается несколько раз.",
        "Нечувствительны: `min`, `max` (но чувствительны к потере строк).",
        "`count(DISTINCT key)` защищает счёт сущностей, но не суммы значений.",
      ),
    ]),
    iq("sql.join-pitfalls.i6", "advanced", "Как организовать контроль качества отчётов с соединениями?", [
      ul(
        "Независимые контрольные итоги: сумма по группам = сумма в исходной таблице; число клиентов в отчёте = число клиентов.",
        "Автоматические тесты на данных с «неудобными» случаями (несколько позиций, несколько платежей, `NULL`, дубли справочника).",
        "Уникальные ограничения на ключи справочников; проверки `HAVING count(*) > 1`.",
        "Код-ревью соединений: «сколько строк на ключ?».",
      ),
    ]),
    iq("sql.join-pitfalls.i7", "engineering", "Как построить отчёт с несколькими «многими» сторонами (позиции, платежи, возвраты) без размножения?", [
      ul(
        "Определить «одного» (заказ/клиент) и свернуть каждую «многую» сторону отдельным подзапросом `GROUP BY` ключа связи.",
        "Соединить свёртки с «одним» через `LEFT JOIN` и обернуть суммы в `COALESCE`.",
        "Для больших данных — материализовать свёртки (временные таблицы, материализованные представления) и сверять итоги.",
        "Альтернативы: оконные функции `sum() OVER (PARTITION BY …)` или отдельные запросы, объединяемые приложением.",
      ),
    ]),
    iq("sql.join-pitfalls.i8", "debugging", "Сумма в отчёте больше, чем в таблице. Как быстро найти место размножения?", [
      ul(
        "Выбрать один «подозрительный» ключ (заказ) и посмотреть строки соединения и их число; сравнить с ожиданием.",
        "Сравнить `count(*)` и `count(DISTINCT id)` «одного» после каждого `JOIN`: рост — размножение.",
        "Добавлять соединения по одному и считать контрольный итог после каждого.",
        "Проверить справочники на дубли: `GROUP BY key HAVING count(*) > 1`.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.join-pitfalls.e1", "foundation", "Заказ имеет 3 позиции и 2 платежа. Сколько строк даст соединение заказа с обеими таблицами?", ["5", "3", "6", "2"], 2, "Соединение с двумя «многими» сторонами перемножает строки: 3 × 2 = 6 (замер)."),
    mcq("sql.join-pitfalls.e2", "foundation", "Что показывает расхождение итога после соединения с итогом по исходной таблице?", ["Ошибку в данных или размножение/потерю строк", "Что `GROUP BY` не работает", "Что нужен индекс", "Ничего"], 0, "Контрольная сверка выявляет размножение (итог больше) и потерю строк (итог меньше)."),
    mcq("sql.join-pitfalls.e3", "foundation", "Какой агрегат не искажается размножением строк?", ["`sum`", "`count(*)`", "`avg`", "`max`"], 3, "`max` и `min` не меняются от повторения значений; `sum`, `count(*)` и `avg` зависят от числа повторов."),
    mcq("sql.join-pitfalls.e4", "intermediate", "Два платежа по 825: чему равно `sum(DISTINCT amount)`?", ["1650", "825", "0", "`NULL`"], 1, "`DISTINCT` отбрасывает равные значения: остаётся 825 (замер)."),
    mcq("sql.join-pitfalls.e5", "intermediate", "Какие приёмы защищают от размножения? Выберите все.", ["Агрегат «многой» стороны до соединения", "`count(DISTINCT id)` для счёта сущностей", "`sum(DISTINCT x)` для сумм", "Контрольная сверка итогов"], [0, 1, 3], "Свёртка до соединения, `count(DISTINCT id)` и сверка итогов работают; `sum(DISTINCT x)` искажает суммы."),
    mcq("sql.join-pitfalls.e6", "intermediate", "Что вернёт `a JOIN b ON a.k = b.k`, если в `a` и `b` есть строки с `k = NULL`?", ["Пару строк с `NULL`", "Все строки с `NULL` попадут в одну группу", "Ошибку", "Ничего для строк с `NULL`: они не соединяются"], 3, "`NULL = NULL` неизвестно, строки не соединяются; для обратного — `IS NOT DISTINCT FROM`."),
    mcq("sql.join-pitfalls.e7", "advanced", "Почему тесты с одной позицией в каждом заказе не выявят размножение?", ["Из-за `NULL`", "Тесты не проверяют `JOIN`", "Размножение равно числу позиций: при одной позиции множитель 1 и числа совпадают", "Из-за индекса"], 2, "Множитель размножения — число связанных строк; при 1 соединение «один к одному» и ошибка скрыта."),
    open("sql.join-pitfalls.e8", "intermediate", "Опишите, как вы напишете отчёт «выручка и число позиций по заказам», чтобы не попасть в ловушку веера, и как проверите результат.", [
      ul(
        "Определить «одного» — заказ; «многие» стороны — платежи и позиции.",
        "Две свёртки по `order_id` (`sum(amount)`, `count(*)`) в подзапросах или CTE; соединить с `orders` по ключу.",
        "`LEFT JOIN` + `COALESCE`, если у заказа может не быть платежей или позиций.",
        "Сверка: сумма отчёта по заказам = `sum(amount)` по таблице платежей; число позиций = `count(*)` по `order_items`.",
        "Тестовые данные должны включать заказ с несколькими позициями и несколькими платежами.",
      ),
    ], ["Названы свёртки до соединения", "Названа сверка итогов", "Учтены заказы без платежей", "Упомянуты неудобные тестовые данные"], { format: "sql" }),
  ],

  mastery: [
    mcq("sql.join-pitfalls.m1", "intermediate", "Каким будет `sum(p.amount)` для заказа 4 (платежи 2000 и 1480, три позиции) после соединения с позициями и платежами?", ["3480", "10440", "6960", "20880"], 1, "Каждый платёж повторён 3 раза: 3 × 3480 = 10440 (замер)."),
    mcq("sql.join-pitfalls.m2", "advanced", "Справочник курсов содержит две строки для EUR. Что произойдёт при `JOIN` продаж с ним?", ["Продажи в EUR учтутся дважды", "Продажи в EUR пропадут", "Будет ошибка", "Ничего"], 0, "Дублированный ключ размножает факты: в замере итог вырос с 1500 до 2500."),
    mcq("sql.join-pitfalls.m3", "advanced", "Какой запрос корректно подсчитает число клиентов с заказами после соединения клиентов с заказами и позициями?", ["`count(*)`", "`sum(1)`", "`count(DISTINCT c.id)`", "`count(oi.product_id)`"], 2, "После размножения число строк больше числа клиентов; `count(DISTINCT c.id)` считает сущности."),
    open("sql.join-pitfalls.m4", "advanced", "К вам пришёл аналитик: «в дашборде выручка выросла в 2,6 раза после добавления фильтра по товарам». Опишите гипотезы и порядок проверки.", [
      ul(
        "Гипотеза 1: фильтр потребовал `JOIN` с позициями заказа, платёж размножился по числу позиций (выручка × число позиций).",
        "Гипотеза 2: справочник товаров или курсов получил дубли ключа.",
        "Проверка: сравнить `sum(amount)` из `payments` с суммой в дашборде и с суммой после каждого соединения; для одного заказа показать число строк.",
        "Исправление: агрегат выручки до соединения с товарами; фильтр товаров — через `EXISTS` по позициям заказа, если нужна «выручка заказов, где есть товар X».",
        "Профилактика: контрольная сверка в тестах отчёта и `UNIQUE` на справочниках.",
      ),
    ], ["Названо размножение по позициям", "Названы дубли справочников", "План проверки через сверку", "Исправление через EXISTS/агрегат до соединения"], { format: "debug" }),
  ],

  flashcards: [
    { id: "sql.join-pitfalls.f1", front: "Размножение строк?", back: "JOIN «один ко многим»: строка «одного» повторяется по числу «многих». sum/count/avg по «одному» завышаются." },
    { id: "sql.join-pitfalls.f2", front: "Ловушка веера?", back: "Две связи «ко многим» от одной таблицы в одном запросе: строки перемножаются (3 × 2 = 6)." },
    { id: "sql.join-pitfalls.f3", front: "Как защититься?", back: "Агрегат каждой «многой» стороны до соединения (GROUP BY ключа связи), затем JOIN; сверка итогов." },
    { id: "sql.join-pitfalls.f4", front: "sum(DISTINCT x)?", back: "Склеивает равные значения, не дубли строк: 825 + 825 → 825. Не использовать для денег." },
    { id: "sql.join-pitfalls.f5", front: "NULL в ключе JOIN?", back: "NULL = NULL неизвестно: строки не соединяются. IS NOT DISTINCT FROM считает NULL равными." },
    { id: "sql.join-pitfalls.f6", front: "Дубли справочника?", back: "Удваивают факты. UNIQUE на ключ + проверка GROUP BY key HAVING count(*) > 1." },
    { id: "sql.join-pitfalls.f7", front: "min/max и размножение?", back: "Не искажаются повторением значений; sum, count(*), avg — искажаются." },
    { id: "sql.join-pitfalls.f8", front: "Контрольная сверка?", back: "Итог отчёта = итог из исходной таблицы. Больше — размножение, меньше — потеря строк." },
  ],

  sources: [
    { title: "PostgreSQL 16: Joined Tables", url: "https://www.postgresql.org/docs/16/queries-table-expressions.html#QUERIES-JOIN", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Aggregate Functions", url: "https://www.postgresql.org/docs/16/functions-aggregate.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Comparison Functions (IS DISTINCT FROM)", url: "https://www.postgresql.org/docs/16/functions-comparison.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Constraints (UNIQUE)", url: "https://www.postgresql.org/docs/16/ddl-constraints.html", publisher: "PostgreSQL" },
    { title: "SQLite: Aggregate Functions", url: "https://www.sqlite.org/lang_aggfunc.html", publisher: "Other" },
    { title: "SQLite: JOIN clause", url: "https://www.sqlite.org/syntax/join-clause.html", publisher: "Other" },
  ],
};
