import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p07ShopFinal: Project = {
  id: "sql.p07-shop-final",
  domain: "sql",
  order: 7,
  title: "Итоговый проект: интернет-магазин от схемы до отчётов",
  subtitle: "Схема с ограничениями, индексы под запросы, представление и роли, шесть аналитических отчётов на 60 000 заказов — 56 проверок на PostgreSQL 16",
  level: "mastery",
  estimatedHours: 20,
  isFinal: true,
  buildsOn: [
    "sql.p01-shop-schema",
    "sql.p02-sales-analytics",
    "sql.p03-join-reports",
    "sql.p04-rankings-hierarchies",
    "sql.p05-school-normalization",
    "sql.p06-reliable-booking",
  ],
  topics: [
    "sql.keys-constraints",
    "sql.relationships",
    "sql.schema-patterns",
    "sql.inner-left-joins",
    "sql.group-by-having",
    "sql.ctes",
    "sql.window-functions",
    "sql.indexes-btree",
    "sql.explain-plans",
    "sql.query-tuning",
    "sql.sql-security",
  ],
  objective:
    "Собрать в одном проекте всё, чему учит домен SQL: **спроектировать схему магазина** так, чтобы база сама не принимала неверные данные; **добавить индексы**, которые действительно сокращают чтение (проверяется числом прочитанных страниц, а не «на глаз»); создать **представление** для отчётов без персональных данных и **две роли с минимальными правами**; написать **шесть аналитических запросов** (оконные функции, CTE, `HAVING`, анти-соединение) и получить результаты, совпадающие с эталоном на 60 000 заказов. Проект про инженерную последовательность: ограничения → данные → индексы → права → отчёты — и про то, что каждое решение подтверждается измерением.",
  scenario: [
    p("Небольшой интернет-магазин переезжает на PostgreSQL. Прежняя система хранила всё в таблицах без ограничений: в базе нашлись заказы несуществующих клиентов, оплаты нулевой суммы и дубли e-mail. Отчёты строились вручную и читали всю таблицу заказов целиком, а аналитику выдали пароль владельца базы — вместе с адресами клиентов. Вам нужно создать новую базу и подготовить отчёты."),
    p("Вы пишете два файла: `schema.sql` (таблицы, ограничения, индексы, представление, роли) и `reports.sql` (шесть запросов). Файл `seed.sql` загружается **после** вашей схемы и наполняет её: 10 000 клиентов, 300 товаров, 60 000 заказов, 120 000 позиций и 38 000 оплат. Проверка `check.mjs` создаёт временную базу, загружает оба файла, выполняет `ANALYZE` и проверяет **56 фактов**: структуру, ограничения, индексы, представление, роли и результаты отчётов."),
    code("sql", `-- Данные итогового проекта: 10 000 клиентов, 300 товаров, 60 000 заказов (по 2 позиции), оплаты. Выполняется после вашей schema.sql
INSERT INTO customers (id, name, email, city, signed_up)
SELECT g, 'Клиент ' || g, 'c' || g || '@example.com', (ARRAY['Москва','Казань','Самара','Тула','Омск'])[1 + g % 5], DATE '2022-01-01' + (g % 900)
FROM generate_series(1, 10000) AS g;

INSERT INTO products (id, title, category, price)
SELECT g, 'Товар ' || g, (ARRAY['напитки','посуда','продукты','техника'])[1 + g % 4], (50 + (g * 37) % 4950)::numeric(8,2)
FROM generate_series(1, 300) AS g;

INSERT INTO orders (id, customer_id, ordered_on, status)
SELECT g, 1 + (g * 7919) % 10000, DATE '2023-01-01' + (g % 730),
       (ARRAY['paid','paid','paid','paid','paid','paid','paid','paid','paid','paid','paid','paid','shipped','shipped','shipped','shipped','shipped','new','new','cancelled'])[1 + g % 20]
FROM generate_series(1, 60000) AS g;

-- две разные позиции в каждом заказе; товары с номерами выше 280 никогда не продаются
INSERT INTO order_items (order_id, product_id, qty)
SELECT g, 1 + (g * 13) % 280, 1 + g % 5 FROM generate_series(1, 60000) AS g
UNION ALL
SELECT g, 1 + ((g * 13) + 1 + (g % 270)) % 280, 1 + (g / 7) % 4 FROM generate_series(1, 60000) AS g;

-- оплаты: каждый третий не отменённый заказ оплачен полностью, каждый третий (со сдвигом 1) — наполовину
INSERT INTO payments (id, order_id, amount, method)
SELECT row_number() OVER (ORDER BY o.id), o.id,
       round(t.total * CASE WHEN o.id % 3 = 0 THEN 1 ELSE 0.5 END, 2),
       (ARRAY['card','cash','transfer'])[1 + o.id % 3]
FROM orders AS o
JOIN (SELECT oi.order_id, sum(oi.qty * p.price) AS total FROM order_items AS oi JOIN products AS p ON p.id = oi.product_id GROUP BY oi.order_id) AS t ON t.order_id = o.id
WHERE o.status <> 'cancelled' AND o.id % 3 IN (0, 1);`, { filename: "seed.sql", collapsed: true }),
    code("sql", `-- Итоговый проект «Магазин»: схема. Допишите ограничения, индексы, представление sales_report и роли.
-- Ниже — таблицы с нужными столбцами, но без ограничений: seed.sql загрузится, остальное проверит check.mjs.

CREATE TABLE customers (
  id        integer PRIMARY KEY,
  name      text,
  email     text,
  city      text,
  signed_up date
);

CREATE TABLE products (
  id       integer PRIMARY KEY,
  title    text,
  category text,
  price    numeric(8,2)
);

CREATE TABLE orders (
  id          integer PRIMARY KEY,
  customer_id integer,
  ordered_on  date,
  status      text
);

CREATE TABLE order_items (
  order_id   integer,
  product_id integer,
  qty        integer
);

CREATE TABLE payments (
  id       integer PRIMARY KEY,
  order_id integer,
  amount   numeric(10,2),
  method   text
);

-- TODO: значения по умолчанию, NOT NULL, UNIQUE, CHECK, внешние ключи с ON DELETE
-- TODO: составной первичный ключ order_items (order_id, product_id)
-- TODO: индексы на внешние ключи и для запросов приложения
-- TODO: представление sales_report(order_id, ordered_on, city, status, total)
-- TODO: роли shop_app и shop_analyst и права на объекты`, { filename: "starter/schema.sql" }),
    code("sql", `-- Отчёты итогового проекта «Магазин». Под каждым заголовком «-- qNN» — один запрос (без точки с запятой в середине).
-- Данные: customers, products, orders (статусы new, paid, shipped, cancelled), order_items (qty), payments. «Выручка» — сумма qty × price.

-- q01 Выручка по месяцам без отменённых заказов и нарастающий итог: месяц «ГГГГ-ММ», выручка, нарастающий итог; по месяцу
-- TODO

-- q02 Три лучших клиента каждого города по выручке (без отменённых заказов; при равенстве — меньший идентификатор): город, идентификатор клиента, выручка, место; по городу и месту
-- TODO

-- q03 Долги по городам: число не отменённых заказов, где сумма заказа больше оплаченной, и суммарный долг; по городу
-- TODO

-- q04 Сколько товаров ни разу не продавалось (ни в одном заказе): одно число
-- TODO

-- q05 Десять клиентов с самой высокой средней суммой заказа среди тех, у кого в 2024 году не меньше трёх не отменённых заказов и средняя сумма выше средней по всем таким заказам: идентификатор клиента, средняя сумма (до копеек); по убыванию средней, затем по идентификатору
-- TODO

-- q06 Доля каждой категории в выручке (без отменённых заказов), в процентах с одним знаком после запятой: категория, выручка, доля; по категории
-- TODO`, { filename: "starter/reports.sql" }),
    table(
      ["Таблица", "Столбцы и правила"],
      [
        ["`customers`", "`id` — первичный ключ; `name` и `email` обязательны, `email` уникален; `city` может быть пустым; `signed_up` обязателен, по умолчанию — текущая дата"],
        ["`products`", "`id`; `title`, `category` обязательны; `price` — `numeric(8,2)`, обязательна и не меньше нуля"],
        ["`orders`", "`id`; `customer_id` обязателен, ссылается на `customers`, удалить клиента с заказами нельзя (`RESTRICT`); `ordered_on` — по умолчанию текущая дата; `status` — только `new`, `paid`, `shipped`, `cancelled`, по умолчанию `new`"],
        ["`order_items`", "Составной первичный ключ `(order_id, product_id)`; `qty` больше нуля; заказ удаляется вместе с позициями (`CASCADE`); товар — внешний ключ"],
        ["`payments`", "`id`; `order_id` — внешний ключ с `RESTRICT`; `amount` — `numeric(10,2)`, больше нуля; `method` — только `card`, `cash`, `transfer`"],
        ["`sales_report`", "Представление: `order_id`, `ordered_on`, `city`, `status`, `total` (сумма `qty × price`) — без имени, e-mail и других персональных данных"],
        ["`shop_app`, `shop_analyst`", "Роли без входа и без административных привилегий. Приложение читает все таблицы, создаёт и меняет заказы, позиции, оплаты (`SELECT`, `INSERT`, `UPDATE`), но не удаляет их, не меняет клиентов и товары и не меняет схему. Аналитик читает **только** представление"],
      ],
      "Контракт схемы",
    ),
    tip("Идентификаторы — обычные `integer` без последовательностей: `seed.sql` задаёт их явно, а проверка вставляет строки с собственными номерами. Все столбцы и названия — строго как в контракте."),
  ],
  requirements: [
    "`schema.sql` загружается без ошибок, после него без ошибок загружается `seed.sql`.",
    "Во всех пяти таблицах есть первичный ключ; четыре внешних ключа (`orders.customer_id`, `order_items.order_id`, `order_items.product_id`, `payments.order_id`) объявлены в схеме, на каждом из них есть индекс, начинающийся с этого столбца.",
    "Ограничения срабатывают с нужным кодом ошибки: `23505` (дубль e-mail, дубль товара в заказе), `23502` (клиент без имени), `23514` (отрицательная цена, неизвестный статус, количество 0, оплата 0, неизвестный способ оплаты), `23503` (заказ несуществующего клиента, позиция несуществующего товара, удаление клиента с заказами, удаление заказа с оплатами).",
    "Удаление заказа без оплат каскадно удаляет его позиции; значения по умолчанию (`signed_up`, `ordered_on` — сегодня, `status` — `new`) работают.",
    "Четыре запроса приложения читают мало страниц: заказы клиента — не более 30 (план без индекса читает 378), заказы за день — не более 200, оплаты заказа — не более 12 (без индекса 243), двадцать последних заказов — не более 60.",
    "Представление `sales_report` содержит ровно пять столбцов и 60 000 строк с общей суммой 796 081 996.",
    "Роли `shop_app` и `shop_analyst` созданы без привилегий администратора и работают строго по контракту: нужные операции проходят, лишние дают `42501` (`permission denied`).",
    "Шесть запросов в `reports.sql` (`-- q01` … `-- q06`) возвращают результаты, совпадающие с эталоном; q01, q02 используют оконные функции, q05 — `HAVING`.",
  ],
  constraints: [
    "Только PostgreSQL 16 и стандартные возможности: без расширений, триггеров, функций и `SECURITY DEFINER`.",
    "Названия таблиц, столбцов, ограничений по смыслу, представления и ролей — как в контракте; идентификаторы — `integer`, не `serial` и не `identity`.",
    "`seed.sql` менять нельзя: схема должна принимать данные такими, какие они есть.",
    "Каждый отчёт — **один** запрос (допустим `WITH`); временные таблицы и промежуточные представления не используются.",
    "Индексы нужны только те, что оправданы запросами; лишние замедляют запись, и это нужно уметь объяснить.",
  ],
  expected: [
    "`node check.mjs schema.sql reports.sql` печатает `Пройдено проверок: 56 из 56`.",
    "Заготовка проходит 7 проверок из 56.",
    "Каждый из восьми «плохих» вариантов проваливает от 1 до 7 проверок, и результат стабилен при повторных запусках.",
    "Эталон читает 8, 84, 3 и 22 страницы буфера в четырёх запросах приложения; проверка допускает заметный запас (30, 200, 12, 60).",
    "Полная проверка в нашем замере заняла около четырёх секунд.",
  ],
  technical: [
    "**Ограничения в схеме, а не в приложении.** `NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY` защищают данные от любого клиента, включая ручной `psql`. Выбор `ON DELETE` — часть бизнес-правила: клиентов и оплаты защищаем (`RESTRICT`), позиции — часть заказа (`CASCADE`).",
    "**Индексы на внешние ключи** PostgreSQL не создаёт сам. Составной первичный ключ `(order_id, product_id)` уже даёт индекс по `order_id`, а для `product_id`, `customer_id` и `payments.order_id` индексы нужно объявить.",
    "**Порядок столбцов в индексе.** Индекс `(ordered_on, id)` обслуживает и равенство по дате, и `ORDER BY ordered_on DESC, id DESC LIMIT 20` (чтение индекса в обратном порядке); индекс `(id, ordered_on)` — нет.",
    "**Представление как граница доступа.** Владелец представления читает таблицы со своими правами, поэтому аналитик, не имеющий доступа к `customers`, видит агрегат через `sales_report`. Права нужно выдавать **на представление**, а не на таблицы.",
    "**Минимум прав.** `GRANT SELECT ON …` перечисляет таблицы явно; не используйте `ALL TABLES`. `shop_app` не владеет таблицами, поэтому `DROP` и другие DDL-команды ему недоступны, а право `DELETE` не выдано — запрет даёт `42501`.",
    "**Выручка и «без отменённых».** Отменённый заказ не приносит выручку: `status <> 'cancelled'` во всех финансовых отчётах. Сумма заказа — `sum(qty * price)`, а не `sum(price)`.",
    "**Тай-брейки.** В q02 у нескольких клиентов совпадает выручка; для детерминированного результата в `ORDER BY` окна добавляется идентификатор.",
    "**Анти-соединение (q04).** Товары, которых нет в позициях, ищет `LEFT JOIN … WHERE oi.order_id IS NULL` или `NOT EXISTS`; `NOT IN` опасен при `NULL`.",
    "**Проверяйте план.** `EXPLAIN (ANALYZE, BUFFERS)` показывает фактическое число страниц; именно оно сравнивается с порогами.",
  ],
  acceptance: [
    "`node check.mjs schema.sql reports.sql` — 56 из 56.",
    "Заготовка проходит 7 из 56; каждый из восьми плохих вариантов проваливает хотя бы одну проверку.",
    "В схеме нет `GRANT ALL`, прав на таблицы для `shop_analyst`, лишних индексов и столбцов, которых нет в контракте.",
    "Для каждого индекса вы можете назвать запрос, который он ускоряет, и показать число страниц в `EXPLAIN (ANALYZE, BUFFERS)` до и после.",
    "Для каждой роли вы можете перечислить, что она может и чего не может, и показать `42501` на запрещённой операции.",
  ],
  hints: [
    "Начните со схемы: сначала только таблицы и ограничения, загрузите `seed.sql` и убедитесь, что он проходит. Индексы и права добавляйте после — так проще найти причину ошибки.",
    "`seed.sql` вставляет в `order_items` по две позиции на заказ, поэтому составной первичный ключ `(order_id, product_id)` не мешает; а вот без него вы пропустите проверку «повтор товара в одном заказе».",
    "Проверка «заказы клиента читают не более 30 страниц» не пройдёт, пока нет индекса на `orders.customer_id`. Посмотрите `EXPLAIN (ANALYZE, BUFFERS)` до индекса: `Seq Scan`, 378 страниц.",
    "Индекс по дате: чтобы план читал мало страниц и для `ordered_on = …`, и для `ORDER BY ordered_on DESC, id DESC LIMIT 20`, поставьте `ordered_on` первым, `id` вторым.",
    "Роль аналитика: если `SELECT * FROM customers` не вернул `42501`, проверьте, не выдали ли вы права на таблицы или `PUBLIC`. Проверить можно командой `SET ROLE shop_analyst`.",
    "q02: при равной выручке в `ORDER BY` окна нужен идентификатор клиента; в данных есть клиенты с одинаковой выручкой, поэтому без тай-брейка места могут разойтись с эталоном.",
    "q03: заказ без оплат тоже в долгу — внешнее соединение с агрегатом оплат и `COALESCE(paid, 0)`; внутреннее соединение потеряет именно их.",
    "q05: «средняя выше средней по всем таким заказам» — подзапрос на агрегате в `HAVING`; не забудьте фильтр по году и по статусу внутри CTE.",
    "q06: сумму всех категорий можно получить оконной функцией поверх агрегата: `sum(sum(...)) OVER ()`.",
  ],
  advanced: [
    "Покажите в `EXPLAIN (ANALYZE, BUFFERS)`, что q01 читает таблицы целиком (в эталоне 1030 страниц: `orders` — 378, `order_items` — 649, `products` — 3), и объясните, почему индекс здесь не поможет: нужны почти все строки.",
    "Добавьте частичный индекс для неоплаченных заказов и сравните число страниц; решите, окупается ли он при 38 000 оплат из 57 000 неотменённых заказов.",
    "Реализуйте q01 для **последних 12 месяцев** и добавьте индекс, который помогает такой выборке; измерьте число страниц.",
    "Напишите миграцию, добавляющую `orders.shipped_on date` без блокировки таблицы, и опишите порядок шагов для уже работающей базы (по теме «Миграции и безопасный DDL»).",
    "Добавьте роль `shop_support`, видящую имя и город клиента, но не e-mail: через представление или права на столбцы — сравните оба подхода.",
    "Включите `pg_stat_statements` на тестовой базе, выполните отчёты и найдите самый дорогой запрос по суммарному времени.",
  ],
  failureModes: [
    "**Нет индексов вообще:** три индекса на внешние ключи отсутствуют, а четыре запроса приложения читают всю таблицу — 378, 378, 243 и 378 страниц (7 проверок из 56 красные).",
    "**Индекс по дате в неверном порядке столбцов** (`(id, ordered_on)` вместо `(ordered_on, id)`): запросы за день и последние заказы читают 378 страниц; индексы на внешние ключи при этом на месте (2 проверки красные).",
    "**Нет `CHECK`-ограничений:** отрицательная цена, неизвестный статус, количество 0, нулевая оплата и неверный способ оплаты принимаются молча (5 красных).",
    "**Каскадное удаление клиентов и оплат** (`ON DELETE CASCADE` там, где нужен `RESTRICT`): удаление клиента тихо уничтожает его заказы и платежи (2 красные).",
    "**Слишком широкие права** (`GRANT ALL` приложению, чтение таблиц аналитику): приложение может удалять заказы и менять клиентов, аналитик читает персональные данные (4 красные).",
    "**Представление раскрывает e-mail:** лишний столбец в `sales_report` нарушает контракт и выдаёт персональные данные аналитику (1 красная).",
    "**Нет уникальности, `NOT NULL`, значений по умолчанию и составного ключа:** дубли e-mail и товаров в заказе, клиенты без имени, нет умолчаний (6 красных).",
    "**Типичные ошибки в отчётах:** q01 учитывает отменённые заказы, q03 теряет неоплаченные заказы (внутреннее соединение), q06 округляет проценты до целых (3 красные).",
  ],
  rubric: [
    { criterion: "Схема и ограничения", weight: 25, description: "Первичные и внешние ключи, `NOT NULL`, `UNIQUE`, `CHECK`, значения по умолчанию, осмысленные `ON DELETE`; данные защищены самой базой." },
    { criterion: "Индексы и планы", weight: 20, description: "Индексы на внешние ключи, правильный порядок столбцов, подтверждение измерением (`EXPLAIN (ANALYZE, BUFFERS)`), отсутствие лишних индексов." },
    { criterion: "Безопасность и права", weight: 15, description: "Роли с минимальными правами, представление без персональных данных, `42501` на запрещённых операциях, отсутствие `GRANT ALL`." },
    { criterion: "Аналитические запросы", weight: 30, description: "Корректные результаты шести отчётов, оконные функции, CTE, `HAVING`, внешние соединения без потери строк, тай-брейки." },
    { criterion: "Читаемость и обоснование", weight: 10, description: "Структура файлов, комментарии, понятные алиасы, обоснование выбора индексов и прав." },
  ],
  solution: [
    p("Эталон — два файла: `schema.sql` (около 60 строк) и `reports.sql` (шесть запросов). Они проходят все 56 проверок; заготовка проходит 7, а каждый из восьми намеренно испорченных вариантов проваливает от 1 до 7 проверок. Ниже — решение, проверяющий скрипт и результаты запусков на PostgreSQL 16.14."),
    h("schema.sql"),
    code("sql", `-- Итоговый проект «Магазин»: схема, индексы, представление для отчётов и роли

CREATE TABLE customers (
  id        integer PRIMARY KEY,
  name      text    NOT NULL,
  email     text    NOT NULL UNIQUE,
  city      text,
  signed_up date    NOT NULL DEFAULT current_date
);

CREATE TABLE products (
  id       integer PRIMARY KEY,
  title    text    NOT NULL,
  category text    NOT NULL,
  price    numeric(8,2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE orders (
  id          integer PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  ordered_on  date    NOT NULL DEFAULT current_date,
  status      text    NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'paid', 'shipped', 'cancelled'))
);

CREATE TABLE order_items (
  order_id   integer NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES products (id),
  qty        integer NOT NULL CHECK (qty > 0),
  PRIMARY KEY (order_id, product_id)
);

CREATE TABLE payments (
  id       integer PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  amount   numeric(10,2) NOT NULL CHECK (amount > 0),
  method   text    NOT NULL CHECK (method IN ('card', 'cash', 'transfer'))
);

-- Индексы: внешние ключи и запросы приложения
CREATE INDEX orders_customer_idx     ON orders (customer_id);
CREATE INDEX orders_date_id_idx      ON orders (ordered_on, id);
CREATE INDEX order_items_product_idx ON order_items (product_id);
CREATE INDEX payments_order_idx      ON payments (order_id);

-- Представление для отчётов: сумма каждого заказа без персональных данных
CREATE VIEW sales_report AS
SELECT o.id AS order_id, o.ordered_on, c.city, o.status, sum(oi.qty * p.price) AS total
FROM orders AS o
JOIN customers   AS c  ON c.id = o.customer_id
JOIN order_items AS oi ON oi.order_id = o.id
JOIN products    AS p  ON p.id = oi.product_id
GROUP BY o.id, o.ordered_on, c.city, o.status;

-- Роли: приложение работает с заказами, аналитик видит только представление
CREATE ROLE shop_app NOLOGIN;
CREATE ROLE shop_analyst NOLOGIN;
GRANT SELECT ON customers, products TO shop_app;
GRANT SELECT, INSERT, UPDATE ON orders, order_items, payments TO shop_app;
GRANT SELECT ON sales_report TO shop_analyst;`, { filename: "schema.sql", lineNumbers: true }),
    h("reports.sql"),
    code("sql", `-- Отчёты итогового проекта «Магазин»: шесть запросов

-- q01 Выручка по месяцам без отменённых заказов и нарастающий итог: месяц «ГГГГ-ММ», выручка, нарастающий итог; по месяцу
WITH monthly AS (
  SELECT substr(CAST(o.ordered_on AS text), 1, 7) AS month, sum(oi.qty * p.price) AS revenue
  FROM orders AS o
  JOIN order_items AS oi ON oi.order_id = o.id
  JOIN products AS p ON p.id = oi.product_id
  WHERE o.status <> 'cancelled'
  GROUP BY substr(CAST(o.ordered_on AS text), 1, 7)
)
SELECT month, revenue, sum(revenue) OVER (ORDER BY month) AS running_total
FROM monthly
ORDER BY month;

-- q02 Три лучших клиента каждого города по выручке (без отменённых заказов; при равенстве — меньший идентификатор): город, идентификатор клиента, выручка, место; по городу и месту
WITH revenue AS (
  SELECT c.city, c.id AS customer_id, sum(oi.qty * p.price) AS revenue
  FROM customers AS c
  JOIN orders AS o ON o.customer_id = c.id AND o.status <> 'cancelled'
  JOIN order_items AS oi ON oi.order_id = o.id
  JOIN products AS p ON p.id = oi.product_id
  GROUP BY c.city, c.id
), ranked AS (
  SELECT city, customer_id, revenue, row_number() OVER (PARTITION BY city ORDER BY revenue DESC, customer_id) AS place
  FROM revenue
)
SELECT city, customer_id, revenue, place
FROM ranked
WHERE place <= 3
ORDER BY city, place;

-- q03 Долги по городам: число не отменённых заказов, где сумма заказа больше оплаченной, и суммарный долг; по городу
SELECT t.city, count(*) AS orders_with_debt, sum(t.total - COALESCE(pay.paid, 0)) AS total_debt
FROM (SELECT o.id, c.city, sum(oi.qty * p.price) AS total
      FROM orders AS o
      JOIN customers AS c ON c.id = o.customer_id
      JOIN order_items AS oi ON oi.order_id = o.id
      JOIN products AS p ON p.id = oi.product_id
      WHERE o.status <> 'cancelled'
      GROUP BY o.id, c.city) AS t
LEFT JOIN (SELECT order_id, sum(amount) AS paid FROM payments GROUP BY order_id) AS pay ON pay.order_id = t.id
WHERE t.total > COALESCE(pay.paid, 0)
GROUP BY t.city
ORDER BY t.city;

-- q04 Сколько товаров ни разу не продавалось (ни в одном заказе): одно число
SELECT count(*) AS never_sold
FROM products AS p
LEFT JOIN order_items AS oi ON oi.product_id = p.id
WHERE oi.order_id IS NULL;

-- q05 Десять клиентов с самой высокой средней суммой заказа среди тех, у кого в 2024 году не меньше трёх не отменённых заказов и средняя сумма выше средней по всем таким заказам: идентификатор клиента, средняя сумма (до копеек); по убыванию средней, затем по идентификатору
WITH totals AS (
  SELECT o.customer_id, o.id, sum(oi.qty * p.price) AS total
  FROM orders AS o
  JOIN order_items AS oi ON oi.order_id = o.id
  JOIN products AS p ON p.id = oi.product_id
  WHERE o.status <> 'cancelled' AND o.ordered_on >= '2024-01-01' AND o.ordered_on < '2025-01-01'
  GROUP BY o.customer_id, o.id
)
SELECT customer_id, round(avg(total), 2) AS avg_total
FROM totals
GROUP BY customer_id
HAVING count(*) >= 3 AND avg(total) > (SELECT avg(total) FROM totals)
ORDER BY avg(total) DESC, customer_id
LIMIT 10;

-- q06 Доля каждой категории в выручке (без отменённых заказов), в процентах с одним знаком после запятой: категория, выручка, доля; по категории
SELECT p.category, sum(oi.qty * p.price) AS revenue,
       round(100.0 * sum(oi.qty * p.price) / sum(sum(oi.qty * p.price)) OVER (), 1) AS share
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
JOIN products AS p ON p.id = oi.product_id
WHERE o.status <> 'cancelled'
GROUP BY p.category
ORDER BY p.category;`, { filename: "reports.sql", lineNumbers: true }),
    ul(
      "**Схема защищает данные:** `CHECK` для цен, статусов, количества, сумм и способов оплаты; `RESTRICT` не даёт удалить клиента с заказами и заказ с оплатами; `CASCADE` убирает позиции вместе с заказом.",
      "**Индексы:** `orders_customer_idx` (заказы клиента, 8 страниц вместо 378), `orders_date_id_idx` (заказы за день — 84 страницы, последние двадцать — 22), `payments_order_idx` (3 страницы вместо 243), `order_items_product_idx` (внешний ключ на товар).",
      "**Представление и роли:** `sales_report` агрегирует заказ без персональных данных; `shop_analyst` получает право только на него, `shop_app` — `SELECT`/`INSERT`/`UPDATE` на пять таблиц без `DELETE`, без прав на изменение справочников и без прав владельца.",
      "**Отчёты:** q01 — CTE по месяцам и нарастающий итог `sum() OVER (ORDER BY month)`; q02 — `row_number()` с тай-брейком по `customer_id`; q03 — агрегат оплат и `LEFT JOIN` с `COALESCE`; q04 — анти-соединение; q05 — `HAVING` со скалярным подзапросом; q06 — `sum(sum(...)) OVER ()`.",
    ),
    h("check.mjs"),
    code("js", `// check.mjs — проверка итогового проекта «Магазин». Запуск: node check.mjs schema.sql reports.sql
// Нужны PostgreSQL 16, \`psql\` в PATH и пакет pg (npm i pg); подключение — PGHOST, PGPORT, PGUSER, PGPASSWORD.
// Пользователь должен уметь создавать базы и роли (CREATEDB, CREATEROLE): проверка создаёт временную базу, загружает в неё
// ваш schema.sql, затем seed.sql (10 000 клиентов, 300 товаров, 60 000 заказов), выполняет ANALYZE и проверяет структуру,
// ограничения, индексы (по числу прочитанных страниц буфера), роли и шесть отчётов из reports.sql.
// Роли shop_app и shop_analyst — общие для всего сервера: до и после проверки они удаляются.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import pg from "pg";

const [schemaFile, reportsFile] = process.argv.slice(2);
if (!schemaFile || !reportsFile) { console.error("usage: node check.mjs schema.sql reports.sql"); process.exit(2); }

// Эталон отчётов (число столбцов и строки; числа сравниваются как числа, даты — как текст) и итог по представлению
const EXPECTED = {
  q01: {"cols":3,"rows":[["2023-01",31338057,31338057],["2023-02",29382258,60720315],["2023-03",31603675,92323990],["2023-04",30874057,123198047],["2023-05",31406783,154604830],["2023-06",30272670,184877500],["2023-07",31379564,216257064],["2023-08",31591266,247848330],["2023-09",30503208,278351538],["2023-10",31664118,310015656],["2023-11",30310858,340326514],["2023-12",32018924,372345438],["2024-01",31148768,403494206],["2024-02",29778518,433272724],["2024-03",31092188,464364912],["2024-04",30371258,494736170],["2024-05",31374272,526110442],["2024-06",30539872,556650314],["2024-07",31568714,588219028],["2024-08",31537842,619756870],["2024-09",30444570,650201440],["2024-10",31208384,681409824],["2024-11",30439024,711848848],["2024-12",30424216,742273064]]},
  q02: {"cols":4,"rows":[["Казань",4956,72146,1],["Казань",7316,72146,2],["Казань",9511,71900,3],["Москва",7310,90970,1],["Москва",8650,90970,2],["Москва",1130,90280,3],["Омск",594,114762,1],["Омск",6474,114482,2],["Омск",3554,108932,3],["Самара",5237,140008,1],["Самара",3797,136628,2],["Самара",6157,136628,3],["Тула",2668,122278,1],["Тула",5028,122278,2],["Тула",188,121358,3]]},
  q03: {"cols":3,"rows":[["Казань",8000,51609811],["Москва",8000,65345593],["Омск",8000,80609320],["Самара",6000,80703174],["Тула",8000,92799170]]},
  q04: {"cols":1,"rows":[[20]]},
  q05: {"cols":2,"rows":[[7287,28583],[5327,27701],[1707,27599.67],[3797,27476.33],[5237,27386.33],[2517,27292.33],[5757,27259],[692,26942.67],[5532,26882.67],[1972,26680]]},
  q06: {"cols":3,"rows":[["напитки",244620878,33],["посуда",110714240,14.9],["продукты",277308696,37.4],["техника",109629250,14.8]]},
};
const SALES = {"rows":60000,"total":796081996};
// Предельное число прочитанных страниц (shared hit + read) в плане запроса после ANALYZE. Для сравнения: полное чтение
// таблицы orders — 378 страниц, payments — 243. Эталонное решение читает 8, 84, 3 и 22 страницы.
const BUDGET = { customer: 30, day: 200, payment: 12, latest: 60 };
// Требования к тексту отчётов: [номер, регулярное выражение, описание]
const RULES = [
  ["q01", /\\bOVER\\b/i, "нарастающий итог считается оконной функцией"],
  ["q02", /\\bOVER\\b/i, "места в городе считаются оконной функцией"],
  ["q05", /\\bHAVING\\b/i, "условие на группу записано через HAVING"],
];

pg.types.setTypeParser(1082, (v) => v);                         // date → строка «ГГГГ-ММ-ДД»
const norm = (v) => (typeof v === "string" && /^-?\\d+(\\.\\d+)?$/.test(v) ? Number(v) : v);

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });

const answers = {};
let current = null;
for (const line of readFileSync(reportsFile, "utf8").split("\\n")) {
  const m = line.match(/^--\\s*(q\\d\\d)\\b/i);
  if (m) { current = m[1].toLowerCase(); answers[current] = ""; continue; }
  if (current && !/^\\s*--/.test(line)) answers[current] += line + "\\n";
}
const sql = (id) => (answers[id] ?? "").trim();

const admin = new pg.Client({ database: "postgres" });
await admin.connect();
const dropRoles = async () => { for (const r of ["shop_app", "shop_analyst"]) await admin.query(\`DROP ROLE IF EXISTS \${r}\`); };
await dropRoles();
const dbName = "chk_" + Math.random().toString(36).slice(2, 10);
await admin.query(\`CREATE DATABASE \${dbName}\`);
const psql = (file) => execFileSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-d", dbName, "-f", file], { stdio: ["ignore", "ignore", "pipe"] });

try {
  let loaded = true;
  try { psql(schemaFile); } catch (e) { loaded = false; check("schema.sql загружается без ошибок", false, String(e.stderr).split("\\n")[0]); }
  if (loaded) check("schema.sql загружается без ошибок", true);
  try { psql("seed.sql"); check("seed.sql загружается в вашу схему без ошибок", true); }
  catch (e) { check("seed.sql загружается в вашу схему без ошибок", false, String(e.stderr).split("\\n")[0]); }

  const c = new pg.Client({ database: dbName });
  await c.connect();
  await c.query("ANALYZE");
  await c.query("SET max_parallel_workers_per_gather = 0");
  const q = async (text, params) => { try { return (await c.query(text, params)).rows; } catch { return []; } };
  // Выполняет команды в транзакции (при необходимости от имени роли), возвращает код ошибки и строки последней команды; затем откатывает
  const attempt = async (stmts, role) => {
    let code = null, rows = [];
    await c.query("BEGIN");
    try {
      if (role) await c.query(\`SET LOCAL ROLE \${role}\`);
      for (const s of [].concat(stmts)) rows = (await c.query(s)).rows;
    } catch (e) { code = e.code ?? "ERR"; }
    await c.query("ROLLBACK");
    return { code, rows };
  };
  const rejects = async (name, stmts, want, role) => { const r = await attempt(stmts, role); check(name, r.code === want, \`код ошибки: \${r.code ?? "ошибки нет"}, ожидался \${want}\`); };
  const allowed = async (name, stmts, role) => { const r = await attempt(stmts, role); check(name, r.code === null, \`код ошибки: \${r.code}\`); };

  // 1. Структура
  const tables = ["customers", "products", "orders", "order_items", "payments"];
  for (const t of tables)
    check(\`таблица \${t} существует и имеет первичный ключ\`,
      (await q("SELECT 1 FROM pg_constraint WHERE conrelid = to_regclass($1) AND contype = 'p'", [t])).length === 1);
  const fk = [["orders", "customer_id", "customers"], ["order_items", "order_id", "orders"], ["order_items", "product_id", "products"], ["payments", "order_id", "orders"]];
  for (const [t, col, parent] of fk) {
    const has = (await q(\`SELECT 1 FROM pg_constraint k JOIN pg_attribute a ON a.attrelid = k.conrelid AND a.attnum = k.conkey[1]
                          WHERE k.contype = 'f' AND k.conrelid = to_regclass($1) AND k.confrelid = to_regclass($2) AND a.attname = $3\`, [t, parent, col])).length === 1;
    check(\`внешний ключ \${t}.\${col} → \${parent}\`, has);
    const idx = (await q(\`SELECT 1 FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
                          WHERE i.indrelid = to_regclass($1) AND a.attname = $2\`, [t, col])).length > 0;
    check(\`на столбце \${t}.\${col} внешнего ключа есть индекс\`, idx);
  }

  // 2. Ограничения и значения по умолчанию (во всех вставках, кроме проверки умолчаний, значения заданы явно — каждая проверка касается одного правила)
  const NEW_ORDER = "INSERT INTO orders (id, customer_id, ordered_on, status) VALUES (100001, 1, DATE '2024-01-01', 'new')";
  await rejects("повторный email клиента отклоняется (23505)", "INSERT INTO customers (id, name, email, signed_up) VALUES (20001, 'Тест', 'c1@example.com', DATE '2024-01-01')", "23505");
  await rejects("клиент без имени отклоняется (23502)", "INSERT INTO customers (id, name, email, signed_up) VALUES (20001, NULL, 'new@example.com', DATE '2024-01-01')", "23502");
  await rejects("отрицательная цена отклоняется (23514)", "INSERT INTO products (id, title, category, price) VALUES (301, 'Тест', 'посуда', -1)", "23514");
  await rejects("неизвестный статус заказа отклоняется (23514)", "INSERT INTO orders (id, customer_id, ordered_on, status) VALUES (100001, 1, DATE '2024-01-01', 'lost')", "23514");
  await rejects("заказ несуществующего клиента отклоняется (23503)", "INSERT INTO orders (id, customer_id, ordered_on, status) VALUES (100001, 999999, DATE '2024-01-01', 'new')", "23503");
  await rejects("количество 0 в позиции отклоняется (23514)", [NEW_ORDER, "INSERT INTO order_items (order_id, product_id, qty) VALUES (100001, 1, 0)"], "23514");
  await rejects("повтор товара в одном заказе отклоняется (23505)", [NEW_ORDER, "INSERT INTO order_items (order_id, product_id, qty) VALUES (100001, 1, 1)", "INSERT INTO order_items (order_id, product_id, qty) VALUES (100001, 1, 2)"], "23505");
  await rejects("позиция с несуществующим товаром отклоняется (23503)", [NEW_ORDER, "INSERT INTO order_items (order_id, product_id, qty) VALUES (100001, 999, 1)"], "23503");
  await rejects("оплата нулевой суммы отклоняется (23514)", "INSERT INTO payments (id, order_id, amount, method) VALUES (100001, 1, 0, 'card')", "23514");
  await rejects("неизвестный способ оплаты отклоняется (23514)", "INSERT INTO payments (id, order_id, amount, method) VALUES (100001, 1, 10, 'bitcoin')", "23514");
  await rejects("клиента с заказами нельзя удалить (23503, RESTRICT)", "DELETE FROM customers WHERE id = 1", "23503");
  await rejects("заказ с оплатами нельзя удалить (23503, RESTRICT)", "DELETE FROM orders WHERE id = 3", "23503");
  {
    const r = await attempt(["DELETE FROM orders WHERE id = 2", "SELECT count(*)::int AS n FROM order_items WHERE order_id = 2"]);
    check("при удалении заказа без оплат его позиции удаляются каскадом (2 → 0)", r.code === null && r.rows[0]?.n === 0 && (await q("SELECT count(*)::int AS n FROM order_items WHERE order_id = 2"))[0]?.n === 2, \`код ошибки: \${r.code}, позиций после удаления: \${r.rows[0]?.n}\`);
  }
  {
    const r = await attempt(["INSERT INTO customers (id, name, email) VALUES (20001, 'Тест', 'new@example.com')", "INSERT INTO orders (id, customer_id) VALUES (100001, 20001)",
      "SELECT (SELECT signed_up = current_date FROM customers WHERE id = 20001) AND (SELECT status = 'new' AND ordered_on = current_date FROM orders WHERE id = 100001) AS ok"]);
    check("значения по умолчанию: дата регистрации и дата заказа — сегодня, статус — new", r.rows[0]?.ok === true, \`код ошибки: \${r.code}\`);
  }

  // 3. Представление
  const cols = (await q("SELECT string_agg(column_name, ',' ORDER BY ordinal_position) AS s FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sales_report'"))[0]?.s;
  check("представление sales_report: столбцы order_id, ordered_on, city, status, total (без персональных данных)", cols === "order_id,ordered_on,city,status,total", \`столбцы: \${cols ?? "представления нет"}\`);
  const sr = (await q("SELECT count(*)::int AS n, sum(total) AS s FROM sales_report"))[0];
  check(\`в sales_report \${SALES.rows} заказов с общей суммой \${SALES.total}\`, sr && sr.n === SALES.rows && Number(sr.s) === SALES.total, sr ? \`заказов \${sr.n}, сумма \${sr.s}\` : "представление не читается");

  // 4. Роли
  const roleInfo = await q("SELECT rolname, rolsuper OR rolcreatedb OR rolcreaterole AS powerful FROM pg_roles WHERE rolname IN ('shop_app', 'shop_analyst')");
  check("роли shop_app и shop_analyst созданы и не обладают привилегиями администратора", roleInfo.length === 2 && roleInfo.every((r) => r.powerful === false));
  await allowed("shop_app читает все пять таблиц", tables.map((t) => \`SELECT count(*) FROM \${t}\`), "shop_app");
  await allowed("shop_app создаёт заказ, позицию и оплату, меняет статус заказа",
    [NEW_ORDER, "INSERT INTO order_items (order_id, product_id, qty) VALUES (100001, 1, 1)",
     "INSERT INTO payments (id, order_id, amount, method) VALUES (100001, 100001, 10, 'card')", "UPDATE orders SET status = 'paid' WHERE id = 100001"], "shop_app");
  await rejects("shop_app не может удалять заказы (42501)", "DELETE FROM orders WHERE id = 2", "42501", "shop_app");
  await rejects("shop_app не может изменять клиентов (42501)", "UPDATE customers SET city = 'Омск' WHERE id = 1", "42501", "shop_app");
  await rejects("shop_app не может создавать таблицы (42501)", "CREATE TABLE intruder (id integer)", "42501", "shop_app");
  await rejects("shop_app не может удалять таблицы (42501)", "DROP TABLE payments", "42501", "shop_app");
  await allowed("shop_analyst читает представление sales_report", "SELECT count(*) FROM sales_report", "shop_analyst");
  await rejects("shop_analyst не читает таблицу customers (42501)", "SELECT * FROM customers", "42501", "shop_analyst");
  await rejects("shop_analyst не читает таблицу orders (42501)", "SELECT * FROM orders", "42501", "shop_analyst");
  await rejects("shop_analyst не может ничего записывать (42501)", NEW_ORDER, "42501", "shop_analyst");

  // 5. Индексы: число прочитанных страниц буфера (запрос выполняется дважды: после прогрева учитываются только обращения к буферам)
  const pages = async (text) => {
    try { await c.query(text); const p = (await c.query("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + text)).rows[0]["QUERY PLAN"][0].Plan; return p["Shared Hit Blocks"] + p["Shared Read Blocks"]; }
    catch { return null; }
  };
  const perf = [
    ["заказы клиента (WHERE customer_id = …)", "SELECT * FROM orders WHERE customer_id = 4242", BUDGET.customer],
    ["заказы за день (WHERE ordered_on = …)", "SELECT * FROM orders WHERE ordered_on = DATE '2024-03-15'", BUDGET.day],
    ["оплаты заказа (WHERE order_id = …)", "SELECT * FROM payments WHERE order_id = 12345", BUDGET.payment],
    ["двадцать последних заказов (ORDER BY ordered_on DESC, id DESC LIMIT 20)", "SELECT * FROM orders ORDER BY ordered_on DESC, id DESC LIMIT 20", BUDGET.latest],
  ];
  for (const [what, text, limit] of perf) {
    const n = await pages(text);
    check(\`\${what} читает не более \${limit} страниц\`, n !== null && n <= limit, n === null ? "запрос не выполнился" : \`прочитано страниц: \${n}\`);
  }

  // 6. Отчёты
  check(\`reports.sql содержит все \${Object.keys(EXPECTED).length} ответов (q01…)\`, Object.keys(EXPECTED).every((id) => id in answers), \`найдены: \${Object.keys(answers).join(", ") || "ни одного"}\`);
  for (const [id, want] of Object.entries(EXPECTED)) {
    const text = sql(id).replace(/;\\s*$/, "");
    if (!text || /TODO/.test(text)) { check(\`\${id}: запрос написан\`, false, "нет запроса"); continue; }
    let res;
    try { res = await c.query({ text, rowMode: "array" }); }
    catch (e) { check(\`\${id}: запрос выполняется\`, false, e.message.split("\\n")[0]); continue; }
    if (Array.isArray(res)) { check(\`\${id}: один запрос на вопрос\`, false, \`команд: \${res.length}\`); continue; }
    const rows = res.rows.map((r) => r.map(norm));
    const same = res.fields.length === want.cols && JSON.stringify(rows) === JSON.stringify(want.rows);
    check(\`\${id}: результат совпадает с эталоном\`, same,
      res.fields.length !== want.cols ? \`столбцов \${res.fields.length}, ожидалось \${want.cols}\` : \`строк \${rows.length}, ожидалось \${want.rows.length}; первое расхождение: \${JSON.stringify(rows.find((r, i) => JSON.stringify(r) !== JSON.stringify(want.rows[i])) ?? null)}\`);
  }
  for (const [id, re, what] of RULES) check(\`\${id}: \${what}\`, re.test(sql(id)));
  await c.end();
} finally {
  await admin.query(\`DROP DATABASE \${dbName} WITH (FORCE)\`);
  await dropRoles();
  await admin.end();
}

const failed = results.filter((r) => !r.ok);
for (const r of failed) console.log(\`✗ \${r.name} — \${r.detail}\`);
console.log(\`Пройдено проверок: \${results.length - failed.length} из \${results.length}\`);
if (failed.length) console.log(\`Не прошли: \${failed.length}\`);
process.exit(failed.length ? 1 : 0);`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 56 из 56`, { filename: "результат node check.mjs schema.sql reports.sql (решение, PostgreSQL 16.14)" }),
    code("text", `✗ таблица order_items существует и имеет первичный ключ — 
✗ внешний ключ orders.customer_id → customers — 
✗ на столбце orders.customer_id внешнего ключа есть индекс — 
✗ внешний ключ order_items.order_id → orders — 
✗ на столбце order_items.order_id внешнего ключа есть индекс — 
✗ внешний ключ order_items.product_id → products — 
✗ на столбце order_items.product_id внешнего ключа есть индекс — 
✗ внешний ключ payments.order_id → orders — 
✗ на столбце payments.order_id внешнего ключа есть индекс — 
✗ повторный email клиента отклоняется (23505) — код ошибки: ошибки нет, ожидался 23505
✗ клиент без имени отклоняется (23502) — код ошибки: ошибки нет, ожидался 23502
✗ отрицательная цена отклоняется (23514) — код ошибки: ошибки нет, ожидался 23514
✗ неизвестный статус заказа отклоняется (23514) — код ошибки: ошибки нет, ожидался 23514
✗ заказ несуществующего клиента отклоняется (23503) — код ошибки: ошибки нет, ожидался 23503
✗ количество 0 в позиции отклоняется (23514) — код ошибки: ошибки нет, ожидался 23514
✗ повтор товара в одном заказе отклоняется (23505) — код ошибки: ошибки нет, ожидался 23505
✗ позиция с несуществующим товаром отклоняется (23503) — код ошибки: ошибки нет, ожидался 23503
✗ оплата нулевой суммы отклоняется (23514) — код ошибки: ошибки нет, ожидался 23514
✗ неизвестный способ оплаты отклоняется (23514) — код ошибки: ошибки нет, ожидался 23514
✗ клиента с заказами нельзя удалить (23503, RESTRICT) — код ошибки: ошибки нет, ожидался 23503
✗ заказ с оплатами нельзя удалить (23503, RESTRICT) — код ошибки: ошибки нет, ожидался 23503
✗ при удалении заказа без оплат его позиции удаляются каскадом (2 → 0) — код ошибки: null, позиций после удаления: 2
✗ значения по умолчанию: дата регистрации и дата заказа — сегодня, статус — new — код ошибки: null
✗ представление sales_report: столбцы order_id, ordered_on, city, status, total (без персональных данных) — столбцы: представления нет
✗ в sales_report 60000 заказов с общей суммой 796081996 — представление не читается
✗ роли shop_app и shop_analyst созданы и не обладают привилегиями администратора — 
✗ shop_app читает все пять таблиц — код ошибки: 22023
✗ shop_app создаёт заказ, позицию и оплату, меняет статус заказа — код ошибки: 22023
✗ shop_app не может удалять заказы (42501) — код ошибки: 22023, ожидался 42501
✗ shop_app не может изменять клиентов (42501) — код ошибки: 22023, ожидался 42501
✗ shop_app не может создавать таблицы (42501) — код ошибки: 22023, ожидался 42501
✗ shop_app не может удалять таблицы (42501) — код ошибки: 22023, ожидался 42501
✗ shop_analyst читает представление sales_report — код ошибки: 22023
✗ shop_analyst не читает таблицу customers (42501) — код ошибки: 22023, ожидался 42501
✗ shop_analyst не читает таблицу orders (42501) — код ошибки: 22023, ожидался 42501
✗ shop_analyst не может ничего записывать (42501) — код ошибки: 22023, ожидался 42501
✗ заказы клиента (WHERE customer_id = …) читает не более 30 страниц — прочитано страниц: 378
✗ заказы за день (WHERE ordered_on = …) читает не более 200 страниц — прочитано страниц: 378
✗ оплаты заказа (WHERE order_id = …) читает не более 12 страниц — прочитано страниц: 243
✗ двадцать последних заказов (ORDER BY ordered_on DESC, id DESC LIMIT 20) читает не более 60 страниц — прочитано страниц: 378
✗ q01: запрос написан — нет запроса
✗ q02: запрос написан — нет запроса
✗ q03: запрос написан — нет запроса
✗ q04: запрос написан — нет запроса
✗ q05: запрос написан — нет запроса
✗ q06: запрос написан — нет запроса
✗ q01: нарастающий итог считается оконной функцией — 
✗ q02: места в городе считаются оконной функцией — 
✗ q05: условие на группу записано через HAVING — 
Пройдено проверок: 7 из 56
Не прошли: 49`, { filename: "результат для заготовки" }),
    code("text", `b1-no-indexes: Пройдено проверок: 49 из 56
b2-wrong-index-order: Пройдено проверок: 54 из 56
b3-no-checks: Пройдено проверок: 51 из 56
b4-cascade-everywhere: Пройдено проверок: 54 из 56
b5-broad-grants: Пройдено проверок: 52 из 56
b6-view-leaks-email: Пройдено проверок: 55 из 56
b7-loose-keys: Пройдено проверок: 50 из 56
b8-naive-reports: Пройдено проверок: 53 из 56`, { filename: "результат check.mjs для вариантов с ошибками (mutants/)" }),
    tip("Проверка создаёт временную базу и две роли (`shop_app`, `shop_analyst`), которые общие для всего сервера; до и после запуска они удаляются. Нужны `psql` в `PATH`, пакет `pg` (`npm i pg`) и пользователь с правами `CREATEDB` и `CREATEROLE`; подключение — переменные `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`."),
    warn("Пороги страниц — это защита от «индекса нет», а не точное соревнование: число страниц зависит от версии PostgreSQL и размера строк. Для собственных баз сравнивайте планы до и после индекса и ищите порядок величины, а не единицы."),
  ],
};
