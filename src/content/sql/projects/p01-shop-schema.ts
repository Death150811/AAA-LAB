import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p01ShopSchema: Project = {
  id: "sql.p01-shop-schema",
  domain: "sql",
  order: 1,
  title: "Схема магазина с ограничениями",
  subtitle: "Четыре таблицы, ключи, связи и правила удаления: база сама отклоняет некорректные данные — проверка на 37 сценариях в PostgreSQL 16",
  level: "foundation",
  estimatedHours: 6,
  buildsOn: [],
  topics: ["sql.relational-model", "sql.data-types-null", "sql.keys-constraints", "sql.insert-update-delete", "sql.relationships"],
  objective:
    "Написать файл `schema.sql`, который создаёт схему небольшого интернет-магазина так, чтобы **целостность данных защищала сама база**: нельзя завести клиента с чужим e-mail, товар с отрицательной ценой, заказ несуществующего клиента или позицию с нулевым количеством, а удаление заказа не оставляет «осиротевших» позиций. Проект тренирует типы данных, `NOT NULL`, `DEFAULT`, `PRIMARY KEY`, `UNIQUE`, `CHECK`, внешние ключи и правила `ON DELETE`.",
  scenario: [
    p("Кофейня запускает интернет-магазин. Данные пока лежат в таблице-«простыне», в которой встречаются товары по цене −100, заказы на 0 штук и клиенты с одинаковыми e-mail. Вам поручили спроектировать схему так, чтобы такие записи невозможно было сохранить, даже если ошибся разработчик или кто-то правит данные вручную."),
    p("Нужны четыре таблицы: `customers`, `products`, `orders`, `order_items`. Проверка `check.mjs` создаёт временную базу, загружает ваш файл, вставляет начальные данные и проверяет **37 фактов**: структуру (типы, значения по умолчанию, ключи, правила удаления) и поведение (какие команды база обязана отклонить и с каким кодом ошибки)."),
    code("sql", `-- Заготовка проекта «Схема магазина с ограничениями».
-- Опишите четыре таблицы и их ограничения (требования — в описании проекта), затем запустите:  node check.mjs starter.sql
-- Проверяются: структура (типы, значения по умолчанию, ключи, правила удаления) и поведение (какие вставки и изменения база обязана отклонить).

CREATE TABLE customers (
  id integer PRIMARY KEY
  -- TODO: name, email, city, signed_up
);

CREATE TABLE products (
  id integer PRIMARY KEY
  -- TODO: title, category, price
);

CREATE TABLE orders (
  id integer PRIMARY KEY
  -- TODO: customer_id, ordered_on, status
);

CREATE TABLE order_items (
  order_id integer
  -- TODO: product_id, qty, составной первичный ключ
);`, { filename: "starter/schema.sql" }),
    table(
      ["Таблица", "Столбцы и ограничения"],
      [
        ["`customers`", "`id` (первичный ключ), `name` (обязателен), `email` (обязателен, **уникален**), `city` (может быть неизвестен), `signed_up` (дата, обязательна, по умолчанию — сегодня)"],
        ["`products`", "`id`, `title` (обязателен, **уникален**), `category` (обязательна), `price` — `numeric(8,2)`, обязательна, **не меньше 0**"],
        ["`orders`", "`id`, `customer_id` (обязателен, ссылка на клиента, **удалять клиента с заказами нельзя**), `ordered_on` (по умолчанию сегодня), `status` (по умолчанию `new`, допустимы `new`, `paid`, `shipped`, `cancelled`)"],
        ["`order_items`", "`order_id` (ссылка на заказ, при удалении заказа позиции **удаляются**), `product_id` (ссылка на товар, удалять товар из заказов нельзя), `qty` (**больше 0**); один товар встречается в заказе один раз"],
      ],
      "Требования к таблицам",
    ),
  ],
  requirements: [
    "Файл `schema.sql` создаёт ровно четыре таблицы: `customers`, `products`, `orders`, `order_items` — и загружается в пустую базу без ошибок (`psql -v ON_ERROR_STOP=1`).",
    "`customers`: первичный ключ `id`; `name` и `email` обязательны; `email` уникален; `city` допускает `NULL`; `signed_up` — `date`, обязательна, по умолчанию текущая дата.",
    "`products`: `title` уникален; `price` имеет тип `numeric(8,2)`, обязательна и не может быть отрицательной (0 допустим, 1 000 000 — нет: превышает разрядность).",
    "`orders`: `customer_id` обязателен и ссылается на `customers`; удалить клиента, у которого есть заказы, нельзя; `status` по умолчанию `'new'` и ограничен списком `new`, `paid`, `shipped`, `cancelled`; `ordered_on` по умолчанию текущая дата.",
    "`order_items`: составной первичный ключ `(order_id, product_id)`; `order_id` ссылается на `orders` с каскадным удалением; `product_id` ссылается на `products` без каскада; `qty` строго больше 0.",
    "Все нарушения отклоняются **самой базой** с правильным классом ошибки: `23502` (NOT NULL), `23503` (внешний ключ), `23505` (уникальность), `23514` (CHECK), `22003` (переполнение `numeric`).",
    "Допустимые данные принимаются без ошибок: `NULL` в `city`, цена 0, статус `shipped`.",
  ],
  constraints: [
    "Только стандартные средства PostgreSQL 16: `CREATE TABLE`, ограничения внутри определения таблицы; никаких триггеров и функций.",
    "Нельзя заменять `CHECK` проверкой в приложении или триггером: ограничение должно быть декларативным.",
    "Нельзя использовать `float`/`real` для денег; нельзя хранить статус числом без расшифровки.",
    "Не добавлять лишних таблиц и обязательных столбцов (проверка вставляет только перечисленные столбцы).",
    "Имена таблиц и столбцов — в точности как в таблице требований, в нижнем регистре.",
  ],
  expected: [
    "`node check.mjs schema.sql` печатает `Пройдено проверок: 37 из 37`.",
    "Заготовка проходит 7 из 37 проверок (таблицы существуют, ключи заданы, остальное — нет).",
    "Каждая из восьми «испорченных» схем проваливает от 1 до 3 проверок.",
    "Попытка вставить заказ несуществующего клиента завершается `23503`, а не «тихой» записью.",
  ],
  technical: [
    "Ограничения удобно записывать в определении столбца (`price numeric(8,2) NOT NULL CHECK (price >= 0)`): так связь «столбец — правило» видна сразу.",
    "Внешний ключ без `ON DELETE` ведёт себя как `NO ACTION`: удаление родителя с детьми отклоняется. Явное `ON DELETE RESTRICT` делает намерение очевидным.",
    "`ON DELETE CASCADE` — для **частей целого** (позиции заказа); для самостоятельных сущностей (клиент, товар) каскад опасен.",
    "Составной ключ `(order_id, product_id)` одновременно запрещает дубли и создаёт индекс по ведущему столбцу `order_id`.",
    "`numeric(8,2)` — всего 8 цифр, из них 2 после запятой: максимум `999999.99`. Большее значение даёт `numeric field overflow` (`22003`).",
    "`DEFAULT current_date` вычисляется при вставке; `NOT NULL DEFAULT …` позволяет не указывать столбец в `INSERT`.",
    "Код `SQLSTATE` классифицирует ошибку: `23xxx` — нарушение ограничения целостности; по нему приложение отличает «такой e-mail уже есть» от «нет такого клиента».",
  ],
  acceptance: [
    "`node check.mjs schema.sql` — 37 из 37.",
    "Схема создаётся ровно четырьмя `CREATE TABLE`, без `ALTER TABLE` и триггеров.",
    "Заготовка проходит 7 из 37; каждая из восьми испорченных схем теряет хотя бы одну проверку (от 1 до 3).",
    "Для каждого ограничения есть сценарий «нарушение → правильный код ошибки» и сценарий «допустимое значение → успех».",
    "Файл читается сверху вниз: сначала родительские таблицы, затем зависимые.",
  ],
  hints: [
    "Порядок создания таблиц определяют внешние ключи: сначала `customers` и `products`, потом `orders`, потом `order_items`.",
    "`CHECK (status IN ('new', 'paid', 'shipped', 'cancelled'))` ограничивает список значений; не забудьте `DEFAULT 'new'`.",
    "Если проверка «цена не больше 999999.99» красная, посмотрите на тип: `numeric` без параметров не ограничивает разрядность, а `real` сам с собой приблизителен.",
    "Дубль позиции (`order_id`, `product_id`) ловит именно составной первичный ключ; ключ только по `order_id` разрешит одну позицию на заказ.",
    "Удаление клиента с заказами должно давать `23503`: проверьте правило `ON DELETE` у внешнего ключа в `orders`.",
    "Если вся загрузка падает на первой же ошибке, найдите её в выводе: `check.mjs` показывает первую строку сообщения `psql`.",
  ],
  advanced: [
    "Добавьте `payments(id, order_id, amount, method, paid_at)` с проверкой метода оплаты и положительной суммы; расширьте проверку своими сценариями.",
    "Запретите заказы с `status = 'paid'` без позиций декларативно (это невозможно одним `CHECK`; подумайте, какой механизм подойдёт: триггер или отложенное ограничение) и обоснуйте цену решения.",
    "Замените `status` на справочник `order_statuses` с внешним ключом и сравните сообщения об ошибках и цену изменения набора значений.",
    "Добавьте индексы по внешним ключам и объясните, какие из них PostgreSQL создал сам, а какие нужно создать явно.",
    "Составьте таблицу «ограничение → ожидаемый `SQLSTATE`» для своей схемы и напишите по ней обобщённый тест.",
  ],
  failureModes: [
    "**Нет `CHECK` на цену:** отрицательная цена принимается — в замере проваливаются проверки вставки и изменения (2 из 37).",
    "**Нет внешнего ключа заказа на клиента:** заказ несуществующего клиента сохраняется, клиента с заказами можно удалить (3 из 37).",
    "**`email` не уникален:** дубли e-mail принимаются, смена на занятый адрес проходит (2 из 37).",
    "**Первичный ключ позиции только по `order_id`:** один товар в заказе — и больше ничего; структурная проверка и два сценария красные (3 из 37).",
    "**`ON DELETE CASCADE` у клиента:** удаление клиента молча стирает его заказы; проваливаются сценарий и правило удаления (2 из 37).",
    "**Статус без `CHECK`:** принимается любой текст (1 из 37).",
    "**`qty >= 0` вместо `qty > 0`:** позиция «0 штук» проходит (1 из 37).",
    "**`real` вместо `numeric(8,2)`:** деньги хранятся приблизительно, структурная проверка красная, переполнение не отклоняется (2 из 37).",
  ],
  rubric: [
    { criterion: "Типы и структура", weight: 20, description: "Правильные типы (`numeric(8,2)`, `date`), обязательные столбцы, значения по умолчанию, имена." },
    { criterion: "Ограничения целостности", weight: 30, description: "`NOT NULL`, `UNIQUE`, `CHECK` на цену, статус и количество; `22003` на переполнении; корректные коды ошибок." },
    { criterion: "Связи и правила удаления", weight: 20, description: "Внешние ключи, `RESTRICT` для клиента и товара, `CASCADE` для позиций заказа, составной ключ." },
    { criterion: "Поведение на допустимых данных", weight: 20, description: "`NULL` в `city`, цена 0, статус `shipped`, значения по умолчанию — принимаются без ошибок." },
    { criterion: "Читаемость DDL", weight: 10, description: "Порядок таблиц, выравнивание, ограничения рядом со столбцами, комментарий к схеме." },
  ],
  solution: [
    p("Эталон — один файл `schema.sql` (около 30 строк). Он проходит все 37 проверок; заготовка проходит 7 из 37, а каждая из восьми намеренно испорченных схем проваливает от 1 до 3 проверок. Ниже — решение, проверяющий скрипт и результаты запусков на PostgreSQL 16.14."),
    h("schema.sql"),
    code("sql", `-- Схема интернет-магазина «Кофейня»: четыре таблицы, связи и ограничения
CREATE TABLE customers (
  id        integer PRIMARY KEY,
  name      text    NOT NULL,
  email     text    NOT NULL UNIQUE,
  city      text,
  signed_up date    NOT NULL DEFAULT current_date
);

CREATE TABLE products (
  id       integer PRIMARY KEY,
  title    text    NOT NULL UNIQUE,
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
);`, { filename: "schema.sql", lineNumbers: true }),
    ul(
      "**Каждое правило — декларативно.** `CHECK (price >= 0)`, `UNIQUE`, `NOT NULL` проверяются при любом способе записи: приложением, скриптом, ручным `UPDATE`.",
      "**`ON DELETE RESTRICT` у клиента и `CASCADE` у позиции** выражают смысл: заказ принадлежит клиенту и не исчезает вместе с ним, а позиции — часть заказа.",
      "**Составной ключ позиции** выполняет две работы: уникальность пары и индекс по `order_id`.",
      "**`numeric(8,2)`** защищает и от дробных копеек, и от слишком больших сумм (`22003`).",
    ),
    h("check.mjs"),
    code("js", `// check.mjs — проверка схемы. Запуск: node check.mjs schema.sql   (нужны PostgreSQL 16 и пакет pg: npm i pg)
// Подключение — переменные окружения PGHOST, PGPORT, PGUSER, PGPASSWORD. Для проверки создаётся и удаляется временная база.
import { execFileSync } from "node:child_process";
import pg from "pg";

const file = process.argv[2];
if (!file) { console.error("usage: node check.mjs schema.sql"); process.exit(2); }

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });

const admin = new pg.Client({ database: "postgres" });
await admin.connect();
const dbName = "chk_" + Math.random().toString(36).slice(2, 10);
await admin.query(\`create database \${dbName}\`);
const c = new pg.Client({ database: dbName });
await c.connect();

try {
  // 1. Схема должна загружаться без ошибок
  let loaded = true;
  try { execFileSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-d", dbName, "-f", file], { stdio: ["ignore", "ignore", "pipe"] }); }
  catch (e) { loaded = false; check("схема загружается без ошибок", false, String(e.stderr).split("\\n")[0]); }
  if (loaded) check("схема загружается без ошибок", true);

  const q = async (sql, params) => { try { return (await c.query(sql, params)).rows; } catch { return []; } };

  // 2. Структура
  for (const t of ["customers", "products", "orders", "order_items"])
    check(\`таблица \${t} существует\`, (await q("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1", [t])).length === 1);
  const col = async (t, n) => (await q("SELECT * FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2", [t, n]))[0];
  const price = await col("products", "price");
  check("products.price — numeric(8,2)", price && price.data_type === "numeric" && price.numeric_precision === 8 && price.numeric_scale === 2, price ? \`\${price.data_type}(\${price.numeric_precision},\${price.numeric_scale})\` : "нет столбца");
  const status = await col("orders", "status");
  check("orders.status по умолчанию 'new'", status && /'new'/.test(status.column_default ?? ""), status?.column_default ?? "нет столбца");
  const pk = await q(\`SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum = ANY(i.indkey)
                      WHERE i.indrelid = to_regclass('order_items') AND i.indisprimary ORDER BY a.attname\`);
  check("order_items: составной первичный ключ (order_id, product_id)", pk.map((r) => r.attname).join() === "order_id,product_id", pk.map((r) => r.attname).join() || "ключа нет");
  const rule = async (child, parent) => (await q(\`SELECT rc.delete_rule FROM information_schema.referential_constraints rc
        JOIN information_schema.table_constraints tc ON tc.constraint_name=rc.constraint_name AND tc.constraint_schema=rc.constraint_schema
        JOIN information_schema.table_constraints pc ON pc.constraint_name=rc.unique_constraint_name AND pc.constraint_schema=rc.unique_constraint_schema
        WHERE tc.table_name=$1 AND pc.table_name=$2\`, [child, parent]))[0]?.delete_rule;
  const r1 = await rule("orders", "customers"), r2 = await rule("order_items", "orders"), r3 = await rule("order_items", "products");
  check("orders → customers: удаление запрещено (RESTRICT/NO ACTION)", r1 === "RESTRICT" || r1 === "NO ACTION", String(r1));
  check("order_items → orders: каскадное удаление", r2 === "CASCADE", String(r2));
  check("order_items → products: удаление запрещено", r3 === "RESTRICT" || r3 === "NO ACTION", String(r3));

  // 3. Начальные данные для проверок поведения
  const seed = \`INSERT INTO customers (id, name, email, city) VALUES (1, 'Анна', 'anna@example.com', 'Москва'), (2, 'Борис', 'boris@example.com', NULL);
                INSERT INTO products (id, title, category, price) VALUES (1, 'Кофе', 'напитки', 1200.00), (2, 'Чай', 'напитки', 250.00);
                INSERT INTO orders (id, customer_id) VALUES (1, 1);
                INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 1, 2)\`;
  let seeded = true;
  try { await c.query(seed); } catch (e) { seeded = false; check("начальные данные вставляются", false, e.message); }
  if (seeded) check("начальные данные вставляются", true);

  // 4. Поведение: каждая команда выполняется в транзакции и откатывается; ожидается успех (ok) или SQLSTATE
  const T = [
    ["клиент: допустим NULL в city", "INSERT INTO customers (id, name, email) VALUES (3, 'Вера', 'vera@example.com')", "ok"],
    ["клиент: e-mail уникален", "INSERT INTO customers (id, name, email) VALUES (3, 'Дубль', 'anna@example.com')", "23505"],
    ["клиент: имя обязательно", "INSERT INTO customers (id, email) VALUES (3, 'x@example.com')", "23502"],
    ["клиент: signed_up заполняется по умолчанию", "INSERT INTO customers (id, name, email) VALUES (3, 'Глеб', 'gleb@example.com')", "ok"],
    ["клиент: нельзя сменить e-mail на занятый", "UPDATE customers SET email = 'anna@example.com' WHERE id = 2", "23505"],
    ["товар: цена 0 допустима", "INSERT INTO products (id, title, category, price) VALUES (3, 'Образец', 'прочее', 0)", "ok"],
    ["товар: цена не может быть отрицательной", "INSERT INTO products (id, title, category, price) VALUES (3, 'Минус', 'прочее', -1)", "23514"],
    ["товар: нельзя изменить цену на отрицательную", "UPDATE products SET price = -5 WHERE id = 1", "23514"],
    ["товар: название уникально", "INSERT INTO products (id, title, category, price) VALUES (3, 'Кофе', 'напитки', 10)", "23505"],
    ["товар: цена не больше 999999.99", "INSERT INTO products (id, title, category, price) VALUES (3, 'Золото', 'прочее', 1000000)", "22003"],
    ["заказ: клиент должен существовать", "INSERT INTO orders (id, customer_id) VALUES (2, 99)", "23503"],
    ["заказ: клиент обязателен", "INSERT INTO orders (id) VALUES (2)", "23502"],
    ["заказ: статус из списка", "INSERT INTO orders (id, customer_id, status) VALUES (2, 1, 'lost')", "23514"],
    ["заказ: допустим статус shipped", "INSERT INTO orders (id, customer_id, status) VALUES (2, 1, 'shipped')", "ok"],
    ["позиция: количество положительно (0)", "INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 2, 0)", "23514"],
    ["позиция: количество положительно (-1)", "INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 2, -1)", "23514"],
    ["позиция: товар не добавляется в заказ дважды", "INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 1, 1)", "23505"],
    ["позиция: товар должен существовать", "INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 99, 1)", "23503"],
    ["позиция: заказ должен существовать", "INSERT INTO order_items (order_id, product_id, qty) VALUES (99, 1, 1)", "23503"],
    ["позиция: допустима корректная", "INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 2, 3)", "ok"],
    ["нельзя удалить клиента с заказами", "DELETE FROM customers WHERE id = 1", "23503"],
    ["нельзя удалить товар, который есть в заказах", "DELETE FROM products WHERE id = 1", "23503"],
    ["можно удалить клиента без заказов", "DELETE FROM customers WHERE id = 2", "ok"],
  ];
  for (const [name, sql, want] of T) {
    await c.query("BEGIN");
    let got = "ok";
    try { await c.query(sql); } catch (e) { got = e.code; }
    await c.query("ROLLBACK");
    check(name, got === want, \`ожидалось \${want}, получено \${got}\`);
  }
  // значения по умолчанию и каскад проверяем по данным
  await c.query("BEGIN");
  try {
    await c.query("INSERT INTO orders (id, customer_id) VALUES (3, 1)");
    const o = (await c.query("SELECT status, ordered_on IS NOT NULL AS has_date FROM orders WHERE id = 3")).rows[0];
    check("заказ: статус по умолчанию 'new' и дата заполнена", o && o.status === "new" && o.has_date, JSON.stringify(o));
  } catch (e) { check("заказ: статус по умолчанию 'new' и дата заполнена", false, e.message); }
  await c.query("ROLLBACK");
  await c.query("BEGIN");
  try {
    await c.query("DELETE FROM orders WHERE id = 1");
    const n = (await c.query("SELECT count(*)::int AS n FROM order_items WHERE order_id = 1")).rows[0].n;
    check("удаление заказа каскадно удаляет его позиции", n === 0, \`осталось позиций: \${n}\`);
  } catch (e) { check("удаление заказа каскадно удаляет его позиции", false, e.message); }
  await c.query("ROLLBACK");
} finally {
  await c.end();
  await admin.query(\`drop database \${dbName} with (force)\`);
  await admin.end();
}

const failed = results.filter((r) => !r.ok);
for (const r of failed) console.log(\`✗ \${r.name} — \${r.detail}\`);
console.log(\`Пройдено проверок: \${results.length - failed.length} из \${results.length}\`);
if (failed.length) console.log(\`Не прошли: \${failed.length}\`);
process.exit(failed.length ? 1 : 0);`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 37 из 37`, { filename: "результат node check.mjs solution.sql (PostgreSQL 16.14)" }),
    code("text", `✗ products.price — numeric(8,2) — нет столбца
✗ orders.status по умолчанию 'new' — нет столбца
✗ order_items: составной первичный ключ (order_id, product_id) — ключа нет
✗ orders → customers: удаление запрещено (RESTRICT/NO ACTION) — undefined
✗ order_items → orders: каскадное удаление — undefined
✗ order_items → products: удаление запрещено — undefined
✗ начальные данные вставляются — column "name" of relation "customers" does not exist
✗ клиент: допустим NULL в city — ожидалось ok, получено 42703
✗ клиент: e-mail уникален — ожидалось 23505, получено 42703
✗ клиент: имя обязательно — ожидалось 23502, получено 42703
✗ клиент: signed_up заполняется по умолчанию — ожидалось ok, получено 42703
✗ клиент: нельзя сменить e-mail на занятый — ожидалось 23505, получено 42703
✗ товар: цена 0 допустима — ожидалось ok, получено 42703
✗ товар: цена не может быть отрицательной — ожидалось 23514, получено 42703
✗ товар: нельзя изменить цену на отрицательную — ожидалось 23514, получено 42703
✗ товар: название уникально — ожидалось 23505, получено 42703
✗ товар: цена не больше 999999.99 — ожидалось 22003, получено 42703
✗ заказ: клиент должен существовать — ожидалось 23503, получено 42703
✗ заказ: клиент обязателен — ожидалось 23502, получено ok
✗ заказ: статус из списка — ожидалось 23514, получено 42703
✗ заказ: допустим статус shipped — ожидалось ok, получено 42703
✗ позиция: количество положительно (0) — ожидалось 23514, получено 42703
✗ позиция: количество положительно (-1) — ожидалось 23514, получено 42703
✗ позиция: товар не добавляется в заказ дважды — ожидалось 23505, получено 42703
✗ позиция: товар должен существовать — ожидалось 23503, получено 42703
✗ позиция: заказ должен существовать — ожидалось 23503, получено 42703
✗ позиция: допустима корректная — ожидалось ok, получено 42703
✗ нельзя удалить клиента с заказами — ожидалось 23503, получено ok
✗ нельзя удалить товар, который есть в заказах — ожидалось 23503, получено ok
✗ заказ: статус по умолчанию 'new' и дата заполнена — column "customer_id" of relation "orders" does not exist
Пройдено проверок: 7 из 37
Не прошли: 30`, { filename: "результат node check.mjs starter.sql (заготовка)" }),
    code("text", `b1-no-price-check: Пройдено проверок: 35 из 37
b2-no-customer-fk: Пройдено проверок: 34 из 37
b3-email-not-unique: Пройдено проверок: 35 из 37
b4-items-pk-single: Пройдено проверок: 34 из 37
b5-cascade-customers: Пройдено проверок: 35 из 37
b6-status-no-check: Пройдено проверок: 36 из 37
b7-qty-nonnegative: Пройдено проверок: 36 из 37
b8-price-real: Пройдено проверок: 35 из 37`, { filename: "результат check.mjs для испорченных схем (mutants/)" }),
    tip("Проверка выполняется на временной базе, которая создаётся и удаляется автоматически; ваши данные она не трогает. Нужны `psql` в `PATH` и пакет `pg` (`npm i pg`)."),
    warn("`check.mjs` проверяет поведение базы, а не стиль. Файл, проходящий 37 из 37, всё равно стоит перечитать: есть ли ограничения, которые защищают от ошибок, не покрытых проверкой (например, пустое имя клиента)."),
  ],
};
