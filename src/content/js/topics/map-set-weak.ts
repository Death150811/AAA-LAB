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

export const mapSetWeak: Topic = {
  id: "js.map-set-weak",
  slug: "map-set-weak",
  domain: "js",
  module: "collections",
  title: "Map, Set, WeakMap и WeakSet",
  titleEn: "Map, Set, WeakMap and WeakSet",
  summary:
    "`Map` — словарь с ключами любого типа и порядком вставки, `Set` — множество уникальных значений; оба сравнивают значения как `SameValueZero` (`NaN` равен `NaN`, объекты — по ссылке). `WeakMap` и `WeakSet` держат объекты-ключи «слабо»: запись не мешает сборщику мусора, поэтому такие коллекции нельзя перебрать и нельзя узнать их размер. Тема на замерах в Node.js 22 и Chromium 141 сравнивает `Map` с объектом (ключи `__proto__`, порядок, размер), разбирает операции над множествами (`union`, `intersection`, `difference`), приёмы подсчёта и группировки, приватные данные и кэши на `WeakMap`, показывает через `WeakRef` и сборку мусора, чем слабая коллекция отличается от сильной, и учит строить граф зависимостей с обнаружением циклов.",
  minutes: 70,
  prerequisites: ["js.arrays", "js.objects-properties"],
  tags: ["Map", "Set", "WeakMap", "WeakSet", "WeakRef", "FinalizationRegistry", "SameValueZero", "groupBy", "cache", "garbage collection", "union", "intersection", "graph", "iteration order"],
  keyConcepts: [
    { term: "Map — словарь для любых ключей", text: "Ключом может быть строка, число, объект, функция, `NaN`; порядок — по вставке; `size` — свойство; сравнение — `SameValueZero`: `map.get(NaN)` находит запись, `map.get(-0)` находит запись `0`, а `{ name: \"Аня\" }` не равен другому такому же объекту." },
    { term: "Объект как словарь коварен", text: "У объекта ключи — только строки и символы (`o[user]` стал `'[object Object]'`), числовые ключи упорядочиваются первыми (`['2', '10', 'a']`), а присваивание `o.__proto__ = \"p\"` не создаёт ключа. У `Map` четыре разных ключа остались четырьмя." },
    { term: "Set — уникальные значения", text: "`new Set([3, 1, 2, 3, 1])` — `{3, 1, 2}`; `NaN` встречается один раз, `{}` и `{}` — разные. Операции над множествами есть в стандартной библиотеке: `union`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf` и др." },
    { term: "Weak-коллекции не удерживают ключи", text: "Ключ `WeakMap` — только объект; нельзя перебрать, нет `size`. Замер со сборкой мусора: ключ обычного `Map` остался жив, ключ `WeakMap` — собран." },
    { term: "Выбирайте структуру по задаче", text: "Уникальность и проверка `has` — `Set`; ключ → значение с произвольными ключами и порядком — `Map`; метаданные об объектах без утечек — `WeakMap`; запись с известными полями и JSON — обычный объект." },
  ],
  sections: [
    section("definition", [
      def("`Map`", "Коллекция пар «ключ → значение»: ключи любого типа, порядок вставки, быстрый доступ по ключу. Итерируется парами `[ключ, значение]`.", "Map"),
      def("`Set`", "Коллекция уникальных значений любого типа в порядке вставки; повторное добавление игнорируется.", "Set"),
      def("`SameValueZero`", "Алгоритм сравнения в `Map`, `Set`, `includes`: как `===`, но `NaN` равен `NaN` (и `+0` равен `-0`).", "SameValueZero"),
      def("`WeakMap`", "Словарь, ключи которого — только объекты (или несвязанные символы), удерживаемые «слабо»: если на объект больше нет других ссылок, запись исчезает вместе с ним. Не итерируется, не имеет `size`.", "WeakMap"),
      def("`WeakSet`", "Множество объектов со слабыми ссылками: можно добавить, проверить, удалить; перебрать нельзя.", "WeakSet"),
      def("`WeakRef`", "Объект, хранящий слабую ссылку на другой объект: `deref()` возвращает его или `undefined`, если он собран.", "WeakRef"),
      def("`FinalizationRegistry`", "Реестр, вызывающий функцию-колбэк после сборки зарегистрированного объекта; момент вызова не гарантирован.", "FinalizationRegistry"),
      def("Граф зависимостей", "Структура «узел → его зависимости»; естественно хранится как `Map` имя → `Set` имён и обрабатывается обходом в глубину.", "dependency graph"),
    ]),

    section("why", [
      h("Объекты и массивы — не всегда лучший выбор"),
      p("Подсчёт частот, индекс «идентификатор → запись», уникальные значения, метаданные об DOM-узлах и объектах, кэши — всё это задачи, которые массивы и обычные объекты решают с оговорками (поиск перебором, строковые ключи, наследуемые свойства, утечки памяти). `Map` и `Set` снимают эти оговорки, а `WeakMap`/`WeakSet` — закрывают класс утечек, связанных с «забытыми» записями."),
      ul(
        "**Корректность:** ключи любого типа, отсутствие унаследованных ключей, предсказуемый порядок (по вставке), `NaN` как ключ.",
        "**Выразительность:** `Set` одной строкой убирает повторы; `Map.groupBy` и операции над множествами заменяют десятки строк циклов.",
        "**Память:** `WeakMap` позволяет привязывать данные к объектам, не продлевая им жизнь.",
        "**Алгоритмы:** графы, очереди, кэши, индексы — естественные применения этих структур.",
      ),
      insight("Вопрос выбора коллекции — это вопрос «**по чему я ищу и что хочу гарантировать**». По значению — `Set`. По ключу — `Map`. По порядку и индексу — массив. По объекту, не продлевая ему жизнь, — `WeakMap`."),
    ]),

    section("mental-model", [
      p("**Map — это гардероб с номерками любого вида.** Вы отдаёте вещь и получаете номерок (ключ) — им может быть число, бирка со словом или сама вещь-образец (объект); по номерку вам вернут именно вашу вещь, а гардеробщик помнит, **в каком порядке** вещи принимали. **Set — это список приглашённых:** фамилию можно вписать много раз, но в списке она одна. **WeakMap — это записка, приклеенная к самой вещи:** пока вещь существует, записка есть; вещь выбросили — записка исчезла сама, и гардеробщик не ведёт её учёта (поэтому у него нет ни списка записок, ни числа). Обычный `Map` ведёт учёт вещей **в журнале**, а журнал удерживает вещи от выбрасывания — это и есть утечка."),
      table(
        ["Свойство", "Объект `{}`", "`Map`", "`Set`", "`WeakMap` / `WeakSet`"],
        [
          ["Ключи", "Строки и символы", "Любые значения", "Значения = ключи", "Только объекты (и локальные символы)"],
          ["Порядок", "Целые по возрастанию, затем по добавлению", "По вставке", "По вставке", "Нет (не перебирается)"],
          ["Размер", "`Object.keys(o).length`", "`size`", "`size`", "Нет"],
          ["Унаследованные ключи", "Да (`toString`, `__proto__`)", "Нет", "Нет", "Нет"],
          ["Перебор", "`entries`, `for…in`", "`for…of`, `forEach`", "`for…of`, `forEach`", "Нельзя"],
          ["Сериализация в JSON", "Да", "Нет (даёт `{}`)", "Нет", "Нет"],
          ["Удерживает ключи", "Да", "Да", "Да", "Нет"],
        ],
        "Сравнение структур",
      ),
    ]),

    section("technical", [
      h("Map: ключи, порядок, сравнение с объектом"),
      code("js", `const user = { name: "Аня" };
const fn = () => {};
const map = new Map([
  ["строка", 1],
  [42, "число"],
  [user, "объект как ключ"],
  [fn, "функция как ключ"],
  [NaN, "NaN как ключ"],
]);
console.log(map.size, map.get(user), map.get({ name: "Аня" }), map.get(NaN), map.get(42), map.get("42"));
map.set("строка", 2).set(0, "ноль");
console.log(map.get("строка"), map.get(-0), map.has(fn), map.delete(fn), map.has(fn), map.size);

// порядок вставки, итерация
const m = new Map([["b", 1], ["a", 2]]);
m.set("c", 3);
m.delete("b");
m.set("b", 4);                      // повторно добавленный ключ — в конец
console.log([...m.keys()], [...m.values()], [...m]);
for (const [k, v] of m) process.stdout.write(\`\${k}=\${v} \`);
m.forEach((v, k) => process.stdout.write(\`\${k}:\${v} \`));
console.log();

// сравнение с объектом
const obj = {};
obj[1] = "a"; obj["1"] = "b"; obj[user] = "c"; obj["__proto__"] = "p";
console.log(Object.keys(obj), Object.getPrototypeOf(obj) === Object.prototype);
const viaMap = new Map();
viaMap.set(1, "a").set("1", "b").set(user, "c").set("__proto__", "p");
console.log(viaMap.size, [...viaMap.keys()].map((k) => typeof k));
console.log("toString" in {}, new Map().has("toString"));

// порядок числовых ключей: у объекта — по возрастанию, у Map — по вставке
const o2 = { 10: "x", 2: "y", a: "z" };
const m2 = new Map([[10, "x"], [2, "y"], ["a", "z"]]);
console.log(Object.keys(o2), [...m2.keys()]);

// преобразования
console.log(Object.fromEntries(new Map([["a", 1], ["b", 2]])), new Map(Object.entries({ x: 1, y: 2 })));
console.log(Map.groupBy([1, 2, 3, 4, 5], (n) => (n % 2 ? "нечётные" : "чётные")));

// сериализация и копирование
console.log(JSON.stringify(map), JSON.stringify([...new Map([["a", 1]])]), structuredClone(new Map([["k", { n: 1 }]])));
console.log(typeof map, map instanceof Map, Object.prototype.toString.call(map), map[Symbol.iterator] === map.entries);`, { filename: "m1-map.mjs", lineNumbers: true }),
      code("text", `5 объект как ключ undefined NaN как ключ число undefined
2 ноль true true false 5
[ 'a', 'c', 'b' ] [ 2, 3, 4 ] [ [ 'a', 2 ], [ 'c', 3 ], [ 'b', 4 ] ]
a=2 c=3 b=4 a:2 c:3 b:4 
[ '1', '[object Object]' ] true
4 [ 'number', 'string', 'object', 'string' ]
true false
[ '2', '10', 'a' ] [ 10, 2, 'a' ]
{ a: 1, b: 2 } Map(2) { 'x' => 1, 'y' => 2 }
Map(2) { 'нечётные' => [ 1, 3, 5 ], 'чётные' => [ 2, 4 ] }
{} [["a",1]] Map(1) { 'k' => { n: 1 } }
object true [object Map] true`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Ключи любого типа:** строка, число, объект, функция, `NaN`. `get` находит запись по `SameValueZero`: `map.get(NaN)` — найдено; `map.get({ name: \"Аня\" })` — `undefined` (другой объект); `map.get(\"42\")` — `undefined` (строка ≠ число); `map.get(-0)` находит запись, добавленную как `0`.",
        "**API:** `set` возвращает сам `Map` (можно цеплять), `get`, `has`, `delete` (возвращает `true`/`false`), `size`, `clear`. Повторный `set` заменяет значение без изменения позиции.",
        "**Порядок вставки:** удалённый и добавленный заново ключ `b` оказывается в **конце** (`['a', 'c', 'b']`). Итерируют `for…of` (пары), `keys()`, `values()`, `forEach((v, k) => …)` — обратите внимание на порядок аргументов `forEach`.",
        "**Против объекта:** `o[1]` и `o[\"1\"]` — один ключ; `o[user]` стал ключом `'[object Object]'`; присваивание `o[\"__proto__\"] = \"p\"` строку молча проигнорировало (`Object.keys` — `['1', '[object Object]']`). У `Map` те же четыре записи сохранили типы ключей (`number`, `string`, `object`, `string`), размер — `4`.",
        "**Унаследованные ключи:** `\"toString\" in {}` — `true`, `new Map().has(\"toString\")` — `false`.",
        "**Порядок числовых ключей:** у объекта — `['2', '10', 'a']` (целые по возрастанию), у `Map` — `[10, 2, 'a']` (по вставке).",
        "**Преобразования:** `new Map(Object.entries(obj))` и `Object.fromEntries(map)` (для строковых ключей); `Map.groupBy` группирует элементы и возвращает `Map`.",
        "**JSON и клонирование:** `JSON.stringify(map)` — `{}`, нужно `[...map]`; `structuredClone(map)` копирует и `Map`, и значения.",
      ),
      note("`Map` — не замена объекту везде. Для записей с известным набором полей, которые сериализуются в JSON и читаются как `obj.field`, объект удобнее; `Map` нужен для словарей, где ключи — данные (идентификаторы, слова, объекты)."),

      h("Set: уникальность и операции над множествами"),
      code("js", `const s = new Set([3, 1, 2, 3, 1]);
console.log(s, s.size, s.has(2), s.has("2"), [...s]);
s.add(4).add(1);                                 // повторное добавление игнорируется
s.delete(3);
console.log([...s]);

// равенство как у Map: SameValueZero
const odd = new Set([NaN, NaN, 0, -0, {}, {}, "a", "a"]);
console.log(odd.size, [...odd].length);

// удаление повторов, уникальные символы
const arr = [1, 2, 2, 3, 3, 3];
console.log([...new Set(arr)], new Set("hello").size, [...new Set("hello")].join(""));

// операции над множествами
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5]);
console.log("union:", [...a.union(b)], "intersection:", [...a.intersection(b)], "difference:", [...a.difference(b)], "symmetric:", [...a.symmetricDifference(b)]);
console.log("isSubsetOf:", new Set([3, 4]).isSubsetOf(a), "isSupersetOf:", a.isSupersetOf(new Set([1])), "isDisjointFrom:", a.isDisjointFrom(new Set([9])));

// то же через методы массивов (работает и в старых средах)
console.log([...a].filter((x) => b.has(x)), [...new Set([...a, ...b])]);

// порядок и итерация во время изменения
const live = new Set([1, 2, 3]);
const seen = [];
for (const v of live) {
  seen.push(v);
  if (v === 1) { live.delete(2); live.add(4); }
}
console.log(seen, [...live]);

// Set хранит ссылки на объекты
const o = { id: 1 };
const people = new Set([o]);
people.add({ id: 1 });
console.log(people.size, people.has(o), people.has({ id: 1 }));
console.log(typeof Set.prototype.union, [...s.entries()][0], s.keys === s.values);`, { filename: "m2-set.mjs", lineNumbers: true }),
      code("text", `Set(3) { 3, 1, 2 } 3 true false [ 3, 1, 2 ]
[ 1, 2, 4 ]
5 5
[ 1, 2, 3 ] 4 helo
union: [ 1, 2, 3, 4, 5 ] intersection: [ 3, 4 ] difference: [ 1, 2 ] symmetric: [ 1, 2, 5 ]
isSubsetOf: true isSupersetOf: true isDisjointFrom: true
[ 3, 4 ] [ 1, 2, 3, 4, 5 ]
[ 1, 3, 4 ] [ 1, 3, 4 ]
2 true false
function [ 1, 1 ] true`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Уникальность:** `new Set([3, 1, 2, 3, 1])` — `{3, 1, 2}` (порядок первого появления); `has(\"2\")` — `false` (строка ≠ число). Повторное `add` игнорируется.",
        "**`SameValueZero`:** в `new Set([NaN, NaN, 0, -0, {}, {}, \"a\", \"a\"])` пять элементов: `NaN` один, `0` и `-0` один, два разных объекта, одна строка.",
        "**Приёмы:** `[...new Set(arr)]` — без повторов; `new Set(\"hello\").size` — `4` (уникальные символы).",
        "**Операции над множествами** (Node.js 22, Chromium 141): `union`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf`, `isSupersetOf`, `isDisjointFrom`. До их появления то же писали через `filter` и spread: `[...a].filter((x) => b.has(x))`.",
        "**Изменение во время обхода:** `Set` обходится «вживую»: удалённый элемент `2` не посещён, добавленный `4` — посещён (`[1, 3, 4]`). Лучше не менять коллекцию, по которой идёте.",
        "**Объекты по ссылке:** `people.add({ id: 1 })` добавил второй элемент (`size` — `2`), `has({ id: 1 })` — `false`.",
      ),

      h("WeakMap и WeakSet: данные об объектах без утечек"),
      code("js", `// WeakMap: ключи — только объекты; нельзя перебрать и узнать размер
const wm = new WeakMap();
const key = { id: 1 };
wm.set(key, "данные для key");
console.log(wm.get(key), wm.has(key), wm.has({ id: 1 }), typeof wm.size, typeof wm[Symbol.iterator], typeof wm.keys);
try { wm.set("строка", 1); } catch (e) { console.log(e.name + ": " + e.message); }
try { new WeakSet().add(42); } catch (e) { console.log(e.name + ": " + e.message); }
console.log(wm.delete(key), wm.has(key));

// приватные данные объекта без свойств на самом объекте
const secrets = new WeakMap();
class Session {
  constructor(token) { secrets.set(this, { token }); }
  get masked() { return secrets.get(this).token.slice(0, 2) + "***"; }
}
const s = new Session("abcdef");
console.log(s.masked, Object.keys(s), JSON.stringify(s));

// WeakSet: метка «уже обработано»
const processed = new WeakSet();
const nodes = [{ n: 1 }, { n: 2 }];
nodes.forEach((n) => processed.add(n));
console.log(nodes.map((n) => processed.has(n)), processed.has({ n: 1 }));

// Символ как ключ WeakMap (несвязанный, не зарегистрированный)
const wm2 = new WeakMap();
wm2.set(Symbol("local"), 1);
try { wm2.set(Symbol.for("global"), 1); } catch (e) { console.log(e.name + ": " + e.message); }`, { filename: "m3-weak.mjs", lineNumbers: true }),
      code("text", `данные для key true false undefined undefined undefined
TypeError: Invalid value used as weak map key
TypeError: Invalid value used in weak set
true false
ab*** [] {}
[ true, true ] false
TypeError: Invalid value used as weak map key`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Только объекты:** `wm.set(\"строка\", 1)` — `TypeError: Invalid value used as weak map key`; `new WeakSet().add(42)` — `TypeError: Invalid value used in weak set`. Допускаются и «несвязанные» символы (`Symbol(\"local\")`), но не зарегистрированные (`Symbol.for`).",
        "**Нет перебора и размера:** `typeof wm.size`, `wm[Symbol.iterator]`, `wm.keys` — `undefined`: перебор сделал бы время жизни объектов наблюдаемым.",
        "**Приватные данные:** `secrets.set(this, { token })` хранит данные вне объекта: у `Session` нет собственных ключей (`Object.keys(s)` — `[]`, `JSON.stringify(s)` — `{}`). Сегодня то же чаще делают `#private`-полями (тема о классах), но `WeakMap` нужен для данных о **чужих** объектах (например, DOM-узлах).",
        "**`WeakSet` как пометка:** «этот объект уже обработан» без риска забыть удалить пометку.",
      ),

      h("Сборка мусора: сильная и слабая коллекции"),
      p("Различие между `Map` и `WeakMap` видно только по сборке мусора. Замер ниже запускает Node.js с принудительным `gc()` и использует `WeakRef` только как «щуп»: он не мешает сборке и показывает, жив ли объект. Результат зависит от сборщика мусора, но в этой среде он стабилен."),
      code("js", `import v8 from "node:v8";
import vm from "node:vm";
v8.setFlagsFromString("--expose-gc");
const gc = vm.runInNewContext("gc");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function collect() { await sleep(10); gc(); await sleep(10); gc(); }

// Map удерживает ключ, WeakMap — нет
const strong = new Map();
const weak = new WeakMap();
let refStrong, refWeak;
{
  let a = { big: new Array(1000).fill(0) };
  let b = { big: new Array(1000).fill(0) };
  strong.set(a, "данные");
  weak.set(b, "данные");
  refStrong = new WeakRef(a);          // слабые ссылки — только чтобы посмотреть, жив ли объект
  refWeak = new WeakRef(b);
  a = null; b = null;
}
await collect();
console.log("ключ Map жив после сборки мусора:", refStrong.deref() !== undefined, "| размер Map:", strong.size);
console.log("ключ WeakMap жив после сборки мусора:", refWeak.deref() !== undefined);

// FinalizationRegistry: уведомление после сборки (момент не гарантирован)
const log = [];
const registry = new FinalizationRegistry((label) => log.push(label));
(function () { const tmp = { x: 1 }; registry.register(tmp, "tmp собран"); })();
await collect();
await sleep(20);
console.log("уведомление получено:", log);`, { filename: "m4-gc.mjs", lineNumbers: true }),
      code("text", `ключ Map жив после сборки мусора: true | размер Map: 1
ключ WeakMap жив после сборки мусора: false
уведомление получено: [ 'tmp собран' ]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`Map` удерживает ключ:** после обнуления переменной и сборки мусора ключ жив, `strong.size` — `1`.",
        "**`WeakMap` не удерживает:** ключ собран (`deref()` вернул `undefined`), вместе с ним исчезла запись.",
        "**`FinalizationRegistry`** вызвал колбэк после сборки объекта. В реальном коде полагаться на него нельзя: момент не гарантирован, а в некоторых средах вызова может не быть вовсе. Используйте для вспомогательной очистки, не для логики.",
        "**`WeakRef`** в обычном коде нужен редко: чаще достаточно `WeakMap`.",
      ),
      warn("Не используйте `WeakRef`/`FinalizationRegistry` для управления ресурсами (файлы, соединения): сборка мусора недетерминирована. Закрывайте ресурсы явно (`close()`, `try…finally`)."),

      h("Частые приёмы"),
      code("js", `const text = "to be or not to be that is the question to be or not";
const words = text.split(" ");

// частоты слов
const freq = new Map();
for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);

// топ-3 по убыванию частоты, при равенстве — по алфавиту
const top = [...freq].sort(([wa, ca], [wb, cb]) => cb - ca || wa.localeCompare(wb)).slice(0, 3);
console.log(top);

// уникальные слова в порядке первого появления и слова, встречающиеся один раз
const unique = [...new Set(words)];
const once = [...freq].filter(([, c]) => c === 1).map(([w]) => w);
console.log(unique.length, once);

// группировка слов по длине
const byLength = Map.groupBy(unique, (w) => w.length);
console.log([...byLength].sort(([a], [b]) => a - b));

// пересечение двух текстов
const other = new Set("be quick or be dead".split(" "));
console.log([...new Set(words)].filter((w) => other.has(w)));`, { filename: "x2-frequency.mjs", lineNumbers: true }),
      code("text", `[ [ 'be', 3 ], [ 'to', 3 ], [ 'not', 2 ] ]
8 [ 'that', 'is', 'the', 'question' ]
[
  [ 2, [ 'to', 'be', 'or', 'is' ] ],
  [ 3, [ 'not', 'the' ] ],
  [ 4, [ 'that' ] ],
  [ 8, [ 'question' ] ]
]
[ 'be', 'or' ]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Частоты:** `freq.set(w, (freq.get(w) ?? 0) + 1)`; сортировка пар по убыванию счётчика и по алфавиту при равенстве (`cb - ca || wa.localeCompare(wb)`).",
        "**Уникальные и единичные:** `[...new Set(words)]` и фильтр пар со счётчиком `1`.",
        "**Группировка:** `Map.groupBy(unique, (w) => w.length)` — `Map` длина → слова.",
        "**Пересечение:** `[...new Set(words)].filter((w) => other.has(w))` — `['be', 'or']`.",
      ),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const scores = new Map();                       // словарь: ключ любого типа → значение
scores.set("Аня", 90).set("Борис", 75);         // set возвращает сам Map — можно цеплять вызовы
scores.set("Аня", 95);                          // повторный ключ заменяет значение

const tags = new Set(["js", "css", "js"]);      // множество: повторы отбрасываются
tags.add("html");

console.log(scores.get("Аня"), scores.has("Вера"), scores.size);
console.log(tags.size, tags.has("css"), [...tags]);

for (const [name, score] of scores) console.log(name, score);   // итерация в порядке вставки`,
        [
          { line: [1, 3], text: "`Map`: `set` возвращает сам `Map`, поэтому вызовы можно цеплять; повторный ключ заменяет значение." },
          { line: [5, 6], text: "`Set`: повторное значение (`\"js\"`) отбрасывается; `add` добавляет новое." },
          { line: [8, 9], text: "`get`, `has`, `size` — чтение; `[...tags]` превращает `Set` в массив." },
          { line: 11, text: "`for…of` по `Map` даёт пары `[ключ, значение]`, которые сразу деструктурируются; порядок — по вставке." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Частоты слов</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 34rem; }
  textarea { width: 100%; min-height: 6rem; font: inherit; }
  table { border-collapse: collapse; margin-top: 1rem; }
  th, td { border: 1px solid #8884; padding: .25rem .7rem; text-align: left; }
  td:last-child { text-align: right; }
</style>
<h1>Частоты слов</h1>
<label for="text">Текст:</label>
<textarea id="text">Мама мыла раму. Мама мыла окно, а рама мыла маму? Нет — мама мыла раму!</textarea>
<p id="summary" role="status"></p>
<table>
  <thead><tr><th>Слово</th><th>Раз</th></tr></thead>
  <tbody id="rows"></tbody>
</table>
<script type="module">
  const input = document.querySelector("#text");
  const rows = document.querySelector("#rows");
  const summary = document.querySelector("#summary");

  function analyze(text) {
    const words = text.toLowerCase().match(/[\\p{L}\\p{N}]+/gu) ?? [];   // слова: буквы и цифры любых алфавитов
    const freq = new Map();
    for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);         // Map: слово → число повторов
    const unique = new Set(words);                                      // Set: уникальные слова
    const top = [...freq].sort(([wa, ca], [wb, cb]) => cb - ca || wa.localeCompare(wb, "ru")).slice(0, 5);
    return { total: words.length, unique: unique.size, top };
  }

  function render() {
    const { total, unique, top } = analyze(input.value);
    summary.textContent = \`Слов: \${total}, уникальных: \${unique}\`;
    rows.replaceChildren(
      ...top.map(([word, count]) => {
        const tr = document.createElement("tr");
        tr.append(Object.assign(document.createElement("td"), { textContent: word }));
        tr.append(Object.assign(document.createElement("td"), { textContent: String(count) }));
        return tr;
      }),
    );
  }

  input.addEventListener("input", render);
  render();
</script>`, { filename: "wordcount.html", runnable: true, lineNumbers: true }),
      p("Страница считает слова: `Map` хранит частоты, `Set` — уникальные слова. Регулярное выражение `/[\\p{L}\\p{N}]+/gu` выбирает слова на любом языке. Замер в Chromium 141: для текста по умолчанию — «Слов: 14, уникальных: 8», топ — `мыла=4, мама=3, раму=2, а=1, маму=1`; пустой текст — «Слов: 0, уникальных: 0»; для `a b a 1 1 1 Ёж ёж` — `1=3, ёж=2, a=2, b=1`; ошибок страницы нет."),
    ]),

    section("detailed-example", [
      p("Порядок сборки пакетов: из графа зависимостей `{ имя: [зависимости] }` нужно получить такой порядок, чтобы зависимости собирались раньше зависимых, а циклы обнаруживались с понятным путём. Граф хранится как `Map` имя → `Set` зависимостей; состояние обхода — `Set` обработанных узлов и массив текущего пути (для сообщения о цикле)."),
      code("js", `export class CycleError extends Error {
  constructor(path) {
    super("Циклическая зависимость: " + path.join(" → "));
    this.name = "CycleError";
    this.path = path;
  }
}

// graph: { имя: [зависимости] } → порядок сборки (зависимости раньше зависимых)
export function buildOrder(graph) {
  const deps = new Map(Object.entries(graph).map(([name, list]) => [name, new Set(list)]));
  for (const [name, list] of deps) {
    for (const dep of list) {
      if (!deps.has(dep)) throw new ReferenceError(\`Неизвестная зависимость «\${dep}» у «\${name}»\`);
    }
  }

  const order = [];
  const done = new Set();       // полностью обработанные
  const visiting = [];          // текущий путь DFS — для сообщения о цикле

  function visit(name) {
    if (done.has(name)) return;
    const at = visiting.indexOf(name);
    if (at !== -1) throw new CycleError([...visiting.slice(at), name]);
    visiting.push(name);
    for (const dep of deps.get(name)) visit(dep);
    visiting.pop();
    done.add(name);
    order.push(name);
  }

  for (const name of deps.keys()) visit(name);
  return order;
}

// Кто зависит от каждого пакета: Map имя → Set зависимых
export function dependents(graph) {
  const result = new Map(Object.keys(graph).map((name) => [name, new Set()]));
  for (const [name, list] of Object.entries(graph)) {
    for (const dep of list) result.get(dep)?.add(name);
  }
  return result;
}`, { filename: "deps.mjs", lineNumbers: true }),
      code("js", `import { buildOrder, dependents, CycleError } from "./deps.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);
const errorOf = (fn) => { try { fn(); return "без ошибки"; } catch (e) { return [e.name, e.message]; } };

const graph = { app: ["ui", "api"], ui: ["core"], api: ["core", "db"], db: [], core: [] };
const order = buildOrder(graph);
check("порядок: зависимости раньше зависимых", order, ["core", "ui", "db", "api", "app"]);
check("каждый пакет ровно один раз", [order.length, new Set(order).size], [5, 5]);
const pos = new Map(order.map((n, i) => [n, i]));
check("для каждого ребра зависимость стоит раньше", Object.entries(graph).every(([n, ds]) => ds.every((d) => pos.get(d) < pos.get(n))), true);

check("повторы зависимостей не мешают", buildOrder({ a: ["b", "b"], b: [] }), ["b", "a"]);
check("пустой граф", buildOrder({}), []);
check("несвязные пакеты", buildOrder({ x: [], y: [] }), ["x", "y"]);

check("цикл из трёх", errorOf(() => buildOrder({ a: ["b"], b: ["c"], c: ["a"] })), ["CycleError", "Циклическая зависимость: a → b → c → a"]);
check("цикл в глубине, путь без лишнего хвоста", errorOf(() => buildOrder({ root: ["x"], x: ["y"], y: ["z"], z: ["y"] })), ["CycleError", "Циклическая зависимость: y → z → y"]);
check("самозависимость", errorOf(() => buildOrder({ a: ["a"] })), ["CycleError", "Циклическая зависимость: a → a"]);
check("неизвестная зависимость", errorOf(() => buildOrder({ a: ["ghost"] })), ["ReferenceError", "Неизвестная зависимость «ghost» у «a»"]);
check("CycleError — наследник Error с path", (() => { try { buildOrder({ a: ["a"] }); } catch (e) { return [e instanceof Error, e instanceof CycleError, e.path]; } })(), [true, true, ["a", "a"]]);

const rev = dependents(graph);
check("кто зависит от core", [...rev.get("core")], ["ui", "api"]);
check("от app никто не зависит", rev.get("app").size, 0);
check("граф не изменён", Object.keys(graph), ["app", "ui", "api", "db", "core"]);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "deps-test.mjs", collapsed: true }),
      code("text", `Все 14 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Решение", "Что даёт", "Почему так"],
        [
          ["`new Map(Object.entries(graph).map(([n, l]) => [n, new Set(l)]))`", "Граф как `Map` имя → `Set` зависимостей", "Повторяющиеся зависимости схлопываются (`a: [\"b\", \"b\"]`), проверка `has` — без перебора"],
          ["Проверка неизвестных зависимостей до обхода", "`ReferenceError` с понятным сообщением", "Отдельная ошибка отличает «нет такого пакета» от цикла"],
          ["`done` (`Set`) и `visiting` (массив)", "Двухуровневое состояние DFS", "`done` — узлы, зависимости которых уже в `order`; `visiting` — текущий путь: если узел снова встретился в нём, найден цикл"],
          ["`visiting.slice(at)` + `name`", "Путь цикла без «хвоста»", "В тесте цикл `y → z → y` не включает `root` и `x`, которые к нему лишь ведут"],
          ["`order.push(name)` после обхода зависимостей", "Обратный порядок завершения = топологический", "Узел попадает в результат, когда все его зависимости уже там"],
          ["`class CycleError extends Error` с `path`", "Типизированная ошибка с данными", "Вызывающий код может показать путь (`e.path`) и отличить цикл от других ошибок"],
          ["`dependents` через `result.get(dep)?.add(name)`", "Обратный индекс «кто зависит от меня»", "Построен за один проход; `?.` не падает, если зависимость неизвестна"],
        ],
        "Разбор buildOrder",
      ),
      ul(
        "Все 14 проверок проходят: порядок, отсутствие повторов, соблюдение каждого ребра, дубликаты зависимостей, пустой и несвязный граф, три вида циклов (в том числе самозависимость и цикл вдали от корня), неизвестная зависимость, `instanceof`, обратный индекс, неизменность входа.",
        "Сложность обхода — O(V + E): каждый узел и ребро обрабатываются один раз; проверки принадлежности в `Set` — O(1) в среднем.",
      ),
    ]),

    section("internals", [
      h("`SameValueZero` и хеширование"),
      p("`Map` и `Set` определяют равенство ключей как `SameValueZero`: примитивы сравниваются по значению (`NaN` равен `NaN`, `0` равен `-0`), объекты — по ссылке. Спецификация требует, чтобы время доступа росло «в среднем меньше линейного» (в реализациях — хеш-таблицы), поэтому `has` на `Set` и `get` на `Map` быстрее, чем `includes`/`find` по массиву. Точные цифры зависят от размера данных и движка — измеряйте на своих данных, а не принимайте на веру."),
      h("Порядок обхода"),
      p("Спецификация закрепляет порядок вставки для `Map` и `Set`; повторное добавление существующего ключа позицию не меняет, а удаление и повторное добавление — переносит в конец (замер: `b`). Обход «живой»: элементы, добавленные во время `for…of`, будут посещены, удалённые до посещения — нет (замер для `Set`)."),
      h("Слабые ссылки и сборка мусора"),
      p("Обычные коллекции хранят **сильные** ссылки: пока в `Map` есть ключ-объект, объект достижим и не собирается. `WeakMap` хранит **эфемероны**: значение достижимо только пока достижим ключ. Если ключ больше нигде не упоминается, запись можно удалить вместе со значением. Поэтому перебор невозможен — результат зависел бы от момента сборки мусора."),
      h("Почему ключи WeakMap — только объекты"),
      p("Примитив (число, строка) нельзя «собрать»: он не имеет идентичности — два одинаковых числа неразличимы. У слабой ссылки есть смысл только для сущностей с идентичностью — объектов (и «несвязанных» символов, у которых идентичность есть, в отличие от глобальных `Symbol.for`)."),
      h("Модель памяти и утечки"),
      p("Классическая утечка: глобальный `Map` «объект → данные» без удаления записей. Объекты никогда не собираются, пока запись жива. Решения: `WeakMap`, явное удаление при завершении жизни объекта, ограничение размера кэша (LRU). Подробно — в теме «Память и сборка мусора»."),
      h("`FinalizationRegistry` и недетерминизм"),
      p("Колбэк реестра вызывается **после** сборки и не обязан вызываться вообще (например, при завершении программы). Спецификация прямо не рекомендует строить на нём корректность программы. Практические применения — вспомогательные кэши и диагностика."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Использовать объект как словарь с произвольными ключами"),
      wrongRight(
        "js",
        {
          code: `
            const counts = {};
            for (const word of words) counts[word] = (counts[word] ?? 0) + 1;   // слово "constructor", "__proto__"…
          `,
          note: "Ключи-строки из пользовательских данных пересекаются с унаследованными (`constructor`, `toString`) и `__proto__` (замер: присваивание `__proto__` проигнорировано).",
        },
        {
          code: `
            const counts = new Map();
            for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
          `,
          note: "`Map` не имеет унаследованных ключей и хранит любые ключи как есть.",
        },
      ),
      h("Ошибка 2. Ждать, что объекты-ключи сравниваются по содержимому"),
      p("`map.get({ name: \"Аня\" })` — `undefined`; `set.has({ id: 1 })` — `false` (замер). Нужна ссылка на тот же объект или составной строковый ключ (`\"1:2\"`)."),
      h("Ошибка 3. Сериализовать `Map` или `Set` через `JSON.stringify`"),
      p("`JSON.stringify(map)` — `{}`. Преобразуйте: `JSON.stringify([...map])` или `Object.fromEntries(map)` (для строковых ключей)."),
      h("Ошибка 4. Глобальный `Map` как кэш без вытеснения"),
      p("Объекты-ключи никогда не собираются (замер: ключ `Map` остался живым после `gc()`). Используйте `WeakMap` для данных «по объекту» или ограничивайте размер."),
      h("Ошибка 5. Пытаться перебрать `WeakMap`"),
      p("`wm.size`, `wm.keys()`, `for…of` недоступны (`undefined`, замер). Если нужен перебор — вам нужен обычный `Map` и ручное управление жизнью записей."),
      h("Ошибка 6. Класть примитивы в `WeakMap`/`WeakSet`"),
      p("`TypeError: Invalid value used as weak map key` (замер). Ключи — только объекты."),
      h("Ошибка 7. Менять `Set`/`Map` во время обхода"),
      p("`Set` обходится вживую: удалённый элемент пропущен, добавленный посещён (замер: `[1, 3, 4]`). Стройте новую коллекцию или обходите копию (`[...set]`)."),
      h("Ошибка 8. Полагаться на `FinalizationRegistry`"),
      p("Момент вызова колбэка не гарантирован. Не используйте его для освобождения критичных ресурсов."),
    ]),

    section("antipatterns", [
      ul(
        "**`Map` вместо массива, когда нужна только последовательность;** `Set` вместо массива, когда нужен индекс или дубликаты.",
        "**`array.includes` внутри цикла по большим данным** вместо `Set`: квадратичная сложность.",
        "**`new Map()` на каждый вызов «горячей» функции,** хотя можно один раз построить индекс.",
        "**Хранение в `Map` сериализуемых данных без плана сериализации.**",
        "**Склейка составных ключей строками** (`a + \"-\" + b`) без экранирования, где возможна неоднозначность.",
        "**Глобальные `Map`/`Set` как скрытое общее состояние.**",
        "**Использование `WeakMap` ради «автоматической очистки» там, где ключи — строки** (не получится — используйте `Map` с политикой вытеснения).",
        "**Расчёт на порядок элементов `WeakSet`/`WeakMap`:** его нет.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Выбирайте структуру по операции:** принадлежность — `Set`; ключ → значение — `Map`; метаданные по объекту — `WeakMap`.",
        "**Превращайте массив в `Map`/`Set` один раз,** если по нему много поисков (`new Map(items.map((i) => [i.id, i]))`).",
        "**Используйте `Map.groupBy` и методы множеств** вместо ручных циклов в современных средах (с запасным вариантом при необходимости).",
        "**Для словарей, чьи ключи приходят извне, используйте `Map`** (или `Object.create(null)`).",
        "**Сериализуйте явно:** `[...map]`, `Object.fromEntries`, `JSON.stringify` с преобразованием.",
        "**Кэши по объектам — `WeakMap`,** кэши по значениям — `Map` с ограничением размера (LRU).",
        "**Разрывайте цикл `Map` → объект явным `delete`** при завершении жизни записи.",
        "**Тестируйте граничные случаи:** `NaN`, `-0`, объекты-близнецы, пустые коллекции.",
      ),
      tip("Чтобы понять, что хранит `Map` или `Set`, выведите его в консоль: DevTools показывает размер и содержимое; для `WeakMap` содержимое увидеть можно только в панели «Memory» или в отладчике."),
    ]),

    section("edge-cases", [
      h("`-0` и `+0`"),
      p("В `Map` и `Set` `0` и `-0` — один ключ (замер: `map.get(-0)` нашла запись, добавленную как `0`); при вставке `-0` приводится к `+0`."),
      h("Ключи-объекты и мутации"),
      p("Если изменить объект-ключ, он остаётся тем же ключом: идентичность важнее содержимого. Это удобно для «метаданных по объекту» и опасно, если вы ожидали сравнение по значению."),
      h("Клонирование и копирование"),
      p("`new Map(old)` и `new Set(old)` — поверхностная копия; `structuredClone` копирует глубоко (значения-объекты тоже, замер: `Map(1) { 'k' => { n: 1 } }`)."),
      h("Упорядочение и сортировка"),
      p("У `Map` и `Set` нет метода `sort`: преобразуйте в массив, отсортируйте и постройте коллекцию заново (`new Map([...m].sort(…))`)."),
      h("`Map.groupBy` и `Object.groupBy`"),
      p("`Map.groupBy` допускает любые ключи, `Object.groupBy` возвращает объект без прототипа со строковыми ключами (замер: `[Object: null prototype]`)."),
      h("Символы как ключи слабых коллекций"),
      p("Допустимы «несвязанные» символы (`Symbol(\"local\")`); зарегистрированные (`Symbol.for`) — `TypeError` (замер): они живут вечно и их нельзя «собрать»."),
    ]),

    section("related", [
      ul(
        "[Массивы](/learn/js/arrays) — упорядоченные списки, `Array.from`, `includes`.",
        "[Объекты и свойства](/learn/js/objects-properties) — объект как словарь, `__proto__`, `structuredClone`.",
        "[Замыкания](/learn/js/closures) — память, кэши и мемоизация.",
        "[Классы](/learn/js/classes) — приватные поля как альтернатива `WeakMap`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Массив вместо множества, объект вместо словаря",
          code: `
            const seen = [];
            const counts = {};
            for (const w of words) {
              if (!seen.includes(w)) seen.push(w);        // O(n) на каждую проверку
              counts[w] = (counts[w] || 0) + 1;           // конфликт с constructor, __proto__
            }
          `,
          note: "Квадратичный поиск и опасный словарь; ключи принудительно превращаются в строки.",
        },
        {
          title: "Set и Map",
          code: `
            const seen = new Set(words);
            const counts = new Map();
            for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
          `,
          note: "Уникальные слова — одной строкой; словарь без унаследованных ключей; доступ по ключу без перебора.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.map-set-weak.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код, скажите, что напечатает каждая строка, и объясните, как `Map`, `Set` и объект сравнивают ключи."),
        code("js", `const k = { id: 1 };
const m = new Map([[k, "a"], [{ id: 1 }, "b"], [NaN, "c"], [0, "d"]]);
console.log(m.size, m.get(k), m.get({ id: 1 }), m.get(NaN), m.get(-0));

const s = new Set("мама мыла раму");
console.log(s.size, [...s].join(""));

const o = {};
o[k] = 1;
o[{ id: 2 }] = 2;
console.log(Object.keys(o), new Map([[k, 1], [{ id: 2 }, 2]]).size);

const wm = new WeakMap();
try { wm.set("key", 1); } catch (e) { console.log(e.name); }
console.log(typeof wm.size, [...new Set([3, 1, 3, 2, 1])]);`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Какое равенство использует `Map`: строгое или `SameValueZero`?", "Во что превращается объект как ключ обычного объекта?"],
      checks: ["Объяснён размер `Map` из четырёх записей", "Объяснён `Set` строки", "Объяснён `'[object Object]'`", "Объяснён `TypeError` и `undefined`"],
      solution: [
        code("text", `4 a undefined c d
7 ма ылру
[ '[object Object]' ] 2
TypeError
undefined [ 3, 1, 2 ]`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "`Map` из четырёх записей: два разных объекта, `NaN` и `0`; `get(k)` — `a` (та же ссылка), `get({ id: 1 })` — `undefined` (другой объект), `get(NaN)` — `c` (`SameValueZero`), `get(-0)` — `d` (`0` и `-0` равны).",
          "`new Set(\"мама мыла раму\")` — уникальные символы строки: `м, а, ' ', ы, л, р, у` — семь, склеенные `ма ылру`.",
          "Для обычного объекта любой объект-ключ превращается в строку `'[object Object]'` — два разных ключа слились в один (`['[object Object]']`), а `Map` хранит оба (`2`).",
          "`WeakMap` принимает только объекты (`TypeError`), у него нет `size` (`undefined`); `[...new Set([3, 1, 3, 2, 1])]` — `[3, 1, 2]`.",
        ),
      ],
    }),
    exercise({
      id: "js.map-set-weak.ex2",
      title: "Частоты, группы и пересечения",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Для текста подсчитайте частоты слов (`Map`), выведите три самых частых (при равенстве — по алфавиту), найдите слова, встречающиеся один раз, сгруппируйте уникальные слова по длине и найдите пересечение со вторым текстом."),
      ],
      hints: ["Как увеличить счётчик, если ключа ещё нет?", "Как сортировать пары `[слово, число]` по двум критериям?"],
      checks: ["Частоты верны", "Топ-3 с учётом алфавита", "Группы по длине", "Пересечение через `Set`"],
      solution: [
        code("js", `const text = "to be or not to be that is the question to be or not";
const words = text.split(" ");

// частоты слов
const freq = new Map();
for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);

// топ-3 по убыванию частоты, при равенстве — по алфавиту
const top = [...freq].sort(([wa, ca], [wb, cb]) => cb - ca || wa.localeCompare(wb)).slice(0, 3);
console.log(top);

// уникальные слова в порядке первого появления и слова, встречающиеся один раз
const unique = [...new Set(words)];
const once = [...freq].filter(([, c]) => c === 1).map(([w]) => w);
console.log(unique.length, once);

// группировка слов по длине
const byLength = Map.groupBy(unique, (w) => w.length);
console.log([...byLength].sort(([a], [b]) => a - b));

// пересечение двух текстов
const other = new Set("be quick or be dead".split(" "));
console.log([...new Set(words)].filter((w) => other.has(w)));`, { filename: "x2-frequency.mjs" }),
        code("text", `[ [ 'be', 3 ], [ 'to', 3 ], [ 'not', 2 ] ]
8 [ 'that', 'is', 'the', 'question' ]
[
  [ 2, [ 'to', 'be', 'or', 'is' ] ],
  [ 3, [ 'not', 'the' ] ],
  [ 4, [ 'that' ] ],
  [ 8, [ 'question' ] ]
]
[ 'be', 'or' ]`, { filename: "вывод Node.js 22.22.0" }),
        p("Счётчик — `(freq.get(w) ?? 0) + 1`; сортировка по убыванию счётчика и по алфавиту при равенстве: `cb - ca || wa.localeCompare(wb)`; группы — `Map.groupBy`; пересечение — `filter` с `has` по `Set` (O(1) на проверку)."),
      ],
    }),
    exercise({
      id: "js.map-set-weak.ex3",
      title: "Кэш по объекту без утечек",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Реализуйте `memoizeByObject(fn)`: кэш результата вычисления для объекта-аргумента, не продлевающий жизнь объектов, со счётчиками попаданий. Проверьте, что: результат берётся из кэша, равный по содержимому, но другой объект в кэш не попадает, не-объект даёт `TypeError`, а после обнуления ссылки объект собирается сборщиком мусора."),
      ],
      hints: ["Какую структуру выбрать для ключей-объектов без утечек?", "Как проверить сборку объекта, не удерживая его?"],
      checks: ["Используется `WeakMap`", "Не-объект — `TypeError`", "Объект собирается (проверка через `WeakRef` и `gc()`)"],
      solution: [
        code("js", `// Кэш результатов по объекту: запись исчезает вместе с объектом
export function memoizeByObject(fn) {
  const cache = new WeakMap();
  const stats = { hits: 0, misses: 0 };
  function memoized(obj) {
    if (obj === null || (typeof obj !== "object" && typeof obj !== "function")) {
      throw new TypeError("Ключом кэша может быть только объект");
    }
    if (cache.has(obj)) { stats.hits++; return cache.get(obj); }
    stats.misses++;
    const value = fn(obj);
    cache.set(obj, value);
    return value;
  }
  memoized.stats = stats;
  return memoized;
}`, { filename: "memoize-weak.mjs" }),
        code("js", `import v8 from "node:v8";
import vm from "node:vm";
import { memoizeByObject } from "./memoize-weak.mjs";

v8.setFlagsFromString("--expose-gc");
const gc = vm.runInNewContext("gc");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);

let heavyCalls = 0;
const total = memoizeByObject((cart) => { heavyCalls++; return cart.items.reduce((s, i) => s + i.price * i.qty, 0); });

const cart = { items: [{ price: 10, qty: 2 }, { price: 5, qty: 1 }] };
check("первое вычисление", total(cart), 25);
check("повторное — из кэша", [total(cart), heavyCalls, total.stats], [25, 1, { hits: 1, misses: 1 }]);
const other = { items: [{ price: 1, qty: 1 }] };
check("другой объект — отдельная запись", [total(other), heavyCalls], [1, 2]);
check("равный по содержимому, но другой объект — не попадает в кэш", [total({ items: cart.items }), heavyCalls], [25, 3]);

let err = "нет";
try { total("строка"); } catch (e) { err = e.name; }
check("не объект — TypeError", err, "TypeError");

// запись не удерживает объект: он собирается сборщиком мусора
let ref;
(function () {
  const temp = { items: [{ price: 2, qty: 2 }] };
  total(temp);
  ref = new WeakRef(temp);
})();
await sleep(10); gc(); await sleep(10); gc();
check("объект собран, хотя был ключом кэша", ref.deref(), undefined);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "memoize-weak-test.mjs", collapsed: true }),
        code("text", `Все 6 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
        p("`WeakMap` не удерживает ключи: после выхода объекта из области видимости и сборки мусора `WeakRef.deref()` вернул `undefined`. Проверка типа в начале функции даёт понятный `TypeError`: без неё ошибка пришла бы случайно (из `fn` или из `WeakMap.prototype.set`), а `WeakMap.prototype.has` для не-объекта молча вернул бы `false`."),
      ],
    }),
  ],

  challenge: {
    id: "js.map-set-weak.challenge",
    title: "Порядок сборки и обнаружение циклов",
    scenario: [
      p("Менеджер пакетов должен собирать зависимости раньше зависимых и сообщать о циклах с понятным путём. Реализуйте модуль `deps.mjs`: `buildOrder(graph)`, `dependents(graph)` и класс `CycleError`."),
    ],
    requirements: [
      "`graph` — объект `{ имя: [зависимости] }`; `buildOrder` возвращает массив имён, где зависимости стоят раньше зависимых, каждый пакет — один раз",
      "Цикл — `CycleError` (наследник `Error`) с полем `path` и сообщением `Циклическая зависимость: a → b → c → a`; путь не включает узлы, лишь ведущие к циклу",
      "Неизвестная зависимость — `ReferenceError` с сообщением `Неизвестная зависимость «x» у «a»`",
      "`dependents(graph)` — `Map` имя → `Set` пакетов, которые от него зависят",
      "Входной граф не изменяется; повторы в списке зависимостей не мешают",
    ],
    constraints: [
      "Использовать `Map` и `Set` (без `indexOf`/`includes` для проверок принадлежности узлов)",
      "Без внешних библиотек",
    ],
    acceptance: [
      "Все 14 проверок из теста проходят",
      "Самозависимость `{ a: [\"a\"] }` — `CycleError` с путём `a → a`",
      "Результат детерминирован: порядок обхода — порядок ключей и зависимостей",
    ],
    hints: [
      "Какие два состояния узла нужны при обходе в глубину?",
      "Когда добавлять узел в результат: до обхода зависимостей или после?",
      "Как собрать путь цикла без лишнего начала?",
    ],
    solution: [
      code("js", `export class CycleError extends Error {
  constructor(path) {
    super("Циклическая зависимость: " + path.join(" → "));
    this.name = "CycleError";
    this.path = path;
  }
}

// graph: { имя: [зависимости] } → порядок сборки (зависимости раньше зависимых)
export function buildOrder(graph) {
  const deps = new Map(Object.entries(graph).map(([name, list]) => [name, new Set(list)]));
  for (const [name, list] of deps) {
    for (const dep of list) {
      if (!deps.has(dep)) throw new ReferenceError(\`Неизвестная зависимость «\${dep}» у «\${name}»\`);
    }
  }

  const order = [];
  const done = new Set();       // полностью обработанные
  const visiting = [];          // текущий путь DFS — для сообщения о цикле

  function visit(name) {
    if (done.has(name)) return;
    const at = visiting.indexOf(name);
    if (at !== -1) throw new CycleError([...visiting.slice(at), name]);
    visiting.push(name);
    for (const dep of deps.get(name)) visit(dep);
    visiting.pop();
    done.add(name);
    order.push(name);
  }

  for (const name of deps.keys()) visit(name);
  return order;
}

// Кто зависит от каждого пакета: Map имя → Set зависимых
export function dependents(graph) {
  const result = new Map(Object.keys(graph).map((name) => [name, new Set()]));
  for (const [name, list] of Object.entries(graph)) {
    for (const dep of list) result.get(dep)?.add(name);
  }
  return result;
}`, { filename: "deps.mjs", lineNumbers: true }),
      code("text", `Все 14 проверок пройдены`, { filename: "результат запуска тестов" }),
      p("Узел попадает в `order` после того, как обработаны все его зависимости. Цикл обнаруживается, если узел уже есть в текущем пути (`visiting`): путь цикла — срез от первого вхождения плюс сам узел."),
    ],
  },

  interview: [
    iq("js.map-set-weak.i1", "basic", "Чем `Map` отличается от обычного объекта?", [
      ul(
        "Ключи любого типа (у объекта — строки и символы), порядок вставки, `size`, нет унаследованных ключей.",
        "Перебор через `for…of`/`forEach`; сериализация в JSON — явная (`[...map]`).",
        "Объект удобен для записей с известными полями; `Map` — для словарей с динамическими ключами.",
      ),
    ]),
    iq("js.map-set-weak.i2", "basic", "Как убрать повторы из массива?", [
      ul(
        "`[...new Set(arr)]` — сохраняет порядок первого появления.",
        "Для объектов — по ключу: `Map` по идентификатору или `Set` увиденных ключей и `filter`.",
        "`indexOf`/`includes` внутри `filter` — O(n²), для больших данных не подходит.",
      ),
    ]),
    iq("js.map-set-weak.i3", "intermediate", "Как `Map` и `Set` сравнивают ключи?", [
      ul(
        "Алгоритм `SameValueZero`: как `===`, но `NaN` равен `NaN` (и `0` равен `-0`).",
        "Объекты — по ссылке: два разных объекта `{ id: 1 }` — разные ключи.",
        "Строка и число различаются: `get(\"42\")` и `get(42)` — разные записи.",
      ),
    ]),
    iq("js.map-set-weak.i4", "intermediate", "Что такое `WeakMap` и зачем он нужен?", [
      ul(
        "Словарь с ключами-объектами, которые не удерживаются: когда на объект нет других ссылок, запись исчезает.",
        "Нельзя перебрать и узнать размер; ключи — только объекты.",
        "Применение: метаданные и кэши по объекту (в том числе по DOM-узлам) без утечек памяти, приватные данные.",
      ),
    ]),
    iq("js.map-set-weak.i5", "intermediate", "Как реализовать пересечение, объединение и разность множеств?", [
      ul(
        "Современные: `a.intersection(b)`, `a.union(b)`, `a.difference(b)`, `a.symmetricDifference(b)`.",
        "Универсально: `[...a].filter((x) => b.has(x))`, `new Set([...a, ...b])`, `[...a].filter((x) => !b.has(x))`.",
        "Проверка поддержки: `typeof Set.prototype.union === \"function\"`.",
      ),
    ]),
    iq("js.map-set-weak.i6", "advanced", "Утечка памяти через `Map`: как возникает и как исправить?", [
      ul(
        "Глобальный `Map` «объект → данные» удерживает ключи: объекты не собираются, пока запись есть (замер).",
        "Исправления: `WeakMap`, явное `delete` при завершении жизни, ограничение размера (LRU).",
        "Диагностика: снимки кучи в DevTools, поиск путей удерживания (`Map`/`Set` в retainers).",
      ),
    ]),
    iq("js.map-set-weak.i7", "engineering", "Как обнаружить циклы в графе зависимостей?", [
      ul(
        "Обход в глубину с состоянием узла: «в текущем пути» и «обработан».",
        "Если встречен узел из текущего пути — цикл; путь — срез от его первого вхождения.",
        "Топологический порядок — порядок завершения обхода (зависимости раньше зависимых).",
        "Сложность O(V + E); граф — `Map` имя → `Set` зависимостей.",
      ),
    ]),
    iq("js.map-set-weak.i8", "debugging", "`JSON.stringify(map)` даёт `{}`, а `map.get(key)` не находит запись с таким же объектом. Что происходит?", [
      ul(
        "`Map` не сериализуется автоматически: нужно `[...map]` или `Object.fromEntries`.",
        "Ключ-объект сравнивается по ссылке: другой объект с тем же содержимым — другой ключ.",
        "Решение: хранить ссылку на исходный объект, использовать идентификатор (число/строка) как ключ, или составной ключ.",
      ),
    ]),
  ],

  exam: [
    mcq("js.map-set-weak.e1", "foundation", "Что вернёт `new Set([1, 1, 2]).size`?", ["`3`", "`1`", "`2`", "`undefined`"], 2, "`Set` отбрасывает повторы: остаются `1` и `2`."),
    mcq("js.map-set-weak.e2", "foundation", "Какой тип ключей допустим в `Map`?", ["Любые значения", "Строки и символы", "Только строки", "Только объекты"], 0, "Ключом `Map` может быть значение любого типа (замер: строка, число, объект, функция, `NaN`)."),
    mcq("js.map-set-weak.e3", "intermediate", "Что вернёт `new Map([[NaN, 1]]).get(NaN)`?", ["`undefined`", "`null`", "`NaN`", "`1`"], 3, "`Map` использует `SameValueZero`, где `NaN` равен `NaN`."),
    mcq("js.map-set-weak.e4", "intermediate", "Что вернёт `new Map([[{ a: 1 }, \"x\"]]).get({ a: 1 })`?", ["`\"x\"`", "`undefined`", "`{ a: 1 }`", "Ошибка"], 1, "Объекты сравниваются по ссылке: второй литерал — другой объект."),
    mcq("js.map-set-weak.e5", "intermediate", "Какие утверждения верны для `WeakMap`? Выберите все.", ["Ключи — только объекты", "Есть свойство `size`", "Записи не мешают сборке мусора", "Можно перебрать через `for…of`"], [0, 2], "У `WeakMap` нет `size` и перебора; ключи — объекты, удерживаемые слабо."),
    mcq("js.map-set-weak.e6", "advanced", "Почему у `WeakMap` нет метода `keys()`?", ["Он ещё не реализован", "Из-за `SameValueZero`", "Ключи — примитивы", "Перебор сделал бы время жизни объектов наблюдаемым и зависящим от сборщика мусора"], 3, "Содержимое слабой коллекции зависит от момента сборки мусора, поэтому спецификация не даёт его перебрать."),
    open("js.map-set-weak.e7", "intermediate", "Когда вы выберете `Map`, `Set`, объект и `WeakMap`? Приведите по примеру.", [
      ul(
        "`Set` — уникальные идентификаторы, проверка `has` (например, уже просмотренные страницы).",
        "`Map` — словарь с динамическими ключами и порядком (частоты слов, индекс по `id`).",
        "Объект — запись с известными полями и JSON (`{ name, age }`).",
        "`WeakMap` — метаданные по чужим объектам без утечек (кэш вычислений по DOM-узлу).",
      ),
    ], ["Назван пример для каждой структуры", "Обоснован выбор", "Упомянута утечка памяти"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.map-set-weak.m1", "intermediate", "Что вернёт `[...new Set(\"hello\")].join(\"\")`?", ["`hello`", "`olleh`", "`helo`", "`hlo`"], 2, "Повторяющаяся `l` отбрасывается; порядок первого появления сохраняется."),
    mcq("js.map-set-weak.m2", "advanced", "Что произойдёт с ключом обычного `Map`, если в остальном коде на объект больше нет ссылок?", ["Он будет собран сборщиком мусора", "Он останется в памяти, пока запись есть в `Map` (замер)", "Запись автоматически удалится", "Бросится `TypeError`"], 1, "`Map` хранит сильные ссылки: в замере ключ остался жив после `gc()`."),
    mcq("js.map-set-weak.m3", "advanced", "Почему `[...visiting.slice(at), name]` даёт путь цикла без лишнего начала?", ["`at` — позиция первого вхождения повторного узла в текущем пути", "`slice` отбрасывает последний элемент", "`name` всегда первый в пути", "`visiting` содержит только цикл"], 0, "Срез от первого вхождения узла плюс сам узел — замкнутый путь; узлы до цикла (ведущие к нему) отбрасываются."),
    open("js.map-set-weak.m4", "advanced", "Спроектируйте кэш ответов API для приложения с тысячами сущностей: ключи, вытеснение, инвалидация, память и тестируемость.", [
      ul(
        "Ключ — нормализованный запрос (метод + путь + параметры, в строковом виде); хранилище — `Map` (порядок вставки удобен для LRU).",
        "Вытеснение: ограничение размера и/или времени жизни; при обращении запись перемещается в конец (`delete` + `set`), при переполнении удаляется первая.",
        "Инвалидация: по тегам (`Map` тег → `Set` ключей) и по событиям изменения; единая точка обновления.",
        "Данные, привязанные к объектам (DOM-узлам, моделям), — отдельный `WeakMap`, чтобы не удерживать их.",
        "Тестируемость: часы и размер передаются зависимостями; тесты на вытеснение, истечение, параллельные запросы к одному ключу.",
      ),
    ], ["Описан ключ", "Описано вытеснение", "Описана инвалидация", "Различены `Map` и `WeakMap`"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.map-set-weak.f1", front: "Map против объекта?", back: "Ключи любого типа, порядок вставки, size, нет унаследованных ключей; JSON — через [...map]." },
    { id: "js.map-set-weak.f2", front: "SameValueZero?", back: "Как ===, но NaN равен NaN (и 0 равен -0). Так сравнивают Map, Set, includes. Объекты — по ссылке." },
    { id: "js.map-set-weak.f3", front: "Set?", back: "Уникальные значения в порядке вставки. [...new Set(arr)] — без повторов; операции: union, intersection, difference." },
    { id: "js.map-set-weak.f4", front: "WeakMap?", back: "Ключи — только объекты, не удерживаются; нет size и перебора. Метаданные и кэши по объекту без утечек." },
    { id: "js.map-set-weak.f5", front: "Утечка через Map?", back: "Глобальный Map удерживает ключи-объекты. Решения: WeakMap, delete, LRU." },
    { id: "js.map-set-weak.f6", front: "Топологический порядок?", back: "DFS: узел в результат после своих зависимостей; цикл — повторная встреча узла в текущем пути." },
    { id: "js.map-set-weak.f7", front: "FinalizationRegistry?", back: "Колбэк после сборки объекта; момент не гарантирован — не для критичных ресурсов." },
  ],

  sources: [
    { title: "ECMAScript: Keyed Collections (Map, Set, WeakMap, WeakSet)", url: "https://tc39.es/ecma262/#sec-keyed-collections", publisher: "ECMA" },
    { title: "ECMAScript: SameValueZero", url: "https://tc39.es/ecma262/#sec-samevaluezero", publisher: "ECMA" },
    { title: "ECMAScript: WeakRef Objects", url: "https://tc39.es/ecma262/#sec-weak-ref-objects", publisher: "ECMA" },
    { title: "MDN: Map", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map", publisher: "MDN" },
    { title: "MDN: Set", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set", publisher: "MDN" },
    { title: "MDN: WeakMap", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap", publisher: "MDN" },
    { title: "MDN: WeakRef", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef", publisher: "MDN" },
    { title: "MDN: Keyed collections", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections", publisher: "MDN" },
    { title: "MDN: Map.groupBy()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/groupBy", publisher: "MDN" },
  ],
};
