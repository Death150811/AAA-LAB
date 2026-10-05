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
  diagram,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const keysConstraints: Topic = {
  id: "sql.keys-constraints",
  slug: "keys-constraints",
  domain: "sql",
  module: "relational",
  title: "Ключи и ограничения",
  titleEn: "Keys and Constraints",
  summary:
    "Ограничения — это договор между данными и СУБД: `PRIMARY KEY`, `UNIQUE`, `NOT NULL`, `CHECK` и `FOREIGN KEY` отвергают некорректные строки до записи, а не после обнаружения ошибки в отчёте. Тема на замерах PostgreSQL 16.14 показывает, какие сообщения возвращает СУБД при дубле ключа, `NULL` в ключе, висячей ссылке и нарушении `CHECK`, как `UNIQUE` допускает несколько `NULL` (3 строки в замере), чем `ON DELETE CASCADE`, `SET NULL` и `RESTRICT` отличаются в поведении (удаление автора убрало 2 из 3 книг и обнулило ссылку в отзыве), почему идентификаторы `GENERATED ... AS IDENTITY` не переиспользуются, как добавить ограничение к таблице с плохими данными (`NOT VALID` и `VALIDATE`) и почему SQLite по умолчанию вообще не проверяет внешние ключи.",
  minutes: 75,
  prerequisites: ["sql.relational-model", "sql.data-types-null"],
  tags: ["primary key", "foreign key", "unique", "not null", "check", "constraint", "ON DELETE CASCADE", "identity", "deferrable", "integrity", "NOT VALID", "composite key", "surrogate key", "natural key"],
  keyConcepts: [
    { term: "Ограничение проверяет СУБД, а не приложение", text: "Любой клиент — приложение, скрипт, ручной `INSERT` — упирается в одни и те же правила. В замере из пяти вставок с дефектами (дубль ключа, дубль `UNIQUE`, `NULL` в ключе, висячая ссылка, нарушение `CHECK`) не прошла ни одна." },
    { term: "PRIMARY KEY = UNIQUE + NOT NULL", text: "Первичный ключ идентифицирует строку; допустим составной (`PRIMARY KEY (order_id, product_id)`). `UNIQUE` допускает несколько `NULL`: в замере в таблицу попали две строки с `email = NULL`." },
    { term: "CHECK не отвергает NULL", text: "`CHECK (price > 0)` отвергает ложное условие, а для `NULL` оно неизвестно — строка проходит. Обязательность — работа `NOT NULL`, а не `CHECK`." },
    { term: "Внешний ключ защищает связь в обе стороны", text: "Нельзя вставить ссылку на несуществующую строку и нельзя удалить родителя с живыми потомками — если не выбрано действие `CASCADE` (удалить потомков) или `SET NULL` (обнулить ссылку)." },
    { term: "Ограничения можно добавлять позже", text: "К таблице с плохими данными ограничение не добавится (`violated by some row`); `NOT VALID` включает проверку для новых строк, а `VALIDATE CONSTRAINT` — для старых после исправления." },
  ],
  sections: [
    section("definition", [
      def("Ограничение целостности", "Правило, которое СУБД применяет к каждой записи: строка, нарушающая его, отвергается с ошибкой. Ограничения хранятся в схеме вместе с таблицей.", "integrity constraint"),
      def("Первичный ключ", "Столбец или набор столбцов, однозначно идентифицирующий строку: значения уникальны и не `NULL`. В таблице не больше одного первичного ключа.", "primary key"),
      def("Уникальное ограничение", "`UNIQUE` запрещает одинаковые значения в столбце (или наборе столбцов). Строки с `NULL` не считаются одинаковыми.", "unique constraint"),
      def("NOT NULL", "Запрещает значение `NULL` в столбце: значение обязательно.", "NOT NULL constraint"),
      def("CHECK", "Произвольное логическое условие над значениями строки: `CHECK (qty > 0)`. Строка отвергается, только если условие ложно.", "check constraint"),
      def("Внешний ключ", "Ограничение «значение должно существовать в другой таблице»: `REFERENCES customers (id)`. Определяет и поведение при удалении или изменении родителя.", "foreign key"),
      def("Суррогатный и естественный ключ", "Суррогатный — технический идентификатор без смысла (`id`, `identity`, `uuid`); естественный — данные предметной области (ИНН, ISBN, логин). Естественные ключи меняются; суррогатные — нет.", "surrogate / natural key"),
      def("Отложенная проверка", "`DEFERRABLE` позволяет проверять ограничение не после каждой строки, а при `COMMIT`; нужна для циклических связей и обмена значениями.", "deferrable constraint"),
    ]),

    section("why", [
      h("Данные нельзя защитить только кодом приложения"),
      p("Проверка в приложении («email не пустой», «количество положительное») работает, пока все записи идут через это приложение. Но данные пишут миграции, скрипты загрузки, второе приложение, администратор из консоли, ошибочный релиз. Любой из них способен записать дубль заказа, ссылку на несуществующего клиента или отрицательный остаток, и такая запись останется в базе навсегда."),
      p("Ограничения решают это в одном месте — там, где данные живут. Они дешёвы (проверка выполняется при записи), самодокументируемы (схема сама говорит, что допустимо) и **независимы от языка клиента**."),
      ul(
        "**Целостность по умолчанию:** некорректные данные не попадают в таблицу вообще, а не «вычищаются потом».",
        "**Гарантии для запросов:** если `customer_id` — внешний ключ, `JOIN` не потеряет заказы; если `price` — `NOT NULL`, суммы не искажаются `NULL`.",
        "**Оптимизатор:** уникальность и ключи помогают планировщику (индексы, оценки числа строк, отбрасывание лишних соединений).",
        "**Сообщения об ошибках:** имя ограничения и строка в `DETAIL` сразу показывают, что не так.",
      ),
      note("Проверки приложения всё равно нужны — ради понятных сообщений пользователю. Ограничения БД — последний рубеж, который нельзя обойти."),
    ]),

    section("mental-model", [
      h("Схема как набор «законов» для строк"),
      p("Представьте таблицу с вахтёром у входа. `NOT NULL` проверяет, что поле заполнено. `CHECK` проверяет значение по правилу. `UNIQUE` и `PRIMARY KEY` сверяют строку со списком уже вошедших. `FOREIGN KEY` звонит в другую таблицу и спрашивает: «такой клиент существует?». Строку впускают, только если все проверки пройдены; в противном случае вся команда (`INSERT`/`UPDATE`) отменяется целиком."),
      diagram(
        `
        INSERT → NOT NULL? → CHECK? → UNIQUE / PRIMARY KEY? → FOREIGN KEY? → ✔ строка записана
                   │          │              │                    │
                   ▼          ▼              ▼                    ▼
                ERROR      ERROR          ERROR                ERROR   (команда отменена целиком)

        DELETE родителя → есть потомки? ── NO ACTION / RESTRICT → ERROR
                                          ├─ CASCADE            → потомки удаляются
                                          └─ SET NULL           → ссылка обнуляется
        `,
        "Порядок проверки внутри СУБД может отличаться, важен принцип: либо все ограничения выполнены, либо строка не записана.",
      ),
      h("Ключ — это решение о том, что считать «той же» сущностью"),
      p("Когда вы объявляете `PRIMARY KEY (order_id, product_id)` для позиций заказа, вы говорите: «один товар в заказе — одна строка, количество — число». Объявляя `UNIQUE (email)`, вы решаете, что один email — один аккаунт. Это не техническая деталь, а **бизнес-правило**, записанное в схеме."),
    ]),

    section("technical", [
      h("Пять видов ограничений"),
      table(
        ["Ограничение", "Что запрещает", "NULL", "Типичное применение"],
        [
          ["`PRIMARY KEY`", "Дубли и `NULL` в ключе", "Запрещён", "Идентификатор строки; составной — для связей «многие ко многим»"],
          ["`UNIQUE`", "Одинаковые непустые значения", "Допускается, и не один", "Email, логин, артикул"],
          ["`NOT NULL`", "`NULL` в столбце", "Запрещён", "Обязательные поля"],
          ["`CHECK (условие)`", "Строки, для которых условие ложно", "Проходит (условие неизвестно)", "Диапазоны, допустимые значения, согласованность полей"],
          ["`FOREIGN KEY … REFERENCES`", "Ссылки на несуществующие строки; удаление родителя с потомками", "Допускается (нет связи)", "Связи между таблицами"],
        ],
        "Виды ограничений и их отношение к NULL",
      ),
      h("Действия внешнего ключа"),
      table(
        ["`ON DELETE`", "Что происходит при удалении родителя"],
        [
          ["`NO ACTION` (по умолчанию)", "Ошибка, если потомки есть (проверка в конце команды; можно отложить)"],
          ["`RESTRICT`", "Ошибка немедленно; отложить нельзя"],
          ["`CASCADE`", "Потомки удаляются вместе с родителем"],
          ["`SET NULL`", "Ссылка в потомках обнуляется (столбец должен допускать `NULL`)"],
          ["`SET DEFAULT`", "Ссылка получает значение по умолчанию"],
        ],
        "Действия при удалении (аналогичные есть для `ON UPDATE`)",
      ),
      h("Идентификаторы"),
      ul(
        "**`GENERATED ALWAYS AS IDENTITY`** (стандартный SQL, PostgreSQL 10+) — автоматическая нумерация; явное значение запрещено без `OVERRIDING SYSTEM VALUE`. `GENERATED BY DEFAULT` разрешает указывать значение.",
        "**`serial`** — устаревший способ PostgreSQL (последовательность + `DEFAULT nextval`); в новых схемах используйте `identity`.",
        "**`uuid`** — глобально уникальные идентификаторы, удобны при распределённой генерации; индекс по ним крупнее и менее локален.",
        "**Номера не переиспользуются:** после `DELETE` следующий `identity` продолжает счёт — «дыры» в нумерации нормальны.",
      ),
      h("Имена ограничений"),
      p("Если имя не задано, PostgreSQL создаёт его сам (`accounts_pkey`, `accounts_email_key`, `orders_customer_id_fkey`, `order_items_qty_check`). Эти имена видны в сообщениях об ошибках и нужны для `ALTER TABLE … DROP CONSTRAINT`. Для важных ограничений задавайте имя явно: `CONSTRAINT stock_qty_nonneg CHECK (qty >= 0)`."),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `CREATE TABLE students (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE courses  (id integer PRIMARY KEY, title text NOT NULL UNIQUE);
CREATE TABLE enrollments (
  student_id integer NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  course_id  integer NOT NULL REFERENCES courses  (id) ON DELETE RESTRICT,
  grade      integer CHECK (grade BETWEEN 1 AND 5),
  PRIMARY KEY (student_id, course_id)
);

INSERT INTO students VALUES (1, 'Анна'), (2, 'Борис');
INSERT INTO courses  VALUES (1, 'SQL'), (2, 'Git');
INSERT INTO enrollments VALUES (1, 1, 5), (1, 2, NULL), (2, 1, 4);

DELETE FROM students WHERE id = 1;

SELECT s.name, c.title, e.grade
FROM enrollments AS e
JOIN students AS s ON s.id = e.student_id
JOIN courses  AS c ON c.id = e.course_id
ORDER BY s.name, c.title;`,
        [
          { line: 1, text: "`PRIMARY KEY` у `students.id`: уникально и обязательно." },
          { line: 2, text: "`UNIQUE` на `title`: два курса с одним названием запрещены." },
          { line: [3, 8], text: "Таблица связи «многие ко многим»: составной первичный ключ `(student_id, course_id)` запрещает записать студента на один курс дважды." },
          { line: 4, text: "`ON DELETE CASCADE`: при удалении студента его записи на курсы удаляются." },
          { line: 5, text: "`ON DELETE RESTRICT`: курс с записями удалить нельзя — это защита от потери истории." },
          { line: 6, text: "`CHECK (grade BETWEEN 1 AND 5)` допускает `NULL`: «оценка ещё не выставлена»." },
          { line: [10, 12], text: "Вставка данных: `NULL` в `grade` разрешён, значения вне диапазона 1–5 были бы отвергнуты." },
          { line: 14, text: "Удаление студента Анны каскадно удаляет две её записи." },
        ],
        "08-enrollments.sql",
      ),
    ]),

    section("minimal-example", [
      p("Одна таблица — пять правил. Каждая вставка с дефектом упирается в своё ограничение и отменяется целиком; допустимые строки проходят."),
      code("sql", `CREATE TABLE accounts (
  id    integer PRIMARY KEY,
  email text UNIQUE,
  name  text NOT NULL
);

INSERT INTO accounts VALUES (1, 'a@example.test', 'Анна');
INSERT INTO accounts VALUES (1, 'b@example.test', 'Борис');      -- дубль первичного ключа
INSERT INTO accounts VALUES (2, 'a@example.test', 'Вера');       -- дубль UNIQUE
INSERT INTO accounts VALUES (3, NULL, 'Глеб');                   -- NULL в UNIQUE допустим
INSERT INTO accounts VALUES (4, NULL, 'Дарья');                  -- и ещё один NULL тоже
INSERT INTO accounts VALUES (NULL, 'e@example.test', 'Егор');    -- NULL в первичном ключе нельзя

SELECT id, email, name FROM accounts ORDER BY id;`, { filename: "01-pk-unique.pg.sql", lineNumbers: true }),
      code("text", `ERROR:  duplicate key value violates unique constraint "accounts_pkey"
DETAIL:  Key (id)=(1) already exists.
ERROR:  duplicate key value violates unique constraint "accounts_email_key"
DETAIL:  Key (email)=(a@example.test) already exists.
ERROR:  null value in column "id" of relation "accounts" violates not-null constraint
DETAIL:  Failing row contains (null, e@example.test, Егор).
 id |     email      | name  
----+----------------+-------
  1 | a@example.test | Анна
  3 |                | Глеб
  4 |                | Дарья
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Дубль `id = 1` и дубль `email` отвергнуты уникальными индексами `accounts_pkey` и `accounts_email_key` — **имя ограничения и ключ видны в сообщении**.",
        "Две строки с `email = NULL` вошли: для `UNIQUE` два `NULL` не равны друг другу (в таблице осталось 3 строки).",
        "`NULL` в первичном ключе запрещён — `violates not-null constraint`.",
      ),
    ]),

    section("detailed-example", [
      p("Связи и их защита. Три таблицы: авторы, книги (удаляются вместе с автором) и отзывы (остаются, но теряют ссылку). Ниже — один сценарий, где `DELETE` автора запускает два разных действия внешних ключей."),
      code("sql", `CREATE TABLE authors (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE books (
  id        integer PRIMARY KEY,
  title     text NOT NULL,
  author_id integer REFERENCES authors (id) ON DELETE CASCADE
);
CREATE TABLE reviews (
  id        integer PRIMARY KEY,
  note      text NOT NULL,
  author_id integer REFERENCES authors (id) ON DELETE SET NULL
);

INSERT INTO authors VALUES (1, 'Лем'), (2, 'Ле Гуин');
INSERT INTO books   VALUES (1, 'Солярис', 1), (2, 'Эдем', 1), (3, 'Левая рука тьмы', 2);
INSERT INTO reviews VALUES (1, 'о Леме', 1), (2, 'о Ле Гуин', 2);

DELETE FROM authors WHERE id = 1;

SELECT count(*) AS books_left FROM books;
SELECT id, note, author_id FROM reviews ORDER BY id;`, { filename: "03-fk-actions.sql", runnable: true, lineNumbers: true }),
      code("text", ` books_left 
------------
          1
(1 row)

 id |   note    | author_id 
----+-----------+-----------
  1 | о Леме    |          
  2 | о Ле Гуин |         2
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Удаление автора `1` (Лем) каскадно удалило обе его книги: осталась одна (`books_left = 1`).",
        "Отзыв `1` остался, но `author_id` стал `NULL` — это `ON DELETE SET NULL`; отзыв о Ле Гуин не тронут.",
        "Без указания действия (по умолчанию `NO ACTION`) то же `DELETE` завершилось бы ошибкой:",
      ),
      code("sql", `CREATE TABLE authors (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE books (
  id        integer PRIMARY KEY,
  title     text NOT NULL,
  author_id integer NOT NULL REFERENCES authors (id)
);
INSERT INTO authors VALUES (1, 'Лем');
INSERT INTO books VALUES (1, 'Солярис', 1);

DELETE FROM authors WHERE id = 1;
INSERT INTO books VALUES (2, 'Сирота', 99);
SELECT count(*) AS authors_left FROM authors;`, { filename: "04-fk-restrict.pg.sql" }),
      code("text", `ERROR:  update or delete on table "authors" violates foreign key constraint "books_author_id_fkey" on table "books"
DETAIL:  Key (id)=(1) is still referenced from table "books".
ERROR:  insert or update on table "books" violates foreign key constraint "books_author_id_fkey"
DETAIL:  Key (author_id)=(99) is not present in table "authors".
 authors_left 
--------------
            1
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Родителя нельзя удалить, пока на него ссылается книга, и нельзя вставить книгу с автором `99`, которого нет — оба направления защищены."),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что защищает", "Что произойдёт при нарушении"],
        [
          ["`PRIMARY KEY (student_id, course_id)`", "Один студент — один раз на курсе", "`duplicate key value violates unique constraint`"],
          ["`REFERENCES students (id) ON DELETE CASCADE`", "Запись не ссылается на несуществующего студента; при удалении студента записи исчезают", "Вставка с неизвестным студентом отвергнута; удаление студента удаляет записи"],
          ["`REFERENCES courses (id) ON DELETE RESTRICT`", "Курсы с записями не удаляются", "`violates foreign key constraint … is still referenced`"],
          ["`CHECK (grade BETWEEN 1 AND 5)`", "Оценка 1–5", "Оценка 6 отвергнута; `NULL` проходит"],
          ["`UNIQUE` у `courses.title`", "Названия курсов не повторяются", "`duplicate key value … courses_title_key`"],
        ],
        "Разбор схемы «студенты — курсы — записи»",
      ),
      code("text", ` name  | title | grade 
-------+-------+-------
 Борис | SQL   |     4
(1 row)`, { filename: "результат 08-enrollments.sql (PostgreSQL 16.14)" }),
      p("После удаления Анны остался единственный факт — запись Бориса на SQL. Исчезли обе записи Анны, а курсы и Борис не тронуты: каскад идёт только по связи `enrollments → students`."),
    ]),

    section("internals", [
      h("Как PostgreSQL проверяет уникальность и связи"),
      ul(
        "**`PRIMARY KEY` и `UNIQUE`** реализованы через уникальный индекс (B-дерево): вставка сначала ищет значение в индексе; поэтому дубли находятся быстро, а сами ограничения создают индексы (`accounts_pkey`, `accounts_email_key`).",
        "**`FOREIGN KEY`** проверяется при вставке/изменении потомка (поиск родителя по его ключу) и при удалении родителя (поиск потомков). Поиск потомков быстр только если на столбец внешнего ключа в дочерней таблице есть индекс — PostgreSQL **не создаёт его автоматически**.",
        "**`CHECK` и `NOT NULL`** — вычисление выражения над самой строкой, без обращений к другим данным.",
        "**Ошибка в любой проверке отменяет всю команду** (а внутри транзакции — переводит её в состояние «прервана»).",
      ),
      h("Отложенные ограничения"),
      p("Обычный `UNIQUE` проверяется после каждой изменённой строки. Поэтому `UPDATE slots SET n = n + 1` на значениях 1, 2, 3 падает, даже если итоговый набор 2, 3, 4 был бы корректным: строка `1 → 2` сталкивается с ещё не изменённой строкой `2`. Отложенное ограничение проверяется при `COMMIT`, когда набор уже согласован."),
      code("sql", `CREATE TABLE slots (n integer UNIQUE);
INSERT INTO slots VALUES (1), (2), (3);
UPDATE slots SET n = n + 1;                          -- обычный UNIQUE проверяется построчно: конфликт

CREATE TABLE slots2 (n integer UNIQUE DEFERRABLE INITIALLY IMMEDIATE);
INSERT INTO slots2 VALUES (1), (2), (3);
BEGIN;
SET CONSTRAINTS ALL DEFERRED;                        -- проверка откладывается до COMMIT
UPDATE slots2 SET n = n + 1;
COMMIT;
SELECT n FROM slots2 ORDER BY n;`, { filename: "11-deferrable.pg.sql" }),
      code("text", `ERROR:  duplicate key value violates unique constraint "slots_n_key"
DETAIL:  Key (n)=(2) already exists.
 n 
---
 2
 3
 4
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Первый `UPDATE` отвергнут (`Key (n)=(2) already exists`), второй, внутри транзакции с `SET CONSTRAINTS ALL DEFERRED`, прошёл — в таблице значения 2, 3, 4."),
      h("Идентификаторы и последовательности"),
      code("sql", `CREATE TABLE tickets (
  id    integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL
);

INSERT INTO tickets (title) VALUES ('первый'), ('второй') RETURNING id, title;
INSERT INTO tickets (id, title) VALUES (100, 'явный номер');
DELETE FROM tickets WHERE id = 2;
INSERT INTO tickets (title) VALUES ('третий') RETURNING id, title;`, { filename: "05-identity.pg.sql" }),
      code("text", ` id | title  
----+--------
  1 | первый
  2 | второй
(2 rows)

ERROR:  cannot insert a non-DEFAULT value into column "id"
DETAIL:  Column "id" is an identity column defined as GENERATED ALWAYS.
HINT:  Use OVERRIDING SYSTEM VALUE to override.
 id | title  
----+--------
  3 | третий
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`RETURNING` возвращает присвоенные номера; явный `id = 100` запрещён для `GENERATED ALWAYS`; после удаления строки `2` новая получила номер `3`, а не `2` — **номера не переиспользуются**. Последовательности лежат вне транзакций, поэтому откат вставки тоже оставляет «дыру»."),
    ]),

    section("mistakes", [
      h("Ошибка: обязательность через CHECK вместо NOT NULL"),
      code("sql", `CREATE TABLE prices (
  item  text    NOT NULL,
  price integer CHECK (price > 0)
);

INSERT INTO prices VALUES ('известная', 100), ('неизвестная', NULL);

-- CHECK отвергает только строки, где условие ложно; для NULL условие «неизвестно» — строка проходит
SELECT item, price FROM prices ORDER BY item;`, { filename: "02-check-null.sql", runnable: true }),
      code("text", `    item     | price 
-------------+-------
 известная   |   100
 неизвестная |      
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`CHECK (price > 0)` пропустил строку с `price = NULL`: условие для неё неизвестно, а `CHECK` отвергает только ложь. Если значение обязательно, добавьте `NOT NULL`."),
      h("Ошибка: нет ограничений вообще"),
      wrongRight(
        "sql",
        {
          title: "Ничего не защищено",
          code: `CREATE TABLE orders_bad (id integer, customer text, qty integer, status text);`,
          note: "Можно записать дубль `id`, отрицательное `qty`, статус `'опечатка'` и заказ несуществующего клиента — и узнать об этом из отчёта.",
        },
        {
          title: "Правила в схеме",
          code: `
            CREATE TABLE orders_good (
              id          integer PRIMARY KEY,
              customer_id integer NOT NULL REFERENCES customers (id),
              qty         integer NOT NULL CHECK (qty > 0),
              status      text    NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'paid', 'shipped'))
            );
          `,
          note: "Дубль, пустое значение, невозможное количество и неизвестный статус отвергаются при записи.",
        },
      ),
      h("Ошибка: добавить ограничение к таблице с плохими данными"),
      code("sql", `CREATE TABLE stock (item text NOT NULL, qty integer NOT NULL);
INSERT INTO stock VALUES ('гайки', 10), ('болты', -3);

ALTER TABLE stock ADD CONSTRAINT stock_qty_nonneg CHECK (qty >= 0);          -- в данных уже есть -3
ALTER TABLE stock ADD CONSTRAINT stock_qty_nonneg CHECK (qty >= 0) NOT VALID; -- новые строки проверяются, старые — нет
INSERT INTO stock VALUES ('шайбы', -1);
UPDATE stock SET qty = 0 WHERE item = 'болты';
ALTER TABLE stock VALIDATE CONSTRAINT stock_qty_nonneg;                      -- теперь всё чисто
SELECT item, qty FROM stock ORDER BY item;`, { filename: "06-alter-constraint.pg.sql" }),
      code("text", `ERROR:  check constraint "stock_qty_nonneg" of relation "stock" is violated by some row
ERROR:  new row for relation "stock" violates check constraint "stock_qty_nonneg"
DETAIL:  Failing row contains (шайбы, -1).
 item  | qty 
-------+-----
 болты |   0
 гайки |  10
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Первое `ADD CONSTRAINT` не прошло: в таблице уже есть `-3`. Вариант `NOT VALID` включил проверку **для новых** строк (вставка `-1` отвергнута), старые данные остались; после исправления `VALIDATE CONSTRAINT` подтвердил, что всё чисто. Так безопасно вводят ограничения в живую базу, не блокируя её надолго."),
      h("Ошибка: SQLite по умолчанию не проверяет внешние ключи"),
      p("В замере на sql.js (SQLite 3.49) значение `PRAGMA foreign_keys` равно `0`: вставка `c(p_id) = 42` без родителя **прошла**. Включается `PRAGMA foreign_keys = ON` для каждого соединения. Песочница на этой странице включает его сама; в приложениях на SQLite об этом нужно помнить."),
    ]),

    section("antipatterns", [
      ul(
        "**Таблица без первичного ключа.** Нельзя ссылаться, нельзя точечно обновить, репликация и ORM испытывают трудности.",
        "**Внешний ключ «на словах»:** поле `customer_id` есть, а `REFERENCES` нет — со временем появляются «сироты».",
        "**Естественный ключ как первичный, когда он может меняться** (email, ИНН, название): каскад обновлений по всей схеме. Обычно: суррогатный `id` + `UNIQUE` на естественное свойство.",
        "**`ON DELETE CASCADE` повсюду:** одно удаление способно молча уничтожить тысячи связанных строк; для данных с историей (заказы, платежи) используйте `RESTRICT` или «мягкое» удаление.",
        "**Дублирование логики:** проверка только в приложении без `CHECK`/`UNIQUE` — гонка двух запросов создаёт дубль (проверка «есть ли такой email» и вставка не атомарны).",
        "**Отключать ограничения «временно» ради загрузки** и забывать их включить обратно.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**У каждой таблицы — первичный ключ.** Для связи «многие ко многим» — составной ключ из двух внешних.",
        "**Объявляйте все связи как `FOREIGN KEY`.** Выбирайте действие осознанно: `RESTRICT` по умолчанию для важных данных, `CASCADE` — для «принадлежащих» строк (позиции заказа), `SET NULL` — для необязательных ссылок.",
        "**Индексируйте столбцы внешних ключей** в дочерних таблицах, иначе удаление родителя и `JOIN` будут медленными.",
        "**`NOT NULL` по умолчанию**, `NULL` — осознанно и с описанным смыслом.",
        "**Формулируйте бизнес-правила через `CHECK`:** диапазоны, список статусов, согласованность столбцов (`CHECK (end_date >= start_date)`).",
        "**Давайте ограничениям имена** для важных правил: сообщения об ошибках станут читаемыми.",
        "**Вводите ограничения в живую базу через `NOT VALID` + `VALIDATE`.**",
        "**Для уникальности «по бизнесу» полагайтесь на `UNIQUE`**, а не на проверку в коде.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**`UNIQUE` и `NULL`.** Несколько `NULL` допустимы; чтобы запретить, в PostgreSQL 15+ есть `UNIQUE NULLS NOT DISTINCT`, либо частичный уникальный индекс.",
        "**`CHECK` видит только свою строку.** PostgreSQL отвергает подзапросы в `CHECK` (`cannot use subquery in check constraint`): для связей между таблицами используйте внешний ключ или триггер.",
        "**`DEFERRABLE` по умолчанию** относится к `INITIALLY IMMEDIATE`: проверяется после команды, а откладывается только по `SET CONSTRAINTS` или `INITIALLY DEFERRED`.",
        "**Самоссылка:** `employees.manager_id REFERENCES employees (id)` допустима; корень иерархии — со значением `NULL`.",
        "**Составной внешний ключ** ссылается на составной ключ целиком; значения `NULL` в любой части ключа (при `MATCH SIMPLE`) отключают проверку.",
        "**Откат и последовательности.** `identity` и `serial` не откатываются вместе с транзакцией — нумерация может иметь дыры.",
        "**SQLite.** Внешние ключи выключены по умолчанию; тип столбца не принуждается к значению; `ALTER TABLE ADD CONSTRAINT` не поддерживается — таблицу пересоздают.",
      ),
    ]),

    section("related", [
      ul(
        "[Типы данных и NULL](/learn/sql/data-types-null) — трёхзначная логика, на которой стоят `CHECK` и `UNIQUE`.",
        "[Реляционная модель и первые таблицы](/learn/sql/relational-model) — таблица, строка, схема.",
        "[INSERT, UPDATE, DELETE](/learn/sql/insert-update-delete) — как ограничения проявляются при изменении данных.",
        "[Upsert и RETURNING](/learn/sql/upsert-returning) — `ON CONFLICT` использует уникальные ограничения.",
        "[Нормализация](/learn/sql/normalization) — ключи и зависимости между столбцами.",
        "[Проектирование связей](/learn/sql/relationships) — 1:N, N:M, самоссылки.",
        "[Индексы и B-дерево](/learn/sql/indexes-btree) — на чём держится уникальность и как индексировать внешние ключи.",
        "[Миграции и безопасный DDL](/learn/sql/migrations-safe-ddl) — добавление ограничений без простоя.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Проверки только в приложении",
          code: `
            -- код: if (!emailExists(email)) insert(email)
            INSERT INTO accounts (email) VALUES ('a@example.test');
          `,
          note: "Между проверкой и вставкой другой запрос успеет вставить тот же email: появится дубль. Проверка «есть ли такой» и запись не атомарны.",
        },
        {
          title: "Правило в схеме",
          code: `
            ALTER TABLE accounts ADD CONSTRAINT accounts_email_key UNIQUE (email);
            INSERT INTO accounts (email) VALUES ('a@example.test');  -- дубль отвергнет СУБД
          `,
          note: "СУБД проверяет и записывает атомарно: дубль невозможен при любой нагрузке и любом клиенте.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.keys-constraints.ex1",
      title: "Какие вставки пройдут?",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Дана таблица `users` с `PRIMARY KEY`, `UNIQUE` на `login` и `CHECK (age >= 18)`. Не запуская, определите, какие из пяти вставок пройдут, а какие будут отвергнуты, и назовите ограничение."),
        code("sql", `CREATE TABLE users (
  id    integer PRIMARY KEY,
  login text NOT NULL UNIQUE,
  age   integer CHECK (age >= 18)
);
INSERT INTO users VALUES (1, 'anna', 30);   -- (а)
INSERT INTO users VALUES (2, 'anna', 25);   -- (б)
INSERT INTO users VALUES (3, 'boris', 17);  -- (в)
INSERT INTO users VALUES (4, 'vera', NULL); -- (г)
INSERT INTO users VALUES (1, 'gleb', 40);   -- (д)
SELECT id, login, age FROM users ORDER BY id;`, { filename: "09-ex-predict.pg.sql", lineNumbers: true }),
      ],
      hints: ["Для какой вставки логин повторяется?", "Что делает `CHECK` с `NULL`?", "Чем отличается дубль `id` от дубля `login`?"],
      checks: ["(а) проходит", "(б) отвергнута `users_login_key`", "(в) отвергнута `users_age_check`", "(г) проходит: `NULL` проходит `CHECK`", "(д) отвергнута `users_pkey`"],
      solution: [
        code("text", `ERROR:  duplicate key value violates unique constraint "users_login_key"
DETAIL:  Key (login)=(anna) already exists.
ERROR:  new row for relation "users" violates check constraint "users_age_check"
DETAIL:  Failing row contains (3, boris, 17).
ERROR:  duplicate key value violates unique constraint "users_pkey"
DETAIL:  Key (id)=(1) already exists.
 id | login | age 
----+-------+-----
  1 | anna  |  30
  4 | vera  |    
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "(а) и (г) прошли: возраст `30` удовлетворяет `CHECK`, а `NULL` ему не противоречит (условие неизвестно).",
          "(б) нарушает `UNIQUE (login)`: логин `anna` уже есть; (в) нарушает `CHECK`: `17 < 18`; (д) нарушает `PRIMARY KEY`: `id = 1` уже занят.",
          "В таблице остались две строки — `1` и `4`.",
        ),
      ],
    }),
    exercise({
      id: "sql.keys-constraints.ex2",
      title: "Усильте слабую схему",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Таблица `orders_bad` ничего не защищает. Перепишите её (`orders_good`): первичный ключ, обязательная ссылка на клиента, положительное количество, статус только `new`/`paid`/`shipped` с умолчанием `new`. Вставьте заказ без указания статуса и убедитесь, что статус заполнился."),
        code("sql", `-- Плохая схема: ничего не защищено
CREATE TABLE orders_bad (id integer, customer text, qty integer, status text);

-- Хорошая схема
CREATE TABLE customers (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE orders_good (
  id          integer PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customers (id),
  qty         integer NOT NULL CHECK (qty > 0),
  status      text    NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'paid', 'shipped'))
);
INSERT INTO customers VALUES (1, 'Анна');
INSERT INTO orders_good (id, customer_id, qty) VALUES (1, 1, 2);
SELECT id, customer_id, qty, status FROM orders_good;`, { filename: "10-ex-fix.sql", runnable: true }),
      ],
      hints: ["Какое ограничение создаёт обязательную ссылку: `REFERENCES` или `NOT NULL REFERENCES`?", "Где задают значение по умолчанию?", "Как записать «одно из трёх значений»?"],
      checks: ["`PRIMARY KEY` у `id`", "`customer_id integer NOT NULL REFERENCES customers (id)`", "`CHECK (qty > 0)`", "`DEFAULT 'new'` и `CHECK (status IN (…))`"],
      solution: [
        code("text", ` id | customer_id | qty | status 
----+-------------+-----+--------
  1 |           1 |   2 | new
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Статус заполнился значением по умолчанию `new`. Каждое правило проверяется СУБД: количество `0`, неизвестный статус и клиент `99` были бы отвергнуты. `NOT NULL` нужен рядом с `REFERENCES`: внешний ключ сам допускает `NULL`."),
      ],
    }),
    exercise({
      id: "sql.keys-constraints.ex3",
      title: "Запись студентов на курсы",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Спроектируйте связь «многие ко многим» между студентами и курсами с оценкой (1–5 или ещё не выставлена). Студента можно удалить — его записи исчезают. Курс с записями удалить нельзя. Студент не может быть записан на один курс дважды. Проверьте поведение удалением студента."),
      ],
      hints: ["Какой ключ запрещает повторную запись?", "Какие действия нужны для `student_id` и `course_id`?", "Как допустить «оценка ещё не выставлена»?"],
      checks: ["Составной `PRIMARY KEY (student_id, course_id)`", "`ON DELETE CASCADE` по студентам и `RESTRICT` по курсам", "`CHECK (grade BETWEEN 1 AND 5)` без `NOT NULL`", "После удаления студента его записи исчезли"],
      solution: [
        code("sql", `CREATE TABLE students (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE courses  (id integer PRIMARY KEY, title text NOT NULL UNIQUE);
CREATE TABLE enrollments (
  student_id integer NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  course_id  integer NOT NULL REFERENCES courses  (id) ON DELETE RESTRICT,
  grade      integer CHECK (grade BETWEEN 1 AND 5),
  PRIMARY KEY (student_id, course_id)
);

INSERT INTO students VALUES (1, 'Анна'), (2, 'Борис');
INSERT INTO courses  VALUES (1, 'SQL'), (2, 'Git');
INSERT INTO enrollments VALUES (1, 1, 5), (1, 2, NULL), (2, 1, 4);

DELETE FROM students WHERE id = 1;

SELECT s.name, c.title, e.grade
FROM enrollments AS e
JOIN students AS s ON s.id = e.student_id
JOIN courses  AS c ON c.id = e.course_id
ORDER BY s.name, c.title;`, { filename: "08-enrollments.sql", runnable: true }),
        code("text", ` name  | title | grade 
-------+-------+-------
 Борис | SQL   |     4
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Составной ключ делает пару «студент — курс» уникальной. Каскад по студентам убирает записи при удалении студента, `RESTRICT` по курсам защищает курсы с историей. `grade` без `NOT NULL` допускает `NULL`, а `CHECK` ограничивает диапазон."),
      ],
    }),
  ],

  challenge: {
    id: "sql.keys-constraints.challenge",
    title: "Защитите склад и заказы",
    scenario: [
      p("В магазине «shop» есть `order_items (order_id, product_id, qty)` с составным первичным ключом и проверкой `qty > 0`. Покажите, что схема защищает данные, и объясните каждую ошибку, которую вернёт СУБД."),
    ],
    requirements: [
      "Попытайтесь вставить позицию, которая дублирует пару `(order_id, product_id)`, — ожидается нарушение первичного ключа",
      "Вставьте позицию с корректной новой парой — должна пройти",
      "Попытайтесь вставить позицию с `qty = 0` — ожидается нарушение `CHECK`",
      "Выведите все позиции заказа `1` по возрастанию `product_id`",
    ],
    constraints: [
      "Не отключать и не изменять ограничения",
      "Ошибки не скрывать: вывод должен показать сообщения СУБД",
    ],
    acceptance: [
      "Две ошибки: `order_items_pkey` и `order_items_qty_check`",
      "В заказе `1` в итоге три позиции: товары 1, 2 и 5",
    ],
    hints: [
      "Имена ограничений видны в сообщении об ошибке.",
      "Каждая ошибка отменяет только свою команду; остальные выполняются.",
    ],
    solution: [
      code("sql", `INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 1, 5);   -- пара (1, 1) уже есть
INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 2, 5);   -- другая пара — можно
INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 3, 0);   -- qty должен быть > 0
SELECT order_id, product_id, qty FROM order_items WHERE order_id = 1 ORDER BY product_id;`, { filename: "07-composite-pk.pg.sql", lineNumbers: true }),
      code("text", `ERROR:  duplicate key value violates unique constraint "order_items_pkey"
DETAIL:  Key (order_id, product_id)=(1, 1) already exists.
ERROR:  new row for relation "order_items" violates check constraint "order_items_qty_check"
DETAIL:  Failing row contains (1, 3, 0).
 order_id | product_id | qty 
----------+------------+-----
        1 |          1 |   1
        1 |          2 |   5
        1 |          5 |   2
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Дубль пары `(1, 1)` отвергнут первичным ключом `order_items_pkey`, `qty = 0` — проверкой `order_items_qty_check`, а допустимая пара `(1, 2)` прошла. Ошибки отменяют только свои команды: итоговый `SELECT` показывает три позиции заказа `1`."),
    ],
  },

  interview: [
    iq("sql.keys-constraints.i1", "basic", "Какие виды ограничений вы знаете и что каждое делает?", [
      ul(
        "`PRIMARY KEY` — идентификатор строки (уникальный и непустой).",
        "`UNIQUE` — запрет дублей, `NULL` допускаются.",
        "`NOT NULL` — значение обязательно.",
        "`CHECK` — произвольное условие над строкой.",
        "`FOREIGN KEY` — ссылка должна указывать на существующую строку другой таблицы.",
      ),
    ]),
    iq("sql.keys-constraints.i2", "basic", "Чем PRIMARY KEY отличается от UNIQUE?", [
      ul(
        "Первичный ключ — один на таблицу, значения уникальны и не `NULL`; на него ссылаются внешние ключи по умолчанию.",
        "`UNIQUE` — сколько угодно в таблице, допускает `NULL` (несколько, в замере две строки с `NULL` вошли).",
        "Оба создают уникальный индекс.",
      ),
    ]),
    iq("sql.keys-constraints.i3", "intermediate", "Что происходит при удалении родительской строки, на которую есть ссылки, в зависимости от ON DELETE?", [
      ul(
        "`NO ACTION`/`RESTRICT` — ошибка, удаление отменяется.",
        "`CASCADE` — потомки удаляются автоматически (в замере удаление автора убрало 2 из 3 книг).",
        "`SET NULL` — ссылка в потомках обнуляется (в замере отзыв остался с `author_id = NULL`).",
        "Выбор зависит от смысла связи: «принадлежит» — `CASCADE`, «ссылается» — `RESTRICT`/`SET NULL`.",
      ),
    ]),
    iq("sql.keys-constraints.i4", "intermediate", "Почему CHECK (price > 0) пропускает NULL и как требовать обязательность?", [
      ul(
        "`CHECK` отвергает строку, только если условие **ложно**; для `NULL` оно неизвестно — строка проходит.",
        "Обязательность задаёт `NOT NULL`: `price numeric NOT NULL CHECK (price > 0)`.",
        "Это следствие трёхзначной логики SQL.",
      ),
    ]),
    iq("sql.keys-constraints.i5", "intermediate", "Суррогатный или естественный ключ — что выбрать?", [
      ul(
        "Суррогатный (`identity`, `uuid`) стабилен и компактен; естественные свойства (email, ИНН, ISBN) меняются или бывают неуникальными.",
        "Обычная практика: суррогатный первичный ключ + `UNIQUE` на естественные идентификаторы, которые должны быть уникальны.",
        "Естественный ключ уместен, если он действительно неизменен и компактен (например, код валюты ISO 4217).",
      ),
    ]),
    iq("sql.keys-constraints.i6", "advanced", "Как безопасно добавить ограничение в большую живую таблицу с возможными нарушениями?", [
      ul(
        "`ADD CONSTRAINT … CHECK (…) NOT VALID` — новые строки проверяются сразу, старые не сканируются, блокировка короткая.",
        "Найти и исправить нарушающие строки запросом.",
        "`ALTER TABLE … VALIDATE CONSTRAINT …` — полная проверка без долгой блокировки записи (в PostgreSQL берётся более слабая блокировка).",
        "Аналогично для внешних ключей: `NOT VALID`, затем `VALIDATE`; для уникальности — сначала `CREATE UNIQUE INDEX CONCURRENTLY`.",
      ),
    ]),
    iq("sql.keys-constraints.i7", "engineering", "Зачем нужны отложенные (DEFERRABLE) ограничения? Приведите пример.", [
      ul(
        "Проверка откладывается до `COMMIT`: внутри транзакции данные могут быть временно несогласованными.",
        "Примеры: циклические внешние ключи (две таблицы ссылаются друг на друга), перестановка значений в `UNIQUE` (`UPDATE … SET n = n + 1`).",
        "В замере обычный `UNIQUE` отверг сдвиг `1,2,3 → 2,3,4`, а отложенный с `SET CONSTRAINTS ALL DEFERRED` пропустил.",
      ),
    ]),
    iq("sql.keys-constraints.i8", "debugging", "Вставка с корректными данными падает на внешнем ключе: «is not present in table». Как искать причину?", [
      ul(
        "Проверить, существует ли родитель: `SELECT 1 FROM parent WHERE id = …` — возможно, он создаётся позже или в другой транзакции.",
        "Проверить типы и значения (пробелы, регистр, `integer` и `text`).",
        "Порядок загрузки: сначала родители, потом потомки; для циклов — `DEFERRABLE` или двухэтапная вставка.",
        "Вывод `DETAIL: Key (customer_id)=(42) is not present` называет значение и ключ.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.keys-constraints.e1", "foundation", "Какое ограничение гарантирует, что значение не `NULL` и уникально?", ["`UNIQUE`", "`CHECK`", "`PRIMARY KEY`", "`DEFAULT`"], 2, "`PRIMARY KEY` объединяет `UNIQUE` и `NOT NULL`."),
    mcq("sql.keys-constraints.e2", "foundation", "Что делает `REFERENCES customers (id)` в определении столбца?", ["Создаёт внешний ключ: значение должно существовать в `customers.id`", "Копирует данные клиента", "Делает столбец уникальным", "Создаёт индекс по `customers`"], 0, "Внешний ключ запрещает ссылки на несуществующие строки."),
    mcq("sql.keys-constraints.e3", "foundation", "Что произойдёт при `INSERT` строки, нарушающей `CHECK`?", ["Строка запишется с `NULL`", "Строка запишется, но будет помечена", "СУБД исправит значение", "Команда завершится ошибкой, строка не запишется"], 3, "Ограничение отвергает строку, команда отменяется."),
    mcq("sql.keys-constraints.e4", "intermediate", "Сколько строк с `email = NULL` можно вставить в столбец с `UNIQUE`?", ["Одну", "Сколько угодно", "Не больше двух", "Ни одной"], 1, "Для `UNIQUE` значения `NULL` не равны друг другу: в замере вошли две (PostgreSQL), ограничений на число нет."),
    mcq("sql.keys-constraints.e5", "intermediate", "Какие действия возможны для `ON DELETE` внешнего ключа в PostgreSQL? Выберите все.", ["`CASCADE`", "`SET NULL`", "`RESTRICT`", "`MERGE`"], [0, 1, 2], "`CASCADE`, `SET NULL`, `RESTRICT`, `NO ACTION`, `SET DEFAULT`; `MERGE` — не действие внешнего ключа."),
    mcq("sql.keys-constraints.e6", "intermediate", "Что вернёт `SELECT count(*)` после `DELETE FROM authors WHERE id = 1`, если у автора 2 из 3 книг и `ON DELETE CASCADE`?", ["`3`", "`2`", "Ошибка", "`1`"], 3, "Каскад удалил обе книги автора `1`; осталась одна книга (замер: `books_left = 1`)."),
    mcq("sql.keys-constraints.e7", "advanced", "Что произойдёт при `ALTER TABLE t ADD CONSTRAINT c CHECK (qty >= 0)`, если в таблице уже есть строка с `qty = -3`?", ["Строка автоматически исправится", "Ограничение добавится, строка останется", "Ошибка: `violated by some row`", "Строка удалится"], 2, "Обычное `ADD CONSTRAINT` проверяет все существующие строки; с `NOT VALID` старые строки не проверяются."),
    open("sql.keys-constraints.e8", "intermediate", "Объясните, почему проверки уникальности только в коде приложения («сначала SELECT, потом INSERT») недостаточны, и как это исправить.", [
      ul(
        "Проверка и вставка неатомарны: два параллельных запроса оба увидят «нет такого email» и оба вставят — получится дубль.",
        "Данные пишут не только приложение: миграции, скрипты, ручные правки.",
        "Исправление: `UNIQUE (email)` в схеме; приложение обрабатывает ошибку нарушения уникальности (или использует `INSERT … ON CONFLICT`).",
        "Проверка в коде остаётся для дружелюбного сообщения, но гарантия — в БД.",
      ),
    ], ["Названа гонка между SELECT и INSERT", "Указаны другие источники записи", "Предложено UNIQUE/ON CONFLICT"], { format: "concept" }),
  ],

  mastery: [
    mcq("sql.keys-constraints.m1", "intermediate", "Какие из вставок в `users (id PRIMARY KEY, login UNIQUE NOT NULL, age CHECK (age >= 18))` пройдут: `(1,'a',30)`, `(2,'a',25)`, `(3,'b',17)`, `(4,'c',NULL)`, `(1,'d',40)`?", ["Первая и вторая", "Первая и четвёртая", "Только первая", "Все, кроме третьей"], 1, "Вторая нарушает `UNIQUE (login)`, третья — `CHECK`, пятая — `PRIMARY KEY`; `NULL` в `age` проходит `CHECK` (замер: остались `id` 1 и 4)."),
    mcq("sql.keys-constraints.m2", "advanced", "Почему `UPDATE slots SET n = n + 1` на значениях 1, 2, 3 с обычным `UNIQUE` падает, а с отложенным ограничением — нет?", ["Обычное проверяется после каждой строки и видит временный дубль 2, отложенное — при `COMMIT`, когда набор уже 2, 3, 4", "Отложенные ограничения не проверяются вовсе", "Из-за порядка индексов", "Это ошибка PostgreSQL"], 0, "Построчная проверка натыкается на ещё не изменённую строку; отложенная проверка выполняется в конце транзакции."),
    mcq("sql.keys-constraints.m3", "advanced", "После `DELETE` строки с `id = 2` из таблицы с `GENERATED ALWAYS AS IDENTITY` новая строка получит…", ["`2`, так как номер свободен", "`1`", "`3` — номера не переиспользуются", "`NULL`"], 2, "Последовательность хранится отдельно от таблицы и только растёт (замер: после удаления второй строки новая получила `3`)."),
    open("sql.keys-constraints.m4", "advanced", "В таблице `orders` 50 млн строк, и нужно добавить внешний ключ `customer_id → customers(id)`, допуская, что среди данных есть «сироты». Опишите безопасный план без долгой блокировки.", [
      ul(
        "Добавить ключ как `NOT VALID`: `ALTER TABLE orders ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers (id) NOT VALID` — новые строки проверяются сразу, старые не сканируются, блокировка короткая.",
        "Найти «сирот» (`LEFT JOIN … WHERE c.id IS NULL`), решить судьбу (создать клиентов, обнулить ссылку, удалить заказы) и исправить данные пакетами.",
        "`ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_fk` — проверка существующих строк с более слабой блокировкой (не блокирует запись).",
        "Заранее создать индекс на `orders (customer_id)` через `CREATE INDEX CONCURRENTLY`: он ускорит проверки удаления родителя и соединения.",
        "Проверить на копии: время `VALIDATE`, нагрузку, откат плана.",
      ),
    ], ["Использован NOT VALID", "Описан поиск и исправление сирот", "Указан VALIDATE CONSTRAINT", "Упомянут индекс по внешнему ключу"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.keys-constraints.f1", front: "PRIMARY KEY?", back: "UNIQUE + NOT NULL. Идентифицирует строку; один на таблицу; может быть составным." },
    { id: "sql.keys-constraints.f2", front: "UNIQUE и NULL?", back: "Допускает несколько NULL (они не равны друг другу). Запретить: UNIQUE NULLS NOT DISTINCT (PG 15+)." },
    { id: "sql.keys-constraints.f3", front: "CHECK и NULL?", back: "CHECK отвергает только ложь. NULL проходит. Обязательность — NOT NULL." },
    { id: "sql.keys-constraints.f4", front: "ON DELETE?", back: "NO ACTION/RESTRICT — ошибка; CASCADE — удалить потомков; SET NULL — обнулить ссылку; SET DEFAULT." },
    { id: "sql.keys-constraints.f5", front: "Индекс на внешний ключ?", back: "PostgreSQL не создаёт его автоматически: индексируйте столбец FK в дочерней таблице." },
    { id: "sql.keys-constraints.f6", front: "NOT VALID + VALIDATE?", back: "Безопасное добавление CHECK/FK к большой таблице: сначала для новых строк, потом проверка старых." },
    { id: "sql.keys-constraints.f7", front: "identity и откат?", back: "Номера не переиспользуются и не откатываются: нумерация может иметь дыры." },
    { id: "sql.keys-constraints.f8", front: "Отложенные ограничения?", back: "DEFERRABLE + SET CONSTRAINTS DEFERRED: проверка при COMMIT; нужны для циклов и сдвига значений." },
    { id: "sql.keys-constraints.f9", front: "SQLite и внешние ключи?", back: "По умолчанию выключены: PRAGMA foreign_keys = ON для каждого соединения." },
  ],

  sources: [
    { title: "PostgreSQL 16: Constraints", url: "https://www.postgresql.org/docs/16/ddl-constraints.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: CREATE TABLE", url: "https://www.postgresql.org/docs/16/sql-createtable.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: ALTER TABLE", url: "https://www.postgresql.org/docs/16/sql-altertable.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: SET CONSTRAINTS", url: "https://www.postgresql.org/docs/16/sql-set-constraints.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Identity Columns", url: "https://www.postgresql.org/docs/16/ddl-identity-columns.html", publisher: "PostgreSQL" },
    { title: "SQLite: Foreign Key Support", url: "https://www.sqlite.org/foreignkeys.html", publisher: "Other" },
    { title: "SQLite: CREATE TABLE", url: "https://www.sqlite.org/lang_createtable.html", publisher: "Other" },
  ],
};
