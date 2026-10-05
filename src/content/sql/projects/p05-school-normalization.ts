import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p05SchoolNormalization: Project = {
  id: "sql.p05-school-normalization",
  domain: "sql",
  order: 5,
  title: "Нормализация школы",
  subtitle: "Из плоской таблицы в 3НФ: схема с ключами и ограничениями, перенос данных и доказательство «без потерь» — проверка на 34 сценариях в PostgreSQL 16",
  level: "intermediate",
  estimatedHours: 10,
  buildsOn: ["sql.p01-shop-schema"],
  topics: ["sql.normalization", "sql.relationships", "sql.schema-patterns", "sql.keys-constraints", "sql.insert-update-delete"],
  objective:
    "Спроектировать нормализованную схему школы по плоской таблице `school_flat` и перенести в неё данные. Нужно найти функциональные зависимости, вынести факты в отдельные таблицы (`teachers`, `students`, `classes`, `enrollments`), связать их внешними ключами, закрепить ограничения и **доказать**, что соединение новых таблиц восстанавливает исходные строки ровно (`EXCEPT` в обе стороны даёт 0). Проект про то, что нормализация — это зависимости, ключи и проверка потерь, а не «разнести по таблицам».",
  scenario: [
    p("Школа ведёт записи в одной таблице: в каждой строке — ученик, его e-mail, класс, название класса, учитель, его кабинет, дата записи и оценка. Когда учитель переехал в другой кабинет, администратор исправил его в одной строке из восьми, и теперь в отчётах у учителя два кабинета. Нужно привести данные к третьей нормальной форме."),
    p("Вы пишете два файла: `schema.sql` (таблицы и ограничения) и `migrate.sql` (перенос данных). Проверка `check.mjs` создаёт временную базу, загружает `data.sql` (таблица `school_flat`, 24 строки), затем ваши файлы, и проверяет **34 факта**: структуру, отсутствие дублирующих столбцов, количество строк, соединение без потерь и поведение базы при вставках, изменениях и удалениях."),
    code("sql", `-- Исходная «простыня» школы: одна строка — одна запись ученика на класс. Всё повторяется в каждой строке
CREATE TABLE school_flat (
  lesson_id     integer PRIMARY KEY,
  student_id    integer NOT NULL,
  student_name  text    NOT NULL,
  student_email text    NOT NULL,
  class_id      integer NOT NULL,
  class_title   text    NOT NULL,
  teacher_id    integer NOT NULL,
  teacher_name  text    NOT NULL,
  teacher_room  text    NOT NULL,
  enrolled_on   date    NOT NULL,
  grade         integer
);
INSERT INTO school_flat VALUES
  (1, 1, 'Анна', 'anna@school.example', 11, 'Физика', 1, 'Ольга', '101', '2024-09-15', 4),
  (2, 1, 'Анна', 'anna@school.example', 12, 'История', 2, 'Павел', '202', '2024-09-16', 5),
  (3, 1, 'Анна', 'anna@school.example', 14, 'Химия', 2, 'Павел', '202', '2024-09-18', 2),
  (4, 2, 'Борис', 'boris@school.example', 12, 'История', 2, 'Павел', '202', '2024-09-19', NULL),
  (5, 2, 'Борис', 'boris@school.example', 13, 'Информатика', 3, 'Семён', '303', '2024-09-20', 3),
  (6, 2, 'Борис', 'boris@school.example', 10, 'Математика', 1, 'Ольга', '101', '2024-09-17', 5),
  (7, 3, 'Вера', 'vera@school.example', 13, 'Информатика', 3, 'Семён', '303', '2024-09-03', 5),
  (8, 3, 'Вера', 'vera@school.example', 14, 'Химия', 2, 'Павел', '202', '2024-09-04', 1),
  (9, 3, 'Вера', 'vera@school.example', 11, 'Физика', 1, 'Ольга', '101', '2024-09-01', NULL),
  (10, 4, 'Глеб', 'gleb@school.example', 14, 'Химия', 2, 'Павел', '202', '2024-09-07', 3),
  (11, 4, 'Глеб', 'gleb@school.example', 10, 'Математика', 1, 'Ольга', '101', '2024-09-03', NULL),
  (12, 4, 'Глеб', 'gleb@school.example', 12, 'История', 2, 'Павел', '202', '2024-09-05', 1),
  (13, 5, 'Дарья', 'darya@school.example', 10, 'Математика', 1, 'Ольга', '101', '2024-09-06', 1),
  (14, 5, 'Дарья', 'darya@school.example', 11, 'Физика', 1, 'Ольга', '101', '2024-09-07', 2),
  (15, 5, 'Дарья', 'darya@school.example', 13, 'Информатика', 3, 'Семён', '303', '2024-09-09', 4),
  (16, 6, 'Егор', 'egor@school.example', 11, 'Физика', 1, 'Ольга', '101', '2024-09-10', 4),
  (17, 6, 'Егор', 'egor@school.example', 12, 'История', 2, 'Павел', '202', '2024-09-11', 5),
  (18, 6, 'Егор', 'egor@school.example', 14, 'Химия', 2, 'Павел', '202', '2024-09-13', 2),
  (19, 7, 'Жанна', 'zhanna@school.example', 12, 'История', 2, 'Павел', '202', '2024-09-14', 2),
  (20, 7, 'Жанна', 'zhanna@school.example', 13, 'Информатика', 3, 'Семён', '303', '2024-09-15', 3),
  (21, 7, 'Жанна', 'zhanna@school.example', 10, 'Математика', 1, 'Ольга', '101', '2024-09-12', 5),
  (22, 8, 'Игорь', 'igor@school.example', 13, 'Информатика', 3, 'Семён', '303', '2024-09-18', NULL),
  (23, 8, 'Игорь', 'igor@school.example', 14, 'Химия', 2, 'Павел', '202', '2024-09-19', 1),
  (24, 8, 'Игорь', 'igor@school.example', 11, 'Физика', 1, 'Ольга', '101', '2024-09-16', 3);`, { filename: "data.sql", collapsed: true }),
    code("sql", `-- Заготовка проекта «Нормализация школы».
-- Опишите таблицы teachers, students, classes, enrollments в третьей нормальной форме (требования — в описании проекта).
-- Проверка: node check.mjs schema.sql migrate.sql   (данные — data.sql: плоская таблица school_flat)

-- TODO: CREATE TABLE teachers (…);
-- TODO: CREATE TABLE students (…);
-- TODO: CREATE TABLE classes (…);
-- TODO: CREATE TABLE enrollments (…);`, { filename: "starter/schema.sql" }),
    code("sql", `-- Перенесите данные из school_flat в новые таблицы (INSERT … SELECT DISTINCT …). Таблицу school_flat не удаляйте:
-- по ней проверка убеждается, что ничего не потеряно и не добавлено.

-- TODO: INSERT INTO teachers …;
-- TODO: INSERT INTO students …;
-- TODO: INSERT INTO classes …;
-- TODO: INSERT INTO enrollments …;`, { filename: "starter/migrate.sql" }),
    table(
      ["Зависимость", "Что она значит", "Куда выносим"],
      [
        ["`student_id → student_name, student_email`", "Имя и e-mail принадлежат ученику", "`students`"],
        ["`teacher_id → teacher_name, teacher_room`", "Имя и кабинет принадлежат учителю", "`teachers`"],
        ["`class_id → class_title, teacher_id`", "Название и преподаватель принадлежат классу", "`classes` (ссылка на `teachers`)"],
        ["`(student_id, class_id) → enrolled_on, grade`", "Дата записи и оценка принадлежат паре «ученик — класс»", "`enrollments` (составной ключ)"],
      ],
      "Функциональные зависимости школы",
    ),
  ],
  requirements: [
    "`schema.sql` создаёт таблицы `teachers(id, name, room)`, `students(id, name, email)`, `classes(id, title, teacher_id)`, `enrollments(student_id, class_id, enrolled_on, grade)` и загружается без ошибок после `data.sql`.",
    "У `teachers`, `students`, `classes` — первичный ключ `id`; у `enrollments` пара `(student_id, class_id)` уникальна (первичный ключ или `UNIQUE`).",
    "Внешние ключи: `classes.teacher_id → teachers`, `enrollments.student_id → students`, `enrollments.class_id → classes`; учителя с классами удалить нельзя.",
    "`students.email` уникален; `grade` — от 1 до 5 или `NULL`; все остальные столбцы обязательны.",
    "Дублирующих столбцов нет: в `enrollments` и `classes` не хранятся имя ученика, e-mail, название класса, имя и кабинет учителя.",
    "`migrate.sql` переносит данные запросами `INSERT … SELECT` (родители раньше детей) и **не удаляет** `school_flat`; после миграции: 3 учителя, 8 учеников, 5 классов, 24 записи.",
    "Соединение четырёх новых таблиц даёт ровно строки `school_flat`: обе проверки `EXCEPT` возвращают 0 строк.",
    "Аномалии исчезли: кабинет учителя меняется одной командой; ученика и учителя можно завести без записей и классов; удаление всех записей ученика не удаляет ученика.",
  ],
  constraints: [
    "Только стандартный SQL PostgreSQL 16: `CREATE TABLE` с ограничениями и `INSERT … SELECT`; без триггеров и функций.",
    "Названия таблиц и столбцов — в точности как в требованиях.",
    "Нельзя выписывать данные вручную (`VALUES`): перенос только запросами к `school_flat`.",
    "Нельзя менять `school_flat` и удалять её до проверки.",
    "Не добавляйте обязательных столбцов, которых нет в требованиях: проверка вставляет только перечисленные.",
  ],
  expected: [
    "`node check.mjs schema.sql migrate.sql` печатает `Пройдено проверок: 34 из 34`.",
    "Заготовка проходит 4 проверки из 34 (файлы загружаются, но таблиц нет).",
    "Каждый из восьми «плохих» вариантов проваливает от 1 до 3 проверок.",
    "Сравнение через `EXCEPT` в обе стороны даёт `0` и `0`.",
  ],
  technical: [
    "Сначала зависимости, потом таблицы: каждая левая часть зависимости — ключ новой таблицы, правая часть — её столбцы.",
    "Составной ключ `(student_id, class_id)` описывает запись ученика на класс: она уникальна и одновременно ссылается на две родительские таблицы.",
    "`INSERT … SELECT DISTINCT` схлопывает повторы: ученик, записанный на три класса, попадёт в `students` один раз.",
    "Порядок вставки определяют внешние ключи: `teachers` → `students` → `classes` → `enrollments`.",
    "Соединение без потерь проверяют `EXCEPT` в обе стороны: `A EXCEPT B` пуст, если в `A` нет строк, которых нет в `B`; нужны оба направления.",
    "`CHECK (grade BETWEEN 1 AND 5)` пропускает `NULL` (неизвестное значение не нарушает проверку); `NOT NULL` для `grade` не нужен.",
    "Транзитивная зависимость `class_id → teacher_id → teacher_room` разорвана: кабинет хранится у учителя, а не у класса.",
  ],
  acceptance: [
    "`node check.mjs schema.sql migrate.sql` — 34 из 34.",
    "Заготовка проходит 4 из 34; каждый из восьми плохих вариантов проваливает 1–3 проверки.",
    "Нет столбцов, дублирующих данные других таблиц; все четыре внешних ключа на месте.",
    "`school_flat` после миграции осталась нетронутой; обе проверки `EXCEPT` дают 0.",
  ],
  hints: [
    "Если загрузка `migrate.sql` падает на внешнем ключе, вы вставляете детей раньше родителей. Порядок: учителя, ученики, классы, записи.",
    "`SELECT DISTINCT teacher_id, teacher_name, teacher_room FROM school_flat` даёт ровно три строки — по числу учителей.",
    "Проверка «ничего не пропало» красная? Возможно, фильтр в `INSERT … SELECT` (например, `WHERE grade IS NOT NULL`) потерял записи без оценки.",
    "Проверка «ничего не добавилось» красная? Соединение дало лишние строки: ссылка на учителя в `classes` указывает не на того (неверное значение `teacher_id`).",
    "Если «дубль записи не отклонён», у `enrollments` нет уникальности пары: добавьте `PRIMARY KEY (student_id, class_id)`.",
    "Оценка 0 и 6 должны отклоняться `CHECK`, а `NULL` — приниматься.",
    "Проверьте себя: сколько раз имя «Анна» встречается в новых таблицах? Должно быть один.",
  ],
  advanced: [
    "Добавьте индексы по внешним ключам `classes.teacher_id` и `enrollments.class_id` и объясните, какие индексы PostgreSQL создал сам.",
    "Расширьте схему: класс ведёт несколько учителей (связь многие-ко-многим). Что изменится в таблицах и в проверке «без потерь»?",
    "Докажите 3НФ: выпишите все функциональные зависимости новых таблиц и покажите, что левая часть каждой — ключ.",
    "Найдите в данных вариант, при котором зависимость `class_id → teacher_id` нарушается, и напишите запрос-проверку зависимости (`HAVING count(DISTINCT …) > 1`).",
    "Спланируйте перенос на живой базе без простоя: расширить схему, двойная запись, заполнение пакетами, переключение, сужение.",
  ],
  failureModes: [
    "**Дублирующий столбец в `enrollments`:** `student_name` продолжает храниться в каждой записи, аномалия обновления возвращается (1 из 34).",
    "**Нет внешнего ключа `classes → teachers`:** класс с несуществующим учителем принимается, учителя с классами можно удалить (3 из 34).",
    "**Нет ключа записи:** ученик записывается на класс дважды, пара не уникальна (2 из 34).",
    "**Потерянные записи без оценки:** фильтр `WHERE grade IS NOT NULL` в миграции — строк меньше, соединение без потерь нарушено (2 из 34).",
    "**Кабинет скопирован в `classes`:** у одного учителя снова несколько кабинетов (1 из 34).",
    "**Нет `CHECK` на оценку:** принимаются 0 и 6 (2 из 34).",
    "**`email` не уникален:** два ученика с одним адресом (1 из 34).",
    "**Неверный учитель у классов:** `teacher_id` подставлен вручную, соединение даёт лишние и недостающие строки (2 из 34).",
  ],
  rubric: [
    { criterion: "Нормальные формы и зависимости", weight: 25, description: "Каждый факт хранится один раз; нет дублирующих столбцов; нет транзитивных зависимостей." },
    { criterion: "Ключи и связи", weight: 20, description: "Первичные ключи, составной ключ записи, внешние ключи, правила удаления." },
    { criterion: "Ограничения целостности", weight: 15, description: "`UNIQUE` на e-mail, `CHECK` на оценку, `NOT NULL`; корректные коды ошибок." },
    { criterion: "Миграция данных", weight: 25, description: "`INSERT … SELECT DISTINCT`, порядок вставки, соединение без потерь (`EXCEPT` 0 и 0), исходная таблица цела." },
    { criterion: "Читаемость", weight: 15, description: "Порядок таблиц, комментарии, выровненные определения, осмысленные имена." },
  ],
  solution: [
    p("Эталон — два файла: `schema.sql` (около 25 строк) и `migrate.sql` (4 запроса). Они проходят все 34 проверки; заготовка проходит 4 из 34, а каждый из восьми намеренно испорченных вариантов проваливает 1–3 проверки. Ниже — решение, проверяющий скрипт и результаты запусков на PostgreSQL 16.14."),
    h("schema.sql"),
    code("sql", `-- Школа в третьей нормальной форме: каждый факт хранится один раз
CREATE TABLE teachers (
  id   integer PRIMARY KEY,
  name text NOT NULL,
  room text NOT NULL
);

CREATE TABLE students (
  id    integer PRIMARY KEY,
  name  text NOT NULL,
  email text NOT NULL UNIQUE
);

CREATE TABLE classes (
  id         integer PRIMARY KEY,
  title      text    NOT NULL,
  teacher_id integer NOT NULL REFERENCES teachers (id)
);

CREATE TABLE enrollments (
  student_id  integer NOT NULL REFERENCES students (id),
  class_id    integer NOT NULL REFERENCES classes (id),
  enrolled_on date    NOT NULL,
  grade       integer CHECK (grade BETWEEN 1 AND 5),
  PRIMARY KEY (student_id, class_id)
);`, { filename: "schema.sql", lineNumbers: true }),
    h("migrate.sql"),
    code("sql", `-- Перенос данных из school_flat в нормализованные таблицы (родители раньше детей)
INSERT INTO teachers    SELECT DISTINCT teacher_id, teacher_name, teacher_room FROM school_flat;
INSERT INTO students    SELECT DISTINCT student_id, student_name, student_email FROM school_flat;
INSERT INTO classes     SELECT DISTINCT class_id, class_title, teacher_id FROM school_flat;
INSERT INTO enrollments SELECT student_id, class_id, enrolled_on, grade FROM school_flat;`, { filename: "migrate.sql", lineNumbers: true }),
    ul(
      "**Зависимости превращены в таблицы:** `teacher_id → name, room` — `teachers`; `student_id → name, email` — `students`; `class_id → title, teacher_id` — `classes`; пара «ученик — класс» — `enrollments`.",
      "**Порядок вставки** повторяет порядок зависимостей: учителя → ученики → классы → записи.",
      "**Доказательство «без потерь»** выполняет `check.mjs`: восстановленное соединение и `school_flat` сравниваются `EXCEPT` в обе стороны — 0 и 0.",
      "**Аномалий нет:** кабинет учителя меняется в одной строке, а ученик и учитель существуют без записей и классов.",
    ),
    h("check.mjs"),
    code("js", `// check.mjs — проверка нормализации. Запуск: node check.mjs schema.sql migrate.sql   (нужны PostgreSQL 16 и пакет pg: npm i pg)
// Подключение — переменные окружения PGHOST, PGPORT, PGUSER, PGPASSWORD. Создаётся и удаляется временная база:
// в неё по очереди загружаются data.sql (плоская таблица school_flat), ваш schema.sql и ваш migrate.sql.
import { execFileSync } from "node:child_process";
import pg from "pg";

const [schemaFile, migrateFile] = process.argv.slice(2);
if (!schemaFile || !migrateFile) { console.error("usage: node check.mjs schema.sql migrate.sql"); process.exit(2); }

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });

const admin = new pg.Client({ database: "postgres" });
await admin.connect();
const dbName = "chk_" + Math.random().toString(36).slice(2, 10);
await admin.query(\`create database \${dbName}\`);
const c = new pg.Client({ database: dbName });
await c.connect();
const load = (f) => execFileSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-d", dbName, "-f", f], { stdio: ["ignore", "ignore", "pipe"] });
const q = async (sql, params) => { try { return (await c.query(sql, params)).rows; } catch { return []; } };
const num = async (sql) => (await q(sql))[0]?.n ?? null;

try {
  load("data.sql");
  let ok = true;
  try { load(schemaFile); } catch (e) { ok = false; check("schema.sql загружается без ошибок", false, String(e.stderr).split("\\n")[0]); }
  if (ok) check("schema.sql загружается без ошибок", true);
  ok = true;
  try { load(migrateFile); } catch (e) { ok = false; check("migrate.sql выполняется без ошибок", false, String(e.stderr).split("\\n")[0]); }
  if (ok) check("migrate.sql выполняется без ошибок", true);

  // Структура
  const T = ["teachers", "students", "classes", "enrollments"];
  for (const t of T) check(\`таблица \${t} существует\`, (await q("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1", [t])).length === 1);
  for (const t of ["teachers", "students", "classes"])
    check(\`\${t}: есть первичный ключ из одного столбца\`, (await q("SELECT 1 FROM pg_index WHERE indrelid = to_regclass($1) AND indisprimary AND indnatts = 1", [t])).length === 1);
  check("enrollments: пара (student_id, class_id) уникальна (первичный ключ или UNIQUE)",
    (await q(\`SELECT 1 FROM pg_index i WHERE i.indrelid = to_regclass('enrollments') AND (i.indisprimary OR i.indisunique) AND i.indnatts = 2
              AND (SELECT array_agg(a.attname::text ORDER BY a.attname) FROM pg_attribute a WHERE a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)) = ARRAY['class_id','student_id']\`)).length >= 1);
  const fk = async (child, parent) => (await q(\`SELECT 1 FROM pg_constraint WHERE contype = 'f' AND conrelid = to_regclass($1) AND confrelid = to_regclass($2)\`, [child, parent])).length >= 1;
  check("внешний ключ classes → teachers", await fk("classes", "teachers"));
  check("внешний ключ enrollments → students", await fk("enrollments", "students"));
  check("внешний ключ enrollments → classes", await fk("enrollments", "classes"));

  // Нет избыточности: производные столбцы не дублируются в чужих таблицах
  const cols = async (t) => (await q("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1", [t])).map((r) => r.column_name);
  const bad = (have, list) => list.filter((x) => have.includes(x));
  const eCols = await cols("enrollments"), cCols = await cols("classes");
  check("enrollments не дублирует данные ученика, класса и учителя", bad(eCols, ["student_name", "student_email", "class_title", "teacher_id", "teacher_name", "teacher_room", "name", "email", "title", "room"]).length === 0, \`лишние столбцы: \${bad(eCols, ["student_name", "student_email", "class_title", "teacher_id", "teacher_name", "teacher_room", "name", "email", "title", "room"]).join(", ")}\`);
  check("classes не дублирует данные учителя", bad(cCols, ["teacher_name", "teacher_room", "room"]).length === 0, \`лишние столбцы: \${bad(cCols, ["teacher_name", "teacher_room", "room"]).join(", ")}\`);

  // Данные после миграции
  for (const [t, n] of [["teachers", 3], ["students", 8], ["classes", 5], ["enrollments", 24]]) {
    const got = await num(\`SELECT count(*)::int AS n FROM \${t}\`);
    check(\`\${t}: \${n} строк\`, got === n, \`строк: \${got}\`);
  }
  const restored = \`SELECT e.student_id, s.name AS student_name, s.email AS student_email, e.class_id, cl.title AS class_title, cl.teacher_id, t.name AS teacher_name, t.room AS teacher_room, e.enrolled_on, e.grade
                    FROM enrollments e JOIN students s ON s.id = e.student_id JOIN classes cl ON cl.id = e.class_id JOIN teachers t ON t.id = cl.teacher_id\`;
  const flat = "SELECT student_id, student_name, student_email, class_id, class_title, teacher_id, teacher_name, teacher_room, enrolled_on, grade FROM school_flat";
  check("соединение без потерь: ничего не пропало (flat EXCEPT restored = 0)", (await num(\`SELECT count(*)::int AS n FROM (\${flat} EXCEPT \${restored}) x\`)) === 0);
  check("соединение без потерь: ничего не добавилось (restored EXCEPT flat = 0)", (await num(\`SELECT count(*)::int AS n FROM (\${restored} EXCEPT \${flat}) x\`)) === 0);

  // Поведение: каждая команда выполняется в транзакции и откатывается
  const B = [
    ["e-mail ученика уникален", "INSERT INTO students (id, name, email) VALUES (99, 'Дубль', 'anna@school.example')", "23505"],
    ["ученика можно завести без записей на классы", "INSERT INTO students (id, name, email) VALUES (99, 'Новичок', 'new@school.example')", "ok"],
    ["учителя можно завести без классов", "INSERT INTO teachers (id, name, room) VALUES (99, 'Новый', '404')", "ok"],
    ["нельзя записать ученика на класс дважды", "INSERT INTO enrollments (student_id, class_id, enrolled_on, grade) VALUES (1, 11, '2024-09-30', 3)", "23505"],
    ["класс должен существовать", "INSERT INTO enrollments (student_id, class_id, enrolled_on) VALUES (1, 99, '2024-09-30')", "23503"],
    ["ученик должен существовать", "INSERT INTO enrollments (student_id, class_id, enrolled_on) VALUES (99, 10, '2024-09-30')", "23503"],
    ["у класса должен быть существующий учитель", "INSERT INTO classes (id, title, teacher_id) VALUES (99, 'Музыка', 99)", "23503"],
    ["нельзя удалить учителя, у которого есть классы", "DELETE FROM teachers WHERE id = 1", "23503"],
    ["оценка 6 недопустима", "UPDATE enrollments SET grade = 6 WHERE student_id = 1 AND class_id = 11", "23514"],
    ["оценка 0 недопустима", "UPDATE enrollments SET grade = 0 WHERE student_id = 1 AND class_id = 11", "23514"],
    ["оценка может быть неизвестной (NULL)", "UPDATE enrollments SET grade = NULL WHERE student_id = 1 AND class_id = 11", "ok"],
  ];
  for (const [name, sql, want] of B) {
    await c.query("BEGIN");
    let got = "ok";
    try { await c.query(sql); } catch (e) { got = e.code; }
    await c.query("ROLLBACK");
    check(name, got === want, \`ожидалось \${want}, получено \${got}\`);
  }
  // Аномалии исчезли: кабинет учителя меняется в одном месте
  await c.query("BEGIN");
  try {
    await c.query("UPDATE teachers SET room = '999' WHERE id = 1");
    const r = await c.query(\`SELECT count(DISTINCT t.room)::int AS rooms, count(*)::int AS rows FROM enrollments e JOIN classes cl ON cl.id = e.class_id JOIN teachers t ON t.id = cl.teacher_id WHERE t.id = 1\`);
    check("кабинет учителя меняется одной командой и согласован во всех его классах", r.rows[0].rooms === 1 && r.rows[0].rows > 0, JSON.stringify(r.rows[0]));
  } catch (e) { check("кабинет учителя меняется одной командой и согласован во всех его классах", false, e.message); }
  await c.query("ROLLBACK");
  await c.query("BEGIN");
  try {
    await c.query("DELETE FROM enrollments WHERE student_id = 1");
    const n = await num("SELECT count(*)::int AS n FROM students WHERE id = 1");
    check("после удаления всех записей ученик остаётся в базе", n === 1, \`учеников с id=1: \${n}\`);
  } catch (e) { check("после удаления всех записей ученик остаётся в базе", false, e.message); }
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
    code("text", `Пройдено проверок: 34 из 34`, { filename: "результат node check.mjs schema.sql migrate.sql (решение, PostgreSQL 16.14)" }),
    code("text", `✗ таблица teachers существует — 
✗ таблица students существует — 
✗ таблица classes существует — 
✗ таблица enrollments существует — 
✗ teachers: есть первичный ключ из одного столбца — 
✗ students: есть первичный ключ из одного столбца — 
✗ classes: есть первичный ключ из одного столбца — 
✗ enrollments: пара (student_id, class_id) уникальна (первичный ключ или UNIQUE) — 
✗ внешний ключ classes → teachers — 
✗ внешний ключ enrollments → students — 
✗ внешний ключ enrollments → classes — 
✗ teachers: 3 строк — строк: null
✗ students: 8 строк — строк: null
✗ classes: 5 строк — строк: null
✗ enrollments: 24 строк — строк: null
✗ соединение без потерь: ничего не пропало (flat EXCEPT restored = 0) — 
✗ соединение без потерь: ничего не добавилось (restored EXCEPT flat = 0) — 
✗ e-mail ученика уникален — ожидалось 23505, получено 42P01
✗ ученика можно завести без записей на классы — ожидалось ok, получено 42P01
✗ учителя можно завести без классов — ожидалось ok, получено 42P01
✗ нельзя записать ученика на класс дважды — ожидалось 23505, получено 42P01
✗ класс должен существовать — ожидалось 23503, получено 42P01
✗ ученик должен существовать — ожидалось 23503, получено 42P01
✗ у класса должен быть существующий учитель — ожидалось 23503, получено 42P01
✗ нельзя удалить учителя, у которого есть классы — ожидалось 23503, получено 42P01
✗ оценка 6 недопустима — ожидалось 23514, получено 42P01
✗ оценка 0 недопустима — ожидалось 23514, получено 42P01
✗ оценка может быть неизвестной (NULL) — ожидалось ok, получено 42P01
✗ кабинет учителя меняется одной командой и согласован во всех его классах — relation "teachers" does not exist
✗ после удаления всех записей ученик остаётся в базе — relation "enrollments" does not exist
Пройдено проверок: 4 из 34
Не прошли: 30`, { filename: "результат для заготовки" }),
    code("text", `b1-denormalized-enrollments: Пройдено проверок: 33 из 34
b2-no-class-teacher-fk: Пройдено проверок: 31 из 34
b3-enrollments-no-pk: Пройдено проверок: 32 из 34
b4-migrate-drops-ungraded: Пройдено проверок: 32 из 34
b5-room-copied-to-classes: Пройдено проверок: 33 из 34
b6-no-grade-check: Пройдено проверок: 32 из 34
b7-email-not-unique: Пройдено проверок: 33 из 34
b8-migrate-wrong-teacher: Пройдено проверок: 32 из 34`, { filename: "результат check.mjs для вариантов с ошибками (mutants/)" }),
    tip("Проверка выполняется на временной базе, которая создаётся и удаляется автоматически. Нужны `psql` в `PATH` и пакет `pg` (`npm i pg`); подключение — переменные `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`."),
    warn("Проверка `EXCEPT` доказывает отсутствие потерь **на этих данных**. Зависимости же берутся из правил предметной области: подумайте, какие из них могли бы нарушаться в реальной школе (например, два учителя на один класс), и заложите это в схему."),
  ],
};
