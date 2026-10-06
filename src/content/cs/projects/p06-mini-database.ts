import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p06MiniDatabase: Project = {
  id: "cs.p06-mini-database",
  domain: "cs",
  order: 6,
  title: "Мини-СУБД с журналом",
  subtitle: "Таблицы с ограничениями, индексы и простой планировщик, транзакции с откатом, журнал упреждающей записи с контрольной суммой и восстановление после сбоя в любой точке, соединения (вложенные циклы и хеш) и агрегаты — 42 проверки, включая сбой после каждой записи журнала",
  level: "advanced",
  estimatedHours: 16,
  buildsOn: ["cs.p02-data-structure-library"],
  topics: ["cs.relational-theory-indexes", "cs.transactions-consistency-theory", "cs.hash-tables", "cs.virtual-memory-files"],
  objective:
    "Написать модуль `minidb.mjs` — маленькую, но настоящую реляционную СУБД в памяти: схема и ограничения (`PRIMARY KEY`, `NOT NULL`, `UNIQUE`, типы), выборки с условиями, сортировкой и страницами, **индексы с планировщиком** (`explain` показывает доступ по индексу и число просмотренных строк), **транзакции** с откатом и атомарностью операторов, **журнал упреждающей записи** с контрольной суммой записей и **восстановление** после сбоя в любой точке, а также соединения (вложенные циклы и хеш-соединение с счётчиком работы) и агрегаты. Проверка «убивает» базу после каждой записи журнала, обрывает и портит записи и убеждается, что состояние всегда совпадает с одной из «границ транзакций».",
  scenario: [
    p("Вы делаете встроенное хранилище для небольшого сервиса: счета, переводы и журнал аудита. Деньги нельзя ни потерять, ни создать при сбое питания, поэтому каждая транзакция должна быть **атомарной** (перевод применён целиком или не применён вовсе), а подтверждённое — **долговечным**. Диск отказывает в самых неудобных местах: запись обрывается на середине, один символ портится, журнал перестаёт принимать записи ровно во время фиксации. Хранилище журнала — объект с тремя методами; именно его проверка «ломает»."),
    p("Заготовка лежит в `starter/minidb.mjs`: функции бросают «не реализовано». Проверка `check.mjs` (42 проверки) запускается командой `node check.mjs .` в каталоге с вашим `minidb.mjs`. Нужен только Node.js 22."),
    code("js", `// Заготовка проекта «Мини-СУБД с журналом». Реализуйте классы и функции, затем запустите:  node check.mjs .
// Имена экспортов менять нельзя. Подробные правила и контракты — в описании проекта.

export class DbError extends Error { constructor(message) { super(message); this.name = this.constructor.name; } }
export class SchemaError extends DbError {}
export class ConstraintError extends DbError {}
export class TxError extends DbError {}

export class Database {
  // Database.open(storage) — storage: { append(строка), readAll() → массив строк, truncate?(n) }
  static open(storage) { throw new Error("не реализовано: Database.open"); }
  // createTable(name, columns), createIndex(table, column), begin() → Tx, transaction(fn),
  // select(table, query), explain(table, where), dump()
}

// Tx: insert(table, row), update(table, where, set), delete(table, where), select(table, query), commit(), rollback()

export function nestedLoopJoin(left, right, leftKey, rightKey, options = {}) {
  throw new Error("не реализовано: nestedLoopJoin");
}

export function hashJoin(left, right, leftKey, rightKey, options = {}) {
  throw new Error("не реализовано: hashJoin");
}

export function aggregate(rows, spec) {
  throw new Error("не реализовано: aggregate");
}`, { filename: "starter/minidb.mjs" }),
    table(
      ["Элемент", "Контракт"],
      [
        ["Хранилище журнала `storage`", "`append(запись: string)` — запись долговечна, когда метод вернул управление; `readAll()` — массив записей в порядке добавления; необязательный `truncate(n)` — оставить первые `n` записей"],
        ["`Database.open(storage)`", "Читает журнал, применяет подряд идущие **целые** записи и останавливается на первой оборванной или испорченной; остаток отбрасывается (`truncate`, если есть); ничего не записывает"],
        ["`createTable(name, columns)` · `createIndex(table, column)`", "Столбцы `{ name, type: \"int\" | \"real\" | \"text\" | \"bool\", primaryKey?, notNull?, unique? }`; ровно один первичный ключ; DDL — только вне транзакции и попадает в журнал"],
        ["`begin()` → `Tx` · `transaction(fn)`", "Одна открытая транзакция; `tx.insert(table, row)`, `tx.update(table, where, set)` → число строк, `tx.delete(table, where)` → число строк, `tx.select(table, query)`, `commit()`, `rollback()`; `transaction` фиксирует при возврате и откатывает при исключении"],
        ["`select(table, { where, orderBy, limit, offset, columns })`", "Вне транзакции; условия `{ столбец: значение }` или `{ столбец: { eq, ne, lt, lte, gt, gte, in } }` (несколько — через И); порядок по умолчанию — по первичному ключу; `null` в упорядочении идёт первым, ничьи — по первичному ключу"],
        ["`explain(table, where)`", "`{ access: \"index-eq\" | \"index-range\" | \"full-scan\", index, rowsExamined }` — самый узкий доступ по индексам (первичный ключ и `UNIQUE` индексируются сами); `rowsExamined` — число кандидатов, найденных через индекс, или размер таблицы"],
        ["`dump()`", "`{ таблица: [строки по возрастанию ключа] }` — копия состояния (для сравнений)"],
        ["`nestedLoopJoin` · `hashJoin(left, right, leftKey, rightKey, { kind, rightColumns })`", "`{ rows, work }`; `work` — число просмотренных пар (вложенные циклы: `|левая|·|правая|`) или строк (хеш: `|левая| + |правая|`); `kind: \"left\"` добавляет несовпавшие левые строки с `null` в `rightColumns`; `null`-ключи не соединяются; при совпадении имён правая колонка перезаписывает левую"],
        ["`aggregate(rows, { by, compute })`", "`compute: { псевдоним: [\"count\"] | [\"count\" | \"sum\" | \"avg\" | \"min\" | \"max\", столбец] }`; `null` игнорируется (кроме `count` без столбца); группы по возрастанию ключа, `null` первым; без группировки на пустом входе — одна строка"],
      ],
      "Контракт модуля",
    ),
  ],
  requirements: [
    "`minidb.mjs` экспортирует `DbError`, `SchemaError`, `ConstraintError`, `TxError` (последние три наследуют `DbError`), `Database`, `nestedLoopJoin`, `hashJoin`, `aggregate`.",
    "Ограничения: `int` — только целые безопасные числа, `real` — конечные, `text` — строки, `bool` — логические; `NOT NULL`, пустой и повторный первичный ключ, `UNIQUE` (несколько `null` допустимы), неизвестный столбец → `ConstraintError`; ошибки схемы (повторная таблица, нет или два первичных ключа, неизвестный столбец, оператор, таблица) → `SchemaError`.",
    "Строки хранятся и возвращаются **копиями**: изменение вставленного объекта или результата `select` не меняет базу.",
    "Условия: `ne` и сравнения не берут `null` (в JavaScript `null < 3` истинно — это ловушка), `{ столбец: null }` ищет `null`; результат не зависит от наличия индексов.",
    "Каждый оператор атомарен: `UPDATE` нескольких строк, упавший на третьей из-за `UNIQUE`, не меняет ни одной; транзакция остаётся рабочей; `rollback` отменяет вставки, обновления, удаления и смену первичного ключа.",
    "Изоляция упрощена до одного писателя: `begin` при открытой транзакции, операции после завершения, DDL и вложенный `transaction` внутри транзакции → `TxError`; чтение `db.select` при открытой транзакции → `TxError` (внутри — `tx.select`, он видит собственные изменения).",
    "Индексы: `createIndex` поддерживает индекс при `insert`, `update`, `delete`, откате и восстановлении; `explain` выбирает самое узкое условие; `!=` и пустое условие — полный перебор; результат совпадает с независимым эталоном на 150 случайных запросах при 0, 1 и 2 индексах.",
    "Журнал: каждая подтверждённая транзакция и каждый DDL попадают в журнал; пустая транзакция, откат и неудачные операторы — нет; записи защищены контрольной суммой; сбой записи во время фиксации (`append` бросает исключение) пробрасывается вызывающему, состояние в памяти откатывается, база остаётся работоспособной.",
    "Восстановление: после сбоя в любой точке состояние — одна из «границ» (до и после каждой операции целиком), монотонно по длине префикса журнала; оборванная (на половину или на символ) и испорченная запись останавливают применение; после восстановления новые транзакции долговечны.",
    "`hashJoin` и `nestedLoopJoin` возвращают одинаковые строки в одном порядке (по левой, затем по правой таблице) на 100 случайных отношениях; на 1000×1000 строк `work` равен 1 000 000 и 2000.",
  ],
  constraints: [
    "Только стандартные средства JavaScript; никаких библиотек и настоящих файлов.",
    "Журнал — только через переданное `storage`; записи — строки; формат записи выбираете вы (в эталоне — контрольная сумма CRC-32 и JSON).",
    "Восстановление не должно полагаться на то, что журнал целый: любая запись может быть оборвана или испорчена.",
    "Операторы изменяют данные «на месте» с журналом отмены или применяются к копии — но результат отката должен совпадать с состоянием до транзакции побитово (`dump()`).",
    "Нельзя использовать `db.select` внутри транзакции и нельзя хранить ссылки на внутренние строки в результатах.",
  ],
  expected: [
    "`node check.mjs .` печатает `Пройдено проверок: 42 из 42`.",
    "В банковском сценарии (5 счетов по 100, 20 переводов с записью в аудит) журнал состоит из 23 записей; для каждого из 24 префиксов восстановленное состояние совпадает с одним из 24 «границ», суммы остатков равны 500.",
    "`explain(\"acc\", { owner: \"o4\" })` для `UNIQUE`-столбца даёт `index-eq` и `rowsExamined = 1`; `explain(\"acc\", { balance: 30 })` без индекса — `full-scan` и размер таблицы.",
  ],
  technical: [
    "**Журнал отмены и повтора.** Применяйте оператор к таблицам сразу, но записывайте в журнал отмены обратное действие (`removeRow` для вставки, обратная замена для обновления и удаления); откат — выполнение журнала отмены в обратном порядке; в журнал упреждающей записи попадает список повторяемых операций при фиксации.",
    "**Атомарность записи.** Если вся транзакция — **одна** запись журнала, она либо целая, либо обнаруживается как оборванная по контрольной сумме; тогда восстановление сводится к «применять записи, пока контрольная сумма сходится».",
    "**Контрольная сумма.** CRC-32 от JSON плюс восьмисимвольный префикс: изменение одного символа или обрыв делают сумму неверной. Проверяйте и длину префикса, и разбор JSON.",
    "**Хвост и дальнейшие записи.** После обнаружения повреждённой записи журнал нужно **обрезать** (`truncate`): иначе новые записи окажутся за мусором, и при следующем открытии потеряются.",
    "**Индекс.** Упорядоченный массив пар `(значение, ключ)` с двоичным поиском: равенство и диапазон — два поиска границ; `null` в индекс не попадает при поиске, но хранится (порядок: `null` первым).",
    "**Планировщик.** Для каждого индекса соберите условия на его столбце, посчитайте кандидатов (равенство, `in`, диапазон) и выберите минимальных; остальные условия применяются как фильтр после выбора кандидатов. Полный перебор — запасной вариант.",
    "**Хеш-соединение.** Постройте таблицу «ключ → список строк правой стороны» по порядку, затем проходите левую и выдавайте совпадения в порядке правой стороны; ключи `null` не добавляются и не ищутся.",
    "**Агрегаты.** Группируйте по `JSON.stringify` кортежа ключей, сортируйте группы вашим сравнением (`null` первым), `avg` — сумма / число значений, не считая `null`.",
  ],
  acceptance: [
    "`node check.mjs .` — 42 из 42.",
    "Заготовка проходит 1 из 42 проверок (экспорты).",
    "Каждый из двадцати двух «плохих» вариантов проваливает не менее одной проверки: от 1 (диапазон берёт `null`, `ORDER BY ... DESC` игнорируется, оператор не атомарен, грязное чтение, хеш-соединение с квадратичной работой, агрегат без строки на пустом входе, нет контрольной суммы, применение записей после повреждённой, нет обрезки хвоста, сбой фиксации оставляет изменения в памяти) до 20 (границы индекса наоборот).",
    "Сбой после **каждой** записи журнала (24 префикса), оборванная и испорченная запись в каждой позиции и сбой записи во время фиксации не нарушают атомарность и долговечность.",
  ],
  hints: [
    "Сначала реализуйте базу без журнала и транзакций: таблица, ограничения, `select` и `explain`; затем добавьте транзакции с журналом отмены; только потом — журнал упреждающей записи и восстановление.",
    "Если `select` по индексу и полный перебор дают разные результаты, ищите ошибку в границах диапазона (`>` и `>=`) и в обработке `null`; напишите свою сверку «запрос с индексом против запроса без индекса» на случайных данных.",
    "Если после восстановления деньги «потерялись» — вы записываете в журнал отдельные операции без метки фиксации. Проще всего писать всю транзакцию **одной** записью в момент `commit`.",
    "Если новые записи пропадают после повторного открытия, а в журнале был оборванный хвост — вы не обрезаете журнал (`truncate`) после восстановления.",
    "Если откат «не доходит» до начала — журнал отмены нужно выполнять в обратном порядке, а откат оператора — только до метки начала этого оператора.",
    "Для проверки журнала напишите свою функцию: «для каждого префикса журнала открыть базу и сверить `dump()` со списком ожидаемых состояний» — это тот же цикл, что в проверке.",
    "Не используйте `db.select` внутри транзакции: сначала это кажется удобным, а потом вы получаете грязное чтение собственных изменений в самых неожиданных местах.",
  ],
  advanced: [
    "Добавьте многоверсионность (MVCC): каждая строка хранит версии, читающие транзакции видят снимок на момент начала; сравните с одной-единственной блокировкой.",
    "Реализуйте контрольные точки: снимок состояния в журнал и усечение старых записей; проверьте, что восстановление ускоряется, а результат тот же.",
    "Добавьте составные индексы и оптимизацию «покрывающий индекс» (запрос отвечает без обращения к таблице).",
    "Реализуйте соединение слиянием (merge join) по отсортированным входам и выбор между тремя видами соединения по оценке стоимости.",
    "Добавьте двухфазную фиксацию для двух баз и покажите блокировку участников при сбое координатора (см. тему «Транзакции и согласованность»).",
  ],
  failureModes: [
    "**Типы не проверяются:** в `int` попадает строка; красных 2 проверки из 42.",
    "**`UNIQUE` не проверяется при обновлении:** `update` создаёт дубликат; 3 проверки.",
    "**`ne` берёт `null`:** `balance != 30` возвращает строки без значения; 2 проверки.",
    "**Диапазон берёт `null`** (`null < 3` истинно): строки без значения попадают в результат при полном переборе, но не при поиске по индексу — результат зависит от индекса; 1 проверка.",
    "**`ORDER BY ... DESC` игнорируется:** порядок по возрастанию; 1 проверка.",
    "**Оператор не атомарен:** `UPDATE`, упавший на третьей строке, оставляет две изменённые; 1 проверка.",
    "**Откат не отменяет обновления:** после `rollback` остаются новые значения; красных 5 проверок.",
    "**Грязное чтение вне транзакции:** `db.select` видит незафиксированные изменения; 1 проверка.",
    "**Вложенные транзакции допускаются:** вторая `begin` тихо перетирает первую; 2 проверки.",
    "**Индекс не обновляется при `update`:** поиск по индексу возвращает старые значения; 2 проверки.",
    "**Планировщик всегда выбирает полный перебор:** результат верен, `explain` и скорость — нет; 4 проверки.",
    "**Нижняя граница индекса учитывается наоборот** (включительная исключается, исключительная включается): равенство через индекс ничего не находит, уникальность не проверяется; **красных 20 проверок** из 42 — всё, что опирается на индекс, включая восстановление.",
    "**Хеш-соединение: `null` соединяется с `null`:** лишние строки; 3 проверки.",
    "**Хеш-соединение с квадратичным `work`:** счётчик показывает 1 000 000 вместо 2000; 1 проверка.",
    "**Левое соединение без заполнения `null`:** несовпавшие строки пропадают; 2 проверки.",
    "**`sum` и `avg` учитывают `null`:** значение `null` превращает сумму в строку или `NaN`; 2 проверки.",
    "**Агрегат без группировки на пустом входе не возвращает строку:** `count` пропадает; 1 проверка.",
    "**Нет контрольной суммы:** испорченная запись применяется, если JSON ещё разбирается; 1 проверка.",
    "**После повреждённой записи применение продолжается:** состояние «перескакивает» через дыру и нарушает порядок транзакций; 1 проверка.",
    "**Хвост журнала не обрезается:** новые транзакции пишутся за мусором и теряются при следующем открытии; 1 проверка.",
    "**Сбой фиксации оставляет изменения в памяти:** при явном `commit` транзакция остаётся «висеть» с неподтверждёнными данными; 1 проверка.",
    "**Индексы не попадают в журнал:** после восстановления `explain` показывает полный перебор; 2 проверки.",
  ],
  rubric: [
    { criterion: "Схема, ограничения, запросы", weight: 20, description: "Типы, `NOT NULL`, `UNIQUE`, первичный ключ, условия с `null`, сортировка, страницы, копии строк, атомарность операторов." },
    { criterion: "Транзакции", weight: 20, description: "Откат, журнал отмены, одна открытая транзакция, `transaction(fn)`, видимость собственных изменений, ошибки состояния." },
    { criterion: "Индексы и планировщик", weight: 15, description: "Поддержка индексов во всех операциях, `explain`, выбор самого узкого доступа, независимость результата от индексов." },
    { criterion: "Журнал и восстановление", weight: 30, description: "Контрольная сумма, граница транзакции, сбой в любой точке, оборванные и испорченные записи, обрезка хвоста, сбой фиксации, восстановление DDL и индексов." },
    { criterion: "Соединения и агрегаты", weight: 10, description: "Хеш-соединение и вложенные циклы с равным результатом и разной работой, левое соединение, `null`, агрегаты." },
    { criterion: "Чистота", weight: 5, description: "Закрытые поля, читаемые функции, ошибки с понятными сообщениями." },
  ],
  solution: [
    p("Эталон — один файл `minidb.mjs` (около 260 строк). Он проходит все 42 проверки; заготовка проходит 1 из 42, а каждый из двадцати двух намеренно испорченных вариантов — меньше 42."),
    h("minidb.mjs"),
    code("js", `// minidb.mjs — мини-СУБД: таблицы с ограничениями, индексы и простой планировщик, транзакции с журналом упреждающей записи и восстановлением, соединения и агрегаты

export class DbError extends Error { constructor(message) { super(message); this.name = this.constructor.name; } }
export class SchemaError extends DbError {}
export class ConstraintError extends DbError {}
export class TxError extends DbError {}

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (s) => { let c = 0xffffffff; for (const b of new TextEncoder().encode(s)) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return ((c ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0"); };
const frame = (obj) => { const json = JSON.stringify(obj); return \`\${crc32(json)} \${json}\`; };
const unframe = (rec) => { const i = rec.indexOf(" "); if (i !== 8) return null; const json = rec.slice(9); if (crc32(json) !== rec.slice(0, 8)) return null; try { return JSON.parse(json); } catch { return null; } };

const TYPES = { int: (v) => Number.isSafeInteger(v), real: (v) => typeof v === "number" && Number.isFinite(v), text: (v) => typeof v === "string", bool: (v) => typeof v === "boolean" };
const cmp = (a, b) => (a === null ? (b === null ? 0 : -1) : b === null ? 1 : a < b ? -1 : a > b ? 1 : 0);

/* ───────── условия ───────── */
function normalizeWhere(table, where = {}) {
  const conds = [];
  for (const [col, spec] of Object.entries(where)) {
    if (!table.columns.has(col)) throw new SchemaError(\`неизвестный столбец «\${col}» в таблице \${table.name}\`);
    if (spec !== null && typeof spec === "object" && !Array.isArray(spec)) { for (const [op, v] of Object.entries(spec)) { if (!["eq", "ne", "lt", "lte", "gt", "gte", "in"].includes(op)) throw new SchemaError(\`неизвестный оператор «\${op}»\`); conds.push({ col, op, v }); } }
    else conds.push({ col, op: "eq", v: spec });
  }
  return conds;
}
const matches = (row, c) => {
  const x = row[c.col];
  switch (c.op) {
    case "eq": return c.v === null ? x === null : x !== null && x === c.v;
    case "ne": return x !== null && x !== c.v;
    case "in": return c.v.includes(x);
    default: if (x === null || c.v === null) return false; return c.op === "lt" ? x < c.v : c.op === "lte" ? x <= c.v : c.op === "gt" ? x > c.v : x >= c.v;
  }
};

/* ───────── таблица и индексы ───────── */
class Index {
  constructor(col, unique) { this.col = col; this.unique = unique; this.entries = []; }                    // [значение, pk], по возрастанию (значение, pk)
  #pos(v, pk, strictPk) { let lo = 0, hi = this.entries.length; while (lo < hi) { const m = (lo + hi) >> 1, [ev, ep] = this.entries[m], c = cmp(ev, v) || (strictPk ? cmp(ep, pk) : 0); if (c < 0) lo = m + 1; else hi = m; } return lo; }
  add(v, pk) { this.entries.splice(this.#pos(v, pk, true), 0, [v, pk]); }
  remove(v, pk) { const i = this.#pos(v, pk, true); if (this.entries[i] && cmp(this.entries[i][0], v) === 0 && this.entries[i][1] === pk) this.entries.splice(i, 1); }
  has(v) { if (v === null) return false; const i = this.#pos(v, null, false); return i < this.entries.length && cmp(this.entries[i][0], v) === 0; }
  range(lo, loIncl, hi, hiIncl) {                                                                              // pk-ключи с lo ≤/< значение ≤/< hi (null — без границы)
    const out = []; let i = lo === null ? 0 : this.#pos(lo, null, false);
    for (; i < this.entries.length; i++) { const [v, pk] = this.entries[i]; if (v === null) continue; if (lo !== null && !loIncl && cmp(v, lo) === 0) continue; if (hi !== null && (cmp(v, hi) > 0 || (!hiIncl && cmp(v, hi) === 0))) break; out.push(pk); }
    return out;
  }
}
class Table {
  constructor(name, defs) {
    this.name = name; this.columns = new Map(defs.map((d) => [d.name, d])); this.rows = new Map(); this.indexes = new Map();
    this.pk = defs.find((d) => d.primaryKey).name;
    for (const d of defs) if (d.primaryKey || d.unique) this.indexes.set(d.name, new Index(d.name, true));
  }
  candidates(conds) {                                                                                          // → { access, index, pks } — самый узкий доступ по индексу или полный перебор
    let best = null;
    for (const [col, idx] of this.indexes) {
      const mine = conds.filter((c) => c.col === col && c.op !== "ne");
      if (!mine.length) continue;
      let pks = null, access = "index-eq";
      const eq = mine.find((c) => c.op === "eq" && c.v !== null), inn = mine.find((c) => c.op === "in");
      if (eq) pks = idx.range(eq.v, true, eq.v, true);
      else if (inn) pks = [...new Set(inn.v.filter((v) => v !== null))].flatMap((v) => idx.range(v, true, v, true));
      else { access = "index-range"; let lo = null, loI = true, hi = null, hiI = true; for (const c of mine) { if (c.v === null) continue; if (c.op === "gt" || c.op === "gte") { if (lo === null || cmp(c.v, lo) > 0 || (cmp(c.v, lo) === 0 && c.op === "gt")) { lo = c.v; loI = c.op === "gte"; } } if (c.op === "lt" || c.op === "lte") { if (hi === null || cmp(c.v, hi) < 0 || (cmp(c.v, hi) === 0 && c.op === "lt")) { hi = c.v; hiI = c.op === "lte"; } } } if (lo === null && hi === null) continue; pks = idx.range(lo, loI, hi, hiI); }
      if (!best || pks.length < best.pks.length) best = { access, index: col, pks };
    }
    return best ?? { access: "full-scan", index: null, pks: [...this.rows.keys()] };
  }
  find(conds) { const c = this.candidates(conds); return { ...c, rows: c.pks.map((pk) => this.rows.get(pk)).filter((r) => r && conds.every((x) => matches(r, x))) }; }
  addRow(row) { this.rows.set(row[this.pk], row); for (const [col, idx] of this.indexes) idx.add(row[col], row[this.pk]); }
  removeRow(row) { this.rows.delete(row[this.pk]); for (const [col, idx] of this.indexes) idx.remove(row[col], row[this.pk]); }
}

/* ───────── база данных ───────── */
export class Database {
  #tables = new Map(); #storage; #active = null;
  constructor(storage) { this.#storage = storage; }
  /** Открывает базу: применяет подряд идущие целые записи журнала до первой повреждённой, хвост отбрасывается. */
  static open(storage) {
    const db = new Database(storage), records = storage.readAll(); let valid = 0;
    for (const rec of records) { const e = unframe(rec); if (!e) break; db.#replay(e); valid++; }
    if (valid < records.length && storage.truncate) storage.truncate(valid);
    return db;
  }
  #replay(e) {
    if (e.type === "ddl") { if (e.op === "createTable") this.#tables.set(e.name, new Table(e.name, e.columns)); else this.#tables.get(e.table).indexes.set(e.column, this.#buildIndex(this.#tables.get(e.table), e.column, e.unique)); }
    else for (const o of e.ops) { const t = this.#tables.get(o.table); if (o.op === "insert") t.addRow(o.row); else if (o.op === "delete") t.removeRow(t.rows.get(o.pk)); else { const old = t.rows.get(o.pk); t.removeRow(old); t.addRow({ ...old, ...o.set }); } }
  }
  #buildIndex(t, col, unique) { const idx = new Index(col, unique); for (const r of t.rows.values()) idx.add(r[col], r[t.pk]); return idx; }
  #table(name) { const t = this.#tables.get(name); if (!t) throw new SchemaError(\`нет таблицы «\${name}»\`); return t; }
  createTable(name, columns) {
    if (this.#active) throw new TxError("DDL внутри транзакции не поддерживается");
    if (this.#tables.has(name)) throw new SchemaError(\`таблица «\${name}» уже есть\`);
    const names = new Set(); let pks = 0;
    for (const c of columns) { if (!TYPES[c.type]) throw new SchemaError(\`неизвестный тип «\${c.type}»\`); if (names.has(c.name)) throw new SchemaError(\`повторный столбец «\${c.name}»\`); names.add(c.name); if (c.primaryKey) pks++; }
    if (pks !== 1) throw new SchemaError("нужен ровно один первичный ключ");
    const defs = columns.map((c) => ({ name: c.name, type: c.type, primaryKey: !!c.primaryKey, notNull: !!(c.notNull || c.primaryKey), unique: !!c.unique }));
    this.#storage.append(frame({ type: "ddl", op: "createTable", name, columns: defs }));
    this.#tables.set(name, new Table(name, defs));
  }
  createIndex(table, column) {
    if (this.#active) throw new TxError("DDL внутри транзакции не поддерживается");
    const t = this.#table(table); if (!t.columns.has(column)) throw new SchemaError(\`нет столбца «\${column}»\`);
    if (t.indexes.has(column)) return;
    this.#storage.append(frame({ type: "ddl", op: "createIndex", table, column, unique: false }));
    t.indexes.set(column, this.#buildIndex(t, column, false));
  }
  begin() { if (this.#active) throw new TxError("транзакция уже открыта"); const tx = new Tx(this, this.#tables, (ops) => this.#storage.append(frame({ type: "tx", ops })), () => { this.#active = null; }); this.#active = tx; return tx; }
  transaction(fn) { const tx = this.begin(); try { const r = fn(tx); tx.commit(); return r; } catch (e) { if (!tx.finished) tx.rollback(); throw e; } }
  select(table, query = {}) { if (this.#active) throw new TxError("пока транзакция открыта, читайте через tx.select"); return this.#select(this.#table(table), query).rows; }
  explain(table, where = {}) { const t = this.#table(table), c = t.candidates(normalizeWhere(t, where)); return { access: c.access, index: c.index, rowsExamined: c.pks.length }; }
  dump() { const out = {}; for (const [n, t] of this.#tables) out[n] = [...t.rows.values()].sort((a, b) => cmp(a[t.pk], b[t.pk])).map((r) => ({ ...r })); return out; }
  #select(t, { where, orderBy, limit, offset = 0, columns } = {}) {
    let rows = t.find(normalizeWhere(t, where)).rows.sort((a, b) => cmp(a[t.pk], b[t.pk]));
    const keys = orderBy === undefined ? [] : (Array.isArray(orderBy) ? orderBy : [orderBy]).map((o) => (typeof o === "string" ? [o, "asc"] : Object.entries(o)[0]));
    for (const [c] of keys) if (!t.columns.has(c)) throw new SchemaError(\`неизвестный столбец «\${c}»\`);
    if (keys.length) rows = rows.sort((a, b) => { for (const [c, dir] of keys) { const r = cmp(a[c], b[c]); if (r) return dir === "desc" ? -r : r; } return cmp(a[t.pk], b[t.pk]); });
    rows = rows.slice(offset, limit === undefined ? undefined : offset + limit);
    return { rows: rows.map((r) => (columns ? Object.fromEntries(columns.map((c) => [c, r[c]])) : { ...r })) };
  }
  _select(t, q) { return this.#select(t, q); }
}
class Tx {
  #db; #tables; #commit; #release; #redo = []; #undo = []; finished = false;
  constructor(db, tables, commit, release) { this.#db = db; this.#tables = tables; this.#commit = commit; this.#release = release; }
  #live() { if (this.finished) throw new TxError("транзакция завершена"); }
  #table(n) { const t = this.#tables.get(n); if (!t) throw new SchemaError(\`нет таблицы «\${n}»\`); return t; }
  #check(t, row, selfPk) {
    for (const k of Object.keys(row)) if (!t.columns.has(k)) throw new ConstraintError(\`неизвестный столбец «\${k}»\`);
    const out = {};
    for (const [name, d] of t.columns) { const v = row[name] === undefined ? null : row[name]; if (v === null) { if (d.notNull) throw new ConstraintError(\`столбец «\${name}» не может быть NULL\`); } else if (!TYPES[d.type](v)) throw new ConstraintError(\`значение \${JSON.stringify(v)} не подходит к типу \${d.type} (столбец «\${name}»)\`); out[name] = v; }
    for (const [col, idx] of t.indexes) if (idx.unique && out[col] !== null) { const hit = idx.range(out[col], true, out[col], true); if (hit.some((pk) => pk !== selfPk)) throw new ConstraintError(\`нарушено ограничение уникальности «\${col}» = \${JSON.stringify(out[col])}\`); }
    return out;
  }
  #stmt(fn) { const mark = this.#undo.length, redoMark = this.#redo.length; try { return fn(); } catch (e) { while (this.#undo.length > mark) this.#undo.pop()(); this.#redo.length = redoMark; throw e; } }
  insert(table, row) {
    this.#live(); const t = this.#table(table);
    return this.#stmt(() => { const r = this.#check(t, row, undefined); t.addRow(r); this.#undo.push(() => t.removeRow(r)); this.#redo.push({ op: "insert", table, row: r }); return { ...r }; });
  }
  update(table, where, set) {
    this.#live(); const t = this.#table(table), conds = normalizeWhere(t, where);
    return this.#stmt(() => {
      const rows = t.find(conds).rows; let n = 0;
      for (const old of rows) {
        const merged = this.#check(t, { ...old, ...set }, old[t.pk]), changed = {}; for (const k of Object.keys(set)) changed[k] = merged[k];
        t.removeRow(old); t.addRow(merged); this.#undo.push(() => { t.removeRow(merged); t.addRow(old); }); this.#redo.push({ op: "update", table, pk: old[t.pk], set: changed }); n++;
      }
      return n;
    });
  }
  delete(table, where) {
    this.#live(); const t = this.#table(table), conds = normalizeWhere(t, where);
    return this.#stmt(() => { const rows = t.find(conds).rows; for (const r of rows) { t.removeRow(r); this.#undo.push(() => t.addRow(r)); this.#redo.push({ op: "delete", table, pk: r[t.pk] }); } return rows.length; });
  }
  select(table, query) { this.#live(); return this.#db._select(this.#table(table), query).rows; }
  commit() {
    this.#live();
    try { if (this.#redo.length) this.#commit(this.#redo); } catch (e) { this.rollback(); throw e; }
    this.finished = true; this.#release();
  }
  rollback() { if (this.finished) throw new TxError("транзакция завершена"); while (this.#undo.length) this.#undo.pop()(); this.finished = true; this.#release(); }
}

/* ───────── соединения и агрегаты ───────── */
const joinRow = (l, r) => ({ ...l, ...r });
export function nestedLoopJoin(left, right, leftKey, rightKey, { kind = "inner", rightColumns = [] } = {}) {
  const rows = [], nulls = Object.fromEntries(rightColumns.map((c) => [c, null])); let work = 0;
  for (const l of left) { let hit = false; for (const r of right) { work++; if (l[leftKey] !== null && l[leftKey] === r[rightKey]) { rows.push(joinRow(l, r)); hit = true; } } if (!hit && kind === "left") rows.push(joinRow(l, nulls)); }
  return { rows, work };
}
export function hashJoin(left, right, leftKey, rightKey, { kind = "inner", rightColumns = [] } = {}) {
  const buckets = new Map(), rows = [], nulls = Object.fromEntries(rightColumns.map((c) => [c, null])); let work = 0;
  for (const r of right) { work++; if (r[rightKey] === null) continue; if (!buckets.has(r[rightKey])) buckets.set(r[rightKey], []); buckets.get(r[rightKey]).push(r); }
  for (const l of left) { work++; const m = l[leftKey] === null ? undefined : buckets.get(l[leftKey]); if (m) for (const r of m) rows.push(joinRow(l, r)); else if (kind === "left") rows.push(joinRow(l, nulls)); }
  return { rows, work };
}
export function aggregate(rows, { by = [], compute = {} }) {
  const groups = new Map();
  for (const r of rows) { const key = JSON.stringify(by.map((c) => r[c])); if (!groups.has(key)) groups.set(key, { keys: by.map((c) => r[c]), rows: [] }); groups.get(key).rows.push(r); }
  if (!by.length && !groups.size) groups.set("[]", { keys: [], rows: [] });
  const out = [...groups.values()].sort((a, b) => { for (let i = 0; i < by.length; i++) { const c = cmp(a.keys[i], b.keys[i]); if (c) return c; } return 0; });
  return out.map((g) => {
    const row = Object.fromEntries(by.map((c, i) => [c, g.keys[i]]));
    for (const [alias, [fn, col]] of Object.entries(compute)) {
      const vals = col === undefined ? g.rows : g.rows.map((r) => r[col]).filter((v) => v !== null);
      row[alias] = fn === "count" ? vals.length : !vals.length ? null : fn === "sum" ? vals.reduce((s, v) => s + v, 0) : fn === "avg" ? vals.reduce((s, v) => s + v, 0) / vals.length : fn === "min" ? vals.reduce((m, v) => (v < m ? v : m)) : vals.reduce((m, v) => (v > m ? v : m));
    }
    return row;
  });
}`, { filename: "minidb.mjs", lineNumbers: true }),
    h("Самопроверка check.mjs"),
    p("Центральные проверки — **цикл по всем префиксам журнала**: для банковского сценария (создание двух таблиц, пять счетов, двадцать переводов с аудитом) база открывается из каждого префикса журнала и сверяется с 24 эталонными снимками; те же снимки используются для оборванных и испорченных записей. Эталон запросов написан независимо (массивы и сортировка), эталон соединений — вложенные циклы."),
    code("js", `// Самопроверка проекта «Мини-СУБД с журналом». Запуск: node check.mjs [каталог с minidb.mjs]
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = path.resolve(process.argv[2] ?? "solution");
const M = await import(pathToFileURL(path.join(dir, "minidb.mjs")).href);
const { DbError, SchemaError, ConstraintError, TxError, Database, nestedLoopJoin, hashJoin, aggregate } = M;

let total = 0, passed = 0;
function check(name, fn) {
  total++;
  let ok = false, note = "";
  try { const r = fn(); ok = r === true; if (!ok) note = \` (вернуло \${typeof r === "object" ? JSON.stringify(r)?.slice(0, 90) : String(r)})\`; } catch (e) { note = \` (\${e?.name ?? "Error"}: \${String(e?.message ?? e).split("\\n")[0].slice(0, 90)})\`; }
  if (ok) passed++;
  console.log(\`\${ok ? "OK " : "НЕТ"}  \${name}\${ok ? "" : note}\`);
}
const J = JSON.stringify;
const seeded = (sd) => { let x = sd >>> 0; return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; };
const throwsAs = (f, K) => { try { f(); return false; } catch (e) { return e instanceof K || e?.name === K.name; } };
class Log {
  constructor(records = []) { this.records = [...records]; this.appends = 0; this.failAt = Infinity; }
  append(r) { if (++this.appends >= this.failAt) throw new Error("диск недоступен"); this.records.push(r); }
  readAll() { return [...this.records]; }
  truncate(n) { this.records.length = n; }
}
const open = (records) => { const log = new Log(records); return [Database.open(log), log]; };
const accountCols = [{ name: "id", type: "int", primaryKey: true }, { name: "owner", type: "text", unique: true }, { name: "balance", type: "int", notNull: true }, { name: "note", type: "text" }];
const fresh = () => { const [db, log] = open(); db.createTable("acc", accountCols); return [db, log]; };
const seed = (db, n = 6) => db.transaction((tx) => { for (let i = 1; i <= n; i++) tx.insert("acc", { id: i, owner: "o" + i, balance: i * 10, note: i % 2 ? null : "n" + i }); });

// ── Схема и ограничения ──
check("экспортированы ошибки (DbError и три потомка), Database, nestedLoopJoin, hashJoin, aggregate", () => [DbError, SchemaError, ConstraintError, TxError, Database, nestedLoopJoin, hashJoin, aggregate].every((x) => typeof x === "function") && new SchemaError("x") instanceof DbError && new ConstraintError("x").name === "ConstraintError");
check("createTable: повторная таблица, нет первичного ключа, два ключа, повторный столбец, неизвестный тип → SchemaError", () => { const [db] = open(); db.createTable("t", [{ name: "id", type: "int", primaryKey: true }]); return throwsAs(() => db.createTable("t", [{ name: "id", type: "int", primaryKey: true }]), SchemaError) && throwsAs(() => db.createTable("a", [{ name: "x", type: "int" }]), SchemaError) && throwsAs(() => db.createTable("b", [{ name: "x", type: "int", primaryKey: true }, { name: "y", type: "int", primaryKey: true }]), SchemaError) && throwsAs(() => db.createTable("c", [{ name: "x", type: "int", primaryKey: true }, { name: "x", type: "text" }]), SchemaError) && throwsAs(() => db.createTable("d", [{ name: "x", type: "blob", primaryKey: true }]), SchemaError); });
check("insert/select: строки по возрастанию первичного ключа; вставленный объект и возвращённые строки — копии (изменение снаружи не влияет на базу)", () => { const [db] = fresh(); const row = { id: 2, owner: "b", balance: 5, note: null }; const r = db.transaction((tx) => { tx.insert("acc", { id: 3, owner: "c", balance: 1 }); return tx.insert("acc", row); }); row.balance = 999; r.balance = 888; const got = db.select("acc"); got[0].balance = 777; return J(db.select("acc").map((x) => [x.id, x.balance])) === "[[2,5],[3,1]]" && db.select("acc")[1].note === null; });
check("типы: int не принимает 1.5, \\"1\\", NaN; text — число; bool — 0; real принимает 1.5, но не Infinity; null в необязательном столбце допустим", () => { const [db] = open(); db.createTable("t", [{ name: "id", type: "int", primaryKey: true }, { name: "s", type: "text" }, { name: "b", type: "bool" }, { name: "r", type: "real" }]); const ins = (row) => db.transaction((tx) => tx.insert("t", row)); return throwsAs(() => ins({ id: 1.5 }), ConstraintError) && throwsAs(() => ins({ id: "1" }), ConstraintError) && throwsAs(() => ins({ id: NaN }), ConstraintError) && throwsAs(() => ins({ id: 1, s: 5 }), ConstraintError) && throwsAs(() => ins({ id: 1, b: 0 }), ConstraintError) && throwsAs(() => ins({ id: 1, r: Infinity }), ConstraintError) && ins({ id: 1, r: 1.5, b: false, s: null }).r === 1.5; });
check("ограничения: NOT NULL, пустой первичный ключ, повтор ключа, неизвестный столбец, отсутствующие столбцы становятся null → ConstraintError", () => { const [db] = fresh(); const ins = (row) => db.transaction((tx) => tx.insert("acc", row)); const ok = ins({ id: 1, balance: 5 }); return throwsAs(() => ins({ id: 2 }), ConstraintError) && throwsAs(() => ins({ balance: 1 }), ConstraintError) && throwsAs(() => ins({ id: 1, balance: 1 }), ConstraintError) && throwsAs(() => ins({ id: 3, balance: 1, ghost: 1 }), ConstraintError) && ok.owner === null && ok.note === null; });
check("UNIQUE: повтор значения → ConstraintError; несколько null допустимы; обновление на занятое значение → ConstraintError", () => { const [db] = fresh(); db.transaction((tx) => { tx.insert("acc", { id: 1, owner: "a", balance: 1 }); tx.insert("acc", { id: 2, owner: null, balance: 1 }); tx.insert("acc", { id: 3, owner: null, balance: 1 }); }); return throwsAs(() => db.transaction((tx) => tx.insert("acc", { id: 4, owner: "a", balance: 1 })), ConstraintError) && throwsAs(() => db.transaction((tx) => tx.update("acc", { id: 2 }, { owner: "a" })), ConstraintError) && db.select("acc").length === 3; });
check("where: eq, ne, lt, lte, gt, gte, in, диапазон из двух операторов, равенство null (ne и сравнения не берут null), несколько условий через И", () => { const [db] = fresh(); seed(db); const ids = (w) => db.select("acc", { where: w }).map((r) => r.id).join(","); return ids({ balance: 30 }) === "3" && ids({ balance: { ne: 30 } }) === "1,2,4,5,6" && ids({ balance: { lt: 30 } }) === "1,2" && ids({ balance: { lte: 30 } }) === "1,2,3" && ids({ balance: { gt: 40 } }) === "5,6" && ids({ balance: { gte: 40, lt: 60 } }) === "4,5" && ids({ id: { in: [6, 2, 99] } }) === "2,6" && ids({ note: null }) === "1,3,5" && ids({ note: { ne: "n2" } }) === "4,6" && ids({ note: null, balance: { gt: 10 } }) === "3,5" && ids({}) === "1,2,3,4,5,6"; });
check("диапазонные условия не берут null (в JavaScript null < 3 истинно): столбец int с null, lt / lte / gt / gte", () => { const [db] = open(); db.createTable("t", [{ name: "id", type: "int", primaryKey: true }, { name: "qty", type: "int" }]); db.transaction((tx) => { tx.insert("t", { id: 1, qty: null }); tx.insert("t", { id: 2, qty: 1 }); tx.insert("t", { id: 3, qty: 5 }); tx.insert("t", { id: 4, qty: 0 }); }); const ids = (w) => db.select("t", { where: w }).map((r) => r.id).join(","); const plain = [ids({ qty: { lt: 3 } }), ids({ qty: { gte: 0 } }), ids({ qty: { lte: 5 } }), ids({ qty: { gt: -1 } }), ids({ qty: null })]; db.createIndex("t", "qty"); const indexed = [ids({ qty: { lt: 3 } }), ids({ qty: { gte: 0 } }), ids({ qty: { lte: 5 } }), ids({ qty: { gt: -1 } }), ids({ qty: null })]; const want = ["2,4", "2,3,4", "2,3,4", "2,3,4", "1"]; return J(plain) === J(want) && J(indexed) === J(want); });
check("where: неизвестный столбец или оператор → SchemaError; неизвестная таблица → SchemaError", () => { const [db] = fresh(); return throwsAs(() => db.select("acc", { where: { ghost: 1 } }), SchemaError) && throwsAs(() => db.select("acc", { where: { id: { like: "a" } } }), SchemaError) && throwsAs(() => db.select("nope"), SchemaError); });
check("select: orderBy (по возрастанию по умолчанию, desc, несколько ключей, null первыми, ничьи по первичному ключу), limit, offset, columns", () => { const [db] = fresh(); db.transaction((tx) => { [[1, "x", 5, "b"], [2, "y", 5, null], [3, "z", 9, "a"], [4, "w", 1, "b"]].forEach(([id, owner, balance, note]) => tx.insert("acc", { id, owner, balance, note })); }); const q = (o) => db.select("acc", o).map((r) => r.id).join(","); return q({ orderBy: "balance" }) === "4,1,2,3" && q({ orderBy: { balance: "desc" } }) === "3,1,2,4" && q({ orderBy: ["note", { balance: "desc" }] }) === "2,3,1,4" && q({ orderBy: { note: "desc" } }) === "1,4,3,2" && q({ orderBy: "balance", limit: 2, offset: 1 }) === "1,2" && J(db.select("acc", { columns: ["id", "owner"], limit: 1 })) === '[{"id":1,"owner":"x"}]'; });
check("update: возвращает число изменённых строк, меняет первичный ключ; delete: возвращает число удалённых, {} удаляет всё", () => { const [db] = fresh(); seed(db); const r = db.transaction((tx) => [tx.update("acc", { balance: { gte: 40 } }, { note: "big" }), tx.update("acc", { id: 1 }, { id: 100 }), tx.delete("acc", { balance: { lt: 30 } })]); const left = db.select("acc").map((x) => \`\${x.id}:\${x.note}\`).join(","); const all = db.transaction((tx) => tx.delete("acc", {})); return J(r) === "[3,1,2]" && left === "3:null,4:big,5:big,6:big,100:null".replace("100:null,", "").replace(",100:null", "") + "" || left === "3:null,4:big,5:big,6:big" ? all === 4 && db.select("acc").length === 0 : false; });
check("атомарность оператора: UPDATE нескольких строк, упавший на третьей из-за UNIQUE, не меняет ни одной; транзакция остаётся рабочей", () => { const [db] = fresh(); seed(db); const before = J(db.dump()); const tx = db.begin(); tx.insert("acc", { id: 50, owner: "keep", balance: 0 }); const failed = throwsAs(() => tx.update("acc", { balance: { lte: 40 } }, { owner: "dup" }), ConstraintError); const inside = tx.select("acc", { where: { id: { in: [50, 1, 2, 3, 4] } } }).map((r) => \`\${r.id}:\${r.owner}\`).join(","); tx.commit(); return failed && inside === "1:o1,2:o2,3:o3,4:o4,50:keep" && J(db.dump()) !== before && db.select("acc", { where: { id: 50 } }).length === 1 && db.select("acc", { where: { owner: "dup" } }).length === 0; });

// ── Транзакции ──
check("commit делает изменения видимыми, rollback отменяет вставки, обновления и удаления (в том числе изменения первичного ключа)", () => { const [db] = fresh(); seed(db); const before = J(db.dump()); const tx = db.begin(); tx.insert("acc", { id: 77, owner: "tmp", balance: 1 }); tx.update("acc", { id: 1 }, { id: 91, balance: 0 }); tx.delete("acc", { id: 2 }); tx.rollback(); const same = J(db.dump()) === before; const tx2 = db.begin(); tx2.delete("acc", { id: 3 }); tx2.commit(); return same && db.select("acc", { where: { id: 3 } }).length === 0; });
check("внутри транзакции видны собственные изменения; чтение через db.select при открытой транзакции → TxError", () => { const [db] = fresh(); const tx = db.begin(); tx.insert("acc", { id: 1, owner: "a", balance: 5 }); const mine = tx.select("acc").length === 1, blocked = throwsAs(() => db.select("acc"), TxError); tx.commit(); return mine && blocked && db.select("acc").length === 1; });
check("состояния транзакции: begin при открытой, любая операция и повторный commit/rollback после завершения, DDL внутри транзакции → TxError", () => { const [db] = fresh(); const tx = db.begin(); const a = throwsAs(() => db.begin(), TxError), b = throwsAs(() => db.createTable("z", [{ name: "id", type: "int", primaryKey: true }]), TxError); tx.commit(); return a && b && throwsAs(() => tx.insert("acc", { id: 1, balance: 1 }), TxError) && throwsAs(() => tx.commit(), TxError) && throwsAs(() => tx.rollback(), TxError) && db.begin() !== null; });
check("transaction(fn): возвращает результат функции, при исключении откатывает и пробрасывает то же исключение", () => { const [db] = fresh(); const v = db.transaction((tx) => { tx.insert("acc", { id: 1, balance: 1 }); return "готово"; }); const boom = new Error("сбой"); let caught; try { db.transaction((tx) => { tx.insert("acc", { id: 2, balance: 2 }); throw boom; }); } catch (e) { caught = e; } return v === "готово" && caught === boom && db.select("acc").length === 1 && db.begin().commit() === undefined; });

check("вложенный db.transaction внутри транзакции → TxError, внешняя транзакция откатывается", () => { const [db] = fresh(); const err = (() => { try { db.transaction((tx) => { tx.insert("acc", { id: 1, balance: 1 }); db.transaction(() => {}); }); return null; } catch (e) { return e; } })(); return err instanceof TxError && db.select("acc").length === 0 && db.begin() !== null; });
check("изменение первичного ключа на уже занятый → ConstraintError, оператор не оставляет следов", () => { const [db] = fresh(); seed(db, 3); const tx = db.begin(); const failed = throwsAs(() => tx.update("acc", { id: { lte: 2 } }, { id: 3 }), ConstraintError); tx.rollback(); return failed && db.select("acc").map((r) => r.id).join() === "1,2,3"; });
// ── Индексы и планировщик ──
check("explain: равенство по первичному ключу и по UNIQUE — index-eq с 1 строкой; по столбцу без индекса — full-scan с числом строк таблицы; диапазон по ключу — index-range", () => { const [db] = fresh(); seed(db); return J(db.explain("acc", { id: 3 })) === '{"access":"index-eq","index":"id","rowsExamined":1}' && J(db.explain("acc", { owner: "o4" })) === '{"access":"index-eq","index":"owner","rowsExamined":1}' && J(db.explain("acc", { balance: 30 })) === '{"access":"full-scan","index":null,"rowsExamined":6}' && J(db.explain("acc", { id: { gte: 2, lt: 5 } })) === '{"access":"index-range","index":"id","rowsExamined":3}' && J(db.explain("acc", { id: { in: [1, 2, 99] } })) === '{"access":"index-eq","index":"id","rowsExamined":2}' && db.explain("acc", {}).access === "full-scan"; });
check("createIndex: после создания индекс используется (rowsExamined = числу совпадений); из нескольких индексируемых условий выбирается самое узкое; != и пустое условие — полный перебор", () => { const [db] = fresh(); seed(db); db.transaction((tx) => tx.insert("acc", { id: 7, owner: "o7", balance: 30 })); db.createIndex("acc", "balance"); const a = db.explain("acc", { balance: 30 }), b = db.explain("acc", { balance: 30, id: 3 }), c = db.explain("acc", { balance: { gte: 20, lte: 40 } }), d = db.explain("acc", { balance: { ne: 30 } }); return a.access === "index-eq" && a.index === "balance" && a.rowsExamined === 2 && b.index === "id" && b.rowsExamined === 1 && c.access === "index-range" && c.rowsExamined === 4 && d.access === "full-scan"; });
check("createIndex: неизвестная таблица или столбец → SchemaError; повторный вызов безвреден", () => { const [db] = fresh(); db.createIndex("acc", "balance"); db.createIndex("acc", "balance"); return throwsAs(() => db.createIndex("nope", "x"), SchemaError) && throwsAs(() => db.createIndex("acc", "ghost"), SchemaError); });
const refRows = (rows, where, orderBy) => { const ok = (r) => Object.entries(where).every(([c, s]) => { const x = r[c]; const conds = s !== null && typeof s === "object" && !Array.isArray(s) ? Object.entries(s) : [["eq", s]]; return conds.every(([op, v]) => op === "eq" ? (v === null ? x === null : x === v) : op === "ne" ? x !== null && x !== v : op === "in" ? v.includes(x) : x !== null && (op === "lt" ? x < v : op === "lte" ? x <= v : op === "gt" ? x > v : x >= v)); }); const sorted = rows.filter(ok).sort((a, b) => a.id - b.id); return orderBy ? [...sorted].sort((a, b) => (a[orderBy] ?? -Infinity) - (b[orderBy] ?? -Infinity) || a.id - b.id) : sorted; };
check("select совпадает с независимым эталоном на 150 случайных запросах при 0, 1 и 2 индексах (результат не зависит от индексов)", () => { const r = seeded(11), rows = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, owner: "u" + i, balance: Math.floor(r() * 40), note: r() < 0.3 ? null : "n" + Math.floor(r() * 5) })); const dbs = [0, 1, 2].map((k) => { const [db] = fresh(); db.transaction((tx) => rows.forEach((x) => tx.insert("acc", x))); if (k >= 1) db.createIndex("acc", "balance"); if (k >= 2) db.createIndex("acc", "note"); return db; }); for (let t = 0; t < 150; t++) { const w = {}, kind = Math.floor(r() * 5); if (kind === 0) w.balance = Math.floor(r() * 40); else if (kind === 1) w.balance = { gte: Math.floor(r() * 20), lt: 20 + Math.floor(r() * 20) }; else if (kind === 2) w.note = r() < 0.3 ? null : "n" + Math.floor(r() * 5); else if (kind === 3) { w.balance = { in: [1, 5, 9, 39] }; w.note = { ne: "n1" }; } else w.id = { gt: Math.floor(r() * 300) }; const ob = r() < 0.4 ? "balance" : undefined, expect = J(refRows(rows, w, ob).map((x) => x.id)); for (const db of dbs) if (J(db.select("acc", { where: w, ...(ob ? { orderBy: ob } : {}) }).map((x) => x.id)) !== expect) return false; } return true; });
check("индексы корректны после 400 случайных изменений и откатов: запросы по индексированным столбцам совпадают с полным перебором", () => { const r = seeded(5), mk = (indexed) => { const [db] = fresh(); if (indexed) { db.createIndex("acc", "balance"); db.createIndex("acc", "note"); } return db; }, a = mk(true), b = mk(false); for (let t = 0; t < 400; t++) { const id = 1 + Math.floor(r() * 40), kind = Math.floor(r() * 4), val = Math.floor(r() * 10), rollback = r() < 0.3; for (const db of [a, b]) { const tx = db.begin(); try { if (kind === 0) tx.insert("acc", { id, owner: "o" + id, balance: val, note: val % 2 ? "x" : null }); else if (kind === 1) tx.update("acc", { id }, { balance: val }); else if (kind === 2) tx.delete("acc", { id }); else tx.update("acc", { balance: { lt: val } }, { note: "y" }); } catch (e) { if (!(e instanceof ConstraintError)) throw e; } rollback ? tx.rollback() : tx.commit(); } } for (let v = 0; v < 10; v++) for (const w of [{ balance: v }, { balance: { gte: v, lte: v + 2 } }, { note: "x" }, { note: null }]) if (J(a.select("acc", { where: w })) !== J(b.select("acc", { where: w }))) return false; return J(a.dump()) === J(b.dump()); });
check("производительность: 5000 строк в одной транзакции и 2000 запросов по индексу выполняются быстрее 2 секунд", () => { const [db] = fresh(); const t = performance.now(); db.transaction((tx) => { for (let i = 1; i <= 5000; i++) tx.insert("acc", { id: i, owner: "o" + i, balance: i % 500 }); }); db.createIndex("acc", "balance"); let found = 0; for (let i = 0; i < 2000; i++) found += db.select("acc", { where: { balance: i % 500 } }).length; return found === 2000 * 10 && performance.now() - t < 2000; });

// ── Соединения и агрегаты ──
const A = [{ id: 1, k: "x" }, { id: 2, k: "y" }, { id: 3, k: null }, { id: 4, k: "x" }, { id: 5, k: "z" }], B = [{ k: "x", v: 10 }, { k: "x", v: 11 }, { k: "y", v: 20 }, { k: null, v: 99 }];
check("nestedLoopJoin и hashJoin: внутреннее соединение даёт те же строки в том же порядке (по левой, затем по правой таблице); null не соединяется", () => { const a = nestedLoopJoin(A, B, "k", "k"), b = hashJoin(A, B, "k", "k"); return J(a.rows) === J(b.rows) && a.rows.length === 5 && J(a.rows.map((r) => [r.id, r.v])) === "[[1,10],[1,11],[2,20],[4,10],[4,11]]"; });
check("левое соединение: несовпавшие левые строки получают null в столбцах rightColumns; при коллизии имён правая колонка перезаписывает левую", () => { const a = nestedLoopJoin(A, B, "k", "k", { kind: "left", rightColumns: ["v"] }), b = hashJoin(A, B, "k", "k", { kind: "left", rightColumns: ["v"] }); return J(a.rows) === J(b.rows) && a.rows.length === 7 && a.rows.filter((r) => r.v === null).map((r) => r.id).join() === "3,5" && hashJoin([{ id: 1, x: "L" }], [{ id: 1, x: "R" }], "id", "id").rows[0].x === "R"; });
check("счётчик работы: вложенные циклы — |левая|·|правая| пар, хеш-соединение — |левая| + |правая| строк (на 1000×1000 — 1 000 000 против 2000)", () => { const big = (n, m) => Array.from({ length: n }, (_, i) => ({ k: i % m, i })); const a = big(1000, 50), b = big(1000, 50), n = nestedLoopJoin(a, b, "k", "k"), h = hashJoin(a, b, "k", "k"); return n.work === 1_000_000 && h.work === 2000 && n.rows.length === h.rows.length && J(n.rows) === J(h.rows); });
check("оба соединения совпадают на 100 случайных отношениях (внутреннее и левое, с null-ключами и повторами)", () => { const r = seeded(17); for (let t = 0; t < 100; t++) { const mk = (n, tag) => Array.from({ length: Math.floor(r() * n) }, (_, i) => ({ [tag]: i, k: r() < 0.2 ? null : Math.floor(r() * 6) })); const a = mk(15, "a"), b = mk(15, "b"); for (const kind of ["inner", "left"]) if (J(nestedLoopJoin(a, b, "k", "k", { kind, rightColumns: ["b"] }).rows) !== J(hashJoin(a, b, "k", "k", { kind, rightColumns: ["b"] }).rows)) return false; } return true; });
check("aggregate: count, sum, avg, min, max по группам; null игнорируется (кроме count(*)); группы по возрастанию ключа, null первыми", () => { const rows = [{ c: "b", v: 1 }, { c: "a", v: 3 }, { c: null, v: 7 }, { c: "a", v: null }, { c: "a", v: 5 }, { c: "b", v: 2 }]; const res = aggregate(rows, { by: ["c"], compute: { n: ["count"], nv: ["count", "v"], s: ["sum", "v"], a: ["avg", "v"], lo: ["min", "v"], hi: ["max", "v"] } }); return J(res) === J([{ c: null, n: 1, nv: 1, s: 7, a: 7, lo: 7, hi: 7 }, { c: "a", n: 3, nv: 2, s: 8, a: 4, lo: 3, hi: 5 }, { c: "b", n: 2, nv: 2, s: 3, a: 1.5, lo: 1, hi: 2 }]); });
check("aggregate: без группировки на пустом входе — одна строка (count = 0, остальные null); с группировкой на пустом входе — []; несколько ключей группировки", () => J(aggregate([], { compute: { n: ["count"], s: ["sum", "v"], a: ["avg", "v"] } })) === '[{"n":0,"s":null,"a":null}]' && J(aggregate([], { by: ["c"], compute: { n: ["count"] } })) === "[]" && J(aggregate([{ a: 1, b: "x", v: 1 }, { a: 1, b: "y", v: 2 }, { a: 1, b: "x", v: 3 }], { by: ["a", "b"], compute: { s: ["sum", "v"] } })) === '[{"a":1,"b":"x","s":4},{"a":1,"b":"y","s":2}]');
check("aggregate совпадает с независимым расчётом на 60 случайных наборах", () => { const r = seeded(23); for (let t = 0; t < 60; t++) { const rows = Array.from({ length: Math.floor(r() * 30) }, () => ({ g: Math.floor(r() * 4), v: r() < 0.2 ? null : Math.floor(r() * 100) })); const got = aggregate(rows, { by: ["g"], compute: { n: ["count"], s: ["sum", "v"], hi: ["max", "v"] } }); for (const row of got) { const m = rows.filter((x) => x.g === row.g), vs = m.map((x) => x.v).filter((v) => v !== null); if (row.n !== m.length || row.s !== (vs.length ? vs.reduce((p, q) => p + q, 0) : null) || row.hi !== (vs.length ? Math.max(...vs) : null)) return false; } if (new Set(rows.map((x) => x.g)).size !== got.length || got.some((x, i) => i && got[i - 1].g > x.g)) return false; } return true; });

// ── Журнал и восстановление ──
const bank = () => {
  const [db, log] = open(); const snaps = [J(db.dump())];
  const step = (fn) => { fn(); snaps.push(J(db.dump())); };
  step(() => db.createTable("accounts", [{ name: "id", type: "int", primaryKey: true }, { name: "balance", type: "int", notNull: true }]));
  step(() => db.createTable("audit", [{ name: "id", type: "int", primaryKey: true }, { name: "src", type: "int" }, { name: "dst", type: "int" }, { name: "amount", type: "int" }]));
  step(() => db.transaction((tx) => { for (let i = 1; i <= 5; i++) tx.insert("accounts", { id: i, balance: 100 }); }));
  const r = seeded(77);
  for (let k = 1; k <= 20; k++) { const src = 1 + Math.floor(r() * 5), dst = 1 + ((src + Math.floor(r() * 4)) % 5), amount = 1 + Math.floor(r() * 30); step(() => db.transaction((tx) => { tx.update("accounts", { id: src }, { balance: tx.select("accounts", { where: { id: src } })[0].balance - amount }); tx.update("accounts", { id: dst }, { balance: tx.select("accounts", { where: { id: dst } })[0].balance + amount }); tx.insert("audit", { id: k, src, dst, amount }); })); }
  return { db, log, snaps };
};
let cached; const getW = () => (cached ??= bank());
check("журнал: записи — строки; открытие пустого журнала даёт пустую базу и ничего не записывает; повторное открытие даёт то же состояние (таблицы, строки, ограничения)", () => { const [db0, log0] = open(); const empty = J(db0.dump()) === "{}" && log0.records.length === 0; const [db2, log2] = open(getW().log.records); return empty && getW().log.records.every((x) => typeof x === "string") && J(db2.dump()) === J(getW().db.dump()) && log2.records.length === getW().log.records.length && J(open(getW().log.records)[0].dump()) === J(db2.dump()); });
check("сбой в любой точке: для каждого префикса журнала (от 0 до всех записей) восстановленное состояние — одно из 24 «границ» (до и после каждой операции целиком), монотонно; финальное равно последнему", () => { const order = new Map(getW().snaps.map((s, i) => [s, i])); let last = 0; for (let k = 0; k <= getW().log.records.length; k++) { const s = J(open(getW().log.records.slice(0, k))[0].dump()); if (!order.has(s)) return false; const i = order.get(s); if (i < last) return false; last = i; } return last === getW().snaps.length - 1; });
check("инвариант: в любом восстановленном состоянии сумма остатков 500 (если счета есть), число записей аудита равно числу применённых переводов", () => { for (let k = 0; k <= getW().log.records.length; k++) { const d = open(getW().log.records.slice(0, k))[0].dump(); if (d.accounts && d.accounts.length === 5) { const sum = d.accounts.reduce((s, r) => s + r.balance, 0); if (sum !== 500) return false; const moved = d.audit.length; const base = d.accounts.map((r) => r.balance).join(); if (moved === 0 && base !== "100,100,100,100,100") return false; } } return true; });
check("оборванная запись в хвосте (любая из записей обрезана наполовину или на один символ): восстановление равно состоянию без неё", () => { for (let i = 0; i < getW().log.records.length; i++) { const base = J(open(getW().log.records.slice(0, i))[0].dump()); for (const cut of [Math.floor(getW().log.records[i].length / 2), getW().log.records[i].length - 1]) { const torn = [...getW().log.records.slice(0, i), getW().log.records[i].slice(0, cut)]; if (J(open(torn)[0].dump()) !== base) return false; } } return true; });
check("повреждённая запись в середине (заменён один символ): применяется только то, что идёт до неё; всё после отбрасывается", () => { const recs = getW().log.records; for (const i of [3, 10, recs.length - 1]) { const r = recs[i], pos = Math.floor(r.length / 2), flipped = r.slice(0, pos) + (r[pos] === "x" ? "y" : "x") + r.slice(pos + 1); if (flipped === r) continue; const got = J(open([...recs.slice(0, i), flipped, ...recs.slice(i + 1)])[0].dump()); if (got !== J(open(recs.slice(0, i))[0].dump())) return false; } return true; });
check("после восстановления с оборванным хвостом новые транзакции долговечны: фиксация, повторное открытие — перевод на месте, хвост не мешает", () => { const recs = getW().log.records, torn = [...recs.slice(0, 8), recs[8].slice(0, 20)]; const [db, log] = open(torn); db.transaction((tx) => { tx.update("accounts", { id: 1 }, { balance: 1 }); tx.update("accounts", { id: 2 }, { balance: 199 }); }); const [db2] = open(log.records); return db2.select("accounts", { where: { id: 1 } })[0].balance === 1 && db2.select("accounts", { where: { id: 2 } })[0].balance === 199 && J(db2.dump()) === J(db.dump()); });
check("сбой записи в журнал во время фиксации (и через transaction, и через явный commit): исключение передаётся вызывающему, состояние в памяти откатывается, новая транзакция открывается, после повторного открытия — состояние до транзакции", () => { for (const explicit of [false, true]) { const [db, log] = fresh(); seed(db); const before = J(db.dump()), n = log.records.length; log.appends = 0; log.failAt = 1; let threw = false; try { if (explicit) { const tx = db.begin(); tx.update("acc", { id: 1 }, { balance: 1 }); tx.insert("acc", { id: 99, owner: "z", balance: 5 }); tx.commit(); } else db.transaction((tx) => { tx.update("acc", { id: 1 }, { balance: 1 }); tx.insert("acc", { id: 99, owner: "z", balance: 5 }); }); } catch { threw = true; } log.failAt = Infinity; if (!threw || J(db.dump()) !== before || J(open(log.records)[0].dump()) !== before || log.records.length < n) return false; const tx2 = db.begin(); tx2.insert("acc", { id: 100, owner: "ok", balance: 1 }); tx2.commit(); if (J(open(log.records)[0].dump()) !== J(db.dump())) return false; } return true; });
check("хранилище без метода truncate: журнал с оборванным хвостом открывается (хвост игнорируется), чтение работает", () => { const recs = getW().log.records, torn = [...recs.slice(0, 6), recs[6].slice(0, 10)]; const plain = { records: [...torn], append(r) { this.records.push(r); }, readAll() { return [...this.records]; } }; const db = Database.open(plain); return J(db.dump()) === J(open(recs.slice(0, 6))[0].dump()); });
check("откат и неудачные операторы ничего не оставляют в журнале: состояние после повторного открытия совпадает с последним подтверждённым", () => { const [db, log] = fresh(); seed(db); const base = J(db.dump()); const tx = db.begin(); tx.insert("acc", { id: 50, owner: "q", balance: 1 }); tx.rollback(); throwsAs(() => db.transaction((t) => t.insert("acc", { id: 1, balance: 1 })), ConstraintError); const tx2 = db.begin(); throwsAs(() => tx2.insert("acc", { id: 2, balance: 1 }), ConstraintError); tx2.rollback(); return J(db.dump()) === base && J(open(log.records)[0].dump()) === base; });
check("индексы и ограничения восстанавливаются: после открытия explain использует индекс, UNIQUE и PRIMARY KEY работают, TypeError/ConstraintError не теряются", () => { const [db, log] = fresh(); seed(db); db.createIndex("acc", "balance"); const [r] = open(log.records); return r.explain("acc", { balance: 30 }).access === "index-eq" && r.explain("acc", { owner: "o2" }).rowsExamined === 1 && throwsAs(() => r.transaction((tx) => tx.insert("acc", { id: 9, owner: "o2", balance: 1 })), ConstraintError) && throwsAs(() => r.transaction((tx) => tx.insert("acc", { id: 1, balance: 1 })), ConstraintError) && throwsAs(() => r.transaction((tx) => tx.insert("acc", { id: 10, balance: "много" })), ConstraintError); });
check("DDL тоже в журнале: таблицы и индексы, созданные в разном порядке, восстанавливаются вместе с данными; пустая транзакция не пишет записей", () => { const [db, log] = open(); db.createTable("a", [{ name: "id", type: "int", primaryKey: true }, { name: "v", type: "int" }]); db.transaction((tx) => tx.insert("a", { id: 1, v: 5 })); db.createIndex("a", "v"); db.createTable("b", [{ name: "id", type: "int", primaryKey: true }]); const n = log.records.length; db.transaction(() => {}); const empty = log.records.length === n; const [r] = open(log.records); return empty && J(r.dump()) === J(db.dump()) && r.explain("a", { v: 5 }).access === "index-eq" && Object.keys(r.dump()).join() === "a,b"; });

console.log(\`\\nПройдено проверок: \${passed} из \${total}\`);
process.exitCode = passed === total ? 0 : 1;`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 42 из 42`, { filename: "результат node check.mjs solution (Node.js 22.22.0)" }),
    code("text", `Пройдено проверок: 1 из 42`, { filename: "результат node check.mjs starter (заготовка)" }),
    h("Проверка самой проверки: «плохие» варианты"),
    code("text", `b01-no-type-check: Пройдено проверок: 40 из 42
b02-unique-ignores-update: Пройдено проверок: 39 из 42
b03-null-equals-null-in-ne: Пройдено проверок: 40 из 42
b04-range-includes-null: Пройдено проверок: 41 из 42
b05-order-by-ignores-desc: Пройдено проверок: 41 из 42
b06-statement-not-atomic: Пройдено проверок: 41 из 42
b07-rollback-keeps-updates: Пройдено проверок: 37 из 42
b08-dirty-read-allowed: Пройдено проверок: 41 из 42
b09-nested-tx-allowed: Пройдено проверок: 40 из 42
b10-index-not-updated-on-update: Пройдено проверок: 40 из 42
b11-planner-always-full-scan: Пройдено проверок: 38 из 42
b12-index-range-exclusive-bounds-wrong: Пройдено проверок: 22 из 42
b13-hash-join-null-keys-match: Пройдено проверок: 39 из 42
b14-hash-join-work-quadratic: Пройдено проверок: 41 из 42
b15-left-join-no-null-fill: Пройдено проверок: 40 из 42
b16-aggregate-null-in-sum: Пройдено проверок: 40 из 42
b17-aggregate-empty-no-row: Пройдено проверок: 41 из 42
b18-no-crc-check: Пройдено проверок: 41 из 42
b19-replay-skips-invalid-continues: Пройдено проверок: 41 из 42
b20-no-truncate-after-torn-tail: Пройдено проверок: 41 из 42
b21-commit-failure-leaves-memory: Пройдено проверок: 41 из 42
b22-ddl-not-logged: Пройдено проверок: 40 из 42`, { filename: "результат check.mjs для вариантов с ошибками (из 42)" }),
    warn("Журнал, который «обычно целый», — это журнал, который однажды окажется оборванным. Восстановление должно быть спроектировано **от повреждения**: сначала решите, как вы обнаружите оборванную запись (контрольная сумма), потом — что будет с хвостом (обрезка), и только потом пишите «нормальный путь»."),
    tip("Если восстановление работает на всех префиксах, но проваливается на оборванных записях, добавьте в свою тестовую петлю обрезание **каждой** записи на каждую позицию (не только на половину). Контрольная сумма ловит все такие обрезы; JSON, который «ещё разбирается», — нет."),
  ],
};
