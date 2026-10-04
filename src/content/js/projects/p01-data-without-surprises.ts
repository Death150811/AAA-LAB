import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p01DataWithoutSurprises: Project = {
  id: "js.p01-data-without-surprises",
  domain: "js",
  order: 1,
  title: "Данные без сюрпризов",
  subtitle: "Безопасный разбор чисел, логических значений, дат и версий; точные деньги и честная классификация типов — 117 проверок в трёх часовых поясах",
  level: "foundation",
  estimatedHours: 6,
  buildsOn: [],
  topics: [
    "js.what-is-js",
    "js.variables-types",
    "js.operators-coercion",
    "js.control-flow",
    "js.functions-basics",
  ],
  objective:
    "Написать модуль `data.mjs` из **семи функций**, которые превращают «грязные» строки из внешних источников в надёжные значения: число, логическое значение, дату, деньги, версию — и не допускают тихих ошибок неявного приведения типов. Главная цель — научиться **не доверять** `parseFloat`, `Number`, `Boolean`, `new Date(строка)` и `typeof`, а вместо них явно описывать, что считается корректным вводом.",
  scenario: [
    p("Склад «Лаборатория» принимает прайс-листы от десятков поставщиков в виде текстовых таблиц. Поля приходят как строки в любом виде: `1 234,5`, ` 42 `, `12abc`, `0x10`, `да`, `31.02.2024`, `1.10.0`. За прошлый квартал неявные приведения типов обошлись дорого: «1,5 кг» превратилось в `1`, пустая ячейка стала нулём, сумма `0.1 + 0.2` дала `0.30000000000000004` в накладной, а версия `1.10.0` оказалась «старше» `1.2.0`."),
    p("Вам нужно написать модуль `data.mjs`, на который опирается импортёр. Каждая функция либо возвращает **корректное значение**, либо `null` (если ввод нельзя разобрать однозначно), либо бросает `TypeError` (если вызов — ошибка программиста). Тихих «примерно подходящих» результатов быть не должно."),
    p("Заготовка лежит в `starter/data.mjs` (функции пока бросают «не реализовано»). Проверять решение будет самопроверка `check.mjs` (117 проверок), запускаемая в трёх часовых поясах: результат не должен зависеть от окружения."),
    code(
      "js",
      `// Заготовка проекта. Реализуйте семь функций, затем запустите:  node check.mjs .
// Подробные требования — в описании проекта; сигнатуры и имена экспортов менять нельзя.

export function parseNumber(input) {
  throw new Error("не реализовано: parseNumber");
}

export function toBoolean(value) {
  throw new Error("не реализовано: toBoolean");
}

export function parseDate(input) {
  throw new Error("не реализовано: parseDate");
}

export function formatMoney(amount, currency = "RUB", locale = "ru-RU") {
  throw new Error("не реализовано: formatMoney");
}

export function compareVersions(a, b) {
  throw new Error("не реализовано: compareVersions");
}

export function sumMoney(values) {
  throw new Error("не реализовано: sumMoney");
}

export function classify(value) {
  throw new Error("не реализовано: classify");
}`,
      { filename: "starter/data.mjs" },
    ),
    table(
      ["Функция", "Что делает", "Примеры"],
      [
        ["`parseNumber(input)`", "Строка или число → конечное число либо `null`", "`\"1 234,5\"` → `1234.5`, `\"12abc\"` → `null`, `\"-0\"` → `0`"],
        ["`toBoolean(value)`", "Логическое значение либо `null` для непонятного", "`\" Да \"` → `true`, `\"maybe\"` → `null`"],
        ["`parseDate(input)`", "`YYYY-MM-DD` или `DD.MM.YYYY` → `Date` (UTC, полночь) либо `null`", "`\"29.02.2024\"` → 2024-02-29, `\"31.02.2024\"` → `null`"],
        ["`formatMoney(amount, currency, locale)`", "Денежная строка через `Intl.NumberFormat`", "`1234.5` → `\"1 234,50 ₽\"`"],
        ["`compareVersions(a, b)`", "`-1`, `0` или `1` по числовым частям", "`\"1.10.0\"` > `\"1.2.0\"`"],
        ["`sumMoney(values)`", "Точная сумма копеек в виде строки с двумя знаками", "`[\"0.1\", \"0.2\"]` → `\"0.30\"`"],
        ["`classify(value)`", "Точное имя типа", "`null`, `nan`, `array`, `date`, `object`…"],
      ],
      "Контракт модуля",
    ),
  ],
  requirements: [
    "Файл `data.mjs` экспортирует семь функций с теми же именами и сигнатурами, что в заготовке.",
    "`parseNumber`: принимает строки и числа; обрезает пробелы; пробелы и неразрывные пробелы между цифрами — разделители тысяч; запятая — десятичный разделитель; допускает знак, `.5` и `5.`; отвергает пустую строку, `abc`, `12abc`, `1e3`, `0x10`, `1,2,3`, `1.2.3`, `Infinity`, `NaN`, не-строки и не-числа; `-0` превращает в `0`; для чисел отвергает `NaN` и `±Infinity`.",
    "`toBoolean`: принимает `true`/`false`, `1`/`0`, строки `true/false`, `yes/no`, `y/n`, `да/нет`, `1/0`, `on/off` без учёта регистра и пробелов; всё остальное, включая пустую строку, `2`, `null`, `undefined`, массивы и объекты, — `null`.",
    "`parseDate`: форматы `YYYY-MM-DD` и `DD.MM.YYYY` (ровно две цифры дня и месяца, четыре — года), пробелы по краям допустимы; возвращает `Date` на **полночь по UTC**; несуществующие даты (`31.02.2024`, `2023-02-29`, месяц 13) — `null`; другие форматы и не-строки — `null`.",
    "`formatMoney`: через `Intl.NumberFormat(locale, { style: \"currency\", currency })`; по умолчанию `RUB` и `ru-RU`; для нечисла, `NaN`, `Infinity`, `null` бросает `TypeError`.",
    "`compareVersions`: сравнивает числовые части (`1.10.0` больше `1.2.0`), недостающие части — нули (`1.0` равна `1.0.0`), возвращает строго `-1`, `0` или `1`; для некорректной версии (`1.a`, пустая строка, `1..2`, не строка) бросает `TypeError`.",
    "`sumMoney`: принимает строки и числа не более чем с двумя знаками (запятая допустима, пробелы игнорируются), считает **целые копейки без дробной арифметики** и возвращает строку вида `\"1000.75\"`; пустой список — `\"0.00\"`; сумма из 1000 раз `0.01` — `\"10.00\"`; `1.005`, `abc`, пустая строка, `1e2` — `TypeError`.",
    "`classify`: различает `null`, `undefined`, `nan`, `number`, `string`, `boolean`, `array`, `date`, `object`, `function`, `symbol`, `bigint`; экземпляр класса, `Map` и обычный объект — `object`.",
    "Код читается без комментариев-костылей: функции короткие, имена говорящие, комментарии объясняют «почему», а не «что».",
  ],
  constraints: [
    "Без внешних библиотек и без `eval`, `new Function`, `with`.",
    "Только строгие сравнения: `===`, `!==`, `Object.is`; операторы `==` и `!=` не допускаются.",
    "Нельзя использовать `parseFloat`, `parseInt` и конструктор `Number` для «сырого» ввода без предварительной проверки формата.",
    "Нельзя разбирать даты через `new Date(строка)` (результат зависит от формата и часового пояса) — только через `Date.UTC` и проверку результата.",
    "Нельзя считать деньги умножением дробных чисел на 100 и сложением `float` — только через целые копейки, полученные из строки.",
    "Результат не должен зависеть от часового пояса и локали окружения (кроме явно переданных `currency` и `locale`).",
  ],
  expected: [
    "`node check.mjs .` печатает `Пройдено проверок: 117 из 117`.",
    "`node run-checks.mjs .` проходит 117 из 117 в часовых поясах `UTC`, `Pacific/Kiritimati` (UTC+14) и `America/Los_Angeles`.",
    "Функции никогда не возвращают «почти правильное»: `NaN`, `Invalid Date`, `0` вместо «не число» не встречаются.",
    "Импортёр может отличить «поле пустое/мусор» (`null`) от «вызвали неправильно» (`TypeError`).",
  ],
  technical: [
    "Для чисел проверяйте **формат регулярным выражением**, а затем вызывайте `Number`: `^[+-]?(\\d+\\.?\\d*|\\.\\d+)$`. Тогда `Number` получает только безопасные строки, а `1e3`, `0x10`, пустая строка и пробелы отсекаются до конструктора.",
    "`-0` убирается сложением с нулём (`value + 0`): в JavaScript `-0 + 0` равно `0`. Проверяйте `Object.is(result, 0)`.",
    "Для даты `Date.UTC(год, месяц - 1, день)` «переносит» несуществующие дни (31 февраля станет 2–3 марта), поэтому после создания сравните `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()` с исходными числами.",
    "Для денег: разберите строку на знак, целую и дробную части (`^([+-]?)(\\d+)(?:\\.(\\d{1,2}))?$`) и считайте `целая * 100 + дробная.padEnd(2, \"0\")` — это целое число; форматируйте обратно через `padStart(2, \"0\")`.",
    "Для версий разбейте по точкам, приведите части к числам (после проверки формата `^\\d+(\\.\\d+)*$`) и возвращайте `Math.sign` первой ненулевой разности.",
    "Для `classify` начните с `null` (потому что `typeof null === \"object\"`), затем `switch (typeof value)`; для `object` различайте `Array.isArray` и `instanceof Date`.",
    "Неразрывные пробелы в `Intl` — это `U+00A0` и `U+202F`: не заменяйте их обычными пробелами при форматировании и учитывайте при разборе (`/[\\u00a0\\u202f\\s]/g`).",
  ],
  acceptance: [
    "`node check.mjs .` — 117 из 117; `node run-checks.mjs .` — 117 из 117 в трёх часовых поясах.",
    "Статические проверки: нет `==`/`!=`, нет `eval`/`new Function`/`with`.",
    "Заготовка (`starter`) проходит 3 из 117 проверок (только экспорты и статические требования) — по ней видно, что проверка действительно проверяет поведение.",
    "Каждый из восьми «плохих» вариантов (см. ниже) проваливает проверку: самое «мягкое» нарушение (нестрогое сравнение) — 1 проверку, самые тяжёлые — 13.",
  ],
  hints: [
    "Начните с `classify`: он короткий и учит различать `null`, `NaN`, массив и `Date`, на чём построены остальные функции.",
    "Если `parseNumber(\"\")` возвращает `0`, вы вызываете `Number` на сырой строке. Сначала регулярное выражение, потом `Number`.",
    "`\"1 234,5\"` — это два пробела другого вида (в тестах есть обычный, `U+00A0` и `U+202F`): используйте класс `\\s` и явно перечислите неразрывные.",
    "Для `parseDate` не угадывайте формат: опишите два регулярных выражения с группами и разбирайте группы числами.",
    "Если `sumMoney([\"0.1\", \"0.2\"])` даёт `0.30000000000000004`, вы складываете дроби. Переведите каждую сумму в целые копейки **из строки**, а не умножением `0.1 * 100`.",
    "`Math.sign(a - b)` возвращает `-1`, `0` или `1` (и `-0`, если разность `-0`); учитывайте, что проверка использует `Object.is`.",
    "Если проверка в одном часовом поясе проходит, а в другом нет, ищите `new Date(...)` без `UTC` или методы `getDate()`/`getHours()` вместо `getUTC...`.",
  ],
  advanced: [
    "Добавьте `parseDuration(\"1ч 30м\")` (часы, минуты, секунды на русском и английском) с таблицей проверок.",
    "Реализуйте `parseMoney(input)` — разбор `\"1 234,50 ₽\"` обратно в копейки, согласованный с `formatMoney`.",
    "Перепишите набор проверок на `node:test` с таблицей `test.each`-подобного вида и сравните читаемость отчёта.",
    "Опишите контракт функций типами JSDoc (`@param`, `@returns`) и включите `// @ts-check` в редакторе.",
    "Добавьте мутационные проверки: напишите 5 собственных «мутантов» `data.mjs` и убедитесь, что `check.mjs` их ловит.",
  ],
  failureModes: [
    "**`parseFloat` вместо проверки формата:** `parseNumber(\"12abc\")` даёт `12`, `\"1e3\"` — `1000`, `\"1 234,5\"` — `1`; в замере 105 проверок из 117.",
    "**`Number(str)` на сырой строке:** пустая строка и пробелы превращаются в `0`, `\"0x10\"` — в `16`; не понимает запятую и пробелы; 106 из 117.",
    "**Сумма через `float`:** `sumMoney([\"0.1\", \"0.2\"])` — `\"0.30000000000000004\"`, пустой список — `\"0\"`; 105 из 117.",
    "**Сравнение версий как строк:** `\"1.10.0\" < \"1.2.0\"` — версия 1.10.0 оказывается «старше»; 107 из 117.",
    "**`new Date(строка)`:** не понимает `29.02.2024`, молча «исправляет» `2023-02-29` в 1 марта и принимает `2024-1-1`, `2024/01/01`; 109 из 117.",
    "**`Boolean(value)`:** любая непустая строка — `true` (`\"нет\"`, `\"off\"`, `\"0\"`, `\"false\"`), а пустая — `false` вместо `null`; 104 из 117.",
    "**`typeof` вместо `classify`:** `null`, массив, дата и `Map` — `\"object\"`, `NaN` — `\"number\"`; 113 из 117.",
    "**Нестрогое сравнение `value == null`:** функционально почти незаметно, но самопроверка ловит `==` статически; 116 из 117.",
  ],
  rubric: [
    { criterion: "Приведение типов и безопасный разбор", weight: 25, description: "Формат проверяется до `Number`, не используются `parseFloat`/`Boolean`/`new Date(строка)` на сыром вводе; `null` вместо тихих ошибок." },
    { criterion: "Числа и деньги", weight: 20, description: "`-0`, `NaN`, `Infinity`, разделители тысяч и дробей, целые копейки без накопления ошибки, `Intl.NumberFormat`." },
    { criterion: "Даты и версии", weight: 20, description: "`Date.UTC` и проверка реальности даты, числовое сравнение частей версии, строгие `-1/0/1`." },
    { criterion: "Строгость и читаемость", weight: 15, description: "Только `===`/`Object.is`, `switch (typeof)`, короткие функции, говорящие имена, нет `eval`." },
    { criterion: "Граничные случаи и контракт ошибок", weight: 15, description: "Различие `null` и `TypeError`, проверка всех не-строк и не-чисел, пустой ввод, неразрывные пробелы." },
    { criterion: "Независимость от окружения", weight: 5, description: "Результат одинаков в разных часовых поясах и локалях (кроме явно переданных)." },
  ],
  solution: [
    p("Эталон — один файл `data.mjs`. Он проходит все 117 проверок в трёх часовых поясах; заготовка проходит 3 из 117 (экспорты и статические требования), а каждый из восьми намеренно испорченных вариантов — меньше 117."),
    h("data.mjs"),
    code("js", `// Приведение и форматирование данных без сюрпризов
const NBSP = /[  \\s]/g;

/** "1 234,5" → 1234.5; всё сомнительное → null. -0 превращается в 0. */
export function parseNumber(input) {
  if (typeof input === "number") return Number.isFinite(input) ? input + 0 : null;
  if (typeof input !== "string") return null;
  const text = input.replace(NBSP, "").replace(",", ".");
  if (!/^[+-]?(\\d+\\.?\\d*|\\.\\d+)$/.test(text)) return null;      // без пустых строк, экспонент, 0x, Infinity, нескольких разделителей
  const value = Number(text);
  return Number.isFinite(value) ? value + 0 : null;              // + 0 заменяет -0 на 0
}

const TRUE = new Set(["true", "yes", "y", "да", "1", "on"]);
const FALSE = new Set(["false", "no", "n", "нет", "0", "off"]);
/** Логическое значение из строки или числа; не распознали — null (а не «ложь»). */
export function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value === 1) return true;
  if (value === 0) return false;
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  return TRUE.has(key) ? true : FALSE.has(key) ? false : null;
}

/** "2024-02-29" или "29.02.2024" → Date (UTC, полночь); несуществующая дата → null. */
export function parseDate(input) {
  if (typeof input !== "string") return null;
  const text = input.trim();
  const iso = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(text);
  const ru = /^(\\d{2})\\.(\\d{2})\\.(\\d{4})$/.exec(text);
  const parts = iso ? [iso[1], iso[2], iso[3]] : ru ? [ru[3], ru[2], ru[1]] : null;
  if (!parts) return null;
  const [year, month, day] = parts.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const real = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;   // 31 февраля «переезжает» в март — отсекаем
  return real ? date : null;
}

/** 1234.5 → "1 234,50 ₽" (неразрывные пробелы, как в ru-RU). */
export function formatMoney(amount, currency = "RUB", locale = "ru-RU") {
  if (typeof amount !== "number" || !Number.isFinite(amount)) throw new TypeError("amount должен быть конечным числом");
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}

/** Сравнение версий по числам: "1.10.0" > "1.2.0"; нет части — считается нулём. */
export function compareVersions(a, b) {
  const parse = (v) => {
    if (typeof v !== "string" || !/^\\d+(\\.\\d+)*$/.test(v.trim())) throw new TypeError(\`Некорректная версия: \${String(v)}\`);
    return v.trim().split(".").map(Number);
  };
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const diff = (x[i] ?? 0) - (y[i] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}

/** Точная сумма денег, заданных строками или числами не более чем с двумя знаками ("0.10", "0,20", 5): считаем целые копейки. */
export function sumMoney(values) {
  let cents = 0;
  for (const value of values) {
    const text = String(value).replace(NBSP, "").replace(",", ".");
    const m = /^([+-]?)(\\d+)(?:\\.(\\d{1,2}))?$/.exec(text);
    if (!m) throw new TypeError(\`Не денежная сумма: \${String(value)}\`);
    const amount = Number(m[2]) * 100 + Number((m[3] ?? "").padEnd(2, "0"));   // без умножения дробей: никаких 100.49999999999999
    cents += m[1] === "-" ? -amount : amount;
  }
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return \`\${sign}\${Math.floor(abs / 100)}.\${String(abs % 100).padStart(2, "0")}\`;
}

/** Точное имя типа: null, nan, array, date… */
export function classify(value) {
  if (value === null) return "null";
  switch (typeof value) {
    case "number": return Number.isNaN(value) ? "nan" : "number";
    case "object": return Array.isArray(value) ? "array" : value instanceof Date ? "date" : "object";
    default: return typeof value;                                  // string, boolean, undefined, function, symbol, bigint
  }
}`, { filename: "data.mjs", lineNumbers: true }),
    h("Самопроверка check.mjs"),
    p("Проверка табличная: каждая строка — вызов и ожидаемое значение; исключения превращаются в данные, поэтому заготовка с «не реализовано» даёт красные строки, а не падение проверяльщика. Два специальных класса проверок — статический разбор исходника (нет `==`, `eval`) и запуск в разных часовых поясах (`run-checks.mjs`)."),
    code("js", `// Самопроверка проекта «Данные без сюрпризов». Запуск: node check.mjs [каталог с data.mjs]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = path.resolve(process.argv[2] ?? "solution");
const file = path.join(dir, "data.mjs");
const source = fs.readFileSync(file, "utf8");
const m = await import(pathToFileURL(file).href);

let total = 0, passed = 0;
const failures = [];
const same = (a, b) => (a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : Object.is(a, b));
function check(name, actual, expected) {
  total++;
  const ok = same(actual, expected);
  if (ok) passed++; else failures.push(name);
  console.log(\`\${ok ? "OK " : "НЕТ"}  \${esc(name)}\${ok ? "" : \`   (получено \${show(actual)}, ожидалось \${show(expected)})\`}\`);
}
const esc = (t) => t.replace(/\\u00a0/g, "\\\\u00a0").replace(/\\u202f/g, "\\\\u202f");
const show = (v) => (v && v.threw ? \`исключение \${v.threw}: \${v.message}\` : v instanceof Date ? v.toISOString() : typeof v === "string" ? esc(JSON.stringify(v)) : Object.is(v, -0) ? "-0" : String(v));
// Исключения превращаем в данные: заготовка с «не реализовано» должна давать красные проверки, а не падение проверяльщика
const guarded = (fn) => (...a) => { try { return fn(...a); } catch (e) { return { threw: e?.name ?? "Error", message: e?.message }; } };
const attempt = (fn) => { const r = fn(); return r && r.threw ? r.threw : r; };
const date = (iso) => new Date(iso);

// ── статические требования ──
check("есть все экспорты", ["parseNumber", "toBoolean", "parseDate", "formatMoney", "compareVersions", "sumMoney", "classify"].every((n) => typeof m[n] === "function"), true);
const code = source.replace(/\\/\\*[\\s\\S]*?\\*\\//g, "").replace(/\\/\\/.*$/gm, "").replace(/(["'\`])(?:\\\\.|(?!\\1).)*\\1/g, '""').replace(/\\/(?![*/])(?:\\\\.|\\[[^\\]]*\\]|[^/\\\\\\n])+\\/[a-z]*/g, "/re/");
check("нет нестрогих сравнений (== и !=)", /(?<![=!<>])==(?!=)|!=(?!=)/.test(code), false);
check("нет eval, new Function и with", /\\beval\\s*\\(|new\\s+Function|\\bwith\\s*\\(/.test(code), false);

// ── parseNumber ──
const pn = guarded(m.parseNumber);
for (const [input, expected] of [["42", 42], [" 42 ", 42], ["1 234,5", 1234.5], ["1 234,5", 1234.5], ["1 234.5", 1234.5], ["-3.14", -3.14], ["+7", 7], [".5", 0.5], ["5.", 5], [7, 7]]) check(\`parseNumber(\${JSON.stringify(input)})\`, pn(input), expected);
check("parseNumber(\\"-0\\") → 0, не -0", pn("-0"), 0);
check("parseNumber(-0) → 0, не -0", pn(-0), 0);
for (const bad of ["", "   ", "abc", "12abc", "1e3", "0x10", "1,2,3", "1.2.3", "Infinity", "NaN", "--5", NaN, Infinity, null, undefined, [5], true, {}]) check(\`parseNumber(\${typeof bad === "number" ? String(bad) : JSON.stringify(bad) ?? "undefined"}) → null\`, pn(bad), null);

// ── toBoolean ──
const tb = guarded(m.toBoolean);
for (const [input, expected] of [[true, true], [false, false], [1, true], [0, false], ["Да", true], [" yes ", true], ["НЕТ", false], ["off", false], ["1", true], ["0", false], ["false", false]]) check(\`toBoolean(\${JSON.stringify(input)})\`, tb(input), expected);
for (const bad of ["", "maybe", 2, -1, null, undefined, [], {}, "truee"]) check(\`toBoolean(\${JSON.stringify(bad) ?? "undefined"}) → null\`, tb(bad), null);

// ── parseDate ──
const pd = guarded(m.parseDate);
for (const [input, iso] of [["2024-02-29", "2024-02-29T00:00:00.000Z"], ["29.02.2024", "2024-02-29T00:00:00.000Z"], ["01.01.2024", "2024-01-01T00:00:00.000Z"], [" 2024-03-05 ", "2024-03-05T00:00:00.000Z"]]) check(\`parseDate(\${JSON.stringify(input)}) — UTC-полночь\`, (() => { const d = pd(input); return d instanceof Date ? d.toISOString() : d; })(), iso);
for (const bad of ["31.02.2024", "2023-02-29", "2024-02-30", "2024-13-01", "2024-1-1", "1.1.2024", "2024/01/01", "вчера", "", 20240101, null, undefined]) check(\`parseDate(\${JSON.stringify(bad) ?? "undefined"}) → null\`, pd(bad), null);
check("parseDate возвращает Date", pd("2024-01-01") instanceof Date, true);

// ── formatMoney ──
const fm = guarded(m.formatMoney);
check("formatMoney(1234.5) — «1 234,50 ₽» с неразрывными пробелами", fm(1234.5), "1 234,50 ₽");
check("formatMoney(0)", fm(0), "0,00 ₽");
check("formatMoney(-5.5)", fm(-5.5), "-5,50 ₽");
check("formatMoney(1234.5, \\"USD\\", \\"en-US\\")", fm(1234.5, "USD", "en-US"), "$1,234.50");
for (const bad of ["12", NaN, Infinity, null, undefined]) check(\`formatMoney(\${String(bad)}) бросает TypeError\`, attempt(() => fm(bad)), "TypeError");

// ── compareVersions ──
const cv = guarded(m.compareVersions);
for (const [a, b, r] of [["1.10.0", "1.2.0", 1], ["1.2.0", "1.10.0", -1], ["1.0", "1.0.0", 0], ["2", "1.9.9", 1], ["1.0.1", "1.0", 1], [" 1.0 ", "1.0", 0], ["10.0.0", "9.99.99", 1]]) check(\`compareVersions(\${JSON.stringify(a)}, \${JSON.stringify(b)}) === \${r}\`, cv(a, b), r);
for (const bad of ["1.a", "", "1..2", null, 1]) check(\`compareVersions(\${JSON.stringify(bad)}, "1") бросает TypeError\`, attempt(() => cv(bad, "1")), "TypeError");

// ── sumMoney ──
const sm = guarded(m.sumMoney);
check("sumMoney([\\"0.1\\", \\"0.2\\"]) = \\"0.30\\"", sm(["0.1", "0.2"]), "0.30");
check("sumMoney([0.1, 0.2]) = \\"0.30\\"", sm([0.1, 0.2]), "0.30");
check("sumMoney([\\"-1.00\\", \\"0.5\\"]) = \\"-0.50\\"", sm(["-1.00", "0.5"]), "-0.50");
check("sumMoney([\\"0,25\\", \\"1 000,5\\"]) = \\"1000.75\\"", sm(["0,25", "1 000,5"]), "1000.75");
check("sumMoney([]) = \\"0.00\\"", sm([]), "0.00");
check("sumMoney([\\"10\\"]) = \\"10.00\\"", sm(["10"]), "10.00");
check("тысяча раз по 0.01 = \\"10.00\\" (без накопления ошибки)", sm(Array.from({ length: 1000 }, () => "0.01")), "10.00");
check("сто раз по 0.07 = \\"7.00\\"", sm(Array.from({ length: 100 }, () => "0.07")), "7.00");
for (const bad of ["1.005", "abc", "", "1e2"]) check(\`sumMoney([\${JSON.stringify(bad)}]) бросает TypeError\`, attempt(() => sm([bad])), "TypeError");

// ── classify ──
const cl = guarded(m.classify);
for (const [input, expected, label] of [[null, "null", "null"], [undefined, "undefined", "undefined"], [NaN, "nan", "NaN"], [1, "number", "1"], ["s", "string", "\\"s\\""], [true, "boolean", "true"], [[], "array", "[]"], [new Date(), "date", "new Date()"], [{}, "object", "{}"], [new (class A {})(), "object", "new A()"], [() => 1, "function", "() => 1"], [Symbol("x"), "symbol", "Symbol()"], [10n, "bigint", "10n"], [new Map(), "object", "new Map()"]]) check(\`classify(\${label}) → \${expected}\`, cl(input), expected);

console.log(\`\\nПройдено проверок: \${passed} из \${total}\`);
if (failures.length) console.log("Не прошли: " + failures.length);
process.exit(failures.length ? 1 : 0);`, { filename: "check.mjs", collapsed: true }),
    code("js", `// Запускает самопроверку в трёх часовых поясах: результат не должен зависеть от окружения
import { spawnSync } from "node:child_process";
const dir = process.argv[2] ?? "solution";
let bad = 0;
for (const tz of ["UTC", "Pacific/Kiritimati", "America/Los_Angeles"]) {
  const r = spawnSync(process.execPath, ["check.mjs", dir], { encoding: "utf8", env: { ...process.env, TZ: tz } });
  const line = r.stdout.trim().split("\\n").filter((l) => l.startsWith("Пройдено")).pop();
  console.log(\`TZ=\${tz.padEnd(20)} \${line ?? r.stderr.split("\\n")[0]}\`);
  if (r.status !== 0) bad++;
}
process.exit(bad ? 1 : 0);`, { filename: "run-checks.mjs" }),
    code("text", `TZ=UTC                  Пройдено проверок: 117 из 117
TZ=Pacific/Kiritimati   Пройдено проверок: 117 из 117
TZ=America/Los_Angeles  Пройдено проверок: 117 из 117`, { filename: "результат node run-checks.mjs solution (Node.js 22.22.0)" }),
    code("text", `Пройдено проверок: 3 из 117
Не прошли: 114`, { filename: "результат node check.mjs starter (заготовка)" }),
    h("Проверка самой проверки: «плохие» варианты"),
    p("Чтобы убедиться, что самопроверка ловит типичные ошибки, из эталона получены восемь вариантов, каждый с одной ошибкой из раздела «Типичные провалы». Результаты запуска:"),
    code("text", `b1-parsefloat: Пройдено проверок: 105 из 117
b2-number: Пройдено проверок: 106 из 117
b3-floatsum: Пройдено проверок: 105 из 117
b4-versions-string: Пройдено проверок: 107 из 117
b5-new-date: Пройдено проверок: 109 из 117
b6-boolean: Пройдено проверок: 104 из 117
b7-typeof: Пройдено проверок: 113 из 117
b8-loose-equality: Пройдено проверок: 116 из 117`, { filename: "результат check.mjs для вариантов с ошибками (из 117)" }),
    warn("`Number(\"\")` равно `0`, а `parseFloat(\"12abc\")` — `12`: оба «работают» на удобных примерах и ломаются на реальных данных. Правило проекта: **сначала формат, потом приведение типа**."),
    tip("Если регулярное выражение для числа становится трудночитаемым, вынесите его в именованную константу с комментарием, какие строки оно допускает, и добавьте по проверке на каждую ветку: именно так защищаются регулярные выражения от «мелких улучшений»."),
  ],
};
