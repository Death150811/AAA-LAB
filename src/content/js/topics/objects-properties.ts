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

export const objectsProperties: Topic = {
  id: "js.objects-properties",
  slug: "objects-properties",
  domain: "js",
  module: "objects",
  title: "Объекты и свойства",
  titleEn: "Objects and properties",
  summary:
    "Объект — набор свойств «ключ → значение», где ключ — строка или символ. Тема разбирает литералы (сокращённая запись, вычисляемые ключи, методы), порядок перечисления ключей (целые по возрастанию, затем строки в порядке добавления), проверку наличия (`in`, `Object.hasOwn`, `=== undefined`), удаление, `Object.keys/values/entries/fromEntries/groupBy`, дескрипторы свойств (`writable`, `enumerable`, `configurable`), аксессоры (`get`/`set`), уровни запрета изменений (`preventExtensions`, `seal`, `freeze`), копирование (поверхностное и глубокое), потери при `JSON.stringify` и `toJSON`, а также атаку «загрязнение прототипа» через наивное слияние. Все результаты — замеры в Node.js 22 и Chromium 141.",
  minutes: 70,
  prerequisites: ["js.variables-types", "js.functions-basics"],
  tags: ["object", "property", "descriptor", "getter", "setter", "Object.keys", "Object.entries", "freeze", "seal", "JSON", "structuredClone", "spread", "hasOwn", "prototype pollution", "toJSON"],
  keyConcepts: [
    { term: "Ключ — всегда строка или символ", text: "`user[1] === user[\"1\"]` — `true`, `typeof Object.keys(user)[0]` — `\"string\"`. Числа, булевы значения и объекты как ключи превращаются в строки." },
    { term: "Порядок ключей определён", text: "`Object.keys` и `for…in` сначала отдают целочисленные ключи по возрастанию, затем строки в порядке добавления, символы — отдельно: `['1', '2', 'name', 'full name', 'color', 'greet']` (замер)." },
    { term: "Наличие свойства — три разных вопроса", text: "`o.a === undefined` не отличает отсутствующее свойство от свойства со значением `undefined`; `\"a\" in o` проверяет и цепочку прототипов; `Object.hasOwn(o, \"a\")` — только собственное свойство." },
    { term: "У свойства есть атрибуты", text: "`writable`, `enumerable`, `configurable` (и `get`/`set` у аксессоров). `defineProperty` по умолчанию ставит все три в `false`: свойство не меняется, не удаляется и не попадает в `keys` и `JSON`." },
    { term: "Копирование поверхностное, пока не сказано иное", text: "`{ ...o }` и `Object.assign` копируют верхний уровень: вложенные объекты общие. `structuredClone` копирует глубоко, `JSON` — глубоко, но с потерями (`undefined`, функции, `NaN`, `Date`)." },
  ],
  sections: [
    section("definition", [
      def("Объект", "Составное значение: набор свойств «ключ → значение». Ключ — строка или символ, значение — любое. Массивы, функции, даты — тоже объекты.", "object"),
      def("Свойство", "Пара «ключ — значение» с атрибутами. Бывает свойством-данными (`value`) и аксессором (`get`/`set`).", "property"),
      def("Литерал объекта", "Запись `{ ключ: значение }`, создающая объект. Поддерживает сокращённую запись (`{ age }`), вычисляемые ключи (`[expr]: value`) и методы (`name() {}`).", "object literal"),
      def("Дескриптор свойства", "Описание атрибутов свойства: `value`, `writable`, `enumerable`, `configurable` или `get`/`set`. Читается через `Object.getOwnPropertyDescriptor`.", "property descriptor"),
      def("Аксессор", "Свойство, значение которого вычисляется функциями `get` и `set` при чтении и записи.", "accessor property / getter / setter"),
      def("Собственное и унаследованное свойство", "Собственное принадлежит самому объекту; унаследованное берётся из цепочки прототипов (следующая тема).", "own / inherited property"),
      def("Поверхностная копия", "Копия верхнего уровня: вложенные объекты в копии и оригинале — одни и те же.", "shallow copy"),
      def("Загрязнение прототипа", "Уязвимость: ввод заставляет код записать свойство в `Object.prototype`, и оно «появляется» у всех объектов.", "prototype pollution"),
    ]),

    section("why", [
      h("Почти все данные в JavaScript — объекты"),
      p("Ответы сервера, настройки, состояние приложения, DOM-элементы, функции, массивы — всё это объекты. Ошибки в работе с ними проявляются как «свойство пропало», «поменялось не там», «в JSON не попало то, что нужно», «порядок ключей не тот», «злоумышленник записал `isAdmin`»."),
      ul(
        "**Данные:** читать, преобразовывать и копировать объекты нужно каждый день; важно знать, какая операция копирует глубоко, а какая — нет.",
        "**Интерфейсы:** дескрипторы и аксессоры позволяют делать только читаемые, вычисляемые, проверяемые свойства.",
        "**Безопасность:** слияние пользовательского ввода с настройками — типовой вектор атаки на прототипы.",
        "**Основа дальнейшего:** прототипы, `this`, классы, `Map`/`Set`, деструктуризация — расширения этой темы.",
      ),
      insight("Объект — это **словарь с атрибутами и наследованием**. Три вопроса о любом свойстве: оно **собственное или унаследованное**, **перечислимое ли**, **можно ли его изменить**. Ответ на них даёт дескриптор."),
    ]),

    section("mental-model", [
      p("Представьте **картотеку**. Каждая карточка — свойство: на ней написан ключ (название, всегда текст или особый символ) и значение. Картотека сама помнит порядок: сначала карточки с номерами по возрастанию, потом остальные в порядке, в котором вы их положили. На каждую карточку можно навесить **пломбы**: «не менять» (`writable: false`), «не показывать в списке» (`enumerable: false`), «не изымать» (`configurable: false`). Есть и «живые» карточки-аксессоры: когда вы их читаете, сотрудник на лету вычисляет значение (`get`), а когда пишете — проверяет и записывает (`set`). Три общих замка на всю картотеку: нельзя добавлять карточки (`preventExtensions`), нельзя ещё и изымать (`seal`), нельзя ничего менять (`freeze`) — но замок действует только на карточки верхнего уровня, а вложенные картотеки остаются открытыми."),
      table(
        ["Вопрос", "Инструмент", "Что вернёт"],
        [
          ["Есть ли свойство (включая унаследованные)?", "`\"a\" in o`", "`true`, если найдено в объекте или цепочке прототипов"],
          ["Есть ли собственное свойство?", "`Object.hasOwn(o, \"a\")`", "`true` только для собственных"],
          ["Какое значение?", "`o.a` / `o[\"a\"]`", "Значение или `undefined`, если нет"],
          ["Список собственных перечислимых ключей / значений / пар", "`Object.keys` / `values` / `entries`", "Массивы в стандартном порядке"],
          ["Атрибуты свойства", "`Object.getOwnPropertyDescriptor`", "Объект-описание"],
          ["Скопировать", "`{ ...o }`, `Object.assign`, `structuredClone`", "Поверхностно / поверхностно / глубоко"],
        ],
        "Работа со свойствами",
      ),
    ]),

    section("technical", [
      h("Литералы, доступ и порядок ключей"),
      code("js", `const key = "color";
const id = Symbol("id");
const user = {
  name: "Аня",                  // обычное свойство
  "full name": "Аня Иванова",   // ключ-строка с пробелом
  [key]: "синий",               // вычисляемый ключ
  [id]: 7,                      // ключ-символ
  greet() { return "Привет, " + this.name; },   // метод
  2: "два",
  1: "один",
};
const age = 30;
const person = { name: "Борис", age };          // сокращённая запись: age: age

console.log(user.name, user["full name"], user.color, user[id], user.greet());
console.log(person, user.missing);              // отсутствующее свойство — undefined
console.log(Object.keys(user));                 // сначала целочисленные по возрастанию, затем строки в порядке добавления
console.log(user[1] === user["1"], typeof Object.keys(user)[0]);   // числовые ключи — строки

// наличие свойства
const o = { a: undefined, b: 0 };
console.log(o.a === undefined, "a" in o, Object.hasOwn(o, "a"), Object.hasOwn(o, "zzz"));
console.log("toString" in o, Object.hasOwn(o, "toString"));    // in видит и унаследованные

// delete, entries, fromEntries
delete o.b;
console.log(o, Object.entries({ x: 1, y: 2 }), Object.fromEntries([["p", 1], ["q", 2]]));

// преобразования значений и ключей
const prices = { apple: 10, pear: 20 };
const doubled = Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, v * 2]));
console.log(doubled);

// группировка (Node.js 22)
console.log(Object.groupBy([1, 2, 3, 4, 5], (n) => (n % 2 ? "нечётные" : "чётные")));`, { filename: "o1-basics.mjs", lineNumbers: true }),
      code("text", `Аня Аня Иванова синий 7 Привет, Аня
{ name: 'Борис', age: 30 } undefined
[ '1', '2', 'name', 'full name', 'color', 'greet' ]
true string
true true true false
true false
{ a: undefined } [ [ 'x', 1 ], [ 'y', 2 ] ] { p: 1, q: 2 }
{ apple: 20, pear: 40 }
[Object: null prototype] {
  'нечётные': [ 1, 3, 5 ],
  'чётные': [ 2, 4 ]
}`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Доступ:** `obj.name` — для идентификаторов, `obj[\"full name\"]` — для произвольных строк и вычисляемых имён; символ — только в квадратных скобках (`user[id]`).",
        "**Вычисляемые ключи** `[key]: \"синий\"` создали свойство `color`; **сокращённая запись** `{ age }` — то же, что `{ age: age }`.",
        "**Порядок:** целочисленные ключи (`1`, `2`) идут первыми по возрастанию — хотя добавлены в порядке `2`, `1`; затем строки в порядке добавления; символы в `Object.keys` не попадают.",
        "**Ключи — строки:** `user[1] === user[\"1\"]`, а `typeof Object.keys(user)[0]` — `\"string\"`.",
        "**Отсутствующее свойство** даёт `undefined`, а не ошибку; ошибка (`TypeError`) возникнет только при обращении к свойству **самого** `undefined`/`null` (`user.address.city`, если `address` нет — используйте `?.`).",
        "**`in` и `hasOwn`:** для `{ a: undefined, b: 0 }` проверка `o.a === undefined` — `true`, но `\"a\" in o` тоже `true` (свойство есть, значение `undefined`); `\"toString\" in o` — `true` (унаследовано), а `Object.hasOwn(o, \"toString\")` — `false`.",
        "**`delete o.b`** удаляет свойство целиком (в отличие от присваивания `undefined`).",
        "**`Object.entries` и `Object.fromEntries`** — обратные друг другу: вместе с `map` дают преобразование значений и ключей (`{ apple: 20, pear: 40 }`).",
        "**`Object.groupBy`** (Node.js 22) группирует элементы по ключу, возвращая объект без прототипа (`[Object: null prototype]`).",
      ),
      note("Для словарей с произвольными ключами (идентификаторы, строки от пользователя) обычно удобнее `Map` (тема о коллекциях): у него нет унаследованных ключей и порядок вставки сохраняется для любых ключей, а не только строк."),

      h("Дескрипторы, аксессоры и запреты"),
      code("js", `const obj = { visible: 1 };
Object.defineProperty(obj, "hidden", { value: 2 });          // writable, enumerable, configurable — по умолчанию false
console.log(Object.getOwnPropertyDescriptor(obj, "visible"));
console.log(Object.getOwnPropertyDescriptor(obj, "hidden"));
console.log(Object.keys(obj), JSON.stringify(obj), obj.hidden, "hidden" in obj);

try { obj.hidden = 3; } catch (e) { console.log(e.name + ": " + e.message); }
try { delete obj.hidden; } catch (e) { console.log(e.name + ": " + e.message); }

// аксессоры
const temperature = {
  _c: 20,
  get fahrenheit() { return this._c * 9 / 5 + 32; },
  set fahrenheit(f) { this._c = (f - 32) * 5 / 9; },
};
temperature.fahrenheit = 212;
console.log(temperature._c, temperature.fahrenheit);
console.log(Object.getOwnPropertyDescriptor(temperature, "fahrenheit"));

// запреты на уровне объекта
const sealed = Object.seal({ a: 1 });
const frozen = Object.freeze({ a: 1 });
const nonExt = Object.preventExtensions({ a: 1 });
for (const [label, o] of [["seal", sealed], ["freeze", frozen], ["preventExtensions", nonExt]]) {
  const row = [];
  for (const [what, fn] of [["добавить", () => { o.b = 1; }], ["изменить", () => { o.a = 2; }], ["удалить", () => { delete o.a; }]]) {
    try { fn(); row.push(what + ": да"); } catch { row.push(what + ": нет"); }
  }
  console.log(label.padEnd(18), row.join(", "));
}
console.log(Object.isFrozen(frozen), Object.isSealed(frozen), Object.isExtensible(nonExt));`, { filename: "o2-descriptors.mjs", lineNumbers: true }),
      code("text", `{ value: 1, writable: true, enumerable: true, configurable: true }
{ value: 2, writable: false, enumerable: false, configurable: false }
[ 'visible' ] {"visible":1} 2 true
TypeError: Cannot assign to read only property 'hidden' of object '#<Object>'
TypeError: Cannot delete property 'hidden' of #<Object>
100 212
{
  get: [Function: get fahrenheit],
  set: [Function: set fahrenheit],
  enumerable: true,
  configurable: true
}
seal               добавить: нет, изменить: да, удалить: нет
freeze             добавить: нет, изменить: нет, удалить: нет
preventExtensions  добавить: нет, изменить: да, удалить: да
true true false`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Обычное свойство:** `writable`, `enumerable`, `configurable` — все `true`.",
        "**`defineProperty` без атрибутов:** все `false`: свойство `hidden` не попадает в `Object.keys` и `JSON.stringify`, но читается (`obj.hidden` — `2`) и находится через `in`.",
        "**В строгом режиме (модуль)** запись в неизменяемое свойство — `TypeError: Cannot assign to read only property 'hidden' of object '#<Object>'`, удаление неконфигурируемого — `TypeError: Cannot delete property 'hidden' of #<Object>`; в нестрогом такие операции молча игнорируются.",
        "**Аксессоры:** `get fahrenheit()` вычисляет значение при чтении, `set fahrenheit(f)` — меняет `_c` при записи; дескриптор содержит `get`/`set` вместо `value`/`writable`. В литерале аксессор перечислим, поэтому попадает в `keys` и `JSON`.",
        "**Три уровня запрета:** `preventExtensions` — нельзя добавлять; `seal` — нельзя добавлять и удалять (менять можно); `freeze` — нельзя ничего (замер: `freeze` → `добавить: нет, изменить: нет, удалить: нет`; `seal` → `добавить: нет, изменить: да, удалить: нет`; `preventExtensions` → `добавить: нет, изменить: да, удалить: да`).",
        "**Замороженный объект** также запечатан и нерасширяем: `isFrozen`, `isSealed` — `true`, `isExtensible` для `preventExtensions`-объекта — `false`.",
      ),

      h("Копирование: поверхностное, глубокое и через JSON"),
      code("js", `const original = { name: "Аня", tags: ["a"], address: { city: "Москва" }, born: new Date(0) };

const spread = { ...original };
const assigned = Object.assign({}, original);
const cloned = structuredClone(original);
const viaJson = JSON.parse(JSON.stringify(original));

original.tags.push("b");
original.address.city = "Казань";
console.log("spread  :", spread.tags, spread.address.city, spread.address === original.address);
console.log("assign  :", assigned.tags, assigned.address === original.address);
console.log("clone   :", cloned.tags, cloned.address.city, cloned.born instanceof Date);
console.log("JSON    :", viaJson.tags, typeof viaJson.born, viaJson.born);

// что теряет круг JSON
const lossy = { u: undefined, f() {}, s: Symbol("s"), n: NaN, inf: Infinity, d: new Date(0), nested: [undefined, () => 1] };
console.log(JSON.stringify(lossy));
try { JSON.stringify({ big: 10n }); } catch (e) { console.log(e.name + ": " + e.message); }
const cyclic = {}; cyclic.self = cyclic;
try { JSON.stringify(cyclic); } catch (e) { console.log(e.name + ": " + e.message.split("\\n")[0]); }
console.log(structuredClone(cyclic).self !== cyclic, structuredClone(cyclic).self.self !== undefined);

// собственный метод toJSON
const price = { amount: 5, currency: "RUB", toJSON() { return \`\${this.amount} \${this.currency}\`; } };
console.log(JSON.stringify({ price }));

// сравнение по ссылке и по значению
console.log({} === {}, JSON.stringify({ a: 1 }) === JSON.stringify({ a: 1 }), JSON.stringify({ a: 1, b: 2 }) === JSON.stringify({ b: 2, a: 1 }));`, { filename: "o3-copy.mjs", lineNumbers: true }),
      code("text", `spread  : [ 'a', 'b' ] Казань true
assign  : [ 'a', 'b' ] true
clone   : [ 'a' ] Москва true
JSON    : [ 'a' ] string 1970-01-01T00:00:00.000Z
{"n":null,"inf":null,"d":"1970-01-01T00:00:00.000Z","nested":[null,null]}
TypeError: Do not know how to serialize a BigInt
TypeError: Converting circular structure to JSON
true true
{"price":"5 RUB"}
false true false`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`{ ...o }` и `Object.assign`** копируют верхний уровень: после изменения оригинала `spread.tags` и `spread.address.city` изменились (`address` — общий объект: `spread.address === original.address`).",
        "**`structuredClone`** скопировал массив и вложенный объект (`['a']`, `Москва`), сохранил `Date` (`cloned.born instanceof Date`) и поддерживает циклические ссылки.",
        "**Круг `JSON.stringify` → `JSON.parse`** тоже копирует глубоко, но с потерями: `Date` стала строкой (`typeof viaJson.born` — `string`).",
        "**Что теряет JSON:** `undefined`, функции и символы пропускаются в объектах, а в массивах заменяются на `null`; `NaN` и `Infinity` становятся `null`; `Date` — строкой ISO. В замере: `{\"n\":null,\"inf\":null,\"d\":\"1970-01-01T00:00:00.000Z\",\"nested\":[null,null]}`.",
        "**Ошибки JSON:** `BigInt` — `TypeError: Do not know how to serialize a BigInt`; циклическая структура — `TypeError: Converting circular structure to JSON`.",
        "**`toJSON`:** метод объекта определяет, как он сериализуется (`{\"price\":\"5 RUB\"}`).",
        "**Равенство:** `{} === {}` — `false` (разные ссылки); сравнение через `JSON.stringify` зависит от порядка ключей (`{a:1,b:2}` и `{b:2,a:1}` дают разные строки) и потому ненадёжно.",
      ),

      h("Слияние объектов и загрязнение прототипа"),
      p("Рекурсивное слияние пользовательского ввода с объектом настроек — частая операция и частая уязвимость. Если в цикле копируются **все** ключи, включая `__proto__`, запись попадает в прототип."),
      code("js", `// наивное «глубокое» слияние
function naiveMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === "object" && source[key] !== null) {
      if (!target[key]) target[key] = {};
      naiveMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const payload = JSON.parse('{"__proto__": {"isAdmin": true}}');
console.log("свой ключ __proto__ после JSON.parse:", Object.hasOwn(payload, "__proto__"));
naiveMerge({}, payload);
console.log("({}).isAdmin после слияния:", ({}).isAdmin);       // загрязнён Object.prototype
delete Object.prototype.isAdmin;
console.log("после очистки:", ({}).isAdmin);`, { filename: "o4-pollution.mjs", lineNumbers: true }),
      code("text", `свой ключ __proto__ после JSON.parse: true
({}).isAdmin после слияния: true
после очистки: undefined`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`JSON.parse`** создаёт **собственное** свойство `__proto__` (`hasOwn` — `true`) и сам прототип не меняет.",
        "**Наивное слияние** прошло по ключам через `for…in`, дошло до `__proto__` и записало `isAdmin` в **`Object.prototype`**: после слияния `({}).isAdmin` — `true` у всех новых объектов.",
        "**Защита:** пропускать ключи `__proto__`, `constructor`, `prototype`; создавать результат с `Object.create(null)` или копировать только собственные ключи через `Object.keys`; валидировать вход схемой.",
      ),
      warn("Не вставляйте в объекты, сливаемые с пользовательскими данными, проверки вида `if (user.isAdmin)` без собственной проверки `Object.hasOwn(user, \"isAdmin\")` — иначе загрязнённый прототип выдаст права всем объектам."),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const field = "level";

const hero = {
  name: "Ратмир",              // свойство: ключ и значение
  [field]: 3,                  // вычисляемый ключ
  tags: ["воин"],              // значением может быть массив или другой объект
  greet() {                    // метод
    return \`Я \${this.name}\`;
  },
  get title() {                // вычисляемое свойство (getter)
    return \`\${this.name}, уровень \${this.level}\`;
  },
};

hero.level += 1;               // доступ через точку
console.log(hero["name"], hero.title, "tags" in hero, delete hero.tags);`,
        [
          { line: 3, text: "Литерал объекта: фигурные скобки, пары `ключ: значение` через запятую (разрешена завершающая запятая)." },
          { line: 5, text: "Вычисляемый ключ: значение переменной `field` (`\"level\"`) становится именем свойства." },
          { line: 6, text: "Значением свойства может быть массив или другой объект." },
          { line: [7, 9], text: "Метод: сокращённая запись функции-свойства. `this` — объект, у которого метод вызван (тема о `this`)." },
          { line: [10, 12], text: "Аксессор `get`: выглядит как свойство (`hero.title`), но значение вычисляется при каждом чтении." },
          { line: 15, text: "Чтение и запись через точку; `hero.level += 1` читает значение и записывает обратно." },
          { line: 16, text: "`hero[\"name\"]` — то же, что `hero.name`; `in` проверяет наличие, `delete` удаляет свойство и возвращает `true`." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Просмотр объекта</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 36rem; }
  textarea { width: 100%; min-height: 7rem; font: 14px/1.4 ui-monospace, monospace; }
  table { border-collapse: collapse; margin-top: 1rem; }
  th, td { border: 1px solid #8884; padding: .25rem .7rem; text-align: left; }
  #error { color: #b00020; min-height: 1.5em; }
</style>
<h1>Просмотр объекта</h1>
<label for="src">JSON:</label>
<textarea id="src" spellcheck="false">{"name": "Аня", "age": 30, "tags": ["js", "css"], "address": {"city": "Москва"}}</textarea>
<p id="error" role="alert"></p>
<table>
  <thead><tr><th>Ключ</th><th>Тип значения</th><th>Значение</th></tr></thead>
  <tbody id="rows"></tbody>
</table>
<script type="module">
  const src = document.querySelector("#src");
  const rows = document.querySelector("#rows");
  const error = document.querySelector("#error");

  const kind = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

  function render() {
    rows.replaceChildren();
    error.textContent = "";
    let data;
    try {
      data = JSON.parse(src.value);
    } catch (e) {
      error.textContent = \`Ошибка JSON: \${e.message}\`;
      return;
    }
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      error.textContent = "Ожидается объект";
      return;
    }
    for (const [key, value] of Object.entries(data)) {      // пары «ключ — значение»
      const tr = rows.insertRow();
      tr.insertCell().textContent = key;
      tr.insertCell().textContent = kind(value);
      tr.insertCell().textContent = JSON.stringify(value);
    }
  }

  src.addEventListener("input", render);
  render();
</script>`, { filename: "json-viewer.html", runnable: true, lineNumbers: true }),
      p("Страница разбирает JSON из поля ввода и строит таблицу через `Object.entries`. Замер в Chromium 141: для объекта по умолчанию — четыре строки (`name | string`, `age | number`, `tags | array`, `address | object`); для `{\"a\": 1,}` — сообщение `Ошибка JSON: Expected double-quoted property name in JSON at position 8 (line 1 column 9)` и пустая таблица; для `[1, 2]` — «Ожидается объект»; ошибок страницы нет."),
    ]),

    section("detailed-example", [
      p("Функция `deepMerge(target, source)` — безопасное слияние настроек по умолчанию с пользовательскими. Правила: вложенные «простые» объекты объединяются рекурсивно, массивы и значения заменяются, `undefined` не затирает значение, `null` затирает, входные данные не изменяются, а ключи `__proto__`, `constructor`, `prototype` игнорируются."),
      code("js", `const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);

const isPlainObject = (value) => {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (isPlainObject(value)) return deepMerge({}, value);
  return value;                                           // примитивы, Date и прочее — как есть
}

export function deepMerge(target, source) {
  const result = {};
  for (const key of Object.keys(target)) {
    if (!FORBIDDEN.has(key)) result[key] = cloneValue(target[key]);
  }
  for (const key of Object.keys(source)) {
    if (FORBIDDEN.has(key)) continue;                     // защита от загрязнения прототипа
    const value = source[key];
    if (value === undefined) continue;                    // undefined не затирает существующее
    result[key] = isPlainObject(value) && isPlainObject(result[key])
      ? deepMerge(result[key], value)
      : cloneValue(value);
  }
  return result;
}`, { filename: "deep-merge.mjs", lineNumbers: true }),
      code("js", `import { deepMerge } from "./deep-merge.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);

const defaults = { theme: "light", editor: { fontSize: 14, tabs: { size: 2, useSpaces: true } }, plugins: ["a", "b"] };
const user = { editor: { fontSize: 16, tabs: { size: 4 } }, plugins: ["c"], theme: undefined };
const merged = deepMerge(defaults, user);

check("вложенные объекты объединяются", merged.editor, { fontSize: 16, tabs: { size: 4, useSpaces: true } });
check("массивы заменяются, а не склеиваются", merged.plugins, ["c"]);
check("undefined не затирает значение", merged.theme, "light");
check("null затирает значение", deepMerge({ a: 1 }, { a: null }), { a: null });
check("входные данные не изменены", [defaults.editor.fontSize, defaults.editor.tabs.size, defaults.plugins], [14, 2, ["a", "b"]]);
check("результат не разделяет вложенные объекты с источником", [merged.editor === defaults.editor, merged.editor.tabs === user.editor.tabs, merged.plugins === user.plugins], [false, false, false]);

const date = new Date(0);
check("Date копируется как значение-объект (по ссылке)", deepMerge({}, { when: date }).when === date, true);

const evil = JSON.parse('{"__proto__": {"isAdmin": true}, "ok": 1}');
const safe = deepMerge({}, evil);
check("__proto__ из JSON не загрязняет Object.prototype", ({}).isAdmin, undefined);
check("в результате нет ключа __proto__", [Object.hasOwn(safe, "__proto__"), safe.ok], [false, 1]);

deepMerge({}, JSON.parse('{"constructor": {"prototype": {"polluted": 1}}}'));
check("constructor.prototype игнорируется", ({}).polluted, undefined);

check("пустые объекты", deepMerge({}, {}), {});
check("новые ключи добавляются", deepMerge({ a: 1 }, { b: { c: 2 } }), { a: 1, b: { c: 2 } });
check("объект поверх примитива заменяет его", deepMerge({ a: 1 }, { a: { b: 2 } }), { a: { b: 2 } });
check("примитив поверх объекта заменяет его", deepMerge({ a: { b: 2 } }, { a: 3 }), { a: 3 });

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "deep-merge-test.mjs", collapsed: true }),
      code("text", `Все 14 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает", "Почему так"],
        [
          ["`FORBIDDEN = new Set([\"__proto__\", \"constructor\", \"prototype\"])`", "Список опасных ключей", "Через них вредоносный ввод добирается до `Object.prototype` (проверено: `constructor.prototype` и `__proto__` не загрязняют)"],
          ["`isPlainObject`: прототип — `Object.prototype` или `null`", "Отличает «простые» объекты от массивов, `Date`, экземпляров классов", "Рекурсивно сливаются только словари; `Date` и массивы заменяются целиком"],
          ["`Object.keys(...)`, а не `for…in`", "Перебирает только собственные перечислимые строковые ключи", "`for…in` захватил бы унаследованные свойства"],
          ["`result = {}` и `cloneValue`", "Строит новый объект, копируя вложенные структуры", "Входные объекты не изменяются и не разделяют вложенные объекты с результатом"],
          ["`if (value === undefined) continue`", "Игнорирует `undefined`", "Необязательные настройки не затирают значения по умолчанию; `null` — осознанное отключение"],
          ["Рекурсия `deepMerge(result[key], value)`", "Слияние на каждом уровне", "Условие `isPlainObject` на обеих сторонах гарантирует корректный тип"],
        ],
        "Разбор deepMerge",
      ),
      ul(
        "Все 14 проверок проходят: вложенное слияние, массивы, `undefined` и `null`, неизменность входов, отсутствие общих ссылок, `Date`, `__proto__`, `constructor.prototype`, замена примитива объектом и наоборот.",
        "**Ограничение:** функция не поддерживает циклические структуры (бесконечная рекурсия) и копирует `Date` по ссылке — для особых типов нужна своя логика.",
      ),
    ]),

    section("internals", [
      h("Внутренние методы и ключи"),
      p("Объект в спецификации — набор свойств с **внутренними методами** (`[[Get]]`, `[[Set]]`, `[[DefineOwnProperty]]`, `[[OwnPropertyKeys]]` и др.). `[[OwnPropertyKeys]]` как раз определяет порядок: целочисленные индексы по возрастанию, затем строки в порядке создания, затем символы. Поэтому `Object.keys` и `JSON.stringify` дают предсказуемый порядок (замер: `1, 2, name, …`)."),
      h("Атрибуты свойств"),
      p("Каждое свойство хранит атрибуты `writable`/`enumerable`/`configurable` (для данных) или `get`/`set` (для аксессоров). Литерал `{ a: 1 }` создаёт свойство со всеми атрибутами `true`; `Object.defineProperty` для **нового** свойства — со всеми `false`, если не указано иное (замер дескриптора `hidden`). Понижение `configurable` необратимо: после `configurable: false` нельзя ни вернуть, ни удалить свойство."),
      h("Как работает `freeze`"),
      p("`Object.freeze` — это `preventExtensions` плюс установка `configurable: false` и (для данных) `writable: false` у всех **собственных** свойств. Вложенные объекты не затрагиваются (поверхностная заморозка, замер: `frozen.list.push(2)` сработала, см. тему о типах данных). Для глубокой заморозки обходят структуру рекурсивно."),
      h("Что копирует `structuredClone`"),
      p("`structuredClone` реализует алгоритм структурного клонирования из HTML Standard: копирует вложенные объекты, массивы, `Date`, `Map`, `Set`, `RegExp`, сохраняет циклические ссылки. Не копирует функции (`DataCloneError`), теряет прототипы собственных классов и аксессоры (копирует значения)."),
      h("Почему наивное слияние уязвимо"),
      p("Запись `target[\"__proto__\"][\"isAdmin\"] = true` — это обращение к аксессору `__proto__` объекта (прототип), а затем запись свойства в **сам прототип**. Если `target` — обычный объект, его прототип — `Object.prototype`, общий для всех. Из-за этого `JSON.parse` с ключом `__proto__` безопасен (создаёт собственное свойство), а рекурсивное слияние `target[key] = …` — нет."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Считать, что `o.a === undefined` означает «нет свойства»"),
      p("Свойство `a` со значением `undefined` существует (`\"a\" in o` и `Object.hasOwn(o, \"a\")` — `true`), а свойство `age` отсутствует. Различие важно при сериализации и слиянии."),
      h("Ошибка 2. Использовать `in` для проверки собственных данных"),
      p("`\"toString\" in {}` — `true`: `in` видит прототипы. Для собственных свойств — `Object.hasOwn`."),
      h("Ошибка 3. Ожидать глубокую копию от `{ ...o }` и `Object.assign`"),
      wrongRight(
        "js",
        {
          code: `
            const copy = { ...original };
            copy.address.city = "Казань";      // меняет и original.address.city
          `,
          note: "Вложенный объект общий (замер: `spread.address === original.address`).",
        },
        {
          code: `
            const copy = structuredClone(original);
            copy.address.city = "Казань";      // original не затронут
          `,
          note: "Глубокая копия; для данных без функций и особых типов.",
        },
      ),
      h("Ошибка 4. Копировать объект через JSON без учёта потерь"),
      p("`JSON.parse(JSON.stringify(o))` теряет `undefined`, функции, символы, превращает `NaN` в `null` и `Date` — в строку (замер). Для копирования данных используйте `structuredClone`."),
      h("Ошибка 5. Сравнивать объекты через `===` или `JSON.stringify`"),
      p("`{} === {}` — `false`; а `JSON.stringify({a:1,b:2}) === JSON.stringify({b:2,a:1})` — `false` из-за порядка ключей. Для глубокого сравнения пишут рекурсивную функцию (или используют тестовые библиотеки)."),
      h("Ошибка 6. Рекурсивное слияние без защиты от `__proto__`"),
      p("Замер: после слияния `JSON.parse('{\"__proto__\": {\"isAdmin\": true}}')` значение `({}).isAdmin` стало `true`. Пропускайте опасные ключи и копируйте только собственные."),
      h("Ошибка 7. Надеяться на порядок ключей для нестроковых ключей"),
      p("Целочисленные ключи всегда идут первыми по возрастанию; если важен порядок вставки для любых ключей — используйте `Map`."),
      h("Ошибка 8. Ждать `TypeError` при записи в замороженный объект в нестрогом режиме"),
      p("В нестрогом режиме запись молча игнорируется; в модуле — `TypeError` (замер). Чтобы не гадать, пишите код в модулях."),
    ]),

    section("antipatterns", [
      ul(
        "**Использование объекта как словаря с произвольными ключами** (`counts[word]++`): ключи `__proto__` и `toString` создают проблемы; берите `Map` или `Object.create(null)`.",
        "**`for…in` по объекту** без проверки `hasOwn`: захватывает унаследованные свойства.",
        "**Мутация переданных объектов** вместо возврата копии.",
        "**`delete` в «горячих» структурах** ради «обнуления» поля: присвойте `null`/`undefined` или создайте новый объект.",
        "**Глубокое копирование «на всякий случай»** на каждом шаге: дорого и скрывает неясный контракт.",
        "**Слияние пользовательского ввода без валидации.**",
        "**`JSON.parse(JSON.stringify(x))` как универсальный клон.**",
        "**Свойства-флаги с неочевидным набором комбинаций** (`isNew`, `isOld`, `isDraft` одновременно): заводите одно поле-состояние.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Выбирайте нужную проверку:** `Object.hasOwn` — собственное, `in` — с учётом прототипов, `?.` и `??` — для опциональных данных.",
        "**Преобразуйте объекты через `Object.entries` → `map` → `Object.fromEntries`.**",
        "**Копируйте осознанно:** `{ ...o }` — верхний уровень, `structuredClone` — глубоко.",
        "**Не мутируйте входные данные;** возвращайте новые объекты (иммутабельный стиль).",
        "**Для неизменяемых констант и конфигураций — `Object.freeze`** (глубоко — рекурсивной функцией).",
        "**Аксессоры — для вычисляемых и проверяемых значений,** `defineProperty` — для скрытых и только читаемых свойств.",
        "**Для словарей — `Map`;** для записей с известными полями — объект.",
        "**Слияние внешних данных — только с валидацией и защитой от `__proto__`/`constructor`/`prototype`.**",
      ),
      tip("Для отладки используйте `console.table(объект)` и `Object.getOwnPropertyDescriptors(obj)`: первое показывает данные таблицей, второе — атрибуты всех собственных свойств."),
    ]),

    section("edge-cases", [
      h("Порядок ключей и `JSON`"),
      p("`JSON.stringify` использует тот же порядок, что `Object.keys`; два объекта с одинаковыми свойствами, созданные в разном порядке, дают разные строки (замер)."),
      h("Символьные ключи"),
      p("Символы не попадают в `Object.keys`, `for…in` и `JSON.stringify`; их возвращают `Object.getOwnPropertySymbols` и `Reflect.ownKeys`."),
      h("`Object.assign` и аксессоры"),
      p("`Object.assign` и spread вызывают геттеры источника и записывают **значения** (результат — обычные свойства), а сеттеры целевого объекта вызываются. Аксессоры «не копируются как аксессоры»."),
      h("Свойства с числовыми именами у массивов"),
      p("Массив — объект, у которого индексы — ключи-строки (`\"0\"`, `\"1\"`) и специальное свойство `length` (подробно — в теме о массивах)."),
      h("Объект без прототипа"),
      p("`Object.create(null)` создаёт объект без унаследованных свойств: `\"toString\" in obj` — `false`; такой объект безопаснее как словарь, но не имеет методов вроде `hasOwnProperty` (используйте `Object.hasOwn`). `Object.groupBy` возвращает именно такой объект (замер: `[Object: null prototype]`)."),
      h("Изменение объекта во время перебора"),
      p("Добавление свойств во время `for…in` может не попасть в перебор, удалённые свойства пропускаются; не меняйте объект, по которому идёте."),
    ]),

    section("related", [
      ul(
        "[Переменные и типы данных](/learn/js/variables-types) — ссылки, `Object.freeze`, `structuredClone`.",
        "[Функции высшего порядка](/learn/js/higher-order-recursion) — `map`/`reduce` над `entries`.",
        "[Замыкания](/learn/js/closures) — приватное состояние как альтернатива дескрипторам.",
        "[Операторы и приведение типов](/learn/js/operators-coercion) — `??`, `?.`, `==`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Мутация, общие вложенные данные и опасное слияние",
          code: `
            function updateUser(user, patch) {
              for (const key in patch) {
                user[key] = patch[key];              // меняет переданный объект; захватывает унаследованные ключи
              }
              return user;
            }
            const copy = { ...state };               // address — общий с оригиналом
          `,
          note: "Мутация входных данных, `for…in` по чужому объекту, поверхностная копия вложенных структур.",
        },
        {
          title: "Новые объекты и контролируемое слияние",
          code: `
            const updateUser = (user, patch) => deepMerge(user, patch);   // безопасное слияние, новый объект
            const copy = structuredClone(state);                          // независимая глубокая копия
          `,
          note: "Входные данные не меняются; слияние защищено от опасных ключей; вложенные объекты не общие.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.objects-properties.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код, скажите, что напечатает каждая строка, и объясните порядок ключей, различие `in`/`hasOwn`/`=== undefined`, сравнение объектов и поведение `freeze`."),
        code("js", `const o = { b: 1, 10: "x", 2: "y", a: 2 };
o.c = 3;
delete o.b;
console.log(Object.keys(o));

const p = { name: undefined };
console.log(p.name === undefined, "name" in p, Object.hasOwn(p, "name"), p.age === undefined, "age" in p);

const q = { x: 1 };
const r = q;
r.x = 2;
console.log(q.x, q === r, { x: 2 } === q);

const frozen = Object.freeze({ list: [1], n: 1 });
try { frozen.n = 2; } catch (e) { console.log(e.name); }
frozen.list.push(2);
console.log(frozen);

const s = { a: 1, ...{ a: 2, b: 3 }, c: 4 };
console.log(s);`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Как упорядочены числовые и строковые ключи?", "Что делает `freeze` с вложенным массивом?"],
      checks: ["Объяснён порядок `['2', '10', 'a', 'c']`", "Объяснены пять значений в строке про `name`/`age`", "Объяснено `TypeError` и вложенный массив"],
      solution: [
        code("text", `[ '2', '10', 'a', 'c' ]
true true true true false
2 true false
TypeError
{ list: [ 1, 2 ], n: 1 }
{ a: 2, b: 3, c: 4 }`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "Ключи: целочисленные `2`, `10` по возрастанию, затем строки в порядке добавления (`a`, `c`); `b` удалён.",
          "`name: undefined` — свойство есть (`in` и `hasOwn` — `true`), но значение `undefined`; `age` нет (`in` — `false`).",
          "`r` и `q` — один объект: `q.x` стало `2`; `{ x: 2 } === q` — `false` (другая ссылка).",
          "В модуле запись в `frozen.n` бросает `TypeError`; вложенный массив не заморожен — `push(2)` сработал.",
          "В литерале с spread побеждает последнее значение ключа: `a` стало `2`.",
        ),
      ],
    }),
    exercise({
      id: "js.objects-properties.ex2",
      title: "Индекс, подсчёт, выборка",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Дан массив пользователей `{ id, name, role }`. Постройте (1) объект-индекс по `id`, (2) количество пользователей по ролям, (3) функции `pick(obj, keys)` и `omit(obj, keys)`. Используйте `Object.entries`/`fromEntries`, не изменяя исходные данные."),
      ],
      hints: ["Как превратить массив пар в объект?", "Как проверить, что ключ собственный?"],
      checks: ["Индекс по `id` работает", "Подсчёт по ролям верный", "`pick` игнорирует отсутствующие ключи", "Исходные данные не изменены"],
      solution: [
        code("js", `const users = [
  { id: 3, name: "Вера", role: "admin" },
  { id: 1, name: "Аня", role: "user" },
  { id: 2, name: "Борис", role: "user" },
];

// индекс по id: быстрый доступ без поиска по массиву
const byId = Object.fromEntries(users.map((u) => [u.id, u]));
console.log(byId[2].name, Object.keys(byId));

// подсчёт по ролям
const countByRole = users.reduce((acc, u) => ({ ...acc, [u.role]: (acc[u.role] ?? 0) + 1 }), {});
console.log(countByRole);

// переименование ключей и фильтрация свойств
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => Object.hasOwn(obj, k)).map((k) => [k, obj[k]]));
const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
console.log(pick(users[0], ["id", "name", "zzz"]), omit(users[0], ["role"]));`, { filename: "x2-index.mjs" }),
        code("text", `Борис [ '1', '2', '3' ]
{ admin: 1, user: 2 }
{ id: 3, name: 'Вера' } { id: 3, name: 'Вера' }`, { filename: "вывод Node.js 22.22.0" }),
        p("Ключи индекса — строки (`['1', '2', '3']`, упорядочены по возрастанию, хотя пользователи шли `3, 1, 2`). `pick` проверяет `Object.hasOwn`, поэтому `zzz` пропущен; `omit` строит новый объект без указанных ключей."),
      ],
    }),
    exercise({
      id: "js.objects-properties.ex3",
      title: "Температура с проверкой",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Реализуйте `createTemperature(celsius)` с аксессорами `celsius` и `fahrenheit`: запись в любое из свойств должна проверять значение (число, не ниже −273,15 °C) и обновлять общее состояние; при ошибке состояние остаётся прежним. Состояние должно быть недоступно напрямую."),
      ],
      hints: ["Где хранить значение, чтобы оно не попало в `keys`?", "Какие ошибки бросать для нечисла и для значения ниже абсолютного нуля?"],
      checks: ["Оба аксессора согласованы", "Ошибки `TypeError` и `RangeError`", "Состояние не меняется при ошибке"],
      solution: [
        code("js", `export function createTemperature(celsius = 0) {
  let c = celsius;
  const check = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) throw new TypeError("Температура должна быть числом");
    if (value < -273.15) throw new RangeError("Ниже абсолютного нуля");
    return value;
  };
  check(c);
  return {
    get celsius() { return c; },
    set celsius(value) { c = check(value); },
    get fahrenheit() { return c * 9 / 5 + 32; },
    set fahrenheit(f) { c = check((f - 32) * 5 / 9); },
  };
}`, { filename: "temperature.mjs" }),
        code("js", `import { createTemperature } from "./temperature.mjs";

const t = createTemperature(20);
const checks = [];
const check = (label, got, expected) => checks.push([label, String(got), String(expected)]);
const catchName = (fn) => { try { fn(); return "без ошибки"; } catch (e) { return e.name; } };

check("fahrenheit из celsius", t.fahrenheit, 68);
t.fahrenheit = 212;
check("celsius после записи fahrenheit", t.celsius, 100);
t.celsius = -40;
check("при -40 шкалы совпадают", t.fahrenheit, -40);
check("не число", catchName(() => { t.celsius = "20"; }), "TypeError");
check("NaN", catchName(() => { t.celsius = NaN; }), "TypeError");
check("ниже абсолютного нуля", catchName(() => { t.celsius = -300; }), "RangeError");
check("значение не изменилось после ошибки", t.celsius, -40);
check("fahrenheit тоже проверяется", catchName(() => { t.fahrenheit = -1000; }), "RangeError");
check("начальное значение проверяется", catchName(() => createTemperature(-500)), "RangeError");
check("аксессоры видны в keys", Object.keys(t).join(), "celsius,fahrenheit");
check("в JSON попадают текущие значения", JSON.stringify(t), '{"celsius":-40,"fahrenheit":-40}');

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "temperature-test.mjs", collapsed: true }),
        code("text", `Все 11 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
        p("Состояние `c` лежит в замыкании, а аксессоры читают и пишут его через проверку `check`. Запись `fahrenheit` пересчитывается в градусы Цельсия и проходит ту же проверку."),
      ],
    }),
  ],

  challenge: {
    id: "js.objects-properties.challenge",
    title: "Безопасное слияние настроек",
    scenario: [
      p("Сервис принимает пользовательские настройки в JSON и накладывает их на настройки по умолчанию. После инцидента с загрязнением прототипа слияние нужно переписать. Реализуйте модуль `deep-merge.mjs` с функцией `deepMerge(target, source)`."),
    ],
    requirements: [
      "Вложенные простые объекты объединяются рекурсивно; массивы и остальные значения из `source` заменяют значения `target`",
      "`undefined` в `source` не затирает значение, `null` — затирает",
      "Входные объекты не изменяются; результат не разделяет вложенные объекты и массивы с входами",
      "Ключи `__proto__`, `constructor`, `prototype` игнорируются на любом уровне; после слияния `({}).isAdmin` остаётся `undefined`",
    ],
    constraints: [
      "Без внешних библиотек",
      "Перебор только собственных ключей (`Object.keys`), не `for…in`",
    ],
    acceptance: [
      "Все 14 проверок из теста проходят",
      "Слияние `JSON.parse('{\"__proto__\": {\"isAdmin\": true}}')` не загрязняет `Object.prototype`",
      "Объект поверх примитива и примитив поверх объекта заменяются корректно",
    ],
    hints: [
      "Как отличить «простой» объект от массива, `Date`, экземпляра класса?",
      "Как гарантировать, что результат не делит ссылки с входными данными?",
      "Что даст перебор через `Object.keys` вместо `for…in`?",
    ],
    solution: [
      code("js", `const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);

const isPlainObject = (value) => {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (isPlainObject(value)) return deepMerge({}, value);
  return value;                                           // примитивы, Date и прочее — как есть
}

export function deepMerge(target, source) {
  const result = {};
  for (const key of Object.keys(target)) {
    if (!FORBIDDEN.has(key)) result[key] = cloneValue(target[key]);
  }
  for (const key of Object.keys(source)) {
    if (FORBIDDEN.has(key)) continue;                     // защита от загрязнения прототипа
    const value = source[key];
    if (value === undefined) continue;                    // undefined не затирает существующее
    result[key] = isPlainObject(value) && isPlainObject(result[key])
      ? deepMerge(result[key], value)
      : cloneValue(value);
  }
  return result;
}`, { filename: "deep-merge.mjs", lineNumbers: true }),
      code("text", `Все 14 проверок пройдены`, { filename: "результат запуска тестов" }),
      p("Результат строится заново: каждое значение проходит через `cloneValue`, а рекурсивное слияние применяется только когда обе стороны — простые объекты. Список запрещённых ключей отсекает пути к `Object.prototype`."),
    ],
  },

  interview: [
    iq("js.objects-properties.i1", "basic", "Как проверить наличие свойства у объекта?", [
      ul(
        "`\"key\" in obj` — включая унаследованные.",
        "`Object.hasOwn(obj, \"key\")` — только собственные (современная замена `hasOwnProperty`).",
        "`obj.key !== undefined` — не различает отсутствие и значение `undefined`.",
      ),
    ]),
    iq("js.objects-properties.i2", "basic", "Чем отличаются `Object.keys`, `Object.values`, `Object.entries`?", [
      p("Все три возвращают массивы по собственным перечислимым строковым ключам: ключи, значения, пары `[ключ, значение]`. Порядок: целочисленные ключи по возрастанию, затем строки в порядке добавления. `Object.fromEntries` собирает объект обратно из пар."),
    ]),
    iq("js.objects-properties.i3", "intermediate", "Как скопировать объект? В чём различия способов?", [
      ul(
        "`{ ...o }`/`Object.assign({}, o)` — поверхностно: вложенные объекты общие.",
        "`structuredClone(o)` — глубоко: объекты, массивы, `Date`, `Map`, `Set`, циклические ссылки; не копирует функции.",
        "`JSON.parse(JSON.stringify(o))` — глубоко, но теряет `undefined`, функции, символы, `NaN`→`null`, `Date`→строка.",
        "Часто копирование не нужно: достаточно иммутабельного обновления изменяемой ветви.",
      ),
    ]),
    iq("js.objects-properties.i4", "intermediate", "Что такое дескриптор свойства?", [
      ul(
        "Описание атрибутов: `value`, `writable`, `enumerable`, `configurable` (или `get`/`set`).",
        "`Object.defineProperty` для нового свойства ставит все атрибуты в `false`.",
        "`enumerable: false` скрывает свойство из `keys`/`JSON`; `writable: false` запрещает запись; `configurable: false` — удаление и повторную настройку.",
      ),
    ]),
    iq("js.objects-properties.i5", "intermediate", "Чем отличаются `Object.freeze`, `seal` и `preventExtensions`?", [
      ul(
        "`preventExtensions`: нельзя добавлять свойства.",
        "`seal`: нельзя добавлять и удалять; значения менять можно.",
        "`freeze`: нельзя добавлять, удалять и менять (поверхностно).",
        "Вложенные объекты остаются изменяемыми; в строгом режиме нарушение даёт `TypeError`, в нестрогом — молча игнорируется.",
      ),
    ]),
    iq("js.objects-properties.i6", "advanced", "Что такое загрязнение прототипа и как его предотвратить?", [
      ul(
        "Вредоносный ввод записывает свойство в `Object.prototype` (через `__proto__`/`constructor.prototype` в небезопасном слиянии) — все объекты «получают» его (например, `isAdmin`).",
        "Защита: игнорировать опасные ключи, копировать только собственные, использовать `Object.create(null)`/`Map`, валидировать вход схемой, замораживать прототипы (`Object.freeze(Object.prototype)`) в критичных окружениях.",
        "Проверять `Object.hasOwn` для проверок прав и флагов.",
      ),
    ]),
    iq("js.objects-properties.i7", "engineering", "Когда использовать объект, а когда `Map`?", [
      ul(
        "Объект — для записей с известным набором полей и сериализации в JSON.",
        "`Map` — для словарей с произвольными (в том числе нестроковыми) ключами, частыми добавлениями/удалениями и нужным порядком вставки.",
        "У `Map` нет унаследованных ключей и проблем с `__proto__`; размер — `map.size`.",
      ),
    ]),
    iq("js.objects-properties.i8", "debugging", "В JSON после `stringify` пропали поля. Как разбираться?", [
      ul(
        "Проверить значения: `undefined`, функции и символы не сериализуются; `NaN`/`Infinity` становятся `null`.",
        "Проверить `enumerable`: неперечислимые свойства не попадают в JSON.",
        "Проверить `toJSON` у вложенных объектов и `replacer`.",
        "Для `BigInt` и циклических структур — `TypeError`: добавить преобразование или разорвать цикл.",
      ),
    ]),
  ],

  exam: [
    mcq("js.objects-properties.e1", "foundation", "В каком порядке `Object.keys` вернёт ключи `{ b: 1, 10: 1, 2: 1, a: 1 }`?", ["`b, 10, 2, a`", "`10, 2, a, b`", "`2, 10, b, a`", "`a, b, 2, 10`"], 2, "Целочисленные ключи идут первыми по возрастанию, затем строки в порядке добавления."),
    mcq("js.objects-properties.e2", "foundation", "Что вернёт `Object.hasOwn({ a: undefined }, \"a\")`?", ["`true`", "`false`", "`undefined`", "Бросит ошибку"], 0, "Свойство `a` существует (значение `undefined`), поэтому `hasOwn` — `true`."),
    mcq("js.objects-properties.e3", "intermediate", "Что произойдёт при `const c = { ...o }; c.nested.x = 1;`, если `nested` — объект?", ["Изменится только копия", "`nested` станет `undefined`", "`TypeError`", "Изменится и `o.nested.x`"], 3, "Spread копирует ссылку на вложенный объект: он общий у копии и оригинала."),
    mcq("js.objects-properties.e4", "intermediate", "Какие значения пропадут (или изменятся) при `JSON.stringify`? Выберите все.", ["`undefined` в свойстве объекта", "Функция в свойстве объекта", "`NaN`", "Строка"], [0, 1, 2], "`undefined` и функции пропускаются, `NaN` превращается в `null`; строки сохраняются."),
    mcq("js.objects-properties.e5", "intermediate", "Что делает `Object.freeze(obj)` с `obj.nested.list`?", ["Замораживает и вложенные объекты", "Ничего: заморозка поверхностная", "Бросает ошибку", "Копирует объект"], 1, "`freeze` действует только на собственные свойства верхнего уровня."),
    mcq("js.objects-properties.e6", "advanced", "Почему рекурсивное слияние `target[key] = …` без проверок опасно для данных из `JSON.parse`?", ["`JSON.parse` создаёт функции", "Ключи JSON всегда числа", "Слияние слишком медленное", "Ключ `__proto__` приводит к записи в `Object.prototype`"], 3, "Замер: после слияния `({}).isAdmin` стало `true` — запись попала в общий прототип."),
    open("js.objects-properties.e7", "intermediate", "Чем свойство-данные отличается от аксессора? Приведите пример применения аксессора.", [
      ul(
        "Свойство-данные хранит `value` (с `writable`); аксессор — пара функций `get`/`set`, которые вызываются при чтении и записи.",
        "Аксессор вычисляет значение (`fahrenheit` из `celsius`) или проверяет вход (запись температуры ниже −273,15 бросает `RangeError`).",
        "В литерале аксессоры перечислимы и попадают в `keys` и JSON; в дескрипторе вместо `value`/`writable` — `get`/`set`.",
      ),
    ], ["Различены хранение и вычисление", "Приведён пример", "Упомянут дескриптор"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.objects-properties.m1", "intermediate", "Что вернёт `\"toString\" in {}` и `Object.hasOwn({}, \"toString\")`?", ["`true` и `true`", "`false` и `false`", "`true` и `false`", "`false` и `true`"], 2, "`toString` унаследован от `Object.prototype`: `in` его видит, `hasOwn` — нет (замер)."),
    mcq("js.objects-properties.m2", "advanced", "Что произойдёт при `Object.defineProperty(o, \"x\", { value: 1 })` и последующем `Object.keys(o)`?", ["`['x']`", "`[]`", "Ошибка", "`['value']`"], 1, "Атрибуты по умолчанию `false`: свойство не перечислимо и не попадает в `keys` (замер)."),
    mcq("js.objects-properties.m3", "advanced", "Чем безопаснее словарь `Object.create(null)` по сравнению с `{}`?", ["У него нет прототипа: нет унаследованных ключей и проблем с `__proto__`", "Он быстрее", "Он неизменяем", "Он поддерживает нестроковые ключи"], 0, "Без прототипа `\"toString\" in obj` — `false`; но методов `hasOwnProperty` нет — используйте `Object.hasOwn`."),
    open("js.objects-properties.m4", "advanced", "Спроектируйте модуль конфигурации приложения: значения по умолчанию, переопределение пользователем, переменные окружения, защита от изменений и от некорректного ввода.", [
      ul(
        "Источники: defaults (замороженный объект) → файл/пользовательский ввод → переменные окружения; слияние безопасным `deepMerge` (без `__proto__`/`constructor`/`prototype`).",
        "Валидация схемой (типы, диапазоны, обязательные поля); ошибки с понятными сообщениями; никаких молчаливых значений по умолчанию для критичных полей.",
        "Результат — глубоко замороженный объект; доступ через геттеры/функции, для секретов — отдельный модуль без экспорта в клиентский код.",
        "Тесты: слияние, `undefined` против `null`, вредоносные ключи, порядок приоритетов.",
      ),
    ], ["Описан порядок источников", "Описана защита от опасных ключей", "Описана валидация", "Описана неизменяемость"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.objects-properties.f1", front: "Порядок ключей?", back: "Целочисленные по возрастанию → строки в порядке добавления → символы (не в keys)." },
    { id: "js.objects-properties.f2", front: "in и hasOwn?", back: "`in` — с прототипами; `Object.hasOwn` — только собственные; `=== undefined` не отличает отсутствие." },
    { id: "js.objects-properties.f3", front: "Копирование?", back: "`{...o}` — поверхностно; `structuredClone` — глубоко; JSON — глубоко, но теряет undefined/функции/Date." },
    { id: "js.objects-properties.f4", front: "defineProperty по умолчанию?", back: "writable, enumerable, configurable = false: не меняется, не в keys/JSON, не удаляется." },
    { id: "js.objects-properties.f5", front: "freeze, seal, preventExtensions?", back: "Нельзя: всё / добавлять+удалять / добавлять. Заморозка поверхностная." },
    { id: "js.objects-properties.f6", front: "Прототипное загрязнение?", back: "Наивное слияние с `__proto__` пишет в Object.prototype. Защита: пропуск ключей, Object.keys, Object.create(null)." },
    { id: "js.objects-properties.f7", front: "Аксессоры?", back: "get/set вычисляют и проверяют значение при чтении/записи; в литерале перечислимы." },
  ],

  sources: [
    { title: "ECMAScript: Objects (внутренние методы, свойства)", url: "https://tc39.es/ecma262/#sec-objects", publisher: "ECMA" },
    { title: "ECMAScript: Property Attributes", url: "https://tc39.es/ecma262/#sec-property-attributes", publisher: "ECMA" },
    { title: "ECMAScript: Object Initializer", url: "https://tc39.es/ecma262/#sec-object-initializer", publisher: "ECMA" },
    { title: "HTML Standard: Safe passing of structured data (structuredClone)", url: "https://html.spec.whatwg.org/multipage/structured-data.html", publisher: "WHATWG" },
    { title: "MDN: Working with objects", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects", publisher: "MDN" },
    { title: "MDN: Object.defineProperty()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty", publisher: "MDN" },
    { title: "MDN: Enumerability and ownership of properties", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Enumerability_and_ownership_of_properties", publisher: "MDN" },
    { title: "MDN: JSON.stringify()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify", publisher: "MDN" },
    { title: "MDN: Object.prototype.__proto__", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto", publisher: "MDN" },
  ],
};
