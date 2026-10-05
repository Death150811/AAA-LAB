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

export const acidTransactions: Topic = {
  id: "sql.acid-transactions",
  slug: "acid-transactions",
  domain: "sql",
  module: "transactions",
  title: "Транзакции и ACID: всё или ничего",
  titleEn: "Transactions and ACID: All or Nothing",
  summary:
    "Транзакция объединяет несколько команд в одну логическую операцию: либо применяются все, либо ни одна. Тема на замерах PostgreSQL 16.14 и SQLite 3.49: перевод 300 между счетами сохраняет сумму 1500 (700 + 800), `ROLLBACK` возвращает 1000, откат до точки сохранения оставляет `начало` и `шаг 1 заново`, после ошибки внутри транзакции PostgreSQL отвечает `current transaction is aborted…`, а `COMMIT` превращается в `ROLLBACK`, без `BEGIN` перевод 700 с ошибкой на втором шаге «теряет» деньги (итог 800 вместо 1500), DDL в PostgreSQL транзакционен, заказ с нехваткой товара на складе откатывается целиком (склад 6 и 1 после второго заказа). Разбор свойств ACID, автокоммита, точек сохранения, процедур с атомарным переводом и роли журнала WAL.",
  minutes: 90,
  prerequisites: ["sql.insert-update-delete", "sql.keys-constraints", "sql.relationships"],
  tags: ["transaction", "ACID", "atomicity", "consistency", "isolation", "durability", "BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT", "autocommit", "WAL", "transactional DDL", "constraint", "error handling"],
  keyConcepts: [
    { term: "Транзакция — единица атомарности", text: "Перевод = два `UPDATE`. В транзакции итог либо 700 + 800 = 1500, либо исходные 1000 + 500; половинчатого состояния никто не видит." },
    { term: "ACID — четыре гарантии", text: "Atomicity (всё или ничего), Consistency (ограничения сохраняются), Isolation (параллельные транзакции не мешают друг другу), Durability (подтверждённое не теряется при сбое)." },
    { term: "Автокоммит делает каждую команду отдельной транзакцией", text: "Без `BEGIN` перевод 700 при ошибке на втором шаге оставил итог 800: первое изменение уже зафиксировано, 700 «исчезли». В транзакции итог остался 1500." },
    { term: "Ошибка прерывает транзакцию PostgreSQL", text: "После ошибки команды игнорируются (`current transaction is aborted…`), а `COMMIT` выполнится как `ROLLBACK`. Спасает откат до точки сохранения." },
    { term: "Точки сохранения — частичный откат", text: "`ROLLBACK TO SAVEPOINT step1` отменил шаги 1 и 2, но не `начало`; транзакция продолжилась и зафиксировала `шаг 1 заново`." },
    { term: "Одна команда атомарна сама по себе", text: "Один `UPDATE` с `CASE` перевёл деньги между двумя счетами без явного `BEGIN` — либо обе строки, либо ни одной." },
    { term: "DDL в PostgreSQL транзакционен", text: "`BEGIN; CREATE TABLE …; ROLLBACK;` — таблицы после отката нет (`to_regclass` вернул `NULL`)." },
  ],
  sections: [
    section("definition", [
      def("Транзакция", "Последовательность операций над базой данных, выполняемая как единое целое: фиксируется (`COMMIT`) целиком или отменяется (`ROLLBACK`) целиком.", "transaction"),
      def("Atomicity (атомарность)", "Транзакция выполняется полностью или не выполняется вообще; при сбое или ошибке все её изменения отменяются.", "atomicity"),
      def("Consistency (согласованность)", "Транзакция переводит базу из одного допустимого состояния в другое: ограничения (`CHECK`, `FOREIGN KEY`, `UNIQUE`) не нарушаются.", "consistency"),
      def("Isolation (изолированность)", "Параллельные транзакции не видят промежуточных состояний друг друга; степень изоляции задаётся уровнем.", "isolation"),
      def("Durability (долговечность)", "После подтверждения (`COMMIT`) изменения не пропадут даже при сбое сервера: они записаны в журнал на постоянный носитель.", "durability"),
      def("Автокоммит", "Режим, в котором каждая команда вне `BEGIN … COMMIT` — отдельная транзакция, фиксируемая сразу после выполнения.", "autocommit"),
      def("Точка сохранения", "Метка внутри транзакции (`SAVEPOINT`), к которой можно откатиться, не отменяя всю транзакцию.", "savepoint"),
      def("WAL", "Журнал упреждающей записи (write-ahead log): изменения сначала записываются в журнал, затем в файлы данных; на нём держатся долговечность и восстановление.", "write-ahead log"),
    ]),

    section("why", [
      h("Бизнес-операция больше одной команды"),
      p("Перевод денег, оформление заказа, регистрация пользователя с профилем — это всегда несколько изменений. Если процесс прервётся между ними (ошибка, сбой сети, перезапуск сервера), данные окажутся в «полуготовом» состоянии: деньги списаны, но не зачислены; заказ создан, а товар не списан. Транзакция делает группу команд неделимой, и база **сама** следит за этим — без хитрых проверок в приложении."),
      ul(
        "**Целостность бизнес-операций:** итог перевода остаётся 1500 при любом сбое.",
        "**Простая обработка ошибок:** при ошибке достаточно `ROLLBACK`, а не ручной «компенсации».",
        "**Согласованное чтение:** другие сеансы не видят промежуточных значений (подробнее — тема об уровнях изоляции).",
        "**Надёжность:** подтверждённое сохраняется после сбоя благодаря журналу WAL.",
      ),
      note("Транзакция — не «замок на всё»: чем дольше она открыта, тем дольше держит блокировки и мешает очистке старых версий строк. Короткие транзакции — правило."),
    ]),

    section("mental-model", [
      h("Черновик и чистовик"),
      p("Представьте, что `BEGIN` открывает **черновик**: все изменения вы записываете в него, и только вы их видите. `COMMIT` переписывает черновик «начисто» — разом, для всех. `ROLLBACK` выбрасывает черновик, и база остаётся такой, какой была. Точка сохранения — закладка в черновике: можно вырвать страницы после закладки, не трогая начало."),
      diagram(
        `
        Без транзакции (автокоммит):             В транзакции:

        UPDATE −700 (Анна)    ✓ зафиксировано    BEGIN
        UPDATE +700 (Борис)   ✗ ошибка           UPDATE −700 (Анна)      ┐ черновик,
                                                 UPDATE +700 (Борис) ✗   ┘ виден только нам
        Итог: 800 — 700 «исчезли»                ROLLBACK
                                                 Итог: 1500 — всё как было
        `,
        "Автокоммит фиксирует каждую команду отдельно; транзакция отменяет всю группу.",
      ),
      h("Жизненный цикл транзакции"),
      steps(
        [
          ["`BEGIN`", "Открывает транзакцию; последующие команды выполняются внутри неё."],
          ["Команды", "Изменения видны только этой транзакции; ограничения проверяются сразу (или при `COMMIT` для отложенных)."],
          ["`SAVEPOINT` (необязательно)", "Закладка для частичного отката."],
          ["Ошибка", "В PostgreSQL транзакция переходит в состояние «прервана»: допустимы только `ROLLBACK` и откат к точке сохранения."],
          ["`COMMIT` или `ROLLBACK`", "Зафиксировать всё или отменить всё; блокировки снимаются."],
        ],
        "Как идёт транзакция",
      ),
    ]),

    section("technical", [
      h("Команды управления транзакциями"),
      table(
        ["Команда", "Действие", "Примечание"],
        [
          ["`BEGIN` / `START TRANSACTION`", "Начать транзакцию", "Режим изоляции задаётся здесь же (`BEGIN ISOLATION LEVEL …`)"],
          ["`COMMIT`", "Зафиксировать", "Для прерванной транзакции в PostgreSQL выполняется как `ROLLBACK`"],
          ["`ROLLBACK`", "Отменить", "Откатывает все изменения транзакции"],
          ["`SAVEPOINT имя`", "Поставить точку", "Допускается несколько, с разными именами"],
          ["`ROLLBACK TO SAVEPOINT имя`", "Откат до точки", "Точка остаётся, более поздние уничтожаются; транзакция продолжается"],
          ["`RELEASE SAVEPOINT имя`", "Забыть точку", "Изменения остаются в транзакции"],
        ],
        "Управление транзакциями",
      ),
      h("ACID на практике"),
      table(
        ["Свойство", "Что обеспечивает", "Как проверить в этой теме"],
        [
          ["Atomicity", "Все команды или ни одной", "Откат перевода возвращает 1000; ошибка на втором шаге отменяет первый"],
          ["Consistency", "Ограничения не нарушаются", "`CHECK (balance >= 0)` отклонил перевод 5000, сумма осталась 1500"],
          ["Isolation", "Транзакции не мешают друг другу", "Подробно — в теме об уровнях изоляции"],
          ["Durability", "Подтверждённое не теряется", "Журнал WAL; `synchronous_commit = on` по умолчанию"],
        ],
        "Свойства ACID",
      ),
      h("Правила работы"),
      ul(
        "**Автокоммит по умолчанию:** команда вне `BEGIN` — своя транзакция (в `psql` и в большинстве драйверов).",
        "**Транзакции не вложены:** в PostgreSQL вложенного `BEGIN` нет — для частичного отката служат точки сохранения.",
        "**Одна команда атомарна:** `UPDATE`, затронувший много строк, либо изменяет все, либо ни одной.",
        "**Держите транзакции короткими:** не оставляйте открытыми «на время» ожидания пользователя или внешнего сервиса.",
        "**Ошибки обрабатывайте:** при сбое — `ROLLBACK` и, если это допустимо, повтор.",
      ),
      warn("Эффекты вне базы (письмо, платёж во внешней системе) транзакцией базы не откатываются. Для них нужен отдельный механизм согласования (очередь с повторами, исходящие сообщения)."),
    ]),

    section("syntax", [
      p("Перевод денег: две команды внутри явной транзакции и проверка, что сумма осталась прежней."),
      annotated(
        "sql",
        `-- Перевод 300 с одного счёта на другой: два изменения — одна транзакция
CREATE TABLE accounts (id integer PRIMARY KEY, owner text NOT NULL, balance integer NOT NULL CHECK (balance >= 0));
INSERT INTO accounts VALUES (1, 'Анна', 1000), (2, 'Борис', 500);

BEGIN;
UPDATE accounts SET balance = balance - 300 WHERE id = 1;
UPDATE accounts SET balance = balance + 300 WHERE id = 2;
COMMIT;

SELECT id, owner, balance, sum(balance) OVER () AS total FROM accounts ORDER BY id;`,
        [
          { line: 1, text: "Комментарий называет операцию: два изменения — одна логическая операция." },
          { line: [2, 3], text: "Счета с ограничением `CHECK (balance >= 0)`: оно защищает согласованность — нельзя уйти в минус." },
          { line: 5, text: "`BEGIN` открывает транзакцию: дальнейшие изменения видны только нам до `COMMIT`." },
          { line: [6, 7], text: "Два `UPDATE`: списание и зачисление. По отдельности каждое нарушает баланс «всего денег»." },
          { line: 8, text: "`COMMIT` фиксирует оба изменения разом; при ошибке вместо него был бы `ROLLBACK`." },
          { line: 10, text: "Проверка: баланс Анны 700, Бориса 800, а сумма `total` осталась 1500." },
        ],
        "01-transfer.sql",
      ),
      code("text", ` id | owner | balance | total 
----+-------+---------+-------
  1 | Анна  |     700 |  1500
  2 | Борис |     800 |  1500
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
    ]),

    section("minimal-example", [
      p("Откат отменяет изменения транзакции целиком. Внутри транзакции мы видим собственные изменения, а после `ROLLBACK` их как будто не было."),
      code("sql", `CREATE TABLE accounts (id integer PRIMARY KEY, owner text NOT NULL, balance integer NOT NULL);
INSERT INTO accounts VALUES (1, 'Анна', 1000), (2, 'Борис', 500);

BEGIN;
UPDATE accounts SET balance = balance - 300 WHERE id = 1;
-- Внутри транзакции мы видим собственное изменение
SELECT 'внутри транзакции' AS moment, balance FROM accounts WHERE id = 1;
ROLLBACK;
SELECT 'после ROLLBACK' AS moment, balance FROM accounts WHERE id = 1;`, { filename: "02-rollback.sql", runnable: true }),
      code("text", `      moment       | balance 
-------------------+---------
 внутри транзакции |     700
(1 row)

     moment     | balance 
----------------+---------
 после ROLLBACK |    1000
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Внутри транзакции баланс 700 (мы видим свои изменения), после отката — исходные 1000. Теперь частичный откат: точки сохранения."),
      code("sql", `-- Точки сохранения: откат части транзакции без потери остального
CREATE TABLE log (id integer PRIMARY KEY, note text NOT NULL);

BEGIN;
INSERT INTO log VALUES (1, 'начало');
SAVEPOINT step1;
INSERT INTO log VALUES (2, 'шаг 1');
SAVEPOINT step2;
INSERT INTO log VALUES (3, 'шаг 2');
ROLLBACK TO SAVEPOINT step1;        -- отменены 'шаг 1' и 'шаг 2'
INSERT INTO log VALUES (4, 'шаг 1 заново');
COMMIT;

SELECT id, note FROM log ORDER BY id;`, { filename: "03-savepoint.sql", runnable: true }),
      code("text", ` id |     note     
----+--------------
  1 | начало
  4 | шаг 1 заново
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`ROLLBACK TO SAVEPOINT step1` отменил `шаг 1` и `шаг 2` (всё, что было после точки), `начало` осталось; после этого транзакция продолжилась и зафиксировала `шаг 1 заново`."),
    ]),

    section("detailed-example", [
      h("Ошибка внутри транзакции"),
      code("sql", `CREATE TABLE accounts (id integer PRIMARY KEY, owner text NOT NULL, balance integer NOT NULL CHECK (balance >= 0));
INSERT INTO accounts VALUES (1, 'Анна', 1000), (2, 'Борис', 500);

BEGIN;
UPDATE accounts SET balance = balance - 5000 WHERE id = 1;   -- нарушает CHECK
UPDATE accounts SET balance = balance + 5000 WHERE id = 2;   -- уже после ошибки
COMMIT;

SELECT id, owner, balance FROM accounts ORDER BY id;`, { filename: "04-abort.pg.sql" }),
      code("text", `CREATE TABLE
INSERT 0 2
BEGIN
ERROR:  new row for relation "accounts" violates check constraint "accounts_balance_check"
DETAIL:  Failing row contains (1, Анна, -4000).
ERROR:  current transaction is aborted, commands ignored until end of transaction block
ROLLBACK
 id | owner | balance 
----+-------+---------
  1 | Анна  |    1000
  2 | Борис |     500
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Первое списание нарушило `CHECK` — ошибка `new row … violates check constraint`.",
        "Вторая команда не выполнилась: `current transaction is aborted, commands ignored until end of transaction block`.",
        "`COMMIT` в прерванной транзакции вернул тег `ROLLBACK`: PostgreSQL не подтвердил ничего. Балансы остались 1000 и 500.",
      ),
      h("Автокоммит против одной транзакции"),
      code("sql", `-- Перевод 700: у Бориса лимит остатка 1000, поэтому второе изменение нарушит CHECK
CREATE TABLE accounts (id integer PRIMARY KEY, owner text NOT NULL, balance integer NOT NULL CHECK (balance >= 0 AND balance <= 1000));
INSERT INTO accounts VALUES (1, 'Анна', 1000), (2, 'Борис', 500);

-- Без BEGIN каждая команда — отдельная транзакция
UPDATE accounts SET balance = balance - 700 WHERE id = 1;
UPDATE accounts SET balance = balance + 700 WHERE id = 2;
SELECT 'автокоммит' AS mode, sum(balance) AS total FROM accounts;

UPDATE accounts SET balance = 1000 WHERE id = 1;
UPDATE accounts SET balance = 500  WHERE id = 2;

-- В одной транзакции вторая ошибка отменяет и первое изменение
BEGIN;
UPDATE accounts SET balance = balance - 700 WHERE id = 1;
UPDATE accounts SET balance = balance + 700 WHERE id = 2;
COMMIT;
SELECT 'одна транзакция' AS mode, sum(balance) AS total FROM accounts;`, { filename: "05-autocommit.pg.sql" }),
      code("text", `CREATE TABLE
INSERT 0 2
UPDATE 1
ERROR:  new row for relation "accounts" violates check constraint "accounts_balance_check"
DETAIL:  Failing row contains (2, Борис, 1200).
    mode    | total 
------------+-------
 автокоммит |   800
(1 row)

UPDATE 1
UPDATE 1
BEGIN
UPDATE 1
ERROR:  new row for relation "accounts" violates check constraint "accounts_balance_check"
DETAIL:  Failing row contains (2, Борис, 1200).
ROLLBACK
      mode       | total 
-----------------+-------
 одна транзакция |  1500
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Без `BEGIN` списание 700 у Анны зафиксировалось сразу, а зачисление Борису нарушило лимит: итог 800 — 700 «исчезли». Тот же перевод в одной транзакции: ошибка второго шага отменила первый, итог 1500."),
      h("Откат к точке после ошибки"),
      code("sql", `-- После ошибки PostgreSQL помечает транзакцию как прерванную; откат к точке сохранения возвращает её в рабочее состояние
CREATE TABLE tags (name text PRIMARY KEY);

BEGIN;
INSERT INTO tags VALUES ('sql');
SAVEPOINT try_insert;
INSERT INTO tags VALUES ('sql');            -- дубль: ошибка
ROLLBACK TO SAVEPOINT try_insert;           -- транзакция снова рабочая
INSERT INTO tags VALUES ('git');
COMMIT;

SELECT name FROM tags ORDER BY name;`, { filename: "14-savepoint-recover.pg.sql" }),
      code("text", `CREATE TABLE
BEGIN
INSERT 0 1
SAVEPOINT
ERROR:  duplicate key value violates unique constraint "tags_pkey"
DETAIL:  Key (name)=(sql) already exists.
ROLLBACK
INSERT 0 1
COMMIT
 name 
------
 git
 sql
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Дубль вызвал ошибку, но `ROLLBACK TO SAVEPOINT` вернул транзакцию в рабочее состояние: `INSERT` и `COMMIT` после него прошли, в таблице `git` и `sql`. Так делают «попытку с запасным вариантом» внутри одной транзакции."),
    ]),

    section("analysis", [
      table(
        ["Сценарий", "Результат (замер)", "Что показывает"],
        [
          ["Перевод 300 в транзакции", "700 + 800 = 1500", "Атомарность и сохранение суммы"],
          ["`ROLLBACK`", "1000 после отката", "Откат отменяет изменения"],
          ["Откат до `step1`", "`начало`, `шаг 1 заново`", "Частичный откат"],
          ["Ошибка в транзакции", "Команды игнорируются, `COMMIT` → `ROLLBACK`", "Прерванное состояние PostgreSQL"],
          ["Перевод в автокоммите с ошибкой на втором шаге", "Итог 800", "Потеря 700 без транзакции"],
          ["Тот же перевод в транзакции", "Итог 1500", "Атомарность спасает от потери"],
          ["Заказ с нехваткой товара", "Откат целиком, склад 6 и 1 после второго заказа", "Заказ и списание — одна операция"],
        ],
        "Что показали замеры PostgreSQL 16.14",
      ),
      h("Заказ и списание со склада"),
      p("Без транзакции в одном сценарии заказ записывается, а списание падает на `CHECK (qty >= 0)` — заказ остаётся «висеть» без списанного товара:"),
      code("sql", `-- Оформление заказа без транзакции: заказ записан, а списать со склада не удалось
CREATE TABLE stock (product_id integer PRIMARY KEY, qty integer NOT NULL CHECK (qty >= 0));
CREATE TABLE sales (id integer PRIMARY KEY, product_id integer NOT NULL REFERENCES stock (product_id), qty integer NOT NULL);
INSERT INTO stock VALUES (1, 5);

INSERT INTO sales VALUES (1, 1, 8);
UPDATE stock SET qty = qty - 8 WHERE product_id = 1;

SELECT (SELECT count(*) FROM sales) AS sales_rows, (SELECT qty FROM stock WHERE product_id = 1) AS stock_qty;`, { filename: "10-ex-fix.pg.sql" }),
      code("text", `CREATE TABLE
CREATE TABLE
INSERT 0 1
INSERT 0 1
ERROR:  new row for relation "stock" violates check constraint "stock_qty_check"
DETAIL:  Failing row contains (1, -3).
 sales_rows | stock_qty 
------------+-----------
          1 |         5
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Заказ сохранён (`sales_rows = 1`), а склад остался прежним (5): заказ на 8 штук оформлен при остатке 5. Это нарушение бизнес-инварианта: данные, которые база уже приняла, противоречат друг другу."),
    ]),

    section("internals", [
      h("Одна команда — одна транзакция"),
      code("sql", `-- Одна команда атомарна сама по себе: перевод одним UPDATE, без явного BEGIN
CREATE TABLE accounts (id integer PRIMARY KEY, owner text NOT NULL, balance integer NOT NULL CHECK (balance >= 0));
INSERT INTO accounts VALUES (1, 'Анна', 1000), (2, 'Борис', 500);

UPDATE accounts SET balance = balance + CASE id WHEN 1 THEN -300 ELSE 300 END WHERE id IN (1, 2);

SELECT id, owner, balance FROM accounts ORDER BY id;`, { filename: "08-single-statement.sql", runnable: true }),
      code("text", ` id | owner | balance 
----+-------+---------
  1 | Анна  |     700
  2 | Борис |     800
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Один `UPDATE` с `CASE` перевёл деньги без явного `BEGIN`: команда атомарна — обе строки изменены или ни одной. Когда операция укладывается в один оператор, это самый короткий путь к атомарности."),
      h("Транзакционный DDL"),
      code("sql", `-- В PostgreSQL DDL тоже транзакционен
BEGIN;
CREATE TABLE temp_report (id integer);
INSERT INTO temp_report VALUES (1);
SELECT count(*) AS rows_inside FROM temp_report;
ROLLBACK;
SELECT to_regclass('temp_report') AS table_after_rollback;`, { filename: "06-ddl.pg.sql" }),
      code("text", `BEGIN
CREATE TABLE
INSERT 0 1
 rows_inside 
-------------
           1
(1 row)

ROLLBACK
 table_after_rollback 
----------------------
 
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("В PostgreSQL `CREATE TABLE` откатывается вместе с остальным: `to_regclass` после `ROLLBACK` вернул `NULL`. Это позволяет выполнять миграции схемы атомарно: если на пятом шаге ошибка, первые четыре отменяются."),
      h("Долговечность и журнал WAL"),
      code("sql", `-- Долговечность: фиксированные изменения записываются в журнал WAL, позиция записи в журнале растёт
SHOW synchronous_commit;
SHOW default_transaction_isolation;

CREATE TABLE t (id integer);
SELECT pg_current_wal_lsn() AS lsn_before \\gset
INSERT INTO t SELECT g FROM generate_series(1, 1000) AS g;
SELECT pg_current_wal_lsn() > :'lsn_before'::pg_lsn AS wal_advanced;`, { filename: "07-wal.pg.sql" }),
      code("text", ` synchronous_commit 
--------------------
 on
(1 row)

 default_transaction_isolation 
-------------------------------
 read committed
(1 row)

CREATE TABLE
INSERT 0 1000
 wal_advanced 
--------------
 t
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Изменения сначала записываются в журнал WAL (позиция `pg_current_wal_lsn()` выросла), а в файлы данных — позже, фоновым процессом.",
        "`synchronous_commit = on` (значение по умолчанию): `COMMIT` возвращается после того, как запись журнала сброшена на диск.",
        "После сбоя сервер воспроизводит журнал и восстанавливает подтверждённые транзакции; неподтверждённые отбрасываются.",
        "Параметр `fsync` по умолчанию включён: его выключение ускоряет запись ценой потери данных при сбое и допустимо лишь для временных тестовых баз.",
      ),
      h("Согласованность — это ограничения и вы"),
      p("Согласованность в ACID — не магия: база гарантирует только те инварианты, которые описаны ограничениями (`CHECK`, `FOREIGN KEY`, `UNIQUE`, `NOT NULL`). Правило «заказ не больше остатка» работает, потому что у склада есть `CHECK (qty >= 0)`; правило, существующее лишь в коде приложения, транзакция не защитит."),
    ]),

    section("mistakes", [
      h("Ошибка: несколько команд без транзакции"),
      wrongRight(
        "sql",
        { title: "Автокоммит", code: `UPDATE accounts SET balance = balance - 700 WHERE id = 1;\nUPDATE accounts SET balance = balance + 700 WHERE id = 2;`, note: "Если вторая команда упадёт, первая уже зафиксирована: 700 «исчезли» (замер: итог 800 вместо 1500)." },
        { title: "Одна транзакция", code: `BEGIN;\nUPDATE accounts SET balance = balance - 700 WHERE id = 1;\nUPDATE accounts SET balance = balance + 700 WHERE id = 2;\nCOMMIT;`, note: "Ошибка второго шага откатывает и первый: итог остаётся 1500." },
      ),
      h("Ошибка: продолжать после ошибки в PostgreSQL"),
      p("После ошибки транзакция «прервана»: все команды игнорируются до `ROLLBACK`. Драйвер, который ловит ошибку и продолжает «как ни в чём не бывало», получит `current transaction is aborted…`. Нужен `ROLLBACK` (или `ROLLBACK TO SAVEPOINT`, если точка поставлена заранее)."),
      h("Ошибка: долгая транзакция"),
      p("Открытая транзакция держит блокировки и версии строк. Ожидание ответа пользователя или внешнего API внутри `BEGIN … COMMIT` блокирует других и раздувает таблицы. Внешние вызовы — до или после транзакции."),
      h("Ошибка: рассчитывать, что транзакция откатит внешние эффекты"),
      p("Отправленное письмо, списанная на стороне платёжной системы сумма и записанный файл транзакцией базы не отменяются. Используйте шаблон «исходящих сообщений» (запись в таблицу в той же транзакции и отправка после фиксации) и идемпотентные операции."),
      h("Ошибка: не проверять результат команды"),
      p("`UPDATE … WHERE balance >= 300` может затронуть 0 строк — это не ошибка. Приложение (или процедура: `IF NOT FOUND THEN RAISE EXCEPTION`) обязано проверить число затронутых строк и откатить операцию."),
      h("Ошибка: путать ROLLBACK и откат до точки"),
      p("`ROLLBACK` завершает транзакцию целиком. `ROLLBACK TO SAVEPOINT` оставляет её открытой и сохраняет точку — транзакцию всё равно нужно закончить `COMMIT` или `ROLLBACK`."),
    ]),

    section("antipatterns", [
      ul(
        "**Транзакция на всё приложение** (открыта всю сессию пользователя).",
        "**Ручная «компенсация» вместо отката:** приложение само «возвращает деньги» после сбоя.",
        "**Игнорирование ошибки внутри транзакции** без `ROLLBACK`.",
        "**Блокирующие внешние вызовы внутри транзакции.**",
        "**`COMMIT` в цикле построчно** для операции, которая должна быть атомарной.",
        "**Отключение `fsync` и `synchronous_commit` «для скорости»** на данных, которые нельзя потерять.",
        "**Бизнес-инвариант без ограничения в схеме** (транзакция защищает только то, что база умеет проверить).",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Операцию из нескольких команд — в одну транзакцию;** по возможности — в одну команду.",
        "**Описывайте инварианты ограничениями** (`CHECK`, `FOREIGN KEY`): тогда ошибка сама откатит транзакцию.",
        "**Держите транзакции короткими;** внешние вызовы — снаружи.",
        "**Проверяйте число затронутых строк** и явно откатывайте при нарушении бизнес-условия.",
        "**Используйте `SAVEPOINT`** для «попыток» внутри длинной транзакции.",
        "**В приложении гарантируйте `ROLLBACK`** в блоке обработки ошибок (`try/finally`).",
        "**Миграции схемы — в транзакции,** если СУБД поддерживает транзакционный DDL.",
        "**Не отключайте механизмы долговечности** на боевых данных.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Неявные фиксации:** в некоторых СУБД DDL и отдельные команды завершают транзакцию неявно; в PostgreSQL DDL транзакционен (замер), но отдельные операции (`CREATE INDEX CONCURRENTLY`, `VACUUM`) вне транзакции.",
        "**Отложенные ограничения:** `DEFERRABLE INITIALLY DEFERRED` проверяются при `COMMIT`; ошибка возникает на последней команде.",
        "**Транзакция только для чтения:** `BEGIN READ ONLY` запрещает изменения и даёт согласованный снимок для отчётов.",
        "**Сбой соединения:** незавершённая транзакция откатывается сервером; приложение должно уметь безопасно повторить операцию (идемпотентность).",
        "**Двухфазная фиксация (`PREPARE TRANSACTION`)** нужна для распределённых транзакций между несколькими системами.",
        "**SQLite:** транзакции поддерживаются (включая транзакционный DDL), запись одна за раз; в песочнице курса можно запускать `BEGIN`, `SAVEPOINT`, `ROLLBACK`.",
      ),
    ]),

    section("related", [
      ul(
        "[INSERT, UPDATE, DELETE](/learn/sql/insert-update-delete) — команды, которые объединяют в транзакции.",
        "[Ключи и ограничения](/learn/sql/keys-constraints) — инварианты, на которых держится согласованность.",
        "[Связи между таблицами](/learn/sql/relationships) — внешние ключи и ссылочная целостность.",
        "[Уровни изоляции](/learn/sql/isolation-levels) — что видят параллельные транзакции.",
        "[Блокировки и взаимоблокировки](/learn/sql/locking-deadlocks) — цена долгих транзакций.",
        "[Миграции и безопасный DDL](/learn/sql/migrations-safe-ddl) — транзакционный DDL на практике.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Оформление заказа без транзакции",
          code: `
            INSERT INTO sales VALUES (1, 1, 8);
            UPDATE stock SET qty = qty - 8 WHERE product_id = 1;
          `,
          note: "Первая команда зафиксирована, вторая упала на `CHECK (qty >= 0)`: заказ есть, товар не списан (`sales_rows = 1`, склад 5).",
        },
        {
          title: "Одна транзакция",
          code: `
            BEGIN;
            INSERT INTO sales VALUES (1, 1, 8);
            UPDATE stock SET qty = qty - 8 WHERE product_id = 1;
            COMMIT;
          `,
          note: "Ошибка списания откатила заказ: `sales_rows = 0`, склад 5; нехватка товара — это отказ в заказе, а не «битые» данные.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.acid-transactions.ex1",
      title: "Что останется после точек сохранения",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская, определите, какие значения окажутся в таблице после транзакции. Обратите внимание на порядок точек и на то, что откат идёт к точке `a`."),
        code("sql", `CREATE TABLE t (x integer PRIMARY KEY);

BEGIN;
INSERT INTO t VALUES (1);
SAVEPOINT a;
INSERT INTO t VALUES (2);
SAVEPOINT b;
INSERT INTO t VALUES (3);
ROLLBACK TO a;
INSERT INTO t VALUES (4);
COMMIT;

SELECT x FROM t ORDER BY x;`, { filename: "09-ex-predict.sql", runnable: true }),
      ],
      hints: ["Что отменяет `ROLLBACK TO a`: вставки до или после точки?", "Сохраняется ли строка `1`, вставленная до точки `a`?"],
      checks: ["Остались `1` и `4`", "Вставки `2` и `3` отменены"],
      solution: [
        code("text", ` x 
---
 1
 4
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Точка `a` стоит после вставки `1`. `ROLLBACK TO a` отменил всё, что было позже — вставки `2` и `3` (и точку `b`). Затем вставили `4` и зафиксировали: остались `1` и `4`."),
      ],
    }),
    exercise({
      id: "sql.acid-transactions.ex2",
      title: "Заказ без товара на складе",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Заказ на 8 штук записывается, хотя на складе 5, а списание падает с ошибкой. Исправьте так, чтобы при ошибке списания заказ тоже не сохранялся."),
        code("sql", `-- Оформление заказа без транзакции: заказ записан, а списать со склада не удалось
CREATE TABLE stock (product_id integer PRIMARY KEY, qty integer NOT NULL CHECK (qty >= 0));
CREATE TABLE sales (id integer PRIMARY KEY, product_id integer NOT NULL REFERENCES stock (product_id), qty integer NOT NULL);
INSERT INTO stock VALUES (1, 5);

INSERT INTO sales VALUES (1, 1, 8);
UPDATE stock SET qty = qty - 8 WHERE product_id = 1;

SELECT (SELECT count(*) FROM sales) AS sales_rows, (SELECT qty FROM stock WHERE product_id = 1) AS stock_qty;`, { filename: "10-ex-fix.pg.sql" }),
      ],
      hints: ["Сколько транзакций у двух команд без `BEGIN`?", "Что произойдёт с первой командой, если вторая нарушит `CHECK`?"],
      checks: ["Обе команды в `BEGIN … COMMIT`", "Результат: заказов 0, склад 5"],
      solution: [
        code("sql", `CREATE TABLE stock (product_id integer PRIMARY KEY, qty integer NOT NULL CHECK (qty >= 0));
CREATE TABLE sales (id integer PRIMARY KEY, product_id integer NOT NULL REFERENCES stock (product_id), qty integer NOT NULL);
INSERT INTO stock VALUES (1, 5);

BEGIN;
INSERT INTO sales VALUES (1, 1, 8);
UPDATE stock SET qty = qty - 8 WHERE product_id = 1;
COMMIT;

SELECT (SELECT count(*) FROM sales) AS sales_rows, (SELECT qty FROM stock WHERE product_id = 1) AS stock_qty;`, { filename: "11-fix-solution.pg.sql" }),
        code("text", `CREATE TABLE
CREATE TABLE
INSERT 0 1
BEGIN
INSERT 0 1
ERROR:  new row for relation "stock" violates check constraint "stock_qty_check"
DETAIL:  Failing row contains (1, -3).
ROLLBACK
 sales_rows | stock_qty 
------------+-----------
          0 |         5
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("В автокоммите `INSERT` фиксировался сам по себе. В транзакции ошибка `UPDATE` перевела её в прерванное состояние, а `COMMIT` превратился в `ROLLBACK`: заказов 0, склад не тронут (5). Нехватка товара теперь означает отказ, а не «битые» данные."),
      ],
    }),
    exercise({
      id: "sql.acid-transactions.ex3",
      title: "Перевод с проверкой остатка",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Напишите процедуру `transfer(from_id, to_id, amount)`, которая списывает сумму только при достаточном остатке, зачисляет её получателю и **целиком отменяется**, если денег не хватает. Проверьте переводом 300 (успех) и 5000 (отказ); общая сумма должна остаться 1500."),
      ],
      hints: ["Как узнать, что `UPDATE ... WHERE balance >= amount` ничего не изменил?", "Что делает `RAISE EXCEPTION` внутри процедуры с её изменениями?"],
      checks: ["`UPDATE ... WHERE balance >= amount` и `IF NOT FOUND THEN RAISE EXCEPTION`", "После 300: 700 и 800; перевод 5000 отклонён, сумма 1500"],
      solution: [
        code("sql", `CREATE TABLE accounts (id integer PRIMARY KEY, owner text NOT NULL, balance integer NOT NULL CHECK (balance >= 0));
INSERT INTO accounts VALUES (1, 'Анна', 1000), (2, 'Борис', 500);

-- Перевод с проверкой остатка: вызов процедуры выполняется как одна команда — целиком или никак
CREATE PROCEDURE transfer(from_id integer, to_id integer, amount integer) LANGUAGE plpgsql AS $$
BEGIN
  UPDATE accounts SET balance = balance - amount WHERE id = from_id AND balance >= amount;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'недостаточно средств на счёте %', from_id;
  END IF;
  UPDATE accounts SET balance = balance + amount WHERE id = to_id;
END $$;

CALL transfer(1, 2, 300);
CALL transfer(1, 2, 5000);
SELECT id, owner, balance, sum(balance) OVER () AS total FROM accounts ORDER BY id;`, { filename: "12-transfer-do.pg.sql", lineNumbers: true }),
        code("text", `CREATE TABLE
INSERT 0 2
CREATE PROCEDURE
CALL
ERROR:  недостаточно средств на счёте 1
CONTEXT:  PL/pgSQL function transfer(integer,integer,integer) line 5 at RAISE
 id | owner | balance | total 
----+-------+---------+-------
  1 | Анна  |     700 |  1500
  2 | Борис |     800 |  1500
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Условие `balance >= amount` в `UPDATE` делает проверку остатка и списание одним действием (без гонки между `SELECT` и `UPDATE`). Если ни одна строка не обновлена (`NOT FOUND`), `RAISE EXCEPTION` отменяет всё, что процедура сделала; перевод 300 прошёл, а перевод 5000 отклонён с сообщением, итог 1500."),
      ],
    }),
  ],

  challenge: {
    id: "sql.acid-transactions.challenge",
    title: "Оформление заказа: либо всё, либо ничего",
    scenario: [
      p("Магазин оформляет заказ из нескольких позиций и списывает товар со склада. Если хотя бы одной позиции не хватает, заказ не должен появиться в системе, а склад — измениться."),
    ],
    requirements: [
      "Таблицы `stock`, `sales`, `sale_lines` с ограничениями: остаток не отрицателен, количество позиции положительно",
      "Каждый заказ оформляется в одной транзакции: запись заказа, позиций и списание",
      "Первый заказ (кофе 4 шт, чай 5 шт при остатке чая 3) должен откатиться целиком",
      "Второй заказ (кофе 4 шт, чай 2 шт) проходит целиком",
    ],
    constraints: [
      "Откат вызывается нарушением ограничения, а не проверкой в приложении",
      "Заказы не пересекаются по времени (один сеанс)",
    ],
    acceptance: [
      "В `sales` одна строка (Борис), в `sale_lines` — две",
      "Склад: кофе 6, чай 1",
    ],
    hints: [
      "Нехватка чая нарушит `CHECK (qty >= 0)` на втором `UPDATE` первого заказа.",
      "После ошибки команды транзакции игнорируются, а `COMMIT` превращается в `ROLLBACK`.",
    ],
    solution: [
      code("sql", `-- Оформление заказа с резервированием склада: либо всё, либо ничего
CREATE TABLE stock (product_id integer PRIMARY KEY, title text NOT NULL, qty integer NOT NULL CHECK (qty >= 0));
CREATE TABLE sales (id integer PRIMARY KEY, customer text NOT NULL);
CREATE TABLE sale_lines (
  sale_id    integer NOT NULL REFERENCES sales (id),
  product_id integer NOT NULL REFERENCES stock (product_id),
  qty        integer NOT NULL CHECK (qty > 0),
  PRIMARY KEY (sale_id, product_id)
);
INSERT INTO stock VALUES (1, 'Кофе', 10), (2, 'Чай', 3);

-- Заказ 1: кофе 4 шт и чая 5 шт (на складе 3) — вторая позиция нарушит CHECK, откатится всё
BEGIN;
INSERT INTO sales VALUES (1, 'Анна');
INSERT INTO sale_lines VALUES (1, 1, 4), (1, 2, 5);
UPDATE stock SET qty = qty - 4 WHERE product_id = 1;
UPDATE stock SET qty = qty - 5 WHERE product_id = 2;
COMMIT;

-- Заказ 2: кофе 4 шт и чая 2 шт — проходит целиком
BEGIN;
INSERT INTO sales VALUES (2, 'Борис');
INSERT INTO sale_lines VALUES (2, 1, 4), (2, 2, 2);
UPDATE stock SET qty = qty - 4 WHERE product_id = 1;
UPDATE stock SET qty = qty - 2 WHERE product_id = 2;
COMMIT;

SELECT (SELECT count(*) FROM sales) AS sales, (SELECT count(*) FROM sale_lines) AS lines;
SELECT product_id, title, qty FROM stock ORDER BY product_id;`, { filename: "13-challenge.pg.sql", lineNumbers: true }),
      code("text", `CREATE TABLE
CREATE TABLE
CREATE TABLE
INSERT 0 2
BEGIN
INSERT 0 1
INSERT 0 2
UPDATE 1
ERROR:  new row for relation "stock" violates check constraint "stock_qty_check"
DETAIL:  Failing row contains (2, Чай, -2).
ROLLBACK
BEGIN
INSERT 0 1
INSERT 0 2
UPDATE 1
UPDATE 1
COMMIT
 sales | lines 
-------+-------
     1 |     2
(1 row)

 product_id | title | qty 
------------+-------+-----
          1 | Кофе  |   6
          2 | Чай   |   1
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Первый заказ: две вставки и первое списание прошли, второе списание нарушило `CHECK` — транзакция отменена целиком, `ROLLBACK` вернул базу к исходному состоянию. Второй заказ прошёл целиком (`COMMIT`). Итог: одна строка в `sales`, две в `sale_lines`, склад кофе 6, чай 1. Ограничение в схеме превратило нехватку товара в откат без единой проверки в приложении."),
    ],
  },

  interview: [
    iq("sql.acid-transactions.i1", "basic", "Что такое транзакция и зачем она нужна?", [
      ul(
        "Группа операций, выполняемая как неделимое целое: фиксируется (`COMMIT`) или отменяется (`ROLLBACK`) целиком.",
        "Нужна для бизнес-операций из нескольких команд (перевод, заказ со списанием): при сбое данные не остаются «полуготовыми».",
        "Пример замера: перевод в транзакции — 700 + 800 = 1500; без транзакции при ошибке на втором шаге итог 800.",
      ),
    ]),
    iq("sql.acid-transactions.i2", "basic", "Расшифруйте ACID.", [
      ul(
        "Atomicity — всё или ничего; Consistency — ограничения сохраняются; Isolation — параллельные транзакции не мешают друг другу; Durability — подтверждённое не теряется.",
        "Consistency обеспечивается ограничениями схемы: база гарантирует то, что описано.",
        "Isolation настраивается уровнем изоляции; Durability держится на журнале WAL.",
      ),
    ]),
    iq("sql.acid-transactions.i3", "intermediate", "Что делает PostgreSQL после ошибки внутри транзакции?", [
      ul(
        "Помечает транзакцию как прерванную: команды игнорируются (`current transaction is aborted…`).",
        "`COMMIT` в такой транзакции выполняется как `ROLLBACK` (замер: тег `ROLLBACK`).",
        "Выход: `ROLLBACK` или `ROLLBACK TO SAVEPOINT` к ранее поставленной точке.",
      ),
    ]),
    iq("sql.acid-transactions.i4", "intermediate", "Для чего нужны SAVEPOINT?", [
      ul(
        "Для частичного отката: `ROLLBACK TO SAVEPOINT` отменяет только то, что было после точки, транзакция продолжается.",
        "Позволяют делать «попытку» внутри транзакции и откатить неудачную часть (в замере дубль — ошибка, откат к точке, затем успешная вставка).",
        "Вложенных транзакций в PostgreSQL нет — точки сохранения их заменяют.",
      ),
    ]),
    iq("sql.acid-transactions.i5", "intermediate", "Что такое автокоммит и чем он опасен?", [
      ul(
        "Каждая команда вне `BEGIN` — своя транзакция, фиксируемая немедленно.",
        "Опасен для операций из нескольких команд: ошибка на втором шаге оставляет зафиксированным первый (замер: итог 800 вместо 1500).",
        "Решение: явный `BEGIN … COMMIT` вокруг связанных команд или одна команда, если она выражает операцию целиком.",
      ),
    ]),
    iq("sql.acid-transactions.i6", "advanced", "Как транзакции обеспечивают долговечность?", [
      ul(
        "Изменения сначала записываются в журнал WAL; `COMMIT` возвращается после сброса записи журнала на диск (`synchronous_commit = on`).",
        "После сбоя журнал воспроизводится: подтверждённые транзакции восстанавливаются, неподтверждённые отбрасываются.",
        "Выключение `fsync` ускоряет запись, но рискует потерей данных при сбое.",
      ),
    ]),
    iq("sql.acid-transactions.i7", "advanced", "Транзакция откатилась, но письмо клиенту уже отправлено. Как проектировать такие операции?", [
      ul(
        "Эффекты вне базы транзакцией не отменяются; отправку выносят за пределы транзакции.",
        "Шаблон исходящих сообщений: в той же транзакции записываем событие в таблицу, после фиксации отдельный процесс отправляет и отмечает его.",
        "Отправка идемпотентна: повтор не должен приводить к дублю.",
        "Для распределённых операций — саги или двухфазная фиксация, если она оправдана.",
      ),
    ]),
    iq("sql.acid-transactions.i8", "engineering", "Как построить надёжную операцию «перевод денег» между двумя счетами в продакшене?", [
      ul(
        "Одна транзакция: проверка остатка и списание одной командой (`UPDATE … WHERE balance >= amount`), зачисление, запись в журнал операций.",
        "Инвариант `CHECK (balance >= 0)` в схеме — последняя линия защиты.",
        "Идемпотентность: уникальный идентификатор операции, чтобы повтор после сбоя не перевёл деньги дважды.",
        "Порядок блокировки счетов (по `id`) для защиты от взаимоблокировок и обработка ошибок сериализации повтором.",
        "Тесты: сбой между шагами, повторный запрос, параллельные переводы.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.acid-transactions.e1", "foundation", "Что означает буква A в ACID?", ["Availability", "Authority", "Atomicity — всё или ничего", "Accuracy"], 2, "Атомарность: все команды транзакции применяются или не применяется ни одна (замер: итог перевода 1500)."),
    mcq("sql.acid-transactions.e2", "foundation", "Что делает `ROLLBACK`?", ["Отменяет все изменения транзакции", "Фиксирует транзакцию", "Удаляет таблицу", "Закрывает соединение"], 0, "`ROLLBACK` возвращает данные к состоянию до `BEGIN`: в замере баланс вернулся к 1000."),
    mcq("sql.acid-transactions.e3", "foundation", "Что такое автокоммит?", ["Автоматическое резервное копирование", "Блокировка таблицы", "Откат при ошибке", "Каждая команда вне `BEGIN` — отдельная фиксируемая транзакция"], 3, "Без явной транзакции команда фиксируется сразу после выполнения, поэтому связанные команды не атомарны."),
    mcq("sql.acid-transactions.e4", "intermediate", "Что вернёт `COMMIT` в PostgreSQL после ошибки внутри транзакции?", ["`COMMIT`, изменения применены", "Тег `ROLLBACK`: изменения отменены", "Ошибку синтаксиса", "Ничего"], 1, "Транзакция прервана: PostgreSQL не подтверждает её, `COMMIT` отрабатывает как `ROLLBACK`."),
    mcq("sql.acid-transactions.e5", "intermediate", "Что останется в `log` после `BEGIN; INSERT 1; SAVEPOINT s; INSERT 2; ROLLBACK TO s; INSERT 3; COMMIT`?", ["1, 2, 3", "Ничего", "Только 3", "1 и 3"], 3, "`ROLLBACK TO s` отменил вставку 2 (после точки), вставка 1 была до неё; 3 добавлена после отката."),
    mcq("sql.acid-transactions.e6", "intermediate", "Какое свойство ACID обеспечивает журнал WAL?", ["Atomicity и Isolation", "Только Consistency", "Durability (долговечность)", "Ни одно"], 2, "Подтверждённая транзакция записана в журнал на диск и восстанавливается после сбоя."),
    mcq("sql.acid-transactions.e7", "advanced", "Почему `UPDATE accounts SET balance = balance - 300 WHERE id = 1 AND balance >= 300` лучше, чем `SELECT` остатка и затем `UPDATE`?", ["Он короче", "Проверка и списание происходят атомарно, без гонки между чтением и записью", "Он не требует транзакции", "Он быстрее на любых данных"], 1, "Между `SELECT` и `UPDATE` другой сеанс может изменить баланс; условие в `UPDATE` проверяет актуальное значение в момент записи."),
    open("sql.acid-transactions.e8", "intermediate", "Опишите, как оформить заказ из нескольких позиций со списанием со склада так, чтобы нехватка одной позиции отменяла весь заказ. Какие ограничения нужны в схеме?", [
      ul(
        "Одна транзакция: `BEGIN`; вставка заказа и позиций; `UPDATE stock SET qty = qty - n` для каждой позиции; `COMMIT`.",
        "`CHECK (qty >= 0)` на складе превращает нехватку в ошибку, которая откатывает всю транзакцию (в PostgreSQL `COMMIT` после ошибки — это `ROLLBACK`).",
        "`CHECK (qty > 0)` на позиции и внешние ключи заказа и товара.",
        "Приложение ловит ошибку, выполняет `ROLLBACK` и сообщает пользователю о нехватке; повтор безопасен.",
      ),
    ], ["Одна транзакция", "CHECK на складе", "Ограничения позиций", "Обработка ошибки"], { format: "architecture" }),
  ],

  mastery: [
    mcq("sql.acid-transactions.m1", "intermediate", "Итог перевода 700 без `BEGIN` при нарушении лимита на втором шаге (замер) — это…", ["800", "1500", "1000", "2200"], 0, "Первое изменение зафиксировано автокоммитом, второе отклонено: 700 «исчезли», сумма 800 вместо 1500."),
    mcq("sql.acid-transactions.m2", "advanced", "Что произойдёт при `RAISE EXCEPTION` внутри процедуры `transfer`?", ["Изменения процедуры сохранятся", "Откатится только последний `UPDATE`", "Все изменения команды вызова отменятся", "Соединение закроется"], 2, "Исключение отменяет всю команду `CALL`: в замере перевод 5000 не оставил следов, сумма 1500."),
    mcq("sql.acid-transactions.m3", "advanced", "Почему транзакцию нельзя держать открытой, пока пользователь заполняет форму?", ["Она держит блокировки и мешает очистке старых версий строк", "Это запрещено синтаксисом", "Откат станет невозможен", "База перезапустится"], 0, "Долгая транзакция блокирует других, раздувает таблицы и повышает риск конфликтов; внешние ожидания выносят за её пределы."),
    open("sql.acid-transactions.m4", "advanced", "После сбоя сервера клиент утверждает, что платёж прошёл, а в базе его нет. Как вы разберётесь и как исключите повторение?", [
      ul(
        "Выяснить, был ли `COMMIT` подтверждён клиенту: по журналам приложения и по таблице операций с уникальным идентификатором платежа.",
        "Если приложение не получило ответ, операция могла как зафиксироваться, так и откатиться: повтор выполняют идемпотентно (по тому же идентификатору операции).",
        "Проверить настройки долговечности (`fsync`, `synchronous_commit`) и репликации: при асинхронной репликации возможна потеря последних транзакций после отказа.",
        "Ввести идемпотентные операции, исходящие сообщения и сверку (reconciliation) с внешней системой.",
      ),
    ], ["Идемпотентность и идентификатор операции", "Диагностика по журналам", "Настройки долговечности", "Сверка"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.acid-transactions.f1", front: "ACID?", back: "Atomicity (всё или ничего), Consistency (ограничения), Isolation (параллельные не мешают), Durability (подтверждённое не теряется)." },
    { id: "sql.acid-transactions.f2", front: "BEGIN / COMMIT / ROLLBACK?", back: "BEGIN открывает, COMMIT фиксирует всё, ROLLBACK отменяет всё. Вне BEGIN каждая команда — своя транзакция (автокоммит)." },
    { id: "sql.acid-transactions.f3", front: "Ошибка в транзакции PostgreSQL?", back: "Транзакция прервана: команды игнорируются; COMMIT выполняется как ROLLBACK. Спасает ROLLBACK TO SAVEPOINT." },
    { id: "sql.acid-transactions.f4", front: "SAVEPOINT?", back: "Закладка внутри транзакции. ROLLBACK TO откатывает всё после неё, транзакция продолжается; вложенных транзакций нет." },
    { id: "sql.acid-transactions.f5", front: "Одна команда атомарна?", back: "Да: UPDATE затронет все строки или ни одной. Перевод между счетами можно выразить одним UPDATE с CASE." },
    { id: "sql.acid-transactions.f6", front: "WAL?", back: "Журнал упреждающей записи: изменения сначала в журнал, затем в данные; обеспечивает долговечность и восстановление." },
    { id: "sql.acid-transactions.f7", front: "DDL в транзакции?", back: "В PostgreSQL транзакционен: CREATE TABLE откатывается вместе с остальным." },
    { id: "sql.acid-transactions.f8", front: "Внешние эффекты?", back: "Письма и внешние платежи транзакцией не откатываются: исходящие сообщения, идемпотентность." },
  ],

  sources: [
    { title: "PostgreSQL 16: Transactions (tutorial)", url: "https://www.postgresql.org/docs/16/tutorial-transactions.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: BEGIN", url: "https://www.postgresql.org/docs/16/sql-begin.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: SAVEPOINT", url: "https://www.postgresql.org/docs/16/sql-savepoint.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Reliability and the Write-Ahead Log", url: "https://www.postgresql.org/docs/16/wal.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Asynchronous Commit (synchronous_commit)", url: "https://www.postgresql.org/docs/16/wal-async-commit.html", publisher: "PostgreSQL" },
    { title: "SQLite: Transaction", url: "https://www.sqlite.org/lang_transaction.html", publisher: "Other" },
  ],
};
