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

export const normalization: Topic = {
  id: "sql.normalization",
  slug: "normalization",
  domain: "sql",
  module: "design",
  title: "Нормализация: один факт — в одном месте",
  titleEn: "Normalization: One Fact in One Place",
  summary:
    "Нормализация — способ проектирования таблиц, при котором каждый факт хранится ровно один раз. Тема на замерах PostgreSQL 16.14 и SQLite 3.49 показывает, что бывает с «широкой таблицей»: у Анны три строки-копии города, после неполного обновления у неё два города (аномалия обновления), отмена единственного заказа Глеба стирает клиента (аномалия удаления), а клиента Дарью нельзя записать без заказа (аномалия вставки). Разбор 1НФ (список тегов `напитки,чай` находит и «чай», и «чайник»), 2НФ и 3НФ (руководитель отдела в каждой строке сотрудника), разложение без потерь (проверка `EXCEPT` в обе стороны: 0 и 0), неверная декомпозиция (6 исходных пар → 10 после соединения, 4 лишних), цена повторения (32 MB против 10 MB на 200 000 строках) и контролируемая денормализация: кэш суммы заказа устарел (1 380 против 2 580).",
  minutes: 90,
  prerequisites: ["sql.keys-constraints", "sql.inner-left-joins", "sql.group-by-having"],
  tags: ["normalization", "1NF", "2NF", "3NF", "BCNF", "functional dependency", "anomaly", "update anomaly", "decomposition", "lossless join", "denormalization", "redundancy", "candidate key", "database design"],
  keyConcepts: [
    { term: "Избыточность порождает аномалии", text: "В плоской таблице город Анны записан в трёх строках: исправили одну — и у клиента два города; удалили единственный заказ — потеряли клиента; нового клиента без заказа не записать." },
    { term: "Функциональная зависимость — основа нормализации", text: "`A → B` означает: каждому значению A соответствует ровно одно значение B (`customer_name → customer_city`). Нарушителей находит запрос с `HAVING count(DISTINCT B) > 1`." },
    { term: "1НФ, 2НФ, 3НФ — шаги по устранению зависимостей", text: "1НФ: одно значение в ячейке. 2НФ: нет зависимости от части составного ключа. 3НФ: нет зависимости через неключевой столбец (`dept → dept_head`)." },
    { term: "Разложение должно быть без потерь", text: "Корректная декомпозиция при обратном соединении даёт исходные строки: проверка `EXCEPT` в обе стороны вернула 0 и 0. Неверная (общий столбец — не ключ) дала 10 строк вместо 6." },
    { term: "Нормализация экономит место и защищает от рассинхрона", text: "200 000 строк продаж: плоская таблица — 32 MB, три нормализованные — 10 MB (данные теста: 2000 клиентов, 500 товаров)." },
    { term: "Денормализация — осознанное исключение", text: "Копию значения (сумма заказа) нужно кому-то поддерживать: после изменения позиции кэш показал 1 380 при фактических 2 580. Альтернатива — представление, которое всегда считает по живым данным." },
  ],
  sections: [
    section("definition", [
      def("Нормализация", "Процесс разбиения таблиц так, чтобы устранить избыточность и связанные с ней аномалии: каждый факт хранится в одном месте, связи выражены ключами.", "normalization"),
      def("Функциональная зависимость", "`X → Y`: два любых ряда с одинаковым значением X имеют одинаковое Y. Например, `product_title → product_price`, если цена принадлежит товару.", "functional dependency"),
      def("Ключ-кандидат и суперключ", "Ключ-кандидат — минимальный набор столбцов, однозначно определяющий строку. Суперключ — любой набор, содержащий ключ-кандидат.", "candidate key / superkey"),
      def("Аномалия", "Нарушение согласованности при изменении данных из-за избыточности: обновления (часть копий не изменена), вставки (нельзя записать факт без другого), удаления (вместе с одним фактом пропал другой).", "anomaly"),
      def("1НФ", "Первая нормальная форма: каждый столбец хранит одно неделимое значение, нет повторяющихся групп (`phone1, phone2, phone3`) и списков в ячейке; строки различимы по ключу.", "1NF"),
      def("2НФ и 3НФ", "2НФ: таблица в 1НФ, и каждый неключевой столбец зависит от всего ключа, а не от его части. 3НФ: дополнительно нет зависимостей неключевого столбца от другого неключевого (транзитивных).", "2NF / 3NF"),
      def("BCNF", "Нормальная форма Бойса — Кодда: для каждой нетривиальной зависимости `X → Y` левая часть X — суперключ. Строже 3НФ.", "Boyce–Codd normal form"),
      def("Декомпозиция без потерь", "Разбиение, при котором естественное соединение частей возвращает ровно исходные строки — без недостающих и без лишних.", "lossless decomposition"),
      def("Денормализация", "Осознанное нарушение нормальной формы ради скорости чтения: хранение копий и итогов, которые придётся согласовывать.", "denormalization"),
    ]),

    section("why", [
      h("Копии рассинхронизируются"),
      p("Данные, которые хранятся в нескольких местах, рано или поздно расходятся. Не из-за ошибки одного программиста, а потому, что каждое изменение должно быть выполнено везде, а база сама этого не гарантирует. Нормализация переносит ответственность на структуру: если факт один, расходиться нечему."),
      ul(
        "**Аномалии обновления:** город клиента исправили в одной строке из трёх — теперь у него два города.",
        "**Аномалии удаления:** удалили заказ — вместе с ним исчезла информация о клиенте.",
        "**Аномалии вставки:** нельзя добавить клиента, пока у него нет заказа (или нельзя добавить товар до первой продажи).",
        "**Искажённые отчёты:** `count(*)` по плоской таблице считает строки, а не клиентов (в замере «Москва — 4» при двух клиентах).",
        "**Лишнее место:** повторяющиеся строки раздувают таблицу и индексы (32 MB против 10 MB на 200 000 строках).",
      ),
      note("Нормализация — не самоцель: она убирает конкретные проблемы. Когда они не возникают (справочные данные, отчёты «только для чтения»), избыточность иногда оправдана — но решение должно быть осознанным."),
    ]),

    section("mental-model", [
      h("Каждый факт — на своём месте"),
      p("Задайте себе вопрос для каждого столбца: «**от чего он зависит?**». Город зависит от клиента, цена — от товара, дата — от заказа, количество — от пары «заказ + товар». Если столбец зависит не от всего ключа таблицы, а от его части или от другого столбца, у этого факта должна быть собственная таблица. Результат часто выглядит как схема предметной области: клиенты, товары, заказы, позиции."),
      diagram(
        `
        sales_flat (всё в одной таблице)         После нормализации:
        ┌──────────────────────────────────┐
        │ order_id, ordered_on             │ ─────► orders(id, ordered_on, customer_name → customers)
        │ customer_name, customer_city     │ ─────► customers(name PK, city)
        │ product_title, product_price     │ ─────► products(title PK, price)
        │ qty                              │ ─────► order_items(order_id → orders, product_title → products, qty)
        └──────────────────────────────────┘

        Город Анны: 3 копии в sales_flat → 1 строка в customers.
        `,
        "Плоская таблица разделяется по зависимостям: у каждого факта — свой ключ и своя таблица.",
      ),
      h("Алгоритм нормализации"),
      steps(
        [
          ["Выпишите зависимости", "Какие столбцы однозначно определяют другие: `order_id → ordered_on`, `customer_name → customer_city`, `product_title → product_price`."],
          ["Найдите ключ", "Что однозначно определяет строку: в `sales_flat` — пара `(order_id, product_title)`."],
          ["Вынесите факты", "Каждая зависимость с левой частью, не являющейся ключом, — отдельная таблица (клиенты, товары, заказы)."],
          ["Свяжите ключами", "В дочерних таблицах — внешние ключи на родительские."],
          ["Проверьте без потерь", "Соединение частей должно давать исходные данные: `EXCEPT` в обе стороны возвращает 0 строк."],
        ],
        "Как разложить плоскую таблицу",
      ),
    ]),

    section("technical", [
      h("Нормальные формы"),
      table(
        ["Форма", "Условие", "Что устраняет", "Пример нарушения"],
        [
          ["1НФ", "Одно значение в ячейке, нет повторяющихся групп", "Списки и массивы в столбце, `phone1…phone3`", "`tags = 'напитки,чай'`"],
          ["2НФ", "Нет зависимости от части составного ключа", "Дублирование атрибутов, зависящих только от части ключа", "`student_name` при ключе `(student_id, course_id)`"],
          ["3НФ", "Нет зависимости неключевого столбца от неключевого", "Транзитивные зависимости", "`dept_head` зависит от `dept`, а не от сотрудника"],
          ["BCNF", "Левая часть любой зависимости — суперключ", "Остаточные аномалии при пересекающихся ключах", "`teacher → subject` при ключе `(student, subject)`"],
          ["4НФ и выше", "Нет нетривиальных многозначных зависимостей и зависимостей соединения", "Независимые множества в одной таблице", "Хобби и языки сотрудника в одной таблице"],
        ],
        "Нормальные формы",
      ),
      h("Как проверить зависимость запросом"),
      p("Зависимость `A → B` выполняется, если для каждого значения A существует ровно одно значение B. Нарушителей даёт запрос `SELECT A, count(DISTINCT B) FROM t GROUP BY A HAVING count(DISTINCT B) > 1`. Пустой результат на текущих данных **не доказывает** зависимость (данные — только пример), но один найденный нарушитель опровергает её. Окончательное решение принимается по смыслу предметной области."),
      h("Ключи при декомпозиции"),
      ul(
        "**Естественные ключи** (`customers.name`) удобны в примерах, но имена меняются и повторяются: в рабочей схеме — суррогатные идентификаторы (`id`).",
        "**Внешние ключи** обязательны: именно они гарантируют, что ссылки в дочерних таблицах существуют.",
        "**Составной ключ позиции** `(order_id, product_id)` не позволяет добавить товар в заказ дважды.",
      ),
      warn("Нормализуют по зависимостям предметной области, а не по текущим данным. «У всех клиентов из Москвы товар один» — не зависимость, а совпадение выборки."),
    ]),

    section("syntax", [
      p("Транзитивная зависимость `id → dept → dept_head`: руководитель отдела записан в строке каждого сотрудника. Запрос-проверка находит отдел, у которого после «частичного» обновления оказалось два руководителя."),
      annotated(
        "sql",
        `-- Транзитивная зависимость: id → dept → dept_head. Руководитель отдела хранится в каждой строке сотрудника
CREATE TABLE emp_flat (id integer PRIMARY KEY, name text NOT NULL, dept text NOT NULL, dept_head text NOT NULL);
INSERT INTO emp_flat VALUES
  (1, 'Павел',  'разработка', 'Павел'),
  (2, 'Ольга',  'разработка', 'Павел'),
  (3, 'Семён',  'разработка', 'Павел'),
  (4, 'Фёдор',  'продажи',    'Фёдор'),
  (5, 'Хлоя',   'продажи',    'Фёдор');

-- Руководителя разработки сменили, но обновили одну строку
UPDATE emp_flat SET dept_head = 'Ольга' WHERE id = 2;

-- Проверка зависимости dept → dept_head: нарушители — отделы, у которых больше одного руководителя
SELECT dept, count(DISTINCT dept_head) AS heads FROM emp_flat GROUP BY dept HAVING count(DISTINCT dept_head) > 1;`,
        [
          { line: 1, text: "Комментарий называет зависимость: руководитель определяется отделом, а не сотрудником." },
          { line: 2, text: "Плоская таблица: `dept_head` хранится в каждой строке сотрудника." },
          { line: [3, 8], text: "Данные: у разработки три сотрудника и руководитель «Павел» повторяется трижды." },
          { line: [10, 11], text: "Смена руководителя исправлена в одной строке из трёх — классическая аномалия обновления." },
          { line: [13, 14], text: "Проверка зависимости `dept → dept_head`: `HAVING count(DISTINCT dept_head) > 1` находит отдел с двумя руководителями." },
        ],
        "05-transitive.sql",
      ),
      code("text", `    dept    | heads 
------------+-------
 разработка |     2
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
    ]),

    section("minimal-example", [
      p("Плоская таблица продаж: клиент, город, товар и цена повторяются в каждой строке. Три аномалии воспроизводятся тремя короткими операциями."),
      code("sql", `-- Одна широкая таблица «всё про продажи»: клиент, город, товар и цена повторяются в каждой строке
CREATE TABLE sales_flat (
  order_id       integer NOT NULL,
  ordered_on     date    NOT NULL,
  customer_name  text    NOT NULL,
  customer_city  text    NOT NULL,
  product_title  text    NOT NULL,
  product_price  integer NOT NULL,
  qty            integer NOT NULL
);
INSERT INTO sales_flat VALUES
  (1, '2024-01-10', 'Анна',  'Москва', 'Кофе зерновой 1 кг', 1200, 1),
  (1, '2024-01-10', 'Анна',  'Москва', 'Сахар 1 кг',           90, 2),
  (2, '2024-02-14', 'Анна',  'Москва', 'Чай чёрный 100 г',    250, 3),
  (3, '2024-02-20', 'Борис', 'Казань', 'Кофе зерновой 1 кг', 1200, 1),
  (4, '2024-03-01', 'Вера',  'Москва', 'Френч-пресс',        1900, 1),
  (6, '2024-03-20', 'Глеб',  'Самара', 'Чай чёрный 100 г',    250, 2);

-- Сколько раз в таблице записан каждый клиент
SELECT customer_name, count(*) AS copies FROM sales_flat GROUP BY customer_name ORDER BY customer_name;

-- Аномалия обновления: Анна переехала, но город исправили только в одной строке
UPDATE sales_flat SET customer_city = 'Тула' WHERE order_id = 1 AND product_title = 'Сахар 1 кг';
SELECT customer_name, count(DISTINCT customer_city) AS cities
FROM sales_flat GROUP BY customer_name HAVING count(DISTINCT customer_city) > 1;

-- Аномалия удаления: отмена единственного заказа Глеба стирает и самого клиента
DELETE FROM sales_flat WHERE order_id = 6;
SELECT count(DISTINCT customer_name) AS customers_left FROM sales_flat;`, { filename: "01-flat-anomalies.sql", runnable: true }),
      code("text", ` customer_name | copies 
---------------+--------
 Анна          |      3
 Борис         |      1
 Вера          |      1
 Глеб          |      1
(4 rows)

 customer_name | cities 
---------------+--------
 Анна          |      2
(1 row)

 customers_left 
----------------
              3
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "**Копии:** у Анны три строки, и город записан в каждой.",
        "**Обновление:** после исправления одной строки у Анны два города (`cities = 2`).",
        "**Удаление:** после отмены заказа 6 клиентов осталось 3 — Глеб пропал вместе с заказом.",
      ),
      h("Аномалия вставки"),
      code("sql", `CREATE TABLE sales_flat (
  order_id       integer NOT NULL,
  ordered_on     date    NOT NULL,
  customer_name  text    NOT NULL,
  customer_city  text    NOT NULL,
  product_title  text    NOT NULL,
  product_price  integer NOT NULL,
  qty            integer NOT NULL
);
-- Аномалия вставки: клиента Дарью нельзя записать, пока у неё нет заказа
INSERT INTO sales_flat (customer_name, customer_city) VALUES ('Дарья', 'Казань');`, { filename: "02-insert-anomaly.pg.sql" }),
      code("text", `ERROR:  null value in column "order_id" of relation "sales_flat" violates not-null constraint
DETAIL:  Failing row contains (null, null, Дарья, Казань, null, null, null).`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Клиента без заказа в плоской таблице не записать: столбцы заказа обязательны. Если снять `NOT NULL`, появятся «пустые» строки, которые сломают отчёты по заказам. Правильное решение — отдельная таблица клиентов."),
    ]),

    section("detailed-example", [
      h("1НФ: список в ячейке"),
      code("sql", `-- 1НФ нарушена: в одном столбце список значений
CREATE TABLE products_bad (id integer PRIMARY KEY, title text NOT NULL, tags text NOT NULL);
INSERT INTO products_bad VALUES
  (1, 'Чай чёрный 100 г',    'напитки,чай'),
  (2, 'Чайник стальной',     'посуда,чайник'),
  (3, 'Кофе зерновой 1 кг',  'напитки,кофе');

-- Поиск по подстроке цепляет и «чай», и «чайник»
SELECT title FROM products_bad WHERE tags LIKE '%чай%' ORDER BY id;

-- В 1НФ одна строка — одно значение; поиск по тегу точный, а повторы тегов запрещены ключом
CREATE TABLE product_tags (
  product_id integer NOT NULL REFERENCES products_bad (id),
  tag        text    NOT NULL,
  PRIMARY KEY (product_id, tag)
);
INSERT INTO product_tags VALUES
  (1, 'напитки'), (1, 'чай'), (2, 'посуда'), (2, 'чайник'), (3, 'напитки'), (3, 'кофе');

SELECT p.title FROM products_bad AS p JOIN product_tags AS t ON t.product_id = p.id WHERE t.tag = 'чай' ORDER BY p.id;
SELECT tag, count(*) AS products FROM product_tags GROUP BY tag ORDER BY products DESC, tag;`, { filename: "03-first-nf.sql", runnable: true }),
      code("text", `      title       
------------------
 Чай чёрный 100 г
 Чайник стальной
(2 rows)

      title       
------------------
 Чай чёрный 100 г
(1 row)

   tag   | products 
---------+----------
 напитки |        2
 кофе    |        1
 посуда  |        1
 чай     |        1
 чайник  |        1
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Поиск `LIKE '%чай%'` по списку `напитки,чай` и `посуда,чайник` нашёл оба товара: чайник попал под «чай». В 1НФ тег — отдельная строка в `product_tags`, поиск `tag = 'чай'` возвращает один товар, а составной ключ `(product_id, tag)` запрещает дубли. Заодно стала возможной простая статистика: тег «напитки» у двух товаров."),
      h("Декомпозиция до 3НФ и проверка без потерь"),
      code("sql", `-- Разложение sales_flat на четыре таблицы (в данных нет зависимостей, кроме перечисленных)
CREATE TABLE sales_flat (
  order_id integer NOT NULL, ordered_on date NOT NULL,
  customer_name text NOT NULL, customer_city text NOT NULL,
  product_title text NOT NULL, product_price integer NOT NULL, qty integer NOT NULL
);
INSERT INTO sales_flat VALUES
  (1, '2024-01-10', 'Анна',  'Москва', 'Кофе зерновой 1 кг', 1200, 1),
  (1, '2024-01-10', 'Анна',  'Москва', 'Сахар 1 кг',           90, 2),
  (2, '2024-02-14', 'Анна',  'Москва', 'Чай чёрный 100 г',    250, 3),
  (3, '2024-02-20', 'Борис', 'Казань', 'Кофе зерновой 1 кг', 1200, 1),
  (4, '2024-03-01', 'Вера',  'Москва', 'Френч-пресс',        1900, 1),
  (6, '2024-03-20', 'Глеб',  'Самара', 'Чай чёрный 100 г',    250, 2);

CREATE TABLE customers (name text PRIMARY KEY, city text NOT NULL);
CREATE TABLE products  (title text PRIMARY KEY, price integer NOT NULL);
CREATE TABLE orders (
  id            integer PRIMARY KEY,
  ordered_on    date NOT NULL,
  customer_name text NOT NULL REFERENCES customers (name)
);
CREATE TABLE order_items (
  order_id      integer NOT NULL REFERENCES orders (id),
  product_title text    NOT NULL REFERENCES products (title),
  qty           integer NOT NULL,
  PRIMARY KEY (order_id, product_title)
);

INSERT INTO customers SELECT DISTINCT customer_name, customer_city FROM sales_flat;
INSERT INTO products  SELECT DISTINCT product_title, product_price FROM sales_flat;
INSERT INTO orders    SELECT DISTINCT order_id, ordered_on, customer_name FROM sales_flat;
INSERT INTO order_items SELECT order_id, product_title, qty FROM sales_flat;

SELECT (SELECT count(*) FROM customers)   AS customers,
       (SELECT count(*) FROM products)    AS products,
       (SELECT count(*) FROM orders)      AS orders,
       (SELECT count(*) FROM order_items) AS items;

-- Соединение без потерь: восстановленная таблица совпадает с исходной в обе стороны
WITH restored AS (
  SELECT o.id AS order_id, o.ordered_on, c.name AS customer_name, c.city AS customer_city,
         p.title AS product_title, p.price AS product_price, i.qty
  FROM order_items AS i
  JOIN orders    AS o ON o.id = i.order_id
  JOIN customers AS c ON c.name = o.customer_name
  JOIN products  AS p ON p.title = i.product_title
)
SELECT (SELECT count(*) FROM (SELECT * FROM sales_flat EXCEPT SELECT * FROM restored) AS a) AS missing_after_join,
       (SELECT count(*) FROM (SELECT * FROM restored EXCEPT SELECT * FROM sales_flat) AS b) AS extra_after_join;

-- Теперь переезд Анны — одна строка, и во всех заказах город согласован
UPDATE customers SET city = 'Тула' WHERE name = 'Анна';
SELECT c.name, c.city, count(*) AS item_rows
FROM order_items AS i
JOIN orders AS o ON o.id = i.order_id
JOIN customers AS c ON c.name = o.customer_name
WHERE c.name = 'Анна'
GROUP BY c.name, c.city;`, { filename: "04-decompose.sql", runnable: true }),
      code("text", ` customers | products | orders | items 
-----------+----------+--------+-------
         4 |        4 |      5 |     6
(1 row)

 missing_after_join | extra_after_join 
--------------------+------------------
                  0 |                0
(1 row)

 name | city | item_rows 
------+------+-----------
 Анна | Тула |         3
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Четыре таблицы: 4 клиента, 4 товара, 5 заказов, 6 позиций — те же шесть фактов продажи, но город и цена записаны по одному разу.",
        "Проверка `EXCEPT` в обе стороны вернула `0` и `0`: соединение таблиц восстанавливает исходную таблицу ровно.",
        "Переезд Анны — одна строка в `customers`; во всех трёх строках заказов город согласован («Тула»).",
      ),
    ]),

    section("analysis", [
      table(
        ["Проверка", "Результат (замер)", "Что показывает"],
        [
          ["Копии клиента в плоской таблице", "Анна — 3 строки", "Один факт записан несколько раз"],
          ["Исправили одну из трёх копий", "`cities = 2`", "Аномалия обновления"],
          ["Удалили единственный заказ Глеба", "Клиентов осталось 3 из 4", "Аномалия удаления"],
          ["`count(*)` клиентов в Москве", "4 (на самом деле 2)", "Избыточность искажает отчёты"],
          ["Декомпозиция на 4 таблицы", "`missing = 0`, `extra = 0`", "Соединение без потерь"],
          ["Декомпозиция по общему не-ключу", "6 исходных пар → 10, 4 лишних", "Потеря информации (лишние факты)"],
        ],
        "Что показали замеры PostgreSQL 16.14",
      ),
      h("Транзитивная зависимость: отдел и руководитель"),
      code("sql", `CREATE TABLE emp_flat (id integer PRIMARY KEY, name text NOT NULL, dept text NOT NULL, dept_head text NOT NULL);
INSERT INTO emp_flat VALUES
  (1, 'Павел',  'разработка', 'Павел'),
  (2, 'Ольга',  'разработка', 'Павел'),
  (3, 'Семён',  'разработка', 'Павел'),
  (4, 'Фёдор',  'продажи',    'Фёдор'),
  (5, 'Хлоя',   'продажи',    'Фёдор');

-- 3НФ: отдел и его руководитель — отдельный факт
CREATE TABLE departments (dept text PRIMARY KEY, head text NOT NULL);
CREATE TABLE employees (id integer PRIMARY KEY, name text NOT NULL, dept text NOT NULL REFERENCES departments (dept));
INSERT INTO departments SELECT DISTINCT dept, dept_head FROM emp_flat;
INSERT INTO employees   SELECT id, name, dept FROM emp_flat;

-- Соединение без потерь
SELECT (SELECT count(*) FROM (SELECT * FROM emp_flat EXCEPT SELECT e.id, e.name, d.dept, d.head FROM employees AS e JOIN departments AS d ON d.dept = e.dept) AS a) AS missing,
       (SELECT count(*) FROM (SELECT e.id, e.name, d.dept, d.head FROM employees AS e JOIN departments AS d ON d.dept = e.dept EXCEPT SELECT * FROM emp_flat) AS b) AS extra;

-- Смена руководителя разработки — одна строка, согласованно для всех
UPDATE departments SET head = 'Ольга' WHERE dept = 'разработка';
SELECT e.name, d.dept, d.head FROM employees AS e JOIN departments AS d ON d.dept = e.dept ORDER BY e.id;`, { filename: "13-emp-3nf.sql", runnable: true }),
      code("text", ` missing | extra 
---------+-------
       0 |     0
(1 row)

 name  |    dept    | head  
-------+------------+-------
 Павел | разработка | Ольга
 Ольга | разработка | Ольга
 Семён | разработка | Ольга
 Фёдор | продажи    | Фёдор
 Хлоя  | продажи    | Фёдор
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("После выноса `departments` смена руководителя — одна строка: у всех троих сотрудников разработки теперь один и тот же руководитель. Расхождение, которое мы получили в `05-transitive.sql`, структурно невозможно."),
      h("Когда декомпозиция неверна"),
      code("sql", `-- Неверная декомпозиция: делим продажи на «город — товар» и «клиент — город»; общий столбец (город) не ключ
CREATE TABLE sales_flat (
  order_id integer NOT NULL, customer_name text NOT NULL, customer_city text NOT NULL, product_title text NOT NULL
);
INSERT INTO sales_flat VALUES
  (1, 'Анна',  'Москва', 'Кофе зерновой 1 кг'),
  (1, 'Анна',  'Москва', 'Сахар 1 кг'),
  (2, 'Анна',  'Москва', 'Чай чёрный 100 г'),
  (3, 'Борис', 'Казань', 'Кофе зерновой 1 кг'),
  (4, 'Вера',  'Москва', 'Френч-пресс'),
  (6, 'Глеб',  'Самара', 'Чай чёрный 100 г');

CREATE TABLE city_products   AS SELECT DISTINCT customer_city, product_title FROM sales_flat;
CREATE TABLE customer_cities AS SELECT DISTINCT customer_name, customer_city FROM sales_flat;

WITH glued AS (
  SELECT cc.customer_name, cp.customer_city, cp.product_title
  FROM customer_cities AS cc JOIN city_products AS cp ON cp.customer_city = cc.customer_city
)
SELECT (SELECT count(*) FROM (SELECT DISTINCT customer_name, customer_city, product_title FROM sales_flat) AS o) AS original_pairs,
       (SELECT count(*) FROM glued) AS after_join,
       (SELECT count(*) FROM (SELECT * FROM glued EXCEPT SELECT customer_name, customer_city, product_title FROM sales_flat) AS s) AS spurious;

-- Что именно «выросло»: Вера теперь покупала то, что покупала Анна
SELECT customer_name, product_title
FROM (SELECT cc.customer_name, cp.customer_city, cp.product_title
      FROM customer_cities AS cc JOIN city_products AS cp ON cp.customer_city = cc.customer_city) AS g
WHERE customer_name = 'Вера' ORDER BY product_title;`, { filename: "12-lossy.sql", runnable: true }),
      code("text", ` original_pairs | after_join | spurious 
----------------+------------+----------
              6 |         10 |        4
(1 row)

 customer_name |   product_title    
---------------+--------------------
 Вера          | Кофе зерновой 1 кг
 Вера          | Сахар 1 кг
 Вера          | Френч-пресс
 Вера          | Чай чёрный 100 г
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Разложение на «город — товар» и «клиент — город» после соединения даёт 10 строк вместо шести: общий столбец `customer_city` — не ключ, и Вера «купила» всё, что покупали в Москве. Правило: части декомпозиции соединяются **по ключу хотя бы одной из них**."),
    ]),

    section("internals", [
      h("Цена повторения на 200 000 строках"),
      code("sql", `-- Цена повторения: 200 000 строк продаж в плоской таблице и в нормализованной схеме (2000 клиентов, 500 товаров)
CREATE TABLE sales_flat AS
SELECT g AS line_id,
       g / 3 AS order_id,
       'Клиент номер ' || (g % 2000)                        AS customer_name,
       'Город номер ' || ((g % 2000) % 50)                  AS customer_city,
       'Товар с длинным названием номер ' || (g % 500)      AS product_title,
       100 + (g % 500)                                      AS product_price,
       1 + g % 5                                            AS qty
FROM generate_series(1, 200000) AS g;

CREATE TABLE customers AS SELECT DISTINCT (g % 2000) AS id, 'Клиент номер ' || (g % 2000) AS name, 'Город номер ' || ((g % 2000) % 50) AS city FROM generate_series(1, 200000) AS g;
CREATE TABLE products  AS SELECT DISTINCT (g % 500) AS id, 'Товар с длинным названием номер ' || (g % 500) AS title, 100 + (g % 500) AS price FROM generate_series(1, 200000) AS g;
CREATE TABLE order_lines AS SELECT g AS line_id, g / 3 AS order_id, (g % 2000) AS customer_id, (g % 500) AS product_id, 1 + g % 5 AS qty FROM generate_series(1, 200000) AS g;

SELECT 'плоская таблица' AS variant, pg_size_pretty(pg_total_relation_size('sales_flat')) AS size
UNION ALL
SELECT 'нормализованная (3 таблицы)',
       pg_size_pretty(pg_total_relation_size('customers') + pg_total_relation_size('products') + pg_total_relation_size('order_lines'));
SELECT (SELECT count(*) FROM sales_flat) AS flat_rows, (SELECT count(*) FROM customers) AS customers, (SELECT count(*) FROM products) AS products;`, { filename: "11-size.pg.sql" }),
      code("text", `           variant           | size  
-----------------------------+-------
 плоская таблица             | 32 MB
 нормализованная (3 таблицы) | 10 MB
(2 rows)

 flat_rows | customers | products 
-----------+-----------+----------
    200000 |      2000 |      500
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Плоская таблица (названия товаров и города повторяются в каждой строке) заняла 32 MB, три нормализованные таблицы — 10 MB. Числа зависят от длины строк и количества повторов: чем длиннее повторяющиеся значения, тем выше выигрыш. Повторение стоит места, времени записи, размера индексов и кэша."),
      h("Денормализация: копия, которую надо кому-то обновлять"),
      code("sql", `-- Контролируемая денормализация: сумма заказа хранится копией и устаревает при изменении позиций
CREATE TABLE order_totals_cache AS
SELECT o.id AS order_id, sum(oi.qty * p.price) AS total
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
JOIN products AS p ON p.id = oi.product_id
GROUP BY o.id;

UPDATE order_items SET qty = qty + 1 WHERE order_id = 1 AND product_id = 1;

-- Копия не знает об изменении; запрос по живым данным даёт верный итог
SELECT c.order_id, c.total AS cached,
       (SELECT sum(oi.qty * p.price) FROM order_items AS oi JOIN products AS p ON p.id = oi.product_id WHERE oi.order_id = c.order_id) AS actual
FROM order_totals_cache AS c
WHERE c.order_id IN (1, 2)
ORDER BY c.order_id;`, { filename: "06-denormalize.sql", runnable: true, fixture: "shop" }),
      code("text", ` order_id | cached  | actual  
----------+---------+---------
        1 | 1380.00 | 2580.00
        2 | 1650.00 | 1650.00
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Таблица-кэш сохранила сумму заказа 1 — 1 380. После увеличения количества кофе на единицу фактическая сумма — 2 580, а кэш не изменился. Заказ 2 не затронут, и расхождение видно только у заказа 1. Варианты согласования: представление (`VIEW`), которое всегда считает по живым данным; триггер или транзакция в приложении, обновляющие кэш вместе с позицией; материализованное представление с регулярным обновлением. Каждый требует явной ответственности за согласованность."),
      h("3НФ и BCNF: тонкость пересекающихся ключей"),
      p("Классический пример: `schedule(student, subject, teacher)`, где студент у каждого предмета учится у одного преподавателя (`{student, subject} → teacher`), а каждый преподаватель ведёт один предмет (`teacher → subject`). Ключи-кандидаты — `{student, subject}` и `{student, teacher}`. Таблица в 3НФ (`subject` — часть ключа), но не в BCNF: левая часть `teacher → subject` не суперключ. Устранение — разбиение на `(teacher, subject)` и `(student, teacher)`, ценой того, что зависимость `{student, subject} → teacher` перестаёт проверяться одним ограничением. На практике 3НФ достаточно в подавляющем большинстве схем; BCNF применяют, когда пересекающиеся ключи действительно порождают аномалии."),
    ]),

    section("mistakes", [
      h("Ошибка: список значений в одной ячейке"),
      wrongRight(
        "sql",
        { title: "Список в столбце", code: `SELECT title FROM products_bad WHERE tags LIKE '%чай%';`, note: "Находит и «чай», и «чайник»; нельзя повесить внешний ключ на тег, посчитать теги без разбора строки и защитить уникальность." },
        { title: "Строка на значение", code: `SELECT p.title FROM products_bad p JOIN product_tags t ON t.product_id = p.id WHERE t.tag = 'чай';`, note: "Точный поиск, внешний ключ и составной ключ `(product_id, tag)` защищают данные." },
      ),
      h("Ошибка: «разделить на всякий случай» по общему столбцу"),
      p("Вынесенные части обязаны соединяться по ключу. Декомпозиция по `customer_city` (не ключу) дала 4 лишние строки. Проверяйте результат соединения запросом `EXCEPT` в обе стороны."),
      h("Ошибка: нормализовать по текущим данным"),
      p("То, что в таблице сегодня у каждого города один руководитель, не значит `city → head`. Зависимости берутся из правил предметной области, а запрос-проверка лишь находит заведомо неверные гипотезы."),
      h("Ошибка: чрезмерная нормализация"),
      p("Отдельная таблица на каждый атрибут (`customer_names`, `customer_cities`) превращает любой запрос в десять соединений и не даёт выигрыша: эти факты зависят от одного ключа и должны жить в одной строке."),
      h("Ошибка: денормализация без владельца"),
      p("Столбец «сумма заказа» в таблице заказов — копия: после правки позиции он устаревает (замер: 1 380 против 2 580). Заранее решите, **кто** и **как** его обновляет, или не храните его."),
      h("Ошибка: естественный ключ, который меняется"),
      p("Имя клиента как первичный ключ означает, что смена имени каскадом меняет все строки заказов. Для рабочей схемы выбирайте неизменяемый суррогатный `id`, а имя оставляйте обычным столбцом."),
    ]),

    section("antipatterns", [
      ul(
        "**«Одна большая таблица» для отчётов** как основное хранилище: быстро в начале, потом — аномалии и расхождения.",
        "**Повторяющиеся столбцы** (`phone1`, `phone2`, `phone3`): третий телефон — миграция схемы; нужна таблица телефонов.",
        "**Списки через запятую и JSON-массивы вместо связей** там, где по значениям ищут и соединяют.",
        "**«Универсальный справочник»:** одна таблица `lookup(type, key, value)` для всех справочников — без внешних ключей и проверок типов.",
        "**Денормализованные итоги без механизма обновления.**",
        "**Нормализация до 5НФ там, где аномалий нет** — сложность без выигрыша.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Начинайте с зависимостей:** выпишите, что от чего зависит, прежде чем рисовать таблицы.",
        "**Цель по умолчанию — 3НФ;** отклоняйтесь осознанно и документируйте причину.",
        "**Связывайте таблицы внешними ключами** и защищайте инварианты ограничениями (`PRIMARY KEY`, `UNIQUE`, `CHECK`).",
        "**Используйте суррогатные ключи** для сущностей с изменяемыми атрибутами; естественные оставляйте `UNIQUE`.",
        "**Проверяйте декомпозицию без потерь** запросом `EXCEPT` в обе стороны на тестовых данных.",
        "**Денормализуйте по измерениям, а не по предчувствию:** сначала замер медленного запроса, потом решение.",
        "**Для кэшей определите владельца обновления:** триггер, транзакция приложения или материализованное представление.",
        "**Показывайте данные через представления,** если плоский вид нужен приложению: хранение остаётся нормализованным.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**NULL и зависимости:** `NULL` в определяющем столбце усложняет проверку зависимости; строки с `NULL` нужно рассматривать отдельно.",
        "**Исторические данные:** цена товара на момент заказа — свойство позиции заказа (а не товара), иначе смена цены изменит старые заказы. Это не нарушение нормализации, а другая зависимость.",
        "**Временные зависимости:** «адрес клиента на дату» — отдельная таблица с периодом действия.",
        "**Аналитические хранилища:** широкие денормализованные таблицы (звёздная схема) допустимы, потому что данные загружаются пакетами и не изменяются построчно.",
        "**Выбор типов ключей:** составной естественный ключ в таблице-связке нормален; в таблице, на которую ссылаются другие, чаще используют суррогатный.",
        "**SQLite и внешние ключи:** их проверка включается командой `PRAGMA foreign_keys = ON` для соединения; в песочнице курса она включена.",
      ),
    ]),

    section("related", [
      ul(
        "[Ключи и ограничения](/learn/sql/keys-constraints) — механизмы, которые закрепляют результат нормализации.",
        "[INNER и LEFT JOIN](/learn/sql/inner-left-joins) — как собрать нормализованные таблицы обратно.",
        "[GROUP BY и HAVING](/learn/sql/group-by-having) — запрос-проверка функциональных зависимостей.",
        "[Связи между таблицами](/learn/sql/relationships) — один-к-одному, один-ко-многим, многие-ко-многим.",
        "[Паттерны проектирования схем](/learn/sql/schema-patterns) — история изменений, мягкое удаление, иерархии.",
        "[Миграции и безопасный DDL](/learn/sql/migrations-safe-ddl) — как перейти от плоской таблицы к нормализованной на живой базе.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Теги списком",
          code: `
            CREATE TABLE products_bad (id integer PRIMARY KEY, title text, tags text);
            SELECT title FROM products_bad WHERE tags LIKE '%чай%';
          `,
          note: "Находит «чай» и «чайник» (в замере — два товара вместо одного); нет внешних ключей и защиты от повторов.",
        },
        {
          title: "Отдельная таблица тегов",
          code: `
            CREATE TABLE product_tags (
              product_id integer NOT NULL REFERENCES products_bad (id),
              tag text NOT NULL,
              PRIMARY KEY (product_id, tag)
            );
            SELECT p.title FROM products_bad AS p
            JOIN product_tags AS t ON t.product_id = p.id
            WHERE t.tag = 'чай';
          `,
          note: "Один товар, точный поиск; составной ключ запрещает дубли, внешний ключ — «висячие» теги.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.normalization.ex1",
      title: "Найдите нарушенную форму",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Таблица `lessons` с ключом `(student_id, course_id)` хранит имя студента в каждой строке. Определите, какая нормальная форма нарушена и сколько копий имени хранится для каждого студента. Затем выполните запрос и сравните."),
        code("sql", `CREATE TABLE lessons (
  student_id   integer NOT NULL,
  course_id    integer NOT NULL,
  student_name text    NOT NULL,
  grade        integer NOT NULL,
  PRIMARY KEY (student_id, course_id)
);
INSERT INTO lessons VALUES
  (1, 10, 'Анна', 5), (1, 11, 'Анна', 4), (1, 12, 'Анна', 5),
  (2, 10, 'Борис', 3), (2, 11, 'Борис', 4);

-- Сколько копий имени хранится для каждого студента?
SELECT student_id, student_name, count(*) AS copies
FROM lessons GROUP BY student_id, student_name ORDER BY student_id;`, { filename: "07-ex-predict.sql", runnable: true }),
      ],
      hints: ["От чего зависит `student_name`: от всего ключа или от его части?", "Сколько курсов у каждого студента?"],
      checks: ["Нарушена 2НФ: `student_name` зависит только от `student_id`", "У Анны 3 копии имени, у Бориса — 2"],
      solution: [
        code("text", ` student_id | student_name | copies 
------------+--------------+--------
          1 | Анна         |      3
          2 | Борис        |      2
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "`student_id → student_name` — зависимость от части составного ключа, то есть нарушение 2НФ.",
          "Имя повторяется столько раз, сколько у студента курсов: 3 и 2 копии. Исправление — таблица `students(id, name)` и ссылка на неё из `lessons`.",
        ),
      ],
    }),
    exercise({
      id: "sql.normalization.ex2",
      title: "Клиентов в Москве «четыре»",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Отчёт «сколько клиентов в каждом городе» по плоской таблице показывает в Москве 4 клиента, хотя их двое (Анна и Вера). Объясните причину и исправьте двумя способами: быстрым (в запросе) и правильным (в схеме)."),
        code("sql", `CREATE TABLE sales_flat (
  order_id integer NOT NULL, ordered_on date NOT NULL,
  customer_name text NOT NULL, customer_city text NOT NULL,
  product_title text NOT NULL, product_price integer NOT NULL, qty integer NOT NULL
);
INSERT INTO sales_flat VALUES
  (1, '2024-01-10', 'Анна',  'Москва', 'Кофе зерновой 1 кг', 1200, 1),
  (1, '2024-01-10', 'Анна',  'Москва', 'Сахар 1 кг',           90, 2),
  (2, '2024-02-14', 'Анна',  'Москва', 'Чай чёрный 100 г',    250, 3),
  (3, '2024-02-20', 'Борис', 'Казань', 'Кофе зерновой 1 кг', 1200, 1),
  (4, '2024-03-01', 'Вера',  'Москва', 'Френч-пресс',        1900, 1),
  (6, '2024-03-20', 'Глеб',  'Самара', 'Чай чёрный 100 г',    250, 2);

-- Отчёт «сколько клиентов в каждом городе» завышает числа
SELECT customer_city, count(*) AS customers FROM sales_flat GROUP BY customer_city ORDER BY customer_city;`, { filename: "08-ex-fix.sql", runnable: true }),
      ],
      hints: ["Что именно считает `count(*)` в плоской таблице?", "Какая таблица хранит каждого клиента ровно один раз?"],
      checks: ["`count(*)` считает строки продаж, а не клиентов", "Быстро: `count(DISTINCT customer_name)`; правильно: отдельная таблица `customers`"],
      solution: [
        code("sql", `CREATE TABLE sales_flat (
  order_id integer NOT NULL, ordered_on date NOT NULL,
  customer_name text NOT NULL, customer_city text NOT NULL,
  product_title text NOT NULL, product_price integer NOT NULL, qty integer NOT NULL
);
INSERT INTO sales_flat VALUES
  (1, '2024-01-10', 'Анна',  'Москва', 'Кофе зерновой 1 кг', 1200, 1),
  (1, '2024-01-10', 'Анна',  'Москва', 'Сахар 1 кг',           90, 2),
  (2, '2024-02-14', 'Анна',  'Москва', 'Чай чёрный 100 г',    250, 3),
  (3, '2024-02-20', 'Борис', 'Казань', 'Кофе зерновой 1 кг', 1200, 1),
  (4, '2024-03-01', 'Вера',  'Москва', 'Френч-пресс',        1900, 1),
  (6, '2024-03-20', 'Глеб',  'Самара', 'Чай чёрный 100 г',    250, 2);

-- Быстрое лечение: считать различных клиентов
SELECT customer_city, count(DISTINCT customer_name) AS customers
FROM sales_flat GROUP BY customer_city ORDER BY customer_city;

-- Верное лечение: после нормализации — таблица customers, где клиент записан один раз
CREATE TABLE customers AS SELECT DISTINCT customer_name AS name, customer_city AS city FROM sales_flat;
SELECT city, count(*) AS customers FROM customers GROUP BY city ORDER BY city;`, { filename: "09-fix-solution.sql", runnable: true }),
        code("text", ` customer_city | customers 
---------------+-----------
 Казань        |         1
 Москва        |         2
 Самара        |         1
(3 rows)

  city  | customers 
--------+-----------
 Казань |         1
 Москва |         2
 Самара |         1
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Анна записана в трёх строках, поэтому `count(*)` даёт 3 + 1 = 4. `count(DISTINCT customer_name)` исправляет отчёт, но не причину; настоящее решение — нормализованная таблица `customers`, где клиент хранится один раз и обычный `count(*)` правильно возвращает 2."),
      ],
    }),
    exercise({
      id: "sql.normalization.ex3",
      title: "Вынесите отделы в отдельную таблицу",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Таблица `emp_flat(id, name, dept, dept_head)` хранит руководителя отдела в строке каждого сотрудника. Приведите её к 3НФ: создайте `departments` и `employees` с внешним ключом, перенесите данные и докажите, что соединение таблиц восстанавливает исходные строки. Затем смените руководителя разработки одной командой."),
      ],
      hints: ["Какой столбец определяет `dept_head`, и значит, что станет ключом новой таблицы?", "Как проверить, что соединение не потеряло и не добавило строк?"],
      checks: ["`departments(dept PK, head)` и `employees(id PK, name, dept FK)`", "Проверка `EXCEPT` в обе стороны: 0 и 0", "Смена руководителя — один `UPDATE`"],
      solution: [
        code("sql", `CREATE TABLE emp_flat (id integer PRIMARY KEY, name text NOT NULL, dept text NOT NULL, dept_head text NOT NULL);
INSERT INTO emp_flat VALUES
  (1, 'Павел',  'разработка', 'Павел'),
  (2, 'Ольга',  'разработка', 'Павел'),
  (3, 'Семён',  'разработка', 'Павел'),
  (4, 'Фёдор',  'продажи',    'Фёдор'),
  (5, 'Хлоя',   'продажи',    'Фёдор');

-- 3НФ: отдел и его руководитель — отдельный факт
CREATE TABLE departments (dept text PRIMARY KEY, head text NOT NULL);
CREATE TABLE employees (id integer PRIMARY KEY, name text NOT NULL, dept text NOT NULL REFERENCES departments (dept));
INSERT INTO departments SELECT DISTINCT dept, dept_head FROM emp_flat;
INSERT INTO employees   SELECT id, name, dept FROM emp_flat;

-- Соединение без потерь
SELECT (SELECT count(*) FROM (SELECT * FROM emp_flat EXCEPT SELECT e.id, e.name, d.dept, d.head FROM employees AS e JOIN departments AS d ON d.dept = e.dept) AS a) AS missing,
       (SELECT count(*) FROM (SELECT e.id, e.name, d.dept, d.head FROM employees AS e JOIN departments AS d ON d.dept = e.dept EXCEPT SELECT * FROM emp_flat) AS b) AS extra;

-- Смена руководителя разработки — одна строка, согласованно для всех
UPDATE departments SET head = 'Ольга' WHERE dept = 'разработка';
SELECT e.name, d.dept, d.head FROM employees AS e JOIN departments AS d ON d.dept = e.dept ORDER BY e.id;`, { filename: "13-emp-3nf.sql", runnable: true, lineNumbers: true }),
        code("text", ` missing | extra 
---------+-------
       0 |     0
(1 row)

 name  |    dept    | head  
-------+------------+-------
 Павел | разработка | Ольга
 Ольга | разработка | Ольга
 Семён | разработка | Ольга
 Фёдор | продажи    | Фёдор
 Хлоя  | продажи    | Фёдор
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Зависимость `dept → dept_head` вынесена в `departments`. Две проверки `EXCEPT` вернули 0 и 0 — декомпозиция без потерь. Один `UPDATE departments` согласованно меняет руководителя у трёх сотрудников; в плоской таблице пришлось бы править каждую строку."),
      ],
    }),
  ],

  challenge: {
    id: "sql.normalization.challenge",
    title: "Библиотека: из плоской выдачи в 3НФ",
    scenario: [
      p("Библиотека ведёт выдачи книг в одной таблице `loans_flat`: читатель с телефоном, книга с автором и страной автора, дата выдачи. Нужна схема без аномалий и доказательство, что данные не потеряны."),
    ],
    requirements: [
      "Выпишите зависимости: читатель → имя и телефон; книга → название и автор; автор → страна",
      "Создайте `readers`, `authors`, `books`, `loans` со связями внешними ключами",
      "Перенесите данные `INSERT … SELECT DISTINCT`",
      "Докажите соединение без потерь проверкой `EXCEPT` в обе стороны",
    ],
    constraints: [
      "Страна автора хранится ровно один раз",
      "Никаких списков и повторяющихся столбцов",
    ],
    acceptance: [
      "3 читателя, 3 автора, 4 книги, 6 выдач",
      "`missing = 0`, `extra = 0`",
    ],
    hints: [
      "Цепочка `book_id → author_name → author_country` — транзитивная: страна принадлежит автору, а не книге.",
      "Таблицу `authors` нужно создать до `books`, потому что `books` ссылается на неё.",
    ],
    solution: [
      code("sql", `-- Выдачи книг: исходная плоская таблица и нормализованная схема с проверкой «без потерь»
CREATE TABLE loans_flat (
  loan_id        integer PRIMARY KEY,
  reader_id      integer NOT NULL,
  reader_name    text    NOT NULL,
  reader_phone   text    NOT NULL,
  book_id        integer NOT NULL,
  book_title     text    NOT NULL,
  author_name    text    NOT NULL,
  author_country text    NOT NULL,
  loaned_on      date    NOT NULL
);
INSERT INTO loans_flat VALUES
  (1, 1, 'Анна',  '+7-900-111', 10, 'Мастер и Маргарита', 'Булгаков', 'Россия',  '2024-01-10'),
  (2, 1, 'Анна',  '+7-900-111', 11, 'Белая гвардия',      'Булгаков', 'Россия',  '2024-01-24'),
  (3, 2, 'Борис', '+7-900-222', 12, 'Мёртвые души',       'Гоголь',   'Россия',  '2024-02-02'),
  (4, 3, 'Вера',  '+7-900-333', 10, 'Мастер и Маргарита', 'Булгаков', 'Россия',  '2024-02-15'),
  (5, 2, 'Борис', '+7-900-222', 13, 'Процесс',            'Кафка',    'Австрия', '2024-03-01'),
  (6, 3, 'Вера',  '+7-900-333', 13, 'Процесс',            'Кафка',    'Австрия', '2024-03-12');

CREATE TABLE readers (id integer PRIMARY KEY, name text NOT NULL, phone text NOT NULL);
CREATE TABLE authors (name text PRIMARY KEY, country text NOT NULL);
CREATE TABLE books (
  id          integer PRIMARY KEY,
  title       text NOT NULL,
  author_name text NOT NULL REFERENCES authors (name)
);
CREATE TABLE loans (
  id        integer PRIMARY KEY,
  reader_id integer NOT NULL REFERENCES readers (id),
  book_id   integer NOT NULL REFERENCES books (id),
  loaned_on date    NOT NULL
);
INSERT INTO readers SELECT DISTINCT reader_id, reader_name, reader_phone FROM loans_flat;
INSERT INTO authors SELECT DISTINCT author_name, author_country FROM loans_flat;
INSERT INTO books   SELECT DISTINCT book_id, book_title, author_name FROM loans_flat;
INSERT INTO loans   SELECT loan_id, reader_id, book_id, loaned_on FROM loans_flat;

SELECT (SELECT count(*) FROM readers) AS readers, (SELECT count(*) FROM authors) AS authors,
       (SELECT count(*) FROM books) AS books, (SELECT count(*) FROM loans) AS loans;

WITH restored AS (
  SELECT l.id AS loan_id, r.id AS reader_id, r.name AS reader_name, r.phone AS reader_phone,
         b.id AS book_id, b.title AS book_title, a.name AS author_name, a.country AS author_country, l.loaned_on
  FROM loans AS l
  JOIN readers AS r ON r.id = l.reader_id
  JOIN books   AS b ON b.id = l.book_id
  JOIN authors AS a ON a.name = b.author_name
)
SELECT (SELECT count(*) FROM (SELECT * FROM loans_flat EXCEPT SELECT * FROM restored) AS x) AS missing,
       (SELECT count(*) FROM (SELECT * FROM restored EXCEPT SELECT * FROM loans_flat) AS y) AS extra;`, { filename: "10-challenge.sql", runnable: true, lineNumbers: true }),
      code("text", ` readers | authors | books | loans 
---------+---------+-------+-------
       3 |       3 |     4 |     6
(1 row)

 missing | extra 
---------+-------
       0 |     0
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Зависимости: `reader_id → (name, phone)`, `book_id → (title, author_name)`, `author_name → country`. Последняя — транзитивная через книгу, поэтому страна вынесена в `authors`. Порядок создания таблиц определяют внешние ключи (авторы раньше книг). Проверка `EXCEPT` в обе стороны вернула 0 и 0 — исходная таблица восстанавливается ровно."),
    ],
  },

  interview: [
    iq("sql.normalization.i1", "basic", "Что такое нормализация и зачем она нужна?", [
      ul(
        "Проектирование таблиц так, чтобы каждый факт хранился один раз; связи выражаются ключами.",
        "Устраняет аномалии обновления, вставки и удаления, которые возникают из-за избыточности.",
        "В замере: плоская таблица допустила рассогласованный город клиента и потерю клиента при удалении заказа.",
      ),
    ]),
    iq("sql.normalization.i2", "basic", "Назовите три аномалии и приведите по примеру.", [
      ul(
        "**Обновления:** изменили город в одной строке из трёх — у клиента два города.",
        "**Удаления:** удалили единственный заказ — исчез клиент.",
        "**Вставки:** нельзя добавить клиента без заказа, если столбцы заказа обязательны.",
      ),
    ]),
    iq("sql.normalization.i3", "intermediate", "Чем 2НФ отличается от 3НФ?", [
      ul(
        "2НФ: каждый неключевой столбец зависит от всего ключа, а не от его части (актуально при составном ключе).",
        "3НФ: неключевой столбец не зависит от другого неключевого (транзитивная зависимость: `id → dept → dept_head`).",
        "Устранение в обоих случаях — вынос зависимого факта в отдельную таблицу.",
      ),
    ]),
    iq("sql.normalization.i4", "intermediate", "Как проверить, что декомпозиция без потерь?", [
      ul(
        "Соединить части и сравнить с исходной таблицей `EXCEPT` в обе стороны: должно вернуться 0 строк.",
        "Лишние строки (spurious tuples) возникают, если части соединяются по общему столбцу, не являющемуся ключом (в замере 6 → 10 строк).",
        "Теоретически: общие столбцы частей образуют ключ хотя бы одной из них.",
      ),
    ]),
    iq("sql.normalization.i5", "intermediate", "Как найти функциональную зависимость между столбцами в данных?", [
      ul(
        "`SELECT A, count(DISTINCT B) FROM t GROUP BY A HAVING count(DISTINCT B) > 1`: пустой результат — зависимость не опровергнута.",
        "Данные лишь опровергают гипотезу; подтверждает её правило предметной области.",
        "`NULL` рассматривают отдельно: по ним проверка может вводить в заблуждение.",
      ),
    ]),
    iq("sql.normalization.i6", "advanced", "В чём разница между 3НФ и BCNF?", [
      ul(
        "BCNF строже: левая часть любой нетривиальной зависимости — суперключ; 3НФ допускает зависимость, если правая часть — атрибут ключа.",
        "Пример: `schedule(student, subject, teacher)` с `teacher → subject` — 3НФ есть, BCNF нет.",
        "Цена BCNF: часть зависимостей перестаёт проверяться одним ограничением; в практике чаще довольствуются 3НФ.",
      ),
    ]),
    iq("sql.normalization.i7", "advanced", "Когда денормализация оправдана и как её сделать безопасно?", [
      ul(
        "Когда измеренный запрос слишком медленный и оптимизации индексами и запросом недостаточно, либо в аналитических хранилищах.",
        "Безопасно: назначить владельца обновления копии (триггер, транзакция приложения, материализованное представление), хранить исходные нормализованные данные.",
        "Альтернатива: представление, считающее по живым данным (в замере кэш показал 1 380 при факте 2 580).",
      ),
    ]),
    iq("sql.normalization.i8", "engineering", "Вам достался монолит с одной таблицей `orders` на 80 столбцов и 100 млн строк. С чего вы начнёте нормализацию на живой базе?", [
      ul(
        "Выписать зависимости и найти самые «шумные» повторяющиеся группы (клиент, адрес, товар) — по ним максимум аномалий.",
        "Создать новые таблицы рядом, заполнить пакетами `INSERT … SELECT DISTINCT`, добавить внешние ключи как `NOT VALID` и проверить позже.",
        "Двойная запись или триггеры на переходный период; сравнить результаты `EXCEPT` и сверить отчёты.",
        "Переключить чтение на новые таблицы (представление со старым именем), затем записи; старые столбцы удалять последним шагом.",
        "Каждый шаг — отдельная миграция с возможностью отката.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.normalization.e1", "foundation", "Что такое аномалия обновления?", ["Ошибка синтаксиса `UPDATE`", "Медленный `UPDATE`", "Часть копий факта изменена, часть нет, и данные расходятся", "Блокировка таблицы"], 2, "Если факт записан в нескольких строках, частичное изменение (замер: у Анны два города) нарушает согласованность."),
    mcq("sql.normalization.e2", "foundation", "Какая форма нарушена в ячейке `tags = 'напитки,чай'`?", ["1НФ", "2НФ", "3НФ", "BCNF"], 0, "Список значений в одной ячейке нарушает 1НФ: значения должны быть неделимыми; поэтому `LIKE '%чай%'` находит и «чайник»."),
    mcq("sql.normalization.e3", "foundation", "Как правильно записать клиента, у которого ещё нет заказов?", ["В плоскую таблицу с пустыми столбцами заказа", "В поле комментария", "Откладывать до первого заказа", "В отдельную таблицу клиентов"], 3, "Отдельная таблица `customers` позволяет хранить клиента независимо от заказов — аномалии вставки нет."),
    mcq("sql.normalization.e4", "intermediate", "Ключ таблицы — `(student_id, course_id)`, а `student_name` зависит только от `student_id`. Какая форма нарушена?", ["1НФ", "2НФ", "3НФ", "Никакая"], 1, "Зависимость от части составного ключа нарушает 2НФ; имя студента надо вынести в таблицу `students` (замер: 3 копии у Анны)."),
    mcq("sql.normalization.e5", "intermediate", "`dept → dept_head` и `id → dept`. Что здесь нарушено?", ["1НФ", "2НФ", "Ничего", "3НФ: транзитивная зависимость"], 3, "`dept_head` зависит от ключа `id` через `dept` — это транзитивная зависимость, нарушение 3НФ."),
    mcq("sql.normalization.e6", "intermediate", "Разложение дало при соединении 10 строк вместо 6. Что произошло?", ["Это нормально", "Ошибка в `EXCEPT`", "Части соединялись по общему столбцу, не являющемуся ключом, и появились лишние строки", "Потеряны строки"], 2, "Лишние строки — признак декомпозиции с потерями; в замере по `customer_city` получили 4 лишние строки."),
    mcq("sql.normalization.e7", "advanced", "Что произойдёт с кэшем «сумма заказа» в отдельной таблице после изменения количества позиции?", ["Обновится автоматически", "Устареет, если никто его не обновляет", "Удалится", "Станет `NULL`"], 1, "Кэш — копия; без триггера или транзакции приложения она расходится (замер: 1 380 против 2 580)."),
    open("sql.normalization.e8", "intermediate", "Разложите таблицу `orders_flat(order_id, customer_id, customer_name, customer_email, product_id, product_title, qty)` по нормальным формам. Какие таблицы получатся и как проверить, что данные не потеряны?", [
      ul(
        "Ключ — `(order_id, product_id)`. Зависимости: `order_id → customer_id`, `customer_id → customer_name, customer_email`, `product_id → product_title`.",
        "Таблицы: `customers(id, name, email)`, `products(id, title)`, `orders(id, customer_id → customers)`, `order_items(order_id, product_id, qty)` с внешними ключами.",
        "Перенос через `INSERT … SELECT DISTINCT`; проверка: `EXCEPT` исходной таблицы и соединения в обе стороны возвращает 0 строк.",
        "Дополнительно: `UNIQUE (email)` на клиентах, составной ключ на позициях, индексы по внешним ключам.",
      ),
    ], ["Ключ и зависимости", "Состав таблиц и связи", "Проверка EXCEPT в обе стороны", "Ограничения и индексы"], { format: "architecture" }),
  ],

  mastery: [
    mcq("sql.normalization.m1", "intermediate", "Почему запрос `count(*)` дал «4 клиента в Москве» по плоской таблице?", ["`count(*)` считает строки продаж, а Анна записана тремя строками", "В Москве правда четыре клиента", "Ошибка группировки", "Из-за `NULL`"], 0, "Три строки Анны и одна Веры дают 4; в нормализованной таблице `customers` — честные 2."),
    mcq("sql.normalization.m2", "advanced", "Какая проверка обнаруживает потерю данных при декомпозиции?", ["`SELECT count(*)` по новой таблице", "`ANALYZE`", "`EXCEPT` исходной таблицы и восстановленного соединения в обе стороны", "`EXPLAIN`"], 2, "Пустые результаты `A EXCEPT B` и `B EXCEPT A` означают, что наборы строк совпадают (замер: 0 и 0)."),
    mcq("sql.normalization.m3", "advanced", "Таблица `schedule(student, subject, teacher)`: `{student, subject} → teacher`, `teacher → subject`. Какая форма выполняется?", ["3НФ, но не BCNF", "BCNF", "Только 1НФ", "Никакая"], 0, "`subject` входит в ключ `{student, subject}`, поэтому 3НФ выполняется; но левая часть `teacher → subject` не суперключ, и BCNF нарушена."),
    open("sql.normalization.m4", "advanced", "Команда хочет «для скорости» хранить в таблице `orders` столбцы `customer_name` и `customer_city`. Какие аргументы за и против вы приведёте и как договориться о безопасном решении?", [
      ul(
        "Против: каждая смена имени или города требует обновления во всех заказах; риск аномалий и расхождения отчётов; рост таблицы и индексов (замер: 32 MB против 10 MB на 200 тыс. строк).",
        "За: чтение «заказ с клиентом» без соединения; но с индексом по `customer_id` и соединением оно обычно достаточно быстрое — сначала измерить `EXPLAIN ANALYZE`.",
        "Если копия действительно нужна как исторический снимок (имя и город на момент заказа), это другая сущность — снимок хранится осознанно и не обновляется.",
        "Безопасная альтернатива: представление или материализованное представление для чтения, нормализованные таблицы для записи.",
        "Решение фиксируется в документации схемы с владельцем согласования.",
      ),
    ], ["Риск аномалий", "Измерение вместо предположений", "Исторический снимок как отдельный случай", "Представления вместо копий"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.normalization.f1", front: "Нормализация?", back: "Проектирование таблиц, где каждый факт хранится один раз; устраняет аномалии обновления, вставки и удаления." },
    { id: "sql.normalization.f2", front: "1НФ / 2НФ / 3НФ?", back: "1НФ: одно значение в ячейке. 2НФ: нет зависимости от части составного ключа. 3НФ: нет зависимости неключевого от неключевого." },
    { id: "sql.normalization.f3", front: "Функциональная зависимость?", back: "A → B: одному значению A всегда соответствует одно B. Проверка: HAVING count(DISTINCT B) > 1 находит нарушителей." },
    { id: "sql.normalization.f4", front: "Декомпозиция без потерь?", back: "Соединение частей даёт исходные строки. Проверка: EXCEPT в обе стороны → 0 и 0. Соединять нужно по ключу." },
    { id: "sql.normalization.f5", front: "BCNF?", back: "Левая часть любой нетривиальной зависимости — суперключ. Строже 3НФ." },
    { id: "sql.normalization.f6", front: "Денормализация?", back: "Осознанная копия данных ради скорости; требует владельца обновления (триггер, транзакция, материализованное представление)." },
    { id: "sql.normalization.f7", front: "Списки в ячейке?", back: "Нарушение 1НФ: LIKE '%чай%' находит и «чайник». Нужна таблица тегов с составным ключом." },
    { id: "sql.normalization.f8", front: "Нормализовать по данным или по правилам?", back: "По правилам предметной области; данные только опровергают гипотезу о зависимости." },
  ],

  sources: [
    { title: "E. F. Codd. A Relational Model of Data for Large Shared Data Banks (1970)", url: "https://dl.acm.org/doi/10.1145/362384.362685", publisher: "Other" },
    { title: "PostgreSQL 16: Constraints", url: "https://www.postgresql.org/docs/16/ddl-constraints.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Foreign Keys (tutorial)", url: "https://www.postgresql.org/docs/16/tutorial-fk.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: CREATE TABLE", url: "https://www.postgresql.org/docs/16/sql-createtable.html", publisher: "PostgreSQL" },
    { title: "SQLite: Foreign Key Support", url: "https://www.sqlite.org/foreignkeys.html", publisher: "Other" },
  ],
};
