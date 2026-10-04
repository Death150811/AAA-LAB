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
  wrongRight,
} from "../../dsl";

export const functionsBasics: Topic = {
  id: "js.functions-basics",
  slug: "functions-basics",
  domain: "js",
  module: "functions",
  title: "Функции: объявление, параметры и возврат значения",
  titleEn: "Functions: declarations, parameters and return values",
  summary:
    "Функция в JavaScript — значение, которое можно хранить в переменной, передавать и возвращать. Тема разбирает три формы записи (объявление, выражение, стрелка) и разницу между ними во времени появления (объявление доступно до своей строки, выражение — нет), параметры (недостающие равны `undefined`, значение по умолчанию подставляется только при `undefined`, вычисляется при каждом вызове и видит предыдущие параметры), `rest` и устаревший `arguments`, возврат значения и ловушку `return` с переводом строки, стрелочные функции без собственного `arguments` и конструктора, а также чистые функции и побочные эффекты. Все результаты — замеры в Node.js 22 и Chromium 141.",
  minutes: 55,
  prerequisites: ["js.control-flow"],
  tags: ["function", "arrow function", "parameters", "default parameters", "rest", "arguments", "return", "hoisting", "IIFE", "callback", "pure function", "first-class"],
  keyConcepts: [
    { term: "Функция — это значение", text: "`typeof f` — `\"function\"`, но это объект: функцию можно положить в массив, передать как колбэк, вернуть из другой функции. Две функции с одинаковым текстом не равны (`f1 === f2` — `false`)." },
    { term: "Объявление доступно раньше, чем выражение", text: "`declared(2)` работает до строки объявления, а `expressed(2)` до строки присваивания — `ReferenceError: Cannot access 'expressed' before initialization`; у `var` — `TypeError: viaVar is not a function`." },
    { term: "Параметры не проверяются по числу", text: "Недостающие аргументы — `undefined`, лишние игнорируются. Значение по умолчанию подставляется **только** при `undefined`: `greet(null)` дало `Привет, null!`." },
    { term: "`return` и перевод строки", text: "`return`, а на следующей строке `{ ok: true }` вернёт `undefined`: движок вставляет `;` после `return`. Начинайте возвращаемое выражение на той же строке." },
    { term: "Стрелка — не «короткая запись» функции", text: "У стрелочной функции нет собственных `this` и `arguments`, она не конструктор (`new arrow()` — `TypeError: arrow is not a constructor`) и у неё нет `prototype`." },
  ],
  sections: [
    section("definition", [
      def("Функция", "Объект, который можно вызвать: принимает значения (аргументы), выполняет тело и возвращает результат. Первоклассное значение: хранится в переменных, передаётся и возвращается.", "function"),
      def("Объявление функции", "Конструкция `function name() {}` в позиции оператора. Создаётся при входе в область видимости, поэтому доступна до своей строки.", "function declaration"),
      def("Функциональное выражение", "Функция в позиции выражения (`const f = function () {}`): значение создаётся, когда выполнение доходит до этой строки.", "function expression"),
      def("Стрелочная функция", "Краткая форма `(a, b) => a + b` без собственных `this`, `arguments`, `super`, `new.target`; не может быть конструктором.", "arrow function"),
      def("Параметр и аргумент", "Параметр — имя в определении функции, аргумент — значение, переданное при вызове.", "parameter / argument"),
      def("Параметр по умолчанию", "Значение, которое подставляется, если аргумент не передан или равен `undefined`; вычисляется при каждом вызове.", "default parameter"),
      def("Rest-параметр", "Параметр `...name`, собирающий остальные аргументы в настоящий массив.", "rest parameter"),
      def("Побочный эффект", "Любое наблюдаемое действие функции, кроме возврата значения: изменение внешних данных, запись, вывод, обращение к сети. Функция без побочных эффектов, результат которой зависит только от аргументов, — чистая.", "side effect / pure function"),
    ]),

    section("why", [
      h("Всё остальное строится из функций"),
      p("Обработчики событий, колбэки, методы объектов, конструкторы, модули, асинхронный код, замыкания, функции высшего порядка — всё это функции. Ошибки здесь выглядят как «функция вернула `undefined`», «параметр равен не тому, что я передал», «функция есть, но я вызвал её слишком рано»."),
      ul(
        "**Предсказуемые сигнатуры:** вы заранее знаете, что произойдёт с недостающими и лишними аргументами.",
        "**Правильный выбор формы:** объявление, выражение или стрелка — по смыслу, а не по привычке.",
        "**Чистота и изоляция:** функции без побочных эффектов легко тестировать и повторно использовать.",
        "**Основа дальнейших тем:** замыкания, `this`, прототипы, `Promise` и `async/await` объясняются через функции.",
      ),
      insight("Функция — это **значение с поведением**. Относитесь к ней как к любому другому значению: её можно создать, сохранить, передать и вернуть — и это даёт половину силы JavaScript."),
    ]),

    section("mental-model", [
      p("Представьте **кухонный автомат с лотком**. Вы кладёте в лоток ингредиенты (аргументы), нажимаете кнопку (вызов), автомат что-то делает внутри (тело) и выдаёт результат (`return`). Если вы не положили один из ингредиентов, автомат берёт «пустую ячейку» (`undefined`) — или запасной ингредиент, если он задан (`= значение`). Лишние ингредиенты автомат просто не замечает. Если кнопки `return` нет, на выходе всегда «ничего» (`undefined`). И главное: **автомат — это тоже предмет**: его можно переставить на другую полку (переменную), отдать соседу (передать в другую функцию) или поставить на конвейер как часть другого автомата (вернуть из функции)."),
      table(
        ["Форма", "Когда доступна", "Свои `this`/`arguments`", "Можно `new`", "Типичное применение"],
        [
          ["Объявление `function f() {}`", "С начала области видимости", "Да", "Да", "Именованные функции верхнего уровня"],
          ["Выражение `const f = function () {}`", "После выполнения строки", "Да", "Да", "Значение, присваиваемое/передаваемое"],
          ["Стрелка `const f = () => {}`", "После выполнения строки", "Нет (берёт из окружения)", "Нет", "Колбэки, короткие преобразования"],
          ["Метод `{ m() {} }`", "С созданием объекта", "Да", "Нет", "Методы объектов и классов"],
        ],
        "Формы функций",
      ),
    ]),

    section("technical", [
      h("Три формы записи"),
      p("Замер (Node.js 22.22.0, модуль): все три формы дают равный результат, но различаются **моментом, когда имя становится доступным**."),
      code("js", `// 1. Объявление функции: поднимается целиком — вызывать можно до строки объявления
console.log(declared(2));
function declared(x) { return x * 2; }

// 2. Функциональное выражение: само значение появляется только при выполнении строки
try {
  expressed(2);
} catch (e) {
  console.log(e.name + ": " + e.message);
}
const expressed = function (x) { return x * 2; };

// 3. Стрелочная функция — тоже выражение
const arrow = (x) => x * 2;
console.log(expressed(2), arrow(2));

// 4. С var к моменту вызова имя уже есть, но равно undefined
try {
  viaVar(2);
} catch (e) {
  console.log(e.name + ": " + e.message);
}
var viaVar = (x) => x * 2;

// имя и число параметров
function add(a, b = 1, ...rest) { return a + b; }
const anon = () => {};
const named = function inner() { return typeof inner; };
console.log(add.name, add.length, anon.name, named.name, named(), typeof inner);
const obj = { method() {}, prop: () => {} };
console.log(obj.method.name, obj.prop.name);`, { filename: "f1-forms.mjs", lineNumbers: true }),
      code("text", `4
ReferenceError: Cannot access 'expressed' before initialization
4 4
TypeError: viaVar is not a function
add 1 anon inner function undefined
method prop`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Объявление поднимается целиком:** `declared(2)` вызвана раньше строки объявления и вернула `4`.",
        "**Выражение с `const`** до выполнения строки недоступно: `ReferenceError: Cannot access 'expressed' before initialization` (временная мёртвая зона).",
        "**Выражение с `var`:** имя существует (со значением `undefined`), поэтому `TypeError: viaVar is not a function` — другая ошибка, чем для `const`.",
        "**Имя функции** `fn.name` берётся из объявления, из имени переменной (`anon.name` — `anon`) или из ключа объекта (`obj.prop.name` — `prop`). Имя именованного выражения (`inner`) видно **только внутри** функции: снаружи `typeof inner` — `undefined`.",
        "**`fn.length`** — число параметров до первого со значением по умолчанию или `rest`: у `add(a, b = 1, ...rest)` это `1`.",
      ),
      note("Подробно поднятие объявлений и временная мёртвая зона разбираются в теме о контексте исполнения. Пока достаточно практического правила: **определяйте функции до их использования** и пользуйтесь `const` для выражений."),

      h("Параметры и аргументы"),
      code("js", `function show(a, b) { return [a, b]; }
console.log(show(1), show(1, 2, 3));        // недостающие — undefined, лишние игнорируются

function greet(name = "гость", punct = "!") { return \`Привет, \${name}\${punct}\`; }
console.log(greet(), greet(undefined), greet(null), greet("Аня", "?"), greet(""));

// значение по умолчанию вычисляется при КАЖДОМ вызове
let calls = 0;
function id(list = (calls++, [])) { list.push(1); return list; }
const a = id(), b = id();
console.log(a === b, calls, a, b);

// в выражении по умолчанию видны предыдущие параметры
function rect(w, h = w) { return w * h; }
console.log(rect(3), rect(3, 4));

// rest собирает остаток в настоящий массив
function sum(first, ...rest) { return rest.reduce((acc, n) => acc + n, first); }
console.log(sum(1), sum(1, 2, 3), Array.isArray((function (...r) { return r; })(1, 2)));

// arguments — устаревший «почти массив»
function legacy() { return [arguments.length, Array.isArray(arguments), typeof arguments[0]]; }
console.log(legacy("x", 2));

// length считает параметры до первого со значением по умолчанию или rest
console.log(((a, b) => 0).length, ((a, b = 1) => 0).length, ((...r) => 0).length);

// объект передаётся по ссылке-значению: переприсвоение параметра не видно снаружи, изменение содержимого — видно
function mutate(user) { user.name = "Борис"; user = { name: "Вера" }; }
const user = { name: "Аня" };
mutate(user);
console.log(user.name);`, { filename: "f2-params.mjs", lineNumbers: true }),
      code("text", `[ 1, undefined ] [ 1, 2 ]
Привет, гость! Привет, гость! Привет, null! Привет, Аня? Привет, !
false 2 [ 1 ] [ 1 ]
9 12
1 6 true
[ 2, false, 'string' ]
2 1 0
Борис`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Число аргументов не проверяется:** `show(1)` → `[1, undefined]`, а `show(1, 2, 3)` — третий аргумент игнорируется (но доступен через `arguments`/`rest`).",
        "**Значение по умолчанию — только для `undefined`:** `greet()` и `greet(undefined)` — «гость», но `greet(null)` — `Привет, null!`, а `greet(\"\")` — пустое имя. Для `null` и пустых значений используйте `??` в теле.",
        "**Вычисляется при каждом вызове:** выражение `(calls++, [])` выполнилось дважды (`calls` — `2`), а два вызова вернули **разные** массивы (`a === b` — `false`). В отличие от некоторых других языков, изменяемое значение по умолчанию безопасно.",
        "**Видны предыдущие параметры:** `rect(w, h = w)` — `rect(3)` → `9`. Обратное (`a = b` до объявления `b`) даёт `ReferenceError: Cannot access 'b' before initialization`.",
        "**`rest`** (`...rest`) — настоящий массив (`Array.isArray` — `true`), в отличие от `arguments`.",
        "**`arguments`** — «почти массив» (длина есть, но `Array.isArray(arguments)` — `false`); есть только в обычных функциях. В новом коде используйте `rest`.",
        "**Передача объектов:** внутри функции параметр — копия ссылки: изменение `user.name` видно снаружи (`Борис`), но переприсваивание `user = { … }` — нет.",
      ),

      h("Возврат значения"),
      code("js", `function noReturn() { const x = 1; }
console.log(noReturn());

// return + перевод строки: после return вставляется «;»
function trap() {
  return
  { ok: true };
}
console.log(trap());

function fixed() {
  return {
    ok: true,
  };
}
console.log(fixed());

// стрелка с телом-блоком и без
const a = () => { ok: true };               // это блок с меткой, а не объект
const b = () => ({ ok: true });             // скобки превращают {} в литерал объекта
console.log(a(), b());

// ранний возврат и единственный результат
function sign(n) {
  if (n < 0) return -1;
  if (n > 0) return 1;
  return 0;
}
console.log([-5, 0, 7].map(sign));

// возвращать можно только одно значение — несколько упаковывают
const minMax = (xs) => [Math.min(...xs), Math.max(...xs)];
const [lo, hi] = minMax([3, 9, 1]);
console.log(lo, hi);`, { filename: "f3-return.mjs", lineNumbers: true }),
      code("text", `undefined
undefined
{ ok: true }
undefined { ok: true }
[ -1, 0, 1 ]
1 9`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Нет `return` — результат `undefined`.** Стрелка без `return` в теле-блоке тоже возвращает `undefined`.",
        "**Ловушка с переводом строки:** после `return` на отдельной строке движок вставляет `;` (автоматическая расстановка точек с запятой), поэтому `return`, за которым на следующей строке идёт `{ ok: true }`, вернул `undefined`. Начинайте возвращаемое выражение на строке с `return`.",
        "**Стрелка и объект:** в `() => { ok: true }` фигурные скобки — блок, а `ok:` — метка; результат `undefined`. Чтобы вернуть объект из стрелки с коротким телом, берите литерал в скобки: `() => ({ ok: true })`.",
        "**Одно возвращаемое значение:** нескольких значений нет — возвращайте массив или объект и распаковывайте (`const [lo, hi] = minMax(xs)`).",
        "**Ранние возвраты** (`return -1`, `return 1`, `return 0`) делают код плоским; подробнее — в теме об управляющих конструкциях.",
      ),

      h("Функция как значение"),
      code("js", `const double = (x) => x * 2;

// функция — значение: можно хранить, передавать, возвращать
const table = { double, square: (x) => x * x };
console.log(table.square(5), [double, table.square].map((f) => f(3)));

function compose(f, g) { return (x) => f(g(x)); }
console.log(compose(double, (x) => x + 1)(4));

// колбэк — функция, которую вызывает другой код
console.log([1, 2, 3].map(double));

// классическая ловушка: map передаёт (элемент, индекс, массив)
console.log(["1", "2", "3"].map(parseInt));
console.log(["1", "2", "3"].map((s) => parseInt(s, 10)));
console.log(["1", "2", "3"].map(Number));

// функции — объекты: сравнение по ссылке, свойства
const f1 = () => 1, f2 = () => 1;
console.log(f1 === f2, f1 === f1, typeof f1, f1 instanceof Object);
f1.calls = 0;
console.log(f1.calls);

// вызов через call/apply
function who(greeting) { return greeting + ", " + this.name; }
console.log(who.call({ name: "Аня" }, "Привет"));`, { filename: "f4-values.mjs", lineNumbers: true }),
      code("text", `25 [ 6, 9 ]
10
[ 2, 4, 6 ]
[ 1, NaN, NaN ]
[ 1, 2, 3 ]
[ 1, 2, 3 ]
false true function true
0
Привет, Аня`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Хранение и передача:** функции лежат в объекте и массиве, `compose(f, g)` возвращает новую функцию.",
        "**Колбэк:** функция, которую вызывает чужой код (`map` вызвал `double` для каждого элемента).",
        "**Ловушка `map(parseInt)`:** `map` передаёт `(элемент, индекс, массив)`, а `parseInt(строка, основание)` принимает индекс как основание — результат `[1, NaN, NaN]`. Передавайте обёртку `(s) => parseInt(s, 10)` или `Number`.",
        "**Функции — объекты:** `f1 === f2` — `false` для двух одинаковых по тексту функций; можно добавить свойство (`f1.calls`).",
        "**`call`/`apply`:** вызов функции с заданным `this` (подробно — в теме о `this`).",
      ),

      h("Стрелки и обычные функции"),
      code("js", `function Regular() { this.ok = true; }
const arrow = () => {};

console.log(typeof new Regular());
try { new arrow(); } catch (e) { console.log(e.name + ": " + e.message); }

// у стрелочной функции нет собственного arguments — она видит arguments внешней функции
function outer() {
  const inner = () => arguments[0];
  return inner("внутренний");
}
console.log(outer("внешний"));

console.log("prototype" in Regular, "prototype" in arrow);

// IIFE: выражение, которое вызывается сразу; создаёт локальную область
const counter = (function () {
  let n = 0;
  return { inc: () => ++n };
})();
counter.inc();
console.log(counter.inc(), typeof n);`, { filename: "f5-arrow.mjs", lineNumbers: true }),
      code("text", `object
TypeError: arrow is not a constructor
внешний
true false
2 undefined`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Не конструктор:** `new arrow()` — `TypeError: arrow is not a constructor`; у стрелки нет свойства `prototype` (`\"prototype\" in arrow` — `false`).",
        "**Нет собственного `arguments`:** стрелка внутри `outer(\"внешний\")` видит **`arguments` внешней функции**: вызов `inner(\"внутренний\")` вернул `внешний`.",
        "**Нет собственного `this`:** стрелка берёт `this` из окружения, в котором создана (тема о `this` и прототипах).",
        "**IIFE** (немедленно вызываемое выражение) создаёт локальную область: `n` недоступна снаружи (`typeof n` — `undefined`). В модульном коде IIFE почти не нужна — модуль сам изолирует переменные.",
      ),

      h("Чистые функции и побочные эффекты"),
      p("Чистая функция зависит только от аргументов и ничего не меняет вне себя: `sign(n)`, `minMax(xs)`, `area(w, h)`. Функция с побочными эффектом — `addSharedTag(tag)`, которая меняет внешний массив, — возвращает разные результаты при одинаковых вызовах. Чистые функции легче тестировать, переиспользовать и распараллеливать; побочные эффекты нужно **выделять** (ввод-вывод, DOM, сеть) и держать на краях программы."),
      code("js", `// Значение по умолчанию вычисляется при каждом вызове, поэтому изменяемый «запасной» массив не общий
function addTag(tag, tags = []) {
  tags.push(tag);
  return tags;
}
const first = addTag("a");
const second = addTag("b");
console.log(first, second, first === second);

// а вот переменная вне функции — общая
const shared = [];
function addSharedTag(tag) {
  shared.push(tag);
  return shared;
}
console.log(JSON.stringify(addSharedTag("a")), JSON.stringify(addSharedTag("b")));

// предыдущие параметры доступны, а последующие — нет
function area(width, height = width) { return width * height; }
console.log(area(4), area(4, 5));
try {
  (function bad(a = b, b = 1) { return a; })();
} catch (e) {
  console.log(e.name + ": " + e.message);
}`, { filename: "x3-defaults.mjs" }),
      code("text", `[ 'a' ] [ 'b' ] false
["a"] ["a","b"]
16 20
ReferenceError: Cannot access 'b' before initialization`, { filename: "вывод Node.js 22.22.0" }),
    ]),

    section("syntax", [
      annotated(
        "js",
        `function add(a, b = 0) {          // объявление функции
  return a + b;
}

const multiply = function (a, b) {  // функциональное выражение
  return a * b;
};

const square = (x) => x * x;      // стрелочная функция с выражением вместо тела

const total = (...numbers) => numbers.reduce((sum, n) => sum + n, 0);

console.log(add(2, 3), multiply(2, 3), square(4), total(1, 2, 3));`,
        [
          { line: [1, 3], text: "Объявление функции: ключевое слово `function`, имя, параметры в скобках (у `b` — значение по умолчанию), тело в `{}`; `return` возвращает результат." },
          { line: [5, 7], text: "Функциональное выражение: функция присваивается константе; точка с запятой после `}` нужна, как после любого присваивания." },
          { line: 9, text: "Стрелочная функция с одним параметром и телом-выражением: `x * x` возвращается автоматически, `return` не нужен." },
          { line: 11, text: "Rest-параметр `...numbers` собирает все аргументы в массив; `reduce` суммирует их, начиная с `0`." },
          { line: 13, text: "Вызов функции: круглые скобки со списком аргументов; результат вызова — значение выражения." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Цена со скидкой</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 30rem; }
  label { display: block; margin-block: .5rem; }
  output { display: block; margin-top: .75rem; font-weight: 600; }
</style>
<h1>Цена со скидкой</h1>
<form id="f">
  <label>Цена, ₽ <input name="price" value="1999" inputmode="decimal"></label>
  <label>Скидка, % <input name="discount" value="" inputmode="decimal" placeholder="по умолчанию 10"></label>
</form>
<output id="out" aria-live="polite"></output>
<script type="module">
  // 1. функция с параметром по умолчанию и проверкой входа
  function discounted(price, percent = 10) {
    if (!Number.isFinite(price) || price < 0) return null;
    return Math.round(price * (100 - percent)) / 100;
  }

  // 2. стрелочная функция-форматтер
  const rub = (n) => n.toLocaleString("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 2 });

  // 3. функция как значение: передаётся как обработчик события
  function update() {
    const price = Number(f.elements.price.value);
    const raw = f.elements.discount.value.trim();
    const result = discounted(price, raw === "" ? undefined : Number(raw));   // undefined → значение по умолчанию
    out.textContent = result === null ? "Введите цену" : \`Итого: \${rub(result)}\`;
  }

  f.addEventListener("input", update);
  update();
</script>`, { filename: "price-form.html", runnable: true, lineNumbers: true }),
      p("Страница использует все три формы: объявление `discounted` (с параметром по умолчанию и проверкой входа), стрелку `rub` и функцию `update`, переданную как обработчик события. Замер в Chromium 141: при пустой скидке — «Итого: 1 799,10 ₽» (подставлено значение по умолчанию 10 %), при скидке 25 — «Итого: 1 499,25 ₽», при цене `abc` — «Введите цену»; ошибок страницы нет."),
    ]),

    section("detailed-example", [
      p("Функция `range`, аналог Python-`range`: `range(5)` → `[0, 1, 2, 3, 4]`, `range(2, 5)` → `[2, 3, 4]`, `range(5, 0, -2)` → `[5, 3, 1]`. Один вызов принимает от одного до трёх аргументов — это пример функции с **переменной сигнатурой** на `rest`-параметре, проверкой входа и ранними ошибками."),
      code("js", `export function range(...args) {
  if (args.length === 0 || args.length > 3) throw new TypeError("range принимает от 1 до 3 аргументов");
  const [start, end, step] = args.length === 1 ? [0, args[0], 1] : [args[0], args[1], args[2] ?? 1];
  if (![start, end, step].every(Number.isFinite)) throw new TypeError("Аргументы должны быть конечными числами");
  if (step === 0) throw new RangeError("Шаг не может быть равен нулю");

  const result = [];
  if (step > 0) for (let n = start; n < end; n += step) result.push(n);
  else for (let n = start; n > end; n += step) result.push(n);
  return result;
}`, { filename: "range.mjs", lineNumbers: true }),
      code("js", `import { range } from "./range.mjs";

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const cases = [
  [[5], [0, 1, 2, 3, 4]],
  [[2, 5], [2, 3, 4]],
  [[0, 10, 3], [0, 3, 6, 9]],
  [[5, 0, -2], [5, 3, 1]],
  [[3, 3], []],
  [[0, 1, 0.25], [0, 0.25, 0.5, 0.75]],
  [[5, 0], []],
  [[0], []],
];
let failed = 0;
for (const [args, expected] of cases) {
  const got = range(...args);
  if (!eq(got, expected)) { failed++; console.log("FAIL", JSON.stringify(args), JSON.stringify(got)); }
}
const throwsCases = [[[], TypeError], [[1, 2, 3, 4], TypeError], [[0, 5, 0], RangeError], [["a"], TypeError], [[0, NaN], TypeError]];
for (const [args, type] of throwsCases) {
  try { range(...args); failed++; console.log("FAIL: нет ошибки", JSON.stringify(args)); }
  catch (e) { if (!(e instanceof type)) { failed++; console.log("FAIL тип", JSON.stringify(args), e.name); } }
}
console.log(failed === 0 ? \`Все \${cases.length + throwsCases.length} проверок пройдены\` : \`Провалено: \${failed}\`);
console.log(JSON.stringify(range(5)), JSON.stringify(range(2, 5)), JSON.stringify(range(5, 0, -2)));`, { filename: "range-test.mjs", collapsed: true }),
      code("text", `Все 13 проверок пройдены
[0,1,2,3,4] [2,3,4] [5,3,1]`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает", "Почему так"],
        [
          ["`range(...args)`", "Принимает произвольное число аргументов в массиве", "В JavaScript нет перегрузки функций по числу параметров; её имитируют через `rest`"],
          ["`args.length === 1 ? [0, args[0], 1] : [args[0], args[1], args[2] ?? 1]`", "Разбирает сигнатуры `range(end)` и `range(start, end, step)`", "`?? 1` подставляет шаг, если третьего аргумента нет; `||` испортил бы нулевой шаг (мы его отвергаем отдельно)"],
          ["`[start, end, step].every(Number.isFinite)`", "Проверяет типы и значения сразу", "`Number.isFinite` не приводит тип (`\"5\"` и `NaN` отвергаются), в отличие от глобальной `isFinite`"],
          ["`if (step === 0) throw new RangeError(…)`", "Отвергает нулевой шаг", "Нулевой шаг дал бы бесконечный цикл; ошибка выбрасывается **до** цикла"],
          ["Два цикла для `step > 0` и `step < 0`", "Выбирает направление", "Условие `n < end` для возрастающей последовательности и `n > end` для убывающей"],
        ],
        "Разбор функции range",
      ),
      ul(
        "Все 13 проверок проходят: 8 корректных вызовов (в том числе пустые результаты `range(3, 3)`, `range(5, 0)`, `range(0)` и дробный шаг) и 5 вызовов с ошибками (`TypeError` и `RangeError`).",
        "Функция **чистая**: не меняет входные данные, зависит только от аргументов и каждый раз возвращает новый массив.",
        "Контракт функции (сколько аргументов, какие значения, какие ошибки) — часть её документации; его фиксируют тесты.",
      ),
    ]),

    section("internals", [
      h("Что происходит при вызове"),
      p("При вызове движок создаёт **контекст исполнения** функции со своим окружением: параметры становятся локальными переменными, ссылка на внешнее окружение запоминается (так работают замыкания), создаётся `this` (для обычных функций). После `return` контекст снимается со стека вызовов. Бесконечная рекурсия исчерпывает стек и даёт `RangeError: Maximum call stack size exceeded` — об этом в теме о рекурсии."),
      h("Откуда `undefined` у недостающих аргументов"),
      p("Параметры — это обычные локальные переменные, инициализируемые переданными значениями; для непереданных остаётся значение по умолчанию (`undefined`). Поэтому функция не может отличить «аргумент не передан» от «передан `undefined`» (кроме как через `arguments.length` или `rest`)."),
      h("Область видимости параметров по умолчанию"),
      p("Когда у функции есть значения по умолчанию, параметры образуют **собственную область видимости**, в которой выражения вычисляются слева направо. Поэтому `h = w` видит `w`, а `a = b` для ещё не инициализированного `b` — `ReferenceError` (замер)."),
      h("Автоматическая расстановка `;` (ASI)"),
      p("Если после `return`, `break`, `continue`, `throw` стоит перевод строки, парсер вставляет точку с запятой сразу после ключевого слова. Поэтому `return` с выражением на следующей строке — это `return;` и отдельный блок (замер: `undefined`). Эту ловушку нельзя «исправить» привычками — только форматированием: выражение начинается на строке с `return`."),
      h("Как `map` вызывает функции"),
      p("`Array.prototype.map(callback)` вызывает `callback(element, index, array)` — три аргумента. Функция, принимающая необязательные дополнительные параметры (как `parseInt(string, radix)`), получит **не те** значения (замер `[1, NaN, NaN]`). Поэтому колбэки с чужой сигнатурой оборачивают: `(s) => parseInt(s, 10)`."),
    ]),

    section("mistakes", [
      h("Ошибка 1. `return` и перевод строки"),
      wrongRight(
        "js",
        {
          code: `
            function makeRole() {
              return
              { role: "user" };      // return; и отдельный блок
            }
          `,
          note: "Замер: `makeRoleBad()` вернула `undefined` — после `return` вставляется `;`.",
        },
        {
          code: `
            function makeRole() {
              return { role: "user" };
            }
          `,
          note: "Выражение начинается на той же строке, что и `return`.",
        },
      ),
      h("Ошибка 2. Стрелка с телом-блоком вместо литерала объекта"),
      p("`const wrap = (value) => { value };` возвращает `undefined` (в фигурных скобках — блок). Верно: `(value) => ({ value })` (замер: `wrap(1)` → `{ value: 1 }`)."),
      h("Ошибка 3. `map(parseInt)`"),
      p("`[\"1\", \"2\", \"3\"].map(parseInt)` — `[1, NaN, NaN]`: индекс становится основанием системы счисления. Пишите `.map(Number)` или `.map((s) => parseInt(s, 10))`."),
      h("Ошибка 4. Вызывать выражение до его определения"),
      p("`expressed(2)` до `const expressed = …` — `ReferenceError`; для `var` — `TypeError: … is not a function`. Определяйте функции раньше использования или используйте объявления."),
      h("Ошибка 5. Ждать значение по умолчанию для `null`"),
      p("`greet(null)` печатает `Привет, null!`: значение по умолчанию подставляется только при `undefined`. Для `null` и пустых значений проверяйте явно (`name ?? \"гость\"`)."),
      h("Ошибка 6. Мутировать аргументы"),
      p("`mutate(user)` изменила `user.name` вызывающего кода (замер: `Борис`). Если функция должна вернуть изменённую копию, создавайте новый объект и документируйте контракт."),
      h("Ошибка 7. Использовать `arguments` в стрелке"),
      p("У стрелки нет своего `arguments`: она видит `arguments` внешней функции (замер: `внешний`) или в модуле верхнего уровня — ничего. Используйте `rest`."),
      h("Ошибка 8. Вызывать стрелку как конструктор"),
      p("`new arrow()` — `TypeError: arrow is not a constructor`. Для конструкторов используйте `function` или `class`."),
    ]),

    section("antipatterns", [
      ul(
        "**Функции с побочными эффектами и скрытыми зависимостями** от глобальных переменных.",
        "**Слишком много параметров** (больше 3–4): передавайте объект параметров или разделите функцию.",
        "**Булевы «флаги» в сигнатуре** (`render(data, true, false)`): вызов нельзя прочитать; используйте объект настроек или две функции.",
        "**`arguments` в новом коде,** а также `arguments.callee`.",
        "**Функции на сотни строк,** которые делают несколько вещей: разбивайте на именованные шаги.",
        "**Анонимные функции в трассировках:** давайте имена функциям, которые попадут в отладчик (`const handle = function handle() {}` или методы-объявления).",
        "**Возврат разных типов** в разных ветках (`number` или `\"error\"` или `undefined`): договоритесь об одном контракте.",
        "**Изменение входных объектов без явного названия** (`addTag` вместо `withTag`).",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Выбирайте форму по смыслу:** объявление — для именованных функций, стрелка — для колбэков и коротких преобразований, метод — для объектов.",
        "**Давайте функциям имена-глаголы** и фиксируйте контракт: что принимает, что возвращает, что бросает.",
        "**Один смысл — одна функция;** короткие функции проще тестировать.",
        "**Используйте параметры по умолчанию и `rest`** вместо `arguments` и ручных проверок `undefined`.",
        "**Проверяйте входные данные на границе** (`Number.isFinite`, типы) и бросайте понятные ошибки.",
        "**Предпочитайте чистые функции;** побочные эффекты выделяйте и держите на краях.",
        "**Оборачивайте колбэки с чужой сигнатурой** (`map((s) => parseInt(s, 10))`).",
        "**Начинайте `return` на одной строке с выражением** и заключайте литерал объекта в стрелке в скобки.",
      ),
      tip("Если функции нужно больше трёх параметров, подумайте об объекте параметров: `createUser({ name, role, active })` читается лучше, чем `createUser(\"Аня\", \"admin\", true)`. Деструктуризацию параметров вы изучите в одной из следующих тем."),
    ]),

    section("edge-cases", [
      h("Функции в блоках"),
      p("Объявление функции внутри блока (`if () { function f() {} }`) в модуле (строгий режим) видно только в этом блоке (замер: `typeof inBlock` после блока — `undefined`), а в нестрогом режиме сохранено историческое поведение: функция видна и снаружи (замер: `function`). Пишите `const f = () => {}` в блоке или выносите функцию."),
      h("Имя функции и минификаторы"),
      p("Свойство `fn.name` может измениться при минификации кода; не используйте его для логики приложения, только для диагностики."),
      h("`length` с параметрами по умолчанию"),
      p("`fn.length` считает параметры **до первого** со значением по умолчанию: `(a, b = 1) => 0` — `1`, `(a, b) => 0` — `2`, `(...r) => 0` — `0` (замер)."),
      h("Рекурсивные ссылки на себя"),
      p("Внутри именованного выражения его имя доступно только в теле (`inner`); снаружи — нет (`typeof inner` — `undefined`, замер). Это удобно для рекурсии в анонимных контекстах."),
      h("Вызов функции с `new` и без"),
      p("Обычная функция может вызываться и как конструктор (`new Regular()` вернёт объект); стрелка и метод-сокращение — нет. Для объектов лучше использовать классы (отдельная тема)."),
      h("Побочные эффекты в значениях по умолчанию"),
      p("Выражение по умолчанию вычисляется при каждом вызове без аргумента — включая побочные эффекты (в замере счётчик `calls` вырос на 2 при двух вызовах); не вставляйте туда тяжёлые вычисления и запросы."),
    ]),

    section("related", [
      ul(
        "[Управляющие конструкции](/learn/js/control-flow) — ранние возвраты и циклы внутри функций.",
        "[Операторы и приведение типов](/learn/js/operators-coercion) — `??`, `||` и значения по умолчанию.",
        "[Переменные и типы](/learn/js/variables-types) — `let`/`const`/`var` и передача по ссылке.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Скрытые зависимости и побочные эффекты",
          code: `
            var items = [];
            function addItem(name, price, taxFlag, discount) {
              if (!discount) discount = 10;           // 0 превращается в 10
              items.push({ name: name, price: price - price * discount / 100 });
              console.log("added");
              return
              items;
            }
          `,
          note: "Глобальный массив, булев флаг в сигнатуре, `||`-подобная замена нуля, побочный вывод и `return` с переводом строки.",
        },
        {
          title: "Чистая функция с ясным контрактом",
          code: `
            function withItem(items, { name, price }, discount = 10) {
              return [...items, { name, price: price * (100 - discount) / 100 }];
            }
          `,
          note: "Входные данные не меняются, скидка `0` сохраняется, возврат на одной строке, результат — новый массив.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.functions-basics.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Скажите, что напечатает каждая строка, и объясните: когда доступны объявление и выражение, как работают параметры по умолчанию для `undefined` и `null`, и почему `map(parseInt)` даёт странный результат."),
        code("js", `console.log(typeof hoisted, typeof later);
function hoisted() {}
var later = function () {};

function f(a, b = a + 1, ...rest) { return [a, b, rest.length]; }
console.log(f(1), f(1, undefined, 3, 4), f(1, null));
console.log(f.length);

console.log(["10", "10", "10"].map(parseInt));
const g = () => ({ ok: 1 });
console.log(g(), (() => {})());`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Когда появляются имена `hoisted` и `later` (`var`)?", "Что получает `parseInt` вторым аргументом от `map`?"],
      checks: ["Объяснено `function undefined`", "Объяснено поведение `f(1, null)`", "Объяснено `[10, NaN, 2]`"],
      solution: [
        code("text", `function undefined
[ 1, 2, 0 ] [ 1, 2, 2 ] [ 1, null, 0 ]
1
[ 10, NaN, 2 ]
{ ok: 1 } undefined`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "`typeof hoisted` — `function` (объявление поднято целиком), `typeof later` — `undefined` (`var` поднято, значение ещё не присвоено).",
          "`f(1)` → `[1, 2, 0]`: `b = a + 1`; `f(1, undefined, 3, 4)` → `b` снова по умолчанию, `rest` — `[3, 4]`; `f(1, null)` → `b = null`: по умолчанию подставляется только при `undefined`.",
          "`f.length` — `1`: считаются параметры до первого со значением по умолчанию.",
          "`[\"10\", \"10\", \"10\"].map(parseInt)` вызывает `parseInt(\"10\", 0)`, `parseInt(\"10\", 1)`, `parseInt(\"10\", 2)` → `10`, `NaN` (основание 1 недопустимо), `2`.",
          "`g()` вернула объект (скобки вокруг литерала), а стрелка с пустым телом — `undefined`.",
        ),
      ],
    }),
    exercise({
      id: "js.functions-basics.ex2",
      title: "Две ошибки возврата",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Функция `makeRoleBad` возвращает `undefined`, а `wrapBad(1)` тоже `undefined`, хотя оба результата должны быть объектами. Найдите причины и исправьте обе функции."),
      ],
      hints: ["Что делает движок после `return` с переводом строки?", "Что означают `{ … }` после `=>`?"],
      checks: ["Названа причина первой ошибки (ASI)", "Названа причина второй (блок вместо объекта)", "Исправлены обе функции"],
      solution: [
        code("js", `// Было: две ошибки
function makeRoleBad() {
  return
  { role: "user" };
}
const wrapBad = (value) => { value };

// Стало
function makeRole() {
  return { role: "user" };
}
const wrap = (value) => ({ value });

console.log(makeRoleBad(), wrapBad(1));
console.log(makeRole(), wrap(1));`, { filename: "x2-bugs.mjs" }),
        code("text", `undefined undefined
{ role: 'user' } { value: 1 }`, { filename: "вывод Node.js 22.22.0" }),
        p("В первой функции после `return` вставляется `;`, а объект становится отдельным блоком. Во второй `{ value }` — блок с выражением `value`, а не литерал объекта; нужны скобки `({ value })`."),
      ],
    }),
    exercise({
      id: "js.functions-basics.ex3",
      title: "Значения по умолчанию и общие данные",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Коллега говорит: «В JavaScript нельзя писать `tags = []` в параметрах — массив будет общим для всех вызовов, как в некоторых других языках». Проверьте утверждение на коде и объясните, как именно вычисляется значение по умолчанию. Покажите, в каком случае данные действительно оказываются общими."),
      ],
      hints: ["Когда вычисляется выражение по умолчанию: при объявлении или при вызове?", "Чем отличается массив вне функции?"],
      checks: ["Показано, что массивы разные (`false`)", "Показан случай общих данных", "Объяснён порядок вычисления параметров"],
      solution: [
        code("js", `// Значение по умолчанию вычисляется при каждом вызове, поэтому изменяемый «запасной» массив не общий
function addTag(tag, tags = []) {
  tags.push(tag);
  return tags;
}
const first = addTag("a");
const second = addTag("b");
console.log(first, second, first === second);

// а вот переменная вне функции — общая
const shared = [];
function addSharedTag(tag) {
  shared.push(tag);
  return shared;
}
console.log(JSON.stringify(addSharedTag("a")), JSON.stringify(addSharedTag("b")));

// предыдущие параметры доступны, а последующие — нет
function area(width, height = width) { return width * height; }
console.log(area(4), area(4, 5));
try {
  (function bad(a = b, b = 1) { return a; })();
} catch (e) {
  console.log(e.name + ": " + e.message);
}`, { filename: "x3-defaults.mjs" }),
        code("text", `[ 'a' ] [ 'b' ] false
["a"] ["a","b"]
16 20
ReferenceError: Cannot access 'b' before initialization`, { filename: "вывод Node.js 22.22.0" }),
        p("Выражение по умолчанию вычисляется **при каждом вызове**, в котором аргумент не передан: `first !== second`. Общие данные возникают тогда, когда функция работает с переменной **снаружи** (`shared`) — второй вызов видит изменения первого. Параметры вычисляются слева направо: `area(w, h = w)` видит `w`, а `a = b` для ещё не объявленного `b` — `ReferenceError`."),
      ],
    }),
  ],

  challenge: {
    id: "js.functions-basics.challenge",
    title: "Функция range с переменной сигнатурой",
    scenario: [
      p("Для генерации тестовых данных нужна функция `range`, как в других языках: один, два или три аргумента. Напишите модуль `range.mjs`, экспортирующий `range(...args)`."),
    ],
    requirements: [
      "`range(5)` → `[0, 1, 2, 3, 4]`; `range(2, 5)` → `[2, 3, 4]`; `range(0, 10, 3)` → `[0, 3, 6, 9]`; `range(5, 0, -2)` → `[5, 3, 1]`",
      "Пустой результат, если диапазон пуст: `range(3, 3)`, `range(5, 0)`, `range(0)` → `[]`",
      "Дробный шаг допустим: `range(0, 1, 0.25)` → `[0, 0.25, 0.5, 0.75]`",
      "`TypeError` для 0 или более 3 аргументов и для нечисловых значений (`\"a\"`, `NaN`); `RangeError` для нулевого шага",
    ],
    constraints: [
      "Функция чистая: не изменяет аргументы и не использует внешние переменные",
      "Не использовать `arguments`",
    ],
    acceptance: [
      "Все 13 проверок из теста проходят",
      "Бесконечный цикл невозможен при любом входе",
      "Нулевой шаг отвергается до начала цикла",
    ],
    hints: [
      "Как принять разное число аргументов без `arguments`?",
      "Какой оператор подставит шаг `1`, не заменяя при этом шаг `0`?",
      "Какой проверкой отсечь `NaN` и строки одновременно?",
    ],
    solution: [
      code("js", `export function range(...args) {
  if (args.length === 0 || args.length > 3) throw new TypeError("range принимает от 1 до 3 аргументов");
  const [start, end, step] = args.length === 1 ? [0, args[0], 1] : [args[0], args[1], args[2] ?? 1];
  if (![start, end, step].every(Number.isFinite)) throw new TypeError("Аргументы должны быть конечными числами");
  if (step === 0) throw new RangeError("Шаг не может быть равен нулю");

  const result = [];
  if (step > 0) for (let n = start; n < end; n += step) result.push(n);
  else for (let n = start; n > end; n += step) result.push(n);
  return result;
}`, { filename: "range.mjs", lineNumbers: true }),
      code("text", `Все 13 проверок пройдены
[0,1,2,3,4] [2,3,4] [5,3,1]`, { filename: "результат запуска тестов" }),
      p("`rest` принимает любое число аргументов, `??` подставляет шаг только при `null`/`undefined`, `Number.isFinite` отвергает `NaN`, `Infinity` и строки, а нулевой шаг проверяется до цикла."),
    ],
  },

  interview: [
    iq("js.functions-basics.i1", "basic", "Чем отличаются объявление функции и функциональное выражение?", [
      ul(
        "Объявление (`function f() {}`) создаётся при входе в область видимости и доступно до своей строки.",
        "Выражение (`const f = function () {}`) создаётся при выполнении строки; до неё `const` даёт `ReferenceError`, `var` — `TypeError: … is not a function`.",
        "Выражение можно сделать именованным; имя видно только внутри.",
      ),
    ]),
    iq("js.functions-basics.i2", "basic", "Что произойдёт, если вызвать функцию с меньшим или большим числом аргументов?", [
      ul(
        "Недостающие параметры равны `undefined` (или значению по умолчанию).",
        "Лишние аргументы игнорируются, но доступны через `rest` или `arguments`.",
        "Функция не может отличить «не передано» от «передан `undefined`», кроме как по `arguments.length`/`rest`.",
      ),
    ]),
    iq("js.functions-basics.i3", "intermediate", "Чем стрелочная функция отличается от обычной?", [
      ul(
        "Нет собственных `this`, `arguments`, `super`, `new.target`: они берутся из окружения.",
        "Не может быть конструктором (`new arrow()` — `TypeError`), нет `prototype`.",
        "Короткая запись: тело-выражение возвращается неявно; для литерала объекта нужны скобки `() => ({})`.",
      ),
    ]),
    iq("js.functions-basics.i4", "intermediate", "Когда вычисляется значение параметра по умолчанию?", [
      ul(
        "При **каждом вызове**, в котором аргумент не передан или равен `undefined`, — слева направо.",
        "Поэтому `tags = []` создаёт новый массив при каждом вызове (замер: `first !== second`).",
        "Можно ссылаться на предыдущие параметры (`h = w`), но не на последующие (`ReferenceError`).",
        "`null` не заменяется значением по умолчанию.",
      ),
    ]),
    iq("js.functions-basics.i5", "intermediate", "Почему `[\"1\", \"2\", \"3\"].map(parseInt)` даёт `[1, NaN, NaN]`?", [
      ul(
        "`map` вызывает колбэк с тремя аргументами: `(элемент, индекс, массив)`.",
        "`parseInt(строка, основание)` принимает индекс как основание системы счисления: `parseInt(\"2\", 1)` — `NaN`, `parseInt(\"3\", 2)` — `NaN`.",
        "Решение: `.map(Number)` или `.map((s) => parseInt(s, 10))`.",
      ),
    ]),
    iq("js.functions-basics.i6", "advanced", "Что такое чистая функция и зачем она нужна?", [
      ul(
        "Результат зависит только от аргументов, и функция не имеет побочных эффектов (не меняет внешнее состояние, не обращается к вводу-выводу).",
        "Проще тестировать (нет подготовки окружения), безопасно переиспользовать и кэшировать результат.",
        "Побочные эффекты нужны, но их стоит выносить на края программы и держать явными.",
      ),
    ]),
    iq("js.functions-basics.i7", "engineering", "Как вы спроектируете сигнатуру функции с пятью необязательными настройками?", [
      ul(
        "Один обязательный основной аргумент и один объект настроек: `render(data, { theme, locale, … } = {})`.",
        "Значения по умолчанию — в деструктуризации параметра, а валидация — в начале функции.",
        "Документировать допустимые значения и бросать понятные ошибки на неизвестные ключи.",
        "Избегать булевых позиционных аргументов: `render(data, true, false)` нечитаем.",
      ),
    ]),
    iq("js.functions-basics.i8", "debugging", "Функция «ничего не возвращает», хотя `return` написан. Что вы проверите?", [
      ul(
        "Нет ли перевода строки после `return` (ASI вставит `;`).",
        "Не стрелка ли с телом-блоком `() => { … }` без `return`, либо с литералом объекта без скобок.",
        "Не выполняется ли другая ветка (`return` в условии) — по отладочному выводу или в отладчике.",
        "Не затеняет ли локальная переменная ожидаемую.",
      ),
    ]),
  ],

  exam: [
    mcq("js.functions-basics.e1", "foundation", "Что вернёт функция без оператора `return`?", ["`null`", "`0`", "`undefined`", "Пустую строку"], 2, "Функция без `return` возвращает `undefined`."),
    mcq("js.functions-basics.e2", "foundation", "Можно ли вызвать функцию, объявленную через `function name() {}`, до строки объявления?", ["Да, объявление доступно с начала области видимости", "Нет, будет `ReferenceError`", "Только в нестрогом режиме", "Только в модулях"], 0, "Объявления функций поднимаются целиком; в замере `declared(2)` вернула `4` до строки объявления."),
    mcq("js.functions-basics.e3", "intermediate", "Что вернёт `greet(null)` для `function greet(name = \"гость\")`?", ["Строку с `гость`", "Бросит ошибку", "`undefined`", "Строку с `null`"], 3, "Значение по умолчанию подставляется только при `undefined`; `null` остаётся `null` (замер: `Привет, null!`)."),
    mcq("js.functions-basics.e4", "intermediate", "Что вернёт `() => { ok: true }`?", ["Объект `{ ok: true }`", "`undefined`", "`true`", "`SyntaxError`"], 1, "Фигурные скобки — блок, `ok:` — метка; чтобы вернуть объект, нужны скобки `() => ({ ok: true })`."),
    mcq("js.functions-basics.e5", "intermediate", "Что верно для стрелочных функций? Выберите все.", ["Нет собственного `arguments`", "Можно вызывать через `new`", "Нет свойства `prototype`", "Имеют собственный `this`"], [0, 2], "Стрелки не конструкторы (`new` — `TypeError`), у них нет `prototype`, `arguments` и собственного `this`."),
    mcq("js.functions-basics.e6", "advanced", "Что вернёт `((a, b = 1, c) => 0).length`?", ["`3`", "`2`", "`0`", "`1`"], 3, "`length` считает параметры до первого со значением по умолчанию: только `a`."),
    open("js.functions-basics.e7", "intermediate", "Объясните, почему функция, в которой после `return` литерал объекта начинается на следующей строке, вернёт `undefined`.", [
      ul(
        "После `return` на отдельной строке движок вставляет `;` (автоматическая расстановка точек с запятой).",
        "Получается `return;` и отдельный блок `{ a: 1 }` (метка `a:` и выражение `1`), который никогда не выполняется как возврат.",
        "Исправление: начинать выражение на одной строке с `return` — `return {` … `};`.",
      ),
    ], ["Названа вставка `;`", "Объяснено, что `{}` — блок", "Предложено исправление"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.functions-basics.m1", "intermediate", "Что вернёт `typeof inner` вне именованного выражения `const f = function inner() {}`?", ["`\"function\"`", "`\"object\"`", "`\"undefined\"`", "`ReferenceError`"], 2, "Имя именованного выражения видно только внутри функции; `typeof` на необъявленное имя возвращает `\"undefined\"` (замер)."),
    mcq("js.functions-basics.m2", "advanced", "Почему `addTag(tag, tags = [])` безопасна для повторных вызовов?", ["Массив создаётся один раз при объявлении", "Выражение по умолчанию вычисляется при каждом вызове без аргумента", "Массивы в JavaScript неизменяемы", "Из-за временной мёртвой зоны"], 1, "Значение по умолчанию вычисляется при каждом вызове: два вызова вернули разные массивы."),
    mcq("js.functions-basics.m3", "advanced", "Что вернёт `[\"10\", \"10\", \"10\"].map(parseInt)`?", ["`[10, NaN, 2]`", "`[10, 10, 10]`", "`[1, 2, 3]`", "`[NaN, NaN, NaN]`"], 0, "Индекс элемента становится основанием: `parseInt(\"10\", 0)` — `10`, `parseInt(\"10\", 1)` — `NaN`, `parseInt(\"10\", 2)` — `2`."),
    open("js.functions-basics.m4", "advanced", "Опишите, как бы вы разделили функцию `processOrder(order)`, которая валидирует заказ, считает цену, пишет в базу и отправляет письмо.", [
      ul(
        "Чистые функции: `validate(order)` → результат/ошибки, `calculateTotal(order)` → число; их легко тестировать.",
        "Побочные эффекты — отдельные функции на краях: `saveOrder(order)`, `sendReceipt(order)`.",
        "Оркестрирующая функция вызывает их по порядку и обрабатывает ошибки; зависимости (БД, почта) передаются параметрами, чтобы подменять в тестах.",
        "Контракты: что принимает, что возвращает, какие ошибки бросает; тесты на каждый шаг и на сквозной сценарий.",
      ),
    ], ["Выделены чистые функции", "Выделены побочные эффекты", "Описана передача зависимостей", "Упомянуты тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.functions-basics.f1", front: "Объявление и выражение?", back: "Объявление доступно с начала области; выражение — после выполнения строки (const → ReferenceError, var → TypeError)." },
    { id: "js.functions-basics.f2", front: "Параметр по умолчанию?", back: "Только для undefined (не null); вычисляется при каждом вызове; видит предыдущие параметры." },
    { id: "js.functions-basics.f3", front: "return и новая строка?", back: "После return вставляется `;` — вернётся undefined. Выражение — на той же строке." },
    { id: "js.functions-basics.f4", front: "Стрелка?", back: "Нет своих this/arguments, не конструктор, нет prototype; для объекта в теле: `() => ({ … })`." },
    { id: "js.functions-basics.f5", front: "map(parseInt)?", back: "[1, NaN, NaN]: индекс идёт как основание. Нужно map(Number) или (s) => parseInt(s, 10)." },
    { id: "js.functions-basics.f6", front: "Чистая функция?", back: "Результат зависит только от аргументов, без побочных эффектов: тестируема и переиспользуема." },
    { id: "js.functions-basics.f7", front: "rest и arguments?", back: "rest — настоящий массив, работает и в стрелках; arguments — «почти массив», только в обычных функциях." },
  ],

  sources: [
    { title: "ECMAScript: Functions and Classes", url: "https://tc39.es/ecma262/#sec-ecmascript-language-functions-and-classes", publisher: "ECMA" },
    { title: "ECMAScript: Automatic Semicolon Insertion", url: "https://tc39.es/ecma262/#sec-automatic-semicolon-insertion", publisher: "ECMA" },
    { title: "ECMAScript: Arrow Function Definitions", url: "https://tc39.es/ecma262/#sec-arrow-function-definitions", publisher: "ECMA" },
    { title: "MDN: Functions", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions", publisher: "MDN" },
    { title: "MDN: Default parameters", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters", publisher: "MDN" },
    { title: "MDN: Rest parameters", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters", publisher: "MDN" },
    { title: "MDN: Arrow function expressions", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions", publisher: "MDN" },
    { title: "MDN: Array.prototype.map()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map", publisher: "MDN" },
    { title: "MDN: Pure function (глоссарий)", url: "https://developer.mozilla.org/en-US/docs/Glossary/Pure_function", publisher: "MDN" },
  ],
};
