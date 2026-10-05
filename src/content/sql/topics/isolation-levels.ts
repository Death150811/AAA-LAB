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

export const isolationLevels: Topic = {
  id: "sql.isolation-levels",
  slug: "isolation-levels",
  domain: "sql",
  module: "transactions",
  title: "Уровни изоляции и аномалии конкурентного доступа",
  titleEn: "Isolation Levels and Concurrency Anomalies",
  summary:
    "Изоляция отвечает на вопрос «что видит одна транзакция, пока другая работает параллельно». Тема на замерах двух реальных сеансов PostgreSQL 16.14: грязного чтения нет даже на `READ UNCOMMITTED` (1000, а не 700), при `READ COMMITTED` два одинаковых `SELECT` в одной транзакции дают 1000 и 700 (неповторяемое чтение) и число строк 2 → 3 (фантом), `REPEATABLE READ` фиксирует снимок (700, 700, затем 600 после фиксации; число строк 3, 3, затем 4), потерянное обновление (A прибавил 100, B записал 1200 — итог 1200 вместо 1300) исправляется `balance = balance + …` (1300), `SELECT … FOR UPDATE` (1300) или повтором после ошибки `40001`, `UPDATE` после ожидания перепроверяет `WHERE` (`UPDATE 0`), перекос записи (write skew: оба врача сняты с дежурства, 0) на `REPEATABLE READ` и ошибка сериализации на `SERIALIZABLE` (остался 1), `UPDATE` создаёт новую версию строки (`ctid` (0,1) → (0,2) → (0,3)).",
  minutes: 100,
  prerequisites: ["sql.acid-transactions", "sql.insert-update-delete", "sql.subqueries"],
  tags: ["isolation level", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE", "dirty read", "non-repeatable read", "phantom read", "lost update", "write skew", "MVCC", "snapshot", "serialization failure", "40001", "SELECT FOR UPDATE", "retry"],
  keyConcepts: [
    { term: "Изоляция — компромисс между строгостью и конкуренцией", text: "Чем строже уровень, тем меньше аномалий и тем больше конфликтов и повторов. В PostgreSQL по умолчанию `READ COMMITTED` (`SHOW default_transaction_isolation` → `read committed`)." },
    { term: "Аномалии: грязное чтение, неповторяемое чтение, фантом", text: "На `READ COMMITTED` повторное чтение дало 1000, затем 700; повторный подсчёт — 2, затем 3. Грязного чтения в PostgreSQL нет вообще: `READ UNCOMMITTED` работает как `READ COMMITTED`." },
    { term: "REPEATABLE READ — снимок на всю транзакцию", text: "Транзакция видит данные на момент первой команды: 700, 700 при чужом изменении до 600, фантомов нет (число строк 3, 3). Попытка изменить строку, изменённую после снимка, даёт ошибку `40001`." },
    { term: "Потерянное обновление — ошибка «прочитал-вычислил-записал»", text: "Прочитав 1000, A записал 1100, B записал 1200 — итог 1200 вместо 1300. Лечится относительным `UPDATE` (1300), блокировкой `FOR UPDATE` или уровнем `REPEATABLE READ` с повтором." },
    { term: "Write skew требует SERIALIZABLE", text: "Два врача проверили «дежурят двое» и сняли себя — на `REPEATABLE READ` дежурных 0. На `SERIALIZABLE` вторая транзакция получила `40001`, повтор увидел одного дежурного." },
    { term: "Ошибки сериализации — норма, их повторяют", text: "`SQLSTATE 40001` означает «повторите транзакцию целиком»; приложение должно уметь это делать, иначе строгие уровни непригодны." },
  ],
  sections: [
    section("definition", [
      def("Уровень изоляции", "Настройка транзакции, определяющая, какие изменения параллельных транзакций она может видеть: `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`.", "isolation level"),
      def("Грязное чтение", "Чтение данных, изменённых другой транзакцией и ещё не зафиксированных (возможно, потом откатанных).", "dirty read"),
      def("Неповторяемое чтение", "Повторное чтение той же строки в одной транзакции возвращает другое значение, потому что другая транзакция успела её изменить и зафиксировать.", "non-repeatable read"),
      def("Фантомное чтение", "Повторный запрос с тем же условием возвращает другой набор строк: другая транзакция добавила или удалила подходящие строки.", "phantom read"),
      def("Потерянное обновление", "Две транзакции читают значение и записывают его, вычисленное по прочитанному: изменение одной затирается другой.", "lost update"),
      def("Перекос записи", "Две транзакции читают пересекающиеся данные и записывают разные строки так, что вместе нарушают инвариант, хотя по отдельности его соблюдали.", "write skew"),
      def("MVCC", "Многоверсионное управление конкурентностью: изменение создаёт новую версию строки, читатели видят версию своего снимка и не блокируют писателей.", "multiversion concurrency control"),
      def("Ошибка сериализации", "Ошибка `SQLSTATE 40001`: СУБД отменила транзакцию, чтобы сохранить результат, равный какому-то последовательному порядку; транзакцию нужно повторить.", "serialization failure"),
    ]),

    section("why", [
      h("Параллельные пользователи — норма, а не исключение"),
      p("В тесте приложение работает с одним пользователем, и ошибок нет. В продакшене сотни транзакций идут одновременно, и случаются ошибки, которые невозможно воспроизвести одним запросом: баланс «съехал» на 100, билет продан дважды, дежурных не осталось. Это не баги в запросах, а гонки между правильными запросами. Знание уровней изоляции даёт язык, чтобы их предсказывать и устранять."),
      ul(
        "**Корректность:** какие инварианты защищены базой, а какие — только вашей аккуратностью.",
        "**Производительность:** строгие уровни дороже — больше конфликтов, повторов, блокировок.",
        "**Диагностика:** по аномалии можно понять, какой уровень или приём в нём нужен.",
        "**Архитектура:** обработка `40001` и взаимоблокировок — часть клиентского кода, а не «редкая ошибка».",
      ),
      note("Все сценарии этой темы — настоящие: два сеанса PostgreSQL 16.14 выполняют команды в указанном порядке. Каждый можно воспроизвести двумя окнами `psql`."),
    ]),

    section("mental-model", [
      h("Каждая транзакция смотрит на базу через «снимок»"),
      p("Представьте, что база — это общий журнал со всеми версиями строк. Транзакция не читает «текущее состояние»: она читает те версии, которые были зафиксированы к моменту её **снимка**. Вопрос уровня изоляции — **когда делается снимок**: перед каждой командой (`READ COMMITTED`) или один раз на всю транзакцию (`REPEATABLE READ`). `SERIALIZABLE` добавляет слежение за зависимостями между транзакциями и отменяет одну из них, если результат нельзя объяснить последовательным выполнением."),
      diagram(
        `
        время →

        READ COMMITTED           B: ├─ SELECT ─┤              ├─ SELECT ─┤
        (снимок на каждую команду)       видит 1000   A: UPDATE+COMMIT   видит 700

        REPEATABLE READ          B: ├─ SELECT ─┤              ├─ SELECT ─┤
        (один снимок)                    видит 1000   A: UPDATE+COMMIT   видит 1000
        `,
        "Уровень определяет, когда транзакция «фотографирует» базу.",
      ),
      h("Как рассуждать об аномалии"),
      steps(
        [
          ["Выписать шаги двух сеансов", "Порядок команд по времени: что читает и пишет A, что — B."],
          ["Определить, что видит каждый шаг", "На `READ COMMITTED` — зафиксированное на начало команды; на `REPEATABLE READ` — снимок транзакции."],
          ["Найти нарушенный инвариант", "Деньги не должны теряться; должен остаться хотя бы один дежурный."],
          ["Выбрать средство", "Относительный `UPDATE`, блокировка `FOR UPDATE`, ограничение схемы, повышение уровня с повтором."],
          ["Проверить воспроизведением", "Два сеанса, фиксированный порядок шагов — как в примерах темы."],
        ],
        "Анализ конкурентной ошибки",
      ),
    ]),

    section("technical", [
      h("Уровни и аномалии"),
      table(
        ["Уровень", "Грязное чтение", "Неповторяемое чтение", "Фантом", "Аномалия сериализации"],
        [
          ["`READ UNCOMMITTED`", "В PostgreSQL невозможно (как `READ COMMITTED`)", "Возможно", "Возможно", "Возможна"],
          ["`READ COMMITTED` (по умолчанию)", "Невозможно", "Возможно", "Возможен", "Возможна"],
          ["`REPEATABLE READ`", "Невозможно", "Невозможно", "В PostgreSQL невозможен", "Возможна"],
          ["`SERIALIZABLE`", "Невозможно", "Невозможно", "Невозможен", "Невозможна"],
        ],
        "Уровни изоляции PostgreSQL (по документации и замерам темы)",
      ),
      h("Как это реализовано в PostgreSQL"),
      ul(
        "**`READ COMMITTED`:** каждая команда видит снимок на момент **своего начала**; чужие фиксации между командами становятся видимыми.",
        "**`REPEATABLE READ`:** снимок делается при первой команде транзакции (не при `BEGIN`) и действует до конца; при попытке изменить строку, изменённую после снимка, — ошибка `40001`.",
        "**`SERIALIZABLE`:** `REPEATABLE READ` плюс отслеживание опасных зависимостей чтения-записи (SSI); при угрозе аномалии одна из транзакций получает `40001`.",
        "**Читатели не блокируют писателей и наоборот** (MVCC); блокируются только конкурирующие записи одной строки.",
      ),
      h("Средства защиты, кроме уровня"),
      table(
        ["Проблема", "Средство", "Что делает"],
        [
          ["Потерянное обновление", "`SET balance = balance + 100`", "Значение вычисляется в базе по актуальной строке"],
          ["Потерянное обновление", "`SELECT … FOR UPDATE`", "Блокирует прочитанные строки до конца транзакции"],
          ["Лимит остатка", "`UPDATE … WHERE seats_left > 0` + проверка числа строк", "Условие проверяется на актуальной версии строки"],
          ["Инвариант по набору строк", "`SERIALIZABLE` и повтор при `40001`", "База сама отслеживает конфликт"],
          ["Уникальность и ссылки", "`UNIQUE`, `FOREIGN KEY`, `CHECK`", "Ограничение работает независимо от уровня"],
        ],
        "Приёмы против аномалий",
      ),
      warn("Строгий уровень не отменяет обязанности повторять транзакции: `REPEATABLE READ` и `SERIALIZABLE` отвечают на конфликт ошибкой `40001`, и приложение обязано повторить транзакцию целиком."),
    ]),

    section("syntax", [
      p("Уровень изоляции задают при открытии транзакции или первой командой после `BEGIN`. Текущий уровень показывает `SHOW transaction_isolation`."),
      annotated(
        "sql",
        `SHOW default_transaction_isolation;
BEGIN ISOLATION LEVEL REPEATABLE READ;
SHOW transaction_isolation;
COMMIT;
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SHOW transaction_isolation;
COMMIT;`,
        [
          { line: 1, text: "Уровень по умолчанию на сервере: `read committed`." },
          { line: [2, 4], text: "`BEGIN ISOLATION LEVEL REPEATABLE READ` — уровень задан в начале транзакции; `SHOW transaction_isolation` подтверждает." },
          { line: [5, 7], text: "Альтернатива: обычный `BEGIN`, затем `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE` — допустимо **до** первой команды чтения/записи." },
          { line: [4, 8], text: "Уровень действует только до конца этой транзакции; следующая снова начнёт с уровня по умолчанию." },
        ],
        "08-show.pg.sql",
      ),
      code("text", ` default_transaction_isolation 
-------------------------------
 read committed
(1 row)

 transaction_isolation 
-----------------------
 repeatable read
(1 row)

 transaction_isolation 
-----------------------
 serializable
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
    ]),

    section("minimal-example", [
      p("Сеанс A меняет баланс, но ещё не фиксирует. Сеанс B читает. Затем A фиксирует, и B читает снова. Строки трассы `A>` и `B>` — команды каждого сеанса, `→` — результат."),
      code("text", `-- Грязного чтения нет: B не видит незафиксированное изменение A
A> BEGIN
A> UPDATE accounts SET balance = 700 WHERE id = 1
     → UPDATE 1
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 1000
-- READ UNCOMMITTED в PostgreSQL работает как READ COMMITTED
B> BEGIN ISOLATION LEVEL READ UNCOMMITTED
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 1000
B> COMMIT
A> COMMIT
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 700`, { filename: "01: грязного чтения нет (PostgreSQL 16.14, два сеанса)" }),
      ul(
        "Пока A не зафиксировал, B видит старые 1000, а не 700: незафиксированное изменение невидимо.",
        "`READ UNCOMMITTED` в PostgreSQL ведёт себя как `READ COMMITTED`: тоже 1000.",
        "После `COMMIT` A баланс 700 виден всем новым командам.",
      ),
    ]),

    section("detailed-example", [
      h("Неповторяемое чтение: READ COMMITTED против REPEATABLE READ"),
      code("text", `-- READ COMMITTED: два одинаковых чтения в одной транзакции дают разный результат
B> BEGIN
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 1000
A> UPDATE accounts SET balance = 700 WHERE id = 1
     → UPDATE 1
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 700
B> COMMIT

-- REPEATABLE READ: транзакция видит один снимок данных
B> BEGIN ISOLATION LEVEL REPEATABLE READ
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 700
A> UPDATE accounts SET balance = 600 WHERE id = 1
     → UPDATE 1
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 700
B> COMMIT
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 600`, { filename: "02: неповторяемое чтение (PostgreSQL 16.14)" }),
      p("На `READ COMMITTED` транзакция B прочитала 1000, а после чужой фиксации — 700: две команды дали разные ответы. На `REPEATABLE READ` обе читали из одного снимка (700 и 700, хотя A уже обновил до 600); новое значение 600 увидела только следующая транзакция."),
      h("Фантомы"),
      code("text", `-- READ COMMITTED: появилась новая строка — «фантом»
B> BEGIN
B> SELECT count(*) AS n FROM accounts WHERE balance >= 500
     → n: 2
A> INSERT INTO accounts VALUES (3, 'Вера', 800)
     → INSERT 1
B> SELECT count(*) AS n FROM accounts WHERE balance >= 500
     → n: 3
B> COMMIT

-- REPEATABLE READ в PostgreSQL: фантомов нет
B> BEGIN ISOLATION LEVEL REPEATABLE READ
B> SELECT count(*) AS n FROM accounts WHERE balance >= 500
     → n: 3
A> INSERT INTO accounts VALUES (4, 'Глеб', 900)
     → INSERT 1
B> SELECT count(*) AS n FROM accounts WHERE balance >= 500
     → n: 3
B> COMMIT
B> SELECT count(*) AS n FROM accounts WHERE balance >= 500
     → n: 4`, { filename: "03: фантомы (PostgreSQL 16.14)" }),
      p("На `READ COMMITTED` подсчёт строк с `balance >= 500` вырос с 2 до 3 из-за вставки Веры. На `REPEATABLE READ` вставка Глеба осталась невидимой (3, 3), в отличие от минимальных требований стандарта SQL, где фантомы на этом уровне допустимы."),
      h("Потерянное обновление"),
      code("text", `-- Потерянное обновление: оба прочитали 1000 и записали вычисленное в приложении значение
A> BEGIN
B> BEGIN
A> SELECT balance FROM accounts WHERE id = 1
     → balance: 1000
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 1000
A> UPDATE accounts SET balance = 1100 WHERE id = 1
     → UPDATE 1
A> COMMIT
B> UPDATE accounts SET balance = 1200 WHERE id = 1
     → UPDATE 1
B> COMMIT
A> SELECT balance FROM accounts WHERE id = 1
     → balance: 1200`, { filename: "04: потерянное обновление (PostgreSQL 16.14)" }),
      p("Обе транзакции прочитали 1000. A записал 1100 и зафиксировал, B записал 1200 — итог 1200: прибавка A (+100) потеряна, а ожидалось 1300. Каждая транзакция по отдельности корректна, и ни одна не получила ошибки: вычисление «баланс + прибавка» произошло в приложении по устаревшему прочтению."),
    ]),

    section("analysis", [
      table(
        ["Сценарий", "Результат (замер)", "Вывод"],
        [
          ["Чтение при чужом незафиксированном `UPDATE`", "1000, затем 700 после фиксации", "Грязного чтения нет"],
          ["Два `SELECT` на `READ COMMITTED`", "1000 → 700", "Неповторяемое чтение"],
          ["Два `SELECT` на `REPEATABLE READ`", "700 → 700 → 600 после фиксации", "Снимок на транзакцию"],
          ["`count(*)` на `READ COMMITTED` / `REPEATABLE READ`", "2 → 3 / 3 → 3", "Фантом / нет фантома"],
          ["Прочитать-вычислить-записать", "1200 вместо 1300", "Потерянное обновление"],
          ["`balance = balance + 200`", "1300", "Относительный `UPDATE` исправляет"],
          ["`SELECT FOR UPDATE`", "1300", "Блокировка исправляет"],
          ["`REPEATABLE READ` и конкурентное изменение", "`40001`, значение 1100 сохранилось", "Нужен повтор транзакции"],
        ],
        "Что показали замеры PostgreSQL 16.14",
      ),
      h("Три способа вылечить потерянное обновление"),
      code("text", `-- Способ 1: изменение относительно текущего значения, balance = balance + …
A> BEGIN
B> BEGIN
A> UPDATE accounts SET balance = balance + 100 WHERE id = 1
     → UPDATE 1
B> UPDATE accounts SET balance = balance + 200 WHERE id = 1   (ждёт…)
A> COMMIT
B  ← UPDATE 1
B> COMMIT
A> SELECT balance FROM accounts WHERE id = 1
     → balance: 1300
A> UPDATE accounts SET balance = 1000 WHERE id = 1
     → UPDATE 1

-- Способ 2: SELECT … FOR UPDATE блокирует строку на время чтение-изменение
A> BEGIN
B> BEGIN
A> SELECT balance FROM accounts WHERE id = 1 FOR UPDATE
     → balance: 1000
B> SELECT balance FROM accounts WHERE id = 1 FOR UPDATE   (ждёт…)
A> UPDATE accounts SET balance = 1100 WHERE id = 1
     → UPDATE 1
A> COMMIT
B  ← balance: 1100
B> UPDATE accounts SET balance = 1100 + 200 WHERE id = 1
     → UPDATE 1
B> COMMIT
A> SELECT balance FROM accounts WHERE id = 1
     → balance: 1300
A> UPDATE accounts SET balance = 1000 WHERE id = 1
     → UPDATE 1

-- Способ 3: REPEATABLE READ не даёт перезаписать чужое изменение — ошибка, повторите транзакцию
A> BEGIN ISOLATION LEVEL REPEATABLE READ
B> BEGIN ISOLATION LEVEL REPEATABLE READ
A> SELECT balance FROM accounts WHERE id = 1
     → balance: 1000
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 1000
A> UPDATE accounts SET balance = 1100 WHERE id = 1
     → UPDATE 1
A> COMMIT
B> UPDATE accounts SET balance = 1200 WHERE id = 1
     ✗ ERROR [40001]: could not serialize access due to concurrent update
B> ROLLBACK
A> SELECT balance FROM accounts WHERE id = 1
     → balance: 1100`, { filename: "05: способы исправления (PostgreSQL 16.14)" }),
      ul(
        "**Относительный `UPDATE`.** B подождал, пока A зафиксирует, и применил `+200` к актуальным 1100: итог 1300. Для простых счётчиков и остатков это лучший способ.",
        "**`SELECT … FOR UPDATE`.** B блокируется на чтении, пока A не завершит, и затем читает 1100 (а не 1000); вычисленное по нему значение верно. Подходит, когда новое значение зависит от сложной логики в приложении.",
        "**`REPEATABLE READ`.** B получил `could not serialize access due to concurrent update` (SQLSTATE `40001`) и откатил транзакцию; в базе осталось значение A. Для B нужно повторить транзакцию с начала.",
      ),
      h("UPDATE перепроверяет условие после ожидания"),
      code("text", `-- READ COMMITTED: после ожидания UPDATE перепроверяет условие WHERE на новой версии строки
A> BEGIN
A> UPDATE accounts SET balance = balance - 900 WHERE id = 1
     → UPDATE 1
B> UPDATE accounts SET balance = balance - 500 WHERE id = 1 AND balance >= 500   (ждёт…)
A> COMMIT
B  ← UPDATE 0
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 100`, { filename: "06: перепроверка условия (PostgreSQL 16.14)" }),
      p("На `READ COMMITTED` B ждёт, пока A зафиксирует, а затем **заново проверяет** `WHERE balance >= 500` на новой версии строки (баланс 100) — условие ложно, `UPDATE 0`. Вот почему `UPDATE … WHERE seats_left > 0` — надёжный способ «занять последнее место»: условие проверяется по актуальной версии строки."),
    ]),

    section("internals", [
      h("MVCC: UPDATE создаёт новую версию"),
      code("sql", `-- MVCC: UPDATE не меняет строку «на месте», а создаёт новую версию (ctid — физический адрес версии)
CREATE TABLE accounts (id integer PRIMARY KEY, owner text NOT NULL, balance integer NOT NULL);
INSERT INTO accounts VALUES (1, 'Анна', 1000);
SELECT ctid, balance FROM accounts WHERE id = 1;
UPDATE accounts SET balance = 700 WHERE id = 1;
SELECT ctid, balance FROM accounts WHERE id = 1;
UPDATE accounts SET balance = 600 WHERE id = 1;
SELECT ctid, balance FROM accounts WHERE id = 1;`, { filename: "09-mvcc.pg.sql" }),
      code("text", ` ctid  | balance 
-------+---------
 (0,1) |    1000
(1 row)

 ctid  | balance 
-------+---------
 (0,2) |     700
(1 row)

 ctid  | balance 
-------+---------
 (0,3) |     600
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Строка с `balance = 1000` лежала по адресу `(0,1)`. После `UPDATE` значение 700 лежит уже по адресу `(0,2)`, а после следующего — 600 по `(0,3)`: PostgreSQL не правит строку на месте, а пишет **новую версию**. Старые версии видны тем транзакциям, чей снимок их ещё включает, и удаляются позже процессом очистки (`VACUUM`). Поэтому читатели не блокируют писателей — но постоянно открытая транзакция не даёт очистить старые версии."),
      h("Перекос записи (write skew)"),
      code("text", `== REPEATABLE READ ==
A> BEGIN ISOLATION LEVEL REPEATABLE READ
B> BEGIN ISOLATION LEVEL REPEATABLE READ
A> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 2
B> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 2
-- каждый видит двоих дежурных и снимает с дежурства себя
A> UPDATE doctors SET on_call = false WHERE name = 'Анна'
     → UPDATE 1
B> UPDATE doctors SET on_call = false WHERE name = 'Борис'
     → UPDATE 1
A> COMMIT
B> COMMIT
A> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 0

== SERIALIZABLE ==
A> BEGIN ISOLATION LEVEL SERIALIZABLE
B> BEGIN ISOLATION LEVEL SERIALIZABLE
A> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 2
B> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 2
-- каждый видит двоих дежурных и снимает с дежурства себя
A> UPDATE doctors SET on_call = false WHERE name = 'Анна'
     → UPDATE 1
B> UPDATE doctors SET on_call = false WHERE name = 'Борис'
     → UPDATE 1
A> COMMIT
B> COMMIT
     ✗ ERROR [40001]: could not serialize access due to read/write dependencies among transactions
A> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 1
-- B повторяет транзакцию целиком: теперь он видит одного дежурного и ничего не меняет
B> BEGIN ISOLATION LEVEL SERIALIZABLE
B> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 1
B> COMMIT`, { filename: "07: перекос записи (PostgreSQL 16.14)" }),
      ul(
        "Инвариант: в дежурстве должен остаться хотя бы один врач. Каждая транзакция проверила «дежурных двое» и сняла с дежурства **себя** — разные строки, поэтому конфликта записи нет.",
        "`REPEATABLE READ`: обе зафиксировались, дежурных 0 — инвариант нарушен, хотя нет ни одной ошибки.",
        "`SERIALIZABLE`: PostgreSQL обнаружил опасную зависимость между чтениями и записями и отменил вторую транзакцию (`40001`, `read/write dependencies`). Повтор увидел одного дежурного и ничего не изменил.",
      ),
      h("Блокировка прочитанных строк как альтернатива"),
      code("text", `-- READ COMMITTED + блокировка прочитанных строк: B дождётся A и увидит актуальную картину
A> BEGIN
B> BEGIN
A> SELECT name FROM doctors WHERE on_call FOR UPDATE
     → name: Анна; Борис
B> SELECT name FROM doctors WHERE on_call FOR UPDATE   (ждёт…)
A> UPDATE doctors SET on_call = false WHERE name = 'Анна'
     → UPDATE 1
A> COMMIT
B  ← name: Борис
-- B видит только одного дежурного — снимать себя с дежурства нельзя
B> COMMIT
A> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 1`, { filename: "11: тот же перекос с FOR UPDATE (PostgreSQL 16.14)" }),
      p("На `READ COMMITTED` блокировка `FOR UPDATE` всех дежурных заставила B ждать. После фиксации A строка Анны перестала подходить под `on_call`, и B увидел только Бориса — решение «снимать себя нельзя» принимается по актуальным данным. Цена: блокировки и ожидание вместо повторов."),
      h("Как не потерять ошибку сериализации"),
      p("`SQLSTATE 40001` (и `40P01` — взаимоблокировка) — не сбой, а штатный ответ: «повторите транзакцию целиком». Повторять нужно **всю** транзакцию (включая чтения и принятие решений), а не отдельную команду, и с ограничением числа попыток и небольшой случайной паузой."),
    ]),

    section("mistakes", [
      h("Ошибка: «прочитал — вычислил — записал» на READ COMMITTED"),
      wrongRight(
        "sql",
        { title: "Значение вычислено в приложении", code: `SELECT balance FROM accounts WHERE id = 1;   -- 1000\n-- в приложении: 1000 + 100\nUPDATE accounts SET balance = 1100 WHERE id = 1;`, note: "Параллельная прибавка теряется: в замере итог 1200 вместо 1300, ошибки нет." },
        { title: "Относительное изменение", code: `UPDATE accounts SET balance = balance + 100 WHERE id = 1;`, note: "Вычисление происходит в базе по актуальной строке; ожидающий сеанс применяет прибавку к 1100 и получает 1300." },
      ),
      h("Ошибка: проверка условия отдельным SELECT"),
      p("Проверка «осталось место» отдельным запросом и последующая запись — гонка между ними: в наивном сценарии оба покупателя увидели одно место, и остаток ушёл в −1. Условие должно быть внутри `UPDATE` (и число затронутых строк проверено) или на ограничении `CHECK (seats_left >= 0)`."),
      h("Ошибка: не обрабатывать 40001"),
      p("На `REPEATABLE READ` и `SERIALIZABLE` конфликты — нормальный исход. Без повтора пользователь увидит ошибку «500» из-за штатной ситуации. Оберните транзакцию в цикл повторов с лимитом."),
      h("Ошибка: считать, что SERIALIZABLE «всё решает» без издержек"),
      p("Он защищает от аномалий, но порождает ошибки сериализации и требует идемпотентной, повторяемой транзакции. Внешние эффекты (письма, платежи) внутри такой транзакции опасны: при повторе они выполнятся дважды."),
      h("Ошибка: полагаться на REPEATABLE READ для инвариантов по набору строк"),
      p("На `REPEATABLE READ` проверка «дежурных двое» не защитила от перекоса записи (замер: дежурных 0). Для таких инвариантов нужен `SERIALIZABLE`, блокировка прочитанных строк или ограничение, выражающее правило."),
      h("Ошибка: долгие транзакции на строгих уровнях"),
      p("Чем дольше транзакция, тем выше вероятность конфликта и больше старых версий строк, которые нельзя очистить. Делайте транзакции короткими."),
    ]),

    section("antipatterns", [
      ul(
        "**Расчёт нового значения в приложении по прочитанному** без блокировки и без относительного `UPDATE`.",
        "**Проверка бизнес-правила отдельным `SELECT`** вместо условия в `UPDATE` или ограничения.",
        "**Глобальный `SERIALIZABLE` без повторов** на всё приложение.",
        "**Блокировка всей таблицы** (`LOCK TABLE`) ради защиты одной строки.",
        "**Надежда, что «такое редко бывает»:** гонка проявляется под нагрузкой, а не в тестах.",
        "**Повтор отдельной команды вместо всей транзакции** после `40001`.",
        "**Внешние эффекты внутри повторяемой транзакции.**",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Описывайте инварианты ограничениями** (`CHECK`, `UNIQUE`, `FOREIGN KEY`): они работают на любом уровне.",
        "**Изменения «относительно текущего значения»** — в `UPDATE`, а не через чтение и расчёт в приложении.",
        "**Условия-ограничители внутри `UPDATE`** (`WHERE seats_left > 0`) и проверка числа затронутых строк.",
        "**`SELECT … FOR UPDATE`** — когда новое значение требует сложной логики над прочитанным.",
        "**Повышайте уровень точечно** (`SERIALIZABLE` только для транзакций с инвариантами по набору строк) и обязательно пишите повтор при `40001`.",
        "**Держите транзакции короткими и повторяемыми** (без внешних эффектов внутри).",
        "**Тестируйте гонки** сценариями с двумя сеансами или многопоточными тестами.",
        "**Для отчётов** используйте `REPEATABLE READ READ ONLY`: один согласованный снимок без блокировок писателей.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Ограничения и уровни:** уникальный индекс защищает от дублей на любом уровне; конкурентные вставки одного значения решает одна из транзакций, вторая ждёт или получает ошибку.",
        "**`SELECT` без `FOR UPDATE` не блокирует:** читатель не мешает писателям и не защищён от последующих изменений.",
        "**Снимок `REPEATABLE READ` начинается не с `BEGIN`, а с первой команды;** поэтому `SET TRANSACTION ISOLATION LEVEL` нужно выполнить до неё.",
        "**Реплики и снимки:** запросы на репликах работают на своих версиях данных; задержка репликации — отдельный источник «неповторяемого» чтения между подключениями.",
        "**`READ ONLY DEFERRABLE` на `SERIALIZABLE`** позволяет длинному отчёту дождаться безопасного снимка и не получать `40001`.",
        "**Другие СУБД:** реализации уровней различаются (например, `READ UNCOMMITTED` в некоторых СУБД реально допускает грязное чтение); поведение нужно проверять по документации конкретной системы.",
      ),
    ]),

    section("related", [
      ul(
        "[Транзакции и ACID](/learn/sql/acid-transactions) — границы транзакции, откат, точки сохранения.",
        "[INSERT, UPDATE, DELETE](/learn/sql/insert-update-delete) — команды, конкурирующие между собой.",
        "[Подзапросы](/learn/sql/subqueries) — «проверка условия» как отдельный запрос и её гонки.",
        "[Блокировки и взаимоблокировки](/learn/sql/locking-deadlocks) — `FOR UPDATE`, ожидание, `NOWAIT`, взаимоблокировки.",
        "[Планы запросов](/learn/sql/explain-plans) — почему долгая транзакция мешает очистке версий строк.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Прочитать и записать",
          code: `
            BEGIN;
            SELECT seats_left FROM events WHERE id = 1;     -- 1
            UPDATE events SET seats_left = seats_left - 1 WHERE id = 1;
            COMMIT;
          `,
          note: "Два сеанса видят одно место и оба «покупают» его: остаток −1 (замер); проверка и запись разделены.",
        },
        {
          title: "Условие внутри UPDATE",
          code: `
            UPDATE events SET seats_left = seats_left - 1
            WHERE id = 1 AND seats_left > 0;
            -- проверить число затронутых строк: 0 — места нет
          `,
          note: "Второй сеанс после ожидания перепроверяет условие на новой версии строки и получает `UPDATE 0` — остаток 0, продажа отклонена.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.isolation-levels.ex1",
      title: "Что увидит транзакция на REPEATABLE READ",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Транзакция B на `REPEATABLE READ` читает баланс (1000). Сеанс A обновляет его до 700 и фиксирует. B читает баланс снова и пытается выполнить `UPDATE … SET balance = balance + 50`. Предскажите: что вернёт повторное чтение, что произойдёт с `UPDATE` и какой баланс увидит B после `ROLLBACK`."),
      ],
      hints: ["Когда делается снимок на `REPEATABLE READ`?", "Что делает PostgreSQL, если транзакция пытается изменить строку, изменённую после её снимка?"],
      checks: ["Повторное чтение: 1000", "`UPDATE`: ошибка `40001` (concurrent update)", "После отката: 700"],
      solution: [
        code("text", `B> BEGIN ISOLATION LEVEL REPEATABLE READ
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 1000
A> UPDATE accounts SET balance = 700 WHERE id = 1
     → UPDATE 1
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 1000
B> UPDATE accounts SET balance = balance + 50 WHERE id = 1
     ✗ ERROR [40001]: could not serialize access due to concurrent update
B> ROLLBACK
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 700`, { filename: "результат (PostgreSQL 16.14, два сеанса)" }),
        p("Снимок B зафиксировался при первом `SELECT`, поэтому повторное чтение даёт 1000, а не 700. Изменение строки, обновлённой после снимка, невозможно: PostgreSQL отвечает `could not serialize access due to concurrent update` (`40001`). Новую транзакцию B уже увидит 700."),
      ],
    }),
    exercise({
      id: "sql.isolation-levels.ex2",
      title: "Баланс «съехал» на 100",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Два сервиса одновременно пополняют один счёт: оба читают баланс (1000), вычисляют новое значение в приложении (+100 и +200) и записывают его. Итог — 1200 вместо 1300, ошибок нет. Объясните причину и предложите два исправления."),
        code("text", `-- Потерянное обновление: оба прочитали 1000 и записали вычисленное в приложении значение
A> BEGIN
B> BEGIN
A> SELECT balance FROM accounts WHERE id = 1
     → balance: 1000
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 1000
A> UPDATE accounts SET balance = 1100 WHERE id = 1
     → UPDATE 1
A> COMMIT
B> UPDATE accounts SET balance = 1200 WHERE id = 1
     → UPDATE 1
B> COMMIT
A> SELECT balance FROM accounts WHERE id = 1
     → balance: 1200`, { filename: "воспроизведение (PostgreSQL 16.14)" }),
      ],
      hints: ["Где вычисляется новое значение — в базе или в приложении?", "Что заставит второй сеанс использовать актуальное значение?"],
      checks: ["Потерянное обновление: вычисление по устаревшему прочтению", "Исправления: `balance = balance + …` и `SELECT … FOR UPDATE`"],
      solution: [
        code("text", `-- Способ 1: изменение относительно текущего значения, balance = balance + …
A> BEGIN
B> BEGIN
A> UPDATE accounts SET balance = balance + 100 WHERE id = 1
     → UPDATE 1
B> UPDATE accounts SET balance = balance + 200 WHERE id = 1   (ждёт…)
A> COMMIT
B  ← UPDATE 1
B> COMMIT
A> SELECT balance FROM accounts WHERE id = 1
     → balance: 1300
A> UPDATE accounts SET balance = 1000 WHERE id = 1
     → UPDATE 1

-- Способ 2: SELECT … FOR UPDATE блокирует строку на время чтение-изменение
A> BEGIN
B> BEGIN
A> SELECT balance FROM accounts WHERE id = 1 FOR UPDATE
     → balance: 1000
B> SELECT balance FROM accounts WHERE id = 1 FOR UPDATE   (ждёт…)
A> UPDATE accounts SET balance = 1100 WHERE id = 1
     → UPDATE 1
A> COMMIT
B  ← balance: 1100
B> UPDATE accounts SET balance = 1100 + 200 WHERE id = 1
     → UPDATE 1
B> COMMIT
A> SELECT balance FROM accounts WHERE id = 1
     → balance: 1300
A> UPDATE accounts SET balance = 1000 WHERE id = 1
     → UPDATE 1

-- Способ 3: REPEATABLE READ не даёт перезаписать чужое изменение — ошибка, повторите транзакцию
A> BEGIN ISOLATION LEVEL REPEATABLE READ
B> BEGIN ISOLATION LEVEL REPEATABLE READ
A> SELECT balance FROM accounts WHERE id = 1
     → balance: 1000
B> SELECT balance FROM accounts WHERE id = 1
     → balance: 1000
A> UPDATE accounts SET balance = 1100 WHERE id = 1
     → UPDATE 1
A> COMMIT
B> UPDATE accounts SET balance = 1200 WHERE id = 1
     ✗ ERROR [40001]: could not serialize access due to concurrent update
B> ROLLBACK
A> SELECT balance FROM accounts WHERE id = 1
     → balance: 1100`, { filename: "исправления (PostgreSQL 16.14)" }),
        p("Первое исправление — относительный `UPDATE` (итог 1300): ожидающий сеанс применяет прибавку к актуальной версии. Второе — `SELECT … FOR UPDATE`: B читает значение только после завершения A. Третий вариант — `REPEATABLE READ` с повтором транзакции после `40001`."),
      ],
    }),
    exercise({
      id: "sql.isolation-levels.ex3",
      title: "Двое врачей снимаются с дежурства",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Правило: в дежурстве должен остаться хотя бы один врач. Две транзакции одновременно проверяют «дежурных двое» и снимают с дежурства каждая себя. Предложите два способа защитить инвариант и покажите, как поведёт себя вторая транзакция."),
      ],
      hints: ["Какая блокировка заставит вторую транзакцию дождаться первой и увидеть новое состояние?", "Какой уровень изоляции сам обнаружит зависимость между чтениями и записями?"],
      checks: ["`SERIALIZABLE` + повтор при `40001`", "`SELECT … FOR UPDATE` по строкам дежурных на `READ COMMITTED`"],
      solution: [
        code("text", `-- READ COMMITTED + блокировка прочитанных строк: B дождётся A и увидит актуальную картину
A> BEGIN
B> BEGIN
A> SELECT name FROM doctors WHERE on_call FOR UPDATE
     → name: Анна; Борис
B> SELECT name FROM doctors WHERE on_call FOR UPDATE   (ждёт…)
A> UPDATE doctors SET on_call = false WHERE name = 'Анна'
     → UPDATE 1
A> COMMIT
B  ← name: Борис
-- B видит только одного дежурного — снимать себя с дежурства нельзя
B> COMMIT
A> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 1`, { filename: "способ 1: блокировка прочитанных строк (PostgreSQL 16.14)" }),
        code("text", `== REPEATABLE READ ==
A> BEGIN ISOLATION LEVEL REPEATABLE READ
B> BEGIN ISOLATION LEVEL REPEATABLE READ
A> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 2
B> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 2
-- каждый видит двоих дежурных и снимает с дежурства себя
A> UPDATE doctors SET on_call = false WHERE name = 'Анна'
     → UPDATE 1
B> UPDATE doctors SET on_call = false WHERE name = 'Борис'
     → UPDATE 1
A> COMMIT
B> COMMIT
A> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 0

== SERIALIZABLE ==
A> BEGIN ISOLATION LEVEL SERIALIZABLE
B> BEGIN ISOLATION LEVEL SERIALIZABLE
A> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 2
B> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 2
-- каждый видит двоих дежурных и снимает с дежурства себя
A> UPDATE doctors SET on_call = false WHERE name = 'Анна'
     → UPDATE 1
B> UPDATE doctors SET on_call = false WHERE name = 'Борис'
     → UPDATE 1
A> COMMIT
B> COMMIT
     ✗ ERROR [40001]: could not serialize access due to read/write dependencies among transactions
A> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 1
-- B повторяет транзакцию целиком: теперь он видит одного дежурного и ничего не меняет
B> BEGIN ISOLATION LEVEL SERIALIZABLE
B> SELECT count(*) AS on_call FROM doctors WHERE on_call
     → on_call: 1
B> COMMIT`, { filename: "способ 2: SERIALIZABLE (во второй части трассы)" }),
        p("Блокировка `FOR UPDATE` заставляет вторую транзакцию дождаться первой и увидеть только одного дежурного. `SERIALIZABLE` без блокировок отменяет вторую транзакцию ошибкой `40001`; повтор уже видит одного дежурного. `REPEATABLE READ` не защищает: обе транзакции зафиксировались, дежурных 0."),
      ],
    }),
  ],

  challenge: {
    id: "sql.isolation-levels.challenge",
    title: "Последнее место на концерт",
    scenario: [
      p("На концерт осталось одно место, и два покупателя нажимают «купить» одновременно. Нужно продать место ровно один раз, а второму честно сообщить, что места закончились."),
    ],
    requirements: [
      "Показать наивную реализацию «прочитать остаток, затем уменьшить» и её последствия",
      "Показать корректную реализацию с условием внутри `UPDATE`",
      "Второй покупатель получает определённый отказ (0 затронутых строк), а не отрицательный остаток",
    ],
    constraints: [
      "Без `SERIALIZABLE` и без блокировки таблицы",
      "Проверка выполняется на актуальной версии строки",
    ],
    acceptance: [
      "Наивно: остаток −1 (продано два места)",
      "Верно: первый `UPDATE 1`, второй `UPDATE 0`, остаток 0",
    ],
    hints: [
      "На `READ COMMITTED` ожидающий `UPDATE` перепроверяет `WHERE` на новой версии строки.",
      "Число затронутых строк — сигнал успеха: 1 — место продано, 0 — отказ.",
    ],
    solution: [
      code("text", `== Наивно: проверка и запись раздельно ==
A> BEGIN
B> BEGIN
A> SELECT seats_left FROM events WHERE id = 1
     → seats_left: 1
B> SELECT seats_left FROM events WHERE id = 1
     → seats_left: 1
-- оба увидели одно свободное место и покупают его
A> UPDATE events SET seats_left = seats_left - 1 WHERE id = 1
     → UPDATE 1
B> UPDATE events SET seats_left = seats_left - 1 WHERE id = 1   (ждёт…)
A> COMMIT
B  ← UPDATE 1
B> COMMIT
A> SELECT seats_left FROM events WHERE id = 1
     → seats_left: -1

== Верно: условие внутри UPDATE и проверка числа затронутых строк ==
A> BEGIN
B> BEGIN
A> UPDATE events SET seats_left = seats_left - 1 WHERE id = 1 AND seats_left > 0
     → UPDATE 1
B> UPDATE events SET seats_left = seats_left - 1 WHERE id = 1 AND seats_left > 0   (ждёт…)
A> COMMIT
B  ← UPDATE 0
-- B получил UPDATE 0: места закончились, покупку отклоняем
B> ROLLBACK
A> SELECT seats_left FROM events WHERE id = 1
     → seats_left: 0`, { filename: "результат (PostgreSQL 16.14, два сеанса)" }),
      p("Наивный вариант: оба видят `seats_left = 1`, оба уменьшают, итог −1 — продано два места. Корректный: `UPDATE … WHERE id = 1 AND seats_left > 0`. Первый покупатель получает `UPDATE 1`; второй, дождавшись фиксации, перепроверяет условие на новой версии строки (`seats_left = 0`) и получает `UPDATE 0` — приложение отвечает «места закончились». Дополнительная защита — `CHECK (seats_left >= 0)` в схеме."),
    ],
  },

  interview: [
    iq("sql.isolation-levels.i1", "basic", "Перечислите уровни изоляции и аномалии, которые они предотвращают.", [
      ul(
        "`READ UNCOMMITTED` (в PostgreSQL ведёт себя как `READ COMMITTED`), `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`.",
        "Аномалии: грязное чтение, неповторяемое чтение, фантом, аномалии сериализации.",
        "`READ COMMITTED` не допускает грязного чтения; `REPEATABLE READ` — ещё и неповторяемого (и в PostgreSQL фантомов); `SERIALIZABLE` — всех.",
      ),
    ]),
    iq("sql.isolation-levels.i2", "basic", "Какой уровень изоляции в PostgreSQL по умолчанию и что это значит?", [
      ul(
        "`READ COMMITTED`: каждая команда видит снимок на момент своего начала.",
        "В замере два одинаковых `SELECT` в одной транзакции дали 1000 и 700 после чужой фиксации.",
        "Читатели не блокируют писателей: грязного чтения нет (MVCC).",
      ),
    ]),
    iq("sql.isolation-levels.i3", "intermediate", "Что такое неповторяемое чтение и фантом?", [
      ul(
        "Неповторяемое чтение: повторное чтение той же строки даёт другое значение (1000 → 700 на `READ COMMITTED`).",
        "Фантом: повторный запрос с тем же условием возвращает другой набор строк (2 → 3 после вставки).",
        "`REPEATABLE READ` в PostgreSQL предотвращает оба: снимок один на транзакцию.",
      ),
    ]),
    iq("sql.isolation-levels.i4", "intermediate", "Что такое потерянное обновление и как его предотвратить?", [
      ul(
        "Две транзакции читают значение и записывают вычисленное в приложении; изменение одной затирается (итог 1200 вместо 1300).",
        "Лечение: `UPDATE … SET x = x + d` (вычисление в базе), `SELECT … FOR UPDATE`, либо `REPEATABLE READ` с повтором при `40001`.",
        "Дополнительно: оптимистичная блокировка через столбец версии.",
      ),
    ]),
    iq("sql.isolation-levels.i5", "intermediate", "Что делает UPDATE при конфликте с параллельной транзакцией на READ COMMITTED?", [
      ul(
        "Ждёт, пока конкурент завершится.",
        "После фиксации перепроверяет условие `WHERE` на новой версии строки (в замере `balance >= 500` стало ложным: `UPDATE 0`).",
        "Поэтому `UPDATE … WHERE seats_left > 0` — надёжный способ занять ресурс.",
      ),
    ]),
    iq("sql.isolation-levels.i6", "advanced", "Что такое write skew и почему REPEATABLE READ его не предотвращает?", [
      ul(
        "Две транзакции читают пересекающиеся данные и пишут **разные** строки, нарушая вместе инвариант (оба врача сняты, дежурных 0).",
        "Конфликта записи нет, поэтому `REPEATABLE READ` не видит проблемы.",
        "`SERIALIZABLE` отслеживает зависимости чтения-записи и отменяет одну транзакцию (`40001`); альтернатива — блокировка прочитанных строк.",
      ),
    ]),
    iq("sql.isolation-levels.i7", "advanced", "Как приложение должно реагировать на SQLSTATE 40001?", [
      ul(
        "Откатить транзакцию и повторить **всю** транзакцию с начала, а не отдельную команду.",
        "Ограничить число попыток и добавить паузу с джиттером; логировать долю повторов.",
        "Транзакция должна быть идемпотентной; внешние эффекты — после фиксации.",
      ),
    ]),
    iq("sql.isolation-levels.i8", "engineering", "Система бронирования продаёт больше мест, чем есть, но только под нагрузкой. Как вы найдёте и устраните причину?", [
      ul(
        "Воспроизвести гонку двумя сеансами (или параллельным тестом) в фиксированном порядке шагов.",
        "Найти разделённые «проверка» и «запись»: отдельный `SELECT` остатка, затем `UPDATE`.",
        "Исправить: `UPDATE … WHERE seats_left > 0` и проверка числа затронутых строк, `CHECK (seats_left >= 0)` в схеме.",
        "При сложной логике — `SELECT … FOR UPDATE` либо `SERIALIZABLE` с повтором.",
        "Добавить нагрузочный тест гонок и мониторинг отрицательных остатков и `40001`.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.isolation-levels.e1", "foundation", "Какой уровень изоляции в PostgreSQL по умолчанию?", ["`READ UNCOMMITTED`", "`REPEATABLE READ`", "`READ COMMITTED`", "`SERIALIZABLE`"], 2, "`SHOW default_transaction_isolation` вернул `read committed` (замер)."),
    mcq("sql.isolation-levels.e2", "foundation", "Что такое грязное чтение?", ["Чтение чужих незафиксированных изменений", "Чтение удалённой таблицы", "Чтение с ошибкой", "Повторное чтение"], 0, "Грязное чтение — видеть изменения, которые могут быть откатаны; в PostgreSQL его нет даже на `READ UNCOMMITTED` (замер: 1000, а не 700)."),
    mcq("sql.isolation-levels.e3", "foundation", "Что показали два одинаковых `SELECT` в транзакции `READ COMMITTED` при чужой фиксации между ними?", ["Одинаковые значения", "Блокировку", "Ошибку", "Разные значения (1000 и 700)"], 3, "Каждая команда делает свежий снимок: это неповторяемое чтение."),
    mcq("sql.isolation-levels.e4", "intermediate", "Что видит транзакция `REPEATABLE READ` после чужой фиксации?", ["Новые значения", "Прежний снимок (700, 700)", "NULL", "Ошибку при чтении"], 1, "Снимок делается один раз на транзакцию; новое значение 600 увидит следующая транзакция."),
    mcq("sql.isolation-levels.e5", "intermediate", "Как исправить потерянное обновление баланса?", ["Увеличить таймаут", "Использовать `READ UNCOMMITTED`", "Добавить индекс", "`UPDATE … SET balance = balance + 100` вместо записи вычисленного в приложении значения"], 3, "Вычисление в базе применяет прибавку к актуальной версии строки: ожидающий сеанс даёт 1300, а не 1200."),
    mcq("sql.isolation-levels.e6", "intermediate", "Что вернёт `UPDATE … WHERE balance >= 500`, если конкурент уже снизил баланс до 100 и зафиксировал?", ["`UPDATE 1`", "Ошибку", "`UPDATE 0`", "`UPDATE 2`"], 2, "После ожидания `READ COMMITTED` перепроверяет условие на новой версии строки, оно ложно — `UPDATE 0` (замер)."),
    mcq("sql.isolation-levels.e7", "advanced", "Какой уровень защищает от write skew (оба врача сняты с дежурства) без ручных блокировок?", ["`READ COMMITTED`", "`SERIALIZABLE`", "`REPEATABLE READ`", "Никакой"], 1, "На `REPEATABLE READ` дежурных оказалось 0, на `SERIALIZABLE` вторая транзакция получила `40001`, и инвариант сохранился."),
    open("sql.isolation-levels.e8", "intermediate", "Приведите пример гонки «проверка и запись раздельно» и три способа её устранить.", [
      ul(
        "Пример: два покупателя читают `seats_left = 1` и оба выполняют `UPDATE … seats_left - 1`; остаток −1.",
        "Способ 1: условие внутри `UPDATE … WHERE seats_left > 0` и проверка числа затронутых строк.",
        "Способ 2: `SELECT … FOR UPDATE` для чтения-блокировки перед записью.",
        "Способ 3: `CHECK (seats_left >= 0)` и повтор при ошибке, либо `SERIALIZABLE` с повтором при `40001`.",
        "Дополнительно: нагрузочный тест гонки.",
      ),
    ], ["Пример гонки", "Условие внутри UPDATE", "Блокировка FOR UPDATE", "Ограничение или SERIALIZABLE с повтором"], { format: "sql" }),
  ],

  mastery: [
    mcq("sql.isolation-levels.m1", "intermediate", "Что показал `SELECT ctid` до и после `UPDATE` в PostgreSQL?", ["Новый адрес (0,2): создана новая версия строки", "Тот же адрес `(0,1)`", "Строка удалена", "Ошибку"], 0, "MVCC не меняет строку на месте, а пишет новую версию; старая остаётся для транзакций со старым снимком до очистки."),
    mcq("sql.isolation-levels.m2", "advanced", "Транзакция на `REPEATABLE READ` пытается обновить строку, изменённую другим сеансом после её снимка. Что произойдёт?", ["Обновление тихо перезапишет значение", "Ожидание бесконечно", "Ошибка `40001` (concurrent update), нужен повтор", "`UPDATE 0`"], 2, "На `REPEATABLE READ` конфликт даёт `could not serialize access due to concurrent update` (замер); на `READ COMMITTED` обновление бы выполнилось поверх."),
    mcq("sql.isolation-levels.m3", "advanced", "Почему `SELECT … FOR UPDATE` решил перекос записи на `READ COMMITTED`?", ["Он заставил вторую транзакцию дождаться первой и прочитать актуальные данные", "Он ускорил запрос", "Он повысил уровень до `SERIALIZABLE`", "Он удалил блокировки"], 0, "B дождался A и увидел только Бориса (замер): решение принимается по данным после чужой фиксации."),
    open("sql.isolation-levels.m4", "advanced", "В платёжном сервисе нужно гарантировать, что сумма списаний за сутки по карте не превысит лимит. Предложите решение, учитывая конкурентные запросы и повторы клиента.", [
      ul(
        "Хранить накопленную сумму за сутки в отдельной строке по ключу (карта, дата) и увеличивать её `UPDATE … SET spent = spent + :amount WHERE card_id = :c AND day = :d AND spent + :amount <= limit`; `UPDATE 0` означает отказ.",
        "Условие внутри `UPDATE` проверяет актуальную версию строки; `CHECK (spent <= limit)` — страховка в схеме.",
        "Идемпотентность: уникальный ключ операции (`UNIQUE (operation_id)`), чтобы повтор клиента не списал дважды.",
        "Если правило сложнее (по нескольким строкам) — `SERIALIZABLE` с повтором при `40001` или блокировка строки-агрегата `FOR UPDATE`.",
        "Тесты: параллельные запросы, повтор после сбоя, граничные суммы.",
      ),
    ], ["Условие внутри UPDATE", "Ограничение в схеме", "Идемпотентность операции", "SERIALIZABLE или FOR UPDATE для сложных правил"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.isolation-levels.f1", front: "Уровни и аномалии PostgreSQL?", back: "RC (по умолчанию): неповторяемое чтение и фантомы возможны. RR: снимок на транзакцию, фантомов нет, write skew возможен. SERIALIZABLE: всё предотвращено ценой 40001." },
    { id: "sql.isolation-levels.f2", front: "READ UNCOMMITTED в PostgreSQL?", back: "Работает как READ COMMITTED: грязного чтения нет." },
    { id: "sql.isolation-levels.f3", front: "Потерянное обновление?", back: "Прочитал-вычислил-записал в приложении. Лечение: SET x = x + d, SELECT … FOR UPDATE, RR + повтор при 40001." },
    { id: "sql.isolation-levels.f4", front: "UPDATE при ожидании?", back: "На READ COMMITTED после чужой фиксации перепроверяет WHERE на новой версии строки: UPDATE … WHERE seats_left > 0 безопасен." },
    { id: "sql.isolation-levels.f5", front: "Write skew?", back: "Две транзакции читают общее, пишут разные строки и нарушают инвариант. Нужны SERIALIZABLE, блокировка прочитанных строк или ограничение." },
    { id: "sql.isolation-levels.f6", front: "SQLSTATE 40001?", back: "Ошибка сериализации: повторить всю транзакцию с ограничением попыток и паузой." },
    { id: "sql.isolation-levels.f7", front: "MVCC?", back: "UPDATE создаёт новую версию строки (ctid (0,1) → (0,2)); читатели не блокируют писателей; старые версии чистит VACUUM." },
    { id: "sql.isolation-levels.f8", front: "Когда снимок на RR?", back: "При первой команде транзакции, не при BEGIN; SET TRANSACTION ISOLATION LEVEL нужно выполнить раньше." },
  ],

  sources: [
    { title: "PostgreSQL 16: Transaction Isolation", url: "https://www.postgresql.org/docs/16/transaction-iso.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Concurrency Control — Introduction (MVCC)", url: "https://www.postgresql.org/docs/16/mvcc-intro.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Explicit Locking (row-level locks)", url: "https://www.postgresql.org/docs/16/explicit-locking.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Serialization Failure Handling", url: "https://www.postgresql.org/docs/16/mvcc-serialization-failure-handling.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: SET TRANSACTION", url: "https://www.postgresql.org/docs/16/sql-set-transaction.html", publisher: "PostgreSQL" },
  ],
};
