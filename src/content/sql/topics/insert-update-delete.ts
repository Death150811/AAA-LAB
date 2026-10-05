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

export const insertUpdateDelete: Topic = {
  id: "sql.insert-update-delete",
  slug: "insert-update-delete",
  domain: "sql",
  module: "modification",
  title: "INSERT, UPDATE, DELETE",
  titleEn: "INSERT, UPDATE, DELETE",
  summary:
    "Три команды изменяют данные: `INSERT` добавляет строки, `UPDATE` меняет существующие, `DELETE` удаляет. Тема на замерах PostgreSQL 16.14 показывает, что говорят теги команд (`INSERT 0 2`, `UPDATE 3`, `DELETE 6`), как вставлять значения по умолчанию и из `SELECT`, чем опасен `UPDATE` без `WHERE` (`UPDATE 10` вместо `UPDATE 4`) и как его откатить, зачем перед изменением выполнять `SELECT` с тем же условием, как обновлять и удалять по данным другой таблицы (`UPDATE … FROM`, `DELETE … USING`, коррелированный подзапрос), чем `TRUNCATE` отличается от `DELETE`, почему правая часть `SET a = b, b = a` видит старые значения и почему `UPDATE` в PostgreSQL создаёт новую версию строки (таблица 100 000 строк выросла с 3544 кБ до 7080 кБ).",
  minutes: 75,
  prerequisites: ["sql.keys-constraints", "sql.select-where"],
  tags: ["INSERT", "UPDATE", "DELETE", "TRUNCATE", "UPDATE FROM", "DELETE USING", "transaction", "rollback", "MVCC", "dead tuples", "VACUUM", "DEFAULT", "INSERT SELECT", "affected rows", "bloat"],
  keyConcepts: [
    { term: "Тег команды сообщает, сколько строк затронуто", text: "`INSERT 0 2` — вставлено 2 строки, `UPDATE 3` — изменено 3, `DELETE 6` — удалено 6 (число `0` в `INSERT` — устаревший идентификатор объекта). Ожидаемое число строк нужно проверять." },
    { term: "UPDATE и DELETE без WHERE затрагивают всё", text: "`UPDATE products SET price = 0` вернул `UPDATE 10` — все 10 строк. Транзакция с `ROLLBACK` вернула данные (после отката нулевых цен 0)." },
    { term: "Сначала SELECT, потом UPDATE", text: "Условие проверяют запросом `SELECT count(*) … WHERE …`: в замере он показал 3 строки, и `UPDATE` с тем же условием изменил ровно 3." },
    { term: "Правая часть SET читает старые значения", text: "`UPDATE pair SET a = b, b = a` поменял значения местами: `(1, 2)` → `(2, 1)` — оба выражения вычисляются по состоянию строки до изменения." },
    { term: "UPDATE — это новая версия строки", text: "В PostgreSQL изменение записывает новую версию строки; таблица 100 000 строк выросла с 3544 кБ до 7080 кБ, после `VACUUM` не уменьшилась, но второй `UPDATE` не увеличил её (7080 кБ): место переиспользовано." },
  ],
  sections: [
    section("definition", [
      def("INSERT", "Добавляет строки в таблицу: `VALUES (…)`, несколько строк, результат `SELECT`. Не указанные столбцы получают `DEFAULT` или `NULL`.", "INSERT"),
      def("UPDATE", "Изменяет значения столбцов в строках, подходящих под `WHERE`. Без `WHERE` — во всех строках.", "UPDATE"),
      def("DELETE", "Удаляет строки, подходящие под `WHERE`; без `WHERE` — все строки. Таблица остаётся.", "DELETE"),
      def("TRUNCATE", "Быстро очищает таблицу целиком; нет `WHERE`, не вызывает построчные триггеры `DELETE`, в PostgreSQL выполняется внутри транзакции.", "TRUNCATE"),
      def("Затронутые строки", "Число строк, изменённых командой: возвращается клиенту в теге команды (`UPDATE 3`) и доступно драйверам (`rowCount`).", "affected rows"),
      def("Идемпотентная операция", "Операция, повторное выполнение которой не меняет результат: `UPDATE … SET status = 'paid' WHERE id = 5` идемпотентен, `UPDATE … SET qty = qty - 1` — нет.", "idempotent operation"),
      def("Мёртвая версия строки", "Старая версия, оставшаяся после `UPDATE`/`DELETE` в PostgreSQL до очистки (`VACUUM`); из-за неё таблицы «пухнут» при частых изменениях.", "dead tuple"),
    ]),

    section("why", [
      h("Изменения необратимы, если не продуманы"),
      p("Чтение данных можно повторить, неверное изменение — нет: обновлённая «лишняя» тысяча строк, удалённые клиенты, обнулённые цены уже в базе. Поэтому изменяющие команды требуют дисциплины: проверить условие, выполнить в транзакции, сверить число затронутых строк, только потом зафиксировать."),
      ul(
        "**Целостность:** ограничения (ключи, `CHECK`, внешние ключи) отвергают некорректные изменения — но корректные ошибки они не остановят: «все цены в 0» формально допустимо.",
        "**Объём и скорость:** построчные вставки и массовые изменения устроены по-разному; ошибка в способе стоит часов.",
        "**Конкурентность:** изменения берут блокировки; долгий массовый `UPDATE` мешает остальным (подробно в теме о блокировках).",
        "**Место и производительность:** в PostgreSQL каждое изменение оставляет мёртвые версии строк.",
      ),
    ]),

    section("mental-model", [
      h("Изменение — это запрос с побочным эффектом"),
      p("`UPDATE` и `DELETE` работают в два шага: сначала **найти строки** по `WHERE` (как в `SELECT`), потом **применить изменение**. Поэтому любую изменяющую команду можно проверить, превратив в `SELECT` с тем же условием. Если `SELECT` вернул не то, что вы ожидали, — `UPDATE` изменит то же самое."),
      diagram(
        `
        UPDATE products SET price = price * 2 WHERE category = 'посуда'
                         │                           │
                         │                           └─ 1. найти строки (как SELECT)  → 4 строки
                         └─ 2. для каждой строки: новая версия с price * 2

        теги:  INSERT 0 3   — вставлено 3 строки
               UPDATE 4     — изменено 4 строки
               DELETE 2     — удалено 2 строки
        `,
        "Число затронутых строк — быстрая проверка: если ожидалось 4, а получили 10, команду нужно откатить.",
      ),
      h("Транзакция — страховка"),
      p("`BEGIN … ROLLBACK` позволяет выполнить изменение, посмотреть результат запросом и отменить, ничего не сломав. `COMMIT` делает изменения видимыми другим и необратимыми. Практика для ручных правок: `BEGIN` → `SELECT` (что заденет) → команда → `SELECT` (что получилось) → `COMMIT` или `ROLLBACK`."),
      steps(
        [
          ["Посмотреть", "`SELECT count(*) … WHERE …` — сколько строк заденет условие."],
          ["Начать транзакцию", "`BEGIN` — все изменения пока видны только вам."],
          ["Выполнить", "`UPDATE`/`DELETE` с тем же `WHERE`; тег показывает число строк."],
          ["Проверить", "Запросом сверить результат с ожиданием."],
          ["Решить", "`COMMIT` — оставить, `ROLLBACK` — отменить."],
        ],
        "Безопасное ручное изменение данных",
      ),
    ]),

    section("technical", [
      h("INSERT"),
      table(
        ["Форма", "Что делает", "Замечание"],
        [
          ["`INSERT INTO t (a, b) VALUES (1, 'x')`", "Одна строка", "Всегда перечисляйте столбцы"],
          ["`… VALUES (…), (…), (…)`", "Несколько строк одним оператором", "Быстрее, чем много отдельных команд"],
          ["`INSERT INTO t (a, b) SELECT …`", "Строки из запроса", "Копирование и преобразование данных"],
          ["`INSERT INTO t DEFAULT VALUES`", "Строка из значений по умолчанию", "Для таблиц, где все столбцы имеют умолчания"],
          ["`… RETURNING id`", "Вернуть созданные значения", "Подробно в теме об upsert"],
        ],
        "Формы INSERT",
      ),
      h("UPDATE"),
      ul(
        "`UPDATE t SET a = выражение, b = выражение WHERE условие` — выражения в правой части видят **старые** значения строки.",
        "`UPDATE … FROM другая_таблица WHERE …` (PostgreSQL) — изменение по данным соединения; переносимая замена — коррелированный подзапрос в `SET`.",
        "Условие по `NULL`: `WHERE x = NULL` не затронет ничего — используйте `IS NULL`.",
        "Изменение первичного ключа возможно, но ломает ссылки (если нет `ON UPDATE CASCADE`).",
      ),
      h("DELETE и TRUNCATE"),
      table(
        ["Команда", "Условие", "Скорость", "Особенности"],
        [
          ["`DELETE FROM t WHERE …`", "Любое", "Пропорциональна числу строк", "Вызывает триггеры и действия внешних ключей, оставляет мёртвые версии"],
          ["`DELETE FROM t`", "Нет (все строки)", "Как выше", "То же, но без отбора"],
          ["`TRUNCATE t`", "Нет", "Почти мгновенна", "Освобождает файл таблицы; можно откатить в транзакции (PostgreSQL); `CASCADE` очищает ссылающиеся таблицы"],
          ["`DELETE FROM t USING другая WHERE …`", "С данными другой таблицы", "—", "Расширение PostgreSQL"],
        ],
        "Удаление данных",
      ),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `CREATE TABLE notes (
  id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title   text    NOT NULL,
  status  text    NOT NULL DEFAULT 'draft',
  created date    NOT NULL DEFAULT '2024-01-01'
);

INSERT INTO notes (title) VALUES ('первая');                                  -- остальное — по умолчанию
INSERT INTO notes (title, status) VALUES ('вторая', 'done'), ('третья', 'draft');  -- несколько строк
INSERT INTO notes (title, status)
SELECT title || ' (копия)', 'copy' FROM notes WHERE status = 'draft';          -- INSERT ... SELECT

SELECT id, title, status, created FROM notes ORDER BY id;`,
        [
          { line: [1, 6], text: "Таблица с автоматическим `id` и значениями по умолчанию для `status` и `created`." },
          { line: 8, text: "Вставка с неполным списком столбцов: `status` и `created` получат значения `DEFAULT`." },
          { line: 9, text: "Несколько строк одним оператором; список столбцов задан явно." },
          { line: [10, 11], text: "`INSERT … SELECT`: строки вычисляются запросом (названия с суффиксом «(копия)»)." },
          { line: 13, text: "Проверка итога: пять строк, у двух копий статус `copy`." },
        ],
        "01-insert.pg.sql",
      ),
    ]),

    section("minimal-example", [
      p("Вставка по умолчанию, вставка нескольких строк и копирование из `SELECT`. Тег команды показывает число вставленных строк:"),
      code("sql", `CREATE TABLE notes (
  id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title   text    NOT NULL,
  status  text    NOT NULL DEFAULT 'draft',
  created date    NOT NULL DEFAULT '2024-01-01'
);

INSERT INTO notes (title) VALUES ('первая');                                  -- остальное — по умолчанию
INSERT INTO notes (title, status) VALUES ('вторая', 'done'), ('третья', 'draft');  -- несколько строк
INSERT INTO notes (title, status)
SELECT title || ' (копия)', 'copy' FROM notes WHERE status = 'draft';          -- INSERT ... SELECT

SELECT id, title, status, created FROM notes ORDER BY id;`, { filename: "01-insert.pg.sql", lineNumbers: true }),
      code("text", `CREATE TABLE
INSERT 0 1
INSERT 0 2
INSERT 0 2
 id |     title      | status |  created   
----+----------------+--------+------------
  1 | первая         | draft  | 2024-01-01
  2 | вторая         | done   | 2024-01-01
  3 | третья         | draft  | 2024-01-01
  4 | первая (копия) | copy   | 2024-01-01
  5 | третья (копия) | copy   | 2024-01-01
(5 rows)`, { filename: "результат (PostgreSQL 16.14, с тегами команд)" }),
      p("`INSERT 0 1`, `INSERT 0 2` и `INSERT 0 2`: 1 + 2 + 2 = 5 строк. Строка `первая` получила `status = draft` и `created = 2024-01-01` по умолчанию; идентификаторы 1–5 присвоены автоматически."),
    ]),

    section("detailed-example", [
      p("Основная опасность — `UPDATE` без `WHERE`. Сравните: первая команда меняет цены напитков, вторая «по ошибке» затрагивает все десять товаров, но выполнена в транзакции и отменена."),
      code("sql", `UPDATE products SET price = price * 1.10 WHERE category = 'напитки';            -- 3 строки

BEGIN;
UPDATE products SET price = 0;                                                  -- забыли WHERE: затронуты ВСЕ строки
SELECT count(*) AS zero_priced FROM products WHERE price = 0;
ROLLBACK;                                                                       -- откат спас данные
SELECT count(*) AS zero_priced_after_rollback FROM products WHERE price = 0;

SELECT title, price FROM products WHERE category = 'напитки' ORDER BY id;`, { filename: "02-update.pg.sql", lineNumbers: true }),
      code("text", `UPDATE 3
BEGIN
UPDATE 10
 zero_priced 
-------------
          10
(1 row)

ROLLBACK
 zero_priced_after_rollback 
----------------------------
                          0
(1 row)

       title        |  price  
--------------------+---------
 Кофе зерновой 1 кг | 1320.00
 Чай чёрный 100 г   |  275.00
 Какао 250 г        |  418.00
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "`UPDATE 3` — три напитка подорожали на 10% (1200 → 1320, 250 → 275, 380 → 418).",
        "`UPDATE 10` — команда без `WHERE` затронула все строки; запрос внутри транзакции подтвердил «10 товаров с нулевой ценой».",
        "После `ROLLBACK` товаров с нулевой ценой снова 0: изменения отменены целиком.",
      ),
      h("Изменение по данным другой таблицы"),
      code("sql", `-- Скидка 10% на товары, которые заказывали только в отменённых заказах
UPDATE products AS p
SET price = round(p.price * 0.9, 2)
FROM (
  SELECT oi.product_id
  FROM order_items AS oi JOIN orders AS o ON o.id = oi.order_id
  GROUP BY oi.product_id
  HAVING bool_and(o.status = 'cancelled')
) AS only_cancelled
WHERE p.id = only_cancelled.product_id;

SELECT id, title, price FROM products WHERE id IN (3, 8) ORDER BY id;`, { filename: "03-update-from.pg.sql" }),
      code("text", `UPDATE 1
 id |        title        |  price  
----+---------------------+---------
  3 | Кружка керамическая |  450.00
  8 | Чайник стальной     | 2070.00
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Скидка применена только к Чайнику (`id = 8`): его заказывали исключительно в отменённом заказе. Кружка (`id = 3`) осталась `450.00`, потому что покупалась и в оплаченных. Подзапрос `only_cancelled` вычисляет множество товаров, `UPDATE … FROM` соединяет его с таблицей."),
      p("Переносимый вариант без `FROM` — коррелированный подзапрос в `SET`: вычитаем проданное количество из остатков."),
      code("sql", `-- Переносимая запись: коррелированный подзапрос вместо UPDATE ... FROM
CREATE TABLE stock (product_id integer PRIMARY KEY, qty integer NOT NULL);
INSERT INTO stock VALUES (1, 10), (2, 5), (3, 0);

UPDATE stock
SET qty = qty - COALESCE((SELECT sum(oi.qty) FROM order_items AS oi WHERE oi.product_id = stock.product_id), 0)
WHERE product_id IN (1, 2, 3);

SELECT product_id, qty FROM stock ORDER BY product_id;`, { filename: "04-update-correlated.sql", runnable: true, fixture: "shop" }),
      code("text", ` product_id | qty 
------------+-----
          1 |   3
          2 |  -1
          3 |  -6
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("У товара 3 остаток ушёл в `-6`: схема не запрещает отрицательные остатки. Нужен `CHECK (qty >= 0)` — тогда команда отклонилась бы целиком (см. тему о ключах и ограничениях)."),
    ]),

    section("analysis", [
      table(
        ["Команда", "Тег", "Что показывает"],
        [
          ["`INSERT … VALUES (…)` ×3 команды", "`INSERT 0 1`, `INSERT 0 2`, `INSERT 0 2`", "Число вставленных строк в каждой команде"],
          ["`UPDATE products SET price = price * 1.10 WHERE category = 'напитки'`", "`UPDATE 3`", "Условие затронуло 3 напитка"],
          ["`UPDATE products SET price = 0`", "`UPDATE 10`", "Без `WHERE` — все строки"],
          ["`UPDATE products … FROM only_cancelled`", "`UPDATE 1`", "Только товар 8 (Чайник)"],
          ["`DELETE FROM log_lines WHERE level = 'info' AND id <= 8`", "`DELETE 6`", "Строки 1, 2, 3, 5, 6, 7 (`id` 4 и 8 — `error`)"],
          ["`TRUNCATE log_lines`", "`TRUNCATE TABLE`", "Таблица очищена, число строк не сообщается"],
        ],
        "Что значат теги команд (замеры PostgreSQL 16.14)",
      ),
      code("sql", `CREATE TABLE log_lines (id integer PRIMARY KEY, level text NOT NULL, msg text);
INSERT INTO log_lines SELECT g, CASE WHEN g % 4 = 0 THEN 'error' ELSE 'info' END, 'строка ' || g FROM generate_series(1, 20) AS g;

DELETE FROM log_lines WHERE level = 'info' AND id <= 8;
SELECT count(*) AS left_after_delete FROM log_lines;

-- DELETE ... USING: удалить по условию в другой таблице
DELETE FROM order_items AS oi USING orders AS o WHERE o.id = oi.order_id AND o.status = 'cancelled';
SELECT count(*) AS items_after FROM order_items;

TRUNCATE log_lines;
SELECT count(*) AS left_after_truncate FROM log_lines;`, { filename: "05-delete.pg.sql" }),
      code("text", `CREATE TABLE
INSERT 0 20
DELETE 6
 left_after_delete 
-------------------
                14
(1 row)

DELETE 2
 items_after 
-------------
          23
(1 row)

TRUNCATE TABLE
 left_after_truncate 
---------------------
                   0
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Из 20 строк удалено 6 → осталось 14: условие `level = 'info' AND id <= 8` взяло шесть информационных строк с `id ≤ 8`.",
        "`DELETE … USING` удалил 2 позиции отменённых заказов (25 → 23); обратите внимание: «отменённый» заказ остался в `orders`, удалены только его позиции.",
        "`TRUNCATE` очистил таблицу; в отличие от `DELETE` он не принимает `WHERE`.",
      ),
    ]),

    section("internals", [
      h("Почему UPDATE «раздувает» таблицу"),
      p("PostgreSQL использует многоверсионность (MVCC): `UPDATE` не перезаписывает строку, а добавляет **новую версию**; старая остаётся для транзакций, которые её ещё видят, и затем удаляется очисткой (`VACUUM`). Это обеспечивает чтение без блокировок, но означает, что частые изменения оставляют «мусор»."),
      code("sql", `CREATE TABLE big (id integer PRIMARY KEY, v integer NOT NULL);
INSERT INTO big SELECT g, 0 FROM generate_series(1, 100000) AS g;
VACUUM big;
SELECT pg_size_pretty(pg_relation_size('big')) AS size_after_insert;

UPDATE big SET v = v + 1;                                      -- каждая строка получает новую версию
SELECT pg_size_pretty(pg_relation_size('big')) AS size_after_update;

VACUUM big;                                                    -- старые версии помечены свободными, файл не уменьшился
SELECT pg_size_pretty(pg_relation_size('big')) AS size_after_vacuum;

UPDATE big SET v = v + 1;                                      -- новая версия строк занимает освобождённое место
SELECT pg_size_pretty(pg_relation_size('big')) AS size_after_second_update;`, { filename: "08-mvcc-bloat.pg.sql" }),
      code("text", `CREATE TABLE
INSERT 0 100000
VACUUM
 size_after_insert 
-------------------
 3544 kB
(1 row)

UPDATE 100000
 size_after_update 
-------------------
 7080 kB
(1 row)

VACUUM
 size_after_vacuum 
-------------------
 7080 kB
(1 row)

UPDATE 100000
 size_after_second_update 
--------------------------
 7080 kB
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "100 000 строк занимали 3544 кБ; после `UPDATE` каждой строки — 7080 кБ: рядом лежат старые и новые версии.",
        "`VACUUM` пометил старые версии свободными, но **размер файла остался 7080 кБ** — место доступно для новых версий, а не возвращено системе.",
        "Второй `UPDATE` переиспользовал освобождённое место: размер не вырос (7080 кБ).",
        "Выводы: массовые изменения следует проводить партиями с очисткой, а таблицы с постоянными изменениями — настраивать (`autovacuum`, `fillfactor`).",
      ),
      h("Правая часть SET видит старые значения"),
      code("sql", `CREATE TABLE pair (a integer, b integer);
INSERT INTO pair VALUES (1, 2);
UPDATE pair SET a = b, b = a;          -- правая часть вычисляется по СТАРЫМ значениям строки
SELECT a, b FROM pair;`, { filename: "06-swap.sql", runnable: true }),
      code("text", ` a | b 
---+---
 2 | 1
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Оба выражения `SET a = b, b = a` вычисляются по состоянию строки **до** изменения, поэтому значения поменялись местами. Это стандартное поведение и в PostgreSQL, и в SQLite."),
    ]),

    section("mistakes", [
      h("Ошибка: UPDATE или DELETE без WHERE"),
      code("sql", `-- Хотели удвоить цены только на посуду. Выполнили так — и проверяем результат перед фиксацией
BEGIN;
UPDATE products SET price = price * 2;
SELECT category, count(*) AS products, round(avg(price), 2) AS avg_price FROM products GROUP BY category ORDER BY category;
ROLLBACK;`, { filename: "11-ex-fix.pg.sql" }),
      code("text", `BEGIN
UPDATE 10
 category | products | avg_price 
----------+----------+-----------
 напитки  |        3 |   1220.00
 посуда   |        4 |   2820.00
 продукты |        3 |    500.00
(3 rows)

ROLLBACK`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Команда затронула 10 строк вместо 4: средняя цена напитков стала `1220.00`, продуктов — `500.00`. Тег `UPDATE 10` — первый сигнал; без транзакции откатить было бы нечем. Исправление — `WHERE category = 'посуда'`:"),
      code("sql", `BEGIN;
UPDATE products SET price = price * 2 WHERE category = 'посуда';
SELECT category, count(*) AS products, round(avg(price), 2) AS avg_price FROM products GROUP BY category ORDER BY category;
ROLLBACK;`, { filename: "12-fix-solution.pg.sql" }),
      code("text", `BEGIN
UPDATE 4
 category | products | avg_price 
----------+----------+-----------
 напитки  |        3 |    610.00
 посуда   |        4 |   2820.00
 продукты |        3 |    250.00
(3 rows)

ROLLBACK`, { filename: "результат (PostgreSQL 16.14)" }),
      h("Ошибка: не сверять число затронутых строк"),
      p("Приложение должно проверять `rowCount`: если `UPDATE … WHERE id = :id` вернул 0, записи нет (или версия устарела); если больше 1 — условие неверно. Молчаливое «успешно» при нуле строк прячет ошибки."),
      h("Ошибка: массовое изменение одним оператором в рабочей базе"),
      p("`UPDATE` миллионов строк блокирует строки до конца транзакции, раздувает журнал и таблицу. Делайте партиями (`WHERE id BETWEEN … AND …`, 1–10 тыс. строк), фиксируйте каждую, следите за блокировками и задержкой репликации."),
      h("Ошибка: вставка без списка столбцов"),
      wrongRight(
        "sql",
        { title: "Порядок столбцов угадан", code: `INSERT INTO notes VALUES (DEFAULT, 'заголовок', 'draft', '2024-01-01');`, note: "Ломается при добавлении, удалении или перестановке столбцов: значения попадут не туда." },
        { title: "Список столбцов явный", code: `INSERT INTO notes (title, status) VALUES ('заголовок', 'draft');`, note: "Не указанные столбцы получают умолчания; код устойчив к изменениям схемы." },
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Ручные `UPDATE`/`DELETE` в рабочей базе без транзакции и предварительного `SELECT`.**",
        "**Цикл в приложении:** тысяча отдельных `UPDATE` вместо одного (`UPDATE … WHERE id IN (…)`), `INSERT` по одному вместо пакета.",
        "**«Удалить и вставить заново»** вместо `UPDATE`: теряются ссылки, срабатывают каскады, меняются идентификаторы.",
        "**Физическое удаление там, где нужна история** (заказы, платежи): используйте статус или `deleted_at`.",
        "**`SELECT` и `UPDATE` без блокировки** («прочитал остаток, вычел в приложении, записал») — потерянное обновление; используйте `UPDATE … SET qty = qty - 1`.",
        "**`TRUNCATE` в скриптах без осознания каскадов** и триггеров.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Перед изменением — `SELECT` с тем же условием**; после — сверка числа строк.",
        "**Ручные правки — в транзакции**, `COMMIT` только после проверки.",
        "**Явный список столбцов** в `INSERT`.",
        "**Атомарные выражения** (`qty = qty - 1`) вместо «прочитать — посчитать — записать».",
        "**Пакетные вставки и обновления** вместо построчных; для очень больших загрузок — `COPY` (PostgreSQL).",
        "**Идемпотентные команды** там, где возможны повторы (повторная доставка сообщения).",
        "**Ограничения в схеме** защищают от недопустимых результатов `UPDATE`.",
        "**Мягкое удаление** для данных с историей и аудитом.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**`UPDATE` без фактического изменения** (`SET x = x`) всё равно создаёт новую версию строки в PostgreSQL и срабатывает триггеры.",
        "**`DELETE` родителя** при внешних ключах: ошибка, каскад или `SET NULL` в зависимости от `ON DELETE`.",
        "**Порядок обновления строк не определён**, а ограничения `UNIQUE` проверяются построчно: сдвиг ключей `n = n + 1` может упасть (отложенные ограничения помогают).",
        "**`INSERT … SELECT` с `ORDER BY`** не гарантирует порядок вставки идентификаторов.",
        "**`TRUNCATE … RESTART IDENTITY`** сбрасывает счётчики `identity`; обычный `DELETE` — нет.",
        "**`NULL` в `SET`:** `SET city = NULL` допустимо, если столбец не `NOT NULL`.",
        "**SQLite:** `UPDATE … FROM` поддерживается с версии 3.33; `TRUNCATE` нет — используют `DELETE FROM t`.",
      ),
    ]),

    section("related", [
      ul(
        "[Ключи и ограничения](/learn/sql/keys-constraints) — что защищает данные от неверных изменений.",
        "[SELECT и WHERE](/learn/sql/select-where) — условие `WHERE` одинаково для чтения и изменения.",
        "[Upsert и RETURNING](/learn/sql/upsert-returning) — `INSERT … ON CONFLICT` и возврат изменённых строк.",
        "[Транзакции и ACID](/learn/sql/acid-transactions) — `BEGIN`, `COMMIT`, `ROLLBACK`.",
        "[Блокировки и взаимные блокировки](/learn/sql/locking-deadlocks) — что удерживает `UPDATE`.",
        "[Миграции и безопасный DDL](/learn/sql/migrations-safe-ddl) — массовые изменения данных партиями.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Прочитал — посчитал — записал",
          code: `
            -- в приложении:
            -- qty = SELECT qty FROM stock WHERE product_id = 1;   -- 10
            -- UPDATE stock SET qty = 9 WHERE product_id = 1;      -- записали «10 - 1»
          `,
          note: "Две параллельные операции прочитают 10 и обе запишут 9 — одно вычитание потеряно.",
        },
        {
          title: "Атомарное выражение",
          code: `
            UPDATE stock SET qty = qty - 1 WHERE product_id = 1 AND qty > 0;
            -- проверить число затронутых строк: 0 означает «нет остатка»
          `,
          note: "Вычитание и проверка выполняются в одной команде под блокировкой строки: потерянных обновлений нет.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.insert-update-delete.ex1",
      title: "Предскажите состояние таблицы",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская, определите содержимое таблицы `t` после выполнения всех команд и теги `UPDATE`/`DELETE`."),
        code("sql", `CREATE TABLE t (id integer PRIMARY KEY, n integer, label text);
INSERT INTO t VALUES (1, 10, 'a'), (2, 20, 'b'), (3, NULL, 'c');
UPDATE t SET n = n + 5;
UPDATE t SET label = upper(label) WHERE n > 15;
DELETE FROM t WHERE n IS NULL;
SELECT id, n, label FROM t ORDER BY id;`, { filename: "10-ex-predict.pg.sql", lineNumbers: true }),
      ],
      hints: ["Чему равно `NULL + 5`?", "Какие строки удовлетворяют `n > 15` после первого обновления?", "Затронет ли `DELETE … WHERE n IS NULL` строку, где `n` изменилось через `NULL + 5`?"],
      checks: ["Первое обновление: `UPDATE 3`", "Второе: `UPDATE 1` (метка `b` → `B`)", "`DELETE 1` (строка 3)", "Итог: (1, 15, a) и (2, 25, B)"],
      solution: [
        code("text", `CREATE TABLE
INSERT 0 3
UPDATE 3
UPDATE 1
DELETE 1
 id | n  | label 
----+----+-------
  1 | 15 | a
  2 | 25 | B
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "`UPDATE t SET n = n + 5` затронул все три строки (`UPDATE 3`), но у строки 3 `NULL + 5` — по-прежнему `NULL`.",
          "`n > 15` истинно только для строки 2 (25): `label` стал `B`; для `NULL` условие неизвестно (`UPDATE 1`).",
          "`DELETE … WHERE n IS NULL` удалил строку 3 (`DELETE 1`).",
        ),
      ],
    }),
    exercise({
      id: "sql.insert-update-delete.ex2",
      title: "Цены выросли везде",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Нужно удвоить цены на посуду. Команда без условия выполнена в транзакции. Определите по результату проверки, что пошло не так, и выполните верный вариант."),
        code("sql", `-- Хотели удвоить цены только на посуду. Выполнили так — и проверяем результат перед фиксацией
BEGIN;
UPDATE products SET price = price * 2;
SELECT category, count(*) AS products, round(avg(price), 2) AS avg_price FROM products GROUP BY category ORDER BY category;
ROLLBACK;`, { filename: "11-ex-fix.pg.sql" }),
      ],
      hints: ["Какой тег вернула команда и какой ожидался?", "Какие категории изменили среднюю цену?"],
      checks: ["Замечен `UPDATE 10` вместо `UPDATE 4`", "Названа причина: нет `WHERE`", "Исправление: `WHERE category = 'посуда'`", "Ожидаемый тег: `UPDATE 4`"],
      solution: [
        code("sql", `BEGIN;
UPDATE products SET price = price * 2 WHERE category = 'посуда';
SELECT category, count(*) AS products, round(avg(price), 2) AS avg_price FROM products GROUP BY category ORDER BY category;
ROLLBACK;`, { filename: "12-fix-solution.pg.sql" }),
        code("text", `BEGIN
UPDATE 4
 category | products | avg_price 
----------+----------+-----------
 напитки  |        3 |    610.00
 посуда   |        4 |   2820.00
 продукты |        3 |    250.00
(3 rows)

ROLLBACK`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Тег `UPDATE 4` совпал с ожиданием, а средние цены напитков (610) и продуктов (250) не изменились; цены посуды удвоились (1410 → 2820). Если бы проверка показала другое — `ROLLBACK`."),
      ],
    }),
    exercise({
      id: "sql.insert-update-delete.ex3",
      title: "Архив клиентов без заказов",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Перенесите в таблицу `customers_archive` всех клиентов, у которых нет заказов, и удалите их из `customers`. Всё выполните атомарно: либо перенесены и удалены, либо ничего. Покажите число строк в обеих таблицах и содержимое архива."),
      ],
      hints: ["Как найти клиентов без заказов: `NOT EXISTS` или `LEFT JOIN … IS NULL`?", "Как создать архивную таблицу с той же структурой?", "Что обеспечит атомарность?"],
      checks: ["Транзакция `BEGIN … COMMIT`", "`INSERT … SELECT` и `DELETE` с одинаковым условием", "Архив: Егор и Игорь; в `customers` осталось 6"],
      solution: [
        code("sql", `BEGIN;

-- 1. Перенести клиентов без заказов в архив и удалить из основной таблицы
CREATE TABLE customers_archive (LIKE customers INCLUDING ALL);
INSERT INTO customers_archive
SELECT c.* FROM customers AS c
WHERE NOT EXISTS (SELECT 1 FROM orders AS o WHERE o.customer_id = c.id);

DELETE FROM customers AS c
WHERE NOT EXISTS (SELECT 1 FROM orders AS o WHERE o.customer_id = c.id);

SELECT 'архив' AS tbl, count(*) AS n FROM customers_archive
UNION ALL SELECT 'клиенты', count(*) FROM customers;

SELECT id, name FROM customers_archive ORDER BY id;

COMMIT;`, { filename: "13-challenge.pg.sql", lineNumbers: true }),
        code("text", `BEGIN
CREATE TABLE
INSERT 0 2
DELETE 2
   tbl   | n 
---------+---
 архив   | 2
 клиенты | 6
(2 rows)

 id | name  
----+-------
  6 | Егор
  8 | Игорь
(2 rows)

COMMIT`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Оба действия используют одно и то же условие и завершаются в одной транзакции: если бы `DELETE` не прошёл (например, из-за ссылок), вставка в архив откатилась бы вместе с ним. `LIKE customers INCLUDING ALL` скопировал структуру таблицы."),
      ],
    }),
  ],

  challenge: {
    id: "sql.insert-update-delete.challenge",
    title: "Безопасное исправление города клиентов",
    scenario: [
      p("Москву переименовали в «Санкт-Петербург» в справочнике клиентов (учебный пример). Нужно исправить значения в таблице `customers`, не затронув других клиентов, и убедиться в этом до фиксации."),
    ],
    requirements: [
      "Посчитать, сколько клиентов затронет условие, до изменения",
      "Выполнить изменение в транзакции и проверить результат: число изменённых и число оставшихся «Москва»",
      "В демонстрационных целях откатить транзакцию и убедиться, что данные вернулись",
    ],
    constraints: [
      "Условие в `WHERE` обязательно",
      "Проверка до и после изменения",
    ],
    acceptance: [
      "До изменения условие затрагивает 3 клиента",
      "Тег `UPDATE 3`; после изменения «Москва» нет, «Санкт-Петербург» — 3",
      "После `ROLLBACK` «Москва» снова 3",
    ],
    hints: [
      "`BEGIN`, `SELECT count(*)`, `UPDATE … WHERE city = 'Москва'`, проверочный `SELECT`, `ROLLBACK`.",
    ],
    solution: [
      code("sql", `BEGIN;
SELECT count(*) AS will_change FROM customers WHERE city = 'Москва';           -- сначала посмотреть, что заденет условие
UPDATE customers SET city = 'Санкт-Петербург' WHERE city = 'Москва';
SELECT count(*) AS now_spb, count(*) FILTER (WHERE city = 'Москва') AS still_moscow FROM customers WHERE city IN ('Санкт-Петербург', 'Москва');
ROLLBACK;
SELECT count(*) AS moscow_after_rollback FROM customers WHERE city = 'Москва';`, { filename: "07-safe-update.pg.sql" }),
      code("text", `BEGIN
 will_change 
-------------
           3
(1 row)

UPDATE 3
 now_spb | still_moscow 
---------+--------------
       3 |            0
(1 row)

ROLLBACK
 moscow_after_rollback 
-----------------------
                     3
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Предварительный `SELECT` показал 3 строки, `UPDATE 3` совпал с ожиданием, проверка внутри транзакции — 3 и 0. Команда `ROLLBACK` вернула данные (3 москвича). Для настоящего исправления тот же сценарий завершается `COMMIT`."),
    ],
  },

  interview: [
    iq("sql.insert-update-delete.i1", "basic", "Что произойдёт, если выполнить UPDATE без WHERE?", [
      ul(
        "Будут изменены все строки таблицы (в замере `UPDATE products SET price = 0` вернул `UPDATE 10`).",
        "Защита: перед изменением — `SELECT` с тем же условием; выполнять в транзакции и сверять число затронутых строк.",
        "Если транзакция ещё не зафиксирована — `ROLLBACK` вернёт данные.",
      ),
    ]),
    iq("sql.insert-update-delete.i2", "basic", "Чем DELETE отличается от TRUNCATE?", [
      ul(
        "`DELETE` удаляет строки по условию (или все), вызывает триггеры и действия внешних ключей, работает пропорционально числу строк.",
        "`TRUNCATE` быстро очищает таблицу целиком, без `WHERE`; в PostgreSQL её можно откатить в транзакции.",
        "Оба требуют осторожности: `TRUNCATE … CASCADE` очищает и ссылающиеся таблицы.",
      ),
    ]),
    iq("sql.insert-update-delete.i3", "intermediate", "Как обновить строки одной таблицы по данным другой?", [
      ul(
        "PostgreSQL: `UPDATE t SET … FROM другая WHERE t.id = другая.t_id`.",
        "Переносимо: коррелированный подзапрос в `SET` и условие `WHERE EXISTS (…)`.",
        "Следите за размножением строк: если в `FROM` несколько подходящих строк, значение берётся произвольно из одной.",
      ),
    ]),
    iq("sql.insert-update-delete.i4", "intermediate", "Почему `UPDATE pair SET a = b, b = a` меняет значения местами?", [
      ul(
        "Все выражения правой части вычисляются по состоянию строки до изменения.",
        "Поэтому присваивания не зависят друг от друга: в замере `(1, 2)` → `(2, 1)`.",
        "В процедурном коде с последовательными присваиваниями понадобилась бы временная переменная.",
      ),
    ]),
    iq("sql.insert-update-delete.i5", "intermediate", "Как безопасно вносить ручные правки в рабочую базу?", [
      ul(
        "`SELECT` с тем же условием — сколько строк заденет.",
        "`BEGIN`; команда; проверка тегом и запросом; затем `COMMIT` или `ROLLBACK`.",
        "Резервная копия затрагиваемых строк (`CREATE TABLE … AS SELECT`) и второй человек для проверки.",
        "Для массовых изменений — партии и мониторинг блокировок.",
      ),
    ]),
    iq("sql.insert-update-delete.i6", "advanced", "Почему после UPDATE таблица в PostgreSQL становится больше и что с этим делать?", [
      ul(
        "MVCC: `UPDATE` добавляет новую версию строки, старая остаётся до очистки (в замере 3544 кБ → 7080 кБ на 100 000 строк).",
        "`VACUUM` освобождает место для повторного использования, но не уменьшает файл (7080 кБ); второй `UPDATE` размер не увеличил.",
        "Что делать: настроить `autovacuum`, обновлять партиями, снижать `fillfactor` для часто изменяемых таблиц (HOT-обновления), при крайней необходимости — `VACUUM FULL`/`pg_repack` (блокируют).",
      ),
    ]),
    iq("sql.insert-update-delete.i7", "engineering", "Как загрузить миллионы строк быстро и безопасно?", [
      ul(
        "`COPY` (или `\\copy`) из файла — быстрее любых `INSERT`; для кода приложения — многострочные `INSERT … VALUES` пакетами 1–10 тыс. строк в одной транзакции.",
        "Отложить создание индексов и внешних ключей до конца загрузки; после — `ANALYZE`.",
        "Загружать в промежуточную таблицу, проверять, затем `INSERT … SELECT` в целевую.",
        "Идемпотентность и возобновляемость: `ON CONFLICT DO NOTHING`, учёт загруженных партий.",
      ),
    ]),
    iq("sql.insert-update-delete.i8", "debugging", "UPDATE вернул `UPDATE 0`, хотя ожидалась одна строка. Какие причины?", [
      ul(
        "Условие не совпало: опечатка в значении, `NULL` в сравнении (`= NULL`), пробелы или регистр.",
        "Строку уже изменил или удалил другой процесс (устаревшая версия при оптимистичной блокировке `WHERE id = :id AND version = :v`).",
        "Не тот соединение/схема/тестовая база.",
        "Проверка: тот же `WHERE` в `SELECT`, сравнение значений.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.insert-update-delete.e1", "foundation", "Что означает тег `UPDATE 3`?", ["Изменено 3 столбца", "Обновление длилось 3 секунды", "Изменено 3 строки", "Создано 3 версии таблицы"], 2, "Число после команды — количество затронутых строк."),
    mcq("sql.insert-update-delete.e2", "foundation", "Что делает `DELETE FROM products` без `WHERE`?", ["Удаляет все строки, таблица остаётся", "Удаляет таблицу", "Ничего", "Удаляет первую строку"], 0, "Без условия удаляются все строки; структура таблицы сохраняется (удаляет таблицу `DROP TABLE`)."),
    mcq("sql.insert-update-delete.e3", "foundation", "Какой командой откатывают незафиксированные изменения?", ["`UNDO`", "`REVERT`", "`RESTORE`", "`ROLLBACK`"], 3, "`ROLLBACK` отменяет изменения текущей транзакции."),
    mcq("sql.insert-update-delete.e4", "intermediate", "Что станет с таблицей `pair (1, 2)` после `UPDATE pair SET a = b, b = a`?", ["`(2, 2)`", "`(2, 1)`", "`(1, 1)`", "Ошибка"], 1, "Правая часть вычисляется по старым значениям строки: значения меняются местами (замер)."),
    mcq("sql.insert-update-delete.e5", "intermediate", "Какие меры помогают безопасно менять данные? Выберите все.", ["`SELECT` с тем же `WHERE` до изменения", "Выполнение в транзакции", "Сверка числа затронутых строк", "`UPDATE` без `WHERE`, «чтобы быстрее»"], [0, 1, 2], "Предварительная проверка, транзакция и сверка тега защищают от ошибок; `UPDATE` без условия — источник ошибок."),
    mcq("sql.insert-update-delete.e6", "intermediate", "Чем `TRUNCATE` отличается от `DELETE FROM t`?", ["Ничем", "`TRUNCATE` удаляет только первую строку", "`TRUNCATE` удаляет таблицу", "`TRUNCATE` быстро очищает таблицу целиком и не принимает `WHERE`"], 3, "`TRUNCATE` — быстрая очистка всей таблицы; `DELETE` работает построчно и допускает условие."),
    mcq("sql.insert-update-delete.e7", "advanced", "Почему размер таблицы в PostgreSQL после `UPDATE` каждой строки вырос вдвое и не уменьшился после `VACUUM`?", ["Из-за ошибки `VACUUM`", "`VACUUM` не работает с `UPDATE`", "`UPDATE` создаёт новые версии строк; `VACUUM` освобождает место для повторного использования, но не сжимает файл", "Таблица сжимается только при `COMMIT`"], 2, "Замер: 3544 кБ → 7080 кБ → после `VACUUM` 7080 кБ → после второго `UPDATE` 7080 кБ (место переиспользовано)."),
    open("sql.insert-update-delete.e8", "intermediate", "Опишите безопасный порядок действий при ручном исправлении данных в рабочей базе и зачем нужен каждый шаг.", [
      ul(
        "Определить условие и проверить его `SELECT`-ом: убедиться, что число и состав строк ожидаемы.",
        "Сохранить резервную копию затрагиваемых строк (например, `CREATE TABLE backup AS SELECT … WHERE …`).",
        "`BEGIN`, выполнить `UPDATE`/`DELETE`, сверить тег с числом из `SELECT`, проверить результат запросом.",
        "`COMMIT` при совпадении, `ROLLBACK` при расхождении; зафиксировать выполненное (тикет, запрос, число строк).",
        "Для массовых изменений — партии и наблюдение за блокировками.",
      ),
    ], ["Предварительный SELECT", "Транзакция и сверка тега", "COMMIT/ROLLBACK по результату", "Резервная копия или партии"], { format: "architecture" }),
  ],

  mastery: [
    mcq("sql.insert-update-delete.m1", "intermediate", "Какой тег вернёт `INSERT INTO t (title) VALUES ('a'), ('b'), ('c')`?", ["`INSERT 0 1`", "`INSERT 0 3`", "`INSERT 3 0`", "`INSERT 1 3`"], 1, "Формат `INSERT oid строки`: `oid` теперь всегда `0`, строк три."),
    mcq("sql.insert-update-delete.m2", "advanced", "Почему «прочитать остаток, вычесть в приложении и записать» может потерять обновления, а `SET qty = qty - 1` — нет?", ["Вычитание внутри команды выполняется под блокировкой строки, а чтение и запись разными командами допускают гонку", "`SET` быстрее", "В приложении нельзя вычитать", "Из-за `NULL`"], 0, "Две конкурирующие операции могут прочитать одно и то же значение; `UPDATE` с выражением видит актуальную версию строки."),
    mcq("sql.insert-update-delete.m3", "advanced", "После `UPDATE t SET n = n + 5` на строках `10`, `20` и `NULL` значение в третьей строке…", ["Стало 5", "Стало 0", "Осталось `NULL`", "Строка удалена"], 2, "`NULL + 5` — `NULL`; тег `UPDATE 3` включает строку, но значение осталось неизвестным (замер)."),
    open("sql.insert-update-delete.m4", "advanced", "Нужно обновить 50 млн строк в рабочей таблице (пересчитать поле) без остановки сервиса. Опишите план.", [
      ul(
        "Не одним оператором: разбить на партии по диапазонам ключа (`WHERE id BETWEEN :a AND :b`), по 1–10 тыс. строк, каждая в своей транзакции.",
        "Между партиями — короткая пауза и проверка нагрузки/задержки репликации/блокировок; возможность остановки и возобновления по сохранённому прогрессу.",
        "Условие идемпотентности (`WHERE new_value IS DISTINCT FROM calc`), чтобы повтор не вредил.",
        "Поддержка очистки: `autovacuum`, при необходимости ручной `VACUUM` между партиями; ожидание роста таблицы (MVCC).",
        "Проверка на копии, запасной план отката, мониторинг и итоговая сверка результата.",
      ),
    ], ["Партии по диапазонам ключа", "Паузы и мониторинг", "Идемпотентность и возобновление", "Очистка и сверка результата"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.insert-update-delete.f1", front: "Теги команд?", back: "INSERT 0 n — вставлено n; UPDATE n — изменено n; DELETE n — удалено n. Сверяйте с ожиданием." },
    { id: "sql.insert-update-delete.f2", front: "UPDATE без WHERE?", back: "Затрагивает все строки. Сначала SELECT с тем же условием; выполняйте в транзакции." },
    { id: "sql.insert-update-delete.f3", front: "DELETE и TRUNCATE?", back: "DELETE — построчно, с WHERE, триггеры. TRUNCATE — вся таблица, быстро, без WHERE." },
    { id: "sql.insert-update-delete.f4", front: "SET a = b, b = a?", back: "Правая часть видит старые значения: значения меняются местами." },
    { id: "sql.insert-update-delete.f5", front: "UPDATE … FROM / DELETE … USING?", back: "PostgreSQL: изменение по данным другой таблицы. Переносимо: коррелированный подзапрос." },
    { id: "sql.insert-update-delete.f6", front: "Размер после UPDATE?", back: "Новая версия строки; VACUUM освобождает место для повторного использования, но файл не уменьшает." },
    { id: "sql.insert-update-delete.f7", front: "Безопасная ручная правка?", back: "SELECT условия → BEGIN → команда → проверка тега и данных → COMMIT/ROLLBACK." },
    { id: "sql.insert-update-delete.f8", front: "Потерянное обновление?", back: "Прочитал-посчитал-записал в приложении теряет параллельные изменения. Используйте SET qty = qty - 1." },
    { id: "sql.insert-update-delete.f9", front: "Массовый UPDATE?", back: "Партиями по диапазонам ключа, с паузами, идемпотентно, с мониторингом блокировок и очистки." },
  ],

  sources: [
    { title: "PostgreSQL 16: INSERT", url: "https://www.postgresql.org/docs/16/sql-insert.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: UPDATE", url: "https://www.postgresql.org/docs/16/sql-update.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: DELETE", url: "https://www.postgresql.org/docs/16/sql-delete.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: TRUNCATE", url: "https://www.postgresql.org/docs/16/sql-truncate.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Routine Vacuuming", url: "https://www.postgresql.org/docs/16/routine-vacuuming.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Populating a Database (COPY, bulk loading)", url: "https://www.postgresql.org/docs/16/populate.html", publisher: "PostgreSQL" },
    { title: "SQLite: UPDATE", url: "https://www.sqlite.org/lang_update.html", publisher: "Other" },
    { title: "SQLite: The TRUNCATE optimization (DELETE without WHERE)", url: "https://www.sqlite.org/lang_delete.html#truncateopt", publisher: "Other" },
  ],
};
