import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
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

export const upsertReturning: Topic = {
  id: "sql.upsert-returning",
  slug: "upsert-returning",
  domain: "sql",
  module: "modification",
  title: "Upsert и RETURNING",
  titleEn: "Upsert and RETURNING",
  summary:
    "`INSERT … ON CONFLICT` решает задачу «создать, а если уже есть — обновить или пропустить» одной атомарной командой, а `RETURNING` возвращает строки, которые команда вставила, изменила или удалила, без второго запроса. Тема на замерах PostgreSQL 16.14 и SQLite 3.49 показывает `DO NOTHING` и `DO UPDATE` с псевдотаблицей `excluded`, условие `WHERE` внутри `DO UPDATE` (применить только более свежую цену: из двух импортов принят один), ошибку «cannot affect row a second time», приём `xmax = 0` для различия вставки и обновления, пропуски в нумерации (`identity` дошёл до 4 после двух конфликтов), `MERGE` в PostgreSQL 15+ и перенос строк через `WITH … DELETE … RETURNING`. Эксперимент с 20 параллельными соединениями показывает, почему «сначала проверить, потом вставить» ломается (19 из 20 получили ошибку), а `ON CONFLICT` — нет.",
  minutes: 70,
  prerequisites: ["sql.insert-update-delete", "sql.keys-constraints"],
  tags: ["upsert", "ON CONFLICT", "DO NOTHING", "DO UPDATE", "excluded", "RETURNING", "MERGE", "idempotent", "race condition", "xmax", "data-modifying CTE", "identity gaps", "atomic increment"],
  keyConcepts: [
    { term: "Upsert — атомарное «создать или обновить»", text: "`INSERT … ON CONFLICT (ключ) DO UPDATE` выполняется как одна команда: проверка наличия и запись не разделены, поэтому параллельные запросы не конфликтуют. В эксперименте на 20 соединений схема «проверить, потом вставить» дала 19 ошибок `23505`, а `ON CONFLICT DO NOTHING` — 0." },
    { term: "excluded — «предлагаемая» строка", text: "В `DO UPDATE` псевдотаблица `excluded` содержит значения, которые пытались вставить: `SET qty = stock.qty + excluded.qty` прибавляет приход к остатку (2: 5 + 7 = 12)." },
    { term: "RETURNING возвращает изменённые строки", text: "`INSERT … RETURNING id`, `UPDATE … RETURNING`, `DELETE … RETURNING` отдают результат тем же запросом. В PostgreSQL 16 возвращаются только новые значения (для `DELETE` — удалённые)." },
    { term: "Конфликт расходует номера identity", text: "После двух `ON CONFLICT DO NOTHING` следующая вставка получила `id = 4`, а не `2`: последовательность не откатывается, в нумерации появляются пропуски." },
    { term: "Одна команда не может изменить строку дважды", text: "`VALUES ('a', 1), ('a', 1) ON CONFLICT DO UPDATE` завершается ошибкой `cannot affect row a second time` — повторы ключа нужно свернуть до вставки (`GROUP BY`)." },
  ],
  sections: [
    section("definition", [
      def("Upsert", "Операция «update or insert»: если строки с таким ключом нет — вставить, если есть — обновить (или пропустить). В SQL реализуется как `INSERT … ON CONFLICT` (PostgreSQL 9.5+, SQLite 3.24+) или `MERGE`.", "upsert"),
      def("ON CONFLICT", "Предложение `INSERT`, задающее, что делать при нарушении уникального ограничения: `DO NOTHING` — пропустить строку, `DO UPDATE SET …` — изменить существующую.", "ON CONFLICT"),
      def("excluded", "Псевдотаблица внутри `DO UPDATE`: строка, которую команда пыталась вставить. Позволяет использовать новые значения в обновлении.", "excluded"),
      def("RETURNING", "Предложение `INSERT`/`UPDATE`/`DELETE`, возвращающее клиенту значения затронутых строк (включая автоматически созданные `id`).", "RETURNING"),
      def("MERGE", "Команда стандарта SQL: по таблице-источнику вставляет, обновляет и удаляет строки целевой таблицы (PostgreSQL 15+). Не заменяет `ON CONFLICT` при высокой конкуренции.", "MERGE"),
      def("Идемпотентность", "Свойство операции: повторное выполнение даёт тот же итог. Upsert с `DO NOTHING`/`DO UPDATE SET x = excluded.x` идемпотентен, а с `x = x + 1` — нет.", "idempotency"),
      def("Состояние гонки", "Ситуация, когда результат зависит от порядка выполнения параллельных операций: «проверить — вставить» в двух соединениях создаёт дубль или ошибку.", "race condition"),
    ]),

    section("why", [
      h("Почти каждая загрузка данных — это «создать или обновить»"),
      p("Импорт справочников, синхронизация с внешним сервисом, счётчики просмотров, настройки пользователей, повторная доставка сообщений: в каждом случае неизвестно заранее, есть ли уже строка. Наивные решения — «`SELECT`, потом `INSERT` или `UPDATE`» — работают в тестах и ломаются под нагрузкой: между проверкой и записью другой процесс успевает вставить ту же строку."),
      ul(
        "**Атомарность:** `ON CONFLICT` проверяет и пишет за одну команду под защитой индекса, поэтому гонок нет.",
        "**Идемпотентность:** повторный запуск загрузки (после сбоя) не создаёт дублей.",
        "**Скорость:** одна команда вместо `SELECT` + `INSERT`/`UPDATE` — меньше обращений к серверу; `RETURNING` убирает ещё один запрос.",
        "**Простота кода:** нет веток «если есть» и обработки исключений нарушения уникальности.",
      ),
    ]),

    section("mental-model", [
      h("Конфликт — это событие, на которое вы назначаете реакцию"),
      p("Обычный `INSERT` при нарушении уникальности выбрасывает ошибку и отменяет команду. `ON CONFLICT` превращает ошибку в **управляемое событие**: вы заранее говорите, что делать — пропустить (`DO NOTHING`) или обновить существующую строку (`DO UPDATE`). Для каждой пытавшейся вставиться строки СУБД находит конфликтующую по указанному ключу и применяет выбранное действие."),
      diagram(
        `
        INSERT (product_id=2, qty=7) ───▶ есть ли строка с product_id = 2 ?
                                              │
                         нет ◀────────────────┴────────────────▶ да (конфликт)
                          │                                         │
                  вставить новую строку                  DO NOTHING → пропустить
                                                         DO UPDATE  → SET qty = stock.qty + excluded.qty
                                                                      (stock — старая строка, excluded — предложенная)
        `,
        "Решение принимается под блокировкой индекса: два параллельных `INSERT` одного ключа не обгонят друг друга.",
      ),
      h("RETURNING — результат вместо второго запроса"),
      p("Автоматически создаваемые значения (`id`, `created_at`, умолчания) известны только после вставки. `RETURNING` отдаёт их сразу: приложению не нужен отдельный `SELECT` и нет окна, в котором данные могут измениться."),
      steps(
        [
          ["Определите ключ конфликта", "Столбцы, на которые есть `UNIQUE`/`PRIMARY KEY` — именно по ним определяется «уже есть»."],
          ["Выберите реакцию", "Пропустить (`DO NOTHING`), заменить значения (`SET x = excluded.x`) или накопить (`SET x = t.x + excluded.x`)."],
          ["Добавьте условие, если нужно", "`WHERE excluded.updated_on > t.updated_on` — обновлять только более свежие данные."],
          ["Верните результат", "`RETURNING` — какие строки реально вставлены или обновлены."],
        ],
        "Как составить upsert",
      ),
    ]),

    section("technical", [
      h("Синтаксис ON CONFLICT"),
      table(
        ["Форма", "Что делает", "Замечание"],
        [
          ["`ON CONFLICT DO NOTHING`", "Пропускает строки, нарушающие любое уникальное ограничение", "Не создаёт и не меняет строк; затронутых строк — 0"],
          ["`ON CONFLICT (col) DO NOTHING`", "Пропускает только конфликты по `col`", "Остальные нарушения всё ещё дают ошибку"],
          ["`ON CONFLICT (col) DO UPDATE SET …`", "Обновляет существующую строку", "Нужен явный список ключевых столбцов"],
          ["`… DO UPDATE SET … WHERE условие`", "Обновляет, только если условие истинно", "Если ложно — строка остаётся без изменений"],
          ["`ON CONFLICT ON CONSTRAINT имя`", "Указывает ограничение по имени (PostgreSQL)", "Удобно для составных и именованных ограничений"],
        ],
        "Формы upsert",
      ),
      h("RETURNING"),
      ul(
        "`INSERT … RETURNING id, created_at` — созданные значения; для строк, пропущенных `DO NOTHING`, ничего не возвращается.",
        "`UPDATE … RETURNING` — **новые** значения изменённых строк (PostgreSQL 17 добавил `old.` и `new.`).",
        "`DELETE … RETURNING *` — удалённые строки: удобно для очередей и перемещения данных.",
        "Поддерживается в PostgreSQL и SQLite 3.35+; результат можно использовать в CTE (PostgreSQL).",
      ),
      h("MERGE (PostgreSQL 15+)"),
      p("`MERGE INTO цель USING источник ON условие WHEN MATCHED … WHEN NOT MATCHED …` позволяет в одной команде обновлять, удалять и вставлять по набору строк. В отличие от `ON CONFLICT`, он не опирается на уникальный индекс и при высокой конкуренции может вернуть ошибки уникальности, поэтому для простых upsert-ов предпочтителен `ON CONFLICT`."),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `CREATE TABLE subscribers (email text PRIMARY KEY, name text NOT NULL, plan text NOT NULL DEFAULT 'free', updated_on text NOT NULL);
INSERT INTO subscribers VALUES ('a@example.test', 'Анна', 'free', '2024-01-10'), ('b@example.test', 'Борис', 'pro', '2024-02-01');

-- Импорт пачки: новые добавить, существующих обновить, но только если запись в импорте свежее
INSERT INTO subscribers (email, name, plan, updated_on) VALUES
  ('a@example.test', 'Анна К.', 'pro', '2024-03-01'),
  ('b@example.test', 'Борис',   'free', '2024-01-15'),
  ('c@example.test', 'Вера',    'free', '2024-03-05')
ON CONFLICT (email) DO UPDATE
  SET name = excluded.name, plan = excluded.plan, updated_on = excluded.updated_on
  WHERE excluded.updated_on > subscribers.updated_on
RETURNING email, name, plan, updated_on;

SELECT email, name, plan, updated_on FROM subscribers ORDER BY email;`,
        [
          { line: 1, text: "Таблица подписчиков: `email` — ключ; `updated_on` показывает свежесть записи (ISO-текст для переносимости)." },
          { line: 2, text: "Две существующие записи: Анна (`free`, январь) и Борис (`pro`, февраль)." },
          { line: [5, 8], text: "Импорт трёх записей: Анна с более свежей датой, Борис со старой, Вера новая." },
          { line: 9, text: "`ON CONFLICT (email) DO UPDATE …` — реакция на существующий email." },
          { line: 10, text: "`SET … = excluded.…` берёт значения из входящей строки." },
          { line: 11, text: "`WHERE excluded.updated_on > subscribers.updated_on` — обновлять только если входящая запись свежее." },
          { line: 12, text: "`RETURNING` — вернуть только затронутые строки (вставленную Веру и обновлённую Анну); Борис не возвращён: условие не прошло." },
        ],
        "14-challenge.sql",
      ),
    ]),

    section("minimal-example", [
      p("`DO NOTHING`: повторы известных имён молча пропускаются. Выполните блок в браузере — результат тот же."),
      code("sql", `CREATE TABLE tags (name text PRIMARY KEY, uses integer NOT NULL DEFAULT 1);
INSERT INTO tags (name) VALUES ('sql'), ('git');

-- повтор известного имени не вызывает ошибку и не создаёт дубль
INSERT INTO tags (name) VALUES ('sql'), ('css'), ('git') ON CONFLICT (name) DO NOTHING;

SELECT name, uses FROM tags ORDER BY name;`, { filename: "01-do-nothing.sql", runnable: true }),
      code("text", `CREATE TABLE
INSERT 0 2
INSERT 0 1
 name | uses 
------+------
 css  |    1
 git  |    1
 sql  |    1
(3 rows)`, { filename: "результат (PostgreSQL 16.14, с тегами команд)" }),
      p("Вторая команда пыталась вставить три имени, из которых `sql` и `git` уже были: тег `INSERT 0 1` показывает, что вставлена одна строка (`css`), конфликты пропущены без ошибки. В таблице три тега, у каждого `uses = 1`."),
    ]),

    section("detailed-example", [
      p("Накопление: приход товара должен либо создать строку остатка, либо прибавить к существующей. Выражение `stock.qty + excluded.qty` складывает старое значение с предложенным."),
      code("sql", `CREATE TABLE stock (product_id integer PRIMARY KEY, qty integer NOT NULL CHECK (qty >= 0));
INSERT INTO stock VALUES (1, 10), (2, 5);

-- приход товара: если строки нет — создать, если есть — прибавить (атомарно)
INSERT INTO stock (product_id, qty) VALUES (2, 7), (3, 4)
ON CONFLICT (product_id) DO UPDATE SET qty = stock.qty + excluded.qty;

SELECT product_id, qty FROM stock ORDER BY product_id;`, { filename: "02-do-update.sql", runnable: true }),
      code("text", ` product_id | qty 
------------+-----
          1 |  10
          2 |  12
          3 |   4
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Товар 2 (был 5, пришло 7) стал 12; товар 3 создан со значением 4; товар 1 не тронут. Все изменения — одной командой, поэтому параллельные приходы не потеряют друг друга."),
      h("RETURNING на каждом шаге"),
      code("sql", `CREATE TABLE tickets (id integer PRIMARY KEY, title text NOT NULL, status text NOT NULL DEFAULT 'open');

INSERT INTO tickets (id, title) VALUES (1, 'логин не работает'), (2, 'медленный отчёт') RETURNING id, title, status;
UPDATE tickets SET status = 'done' WHERE id = 2 RETURNING id, status;
DELETE FROM tickets WHERE id = 1 RETURNING id, title;
SELECT id, title, status FROM tickets ORDER BY id;`, { filename: "03-returning.sql", runnable: true }),
      code("text", `CREATE TABLE
 id |       title       | status 
----+-------------------+--------
  1 | логин не работает | open
  2 | медленный отчёт   | open
(2 rows)

INSERT 0 2
 id | status 
----+--------
  2 | done
(1 row)

UPDATE 1
 id |       title       
----+-------------------
  1 | логин не работает
(1 row)

DELETE 1
 id |      title      | status 
----+-----------------+--------
  2 | медленный отчёт | done
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "`INSERT … RETURNING` вернул созданные строки со значением по умолчанию `status = open`.",
        "`UPDATE … RETURNING id, status` вернул новое состояние изменённой строки.",
        "`DELETE … RETURNING` — то, что было удалено; удобно для журналирования и очередей.",
      ),
    ]),

    section("analysis", [
      table(
        ["Команда", "Результат", "Объяснение"],
        [
          ["`INSERT … ('sql'), ('css'), ('git') ON CONFLICT DO NOTHING`", "`INSERT 0 1`", "Вставлено одно имя, два конфликта пропущены"],
          ["`… (2, 7), (3, 4) ON CONFLICT DO UPDATE SET qty = stock.qty + excluded.qty`", "Остаток 2: 12; строка 3 создана", "Старое значение `stock.qty`, предложенное — `excluded.qty`"],
          ["`… ON CONFLICT … DO UPDATE … WHERE excluded.updated_on > prices.updated_on`", "`INSERT 0 0`, затем `INSERT 0 1`", "Старый импорт (февраль) отвергнут, свежий (апрель) применён"],
          ["`INSERT … VALUES ('a', 1), ('a', 1) ON CONFLICT DO UPDATE …`", "Ошибка", "Одна команда не может изменить строку дважды"],
        ],
        "Что делают формы upsert (замеры PostgreSQL 16.14)",
      ),
      code("sql", `CREATE TABLE prices (item text PRIMARY KEY, price integer NOT NULL, updated_on text NOT NULL);
INSERT INTO prices VALUES ('кофе', 1200, '2024-03-01');

-- Применять цену только если она свежее уже записанной
INSERT INTO prices (item, price, updated_on) VALUES ('кофе', 1100, '2024-02-01')
ON CONFLICT (item) DO UPDATE SET price = excluded.price, updated_on = excluded.updated_on
WHERE excluded.updated_on > prices.updated_on;

INSERT INTO prices (item, price, updated_on) VALUES ('кофе', 1300, '2024-04-01')
ON CONFLICT (item) DO UPDATE SET price = excluded.price, updated_on = excluded.updated_on
WHERE excluded.updated_on > prices.updated_on;

SELECT item, price, updated_on FROM prices;`, { filename: "04-upsert-where.sql", runnable: true }),
      code("text", `CREATE TABLE
INSERT 0 1
INSERT 0 0
INSERT 0 1
 item | price | updated_on 
------+-------+------------
 кофе |  1300 | 2024-04-01
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Первый `INSERT` (цена от `2024-02-01`) оказался старше записанной (`2024-03-01`): условие `WHERE` ложно, тег `INSERT 0 0`, значение осталось `1200`. Второй (от `2024-04-01`) прошёл — цена `1300`."),
    ]),

    section("internals", [
      h("Как PostgreSQL гарантирует атомарность"),
      p("`ON CONFLICT` использует **спекулятивную вставку**: сначала в уникальный индекс записывается «намерение» вставки; если конфликта нет, строка завершается, если есть — намерение отменяется и применяется выбранное действие, при этом найденная строка блокируется. Поэтому два параллельных `INSERT` с одним ключом упорядочиваются на уровне индекса, а не приложения."),
      h("Эксперимент: «проверить, потом вставить»"),
      p("20 соединений одновременно проверяют, что email свободен, ждут друг друга (барьер) и вставляют. Затем то же с `ON CONFLICT DO NOTHING`. Скрипт запускает оба варианта и считает исходы:"),
      code("js", `// Гонка «проверить, потом вставить»: 20 соединений одновременно проверяют, что email свободен, и только потом вставляют.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pg = require("pg");
const cfg = { host: "127.0.0.1", port: 54329, user: "nobody" };
const admin = new pg.Client({ ...cfg, database: "postgres" });
await admin.connect();
const db = "race_" + Math.random().toString(36).slice(2, 8);
await admin.query(\`create database \${db}\`);
const setup = new pg.Client({ ...cfg, database: db });
await setup.connect();
await setup.query("create table accounts (id integer generated always as identity primary key, email text not null unique)");

async function run(label, attempt) {
  await setup.query("truncate accounts restart identity");
  const clients = await Promise.all(Array.from({ length: 20 }, async () => { const c = new pg.Client({ ...cfg, database: db }); await c.connect(); return c; }));
  let ready = 0, release; const barrier = new Promise((r) => (release = r));
  const results = await Promise.all(clients.map(async (c) => {
    try { return await attempt(c, async () => { if (++ready === clients.length) release(); await barrier; }); }
    catch (e) { return "ошибка: " + e.code; }
  }));
  await Promise.all(clients.map((c) => c.end()));
  const rows = (await setup.query("select count(*)::int as n from accounts")).rows[0].n;
  const summary = {};
  for (const r of results) summary[r] = (summary[r] ?? 0) + 1;
  console.log(\`\${label}: строк в таблице \${rows}; результаты\`, JSON.stringify(summary));
}

await run("проверить, потом вставить", async (c, wait) => {
  const { rows } = await c.query("select 1 from accounts where email = 'a@example.test'");
  await wait();                                            // все увидели «email свободен»
  if (rows.length) return "уже есть";
  await c.query("insert into accounts (email) values ('a@example.test')");
  return "вставлено";
});
await run("INSERT … ON CONFLICT DO NOTHING", async (c, wait) => {
  await wait();
  const r = await c.query("insert into accounts (email) values ('a@example.test') on conflict (email) do nothing returning id");
  return r.rowCount ? "вставлено" : "уже есть";
});
await setup.end();
await admin.query(\`drop database \${db} with (force)\`);
await admin.end();`, { filename: "10-race.mjs", collapsed: true }),
      code("text", `проверить, потом вставить: строк в таблице 1; результаты {"ошибка: 23505":19,"вставлено":1}
INSERT … ON CONFLICT DO NOTHING: строк в таблице 1; результаты {"уже есть":19,"вставлено":1}`, { filename: "результат (PostgreSQL 16.14, Node.js 22.22.0)" }),
      ul(
        "Схема «проверить, потом вставить»: все 20 увидели «email свободен», вставила одна, остальные 19 получили ошибку `23505` (нарушение уникальности).",
        "Ограничение `UNIQUE` спасло от дубликата, но не от ошибок: приложение вынуждено ловить исключения и повторять.",
        "С `ON CONFLICT DO NOTHING`: 1 вставка, 19 штатных «уже есть», ошибок нет.",
      ),
      h("Пропуски в нумерации"),
      code("sql", `CREATE TABLE users (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, email text NOT NULL UNIQUE);

INSERT INTO users (email) VALUES ('a@example.test');
INSERT INTO users (email) VALUES ('a@example.test') ON CONFLICT (email) DO NOTHING;   -- конфликт, строка не создана
INSERT INTO users (email) VALUES ('a@example.test') ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email) VALUES ('b@example.test') RETURNING id;`, { filename: "07-sequence-gaps.pg.sql" }),
      code("text", `CREATE TABLE
INSERT 0 1
INSERT 0 0
INSERT 0 0
 id 
----
  4
(1 row)

INSERT 0 1`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Значения `identity` выдаются **до** проверки конфликта и не возвращаются: после двух пропущенных вставок новый пользователь получил `id = 4` (1 — первый, 2 и 3 — израсходованы конфликтами). Нумерация без дыр — не свойство `identity`; не рассчитывайте на неё."),
      h("Вставка или обновление: xmax = 0"),
      code("sql", `CREATE TABLE settings (key text PRIMARY KEY, value text NOT NULL);

INSERT INTO settings VALUES ('theme', 'dark')
ON CONFLICT (key) DO UPDATE SET value = excluded.value
RETURNING key, value, (xmax = 0) AS inserted;                 -- true: строка создана

INSERT INTO settings VALUES ('theme', 'light')
ON CONFLICT (key) DO UPDATE SET value = excluded.value
RETURNING key, value, (xmax = 0) AS inserted;                 -- false: строка обновлена`, { filename: "06-xmax.pg.sql" }),
      code("text", `CREATE TABLE
  key  | value | inserted 
-------+-------+----------
 theme | dark  | t
(1 row)

INSERT 0 1
  key  | value | inserted 
-------+-------+----------
 theme | light | f
(1 row)

INSERT 0 1`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Системный столбец `xmax` у новой строки равен нулю, у обновлённой — нет. Приём `RETURNING (xmax = 0) AS inserted` различает вставку и обновление, но опирается на внутреннее устройство PostgreSQL: пользуйтесь им осознанно."),
    ]),

    section("mistakes", [
      h("Ошибка: «проверить, потом вставить»"),
      wrongRight(
        "sql",
        {
          title: "Две команды: гонка",
          code: `
            SELECT 1 FROM accounts WHERE email = :email;      -- «свободен»
            INSERT INTO accounts (email) VALUES (:email);     -- параллельный запрос уже вставил
          `,
          note: "Под нагрузкой часть запросов упадёт с `23505` (в замере 19 из 20), а без `UNIQUE` появятся дубли.",
        },
        {
          title: "Одна команда с ON CONFLICT",
          code: `
            INSERT INTO accounts (email) VALUES (:email)
            ON CONFLICT (email) DO NOTHING
            RETURNING id;
          `,
          note: "Если строка вставлена — вернётся `id`, если уже была — пустой результат: исход ясен без исключений.",
        },
      ),
      h("Ошибка: одна строка дважды в одной команде"),
      code("sql", `CREATE TABLE counters (name text PRIMARY KEY, hits integer NOT NULL);

-- Одна команда пытается изменить одну и ту же строку дважды
INSERT INTO counters VALUES ('a', 1), ('a', 1)
ON CONFLICT (name) DO UPDATE SET hits = counters.hits + excluded.hits;

-- Решение: свернуть повторы до вставки
INSERT INTO counters
SELECT name, sum(hits) FROM (VALUES ('a', 1), ('a', 1), ('b', 1)) AS v(name, hits) GROUP BY name
ON CONFLICT (name) DO UPDATE SET hits = counters.hits + excluded.hits;

SELECT name, hits FROM counters ORDER BY name;`, { filename: "05-affect-twice.pg.sql" }),
      code("text", `CREATE TABLE
ERROR:  ON CONFLICT DO UPDATE command cannot affect row a second time
HINT:  Ensure that no rows proposed for insertion within the same command have duplicate constrained values.
INSERT 0 2
 name | hits 
------+------
 a    |    2
 b    |    1
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Если во входной пачке есть повторы ключа, `DO UPDATE` падает с `cannot affect row a second time`. Сверните пачку до вставки: `GROUP BY name` с `sum(hits)` — затем повторы объединятся, а итоговое значение `a` будет 2."),
      h("Ошибка: DO UPDATE без осмысленного накопления"),
      p("`SET hits = excluded.hits` заменяет значение, а `SET hits = t.hits + excluded.hits` накапливает. Для счётчиков нужна вторая форма — иначе каждый вызов «обнуляет» счётчик значением 1. И помните: накопление **не идемпотентно** — повтор той же команды после сбоя прибавит ещё раз."),
      h("Ошибка: ON CONFLICT без указания ключа в DO UPDATE"),
      p("Для `DO UPDATE` PostgreSQL требует явный список столбцов (`ON CONFLICT (email)`), иначе непонятно, по какому ограничению искать существующую строку. Для `DO NOTHING` можно обойтись без него, но тогда проглатываются конфликты по **любому** ограничению — в том числе ожидаемо не конфликтующему."),
    ]),

    section("antipatterns", [
      ul(
        "**`SELECT` → `INSERT`/`UPDATE` в приложении** вместо `ON CONFLICT`.",
        "**Перехват исключения нарушения уникальности как «нормальной» ветки** — дорого и шумно в журналах.",
        "**`DELETE` + `INSERT` вместо upsert:** теряются ссылки, меняются идентификаторы, срабатывают каскады.",
        "**`DO NOTHING` без ключа** — прячет неожиданные конфликты по другим ограничениям.",
        "**Накопление в импортах без защиты от повторов** (дважды обработанный файл дважды прибавит значения).",
        "**Опора на непрерывность `identity`** после `ON CONFLICT`.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Используйте `ON CONFLICT (ключ)`** для идемпотентных вставок и «создать или обновить».",
        "**Указывайте ключ явно** и описывайте реакцию: `DO NOTHING` — «не важно, что уже есть», `DO UPDATE` — «последнее слово за новым».",
        "**Ставьте `WHERE` в `DO UPDATE`**, если важна свежесть (дата версии, номер ревизии) — защита от записи старых данных.",
        "**Сворачивайте повторы ключа** внутри пачки до вставки.",
        "**Берите результат через `RETURNING`:** `id` для связанных вставок, различие «создано/обновлено» (`xmax = 0`) — только если действительно нужно.",
        "**Для счётчиков** — `SET n = t.n + excluded.n` или `UPDATE … SET n = n + 1` в одной команде; учитывайте неидемпотентность.",
        "**Для перемещения строк** используйте `WITH moved AS (DELETE … RETURNING *) INSERT … SELECT * FROM moved`.",
        "**Проверяйте под нагрузкой:** параллельный тест на гонки, как в эксперименте выше.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**`DO NOTHING` и `RETURNING`:** пропущенные строки не возвращаются; чтобы получить `id` существующей строки, нужен дополнительный `SELECT` или `DO UPDATE SET col = col`.",
        "**`DO UPDATE SET col = col`** («пустое» обновление) создаёт новую версию строки и срабатывает триггеры, зато возвращает её в `RETURNING`.",
        "**Несколько уникальных ограничений:** `ON CONFLICT (a)` обрабатывает только конфликт по `a`; нарушение другого ограничения — ошибка.",
        "**Частичные уникальные индексы:** нужно указывать предикат индекса (`ON CONFLICT (email) WHERE active`).",
        "**`MERGE`** в PostgreSQL 16 не поддерживает `RETURNING` (появится в 17) и не гарантирует отсутствие ошибок уникальности при конкурентных вставках.",
        "**SQLite:** `ON CONFLICT … DO UPDATE` и `RETURNING` поддерживаются; `MERGE` нет; в SQLite-диалекте есть и старые формы `INSERT OR REPLACE`/`OR IGNORE` — `REPLACE` удаляет и вставляет строку заново.",
      ),
      code("sql", `CREATE TABLE stock (product_id integer PRIMARY KEY, qty integer NOT NULL);
INSERT INTO stock VALUES (1, 10), (2, 5), (3, 8);

-- MERGE (PostgreSQL 15+): обновить, вставить и удалить одной командой по таблице-источнику
MERGE INTO stock AS s
USING (VALUES (1, 0), (2, 7), (4, 3)) AS v(product_id, delta)
ON s.product_id = v.product_id
WHEN MATCHED AND s.qty + v.delta = 0 THEN DELETE
WHEN MATCHED THEN UPDATE SET qty = s.qty + v.delta
WHEN NOT MATCHED THEN INSERT (product_id, qty) VALUES (v.product_id, v.delta);

SELECT product_id, qty FROM stock ORDER BY product_id;`, { filename: "08-merge.pg.sql" }),
      code("text", `CREATE TABLE
INSERT 0 3
MERGE 3
 product_id | qty 
------------+-----
          1 |  10
          2 |  12
          3 |   8
          4 |   3
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`MERGE 3` — затронуто три строки: у товара 1 приход 0 (остаток 10 + 0 не равен 0, значит обновление без изменения), товару 2 прибавлено 7 (12), товар 4 создан (3). Ветка `DELETE` сработала бы, если бы итоговый остаток обнулялся."),
      code("sql", `CREATE TABLE inbox (id integer PRIMARY KEY, body text, done boolean NOT NULL DEFAULT false);
CREATE TABLE inbox_archive (LIKE inbox);
INSERT INTO inbox VALUES (1, 'a', true), (2, 'b', false), (3, 'c', true);

-- Переместить выполненные письма в архив одним атомарным оператором
WITH moved AS (DELETE FROM inbox WHERE done RETURNING *)
INSERT INTO inbox_archive SELECT * FROM moved;

SELECT 'inbox' AS tbl, count(*) AS n FROM inbox UNION ALL SELECT 'archive', count(*) FROM inbox_archive;`, { filename: "09-cte-move.pg.sql" }),
      code("text", `   tbl   | n 
---------+---
 inbox   | 1
 archive | 2
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Перемещение строк одной командой: `DELETE … RETURNING *` внутри CTE отдаёт удалённые строки, `INSERT … SELECT` кладёт их в архив. Если вставка не удастся, удаление тоже отменится."),
    ]),

    section("related", [
      ul(
        "[INSERT, UPDATE, DELETE](/learn/sql/insert-update-delete) — основы изменения данных.",
        "[Ключи и ограничения](/learn/sql/keys-constraints) — уникальные ограничения, на которых строится `ON CONFLICT`.",
        "[Транзакции и ACID](/learn/sql/acid-transactions) — атомарность и её границы.",
        "[Уровни изоляции](/learn/sql/isolation-levels) — аномалии при конкурентных вставках.",
        "[Блокировки и взаимные блокировки](/learn/sql/locking-deadlocks) — как `ON CONFLICT` блокирует строку.",
        "[CTE](/learn/sql/ctes) — модифицирующие CTE (`WITH … DELETE … RETURNING`).",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Прочитать, прибавить, записать",
          code: `
            -- приложение: hits = SELECT hits FROM views WHERE page = '/home';  -- 41
            -- UPDATE views SET hits = 42 WHERE page = '/home';
            -- (а если строки нет — отдельная ветка INSERT)
          `,
          note: "Параллельные запросы прочитают 41 и оба запишут 42; строка «/about» требует отдельной ветки.",
        },
        {
          title: "Атомарный upsert",
          code: `
            INSERT INTO views (page, hits) VALUES ('/home', 1)
            ON CONFLICT (page) DO UPDATE SET hits = views.hits + 1
            RETURNING page, hits;
          `,
          note: "Создаёт или увеличивает счётчик за одну команду под блокировкой строки; `RETURNING` сразу отдаёт новое значение.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.upsert-returning.ex1",
      title: "Предскажите содержимое таблицы",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская, определите, что вернёт каждая команда и что будет в таблице `inv` в конце."),
        code("sql", `CREATE TABLE inv (sku text PRIMARY KEY, qty integer NOT NULL);
INSERT INTO inv VALUES ('a', 1), ('b', 2);
INSERT INTO inv VALUES ('a', 10), ('c', 3) ON CONFLICT (sku) DO NOTHING;
INSERT INTO inv VALUES ('b', 20), ('d', 4) ON CONFLICT (sku) DO UPDATE SET qty = excluded.qty;
INSERT INTO inv VALUES ('c', 5) ON CONFLICT (sku) DO UPDATE SET qty = inv.qty + excluded.qty RETURNING sku, qty;
SELECT sku, qty FROM inv ORDER BY sku;`, { filename: "11-ex-predict.sql", runnable: true }),
      ],
      hints: ["Какие строки пропускает первый `DO NOTHING`?", "Чем `DO UPDATE SET qty = excluded.qty` отличается от накопления?", "Какое значение `qty` у `c` до последней команды?"],
      checks: ["Первая команда добавила только `c = 3`", "Вторая заменила `b` на 20 и добавила `d = 4`", "Третья вернула `c = 8` (3 + 5)", "Итог: a 1, b 20, c 8, d 4"],
      solution: [
        code("text", ` sku | qty 
-----+-----
 c   |   8
(1 row)

 sku | qty 
-----+-----
 a   |   1
 b   |  20
 c   |   8
 d   |   4
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "`DO NOTHING` пропустил конфликтующую `a`, вставил `c = 3`.",
          "`DO UPDATE SET qty = excluded.qty` заменил `b` (2 → 20) и вставил `d = 4`.",
          "Накопление `inv.qty + excluded.qty` дало `c = 3 + 5 = 8`; `RETURNING` показал строку.",
        ),
      ],
    }),
    exercise({
      id: "sql.upsert-returning.ex2",
      title: "Счётчик просмотров без потерь",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Страницы сайта считают просмотры: приложение читает `hits`, прибавляет единицу и записывает обратно; при параллельных запросах счётчик отстаёт, а для новой страницы нужна отдельная ветка вставки. Перепишите на одну команду, которая создаёт строку со значением 1 или прибавляет 1 и возвращает новое значение. Проверьте на страницах `/home` (уже 41) и `/about` (новая)."),
        code("sql", `-- Счётчик просмотров: «прочитать — прибавить — записать» в приложении теряет обновления.
-- Перепишите на один атомарный оператор: создать строку со значением 1 или прибавить 1.
CREATE TABLE views (page text PRIMARY KEY, hits integer NOT NULL);
INSERT INTO views VALUES ('/home', 41);
SELECT page, hits FROM views;`, { filename: "12-ex-fix.sql", runnable: true }),
      ],
      hints: ["Какое ограничение определяет «уже есть»?", "Как обратиться к старому значению в `DO UPDATE`?", "Как получить новое значение?"],
      checks: ["`ON CONFLICT (page) DO UPDATE SET hits = views.hits + 1`", "`RETURNING page, hits`", "`/home` → 42, `/about` → 1"],
      solution: [
        code("sql", `CREATE TABLE views (page text PRIMARY KEY, hits integer NOT NULL);
INSERT INTO views VALUES ('/home', 41);

INSERT INTO views (page, hits) VALUES ('/home', 1), ('/about', 1)
ON CONFLICT (page) DO UPDATE SET hits = views.hits + 1
RETURNING page, hits;`, { filename: "13-fix-solution.sql", runnable: true }),
        code("text", `CREATE TABLE
INSERT 0 1
  page  | hits 
--------+------
 /home  |   42
 /about |    1
(2 rows)

INSERT 0 2`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Одна команда обрабатывает обе страницы: `/home` увеличена до 42, `/about` создана со значением 1. Прирост вычисляется внутри команды под блокировкой строки, поэтому параллельные запросы не потеряют друг друга; `RETURNING` отдаёт итог без второго запроса."),
      ],
    }),
    exercise({
      id: "sql.upsert-returning.ex3",
      title: "Импорт подписчиков с проверкой свежести",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("В таблице подписчиков (`email` — ключ) уже есть Анна и Борис. Нужно загрузить пачку из трёх записей: новые добавить, существующих обновить **только если запись в пачке свежее**. Верните только реально затронутые строки и покажите итоговую таблицу."),
      ],
      hints: ["Какое условие защищает от записи старых данных?", "Что будет с записью Бориса, если она старше имеющейся?", "Что вернёт `RETURNING`, если условие `WHERE` ложно?"],
      checks: ["`ON CONFLICT (email) DO UPDATE … WHERE excluded.updated_on > subscribers.updated_on`", "Возвращены Анна (обновлена) и Вера (создана)", "Борис не изменён: его запись в пачке старше"],
      solution: [
        code("sql", `CREATE TABLE subscribers (email text PRIMARY KEY, name text NOT NULL, plan text NOT NULL DEFAULT 'free', updated_on text NOT NULL);
INSERT INTO subscribers VALUES ('a@example.test', 'Анна', 'free', '2024-01-10'), ('b@example.test', 'Борис', 'pro', '2024-02-01');

-- Импорт пачки: новые добавить, существующих обновить, но только если запись в импорте свежее
INSERT INTO subscribers (email, name, plan, updated_on) VALUES
  ('a@example.test', 'Анна К.', 'pro', '2024-03-01'),
  ('b@example.test', 'Борис',   'free', '2024-01-15'),
  ('c@example.test', 'Вера',    'free', '2024-03-05')
ON CONFLICT (email) DO UPDATE
  SET name = excluded.name, plan = excluded.plan, updated_on = excluded.updated_on
  WHERE excluded.updated_on > subscribers.updated_on
RETURNING email, name, plan, updated_on;

SELECT email, name, plan, updated_on FROM subscribers ORDER BY email;`, { filename: "14-challenge.sql", runnable: true, lineNumbers: true }),
        code("text", `CREATE TABLE
INSERT 0 2
     email      |  name   | plan | updated_on 
----------------+---------+------+------------
 a@example.test | Анна К. | pro  | 2024-03-01
 c@example.test | Вера    | free | 2024-03-05
(2 rows)

INSERT 0 2
     email      |  name   | plan | updated_on 
----------------+---------+------+------------
 a@example.test | Анна К. | pro  | 2024-03-01
 b@example.test | Борис   | pro  | 2024-02-01
 c@example.test | Вера    | free | 2024-03-05
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Тег `INSERT 0 2` и `RETURNING` показывают две затронутые строки: Анна обновлена (`pro`, 1 марта), Вера создана. Запись Бориса из пачки старше хранящейся (15 января против 1 февраля), поэтому условие ложно и он остался `pro` с датой `2024-02-01`."),
      ],
    }),
  ],

  challenge: {
    id: "sql.upsert-returning.challenge",
    title: "Идемпотентный импорт тегов",
    scenario: [
      p("Сервис получает от внешней системы события «статья помечена тегом». События могут приходить повторно и пачками, в том числе с повторами внутри пачки. Нужно, чтобы таблица тегов содержала каждый тег один раз, а счётчик использования отражал число **различных** событий (но не повторов одного события)."),
    ],
    requirements: [
      "Таблица `tags (name PRIMARY KEY, uses)`",
      "Создание тега при первом появлении со значением 1",
      "Повторная доставка одной пачки не должна увеличивать счётчик второй раз (идемпотентность по идентификатору события)",
      "Повторы тега внутри одной пачки не должны приводить к ошибке",
    ],
    constraints: [
      "Одна команда `INSERT … ON CONFLICT` на пачку",
      "Нельзя полагаться на предварительный `SELECT`",
    ],
    acceptance: [
      "Две одинаковые пачки дают тот же итог, что одна",
      "Нет ошибок `cannot affect row a second time`",
    ],
    hints: [
      "Для идемпотентности нужна таблица обработанных событий (`events (id PRIMARY KEY)`): вставляйте события с `ON CONFLICT DO NOTHING RETURNING` и увеличивайте счётчики только для реально вставленных.",
      "Повторы внутри пачки сворачивайте `GROUP BY`.",
    ],
    solution: [
      code("sql", `CREATE TABLE tags       (name text PRIMARY KEY, uses integer NOT NULL);
CREATE TABLE tag_events (id   text PRIMARY KEY, tag  text    NOT NULL);

-- Пачка: событие e2 пришло дважды, e1 и e3 — по разу. Выполняем ту же пачку два раза подряд.
WITH batch(event_id, tag) AS (VALUES ('e1', 'sql'), ('e2', 'sql'), ('e3', 'git'), ('e2', 'sql')),
     dedup AS (SELECT DISTINCT event_id, tag FROM batch),
     fresh AS (
       INSERT INTO tag_events (id, tag) SELECT event_id, tag FROM dedup
       ON CONFLICT (id) DO NOTHING RETURNING tag
     )
INSERT INTO tags (name, uses) SELECT tag, count(*) FROM fresh GROUP BY tag
ON CONFLICT (name) DO UPDATE SET uses = tags.uses + excluded.uses;

WITH batch(event_id, tag) AS (VALUES ('e1', 'sql'), ('e2', 'sql'), ('e3', 'git'), ('e2', 'sql')),
     dedup AS (SELECT DISTINCT event_id, tag FROM batch),
     fresh AS (
       INSERT INTO tag_events (id, tag) SELECT event_id, tag FROM dedup
       ON CONFLICT (id) DO NOTHING RETURNING tag
     )
INSERT INTO tags (name, uses) SELECT tag, count(*) FROM fresh GROUP BY tag
ON CONFLICT (name) DO UPDATE SET uses = tags.uses + excluded.uses;

SELECT name, uses FROM tags ORDER BY name;`, { filename: "15-challenge.pg.sql", lineNumbers: true }),
      code("text", `CREATE TABLE
CREATE TABLE
INSERT 0 2
INSERT 0 0
 name | uses 
------+------
 git  |    1
 sql  |    2
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Событие записывается в `events` с `ON CONFLICT DO NOTHING RETURNING`; увеличиваются только теги реально вставленных событий. Пачка выполнена дважды: во второй раз `INSERT 0 0` — событий не вставлено (`RETURNING` пуст), счётчики не изменились (`sql` — 2, `git` — 1). Повтор `e2` внутри пачки убран `DISTINCT` до вставки."),
    ],
  },

  interview: [
    iq("sql.upsert-returning.i1", "basic", "Что такое upsert и как он записывается в PostgreSQL?", [
      ul(
        "Операция «создать или обновить»: `INSERT … ON CONFLICT (ключ) DO UPDATE SET …` или `DO NOTHING`.",
        "Выполняется атомарно и безопасно при параллельных запросах.",
        "Требует уникального ограничения или индекса по столбцам ключа.",
      ),
    ]),
    iq("sql.upsert-returning.i2", "basic", "Что такое RETURNING и зачем он нужен?", [
      ul(
        "Предложение `INSERT`/`UPDATE`/`DELETE`, возвращающее затронутые строки.",
        "Позволяет получить автоматически созданные значения (`id`, умолчания) без второго запроса.",
        "Для `DELETE` — удалённые данные (очереди, архивирование).",
      ),
    ]),
    iq("sql.upsert-returning.i3", "intermediate", "Почему «SELECT, потом INSERT» ненадёжно? Как исправить?", [
      ul(
        "Между проверкой и вставкой другой запрос вставляет ту же строку: дубль (без `UNIQUE`) или ошибка уникальности (с ним).",
        "В замере из 20 параллельных попыток 19 завершились ошибкой `23505`.",
        "Исправление: `INSERT … ON CONFLICT DO NOTHING` (или `DO UPDATE`) — одна атомарная команда; `UNIQUE` обязателен.",
      ),
    ]),
    iq("sql.upsert-returning.i4", "intermediate", "Что такое excluded в ON CONFLICT DO UPDATE?", [
      ul(
        "Псевдотаблица с входящей (предложенной) строкой, которая не смогла вставиться из-за конфликта.",
        "Позволяет использовать новые значения: `SET price = excluded.price` или накопление `SET qty = stock.qty + excluded.qty`.",
        "Старые значения — через имя таблицы (`stock.qty`).",
      ),
    ]),
    iq("sql.upsert-returning.i5", "intermediate", "Что означает ошибка «ON CONFLICT DO UPDATE command cannot affect row a second time»?", [
      ul(
        "В одной команде есть несколько входящих строк с одним и тем же ключом: пришлось бы изменить строку дважды.",
        "Исправление: свернуть повторы до вставки (`GROUP BY` с агрегатом) или использовать `DISTINCT ON`.",
        "Для `DO NOTHING` такой ошибки нет: повторные строки просто пропускаются.",
      ),
    ]),
    iq("sql.upsert-returning.i6", "advanced", "Чем MERGE отличается от INSERT … ON CONFLICT?", [
      ul(
        "`MERGE` (PostgreSQL 15+) работает по условию соединения с источником и умеет обновлять, удалять и вставлять в одной команде; не требует уникального индекса.",
        "`ON CONFLICT` опирается на уникальный индекс и гарантирует отсутствие гонок при вставке; `MERGE` при параллельных вставках может вернуть ошибки уникальности.",
        "В PostgreSQL 16 у `MERGE` нет `RETURNING` (добавлено в 17). Для простых upsert-ов предпочтителен `ON CONFLICT`.",
      ),
    ]),
    iq("sql.upsert-returning.i7", "engineering", "Как построить идемпотентную загрузку событий, чтобы повторная доставка не искажала счётчики?", [
      ul(
        "Хранить обработанные идентификаторы событий в таблице с уникальным ключом.",
        "Вставлять события `INSERT … ON CONFLICT DO NOTHING RETURNING id` и применять эффекты (счётчики) только для реально вставленных.",
        "Всё в одной транзакции: запись события и обновление счётчиков фиксируются вместе.",
        "Для пачек — свёртка повторов; журналирование отклонённых дублей.",
      ),
    ]),
    iq("sql.upsert-returning.i8", "debugging", "После ON CONFLICT DO NOTHING в идентификаторах появились «дыры». Это баг?", [
      ul(
        "Нет: значения `identity`/`serial` выдаются до проверки конфликта и не возвращаются (в замере `id` дошёл до 4 после двух пропущенных вставок).",
        "Не рассчитывайте на непрерывность нумерации — используйте `id` только как уникальный ключ.",
        "Если нужна последовательная нумерация без дыр (счета, накладные), реализуйте её отдельно (таблица счётчиков с блокировкой) и осознайте цену.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.upsert-returning.e1", "foundation", "Что делает `ON CONFLICT (name) DO NOTHING`?", ["Обновляет существующую строку", "Удаляет конфликтующую строку", "Пропускает вставку при конфликте по `name` без ошибки", "Отменяет транзакцию"], 2, "`DO NOTHING` молча пропускает строки, нарушающие уникальность по указанному ключу."),
    mcq("sql.upsert-returning.e2", "foundation", "Что возвращает `INSERT … RETURNING id`?", ["Значения `id` вставленных строк", "Число вставленных строк", "Ошибку", "Всю таблицу"], 0, "`RETURNING` отдаёт указанные столбцы вставленных (изменённых, удалённых) строк."),
    mcq("sql.upsert-returning.e3", "foundation", "Что такое `excluded` в `DO UPDATE`?", ["Удалённая строка", "Имя ограничения", "Служебная таблица статистики", "Предложенная (не вставленная) строка"], 3, "`excluded` содержит значения, которые пытались вставить."),
    mcq("sql.upsert-returning.e4", "intermediate", "Что вернёт `INSERT … ON CONFLICT DO NOTHING RETURNING id`, если строка уже есть?", ["`id` существующей строки", "Ничего (пустой результат)", "`NULL`", "Ошибку"], 1, "Пропущенные `DO NOTHING` строки в `RETURNING` не попадают."),
    mcq("sql.upsert-returning.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`ON CONFLICT` выполняет проверку и запись атомарно", "`DO UPDATE` может содержать `WHERE`", "`ON CONFLICT DO UPDATE` допускает повторы ключа внутри одной пачки", "Для `DO UPDATE` указывают столбцы ключа"], [0, 1, 3], "Повторы ключа в пачке приводят к ошибке `cannot affect row a second time`; остальное верно."),
    mcq("sql.upsert-returning.e6", "intermediate", "Почему после `ON CONFLICT DO NOTHING` в нумерации `identity` могут быть пропуски?", ["Это баг PostgreSQL", "Потому что транзакция откатилась", "`DO NOTHING` удаляет строки", "Номер выдаётся до проверки конфликта и не возвращается"], 3, "В замере после двух конфликтов следующая вставка получила `id = 4`."),
    mcq("sql.upsert-returning.e7", "advanced", "Из 20 параллельных попыток «проверить, потом вставить» (с `UNIQUE`) сколько в замере закончились ошибкой?", ["0", "1", "19", "20"], 2, "Все 20 увидели «свободно», вставила одна, остальные 19 получили `23505`; `ON CONFLICT DO NOTHING` — ни одной ошибки."),
    open("sql.upsert-returning.e8", "intermediate", "Как реализовать идемпотентный импорт со свежестью данных: «новое добавить, существующее обновить только если запись свежее»? Приведите команду и объясните каждую часть.", [
      ul(
        "`INSERT INTO t (key, v, updated_on) VALUES … ON CONFLICT (key) DO UPDATE SET v = excluded.v, updated_on = excluded.updated_on WHERE excluded.updated_on > t.updated_on RETURNING key`.",
        "`ON CONFLICT (key)` — реакция на существующий ключ; `excluded` — входящие значения; `WHERE` — защита от записи устаревших данных.",
        "`RETURNING` — какие строки реально изменены (старые записи не попадают в результат).",
        "Повторный запуск того же импорта ничего не изменит: условие свежести ложно.",
      ),
    ], ["Использован ON CONFLICT … DO UPDATE", "Объяснена роль excluded и WHERE", "Упомянут RETURNING", "Идемпотентность повторного запуска"], { format: "sql" }),
  ],

  mastery: [
    mcq("sql.upsert-returning.m1", "intermediate", "Что станет с остатком товара 2 (был 5), если выполнить `INSERT … VALUES (2, 7) ON CONFLICT (product_id) DO UPDATE SET qty = stock.qty + excluded.qty`?", ["7", "12", "5", "Ошибка"], 1, "Старое значение 5 плюс предложенное 7 = 12 (замер)."),
    mcq("sql.upsert-returning.m2", "advanced", "Почему `DO UPDATE SET hits = hits + 1` не идемпотентен?", ["Каждое повторное выполнение снова увеличивает счётчик", "Из-за блокировок", "Он не работает с `ON CONFLICT`", "Он использует `excluded`"], 0, "Результат зависит от числа запусков; идемпотентность достигается идентификатором события и таблицей обработанных."),
    mcq("sql.upsert-returning.m3", "advanced", "Какой приём позволяет в PostgreSQL отличить вставку от обновления в `RETURNING`?", ["`RETURNING inserted()`", "`RETURNING status`", "`RETURNING (xmax = 0) AS inserted`", "Такого приёма нет"], 2, "У только что вставленной строки `xmax = 0`, у обновлённой — нет (замер: `t` и `f`)."),
    open("sql.upsert-returning.m4", "advanced", "Сервис получает платёжные уведомления, которые могут приходить повторно и параллельно. Опишите схему таблиц и запрос, чтобы каждый платёж учитывался ровно один раз и баланс счёта увеличивался корректно.", [
      ul(
        "Таблица `payments (payment_id PRIMARY KEY, account_id, amount, …)` — идентификатор платежа от внешней системы как ключ.",
        "В одной транзакции: `INSERT INTO payments … ON CONFLICT (payment_id) DO NOTHING RETURNING amount, account_id`; если строка вставлена — `UPDATE accounts SET balance = balance + :amount WHERE id = :account`; если пусто — платёж уже был учтён.",
        "Параллельные одинаковые уведомления упорядочиваются уникальным индексом: ровно одно вставит платёж и изменит баланс.",
        "Баланс можно не хранить, а вычислять суммой платежей — тогда повторный платёж не может исказить итог.",
        "Тест: 20 параллельных одинаковых уведомлений → ровно один платёж, баланс увеличен один раз.",
      ),
    ], ["Идентификатор платежа как ключ", "Вставка с DO NOTHING RETURNING и условное обновление баланса", "Одна транзакция", "Параллельный тест"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.upsert-returning.f1", front: "ON CONFLICT?", back: "INSERT … ON CONFLICT (ключ) DO NOTHING | DO UPDATE SET …. Атомарно, нужен UNIQUE/PK." },
    { id: "sql.upsert-returning.f2", front: "excluded?", back: "Псевдотаблица с входящей строкой в DO UPDATE. Накопление: SET qty = t.qty + excluded.qty." },
    { id: "sql.upsert-returning.f3", front: "RETURNING?", back: "Возвращает затронутые строки INSERT/UPDATE/DELETE. DO NOTHING пропущенные не возвращает." },
    { id: "sql.upsert-returning.f4", front: "SELECT, потом INSERT?", back: "Гонка: 19 из 20 параллельных попыток упали с 23505 (замер). Решение — ON CONFLICT." },
    { id: "sql.upsert-returning.f5", front: "Повторы в пачке?", back: "DO UPDATE: ошибка «cannot affect row a second time». Сверните GROUP BY до вставки." },
    { id: "sql.upsert-returning.f6", front: "identity и конфликты?", back: "Номера выдаются до проверки и не возвращаются: после DO NOTHING в нумерации дыры." },
    { id: "sql.upsert-returning.f7", front: "Вставка или обновление?", back: "RETURNING (xmax = 0) AS inserted — true для вставки (особенность PostgreSQL)." },
    { id: "sql.upsert-returning.f8", front: "MERGE?", back: "PostgreSQL 15+: вставка/обновление/удаление по источнику. Не заменяет ON CONFLICT при конкуренции; RETURNING — с 17." },
    { id: "sql.upsert-returning.f9", front: "Переместить строки?", back: "WITH moved AS (DELETE … RETURNING *) INSERT INTO archive SELECT * FROM moved — атомарно." },
  ],

  sources: [
    { title: "PostgreSQL 16: INSERT — ON CONFLICT Clause", url: "https://www.postgresql.org/docs/16/sql-insert.html#SQL-ON-CONFLICT", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Returning Data From Modified Rows", url: "https://www.postgresql.org/docs/16/dml-returning.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: MERGE", url: "https://www.postgresql.org/docs/16/sql-merge.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Data-Modifying Statements in WITH", url: "https://www.postgresql.org/docs/16/queries-with.html#QUERIES-WITH-MODIFYING", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Concurrency Control — INSERT ... ON CONFLICT", url: "https://www.postgresql.org/docs/16/transaction-iso.html", publisher: "PostgreSQL" },
    { title: "SQLite: UPSERT", url: "https://www.sqlite.org/lang_upsert.html", publisher: "Other" },
    { title: "SQLite: The RETURNING clause", url: "https://www.sqlite.org/lang_returning.html", publisher: "Other" },
  ],
};
