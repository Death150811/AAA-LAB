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
  steps,
  table,
  tip,
  ul,
  wrongRight,
} from "../../dsl";

export const controlFlow: Topic = {
  id: "js.control-flow",
  slug: "control-flow",
  domain: "js",
  module: "language",
  title: "Управляющие конструкции: условия и циклы",
  titleEn: "Control flow: conditions and loops",
  summary:
    "Управляющие конструкции решают, какие строки выполнятся и сколько раз. Тема разбирает `if`/`else`, тернарный оператор и `switch` (строгое сравнение, «проваливание», общая область видимости веток), циклы `for`, `while`, `do…while`, `for…of` и `for…in` (и почему `for…in` по массиву даёт строковые ключи вместе с унаследованными), выходы `break`, `continue` и метки, ранние возвраты вместо вложенных условий и то, чем `for…of` отличается от `forEach` (прервать нельзя, `await` внутри не ждёт). Все результаты получены замерами в Node.js 22 и Chromium 141.",
  minutes: 50,
  prerequisites: ["js.operators-coercion"],
  tags: ["if", "else", "switch", "for", "while", "do while", "for of", "for in", "break", "continue", "label", "guard clause", "ternary", "forEach", "цикл", "условие"],
  keyConcepts: [
    { term: "Условие проверяет истинность, а не `true`", text: "`if (x)` приводит `x` к логическому значению: `0`, `\"\"`, `null`, `NaN` — ложные, `[]`, `\"0\"` — истинные. Для пустого массива проверяйте `length`." },
    { term: "`switch` сравнивает строго и проваливается", text: "Ветки сравниваются через `===` (`describe(\"200\")` не попал в `case 200`), а без `break` выполнение идёт в следующую ветку (замер: `fall(1)` → `один → два → три`)." },
    { term: "`for…of` — по значениям, `for…in` — по ключам", text: "`for…of` обходит итерируемое (массив, строку, `Map`); `for…in` перебирает перечислимые строковые ключи, включая унаследованные (замер: `own`, `inherited`)." },
    { term: "`let` в заголовке цикла создаёт новую переменную на итерацию", text: "Замеры: колбэки, созданные в `for (var i…)`, вернули `[3, 3, 3]`, а в `for (let j…)` — `[0, 1, 2]`." },
    { term: "`forEach` нельзя прервать и нельзя «подождать»", text: "`return` в колбэке завершает только этот вызов; `async`-колбэки `forEach` не ожидаются. Для раннего выхода — `for…of`, `some`, `find`." },
  ],
  sections: [
    section("definition", [
      def("Управляющая конструкция", "Оператор языка, определяющий порядок выполнения других операторов: условие (`if`, `switch`), цикл (`for`, `while`), переход (`break`, `continue`, `return`, `throw`).", "control flow statement"),
      def("Блок", "Фигурные скобки, объединяющие операторы в один. Для `let`/`const` блок — область видимости.", "block statement"),
      def("Условный оператор `if`", "Выполняет ветку, если условие после приведения к логическому значению истинно; необязательные `else if` и `else` задают альтернативы.", "if statement"),
      def("`switch`", "Выбор ветки по значению выражения: сравнение строгое (`===`), выполнение начинается с совпавшей ветки и идёт дальше, пока не встретится `break`, `return` или конец.", "switch statement"),
      def("Цикл", "Конструкция, повторяющая тело, пока условие истинно (`while`, `for`) или пока есть элементы (`for…of`).", "loop"),
      def("`break` и `continue`", "`break` завершает цикл (или `switch`); `continue` переходит к следующей итерации. Метка позволяет адресовать внешний цикл.", "break / continue"),
      def("Ранний возврат (guard clause)", "Проверка в начале функции, которая сразу завершает её (`return`/`throw`) при недопустимых или тривиальных данных, чтобы основной код не вкладывался в условия.", "guard clause / early return"),
      def("Итерируемый объект", "Значение, поддерживающее протокол итерации (`Symbol.iterator`): массив, строка, `Map`, `Set`, генератор. Обычный объект итерируемым не является.", "iterable"),
    ]),

    section("why", [
      h("Ветвления и повторения — основа любой программы"),
      p("Все остальные темы курса — функции, объекты, асинхронность — строятся из последовательности, выбора и повторения. Ошибки в управлении потоком проявляются как «иногда не работает» (пропущенный `break` в `switch`), «работает не для всех» (`if (items)` для пустого массива), «все колбэки видят одно и то же» (`var` в цикле) и «страница зависла» (условие цикла никогда не станет ложным)."),
      ul(
        "**Читаемость:** вложенность из пяти уровней `if` — главный признак кода, который боятся менять; ранние возвраты делают логику плоской.",
        "**Корректность:** понимание областей видимости переменных цикла, строгого сравнения в `switch` и семантики `forEach` убирает целые классы ошибок.",
        "**Производительность:** своевременный `break`, `return`, `some`/`find` избавляют от лишней работы над данными.",
        "**Основа для следующих тем:** итерация (`for…of`) лежит в основе деструктуризации, итераторов, генераторов и `for await…of`.",
      ),
      insight("Хороший код управления потоком **не вкладывается глубоко**: сначала обработайте исключительные случаи и уйдите из функции, потом пишите «счастливый путь» без отступов."),
    ]),

    section("mental-model", [
      p("Представьте **железнодорожную сортировочную станцию**. Поезд (поток выполнения) идёт по пути вниз по тексту. Стрелка (`if`) направляет его по одной из веток; стрелка с несколькими выходами (`switch`) направляет его на нужную колею, но если вы не поставили упор (`break`), поезд едет дальше на следующую. Кольцевой путь (цикл) возвращает поезд на начало, пока светофор (условие) разрешает. Аварийные съезды (`break`, `continue`, `return`) выводят поезд из кольца или пропускают круг, а **метка** — это название конкретного кольца, если колец несколько."),
      table(
        ["Задача", "Конструкция", "Заметка"],
        [
          ["Выбрать одно из двух", "`if`/`else`, тернарный `? :`", "Тернарный — для выражений, `if` — для операторов"],
          ["Выбрать по набору значений", "`switch` или объект-таблица", "`switch` сравнивает строго; для соответствия «ключ → значение» часто удобнее объект"],
          ["Повторить заданное число раз", "`for (let i…)`", "Счётчик нужен, например, для индексов"],
          ["Обойти элементы коллекции", "`for…of`", "Работает с массивами, строками, `Map`, `Set`; можно `break`"],
          ["Повторять, пока условие истинно", "`while`, `do…while`", "`do…while` выполняется хотя бы раз"],
          ["Обойти ключи объекта", "`Object.keys/entries` + `for…of`", "`for…in` — только осознанно (унаследованные ключи)"],
          ["Выйти раньше", "`break`, `return`, `some`, `find`", "`forEach` прервать нельзя"],
        ],
        "Выбор конструкции",
      ),
    ]),

    section("technical", [
      h("Условия: `if`, `else`, тернарный оператор"),
      p("Условие в скобках приводится к логическому значению по таблице ложных значений (тема об операторах). Операторы `if`/`else` могут быть без фигурных скобок, но это провоцирует ошибки при добавлении строк, поэтому скобки ставят всегда. Тернарный оператор `условие ? а : б` — **выражение**: его можно присвоить переменной или вернуть."),
      code("js", `const temperature = 22;

if (temperature < 0) {
  console.log("мороз");
} else if (temperature < 25) {
  console.log("комфортно");
} else {
  console.log("жарко");
}

const label = temperature >= 18 ? "тепло" : "прохладно";

for (let i = 1; i <= 5; i++) {
  if (i === 2) continue;
  if (i === 4) break;
  console.log("шаг", i);
}

for (const letter of "abc") console.log(letter);

let tries = 0;
while (tries < 3) tries++;
console.log(label, tries);`, { filename: "syntax.mjs", lineNumbers: true }),
      code("text", `комфортно
шаг 1
шаг 3
a
b
c
тепло 3`, { filename: "вывод Node.js 22.22.0" }),
      note("`else if` — это не отдельная конструкция, а `else`, внутри которого стоит новый `if`. Поэтому цепочка проверяется сверху вниз, и срабатывает **первое** истинное условие."),

      h("`switch`"),
      p("`switch` вычисляет выражение один раз и ищет первую ветку `case` со строго равным значением. Если совпадения нет — выполняется `default` (его можно ставить в любом месте). Замер (Node.js 22.22.0):"),
      code("js", `function describe(code) {
  switch (code) {
    case 200:
    case 201:
      return "успех";                 // два case подряд — общий обработчик
    case 404:
      return "не найдено";
    default:
      return "другое";
  }
}
console.log(describe(200), describe(201), describe(404), describe("200"), describe(500));

// без break выполнение «проваливается» в следующую ветку
function fall(n) {
  const log = [];
  switch (n) {
    case 1: log.push("один");
    case 2: log.push("два");
    case 3: log.push("три"); break;
    default: log.push("иначе");
  }
  return log.join(" → ");
}
console.log(fall(1), "|", fall(2), "|", fall(3), "|", fall(9));

// switch (true): условия вместо значений
const grade = (score) => {
  switch (true) {
    case score >= 90: return "A";
    case score >= 75: return "B";
    default: return "C";
  }
};
console.log(grade(95), grade(80), grade(10));

// все case делят одну область видимости
try {
  new Function(\`switch (1) { case 1: let x = 1; break; case 2: let x = 2; break; }\`);
} catch (e) {
  console.log(e.name + ": " + e.message);
}`, { filename: "c2-switch.mjs", lineNumbers: true }),
      code("text", `успех успех не найдено другое другое
один → два → три | два → три | три | иначе
A B C
SyntaxError: Identifier 'x' has already been declared`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Строгое сравнение:** `describe(\"200\")` не попал в `case 200` и вернул `\"другое\"`.",
        "**Несколько значений — одна ветка:** `case 200:` и `case 201:` подряд без `break` делят обработчик (намеренное «проваливание»).",
        "**Случайное «проваливание»:** без `break` `fall(1)` выполнил все три ветки (`один → два → три`), `fall(2)` — две. Если проваливание задумано, напишите комментарий.",
        "**`switch (true)`** позволяет в ветках писать условия (`case score >= 90:`) — это допустимо, но чаще читается лучше цепочкой `if`.",
        "**Одна область видимости на все ветки:** два `let x` в разных `case` дают `SyntaxError: Identifier 'x' has already been declared`; оберните ветку в `{ … }`.",
        "**Табличная альтернатива:** для сопоставления «значение → результат» часто проще объект или `Map` (`const names = { 404: \"не найдено\" }`; доступ `names[code] ?? \"другое\"`).",
      ),

      h("Циклы `for`, `while`, `do…while`"),
      p("В заголовке `for (инициализация; условие; шаг)` объявление через `let` создаёт **новую привязку на каждую итерацию** — поэтому замыкания, созданные в теле, запоминают своё значение. С `var` привязка одна на весь цикл. Замер:"),
      code("js", `const withVar = [];
for (var i = 0; i < 3; i++) withVar.push(() => i);
console.log("var:", withVar.map((f) => f()));

const withLet = [];
for (let j = 0; j < 3; j++) withLet.push(() => j);
console.log("let:", withLet.map((f) => f()));

let n = 0;
while (n < 3) n++;
console.log("while:", n);

let k = 10;
do { k++; } while (k < 5);                  // тело выполнится хотя бы раз
console.log("do…while:", k);

for (let a = 0, b = 10; a < b; a += 4, b -= 1) console.log("a, b:", a, b);

const countdown = [];
for (let c = 3; c > 0; c--) countdown.push(c);
console.log(countdown);`, { filename: "c3-loops.mjs", lineNumbers: true }),
      code("text", `var: [ 3, 3, 3 ]
let: [ 0, 1, 2 ]
while: 3
do…while: 11
a, b: 0 10
a, b: 4 9
[ 3, 2, 1 ]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`var` против `let`:** функции, созданные в цикле с `var i`, после его окончания видят `i === 3`: все вернули `3`; с `let j` — `0, 1, 2`.",
        "**`while`** проверяет условие **до** тела; **`do…while`** — **после**, поэтому тело выполняется хотя бы раз (в замере `k` стало `11` при условии `k < 5`).",
        "**Несколько переменных:** `for (let a = 0, b = 10; a < b; a += 4, b -= 1)` — запятая разделяет объявления и шаги.",
        "**Бесконечный цикл:** условие, которое никогда не станет ложным, замораживает вкладку (однопоточность — тема о среде выполнения). Следите за тем, что в теле меняется переменная условия.",
      ),

      h("`for…of` и `for…in`"),
      p("`for…of` обходит **значения** итерируемого объекта; `for…in` перебирает **имена перечислимых свойств** (включая унаследованные). Замер:"),
      code("js", `const arr = ["a", "b"];
arr.extra = "x";                            // свойство массива, а не элемент

const values = [];
for (const v of arr) values.push(v);
console.log("for…of :", values);

const keys = [];
for (const k in arr) keys.push(k + ":" + typeof k);
console.log("for…in :", keys);

const parent = { inherited: 1 };
const child = Object.create(parent);
child.own = 2;
const seen = [];
for (const k in child) seen.push(k);
console.log("for…in и наследование:", seen, Object.keys(child));

const chars = [];
for (const ch of "a😀") chars.push(ch);
console.log("строка по кодовым точкам:", chars);

for (const [i, v] of arr.entries()) console.log("entries:", i, v);
for (const [k, v] of new Map([["x", 1]])) console.log("Map:", k, v);
for (const [k, v] of Object.entries({ p: 1, q: 2 })) console.log("Object.entries:", k, v);

try {
  for (const x of { a: 1 }) console.log(x);
} catch (e) {
  console.log(e.name + ": " + e.message);
}`, { filename: "c4-forof-forin.mjs", lineNumbers: true }),
      code("text", `for…of : [ 'a', 'b' ]
for…in : [ '0:string', '1:string', 'extra:string' ]
for…in и наследование: [ 'own', 'inherited' ] [ 'own' ]
строка по кодовым точкам: [ 'a', '😀' ]
entries: 0 a
entries: 1 b
Map: x 1
Object.entries: p 1
Object.entries: q 2
TypeError: {(intermediate value)} is not iterable`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`for…in` по массиву** вернул ключи-**строки** (`'0'`, `'1'`) и добавленное свойство `extra`: для массивов он не подходит.",
        "**`for…in` и наследование:** по объекту `child` перебрал `own` и унаследованный `inherited`, тогда как `Object.keys(child)` — только `own`.",
        "**`for…of` по строке** идёт по кодовым точкам: `\"a😀\"` дал `['a', '😀']`, а не три элемента.",
        "**Объект не итерируется:** `for (const x of { a: 1 })` — `TypeError: {(intermediate value)} is not iterable`. Для ключей и пар используйте `Object.keys`, `Object.values`, `Object.entries`.",
        "**`entries()`** даёт пары `[индекс, значение]`: `for (const [i, v] of arr.entries())` — замена счётчика, когда нужен и индекс.",
      ),

      h("Выходы из цикла: `break`, `continue`, метки, `return`"),
      code("js", `const grid = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

// метка позволяет выйти из внешнего цикла
let found = null;
search: for (let r = 0; r < grid.length; r++) {
  for (let c = 0; c < grid[r].length; c++) {
    if (grid[r][c] === 5) {
      found = [r, c];
      break search;
    }
  }
}
console.log("найдено:", found);

// continue пропускает итерацию, break завершает цикл
const odds = [];
for (const x of [1, 2, 3, 4, 5, 6]) {
  if (x % 2 === 0) continue;
  if (x > 4) break;
  odds.push(x);
}
console.log(odds);

// forEach нельзя прервать: return только завершает вызов колбэка
const visited = [];
[1, 2, 3].forEach((x) => { if (x === 2) return; visited.push(x); });
console.log("forEach:", visited);

// для раннего выхода есть some / every / find
const calls = [];
const hasBig = [1, 5, 10, 20].some((x) => { calls.push(x); return x > 7; });
console.log("some:", hasBig, "просмотрено:", calls);`, { filename: "c5-exit.mjs", lineNumbers: true }),
      code("text", `найдено: [ 1, 1 ]
[ 1, 3 ]
forEach: [ 1, 3 ]
some: true просмотрено: [ 1, 5, 10 ]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`break`** завершает ближайший цикл или `switch`; **`continue`** переходит к следующей итерации (в `for` выполняется шаг и проверка условия).",
        "**Метка** (`search:`) перед внешним циклом позволяет `break search` завершить сразу оба цикла; в замере найдена пара `[1, 1]` для значения `5`.",
        "**`return` внутри функции** — самый чистый способ выйти из вложенных циклов: вынесите поиск в функцию.",
        "**`forEach`:** `return` внутри колбэка только завершает этот вызов (в замере пропущено `2`, остальные посещены). Для раннего выхода используйте `for…of`, `some`, `every`, `find`, `findIndex`: `some` остановилась на третьем элементе (`[1, 5, 10]`).",
      ),

      h("`forEach` и `await`"),
      p("`forEach` не знает про `Promise`: он вызывает колбэк и не ждёт результата. Замер порядка (Node.js 22.22.0):"),
      code("js", `const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = [];

async function viaForEach(items) {
  items.forEach(async (x) => { await sleep(10); log.push("forEach " + x); });
  log.push("после forEach");                // выполнится раньше всех элементов
}

async function viaForOf(items) {
  for (const x of items) { await sleep(10); log.push("for…of " + x); }
  log.push("после for…of");
}

await viaForEach([1, 2]);
await sleep(40);
await viaForOf([1, 2]);
console.log(log.join("\\n"));`, { filename: "c6-foreach-await.mjs", lineNumbers: true, collapsed: true }),
      code("text", `после forEach
forEach 1
forEach 2
for…of 1
for…of 2
после for…of`, { filename: "вывод Node.js 22.22.0" }),
      p("`«после forEach»` записано **раньше** обоих элементов, а в `for…of` с `await` порядок строго последовательный. Подробности (`Promise.all`, параллельный обход) — в темах об асинхронности."),

      h("Ранние возвраты вместо вложенности"),
      p("Если проверки недопустимых и тривиальных случаев вынести в начало функции, основной код перестаёт вкладываться в `if`. Поведение функций ниже идентично (проверено на пяти заказах):"),
      code("js", `// Было: вложенные условия
function shippingBad(order) {
  if (order) {
    if (order.items.length > 0) {
      if (!order.country || order.country === "RU") {
        if (order.total >= 3000) {
          return 0;
        } else {
          return 300;
        }
      } else {
        return 1500;
      }
    } else {
      return null;
    }
  } else {
    return null;
  }
}

// Стало: ранние возвраты (guard clauses)
function shipping(order) {
  if (!order || order.items.length === 0) return null;
  if (order.country && order.country !== "RU") return 1500;
  return order.total >= 3000 ? 0 : 300;
}

const orders = [
  null,
  { items: [], total: 0 },
  { items: [1], total: 5000 },
  { items: [1], total: 100 },
  { items: [1], total: 100, country: "KZ" },
];
for (const o of orders) console.log(JSON.stringify(o)?.padEnd(46), shippingBad(o), shipping(o), shippingBad(o) === shipping(o));`, { filename: "x2-guard.mjs", lineNumbers: true }),
      code("text", `null                                           null null true
{"items":[],"total":0}                         null null true
{"items":[1],"total":5000}                     0 0 true
{"items":[1],"total":100}                      300 300 true
{"items":[1],"total":100,"country":"KZ"}       1500 1500 true`, { filename: "вывод Node.js 22.22.0" }),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const temperature = 22;

if (temperature < 0) {
  console.log("мороз");
} else if (temperature < 25) {
  console.log("комфортно");
} else {
  console.log("жарко");
}

const label = temperature >= 18 ? "тепло" : "прохладно";

for (let i = 1; i <= 5; i++) {
  if (i === 2) continue;
  if (i === 4) break;
  console.log("шаг", i);
}

for (const letter of "abc") console.log(letter);

let tries = 0;
while (tries < 3) tries++;
console.log(label, tries);`,
        [
          { line: [3, 9], text: "Цепочка `if / else if / else`: проверяется сверху вниз, выполняется первая истинная ветка." },
          { line: 11, text: "Тернарный оператор — выражение, его результат присваивается константе." },
          { line: [13, 17], text: "Цикл со счётчиком: `let i = 1` — инициализация, `i <= 5` — условие (проверяется перед каждой итерацией), `i++` — шаг (после тела)." },
          { line: 14, text: "`continue` пропускает остаток тела и переходит к шагу `i++`." },
          { line: 15, text: "`break` завершает цикл; итерации 4 и 5 не выполняются." },
          { line: 19, text: "`for…of` по строке: переменная `letter` — отдельная привязка на каждую итерацию." },
          { line: [21, 22], text: "`while` без фигурных скобок: тело — один оператор `tries++`; скобки ставят всегда, здесь они опущены только для краткости." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Таблица умножения</title>
<style>
  body { font: 16px/1.4 system-ui, sans-serif; margin: 1.5rem; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #8884; padding: .25rem .6rem; text-align: right; }
  td.diag { background: #4f46e522; font-weight: 700; }
</style>
<h1>Таблица умножения</h1>
<table id="t"><caption>Диагональ — квадраты</caption></table>
<p id="status" role="status"></p>
<script type="module">
  const N = 9;
  const table = document.querySelector("#t");
  let diagonal = 0;

  for (let row = 1; row <= N; row++) {
    const tr = table.insertRow();
    for (let col = 1; col <= N; col++) {
      const td = tr.insertCell();
      td.textContent = row * col;
      if (row === col) {            // условие внутри вложенного цикла
        td.className = "diag";
        diagonal++;
      }
    }
  }
  document.querySelector("#status").textContent =
    \`Ячеек: \${table.querySelectorAll("td").length}, на диагонали: \${diagonal}\`;
</script>`, { filename: "mult-table.html", runnable: true, lineNumbers: true }),
      p("Два вложенных цикла создают сетку 9 × 9, а условие `row === col` отмечает диагональ. Замер в Chromium 141: 81 ячейка, 9 на диагонали, значения `1, 4, 9, 16, 25, 36, 49, 64, 81`."),
    ]),

    section("detailed-example", [
      p("Кодирование повторов (RLE): строка `aaabccdd` превращается в `a3b1c2d2`. Задача объединяет цикл `for…of` (по кодовым точкам — эмодзи не ломаются), условие с накоплением состояния, обработку граничных случаев (пустая строка, последний символ) и проверку ввода при декодировании."),
      code("js", `export function encode(text) {
  if (/\\d/.test(text)) throw new RangeError("Цифры в исходной строке не поддерживаются");
  let result = "";
  let current = null;
  let count = 0;
  for (const ch of text) {                    // по кодовым точкам, не по кодовым единицам
    if (ch === current) {
      count++;
    } else {
      if (current !== null) result += current + count;
      current = ch;
      count = 1;
    }
  }
  if (current !== null) result += current + count;
  return result;
}

export function decode(encoded) {
  let result = "";
  const parts = encoded.match(/(\\D)(\\d+)/gu) ?? [];
  if (parts.join("") !== encoded) throw new SyntaxError("Неверный формат: " + JSON.stringify(encoded));
  for (const part of parts) {
    const [ch] = part;
    const count = Number(part.slice(ch.length));
    result += ch.repeat(count);
  }
  return result;
}`, { filename: "rle.mjs", lineNumbers: true }),
      code("js", `import { encode, decode } from "./rle.mjs";

const cases = [
  ["", ""], ["a", "a1"], ["aaabccdd", "a3b1c2d2"], ["😀😀a", "😀2a1"], ["ababab", "a1b1a1b1a1b1"], ["ёё", "ё2"],
];
let failed = 0;
for (const [text, enc] of cases) {
  if (encode(text) !== enc) { failed++; console.log("FAIL encode", JSON.stringify(text), encode(text)); }
  if (decode(enc) !== text) { failed++; console.log("FAIL decode", JSON.stringify(enc), decode(enc)); }
}
const long = "x".repeat(12) + "y";
if (decode(encode(long)) !== long) { failed++; console.log("FAIL long"); }
for (const bad of ["a", "3", "a2b"]) {
  try { decode(bad); failed++; console.log("FAIL: нет ошибки для", bad); } catch (e) { if (!(e instanceof SyntaxError)) { failed++; console.log("FAIL тип ошибки", bad); } }
}
try { encode("a1"); failed++; console.log("FAIL: цифры не отвергнуты"); } catch (e) { if (!(e instanceof RangeError)) { failed++; console.log("FAIL тип ошибки"); } }
console.log(failed === 0 ? \`Все проверки пройдены (\${cases.length * 2 + 5})\` : \`Провалено: \${failed}\`);
console.log(encode("aaabccdd"), encode("😀😀a"), "x".repeat(12).length);`, { filename: "rle-test.mjs", collapsed: true }),
      code("text", `Все проверки пройдены (17)
a3b1c2d2 😀2a1 12`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает", "Почему так"],
        [
          ["`for (const ch of text)`", "Обходит строку по кодовым точкам", "Индексный цикл по `text[i]` разрезал бы эмодзи на две кодовые единицы (замер: `\"😀\".length` — `2`)"],
          ["`current = ch; count = 1;`", "Начинает новую серию", "Состояние (`current`, `count`) переживает итерации — это «аккумулятор» цикла"],
          ["`if (current !== null) result += …` после цикла", "Добавляет **последнюю** серию", "Серия записывается при смене символа, поэтому последняя ещё не записана — классическая ошибка «на единицу» (off-by-one)"],
          ["`encoded.match(/(\\D)(\\d+)/gu)`", "Разбивает на пары «символ + число»", "Флаг `u` заставляет `\\D` соответствовать кодовой точке целиком"],
          ["`parts.join(\"\") !== encoded`", "Проверяет, что вся строка разобрана", "Отсекает лишние символы: `\"a2b\"` не имеет числа после `b`"],
          ["`if (/\\d/.test(text)) throw new RangeError(…)`", "Отклоняет цифры в исходной строке", "Цифры нельзя отличить от счётчиков: формат однозначно декодируется только без них"],
        ],
        "Разбор кодирования повторов",
      ),
      ul(
        "Все 17 проверок прошли: пустая строка, один символ, эмодзи, кириллица, серия из 12 символов (счётчик из двух цифр), три некорректных кода и строка с цифрами.",
        "**Граничные случаи** — главное место ошибок в циклах: пустой ввод, один элемент, последний элемент, повтор на границе.",
      ),
    ]),

    section("internals", [
      h("Что на самом деле делает `for…of`"),
      p("`for (const x of iterable)` вызывает `iterable[Symbol.iterator]()`, получает итератор и на каждом шаге вызывает его метод `next()`, пока результат не станет `{ done: true }`. Если вы выходите из цикла (`break`, `return`, исключение), движок вызывает у итератора метод `return()` (если он есть), чтобы освободить ресурсы. Поэтому `for…of` работает с любым итерируемым значением — и не работает с обычным объектом (замер: `TypeError … is not iterable`). Подробно протокол итерации разобран в теме об итераторах и генераторах."),
      h("Область видимости цикла"),
      steps(
        [
          ["Инициализация", "`let i = 0` выполняется один раз и создаёт окружение цикла."],
          ["Проверка условия", "Перед каждой итерацией; если ложно — выход."],
          ["Копия привязки", "Для `let` движок создаёт **новое окружение** на каждую итерацию, копируя в него текущие значения переменных заголовка."],
          ["Тело", "Выполняется в новом окружении; замыкания запоминают именно его."],
          ["Шаг", "Выполняется над новой копией, затем снова проверка."],
        ],
        "Итерация `for (let …)`",
      ),
      p("Поэтому замер показал `[0, 1, 2]` для `let` и `[3, 3, 3]` для `var`: у `var` одна привязка на всю функцию, и к моменту вызова колбэков она уже равна `3`."),
      h("`for…in` и порядок ключей"),
      p("`for…in` перебирает перечислимые строковые свойства объекта и его цепочки прототипов. Целочисленные ключи идут по возрастанию, остальные — в порядке добавления (замер для `{ b, 2, a, 1 }`: `1, 2, b, a`); но полагаться на порядок в логике не стоит. Для собственных ключей используйте `Object.keys`."),
      h("Выражения и операторы"),
      p("`if`, `for`, `switch` — **операторы** (они не возвращают значений), поэтому их нельзя присвоить переменной; тернарный `? :` и логические операторы — **выражения**. Это объясняет, почему внутри шаблонной строки или аргумента функции допустим `?:`, но не `if`."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Забытый `break` в `switch`"),
      wrongRight(
        "js",
        {
          code: `
            switch (status) {
              case "new":
                label = "Новый";
              case "done":
                label = "Готово";    // для "new" выполнится и эта строка
                break;
            }
          `,
          note: "Без `break` ветка `new` «проваливается» в `done`: замер `fall(1)` → `один → два → три`.",
        },
        {
          code: `
            const labels = { new: "Новый", done: "Готово" };
            const label = labels[status] ?? "Неизвестно";
          `,
          note: "Таблица вместо `switch` исключает проваливание и короче.",
        },
      ),
      h("Ошибка 2. `var` в цикле с колбэками"),
      p("`for (var i = 0; i < 3; i++) fns.push(() => i)` — все функции вернут `3` (замер `[3, 3, 3]`). Используйте `let` или `for…of`."),
      h("Ошибка 3. `for…in` по массиву"),
      p("Ключи — строки (`'0'`, `'1'`), перебираются дополнительные свойства (замер: `extra`) и унаследованные. Для массивов — `for…of` или `forEach`."),
      h("Ошибка 4. Проверка пустого массива через `if (arr)`"),
      p("`[]` истинен. Проверяйте `arr.length === 0` (или `!arr.length`)."),
      h("Ошибка 5. `break` в `forEach`"),
      p("`return` в колбэке завершает только этот вызов (замер: `forEach` обошёл все элементы кроме пропущенного). Для раннего выхода — `for…of`, `some`, `find`."),
      h("Ошибка 6. `await` внутри `forEach`"),
      p("`forEach` не ждёт промисы: «после forEach» записано раньше всех элементов (замер). Используйте `for…of` с `await` или `Promise.all`."),
      h("Ошибка 7. Одна область видимости в `case`"),
      p("`let x` в двух ветках — `SyntaxError: Identifier 'x' has already been declared` (замер). Оборачивайте ветки в блоки: `case 1: { let x; … break; }`."),
      h("Ошибка 8. Ошибка «на единицу» и бесконечные циклы"),
      p("`i <= arr.length` вместо `<` читает несуществующий элемент `undefined`; не меняющаяся в теле переменная условия даёт бесконечный цикл. Проверяйте границы на пустых данных и на одном элементе."),
    ]),

    section("antipatterns", [
      ul(
        "**Вложенность из четырёх и более `if`:** используйте ранние возвраты, вынесение в функции, таблицы.",
        "**`if` без фигурных скобок** с последующим добавлением строк: вторая строка выполняется всегда.",
        "**`switch` без `break` и комментария,** когда проваливание задумано.",
        "**Присваивание вместо сравнения:** `if (x = 5)` присваивает и всегда истинно; используйте `===` (и линтер с `no-cond-assign`).",
        "**Изменение массива во время итерации по нему** (`splice` в `for…of`): порядок и индексы «съезжают».",
        "**Длинные цепочки `else if` по одному значению:** замените таблицей или `switch`.",
        "**Тернарные цепочки в несколько уровней:** `a ? b : c ? d : e` читаются хуже `if`.",
        "**Синхронные циклы на миллионы итераций в основном потоке:** страница замирает; разбивайте работу на части.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Всегда ставьте фигурные скобки** у `if`, `else`, `for`, `while`.",
        "**Начинайте функцию с проверок (ранние возвраты),** а «счастливый путь» оставляйте без вложенности.",
        "**Используйте `for…of`** для обхода значений, `for (let i…)` — когда нужен счётчик, `entries()` — когда нужны и индекс, и значение.",
        "**Не используйте `for…in` для массивов** и осторожно — для объектов (`Object.keys/entries` проще).",
        "**Для раннего выхода — `for…of`/`some`/`find`,** а не `forEach`.",
        "**Заменяйте `switch` таблицей,** когда он только сопоставляет значения; в `switch` всегда добавляйте `default` и явный `break`/`return`.",
        "**Выносите вложенные циклы с выходом по условию в функцию** и используйте `return` вместо меток.",
        "**Проверяйте границы:** пустой ввод, один элемент, последний элемент, граничные значения условий.",
      ),
      tip("Если в теле цикла приходится писать больше 10–15 строк или несколько уровней вложенности, вынесите тело в функцию с понятным именем — цикл останется читаемым «планом», а детали уйдут в функцию."),
    ]),

    section("edge-cases", [
      h("`switch` и тип"),
      p("`switch (\"1\")` не попадёт в `case 1`: сравнение строгое. Если значение приходит строкой (из формы, из URL), приведите его заранее или сравнивайте со строками."),
      h("`continue` в `do…while`"),
      p("В `do…while` после `continue` выполняется проверка условия, а не начало тела; если условие ложно, цикл завершается (замер: `do { m++; continue; } while (m < 5)` при `m = 10` — `m` стало `11`). Не используйте `continue` там, где это неочевидно."),
      h("Объявление функции или `let` в теле без блока"),
      p("`if (true) let y = 1;` — `SyntaxError: Lexical declaration cannot appear in a single-statement context` (замер): объявления `let`/`const` нельзя использовать как тело оператора без блока."),
      h("Пустые слоты массивов"),
      p("`for…of` и обычный `for` проходят по пропуску в массиве `[1, , 3]` как по `undefined` (замер: `1, undefined, 3`), а `forEach` пропускает пустой слот (`1, 3`). Подробно — в теме о массивах."),
      h("Изменение коллекции во время обхода"),
      p("Добавление элементов в массив во время `for…of` продлевает обход (замер: в `[1, 2]` при добавлении по одному элементу обход дошёл до `[1, 2, 11, 12]`); удаление смещает индексы. Безопасный подход — построить новый массив (`filter`, `map`) или обходить копию."),
      h("`label:` не для `goto`"),
      p("Метки в JavaScript применимы только с `break`/`continue` (и для блоков с `break`). Произвольный переход на метку невозможен."),
    ]),

    section("related", [
      ul(
        "[Операторы, приведение типов и равенство](/learn/js/operators-coercion) — истинность значений и сравнения, которые используют условия.",
        "[Переменные и типы данных](/learn/js/variables-types) — `let`, `const`, `var` и области видимости.",
        "[Что такое JavaScript](/learn/js/what-is-js) — однопоточность и блокирующие циклы.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Вложенность и всё в одной ветке",
          code: `
            function describe(user) {
              if (user) {
                if (user.active) {
                  if (user.roles.length > 0) {
                    return user.roles[0];
                  } else {
                    return "гость";
                  }
                } else {
                  return "заблокирован";
                }
              } else {
                return "нет пользователя";
              }
            }
          `,
          note: "Четыре уровня вложенности; чтобы понять результат, нужно держать в голове три условия.",
        },
        {
          title: "Ранние возвраты",
          code: `
            function describe(user) {
              if (!user) return "нет пользователя";
              if (!user.active) return "заблокирован";
              return user.roles[0] ?? "гость";
            }
          `,
          note: "Каждая строка закрывает один случай; поведение то же, вложенности нет.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.control-flow.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Скажите, что напечатает код, и объясните: почему в первом выводе одинаковые числа, что произойдёт с `continue` и `break` во втором и почему в `switch` печатаются три строки."),
        code("js", `const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i * 10);
}
console.log(fns.map((f) => f()));

const out = [];
for (let n = 0; n < 6; n++) {
  if (n % 2) continue;
  if (n > 3) break;
  out.push(n);
}
console.log(out);

switch (2) {
  case 1: console.log("один");
  case 2: console.log("два");
  case 3: console.log("три");
  default: console.log("иначе");
}`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Сколько привязок `i` создаёт `var` в заголовке цикла?", "Что делает `switch` после совпавшей ветки без `break`?"],
      checks: ["Объяснено `[30, 30, 30]`", "Объяснено `[0, 2]`", "Объяснено проваливание `switch`"],
      solution: [
        code("text", `[ 30, 30, 30 ]
[ 0, 2 ]
два
три
иначе`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "`var i` — одна привязка на весь цикл; к моменту вызова колбэков `i === 3`, поэтому `3 * 10` — три раза.",
          "Итерации: `0` — подходит, `1` — `continue` (нечётное), `2` — подходит, `3` — `continue`, `4` — `n > 3` → `break`. Результат `[0, 2]`.",
          "`switch (2)` попадает в `case 2` и, не встретив `break`, выполняет ещё `case 3` и `default`.",
        ),
      ],
    }),
    exercise({
      id: "js.control-flow.ex2",
      title: "Уберите вложенность",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Функция `shippingBad(order)` считает стоимость доставки через пять уровней вложенности. Перепишите её как `shipping(order)` с ранними возвратами так, чтобы результат совпал на всех заказах: нет заказа или пустой список → `null`; страна не пустая и не `RU` → `1500`; иначе сумма от 3000 → `0`, иначе `300`."),
      ],
      hints: ["Какие случаи можно закрыть первыми?", "Как свести две ветки с суммой к одному выражению?"],
      checks: ["Нет вложенности глубже одного уровня", "Результаты совпадают на пяти заказах", "Нет `else` после `return`"],
      solution: [
        code("js", `// Было: вложенные условия
function shippingBad(order) {
  if (order) {
    if (order.items.length > 0) {
      if (!order.country || order.country === "RU") {
        if (order.total >= 3000) {
          return 0;
        } else {
          return 300;
        }
      } else {
        return 1500;
      }
    } else {
      return null;
    }
  } else {
    return null;
  }
}

// Стало: ранние возвраты (guard clauses)
function shipping(order) {
  if (!order || order.items.length === 0) return null;
  if (order.country && order.country !== "RU") return 1500;
  return order.total >= 3000 ? 0 : 300;
}

const orders = [
  null,
  { items: [], total: 0 },
  { items: [1], total: 5000 },
  { items: [1], total: 100 },
  { items: [1], total: 100, country: "KZ" },
];
for (const o of orders) console.log(JSON.stringify(o)?.padEnd(46), shippingBad(o), shipping(o), shippingBad(o) === shipping(o));`, { filename: "x2-guard.mjs" }),
        code("text", `null                                           null null true
{"items":[],"total":0}                         null null true
{"items":[1],"total":5000}                     0 0 true
{"items":[1],"total":100}                      300 300 true
{"items":[1],"total":100,"country":"KZ"}       1500 1500 true`, { filename: "вывод Node.js 22.22.0" }),
        p("Первая проверка закрывает «нет данных», вторая — иностранные заказы, оставшийся случай выражается тернарным оператором. В последнем столбце вывода `true`: поведение совпало."),
      ],
    }),
    exercise({
      id: "js.control-flow.ex3",
      title: "Найти пару и выйти",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Напишите `findPair(numbers, target)`, которая возвращает индексы **первой** пары `[i, j]` (`i < j`), чья сумма равна `target`, или `null`. Функция должна завершаться сразу после нахождения пары, без меток и без `forEach`."),
      ],
      hints: ["Как выйти из двух циклов сразу, не используя метку?", "Откуда начинать внутренний цикл, чтобы не повторять пары?"],
      checks: ["Возвращает первую пару", "Не просматривает лишнее после нахождения", "Пустой массив и отсутствие пары → `null`"],
      solution: [
        code("js", `export function findPair(numbers, target) {
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      if (numbers[i] + numbers[j] === target) return [i, j];   // return завершает обе петли сразу
    }
  }
  return null;
}

console.log(findPair([2, 7, 11, 15], 9));
console.log(findPair([3, 2, 4], 6));
console.log(findPair([1, 2, 3], 100));
console.log(findPair([], 1));`, { filename: "x3-findpair.mjs" }),
        code("text", `[ 0, 1 ]
[ 1, 2 ]
null
null`, { filename: "вывод Node.js 22.22.0" }),
        p("`return` внутри вложенного цикла завершает функцию, а значит оба цикла. Внутренний цикл начинается с `i + 1`, чтобы пары не повторялись и элемент не складывался сам с собой. Сложность — O(n²); для больших данных используют `Map` (тема о коллекциях)."),
      ],
    }),
  ],

  challenge: {
    id: "js.control-flow.challenge",
    title: "Кодирование повторов (RLE)",
    scenario: [
      p("Для компактной передачи длинных повторяющихся строк нужен кодировщик: `aaabccdd` → `a3b1c2d2`. Напишите модуль `rle.mjs` с функциями `encode(text)` и `decode(encoded)`."),
    ],
    requirements: [
      "`encode(\"aaabccdd\")` → `\"a3b1c2d2\"`, `encode(\"\")` → `\"\"`, `encode(\"😀😀a\")` → `\"😀2a1\"`",
      "Счётчики могут быть многозначными: `\"x\".repeat(12)` → `\"x12\"`",
      "`decode(encode(s))` возвращает исходную строку для любой строки без цифр",
      "`encode` бросает `RangeError`, если в строке есть цифры; `decode` бросает `SyntaxError` для неверного формата (`\"a\"`, `\"3\"`, `\"a2b\"`)",
    ],
    constraints: [
      "Нельзя обходить строку индексами (`text[i]`) — эмодзи нужно сохранять целыми",
      "Без внешних библиотек",
    ],
    acceptance: [
      "Все 17 проверок из теста проходят",
      "Эмодзи кодируются как одна кодовая точка",
      "Последняя серия не теряется",
    ],
    hints: [
      "Какое состояние нужно хранить между итерациями?",
      "Когда записывать серию: при смене символа или в конце? Что с последней?",
      "Чем отличается `for…of` по строке от индексного цикла для эмодзи?",
    ],
    solution: [
      code("js", `export function encode(text) {
  if (/\\d/.test(text)) throw new RangeError("Цифры в исходной строке не поддерживаются");
  let result = "";
  let current = null;
  let count = 0;
  for (const ch of text) {                    // по кодовым точкам, не по кодовым единицам
    if (ch === current) {
      count++;
    } else {
      if (current !== null) result += current + count;
      current = ch;
      count = 1;
    }
  }
  if (current !== null) result += current + count;
  return result;
}

export function decode(encoded) {
  let result = "";
  const parts = encoded.match(/(\\D)(\\d+)/gu) ?? [];
  if (parts.join("") !== encoded) throw new SyntaxError("Неверный формат: " + JSON.stringify(encoded));
  for (const part of parts) {
    const [ch] = part;
    const count = Number(part.slice(ch.length));
    result += ch.repeat(count);
  }
  return result;
}`, { filename: "rle.mjs", lineNumbers: true }),
      code("text", `Все проверки пройдены (17)
a3b1c2d2 😀2a1 12`, { filename: "результат запуска тестов" }),
      p("Состояние (`current`, `count`) переживает итерации. Серия дописывается при смене символа, а последняя — **после** цикла. `decode` проверяет, что регулярное выражение разобрало всю строку (`parts.join(\"\") === encoded`)."),
    ],
  },

  interview: [
    iq("js.control-flow.i1", "basic", "Чем `while` отличается от `do…while`?", [
      p("`while` проверяет условие до тела, `do…while` — после, поэтому тело выполняется хотя бы один раз (замер: `do { k++ } while (k < 5)` при `k = 10` выполнил тело и дал `11`)."),
    ]),
    iq("js.control-flow.i2", "basic", "Чем `for…of` отличается от `for…in`?", [
      ul(
        "`for…of` обходит значения итерируемых объектов (массив, строка, `Map`, `Set`).",
        "`for…in` обходит перечислимые строковые ключи объекта, включая унаследованные.",
        "По массиву `for…in` даёт строки-индексы и лишние свойства — для массивов не используется.",
      ),
    ]),
    iq("js.control-flow.i3", "intermediate", "Что делает `switch` без `break` и как он сравнивает значения?", [
      ul(
        "Сравнивает строго (`===`): `\"200\"` не совпадёт с `case 200`.",
        "После совпавшей ветки выполнение «проваливается» в следующие, пока не встретит `break`/`return`.",
        "Проваливание иногда задумано (общий обработчик для нескольких `case`); тогда оно должно быть явным.",
      ),
    ]),
    iq("js.control-flow.i4", "intermediate", "Почему `forEach` нельзя прервать, и что использовать вместо?", [
      ul(
        "`forEach` вызывает колбэк для каждого элемента; `return` завершает только вызов колбэка, `break` недопустим.",
        "Для раннего выхода: `for…of` с `break`, `some`/`every` (останавливаются сами), `find`/`findIndex`.",
        "Async-колбэки `forEach` не ожидаются: используйте `for…of` + `await` или `Promise.all`.",
      ),
    ]),
    iq("js.control-flow.i5", "intermediate", "Почему колбэки в цикле с `var` видят одно и то же значение?", [
      ul(
        "`var` создаёт одну привязку на функцию, а не на итерацию: к моменту вызова колбэков счётчик равен конечному значению (замер `[3, 3, 3]`).",
        "`let` в заголовке `for` создаёт новую привязку на каждую итерацию (замер `[0, 1, 2]`).",
        "Решение: `let`/`const` или `for…of`.",
      ),
    ]),
    iq("js.control-flow.i6", "advanced", "Как вы выходите из вложенных циклов?", [
      ul(
        "Лучше всего — вынести их в функцию и использовать `return`.",
        "Альтернатива — метка и `break метка`, но она ухудшает читаемость.",
        "Можно заменить циклы методами `some`/`find` на вложенных структурах.",
        "Флаги `found = true` в обоих циклах — худший вариант: легко забыть проверить в одном из циклов.",
      ),
    ]),
    iq("js.control-flow.i7", "engineering", "Как бы вы упростили функцию с глубоко вложенными `if`?", [
      ul(
        "Ранние возвраты для невалидных и тривиальных случаев.",
        "Вынос частей в функции с говорящими именами.",
        "Таблицы соответствий (объект/`Map`) вместо цепочек `else if`/`switch`.",
        "Тесты на граничные случаи до и после рефакторинга, чтобы убедиться, что поведение не изменилось.",
      ),
    ]),
    iq("js.control-flow.i8", "debugging", "Цикл по массиву пропускает последний элемент или падает на `undefined`. Что проверите?", [
      ul(
        "Границу условия: `<` против `<=` с `arr.length`.",
        "Накопители: записывается ли результат последней серии после цикла (ошибка «на единицу»).",
        "Изменение массива во время обхода: удаления сдвигают индексы.",
        "Тесты на пустой массив, один элемент и два элемента.",
      ),
    ]),
  ],

  exam: [
    mcq("js.control-flow.e1", "foundation", "Что выведет `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);`?", ["`0 1 2`", "`undefined` три раза", "`3 3 3`", "Ошибка"], 2, "`var` — одна привязка на весь цикл; колбэки выполняются после цикла, когда `i` равна `3` (замер `[3, 3, 3]`)."),
    mcq("js.control-flow.e2", "foundation", "Что вернёт `describe(\"200\")`, если в `switch` есть `case 200`?", ["`default`", "Результат ветки `200`", "`undefined` без `default`, иначе ошибка", "Ветка `200`, потому что строка приводится"], 0, "`switch` сравнивает строго (`===`): строка `\"200\"` не совпадает с числом `200`, выполняется `default`."),
    mcq("js.control-flow.e3", "intermediate", "Какие значения перебирает `for (const k in arr)` для `arr = [\"a\", \"b\"]`?", ["Элементы `\"a\"`, `\"b\"`", "Индексы-числа `0`, `1`", "Ошибка: массив не итерируется", "Индексы-строки `\"0\"`, `\"1\"` (и другие перечислимые свойства)"], 3, "`for…in` перебирает имена перечислимых свойств — строки; элементы массива — свойства `\"0\"`, `\"1\"`."),
    mcq("js.control-flow.e4", "intermediate", "Что делает `return` внутри колбэка `forEach`?", ["Завершает весь `forEach`", "Завершает только текущий вызов колбэка", "Бросает исключение", "Завершает внешнюю функцию"], 1, "Колбэк — отдельная функция: `return` завершает её вызов, а `forEach` продолжает со следующим элементом."),
    mcq("js.control-flow.e5", "intermediate", "Какие способы выходят из цикла раньше? Выберите все.", ["`break` в `for…of`", "`return` в колбэке `forEach`", "`some` с условием", "`return` внутри функции с циклом"], [0, 2, 3], "`return` в колбэке `forEach` завершает только вызов колбэка; остальные способы действительно прекращают обход."),
    mcq("js.control-flow.e6", "advanced", "Что произойдёт, если в двух ветках `switch` написать `let x`?", ["Две независимые переменные", "Ошибка только при совпадении ветки", "Вторая затрёт первую без ошибки", "`SyntaxError: Identifier 'x' has already been declared`"], 3, "Все `case` делят одну область видимости; для изоляции оберните ветки в `{ }` (замер)."),
    open("js.control-flow.e7", "intermediate", "Когда вы замените `switch` на объект-таблицу и когда оставите `switch`?", [
      ul(
        "Таблица подходит, когда нужно сопоставить значение с результатом (`labels[status] ?? \"Неизвестно\"`): короче и нет проваливания.",
        "`switch` оставляю, когда в ветках разные действия (несколько операторов, `return`, побочные эффекты) или нужна общая обработка нескольких значений.",
        "В обоих случаях обязателен вариант по умолчанию (`default`/`??`) и тест на неизвестное значение.",
      ),
    ], ["Названы оба случая", "Упомянут вариант по умолчанию", "Упомянуто проваливание"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.control-flow.m1", "intermediate", "Что выведет `for (let n = 0; n < 5; n++) { if (n === 1) continue; if (n === 3) break; console.log(n); }`?", ["`0 1 2`", "`0 2 3`", "`0 2`", "`2`"], 2, "`n = 1` пропущено `continue`, на `n = 3` выполняется `break`; печатаются `0` и `2`."),
    mcq("js.control-flow.m2", "advanced", "Почему `for…of` по `{ a: 1 }` бросает `TypeError`?", ["Объект пуст", "Обычный объект не имеет `Symbol.iterator`", "`for…of` работает только с массивами", "Нужен `const`, а не `let`"], 1, "`for…of` требует итерируемого значения; обычные объекты им не являются (замер: `… is not iterable`). Используйте `Object.entries`."),
    mcq("js.control-flow.m3", "advanced", "Что вернёт `[1, 5, 10, 20].some((x) => x > 7)` и сколько элементов будет просмотрено?", ["`true`, три элемента", "`true`, один элемент", "`true`, четыре элемента", "`10`, три элемента"], 0, "`some` останавливается на первом истинном результате: просмотрены `1`, `5`, `10` (замер)."),
    open("js.control-flow.m4", "advanced", "Спроектируйте обработку списка из 1000 заказов, где нужно найти первый заказ с ошибкой, посчитать итог по остальным и не блокировать страницу.", [
      ul(
        "Поиск первой ошибки — `find`/`for…of` с `return`/`break`: после находки остальные проверки не нужны.",
        "Итог — один проход `for…of` (или `reduce`) с накоплением; не создавать лишние промежуточные массивы.",
        "Чтобы не блокировать страницу, делить работу на порции (например, по 100 заказов) и уступать управление между порциями (`setTimeout`, `scheduler.yield()` — в Chromium 141 доступна, замер, — или Web Worker).",
        "Граничные случаи: пустой список, все заказы с ошибкой, ошибка в последнем.",
        "Тесты и замер времени на реалистичном объёме данных, а не предположения.",
      ),
    ], ["Выбран способ раннего выхода", "Описан способ накопления", "Описано разбиение на порции", "Названы граничные случаи"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.control-flow.f1", front: "switch сравнивает как?", back: "Строго (===). Без break проваливается в следующую ветку. Все case — одна область видимости." },
    { id: "js.control-flow.f2", front: "for…of и for…in?", back: "of — значения итерируемых; in — перечислимые строковые ключи (включая унаследованные)." },
    { id: "js.control-flow.f3", front: "var и let в цикле?", back: "var: одна привязка → колбэки видят [3,3,3]; let: новая привязка на итерацию → [0,1,2]." },
    { id: "js.control-flow.f4", front: "Прервать forEach?", back: "Нельзя. Используйте for…of + break, some/every/find. async-колбэки forEach не ожидаются." },
    { id: "js.control-flow.f5", front: "Ранний возврат?", back: "Проверки в начале функции с return: плоский код вместо вложенных if." },
    { id: "js.control-flow.f6", front: "do…while?", back: "Условие проверяется после тела: тело выполняется хотя бы раз." },
    { id: "js.control-flow.f7", front: "Выход из вложенных циклов?", back: "return из функции (лучше всего) или break с меткой." },
  ],

  sources: [
    { title: "ECMAScript: Statements and Declarations (if, switch, iteration statements)", url: "https://tc39.es/ecma262/#sec-ecmascript-language-statements-and-declarations", publisher: "ECMA" },
    { title: "ECMAScript: For-in and for-of statements", url: "https://tc39.es/ecma262/#sec-for-in-and-for-of-statements", publisher: "ECMA" },
    { title: "ECMAScript: Iteration (протокол итерации)", url: "https://tc39.es/ecma262/#sec-iteration", publisher: "ECMA" },
    { title: "MDN: Control flow and error handling", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling", publisher: "MDN" },
    { title: "MDN: switch", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch", publisher: "MDN" },
    { title: "MDN: for...of", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of", publisher: "MDN" },
    { title: "MDN: for...in", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in", publisher: "MDN" },
    { title: "MDN: Array.prototype.forEach()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach", publisher: "MDN" },
    { title: "MDN: Labeled statement", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label", publisher: "MDN" },
  ],
};
