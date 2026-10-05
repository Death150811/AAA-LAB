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

export const lockingDeadlocks: Topic = {
  id: "sql.locking-deadlocks",
  slug: "locking-deadlocks",
  domain: "sql",
  module: "transactions",
  title: "Блокировки и взаимоблокировки",
  titleEn: "Locking and Deadlocks",
  summary:
    "Блокировки — цена согласованности: чтобы две транзакции не затёрли друг друга, одна ждёт другую. Тема на замерах двух-трёх реальных сеансов PostgreSQL 16.14: вторая транзакция, изменяющая ту же строку, ждёт (`wait_event = transactionid`, 1 блокирующий), а соседняя строка свободна, `SELECT … FOR UPDATE NOWAIT` отвечает ошибкой `55P03`, `SKIP LOCKED` отдаёт следующему воркеру следующее задание (1, 2, 3, у четвёртого — ничего, после отката первого — снова 1), `lock_timeout` обрывает ожидание, взаимоблокировка двух переводов `1 → 2` и `2 → 1` обнаруживается как `deadlock detected` (`40P01`; жертвой стал сеанс, ждавший дольше) и исчезает при блокировке счетов по порядку `id`, `ALTER TABLE` встаёт в очередь за открытой транзакцией и блокирует даже обычные `SELECT`, а с коротким `lock_timeout` миграция сдаётся и никому не мешает.",
  minutes: 90,
  prerequisites: ["sql.acid-transactions", "sql.isolation-levels", "sql.insert-update-delete"],
  tags: ["lock", "row lock", "table lock", "FOR UPDATE", "NOWAIT", "SKIP LOCKED", "deadlock", "deadlock_timeout", "lock_timeout", "advisory lock", "lock queue", "ACCESS EXCLUSIVE", "pg_locks", "pg_stat_activity", "job queue"],
  keyConcepts: [
    { term: "Конфликтуют только записи одной строки", text: "Пока A не завершил `UPDATE` строки 1, B, меняющий ту же строку, ждёт (`Lock | transactionid`), а B или C, меняющие строку 2, работают без задержек." },
    { term: "Ожидание можно ограничить или отменить", text: "`FOR UPDATE NOWAIT` — сразу ошибка `55P03`; `lock_timeout = '300ms'` — ошибка через 300 мс (`canceling statement due to lock timeout`); `SKIP LOCKED` — пропустить занятые строки." },
    { term: "Взаимоблокировка — цикл ожиданий", text: "A держит строку 1 и ждёт 2, B держит 2 и ждёт 1: PostgreSQL находит цикл и отменяет одну транзакцию с ошибкой `deadlock detected` (SQLSTATE `40P01`); вторая завершается." },
    { term: "Лекарство — единый порядок блокировок", text: "Если обе транзакции берут строки по возрастанию `id`, B просто ждёт A: без цикла нет взаимоблокировки (итог 950 и 550)." },
    { term: "DDL встаёт в очередь и блокирует всех", text: "`ALTER TABLE` ждёт `ACCESS EXCLUSIVE`, а новые обычные `SELECT` встают в очередь за ним. С `lock_timeout` миграция сдаётся (`55P03`) и очередь не образуется." },
    { term: "SKIP LOCKED — основа очередей в БД", text: "Три воркера получили задания 1, 2, 3, четвёртый — ничего; после отката первого воркера задание 1 стало доступно снова." },
  ],
  sections: [
    section("definition", [
      def("Блокировка", "Механизм, который не позволяет конфликтующим операциям выполняться одновременно: одна транзакция получает блокировку, другие ждут её освобождения (в конце транзакции).", "lock"),
      def("Блокировка строки", "Блокировка конкретной строки, возникающая при `UPDATE`, `DELETE` и явно — при `SELECT … FOR UPDATE / FOR SHARE`. Читатели без `FOR …` её не замечают.", "row-level lock"),
      def("Блокировка таблицы", "Блокировка всей таблицы одного из режимов (от `ACCESS SHARE` до `ACCESS EXCLUSIVE`); берётся автоматически командами и явно `LOCK TABLE`.", "table-level lock"),
      def("Взаимоблокировка", "Ситуация, когда транзакции ждут друг друга по кругу и ни одна не может продолжить; СУБД разрывает цикл, отменяя одну из них.", "deadlock"),
      def("Очередь блокировок", "Порядок ожидающих запросов: новый запрос не обгоняет более ранний конфликтующий, даже если сам с владельцем блокировки не конфликтует.", "lock queue"),
      def("NOWAIT / SKIP LOCKED", "Модификаторы `FOR UPDATE`: `NOWAIT` — сразу ошибка, если строка занята; `SKIP LOCKED` — занятые строки пропускаются.", "NOWAIT / SKIP LOCKED"),
      def("lock_timeout", "Параметр, ограничивающий ожидание блокировки: по истечении команда отменяется с ошибкой `55P03`.", "lock_timeout"),
      def("Консультативная блокировка", "Блокировка на произвольное число или пару чисел, не связанная со строками и таблицами; приложение само решает, что она означает.", "advisory lock"),
    ]),

    section("why", [
      h("Согласованность стоит ожидания"),
      p("Если две транзакции одновременно меняют одну строку, одна должна подождать другую — иначе изменения затрут друг друга. Блокировки — это не «баг производительности», а механизм, делающий параллельный доступ корректным. Проблемы начинаются, когда ожидание непредсказуемо долгое (транзакция держит блокировку, пока ждёт внешний сервис), циклическое (взаимоблокировка) или распространяется шире, чем нужно (миграция блокирует всю таблицу для всех)."),
      ul(
        "**Корректность:** `UPDATE` и `SELECT … FOR UPDATE` не дают потерять изменения.",
        "**Очереди и воркеры:** `SKIP LOCKED` распределяет задания без двойной обработки.",
        "**Надёжные миграции:** понимание очереди блокировок отличает безопасный `ALTER TABLE` от остановки сервиса.",
        "**Диагностика:** `pg_stat_activity` и `pg_locks` отвечают на вопрос «кто кого ждёт».",
      ),
      note("Читатели в PostgreSQL не блокируют писателей и не блокируются ими (MVCC): обычный `SELECT` ждёт только при DDL и явных блокировках таблицы."),
    ]),

    section("mental-model", [
      h("Блокировка — это «занято» на двери кабинета"),
      p("Строка — кабинет с табличкой. Тот, кто изменяет строку, вешает табличку «занято» и снимает её только в конце транзакции (`COMMIT` или `ROLLBACK`), а не после своей команды. Остальные, которым нужен тот же кабинет, встают в очередь. Взаимоблокировка — когда двое заняли по кабинету и каждый ждёт, пока освободится кабинет другого. Выход из положения — решение «кто уступит» (СУБД отменяет одну транзакцию) или правило «все ходят по кабинетам в одном порядке» (тогда цикл невозможен)."),
      diagram(
        `
        Взаимоблокировка:                            Единый порядок блокировок:

        A: держит строку 1 ──ждёт──► строка 2        A: берёт 1, затем 2 ─────────► COMMIT
        B: держит строку 2 ──ждёт──► строка 1        B: ждёт 1 ──(после A)── берёт 1, затем 2
              ▲                          │
              └──────── цикл ◄───────────┘           Цикл невозможен: ждать можно только «вперёд» по id.
        `,
        "Цикл ожиданий невозможен, если все транзакции берут ресурсы в одном порядке.",
      ),
      h("Алгоритм разбора «всё зависло»"),
      steps(
        [
          ["Найти ожидающих", "`pg_stat_activity`: `wait_event_type = 'Lock'`."],
          ["Узнать, кого они ждут", "`pg_blocking_pids(pid)` возвращает блокирующие сеансы."],
          ["Выяснить, что держит блокирующий", "Часто — «простаивающая» транзакция (`idle in transaction`) без `COMMIT`."],
          ["Устранить причину", "Короче транзакции, единый порядок, `NOWAIT`/`SKIP LOCKED`, `lock_timeout`."],
          ["Закрепить повтором", "Приложение умеет повторять транзакцию при `40P01`."],
        ],
        "Диагностика блокировок",
      ),
    ]),

    section("technical", [
      h("Блокировки строк"),
      table(
        ["Режим", "Берётся при", "Конфликтует с"],
        [
          ["`FOR UPDATE`", "`DELETE`, `UPDATE` ключевых столбцов, `SELECT … FOR UPDATE`", "Любой блокировкой строки"],
          ["`FOR NO KEY UPDATE`", "Обычный `UPDATE` без смены ключа", "Все, кроме `FOR KEY SHARE`"],
          ["`FOR SHARE`", "`SELECT … FOR SHARE`", "`FOR UPDATE` и `FOR NO KEY UPDATE`"],
          ["`FOR KEY SHARE`", "Проверки внешних ключей", "Только `FOR UPDATE`"],
        ],
        "Режимы блокировок строк PostgreSQL",
      ),
      h("Блокировки таблицы"),
      table(
        ["Режим", "Берут команды", "Замер"],
        [
          ["`ACCESS SHARE`", "`SELECT`", "`AccessShareLock`"],
          ["`ROW SHARE`", "`SELECT … FOR UPDATE / SHARE`", "`RowShareLock`"],
          ["`ROW EXCLUSIVE`", "`INSERT`, `UPDATE`, `DELETE`", "`RowExclusiveLock`"],
          ["`SHARE`", "`CREATE INDEX` (без `CONCURRENTLY`)", "—"],
          ["`ACCESS EXCLUSIVE`", "`ALTER TABLE`, `DROP TABLE`, `TRUNCATE`, `VACUUM FULL`", "`AccessExclusiveLock`"],
        ],
        "Режимы блокировок таблицы (самые частые)",
      ),
      h("Управление ожиданием"),
      ul(
        "**`FOR UPDATE NOWAIT`:** не ждать, ошибка `55P03` сразу.",
        "**`FOR UPDATE SKIP LOCKED`:** пропустить занятые строки — очереди заданий.",
        "**`SET lock_timeout = '…'`:** ограничить ожидание любой блокировки.",
        "**`deadlock_timeout`** (по умолчанию 1 секунда): через сколько ожидания PostgreSQL проверяет цикл; в демонстрациях уменьшают до 200 мс.",
        "**`idle_in_transaction_session_timeout`:** завершать сеансы, оставившие транзакцию открытой.",
      ),
      warn("Блокировки снимаются **в конце транзакции**, а не в конце команды. Открытая транзакция с незавершённым `UPDATE` держит строку, пока не будет `COMMIT` или `ROLLBACK`."),
    ]),

    section("syntax", [
      p("Забрать одно свободное задание из очереди одной командой: подзапрос блокирует кандидата и пропускает занятых другими воркерами."),
      annotated(
        "sql",
        `-- Взять одно свободное задание, пропустив занятые другими воркерами
UPDATE jobs SET status = 'running', worker = 'w1'
WHERE id = (
  SELECT id FROM jobs
  WHERE status = 'new'
  ORDER BY id
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING id;`,
        [
          { line: 1, text: "Комментарий формулирует задачу: каждый воркер берёт своё задание без ожидания остальных." },
          { line: 2, text: "`UPDATE` переводит выбранное задание в `running` и запоминает воркера." },
          { line: [3, 9], text: "Подзапрос выбирает идентификатор задания, которое нужно обновить." },
          { line: 5, text: "Кандидаты — только свободные задания (`status = 'new'`)." },
          { line: 6, text: "Порядок задаёт, какое задание считается «первым»." },
          { line: 7, text: "`FOR UPDATE SKIP LOCKED` блокирует выбранную строку и пропускает строки, уже заблокированные другими транзакциями." },
          { line: 8, text: "`LIMIT 1` — по одному заданию за раз." },
          { line: 10, text: "`RETURNING id` отдаёт воркеру номер его задания; пустой результат означает «заданий нет»." },
        ],
        "12-queue-claim.pg.sql",
      ),
    ]),

    section("minimal-example", [
      p("Две транзакции меняют одну строку: вторая ждёт. Третий сеанс C — наблюдатель, он спрашивает системное представление, кто чего ждёт, и свободно меняет другую строку."),
      code("text", `-- Две транзакции меняют одну строку: вторая ждёт первую
A> BEGIN
A> UPDATE accounts SET balance = balance - 100 WHERE id = 1
     → UPDATE 1
B> UPDATE accounts SET balance = balance + 5 WHERE id = 1   (ждёт…)
-- наблюдатель C смотрит, кто чего ждёт
C> SELECT wait_event_type, wait_event, cardinality(pg_blocking_pids(pid)) AS blockers FROM pg_stat_activity WHERE query LIKE 'UPDATE accounts SET balance = balance + 5%' AND pid <> pg_backend_pid()
     → wait_event_type, wait_event, blockers: Lock | transactionid | 1
-- строки, заблокированные A, но не изменённые, B свободно меняет
C> UPDATE accounts SET balance = balance + 1 WHERE id = 2
     → UPDATE 1
A> COMMIT
B  ← UPDATE 1
C> SELECT id, balance FROM accounts ORDER BY id
     → id, balance: 1 | 905; 2 | 501`, { filename: "01: ожидание строки (PostgreSQL 16.14, три сеанса)" }),
      ul(
        "B ждёт, пока A не зафиксирует: ожидание — на идентификаторе транзакции A (`Lock | transactionid`), блокирующий один (`blockers = 1`).",
        "Строка 2 не заблокирована A, поэтому C меняет её мгновенно.",
        "После `COMMIT` A команда B выполняется поверх нового значения: 900 + 5 = 905.",
      ),
    ]),

    section("detailed-example", [
      h("Не ждать: NOWAIT, SKIP LOCKED, lock_timeout"),
      code("text", `-- NOWAIT: не ждать, а сразу получить ошибку
A> BEGIN
A> SELECT id FROM jobs WHERE id = 1 FOR UPDATE
     → id: 1
B> SELECT id FROM jobs WHERE id = 1 FOR UPDATE NOWAIT
     ✗ ERROR [55P03]: could not obtain lock on row in relation "jobs"

-- SKIP LOCKED: пропустить занятые строки (очередь заданий)
B> BEGIN
B> SELECT id FROM jobs WHERE status = 'new' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1
     → id: 2
A> COMMIT
B> COMMIT`, { filename: "02: NOWAIT и SKIP LOCKED (PostgreSQL 16.14)" }),
      p("`NOWAIT` сразу вернул `could not obtain lock on row in relation \"jobs\"` (`55P03`). `SKIP LOCKED` пропустил занятую A строку 1 и вернул следующую (2)."),
      code("text", `-- lock_timeout ограничивает ожидание блокировки
A> BEGIN
A> UPDATE accounts SET balance = 0 WHERE id = 1
     → UPDATE 1
B> SET lock_timeout = '300ms'
B> UPDATE accounts SET balance = 5 WHERE id = 1
     ✗ ERROR [55P03]: canceling statement due to lock timeout
A> ROLLBACK
B> UPDATE accounts SET balance = 5 WHERE id = 1
     → UPDATE 1`, { filename: "03: lock_timeout (PostgreSQL 16.14)" }),
      p("С `lock_timeout = '300ms'` B ждал 300 мс и получил `canceling statement due to lock timeout` — приложение может решить, что делать, вместо бесконечного зависания. После отката A повторная попытка прошла."),
      h("Взаимоблокировка"),
      code("text", `-- A переводит 1 → 2, B одновременно 2 → 1: транзакции берут блокировки в разном порядке
A> BEGIN
B> BEGIN
A> UPDATE accounts SET balance = balance - 100 WHERE id = 1
     → UPDATE 1
B> UPDATE accounts SET balance = balance - 50 WHERE id = 2
     → UPDATE 1
A> UPDATE accounts SET balance = balance + 100 WHERE id = 2   (ждёт…)
B> UPDATE accounts SET balance = balance + 50 WHERE id = 1   (ждёт…)
A  ✗ ERROR [40P01]: deadlock detected
B  ← UPDATE 1
A> ROLLBACK
B> COMMIT
B> SELECT id, balance FROM accounts ORDER BY id
     → id, balance: 1 | 1050; 2 | 450`, { filename: "04: взаимоблокировка (PostgreSQL 16.14)" }),
      ul(
        "A держит строку 1 и просит строку 2, B держит строку 2 и просит строку 1 — цикл.",
        "После `deadlock_timeout` (в демонстрации 200 мс) PostgreSQL обнаружил цикл и отменил одну транзакцию — `deadlock detected`, SQLSTATE `40P01`. Здесь жертвой стал сеанс A, ждавший дольше; на это правило полагаться нельзя.",
        "Вторая транзакция (B) продолжилась и зафиксировалась: итог 1050 и 450 (выполнен только перевод B). Отменённую транзакцию приложение должно **повторить**.",
      ),
    ]),

    section("analysis", [
      table(
        ["Сценарий", "Результат (замер)", "Вывод"],
        [
          ["Две записи одной строки", "B ждёт, `transactionid`, 1 блокирующий", "Конфликт только по одной строке"],
          ["Запись соседней строки", "Без ожидания", "Блокировки поштучные"],
          ["`FOR UPDATE NOWAIT`", "`55P03` сразу", "Не ждать"],
          ["`lock_timeout = 300ms`", "`55P03` через 300 мс", "Ограничение ожидания"],
          ["Переводы `1→2` и `2→1`", "`40P01 deadlock detected`", "Цикл ожиданий"],
          ["Те же переводы, блокировка по порядку `id`", "Ожидание без цикла; 950 и 550", "Единый порядок устраняет deadlock"],
          ["`ALTER TABLE` за открытой транзакцией", "Новый `SELECT` — `lock timeout`", "DDL блокирует очередь"],
          ["`ALTER TABLE` с `lock_timeout`", "`55P03`, `SELECT` идёт без задержки", "Миграция уступает"],
        ],
        "Что показали замеры PostgreSQL 16.14",
      ),
      h("Единый порядок блокировок"),
      code("text", `-- Те же два перевода, но счета всегда блокируются по возрастанию id
A> BEGIN
B> BEGIN
A> SELECT id FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE
     → id: 1; 2
B> SELECT id FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE   (ждёт…)
A> UPDATE accounts SET balance = balance - 100 WHERE id = 1
     → UPDATE 1
A> UPDATE accounts SET balance = balance + 100 WHERE id = 2
     → UPDATE 1
A> COMMIT
B  ← id: 1; 2
B> UPDATE accounts SET balance = balance - 50 WHERE id = 2
     → UPDATE 1
B> UPDATE accounts SET balance = balance + 50 WHERE id = 1
     → UPDATE 1
B> COMMIT
A> SELECT id, balance FROM accounts ORDER BY id
     → id, balance: 1 | 950; 2 | 550`, { filename: "05: единый порядок (PostgreSQL 16.14)" }),
      p("Обе транзакции сначала блокируют оба счёта `ORDER BY id FOR UPDATE`. Вторая просто ждёт, пока первая зафиксируется, и затем выполняет свои изменения: итог 950 и 550 без ошибок. Любое правило, которое все транзакции соблюдают одинаково (по возрастанию `id`, по алфавиту ключей), делает цикл ожиданий невозможным."),
      h("Какие блокировки таблицы берут команды"),
      code("sql", `CREATE TABLE accounts (id integer PRIMARY KEY, owner text NOT NULL, balance integer NOT NULL);
INSERT INTO accounts VALUES (1, 'Анна', 1000);

-- Блокировки таблицы, которые берёт текущая транзакция
BEGIN;
SELECT count(*) FROM accounts;
SELECT 'SELECT' AS command, mode FROM pg_locks WHERE relation = 'accounts'::regclass AND pid = pg_backend_pid() ORDER BY mode;
ROLLBACK;

BEGIN;
SELECT id FROM accounts FOR UPDATE;
SELECT 'SELECT FOR UPDATE' AS command, mode FROM pg_locks WHERE relation = 'accounts'::regclass AND pid = pg_backend_pid() ORDER BY mode;
ROLLBACK;

BEGIN;
UPDATE accounts SET balance = balance + 1;
SELECT 'UPDATE' AS command, mode FROM pg_locks WHERE relation = 'accounts'::regclass AND pid = pg_backend_pid() ORDER BY mode;
ROLLBACK;

BEGIN;
ALTER TABLE accounts ADD COLUMN note text;
SELECT 'ALTER TABLE' AS command, mode FROM pg_locks WHERE relation = 'accounts'::regclass AND pid = pg_backend_pid() ORDER BY mode;
ROLLBACK;`, { filename: "07-lock-modes.pg.sql" }),
      code("text", ` count 
-------
     1
(1 row)

 command |      mode       
---------+-----------------
 SELECT  | AccessShareLock
(1 row)

 id 
----
  1
(1 row)

      command      |     mode     
-------------------+--------------
 SELECT FOR UPDATE | RowShareLock
(1 row)

 command |       mode       
---------+------------------
 UPDATE  | RowExclusiveLock
(1 row)

   command   |        mode         
-------------+---------------------
 ALTER TABLE | AccessExclusiveLock
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Обычный `SELECT` берёт `AccessShareLock`, `SELECT … FOR UPDATE` — `RowShareLock`, `UPDATE` — `RowExclusiveLock`, `ALTER TABLE` — `AccessExclusiveLock`. Строковые блокировки в `pg_locks` не видны: они хранятся в самих версиях строк, а ожидание строки отображается как ожидание идентификатора транзакции."),
    ]),

    section("internals", [
      h("DDL и очередь блокировок"),
      code("text", `-- A держит открытую транзакцию после обычного SELECT
A> BEGIN
A> SELECT count(*) FROM accounts
     → count: 1
-- B выполняет миграцию: ALTER TABLE ждёт, пока A закончит
B> ALTER TABLE accounts ADD COLUMN note text   (ждёт…)
-- C делает обычный SELECT — и тоже ждёт, встав в очередь за ALTER
C> SELECT count(*) FROM accounts
     ✗ ERROR [55P03]: canceling statement due to lock timeout
A> COMMIT
B  ← ALTER
C> SELECT count(*) FROM accounts
     → count: 1`, { filename: "06: ALTER TABLE в очереди (PostgreSQL 16.14)" }),
      p("Транзакция A после обычного `SELECT` ничего не делает, но держит `AccessShareLock`. `ALTER TABLE` просит `ACCESS EXCLUSIVE` — конфликтует с A и ждёт. Обычный `SELECT` из сеанса C сам с A не конфликтует, но встаёт **в очередь за ALTER** и не проходит (в замере `lock timeout` через 400 мс). Одна забытая открытая транзакция плюс миграция останавливает все чтения таблицы."),
      code("text", `-- Безопасная миграция: DDL ждёт блокировку недолго и сдаётся, не задерживая остальных
A> BEGIN
A> SELECT count(*) FROM accounts
     → count: 1
B> ALTER TABLE accounts ADD COLUMN note text
     ✗ ERROR [55P03]: canceling statement due to lock timeout
-- пока ALTER не стоит в очереди, обычные запросы идут без задержки
C> SELECT count(*) FROM accounts
     → count: 1
A> COMMIT
-- A закончил: повторная попытка миграции проходит сразу
B> ALTER TABLE accounts ADD COLUMN note text
     → ALTER`, { filename: "11: миграция с lock_timeout (PostgreSQL 16.14)" }),
      p("С `lock_timeout = '200ms'` миграция сдалась через 200 мс и в очередь не встала: обычный `SELECT` прошёл без задержки. После завершения A повтор миграции прошёл мгновенно. Поэтому DDL в рабочей базе выполняют с коротким `lock_timeout` и повторами."),
      h("Очередь заданий с SKIP LOCKED"),
      code("text", `-- Три воркера берут задания одновременно (транзакции открыты, пока задание «выполняется»)
W1> BEGIN
W2> BEGIN
W3> BEGIN
W1> UPDATE jobs SET status = 'running', worker = 'w1' WHERE id = (SELECT id FROM jobs WHERE status = 'new' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id
     → id: 1
W2> UPDATE jobs SET status = 'running', worker = 'w2' WHERE id = (SELECT id FROM jobs WHERE status = 'new' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id
     → id: 2
W3> UPDATE jobs SET status = 'running', worker = 'w3' WHERE id = (SELECT id FROM jobs WHERE status = 'new' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id
     → id: 3
-- четвёртый воркер ничего не получает: все задания заняты
W4> UPDATE jobs SET status = 'running', worker = 'w4' WHERE id = (SELECT id FROM jobs WHERE status = 'new' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id
     → id: (нет строк)
-- воркер W1 упал: откат освобождает его задание
W1> ROLLBACK
W4> UPDATE jobs SET status = 'running', worker = 'w4' WHERE id = (SELECT id FROM jobs WHERE status = 'new' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id
     → id: 1
W2> COMMIT
W3> COMMIT
W4> SELECT id, status, worker FROM jobs ORDER BY id
     → id, status, worker: 1 | running | w4; 2 | running | w2; 3 | running | w3`, { filename: "10: воркеры (PostgreSQL 16.14)" }),
      ul(
        "Три воркера с открытыми транзакциями получили три разных задания — никто не ждал и не взял чужое.",
        "Четвёртый не получил ничего (`RETURNING` вернул 0 строк): задания заняты.",
        "Воркер W1 «упал» (`ROLLBACK`): статус вернулся в `new`, и четвёртый воркер сразу забрал задание 1 — очередь самовосстанавливается.",
      ),
      h("Консультативные блокировки"),
      code("text", `-- Консультативная блокировка: «флажок» на произвольное число, например, на задание по расписанию
A> SELECT pg_try_advisory_lock(42) AS got_lock
     → got_lock: true
B> SELECT pg_try_advisory_lock(42) AS got_lock
     → got_lock: false
A> SELECT pg_advisory_unlock(42) AS released
     → released: true
B> SELECT pg_try_advisory_lock(42) AS got_lock
     → got_lock: true`, { filename: "08: консультативная блокировка (PostgreSQL 16.14)" }),
      p("`pg_try_advisory_lock(42)` — «флажок» с номером 42: первый сеанс получил `true`, второй — `false` без ожидания; после `pg_advisory_unlock` второй смог получить. Так обеспечивают единственного исполнителя фонового задания. Блокировка сеансовая: она держится до явного снятия или конца сеанса, а не транзакции (для транзакционной есть `pg_advisory_xact_lock`)."),
    ]),

    section("mistakes", [
      h("Ошибка: блокировки в разном порядке"),
      wrongRight(
        "sql",
        { title: "Каждый берёт «свой» счёт первым", code: `-- A: счёт 1, затем 2\n-- B: счёт 2, затем 1`, note: "Образуется цикл ожиданий: `deadlock detected` (`40P01`), одна транзакция отменяется." },
        { title: "Единый порядок", code: `SELECT id FROM accounts\nWHERE id IN (1, 2)\nORDER BY id FOR UPDATE;`, note: "Обе транзакции берут строки по возрастанию `id`: вторая ждёт первую, цикла нет." },
      ),
      h("Ошибка: долгая транзакция держит блокировки"),
      p("Транзакция, открытая «пока пользователь заполняет форму» или пока выполняется внешний вызов, держит блокировки строк и мешает очистке. В `pg_stat_activity` такие сеансы видны как `idle in transaction`."),
      h("Ошибка: DDL без lock_timeout"),
      p("`ALTER TABLE` встал в очередь за забытой транзакцией, и все новые чтения таблицы ждут за ним (замер: `lock timeout` у обычного `SELECT`). Выполняйте DDL с `SET lock_timeout = '2s'` и повторами."),
      h("Ошибка: не обрабатывать 40P01"),
      p("Взаимоблокировка — штатная ситуация. Приложение должно повторить транзакцию целиком (с ограничением числа попыток), а не показывать пользователю ошибку."),
      h("Ошибка: FOR UPDATE по слишком широкому набору"),
      p("`SELECT * FROM orders WHERE status = 'new' FOR UPDATE` блокирует все новые заказы, пока транзакция не завершится. Блокируйте только то, что собираетесь менять (`LIMIT`, `SKIP LOCKED`, точное условие)."),
      h("Ошибка: LOCK TABLE ради одной строки"),
      p("Блокировка таблицы останавливает всех. Для защиты одной строки хватает `FOR UPDATE` по ключу."),
      h("Ошибка: опираться на то, какая транзакция станет жертвой"),
      p("В замере жертвой стал сеанс, ждавший дольше, но PostgreSQL не гарантирует это. Корректная система не должна зависеть от выбора жертвы."),
    ]),

    section("antipatterns", [
      ul(
        "**«Всё в одной длинной транзакции»**, включая внешние вызовы.",
        "**Блокировка в произвольном порядке** ради «логичности» кода.",
        "**`LOCK TABLE` и `ALTER TABLE` в рабочее время без таймаутов.**",
        "**Очередь заданий на `SELECT … FOR UPDATE` без `SKIP LOCKED`:** воркеры стоят друг за другом.",
        "**Повторная попытка отдельной команды после `40P01`** вместо всей транзакции.",
        "**Бесконечное ожидание:** ни `lock_timeout`, ни `statement_timeout`.",
        "**Консультативные блокировки без освобождения** в сеансе, живущем в пуле соединений.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Держите транзакции короткими;** внешние вызовы — до или после.",
        "**Единый порядок блокировок** (по возрастанию ключа) во всех транзакциях, затрагивающих несколько строк.",
        "**Блокируйте только нужное:** точное условие, `LIMIT`, `FOR UPDATE` только когда нужна блокировка.",
        "**Для очередей — `FOR UPDATE SKIP LOCKED`** (и откат возвращает задание в очередь).",
        "**Для миграций — `lock_timeout` и повторы;** DDL в часы минимальной нагрузки.",
        "**Ограничивайте время:** `lock_timeout`, `statement_timeout`, `idle_in_transaction_session_timeout`.",
        "**Обрабатывайте `40P01` и `55P03`:** повтор транзакции, логирование доли повторов.",
        "**Мониторьте:** запросы к `pg_stat_activity` и `pg_blocking_pids` в дежурном наборе скриптов.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Внешние ключи:** вставка в дочернюю таблицу берёт `FOR KEY SHARE` на родителя; массовые изменения родителя могут ждать дочерние вставки.",
        "**Блокировки индексов:** `CREATE INDEX` без `CONCURRENTLY` блокирует записи; с `CONCURRENTLY` — дольше, но без остановки записи.",
        "**Взаимоблокировка из трёх и более транзакций:** принцип тот же; обнаруживается циклом в графе ожиданий.",
        "**Эскалации блокировок в PostgreSQL нет:** тысячи строковых блокировок не превращаются в блокировку таблицы (в отличие от некоторых других СУБД).",
        "**Консультативные блокировки и пулы соединений:** сеансовая блокировка остаётся за соединением; транзакционный пулер может вернуть соединение другому клиенту — используйте `pg_advisory_xact_lock`.",
        "**SQLite:** запись блокирует всю базу (одна запись за раз); `FOR UPDATE` не поддерживается, примеры темы выполняются в PostgreSQL.",
      ),
    ]),

    section("related", [
      ul(
        "[Транзакции и ACID](/learn/sql/acid-transactions) — границы транзакций и откат, освобождающий блокировки.",
        "[Уровни изоляции](/learn/sql/isolation-levels) — `FOR UPDATE`, перепроверка `WHERE`, потерянные обновления.",
        "[Связи между таблицами](/learn/sql/relationships) — внешние ключи и их блокировки.",
        "[Миграции и безопасный DDL](/learn/sql/migrations-safe-ddl) — `lock_timeout`, `NOT VALID`, `CONCURRENTLY`.",
        "[Индексы и B-дерево](/learn/sql/indexes-btree) — `CREATE INDEX CONCURRENTLY`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Миграция без таймаута",
          code: `ALTER TABLE accounts ADD COLUMN note text;`,
          note: "Ждёт `ACCESS EXCLUSIVE` за забытой транзакцией, а новые `SELECT` встают в очередь за ней (замер: `lock timeout` у обычного чтения).",
        },
        {
          title: "Миграция с lock_timeout",
          code: `SET lock_timeout = '200ms';\nALTER TABLE accounts ADD COLUMN note text;\n-- при ошибке 55P03 повторить позже`,
          note: "Миграция сдаётся через 200 мс и в очередь не встаёт: чтения идут без задержки; позже попытку повторяют.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.locking-deadlocks.ex1",
      title: "Будет ли взаимоблокировка?",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("A меняет строки 1, затем 2. B меняет строку 3, затем 2. Определите: возникнет ли взаимоблокировка, кто будет ждать и что произойдёт после `COMMIT` A. Затем сверьтесь с трассой."),
      ],
      hints: ["Нужен ли A ресурс, который держит B?", "Есть ли цикл в графе ожиданий?"],
      checks: ["Взаимоблокировки нет: B ждёт A, A никого не ждёт", "После `COMMIT` A команда B выполняется"],
      solution: [
        code("text", `A> BEGIN
B> BEGIN
A> UPDATE accounts SET balance = balance - 10 WHERE id = 1
     → UPDATE 1
B> UPDATE accounts SET balance = balance - 10 WHERE id = 3
     → UPDATE 1
A> UPDATE accounts SET balance = balance + 10 WHERE id = 2
     → UPDATE 1
B> UPDATE accounts SET balance = balance + 10 WHERE id = 2   (ждёт…)
A> COMMIT
B  ← UPDATE 1
B> COMMIT
A> SELECT id, balance FROM accounts ORDER BY id
     → id, balance: 1 | 990; 2 | 520; 3 | 290`, { filename: "результат (PostgreSQL 16.14, два сеанса)" }),
        p("Ожидание односторонне: B просит строку 2, которую держит A, а A не просит ничего из того, что держит B (строки 3). Цикла нет, значит нет и взаимоблокировки: B дожидается `COMMIT` A и продолжает. Итог: строка 2 получила две прибавки — 500 + 10 + 10 = 520."),
      ],
    }),
    exercise({
      id: "sql.locking-deadlocks.ex2",
      title: "Переводы «зависают» по вечерам",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Вечером при встречных переводах между счетами 1 и 2 периодически приходит `deadlock detected`. Объясните причину по трассе и исправьте так, чтобы взаимоблокировок не было."),
        code("text", `-- A переводит 1 → 2, B одновременно 2 → 1: транзакции берут блокировки в разном порядке
A> BEGIN
B> BEGIN
A> UPDATE accounts SET balance = balance - 100 WHERE id = 1
     → UPDATE 1
B> UPDATE accounts SET balance = balance - 50 WHERE id = 2
     → UPDATE 1
A> UPDATE accounts SET balance = balance + 100 WHERE id = 2   (ждёт…)
B> UPDATE accounts SET balance = balance + 50 WHERE id = 1   (ждёт…)
A  ✗ ERROR [40P01]: deadlock detected
B  ← UPDATE 1
A> ROLLBACK
B> COMMIT
B> SELECT id, balance FROM accounts ORDER BY id
     → id, balance: 1 | 1050; 2 | 450`, { filename: "воспроизведение (PostgreSQL 16.14)" }),
      ],
      hints: ["В каком порядке каждая транзакция берёт строки?", "Как сделать порядок одинаковым независимо от направления перевода?"],
      checks: ["Транзакции блокируют строки в разном порядке: цикл ожиданий", "Исправление: `SELECT … WHERE id IN (…) ORDER BY id FOR UPDATE` в начале каждой транзакции"],
      solution: [
        code("text", `-- Те же два перевода, но счета всегда блокируются по возрастанию id
A> BEGIN
B> BEGIN
A> SELECT id FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE
     → id: 1; 2
B> SELECT id FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE   (ждёт…)
A> UPDATE accounts SET balance = balance - 100 WHERE id = 1
     → UPDATE 1
A> UPDATE accounts SET balance = balance + 100 WHERE id = 2
     → UPDATE 1
A> COMMIT
B  ← id: 1; 2
B> UPDATE accounts SET balance = balance - 50 WHERE id = 2
     → UPDATE 1
B> UPDATE accounts SET balance = balance + 50 WHERE id = 1
     → UPDATE 1
B> COMMIT
A> SELECT id, balance FROM accounts ORDER BY id
     → id, balance: 1 | 950; 2 | 550`, { filename: "исправление (PostgreSQL 16.14)" }),
        p("Каждый перевод сначала блокирует оба счёта по возрастанию `id`, независимо от направления перевода. Вторая транзакция ждёт первую, цикл невозможен: оба перевода выполнились (950 и 550). Дополнительно приложение должно уметь повторять транзакцию при `40P01`: порядок блокировок снижает вероятность, но не заменяет повтор."),
      ],
    }),
    exercise({
      id: "sql.locking-deadlocks.ex3",
      title: "Миграция, которая не должна остановить сервис",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("В таблицу нужно добавить столбец на боевой базе, где бывают долгие транзакции. Опишите безопасную стратегию и покажите на трассе, почему обычная миграция опасна, а миграция с таймаутом — нет."),
      ],
      hints: ["Что делает `ALTER TABLE`, пока его блокирует чужая транзакция?", "Что происходит с обычными `SELECT`, пришедшими после него?"],
      checks: ["`SET lock_timeout` и повтор при `55P03`", "Миграция не встаёт в очередь: чтения не задерживаются"],
      solution: [
        code("text", `-- A держит открытую транзакцию после обычного SELECT
A> BEGIN
A> SELECT count(*) FROM accounts
     → count: 1
-- B выполняет миграцию: ALTER TABLE ждёт, пока A закончит
B> ALTER TABLE accounts ADD COLUMN note text   (ждёт…)
-- C делает обычный SELECT — и тоже ждёт, встав в очередь за ALTER
C> SELECT count(*) FROM accounts
     ✗ ERROR [55P03]: canceling statement due to lock timeout
A> COMMIT
B  ← ALTER
C> SELECT count(*) FROM accounts
     → count: 1`, { filename: "опасно: DDL в очереди (PostgreSQL 16.14)" }),
        code("text", `-- Безопасная миграция: DDL ждёт блокировку недолго и сдаётся, не задерживая остальных
A> BEGIN
A> SELECT count(*) FROM accounts
     → count: 1
B> ALTER TABLE accounts ADD COLUMN note text
     ✗ ERROR [55P03]: canceling statement due to lock timeout
-- пока ALTER не стоит в очереди, обычные запросы идут без задержки
C> SELECT count(*) FROM accounts
     → count: 1
A> COMMIT
-- A закончил: повторная попытка миграции проходит сразу
B> ALTER TABLE accounts ADD COLUMN note text
     → ALTER`, { filename: "безопасно: lock_timeout (PostgreSQL 16.14)" }),
        p("Без таймаута `ALTER TABLE` ждёт `ACCESS EXCLUSIVE`, а все новые чтения встают за ним. С `lock_timeout = '200ms'` миграция отваливается быстро, не мешая никому, и скрипт миграции повторяет попытку позже, пока не найдёт окно без долгих транзакций. Для самых нагруженных таблиц добавляют контроль: прервать долгие транзакции или выбрать время низкой нагрузки."),
      ],
    }),
  ],

  challenge: {
    id: "sql.locking-deadlocks.challenge",
    title: "Очередь заданий для нескольких воркеров",
    scenario: [
      p("Несколько воркеров одновременно забирают задания из таблицы `jobs`. Требования: ни одно задание не обрабатывается дважды, воркеры не ждут друг друга, а если воркер упал, его задание возвращается в очередь."),
    ],
    requirements: [
      "Задание берётся одной командой `UPDATE … WHERE id = (SELECT … FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id`",
      "Три воркера получают разные задания, четвёртый — пустой результат",
      "После отката транзакции упавшего воркера задание снова доступно",
    ],
    constraints: [
      "Никаких блокировок таблицы и повторных опросов в цикле с `sleep` внутри транзакции",
      "Блокировка снимается автоматически завершением транзакции",
    ],
    acceptance: [
      "Воркеры W1, W2, W3 получают задания 1, 2, 3; W4 — ничего",
      "После `ROLLBACK` W1 воркер W4 получает задание 1",
    ],
    hints: [
      "`FOR UPDATE SKIP LOCKED` пропускает строки, заблокированные другими транзакциями.",
      "Транзакция воркера открыта, пока он «выполняет» задание: блокировка держится на всё это время.",
    ],
    solution: [
      code("text", `-- Три воркера берут задания одновременно (транзакции открыты, пока задание «выполняется»)
W1> BEGIN
W2> BEGIN
W3> BEGIN
W1> UPDATE jobs SET status = 'running', worker = 'w1' WHERE id = (SELECT id FROM jobs WHERE status = 'new' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id
     → id: 1
W2> UPDATE jobs SET status = 'running', worker = 'w2' WHERE id = (SELECT id FROM jobs WHERE status = 'new' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id
     → id: 2
W3> UPDATE jobs SET status = 'running', worker = 'w3' WHERE id = (SELECT id FROM jobs WHERE status = 'new' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id
     → id: 3
-- четвёртый воркер ничего не получает: все задания заняты
W4> UPDATE jobs SET status = 'running', worker = 'w4' WHERE id = (SELECT id FROM jobs WHERE status = 'new' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id
     → id: (нет строк)
-- воркер W1 упал: откат освобождает его задание
W1> ROLLBACK
W4> UPDATE jobs SET status = 'running', worker = 'w4' WHERE id = (SELECT id FROM jobs WHERE status = 'new' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id
     → id: 1
W2> COMMIT
W3> COMMIT
W4> SELECT id, status, worker FROM jobs ORDER BY id
     → id, status, worker: 1 | running | w4; 2 | running | w2; 3 | running | w3`, { filename: "результат (PostgreSQL 16.14, четыре сеанса)" }),
      p("Каждый воркер обновляет первую строку со статусом `new`, не заблокированную другими. Три воркера получили 1, 2, 3 без ожидания, четвёртый — пустой результат (`RETURNING` без строк). После `ROLLBACK` W1 изменение статуса отменено, блокировка снята, и W4 забирает задание 1. Итог: задание 1 выполняется воркером w4, задания 2 и 3 — w2 и w3."),
    ],
  },

  interview: [
    iq("sql.locking-deadlocks.i1", "basic", "Что такое блокировка и когда она снимается?", [
      ul(
        "Механизм, заставляющий конфликтующие операции выполняться по очереди.",
        "Блокировка строки берётся при `UPDATE`/`DELETE`/`SELECT … FOR UPDATE` и снимается в конце транзакции (`COMMIT` или `ROLLBACK`), а не в конце команды.",
        "Обычные `SELECT` в PostgreSQL строки не блокируют и не блокируются.",
      ),
    ]),
    iq("sql.locking-deadlocks.i2", "basic", "Что такое взаимоблокировка?", [
      ul(
        "Транзакции ждут друг друга по кругу: A держит строку 1 и ждёт 2, B держит 2 и ждёт 1.",
        "PostgreSQL находит цикл (после `deadlock_timeout`) и отменяет одну транзакцию с ошибкой `deadlock detected` (`40P01`).",
        "Приложение должно повторить отменённую транзакцию.",
      ),
    ]),
    iq("sql.locking-deadlocks.i3", "intermediate", "Как предотвратить взаимоблокировки?", [
      ul(
        "Единый порядок блокировок во всех транзакциях (по возрастанию `id`): в замере порядок `ORDER BY id FOR UPDATE` дал 950 и 550 без ошибок.",
        "Короткие транзакции и блокировка только необходимого.",
        "Повтор транзакции при `40P01` — как страховка, а не основная защита.",
      ),
    ]),
    iq("sql.locking-deadlocks.i4", "intermediate", "Чем NOWAIT, SKIP LOCKED и lock_timeout отличаются?", [
      ul(
        "`NOWAIT` — сразу ошибка `55P03`, если строка занята.",
        "`SKIP LOCKED` — занятые строки пропускаются (очередь заданий).",
        "`lock_timeout` — ожидание ограничено временем: по истечении `canceling statement due to lock timeout`.",
      ),
    ]),
    iq("sql.locking-deadlocks.i5", "intermediate", "Как реализовать очередь заданий в PostgreSQL для нескольких воркеров?", [
      ul(
        "`UPDATE jobs SET status = 'running' WHERE id = (SELECT id FROM jobs WHERE status = 'new' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id`.",
        "Воркеры не ждут друг друга и не берут занятое: в замере 3 воркера получили 1, 2, 3, четвёртый — ничего.",
        "При падении воркера откат возвращает задание в очередь; для долгих заданий — статусы и таймауты «зависших».",
      ),
    ]),
    iq("sql.locking-deadlocks.i6", "advanced", "Почему обычный SELECT может стать в очередь при миграции?", [
      ul(
        "`ALTER TABLE` просит `ACCESS EXCLUSIVE` и ждёт открытую транзакцию (держит `ACCESS SHARE`).",
        "Новые запросы не обгоняют ожидающий DDL и встают за ним (замер: `lock timeout` у `SELECT`).",
        "Лекарство: `SET lock_timeout` для миграции и повтор; не оставлять транзакции открытыми.",
      ),
    ]),
    iq("sql.locking-deadlocks.i7", "advanced", "Как найти, кто кого блокирует в PostgreSQL?", [
      ul(
        "`pg_stat_activity`: сеансы с `wait_event_type = 'Lock'` (замер: `transactionid`).",
        "`pg_blocking_pids(pid)` возвращает блокирующие процессы; `pg_locks` — таблицы и режимы (`AccessExclusiveLock`).",
        "Типичный виновник — `idle in transaction`; помогают `idle_in_transaction_session_timeout` и короткие транзакции.",
      ),
    ]),
    iq("sql.locking-deadlocks.i8", "engineering", "После релиза в логах растёт число `deadlock detected`. Как вы разберётесь?", [
      ul(
        "Взять из лога PostgreSQL подробности взаимоблокировок (какие запросы и строки), включить `log_lock_waits`.",
        "Найти пары транзакций, блокирующих одни и те же строки в разном порядке (например, переводы между счетами в разных направлениях).",
        "Ввести единый порядок блокировок (`ORDER BY id FOR UPDATE`) и сократить транзакции.",
        "Добавить повтор транзакции при `40P01` с ограничением попыток и логированием.",
        "Проверить нагрузочным тестом с встречными операциями; следить за долей повторов после релиза.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.locking-deadlocks.e1", "foundation", "Когда снимается блокировка строки, взятая `UPDATE`?", ["После выполнения команды", "Через 1 секунду", "В конце транзакции (`COMMIT` или `ROLLBACK`)", "Никогда"], 2, "Блокировка держится до конца транзакции, поэтому вторая транзакция ждала `COMMIT` первой (замер)."),
    mcq("sql.locking-deadlocks.e2", "foundation", "Блокирует ли обычный `SELECT` строки в PostgreSQL?", ["Нет, читатели не блокируют писателей (MVCC)", "Да, всегда", "Только в `SERIALIZABLE`", "Только в `READ COMMITTED`"], 0, "Обычный `SELECT` берёт только `AccessShareLock` на таблицу и строки не блокирует."),
    mcq("sql.locking-deadlocks.e3", "foundation", "Что вернёт `SELECT … FOR UPDATE NOWAIT`, если строка занята?", ["Ждёт", "Старую версию строки", "Пустой результат", "Ошибку `55P03` сразу"], 3, "`NOWAIT` отказывается ждать: `could not obtain lock on row` (замер)."),
    mcq("sql.locking-deadlocks.e4", "intermediate", "A держит строку 1 и просит 2, B держит 2 и просит 1. Что произойдёт?", ["Обе ждут бесконечно", "PostgreSQL обнаружит цикл и отменит одну транзакцию (`40P01`)", "Обе завершатся успешно", "Обе откатятся"], 1, "После `deadlock_timeout` цикл разрывается отменой одной транзакции; вторая продолжается (замер)."),
    mcq("sql.locking-deadlocks.e5", "intermediate", "Как лучше всего избежать взаимоблокировки при переводах между двумя счетами?", ["Увеличить `deadlock_timeout`", "Отключить транзакции", "Использовать `NOWAIT`", "Блокировать счета в едином порядке (по возрастанию `id`)"], 3, "При одинаковом порядке ждать можно только «вперёд» — цикла нет (замер: 950 и 550 без ошибок)."),
    mcq("sql.locking-deadlocks.e6", "intermediate", "Что делает `FOR UPDATE SKIP LOCKED`?", ["Ждёт освобождения строк", "Блокирует таблицу", "Пропускает заблокированные другими строки", "Удаляет строки"], 2, "Воркеры получают разные задания: 1, 2, 3, а четвёртый — пустой результат (замер)."),
    mcq("sql.locking-deadlocks.e7", "advanced", "Почему `ALTER TABLE` за открытой транзакцией блокирует даже новые `SELECT`?", ["`SELECT` конфликтует с `ACCESS SHARE`", "Запросы встают в очередь за ожидающим `ACCESS EXCLUSIVE`", "`ALTER TABLE` берёт блокировку строк", "Это ошибка PostgreSQL"], 1, "Очередь блокировок не позволяет обгонять ожидающий конфликтующий запрос (замер: `lock timeout` у обычного `SELECT`)."),
    open("sql.locking-deadlocks.e8", "intermediate", "Объясните, как организовать безопасное добавление столбца в большую таблицу на рабочей базе с точки зрения блокировок.", [
      ul(
        "`ALTER TABLE` требует `ACCESS EXCLUSIVE`: он ждёт все открытые транзакции с этой таблицей, а за ним встают новые запросы.",
        "Задать `SET lock_timeout` (например, `2s`) для миграции: при ошибке `55P03` — повторить позже.",
        "Выполнять в окно низкой нагрузки; проверить отсутствие долгих транзакций (`pg_stat_activity`).",
        "Добавлять столбец без тяжёлых значений по умолчанию и без перезаписи таблицы; заполнение — отдельными пакетами.",
        "Мониторить блокировки во время миграции и иметь план отката.",
      ),
    ], ["Очередь за ACCESS EXCLUSIVE", "lock_timeout и повтор", "Окно нагрузки и проверка транзакций", "Лёгкое изменение и пакетное заполнение"], { format: "architecture" }),
  ],

  mastery: [
    mcq("sql.locking-deadlocks.m1", "intermediate", "Какое ожидание показал `pg_stat_activity` для второго `UPDATE` одной строки?", ["`Lock` / `transactionid`", "`IO`", "`Client`", "`Timeout`"], 0, "Ожидание строки отображается как ожидание идентификатора транзакции владельца (замер: `Lock | transactionid`, 1 блокирующий)."),
    mcq("sql.locking-deadlocks.m2", "advanced", "A держит строку 1 и строку 2 (обновил обе), B просит строку 2. Что будет?", ["Взаимоблокировка", "B читает старое значение и записывает", "B ждёт, пока A завершится, цикла нет", "Ошибка немедленно"], 2, "Одностороннее ожидание не образует цикл: B дождётся `COMMIT` A (замер: 500 + 10 + 10 = 520)."),
    mcq("sql.locking-deadlocks.m3", "advanced", "Почему для миграции полезен короткий `lock_timeout`?", ["Миграция сдаётся, не вставая надолго в очередь и не задерживая запросы за собой", "Он ускоряет `ALTER TABLE`", "Он отключает блокировки", "Он убирает `ACCESS EXCLUSIVE`"], 0, "Без таймаута DDL блокирует очередь (замер: `lock timeout` у `SELECT`), с таймаутом — отваливается через 200 мс, и чтения идут."),
    open("sql.locking-deadlocks.m4", "advanced", "Сервис обработки платежей иногда «замирает» на несколько секунд, затем всё продолжается; в логах `idle in transaction`. Как вы найдёте причину и что сделаете?", [
      ul(
        "Посмотреть в `pg_stat_activity` сеансы `idle in transaction` и их `xact_start`, `query`, а также ожидающих с `wait_event_type = 'Lock'` и `pg_blocking_pids`.",
        "Выяснить, какой код оставляет транзакцию открытой (внешний вызов или ожидание пользователя внутри `BEGIN`).",
        "Сократить транзакции, вынести внешние вызовы за их пределы; ввести `idle_in_transaction_session_timeout` как защиту.",
        "Добавить `lock_timeout` для запросов, не терпящих ожидания; в очередях — `SKIP LOCKED`.",
        "Включить `log_lock_waits` и метрики времени ожидания; проверить нагрузочным тестом.",
      ),
    ], ["Диагностика по pg_stat_activity", "Причина: открытая транзакция", "Сокращение и таймауты", "Мониторинг и проверка"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.locking-deadlocks.f1", front: "Когда снимается блокировка?", back: "В конце транзакции (COMMIT/ROLLBACK), не в конце команды. Читатели (SELECT) строки не блокируют." },
    { id: "sql.locking-deadlocks.f2", front: "Взаимоблокировка?", back: "Цикл ожиданий. PostgreSQL отменяет одну транзакцию (40P01 deadlock detected) после deadlock_timeout; приложение повторяет." },
    { id: "sql.locking-deadlocks.f3", front: "Как избежать deadlock?", back: "Единый порядок блокировок (ORDER BY id FOR UPDATE), короткие транзакции, повтор при 40P01." },
    { id: "sql.locking-deadlocks.f4", front: "NOWAIT / SKIP LOCKED / lock_timeout?", back: "NOWAIT — сразу ошибка 55P03; SKIP LOCKED — пропустить занятые; lock_timeout — ограничить ожидание." },
    { id: "sql.locking-deadlocks.f5", front: "Очередь заданий?", back: "UPDATE … WHERE id = (SELECT … FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id; откат возвращает задание." },
    { id: "sql.locking-deadlocks.f6", front: "ALTER TABLE и очередь?", back: "Ждёт ACCESS EXCLUSIVE, новые SELECT встают за ним. Лекарство: SET lock_timeout и повтор." },
    { id: "sql.locking-deadlocks.f7", front: "Режимы блокировки таблицы?", back: "SELECT — AccessShare; FOR UPDATE — RowShare; UPDATE — RowExclusive; ALTER — AccessExclusive." },
    { id: "sql.locking-deadlocks.f8", front: "Диагностика?", back: "pg_stat_activity (wait_event_type = Lock), pg_blocking_pids(pid), pg_locks; idle in transaction — частый виновник." },
  ],

  sources: [
    { title: "PostgreSQL 16: Explicit Locking", url: "https://www.postgresql.org/docs/16/explicit-locking.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: SELECT — The Locking Clause", url: "https://www.postgresql.org/docs/16/sql-select.html#SQL-FOR-UPDATE-SHARE", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Lock Management (deadlock_timeout, lock_timeout)", url: "https://www.postgresql.org/docs/16/runtime-config-locks.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: The Cumulative Statistics System (pg_stat_activity)", url: "https://www.postgresql.org/docs/16/monitoring-stats.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: pg_locks", url: "https://www.postgresql.org/docs/16/view-pg-locks.html", publisher: "PostgreSQL" },
  ],
};
