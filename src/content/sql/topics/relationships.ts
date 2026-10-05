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

export const relationships: Topic = {
  id: "sql.relationships",
  slug: "relationships",
  domain: "sql",
  module: "design",
  title: "Связи между таблицами: один-к-одному, один-ко-многим, многие-ко-многим",
  titleEn: "Table Relationships: One-to-One, One-to-Many, Many-to-Many",
  summary:
    "Связи — это то, ради чего реляционная модель называется реляционной: внешние ключи превращают отдельные таблицы в согласованную схему. Тема на замерах PostgreSQL 16.14 и SQLite 3.49: один-ко-многим (у автора с двумя книгами, у Кафки — 0), действия `ON DELETE` (после удаления родителя `CASCADE` оставил 1 из 3 дочерних строк, `SET NULL` — 2, из них 1 без родителя; `RESTRICT` отказал с ошибкой), многие-ко-многим через таблицу связи с составным ключом (SQL — 3 студента, Git — 2, HTML — 1; повторная запись отклонена), один-к-одному на общем первичном ключе, полиморфная связь как антипаттерн (комментарий к несуществующему посту сохранился) и её замена «исключающей дугой» с `CHECK`, а также факт, что PostgreSQL не создаёт индекс на столбце внешнего ключа сам.",
  minutes: 90,
  prerequisites: ["sql.keys-constraints", "sql.inner-left-joins", "sql.normalization"],
  tags: ["relationships", "one-to-many", "many-to-many", "one-to-one", "foreign key", "junction table", "ON DELETE CASCADE", "SET NULL", "RESTRICT", "referential integrity", "cardinality", "polymorphic association", "exclusive arc", "self-reference", "ER diagram"],
  keyConcepts: [
    { term: "Внешний ключ ставится на стороне «многих»", text: "`books.author_id → authors.id`: у автора много книг, у книги один автор. Автор без книг (у Кафки 0) остаётся видимым через `LEFT JOIN`." },
    { term: "Многие-ко-многим требуют таблицы связи", text: "`enrollments(student_id, course_id)` с составным ключом: пара встречается один раз (повторная запись отклонена), а свойства связи (оценка, дата) хранятся в ней же." },
    { term: "Один-к-одному — внешний ключ плюс уникальность", text: "`profiles.user_id` — одновременно `PRIMARY KEY` и `REFERENCES users`: второй профиль того же пользователя отклонён ошибкой `duplicate key`." },
    { term: "ON DELETE описывает судьбу детей", text: "`CASCADE` удаляет, `SET NULL` обнуляет ссылку, `RESTRICT`/`NO ACTION` запрещают удаление родителя. Каскад двухуровневый: удаление автора убрало его книги и их отзывы." },
    { term: "Полиморфные «связи» ломают целостность", text: "`target_type + target_id` не может быть внешним ключом: в замере комментарий к несуществующему посту сохранился. Решение — по внешнему ключу на цель и `CHECK` «ровно одна цель»." },
    { term: "Индекс на внешнем ключе создаёт разработчик", text: "В PostgreSQL после `CREATE TABLE … REFERENCES` индексов было два (оба первичные); индекс по `author_id` надо добавить явно." },
  ],
  sections: [
    section("definition", [
      def("Связь", "Логическая зависимость между строками двух таблиц, выраженная значением, которое одна строка хранит о другой (внешним ключом).", "relationship"),
      def("Внешний ключ", "Столбец (или набор) в дочерней таблице, значения которого обязаны присутствовать в ключе родительской; СУБД проверяет это при каждой вставке, обновлении и удалении.", "foreign key"),
      def("Кратность", "Сколько строк одной стороны связано со строками другой: 1:1, 1:N, M:N, с обязательностью или без.", "cardinality"),
      def("Таблица связи", "Дополнительная таблица, превращающая M:N в две связи 1:N; её ключ обычно составной из двух внешних ключей.", "junction / association table"),
      def("Ссылочная целостность", "Гарантия, что внешние ключи не указывают на несуществующие строки; нарушается вставкой «сироты» или удалением родителя без обработки детей.", "referential integrity"),
      def("Действие ссылки", "Предложение `ON DELETE`/`ON UPDATE`, определяющее, что СУБД делает с дочерними строками: `NO ACTION`, `RESTRICT`, `CASCADE`, `SET NULL`, `SET DEFAULT`.", "referential action"),
      def("Самоссылка", "Внешний ключ на ту же таблицу (`employees.manager_id → employees.id`): основа иерархий.", "self-reference"),
    ]),

    section("why", [
      h("Схема данных — это в первую очередь связи"),
      p("Строки сами по себе мало что значат: заказ принадлежит клиенту, позиция — заказу, тег — многим постам. Если связь выражена в схеме внешним ключом, база защищает её сама: нельзя завести заказ несуществующего клиента, нельзя случайно удалить клиента с заказами. Если связь живёт только в коде приложения, сироты и дубли рано или поздно появятся — их порождает любая гонка, ручной `UPDATE` или забытая проверка."),
      ul(
        "**Целостность на уровне базы:** правило действует для всех приложений, скриптов и ручных правок.",
        "**Правильные запросы:** кратность определяет, где нужен `JOIN`, `LEFT JOIN` и `DISTINCT`.",
        "**Предсказуемые удаления:** `ON DELETE` заранее решает, что станет с зависимыми данными.",
        "**Самодокументирование:** по внешним ключам читается модель предметной области.",
      ),
      note("Кратность — свойство предметной области, а не таблиц. «У заказа один клиент» — правило бизнеса; схема лишь закрепляет его, и ошибка здесь дороже любой ошибки в запросе."),
    ]),

    section("mental-model", [
      h("«Ссылка» всегда лежит на стороне «многих»"),
      p("Спросите о двух сущностях: «сколько B может быть у одного A?» и «сколько A может быть у одного B?». Если ответ в обе стороны «один» — связь 1:1. Если «много» в одну сторону и «один» в другую — 1:N, а внешний ключ ставится в таблицу «многих» (книга хранит `author_id`). Если «много» в обе стороны — M:N: ни одна из таблиц ключ хранить не может (список в ячейке нарушает 1НФ), поэтому появляется третья таблица, которая хранит пары."),
      diagram(
        `
        1 : N        authors ──< books                      (books.author_id → authors.id)

        M : N        students ──< enrollments >── courses   (enrollments: PRIMARY KEY (student_id, course_id))

        1 : 1        users ──── profiles                    (profiles.user_id — PRIMARY KEY и FOREIGN KEY)

        «──<» — одна строка слева, много справа
        `,
        "Три основные кратности и где хранится ключ.",
      ),
      h("Как выбрать способ записи связи"),
      steps(
        [
          ["Определить кратность", "Ответить на вопрос в обе стороны и учесть обязательность (может ли у книги не быть автора?)."],
          ["Выбрать сторону ключа", "Для 1:N — в таблице «многих»; для M:N — в таблице связи; для 1:1 — в зависимой таблице."],
          ["Закрепить ограничениями", "`NOT NULL` для обязательной связи, `UNIQUE`/`PRIMARY KEY` для 1:1 и пар M:N."],
          ["Выбрать судьбу детей", "`CASCADE`, `SET NULL` или `RESTRICT` — осознанно, а не по умолчанию."],
          ["Проиндексировать ключ", "Индекс по внешнему ключу ускоряет соединения и удаление родителей."],
        ],
        "Проектирование связи",
      ),
    ]),

    section("technical", [
      h("Три основные связи"),
      table(
        ["Связь", "Как моделируется", "Ограничения", "Пример"],
        [
          ["1:N", "Внешний ключ в таблице «многих»", "`NOT NULL`, если родитель обязателен", "`books.author_id`"],
          ["M:N", "Таблица связи с двумя внешними ключами", "Составной `PRIMARY KEY (a_id, b_id)`", "`enrollments`"],
          ["1:1", "Внешний ключ с уникальностью (часто он же первичный)", "`PRIMARY KEY` или `UNIQUE` на внешнем ключе", "`profiles.user_id`"],
          ["Иерархия", "Самоссылка", "Внешний ключ на ту же таблицу; корень — `NULL`", "`employees.manager_id`"],
        ],
        "Способы моделирования связей",
      ),
      h("Действия ссылок"),
      table(
        ["Действие", "Что происходит при удалении родителя", "Когда выбирать"],
        [
          ["`NO ACTION` (по умолчанию)", "Ошибка, если остались дети; проверка может быть отложена до конца транзакции", "Безопасное поведение по умолчанию"],
          ["`RESTRICT`", "Ошибка сразу, отложить нельзя", "Строгий запрет удаления"],
          ["`CASCADE`", "Дети удаляются вместе с родителем", "Строгая принадлежность: позиции заказа, профиль"],
          ["`SET NULL`", "Ссылка у детей становится `NULL`", "Необязательная связь: автор архивирован, книги остаются"],
          ["`SET DEFAULT`", "Ссылка получает значение по умолчанию", "Редко; нужен подходящий родитель по умолчанию"],
        ],
        "Действия внешнего ключа в PostgreSQL",
      ),
      h("Правила проектирования"),
      ul(
        "Внешний ключ ссылается на уникальный (`PRIMARY KEY` или `UNIQUE`) столбец родителя.",
        "Тип столбца внешнего ключа совпадает с типом родительского ключа.",
        "`NOT NULL` на внешнем ключе делает связь обязательной; без него — необязательной.",
        "Таблица связи M:N — полноценная таблица: в ней живут свойства самой связи (дата записи, оценка).",
        "Индексы по столбцам внешних ключей создаёт разработчик: PostgreSQL этого не делает автоматически.",
      ),
      warn("`ON DELETE CASCADE` удаляет молча и транзитивно: цепочка «автор → книги → отзывы» исчезает одной командой. Включайте каскад только там, где зависимые данные не имеют смысла без родителя."),
    ]),

    section("syntax", [
      p("Таблица связи многие-ко-многим: два внешних ключа, составной первичный ключ и свойства самой связи."),
      annotated(
        "sql",
        `-- Многие-ко-многим: студент проходит много курсов, на курсе много студентов; связь — отдельная таблица
CREATE TABLE students (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE courses  (id integer PRIMARY KEY, title text NOT NULL);
CREATE TABLE enrollments (
  student_id  integer NOT NULL REFERENCES students (id),
  course_id   integer NOT NULL REFERENCES courses (id),
  enrolled_on date    NOT NULL,
  grade       integer,
  PRIMARY KEY (student_id, course_id)
);
INSERT INTO students VALUES (1, 'Анна'), (2, 'Борис'), (3, 'Вера');
INSERT INTO courses  VALUES (1, 'SQL'), (2, 'Git'), (3, 'HTML');
INSERT INTO enrollments VALUES
  (1, 1, '2024-02-01', 5), (1, 2, '2024-02-01', 4),
  (2, 1, '2024-02-05', 3),
  (3, 1, '2024-02-10', 5), (3, 2, '2024-02-10', NULL), (3, 3, '2024-03-01', 4);

-- В обе стороны: студентов на курсе и курсов у студента
SELECT c.title, count(*) AS students FROM enrollments AS e JOIN courses AS c ON c.id = e.course_id GROUP BY c.id, c.title ORDER BY c.id;
SELECT s.name, count(*) AS courses, round(avg(e.grade), 1) AS avg_grade
FROM enrollments AS e JOIN students AS s ON s.id = e.student_id GROUP BY s.id, s.name ORDER BY s.id;

-- Кто записан и на SQL, и на Git: условие «и то и другое» — через счётчик различных курсов
SELECT s.name
FROM enrollments AS e
JOIN students AS s ON s.id = e.student_id
JOIN courses  AS c ON c.id = e.course_id
WHERE c.title IN ('SQL', 'Git')
GROUP BY s.id, s.name
HAVING count(DISTINCT c.title) = 2
ORDER BY s.name;`,
        [
          { line: 1, text: "Комментарий называет кратность: студент — много курсов, курс — много студентов." },
          { line: [2, 3], text: "Две «сущностные» таблицы: студенты и курсы, у каждой свой первичный ключ." },
          { line: [4, 10], text: "Таблица связи `enrollments`: два внешних ключа на стороны связи и свойства самой связи (`enrolled_on`, `grade`)." },
          { line: 9, text: "`PRIMARY KEY (student_id, course_id)` — пара встречается ровно один раз: дубли запрещены самой схемой." },
          { line: [11, 16], text: "Данные: Вера записана на три курса, на SQL — трое студентов." },
          { line: [18, 21], text: "Запросы «в обе стороны»: сколько студентов на курсе и сколько курсов у студента. `avg` пропускает `NULL`: у Веры оценка по Git не выставлена, среднее по двум курсам — 4.5." },
          { line: [23, 31], text: "Условие «и SQL, и Git»: фильтр по двум значениям и счётчик различных курсов `= 2` в `HAVING`." },
        ],
        "05-many-to-many.sql",
      ),
      code("text", ` title | students 
-------+----------
 SQL   |        3
 Git   |        2
 HTML  |        1
(3 rows)

 name  | courses | avg_grade 
-------+---------+-----------
 Анна  |       2 |       4.5
 Борис |       1 |       3.0
 Вера  |       3 |       4.5
(3 rows)

 name 
------
 Анна
 Вера
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
    ]),

    section("minimal-example", [
      p("Один-ко-многим: внешний ключ стоит в таблице «многих». Автор без книг остаётся видимым через `LEFT JOIN`."),
      code("sql", `-- Один-ко-многим: у автора много книг, у книги один автор; внешний ключ стоит на стороне «многих»
CREATE TABLE authors (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE books (
  id        integer PRIMARY KEY,
  title     text    NOT NULL,
  author_id integer NOT NULL REFERENCES authors (id)
);
INSERT INTO authors VALUES (1, 'Булгаков'), (2, 'Гоголь'), (3, 'Кафка');
INSERT INTO books VALUES (1, 'Мастер и Маргарита', 1), (2, 'Белая гвардия', 1), (3, 'Мёртвые души', 2);

-- LEFT JOIN сохраняет автора без книг: у Кафки их ноль
SELECT a.name, count(b.id) AS books
FROM authors AS a LEFT JOIN books AS b ON b.author_id = a.id
GROUP BY a.id, a.name
ORDER BY a.id;`, { filename: "01-one-to-many.sql", runnable: true }),
      code("text", `   name   | books 
----------+-------
 Булгаков |     2
 Гоголь   |     1
 Кафка    |     0
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("У Булгакова две книги, у Гоголя одна, у Кафки нет ни одной: `count(b.id)` считает только существующие книги (`count(*)` дал бы 1 у Кафки). Теперь — что делает внешний ключ, когда его пытаются нарушить:"),
      code("sql", `CREATE TABLE authors (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE books (
  id        integer PRIMARY KEY,
  title     text    NOT NULL,
  author_id integer NOT NULL REFERENCES authors (id)
);
INSERT INTO authors VALUES (1, 'Булгаков');
INSERT INTO books VALUES (1, 'Мастер и Маргарита', 1);

-- Книга с несуществующим автором
INSERT INTO books VALUES (2, 'Книга без автора', 99);
-- Автор, у которого есть книги
DELETE FROM authors WHERE id = 1;
-- Книга без автора невозможна из-за NOT NULL
INSERT INTO books (id, title) VALUES (3, 'Тоже без автора');`, { filename: "02-orphans.pg.sql" }),
      code("text", `ERROR:  insert or update on table "books" violates foreign key constraint "books_author_id_fkey"
DETAIL:  Key (author_id)=(99) is not present in table "authors".
ERROR:  update or delete on table "authors" violates foreign key constraint "books_author_id_fkey" on table "books"
DETAIL:  Key (id)=(1) is still referenced from table "books".
ERROR:  null value in column "author_id" of relation "books" violates not-null constraint
DETAIL:  Failing row contains (3, Тоже без автора, null).`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Книга с автором 99 отклонена: `Key (author_id)=(99) is not present in table \"authors\"`.",
        "Удаление автора с книгами отклонено: `Key (id)=(1) is still referenced`.",
        "Книга без автора невозможна из-за `NOT NULL` — связь обязательна.",
      ),
    ]),

    section("detailed-example", [
      h("Что делать с детьми: CASCADE и SET NULL"),
      code("sql", `-- Что делать с «детьми» при удалении «родителя»: CASCADE удаляет, SET NULL обнуляет ссылку
CREATE TABLE parent (id integer PRIMARY KEY);
CREATE TABLE child_cascade (id integer PRIMARY KEY, parent_id integer REFERENCES parent (id) ON DELETE CASCADE);
CREATE TABLE child_setnull (id integer PRIMARY KEY, parent_id integer REFERENCES parent (id) ON DELETE SET NULL);
INSERT INTO parent VALUES (1), (2);
INSERT INTO child_cascade VALUES (10, 1), (11, 1), (12, 2);
INSERT INTO child_setnull VALUES (20, 1), (21, 2);

DELETE FROM parent WHERE id = 1;

SELECT 'CASCADE: строк осталось' AS what, count(*) AS n FROM child_cascade
UNION ALL
SELECT 'SET NULL: строк осталось', count(*) FROM child_setnull
UNION ALL
SELECT 'SET NULL: из них без родителя', count(*) FROM child_setnull WHERE parent_id IS NULL;`, { filename: "03-fk-actions.sql", runnable: true }),
      code("text", `             what              | n 
-------------------------------+---
 CASCADE: строк осталось       | 1
 SET NULL: строк осталось      | 2
 SET NULL: из них без родителя | 1
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Родитель 1 имел двух детей в `child_cascade` и одного в `child_setnull`. После удаления: каскад убрал двух (осталась 1 строка, ребёнок родителя 2), а `SET NULL` сохранил обе строки, у одной из которых ссылка стала пустой. Запрет:"),
      code("sql", `CREATE TABLE parent (id integer PRIMARY KEY);
CREATE TABLE child_restrict (id integer PRIMARY KEY, parent_id integer REFERENCES parent (id) ON DELETE RESTRICT);
INSERT INTO parent VALUES (1);
INSERT INTO child_restrict VALUES (10, 1);
-- RESTRICT (и действие по умолчанию NO ACTION) запрещает удалять родителя с детьми
DELETE FROM parent WHERE id = 1;
SELECT count(*) AS parents_left FROM parent;`, { filename: "04-restrict.pg.sql" }),
      code("text", `ERROR:  update or delete on table "parent" violates foreign key constraint "child_restrict_parent_id_fkey" on table "child_restrict"
DETAIL:  Key (id)=(1) is still referenced from table "child_restrict".
 parents_left 
--------------
            1
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`RESTRICT` отказал в удалении, родитель остался (`parents_left = 1`). Для `NO ACTION` результат здесь тот же; отличие в том, что проверку `NO ACTION` можно отложить до конца транзакции (для отложенных ограничений), а `RESTRICT` — нет."),
      h("Один-к-одному"),
      code("sql", `-- Один-к-одному: профиль принадлежит ровно одному пользователю; первичный ключ профиля — он же внешний
CREATE TABLE users (id integer PRIMARY KEY, email text NOT NULL UNIQUE);
CREATE TABLE profiles (
  user_id integer PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  bio     text
);
INSERT INTO users VALUES (1, 'anna@example.com'), (2, 'boris@example.com'), (3, 'vera@example.com');
INSERT INTO profiles VALUES (1, 'Разработчик'), (3, 'Аналитик');

-- Профиль необязателен: LEFT JOIN показывает пользователей без него
SELECT u.email, p.bio FROM users AS u LEFT JOIN profiles AS p ON p.user_id = u.id ORDER BY u.id;`, { filename: "06-one-to-one.sql", runnable: true }),
      code("text", `       email       |     bio     
-------------------+-------------
 anna@example.com  | Разработчик
 boris@example.com | 
 vera@example.com  | Аналитик
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      code("sql", `CREATE TABLE users (id integer PRIMARY KEY, email text NOT NULL UNIQUE);
CREATE TABLE profiles (
  user_id integer PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  bio     text
);
INSERT INTO users VALUES (1, 'anna@example.com');
INSERT INTO profiles VALUES (1, 'Разработчик');
-- Второй профиль того же пользователя
INSERT INTO profiles VALUES (1, 'Ещё один');`, { filename: "07-one-to-one-violation.pg.sql" }),
      code("text", `ERROR:  duplicate key value violates unique constraint "profiles_pkey"
DETAIL:  Key (user_id)=(1) already exists.`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Профиль необязателен (у Бориса его нет), но у пользователя он не больше одного: первичный ключ `user_id` отклонил второй профиль с ошибкой `duplicate key`. Тот же результат даёт отдельный внешний ключ с ограничением `UNIQUE`; общий первичный ключ экономит один индекс и ясно показывает, что профиль — часть пользователя."),
    ]),

    section("analysis", [
      table(
        ["Проверка", "Результат (замер)", "Что показывает"],
        [
          ["`LEFT JOIN` авторов с книгами", "2, 1, 0 книг", "Необязательная сторона 1:N"],
          ["Вставка книги с несуществующим автором", "Ошибка внешнего ключа", "Целостность защищена базой"],
          ["Удаление родителя: `CASCADE` / `SET NULL`", "1 строка осталась / 2 строки, одна с `NULL`", "Разная судьба детей"],
          ["Повторная запись студента на курс", "Ошибка составного ключа", "Пара встречается один раз"],
          ["Второй профиль пользователя", "`duplicate key`", "Кратность 1:1 закреплена ключом"],
          ["Комментарий к несуществующему посту (полиморфная связь)", "Сохранён", "Целостность держится только на коде"],
        ],
        "Что показали замеры PostgreSQL 16.14",
      ),
      h("Проверка кратности по данным"),
      code("sql", `-- Проверка кратности по данным: сколько клиентов с 0, 1, 2… заказами
SELECT orders_count, count(*) AS customers
FROM (
  SELECT c.id, count(o.id) AS orders_count
  FROM customers AS c LEFT JOIN orders AS o ON o.customer_id = c.id
  GROUP BY c.id
) AS t
GROUP BY orders_count
ORDER BY orders_count;`, { filename: "10-cardinality.sql", runnable: true, fixture: "shop" }),
      code("text", ` orders_count | customers 
--------------+-----------
            0 |         2
            1 |         2
            2 |         2
            3 |         1
            4 |         1
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Распределение «заказов на клиента» в фикстуре: двое без заказов (Егор и Игорь), двое с одним, двое с двумя, по одному с тремя и четырьмя. «Один-ко-многим с необязательной стороной» подтверждается данными, а не только схемой. Данные могут опровергнуть гипотезу о кратности (например, нашлись клиенты с двумя профилями), но подтверждает её только правило предметной области и ограничение в схеме."),
    ]),

    section("internals", [
      h("Полиморфные связи: что не умеет внешний ключ"),
      code("sql", `-- Полиморфная связь «комментарий к чему угодно»: целевая таблица записана строкой, внешний ключ невозможен
CREATE TABLE posts  (id integer PRIMARY KEY, title text NOT NULL);
CREATE TABLE photos (id integer PRIMARY KEY, file  text NOT NULL);
CREATE TABLE comments_poly (id integer PRIMARY KEY, target_type text NOT NULL, target_id integer NOT NULL, body text NOT NULL);
INSERT INTO posts  VALUES (1, 'О SQL');
INSERT INTO photos VALUES (1, 'cat.jpg');
INSERT INTO comments_poly VALUES
  (1, 'post', 1, 'Хорошая статья'),
  (2, 'photo', 1, 'Милый кот'),
  (3, 'post', 42, 'Комментарий к несуществующей записи');

-- База приняла комментарий к несуществующему посту: целостность держится только на коде приложения
SELECT c.id, c.body
FROM comments_poly AS c LEFT JOIN posts AS p ON c.target_type = 'post' AND p.id = c.target_id
WHERE c.target_type = 'post' AND p.id IS NULL;`, { filename: "08-polymorphic.sql", runnable: true }),
      code("text", ` id |                body                 
----+-------------------------------------
  3 | Комментарий к несуществующей записи
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Столбцы `target_type` и `target_id` не могут быть внешним ключом: цель определяется значением строки. База приняла комментарий 3 к посту 42, которого нет, и обнаружить это можно только запросом-проверкой. Альтернатива — «исключающая дуга»: по внешнему ключу на каждую цель и `CHECK`, что заполнена ровно одна."),
      code("sql", `-- Вместо строки с типом — по внешнему ключу на каждую цель и проверка «ровно одна цель»
CREATE TABLE posts  (id integer PRIMARY KEY, title text NOT NULL);
CREATE TABLE photos (id integer PRIMARY KEY, file  text NOT NULL);
CREATE TABLE comments (
  id       integer PRIMARY KEY,
  post_id  integer REFERENCES posts (id),
  photo_id integer REFERENCES photos (id),
  body     text NOT NULL,
  CONSTRAINT one_target CHECK ((post_id IS NULL) <> (photo_id IS NULL))
);
INSERT INTO posts VALUES (1, 'О SQL');
INSERT INTO photos VALUES (1, 'cat.jpg');
INSERT INTO comments VALUES (1, 1, NULL, 'Хорошая статья');
INSERT INTO comments VALUES (2, NULL, 1, 'Милый кот');
-- Несуществующая цель
INSERT INTO comments VALUES (3, 42, NULL, 'К несуществующему посту');
-- Две цели сразу
INSERT INTO comments VALUES (4, 1, 1, 'И к посту, и к фото');
-- Ни одной цели
INSERT INTO comments VALUES (5, NULL, NULL, 'Ни к чему');
SELECT count(*) AS comments_saved FROM comments;`, { filename: "09-exclusive-arc.pg.sql" }),
      code("text", `ERROR:  insert or update on table "comments" violates foreign key constraint "comments_post_id_fkey"
DETAIL:  Key (post_id)=(42) is not present in table "posts".
ERROR:  new row for relation "comments" violates check constraint "one_target"
DETAIL:  Failing row contains (4, 1, 1, И к посту, и к фото).
ERROR:  new row for relation "comments" violates check constraint "one_target"
DETAIL:  Failing row contains (5, null, null, Ни к чему).
 comments_saved 
----------------
              2
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Несуществующий пост — ошибка внешнего ключа.",
        "Две цели сразу и ни одной — ошибка `CHECK` (`one_target`).",
        "Сохранены только два корректных комментария. Цена: столбец на каждую цель; при многих целях удобнее общая родительская таблица («комментируемое») с дочерними `posts`, `photos`.",
      ),
      h("Индексы на внешних ключах"),
      code("sql", `-- Первичный ключ создаёт индекс автоматически, внешний ключ — нет
CREATE TABLE authors (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE books (
  id        integer PRIMARY KEY,
  title     text    NOT NULL,
  author_id integer NOT NULL REFERENCES authors (id)
);
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

CREATE INDEX books_author_id_idx ON books (author_id);
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'books' ORDER BY indexname;`, { filename: "15-fk-index.pg.sql" }),
      code("text", ` tablename |  indexname   
-----------+--------------
 authors   | authors_pkey
 books     | books_pkey
(2 rows)

 tablename |      indexname      
-----------+---------------------
 books     | books_author_id_idx
 books     | books_pkey
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Первичные ключи получили индексы автоматически, а `books.author_id` — нет. Без индекса соединение `books JOIN authors` по автору и проверка при удалении автора («есть ли ещё книги?») могут просматривать таблицу целиком. Для больших таблиц индекс по столбцам внешнего ключа почти всегда нужен."),
      note("В SQLite внешние ключи по умолчанию не проверяются: проверку включает `PRAGMA foreign_keys = ON` для каждого соединения. В песочнице курса она включена; в рабочем приложении об этом легко забыть."),
    ]),

    section("mistakes", [
      h("Ошибка: M:N без таблицы связи"),
      wrongRight(
        "sql",
        { title: "Список в ячейке", code: `CREATE TABLE students (id integer PRIMARY KEY, name text, course_ids text);`, note: "Нельзя повесить внешний ключ, посчитать студентов на курсе без разбора строки или защитить уникальность пары." },
        { title: "Таблица связи", code: `CREATE TABLE enrollments (\n  student_id integer REFERENCES students (id),\n  course_id integer REFERENCES courses (id),\n  PRIMARY KEY (student_id, course_id)\n);`, note: "Каждая пара — строка; ключ запрещает дубли, внешние ключи — «висячие» ссылки." },
      ),
      h("Ошибка: таблица связи без составного ключа"),
      code("sql", `-- Таблица связи без ключа: повторная запись одного студента на курс прошла незамеченной
CREATE TABLE enrollments (student_id integer NOT NULL, course_id integer NOT NULL);
INSERT INTO enrollments VALUES (1, 1), (2, 1), (3, 1), (1, 2), (1, 1);

-- Отчёт «студентов на курсе» завышен
SELECT course_id, count(*) AS students FROM enrollments GROUP BY course_id ORDER BY course_id;`, { filename: "12-ex-fix.sql", runnable: true }),
      code("text", ` course_id | students 
-----------+----------
         1 |        4
         2 |        1
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Повторная запись студента 1 на курс 1 прошла незамеченной, и отчёт показал 4 студента вместо 3. Составной `PRIMARY KEY (student_id, course_id)` сделал бы повтор невозможным."),
      h("Ошибка: CASCADE «на всякий случай»"),
      p("Каскад на всех внешних ключах превращает удаление одной строки в лавину: автор → книги → отзывы → оценки. Если нужна возможность «убрать» сущность, но сохранить историю, берите `SET NULL`, `RESTRICT` или мягкое удаление."),
      h("Ошибка: внешний ключ без индекса"),
      p("Соединение и удаление родителя будут просматривать дочернюю таблицу целиком (в замере PostgreSQL индекс по `author_id` не появился сам)."),
      h("Ошибка: полиморфная связь `type + id`"),
      p("Сохранён комментарий к несуществующему посту, и целостность поддерживает только приложение. Выбирайте внешний ключ на каждую цель и `CHECK` или общую родительскую таблицу."),
      h("Ошибка: путать кратность по текущим данным"),
      p("То, что сегодня у каждого пользователя один профиль, не делает связь 1:1. Если правило допускает несколько профилей, `UNIQUE` лишь вызовет ошибки в продакшене; если не допускает — без `UNIQUE` появятся дубли."),
    ]),

    section("antipatterns", [
      ul(
        "**Связь без внешнего ключа** («проверим в коде»): сироты появляются при гонках и ручных правках.",
        "**Список идентификаторов в одном столбце** вместо таблицы связи.",
        "**Полиморфная ассоциация `type + id`.**",
        "**`ON DELETE CASCADE` на всём подряд.**",
        "**Таблица связи с суррогатным `id` и без уникальности пары:** дубли гарантированы.",
        "**Универсальная таблица связей `links(from_type, from_id, to_type, to_id)`:** потеря типов и ограничений.",
        "**Двунаправленные «друзья» как две строки:** (1,2) и (2,1) нужно согласовывать; чаще — одна строка с `CHECK (a_id < b_id)`.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Определите кратность и обязательность** до рисования таблиц и запишите их в документации схемы.",
        "**Каждую связь — внешним ключом.** Обязательную — с `NOT NULL`.",
        "**Для M:N — таблица связи с составным ключом;** свойства связи — её столбцы.",
        "**Для 1:1 — общий первичный ключ или `UNIQUE` внешний ключ.**",
        "**Выбирайте `ON DELETE` осознанно:** `CASCADE` — для частей целого, `RESTRICT`/`NO ACTION` — для самостоятельных сущностей, `SET NULL` — для необязательных ссылок.",
        "**Индексируйте столбцы внешних ключей,** которые используются в соединениях и при удалении родителей.",
        "**Давайте ограничениям имена** (`CONSTRAINT one_target CHECK …`) — сообщения об ошибках станут понятнее.",
        "**Проверяйте схему негативными тестами:** вставки, которые обязаны упасть (пример в challenge).",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Составные внешние ключи** (`FOREIGN KEY (a, b) REFERENCES t (a, b)`): частично `NULL` по умолчанию проходят проверку (`MATCH SIMPLE`).",
        "**Циклические ссылки** (A ссылается на B, B на A): вставку решают отложенными ограничениями (`DEFERRABLE INITIALLY DEFERRED`) или порядком.",
        "**Самоссылка:** корень иерархии — строка с `NULL` в ссылке; цикл `A → B → A` внешний ключ не запрещает.",
        "**Связь «с историей»:** «клиент и его адреса по периодам» — M:N во времени, ключ включает период.",
        "**Мягкое удаление:** строка «удалена» флагом, внешние ключи остаются валидными; запросы должны учитывать флаг.",
        "**Миграции:** добавление внешнего ключа на большой таблице блокирует записи — в PostgreSQL это делают в два шага (`NOT VALID`, затем `VALIDATE CONSTRAINT`).",
      ),
    ]),

    section("related", [
      ul(
        "[Ключи и ограничения](/learn/sql/keys-constraints) — механика `PRIMARY KEY`, `UNIQUE`, `FOREIGN KEY` и `CHECK`.",
        "[Нормализация](/learn/sql/normalization) — откуда берутся отдельные таблицы и связи между ними.",
        "[INNER и LEFT JOIN](/learn/sql/inner-left-joins) — как читать связи запросами.",
        "[RIGHT, FULL, CROSS и SELF JOIN](/learn/sql/other-joins) — самоссылки и иерархии.",
        "[Паттерны проектирования схем](/learn/sql/schema-patterns) — история изменений, мягкое удаление, справочники.",
        "[Индексы и B-дерево](/learn/sql/indexes-btree) — индексы по внешним ключам.",
        "[Миграции и безопасный DDL](/learn/sql/migrations-safe-ddl) — добавление внешних ключей на живой базе.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Полиморфная связь",
          code: `
            CREATE TABLE comments_poly (
              id integer PRIMARY KEY,
              target_type text NOT NULL,
              target_id integer NOT NULL,
              body text NOT NULL
            );
          `,
          note: "Комментарий к несуществующему посту 42 сохранился (замер); целостность держится на коде приложения.",
        },
        {
          title: "Исключающая дуга",
          code: `
            CREATE TABLE comments (
              id integer PRIMARY KEY,
              post_id  integer REFERENCES posts (id),
              photo_id integer REFERENCES photos (id),
              body text NOT NULL,
              CONSTRAINT one_target CHECK ((post_id IS NULL) <> (photo_id IS NULL))
            );
          `,
          note: "Несуществующая цель, две цели и ни одной отклонены базой (замер: сохранены только два корректных комментария).",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.relationships.ex1",
      title: "Каскад на два уровня",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("В схеме «автор → книги → отзывы» обе связи объявлены с `ON DELETE CASCADE`. Предскажите, сколько строк останется в каждой таблице после удаления Булгакова (у него две книги с тремя отзывами на них), затем проверьте."),
        code("sql", `CREATE TABLE authors (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE books (
  id integer PRIMARY KEY, title text NOT NULL,
  author_id integer NOT NULL REFERENCES authors (id) ON DELETE CASCADE
);
CREATE TABLE reviews (
  id integer PRIMARY KEY, body text NOT NULL,
  book_id integer NOT NULL REFERENCES books (id) ON DELETE CASCADE
);
INSERT INTO authors VALUES (1, 'Булгаков'), (2, 'Гоголь');
INSERT INTO books VALUES (1, 'Мастер и Маргарита', 1), (2, 'Белая гвардия', 1), (3, 'Мёртвые души', 2);
INSERT INTO reviews VALUES (1, 'Отлично', 1), (2, 'Хорошо', 1), (3, 'Нормально', 2), (4, 'Классика', 3);

DELETE FROM authors WHERE id = 1;

SELECT (SELECT count(*) FROM authors) AS authors,
       (SELECT count(*) FROM books)   AS books,
       (SELECT count(*) FROM reviews) AS reviews;`, { filename: "11-ex-predict.sql", runnable: true }),
      ],
      hints: ["Какие книги принадлежат автору 1?", "Что происходит с отзывами удалённых книг?"],
      checks: ["Остался один автор", "Одна книга (у Гоголя) и один отзыв на неё"],
      solution: [
        code("text", ` authors | books | reviews 
---------+-------+---------
       1 |     1 |       1
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Удаление автора каскадом убрало его две книги, а удаление книг — три их отзыва. Осталось по одной строке в каждой таблице: Гоголь, «Мёртвые души» и отзыв «Классика»."),
      ],
    }),
    exercise({
      id: "sql.relationships.ex2",
      title: "На курсе «четыре» студента вместо трёх",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Таблица записей на курсы `enrollments` создана без ключа, и в неё попал дубль. Отчёт показывает 4 студента на первом курсе вместо 3. Найдите причину и исправьте схему так, чтобы дубль стал невозможен."),
        code("sql", `-- Таблица связи без ключа: повторная запись одного студента на курс прошла незамеченной
CREATE TABLE enrollments (student_id integer NOT NULL, course_id integer NOT NULL);
INSERT INTO enrollments VALUES (1, 1), (2, 1), (3, 1), (1, 2), (1, 1);

-- Отчёт «студентов на курсе» завышен
SELECT course_id, count(*) AS students FROM enrollments GROUP BY course_id ORDER BY course_id;`, { filename: "12-ex-fix.sql", runnable: true }),
      ],
      hints: ["Что запрещает повторять пару «студент — курс»?", "Как перенести данные в новую таблицу, не потащив дубли?"],
      checks: ["Нужен `PRIMARY KEY (student_id, course_id)`", "Перенос через `SELECT DISTINCT`", "После исправления: 3 и 1"],
      solution: [
        code("sql", `CREATE TABLE enrollments_raw (student_id integer NOT NULL, course_id integer NOT NULL);
INSERT INTO enrollments_raw VALUES (1, 1), (2, 1), (3, 1), (1, 2), (1, 1);

-- Новая таблица с составным ключом; дубли убираем при переносе
CREATE TABLE enrollments (
  student_id integer NOT NULL,
  course_id  integer NOT NULL,
  PRIMARY KEY (student_id, course_id)
);
INSERT INTO enrollments SELECT DISTINCT student_id, course_id FROM enrollments_raw;

SELECT course_id, count(*) AS students FROM enrollments GROUP BY course_id ORDER BY course_id;`, { filename: "13-fix-solution.sql", runnable: true }),
        code("text", ` course_id | students 
-----------+----------
         1 |        3
         2 |        1
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Составной первичный ключ делает повторную запись невозможной, а `SELECT DISTINCT` при переносе убрал существующий дубль. Теперь на первом курсе 3 студента, на втором — 1."),
      ],
    }),
    exercise({
      id: "sql.relationships.ex3",
      title: "Теги к постам",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Спроектируйте связь «посты — теги» (у поста много тегов, у тега много постов). Напишите схему с ограничениями, добавьте данные и запрос, возвращающий посты, у которых есть **оба** тега «sql» и «git»."),
      ],
      hints: ["Сколько таблиц нужно для связи M:N?", "Как выразить «оба тега» через счётчик различных значений?"],
      checks: ["Таблица связи `post_tags` с составным ключом", "Внешние ключи на `posts` и `tags`", "`WHERE tag IN ('sql', 'git') GROUP BY post HAVING count(DISTINCT tag) = 2`"],
      solution: [
        code("sql", `-- Многие-ко-многим: студент проходит много курсов, на курсе много студентов; связь — отдельная таблица
CREATE TABLE students (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE courses  (id integer PRIMARY KEY, title text NOT NULL);
CREATE TABLE enrollments (
  student_id  integer NOT NULL REFERENCES students (id),
  course_id   integer NOT NULL REFERENCES courses (id),
  enrolled_on date    NOT NULL,
  grade       integer,
  PRIMARY KEY (student_id, course_id)
);
INSERT INTO students VALUES (1, 'Анна'), (2, 'Борис'), (3, 'Вера');
INSERT INTO courses  VALUES (1, 'SQL'), (2, 'Git'), (3, 'HTML');
INSERT INTO enrollments VALUES
  (1, 1, '2024-02-01', 5), (1, 2, '2024-02-01', 4),
  (2, 1, '2024-02-05', 3),
  (3, 1, '2024-02-10', 5), (3, 2, '2024-02-10', NULL), (3, 3, '2024-03-01', 4);

-- В обе стороны: студентов на курсе и курсов у студента
SELECT c.title, count(*) AS students FROM enrollments AS e JOIN courses AS c ON c.id = e.course_id GROUP BY c.id, c.title ORDER BY c.id;
SELECT s.name, count(*) AS courses, round(avg(e.grade), 1) AS avg_grade
FROM enrollments AS e JOIN students AS s ON s.id = e.student_id GROUP BY s.id, s.name ORDER BY s.id;

-- Кто записан и на SQL, и на Git: условие «и то и другое» — через счётчик различных курсов
SELECT s.name
FROM enrollments AS e
JOIN students AS s ON s.id = e.student_id
JOIN courses  AS c ON c.id = e.course_id
WHERE c.title IN ('SQL', 'Git')
GROUP BY s.id, s.name
HAVING count(DISTINCT c.title) = 2
ORDER BY s.name;`, { filename: "05-many-to-many.sql (то же с курсами)", runnable: true, lineNumbers: true }),
        p("Структура решения совпадает со студентами и курсами: две сущностные таблицы (`posts`, `tags`) и таблица `post_tags(post_id, tag_id, PRIMARY KEY (post_id, tag_id))` с внешними ключами. Запрос «оба тега» — `WHERE t.name IN ('sql', 'git') GROUP BY p.id HAVING count(DISTINCT t.name) = 2`: в примере выше он вернул Анну и Веру, записанных на оба курса. Условие `IN` отбирает нужные пары, счётчик различных значений требует обоих."),
      ],
    }),
  ],

  challenge: {
    id: "sql.relationships.challenge",
    title: "Школа: связи, которые нельзя нарушить",
    scenario: [
      p("Нужна схема школы: преподаватель ведёт много классов; ученик учится во многих классах, в классе много учеников; у ученика не больше одного паспорта, номер паспорта уникален. Удаление ученика не должно оставлять записей о нём в классах и паспортов."),
    ],
    requirements: [
      "Таблицы `teachers`, `students`, `classes`, `class_students`, `passports` с внешними ключами",
      "Класс обязан иметь существующего преподавателя; пара «класс — ученик» уникальна",
      "Паспорт — связь 1:1 с учеником, номер уникален; при удалении ученика связанные строки удаляются",
      "Негативные тесты: повторная запись, несуществующий преподаватель, второй паспорт, дублирующийся номер — все должны быть отклонены",
    ],
    constraints: [
      "Каждое нарушение отклоняется схемой, а не проверкой в запросе",
      "Составной ключ в таблице связи, общий первичный ключ в паспортах",
    ],
    acceptance: [
      "Четыре ошибки при негативных вставках",
      "У Ольги 2 класса и 3 записи, у Павла 1 класс и 2 записи; у Веры нет паспорта",
    ],
    hints: [
      "`class_students` — таблица связи: составной ключ и `ON DELETE CASCADE` на обоих внешних ключах.",
      "Для отчёта по преподавателям — `LEFT JOIN` с `count(DISTINCT c.id)`, иначе классы множатся на учеников.",
    ],
    solution: [
      code("sql", `-- Школа: преподаватель ведёт много классов; ученик учится во многих классах; у ученика один паспорт
CREATE TABLE teachers (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE students (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE classes (
  id         integer PRIMARY KEY,
  title      text    NOT NULL,
  teacher_id integer NOT NULL REFERENCES teachers (id)
);
CREATE TABLE class_students (
  class_id   integer NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
  student_id integer NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, student_id)
);
CREATE TABLE passports (
  student_id integer PRIMARY KEY REFERENCES students (id) ON DELETE CASCADE,
  number     text    NOT NULL UNIQUE
);

INSERT INTO teachers VALUES (1, 'Ольга'), (2, 'Павел');
INSERT INTO students VALUES (1, 'Анна'), (2, 'Борис'), (3, 'Вера');
INSERT INTO classes  VALUES (1, 'Математика', 1), (2, 'Физика', 1), (3, 'История', 2);
INSERT INTO class_students VALUES (1, 1), (1, 2), (2, 1), (3, 1), (3, 3);
INSERT INTO passports VALUES (1, '4501-111'), (2, '4501-222');

-- Нарушения, которые схема обязана отклонить
INSERT INTO class_students VALUES (1, 1);                 -- повторная запись
INSERT INTO classes VALUES (4, 'Химия', 99);              -- нет такого преподавателя
INSERT INTO passports VALUES (1, '4501-999');             -- второй паспорт ученика
INSERT INTO passports VALUES (3, '4501-111');             -- номер уже занят

-- Запросы по связям
SELECT t.name AS teacher, count(DISTINCT c.id) AS classes, count(cs.student_id) AS enrollments
FROM teachers AS t
LEFT JOIN classes AS c ON c.teacher_id = t.id
LEFT JOIN class_students AS cs ON cs.class_id = c.id
GROUP BY t.id, t.name ORDER BY t.id;

SELECT s.name, count(cs.class_id) AS classes, p.number AS passport
FROM students AS s
LEFT JOIN class_students AS cs ON cs.student_id = s.id
LEFT JOIN passports AS p ON p.student_id = s.id
GROUP BY s.id, s.name, p.number ORDER BY s.id;`, { filename: "14-challenge.pg.sql", lineNumbers: true }),
      code("text", `ERROR:  duplicate key value violates unique constraint "class_students_pkey"
DETAIL:  Key (class_id, student_id)=(1, 1) already exists.
ERROR:  insert or update on table "classes" violates foreign key constraint "classes_teacher_id_fkey"
DETAIL:  Key (teacher_id)=(99) is not present in table "teachers".
ERROR:  duplicate key value violates unique constraint "passports_pkey"
DETAIL:  Key (student_id)=(1) already exists.
ERROR:  duplicate key value violates unique constraint "passports_number_key"
DETAIL:  Key (number)=(4501-111) already exists.
 teacher | classes | enrollments 
---------+---------+-------------
 Ольга   |       2 |           3
 Павел   |       1 |           2
(2 rows)

 name  | classes | passport 
-------+---------+----------
 Анна  |       3 | 4501-111
 Борис |       1 | 4501-222
 Вера  |       1 | 
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Четыре негативные вставки отклонены именно ограничениями: дубль пары (`class_students_pkey`), отсутствующий преподаватель (внешний ключ), второй паспорт (`passports_pkey`), занятый номер (`passports_number_key`). Отчёт использует `count(DISTINCT c.id)`: после соединения с учениками строка класса повторяется по числу учеников. У Веры паспорта нет — `LEFT JOIN` вернул `NULL`."),
    ],
  },

  interview: [
    iq("sql.relationships.i1", "basic", "Как моделируется связь «один ко многим»?", [
      ul(
        "Внешний ключ ставится в таблицу «многих»: `books.author_id → authors.id`.",
        "`NOT NULL` делает связь обязательной; без него у книги может не быть автора.",
        "Автора без книг показывает `LEFT JOIN` (в замере у Кафки 0 книг).",
      ),
    ]),
    iq("sql.relationships.i2", "basic", "Как реализовать связь «многие ко многим»?", [
      ul(
        "Отдельной таблицей связи с двумя внешними ключами на обе стороны.",
        "Составной `PRIMARY KEY (a_id, b_id)` запрещает повтор пары.",
        "Свойства связи (дата записи, оценка) — столбцы таблицы связи.",
      ),
    ]),
    iq("sql.relationships.i3", "intermediate", "Чем отличаются ON DELETE CASCADE, SET NULL и RESTRICT?", [
      ul(
        "`CASCADE` удаляет дочерние строки вместе с родителем (в замере осталась 1 строка из 3).",
        "`SET NULL` обнуляет ссылку у детей: строки сохраняются, но без родителя (в замере 2 строки, одна с `NULL`).",
        "`RESTRICT`/`NO ACTION` запрещают удалять родителя с детьми; `NO ACTION` допускает отложенную проверку.",
      ),
    ]),
    iq("sql.relationships.i4", "intermediate", "Как реализовать связь «один к одному» и когда она нужна?", [
      ul(
        "Внешний ключ с уникальностью: чаще `PRIMARY KEY`, который одновременно `REFERENCES` (общий ключ), либо `UNIQUE` внешний ключ.",
        "Нужна, когда часть данных необязательна, редко читается или имеет другие права доступа (профиль, настройки, паспорт).",
        "Если части всегда нужны вместе и обязательны, проще хранить их в одной таблице.",
      ),
    ]),
    iq("sql.relationships.i5", "intermediate", "Почему PostgreSQL не индексирует внешние ключи автоматически и к чему это приводит?", [
      ul(
        "Индекс создаётся только для `PRIMARY KEY` и `UNIQUE`; в замере у `books` после `REFERENCES` был только `books_pkey`.",
        "Без индекса по `author_id` соединения и проверка при удалении автора могут просматривать таблицу книг целиком.",
        "Решение: явный `CREATE INDEX` по столбцам внешнего ключа, если по ним ищут или удаляют родителей.",
      ),
    ]),
    iq("sql.relationships.i6", "advanced", "Что плохого в полиморфной ассоциации `target_type + target_id` и чем её заменить?", [
      ul(
        "На неё нельзя наложить внешний ключ: в замере комментарий к несуществующему посту сохранился.",
        "Типы целей не проверяются схемой, соединения становятся условными.",
        "Замены: по внешнему ключу на каждую цель + `CHECK` на «ровно одну»; общая родительская таблица («комментируемое»); отдельные таблицы комментариев для каждой цели.",
      ),
    ]),
    iq("sql.relationships.i7", "advanced", "Как безопасно добавить внешний ключ на большую живую таблицу в PostgreSQL?", [
      ul(
        "`ADD CONSTRAINT … FOREIGN KEY … NOT VALID` — быстро, проверяет только новые записи.",
        "Затем `VALIDATE CONSTRAINT` в отдельной команде: проверка существующих строк с более слабой блокировкой.",
        "Индекс по столбцу внешнего ключа создают заранее (`CREATE INDEX CONCURRENTLY`); сначала чистят «сирот».",
      ),
    ]),
    iq("sql.relationships.i8", "engineering", "В продакшене обнаружились «сироты»: заказы с несуществующими клиентами. Как вы разберётесь и закроете проблему навсегда?", [
      ul(
        "Найти сирот запросом `LEFT JOIN … WHERE parent.id IS NULL`, оценить масштаб и источник (удаление родителя без каскада, импорт, гонка).",
        "Решить судьбу данных: восстановить родителя, перепривязать или удалить; зафиксировать в журнале.",
        "Закрепить внешним ключом (`NOT VALID`, затем `VALIDATE`) с осознанным `ON DELETE`.",
        "Добавить негативные тесты и мониторинг запроса-проверки, чтобы нарушение не вернулось.",
        "Проверить, нет ли других связей без ключей — по схеме и по запросам из кода.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.relationships.e1", "foundation", "Где хранится внешний ключ в связи «один ко многим»?", ["В таблице «одного»", "В отдельной таблице", "В таблице «многих»", "В обеих"], 2, "Книга хранит `author_id`: у книги один автор, а у автора много книг, поэтому ключ — в таблице «многих»."),
    mcq("sql.relationships.e2", "foundation", "Как реализуется связь «многие ко многим»?", ["Таблицей связи с двумя внешними ключами", "Списком идентификаторов в ячейке", "Одним внешним ключом", "Представлением"], 0, "Таблица связи (`enrollments`) хранит пары; составной ключ запрещает дубли, а список в ячейке нарушил бы 1НФ."),
    mcq("sql.relationships.e3", "foundation", "Что сделает PostgreSQL при вставке книги с несуществующим `author_id`?", ["Сохранит строку", "Подставит `NULL`", "Создаст автора", "Отклонит вставку ошибкой внешнего ключа"], 3, "Внешний ключ проверяется при вставке: `Key (author_id)=(99) is not present in table \"authors\"`."),
    mcq("sql.relationships.e4", "intermediate", "После удаления родителя 1: что осталось в `child_setnull` с `ON DELETE SET NULL` (у родителя 1 был один ребёнок, у родителя 2 — один)?", ["0 строк", "2 строки, у одной `parent_id IS NULL`", "1 строка", "Ошибка"], 1, "`SET NULL` не удаляет детей, а обнуляет ссылку: строк по-прежнему две, одна без родителя (замер)."),
    mcq("sql.relationships.e5", "intermediate", "Чем `RESTRICT` отличается от `NO ACTION`?", ["Ничем нигде", "`NO ACTION` разрешает удалять", "`RESTRICT` каскадно удаляет", "`NO ACTION` допускает отложенную проверку до конца транзакции, `RESTRICT` — нет"], 3, "Оба запрещают удалять родителя с детьми, но проверку `NO ACTION` можно отложить (для отложенных ограничений), `RESTRICT` срабатывает сразу."),
    mcq("sql.relationships.e6", "intermediate", "Почему полиморфная связь `target_type + target_id` — антипаттерн?", ["Она медленнее", "Она не работает в PostgreSQL", "На неё нельзя наложить внешний ключ, и база принимает ссылки на несуществующие строки", "Требует суррогатного ключа"], 2, "В замере комментарий к несуществующему посту сохранился; целостность держится только на приложении."),
    mcq("sql.relationships.e7", "advanced", "Какой запрос возвращает студентов, записанных и на SQL, и на Git (таблица связи `enrollments`)?", ["`WHERE title = 'SQL' AND title = 'Git'`", "`WHERE title IN ('SQL','Git') GROUP BY student HAVING count(DISTINCT title) = 2`", "`WHERE title IN ('SQL','Git')`", "`GROUP BY title`"], 1, "Одна строка не может иметь два названия; нужно отобрать пары и потребовать два различных курса у студента (замер: Анна и Вера)."),
    open("sql.relationships.e8", "intermediate", "Спроектируйте схему «врачи — пациенты — приёмы», где врач принимает многих пациентов, а пациент ходит ко многим врачам. Опишите таблицы, ключи и действия `ON DELETE`.", [
      ul(
        "`doctors(id PK, name)`, `patients(id PK, name)` — сущностные таблицы.",
        "`appointments(id PK, doctor_id → doctors, patient_id → patients, scheduled_at, notes)`: у приёма есть собственные свойства (время, заметки), и один пациент может прийти к врачу много раз — поэтому суррогатный `id`, а не составной ключ пары.",
        "Уникальность по смыслу: `UNIQUE (doctor_id, scheduled_at)` — врач не принимает двух пациентов одновременно.",
        "`ON DELETE RESTRICT` на врачей и пациентов: историю приёмов терять нельзя; вместо удаления — флаг `archived`.",
        "Индексы по `doctor_id` и `patient_id` — PostgreSQL не создаёт их сам.",
      ),
    ], ["Сущности и таблица приёмов", "Ключ приёма и уникальность по смыслу", "ON DELETE и история", "Индексы"], { format: "architecture" }),
  ],

  mastery: [
    mcq("sql.relationships.m1", "intermediate", "Таблица связи создана без `PRIMARY KEY`. Что показал замер при повторной вставке пары?", ["Дубль сохранился и завысил счётчик (4 студента вместо 3)", "Ошибка", "Строка заменилась", "Пара отклонена внешним ключом"], 0, "Без составного ключа повтор пары не запрещён; `count(*)` посчитал дубль."),
    mcq("sql.relationships.m2", "advanced", "У `books` есть `author_id REFERENCES authors (id)` и больше нет индексов, кроме первичного ключа. Что верно?", ["PostgreSQL сам создал индекс по `author_id`", "Индекс создаётся при первом запросе", "Индекса по `author_id` нет; удаление автора и соединения могут сканировать таблицу целиком", "Индекс не нужен никогда"], 2, "В замере `pg_indexes` показал только `books_pkey`; индекс по внешнему ключу создаётся явно."),
    mcq("sql.relationships.m3", "advanced", "Что отклонит ограничение `CHECK ((post_id IS NULL) <> (photo_id IS NULL))`?", ["Комментарий и к посту, и к фото, а также комментарий без цели", "Комментарий к посту", "Комментарий к фото", "Любой комментарий"], 0, "`<>` истинно, если ровно одна из проверок истинна: нарушения — «обе цели» и «ни одной» (замер: оба отклонены)."),
    open("sql.relationships.m4", "advanced", "В таблице `orders` 200 млн строк, нужно добавить внешний ключ `customer_id → customers`, но подозреваются сироты, а таблица активно пишется. Опишите безопасный план.", [
      ul(
        "Сначала найти сирот: `SELECT … FROM orders o LEFT JOIN customers c ON c.id = o.customer_id WHERE c.id IS NULL`; решить, что с ними делать (восстановить клиента, перепривязать, пометить).",
        "Создать индекс по `orders(customer_id)` без блокировки записи (`CREATE INDEX CONCURRENTLY`).",
        "Добавить ключ `NOT VALID`: он проверяет только новые записи и берёт короткую блокировку.",
        "Выполнить `VALIDATE CONSTRAINT` отдельно: проверка существующих строк не блокирует запись.",
        "Каждый шаг — отдельная миграция с планом отката и замером времени на копии данных.",
      ),
    ], ["Поиск сирот", "Индекс без блокировки", "NOT VALID", "VALIDATE отдельным шагом"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.relationships.f1", front: "1:N?", back: "Внешний ключ в таблице «многих» (books.author_id). NOT NULL — связь обязательна. Родитель без детей виден через LEFT JOIN." },
    { id: "sql.relationships.f2", front: "M:N?", back: "Таблица связи с двумя внешними ключами и составным PRIMARY KEY; свойства связи — её столбцы." },
    { id: "sql.relationships.f3", front: "1:1?", back: "Внешний ключ + уникальность: чаще PRIMARY KEY, он же REFERENCES (общий ключ), либо UNIQUE FK." },
    { id: "sql.relationships.f4", front: "ON DELETE?", back: "NO ACTION/RESTRICT — запретить; CASCADE — удалить детей; SET NULL — обнулить ссылку; SET DEFAULT — подставить значение по умолчанию." },
    { id: "sql.relationships.f5", front: "Полиморфная ассоциация?", back: "target_type + target_id не может быть FK, сироты проходят. Замена: FK на каждую цель + CHECK «ровно одна»." },
    { id: "sql.relationships.f6", front: "Индекс на FK?", back: "PostgreSQL не создаёт его сам. Нужен для соединений и проверки при удалении родителя." },
    { id: "sql.relationships.f7", front: "Внешний ключ на большой таблице?", back: "ADD CONSTRAINT … NOT VALID, затем VALIDATE CONSTRAINT; индекс заранее (CONCURRENTLY)." },
    { id: "sql.relationships.f8", front: "SQLite и FK?", back: "Не проверяются по умолчанию: PRAGMA foreign_keys = ON для каждого соединения." },
  ],

  sources: [
    { title: "PostgreSQL 16: Foreign Keys (constraints)", url: "https://www.postgresql.org/docs/16/ddl-constraints.html#DDL-CONSTRAINTS-FK", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Foreign Keys (tutorial)", url: "https://www.postgresql.org/docs/16/tutorial-fk.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: CREATE TABLE (REFERENCES, ON DELETE)", url: "https://www.postgresql.org/docs/16/sql-createtable.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: ALTER TABLE (NOT VALID, VALIDATE CONSTRAINT)", url: "https://www.postgresql.org/docs/16/sql-altertable.html", publisher: "PostgreSQL" },
    { title: "SQLite: Foreign Key Support", url: "https://www.sqlite.org/foreignkeys.html", publisher: "Other" },
  ],
};
