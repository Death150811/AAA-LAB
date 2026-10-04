import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p02LibraryModel: Project = {
  id: "js.p02-library-model",
  domain: "js",
  order: 2,
  title: "Объектная модель библиотеки",
  subtitle: "Классы с приватными полями, неизменяемые значения, события, итерация и иерархия ошибок — 56 проверок поведения и устройства",
  level: "core",
  estimatedHours: 10,
  buildsOn: ["js.p01-data-without-surprises"],
  topics: [
    "js.closures",
    "js.objects-properties",
    "js.prototypes-this",
    "js.classes",
    "js.iterators-generators",
  ],
  objective:
    "Спроектировать и написать модуль `library.mjs`: **объектную модель выдачи книг** с инкапсуляцией (приватные поля `#`), неизменяемым значением `Book`, событиями на основе `EventTarget`, ленивой итерацией через генератор, внедряемыми часами и собственной иерархией ошибок. Проект учит строить объекты так, чтобы их нельзя было испортить снаружи, а поведение — проверить без обращения к настоящему времени.",
  scenario: [
    p("Районная «Читальня» выдаёт книги на 14 суток, не больше трёх на читателя, штраф за просрочку — 10 рублей в сутки. Старая реализация была набором функций и общего объекта: любой код мог записать `library.books[0].copies = 99`, а тест выдачи зависел от настоящей даты. Вам нужно заменить её объектной моделью, которая сама защищает свои инварианты."),
    p("Модуль экспортирует классы `Book` и `Library`, базовую ошибку `LibraryError` и пять её подклассов. Любое нарушение правил — **типизированное исключение с кодом**, а не `null` и не `false`. Заготовка находится в `starter/library.mjs`, проверка — `check.mjs` (56 проверок)."),
    code("js", `// Заготовка проекта «Объектная модель библиотеки». Реализуйте классы, затем запустите:  node check.mjs .
// Имена экспортов менять нельзя; подробности — в описании проекта.

export class LibraryError extends Error {
  // code, cause, details; name — имя подкласса
}
export class ValidationError extends LibraryError {}
export class NotFoundError extends LibraryError {}
export class NoCopiesError extends LibraryError {}
export class LimitError extends LibraryError {}
export class DuplicateLoanError extends LibraryError {}

export class Book {
  constructor(data) {
    throw new Error("не реализовано: Book");
  }
}

export class Library extends EventTarget {
  constructor(options) {
    super();
    throw new Error("не реализовано: Library");
  }
}`, { filename: "starter/library.mjs" }),
    table(
      ["Класс / метод", "Что делает", "Ошибки"],
      [
        ["`new Book({ id, title, author, year })`", "Неизменяемая книга; `id` вида `AB-1234`, год 1450–2100; `toJSON`, `Book.fromJSON`, приведение к строке и числу", "`ValidationError` с `details.field`"],
        ["`library.addBook(book, copies = 1)`", "Добавляет книгу (повтор суммирует экземпляры), возвращает `this`", "`TypeError`, `ValidationError`"],
        ["`library.available(id)`", "Свободные экземпляры", "`NotFoundError`"],
        ["`library.borrow(reader, id)`", "Выдача на 14 суток, возвращает срок (`Date`), событие `borrow`", "`NotFoundError`, `NoCopiesError`, `LimitError`, `DuplicateLoanError`"],
        ["`library.giveBack(reader, id)`", "Возврат, `{ fine }`, событие `return`", "`NotFoundError`"],
        ["`library.loansOf(reader)`, `library.search({ author, text })`, `library.size`", "Выдачи читателя; поиск без учёта регистра; число названий", "—"],
        ["`for (const book of library)`", "Свободные книги по алфавиту (русская сортировка)", "—"],
      ],
      "Контракт модуля",
    ),
  ],
  requirements: [
    "`library.mjs` экспортирует `Book`, `Library`, `LibraryError`, `ValidationError`, `NotFoundError`, `NoCopiesError`, `LimitError`, `DuplicateLoanError`.",
    "`Book` неизменяем: поля **приватные** (`#id`, `#title`, `#author`, `#year`), публичные геттеры живут на прототипе, объект заморожен (`Object.freeze`), `Object.keys(book)` пуст; название и автор обрезаются по краям; невалидные данные — `ValidationError` с кодом `VALIDATION` и `details.field`.",
    "`Book` умеет `toJSON`, статический `Book.fromJSON` (объект или строка JSON) и приведение: `${book}` → `\"Война и мир — Лев Толстой (1869)\"`, `+book` → `1869` (`Symbol.toPrimitive`).",
    "Все ошибки наследуют `LibraryError` и `Error`; `name` равен имени класса (не `\"Error\"`); `code` — `VALIDATION`, `NOT_FOUND`, `NO_COPIES`, `LIMIT`, `DUPLICATE_LOAN`; `LibraryError` сохраняет `cause`; заголовок `stack` начинается с имени класса.",
    "`Library` наследует `EventTarget`; всё состояние приватное (`Object.getOwnPropertyNames(library)` пуст); время, лимит выдач (3), срок (14 суток) и штраф (10 в сутки) внедряются через параметры конструктора (`now`, `maxLoans`, `loanDays`, `finePerDay`).",
    "`borrow`: проверяет читателя (обрезает пробелы, пустое имя — `ValidationError`), существование книги, повторную выдачу, лимит и наличие экземпляров; возвращает срок возврата; после изменения состояния отправляет `CustomEvent(\"borrow\", { detail: { reader, bookId, due } })`.",
    "`giveBack`: штраф — число начатых суток просрочки × `finePerDay` (1 час просрочки = полные сутки); вовремя — 0; после изменения состояния отправляет событие `return` с `detail: { reader, bookId, fine }`.",
    "`loansOf(reader)` — массив `{ bookId, due }`, отсортированный по сроку, затем по `id`; `search` ищет подстроку без учёта регистра (в том числе кириллицы) по автору и (или) названию.",
    "Итерация по `Library` — **генератор** (`*[Symbol.iterator]()`): только книги со свободными экземплярами, по алфавиту (`localeCompare(…, \"ru\")`); по библиотеке можно итерировать многократно.",
    "`Library` и `Book` сериализуются через `toJSON` (у библиотеки в записях книг есть `copies`).",
    "Методы лежат на прототипе: вызов `const { borrow } = library; borrow(...)` без `this` падает `TypeError`; экземпляры независимы друг от друга.",
  ],
  constraints: [
    "Без внешних библиотек; только стандартные классы (`EventTarget`, `CustomEvent`, `Map`, `Intl`).",
    "Состояние хранить в приватных полях `#`, а не в свойствах с подчёркиванием и не в замыканиях на уровне модуля.",
    "Нельзя использовать глобальное состояние модуля (общие `Map`) — каждый `Library` владеет своими данными.",
    "Нельзя вызывать `new Date()` без внедрённых часов внутри логики выдачи (`now` по умолчанию — только значение параметра).",
    "Методы — обычные (на прототипе), а не стрелочные свойства; `this` не привязывается автоматически.",
    "Ошибки — только через иерархию `LibraryError`; нельзя бросать строки и обычные `Error`.",
  ],
  expected: [
    "`node check.mjs .` печатает `Пройдено проверок: 56 из 56`.",
    "Любую книгу нельзя испортить снаружи: присвоение поля в строгом режиме бросает `TypeError`, `Object.keys(book)` пуст.",
    "Тесты выдачи воспроизводимы: время подаётся параметром, а не берётся из настоящих часов.",
    "Слушатель события `borrow` или `return` видит библиотеку **уже в новом состоянии**.",
    "`[...library]` возвращает свободные книги по алфавиту сколько угодно раз.",
  ],
  technical: [
    "Приватные поля класса: `#id; #title;` — они недоступны снаружи и не попадают в `Object.keys`, `JSON.stringify(Object.assign({}, book))` и копирование. Геттеры `get title()` читают их и живут на прототипе.",
    "`Object.freeze(this)` в конце конструктора не мешает приватным полям, но запрещает добавление и изменение публичных свойств; в строгом режиме (модули всегда строгие) присваивание бросает `TypeError`.",
    "Наследование от `Error`: `super(message, cause === undefined ? undefined : { cause })`, затем `this.name = new.target.name` — имя подкласса попадает и в `name`, и в заголовок `stack` (V8 формирует заголовок при первом обращении к `stack`).",
    "Срок возврата — `new Date(now().getTime() + loanDays * 86_400_000)`; штраф — `Math.ceil(lateMs / 86_400_000) * finePerDay` только при `lateMs > 0`.",
    "Событие отправляйте **после** изменения состояния: `this.dispatchEvent(new CustomEvent(\"borrow\", { detail: { … } }))` синхронно вызывает слушателей.",
    "`available(id)` считайте как `copies` минус число читателей, у которых есть выдача этого `id`; так число экземпляров и выдачи не расходятся.",
    "Итерация: `*[Symbol.iterator]() { …; yield* free; }` — новый генератор на каждый вызов; не храните итератор в поле, иначе второй проход будет пуст.",
    "Русская сортировка: `a.title.localeCompare(b.title, \"ru\")`; поиск без регистра: `toLocaleLowerCase(\"ru\")`.",
  ],
  acceptance: [
    "`node check.mjs .` — 56 из 56.",
    "Статические требования: есть приватные поля `#`, нет `var`.",
    "Заготовка проходит 3 из 56 проверок — по ней видно, что проверка действительно проверяет поведение.",
    "Каждый из восьми «плохих» вариантов проваливает проверку: от 1 (штраф округляется вниз, событие до изменения состояния) до 21 (общее состояние между экземплярами).",
    "Нет `console.log`, отладочных комментариев и неиспользуемых экспортов.",
  ],
  hints: [
    "Начните с иерархии ошибок: `new.target.name` позволяет не повторять присваивание `name` в каждом подклассе.",
    "Если `Object.keys(book)` не пуст — вы используете публичные поля. Приватные объявляются `#поле;` и читаются через геттеры.",
    "`Symbol.toPrimitive` получает подсказку `hint`: `\"number\"` — для `+book`, `\"string\"` и `\"default\"` — для строк и шаблонов.",
    "Если второй `[...library]` пуст, вы возвращаете один и тот же итератор. Метод-генератор создаёт новый при каждом вызове.",
    "Если слушатель `borrow` видит старое число экземпляров, вы вызываете `dispatchEvent` до `loans.set(...)`.",
    "Для лимита и повторной выдачи хватает `Map` на читателя: `loans.has(id)` и `loans.size`; порядок проверок важен — наличие книги, повтор, лимит, свободные экземпляры.",
    "`const { borrow } = library; borrow(...)` должен падать: это значит, что метод лежит на прототипе и читает `this.#…`. Стрелочные поля-методы «чинят» потерю `this` ценой копии метода в каждом экземпляре.",
  ],
  advanced: [
    "Добавьте `library.reserve(reader, id)` с очередью и событием `available`, когда книгу вернули.",
    "Сделайте `Library` сериализуемой в обе стороны: `Library.fromJSON(json, options)`, сохраняющий выдачи и сроки.",
    "Реализуйте `library.loansOf(reader)` как «живой» итератор с `Symbol.asyncIterator` (например, для постраничной загрузки).",
    "Опишите контракт типами JSDoc и включите `// @ts-check`; найдите места, где типы подсказывают ошибки.",
    "Напишите три мутанта `library.mjs` и убедитесь, что `check.mjs` их ловит; добавьте проверки, которых не хватило.",
  ],
  failureModes: [
    "**Публичные поля в `Book`:** любой код меняет `book.title` и видит поля в `Object.keys`; в замере 53 проверки из 56 (падают заморозка, приватность полей и «геттеры на прототипе»).",
    "**Методы как стрелочные свойства:** вызов без `this` «работает», зато метод копируется в каждый экземпляр и `Object.getOwnPropertyNames(library)` не пуст; 54 из 56.",
    "**Не задано `name` ошибки:** `err.name` — `\"Error\"`, заголовок стека без имени класса; 54 из 56.",
    "**Штраф `Math.floor`:** час просрочки ничего не стоит; 55 из 56.",
    "**`available` не вычитает выдачи:** книгу можно выдать бесконечно, `NoCopiesError` не наступает; 50 из 56.",
    "**Состояние на уровне модуля:** экземпляры `Library` делят книги и выдачи, проверки влияют друг на друга; 35 из 56 — самый тяжёлый провал.",
    "**Событие до изменения состояния:** слушатель `borrow` видит прежнее число экземпляров; 55 из 56.",
    "**Одноразовый итератор:** `[...library]` работает один раз, второй раз — пустой массив; 54 из 56.",
  ],
  rubric: [
    { criterion: "Инкапсуляция и неизменяемость", weight: 20, description: "Приватные поля `#`, геттеры на прототипе, `Object.freeze`, `Object.keys` пуст, независимые экземпляры." },
    { criterion: "Классы, прототипы и `this`", weight: 15, description: "Методы на прототипе, поведение при потере `this`, `static`, `Symbol.toPrimitive`, `new.target`." },
    { criterion: "Иерархия ошибок", weight: 15, description: "`extends Error`, `name`, `code`, `cause`, заголовок стека, различие типов ошибок и инвариантов." },
    { criterion: "Бизнес-правила и инварианты", weight: 25, description: "Выдача, возврат, лимит, повтор, штраф, сроки; порядок проверок; состояние не меняется при ошибке." },
    { criterion: "События и итерация", weight: 15, description: "`EventTarget`, `CustomEvent`, порядок «состояние → событие», генератор `Symbol.iterator`, многократная итерация." },
    { criterion: "Тестируемость и чистота кода", weight: 10, description: "Внедряемые часы и параметры, нет глобального состояния, читаемые имена, нет лишнего." },
  ],
  solution: [
    p("Эталон — один файл `library.mjs`. Он проходит все 56 проверок; заготовка проходит 3 из 56, а каждый из восьми намеренно испорченных вариантов — меньше 56."),
    h("library.mjs"),
    code("js", `// Объектная модель библиотеки: классы, приватные поля, события, итерация, ошибки
export class LibraryError extends Error {
  constructor(message, { code = "LIBRARY_ERROR", cause, details } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = new.target.name;
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}
export class ValidationError extends LibraryError {
  constructor(field, message) { super(message, { code: "VALIDATION", details: { field } }); }
}
export class NotFoundError extends LibraryError {
  constructor(what) { super(\`Не найдено: \${what}\`, { code: "NOT_FOUND" }); }
}
export class NoCopiesError extends LibraryError {
  constructor(title) { super(\`Нет свободных экземпляров: \${title}\`, { code: "NO_COPIES" }); }
}
export class LimitError extends LibraryError {
  constructor(reader, max) { super(\`Читатель \${reader} уже взял \${max} книги\`, { code: "LIMIT" }); }
}
export class DuplicateLoanError extends LibraryError {
  constructor(reader, title) { super(\`Читатель \${reader} уже держит «\${title}»\`, { code: "DUPLICATE_LOAN" }); }
}

const text = (value, field) => {
  if (typeof value !== "string" || value.trim() === "") throw new ValidationError(field, \`Поле \${field} должно быть непустой строкой\`);
  return value.trim();
};

export class Book {
  #id; #title; #author; #year;
  constructor({ id, title, author, year } = {}) {
    if (typeof id !== "string" || !/^[A-Z]{2}-\\d{4}$/.test(id)) throw new ValidationError("id", "id должен выглядеть как AB-1234");
    if (!Number.isInteger(year) || year < 1450 || year > 2100) throw new ValidationError("year", "year — целое число от 1450 до 2100");
    this.#id = id;
    this.#title = text(title, "title");
    this.#author = text(author, "author");
    this.#year = year;
    Object.freeze(this);
  }
  get id() { return this.#id; }
  get title() { return this.#title; }
  get author() { return this.#author; }
  get year() { return this.#year; }
  toJSON() { return { id: this.#id, title: this.#title, author: this.#author, year: this.#year }; }
  static fromJSON(source) { return new Book(typeof source === "string" ? JSON.parse(source) : source); }
  [Symbol.toPrimitive](hint) { return hint === "number" ? this.#year : \`\${this.#title} — \${this.#author} (\${this.#year})\`; }
}

export class Library extends EventTarget {
  #books = new Map();                 // id → { book, copies }
  #loans = new Map();                 // читатель → Map(id → срок возврата)
  #now; #maxLoans; #loanDays; #finePerDay;

  constructor({ now = () => new Date(), maxLoans = 3, loanDays = 14, finePerDay = 10 } = {}) {
    super();
    this.#now = now; this.#maxLoans = maxLoans; this.#loanDays = loanDays; this.#finePerDay = finePerDay;
  }

  addBook(book, copies = 1) {
    if (!(book instanceof Book)) throw new TypeError("addBook ожидает экземпляр Book");
    if (!Number.isInteger(copies) || copies < 1) throw new ValidationError("copies", "copies — целое число не меньше 1");
    const entry = this.#books.get(book.id);
    if (entry) entry.copies += copies; else this.#books.set(book.id, { book, copies });
    return this;
  }

  available(id) {
    const entry = this.#books.get(id);
    if (!entry) throw new NotFoundError(\`книга \${id}\`);
    let taken = 0;
    for (const loans of this.#loans.values()) if (loans.has(id)) taken++;
    return entry.copies - taken;
  }

  borrow(reader, id) {
    const name = text(reader, "reader");
    const entry = this.#books.get(id);
    if (!entry) throw new NotFoundError(\`книга \${id}\`);
    const loans = this.#loans.get(name) ?? new Map();
    if (loans.has(id)) throw new DuplicateLoanError(name, entry.book.title);
    if (loans.size >= this.#maxLoans) throw new LimitError(name, this.#maxLoans);
    if (this.available(id) < 1) throw new NoCopiesError(entry.book.title);
    const due = new Date(this.#now().getTime() + this.#loanDays * 86_400_000);
    loans.set(id, due);
    this.#loans.set(name, loans);
    this.dispatchEvent(new CustomEvent("borrow", { detail: { reader: name, bookId: id, due } }));
    return due;
  }

  giveBack(reader, id) {
    const loans = this.#loans.get(reader);
    const due = loans?.get(id);
    if (!due) throw new NotFoundError(\`выдача \${id} для \${reader}\`);
    const lateMs = this.#now().getTime() - due.getTime();
    const fine = lateMs > 0 ? Math.ceil(lateMs / 86_400_000) * this.#finePerDay : 0;
    loans.delete(id);
    if (loans.size === 0) this.#loans.delete(reader);
    this.dispatchEvent(new CustomEvent("return", { detail: { reader, bookId: id, fine } }));
    return { fine };
  }

  loansOf(reader) {
    return [...(this.#loans.get(reader) ?? [])].map(([bookId, due]) => ({ bookId, due })).sort((a, b) => a.due - b.due || a.bookId.localeCompare(b.bookId));
  }

  search({ author, text: query } = {}) {
    const has = (value, part) => value.toLocaleLowerCase("ru").includes(String(part).toLocaleLowerCase("ru"));
    return [...this.#books.values()].map((e) => e.book).filter((b) => (author === undefined || has(b.author, author)) && (query === undefined || has(b.title, query)));
  }

  get size() { return this.#books.size; }

  *[Symbol.iterator]() {                                       // свободные книги по алфавиту
    const free = [...this.#books.values()].map((e) => e.book).filter((b) => this.available(b.id) > 0);
    free.sort((a, b) => a.title.localeCompare(b.title, "ru"));
    yield* free;
  }

  toJSON() { return { books: [...this.#books.values()].map(({ book, copies }) => ({ ...book.toJSON(), copies })) }; }
}`, { filename: "library.mjs", lineNumbers: true }),
    h("Самопроверка check.mjs"),
    p("Проверки сгруппированы: структура (приватные поля), `Book` (валидация, заморозка, `toJSON`, `toPrimitive`), ошибки (иерархия, `name`, `code`, `cause`), `Library` (выдача, возврат, штраф, поиск, итерация, события, независимость экземпляров). Часы внедряются, поэтому сроки и штрафы проверяются точно."),
    code("js", `// Самопроверка проекта «Объектная модель библиотеки». Запуск: node check.mjs [каталог с library.mjs]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = path.resolve(process.argv[2] ?? "solution");
const file = path.join(dir, "library.mjs");
const source = fs.readFileSync(file, "utf8");
const lib = await import(pathToFileURL(file).href);
const { Book, Library, LibraryError, ValidationError, NotFoundError, NoCopiesError, LimitError, DuplicateLoanError } = lib;

let total = 0, passed = 0;
const failed = [];
function check(name, fn) {
  total++;
  let ok = false, note = "";
  try { const r = fn(); ok = r === true; if (!ok) note = \` (вернуло \${String(r)})\`; } catch (e) { note = \` (\${e?.name ?? "Error"}: \${e?.message})\`; }
  if (ok) passed++; else failed.push(name);
  console.log(\`\${ok ? "OK " : "НЕТ"}  \${name}\${ok ? "" : note}\`);
}
const throwsKind = (fn, Kind) => { try { fn(); return false; } catch (e) { return e instanceof Kind; } };
const code = (fn) => { try { fn(); return null; } catch (e) { return e.code ?? e.name; } };
const DAY = 86_400_000;
const T0 = Date.UTC(2024, 0, 1);
const clock = () => { let t = T0; const now = () => new Date(t); now.advance = (ms) => { t += ms; }; return now; };
const data = { id: "AB-1234", title: "Война и мир", author: "Лев Толстой", year: 1869 };
const mk = (over = {}) => new Book({ ...data, ...over });
const library = (opts) => { const now = clock(); const l = new Library({ now, ...opts }); l.addBook(mk(), 2).addBook(mk({ id: "AB-0001", title: "Анна Каренина", year: 1877 })).addBook(mk({ id: "ZZ-0042", title: "Бесы", author: "Фёдор Достоевский", year: 1872 })); return { l, now }; };

// ── Структура ──
check("экспортированы все классы", () => [Book, Library, LibraryError, ValidationError, NotFoundError, NoCopiesError, LimitError, DuplicateLoanError].every((c) => typeof c === "function"));
check("используются приватные поля (#), нет var", () => /#\\w+/.test(source) && !/\\bvar\\b/.test(source));

// ── Book ──
check("Book: геттеры возвращают переданные значения", () => { const b = mk(); return b.id === "AB-1234" && b.title === "Война и мир" && b.author === "Лев Толстой" && b.year === 1869; });
check("Book: пробелы по краям title и author обрезаются", () => { const b = mk({ title: "  Война и мир ", author: " Лев Толстой " }); return b.title === "Война и мир" && b.author === "Лев Толстой"; });
for (const [field, value] of [["id", "ab-1234"], ["id", "AB-123"], ["id", 1234], ["title", ""], ["title", "   "], ["author", null], ["year", 1449], ["year", 2101], ["year", 1869.5], ["year", "1869"]]) check(\`Book: \${field} = \${JSON.stringify(value)} → ValidationError с полем\`, () => { try { mk({ [field]: value }); return false; } catch (e) { return e instanceof ValidationError && e.details?.field === field && e.code === "VALIDATION"; } });
check("Book: new Book() без аргументов бросает ValidationError", () => throwsKind(() => new Book(), ValidationError));
check("Book: объект заморожен, присваивание в строгом режиме бросает TypeError", () => { const b = mk(); return Object.isFrozen(b) && throwsKind(() => { b.title = "Другое"; }, TypeError) && b.title === "Война и мир"; });
check("Book: приватные поля не видны снаружи (Object.keys, Object.assign, JSON через копию)", () => { const b = mk(); return Object.keys(b).length === 0 && JSON.stringify(Object.assign({}, b)) === "{}"; });
check("Book: JSON.stringify использует toJSON (id, title, author, year)", () => JSON.stringify(mk()) === '{"id":"AB-1234","title":"Война и мир","author":"Лев Толстой","year":1869}');
check("Book.fromJSON принимает объект и строку JSON (круговой обмен)", () => { const b = mk(); const a = Book.fromJSON(JSON.parse(JSON.stringify(b))), c = Book.fromJSON(JSON.stringify(b)); return a instanceof Book && c.title === b.title && JSON.stringify(a) === JSON.stringify(c); });
check("Book.fromJSON с неверными данными бросает ValidationError", () => throwsKind(() => Book.fromJSON({ id: "x" }), ValidationError));
check("Book: приведение к строке и числу (Symbol.toPrimitive)", () => { const b = mk(); return \`\${b}\` === "Война и мир — Лев Толстой (1869)" && +b === 1869 && String(b) === \`\${b}\`; });
check("Book: геттеры живут на прототипе, а не в экземпляре", () => !Object.hasOwn(mk(), "title") && typeof Object.getOwnPropertyDescriptor(Book.prototype, "title")?.get === "function");

// ── Ошибки ──
check("иерархия: все ошибки — LibraryError и Error", () => [new ValidationError("f", "m"), new NotFoundError("x"), new NoCopiesError("t"), new LimitError("r", 3), new DuplicateLoanError("r", "t")].every((e) => e instanceof LibraryError && e instanceof Error));
check("name равен имени класса", () => new NotFoundError("x").name === "NotFoundError" && new LimitError("r", 3).name === "LimitError" && new ValidationError("f", "m").name === "ValidationError");
check("коды ошибок: VALIDATION, NOT_FOUND, NO_COPIES, LIMIT, DUPLICATE_LOAN", () => [new ValidationError("f", "m").code, new NotFoundError("x").code, new NoCopiesError("t").code, new LimitError("r", 3).code, new DuplicateLoanError("r", "t").code].join() === "VALIDATION,NOT_FOUND,NO_COPIES,LIMIT,DUPLICATE_LOAN");
check("LibraryError сохраняет cause", () => { const root = new RangeError("корень"); return new LibraryError("обёртка", { code: "X", cause: root }).cause === root; });
check("заголовок стека начинается с имени класса", () => new NotFoundError("x").stack.split("\\n")[0].startsWith("NotFoundError:"));

// ── Library ──
check("addBook возвращает this (цепочки) и принимает только Book", () => { const l = new Library(); return l.addBook(mk()) === l && throwsKind(() => l.addBook({ ...data }), TypeError); });
check("addBook: copies должно быть целым ≥ 1", () => { const l = new Library(); return throwsKind(() => l.addBook(mk(), 0), ValidationError) && throwsKind(() => l.addBook(mk(), 1.5), ValidationError); });
check("повторное добавление той же книги суммирует экземпляры", () => { const l = new Library(); l.addBook(mk(), 2).addBook(mk(), 3); return l.available("AB-1234") === 5 && l.size === 1; });
check("available: неизвестная книга → NotFoundError", () => throwsKind(() => library().l.available("QQ-0000"), NotFoundError));
check("borrow возвращает срок через 14 суток от «сейчас» (внедрённые часы)", () => { const { l } = library(); const due = l.borrow("Ира", "AB-1234"); return due instanceof Date && due.getTime() === T0 + 14 * DAY; });
check("borrow уменьшает число свободных экземпляров", () => { const { l } = library(); l.borrow("Ира", "AB-1234"); return l.available("AB-1234") === 1; });
check("borrow: неизвестная книга → NotFoundError", () => throwsKind(() => library().l.borrow("Ира", "QQ-0000"), NotFoundError));
check("borrow: нет свободных экземпляров → NoCopiesError", () => { const { l } = library(); l.borrow("Ира", "ZZ-0042"); return throwsKind(() => l.borrow("Олег", "ZZ-0042"), NoCopiesError); });
check("borrow: лимит 3 книги → LimitError на четвёртой", () => { const { l } = library(); l.addBook(mk({ id: "CC-0001", title: "Идиот" })); l.borrow("Ира", "AB-1234"); l.borrow("Ира", "AB-0001"); l.borrow("Ира", "ZZ-0042"); return code(() => l.borrow("Ира", "CC-0001")) === "LIMIT"; });
check("borrow: maxLoans настраивается", () => { const { l } = library({ maxLoans: 1 }); l.borrow("Ира", "AB-1234"); return throwsKind(() => l.borrow("Ира", "AB-0001"), LimitError); });
check("borrow: повторная выдача той же книги тому же читателю → DuplicateLoanError", () => { const { l } = library(); l.borrow("Ира", "AB-1234"); return code(() => l.borrow("Ира", "AB-1234")) === "DUPLICATE_LOAN"; });
check("borrow: имя читателя обрезается; пустое имя → ValidationError", () => { const { l } = library(); l.borrow("  Ира ", "AB-1234"); return l.loansOf("Ира").length === 1 && throwsKind(() => l.borrow("  ", "AB-0001"), ValidationError); });
check("giveBack вовремя: штраф 0, экземпляр свободен", () => { const { l, now } = library(); l.borrow("Ира", "AB-1234"); now.advance(14 * DAY); return l.giveBack("Ира", "AB-1234").fine === 0 && l.available("AB-1234") === 2; });
check("giveBack с просрочкой на 6 суток: штраф 60", () => { const { l, now } = library(); l.borrow("Ира", "AB-1234"); now.advance(20 * DAY); return l.giveBack("Ира", "AB-1234").fine === 60; });
check("giveBack: неполные сутки просрочки считаются целыми (1 час = 10)", () => { const { l, now } = library(); l.borrow("Ира", "AB-1234"); now.advance(14 * DAY + 3_600_000); return l.giveBack("Ира", "AB-1234").fine === 10; });
check("giveBack: finePerDay настраивается", () => { const { l, now } = library({ finePerDay: 25 }); l.borrow("Ира", "AB-1234"); now.advance(16 * DAY); return l.giveBack("Ира", "AB-1234").fine === 50; });
check("giveBack: нет такой выдачи → NotFoundError", () => throwsKind(() => library().l.giveBack("Ира", "AB-1234"), NotFoundError));
check("loansOf: по сроку возврата, затем по id; пустой массив для незнакомого читателя", () => { const { l, now } = library(); l.borrow("Ира", "ZZ-0042"); now.advance(DAY); l.borrow("Ира", "AB-1234"); now.advance(0); l.borrow("Ира", "AB-0001"); return l.loansOf("Ира").map((x) => x.bookId).join() === "ZZ-0042,AB-0001,AB-1234" && l.loansOf("Никто").length === 0; });
check("search по автору и по названию без учёта регистра (кириллица)", () => { const { l } = library(); return l.search({ author: "ТОЛСТОЙ" }).length === 2 && l.search({ text: "анна" }).map((b) => b.id).join() === "AB-0001" && l.search({ author: "достоевский", text: "бес" }).length === 1 && l.search().length === 3; });
check("итерация: свободные книги по алфавиту (ru), работает spread и for…of", () => { const { l } = library(); const titles = [...l].map((b) => b.title); let n = 0; for (const b of l) n += b instanceof Book ? 1 : 0; return titles.join("|") === "Анна Каренина|Бесы|Война и мир" && n === 3; });
check("итерация пропускает книги без свободных экземпляров", () => { const { l } = library(); l.borrow("Ира", "ZZ-0042"); return [...l].map((b) => b.id).join() === "AB-0001,AB-1234"; });
check("итератор можно получить повторно (не одноразовый объект)", () => { const { l } = library(); return [...l].length === 3 && [...l].length === 3; });
check("toJSON библиотеки: книги с количеством экземпляров", () => { const { l } = library(); const j = JSON.parse(JSON.stringify(l)); return j.books.length === 3 && j.books.find((b) => b.id === "AB-1234").copies === 2 && Object.keys(j.books[0]).includes("title"); });
check("события borrow и return с detail; слушатель видит уже изменённое состояние", () => {
  const { l, now } = library(); const seen = [];
  l.addEventListener("borrow", (e) => seen.push(["borrow", e.detail.reader, e.detail.bookId, l.available("AB-1234")]));
  l.addEventListener("return", (e) => seen.push(["return", e.detail.reader, e.detail.fine, l.available("AB-1234")]));
  l.borrow("Ира", "AB-1234"); now.advance(15 * DAY); l.giveBack("Ира", "AB-1234");
  return JSON.stringify(seen) === '[["borrow","Ира","AB-1234",1],["return","Ира",10,2]]';
});
check("Library наследует EventTarget", () => new Library() instanceof EventTarget);
check("состояние не торчит наружу: у экземпляра нет собственных свойств", () => Object.getOwnPropertyNames(new Library()).length === 0);
check("методы лежат на прототипе, вызов без this падает TypeError", () => { const { l } = library(); const { borrow } = l; return !Object.hasOwn(l, "borrow") && typeof Library.prototype.borrow === "function" && throwsKind(() => borrow("Ира", "AB-1234"), TypeError); });
check("экземпляры независимы", () => { const a = library().l, b = library().l; a.borrow("Ира", "AB-1234"); return a.available("AB-1234") === 1 && b.available("AB-1234") === 2; });
check("ошибка при выдаче не меняет состояние", () => { const { l } = library(); l.borrow("Ира", "ZZ-0042"); try { l.borrow("Олег", "ZZ-0042"); } catch {} return l.available("ZZ-0042") === 0 && l.loansOf("Олег").length === 0; });

console.log(\`\\nПройдено проверок: \${passed} из \${total}\`);
if (failed.length) console.log("Не прошли: " + failed.length);
process.exit(failed.length ? 1 : 0);`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 56 из 56`, { filename: "результат node check.mjs solution (Node.js 22.22.0)" }),
    code("text", `Пройдено проверок: 3 из 56
Не прошли: 53`, { filename: "результат node check.mjs starter (заготовка)" }),
    h("Проверка самой проверки: «плохие» варианты"),
    code("text", `b1-public-fields: Пройдено проверок: 53 из 56
b2-arrow-methods: Пройдено проверок: 54 из 56
b3-error-name: Пройдено проверок: 54 из 56
b4-fine-floor: Пройдено проверок: 55 из 56
b5-no-loans-count: Пройдено проверок: 50 из 56
b6-shared-state: Пройдено проверок: 35 из 56
b7-event-before-state: Пройдено проверок: 55 из 56
b8-one-shot-iterator: Пройдено проверок: 54 из 56`, { filename: "результат check.mjs для вариантов с ошибками (из 56)" }),
    warn("Стрелочные поля-методы (`borrow = (r, id) => …`) выглядят удобным способом «не потерять `this`», но превращают метод в собственное свойство каждого экземпляра: они не наследуются через `super`, не подменяются на прототипе и не видны тестам как методы класса. Если нужна привязка, делайте её в месте использования (`library.borrow.bind(library)`)."),
    tip("Когда класс начинает расти, сверяйте его с чек-листом: **что снаружи нельзя испортить?** (приватные поля, заморозка), **что можно подменить?** (часы, параметры), **что гарантировано?** (инварианты в конструкторе и методах), **что видит слушатель события?** (уже новое состояние)."),
  ],
};
