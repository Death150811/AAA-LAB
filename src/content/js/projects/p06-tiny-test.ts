import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p06TinyTest: Project = {
  id: "js.p06-tiny-test",
  domain: "js",
  order: 6,
  title: "Мини-фреймворк тестирования",
  subtitle: "isEqual, expect, раннер с хуками и тайм-аутами, репортёр: 46 проверок, включая память, производительность и ложные «зелёные» тесты",
  level: "engineering",
  estimatedHours: 14,
  buildsOn: ["js.p05-tasks-app"],
  topics: [
    "js.errors-debugging",
    "js.memory-gc",
    "js.performance",
    "js.testing-architecture",
  ],
  objective:
    "Написать модуль `tiny-test.mjs` — маленький фреймворк тестирования, на котором держатся все остальные проекты: **глубокое сравнение** (`isEqual`), **проверки** (`expect` с `toBe`, `toEqual`, `toThrow`, `resolves`, `rejects`, `.not`), **раннер** (`describe`, `it`, хуки, тайм-ауты, пропуск и фокус) и **репортёр**. Главная задача проекта — не «написать ещё один Jest», а увидеть, где инструменты проверки сами врут: ложные «зелёные» тесты, утечки, потерянные ошибки, квадратичные алгоритмы.",
  scenario: [
    p("Команда «Лаборатории» дописала свой набор тестов, и он стал зелёным. Через неделю в продакшене нашлась ошибка, которую набор «проверял»: тест на отклонение промиса проходил, хотя промис выполнялся; `throw null` в тесте считался успехом; сравнение объектов через `JSON.stringify` не отличало `undefined`-поле от отсутствующего и падало на циклической структуре; а раннер, не снимавший тайм-ауты, держал процесс живым ещё минуту после последнего теста."),
    p("Ваша задача — собрать инструмент, которому можно доверять, и доказать это измерениями. Проверка `check.mjs` (46 проверок) запускается в Node.js без зависимостей и проверяет не только «правильные ответы», но и **свойства**: сообщения об ошибках, порядок хуков, отсутствие активных таймеров после прогона, быстродействие на больших входах и то, что сборщик мусора освобождает сравнённые структуры."),
    code("js", `// tiny-test.mjs — крошечный фреймворк тестирования. Заготовка: реализуйте всё, что помечено TODO.
// Контракт: ExpectationError, TimeoutError, format, isEqual, expect, createSuite, formatReport.

export class ExpectationError extends Error {
  // TODO: name = "ExpectationError", поля из второго аргумента (matcher, actual, expected)
}

export class TimeoutError extends Error {
  // TODO: name = "TimeoutError"
}

// Значение → строка для сообщений об ошибках. Не должно бросать на циклах, BigInt, Symbol.
export function format(value) {
  throw new Error("format: не реализовано");
}

// Глубокое сравнение: Object.is для примитивов, массивы, объекты, Date, RegExp, Map, Set, Error, циклы.
export function isEqual(a, b) {
  throw new Error("isEqual: не реализовано");
}

// expect(actual): toBe, toEqual, toBeCloseTo, toContain, toThrow, .not, .resolves, .rejects
export function expect(actual) {
  throw new Error("expect: не реализовано");
}

// createSuite(): { describe, it (+skip, +only), beforeAll, afterAll, beforeEach, afterEach, run({ timeoutMs, now }) }
export function createSuite() {
  throw new Error("createSuite: не реализовано");
}

// Отчёт → текст: «✓ имя», «✗ имя» + сообщение с отступом, «- имя (пропущен)», итоговая строка.
export function formatReport(report) {
  throw new Error("formatReport: не реализовано");
}`, { filename: "starter/tiny-test.mjs" }),
    table(
      ["Экспорт", "Что делает", "Ключевые детали"],
      [
        ["`isEqual(a, b)`", "Глубокое сравнение", "`Object.is` для примитивов; массивы, объекты, `Date`, `RegExp`, `Map`, `Set`, `Error`; прототипы; циклы"],
        ["`format(value)`", "Значение → строка для сообщений", "Не бросает на циклах, `BigInt`, `Symbol`; строки в кавычках; `-0`; `Map(1) {1 => {a: 2}}`"],
        ["`expect(actual)`", "Проверки", "`toBe`, `toEqual`, `toBeCloseTo`, `toContain`, `toThrow`; `.not`, `.resolves`, `.rejects`"],
        ["`ExpectationError`", "Ошибка проверки", "`name`, поля `matcher`, `actual`, `expected`"],
        ["`createSuite()`", "Изолированный набор тестов", "`describe`, `it` (+ `skip`, `only`), четыре хука, `run({ timeoutMs, now })`"],
        ["`TimeoutError`", "Ошибка тайм-аута", "Сообщение «Тайм-аут N мс: имя»"],
        ["`formatReport(report)`", "Отчёт → текст", "Чистая функция: `✓`, `✗`, `-`, итоговая строка"],
      ],
      "Контракт модуля",
    ),
  ],
  requirements: [
    "`tiny-test.mjs` экспортирует `ExpectationError`, `TimeoutError`, `format`, `isEqual`, `expect`, `createSuite`, `formatReport`.",
    "`isEqual`: примитивы — как `Object.is` (`NaN` равно `NaN`, `0` и `-0` различаются, `1` и `\"1\"` различаются); массивы — порядок и длина важны; объекты — порядок ключей не важен, `{ a: undefined }` не равно `{}`, символьные ключи учитываются; прототипы должны совпадать (экземпляр класса не равен простому объекту, `Object.create(null)` не равен `{}`).",
    "`isEqual` для `Date` (по времени, недействительные даты равны друг другу), `RegExp` (`source` и `flags`), `Error` (класс, `name`, `message` и собственные свойства), `Map` (порядок вставки не важен, значения глубоко, ключи по `SameValueZero`), `Set` (порядок не важен, объекты сравниваются глубоко и сопоставляются по одному: два равных объекта не «закрывают» один).",
    "`isEqual` корректно работает с циклами: одинаковые циклические структуры равны, разные — нет, без переполнения стека; результат сравнения **не запоминается между вызовами** (после изменения объекта ответ обновляется) и не удерживает объекты в памяти.",
    "`isEqual` быстрый: `Set` из 15 000 чисел, массив из 300 000 элементов и объект из 50 000 ключей сравниваются вместе быстрее 500 мс.",
    "`format`: строки в кавычках, `10n`, `-0`, `Symbol(q)`, `[Function имя]`, классы (`P {x: 1}`), `Map(1) {1 => {a: 2}}`, `Set(1) {1}`; циклы дают `[Circular]`, а общий (не циклический) объект выводится дважды; сообщения об ошибках короче 200 символов даже для массива из 100 000 элементов.",
    "`expect(...).toBe`: `Object.is`, сообщение `Ожидалось 3, получено 2`; `toEqual`: `isEqual`, сообщение `Ожидалось (toEqual) {a: 1}, получено {a: 2}`; `.not` инвертирует проверку с сообщением `Не ожидалось …`; `.not.not` недоступен.",
    "`toThrow([ожидаемое])`: без аргумента, с подстрокой, `RegExp`, классом ошибки или экземпляром `Error` (сравнивается `message`); принимает **функцию**, иначе — `ExpectationError`; «ложные» исключения (`undefined`, `null`, `0`, `\"\"`, `false`, `NaN`) — тоже исключения.",
    "`toBeCloseTo(expected, digits = 2)`: допуск `10^-digits / 2`; бесконечности равны сами себе; не числа — `ExpectationError`. `toContain`: массив (по `SameValueZero`) и строка; объекты — по тождеству; прочие типы — `ExpectationError`.",
    "`ExpectationError` наследует `Error`, имеет `name = \"ExpectationError\"` и поля `matcher`, `actual`, `expected`.",
    "`resolves` проверяет значение выполненного промиса, `rejects` — причину отклонения; **выполненный промис не проходит `rejects`** (ошибка «Ожидалось отклонение…»), отклонённый не проходит `resolves` («…отклонён»), не-промис — `ExpectationError`; обе формы поддерживают `.not`.",
    "`createSuite()` возвращает изолированный набор: `describe`, `it`, `it.skip`, `it.only`, `beforeAll`, `afterAll`, `beforeEach`, `afterEach`, `run`. Тесты идут в порядке объявления, имена вложенных тестов — `\"A › B › тест\"`; `run` можно вызывать повторно, наборы друг от друга не зависят.",
    "Хуки: `beforeAll`/`afterAll` — один раз на блок (и только если в блоке есть запускаемые тесты); `beforeEach` — от внешнего блока к внутреннему; `afterEach` — от внутреннего к внешнему и **всегда** после теста, даже упавшего.",
    "Сбои изолированы: упавший тест не останавливает остальные; ошибка `beforeEach` — тест упал, тело не вызывалось, `afterEach` выполнился; ошибка `beforeAll` — все тесты блока и вложенных упали этой ошибкой, вложенные хуки не вызывались, но `afterAll` выполняется; ошибка `afterEach` делает тест упавшим (первая ошибка теста сохраняется); ошибка `afterAll` добавляет запись `\"блок › afterAll\"` со статусом `failed`.",
    "Асинхронность: результат теста и хуков ожидается; отказ промиса — падение теста. Тайм-аут `timeoutMs` (по умолчанию 1000) действует на каждый тест и хук и даёт `TimeoutError` с сообщением `Тайм-аут 50 мс: S › завис`; остальные тесты продолжаются; неверный `timeoutMs` (`0`, `-1`, `NaN`, `Infinity`, строка) — `RangeError`.",
    "Не-`Error` значения, брошенные в тесте (`\"x\"`, `null`, `undefined`, объект), превращаются в `Error` с полем `cause`, равным исходному значению, — тест считается упавшим, а не пройденным.",
    "`it.skip` и `it.only`: пропущенные тесты получают статус `skipped`, не вызывают хуки; блок без запускаемых тестов не вызывает `beforeAll`. Отчёт: `{ total, passed, failed, skipped, durationMs, tests: [{ name, status, error?, durationMs }] }`; время берётся из внедряемого `now` (один замер до `beforeEach`, один после `afterEach`), у пропущенных тестов `durationMs` равен `0`.",
    "После `run` **не остаётся активных таймеров**, даже при `timeoutMs = 60000`; 5000 синхронных тестов в 50 блоках проходят быстрее 3 секунд (без пауз между тестами).",
    "`formatReport(report)` — чистая функция: `✓ имя`, `✗ имя` и сообщение ошибки с отступом в 4 пробела (каждая строка), `- имя (пропущен)`, пустая строка и итог `Тестов: 3 · пройдено: 1 · упало: 1 · пропущено: 1`.",
  ],
  constraints: [
    "Без внешних библиотек: только стандартная библиотека JavaScript и таймеры; никаких `assert`, `util.isDeepStrictEqual`, `structuredClone` для сравнения.",
    "Нельзя сравнивать значения через `JSON.stringify`, `toString` или `String(...)`.",
    "Нельзя хранить состояние между вызовами `isEqual` в модуле (кэши, глобальные коллекции): результат зависит только от аргументов.",
    "Нельзя определять «ничего не брошено» по истинности пойманного значения: исключением может быть любое значение, в том числе ложное.",
    "Нельзя оставлять таймеры после завершения теста и нельзя делать паузу (`setTimeout`, `setImmediate`) между тестами «для плавности».",
    "Нельзя использовать глобальное состояние для регистрации тестов: набор создаётся `createSuite()` и изолирован.",
    "Нельзя вводить зависимость между проверками и раннером: `expect` не знает о тестах, раннер не знает о `expect`.",
  ],
  expected: [
    "`node check.mjs .` печатает `Пройдено проверок: 46 из 46` (повторяемо, 3 запуска подряд).",
    "`isEqual` отличает `{ a: undefined }` от `{}`, экземпляр класса от простого объекта, `0` от `-0` и справляется с циклом `a.self = a`.",
    "`expect(Promise.resolve(1)).rejects.toThrow()` **падает** с `ExpectationError`, а не проходит.",
    "Тест, который бросает `null`, помечается как упавший; тест, который не завершается, падает с `TimeoutError` через `timeoutMs`.",
    "Через несколько циклов сборки мусора сравнённая циклическая структура недоступна через `WeakRef`.",
  ],
  technical: [
    "Циклы в `isEqual`: ведите **стек пар** `[a, b]` «сейчас сравниваются» и снимайте пару в `finally`. Если пара уже в стеке — считайте её равной (ответ определится остальными свойствами). Глобальный кэш «уже сравнивали» — ошибка: он запоминает чужие ответы и удерживает объекты.",
    "`Set` из чисел сравнивайте через `has` (O(1)), а перебор с `isEqual` оставьте только для элементов-объектов; каждый найденный элемент удаляйте из списка кандидатов, иначе два равных объекта «закроют» один элемент второго набора.",
    "Ключи объекта — `Object.keys` плюс перечисляемые символьные ключи; `Reflect.ownKeys` вернёт ещё и неперечисляемые свойства (`stack`, `message`), из-за чего равные ошибки окажутся «разными».",
    "`toThrow`: храните **флаг** `threw`, а не пойманное значение. `catch (e) { error = e }` с проверкой `if (!error)` пропускает `throw undefined`, `throw null`, `throw 0`.",
    "Тайм-аут: `Promise.race([Promise.resolve().then(fn), таймаут])` и `clearTimeout` в `finally`. `Promise.resolve().then(fn)` превращает синхронное исключение в отказ.",
    "Не-`Error` значения превращайте в `Error` в **одном месте** (`toError`): `new Error(текст, { cause: значение })`. Статус теста определяйте по тому, что ошибка есть, а не по её истинности.",
    "Сообщения собирайте через `format`, который держит множество текущего пути (`WeakSet` с `add`/`delete`), а не посещённых вообще: общий объект в двух местах — не цикл.",
    "Обрезайте длинные значения в сообщениях (например, до 120 символов): сообщение об ошибке — для человека, а не дамп памяти.",
    "Чтобы тест на «нет активных таймеров» был честным, смотрите `process.getActiveResourcesInfo()` до и после прогона.",
  ],
  acceptance: [
    "`node check.mjs .` — 46 из 46, три запуска подряд без нестабильности.",
    "Заготовка проходит 0 из 46 проверок: каждая проверка требует реализации.",
    "Каждый из десяти «плохих» вариантов проваливает хотя бы одну проверку: от 1 (тайм-ауты не снимаются, `Set` без быстрого пути, `rejects` пропускает выполненный промис) до 10 (сравнение через `JSON.stringify`).",
    "После прогона процесс завершается сам: в `process.getActiveResourcesInfo()` нет таймеров.",
    "В коде нет `JSON.stringify` для сравнения, модульных кэшей в `isEqual` и проверки исключения по истинности значения.",
  ],
  hints: [
    "Начните с `isEqual` и `format`: от них зависят и `expect`, и сообщения раннера. Пишите их по одной проверке, глядя на красные строки.",
    "Если цикл вешает или роняет стек, вы не ведёте стек пар; если после изменения объекта сравнение «залипло» на `true`, вы храните пары в общей коллекции и не снимаете их.",
    "Если `Set` из 15 000 чисел сравнивается секундами, вы ищете числа перебором. Разделите элементы на примитивы и объекты.",
    "Если `expect(...).rejects` проходит на выполненном промисе, вы ловите отказ в `try/catch`, но не обрабатываете ветку «отказа не было».",
    "Если тест, бросивший `null`, помечен как пройденный, вы определяете ошибку по её значению. Нужен отдельный признак.",
    "Если после прогона процесс висит, а `getActiveResourcesInfo()` показывает `Timeout`, вы не снимаете таймеры после гонки.",
    "Если `afterEach` не вызывается после упавшего теста, вы пропускаете очистку из-за раннего выхода. Очистка — в `finally`-ветке, а первая ошибка запоминается.",
    "Для порядка хуков нарисуйте на бумаге два вложенных блока и выпишите ожидаемый журнал: `beforeEach` — внешний, внутренний; `afterEach` — внутренний, внешний.",
  ],
  advanced: [
    "Добавьте `done`-колбэки и сравните их с промисами: что происходит с исключением внутри асинхронного колбэка?",
    "Сделайте параллельный запуск блоков (`describe.concurrent`) с ограничением числа одновременных тестов; что изменится в порядке хуков?",
    "Добавьте `toMatchObject` (частичное сравнение) и `toHaveBeenCalledWith` с шпионами `spy(fn)`; решите, как шпион хранит вызовы, не удерживая аргументы вечно.",
    "Научите раннер ловить «осиротевшие» промисы проверок (`expect(p).rejects…` без `await`): в конце теста сообщать о незавершённых проверках.",
    "Реализуйте итеративный `isEqual` без рекурсии, чтобы вложенность в 100 000 уровней не приводила к `RangeError`.",
    "Добавьте детальный diff в сообщение `toEqual`: путь до первого различия (`a.b[2].c`).",
  ],
  failureModes: [
    "**Сравнение через `JSON.stringify`:** не различает порядок ключей, `undefined`, прототипы, `RegExp`, `Map`, `Set`, падает на циклах и `BigInt`; 36 из 46 — самый тяжёлый провал (10 красных проверок).",
    "**Нет защиты от циклов:** `a.self = a` приводит к переполнению стека; 44 из 46.",
    "**Раннер не ждёт результат теста:** асинхронные падения теряются, тайм-аут не срабатывает, `durationMs` — нули; 41 из 46.",
    "**`afterEach` пропускается после упавшего теста:** ресурсы остаются неосвобождёнными, хуки перестают быть гарантией очистки; 42 из 46.",
    "**Тайм-аут не снимается:** после прогона остаются активные таймеры, процесс живёт до их срабатывания; 45 из 46.",
    "**Истинность вместо флага:** `throw null` и `throw undefined` считаются «ничего не брошено», а тест, бросивший `null`, помечается пройденным (ложный «зелёный»); 44 из 46.",
    "**`Set` без быстрого пути для примитивов:** сравнение 15 000 чисел квадратично и не укладывается в 500 мс; 45 из 46.",
    "**`rejects` пропускает выполненный промис:** тест «ожидаю ошибку» проходит, хотя ошибки нет; 45 из 46.",
    "**Глобальный кэш пар в `isEqual`:** повторное сравнение после изменения объекта возвращает старый ответ, а сравнённые структуры не освобождаются сборщиком мусора; 44 из 46.",
    "**`format` через `JSON.stringify`:** сообщение об ошибке само бросает `TypeError` на циклах, ломается на `undefined` и `BigInt`, выводит `{\"a\":1}` вместо `{a: 1}`; 38 из 46.",
  ],
  rubric: [
    { criterion: "Глубокое сравнение", weight: 25, description: "`Object.is`, прототипы, `Date`/`RegExp`/`Error`/`Map`/`Set`, циклы, ключи, отсутствие запоминания между вызовами." },
    { criterion: "Проверки и сообщения", weight: 20, description: "`toBe`, `toEqual`, `toThrow`, `toBeCloseTo`, `toContain`, `.not`, `format`, `ExpectationError`, ложные исключения." },
    { criterion: "Раннер и изоляция сбоев", weight: 20, description: "Порядок тестов и хуков, `skip`/`only`, ошибки в хуках, `afterEach` всегда, не-`Error` значения, повторный запуск." },
    { criterion: "Асинхронность и тайм-ауты", weight: 15, description: "Ожидание промисов, `resolves`/`rejects` без ложных «зелёных», `TimeoutError`, снятие таймеров, валидация `timeoutMs`." },
    { criterion: "Память и производительность", weight: 10, description: "`Set` с быстрым путём, линейное сравнение больших структур, стек пар вместо глобального кэша, 5000 тестов быстрее 3 с." },
    { criterion: "Архитектура и тестируемость", weight: 10, description: "Изолированные наборы, внедряемое `now`, чистый репортёр, независимость `expect` от раннера, читаемость." },
  ],
  solution: [
    p("Эталон — один файл `tiny-test.mjs` (около 200 строк). Он проходит все 46 проверок при трёх запусках подряд; заготовка проходит 0 из 46, а каждый из десяти намеренно испорченных вариантов — меньше 46."),
    h("tiny-test.mjs"),
    code("js", `// tiny-test.mjs — крошечный фреймворк тестирования: сравнение, проверки, раннер, репортёр
export class ExpectationError extends Error {
  constructor(message, details = {}) { super(message); this.name = "ExpectationError"; Object.assign(this, details); }
}
export class TimeoutError extends Error {
  constructor(message) { super(message); this.name = "TimeoutError"; }
}

// ── format: значение → строка для сообщения (не бросает на циклах, BigInt, Symbol) ──
export function format(value, path = new WeakSet()) {
  switch (typeof value) {
    case "string": return JSON.stringify(value);
    case "bigint": return \`\${value}n\`;
    case "symbol": return value.toString();
    case "function": return \`[Function \${value.name || "anonymous"}]\`;
    case "number": return Object.is(value, -0) ? "-0" : String(value);
    case "object": break;
    default: return String(value);
  }
  if (value === null) return "null";
  if (path.has(value)) return "[Circular]";
  path.add(value);
  try {
    if (Array.isArray(value)) return \`[\${value.map((v) => format(v, path)).join(", ")}]\`;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();
    if (value instanceof RegExp || value instanceof Error) return String(value);
    if (value instanceof Map) return \`Map(\${value.size}) {\${[...value].map(([k, v]) => \`\${format(k, path)} => \${format(v, path)}\`).join(", ")}}\`;
    if (value instanceof Set) return \`Set(\${value.size}) {\${[...value].map((v) => format(v, path)).join(", ")}}\`;
    const name = Object.getPrototypeOf(value)?.constructor?.name;
    const body = Object.keys(value).map((k) => \`\${k}: \${format(value[k], path)}\`).join(", ");
    return \`\${name && name !== "Object" ? name + " " : ""}{\${body}}\`;
  } finally { path.delete(value); }
}
const short = (v) => { const s = format(v); return s.length > 120 ? s.slice(0, 117) + "…" : s; };

// ── isEqual: глубокое сравнение ──
const isObj = (v) => typeof v === "object" && v !== null;
const ownEnumerable = (o) => [...Object.keys(o), ...Object.getOwnPropertySymbols(o).filter((s) => Object.prototype.propertyIsEnumerable.call(o, s))];

export function isEqual(a, b, stack = []) {
  if (Object.is(a, b)) return true;
  if (!isObj(a) || !isObj(b) || Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  for (let i = stack.length - 1; i >= 0; i--) if (stack[i][0] === a && stack[i][1] === b) return true;   // цикл: пара уже сравнивается выше
  stack.push([a, b]);
  try { return compare(a, b, stack); } finally { stack.pop(); }
}
function compare(a, b, stack) {
  if (a instanceof Date) return Object.is(a.getTime(), b.getTime());
  if (a instanceof RegExp) return a.source === b.source && a.flags === b.flags;
  if (a instanceof Error && (a.name !== b.name || a.message !== b.message)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((v, i) => isEqual(v, b[i], stack));
  if (a instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) if (!b.has(k) || !isEqual(v, b.get(k), stack)) return false;
    return true;
  }
  if (a instanceof Set) {
    if (a.size !== b.size) return false;
    const objects = [...b].filter(isObj);                     // объекты ищем перебором, примитивы — через has (O(1))
    for (const x of a) {
      if (!isObj(x)) { if (!b.has(x)) return false; continue; }
      const i = objects.findIndex((y) => isEqual(x, y, stack));
      if (i < 0) return false;
      objects.splice(i, 1);                                   // каждый элемент b сопоставляется только один раз
    }
    return true;
  }
  const ka = ownEnumerable(a), kb = ownEnumerable(b);
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && isEqual(a[k], b[k], stack));
}

// ── expect ──
const fail = (message, details) => { throw new ExpectationError(message, details); };
function matchesError(error, expected) {
  if (expected === undefined) return true;
  const message = String(error?.message ?? error);
  if (typeof expected === "string") return message.includes(expected);
  if (expected instanceof RegExp) return expected.test(message);
  if (typeof expected === "function") return error instanceof expected;
  if (expected instanceof Error) return error?.message === expected.message;
  return false;
}
function matchers(actual, negate = false, reason = false) {
  const check = (matcher, pass, message, notMessage, details) => {
    if (pass === negate) fail(negate ? notMessage : message, { matcher, actual, ...details });
  };
  const api = {
    toBe: (expected) => check("toBe", Object.is(actual, expected), \`Ожидалось \${short(expected)}, получено \${short(actual)}\`, \`Не ожидалось \${short(expected)}\`, { expected }),
    toEqual: (expected) => check("toEqual", isEqual(actual, expected), \`Ожидалось (toEqual) \${short(expected)}, получено \${short(actual)}\`, \`Не ожидалось (toEqual) \${short(expected)}\`, { expected }),
    toBeCloseTo(expected, digits = 2) {
      if (typeof actual !== "number" || typeof expected !== "number") fail(\`toBeCloseTo: нужны числа, получено \${short(actual)} и \${short(expected)}\`, { matcher: "toBeCloseTo", actual, expected });
      check("toBeCloseTo", Object.is(actual, expected) || Math.abs(actual - expected) < 10 ** -digits / 2, \`Ожидалось, что \${short(actual)} близко к \${short(expected)} (знаков: \${digits})\`, \`Не ожидалось, что \${short(actual)} близко к \${short(expected)}\`, { expected });
    },
    toContain(item) {
      if (!Array.isArray(actual) && typeof actual !== "string") fail(\`toContain: ожидался массив или строка, получено \${short(actual)}\`, { matcher: "toContain", actual });
      if (typeof actual === "string" && typeof item !== "string") fail(\`toContain: в строке ищут строку, получено \${short(item)}\`, { matcher: "toContain", actual, expected: item });
      check("toContain", actual.includes(item), \`Ожидалось, что \${short(actual)} содержит \${short(item)}\`, \`Не ожидалось, что \${short(actual)} содержит \${short(item)}\`, { expected: item });
    },
    toThrow(expected) {
      let outcome;
      if (reason) outcome = { threw: true, error: actual };
      else {
        if (typeof actual !== "function") fail(\`toThrow: ожидалась функция, получено \${short(actual)}\`, { matcher: "toThrow", actual });
        try { actual(); outcome = { threw: false }; } catch (error) { outcome = { threw: true, error }; }   // флаг, а не проверка значения: throw undefined — тоже исключение
      }
      const what = expected === undefined ? "исключение" : \`исключение \${typeof expected === "function" ? expected.name : short(expected)}\`;
      const message = outcome.threw ? \`Ожидалось \${what}, брошено: \${short(outcome.error)}\` : \`Ожидалось \${what}, но ничего не брошено\`;
      check("toThrow", outcome.threw && matchesError(outcome.error, expected), message, \`Не ожидалось \${what}, но оно брошено: \${short(outcome.error)}\`, { expected });
    },
  };
  if (!negate) {
    Object.defineProperty(api, "not", { get: () => matchers(actual, true, reason) });
    for (const kind of ["resolves", "rejects"]) Object.defineProperty(api, kind, { get: () => settled(actual, kind) });
  }
  return api;
}
function settled(promise, kind, negate = false) {
  const out = {};
  for (const name of ["toBe", "toEqual", "toBeCloseTo", "toContain", "toThrow"]) {
    out[name] = async (...args) => {
      if (typeof promise?.then !== "function") fail(\`\${kind}: ожидался промис, получено \${short(promise)}\`, { matcher: kind, actual: promise });
      let ok = true, value;
      try { value = await promise; } catch (error) { ok = false; value = error; }
      if (kind === "resolves" && !ok) fail(\`Ожидалось выполнение промиса, но он отклонён: \${short(value)}\`, { matcher: kind, actual: value });
      if (kind === "rejects" && ok) fail(\`Ожидалось отклонение промиса, но он выполнен значением \${short(value)}\`, { matcher: kind, actual: value });
      return matchers(value, negate, kind === "rejects")[name](...args);
    };
  }
  if (!negate) Object.defineProperty(out, "not", { get: () => settled(promise, kind, true) });
  return out;
}
export const expect = (actual) => matchers(actual);

// ── раннер ──
const newBlock = (parent, name) => ({ parent, name, children: [], beforeAll: [], afterAll: [], beforeEach: [], afterEach: [] });
const toError = (e) => (e instanceof Error ? e : new Error(\`Брошено не Error: \${short(e)}\`, { cause: e }));

export function createSuite() {
  const root = newBlock(null, "");
  let current = root, hasOnly = false;
  const test = (name, fn, flags) => { if (flags.only) hasOnly = true; current.children.push({ test: true, name, fn, ...flags }); };
  const it = (name, fn) => test(name, fn, {});
  it.skip = (name, fn) => test(name, fn, { skip: true });
  it.only = (name, fn) => test(name, fn, { only: true });
  function describe(name, body) {
    const block = newBlock(current, name);
    current.children.push(block);
    const parent = current; current = block;
    try { body(); } finally { current = parent; }
  }
  const hook = (kind) => (fn) => { current[kind].push(fn); };

  async function run({ timeoutMs = 1000, now = () => performance.now() } = {}) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new RangeError(\`timeoutMs должен быть положительным числом, получено \${short(timeoutMs)}\`);
    const tests = [];
    const willRun = (t) => !t.skip && (!hasOnly || t.only);
    const hasRunnable = (b) => b.children.some((c) => (c.test ? willRun(c) : hasRunnable(c)));
    async function guarded(fn, label) {
      let timer;
      const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new TimeoutError(\`Тайм-аут \${timeoutMs} мс: \${label}\`)), timeoutMs); });
      try { return await Promise.race([Promise.resolve().then(fn), timeout]); } finally { clearTimeout(timer); }
    }
    async function runTest(t, names, before, after, blockError) {
      const name = [...names, t.name].join(" › ");
      if (!willRun(t)) { tests.push({ name, status: "skipped", durationMs: 0 }); return; }
      const start = now();
      let error = blockError;
      if (!error) {
        try { for (const h of before) await guarded(h, \`beforeEach: \${name}\`); await guarded(t.fn, name); } catch (e) { error = toError(e); }
        for (const h of after) { try { await guarded(h, \`afterEach: \${name}\`); } catch (e) { error ??= toError(e); } }
      }
      tests.push({ name, status: error ? "failed" : "passed", ...(error && { error }), durationMs: now() - start });
    }
    async function runBlock(b, names, outerBefore, outerAfter, inherited) {
      const before = [...outerBefore, ...b.beforeEach], after = [...b.afterEach, ...outerAfter];
      let blockError = inherited, started = false;
      if (!blockError && hasRunnable(b)) {
        started = true;
        for (const h of b.beforeAll) { try { await guarded(h, \`beforeAll: \${names.join(" › ") || "(корень)"}\`); } catch (e) { blockError = toError(e); break; } }
      }
      for (const c of b.children) await (c.test ? runTest(c, names, before, after, blockError) : runBlock(c, [...names, c.name], before, after, blockError));
      if (started) for (const h of b.afterAll) { try { await guarded(h, \`afterAll: \${names.join(" › ") || "(корень)"}\`); } catch (e) { tests.push({ name: \`\${names.join(" › ") || "(корень)"} › afterAll\`, status: "failed", error: toError(e), durationMs: 0 }); } }
    }
    const start = now();
    await runBlock(root, [], [], [], null);
    const count = (s) => tests.filter((t) => t.status === s).length;
    return { total: tests.length, passed: count("passed"), failed: count("failed"), skipped: count("skipped"), durationMs: now() - start, tests };
  }
  return { describe, it, beforeAll: hook("beforeAll"), afterAll: hook("afterAll"), beforeEach: hook("beforeEach"), afterEach: hook("afterEach"), run };
}

// ── репортёр: чистая функция «отчёт → текст» ──
export function formatReport(report) {
  const lines = report.tests.map((t) => {
    if (t.status === "passed") return \`✓ \${t.name}\`;
    if (t.status === "skipped") return \`- \${t.name} (пропущен)\`;
    return [\`✗ \${t.name}\`, ...String(t.error.message).split("\\n").map((l) => \`    \${l}\`)].join("\\n");
  });
  return [...lines, "", \`Тестов: \${report.total} · пройдено: \${report.passed} · упало: \${report.failed} · пропущено: \${report.skipped}\`].join("\\n");
}`, { filename: "tiny-test.mjs", lineNumbers: true }),
    h("Самопроверка check.mjs"),
    p("Проверка не использует сам фреймворк (чтобы ошибка в нём не маскировала ошибку в проверке): у неё свой маленький `check()` с ограничением времени на каждую проверку. Для проверки памяти флаг `--expose-gc` включается программно (`v8.setFlagsFromString` + `vm.runInNewContext(\"gc\")`), а объект наблюдается через `WeakRef`. «Нет активных таймеров» определяется по `process.getActiveResourcesInfo()` до и после прогона."),
    code("js", `// Самопроверка проекта «Мини-фреймворк тестирования». Запуск: node check.mjs [каталог с tiny-test.mjs]
// Для проверки памяти нужен вызов gc(): флаг включается программно, отдельных параметров запуска не требуется.
import path from "node:path";
import v8 from "node:v8";
import vm from "node:vm";
import { pathToFileURL } from "node:url";

const dir = path.resolve(process.argv[2] ?? "solution");
const T = await import(pathToFileURL(path.join(dir, "tiny-test.mjs")).href);
const { ExpectationError, TimeoutError, format, isEqual, expect, createSuite, formatReport } = T;
v8.setFlagsFromString("--expose-gc");
const gc = vm.runInNewContext("gc");
process.on("unhandledRejection", () => {});   // «плохая» реализация не должна ронять проверку целиком

let total = 0, passed = 0;
async function check(name, fn, limitMs = 10000) {
  total++;
  let ok = false, note = "", timer;
  try {
    const r = await Promise.race([fn(), new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(\`проверка не уложилась в \${limitMs / 1000} с (зависание?)\`)), limitMs); })]);
    ok = r === true;
    if (!ok) note = \` (вернуло \${typeof r === "object" ? JSON.stringify(r) : String(r)})\`;
  } catch (e) { note = \` (\${e?.name ?? "Error"}: \${String(e?.message).slice(0, 80)})\`; }
  finally { clearTimeout(timer); }
  if (ok) passed++;
  console.log(\`\${ok ? "OK " : "НЕТ"}  \${name}\${ok ? "" : note}\`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const never = () => new Promise(() => {});
const run = (build, options) => { const s = createSuite(); build(s); return s.run({ timeoutMs: 500, ...options }); };
const row = (r) => r.tests.map((t) => \`\${t.status[0]}:\${t.name}\`).join("|");
const throwsExp = (fn) => { try { fn(); } catch (e) { return e; } return null; };
const rejectsExp = async (p) => { try { await p; } catch (e) { return e; } return null; };
const isExp = (e, matcher) => e instanceof ExpectationError && (matcher === undefined || e.matcher === matcher);

// ───────────── isEqual ─────────────
await check("isEqual: примитивы сравниваются как Object.is (NaN равно NaN, 0 и -0 различаются)", async () =>
  isEqual(NaN, NaN) && !isEqual(0, -0) && !isEqual(1, "1") && !isEqual(null, undefined) && isEqual("a", "a") && isEqual(1n, 1n) && !isEqual(1n, 1) && !isEqual(true, 1));
await check("isEqual: массивы — порядок и длина важны, вложенность сравнивается глубоко, массив не равен объекту", async () =>
  isEqual([1, [2, [3]]], [1, [2, [3]]]) && !isEqual([1, 2], [2, 1]) && !isEqual([1, 2], [1, 2, 3]) && !isEqual([], {}) && !isEqual([[1]], [[2]]) && isEqual([], []));
await check("isEqual: объекты — порядок ключей не важен, undefined-свойство не равно отсутствию, наборы ключей сравниваются строго", async () => {
  const s = Symbol("s");
  return isEqual({ a: 1, b: 2 }, { b: 2, a: 1 }) && !isEqual({ a: 1, b: undefined }, { a: 1 }) && !isEqual({ a: 1 }, { a: 1, b: undefined })
    && !isEqual({ a: undefined }, { b: undefined }) && isEqual({ a: { b: [1, { c: 2 }] } }, { a: { b: [1, { c: 2 }] } }) && !isEqual({ a: 1 }, { a: 2 })
    && isEqual({ [s]: 1 }, { [s]: 1 }) && !isEqual({ [s]: 1 }, { [s]: 2 });
});
await check("isEqual: прототипы — экземпляры одного класса равны по полям; класс ≠ простой объект ≠ другой класс; Object.create(null) ≠ {}", async () => {
  class P { constructor() { this.x = 1; } }
  class Q { constructor() { this.x = 1; } }
  const n1 = Object.create(null), n2 = Object.create(null); n1.k = 1; n2.k = 1;
  return isEqual(new P(), new P()) && !isEqual(new P(), { x: 1 }) && !isEqual(new P(), new Q()) && isEqual(n1, n2) && !isEqual(n1, { k: 1 });
});
await check("isEqual: Date — по времени; недействительные даты равны друг другу; Date ≠ число", async () =>
  isEqual(new Date(5), new Date(5)) && !isEqual(new Date(5), new Date(6)) && isEqual(new Date(NaN), new Date(NaN)) && !isEqual(new Date(0), 0) && !isEqual(new Date(0), {}));
await check("isEqual: RegExp — по source и flags", async () =>
  isEqual(/a/g, /a/g) && !isEqual(/a/g, /a/i) && !isEqual(/a/, /b/) && isEqual(/a\\d+/u, /a\\d+/u));
await check("isEqual: Map — порядок вставки не важен, значения глубоко, ключи-объекты только по тождеству, NaN-ключ работает", async () => {
  const k = { id: 1 };
  return isEqual(new Map([[1, { a: 1 }], [2, [3]]]), new Map([[2, [3]], [1, { a: 1 }]])) && !isEqual(new Map([[1, { a: 1 }]]), new Map([[1, { a: 2 }]]))
    && !isEqual(new Map([[{ id: 1 }, 1]]), new Map([[{ id: 1 }, 1]])) && isEqual(new Map([[k, 1]]), new Map([[k, 1]]))
    && !isEqual(new Map([[1, 1]]), new Map([[1, 1], [2, 2]])) && isEqual(new Map([[NaN, 1]]), new Map([[NaN, 1]])) && !isEqual(new Map(), new Set());
});
await check("isEqual: Set — порядок не важен, объекты сравниваются глубоко и сопоставляются по одному (два равных объекта не «закрывают» один)", async () =>
  isEqual(new Set([1, "a", NaN]), new Set([NaN, "a", 1])) && !isEqual(new Set([1, 2]), new Set([1, 3])) && !isEqual(new Set([1]), new Set([1, 2]))
  && isEqual(new Set([{ a: 1 }, { a: 2 }]), new Set([{ a: 2 }, { a: 1 }])) && !isEqual(new Set([{ a: 1 }, { a: 1 }]), new Set([{ a: 1 }, { a: 2 }]))
  && !isEqual(new Set([{ a: 1 }, { a: 2 }]), new Set([{ a: 1 }, { a: 1 }])) && !isEqual(new Set([1]), [1]));
await check("isEqual: циклы — одинаковые циклические структуры равны, разные — нет, без переполнения стека", async () => {
  const a = { n: 1 }; a.self = a; const b = { n: 1 }; b.self = b; const c = { n: 2 }; c.self = c;
  const a1 = { n: 1 }, a2 = { n: 2, back: a1 }; a1.next = a2; const b1 = { n: 1 }, b2 = { n: 2, back: b1 }; b1.next = b2;
  const chain = { n: 1, self: { n: 1, self: { n: 1 } } };
  return isEqual(a, b) && !isEqual(a, c) && isEqual(a1, b1) && !isEqual(a, chain) && !isEqual(chain, a);
});
await check("isEqual: результат не «запоминается»: после изменения объекта повторное сравнение даёт новый ответ", async () => {
  const a = { x: 1, inner: { y: 1 } }, b = { x: 1, inner: { y: 1 } };
  const first = isEqual(a, b); b.inner.y = 2; const second = isEqual(a, b); b.inner.y = 1; const third = isEqual(a, b);
  return first === true && second === false && third === true;
});
await check("isEqual: Error — по классу, name и message; дополнительные свойства учитываются", async () => {
  const e1 = Object.assign(new Error("a"), { code: 1 }), e2 = Object.assign(new Error("a"), { code: 1 }), e3 = Object.assign(new Error("a"), { code: 2 });
  return isEqual(new Error("a"), new Error("a")) && !isEqual(new Error("a"), new Error("b")) && !isEqual(new TypeError("a"), new Error("a")) && isEqual(e1, e2) && !isEqual(e1, e3);
});
await check("isEqual: производительность — Set из 15 000 чисел, массив из 300 000 и объект из 50 000 ключей сравниваются быстрее 500 мс", async () => {
  const nums = Array.from({ length: 15000 }, (_, i) => i), big = Array.from({ length: 300000 }, (_, i) => i % 97);
  const o1 = {}, o2 = {}; for (let i = 0; i < 50000; i++) { o1["k" + i] = i; o2["k" + (49999 - i)] = 49999 - i; }
  const t0 = performance.now();
  const ok = isEqual(new Set(nums), new Set([...nums].reverse())) && isEqual(big, [...big]) && isEqual(o1, o2) && !isEqual(new Set(nums), new Set([...nums.slice(1), -1]));
  return ok && performance.now() - t0 < 500;
}, 30000);
await check("isEqual: память — сравнённые структуры (в том числе циклические) собираются сборщиком мусора", async () => {
  const ref = (() => { const a = { rows: Array.from({ length: 500 }, (_, i) => ({ i })) }; a.self = a; const b = structuredClone(a); isEqual(a, b); isEqual(a, { x: 1 }); return new WeakRef(a); })();
  for (let i = 0; i < 20; i++) { await sleep(5); gc(); if (ref.deref() === undefined) return true; }
  return false;
});

// ───────────── format и ExpectationError ─────────────
await check("format: строки в кавычках, BigInt, -0, null, массивы, классы, Map, Set; общий (не циклический) объект выводится дважды", async () => {
  class P { constructor() { this.x = 1; } }
  const s = { v: 1 };
  return format("a") === '"a"' && format(10n) === "10n" && format(-0) === "-0" && format(null) === "null" && format(undefined) === "undefined" && format([1, "a"]) === '[1, "a"]'
    && format(new P()) === "P {x: 1}" && format({ a: { b: 2 } }) === "{a: {b: 2}}" && format(new Map([[1, { a: 2 }]])) === "Map(1) {1 => {a: 2}}" && format(new Set([1])) === "Set(1) {1}"
    && format([s, s]) === "[{v: 1}, {v: 1}]" && format(Symbol("q")) === "Symbol(q)" && format(function foo() {}) === "[Function foo]" && format(() => {}).startsWith("[Function");
});
await check("format: циклическая структура даёт [Circular] и не бросает исключений", async () => {
  const c = { name: "c" }; c.self = c; const arr = [1]; arr.push(arr);
  return format(c) === '{name: "c", self: [Circular]}' && format(arr) === "[1, [Circular]]";
});
await check("ExpectationError: наследует Error, name «ExpectationError», поля matcher, actual и expected", async () => {
  const e = throwsExp(() => expect(2).toBe(3));
  return e instanceof Error && e instanceof ExpectationError && e.name === "ExpectationError" && e.matcher === "toBe" && e.actual === 2 && e.expected === 3 && typeof e.message === "string";
});

// ───────────── expect ─────────────
await check("toBe: Object.is, точное сообщение «Ожидалось 3, получено 2»; {} не равно {}", async () => {
  expect(1).toBe(1); expect(NaN).toBe(NaN); const o = {}; expect(o).toBe(o);
  const e = throwsExp(() => expect(2).toBe(3));
  return isExp(e, "toBe") && e.message === "Ожидалось 3, получено 2" && isExp(throwsExp(() => expect(0).toBe(-0))) && isExp(throwsExp(() => expect({}).toBe({})));
});
await check("toEqual: глубокое сравнение через isEqual, точное сообщение с обоими значениями", async () => {
  expect({ a: [1, { b: 2 }] }).toEqual({ a: [1, { b: 2 }] }); expect(new Map([[1, 2]])).toEqual(new Map([[1, 2]]));
  const e = throwsExp(() => expect({ a: 2 }).toEqual({ a: 1 }));
  return isExp(e, "toEqual") && e.message === "Ожидалось (toEqual) {a: 1}, получено {a: 2}" && isExp(throwsExp(() => expect([1, 2]).toEqual([2, 1])));
});
await check("not: инвертирует проверку, сообщение «Не ожидалось …»; повторный .not недоступен", async () => {
  expect(1).not.toBe(2); expect({ a: 1 }).not.toEqual({ a: 2 }); expect(() => {}).not.toThrow(); expect([1]).not.toContain(2);
  const e = throwsExp(() => expect(1).not.toBe(1));
  return isExp(e, "toBe") && e.message === "Не ожидалось 1" && isExp(throwsExp(() => expect(() => { throw new Error("x"); }).not.toThrow())) && expect(1).not.not === undefined;
});
await check("toThrow: без аргумента, подстрока, RegExp, класс, экземпляр Error; несовпадение — ExpectationError", async () => {
  const boom = () => { throw new TypeError("сломалось: код 42"); };
  expect(boom).toThrow(); expect(boom).toThrow("код 42"); expect(boom).toThrow(/код \\d+/); expect(boom).toThrow(TypeError); expect(boom).toThrow(Error); expect(boom).toThrow(new TypeError("сломалось: код 42"));
  return isExp(throwsExp(() => expect(boom).toThrow("другое"))) && isExp(throwsExp(() => expect(boom).toThrow(/\\d{5}/))) && isExp(throwsExp(() => expect(boom).toThrow(RangeError)))
    && isExp(throwsExp(() => expect(boom).toThrow(new Error("иначе")))) && isExp(throwsExp(() => expect(() => {}).toThrow()), "toThrow");
});
await check("toThrow: .not.toThrow(…) проходит, если брошено другое; не функция — ExpectationError с понятным сообщением", async () => {
  expect(() => { throw new Error("a"); }).not.toThrow("b"); expect(() => { throw new Error("a"); }).not.toThrow(TypeError);
  const e = throwsExp(() => expect(42).toThrow());
  return isExp(e, "toThrow") && e.message.includes("функция") && isExp(throwsExp(() => expect(() => { throw new Error("a"); }).not.toThrow("a")));
});
await check("toThrow: «ложные» значения исключений (undefined, null, 0, пустая строка) — тоже исключения", async () => {
  for (const v of [undefined, null, 0, "", false, NaN]) {
    expect(() => { throw v; }).toThrow();
    if (!isExp(throwsExp(() => expect(() => { throw v; }).not.toThrow()))) return \`not.toThrow пропустил \${String(v)}\`;
  }
  return true;
});
await check("toBeCloseTo: допуск 10^-digits / 2; 0.1 + 0.2 близко к 0.3; бесконечности; нечисла — ExpectationError", async () => {
  expect(0.1 + 0.2).toBeCloseTo(0.3); expect(0.1 + 0.2).toBeCloseTo(0.3, 10); expect(1).toBeCloseTo(1.004); expect(Infinity).toBeCloseTo(Infinity); expect(1).not.toBeCloseTo(1.006);
  return isExp(throwsExp(() => expect(0.1 + 0.2).toBe(0.3))) && isExp(throwsExp(() => expect(1).toBeCloseTo(1.01, 3))) && isExp(throwsExp(() => expect("1").toBeCloseTo(1)), "toBeCloseTo") && isExp(throwsExp(() => expect(1).toBeCloseTo(1.006)));
});
await check("toContain: массив (по SameValueZero) и строка; объекты — по тождеству; прочее — ExpectationError", async () => {
  expect([1, 2, NaN]).toContain(NaN); expect("hello").toContain("ell"); expect([1]).not.toContain(2); expect("abc").not.toContain("z");
  const o = { a: 1 }; expect([o]).toContain(o);
  return isExp(throwsExp(() => expect([{ a: 1 }]).toContain({ a: 1 }))) && isExp(throwsExp(() => expect("abc").toContain(1)), "toContain") && isExp(throwsExp(() => expect(5).toContain(5)), "toContain") && isExp(throwsExp(() => expect([1]).toContain(2)));
});
await check("сообщения: циклические объекты, BigInt и undefined не ломают проверку; сообщение об огромном массиве короче 200 символов", async () => {
  const c = { n: 1 }; c.self = c;
  const e1 = throwsExp(() => expect(c).toBe({})), e2 = throwsExp(() => expect(10n).toBe(11n)), e3 = throwsExp(() => expect(undefined).toBe(1)), e4 = throwsExp(() => expect(Array.from({ length: 100000 }, (_, i) => i)).toBe(0));
  return isExp(e1, "toBe") && e1.message.includes("[Circular]") && e2?.message === "Ожидалось 11n, получено 10n" && e3?.message === "Ожидалось 1, получено undefined" && isExp(e4) && e4.message.length < 200;
});
await check("resolves: проверяет значение выполненного промиса; для отклонённого — ExpectationError", async () => {
  await expect(Promise.resolve(2)).resolves.toBe(2); await expect(Promise.resolve({ a: 1 })).resolves.toEqual({ a: 1 }); await expect(Promise.resolve(1)).resolves.not.toBe(2);
  const e1 = await rejectsExp(expect(Promise.resolve(2)).resolves.toBe(3)), e2 = await rejectsExp(expect(Promise.reject(new Error("x"))).resolves.toBe(1));
  return isExp(e1, "toBe") && isExp(e2) && e2.message.includes("отклонён");
});
await check("rejects: проверяет причину отклонения (toThrow по сообщению и классу, toBe, toEqual)", async () => {
  await expect(Promise.reject(new Error("boom: 7"))).rejects.toThrow("boom"); await expect(Promise.reject(new TypeError("t"))).rejects.toThrow(TypeError);
  await expect(Promise.reject(7)).rejects.toBe(7); await expect(Promise.reject({ code: 1 })).rejects.toEqual({ code: 1 }); await expect(Promise.reject(new Error("a"))).rejects.not.toThrow("b");
  return isExp(await rejectsExp(expect(Promise.reject(new Error("a"))).rejects.toThrow("b"))) && isExp(await rejectsExp(expect(Promise.reject(new Error("a"))).rejects.toThrow(RangeError)));
});
await check("rejects/resolves: выполненный промис не «проходит» rejects (нет ложной зелёной), не-промис — ExpectationError", async () => {
  const e1 = await rejectsExp(expect(Promise.resolve(1)).rejects.toThrow()), e2 = await rejectsExp(expect(5).resolves.toBe(5)), e3 = await rejectsExp(expect({ then: 1 }).rejects.toThrow());
  return isExp(e1, "rejects") && e1.message.includes("отклонение") && isExp(e2, "resolves") && isExp(e3, "rejects");
});

// ───────────── раннер ─────────────
await check("раннер: тесты идут в порядке объявления, вложенные describe дают имена «A › B › тест»", async () => {
  const r = await run(({ describe, it }) => {
    it("корневой", () => {});
    describe("A", () => { it("a1", () => {}); describe("B", () => { it("b1", () => {}); }); it("a2", () => {}); });
    it("последний", () => {});
  });
  return row(r) === "p:корневой|p:A › a1|p:A › B › b1|p:A › a2|p:последний" && r.total === 5 && r.passed === 5 && r.failed === 0 && r.skipped === 0;
});
await check("хуки: beforeAll/afterAll один раз, beforeEach — снаружи внутрь, afterEach — изнутри наружу", async () => {
  const log = [];
  await run(({ describe, it, beforeAll, afterAll, beforeEach, afterEach }) => {
    beforeEach(() => log.push("rootBE")); afterEach(() => log.push("rootAE"));
    describe("A", () => {
      beforeAll(() => log.push("A.BA")); afterAll(() => log.push("A.AA")); beforeEach(() => log.push("A.BE")); afterEach(() => log.push("A.AE"));
      it("t1", () => log.push("t1"));
      describe("B", () => { beforeEach(() => log.push("B.BE")); afterEach(() => log.push("B.AE")); it("t2", () => log.push("t2")); });
    });
  });
  return log.join() === "A.BA,rootBE,A.BE,t1,A.AE,rootAE,rootBE,A.BE,B.BE,t2,B.AE,A.AE,rootAE,A.AA";
});
await check("падение одного теста не останавливает остальные; счётчики отчёта; afterEach и afterAll выполняются после упавшего теста", async () => {
  const log = [];
  const r = await run(({ describe, it, afterEach, afterAll }) => describe("S", () => {
    afterEach(() => log.push("AE")); afterAll(() => log.push("AA"));
    it("ok1", () => {}); it("bad", () => { throw new Error("сбой"); }); it("ok2", () => {});
  }));
  const bad = r.tests[1];
  return row(r) === "p:S › ok1|f:S › bad|p:S › ok2" && r.total === 3 && r.passed === 2 && r.failed === 1 && r.skipped === 0 && bad.error instanceof Error && bad.error.message === "сбой" && log.join() === "AE,AE,AE,AA";
});
await check("ошибка в beforeEach: тест помечается упавшим, тело не вызывается, afterEach всё равно выполняется", async () => {
  const log = [];
  const r = await run(({ describe, it, beforeEach, afterEach }) => describe("S", () => {
    beforeEach(() => { log.push("BE"); throw new Error("хук упал"); }); afterEach(() => log.push("AE"));
    it("t", () => log.push("body"));
  }));
  return row(r) === "f:S › t" && r.tests[0].error.message === "хук упал" && log.join() === "BE,AE";
});
await check("ошибка в beforeAll: все тесты блока (и вложенных) упали с этой ошибкой без запуска тел; afterAll выполняется, вложенные хуки — нет", async () => {
  const log = [];
  const r = await run(({ describe, it, beforeAll, afterAll, beforeEach }) => describe("S", () => {
    beforeAll(() => { log.push("BA"); throw new Error("нет базы"); }); afterAll(() => log.push("AA"));
    it("t1", () => log.push("t1"));
    describe("N", () => { beforeAll(() => log.push("N.BA")); beforeEach(() => log.push("N.BE")); it("t2", () => log.push("t2")); });
  }));
  return row(r) === "f:S › t1|f:S › N › t2" && r.tests.every((t) => t.error.message === "нет базы") && log.join() === "BA,AA";
});
await check("ошибка в afterEach делает тест упавшим; если тест уже упал, остаётся его первая ошибка", async () => {
  const r = await run(({ describe, it, afterEach }) => describe("S", () => {
    afterEach(() => { throw new Error("уборка не удалась"); });
    it("t1", () => {}); it("t2", () => { throw new Error("первая"); });
  }));
  return row(r) === "f:S › t1|f:S › t2" && r.tests[0].error.message === "уборка не удалась" && r.tests[1].error.message === "первая";
});
await check("ошибка в afterAll добавляет в отчёт упавшую запись «блок › afterAll»", async () => {
  const r = await run(({ describe, it, afterAll }) => describe("S", () => { afterAll(() => { throw new Error("закрытие"); }); it("t", () => {}); }));
  return row(r) === "p:S › t|f:S › afterAll" && r.total === 2 && r.failed === 1 && r.tests[1].error.message === "закрытие";
});
await check("асинхронность: тесты и хуки ожидаются, отказ промиса — падение теста, порядок сохраняется", async () => {
  const log = [];
  const r = await run(({ describe, it, beforeEach, afterEach }) => describe("S", () => {
    beforeEach(async () => { await sleep(10); log.push("BE"); }); afterEach(async () => { await sleep(10); log.push("AE"); });
    it("ok", async () => { await sleep(15); log.push("t1"); });
    it("reject", async () => { await sleep(5); throw new Error("async сбой"); });
    it("promise", () => Promise.reject(new Error("отказ")));
    it("expect", async () => { await expect(Promise.resolve(1)).resolves.toBe(2); });
  }));
  return row(r) === "p:S › ok|f:S › reject|f:S › promise|f:S › expect" && r.tests[1].error.message === "async сбой" && r.tests[2].error.message === "отказ" && isExp(r.tests[3].error, "toBe")
    && log.slice(0, 3).join() === "BE,t1,AE" && log.length === 9;
});
await check("тайм-аут: зависший тест падает с TimeoutError и сообщением «Тайм-аут N мс: имя», остальные продолжаются, прогон быстрый", async () => {
  const t0 = performance.now();
  const r = await run(({ describe, it }) => describe("S", () => { it("завис", never); it("после", () => {}); }), { timeoutMs: 50 });
  const e = r.tests[0].error;
  return row(r) === "f:S › завис|p:S › после" && e instanceof TimeoutError && e.name === "TimeoutError" && e.message === "Тайм-аут 50 мс: S › завис" && performance.now() - t0 < 1000;
});
await check("тайм-аут хука: тест упал, тело не вызвано, afterEach выполнен, сообщение называет хук", async () => {
  const log = [];
  const r = await run(({ describe, it, beforeEach, afterEach }) => describe("S", () => { beforeEach(never); afterEach(() => log.push("AE")); it("t", () => log.push("body")); }), { timeoutMs: 40 });
  return row(r) === "f:S › t" && r.tests[0].error instanceof TimeoutError && r.tests[0].error.message.includes("beforeEach") && log.join() === "AE";
});
await check("после прогона не остаётся активных таймеров (тайм-ауты сняты), даже при большом timeoutMs", async () => {
  const timers = () => process.getActiveResourcesInfo().filter((x) => x === "Timeout").length;
  await sleep(5);                       // даём проверке создать собственный таймер ограничения времени
  const before = timers();
  await run(({ describe, it, beforeEach, afterEach }) => describe("S", () => {
    beforeEach(() => {}); afterEach(() => {});
    for (let i = 0; i < 40; i++) it("t" + i, i % 3 === 0 ? () => { throw new Error("x"); } : async () => {});
  }), { timeoutMs: 60000 });
  await sleep(5);
  return timers() === before;
});
await check("it.skip и it.only: пропущенные не запускаются и не вызывают beforeEach; блок без запускаемых тестов не вызывает beforeAll", async () => {
  const log = [];
  const r = await run(({ describe, it, beforeAll, beforeEach }) => {
    describe("A", () => { beforeAll(() => log.push("A.BA")); beforeEach(() => log.push("A.BE")); it("a1", () => log.push("a1")); it.only("a2", () => log.push("a2")); });
    describe("B", () => { beforeAll(() => log.push("B.BA")); it("b1", () => log.push("b1")); });
  });
  const r2 = await run(({ it, beforeEach }) => { beforeEach(() => log.push("BE2")); it("x", () => log.push("x")); it.skip("y", () => log.push("y")); it("z", () => log.push("z")); });
  return row(r) === "s:A › a1|p:A › a2|s:B › b1" && r.skipped === 2 && r.passed === 1 && r.total === 3
    && row(r2) === "p:x|s:y|p:z" && log.join() === "A.BA,A.BE,a2,BE2,x,BE2,z";
});
await check("брошенные не-Error значения (строка, null, undefined, объект) превращаются в Error с полем cause", async () => {
  const thrown = ["x", null, undefined, { code: 7 }, 0];
  const r = await run(({ it }) => { thrown.forEach((v, i) => it("t" + i, () => { throw v; })); });
  return r.failed === 5 && r.tests.every((t, i) => t.error instanceof Error && Object.is(t.error.cause, thrown[i])) && r.tests[0].error.message.includes('"x"') && r.tests[3].error.message.includes("{code: 7}");
});
await check("наборы изолированы: тесты одного createSuite() не видны в другом; run можно вызывать повторно", async () => {
  const a = createSuite(), b = createSuite(); let n = 0;
  a.it("только в a", () => { n++; });
  const rb = await b.run({ timeoutMs: 200 }), ra1 = await a.run({ timeoutMs: 200 }), ra2 = await a.run({ timeoutMs: 200 });
  return rb.total === 0 && ra1.total === 1 && ra2.total === 1 && n === 2;
});
await check("run: неверный timeoutMs (0, -1, NaN, Infinity, строка) — RangeError", async () => {
  for (const bad of [0, -1, NaN, Infinity, "100"]) {
    const e = await rejectsExp(createSuite().run({ timeoutMs: bad }));
    if (!(e instanceof RangeError)) return \`не RangeError для \${String(bad)}\`;
  }
  return true;
});
await check("время: durationMs измеряется по внедряемому now (один замер до beforeEach и один после afterEach), у пропущенных — 0", async () => {
  let t = 0;
  const r = await run(({ describe, it, beforeEach }) => describe("S", () => { beforeEach(() => {}); it("a", () => {}); it.skip("b", () => {}); it("c", () => { throw new Error("x"); }); }), { now: () => (t += 5) });
  const r2 = await run(({ it }) => { it("медленный", () => sleep(30)); });
  return r.tests[0].durationMs === 5 && r.tests[1].durationMs === 0 && r.tests[2].durationMs === 5 && r.durationMs > 0 && Number.isFinite(r.durationMs) && r2.tests[0].durationMs >= 25 && r2.tests[0].durationMs < 500;
});
await check("formatReport: ✓/✗/- , многострочные сообщения с отступом, итоговая строка", async () => {
  const r = await run(({ describe, it }) => describe("S", () => { it("ok", () => {}); it("bad", () => { throw new Error("первая\\nвторая"); }); it.skip("later", () => {}); }));
  return formatReport(r) === "✓ S › ok\\n✗ S › bad\\n    первая\\n    вторая\\n- S › later (пропущен)\\n\\nТестов: 3 · пройдено: 1 · упало: 1 · пропущено: 1";
});
await check("производительность: 5000 синхронных тестов в 50 блоках проходят быстрее 3 с (без пауз между тестами)", async () => {
  const t0 = performance.now();
  const r = await run(({ describe, it, beforeEach }) => { for (let d = 0; d < 50; d++) describe("блок " + d, () => { beforeEach(() => {}); for (let i = 0; i < 100; i++) it("тест " + i, () => { expect(i).toBe(i); }); }); }, { timeoutMs: 5000 });
  return r.total === 5000 && r.passed === 5000 && performance.now() - t0 < 3000;
}, 30000);

console.log(\`\\nПройдено проверок: \${passed} из \${total}\`);
if (passed !== total) console.log(\`Не прошли: \${total - passed}\`);
process.exit(passed === total ? 0 : 1);`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 46 из 46`, { filename: "результат node check.mjs solution (Node.js 22.22.0)" }),
    code("text", `Пройдено проверок: 0 из 46
Не прошли: 46`, { filename: "результат node check.mjs starter (заготовка)" }),
    h("Проверка самой проверки: «плохие» варианты"),
    code("text", `b1-json-equal: Пройдено проверок: 36 из 46
b2-no-cycle-guard: Пройдено проверок: 44 из 46
b3-no-await: Пройдено проверок: 41 из 46
b4-cleanup-skipped: Пройдено проверок: 42 из 46
b5-timer-leak: Пройдено проверок: 45 из 46
b6-falsy-throw: Пройдено проверок: 44 из 46
b7-set-quadratic: Пройдено проверок: 45 из 46
b8-rejects-false-green: Пройдено проверок: 45 из 46
b9-leaky-memo: Пройдено проверок: 44 из 46
b10-format-json: Пройдено проверок: 38 из 46`, { filename: "результат check.mjs для вариантов с ошибками (из 46)" }),
    warn("Тест, который не может упасть, хуже отсутствующего теста: он создаёт уверенность. Каждую проверку фреймворка надо уметь «сломать» намеренно — именно поэтому у проекта есть десять испорченных вариантов, и каждый обязан быть пойман."),
    tip("Когда «зелёный» результат кажется подозрительным, проверьте тест мутацией: измените проверяемый код так, чтобы поведение стало неверным, и убедитесь, что тест покраснел. Если не покраснел — проверка не проверяет то, что вы думали."),
    ul(
      "Пороги 500 мс для `isEqual` и 3 с для 5000 тестов выбраны с запасом. Замер (Node.js 22.22.0): эталон — около 44 мс на три больших сравнения и около 63 мс на 5000 тестов; вариант с квадратичным `Set` — около 1,2 с на те же сравнения.",
      "Проверка памяти делает до 20 циклов сборки мусора с паузами по 5 мс: объект, доступный через глобальный кэш, не освободится ни в одном из них.",
    ),
  ],
};
