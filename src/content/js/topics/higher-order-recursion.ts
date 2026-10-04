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
  warn,
  wrongRight,
} from "../../dsl";

export const higherOrderRecursion: Topic = {
  id: "js.higher-order-recursion",
  slug: "higher-order-recursion",
  domain: "js",
  module: "functions",
  title: "Функции высшего порядка и рекурсия",
  titleEn: "Higher-order functions and recursion",
  summary:
    "Функция высшего порядка принимает или возвращает другие функции: `map`, `filter`, `reduce`, `find`, `some`, `every`, `sort` превращают циклы с накоплением в короткие конвейеры, а функции-обёртки (`once`, `curry`, `compose`) строят новые функции из старых. Рекурсия решает задачу через меньшую задачу того же вида: нужны базовый случай и шаг к нему. Тема на замерах в Node.js 22 и Chromium 141 показывает, как работают `reduce` (в том числе пустой массив без начального значения) и `sort` (изменяет массив, сравнивает строки по умолчанию), как устроены собственные `map`/`filter`/`reduce`, где кончается стек вызовов (около 12,5 тысяч кадров), что хвостовая рекурсия в V8 не оптимизируется, как мемоизация сводит `fib(25)` с 242 785 вызовов к 26 и как заменить рекурсию циклом или трамплином.",
  minutes: 65,
  prerequisites: ["js.functions-basics"],
  tags: ["higher-order function", "map", "filter", "reduce", "sort", "callback", "currying", "compose", "pipe", "recursion", "call stack", "memoization", "trampoline", "tail call", "flat"],
  keyConcepts: [
    { term: "`map`, `filter`, `reduce` — три главных инструмента", text: "`map` преобразует каждый элемент, `filter` отбирает, `reduce` сводит всё к одному значению (числу, объекту, массиву). Все три принимают функцию и **не изменяют** исходный массив." },
    { term: "`sort` изменяет массив и сравнивает как строки", text: "`[10, 9, 1, 100].sort()` дало `[1, 10, 100, 9]` и изменило исходный массив; для чисел нужна функция сравнения `(a, b) => a - b`, для копии — `toSorted`." },
    { term: "Функция может возвращать функцию", text: "`multiplier(3)` возвращает функцию, которая помнит `3` (замыкание). На этом строятся `once`, `curry`, `debounce`, фабрики обработчиков." },
    { term: "Рекурсия = базовый случай + уменьшение задачи", text: "Без базового случая стек исчерпывается: `RangeError: Maximum call stack size exceeded`. В Node.js 22 это около 12,5 тысяч вложенных вызовов (замер)." },
    { term: "V8 не оптимизирует хвостовые вызовы", text: "Хвостовая форма `sumTail(100000)` так же даёт `RangeError`, как обычная; для больших глубин используйте цикл или трамплин." },
  ],
  sections: [
    section("definition", [
      def("Функция высшего порядка", "Функция, которая принимает другие функции как аргументы и (или) возвращает функцию. Опирается на то, что функции — значения.", "higher-order function"),
      def("Колбэк", "Функция, переданная другой функции, чтобы та вызвала её в нужный момент: для каждого элемента, по событию, после завершения операции.", "callback"),
      def("`map` / `filter` / `reduce`", "Методы массива: `map` возвращает массив результатов вызова функции для каждого элемента, `filter` — элементы, для которых функция вернула истину, `reduce` — накопленное значение, полученное последовательным применением функции.", "map / filter / reduce"),
      def("Каррирование", "Преобразование функции нескольких аргументов в цепочку функций одного аргумента: `f(a, b, c)` → `f(a)(b)(c)`.", "currying"),
      def("Композиция", "Построение новой функции из нескольких: `pipe(f, g, h)(x)` — `h(g(f(x)))`.", "composition"),
      def("Рекурсия", "Способ определения функции через вызов самой себя для меньшей задачи. Обязательны базовый случай (завершение) и шаг, приближающий к нему.", "recursion"),
      def("Стек вызовов", "Структура, хранящая кадры активных вызовов функций; каждый вызов добавляет кадр, возврат — снимает. Размер ограничен.", "call stack"),
      def("Мемоизация", "Кэширование результатов чистой функции по аргументам, чтобы не вычислять одно и то же повторно.", "memoization"),
    ]),

    section("why", [
      h("Две идеи, на которых держится «современный» JavaScript"),
      p("Откройте любой фронтенд-проект: обработка списка данных — это цепочка `filter().map().sort()`, подписка на событие — передача функции, фабрики обработчиков и middleware — функции, возвращающие функции. А любая работа с деревьями (DOM, JSON, файловые структуры, меню) естественно записывается рекурсией, потому что дерево устроено рекурсивно."),
      ul(
        "**Меньше кода и ошибок:** вместо индексов, счётчиков и накопителей — выражение того, **что** нужно получить.",
        "**Переиспользование поведения:** обёртки вроде `once`, `counted`, `curry` добавляют возможности любой функции, не меняя её.",
        "**Работа с деревьями:** рекурсия повторяет форму данных; без неё обход вложенной структуры запутывается.",
        "**Понимание ограничений:** стек конечен, хвостовая рекурсия в V8 не оптимизируется, наивный `fib` экспоненциален — это границы применимости метода.",
      ),
      insight("Цикл описывает **как** обойти данные, `map`/`filter`/`reduce` — **что** нужно получить. Но это не вопрос вкуса: когда нужен ранний выход или очень глубокая обработка, цикл лучше. Инженер владеет обоими приёмами."),
    ]),

    section("mental-model", [
      p("**Высший порядок** — это **конвейер на заводе**. Лента (массив) движется, а на станциях стоят сменные инструменты (функции): станция «преобразовать» (`map`), станция «отбраковать» (`filter`), станция «сложить в одну коробку» (`reduce`). Завод не знает, что делает каждая насадка, — он знает только порядок. Функция, возвращающая функцию, — это **мастерская, которая изготавливает инструменты** под заказ (`multiplier(3)` делает «утроитель»)."),
      p("**Рекурсия** — это **матрёшка**: чтобы открыть всю матрёшку, откройте верхнюю, а внутри найдёте ту же задачу меньшего размера. Базовый случай — самая маленькая цельная фигурка: её уже открывать не нужно. Если фигурок бесконечно много (нет базового случая) или матрёшка очень глубока, вы заполните весь стол — стек вызовов."),
      table(
        ["Задача", "Инструмент", "Возвращает"],
        [
          ["Преобразовать каждый элемент", "`map(fn)`", "Новый массив той же длины"],
          ["Оставить подходящие", "`filter(predicate)`", "Новый массив (возможно короче)"],
          ["Свести к одному значению", "`reduce(fn, initial)`", "Число, строка, объект, массив — что угодно"],
          ["Найти первый / проверить условие", "`find`, `findIndex`, `some`, `every`", "Элемент / индекс / логическое значение (с ранним выходом)"],
          ["Упорядочить", "`sort(compare)` / `toSorted`", "Тот же массив (изменён) / новая копия"],
          ["Обойти дерево или вложенные данные", "Рекурсия", "Зависит от функции"],
        ],
        "Инструменты работы с коллекциями",
      ),
    ]),

    section("technical", [
      h("Методы массива с колбэками"),
      p("Все методы вызывают колбэк с тремя аргументами: `(элемент, индекс, массив)`. Замер (Node.js 22.22.0):"),
      code("js", `const orders = [
  { id: 1, customer: "Аня", total: 1200, paid: true },
  { id: 2, customer: "Борис", total: 300, paid: false },
  { id: 3, customer: "Аня", total: 800, paid: true },
  { id: 4, customer: "Вера", total: 2500, paid: true },
];

const paid = orders.filter((o) => o.paid);                   // отбор
const totals = paid.map((o) => o.total);                     // преобразование
const sum = totals.reduce((acc, n) => acc + n, 0);           // свёртка
console.log(paid.length, totals, sum);

console.log(orders.find((o) => o.total > 1000).id, orders.findIndex((o) => o.total > 9999));
console.log(orders.some((o) => !o.paid), orders.every((o) => o.total > 100));

// reduce строит любой результат: группировка по клиенту
const byCustomer = orders.reduce((acc, o) => {
  acc[o.customer] = (acc[o.customer] ?? 0) + o.total;
  return acc;
}, {});
console.log(byCustomer);

// flatMap = map + flat(1)
console.log([1, 2, 3].flatMap((n) => [n, n * 10]));

// reduce пустого массива без начального значения
try {
  [].reduce((a, b) => a + b);
} catch (e) {
  console.log(e.name + ": " + e.message);
}
console.log([].reduce((a, b) => a + b, 0));

// sort изменяет массив и по умолчанию сравнивает строки
const nums = [10, 9, 1, 100];
const sorted = nums.toSorted((a, b) => a - b);               // новая копия
console.log(nums, sorted);
console.log(nums.sort(), nums);                              // изменил исходный
const byName = [...orders].sort((a, b) => a.customer.localeCompare(b.customer, "ru")).map((o) => o.customer);
console.log(byName);

// цепочка вызовов читается как конвейер
const report = orders
  .filter((o) => o.paid)
  .map((o) => ({ ...o, total: o.total * 0.9 }))
  .sort((a, b) => b.total - a.total)
  .map((o) => \`\${o.customer}: \${o.total}\`);
console.log(report);`, { filename: "h1-array-methods.mjs", lineNumbers: true }),
      code("text", `3 [ 1200, 800, 2500 ] 4500
1 -1
true true
{ 'Аня': 2000, 'Борис': 300, 'Вера': 2500 }
[ 1, 10, 2, 20, 3, 30 ]
TypeError: Reduce of empty array with no initial value
0
[ 10, 9, 1, 100 ] [ 1, 9, 10, 100 ]
[ 1, 10, 100, 9 ] [ 1, 10, 100, 9 ]
[ 'Аня', 'Аня', 'Борис', 'Вера' ]
[ 'Вера: 2250', 'Аня: 1080', 'Аня: 720' ]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`filter` → `map` → `reduce`:** оплачено 3 заказа, суммы `[1200, 800, 2500]`, итого `4500`.",
        "**`find`** возвращает первый подходящий **элемент** (или `undefined`), **`findIndex`** — индекс (или `-1`). **`some`** и **`every`** возвращают логическое значение и прекращают проход, как только результат ясен.",
        "**`reduce`** строит любое значение: сумму, объект групп (`{ Аня: 2000, … }`), массив. Второй аргумент — начальное значение; без него на пустом массиве `TypeError: Reduce of empty array with no initial value`, с ним — `0`.",
        "**`flatMap`** = `map` + `flat(1)`: `[1, 2, 3]` → `[1, 10, 2, 20, 3, 30]`.",
        "**`sort` изменяет массив:** `nums.sort()` перестроил `nums` (`[1, 10, 100, 9]` — сравнение как строк), а `toSorted((a, b) => a - b)` вернул новую копию `[1, 9, 10, 100]` и оставил исходный массив. Сортируя объекты по тексту, используйте `localeCompare` с локалью.",
        "**Цепочка** `filter().map().sort().map()` читается сверху вниз как описание конвейера.",
      ),
      warn("`sort`, `reverse`, `splice`, `push` **изменяют** массив, а `map`, `filter`, `slice`, `toSorted`, `toReversed` — нет. Если массив передан вам извне, сначала скопируйте (`[...arr].sort(...)`) или используйте `toSorted`."),

      h("Как устроены `map`, `filter` и `reduce`"),
      p("Это обычные функции высшего порядка: цикл, вызов колбэка, накопление результата. Реализация помогает понять, что ничего «волшебного» в них нет."),
      code("js", `// map, filter и reduce — обычные функции высшего порядка
function myMap(array, fn) {
  const out = [];
  for (let i = 0; i < array.length; i++) out.push(fn(array[i], i, array));
  return out;
}
function myFilter(array, predicate) {
  const out = [];
  for (let i = 0; i < array.length; i++) if (predicate(array[i], i, array)) out.push(array[i]);
  return out;
}
function myReduce(array, fn, initial) {
  let acc = initial, start = 0;
  if (arguments.length < 3) {
    if (array.length === 0) throw new TypeError("Reduce of empty array with no initial value");
    acc = array[0];
    start = 1;
  }
  for (let i = start; i < array.length; i++) acc = fn(acc, array[i], i, array);
  return acc;
}

const xs = [1, 2, 3, 4, 5];
console.log(myMap(xs, (x) => x * 2), myFilter(xs, (x) => x % 2), myReduce(xs, (a, b) => a + b));
console.log(JSON.stringify(myMap(xs, (x) => x * 2)) === JSON.stringify(xs.map((x) => x * 2)));
console.log(myMap(["1", "2", "3"], parseInt));            // тот же результат, что у настоящего map`, { filename: "h3-own.mjs", lineNumbers: true }),
      code("text", `[ 2, 4, 6, 8, 10 ] [ 1, 3, 5 ] 15
true
[ 1, NaN, NaN ]`, { filename: "вывод Node.js 22.22.0" }),
      p("Собственный `myMap` вызывает колбэк с `(элемент, индекс, массив)`, поэтому и `myMap(…, parseInt)` даёт тот же `[1, NaN, NaN]`, что настоящий `map` (разобрано в теме об основах функций). `myReduce` отличает «начальное значение не передано» от «передано `undefined`» по `arguments.length`."),

      h("Функции, возвращающие функции"),
      code("js", `// функция, возвращающая функцию
const multiplier = (k) => (x) => x * k;
const triple = multiplier(3);
console.log(triple(5), multiplier(2)(5));

// частичное применение через bind и вручную
function volume(w, h, d) { return w * h * d; }
const slab = volume.bind(null, 2, 3);
console.log(slab(4), volume.length, slab.length);

// compose и pipe: порядок вызова
const compose = (...fns) => (x) => fns.reduceRight((acc, f) => f(acc), x);
const pipe = (...fns) => (x) => fns.reduce((acc, f) => f(acc), x);
const trim = (s) => s.trim();
const upper = (s) => s.toUpperCase();
const exclaim = (s) => s + "!";
console.log(pipe(trim, upper, exclaim)("  привет "), compose(trim, upper, exclaim)("  привет "));

// once: выполняет функцию один раз
function once(fn) {
  let called = false, result;
  return function (...args) {
    if (!called) { called = true; result = fn.apply(this, args); }
    return result;
  };
}
let n = 0;
const init = once(() => ++n);
console.log(init(), init(), init(), n);

// счётчик вызовов через замыкание
function counted(fn) {
  let count = 0;
  const wrapper = (...args) => { count++; return fn(...args); };
  wrapper.calls = () => count;
  return wrapper;
}
const cSquare = counted((x) => x * x);
cSquare(2); cSquare(3);
console.log(cSquare.calls());`, { filename: "h2-returning.mjs", lineNumbers: true }),
      code("text", `15 10
24 3 1
ПРИВЕТ! ПРИВЕТ !
1 1 1 1
2`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Фабрика:** `multiplier(3)` возвращает функцию-«утроитель», которая помнит `k = 3` (так работает замыкание; подробно — в одной из следующих тем).",
        "**`bind` для частичного применения:** `volume.bind(null, 2, 3)` создала функцию с зафиксированными двумя аргументами; `volume.length` — `3`, а `slab.length` — `1`.",
        "**`pipe` и `compose`:** одни и те же три шага дают разный результат — `pipe` вызывает слева направо (`ПРИВЕТ!`), `compose` — справа налево (`ПРИВЕТ !`).",
        "**`once`:** обёртка вызывает функцию один раз и запоминает результат — `init()` три раза вернула `1`, а `n` осталась `1`.",
        "**Обёртки-декораторы:** `counted(fn)` добавляет счётчик вызовов, не меняя `fn`.",
      ),

      h("Рекурсия: базовый случай и шаг"),
      code("js", `// два обязательных элемента рекурсии: базовый случай и шаг к нему
function factorial(n) {
  if (n <= 1) return 1;                 // базовый случай
  return n * factorial(n - 1);          // рекурсивный шаг: задача меньше
}
console.log(factorial(5), factorial(20), factorial(25), factorial(170), factorial(171));

// без базового случая стек исчерпывается
function forever(n) { return forever(n + 1); }
try {
  forever(0);
} catch (e) {
  console.log(e.name + ": " + e.message);
}

// глубина рекурсии ограничена размером стека
function maxDepth() {
  let d = 0;
  function dive() { d++; dive(); }
  try { dive(); } catch { /* стек исчерпан */ }
  return d;
}
console.log("глубина до RangeError:", maxDepth(), maxDepth());

// каждый вызов добавляет кадр в стек: порядок «вход — выход»
function trace(n, log = []) {
  log.push("вход " + n);
  if (n > 0) trace(n - 1, log);
  log.push("выход " + n);
  return log;
}
console.log(trace(2).join(", "));`, { filename: "r1-basics.mjs", lineNumbers: true }),
      code("text", `120 2432902008176640000 1.5511210043330986e+25 7.257415615307994e+306 Infinity
RangeError: Maximum call stack size exceeded
глубина до RangeError: 12534 12534
вход 2, вход 1, вход 0, выход 0, выход 1, выход 2`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Два элемента рекурсии:** базовый случай (`n <= 1` возвращает `1`) и шаг, уменьшающий задачу (`factorial(n - 1)`).",
        "**Числа конечны:** `factorial(170)` — `7.257415615307994e+306`, а `factorial(171)` — `Infinity` (переполнение `number`; тема о типах).",
        "**Без базового случая** вызовы идут, пока не кончится стек: `RangeError: Maximum call stack size exceeded`.",
        "**Предел глубины** — размер стека, а не число вызовов вообще: в замере функция без аргументов дошла примерно до 12,5 тысяч вложенных вызовов в Node.js 22.22.0 (в Chromium 141 — 12 477). Чем больше локальных переменных и параметров, тем меньше глубина.",
        "**Порядок «вход — выход»:** `trace(2)` записала `вход 2, вход 1, вход 0, выход 0, выход 1, выход 2` — кадры снимаются в обратном порядке.",
      ),

      h("Повторные вычисления и мемоизация"),
      code("js", `let calls = 0;
function fib(n) {
  calls++;
  return n < 2 ? n : fib(n - 1) + fib(n - 2);
}
console.log(fib(20), calls);
calls = 0;
console.log(fib(25), calls);

function memoize(fn) {
  const cache = new Map();
  return (n) => {
    if (!cache.has(n)) cache.set(n, fn(n));
    return cache.get(n);
  };
}
let mcalls = 0;
const fibM = memoize((n) => {
  mcalls++;
  return n < 2 ? n : fibM(n - 1) + fibM(n - 2);
});
console.log(fibM(25), mcalls);
console.log(fibM(78), mcalls);

// итеративный вариант: один проход, память O(1)
function fibLoop(n) {
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}
console.log(fibLoop(25), fibLoop(78));`, { filename: "r2-memo.mjs", lineNumbers: true }),
      code("text", `6765 21891
75025 242785
75025 26
8944394323791464 79
75025 8944394323791464`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Наивный `fib`:** `fib(20)` — 21 891 вызов, `fib(25)` — 242 785: число вызовов растёт примерно в 1,6 раза на каждый следующий `n` (экспоненциально).",
        "**Мемоизация:** `fibM(25)` — 26 вызовов; последующий `fibM(78)` — ещё 53 (всего 79). Кэш превращает экспоненциальный алгоритм в линейный.",
        "**Цикл** (`fibLoop`) решает ту же задачу без рекурсии и без кэша: два числа в памяти.",
        "**Мемоизация применима только к чистым функциям:** результат зависит исключительно от аргументов.",
      ),

      h("Рекурсия по дереву"),
      p("Когда данные вложены (меню, категории, файловая система, JSON), рекурсивная функция **повторяет форму данных**: обработай узел и примени себя к детям."),
      code("js", `const catalog = {
  name: "Каталог",
  children: [
    { name: "Книги", children: [{ name: "Проза", children: [] }, { name: "Наука", children: [{ name: "Физика", children: [] }] }] },
    { name: "Игры", children: [] },
  ],
};

// рекурсия повторяет форму данных
const count = (node) => 1 + node.children.reduce((acc, ch) => acc + count(ch), 0);
const depth = (node) => 1 + Math.max(0, ...node.children.map(depth));
const names = (node) => [node.name, ...node.children.flatMap(names)];

function pathTo(node, target, path = []) {
  const here = [...path, node.name];
  if (node.name === target) return here;
  for (const child of node.children) {
    const found = pathTo(child, target, here);
    if (found) return found;
  }
  return null;
}

console.log(count(catalog), depth(catalog));
console.log(names(catalog).join(" | "));
console.log(pathTo(catalog, "Физика")?.join(" > "), pathTo(catalog, "Кино"));

// глубокая вложенность массивов: flat(Infinity) и собственная рекурсия
const nested = [1, [2, [3, [4]], 5]];
const flatten = (arr) => arr.flatMap((x) => (Array.isArray(x) ? flatten(x) : [x]));
console.log(flatten(nested), nested.flat(Infinity));`, { filename: "r3-tree.mjs", lineNumbers: true }),
      code("text", `6 4
Каталог | Книги | Проза | Наука | Физика | Игры
Каталог > Книги > Наука > Физика null
[ 1, 2, 3, 4, 5 ] [ 1, 2, 3, 4, 5 ]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "`count`, `depth`, `names` — рекурсия + `reduce`/`flatMap`: узел плюс сумма (максимум, объединение) результатов по детям.",
        "`pathTo` — **поиск с возвратом**: если ни один ребёнок не нашёл цель, вернуть `null` и подняться выше.",
        "`flatten` через `flatMap` и `nested.flat(Infinity)` дают одинаковый результат; встроенный метод лучше, но собственная рекурсия нужна, когда логика сложнее.",
      ),

      h("Пределы рекурсии: стек, хвостовые вызовы, трамплин"),
      code("js", `// сумма 1..n тремя способами
const sumRec = (n) => (n === 0 ? 0 : n + sumRec(n - 1));
const sumLoop = (n) => { let s = 0; for (let i = 1; i <= n; i++) s += i; return s; };

// хвостовая форма: JavaScript-движки (V8) всё равно не оптимизируют хвостовой вызов
const sumTail = (n, acc = 0) => (n === 0 ? acc : sumTail(n - 1, acc + n));

// трамплин: функция возвращает «следующий шаг», а цикл его выполняет
const trampoline = (fn) => (...args) => {
  let result = fn(...args);
  while (typeof result === "function") result = result();
  return result;
};
const sumTramp = trampoline(function step(n, acc = 0) {
  return n === 0 ? acc : () => step(n - 1, acc + n);
});

for (const n of [1_000, 100_000]) {
  const row = [];
  for (const [name, fn] of [["рекурсия", sumRec], ["хвостовая", sumTail], ["цикл", sumLoop], ["трамплин", sumTramp]]) {
    try { row.push(name + " = " + fn(n)); } catch (e) { row.push(name + ": " + e.name); }
  }
  console.log("n =", n, "→", row.join("; "));
}`, { filename: "r4-stack.mjs", lineNumbers: true }),
      code("text", `n = 1000 → рекурсия = 500500; хвостовая = 500500; цикл = 500500; трамплин = 500500
n = 100000 → рекурсия: RangeError; хвостовая: RangeError; цикл = 5000050000; трамплин = 5000050000`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Глубина 100 000** переполняет стек: рекурсия — `RangeError`, при глубине 1000 всё работает.",
        "**Хвостовая форма** (`sumTail`, где рекурсивный вызов — последнее действие) в стандарте ES2015 предполагала оптимизацию, но V8 её не выполняет: `sumTail(100000)` — тоже `RangeError` (замер).",
        "**Цикл** решает задачу при любом `n` — для линейных обходов предпочтительнее.",
        "**Трамплин** возвращает функцию «следующий шаг», а цикл её вызывает: стек не растёт (`sumTramp(100000)` вернула `5000050000`).",
      ),
      note("Рекурсия остаётся лучшим выбором для деревьев и задач «разделяй и властвуй» при небольшой глубине. Для глубоких линейных структур (длинные списки, миллионы шагов) используйте цикл или явный стек."),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const prices = [120, 80, 300, 45];

const withTax = prices.map((p) => p * 1.2);              // преобразовать каждый элемент
const expensive = prices.filter((p) => p > 100);         // оставить подходящие
const total = prices.reduce((sum, p) => sum + p, 0);     // свести к одному значению

const addTo = (base) => (x) => base + x;                 // функция возвращает функцию
const addTen = addTo(10);

function countdown(n) {                                  // рекурсия
  if (n === 0) return ["пуск"];                          // базовый случай
  return [n, ...countdown(n - 1)];                       // шаг к базовому случаю
}

console.log(withTax, expensive, total, addTen(5), countdown(3));`,
        [
          { line: 3, text: "`map` вызывает стрелочную функцию для каждого элемента и собирает результаты в новый массив." },
          { line: 4, text: "`filter` оставляет элементы, для которых функция вернула истинное значение." },
          { line: 5, text: "`reduce(fn, 0)`: `sum` — накопитель, `p` — текущий элемент, `0` — начальное значение." },
          { line: [7, 8], text: "Функция-фабрика: `addTo(10)` возвращает функцию `(x) => 10 + x`; `base` запоминается." },
          { line: [10, 13], text: "Рекурсия: при `n === 0` возвращается готовый результат (базовый случай), иначе вызывается та же функция с меньшим `n`." },
          { line: 15, text: "Результаты: `[144, 96, 360, 54]`, `[120, 300]`, `545`, `15`, `[3, 2, 1, \"пуск\"]`." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Каталог</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 32rem; }
  ul { padding: 0; list-style: none; }
  li { display: flex; justify-content: space-between; border-bottom: 1px solid #8884; padding: .25rem 0; }
  .controls { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }
</style>
<h1>Каталог</h1>
<div class="controls">
  <label><input type="checkbox" id="stock"> только в наличии</label>
  <label>Сортировка
    <select id="order">
      <option value="price-asc">цена ↑</option>
      <option value="price-desc">цена ↓</option>
      <option value="name">название</option>
    </select>
  </label>
</div>
<ul id="list"></ul>
<p id="total" role="status"></p>
<script type="module">
  const products = [
    { name: "Блокнот", price: 120, inStock: true },
    { name: "Ручка", price: 45, inStock: true },
    { name: "Рюкзак", price: 2400, inStock: false },
    { name: "Лампа", price: 900, inStock: true },
    { name: "Кружка", price: 350, inStock: false },
  ];

  const stock = document.querySelector("#stock");
  const order = document.querySelector("#order");
  const list = document.querySelector("#list");
  const totalOutput = document.querySelector("#total");

  const comparators = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name, "ru"),
  };

  function render() {
    const visible = products
      .filter((p) => !stock.checked || p.inStock)          // отбор
      .toSorted(comparators[order.value]);                 // сортировка без изменения исходного массива

    list.replaceChildren(
      ...visible.map((p) => {                              // преобразование данных в элементы
        const li = document.createElement("li");
        li.textContent = \`\${p.name} — \${p.price} ₽\`;
        return li;
      }),
    );
    const total = visible.reduce((sum, p) => sum + p.price, 0);   // свёртка
    totalOutput.textContent = \`Товаров: \${visible.length}, сумма: \${total} ₽\`;
  }

  stock.addEventListener("change", render);                // функция как значение — обработчик
  order.addEventListener("change", render);
  render();
</script>`, { filename: "catalog.html", runnable: true, lineNumbers: true }),
      p("Страница строит список из массива через `filter` → `toSorted` → `map`, а итог считает `reduce`. Замер в Chromium 141: по умолчанию 5 товаров на 3815 ₽ (по возрастанию цены: Ручка, Блокнот, Кружка, Лампа, Рюкзак); «только в наличии» — 3 товара, 1065 ₽; сортировка «цена ↓» — Лампа, Блокнот, Ручка; «название» — Блокнот, Лампа, Ручка; ошибок страницы нет. Обработчики событий — функции-значения, переданные в `addEventListener`."),
    ]),

    section("detailed-example", [
      p("Функция `curry(fn)` — классический пример высшего порядка: она принимает функцию и возвращает новую, которая накапливает аргументы, пока их не хватит. Внутри — рекурсия: `curried` возвращает функцию, которая снова вызывает `curried` с накопленными аргументами."),
      code("js", `export function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);       // аргументов достаточно — вызываем
    return (...more) => curried.apply(this, [...args, ...more]);    // иначе ждём остальные
  };
}`, { filename: "curry.mjs", lineNumbers: true }),
      code("js", `import { curry } from "./curry.mjs";

const add3 = curry((a, b, c) => a + b + c);
const checks = [
  ["add3(1)(2)(3)", add3(1)(2)(3), 6],
  ["add3(1, 2)(3)", add3(1, 2)(3), 6],
  ["add3(1)(2, 3)", add3(1)(2, 3), 6],
  ["add3(1, 2, 3)", add3(1, 2, 3), 6],
  ["add3(1, 2, 3, 4) — лишний аргумент", add3(1, 2, 3, 4), 6],
];
const double = curry((x) => x * 2);
checks.push(["curry(x => …)(5)", double(5), 10]);
const partial = add3(10);
checks.push(["partial(1)(2) и partial(5)(5) независимы", [partial(1)(2), partial(5)(5)].join(), "13,20"]);
const greet = curry(function (greeting, name) { return \`\${greeting}, \${name}, я \${this.me}\`; });
checks.push(["this сохраняется", greet.call({ me: "Аня" }, "Привет")("Борис"), "Привет, Борис, я Аня"]);
const map = curry((fn, list) => list.map(fn));
checks.push(["map(double)([1,2,3])", map(double)([1, 2, 3]).join(), "2,4,6"]);

let failed = 0;
for (const [label, got, expected] of checks) {
  const ok = got === expected;
  if (!ok) failed++;
  console.log(ok ? "ok  " : "FAIL", label, "→", got);
}
console.log(failed === 0 ? "Все проверки пройдены" : \`Провалено: \${failed}\`);`, { filename: "curry-test.mjs", collapsed: true }),
      code("text", `ok   add3(1)(2)(3) → 6
ok   add3(1, 2)(3) → 6
ok   add3(1)(2, 3) → 6
ok   add3(1, 2, 3) → 6
ok   add3(1, 2, 3, 4) — лишний аргумент → 6
ok   curry(x => …)(5) → 10
ok   partial(1)(2) и partial(5)(5) независимы → 13,20
ok   this сохраняется → Привет, Борис, я Аня
ok   map(double)([1,2,3]) → 2,4,6
Все проверки пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает", "Почему так"],
        [
          ["`fn.length`", "Число объявленных параметров", "Определяет, когда аргументов достаточно; не считает параметры со значениями по умолчанию и `rest` (тема об основах функций)"],
          ["`if (args.length >= fn.length) return fn.apply(this, args)`", "Базовый случай рекурсии", "Если аргументов достаточно — вызываем исходную функцию; `>=` допускает лишние аргументы (`add3(1, 2, 3, 4)` → `6`)"],
          ["`(...more) => curried.apply(this, [...args, ...more])`", "Рекурсивный шаг", "Возвращаем новую функцию, которая хранит накопленные `args` в замыкании и снова проверяет достаточность"],
          ["`function curried` вместо стрелки", "Нужны собственные `this` и имя для рекурсии", "Именованное выражение даёт ссылку на себя; `this` сохраняется при вызове через `call`"],
          ["`partial = add3(10)`", "Частично применённая функция", "`partial(1)(2)` и `partial(5)(5)` независимы: каждая цепочка копирует массив аргументов, а не меняет общий"],
        ],
        "Разбор curry",
      ),
      ul(
        "Все 9 проверок проходят: четыре способа вызова с разной группировкой, лишний аргумент, функция одного параметра, независимость частичных применений, сохранение `this`, использование с `map`.",
        "**Ограничение:** `curry` опирается на `fn.length`, поэтому не работает с функциями, у которых необязательные параметры или `rest` (их `length` меньше фактического числа аргументов).",
      ),
    ]),

    section("internals", [
      h("Стек вызовов"),
      steps(
        [
          ["Вызов", "Движок создаёт кадр: параметры, локальные переменные, место возврата. Кадр кладётся на вершину стека."],
          ["Рекурсивный вызов", "Новый кадр кладётся поверх; предыдущий ждёт результата."],
          ["Возврат", "Кадр снимается со стека, результат передаётся вызвавшему."],
          ["Переполнение", "Если кадров слишком много, движок бросает `RangeError: Maximum call stack size exceeded` (замер)."],
        ],
        "Жизнь кадра",
      ),
      p("Размер стека ограничен настройками среды (в Node.js его можно изменить флагом `--stack-size`, но рискованно), а глубина зависит от размера кадра. Поэтому цифры вроде «12 528 вызовов» — не константа языка, а свойство конкретной среды и функции."),
      h("Хвостовые вызовы"),
      p("Стандарт ECMAScript 2015 описывает «правильные хвостовые вызовы», но большинство движков, включая V8, их не реализует. Поэтому рассчитывать на то, что хвостовая рекурсия не растит стек, нельзя (замер: `sumTail(100000)` — `RangeError` в Node.js 22.22.0)."),
      h("Почему `reduce` с пустым массивом падает"),
      p("Без начального значения `reduce` берёт первый элемент как аккумулятор; у пустого массива его нет, и движок бросает `TypeError`. Для надёжности всегда передавайте начальное значение."),
      h("Как работает `sort`"),
      p("`sort` без аргументов преобразует элементы в строки и сравнивает по кодовым единицам UTF-16; поэтому `100` идёт перед `9`. С функцией сравнения возвращаемое число определяет порядок: отрицательное — `a` раньше `b`, положительное — позже, `0` — равны. В современных движках сортировка **устойчива** (равные элементы сохраняют относительный порядок) — это закреплено стандартом, начиная с ES2019."),
      h("Каррирование и `fn.length`"),
      p("`Function.prototype.length` — число параметров до первого значения по умолчанию или `rest`; на нём построен `curry`, поэтому для функций с необязательными параметрами каррирование нужно задавать явно (`curry(fn, arity)`)."),
    ]),

    section("mistakes", [
      h("Ошибка 1. `reduce` без начального значения"),
      p("`[].reduce((a, b) => a + b)` — `TypeError: Reduce of empty array with no initial value`. Пишите `reduce(fn, 0)` (или другое подходящее начальное значение)."),
      h("Ошибка 2. `sort()` чисел без функции сравнения"),
      wrongRight(
        "js",
        {
          code: `
            const sorted = nums.sort();             // [10, 9, 1, 100] → [1, 10, 100, 9]; nums изменён
          `,
          note: "Сравнение как строки и мутация исходного массива (замер).",
        },
        {
          code: `
            const sorted = nums.toSorted((a, b) => a - b);   // [1, 9, 10, 100]; nums не изменён
          `,
          note: "Числовое сравнение и новая копия.",
        },
      ),
      h("Ошибка 3. Мутация внутри `map`/`filter`/`reduce`"),
      p("Колбэки должны быть чистыми. `map((o) => { o.total *= 0.9; return o; })` меняет исходные объекты и ломает код, который их использует. Возвращайте новые объекты: `({ ...o, total: o.total * 0.9 })`."),
      h("Ошибка 4. Передача функции с чужой сигнатурой (`map(parseInt)`)"),
      p("`map` передаёт `(элемент, индекс, массив)`: `parseInt` получит индекс как основание. Оберните: `(s) => parseInt(s, 10)`."),
      h("Ошибка 5. Рекурсия без базового случая или без приближения к нему"),
      p("`forever(n + 1)` не приближается к базовому случаю и даёт `RangeError: Maximum call stack size exceeded` (замер). Проверьте, что каждый шаг уменьшает задачу, а базовый случай достижим для любого допустимого входа."),
      h("Ошибка 6. Рассчитывать на оптимизацию хвостовых вызовов"),
      p("`sumTail(100000)` упала так же, как `sumRec` (замер). Для больших глубин используйте цикл или трамплин."),
      h("Ошибка 7. Экспоненциальная рекурсия без кэша"),
      p("Наивный `fib(25)` — 242 785 вызовов, `fibM(25)` — 26 (замер). Если подзадачи повторяются, добавьте мемоизацию или перепишите циклом."),
      h("Ошибка 8. `forEach` вместо `map`/`filter`/`reduce`"),
      p("`forEach` с накоплением во внешнюю переменную — тот же цикл с побочным эффектом. Когда результат — новое значение, выбирайте метод, который его возвращает."),
    ]),

    section("antipatterns", [
      ul(
        "**Цепочка из десятка вызовов в одной строке** без промежуточных имён: разбейте и назовите шаги.",
        "**`reduce` как универсальный молоток** там, где достаточно `map` или `filter`: читаемость страдает.",
        "**Копирование аккумулятора на каждой итерации** (`({ ...acc, … })` в `reduce` по тысячам элементов): O(n²); мутируйте локальный аккумулятор внутри `reduce`.",
        "**Глубокая рекурсия по пользовательским данным** без ограничения глубины: злонамеренный ввод исчерпает стек.",
        "**Мемоизация функций с побочными эффектами** и неограниченный рост кэша.",
        "**Каррирование «ради красоты»,** когда обычная функция проще читается.",
        "**Анонимные колбэки по 20 строк** внутри цепочки: выносите в именованные функции.",
        "**Рекурсия вместо цикла для длинных линейных структур** (списки на тысячи элементов).",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Выбирайте самый узкий инструмент:** `map` — преобразовать, `filter` — отобрать, `find`/`some` — искать с ранним выходом, `reduce` — свести.",
        "**Передавайте начальное значение `reduce`** и держите колбэки чистыми.",
        "**Сортируйте с функцией сравнения** и копией (`toSorted`); текст — через `localeCompare`/`Intl.Collator`.",
        "**Давайте именам колбэков смысл:** `isPaid`, `toTotal`, `byPriceDesc` вместо безымянных стрелок в длинных цепочках.",
        "**Пишите рекурсию с явным базовым случаем** и проверяйте, что аргумент уменьшается.",
        "**Для линейных данных — цикл,** для деревьев и вложенных структур — рекурсия, для повторяющихся подзадач — мемоизация.",
        "**Ограничивайте глубину** при обработке данных извне и документируйте предел.",
        "**Покрывайте тестами базовые и граничные случаи:** пустой массив, один элемент, максимальная глубина.",
      ),
      tip("Если не уверены, что вернёт цепочка, вставьте `.map((x) => (console.log(x), x))` на нужном шаге и посмотрите данные в консоли DevTools."),
    ]),

    section("edge-cases", [
      h("Пропуски в массивах"),
      p("`map`, `filter`, `forEach`, `reduce` пропускают пустые слоты разреженных массивов (`[1, , 3]`), а `for…of` проходит по ним как по `undefined`. Подробности — в теме о массивах."),
      h("Изменение массива в колбэке"),
      p("`forEach`/`map` определяют длину в начале обхода; элементы, добавленные во время обхода, не будут обработаны, а удалённые — пропущены. Не меняйте массив, по которому идёт обход."),
      h("`sort` и `undefined`"),
      p("Элементы `undefined` сортируются в конец без вызова функции сравнения; пустые слоты тоже. Функция сравнения должна быть согласованной (антисимметричной и транзитивной), иначе порядок не определён."),
      h("Точность чисел в рекурсивных формулах"),
      p("`fib(80)` в `number` даёт `23416728348467684`, тогда как точное значение (вычисленное через `BigInt`) — `23416728348467685`: результат вышел за `Number.MAX_SAFE_INTEGER` (замер). Для больших чисел используйте `bigint`."),
      h("Глубина рекурсии и среда"),
      p("Лимит стека различается между движками, версиями и режимами (отладка, инспектор, Web Worker). Не закладывайте точное число в логику; проектируйте алгоритмы так, чтобы глубина была ограничена входными данными."),
      h("`reduce` и порядок"),
      p("`reduceRight` идёт справа налево; он нужен для `compose`. Результат `reduce` зависит от порядка, если операция не коммутативна (вычитание, конкатенация)."),
    ]),

    section("related", [
      ul(
        "[Функции: основы](/learn/js/functions-basics) — параметры, возврат, стрелки, чистые функции.",
        "[Управляющие конструкции](/learn/js/control-flow) — циклы и ранний выход, альтернатива рекурсии.",
        "[Переменные и типы](/learn/js/variables-types) — точность `number` и `bigint`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Цикл с накоплением и мутацией",
          code: `
            function revenueByCustomer(list) {
              const result = {};
              for (let i = 0; i < list.length; i++) {
                if (list[i].paid && list[i].total >= 1000) {
                  if (result[list[i].customer] === undefined) result[list[i].customer] = 0;
                  result[list[i].customer] += list[i].total;
                }
              }
              return result;
            }
          `,
          note: "Индексы, повторные обращения и проверки накопителя заслоняют смысл: «оплаченные заказы от 1000, сумма по клиентам».",
        },
        {
          title: "Конвейер filter → reduce",
          code: `
            const revenueByCustomer = (list) =>
              list
                .filter((o) => o.paid && o.total >= 1000)
                .reduce((acc, o) => ({ ...acc, [o.customer]: (acc[o.customer] ?? 0) + o.total }), {});
          `,
          note: "Две строки читаются как постановка задачи; поведение то же (проверено на пяти заказах).",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.higher-order-recursion.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код, скажите, что напечатает каждая строка, и объясните: что делает цепочка, почему `sort()` без функции даёт такой порядок, чем `map` отличается от `flatMap`, что вернёт `reduce` без начального значения и как работает рекурсия `f`."),
        code("js", `const data = [5, 1, 10, 3];
console.log(data.map((x) => x * 2).filter((x) => x > 5).reduce((a, b) => a + b, 0));
console.log([...data].sort(), [...data].sort((a, b) => a - b));
console.log([[1, 2], [3]].map((a) => a.length), [[1, 2], [3]].flatMap((a) => a));
const adder = (a) => (b) => a + b;
console.log(adder(1)(2), typeof adder(1));
console.log([1, 2, 3].reduce((acc, x) => acc + x));
const f = (n) => (n <= 0 ? [] : [n, ...f(n - 1)]);
console.log(f(3));`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Выпишите массив после каждого шага цепочки.", "Как `sort()` сравнивает числа по умолчанию?"],
      checks: ["Результат цепочки `36` объяснён по шагам", "Объяснён порядок строкового `sort`", "Объяснена рекурсия `f(3)`"],
      solution: [
        code("text", `36
[ 1, 10, 3, 5 ] [ 1, 3, 5, 10 ]
[ 2, 1 ] [ 1, 2, 3 ]
3 function
6
[ 3, 2, 1 ]`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "Цепочка: `[5, 1, 10, 3]` → `map(x*2)` → `[10, 2, 20, 6]` → `filter(x > 5)` → `[10, 20, 6]` → `reduce(+)` → `36`.",
          "`sort()` сравнивает как строки: `\"1\" < \"10\" < \"3\" < \"5\"`, поэтому `[1, 10, 3, 5]`; с `(a, b) => a - b` — `[1, 3, 5, 10]`.",
          "`map((a) => a.length)` — длины `[2, 1]`; `flatMap((a) => a)` «разворачивает» на один уровень: `[1, 2, 3]`.",
          "`adder(1)(2)` — `3`; `typeof adder(1)` — `function`.",
          "`reduce` без начального значения берёт первый элемент как аккумулятор: `1 + 2 + 3` — `6`.",
          "`f(3)` → `[3, ...f(2)]` → `[3, 2, ...f(1)]` → `[3, 2, 1, ...f(0)]`, а `f(0)` — базовый случай `[]`: итог `[3, 2, 1]`.",
        ),
      ],
    }),
    exercise({
      id: "js.higher-order-recursion.ex2",
      title: "Цикл → конвейер",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Функция `revenueByCustomerLoop(orders)` суммирует выручку по клиентам для оплаченных заказов от 1000. Перепишите её без `for` и индексов через `filter` и `reduce`. Результат должен совпасть на тех же данных."),
      ],
      hints: ["Какое условие вынести в `filter`?", "Что используется как начальное значение `reduce` и как накопитель создаёт новую запись?"],
      checks: ["Нет `for` и индексов", "Результат совпадает с версией на цикле", "Передано начальное значение `{}`"],
      solution: [
        code("js", `const orders = [
  { customer: "Аня", total: 1200, paid: true },
  { customer: "Борис", total: 300, paid: false },
  { customer: "Аня", total: 800, paid: true },
  { customer: "Вера", total: 2500, paid: true },
  { customer: "Борис", total: 1500, paid: true },
];

// Было: цикл с накоплением
function revenueByCustomerLoop(list) {
  const result = {};
  for (let i = 0; i < list.length; i++) {
    const o = list[i];
    if (o.paid && o.total >= 1000) {
      if (result[o.customer] === undefined) result[o.customer] = 0;
      result[o.customer] += o.total;
    }
  }
  return result;
}

// Стало: конвейер filter → reduce
const revenueByCustomer = (list) =>
  list
    .filter((o) => o.paid && o.total >= 1000)
    .reduce((acc, o) => ({ ...acc, [o.customer]: (acc[o.customer] ?? 0) + o.total }), {});

console.log(revenueByCustomerLoop(orders));
console.log(revenueByCustomer(orders));
console.log(JSON.stringify(revenueByCustomerLoop(orders)) === JSON.stringify(revenueByCustomer(orders)));`, { filename: "x2-refactor.mjs" }),
        code("text", `{ 'Аня': 1200, 'Вера': 2500, 'Борис': 1500 }
{ 'Аня': 1200, 'Вера': 2500, 'Борис': 1500 }
true`, { filename: "вывод Node.js 22.22.0" }),
        p("`filter` оставляет оплаченные заказы от 1000, `reduce` накапливает объект: `acc[o.customer] ?? 0` заменяет проверку на `undefined`. Заметьте, что копирование `{ ...acc }` на каждой итерации удобно для небольших данных, но для тысяч элементов лучше мутировать **локальный** аккумулятор внутри `reduce`."),
      ],
    }),
    exercise({
      id: "js.higher-order-recursion.ex3",
      title: "Рекурсивный flatten с глубиной",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Напишите `flatten(array, depth = Infinity)` без `Array.prototype.flat`: она «разворачивает» вложенные массивы на `depth` уровней. Результаты должны совпадать с `flat`. Затем проверьте, что произойдёт при вложенности 50 000 уровней, и объясните, как можно избежать проблемы."),
      ],
      hints: ["Как уменьшать глубину при рекурсивном вызове?", "Что является базовым случаем: не-массив или `depth < 1`?"],
      checks: ["Совпадает с `flat` для нескольких глубин", "Обрабатывает пустые массивы", "Названа проблема глубины и способ её обойти"],
      solution: [
        code("js", `export function flatten(array, depth = Infinity) {
  if (depth < 1) return [...array];
  const result = [];
  for (const item of array) {
    if (Array.isArray(item)) result.push(...flatten(item, depth - 1));   // рекурсивный шаг: глубина уменьшается
    else result.push(item);                                              // базовый случай: не массив
  }
  return result;
}

const nested = [1, [2, [3, [4, [5]]]]];
console.log(JSON.stringify(flatten(nested)), JSON.stringify(flatten(nested, 1)), JSON.stringify(flatten(nested, 0)));
console.log(JSON.stringify(flatten([])), JSON.stringify(flatten([[], [[]]])));
console.log(JSON.stringify(flatten(nested)) === JSON.stringify(nested.flat(Infinity)), JSON.stringify(flatten(nested, 2)) === JSON.stringify(nested.flat(2)));

// очень глубокая вложенность исчерпывает стек
let deep = [1];
for (let i = 0; i < 50_000; i++) deep = [deep];
try { flatten(deep); } catch (e) { console.log(e.name); }`, { filename: "flatten.mjs" }),
        code("text", `[1,2,3,4,5] [1,2,[3,[4,[5]]]] [1,[2,[3,[4,[5]]]]]
[] []
true true
RangeError`, { filename: "вывод Node.js 22.22.0" }),
        p("Базовые случаи — `depth < 1` (вернуть копию) и элемент, не являющийся массивом. Рекурсивный шаг уменьшает `depth`. При 50 000 уровнях вложенности стек исчерпывается (`RangeError`); обход можно сделать итеративным с явным стеком (массив пар «элемент, глубина») — глубина тогда ограничена памятью, а не стеком вызовов."),
      ],
    }),
  ],

  challenge: {
    id: "js.higher-order-recursion.challenge",
    title: "Функция curry",
    scenario: [
      p("В библиотеке утилит нужен `curry(fn)`: превращает функцию нескольких аргументов в «каррированную», которую можно вызывать с любой группировкой аргументов: `f(1)(2)(3)`, `f(1, 2)(3)`, `f(1)(2, 3)`, `f(1, 2, 3)`. Напишите модуль `curry.mjs`."),
    ],
    requirements: [
      "Все четыре способа вызова трёхаргументной функции дают одинаковый результат",
      "Когда накоплено не меньше аргументов, чем `fn.length`, вызывается исходная функция (лишние аргументы допустимы)",
      "Частично применённые функции независимы: `p = f(10)`; `p(1)(2)` и `p(5)(5)` не влияют друг на друга",
      "`this` сохраняется при вызове через `call`/`apply`",
    ],
    constraints: [
      "Без внешних библиотек",
      "Не изменять переданный массив аргументов (иначе частичные применения станут зависимыми)",
    ],
    acceptance: [
      "Все 9 проверок из теста проходят",
      "Функция одного параметра вызывается сразу: `curry((x) => x * 2)(5)` — `10`",
      "`curry` работает вместе с `map`: `map(double)([1, 2, 3])` — `[2, 4, 6]`",
    ],
    hints: [
      "Когда нужно вызывать исходную функцию, а когда — возвращать новую?",
      "Как накопить аргументы, не изменяя предыдущий массив?",
      "Как сохранить `this`?",
    ],
    solution: [
      code("js", `export function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);       // аргументов достаточно — вызываем
    return (...more) => curried.apply(this, [...args, ...more]);    // иначе ждём остальные
  };
}`, { filename: "curry.mjs", lineNumbers: true }),
      code("text", `ok   add3(1)(2)(3) → 6
ok   add3(1, 2)(3) → 6
ok   add3(1)(2, 3) → 6
ok   add3(1, 2, 3) → 6
ok   add3(1, 2, 3, 4) — лишний аргумент → 6
ok   curry(x => …)(5) → 10
ok   partial(1)(2) и partial(5)(5) независимы → 13,20
ok   this сохраняется → Привет, Борис, я Аня
ok   map(double)([1,2,3]) → 2,4,6
Все проверки пройдены`, { filename: "результат запуска тестов" }),
      p("Базовый случай — `args.length >= fn.length`; рекурсивный шаг возвращает функцию, которая вызывает `curried` с объединённым **новым** массивом `[...args, ...more]`, поэтому частичные применения независимы."),
    ],
  },

  interview: [
    iq("js.higher-order-recursion.i1", "basic", "Что такое функция высшего порядка? Приведите примеры.", [
      p("Функция, принимающая другие функции как аргументы или возвращающая функцию. Примеры: `map`, `filter`, `reduce`, `sort` (с колбэком), `Function.prototype.bind`, фабрики вроде `multiplier(k)`, декораторы `once`, `debounce`."),
    ]),
    iq("js.higher-order-recursion.i2", "basic", "Чем отличаются `map`, `filter` и `reduce`?", [
      ul(
        "`map` — преобразует каждый элемент, результат той же длины.",
        "`filter` — оставляет подходящие элементы, результат не длиннее исходного.",
        "`reduce` — сводит массив к одному значению (число, объект, массив); принимает начальное значение.",
        "Ни один из них не изменяет исходный массив (при чистых колбэках).",
      ),
    ]),
    iq("js.higher-order-recursion.i3", "intermediate", "Что делает `sort()` без аргументов и как отсортировать числа?", [
      ul(
        "Преобразует элементы в строки и сравнивает по кодовым единицам: `[10, 9, 1, 100].sort()` — `[1, 10, 100, 9]`.",
        "Изменяет исходный массив и возвращает его же.",
        "Числа: `sort((a, b) => a - b)`; без мутации: `toSorted(...)` или `[...arr].sort(...)`.",
        "Сортировка устойчива (стандарт ES2019): равные элементы сохраняют порядок.",
      ),
    ]),
    iq("js.higher-order-recursion.i4", "intermediate", "Что нужно любой рекурсивной функции и что будет без этого?", [
      ul(
        "Базовый случай, при котором функция возвращает результат без рекурсивного вызова.",
        "Шаг, который приближает аргумент к базовому случаю.",
        "Без них — бесконечная рекурсия и `RangeError: Maximum call stack size exceeded`.",
        "Глубина ограничена размером стека (порядка десятков тысяч кадров, в замере — около 12,5 тысяч).",
      ),
    ]),
    iq("js.higher-order-recursion.i5", "intermediate", "Что такое каррирование и частичное применение?", [
      ul(
        "Каррирование: `f(a, b, c)` → `f(a)(b)(c)` — цепочка функций одного аргумента.",
        "Частичное применение: фиксация части аргументов — `f.bind(null, a)` или `f(a)` в каррированной функции.",
        "Применение: специализированные функции из общих (`multiplier(2)`), конвейеры `pipe`, колбэки с зафиксированными параметрами.",
      ),
    ]),
    iq("js.higher-order-recursion.i6", "advanced", "Поддерживает ли JavaScript оптимизацию хвостовой рекурсии?", [
      ul(
        "Стандарт ES2015 её описывает, но V8 (Chrome, Node.js) её не реализует; в Safari (JavaScriptCore) она есть.",
        "Замер: `sumTail(100000)` в Node.js 22.22.0 — `RangeError`.",
        "Практика: для глубоких линейных обходов — цикл, трамплин или явный стек.",
      ),
    ]),
    iq("js.higher-order-recursion.i7", "engineering", "Как ускорить наивное вычисление чисел Фибоначчи?", [
      ul(
        "Мемоизация: кэш `Map` по аргументу — 242 785 вызовов `fib(25)` превращаются в 26 (замер).",
        "Цикл с двумя переменными: O(n) времени, O(1) памяти.",
        "Следить за точностью `number` (после 78-го числа теряется точность — нужен `bigint`).",
        "Мемоизировать можно только чистые функции.",
      ),
    ]),
    iq("js.higher-order-recursion.i8", "debugging", "Рекурсивная функция падает с «Maximum call stack size exceeded». Как искать причину?", [
      ul(
        "Проверить базовый случай: достижим ли он для данных, которые вызывают ошибку (например, `null`, пустой массив, цикл в графе).",
        "Убедиться, что каждый шаг уменьшает задачу; вывести аргумент на нескольких первых уровнях.",
        "Проверить циклические ссылки в данных (дерево на деле — граф); добавить множество посещённых узлов.",
        "Если глубина данных реальна и велика — заменить рекурсию циклом с явным стеком или трамплином.",
      ),
    ]),
  ],

  exam: [
    mcq("js.higher-order-recursion.e1", "foundation", "Что вернёт `[1, 2, 3].map((x) => x * 2)`?", ["`[1, 2, 3]` (исходный массив изменён)", "`12`", "`[2, 4, 6]`", "`undefined`"], 2, "`map` возвращает новый массив результатов вызова функции для каждого элемента и не изменяет исходный."),
    mcq("js.higher-order-recursion.e2", "foundation", "Что вернёт `[].reduce((a, b) => a + b, 0)`?", ["`0`", "`undefined`", "`TypeError`", "`NaN`"], 0, "При пустом массиве и заданном начальном значении `reduce` возвращает это значение; без него — `TypeError`."),
    mcq("js.higher-order-recursion.e3", "intermediate", "Что вернёт `[10, 9, 1, 100].sort()`?", ["`[1, 9, 10, 100]`", "`[10, 9, 1, 100]`", "`[100, 10, 9, 1]`", "`[1, 10, 100, 9]`"], 3, "Без функции сравнения элементы сравниваются как строки; `\"1\" < \"10\" < \"100\" < \"9\"` (замер)."),
    mcq("js.higher-order-recursion.e4", "intermediate", "Что произойдёт при вызове `factorial(n)` без базового случая?", ["Вернёт `Infinity`", "`RangeError: Maximum call stack size exceeded`", "Вернёт `undefined`", "Зависнет навсегда без ошибки"], 1, "Каждый вызов добавляет кадр в стек; когда он исчерпан, движок бросает `RangeError`."),
    mcq("js.higher-order-recursion.e5", "intermediate", "Какие методы изменяют исходный массив? Выберите все.", ["`sort`", "`map`", "`toSorted`", "`reverse`"], [0, 3], "`sort` и `reverse` изменяют массив; `map` и `toSorted` возвращают новый."),
    mcq("js.higher-order-recursion.e6", "advanced", "Что вернёт `pipe(trim, upper, exclaim)(\"  привет \")` по сравнению с `compose(trim, upper, exclaim)`?", ["Одинаковый результат", "`compose` применяет только первую функцию", "`pipe` бросает ошибку", "`pipe` применяет функции слева направо, `compose` — справа налево, результаты различаются"], 3, "В замере `pipe` дал `ПРИВЕТ!`, `compose` — `ПРИВЕТ !`: разный порядок применения."),
    open("js.higher-order-recursion.e7", "intermediate", "Когда вы выберете цикл, а когда `map`/`filter`/`reduce`?", [
      ul(
        "Методы — для преобразований данных, когда важно выразить «что» и получить новое значение без мутаций.",
        "Цикл — для раннего выхода, обхода с несколькими накопителями, работы с индексами, очень больших объёмов и когда нужны `await` внутри.",
        "`some`/`find`/`every` — компромисс: короткая запись и ранний выход.",
        "Критерий — читаемость и ограничения (производительность, стек), а не мода.",
      ),
    ], ["Названы случаи для методов", "Названы случаи для цикла", "Упомянут ранний выход"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.higher-order-recursion.m1", "intermediate", "Что вернёт `[\"1\", \"2\", \"3\"].map(parseInt)`?", ["`[1, 2, 3]`", "`[NaN, NaN, NaN]`", "`[1, NaN, NaN]`", "`[0, 1, 2]`"], 2, "`map` передаёт индекс вторым аргументом, и `parseInt` использует его как основание системы счисления."),
    mcq("js.higher-order-recursion.m2", "advanced", "Почему мемоизация сократила `fib(25)` с 242 785 до 26 вызовов?", ["Движок автоматически кэширует все функции", "Кэш хранит результаты по аргументу, и повторные подзадачи берутся из него", "Хвостовая оптимизация", "Результат вычислен на этапе компиляции"], 1, "Без кэша подзадачи пересчитываются экспоненциально много раз; с кэшем каждое значение вычисляется один раз."),
    mcq("js.higher-order-recursion.m3", "advanced", "Почему `sumTail(100000)` в Node.js падает, хотя функция хвостовая?", ["V8 не оптимизирует хвостовые вызовы, стек всё равно растёт", "Ошибка в коде", "Хвостовая рекурсия запрещена стандартом", "`acc` переполняется"], 0, "Стандарт описывает оптимизацию, но V8 её не реализует: в замере `RangeError`."),
    open("js.higher-order-recursion.m4", "advanced", "Спроектируйте функцию `walk(tree, visit)`, которая обходит дерево произвольной глубины (до миллиона узлов) и не переполняет стек.", [
      ul(
        "Рекурсия неприемлема из-за глубины: используем явный стек (массив) и цикл `while`.",
        "Алгоритм: положить корень в стек; пока стек не пуст — взять узел, вызвать `visit`, положить детей (в обратном порядке, чтобы сохранить порядок обхода).",
        "Защита от циклов: `Set` посещённых узлов, если структура может быть графом.",
        "Ограничения: максимальное число узлов и таймаут; возможность прервать обход (`visit` возвращает `false`).",
        "Тесты: пустое дерево, один узел, очень глубокая цепочка (100 000 уровней), широкое дерево.",
      ),
    ], ["Выбран явный стек", "Описан порядок обхода", "Учтены циклы", "Названы тесты глубины"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.higher-order-recursion.f1", front: "map / filter / reduce?", back: "map — преобразовать каждый; filter — отобрать; reduce — свести к одному. Исходный массив не меняют." },
    { id: "js.higher-order-recursion.f2", front: "sort по умолчанию?", back: "Сравнивает как строки и изменяет массив: [10,9,1,100] → [1,10,100,9]. Числа: (a,b)=>a-b; копия: toSorted." },
    { id: "js.higher-order-recursion.f3", front: "reduce без initial?", back: "Берёт первый элемент как аккумулятор; пустой массив → TypeError. Всегда передавайте начальное значение." },
    { id: "js.higher-order-recursion.f4", front: "Рекурсия: что нужно?", back: "Базовый случай + шаг, приближающий к нему. Иначе RangeError: Maximum call stack size exceeded." },
    { id: "js.higher-order-recursion.f5", front: "Хвостовые вызовы в V8?", back: "Не оптимизируются: sumTail(100000) → RangeError. Цикл, явный стек или трамплин." },
    { id: "js.higher-order-recursion.f6", front: "Мемоизация?", back: "Кэш результатов чистой функции по аргументам: fib(25) 242 785 вызовов → 26." },
    { id: "js.higher-order-recursion.f7", front: "pipe и compose?", back: "pipe(f,g,h)(x) = h(g(f(x))) слева направо; compose — справа налево." },
  ],

  sources: [
    { title: "ECMAScript: Array.prototype.map / filter / reduce / sort", url: "https://tc39.es/ecma262/#sec-properties-of-the-array-prototype-object", publisher: "ECMA" },
    { title: "ECMAScript: Tail Position Calls", url: "https://tc39.es/ecma262/#sec-tail-position-calls", publisher: "ECMA" },
    { title: "MDN: Array.prototype.reduce()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce", publisher: "MDN" },
    { title: "MDN: Array.prototype.sort()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort", publisher: "MDN" },
    { title: "MDN: Array.prototype.toSorted()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted", publisher: "MDN" },
    { title: "MDN: Array.prototype.flatMap()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap", publisher: "MDN" },
    { title: "MDN: Function.prototype.bind()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind", publisher: "MDN" },
    { title: "MDN: RangeError: Maximum call stack size exceeded", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Too_much_recursion", publisher: "MDN" },
    { title: "MDN: Recursion (глоссарий)", url: "https://developer.mozilla.org/en-US/docs/Glossary/Recursion", publisher: "MDN" },
  ],
};
