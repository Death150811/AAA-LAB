import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p06ReliableBooking: Project = {
  id: "sql.p06-reliable-booking",
  domain: "sql",
  order: 6,
  title: "Надёжное бронирование",
  subtitle: "Бронь мест без перепродажи, идемпотентные повторы и встречные переводы без взаимоблокировок — проверка 40 параллельными соединениями на PostgreSQL 16",
  level: "advanced",
  estimatedHours: 12,
  buildsOn: ["sql.p01-shop-schema"],
  topics: ["sql.acid-transactions", "sql.isolation-levels", "sql.locking-deadlocks", "sql.upsert-returning", "sql.insert-update-delete"],
  objective:
    "Написать файл `booking.sql`, в котором две функции — `book_seat` (бронирование места) и `transfer` (перевод денег) — **остаются корректными при параллельных вызовах**: на 10 мест 40 покупателей получают ровно 10 броней, повторный запрос с тем же идентификатором не бронирует второй раз, а сотни встречных переводов между четырьмя счетами не создают ни одной взаимоблокировки и не меняют общую сумму. Проект про атомарную проверку условия внутри `UPDATE`, идемпотентность на уникальном ключе, единый порядок блокировок и обработку отказов без побочных эффектов.",
  scenario: [
    p("Билетный сервис продаёт места на мероприятия, а кошелёк сервиса переводит деньги между счетами. В бою случилось три инцидента: два покупателя одновременно «купили» последнее место и остаток ушёл в минус; мобильное приложение при обрыве связи повторило запрос, и пользователь заплатил дважды; два встречных перевода (с 1 на 2 и со 2 на 1) заблокировали друг друга и один упал с `deadlock detected`."),
    p("Вам нужно реализовать схему и функции так, чтобы такие ситуации были невозможны. Проверка `check.mjs` создаёт временную базу, загружает `booking.sql` и проверяет **28 фактов**: последовательную логику, идемпотентность, пять раундов по 40 одновременных покупателей, 20 одновременных повторов одного запроса и три раунда по 200 встречных переводов из 24 соединений."),
    code("sql", `-- Заготовка проекта «Надёжное бронирование».
-- Создайте таблицы events, bookings, accounts и функции book_seat(event, user, request) и transfer(from, to, amount)
-- (сигнатуры и правила — в описании проекта), затем запустите:  node check.mjs starter.sql

CREATE TABLE events (
  id         integer PRIMARY KEY,
  title      text    NOT NULL,
  seats_left integer NOT NULL
  -- TODO: ограничение остатка
);

-- TODO: CREATE TABLE bookings (…);
-- TODO: CREATE TABLE accounts (…);

CREATE FUNCTION book_seat(p_event integer, p_user integer, p_request text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'не реализовано';
END $$;

CREATE FUNCTION transfer(p_from integer, p_to integer, p_amount integer) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'не реализовано';
END $$;`, { filename: "starter/booking.sql" }),
    table(
      ["Объект", "Контракт"],
      [
        ["`events(id, title, seats_left)`", "Мероприятие; остаток мест не может быть отрицательным (ограничение в схеме)"],
        ["`bookings(id, event_id, user_id, request_id)`", "Брони; `request_id` уникален; бронь ссылается на мероприятие; `id` формируется автоматически"],
        ["`accounts(id, balance)`", "Счета; баланс не может быть отрицательным"],
        ["`book_seat(event, user, request)`", "Возвращает `'booked'` (место забронировано), `'sold_out'` (мест нет, бронь не остаётся) или `'duplicate'` (этот `request_id` уже обработан, остаток не меняется)"],
        ["`transfer(from, to, amount)`", "Возвращает `true` при успехе; `false` при неверной сумме (≤ 0), переводе самому себе, несуществующем счёте или нехватке денег — состояние не меняется"],
      ],
      "Контракт проекта",
    ),
  ],
  requirements: [
    "`booking.sql` создаёт таблицы `events`, `bookings`, `accounts` и функции `book_seat(integer, integer, text) RETURNS text`, `transfer(integer, integer, integer) RETURNS boolean` и загружается без ошибок.",
    "`events.seats_left` и `accounts.balance` защищены ограничением `CHECK (… >= 0)`: даже ошибка в коде функции не уведёт их в минус.",
    "`book_seat`: при наличии мест уменьшает остаток ровно на единицу и оставляет одну бронь; при отсутствии мест возвращает `'sold_out'` и **не оставляет брони**; повторный `request_id` возвращает `'duplicate'` и ничего не меняет.",
    "Идемпотентность работает и при **одновременных** повторах: 20 параллельных вызовов с одним `request_id` дают одну бронь (`'booked'`) и 19 ответов `'duplicate'`.",
    "При 40 одновременных покупателях на 10 мест: ровно 10 `'booked'`, 30 `'sold_out'`, остаток 0, 10 строк в `bookings`, ни одной ошибки — в каждом из пяти раундов.",
    "`transfer`: при успехе списывает и зачисляет атомарно; при любом отказе возвращает `false` и не меняет ни один баланс (включая перевод на несуществующий счёт: деньги не списываются).",
    "Сотни встречных переводов из 24 соединений не вызывают ни одной ошибки (в том числе `deadlock detected`), сумма на счетах остаётся 4000, отрицательных балансов нет.",
  ],
  constraints: [
    "Только SQL и PL/pgSQL PostgreSQL 16; без расширений, блокировок всей таблицы (`LOCK TABLE`) и advisory-блокировок.",
    "Нельзя полагаться на уровень изоляции `SERIALIZABLE` и повторы в приложении: функции вызываются в обычном режиме `READ COMMITTED`.",
    "Нельзя читать остаток отдельным `SELECT` и затем записывать вычисленное значение: проверка условия и изменение — одной командой `UPDATE`.",
    "Никаких `sleep` и «подождать и повторить» внутри функций.",
    "Названия таблиц, столбцов и функций, а также возвращаемые значения — строго как в контракте.",
  ],
  expected: [
    "`node check.mjs booking.sql` печатает `Пройдено проверок: 28 из 28`.",
    "Заготовка проходит 4 проверки из 28.",
    "Каждый из восьми «плохих» вариантов проваливает от 1 до 22 проверок и стабильно (три запуска подряд дали одинаковые результаты).",
    "Время проверки — около секунды.",
  ],
  technical: [
    "Проверка условия и изменение — одной командой: `UPDATE events SET seats_left = seats_left - 1 WHERE id = $1 AND seats_left > 0`. Если строка не обновилась (`NOT FOUND`), мест нет. Другой сеанс ждёт и **перепроверяет условие** на новой версии строки.",
    "Идемпотентность — уникальный ключ: `INSERT … ON CONFLICT (request_id) DO NOTHING`; `NOT FOUND` после вставки означает, что запрос уже обработан. При одновременных повторах второй вставщик ждёт первого и затем видит конфликт.",
    "Если после вставки брони места не оказалось, вставку нужно отменить (`DELETE`) в той же транзакции — иначе останется «бронь без места».",
    "Взаимоблокировка возникает, когда транзакции берут блокировки в разном порядке. Перевод блокирует обе строки счетов одной командой `SELECT … WHERE id IN (a, b) ORDER BY id FOR UPDATE` — всегда по возрастанию `id`.",
    "Отказ должен быть **до** первого изменения или откатывать его: сначала проверьте существование обоих счетов, затем списывайте.",
    "`CHECK (… >= 0)` — последняя линия защиты: он превращает ошибку логики в ошибку базы, а не в тихо испорченные данные.",
    "Функция PL/pgSQL выполняется в транзакции вызывающего; исключение внутри откатывает её изменения целиком.",
  ],
  acceptance: [
    "`node check.mjs booking.sql` — 28 из 28, воспроизводимо при повторных запусках.",
    "Заготовка проходит 4 из 28; каждый из восьми плохих вариантов проваливает хотя бы одну проверку.",
    "В функциях нет `LOCK TABLE`, `pg_sleep` и чтения остатка отдельным `SELECT` перед записью.",
    "При отказе (`sold_out`, `false`) в базе не остаётся ни брони, ни изменённых балансов.",
  ],
  hints: [
    "Если на 10 мест продаётся 11–15 билетов, а остаток остаётся положительным, вы читаете остаток отдельно и пишете вычисленное: параллельные сеансы затирают друг друга. Условие должно быть внутри `UPDATE … WHERE seats_left > 0`.",
    "`'sold_out'` оставляет бронь? После вставки брони, если `UPDATE` ничего не обновил, удалите вставленную бронь перед возвратом.",
    "20 повторов дают больше одной брони — у `request_id` нет уникальности или вы проверяете существование отдельным `SELECT` до вставки (гонка). Используйте `ON CONFLICT DO NOTHING` и проверку `NOT FOUND`.",
    "Появились ошибки `deadlock detected` — вы блокируете счета в порядке вызова. Блокируйте обе строки сразу в порядке `id`.",
    "При переводе на несуществующий счёт деньги исчезают: проверьте наличие обоих счетов **до** списания.",
    "Баланс ушёл в минус — условие `balance >= p_amount` должно быть в `UPDATE`, а `CHECK` — в схеме.",
    "Чтобы воспроизвести гонку руками, откройте два сеанса `psql` и вызовите `book_seat` из `BEGIN` без `COMMIT`: второй вызов будет ждать первого.",
  ],
  advanced: [
    "Добавьте ограничение «пользователь не может бронировать одно мероприятие дважды» и объясните, как оно взаимодействует с идемпотентностью (разные запросы одного пользователя).",
    "Реализуйте `cancel_booking(request_id)`, возвращающую место, и докажите её корректность тем же параллельным тестом (покупки и отмены одновременно).",
    "Сделайте очередь ожидания через `FOR UPDATE SKIP LOCKED` и сравните с блокирующим вариантом на 40 соединениях.",
    "Проверьте функции на уровне `REPEATABLE READ`: какие ошибки появятся и как их обработать повтором транзакции.",
    "Снимите метрики: сколько времени заняли 200 переводов при порядке блокировок по `id` и при блокировке всей таблицы; объясните разницу.",
  ],
  failureModes: [
    "**Чтение остатка отдельным `SELECT` и запись вычисленного значения:** параллельные покупатели затирают друг друга; остаток остаётся больше нуля, броней больше десяти (5 проверок из 28 красные: все раунды параллельных броней).",
    "**Нет уникальности `request_id` и обработки конфликта:** повтор бронирует второй раз, а параллельные повторы множат брони (22 проверки из 28 красные — продажа ломается во всех сценариях).",
    "**Блокировка счетов в порядке вызова** (с короткой паузой между блокировками, чтобы окно гонки не зависело от удачи): встречные переводы блокируют друг друга, три раунда по 200 переводов дают ошибки взаимоблокировок (3 из 28).",
    "**Списание до проверки получателя:** перевод на несуществующий счёт списывает деньги; проваливаются проверки отказа и сохранения суммы (6 из 28).",
    "**Нет проверки остатка при списании и нет `CHECK`:** балансы уходят в минус (7 из 28).",
    "**Нет проверки суммы и переводов самому себе:** `transfer(1, 2, 0)` и `transfer(3, 3, 10)` возвращают `true` (1 из 28).",
    "**Другие названия статусов:** `'dup'` вместо `'duplicate'` ломает контракт (2 из 28).",
    "**Нет `seats_left > 0` и ограничения:** место продаётся без остатка, остаток уходит в минус (8 из 28).",
  ],
  rubric: [
    { criterion: "Атомарность и условия в UPDATE", weight: 25, description: "Проверка остатка и списание — одной командой; откат лишних вставок; отказ без побочных эффектов." },
    { criterion: "Идемпотентность", weight: 20, description: "Уникальный ключ запроса, `ON CONFLICT`, одновременные повторы, возврат `duplicate`." },
    { criterion: "Блокировки и взаимоблокировки", weight: 25, description: "Единый порядок блокировок, отсутствие ошибок на встречных переводах, сумма денег сохранена." },
    { criterion: "Ограничения в схеме", weight: 15, description: "`CHECK (… >= 0)`, `UNIQUE`, внешний ключ; защита от некорректных данных даже при ошибке функции." },
    { criterion: "Читаемость и контракт", weight: 15, description: "Точное соответствие контракту, понятные комментарии, возвращаемые значения, отсутствие лишних приёмов." },
  ],
  solution: [
    p("Эталон — файл `booking.sql` (около 60 строк). Он проходит все 28 проверок; заготовка проходит 4 из 28, а каждый из восьми намеренно испорченных вариантов проваливает от 1 до 22 проверок (три запуска подряд дают одинаковые числа). Ниже — решение, проверяющий скрипт и результаты запусков на PostgreSQL 16.14."),
    h("booking.sql"),
    code("sql", `-- Бронирование мест и переводы денег: корректность при параллельных запросах

CREATE TABLE events (
  id         integer PRIMARY KEY,
  title      text    NOT NULL,
  seats_left integer NOT NULL CHECK (seats_left >= 0)
);

CREATE TABLE bookings (
  id         bigint  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id   integer NOT NULL REFERENCES events (id),
  user_id    integer NOT NULL,
  request_id text    NOT NULL UNIQUE          -- идемпотентность: один запрос — одна бронь
);

CREATE TABLE accounts (
  id      integer PRIMARY KEY,
  balance integer NOT NULL CHECK (balance >= 0)
);

-- 'booked' — место забронировано, 'sold_out' — мест нет, 'duplicate' — этот запрос уже обработан
CREATE FUNCTION book_seat(p_event integer, p_user integer, p_request text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO bookings (event_id, user_id, request_id) VALUES (p_event, p_user, p_request)
  ON CONFLICT (request_id) DO NOTHING;
  IF NOT FOUND THEN
    RETURN 'duplicate';
  END IF;

  UPDATE events SET seats_left = seats_left - 1 WHERE id = p_event AND seats_left > 0;
  IF NOT FOUND THEN
    DELETE FROM bookings WHERE request_id = p_request;
    RETURN 'sold_out';
  END IF;
  RETURN 'booked';
END $$;

-- true — перевод выполнен; false — отказ (неверная сумма, тот же счёт, нет счёта, не хватает денег), состояние не меняется
CREATE FUNCTION transfer(p_from integer, p_to integer, p_amount integer) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  IF p_amount <= 0 OR p_from = p_to THEN
    RETURN false;
  END IF;

  -- обе строки блокируются в порядке id: встречные переводы не дождутся друг друга по кругу
  PERFORM 1 FROM accounts WHERE id IN (p_from, p_to) ORDER BY id FOR UPDATE;
  IF (SELECT count(*) FROM accounts WHERE id IN (p_from, p_to)) < 2 THEN
    RETURN false;
  END IF;

  UPDATE accounts SET balance = balance - p_amount WHERE id = p_from AND balance >= p_amount;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  UPDATE accounts SET balance = balance + p_amount WHERE id = p_to;
  RETURN true;
END $$;`, { filename: "booking.sql", lineNumbers: true }),
    ul(
      "**`book_seat`:** сначала `INSERT … ON CONFLICT (request_id) DO NOTHING` — повтор сразу получает `duplicate`; затем `UPDATE … WHERE seats_left > 0`: если место не найдено, вставленная бронь удаляется и возвращается `sold_out`.",
      "**Параллельные покупатели:** второй `UPDATE` ждёт первого и **перепроверяет** `seats_left > 0` на новой версии строки (поведение `READ COMMITTED`), поэтому перепродажа невозможна; `CHECK` — страховка.",
      "**`transfer`:** `SELECT … ORDER BY id FOR UPDATE` блокирует обе строки в одном порядке — взаимоблокировок нет; перед списанием проверяется наличие обоих счетов, списание — `UPDATE … WHERE balance >= p_amount`.",
      "**Отказы без побочных эффектов:** любой `RETURN false` происходит до первого изменения или после отказа единственного `UPDATE`.",
    ),
    h("check.mjs"),
    code("js", `// check.mjs — проверка надёжности при параллельных запросах. Запуск: node check.mjs booking.sql
// (нужны PostgreSQL 16 и пакет pg: npm i pg; подключение — PGHOST, PGPORT, PGUSER, PGPASSWORD).
// Создаётся временная база; ваш файл загружается в неё, затем функции вызываются последовательно и из десятков параллельных соединений.
import { execFileSync } from "node:child_process";
import pg from "pg";

const file = process.argv[2];
if (!file) { console.error("usage: node check.mjs booking.sql"); process.exit(2); }

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });

const admin = new pg.Client({ database: "postgres" });
await admin.connect();
const dbName = "chk_" + Math.random().toString(36).slice(2, 10);
await admin.query(\`create database \${dbName}\`);
await admin.query(\`alter database \${dbName} set deadlock_timeout = '50ms'\`);   // быстрее обнаруживать взаимоблокировки

const clients = [];
const open = async () => { const k = new pg.Client({ database: dbName }); await k.connect(); clients.push(k); return k; };
// вызывает функцию в отдельном соединении; ошибки превращает в строку «ERR:код»
const call = async (k, text, params) => { try { return (await k.query(text, params)).rows[0].r; } catch (e) { return "ERR:" + e.code; } };
// детерминированный генератор псевдослучайных чисел
const rng = (seed) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

try {
  let loaded = true;
  try { execFileSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-d", dbName, "-f", file], { stdio: ["ignore", "ignore", "pipe"] }); }
  catch (e) { loaded = false; check("файл загружается без ошибок", false, String(e.stderr).split("\\n")[0]); }
  if (loaded) check("файл загружается без ошибок", true);

  const main = await open();
  const q = async (sql, params) => { try { return (await main.query(sql, params)).rows; } catch { return []; } };
  const num = async (sql, params) => (await q(sql, params))[0]?.n ?? null;

  for (const t of ["events", "bookings", "accounts"])
    check(\`таблица \${t} существует\`, (await q("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1", [t])).length === 1);
  for (const f of ["book_seat", "transfer"])
    check(\`функция \${f} существует\`, (await q("SELECT 1 FROM pg_proc WHERE proname=$1 AND pronamespace='public'::regnamespace", [f])).length === 1);

  // Начальные данные
  const seedSql = \`INSERT INTO events VALUES (1, 'Малый зал', 3), (2, 'Идемпотентность', 5), (3, 'Параллельный запрос', 10);
                   INSERT INTO events SELECT g, 'Большой зал ' || g, 10 FROM generate_series(10, 14) AS g;
                   INSERT INTO accounts SELECT g, 1000 FROM generate_series(1, 4) AS g\`;
  try { await main.query(seedSql); } catch { /* без таблиц следующие проверки покажут причину */ }
  const book = (ev, user, req) => call(main, "SELECT book_seat($1, $2, $3) AS r", [ev, user, req]);

  // Последовательно: три места и четвёртый покупатель
  const seq = [];
  for (let u = 1; u <= 4; u++) seq.push(await book(1, u, \`seq-\${u}\`));
  check("три места: booked, booked, booked, затем sold_out", seq.join() === "booked,booked,booked,sold_out", seq.join());
  check("остаток мест после продажи — 0", (await num("SELECT seats_left AS n FROM events WHERE id = 1")) === 0);
  check("при sold_out бронь не остаётся (броней 3)", (await num("SELECT count(*)::int AS n FROM bookings WHERE event_id = 1")) === 3);

  // Идемпотентность
  const r1 = await book(2, 1, "same-request"), r2 = await book(2, 1, "same-request");
  check("повтор запроса: booked, затем duplicate", r1 === "booked" && r2 === "duplicate", \`\${r1}, \${r2}\`);
  check("повтор запроса не уменьшает остаток второй раз (4 из 5)", (await num("SELECT seats_left AS n FROM events WHERE id = 2")) === 4);

  // Параллельные брони: 5 мероприятий по 10 мест, 40 покупателей на каждое одновременно
  const buyers = [];
  for (let i = 0; i < 40; i++) buyers.push(await open());
  for (let round = 0; round < 5; round++) {
    const ev = 10 + round;
    const out = await Promise.all(buyers.map((k, i) => call(k, "SELECT book_seat($1, $2, $3) AS r", [ev, 100 + i, \`par-\${ev}-\${i}\`])));
    const cnt = (s) => out.filter((x) => x === s).length;
    const errors = out.filter((x) => String(x).startsWith("ERR"));
    const left = await num("SELECT seats_left AS n FROM events WHERE id = $1", [ev]);
    const rows = await num("SELECT count(*)::int AS n FROM bookings WHERE event_id = $1", [ev]);
    check(\`40 покупателей на 10 мест (раунд \${round + 1}): продано ровно 10, остаток 0, броней 10, без ошибок\`,
      cnt("booked") === 10 && cnt("sold_out") === 30 && left === 0 && rows === 10 && errors.length === 0,
      \`booked=\${cnt("booked")}, sold_out=\${cnt("sold_out")}, остаток=\${left}, броней=\${rows}, ошибок=\${errors.length}\${errors[0] ? " (" + errors[0] + ")" : ""}\`);
  }
  // Один и тот же запрос из 20 соединений одновременно
  const same = await Promise.all(buyers.slice(0, 20).map((k) => call(k, "SELECT book_seat(3, 7, 'one-request') AS r")));
  check("20 одновременных повторов одного запроса: одна бронь и 19 duplicate",
    same.filter((x) => x === "booked").length === 1 && same.filter((x) => x === "duplicate").length === 19 && (await num("SELECT seats_left AS n FROM events WHERE id = 3")) === 9,
    \`booked=\${same.filter((x) => x === "booked").length}, duplicate=\${same.filter((x) => x === "duplicate").length}\`);

  // Переводы: последовательно
  const bal = async () => (await q("SELECT id, balance FROM accounts ORDER BY id")).map((r) => r.balance).join();
  const tr = (a, b, n) => call(main, "SELECT transfer($1, $2, $3) AS r", [a, b, n]);
  check("перевод 300: true, балансы 700 и 1300", (await tr(1, 2, 300)) === true && (await bal()) === "700,1300,1000,1000", await bal());
  const before = await bal();
  check("не хватает денег: false, балансы не изменились", (await tr(1, 2, 5000)) === false && (await bal()) === before, await bal());
  check("перевод на несуществующий счёт: false, деньги не списаны", (await tr(1, 99, 100)) === false && (await bal()) === before, await bal());
  check("нулевая и отрицательная суммы отклоняются (false)", (await tr(1, 2, 0)) === false && (await tr(1, 2, -5)) === false && (await bal()) === before);
  check("перевод самому себе отклоняется (false)", (await tr(3, 3, 10)) === false && (await bal()) === before);

  // Переводы: параллельно, встречные направления
  const payers = [];
  for (let i = 0; i < 24; i++) payers.push(await open());
  for (let round = 0; round < 3; round++) {
    const rnd = rng(1000 + round);
    const jobs = Array.from({ length: 200 }, () => { const a = 1 + Math.floor(rnd() * 4); let b = 1 + Math.floor(rnd() * 4); if (b === a) b = (a % 4) + 1; return [a, b, 1 + Math.floor(rnd() * 120)]; });
    // каждое соединение обрабатывает свою часть заданий по очереди, соединения работают одновременно
    const out = (await Promise.all(payers.map(async (k, w) => {
      const mine = [];
      for (let i = w; i < jobs.length; i += payers.length) mine.push(await call(k, "SELECT transfer($1, $2, $3) AS r", jobs[i]));
      return mine;
    }))).flat();
    const errors = out.filter((x) => String(x).startsWith("ERR"));
    check(\`200 встречных переводов (раунд \${round + 1}): ни одной ошибки (взаимоблокировки)\`, errors.length === 0, \`ошибок: \${errors.length}\${errors[0] ? " (" + errors[0] + ")" : ""}\`);
    const total = await num("SELECT sum(balance)::int AS n FROM accounts"), neg = await num("SELECT count(*)::int AS n FROM accounts WHERE balance < 0");
    check(\`после параллельных переводов (раунд \${round + 1}) сумма денег прежняя (4000), отрицательных балансов нет\`, total === 4000 && neg === 0, \`сумма=\${total}, отрицательных=\${neg}\`);
  }
} finally {
  for (const k of clients) { try { await k.end(); } catch {} }
  await admin.query(\`drop database \${dbName} with (force)\`);
  await admin.end();
}

const failed = results.filter((r) => !r.ok);
for (const r of failed) console.log(\`✗ \${r.name} — \${r.detail}\`);
console.log(\`Пройдено проверок: \${results.length - failed.length} из \${results.length}\`);
if (failed.length) console.log(\`Не прошли: \${failed.length}\`);
process.exit(failed.length ? 1 : 0);`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 28 из 28`, { filename: "результат node check.mjs solution.sql (PostgreSQL 16.14)" }),
    code("text", `✗ таблица bookings существует — 
✗ таблица accounts существует — 
✗ три места: booked, booked, booked, затем sold_out — ERR:P0001,ERR:P0001,ERR:P0001,ERR:P0001
✗ остаток мест после продажи — 0 — 
✗ при sold_out бронь не остаётся (броней 3) — 
✗ повтор запроса: booked, затем duplicate — ERR:P0001, ERR:P0001
✗ повтор запроса не уменьшает остаток второй раз (4 из 5) — 
✗ 40 покупателей на 10 мест (раунд 1): продано ровно 10, остаток 0, броней 10, без ошибок — booked=0, sold_out=0, остаток=null, броней=null, ошибок=40 (ERR:P0001)
✗ 40 покупателей на 10 мест (раунд 2): продано ровно 10, остаток 0, броней 10, без ошибок — booked=0, sold_out=0, остаток=null, броней=null, ошибок=40 (ERR:P0001)
✗ 40 покупателей на 10 мест (раунд 3): продано ровно 10, остаток 0, броней 10, без ошибок — booked=0, sold_out=0, остаток=null, броней=null, ошибок=40 (ERR:P0001)
✗ 40 покупателей на 10 мест (раунд 4): продано ровно 10, остаток 0, броней 10, без ошибок — booked=0, sold_out=0, остаток=null, броней=null, ошибок=40 (ERR:P0001)
✗ 40 покупателей на 10 мест (раунд 5): продано ровно 10, остаток 0, броней 10, без ошибок — booked=0, sold_out=0, остаток=null, броней=null, ошибок=40 (ERR:P0001)
✗ 20 одновременных повторов одного запроса: одна бронь и 19 duplicate — booked=0, duplicate=0
✗ перевод 300: true, балансы 700 и 1300 — 
✗ не хватает денег: false, балансы не изменились — 
✗ перевод на несуществующий счёт: false, деньги не списаны — 
✗ нулевая и отрицательная суммы отклоняются (false) — 
✗ перевод самому себе отклоняется (false) — 
✗ 200 встречных переводов (раунд 1): ни одной ошибки (взаимоблокировки) — ошибок: 200 (ERR:P0001)
✗ после параллельных переводов (раунд 1) сумма денег прежняя (4000), отрицательных балансов нет — сумма=null, отрицательных=null
✗ 200 встречных переводов (раунд 2): ни одной ошибки (взаимоблокировки) — ошибок: 200 (ERR:P0001)
✗ после параллельных переводов (раунд 2) сумма денег прежняя (4000), отрицательных балансов нет — сумма=null, отрицательных=null
✗ 200 встречных переводов (раунд 3): ни одной ошибки (взаимоблокировки) — ошибок: 200 (ERR:P0001)
✗ после параллельных переводов (раунд 3) сумма денег прежняя (4000), отрицательных балансов нет — сумма=null, отрицательных=null
Пройдено проверок: 4 из 28
Не прошли: 24`, { filename: "результат node check.mjs starter.sql (заготовка)" }),
    code("text", `b1-read-then-write: Пройдено проверок: 23 из 28
b2-no-idempotency: Пройдено проверок: 6 из 28
b3-lock-in-call-order: Пройдено проверок: 25 из 28
b4-debit-before-check: Пройдено проверок: 22 из 28
b5-no-balance-guard: Пройдено проверок: 21 из 28
b6-no-input-validation: Пройдено проверок: 27 из 28
b7-wrong-status-names: Пройдено проверок: 26 из 28
b8-oversell: Пройдено проверок: 20 из 28`, { filename: "результат check.mjs для вариантов с ошибками (mutants/)" }),
    tip("Проверка открывает до 40 соединений; убедитесь, что `max_connections` сервера достаточно. Для быстрого обнаружения взаимоблокировок временная база настраивается на `deadlock_timeout = 50ms`. Нужны `psql` в `PATH` и пакет `pg` (`npm i pg`)."),
    warn("Ошибки конкурентности вероятностны: тест, прошедший один раз, не доказывает корректность. Поэтому проверка повторяет сценарии несколькими раундами, а ваше решение должно быть корректным **по построению** (условие внутри `UPDATE`, единый порядок блокировок), а не «потому что тест зелёный»."),
  ],
};
