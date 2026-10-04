import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  note,
  tip,
  warn,
  insight,
  table,
  def,
  wrongRight,
  beforeAfter,
  annotated,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const destructuringSpread: Topic = {
  id: "js.destructuring-spread",
  slug: "destructuring-spread",
  domain: "js",
  module: "modern",
  title: "Деструктуризация, spread и rest",
  titleEn: "Destructuring, spread and rest",
  summary:
    "Деструктуризация раскладывает объект по именам свойств, а массив (и любой итерируемый объект) — по позициям: с переименованием, вложенностью и значениями по умолчанию (они подставляются только для `undefined`). Spread `...` разворачивает итерируемое в аргументы и массивы, а собственные перечислимые свойства — в объекты; rest `...` собирает остаток в массив или объект. Тема на замерах в Node.js 22 и Chromium 141 разбирает правила и ошибки (`Cannot destructure property 'a' of 'null'`, `x is not iterable`, присваивание без скобок), порядок вычисления значений по умолчанию, что копирует и чего не копирует spread объекта (прототип, геттеры, неперечислимые свойства), приёмы для опций функций, `omit`/`pick` и неизменяемых обновлений, и учит писать структурно разделяющий `setIn`.",
  minutes: 60,
  prerequisites: ["js.arrays", "js.objects-properties"],
  tags: ["destructuring", "spread", "rest", "default values", "object rest", "array destructuring", "options object", "immutable update", "shallow copy", "iterable", "swap", "pick", "omit"],
  keyConcepts: [
    { term: "Значение по умолчанию — только для `undefined`", text: "`const { a = 1, b = 2, c = 3 } = { a: undefined, b: null, c: 0 }` даёт `1, null, 0`. Для `null` и пустых строк используйте `??` или `||` в теле." },
    { term: "Деструктуризация `null` и `undefined` — `TypeError`", text: "`Cannot destructure property 'a' of 'null' as it is null.` Защита: `const { a } = obj ?? {}` или значение по умолчанию параметра `= {}`." },
    { term: "Spread — поверхностная копия собственных перечислимых свойств", text: "`{ ...obj }` не копирует прототип (`{ ...new Point() } instanceof Point` — `false`), неперечислимые свойства и унаследованные; геттеры вычисляются. Вложенные объекты общие (`shallow.nested === base.nested`)." },
    { term: "Порядок в `{ ...a, ...b }` важен", text: "Побеждает последний ключ: `{ ...base, b: 20 }` переопределяет `b`, а `{ b: 20, ...base }` — нет (`b` вернулся к значению из `base`)." },
    { term: "Массивы — по итератору", text: "`[a, b] = \"ab\"`, `[[k, v]] = new Map(…)`, `[one, two] = new Set(…)` работают, потому что массивная деструктуризация использует итератор; из обычного объекта `{ 0: \"x\" }` — `TypeError: … is not iterable`." },
  ],
  sections: [
    section("definition", [
      def("Деструктуризация", "Синтаксис, раскладывающий значение по частям в переменные: объект — по именам свойств (`const { a, b } = obj`), массив и другие итерируемые — по позициям (`const [x, y] = arr`).", "destructuring"),
      def("Значение по умолчанию", "Запись `= выражение` в шаблоне: подставляется, если значение равно `undefined`; выражение вычисляется лениво, только когда нужно.", "default value"),
      def("Rest-элемент", "Запись `...имя` в конце шаблона деструктуризации или в списке параметров: собирает остаток (в массив или в объект собственных перечислимых свойств).", "rest element / rest parameter"),
      def("Spread", "Запись `...выражение` в литерале массива, объекта или в вызове функции: разворачивает итерируемое (или свойства объекта) на месте.", "spread syntax"),
      def("Объект параметров (options object)", "Приём: функция принимает один объект с именованными параметрами, которые разбираются деструктуризацией со значениями по умолчанию.", "options object"),
      def("Поверхностная копия", "Копия верхнего уровня: вложенные объекты и массивы остаются общими с оригиналом.", "shallow copy"),
      def("Неизменяемое обновление", "Создание нового объекта вместо изменения старого: `{ ...state, count: state.count + 1 }`.", "immutable update"),
      def("Структурное разделение", "Приём: при обновлении копируются только изменённые ветви, а остальные сохраняют прежние ссылки, что позволяет дёшево определять изменения сравнением по ссылке.", "structural sharing"),
    ]),

    section("why", [
      h("Современный JavaScript написан этими тремя знаками"),
      p("Откройте любой современный код: параметры функций — это `{ a, b = 1 }`, возвращаемые значения разбирают `[x, y]`, настройки сливают `{ ...defaults, ...options }`, состояние обновляют `{ ...state, loading: false }`, аргументы собирают `...args`. Если вы не читаете эти конструкции мгновенно, чужой код превращается в загадки; если не знаете их границ, вы получаете «призрачные» изменения общих объектов и `TypeError` на пустых данных."),
      ul(
        "**Читаемость:** вместо `const name = user.name; const city = user.city;` — одна строка; вместо `Object.assign({}, a, b)` — `{ ...a, ...b }`.",
        "**Безопасные значения по умолчанию:** опции функций без ручных проверок `options.x === undefined ? … : …`.",
        "**Неизменяемость:** основа работы с состоянием в интерфейсах (обновление без мутаций).",
        "**Границы:** поверхностность копии, пропуск прототипа и геттеров, поведение с `null` и `undefined` — частые ошибки на практике и на собеседованиях.",
      ),
      insight("Деструктуризация и spread — **две стороны одной монеты**: деструктуризация **разбирает** структуру на части (слева от `=` или в параметрах), spread — **собирает** из частей (справа, в литералах и вызовах). Rest — деструктуризация «остатка»."),
    ]),

    section("mental-model", [
      p("Представьте **распаковку посылки и упаковку нового ящика**. Деструктуризация — это вскрытие посылки по **описи**: «возьми свойство `name` в переменную `name`, свойство `address.city` — в `city`, а всё остальное сложи в коробку `rest`». Если вы вскрываете несуществующую посылку (`null`), будет ошибка; если в посылке нет нужной позиции — пустая ячейка (`undefined`), и тогда вступает в силу запасное значение. Spread — упаковка: «положи сюда всё содержимое той коробки, а теперь вот это». **Содержимое** кладётся копиями ссылок: вещи те же, а коробка новая; вложенная коробка (объект внутри) остаётся той же, поэтому её содержимое видно с обеих сторон. Порядок упаковки важен: что положено позже, лежит сверху."),
      table(
        ["Конструкция", "Где", "Что делает"],
        [
          ["`const { a, b: c = 1 } = obj`", "Объявление/присваивание", "Берёт свойства по именам, переименовывает, подставляет значение по умолчанию"],
          ["`const [x, , z, ...r] = arr`", "Объявление/присваивание", "Берёт элементы по позициям, пропускает, собирает остаток"],
          ["`function f({ a, b } = {}) {}`", "Параметры", "Разбирает аргумент-объект, `= {}` защищает от вызова без аргументов"],
          ["`{ ...a, ...b }` / `[...a, ...b]`", "Литералы", "Объединяет объекты (последний побеждает) и массивы"],
          ["`f(...args)`", "Вызов", "Превращает итерируемое в отдельные аргументы"],
          ["`function f(...args) {}`", "Параметры", "Собирает аргументы в настоящий массив"],
        ],
        "Где встречаются `{}`, `[]`, `...`",
      ),
    ]),

    section("technical", [
      h("Деструктуризация объектов и массивов"),
      code("js", `const user = { id: 7, name: "Аня", address: { city: "Казань", zip: "420000" }, tags: ["js", "css"], age: null };

// объект: по именам свойств
const { name, id } = user;
const { name: fullName, role = "гость", age = 18 } = user;            // переименование и значение по умолчанию
const { address: { city }, tags: [firstTag, secondTag] } = user;      // вложенная деструктуризация
const { id: _id, ...rest } = user;                                    // остаток: собственные перечислимые свойства
console.log(name, id, fullName, role, age, city, firstTag, secondTag);
console.log(Object.keys(rest), "address" in rest, rest.address === user.address);

// значение по умолчанию: только для undefined
const { a = 1, b = 2, c = 3 } = { a: undefined, b: null, c: 0 };
console.log(a, b, c);

// вычисляемые ключи
const key = "name";
const { [key]: dynamic } = user;
console.log(dynamic);

// массив: по позициям
const [x, , z = "по умолчанию", ...others] = [10, 20, undefined, 40, 50];
console.log(x, z, others);
const [p, q] = "ab";                                                  // любой итерируемый объект
const [[k1, v1]] = new Map([["ключ", 1]]);
const [one, two] = new Set([1, 2, 3]);
console.log(p, q, k1, v1, one, two);

// обмен значений
let m = 1, n = 2;
[m, n] = [n, m];
console.log(m, n);

// присваивание в уже объявленные переменные: нужны скобки
let host, port;
({ host, port = 80 } = { host: "example.org" });
console.log(host, port);

// порядок вычисления значений по умолчанию
const log = [];
const f = (label) => { log.push(label); return label; };
const [d1 = f("d1"), d2 = f("d2")] = [undefined, "есть"];
const { e1 = f("e1") } = { e1: "есть" };
console.log(d1, d2, e1, log);`, { filename: "d1-destructuring.mjs", lineNumbers: true }),
      code("text", `Аня 7 Аня гость null Казань js css
[ 'name', 'address', 'tags', 'age' ] true true
1 null 0
Аня
10 по умолчанию [ 40, 50 ]
a b ключ 1 1 2
2 1
example.org 80
d1 есть есть [ 'd1' ]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Имена и переименование:** `{ name, id }` берёт свойства с теми же именами; `{ name: fullName }` — в переменную `fullName`; значение по умолчанию — `{ role = \"гость\" }`.",
        "**Значение по умолчанию** подставляется **только** для `undefined`: в `{ a = 1, b = 2, c = 3 } = { a: undefined, b: null, c: 0 }` получилось `1, null, 0`. Свойство `age: null` осталось `null` (`age = 18` не сработало).",
        "**Вложенность:** `{ address: { city } }` берёт `user.address.city`; `{ tags: [firstTag, secondTag] }` — элементы массива. Обратите внимание: имя `address` в такой записи **не** становится переменной, только `city`.",
        "**Rest объекта:** `{ id: _id, ...rest }` собирает **собственные перечислимые** свойства, кроме указанных: у `rest` ключи `['name', 'address', 'tags', 'age']`, а `rest.address === user.address` — вложенный объект общий.",
        "**Вычисляемый ключ:** `{ [key]: dynamic }` читает свойство по имени из переменной.",
        "**Массивы по позициям:** пропуск через запятую (`[x, , z]`), значение по умолчанию (`z = …` сработало для `undefined`), остаток `...others` (`[40, 50]`).",
        "**Любой итерируемый объект:** `[p, q] = \"ab\"`, `[[k1, v1]] = new Map(…)`, `[one, two] = new Set(…)` — используется итератор (`Set` дал `1` и `2`).",
        "**Обмен значений:** `[m, n] = [n, m]` — без временной переменной.",
        "**Присваивание существующим переменным** требует скобок: `({ host, port = 80 } = obj)` — иначе `{` в начале оператора воспринимается как блок.",
        "**Порядок вычисления по умолчанию:** выражение справа вычисляется лениво и слева направо: `d1 = f(\"d1\")` вызвано (элемент `undefined`), а `d2` и `e1` — нет (значения есть), в журнале только `['d1']`.",
      ),
      note("Деструктуризация в параметрах (`function f({ a, b = 2 } = {})`) — главный способ принимать именованные параметры: порядок аргументов не важен, значения по умолчанию задаются рядом, а `= {}` позволяет вызывать функцию без аргументов."),

      h("Spread и rest"),
      code("js", `// в вызовах и массивах
const nums = [3, 1, 2];
console.log(Math.max(...nums), [0, ...nums, 4], [..."abc"], [...new Set([1, 1, 2])], [...new Map([["a", 1]])]);
const copy = [...nums];
console.log(copy === nums, copy);

// в объектах: собственные перечислимые свойства, последний побеждает
const base = { a: 1, b: 2, nested: { x: 1 } };
const merged = { ...base, b: 20, c: 30 };
const overridden = { b: 20, ...base };                // порядок важен: base перезаписал b
console.log(merged, overridden);
const shallow = { ...base };
shallow.nested.x = 99;
console.log(base.nested.x, shallow.nested === base.nested);

// что не копируется
class Point { constructor() { this.x = 1; } get double() { return this.x * 2; } }
const proto = Object.create({ inherited: 1 });
proto.own = 2;
Object.defineProperty(proto, "hidden", { value: 3, enumerable: false });
console.log({ ...new Point() } instanceof Point, { ...new Point() }, { ...proto }, { ...{ get g() { return "вычислено"; } } });

// «пустые» значения
console.log({ ...null, ...undefined, ...5, ..."hi" }, [...[], ...[1]]);
try { [...5]; } catch (e) { console.log(e.name + ": " + e.message); }
try { [...{ a: 1 }]; } catch (e) { console.log(e.name + ": " + e.message); }
try { Math.max(...undefined); } catch (e) { console.log(e.name + ": " + e.message); }

// spread — не глубокая копия, но достаточно для неизменяемого обновления
const state = { user: { name: "Аня", tags: ["a"] }, count: 0 };
const next = { ...state, user: { ...state.user, tags: [...state.user.tags, "b"] }, count: state.count + 1 };
console.log(state, next, state.user === next.user, state.user.tags === next.user.tags);

// rest-параметры и spread
function sum(first, ...others) { return others.reduce((acc, n) => acc + n, first); }
console.log(sum(1), sum(1, 2, 3), sum(...[1, 2, 3, 4]));`, { filename: "d2-spread.mjs", lineNumbers: true }),
      code("text", `3 [ 0, 3, 1, 2, 4 ] [ 'a', 'b', 'c' ] [ 1, 2 ] [ [ 'a', 1 ] ]
false [ 3, 1, 2 ]
{ a: 1, b: 20, nested: { x: 1 }, c: 30 } { b: 2, a: 1, nested: { x: 1 } }
99 true
false { x: 1 } { own: 2 } { g: 'вычислено' }
{ '0': 'h', '1': 'i' } [ 1 ]
TypeError: 5 is not iterable
TypeError: {(intermediate value)} is not iterable
TypeError: undefined is not iterable (cannot read property undefined)
{ user: { name: 'Аня', tags: [ 'a' ] }, count: 0 } { user: { name: 'Аня', tags: [ 'a', 'b' ] }, count: 1 } false false
1 6 10`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Массивы и вызовы:** `[0, ...nums, 4]`, `Math.max(...nums)`, `[...\"abc\"]`, `[...new Set([1, 1, 2])]`, `[...new Map(…)]` — spread использует итератор. `[...nums]` создаёт **новый** массив (`copy === nums` — `false`).",
        "**Объекты:** `{ ...a, ...b }` копирует **собственные перечислимые** свойства; побеждает последний ключ. `{ ...base, b: 20, c: 30 }` переопределила `b`, а `{ b: 20, ...base }` — нет: `b` вернулся к `2`.",
        "**Поверхностно:** после `shallow.nested.x = 99` изменилось и `base.nested.x` (`shallow.nested === base.nested`).",
        "**Что не копируется:** прототип (`{ ...new Point() } instanceof Point` — `false`, остался только `x`), унаследованные свойства (`inherited`), неперечислимые (`hidden`), а геттеры **вычисляются**, и копия получает значение (`{ g: 'вычислено' }`).",
        "**«Пустые» значения:** `{ ...null, ...undefined, ...5 }` — пусто; строка `\"hi\"` развернулась в `{ '0': 'h', '1': 'i' }`. А вот для массивов и вызовов нужен итерируемый объект: `[...5]` — `TypeError: 5 is not iterable`; `[...{ a: 1 }]` — `TypeError: {(intermediate value)} is not iterable`; `Math.max(...undefined)` — `TypeError: undefined is not iterable (cannot read property undefined)`.",
        "**Неизменяемое обновление:** `{ ...state, user: { ...state.user, tags: [...state.user.tags, \"b\"] }, count: state.count + 1 }` создала новые объекты только по пути изменения; `state` остался прежним.",
        "**Rest-параметры:** `sum(first, ...others)` — настоящий массив (в отличие от `arguments`); `sum(...[1, 2, 3, 4])` — spread при вызове.",
      ),
      warn("Spread объекта **не заменяет** глубокое копирование и не сохраняет класс. Для глубокой копии данных — `structuredClone`; для экземпляров классов — собственный метод `clone()`."),

      h("Ошибки деструктуризации"),
      code("js", `const attempts = {
  "деструктуризация null": () => { const { a } = null; },
  "деструктуризация undefined": () => { const { a } = undefined; },
  "из вызова, вернувшего undefined": () => { const f = () => undefined; const { a } = f(); },
  "вложенный путь отсутствует": () => { const { x: { y } } = { x: undefined }; },
  "массив из null": () => { const [a] = null; },
  "массив из числа": () => { const [a] = 5; },
  "массив из объекта": () => { const [a] = { 0: "x" }; },
  "параметр без значения": () => { const f = ({ a }) => a; f(); },
  "присваивание без скобок": () => new Function("let a; { a } = { a: 1 };"),
  "rest не последний": () => new Function("const [...r, last] = [1, 2];"),
  "const без инициализатора": () => new Function("const { a };"),
  "повтор имени": () => new Function("const { a, a } = {};"),
};
for (const [label, fn] of Object.entries(attempts)) {
  try { fn(); console.log(label.padEnd(34), "→ без ошибки"); }
  catch (e) { console.log(label.padEnd(34), "→", e.name + ": " + e.message); }
}

// безопасные варианты
const { a = 1 } = {};
const { b } = {} ?? {};
const config = null;
const { host = "localhost" } = config ?? {};
const f = ({ x, y = 2 } = {}) => [x, y];
console.log(a, b, host, f(), f({ x: 1 }), f({ y: null }));`, { filename: "d3-errors.mjs", lineNumbers: true }),
      code("text", `деструктуризация null              → TypeError: Cannot destructure property 'a' of 'null' as it is null.
деструктуризация undefined         → TypeError: Cannot destructure property 'a' of 'undefined' as it is undefined.
из вызова, вернувшего undefined    → TypeError: Cannot destructure property 'a' of 'f(...)' as it is undefined.
вложенный путь отсутствует         → TypeError: Cannot read properties of undefined (reading 'y')
массив из null                     → TypeError: null is not iterable
массив из числа                    → TypeError: 5 is not iterable
массив из объекта                  → TypeError: {(intermediate value)} is not iterable
параметр без значения              → TypeError: Cannot destructure property 'a' of 'undefined' as it is undefined.
присваивание без скобок            → SyntaxError: Unexpected token '='
rest не последний                  → SyntaxError: Rest element must be last element
const без инициализатора           → SyntaxError: Missing initializer in destructuring declaration
повтор имени                       → SyntaxError: Identifier 'a' has already been declared
1 undefined localhost [ undefined, 2 ] [ 1, 2 ] [ undefined, null ]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`null`/`undefined`:** `TypeError: Cannot destructure property 'a' of 'null' as it is null.` — сообщение называет и свойство, и источник (даже `'f(...)'` для вызова функции).",
        "**Вложенный путь:** `{ x: { y } }` при `x: undefined` — `TypeError: Cannot read properties of undefined (reading 'y')`; защита — значение по умолчанию вложенного уровня: `{ x: { y } = {} }`.",
        "**Итерируемость:** `[a] = null` / `5` / `{ 0: \"x\" }` — `TypeError: … is not iterable` (обычные объекты, даже с индексами, не итерируются).",
        "**Параметр без аргумента:** `f()` для `({ a }) => a` — `TypeError`; значение по умолчанию параметра (`= {}`) это исправляет.",
        "**Синтаксис:** присваивание без скобок — `SyntaxError: Unexpected token '='`; rest не последний — `Rest element must be last element`; `const { a };` — `Missing initializer in destructuring declaration`; повтор имени — `Identifier 'a' has already been declared`.",
        "**Безопасные варианты:** `const { a = 1 } = {}`; `const { host = \"localhost\" } = config ?? {}`; `f = ({ x, y = 2 } = {}) => …` — `f()` → `[undefined, 2]`, `f({ y: null })` → `[undefined, null]` (для `null` значение по умолчанию не сработало).",
      ),

      h("Практические приёмы"),
      code("js", `// 1. объект настроек с значениями по умолчанию
function createServer({ host = "localhost", port = 8080, tls: { enabled = false, cert = null } = {} } = {}) {
  return { host, port, tls: enabled, cert };
}
console.log(createServer(), createServer({ port: 3000, tls: { enabled: true, cert: "a.pem" } }));

// 2. несколько возвращаемых значений
const minMax = (xs) => [Math.min(...xs), Math.max(...xs)];
const stats = (xs) => ({ count: xs.length, sum: xs.reduce((a, b) => a + b, 0) });
const [lo, hi] = minMax([4, 9, 2]);
const { count, sum } = stats([4, 9, 2]);
console.log(lo, hi, count, sum);

// 3. исключение и выбор свойств без мутации
const omit = (obj, ...keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
const { password, ...safeUser } = { name: "Аня", password: "123", role: "admin" };
console.log(safeUser, omit({ a: 1, b: 2, c: 3 }, "a", "c"));

// 4. деструктуризация в циклах и колбэках
const users = [{ id: 1, name: "Аня", tags: ["a"] }, { id: 2, name: "Борис", tags: [] }];
for (const { id, name, tags: [firstTag = "—"] } of users) console.log(id, name, firstTag);
console.log(users.map(({ name }) => name), Object.entries({ x: 1, y: 2 }).map(([k, v]) => \`\${k}=\${v}\`));

// 5. регулярные выражения и разбор строк
const [, year, month, day] = /(\\d{4})-(\\d{2})-(\\d{2})/.exec("Дата: 2024-05-17") ?? [];
const [protocol, rest] = "https://example.org/path".split("://");
console.log(year, month, day, protocol, rest);

// 6. неизменяемое обновление
const state = { todos: [{ id: 1, done: false }, { id: 2, done: false }], filter: "all" };
const toggled = { ...state, todos: state.todos.map((t) => (t.id === 2 ? { ...t, done: true } : t)) };
console.log(toggled.todos, toggled.filter === state.filter, toggled.todos[0] === state.todos[0], toggled.todos[1] === state.todos[1]);

// 7. переименование ключей
const renamed = (({ first_name: firstName, last_name: lastName }) => ({ firstName, lastName }))({ first_name: "Аня", last_name: "Иванова" });
console.log(renamed);

// 8. слияние с настройками по умолчанию (поверхностное) и его ограничение
const defaults = { theme: "light", editor: { size: 14, tabs: 2 } };
console.log({ ...defaults, ...{ editor: { size: 16 } } });`, { filename: "d4-patterns.mjs", lineNumbers: true }),
      code("text", `{ host: 'localhost', port: 8080, tls: false, cert: null } { host: 'localhost', port: 3000, tls: true, cert: 'a.pem' }
2 9 3 15
{ name: 'Аня', role: 'admin' } { b: 2 }
1 Аня a
2 Борис —
[ 'Аня', 'Борис' ] [ 'x=1', 'y=2' ]
2024 05 17 https example.org/path
[ { id: 1, done: false }, { id: 2, done: true } ] true true false
{ firstName: 'Аня', lastName: 'Иванова' }
{ theme: 'light', editor: { size: 16 } }`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Опции с вложенными значениями по умолчанию:** `createServer({ host = \"localhost\", port = 8080, tls: { enabled = false, cert = null } = {} } = {})` — вызов без аргументов и с частичными данными дают полный результат.",
        "**Несколько результатов:** массив для кортежей (`[lo, hi]`), объект для именованных значений (`{ count, sum }`).",
        "**Исключить поле:** `const { password, ...safeUser } = user` — быстрый «omit» для известного ключа; для динамического набора ключей — функция `omit`.",
        "**В циклах и колбэках:** `for (const { id, name, tags: [firstTag = \"—\"] } of users)` и `.map(({ name }) => name)`.",
        "**Разбор строк:** `const [, year, month, day] = regex.exec(text) ?? []` — защита от `null`.",
        "**Неизменяемое обновление списка:** `todos.map((t) => (t.id === 2 ? { ...t, done: true } : t))`: неизменённые элементы сохранили ссылки (`toggled.todos[0] === state.todos[0]`), изменённый — новый.",
        "**Ограничение поверхностного слияния:** `{ ...defaults, ...{ editor: { size: 16 } } }` целиком заменил `editor` и потерял `tabs`. Для вложенных настроек нужно слияние по уровням (см. `withDefaults` ниже).",
      ),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const user = { name: "Аня", city: "Казань", tags: ["js", "css"], password: "123" };

const { name, city: town = "не указан" } = user;        // по именам; переименование и значение по умолчанию
const [firstTag, ...otherTags] = user.tags;             // по позициям; остаток в массив
const { password, ...safeUser } = user;                 // остаток объекта: всё, кроме password

const updated = { ...safeUser, city: "Москва" };        // spread объекта + переопределение
const allTags = [...user.tags, "html"];                 // spread массива
const longest = Math.max(...[3, 9, 4]);                 // spread в аргументы вызова

function greet({ name, greeting = "Привет" } = {}) {    // деструктуризация параметра
  return \`\${greeting}, \${name}!\`;
}

console.log(name, town, firstTag, otherTags, safeUser, updated.city, allTags, longest, greet({ name }));`,
        [
          { line: 3, text: "Деструктуризация объекта: `name` — по имени; `city: town = …` — переименование в `town` и значение по умолчанию." },
          { line: 4, text: "Деструктуризация массива: `firstTag` — первый элемент, `...otherTags` — остаток в новый массив." },
          { line: 5, text: "Rest объекта: `safeUser` — копия всех собственных перечислимых свойств, кроме `password`." },
          { line: 7, text: "Spread объекта + переопределение: исходный `safeUser` не меняется, `city` в копии — `Москва`." },
          { line: 8, text: "Spread массива: новые элементы добавляются без изменения `user.tags`." },
          { line: 9, text: "Spread в вызове: элементы массива становятся отдельными аргументами `Math.max`." },
          { line: [11, 13], text: "Деструктуризация параметра: именованные аргументы, значение по умолчанию `greeting`, `= {}` защищает от вызова без аргументов." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Регистрация</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 30rem; }
  label { display: block; margin-block: .5rem; }
  input, select { font: inherit; padding: .25rem .4rem; }
  pre { background: #8881; padding: .75rem; border-radius: 6px; overflow: auto; }
</style>
<h1>Регистрация</h1>
<form id="f">
  <label>Имя <input name="name" required value="Аня"></label>
  <label>Город <input name="city" placeholder="не обязательно"></label>
  <label>Пароль <input name="password" type="password" value="secret"></label>
  <label>Роль
    <select name="role"><option value="">по умолчанию</option><option>admin</option><option>editor</option></select>
  </label>
  <button>Отправить</button>
</form>
<pre id="out" aria-live="polite"></pre>
<script type="module">
  const form = document.querySelector("#f");
  const out = document.querySelector("#out");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));                 // { name, city, password, role }
    const { password, city = "не указан", role, ...rest } = data;         // деструктуризация: пароль отдельно, остальное в rest
    const user = {
      ...rest,                                                           // spread: имя и всё остальное
      city: city || "не указан",                                         // пустая строка — не undefined, значение по умолчанию не сработало бы
      role: role || "user",
      passwordLength: password.length,
    };
    out.textContent = JSON.stringify(user, null, 2);
  });
</script>`, { filename: "signup.html", runnable: true, lineNumbers: true }),
      p("Форма собирает данные через `Object.fromEntries(new FormData(form))`, выделяет пароль деструктуризацией и собирает безопасный объект spread-ом. Замер в Chromium 141: с значениями по умолчанию результат — `{ name: \"Аня\", city: \"не указан\", role: \"user\", passwordLength: 6 }`; после ввода города `Казань` и выбора роли `admin` — `{ name: \"Аня\", city: \"Казань\", role: \"admin\", passwordLength: 6 }`; пароль в результат не попал; ошибок страницы нет. Обратите внимание: пустое поле даёт `\"\"`, а не `undefined`, поэтому `city = \"не указан\"` не срабатывает — применён `||`."),
    ]),

    section("detailed-example", [
      p("`setIn(source, path, value)` и `updateIn` — неизменяемое обновление по пути со **структурным разделением**: копируется только цепочка объектов от корня до изменённого значения, все остальные ветви сохраняют ссылки, а запись того же значения возвращает тот же объект. Недостающие уровни создаются: объект для строкового ключа, массив для числового."),
      code("js", `const isObj = (v) => v !== null && typeof v === "object";

// Неизменяемая запись по пути: меняется только цепочка объектов от корня до значения,
// всё остальное сохраняет ссылки (структурное разделение).
export function setIn(source, path, value) {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  const current = isObj(source) ? source : undefined;
  const child = current?.[key];
  const nextChild = setIn(child, rest, value);
  if (current !== undefined && Object.is(child, nextChild)) return source;      // ничего не изменилось
  if (Array.isArray(current)) {
    const copy = [...current];
    copy[key] = nextChild;
    return copy;
  }
  const base = current ?? (typeof key === "number" ? [] : {});                  // недостающий уровень: массив для числового ключа
  if (Array.isArray(base)) {
    const copy = [...base];
    copy[key] = nextChild;
    return copy;
  }
  return { ...base, [key]: nextChild };
}

export function updateIn(source, path, fn) {
  let current = source;
  for (const key of path) current = isObj(current) ? current[key] : undefined;
  return setIn(source, path, fn(current));
}`, { filename: "set-in.mjs", lineNumbers: true }),
      code("js", `import { setIn, updateIn } from "./set-in.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);

const state = {
  user: { name: "Аня", address: { city: "Казань", zip: "420000" } },
  todos: [{ id: 1, done: false }, { id: 2, done: false }],
  settings: { theme: "light" },
};
const next = setIn(state, ["user", "address", "city"], "Москва");

check("значение записано", next.user.address.city, "Москва");
check("исходный объект не изменён", state.user.address.city, "Казань");
check("соседние поля сохранены", [next.user.address.zip, next.user.name], ["420000", "Аня"]);
check("изменённая цепочка — новые объекты", [next === state, next.user === state.user, next.user.address === state.user.address], [false, false, false]);
check("нетронутые ветки — те же ссылки", [next.todos === state.todos, next.settings === state.settings], [true, true]);

check("то же значение — тот же объект", setIn(state, ["user", "address", "city"], "Казань") === state, true);

const withTodo = setIn(state, ["todos", 1, "done"], true);
check("индекс массива", [withTodo.todos[1].done, state.todos[1].done, Array.isArray(withTodo.todos)], [true, false, true]);
check("соседний элемент массива — та же ссылка", withTodo.todos[0] === state.todos[0], true);

check("создание недостающих уровней объектов", setIn({}, ["a", "b", "c"], 1), { a: { b: { c: 1 } } });
check("числовой ключ создаёт массив", setIn({}, ["list", 1], "x"), { list: [null, "x"] });
check("пустой путь заменяет значение", setIn({ a: 1 }, [], 5), 5);
check("запись в null/примитив заменяет его", [setIn({ a: null }, ["a", "b"], 1), setIn({ a: 5 }, ["a", "b"], 1)], [{ a: { b: 1 } }, { a: { b: 1 } }]);

const counter = updateIn({ stats: { views: 10 } }, ["stats", "views"], (n) => n + 1);
check("updateIn", counter, { stats: { views: 11 } });
check("updateIn по отсутствующему пути", updateIn({}, ["stats", "views"], (n = 0) => n + 1), { stats: { views: 1 } });

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "set-in-test.mjs", collapsed: true }),
      code("text", `Все 14 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает", "Почему так"],
        [
          ["`const [key, ...rest] = path`", "Отделяет первый ключ пути от остатка", "Деструктуризация массива с rest — естественная запись рекурсии по списку"],
          ["`setIn(child, rest, value)`", "Рекурсивно строит новое значение для дочерней ветви", "Базовый случай — пустой путь: возвращается `value`"],
          ["`Object.is(child, nextChild)` → `return source`", "Если ветвь не изменилась, возвращает прежний объект", "Структурное разделение: сравнение ссылок сразу показывает, что изменений нет (проверка «то же значение — тот же объект»)"],
          ["`{ ...base, [key]: nextChild }` и `copy = [...current]`", "Копия объекта или массива с заменой одного ключа", "Spread копирует верхний уровень (дёшево), остальные ссылки сохраняются"],
          ["`typeof key === \"number\" ? [] : {}`", "Создаёт недостающий уровень нужного типа", "Числовой ключ — массив; но строка `\"0\"` создаст объект"],
          ["`isObj(source) ? source : undefined`", "Не пытается писать «внутрь» `null` и примитивов", "`setIn({ a: 5 }, [\"a\", \"b\"], 1)` заменяет `5` на объект `{ b: 1 }`"],
        ],
        "Разбор setIn",
      ),
      ul(
        "Все 14 проверок проходят: запись значения, неизменность исходного объекта, сохранение соседних ссылок, новые ссылки только на цепочке изменений, «то же значение — тот же объект», индекс массива, создание уровней, пустой путь, замена `null` и примитивов, `updateIn`.",
        "**Зачем структурное разделение:** в интерфейсах изменения определяют сравнением ссылок (`prev.todos === next.todos`): если ветвь не менялась, её не нужно перерисовывать.",
        "**Ограничение:** функция работает с простыми объектами и массивами; `Map`, `Set`, экземпляры классов требуют отдельной обработки.",
      ),
    ]),

    section("internals", [
      h("Деструктуризация — это сокращённая запись обращений"),
      p("`const { a, b = 2 } = obj` равносильно `const a = obj.a; let b = obj.b; if (b === undefined) b = 2;` — но с тем отличием, что `obj` вычисляется один раз, а при `null`/`undefined` бросается `TypeError`. Поэтому геттеры вызываются, а значения по умолчанию — только когда нужны (ленивое вычисление, проверено журналом вызовов)."),
      h("Массивы: через итератор"),
      p("`const [a, b] = iterable` берёт итератор через `iterable[Symbol.iterator]()` и вызывает `next()` ровно столько раз, сколько элементов запрашивается шаблоном (затем вызывает `return()`, если итератор не закончился). Поэтому деструктуризация работает со строками, `Set`, `Map`, генераторами и не работает с обычными объектами (нет `Symbol.iterator`) — замер: `TypeError: … is not iterable`."),
      h("Rest объекта и spread объекта"),
      p("Rest `{ a, ...rest }` и spread `{ ...obj }` копируют **собственные перечислимые** свойства (строковые и символьные) через операцию `CopyDataProperties`: они читают значения (вызывая геттеры), создают в результате обычные свойства-данные и не переносят дескрипторы и прототип. Поэтому «копия» теряет аксессоры (становятся данными), неперечислимые и унаследованные свойства."),
      h("Spread в вызовах и ограничения"),
      p("`f(...args)` раскладывает итерируемое в аргументы на стеке вызовов. У движков есть предел числа аргументов: в замере Node.js 22.22.0 `Math.max(...a)` падала с `RangeError: Maximum call stack size exceeded` для 150 000 элементов (см. тему о массивах). Для больших массивов используйте `reduce`."),
      h("Присваивание деструктуризацией и скобки"),
      p("В начале оператора `{` разбирается как **блок**, поэтому `{ a } = obj` — синтаксическая ошибка (замер: `Unexpected token '='`). Круглые скобки превращают строку в выражение: `({ a } = obj)`. Для массивов проблемы нет: `[a, b] = [b, a]`."),
      h("Порядок и перезапись"),
      p("Литерал объекта вычисляется слева направо: каждое новое свойство (в том числе из spread) перезаписывает предыдущее с тем же ключом. Поэтому `{ ...defaults, ...options }` — «значения по умолчанию, поверх которых пользовательские», а наоборот — нет."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Ждать значение по умолчанию для `null` и пустой строки"),
      wrongRight(
        "js",
        {
          code: `
            const { volume = 50 } = { volume: null };   // 50?  нет — null
            const { city = "не указан" } = { city: "" };  // не сработает
          `,
          note: "Значение по умолчанию подставляется только при `undefined` (замер: `null`).",
        },
        {
          code: `
            const { volume } = settings;
            const level = volume ?? 50;                 // для null и undefined
            const town = city || "не указан";           // и для пустой строки
          `,
          note: "`??` — для `null`/`undefined`, `||` — для любых ложных значений (осознанно).",
        },
      ),
      h("Ошибка 2. Деструктуризация результата, который может быть `null`"),
      p("`const { name } = find(2)` — `TypeError: Cannot destructure property 'name' of 'find(...)' as it is null.` Используйте `const { name = \"не найден\" } = find(2) ?? {}`."),
      h("Ошибка 3. Считать spread глубокой копией"),
      p("`{ ...original }` скопировала верхний уровень: `bad.tags.push(\"b\")` изменил `original.tags` (замер). Копируйте вложенное явно: `tags: [...original.tags]` или `structuredClone`."),
      h("Ошибка 4. Поверхностное слияние вложенных настроек"),
      p("`{ ...defaults, ...userSettings }` заменила `editor` целиком и потеряла `tabs` (замер: `{ size: 16 }`). Сливайте уровни: `editor: { ...defaults.editor, ...userSettings.editor }` или функцией."),
      h("Ошибка 5. Перепутать порядок spread"),
      p("`{ b: 20, ...base }` перезаписывается значением из `base` (замер: `b: 2`); пользовательские значения кладите **после** значений по умолчанию."),
      h("Ошибка 6. Присваивание деструктуризацией без скобок"),
      p("`{ host, port } = obj;` в начале строки — `SyntaxError: Unexpected token '='`. Нужно `({ host, port } = obj);`."),
      h("Ошибка 7. Spread объекта для экземпляров классов"),
      p("`{ ...new Point() } instanceof Point` — `false`: копия — обычный объект. Для клонирования экземпляров нужен метод класса или `Object.create(Object.getPrototypeOf(x))` с копированием свойств."),
      h("Ошибка 8. Деструктуризация нужного, но отсутствующего вложенного объекта"),
      p("`const { x: { y } } = { x: undefined }` — `TypeError: Cannot read properties of undefined (reading 'y')`. Добавьте значение по умолчанию вложенного уровня: `{ x: { y } = {} }`."),
    ]),

    section("antipatterns", [
      ul(
        "**Глубокая деструктуризация на три-четыре уровня** в одной строке: тяжело читать и отлаживать, а ошибка при пропущенных данных непонятна.",
        "**Функции с длинным списком позиционных параметров** вместо объекта параметров.",
        "**Spread в «горячем» цикле на больших объектах** (`acc = { ...acc, [k]: v }` в `reduce` по тысячам элементов): квадратичное копирование.",
        "**Мутации после spread** («это же копия») без проверки вложенных структур.",
        "**`Object.assign` и spread вперемешку** для одного и того же в одном коде.",
        "**Деструктуризация ради деструктуризации:** `const { length } = arr` вместо `arr.length`, когда выгоды нет.",
        "**Rest-параметры вместо явных именованных,** когда аргументы разной природы.",
        "**Подмена `arguments`:** в новом коде используйте rest.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Принимайте объект параметров** для функций с более чем тремя аргументами; задавайте значения по умолчанию и `= {}`.",
        "**Для `null` и пустых значений используйте `??`/`||` явно;** не рассчитывайте на значение по умолчанию.",
        "**Делайте неизменяемые обновления spread-ом по пути изменения,** остальное оставляйте с прежними ссылками.",
        "**Для глубокой копии — `structuredClone`;** для вложенных настроек — слияние по уровням.",
        "**`omit` через rest** для известных ключей, `Object.fromEntries`/`filter` — для динамических.",
        "**Защищайтесь от `null`:** `?? {}`, значения по умолчанию, проверка до деструктуризации.",
        "**Ограничивайте вложенность** шаблонов деструктуризации: два уровня — предел читаемости.",
        "**Тестируйте** пустые данные, `null`, `undefined`, пустые массивы и общие ссылки.",
      ),
      tip("Если деструктуризация падает с `Cannot destructure property`, посмотрите в тексте ошибки, **что** было источником (`'null'`, `'undefined'`, `'f(...)'`) — это сразу указывает на вызов, вернувший пустое значение."),
    ]),

    section("edge-cases", [
      h("Деструктуризация строк и итерируемых по кодовым точкам"),
      p("`const [first] = \"😀a\"` вернёт всю эмодзи (кодовую точку), а `\"😀a\"[0]` — половину суррогатной пары. Строковый spread и деструктуризация идут по кодовым точкам."),
      h("Символьные ключи и spread"),
      p("Spread и rest копируют и символьные перечислимые свойства; `Object.keys` их не видит."),
      h("Значения по умолчанию и выражения"),
      p("Значение по умолчанию — произвольное выражение: `{ id = generateId() }` вызовет функцию только когда `id` равен `undefined`. Побочные эффекты в таких выражениях — источник путаницы."),
      h("Деструктуризация и `this`"),
      p("`const { method } = obj` извлекает метод и теряет `this` (тема о `this`); вызовите `obj.method()` или привяжите."),
      h("`arguments` и rest"),
      p("`rest` — настоящий массив и работает в стрелках; `arguments` — array-подобный объект (в обычных функциях). Используйте rest."),
      h("Spread и порядок ключей"),
      p("Ключи результата `{ ...a, ...b }` идут в порядке первого появления: перезапись значения позицию ключа не меняет (замер: `{ a: 1, b: 20, nested: …, c: 30 }`)."),
    ]),

    section("related", [
      ul(
        "[Массивы](/learn/js/arrays) — итерация, `Array.from`, spread массивов.",
        "[Объекты и свойства](/learn/js/objects-properties) — собственные и перечислимые свойства, `structuredClone`.",
        "[Функции: основы](/learn/js/functions-basics) — параметры по умолчанию и rest.",
        "[Операторы и приведение типов](/learn/js/operators-coercion) — `??`, `?.`, `||`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Ручной разбор, `Object.assign` и мутации",
          code: `
            function createServer(options) {
              options = options || {};
              var host = options.host !== undefined ? options.host : "localhost";
              var port = options.port !== undefined ? options.port : 8080;
              var config = Object.assign({}, DEFAULTS, options);
              config.updatedAt = Date.now();
              return config;
            }
          `,
          note: "Много шума, ручные проверки `undefined`, `Object.assign` вместо ясного порядка слияния.",
        },
        {
          title: "Деструктуризация и spread",
          code: `
            function createServer({ host = "localhost", port = 8080, ...rest } = {}) {
              return { ...DEFAULTS, host, port, ...rest, updatedAt: Date.now() };
            }
          `,
          note: "Значения по умолчанию рядом с параметрами, порядок слияния виден на одной строке, исходные объекты не меняются.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.destructuring-spread.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код, скажите, что напечатает каждая строка, и объясните значения по умолчанию, rest, порядок spread и общие ссылки."),
        code("js", `const { a, b = 2, ...rest } = { a: 1, c: 3, d: 4 };
console.log(a, b, rest);

const [x, y = x * 2, ...tail] = [5];
console.log(x, y, tail);

const { p: { q = "нет" } = {} } = {};
console.log(q);

const obj = { n: 1, ...{ n: 2, m: 3 }, k: 4 };
const arr = [...[1, 2], ...[3], ...[]];
console.log(obj, arr);

const base = { list: [1], meta: { v: 1 } };
const copy = { ...base };
copy.list.push(2);
copy.meta = { v: 2 };
console.log(base, copy);

function f({ a = 1, b = 2 } = {}, [c = 3] = []) { return [a, b, c]; }
console.log(f(), f({ a: null }, [undefined]), f({ b: 0 }, [0]));`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Когда срабатывает значение по умолчанию?", "Что копирует `{ ...base }`: вложенные объекты или только ссылки на них?"],
      checks: ["Объяснено `b = 2` и `rest`", "Объяснено `y = 10`", "Объяснён общий массив после spread", "Объяснено `f({ a: null }, [undefined])`"],
      solution: [
        code("text", `1 2 { c: 3, d: 4 }
5 10 []
нет
{ n: 2, m: 3, k: 4 } [ 1, 2, 3 ]
{ list: [ 1, 2 ], meta: { v: 1 } } { list: [ 1, 2 ], meta: { v: 2 } }
[ 1, 2, 3 ] [ null, 2, 3 ] [ 1, 0, 0 ]`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "`b` отсутствует → значение по умолчанию `2`; rest — всё остальное: `{ c: 3, d: 4 }`.",
          "`y = x * 2` использует уже полученный `x = 5` → `10`; хвост пуст.",
          "Вложенное значение по умолчанию: `p = {}` → `q = \"нет\"`.",
          "В `{ n: 1, ...{ n: 2, m: 3 }, k: 4 }` побеждает последний `n: 2`; массивы склеились `[1, 2, 3]`.",
          "`copy` — поверхностная: `list` общий (оба `[1, 2]`), а `copy.meta = { v: 2 }` заменила только ссылку в копии.",
          "`f()` → `[1, 2, 3]`; `f({ a: null }, [undefined])` → `[null, 2, 3]` (для `null` по умолчанию не подставляется, для `undefined` — подставляется); `f({ b: 0 }, [0])` → `[1, 0, 0]`.",
        ),
      ],
    }),
    exercise({
      id: "js.destructuring-spread.ex2",
      title: "Четыре ловушки",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("В коде четыре ошибки: значение по умолчанию для `null`, поверхностное слияние настроек, «копия» с общим массивом и деструктуризация результата, который может быть `null`. Объясните каждую по выводу и исправьте."),
      ],
      hints: ["Что считается «отсутствующим» для значения по умолчанию?", "Какие уровни вложенности копирует spread?"],
      checks: ["Четыре причины названы", "Четыре исправления", "Каждое исправление проверено выводом"],
      solution: [
        code("js", `// Ошибка 1: значение по умолчанию не сработало для null
const settings = { volume: null };
const { volume = 50 } = settings;
const { volume: volume2 } = settings;
console.log(volume, volume2 ?? 50);

// Ошибка 2: поверхностное слияние стёрло вложенные настройки по умолчанию
const defaults = { theme: "light", editor: { size: 14, tabs: 2 } };
const userSettings = { editor: { size: 16 } };
const wrong = { ...defaults, ...userSettings };
const right = { ...defaults, ...userSettings, editor: { ...defaults.editor, ...userSettings.editor } };
console.log(wrong.editor, right.editor);

// Ошибка 3: «копия» разделяет вложенный массив с оригиналом
const original = { name: "Аня", tags: ["a"] };
const bad = { ...original };
bad.tags.push("b");
console.log(original.tags);
const good = { ...original, tags: [...original.tags] };
good.tags.push("c");
console.log(original.tags, good.tags);

// Ошибка 4: деструктуризация результата, который может быть null
function find(id) { return id === 1 ? { name: "Аня" } : null; }
try { const { name } = find(2); } catch (e) { console.log(e.name + ": " + e.message); }
const { name = "не найден" } = find(2) ?? {};
console.log(name);`, { filename: "x2-bugs.mjs" }),
        code("text", `null 50
{ size: 16 } { size: 16, tabs: 2 }
[ 'a', 'b' ]
[ 'a', 'b' ] [ 'a', 'b', 'c' ]
TypeError: Cannot destructure property 'name' of 'find(...)' as it is null.
не найден`, { filename: "вывод Node.js 22.22.0" }),
        p("1) По умолчанию подставляется только для `undefined`: нужен `??`. 2) `{ ...a, ...b }` заменил `editor` целиком: сливайте уровни. 3) Spread копирует верхний уровень: `tags` нужно копировать отдельно. 4) Деструктуризация `null` — `TypeError`: используйте `?? {}`."),
      ],
    }),
    exercise({
      id: "js.destructuring-spread.ex3",
      title: "pick, omit, renameKeys, withDefaults",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Напишите чистые функции: `pick(obj, ...keys)`, `omit(obj, ...keys)`, `renameKeys(obj, mapping)` и `withDefaults(obj, defaults)` (заполняет `undefined`, сливает вложенные простые объекты, не сливает массивы, сохраняет `null`, не изменяет входы и не допускает загрязнения прототипа)."),
      ],
      hints: ["Как отличить собственное свойство от унаследованного?", "Когда `withDefaults` должна рекурсивно углубляться?"],
      checks: ["Входные объекты не изменены", "`null` сохраняется, `undefined` заменяется", "Вложенные настройки сливаются", "Проверка `__proto__`"],
      solution: [
        code("js", `// pick: оставить только перечисленные собственные свойства
export function pick(obj, ...keys) {
  const result = {};
  for (const key of keys) {
    if (Object.hasOwn(obj, key)) result[key] = obj[key];
  }
  return result;
}

// omit: убрать перечисленные свойства; для известных ключей удобно использовать rest-деструктуризацию
export function omit(obj, ...keys) {
  const drop = new Set(keys);
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !drop.has(key)));
}

// renameKeys: переименовать ключи по таблице { старое: новое }, остальные сохранить
export function renameKeys(obj, mapping) {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [Object.hasOwn(mapping, key) ? mapping[key] : key, value]));
}

// defaults: заполнить отсутствующие (undefined) поля, включая вложенные простые объекты
export function withDefaults(obj, defaults) {
  const isPlain = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const result = { ...defaults, ...obj };
  for (const key of Object.keys(defaults)) {
    if (isPlain(defaults[key]) && isPlain(obj?.[key])) result[key] = withDefaults(obj[key], defaults[key]);
    if (obj?.[key] === undefined) result[key] = defaults[key];
  }
  return result;
}`, { filename: "object-utils.mjs" }),
        code("js", `import { pick, omit, renameKeys, withDefaults } from "./object-utils.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);

const user = { id: 1, name: "Аня", password: "123", role: "admin" };
check("pick", pick(user, "id", "name"), { id: 1, name: "Аня" });
check("pick: отсутствующие и унаследованные ключи пропускаются", pick(user, "zzz", "toString"), {});
check("omit", omit(user, "password"), { id: 1, name: "Аня", role: "admin" });
check("omit: несколько и отсутствующие ключи", omit(user, "id", "role", "nope"), { name: "Аня", password: "123" });
check("исходный объект не изменён", user, { id: 1, name: "Аня", password: "123", role: "admin" });
check("renameKeys", renameKeys({ first_name: "Аня", age: 30 }, { first_name: "firstName" }), { firstName: "Аня", age: 30 });
check("renameKeys: не затрагивает унаследованные ключи таблицы", renameKeys({ a: 1 }, {}), { a: 1 });

const defaults = { theme: "light", editor: { size: 14, tabs: 2 }, plugins: [] };
check("withDefaults: добавляет отсутствующее", withDefaults({}, defaults), defaults);
check("withDefaults: вложенный объект дополняется", withDefaults({ editor: { size: 16 } }, defaults).editor, { size: 16, tabs: 2 });
check("withDefaults: undefined заменяется, null сохраняется", [withDefaults({ theme: undefined }, defaults).theme, withDefaults({ theme: null }, defaults).theme], ["light", null]);
check("withDefaults: массив пользователя не сливается", withDefaults({ plugins: ["a"] }, defaults).plugins, ["a"]);
check("withDefaults: defaults не изменены", defaults, { theme: "light", editor: { size: 14, tabs: 2 }, plugins: [] });

const evil = JSON.parse('{"__proto__": {"polluted": true}}');
withDefaults(evil, defaults);
check("загрязнения прототипа нет", ({}).polluted, undefined);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "object-utils-test.mjs", collapsed: true }),
        code("text", `Все 13 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
        p("`pick` проверяет `Object.hasOwn`, `omit` строит новый объект из `Object.entries` без запрещённых ключей, `renameKeys` отображает ключи по таблице, `withDefaults` рекурсивно сливает простые объекты и заменяет только `undefined`. Spread с ключом `__proto__` из `JSON.parse` создаёт собственное свойство, а не меняет прототип: загрязнения нет."),
      ],
    }),
  ],

  challenge: {
    id: "js.destructuring-spread.challenge",
    title: "Неизменяемое обновление по пути (setIn)",
    scenario: [
      p("Хранилище состояния интерфейса должно обновляться неизменяемо, а компоненты — перерисовываться только при изменении своей ветви (сравнением по ссылке). Реализуйте модуль `set-in.mjs` с функциями `setIn(source, path, value)` и `updateIn(source, path, fn)`."),
    ],
    requirements: [
      "Исходные данные не изменяются; новые объекты создаются только на пути от корня до изменённого значения",
      "Нетронутые ветви сохраняют прежние ссылки; запись того же значения возвращает тот же объект",
      "Пути содержат строки и числа; для числового ключа в отсутствующем месте создаётся массив, иначе объект",
      "Пустой путь заменяет значение целиком; запись «внутрь» `null` или примитива заменяет их объектом/массивом",
      "`updateIn` читает текущее значение по пути, применяет функцию и записывает результат",
    ],
    constraints: [
      "Без внешних библиотек и без `structuredClone`",
      "Не использовать мутации (`push`, присваивание полям исходных объектов)",
    ],
    acceptance: [
      "Все 14 проверок из теста проходят",
      "`setIn(state, [\"user\", \"address\", \"city\"], \"Казань\") === state`, если значение не изменилось",
      "`next.todos === state.todos` после изменения `user.address.city`",
    ],
    hints: [
      "Как разобрать путь на первый ключ и остаток?",
      "Когда рекурсивный вызов может вернуть прежнюю ссылку?",
      "Как отличить создание массива от объекта для недостающего уровня?",
    ],
    solution: [
      code("js", `const isObj = (v) => v !== null && typeof v === "object";

// Неизменяемая запись по пути: меняется только цепочка объектов от корня до значения,
// всё остальное сохраняет ссылки (структурное разделение).
export function setIn(source, path, value) {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  const current = isObj(source) ? source : undefined;
  const child = current?.[key];
  const nextChild = setIn(child, rest, value);
  if (current !== undefined && Object.is(child, nextChild)) return source;      // ничего не изменилось
  if (Array.isArray(current)) {
    const copy = [...current];
    copy[key] = nextChild;
    return copy;
  }
  const base = current ?? (typeof key === "number" ? [] : {});                  // недостающий уровень: массив для числового ключа
  if (Array.isArray(base)) {
    const copy = [...base];
    copy[key] = nextChild;
    return copy;
  }
  return { ...base, [key]: nextChild };
}

export function updateIn(source, path, fn) {
  let current = source;
  for (const key of path) current = isObj(current) ? current[key] : undefined;
  return setIn(source, path, fn(current));
}`, { filename: "set-in.mjs", lineNumbers: true }),
      code("text", `Все 14 проверок пройдены`, { filename: "результат запуска тестов" }),
      p("Рекурсия по пути: `const [key, ...rest] = path`; новая ветвь строится рекурсивно; если она совпала со старой (`Object.is`), возвращается `source`; иначе копия верхнего уровня (`{ ...base, [key]: nextChild }` или `[...current]`) с заменой одного ключа."),
    ],
  },

  interview: [
    iq("js.destructuring-spread.i1", "basic", "Что такое деструктуризация и чем она удобна?", [
      p("Синтаксис разбора объекта по именам и массива по позициям в переменные: `const { a, b } = obj`, `const [x, y] = arr`. Поддерживает переименование, значения по умолчанию, вложенность и rest. Удобна в параметрах функций, при возврате нескольких значений и обмене переменных."),
    ]),
    iq("js.destructuring-spread.i2", "basic", "Чем spread отличается от rest?", [
      ul(
        "Spread (`...x` в вызове, массиве, объекте) **разворачивает** элементы или свойства.",
        "Rest (`...x` в параметрах или в конце шаблона деструктуризации) **собирает** остаток в массив или объект.",
        "Синтаксис одинаков — смысл определяется местом.",
      ),
    ]),
    iq("js.destructuring-spread.i3", "intermediate", "Когда срабатывает значение по умолчанию в деструктуризации?", [
      ul(
        "Только когда значение равно `undefined` (свойство отсутствует или явно `undefined`).",
        "Для `null`, `0`, `\"\"`, `false` оно не применяется.",
        "Выражение по умолчанию вычисляется лениво — только если нужно.",
      ),
    ]),
    iq("js.destructuring-spread.i4", "intermediate", "Копирует ли spread объект глубоко? Что ещё он не копирует?", [
      ul(
        "Нет: копирует собственные перечислимые свойства верхнего уровня; вложенные объекты общие.",
        "Не копирует прототип (экземпляр класса превращается в обычный объект), унаследованные и неперечислимые свойства; геттеры вычисляются, и в копии остаётся значение.",
        "Для глубокой копии — `structuredClone`.",
      ),
    ]),
    iq("js.destructuring-spread.i5", "intermediate", "Что произойдёт при `const { a } = null` и как защититься?", [
      ul(
        "`TypeError: Cannot destructure property 'a' of 'null' as it is null.`",
        "Защита: `const { a } = obj ?? {}`, значение по умолчанию параметра `= {}`, проверка до разбора.",
        "Для вложенных путей — значения по умолчанию на каждом уровне (`{ x: { y } = {} }`).",
      ),
    ]),
    iq("js.destructuring-spread.i6", "advanced", "Почему в `{ ...defaults, ...options }` порядок важен и как правильно слить вложенные настройки?", [
      ul(
        "Последний ключ побеждает: пользовательские значения должны идти после значений по умолчанию.",
        "Слияние поверхностное: вложенный объект заменяется целиком (`editor` потеряет `tabs`).",
        "Решение: слияние по уровням (`editor: { ...defaults.editor, ...options.editor }`) или рекурсивная функция с защитой от `__proto__`.",
      ),
    ]),
    iq("js.destructuring-spread.i7", "engineering", "Как обновлять вложенное состояние неизменяемо, чтобы интерфейс перерисовывался только где нужно?", [
      ul(
        "Копировать только путь от корня до изменённого значения (`{ ...state, user: { ...state.user, … } }`) — структурное разделение.",
        "Нетронутые ветви сохраняют ссылки: сравнение `prev === next` определяет, что не изменилось.",
        "Для глубоких путей — функции `setIn`/`updateIn`; в крупных проектах — специализированные библиотеки.",
        "Не мутировать входные данные; тесты на сохранение ссылок.",
      ),
    ]),
    iq("js.destructuring-spread.i8", "debugging", "`const { x, y } = getPoint()` падает с «Cannot destructure property 'x' of 'getPoint(...)' as it is undefined». Что искать?", [
      ul(
        "Функция вернула `undefined`: забытый `return`, ветка без возврата, асинхронная функция без `await`.",
        "Проверить, что вызывается нужная функция и что она возвращает объект во всех ветках.",
        "Добавить значение по умолчанию (`?? {}`) или явную обработку отсутствия, а не скрывать ошибку.",
      ),
    ]),
  ],

  exam: [
    mcq("js.destructuring-spread.e1", "foundation", "Чему равно `b` в `const { a, b = 2 } = { a: 1 }`?", ["`undefined`", "`null`", "`2`", "Ошибка"], 2, "Свойство `b` отсутствует (`undefined`) — подставляется значение по умолчанию."),
    mcq("js.destructuring-spread.e2", "foundation", "Что вернёт `[...[1, 2], ...[3]]`?", ["`[1, 2, 3]`", "`[[1, 2], [3]]`", "`[1, 2]`", "`3`"], 0, "Spread разворачивает элементы массивов в новый массив."),
    mcq("js.destructuring-spread.e3", "intermediate", "Чему равно `c` в `const { c = 3 } = { c: null }`?", ["`3`", "Ошибка", "`undefined`", "`null`"], 3, "Значение по умолчанию подставляется только при `undefined`; `null` остаётся `null` (замер)."),
    mcq("js.destructuring-spread.e4", "intermediate", "Что вернёт `({ ...{ a: 1, b: 2 }, a: 10 }).a` и `({ a: 10, ...{ a: 1 } }).a`?", ["`10` и `10`", "`10` и `1`", "`1` и `10`", "`1` и `1`"], 1, "Побеждает последнее значение ключа: в первом — `a: 10` после spread, во втором — spread после `a: 10`."),
    mcq("js.destructuring-spread.e5", "intermediate", "Какие утверждения о `{ ...obj }` верны? Выберите все.", ["Копирует собственные перечислимые свойства", "Копирует прототип экземпляра", "Вложенные объекты остаются общими", "Вычисляет геттеры и записывает значения"], [0, 2, 3], "Прототип не копируется: `{ ...new Point() } instanceof Point` — `false` (замер)."),
    mcq("js.destructuring-spread.e6", "advanced", "Почему `{ host, port } = obj;` в начале оператора — `SyntaxError`?", ["Деструктуризация без `const` запрещена", "Нужен `let`", "`obj` должен быть массивом", "Открывающая `{` в начале оператора разбирается как блок"], 3, "Нужны круглые скобки: `({ host, port } = obj);`."),
    open("js.destructuring-spread.e7", "intermediate", "Объясните различие между `??` и значением по умолчанию деструктуризации на примере.", [
      ul(
        "Значение по умолчанию (`{ a = 1 }`) срабатывает только при `undefined`; для `null` не срабатывает.",
        "`??` (`obj.a ?? 1`) срабатывает и для `null`, и для `undefined`.",
        "Пример: `{ volume: null }` → `{ volume = 50 }` даёт `null`, а `volume ?? 50` — `50`.",
        "Для пустых строк и нуля нужно `||` или явная проверка.",
      ),
    ], ["Указан `undefined` против `null`", "Приведён пример", "Упомянуты `||` и пустая строка"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.destructuring-spread.m1", "intermediate", "Что выведет `const [x, y = x * 2, ...tail] = [5]; console.log(x, y, tail);`?", ["`5 NaN []`", "`5 undefined [undefined]`", "`5 10 []`", "Ошибка"], 2, "`y` отсутствует → `x * 2` (`x` уже `5`); rest пуст."),
    mcq("js.destructuring-spread.m2", "advanced", "Чем `const { x: { y } } = { x: undefined }` грозит и как исправить?", ["Ничем: `y` будет `undefined`", "`TypeError: Cannot read properties of undefined (reading 'y')`; исправить `{ x: { y } = {} }`", "`SyntaxError`", "`y` станет `null`"], 1, "Вложенный шаблон деструктурирует `undefined`; значение по умолчанию вложенного уровня решает проблему."),
    mcq("js.destructuring-spread.m3", "advanced", "Что вернёт `setIn(state, [\"a\"], state.a) === state`, если `state.a` уже равно записываемому значению (в нашей реализации)?", ["`true`: ветвь не изменилась, возвращается прежний объект", "`false`: всегда новый объект", "Ошибка", "`undefined`"], 0, "Если новая ветвь совпала со старой (`Object.is`), функция возвращает исходный объект — структурное разделение."),
    open("js.destructuring-spread.m4", "advanced", "Опишите, как вы организуете слияние конфигураций (значения по умолчанию, файл, переменные окружения, аргументы командной строки) безопасно и предсказуемо.", [
      ul(
        "Приоритет: defaults → файл → окружение → аргументы; слияние по уровням функцией, защищённой от `__proto__`/`constructor`/`prototype`.",
        "`undefined` не затирает значения, `null` — осознанное «выключить»; типы значений проверяются схемой.",
        "Результат — новый, глубоко замороженный объект; входные данные не мутируются.",
        "Тесты: порядок приоритетов, вложенные настройки, вредоносный JSON, пустые источники.",
      ),
    ], ["Описан порядок приоритетов", "Описана защита от опасных ключей", "Описана семантика `undefined`/`null`", "Упомянуты тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.destructuring-spread.f1", front: "Значение по умолчанию?", back: "Только для undefined (не null, не 0, не \"\"). Вычисляется лениво." },
    { id: "js.destructuring-spread.f2", front: "Spread объекта копирует?", back: "Собственные перечислимые свойства, поверхностно. Не копирует прототип/неперечислимые; геттеры вычисляет." },
    { id: "js.destructuring-spread.f3", front: "Порядок в {...a, ...b}?", back: "Последний побеждает; пользовательские значения — после defaults. Слияние поверхностное." },
    { id: "js.destructuring-spread.f4", front: "Деструктуризация null?", back: "TypeError: Cannot destructure property 'a' of 'null'. Защита: ?? {} или = {} в параметре." },
    { id: "js.destructuring-spread.f5", front: "Массив — по итератору?", back: "Работает со строками, Set, Map; обычный объект — TypeError not iterable." },
    { id: "js.destructuring-spread.f6", front: "({ a } = obj)?", back: "Присваивание деструктуризацией в начале оператора требует скобок: иначе `{` — блок." },
    { id: "js.destructuring-spread.f7", front: "Структурное разделение?", back: "Копируется только путь изменения; нетронутые ветви сохраняют ссылки; то же значение → тот же объект." },
  ],

  sources: [
    { title: "ECMAScript: Destructuring Assignment", url: "https://tc39.es/ecma262/#sec-destructuring-assignment", publisher: "ECMA" },
    { title: "ECMAScript: Destructuring Binding Patterns", url: "https://tc39.es/ecma262/#sec-destructuring-binding-patterns", publisher: "ECMA" },
    { title: "ECMAScript: Object Initializer (spread)", url: "https://tc39.es/ecma262/#sec-object-initializer", publisher: "ECMA" },
    { title: "MDN: Destructuring", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring", publisher: "MDN" },
    { title: "MDN: Spread syntax (...)", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax", publisher: "MDN" },
    { title: "MDN: Rest parameters", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters", publisher: "MDN" },
    { title: "MDN: Default parameters", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters", publisher: "MDN" },
    { title: "MDN: FormData", url: "https://developer.mozilla.org/en-US/docs/Web/API/FormData", publisher: "MDN" },
    { title: "MDN: Object.fromEntries()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries", publisher: "MDN" },
  ],
};
