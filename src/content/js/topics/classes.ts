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
  steps,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const classes: Topic = {
  id: "js.classes",
  slug: "classes",
  domain: "js",
  module: "objects",
  title: "Классы",
  titleEn: "Classes",
  summary:
    "`class` — это удобный синтаксис над функциями-конструкторами и прототипами: методы по-прежнему лежат на `Class.prototype`, а `typeof` класса — `function`. Но у классов есть собственные правила: вызов без `new` — `TypeError`, объявление находится в временной мёртвой зоне, тело строгое, методы неперечислимы, есть поля, приватные `#`-члены, статические члены, `extends`/`super` и `new.target`. Тема на замерах в Node.js 22 и Chromium 141 разбирает объявление и поля, приватность (и её пределы), наследование (включая порядок инициализации полей и ошибки `super`), наследование от встроенных `Error`, `Array`, `Map`, поля-стрелки против методов, композицию и миксины, и учит строить `EventEmitter` на приватном состоянии.",
  minutes: 80,
  prerequisites: ["js.prototypes-this"],
  tags: ["class", "constructor", "extends", "super", "static", "private field", "#private", "getter", "setter", "new.target", "mixin", "composition", "Error", "polymorphism", "abstract class"],
  keyConcepts: [
    { term: "Класс — синтаксис над прототипами", text: "`typeof Point` — `function`, методы лежат на `Point.prototype` (`p.move === other.move` — `true`), `Object.getPrototypeOf(p) === Point.prototype`. Но методы неперечислимы (`Object.keys(Point.prototype)` — `[]`)." },
    { term: "Классы строже функций", text: "`Point(1, 2)` без `new` — `TypeError: Class constructor Point cannot be invoked without 'new'`; использование до объявления — `ReferenceError` (TDZ); тело класса всегда в строгом режиме." },
    { term: "`#private` — настоящая приватность", text: "Приватные поля и методы недоступны снаружи и в подклассах; `acc.#balance` вне класса — `SyntaxError`, в `Object.keys` и `JSON` их нет. Проверка `#balance in obj` определяет «наш» экземпляр." },
    { term: "`super()` — первым", text: "В `constructor` подкласса до `super()` нельзя трогать `this`: `ReferenceError: Must call super constructor in derived class before accessing 'this'…`. Если `super()` не вызван вовсе, ошибка та же." },
    { term: "Поля инициализируются до тела конструктора", text: "Родительский конструктор, вызвавший переопределённый метод, видит у подкласса `field` равным `undefined`: поля потомка ещё не созданы (замер). Инициализатор поля выполняется, даже если тело конструктора потом бросит ошибку." },
  ],
  sections: [
    section("definition", [
      def("Класс", "Шаблон создания объектов: конструктор, методы (на прототипе), поля экземпляров, статические и приватные члены. Объявляется ключевым словом `class`.", "class"),
      def("Конструктор (`constructor`)", "Специальный метод, вызываемый при `new`: инициализирует экземпляр. У класса может быть только один.", "constructor"),
      def("Поле класса", "Свойство экземпляра, объявленное в теле класса: `x = 0;`. Инициализируется перед телом конструктора (в подклассе — сразу после `super()`).", "class field"),
      def("Приватный член (`#name`)", "Поле или метод, доступный только внутри тела класса. Имя начинается с `#`; доступ снаружи — синтаксическая ошибка.", "private member"),
      def("Статический член (`static`)", "Поле или метод, принадлежащий самому классу, а не экземплярам; наследуется подклассами через цепочку конструкторов.", "static member"),
      def("`extends` и `super`", "`extends` связывает прототипы класса и родителя (и самих конструкторов); `super(...)` вызывает родительский конструктор, `super.method()` — родительский метод.", "extends / super"),
      def("`new.target`", "Мета-свойство внутри конструктора: класс, вызванный через `new`; позволяет реализовать абстрактные классы.", "new.target"),
      def("Композиция", "Способ строить поведение из объектов-компонентов («имеет»), а не наследованием («является»); зависимости передаются в конструктор.", "composition"),
    ]),

    section("why", [
      h("Классы — стандартный способ описывать сущности"),
      p("Модели данных, компоненты интерфейса, сервисы, ошибки, обёртки над API браузера — большая часть современного кода использует классы. Они читаются знакомо, поддерживают приватные поля и наследование и хорошо инструментируются. Но класс — это те же прототипы и `this`, поэтому ошибки у него те же: потерянный `this`, неверный порядок инициализации, чрезмерное наследование."),
      ul(
        "**Чтение кода:** фреймворки и библиотеки часто выставляют API в виде классов и требуют наследования или расширения (`extends Error`, `extends HTMLElement`).",
        "**Инкапсуляция:** `#приватные` члены — реальный способ скрыть детали без замыканий.",
        "**Ошибки:** собственные классы ошибок (`ValidationError`) — основа обработки исключений.",
        "**Проектирование:** понимание композиции и наследования позволяет выбирать между ними осознанно.",
      ),
      insight("Класс отвечает на вопрос «**какие у объектов общие данные и поведение**». Но в JavaScript есть и другие способы: фабрики, замыкания, модули с функциями. Выбирайте класс, когда нужны **множество однотипных объектов с состоянием и методами**, и не создавайте классы «ради структуры» там, где достаточно функции."),
    ]),

    section("mental-model", [
      p("**Класс — это чертёж и цех одновременно.** Чертёж (`class`) описывает, какие детали есть у каждого изделия (поля) и что оно умеет (методы). Цех (`constructor`) собирает изделие, когда вы говорите `new`. Умения хранятся **в общем каталоге** (на прототипе), а не в каждом изделии, — поэтому `a.move === b.move`. **Приватные детали** (`#balance`) — внутри корпуса: даже мастер из соседнего цеха (подкласс) не может их открыть. **Наследование** — «изделие нового типа строится на основе старого»: сначала цех родителя собирает основу (`super()`), потом цех потомка добавляет своё. А **статические члены** — это принадлежности самого завода (счётчик выпущенных изделий), а не отдельного изделия."),
      table(
        ["Элемент", "Где хранится", "Доступ", "Пример"],
        [
          ["Метод", "`Class.prototype` (общий)", "Экземпляры и подклассы", "`move()`"],
          ["Поле", "Экземпляр (собственное свойство)", "Публично", "`label = \"…\"`"],
          ["Приватное поле/метод", "Экземпляр (скрыто)", "Только внутри тела класса", "`#balance`"],
          ["Статический член", "Сам класс (функция-конструктор)", "`Class.member`, наследуется подклассами", "`static count`"],
          ["Аксессор", "`Class.prototype`", "Как свойство", "`get length()`"],
          ["Поле-стрелка", "Экземпляр (своя функция)", "Публично; `this` закреплён", "`onClick = () => {…}`"],
        ],
        "Что где живёт в классе",
      ),
    ]),

    section("technical", [
      h("Объявление класса, поля, аксессоры, статические члены"),
      code("js", `class Point {
  static origin = { x: 0, y: 0 };               // статическое поле: принадлежит классу, не экземплярам
  static distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }   // статический метод

  x;                                            // публичные поля
  y = 0;                                        // поле со значением по умолчанию

  constructor(x, y = 0) {
    this.x = x;
    this.y = y;
  }

  get length() { return Math.hypot(this.x, this.y); }       // аксессор
  set length(value) {
    const k = value / this.length;
    this.x *= k; this.y *= k;
  }

  toString() { return \`(\${this.x}, \${this.y})\`; }
  move(dx, dy) { return new Point(this.x + dx, this.y + dy); }
}

const p = new Point(3, 4);
console.log(\`\${p}\`, p.length, Point.distance(p, Point.origin));
p.length = 10;
console.log(String(p), p.length);

// класс — это функция; методы лежат на прототипе
console.log(typeof Point, Object.getPrototypeOf(p) === Point.prototype, Point.prototype.constructor === Point);
console.log(p.move === new Point(1, 1).move, Object.keys(p), Object.keys(Point.prototype));
console.log(Object.getOwnPropertyDescriptor(Point.prototype, "move").enumerable);

// отличия от функции-конструктора
try { Point(1, 2); } catch (e) { console.log(e.name + ": " + e.message); }
try { new Later(); } catch (e) { console.log(e.name + ": " + e.message); }
class Later {}
const { move } = p;
try { move(1, 1); } catch (e) { console.log(e.name + ": " + e.message); }
console.log(typeof Point.distance, typeof p.distance, p instanceof Point);`, { filename: "k1-basics.mjs", lineNumbers: true }),
      code("text", `(3, 4) 5 5
(6, 8) 10
function true true
true [ 'x', 'y' ] []
false
TypeError: Class constructor Point cannot be invoked without 'new'
ReferenceError: Cannot access 'Later' before initialization
TypeError: Cannot read properties of undefined (reading 'x')
function undefined true`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Класс — функция:** `typeof Point` — `function`; `Object.getPrototypeOf(p) === Point.prototype`; `Point.prototype.constructor === Point`.",
        "**Методы общие и неперечислимы:** `p.move === new Point(1, 1).move` — `true`; `Object.keys(p)` — `['x', 'y']` (только поля), `Object.keys(Point.prototype)` — `[]`, дескриптор `move` — `enumerable: false`. Поэтому `for…in` по экземпляру не показывает методы класса (в отличие от методов, присвоенных в `Person.prototype.greet = …`).",
        "**Аксессоры** `get length()` / `set length(value)` ведут себя как свойство: `p.length = 10` пропорционально изменила координаты (`(6, 8)`).",
        "**Статика:** `Point.distance(…)` вызывается у класса, `p.distance` — `undefined`. Статические поля (`Point.origin`) — общие данные класса.",
        "**`toString` и шаблонные строки:** подстановка `p` в шаблонную строку использует `toString()` → `(3, 4)`.",
        "**Без `new`:** `Point(1, 2)` — `TypeError: Class constructor Point cannot be invoked without 'new'` (у функции-конструктора вызов без `new` не запрещён).",
        "**TDZ:** `new Later()` до объявления — `ReferenceError: Cannot access 'Later' before initialization`: `class` ведёт себя как `let`.",
        "**Строгий код:** метод, извлечённый из объекта (`const { move } = p`), теряет `this`: `TypeError: Cannot read properties of undefined (reading 'x')` — тело класса всегда строгое, поэтому нет тихого перехода к `globalThis`.",
      ),

      h("Приватные поля и методы"),
      code("js", `class Account {
  #balance = 0;                                   // приватное поле: видно только внутри тела класса
  static #count = 0;                              // приватное статическое поле

  constructor(owner, initial = 0) {
    this.owner = owner;
    this.#balance = initial;
    Account.#count++;
  }

  deposit(amount) {
    this.#assertPositive(amount);
    this.#balance += amount;
    return this;
  }

  get balance() { return this.#balance; }

  #assertPositive(amount) {                       // приватный метод
    if (!(amount > 0)) throw new RangeError("Сумма должна быть положительной");
  }

  static get count() { return Account.#count; }
  static isAccount(value) { return #balance in value; }   // проверка наличия приватного поля
}

const acc = new Account("Аня", 100).deposit(50);
new Account("Борис");
console.log(acc.balance, Account.count, acc.owner);

// снаружи приватное недоступно
console.log(acc.balance, Object.keys(acc), JSON.stringify(acc), acc["#balance"]);
try { acc.balance = 1; } catch (e) { console.log(e.name + ": " + e.message); }
try { new Function("acc", "return acc.#balance")(acc); } catch (e) { console.log(e.name + ": " + e.message); }
try { acc.deposit(-5); } catch (e) { console.log(e.name + ": " + e.message); }

// #x in obj — признак «настоящего» экземпляра
console.log(Account.isAccount(acc), Account.isAccount({ balance: 1 }));

// подкласс не видит приватное родителя
class Savings extends Account {
  peek() { return this.balance; }               // публичный аксессор доступен
}
const s = new Savings("Вера", 10);
console.log(s.peek(), Account.isAccount(s));

// копирование теряет приватное
const copy = structuredClone(acc);
console.log(Object.getPrototypeOf(copy) === Object.prototype, "balance" in copy);`, { filename: "k2-private.mjs", lineNumbers: true }),
      code("text", `150 2 Аня
150 [ 'owner' ] {"owner":"Аня"} undefined
TypeError: Cannot set property balance of #<Account> which has only a getter
SyntaxError: Private field '#balance' must be declared in an enclosing class
RangeError: Сумма должна быть положительной
true false
10 true
true false`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Недоступны снаружи:** `Object.keys(acc)` — `['owner']`, `JSON.stringify(acc)` — `{\"owner\":\"Аня\"}`, `acc[\"#balance\"]` — `undefined` (это обычный ключ-строка, а не приватное поле).",
        "**Обращение вне класса — `SyntaxError`:** `acc.#balance` вне тела класса — `SyntaxError: Private field '#balance' must be declared in an enclosing class` (ошибка при разборе, а не при выполнении).",
        "**Аксессор без сеттера:** `acc.balance = 1` в строгом режиме — `TypeError: Cannot set property balance of #<Account> which has only a getter`.",
        "**Приватные методы** (`#assertPositive`) и статические (`static #count`) работают так же; проверка наличия поля — `#balance in value`: `true` для настоящего `Account`, `false` для обычного объекта.",
        "**Подкласс не видит приватное родителя** и работает через публичный интерфейс (`this.balance`); при этом `Account.isAccount(savings)` — `true`: приватное поле создано конструктором родителя в том же объекте.",
        "**Копирование:** `structuredClone(acc)` вернул обычный объект без прототипа `Account` и без `balance`: приватное состояние и методы класса не клонируются.",
      ),
      note("Приватные члены — **жёсткая** приватность на уровне языка. Соглашение «подчёркивание в начале имени» (`_balance`) — только договорённость, снаружи это обычное свойство."),

      h("Наследование: `extends`, `super`, `new.target`"),
      code("js", `class Shape {
  constructor(name) {
    if (new.target === Shape) throw new TypeError("Shape — абстрактный класс");
    this.name = name;
  }
  area() { throw new Error(\`\${this.constructor.name} должен реализовать area()\`); }
  describe() { return \`\${this.name}: площадь \${this.area().toFixed(2)}\`; }
  static create(...args) { return new this(...args); }            // this — тот класс, у которого вызвали
}

class Rect extends Shape {
  constructor(w, h) {
    super("прямоугольник");                       // обязателен до обращения к this
    this.w = w; this.h = h;
  }
  area() { return this.w * this.h; }
}

class Square extends Rect {
  constructor(side) { super(side, side); this.name = "квадрат"; }
  describe() { return super.describe() + " (сторона " + this.w + ")"; }   // вызов родительского метода
}

class Blob extends Shape {
  constructor() { super("клякса"); }
}

try { new Shape("x"); } catch (e) { console.log(e.name + ": " + e.message); }
console.log(new Rect(2, 3).describe());
console.log(new Square(4).describe());
try { new Blob().describe(); } catch (e) { console.log(e.name + ": " + e.message); }
console.log(Square.create(5).describe());

const sq = new Square(2);
console.log(sq instanceof Square, sq instanceof Rect, sq instanceof Shape, sq instanceof Blob);
console.log(Object.getPrototypeOf(Square) === Rect, Object.getPrototypeOf(Square.prototype) === Rect.prototype);
console.log(Object.keys(sq));

// забыли super
class Broken extends Shape {
  constructor() { this.x = 1; super("b"); }
}
try { new Broken(); } catch (e) { console.log(e.name + ": " + e.message); }
class NoSuper extends Shape {
  constructor() { }
}
try { new NoSuper(); } catch (e) { console.log(e.name + ": " + e.message); }`, { filename: "k3-inheritance.mjs", lineNumbers: true }),
      code("text", `TypeError: Shape — абстрактный класс
прямоугольник: площадь 6.00
квадрат: площадь 16.00 (сторона 4)
Error: Blob должен реализовать area()
квадрат: площадь 25.00 (сторона 5)
true true true false
true true
[ 'name', 'w', 'h' ]
ReferenceError: Must call super constructor in derived class before accessing 'this' or returning from derived constructor
ReferenceError: Must call super constructor in derived class before accessing 'this' or returning from derived constructor`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Абстрактный класс:** `new.target === Shape` в конструкторе запрещает создание `Shape` напрямую (`TypeError`), а метод, бросающий `Error`, требует реализации в подклассе (`Blob должен реализовать area()`).",
        "**Цепочка:** `Square → Rect → Shape`: `sq instanceof Square/Rect/Shape` — `true`, `instanceof Blob` — `false`; `Object.getPrototypeOf(Square) === Rect` (наследуются и статические члены), `Object.getPrototypeOf(Square.prototype) === Rect.prototype`.",
        "**`super(...)`** вызывает конструктор родителя и создаёт `this`; до него `this` недоступен: `ReferenceError: Must call super constructor in derived class before accessing 'this' or returning from derived constructor` (та же ошибка — если `super()` вообще не вызван).",
        "**`super.method()`** вызывает родительский метод (`Square.describe` дополнил результат `Rect`).",
        "**`static create(...args) { return new this(...args); }`:** `this` — тот класс, у которого вызвали метод, поэтому `Square.create(5)` вернул `Square`.",
        "**Поля подкласса:** `Object.keys(sq)` — `['name', 'w', 'h']` (сначала поле родителя `name`, затем собственные).",
      ),

      h("Порядок инициализации и `this` в полях"),
      code("js", `class Button {
  label;
  clicks = 0;
  onClickArrow = () => { this.clicks++; return this.label; };     // поле-стрелка: у каждого экземпляра своя функция
  constructor(label) { this.label = label; }                       // порядок: поля инициализируются до тела конструктора
  onClickMethod() { this.clicks++; return this.label; }            // метод: общий, на прототипе
}

const a = new Button("A");
const b = new Button("B");
console.log(a.onClickMethod === b.onClickMethod, a.onClickArrow === b.onClickArrow);
console.log(Object.keys(a));

const { onClickMethod, onClickArrow } = a;
try { onClickMethod(); } catch (e) { console.log("метод:", e.name + ": " + e.message); }
console.log("стрелка:", onClickArrow(), a.clicks);

// порядок инициализации
class Base {
  constructor() { this.init(); }
  init() { console.log("Base.init, значение поля Child:", this.field); }
}
class Child extends Base {
  field = "задано";
  init() { console.log("Child.init, значение поля:", this.field); }
}
new Child();
console.log(new Child().field);

// инициализаторы полей выполняются до тела конструктора — даже если оно потом бросит ошибку
let created = 0;
class Tracked {
  id = ++created;
  constructor() { throw new Error("конструктор не удался"); }
}
try { new Tracked(); } catch { /* объект не создан */ }
console.log("инициализатор поля выполнился:", created);`, { filename: "k5-fields-this.mjs", lineNumbers: true }),
      code("text", `true false
[ 'label', 'clicks', 'onClickArrow' ]
метод: TypeError: Cannot read properties of undefined (reading 'clicks')
стрелка: A 1
Child.init, значение поля: undefined
Child.init, значение поля: undefined
задано
инициализатор поля выполнился: 1`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Метод и поле-стрелка:** `a.onClickMethod === b.onClickMethod` — `true` (один метод на прототипе), `a.onClickArrow === b.onClickArrow` — `false` (своя функция у каждого экземпляра, поэтому в `Object.keys(a)` она есть).",
        "**Потеря `this`:** извлечённый метод падает (`Cannot read properties of undefined (reading 'clicks')`), а поле-стрелка работает (`A`, `clicks` — `1`). Платить приходится памятью: стрелка создаётся для каждого объекта.",
        "**Порядок:** родительский конструктор вызвал `this.init()`, переопределённый в `Child`, — и увидел `field` равным `undefined`: поля потомка инициализируются **после** возврата из `super()`. После создания `new Child().field` — `задано`.",
        "**Инициализатор до тела:** `id = ++created` выполнился, хотя тело конструктора затем бросило ошибку (`created` — `1`).",
      ),
      warn("Не вызывайте переопределяемые методы из конструктора родителя: подкласс ещё не инициализирован. Если нужна «инициализация после создания», вынесите её в отдельный метод (`init()`), вызываемый снаружи."),

      h("Наследование от встроенных классов"),
      code("js", `// собственная ошибка
class ValidationError extends Error {
  constructor(field, message, options) {
    super(message, options);                      // options.cause — причина
    this.name = "ValidationError";
    this.field = field;
  }
}

try {
  try { JSON.parse("{"); }
  catch (cause) { throw new ValidationError("body", "Некорректный JSON", { cause }); }
} catch (e) {
  console.log(e.name, "|", e.message, "|", e.field, "|", e.cause.name);
  console.log(e instanceof ValidationError, e instanceof Error, String(e), typeof e.stack, e.stack.split("\\n")[0]);
  console.log(Object.keys(e), JSON.stringify(e));
}

// наследование от Array: методы возвращают экземпляр подкласса
class Stack extends Array {
  peek() { return this[this.length - 1]; }
  get top() { return this.peek(); }
}
const s = Stack.of(1, 2, 3);
console.log(s.peek(), s.length, Array.isArray(s), s instanceof Stack);
const mapped = s.map((x) => x * 2);
console.log(mapped instanceof Stack, mapped.peek(), s.filter((x) => x > 1) instanceof Stack);
s.push(4);
console.log(s.length, s.top, [...s]);

// наследование от Map
class DefaultMap extends Map {
  constructor(factory, entries) { super(entries); this.factory = factory; }
  get(key) {
    if (!this.has(key)) this.set(key, this.factory(key));
    return super.get(key);
  }
}
const groups = new DefaultMap(() => []);
groups.get("a").push(1);
groups.get("a").push(2);
groups.get("b").push(3);
console.log([...groups], groups.size);`, { filename: "k4-builtins.mjs", lineNumbers: true }),
      code("text", `ValidationError | Некорректный JSON | body | SyntaxError
true true ValidationError: Некорректный JSON string ValidationError: Некорректный JSON
[ 'name', 'field' ] {"name":"ValidationError","field":"body"}
3 3 true true
true 6 true
4 4 [ 1, 2, 3, 4 ]
[ [ 'a', [ 1, 2 ] ], [ 'b', [ 3 ] ] ] 2`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Собственные ошибки:** `ValidationError extends Error` сохраняет трассировку (`stack`), работает с `instanceof` (`ValidationError` и `Error`), принимает `cause` (`{ cause }` — причина исходной ошибки). Имя задаёт `this.name`; поле `field` — собственное свойство, попадающее в `Object.keys` и JSON, в отличие от `message` и `stack`.",
        "**`extends Array`:** `Stack.of(1, 2, 3)` — настоящий массив (`Array.isArray` — `true`), `map` и `filter` возвращают экземпляры подкласса (`mapped instanceof Stack`), `push` обновляет `length`.",
        "**`extends Map`:** `DefaultMap` переопределяет `get` и вызывает `super.get`, создавая значение по умолчанию («словарь списков»).",
        "**Осторожность:** подклассы встроенных типов хрупки (методы вызывают друг друга); для расширения часто лучше композиция (`has-a`).",
      ),

      h("Композиция и миксины"),
      code("js", `// Миксин: функция, принимающая класс и возвращающая подкласс с добавленным поведением
const Serializable = (Base) => class extends Base {
  toJSON() { return { type: this.constructor.name, ...this }; }
};
const Timestamped = (Base) => class extends Base {
  createdAt = "2024-01-01";
};

class Entity {
  constructor(id) { this.id = id; }
}
class User extends Serializable(Timestamped(Entity)) {
  constructor(id, name) { super(id); this.name = name; }
}

const u = new User(1, "Аня");
console.log(JSON.stringify(u));
console.log(u instanceof Entity, u instanceof User, u.createdAt);

// Композиция: объект получает возможности через поля, а не через наследование
class Logger {
  log(message) { return \`[log] \${message}\`; }
}
class Store {
  #logger;
  #items = new Map();
  constructor(logger) { this.#logger = logger; }          // зависимость передаётся снаружи
  set(key, value) { this.#items.set(key, value); return this.#logger.log(\`set \${key}\`); }
  get size() { return this.#items.size; }
}
const store = new Store(new Logger());
console.log(store.set("a", 1), store.size);

// подмена зависимости в тесте — наследование для этого не нужно
const silent = { log: () => "(тихо)" };
console.log(new Store(silent).set("b", 2));`, { filename: "k6-composition.mjs", lineNumbers: true }),
      code("text", `{"type":"User","id":1,"createdAt":"2024-01-01","name":"Аня"}
true true 2024-01-01
[log] set a 1
(тихо)`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Миксин** — функция, принимающая класс и возвращающая подкласс с добавленным поведением: `Serializable(Timestamped(Entity))`. Обходит отсутствие множественного наследования, но делает цепочку прототипов длинной.",
        "**Композиция:** `Store` получает `logger` через конструктор и хранит его в приватном поле; в тесте подставляется замена (`silent`) без создания подкласса.",
        "**Правило:** «является» — наследование (`Square` — `Rect`); «имеет» или «использует» — композиция (`Store` использует `Logger`).",
      ),
    ]),

    section("syntax", [
      annotated(
        "js",
        `class Rectangle {
  static unit() { return new Rectangle(1, 1); }   // статический метод — у класса, не у экземпляров

  #area;                                           // приватное поле (только внутри класса)
  label = "прямоугольник";                         // публичное поле

  constructor(width, height) {                     // вызывается оператором new
    this.width = width;
    this.height = height;
    this.#area = width * height;
  }

  get area() { return this.#area; }                // геттер: читается как свойство
  describe() { return \`\${this.label} \${this.width}×\${this.height}\`; }   // метод на прототипе
}

class Square extends Rectangle {                   // наследование
  constructor(side) {
    super(side, side);                             // вызов конструктора родителя
    this.label = "квадрат";
  }
  describe() { return super.describe() + "!"; }    // вызов метода родителя
}

console.log(new Square(3).describe(), new Square(3).area, Rectangle.unit().describe());`,
        [
          { line: 1, text: "Объявление класса: имя с заглавной буквы, тело в фигурных скобках. Тело — строгий режим." },
          { line: 2, text: "`static` — метод класса: вызывается как `Rectangle.unit()`, не доступен экземплярам." },
          { line: 4, text: "Приватное поле `#area`: объявляется в теле класса, доступно только внутри него." },
          { line: 5, text: "Публичное поле с начальным значением; создаётся для каждого экземпляра перед телом конструктора." },
          { line: [7, 11], text: "`constructor` вызывается оператором `new`: заполняет поля экземпляра и вычисляет приватное значение." },
          { line: 13, text: "Геттер `area`: читается как свойство (`rect.area`), возвращает приватное значение; сеттера нет — записать нельзя." },
          { line: 14, text: "Обычный метод: лежит на `Rectangle.prototype` и общий для всех экземпляров." },
          { line: 17, text: "`extends` делает `Square` потомком `Rectangle`: цепочка прототипов и наследование статических членов." },
          { line: 19, text: "`super(side, side)` вызывает конструктор родителя; до этой строки `this` недоступен." },
          { line: 22, text: "`super.describe()` вызывает родительский метод, результат дополняется." },
          { line: 25, text: "Результат: `квадрат 3×3! 9 прямоугольник 1×1`." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Список задач</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 28rem; }
  form { display: flex; gap: .5rem; }
  input { flex: 1; font: inherit; padding: .3rem .5rem; }
  button { font: inherit; padding: .3rem .8rem; }
  ul { padding: 0; list-style: none; }
  li { padding: .25rem 0; cursor: pointer; }
  li.done { text-decoration: line-through; color: #888; }
</style>
<h1>Список задач</h1>
<form id="form"><input id="text" aria-label="Новая задача" placeholder="Что сделать?" required><button>Добавить</button></form>
<ul id="list"></ul>
<p id="summary" role="status"></p>
<script type="module">
  class TaskList {
    #items = [];                                   // состояние скрыто от внешнего кода
    #nextId = 1;
    #root;
    #summary;

    constructor(root, summary) {
      this.#root = root;
      this.#summary = summary;
      root.addEventListener("click", this.#onClick);      // стрелка-поле сохраняет this
    }

    add(text) {
      const title = text.trim();
      if (!title) return false;
      this.#items.push({ id: this.#nextId++, title, done: false });
      this.#render();
      return true;
    }

    toggle(id) {
      const item = this.#items.find((i) => i.id === id);
      if (item) item.done = !item.done;
      this.#render();
    }

    get remaining() { return this.#items.filter((i) => !i.done).length; }

    #onClick = (event) => {
      const li = event.target.closest("li");
      if (li) this.toggle(Number(li.dataset.id));
    };

    #render() {
      this.#root.replaceChildren(
        ...this.#items.map((item) => {
          const li = document.createElement("li");
          li.textContent = item.title;
          li.dataset.id = item.id;
          li.classList.toggle("done", item.done);
          return li;
        }),
      );
      this.#summary.textContent = \`Осталось: \${this.remaining} из \${this.#items.length}\`;
    }
  }

  const tasks = new TaskList(document.querySelector("#list"), document.querySelector("#summary"));
  const form = document.querySelector("#form");
  const text = document.querySelector("#text");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (tasks.add(text.value)) form.reset();
  });
  tasks.add("Прочитать про классы");
  tasks.add("Написать тесты");
</script>`, { filename: "tasks.html", runnable: true, lineNumbers: true }),
      p("Класс `TaskList` скрывает состояние в приватных полях (`#items`, `#nextId`), использует приватный метод `#render` и поле-стрелку `#onClick` (this закреплён за экземпляром). Замер в Chromium 141: старт — «Осталось: 2 из 2», после клика по первой задаче — «Осталось: 1 из 2» (задача зачёркнута), после ввода «Выпить чаю» — «Осталось: 2 из 3»; пустая задача не добавляется (`required`); ошибок страницы нет."),
    ]),

    section("detailed-example", [
      p("Класс `EventEmitter` — типичная основа: подписка (`on`) с возвратом функции отписки, одноразовая подписка (`once`), `off`, `emit` и `listenerCount`. Приватный `#handlers` недоступен снаружи; обработчики хранятся в неизменяемых массивах, поэтому отписка внутри `emit` не нарушает обход; пустые списки не накапливаются."),
      code("js", `export class EventEmitter {
  #handlers = new Map();                       // имя события → массив обработчиков

  on(event, handler) {
    if (typeof handler !== "function") throw new TypeError("Обработчик должен быть функцией");
    const list = this.#handlers.get(event) ?? [];
    this.#handlers.set(event, [...list, handler]);
    return () => this.off(event, handler);     // функция отписки
  }

  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    return this.on(event, wrapper);
  }

  off(event, handler) {
    const list = this.#handlers.get(event);
    if (!list) return false;
    const next = list.filter((h) => h !== handler);
    if (next.length === list.length) return false;
    if (next.length) this.#handlers.set(event, next);
    else this.#handlers.delete(event);         // не храним пустые списки
    return true;
  }

  emit(event, ...args) {
    const list = this.#handlers.get(event);
    if (!list) return false;
    for (const handler of list) handler(...args);   // обходим снимок списка: изменения во время emit безопасны
    return true;
  }

  listenerCount(event) {
    return this.#handlers.get(event)?.length ?? 0;
  }
}`, { filename: "emitter.mjs", lineNumbers: true }),
      code("js", `import { EventEmitter } from "./emitter.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);

const e = new EventEmitter();
const log = [];
const off = e.on("data", (x) => log.push("a" + x));
e.on("data", (x) => log.push("b" + x));
check("emit возвращает true при наличии обработчиков", e.emit("data", 1), true);
check("обработчики вызываются по порядку", log, ["a1", "b1"]);
check("emit без обработчиков", e.emit("nothing"), false);

off();
e.emit("data", 2);
check("после отписки обработчик не вызывается", log, ["a1", "b1", "b2"]);
check("повторная отписка безопасна", [off(), e.listenerCount("data")], [false, 1]);

const onceLog = [];
e.once("ping", (v) => onceLog.push(v));
e.emit("ping", 1); e.emit("ping", 2);
check("once срабатывает один раз", onceLog, [1]);
check("после once счётчик нулевой", e.listenerCount("ping"), 0);

const order = [];
const e2 = new EventEmitter();
const h1 = () => { order.push("h1"); e2.off("x", h1); };
e2.on("x", h1);
e2.on("x", () => order.push("h2"));
e2.emit("x"); e2.emit("x");
check("отписка внутри обработчика не пропускает соседей", order, ["h1", "h2", "h2"]);

check("приватное состояние недоступно", [Object.keys(e), JSON.stringify(e), e.handlers], [[], "{}", undefined]);

let err = "нет";
try { e.on("x", 42); } catch (ex) { err = ex.name; }
check("не функция", err, "TypeError");

const e3 = new EventEmitter();
const received = [];
e3.on("m", function (...args) { received.push(args); });
e3.emit("m", 1, "два", { три: 3 });
check("аргументы передаются как есть", received, [[1, "два", { "три": 3 }]]);

class Chat extends EventEmitter {
  send(text) { return this.emit("message", text); }
}
const chat = new Chat();
const got = [];
chat.on("message", (t) => got.push(t));
chat.send("привет");
check("наследование от EventEmitter", [got, chat instanceof EventEmitter], [["привет"], true]);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "emitter-test.mjs", collapsed: true }),
      code("text", `Все 12 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Решение", "Что даёт", "Почему так"],
        [
          ["`#handlers = new Map()`", "Приватное хранилище «событие → обработчики»", "Снаружи не изменить (`Object.keys(e)` — `[]`, `JSON.stringify(e)` — `{}`, `e.handlers` — `undefined`)"],
          ["`[...list, handler]` и `filter` вместо `push`/`splice`", "Новые массивы при каждом изменении", "Обход в `emit` идёт по старому массиву: подписка/отписка внутри обработчика безопасны (проверено: `h1` отписался, `h2` не пропущен)"],
          ["`return () => this.off(event, handler)`", "Функция отписки (стрелка, `this` — эмиттер)", "Каждая подписка получает собственный способ отмены — замыкание"],
          ["`once` через обёртку", "Одноразовый обработчик", "Обёртка снимает себя до вызова исходной функции; повторный `emit` её уже не найдёт"],
          ["`this.#handlers.delete(event)` при пустом списке", "Нет утечки пустых записей", "`listenerCount` и `emit` корректно работают для «забытых» событий"],
          ["`handler(...args)`", "Передача аргументов как есть", "Эмиттер ничего не знает о содержимом событий"],
        ],
        "Разбор EventEmitter",
      ),
      ul(
        "Все 12 проверок проходят: порядок вызова, возвращаемое значение `emit`, отписка (в том числе повторная), `once`, отписка внутри обработчика, приватность, проверка типа обработчика, передача аргументов, наследование (`class Chat extends EventEmitter`).",
        "**Ограничение:** исключение в одном обработчике прерывает остальные; в промышленных реализациях его ловят и пробрасывают отдельно (`try`/`catch` вокруг вызова).",
      ),
    ]),

    section("internals", [
      h("Что превращается в прототипы"),
      p("Объявление `class A { method() {} }` создаёт функцию `A`, у которой свойство `prototype` — объект с методом `method` (неперечислимым) и ссылкой `constructor`. Статические члены становятся свойствами самой функции `A`. `new A()` работает по тем же четырём шагам, что и для функции-конструктора (тема о прототипах), но класс помечен как «конструктор класса» и не вызывается без `new`."),
      h("`extends` на уровне прототипов"),
      p("`class B extends A` устанавливает две связи: `Object.getPrototypeOf(B.prototype) === A.prototype` (методы экземпляров) и `Object.getPrototypeOf(B) === A` (статические члены). Замер для `Square extends Rect` подтвердил обе. Выражение после `extends` — любое выражение, возвращающее конструктор: на этом построены миксины."),
      h("Порядок создания объекта в подклассе"),
      steps(
        [
          ["Вызов `new Child()`", "Конструктор подкласса начинает выполняться, `this` пока нет."],
          ["`super(...)`", "Вызывается конструктор родителя; именно он создаёт объект (с прототипом `Child.prototype`, благодаря `new.target`) и инициализирует поля родителя."],
          ["Поля потомка", "После возврата из `super()` инициализируются поля подкласса, затем выполняется остаток тела конструктора."],
          ["Результат", "`new` возвращает объект, если конструктор не вернул другой."],
        ],
        "Конструирование в подклассе",
      ),
      p("Из-за такого порядка родительский конструктор, вызывающий переопределённый метод, видит поля потомка неинициализированными (замер: `undefined`), а обращение к `this` до `super()` невозможно (`ReferenceError`)."),
      h("Как устроены приватные имена"),
      p("`#name` — не свойство с «особым» ключом, а отдельное **приватное имя**, область которого — тело класса. Для каждого экземпляра движок хранит приватные поля отдельно от обычных свойств; поэтому `Object.keys`, `JSON.stringify`, `Reflect.ownKeys` их не видят, а `Proxy` не может их перехватить. Доступ к приватному имени из другого объекта (`{}`) — `TypeError` (замер: `C.peek({})`), а проверка `#x in obj` — безопасный способ узнать, создан ли объект конструктором этого класса."),
      h("`new.target` и абстрактные классы"),
      p("`new.target` равен тому конструктору, на котором выполнен `new` (при цепочке `super()` — самому «внешнему»). Сравнение `new.target === Shape` отсекает прямое создание абстрактного класса, но не мешает `new Rect()`, потому что внутри `super()` `new.target` — `Rect`."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Передавать метод как колбэк без привязки"),
      wrongRight(
        "js",
        {
          code: `
            class Counter {
              count = 0;
              inc() { this.count++; }
            }
            const c = new Counter();
            setTimeout(c.inc, 0);              // TypeError: Cannot read properties of undefined
          `,
          note: "Метод оторван от объекта; тело класса строгое: `this` — `undefined`.",
        },
        {
          code: `
            class Counter {
              count = 0;
              inc = () => { this.count++; };   // поле-стрелка: this закреплён
            }
            setTimeout(new Counter().inc, 0);
          `,
          note: "Поле-стрелка запоминает экземпляр. Платой за удобство — отдельная функция на каждый экземпляр; для редких обработчиков допустимо `() => c.inc()` или `bind`.",
        },
      ),
      h("Ошибка 2. Обращаться к `this` до `super()`"),
      p("`constructor() { this.x = 1; super(); }` — `ReferenceError: Must call super constructor in derived class before accessing 'this'…` (замер). Всегда начинайте конструктор подкласса с `super(...)`."),
      h("Ошибка 3. Вызвать класс без `new`"),
      p("`Counter()` — `TypeError: Class constructor Counter cannot be invoked without 'new'` (замер). У функции-конструктора такого запрета нет."),
      h("Ошибка 4. Использовать класс до объявления"),
      p("`new Later()` до `class Later {}` — `ReferenceError` (TDZ), в отличие от объявления функции."),
      h("Ошибка 5. Вызывать переопределяемые методы из конструктора родителя"),
      p("Подкласс ещё не инициализирован: поле `field` у `Child` равно `undefined` (замер). Выносите инициализацию в отдельный вызываемый снаружи метод."),
      h("Ошибка 6. Полагаться на `_name` как на приватность"),
      p("Подчёркивание — только соглашение, свойство публично. Для настоящей приватности — `#name`."),
      h("Ошибка 7. Глубокие иерархии наследования"),
      p("Цепочка из пяти уровней делает поведение невозможным для предсказания. Используйте композицию и интерфейсы-функции."),
      h("Ошибка 8. Ожидать, что `structuredClone` скопирует класс"),
      p("Копия — обычный объект без прототипа класса и без приватных полей (замер). Добавляйте методы `clone()` или фабрики для копирования экземпляров."),
    ]),

    section("antipatterns", [
      ul(
        "**Классы без состояния** (только статические методы): вместо них — модуль с функциями.",
        "**Наследование ради повторного использования кода** (`Stack extends Array`, где часть методов должна быть недоступна): используйте композицию.",
        "**Геттеры и сеттеры «для всего»** без логики: публичное поле проще.",
        "**Тяжёлая работа в конструкторе** (запросы, чтение файлов): выносите в фабрику или `init()`.",
        "**Переопределение методов с нарушением контракта родителя** (принцип подстановки Лисков).",
        "**Богатые «божественные» классы** на сотни строк, делающие всё.",
        "**Поля-стрелки на каждый метод:** лишние функции в каждом экземпляре.",
        "**Мутабельные статические поля как глобальное состояние.**",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Предпочитайте композицию наследованию;** наследуйте, если «является», и сохраняйте контракт родителя.",
        "**Приватные члены — `#`,** публичный интерфейс — минимальный и документированный.",
        "**`super(...)` первой строкой** в конструкторе подкласса.",
        "**Не вызывайте переопределяемые методы из конструктора.**",
        "**Для колбэков используйте поле-стрелку, `bind` или обёртку** — осознанно.",
        "**Собственные ошибки наследуйте от `Error`:** задавайте `name`, передавайте `cause`.",
        "**Для абстрактных классов — `new.target` и ошибка в базовых методах.**",
        "**Фабрики и статические конструкторы** (`static from(…)`) для нескольких способов создания.",
      ),
      tip("Если сомневаетесь, нужен ли класс, спросите: «будет ли у меня много экземпляров с одинаковым набором методов и собственным состоянием?» Если нет, обойдитесь функцией или объектом."),
    ]),

    section("edge-cases", [
      h("Статические члены и наследование"),
      p("Подкласс читает статические поля родителя через цепочку конструкторов (замер: `B.count` — `3` при `Object.hasOwn(B, \"count\")` — `false`). Запись `B.count++` создала бы собственное статическое свойство `B`, разорвав связь."),
      h("Поле или метод с тем же именем"),
      p("Если и поле, и метод называются `x`, собственное поле экземпляра затеняет метод прототипа. Следите за именами."),
      h("`toString`, `valueOf`, `Symbol.toPrimitive`"),
      p("Определение этих методов в классе управляет приведением к строке и числу (тема об операторах): подстановка в шаблонную строку вызывает `toString()` (замер: `(3, 4)`)."),
      h("Выражение класса"),
      p("`const A = class {}` и `const B = class Named {}` — выражения, как функциональные; `Named` видно только внутри. Миксины возвращают именно выражения классов."),
      h("Геттеры/сеттеры и наследование"),
      p("Если подкласс переопределил только геттер, сеттер родителя не наследуется для этого свойства: пара определяется одним дескриптором на уровне цепочки."),
      h("Статические блоки"),
      p("`static { … }` в теле класса выполняется один раз при создании класса и подходит для сложной инициализации статического состояния; внутри доступны приватные статические члены."),
    ]),

    section("related", [
      ul(
        "[Прототипы, this, call/apply/bind](/learn/js/prototypes-this) — механизм, на котором стоят классы.",
        "[Объекты и свойства](/learn/js/objects-properties) — аксессоры, дескрипторы, `structuredClone`.",
        "[Замыкания](/learn/js/closures) — альтернатива классам для приватного состояния.",
        "[Контекст исполнения и область видимости](/learn/js/execution-context-scope) — TDZ для `class`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Конструктор-функция и ручное наследование",
          code: `
            function Account(owner) {
              this._balance = 0;                         // «приватность» по соглашению
              this.owner = owner;
            }
            Account.prototype.deposit = function (n) { this._balance += n; };
            function Savings(owner) { Account.call(this, owner); }
            Savings.prototype = Object.create(Account.prototype);
            Savings.prototype.constructor = Savings;
          `,
          note: "Много церемоний, `_balance` публичен, вызов без `new` не запрещён, методы перечислимы.",
        },
        {
          title: "Класс с приватным полем",
          code: `
            class Account {
              #balance = 0;
              constructor(owner) { this.owner = owner; }
              deposit(n) { this.#balance += n; return this; }
              get balance() { return this.#balance; }
            }
            class Savings extends Account {}
          `,
          note: "Приватность на уровне языка, проверка `new`, цепочка через `extends`.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.classes.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код, скажите, что напечатает каждая строка. Особенно подумайте о том, откуда берётся `count` у `B`, что видно у `a` и `b` в `items`, и почему последний вызов бросает ошибку."),
        code("js", `class A {
  static count = 0;
  items = [];
  constructor() { A.count++; }
  add(x) { this.items.push(x); return this; }
}
const a = new A(), b = new A();
a.add(1).add(2);
console.log(a.items, b.items, A.count, a.count);

class B extends A {
  constructor() { super(); this.items.push("b"); }
}
console.log(new B().items, A.count, B.count);
console.log(typeof A, a.add === b.add, Object.hasOwn(B, "count"));

class C {
  #secret = 1;
  static peek(c) { return c.#secret; }
}
console.log(C.peek(new C()));
try { C.peek({}); } catch (e) { console.log(e.name); }`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Поле `items = []` создаётся для каждого экземпляра или одно на класс?", "Как подкласс читает статические поля родителя?"],
      checks: ["Объяснены разные массивы `items`", "Объяснено `B.count` без собственного свойства", "Объяснён `TypeError` для чужого объекта"],
      solution: [
        code("text", `[ 1, 2 ] [] 2 undefined
[ 'b' ] 3 3
function true false
1
TypeError`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "`items = []` — поле экземпляра: у `a` и `b` разные массивы (`[1, 2]` и `[]`); `A.count` — `2` (два конструктора), `a.count` — `undefined` (статическое поле у экземпляра отсутствует).",
          "`new B()` вызывает `super()` → `A.count++` → `3`; `B.count` читается по цепочке конструкторов (`Object.hasOwn(B, \"count\")` — `false`).",
          "`typeof A` — `function`; метод `add` общий (`a.add === b.add`).",
          "Приватное поле доступно в статическом методе того же класса (`C.peek(new C())` → `1`), но для объекта без поля `#secret` обращение — `TypeError`.",
        ),
      ],
    }),
    exercise({
      id: "js.classes.ex2",
      title: "Три ошибки в классе",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Найдите три ошибки в использовании классов (потеря `this`, вызов без `new`, `this` до `super()`), объясните каждое сообщение и покажите исправленный вариант."),
      ],
      hints: ["Что такое `this` у метода, извлечённого из объекта?", "Что нужно сделать в конструкторе потомка первым?"],
      checks: ["Три сообщения объяснены", "Исправлены все три", "Исправление `this` не ломает наследование"],
      solution: [
        code("js", `class Counter {
  count = 0;
  inc() { this.count++; return this.count; }
}

// Ошибка 1: метод передан как колбэк
const c = new Counter();
const { inc } = c;
try { inc(); } catch (e) { console.log("1.", e.name + ":", e.message); }

// Ошибка 2: класс вызван без new
try { Counter(); } catch (e) { console.log("2.", e.name + ":", e.message); }

// Ошибка 3: обращение к this до super()
class Child extends Counter {
  constructor() { this.extra = 1; super(); }
}
try { new Child(); } catch (e) { console.log("3.", e.name + ":", e.message); }

// Исправленный вариант
class FixedCounter {
  count = 0;
  inc = () => ++this.count;                // поле-стрелка: this закреплён за экземпляром
}
class FixedChild extends FixedCounter {
  constructor() { super(); this.extra = 1; }   // super() — первым
}
const fixed = new FixedChild();
const { inc: detached } = fixed;
console.log(detached(), detached(), fixed.extra, fixed instanceof FixedCounter);`, { filename: "x2-broken.mjs" }),
        code("text", `1. TypeError: Cannot read properties of undefined (reading 'count')
2. TypeError: Class constructor Counter cannot be invoked without 'new'
3. ReferenceError: Must call super constructor in derived class before accessing 'this' or returning from derived constructor
1 2 1 true`, { filename: "вывод Node.js 22.22.0" }),
        p("1) Метод отделён от объекта, тело класса строгое → `this` `undefined`. 2) Класс нельзя вызывать без `new`. 3) До `super()` объект ещё не создан. Исправление: поле-стрелка `inc = () => …` (или `bind`), вызов через `new`, `super()` первой строкой."),
      ],
    }),
    exercise({
      id: "js.classes.ex3",
      title: "Фигуры: абстрактный класс и полиморфизм",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Реализуйте `Shape` (абстрактный класс), `Circle` и `Rect`. У каждой фигуры — уникальный `id` (приватное поле, счётчик — приватное статическое поле), метод `area()` (в `Shape` бросает ошибку), `toString()` через полиморфизм, статические `compare` (для `sort`) и `largest`. Конструкторы валидируют входные данные."),
      ],
      hints: ["Когда увеличивать счётчик, чтобы он не расходовался при ошибке?", "Как запретить `new Shape()`?"],
      checks: ["`new Shape()` — `TypeError`", "Уникальные id по порядку создания", "`area()` у подкласса без реализации — ошибка", "Валидация конструкторов"],
      solution: [
        code("js", `export class Shape {
  static #nextId = 1;
  #id;                                         // уникальный номер для каждой фигуры

  constructor() {
    if (new.target === Shape) throw new TypeError("Shape — абстрактный класс");
    this.#id = Shape.#nextId++;                // счётчик увеличивается только для настоящих фигур
  }

  get id() { return this.#id; }
  area() { throw new Error(\`\${this.constructor.name}: area() не реализован\`); }
  toString() { return \`\${this.constructor.name}#\${this.#id} (площадь \${this.area().toFixed(2)})\`; }

  static compare(a, b) { return a.area() - b.area(); }          // для сортировки
  static largest(shapes) { return shapes.reduce((max, s) => (s.area() > max.area() ? s : max)); }
}

export class Circle extends Shape {
  constructor(radius) {
    super();
    if (!(radius > 0)) throw new RangeError("Радиус должен быть положительным");
    this.radius = radius;
  }
  area() { return Math.PI * this.radius ** 2; }
}

export class Rect extends Shape {
  constructor(width, height) {
    super();
    if (!(width > 0 && height > 0)) throw new RangeError("Стороны должны быть положительными");
    this.width = width;
    this.height = height;
  }
  area() { return this.width * this.height; }
}`, { filename: "shapes.mjs" }),
        code("js", `import { Shape, Circle, Rect } from "./shapes.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);
const throws = (fn) => { try { fn(); return "без ошибки"; } catch (e) { return e.name; } };

check("абстрактный класс", throws(() => new Shape()), "TypeError");
const c = new Circle(1), r = new Rect(2, 3), r2 = new Rect(1, 1);
check("уникальные id по порядку создания", [c.id, r.id, r2.id], [1, 2, 3]);
check("площади", [c.area().toFixed(4), r.area()], ["3.1416", 6]);
check("toString использует полиморфизм", [String(c), String(r)], ["Circle#1 (площадь 3.14)", "Rect#2 (площадь 6.00)"]);
check("compare для sort", [c, r, r2].sort(Shape.compare).map((s) => s.id), [3, 1, 2]);
check("largest", Shape.largest([c, r, r2]).id, 2);
check("валидация радиуса", throws(() => new Circle(-1)), "RangeError");
check("валидация сторон", throws(() => new Rect(0, 5)), "RangeError");
check("id нельзя перезаписать", throws(() => { c.id = 100; }), "TypeError");
check("приватное поле не видно", [Object.keys(c), JSON.stringify(c)], [["radius"], '{"radius":1}']);

class Blob extends Shape {}
check("подкласс без area()", throws(() => new Blob().toString()), "Error");
check("instanceof", [c instanceof Shape, c instanceof Circle, c instanceof Rect], [true, true, false]);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "shapes-test.mjs", collapsed: true }),
        code("text", `Все 12 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
        p("Счётчик увеличивается **в теле** конструктора после проверки `new.target`: инициализатор поля `#id = Shape.#nextId++` выполнился бы до проверки и «потратил» бы номер на неудавшийся `new Shape()`."),
      ],
    }),
  ],

  challenge: {
    id: "js.classes.challenge",
    title: "EventEmitter на классе",
    scenario: [
      p("Для внутреннего инструмента нужен лёгкий аналог `EventEmitter`. Реализуйте модуль `emitter.mjs` с классом `EventEmitter`, методами `on`, `once`, `off`, `emit`, `listenerCount` и приватным хранилищем обработчиков."),
    ],
    requirements: [
      "`on(event, handler)` возвращает функцию отписки; не функция — `TypeError`",
      "`once` вызывает обработчик один раз; `off(event, handler)` возвращает `true`/`false`",
      "`emit(event, ...args)` вызывает обработчики по порядку, возвращает `true`, если они были; безопасна отписка внутри обработчика",
      "Состояние приватно (`#handlers`): `Object.keys(e)` — `[]`, `JSON.stringify(e)` — `{}`",
      "Можно наследоваться: `class Chat extends EventEmitter`",
    ],
    constraints: [
      "Без внешних библиотек и без `node:events`",
      "Не хранить пустые списки обработчиков",
    ],
    acceptance: [
      "Все 12 проверок из теста проходят",
      "Отписка внутри обработчика не пропускает соседних обработчиков",
      "`listenerCount` после `once` и повторной отписки корректен",
    ],
    hints: [
      "Как сделать обход `emit` безопасным при изменении списка?",
      "Как реализовать `once`, чтобы обработчик снимался до вызова?",
      "Где хранить обработчики, чтобы их нельзя было подменить снаружи?",
    ],
    solution: [
      code("js", `export class EventEmitter {
  #handlers = new Map();                       // имя события → массив обработчиков

  on(event, handler) {
    if (typeof handler !== "function") throw new TypeError("Обработчик должен быть функцией");
    const list = this.#handlers.get(event) ?? [];
    this.#handlers.set(event, [...list, handler]);
    return () => this.off(event, handler);     // функция отписки
  }

  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    return this.on(event, wrapper);
  }

  off(event, handler) {
    const list = this.#handlers.get(event);
    if (!list) return false;
    const next = list.filter((h) => h !== handler);
    if (next.length === list.length) return false;
    if (next.length) this.#handlers.set(event, next);
    else this.#handlers.delete(event);         // не храним пустые списки
    return true;
  }

  emit(event, ...args) {
    const list = this.#handlers.get(event);
    if (!list) return false;
    for (const handler of list) handler(...args);   // обходим снимок списка: изменения во время emit безопасны
    return true;
  }

  listenerCount(event) {
    return this.#handlers.get(event)?.length ?? 0;
  }
}`, { filename: "emitter.mjs", lineNumbers: true }),
      code("text", `Все 12 проверок пройдены`, { filename: "результат запуска тестов" }),
      p("Хранилище — приватный `Map`; изменения создают новые массивы (`[...list, handler]`, `filter`), поэтому `emit` безопасно обходит прежний снимок. `once` оборачивает обработчик и снимает обёртку перед вызовом."),
    ],
  },

  interview: [
    iq("js.classes.i1", "basic", "Класс в JavaScript — это отдельный тип или синтаксический сахар?", [
      ul(
        "Над прототипами: `typeof Class` — `function`, методы на `Class.prototype`, экземпляры связаны через `[[Prototype]]`.",
        "Но класс строже функции: нельзя вызвать без `new`, в TDZ, строгое тело, неперечислимые методы, приватные поля и `super`, которых нет у обычных функций.",
      ),
    ]),
    iq("js.classes.i2", "basic", "Для чего нужны `static`, `get`/`set` и `#private`?", [
      ul(
        "`static` — члены самого класса (фабрики, счётчики, утилиты).",
        "`get`/`set` — свойства с вычислением и проверкой.",
        "`#private` — скрытые поля и методы, недоступные снаружи и в подклассах.",
      ),
    ]),
    iq("js.classes.i3", "intermediate", "Что делает `super` и почему вызов `super()` обязателен в конструкторе подкласса?", [
      ul(
        "`super(...)` вызывает конструктор родителя, создающий объект `this`; до него `this` недоступен (`ReferenceError`).",
        "`super.method()` вызывает метод родителя.",
        "Если `super()` не вызван — та же ошибка при создании экземпляра.",
      ),
    ]),
    iq("js.classes.i4", "intermediate", "Чем метод класса отличается от поля-стрелки?", [
      ul(
        "Метод — один на прототипе, общий для всех; `this` определяется вызовом, оторванный метод теряет `this`.",
        "Поле-стрелка — отдельная функция в каждом экземпляре; `this` закреплён навсегда, но памяти больше.",
        "Выбор: стрелка — для колбэков, метод — для остального.",
      ),
    ]),
    iq("js.classes.i5", "intermediate", "Как реализовать абстрактный класс?", [
      ul(
        "В конструкторе: `if (new.target === Base) throw new TypeError(…)`.",
        "Абстрактные методы: в базовом классе бросают ошибку «не реализовано».",
        "Подклассы переопределяют методы; проверка контракта — в тестах.",
      ),
    ]),
    iq("js.classes.i6", "advanced", "Почему родительский конструктор может увидеть `undefined` в поле подкласса?", [
      ul(
        "Поля подкласса инициализируются **после** возврата из `super()`.",
        "Если родитель в конструкторе вызывает переопределённый метод, тот обращается к полю до его создания (замер: `undefined`).",
        "Решение: не вызывать переопределяемые методы в конструкторе, использовать `init()` после создания.",
      ),
    ]),
    iq("js.classes.i7", "engineering", "Наследование или композиция: как выбирать?", [
      ul(
        "Наследование — отношение «является» с сохранением контракта родителя.",
        "Композиция — «имеет/использует»: зависимости передаются в конструктор, легко подменяются в тестах.",
        "Глубокие иерархии хрупки; миксины и композиция гибче.",
        "Начинайте с композиции и функций, наследуйте, когда иерархия реально отражает предметную область.",
      ),
    ]),
    iq("js.classes.i8", "debugging", "`new Foo()` падает с «Must call super constructor in derived class…». Что проверить?", [
      ul(
        "Есть ли в конструкторе подкласса вызов `super(...)` и стоит ли он **до** любого обращения к `this`.",
        "Нет ли условных веток, в которых `super()` не вызывается.",
        "Не возвращает ли конструктор объект до `super()` (допустимо только если вернуть объект явно).",
      ),
    ]),
  ],

  exam: [
    mcq("js.classes.e1", "foundation", "Что произойдёт при вызове `Point(1, 2)` без `new`, если `Point` — класс?", ["Вернётся `undefined`", "Создастся глобальный объект", "`TypeError: Class constructor Point cannot be invoked without 'new'`", "Всё сработает как с обычной функцией"], 2, "Классы нельзя вызывать без `new` (замер)."),
    mcq("js.classes.e2", "foundation", "Где хранятся методы класса?", ["На `Class.prototype` — общие для всех экземпляров", "В каждом экземпляре", "В глобальном объекте", "В статических полях"], 0, "Методы лежат на прототипе: `p.move === other.move`."),
    mcq("js.classes.e3", "intermediate", "Что будет при обращении к `acc.#balance` вне тела класса?", ["`undefined`", "Значение поля", "`TypeError` при выполнении", "`SyntaxError` при разборе"], 3, "Обращение к приватному имени вне класса — ошибка синтаксиса: `Private field '#balance' must be declared in an enclosing class`."),
    mcq("js.classes.e4", "intermediate", "Что нужно сделать в `constructor` подкласса раньше всего?", ["Объявить поля", "Вызвать `super(...)`", "Обратиться к `this`", "Вызвать `new.target`"], 1, "До `super()` объект не создан; доступ к `this` — `ReferenceError`."),
    mcq("js.classes.e5", "intermediate", "Какие утверждения верны для методов класса? Выберите все.", ["Они неперечислимы", "Они общие для всех экземпляров", "У каждого экземпляра своя копия", "Тело всегда в строгом режиме"], [0, 1, 3], "Методы лежат на прототипе (общие, неперечислимые); тело класса строгое."),
    mcq("js.classes.e6", "advanced", "Почему `new Child()` при `class Child extends Base { field = 1; }` и вызове `this.init()` в конструкторе `Base` видит `field === undefined`?", ["Поле приватное", "Из-за TDZ", "`init` — статический метод", "Поля подкласса инициализируются после `super()`"], 3, "Порядок: конструктор родителя выполняется до инициализации полей потомка (замер: `undefined`)."),
    open("js.classes.e7", "intermediate", "Когда вы выберете класс, а когда фабричную функцию или замыкание?", [
      ul(
        "Класс — много экземпляров с общими методами (экономия памяти), нужны `instanceof`, наследование, `#private`.",
        "Фабрика/замыкание — единичные объекты, простая приватность без классов, композиция без иерархий.",
        "Модуль с функциями — когда состояния нет.",
        "Решение зависит от числа экземпляров, потребности в наследовании и стиля проекта.",
      ),
    ], ["Названы случаи для классов", "Названы случаи для фабрик", "Упомянут модуль без состояния"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.classes.m1", "intermediate", "Чему равно `Object.getPrototypeOf(Square) === Rect` для `class Square extends Rect`?", ["`false`", "Зависит от режима", "`true`", "Ошибка"], 2, "`extends` связывает и прототипы экземпляров, и сами конструкторы (наследование статических членов), замер: `true`."),
    mcq("js.classes.m2", "advanced", "Что вернёт `JSON.stringify(acc)` для `Account` с публичным `owner` и приватным `#balance`?", ["Объект с `owner` и `balance`", "Только `owner`", "`{}` всегда", "Ошибку"], 1, "Приватные поля не перечисляются и не сериализуются (замер: `{\"owner\":\"Аня\"}`)."),
    mcq("js.classes.m3", "advanced", "Почему счётчик id в `Shape` лучше увеличивать в теле конструктора, а не в инициализаторе поля?", ["Инициализатор выполняется до проверки `new.target` и расходует номер для неудавшегося `new Shape()`", "Инициализатор запрещён для приватных полей", "Тело конструктора быстрее", "Инициализаторы выполняются один раз на класс"], 0, "Поля инициализируются до тела конструктора, даже если оно затем бросит ошибку (замер: `created` — `1`)."),
    open("js.classes.m4", "advanced", "Спроектируйте компонент интерфейса «выпадающий список» на классах: состояние, события, жизненный цикл, тестируемость, без утечек памяти.", [
      ul(
        "Состояние — приватные поля (`#open`, `#items`, `#selected`); публичный интерфейс — методы `open()`, `close()`, `select()`, события через `EventEmitter`/`EventTarget`.",
        "Обработчики DOM — поля-стрелки (стабильные ссылки для `removeEventListener`) или `AbortController` для массового снятия; метод `destroy()` отписывает всё.",
        "Зависимости (корневой элемент, источник данных, `document`) — через конструктор: подмена в тестах без глобалей.",
        "Композиция: поведение «поиск по списку», «клавиатурная навигация» — отдельные компоненты/миксины, а не глубокая иерархия.",
        "Тесты: открытие/закрытие, выбор, повторный `destroy()`, количество подписчиков после уничтожения (нет утечек).",
      ),
    ], ["Описано состояние и интерфейс", "Описана очистка подписок", "Описана передача зависимостей", "Описана тестируемость"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.classes.f1", front: "class — это?", back: "Синтаксис над прототипами: typeof = function, методы на prototype (неперечислимы). Без new — TypeError; TDZ; строгое тело." },
    { id: "js.classes.f2", front: "#private?", back: "Скрыт снаружи и от подклассов; вне класса — SyntaxError; нет в keys/JSON; `#x in obj` — проверка." },
    { id: "js.classes.f3", front: "super?", back: "super(...) создаёт this через родителя — обязателен до this; super.method() — родительский метод." },
    { id: "js.classes.f4", front: "Метод и поле-стрелка?", back: "Метод — один на прототипе, this по вызову; стрелка — своя функция на экземпляр, this закреплён." },
    { id: "js.classes.f5", front: "Порядок инициализации?", back: "Родитель (+его поля) → super() вернулся → поля потомка → остаток конструктора. Переопределяемые методы в конструкторе — ловушка." },
    { id: "js.classes.f6", front: "extends связывает?", back: "Child.prototype → Parent.prototype и Child → Parent (статические члены)." },
    { id: "js.classes.f7", front: "Композиция против наследования?", back: "«является» — наследование; «имеет/использует» — композиция (зависимость в конструктор)." },
  ],

  sources: [
    { title: "ECMAScript: Class Definitions", url: "https://tc39.es/ecma262/#sec-class-definitions", publisher: "ECMA" },
    { title: "ECMAScript: The super keyword", url: "https://tc39.es/ecma262/#sec-super-keyword", publisher: "ECMA" },
    { title: "MDN: Classes", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes", publisher: "MDN" },
    { title: "MDN: Private elements", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements", publisher: "MDN" },
    { title: "MDN: extends", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends", publisher: "MDN" },
    { title: "MDN: static", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static", publisher: "MDN" },
    { title: "MDN: new.target", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new.target", publisher: "MDN" },
    { title: "MDN: Error: cause", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause", publisher: "MDN" },
  ],
};
