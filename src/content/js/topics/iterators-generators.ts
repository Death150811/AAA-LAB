import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  note,
  tip,
  insight,
  table,
  def,
  wrongRight,
  beforeAfter,
  annotated,
  steps,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const iteratorsGenerators: Topic = {
  id: "js.iterators-generators",
  slug: "iterators-generators",
  domain: "js",
  module: "modern",
  title: "Итераторы и генераторы",
  titleEn: "Iterators and generators",
  summary:
    "Протокол итерации — договорённость: **итерируемый** объект имеет метод `[Symbol.iterator]()`, возвращающий **итератор** с методом `next()`, который отдаёт `{ value, done }`. На нём работают `for…of`, spread, деструктуризация, `Array.from`, `Map`, `Set`. Генератор (`function*`) — удобный способ писать итераторы: `yield` приостанавливает функцию и отдаёт значение, `next(x)` возобновляет и передаёт значение внутрь, `return()` и `throw()` завершают её (с выполнением `finally`). Тема на замерах в Node.js 22 и Chromium 141 разбирает протокол и его последствия (одноразовость итератора, `return()` при `break`), порядок выполнения генератора, `yield*`, бесконечные последовательности, ленивые конвейеры (26 вызовов против 2 000 000 у массива), стандартные iterator helpers, асинхронные генераторы и `for await…of`, и учит писать итерируемые структуры данных и набор ленивых операций.",
  minutes: 80,
  prerequisites: ["js.arrays", "js.classes", "js.destructuring-spread"],
  tags: ["iterator", "iterable", "Symbol.iterator", "generator", "yield", "yield*", "lazy evaluation", "for…of", "async generator", "for await", "iterator helpers", "protocol", "return()", "infinite sequence"],
  keyConcepts: [
    { term: "Итерируемый и итератор — разные вещи", text: "Итерируемый объект (массив, строка, `Map`, генератор) имеет `[Symbol.iterator]()`; итератор — объект с `next()`. Итератор **одноразовый**: `[...once]` второй раз вернул `[]`, а итерируемый объект можно обходить сколько угодно раз, получая новый итератор." },
    { term: "Генератор — это итератор, написанный функцией", text: "`function*` возвращает объект-генератор; тело **не выполняется** до первого `next()`. `yield` отдаёт значение и приостанавливает функцию, значение `return` попадает в `{ done: true }` и **не** попадает в `for…of` и spread." },
    { term: "Досрочный выход закрывает итератор", text: "`break`, деструктуризация `[a, b] = it` и исключения вызывают `return()` у итератора; в генераторе при этом выполняется `finally`. Так освобождаются ресурсы." },
    { term: "Ленивость экономит работу", text: "Конвейер `map → filter → take(5)` на генераторах сделал 26 вызовов колбэков, а на массиве из миллиона элементов — 2 000 000: каждый шаг массива обрабатывает всё, генератор — только нужное." },
    { term: "Генераторы двусторонние", text: "`const x = yield 1` — значение, переданное в `next(x)`, становится результатом `yield`; `throw(e)` бросает ошибку внутри генератора; повторный вход в работающий генератор — `TypeError: Generator is already running`." },
  ],
  sections: [
    section("definition", [
      def("Итерируемый объект (iterable)", "Объект с методом `[Symbol.iterator]()`, возвращающим итератор. Массивы, строки, `Map`, `Set`, `arguments`, генераторы — итерируемые.", "iterable"),
      def("Итератор (iterator)", "Объект с методом `next()`, возвращающим `{ value, done }`; `done: true` означает конец. Необязательный `return()` вызывается при досрочном завершении.", "iterator"),
      def("Протокол итерации", "Соглашение между итерируемыми объектами и потребителями (`for…of`, spread, деструктуризация, `Array.from`, `Promise.all`…).", "iteration protocol"),
      def("Генератор", "Функция `function*`, выполнение которой можно приостанавливать (`yield`) и возобновлять. Вызов возвращает объект-генератор: он одновременно итератор и итерируемый объект.", "generator"),
      def("`yield` и `yield*`", "`yield value` отдаёт значение и приостанавливает; `yield* iterable` делегирует другому итерируемому объекту (значением выражения служит его `return`).", "yield / yield*"),
      def("Ленивое вычисление", "Вычисление значений по требованию, а не заранее; позволяет работать с бесконечными последовательностями и останавливаться, как только результат получен.", "lazy evaluation"),
      def("Асинхронный итератор", "Итератор, `next()` которого возвращает `Promise`; обходится `for await…of`; метод — `[Symbol.asyncIterator]()`; пишется как `async function*`.", "async iterator"),
      def("Iterator helpers", "Стандартные методы `map`, `filter`, `take`, `drop`, `flatMap`, `reduce`, `toArray`, `some`, `find` и др. на итераторах (`Iterator.prototype`): ленивые аналоги методов массива.", "iterator helpers"),
    ]),

    section("why", [
      h("Единый способ обхода чего угодно"),
      p("Когда вы пишете `for (const x of something)`, вы не знаете и не должны знать, что такое `something`: массив, строка, `Set`, результат запроса или поток из сети. Протокол итерации делает обход единым и расширяемым: ваша структура данных, реализовав его, автоматически работает со всеми конструкциями языка. А генераторы позволяют писать такие обходы в одну функцию, а не в класс с ручным состоянием."),
      ul(
        "**Свои структуры данных:** связные списки, деревья, графы, диапазоны, страницы API обходятся стандартными `for…of` и spread.",
        "**Ленивость и бесконечные потоки:** идентификаторы, числа Фибоначчи, чтение файла кусками — без хранения всего в памяти.",
        "**Ресурсы:** `return()` и `finally` дают предсказуемую очистку при досрочном выходе.",
        "**Асинхронные данные:** `for await…of` и асинхронные генераторы — естественная запись постраничной загрузки и потоков.",
        "**Основа других тем:** `async/await` исторически построен на генераторах; деструктуризация и spread — на итераторах.",
      ),
      insight("Итератор — это **курсор над последовательностью**, а генератор — **функция, которая умеет «ставить себя на паузу»**. Вместе они позволяют описывать последовательности алгоритмом, а не заранее построенным массивом."),
    ]),

    section("mental-model", [
      p("Представьте **выдачу книг в библиотеке**. Каталог (итерируемый объект) умеет сказать: «вот выдающий» (`[Symbol.iterator]()` — новый **итератор**). Выдающий помнит, где вы остановились, и по просьбе «следующую» (`next()`) отдаёт книгу с пометкой «ещё есть» (`done: false`) или «книги закончились» (`done: true`). Если вы ушли, не дочитав, вы сообщаете выдающему (`return()`), чтобы он закрыл читальный зал. Выдающий — **одноразовый**: раз пройдя каталог, он второй раз ничего не даст; чтобы читать снова, нужен новый выдающий от каталога. **Генератор** — это сам выдающий, которого записали **сценарием** с остановками: «сходи за первой книгой — **стоп** (`yield`) — потом за второй — **стоп** …». Пока вы не попросили, он даже не вставал с места."),
      table(
        ["Понятие", "Что умеет", "Как использовать"],
        [
          ["Итерируемый объект", "Создавать итераторы (`[Symbol.iterator]()`)", "`for…of`, spread `[...x]`, деструктуризация, `Array.from(x)`, `new Set(x)`"],
          ["Итератор", "Отдавать значения (`next()`), закрываться (`return()`)", "Вручную `it.next()`; обычно — через `for…of`"],
          ["Генератор", "Быть и тем и другим; хранить состояние в локальных переменных", "`function*` + `yield`; ленивые последовательности и обходы"],
          ["Асинхронный итератор", "Отдавать обещания значений", "`for await…of`, `async function*`"],
          ["Iterator helpers", "Ленивые `map`/`filter`/`take` на итераторах", "`gen().filter(…).map(…).take(5).toArray()`"],
        ],
        "Участники протокола итерации",
      ),
    ]),

    section("technical", [
      h("Протокол итерации вручную"),
      code("js", `// итератор вручную: объект с методом next(), возвращающим { value, done }
const it = [10, 20][Symbol.iterator]();
console.log(it.next(), it.next(), it.next(), it.next());
console.log(typeof [][Symbol.iterator], it[Symbol.iterator]() === it);     // итератор массива сам итерируем

// собственный итерируемый объект
const range = {
  from: 1,
  to: 4,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    return {
      next: () => (current <= last ? { value: current++, done: false } : { value: undefined, done: true }),
    };
  },
};
console.log([...range], Array.from(range, (x) => x * x), Math.max(...range));
const [first, second] = range;
console.log(first, second);
for (const x of range) process.stdout.write(x + " ");
console.log();

// обычный объект итерируемым не является
try { for (const x of { a: 1 }) { /* никогда */ } } catch (e) { console.log(e.name + ": " + e.message); }

// досрочный выход вызывает return() у итератора
const tracked = {
  [Symbol.iterator]() {
    let i = 0;
    return {
      next: () => ({ value: i++, done: false }),
      return() { console.log("  → return() вызван: ресурсы освобождены"); return { done: true }; },
    };
  },
};
for (const x of tracked) { if (x === 2) break; }
const [a, b] = tracked;                                   // деструктуризация берёт два значения и вызывает return()
console.log(a, b);

// встроенные итерируемые объекты
console.log([..."a😀"], [...new Set([1, 1, 2])], [...new Map([["k", 1]])], [...[7, 8].entries()], [...[7, 8].keys()]);
console.log(Object.prototype.toString.call([][Symbol.iterator]()), Object.prototype.toString.call(new Map().entries()));

// итератор одноразовый
const once = [1, 2, 3][Symbol.iterator]();
console.log([...once], [...once]);`, { filename: "g1-protocol.mjs", lineNumbers: true }),
      code("text", `{ value: 10, done: false } { value: 20, done: false } { value: undefined, done: true } { value: undefined, done: true }
function true
[ 1, 2, 3, 4 ] [ 1, 4, 9, 16 ] 4
1 2
1 2 3 4 
TypeError: {(intermediate value)} is not iterable
  → return() вызван: ресурсы освобождены
  → return() вызван: ресурсы освобождены
0 1
[ 'a', '😀' ] [ 1, 2 ] [ [ 'k', 1 ] ] [ [ 0, 7 ], [ 1, 8 ] ] [ 0, 1 ]
[object Array Iterator] [object Map Iterator]
[ 1, 2, 3 ] []`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Результат `next()`:** `{ value, done }`; после конца итератор продолжает отвечать `{ value: undefined, done: true }`.",
        "**Итератор массива сам итерируем** (`it[Symbol.iterator]() === it`): поэтому итераторы можно передавать туда, где ждут итерируемый объект.",
        "**Свой итерируемый объект:** метод `[Symbol.iterator]()` возвращает новый итератор со своим состоянием (`current`), поэтому объект можно обходить много раз (`[...range]`, `Array.from`, `Math.max(...range)`, деструктуризация, `for…of`).",
        "**Обычный объект не итерируем:** `for (const x of { a: 1 })` — `TypeError: {(intermediate value)} is not iterable`.",
        "**Досрочный выход вызывает `return()`:** и `break` в цикле, и деструктуризация `[a, b] = tracked` (после двух значений) вызвали `return()` — место, где закрывают файлы, соединения, таймеры.",
        "**Встроенные итерируемые:** строки идут по кодовым точкам (`[...\"a😀\"]` → `['a', '😀']`), `Set`, `Map` (пары), `entries()`, `keys()`; тип итератора видно в `Object.prototype.toString` (`[object Array Iterator]`, `[object Map Iterator]`).",
        "**Итератор одноразовый:** `[...once]` → `[1, 2, 3]`, повторно → `[]`.",
      ),

      h("Генераторы: пауза, возобновление, обмен значениями"),
      code("js", `function* counter() {
  console.log("  старт тела");
  const x = yield 1;                // yield отдаёт значение и приостанавливает; результат yield — то, что передали в next(...)
  console.log("  получено:", x);
  const y = yield 2;
  console.log("  получено:", y);
  return "итог";                    // значение return — в последнем результате { done: true }
}

const gen = counter();
console.log("создан, тело ещё не выполнялось");
console.log(gen.next("игнорируется"));       // первый next: аргумент теряется, выполнение до первого yield
console.log(gen.next("A"));
console.log(gen.next("B"));
console.log(gen.next(), gen[Symbol.iterator]() === gen);

// for…of и spread не включают значение return
function* two() { yield "a"; yield "b"; return "не попадёт"; }
console.log([...two()], Array.from(two()));

// yield* делегирует другому итерируемому объекту; значением выражения служит его return
function* inner() { yield 1; yield 2; return "inner-return"; }
function* outer() { const r = yield* inner(); yield \`inner вернул: \${r}\`; yield* [10, 20]; yield* "ab"; }
console.log([...outer()]);

// бесконечные последовательности и ленивость
function* naturals() { let n = 1; while (true) yield n++; }
function* take(iterable, n) { if (n <= 0) return; for (const x of iterable) { yield x; if (--n <= 0) return; } }
console.log([...take(naturals(), 5)]);

// throw() и return()
function* guarded() {
  try { yield 1; yield 2; yield 3; }
  catch (e) { console.log("  внутри генератора поймано:", e); yield "восстановлен"; }
  finally { console.log("  finally выполнен"); }
}
const g1 = guarded(); g1.next();
console.log(g1.throw("ошибка снаружи"), g1.next());
const g2 = guarded(); g2.next();
console.log(g2.return("досрочно"), g2.next());
for (const v of guarded()) { if (v === 1) break; }          // break вызывает return() → finally

// повторный вход и состояние
function* reentrant() { try { gen2.next(); } catch (e) { yield e.name + ": " + e.message; } }
const gen2 = reentrant();
console.log(gen2.next().value);
console.log(Object.prototype.toString.call(gen2), typeof gen2.next, counter.constructor.name);`, { filename: "g2-generators.mjs", lineNumbers: true }),
      code("text", `создан, тело ещё не выполнялось
  старт тела
{ value: 1, done: false }
  получено: A
{ value: 2, done: false }
  получено: B
{ value: 'итог', done: true }
{ value: undefined, done: true } true
[ 'a', 'b' ] [ 'a', 'b' ]
[ 1, 2, 'inner вернул: inner-return', 10, 20, 'a', 'b' ]
[ 1, 2, 3, 4, 5 ]
  внутри генератора поймано: ошибка снаружи
  finally выполнен
{ value: 'восстановлен', done: false } { value: undefined, done: true }
  finally выполнен
{ value: 'досрочно', done: true } { value: undefined, done: true }
  finally выполнен
TypeError: Generator is already running
[object Generator] function GeneratorFunction`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Ленивый старт:** после `counter()` напечатано только «создан, тело ещё не выполнялось»; тело стартует при первом `next()` и работает до ближайшего `yield`.",
        "**Двусторонний обмен:** `const x = yield 1` — значение, переданное в `next(\"A\")`, становится результатом `yield`. Аргумент **первого** `next` теряется (нет `yield`, который его принял).",
        "**Значение `return`:** `{ value: 'итог', done: true }`; `for…of`, spread и `Array.from` его **не** включают (`[...two()]` → `['a', 'b']`).",
        "**Генератор итерируем сам:** `gen[Symbol.iterator]() === gen`.",
        "**`yield*`:** делегирует вложенному итерируемому (генератору, массиву, строке), а значением выражения служит `return` вложенного генератора (`inner вернул: inner-return`).",
        "**Бесконечные последовательности:** `naturals()` не создаёт массив; `take(naturals(), 5)` берёт первые пять и останавливается.",
        "**`throw()` и `return()`:** `throw(\"ошибка снаружи\")` бросает исключение в точке `yield`; `catch` внутри перехватил его, а генератор продолжил (`восстановлен`); `return(\"досрочно\")` завершает генератор и выполняет `finally`; `break` в `for…of` вызывает `return()` — `finally` тоже выполнен.",
        "**Повторный вход запрещён:** вызов `next()` у уже работающего генератора — `TypeError: Generator is already running`.",
        "**Тип:** `Object.prototype.toString.call(gen)` — `[object Generator]`, `counter.constructor.name` — `GeneratorFunction`.",
      ),

      h("Ленивые конвейеры"),
      code("js", `const N = 1_000_000;
let eagerCalls = 0, lazyCalls = 0;

// энергичный конвейер на массиве: каждый шаг обрабатывает ВСЕ элементы
const source = Array.from({ length: N }, (_, i) => i);
const eager = source
  .map((x) => { eagerCalls++; return x * 2; })
  .filter((x) => { eagerCalls++; return x % 3 === 0; })
  .slice(0, 5);

// ленивый конвейер на генераторах: элементы идут по одному и конвейер останавливается, когда результат получен
function* map(iterable, fn) { for (const x of iterable) yield fn(x); }
function* filter(iterable, pred) { for (const x of iterable) if (pred(x)) yield x; }
function* take(iterable, n) { if (n <= 0) return; for (const x of iterable) { yield x; if (--n <= 0) return; } }
function* naturals() { let n = 0; while (true) yield n++; }

const lazy = [...take(
  filter(map(naturals(), (x) => { lazyCalls++; return x * 2; }), (x) => { lazyCalls++; return x % 3 === 0; }),
  5,
)];

console.log(eager, lazy);
console.log("вызовов колбэков — энергично:", eagerCalls, "лениво:", lazyCalls);

// порядок побочных эффектов: элемент проходит весь конвейер, прежде чем начнётся следующий
const log = [];
const trace = (name) => function* (it) { for (const x of it) { log.push(\`\${name}(\${x})\`); yield x; } };
for (const x of trace("B")(trace("A")([1, 2]))) log.push(\`итог(\${x})\`);
console.log(log.join(" "));`, { filename: "g3-lazy.mjs", lineNumbers: true }),
      code("text", `[ 0, 6, 12, 18, 24 ] [ 0, 6, 12, 18, 24 ]
вызовов колбэков — энергично: 2000000 лениво: 26
A(1) B(1) итог(1) A(2) B(2) итог(2)`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Энергичный конвейер** на массиве из миллиона элементов вызвал колбэки `2 000 000` раз (`map` — на всех, затем `filter` — на всех), хотя нужно было пять результатов.",
        "**Ленивый конвейер** на генераторах сделал `26` вызовов: каждый элемент проходит все шаги, прежде чем стартует следующий, а `take` останавливает всё, получив пять значений.",
        "**Порядок побочных эффектов:** `A(1) B(1) итог(1) A(2) B(2) итог(2)` — элементы идут по одному сквозь всю цепочку.",
        "**Цена ленивости:** одноразовость итератора и невозможность `length`/индексов; для повторного использования результата соберите его в массив.",
      ),

      h("Iterator helpers: стандартные ленивые методы"),
      code("js", `// Iterator helpers (стандартный API, Node.js 22 и Chromium 141): ленивые методы на итераторах
function* naturals() { let n = 1; while (true) yield n++; }

const result = naturals()
  .filter((n) => n % 2 === 0)
  .map((n) => n * n)
  .drop(1)
  .take(4)
  .toArray();
console.log(result);

console.log(typeof Iterator, typeof naturals().map, naturals().take(3) instanceof Iterator);
console.log([1, 2, 3].values().map((x) => x * 10).toArray(), new Set([1, 2]).values().some((x) => x > 1));
console.log(naturals().take(5).reduce((a, b) => a + b), naturals().find((n) => n > 41), [...Iterator.from({ next() { return { done: true }; } })]);
console.log(naturals().flatMap((n) => [n, -n]).take(4).toArray());
naturals().take(2).forEach((n) => process.stdout.write("n=" + n + " "));
console.log();`, { filename: "g4-helpers.mjs", lineNumbers: true }),
      code("text", `[ 16, 36, 64, 100 ]
function function true
[ 10, 20, 30 ] true
15 42 []
[ 1, -1, 2, -2 ]
n=1 n=2 `, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Цепочка методов на итераторе:** `naturals().filter(…).map(…).drop(1).take(4).toArray()` — `[16, 36, 64, 100]`; вычислено лениво, бесконечный источник не мешает.",
        "**Доступность:** в Node.js 22.22.0 и Chromium 141 `Iterator` и методы (`map`, `filter`, `take`, `drop`, `flatMap`, `reduce`, `find`, `some`, `forEach`, `toArray`) присутствуют (замер); `Iterator.from(…)` оборачивает любой объект с `next()`.",
        "**Обычные итерируемые** (`[1, 2, 3].values()`, `new Set(…).values()`) тоже получили эти методы. Для сред без поддержки используйте собственные генераторы (раздел «Подробный пример»).",
        "**Проверка поддержки:** `typeof Iterator === \"function\" && typeof Iterator.prototype.map === \"function\"`.",
      ),

      h("Рекурсивные обходы и практические генераторы"),
      code("js", `const menu = {
  title: "Меню",
  children: [
    { title: "Файл", children: [{ title: "Открыть", children: [] }, { title: "Сохранить", children: [] }] },
    { title: "Правка", children: [{ title: "Копировать", children: [] }] },
  ],
};

// обход в глубину: yield* делегирует рекурсивному вызову
function* walk(node, depth = 0) {
  yield { title: node.title, depth };
  for (const child of node.children) yield* walk(child, depth + 1);
}
console.log([...walk(menu)].map(({ title, depth }) => "  ".repeat(depth) + title).join("\\n"));

// ленивый поиск: обход прекращается при первом найденном
let visited = 0;
function* walkCounted(node) { visited++; yield node.title; for (const c of node.children) yield* walkCounted(c); }
const found = walkCounted(menu).find((t) => t === "Открыть");
console.log(found, "посещено узлов:", visited);

// перестановки
function* permutations(items) {
  if (items.length <= 1) { yield items; return; }
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) yield [items[i], ...p];
  }
}
console.log([...permutations([1, 2, 3])].map((p) => p.join("")).join(" "));

// разворачивание вложенных массивов
function* flatten(arr) { for (const x of arr) Array.isArray(x) ? yield* flatten(x) : yield x; }
console.log([...flatten([1, [2, [3, [4]], 5]])]);

// последовательность идентификаторов
function* ids(prefix) { let n = 0; while (true) yield \`\${prefix}-\${++n}\`; }
const nextId = ids("user");
console.log(nextId.next().value, nextId.next().value);`, { filename: "g5-tree.mjs", lineNumbers: true }),
      code("text", `Меню
  Файл
    Открыть
    Сохранить
  Правка
    Копировать
Открыть посещено узлов: 3
123 132 213 231 312 321
[ 1, 2, 3, 4, 5 ]
user-1 user-2`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Обход дерева:** `yield* walk(child, depth + 1)` — рекурсия без накопления массива: меню выводится по уровням.",
        "**Ленивый поиск:** `find` остановил обход на третьем узле (`посещено узлов: 3` из 6).",
        "**Перестановки:** `yield` внутри вложенных циклов и рекурсии даёт `123 132 213 231 312 321` без хранения всех вариантов.",
        "**Генератор идентификаторов:** состояние (`n`) живёт в локальных переменных функции — замыкание не нужно.",
      ),

      h("Асинхронные итераторы и `for await…of`"),
      code("js", `const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// асинхронный генератор: страницы «приходят» по одной
async function* pages(total) {
  try {
    for (let page = 1; page <= total; page++) {
      await sleep(50);
      yield { page, items: [page * 10, page * 10 + 1] };
    }
  } finally {
    console.log("  источник закрыт");
  }
}

for await (const { page, items } of pages(3)) console.log(\`страница \${page}:\`, items);

// ранний выход закрывает источник
for await (const { page } of pages(10)) { if (page === 2) break; }

// асинхронный итератор вручную: Symbol.asyncIterator
const ticker = {
  [Symbol.asyncIterator]() {
    let n = 0;
    return { async next() { await sleep(10); return n < 3 ? { value: n++, done: false } : { value: undefined, done: true }; } };
  },
};
const ticks = [];
for await (const n of ticker) ticks.push(n);
console.log(ticks);

// for await допускает и обычные итерируемые объекты с обещаниями
for await (const v of [Promise.resolve("a"), "b", sleep(5).then(() => "c")]) process.stdout.write(v + " ");
console.log();

// последовательность: элементы обрабатываются по одному
const order = [];
await (async () => { for await (const n of pages(2)) order.push(n.page); })();
console.log(order);

// ошибка в источнике попадает в try/catch вокруг цикла
async function* failing() { yield 1; throw new Error("источник упал"); }
try { for await (const v of failing()) console.log("получено", v); } catch (e) { console.log("поймано:", e.message); }`, { filename: "g6-async.mjs", lineNumbers: true }),
      code("text", `страница 1: [ 10, 11 ]
страница 2: [ 20, 21 ]
страница 3: [ 30, 31 ]
  источник закрыт
  источник закрыт
[ 0, 1, 2 ]
a b c 
  источник закрыт
[ 1, 2 ]
получено 1
поймано: источник упал`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`async function*`** сочетает `await` и `yield`: каждая страница «приходит» с задержкой; цикл `for await…of` получает их по одной.",
        "**Закрытие источника:** `break` (на странице 2 из 10) вызывает `return()` асинхронного генератора — выполнен `finally` («источник закрыт»); столько же при нормальном завершении.",
        "**`Symbol.asyncIterator`:** асинхронный итератор вручную — `next()` возвращает `Promise`.",
        "**`for await` над обычным итерируемым** ожидает каждый элемент (`Promise`, значение или `thenable`).",
        "**Ошибки:** исключение внутри асинхронного генератора превращается в отказ обещания `next()` и ловится `try/catch` вокруг цикла (`поймано: источник упал`).",
        "**Последовательность:** `for await` обрабатывает элементы по одному; параллельная загрузка — отдельная задача (`Promise.all`, тема об асинхронности).",
      ),
      note("Подробно об обещаниях, `async/await` и их порядке выполнения — в темах модуля «Асинхронность». Здесь важно понимать, что асинхронные итераторы — тот же протокол, но с `Promise` в результате `next()`."),
    ]),

    section("syntax", [
      annotated(
        "js",
        `function* countdown(from) {            // звёздочка делает функцию генератором
  while (from > 0) {
    yield from;                        // отдать значение и приостановиться
    from--;
  }
  return "пуск";                       // значение для { done: true }
}

const gen = countdown(3);              // тело ещё не выполнялось
console.log(gen.next());               // { value: 3, done: false }
console.log([...gen]);                 // оставшиеся значения: [2, 1]

const range = {                        // итерируемый объект: метод с ключом Symbol.iterator
  *[Symbol.iterator]() { yield 1; yield 2; yield 3; },
};
for (const n of range) console.log(n); // for…of вызывает Symbol.iterator и next()`,
        [
          { line: 1, text: "Звёздочка после `function` делает функцию генератором: вызов `countdown(3)` не выполняет тело, а возвращает объект-генератор." },
          { line: 3, text: "`yield from` отдаёт значение вызывающему и приостанавливает функцию; локальные переменные сохраняются до следующего `next()`." },
          { line: 6, text: "Значение `return` попадает в последний результат `{ value: \"пуск\", done: true }`; `for…of` и spread его не используют." },
          { line: 9, text: "Тело ещё не выполнялось: генератор «спит» до первого `next()`." },
          { line: [10, 11], text: "`next()` вернул `{ value: 3, done: false }`; spread продолжил с места остановки и собрал `[2, 1]` (значение `return` не включено)." },
          { line: [13, 15], text: "Итерируемый объект: ключ `[Symbol.iterator]` у метода-генератора (`*`); каждый вызов даёт новый итератор." },
          { line: 16, text: "`for…of` сам вызывает `[Symbol.iterator]()` и `next()` до `done: true`." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Генератор по шагам</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 34rem; }
  button { font: inherit; padding: .35rem .9rem; margin: 0 .5rem .5rem 0; }
  pre { background: #8881; padding: .75rem; border-radius: 6px; min-height: 8rem; white-space: pre-wrap; }
</style>
<h1>Числа Фибоначчи на генераторе</h1>
<button id="next">next()</button>
<button id="take">Взять 10 (for…of)</button>
<button id="reset">Новый генератор</button>
<pre id="log" aria-live="polite"></pre>
<script type="module">
  function* fibonacci() {                          // бесконечная последовательность без массива
    let [a, b] = [0, 1];
    try {
      while (true) {
        yield a;
        [a, b] = [b, a + b];
      }
    } finally {
      log.textContent += "· генератор закрыт (finally)\\n";
    }
  }

  const log = document.querySelector("#log");
  let gen = fibonacci();
  const print = (text) => { log.textContent += text + "\\n"; };

  document.querySelector("#next").addEventListener("click", () => print("next() → " + JSON.stringify(gen.next())));

  document.querySelector("#take").addEventListener("click", () => {
    const taken = [];
    for (const n of gen) {                          // продолжаем с того места, где остановились
      taken.push(n);
      if (taken.length === 10) break;               // break вызывает return() → finally
    }
    print("for…of взял: " + taken.join(", "));
    gen = fibonacci();                              // закрытый генератор больше не отдаёт значений
  });

  document.querySelector("#reset").addEventListener("click", () => { gen = fibonacci(); print("создан новый генератор"); });
</script>`, { filename: "stepper.html", runnable: true, lineNumbers: true }),
      p("Бесконечная последовательность Фибоначчи на генераторе. Замер в Chromium 141: три нажатия `next()` дали `{\"value\":0,\"done\":false}`, `{\"value\":1,…}`, `{\"value\":1,…}`; «Взять 10 (for…of)» продолжил с места остановки и взял `2, 3, 5, 8, 13, 21, 34, 55, 89, 144`, а `break` вызвал `return()` — в журнале появилось «генератор закрыт (finally)»; ошибок страницы нет."),
    ]),

    section("detailed-example", [
      p("Набор ленивых операций `seq.mjs`: `range` (в том числе бесконечный), `map`, `filter`, `take`, `takeWhile`, `zip`, `chunk`, `flatten`, `cycle`, `toArray`. Все — генераторы; источники закрываются при досрочном выходе потребителя, а `zip` закрывает все свои источники."),
      code("js", `// Ленивые операции над итерируемыми объектами на генераторах.

export function* range(start, end = Infinity, step = 1) {
  if (step === 0) throw new RangeError("Шаг не может быть нулём");
  if (step > 0) for (let n = start; n < end; n += step) yield n;
  else for (let n = start; n > end; n += step) yield n;
}

export function* map(iterable, fn) { let i = 0; for (const x of iterable) yield fn(x, i++); }
export function* filter(iterable, pred) { let i = 0; for (const x of iterable) if (pred(x, i++)) yield x; }

export function* take(iterable, n) {
  if (n <= 0) return;                                  // не запрашиваем ни одного элемента источника
  for (const x of iterable) {
    yield x;
    if (--n <= 0) return;                              // return закрывает источник (его finally выполнится)
  }
}

export function* takeWhile(iterable, pred) {
  for (const x of iterable) {
    if (!pred(x)) return;
    yield x;
  }
}

export function* zip(...iterables) {
  const iterators = iterables.map((it) => it[Symbol.iterator]());
  try {
    while (true) {
      const results = iterators.map((it) => it.next());
      if (results.some((r) => r.done)) return;
      yield results.map((r) => r.value);
    }
  } finally {
    for (const it of iterators) it.return?.();         // освобождаем все источники
  }
}

export function* chunk(iterable, size) {
  if (!Number.isInteger(size) || size < 1) throw new RangeError("size должен быть целым ≥ 1");
  let buffer = [];
  for (const x of iterable) {
    buffer.push(x);
    if (buffer.length === size) { yield buffer; buffer = []; }
  }
  if (buffer.length) yield buffer;
}

export function* flatten(iterable, depth = 1) {
  for (const x of iterable) {
    if (depth > 0 && x !== null && typeof x === "object" && typeof x[Symbol.iterator] === "function" && typeof x !== "string") yield* flatten(x, depth - 1);
    else yield x;
  }
}

export function* cycle(iterable) {
  const saved = [];
  for (const x of iterable) { saved.push(x); yield x; }
  if (saved.length === 0) return;
  while (true) yield* saved;
}

export const toArray = (iterable) => [...iterable];`, { filename: "seq.mjs", lineNumbers: true }),
      code("js", `import { range, map, filter, take, takeWhile, zip, chunk, flatten, cycle, toArray } from "./seq.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);
const throws = (fn) => { try { fn(); return "без ошибки"; } catch (e) { return e.name; } };

check("range", [toArray(range(0, 4)), toArray(range(5, 0, -2)), toArray(range(0, 1, 0.5))], [[0, 1, 2, 3], [5, 3, 1], [0, 0.5]]);
check("range: нулевой шаг при первом запросе", throws(() => range(0, 5, 0).next()), "RangeError");
check("бесконечный range с take", toArray(take(range(1), 3)), [1, 2, 3]);
check("map/filter получают индекс", [toArray(map("abc", (c, i) => c + i)), toArray(filter([5, 6, 7, 8], (x, i) => i % 2 === 0))], [["a0", "b1", "c2"], [5, 7]]);
check("takeWhile", toArray(takeWhile(range(1), (n) => n < 4)), [1, 2, 3]);
check("zip: по самому короткому", toArray(zip([1, 2, 3], "ab", range(10))), [[1, "a", 10], [2, "b", 11]]);
check("chunk: остаток и валидация", [toArray(chunk(range(0, 5), 2)), throws(() => chunk([], 0).next())], [[[0, 1], [2, 3], [4]], "RangeError"]);
check("flatten: глубина и строки", [toArray(flatten([1, [2, [3, [4]]]], 1)), toArray(flatten([1, [2, [3, [4]]]], Infinity)), toArray(flatten(["ab", ["cd"]], 1))], [[1, 2, [3, [4]]], [1, 2, 3, 4], ["ab", "cd"]]);
check("cycle", toArray(take(cycle([1, 2, 3]), 7)), [1, 2, 3, 1, 2, 3, 1]);
check("cycle пустого", toArray(cycle([])), []);

// ленивость: источник читается ровно столько, сколько нужно
let pulled = 0;
function* source() { try { for (let i = 0; ; i++) { pulled++; yield i; } } finally { source.closed = true; } }
const first3 = toArray(take(map(source(), (x) => x * 10), 3));
check("источник прочитан лишь для нужных элементов", [first3, pulled], [[0, 10, 20], 3]);
check("источник закрыт после take (finally выполнен)", source.closed, true);

pulled = 0;
const [a, b] = filter(source(), (x) => x % 2 === 1);
check("деструктуризация тоже останавливает конвейер", [a, b, pulled], [1, 3, 4]);

check("take(…, 0) не читает источник", (() => { pulled = 0; toArray(take(source(), 0)); return pulled; })(), 0);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "seq-test.mjs", collapsed: true }),
      code("text", `Все 14 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Решение", "Что даёт", "Почему так"],
        [
          ["`take` с `if (n <= 0) return` до цикла", "`take(source, 0)` не читает источник", "Иначе `for…of` запросил бы первый элемент впустую (проверено: `pulled` — `0`)"],
          ["`if (--n <= 0) return` **после** `yield`", "Останавливается сразу после последнего нужного элемента", "Не запрашивает лишний элемент источника: в тесте для `take(…, 3)` источник прочитан ровно 3 раза"],
          ["`return` внутри `for…of` по источнику", "Закрывает источник (`return()` → его `finally`)", "Проверено: `source.closed` — `true` после `take`"],
          ["`zip` с `try/finally` и `it.return?.()`", "Закрывает все итераторы при завершении любого", "Когда один источник закончился, остальные освобождаются, а не остаются «висеть»"],
          ["`chunk` с проверкой `size` и накопителем", "Группы по `size`, остаток отдаётся в конце", "Валидация срабатывает при первом `next()` (тело генератора ленивое)"],
          ["`cycle`: запоминает элементы и `yield* saved`", "Бесконечное повторение конечной последовательности", "Источник читается один раз; пустой источник не вызывает бесконечного цикла"],
          ["`range(start, end = Infinity)`", "Бесконечная последовательность по умолчанию", "Потребитель решает, сколько взять (`take`, `takeWhile`)"],
        ],
        "Разбор seq.mjs",
      ),
      ul(
        "Все 14 проверок проходят: диапазоны, ленивость, индекс в `map`/`filter`, `takeWhile`, `zip` по короткому, `chunk`, `flatten` (глубина и строки), `cycle`, закрытие источников, деструктуризация (`[a, b] = filter(…)` прочитала 4 элемента и закрыла источник).",
        "**Ленивость генератора проявляется поздно:** ошибка в `range(0, 5, 0)` бросается не при вызове, а при первом `next()` — тест это учитывает.",
        "**Тонкость `flatten`:** строки итерируемы, но их нельзя «разворачивать» в символы — в условии есть явное исключение.",
      ),
    ]),

    section("internals", [
      h("Что такое объект-генератор"),
      p("Вызов `function*` создаёт **объект-генератор** с внутренним состоянием: `suspendedStart` (тело не выполнялось), `suspendedYield` (приостановлен на `yield`), `executing` (выполняется), `completed`. Метод `next(value)` переводит в `executing` до следующего `yield` или конца; повторный вызов в состоянии `executing` — `TypeError: Generator is already running` (замер). Локальные переменные и «точка продолжения» сохраняются в самом объекте, поэтому состояние живёт между вызовами."),
      h("Как `for…of` использует протокол"),
      steps(
        [
          ["Получить итератор", "Вызвать `iterable[Symbol.iterator]()`."],
          ["Шаг", "Вызвать `iterator.next()`; если `done` истинно — выход из цикла (значение `return` отбрасывается)."],
          ["Тело", "Выполнить тело цикла со значением `value`."],
          ["Досрочный выход", "При `break`, `return`, `throw` из тела вызвать `iterator.return()` (если он есть), затем продолжить выход."],
        ],
        "Алгоритм for…of",
      ),
      p("Деструктуризация массива работает так же: запрашивает столько значений, сколько нужно шаблону, и затем вызывает `return()` (замер: `[a, b] = tracked`). Spread и `Array.from` читают до `done: true`."),
      h("Генераторы и стек"),
      p("Приостановленный генератор не занимает стек вызовов: его состояние хранится в куче. Но **рекурсия через `yield*` глубже, чем обычная, расходует стек быстрее**: каждое возобновление проходит через всю цепочку делегирования. Замер в Node.js 22.22.0 (рекурсия на глубину `n`):"),
      code("js", `function* deep(n) { if (n > 0) yield* deep(n - 1); else yield "дно"; }
function plain(n) { return n > 0 ? plain(n - 1) : "дно"; }
for (const n of [1000, 5000, 10000, 20000]) {
  let g, p;
  try { g = [...deep(n)][0]; } catch (e) { g = e.name; }
  try { p = plain(n); } catch (e) { p = e.name; }
  console.log(n, "yield*:", g, "| обычная рекурсия:", p);
}`, { filename: "g7-depth.mjs", collapsed: true }),
      code("text", `1000 yield*: дно | обычная рекурсия: дно
5000 yield*: RangeError | обычная рекурсия: дно
10000 yield*: RangeError | обычная рекурсия: дно
20000 yield*: RangeError | обычная рекурсия: RangeError`, { filename: "вывод Node.js 22.22.0" }),
      p("Для небольших деревьев `yield*` удобен, а для очень глубоких структур используйте явный стек (массив) и цикл."),
      h("`async/await` и генераторы"),
      p("Исторически `async/await` появился как синтаксис над генераторами и обещаниями: `await` — это `yield` обещания, а «драйвер» возобновляет функцию, когда обещание выполнится. В современных движках `async`-функции реализованы напрямую, но модель та же: функция приостанавливается и возобновляется. Подробнее — в теме об `async/await`."),
      h("Iterator helpers и протокол"),
      p("Методы `Iterator.prototype.map/filter/take…` возвращают **новые итераторы-помощники**: они ленивы, наследуют от `Iterator.prototype`, а при завершении закрывают источник через `return()`. Поэтому `take(5)` останавливает бесконечный источник, а `toArray` материализует результат. Для объектов, не наследующих от `Iterator.prototype`, служит `Iterator.from(obj)`."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Обходить один и тот же итератор дважды"),
      wrongRight(
        "js",
        {
          code: `
            const it = letters();            // генератор — одноразовый
            console.log([...it], [...it]);   // ['a', 'b'] []
          `,
          note: "Итератор исчерпан после первого обхода (замер: второй результат пуст).",
        },
        {
          code: `
            const fresh = () => letters();
            console.log([...fresh()], [...fresh()]);   // ['a', 'b'] ['a', 'b']
          `,
          note: "Нужен новый итератор: фабрика или итерируемый объект с `[Symbol.iterator]`.",
        },
      ),
      h("Ошибка 2. Передать функцию-генератор вместо результата вызова"),
      p("`for (const x of letters)` — `TypeError: letters is not iterable` (замер): нужно `letters()`."),
      h("Ошибка 3. Сделать «итератор» без `[Symbol.iterator]` и использовать его в `for…of`"),
      p("`{ next() {…} }` — итератор, но не итерируемый: `for…of` — `TypeError: bare is not iterable`. Добавьте `[Symbol.iterator]() { return this; }` или возвращайте его из итерируемого объекта."),
      h("Ошибка 4. Забыть, что генератор не стартует до первого `next()`"),
      p("Ошибки валидации аргументов внутри генератора проявятся не при вызове, а при первом обращении. Для немедленной проверки сделайте внешнюю обычную функцию и внутри верните генератор."),
      h("Ошибка 5. Не закрыть итератор, вынутый вручную"),
      p("Если вы вручную вызвали `next()` и бросили итератор, `finally` генератора не выполнится: вызовите `return()` (замер: ресурс освободился только после `manual.return()`)."),
      h("Ошибка 6. Ожидать значение `return` в `for…of`"),
      p("Значение `return` (`done: true`) цикл и spread игнорируют (`[...two()]` → `['a', 'b']`). Используйте `yield*` в роли получателя или читайте `next()` вручную."),
      h("Ошибка 7. Использовать `yield` вне генератора"),
      p("Вне `function*` `yield` — не оператор: `SyntaxError: Unexpected number` для `yield 1` в обычной функции (замер, нестрогий режим)."),
      h("Ошибка 8. Бесконечный источник без ограничителя"),
      p("`[...naturals()]` бесконечен: программа зависнет или исчерпает память. Всегда ограничивайте (`take`, `takeWhile`, `break`)."),
    ]),

    section("antipatterns", [
      ul(
        "**Генераторы там, где достаточно массива и `map`/`filter`:** для небольших конечных данных ленивость не нужна и усложняет код.",
        "**Хранение одноразового итератора в поле объекта** и повторное использование «как массив».",
        "**Побочные эффекты в генераторах без понимания ленивости** (код не выполнится, пока никто не запросит значения).",
        "**Бесконечные генераторы без ограничителей** и без документации.",
        "**Глубокая рекурсия через `yield*`** на очень глубоких структурах (используйте явный стек).",
        "**Ручной итератор с ошибками состояния** вместо метода-генератора `*[Symbol.iterator]()`.",
        "**Игнорирование `return()`/`finally`** при работе с ресурсами в итераторах.",
        "**`for await` для независимых запросов,** которые стоило выполнить параллельно.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Делайте структуры данных итерируемыми:** метод `*[Symbol.iterator]()` — самый короткий способ.",
        "**Различайте итерируемый объект и итератор:** возвращайте новый итератор при каждом `[Symbol.iterator]()`.",
        "**Освобождайте ресурсы в `finally`** внутри генератора — оно сработает при `break`, `return()` и ошибках.",
        "**Ограничивайте бесконечные последовательности** (`take`, `takeWhile`) и соберите результат в массив, если он нужен повторно.",
        "**Используйте iterator helpers там, где они доступны,** и собственные ленивые функции — как запасной вариант.",
        "**Для потоков данных и постраничной загрузки — `async function*` и `for await…of`.**",
        "**Проверяйте поведение при досрочном выходе:** тест с `break` и счётчиком освобождений.",
        "**Документируйте ленивость:** вызывающий должен знать, когда выполняется код источника.",
      ),
      tip("Отладка генератора: вызывайте `next()` вручную и печатайте результаты — вы увидите, где он приостанавливается и что отдаёт; для массивов результатов используйте `[...gen]` или `.toArray()`."),
    ]),

    section("edge-cases", [
      h("Первый `next()` и переданное значение"),
      p("Аргумент первого вызова `next(x)` теряется: нет приостановленного `yield`, который бы его принял (замер: `«игнорируется»`)."),
      h("`yield` как выражение и приоритеты"),
      p("`yield` имеет низкий приоритет: `const x = yield 1 + 1` отдаёт `2`. Результат `yield` в выражениях заключайте в скобки: `1 + (yield)`."),
      h("Генераторы-методы и `this`"),
      p("Метод-генератор в классе или объекте (`*items() {…}`) получает `this` так же, как обычный метод; стрелочных генераторов не существует."),
      h("`return()` и `finally` с `yield`"),
      p("Если в `finally` генератора есть `yield`, `return()` не завершит его немедленно: он отдаст значение из `finally`. Не пишите `yield` внутри `finally`."),
      h("Бесконечные итераторы и `Array.from`"),
      p("`Array.from(naturals())` не завершится. Для ограничения используйте `Array.from(take(naturals(), n))`."),
      h("Параллелизм и `for await`"),
      p("`for await` последовательный: следующий `next()` вызывается после обработки предыдущего. Для параллельных запросов используйте `Promise.all`/пулы; `for await` подходит для потоков, где важен порядок."),
    ]),

    section("related", [
      ul(
        "[Массивы](/learn/js/arrays) — `entries`, `Array.from`, spread.",
        "[Деструктуризация и spread](/learn/js/destructuring-spread) — деструктуризация массивов через итератор.",
        "[Map, Set, WeakMap и WeakSet](/learn/js/map-set-weak) — встроенные итерируемые коллекции.",
        "[Классы](/learn/js/classes) — метод `*[Symbol.iterator]()`, приватное состояние.",
        "[Функции высшего порядка и рекурсия](/learn/js/higher-order-recursion) — энергичные конвейеры и `reduce`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Массив целиком вместо ленивого потока",
          code: `
            function firstEvenSquares(n) {
              const all = Array.from({ length: 1_000_000 }, (_, i) => i);   // миллион элементов в памяти
              return all.map((x) => x * x).filter((x) => x % 2 === 0).slice(0, n);
            }
          `,
          note: "Весь миллион элементов обрабатывается дважды, хотя нужны первые `n` результатов (в замере 2 000 000 вызовов).",
        },
        {
          title: "Ленивые итераторы",
          code: `
            function firstEvenSquares(n) {
              return naturals().map((x) => x * x).filter((x) => x % 2 === 0).take(n).toArray();
            }
          `,
          note: "Вычисляется ровно столько, сколько нужно; источник может быть бесконечным (или собственные генераторы, если helpers недоступны).",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.iterators-generators.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код, скажите, что и в каком порядке напечатает программа. Особенно обратите внимание на момент выполнения тела генератора, роль аргумента `next`, `return(99)` и `finally`, а также на то, что попадёт в `[...g()]` и деструктуризацию."),
        code("js", `function* g() {
  console.log("A");
  const x = yield 1;
  console.log("B", x);
  try {
    yield 2;
  } finally {
    console.log("C");
  }
  return 3;
}

const it = g();
console.log("создан");
console.log(it.next("первый"));
console.log(it.next("второй"));
console.log(it.return(99));
console.log(it.next());

console.log([...g()]);
const [first] = g();
console.log(first);`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Когда выполняется первая строка тела генератора?", "Что делает `return()` в приостановленном `try`?"],
      checks: ["Порядок `создан` → `A`", "Объяснён `B второй`", "Объяснены `C` и `{ value: 99, done: true }`", "Объяснены `[1, 2]` и `1`"],
      solution: [
        code("text", `создан
A
{ value: 1, done: false }
B второй
{ value: 2, done: false }
C
{ value: 99, done: true }
{ value: undefined, done: true }
A
B undefined
C
[ 1, 2 ]
A
1`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "Тело не выполняется при вызове `g()`: сначала `создан`, затем первый `next(\"первый\")` печатает `A` и отдаёт `1` (аргумент первого `next` теряется).",
          "Второй `next(\"второй\")` возобновляет после `yield 1`: `B второй`, затем отдаёт `2`, приостановившись внутри `try`.",
          "`it.return(99)` завершает генератор, но выполняет `finally` (`C`) и возвращает `{ value: 99, done: true }`; после этого `next()` — `{ value: undefined, done: true }`.",
          "`[...g()]` собирает `[1, 2]` (значение `return` 3 не включается; по пути печатаются `A`, `B undefined`, `C`).",
          "`const [first] = g()` берёт первое значение и вызывает `return()`: напечатан только `A`, `first` — `1`; `finally` не выполняется, потому что генератор остановлен до входа в `try`.",
        ),
      ],
    }),
    exercise({
      id: "js.iterators-generators.ex2",
      title: "Пять ошибок итерации",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("В коде собраны пять типичных ошибок: повторный обход итератора, передача функции-генератора, итератор без `[Symbol.iterator]`, неосвобождённый ресурс и `yield` вне генератора. Объясните каждое сообщение и исправьте."),
      ],
      hints: ["Что нужно получить из функции-генератора перед обходом?", "Кто вызывает `return()` при ручном `next()`?"],
      checks: ["Пять причин названы", "Исправления для каждой", "Освобождение ресурса проверено выводом"],
      solution: [
        code("js", `function* letters() { yield "a"; yield "b"; }

// Ошибка 1: итератор одноразовый
const it = letters();
console.log([...it], [...it]);                 // второй раз пусто
const fresh = () => letters();                 // нужна фабрика (или итерируемый объект)
console.log([...fresh()], [...fresh()]);

// Ошибка 2: передали функцию-генератор, а не итератор
try { for (const x of letters) console.log(x); } catch (e) { console.log(e.name + ": " + e.message); }

// Ошибка 3: итератор без Symbol.iterator нельзя использовать в for…of
const bare = { i: 0, next() { return this.i < 2 ? { value: this.i++, done: false } : { done: true }; } };
try { for (const x of bare) console.log(x); } catch (e) { console.log(e.name + ": " + e.message); }
const iterable = { [Symbol.iterator]() { return bare; } };
bare.i = 0;
console.log([...iterable]);

// Ошибка 4: return внутри цикла for…of по генератору с ресурсами не закрывает «ручной» итератор
function* resource() { try { yield 1; yield 2; } finally { console.log("  ресурс освобождён"); } }
const manual = resource();
manual.next();
console.log("вручную достали один элемент и забыли про итератор");     // finally не выполнится, пока не вызван return()
manual.return();
for (const v of resource()) { if (v === 1) break; }

// Ошибка 5: yield вне генератора
try { new Function("function f() { yield 1; }; f();")(); } catch (e) { console.log(e.name + ": " + e.message); }`, { filename: "x2-bugs.mjs" }),
        code("text", `[ 'a', 'b' ] []
[ 'a', 'b' ] [ 'a', 'b' ]
TypeError: letters is not iterable
TypeError: bare is not iterable
[ 0, 1 ]
вручную достали один элемент и забыли про итератор
  ресурс освобождён
  ресурс освобождён
SyntaxError: Unexpected number`, { filename: "вывод Node.js 22.22.0" }),
        p("1) Итератор исчерпывается: нужна фабрика. 2) Нужно вызвать функцию: `letters()`. 3) `for…of` требует итерируемый объект: добавьте `[Symbol.iterator]` или оберните. 4) При ручном обходе освобождайте ресурс через `return()`. 5) `yield` допустим только внутри `function*`."),
      ],
    }),
    exercise({
      id: "js.iterators-generators.ex3",
      title: "Итерируемый связный список",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Реализуйте класс `LinkedList` (приватные поля) с методами: `push`, статический `from(iterable)`, `size`, обход `*[Symbol.iterator]()` и `reversed()`, ленивые `map` и `filter`, `find`, `toArray`. Список должен быть итерируемым любое число раз, поддерживать spread, деструктуризацию, `Array.from`, а `find` — останавливаться на первом найденном элементе."),
      ],
      hints: ["Как сделать повторный обход возможным?", "Что нужно хранить в узле для обратного обхода?"],
      checks: ["Работают `for…of`, spread, `Array.from`, деструктуризация", "`reversed` идёт с хвоста", "`find` останавливается", "Состояние скрыто"],
      solution: [
        code("js", `export class LinkedList {
  #head = null;
  #tail = null;
  #size = 0;

  static from(iterable) {
    const list = new LinkedList();
    for (const x of iterable) list.push(x);
    return list;
  }

  get size() { return this.#size; }

  push(value) {
    const node = { value, next: null, prev: this.#tail };
    if (this.#tail) this.#tail.next = node; else this.#head = node;
    this.#tail = node;
    this.#size++;
    return this;
  }

  *[Symbol.iterator]() {                                // метод-генератор делает объект итерируемым
    for (let node = this.#head; node; node = node.next) yield node.value;
  }

  *reversed() {
    for (let node = this.#tail; node; node = node.prev) yield node.value;
  }

  *map(fn) { let i = 0; for (const x of this) yield fn(x, i++); }
  *filter(pred) { for (const x of this) if (pred(x)) yield x; }

  find(pred) { for (const x of this) if (pred(x)) return x; return undefined; }
  toArray() { return [...this]; }
}`, { filename: "linked-list.mjs" }),
        code("js", `import { LinkedList } from "./linked-list.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);

const list = LinkedList.from([1, 2, 3]).push(4);
check("размер и порядок", [list.size, [...list]], [4, [1, 2, 3, 4]]);
check("обратный обход", [...list.reversed()], [4, 3, 2, 1]);
check("for…of, spread, Array.from, деструктуризация", (() => { const [a, b] = list; const loop = []; for (const x of list) loop.push(x); return [loop, Array.from(list), a, b, Math.max(...list)]; })(), [[1, 2, 3, 4], [1, 2, 3, 4], 1, 2, 4]);
check("повторный обход возможен (итерируемый ≠ итератор)", [[...list].length, [...list].length], [4, 4]);
check("map и filter ленивые и возвращают итераторы", [typeof list.map(String).next, [...list.map((x, i) => x * 10 + i)], [...list.filter((x) => x % 2)]], ["function", [10, 21, 32, 43], [1, 3]]);
check("find и toArray", [list.find((x) => x > 2), list.find((x) => x > 10), list.toArray()], [3, null, [1, 2, 3, 4]]);
check("пустой список", [[...new LinkedList()], [...new LinkedList().reversed()], new LinkedList().size], [[], [], 0]);

let visited = 0;
const big = LinkedList.from({ *[Symbol.iterator]() { for (let i = 0; i < 1000; i++) yield i; } });
big.find((x) => { visited++; return x === 2; });
check("find останавливается на первом найденном", visited, 3);
check("состояние скрыто", [Object.keys(list), JSON.stringify(list)], [[], "{}"]);

const added = [];
const l2 = LinkedList.from([1]);
for (const x of l2) { added.push(x); if (x < 3) l2.push(x + 1); }
check("элементы, добавленные во время обхода, посещаются", added, [1, 2, 3]);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "linked-list-test.mjs", collapsed: true }),
        code("text", `Все 10 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
        p("Метод-генератор `*[Symbol.iterator]()` создаёт новый итератор при каждом обходе — список итерируем многократно. Узлы двусвязные (`prev`) для `reversed()`. `find` проходит `for…of` и возвращает значение — оставшиеся узлы не посещаются (в тесте для `find(x => x === 2)` источник прочитан 3 раза). Элементы, добавленные во время обхода, подхватываются, потому что обход идёт по узлам."),
      ],
    }),
  ],

  challenge: {
    id: "js.iterators-generators.challenge",
    title: "Ленивая библиотека последовательностей",
    scenario: [
      p("В проекте нужна небольшая библиотека для работы с последовательностями произвольной длины (в том числе бесконечными) без создания промежуточных массивов. Реализуйте модуль `seq.mjs` с генераторами `range`, `map`, `filter`, `take`, `takeWhile`, `zip`, `chunk`, `flatten`, `cycle` и функцией `toArray`."),
    ],
    requirements: [
      "`range(start, end = Infinity, step = 1)` — возрастающая и убывающая последовательность; нулевой шаг — `RangeError` при первом `next()`",
      "`map` и `filter` передают колбэку `(значение, индекс)`; `take(iterable, n)` не запрашивает лишних элементов, `take(…, 0)` не читает источник",
      "`takeWhile`, `zip` (по самому короткому; закрывает все итераторы), `chunk(iterable, size)` (валидация размера, остаток в конце)",
      "`flatten(iterable, depth)` разворачивает вложенные итерируемые (но не строки), `cycle` повторяет конечную последовательность бесконечно (пустую — не зацикливает)",
      "При досрочном выходе потребителя источник закрывается (выполняется его `finally`)",
    ],
    constraints: [
      "Только генераторы и итераторы; без промежуточных массивов (кроме буфера `chunk` и запоминания в `cycle`)",
      "Без внешних библиотек",
    ],
    acceptance: [
      "Все 14 проверок из теста проходят",
      "`take(map(source(), f), 3)` читает источник ровно 3 раза и закрывает его",
      "`[a, b] = filter(source(), odd)` читает 4 элемента и закрывает источник",
    ],
    hints: [
      "Где в `take` проверять остаток, чтобы не запросить лишний элемент?",
      "Что произойдёт с источником, если выйти из `for…of` через `return`?",
      "Как закрыть несколько итераторов в `zip`?",
    ],
    solution: [
      code("js", `// Ленивые операции над итерируемыми объектами на генераторах.

export function* range(start, end = Infinity, step = 1) {
  if (step === 0) throw new RangeError("Шаг не может быть нулём");
  if (step > 0) for (let n = start; n < end; n += step) yield n;
  else for (let n = start; n > end; n += step) yield n;
}

export function* map(iterable, fn) { let i = 0; for (const x of iterable) yield fn(x, i++); }
export function* filter(iterable, pred) { let i = 0; for (const x of iterable) if (pred(x, i++)) yield x; }

export function* take(iterable, n) {
  if (n <= 0) return;                                  // не запрашиваем ни одного элемента источника
  for (const x of iterable) {
    yield x;
    if (--n <= 0) return;                              // return закрывает источник (его finally выполнится)
  }
}

export function* takeWhile(iterable, pred) {
  for (const x of iterable) {
    if (!pred(x)) return;
    yield x;
  }
}

export function* zip(...iterables) {
  const iterators = iterables.map((it) => it[Symbol.iterator]());
  try {
    while (true) {
      const results = iterators.map((it) => it.next());
      if (results.some((r) => r.done)) return;
      yield results.map((r) => r.value);
    }
  } finally {
    for (const it of iterators) it.return?.();         // освобождаем все источники
  }
}

export function* chunk(iterable, size) {
  if (!Number.isInteger(size) || size < 1) throw new RangeError("size должен быть целым ≥ 1");
  let buffer = [];
  for (const x of iterable) {
    buffer.push(x);
    if (buffer.length === size) { yield buffer; buffer = []; }
  }
  if (buffer.length) yield buffer;
}

export function* flatten(iterable, depth = 1) {
  for (const x of iterable) {
    if (depth > 0 && x !== null && typeof x === "object" && typeof x[Symbol.iterator] === "function" && typeof x !== "string") yield* flatten(x, depth - 1);
    else yield x;
  }
}

export function* cycle(iterable) {
  const saved = [];
  for (const x of iterable) { saved.push(x); yield x; }
  if (saved.length === 0) return;
  while (true) yield* saved;
}

export const toArray = (iterable) => [...iterable];`, { filename: "seq.mjs", lineNumbers: true }),
      code("text", `Все 14 проверок пройдены`, { filename: "результат запуска тестов" }),
      p("`return` внутри цикла `for…of` вызывает `return()` источника — его `finally` выполняется; `take` уменьшает счётчик **после** `yield` и выходит сразу, не запрашивая следующий элемент. `zip` оборачивает цикл в `try/finally` и закрывает все итераторы."),
    ],
  },

  interview: [
    iq("js.iterators-generators.i1", "basic", "Что такое итерируемый объект и итератор?", [
      ul(
        "Итерируемый объект имеет метод `[Symbol.iterator]()`, возвращающий итератор.",
        "Итератор — объект с методом `next()`, возвращающим `{ value, done }`.",
        "На протоколе работают `for…of`, spread, деструктуризация, `Array.from`, `new Map/Set`.",
      ),
    ]),
    iq("js.iterators-generators.i2", "basic", "Что такое генератор и зачем нужен `yield`?", [
      ul(
        "Функция `function*`, которую можно приостанавливать и возобновлять; вызов возвращает объект-генератор (итератор).",
        "`yield` отдаёт значение и приостанавливает выполнение до следующего `next()`; локальное состояние сохраняется.",
        "Применение: ленивые последовательности, обходы структур, идентификаторы, потоки данных.",
      ),
    ]),
    iq("js.iterators-generators.i3", "intermediate", "Почему итератор нельзя обойти дважды, а итерируемый объект — можно?", [
      ul(
        "Итератор хранит состояние позиции и после конца остаётся в состоянии `done`.",
        "Итерируемый объект при каждом обходе создаёт **новый** итератор (`[Symbol.iterator]()`).",
        "Генератор — одновременно итератор и итерируемый объект, возвращающий сам себя: поэтому одноразовый.",
      ),
    ]),
    iq("js.iterators-generators.i4", "intermediate", "Что делает `return()` у итератора и когда он вызывается?", [
      ul(
        "Освобождает ресурсы при досрочном завершении: `break`, `return`/`throw` из тела `for…of`, деструктуризация, которая взяла не все значения.",
        "У генератора выполняет `finally` и завершает его (`{ value, done: true }`).",
        "Не вызывается при естественном завершении (`done: true`).",
      ),
    ]),
    iq("js.iterators-generators.i5", "intermediate", "Как работает `yield*`?", [
      ul(
        "Делегирует выполнение другому итерируемому объекту: его значения проходят наружу.",
        "Значением выражения `yield*` становится значение `return` вложенного генератора.",
        "Используется для рекурсивных обходов и композиции генераторов.",
      ),
    ]),
    iq("js.iterators-generators.i6", "advanced", "В чём преимущество ленивого конвейера над цепочкой методов массива?", [
      ul(
        "Обрабатывает элементы по одному и останавливается, когда результат получен (в замере 26 вызовов против 2 000 000).",
        "Работает с бесконечными источниками и не создаёт промежуточных массивов.",
        "Недостатки: одноразовость, нет индексов и `length`; для небольших данных выигрыша нет.",
      ),
    ]),
    iq("js.iterators-generators.i7", "engineering", "Как сделать собственную структуру данных итерируемой и безопасно освобождать ресурсы?", [
      ul(
        "Метод `*[Symbol.iterator]() { … }` внутри класса: каждый вызов — новый обход.",
        "Ресурсы (файлы, соединения) — `try/finally` внутри генератора: `finally` сработает при `break` и ошибках.",
        "Для асинхронных источников — `async *[Symbol.asyncIterator]()` и `for await…of`.",
        "Тесты: полный обход, повторный обход, досрочный выход со счётчиком освобождений.",
      ),
    ]),
    iq("js.iterators-generators.i8", "debugging", "`[...gen]` второй раз возвращает пустой массив. Что происходит?", [
      ul(
        "Генератор — одноразовый итератор: после первого обхода он завершён.",
        "Для повторного использования создавайте новый генератор (вызов функции) или сохраните результат в массив.",
        "Если нужна многократная итерация структуры — сделайте её итерируемым объектом (`[Symbol.iterator]` возвращает новый итератор).",
      ),
    ]),
  ],

  exam: [
    mcq("js.iterators-generators.e1", "foundation", "Что возвращает вызов `function*`-функции?", ["Результат выполнения тела", "Массив значений", "Объект-генератор; тело ещё не выполнялось", "Обещание"], 2, "Тело стартует при первом `next()`; вызов возвращает объект-генератор (замер)."),
    mcq("js.iterators-generators.e2", "foundation", "Что вернёт `[...gen]` второй раз для того же генератора?", ["Пустой массив", "Те же значения", "`undefined`", "Ошибку"], 0, "Генератор исчерпан после первого обхода (замер: `[1, 2, 3] []`)."),
    mcq("js.iterators-generators.e3", "intermediate", "Попадёт ли значение `return` генератора в результат `[...gen]`?", ["Да, последним элементом", "Только в `Array.from`", "Только если это число", "Нет, spread и `for…of` его игнорируют"], 3, "Значение `return` — в `{ value, done: true }`, а потребители останавливаются на `done: true` (замер: `['a', 'b']`)."),
    mcq("js.iterators-generators.e4", "intermediate", "Что вызывается у итератора при `break` в `for…of`?", ["`next()` ещё раз", "`return()` — если он есть", "`throw()`", "Ничего"], 1, "Досрочный выход вызывает `return()`; в генераторе это приводит к выполнению `finally`."),
    mcq("js.iterators-generators.e5", "intermediate", "Какие объекты итерируемы «из коробки»? Выберите все.", ["Массив", "Строка", "Обычный объект `{ a: 1 }`", "`Set`"], [0, 1, 3], "Обычный объект не имеет `Symbol.iterator` (замер: `is not iterable`)."),
    mcq("js.iterators-generators.e6", "advanced", "Что произойдёт при вызове `gen.next()` внутри самого этого генератора?", ["Вернётся следующее значение", "Бесконечный цикл", "Генератор перезапустится", "`TypeError: Generator is already running`"], 3, "Повторный вход в выполняющийся генератор запрещён (замер)."),
    open("js.iterators-generators.e7", "intermediate", "Объясните, как `for…of` работает с итерируемым объектом, и что произойдёт при `break`.", [
      ul(
        "Вызывает `iterable[Symbol.iterator]()`, получает итератор и повторно вызывает `next()`; пока `done` ложно, выполняет тело со значением `value`.",
        "Когда `done: true`, цикл завершается; значение `return` итератора не используется.",
        "При `break`/`return`/`throw` из тела цикл вызывает `iterator.return()` (если определён): так освобождаются ресурсы.",
        "Для генераторов `return()` завершает функцию и выполняет `finally`.",
      ),
    ], ["Описаны `Symbol.iterator` и `next()`", "Описан `done`", "Описан `return()` при выходе"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.iterators-generators.m1", "intermediate", "Чему равно значение `yield*` выражения `const r = yield* inner()`?", ["Последнему отданному значению", "`undefined` всегда", "Значению `return` вложенного генератора", "Массиву всех значений"], 2, "`yield*` возвращает значение `return` делегата (замер: `inner-return`)."),
    mcq("js.iterators-generators.m2", "advanced", "Почему в `take` счётчик проверяют после `yield`, а не перед запросом следующего элемента?", ["Так быстрее", "Чтобы не запросить у источника лишний элемент после последнего нужного", "Это требование стандарта", "Чтобы `take(…, 0)` читал источник"], 1, "Иначе `for…of` запросил бы следующий элемент до проверки; тест подтверждает: источник прочитан ровно `n` раз."),
    mcq("js.iterators-generators.m3", "advanced", "Что произойдёт с `finally` асинхронного генератора при `break` в `for await…of`?", ["Выполнится (вызывается `return()`)", "Не выполнится", "Выполнится только при ошибке", "Зависит от версии"], 0, "`break` закрывает источник: в замере напечатано «источник закрыт» (на странице 2 из 10)."),
    open("js.iterators-generators.m4", "advanced", "Нужно обработать файл на 5 ГБ построчно с фильтрацией и агрегацией, не загружая его в память. Опишите решение на итераторах и как гарантировать закрытие файла.", [
      ul(
        "Читать файл потоком кусков (`for await (const chunk of stream)`), собирать строки в асинхронном генераторе `lines(stream)`, учитывая «обрезанную» последнюю строку чанка.",
        "Конвейер из асинхронных генераторов: `lines → filter → parse → batch`; агрегацию делать накопителем в `for await`.",
        "Закрытие: `try/finally` в генераторе-источнике (`stream.destroy()`); `break`/ошибка в потребителе вызовут `return()` и закроют файл.",
        "Обратное давление: обработка по одному элементу (`for await`) не читает быстрее, чем потребляет цикл.",
        "Тесты: пустой файл, файл без завершающего перевода строки, ошибка в середине, досрочный выход (счётчик закрытий).",
      ),
    ], ["Описан асинхронный генератор строк", "Описано закрытие через `finally`", "Описано обратное давление", "Описаны тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.iterators-generators.f1", front: "Протокол итерации?", back: "iterable: [Symbol.iterator]() → iterator: next() → { value, done }. На нём for…of, spread, деструктуризация." },
    { id: "js.iterators-generators.f2", front: "Генератор?", back: "function* возвращает объект-генератор (итератор и iterable). Тело стартует при первом next(); yield приостанавливает." },
    { id: "js.iterators-generators.f3", front: "return генератора?", back: "Значение попадает в { done: true }; for…of и spread его не включают." },
    { id: "js.iterators-generators.f4", front: "break в for…of?", back: "Вызывает return() итератора; в генераторе выполняется finally — освобождение ресурсов." },
    { id: "js.iterators-generators.f5", front: "Итератор — одноразовый?", back: "Да: [...it] второй раз пуст. iterable создаёт новый итератор при каждом обходе." },
    { id: "js.iterators-generators.f6", front: "Ленивость?", back: "Элементы идут по одному; take останавливает источник: 26 вызовов против 2 000 000 у цепочки массива." },
    { id: "js.iterators-generators.f7", front: "for await…of?", back: "Для асинхронных итераторов ([Symbol.asyncIterator], async function*): последовательно, break закрывает источник." },
  ],

  sources: [
    { title: "ECMAScript: Iteration (протоколы итерации)", url: "https://tc39.es/ecma262/#sec-iteration", publisher: "ECMA" },
    { title: "ECMAScript: Generator Function Definitions", url: "https://tc39.es/ecma262/#sec-generator-function-definitions", publisher: "ECMA" },
    { title: "ECMAScript: Async Generator Function Definitions", url: "https://tc39.es/ecma262/#sec-async-generator-function-definitions", publisher: "ECMA" },
    { title: "MDN: Iteration protocols", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols", publisher: "MDN" },
    { title: "MDN: function*", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*", publisher: "MDN" },
    { title: "MDN: yield*", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*", publisher: "MDN" },
    { title: "MDN: Iterator", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator", publisher: "MDN" },
    { title: "MDN: for await...of", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of", publisher: "MDN" },
    { title: "MDN: Generator", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator", publisher: "MDN" },
  ],
};
