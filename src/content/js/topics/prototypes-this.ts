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

export const prototypesThis: Topic = {
  id: "js.prototypes-this",
  slug: "prototypes-this",
  domain: "js",
  module: "objects",
  title: "Прототипы, this, call/apply/bind",
  titleEn: "Prototypes, this, call/apply/bind",
  summary:
    "У каждого объекта есть ссылка на прототип — другой объект, в котором ищутся недостающие свойства; цепочка заканчивается на `null`. Конструктор с `new` создаёт объект, связанный с `Constructor.prototype`, а общие методы лежат на прототипе, а не в экземплярах. Значение `this` определяется **способом вызова**: методом (объект слева от точки), обычным вызовом (`undefined` в строгом режиме, глобальный объект в нестрогом), через `call`/`apply`/`bind` или `new`; стрелочная функция берёт `this` из окружения создания. Тема на замерах в Node.js 22 и Chromium 141 разбирает цепочку прототипов, `new` по шагам, потерю `this` (метод, колбэк, таймер, обработчик события), приоритет правил и реализацию собственного `bind`.",
  minutes: 75,
  prerequisites: ["js.objects-properties", "js.closures"],
  tags: ["prototype", "prototype chain", "__proto__", "Object.create", "new", "constructor", "this", "call", "apply", "bind", "arrow function", "instanceof", "inheritance", "lost this", "Reflect.construct"],
  keyConcepts: [
    { term: "Прототип — запасной объект для поиска", text: "Если свойства нет у объекта, поиск идёт по `[[Prototype]]`, затем по его прототипу и так до `null`. Запись всегда создаёт **собственное** свойство: `derived.count++` создала `derived.count = 1`, а `base.count` остался `0` (замер)." },
    { term: "Методы — на прототипе", text: "`a.greet === b.greet` — `true`, если метод лежит на `Person.prototype`; метод, созданный в конструкторе, у каждого экземпляра свой (`new Counter().inc === new Counter().inc` — `false`)." },
    { term: "`this` — это способ вызова", text: "`user.hello()` → `this = user`; `const f = user.hello; f()` → `undefined` (строгий режим); `f.call(obj)` → `obj`; `new F()` → новый объект. Определяется в момент вызова, а не объявления." },
    { term: "Стрелка не имеет своего `this`", text: "`call`, `apply`, `bind` на стрелке `this` не меняют: он берётся из окружения создания. В модуле на верхнем уровне это `undefined`, в классическом скрипте браузера — `window`." },
    { term: "Приоритет: `new` › `bind` › `call/apply` › метод › обычный вызов", text: "Привязанная через `bind` функция игнорирует `call`, но при вызове через `new` привязанный `this` отбрасывается (замер: `new (Box.bind({…}, 2))().v` — `2`)." },
  ],
  sections: [
    section("definition", [
      def("Прототип", "Объект, на который ссылается скрытое поле `[[Prototype]]` другого объекта; в нём ищутся свойства, отсутствующие у самого объекта. Читается через `Object.getPrototypeOf`.", "prototype"),
      def("Цепочка прототипов", "Последовательность объектов `объект → прототип → прототип прототипа → … → null`. Поиск свойства идёт по ней слева направо.", "prototype chain"),
      def("Функция-конструктор", "Обычная функция, вызываемая через `new`: `this` внутри — новый объект, связанный с `Constructor.prototype`.", "constructor function"),
      def("`this`", "Значение, доступное внутри функции и определяемое способом её вызова. У стрелочной функции собственного `this` нет.", "this"),
      def("Привязка `this`", "Правило, по которому вызов определяет `this`: неявная (метод), обычная (по умолчанию), явная (`call`/`apply`/`bind`), `new`, лексическая (стрелка).", "this binding"),
      def("`call` / `apply`", "Вызывают функцию немедленно с заданным `this`: `call(thisArg, a, b)` — аргументы списком, `apply(thisArg, [a, b])` — массивом.", "call / apply"),
      def("`bind`", "Создаёт новую функцию с зафиксированными `this` и (необязательно) первыми аргументами; исходная функция не меняется.", "bind"),
      def("`instanceof`", "Оператор, проверяющий, есть ли `Constructor.prototype` в цепочке прототипов объекта.", "instanceof"),
    ]),

    section("why", [
      h("Две «магии» JavaScript, которые больше не магия"),
      p("Прототипы и `this` вызывают больше всего путаницы у тех, кто приходит из других языков. «Метод есть у объекта, но вызов падает». «Колбэк ломается, когда я передаю метод». «Откуда у моего пустого объекта метод `toString`?» «Почему `instanceof` говорит `true` для родителя?» Всё это следствия двух простых правил: **поиск идёт по цепочке прототипов** и **`this` определяется способом вызова**."),
      ul(
        "**Чтение чужого кода:** библиотеки, старый код и стандартная библиотека построены на прототипах; `class` — надстройка над ними (следующая тема).",
        "**Отладка:** «потеря `this`» — одна из самых частых ошибок при передаче методов в колбэки, таймеры и обработчики.",
        "**Экономия памяти:** общие методы на прототипе не копируются в каждый экземпляр.",
        "**Безопасность:** загрязнение прототипа (предыдущая тема) возможно именно из-за общей цепочки.",
      ),
      insight("Два вопроса снимают 90 % недоразумений: **«Где в цепочке прототипов это свойство?»** и **«Как именно была вызвана эта функция?»**. Не «где объявлена функция» — для `this` это не важно, важен вызов."),
    ]),

    section("mental-model", [
      p("**Прототипы — это порядок обращения в справочные службы.** Вы ищете сведения (свойство) в своём блокноте (объект). Нет — звоните «старшему коллеге» (прототип), у него нет — его старшему, и так до самой верхней инстанции (`Object.prototype`), а у неё «старшего» нет (`null`). Записать новую информацию вы можете только в **собственный** блокнот: запись никогда не меняет блокнот коллеги. Зато если коллега обновил справку, вы получите новую версию при следующем обращении."),
      p("**`this` — это «я» в момент разговора.** Функция — это текст инструкции, в которой написано «мой». Кто такой «мой» — определяет не тот, кто инструкцию написал, а **кто её сейчас читает**. Если читают как `user.hello()`, «я» — `user`. Если инструкцию вынули из папки и прочли «в воздухе» (`const f = user.hello; f()`), «я» нет. Если сказали явно «читай как будто ты Борис» (`call`), «я» — Борис. Стрелочная функция — **записка с готовым «я»**: оно вписано в момент её создания и не меняется."),
      table(
        ["Вызов", "Что такое `this`", "Правило"],
        [
          ["`obj.method()`", "`obj`", "Неявная привязка: объект слева от точки"],
          ["`method()` (оторванный метод)", "`undefined` (строгий) / глобальный объект (нестрогий)", "Привязка по умолчанию"],
          ["`fn.call(a, …)` / `fn.apply(a, […])`", "`a`", "Явная привязка"],
          ["`fn.bind(a)()`", "`a` (навсегда)", "Жёсткая привязка"],
          ["`new F()`", "Новый объект", "Привязка `new`"],
          ["`() => this`", "`this` окружения создания", "Лексическая привязка"],
        ],
        "Правила определения this",
      ),
    ]),

    section("technical", [
      h("Цепочка прототипов"),
      code("js", `const animal = {
  kind: "животное",
  describe() { return \`\${this.name} — \${this.kind}\`; },
};
const dog = Object.create(animal);          // [[Prototype]] объекта dog — animal
dog.name = "Рекс";
dog.kind = "собака";                        // создаёт СОБСТВЕННОЕ свойство, animal.kind не меняется

const puppy = Object.create(dog);
puppy.name = "Шарик";

console.log(dog.describe(), "|", puppy.describe(), "|", animal.kind);
console.log(Object.getPrototypeOf(dog) === animal, Object.getPrototypeOf(animal) === Object.prototype, Object.getPrototypeOf(Object.prototype));
console.log(Object.hasOwn(puppy, "name"), Object.hasOwn(puppy, "kind"), "kind" in puppy);
console.log(animal.isPrototypeOf(puppy), dog.isPrototypeOf(animal));

// for…in идёт по цепочке, Object.keys — нет
const seen = [];
for (const key in puppy) seen.push(key);
console.log(seen, Object.keys(puppy));

// изменение прототипа видно существующим объектам
animal.legs = 4;
console.log(puppy.legs);
delete dog.kind;
console.log(puppy.describe());              // собственное свойство удалено — берём из animal

// запись в унаследованное свойство создаёт собственное
const base = { count: 0 };
const derived = Object.create(base);
derived.count++;
console.log(base.count, derived.count, Object.hasOwn(derived, "count"));

// объект без прототипа
const bare = Object.create(null);
console.log(typeof bare.toString, "toString" in bare, Object.getPrototypeOf(bare));`, { filename: "p1-chain.mjs", lineNumbers: true }),
      code("text", `Рекс — собака | Шарик — собака | животное
true true null
true false true
true false
[ 'name', 'kind', 'describe' ] [ 'name' ]
4
Шарик — животное
0 1 true
undefined false null`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Поиск по цепочке:** `puppy.describe()` не найден у `puppy` и `dog`, взят у `animal`; внутри метода `this` — тот объект, у которого метод вызван (`Шарик`), поэтому имя и вид берутся именно оттуда.",
        "**Затенение собственным свойством:** `dog.kind = \"собака\"` создала собственное свойство и не изменила `animal.kind` (`животное`). После `delete dog.kind` поиск снова доходит до `animal` (`Шарик — животное`).",
        "**Цепочка заканчивается:** `Object.getPrototypeOf(animal) === Object.prototype`, а `Object.getPrototypeOf(Object.prototype)` — `null`.",
        "**Собственное и унаследованное:** `Object.hasOwn(puppy, \"kind\")` — `false`, `\"kind\" in puppy` — `true`; `Object.keys(puppy)` — только `['name']`, а `for…in` перечислил и унаследованные (`['name', 'kind', 'describe']`).",
        "**Прототип — живая ссылка:** свойство `legs`, добавленное в `animal` после создания `puppy`, сразу видно у `puppy` (`4`).",
        "**Запись создаёт собственное свойство:** `derived.count++` прочитала `0` с прототипа и записала `1` в `derived`; `base.count` остался `0`.",
        "**Объект без прототипа:** `Object.create(null)` не имеет даже `toString` (`\"toString\" in bare` — `false`).",
      ),
      note("`__proto__` — унаследованный от `Object.prototype` аксессор, дающий доступ к прототипу; он есть в стандарте для совместимости. В новом коде используйте `Object.getPrototypeOf`, `Object.setPrototypeOf` (редко, смена прототипа существующего объекта плохо оптимизируется) и `Object.create`."),

      h("Функции-конструкторы и оператор `new`"),
      code("js", `function Person(name) {
  this.name = name;                         // собственное свойство каждого экземпляра
  this.id = Symbol();                       // ещё одно
}
Person.prototype.greet = function () {      // общий метод — один на все экземпляры
  return \`Привет, я \${this.name}\`;
};

const a = new Person("Аня");
const b = new Person("Борис");
console.log(a.greet(), "|", b.greet());
console.log(a.greet === b.greet, Object.hasOwn(a, "greet"), Object.keys(a));
console.log(a.constructor === Person, a instanceof Person, Object.getPrototypeOf(a) === Person.prototype);
console.log(Person.prototype.constructor === Person, typeof Person.prototype);

// метод внутри конструктора — своя копия функции у каждого экземпляра
function Counter() { this.inc = () => {}; }
console.log(new Counter().inc === new Counter().inc);

// что делает new: четыре шага
function myNew(Constructor, ...args) {
  const obj = Object.create(Constructor.prototype);   // 1. новый объект с нужным прототипом
  const result = Constructor.apply(obj, args);        // 2. вызов конструктора с this = obj
  return result !== null && (typeof result === "object" || typeof result === "function")
    ? result                                          // 3. если вернули объект — он и результат
    : obj;                                            // 4. иначе — созданный объект
}
const c = myNew(Person, "Вера");
console.log(c.greet(), c instanceof Person, Object.getPrototypeOf(c) === Person.prototype);

// конструктор может вернуть объект
function Weird() { this.a = 1; return { b: 2 }; }
console.log(new Weird(), new (function Prim() { this.a = 1; return 5; })());

// забыли new
try { Person("Без new"); } catch (e) { console.log(e.name + ": " + e.message); }

// изменение прототипа функции не затрагивает уже созданные объекты, а добавление методов — затрагивает
Person.prototype.shout = function () { return this.name.toUpperCase(); };
console.log(a.shout());
const oldProto = Object.getPrototypeOf(a);
Person.prototype = { greet() { return "новый прототип"; } };
console.log(a.greet(), Object.getPrototypeOf(a) === oldProto, new Person("Г").greet());`, { filename: "p2-constructor.mjs", lineNumbers: true }),
      code("text", `Привет, я Аня | Привет, я Борис
true false [ 'name', 'id' ]
true true true
true object
false
Привет, я Вера true true
{ b: 2 } Prim { a: 1 }
TypeError: Cannot set properties of undefined (setting 'name')
АНЯ
Привет, я Аня true новый прототип`, { filename: "вывод Node.js 22.22.0" }),
      steps(
        [
          ["Создание объекта", "Создаётся пустой объект, его `[[Prototype]]` — `Constructor.prototype`."],
          ["Вызов конструктора", "Функция вызывается с `this`, равным этому объекту; в ней заполняются собственные свойства."],
          ["Результат-объект", "Если конструктор вернул объект — результатом `new` будет он (замер: `new Weird()` → `{ b: 2 }`)."],
          ["Иначе — созданный объект", "Возвращаемые примитивы игнорируются (`Prim { a: 1 }`)."],
        ],
        "Что делает new",
      ),
      ul(
        "**Методы на прототипе общие:** `a.greet === b.greet` — `true`, у экземпляра нет собственного `greet` (`Object.keys(a)` — `['name', 'id']`).",
        "**Метод в конструкторе** создаётся заново для каждого экземпляра: `new Counter().inc === new Counter().inc` — `false` (больше памяти, но возможна замкнутая приватность).",
        "**Связи:** `a.constructor === Person` (свойство `constructor` лежит на `Person.prototype`), `a instanceof Person`, `Object.getPrototypeOf(a) === Person.prototype`.",
        "**`myNew`** воспроизвела четыре шага: `Object.create(Constructor.prototype)`, вызов с `this`, выбор результата — и получила экземпляр, неотличимый от настоящего.",
        "**Забыли `new`:** `Person(\"Без new\")` в строгом режиме — `TypeError: Cannot set properties of undefined (setting 'name')` (в нестрогом свойство тихо попало бы в глобальный объект).",
        "**Замена `Person.prototype`:** уже созданный `a` остался связан со **старым** прототипом (`a.greet()` — «Привет, я Аня»), а новый экземпляр получил новый. Добавление методов в существующий прототип, напротив, видно сразу (`a.shout()`).",
      ),

      h("Наследование на прототипах"),
      p("До появления `class` наследование строили вручную: вызвать родительский конструктор для `this`, связать прототипы через `Object.create`, восстановить `constructor`, а «`super`» вызывать через `Родитель.prototype.метод.call(this)`."),
      code("js", `export function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function () {
  return \`\${this.name} издаёт звук\`;
};

export function Dog(name, breed) {
  Animal.call(this, name);                         // вызываем «родительский» конструктор для this
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);   // цепочка: dog → Dog.prototype → Animal.prototype
Dog.prototype.constructor = Dog;                   // восстанавливаем constructor
Dog.prototype.speak = function () {
  return Animal.prototype.speak.call(this) + ": гав";   // «super»: вызов родительского метода
};
Dog.prototype.fetch = function () {
  return \`\${this.name} приносит палку\`;
};`, { filename: "inherit.mjs", lineNumbers: true }),
      code("js", `import { Animal, Dog } from "./inherit.mjs";

const d = new Dog("Рекс", "овчарка");
const a = new Animal("Зверь");
const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);

check("собственные свойства", Object.keys(d), ["name", "breed"]);
check("метод родителя переопределён и вызывает родителя", d.speak(), "Рекс издаёт звук: гав");
check("метод родителя без переопределения", a.speak(), "Зверь издаёт звук");
check("метод потомка", d.fetch(), "Рекс приносит палку");
check("instanceof по цепочке", [d instanceof Dog, d instanceof Animal, a instanceof Dog], [true, true, false]);
check("constructor восстановлен", [d.constructor === Dog, Dog.prototype.constructor === Dog], [true, true]);
check("цепочка прототипов", [Object.getPrototypeOf(d) === Dog.prototype, Object.getPrototypeOf(Dog.prototype) === Animal.prototype], [true, true]);
check("методы общие, не копируются", new Dog("Б", "х").fetch === d.fetch, true);
check("изменение родителя видно потомкам", (() => { Animal.prototype.sleep = () => "zzz"; return d.sleep(); })(), "zzz");
check("fetch нет у родителя", typeof a.fetch, "undefined");

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "inherit-test.mjs", collapsed: true }),
      code("text", `Все 10 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),

      h("Правила `this`"),
      code("js", `"use strict";   // явно: в модуле строгий режим включён и так

const user = {
  name: "Аня",
  hello() { return this === undefined ? "this = undefined" : \`Привет, \${this.name}\`; },
  arrow: () => (typeof this === "undefined" ? "this = undefined" : "this определён"),
};

// 1. Неявная привязка: this — объект слева от точки
console.log(user.hello());

// 2. Потеря this при отрыве метода от объекта
const detached = user.hello;
console.log(detached());

// 3. Явная привязка: call, apply, bind
function intro(greeting, punct) { return \`\${greeting}, \${this.name}\${punct}\`; }
const other = { name: "Борис" };
console.log(intro.call(other, "Привет", "!"), "|", intro.apply(other, ["Здравствуй", "?"]));
const bound = intro.bind(other, "Добрый день");
console.log(bound("."), "|", bound.name, bound.length);
console.log(bound.call({ name: "Игнор" }, "!"));          // bind нельзя перебить call

// 4. Стрелочная функция: this из окружения создания (здесь — модуль)
console.log(user.arrow());
const timer = {
  name: "Таймер",
  regular() { return [1].map(function () { return this; })[0]; },    // this потерян во вложенной функции
  arrow() { return [1].map(() => this.name)[0]; },                   // this унаследован от метода
};
console.log(timer.regular(), timer.arrow());

// 5. new: this — новый объект
function Box(v) { this.v = v; }
console.log(new Box(1).v, new (Box.bind({ ignored: true }, 2))().v);

// 6. Колбэки теряют this
const logger = { prefix: ">>", log(msg) { return this?.prefix + " " + msg; } };
console.log(["a"].map(logger.log)[0], ["a"].map(logger.log, logger)[0], ["a"].map((m) => logger.log(m))[0]);

// 7. Вызов с «цепочкой» и скобками
console.log((user.hello)(), (0, user.hello)());`, { filename: "p3-this.mjs", lineNumbers: true }),
      code("text", `Привет, Аня
this = undefined
Привет, Борис! | Здравствуй, Борис?
Добрый день, Борис. | bound intro 1
Добрый день, Борис!
this = undefined
undefined Таймер
1 2
undefined a >> a >> a
Привет, Аня this = undefined`, { filename: "вывод Node.js 22.22.0 (модуль)" }),
      ul(
        "**Метод:** `user.hello()` — `this = user` («Привет, Аня»).",
        "**Потеря `this`:** `const detached = user.hello; detached()` — `this` равен `undefined` (модуль строгий).",
        "**`call`/`apply`:** одинаковый результат, различие — способ передачи аргументов (списком или массивом).",
        "**`bind`:** `bound` помнит `this` и первый аргумент; имя — `bound intro`, `length` — `1` (из двух параметров один зафиксирован). Повторный `call` на привязанной функции `this` **не меняет**.",
        "**Стрелка:** `user.arrow()` не получила `this = user`: в модуле на верхнем уровне `this` — `undefined`, его и «замкнула» стрелка. А `timer.arrow()` с вложенной стрелкой получила `this` из метода (`Таймер`), тогда как обычная вложенная функция `this` потеряла (`undefined`).",
        "**`new` против `bind`:** `new (Box.bind({ ignored: true }, 2))().v` — `2`: привязанный `this` игнорируется при `new`, а частичный аргумент сохраняется.",
        "**Колбэки:** `[\"a\"].map(logger.log)` — `this` потерян (`undefined a`); решения: второй аргумент `thisArg` у `map`/`forEach` (`>> a`), стрелочная обёртка (`>> a`) или `bind`.",
        "**Скобки не мешают, запятая — да:** `(user.hello)()` сохраняет `this` («Привет, Аня»), а `(0, user.hello)()` отрывает метод от объекта (`undefined`).",
      ),

      h("Нестрогий режим: `this` обычного вызова"),
      code("js", `// без "use strict": this обычного вызова — глобальный объект, а примитив оборачивается в объект
const body = (strict) => \`
  \${strict ? '"use strict";' : ""}
  const obj = {};
  function whoAmI() {
    if (this === globalThis) return "globalThis";
    if (this === obj) return "obj";
    return typeof this + " " + String(this);
  }
  obj.f = whoAmI;
  return {
    "whoAmI()": whoAmI(),
    "obj.f()": obj.f(),
    "(0, obj.f)()": (0, obj.f)(),
    "whoAmI.call(5)": whoAmI.call(5),
    "whoAmI.call(null)": whoAmI.call(null),
  };
\`;
console.log("нестрогий режим:", new Function(body(false))());
console.log("строгий режим:  ", new Function(body(true))());`, { filename: "p3b-sloppy.mjs" }),
      code("text", `нестрогий режим: {
  'whoAmI()': 'globalThis',
  'obj.f()': 'obj',
  '(0, obj.f)()': 'globalThis',
  'whoAmI.call(5)': 'object 5',
  'whoAmI.call(null)': 'globalThis'
}
строгий режим:   {
  'whoAmI()': 'undefined undefined',
  'obj.f()': 'obj',
  '(0, obj.f)()': 'undefined undefined',
  'whoAmI.call(5)': 'number 5',
  'whoAmI.call(null)': 'object null'
}`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Нестрого:** `this` обычного вызова — глобальный объект; `call(null)` тоже даёт глобальный объект; примитив `5` оборачивается в объект (`object 5`).",
        "**Строго:** `this` — ровно то, что передано: `undefined`, `null`, примитив `5` (`number 5`).",
        "**Метод остаётся методом:** `obj.f()` — `this = obj` в обоих режимах.",
      ),

      h("`this` в браузере: обработчики и таймеры"),
      code("html", `<!doctype html>
<meta charset="utf-8">
<button id="b">кнопка</button>
<script>
  // классический скрипт, нестрогий режим
  const r = (window.classicResults = {});
  const b = document.getElementById("b");
  const who = (x) => (x === window ? "window" : x === b ? "button" : x === obj ? "obj" : x === undefined ? "undefined" : typeof x);
  const obj = {
    direct() { r["addEventListener(obj.direct)"] = who(this); },
    viaArrow() { r["addEventListener(() => obj.viaArrow())"] = who(this); },
  };

  b.onclick = function () { r["onclick = function"] = who(this); };
  b.addEventListener("click", function (e) { r["addEventListener(function)"] = who(this) + ", this === currentTarget: " + (this === e.currentTarget); });
  b.addEventListener("click", () => { r["addEventListener(arrow)"] = who(this); });
  b.addEventListener("click", obj.direct);
  b.addEventListener("click", () => obj.viaArrow());
  setTimeout(function () { r["setTimeout(function)"] = who(this); }, 0);
  setTimeout(() => { r["setTimeout(arrow)"] = who(this); }, 0);
</script>
<script type="module">
  const r = (window.moduleResults = {});
  const b = document.getElementById("b");
  const who = (x) => (x === window ? "window" : x === b ? "button" : x === undefined ? "undefined" : typeof x);
  r["this на верхнем уровне"] = who(this);
  b.addEventListener("click", function () { r["addEventListener(function)"] = who(this); });
  b.addEventListener("click", () => { r["addEventListener(arrow)"] = who(this); });
  setTimeout(function () { r["setTimeout(function)"] = who(this); }, 0);
  (function () { r["обычный вызов функции"] = who(this); })();
</script>`, { filename: "this-page.html", collapsed: true }),
      code("text", `классический скрипт:
  setTimeout(function)               window
  setTimeout(arrow)                  window
  onclick = function                 button
  addEventListener(function)         button, this === currentTarget: true
  addEventListener(arrow)            window
  addEventListener(obj.direct)       button
  addEventListener(() => obj.viaArrow()) obj
модуль:
  this на верхнем уровне             undefined
  обычный вызов функции              undefined
  setTimeout(function)               window
  addEventListener(function)         button
  addEventListener(arrow)            undefined
[]`, { filename: "вывод Chromium 141 (по http)" }),
      ul(
        "**Обработчик-функция:** `this` — элемент, на котором сработал обработчик (`this === e.currentTarget`); так же для `onclick = function`.",
        "**Стрелка-обработчик:** `this` из окружения: `window` в классическом скрипте, `undefined` в модуле.",
        "**Метод объекта как обработчик:** `addEventListener(\"click\", obj.direct)` — `this` — кнопка, а не `obj`; обёртка `() => obj.viaArrow()` сохраняет `obj`.",
        "**Таймеры:** `this` в `setTimeout(function …)` — `window` и в классическом скрипте, и в модуле; в Node.js — объект `Timeout` (замер: `Timeout`).",
      ),

      h("Потерянный `this` в таймере и три исправления"),
      code("js", `const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const counter = {
  ticks: 0,
  tick() { this.ticks = (this?.ticks ?? 0) + 1; return this; },
};

setTimeout(function () { console.log("this внутри колбэка таймера в Node.js:", this.constructor.name); }, 0);
await sleep(10);

// Было: метод передан как колбэк — this в таймере не counter
setTimeout(counter.tick, 0);
await sleep(10);
console.log("после setTimeout(counter.tick):", counter.ticks);

// Исправление 1: стрелочная обёртка
setTimeout(() => counter.tick(), 0);
await sleep(10);
console.log("стрелочная обёртка:", counter.ticks);

// Исправление 2: bind
setTimeout(counter.tick.bind(counter), 0);
await sleep(10);
console.log("bind:", counter.ticks);

// Исправление 3: колбэк с явным объектом (у многих методов есть параметр thisArg)
[1, 2].forEach(function () { this.tick(); }, counter);
console.log("thisArg у forEach:", counter.ticks);`, { filename: "x2-lost-this.mjs", lineNumbers: true }),
      code("text", `this внутри колбэка таймера в Node.js: Timeout
после setTimeout(counter.tick): 0
стрелочная обёртка: 1
bind: 2
thisArg у forEach: 4`, { filename: "вывод Node.js 22.22.0" }),
    ]),

    section("syntax", [
      annotated(
        "js",
        `function Person(name) {            // функция-конструктор: имя с заглавной буквы
  this.name = name;                // this — новый объект, созданный оператором new
}

Person.prototype.greet = function () {   // общий метод — лежит на прототипе
  return "Привет, " + this.name;         // this — объект, у которого метод вызван
};

const anna = new Person("Аня");
const greet = anna.greet;

console.log(anna.greet());                       // this = anna
console.log(greet.call({ name: "Борис" }));      // this задан явно
console.log(Object.getPrototypeOf(anna) === Person.prototype);`,
        [
          { line: [1, 3], text: "Функция-конструктор: имя с заглавной буквы. При вызове через `new` `this` — новый объект, и в нём создаётся собственное свойство." },
          { line: [5, 7], text: "Метод кладут на `Person.prototype`: он один на все экземпляры. `this` внутри определяется вызовом (`anna.greet()` → `anna`)." },
          { line: 9, text: "`new Person(\"Аня\")` создаёт объект и связывает его с `Person.prototype`." },
          { line: 10, text: "Извлечение метода в переменную **не** сохраняет объект: `greet` — просто функция." },
          { line: 12, text: "Вызов как метод: `this = anna` → «Привет, Аня»." },
          { line: 13, text: "`call` задаёт `this` явно: тот же метод работает с чужим объектом → «Привет, Борис»." },
          { line: 14, text: "Проверка связи: прототип экземпляра — `Person.prototype` → `true`." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>this в обработчиках</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; }
  table { border-collapse: collapse; margin-top: 1rem; }
  th, td { border: 1px solid #8884; padding: .3rem .7rem; text-align: left; }
  button { font: inherit; padding: .35rem .9rem; }
</style>
<h1>Чему равен <code>this</code>?</h1>
<button id="btn">Нажми меня</button>
<table>
  <thead><tr><th>Как подписан обработчик</th><th>this</th></tr></thead>
  <tbody id="rows"></tbody>
</table>
<script type="module">
  const btn = document.querySelector("#btn");
  const rows = document.querySelector("#rows");

  const app = {
    title: "app",
    describe(t) {
      return t === app ? "app (наш объект)" : t === btn ? "кнопка" : t === undefined ? "undefined" : String(t);
    },
    direct() { show("addEventListener(app.direct)", this); },
    wrapped() { show("() => app.wrapped()", this); },
    bound() { show("addEventListener(app.bound.bind(app))", this); },
  };

  function show(label, t) {
    const tr = rows.insertRow();
    tr.insertCell().textContent = label;
    tr.insertCell().textContent = app.describe(t);
  }

  btn.addEventListener("click", function () { show("function () {…}", this); });
  btn.addEventListener("click", () => show("стрелка () => {…}", this));
  btn.addEventListener("click", app.direct);                          // this потерян: станет кнопкой
  btn.addEventListener("click", () => app.wrapped());                 // this = app
  btn.addEventListener("click", app.bound.bind(app));                 // this = app
</script>`, { filename: "this-demo.html", runnable: true, lineNumbers: true }),
      p("Нажмите кнопку: страница покажет `this` для пяти способов подписки. Замер в Chromium 141: `function () {…}` — кнопка; стрелка в модуле — `undefined`; `app.direct` напрямую — **кнопка** (объект `app` потерян); `() => app.wrapped()` и `app.bound.bind(app)` — `app`."),
    ]),

    section("detailed-example", [
      p("Собственная реализация `bind` — лучший способ увидеть, что это просто обёртка над вызовом: нужно **запомнить `this` и аргументы**, при обычном вызове подставить их, а при вызове через `new` — игнорировать привязанный `this` и создавать объект по исходной функции."),
      code("js", `export function myBind(fn, boundThis, ...boundArgs) {
  if (typeof fn !== "function") throw new TypeError("Привязывать можно только функцию");

  function bound(...args) {
    const allArgs = [...boundArgs, ...args];
    if (new.target) {                                            // вызов через new: привязанный this игнорируется
      return Reflect.construct(fn, allArgs, new.target === bound ? fn : new.target);
    }
    return Reflect.apply(fn, boundThis, allArgs);               // обычный вызов: this зафиксирован
  }

  Object.defineProperty(bound, "name", { value: "bound " + fn.name, configurable: true });
  Object.defineProperty(bound, "length", { value: Math.max(0, fn.length - boundArgs.length), configurable: true });
  return bound;
}`, { filename: "my-bind.mjs", lineNumbers: true }),
      code("js", `import { myBind } from "./my-bind.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);

function intro(greeting, punct) { return \`\${greeting}, \${this.name}\${punct}\`; }
const other = { name: "Борис" };

const mine = myBind(intro, other, "Привет");
const native = intro.bind(other, "Привет");
check("this зафиксирован, аргументы дополняются", mine("!"), "Привет, Борис!");
check("результат совпадает с нативным bind", mine("?"), native("?"));
check("call не перебивает привязку", mine.call({ name: "Игнор" }, "."), "Привет, Борис.");
check("name", mine.name, native.name);
check("length", mine.length, native.length);

function Point(x, y) { this.x = x; this.y = y; }
const BoundPoint = myBind(Point, { ignored: true }, 1);
const p = new BoundPoint(2);
check("new игнорирует привязанный this", [p.x, p.y, p.ignored], [1, 2, undefined]);
check("instanceof работает для исходной функции", p instanceof Point, true);

const arrow = myBind(() => typeof this, { x: 1 });
check("стрелочную функцию привязать к this нельзя", arrow(), "undefined");

const add = (a, b, c) => a + b + c;
check("частичное применение без this", myBind(add, null, 1, 2)(3), 6);

let message = "нет ошибки";
try { myBind(42, {}); } catch (e) { message = e.name; }
check("не функция", message, "TypeError");

const counter = { n: 0, inc() { this.n++; return this.n; } };
const inc = myBind(counter.inc, counter);
inc(); inc();
check("метод, оторванный от объекта, сохраняет this", counter.n, 2);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "my-bind-test.mjs", collapsed: true }),
      code("text", `Все 11 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает", "Почему так"],
        [
          ["`function bound(...args)` вместо стрелки", "Нужен собственный `new.target`", "У стрелки нет `new.target` и она не может вызываться через `new`"],
          ["`[...boundArgs, ...args]`", "Склеивает зафиксированные и новые аргументы", "Частичное применение: первые аргументы уже заданы"],
          ["`if (new.target)` → `Reflect.construct(fn, allArgs, …)`", "При `new` создаёт объект по исходной функции", "Привязанный `this` игнорируется, `instanceof fn` работает (проверено: `p instanceof Point`)"],
          ["`Reflect.apply(fn, boundThis, allArgs)`", "Обычный вызов с зафиксированным `this`", "`call` не перебивает привязку, потому что `bound` сам вызывает `fn` с `boundThis`"],
          ["`defineProperty(bound, \"name\", …)` и `length`", "Воспроизводит `name` и `length` нативного `bind`", "`bound intro` и `max(0, fn.length − частичные)`; это свойства только для чтения, поэтому нужен `defineProperty`"],
        ],
        "Разбор myBind",
      ),
      ul(
        "Все 11 проверок проходят: поведение совпадает с нативным `bind` (результат, `name`, `length`), `call` на привязанной функции, `new`, `instanceof`, частичное применение без `this`, ошибка для не-функции, метод, оторванный от объекта.",
        "**Стрелку перепривязать нельзя:** `myBind(() => typeof this, …)()` вернула `undefined` — `this` стрелки лексический (в модуле — `undefined`).",
        "**Ограничение:** упрощённая реализация не воспроизводит все детали стандарта (например, прототип привязанной функции для особых случаев наследования).",
      ),
    ]),

    section("internals", [
      h("`[[Prototype]]` и поиск свойства"),
      p("Каждый объект имеет внутреннее поле `[[Prototype]]` (объект или `null`). Операция чтения свойства `[[Get]]` проверяет собственные свойства, затем рекурсивно — прототип. Запись `[[Set]]` для обычного свойства-данных создаёт **собственное** свойство, если только в цепочке нет аксессора (тогда вызывается сеттер) или неизменяемого свойства (`writable: false` запрещает запись и через наследование)."),
      h("`Constructor.prototype` и `[[Prototype]]`"),
      p("Не путайте: у **функции** есть обычное свойство `prototype` — объект, который станет `[[Prototype]]` экземпляров, созданных через `new`. А `[[Prototype]]` самой функции — `Function.prototype`. Стрелочные функции и методы-сокращения не имеют свойства `prototype` и потому не могут быть конструкторами (замеры выше и в теме о функциях)."),
      h("Как определяется `this`"),
      p("Внутри вызова движок вычисляет **ссылку** (`Reference`): для `user.hello` это пара «базовый объект `user` + имя `hello`». При вызове `this` берётся из базового объекта. Если вызываемое выражение — не ссылка (результат группировки с запятой `(0, user.hello)`, переменная `detached`), базового объекта нет, и `this` — `undefined` (строго) или глобальный объект (нестрого). Поэтому `(user.hello)()` сохраняет `this` (скобки возвращают ссылку), а `(0, user.hello)()` — нет (запятая возвращает значение)."),
      h("Стрелочные функции"),
      p("У стрелки нет привязки `this` (а также `arguments`, `super`, `new.target`): `this` ищется как обычное имя в **лексическом окружении**, то есть берётся из внешней функции или области модуля/скрипта. Поэтому `call`, `apply`, `bind` на стрелке влияют только на аргументы."),
      h("`instanceof` и цепочка"),
      p("`a instanceof F` проверяет, встречается ли `F.prototype` в цепочке прототипов `a`. Поэтому замена `F.prototype` после создания объекта делает `a instanceof F` ложным (замер: `a` остался связан со старым прототипом). Для собственных правил проверки можно определить статический `Symbol.hasInstance`."),
      h("Почему методы на прототипе экономят память"),
      p("Один объект-функция `greet` хранится на `Person.prototype` и разделяется всеми экземплярами; при методе в конструкторе создаётся отдельная функция на каждый экземпляр (замер: `new Counter().inc === new Counter().inc` — `false`). Для тысяч объектов разница заметна, для единиц — нет."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Передавать метод как колбэк без привязки"),
      wrongRight(
        "js",
        {
          code: `
            setTimeout(counter.tick, 1000);        // this не counter
            button.addEventListener("click", app.onClick);   // this — кнопка
          `,
          note: "Метод отрывается от объекта: `this` определяется вызывающим кодом (в замере `counter.ticks` остался `0`).",
        },
        {
          code: `
            setTimeout(() => counter.tick(), 1000);
            button.addEventListener("click", () => app.onClick());
          `,
          note: "Стрелочная обёртка вызывает метод через объект. Альтернатива — `bind` или стрелка как свойство.",
        },
      ),
      h("Ошибка 2. Использовать обычную функцию внутри метода"),
      p("`[1].map(function () { return this; })` — `this` потерян (`undefined`, замер). Используйте стрелку или `thisArg`."),
      h("Ошибка 3. Стрелка как метод объекта"),
      p("`{ arrow: () => this }` не получит `this = объект`: стрелка берёт `this` окружения (в модуле — `undefined`). Для методов используйте сокращённую запись `method() {}`."),
      h("Ошибка 4. Забыть `new`"),
      p("`Person(\"Аня\")` без `new` — `TypeError` в строгом режиме и тихая запись в глобальный объект — в нестрогом. Используйте `class` (он запрещает вызов без `new`) или проверку `new.target`."),
      h("Ошибка 5. Заменить `prototype` после создания экземпляров"),
      p("`Person.prototype = { … }` не затрагивает уже созданные объекты (замер). Добавляйте методы в существующий объект прототипа."),
      h("Ошибка 6. Перебор `for…in` без проверки собственных свойств"),
      p("`for…in` перечисляет и унаследованные свойства (замер: `['name', 'kind', 'describe']`). Используйте `Object.keys`/`entries`."),
      h("Ошибка 7. Расширять встроенные прототипы"),
      p("`Array.prototype.myMethod = …` меняет все массивы приложения и может конфликтовать с будущими версиями языка и библиотеками; перечисляется в `for…in`. Пишите отдельные функции."),
      h("Ошибка 8. Ждать, что `call`/`bind` изменят `this` стрелки"),
      p("`this` стрелки не изменить (замер `myBind`: результат `undefined`). Если нужен гибкий `this`, используйте обычную функцию."),
    ]),

    section("antipatterns", [
      ul(
        "**`const self = this` и `that = this`** вместо стрелочных функций в современном коде.",
        "**Ручное наследование через `__proto__`-присваивание** и `Object.setPrototypeOf` в «горячем» коде.",
        "**Методы, определённые в конструкторе** для больших коллекций объектов.",
        "**Расширение `Object.prototype` и других встроенных объектов.**",
        "**Глубокие цепочки наследования** (более 3 уровней): трудно понять, где метод.",
        "**Опора на `constructor` для проверки типа:** свойство перезаписываемо; лучше `instanceof` или явный признак.",
        "**Смешение стилей:** конструкторы-функции, `class` и фабрики в одном модуле без причины.",
        "**`call`/`apply` ради «жонглирования» `this`,** когда достаточно передать объект аргументом.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Определяйте `this` по вызову:** прочитайте строку вызова — слева от точки стоит объект или нет.",
        "**Передаёте метод как колбэк — оберните его** (стрелка или `bind`) либо используйте `thisArg`.",
        "**Для методов — сокращённая запись и `class`;** стрелки — для колбэков и вложенных функций.",
        "**Общие методы — на прототипе (в `class`),** состояние — в экземпляре.",
        "**Проверяйте связь через `instanceof`/`Object.getPrototypeOf`,** а не через `constructor`.",
        "**Создавайте объекты с нужным прототипом через `Object.create` или `class`,** а не меняйте прототип постфактум.",
        "**Не расширяйте встроенные прототипы;** оформляйте утилиты как функции.",
        "**Пишите в модулях (строгий режим):** потерянный `this` проявляется сразу ошибкой, а не тихой записью в глобальный объект.",
      ),
      tip("Когда видите `Cannot read properties of undefined (reading 'x')` внутри метода, первым делом проверьте, **как** вызван метод: не оторван ли он от объекта (`const f = obj.method`, колбэк, обработчик)."),
    ]),

    section("edge-cases", [
      h("`this` в `new.target`-проверке"),
      p("`new.target` внутри функции равен `undefined` при обычном вызове и самой функции при вызове через `new`: так можно защититься от вызова без `new`."),
      h("Свойство `constructor`"),
      p("`constructor` — обычное свойство объекта `Person.prototype`. При полной замене `Person.prototype = {…}` оно теряется (будет унаследовано `Object`), поэтому его восстанавливают вручную (как в `inherit.mjs`)."),
      h("Примитивы и методы"),
      p("`\"текст\".toUpperCase()` работает потому, что движок временно оборачивает примитив в объект `String`, у которого прототип — `String.prototype`. В строгом режиме `this` внутри метода-расширения остаётся примитивом (замер: `whoAmI.call(5)` — `number 5`), в нестрогом — объект-обёртка (`object 5`)."),
      h("`globalThis` и `this` в функциях"),
      p("В нестрогом режиме обычный вызов даёт `this = globalThis` (и `call(null)` — тоже); в строгом — `undefined` и `null` соответственно (замеры выше)."),
      h("Связанные функции и `new`"),
      p("`new` на привязанной функции игнорирует привязанный `this` и использует исходную функцию как конструктор, сохраняя частичные аргументы (замер: `Box.bind({…}, 2)` → `v = 2`)."),
      h("Прототипы встроенных объектов"),
      p("Массив → `Array.prototype` → `Object.prototype` → `null`; функция → `Function.prototype` → `Object.prototype`. Поэтому `[].toString` и `(() => 1).hasOwnProperty` существуют: их определили «старшие» прототипы."),
    ]),

    section("related", [
      ul(
        "[Объекты и свойства](/learn/js/objects-properties) — собственные и унаследованные свойства, дескрипторы.",
        "[Замыкания](/learn/js/closures) — лексическое окружение, которое «запоминают» стрелки.",
        "[Функции: основы](/learn/js/functions-basics) — стрелки, `new`, конструкторы.",
        "[Контекст исполнения](/learn/js/execution-context-scope) — стек вызовов и окружения.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Копия метода в каждом экземпляре и потеря this",
          code: `
            function Counter() {
              var self = this;
              this.count = 0;
              this.inc = function () { self.count++; };     // своя функция у каждого экземпляра
            }
            setTimeout(counter.inc, 0);                      // работает только благодаря self
          `,
          note: "Обходной путь `self` и копия функции на каждый объект; в «чужом» контексте метод всё равно ненадёжен.",
        },
        {
          title: "Метод на прототипе и стрелочная обёртка",
          code: `
            function Counter() { this.count = 0; }
            Counter.prototype.inc = function () { this.count++; };
            setTimeout(() => counter.inc(), 0);              // this = counter
          `,
          note: "Общий метод, а контекст вызова задаётся явно (в следующей теме то же — через `class`).",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.prototypes-this.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код (модуль, строгий режим), скажите, что напечатает каждая строка, и для каждого вызова назовите правило привязки `this`."),
        code("js", `const obj = {
  name: "A",
  regular() { return this?.name; },
  arrow: () => typeof this,
  nested() { return [1].map(function () { return this?.name; })[0]; },
  nestedArrow() { return [1].map(() => this.name)[0]; },
};
const { regular } = obj;

console.log(obj.regular(), regular(), (obj.regular)(), (0, obj.regular)());
console.log(obj.arrow(), obj.nested(), obj.nestedArrow());
console.log(obj.regular.call({ name: "B" }), obj.regular.bind({ name: "C" }).call({ name: "D" }));

function Foo() { this.x = 1; }
Foo.prototype.getX = function () { return this.x; };
const f = new Foo();
const getX = f.getX;
console.log(f.getX(), Object.getPrototypeOf(f) === Foo.prototype, f.hasOwnProperty("getX"));
try { getX(); } catch (e) { console.log(e.name); }`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Объект слева от точки есть?", "Что возвращает `(0, obj.regular)`?"],
      checks: ["Для каждого вызова названо правило", "Объяснены `undefined` для оторванных методов", "Объяснён приоритет `bind` над `call`"],
      solution: [
        code("text", `A undefined A undefined
undefined undefined A
B C
1 true false
TypeError`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "`obj.regular()` — метод, `this = obj` → `A`; `regular()` — оторванный → `this` `undefined` → `undefined`; `(obj.regular)()` — скобки сохраняют ссылку → `A`; `(0, obj.regular)()` — запятая отрывает → `undefined`.",
          "`obj.arrow()` — стрелка берёт `this` модуля (`undefined`) → `\"undefined\"`; `obj.nested()` — обычная вложенная функция в `map` → `this` `undefined`; `obj.nestedArrow()` — стрелка берёт `this` метода → `A`.",
          "`call({ name: \"B\" })` → `B`; `bind({ name: \"C\" }).call({ name: \"D\" })` → `C`: привязка `bind` сильнее `call`.",
          "`f.getX()` → `1`; прототип `f` — `Foo.prototype` → `true`; метод не собственный → `false`; `getX()` без объекта → `this` `undefined` → `TypeError`.",
        ),
      ],
    }),
    exercise({
      id: "js.prototypes-this.ex2",
      title: "Таймер не считает",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("После `setTimeout(counter.tick, 0)` значение `counter.ticks` остаётся `0`. Объясните, чему равен `this` в колбэке таймера, и исправьте тремя способами."),
      ],
      hints: ["Как вызывает колбэк таймер: как метод `counter` или как обычную функцию?", "Какие способы фиксируют `this`?"],
      checks: ["Назван `this` колбэка (в Node.js — `Timeout`)", "Три исправления: обёртка, `bind`, `thisArg`", "Счётчик растёт"],
      solution: [
        code("js", `const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const counter = {
  ticks: 0,
  tick() { this.ticks = (this?.ticks ?? 0) + 1; return this; },
};

setTimeout(function () { console.log("this внутри колбэка таймера в Node.js:", this.constructor.name); }, 0);
await sleep(10);

// Было: метод передан как колбэк — this в таймере не counter
setTimeout(counter.tick, 0);
await sleep(10);
console.log("после setTimeout(counter.tick):", counter.ticks);

// Исправление 1: стрелочная обёртка
setTimeout(() => counter.tick(), 0);
await sleep(10);
console.log("стрелочная обёртка:", counter.ticks);

// Исправление 2: bind
setTimeout(counter.tick.bind(counter), 0);
await sleep(10);
console.log("bind:", counter.ticks);

// Исправление 3: колбэк с явным объектом (у многих методов есть параметр thisArg)
[1, 2].forEach(function () { this.tick(); }, counter);
console.log("thisArg у forEach:", counter.ticks);`, { filename: "x2-lost-this.mjs" }),
        code("text", `this внутри колбэка таймера в Node.js: Timeout
после setTimeout(counter.tick): 0
стрелочная обёртка: 1
bind: 2
thisArg у forEach: 4`, { filename: "вывод Node.js 22.22.0" }),
        p("Таймер вызывает колбэк как обычную функцию, а не как метод `counter`: в Node.js `this` — объект `Timeout` (замер), в браузере — `window`. Исправления: `() => counter.tick()`, `counter.tick.bind(counter)` или `thisArg` у `forEach`/`map`."),
      ],
    }),
    exercise({
      id: "js.prototypes-this.ex3",
      title: "Наследование на прототипах",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Без `class` реализуйте `Animal(name)` с методом `speak` и `Dog(name, breed)`, наследующий `Animal`: `Dog` переопределяет `speak`, вызывая родительский метод, и добавляет `fetch`. Проверьте `instanceof`, `constructor`, цепочку прототипов, то, что методы общие, и что изменения в `Animal.prototype` видны экземплярам `Dog`."),
      ],
      hints: ["Как вызвать родительский конструктор для текущего `this`?", "Что нужно сделать с `Dog.prototype.constructor` после `Object.create`?"],
      checks: ["`d instanceof Animal` и `d instanceof Dog`", "`constructor` восстановлен", "«super»-вызов метода родителя", "Методы общие"],
      solution: [
        code("js", `export function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function () {
  return \`\${this.name} издаёт звук\`;
};

export function Dog(name, breed) {
  Animal.call(this, name);                         // вызываем «родительский» конструктор для this
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);   // цепочка: dog → Dog.prototype → Animal.prototype
Dog.prototype.constructor = Dog;                   // восстанавливаем constructor
Dog.prototype.speak = function () {
  return Animal.prototype.speak.call(this) + ": гав";   // «super»: вызов родительского метода
};
Dog.prototype.fetch = function () {
  return \`\${this.name} приносит палку\`;
};`, { filename: "inherit.mjs" }),
        code("text", `Все 10 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
        p("`Animal.call(this, name)` создаёт собственные свойства родителя; `Object.create(Animal.prototype)` связывает цепочку; `constructor` нужно вернуть вручную, потому что новый объект прототипа его не имеет. `Animal.prototype.speak.call(this)` — ручной аналог `super.speak()`."),
      ],
    }),
  ],

  challenge: {
    id: "js.prototypes-this.challenge",
    title: "Собственный bind",
    scenario: [
      p("В старом окружении нет `Function.prototype.bind`. Реализуйте модуль `my-bind.mjs` с функцией `myBind(fn, boundThis, ...boundArgs)`, воспроизводящей поведение нативного `bind`."),
    ],
    requirements: [
      "Возвращает новую функцию; при обычном вызове исходная функция получает `this = boundThis` и аргументы `[...boundArgs, ...args]`",
      "`call`/`apply` на результате `this` не меняют",
      "При вызове через `new` привязанный `this` игнорируется, объект создаётся по исходной функции (`instanceof` работает), частичные аргументы сохраняются",
      "`name` результата — `\"bound \" + fn.name`, `length` — `max(0, fn.length − boundArgs.length)`",
      "Для не-функции бросает `TypeError`",
    ],
    constraints: [
      "Не использовать `Function.prototype.bind` внутри реализации",
      "Без внешних библиотек",
    ],
    acceptance: [
      "Все 11 проверок из теста проходят",
      "Результаты совпадают с нативным `bind` на одинаковых входах",
      "`new` на привязанной функции создаёт объект исходного конструктора",
    ],
    hints: [
      "Как отличить вызов через `new` от обычного вызова?",
      "Чем заменить прямой вызов `fn(...)`, чтобы задать `this`?",
      "Как задать `name` и `length`, если они только для чтения?",
    ],
    solution: [
      code("js", `export function myBind(fn, boundThis, ...boundArgs) {
  if (typeof fn !== "function") throw new TypeError("Привязывать можно только функцию");

  function bound(...args) {
    const allArgs = [...boundArgs, ...args];
    if (new.target) {                                            // вызов через new: привязанный this игнорируется
      return Reflect.construct(fn, allArgs, new.target === bound ? fn : new.target);
    }
    return Reflect.apply(fn, boundThis, allArgs);               // обычный вызов: this зафиксирован
  }

  Object.defineProperty(bound, "name", { value: "bound " + fn.name, configurable: true });
  Object.defineProperty(bound, "length", { value: Math.max(0, fn.length - boundArgs.length), configurable: true });
  return bound;
}`, { filename: "my-bind.mjs", lineNumbers: true }),
      code("text", `Все 11 проверок пройдены`, { filename: "результат запуска тестов" }),
      p("Различение вызовов — через `new.target`; обычный вызов — `Reflect.apply(fn, boundThis, allArgs)`, конструирование — `Reflect.construct(fn, allArgs, …)`; `name` и `length` настраиваются через `Object.defineProperty`."),
    ],
  },

  interview: [
    iq("js.prototypes-this.i1", "basic", "Что такое прототип и цепочка прототипов?", [
      p("Прототип — объект, на который ссылается `[[Prototype]]` другого объекта. Если свойства нет у объекта, поиск продолжается в прототипе, затем в его прототипе и так до `null`. Запись всегда создаёт собственное свойство, а не изменяет прототип."),
    ]),
    iq("js.prototypes-this.i2", "basic", "Чему равен `this` и от чего он зависит?", [
      ul(
        "Определяется способом вызова: метод (`obj.f()`) — `obj`; обычный вызов — `undefined` в строгом режиме, глобальный объект в нестрогом; `call`/`apply`/`bind` — заданный объект; `new` — новый объект.",
        "Стрелочная функция не имеет своего `this` и берёт его из окружения создания.",
      ),
    ]),
    iq("js.prototypes-this.i3", "intermediate", "Почему `const f = obj.method; f()` ломается и как исправить?", [
      ul(
        "При вызове `f()` нет объекта слева от точки: `this` — `undefined` (строго) или глобальный объект.",
        "Исправления: `obj.method.bind(obj)`, стрелочная обёртка `() => obj.method()`, `call`/`apply`, стрелка-свойство.",
        "Типичные места: колбэки, таймеры, обработчики событий.",
      ),
    ]),
    iq("js.prototypes-this.i4", "intermediate", "Чем `call`, `apply` и `bind` отличаются?", [
      ul(
        "`call(thisArg, a, b)` — вызывает сразу, аргументы списком.",
        "`apply(thisArg, [a, b])` — вызывает сразу, аргументы массивом.",
        "`bind(thisArg, a)` — возвращает новую функцию с зафиксированными `this` и первыми аргументами; вызова не происходит.",
        "На стрелочных функциях `this` не меняется ни одним из них.",
      ),
    ]),
    iq("js.prototypes-this.i5", "intermediate", "Что делает оператор `new`?", [
      ul(
        "Создаёт новый объект с `[[Prototype]] = Constructor.prototype`.",
        "Вызывает конструктор с `this`, равным этому объекту.",
        "Если конструктор вернул объект, результат — он; иначе — созданный объект.",
        "Поэтому методы на `Constructor.prototype` доступны экземплярам, а `instanceof` проверяет цепочку.",
      ),
    ]),
    iq("js.prototypes-this.i6", "advanced", "Чем отличается метод на прототипе от метода в конструкторе?", [
      ul(
        "На прототипе — одна функция на всех (`a.greet === b.greet`), экономия памяти, можно менять для всех сразу.",
        "В конструкторе — отдельная функция на экземпляр (`new Counter().inc !== new Counter().inc`), зато возможны замыкания и приватные данные.",
        "В современном коде методы пишут в `class` (прототипные), а приватные данные — через `#поля`.",
      ),
    ]),
    iq("js.prototypes-this.i7", "engineering", "Как реализовать наследование без `class`?", [
      ul(
        "`function Child(...) { Parent.call(this, ...); }` — собственные свойства родителя.",
        "`Child.prototype = Object.create(Parent.prototype); Child.prototype.constructor = Child;` — цепочка.",
        "«super» — `Parent.prototype.method.call(this, ...)`.",
        "Сегодня то же выражает `class Child extends Parent` с `super`.",
      ),
    ]),
    iq("js.prototypes-this.i8", "debugging", "В обработчике события `this` оказывается не тем объектом. Как найти причину?", [
      ul(
        "Определить, как подписан обработчик: обычная функция (`this` — элемент), стрелка (`this` из окружения), метод объекта напрямую (`this` — элемент).",
        "Добавить `console.log(this)` и посмотреть, элемент это, `window` или `undefined`.",
        "Исправить: стрелочная обёртка, `bind` или `event.currentTarget`/замыкание над нужным объектом.",
        "Не использовать стрелку там, где нужен `this` элемента (и наоборот).",
      ),
    ]),
  ],

  exam: [
    mcq("js.prototypes-this.e1", "foundation", "Чему равно `this` при `user.hello()`?", ["`undefined`", "`window`", "`user`", "Функции `hello`"], 2, "Метод вызван с объектом слева от точки: `this` — этот объект."),
    mcq("js.prototypes-this.e2", "foundation", "Что вернёт `Object.getPrototypeOf(Object.prototype)`?", ["`null`", "`undefined`", "`Object`", "`Function.prototype`"], 0, "Цепочка прототипов заканчивается на `null` (замер)."),
    mcq("js.prototypes-this.e3", "intermediate", "Чему равно `this` в `setTimeout(obj.method, 0)` в модуле Chromium?", ["`obj`", "`document`", "`undefined`", "`window`"], 3, "Колбэк таймера вызывается как обычная функция браузером с `this = window` (замер); `obj` потерян."),
    mcq("js.prototypes-this.e4", "intermediate", "Что сделает `f.bind(a).call(b)` с `this` внутри `f`?", ["`this = b`", "`this = a`", "`undefined`", "`TypeError`"], 1, "Привязанный `this` нельзя перебить `call` (замер: `Добрый день, Борис!`)."),
    mcq("js.prototypes-this.e5", "intermediate", "Какие утверждения о стрелочных функциях верны? Выберите все.", ["У неё нет собственного `this`", "`new` на ней работает", "`call` не меняет её `this`", "У неё нет свойства `prototype`"], [0, 2, 3], "Стрелка берёт `this` из окружения создания и не является конструктором."),
    mcq("js.prototypes-this.e6", "advanced", "Что произойдёт, если после `const a = new Person()` выполнить `Person.prototype = { greet() {} }`?", ["`a` получит новый `greet`", "Бросится `TypeError`", "`a instanceof Person` останется `true`", "`a` останется связан со старым прототипом"], 3, "`[[Prototype]]` экземпляра фиксируется при создании; после замены `prototype` `a` указывает на старый объект (замер)."),
    open("js.prototypes-this.e7", "intermediate", "Объясните, почему `button.addEventListener(\"click\", app.onClick)` теряет `app` и как это исправить.", [
      ul(
        "Браузер вызывает обработчик с `this = button` (для обычных функций), а не как `app.onClick()`.",
        "Метод оторван от объекта: `app` из `this` недоступен.",
        "Решения: `() => app.onClick()`, `app.onClick.bind(app)`, стрелка-свойство в классе, `handleEvent`.",
        "Для стрелки в модуле `this` — не `app` и не кнопка: используйте `event.currentTarget`.",
      ),
    ], ["Объяснён `this = button`", "Назван оторванный метод", "Предложены два решения"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.prototypes-this.m1", "intermediate", "Что вернёт `(0, obj.method)()` в строгом режиме?", ["Метод с `this = obj`", "`TypeError` при разборе", "Метод с `this = undefined`", "Метод с `this = window`"], 2, "Запятая возвращает значение, а не ссылку: базового объекта нет (замер: `undefined`)."),
    mcq("js.prototypes-this.m2", "advanced", "Какой `this` получит `new (Box.bind({ a: 1 }, 2))()`?", ["`{ a: 1 }`", "Новый объект (привязанный `this` игнорируется)", "`undefined`", "`Box`"], 1, "При `new` привязанный `this` отбрасывается, частичные аргументы сохраняются (замер: `v = 2`)."),
    mcq("js.prototypes-this.m3", "advanced", "Почему `a.greet === b.greet` истинно для методов на `Person.prototype`?", ["Оба обращения находят одну и ту же функцию на прототипе", "Функции сравниваются по тексту", "`greet` скопирован в каждый экземпляр", "`===` для функций всегда `true`"], 0, "Поиск свойства доходит до `Person.prototype`, где лежит единственный объект-функция."),
    open("js.prototypes-this.m4", "advanced", "Проектируете библиотеку с тысячами объектов-моделей (по 20 методов) и обработчиками событий. Что выберете для методов и `this` и почему?", [
      ul(
        "Методы — на прототипе (`class`): одна копия на все экземпляры, что экономит память и ускоряет создание объектов.",
        "Обработчики событий — стрелочные обёртки или стрелки-свойства, созданные один раз на экземпляр (если нужна ссылка для `removeEventListener`), либо делегирование событий на общий контейнер.",
        "Приватные данные — `#поля` вместо замыканий в конструкторе (без копии функций).",
        "Избегать `bind` в «горячих» путях (создаёт новую функцию при каждом вызове); измерять профайлером, а не угадывать.",
        "Тесты на «потерю this» при передаче методов в колбэки.",
      ),
    ], ["Выбраны методы на прототипе", "Описана работа с обработчиками", "Упомянуты приватные поля", "Упомянуты замеры"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.prototypes-this.f1", front: "Цепочка прототипов?", back: "Поиск: объект → прототип → … → null. Запись создаёт собственное свойство, не меняет прототип." },
    { id: "js.prototypes-this.f2", front: "Что делает new?", back: "Создаёт объект с [[Prototype]] = F.prototype, вызывает F с this = объект, возвращает объект (или объект из return)." },
    { id: "js.prototypes-this.f3", front: "Правила this?", back: "obj.f() → obj; f() → undefined/global; call/apply/bind → заданный; new → новый; стрелка → из окружения." },
    { id: "js.prototypes-this.f4", front: "Потеря this?", back: "const f = obj.m; f() — this нет. Колбэки/таймеры/обработчики. Лечится стрелкой-обёрткой, bind, thisArg." },
    { id: "js.prototypes-this.f5", front: "bind vs call?", back: "call/apply вызывают сразу; bind возвращает новую функцию с зафиксированным this (call его не перебивает; new — отбрасывает)." },
    { id: "js.prototypes-this.f6", front: "Метод на прототипе?", back: "Один на все экземпляры (a.greet === b.greet); в конструкторе — своя копия на объект." },
    { id: "js.prototypes-this.f7", front: "this в обработчике?", back: "function → элемент (currentTarget); стрелка → из окружения (window/undefined в модуле); obj.method напрямую → элемент." },
  ],

  sources: [
    { title: "ECMAScript: Ordinary and Exotic Objects' Behaviours ([[Get]], [[Set]], [[Prototype]])", url: "https://tc39.es/ecma262/#sec-ordinary-and-exotic-objects-behaviours", publisher: "ECMA" },
    { title: "ECMAScript: The new operator", url: "https://tc39.es/ecma262/#sec-new-operator", publisher: "ECMA" },
    { title: "ECMAScript: Function.prototype.bind", url: "https://tc39.es/ecma262/#sec-function.prototype.bind", publisher: "ECMA" },
    { title: "ECMAScript: Arrow Function Definitions (this)", url: "https://tc39.es/ecma262/#sec-arrow-function-definitions", publisher: "ECMA" },
    { title: "HTML Standard: Timers", url: "https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers", publisher: "WHATWG" },
    { title: "DOM Standard: EventTarget (обработчики событий)", url: "https://dom.spec.whatwg.org/#interface-eventtarget", publisher: "WHATWG" },
    { title: "MDN: Inheritance and the prototype chain", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain", publisher: "MDN" },
    { title: "MDN: this", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this", publisher: "MDN" },
    { title: "MDN: Function.prototype.bind()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind", publisher: "MDN" },
  ],
};
