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

export const whatIsJs: Topic = {
  id: "js.what-is-js",
  slug: "what-is-js",
  domain: "js",
  module: "language",
  title: "Что такое JavaScript: язык, движок и среда выполнения",
  titleEn: "What is JavaScript: the language, the engine and the host environment",
  summary:
    "JavaScript — это язык (его описывает стандарт ECMAScript), который исполняет движок внутри среды: браузера, Node.js или другой. Всё, что вы называете «JavaScript», на деле складывается из трёх слоёв: языка (`Array`, `Promise`, замыкания), среды (`window`, `document`, `process`, `setTimeout`) и способа подключения кода (классический скрипт или модуль, строгий или нестрогий режим). Тема показывает на замерах в Node.js 22 и Chromium 141, чем эти слои отличаются, как скрипты загружаются (порядок `defer`, `async` и `module`), что меняет строгий режим, почему таймер с задержкой 0 мс ждёт конца синхронного цикла и как проверять возможности, а не версии.",
  minutes: 45,
  prerequisites: ["html.what-is-html"],
  tags: ["ECMAScript", "engine", "runtime", "globalThis", "window", "Node.js", "script", "module", "defer", "async", "strict mode", "feature detection", "console", "single thread"],
  keyConcepts: [
    { term: "Язык ≠ среда", text: "ECMAScript задаёт язык: типы, функции, `Promise`, `Map`. `window`, `document`, `setTimeout`, `process` приходят из среды. Замер: в Node.js `typeof window` — `undefined`, в Chromium `typeof process` — `undefined`, а `typeof setTimeout` — `function` в обоих." },
    { term: "Один поток, одна задача", text: "JavaScript выполняет одну задачу за раз. Таймер с задержкой 0 мс не прерывает цикл: в замере он сработал только после синхронного цикла длиной 200 мс." },
    { term: "Как код попадает в страницу", text: "Классический скрипт блокирует разбор, `defer` и `type=\"module\"` выполняются после разбора документа по порядку, `async` — как только загрузится. Порядок зависит от скорости загрузки только у `async`." },
    { term: "Строгий режим — это ошибки вместо тихих последствий", text: "В нестрогом режиме `x = 5` создаёт глобальную переменную; в строгом — `ReferenceError`. Модули и классы строгие всегда." },
    { term: "Проверяйте возможности", text: "Не угадывайте по названию браузера или версии: `typeof structuredClone === \"function\"` отвечает на вопрос «есть ли это здесь и сейчас»." },
  ],
  sections: [
    section("definition", [
      def("JavaScript", "Язык программирования общего назначения, исполняемый в разных средах; браузерный код, серверный код (Node.js) и встроенные скрипты используют один и тот же язык.", "JavaScript"),
      def("ECMAScript", "Стандарт языка (ECMA-262): синтаксис, типы, объекты, функции, `Promise`, модули. «JavaScript» — это реализации ECMAScript плюс API среды.", "ECMAScript"),
      def("Движок", "Программа, которая разбирает и исполняет код на ECMAScript (в Chromium и Node.js — V8, в Firefox — SpiderMonkey, в Safari — JavaScriptCore).", "JavaScript engine"),
      def("Среда выполнения (host)", "Окружение, в котором работает движок и которое добавляет свои возможности: в браузере — DOM, `fetch`, `window`; в Node.js — `process`, файловая система, модули.", "host environment / runtime"),
      def("Глобальный объект", "Объект, свойствами которого становятся глобальные имена среды; единое имя во всех средах — `globalThis` (в браузере это `window`).", "global object"),
      def("Скрипт и модуль", "Две формы исполнения: классический скрипт (общая глобальная область, нестрогий режим по умолчанию) и модуль (`type=\"module\"`, собственная область, строгий режим, `import`/`export`).", "script and module"),
      def("Строгий режим", "Режим, в котором часть тихих ошибок становится явными исключениями (`\"use strict\"`); включён по умолчанию в модулях и классах.", "strict mode"),
    ]),

    section("why", [
      h("Один язык, много «JavaScript»"),
      p("Начинающие часто говорят «JavaScript не работает» и имеют в виду разное: в консоли Node.js `document is not defined`, в браузере `require is not defined`, в старой странице `Cannot use import statement outside a module`. Во всех случаях язык одинаков — различается среда или способ подключения кода."),
      h("Что даёт эта тема"),
      ul(
        "**Диагностика:** вы быстро понимаете, к какому слою относится ошибка: язык, среда или способ загрузки.",
        "**Переносимость:** код, использующий только возможности языка, работает и в браузере, и в Node.js; код с `window`/`process` — нет.",
        "**Ментальная модель:** одна задача за раз и порядок загрузки скриптов объясняют большинство «странностей» порядка выполнения.",
        "**Основа курса:** дальше вы изучаете язык (типы, функции, замыкания, прототипы, асинхронность), а затем браузерные API — и граница между ними должна быть ясна.",
      ),
      insight("Вопрос «что делает этот код?» всегда содержит скрытое продолжение: «**где** и **как** он запущен?» Один и тот же текст может быть ошибкой, глобальной утечкой или корректным модулем."),
    ]),

    section("mental-model", [
      p("Представьте **шахматы** и **шахматный клуб**. Правила игры (как ходит конь, что такое рокировка) одинаковы везде — это ECMAScript. Клуб добавляет часы, доску, табличку с результатами и соседей по столу — это среда: в одном клубе есть часы (`setTimeout`) и доска (`document`), в другом — нет доски, зато есть склад (`fs`). А вот **способ войти в зал** (классический скрипт или модуль) определяет, как вас рассадят: в общем зале всё общее, в отдельной комнате — своё."),
      table(
        ["Слой", "Что содержит", "Примеры", "Где определён"],
        [
          ["Язык", "Синтаксис, типы, объекты, функции, итераторы, `Promise`, `Map`", "`Array`, `JSON`, `Promise`, `Symbol`, замыкания, классы", "ECMA-262"],
          ["Среда: браузер", "DOM, события, сеть, хранилища, таймеры", "`window`, `document`, `fetch`, `localStorage`, `setTimeout`", "HTML Standard, DOM, Fetch и др."],
          ["Среда: Node.js", "Процесс, файловая система, сеть, модули", "`process`, `fs`, `Buffer`, `setTimeout`", "документация Node.js"],
          ["Способ подключения", "Область видимости, режим, порядок выполнения", "`<script>`, `defer`, `async`, `type=\"module\"`, `\"use strict\"`", "HTML Standard, ECMA-262"],
        ],
        "Слои «JavaScript»",
      ),
    ]),

    section("technical", [
      h("Три слоя: стандарт, движок, среда"),
      p("**ECMAScript** — документ. Его пишет комитет TC39 при организации Ecma International; с 2015 года выходит новая редакция каждый год (ES2015, ES2016, …). Новая возможность проходит стадии предложения и после включения в редакцию реализуется движками. **Движок** превращает исходный текст в исполняемый код: разбирает его, компилирует и оптимизирует часто исполняемые участки. **Среда** создаёт движок, подключает к нему свои объекты и запускает код: браузер — для страницы, Node.js — для файла."),

      h("Что есть где"),
      p("Замер на Node.js 22.22.0 (файл `.mjs`) и Chromium 141:"),
      table(
        ["Выражение", "Node.js (модуль)", "Chromium (страница)"],
        [
          ["`typeof globalThis`", "`object`", "`object`"],
          ["`typeof window`", "`undefined`", "`object`"],
          ["`typeof document`", "`undefined`", "`object`"],
          ["`typeof process`", "`object`", "`undefined`"],
          ["`typeof setTimeout`", "`function`", "`function`"],
          ["`typeof require` (модуль / страница)", "`undefined` в ESM", "`undefined`"],
          ["`this` на верхнем уровне классического скрипта", "—", "`window` (`this === window` — `true`)"],
          ["`this` на верхнем уровне модуля", "`undefined`", "`undefined`"],
          ["`globalThis === window`", "—", "`true`"],
        ],
        "Что есть в разных средах",
      ),
      code("js", `// Что есть в Node.js «из коробки», а что — нет
console.log("typeof globalThis:", typeof globalThis);
console.log("typeof window:   ", typeof window);
console.log("typeof document: ", typeof document);
console.log("typeof process:  ", typeof process);
console.log("typeof setTimeout:", typeof setTimeout);
console.log("this на верхнем уровне модуля:", this);`, { filename: "e1-node-global.mjs" }),
      code("text", `typeof globalThis: object
typeof window:    undefined
typeof document:  undefined
typeof process:   object
typeof setTimeout: function
this на верхнем уровне модуля: undefined`, { filename: "вывод Node.js 22.22.0" }),
      p("`setTimeout` есть в обеих средах, но **не входит в ECMAScript**: его описывают спецификация HTML (браузер) и документация Node.js. Поэтому в чистом движке без среды таймера нет; то же относится к `console` — его описывает отдельный стандарт Console."),

      h("Как скрипт попадает в страницу"),
      p("Четыре способа и порядок выполнения. Чтобы порядок не зависел от случая, замер сделан на локальном сервере с заданной задержкой ответа для каждого файла:"),
      table(
        ["Способ", "Когда выполняется", "Порядок между скриптами"],
        [
          ["Встроенный классический `<script>`", "Сразу при разборе, блокирует его", "По порядку в документе"],
          ["`<script src>` без атрибутов", "Сразу, блокируя разбор (после загрузки файла)", "По порядку в документе"],
          ["`<script defer src>`", "После завершения разбора, до `DOMContentLoaded`", "**По порядку в документе**, даже если второй файл пришёл раньше первого"],
          ["`<script async src>`", "Как только файл загружен", "**По готовности**, не по порядку"],
          ["`<script type=\"module\" src>`", "После разбора, как у `defer`", "По порядку в документе среди отложенных"],
        ],
        "Подключение скриптов",
      ),
      code("js", `// Порядок выполнения скриптов в браузере: классический, defer, async, module
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
import http from "node:http";
const script = (name) => \`window.__log.push(\${JSON.stringify(name)});\`;
const files = {
  "/slow-defer.js": [300, script("defer медленный (первый в документе)")],
  "/fast-defer.js": [50, script("defer быстрый (второй в документе)")],
  "/async-slow.js": [250, script("async медленный")],
  "/async-fast.js": [30, script("async быстрый")],
  "/mod.js": [20, script("module")],
};
const page = \`<!doctype html><meta charset=utf-8><script>window.__log = [];</script>
<script src="/slow-defer.js" defer></script>
<script src="/fast-defer.js" defer></script>
<script src="/async-slow.js" async></script>
<script src="/async-fast.js" async></script>
<script type="module" src="/mod.js"></script>
<script>window.__log.push("встроенный классический (сразу при разборе)");</script>
<script>document.addEventListener("DOMContentLoaded", () => window.__log.push("DOMContentLoaded"));</script>
<p>страница</p>\`;
const srv = http.createServer((req, res) => {
  const f = files[req.url];
  if (f) return setTimeout(() => { res.writeHead(200, { "content-type": "text/javascript", "cache-control": "no-store" }); res.end(f[1]); }, f[0]);
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(page);
});
await new Promise((r) => srv.listen(8161, "127.0.0.1", r));
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const p = await b.newPage();
await p.goto("http://127.0.0.1:8161/", { waitUntil: "load" });
await p.waitForTimeout(200);
(await p.evaluate("window.__log")).forEach((l, i) => console.log(i + 1 + ".", l));
await b.close(); srv.close();`, { filename: "e3-load-order.mjs", lineNumbers: true, collapsed: true }),
      code("text", `1. встроенный классический (сразу при разборе)
2. async быстрый
3. async медленный
4. defer медленный (первый в документе)
5. defer быстрый (второй в документе)
6. module
7. DOMContentLoaded`, { filename: "вывод порядка выполнения" }),
      ul(
        "**Встроенный** скрипт сработал первым — сразу при разборе документа.",
        "**`async`**: быстрый (30 мс) выполнился раньше медленного (250 мс), независимо от порядка в документе; оба — **раньше** `defer`-скриптов, потому что медленный `defer`-файл (300 мс) задерживал всю очередь отложенных.",
        "**`defer`**: медленный (первый в документе) выполнился перед быстрым (вторым): порядок сохранён, хотя быстрый файл пришёл раньше.",
        "**`module`** выполнился после `defer`-скриптов, в порядке документа, и до `DOMContentLoaded`.",
      ),
      note("Порядок `async`-скриптов зависит от сети, поэтому их нельзя использовать, если один скрипт зависит от другого. Для зависимых скриптов — `defer` или модули."),

      h("Строгий режим"),
      p("Нестрогий режим сохранил поведение ранних версий языка; строгий превращает часть тихих ошибок в исключения. Замер двух функций, созданных через `new Function` (одна с `\"use strict\"`, другая без):"),
      code("js", `// Нестрогий и строгий режимы: одни и те же операции
const sloppy = new Function(\`
  x = 5;                                   // необъявленная переменная
  return [typeof x, typeof globalThis.x, (function () { return this === globalThis; })()];
\`);
const strict = new Function(\`
  "use strict";
  try { y = 5; } catch (e) { return [e.name + ": " + e.message, (function () { return this; })() === undefined]; }
\`);
console.log("нестрогий:", JSON.stringify(sloppy()));
console.log("строгий:  ", JSON.stringify(strict()));
try { new Function('"use strict"; return 010;'); } catch (e) { console.log("строгий, литерал 010:", e.name); }
console.log("нестрогий, литерал 010 =", new Function("return 010;")());
console.log("модули и классы строгие всегда:", (() => { class A { static f() { return this; } } const f = A.f; return f() === undefined; })());`, { filename: "e4-strict.mjs" }),
      code("text", `нестрогий: ["number","number",true]
строгий:   ["ReferenceError: y is not defined",true]
строгий, литерал 010: SyntaxError
нестрогий, литерал 010 = 8
модули и классы строгие всегда: true`, { filename: "вывод" }),
      ul(
        "**Необъявленная переменная.** В нестрогом `x = 5` создала глобальное свойство; в строгом — `ReferenceError: y is not defined`.",
        "**`this` в обычном вызове функции.** Нестрого — глобальный объект (`this === globalThis`), строго — `undefined`.",
        "**Восьмеричный литерал `010`.** Нестрого — число 8, строго — `SyntaxError`.",
        "**Всегда строгие:** код в модулях и в классах (замер: метод класса, вызванный без объекта, получил `this === undefined`).",
      ),

      h("Один поток и одна задача"),
      p("Движок выполняет код **до конца текущей задачи** и только потом берёт следующую. Отсюда: длинный синхронный цикл замораживает страницу, а `setTimeout(f, 0)` не означает «сейчас», а означает «не раньше, чем освободится поток»."),
      code("js", `// JavaScript выполняет одну задачу за раз: таймер ждёт, пока синхронный код закончится
const t0 = Date.now();
setTimeout(() => console.log("таймер(0 мс) сработал не раньше, чем через 200 мс:", Date.now() - t0 >= 200), 0);
while (Date.now() - t0 < 200) { /* занимаем поток на 200 мс */ }
console.log("синхронный цикл закончился");`, { filename: "e5-single-thread.mjs" }),
      code("text", `синхронный цикл закончился
таймер(0 мс) сработал не раньше, чем через 200 мс: true`, { filename: "вывод" }),
      p("Модель очереди задач, микрозадач и цикла событий разобрана в отдельной теме об асинхронности: сейчас достаточно запомнить, что **время выполнения синхронного кода откладывает всё остальное**."),

      h("Возможности, а не версии"),
      p("Новые возможности появляются в движках не одновременно. Код, который должен работать в разных средах, проверяет наличие нужной возможности. Замер в Node.js 22.22.0:"),
      code("js", `// Проверка возможностей перед использованием (feature detection)
const checks = {
  "optional chaining (?.)": () => eval("({a:{b:1}})?.a?.b") === 1,
  "nullish coalescing (??)": () => eval("null ?? 'x'") === "x",
  "Array.prototype.at": () => typeof [].at === "function",
  "Object.hasOwn": () => typeof Object.hasOwn === "function",
  "structuredClone": () => typeof structuredClone === "function",
  "Promise.withResolvers": () => typeof Promise.withResolvers === "function",
  "Array.prototype.toSorted": () => typeof [].toSorted === "function",
  "несуществующая возможность": () => typeof Object.noSuchThing === "function",
};
for (const [name, test] of Object.entries(checks)) console.log(name.padEnd(30), test() ? "есть" : "нет");`, { filename: "e6-features.mjs" }),
      code("text", `optional chaining (?.)         есть
nullish coalescing (??)        есть
Array.prototype.at             есть
Object.hasOwn                  есть
structuredClone                есть
Promise.withResolvers          есть
Array.prototype.toSorted       есть
несуществующая возможность     нет`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Синтаксис** проверяют попыткой разобрать код (`new Function(\"return a?.b\")` не бросит ошибку, если синтаксис понятен движку).",
        "**API** проверяют через `typeof …  === \"function\"`: обращение к несуществующему свойству не бросает ошибку, а даёт `undefined`, а обращение к несуществующей **переменной** без `typeof` — `ReferenceError`.",
        "**Нельзя** определять возможности по строке `navigator.userAgent`: она описывает браузер, но не сообщает, что именно реализовано.",
      ),

      h("Где запускать код"),
      ul(
        "**Консоль DevTools** (F12 → Console): мгновенные эксперименты в среде браузера; `console.table(данные)` печатает таблицу.",
        "**Node.js:** `node файл.mjs` для модуля или `node` для интерактивной консоли.",
        "**Встроенные скрипты и модули:** `<script>` и `<script type=\"module\">` на странице — как в примерах этой темы.",
        "**Песочница DevDock:** кнопка «Открыть в песочнице» у запускаемых примеров.",
      ),
    ]),

    section("syntax", [
      annotated(
        "js",
        `"use strict";                                // 1. строгий режим (в модуле он и так включён)
const name = "мир";                          // 2. объявление константы
function greet(who) {                        // 3. объявление функции
  return "Привет, " + who + "!";             // 4. возврат значения
}
console.log(greet(name));                    // 5. вывод в консоль (среда)`,
        [
          { line: 1, text: "Директива строгого режима: строка-литерал в начале файла или функции. В модуле она избыточна — модуль строгий всегда." },
          { line: 2, text: "Объявление константы: имя `name` будет доступно в этом модуле, но не станет глобальным." },
          { line: [3, 5], text: "Объявление функции с параметром `who`: возвращает строку, а не печатает её." },
          { line: 6, text: "`console.log` — API среды (а не языка): вывод попадает в консоль браузера или в stdout Node.js." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Среда выполнения</title>
<style>
  body { margin: 0; padding: 1rem; font: 16px/1.5 system-ui, sans-serif; }
  table { border-collapse: collapse; }
  th, td { padding: 4px 12px; border: 1px solid #c5cae9; text-align: left; font-size: 14px; }
  td:last-child { font-family: ui-monospace, Consolas, monospace; }
</style>
<h1>Что есть в этой среде</h1>
<table>
  <thead><tr><th>Выражение</th><th>Значение</th></tr></thead>
  <tbody id="rows"></tbody>
</table>
<script>
  const checks = [
    ["typeof window", typeof window],
    ["typeof document", typeof document],
    ["typeof process", typeof process],
    ["typeof require", typeof require],
    ["this === window", String(this === window)],
    ["globalThis === window", String(globalThis === window)],
    ["typeof structuredClone", typeof structuredClone],
    ["typeof Object.hasOwn", typeof Object.hasOwn],
    ["typeof Promise.withResolvers", typeof Promise.withResolvers],
    ["typeof setTimeout", typeof setTimeout],
  ];
  const tbody = document.querySelector("#rows");
  for (const [expr, value] of checks) {
    const row = tbody.insertRow();
    row.insertCell().textContent = expr;
    row.insertCell().textContent = value;
  }
</script>
</html>`, { filename: "env-inspector.html", runnable: true, lineNumbers: true }),
      p("Страница строит таблицу из десяти выражений. В браузере: `window` и `document` — `object`, `process` и `require` — `undefined`, `this === window` и `globalThis === window` — `true`. Те же выражения в Node.js дали бы другие значения (`window` — `undefined`, `process` — `object`)."),
    ]),

    section("detailed-example", [
      p("Универсальная функция `env()`: определяет, где исполняется код, включён ли строгий режим и какие возможности есть, — и **не падает ни в одной среде**. Модуль проверен в Node.js 22.22.0 и в Chromium 141 как модуль и как классический скрипт."),
      code("js", `// env.mjs — определяет, где исполняется код, и не падает ни в одной среде
export function env() {
  const strict = (function () { return this === undefined; })();                 // в строгом режиме this вызова функции — undefined
  const hasDom = typeof window !== "undefined" && typeof document !== "undefined";
  const isNode = typeof process !== "undefined" && Boolean(process.versions && process.versions.node);
  const features = {
    optionalChaining: (() => { try { new Function("return a?.b"); return true; } catch { return false; } })(),
    structuredClone: typeof structuredClone === "function",
    promiseWithResolvers: typeof Promise !== "undefined" && typeof Promise.withResolvers === "function",
    notExisting: typeof Object.noSuchThing === "function",
  };
  return { runtime: hasDom ? "browser" : isNode ? "node" : "unknown", strict, hasDom, features };
}`, { filename: "env.mjs", lineNumbers: true }),
      code("text", `Node (модуль): {"runtime":"node","strict":true,"hasDom":false,"features":{"optionalChaining":true,"structuredClone":true,"promiseWithResolvers":true,"notExisting":false}}
Chromium (module): {"runtime":"browser","strict":true,"hasDom":true,"features":{"optionalChaining":true,"structuredClone":true,"promiseWithResolvers":true,"notExisting":false}} 
Chromium (classic): {"runtime":"browser","strict":false,"hasDom":true,"features":{"optionalChaining":true,"structuredClone":true,"promiseWithResolvers":true,"notExisting":false}} `, { filename: "результат запуска в Node.js и Chromium" }),
    ]),

    section("analysis", [
      table(
        ["Строка функции", "Что делает", "Почему так"],
        [
          ["`(function () { return this === undefined; })()`", "Определяет строгий режим", "В строгом режиме `this` обычного вызова равен `undefined`, в нестрогом — глобальному объекту"],
          ["`typeof window !== \"undefined\" && typeof document !== \"undefined\"`", "Определяет браузерную среду", "`typeof` не бросает ошибку для необъявленного имени"],
          ["`process.versions && process.versions.node`", "Определяет Node.js", "Объект `process` может существовать и в других средах; поле `versions.node` — признак Node.js"],
          ["`new Function(\"return a?.b\")`", "Проверяет синтаксис", "Синтаксическая ошибка бросается при создании функции, а не при вызове"],
          ["`typeof structuredClone === \"function\"`", "Проверяет API", "Отсутствующая возможность даёт `undefined`, а не исключение"],
        ],
        "Разбор функции env()",
      ),
      ul(
        "В Node.js (модуль) результат: `runtime: \"node\"`, `strict: true`, `hasDom: false`.",
        "В Chromium (модуль): `runtime: \"browser\"`, `strict: true`, `hasDom: true`.",
        "В Chromium (классический скрипт): `runtime: \"browser\"`, **`strict: false`** — единственное отличие определяется способом подключения, а не средой.",
      ),
    ]),

    section("internals", [
      h("От текста к исполнению"),
      steps(
        [
          ["Загрузка", "Среда получает исходный текст (из файла или `<script>`)."],
          ["Разбор", "Движок разбирает текст в дерево разбора; синтаксические ошибки (`SyntaxError`) возникают здесь, **до** выполнения любой строки."],
          ["Компиляция", "Дерево превращается в промежуточный код (байт-код); движки применяют несколько уровней компиляции (в V8, например, интерпретатор Ignition и оптимизирующий компилятор TurboFan)."],
          ["Исполнение", "Код выполняется в контексте исполнения; горячие участки оптимизируются на лету."],
          ["Очередь задач", "Когда стек вызовов пуст, среда берёт следующую задачу (обработчик события, таймер, колбэк сети)."],
        ],
        "Путь кода через движок",
      ),
      p("Поэтому ошибка синтаксиса в любом месте файла не даёт запустить **весь** скрипт: движок не успевает выполнить даже первую строку. Замер: `new Function('\"use strict\"; return 010;')` бросает `SyntaxError` при создании функции."),
      h("Почему `import` в классическом скрипте — ошибка"),
      p("Классический скрипт и модуль разбираются по разным грамматикам. В классическом скрипте `import` — не оператор, поэтому браузер сообщает `Cannot use import statement outside a module` (замер в Chromium). Модуль надо подключать с `type=\"module\"`."),
      h("Почему модуль не работает по `file://`"),
      p("Модули загружаются по правилам CORS. Страница, открытая как `file://`, имеет «непрозрачное» происхождение, и Chromium блокирует загрузку модуля: `Access to script at 'file://…/use.js' from origin 'null' has been blocked by CORS policy`. Тот же модуль по `http://127.0.0.1` загрузился и дал `x = 1`. Для разработки используйте локальный сервер."),
      code("js", `// Типичные ошибки подключения: import вне модуля и модуль по file://
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mod-"));
fs.writeFileSync(path.join(dir, "a.js"), "export const x = 1;");
fs.writeFileSync(path.join(dir, "classic.html"), \`<!doctype html><script src="./use.js"></script>\`);
fs.writeFileSync(path.join(dir, "use.js"), \`import { x } from "./a.js"; window.__ok = x;\`);
fs.writeFileSync(path.join(dir, "module.html"), \`<!doctype html><script type="module" src="./use.js"></script>\`);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
for (const [label, file] of [["классический <script> с import", "classic.html"], ["type=module по file://", "module.html"]]) {
  const p = await b.newPage();
  const msgs = [];
  p.on("pageerror", (e) => msgs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") msgs.push(m.text().replace(dir, "…")); });
  await p.goto("file://" + path.join(dir, file));
  await p.waitForTimeout(300);
  console.log(label + ":", msgs[0] ?? "(без ошибок)");
  await p.close();
}
// и тот же модуль по http
import http from "node:http";
const srv = http.createServer((req, res) => { const f = path.join(dir, req.url === "/" ? "module.html" : req.url); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { "content-type": f.endsWith(".js") ? "text/javascript" : "text/html" }); res.end(fs.readFileSync(f)); });
await new Promise((r) => srv.listen(8162, "127.0.0.1", r));
const p = await b.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://127.0.0.1:8162/"); await p.waitForTimeout(200);
console.log("type=module по http:", errs[0] ?? "(без ошибок)", "| x =", await p.evaluate("window.__ok"));
await b.close(); srv.close();`, { filename: "e7-import-errors.mjs", lineNumbers: true, collapsed: true }),
      code("text", `классический <script> с import: Cannot use import statement outside a module
type=module по file://: Access to script at 'file://…/use.js' from origin 'null' has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: chrome, chrome-extension, chrome-untrusted, data, http, https, isolated-app.
type=module по http: (без ошибок) | x = 1`, { filename: "вывод Chromium 141" }),
    ]),

    section("mistakes", [
      h("Ошибка 1. Использовать `window` или `document` в коде, который работает в Node.js"),
      p("`window` не существует в Node.js (замер: `typeof window` — `undefined`). Обращение к самому имени без `typeof` бросит `ReferenceError`. Для переносимого кода используйте `globalThis`."),
      h("Ошибка 2. Рассчитывать на порядок `async`-скриптов"),
      p("Замер показал, что `async`-скрипты выполняются по готовности (быстрый перед медленным). Если скрипты зависят друг от друга, используйте `defer` или модули."),
      h("Ошибка 3. Создавать глобальные переменные присваиванием"),
      wrongRight(
        "js",
        {
          code: `
            function count() {
              total = 0;                // забыли let/const — создаётся глобальная переменная
              return total;
            }
          `,
          note: "В нестрогом режиме `total` стала свойством глобального объекта; в строгом режиме — `ReferenceError`.",
        },
        {
          code: `
            "use strict";
            function count() {
              let total = 0;
              return total;
            }
          `,
          note: "Переменная локальна; опечатка в имени проявляется ошибкой, а не глобальной утечкой.",
        },
      ),
      h("Ошибка 4. Подключать модуль как обычный скрипт"),
      p("`<script src=\"app.js\">` с `import` внутри даёт `Cannot use import statement outside a module`. Нужен `<script type=\"module\" src=\"app.js\">`."),
      h("Ошибка 5. Открывать страницу с модулями по `file://`"),
      p("Chromium блокирует такой модуль по CORS (замер). Запустите локальный сервер."),
      h("Ошибка 6. Считать `setTimeout(f, 0)` немедленным"),
      p("Таймер выполняется после текущей задачи: в замере он сработал не раньше, чем через 200 мс — по окончании синхронного цикла."),
      h("Ошибка 7. Определять возможности по `userAgent`"),
      p("Строка браузера не сообщает, реализован ли `structuredClone` или `Array.prototype.toSorted`. Проверяйте через `typeof`."),
      h("Ошибка 8. Забывать, что синтаксическая ошибка останавливает весь файл"),
      p("Одна опечатка в синтаксисе означает, что **ни одна** строка файла не выполнится: движок отказывается запускать код, который не удалось разобрать."),
    ]),

    section("antipatterns", [
      ul(
        "**Глобальные переменные через присваивание без объявления** и через `var` на верхнем уровне классического скрипта.",
        "**Зависимые скрипты с `async`.**",
        "**Определение возможностей по `navigator.userAgent`.**",
        "**Длинные синхронные циклы в основном потоке** страницы.",
        "**Смешение браузерных и серверных API** в одном «универсальном» модуле без проверки среды.",
        "**Подключение модулей по `file://`** и борьба с CORS отключением защиты браузера.",
        "**`\"use strict\"` где-то в середине файла:** директива работает только в начале файла или функции.",
        "**Копирование кода из примеров без выяснения среды:** `require` в браузере, `document` в Node.js.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Пишите модули:** `type=\"module\"` даёт строгий режим, собственную область видимости и `import`/`export`.",
        "**Используйте `defer`** (или модули) для скриптов, зависящих от DOM или друг от друга.",
        "**Проверяйте возможности через `typeof`** и `try`/`new Function` для синтаксиса, а не по версии и названию браузера.",
        "**Пишите переносимый код через `globalThis`,** а среда-зависимое выносите в отдельные модули.",
        "**Запускайте код через сервер,** а не `file://`, и держите открытой консоль DevTools.",
        "**Не блокируйте основной поток:** длинные вычисления разбивайте или выносите в Web Worker.",
        "**Читайте стандарт и документацию среды:** ECMA-262 для языка, HTML Standard и MDN для браузера, документацию для Node.js.",
        "**Делайте ошибки заметными:** строгий режим и линтер находят опечатки, которые иначе станут глобальными переменными.",
      ),
      tip("Когда видите `X is not defined`, задайте три вопроса: это имя из языка, из среды или из подключённого модуля? Где запущен код? Как он подключён? Обычно этого достаточно."),
    ]),

    section("edge-cases", [
      h("`typeof` и необъявленные имена"),
      p("`typeof undeclared` возвращает `\"undefined\"` без ошибки, а обращение к `undeclared` бросает `ReferenceError`. Исключение — переменные в «временной мёртвой зоне» (`let`/`const` до объявления): `typeof` там тоже бросает ошибку (подробности — в теме о контексте исполнения)."),
      h("Одновременно Node.js и «браузерные» API"),
      p("Некоторые API есть в обеих средах (`fetch`, `URL`, `structuredClone`, `setTimeout`, `AbortController`): проверка среды по одному из них ненадёжна. Для определения Node.js используйте `process.versions.node`."),
      h("Тесты и эмуляторы DOM"),
      p("В тестовых средах с эмуляцией DOM (например, jsdom) одновременно есть `window` и `process`; признак «браузер или Node.js» в них неоднозначен. Если нужно различать, проверяйте конкретные возможности, а не «тип среды»."),
      h("Область видимости классических скриптов"),
      p("Классические скрипты на одной странице делят глобальную область: `var` и функции верхнего уровня становятся свойствами `window`. У модулей область своя, и глобальными они не становятся."),
      h("Версия ECMAScript и версия движка"),
      p("Название редакции (ES2022) не гарантирует поддержку всех возможностей в конкретной среде: движки обновляются независимо. Ориентируйтесь на таблицы совместимости и проверку возможностей."),
    ]),

    section("related", [
      ul(
        "[Что такое HTML](/learn/html/what-is-html) — документ, в который встраивается скрипт.",
        "[Загрузка ресурсов](/learn/html/resource-loading) — `defer`, `async`, `preload` на уровне HTML.",
        "[Анатомия документа](/learn/html/document-anatomy) — режим документа и `<script>` в разметке.",
        "[Парсинг и DOM](/learn/html/parsing-dom) — как блокирующие скрипты влияют на разбор.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Скрипт зависит от среды и порядка",
          code: `
            // classic.js, подключён как <script async src="classic.js">
            total = 0;                          // глобальная переменная без объявления
            document.title = "Готово";          // упадёт в Node.js, и в браузере — если скрипт выполнится до разбора
          `,
          note: "Нестрогий режим создаёт глобальную `total`, `async` не гарантирует, что `document` готов, а в Node.js строка с `document` упадёт.",
        },
        {
          title: "Модуль со строгим режимом и проверкой среды",
          code: `
            // app.mjs, подключён как <script type="module" src="app.mjs">
            let total = 0;                      // локально для модуля
            if (typeof document !== "undefined") document.title = "Готово";
          `,
          note: "Модуль строгий и выполняется после разбора документа; обращение к DOM защищено проверкой.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.what-is-js.ex1",
      title: "Где что есть",
      difficulty: "foundation",
      kind: "recall",
      prompt: [
        p("Для каждого выражения скажите, чему равно `typeof …` в Node.js (файл `.mjs`) и в браузерной странице: `window`, `document`, `process`, `setTimeout`, `globalThis`, `require`."),
      ],
      hints: ["Что относится к языку, а что — к среде?", "В ESM-модуле Node.js нет `require`."],
      checks: ["Шесть пар ответов", "Различены язык и среда", "Названа причина для `require`"],
      solution: [
        table(
          ["Выражение", "Node.js (.mjs)", "Браузер"],
          [
            ["`window`", "`undefined`", "`object`"],
            ["`document`", "`undefined`", "`object`"],
            ["`process`", "`object`", "`undefined`"],
            ["`setTimeout`", "`function`", "`function`"],
            ["`globalThis`", "`object`", "`object`"],
            ["`require`", "`undefined` (в ESM)", "`undefined`"],
          ],
          "Ответы",
        ),
        p("Все значения получены замерами в Node.js 22.22.0 и Chromium 141. `window`, `document`, `process` — объекты среды; `globalThis` и таймеры доступны в обеих средах, но таймеры не входят в язык."),
      ],
    }),
    exercise({
      id: "js.what-is-js.ex2",
      title: "Порядок выполнения скриптов",
      difficulty: "intermediate",
      kind: "understanding",
      prompt: [
        p("Страница подключает скрипты (в скобках — задержка ответа сервера): `slow-defer.js` (300 мс, `defer`, первым в документе), `fast-defer.js` (50 мс, `defer`, вторым), `async-slow.js` (250 мс, `async`), `async-fast.js` (30 мс, `async`), `mod.js` (20 мс, `type=\"module\"`), встроенный классический скрипт и обработчик `DOMContentLoaded`. Каждый записывает своё имя в журнал. В каком порядке имена окажутся в журнале и почему?"),
      ],
      hints: ["Когда `defer`-скрипты начинают выполняться: после загрузки первого или после загрузки всех?", "Где в очереди отложенных стоит модуль?"],
      checks: ["Названы семь событий в порядке выполнения", "Объяснено, почему `async` оказались перед `defer`", "Объяснено место модуля"],
      solution: [
        code("text", `1. встроенный классический (сразу при разборе)
2. async быстрый
3. async медленный
4. defer медленный (первый в документе)
5. defer быстрый (второй в документе)
6. module
7. DOMContentLoaded`, { filename: "измеренный порядок" }),
        p("Встроенный скрипт — сразу при разборе. `async` — по готовности (30 мс, затем 250 мс). `defer`-очередь ждёт, пока загрузятся **все** отложенные скрипты, включая медленный (300 мс), поэтому начинается позже обоих `async`; внутри очереди порядок документа сохраняется (медленный первым), модуль идёт после, а `DOMContentLoaded` — когда очередь закончилась."),
      ],
    }),
    exercise({
      id: "js.what-is-js.ex3",
      title: "Проверка возможностей",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Напишите функцию `support(names)`, которая принимает массив имён методов вида `\"Array.prototype.at\"`, `\"Object.hasOwn\"`, `\"Promise.withResolvers\"`, `\"Object.noSuchThing\"` и возвращает объект `{ имя: true | false }`, **не бросая исключений** ни для одного имени (в том числе для несуществующего объекта вроде `\"Nope.thing\"`)."),
      ],
      hints: ["Как пройти по пути `A.b.c`, не получив ошибку на `undefined`?", "Как проверить, что в конце пути функция?"],
      checks: ["Не бросает для несуществующего пути", "Различает функцию и не функцию", "Работает в Node.js и в браузере"],
      solution: [
        code(
          "js",
          `
          function support(names) {
            const result = {};
            for (const name of names) {
              let value = globalThis;
              for (const part of name.split(".")) {
                value = value == null ? undefined : value[part];       // не обращаемся к свойствам undefined/null
              }
              result[name] = typeof value === "function";
            }
            return result;
          }

          console.log(support(["Array.prototype.at", "Object.hasOwn", "Promise.withResolvers", "Object.noSuchThing", "Nope.thing"]));
          `,
          { filename: "support.js" },
        ),
        p("Для `\"Nope.thing\"` путь обрывается на `undefined` и возвращается `false`; функция работает в любой среде, потому что опирается на `globalThis`."),
      ],
    }),
  ],

  challenge: {
    id: "js.what-is-js.challenge",
    title: "Модуль, который знает, где он запущен",
    scenario: [
      p("Команда делит код между сайтом и серверной частью. Нужен модуль `env.mjs` с функцией `env()`, которая возвращает `{ runtime, strict, hasDom, features }` и **не падает** ни в Node.js, ни в браузере, ни в классическом скрипте. Тесты — запуск в Node.js, в браузере как модуль и в браузере как обычный скрипт."),
    ],
    requirements: [
      "`runtime`: `\"browser\"` при наличии `window` и `document`, `\"node\"` при наличии `process.versions.node`, иначе `\"unknown\"`",
      "`strict`: `true`, если код исполняется в строгом режиме (определить без `\"use strict\"`-директивы в самой функции)",
      "`hasDom`: логическое значение",
      "`features`: объект с проверкой синтаксиса `?.` (через `new Function`) и API `structuredClone`, `Promise.withResolvers`; несуществующая возможность даёт `false`",
      "Никаких исключений в любой среде",
    ],
    constraints: [
      "Нельзя использовать `navigator.userAgent` и версии для определения среды",
      "Нельзя обращаться к `window`/`document`/`process` без `typeof`",
    ],
    acceptance: [
      "Node.js (модуль): `runtime: \"node\"`, `strict: true`, `hasDom: false`",
      "Chromium (`type=\"module\"` по http): `runtime: \"browser\"`, `strict: true`, `hasDom: true`",
      "Chromium (классический скрипт): `runtime: \"browser\"`, `strict: false`, `hasDom: true`",
      "Для отсутствующей возможности значение `false`, исключение не бросается",
    ],
    hints: [
      "Как отличить строгий режим от нестрогого, не используя директиву?",
      "Что вернёт `typeof` для необъявленного имени?",
      "Как проверить синтаксис, не заставив падать весь модуль?",
    ],
    solution: [
      code("js", `// env.mjs — определяет, где исполняется код, и не падает ни в одной среде
export function env() {
  const strict = (function () { return this === undefined; })();                 // в строгом режиме this вызова функции — undefined
  const hasDom = typeof window !== "undefined" && typeof document !== "undefined";
  const isNode = typeof process !== "undefined" && Boolean(process.versions && process.versions.node);
  const features = {
    optionalChaining: (() => { try { new Function("return a?.b"); return true; } catch { return false; } })(),
    structuredClone: typeof structuredClone === "function",
    promiseWithResolvers: typeof Promise !== "undefined" && typeof Promise.withResolvers === "function",
    notExisting: typeof Object.noSuchThing === "function",
  };
  return { runtime: hasDom ? "browser" : isNode ? "node" : "unknown", strict, hasDom, features };
}`, { filename: "env.mjs", lineNumbers: true }),
      code("text", `Node (модуль): {"runtime":"node","strict":true,"hasDom":false,"features":{"optionalChaining":true,"structuredClone":true,"promiseWithResolvers":true,"notExisting":false}}
Chromium (module): {"runtime":"browser","strict":true,"hasDom":true,"features":{"optionalChaining":true,"structuredClone":true,"promiseWithResolvers":true,"notExisting":false}} 
Chromium (classic): {"runtime":"browser","strict":false,"hasDom":true,"features":{"optionalChaining":true,"structuredClone":true,"promiseWithResolvers":true,"notExisting":false}} `, { filename: "результат запуска тестов" }),
      ul(
        "**Строгий режим:** `(function () { return this === undefined; })()` — в строгом режиме `this` вызова равен `undefined`; поэтому результат различается между модулем и классическим скриптом.",
        "**Среда:** `typeof` безопасен для необъявленных имён; для Node.js дополнительно проверяется `process.versions.node`.",
        "**Синтаксис:** `new Function(\"return a?.b\")` бросает `SyntaxError` при создании, если движок не знает `?.`; ошибка перехватывается `try`/`catch`.",
      ),
    ],
  },

  interview: [
    iq("js.what-is-js.i1", "basic", "Чем JavaScript отличается от ECMAScript?", [
      p("ECMAScript — стандарт языка (синтаксис, типы, объекты, `Promise` и т. д.), JavaScript — его реализации вместе с API среды: в браузере — DOM, `fetch`, `window`, в Node.js — `process`, файловая система. `setTimeout` и `console` в стандарт языка не входят."),
    ]),
    iq("js.what-is-js.i2", "basic", "Что такое движок JavaScript и среда выполнения?", [
      p("Движок (V8, SpiderMonkey, JavaScriptCore) разбирает, компилирует и исполняет код на ECMAScript. Среда (браузер, Node.js) создаёт движок, добавляет к нему свои объекты и API и запускает код."),
    ]),
    iq("js.what-is-js.i3", "intermediate", "Чем отличаются `defer`, `async` и `type=\"module\"`?", [
      ul(
        "`defer` — после разбора документа, по порядку в документе, до `DOMContentLoaded`.",
        "`async` — по готовности файла, порядок не гарантирован; не для зависимых скриптов.",
        "`type=\"module\"` — модуль со строгим режимом и своей областью, отложен как `defer`.",
        "В замере: быстрый `async` выполнился перед медленным и раньше `defer`-очереди, а модуль — после `defer`-скриптов.",
      ),
    ]),
    iq("js.what-is-js.i4", "intermediate", "Что меняет строгий режим?", [
      ul(
        "Присваивание необъявленной переменной — `ReferenceError`, а не глобальная переменная.",
        "`this` в обычном вызове функции — `undefined`, а не глобальный объект.",
        "Восьмеричные литералы вроде `010` — `SyntaxError`.",
        "Строгими всегда являются модули и тела классов.",
      ),
    ]),
    iq("js.what-is-js.i5", "intermediate", "Почему `setTimeout(f, 0)` не выполняется мгновенно?", [
      p("JavaScript выполняет задачи по одной: таймер встаёт в очередь и срабатывает, когда текущая задача (и стек вызовов) закончилась. В замере таймер на 0 мс сработал только после синхронного цикла в 200 мс."),
    ]),
    iq("js.what-is-js.i6", "advanced", "Как написать код, который работает и в браузере, и в Node.js?", [
      ul(
        "Опираться на язык (`Array`, `Map`, `Promise`), а среда-зависимое — выносить в отдельные модули.",
        "Обращаться к глобальному объекту через `globalThis`.",
        "Проверять возможности через `typeof` и `try`/`new Function`, а не по `userAgent`.",
        "Использовать API, общие для сред (`fetch`, `URL`, `structuredClone`), проверяя их наличие.",
      ),
    ]),
    iq("js.what-is-js.i7", "engineering", "Как организовать загрузку скриптов на странице для быстрой отрисовки?", [
      ul(
        "Подключать скрипты с `defer` или как модули, чтобы они не блокировали разбор.",
        "Независимые аналитические скрипты — `async`.",
        "Зависимые скрипты — `defer` или `import`, чтобы порядок гарантировался.",
        "Критический код — маленький, остальное — лениво (динамический `import()`).",
      ),
    ]),
    iq("js.what-is-js.i8", "debugging", "Страница выдаёт «Cannot use import statement outside a module». Что вы сделаете?", [
      ul(
        "Проверю, как подключён файл: `<script src>` — классический скрипт, в нём `import` недопустим.",
        "Заменю на `<script type=\"module\" src>` и проверю, что страница открыта по `http://`, а не по `file://` (иначе CORS).",
        "Убежусь, что расширение и MIME-тип файла — JavaScript.",
        "Если файл должен работать как скрипт, уберу `import` или соберу бандл.",
      ),
    ]),
  ],

  exam: [
    mcq("js.what-is-js.e1", "foundation", "Что из перечисленного НЕ входит в стандарт ECMAScript?", ["`Promise`", "`Array`", "`setTimeout`", "`Symbol`"], 2, "`setTimeout` описывают HTML Standard и документация Node.js; `Promise`, `Array`, `Symbol` — часть языка."),
    mcq("js.what-is-js.e2", "foundation", "Чему равно `typeof window` в Node.js (файл `.mjs`)?", ["`\"undefined\"`", "`\"object\"`", "`\"function\"`", "Бросит `ReferenceError`"], 0, "`typeof` не бросает ошибку для необъявленного имени и возвращает `\"undefined\"`; в Node.js `window` нет."),
    mcq("js.what-is-js.e3", "intermediate", "Какой скрипт выполнится раньше: `async` быстрый (30 мс) или `defer`-скрипт, чей файл пришёл за 300 мс?", ["`defer`: он стоит раньше в документе", "Порядок случаен для обоих", "Они выполняются одновременно", "`async` быстрый"], 3, "В замере `async` выполнился по готовности, а `defer`-очередь ждала всех отложенных файлов, включая медленный."),
    mcq("js.what-is-js.e4", "intermediate", "Что произойдёт при `x = 5;` без объявления в строгом режиме?", ["Создастся глобальная `x`", "`ReferenceError: x is not defined`", "`undefined`", "`SyntaxError` при разборе"], 1, "Строгий режим запрещает неявные глобальные переменные: присваивание необъявленному имени бросает `ReferenceError`."),
    mcq("js.what-is-js.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["Модули всегда выполняются в строгом режиме", "Классический скрипт с `import` внутри работает", "`globalThis` доступен в браузере и Node.js", "`setTimeout(f, 0)` вызывает `f` немедленно"], [0, 2], "`import` в классическом скрипте даёт SyntaxError, а таймер на 0 мс выполняется после текущей задачи."),
    mcq("js.what-is-js.e6", "advanced", "Почему модуль, загруженный со страницы `file://`, может не работать в Chromium?", ["Модули не поддерживаются", "Нужен `defer`", "Файл не найден", "Загрузка модулей подчиняется CORS, а у `file://` непрозрачное происхождение"], 3, "Замер: `Access to script … has been blocked by CORS policy`; по `http://127.0.0.1` тот же модуль загрузился."),
    open("js.what-is-js.e7", "intermediate", "Объясните, чем «язык» отличается от «среды» на трёх примерах.", [
      ul(
        "Язык: `Array`, `Promise`, замыкания — работают одинаково в браузере и Node.js.",
        "Среда браузера: `window`, `document`, `localStorage` — в Node.js их нет (замер: `typeof window` — `undefined`).",
        "Среда Node.js: `process`, файловая система — нет в браузере (`typeof process` — `undefined`).",
        "Общий для обеих сред, но не языковой API: `setTimeout`, `console`, `fetch`.",
      ),
    ], ["Названы три примера", "Различены язык и среда", "Приведены замеры или принцип"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.what-is-js.m1", "intermediate", "Чему равно `this` на верхнем уровне модуля?", ["`window`", "`globalThis`", "`undefined`", "`module.exports`"], 2, "В модуле верхний `this` равен `undefined` (замер в Node.js и Chromium); в классическом скрипте браузера — `window`."),
    mcq("js.what-is-js.m2", "advanced", "Как надёжно проверить, что `structuredClone` доступна?", ["`navigator.userAgent.includes(\"Chrome\")`", "`typeof structuredClone === \"function\"`", "Сравнить версию движка", "Вызвать `structuredClone()` и поймать любую ошибку"], 1, "Проверка возможности через `typeof` не зависит от названия браузера и не вызывает побочных эффектов."),
    mcq("js.what-is-js.m3", "advanced", "Что покажет `(function () { return this === undefined; })()` в классическом скрипте браузера без директивы?", ["`false`", "`true`", "`undefined`", "Бросит исключение"], 0, "В нестрогом режиме `this` обычного вызова равен глобальному объекту; замер: `strict: false` для классического скрипта."),
    open("js.what-is-js.m4", "advanced", "Спроектируйте способ подключения скриптов для страницы с аналитикой, основным приложением и виджетом, зависящим от приложения.", [
      ul(
        "Аналитика: `<script async src>` — независима, порядок неважен.",
        "Приложение: `<script type=\"module\" src>` (или `defer`) — после разбора, строгий режим, `import` для зависимостей.",
        "Виджет: импортируется из приложения (`import`) или подключается `defer` после приложения; не `async`.",
        "Проверка: журнал порядка выполнения; страница по `http://`, не `file://`.",
      ),
    ], ["Выбраны способы для трёх скриптов", "Обоснован порядок", "Учтены ограничения модулей"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.what-is-js.f1", front: "ECMAScript и JavaScript?", back: "ECMAScript — стандарт языка; JavaScript — реализации плюс API среды (`window`, `process`, `setTimeout`)." },
    { id: "js.what-is-js.f2", front: "`defer` против `async`?", back: "`defer` — после разбора, по порядку; `async` — по готовности, порядок не гарантирован." },
    { id: "js.what-is-js.f3", front: "Строгий режим?", back: "`x = 5` → ReferenceError; `this` вызова — undefined; модули и классы строгие всегда." },
    { id: "js.what-is-js.f4", front: "Модуль по `file://`?", back: "Блокируется CORS в Chromium; нужен `http://` (локальный сервер)." },
    { id: "js.what-is-js.f5", front: "`setTimeout(f, 0)`?", back: "Не мгновенно: после завершения текущей задачи (замер: после цикла в 200 мс)." },
    { id: "js.what-is-js.f6", front: "Проверка возможности?", back: "`typeof структура === \"function\"`; синтаксис — через `new Function`; не `userAgent`." },
  ],

  sources: [
    { title: "ECMAScript Language Specification (ECMA-262)", url: "https://tc39.es/ecma262/", publisher: "ECMA" },
    { title: "HTML Standard: Scripting (script, defer, async, module)", url: "https://html.spec.whatwg.org/multipage/scripting.html", publisher: "WHATWG" },
    { title: "HTML Standard: Timers", url: "https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers", publisher: "WHATWG" },
    { title: "Console Standard", url: "https://console.spec.whatwg.org/", publisher: "WHATWG" },
    { title: "MDN: JavaScript", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", publisher: "MDN" },
    { title: "MDN: Strict mode", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode", publisher: "MDN" },
    { title: "Node.js: Globals", url: "https://nodejs.org/api/globals.html", publisher: "Other" },
    { title: "V8 blog", url: "https://v8.dev/blog", publisher: "Other" },
  ],
};
