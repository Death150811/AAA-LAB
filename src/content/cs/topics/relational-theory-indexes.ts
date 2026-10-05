import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  tip,
  insight,
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

export const relationalTheoryIndexes: Topic = {
  id: "cs.relational-theory-indexes",
  slug: "relational-theory-indexes",
  domain: "cs",
  module: "databases",
  title: "Реляционная теория и индексы: алгебра, зависимости, соединения и структуры доступа",
  titleEn: "Relational Theory and Indexes: Algebra, Dependencies, Joins and Access Structures",
  summary:
    "SQL — это язык поверх математической модели: отношения как множества кортежей, алгебра операций, функциональные зависимости и нормальные формы. Тема связывает теорию с работой СУБД: реляционная алгебра и её эквиваленты в SQLite (результаты совпали), ключи и разложение в BCNF без потерь, алгоритмы соединения (вложенные циклы — 16 000 000 сравнений, хеш — 4000 проб, слияние — 87 635), индексы B-дерева на SQLite 3.45 (600 011 инструкций без индекса и 17 с индексом, правило левого префикса, покрывающие индексы, функция над столбцом), цена записи (страниц 949 → 2415), фильтр Блума (ложных срабатываний 0,795 % при 10 бит/ключ, теория 0,819 %), LSM-дерево и выбор порядка соединений оптимизатором (разница между лучшим и худшим порядком — 84 раза, неверная оценка — в 8 раз).",
  minutes: 120,
  prerequisites: ["cs.trees-heaps", "cs.hash-tables", "cs.searching-sorting"],
  tags: ["реляционная алгебра", "функциональные зависимости", "нормальные формы", "BCNF", "соединения", "индексы", "B-дерево", "покрывающий индекс", "фильтр Блума", "LSM-дерево", "оптимизатор"],
  keyConcepts: [
    { term: "Отношение — множество", text: "Проекция `π city (Student)` из 4 кортежей даёт 3: дубликаты исчезают; SQL с `DISTINCT` даёт то же. Выборка до соединения уменьшила число сравнений с 90 000 до 1800 (в 50 раз) при том же результате." },
    { term: "Зависимости и ключи", text: "Для R(O, C, N, P, T, Q) с `O→C`, `C→N`, `P→T`, `OP→Q` единственный ключ — `OP`; разложение в BCNF — R(CN), R(CO), R(PT), R(OPQ) — соединяется обратно без потерь, а «плохое» разложение даёт 7 строк вместо 4." },
    { term: "Алгоритмы соединения", text: "R и S по 4000 строк: вложенные циклы — 16 000 000 сравнений, хеш-соединение — 4000 проб, сортировка + слияние — 87 635, индексные вложенные циклы — 55 765; результат один — 7842 строки." },
    { term: "Индекс — поиск вместо просмотра", text: "200 000 строк: `SCAN users` — 600 011 инструкций виртуальной машины, `SEARCH … USING INDEX` — 17 (в 35 294 раза меньше); индекс по email занимает 1391 страницу при 2065 у таблицы." },
    { term: "Индекс не всегда помогает", text: "Составной индекс `(city, age)` не ищет по одному `age` (правило левого префикса), `lower(email) = ?` игнорирует индекс по `email`, а при выборке половины таблицы поиск по индексу медленнее полного просмотра (около 21 мс против 7,5 мс)." },
    { term: "Цена записи", text: "Вставка 100 000 строк: без индексов около 0,07 с и 949 страниц, с тремя индексами около 0,3 с и 2415 страниц (рост в 2,5 раза)." },
    { term: "Порядок соединений и оценки", text: "Для запроса из 4 таблиц лучший порядок стоит 62 500 условных единиц, худший — 5 252 500 (в 84 раза); неверная оценка селективности привела к плану, который в 8 раз хуже." },
  ],
  sections: [
    section("definition", [
      def("Отношение", "Математический объект: множество кортежей одной схемы (набора именованных атрибутов). В отличие от таблицы SQL, в отношении нет порядка строк и нет дубликатов.", "relation"),
      def("Реляционная алгебра", "Набор операций над отношениями: выборка σ, проекция π, переименование ρ, произведение ×, соединение ⋈, объединение ∪, разность −, деление ÷. Любой запрос SQL без агрегатов и NULL выражается алгеброй.", "relational algebra"),
      def("Функциональная зависимость", "Утверждение `X → Y`: значения атрибутов `X` однозначно определяют значения `Y` (две строки с равными `X` имеют равные `Y`).", "functional dependency"),
      def("Потенциальный ключ", "Минимальное множество атрибутов, замыкание которого — вся схема. Первичный ключ — выбранный потенциальный ключ.", "candidate key"),
      def("Нормальная форма", "Условие на схему, исключающее аномалии: 3НФ — для каждой зависимости левая часть суперключ или правая часть — простой атрибут; BCNF — левая часть всегда суперключ.", "normal form"),
      def("Разложение без потерь", "Разбиение схемы на части, из которых соединение частей воссоздаёт исходное отношение без лишних строк.", "lossless decomposition"),
      def("Индекс", "Вспомогательная структура (B-дерево, хеш-таблица, LSM-дерево), ускоряющая поиск по ключу ценой места и замедления записи.", "index"),
      def("Покрывающий индекс", "Индекс, содержащий все столбцы запроса: данные берутся из индекса без обращения к таблице.", "covering index"),
      def("Оптимизатор запросов", "Часть СУБД, выбирающая план выполнения: порядок и алгоритмы соединений, способы доступа к данным, по оценке стоимости на основе статистики.", "query optimizer"),
    ]),

    section("why", [
      h("Что даёт теория тому, кто пишет SQL"),
      p("Теория отвечает на вопросы «почему». Почему таблицу нужно разбивать, а не хранить «всё в одной»? Почему запрос с индексом иногда медленнее? Почему два эквивалентных запроса работают по-разному и почему СУБД вообще имеет право выбирать план? Ответы лежат в алгебре, зависимостях и стоимости операций."),
      ul(
        "**Проектирование схем:** функциональные зависимости, ключи и нормальные формы объясняют, откуда берутся аномалии и как их исключить (подробно с практикой — [нормализация в SQL](/learn/sql/normalization)).",
        "**Понимание запросов:** SQL декларативен — вы описываете результат, а алгебра позволяет СУБД менять порядок операций (выборку раньше соединения — в 50 раз меньше работы).",
        "**Производительность:** выбор алгоритма соединения и индекса определяет разницу в тысячи раз (4000 проб против 16 000 000 сравнений).",
        "**Диагностика:** чтение планов (`EXPLAIN`), оценка стоимости и понимание, почему оптимизатор ошибается ([планы выполнения](/learn/sql/explain-plans)).",
        "**Выбор хранилища:** B-дерево, хеш, LSM и фильтры Блума — разные компромиссы между чтением, записью и местом; от них зависит, какую систему брать под задачу.",
      ),
      tip("Три вопроса о запросе: какие отношения и условия в нём участвуют (алгебра), каким алгоритмом их соединяют (стоимость) и какие индексы позволяют не читать лишнего (структуры доступа)."),
    ]),

    section("mental-model", [
      h("От SQL к плану"),
      diagram(
        `
        SQL-запрос                    логический план (алгебра)                 физический план
        SELECT name, title      π name,title                                  HashJoin(Enroll, Course)
        FROM Student            └─ ⋈ Course                                    └─ HashJoin(Student, Enroll)
        JOIN Enroll USING(sid)       └─ ⋈ Enroll                                    └─ IndexScan(Student.city = 'Казань')
        JOIN Course USING(cid)            └─ σ city='Казань' (Student)
        WHERE city = 'Казань'

        оптимизатор: переписывает по эквивалентностям (выборка раньше соединения), оценивает стоимость вариантов
        по статистике (число строк, различные значения) и выбирает самый дешёвый физический план
        `,
        "Логический план задаёт, что вычислить, физический — как: порядок соединений, алгоритмы и индексы.",
      ),
      h("Индекс как упорядоченная копия части данных"),
      diagram(
        `
        таблица users (по порядку вставки)            индекс idx_email (отсортирован по ключу)
        ┌────┬──────────────────┬─────┐              ┌────────────────────────┬─────┐
        │ id │ email            │ ... │              │ user100@mail.test      │ 100 │ → указатель на строку
        │ 7  │ user7@mail.test  │     │              │ user1000@mail.test     │ 1000│
        │ 3  │ user3@mail.test  │     │    ─────►    │ user3@mail.test        │ 3   │   поиск: ~log n шагов
        └────┴──────────────────┴─────┘              └────────────────────────┴─────┘
        цена: индекс — отдельные страницы (1391 при 2065 у таблицы в замере) и дополнительная запись при каждой вставке
        `,
        "Индекс превращает поиск `O(n)` в `O(log n)`, но является вторым хранилищем, которое нужно обновлять при каждой записи.",
      ),
      insight("Вся теория баз данных — компромисс между тремя ресурсами: чтением, записью и местом. Индексы, нормализация и оптимизатор — способы выбрать выгодную точку компромисса для конкретной нагрузки."),
    ]),

    section("technical", [
      h("Реляционная алгебра"),
      table(
        ["Операция", "Запись", "SQL", "Замечание"],
        [
          ["Выборка", "σ_{city='Казань'}(Student)", "`WHERE`", "Оставляет строки, удовлетворяющие условию"],
          ["Проекция", "π_{name}(R)", "`SELECT DISTINCT`", "Выбирает столбцы; дубликаты исчезают"],
          ["Переименование", "ρ_{x/y}(R)", "`AS`", "Меняет имена атрибутов"],
          ["Произведение", "R × S", "`CROSS JOIN`", "Все пары кортежей (`|R|·|S|` строк)"],
          ["Естественное соединение", "R ⋈ S", "`JOIN … USING`", "Пары с равными значениями общих атрибутов"],
          ["Объединение, пересечение, разность", "R ∪ S, R ∩ S, R − S", "`UNION`, `INTERSECT`, `EXCEPT`", "Схемы должны совпадать"],
          ["Деление", "R ÷ S", "двойное `NOT EXISTS`", "«Для всех»: студенты, записанные на все курсы"],
        ],
        "Операции реляционной алгебры и их эквиваленты в SQL",
      ),
      ul(
        "**Эквивалентные преобразования:** соединение коммутативно и ассоциативно; выборку можно «протолкнуть» внутрь соединения; проекцию — вниз по дереву. На этом строятся оптимизации.",
        "**Различие SQL и алгебры:** SQL оперирует мультимножествами (дубликаты допустимы), упорядочением (`ORDER BY`) и значением `NULL` с трёхзначной логикой (`NULL = NULL` — `UNKNOWN`).",
      ),
      h("Функциональные зависимости и нормальные формы"),
      ul(
        "**Замыкание** `X⁺` — все атрибуты, определяемые `X` по зависимостям (алгоритм: пока можно, добавлять правые части зависимостей, левые части которых уже в замыкании).",
        "**Ключ** — минимальный `X` с `X⁺ = R`; атрибут, входящий в какой-либо ключ, называется простым.",
        "**3НФ:** для каждой нетривиальной зависимости `X → A` либо `X` — суперключ, либо `A` — простой атрибут. **BCNF:** `X` — всегда суперключ. BCNF строже; разложение в BCNF не всегда сохраняет все зависимости.",
        "**Аномалии без нормализации:** избыточность, обновления (противоречия), вставки (нельзя записать факт без другого), удаления (потеря сведений).",
        "**Разложение без потерь:** соединение частей даёт исходное отношение; для двух частей достаточно, чтобы пересечение их атрибутов было ключом одной из частей.",
        "**Денормализация** осознанно возвращает избыточность ради скорости чтения (хранимые итоги, копии полей) и требует контроля согласованности.",
      ),
      h("Алгоритмы соединения"),
      table(
        ["Алгоритм", "Идея", "Стоимость", "Когда выгоден"],
        [
          ["Вложенные циклы", "Для каждой строки R перебрать S", "`O(|R|·|S|)`", "Малое внутреннее отношение; нет индекса и данных мало"],
          ["Индексные вложенные циклы", "Для каждой строки R искать в индексе S", "`O(|R|·log|S|)`", "Есть индекс; мало строк во внешнем отношении"],
          ["Хеш-соединение", "Построить хеш-таблицу меньшего отношения, пробить большим", "`O(|R| + |S|)`, память под таблицу", "Равенство по ключу, нет индекса"],
          ["Сортировка и слияние", "Отсортировать оба, пройти параллельно", "`O(n log n)` или `O(n)` при готовой сортировке", "Результат нужен упорядоченным; уже отсортированные входы; неравенства"],
        ],
        "Алгоритмы соединения",
      ),
      h("Индексы и структуры доступа"),
      ul(
        "**B-дерево** — основной индекс СУБД: сбалансированное дерево с узлами размером в страницу; поиск, диапазоны и сортировка за `O(log n)`; подробнее — [индексы и B-деревья](/learn/sql/indexes-btree).",
        "**Составной индекс `(a, b)`** упорядочен по `a`, затем по `b`: используется для условий на `a` и на `a` вместе с `b` (правило левого префикса), но не на одно `b`.",
        "**Покрывающий индекс** избавляет от обращения к таблице; **индекс по выражению** нужен, когда условие вычисляет функцию над столбцом.",
        "**Хеш-индекс:** только равенство; **фильтр Блума:** быстрый ответ «точно нет» ценой небольшой доли ложных «возможно»; **LSM-дерево:** запись в память и последовательные слияния на диске — быстрая запись, чтение через несколько наборов и фильтры.",
        "**Избирательность** (селективность): доля строк, оставшихся после условия. Индекс полезен, когда условие отсеивает основную часть таблицы; при половине строк просмотр таблицы дешевле.",
      ),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `
          -- индекс по одному столбцу и составной индекс
          CREATE INDEX idx_email ON users(email);
          CREATE INDEX idx_city_age ON users(city, age);
          -- индекс по выражению: для WHERE lower(email) = ?
          CREATE INDEX idx_email_lower ON users(lower(email));
          -- план запроса и статистика оптимизатора
          EXPLAIN QUERY PLAN SELECT id FROM users WHERE email = 'user1@mail.test';
          ANALYZE;
          -- принудительно: полный просмотр и конкретный индекс
          SELECT count(*) FROM users NOT INDEXED WHERE active = 1;
          SELECT count(*) FROM users INDEXED BY idx_active WHERE active = 1;
        `,
        [
          { line: 2, text: "Индекс по одному столбцу ускоряет равенство и диапазоны по нему." },
          { line: 3, text: "Составной индекс: порядок столбцов важен — `city` слева." },
          { line: 5, text: "Индекс по выражению применяется, только если запрос содержит то же выражение." },
          { line: 7, text: "`EXPLAIN QUERY PLAN` показывает, какой способ доступа выбрал планировщик (`SCAN` или `SEARCH`)." },
          { line: 8, text: "`ANALYZE` собирает статистику (`sqlite_stat1`): число строк и среднее число строк на значение ключа." },
          { line: 10, text: "`NOT INDEXED` запрещает индексы — удобный способ измерить полный просмотр." },
          { line: 11, text: "`INDEXED BY` принуждает использовать указанный индекс — для диагностики и экспериментов, не для постоянного кода." },
        ],
        "Индексы и планы в SQLite",
      ),
    ]),

    section("minimal-example", [
      h("Реляционная алгебра и SQL дают одно и то же"),
      code("js", `// Реляционная алгебра на множествах кортежей и проверка тех же выражений на SQLite (node:sqlite)
import { DatabaseSync } from "node:sqlite";
const key = (t) => JSON.stringify(Object.entries(t).sort(([a], [b]) => (a < b ? -1 : 1)));
const rel = (rows) => { const m = new Map(); for (const r of rows) m.set(key(r), r); return [...m.values()]; };            // отношение — множество: дубликаты исчезают
const select = (R, pred) => R.filter(pred);                                                                              // σ
const project = (R, attrs) => rel(R.map((t) => Object.fromEntries(attrs.map((a) => [a, t[a]]))));                        // π (с удалением дубликатов)
const rename = (R, map) => R.map((t) => Object.fromEntries(Object.entries(t).map(([k, v]) => [map[k] ?? k, v])));        // ρ
const product = (R, S) => R.flatMap((r) => S.map((s) => ({ ...r, ...s })));                                              // ×
const natural = (R, S) => { const common = R.length && S.length ? Object.keys(R[0]).filter((a) => a in S[0]) : []; return rel(R.flatMap((r) => S.filter((s) => common.every((a) => r[a] === s[a])).map((s) => ({ ...r, ...s })))); };   // ⋈
const union = (R, S) => rel([...R, ...S]); const diff = (R, S) => { const k = new Set(S.map(key)); return R.filter((t) => !k.has(key(t))); };   // ∪, −
const names = (R, a) => R.map((t) => t[a]).sort().join(", ");

const Student = [{ sid: 1, name: "Анна", city: "Казань" }, { sid: 2, name: "Борис", city: "Омск" }, { sid: 3, name: "Вера", city: "Казань" }, { sid: 4, name: "Глеб", city: "Томск" }];
const Course = [{ cid: 10, title: "Алгебра" }, { cid: 20, title: "Базы данных" }, { cid: 30, title: "Сети" }];
const Enroll = [{ sid: 1, cid: 10 }, { sid: 1, cid: 20 }, { sid: 1, cid: 30 }, { sid: 2, cid: 20 }, { sid: 3, cid: 10 }, { sid: 3, cid: 20 }];

const db = new DatabaseSync(":memory:");
db.exec("create table Student(sid int, name text, city text); create table Course(cid int, title text); create table Enroll(sid int, cid int)");
for (const s of Student) db.prepare("insert into Student values (?,?,?)").run(s.sid, s.name, s.city);
for (const c of Course) db.prepare("insert into Course values (?,?)").run(c.cid, c.title);
for (const e of Enroll) db.prepare("insert into Enroll values (?,?)").run(e.sid, e.cid);
const sql = (q) => db.prepare(q).all().map((r) => ({ ...r }));
const same = (A, B) => JSON.stringify(rel(A).map(key).sort()) === JSON.stringify(rel(B).map(key).sort());

console.log("отношения: Student(sid, name, city) — 4 кортежа, Course(cid, title) — 3, Enroll(sid, cid) — 6\\n");
const tests = [
  ["σ city='Казань' (Student)", select(Student, (t) => t.city === "Казань"), "select * from Student where city='Казань'"],
  ["π city (Student) — дубликаты исчезают", project(Student, ["city"]), "select distinct city from Student"],
  ["Student ⋈ Enroll ⋈ Course, затем π name,title", project(natural(natural(Student, Enroll), Course), ["name", "title"]), "select distinct name, title from Student join Enroll using(sid) join Course using(cid)"],
  ["π sid (Student) − π sid (Enroll): студенты без курсов", diff(project(Student, ["sid"]), project(Enroll, ["sid"])), "select sid from Student except select sid from Enroll"],
  ["π sid (Enroll) ∪ π sid (σ city='Омск' Student)", union(project(Enroll, ["sid"]), project(select(Student, (t) => t.city === "Омск"), ["sid"])), "select sid from Enroll union select sid from Student where city='Омск'"],
];
for (const [label, mine, q] of tests) console.log(label.padEnd(60), "→", String(mine.length).padStart(2), "кортежа(ов); совпадает с SQLite:", same(mine, sql(q)) ? "да" : "нет");

// деление: студенты, записанные на ВСЕ курсы
const all = project(Course, ["cid"]);
const candidates = project(Enroll, ["sid"]);
const missing = project(diff(product(candidates, all), Enroll), ["sid"]);                   // тех, у кого не хватает хотя бы одной пары
const division = diff(candidates, missing);
const divSql = sql("select sid from Student s where not exists (select 1 from Course c where not exists (select 1 from Enroll e where e.sid = s.sid and e.cid = c.cid))");
console.log("\\nделение Enroll ÷ π cid (Course): студенты на всех курсах →", names(division.map((t) => Student.find((s) => s.sid === t.sid)), "name"), "; SQL (двойное NOT EXISTS) даёт то же:", same(division, divSql) ? "да" : "нет");

// эквивалентные преобразования: проталкивание выборки внутрь соединения
const N = 300;
const Big1 = Array.from({ length: N }, (_, i) => ({ k: i, g: i % 50 })), Big2 = Array.from({ length: N }, (_, i) => ({ k: i, v: i * 7 }));
let ops1 = 0, ops2 = 0;
const nl = (R, S, c) => { const out = []; for (const r of R) for (const s of S) { c.n++; if (r.k === s.k) out.push({ ...r, ...s }); } return out; };
const c1 = { n: 0 }, c2 = { n: 0 };
const a = nl(Big1, Big2, c1).filter((t) => t.g === 7);                                   // сначала соединение, потом выборка
const b = nl(Big1.filter((t) => t.g === 7), Big2, c2);                                   // сначала выборка, потом соединение
console.log("\\nσ(R ⋈ S) и σ(R) ⋈ S дают один результат:", same(a, b) ? "да" : "нет", "(" + a.length + " кортежей); сравнений при вложенных циклах:", c1.n, "против", c2.n, "— выборка раньше уменьшает работу в", (c1.n / c2.n).toFixed(0), "раз");
console.log("свойства: соединение коммутативно и ассоциативно:", same(natural(natural(Student, Enroll), Course), natural(Student, natural(Enroll, Course))) ? "да" : "нет", "; π и σ не коммутируют, если выборка использует отброшенный атрибут");
console.log("NULL в SQL: значение NULL ≠ NULL; (NULL = NULL) даёт UNKNOWN:", JSON.stringify(sql("select (null = null) as eq, (null is null) as is_null")[0]), "(в чистой алгебре NULL нет — это расширение SQL)");`, { filename: "01-algebra.mjs", collapsed: true }),
      code("text", `отношения: Student(sid, name, city) — 4 кортежа, Course(cid, title) — 3, Enroll(sid, cid) — 6

σ city='Казань' (Student)                                    →  2 кортежа(ов); совпадает с SQLite: да
π city (Student) — дубликаты исчезают                        →  3 кортежа(ов); совпадает с SQLite: да
Student ⋈ Enroll ⋈ Course, затем π name,title                →  6 кортежа(ов); совпадает с SQLite: да
π sid (Student) − π sid (Enroll): студенты без курсов        →  1 кортежа(ов); совпадает с SQLite: да
π sid (Enroll) ∪ π sid (σ city='Омск' Student)               →  3 кортежа(ов); совпадает с SQLite: да

деление Enroll ÷ π cid (Course): студенты на всех курсах → Анна ; SQL (двойное NOT EXISTS) даёт то же: да

σ(R ⋈ S) и σ(R) ⋈ S дают один результат: да (6 кортежей); сравнений при вложенных циклах: 90000 против 1800 — выборка раньше уменьшает работу в 50 раз
свойства: соединение коммутативно и ассоциативно: да ; π и σ не коммутируют, если выборка использует отброшенный атрибут
NULL в SQL: значение NULL ≠ NULL; (NULL = NULL) даёт UNKNOWN: {"eq":null,"is_null":1} (в чистой алгебре NULL нет — это расширение SQL)`, { filename: "алгебра на JavaScript и проверка в SQLite (node:sqlite)" }),
      ul(
        "Выражения алгебры — `σ`, `π`, `⋈`, `∪`, `−`, деление — вычислены на множествах кортежей и сверены с эквивалентными запросами SQLite: **совпали все**. Проекция `π city` из 4 студентов даёт 3 кортежа — дубликаты исчезают; деление отвечает «студенты на всех курсах» (Анна) и совпадает с двойным `NOT EXISTS`.",
        "**Проталкивание выборки:** `σ(R ⋈ S)` и `σ(R) ⋈ S` дают одинаковые 6 кортежей, но при вложенных циклах первый вариант делает 90 000 сравнений, второй — 1800: **в 50 раз меньше**. Это основа оптимизации: СУБД имеет право переставлять операции, пока результат тот же.",
        "Соединение коммутативно и ассоциативно; `NULL` в SQL даёт `UNKNOWN` (`NULL = NULL` — не истина) — расширение, которого нет в чистой алгебре.",
      ),
    ]),

    section("detailed-example", [
      h("Зависимости, ключи и разложение в BCNF"),
      code("js", `// Функциональные зависимости, ключи, нормальные формы и разложение без потерь (алгоритмы на множествах атрибутов)
const S = (s) => new Set(s.split(""));                                   // атрибуты — одиночные буквы
const str = (set) => [...set].sort().join("");
const FD = (txt) => txt.split(",").map((x) => x.trim().split("->").map((p) => p.trim())).map(([l, r]) => ({ l: S(l), r: S(r) }));
function closure(attrs, fds) {                                            // замыкание множества атрибутов
  const res = new Set(attrs); let changed = true;
  while (changed) { changed = false; for (const { l, r } of fds) if ([...l].every((a) => res.has(a)) && ![...r].every((a) => res.has(a))) { r.forEach((a) => res.add(a)); changed = true; } }
  return res;
}
const subsets = (arr) => arr.reduce((acc, x) => acc.concat(acc.map((s) => [...s, x])), [[]]);
function candidateKeys(R, fds) {
  const keys = [];
  for (const sub of subsets([...R]).sort((a, b) => a.length - b.length)) {
    if (!sub.length) continue;
    if (keys.some((k) => [...k].every((a) => sub.includes(a)))) continue;     // надмножество уже найденного ключа — не минимально
    if ([...closure(sub, fds)].length === R.size) keys.push(new Set(sub));
  }
  return keys;
}
function violatesBCNF(R, fds) {                                           // нетривиальная зависимость, левая часть которой не суперключ
  return fds.filter(({ l, r }) => { const rr = [...r].filter((a) => !l.has(a)); return rr.length && [...closure(l, fds)].length !== R.size && [...l].every((a) => R.has(a)) && [...r].every((a) => R.has(a)); });
}
function projectFDs(Rsub, fds) {                                          // зависимости, действующие внутри подмножества атрибутов
  const out = [];
  for (const sub of subsets([...Rsub]).filter((x) => x.length)) { const c = closure(sub, fds); const rhs = [...c].filter((a) => Rsub.has(a) && !sub.includes(a)); if (rhs.length) out.push({ l: new Set(sub), r: new Set(rhs) }); }
  return out;
}
function bcnf(R, fds) {
  const bad = violatesBCNF(R, projectFDs(R, fds));
  if (!bad.length) return [R];
  const { l } = bad[0]; const c = [...closure(l, fds)].filter((a) => R.has(a));
  const R1 = new Set(c), R2 = new Set([...R].filter((a) => !c.includes(a) || l.has(a)));
  return [...bcnf(R1, fds), ...bcnf(R2, fds)];
}
const show = (fds) => fds.map(({ l, r }) => str(l) + "→" + str(r)).join(", ");

// Пример: R(O, C, N, P, T, Q): заказ O, клиент C, город клиента N, товар P, цена товара T, количество Q
//   O → C (у заказа один клиент), C → N (у клиента один город), P → T (у товара одна цена), OP → Q
const R = S("OCNPTQ"), fds = FD("O->C, C->N, P->T, OP->Q");
console.log("R(O заказ, C клиент, N город клиента, P товар, T цена товара, Q количество); зависимости:", show(fds));
console.log("замыкание {O}+ =", str(closure(S("O"), fds)), "; {OP}+ =", str(closure(S("OP"), fds)));
const keys = candidateKeys(R, fds);
console.log("потенциальные ключи:", keys.map(str).join(", "), "(OP определяет все атрибуты, меньше нельзя)");
console.log("нарушения BCNF (левая часть не ключ):", show(violatesBCNF(R, fds)));
const parts = bcnf(R, fds);
console.log("разложение в BCNF:", parts.map((p) => "R(" + str(p) + ")").join(", "));

// Проверка без потерь на данных: исходное отношение и результат соединения частей
const data = [
  { O: 1, C: "Анна", N: "Казань", P: "ручка", T: 10, Q: 2 }, { O: 1, C: "Анна", N: "Казань", P: "блокнот", T: 50, Q: 1 },
  { O: 2, C: "Борис", N: "Омск", P: "ручка", T: 10, Q: 5 }, { O: 3, C: "Анна", N: "Казань", P: "ручка", T: 10, Q: 1 },
];
const proj = (rows, attrs) => { const m = new Map(); for (const r of rows) { const t = Object.fromEntries([...attrs].map((a) => [a, r[a]])); m.set(JSON.stringify(t), t); } return [...m.values()]; };
const join = (A, B) => { const m = new Map(); for (const a of A) for (const b of B) { const common = Object.keys(a).filter((k) => k in b); if (common.every((k) => a[k] === b[k])) { const t = { ...a, ...b }; m.set(JSON.stringify(Object.entries(t).sort()), t); } } return [...m.values()]; };
const canon = (rows) => rows.map((r) => JSON.stringify(Object.entries(r).sort())).sort();
const pieces = parts.map((p) => proj(data, p));
const back = pieces.reduce((acc, x) => join(acc, x));
console.log("исходных строк:", data.length, "; части:", parts.map((p, i) => str(p) + " — " + pieces[i].length + " строк").join("; "));
console.log("соединение частей восстанавливает исходное отношение без потерь и без лишних строк:", JSON.stringify(canon(back)) === JSON.stringify(canon(data)) ? "да" : "нет");

// Плохое разложение: R1(C,P) и R2(O,C,N,T,Q): общий атрибут C не является ключом ни одной из частей
const bad1 = proj(data, S("CP")), bad2 = proj(data, S("OCNTQ"));
const badBack = join(bad1, bad2);
console.log("«плохое» разложение по (C,P) и (O,C,N,T,Q): соединение даёт", badBack.length, "строк вместо", data.length, "— появились лишние (ложные) кортежи:", badBack.length > data.length ? "да" : "нет");
console.log("критерий без потерь для двух частей: общие атрибуты должны быть ключом хотя бы одной из частей (R1 ∩ R2 → R1 или R2)");

// Аномалии денормализованной таблицы
console.log("\\nаномалии в таблице R (исходный вид):");
console.log("  избыточность: город «Казань» записан", data.filter((r) => r.N === "Казань").length, "раза для клиента Анна; цена ручки — в", data.filter((r) => r.P === "ручка").length, "строках");
console.log("  аномалия обновления: смена цены ручки в одной строке даёт противоречие:", (() => { const d = data.map((r, i) => (i === 0 ? { ...r, T: 12 } : r)); return new Set(d.filter((r) => r.P === "ручка").map((r) => r.T)).size > 1 ? "да — две разные цены у одного товара" : "нет"; })());
console.log("  аномалия вставки: нельзя записать новый товар без заказа (атрибуты O и Q обязательны для ключа OP)");
console.log("  аномалия удаления: удалив заказ 2, теряем сведения о клиенте Борис:", !data.filter((r) => r.O !== 2).some((r) => r.C === "Борис") ? "да" : "нет");

// Нормальные формы кратко: 3НФ допускает зависимость, если правая часть — часть ключа
const R2 = S("ABC"), f2 = FD("AB->C, C->B");
console.log("\\nпример 3НФ, но не BCNF: R(A,B,C), AB→C, C→B; ключи:", candidateKeys(R2, f2).map(str).join(", "), "; нарушение BCNF:", show(violatesBCNF(R2, f2)), "(правая часть B — часть ключа AB, поэтому 3НФ допускает)");`, { filename: "02-fd-normalization.mjs", collapsed: true }),
      code("text", `R(O заказ, C клиент, N город клиента, P товар, T цена товара, Q количество); зависимости: O→C, C→N, P→T, OP→Q
замыкание {O}+ = CNO ; {OP}+ = CNOPQT
потенциальные ключи: OP (OP определяет все атрибуты, меньше нельзя)
нарушения BCNF (левая часть не ключ): O→C, C→N, P→T
разложение в BCNF: R(CN), R(CO), R(PT), R(OPQ)
исходных строк: 4 ; части: CN — 2 строк; CO — 3 строк; PT — 2 строк; OPQ — 4 строк
соединение частей восстанавливает исходное отношение без потерь и без лишних строк: да
«плохое» разложение по (C,P) и (O,C,N,T,Q): соединение даёт 7 строк вместо 4 — появились лишние (ложные) кортежи: да
критерий без потерь для двух частей: общие атрибуты должны быть ключом хотя бы одной из частей (R1 ∩ R2 → R1 или R2)

аномалии в таблице R (исходный вид):
  избыточность: город «Казань» записан 3 раза для клиента Анна; цена ручки — в 3 строках
  аномалия обновления: смена цены ручки в одной строке даёт противоречие: да — две разные цены у одного товара
  аномалия вставки: нельзя записать новый товар без заказа (атрибуты O и Q обязательны для ключа OP)
  аномалия удаления: удалив заказ 2, теряем сведения о клиенте Борис: да

пример 3НФ, но не BCNF: R(A,B,C), AB→C, C→B; ключи: AB, AC ; нарушение BCNF: C→B (правая часть B — часть ключа AB, поэтому 3НФ допускает)`, { filename: "замыкания, ключи, BCNF, соединение без потерь" }),
      ul(
        "Схема R(O, C, N, P, T, Q): заказ `O`, клиент `C`, город клиента `N`, товар `P`, цена товара `T`, количество `Q`; зависимости `O→C`, `C→N`, `P→T`, `OP→Q`. Замыкание `{OP}⁺ = OPCNTQ` — вся схема, поэтому **единственный ключ — `OP`**; `{O}⁺ = CNO`.",
        "Зависимости `O→C`, `C→N`, `P→T` нарушают BCNF (левая часть не ключ). Алгоритм разложения даёт **R(CN), R(CO), R(PT), R(OPQ)**.",
        "Проверка на данных: соединение четырёх частей воспроизводит исходные 4 строки **без потерь и без лишних строк**. «Плохое» разложение по `(C, P)` и `(O, C, N, T, Q)` (общий атрибут `C` — не ключ ни одной из частей) даёт **7 строк вместо 4**: ложные кортежи.",
        "Аномалии исходной таблицы: город «Казань» записан 3 раза; изменение цены ручки в одной строке из трёх создаёт две разные цены; удалив заказ Бориса, мы теряем сведения о нём; нового товара без заказа не записать.",
        "Пример «3НФ, но не BCNF»: R(A, B, C) с `AB→C`, `C→B` — ключи `AB` и `AC`; зависимость `C→B` нарушает BCNF, но правая часть `B` — простой атрибут, поэтому 3НФ допускает.",
      ),
      h("Алгоритмы соединения: сколько работы"),
      code("js", `// Алгоритмы соединения: вложенные циклы, хеш-соединение, слияние отсортированных, индексные вложенные циклы. Считаем сравнения; время — в stderr.
function sfc32(a, b, c, d) { return () => { a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; let t = (a + b) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0; c = (c << 21) | (c >>> 11); d = (d + 1) | 0; t = (t + d) | 0; c = (c + t) | 0; return (t >>> 0) / 4294967296; }; }
const rnd = sfc32(0x9E3779B9, 0x243F6A88, 0xB7E15162, 7); for (let i = 0; i < 15; i++) rnd();
const N = 4000, M = 4000, KEYS = 2000;                                           // ключей меньше, чем строк: у ключа несколько совпадений
const R = Array.from({ length: N }, (_, i) => ({ id: i, k: Math.floor(rnd() * KEYS) }));
const S2 = Array.from({ length: M }, (_, i) => ({ id: i, k: Math.floor(rnd() * KEYS) }));

function nestedLoop() { let cmp = 0, out = 0; for (const r of R) for (const s of S2) { cmp++; if (r.k === s.k) out++; } return { cmp, out }; }
function hashJoin() { let cmp = 0, out = 0; const h = new Map(); for (const s of S2) { (h.get(s.k) ?? h.set(s.k, []).get(s.k)).push(s); } for (const r of R) { const b = h.get(r.k); cmp++; if (b) out += b.length; } return { cmp, out }; }   // 1 проба на строку R
function sortMerge() {
  let cmp = 0; const byK = (a, b) => { cmp++; return a.k - b.k; };
  const A = [...R].sort(byK), B = [...S2].sort(byK);
  let i = 0, j = 0, out = 0;
  while (i < A.length && j < B.length) {
    cmp++;
    if (A[i].k < B[j].k) i++; else if (A[i].k > B[j].k) j++;
    else { const k = A[i].k; let i2 = i, j2 = j; while (i2 < A.length && A[i2].k === k) i2++; while (j2 < B.length && B[j2].k === k) j2++; out += (i2 - i) * (j2 - j); i = i2; j = j2; }
  }
  return { cmp, out };
}
function indexNestedLoop() {                                                      // по S создан упорядоченный индекс; для каждой строки R — бинарный поиск
  const idx = [...S2].sort((a, b) => a.k - b.k); let cmp = 0, out = 0;
  const lower = (k) => { let lo = 0, hi = idx.length; while (lo < hi) { cmp++; const m = (lo + hi) >> 1; if (idx[m].k < k) lo = m + 1; else hi = m; } return lo; };
  for (const r of R) { let p = lower(r.k); while (p < idx.length && idx[p].k === r.k) { out++; p++; cmp++; } }
  return { cmp, out };
}
const t = (f) => { const s = performance.now(); const r = f(); return [r, performance.now() - s]; };
const [a, ta] = t(nestedLoop), [b, tb] = t(hashJoin), [c, tc] = t(sortMerge), [d, td] = t(indexNestedLoop);
console.error(\`вложенные циклы \${ta.toFixed(1)} мс, хеш \${tb.toFixed(2)} мс, слияние \${tc.toFixed(2)} мс, индексные \${td.toFixed(2)} мс\`);
console.log("отношения R и S по", N, "строк, ключей соединения", KEYS, "(в среднем по 2 совпадения на ключ)");
console.log("алгоритм                      сравнений/проб   строк в результате");
for (const [name, r] of [["вложенные циклы", a], ["хеш-соединение", b], ["сортировка + слияние", c], ["индексные вложенные циклы", d]]) console.log(name.padEnd(30), String(r.cmp).padStart(13), String(r.out).padStart(20));
console.log("все алгоритмы дали одинаковый результат:", a.out === b.out && b.out === c.out && c.out === d.out ? "да" : "нет");
console.log("вложенные циклы делают N·M = " + N * M + " сравнений; хеш-соединение — N + M = " + (N + M) + " операций (построение + пробы); теоретически слияние ≈ N·log₂N + M·log₂M =", Math.round(N * Math.log2(N) + M * Math.log2(M)), "сравнений на сортировку");
console.log("вложенным циклам потребовалось сравнений больше, чем проб хеш-соединению, в", Math.round(a.cmp / b.cmp), "раз:", a.cmp > 100 * b.cmp ? "да" : "нет");

// влияние размера «внутреннего» отношения на выбор алгоритма: малая таблица справочника
const small = Array.from({ length: 20 }, (_, i) => ({ id: i, k: i }));
let cnl = 0; for (const r of R) for (const s of small) { cnl++; }
console.log("\\nесли внутреннее отношение мало (20 строк), вложенные циклы дешёвы:", cnl, "сравнений при N =", N, "(≈ N·20); хеш-таблица в этом случае ненамного быстрее и требует памяти");
console.log("хеш-соединение требует памяти под хеш-таблицу меньшего отношения; если оно не помещается, применяют разбиение на блоки (grace hash join) и работу с диском");`, { filename: "03-join-algorithms.mjs", collapsed: true }),
      code("text", `отношения R и S по 4000 строк, ключей соединения 2000 (в среднем по 2 совпадения на ключ)
алгоритм                      сравнений/проб   строк в результате
вложенные циклы                     16000000                 7842
хеш-соединение                          4000                 7842
сортировка + слияние                   87635                 7842
индексные вложенные циклы              55765                 7842
все алгоритмы дали одинаковый результат: да
вложенные циклы делают N·M = 16000000 сравнений; хеш-соединение — N + M = 8000 операций (построение + пробы); теоретически слияние ≈ N·log₂N + M·log₂M = 95726 сравнений на сортировку
вложенным циклам потребовалось сравнений больше, чем проб хеш-соединению, в 4000 раз: да

если внутреннее отношение мало (20 строк), вложенные циклы дешёвы: 80000 сравнений при N = 4000 (≈ N·20); хеш-таблица в этом случае ненамного быстрее и требует памяти
хеш-соединение требует памяти под хеш-таблицу меньшего отношения; если оно не помещается, применяют разбиение на блоки (grace hash join) и работу с диском`, { filename: "R и S по 4000 строк, 2000 различных ключей" }),
      ul(
        "Все четыре алгоритма дали один результат — 7842 строки. Работа разная: **вложенные циклы — 16 000 000 сравнений** (`N·M`), **хеш-соединение — 4000 проб** (плюс построение таблицы из 4000 строк), **сортировка и слияние — 87 635** сравнений (около `N·log₂N + M·log₂M` ≈ 95 700 с учётом слияния), **индексные вложенные циклы — 55 765**.",
        "Число сравнений различается в 4000 раз, а время — меньше: в калибровке вложенные циклы заняли около 24 мс, хеш-соединение — около 1,5 мс (в 15 раз быстрее), потому что простой цикл по массиву дёшев, а построение хеш-таблицы и обращения к ней стоят памяти. Выигрыш растёт с размером отношений (квадрат против линейной зависимости).",
        "Если внутреннее отношение мало (20 строк), вложенные циклы дёшевы: 80 000 сравнений. Выбор зависит от размеров, индексов, памяти и требуемого порядка результата — это решает оптимизатор.",
      ),
    ]),

    section("analysis", [
      h("Индексы на практике (SQLite 3.45)"),
      code("python", `# Индексы на практике: планы запросов SQLite, число инструкций виртуальной машины, размер индексов, стоимость записи. SQLite из стандартной библиотеки Python.
import sqlite3, time, sys, random

print("SQLite", sqlite3.sqlite_version)
random.seed(42)                                             # воспроизводимые данные
N = 200_000
CITIES = ["Москва", "Казань", "Омск", "Томск", "Пермь", "Уфа", "Сочи", "Псков"]
rows = [(i, f"user{i}@mail.test", random.randint(18, 80), random.choice(CITIES), i % 2) for i in range(1, N + 1)]

db = sqlite3.connect(":memory:")
db.execute("create table users(id integer primary key, email text, age int, city text, active int)")
db.executemany("insert into users values (?,?,?,?,?)", rows)
db.commit()

def plan(q, *args):
    return " | ".join(r[3] for r in db.execute("explain query plan " + q, args))
def vm_steps(q, *args):
    n = [0]
    db.set_progress_handler(lambda: n.__setitem__(0, n[0] + 1) or 0, 1)      # вызывается на каждой инструкции VDBE
    res = db.execute(q, args).fetchall()
    db.set_progress_handler(None, 1)
    return n[0], len(res)
def pages(name):
    return db.execute("select count(*) from dbstat where name = ?", (name,)).fetchone()[0]
def timed(q, *args, reps=5):
    best = 1e9
    for _ in range(reps):
        t = time.perf_counter(); db.execute(q, args).fetchall(); best = min(best, time.perf_counter() - t)
    return best

target = "user123456@mail.test"
print(f"\\nтаблица users: {N} строк; страниц таблицы (по 4096 Б): {pages('users')} ≈ {pages('users') * 4096 // 1024} КиБ")
print("\\n1) поиск по email")
q = "select id, age from users where email = ?"
print("   без индекса:    ", plan(q, target))
s0, r0 = vm_steps(q, target); t_scan = timed(q, target)
db.execute("create index idx_email on users(email)")
print("   с индексом:     ", plan(q, target))
s1, r1 = vm_steps(q, target); t_idx = timed(q, target)
print(f"   результат: {r0} строка в обоих случаях ({r1}); инструкций виртуальной машины: {s0} без индекса, {s1} с индексом — в {s0 // s1} раз меньше")
print("   поиск по индексу быстрее полного просмотра более чем в 100 раз:", "да" if t_scan > 100 * t_idx else "нет")
print(f"   размер индекса: {pages('idx_email')} страниц ≈ {pages('idx_email') * 4} КиБ (индекс по строковому ключу почти столь же велик, как таблица)", file=sys.stderr)
print("   индекс по email занимает больше 20 % страниц таблицы:", "да" if pages("idx_email") > 0.2 * pages("users") else "нет")

print("\\n2) составной индекс (city, age): правило левого префикса")
db.execute("create index idx_city_age on users(city, age)")
for label, q, a in [("city = ? AND age > ?", "select id from users where city = ? and age > ?", ("Омск", 60)), ("city = ?", "select id from users where city = ?", ("Омск",)), ("age > ? (без city)", "select id from users where age > ?", (70,)), ("city = ? ORDER BY age", "select id, age from users where city = ? order by age", ("Омск",))]:
    print("   WHERE", label.ljust(26), "→", plan(q, *a))

print("\\n3) покрывающий индекс: все нужные столбцы лежат в индексе")
print("   select city, age where city = ?     →", plan("select city, age from users where city = ?", "Омск"))
print("   select city, age, email, где city=? →", plan("select city, age, email from users where city = ?", "Омск"))

print("\\n4) функция над столбцом делает индекс бесполезным")
q = "select id from users where lower(email) = ?"
print("   lower(email) = ?              →", plan(q, target))
db.execute("create index idx_email_lower on users(lower(email))")
print("   после индекса по выражению     →", plan(q, target))

print("\\n5) шаблон и индекс: GLOB 'prefix*' использует индекс, '*suffix' — нет")
print("   email GLOB 'user12345*'  →", plan("select id from users where email glob 'user12345*'"))
print("   email GLOB '*12345@mail.test' →", plan("select id from users where email glob '*12345@mail.test'"))

print("\\n6) малая избирательность: индекс по столбцу active (два значения)")
db.execute("create index idx_active on users(active)")
q_def = "select count(*), sum(age) from users where active = 1"
q_scan = "select count(*), sum(age) from users not indexed where active = 1"
print("   план без статистики:     ", plan(q_def))
t_def = timed(q_def); t_scan2 = timed(q_scan)
print(f"   по индексу {t_def*1000:.1f} мс, полный просмотр {t_scan2*1000:.1f} мс", file=sys.stderr)
print("   при выборке половины таблицы поиск по индексу МЕДЛЕННЕЕ полного просмотра (NOT INDEXED):", "да" if t_def > t_scan2 else "нет")
db.execute("analyze")
print("   план после ANALYZE:      ", plan(q_def))
print("   статистика ANALYZE (sqlite_stat1):", [tuple(r) for r in db.execute("select tbl, idx, stat from sqlite_stat1 order by idx")])
print("   «200000 100000» — 200 000 строк и в среднем 100 000 строк на значение active: индекс почти не сужает поиск")
print("   редкое значение (selectivity): индекс по city при city = 'Омск':", plan("select id, email from users where city = ?", "Омск"))

print("\\n7) цена индексов для записи: вставка 100 000 строк")
def build(indexes):
    c = sqlite3.connect(":memory:"); c.execute("create table t(id integer primary key, email text, age int, city text, active int)")
    for sql in indexes: c.execute(sql)
    data = [(N + i, f"x{i}@mail.test", random.randint(18, 80), random.choice(CITIES), i % 2) for i in range(100_000)]
    t = time.perf_counter(); c.executemany("insert into t values (?,?,?,?,?)", data); c.commit(); return time.perf_counter() - t, c
t0, c0 = build([]); t3, c3 = build(["create index a on t(email)", "create index b on t(city, age)", "create index c on t(active)"])
print(f"   без индексов {t0:.3f} с, с тремя индексами {t3:.3f} с", file=sys.stderr)
print("   вставка в таблицу с тремя индексами медленнее вставки без индексов более чем в 1,5 раза:", "да" if t3 > 1.5 * t0 else "нет")
sz0 = c0.execute("select count(*) from dbstat").fetchone()[0]; sz3 = c3.execute("select count(*) from dbstat").fetchone()[0]
print(f"   страниц в базе: {sz0} без индексов и {sz3} с тремя индексами — рост в {sz3 / sz0:.1f} раза")`, { filename: "04-sqlite-indexes.py", collapsed: true }),
      code("text", `SQLite 3.45.1

таблица users: 200000 строк; страниц таблицы (по 4096 Б): 2065 ≈ 8260 КиБ

1) поиск по email
   без индекса:     SCAN users
   с индексом:      SEARCH users USING INDEX idx_email (email=?)
   результат: 1 строка в обоих случаях (1); инструкций виртуальной машины: 600011 без индекса, 17 с индексом — в 35294 раз меньше
   поиск по индексу быстрее полного просмотра более чем в 100 раз: да
   индекс по email занимает больше 20 % страниц таблицы: да

2) составной индекс (city, age): правило левого префикса
   WHERE city = ? AND age > ?       → SEARCH users USING COVERING INDEX idx_city_age (city=? AND age>?)
   WHERE city = ?                   → SEARCH users USING COVERING INDEX idx_city_age (city=?)
   WHERE age > ? (без city)         → SCAN users USING COVERING INDEX idx_city_age
   WHERE city = ? ORDER BY age      → SEARCH users USING COVERING INDEX idx_city_age (city=?)

3) покрывающий индекс: все нужные столбцы лежат в индексе
   select city, age where city = ?     → SEARCH users USING COVERING INDEX idx_city_age (city=?)
   select city, age, email, где city=? → SEARCH users USING INDEX idx_city_age (city=?)

4) функция над столбцом делает индекс бесполезным
   lower(email) = ?              → SCAN users USING COVERING INDEX idx_email
   после индекса по выражению     → SEARCH users USING INDEX idx_email_lower (<expr>=?)

5) шаблон и индекс: GLOB 'prefix*' использует индекс, '*suffix' — нет
   email GLOB 'user12345*'  → SEARCH users USING COVERING INDEX idx_email (email>? AND email<?)
   email GLOB '*12345@mail.test' → SCAN users USING COVERING INDEX idx_email

6) малая избирательность: индекс по столбцу active (два значения)
   план без статистики:      SEARCH users USING INDEX idx_active (active=?)
   при выборке половины таблицы поиск по индексу МЕДЛЕННЕЕ полного просмотра (NOT INDEXED): да
   план после ANALYZE:       SEARCH users USING INDEX idx_active (active=?)
   статистика ANALYZE (sqlite_stat1): [('users', 'idx_active', '200000 100000'), ('users', 'idx_city_age', '200000 25000 397'), ('users', 'idx_email', '200000 1'), ('users', 'idx_email_lower', '200000 1')]
   «200000 100000» — 200 000 строк и в среднем 100 000 строк на значение active: индекс почти не сужает поиск
   редкое значение (selectivity): индекс по city при city = 'Омск': SEARCH users USING INDEX idx_city_age (city=?)

7) цена индексов для записи: вставка 100 000 строк
   вставка в таблицу с тремя индексами медленнее вставки без индексов более чем в 1,5 раза: да
   страниц в базе: 949 без индексов и 2415 с тремя индексами — рост в 2.5 раза`, { filename: "200 000 строк: планы, инструкции виртуальной машины, страницы, цена записи" }),
      ul(
        "**Поиск по `email`:** без индекса план `SCAN users` — **600 011 инструкций** виртуальной машины (проверено обработчиком прогресса на каждую инструкцию); с индексом `SEARCH … USING INDEX idx_email (email=?)` — **17 инструкций**, в 35 294 раза меньше; по времени индекс быстрее более чем в 100 раз.",
        "**Размер:** таблица — 2065 страниц (≈ 8 МиБ), индекс по `email` — 1391 страница: индекс по строковому ключу почти столь же велик, как данные.",
        "**Составной индекс `(city, age)`:** `city = ? AND age > ?` и `city = ?` — `SEARCH … USING COVERING INDEX` (поиск по префиксу); `age > ?` без `city` — только `SCAN … USING COVERING INDEX` (просмотр индекса целиком, а не поиск); `ORDER BY age` при `city = ?` не требует сортировки.",
        "**Покрывающий индекс:** запрос `city, age` берёт данные из индекса; добавив `email`, мы получаем обращение к таблице (`USING INDEX`, без `COVERING`).",
        "**Функция над столбцом:** `lower(email) = ?` не использует индекс по `email` (просмотр), после индекса по выражению — `SEARCH … (<expr>=?)`. **Шаблон:** `GLOB 'user12345*'` — диапазонный поиск по индексу, `GLOB '*12345@mail.test'` — просмотр.",
        "**Избирательность:** по столбцу `active` (два значения) индекс почти ничего не отсеивает; SQLite всё же выбирает его (и после `ANALYZE`, статистика `200000 100000`), и в калибровке поиск по индексу занимает около 21 мс против 7,5 мс при полном просмотре (`NOT INDEXED`) — **индекс в 2,8 раза медленнее**. Урок: планировщик ошибается; планы нужно проверять измерением.",
        "**Цена записи:** вставка 100 000 строк — около 0,07 с без индексов и около 0,3 с с тремя индексами (в 4–5 раз дороже); страниц в базе 949 и 2415 (**в 2,5 раза больше**).",
      ),
      h("Фильтр Блума и LSM-дерево"),
      code("js", `// Структуры индексов для больших данных: фильтр Блума и LSM-дерево (симуляция с подсчётом работы). Генератор sfc32 — результаты воспроизводимы.
function sfc32(a, b, c, d) { return () => { a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; let t = (a + b) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0; c = (c << 21) | (c >>> 11); d = (d + 1) | 0; t = (t + d) | 0; c = (c + t) | 0; return (t >>> 0) / 4294967296; }; }
const rnd = sfc32(0x9E3779B9, 0x243F6A88, 0xB7E15162, 11); for (let i = 0; i < 15; i++) rnd();
const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; };
const mix = (s) => { let h = 0xdeadbeef ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 2654435761); h ^= h >>> 15; } return (h >>> 0) | 1; };

// ---- фильтр Блума ----
class Bloom {
  constructor(m, k) { this.m = m; this.k = k; this.bits = new Uint8Array((m + 7) >> 3); }
  idx(key, i) { return (fnv(key) + Math.imul(i, mix(key))) >>> 0; }                // двойное хеширование: h1 + i·h2
  add(key) { for (let i = 0; i < this.k; i++) { const b = this.idx(key, i) % this.m; this.bits[b >> 3] |= 1 << (b & 7); } }
  has(key) { for (let i = 0; i < this.k; i++) { const b = this.idx(key, i) % this.m; if (!(this.bits[b >> 3] & (1 << (b & 7)))) return false; } return true; }
}
const n = 10000, Q = 200000;
console.log("фильтр Блума: n =", n, "ключей; ложноположительных ответов на", Q, "ключей, которых нет в множестве");
console.log("бит на ключ   хеш-функций k   размер, байт   измерено    теория (1−e^(−kn/m))^k   ложноотрицательных");
for (const bpk of [4, 8, 10, 12, 16]) {
  const m = bpk * n, k = Math.max(1, Math.round(bpk * Math.LN2)); const f = new Bloom(m, k);
  for (let i = 0; i < n; i++) f.add("key:" + i);
  let fp = 0; for (let i = 0; i < Q; i++) if (f.has("absent:" + i)) fp++;
  let fn = 0; for (let i = 0; i < n; i++) if (!f.has("key:" + i)) fn++;
  const theory = Math.pow(1 - Math.exp(-k * n / m), k);
  console.log(String(bpk).padStart(8), String(k).padStart(14), String(f.bits.length).padStart(14), (100 * fp / Q).toFixed(3).padStart(9) + " %", (100 * theory).toFixed(3).padStart(14) + " %", String(fn).padStart(24));
}
console.log("фильтр не бывает ложноотрицательным: «нет» означает «точно нет»; «да» означает «возможно есть» (с вероятностью ошибки)");
console.log("10 бит на ключ при k = 7 даёт около 1 % ложных срабатываний: 10 000 ключей по 40 байт (400 000 байт) заменяются фильтром в", 10 * n / 8, "байт");

// ---- LSM-дерево ----
function lsm({ memCap, ratio, policy, inserts, bloomBits }) {
  let mem = new Map(); const levels = [];             // levels[i] — массив «отсортированных наборов» (runs); для leveled — не более одного набора на уровень
  let written = 0, flushes = 0, compactions = 0;
  const cap = (i) => memCap * Math.pow(ratio, i + 1);
  const merge = (runs) => { const m = new Map(); for (const r of runs) for (const [k, v] of r.data) m.set(k, v); return m; };       // новые перекрывают старые (runs упорядочены от старых к новым)
  const makeRun = (data) => { const keys = [...data.keys()].sort((a, b) => a - b); const sorted = new Map(keys.map((k) => [k, data.get(k)])); written += sorted.size; let bloom = null; if (bloomBits) { bloom = new Bloom(Math.max(64, bloomBits * sorted.size), Math.max(1, Math.round(bloomBits * Math.LN2))); for (const k of sorted.keys()) bloom.add("k" + k); } return { data: sorted, bloom }; };
  function flush() {
    flushes++; let run = makeRun(mem); mem = new Map();
    if (policy === "leveled") {
      let i = 0;
      for (;;) {
        levels[i] ??= [];
        if (levels[i].length === 0) { levels[i] = [run]; break; }
        const merged = makeRun(merge([levels[i][0], run])); compactions++;     // слияние с единственным набором уровня
        if (merged.data.size <= cap(i)) { levels[i] = [merged]; break; }
        levels[i] = []; run = merged; i++;                                    // уровень переполнен — спускаем вниз
      }
    } else {                                                                 // size-tiered: накапливаем до ratio наборов, затем сливаем в один и переносим вниз
      let i = 0;
      for (;;) {
        levels[i] ??= []; levels[i].push(run);
        if (levels[i].length < ratio) break;
        run = makeRun(merge(levels[i])); compactions++; levels[i] = []; i++;
      }
    }
  }
  const keys = [];
  for (let i = 0; i < inserts; i++) { const k = Math.floor(rnd() * 1e9); keys.push(k); mem.set(k, i); if (mem.size >= memCap) flush(); }
  // чтения: сколько наборов нужно просмотреть при поиске существующего и несуществующего ключа
  const runsAll = levels.flat(); let probesHit = 0, probesMiss = 0, bloomSkips = 0; const T = 2000;
  const lookup = (k, stat) => { let probes = 0; if (mem.has(k)) return 0; for (let li = 0; li < levels.length; li++) for (let r = (levels[li]?.length ?? 0) - 1; r >= 0; r--) { const run = levels[li][r]; if (run.bloom && !run.bloom.has("k" + k)) { bloomSkips++; continue; } probes++; if (run.data.has(k)) return probes; } return probes; };
  for (let i = 0; i < T; i++) probesHit += lookup(keys[Math.floor(rnd() * keys.length)]);
  for (let i = 0; i < T; i++) probesMiss += lookup(1e9 + i);
  return { written, flushes, compactions, runs: runsAll.length, levels: levels.map((l) => l.length), wa: written / inserts, readHit: probesHit / T, readMiss: probesMiss / T, bloomSkips };
}
const params = { memCap: 1000, ratio: 4, inserts: 100000 };
console.log("\\nLSM-дерево: 100 000 вставок случайных ключей, memtable 1000 ключей, коэффициент роста уровней 4");
console.log("политика       наборов  записано ключей на диск  усиление записи   просмотр наборов: существующий ключ / отсутствующий");
for (const [name, policy, bloomBits] of [["leveled", "leveled", 0], ["size-tiered", "tiered", 0], ["leveled+Блум", "leveled", 10], ["size-tiered+Блум", "tiered", 10]]) {
  const r = lsm({ ...params, policy, bloomBits });
  console.log(name.padEnd(16), String(r.runs).padStart(6), String(r.written).padStart(20), (r.wa.toFixed(1) + "×").padStart(16), (r.readHit.toFixed(1) + " / " + r.readMiss.toFixed(1)).padStart(34));
}
console.log("\\nусиление записи = записано на диск / записано пользователем: leveled перезаписывает уровни при каждом слиянии (больше записей, меньше наборов); size-tiered пишет реже, но оставляет больше наборов для чтения;");
console.log("фильтры Блума сокращают просмотр наборов при поиске отсутствующего ключа почти до нуля — главное назначение в LSM (RocksDB, Cassandra, LevelDB).");
const pageW = 4096, rec = 100;
console.log("для сравнения (модель): B-дерево при случайных обновлениях записывает страницу целиком:", pageW, "Б на запись в", rec, "Б → усиление ≈", (pageW / rec).toFixed(0) + "× без пакетирования; запись в журнал последовательна");`, { filename: "05-bloom-lsm.mjs", collapsed: true }),
      code("text", `фильтр Блума: n = 10000 ключей; ложноположительных ответов на 200000 ключей, которых нет в множестве
бит на ключ   хеш-функций k   размер, байт   измерено    теория (1−e^(−kn/m))^k   ложноотрицательных
       4              3           5000    14.893 %         14.689 %                        0
       8              6          10000     2.120 %          2.158 %                        0
      10              7          12500     0.795 %          0.819 %                        0
      12              8          15000     0.330 %          0.314 %                        0
      16             11          20000     0.043 %          0.046 %                        0
фильтр не бывает ложноотрицательным: «нет» означает «точно нет»; «да» означает «возможно есть» (с вероятностью ошибки)
10 бит на ключ при k = 7 даёт около 1 % ложных срабатываний: 10 000 ключей по 40 байт (400 000 байт) заменяются фильтром в 12500 байт

LSM-дерево: 100 000 вставок случайных ключей, memtable 1000 ключей, коэффициент роста уровней 4
политика       наборов  записано ключей на диск  усиление записи   просмотр наборов: существующий ключ / отсутствующий
leveled               2               784996             7.8×                          1.8 / 2.0
size-tiered           4               359997             3.6×                          3.4 / 4.0
leveled+Блум          2               784994             7.8×                          1.0 / 0.0
size-tiered+Блум      4               359997             3.6×                          1.0 / 0.0

усиление записи = записано на диск / записано пользователем: leveled перезаписывает уровни при каждом слиянии (больше записей, меньше наборов); size-tiered пишет реже, но оставляет больше наборов для чтения;
фильтры Блума сокращают просмотр наборов при поиске отсутствующего ключа почти до нуля — главное назначение в LSM (RocksDB, Cassandra, LevelDB).
для сравнения (модель): B-дерево при случайных обновлениях записывает страницу целиком: 4096 Б на запись в 100 Б → усиление ≈ 41× без пакетирования; запись в журнал последовательна`, { filename: "фильтр Блума: измерение и теория; LSM: усиление записи и чтения (симуляция)" }),
      ul(
        "**Фильтр Блума** при `n = 10 000` ключей и 10 битах на ключ (`k = 7` хеш-функций, 12 500 байт) дал **0,795 %** ложных срабатываний на 200 000 отсутствующих ключей — теория `(1 − e^{−kn/m})^k` даёт 0,819 %; при 4 битах — 14,9 % (теория 14,7 %), при 16 — 0,043 % (0,046 %). **Ложноотрицательных нет:** «нет» означает «точно нет».",
        "**LSM-дерево** (симуляция: 100 000 вставок, memtable 1000 ключей, коэффициент 4): политика `leveled` записала на диск 784 996 ключей — **усиление записи 7,8×**, `size-tiered` — 359 997 (**3,6×**). Чтение: `leveled` в среднем просматривает 1,8 набора для существующего ключа и 2,0 для отсутствующего, `size-tiered` — 3,4 и 4,0.",
        "**С фильтрами Блума** (10 бит на ключ) поиск отсутствующего ключа просматривает 0,0 набора, существующего — 1,0: фильтры отсекают наборы без ключа. Для сравнения, B-дерево при случайных обновлениях записывает страницу целиком (4096 Б на запись в 100 Б ≈ 41× в модели без пакетирования), зато читает за `O(log n)` страниц.",
        "Вывод: LSM обменивает быстрые последовательные записи на несколько наборов при чтении и фоновые слияния; B-дерево — наоборот. Поэтому RocksDB и Cassandra подходят для потоков записи, а PostgreSQL, SQLite и MySQL (InnoDB) используют B-деревья.",
      ),
      h("Оптимизатор: порядок соединений"),
      code("js", `// Оптимизатор запросов: выбор порядка соединений динамическим программированием по подмножествам (метрика — сумма размеров промежуточных результатов).
// Запрос: заказы клиентов из города X на товары категории Y.  C(клиенты) — O(заказы) — I(позиции) — P(товары)
const T = {
  C: { rows: 10_000, filter: 0.01, label: "клиенты, город = 'Омск'" },
  O: { rows: 1_000_000, filter: 1, label: "заказы" },
  I: { rows: 5_000_000, filter: 1, label: "позиции заказов" },
  P: { rows: 2_000, filter: 0.05, label: "товары, категория = 'книги'" },
};
// рёбра соединения: ключевое соединение — результат = размер дочерней стороны (внешний ключ → первичный ключ)
const EDGES = [["C", "O", 10_000], ["O", "I", 1_000_000], ["I", "P", 2_000]];       // третье число — число различных значений ключа в «родительской» таблице
const names = Object.keys(T);
const card = (set, T) => {                                                          // оценка размера соединения подмножества таблиц
  const tabs = [...set]; let size = tabs.reduce((p, t) => p * T[t].rows * T[t].filter, 1);
  for (const [a, b, d] of EDGES) if (set.has(a) && set.has(b)) size /= d;           // каждое ребро делит произведение на число различных значений ключа
  return size;
};
function plans(T) {
  const best = new Map();                                                           // маска → { cost, order (дерево), size }
  const bit = (n) => 1 << names.indexOf(n);
  const connected = (A, B) => EDGES.some(([a, b]) => (A.has(a) && B.has(b)) || (A.has(b) && B.has(a)));
  for (const n of names) { const s = new Set([n]); best.set(bit(n), { cost: 0, tree: n, size: T[n].rows * T[n].filter, set: s }); }
  for (let size = 2; size <= names.length; size++) {
    for (let mask = 1; mask < 1 << names.length; mask++) {
      const set = new Set(names.filter((n) => mask & bit(n))); if (set.size !== size) continue;
      let bestHere = null;
      for (let sub = (mask - 1) & mask; sub > 0; sub = (sub - 1) & mask) {           // все разбиения на две части
        const other = mask ^ sub; if (sub < other) continue;
        const L = best.get(sub), R = best.get(other); if (!L || !R || !connected(L.set, R.set)) continue;
        const out = card(set, T), cost = L.cost + R.cost + out;                      // стоимость = размеры всех промежуточных результатов
        if (!bestHere || cost < bestHere.cost) bestHere = { cost, tree: "(" + L.tree + " ⋈ " + R.tree + ")", size: out, set };
      }
      if (bestHere) best.set(mask, bestHere);
    }
  }
  return best.get((1 << names.length) - 1);
}
function leftDeepOrders() {
  const out = []; const perm = (arr, cur = []) => { if (!arr.length) return out.push(cur); arr.forEach((x, i) => perm([...arr.slice(0, i), ...arr.slice(i + 1)], [...cur, x])); }; perm(names); return out;
}
function orderCost(order, T) {
  const connected = (A, b) => EDGES.some(([x, y]) => (A.has(x) && y === b) || (A.has(y) && x === b));
  let set = new Set([order[0]]), cost = 0;
  for (const t of order.slice(1)) { if (!connected(set, t)) return Infinity; set = new Set([...set, t]); cost += card(set, T); }
  return cost;
}
const fmt = (x) => Math.round(x).toLocaleString("ru-RU").replace(/ /g, " ");
console.log("таблицы:", names.map((n) => \`\${n}: \${fmt(T[n].rows)} строк\${T[n].filter < 1 ? ", фильтр оставляет " + T[n].filter * 100 + " %" : ""}\`).join("; "));
console.log("оценка размеров промежуточных результатов (ключевые соединения):");
for (const s of ["CO", "OI", "IP", "COI", "OIP", "COIP"]) console.log("  ", [...s].join(" ⋈ ").padEnd(16), fmt(card(new Set(s), T)).padStart(12), "строк");

const opt = plans(T);
console.log("\\nлучший план по динамическому программированию:", opt.tree, "; стоимость (сумма промежуточных результатов):", fmt(opt.cost));
const all = leftDeepOrders().map((o) => ({ o, c: orderCost(o, T) })).filter((x) => isFinite(x.c)).sort((a, b) => a.c - b.c);
console.log("перебор левосторонних порядков соединения (допустимых, без декартова произведения):", all.length);
console.log("  лучший:", all[0].o.join(" ⋈ "), fmt(all[0].c), "; худший:", all.at(-1).o.join(" ⋈ "), fmt(all.at(-1).c), "; разница в", (all.at(-1).c / all[0].c).toFixed(0), "раз");
console.log("  без фильтров (соединить всё как есть): стоимость лучшего порядка", fmt(Math.min(...leftDeepOrders().map((o) => orderCost(o, Object.fromEntries(names.map((n) => [n, { ...T[n], filter: 1 }])))))), "— фильтры, применённые рано, кратно сокращают работу");

// ошибка оценки: оптимизатор считает, что фильтр по городу отсеивает не 1 %, а 50 %
const wrong = { ...T, C: { ...T.C, filter: 0.5 } };
const optWrong = plans(wrong);
console.log("\\nесли оценка селективности фильтра по клиентам завышена (оценка 50 % вместо реальных 1 %):");
console.log("  выбранный план:", optWrong.tree, "(оценённая стоимость", fmt(optWrong.cost) + ")");
const parse = (tree) => tree.replace(/[()]/g, "").split(" ⋈ ");
const realCost = (tree) => { const order = parse(tree); return orderCost(order, T); };
console.log("  его стоимость при реальной селективности:", fmt(realCost(optWrong.tree)), "против оптимальной", fmt(opt.cost), "—", (realCost(optWrong.tree) / opt.cost).toFixed(1), "раза хуже");
console.log("  причины плохих оценок на практике: устаревшая статистика, коррелированные столбцы (предположение независимости), параметры запроса, неравномерное распределение");

// число планов растёт быстро
const catalan = (n) => { let c = 1; for (let i = 0; i < n; i++) c = (c * 2 * (2 * i + 1)) / (i + 2); return c; };
console.log("\\nчисло порядков соединения n таблиц (все деревья, включая декартовы): n! · Каталан(n−1):", [2, 3, 4, 6, 8, 10].map((n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return n + " → " + fmt(f * catalan(n - 1)); }).join("; "));
console.log("поэтому оптимизаторы используют динамическое программирование по подмножествам (O(3ⁿ)), эвристики и ограничения при больших n");`, { filename: "06-optimizer.mjs", collapsed: true }),
      code("text", `таблицы: C: 10 000 строк, фильтр оставляет 1 %; O: 1 000 000 строк; I: 5 000 000 строк; P: 2 000 строк, фильтр оставляет 5 %
оценка размеров промежуточных результатов (ключевые соединения):
   C ⋈ O                  10 000 строк
   O ⋈ I               5 000 000 строк
   I ⋈ P                 250 000 строк
   C ⋈ O ⋈ I              50 000 строк
   O ⋈ I ⋈ P             250 000 строк
   C ⋈ O ⋈ I ⋈ P           2 500 строк

лучший план по динамическому программированию: (P ⋈ (I ⋈ (O ⋈ C))) ; стоимость (сумма промежуточных результатов): 62 500
перебор левосторонних порядков соединения (допустимых, без декартова произведения): 8
  лучший: C ⋈ O ⋈ I ⋈ P 62 500 ; худший: I ⋈ O ⋈ P ⋈ C 5 252 500 ; разница в 84 раз
  без фильтров (соединить всё как есть): стоимость лучшего порядка 11 000 000 — фильтры, применённые рано, кратно сокращают работу

если оценка селективности фильтра по клиентам завышена (оценка 50 % вместо реальных 1 %):
  выбранный план: (((P ⋈ I) ⋈ O) ⋈ C) (оценённая стоимость 625 000)
  его стоимость при реальной селективности: 502 500 против оптимальной 62 500 — 8.0 раза хуже
  причины плохих оценок на практике: устаревшая статистика, коррелированные столбцы (предположение независимости), параметры запроса, неравномерное распределение

число порядков соединения n таблиц (все деревья, включая декартовы): n! · Каталан(n−1): 2 → 2; 3 → 12; 4 → 120; 6 → 30 240; 8 → 17 297 280; 10 → 17 643 225 600
поэтому оптимизаторы используют динамическое программирование по подмножествам (O(3ⁿ)), эвристики и ограничения при больших n`, { filename: "динамическое программирование по подмножествам и ошибка оценки" }),
      ul(
        "Запрос из четырёх таблиц (клиенты `C` с фильтром 1 %, заказы `O`, позиции `I`, товары `P` с фильтром 5 %). Оценки промежуточных результатов: `C⋈O` — 10 000, `O⋈I` — 5 000 000, `I⋈P` — 250 000, `C⋈O⋈I` — 50 000, итог — 2500 строк.",
        "Лучший план — начинать с отфильтрованных клиентов (`C ⋈ O ⋈ I ⋈ P`): сумма промежуточных результатов **62 500**; худший допустимый порядок (`I ⋈ O ⋈ P ⋈ C`) — **5 252 500**, то есть **в 84 раза хуже**. Из 24 перестановок допустимы 8 (без декартова произведения).",
        "**Ошибка оценки:** если оптимизатор считает, что фильтр по городу оставляет 50 % клиентов, а не 1 %, он выберет план, который при реальной селективности стоит 502 500 — **в 8 раз хуже** оптимального. Типичные причины: устаревшая статистика, зависимость между столбцами, параметры.",
        "Число порядков соединения растёт стремительно (`n! · Каталан(n−1)`: 120 при `n = 4`, 17 297 280 при `n = 8`), поэтому оптимизаторы используют динамическое программирование по подмножествам и эвристики.",
      ),
    ]),

    section("internals", [
      h("Как СУБД выбирает и выполняет план"),
      ul(
        "**Статистика:** число строк, число различных значений, гистограммы и «самые частые значения»; собирается командой вроде `ANALYZE` или автоматически. Устаревшая статистика — главная причина плохих планов.",
        "**Оценка стоимости:** модель учитывает чтения страниц, процессорные операции и память; оценка размеров промежуточных результатов — самое слабое место (ошибка накапливается при каждом соединении).",
        "**Перебор планов:** динамическое программирование по подмножествам таблиц, ограничения (левосторонние деревья), генетические и жадные алгоритмы при большом числе таблиц.",
        "**Исполнение:** конвейер операторов (итераторы): каждый оператор запрашивает у дочернего следующую строку; блокирующие операторы (сортировка, построение хеш-таблицы) накапливают данные.",
        "**Подсказки и принудительные планы** (`INDEXED BY`, `NOT INDEXED`, `/*+ … */`) — инструмент диагностики; в постоянном коде они хрупки, потому что данные и статистика меняются.",
      ),
      h("Структура B-дерева на диске"),
      ul(
        "Узел — страница (4096 байт на тестовой машине); «толстые» узлы с сотнями ключей делают дерево низким: поиск среди миллионов ключей — 3–4 чтения страниц (подробнее — [деревья и кучи](/learn/cs/trees-heaps)).",
        "Вставка в заполненный лист разделяет его и может распространяться вверх; для упорядоченных вставок (по возрастанию `id`) листья заполняются плотно, для случайных (как строки UUID) — страницы расщепляются, и индекс разрастается.",
        "Удаления оставляют «дыры»; периодическая перестройка (`REINDEX`, `VACUUM`) возвращает компактность.",
        "Поиск по индексу — обращение к индексу и затем к строке таблицы (если индекс не покрывающий): два дерева. Покрывающий индекс экономит второй шаг.",
      ),
    ]),

    section("mistakes", [
      wrongRight(
        "sql",
        {
          title: "Неверно",
          code: `
            -- индекс по email есть, но запрос его игнорирует
            SELECT id FROM users WHERE lower(email) = 'user1@mail.test';
            -- составной индекс (city, age): условие только по age
            SELECT id FROM users WHERE age > 70;
          `,
          note: "Функция над столбцом и отсутствие левого префикса приводят к просмотру (в замере `SCAN`).",
        },
        {
          title: "Верно",
          code: `
            CREATE INDEX idx_email_lower ON users(lower(email));      -- индекс по выражению
            SELECT id FROM users WHERE lower(email) = 'user1@mail.test';
            -- либо индекс с нужным порядком столбцов: (age) или (age, city)
            CREATE INDEX idx_age ON users(age);
          `,
          note: "Индекс по выражению даёт `SEARCH`; порядок столбцов составного индекса выбирают по условиям запросов.",
        },
      ),
      ul(
        "**«Индекс на каждый столбец».** Каждый индекс — отдельная структура: три индекса удвоили размер базы (2,5×) и замедлили вставку в 4–5 раз.",
        "**Индекс по столбцу с малым числом значений** (`active`, пол, статус): почти не отсеивает строки; при выборке половины таблицы поиск по индексу в 2,8 раза медленнее просмотра.",
        "**Функции и преобразования над индексируемым столбцом:** `lower(col)`, `col + 0`, `CAST` — индекс не используется без индекса по выражению.",
        "**Неверный порядок столбцов** составного индекса: левый префикс определяет, какие запросы он обслуживает.",
        "**Денормализация «по умолчанию»:** повторение клиента и города в каждой строке заказа создаёт аномалии обновления и удаления.",
        "**Разложение «по вкусу»:** без проверки зависимостей соединение даёт ложные строки (7 вместо 4).",
        "**Слепое доверие оптимизатору:** планы ошибочны при устаревшей статистике (в замере — в 8 раз хуже); сверяйте `EXPLAIN` с измерениями.",
        "**Сравнение `NULL` через `=`:** `NULL = NULL` — `UNKNOWN`; используйте `IS NULL`.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Хранить всё в одной таблице «для простоты»** и бороться с последствиями программно: избыточность, несогласованность, лишние обновления.",
        "**Не создавать индексы вообще или создавать «на всякий случай»:** нужны индексы под реальные запросы и проверка по планам и нагрузке.",
        "**Подсказки оптимизатору в постоянном коде** (`INDEXED BY`) без мониторинга: при изменении данных план становится хуже.",
        "**Игнорировать цену записи индексов** в таблицах с интенсивной вставкой (логи, события): там чаще нужны LSM-хранилища или минимум индексов.",
        "**UUID v4 как первичный ключ B-дерева** без учёта фрагментации: случайные вставки расщепляют страницы по всему индексу.",
        "**Оценивать план по виду, а не по данным:** план «с индексом» не всегда быстрее (в замере индекс по `active` проиграл просмотру).",
        "**`SELECT *`** там, где достаточно покрывающего индекса: теряется возможность обойтись без обращения к таблице.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Проектируйте схему по зависимостям:** найдите ключи и зависимости, приведите к 3НФ/BCNF, затем денормализуйте точечно и осознанно.",
        "**Индексируйте под запросы:** условия равенства и диапазоны, `JOIN`-ключи (внешние ключи), сортировку; используйте покрывающие индексы для горячих запросов.",
        "**Проверяйте планы и измеряйте:** `EXPLAIN`, число обработанных строк, время; проверяйте после изменения данных и статистики.",
        "**Держите статистику свежей** (`ANALYZE`, автоматический сбор) и следите за расхождением оценок и фактических строк.",
        "**Порядок столбцов составного индекса:** сначала столбцы с условиями равенства, затем диапазон, затем сортировка.",
        "**Удаляйте неиспользуемые индексы:** они замедляют запись и занимают место (в замере — рост страниц в 2,5 раза).",
        "**Выбирайте хранилище по нагрузке:** много чтений и диапазонов — B-дерево; поток записей — LSM; быстрый ответ «нет» — фильтр Блума.",
        "**Проверяйте разложения на данных:** соединение частей должно возвращать исходные строки без лишних.",
        "**Пишите запросы декларативно:** условие и результат, а не порядок операций; доверяйте оптимизатору, но проверяйте.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Дубликаты и мультимножества:** `UNION` убирает дубликаты, `UNION ALL` нет; `COUNT(*)` и `COUNT(DISTINCT …)` отличаются.",
        "**`NULL` и индексы:** трёхзначная логика влияет на условия и внешние соединения; стандартные индексы B-дерева обычно хранят `NULL`, но поведение уникальных индексов с `NULL` различается между СУБД.",
        "**Корреляция столбцов:** оптимизатор перемножает селективности как независимые (`city` и `zip`); реальная выборка может быть на порядки иной.",
        "**Параметризованные запросы:** план, оптимальный для одного значения, плох для другого (частое и редкое значение).",
        "**Неравенства и сортировка:** слияние сортированных входов хорошо работает для диапазонных соединений; хеш — только для равенства.",
        "**Большие хеш-таблицы** не помещаются в память: применяют разбиение на блоки (grace hash join) и работу с диском.",
        "**Фильтр Блума** не поддерживает удаление (нужны счётные варианты) и требует оценки числа ключей заранее.",
        "**LSM и чтение:** при отсутствии фильтров чтение отсутствующих ключей дорого; фоновые слияния создают всплески нагрузки.",
      ),
    ]),

    section("related", [
      ul(
        "[Деревья и кучи](/learn/cs/trees-heaps) — B-дерево, высота и страницы SQLite.",
        "[Хеш-таблицы](/learn/cs/hash-tables) — хеш-индексы и хеш-соединение.",
        "[Поиск и сортировка](/learn/cs/searching-sorting) — сортировка и слияние, двоичный поиск.",
        "[Виртуальная память и файловые системы](/learn/cs/virtual-memory-files) — страницы, `fsync` и стоимость записи на диск.",
        "[Транзакции и согласованность](/learn/cs/transactions-consistency-theory) — ACID, изоляция и восстановление.",
        "[SQL: реляционная модель](/learn/sql/relational-model) — отношения, ключи и ограничения на практике.",
        "[SQL: нормализация](/learn/sql/normalization) — нормальные формы и аномалии на примерах PostgreSQL.",
        "[SQL: индексы и B-деревья](/learn/sql/indexes-btree) — планы и индексы PostgreSQL.",
        "[SQL: планы выполнения](/learn/sql/explain-plans) — чтение `EXPLAIN`.",
        "[SQL: настройка запросов](/learn/sql/query-tuning) — практические приёмы оптимизации.",
        "[SQL: внутренние и левые соединения](/learn/sql/inner-left-joins) — соединения на практике.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Индекс не используется",
          code: `
            SELECT id FROM users WHERE lower(email) = 'user1@mail.test';   -- SCAN: 600 011 инструкций
            SELECT id FROM users WHERE age > 70;                            -- индекс (city, age): без префикса city
          `,
          note: "Функция над столбцом и пропущенный левый префикс — полный просмотр 200 000 строк.",
        },
        {
          title: "Индекс подобран под запрос",
          code: `
            CREATE INDEX idx_email_lower ON users(lower(email));
            CREATE INDEX idx_age_city ON users(age, city);
            -- SEARCH ... USING INDEX: 17 инструкций вместо 600 011 (для поиска по email)
          `,
          note: "Индексы соответствуют условиям запросов; лишних индексов не создано (каждый добавляет страницы и замедляет запись).",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "cs.relational-theory-indexes.ex1",
      title: "Найдите ключи и нормальную форму",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Дана схема R(A, B, C, D, E) и зависимости `AB → C`, `C → D`, `D → B`. Найдите замыкания `{AB}⁺`, `{C}⁺`, `{AE}⁺`, потенциальные ключи, простые атрибуты. В какой нормальной форме находится R? Какие зависимости нарушают BCNF?"),
      ],
      hints: [
        "Атрибуты, которых нет в правых частях (`A`, `E`), обязаны входить в любой ключ.",
        "Добавляйте к `{A, E}` по одному атрибуту и считайте замыкание.",
        "3НФ допускает зависимость, если правая часть — простой атрибут.",
      ],
      checks: ["`{AB}⁺ = ABCD`, `{C}⁺ = BCD`, `{AE}⁺ = AE`", "Ключи: `ABE`, `ACE`, `ADE`", "Все атрибуты простые", "R в 3НФ, но не в BCNF", "Нарушают BCNF: `AB→C`, `C→D`, `D→B`"],
      solution: [
        code("text", `замыкания: {AB}+ = ABCD ; {C}+ = BCD ; {AE}+ = AE ; {ABE}+ = ABCDE
потенциальные ключи: ABE, ACE, ADE ; простые атрибуты (входят в какой-либо ключ): ABCDE
AB→C: левая часть суперключ: нет ; правая часть — простой атрибут: да → BCNF: нарушена , 3НФ: соблюдена
C→D: левая часть суперключ: нет ; правая часть — простой атрибут: да → BCNF: нарушена , 3НФ: соблюдена
D→B: левая часть суперключ: нет ; правая часть — простой атрибут: да → BCNF: нарушена , 3НФ: соблюдена
итог: R находится в 3НФ, но не в BCNF (нарушают C→D и D→B)`, { filename: "проверка" }),
        ul(
          "Атрибуты `A` и `E` не встречаются в правых частях, поэтому входят в каждый ключ. `{AE}⁺ = AE` — ключом не является. Добавляем `B`: `{ABE}⁺ = ABCDE` (`AB → C → D → B`), добавляем `C` — `{ACE}⁺ = ABCDE`, добавляем `D` — `{ADE}⁺ = ABCDE`.",
          "Ключи `ABE`, `ACE`, `ADE` содержат все атрибуты, поэтому все они простые: любая зависимость удовлетворяет условию 3НФ (правая часть — простой атрибут).",
          "BCNF нарушена: ни `AB`, ни `C`, ни `D` не являются суперключами. Вывод: R в 3НФ, но не в BCNF.",
        ),
      ],
    }),
    exercise({
      id: "cs.relational-theory-indexes.ex2",
      title: "Реализуйте хеш-соединение и сравните с вложенными циклами",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Напишите функции `nestedLoopJoin(R, S, key)` и `hashJoin(R, S, key)`, возвращающие пары совпавших строк по ключу. Сгенерируйте два отношения по 4000 строк с 2000 различных ключей, проверьте равенство результатов и посчитайте число сравнений. Объясните, при каких условиях хеш-соединение не выгодно."),
      ],
      starter: {
        lang: "js",
        code: `
          function nestedLoopJoin(R, S, key) { /* для каждой r перебрать все s */ }
          function hashJoin(R, S, key) { /* построить Map по меньшему, пробить большим */ }
        `,
      },
      hints: [
        "В хеш-таблице храните список строк для каждого значения ключа.",
        "Строить таблицу стоит по меньшему отношению.",
        "Результат сравнивайте как множество пар (идентификаторов).",
      ],
      checks: ["Одинаковый результат: 7842 пары", "Вложенные циклы: 16 000 000 сравнений", "Хеш: 4000 проб + 4000 вставок", "Объяснены ограничения: равенство, память, малые отношения"],
      solution: [
        code("js", `
          function nestedLoopJoin(R, S, key) {
            const out = [];
            for (const r of R) for (const s of S) if (r[key] === s[key]) out.push([r.id, s.id]);
            return out;
          }
          function hashJoin(R, S, key) {
            const small = S.length <= R.length ? S : R, big = small === S ? R : S;
            const h = new Map();
            for (const x of small) { let b = h.get(x[key]); if (!b) h.set(x[key], (b = [])); b.push(x); }
            const out = [];
            for (const y of big) for (const x of h.get(y[key]) ?? []) out.push(small === S ? [y.id, x.id] : [x.id, y.id]);
            return out;
          }
        `, { filename: "решение" }),
        code("text", `отношения R и S по 4000 строк, ключей соединения 2000 (в среднем по 2 совпадения на ключ)
алгоритм                      сравнений/проб   строк в результате
вложенные циклы                     16000000                 7842
хеш-соединение                          4000                 7842
сортировка + слияние                   87635                 7842
индексные вложенные циклы              55765                 7842
все алгоритмы дали одинаковый результат: да
вложенные циклы делают N·M = 16000000 сравнений; хеш-соединение — N + M = 8000 операций (построение + пробы); теоретически слияние ≈ N·log₂N + M·log₂M = 95726 сравнений на сортировку
вложенным циклам потребовалось сравнений больше, чем проб хеш-соединению, в 4000 раз: да

если внутреннее отношение мало (20 строк), вложенные циклы дешёвы: 80000 сравнений при N = 4000 (≈ N·20); хеш-таблица в этом случае ненамного быстрее и требует памяти
хеш-соединение требует памяти под хеш-таблицу меньшего отношения; если оно не помещается, применяют разбиение на блоки (grace hash join) и работу с диском`, { filename: "эталон: число сравнений и результат" }),
        p("Хеш-соединение делает `|S| + |R|` операций вместо `|R|·|S|`. Не выгодно, когда условие — не равенство (диапазоны, неравенства), когда хеш-таблица не помещается в память (нужны блоки и диск), когда внутреннее отношение очень мало (дёшевы вложенные циклы) или когда нужен результат, упорядоченный по ключу (удобнее слияние отсортированных входов)."),
      ],
    }),
    exercise({
      id: "cs.relational-theory-indexes.ex3",
      title: "Индекс есть, а запрос медленный",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("В таблице `users` 200 000 строк, есть индексы по `email` и составной `(city, age)`. Три запроса медленные: `WHERE lower(email) = ?`, `WHERE age > 70`, `WHERE active = 1` (по столбцу `active` есть индекс); вставка новых строк тоже стала медленнее после добавления «ещё нескольких индексов». Найдите причину по каждому случаю, предложите исправление и объясните, как проверить его измерением."),
      ],
      hints: [
        "Посмотрите план: `SCAN` или `SEARCH`?",
        "Что нужно составному индексу, чтобы им можно было искать?",
        "Какая доля строк подходит под `active = 1`?",
      ],
      checks: ["`lower(email)`: функция над столбцом — нужен индекс по выражению", "`age > 70`: нет левого префикса `city` — другой индекс или порядок столбцов", "`active = 1`: низкая избирательность, индекс медленнее просмотра (≈ 21 против 7,5 мс)", "Запись: каждый индекс — отдельные страницы и обновления (949 → 2415 страниц, вставка в 4–5 раз дороже)", "Проверка: `EXPLAIN`, число инструкций, время, размеры индексов"],
      solution: [
        code("text", `SQLite 3.45.1

таблица users: 200000 строк; страниц таблицы (по 4096 Б): 2065 ≈ 8260 КиБ

1) поиск по email
   без индекса:     SCAN users
   с индексом:      SEARCH users USING INDEX idx_email (email=?)
   результат: 1 строка в обоих случаях (1); инструкций виртуальной машины: 600011 без индекса, 17 с индексом — в 35294 раз меньше
   поиск по индексу быстрее полного просмотра более чем в 100 раз: да
   индекс по email занимает больше 20 % страниц таблицы: да

2) составной индекс (city, age): правило левого префикса
   WHERE city = ? AND age > ?       → SEARCH users USING COVERING INDEX idx_city_age (city=? AND age>?)
   WHERE city = ?                   → SEARCH users USING COVERING INDEX idx_city_age (city=?)
   WHERE age > ? (без city)         → SCAN users USING COVERING INDEX idx_city_age
   WHERE city = ? ORDER BY age      → SEARCH users USING COVERING INDEX idx_city_age (city=?)

3) покрывающий индекс: все нужные столбцы лежат в индексе
   select city, age where city = ?     → SEARCH users USING COVERING INDEX idx_city_age (city=?)
   select city, age, email, где city=? → SEARCH users USING INDEX idx_city_age (city=?)

4) функция над столбцом делает индекс бесполезным
   lower(email) = ?              → SCAN users USING COVERING INDEX idx_email
   после индекса по выражению     → SEARCH users USING INDEX idx_email_lower (<expr>=?)

5) шаблон и индекс: GLOB 'prefix*' использует индекс, '*suffix' — нет
   email GLOB 'user12345*'  → SEARCH users USING COVERING INDEX idx_email (email>? AND email<?)
   email GLOB '*12345@mail.test' → SCAN users USING COVERING INDEX idx_email

6) малая избирательность: индекс по столбцу active (два значения)
   план без статистики:      SEARCH users USING INDEX idx_active (active=?)
   при выборке половины таблицы поиск по индексу МЕДЛЕННЕЕ полного просмотра (NOT INDEXED): да
   план после ANALYZE:       SEARCH users USING INDEX idx_active (active=?)
   статистика ANALYZE (sqlite_stat1): [('users', 'idx_active', '200000 100000'), ('users', 'idx_city_age', '200000 25000 397'), ('users', 'idx_email', '200000 1'), ('users', 'idx_email_lower', '200000 1')]
   «200000 100000» — 200 000 строк и в среднем 100 000 строк на значение active: индекс почти не сужает поиск
   редкое значение (selectivity): индекс по city при city = 'Омск': SEARCH users USING INDEX idx_city_age (city=?)

7) цена индексов для записи: вставка 100 000 строк
   вставка в таблицу с тремя индексами медленнее вставки без индексов более чем в 1,5 раза: да
   страниц в базе: 949 без индексов и 2415 с тремя индексами — рост в 2.5 раза`, { filename: "замеры планов, инструкций, времени и размеров" }),
        ul(
          "**`lower(email)`:** индекс по `email` не помогает, потому что условие вычисляет функцию; нужен индекс по выражению `lower(email)` — план меняется с `SCAN` на `SEARCH`.",
          "**`age > 70`:** составной индекс упорядочен сначала по `city`, поэтому поиск по одному `age` невозможен (в замере — только `SCAN … USING COVERING INDEX`). Нужен индекс с `age` слева (например, `(age)` или `(age, city)`).",
          "**`active = 1`:** подходит половина строк; поиск по индексу обращается к таблице для каждой из 100 000 строк — медленнее просмотра (≈ 21 мс против 7,5 мс). Индекс по такому столбцу бесполезен; полезен составной с избирательным столбцом или частичный индекс.",
          "**Запись:** три индекса удвоили размер базы (949 → 2415 страниц) и сделали вставку в 4–5 раз дороже: оставляйте только индексы, которые используются запросами.",
          "**Проверка:** `EXPLAIN QUERY PLAN`, число инструкций (или реально прочитанных строк), время `NOT INDEXED` против обычного плана, размер индексов (`dbstat`) и нагрузочный тест вставки.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "cs.relational-theory-indexes.challenge",
    title: "Спроектируйте индексы под набор запросов",
    scenario: [
      p("Для интернет-магазина с таблицей `users` (200 000 строк) заданы пять запросов: (1) поиск по точному `email`; (2) список пользователей города с возрастом старше N, отсортированный по возрасту; (3) подсчёт активных пользователей; (4) поиск по префиксу email; (5) регистронезависимый поиск по `email`. Ежесекундно происходят вставки новых пользователей. Выберите минимальный набор индексов, обоснуйте каждый планом и оцените цену для записи."),
    ],
    requirements: [
      "Для каждого запроса — выбранный индекс (или его отсутствие) и ожидаемый план (`SEARCH`/`SCAN`)",
      "Проверка планов и числа инструкций виртуальной машины до и после",
      "Оценка стоимости записи: рост числа страниц и время вставки 100 000 строк",
      "Обоснование, почему некоторые запросы не нужно ускорять индексами (низкая избирательность)",
    ],
    constraints: [
      "Не более трёх индексов",
      "Нельзя менять текст запросов, кроме добавления индекса по выражению",
      "Каждое решение подтверждено измерением, а не предположением",
    ],
    acceptance: [
      "Запрос по `email` выполняется поиском по индексу, число инструкций уменьшилось на порядки (в замере 600 011 → 17)",
      "Запрос `city + age + ORDER BY age` обслуживается составным индексом `(city, age)` без сортировки",
      "Индекс по `active` не создан; обосновано замерами (индекс ≈ 21 мс против 7,5 мс просмотра)",
      "Регистронезависимый поиск использует индекс по выражению `lower(email)`",
      "Указана цена записи: рост страниц и времени вставки",
    ],
    hints: [
      "Покрывающий индекс может обслужить несколько запросов.",
      "Индекс по `email` обслужит и точное совпадение, и поиск по префиксу (`GLOB 'prefix*'`).",
      "Индекс по выражению нужен именно для запроса с функцией.",
    ],
    solution: [
      code("text", `SQLite 3.45.1

таблица users: 200000 строк; страниц таблицы (по 4096 Б): 2065 ≈ 8260 КиБ

1) поиск по email
   без индекса:     SCAN users
   с индексом:      SEARCH users USING INDEX idx_email (email=?)
   результат: 1 строка в обоих случаях (1); инструкций виртуальной машины: 600011 без индекса, 17 с индексом — в 35294 раз меньше
   поиск по индексу быстрее полного просмотра более чем в 100 раз: да
   индекс по email занимает больше 20 % страниц таблицы: да

2) составной индекс (city, age): правило левого префикса
   WHERE city = ? AND age > ?       → SEARCH users USING COVERING INDEX idx_city_age (city=? AND age>?)
   WHERE city = ?                   → SEARCH users USING COVERING INDEX idx_city_age (city=?)
   WHERE age > ? (без city)         → SCAN users USING COVERING INDEX idx_city_age
   WHERE city = ? ORDER BY age      → SEARCH users USING COVERING INDEX idx_city_age (city=?)

3) покрывающий индекс: все нужные столбцы лежат в индексе
   select city, age where city = ?     → SEARCH users USING COVERING INDEX idx_city_age (city=?)
   select city, age, email, где city=? → SEARCH users USING INDEX idx_city_age (city=?)

4) функция над столбцом делает индекс бесполезным
   lower(email) = ?              → SCAN users USING COVERING INDEX idx_email
   после индекса по выражению     → SEARCH users USING INDEX idx_email_lower (<expr>=?)

5) шаблон и индекс: GLOB 'prefix*' использует индекс, '*suffix' — нет
   email GLOB 'user12345*'  → SEARCH users USING COVERING INDEX idx_email (email>? AND email<?)
   email GLOB '*12345@mail.test' → SCAN users USING COVERING INDEX idx_email

6) малая избирательность: индекс по столбцу active (два значения)
   план без статистики:      SEARCH users USING INDEX idx_active (active=?)
   при выборке половины таблицы поиск по индексу МЕДЛЕННЕЕ полного просмотра (NOT INDEXED): да
   план после ANALYZE:       SEARCH users USING INDEX idx_active (active=?)
   статистика ANALYZE (sqlite_stat1): [('users', 'idx_active', '200000 100000'), ('users', 'idx_city_age', '200000 25000 397'), ('users', 'idx_email', '200000 1'), ('users', 'idx_email_lower', '200000 1')]
   «200000 100000» — 200 000 строк и в среднем 100 000 строк на значение active: индекс почти не сужает поиск
   редкое значение (selectivity): индекс по city при city = 'Омск': SEARCH users USING INDEX idx_city_age (city=?)

7) цена индексов для записи: вставка 100 000 строк
   вставка в таблицу с тремя индексами медленнее вставки без индексов более чем в 1,5 раза: да
   страниц в базе: 949 без индексов и 2415 с тремя индексами — рост в 2.5 раза`, { filename: "измерения для набора запросов" }),
      p("Три индекса: `idx_email(email)` — точный поиск (17 инструкций вместо 600 011) и поиск по префиксу (`GLOB 'user12345*'` — диапазонный `SEARCH`); `idx_city_age(city, age)` — запрос по городу и возрасту (`SEARCH … COVERING INDEX`) и сортировка по `age` без отдельного шага; `idx_email_lower(lower(email))` — регистронезависимый поиск (в замере без него `SCAN`). Подсчёт активных пользователей индексом не ускоряется: условие `active = 1` отсеивает половину строк, и поиск по индексу медленнее просмотра (≈ 21 против 7,5 мс), поэтому индекс по `active` не создаётся. Цена: каждый индекс — отдельные страницы и обновление при вставке; три индекса в замере увеличили базу в 2,5 раза и сделали вставку в 4–5 раз дороже, поэтому лишних индексов не добавляем, а размер и время проверяем после создания."),
    ],
  },

  interview: [
    iq("cs.relational-theory-indexes.i1", "basic", "Что такое реляционная алгебра и как она связана с SQL?", [
      ul(
        "Набор операций над множествами кортежей: выборка, проекция, соединение, объединение, разность, деление; SQL — декларативный язык, запросы которого выражаются алгеброй (с оговорками про дубликаты и `NULL`).",
        "Эквивалентности позволяют оптимизатору переставлять операции: выборка раньше соединения дала в 50 раз меньше сравнений при том же результате.",
        "В замере результаты алгебры совпали с SQLite во всех проверенных выражениях.",
      ),
    ]),
    iq("cs.relational-theory-indexes.i2", "basic", "Зачем нужны индексы и чем они плохи?", [
      ul(
        "Ускоряют поиск: `SCAN` 600 011 инструкций против `SEARCH` 17 на 200 000 строк.",
        "Занимают место (индекс по `email` — 1391 страница при 2065 у таблицы) и замедляют запись (три индекса — вставка в 4–5 раз дороже, база в 2,5 раза больше).",
        "Полезны не всегда: при низкой избирательности (половина таблицы) поиск по индексу медленнее просмотра.",
      ),
    ]),
    iq("cs.relational-theory-indexes.i3", "intermediate", "Что такое функциональная зависимость и нормальные формы?", [
      ul(
        "`X → Y`: значения `X` однозначно определяют `Y`; замыкание атрибутов позволяет найти ключи.",
        "3НФ: левая часть — суперключ или правая — простой атрибут; BCNF: левая часть всегда суперключ. Нормализация устраняет аномалии вставки, обновления и удаления.",
        "Разложение должно быть без потерь: в замере «плохое» разложение дало 7 строк вместо 4.",
      ),
    ]),
    iq("cs.relational-theory-indexes.i4", "intermediate", "Сравните алгоритмы соединения.", [
      ul(
        "Вложенные циклы `O(N·M)` (в замере 16 000 000 сравнений), хеш `O(N+M)` (4000 проб), слияние `O(n log n)` (87 635), индексные циклы `O(N log M)` (55 765).",
        "Хеш — равенство и память; слияние — упорядоченный результат и неравенства; вложенные циклы — малые отношения; индексные — при наличии индекса и малом внешнем отношении.",
        "Выбор делает оптимизатор по статистике.",
      ),
    ]),
    iq("cs.relational-theory-indexes.i5", "intermediate", "Что такое правило левого префикса составного индекса?", [
      ul(
        "Индекс `(a, b)` упорядочен по `a`, затем по `b`: он обслуживает условия на `a` и на `a` и `b`, но не на одно `b`.",
        "В замере: `city = ? AND age > ?` — `SEARCH`, `age > ?` без `city` — только просмотр индекса (`SCAN`).",
        "Порядок столбцов: сначала равенства, затем диапазон, затем столбцы сортировки.",
      ),
    ]),
    iq("cs.relational-theory-indexes.i6", "advanced", "Почему оптимизатор может выбрать плохой план?", [
      ul(
        "Оценки селективности основаны на статистике и допущениях (независимость столбцов, равномерность); они ошибаются при устаревшей статистике и корреляции.",
        "В модели ошибка в оценке фильтра (50 % вместо 1 %) привела к плану, который в 8 раз хуже оптимального; в SQLite индекс по `active` выбирался даже после `ANALYZE`, хотя был в 2,8 раза медленнее просмотра.",
        "Лечение: обновить статистику, проверить `EXPLAIN` и время, переписать запрос, добавить подходящий индекс, в крайнем случае использовать подсказки.",
      ),
    ]),
    iq("cs.relational-theory-indexes.i7", "engineering", "Как выбрать между B-деревом и LSM-деревом?", [
      ul(
        "B-дерево: быстрые точечные чтения и диапазоны (`O(log n)`), записи перезаписывают страницы (в модели ≈ 41× при случайных обновлениях без пакетирования).",
        "LSM: быстрая последовательная запись (усиление 3,6–7,8× в симуляции), чтение через несколько наборов, фоновые слияния; фильтры Блума (0,795 % ложных при 10 бит/ключ) делают поиск отсутствующих ключей дёшевым.",
        "Выбор по нагрузке: много чтений и сложных запросов — B-дерево (PostgreSQL, SQLite); поток записей — LSM (RocksDB, Cassandra).",
      ),
    ]),
    iq("cs.relational-theory-indexes.i8", "debugging", "Запрос не использует индекс. Что проверить?", [
      ul(
        "Функция над столбцом (`lower(email)`) — нужен индекс по выражению; неверный порядок столбцов в составном индексе; несоответствие типов или коллации; шаблон с ведущим подстановочным знаком (`'%abc'`).",
        "Низкая избирательность условия — планировщик или здравый смысл предпочтёт просмотр; устаревшая статистика.",
        "Проверить `EXPLAIN`, сравнить с принудительным планом (`NOT INDEXED`, `INDEXED BY`), измерить время и число обработанных строк.",
      ),
    ]),
  ],

  exam: [
    mcq("cs.relational-theory-indexes.e1", "foundation", "Что делает проекция `π city (Student)` с дубликатами?", ["Сохраняет все", "Сортирует их", "Удаляет их, потому что отношение — множество", "Выдаёт ошибку"], 2, "Отношение — множество кортежей: проекция из 4 студентов даёт 3 различных города; в SQL это `SELECT DISTINCT`."),
    mcq("cs.relational-theory-indexes.e2", "foundation", "Какой план соответствует поиску по индексу в SQLite?", ["SEARCH users USING INDEX idx_email (email=?)", "SCAN users", "SORT users", "MERGE users"], 0, "`SEARCH … USING INDEX` — поиск по ключу (17 инструкций в замере); `SCAN` — полный просмотр (600 011 инструкций)."),
    mcq("cs.relational-theory-indexes.e3", "foundation", "Что гарантирует фильтр Блума?", ["Он никогда не даёт ложноположительных ответов", "Он поддерживает удаление", "Он хранит значения ключей", "Он никогда не даёт ложноотрицательных: «нет» означает «точно нет»"], 3, "Ложноотрицательных нет (в замере 0 для каждой конфигурации); ложноположительные возможны с вероятностью около 0,8 % при 10 битах на ключ."),
    mcq("cs.relational-theory-indexes.e4", "intermediate", "Какой ключ у схемы R(O, C, N, P, T, Q) при `O→C`, `C→N`, `P→T`, `OP→Q`?", ["O", "OP", "P", "OC"], 1, "`{OP}⁺` содержит все атрибуты (`C, N, T, Q` по зависимостям); ни `O`, ни `P` по отдельности не определяют всю схему."),
    mcq("cs.relational-theory-indexes.e5", "intermediate", "Почему запрос `WHERE age > 70` не использует индекс `(city, age)` для поиска?", ["Индекс повреждён", "Тип `age` не подходит", "Индекс нельзя использовать для диапазонов", "Нет условия на левый префикс `city`"], 3, "Индекс упорядочен по `city`, затем по `age`; по одному `age` искать нельзя (в замере — `SCAN … USING COVERING INDEX`, то есть просмотр индекса)."),
    mcq("cs.relational-theory-indexes.e6", "intermediate", "Во сколько раз в замере число проб хеш-соединения меньше числа сравнений вложенных циклов (R и S по 4000 строк)?", ["В 2 раза", "В 40 раз", "В 4000 раз", "В 1 000 000 раз"], 2, "16 000 000 сравнений против 4000 проб — в 4000 раз (плюс построение хеш-таблицы из 4000 строк)."),
    mcq("cs.relational-theory-indexes.e7", "advanced", "Какие утверждения верны? Выберите все.", ["Разложение в BCNF всегда сохраняет все функциональные зависимости", "Соединение двух частей без потерь, если общие атрибуты — ключ одной из частей", "При выборке половины таблицы поиск по индексу может быть медленнее полного просмотра", "Индекс по выражению `lower(email)` нужен для условия `lower(email) = ?`"], [1, 2, 3], "Разложение в BCNF не всегда сохраняет зависимости; критерий без потерь для двух частей — ключ в пересечении; индекс по `active` в замере был медленнее просмотра (≈ 21 против 7,5 мс); для функции над столбцом нужен индекс по выражению."),
    open("cs.relational-theory-indexes.e8", "intermediate", "Объясните, почему «индекс на каждый столбец» — плохая стратегия, и как выбрать индексы.", [
      ul(
        "Каждый индекс — отдельная структура: в замере три индекса увеличили базу в 2,5 раза (949 → 2415 страниц) и сделали вставку в 4–5 раз дороже; индекс по столбцу с двумя значениями вообще замедляет запрос (≈ 21 против 7,5 мс).",
        "Индексы создают под реальные запросы: условия равенства и диапазонов, ключи соединений, сортировку; учитывают правило левого префикса и покрывающие индексы.",
        "Проверяют планами (`SEARCH`/`SCAN`), числом обработанных строк и временем, а неиспользуемые индексы удаляют.",
      ),
    ], ["Названа цена записи и места", "Названа низкая избирательность", "Названы критерии выбора индексов", "Упомянута проверка планом и измерением"]),
  ],

  mastery: [
    mcq("cs.relational-theory-indexes.m1", "intermediate", "Почему порядок соединений может отличаться по стоимости в десятки раз?", ["Из-за размера индексов", "Размеры промежуточных результатов зависят от порядка: рано применённые фильтры и выбор малых отношений сокращают работу", "Из-за порядка столбцов", "Это не так"], 1, "В модели лучший порядок стоит 62 500, худший допустимый — 5 252 500 (в 84 раза): промежуточные результаты определяют суммарную стоимость."),
    mcq("cs.relational-theory-indexes.m2", "advanced", "Что означает усиление записи в LSM-дереве?", ["Отношение объёма записанного на диск (с учётом слияний) к объёму записанного пользователем", "Скорость записи в память", "Количество индексов", "Число потоков записи"], 0, "В симуляции `leveled` записал 784 996 ключей при 100 000 вставок (7,8×), `size-tiered` — 359 997 (3,6×): слияния перезаписывают данные."),
    mcq("cs.relational-theory-indexes.m3", "advanced", "Как фильтры Блума помогают LSM-дереву?", ["Ускоряют запись", "Сжимают данные", "Позволяют пропустить наборы, в которых ключа точно нет: поиск отсутствующего ключа просматривает 0 наборов", "Заменяют слияния"], 2, "С фильтрами (10 бит на ключ) в симуляции поиск отсутствующего ключа просматривал 0,0 набора против 2,0–4,0 без них."),
    open("cs.relational-theory-indexes.m4", "advanced", "Спроектируйте хранилище для потока событий (100 000 записей в секунду) с редкими чтениями по идентификатору и периодическими выборками по времени. Какие структуры индексов выберете и почему?", [
      ul(
        "Запись: LSM-дерево или журнал только на добавление (append-only) с последовательной записью; размер memtable и политика слияний по требованиям к чтению; WAL для долговечности с групповой фиксацией.",
        "Чтение по идентификатору: фильтры Блума и ограничение числа наборов; чтение по времени: сортировка или разбиение по времени (партиции), разрежённый индекс по меткам времени.",
        "Компромиссы: усиление записи (3,6–7,8× в симуляции) против числа наборов при чтении; B-деревья дают быстрые чтения, но случайные записи страниц (в модели ≈ 41× без пакетирования).",
        "Проверка: нагрузочное тестирование, мониторинг глубины слияний, доли попаданий фильтров, размеров и задержек p99.",
      ),
    ], ["Выбор LSM/журнала для записи", "Фильтры Блума и разбиение по времени для чтения", "Анализ компромисса усиления записи", "План проверки нагрузкой"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "cs.relational-theory-indexes.f1", front: "Реляционная алгебра?", back: "σ выборка, π проекция (дубликаты исчезают), ⋈ соединение, ∪, −, × и деление ('для всех'). Выборку раньше соединения: 90 000 → 1800 сравнений." },
    { id: "cs.relational-theory-indexes.f2", front: "Зависимости и ключи?", back: "X→Y; замыкание X⁺; ключ — минимальный X с X⁺ = R. 3НФ: X суперключ или Y простой; BCNF: X суперключ." },
    { id: "cs.relational-theory-indexes.f3", front: "Разложение без потерь?", back: "Соединение частей = исходное отношение. Для двух частей пересечение атрибутов — ключ одной из них; иначе ложные строки (7 вместо 4)." },
    { id: "cs.relational-theory-indexes.f4", front: "Алгоритмы соединения?", back: "Вложенные циклы N·M (16 000 000), хеш N+M (4000 проб), слияние n log n (87 635), индексные N log M (55 765)." },
    { id: "cs.relational-theory-indexes.f5", front: "Индекс?", back: "SEARCH 17 инструкций против SCAN 600 011 (200 000 строк). Левый префикс; покрывающий индекс; функция над столбцом ломает индекс." },
    { id: "cs.relational-theory-indexes.f6", front: "Цена индексов?", back: "3 индекса: база 949 → 2415 страниц, вставка в 4–5 раз дороже. Низкая избирательность: индекс медленнее просмотра (≈ 21 против 7,5 мс)." },
    { id: "cs.relational-theory-indexes.f7", front: "Фильтр Блума и LSM?", back: "Нет ложноотрицательных; 10 бит/ключ → ≈ 0,8 % ложных. LSM: усиление записи 3,6–7,8×; фильтры убирают чтения отсутствующих ключей." },
    { id: "cs.relational-theory-indexes.f8", front: "Оптимизатор?", back: "Перебирает планы по оценкам (статистика). Порядок соединений: лучший 62 500, худший 5 252 500 (в 84 раза); неверная оценка — в 8 раз хуже." },
  ],

  sources: [
    { title: "Codd E. A Relational Model of Data for Large Shared Data Banks (CACM, 1970)", url: "https://doi.org/10.1145/362384.362685", publisher: "Other" },
    { title: "Garcia-Molina H., Ullman J., Widom J. Database Systems: The Complete Book", url: "https://www.pearson.com/en-us/subject-catalog/p/database-systems-the-complete-book/P200000003259", publisher: "Other" },
    { title: "Selinger P. et al. Access Path Selection in a Relational Database Management System (SIGMOD 1979)", url: "https://doi.org/10.1145/582095.582099", publisher: "Other" },
    { title: "Bloom B. Space/Time Trade-offs in Hash Coding with Allowable Errors (CACM, 1970)", url: "https://doi.org/10.1145/362686.362692", publisher: "Other" },
    { title: "O'Neil P. et al. The Log-Structured Merge-Tree (LSM-Tree) (Acta Informatica, 1996)", url: "https://doi.org/10.1007/s002360050048", publisher: "Other" },
    { title: "SQLite: Query Planning и The SQLite Query Optimizer Overview", url: "https://www.sqlite.org/optoverview.html", publisher: "Other" },
    { title: "SQLite: EXPLAIN QUERY PLAN", url: "https://www.sqlite.org/eqp.html", publisher: "Other" },
    { title: "SQLite: The dbstat Virtual Table", url: "https://www.sqlite.org/dbstat.html", publisher: "Other" },
    { title: "PostgreSQL Documentation: Indexes", url: "https://www.postgresql.org/docs/current/indexes.html", publisher: "PostgreSQL" },
  ],
};
