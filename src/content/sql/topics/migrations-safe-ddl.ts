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

export const migrationsSafeDdl: Topic = {
  id: "sql.migrations-safe-ddl",
  slug: "migrations-safe-ddl",
  domain: "sql",
  module: "production",
  title: "Миграции и безопасный DDL на живой базе",
  titleEn: "Migrations and Safe DDL on a Live Database",
  summary:
    "Миграция схемы на рабочей базе — это изменение под нагрузкой, при котором старая и новая версии приложения работают одновременно. Тема на замерах PostgreSQL 16.14: какие команды переписывают таблицу целиком (по смене файла данных `relfilenode`: `ADD COLUMN` без значения и с `DEFAULT 0` — нет; `DEFAULT random()`, `ALTER COLUMN … TYPE bigint` и `GENERATED … STORED` — да; `DROP COLUMN` — нет), какие блокировки берут команды (`ADD COLUMN` и `RENAME COLUMN` — `AccessExclusiveLock`, `ADD FOREIGN KEY … NOT VALID` — `ShareRowExclusiveLock`, `VALIDATE CONSTRAINT` — `ShareUpdateExclusiveLock`, `CREATE INDEX` — `ShareLock`), внешний ключ в два шага (`NOT VALID` пропустил старую «сироту», `VALIDATE` её нашёл), индекс `CONCURRENTLY`, оставшийся недействительным (`indisvalid = f`) после ошибки, заполнение пакетами (10 000 + 10 000 + 5000 строк), атомарная миграция (при ошибке на последнем шаге не осталось ни таблицы, ни записи о миграции) и переименование столбца по схеме «расширить — мигрировать — сузить» (0 расхождений при одновременной работе двух версий приложения).",
  minutes: 100,
  prerequisites: ["sql.acid-transactions", "sql.locking-deadlocks", "sql.relationships", "sql.indexes-btree"],
  tags: ["migration", "DDL", "ALTER TABLE", "lock_timeout", "NOT VALID", "VALIDATE CONSTRAINT", "CREATE INDEX CONCURRENTLY", "backfill", "expand and contract", "table rewrite", "relfilenode", "zero downtime", "schema_migrations", "transactional DDL"],
  keyConcepts: [
    { term: "Опасность миграции — блокировка и переписывание", text: "`ALTER COLUMN … TYPE bigint`, `GENERATED … STORED` и `DEFAULT random()` переписали таблицу (смена `relfilenode`); `ADD COLUMN` без значения и с `DEFAULT 0` — нет, `DROP COLUMN` — нет." },
    { term: "Блокировка зависит от команды", text: "`ADD COLUMN`, `RENAME COLUMN` — `AccessExclusiveLock`; `ADD FOREIGN KEY … NOT VALID` — `ShareRowExclusiveLock`; `VALIDATE CONSTRAINT` — только `ShareUpdateExclusiveLock` (не мешает записи); `CREATE INDEX` — `ShareLock` (блокирует запись)." },
    { term: "Внешний ключ — в два шага", text: "`NOT VALID` создаёт ограничение быстро и проверяет только новые записи (старая «сирота» допущена), `VALIDATE CONSTRAINT` проверяет существующие строки и на сирот отвечает ошибкой; после исправления данных — `convalidated = t`." },
    { term: "CONCURRENTLY может оставить недействительный индекс", text: "`CREATE UNIQUE INDEX CONCURRENTLY` при дубле завершился ошибкой и оставил индекс с `indisvalid = f`; его нужно удалить (`DROP INDEX CONCURRENTLY`) и создать заново." },
    { term: "Большие изменения данных — пакетами", text: "Заполнение нового столбца для 25 000 строк процедурой с `COMMIT` после каждого пакета: 10 000, 10 000, 5000; каждая транзакция короткая." },
    { term: "Расширить — мигрировать — сузить", text: "Новый столбец и триггер двойной записи, заполнение, переход приложений, удаление старого: при одновременной работе двух версий `out_of_sync = 0`; старое приложение после удаления столбца получает ошибку." },
  ],
  sections: [
    section("definition", [
      def("Миграция схемы", "Версионируемое изменение структуры базы (таблицы, столбцы, индексы, ограничения), применяемое по порядку и фиксируемое в таблице служебных записей; выполняется вместе с релизом приложения.", "schema migration"),
      def("Переписывание таблицы", "Операция, при которой СУБД создаёт новый файл данных и копирует в него все строки; требует времени, пропорционального размеру таблицы, и держит сильную блокировку.", "table rewrite"),
      def("NOT VALID", "Режим добавления ограничения (`CHECK`, внешний ключ), при котором проверяются только новые и изменяемые строки; существующие проверяются позже командой `VALIDATE CONSTRAINT`.", "NOT VALID constraint"),
      def("CONCURRENTLY", "Режим построения индекса без блокировки записи: дольше, нельзя внутри транзакции, при ошибке остаётся недействительный индекс.", "concurrent index build"),
      def("Заполнение (backfill)", "Массовое вычисление значений нового столбца для существующих строк; делается пакетами, чтобы не держать длинную транзакцию и блокировки.", "backfill"),
      def("Расширить — мигрировать — сузить", "Шаблон безопасных изменений: сначала совместимое расширение схемы (новый столбец), потом перенос данных и кода, и только затем удаление старого.", "expand / migrate / contract"),
      def("Совместимость версий", "Свойство схемы одновременно обслуживать старую и новую версии приложения (во время поэтапной выкладки и откатов).", "backward compatibility"),
    ]),

    section("why", [
      h("Миграция выполняется на живой системе"),
      p("В разработке изменение схемы — одна команда на пустой базе. В продакшене таблица содержит сотни миллионов строк, к ней одновременно обращаются десятки сервисов, а выкладка нового кода идёт поэтапно: какое-то время работают и старая, и новая версии приложения. Неосторожный `ALTER TABLE` может остановить все запросы к таблице на минуты, а удаление или переименование столбца — сломать старую версию кода. Безопасная миграция решает обе проблемы: короткие блокировки и совместимость на каждом шаге."),
      ul(
        "**Доступность:** миграция не должна останавливать чтение и запись.",
        "**Совместимость:** каждый шаг схемы допустим для старого и нового кода.",
        "**Обратимость:** откат шага возможен без потери данных.",
        "**Предсказуемость:** время и блокировки известны заранее, а не обнаруживаются в бою.",
      ),
      note("Правила этой темы подтверждены замерами PostgreSQL 16.14. В других СУБД блокировки и переписывание различаются: сверяйтесь с документацией вашей версии."),
    ]),

    section("mental-model", [
      h("Две ловушки: время под блокировкой и несовместимость версий"),
      p("У любой миграции два вопроса. Первый: **сколько времени и какую блокировку** команда держит на таблице? Если команда переписывает таблицу или сканирует её под сильной блокировкой, время пропорционально размеру таблицы. Второй: **что произойдёт со старым кодом**, который ещё работает во время выкладки? Если он обращается к столбцу, который уже удалён или переименован, будут ошибки. Безопасная миграция — серия мелких шагов, каждый из которых отвечает на оба вопроса: «быстро» и «совместимо»."),
      diagram(
        `
        Небезопасно (одним шагом)                 Безопасно (три релиза)

        ALTER TABLE users                         Релиз 1 — расширить:
          RENAME COLUMN fullname                    добавить display_name + триггер двойной записи
          TO display_name;                          (старый код продолжает работать)

        Старый код: ERROR column                  Релиз 2 — мигрировать:
        "fullname" does not exist                   заполнить display_name пакетами,
                                                    перевести код на новый столбец
        + AccessExclusiveLock
                                                  Релиз 3 — сузить:
                                                    убрать триггер и старый столбец
        `,
        "Переименование столбца — это три релиза, а не одна команда.",
      ),
      h("Как выполнять миграцию"),
      steps(
        [
          ["Оценить команду", "Блокировка, переписывание, зависимость от размера таблицы; проверить на копии данных."],
          ["Ограничить ожидание", "`SET lock_timeout` перед DDL; повторять при `55P03` (см. тему о блокировках)."],
          ["Разбить на безопасные шаги", "`NOT VALID` + `VALIDATE`, `CONCURRENTLY`, пакетное заполнение, расширить-сузить."],
          ["Выполнять транзакционно там, где можно", "Атомарные шаги (`CREATE`, `ALTER`) в одной транзакции; `CONCURRENTLY` — вне транзакции."],
          ["Записать и проверить", "Таблица применённых миграций, проверочные запросы после каждого шага, план отката."],
        ],
        "Безопасный порядок миграции",
      ),
    ]),

    section("technical", [
      h("Что переписывает таблицу"),
      table(
        ["Команда", "Переписывает таблицу (замер)", "Комментарий"],
        [
          ["`ADD COLUMN note text`", "Нет", "Только запись в каталог"],
          ["`ADD COLUMN … NOT NULL DEFAULT 0`", "Нет", "Постоянное значение по умолчанию хранится в каталоге (PostgreSQL 11+)"],
          ["`ADD COLUMN … DEFAULT random()`", "Да", "Изменчивая функция: значение вычисляется для каждой строки"],
          ["`ALTER COLUMN … TYPE bigint`", "Да", "Смена типа требует преобразовать все значения и пересоздать индексы"],
          ["`ADD COLUMN … GENERATED … STORED`", "Да", "Значение вычисляется и записывается для каждой строки"],
          ["`DROP COLUMN`", "Нет", "Столбец помечается удалённым; место освободится при последующих перезаписях"],
        ],
        "Какие команды переписывают таблицу (PostgreSQL 16.14)",
      ),
      h("Какие блокировки берут команды"),
      table(
        ["Команда", "Блокировка таблицы (замер)", "Влияние"],
        [
          ["`ADD COLUMN`", "`AccessExclusiveLock`", "Блокирует всё, но держится кратко"],
          ["`RENAME COLUMN`", "`AccessExclusiveLock`", "Кратко, но ломает старый код"],
          ["`ADD FOREIGN KEY … NOT VALID`", "`ShareRowExclusiveLock`", "Блокирует изменения, чтение свободно"],
          ["`VALIDATE CONSTRAINT`", "`ShareUpdateExclusiveLock`", "Не блокирует чтение и запись"],
          ["`CREATE INDEX`", "`ShareLock`", "Блокирует запись на всё время построения"],
          ["`CREATE INDEX CONCURRENTLY`", "Не блокирует запись (по документации)", "Дольше, нельзя внутри транзакции"],
        ],
        "Блокировки команд миграции",
      ),
      h("Приёмы"),
      ul(
        "**`lock_timeout`** на каждый DDL: быстро отказаться, чем встать в очередь и заблокировать остальных.",
        "**`NOT VALID` + `VALIDATE`:** ограничения без долгой блокировки.",
        "**`CREATE INDEX CONCURRENTLY`** вместо обычного на рабочих таблицах; проверять `indisvalid`.",
        "**Заполнение пакетами:** короткие транзакции, паузы, мониторинг репликации.",
        "**`SET NOT NULL`:** через проверенное `CHECK … NOT VALID`/`VALIDATE`, чтобы не сканировать таблицу под блокировкой (PostgreSQL 12+).",
        "**Расширить — мигрировать — сузить** для переименования, смены типа и удаления.",
      ),
      warn("Переписывающая команда на таблице в сотни гигабайт держит `ACCESS EXCLUSIVE` на всё время копирования — часы остановки. Узнавайте об этом на копии данных до релиза."),
    ]),

    section("syntax", [
      p("Заполнение нового столбца пакетами: процедура обновляет по `batch_size` строк и фиксирует транзакцию после каждого пакета."),
      annotated(
        "sql",
        `-- Заполнение нового столбца пакетами: каждый пакет — отдельная короткая транзакция
CREATE TABLE accounts (id integer PRIMARY KEY, name text NOT NULL, name_lower text);
INSERT INTO accounts SELECT g, 'Имя ' || g, NULL FROM generate_series(1, 25000) AS g;

CREATE PROCEDURE backfill_name_lower(batch_size integer) LANGUAGE plpgsql AS $$
DECLARE n integer; total integer := 0; i integer := 0;
BEGIN
  LOOP
    UPDATE accounts SET name_lower = lower(name)
    WHERE id IN (SELECT id FROM accounts WHERE name_lower IS NULL ORDER BY id LIMIT batch_size);
    GET DIAGNOSTICS n = ROW_COUNT;
    EXIT WHEN n = 0;
    i := i + 1; total := total + n;
    RAISE NOTICE 'пакет %: обновлено % строк', i, n;
    COMMIT;
  END LOOP;
  RAISE NOTICE 'всего обновлено: %', total;
END $$;

CALL backfill_name_lower(10000);
SELECT count(*) AS rows_left FROM accounts WHERE name_lower IS NULL;`,
        [
          { line: 1, text: "Комментарий формулирует приём: короткие транзакции вместо одной длинной." },
          { line: [2, 3], text: "Таблица и 25 000 строк с пустым `name_lower`." },
          { line: [5, 18], text: "Процедура: цикл, в котором каждая итерация обновляет не больше `batch_size` строк и фиксируется." },
          { line: [9, 10], text: "Пакет выбирается подзапросом: `LIMIT batch_size` среди ещё не заполненных строк, по порядку `id`." },
          { line: 11, text: "`GET DIAGNOSTICS … ROW_COUNT` возвращает число обновлённых строк; 0 — работа закончена." },
          { line: 15, text: "`COMMIT` внутри процедуры завершает пакет: блокировки снимаются, следующие пакеты начинаются в новой транзакции." },
          { line: 20, text: "Вызов с размером пакета 10 000: пакеты по 10 000, 10 000 и 5000 строк." },
        ],
        "04-backfill.pg.sql",
      ),
      code("text", `NOTICE:  пакет 1: обновлено 10000 строк
NOTICE:  пакет 2: обновлено 10000 строк
NOTICE:  пакет 3: обновлено 5000 строк
NOTICE:  всего обновлено: 25000
 rows_left 
-----------
         0
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
    ]),

    section("minimal-example", [
      p("Первый вопрос к любой миграции: переписывает ли она таблицу? Файл данных таблицы определяется `relfilenode`; если он изменился, таблица переписана. Таблица на 200 000 строк."),
      code("sql", `-- Таблица на 200 000 строк. relfilenode — номер файла данных: если он меняется, таблица переписана целиком
CREATE TABLE events (id integer PRIMARY KEY, kind text NOT NULL, first_name text NOT NULL, last_name text NOT NULL);
INSERT INTO events SELECT g, 'click', 'Имя' || g, 'Фамилия' || g FROM generate_series(1, 200000) AS g;
SELECT relfilenode AS f0 FROM pg_class WHERE relname = 'events' \\gset

-- Столбец без значения по умолчанию
ALTER TABLE events ADD COLUMN note text;
SELECT 'ADD COLUMN note text' AS command, relfilenode <> :f0 AS table_rewritten FROM pg_class WHERE relname = 'events';
SELECT relfilenode AS f1 FROM pg_class WHERE relname = 'events' \\gset

-- Столбец с постоянным значением по умолчанию (PostgreSQL 11 и новее)
ALTER TABLE events ADD COLUMN priority integer NOT NULL DEFAULT 0;
SELECT 'ADD COLUMN … DEFAULT 0' AS command, relfilenode <> :f1 AS table_rewritten FROM pg_class WHERE relname = 'events';
SELECT relfilenode AS f2 FROM pg_class WHERE relname = 'events' \\gset

-- Значение по умолчанию, вычисляемое для каждой строки (изменчивая функция)
ALTER TABLE events ADD COLUMN token double precision DEFAULT random();
SELECT 'ADD COLUMN … DEFAULT random()' AS command, relfilenode <> :f2 AS table_rewritten FROM pg_class WHERE relname = 'events';
SELECT relfilenode AS f2b FROM pg_class WHERE relname = 'events' \\gset

-- Изменение типа столбца
ALTER TABLE events ALTER COLUMN id TYPE bigint;
SELECT 'ALTER COLUMN … TYPE bigint' AS command, relfilenode <> :f2b AS table_rewritten FROM pg_class WHERE relname = 'events';
SELECT relfilenode AS f3 FROM pg_class WHERE relname = 'events' \\gset

-- Вычисляемый хранимый столбец
ALTER TABLE events ADD COLUMN full_name text GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;
SELECT 'ADD COLUMN … GENERATED STORED' AS command, relfilenode <> :f3 AS table_rewritten FROM pg_class WHERE relname = 'events';
SELECT relfilenode AS f4 FROM pg_class WHERE relname = 'events' \\gset

-- Удаление столбца
ALTER TABLE events DROP COLUMN note;
SELECT 'DROP COLUMN' AS command, relfilenode <> :f4 AS table_rewritten FROM pg_class WHERE relname = 'events';`, { filename: "01-rewrite.pg.sql" }),
      code("text", `       command        | table_rewritten 
----------------------+-----------------
 ADD COLUMN note text | f
(1 row)

        command         | table_rewritten 
------------------------+-----------------
 ADD COLUMN … DEFAULT 0 | f
(1 row)

            command            | table_rewritten 
-------------------------------+-----------------
 ADD COLUMN … DEFAULT random() | t
(1 row)

          command           | table_rewritten 
----------------------------+-----------------
 ALTER COLUMN … TYPE bigint | t
(1 row)

            command            | table_rewritten 
-------------------------------+-----------------
 ADD COLUMN … GENERATED STORED | t
(1 row)

   command   | table_rewritten 
-------------+-----------------
 DROP COLUMN | f
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "`ADD COLUMN note text` и `ADD COLUMN … DEFAULT 0` — не переписывают: PostgreSQL хранит постоянное значение по умолчанию в каталоге и подставляет при чтении.",
        "`DEFAULT random()` — переписывает: значение должно быть вычислено для каждой строки.",
        "`ALTER COLUMN … TYPE bigint` и `GENERATED … STORED` — переписывают таблицу; на большой таблице это минуты или часы под блокировкой.",
        "`DROP COLUMN` — не переписывает: столбец лишь помечается удалённым.",
      ),
    ]),

    section("detailed-example", [
      h("Блокировки команд миграции"),
      code("sql", `CREATE TABLE customers (id integer PRIMARY KEY);
CREATE TABLE orders (id integer PRIMARY KEY, customer_id integer, note text);
INSERT INTO customers VALUES (1);
INSERT INTO orders VALUES (1, 1, NULL);

-- Какие блокировки таблицы orders держит транзакция после каждой команды миграции
BEGIN;
ALTER TABLE orders ADD COLUMN flag boolean;
SELECT 'ADD COLUMN' AS command, mode FROM pg_locks WHERE relation = 'orders'::regclass AND pid = pg_backend_pid() AND mode LIKE '%Exclusive%' ORDER BY mode;
ROLLBACK;

BEGIN;
ALTER TABLE orders ADD CONSTRAINT orders_fk FOREIGN KEY (customer_id) REFERENCES customers (id) NOT VALID;
SELECT 'ADD FOREIGN KEY … NOT VALID' AS command, mode FROM pg_locks WHERE relation = 'orders'::regclass AND pid = pg_backend_pid() AND mode LIKE '%Exclusive%' ORDER BY mode;
COMMIT;

BEGIN;
ALTER TABLE orders VALIDATE CONSTRAINT orders_fk;
SELECT 'VALIDATE CONSTRAINT' AS command, mode FROM pg_locks WHERE relation = 'orders'::regclass AND pid = pg_backend_pid() AND mode LIKE '%Exclusive%' ORDER BY mode;
ROLLBACK;

BEGIN;
CREATE INDEX orders_note_idx ON orders (note);
SELECT 'CREATE INDEX' AS command, mode FROM pg_locks WHERE relation = 'orders'::regclass AND pid = pg_backend_pid() AND mode LIKE 'Share%' ORDER BY mode;
ROLLBACK;

BEGIN;
ALTER TABLE orders RENAME COLUMN note TO comment;
SELECT 'RENAME COLUMN' AS command, mode FROM pg_locks WHERE relation = 'orders'::regclass AND pid = pg_backend_pid() AND mode LIKE '%Exclusive%' ORDER BY mode;
ROLLBACK;`, { filename: "08-lock-modes.pg.sql" }),
      code("text", `  command   |        mode         
------------+---------------------
 ADD COLUMN | AccessExclusiveLock
(1 row)

           command           |         mode          
-----------------------------+-----------------------
 ADD FOREIGN KEY … NOT VALID | ShareRowExclusiveLock
(1 row)

       command       |           mode           
---------------------+--------------------------
 VALIDATE CONSTRAINT | ShareUpdateExclusiveLock
(1 row)

   command    |   mode    
--------------+-----------
 CREATE INDEX | ShareLock
(1 row)

    command    |        mode         
---------------+---------------------
 RENAME COLUMN | AccessExclusiveLock
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Самые «сильные» команды — `ADD COLUMN` и `RENAME COLUMN` (`AccessExclusiveLock`): они не опасны, пока выполняются мгновенно, но встают в очередь за долгими транзакциями (см. тему о блокировках) — поэтому выполняются с `lock_timeout`. `VALIDATE CONSTRAINT` берёт лишь `ShareUpdateExclusiveLock` и не мешает ни чтению, ни записи — вот почему тяжёлую проверку выносят в отдельный шаг. Обычный `CREATE INDEX` берёт `ShareLock` и блокирует запись."),
      h("Внешний ключ в два шага"),
      code("sql", `CREATE TABLE customers (id integer PRIMARY KEY);
CREATE TABLE orders (id integer PRIMARY KEY, customer_id integer NOT NULL);
INSERT INTO customers VALUES (1), (2);
INSERT INTO orders VALUES (1, 1), (2, 2), (3, 99);       -- заказ 3 — «сирота»

-- NOT VALID: ограничение создаётся быстро и проверяет только новые записи
ALTER TABLE orders ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers (id) NOT VALID;
SELECT conname, convalidated FROM pg_constraint WHERE conname = 'orders_customer_fk';

-- Новая «сирота» отклонена, старая допущена
INSERT INTO orders VALUES (4, 98);

-- VALIDATE находит старую «сироту»
ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_fk;

-- Исправили данные — проверка проходит
UPDATE orders SET customer_id = 1 WHERE id = 3;
ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_fk;
SELECT conname, convalidated FROM pg_constraint WHERE conname = 'orders_customer_fk';`, { filename: "02-not-valid.pg.sql" }),
      code("text", `      conname       | convalidated 
--------------------+--------------
 orders_customer_fk | f
(1 row)

ERROR:  insert or update on table "orders" violates foreign key constraint "orders_customer_fk"
DETAIL:  Key (customer_id)=(98) is not present in table "customers".
ERROR:  insert or update on table "orders" violates foreign key constraint "orders_customer_fk"
DETAIL:  Key (customer_id)=(99) is not present in table "customers".
      conname       | convalidated 
--------------------+--------------
 orders_customer_fk | t
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "`NOT VALID`: ограничение создано (`convalidated = f`) без проверки существующих строк: «сирота» (заказ 3 клиента 99) допущена.",
        "Новая «сирота» (заказ 4, клиент 98) уже отклонена — ограничение действует для новых записей.",
        "`VALIDATE CONSTRAINT` нашёл старую «сироту» и отказал. После исправления данных проверка прошла, `convalidated = t`.",
      ),
    ]),

    section("analysis", [
      table(
        ["Сценарий", "Результат (замер)", "Вывод"],
        [
          ["`ADD COLUMN` без значения / `DEFAULT 0`", "Таблица не переписана", "Безопасно по времени"],
          ["`DEFAULT random()`, `TYPE bigint`, `GENERATED STORED`", "Переписана целиком", "Опасно на больших таблицах"],
          ["Внешний ключ `NOT VALID` → `VALIDATE`", "Старая «сирота» найдена на втором шаге", "Проверка вынесена в отдельный шаг"],
          ["`CREATE UNIQUE INDEX CONCURRENTLY` при дубле", "Ошибка, `indisvalid = f`", "Остаётся недействительный индекс"],
          ["Заполнение пакетами", "10 000 + 10 000 + 5000", "Короткие транзакции"],
          ["Миграция с ошибкой на последнем шаге", "Ни таблицы, ни записи о миграции", "Транзакционный DDL атомарен"],
          ["Расширить — мигрировать — сузить", "`out_of_sync = 0`; старый запрос после шага 3 — ошибка", "Шаг сужения — только после перехода всех"],
        ],
        "Что показали замеры PostgreSQL 16.14",
      ),
      h("Индекс без блокировки"),
      code("sql", `CREATE TABLE users (id integer PRIMARY KEY, email text NOT NULL);
INSERT INTO users VALUES (1, 'a@example.com'), (2, 'b@example.com'), (3, 'a@example.com');   -- дубль email

-- Индекс без блокировки записи не смог построиться из-за дубля и остался «недействительным»
CREATE UNIQUE INDEX CONCURRENTLY users_email_uq ON users (email);
SELECT indexrelid::regclass AS index_name, indisvalid FROM pg_index WHERE indrelid = 'users'::regclass AND NOT indisprimary;

-- Недействительный индекс всё равно обновляется при записи, но запросами не используется: его нужно удалить
DROP INDEX CONCURRENTLY users_email_uq;
DELETE FROM users WHERE id = 3;
CREATE UNIQUE INDEX CONCURRENTLY users_email_uq ON users (email);
SELECT indexrelid::regclass AS index_name, indisvalid FROM pg_index WHERE indrelid = 'users'::regclass AND NOT indisprimary;`, { filename: "03-concurrently.pg.sql" }),
      code("text", `ERROR:  could not create unique index "users_email_uq"
DETAIL:  Key (email)=(a@example.com) is duplicated.
   index_name   | indisvalid 
----------------+------------
 users_email_uq | f
(1 row)

   index_name   | indisvalid 
----------------+------------
 users_email_uq | t
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("В данных был дубль email, и построение уникального индекса провалилось. Но индекс с `CONCURRENTLY` остался в каталоге в состоянии `indisvalid = f`: запросами он не используется, а записью продолжает обновляться — то есть замедляет её и ничего не даёт. Его нужно удалить (`DROP INDEX CONCURRENTLY`), исправить данные и построить заново."),
    ]),

    section("internals", [
      h("Миграция как транзакция"),
      code("sql", `-- Миграция в одной транзакции: либо все шаги, либо ни одного
CREATE TABLE schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());

BEGIN;
CREATE TABLE products (id integer PRIMARY KEY, title text NOT NULL);
CREATE INDEX products_title_idx ON products (title);
ALTER TABLE products ADD COLUMN price numeric NOT NULL DEFAULT 'не число';   -- ошибка на последнем шаге
INSERT INTO schema_migrations (version) VALUES ('2024_01_create_products');
COMMIT;

SELECT to_regclass('products') AS products_table, (SELECT count(*) FROM schema_migrations) AS recorded_migrations;

-- Индекс без блокировки нельзя выполнять в транзакции
BEGIN;
CREATE INDEX CONCURRENTLY orders_x ON schema_migrations (version);
ROLLBACK;`, { filename: "05-transactional.pg.sql" }),
      code("text", `CREATE TABLE
BEGIN
CREATE TABLE
CREATE INDEX
ERROR:  invalid input syntax for type numeric: "не число"
ERROR:  current transaction is aborted, commands ignored until end of transaction block
ROLLBACK
 products_table | recorded_migrations 
----------------+---------------------
                |                   0
(1 row)

BEGIN
ERROR:  CREATE INDEX CONCURRENTLY cannot run inside a transaction block
ROLLBACK`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "В PostgreSQL DDL транзакционен: ошибка на третьем шаге отменила и `CREATE TABLE`, и `CREATE INDEX`, и запись в `schema_migrations` — база осталась в прежнем состоянии, миграцию можно исправить и запустить снова.",
        "Исключение — команды, которые нельзя выполнять внутри транзакции: `CREATE INDEX CONCURRENTLY` (в замере `cannot run inside a transaction block`). Их выделяют в отдельные миграции.",
        "Таблица `schema_migrations` фиксирует применённые версии: инструмент миграций выполняет только новые и не применяет одну миграцию дважды.",
      ),
      h("SET NOT NULL без долгого сканирования"),
      code("sql", `CREATE TABLE members (id integer PRIMARY KEY, email text);
INSERT INTO members SELECT g, 'u' || g || '@example.com' FROM generate_series(1, 1000) AS g;

-- Шаг 1: проверка NOT NULL как ограничение без полного просмотра (проверяются только новые записи)
ALTER TABLE members ADD CONSTRAINT members_email_not_null CHECK (email IS NOT NULL) NOT VALID;
-- Шаг 2: проверка существующих строк с лёгкой блокировкой
ALTER TABLE members VALIDATE CONSTRAINT members_email_not_null;
-- Шаг 3: SET NOT NULL использует проверенное ограничение и не просматривает таблицу заново (PostgreSQL 12+)
ALTER TABLE members ALTER COLUMN email SET NOT NULL;
-- Шаг 4: вспомогательное ограничение больше не нужно
ALTER TABLE members DROP CONSTRAINT members_email_not_null;

SELECT attname, attnotnull FROM pg_attribute WHERE attrelid = 'members'::regclass AND attname = 'email';
INSERT INTO members VALUES (2000, NULL);`, { filename: "06-set-not-null.pg.sql" }),
      code("text", ` attname | attnotnull 
---------+------------
 email   | t
(1 row)

ERROR:  null value in column "email" of relation "members" violates not-null constraint
DETAIL:  Failing row contains (2000, null).`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Прямой `SET NOT NULL` сканирует таблицу под `ACCESS EXCLUSIVE`. Обходной путь: сначала `CHECK (email IS NOT NULL) NOT VALID`, затем `VALIDATE CONSTRAINT` (мягкая блокировка), после чего `SET NOT NULL` использует уже проверенное ограничение и пропускает сканирование (PostgreSQL 12+), а вспомогательное ограничение удаляется. Результат: `attnotnull = t`, вставка `NULL` отклонена."),
      h("Расширить — мигрировать — сузить"),
      code("sql", `-- Переименование столбца fullname → display_name без остановки: расширить, мигрировать, сузить
CREATE TABLE users (id integer PRIMARY KEY, fullname text NOT NULL);
INSERT INTO users SELECT g, 'Пользователь ' || g FROM generate_series(1, 5) AS g;

-- Шаг 1 (expand): новый столбец и триггер, который держит оба столбца согласованными
ALTER TABLE users ADD COLUMN display_name text;
CREATE FUNCTION users_sync() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.display_name := COALESCE(NEW.display_name, NEW.fullname);
    NEW.fullname     := COALESCE(NEW.fullname, NEW.display_name);
  ELSIF NEW.fullname IS DISTINCT FROM OLD.fullname THEN
    NEW.display_name := NEW.fullname;
  ELSIF NEW.display_name IS DISTINCT FROM OLD.display_name THEN
    NEW.fullname := NEW.display_name;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER users_sync_trg BEFORE INSERT OR UPDATE ON users FOR EACH ROW EXECUTE FUNCTION users_sync();

-- Шаг 2 (migrate): заполнить новый столбец для существующих строк
UPDATE users SET display_name = fullname WHERE display_name IS NULL;

-- Старое и новое приложения работают одновременно
INSERT INTO users (id, fullname)     VALUES (6, 'Запись старого приложения');
INSERT INTO users (id, display_name) VALUES (7, 'Запись нового приложения');
UPDATE users SET display_name = 'Переименован новым приложением' WHERE id = 1;
UPDATE users SET fullname     = 'Переименован старым приложением' WHERE id = 2;
SELECT id, fullname, display_name, fullname = display_name AS in_sync FROM users WHERE id IN (1, 2, 6, 7) ORDER BY id;
SELECT count(*) FILTER (WHERE fullname IS DISTINCT FROM display_name) AS out_of_sync FROM users;

-- Шаг 3 (contract): когда все перешли на новый столбец — убрать триггер и старый столбец
DROP TRIGGER users_sync_trg ON users;
DROP FUNCTION users_sync();
ALTER TABLE users DROP COLUMN fullname;
SELECT id, display_name FROM users ORDER BY id LIMIT 3;

-- Старое приложение после шага 3 ломается: поэтому шаг 3 — только после полного перехода
SELECT fullname FROM users LIMIT 1;`, { filename: "07-expand-contract.pg.sql" }),
      code("text", ` id |            fullname             |          display_name           | in_sync 
----+---------------------------------+---------------------------------+---------
  1 | Переименован новым приложением  | Переименован новым приложением  | t
  2 | Переименован старым приложением | Переименован старым приложением | t
  6 | Запись старого приложения       | Запись старого приложения       | t
  7 | Запись нового приложения        | Запись нового приложения        | t
(4 rows)

 out_of_sync 
-------------
           0
(1 row)

 id |          display_name           
----+---------------------------------
  1 | Переименован новым приложением
  2 | Переименован старым приложением
  3 | Пользователь 3
(3 rows)

ERROR:  column "fullname" does not exist
LINE 1: SELECT fullname FROM users LIMIT 1;
               ^`, { filename: "результат (PostgreSQL 16.14)" }),
      p("После шага 1 и 2 обе версии приложения работают одновременно: запись старого приложения (`fullname`) и нового (`display_name`) синхронизируются триггером, расхождений нет (`out_of_sync = 0`). Только когда никто не читает `fullname`, шаг 3 убирает триггер и столбец. Старый запрос после удаления получает `column \"fullname\" does not exist` — поэтому сужение откладывают до полного перехода."),
    ]),

    section("mistakes", [
      h("Ошибка: DDL без lock_timeout"),
      p("`ALTER TABLE` встаёт в очередь за долгой транзакцией и блокирует все запросы за собой (см. тему о блокировках). Перед DDL — `SET lock_timeout = '2s'` и повтор при `55P03`."),
      h("Ошибка: смена типа на большой таблице одной командой"),
      wrongRight(
        "sql",
        { title: "Переписывание под блокировкой", code: `ALTER TABLE events ALTER COLUMN id TYPE bigint;`, note: "Таблица переписана целиком (замер: `relfilenode` изменился) под `ACCESS EXCLUSIVE`: на больших таблицах — часы простоя." },
        { title: "Новый столбец и перенос", code: `ALTER TABLE events ADD COLUMN id_big bigint;\n-- заполнить пакетами, построить индекс CONCURRENTLY,\n-- перевести код, затем сузить`, note: "Каждый шаг короткий; старый код продолжает работать." },
      ),
      h("Ошибка: внешний ключ или CHECK сразу с проверкой"),
      p("`ADD FOREIGN KEY` без `NOT VALID` проверяет все строки под блокировкой, которая блокирует изменения. Разделите: `NOT VALID`, затем `VALIDATE CONSTRAINT` (мягкая блокировка)."),
      h("Ошибка: не проверить недействительный индекс"),
      p("После неудачного `CREATE INDEX CONCURRENTLY` остаётся индекс с `indisvalid = f`: он замедляет запись и не помогает запросам. Проверяйте `pg_index.indisvalid`, удаляйте и создавайте заново."),
      h("Ошибка: одна огромная транзакция заполнения"),
      p("`UPDATE` по всей таблице держит блокировки строк и раздувает таблицу и журнал. Заполняйте пакетами с `COMMIT` (10 000 + 10 000 + 5000 в замере) и следите за репликацией."),
      h("Ошибка: переименовать или удалить столбец, пока код ещё его использует"),
      p("Старая версия приложения получит `column does not exist`. Сначала расширить и перевести код, потом сузить."),
    ]),

    section("antipatterns", [
      ul(
        "**Миграция «в пятницу вечером» без проверки на копии данных.**",
        "**`ALTER TABLE` без `lock_timeout` и повторов.**",
        "**Смешивание схемы и тяжёлой миграции данных в одной транзакции.**",
        "**Откат «ручным SQL по памяти»:** у каждой миграции должен быть проверенный путь возврата.",
        "**Переименование и удаление в одном релизе с кодом.**",
        "**Игнорирование недействительных индексов и `NOT VALID` ограничений:** они остаются навсегда непроверенными.",
        "**Миграции, зависящие от размера данных в бою,** но проверенные только на пустой базе.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Версионируйте схему** файлами миграций и таблицей применённых версий; не правьте боевую схему вручную.",
        "**Проверяйте каждую команду:** переписывание, блокировка, зависимость от размера; тест на копии боевых данных.",
        "**`lock_timeout` и повторы** для DDL; выполняйте в часы низкой нагрузки.",
        "**`NOT VALID` + `VALIDATE`**, **`CREATE INDEX CONCURRENTLY`**, пакетное заполнение.",
        "**Совместимость:** расширить → мигрировать → сузить; не удалять и не переименовывать в одном релизе с кодом.",
        "**Транзакционность:** схемные шаги — в одной транзакции; `CONCURRENTLY` — отдельно.",
        "**План отката** для каждого шага и проверочные запросы после него.",
        "**Мониторинг** во время миграции: блокировки (`pg_stat_activity`), задержка репликации, размер журнала.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Репликация:** переписывание и массовые обновления создают много журнала и задерживают реплики; пакетное заполнение с паузами смягчает нагрузку.",
        "**Версии PostgreSQL:** быстрое добавление столбца с постоянным `DEFAULT` — с 11, использование проверенного `CHECK` при `SET NOT NULL` — с 12; на старых версиях команды переписывают или сканируют таблицу.",
        "**Секционированные таблицы:** индексы и ограничения создаются на каждой секции; `CONCURRENTLY` на родителе не поддерживается — строят по секциям.",
        "**Триггеры и представления:** удаление столбца ломает зависимые объекты; `DROP … CASCADE` скрывает потери.",
        "**Блокировка внешних ключей:** обе таблицы получают блокировки; при высокой нагрузке на родительскую таблицу делайте в тихое окно.",
        "**SQLite:** `ALTER TABLE` ограничен (переименование и добавление столбца; смена типа — пересозданием таблицы); примеры темы выполнялись в PostgreSQL.",
      ),
    ]),

    section("related", [
      ul(
        "[Транзакции и ACID](/learn/sql/acid-transactions) — транзакционный DDL и атомарные миграции.",
        "[Блокировки и взаимоблокировки](/learn/sql/locking-deadlocks) — очередь блокировок и `lock_timeout`.",
        "[Связи между таблицами](/learn/sql/relationships) — внешние ключи и их проверка.",
        "[Индексы и B-дерево](/learn/sql/indexes-btree) — `CREATE INDEX CONCURRENTLY`.",
        "[Паттерны проектирования схем](/learn/sql/schema-patterns) — что именно добавляют миграциями: журналы, мягкое удаление, история.",
        "[Безопасность SQL](/learn/sql/sql-security) — права для миграций и ролей приложения.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Одним шагом",
          code: `ALTER TABLE orders\n  ADD CONSTRAINT orders_customer_fk\n  FOREIGN KEY (customer_id) REFERENCES customers (id);`,
          note: "Проверяет все строки под блокировкой, мешающей изменениям; на большой таблице — долгая остановка записи.",
        },
        {
          title: "Двумя шагами",
          code: `ALTER TABLE orders\n  ADD CONSTRAINT orders_customer_fk\n  FOREIGN KEY (customer_id) REFERENCES customers (id) NOT VALID;\n\nALTER TABLE orders VALIDATE CONSTRAINT orders_customer_fk;`,
          note: "Первый шаг быстрый (`ShareRowExclusiveLock`, замер), второй — `ShareUpdateExclusiveLock`, не блокирует чтение и запись.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.migrations-safe-ddl.ex1",
      title: "Какие команды перепишут таблицу",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Таблица `events` содержит 200 000 строк. Для каждой команды определите, перепишет ли она таблицу целиком: (1) `ADD COLUMN note text`, (2) `ADD COLUMN priority integer NOT NULL DEFAULT 0`, (3) `ADD COLUMN token double precision DEFAULT random()`, (4) `ALTER COLUMN id TYPE bigint`, (5) `DROP COLUMN note`. Затем сверьтесь с замером."),
      ],
      hints: ["Нужно ли вычислять значение для каждой существующей строки?", "Меняется ли физическое представление данных всех строк?"],
      checks: ["Не переписывают: (1), (2), (5)", "Переписывают: (3), (4)"],
      solution: [
        code("text", `       command        | table_rewritten 
----------------------+-----------------
 ADD COLUMN note text | f
(1 row)

        command         | table_rewritten 
------------------------+-----------------
 ADD COLUMN … DEFAULT 0 | f
(1 row)

            command            | table_rewritten 
-------------------------------+-----------------
 ADD COLUMN … DEFAULT random() | t
(1 row)

          command           | table_rewritten 
----------------------------+-----------------
 ALTER COLUMN … TYPE bigint | t
(1 row)

            command            | table_rewritten 
-------------------------------+-----------------
 ADD COLUMN … GENERATED STORED | t
(1 row)

   command   | table_rewritten 
-------------+-----------------
 DROP COLUMN | f
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Постоянное значение по умолчанию (`0`) хранится в каталоге и не требует правки строк, `DROP COLUMN` лишь помечает столбец. `random()` вычисляется для каждой строки, а смена типа требует преобразовать и перезаписать все значения: в обоих случаях `relfilenode` изменился."),
      ],
    }),
    exercise({
      id: "sql.migrations-safe-ddl.ex2",
      title: "Индекс «построился», а запись замедлилась",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Администратор запустил `CREATE UNIQUE INDEX CONCURRENTLY` для email, команда завершилась ошибкой, но сервис стал медленнее писать, а запросы по email индекс не используют. Объясните причину и исправьте."),
        code("sql", `CREATE TABLE users (id integer PRIMARY KEY, email text NOT NULL);
INSERT INTO users VALUES (1, 'a@example.com'), (2, 'b@example.com'), (3, 'a@example.com');   -- дубль email

-- Индекс без блокировки записи не смог построиться из-за дубля и остался «недействительным»
CREATE UNIQUE INDEX CONCURRENTLY users_email_uq ON users (email);
SELECT indexrelid::regclass AS index_name, indisvalid FROM pg_index WHERE indrelid = 'users'::regclass AND NOT indisprimary;

-- Недействительный индекс всё равно обновляется при записи, но запросами не используется: его нужно удалить
DROP INDEX CONCURRENTLY users_email_uq;
DELETE FROM users WHERE id = 3;
CREATE UNIQUE INDEX CONCURRENTLY users_email_uq ON users (email);
SELECT indexrelid::regclass AS index_name, indisvalid FROM pg_index WHERE indrelid = 'users'::regclass AND NOT indisprimary;`, { filename: "воспроизведение: 03-concurrently.pg.sql" }),
      ],
      hints: ["Что осталось в каталоге после неудачного `CONCURRENTLY`?", "Как проверить, что индекс действителен?"],
      checks: ["Недействительный индекс (`indisvalid = f`) продолжает обновляться при записи", "Удалить `DROP INDEX CONCURRENTLY`, устранить дубли, построить заново"],
      solution: [
        code("text", `ERROR:  could not create unique index "users_email_uq"
DETAIL:  Key (email)=(a@example.com) is duplicated.
   index_name   | indisvalid 
----------------+------------
 users_email_uq | f
(1 row)

   index_name   | indisvalid 
----------------+------------
 users_email_uq | t
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("При ошибке построения (дубль email) индекс остаётся в каталоге, но недействителен: запросы его не используют, а запись его обновляет. Диагностика — `pg_index.indisvalid`. Исправление: `DROP INDEX CONCURRENTLY`, устранить дубли, повторить `CREATE UNIQUE INDEX CONCURRENTLY` — теперь `indisvalid = t`."),
      ],
    }),
    exercise({
      id: "sql.migrations-safe-ddl.ex3",
      title: "Заполнить столбец для 100 млн строк",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("В таблицу `accounts` добавлен столбец `name_lower`. Нужно заполнить его значениями `lower(name)` для всех строк, не блокируя работу сервиса. Опишите и покажите на небольшом примере процедуру пакетного заполнения и объясните её параметры."),
      ],
      hints: ["Какую транзакцию вы не хотите держать открытой часами?", "Как узнать, что работа закончена?"],
      checks: ["Процедура с `LIMIT batch_size` и `COMMIT` после пакета", "Остановка по `ROW_COUNT = 0`; в примере 10 000 + 10 000 + 5000"],
      solution: [
        code("sql", `-- Заполнение нового столбца пакетами: каждый пакет — отдельная короткая транзакция
CREATE TABLE accounts (id integer PRIMARY KEY, name text NOT NULL, name_lower text);
INSERT INTO accounts SELECT g, 'Имя ' || g, NULL FROM generate_series(1, 25000) AS g;

CREATE PROCEDURE backfill_name_lower(batch_size integer) LANGUAGE plpgsql AS $$
DECLARE n integer; total integer := 0; i integer := 0;
BEGIN
  LOOP
    UPDATE accounts SET name_lower = lower(name)
    WHERE id IN (SELECT id FROM accounts WHERE name_lower IS NULL ORDER BY id LIMIT batch_size);
    GET DIAGNOSTICS n = ROW_COUNT;
    EXIT WHEN n = 0;
    i := i + 1; total := total + n;
    RAISE NOTICE 'пакет %: обновлено % строк', i, n;
    COMMIT;
  END LOOP;
  RAISE NOTICE 'всего обновлено: %', total;
END $$;

CALL backfill_name_lower(10000);
SELECT count(*) AS rows_left FROM accounts WHERE name_lower IS NULL;`, { filename: "04-backfill.pg.sql", lineNumbers: true }),
        code("text", `NOTICE:  пакет 1: обновлено 10000 строк
NOTICE:  пакет 2: обновлено 10000 строк
NOTICE:  пакет 3: обновлено 5000 строк
NOTICE:  всего обновлено: 25000
 rows_left 
-----------
         0
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Каждый пакет — короткая транзакция: блокировки строк снимаются после `COMMIT`, журнал и раздувание ограничены размером пакета. На боевой таблице добавляют паузу между пакетами, ограничивают скорость по задержке репликации и вызывают процедуру из отдельного сеанса. Условие `name_lower IS NULL` делает процесс возобновляемым: после прерывания работа продолжится с места остановки."),
      ],
    }),
  ],

  challenge: {
    id: "sql.migrations-safe-ddl.challenge",
    title: "Переименование столбца без простоя",
    scenario: [
      p("В таблице `users` столбец `fullname` нужно переименовать в `display_name`, но выкладка идёт поэтапно: какое-то время работают старая и новая версии приложения, и обе должны писать и читать пользователей."),
    ],
    requirements: [
      "Шаг «расширить»: новый столбец и триггер, синхронизирующий оба столбца в обе стороны",
      "Шаг «мигрировать»: заполнить новый столбец для существующих строк",
      "Проверка одновременной работы: запись и обновления обеими версиями, `out_of_sync = 0`",
      "Шаг «сузить»: убрать триггер и старый столбец; показать, что старый запрос после этого ломается",
    ],
    constraints: [
      "Ни на одном шаге старое приложение не должно получать ошибок до шага «сузить»",
      "Миграция выполняется в PostgreSQL; триггер на `BEFORE INSERT OR UPDATE`",
    ],
    acceptance: [
      "После шагов 1–2: у строк, записанных любой версией, `fullname = display_name`; `out_of_sync = 0`",
      "После шага 3: `SELECT fullname …` — ошибка `column \"fullname\" does not exist`",
    ],
    hints: [
      "Триггер для `INSERT` заполняет недостающий столбец из присутствующего; для `UPDATE` — переносит изменение изменённого столбца.",
      "Шаг «сузить» выполняют, только когда все экземпляры приложения переведены на новый столбец.",
    ],
    solution: [
      code("sql", `-- Переименование столбца fullname → display_name без остановки: расширить, мигрировать, сузить
CREATE TABLE users (id integer PRIMARY KEY, fullname text NOT NULL);
INSERT INTO users SELECT g, 'Пользователь ' || g FROM generate_series(1, 5) AS g;

-- Шаг 1 (expand): новый столбец и триггер, который держит оба столбца согласованными
ALTER TABLE users ADD COLUMN display_name text;
CREATE FUNCTION users_sync() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.display_name := COALESCE(NEW.display_name, NEW.fullname);
    NEW.fullname     := COALESCE(NEW.fullname, NEW.display_name);
  ELSIF NEW.fullname IS DISTINCT FROM OLD.fullname THEN
    NEW.display_name := NEW.fullname;
  ELSIF NEW.display_name IS DISTINCT FROM OLD.display_name THEN
    NEW.fullname := NEW.display_name;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER users_sync_trg BEFORE INSERT OR UPDATE ON users FOR EACH ROW EXECUTE FUNCTION users_sync();

-- Шаг 2 (migrate): заполнить новый столбец для существующих строк
UPDATE users SET display_name = fullname WHERE display_name IS NULL;

-- Старое и новое приложения работают одновременно
INSERT INTO users (id, fullname)     VALUES (6, 'Запись старого приложения');
INSERT INTO users (id, display_name) VALUES (7, 'Запись нового приложения');
UPDATE users SET display_name = 'Переименован новым приложением' WHERE id = 1;
UPDATE users SET fullname     = 'Переименован старым приложением' WHERE id = 2;
SELECT id, fullname, display_name, fullname = display_name AS in_sync FROM users WHERE id IN (1, 2, 6, 7) ORDER BY id;
SELECT count(*) FILTER (WHERE fullname IS DISTINCT FROM display_name) AS out_of_sync FROM users;

-- Шаг 3 (contract): когда все перешли на новый столбец — убрать триггер и старый столбец
DROP TRIGGER users_sync_trg ON users;
DROP FUNCTION users_sync();
ALTER TABLE users DROP COLUMN fullname;
SELECT id, display_name FROM users ORDER BY id LIMIT 3;

-- Старое приложение после шага 3 ломается: поэтому шаг 3 — только после полного перехода
SELECT fullname FROM users LIMIT 1;`, { filename: "07-expand-contract.pg.sql", lineNumbers: true }),
      code("text", ` id |            fullname             |          display_name           | in_sync 
----+---------------------------------+---------------------------------+---------
  1 | Переименован новым приложением  | Переименован новым приложением  | t
  2 | Переименован старым приложением | Переименован старым приложением | t
  6 | Запись старого приложения       | Запись старого приложения       | t
  7 | Запись нового приложения        | Запись нового приложения        | t
(4 rows)

 out_of_sync 
-------------
           0
(1 row)

 id |          display_name           
----+---------------------------------
  1 | Переименован новым приложением
  2 | Переименован старым приложением
  3 | Пользователь 3
(3 rows)

ERROR:  column "fullname" does not exist
LINE 1: SELECT fullname FROM users LIMIT 1;
               ^`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Триггер `BEFORE INSERT OR UPDATE` держит столбцы согласованными: старое приложение пишет `fullname`, новое — `display_name`, и обе записи оказываются в обоих столбцах. Заполнение существующих строк завершает «миграцию». Проверка показала 4 строки с `in_sync = t` и `out_of_sync = 0`. Только после полного перехода шаг «сузить» убрал триггер и `fullname`; старый запрос после этого получает ошибку — именно поэтому порядок шагов и принадлежит дисциплине релизов."),
    ],
  },

  interview: [
    iq("sql.migrations-safe-ddl.i1", "basic", "Почему миграции на рабочей базе опаснее, чем на пустой?", [
      ul(
        "Таблицы большие: команды, переписывающие или сканирующие таблицу, занимают время пропорционально размеру.",
        "Блокировки мешают запросам: `ALTER TABLE` берёт `AccessExclusiveLock`.",
        "Во время выкладки работают старая и новая версии кода: схема должна быть совместима с обеими.",
      ),
    ]),
    iq("sql.migrations-safe-ddl.i2", "basic", "Какие команды переписывают таблицу в PostgreSQL?", [
      ul(
        "В замере переписали: `ALTER COLUMN … TYPE bigint`, `ADD COLUMN … GENERATED … STORED`, `ADD COLUMN … DEFAULT random()`.",
        "Не переписали: `ADD COLUMN` без значения, `ADD COLUMN … DEFAULT 0` (PostgreSQL 11+), `DROP COLUMN`.",
        "Проверка: смена `relfilenode` до и после команды на копии данных.",
      ),
    ]),
    iq("sql.migrations-safe-ddl.i3", "intermediate", "Как добавить внешний ключ на большой таблице без долгой блокировки?", [
      ul(
        "`ADD CONSTRAINT … FOREIGN KEY … NOT VALID` — быстро (`ShareRowExclusiveLock`), проверяет только новые записи.",
        "`VALIDATE CONSTRAINT` — проверяет существующие строки с `ShareUpdateExclusiveLock`, не блокируя чтение и запись.",
        "Перед проверкой — найти и исправить «сирот» (в замере `VALIDATE` отказал, пока сирота существовала).",
      ),
    ]),
    iq("sql.migrations-safe-ddl.i4", "intermediate", "Что такое «недействительный индекс» и откуда он берётся?", [
      ul(
        "Индекс с `indisvalid = false`, оставшийся после ошибки `CREATE INDEX CONCURRENTLY` (например, дубль при `UNIQUE`).",
        "Запросами не используется, но обновляется при записи — только вредит.",
        "Исправление: `DROP INDEX CONCURRENTLY`, устранить причину, создать заново.",
      ),
    ]),
    iq("sql.migrations-safe-ddl.i5", "intermediate", "Как безопасно заполнить новый столбец для сотен миллионов строк?", [
      ul(
        "Пакетами: `UPDATE … WHERE id IN (SELECT … WHERE new_col IS NULL LIMIT n)` и `COMMIT` после каждого (в замере 10 000 + 10 000 + 5000).",
        "Паузы между пакетами и контроль задержки репликации; процесс возобновляем по условию `IS NULL`.",
        "Параллельно новый код пишет значение сам, чтобы не появлялись новые пустые строки.",
      ),
    ]),
    iq("sql.migrations-safe-ddl.i6", "advanced", "Как переименовать столбец без простоя?", [
      ul(
        "Расширить: добавить новый столбец и триггер двойной записи (старое и новое приложения работают одновременно, `out_of_sync = 0`).",
        "Мигрировать: заполнить новый столбец пакетами; перевести чтение и запись кода на новый.",
        "Сузить: убрать триггер и старый столбец, когда все версии переведены; прямой `RENAME COLUMN` сломал бы старый код (`column does not exist`).",
      ),
    ]),
    iq("sql.migrations-safe-ddl.i7", "advanced", "Что можно и нельзя делать в транзакции в миграциях PostgreSQL?", [
      ul(
        "DDL транзакционен: ошибка на последнем шаге откатывает всё (замер: таблицы и записи о миграции нет).",
        "Нельзя внутри транзакции: `CREATE INDEX CONCURRENTLY`, `VACUUM`; такие шаги выносят в отдельные миграции.",
        "Тяжёлую миграцию данных не смешивают со схемой в одной транзакции.",
      ),
    ]),
    iq("sql.migrations-safe-ddl.i8", "engineering", "Опишите процесс безопасного выпуска миграции, меняющей тип ключа с integer на bigint в таблице на миллиард строк.", [
      ul(
        "Не использовать `ALTER COLUMN TYPE` напрямую: он переписывает таблицу под `ACCESS EXCLUSIVE`.",
        "Добавить столбец `id_big`, триггер двойной записи, заполнить пакетами; построить индекс `CONCURRENTLY`; проверить `indisvalid`.",
        "Добавить ограничения через `NOT VALID` + `VALIDATE`; подготовить внешние ключи; перевести код на новый столбец.",
        "Переключить ключ (в короткой транзакции с `lock_timeout`) и удалить старый столбец на «сужающем» релизе.",
        "Репетиция на копии боевых данных, мониторинг блокировок и репликации, план отката каждого шага.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.migrations-safe-ddl.e1", "foundation", "Какая команда не переписывает таблицу в PostgreSQL 16?", ["`ALTER COLUMN … TYPE bigint`", "`ADD COLUMN … GENERATED … STORED`", "`ADD COLUMN … DEFAULT 0`", "`ADD COLUMN … DEFAULT random()`"], 2, "Постоянное значение по умолчанию хранится в каталоге; остальные команды требуют вычислить или преобразовать значения всех строк (замер `relfilenode`)."),
    mcq("sql.migrations-safe-ddl.e2", "foundation", "Зачем нужен NOT VALID при добавлении внешнего ключа?", ["Чтобы не проверять существующие строки под долгой блокировкой; проверка — позже `VALIDATE CONSTRAINT`", "Чтобы отключить ограничение навсегда", "Чтобы удалить «сирот»", "Чтобы ускорить запросы"], 0, "`NOT VALID` проверяет только новые записи; `VALIDATE` берёт мягкую блокировку (`ShareUpdateExclusiveLock`)."),
    mcq("sql.migrations-safe-ddl.e3", "foundation", "Какой индекс можно создавать без блокировки записи?", ["Любой `CREATE INDEX`", "Только по первичному ключу", "Только уникальный", "`CREATE INDEX CONCURRENTLY`"], 3, "Обычный `CREATE INDEX` берёт `ShareLock` и блокирует запись (замер); `CONCURRENTLY` строит индекс без этого."),
    mcq("sql.migrations-safe-ddl.e4", "intermediate", "Что остаётся после ошибки `CREATE UNIQUE INDEX CONCURRENTLY` из-за дубля?", ["Ничего", "Недействительный индекс (`indisvalid = f`)", "Действующий индекс без уникальности", "Таблица блокируется навсегда"], 1, "Индекс остаётся в каталоге, обновляется при записи и не используется запросами; его удаляют `DROP INDEX CONCURRENTLY`."),
    mcq("sql.migrations-safe-ddl.e5", "intermediate", "Почему большое заполнение нового столбца делают пакетами с COMMIT?", ["Так быстрее по общему времени всегда", "Для красоты", "Потому что иначе `UPDATE` не работает", "Чтобы не держать долгую транзакцию, блокировки строк и не раздувать журнал"], 3, "Короткие транзакции ограничивают блокировки и нагрузку на репликацию; в замере 10 000 + 10 000 + 5000 строк."),
    mcq("sql.migrations-safe-ddl.e6", "intermediate", "Что произойдёт, если в транзакции миграции последний шаг упал?", ["Применятся первые шаги", "Откатится только последний шаг", "Откатится вся транзакция, включая DDL (в PostgreSQL)", "Миграция зависнет"], 2, "DDL в PostgreSQL транзакционен: в замере не осталось ни таблицы, ни записи в `schema_migrations`."),
    mcq("sql.migrations-safe-ddl.e7", "advanced", "Почему шаг «сузить» (удаление старого столбца) нельзя делать в одном релизе с кодом?", ["Это запрещено синтаксисом", "Старая версия приложения ещё работает и получит `column does not exist`", "Удаление необратимо в любом случае", "Он блокирует индексы"], 1, "При поэтапной выкладке обе версии работают одновременно: сужают только после полного перехода (замер: старый запрос после шага 3 — ошибка)."),
    open("sql.migrations-safe-ddl.e8", "intermediate", "Опишите, как добавить в большую таблицу столбец NOT NULL с внешним ключом, не останавливая сервис.", [
      ul(
        "Добавить столбец без `NOT NULL` и без значения по умолчанию (быстро, без переписывания).",
        "Заполнить значения пакетами с `COMMIT`; новый код сразу пишет значение сам.",
        "Для `NOT NULL`: `CHECK (col IS NOT NULL) NOT VALID`, `VALIDATE CONSTRAINT`, затем `SET NOT NULL` (PostgreSQL 12+ пропустит сканирование), удалить вспомогательный `CHECK`.",
        "Для внешнего ключа: индекс `CONCURRENTLY` по столбцу, затем `ADD FOREIGN KEY … NOT VALID` и `VALIDATE CONSTRAINT`.",
        "Все DDL — с `lock_timeout` и повтором; проверка `indisvalid` и `convalidated`.",
      ),
    ], ["Добавление без переписывания", "Пакетное заполнение", "NOT NULL через CHECK", "FK через NOT VALID и индекс CONCURRENTLY"], { format: "architecture" }),
  ],

  mastery: [
    mcq("sql.migrations-safe-ddl.m1", "intermediate", "Какая блокировка таблицы у `VALIDATE CONSTRAINT` (замер)?", ["`ShareUpdateExclusiveLock`", "`AccessExclusiveLock`", "`ShareLock`", "Блокировки нет"], 0, "Проверка существующих строк не блокирует ни чтение, ни запись — поэтому её выносят в отдельный шаг."),
    mcq("sql.migrations-safe-ddl.m2", "advanced", "После `NOT VALID` в таблице уже есть «сирота». Что произойдёт с `VALIDATE CONSTRAINT`?", ["Пройдёт без ошибок", "Удалит «сироту»", "Откажет, пока строка не исправлена", "Проверит только новые строки"], 2, "`VALIDATE` проверяет все строки и находит нарушение (замер); после исправления данных проверка прошла."),
    mcq("sql.migrations-safe-ddl.m3", "advanced", "Триггер двойной записи в шаблоне «расширить — мигрировать — сузить» нужен для…", ["Согласованности старого и нового столбцов, пока работают обе версии приложения", "Ускорения запросов", "Блокировки таблицы", "Резервного копирования"], 0, "Запись любой версии попадает в оба столбца: в замере `out_of_sync = 0`."),
    open("sql.migrations-safe-ddl.m4", "advanced", "Миграция «добавить уникальный индекс по email» падает на боевой базе с ошибкой дубля, а в тесте проходила. Как вы разберётесь и что измените в процессе?", [
      ul(
        "Найти дубли запросом `GROUP BY email HAVING count(*) > 1`, определить источник (импорт, гонка без ограничения).",
        "Решить судьбу дублей (слияние, переименование, удаление) отдельной проверяемой миграцией данных.",
        "Построить индекс `CREATE UNIQUE INDEX CONCURRENTLY`; убедиться, что `indisvalid = t`; при ошибке удалить недействительный индекс.",
        "Изменить процесс: тестировать миграции на копии боевых данных, добавить проверки инвариантов (дубли, сироты) до миграции, фиксировать результат.",
      ),
    ], ["Поиск и анализ дублей", "Миграция данных отдельно", "CONCURRENTLY и проверка indisvalid", "Тест на копии боевых данных"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.migrations-safe-ddl.f1", front: "Что переписывает таблицу?", back: "ALTER COLUMN TYPE, GENERATED STORED, DEFAULT с изменчивой функцией (random()). Не переписывают: ADD COLUMN без/с постоянным DEFAULT (PG 11+), DROP COLUMN." },
    { id: "sql.migrations-safe-ddl.f2", front: "FK без простоя?", back: "ADD … NOT VALID (быстро, новые записи), затем VALIDATE CONSTRAINT (ShareUpdateExclusiveLock). Перед этим исправить «сирот»." },
    { id: "sql.migrations-safe-ddl.f3", front: "Индекс без блокировки?", back: "CREATE INDEX CONCURRENTLY (не в транзакции). При ошибке остаётся индекс indisvalid = f: DROP INDEX CONCURRENTLY и заново." },
    { id: "sql.migrations-safe-ddl.f4", front: "Заполнение столбца?", back: "Пакетами с COMMIT (LIMIT batch_size, WHERE col IS NULL, стоп при ROW_COUNT = 0); паузы и контроль репликации." },
    { id: "sql.migrations-safe-ddl.f5", front: "Переименование без простоя?", back: "Расширить (новый столбец + триггер двойной записи), мигрировать (заполнение, код), сузить (убрать старое после полного перехода)." },
    { id: "sql.migrations-safe-ddl.f6", front: "Блокировки команд?", back: "ADD/RENAME COLUMN — AccessExclusive; FK NOT VALID — ShareRowExclusive; VALIDATE — ShareUpdateExclusive; CREATE INDEX — Share." },
    { id: "sql.migrations-safe-ddl.f7", front: "DDL в транзакции?", back: "PostgreSQL: транзакционен, миграция атомарна. Нельзя: CREATE INDEX CONCURRENTLY, VACUUM." },
    { id: "sql.migrations-safe-ddl.f8", front: "Перед миграцией?", back: "lock_timeout + повтор, тест на копии боевых данных, план отката, мониторинг блокировок и репликации." },
  ],

  sources: [
    { title: "PostgreSQL 16: ALTER TABLE (notes on rewrites, NOT VALID, VALIDATE CONSTRAINT)", url: "https://www.postgresql.org/docs/16/sql-altertable.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: CREATE INDEX (building indexes concurrently)", url: "https://www.postgresql.org/docs/16/sql-createindex.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Explicit Locking (table-level lock modes)", url: "https://www.postgresql.org/docs/16/explicit-locking.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Modifying Tables", url: "https://www.postgresql.org/docs/16/ddl-alter.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: PL/pgSQL Transaction Management (COMMIT in procedures)", url: "https://www.postgresql.org/docs/16/plpgsql-transactions.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Trigger Functions", url: "https://www.postgresql.org/docs/16/plpgsql-trigger.html", publisher: "PostgreSQL" },
  ],
};
