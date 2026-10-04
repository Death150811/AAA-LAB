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

export const executionContextScope: Topic = {
  id: "js.execution-context-scope",
  slug: "execution-context-scope",
  domain: "js",
  module: "execution",
  title: "Контекст исполнения, область видимости и hoisting",
  titleEn: "Execution context, scope and hoisting",
  summary:
    "Перед выполнением кода движок создаёт контекст исполнения и в нём — окружения, где заранее регистрируются все имена: `var` получает `undefined`, объявление функции — готовую функцию, а `let`, `const` и `class` остаются в «временной мёртвой зоне» до своей строки. Поиск имени идёт по цепочке областей снизу вверх, а сама цепочка определяется **местом написания** функции, а не местом вызова (лексическая область видимости). Тема на замерах в Node.js 22 и Chromium 141 (включая цепочку областей, прочитанную из отладчика через CDP) разбирает глобальную область, область модуля, функции и блока, затенение, подъём `var` и функций, TDZ, повторные объявления и сообщения об ошибках, а в задаче по инженерии предлагает смоделировать цепочку окружений в коде.",
  minutes: 65,
  prerequisites: ["js.functions-basics"],
  tags: ["execution context", "scope", "lexical environment", "scope chain", "hoisting", "TDZ", "var", "let", "const", "shadowing", "closure", "global scope", "block scope", "ReferenceError", "call stack"],
  keyConcepts: [
    { term: "Имена создаются до выполнения кода", text: "При входе в область движок регистрирует все объявления: `var` = `undefined`, функции готовы, `let`/`const`/`class` недоступны до своей строки (`ReferenceError: Cannot access 'l' before initialization`). Это и есть hoisting («подъём»)." },
    { term: "Область определяется местом написания", text: "`show()` видит `owner` из того места, где она **объявлена**, а не из того, откуда вызвана: `caller()` с локальной `owner` вернула `глобальный` (замер). Это лексическая область видимости." },
    { term: "Цепочка областей", text: "Поиск имени идёт от текущей области к внешней до первого совпадения; не нашли — `ReferenceError: x is not defined`. Ближайшее имя затеняет внешнее." },
    { term: "`let`/`const` — блочные, `var` — функциональная", text: "`var` из блока `if` виден во всей функции, `let` — только внутри `{}`. Классические скрипты делят глобальную область; у модуля область своя." },
    { term: "Замыкание хранит только нужное", text: "В замере отладчика Chromium область `closure` содержала только те переменные внешней функции, которые использует вложенная (`outerVar`, `captured`), но не `param`." },
  ],
  sections: [
    section("definition", [
      def("Контекст исполнения", "Внутренняя запись, в которой движок выполняет код: хранит окружения для имён и привязку `this`. Создаётся для скрипта/модуля и для каждого вызова функции; активные контексты образуют стек вызовов.", "execution context"),
      def("Область видимости", "Часть программы, внутри которой имя доступно. В JavaScript — глобальная, модуля, функции и блока (для `let`, `const`, `class`).", "scope"),
      def("Лексическое окружение", "Таблица «имя → значение» плюс ссылка на внешнее окружение. Цепочка внешних ссылок и есть цепочка областей.", "lexical environment"),
      def("Лексическая область видимости", "Правило: набор доступных имён определяется местом, где функция написана, а не местом, откуда её вызывают.", "lexical scoping"),
      def("Hoisting (подъём)", "Следствие того, что объявления регистрируются при входе в область, до выполнения кода: `var` существует со значением `undefined`, функция — готова, `let`/`const`/`class` — недоступны.", "hoisting"),
      def("Временная мёртвая зона (TDZ)", "Промежуток от начала области до строки объявления `let`/`const`/`class`: имя уже зарегистрировано, но обращение к нему бросает `ReferenceError`.", "temporal dead zone"),
      def("Затенение", "Объявление имени во внутренней области, скрывающее одноимённое имя внешней области только внутри внутренней.", "shadowing"),
      def("Глобальная область", "Самая внешняя область: в классическом скрипте браузера её переменные `var` и функции становятся свойствами `window`; в модуле глобальной области для ваших переменных нет.", "global scope"),
    ]),

    section("why", [
      h("Здесь рождается большинство «необъяснимых» ошибок"),
      p("`x is not defined` там, где переменная «точно есть». `undefined` вместо значения. `Cannot access 'count' before initialization` в строке, где вы ничего плохого не делали. Функция, которая «видит не ту» переменную. Все эти ситуации объясняются тремя вещами: **когда** создаётся имя, **где** его ищут и **что** его затеняет."),
      ul(
        "**Диагностика:** вы читаете сообщение об ошибке и сразу понимаете, на какой стадии (создание или выполнение) и в какой области возникла проблема.",
        "**Предсказуемость:** вы можете вычислить в уме, какое значение получит имя в любой строке кода.",
        "**Фундамент замыканий:** следующая тема — замыкания — это ровно «функция помнит окружение, в котором создана».",
        "**Инструменты:** панель Scope в отладчике и сообщения движка перестают быть магией.",
      ),
      insight("Задавайте два вопроса о каждом имени: **в какой области оно объявлено?** (смотрим на текст кода) и **в какой момент оно получит значение?** (смотрим на вид объявления). Всё остальное — следствия."),
    ]),

    section("mental-model", [
      p("Представьте **здание с этажами** (области видимости). Вы находитесь в комнате, на двери которой написано, чего в ней есть. Нужно найти предмет «x» — вы ищете в своей комнате; если нет, выходите на этаж, затем на этаж выше, пока не дойдёте до крыши (глобальная область). Первое найденное «x» и есть ваш предмет. Комнаты **строят по чертежу заранее** — до того как вы зайдёте: в каждой уже расставлена мебель с табличками. Но у мебели разный статус: табличка `var` приклеена к пустой коробке (`undefined`), табличка функции — к готовому предмету, а табличка `let`/`const` — к **опечатанной** коробке, которую нельзя трогать до строки объявления (TDZ). И ключевое: план здания (какой этаж над каким) не зависит от того, кто и откуда вызывает вашу функцию."),
      table(
        ["Вид объявления", "Область", "Состояние при входе в область", "Повторное объявление"],
        [
          ["`var`", "Функция (или глобальная)", "`undefined`, сразу доступна", "Допустимо"],
          ["Объявление функции", "Функция/блок (в модуле — область модуля)", "Готовая функция", "Внутри функции — допустимо (с другой функцией и с `var`); на верхнем уровне модуля — `SyntaxError` (замер)"],
          ["`let`", "Ближайший блок", "TDZ до строки объявления", "`SyntaxError` в той же области"],
          ["`const`", "Ближайший блок", "TDZ до строки объявления", "`SyntaxError` в той же области"],
          ["`class`", "Ближайший блок", "TDZ до строки объявления", "`SyntaxError` в той же области"],
          ["Параметр функции", "Функция", "Значение аргумента", "`let a` с тем же именем — `SyntaxError`"],
        ],
        "Объявления и области",
      ),
    ]),

    section("technical", [
      h("Контекст исполнения и две фазы"),
      p("Перед выполнением тела скрипта, модуля или функции движок создаёт **контекст исполнения** и два окружения: переменных (для `var` и функций) и лексическое (для `let`, `const`, `class`). Затем в **фазе создания** он проходит по телу и регистрирует все объявления в нужных окружениях — и только потом в **фазе исполнения** строка за строкой выполняет код. Вызов функции создаёт новый контекст поверх предыдущего; возврат снимает его со стека вызовов."),
      steps(
        [
          ["Вызов функции", "Создаётся новый контекст исполнения и окружения; в стек вызовов кладётся новый кадр."],
          ["Параметры и объявления", "Параметры получают значения аргументов; `var` — `undefined`; объявления функций создаются целиком; `let`/`const`/`class` регистрируются без значения (TDZ)."],
          ["Исполнение по строкам", "Присваивания `var`, инициализация `let`/`const` выполняются в порядке текста; в момент выполнения объявления `let`/`const` TDZ заканчивается."],
          ["Возврат", "Контекст снимается со стека; окружение остаётся в памяти, если на него ссылается созданная внутри функция (замыкание — следующая тема)."],
        ],
        "Жизнь контекста исполнения",
      ),

      h("Hoisting: что существует до своей строки"),
      code("js", `function demo() {
  // фаза создания уже произошла: имена существуют ещё до выполнения первой строки
  console.log("var до объявления:", typeof v, v);                 // undefined
  console.log("функция до объявления:", typeof decl, decl());     // function, "работает"

  try { console.log(l); } catch (e) { console.log("let:", e.name + ": " + e.message); }
  try { console.log(typeof c); } catch (e) { console.log("typeof const:", e.name + ": " + e.message); }
  try { new K(); } catch (e) { console.log("class:", e.name + ": " + e.message); }

  var v = "значение var";
  let l = "значение let";
  const c = "значение const";
  class K {}
  function decl() { return "работает"; }

  console.log("после объявлений:", v, l, c, typeof K);
}
demo();

// функция и var с одним именем (внутри функции): пока не было присваивания, имя указывает на функцию
function sameName() {
  const before = typeof both;
  var both = 1;
  function both() {}
  return [before, typeof both];
}
console.log(sameName());

// повторное объявление var допустимо, let — нет
function redeclare() {
  var twice = 1;
  var twice = 2;
  return twice;
}
console.log(redeclare());`, { filename: "s1-hoisting.mjs", lineNumbers: true }),
      code("text", `var до объявления: undefined undefined
функция до объявления: function работает
let: ReferenceError: Cannot access 'l' before initialization
typeof const: ReferenceError: Cannot access 'c' before initialization
class: ReferenceError: Cannot access 'K' before initialization
после объявлений: значение var значение let значение const function
[ 'function', 'number' ]
2`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`var`** до своей строки равна `undefined`: имя есть, значения нет.",
        "**Объявление функции** готово целиком: `decl()` вызвана до строки объявления.",
        "**`let`, `const`, `class`** до объявления бросают `ReferenceError: Cannot access 'l' before initialization`; даже `typeof` не спасает (`typeof c` тоже бросает), хотя для **необъявленного** имени `typeof` безопасен.",
        "**Функция и `var` с одним именем** (внутри функции): пока присваивания нет, имя указывает на функцию (`before` — `function`), после `var both = 1` — на число.",
        "**`var` можно объявлять повторно** (`var twice` дважды — без ошибки), `let` — нельзя.",
      ),
      note("Слово «hoisting» (подъём) — удобная метафора, но код физически никуда не поднимается. Правильнее: объявления **регистрируются при входе в область**, а инициализация происходит по месту."),

      h("Цепочка областей и затенение"),
      code("js", `const level = "модуль";

function outer() {
  const level = "outer";           // затеняет внешнюю
  function inner() {
    const own = "inner";
    return [own, level];           // own — из inner, level — из ближайшей области сверху (outer)
  }
  return inner();
}
console.log(outer(), level);

// блок создаёт область для let/const, но не для var
function blocks() {
  if (true) {
    var leaks = "var виден после блока";
    let stays = "let остаётся в блоке";
  }
  return [leaks, typeof stays];
}
console.log(blocks());

// переменная счётчика цикла
function loopVars() {
  for (var i = 0; i < 2; i++) {}
  for (let j = 0; j < 2; j++) {}
  return [i, typeof j];
}
console.log(loopVars());

// затенение: внутренняя переменная скрывает внешнюю только внутри блока
let x = "внешний";
{
  let x = "внутренний";
  console.log(x);
}
console.log(x);

// имя ищется по цепочке снизу вверх; если не найдено — ReferenceError
function lookup() { return notDeclaredAnywhere; }
try { lookup(); } catch (e) { console.log(e.name + ": " + e.message); }`, { filename: "s2-scope-chain.mjs", lineNumbers: true }),
      code("text", `[ 'inner', 'outer' ] модуль
[ 'var виден после блока', 'undefined' ]
[ 2, 'undefined' ]
внутренний
внешний
ReferenceError: notDeclaredAnywhere is not defined`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Поиск снизу вверх:** в `inner` имя `own` найдено сразу, а `level` — только в `outer` (ближайшем объемлющем), а не в модуле: `['inner', 'outer']`, при этом `level` модуля остался `модуль`.",
        "**Блок против функции:** `var` из блока `if` виден после него (`leaks`), `let` — нет (`typeof stays` — `undefined`).",
        "**Счётчик цикла:** после `for (var i…)` переменная `i` равна `2` и видна во всей функции, а `j` из `for (let j…)` — нет.",
        "**Затенение:** внутри блока `x` — `внутренний`, после блока — снова `внешний`. Внешняя переменная не изменяется.",
        "**Не найдено нигде** — `ReferenceError: notDeclaredAnywhere is not defined` (цепочка пройдена до самой внешней области).",
      ),

      h("Лексическая область: где функция написана, а не откуда вызвана"),
      code("js", `const owner = "глобальный";

function show() { return owner; }           // область определяется МЕСТОМ ОПРЕДЕЛЕНИЯ функции

function caller() {
  const owner = "локальный (caller)";
  return show();                            // вызов отсюда не меняет, какую owner видит show
}
console.log(caller());

function makeShower() {
  const owner = "локальный (makeShower)";
  return function () { return owner; };    // эта функция определена внутри makeShower
}
console.log(makeShower()());`, { filename: "s3-lexical.mjs" }),
      code("text", `глобальный
локальный (makeShower)`, { filename: "вывод Node.js 22.22.0" }),
      p("`show()` определена на верхнем уровне модуля, поэтому её внешняя область — модуль. Вызов из `caller`, где есть локальная `owner`, ничего не меняет: `show()` вернула `глобальный`. Функция, созданная внутри `makeShower`, видит `owner` из `makeShower` — **даже после** того, как `makeShower` закончила работу (это замыкание, подробно — в следующей теме). Противоположный подход, когда имена ищутся по цепочке **вызовов**, называется динамической областью видимости; в JavaScript имена переменных ей не подчиняются, а `this` определяется способом вызова (отдельная тема)."),

      h("Какие ошибки даёт неверная работа с областями"),
      code("js", `const attempts = {
  "необъявленная переменная": () => undeclared,
  "let до объявления": () => { tdz; let tdz = 1; },
  "присваивание const": () => { const k = 1; k = 2; },
  "const без значения": () => new Function("const k;"),
  "повторное let": () => new Function("let a; let a;"),
  "let + var в одной области": () => new Function("let x; { var x; }"),
  "let во вложенном блоке (затенение)": () => new Function("let x; { let x; } return 'ok';")(),
  "параметр и let": () => new Function("a", "let a;"),
  "присваивание необъявленной (строго)": () => new Function('"use strict"; undeclared2 = 1;')(),
};
for (const [label, fn] of Object.entries(attempts)) {
  try {
    const r = fn();
    console.log(label.padEnd(40), "→ без ошибки", r ?? "");
  } catch (e) {
    console.log(label.padEnd(40), "→", e.name + ": " + e.message);
  }
}`, { filename: "s4-errors.mjs", lineNumbers: true }),
      code("text", `необъявленная переменная                 → ReferenceError: undeclared is not defined
let до объявления                        → ReferenceError: Cannot access 'tdz' before initialization
присваивание const                       → TypeError: Assignment to constant variable.
const без значения                       → SyntaxError: Missing initializer in const declaration
повторное let                            → SyntaxError: Identifier 'a' has already been declared
let + var в одной области                → SyntaxError: Identifier 'x' has already been declared
let во вложенном блоке (затенение)       → без ошибки ok
параметр и let                           → SyntaxError: Identifier 'a' has already been declared
присваивание необъявленной (строго)      → ReferenceError: undeclared2 is not defined`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`ReferenceError`** — имя не найдено в цепочке (`… is not defined`) или найдено, но находится в TDZ (`Cannot access … before initialization`). Ошибка возникает **при выполнении**, когда код доходит до обращения.",
        "**`SyntaxError`** — повторное объявление в той же области, `let` и `var` с одним именем в одной области, параметр и `let` с одним именем, `const` без значения. Такая ошибка возникает **при разборе**, до выполнения любой строки (поэтому её проверяют через `new Function`).",
        "**`TypeError: Assignment to constant variable.`** — присваивание `const`.",
        "**Затенение допустимо:** `let x` во вложенном блоке при внешнем `let x` — не ошибка.",
        "**Строгий режим:** присваивание необъявленной переменной — `ReferenceError` (в нестрогом создалась бы глобальная переменная).",
      ),

      h("Глобальная область и несколько скриптов"),
      code("html", `<!doctype html>
<meta charset="utf-8">
<script>
  var a = 1;
  let b = 2;
  function f() {}
  window.report = () => ({
    "window.a": window.a,
    "window.b": window.b,
    "typeof window.f": typeof window.f,
    "globalThis === window": globalThis === window,
  });
</script>
<script>
  // второй скрипт делит ту же глобальную область
  window.second = () => [typeof a, typeof b];
</script>
<script>
  let b = 3;                       // повторное объявление let из другого скрипта
  window.thirdRan = true;
</script>`, { filename: "s6-global.html", collapsed: true }),
      code("text", `window.a                 1
window.b                 undefined
typeof window.f          function
globalThis === window    true
второй скрипт видит a и b как: number, number
третий скрипт выполнился: false
ошибка страницы: SyntaxError: Identifier 'b' has already been declared`, { filename: "вывод Chromium 141 (по http)" }),
      ul(
        "**`var` и функция** верхнего уровня классического скрипта становятся свойствами `window` (`window.a` — `1`), а `let` — нет (`window.b` — `undefined`), хотя имя `b` доступно во всех скриптах страницы (`second` увидела `number`).",
        "**Скрипты делят одну глобальную область:** второй скрипт обращается к `a` и `b` первого.",
        "**Повторное `let b` в третьем скрипте** — `SyntaxError: Identifier 'b' has already been declared`; скрипт не выполнился (`thirdRan` — `false`).",
        "**Модуль не засоряет глобальную область:** переменные модуля — собственные, `window.moduleVar` — `undefined`.",
      ),

      h("Цепочка областей в отладчике"),
      p("Цепочку областей можно прочитать у самого движка: в паузе отладчика Chromium (через протокол DevTools) для функции `inner` из примера ниже получен такой список областей — от ближайшей к дальней:"),
      code("html", `<!doctype html>
<meta charset="utf-8">
<script>
  var globalVar = "g";
  let globalLet = "l";
  function outer(param) {
    var outerVar = 1;
    const captured = 2;
    function inner() {
      const innerLocal = 3;
      if (innerLocal) {
        let blockLet = 4;
        console.log(captured, blockLet, outerVar);
        debugger;
      }
    }
    inner();
  }
  window.start = () => outer("p");
</script>`, { filename: "scopes-page.html", collapsed: true }),
      code("text", `функция: inner
block    (inner) → blockLet
local    (inner) → innerLocal
closure  (outer) → outerVar, captured
script    → globalLet
global    `, { filename: "цепочка областей в точке debugger (Chromium 141)" }),
      ul(
        "**`block`** — блок `if` с `let blockLet`; **`local`** — тело функции `inner` с `innerLocal`.",
        "**`closure`** — внешняя функция `outer`: V8 показывает **только те переменные, которые использует** вложенная функция (`outerVar`, `captured`); параметр `param` и другие неиспользуемые остались вне замыкания.",
        "**`script`** — `let`/`const` верхнего уровня классического скрипта (`globalLet`); **`global`** — глобальный объект с `var` и функциями.",
      ),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const scopeName = "модуль";           // область модуля

function outer(param) {               // область функции: param и всё, что объявлено внутри
  var a = 1;                          // var — в области функции
  let b = 2;                          // let — в ближайшем блоке (здесь — тело функции)
  if (param) {
    const c = 3;                      // блок: c живёт только внутри {}
    var d = 4;                        // var игнорирует блок и попадает в область функции
    return [scopeName, a, b, c, d];   // поиск идёт изнутри наружу
  }
}

console.log(outer(true));`,
        [
          { line: 1, text: "Область модуля: `scopeName` доступна всем функциям ниже и не попадает в `window`." },
          { line: 3, text: "Параметр `param` и всё, что объявлено в теле, принадлежат области функции `outer`." },
          { line: 4, text: "`var a` — область функции; к моменту входа в `outer` она уже существует со значением `undefined`." },
          { line: 5, text: "`let b` — блок тела функции; обращение до этой строки — TDZ." },
          { line: [6, 10], text: "Блок `if`: создаёт собственную область для `let`/`const`." },
          { line: 7, text: "`const c` живёт только внутри блока: за его пределами имени `c` нет." },
          { line: 8, text: "`var d` игнорирует блок и принадлежит функции `outer`." },
          { line: 9, text: "Поиск имён идёт изнутри наружу: `scopeName` найдена в модуле, `a`, `b`, `d` — в функции, `c` — в блоке." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Области видимости</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #8884; padding: .3rem .7rem; text-align: left; }
  code { font-family: ui-monospace, monospace; }
</style>
<h1>Где живёт переменная</h1>
<table>
  <thead><tr><th>Объявление</th><th>Видно как <code>window.имя</code></th></tr></thead>
  <tbody id="rows"></tbody>
</table>

<script>
  // классический скрипт: глобальная область
  var classicVar = 1;
  let classicLet = 2;
  const classicConst = 3;
  function classicFunction() {}
  window.classicRows = [
    ["var (классический скрипт)", typeof window.classicVar],
    ["let (классический скрипт)", typeof window.classicLet],
    ["const (классический скрипт)", typeof window.classicConst],
    ["function (классический скрипт)", typeof window.classicFunction],
  ];
</script>

<script type="module">
  // модуль: собственная область, ничего не попадает в window
  var moduleVar = 1;
  function moduleFunction() {}
  const rows = [
    ...window.classicRows,
    ["var (модуль)", typeof window.moduleVar],
    ["function (модуль)", typeof window.moduleFunction],
  ];
  const tbody = document.querySelector("#rows");
  for (const [label, type] of rows) {
    const tr = tbody.insertRow();
    tr.insertCell().textContent = label;
    tr.insertCell().textContent = type;
  }
</script>`, { filename: "scope-demo.html", runnable: true, lineNumbers: true }),
      p("Страница объявляет переменные в классическом скрипте и в модуле и показывает, какие из них стали свойствами `window`. Замер в Chromium 141: `var` и функция классического скрипта — `number` и `function`, `let` и `const` — `undefined`, `var` и функция модуля — `undefined`."),
    ]),

    section("detailed-example", [
      p("Лучший способ понять область видимости — **реализовать** её. Ниже — модель цепочки окружений: области как записи с таблицей имён и ссылкой на внешнюю область, объявления `var`/`let`/`const`, TDZ, затенение и все три вида ошибок. Модель воспроизводит сообщения реальных ошибок, замеренные выше."),
      code("js", `// Модель цепочки областей видимости: каждая область — запись с таблицей имён и ссылкой на внешнюю.
export function createScope(parent = null, { isFunction = false } = {}) {
  return { parent, isFunction, vars: new Map() };
}

function functionScope(scope) {
  let s = scope;
  while (!s.isFunction && s.parent) s = s.parent;       // var «всплывает» до ближайшей функции (или корня)
  return s;
}

function findBinding(scope, name) {
  for (let s = scope; s; s = s.parent) {
    if (s.vars.has(name)) return s.vars.get(name);      // идём вверх по цепочке, берём ближайшее
  }
  return null;
}

export function declare(scope, name, kind) {
  const target = kind === "var" ? functionScope(scope) : scope;
  const existing = target.vars.get(name);
  if (existing && !(existing.kind === "var" && kind === "var")) {
    throw new SyntaxError(\`Identifier '\${name}' has already been declared\`);
  }
  if (!existing) target.vars.set(name, { kind, initialized: kind === "var", value: undefined });
}

export function initialize(scope, name, value) {
  const binding = findBinding(scope, name);
  if (!binding) throw new ReferenceError(\`\${name} is not defined\`);
  binding.initialized = true;
  binding.value = value;
}

export function lookup(scope, name) {
  const binding = findBinding(scope, name);
  if (!binding) throw new ReferenceError(\`\${name} is not defined\`);
  if (!binding.initialized) throw new ReferenceError(\`Cannot access '\${name}' before initialization\`);
  return binding.value;
}

export function assign(scope, name, value) {
  const binding = findBinding(scope, name);
  if (!binding) throw new ReferenceError(\`\${name} is not defined\`);
  if (!binding.initialized) throw new ReferenceError(\`Cannot access '\${name}' before initialization\`);
  if (binding.kind === "const") throw new TypeError("Assignment to constant variable.");
  binding.value = value;
}`, { filename: "scope-model.mjs", lineNumbers: true }),
      code("js", `import { createScope, declare, initialize, lookup, assign } from "./scope-model.mjs";

const checks = [];
const check = (label, fn, expected) => {
  let got;
  try { got = fn(); } catch (e) { got = e.name + ": " + e.message; }
  checks.push([label, got, expected]);
};

const global = createScope(null, { isFunction: true });
declare(global, "level", "const"); initialize(global, "level", "глобальный");
const fn = createScope(global, { isFunction: true });
const block = createScope(fn);

check("поиск вверх по цепочке", () => lookup(block, "level"), "глобальный");
declare(fn, "level", "let"); initialize(fn, "level", "функция");
check("затенение: ближайшее имя", () => lookup(block, "level"), "функция");
check("внешнее значение не изменилось", () => lookup(global, "level"), "глобальный");

check("необъявленное имя", () => lookup(block, "nope"), "ReferenceError: nope is not defined");

declare(block, "t", "let");
check("TDZ: let до инициализации", () => lookup(block, "t"), "ReferenceError: Cannot access 't' before initialization");
initialize(block, "t", 5);
check("let после инициализации", () => lookup(block, "t"), 5);
check("присваивание let", () => { assign(block, "t", 6); return lookup(block, "t"); }, 6);

declare(block, "c", "const"); initialize(block, "c", 1);
check("присваивание const", () => assign(block, "c", 2), "TypeError: Assignment to constant variable.");

declare(block, "v", "var");
check("var инициализирован как undefined", () => lookup(block, "v"), undefined);
check("var оказался в области функции", () => [fn.vars.has("v"), block.vars.has("v")].join(), "true,false");
check("var повторно объявляется", () => { declare(block, "v", "var"); return "ok"; }, "ok");

check("let повторно в той же области", () => declare(block, "t", "let"), "SyntaxError: Identifier 't' has already been declared");
check("let после var с тем же именем", () => declare(fn, "v", "let"), "SyntaxError: Identifier 'v' has already been declared");

let failed = 0;
for (const [label, got, expected] of checks) {
  const ok = got === expected;
  if (!ok) { failed++; console.log("FAIL", label, "→", got, "(ожидалось", expected + ")"); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "scope-model-test.mjs", collapsed: true }),
      code("text", `Все 13 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Фрагмент модели", "Что соответствует в языке", "Почему так"],
        [
          ["`{ parent, isFunction, vars }`", "Окружение: таблица имён + внешняя ссылка", "Цепочка `parent` и есть цепочка областей"],
          ["`findBinding`: цикл `s = s.parent`", "Поиск имени снизу вверх", "Возвращается ближайшее совпадение — отсюда затенение"],
          ["`declare(…, \"var\")` → `functionScope(scope)`", "Подъём `var` до функции", "`var` игнорирует блоки: регистрируется в ближайшей области-функции"],
          ["`initialized: kind === \"var\"`", "`var` сразу `undefined`, `let`/`const` — TDZ", "Флаг «инициализировано» отличает доступное имя от находящегося в TDZ"],
          ["`lookup` проверяет `initialized`", "`ReferenceError: Cannot access … before initialization`", "Имя найдено в окружении, но значение ещё не присвоено"],
          ["`assign` для `const`", "`TypeError: Assignment to constant variable.`", "Привязка зафиксирована при инициализации"],
          ["`declare` кидает `SyntaxError`", "Повторное объявление", "Единственный разрешённый дубликат — `var` + `var`"],
        ],
        "Соответствие модели и языка",
      ),
      ul(
        "**13 проверок** воспроизводят замеры темы: поиск вверх, затенение, `ReferenceError` (оба вида), TDZ, `TypeError` для `const`, подъём `var` в область функции, повторные объявления.",
        "Модель не реализует замыкания и вызовы функций — но показывает, что для них достаточно **сохранить ссылку на окружение** (следующая тема).",
        "Различие времени ошибок (разбор против выполнения) в модели выражено разными типами исключений: `SyntaxError` — при `declare`, `ReferenceError` — при `lookup`.",
      ),
    ]),

    section("internals", [
      h("Окружения в стандарте"),
      p("В ECMA-262 каждый контекст исполнения имеет два компонента: **VariableEnvironment** (в нём живут `var` и функции) и **LexicalEnvironment** (`let`, `const`, `class`, а также блоки). Окружение состоит из **записи окружения** (таблицы привязок) и ссылки на **внешнее окружение**. Для функции создаётся окружение с параметрами, для блока — отдельное вложенное; поэтому блок видит всё, что видно снаружи, и добавляет своё."),
      h("Как движок хранит переменные"),
      p("Спецификация описывает поведение, а не реализацию. Реальные движки размещают переменные эффективнее: локальные — в регистрах и кадре стека, а в «контекст» в куче выносят только те переменные, на которые ссылаются вложенные функции. Замер отладчика подтверждает это: область `closure` содержала `outerVar` и `captured`, но не `param`. Для вас это значит одно: **поведение не зависит** от реализации, а память освобождается раньше, чем можно было ожидать."),
      h("Почему `let` и `const` «поднимаются»"),
      p("TDZ — доказательство того, что имена `let`/`const` регистрируются при входе в блок. Если бы они «не существовали» до строки объявления, `console.log(count)` в блоке, где ниже написано `const count`, нашло бы внешнюю `count`. Вместо этого движок находит **внутреннюю**, ещё не инициализированную, и бросает `ReferenceError` (замер в упражнении ниже)."),
      h("Объявления функций в модуле и в блоках"),
      p("В модуле и строгом режиме объявление функции — лексическое: оно ограничено своим блоком и в области модуля ведёт себя как `let` (оно сразу доступно, но конфликтует с `var` того же имени — `SyntaxError`). Внутри обычной функции объявление функции и `var` с одним именем допустимо — это историческое поведение, сохранённое ради совместимости."),
      h("Глобальный объект и записи окружений"),
      p("В классическом скрипте глобальная область состоит из двух частей: объектной записи (свойства `window`: `var`, функции) и декларативной (`let`, `const`, `class`). Поэтому `let` не попадает в `window`, но доступно всем скриптам, и поэтому повторное объявление `let` из другого скрипта — `SyntaxError` (замер)."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Объявление `let`/`const` ниже использования в том же блоке"),
      wrongRight(
        "js",
        {
          code: `
            const count = items.length;
            if (count > 0) {
              console.log(count);        // ReferenceError: Cannot access 'count' before initialization
              const count = count * 2;   // это объявление затеняет внешнюю count во всём блоке
            }
          `,
          note: "Внутренняя `count` уже существует с начала блока (в TDZ) и скрывает внешнюю — обращение к ней падает (замер).",
        },
        {
          code: `
            const count = items.length;
            if (count > 0) {
              console.log(count);
              const doubled = count * 2; // новое имя — нет затенения
            }
          `,
          note: "Не используйте одно имя для разных значений в соседних областях.",
        },
      ),
      h("Ошибка 2. Рассчитывать на `var` как на блочную переменную"),
      p("`var` из блока `if` или цикла видна во всей функции (замер: `leaks`, `i` после `for (var …)`). Используйте `let`/`const`."),
      h("Ошибка 3. Вызвать функцию-выражение или класс до определения"),
      p("`let`/`const`/`class` в TDZ: `ReferenceError`; `var` — `TypeError: … is not a function` (значение `undefined`). Определяйте раньше использования."),
      h("Ошибка 4. Ожидать динамическую область видимости"),
      p("Функция видит имена **своего места определения**, а не вызывающего: `caller()` с локальной `owner` вызвала `show()`, которая вернула `глобальный` (замер)."),
      h("Ошибка 5. Создавать глобальные переменные присваиванием"),
      p("В нестрогом режиме `undeclared = 1` создаёт глобальную переменную; в строгом (и в модулях) — `ReferenceError` (замер). Всегда объявляйте переменные."),
      h("Ошибка 6. Объявлять одно имя через `var` и `let`"),
      p("`let x; { var x; }` — `SyntaxError: Identifier 'x' has already been declared` (замер), потому что `var` поднимается в область, где уже есть `let x`."),
      h("Ошибка 7. Повторное `let`/`const` в разных скриптах страницы"),
      p("Классические скрипты делят глобальную область: второе `let b` в другом `<script>` — `SyntaxError`, и скрипт не выполняется (замер). Используйте модули."),
      h("Ошибка 8. Путать «поднятие» с перемещением кода"),
      p("Hoisting — это регистрация имён, а не перенос строк: `var a = 2` присваивает значение **по месту**, поэтому `console.log(a)` выше выводит `undefined`."),
    ]),

    section("antipatterns", [
      ul(
        "**Глобальные переменные** в классических скриптах (`var` или присваивание без объявления): конфликты имён между скриптами.",
        "**Одно имя для разных сущностей** во вложенных областях: затенение маскирует ошибки (`count`, `index`, `data`).",
        "**Использование `var`:** функциональная область и подъём сбивают с толку; в новом коде нужны `let`/`const`.",
        "**Объявления в конце функции,** хотя имена используются в начале: читатель не понимает, откуда значения.",
        "**`eval` и `with`,** динамически меняющие области видимости: ломают оптимизацию и читаемость.",
        "**IIFE в модульном коде** ради области видимости: модуль её уже создаёт.",
        "**Неявные зависимости от глобальных переменных** (`window.config`) внутри функций без передачи параметрами.",
        "**Длинные функции со множеством `let` наверху:** разбивайте на функции с понятными именами и параметрами.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Объявляйте переменные там, где они нужны, с минимальной областью:** `const` по умолчанию, `let` для меняющихся значений, `var` не используйте.",
        "**Используйте модули:** они изолируют область и включают строгий режим.",
        "**Давайте разным сущностям разные имена,** особенно во вложенных блоках; включите правило линтера `no-shadow`.",
        "**Определяйте функции и константы до использования** в порядке чтения кода.",
        "**Включайте строгий режим и линтер** (`no-undef`, `no-use-before-define`, `no-redeclare`): они находят большинство проблем до запуска.",
        "**Передавайте зависимости параметрами,** а не читайте глобальные переменные.",
        "**Читайте цепочку областей в отладчике** (панель Scope), когда значение не такое, как ожидается.",
        "**Помните про TDZ:** группируйте `const`/`let` в начале блока, где они нужны.",
      ),
      tip("Когда видите `X is not defined` или `Cannot access 'X' before initialization`, задайте три вопроса: объявлено ли `X` в цепочке выше (написанной, а не вызывающей)? Не затеняет ли его одноимённое объявление ниже в этом же блоке? Не вызвана ли функция до инициализации?"),
    ]),

    section("edge-cases", [
      h("Параметры по умолчанию и тело функции"),
      p("Параметры с выражениями по умолчанию образуют отдельную область, видимую выражениям по умолчанию слева направо; а `let a` в теле при параметре `a` — `SyntaxError` (замер: `параметр и let`)."),
      h("`typeof` и TDZ"),
      p("`typeof undeclared` — `\"undefined\"` без ошибки, но `typeof c` для `const c`, объявленной ниже в том же блоке, бросает `ReferenceError` (замер). Не используйте `typeof` как универсальную проверку существования для переменных текущего модуля."),
      h("Объявление функции в блоке"),
      p("В модуле и строгом режиме функция из блока видна только внутри блока. В нестрогом режиме для совместимости она также становится доступной во всей области (подробности — в теме об основах функций)."),
      h("Циклы и привязка на каждую итерацию"),
      p("`for (let …)` создаёт новую привязку для каждой итерации — поэтому замыкания в цикле запоминают разные значения (тема об управляющих конструкциях и следующая тема о замыканиях)."),
      h("Область видимости классов"),
      p("`class` — как `let`: блочная, с TDZ (замер: `new K()` до объявления — `ReferenceError`). Имя класса внутри тела — отдельная неизменяемая привязка: `A = 1` внутри метода — `TypeError: Assignment to constant variable.` (замер)."),
      h("Область видимости в `catch` и в `switch`"),
      p("Параметр `catch (e)` виден только в блоке `catch`; все ветки `switch` делят одну область — два `let x` в разных `case` — `SyntaxError` (тема об управляющих конструкциях)."),
    ]),

    section("related", [
      ul(
        "[Функции: основы](/learn/js/functions-basics) — объявление, выражение, параметры по умолчанию.",
        "[Управляющие конструкции](/learn/js/control-flow) — `var` и `let` в циклах.",
        "[Переменные и типы данных](/learn/js/variables-types) — `let`, `const`, `var` и глобальный объект.",
        "[Что такое JavaScript](/learn/js/what-is-js) — скрипт, модуль, строгий режим.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Глобальные переменные и затенение",
          code: `
            var count = 0;                       // глобальная: window.count
            function add(items) {
              for (var i = 0; i < items.length; i++) {
                var count = items[i];            // затеняет внешнюю count во всей функции
              }
              return count;                      // последняя из элементов, а не накопленная сумма
            }
          `,
          note: "`var count` внутри функции создаёт **другую** переменную, видную во всей функции, а `i` утекает из цикла.",
        },
        {
          title: "Модуль и блочные переменные",
          code: `
            function sum(items) {
              let total = 0;
              for (const item of items) {
                total += item;
              }
              return total;
            }
          `,
          note: "Нет глобальных переменных, нет затенения, переменная цикла живёт только в цикле.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.execution-context-scope.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код, скажите, что напечатает каждая строка, и объясните каждый результат через «регистрацию имён при входе в область» и «поиск по цепочке снизу вверх»."),
        code("js", `var a = 1;
function f() {
  console.log(a);
  var a = 2;
  console.log(a);
}
f();

console.log(typeof g, typeof h);
var g = function () {};
function h() {}

{
  try { console.log(typeof y); } catch (e) { console.log(e.name); }
  let y = 1;
}

const x = "внешний";
function show() { return x; }
function run() {
  const x = "внутренний";
  return show();
}
console.log(run());`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Какое значение имеет `a` внутри `f` в момент первой строки?", "Какое значение выведет `show()` — по месту определения или по месту вызова?"],
      checks: ["Объяснено `undefined` и `2`", "Объяснено `undefined function`", "Объяснён `ReferenceError` для `typeof y`", "Объяснено «внешний»"],
      solution: [
        code("text", `undefined
2
undefined function
ReferenceError
внешний`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "В `f` объявлена своя `var a`, поэтому она **затеняет** внешнюю `a` с самого начала функции: первая строка видит `a` со значением `undefined`, после присваивания — `2`.",
          "`typeof g` — `undefined` (`var g` существует, присваивание ещё не выполнено), `typeof h` — `function` (объявление готово целиком).",
          "`typeof y` внутри блока до `let y` бросает `ReferenceError` (TDZ): имя уже зарегистрировано в блоке.",
          "`show` определена на верхнем уровне, поэтому видит `x` модуля — `внешний`; локальная `x` функции `run` на неё не влияет.",
        ),
      ],
    }),
    exercise({
      id: "js.execution-context-scope.ex2",
      title: "Странный ReferenceError",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Функция `describeBad` падает с `ReferenceError: Cannot access 'count' before initialization`, хотя `count` объявлена выше. Найдите причину и исправьте функцию."),
      ],
      hints: ["Сколько объявлений `count` видит блок `if`?", "С какого момента внутренняя `count` существует в блоке?"],
      checks: ["Названа причина (объявление в блоке затеняет внешнюю)", "Объяснён TDZ", "Исправлено без потери смысла"],
      solution: [
        code("js", `// Было: ReferenceError
function describeBad(items) {
  const count = items.length;
  if (count > 0) {
    const label = \`Элементов: \${count}\`;
    console.log(label);
    const count = count * 2;           // объявление ниже затеняет внешнюю count во всём блоке
    return count;
  }
  return 0;
}
try { describeBad([1, 2]); } catch (e) { console.log(e.name + ": " + e.message); }

// Стало: другое имя для нового значения
function describe(items) {
  const count = items.length;
  if (count > 0) {
    console.log(\`Элементов: \${count}\`);
    const doubled = count * 2;
    return doubled;
  }
  return 0;
}
console.log(describe([1, 2]));`, { filename: "x2-shadow.mjs" }),
        code("text", `ReferenceError: Cannot access 'count' before initialization
Элементов: 2
4`, { filename: "вывод Node.js 22.22.0" }),
        p("`const count` внутри блока регистрируется при входе в блок, поэтому уже первое обращение к `count` в блоке (в шаблонной строке) находит **внутреннюю** переменную, которая в TDZ. Решение — другое имя для нового значения (`doubled`). Правило линтера `no-shadow` предупреждает о таких ситуациях."),
      ],
    }),
    exercise({
      id: "js.execution-context-scope.ex3",
      title: "Какое именно имя",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("В коде шесть точек, где печатается `name`. Для каждой скажите, **из какой области** берётся значение, не запуская код. Затем проверьте себя и объясните, почему в точке 5 переменная `name2`, объявленная через `var` в блоке, доступна."),
        code("js", `const name = "модуль";

function outer() {
  const name = "outer";

  function middle() {
    let result = [];
    result.push(["1", name]);            // какая name?
    {
      const name = "блок";
      result.push(["2", name]);
    }
    result.push(["3", name]);

    function inner(name) {               // параметр с тем же именем
      result.push(["4", name]);
      {
        var name2 = name + "!";
      }
      result.push(["5", name2]);
    }
    inner("аргумент");
    return result;
  }
  return middle();
}

for (const [point, value] of outer()) console.log(point, "→", value);
console.log("6 →", name);`, { filename: "x3-which.mjs", collapsed: true }),
      ],
      hints: ["Ищите ближайшее объявление изнутри наружу.", "К какой области относится `var` в блоке внутри `inner`?"],
      checks: ["Правильные источники для шести точек", "Объяснено затенение параметром и блоком", "Объяснён подъём `var` до функции"],
      solution: [
        code("text", `1 → outer
2 → блок
3 → outer
4 → аргумент
5 → аргумент!
6 → модуль`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "Точки 1 и 3 — `name` из `outer` (ближайшая сверху от `middle`).",
          "Точка 2 — `const name` из блока: затеняет `outer` только внутри блока.",
          "Точка 4 — параметр `name` функции `inner`: затеняет внешние `name`.",
          "Точка 5 — `var name2` объявлена в блоке, но принадлежит функции `inner`, поэтому видна после блока.",
          "Точка 6 — `name` модуля: внутренние объявления на неё не повлияли.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "js.execution-context-scope.challenge",
    title: "Модель цепочки областей видимости",
    scenario: [
      p("Чтобы закрепить понимание областей видимости, нужно воспроизвести их в коде. Реализуйте модуль `scope-model.mjs` с функциями `createScope`, `declare`, `initialize`, `lookup`, `assign`, который моделирует `var`, `let`, `const`, цепочку областей, затенение и TDZ."),
    ],
    requirements: [
      "`createScope(parent, { isFunction })` создаёт область со ссылкой на внешнюю",
      "`declare(scope, name, kind)` регистрирует `var` (сразу `undefined`, в ближайшей области-функции), `let` и `const` (в текущей области, без значения — TDZ)",
      "`lookup` ищет имя вверх по цепочке и возвращает ближайшее значение (затенение); `initialize` задаёт значение",
      "Ошибки с теми же сообщениями, что у движка: `ReferenceError: x is not defined`, `ReferenceError: Cannot access 'x' before initialization`, `TypeError: Assignment to constant variable.`, `SyntaxError: Identifier 'x' has already been declared`",
      "Повторное объявление допустимо только для `var` + `var`",
    ],
    constraints: [
      "Без классов и внешних библиотек: область — обычная запись, операции — функции",
      "Не использовать `eval`, `with` и `new Function` внутри модели",
    ],
    acceptance: [
      "Все 13 проверок из теста проходят",
      "`lookup` до `initialize` для `let` бросает ReferenceError о TDZ",
      "`var` из вложенного блока оказывается в области функции, а не блока",
    ],
    hints: [
      "Как найти ближайшую функцию вверх по цепочке для `var`?",
      "Чем отличается состояние `var` и `let` сразу после `declare`?",
      "Где проверять повторное объявление: в той области, куда регистрируется имя?",
    ],
    solution: [
      code("js", `// Модель цепочки областей видимости: каждая область — запись с таблицей имён и ссылкой на внешнюю.
export function createScope(parent = null, { isFunction = false } = {}) {
  return { parent, isFunction, vars: new Map() };
}

function functionScope(scope) {
  let s = scope;
  while (!s.isFunction && s.parent) s = s.parent;       // var «всплывает» до ближайшей функции (или корня)
  return s;
}

function findBinding(scope, name) {
  for (let s = scope; s; s = s.parent) {
    if (s.vars.has(name)) return s.vars.get(name);      // идём вверх по цепочке, берём ближайшее
  }
  return null;
}

export function declare(scope, name, kind) {
  const target = kind === "var" ? functionScope(scope) : scope;
  const existing = target.vars.get(name);
  if (existing && !(existing.kind === "var" && kind === "var")) {
    throw new SyntaxError(\`Identifier '\${name}' has already been declared\`);
  }
  if (!existing) target.vars.set(name, { kind, initialized: kind === "var", value: undefined });
}

export function initialize(scope, name, value) {
  const binding = findBinding(scope, name);
  if (!binding) throw new ReferenceError(\`\${name} is not defined\`);
  binding.initialized = true;
  binding.value = value;
}

export function lookup(scope, name) {
  const binding = findBinding(scope, name);
  if (!binding) throw new ReferenceError(\`\${name} is not defined\`);
  if (!binding.initialized) throw new ReferenceError(\`Cannot access '\${name}' before initialization\`);
  return binding.value;
}

export function assign(scope, name, value) {
  const binding = findBinding(scope, name);
  if (!binding) throw new ReferenceError(\`\${name} is not defined\`);
  if (!binding.initialized) throw new ReferenceError(\`Cannot access '\${name}' before initialization\`);
  if (binding.kind === "const") throw new TypeError("Assignment to constant variable.");
  binding.value = value;
}`, { filename: "scope-model.mjs", lineNumbers: true }),
      code("text", `Все 13 проверок пройдены`, { filename: "результат запуска тестов" }),
      p("Модель держит в записи области таблицу привязок `{ kind, initialized, value }`. Поиск имени — цикл по `parent`; затенение возникает само, потому что возвращается первое найденное имя. TDZ — это просто `initialized: false` у найденной привязки."),
    ],
  },

  interview: [
    iq("js.execution-context-scope.i1", "basic", "Что такое область видимости и какие бывают в JavaScript?", [
      ul(
        "Часть кода, где имя доступно: глобальная, модуля, функции, блока (для `let`, `const`, `class`).",
        "Поиск имени идёт от текущей области к внешним; не найдено — `ReferenceError`.",
        "`var` — область функции, `let`/`const` — блока.",
      ),
    ]),
    iq("js.execution-context-scope.i2", "basic", "Что такое hoisting?", [
      p("Объявления регистрируются при входе в область до выполнения кода. `var` существует со значением `undefined`, объявление функции — готово, `let`/`const`/`class` находятся в TDZ. Код физически не перемещается: инициализация происходит по месту."),
    ]),
    iq("js.execution-context-scope.i3", "intermediate", "Что такое временная мёртвая зона (TDZ)?", [
      ul(
        "Промежуток от начала области до строки объявления `let`/`const`/`class`.",
        "Имя уже зарегистрировано, но обращение к нему бросает `ReferenceError: Cannot access 'x' before initialization` — в том числе через `typeof`.",
        "Следствие: объявление в блоке затеняет внешнюю переменную во всём блоке, даже до своей строки.",
      ),
    ]),
    iq("js.execution-context-scope.i4", "intermediate", "Что значит «лексическая область видимости»?", [
      ul(
        "Видимые функции имена определяются местом, **где функция написана**, а не откуда вызвана.",
        "Поэтому `show()`, объявленная на верхнем уровне, не видит локальные переменные вызывающей функции.",
        "Это основа замыканий: функция запоминает окружение своего места определения.",
      ),
    ]),
    iq("js.execution-context-scope.i5", "intermediate", "Чем `var` отличается от `let` по области видимости?", [
      ul(
        "`var` — область функции: из блока `if`/`for` она видна во всей функции; `let` — только в блоке.",
        "`var` на верхнем уровне классического скрипта становится свойством `window`; `let` — нет.",
        "`var` можно объявлять повторно, `let` — нет (`SyntaxError`).",
      ),
    ]),
    iq("js.execution-context-scope.i6", "advanced", "Что такое контекст исполнения и стек вызовов?", [
      ul(
        "Контекст — запись, в которой выполняется код: окружения имён и `this`; создаётся для скрипта, модуля и каждого вызова функции.",
        "Активные контексты образуют стек: вызов добавляет контекст, возврат снимает.",
        "Окружение вызова остаётся в памяти, пока на него ссылается созданная внутри функция (замыкание).",
      ),
    ]),
    iq("js.execution-context-scope.i7", "engineering", "Как избежать глобальных переменных и конфликтов имён на странице?", [
      ul(
        "Использовать модули (`type=\"module\"`): собственная область и строгий режим.",
        "`const`/`let` вместо `var`, минимальная область; передавать зависимости параметрами.",
        "Линтер (`no-undef`, `no-shadow`, `no-redeclare`) и строгий режим.",
        "Для старых скриптов — IIFE или отдельные пространства имён, но лучше миграция на модули.",
      ),
    ]),
    iq("js.execution-context-scope.i8", "debugging", "Функция вернула не то значение: «видит» не ту переменную. Как вы разберётесь?", [
      ul(
        "Найти объявления этого имени в цепочке **написанной** (не вызывающей) областей: ближайшее побеждает.",
        "Искать затенение: одноимённые параметры, `let`/`const` ниже в том же блоке (TDZ), `var` в блоке.",
        "Остановиться отладчиком и посмотреть панель Scope: порядок областей и значения.",
        "Переименовать затеняющие переменные и включить `no-shadow`.",
      ),
    ]),
  ],

  exam: [
    mcq("js.execution-context-scope.e1", "foundation", "Что выведет `console.log(typeof v); var v = 1;`?", ["`\"number\"`", "`ReferenceError`", "`\"undefined\"`", "`\"object\"`"], 2, "`var v` регистрируется при входе в область со значением `undefined`; присваивание происходит по месту."),
    mcq("js.execution-context-scope.e2", "foundation", "Что произойдёт при обращении к `let x` до строки его объявления?", ["`ReferenceError: Cannot access 'x' before initialization`", "Получим `undefined`", "`TypeError`", "Получим `null`"], 0, "`let` находится в TDZ с начала области до строки объявления."),
    mcq("js.execution-context-scope.e3", "intermediate", "Какое значение вернёт `show()`, определённая на верхнем уровне, если вызвана из функции с локальной `owner`?", ["Локальную `owner` вызывающей функции", "Ошибку `ReferenceError`", "`undefined`", "`owner` из места определения `show`"], 3, "Область видимости лексическая: определяется местом написания функции (замер: `глобальный`)."),
    mcq("js.execution-context-scope.e4", "intermediate", "Что вернёт `function f() { if (true) { var a = 1; } return typeof a; }`?", ["`\"undefined\"`", "`\"number\"`", "`ReferenceError`", "`\"object\"`"], 1, "`var` игнорирует блок и принадлежит функции, поэтому после `if` значение доступно."),
    mcq("js.execution-context-scope.e5", "intermediate", "Какие из объявлений создают свойство глобального объекта `window` в классическом скрипте? Выберите все.", ["`var a = 1`", "`let b = 2`", "`function f() {}`", "`const c = 3`"], [0, 2], "`var` и объявления функций становятся свойствами `window`; `let`, `const`, `class` — нет (замер)."),
    mcq("js.execution-context-scope.e6", "advanced", "Почему в блоке `{ console.log(n); const n = 1; }` при внешней `const n = 0` будет `ReferenceError`?", ["`const` нельзя использовать в блоке", "`console.log` не видит переменные", "Внешняя `n` удалена", "Внутренняя `n` уже зарегистрирована и затеняет внешнюю, находясь в TDZ"], 3, "Объявление в блоке регистрируется при входе в блок и затеняет внешнюю переменную во всём блоке."),
    open("js.execution-context-scope.e7", "intermediate", "Объясните, как JavaScript находит значение переменной при обращении к имени.", [
      ul(
        "Движок начинает с текущей области (блок/функция) и ищет имя в её окружении.",
        "Если не найдено — переходит к внешней области (по лексической цепочке: по месту написания) и так до глобальной.",
        "Нашли — берём значение; если привязка в TDZ — `ReferenceError`; не нашли нигде — `ReferenceError: … is not defined`.",
        "Ближайшее совпадение побеждает — отсюда затенение.",
      ),
    ], ["Описан порядок поиска", "Упомянута лексическая цепочка", "Названы ошибки при неудаче"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.execution-context-scope.m1", "intermediate", "Что выведет `function f() { console.log(a); var a = 2; } var a = 1; f();`?", ["`1`", "`2`", "`undefined`", "`ReferenceError`"], 2, "Внутри `f` своя `var a` затеняет внешнюю с начала функции и до присваивания равна `undefined`."),
    mcq("js.execution-context-scope.m2", "advanced", "Что произойдёт, если во втором `<script>` страницы написать `let b = 3;`, а в первом уже есть `let b = 2;`?", ["Второй `b` затенит первый", "`SyntaxError: Identifier 'b' has already been declared`, второй скрипт не выполнится", "`b` станет свойством `window`", "Ничего, значения объединятся"], 1, "Классические скрипты делят одну глобальную область; повторное объявление `let` — `SyntaxError` (замер в Chromium)."),
    mcq("js.execution-context-scope.m3", "advanced", "Какие переменные внешней функции видит вкладка Scope→Closure для вложенной функции?", ["Только те, которые использует вложенная функция", "Все переменные внешней функции", "Только параметры", "Никакие"], 0, "В замере отладчика Chromium в `closure` попали `outerVar` и `captured`, но не `param`: V8 хранит в контексте только нужные переменные."),
    open("js.execution-context-scope.m4", "advanced", "На странице три скрипта из разных команд; после добавления четвёртого всё сломалось: «x is not defined» в одном и «Identifier already declared» в другом. Предложите диагностику и решение.", [
      ul(
        "Диагностика: по сообщениям определить вид ошибки (`ReferenceError` — имя не найдено или TDZ; `SyntaxError` — повторное `let` в общей глобальной области), в DevTools найти скрипты и порядок их выполнения.",
        "Причина: классические скрипты делят глобальную область: конфликты `let`/`const`, зависимость от порядка загрузки и от переменных, которых ещё нет.",
        "Решение: перевести код на модули (`type=\"module\"`, `import`/`export`) — у каждого своя область; общее состояние — через явный экспорт.",
        "Временная мера: обернуть скрипт в IIFE; не перенасыщать `window`; задать порядок через `defer`.",
        "Профилактика: линтер, правила именования, проверка конфликтов в CI.",
      ),
    ], ["Диагностика по сообщениям", "Названа причина (общая глобальная область)", "Предложен переход на модули", "Профилактика"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.execution-context-scope.f1", front: "Hoisting?", back: "Имена регистрируются при входе в область: var = undefined, функции готовы, let/const/class — в TDZ." },
    { id: "js.execution-context-scope.f2", front: "TDZ?", back: "От начала области до строки let/const/class: обращение (даже typeof) → ReferenceError «Cannot access … before initialization»." },
    { id: "js.execution-context-scope.f3", front: "Лексическая область?", back: "Имена функции определяются местом её написания, не местом вызова." },
    { id: "js.execution-context-scope.f4", front: "var против let?", back: "var — область функции, повторно объявляется, попадает в window (в скрипте); let — блок, без повторов." },
    { id: "js.execution-context-scope.f5", front: "Затенение?", back: "Внутреннее объявление скрывает внешнее одноимённое только внутри своей области; в TDZ — во всём блоке." },
    { id: "js.execution-context-scope.f6", front: "ReferenceError и SyntaxError?", back: "ReferenceError — при выполнении (нет имени/TDZ); SyntaxError — при разборе (повторное let, const без значения)." },
    { id: "js.execution-context-scope.f7", front: "Несколько скриптов?", back: "Классические делят глобальную область (let b дважды → SyntaxError); модуль — своя область." },
  ],

  sources: [
    { title: "ECMAScript: Executable Code and Execution Contexts", url: "https://tc39.es/ecma262/#sec-executable-code-and-execution-contexts", publisher: "ECMA" },
    { title: "ECMAScript: Environment Records", url: "https://tc39.es/ecma262/#sec-environment-records", publisher: "ECMA" },
    { title: "ECMAScript: Let and Const Declarations (TDZ)", url: "https://tc39.es/ecma262/#sec-let-and-const-declarations", publisher: "ECMA" },
    { title: "ECMAScript: FunctionDeclarationInstantiation", url: "https://tc39.es/ecma262/#sec-functiondeclarationinstantiation", publisher: "ECMA" },
    { title: "MDN: Hoisting", url: "https://developer.mozilla.org/en-US/docs/Glossary/Hoisting", publisher: "MDN" },
    { title: "MDN: Scope", url: "https://developer.mozilla.org/en-US/docs/Glossary/Scope", publisher: "MDN" },
    { title: "MDN: let (временная мёртвая зона)", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone_tdz", publisher: "MDN" },
    { title: "MDN: ReferenceError", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError", publisher: "MDN" },
    { title: "Chrome DevTools Protocol: Debugger domain", url: "https://chromedevtools.github.io/devtools-protocol/tot/Debugger/", publisher: "Other" },
  ],
};
