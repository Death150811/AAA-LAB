import { SQL_FIXTURES } from "./fixtures";

export interface PlaygroundExample {
  id: string;
  title: string;
  sql: string;
  /** Что показывает пример — по результату, который выдаёт SQLite (проверено выполнением). */
  note: string;
}

export interface PlaygroundDataset {
  id: string;
  title: string;
  description: string;
  /** Скрипт, создающий базу (пустая строка — пустая база). */
  setup: string;
  examples: PlaygroundExample[];
}

export const PLAYGROUND_DATASETS: PlaygroundDataset[] = [
  {
    id: "shop",
    title: "Магазин",
    description: "Клиенты, товары, заказы, позиции заказов и платежи — те же данные, что в темах про JOIN, агрегаты и окна.",
    setup: SQL_FIXTURES["shop-payments"] ?? "",
    examples: [
      {
        id: "inner-join",
        title: "Заказы клиентов (INNER JOIN)",
        sql: "SELECT c.name, o.id AS order_id, o.status\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nORDER BY c.name, o.id;",
        note: "INNER JOIN оставляет только пары, для которых условие истинно: клиенты без заказов в результат не попадают.",
      },
      {
        id: "left-join-null",
        title: "Клиенты без заказов (LEFT JOIN + IS NULL)",
        sql: "SELECT c.name\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id IS NULL;",
        note: "LEFT JOIN сохраняет все строки левой таблицы, а у клиентов без заказов правая сторона заполняется NULL. Фильтр o.id IS NULL оставляет именно их: Егор и Игорь.",
      },
      {
        id: "group-by",
        title: "Выручка по категориям (GROUP BY)",
        sql: "SELECT p.category, SUM(oi.qty * p.price) AS revenue\nFROM order_items oi\nJOIN products p ON p.id = oi.product_id\nGROUP BY p.category\nORDER BY revenue DESC;",
        note: "Группировка схлопывает строки в одну на категорию, агрегат считает по строкам группы: напитки — 11800, посуда — 8800, продукты — 3540.",
      },
      {
        id: "having",
        title: "Клиенты с двумя и более заказами (HAVING)",
        sql: "SELECT c.name, COUNT(*) AS orders\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nGROUP BY c.id, c.name\nHAVING COUNT(*) >= 2\nORDER BY orders DESC, c.name;",
        note: "WHERE отбирает строки до группировки, HAVING — группы после неё. Сверху Анна (4 заказа), Вера (3), Борис (2).",
      },
      {
        id: "null-trap",
        title: "Ловушка NULL: city <> 'Москва'",
        sql: "SELECT name, city FROM customers WHERE city <> 'Москва';",
        note: "У Егора город неизвестен (NULL), а сравнение с NULL даёт не «истина», а «неизвестно» — строка отброшена. Вернулось 4 строки вместо ожидаемых 5; исправление — в следующем примере.",
      },
      {
        id: "null-fix",
        title: "Исправление: IS NULL OR …",
        sql: "SELECT name, city FROM customers WHERE city IS NULL OR city <> 'Москва';",
        note: "Явная проверка IS NULL возвращает и Егора: теперь 5 строк.",
      },
      {
        id: "row-number",
        title: "Нумерация заказов клиента (ROW_NUMBER)",
        sql: "SELECT customer_id, id AS order_id, ordered_on,\n       ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_on) AS n\nFROM orders\nORDER BY customer_id, n;",
        note: "Оконная функция нумерует строки внутри партиции (PARTITION BY) в заданном порядке и, в отличие от GROUP BY, не схлопывает строки.",
      },
      {
        id: "cte",
        title: "Сумма заказа через CTE (WITH)",
        sql: "WITH totals AS (\n  SELECT oi.order_id, SUM(oi.qty * p.price) AS total\n  FROM order_items oi JOIN products p ON p.id = oi.product_id\n  GROUP BY oi.order_id\n)\nSELECT o.id, o.status, t.total\nFROM orders o JOIN totals t ON t.order_id = o.id\nORDER BY t.total DESC;",
        note: "WITH даёт промежуточному результату имя, и запрос читается сверху вниз: сначала суммы по заказам, затем присоединение к самим заказам.",
      },
      {
        id: "payments",
        title: "Оплаты по заказам",
        sql: "SELECT o.id, SUM(pay.amount) AS paid\nFROM orders o JOIN payments pay ON pay.order_id = o.id\nGROUP BY o.id\nORDER BY o.id;",
        note: "У заказа 2 две оплаты по 825, вместе — 1650. Сравните с суммой заказа из примера «Сумма заказа через CTE»: так находят недоплаты и дубли платежей.",
      },
      {
        id: "plan-scan",
        title: "План без индекса (EXPLAIN QUERY PLAN)",
        sql: "EXPLAIN QUERY PLAN\nSELECT * FROM orders WHERE customer_id = 3;",
        note: "SQLite сообщает SCAN orders — перебор всей таблицы. Выполните следующий пример и сравните.",
      },
      {
        id: "plan-index",
        title: "План с индексом",
        sql: "CREATE INDEX idx_orders_customer ON orders (customer_id);\nEXPLAIN QUERY PLAN\nSELECT * FROM orders WHERE customer_id = 3;",
        note: "После CREATE INDEX план становится SEARCH orders USING INDEX idx_orders_customer (customer_id=?) — поиск по индексу вместо перебора. Индекс появится в схеме справа; «Сбросить данные» его удалит.",
      },
      {
        id: "rollback",
        title: "Транзакция и откат (ROLLBACK)",
        sql: "BEGIN;\nUPDATE products SET price = price * 2 WHERE category = 'напитки';\nSELECT title, price FROM products WHERE category = 'напитки';\nROLLBACK;\nSELECT title, price FROM products WHERE category = 'напитки';",
        note: "Внутри транзакции цены напитков удвоены, после ROLLBACK вернулись к исходным: 1200, 250, 380. Два результата — два SELECT.",
      },
      {
        id: "fk-error",
        title: "Ошибка внешнего ключа",
        sql: "INSERT INTO orders (id, customer_id, ordered_on, status)\nVALUES (999, 12345, '2024-01-01', 'new');",
        note: "Клиента 12345 нет, и вставка отвергается: FOREIGN KEY constraint failed. Проверка включена командой PRAGMA foreign_keys = ON при создании базы.",
      },
      {
        id: "check-error",
        title: "Ошибка ограничения CHECK",
        sql: "UPDATE products SET price = -5 WHERE id = 1;",
        note: "Цена −5 нарушает CHECK (price >= 0): оператор отклонён целиком, данные не изменились.",
      },
    ],
  },
  {
    id: "staff",
    title: "Сотрудники",
    description: "Двенадцать сотрудников четырёх отделов с руководителем в той же таблице — материал для самосоединения, иерархий и оконных функций.",
    setup: SQL_FIXTURES["staff"] ?? "",
    examples: [
      {
        id: "self-join",
        title: "Сотрудник и руководитель (самосоединение)",
        sql: "SELECT e.name AS employee, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON m.id = e.manager_id\nORDER BY e.id;",
        note: "Таблица соединяется сама с собой под двумя псевдонимами: e — сотрудник, m — его руководитель. У Ирины руководителя нет, поэтому manager — NULL (LEFT JOIN сохраняет её строку).",
      },
      {
        id: "recursive",
        title: "Иерархия (рекурсивный CTE)",
        sql: "WITH RECURSIVE chain(id, name, depth) AS (\n  SELECT id, name, 0 FROM employees WHERE manager_id IS NULL\n  UNION ALL\n  SELECT e.id, e.name, chain.depth + 1\n  FROM employees e JOIN chain ON e.manager_id = chain.id\n)\nSELECT substr('                    ', 1, depth * 2) || name AS tree, depth\nFROM chain\nORDER BY depth, id;",
        note: "Рекурсивная часть добавляет подчинённых уровень за уровнем, пока находятся новые строки; depth — глубина в иерархии (у Ирины 0).",
      },
      {
        id: "dense-rank",
        title: "Место по зарплате в отделе (DENSE_RANK)",
        sql: "SELECT name, dept, salary,\n       DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rank_in_dept\nFROM employees\nORDER BY dept, rank_in_dept, name;",
        note: "DENSE_RANK даёт одинаковое место при равной зарплате и не оставляет «дыр» в нумерации (в отличие от RANK).",
      },
      {
        id: "avg-window",
        title: "Отклонение от средней по отделу (AVG OVER)",
        sql: "SELECT name, dept, salary,\n       ROUND(AVG(salary) OVER (PARTITION BY dept)) AS dept_avg,\n       salary - ROUND(AVG(salary) OVER (PARTITION BY dept)) AS diff\nFROM employees\nORDER BY dept, salary DESC;",
        note: "Агрегат с OVER считает среднее по отделу, но оставляет каждую строку сотрудника — так можно сравнить человека с группой в одном запросе.",
      },
      {
        id: "lag",
        title: "Дата предыдущего найма (LAG)",
        sql: "SELECT name, hired_on, LAG(hired_on) OVER (ORDER BY hired_on) AS prev_hired\nFROM employees\nORDER BY hired_on;",
        note: "LAG берёт значение из предыдущей строки в порядке окна; у самой первой строки предыдущей нет — NULL.",
      },
      {
        id: "case",
        title: "Уровни зарплаты (CASE)",
        sql: "SELECT name, salary,\n       CASE WHEN salary >= 200000 THEN 'высокая'\n            WHEN salary >= 120000 THEN 'средняя'\n            ELSE 'начальная' END AS band\nFROM employees\nORDER BY salary DESC;",
        note: "CASE проверяет условия сверху вниз и возвращает первое сработавшее; порядок ветвей важен.",
      },
    ],
  },
  {
    id: "blank",
    title: "Пустая база",
    description: "Чистый лист: создавайте таблицы, вставляйте строки и проверяйте ограничения. База живёт только на этой странице.",
    setup: "",
    examples: [
      {
        id: "ddl",
        title: "Две таблицы со связью",
        sql: "CREATE TABLE authors (\n  id   integer PRIMARY KEY,\n  name text NOT NULL UNIQUE\n);\nCREATE TABLE books (\n  id        integer PRIMARY KEY,\n  title     text NOT NULL,\n  author_id integer NOT NULL REFERENCES authors (id),\n  year      integer CHECK (year > 0)\n);\nINSERT INTO authors (name) VALUES ('Керниган'), ('Ритчи');\nINSERT INTO books (title, author_id, year) VALUES ('Язык программирования C', 1, 1978);\nSELECT b.title, a.name FROM books b JOIN authors a ON a.id = b.author_id;",
        note: "Справочник авторов, таблица книг с внешним ключом и CHECK, вставка и соединение. Таблицы появятся в схеме справа.",
      },
      {
        id: "unique-error",
        title: "Нарушение UNIQUE",
        sql: "CREATE TABLE tags (name text UNIQUE);\nINSERT INTO tags VALUES ('sql');\nINSERT INTO tags VALUES ('sql');",
        note: "Вторая вставка отвергается: UNIQUE constraint failed: tags.name. Операторы до ошибки уже выполнены — первая строка в таблице осталась.",
      },
    ],
  },
];
