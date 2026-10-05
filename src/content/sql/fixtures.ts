// Сгенерировано scripts/gen-sql-fixtures.mjs из src/content/sql/fixtures/*.sql — не редактировать вручную.
export const SQL_FIXTURES: Record<string, string> = {
  "shop": `CREATE TABLE customers (
  id        integer PRIMARY KEY,
  name      text    NOT NULL,
  city      text,
  signed_up date    NOT NULL
);
CREATE TABLE products (
  id       integer PRIMARY KEY,
  title    text    NOT NULL,
  category text    NOT NULL,
  price    numeric(8,2) NOT NULL CHECK (price >= 0)
);
CREATE TABLE orders (
  id          integer PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customers (id),
  ordered_on  date    NOT NULL,
  status      text    NOT NULL CHECK (status IN ('new', 'paid', 'shipped', 'cancelled'))
);
CREATE TABLE order_items (
  order_id   integer NOT NULL REFERENCES orders (id),
  product_id integer NOT NULL REFERENCES products (id),
  qty        integer NOT NULL CHECK (qty > 0),
  PRIMARY KEY (order_id, product_id)
);

INSERT INTO customers (id, name, city, signed_up) VALUES
  (1, 'Анна',  'Москва', '2023-01-15'),
  (2, 'Борис', 'Казань', '2023-02-20'),
  (3, 'Вера',  'Москва', '2023-03-05'),
  (4, 'Глеб',  'Самара', '2023-03-18'),
  (5, 'Дарья', 'Казань', '2023-05-02'),
  (6, 'Егор',  NULL,     '2023-06-10'),
  (7, 'Жанна', 'Москва', '2023-07-22'),
  (8, 'Игорь', 'Самара', '2023-09-01');

INSERT INTO products (id, title, category, price) VALUES
  (1,  'Кофе зерновой 1 кг', 'напитки', 1200.00),
  (2,  'Чай чёрный 100 г',   'напитки',  250.00),
  (3,  'Кружка керамическая', 'посуда',   450.00),
  (4,  'Френч-пресс',        'посуда',  1900.00),
  (5,  'Сахар 1 кг',         'продукты',   90.00),
  (6,  'Печенье овсяное',    'продукты',  140.00),
  (7,  'Мёд 300 г',          'продукты',  520.00),
  (8,  'Чайник стальной',    'посуда',  2300.00),
  (9,  'Какао 250 г',        'напитки',  380.00),
  (10, 'Термокружка',        'посуда',   990.00);

INSERT INTO orders (id, customer_id, ordered_on, status) VALUES
  (1,  1, '2024-01-10', 'paid'),
  (2,  1, '2024-02-14', 'paid'),
  (3,  2, '2024-02-20', 'shipped'),
  (4,  3, '2024-03-01', 'paid'),
  (5,  3, '2024-03-15', 'cancelled'),
  (6,  4, '2024-03-20', 'new'),
  (7,  1, '2024-04-02', 'paid'),
  (8,  5, '2024-04-11', 'shipped'),
  (9,  2, '2024-04-30', 'paid'),
  (10, 7, '2024-05-06', 'paid'),
  (11, 3, '2024-05-21', 'paid'),
  (12, 1, '2024-06-01', 'shipped'),
  (13, 5, '2024-06-18', 'cancelled');

INSERT INTO order_items (order_id, product_id, qty) VALUES
  (1, 1, 1), (1, 5, 2),
  (2, 2, 3), (2, 3, 2),
  (3, 4, 1),
  (4, 1, 2), (4, 6, 4), (4, 7, 1),
  (5, 8, 1),
  (6, 9, 2), (6, 5, 1),
  (7, 3, 1), (7, 2, 2), (7, 6, 3),
  (8, 1, 1), (8, 3, 2),
  (9, 7, 2), (9, 9, 1),
  (10, 4, 1), (10, 2, 1),
  (11, 5, 5), (11, 6, 2),
  (12, 1, 3), (12, 9, 2),
  (13, 3, 1);`,
  "staff": `CREATE TABLE employees (
  id         integer PRIMARY KEY,
  name       text    NOT NULL,
  dept       text    NOT NULL,
  salary     integer NOT NULL CHECK (salary > 0),
  manager_id integer REFERENCES employees (id),
  hired_on   date    NOT NULL
);

INSERT INTO employees (id, name, dept, salary, manager_id, hired_on) VALUES
  (1,  'Ирина',   'правление',   300000, NULL, '2019-03-01'),
  (2,  'Павел',   'разработка',  220000, 1,    '2019-06-15'),
  (3,  'Ольга',   'разработка',  180000, 2,    '2020-02-10'),
  (4,  'Семён',   'разработка',  180000, 2,    '2020-09-01'),
  (5,  'Тимур',   'разработка',  140000, 3,    '2021-04-12'),
  (6,  'Ульяна',  'разработка',  120000, 3,    '2022-01-20'),
  (7,  'Фёдор',   'продажи',     200000, 1,    '2019-11-05'),
  (8,  'Хлоя',    'продажи',     110000, 7,    '2021-08-30'),
  (9,  'Цезарь',  'продажи',     110000, 7,    '2022-05-16'),
  (10, 'Эльвира', 'продажи',      95000, 8,    '2023-02-01'),
  (11, 'Юлия',    'поддержка',    90000, 7,    '2022-10-03'),
  (12, 'Яков',    'поддержка',    85000, 11,   '2023-06-19');`,
};
