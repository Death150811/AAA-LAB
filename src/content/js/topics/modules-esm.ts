import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
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

export const modulesEsm: Topic = {
  id: "js.modules-esm",
  slug: "modules-esm",
  domain: "js",
  module: "modern",
  title: "Модули ES (import и export)",
  titleEn: "ES modules (import and export)",
  summary:
    "Модуль ES — файл со своей областью видимости, строгим режимом и явными связями: `export` открывает имена, `import` подключает их. Импорты — не копии, а **живые привязки**: изменение экспортируемой переменной видно импортёрам, но присвоить импортированное нельзя. Модуль выполняется один раз и разделяется всеми, кто его импортирует; импорты поднимаются и выполняются до первой строки файла; циклические зависимости работают, но обращение к ещё не инициализированному `let`/`const` даёт `ReferenceError`. Тема на замерах в Node.js 22 и Chromium 141 разбирает именованный, default- и namespace-импорт, реэкспорт, динамический `import()`, `import.meta`, top-level `await`, JSON-модули, взаимодействие с CommonJS (`require(esm)` в Node.js 22), import maps и сообщения об ошибках, а затем учит строить загрузчик плагинов и ленивую загрузку.",
  minutes: 75,
  prerequisites: ["js.what-is-js", "js.destructuring-spread"],
  tags: ["ES modules", "import", "export", "default export", "live binding", "dynamic import", "import.meta", "top-level await", "import map", "CommonJS", "circular dependency", "tree shaking", "lazy loading", "require(esm)"],
  keyConcepts: [
    { term: "Импорт — живая привязка, а не копия", text: "После `inc(); inc();` импортированный `count` стал `2` (`ns.count` тоже). Но присвоить импортированное нельзя: `count = 10` — `TypeError: Assignment to constant variable.`; через пространство имён — `Cannot assign to read only property 'count' of object '[object Module]'`." },
    { term: "Модуль выполняется один раз", text: "Сколько бы файлов ни импортировали `side.mjs`, он выполнился один раз, а все получили один и тот же объект; повторный динамический `import()` возвращает тот же экземпляр." },
    { term: "Импорты поднимаются", text: "Все статические `import` разрешаются и модули выполняются **до** первой строки импортирующего файла, независимо от места записи импорта." },
    { term: "Циклы возможны, но хрупки", text: "В цикле `a ⇄ b` модуль `b` выполняется раньше конца `a`: функции-объявления уже доступны, а `const fromA` — `ReferenceError: Cannot access 'fromA' before initialization`. Порядок точки входа решает, что сломается." },
    { term: "Браузер: `type=\"module\"`, CORS и import maps", text: "Модульные скрипты отложены (как `defer`), строгие, загружаются по CORS (не по `file://`), а «голые» имена вроде `lib/util.mjs` без import map — ошибка: `Failed to resolve module specifier`." },
  ],
  sections: [
    section("definition", [
      def("Модуль ES", "Файл, исполняемый как модуль (`.mjs`, `\"type\": \"module\"` в Node.js, `type=\"module\"` в браузере): собственная область видимости, строгий режим, `import`/`export`, `import.meta`, top-level `await`.", "ES module"),
      def("`export`", "Объявление, открывающее имя другим модулям: именованное (`export const x`), список (`export { a, b as c }`), по умолчанию (`export default …`), реэкспорт (`export … from`).", "export"),
      def("`import`", "Статическое подключение имён другого модуля: именованное (`import { a }`), по умолчанию (`import x`), пространство имён (`import * as ns`), побочный эффект (`import \"./x.mjs\"`).", "import"),
      def("Живая привязка", "Связь импортируемого имени с переменной в модуле-источнике: импортёр видит текущее значение, но не может его присвоить.", "live binding"),
      def("Спецификатор модуля", "Строка после `from`: относительный путь (`./a.mjs`), абсолютный URL, встроенный (`node:fs`) или «голое» имя пакета (`lodash`), которое разрешает среда или import map.", "module specifier"),
      def("Динамический импорт", "Выражение `import(spec)`: возвращает обещание с пространством имён модуля; позволяет загружать код по требованию и с вычисляемым именем.", "dynamic import"),
      def("`import.meta`", "Объект метаданных модуля: `url` (адрес модуля), в Node.js — также `filename` и `dirname`.", "import.meta"),
      def("Import map", "JSON в `<script type=\"importmap\">`, сопоставляющий «голые» имена адресам модулей в браузере.", "import map"),
    ]),

    section("why", [
      h("Без модулей большой код превращается в клубок глобальных переменных"),
      p("До модулей страницы подключали десятки `<script>`, которые делили одну глобальную область: порядок подключения был критичен, имена конфликтовали, а зависимости читались только из документации. Модули делают зависимости **явными и проверяемыми**: движок знает граф до выполнения, ловит опечатки в именах импорта до запуска кода, исполняет каждый модуль один раз и даёт инструментам (бандлерам, линтерам) анализировать код."),
      ul(
        "**Изоляция:** переменные модуля не попадают в `window`/`globalThis`; конфликтов имён между файлами нет.",
        "**Явные зависимости:** по заголовку файла видно, что он использует; неиспользуемое удаляется бандлером (tree shaking).",
        "**Один экземпляр:** модуль-синглтон (конфигурация, кэш, соединение) получается естественно.",
        "**Ленивая загрузка:** `import()` откладывает тяжёлый код до момента, когда он нужен.",
        "**Единый стандарт:** тот же синтаксис работает в браузерах и Node.js; ошибки импорта диагностируются понятными сообщениями.",
      ),
      insight("Модуль — это **единица загрузки и единица изоляции**. Вы проектируете публичный интерфейс (что экспортируется) и держите всё остальное внутри. Хороший модуль экспортирует мало и делает одну вещь."),
    ]),

    section("mental-model", [
      p("Представьте **библиотеку с абонементами**. Каждый модуль — отдельный зал: двери закрыты, внутри своя мебель (область видимости). На стене висит **витрина** (`export`): что можно взять посмотреть. Читатель (`import`) получает не копию экспоната, а **окно в витрину**: если хранитель переставил экспонат (изменил экспортируемую переменную), в окне видно новое положение, но трогать витрину через окно нельзя. Хранитель открывает зал **один раз** — когда пришёл первый читатель; остальные просто смотрят в те же окна. Перед началом чтения читатель заранее заказывает все нужные залы (импорты поднимаются), и зал с зависимостями открывается раньше. Если два зала ждут друг друга, один из них начнёт работу, когда экспонаты другого ещё **не выставлены** (TDZ)."),
      table(
        ["Запись", "Что получаем", "Примечание"],
        [
          ["`import { a, b as c } from \"./m.mjs\"`", "Живые привязки `a` и `c`", "Имена должны существовать: иначе `SyntaxError` до выполнения"],
          ["`import def from \"./m.mjs\"`", "Привязка к `export default`", "Имя выбирает импортёр"],
          ["`import * as ns from \"./m.mjs\"`", "Объект-пространство имён", "Не изменяется, `Symbol.toStringTag` — `Module`, нет прототипа"],
          ["`import \"./m.mjs\"`", "Только побочные эффекты", "Модуль выполнен, имён нет"],
          ["`export { x as y }`", "Экспорт под другим именем", "`export { default as Foo } from …` — переименование default"],
          ["`export * from \"./m.mjs\"`", "Реэкспорт всех именованных", "`default` не реэкспортируется"],
          ["`await import(\"./m.mjs\")`", "Пространство имён во время выполнения", "Загрузка по требованию, можно вычислять путь"],
        ],
        "Формы import и export",
      ),
    ]),

    section("technical", [
      h("Именованные и default-экспорты, живые привязки"),
      code("js", `export let count = 0;                          // именованный экспорт переменной
export function inc() { count++; }             // функция, меняющая её
export const LIMIT = 3;
export default function describe() { return \`count = \${count}\`; }   // экспорт по умолчанию

console.log("[counter.mjs] модуль выполнен");`, { filename: "counter.mjs" }),
      code("js", `import describe, { count, inc, LIMIT } from "./counter.mjs";   // default и именованные
import * as ns from "./counter.mjs";                            // пространство имён

console.log(count, describe());
inc(); inc();
console.log("живая связь:", count, ns.count, describe());       // импорт — не копия: видит изменения

try { count = 10; } catch (e) { console.log(e.name + ": " + e.message); }     // импортированную привязку нельзя присвоить
try { ns.count = 10; } catch (e) { console.log(e.name + ": " + e.message); }
try { delete ns.LIMIT; } catch (e) { console.log(e.name + ": " + e.message); }

console.log(Object.keys(ns), ns[Symbol.toStringTag], typeof ns, Object.getPrototypeOf(ns));
console.log(ns.default === describe, Object.isExtensible(ns), LIMIT);`, { filename: "e1-live.mjs", lineNumbers: true }),
      code("text", `[counter.mjs] модуль выполнен
0 count = 0
живая связь: 2 2 count = 2
TypeError: Assignment to constant variable.
TypeError: Cannot assign to read only property 'count' of object '[object Module]'
TypeError: Cannot delete property 'LIMIT' of [object Module]
[ 'LIMIT', 'count', 'default', 'inc' ] Module object null
true false 3`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Порядок вывода:** `[counter.mjs] модуль выполнен` напечатан **раньше** первой строки `e1-live.mjs`: импорты выполняются до тела импортирующего модуля.",
        "**Живая связь:** после двух вызовов `inc()` и `count`, и `ns.count`, и результат `describe()` показывают `2`. Импортируемое имя — окно в переменную модуля-источника.",
        "**Запрет присваивания:** `count = 10` — `TypeError: Assignment to constant variable.`; запись через пространство имён — `Cannot assign to read only property 'count' of object '[object Module]'`; `delete ns.LIMIT` — `Cannot delete property 'LIMIT' of [object Module]`.",
        "**Пространство имён:** `Object.keys(ns)` — `['LIMIT', 'count', 'default', 'inc']` (по алфавиту), `ns[Symbol.toStringTag]` — `Module`, прототип — `null`, объект нерасширяем (`Object.isExtensible(ns)` — `false`); `ns.default === describe`.",
        "**Мутация объектов:** если экспортируется **объект**, его свойства изменять можно (`config.debug = true`), и это увидят все импортёры; запрещено лишь переприсвоение самой привязки.",
      ),

      h("Один экземпляр и поднятие импортов"),
      code("js", `console.log("[side.mjs] выполняется (один раз)");
export const instance = { createdAt: "один и тот же объект" };`, { filename: "side.mjs" }),
      code("js", `import { fromA } from "./user-a.mjs";
import { fromB } from "./user-b.mjs";
import { instance } from "./side.mjs";

console.log("всё импортировано; один и тот же объект:", fromA === fromB, fromA === instance);
const again = await import("./side.mjs");                       // повторный динамический импорт — тот же модуль
console.log("динамический импорт возвращает тот же экземпляр:", again.instance === instance);
console.log("поднятие: импорты выполнены до первой строки этого файла");`, { filename: "e2-singleton.mjs", lineNumbers: true }),
      code("text", `[side.mjs] выполняется (один раз)
всё импортировано; один и тот же объект: true true
динамический импорт возвращает тот же экземпляр: true
поднятие: импорты выполнены до первой строки этого файла`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Выполнен один раз:** `side.mjs` импортируют `user-a.mjs`, `user-b.mjs` и сам `e2-singleton.mjs`, но сообщение напечатано единожды.",
        "**Общий экземпляр:** `fromA === fromB === instance` — модуль-синглтон без дополнительного кода.",
        "**Динамический импорт** возвращает тот же модуль из кэша, а не выполняет заново.",
        "**Поднятие:** строка `console.log` в конце файла выводится после всех сообщений из импортированных модулей.",
      ),

      h("Циклические зависимости"),
      code("js", `import { fromB, useAInB } from "./cyc-b.mjs";
console.log("[a] начало; fromB =", fromB);
export const fromA = "значение из a";
export function helperA() { return "helperA работает"; }
console.log("[a] конец; useAInB() =", useAInB());`, { filename: "cyc-a.mjs" }),
      code("js", `import { fromA, helperA } from "./cyc-a.mjs";
console.log("[b] выполняется раньше конца a; helperA (объявление функции) уже доступна:", helperA());
try { console.log(fromA); } catch (e) { console.log("[b]", e.name + ": " + e.message); }
export const fromB = "значение из b";
export function useAInB() { return "b видит a: " + fromA; }`, { filename: "cyc-b.mjs" }),
      code("text", `[b] выполняется раньше конца a; helperA (объявление функции) уже доступна: helperA работает
[b] ReferenceError: Cannot access 'fromA' before initialization
[a] начало; fromB = значение из b
[a] конец; useAInB() = b видит a: значение из a`, { filename: "вывод Node.js 22.22.0 (точка входа импортирует cyc-a)" }),
      ul(
        "**Порядок:** точка входа импортирует `a`; `a` импортирует `b`; `b` — `a` (цикл), поэтому **`b` выполняется первым**, а `a` ещё не начал тело.",
        "**Что доступно в `b`:** объявление функции `helperA` уже работает (функции инициализируются при создании модуля), а `const fromA` — `ReferenceError: Cannot access 'fromA' before initialization` (TDZ).",
        "**Когда цикл «безопасен»:** если значения используются позже (внутри функций, вызываемых после загрузки): `useAInB()` вызвана в конце `a` и видит `fromA`.",
        "**Исправление:** вынести общее в третий модуль, который ни от кого не зависит (см. упражнение).",
      ),

      h("Динамический импорт, `import.meta`, top-level await, JSON"),
      code("js", `import data from "./data.json" with { type: "json" };       // атрибут импорта: тип модуля

console.log("до динамического импорта");
const btn = true;
if (btn) {
  const mod = await import("./lazy.mjs");                   // загружается и выполняется только здесь
  console.log("после:", mod.name, mod.default);
}
console.log(data);

// import.meta
console.log(typeof import.meta.url, import.meta.url.startsWith("file://"), import.meta.url.endsWith("e4-dynamic.mjs"));
console.log(typeof import.meta.dirname, import.meta.filename.endsWith("e4-dynamic.mjs"));
const sibling = new URL("./data.json", import.meta.url);
console.log(sibling.pathname.endsWith("/data.json"));

// динамический импорт — выражение: работает с вычисляемым путём и внутри функции
const load = async (n) => (await import(\`./\${n}.mjs\`)).name;
console.log(await load("lazy"));

// top-level await
const value = await Promise.resolve("значение после await на верхнем уровне");
console.log(value);

// ошибка динамического импорта
try { await import("./no-such-file.mjs"); } catch (e) { console.log(e.name, e.code); }`, { filename: "e4-dynamic.mjs", lineNumbers: true }),
      code("text", `до динамического импорта
[lazy.mjs] загружен по требованию
после: lazy { kind: 'default-объект' }
{ name: 'конфиг', items: [ 1, 2, 3 ] }
string true true
string true
true
lazy
значение после await на верхнем уровне
Error ERR_MODULE_NOT_FOUND`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**По требованию:** `lazy.mjs` загрузился и выполнился **только** в момент `await import(...)`; статические импорты (`data.json`) — до начала файла.",
        "**Выражение:** аргумент `import()` может быть вычисляемой строкой (например, шаблонной, собранной из имени модуля); результат — пространство имён (`mod.name`, `mod.default`).",
        "**`import.meta`:** `url` — строка `file://…/e4-dynamic.mjs`; в Node.js 22 есть также `filename` и `dirname`. Относительные адреса строят через `new URL(\"./data.json\", import.meta.url)`.",
        "**Top-level `await`:** допустим только в модулях; зависимые модули ждут завершения.",
        "**JSON-модуль:** `import data from \"./data.json\" with { type: \"json\" }` — атрибут `type` обязателен.",
        "**Ошибка загрузки:** отказ обещания `Error` с кодом `ERR_MODULE_NOT_FOUND` (в Node.js); в браузере — `TypeError: Failed to fetch dynamically imported module`.",
      ),

      h("Совместимость с CommonJS"),
      code("js", `import { createRequire } from "node:module";
import legacy, { add, name } from "./legacy.cjs";           // ESM → CJS: default = module.exports, именованные — по анализу
import sum from "./legacy-default.cjs";
import * as nsLegacy from "./legacy.cjs";

console.log(add(1, 2), name, Object.keys(legacy), sum(1, 2, 3));
console.log(Object.keys(nsLegacy));

// в ESM нет require, __dirname и module.exports
console.log(typeof require, typeof module, typeof exports, typeof __dirname, typeof __filename);
const require2 = createRequire(import.meta.url);               // но require можно получить явно
console.log(require2("./legacy.cjs").extra);

// CJS → ESM: require() модуля ESM (Node.js 22.12+)
try {
  const esm = require2("./counter.mjs");
  console.log("require(esm):", Object.keys(esm));
} catch (e) { console.log(e.name, e.code); }

// какой формат у файла
console.log(process.versions.node.split(".")[0] >= 22);`, { filename: "e5-interop.mjs", lineNumbers: true }),
      code("text", `3 cjs-модуль [ 'add', 'name', 'extra' ] 6
[ 'add', 'default', 'extra', 'name' ]
undefined undefined undefined undefined undefined
42
[counter.mjs] модуль выполнен
require(esm): [ 'LIMIT', '__esModule', 'count', 'default', 'inc' ]
true`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**ESM → CJS:** `import legacy from \"./legacy.cjs\"` даёт `module.exports` целиком; именованные импорты (`add`, `name`) Node.js выводит анализом `exports.x = …`; в пространстве имён присутствуют `default` и найденные имена.",
        "**В ESM нет** `require`, `module`, `exports`, `__dirname`, `__filename` (все `undefined`); `require` получают через `createRequire(import.meta.url)`, а пути — из `import.meta`.",
        "**CJS → ESM:** `require()` модуля ES в Node.js 22.22.0 **работает** (сообщение модуля выведено, у результата ключи `LIMIT`, `__esModule`, `count`, `default`, `inc`); в старых версиях Node.js — `ERR_REQUIRE_ESM`. Если код должен работать в разных версиях, используйте `import()`.",
        "**Правило проекта:** выберите один формат (`\"type\": \"module\"` в `package.json` или `.mjs`) и не смешивайте без необходимости.",
      ),

      h("Типичные ошибки загрузки в Node.js"),
      code("js", `import { writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("./", import.meta.url));
const tryImport = async (spec) => {
  try { await import(spec); return "ok"; }
  catch (e) { return \`\${e.name}\${e.code ? " [" + e.code + "]" : ""}: \${e.message.split("\\n")[0].replaceAll(dir, "<проект>/")}\`; }
};

const files = {
  "bad-name.mjs": 'import { missing } from "./counter.mjs";\\n',
  "bad-default.mjs": 'import nothing from "./side-no-default.mjs";\\n',
  "side-no-default.mjs": "export const a = 1;\\n",
  "bad-syntax.mjs": "import { a from './counter.mjs';\\n",
  "missing-ext.mjs": "export const ok = 1;\\n",
};
for (const [name, text] of Object.entries(files)) writeFileSync(new URL("./" + name, import.meta.url), text);
try {
  for (const spec of ["./bad-name.mjs", "./bad-default.mjs", "./bad-syntax.mjs", "./missing-ext", "./nope.mjs", "node:nonexistent", "bare-package"]) {
    console.log(spec.padEnd(18), "→", await tryImport(spec));
  }
} finally {
  for (const name of Object.keys(files)) rmSync(new URL("./" + name, import.meta.url), { force: true });
}`, { filename: "e6-errors.mjs", lineNumbers: true, collapsed: true }),
      code("text", `./bad-name.mjs     → SyntaxError: The requested module './counter.mjs' does not provide an export named 'missing'
./bad-default.mjs  → SyntaxError: The requested module './side-no-default.mjs' does not provide an export named 'default'
./bad-syntax.mjs   → SyntaxError: Unexpected identifier 'from'
./missing-ext      → Error [ERR_MODULE_NOT_FOUND]: Cannot find module '<проект>/missing-ext' imported from <проект>/e6-errors.mjs
./nope.mjs         → Error [ERR_MODULE_NOT_FOUND]: Cannot find module '<проект>/nope.mjs' imported from <проект>/e6-errors.mjs
node:nonexistent   → Error [ERR_UNKNOWN_BUILTIN_MODULE]: No such built-in module: node:nonexistent
bare-package       → Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'bare-package' imported from <проект>/e6-errors.mjs`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Нет такого экспорта:** `SyntaxError: The requested module './counter.mjs' does not provide an export named 'missing'` — ошибка при связывании, до выполнения любого кода. Так же для `default`.",
        "**Синтаксис:** `import { a from …` — обычный `SyntaxError`.",
        "**Расширение обязательно:** `./missing-ext` вместо `./missing-ext.mjs` — `ERR_MODULE_NOT_FOUND`; Node.js не подбирает расширения (бандлеры подбирают).",
        "**Встроенные модули:** префикс `node:`; несуществующий — `ERR_UNKNOWN_BUILTIN_MODULE`.",
        "**Пакеты:** «голое» имя без установленного пакета — `Cannot find package 'bare-package'`.",
      ),

      h("Модули в браузере"),
      code("html", `<!doctype html>
<meta charset="utf-8">
<title>ESM в браузере</title>
<script>window.log = []; window.log.push("классический скрипт (встроенный)");</script>
<script type="importmap">
{ "imports": { "lib/": "./lib/" } }
</script>
<script type="module" src="./app.mjs"></script>
<script type="module" src="./side.mjs"></script>
<script type="module">window.log.push("встроенный модуль"); window.inlineDone = true;</script>
<script nomodule>window.log.push("nomodule-скрипт (в современных браузерах не выполняется)");</script>
<script defer>window.log.push("defer-скрипт без src игнорирует defer");</script>
<script>window.log.push("классический скрипт (после модулей в разметке)");</script>
<script>addEventListener("DOMContentLoaded", () => window.log.push("DOMContentLoaded"));</script>`, { filename: "index.html", collapsed: true }),
      code("js", `import { greet, where } from "lib/util.mjs";         // «голое» имя — работает благодаря import map
import "./side.mjs";
window.log.push("app.mjs: " + greet("Аня"));
window.result = { where, appUrl: import.meta.url.replace(location.origin, ""), thisIsUndefined: this === undefined };`, { filename: "app.mjs", collapsed: true }),
      code("text", `порядок выполнения:
  классический скрипт (встроенный)
  defer-скрипт без src игнорирует defer
  классический скрипт (после модулей в разметке)
  util.mjs выполнен
  side.mjs выполнен
  app.mjs: Привет, Аня!
  встроенный модуль
  DOMContentLoaded
результат: {"where":"/lib/util.mjs","appUrl":"/app.mjs","thisIsUndefined":true}
запросы модулей (по одному разу): ["/app.mjs","/side.mjs","/lib/util.mjs"]
без import map: pageerror: Failed to resolve module specifier "lib/util.mjs". Relative references must start with either "/", "./", or "../". | app.mjs выполнился: false`, { filename: "вывод Chromium 141 (по http)" }),
      ul(
        "**Порядок:** сначала все классические скрипты (в том числе `defer` без `src`, который игнорируется), **затем** модули (`util.mjs` → `side.mjs` → `app.mjs` → встроенный модуль), потом `DOMContentLoaded`. Модули отложены, как `defer`.",
        "**`nomodule`:** скрипт не выполнился — современный браузер его пропускает (служит запасным вариантом для старых).",
        "**Каждый модуль загружен один раз** (`/app.mjs`, `/side.mjs`, `/lib/util.mjs`), хотя `side.mjs` подключён и напрямую, и через `app.mjs`.",
        "**Строгий режим:** `this` на верхнем уровне — `undefined`; `import.meta.url` — адрес модуля (`/app.mjs`).",
        "**Import map:** `{ \"imports\": { \"lib/\": \"./lib/\" } }` позволяет писать `import … from \"lib/util.mjs\"`. Без неё: `Failed to resolve module specifier \"lib/util.mjs\". Relative references must start with either \"/\", \"./\", or \"../\".`; `app.mjs` не выполняется.",
        "**CORS и `file://`:** модули загружаются по правилам CORS; страница с `file://` не загрузит модульный скрипт (замер в теме о среде выполнения). Используйте локальный сервер.",
      ),
    ]),

    section("syntax", [
      annotated(
        "js",
        `import { readFile } from "node:fs/promises";   // именованный импорт из встроенного модуля
import path, { join } from "node:path";        // default и именованный в одной строке
import * as math from "./math.mjs";            // всё пространство имён модуля

export const VERSION = "1.0";                  // именованный экспорт
export function main() {                       // ещё один именованный экспорт
  return math.square(3) + join("a", "b").length;
}
export default main;                           // экспорт по умолчанию (один на модуль)

export { path as nodePath };                   // экспорт под другим именем
export * from "./math.mjs";                    // реэкспорт всего (кроме default)

const heavy = await import("./heavy.mjs");     // динамический импорт возвращает обещание
console.log(import.meta.url);                  // адрес текущего модуля`,
        [
          { line: 1, text: "Именованный импорт: `{ readFile }` — имя должно существовать в экспортах модуля; `node:` — встроенные модули Node.js." },
          { line: 2, text: "`path` — default-экспорт, `{ join }` — именованный: оба в одной строке." },
          { line: 3, text: "`import * as math` — одно пространство имён вместо отдельных имён; обращение `math.square`." },
          { line: [5, 6], text: "Именованные экспорты: `export` перед объявлением; их может быть сколько угодно." },
          { line: 9, text: "`export default` — один на модуль; импортёр сам выбирает имя." },
          { line: 11, text: "Список экспорта с переименованием: наружу уходит имя `nodePath`." },
          { line: 12, text: "Реэкспорт всех именованных экспортов другого модуля (default не входит)." },
          { line: 14, text: "Динамический импорт возвращает обещание; `await` на верхнем уровне допустим в модулях." },
          { line: 15, text: "`import.meta.url` — адрес текущего модуля; от него строят относительные пути." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Лаборатория модулей</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 36rem; }
  textarea { width: 100%; min-height: 8rem; font: 14px/1.4 ui-monospace, monospace; }
  button { font: inherit; padding: .3rem .9rem; margin-right: .5rem; }
  pre { background: #8881; padding: .75rem; border-radius: 6px; white-space: pre-wrap; }
</style>
<h1>Лаборатория модулей</h1>
<label for="src">Код модуля:</label>
<textarea id="src" spellcheck="false">export let count = 0;
export function inc() { count++; }
export default { kind: "объект по умолчанию" };
console.log("модуль выполнен");</textarea>
<p>
  <button id="load">Загрузить через import()</button>
  <button id="inc">Вызвать inc()</button>
</p>
<pre id="out" aria-live="polite">Нажмите «Загрузить».</pre>
<script type="module">
  const src = document.querySelector("#src");
  const out = document.querySelector("#out");
  let ns = null;                                            // пространство имён загруженного модуля

  function show(extra = "") {
    out.textContent = [
      "export'ы: " + Object.keys(ns).join(", "),
      "ns.count = " + ns.count,
      "default: " + JSON.stringify(ns.default),
      extra,
    ].filter(Boolean).join("\\n");
  }

  document.querySelector("#load").addEventListener("click", async () => {
    const url = URL.createObjectURL(new Blob([src.value], { type: "text/javascript" }));   // модуль из строки
    try {
      ns = await import(url);                                // динамический импорт
      show("загружено: " + typeof ns.inc);
    } catch (error) {
      ns = null;
      out.textContent = \`\${error.name}: \${error.message}\`;
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  document.querySelector("#inc").addEventListener("click", () => {
    if (!ns || typeof ns.inc !== "function") { out.textContent = "Сначала загрузите модуль с функцией inc."; return; }
    ns.inc();
    show("живая связь: ns.count видит изменение");           // не копия, а привязка к переменной модуля
  });
</script>`, { filename: "module-lab.html", runnable: true, lineNumbers: true }),
      p("Страница превращает текст в модуль через `Blob` и загружает его динамическим `import()`. Замер в Chromium 141: после «Загрузить» показаны экспорты `count, default, inc`, `ns.count = 0`, `default: {\"kind\":\"объект по умолчанию\"}`, в консоли — «модуль выполнен»; после двух нажатий на «Вызвать inc()» — `ns.count = 2` (живая связь); для кода `export const x = ;` — `SyntaxError: Unexpected token ';'`; ошибок страницы нет. Если песочница блокирует адреса `blob:`, откройте пример отдельной страницей."),
    ]),

    section("detailed-example", [
      p("Загрузчик плагинов-команд: модули `*.mjs` экспортируют по умолчанию `{ name, run }`; `loadCommands(urls)` загружает их **параллельно**, проверяет форму, ловит ошибки загрузки и дубликаты и возвращает `{ commands, errors }`; `runCommand` выполняет строку вида `имя арг1 арг2`. Тест создаёт настоящие файлы-модули во временной папке."),
      code("js", `// Загружает модули-команды по URL. Каждый модуль экспортирует по умолчанию { name, description, run }.
export async function loadCommands(urls) {
  const settled = await Promise.allSettled(urls.map((url) => import(url)));   // загрузка параллельно, порядок результатов сохранён
  const commands = new Map();
  const errors = [];

  settled.forEach((result, i) => {
    const url = urls[i];
    if (result.status === "rejected") {
      errors.push({ url, reason: \`\${result.reason.name}: \${String(result.reason.message).split("\\n")[0]}\` });
      return;
    }
    const cmd = result.value.default;
    if (cmd === null || typeof cmd !== "object" || typeof cmd.name !== "string" || typeof cmd.run !== "function") {
      errors.push({ url, reason: "Неверная форма: нужен default-экспорт { name, run }" });
      return;
    }
    if (commands.has(cmd.name)) {
      errors.push({ url, reason: \`Команда «\${cmd.name}» уже зарегистрирована\` });
      return;
    }
    commands.set(cmd.name, cmd);
  });

  return { commands, errors };
}

// Выполняет строку вида «имя арг1 арг2»
export async function runCommand(commands, line) {
  const [name, ...args] = line.trim().split(/\\s+/);
  const cmd = commands.get(name);
  if (!cmd) throw new Error(\`Неизвестная команда: \${name}\`);
  return await cmd.run(args);
}`, { filename: "commands.mjs", lineNumbers: true }),
      code("js", `import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadCommands, runCommand } from "./commands.mjs";

const dir = mkdtempSync(join(tmpdir(), "cmds-"));
const make = (file, source) => { writeFileSync(join(dir, file), source); return pathToFileURL(join(dir, file)).href; };

const urls = [
  make("echo.mjs", 'export default { name: "echo", description: "печатает аргументы", run: (args) => args.join(" ") };'),
  make("sum.mjs", 'export default { name: "sum", run: async (args) => { await null; return String(args.map(Number).reduce((a, b) => a + b, 0)); } };'),
  make("broken.mjs", "export default { name: 'x', run: ( };"),
  make("shape.mjs", 'export default { name: "noRun" };'),
  make("nodefault.mjs", "export const name = 'oops';"),
  make("dup.mjs", 'export default { name: "echo", run: () => "дубликат" };'),
  pathToFileURL(join(dir, "missing.mjs")).href,
];

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);

const { commands, errors } = await loadCommands(urls);
check("зарегистрированы корректные команды в порядке URL", [...commands.keys()], ["echo", "sum"]);
check("ошибок по числу плохих модулей", errors.length, 5);
check("синтаксическая ошибка модуля сообщается", errors.find((e) => e.url.endsWith("broken.mjs")).reason.startsWith("SyntaxError"), true);
check("неверная форма", errors.find((e) => e.url.endsWith("shape.mjs")).reason, "Неверная форма: нужен default-экспорт { name, run }");
check("нет default-экспорта", errors.find((e) => e.url.endsWith("nodefault.mjs")).reason.startsWith("Неверная форма"), true);
check("дубликат имени", errors.find((e) => e.url.endsWith("dup.mjs")).reason, "Команда «echo» уже зарегистрирована");
check("несуществующий файл", errors.find((e) => e.url.endsWith("missing.mjs")).reason.startsWith("Error: Cannot find module"), true);
check("первая команда осталась прежней при дубликате", await runCommand(commands, "echo привет мир"), "привет мир");
check("асинхронная команда", await runCommand(commands, "sum 1 2 3"), "6");

let message = "нет ошибки";
try { await runCommand(commands, "nope"); } catch (e) { message = e.message; }
check("неизвестная команда", message, "Неизвестная команда: nope");

const again = await loadCommands([urls[0]]);
check("повторная загрузка того же модуля даёт тот же объект", again.commands.get("echo") === commands.get("echo"), true);

rmSync(dir, { recursive: true, force: true });

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "commands-test.mjs", collapsed: true }),
      code("text", `Все 11 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Решение", "Что даёт", "Почему так"],
        [
          ["`Promise.allSettled(urls.map((url) => import(url)))`", "Параллельная загрузка и устойчивость к ошибкам", "`Promise.all` отклонился бы на первом сбойном модуле; `allSettled` даёт результат по каждому, порядок сохраняется"],
          ["`result.reason.name` и первая строка сообщения", "Понятная причина отказа", "`SyntaxError`, `ERR_MODULE_NOT_FOUND` различаются по имени; многострочные сообщения укорачиваются"],
          ["Проверка формы `default`", "Защита от модулей без `default` или с неверным типом", "`import()` успешен даже для модуля без `default` — `result.value.default` будет `undefined`"],
          ["`commands.has(cmd.name)` до `set`", "Обнаружение дубликатов", "Первая команда сохраняется, повтор — в `errors`: детерминированное поведение"],
          ["`pathToFileURL(...).href`", "Корректный адрес для `import()`", "Динамический импорт принимает URL; пути ОС (особенно Windows) — нет"],
          ["Повторная загрузка того же URL", "Тот же объект", "Кэш модулей: `again.commands.get(\"echo\") === commands.get(\"echo\")`"],
        ],
        "Разбор загрузчика",
      ),
      ul(
        "Все 11 проверок проходят: порядок регистрации, 5 ошибок для 5 плохих модулей (синтаксис, неверная форма, нет default, дубликат, нет файла), асинхронная команда, неизвестная команда, кэш модулей.",
        "**Безопасность:** динамический импорт **выполняет код** модуля. Загружайте только доверенные файлы; для недоверенных нужен отдельный процесс или песочница.",
        "**Кэш модулей:** изменённый файл по тому же URL повторно не загрузится; для перезагрузки добавляют уникальную часть адреса (`?v=…`), что создаёт новый экземпляр и расходует память.",
      ),
    ]),

    section("internals", [
      h("Три фазы: связывание, создание, выполнение"),
      steps(
        [
          ["Построение графа", "Движок читает исходник модуля, разбирает **только** его `import`/`export` и рекурсивно запрашивает зависимости; динамические `import()` на этом шаге не загружаются."],
          ["Создание и связывание", "Для каждого модуля создаётся окружение; экспортируемые имена связываются с импортирующими **привязками** (не копированием значений). Несуществующий экспорт — `SyntaxError` на этом шаге."],
          ["Выполнение", "Модули выполняются в порядке обхода в глубину: зависимости раньше зависимых; каждый — один раз. Функции-объявления инициализированы при создании, `let`/`const`/`class` — в TDZ до своей строки."],
        ],
        "Загрузка графа модулей",
      ),
      p("Поэтому ошибка «нет такого экспорта» возникает до выполнения любого кода (замер: `does not provide an export named 'missing'`), а `import` нельзя вычислять или вкладывать в условия — граф должен быть известен статически. Для динамики есть `import()`."),
      h("Живые привязки и пространство имён"),
      p("Импортируемое имя — **неизменяемая привязка** к переменной экспортирующего модуля. Объект-пространство имён — особый экзотический объект: ключи отсортированы, свойства — `writable: true`, но запись в них запрещена; он без прототипа и нерасширяем. Именно поэтому `import * as ns` не даёт «копию экспортов»: чтение `ns.count` каждый раз обращается к актуальной переменной."),
      h("Циклические зависимости"),
      p("Для цикла `a → b → a` движок не может выполнить зависимость раньше зависимого: `b` выполняется, пока `a` ещё не начал. К тому моменту объявления функций `a` инициализированы, а `const`/`let`/`class` находятся в TDZ. Правило: **не обращайтесь к значениям из цикла на верхнем уровне модуля**; пользуйтесь ими внутри функций, вызываемых позже, либо разорвите цикл (третий модуль с общими данными)."),
      h("Top-level `await` и порядок выполнения"),
      p("Модуль с top-level `await` приостанавливает выполнение зависимых от него модулей, но не независимых соседей: графы обрабатываются параллельно там, где нет зависимостей. Из-за этого сложные сценарии с `await` на верхнем уровне усложняют порядок инициализации; держите его в точках входа и конфигурации."),
      h("Резолвинг: Node.js, браузер, бандлер"),
      p("Спецификатор разрешает **среда**. Браузер: только абсолютные и относительные URL (и «голые» имена через import map). Node.js: относительные пути с обязательным расширением, `node:`-модули, пакеты из `node_modules` (по `exports` в `package.json`). Бандлеры добавляют подбор расширений, алиасы, tree shaking и объединение файлов; их правила — **не** часть языка."),
      h("Tree shaking и побочные эффекты"),
      p("Статическая структура позволяет бандлеру удалять неиспользуемые экспорты. Но модуль, выполняющий побочные эффекты при загрузке (`console.log`, регистрация), нельзя безопасно удалить: такие пакеты помечают `\"sideEffects\": false` только если побочных эффектов нет."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Ждать, что импорт — копия значения"),
      wrongRight(
        "js",
        {
          code: `
            import { count, inc } from "./counter.mjs";
            inc();
            const before = count;       // 1 — значение скопировано в const
            inc();
            console.log(before, count); // 1 2 — count по-прежнему «живой», before — нет
          `,
          note: "Привязка `count` живая, но `const before = count` создала обычную копию числа: сравните с замером x1 (`15 16`).",
        },
        {
          code: `
            import * as counter from "./counter.mjs";
            counter.inc();
            console.log(counter.count);  // всегда актуальное значение
          `,
          note: "Читайте экспорт в момент использования, не копируйте примитивы заранее.",
        },
      ),
      h("Ошибка 2. Присваивать импортированное имя"),
      p("`count = 10` — `TypeError: Assignment to constant variable.` Меняйте состояние через функцию-мутатор, экспортируемую из того же модуля."),
      h("Ошибка 3. Опустить расширение в Node.js"),
      p("`import \"./missing-ext\"` — `ERR_MODULE_NOT_FOUND` (замер). В Node.js ESM расширение обязательно; бандлеры его подбирают, но не стандарт."),
      h("Ошибка 4. Перепутать default и именованный экспорт"),
      p("`import nothing from \"./side-no-default.mjs\"` — `SyntaxError: … does not provide an export named 'default'`. Решите единый стиль: или default, или именованные экспорты — и придерживайтесь его."),
      h("Ошибка 5. Обращаться к значению цикла на верхнем уровне"),
      p("`console.log(fromA)` в `b` при цикле `a ⇄ b` — `ReferenceError: Cannot access 'fromA' before initialization` (замер). Выносите общее в третий модуль или обращайтесь внутри функций."),
      h("Ошибка 6. Использовать `require`, `__dirname`, `module.exports` в ESM"),
      p("В модуле они `undefined` (замер); используйте `import`, `import.meta.dirname`/`import.meta.url`, `createRequire`."),
      h("Ошибка 7. «Голое» имя в браузере без import map"),
      p("`import … from \"lib/util.mjs\"` — `Failed to resolve module specifier` (замер). Нужен import map, абсолютный/относительный адрес либо бандлер."),
      h("Ошибка 8. Загрузка недоверенного кода через `import()`"),
      p("Динамический импорт выполняет код модуля с правами вашего процесса. Не импортируйте адреса, которые контролирует пользователь."),
    ]),

    section("antipatterns", [
      ul(
        "**Модули-«мусорные ящики»** (`utils.mjs` на тысячи строк): делите по смыслу.",
        "**Побочные эффекты при импорте** (изменение глобалей, запуск запросов): модуль должен только объявлять; запуск — явной функцией.",
        "**Круговые зависимости** между пакетами: вынесите общее или переосмыслите границы.",
        "**Смешение default и именованных экспортов** в одном проекте без правил.",
        "**Глобальное изменяемое состояние в синглтонах,** которое невозможно сбросить в тестах.",
        "**`export *` повсюду:** скрывает, откуда имя, и мешает tree shaking.",
        "**`import()` в горячих путях** без кэширования обещания.",
        "**Top-level `await` в «библиотечных» модулях:** блокирует загрузку всех зависимых.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Один формат на проект:** ESM (`\"type\": \"module\"`) для нового кода; CommonJS — только по необходимости.",
        "**Экспортируйте минимально необходимое** и стабильные имена; внутренние детали оставляйте приватными.",
        "**Держите модули без побочных эффектов при загрузке:** конфигурация и запуск — в явных функциях.",
        "**Используйте `import()` для редко нужного кода** (диалоги, редакторы, отчёты) и кэшируйте обещание.",
        "**Разрывайте циклы:** третий модуль, внедрение зависимостей, передача функций.",
        "**Строите пути от `import.meta.url`,** а не от текущей директории процесса.",
        "**В браузере — локальный сервер или сборщик;** для «голых» имён — import map.",
        "**Тестируйте модули изолированно:** внедряйте зависимости, не полагайтесь на глобальное состояние.",
      ),
      tip("Когда видите `does not provide an export named`, откройте экспортирующий файл и сверьте имена (регистр!) и вид экспорта (default или именованный). Эта ошибка — до выполнения кода, значит, дело в тексте импорта."),
    ]),

    section("edge-cases", [
      h("Порядок выполнения при нескольких импортах"),
      p("Модули выполняются в порядке импортов (обход в глубину); ваш код видит результат всех побочных эффектов импортируемых модулей. Если один из них зависит от другого неявно (через глобальную переменную), порядок записи импортов становится критичным — признак плохого дизайна."),
      h("`export let` и мутация извне"),
      p("Менять экспортируемую `let`-переменную может только её модуль (через функции). Импортёры видят изменения, но присвоить не могут (`TypeError`)."),
      h("`export default` и именованное имя"),
      p("`export default function () {}` создаёт анонимную функцию с именем `default`; `export default describe` экспортирует значение выражения (а не привязку — в отличие от именованных экспортов, переприсваивание `describe` позже на `default` не повлияет)."),
      h("Повторные экспорты и конфликты"),
      p("`export * from \"a\"` и `export * from \"b\"` с одинаковым именем делают это имя неоднозначным: при попытке импортировать его — `SyntaxError`."),
      h("Импорт JSON и CSS-модулей"),
      p("JSON-модули требуют атрибута `with { type: \"json\" }` (замер в Node.js 22)."),
      h("Сервис-воркеры и воркеры"),
      p("Веб-воркеры можно запускать как модули: `new Worker(url, { type: \"module\" })`; в них доступны `import` и `import.meta`."),
    ]),

    section("related", [
      ul(
        "[Что такое JavaScript](/learn/js/what-is-js) — скрипт и модуль, порядок загрузки, строгий режим.",
        "[Контекст исполнения и область видимости](/learn/js/execution-context-scope) — TDZ и область модуля.",
        "[Замыкания](/learn/js/closures) — модульный шаблон как предшественник ESM.",
        "[Загрузка ресурсов](/learn/html/resource-loading) — `defer`, `async`, `preload`, `modulepreload`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Глобальные скрипты и зависимость от порядка",
          code: `
            <script src="lib.js"></script>      // создаёт window.Lib
            <script src="app.js"></script>      // использует Lib — работает только после lib.js
            // app.js
            var result = Lib.calc(2);           // глобальная переменная, конфликт имён
          `,
          note: "Зависимости неявные, порядок скриптов критичен, всё живёт в глобальной области.",
        },
        {
          title: "Модули с явными зависимостями",
          code: `
            <script type="module" src="app.mjs"></script>
            // app.mjs
            import { calc } from "./lib.mjs";
            export const result = calc(2);      // доступна только через import
          `,
          note: "Граф зависимостей известен до выполнения, область модуля изолирована, порядок определяется импортами.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.modules-esm.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Файлы `lib.mjs`, `other.mjs` и `main.mjs` показаны ниже. Не запуская, скажите, что и в каком порядке напечатает `node main.mjs`, и объясните каждое значение: поднятие импортов, выполнение один раз, живая привязка, копия `snapshot`, общий объект `config`, запрет присваивания."),
        code("js", `console.log("lib: выполнен");
export let total = 0;
export function add(n) { total += n; return total; }
export const config = { debug: false };
export default function report() { return \`total=\${total}\`; }`, { filename: "lib.mjs" }),
        code("js", `import { add } from "./lib.mjs";
console.log("other: выполнен");
add(10);`, { filename: "other.mjs" }),
        code("js", `import report, { total, add, config } from "./lib.mjs";
import "./other.mjs";

console.log("main: старт, total =", total);
add(5);
const snapshot = total;
add(1);
console.log(snapshot, total, report());

config.debug = true;                                     // объект общий для всех импортёров
const lib = await import("./lib.mjs");
console.log(lib.config.debug, lib.total, lib.default === report);
try { total = 0; } catch (e) { console.log(e.name); }`, { filename: "main.mjs" }),
      ],
      hints: ["Что выполняется до первой строки `main.mjs`?", "Чем отличается `snapshot` от `total` в момент вывода?"],
      checks: ["Порядок сообщений `lib` → `other` → `main`", "Объяснено `15 16`", "Объяснено `true 16 true`", "Объяснён `TypeError`"],
      solution: [
        code("text", `lib: выполнен
other: выполнен
main: старт, total = 10
15 16 total=16
true 16 true
TypeError`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "`main` импортирует `lib`, затем `other`; `other` импортирует тот же `lib` (выполнен уже). Порядок: `lib: выполнен`, `other: выполнен` (внутри `other` вызван `add(10)`), затем тело `main`.",
          "`total` — живая привязка: на старте уже `10` (добавил `other`), после `add(5)` — `15`; `snapshot` скопировал число `15`, а `total` после `add(1)` — `16`: вывод `15 16 total=16`.",
          "`config` — объект: изменение `config.debug` видно через повторный `import()` (тот же экземпляр модуля): `true`, `total` — `16`, `default` — та же функция.",
          "Присваивание импортированного `total = 0` — `TypeError`.",
        ),
      ],
    }),
    exercise({
      id: "js.modules-esm.ex2",
      title: "ReferenceError из-за цикла",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("`bad-b.mjs` импортирует `UNIT` из `bad-a.mjs`, а `bad-a.mjs` — `format` и `PREFIX` из `bad-b.mjs`. При запуске `bad-main.mjs` (импорт `bad-b.mjs`) вы получаете `ReferenceError`. Объясните причину и исправьте, разорвав цикл."),
        code("js", `import { PREFIX, format } from "./bad-b.mjs";
export const UNIT = "кг";
console.log(format(5), PREFIX);`, { filename: "bad-a.mjs" }),
        code("js", `import { UNIT } from "./bad-a.mjs";
export const PREFIX = "Вес: ";
export const format = (n) => PREFIX + n + " " + UNIT;
console.log("b готов");`, { filename: "bad-b.mjs" }),
      ],
      hints: ["Какой модуль выполнится первым при импорте `bad-b.mjs` из точки входа?", "Куда вынести общие константы?"],
      checks: ["Названа причина (TDZ `format` в цикле)", "Цикл разорван третьим модулем", "Результат `Вес: 5 кг кг`"],
      solution: [
        code("js", `export const UNIT = "кг";
export const PREFIX = "Вес: ";`, { filename: "good-shared.mjs" }),
        code("js", `import { UNIT, PREFIX } from "./good-shared.mjs";
export const format = (n) => PREFIX + n + " " + UNIT;`, { filename: "good-format.mjs" }),
        code("js", `import { format } from "./good-format.mjs";
import { UNIT } from "./good-shared.mjs";
console.log(format(5), UNIT);`, { filename: "good-main.mjs" }),
        code("text", `ReferenceError: Cannot access 'format' before initialization`, { filename: "было (точка входа импортирует bad-b)" }),
        code("text", `Вес: 5 кг кг`, { filename: "стало" }),
        p("При импорте `bad-b` первым **выполняется `bad-a`** (его зависимость), и на верхнем уровне он вызывает `format`, которая в `bad-b` ещё в TDZ. Исправление: общие константы — в модуль `good-shared.mjs`, который ни от кого не зависит; оба потребителя импортируют его, цикла нет."),
      ],
    }),
    exercise({
      id: "js.modules-esm.ex3",
      title: "Ленивая загрузка с повтором",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Напишите `lazy(importer)`: возвращает функцию `load()`, которая вызывает `importer` (например, `() => import(\"./heavy.mjs\")`) **не раньше первого вызова**, делит одну загрузку между параллельными вызовами, кэширует успешный результат, а после неудачи при следующем вызове пробует снова. Синхронное исключение `importer` должно превращаться в отказ обещания."),
      ],
      hints: ["Что кэшировать: результат или обещание?", "Когда сбрасывать кэш?"],
      checks: ["Загрузки нет до первого вызова", "Параллельные вызовы делят одно обещание", "После ошибки повторная попытка", "Синхронное исключение → отказ"],
      solution: [
        code("js", `// Ленивая загрузка с кэшированием обещания; после неудачи следующая попытка пробует снова
export function lazy(importer) {
  let promise = null;
  return function load() {
    if (promise === null) {
      promise = Promise.resolve()
        .then(importer)
        .catch((error) => {
          promise = null;                       // сбрасываем кэш: ошибку можно повторить
          throw error;
        });
    }
    return promise;
  };
}`, { filename: "lazy.mjs" }),
        code("js", `import { lazy } from "./lazy.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);

let calls = 0;
const load = lazy(async () => { calls++; return { value: 42 }; });
check("до первого вызова загрузки нет", calls, 0);
const [a, b] = await Promise.all([load(), load()]);
check("параллельные вызовы делят одну загрузку", [calls, a === b, a.value], [1, true, 42]);
check("повторный вызов — из кэша", [await load() === a, calls], [true, 1]);

let attempts = 0;
const flaky = lazy(async () => { attempts++; if (attempts < 3) throw new Error("сеть недоступна"); return "готово"; });
const results = [];
for (let i = 0; i < 4; i++) {
  try { results.push(await flaky()); } catch (e) { results.push(e.message); }
}
check("после ошибки пробует снова, после успеха кэширует", [results, attempts], [["сеть недоступна", "сеть недоступна", "готово", "готово"], 3]);

const syncThrow = lazy(() => { throw new TypeError("синхронная ошибка"); });
let kind = "нет";
try { await syncThrow(); } catch (e) { kind = e.name; }
check("синхронное исключение тоже превращается в отказ обещания", kind, "TypeError");

const real = lazy(() => import("node:path"));
const path = await real();
check("работает с настоящим import()", [typeof path.join, path === await real()], ["function", true]);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "lazy-test.mjs", collapsed: true }),
        code("text", `Все 6 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
        p("Кэшируется **обещание**, поэтому параллельные вызовы делят одну загрузку. `Promise.resolve().then(importer)` превращает синхронные исключения в отказ; в `catch` кэш сбрасывается и ошибка пробрасывается дальше — следующий вызов пробует снова."),
      ],
    }),
  ],

  challenge: {
    id: "js.modules-esm.challenge",
    title: "Загрузчик плагинов-команд",
    scenario: [
      p("Консольному инструменту нужны плагины: каждая команда — отдельный модуль `*.mjs`, экспортирующий по умолчанию `{ name, description?, run(args) }`. Реализуйте модуль `commands.mjs` с функциями `loadCommands(urls)` и `runCommand(commands, line)`."),
    ],
    requirements: [
      "`loadCommands(urls)` загружает модули параллельно и возвращает `{ commands: Map, errors: [{ url, reason }] }`; порядок регистрации — порядок `urls`",
      "Ошибки загрузки (синтаксис, нет файла), неверная форма (`default` не объект с `name` и `run`) и дубликаты имён попадают в `errors` и не прерывают загрузку остальных",
      "`runCommand(commands, line)` разбирает строку `имя арг1 арг2`, вызывает `run(args)` (поддерживая асинхронные команды); неизвестная команда — `Error(\"Неизвестная команда: …\")`",
      "Повторная загрузка того же URL возвращает тот же объект (кэш модулей)",
    ],
    constraints: [
      "Использовать динамический `import()` и `Promise.allSettled`",
      "Без внешних библиотек",
    ],
    acceptance: [
      "Все 11 проверок из теста проходят",
      "Сбойный модуль не мешает загрузке корректных",
      "Первая команда с именем сохраняется при дубликате",
    ],
    hints: [
      "Чем `Promise.allSettled` лучше `Promise.all` для загрузки плагинов?",
      "Что вернёт `import()` для модуля без `default`?",
      "Какой URL принимает `import()` для файла на диске?",
    ],
    solution: [
      code("js", `// Загружает модули-команды по URL. Каждый модуль экспортирует по умолчанию { name, description, run }.
export async function loadCommands(urls) {
  const settled = await Promise.allSettled(urls.map((url) => import(url)));   // загрузка параллельно, порядок результатов сохранён
  const commands = new Map();
  const errors = [];

  settled.forEach((result, i) => {
    const url = urls[i];
    if (result.status === "rejected") {
      errors.push({ url, reason: \`\${result.reason.name}: \${String(result.reason.message).split("\\n")[0]}\` });
      return;
    }
    const cmd = result.value.default;
    if (cmd === null || typeof cmd !== "object" || typeof cmd.name !== "string" || typeof cmd.run !== "function") {
      errors.push({ url, reason: "Неверная форма: нужен default-экспорт { name, run }" });
      return;
    }
    if (commands.has(cmd.name)) {
      errors.push({ url, reason: \`Команда «\${cmd.name}» уже зарегистрирована\` });
      return;
    }
    commands.set(cmd.name, cmd);
  });

  return { commands, errors };
}

// Выполняет строку вида «имя арг1 арг2»
export async function runCommand(commands, line) {
  const [name, ...args] = line.trim().split(/\\s+/);
  const cmd = commands.get(name);
  if (!cmd) throw new Error(\`Неизвестная команда: \${name}\`);
  return await cmd.run(args);
}`, { filename: "commands.mjs", lineNumbers: true }),
      code("text", `Все 11 проверок пройдены`, { filename: "результат запуска тестов" }),
      p("`Promise.allSettled` даёт результат по каждому модулю; форма `default` проверяется явно (для модуля без `default` значение — `undefined`); дубликаты ловятся по `commands.has`."),
    ],
  },

  interview: [
    iq("js.modules-esm.i1", "basic", "Чем модуль ES отличается от обычного скрипта?", [
      ul(
        "Собственная область видимости (переменные не попадают в глобальную), строгий режим по умолчанию, `import`/`export`, `import.meta`, top-level `await`.",
        "Выполняется один раз; в браузере отложен как `defer` и загружается по CORS.",
        "Верхний `this` — `undefined`.",
      ),
    ]),
    iq("js.modules-esm.i2", "basic", "Чем default-экспорт отличается от именованного?", [
      ul(
        "Default — один на модуль, импортёр выбирает имя (`import x from …`); именованных — сколько угодно, имена фиксированы (`import { a } from …`).",
        "`export default` экспортирует значение выражения; именованный — привязку к переменной.",
        "Договоритесь в проекте об одном стиле.",
      ),
    ]),
    iq("js.modules-esm.i3", "intermediate", "Что значит «живая привязка» (live binding)?", [
      ul(
        "Импорт — не копия значения, а ссылка на переменную модуля-источника: изменения видны.",
        "Импортёр не может присвоить значение (`TypeError: Assignment to constant variable.`).",
        "Замер: `import { count, inc }` — после `inc()` дважды `count` стал `2`.",
      ),
    ]),
    iq("js.modules-esm.i4", "intermediate", "Сколько раз выполняется модуль, если его импортируют несколько файлов?", [
      ul(
        "Один раз: модули кэшируются по адресу, все импортёры получают один экземпляр (синглтон).",
        "Повторный `import()` возвращает тот же экземпляр.",
        "Для перезагрузки нужен другой адрес (например, с параметром запроса).",
      ),
    ]),
    iq("js.modules-esm.i5", "intermediate", "Что такое динамический импорт и когда он нужен?", [
      ul(
        "`import(spec)` — выражение, возвращающее обещание с пространством имён; путь можно вычислять, вызов — внутри функций и условий.",
        "Нужен для ленивой загрузки редко используемого кода, выбора модуля по условию, загрузки плагинов.",
        "Ошибки загрузки — отказ обещания.",
      ),
    ]),
    iq("js.modules-esm.i6", "advanced", "Как ведут себя циклические зависимости модулей?", [
      ul(
        "Движок выполняет модули в порядке обхода; в цикле один из модулей выполняется до того, как завершился другой.",
        "Функции-объявления доступны, а `let`/`const`/`class` — в TDZ: `ReferenceError: Cannot access … before initialization`.",
        "Безопасно использовать значения позже (внутри функций); решение — вынести общее в третий модуль или передавать зависимости.",
      ),
    ]),
    iq("js.modules-esm.i7", "engineering", "Как перевести проект с CommonJS на ESM?", [
      ul(
        "Добавить `\"type\": \"module\"` (или переименовать в `.mjs`), заменить `require`/`module.exports` на `import`/`export`.",
        "Указывать расширения в относительных путях; заменить `__dirname`/`__filename` на `import.meta.dirname`/`url`.",
        "Зависимости только CJS подключать через `import` (default) или `createRequire`; для обратной совместимости — двойная публикация (`exports` в `package.json`).",
        "Тесты и линтер перенастроить; проверить все динамические `require`.",
      ),
    ]),
    iq("js.modules-esm.i8", "debugging", "Браузер пишет «Failed to resolve module specifier». Что проверить?", [
      ul(
        "Спецификатор «голый» (`lib/util.mjs`) без import map: используйте относительный адрес (`./lib/util.mjs`) или добавьте import map.",
        "Подключён ли скрипт как `type=\"module\"` и открыта ли страница по `http://` (не `file://`).",
        "Верный ли путь и MIME-тип файла (должен быть JavaScript).",
        "Нет ли опечатки и несовпадения регистра в имени файла.",
      ),
    ]),
  ],

  exam: [
    mcq("js.modules-esm.e1", "foundation", "Что делает `export default` в модуле?", ["Экспортирует все объявленные имена", "Запрещает импорт других имён", "Задаёт единственное экспортируемое по умолчанию значение модуля", "Делает модуль глобальным"], 2, "Один `export default` на модуль; импортёр сам выбирает имя для него."),
    mcq("js.modules-esm.e2", "foundation", "Что вернёт `import()`?", ["Обещание с пространством имён модуля", "Значение синхронно", "Функцию загрузки", "`undefined`"], 0, "Динамический импорт асинхронный и возвращает `Promise` с объектом-пространством имён."),
    mcq("js.modules-esm.e3", "intermediate", "Что произойдёт при `import { count } from \"./counter.mjs\"; count = 10;`?", ["Значение изменится в обоих модулях", "`SyntaxError` при загрузке", "Создастся локальная копия", "`TypeError: Assignment to constant variable.`"], 3, "Импортированные привязки доступны только для чтения (замер)."),
    mcq("js.modules-esm.e4", "intermediate", "Сколько раз выполнится `side.mjs`, если его импортируют три модуля?", ["Три раза", "Один раз", "Два раза", "Зависит от порядка"], 1, "Модули кэшируются: выполнение — один раз, все получают один экземпляр (замер)."),
    mcq("js.modules-esm.e5", "intermediate", "Что верно для модульных скриптов в браузере? Выберите все.", ["Выполняются отложенно, как `defer`", "Верхний `this` равен `window`", "Загружаются по правилам CORS", "Переменные верхнего уровня становятся свойствами `window`"], [0, 2], "У модуля верхний `this` — `undefined`, а переменные остаются в области модуля."),
    mcq("js.modules-esm.e6", "advanced", "Почему в цикле `a ⇄ b` модуль `b` видит `ReferenceError` при обращении к `const fromA` на верхнем уровне?", ["`const` нельзя экспортировать", "Из-за top-level `await`", "`fromA` удалён", "`b` выполняется раньше конца `a`, и `fromA` в TDZ"], 3, "Движок выполняет `b` до тела `a`: функции-объявления доступны, а `const` ещё не инициализирована (замер)."),
    open("js.modules-esm.e7", "intermediate", "Объясните различие между `import x from \"./m.mjs\"`, `import { x } from …` и `import * as m from …`.", [
      ul(
        "Первый — привязка к `default`-экспорту, имя выбирает импортёр.",
        "Второй — привязка к именованному экспорту `x`; имя должно существовать, иначе `SyntaxError` до выполнения.",
        "Третий — объект-пространство имён со всеми экспортами (включая `default`): только чтение, прототипа нет.",
        "Все три — живые привязки; присваивание невозможно.",
      ),
    ], ["Описаны три формы", "Упомянуты живые привязки", "Упомянута ошибка при отсутствии имени"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.modules-esm.m1", "intermediate", "Что получит `import legacy from \"./legacy.cjs\"` из CommonJS-модуля?", ["Пространство имён", "Только `exports.default`", "Значение `module.exports` целиком", "Ошибку"], 2, "Default-импорт из CJS — `module.exports`; именованные Node.js выводит анализом (замер: `Object.keys(legacy)`)."),
    mcq("js.modules-esm.m2", "advanced", "Что ограничивает import map в браузере?", ["Заменяет `type=\"module\"`", "Позволяет задавать «голые» имена адресам модулей", "Подключает CSS", "Включает `file://`"], 1, "Import map сопоставляет спецификаторы адресам: без неё `lib/util.mjs` — `Failed to resolve module specifier` (замер)."),
    mcq("js.modules-esm.m3", "advanced", "Почему `Promise.allSettled` удобнее `Promise.all` в загрузчике плагинов?", ["Ошибка одного модуля не отклоняет весь результат и даёт сведения по каждому", "Быстрее загружает", "Не требует `await`", "Кэширует модули"], 0, "`allSettled` возвращает результат по каждому обещанию, поэтому сбойные плагины попадают в `errors`, а остальные загружаются."),
    open("js.modules-esm.m4", "advanced", "Приложение загружается медленно: бандл 3 МБ, большая часть кода нужна на редких страницах. Опишите план оптимизации на модулях.", [
      ul(
        "Измерить: что входит в бандл (анализатор), какие модули нужны на первой странице; метрики загрузки до и после.",
        "Разделить код: `import()` для редких страниц и тяжёлых виджетов (маршрутизация, редакторы), кэшировать обещания загрузки (`lazy`).",
        "Убрать мёртвый код: tree shaking (ESM, `sideEffects`), замена тяжёлых зависимостей, именованные импорты вместо целых пакетов.",
        "Подсказки браузеру: `modulepreload` для критических модулей, `prefetch` для вероятных следующих.",
        "Контроль: бюджет размера в CI, проверка циклов и побочных эффектов при импорте.",
      ),
    ], ["Описано измерение", "Описано разделение через `import()`", "Описан tree shaking", "Описаны подсказки загрузки"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.modules-esm.f1", front: "Живая привязка?", back: "Импорт — окно в переменную модуля-источника: видит изменения, присвоить нельзя (TypeError)." },
    { id: "js.modules-esm.f2", front: "Выполнение модуля?", back: "Один раз; все импортёры делят экземпляр; импорты поднимаются и выполняются до тела файла." },
    { id: "js.modules-esm.f3", front: "Цикл a ⇄ b?", back: "b выполняется до конца a: функции доступны, const/let — TDZ. Выносите общее в третий модуль." },
    { id: "js.modules-esm.f4", front: "import()?", back: "Динамический импорт: Promise с пространством имён; ленивая загрузка, вычисляемый путь." },
    { id: "js.modules-esm.f5", front: "Браузер?", back: "type=module: отложен, строгий, CORS, this = undefined; «голые» имена — только через import map." },
    { id: "js.modules-esm.f6", front: "Node.js ESM?", back: "Расширение обязательно, node: для встроенных, нет require/__dirname (import.meta, createRequire)." },
    { id: "js.modules-esm.f7", front: "CJS и ESM?", back: "import из CJS: default = module.exports; require(esm) работает в Node 22.12+." },
  ],

  sources: [
    { title: "ECMAScript: Modules", url: "https://tc39.es/ecma262/#sec-modules", publisher: "ECMA" },
    { title: "ECMAScript: Import Calls", url: "https://tc39.es/ecma262/#sec-import-calls", publisher: "ECMA" },
    { title: "HTML Standard: Module scripts and import maps", url: "https://html.spec.whatwg.org/multipage/webappapis.html#import-maps", publisher: "WHATWG" },
    { title: "HTML Standard: The script element (type=module, nomodule)", url: "https://html.spec.whatwg.org/multipage/scripting.html#the-script-element", publisher: "WHATWG" },
    { title: "Node.js: ECMAScript modules", url: "https://nodejs.org/api/esm.html", publisher: "Other" },
    { title: "Node.js: Modules: CommonJS modules", url: "https://nodejs.org/api/modules.html", publisher: "Other" },
    { title: "MDN: JavaScript modules", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules", publisher: "MDN" },
    { title: "MDN: import", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import", publisher: "MDN" },
    { title: "MDN: export", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export", publisher: "MDN" },
    { title: "MDN: import.meta", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta", publisher: "MDN" },
  ],
};
