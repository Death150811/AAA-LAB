import type { Topic } from "../../types";
import {
  annotated,
  beforeAfter,
  code,
  def,
  exercise,
  h,
  insight,
  iq,
  mcq,
  note,
  open,
  p,
  section,
  table,
  tip,
  ul,
  warn,
  wrongRight,
} from "../../dsl";

export const variablesTypes: Topic = {
  id: "js.variables-types",
  slug: "variables-types",
  domain: "js",
  module: "language",
  title: "Переменные и типы данных",
  titleEn: "Variables and data types",
  summary:
    "Переменная — это имя, связанное со значением. `const` запрещает перепривязку имени, `let` разрешает, а `var` — наследие, у которого другая область видимости. Значения бывают восьми типов: семь примитивных (`undefined`, `null`, `boolean`, `number`, `bigint`, `string`, `symbol`) и объект; примитивы копируются по значению, объекты передаются по ссылке. Тема на замерах в Node.js 22 и Chromium 141 разбирает `typeof` (и его ошибку про `null`), устройство `number` (почему `0.1 + 0.2 !== 0.3`, где кончаются безопасные целые, чем отличается `NaN`), `BigInt`, неизменяемость и UTF-16-природу строк, копирование и сравнение по ссылке, поверхностную заморозку `Object.freeze` и способ, которым `var` попадает в глобальный объект.",
  minutes: 55,
  prerequisites: ["js.what-is-js"],
  tags: ["let", "const", "var", "typeof", "number", "bigint", "string", "symbol", "null", "undefined", "NaN", "IEEE 754", "примитивы", "ссылки", "structuredClone", "Object.freeze"],
  keyConcepts: [
    { term: "const — не «неизменяемое», а «нельзя перепривязать»", text: "`const user = {}` не даёт заменить `user`, но разрешает менять поля объекта. Замер: присваивание `const` — `TypeError: Assignment to constant variable.`, `user.name = …` — работает." },
    { term: "Восемь типов", text: "`undefined`, `null`, `boolean`, `number`, `bigint`, `string`, `symbol` — примитивы; всё остальное (массивы, функции, даты, регулярные выражения) — объекты." },
    { term: "typeof null === \"object\"", text: "Историческая ошибка языка, оставленная ради совместимости. `null` — примитив; проверяйте его через `=== null`." },
    { term: "number — это число с плавающей точкой", text: "64-битный IEEE 754: `0.1 + 0.2` даёт `0.30000000000000004`, а целые точны только до `Number.MAX_SAFE_INTEGER` (9007199254740991)." },
    { term: "Копия значения и копия ссылки", text: "`let b = a` для примитива создаёт независимую копию; для объекта — второе имя того же объекта. Спред `{ ...p }` копирует только верхний уровень, `structuredClone` — всю глубину." },
  ],
  sections: [
    section("definition", [
      def("Переменная", "Именованная привязка: имя связано со значением в текущей области видимости. Привязка создаётся объявлением (`let`, `const`, `var`).", "variable / binding"),
      def("`const`", "Объявление, после которого имя нельзя привязать к другому значению. Требует инициализации сразу. Не делает значение неизменяемым.", "const"),
      def("`let`", "Объявление переменной с блочной областью видимости; значение можно менять. Использовать до строки объявления нельзя (временная мёртвая зона).", "let"),
      def("`var`", "Старое объявление с областью видимости «вся функция»; на верхнем уровне классического скрипта создаёт свойство глобального объекта.", "var"),
      def("Примитив", "Значение, не являющееся объектом и неизменяемое: `undefined`, `null`, `boolean`, `number`, `bigint`, `string`, `symbol`. Копируется и сравнивается по значению.", "primitive"),
      def("Объект", "Составное значение со свойствами; массивы, функции, `Date`, `Map` — тоже объекты. Переменная хранит ссылку, сравнение `===` сравнивает ссылки.", "object"),
      def("`typeof`", "Оператор, возвращающий строку с названием типа значения. Безопасен для необъявленных имён.", "typeof"),
      def("`NaN`", "Особое значение типа `number`, означающее «не число» (результат неудачного вычисления). Не равно самому себе.", "NaN"),
    ]),

    section("why", [
      h("Типы — источник большинства «странных» багов"),
      p("Когда приложение показывает `NaN` вместо цены, суммирует строки вместо чисел (`\"5\" + 3` даёт `\"53\"`) или «случайно» меняет данные в другом месте экрана, причина почти всегда одна из трёх: путаница типов, потеря точности числа или общая ссылка на объект. Все три объясняются моделью, которую вы изучаете в этой теме."),
      ul(
        "**Предсказуемость:** вы заранее знаете, что `let b = a` копирует, а `const q = p` — нет.",
        "**Корректные деньги и идентификаторы:** понимание `number` и `bigint` — разница между верной суммой и накопленной ошибкой в копейках.",
        "**Чистота данных:** понимание, что `const` и `Object.freeze` защищают, а что нет, определяет способ хранения состояния.",
        "**Диагностика:** сообщения `Cannot access 'x' before initialization`, `Assignment to constant variable`, `Cannot mix BigInt and other types` становятся понятными, а не загадочными.",
      ),
      insight("У значения в JavaScript есть тип, а у переменной — нет: одна и та же переменная (`let x`) может хранить число, затем строку. Типизация динамическая, поэтому тип нужно **проверять и документировать самому**."),
    ]),

    section("mental-model", [
      p("Представьте **склад с ячейками и этикетками**. Переменная — этикетка с именем. Примитивное значение лежит прямо на этикетке: когда вы пишете `let b = a`, вы переписываете значение на новую этикетку, и две записи живут независимо. Объект — это **большой ящик в глубине склада**, а на этикетке написан только его номер (ссылка). `const q = p` — вторая этикетка с тем же номером: ящик один, и изменение содержимого видно через обе. `const` означает, что **этикетку нельзя переклеить на другой ящик**, но содержимое ящика можно менять."),
      table(
        ["Операция", "Примитив (`number`, `string`…)", "Объект (`{}`, `[]`, функция…)"],
        [
          ["`let b = a`", "Копия значения", "Копия ссылки (общий объект)"],
          ["`a === b`", "Сравнение значений", "Сравнение ссылок: `{} === {}` — `false`"],
          ["Изменение через `b`", "Невозможно (значения неизменяемы)", "Видно через `a`"],
          ["`const` защищает", "Значение полностью", "Только привязку имени"],
        ],
        "Значение и ссылка",
      ),
    ]),

    section("technical", [
      h("Объявления: `const`, `let`, `var`"),
      p("Начинайте с `const`, переходите на `let`, только когда значение действительно меняется; `var` в новом коде не нужен. Замер (Node.js 22.22.0, модуль):"),
      code("js", `const PI = 3.14159;
try {
  PI = 3;
} catch (e) {
  console.log(e.name + ": " + e.message);
}

const user = { name: "Аня" };
user.name = "Борис";            // содержимое объекта менять можно
console.log(user.name);

try {
  user = { name: "Вера" };      // а привязку имени — нельзя
} catch (e) {
  console.log(e.name + ": " + e.message);
}

function scopes() {
  if (true) {
    var a = 1;                  // область — вся функция
    let b = 2;                  // область — блок
  }
  console.log(typeof a, typeof b);
}
scopes();

let n = 1;
n = n + 1;
console.log(n);

try {
  console.log(late);
  let late = 5;
} catch (e) {
  console.log(e.name + ": " + e.message);
}`, { filename: "v1-declarations.mjs", lineNumbers: true }),
      code("text", `TypeError: Assignment to constant variable.
Борис
TypeError: Assignment to constant variable.
number undefined
2
ReferenceError: Cannot access 'late' before initialization`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`const`** не позволяет присвоить имени новое значение (`TypeError: Assignment to constant variable.`), но объект, на который указывает имя, можно менять.",
        "**`let` — блочная область, `var` — область функции:** после блока `if` переменная `a` (объявленная через `var`) видна — `typeof a` это `number`, а `b` (через `let`) — нет.",
        "**Использование до объявления:** для `let`/`const` — `ReferenceError: Cannot access 'late' before initialization` (временная мёртвая зона, подробно — в теме о контексте исполнения).",
      ),
      note("Имена переменных регистрозависимы (`user` и `User` — разные), могут содержать буквы Unicode, цифры (не в начале), `$` и `_`. Принято `camelCase` для переменных и функций, `PascalCase` для классов, `UPPER_SNAKE_CASE` для настоящих констант-конфигураций."),

      h("`var` и глобальный объект"),
      p("В классическом скрипте браузера `var` и объявления функций верхнего уровня становятся свойствами `window`; `let` и `const` — нет. В модуле `var` тоже остаётся локальной. Замер в Chromium 141 (по `http://`):"),
      code("html", `<!doctype html>
<meta charset="utf-8">
<script>
  var a = 1;
  let b = 2;
  const c = 3;
  function f() {}
  window.classic = [
    "window.a: " + typeof window.a,
    "window.b: " + typeof window.b,
    "window.c: " + typeof window.c,
    "window.f: " + typeof window.f,
  ];
</script>
<script type="module">
  var m = 1;
  window.mod = ["window.m: " + typeof window.m];
</script>`, { filename: "g1-global-var.html", collapsed: true }),
      code("text", `классический скрипт:
  window.a: number
  window.b: undefined
  window.c: undefined
  window.f: function
модуль:
  window.m: undefined`, { filename: "вывод Chromium 141" }),

      h("Типы данных"),
      p("Стандарт описывает восемь типов. Замер `typeof` для значений (Node.js 22.22.0):"),
      code("js", `const values = [
  ["undefined", undefined],
  ["null", null],
  ["true", true],
  ["42", 42],
  ["NaN", NaN],
  ["10n", 10n],
  ['"текст"', "текст"],
  ["Symbol()", Symbol()],
  ["{}", {}],
  ["[]", []],
  ["() => 1", () => 1],
  ["new Date()", new Date(0)],
  ["/x/", /x/],
  ["class A {}", class A {}],
];
for (const [label, v] of values) {
  console.log(label.padEnd(12), typeof v);
}`, { filename: "v2-types.mjs" }),
      code("text", `undefined    undefined
null         object
true         boolean
42           number
NaN          number
10n          bigint
"текст"      string
Symbol()     symbol
{}           object
[]           object
() => 1      function
new Date()   object
/x/          object
class A {}   function`, { filename: "вывод Node.js 22.22.0" }),
      table(
        ["Тип", "Примеры", "Заметка"],
        [
          ["`undefined`", "`undefined`", "Значение «ничего не присвоено»: непроинициализированная переменная, отсутствующее свойство, функция без `return`"],
          ["`null`", "`null`", "Явное «значения нет»; `typeof null` — `\"object\"` (историческая ошибка)"],
          ["`boolean`", "`true`, `false`", "—"],
          ["`number`", "`42`, `3.14`, `NaN`, `Infinity`", "64-битное число с плавающей точкой (IEEE 754)"],
          ["`bigint`", "`10n`", "Целые произвольной длины; не смешиваются с `number`"],
          ["`string`", "`\"текст\"`", "Неизменяемая последовательность кодовых единиц UTF-16"],
          ["`symbol`", "`Symbol(\"id\")`", "Уникальное значение, обычно ключ свойства"],
          ["`object`", "`{}`, `[]`, функции, `Date`, `Map`", "Всё остальное; у функций `typeof` — `\"function\"`, но это тоже объект"],
        ],
        "Восемь типов JavaScript",
      ),
      warn("`typeof null` возвращает `\"object\"`, а `typeof` массива — тоже `\"object\"`. Для `null` проверяйте `value === null`, для массива — `Array.isArray(value)`."),

      h("Числа: `number`"),
      p("Все обычные числа — 64-битные двоичные числа с плавающей точкой (IEEE 754). Отсюда три группы эффектов; замер (Node.js 22.22.0):"),
      code("js", `console.log(0.1 + 0.2);
console.log(0.1 + 0.2 === 0.3);
console.log(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON);
console.log(Number.MAX_SAFE_INTEGER);
console.log(Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2);
console.log(2 ** 53 + 1);
console.log(9007199254740993n + 1n);
console.log(NaN === NaN, Object.is(NaN, NaN), Number.isNaN(NaN));
console.log(0 === -0, Object.is(0, -0), 1 / -0);
console.log(5 / 0, -5 / 0, 0 / 0);
console.log((1234.5678).toFixed(2), 1.005.toFixed(2));
console.log(typeof 10n, 10n + 5n, typeof (10n * 2n));
try {
  console.log(10n + 5);
} catch (e) {
  console.log(e.name + ": " + e.message);
}
console.log(Number("12px"), parseInt("12px"), Number(""), Number(" 7 "), Number(null), Number(undefined));`, { filename: "v3-numbers.mjs", lineNumbers: true }),
      code("text", `0.30000000000000004
false
true
9007199254740991
true
9007199254740992
9007199254740994n
false true true
true false -Infinity
Infinity -Infinity NaN
1234.57 1.00
bigint 15n bigint
TypeError: Cannot mix BigInt and other types, use explicit conversions
NaN 12 0 7 0 NaN`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Дробные значения неточны.** `0.1` и `0.2` не представляются в двоичной системе точно, поэтому `0.1 + 0.2` — `0.30000000000000004`. Сравнивайте с допуском (`Math.abs(a - b) < Number.EPSILON`) или считайте в целых (копейки).",
        "**Целые точны до `Number.MAX_SAFE_INTEGER` (9007199254740991).** Дальше соседние целые сливаются: `Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2` — `true`.",
        "**Особые значения.** `NaN` (результат бессмысленного вычисления) не равен даже себе — проверяйте `Number.isNaN(x)` или `Object.is(x, NaN)`. Деление на ноль не бросает ошибку: `5 / 0` — `Infinity`. Есть `-0`: `0 === -0` — `true`, но `Object.is(0, -0)` — `false`.",
        "**Округление.** `1.005.toFixed(2)` дало `\"1.00\"`, потому что `1.005` хранится как чуть меньшее число; для денег не округляйте дроби — храните целые копейки.",
      ),

      h("Большие целые: `bigint`"),
      p("`BigInt` хранит целые любой длины: `9007199254740993n + 1n` дало `9007199254740994n` (то есть без потери точности). Типы не смешиваются: `10n + 5` — `TypeError: Cannot mix BigInt and other types, use explicit conversions`. Преобразуйте явно: `Number(10n) + 5` или `10n + BigInt(5)`. `BigInt` нужен для идентификаторов, больших счётчиков и точной целой арифметики; в `JSON.stringify` он без дополнительной обработки не сериализуется."),

      h("Строки: `string`"),
      p("Строки неизменяемы: методы вроде `toUpperCase()` возвращают **новую** строку. Внутри строка — последовательность 16-битных кодовых единиц UTF-16: символ вне основного плоскости (эмодзи) занимает две единицы. Замер:"),
      code("js", `const word = "кот";
console.log(word.toUpperCase(), word);       // исходная строка не изменилась
try {
  word[0] = "Т";
} catch (e) {
  console.log(e.name + ": " + e.message);
}

const smile = "😀";
console.log(smile.length, [...smile].length);
console.log(smile.codePointAt(0).toString(16), smile.charCodeAt(0).toString(16));
console.log("é" === "é", "é".normalize() === "é");
console.log("é".length, "é".length);
console.log("abc".at(-1), "abc".slice(1), "abc"[5]);
console.log(\`сумма: \${1 + 2}\`);
console.log("5" + 3, "5" - 3);`, { filename: "v4-strings.mjs" }),
      code("text", `КОТ кот
TypeError: Cannot assign to read only property '0' of string 'кот'
2 1
1f600 d83d
false true
2 1
c bc undefined
сумма: 3
53 2`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Неизменяемость.** Присваивание `word[0] = \"Т\"` в строгом режиме (модуль) бросает `TypeError: Cannot assign to read only property '0' of string 'кот'`; в нестрогом оно молча игнорируется.",
        "**Длина — это кодовые единицы,** а не «символы»: `\"😀\".length` — `2`, а `[...\"😀\"].length` — `1` (итерация идёт по кодовым точкам).",
        "**Составные символы.** `\"e\\u0301\"` (буква + знак ударения) выглядит как `é`, но `\"e\\u0301\" === \"é\"` — `false`; перед сравнением применяйте `normalize()`.",
        "**Шаблонные строки** (в обратных кавычках) подставляют выражения через `$` и фигурные скобки и поддерживают многострочность.",
        "**`+` с строкой — склейка:** `\"5\" + 3` — `\"53\"`, а `\"5\" - 3` — `2` (правила приведения — в теме об операторах).",
      ),

      h("`undefined` и `null`"),
      p("Оба означают «нет значения», но по-разному. `undefined` — значение, которое движок подставляет там, где вы ничего не задали (переменная без инициализации, отсутствующее свойство, параметр без аргумента, функция без `return`). `null` — значение, которое вы **присвоили сами**, чтобы показать «пусто». Нестрогое сравнение `null == undefined` — `true`, строгое `null === undefined` — `false`; различия и проверки `??` и `?.` разобраны в следующих темах."),

      h("Значение и ссылка"),
      p("Примитивы копируются целиком, объекты — по ссылке. Замер:"),
      code("js", `let a = 10;
let b = a;
b = 20;
console.log(a, b);                     // примитивы копируются по значению

const p = { x: 1, tags: ["a"] };
const q = p;                           // вторая ссылка на тот же объект
q.x = 2;
console.log(p.x, p === q);

const r = { ...p };                    // копия верхнего уровня
r.x = 3;
r.tags.push("b");                      // вложенный массив общий
console.log(p.x, p.tags);

const deep = structuredClone(p);
deep.tags.push("c");
console.log(p.tags, deep.tags);

console.log({} === {}, [1] === [1], "a" === "a");

const frozen = Object.freeze({ list: [1] });
frozen.list.push(2);                   // заморозка поверхностная
console.log(frozen.list, Object.isFrozen(frozen), Object.isFrozen(frozen.list));`, { filename: "v5-references.mjs", lineNumbers: true }),
      code("text", `10 20
2 true
2 [ 'a', 'b' ]
[ 'a', 'b' ] [ 'a', 'b', 'c' ]
false false true
[ 1, 2 ] true false`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Примитив:** `b = a; b = 20` не меняет `a` — получилась независимая копия.",
        "**Объект:** `q = p` создаёт второе имя, поэтому `q.x = 2` видно через `p`.",
        "**Поверхностная копия:** `{ ...p }` скопировала верхний уровень (изменение `r.x` не затронуло `p.x`), но вложенный массив `tags` остался общим — `p.tags` выросло.",
        "**Глубокая копия:** `structuredClone(p)` скопировала и вложенный массив. Она не копирует функции и некоторые особые объекты (бросает `DataCloneError`).",
        "**Сравнение по ссылке:** `{} === {}` и `[1] === [1]` — `false`; равными бывают только ссылки на один и тот же объект.",
        "**`Object.freeze` поверхностна:** замороженный объект нельзя менять, но `frozen.list.push(2)` сработала — вложенный массив не заморожен.",
      ),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const limit = 3;                 // константа: имя нельзя привязать к другому значению
let counter = 0;                 // переменная: значение можно менять
counter = counter + 1;

let title = "Курс";             // string
let price = 19.99;               // number
let big = 123n;                  // bigint
let ready = true;                // boolean
let nothing = null;              // null — «значения нет» (задано явно)
let unknown;                     // undefined — переменной ничего не присвоили
let id = Symbol("id");           // symbol
let list = [1, 2, 3];            // object (массив)

console.log(typeof limit, typeof counter, typeof list);`,
        [
          { line: 1, text: "`const` — привязку нельзя заменить; значение должно быть задано сразу." },
          { line: [2, 3], text: "`let` — значение можно менять. Присваивание — это `=`, оно не создаёт новую переменную." },
          { line: [5, 7], text: "Литералы трёх типов: `string` (в кавычках), `number` (с десятичной точкой допустимо), `bigint` (суффикс `n`)." },
          { line: [8, 10], text: "`boolean`; `null` — «пусто», заданное явно; переменная без значения — `undefined`." },
          { line: 11, text: "`Symbol(\"id\")` создаёт уникальное значение; описание нужно только для отладки." },
          { line: 12, text: "Массив — это объект, а не отдельный тип." },
          { line: 14, text: "`typeof` возвращает строку; для массива это `\"object\"`." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Типы значений</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #8884; padding: .3rem .7rem; text-align: left; }
  code { font-family: ui-monospace, monospace; }
</style>
<h1>Что вернёт <code>typeof</code></h1>
<table>
  <thead><tr><th>Значение</th><th>typeof</th></tr></thead>
  <tbody id="rows"></tbody>
</table>
<script type="module">
  const values = [
    ["undefined", undefined], ["null", null], ["true", true], ["42", 42],
    ["10n", 10n], ['"текст"', "текст"], ["Symbol()", Symbol()],
    ["{}", {}], ["[]", []], ["() => 1", () => 1],
  ];
  const rows = document.querySelector("#rows");
  for (const [label, value] of values) {
    const tr = rows.insertRow();
    tr.insertCell().textContent = label;
    tr.insertCell().textContent = typeof value;
  }
</script>`, { filename: "types-table.html", runnable: true, lineNumbers: true }),
      p("Страница строит таблицу значений и результатов `typeof`: `undefined` → `undefined`, `null` → **`object`**, массив и объект → `object`, стрелочная функция → `function`, `10n` → `bigint`."),
    ]),

    section("detailed-example", [
      p("Функция `kind(value)` возвращает **точное** имя вида значения: различает `null`, массив, дату, регулярное выражение, `Map`, `Set` и `NaN`, которые `typeof` сливает в `\"object\"` и `\"number\"`."),
      code("js", `export function kind(value) {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "number") return Number.isNaN(value) ? "nan" : "number";
  if (t !== "object") return t;                      // undefined, boolean, bigint, string, symbol, function
  const tag = Object.prototype.toString.call(value); // "[object Array]", "[object Date]" …
  return tag.slice(8, -1).toLowerCase();             // array, date, regexp, map, set, object …
}`, { filename: "kind.mjs", lineNumbers: true }),
      code("js", `import { kind } from "./kind.mjs";

const cases = [
  [undefined, "undefined"], [null, "null"], [true, "boolean"], [42, "number"], [NaN, "nan"],
  [Infinity, "number"], [10n, "bigint"], ["", "string"], [Symbol("s"), "symbol"],
  [() => 1, "function"], [[], "array"], [{}, "object"], [new Date(0), "date"],
  [/x/g, "regexp"], [new Map(), "map"], [new Set(), "set"], [Object.create(null), "object"],
];
let failed = 0;
for (const [value, expected] of cases) {
  const got = kind(value);
  if (got !== expected) { failed++; console.log("FAIL", String(value), "ожидалось", expected, "получено", got); }
}
console.log(failed === 0 ? \`Все \${cases.length} проверок пройдены\` : \`Провалено: \${failed}\`);
console.log(["null", "[]", "NaN", "10n", "new Date(0)"].map((s) => \`\${s} → \${kind(eval(s))}\`).join("\\n"));`, { filename: "kind-test.mjs", collapsed: true }),
      code("text", `Все 17 проверок пройдены
null → null
[] → array
NaN → nan
10n → bigint
new Date(0) → date`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Шаг функции `kind`", "Что делает", "Почему так"],
        [
          ["`value === null` → `\"null\"`", "Выделяет `null` до `typeof`", "`typeof null` возвращает `\"object\"`, поэтому `null` нужно отсеять первым"],
          ["`Number.isNaN(value)` → `\"nan\"`", "Отделяет `NaN` от чисел", "`typeof NaN` — `\"number\"`; `value !== value` — альтернативная проверка"],
          ["`t !== \"object\"` → `t`", "Возвращает `typeof` для всего, кроме объектов", "`undefined`, `boolean`, `bigint`, `string`, `symbol`, `function` определяются точно"],
          ["`Object.prototype.toString.call(value)`", "Читает внутренний тег объекта", "Даёт `[object Array]`, `[object Date]` и т. п.; работает для значений, у которых нет собственного `toString`"],
          ["`tag.slice(8, -1).toLowerCase()`", "Вырезает имя из `[object Имя]`", "Первые 8 символов — `\"[object \"`, последний — `\"]\"`"],
        ],
        "Разбор функции kind",
      ),
      ul(
        "Все 17 проверок прошли, в том числе `Object.create(null)` (объект без прототипа) → `\"object\"`.",
        "Для экземпляров собственных классов вернётся `\"object\"`; различать их надо через `instanceof` (тема о прототипах).",
        "`Object.prototype.toString.call(null)` в замере вернул `[object Null]`, но явная проверка `=== null` короче и не зависит от этой детали.",
      ),
    ]),

    section("internals", [
      h("Как хранится `number`"),
      p("Формат IEEE 754 double: 1 бит знака, 11 бит порядка и 52 бита мантиссы. Из этого следует, что точно представляются все целые от −(2⁵³−1) до 2⁵³−1 (эти границы — `Number.MIN_SAFE_INTEGER` и `Number.MAX_SAFE_INTEGER`), а дробные только если знаменатель — степень двойки: `0.5`, `0.25`, `0.75` точны (замер: `0.5 + 0.25 === 0.75` — `true`), а `0.1`, `0.2`, `0.3` — нет. Движки оптимизируют внутреннее представление целых, но снаружи поведение всегда соответствует `double`."),
      h("Привязки и области видимости"),
      p("Объявление создаёт **привязку** в записи окружения текущей области. У `const` привязка неизменяема, у `let` — изменяема. Объект при этом лежит отдельно (в куче), а привязка хранит ссылку. Поэтому `const` защищает привязку, а не объект: тело объекта — отдельная сущность со своими свойствами."),
      h("Почему примитивы «неизменяемы»"),
      p("Нельзя изменить число `5` или строку `\"кот\"` — можно только получить другое значение. Метод `\"кот\".toUpperCase()` возвращает новую строку, исходная не меняется (замер: `КОТ кот`). Кажущиеся «методы у примитивов» работают так: движок временно оборачивает примитив в объект-обёртку (`String`, `Number`) только на время обращения к свойству."),
      h("Что копирует `structuredClone`"),
      p("`structuredClone` реализует алгоритм структурного клонирования из HTML Standard: копирует вложенные объекты, массивы, `Date`, `Map`, `Set`, `RegExp`, сохраняет циклические ссылки. Функции клонировать нельзя (замер: `DataCloneError`), прототипы собственных классов не сохраняются (замер: `structuredClone(new A()) instanceof A` — `false`, получился обычный объект), а циклические ссылки сохраняются."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Считать `const` неизменяемостью"),
      p("`const arr = []; arr.push(1)` работает. `const` не запрещает менять содержимое объекта. Для защиты содержимого нужны `Object.freeze` (поверхностно) или иммутабельный стиль обновления (создавать новые объекты)."),
      h("Ошибка 2. Проверять `null` через `typeof`"),
      wrongRight(
        "js",
        {
          code: `
            if (typeof value === "object") {
              value.name;            // упадёт, если value === null
            }
          `,
          note: "`typeof null` — `\"object\"`: проверка пропускает `null`, и обращение к свойству бросает `TypeError`.",
        },
        {
          code: `
            if (value !== null && typeof value === "object") {
              value.name;
            }
          `,
          note: "Явно исключаем `null` перед работой со свойствами.",
        },
      ),
      h("Ошибка 3. Сравнивать дробные числа через `===`"),
      p("`0.1 + 0.2 === 0.3` — `false` (замер). Сравнивайте с допуском или переходите на целые (например, копейки вместо рублей)."),
      h("Ошибка 4. Сравнивать с `NaN` напрямую"),
      p("`x === NaN` всегда `false`, даже при `x = NaN`. Используйте `Number.isNaN(x)`."),
      h("Ошибка 5. Считать копию объекта через присваивание"),
      p("`const copy = original` не копирует объект: это вторая ссылка. Изменение `copy` меняет `original` (замер: `q.x = 2` → `p.x` стал `2`)."),
      h("Ошибка 6. Думать, что спред копирует глубоко"),
      p("`{ ...p }` скопировала только верхний уровень: `r.tags.push(\"b\")` изменило и `p.tags` (замер). Для глубины используйте `structuredClone` или копируйте вложенные структуры по месту."),
      h("Ошибка 7. Смешивать `bigint` и `number`"),
      p("`10n + 5` — `TypeError: Cannot mix BigInt and other types, use explicit conversions`. Приводите типы явно и не переводите `bigint` в `number` без проверки диапазона. Кроме того, `JSON.stringify({ n: 10n })` бросает `TypeError: Do not know how to serialize a BigInt` (замер)."),
      h("Ошибка 8. Использовать длину строки как число символов"),
      p("`\"😀\".length` — `2`. Для подсчёта видимых символов нужны `[...str]` (кодовые точки) или `Intl.Segmenter` (графемы)."),
    ]),

    section("antipatterns", [
      ul(
        "**`var` в новом коде** и объявление переменных на верхнем уровне классического скрипта (они становятся свойствами `window`).",
        "**Один `let` на все случаи:** переменная, которой не нужно менять значение, должна быть `const`.",
        "**Переиспользование одной переменной для разных типов** (`let data = \"\"` → потом `data = []`).",
        "**Мутация аргументов функции:** функция меняет переданный объект и тем самым создаёт скрытое влияние на вызывающий код.",
        "**Деньги в `number` с дробной частью:** копить ошибку `0.1 + 0.2`, вместо того чтобы хранить целые копейки.",
        "**`new String(\"x\")`, `new Number(1)`, `new Boolean(false)`:** объекты-обёртки ведут себя иначе, чем примитивы (`new Boolean(false)` в условии истинен).",
        "**Магические значения `null`/`undefined`/`\"\"` для разных смыслов** без договорённости в коде.",
        "**Имена из одной буквы** вне коротких циклов и стрелочных функций.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**По умолчанию — `const`,** `let` — только когда значение меняется; `var` не используйте.",
        "**Объявляйте переменные там, где они нужны,** и с минимальной областью видимости.",
        "**Проверяйте `null`/`undefined` явно:** `value === null`, `value === undefined` или `value == null` (оба сразу — осознанно).",
        "**Для массивов — `Array.isArray`,** для `NaN` — `Number.isNaN`, для точного вида значения — функция наподобие `kind`.",
        "**Деньги и точные суммы — целые** (копейки) или `bigint`/десятичная библиотека, не `number` с дробью.",
        "**Копируйте осознанно:** `{ ...obj }`/`[...arr]` для верхнего уровня, `structuredClone` — для глубины.",
        "**Не мутируйте входные данные:** возвращайте новые объекты (`{ ...user, tags: [...user.tags, tag] }`).",
        "**Используйте понятные имена,** отражающие смысл (`priceInCents`), и единый стиль (`camelCase`).",
      ),
      tip("Если сомневаетесь, что вернёт выражение, проверьте его в консоли DevTools: `typeof`, `Number.isNaN`, `Object.is`, `structuredClone` дают ответы за секунды."),
    ]),

    section("edge-cases", [
      h("`typeof` необъявленной и «мёртвой» переменной"),
      p("`typeof undeclared` — `\"undefined\"`, но `typeof late` до строки `let late` внутри той же области бросает `ReferenceError` (временная мёртвая зона)."),
      h("`-0` и `Object.is`"),
      p("`0 === -0` — `true`, но `1 / -0` — `-Infinity`, а `Object.is(0, -0)` — `false` (замер). Знак нуля важен в математике и анимациях; в остальных случаях различие не заметно."),
      h("Сравнение больших чисел"),
      p("`2 ** 53 + 1` дало `9007199254740992`: число `2**53 + 1` не представляется точно, результат округляется (замер)."),
      h("`Number(\"\")` и `Number(null)`"),
      p("`Number(\"\")` и `Number(null)` — `0`, `Number(undefined)` — `NaN`, `Number(\"12px\")` — `NaN`, а `parseInt(\"12px\")` — `12` (замер). Преобразования подробно — в теме о приведении типов."),
      h("Заморозка и режимы"),
      p("Запись в замороженный объект в строгом режиме бросает `TypeError`, в нестрогом молча игнорируется. Модуль строгий, поэтому в замере ошибка видна."),
      h("Глобальные имена и `let`"),
      p("`let`/`const` верхнего уровня классического скрипта не становятся свойствами `window`, но видны **всем** скриптам страницы через общую глобальную область; повторное объявление одного имени в другом скрипте даст `SyntaxError`."),
    ]),

    section("related", [
      ul(
        "[Что такое JavaScript](/learn/js/what-is-js) — среды, режимы и способы загрузки кода.",
        "[Анатомия документа](/learn/html/document-anatomy) — `meta charset` и то, как байты файла превращаются в символы строк.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Мутация аргумента и неточные деньги",
          code: `
            var total = 0;
            function addItem(cart, price) {
              cart.items.push(price);      // меняем переданный объект
              total = total + price;       // 0.1 + 0.2 → 0.30000000000000004
              return cart;
            }
          `,
          note: "`var` создаёт глобальное свойство, аргумент мутируется, дробные суммы накапливают ошибку.",
        },
        {
          title: "Неизменяемое обновление и целые копейки",
          code: `
            function addItem(cart, priceInCents) {
              return {
                ...cart,
                items: [...cart.items, priceInCents],
                totalInCents: cart.totalInCents + priceInCents,
              };
            }
          `,
          note: "Входной объект не меняется, суммы целые, переменных на верхнем уровне нет.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.variables-types.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код, скажите, что напечатает каждая строка `console.log`, и объясните каждый результат."),
        code("js", `let a = "5";
let b = a;
b += 1;
console.log(a, b, typeof b);

const o = { n: 1 };
const o2 = o;
o2.n++;
console.log(o.n);

console.log(typeof null, typeof undefined, typeof NaN, typeof [], typeof function () {});
console.log(0.1 + 0.2 === 0.3, 0.5 + 0.25 === 0.75);`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["`+=` со строкой — склейка.", "Объект передаётся по ссылке."],
      checks: ["Четыре строки вывода", "Объяснена склейка строки", "Объяснено разделение ссылки", "Объяснено `0.1 + 0.2`"],
      solution: [
        code("text", `5 51 string
2
object undefined number object function
false true`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "`b += 1` с `b = \"5\"` — склейка: `\"51\"`; `a` остался `\"5\"` (строки неизменяемы и копируются по значению); `typeof b` — `string`.",
          "`o2` и `o` — одна ссылка, поэтому `o2.n++` изменило `o.n`: `2`.",
          "`typeof null` — `object`; `typeof NaN` — `number`; массив — `object`; функция — `function`.",
          "`0.1 + 0.2` не равно `0.3` из-за двоичного представления, а `0.5 + 0.25` точно равно `0.75` (знаменатели — степени двойки).",
        ),
      ],
    }),
    exercise({
      id: "js.variables-types.ex2",
      title: "Функция не должна менять аргумент",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Функция `addTagBad(user, tag)` добавляет тег и **изменяет** переданный объект. Перепишите её как `addTag(user, tag)`, которая возвращает новый объект и не трогает исходный (в том числе вложенный массив `tags`)."),
      ],
      hints: ["Что копирует `{ ...user }`?", "Нужен новый массив тегов."],
      checks: ["Возвращается новый объект", "Исходный `tags` не меняется", "Новый `tags` — другой массив"],
      solution: [
        code("js", `const original = { name: "Аня", tags: ["js"] };

// Было: функция меняет переданный объект
function addTagBad(user, tag) {
  user.tags.push(tag);
  return user;
}

// Стало: новый объект, исходный не меняется
function addTag(user, tag) {
  return { ...user, tags: [...user.tags, tag] };
}

const t = addTag(original, "css");
console.log(original.tags, t.tags, original === t, original.tags === t.tags);

const bad = addTagBad({ name: "Б", tags: [] }, "x");
console.log(bad.tags);`, { filename: "x2-addtag.mjs" }),
        code("text", `[ 'js' ] [ 'js', 'css' ] false false
[ 'x' ]`, { filename: "вывод Node.js 22.22.0" }),
        p("`[...user.tags, tag]` создаёт новый массив; `{ ...user, tags: … }` — новый объект с заменённым свойством. Исходный `original.tags` остался `['js']`, ссылки различны (`false false`)."),
      ],
    }),
    exercise({
      id: "js.variables-types.ex3",
      title: "Глубокая заморозка",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("`Object.freeze` замораживает только верхний уровень. Напишите `deepFreeze(value)`, которая замораживает объект **рекурсивно** (включая вложенные объекты и массивы) и безопасно обходит примитивы. После заморозки запись в `config.api.url` и `config.api.retries.push(3)` должны завершаться ошибкой."),
      ],
      hints: ["Как перечислить все собственные свойства, включая символьные?", "Что делать с примитивами и `null`?"],
      checks: ["Замораживает вложенные объекты", "Не падает на примитивах и `null`", "Проверка `Object.isFrozen` для вложенных уровней"],
      solution: [
        code("js", `export function deepFreeze(value) {
  if (value === null || typeof value !== "object") return value;
  for (const key of Reflect.ownKeys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

const config = deepFreeze({ api: { url: "/v1", retries: [1, 2] }, debug: false });
try { config.api.url = "/v2"; } catch (e) { console.log("TypeError:", e.message); }
console.log(config.api.url);
try { config.api.retries.push(3); } catch (e) { console.log(e.name + ":", e.message); }
console.log(Object.isFrozen(config), Object.isFrozen(config.api), Object.isFrozen(config.api.retries));`, { filename: "x3-deepfreeze.mjs" }),
        code("text", `TypeError: Cannot assign to read only property 'url' of object '#<Object>'
/v1
TypeError: Cannot add property 2, object is not extensible
true true true`, { filename: "вывод Node.js 22.22.0" }),
        p("`Reflect.ownKeys` возвращает и строковые, и символьные ключи. Примитивы и `null` возвращаются как есть. Функция не защищена от циклических ссылок: для таких структур нужен список уже обработанных объектов (`WeakSet`)."),
      ],
    }),
  ],

  challenge: {
    id: "js.variables-types.challenge",
    title: "Точный определитель вида значения",
    scenario: [
      p("В логгере нужно печатать **вид** каждого значения, а `typeof` не различает `null`, массивы, даты и `NaN`. Напишите модуль `kind.mjs` с функцией `kind(value)`, возвращающей строку из фиксированного набора."),
    ],
    requirements: [
      "`kind(null)` → `\"null\"`, `kind(undefined)` → `\"undefined\"`",
      "`kind(NaN)` → `\"nan\"`, остальные числа (включая `Infinity`) → `\"number\"`",
      "`boolean`, `bigint`, `string`, `symbol`, `function` — как у `typeof`",
      "Для объектов — имя вида в нижнем регистре: `array`, `date`, `regexp`, `map`, `set`, иначе `object`",
      "Функция не бросает исключений для любых значений, включая `Object.create(null)`",
    ],
    constraints: [
      "Без `instanceof` (он ошибается для значений из других окон/контекстов)",
      "Без внешних библиотек",
    ],
    acceptance: [
      "Все 17 проверочных значений дают ожидаемые результаты",
      "`kind(Object.create(null))` — `\"object\"`",
      "`kind(Infinity)` — `\"number\"`, `kind(NaN)` — `\"nan\"`",
    ],
    hints: [
      "Что нужно проверить раньше, чем `typeof`?",
      "Как получить внутренний тег объекта, даже если у него нет собственного `toString`?",
    ],
    solution: [
      code("js", `export function kind(value) {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "number") return Number.isNaN(value) ? "nan" : "number";
  if (t !== "object") return t;                      // undefined, boolean, bigint, string, symbol, function
  const tag = Object.prototype.toString.call(value); // "[object Array]", "[object Date]" …
  return tag.slice(8, -1).toLowerCase();             // array, date, regexp, map, set, object …
}`, { filename: "kind.mjs", lineNumbers: true }),
      code("text", `Все 17 проверок пройдены
null → null
[] → array
NaN → nan
10n → bigint
new Date(0) → date`, { filename: "результат запуска тестов" }),
      p("`Object.prototype.toString.call(value)` вызывает базовый `toString` на любом объекте, поэтому работает и для `Object.create(null)`. Вариант с `instanceof Array` не подходит для массивов из другого фрейма: у каждого окна свой `Array`."),
    ],
  },

  interview: [
    iq("js.variables-types.i1", "basic", "Какие типы данных есть в JavaScript?", [
      p("Восемь: примитивы `undefined`, `null`, `boolean`, `number`, `bigint`, `string`, `symbol` и `object`. Массивы, функции, даты, регулярные выражения и т. д. — объекты."),
    ]),
    iq("js.variables-types.i2", "basic", "Чем отличаются `let`, `const` и `var`?", [
      ul(
        "`const` — нельзя привязать имя к другому значению; значение объекта менять можно.",
        "`let` — блочная область, значение меняется.",
        "`var` — область функции, на верхнем уровне классического скрипта создаёт свойство `window`; в новом коде не нужен.",
      ),
    ]),
    iq("js.variables-types.i3", "intermediate", "Почему `typeof null` — `\"object\"`?", [
      p("Это историческая ошибка ранних версий языка, которую сохранили ради совместимости. `null` — примитив. Проверять его надо через `value === null`."),
    ]),
    iq("js.variables-types.i4", "intermediate", "Чем отличается передача примитива и объекта?", [
      ul(
        "Примитив копируется: `b = a` создаёт независимую копию.",
        "Объект передаётся по ссылке: `q = p` — второе имя того же объекта, изменение видно через обе.",
        "`===` для объектов сравнивает ссылки: `{} === {}` — `false`.",
        "Строго говоря, JavaScript всегда передаёт значения; для объектов значением является ссылка.",
      ),
    ]),
    iq("js.variables-types.i5", "intermediate", "Почему `0.1 + 0.2 !== 0.3` и как с этим жить?", [
      ul(
        "Числа — 64-битные двоичные дроби; `0.1` и `0.2` точно не представляются, результат `0.30000000000000004`.",
        "Сравнивать с допуском (`Math.abs(a - b) < Number.EPSILON` для чисел порядка единицы).",
        "Деньги хранить целыми копейками или использовать десятичную арифметику/`bigint`.",
        "Форматировать вывод через `toFixed`/`Intl.NumberFormat`, не меняя исходные значения.",
      ),
    ]),
    iq("js.variables-types.i6", "advanced", "Что такое `NaN` и как его проверить?", [
      ul(
        "Значение типа `number`, результат вычисления без числового смысла (`0 / 0`, `Number(\"abc\")`).",
        "`NaN !== NaN`, поэтому `x === NaN` всегда `false`.",
        "Проверка: `Number.isNaN(x)` (без приведения типа) или `Object.is(x, NaN)`; глобальная `isNaN` сначала приводит аргумент к числу и поэтому для строки `\"abc\"` даёт `true` (замер), тогда как `Number.isNaN(\"abc\")` — `false`.",
      ),
    ]),
    iq("js.variables-types.i7", "engineering", "Как скопировать вложенный объект?", [
      ul(
        "Верхний уровень: `{ ...obj }`, `Object.assign({}, obj)`, `[...arr]` — вложенные объекты остаются общими.",
        "Глубоко: `structuredClone(obj)` — копирует вложенные объекты, `Date`, `Map`, `Set`, циклические ссылки; не копирует функции и теряет прототипы.",
        "Для собственных классов — явные методы копирования; для редких сложных случаев — специализированные библиотеки.",
        "Часто копирование не нужно: достаточно неизменяемого обновления только изменённой ветви.",
      ),
    ]),
    iq("js.variables-types.i8", "debugging", "Функция «случайно» меняет данные в другой части экрана. Как искать причину?", [
      ul(
        "Проверить, не получают ли два места одну и ту же ссылку на объект (`a === b`).",
        "Найти мутации: `push`, `splice`, присваивание полям аргумента.",
        "Временно заморозить подозрительный объект (`Object.freeze`) в строгом режиме — мутация станет `TypeError` с указанием места.",
        "Исправить: копировать на границе (`{ ...x }`, `structuredClone`) или переписать функцию на неизменяемое обновление.",
      ),
    ]),
  ],

  exam: [
    mcq("js.variables-types.e1", "foundation", "Что вернёт `typeof null`?", ["`\"null\"`", "`\"undefined\"`", "`\"object\"`", "`\"number\"`"], 2, "Историческая ошибка языка: `typeof null` возвращает `\"object\"`, хотя `null` — примитив."),
    mcq("js.variables-types.e2", "foundation", "Что произойдёт при `const x = 1; x = 2;`?", ["`TypeError: Assignment to constant variable.`", "`x` станет `2`", "`ReferenceError`", "Ничего, присваивание будет проигнорировано"], 0, "Присваивание `const` бросает `TypeError`: привязку имени нельзя заменить."),
    mcq("js.variables-types.e3", "intermediate", "Чему равно `0.1 + 0.2 === 0.3`?", ["`true`", "Ошибка", "`NaN`", "`false`"], 3, "`0.1 + 0.2` равно `0.30000000000000004`: двоичное представление дробей неточно."),
    mcq("js.variables-types.e4", "intermediate", "Что выведет код: `const a = { n: 1 }; const b = a; b.n = 2; console.log(a.n);`?", ["`1`", "`2`", "`undefined`", "Ошибка: `b` — константа"], 1, "`b` — вторая ссылка на тот же объект; `const` не запрещает менять его свойства."),
    mcq("js.variables-types.e5", "intermediate", "Что верно для `Object.freeze(obj)`? Выберите все.", ["Запрещает менять свойства верхнего уровня", "Замораживает вложенные объекты", "В строгом режиме запись бросает `TypeError`", "Заменяет `const`"], [0, 2], "Заморозка поверхностна: вложенный массив остаётся изменяемым (замер: `frozen.list.push(2)` сработал)."),
    mcq("js.variables-types.e6", "advanced", "Что даст `10n + 5`?", ["`15n`", "`15`", "`NaN`", "`TypeError: Cannot mix BigInt and other types, use explicit conversions`"], 3, "`bigint` и `number` не смешиваются в арифметике; нужно преобразовать один операнд явно."),
    open("js.variables-types.e7", "intermediate", "Чем `undefined` отличается от `null`? Когда какой использовать?", [
      ul(
        "`undefined` — значение, которое подставляет движок (нет инициализации, нет свойства, нет аргумента, нет `return`).",
        "`null` — значение, которое программист присваивает сам, чтобы обозначить «значения нет».",
        "`null == undefined` — `true`, `null === undefined` — `false`, `typeof null` — `\"object\"`, `typeof undefined` — `\"undefined\"`.",
        "В своём коде выберите одно соглашение (например, `null` для «пусто, но поле есть») и придерживайтесь его.",
      ),
    ], ["Названо различие по источнику", "Приведены сравнения", "Упомянуто соглашение"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.variables-types.m1", "intermediate", "Что вернёт `[...\"😀\"].length`?", ["`2`", "`0`", "`1`", "Ошибка"], 2, "Спред идёт по кодовым точкам; `\"😀\".length` — `2` (две кодовые единицы UTF-16), а спред даёт один элемент."),
    mcq("js.variables-types.m2", "advanced", "Что вернёт `Object.is(0, -0)`?", ["`true`", "`false`", "`NaN`", "`undefined`"], 1, "`0 === -0` — `true`, но `Object.is` различает знак нуля."),
    mcq("js.variables-types.m3", "advanced", "Что произойдёт с `var` на верхнем уровне классического скрипта в браузере?", ["Станет свойством `window`", "Останется локальной", "Бросит ошибку", "Станет `const`"], 0, "Замер Chromium 141: `window.a` — `number` для `var a`, но `undefined` для `let`/`const`/`var` в модуле."),
    open("js.variables-types.m4", "advanced", "Спроектируйте хранение денег в приложении интернет-магазина: тип данных, операции, отображение.", [
      ul(
        "Храним сумму целым числом копеек (`priceInCents`), а не дробью рублей.",
        "Арифметика — только над целыми (сложение, умножение на количество); для процентов — округление в одном месте по зафиксированному правилу.",
        "Для очень больших сумм или идентификаторов — `bigint`, с явным преобразованием на границах (JSON, API).",
        "Отображение — `Intl.NumberFormat` с валютой и локалью; исходные значения при этом не меняются.",
        "Тесты на граничные суммы и накопление ошибок.",
      ),
    ], ["Выбран тип хранения", "Описано округление", "Описано отображение", "Упомянуты тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.variables-types.f1", front: "Восемь типов JS?", back: "undefined, null, boolean, number, bigint, string, symbol — примитивы; object — всё остальное." },
    { id: "js.variables-types.f2", front: "const защищает?", back: "Привязку имени, не содержимое объекта: `const a = []; a.push(1)` работает." },
    { id: "js.variables-types.f3", front: "typeof null?", back: "\"object\" — историческая ошибка; проверяйте `=== null`." },
    { id: "js.variables-types.f4", front: "0.1 + 0.2?", back: "0.30000000000000004: двоичные дроби неточны; деньги — целые копейки." },
    { id: "js.variables-types.f5", front: "Копия объекта?", back: "`{ ...o }` — верхний уровень; `structuredClone(o)` — вся глубина; `q = p` — не копия." },
    { id: "js.variables-types.f6", front: "NaN?", back: "number; `NaN !== NaN`; проверка — `Number.isNaN(x)` или `Object.is`." },
    { id: "js.variables-types.f7", front: "Длина строки?", back: "Кодовые единицы UTF-16: `\"😀\".length === 2`, `[...\"😀\"].length === 1`." },
  ],

  sources: [
    { title: "ECMAScript Language Specification: ECMAScript Data Types and Values", url: "https://tc39.es/ecma262/#sec-ecmascript-data-types-and-values", publisher: "ECMA" },
    { title: "ECMAScript Language Specification: The Number Type", url: "https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type", publisher: "ECMA" },
    { title: "HTML Standard: Safe passing of structured data (structuredClone)", url: "https://html.spec.whatwg.org/multipage/structured-data.html", publisher: "WHATWG" },
    { title: "MDN: JavaScript data types and data structures", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures", publisher: "MDN" },
    { title: "MDN: let", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let", publisher: "MDN" },
    { title: "MDN: const", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const", publisher: "MDN" },
    { title: "MDN: Number.MAX_SAFE_INTEGER", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER", publisher: "MDN" },
    { title: "MDN: BigInt", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt", publisher: "MDN" },
    { title: "MDN: Object.freeze()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze", publisher: "MDN" },
  ],
};
