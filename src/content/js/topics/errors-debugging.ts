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

export const errorsDebugging: Topic = {
  id: "js.errors-debugging",
  slug: "errors-debugging",
  domain: "js",
  module: "engineering",
  title: "Ошибки и отладка",
  titleEn: "Errors and debugging",
  summary:
    "Ошибка — это объект с именем, сообщением, стеком и причиной, а отладка — наука читать эти данные. Тема на замерах в Node.js 22 и Chromium 141 разбирает встроенные типы ошибок и тексты V8, анатомию `Error` (`cause`, `AggregateError`, почему `JSON.stringify(error)` даёт `{}`), собственные классы, семантику `finally` (перекрывает `return` и проглатывает исключение), судьбу необработанных ошибок (код выхода, `uncaughtException`, `unhandledrejection`, «Script error.» от чужого origin), чтение стека (`stackTraceLimit`, `async`-кадры, `captureStackTrace`) и инструменты отладки (`console`, `debugger`, точки останова). В конце вы строите иерархию `AppError` и репортёр `installErrorReporter` с дедупликацией, ограничением частоты и пакетной отправкой.",
  minutes: 120,
  prerequisites: ["js.async-await-abort", "js.dom-events"],
  tags: ["Error", "TypeError", "RangeError", "cause", "AggregateError", "try/catch/finally", "stack trace", "captureStackTrace", "uncaughtException", "unhandledrejection", "window.onerror", "Script error", "console", "debugger", "source maps", "error reporting", "custom errors", "fail fast"],
  keyConcepts: [
    { term: "Ошибка — объект: `name`, `message`, `stack`, `cause`", text: "У `Error` перечисляемых ключей нет (`Object.keys(e)` — `[]`), поэтому `JSON.stringify(e)` даёт `{}`; сериализуйте поля явно. Причину сохраняйте через `new Error(msg, { cause })`." },
    { term: "Читайте тип и сообщение, а не только «упало»", text: "`Cannot read properties of undefined (reading 'city')` — `undefined` лежит **перед** `.city`; `o.nope is not a function` — свойство есть, но не функция; `Cannot access 'v' before initialization` — TDZ. Но тексты зависят от движка: разбирать их программно нельзя." },
    { term: "`finally` сильнее `return` и `throw`", text: "`return` в `finally` перекрывает `return` из `try` и **проглатывает** исключение (`finally проглотил ошибку`). `finally` не должен возвращать значение и бросать новые ошибки." },
    { term: "Необработанное завершает процесс Node, но не страницу", text: "Исключение в таймере и необработанный отказ Promise дают код выхода `1`; в браузере они лишь попадают в `window.onerror` и `unhandledrejection`. `try/catch` ошибку из таймера не ловит." },
    { term: "Стек — карта, у неё есть границы", text: "`Error.stackTraceLimit` по умолчанию 10 кадров; `async`-кадры помечены `at async`; колбэк таймера обрывает цепочку; анонимные функции безымянны; у чужого скрипта без CORS стека нет вовсе (`Script error.`)." },
    { term: "Ошибки в продакшене нужно собирать, но аккуратно", text: "Репортёр должен нормализовать данные, не подавлять ошибку, не зацикливаться на собственных сбоях, дедуплицировать и ограничивать частоту — иначе один баг превратится в лавину запросов." },
  ],
  sections: [
    section("definition", [
      def("Исключение", "Нормальный механизм прерывания обычного потока выполнения: `throw` создаёт значение, оно «всплывает» по стеку вызовов до ближайшего `catch`; если такого нет — ошибка считается необработанной.", "exception"),
      def("`Error` и подтипы", "Встроенные классы ошибок: `Error`, `TypeError` (неверный тип/значение), `RangeError` (значение вне допустимого диапазона), `ReferenceError` (необъявленная/недоступная переменная), `SyntaxError`, `URIError`, `EvalError`, `AggregateError` (несколько причин).", "Error types"),
      def("Стек вызовов (stack trace)", "Строка `error.stack` с цепочкой кадров «функция (файл:строка:столбец)», созданная в момент создания ошибки; формат зависит от движка (в V8 — `at …`).", "stack trace"),
      def("`error.cause`", "Необязательная причина, переданная вторым параметром `new Error(message, { cause })`: позволяет строить цепочку «что случилось на каком уровне».", "error cause"),
      def("Операционная ошибка и ошибка программиста", "Операционные — ожидаемые сбои среды (нет сети, файл не найден, неверный ввод): их обрабатывают. Ошибки программиста (`TypeError` из-за `undefined`, неверный вызов) — баги: их исправляют, а не «гасят».", "operational vs programmer errors"),
      def("Необработанная ошибка", "Исключение, которое не поймал ни один `catch`, или отказ Promise без обработчика; приводит к событиям `error`/`unhandledrejection` в браузере и к завершению процесса в Node.js.", "unhandled error"),
      def("Отладка", "Систематический поиск причины дефекта: воспроизведение, сужение области, проверка гипотез наблюдением (`console`, точки останова), исправление и закрепление тестом.", "debugging"),
      def("Source map", "Файл соответствий между собранным/минифицированным кодом и исходниками; позволяет инструментам показывать исходные имена и строки в стеке.", "source map"),
    ]),

    section("why", [
      h("Ошибки — это не исключение, а основная информация о системе"),
      p("Большая часть времени разработчика уходит не на написание кода, а на выяснение, **почему он не работает**. Умение прочитать сообщение, стек и причину сокращает поиск с часов до минут; умение правильно создавать, оборачивать и собирать ошибки определяет, увидите ли вы баг до того, как о нём напишет пользователь."),
      ul(
        "**Скорость диагностики:** тип и текст ошибки сразу указывают на класс проблемы (замер: `reading 'city'` — `undefined` перед `.city`).",
        "**Надёжность:** `finally`, `cause`, разделение ожидаемых и непредвиденных ошибок, отсутствие «проглоченных» исключений.",
        "**Наблюдаемость:** необработанные ошибки и отказы собираются, дедуплицируются и отправляются с контекстом — вы видите баги в продакшене.",
        "**Безопасность:** сообщения об ошибках не раскрывают внутренности пользователям; секреты не попадают в логи.",
      ),
      insight("Каждая ошибка отвечает на три вопроса: **что** произошло (`name`, `message`), **где** (`stack`) и **почему** (`cause`). Хороший код сохраняет все три ответа при каждой обёртке и каждой передаче между слоями."),
    ]),

    section("mental-model", [
      p("**Ошибка — это записка, которую передают вверх по цепочке начальников.** Рабочий (функция) натыкается на проблему и пишет записку (`new Error`), прикладывает «маршрут, как мы сюда пришли» (`stack`) и, если проблема возникла из-за чужой, прикладывает ту записку (`cause`). Записка идёт вверх по цепочке: ближайший, кто умеет решить проблему (`catch`), забирает её; остальные дописывают контекст и передают дальше (`throw new Error(…, { cause })`). Если записка дошла до верха и никто не взял её, **директор останавливает завод** (Node.js завершает процесс) или **вешает объявление** (браузер: `window.onerror`, консоль). `finally` — это уборщик: он приходит всегда, но если он решит написать свою записку или вынести чужую (`return`), исходная пропадёт."),
      table(
        ["Ситуация", "Что произошло", "Как диагностировать"],
        [
          ["`TypeError: Cannot read properties of undefined (reading 'x')`", "Перед `.x` стоит `undefined`/`null`", "Посмотреть выражение слева от `.x` и откуда пришло значение"],
          ["`TypeError: o.f is not a function`", "Свойство отсутствует или не функция", "Проверить имя, `typeof`, `this`, импорт"],
          ["`ReferenceError: x is not defined`", "Нет такой переменной в области видимости", "Опечатка, область видимости, порядок загрузки, `typeof x`"],
          ["`ReferenceError: Cannot access 'x' before initialization`", "Обращение к `let`/`const` в TDZ", "Порядок объявления"],
          ["`RangeError: Maximum call stack size exceeded`", "Бесконечная/слишком глубокая рекурсия", "Базовый случай, циклические структуры"],
          ["`SyntaxError` при `JSON.parse`", "Невалидный JSON", "Что пришло от сервера (HTML вместо JSON?)"],
          ["Процесс завершился с кодом 1", "Необработанное исключение или отказ", "Последние строки `stderr`, трассировка"],
          ["`Script error.` без деталей", "Исключение из чужого скрипта без CORS", "`crossorigin` + `Access-Control-Allow-Origin`"],
        ],
        "Как читать типовые симптомы",
      ),
    ]),

    section("technical", [
      h("Типы ошибок и тексты V8"),
      code("js", `const show = (k, v) => console.log(k.padEnd(46), "→", typeof v === "string" ? v : JSON.stringify(v));
const catchIt = (fn) => { try { fn(); } catch (e) { return e; } };

// 1. Встроенные ошибки: тип и сообщение движка V8
const samples = {
  "undefined.x": () => { const o = undefined; return o.x; },
  "null.x()": () => { const o = null; return o.x(); },
  "obj.nope()": () => { const o = {}; return o.nope(); },
  "необъявленная переменная": () => notDeclared,
  "TDZ: let до объявления": () => { v; let v = 1; },
  "присваивание const": () => { const c = 1; c = 2; },
  "бесконечная рекурсия": () => { (function f() { f(); })(); },
  "new Array(-1)": () => new Array(-1),
  "(1.5).toFixed(101)": () => (1.5).toFixed(101),
  "BigInt + число": () => 1n + 1,
  "decodeURIComponent('%')": () => decodeURIComponent("%"),
  "JSON.parse('{плохо')": () => JSON.parse("{плохо"),
  "new (class A {})()()": () => new (class A {})()(),
  "Symbol() + ''": () => Symbol() + "",
};
for (const [label, fn] of Object.entries(samples)) { const e = catchIt(fn); show(label, [e.name, e.message]); }

// 2. Анатомия ошибки
const e = new Error("сбой", { cause: new TypeError("причина") });
show("свойства Error", { name: e.name, message: e.message, stackЕсть: typeof e.stack === "string", первыйРядСтека: e.stack.split("\\n")[0], cause: e.cause.message });
show("перечисляемые ключи Error", Object.keys(e));
show("JSON.stringify(error)", JSON.stringify(e));
show("JSON с явными полями", JSON.stringify({ name: e.name, message: e.message, cause: String(e.cause) }));
show("String(error) и error + ''", [String(e), e + ""]);
show("Object.prototype.toString", Object.prototype.toString.call(e));

// 3. Своя ошибка
class ValidationError extends Error {
  constructor(field, message, options) { super(message, options); this.name = "ValidationError"; this.field = field; }
}
class Plain extends Error {}
const v = new ValidationError("email", "Неверный адрес");
show("свой класс: name, instanceof, field", [v.name, v instanceof ValidationError, v instanceof Error, v.field]);
show("без this.name в подклассе", [new Plain("x").name, String(new Plain("x"))]);
show("стек начинается с имени подкласса", v.stack.split("\\n")[0]);

// 4. Бросать можно что угодно — но стека не будет
const thrown = [catchIt(() => { throw "строка"; }), catchIt(() => { throw { code: 42 }; }), catchIt(() => { throw null; })];
show("throw строки, объекта, null → тип пойманного", thrown.map((t) => (t === null ? "null" : typeof t)));
show("есть ли stack у брошенной строки", typeof thrown[0].stack);

// 5. cause-цепочка и AggregateError
const chain = new Error("запрос не выполнен", { cause: new Error("сервер недоступен", { cause: new Error("ECONNREFUSED") }) });
const messages = []; for (let c = chain; c; c = c.cause) messages.push(c.message);
show("цепочка cause", messages);
const agg = await Promise.any([Promise.reject(new Error("а")), Promise.reject(new TypeError("б"))]).catch((x) => x);
show("Promise.any: имя, число причин, типы", [agg.name, agg.errors.length, agg.errors.map((x) => x.name)]);

// 6. finally перекрывает return и throw
const f1 = () => { try { return "из try"; } finally { console.log("  finally выполнился"); } };
const f2 = () => { try { return "из try"; } finally { return "из finally"; } };
const f3 = () => { try { throw new Error("из try"); } catch { return "из catch"; } finally { console.log("  finally после catch"); } };
const f4 = () => { try { throw new Error("из try"); } finally { return "finally проглотил ошибку"; } };
show("return в try", f1());
show("return в finally перекрывает return из try", f2());
show("catch + finally", f3());
show("return в finally проглатывает исключение", f4());

// 7. Повторный бросок и необязательная привязка catch
try { try { JSON.parse("{"); } catch (err) { throw new Error("конфигурация повреждена", { cause: err }); } } catch (outer) { show("rethrow с cause: внешняя / внутренняя", [outer.message, outer.cause.name]); }
show("catch без переменной", (() => { try { null.x; } catch { return "поймано"; } })());

// 8. Заголовок stack (V8) вычисляется при первом обращении к свойству
class Named extends Error { constructor(m) { super(m); this.name = "Named"; } }
show("подкласс с this.name после super(): заголовок stack", new Named("x").stack.split("\\n")[0]);
const early = new Error("a"); early.name = "Changed"; early.message = "b";
show("name/message изменены ДО первого чтения stack", early.stack.split("\\n")[0]);
const late = new Error("a"); void late.stack; late.name = "Changed"; late.message = "b";
show("name/message изменены ПОСЛЕ первого чтения stack", [late.stack.split("\\n")[0], String(late)]);`, { filename: "er1-errors.mjs", collapsed: true, lineNumbers: true }),
      code("text", `undefined.x                                    → ["TypeError","Cannot read properties of undefined (reading 'x')"]
null.x()                                       → ["TypeError","Cannot read properties of null (reading 'x')"]
obj.nope()                                     → ["TypeError","o.nope is not a function"]
необъявленная переменная                       → ["ReferenceError","notDeclared is not defined"]
TDZ: let до объявления                         → ["ReferenceError","Cannot access 'v' before initialization"]
присваивание const                             → ["TypeError","Assignment to constant variable."]
бесконечная рекурсия                           → ["RangeError","Maximum call stack size exceeded"]
new Array(-1)                                  → ["RangeError","Invalid array length"]
(1.5).toFixed(101)                             → ["RangeError","toFixed() digits argument must be between 0 and 100"]
BigInt + число                                 → ["TypeError","Cannot mix BigInt and other types, use explicit conversions"]
decodeURIComponent('%')                        → ["URIError","URI malformed"]
JSON.parse('{плохо')                           → ["SyntaxError","Expected property name or '}' in JSON at position 1 (line 1 column 2)"]
new (class A {})()()                           → ["TypeError","(intermediate value) is not a function"]
Symbol() + ''                                  → ["TypeError","Cannot convert a Symbol value to a string"]
свойства Error                                 → {"name":"Error","message":"сбой","stackЕсть":true,"первыйРядСтека":"Error: сбой","cause":"причина"}
перечисляемые ключи Error                      → []
JSON.stringify(error)                          → {}
JSON с явными полями                           → {"name":"Error","message":"сбой","cause":"TypeError: причина"}
String(error) и error + ''                     → ["Error: сбой","Error: сбой"]
Object.prototype.toString                      → [object Error]
свой класс: name, instanceof, field            → ["ValidationError",true,true,"email"]
без this.name в подклассе                      → ["Error","Error: x"]
стек начинается с имени подкласса              → ValidationError: Неверный адрес
throw строки, объекта, null → тип пойманного   → ["string","object","null"]
есть ли stack у брошенной строки               → undefined
цепочка cause                                  → ["запрос не выполнен","сервер недоступен","ECONNREFUSED"]
Promise.any: имя, число причин, типы           → ["AggregateError",2,["Error","TypeError"]]
  finally выполнился
return в try                                   → из try
return в finally перекрывает return из try     → из finally
  finally после catch
catch + finally                                → из catch
return в finally проглатывает исключение       → finally проглотил ошибку
rethrow с cause: внешняя / внутренняя          → ["конфигурация повреждена","SyntaxError"]
catch без переменной                           → поймано
подкласс с this.name после super(): заголовок stack → Named: x
name/message изменены ДО первого чтения stack  → Changed: b
name/message изменены ПОСЛЕ первого чтения stack → ["Error: a","Changed: b"]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Типы и тексты:** `undefined.x` → `TypeError: Cannot read properties of undefined (reading 'x')`; `o.nope()` → `o.nope is not a function`; необъявленная переменная → `ReferenceError: notDeclared is not defined`; `let` до объявления → `Cannot access 'v' before initialization`; `const` → `Assignment to constant variable.`; рекурсия → `RangeError: Maximum call stack size exceeded`; `new Array(-1)` → `RangeError: Invalid array length`; `decodeURIComponent('%')` → `URIError: URI malformed`; `JSON.parse` → `SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)`.",
        "**Тексты принадлежат движку:** в Firefox и Safari они другие — не ветвите логику по `message`, используйте `name`, `instanceof` и собственные коды (`code`).",
        "**Анатомия `Error`:** `name`, `message`, `stack` (строка, первая строка — `Error: сбой`), `cause`; перечисляемых ключей нет (`Object.keys(e)` — `[]`), поэтому `JSON.stringify(e)` — `{}`; `String(e)` и `e + \"\"` дают `Error: сбой`.",
        "**Собственные классы:** `class ValidationError extends Error` + `this.name = \"ValidationError\"` — `instanceof` работает на обоих уровнях; без присваивания `name` остаётся `\"Error\"` (`Error: x`).",
        "**Бросить можно что угодно,** но у строки, `null` и обычного объекта нет `stack` (`undefined`) — всегда бросайте `Error`.",
        "**`cause`-цепочка:** `запрос не выполнен ← сервер недоступен ← ECONNREFUSED`; `Promise.any` отклоняется `AggregateError` с массивом `errors` (`[Error, TypeError]`).",
        "**Заголовок `stack` в V8 вычисляется при первом обращении к свойству:** изменение `name`/`message` до чтения даёт `Changed: b`, после — заголовок остаётся прежним (`Error: a`), хотя `String(e)` уже `Changed: b`. Устанавливайте `name` в конструкторе, а не после показа ошибки.",
        "**`finally`:** выполняется всегда; `return` в `finally` перекрывает `return` из `try` (`из finally`) и **проглатывает исключение** (`finally проглотил ошибку`).",
        "**Повторный бросок:** `catch (err) { throw new Error(\"конфигурация повреждена\", { cause: err }); }` — внешнее сообщение, внутренняя причина (`SyntaxError`); `catch {}` без переменной допустим.",
      ),

      h("Необработанные ошибки в Node.js"),
      code("js", `import { spawnSync } from "node:child_process";
const run = (title, code, extra = []) => {
  const r = spawnSync(process.execPath, [...extra, "--input-type=module", "-e", code], { encoding: "utf8" });
  const err = (r.stderr.split("\\n").find((l) => /^(\\(node:\\d+\\) )?(\\w*Error|\\[?UnhandledPromiseRejection)/.test(l)) ?? "").replace(/^\\(node:\\d+\\) /, "");
  console.log(title.padEnd(50), "→ код выхода", r.status, "| stdout:", JSON.stringify(r.stdout.trim()), "| stderr:", JSON.stringify(err.trim().slice(0, 90)));
};

run("throw в синхронном коде", \`console.log("до"); throw new Error("сбой");\`);
run("throw в колбэке таймера", \`setTimeout(() => { throw new Error("в таймере"); }, 5); setTimeout(() => console.log("не напечатается"), 50);\`);
run("необработанный отказ Promise", \`Promise.reject(new Error("отказ")); setTimeout(() => console.log("не напечатается"), 50);\`);
run("отказ с примитивом (не Error)", \`Promise.reject("просто строка");\`);
run("process.on('uncaughtException')", \`process.on("uncaughtException", (e, origin) => console.log("поймано:", e.message, "| origin:", origin)); setTimeout(() => { throw new Error("в таймере"); }, 5); setTimeout(() => console.log("процесс жив"), 50);\`);
run("process.on('unhandledRejection')", \`process.on("unhandledRejection", (reason) => console.log("отказ без обработчика:", reason.message)); Promise.reject(new Error("отказ")); setTimeout(() => console.log("процесс жив"), 50);\`);
run("--unhandled-rejections=warn", \`Promise.reject(new Error("отказ")); setTimeout(() => console.log("процесс жив"), 50);\`, ["--unhandled-rejections=warn"]);
run("rejectionHandled (поздняя подписка)", \`process.on("unhandledRejection", () => console.log("unhandledRejection")); process.on("rejectionHandled", () => console.log("rejectionHandled")); const p = Promise.reject(new Error("x")); setTimeout(() => p.catch(() => console.log("подписались позже")), 20);\`);
run("try/catch не ловит ошибку из таймера", \`try { setTimeout(() => { throw new Error("из таймера"); }, 5); } catch { console.log("не напечатается"); } console.log("try/catch отработал");\`);
run("process.exitCode и выход без исключения", \`process.exitCode = 3; console.log("конец");\`);`, { filename: "er2-uncaught.mjs", collapsed: true }),
      code("text", `throw в синхронном коде                            → код выхода 1 | stdout: "до" | stderr: "Error: сбой"
throw в колбэке таймера                            → код выхода 1 | stdout: "" | stderr: "Error: в таймере"
необработанный отказ Promise                       → код выхода 1 | stdout: "" | stderr: "Error: отказ"
отказ с примитивом (не Error)                      → код выхода 1 | stdout: "" | stderr: "UnhandledPromiseRejection: This error originated either by throwing inside of an async fun"
process.on('uncaughtException')                    → код выхода 0 | stdout: "поймано: в таймере | origin: uncaughtException\\nпроцесс жив" | stderr: ""
process.on('unhandledRejection')                   → код выхода 0 | stdout: "отказ без обработчика: отказ\\nпроцесс жив" | stderr: ""
--unhandled-rejections=warn                        → код выхода 0 | stdout: "процесс жив" | stderr: "UnhandledPromiseRejectionWarning: Error: отказ"
rejectionHandled (поздняя подписка)                → код выхода 0 | stdout: "unhandledRejection\\nподписались позже\\nrejectionHandled" | stderr: ""
try/catch не ловит ошибку из таймера               → код выхода 1 | stdout: "try/catch отработал" | stderr: "Error: из таймера"
process.exitCode и выход без исключения            → код выхода 3 | stdout: "конец" | stderr: ""`, { filename: "вывод Node.js 22.22.0 (каждый случай — отдельный процесс)" }),
      ul(
        "**Синхронное исключение, исключение в таймере и необработанный отказ** завершают процесс с кодом `1`; последующие таймеры не выполняются (`не напечатается`).",
        "**Отказ с примитивом** (`Promise.reject(\"строка\")`) — тот же код `1` и сообщение `UnhandledPromiseRejection: … The promise rejected with the reason …` (стека у строки нет).",
        "**`try/catch` не ловит ошибку из таймера:** блок отработал раньше, ошибка пришла позже в другой макрозадаче — код выхода `1`.",
        "**Обработчики `process.on(\"uncaughtException\")` и `process.on(\"unhandledRejection\")`** (с `origin`) делают процесс живым, но процесс после неожиданной ошибки может быть в неконсистентном состоянии — используйте их для логирования и корректного завершения.",
        "**`--unhandled-rejections=warn`** превращает отказ в предупреждение (`UnhandledPromiseRejectionWarning`), код выхода `0` — это маскирует баги.",
        "**Поздняя подписка:** `unhandledRejection` → затем `rejectionHandled`, когда обработчик всё же появился.",
        "**`process.exitCode = 3`** задаёт код выхода без немедленного завершения.",
      ),

      h("Ошибки в браузере"),
      code("js", `import http from "node:http";
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";

const SCRIPT = \`function explode() {\\n  throw new Error("сбой в стороннем скрипте");\\n}\\nsetTimeout(explode, 0);\\n\`;
const b = http.createServer((req, res) => {                       // «чужой» origin со скриптами
  res.setHeader("content-type", "text/javascript");
  if (req.url === "/with-cors.js") res.setHeader("access-control-allow-origin", "*");
  res.end(SCRIPT);
});
const a = http.createServer((req, res) => {                       // страница
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(\`<!doctype html><title>t</title><p>страница</p>\`);
});
await Promise.all([new Promise((r) => a.listen(0, "127.0.0.1", r)), new Promise((r) => b.listen(0, "127.0.0.1", r))]);
const A = \`http://127.0.0.1:\${a.address().port}\`, B = \`http://127.0.0.1:\${b.address().port}\`;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e.message ?? e).split("\\n")[0]));
await page.goto(A + "/");
await page.evaluate(() => {
  window.L = [];
  window.log = (k, v) => L.push(k.padEnd(52) + "→ " + JSON.stringify(v));
  window.onerror = (message, source, lineno, colno, error) => { log("window.onerror (аргументы)", { message, filename: source ? "задан" : "пусто", lineno: lineno > 0, colno: colno > 0, errorЭтоError: error instanceof Error }); };
  addEventListener("error", (e) => {
    if (e instanceof ErrorEvent) log("addEventListener('error') — ErrorEvent", { message: e.message, filename: e.filename ? "задан" : "пусто", errorName: e.error?.name ?? null });
    else log("error без всплытия (ресурс), capture-слушатель", { тип: e.constructor.name, tag: e.target.tagName, цель: e.target.src.replace(location.origin, "ORIGIN") });
  }, true);
  addEventListener("unhandledrejection", (e) => { log("unhandledrejection", { reason: String(e.reason), promiseЕсть: e.promise instanceof Promise, cancelable: e.cancelable }); e.preventDefault(); });
  addEventListener("rejectionhandled", () => log("rejectionhandled", true));
});
const flush = async () => { await page.waitForTimeout(200); const out = await page.evaluate(() => L.splice(0)); out.forEach((l) => console.log("  " + l)); };

console.log("1. Исключение в setTimeout своего скрипта"); 
await page.evaluate(() => { const s = document.createElement("script"); s.textContent = "setTimeout(() => { throw new Error(\\"свой сбой\\"); }, 0);"; document.body.append(s); }); await flush();
console.log("2. Отклонённое обещание без обработчика, затем поздняя подписка");
await page.evaluate(() => { window.p = Promise.reject(new Error("отказ")); setTimeout(() => p.catch(() => {}), 100); }); await page.waitForTimeout(250); await flush();
console.log("3. Ошибка загрузки изображения");
await page.evaluate(() => { const i = new Image(); i.src = "/нет-такой-картинки.png"; document.body.append(i); }); await flush();
console.log("4. Скрипт с чужого origin без CORS");
await page.evaluate((src) => { const s = document.createElement("script"); s.src = src; document.body.append(s); }, B + "/no-cors.js"); await flush();
console.log("5. Тот же скрипт с crossorigin и Access-Control-Allow-Origin");
await page.evaluate((src) => { const s = document.createElement("script"); s.crossOrigin = "anonymous"; s.src = src; document.body.append(s); }, B + "/with-cors.js"); await flush();
console.log("Страница сообщила Playwright об ошибках (pageerror) — после всех пяти случаев:");
for (const m of pageErrors) console.log("  " + m);
await browser.close(); a.close(); b.close();`, { filename: "run-er3-browser.mjs", collapsed: true }),
      code("text", `1. Исключение в setTimeout своего скрипта
  window.onerror (аргументы)                          → {"message":"Uncaught Error: свой сбой","filename":"пусто","lineno":true,"colno":true,"errorЭтоError":true}
  addEventListener('error') — ErrorEvent              → {"message":"Uncaught Error: свой сбой","filename":"пусто","errorName":"Error"}
2. Отклонённое обещание без обработчика, затем поздняя подписка
  unhandledrejection                                  → {"reason":"Error: отказ","promiseЕсть":true,"cancelable":true}
  rejectionhandled                                    → true
3. Ошибка загрузки изображения
  error без всплытия (ресурс), capture-слушатель      → {"тип":"Event","tag":"IMG","цель":"ORIGIN/%D0%BD%D0%B5%D1%82-%D1%82%D0%B0%D0%BA%D0%BE%D0%B9-%D0%BA%D0%B0%D1%80%D1%82%D0%B8%D0%BD%D0%BA%D0%B8.png"}
4. Скрипт с чужого origin без CORS
  window.onerror (аргументы)                          → {"message":"Script error.","filename":"пусто","lineno":false,"colno":false,"errorЭтоError":false}
  addEventListener('error') — ErrorEvent              → {"message":"Script error.","filename":"пусто","errorName":null}
5. Тот же скрипт с crossorigin и Access-Control-Allow-Origin
  window.onerror (аргументы)                          → {"message":"Uncaught Error: сбой в стороннем скрипте","filename":"задан","lineno":true,"colno":true,"errorЭтоError":true}
  addEventListener('error') — ErrorEvent              → {"message":"Uncaught Error: сбой в стороннем скрипте","filename":"задан","errorName":"Error"}
Страница сообщила Playwright об ошибках (pageerror) — после всех пяти случаев:
  свой сбой
  сбой в стороннем скрипте
  сбой в стороннем скрипте`, { filename: "замер в Chromium 141 (страница на одном origin, скрипты — с другого)" }),
      ul(
        "**Исключение в обработчике или таймере** не останавливает страницу: приходит `window.onerror(message, source, lineno, colno, error)` и `ErrorEvent` (`message: \"Uncaught Error: свой сбой\"`, `error` — настоящий `Error`).",
        "**`unhandledrejection`:** `reason`, `promise`, событие отменяемо (`cancelable: true`); `preventDefault()` убирает сообщение об ошибке (список `pageerror` в конце не содержит отказов); если обработчик подписался позже, приходит `rejectionhandled`.",
        "**Ошибка ресурса** (`<img>`, `<script>`, `<link>`) — обычное событие `Event` без `ErrorEvent` и **без всплытия**: перехватывается только на фазе погружения (`addEventListener(\"error\", fn, true)`), `target` — элемент (`IMG`).",
        "**Чужой скрипт без CORS:** `message: \"Script error.\"`, нет `filename`, `lineno`/`colno` равны 0, `error: null` — браузер скрывает детали ради безопасности. Чтобы увидеть их, подключайте с `crossorigin=\"anonymous\"` и пусть сервер ответит `Access-Control-Allow-Origin` (случай 5: `Uncaught Error: сбой в стороннем скрипте`, `lineno`, `error` на месте).",
      ),

      h("Стек вызовов"),
      code("js", `import { fileURLToPath } from "node:url";
const here = fileURLToPath(import.meta.url);
// Оставляем только «функция (файл:строка:столбец)» без абсолютных путей
const frames = (e, n = 99) => e.stack.split("\\n").slice(1).filter((l) => l.trim().startsWith("at ")).slice(0, n)
  .map((l) => l.trim().replace(here, "er4-stack.mjs").replace("file://", "").replace(/\\(node:[^)]*\\)/, "(node:internal)").replace(/at (.*) \\(node:internal\\)/, "at $1 (внутренний код Node)"));
const show = (k, v) => console.log("\\n" + k + "\\n" + (Array.isArray(v) ? v.map((x) => "  " + x).join("\\n") : "  " + JSON.stringify(v)));

// 1. Обычный вызов: стек читается снизу вверх (первая строка — место создания ошибки)
function a() { return b(); }
function b() { return c(); }
function c() { return new Error("где я?"); }
show("1. new Error() в c(), вызванной из b() из a()", frames(a(), 4));

// 2. Предел длины стека
function deep(n) { return n === 0 ? new Error("глубоко") : deep(n - 1); }
show("2. Error.stackTraceLimit по умолчанию", Error.stackTraceLimit);
show("   рекурсия на 30 уровней: кадров в стеке", frames(deep(30)).length);
Error.stackTraceLimit = 3;
show("   при stackTraceLimit = 3", frames(deep(30)).length);
Error.stackTraceLimit = 100;
show("   при stackTraceLimit = 100", frames(deep(30)).length);
Error.stackTraceLimit = 10;

// 3. captureStackTrace скрывает вспомогательную функцию
function failPlain(message) { return new Error(message); }
function failHidden(message) { const e = new Error(message); Error.captureStackTrace(e, failHidden); return e; }
function checkPlain() { return failPlain("проверка не пройдена"); }
function checkHidden() { return failHidden("проверка не пройдена"); }
show("3. без captureStackTrace: верхний кадр — вспомогательная функция", frames(checkPlain(), 2));
show("   captureStackTrace(e, failHidden): верхний кадр — вызывающий", frames(checkHidden(), 2));

// 4. Асинхронные стеки
async function inner() { await null; throw new Error("в async"); }
async function middle() { await inner(); }
async function outer() { await middle(); }
const asyncErr = await outer().catch((e) => e);
show("4. ошибка после await в цепочке async-функций", frames(asyncErr, 4));

// 5. Колбэк таймера обрывает цепочку
function start() { return new Promise((resolve) => setTimeout(function fromTimer() { resolve(new Error("из таймера")); }, 1)); }
const timerErr = await start();
show("5. ошибка создана в колбэке таймера (кадры до await/старта не видны)", frames(timerErr, 3));

// 6. Имена кадров
const named = { run() { return new Error("метод"); } };
const arrow = () => new Error("стрелка");
const [fromAnon] = [function () { return new Error("анонимная"); }].map((f) => f());
show("6. имена кадров: метод / стрелка / анонимная функция внутри map", [frames(named.run(), 1)[0], frames(arrow(), 1)[0], ...frames(fromAnon, 2)]);

// 7. Стек доступен и без исключения
function whoCalledMe() { return new Error().stack.split("\\n")[2].trim().replace(here, "er4-stack.mjs").replace("file://", ""); }
function caller() { return whoCalledMe(); }
show("7. new Error().stack без throw: кто вызвал whoCalledMe()", caller());`, { filename: "er4-stack.mjs", collapsed: true, lineNumbers: true }),
      code("text", `
1. new Error() в c(), вызванной из b() из a()
  at c (er4-stack.mjs:11:23)
  at b (er4-stack.mjs:10:23)
  at a (er4-stack.mjs:9:23)
  at er4-stack.mjs:12:62

2. Error.stackTraceLimit по умолчанию
  10

   рекурсия на 30 уровней: кадров в стеке
  10

   при stackTraceLimit = 3
  3

   при stackTraceLimit = 100
  35

3. без captureStackTrace: верхний кадр — вспомогательная функция
  at failPlain (er4-stack.mjs:25:38)
  at checkPlain (er4-stack.mjs:27:32)

   captureStackTrace(e, failHidden): верхний кадр — вызывающий
  at checkHidden (er4-stack.mjs:28:33)
  at er4-stack.mjs:30:79

4. ошибка после await в цепочке async-функций
  at inner (er4-stack.mjs:33:44)
  at async middle (er4-stack.mjs:34:27)
  at async outer (er4-stack.mjs:35:26)
  at async er4-stack.mjs:36:18

5. ошибка создана в колбэке таймера (кадры до await/старта не видны)
  at Timeout.fromTimer [as _onTimeout] (er4-stack.mjs:40:94)
  at listOnTimeout (внутренний код Node)
  at process.processTimers (внутренний код Node)

6. имена кадров: метод / стрелка / анонимная функция внутри map
  at Object.run (er4-stack.mjs:45:32)
  at arrow (er4-stack.mjs:46:21)
  at er4-stack.mjs:47:42
  at er4-stack.mjs:47:80

7. new Error().stack без throw: кто вызвал whoCalledMe()
  "at caller (er4-stack.mjs:52:28)"`, { filename: "вывод Node.js 22.22.0 (абсолютные пути заменены на имя файла)" }),
      ul(
        "**Порядок:** первая строка — место, где создан `Error` (`at c (er4-stack.mjs:11:23)`), ниже — вызывающие (`b`, `a`, затем модуль). Читайте сверху вниз до первой строки **вашего** кода.",
        "**Предел:** `Error.stackTraceLimit` = 10; при 30 вложенных вызовах в стеке 10 кадров, при `3` — 3, при `100` — все 35. Для отладки глубоких стеков увеличьте предел (`Error.stackTraceLimit = 100` или `node --stack-trace-limit=100`: в замере стек с рекурсией на 30 уровней при этом полностью помещается).",
        "**`Error.captureStackTrace(e, fn)`** (V8) убирает из стека `fn` и всё выше: верхний кадр после вызова — вызывающий `checkHidden`, а не вспомогательная `failHidden`. Удобно для функций-проверок и фабрик ошибок.",
        "**Асинхронные кадры:** после `await` стек содержит `at async middle`, `at async outer` — V8 восстанавливает цепочку `await`.",
        "**Колбэк таймера обрывает цепочку:** в стеке только `Timeout.fromTimer` и внутренние функции Node — кто запустил таймер, не видно.",
        "**Имена:** метод — `Object.run`, стрелка, присвоенная переменной — `arrow`, анонимная функция внутри `map` — без имени (`at er4-stack.mjs:47:42`). Давайте функциям имена — стеки станут читаемыми.",
        "**Стек без исключения:** `new Error().stack` позволяет узнать вызывающего (`at caller …`) — основа `console.trace` и логгеров.",
      ),

      h("Отладка: `console`, `debugger`, точки останова"),
      code("js", `import { spawnSync } from "node:child_process";
const code = \`
console.log("log → stdout");
console.info("info → stdout");
console.warn("warn → stderr");
console.error("error → stderr");
console.debug("debug → stdout");
console.table([{ имя: "Анна", возраст: 31 }, { имя: "Борис", возраст: 27 }]);
console.group("группа");
console.log("внутри группы");
console.group("вложенная");
console.log("ещё глубже");
console.groupEnd(); console.groupEnd();
console.assert(1 + 1 === 3, "утверждение ложно:", { сумма: 2 });
console.assert(true, "это не напечатается");
console.count(); console.count(); console.count("мой"); console.countReset(); console.count();
console.log("%s — %d лет, объект %o, JSON %j, %% и %c стиль", "Анна", 31.9, { a: 1 }, { b: 2 }, "color: red");
console.log({ вложенность: { а: { б: { в: { г: 1 } } } }, массив: Array.from({ length: 120 }, (_, i) => i).length });
console.dir({ вложенность: { а: { б: { в: { г: 1 } } } } }, { depth: 0 });
console.log(String(new Error("ошибка в log")).split("\\\\n")[0], "| тип Error в log печатает стек:", /^\\\\s*at /m.test(require("node:util").inspect(new Error("x"))));
console.trace("след вызова");
\`;
const r = spawnSync(process.execPath, ["-e", code], { encoding: "utf8" });
const mask = (s) => s.replace(/\\(node:\\d+\\)/g, "(node:PID)").split("\\n").filter((l) => !/^\\s+at /.test(l)).join("\\n").trim();
console.log("=== stdout ===\\n" + mask(r.stdout));
console.log("\\n=== stderr (строки со следами стека убраны) ===\\n" + mask(r.stderr));`, { filename: "er5-console.mjs", collapsed: true }),
      code("text", `=== stdout ===
log → stdout
info → stdout
debug → stdout
┌─────────┬─────────┬─────────┐
│ (index) │ имя     │ возраст │
├─────────┼─────────┼─────────┤
│ 0       │ 'Анна'  │ 31      │
│ 1       │ 'Борис' │ 27      │
└─────────┴─────────┴─────────┘
группа
  внутри группы
  вложенная
    ещё глубже
default: 1
default: 2
мой: 1
default: 1
Анна — 31.9 лет, объект { a: 1 }, JSON {"b":2}, % и  стиль
{ 'вложенность': { 'а': { 'б': [Object] } }, 'массив': 120 }
{ 'вложенность': [Object] }
Error: ошибка в log | тип Error в log печатает стек: true

=== stderr (строки со следами стека убраны) ===
warn → stderr
error → stderr
Assertion failed: утверждение ложно: { 'сумма': 2 }
Trace: след вызова`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Потоки:** `log`, `info`, `debug`, `table`, `group` → `stdout`; `warn`, `error`, `assert`, `trace` → `stderr`. Это важно для перенаправлений и логирования в продакшене.",
        "**`console.table`** выводит массив объектов таблицей (колонки `(index)`, `имя`, `возраст`) — быстрый способ сравнить данные.",
        "**`console.group`/`groupEnd`** добавляют отступы; **`console.assert(условие, …)`** печатает `Assertion failed: …` только при ложном условии; **`console.count()`** считает вызовы по метке (`default: 1`, `default: 2`, `мой: 1`), `countReset` сбрасывает.",
        "**Подстановки:** `%s`, `%d`, `%o`, `%j`, `%%`, `%c` (стиль — только в браузере; в Node `%c` печатает пустоту).",
        "**Глубина:** `console.log` показывает вложенность до 2 уровней (`[Object]`), `console.dir(obj, { depth })` управляет глубиной.",
        "**`console.trace(\"метка\")`** печатает `Trace: метка` и стек в `stderr`.",
      ),
      ul(
        "**Точки останова** (Sources в DevTools, `node --inspect`): остановка на строке, **условные** точки (остановка при `user.id === 7`), **logpoints** (печать без правки кода), «Pause on exceptions» (остановка на выбросе), пошаговое выполнение (`step over/into/out`), панель Scope/Call Stack/Watch.",
        "**Оператор `debugger;`** — программная точка останова (работает, когда DevTools открыты).",
        "**Source maps** подключают исходники к собранному коду: без них стек в продакшене — `a.js:1:48210`. В Node: `--enable-source-maps`.",
        "**Метод:** воспроизвести → свести к минимальному примеру → разделить задачу пополам (комментирование, `git bisect`) → сформулировать и проверить гипотезу → исправить → закрепить тестом.",
      ),
      tip("Откройте DevTools → Sources → правая панель «Breakpoints»: включите «Pause on caught exceptions», если ошибка перехвачена и «теряется» внутри `catch`; отключайте «Pause on exceptions» для библиотечного кода через Ignore list."),

      h("Собственная иерархия ошибок: `AppError`"),
      code("js", `// Иерархия ошибок приложения: код для программ, сообщение для людей, причина — для разбора.
export class AppError extends Error {
  constructor(message, { code = "APP_ERROR", cause, details } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = new.target.name;                   // имя подкласса, а не «Error»
    this.code = code;
    if (details !== undefined) this.details = details;
  }

  toJSON() {                                       // JSON.stringify(error) без этого вернул бы {}
    const json = { name: this.name, code: this.code, message: this.message };
    if (this.details !== undefined) json.details = this.details;
    if (this.cause !== undefined) json.cause = this.cause instanceof AppError ? this.cause.toJSON() : { name: this.cause?.name ?? "NonError", message: String(this.cause?.message ?? this.cause) };
    return json;
  }
}

export class NotFoundError extends AppError {
  constructor(what, options) { super(\`Не найдено: \${what}\`, { code: "NOT_FOUND", ...options }); }
}

export class ValidationError extends AppError {
  constructor(field, message, options) { super(message, { code: "VALIDATION", details: { field }, ...options }); }
}

export const isAppError = (value, code) => value instanceof AppError && (code === undefined || value.code === code);

// Оборачивает «низкоуровневую» ошибку, сохраняя причину
export function wrap(error, message, ErrorClass = AppError, options = {}) {
  return new ErrorClass(message, { ...options, cause: error });
}`, { filename: "app-error.mjs", lineNumbers: true }),
      code("js", `import { AppError, NotFoundError, ValidationError, isAppError, wrap } from "./app-error.mjs";
const src = process.argv[2] ? await import(new URL(process.argv[2], import.meta.url)) : { AppError, NotFoundError, ValidationError, isAppError, wrap };
const { AppError: A, NotFoundError: NF, ValidationError: VE, isAppError: is, wrap: w } = src;
const results = [];
const check = (name, ok, info = "") => { results.push(ok); console.log((ok ? "✓ " : "✗ ") + name + (info ? " — " + info : "")); };

const nf = new NF("пользователь 7");
check("имя класса — в name и в заголовке стека", nf.name === "NotFoundError" && nf.stack.split("\\n")[0].startsWith("NotFoundError:"), nf.stack.split("\\n")[0]);
check("instanceof: NotFoundError, AppError, Error", nf instanceof NF && nf instanceof A && nf instanceof Error);
check("код и сообщение", nf.code === "NOT_FOUND" && nf.message === "Не найдено: пользователь 7");

const ve = new VE("email", "Неверный адрес");
check("ValidationError: details.field и код VALIDATION", ve.code === "VALIDATION" && ve.details.field === "email");

const low = new TypeError("fetch failed");
const high = w(low, "Не удалось загрузить профиль", A, { code: "LOAD_FAILED" });
check("wrap сохраняет причину и меняет код", high.cause === low && high.code === "LOAD_FAILED" && high.message === "Не удалось загрузить профиль");

check("toJSON: JSON.stringify содержит имя, код, сообщение, детали и причину", (() => { try { const j = JSON.parse(JSON.stringify(w(low, "внешняя", A, { code: "X", details: { a: 1 } }))); return j.name === "AppError" && j.code === "X" && j.details.a === 1 && j.cause.name === "TypeError" && j.cause.message === "fetch failed"; } catch { return false; } })());
check("JSON.stringify(обычного Error) — пустой объект (мотивация toJSON)", JSON.stringify(new Error("x")) === "{}");

check("isAppError: по классу и по коду", is(nf) && is(nf, "NOT_FOUND") && !is(nf, "VALIDATION") && !is(new Error("x")) && !is("строка"));
check("цепочка cause из трёх уровней", (() => { const e3 = new A("верх", { cause: new A("середина", { cause: new RangeError("низ") }) }); const names = []; for (let c = e3; c; c = c.cause) names.push(c.name); return names.join() === "AppError,AppError,RangeError"; })());

const failed = results.filter((x) => !x).length;
console.log(failed ? \`\\nПровалено: \${failed}\` : \`\\nВсе проверки пройдены: \${results.length}/\${results.length}\`);
process.exit(failed ? 1 : 0);`, { filename: "app-error-test.mjs", collapsed: true }),
      code("text", `✓ имя класса — в name и в заголовке стека — NotFoundError: Не найдено: пользователь 7
✓ instanceof: NotFoundError, AppError, Error
✓ код и сообщение
✓ ValidationError: details.field и код VALIDATION
✓ wrap сохраняет причину и меняет код
✓ toJSON: JSON.stringify содержит имя, код, сообщение, детали и причину
✓ JSON.stringify(обычного Error) — пустой объект (мотивация toJSON)
✓ isAppError: по классу и по коду
✓ цепочка cause из трёх уровней

Все проверки пройдены: 9/9`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`this.name = new.target.name`** — имя подкласса в `name` и в заголовке стека без повторения в каждом классе.",
        "**`code`** — стабильный идентификатор для программ (`NOT_FOUND`, `VALIDATION`), `message` — для людей.",
        "**`cause` передаётся родителю** и сохраняется при оборачивании (`wrap`).",
        "**`toJSON()`** решает проблему `JSON.stringify(error) === \"{}\"` и сериализует цепочку причин.",
        "**`isAppError(value, code)`** — проверка без привязки к конкретному классу.",
      ),
    ]),

    section("syntax", [
      annotated(
        "js",
        `class HttpError extends Error {
  constructor(status, options) {
    super("HTTP " + status, options);
    this.name = "HttpError";
    this.status = status;
  }
}

async function load(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new HttpError(response.status);
    return await response.json();
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw new Error("Не удалось загрузить " + url, { cause: error });
  } finally {
    spinner.hide();
  }
}`,
        [
          { line: [1, 7], text: "Собственный класс ошибки: `extends Error`, сообщение и `options` (с `cause`) уходят в `super`, `name` задаётся явно." },
          { line: 9, text: "`async`-функция: отказ вернётся как отклонённое обещание." },
          { line: [10, 12], text: "`try`: `await` превращает отказ в исключение; проверка `response.ok` бросает осмысленную ошибку." },
          { line: [14, 15], text: "`catch`: различаем ожидаемое (`404` → `null`) и непредвиденное — через `instanceof` и поля, а не через текст." },
          { line: 16, text: "Непредвиденное пробрасываем, добавляя контекст и **сохраняя причину** (`cause`)." },
          { line: [17, 18], text: "`finally` выполняется всегда; не возвращайте из него значения." },
        ],
        "syntax.js",
      ),
    ]),

    section("minimal-example", [
      p("Не запуская код, запишите вывод и объясните, что делает `finally` в каждой функции."),
      code("js", `function a() {
  try { return "из try"; } finally { console.log("finally A"); }
}
function b() {
  try { throw new Error("E"); } catch (e) { return "catch " + e.message; } finally { return "из finally"; }
}
function c() {
  for (const i of [1, 2, 3]) {
    try { if (i === 2) continue; console.log("i =", i); } finally { console.log("очистка", i); }
  }
}
function d() {
  try {
    try { throw new Error("внутренняя"); } finally { console.log("внутренний finally"); }
  } catch (e) { return "поймано: " + e.message; }
}
console.log(a());
console.log(b());
c();
console.log(d());`, { filename: "x1-predict.mjs" }),
      code("text", `finally A
из try
из finally
i = 1
очистка 1
очистка 2
i = 3
очистка 3
внутренний finally
поймано: внутренняя`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "`a()` — `finally` печатает `finally A` **до** того, как значение `из try` вернётся вызывающему.",
        "`b()` — `return` в `finally` перекрывает и `return` из `catch`, и исключение: результат `из finally`.",
        "`c()` — `finally` выполняется и при `continue` (`очистка 2` без `i = 2`).",
        "`d()` — внутренний `finally` отрабатывает, исключение продолжает подниматься и ловится внешним `catch`.",
      ),
    ]),

    section("detailed-example", [
      p("`installErrorReporter(options)` собирает необработанные ошибки страницы: `error`, `unhandledrejection` и ошибки ресурсов (на фазе погружения); приводит их к простым объектам с цепочкой `cause`; помечает непрозрачные ошибки чужих скриптов; отбрасывает повторы (дедупликация по отпечатку), ограничивает частоту, группирует отчёты в пакеты, не зацикливается на собственных ошибках, не подавляет ошибку для пользователя и сбрасывает очередь при `pagehide` и `uninstall()`."),
      code("js", `// Сбор необработанных ошибок на странице: нормализация, дедупликация, ограничение частоты, пакетная отправка.
export function installErrorReporter({
  endpoint,
  send,                                   // (batch) => void | Promise; по умолчанию fetch(endpoint) с keepalive
  sampleRate = 1,
  random = Math.random,
  maxPerMinute = 10,
  dedupeWindowMs = 60_000,
  flushDelayMs = 200,
  context = () => ({}),
  now = Date.now,
  target = globalThis,
} = {}) {
  const lifetime = new AbortController();
  const lastSeen = new Map();             // fingerprint → время последней отправки
  const accepted = [];                    // метки времени принятых отчётов за последнюю минуту
  const queue = [];
  const stats = { captured: 0, sent: 0, suppressed: 0, dropped: 0, sampledOut: 0, failed: 0 };
  let timer = null;
  let busy = false;                       // защита от рекурсии: ошибки самого репортёра не репортим

  const deliver = send ?? ((batch) => fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(batch), keepalive: true }));

  function causeChain(error) {
    const chain = [];
    const seen = new Set([error]);
    for (let c = error?.cause; c && chain.length < 5 && !seen.has(c); c = c.cause) {
      seen.add(c);
      chain.push(c instanceof Error ? { name: c.name, message: c.message } : { name: "NonError", message: String(c) });
    }
    return chain;
  }

  function describe(type, value, extra = {}) {
    const base = value instanceof Error
      ? { name: value.name, message: value.message, stack: value.stack ?? "", cause: causeChain(value) }
      : { name: "NonError", message: typeof value === "string" ? value : safeString(value), stack: "", cause: [] };
    let ctx = {};
    try { ctx = context() ?? {}; } catch { /* контекст не должен ломать отчёт */ }
    return { type, ...base, ...extra, url: target.location?.href, ts: now(), context: ctx };
  }
  function safeString(v) { try { return typeof v === "object" && v !== null ? JSON.stringify(v) : String(v); } catch { return Object.prototype.toString.call(v); } }
  const fingerprint = (r) => [r.type, r.name, r.message, (r.stack.split("\\n")[1] ?? "").trim()].join("|");

  function capture(type, value, extra) {
    if (busy) return;                      // повторный вход (например, report() внутри context()) игнорируем
    busy = true;
    try {
      const report = describe(type, value, extra);
      stats.captured++;
      if (sampleRate < 1 && random() >= sampleRate) { stats.sampledOut++; return; }
      const key = fingerprint(report);
      const t = now();
      if (lastSeen.has(key) && t - lastSeen.get(key) < dedupeWindowMs) { stats.suppressed++; return; }
      while (accepted.length && t - accepted[0] >= 60_000) accepted.shift();
      if (accepted.length >= maxPerMinute) { stats.dropped++; return; }
      accepted.push(t);
      lastSeen.set(key, t);
      queue.push(report);
      timer ??= setTimeout(flush, flushDelayMs);
    } finally {
      busy = false;
    }
  }

  function flush() {
    clearTimeout(timer);
    timer = null;
    if (!queue.length) return;
    const batch = queue.splice(0);
    try {
      Promise.resolve(deliver(batch)).catch(() => { stats.failed++; });
      stats.sent += batch.length;
    } catch {
      stats.failed++;
    }
  }

  const on = (type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: lifetime.signal });
  on("error", (event) => {
    if (event.target && event.target !== target && event.target.tagName) {            // ошибка загрузки ресурса: событие не всплывает, ловим на погружении
      const el = event.target;
      capture("resource", new Error(\`Не загружен \${el.tagName.toLowerCase()}: \${el.currentSrc || el.src || el.href}\`), { name: "ResourceError", stack: "", tag: el.tagName });
      return;
    }
    const opaque = event.message === "Script error." && !event.error && !event.filename;   // чужой скрипт без CORS: деталей нет
    capture("error", event.error ?? new Error(event.message), opaque ? { name: "ScriptError", opaque: true, stack: "" } : {});
  }, { capture: true });
  on("unhandledrejection", (event) => capture("unhandledrejection", event.reason));
  on("pagehide", flush);
  on("visibilitychange", () => { if (target.document?.visibilityState === "hidden") flush(); });

  return {
    report: (error, extra) => capture("handled", error, extra),   // для обработанных, но важных ошибок
    flush,
    stats: () => ({ ...stats, queued: queue.length }),
    uninstall() { flush(); lifetime.abort(); },
  };
}`, { filename: "error-reporter.mjs", lineNumbers: true }),
      code("js", `import http from "node:http";
import fs from "node:fs";
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";

const src = fs.readFileSync(process.argv[2] ?? "error-reporter.mjs", "utf8").replace(/^export /m, "");
const received = [];
const SCRIPT = \`setTimeout(function () { throw new Error("чужой скрипт"); }, 0);\`;
const server = http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  if (req.url === "/report") { received.push({ ct: req.headers["content-type"], body: JSON.parse(Buffer.concat(chunks).toString("utf8")) }); res.statusCode = 204; res.end(); return; }
  if (req.url === "/third-party.js") { res.setHeader("content-type", "text/javascript"); res.end(SCRIPT); return; }
  if (req.url === "/favicon.ico") { res.statusCode = 204; res.end(); return; }
  res.setHeader("content-type", "text/html; charset=utf-8"); res.end("<!doctype html><title>t</title><p>страница</p>");
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = \`http://127.0.0.1:\${server.address().port}\`;
const otherOrigin = origin.replace("127.0.0.1", "localhost");

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const page = await browser.newPage();
await page.goto(origin + "/");
await page.addScriptTag({ content: src + "\\nwindow.installErrorReporter = installErrorReporter;" });
await page.evaluate(() => { window.sleep = (ms) => new Promise((r) => setTimeout(r, ms)); window.sent = []; window.fakeSend = (batch) => { sent.push(...batch); }; window.clock = { t: 1_000_000 }; window.fakeNow = () => clock.t; });

const results = [];
const check = (name, ok, info = "") => { results.push(ok); console.log((ok ? "✓ " : "✗ ") + name + (info ? " — " + info : "")); };
const fresh = (opts = "") => page.evaluate(\`(() => { if (window.rep) window.rep.uninstall(); sent.length = 0; clock.t = 1_000_000; window.rep = installErrorReporter({ send: fakeSend, flushDelayMs: 20, now: fakeNow, \${opts} }); })()\`);
const throwAsync = (msg) => page.evaluate((m) => { setTimeout(() => { throw new Error(m); }, 0); return sleep(80); }, msg);

// 1. Ошибка выполнения
await fresh();
const prevented = await page.evaluate(() => new Promise((res) => { addEventListener("error", (e) => setTimeout(() => res(e.defaultPrevented)), { once: true }); setTimeout(() => { throw new RangeError("вне диапазона"); }, 0); }));
await page.evaluate(() => sleep(60));
let sent = await page.evaluate(() => sent);
check("ErrorEvent → отчёт с именем, сообщением, стеком; ошибка не подавлена", sent.length === 1 && sent[0].type === "error" && sent[0].name === "RangeError" && sent[0].message === "вне диапазона" && sent[0].stack.includes("at ") && prevented === false, JSON.stringify({ type: sent[0]?.type, name: sent[0]?.name, prevented }));

// 2. Отказы промисов
await fresh();
await page.evaluate(() => { Promise.reject(new TypeError("не тот тип")); Promise.reject("просто строка"); Promise.reject({ code: 7 }); return sleep(80); });
sent = await page.evaluate(() => sent);
check("unhandledrejection: Error → TypeError; строка и объект → NonError", sent.length === 3 && sent[0].name === "TypeError" && sent[1].name === "NonError" && sent[1].message === "просто строка" && sent[2].message === '{"code":7}' && sent.every((r) => r.type === "unhandledrejection"), JSON.stringify(sent.map((r) => [r.name, r.message])));

// 3. Ресурсы
await fresh();
await page.evaluate(() => { const i = new Image(); i.src = "/нет-такой-картинки.png"; document.body.append(i); return sleep(120); });
sent = await page.evaluate(() => sent);
check("ошибка загрузки изображения → type: resource, tag IMG", sent.length === 1 && sent[0].type === "resource" && sent[0].tag === "IMG" && sent[0].name === "ResourceError", JSON.stringify(sent[0] && { type: sent[0].type, tag: sent[0].tag }));

// 4. «Script error.» от чужого скрипта без CORS
await fresh();
await page.evaluate((u) => { const s = document.createElement("script"); s.src = u; document.body.append(s); return sleep(250); }, otherOrigin + "/third-party.js");
sent = await page.evaluate(() => sent);
check("чужой скрипт без CORS: opaque-отчёт ScriptError без стека", sent.length === 1 && sent[0].opaque === true && sent[0].name === "ScriptError" && sent[0].stack === "", JSON.stringify(sent[0] && { name: sent[0].name, opaque: sent[0].opaque }));

// 5. Дедупликация
await fresh("dedupeWindowMs: 10_000");
await page.evaluate(() => { for (let i = 0; i < 5; i++) rep.report(new Error("повторяется")); rep.report(new Error("другая")); return sleep(60); });
sent = await page.evaluate(() => sent); let stats = await page.evaluate(() => rep.stats());
check("дедупликация: 5 одинаковых → 1, другая — отдельно", sent.length === 2 && stats.suppressed === 4, JSON.stringify(stats));
await page.evaluate(() => { clock.t += 11_000; rep.report(new Error("повторяется")); return sleep(60); });
sent = await page.evaluate(() => sent);
check("после окна дедупликации тот же отчёт снова отправляется", sent.length === 3);

// 6. Ограничение частоты
await fresh("maxPerMinute: 3");
await page.evaluate(() => { for (let i = 0; i < 10; i++) rep.report(new Error("ошибка " + i)); return sleep(60); });
sent = await page.evaluate(() => sent); stats = await page.evaluate(() => rep.stats());
check("maxPerMinute = 3: отправлено 3, отброшено 7", sent.length === 3 && stats.dropped === 7, JSON.stringify(stats));
await page.evaluate(() => { clock.t += 61_000; rep.report(new Error("через минуту")); return sleep(60); });
sent = await page.evaluate(() => sent);
check("через минуту лимит освобождается", sent.length === 4);

// 7. Пакетная отправка
await fresh("flushDelayMs: 50");
await page.evaluate(() => { window.calls = 0; window.rep.uninstall(); window.rep = installErrorReporter({ send: (b) => { calls++; sent.push(...b); }, flushDelayMs: 50, now: fakeNow }); rep.report(new Error("а")); rep.report(new Error("б")); rep.report(new Error("в")); return sleep(120); });
check("три ошибки за окно → один вызов send с тремя отчётами", (await page.evaluate(() => calls)) === 1 && (await page.evaluate(() => sent.length)) === 3);

// 8. Цепочка cause и циклы
await fresh();
await page.evaluate(() => { const loop = new Error("петля"); loop.cause = loop; rep.report(new Error("внешняя", { cause: new TypeError("внутренняя", { cause: "строка" }) })); rep.report(loop); return sleep(60); });
sent = await page.evaluate(() => sent);
check("cause попадает в отчёт; цикл cause не зависает", sent.length === 2 && sent[0].cause.map((c) => c.name).join() === "TypeError,NonError" && sent[1].cause.length === 0, JSON.stringify(sent.map((r) => r.cause)));

// 9. Выборка
await fresh("sampleRate: 0.5, random: () => 0.9");
await page.evaluate(() => { rep.report(new Error("не попадёт")); return sleep(60); });
const dropped = await page.evaluate(() => sent.length);
await fresh("sampleRate: 0.5, random: () => 0.1");
await page.evaluate(() => { rep.report(new Error("попадёт")); return sleep(60); });
check("sampleRate: random 0.9 отбрасывает, 0.1 пропускает", dropped === 0 && (await page.evaluate(() => sent.length)) === 1);

// 10. Устойчивость репортёра
await fresh();
const failedThrow = await page.evaluate(async () => { rep.uninstall(); window.rep = installErrorReporter({ send: () => { throw new Error("транспорт упал"); }, flushDelayMs: 10, now: fakeNow }); rep.report(new Error("первая")); await sleep(60); const s = rep.stats(); rep.uninstall(); return s; });
const failedReject = await page.evaluate(async () => { window.rep = installErrorReporter({ send: () => Promise.reject(new Error("отказ транспорта")), flushDelayMs: 10, now: fakeNow }); rep.report(new Error("вторая")); await sleep(80); return rep.stats(); });
check("падение транспорта (throw и reject) не порождает новых отчётов и исключений", failedThrow.failed === 1 && failedThrow.captured === 1 && failedReject.failed === 1 && failedReject.captured === 1, JSON.stringify([failedThrow.failed, failedReject.failed]));

// 11. Контекст
await fresh("context: () => ({ route: '/cart', user: 42 })");
await page.evaluate(() => { rep.report(new Error("с контекстом")); return sleep(60); });
const withCtx = (await page.evaluate(() => sent))[0].context;
await fresh("context: () => { throw new Error('контекст упал'); }");
await page.evaluate(() => { rep.report(new Error("без контекста")); return sleep(60); });
const brokenCtx = await page.evaluate(() => sent);
check("context() добавляется к отчёту; упавший context не теряет отчёт", withCtx.route === "/cart" && withCtx.user === 42 && brokenCtx.length === 1 && Object.keys(brokenCtx[0].context).length === 0);

// 11b. Повторный вход
await fresh("context: () => { rep.report(new Error('из контекста')); return {}; }");
await page.evaluate(() => { rep.report(new Error("внешняя")); return sleep(60); });
sent = await page.evaluate(() => sent); stats = await page.evaluate(() => rep.stats());
check("report() внутри context() не уходит в рекурсию (повторный вход игнорируется)", sent.length === 1 && sent[0].message === "внешняя" && stats.captured === 1, JSON.stringify(stats));

// 12. uninstall
await fresh("flushDelayMs: 500");
await page.evaluate(() => { rep.report(new Error("в очереди")); rep.uninstall(); });
await throwAsync("после uninstall");
sent = await page.evaluate(() => sent);
check("uninstall(): очередь отправлена, новые ошибки не собираются", sent.length === 1 && sent[0].message === "в очереди", JSON.stringify(sent.map((r) => r.message)));

// 13. Реальный транспорт (fetch → сервер)
await page.evaluate(() => { if (window.rep) rep.uninstall(); window.rep = installErrorReporter({ endpoint: "/report", flushDelayMs: 20, context: () => ({ build: "1.2.3" }) }); rep.report(new Error("дошла до сервера")); return sleep(200); });
await page.waitForTimeout(150);
const got = received[0];
check("транспорт по умолчанию: POST JSON-массива на endpoint", got && got.ct === "application/json" && Array.isArray(got.body) && got.body[0].message === "дошла до сервера" && got.body[0].context.build === "1.2.3", got && JSON.stringify({ ct: got.ct, message: got.body[0]?.message }));

const failed = results.filter((x) => !x).length;
console.log(failed ? \`\\nПровалено: \${failed}\` : \`\\nВсе проверки пройдены: \${results.length}/\${results.length}\`);
await browser.close(); server.closeAllConnections?.(); server.close();
process.exit(failed ? 1 : 0);`, { filename: "error-reporter-test.mjs", collapsed: true }),
      code("text", `✓ ErrorEvent → отчёт с именем, сообщением, стеком; ошибка не подавлена — {"type":"error","name":"RangeError","prevented":false}
✓ unhandledrejection: Error → TypeError; строка и объект → NonError — [["TypeError","не тот тип"],["NonError","просто строка"],["NonError","{\\"code\\":7}"]]
✓ ошибка загрузки изображения → type: resource, tag IMG — {"type":"resource","tag":"IMG"}
✓ чужой скрипт без CORS: opaque-отчёт ScriptError без стека — {"name":"ScriptError","opaque":true}
✓ дедупликация: 5 одинаковых → 1, другая — отдельно — {"captured":6,"sent":2,"suppressed":4,"dropped":0,"sampledOut":0,"failed":0,"queued":0}
✓ после окна дедупликации тот же отчёт снова отправляется
✓ maxPerMinute = 3: отправлено 3, отброшено 7 — {"captured":10,"sent":3,"suppressed":0,"dropped":7,"sampledOut":0,"failed":0,"queued":0}
✓ через минуту лимит освобождается
✓ три ошибки за окно → один вызов send с тремя отчётами
✓ cause попадает в отчёт; цикл cause не зависает — [[{"name":"TypeError","message":"внутренняя"},{"name":"NonError","message":"строка"}],[]]
✓ sampleRate: random 0.9 отбрасывает, 0.1 пропускает
✓ падение транспорта (throw и reject) не порождает новых отчётов и исключений — [1,1]
✓ context() добавляется к отчёту; упавший context не теряет отчёт
✓ report() внутри context() не уходит в рекурсию (повторный вход игнорируется) — {"captured":1,"sent":1,"suppressed":0,"dropped":0,"sampledOut":0,"failed":0,"queued":0}
✓ uninstall(): очередь отправлена, новые ошибки не собираются — ["в очереди"]
✓ транспорт по умолчанию: POST JSON-массива на endpoint — {"ct":"application/json","message":"дошла до сервера"}

Все проверки пройдены: 16/16`, { filename: "результат запуска (Chromium 141 + локальный сервер)" }),
    ]),

    section("analysis", [
      table(
        ["Решение в репортёре", "Что даёт", "Что сломается без него (проверено мутацией теста)"],
        [
          ["`addEventListener(\"error\", …, { capture: true })`", "Видны и ошибки ресурсов (`<img>`, `<script>`)", "Без `capture` событие ресурса не приходит — тест `resource` падает"],
          ["Нормализация: `Error` → поля, не-`Error` → `NonError`", "Одинаковый формат для строк, объектов, `null`", "Отчёты с `undefined` и пустыми сообщениями"],
          ["Цепочка `cause` с ограничением глубины и защитой от циклов", "Видна причина без риска бесконечного цикла", "`e.cause = e` подвешивает репортёр"],
          ["Флаг `opaque` и имя `ScriptError` для «Script error.»", "Понятно, что деталей нет, а не «стек потерян»", "Бесполезные отчёты без пометки"],
          ["Дедупликация по отпечатку (`type|name|message|верхний кадр`)", "Один баг — один отчёт за окно", "Тысячи одинаковых запросов от одного цикла ошибок"],
          ["`maxPerMinute` по скользящему окну", "Защита сервера от лавины", "Лимит не действует — тест показывает 10 вместо 3"],
          ["Пакет и `flushDelayMs`; сброс на `pagehide`/`uninstall()`", "Меньше запросов; последние ошибки не теряются", "Последняя очередь теряется при закрытии вкладки"],
          ["`try/catch` вокруг транспорта и `Promise.catch`", "Падение отправки не порождает новых ошибок", "Исключение транспорта «всплывает» и снова попадает в репортёр"],
          ["Флаг `busy` вокруг `describe()`/конвейера", "Ошибки внутри `context()` не вызывают рекурсию", "`report()` внутри `context()` уходит в бесконечный цикл"],
          ["Не вызываем `preventDefault()`", "Пользователь и DevTools по-прежнему видят ошибку", "Скрытые ошибки в консоли"],
        ],
        "Разбор installErrorReporter",
      ),
      ul(
        "**Репортёр не должен быть источником ошибок:** все обращения к внешнему коду (`context`, транспорт) защищены.",
        "**Приватность:** не отправляйте персональные данные и токены в `message` и `context`; ограничивайте размер полей.",
        "**Выборка** (`sampleRate`) нужна при большом трафике; для критичных ошибок — 100%.",
      ),
    ]),

    section("internals", [
      h("Как работает `throw` и поиск обработчика"),
      steps(
        [
          ["Создание", "`new Error(...)` собирает «захват стека» — список кадров вызова на этот момент (до `Error.stackTraceLimit`). Текст `stack` форматируется лениво — при первом обращении."],
          ["Всплытие", "`throw` прерывает текущую функцию; движок раскручивает стек вызовов, ища ближайший `try` с `catch` или `finally`."],
          ["Выполнение `finally`", "На пути выполняются блоки `finally`; если в нём `return` или новый `throw`, прежнее завершение (значение или исключение) **заменяется**."],
          ["Асинхронный разрыв", "На границе макро- и микрозадач стек вызовов кончается: `try/catch` вокруг `setTimeout(...)` или вызова без `await` ничего не поймает."],
          ["Необработанная ошибка", "Если обработчика нет — в браузере `window.onerror`/`error`, в Node `uncaughtException` и завершение процесса."],
        ],
        "Путь исключения",
      ),
      h("Необработанные отказы Promise"),
      p("Отказ без обработчика отслеживается после микрозадач текущего «тика» (в браузере — `unhandledrejection` на `window`; в Node — событие `unhandledRejection`, а по умолчанию — завершение процесса с кодом `1`). Подписка на `catch` позже вызывает `rejectionhandled` (замер: `unhandledRejection → rejectionhandled`). Подробно — в теме про [Promise](/learn/js/promises) и [async/await](/learn/js/async-await-abort)."),
      h("Откуда берутся `lineno` и `colno`"),
      p("Движок хранит соответствие позиций байт-кода и исходного текста; для чужого скрипта без CORS браузер намеренно обнуляет эти данные (политика одного origin). Для собранного кода позиции указывают на минифицированный файл — поэтому нужны source maps."),
      h("Почему `JSON.stringify(error)` пуст"),
      p("`message`, `stack` и `cause` — собственные неперечисляемые свойства (`Object.keys(e)` — `[]`), а `JSON.stringify` берёт только перечисляемые собственные; `name` — унаследованное свойство прототипа. Поэтому сериализация — отдельная ответственность (`toJSON`, нормализация перед отправкой)."),
      h("Асинхронные стеки"),
      p("V8 связывает `await`-продолжения в «асинхронный стек» (`at async fn`), используя внутреннюю цепочку обещаний. Он работает для `await`, но не для колбэков таймеров и событий — там цепочка начинается заново."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Бросать не-`Error`"),
      wrongRight(
        "js",
        {
          code: `
            if (!user) throw "пользователь не найден";    // нет stack, нет name, instanceof Error — false
          `,
          note: "Замер: у брошенной строки `stack` — `undefined`; в логах только текст без места возникновения.",
        },
        {
          code: `
            if (!user) throw new NotFoundError("пользователь " + id);
          `,
          note: "Всегда `Error` или подкласс: есть стек, имя и возможность `instanceof`.",
        },
      ),
      h("Ошибка 2. Терять причину при оборачивании"),
      wrongRight(
        "js",
        {
          code: `
            try { await save(order); }
            catch (e) { throw new Error("Не удалось сохранить заказ"); }   // причина и стек потеряны
          `,
          note: "Остаётся только внешнее сообщение — первопричину не узнать.",
        },
        {
          code: `
            try { await save(order); }
            catch (e) { throw new Error("Не удалось сохранить заказ", { cause: e }); }
          `,
          note: "Цепочка `cause` сохраняет первопричину и её стек.",
        },
      ),
      h("Ошибка 3. «Проглатывание» исключений"),
      p("`catch {}` без действия скрывает баги. Либо обработайте (повторите, покажите, подставьте значение по умолчанию), либо пробросьте, либо запишите в лог."),
      h("Ошибка 4. `return` или `throw` в `finally`"),
      p("Замер: `return` в `finally` перекрыл исключение (`finally проглотил ошибку`). Очищайте ресурсы в `finally`, но не меняйте результат."),
      h("Ошибка 5. Ветвление по тексту сообщения"),
      p("`if (e.message.includes(\"Cannot read\"))` ломается при смене движка или версии. Используйте `name`, `instanceof`, `code`."),
      h("Ошибка 6. `try/catch` вокруг асинхронного вызова без `await`"),
      p("`try { setTimeout(() => { throw … }) } catch {}` ничего не ловит (замер: код выхода `1`, `try/catch отработал` до ошибки). Для `Promise` — `await` внутри `try` или `.catch`."),
      h("Ошибка 7. Сериализация ошибки целиком"),
      p("`JSON.stringify(error)` даёт `{}` (замер). Логируйте `name`, `message`, `stack`, `cause` явно или реализуйте `toJSON`."),
      h("Ошибка 8. Показывать пользователю технические сообщения"),
      p("Тексты движка и стек раскрывают внутреннее устройство и пугают. Пользователю — понятное сообщение и код обращения; технические данные — в лог."),
      h("Ошибка 9. Бесконтрольный сбор ошибок"),
      p("Без дедупликации и лимита один баг в цикле создаёт тысячи отчётов (тест: `maxPerMinute: 3` оставил 3 из 10, 7 отброшено). Репортёр не должен ловить собственные ошибки."),
      h("Ошибка 10. Глушить `unhandledrejection` и `uncaughtException`"),
      p("`preventDefault()` в `unhandledrejection` и `process.on(\"uncaughtException\")` без завершения процесса скрывают дефекты. Логируйте и завершайте процесс (для сервера — корректное завершение и перезапуск)."),
    ]),

    section("antipatterns", [
      ul(
        "**Пустой `catch`** и `catch (e) { console.log(e) }` как вся обработка.",
        "**«Pokemon exception handling»** — `try { … } catch (e) {}` вокруг всего кода.",
        "**Исключения как управление потоком** для ожидаемых ситуаций (поиск в массиве через `throw` внутри `forEach`).",
        "**Один общий класс `Error` на всё** — нельзя различить ожидаемые и неожиданные ошибки.",
        "**`process.on(\"uncaughtException\")`, продолжающий работу как ни в чём не бывало.**",
        "**Логирование без контекста:** «Ошибка» без идентификатора запроса, пользователя, версии.",
        "**Секреты в сообщениях и логах** (токены, пароли, персональные данные).",
        "**Отладка `console.log`-ом везде и забытые `debugger`/логи в продакшене.**",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Бросайте только `Error` и его подклассы;** имя задавайте в конструкторе, коды — для программной обработки.",
        "**Оборачивая, сохраняйте `cause`;** добавляйте контекст (что делали, с какими данными, без секретов).",
        "**Ловите там, где можете осмысленно обработать;** остальное пропускайте наверх, на границе приложения — единый обработчик.",
        "**Различайте ожидаемые и непредвиденные ошибки:** первые обрабатывайте, вторые логируйте и (на сервере) завершайте процесс или запрос.",
        "**Валидируйте входные данные на границах** и бросайте понятные `ValidationError` — fail fast.",
        "**`finally` — только для очистки;** без `return` и `throw`.",
        "**Собирайте необработанные ошибки** (`error`, `unhandledrejection`, ресурсы) с дедупликацией, лимитом и контекстом; настройте source maps.",
        "**Отладка по методу:** воспроизведение → минимальный пример → гипотеза → проверка (точка останова, `console.table`, тест) → исправление → регрессионный тест.",
      ),
      tip("Для подозрительного места поставьте условную точку останова вместо `console.log` в цикле, а для ошибок, которые «исчезают», включите Pause on caught exceptions — часто видно, где исключение создаётся и кто его проглатывает."),
    ]),

    section("edge-cases", [
      h("Ошибки в обработчиках событий"),
      p("Исключение в одном слушателе не мешает остальным (замер в теме про [DOM и события](/learn/js/dom-events)) и уходит в `window.onerror`. Не рассчитывайте, что `try/catch` вокруг `dispatchEvent` поймает ошибки слушателей — они не пробрасываются наружу."),
      h("`Error` из `iframe` и `instanceof`"),
      code("js", `import { execFileSync } from "node:child_process";
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";

// Node.js
console.log("Node.js 22: typeof Error.isError →", execFileSync(process.execPath, ["-p", "typeof Error.isError"], { encoding: "utf8" }).trim());
console.log("Node.js 22: кадров в стеке при --stack-trace-limit=100 (рекурсия 30) → ", execFileSync(process.execPath, ["--stack-trace-limit=100", "-p", "(function d(n) { return n === 0 ? new Error('x') : d(n - 1); })(30).stack.split('\\\\n').length - 1 > 30"], { encoding: "utf8" }).trim().replace("true", "больше 30"));

// Chromium
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const page = await b.newPage();
await page.setContent("<p>x</p>");
const r = await page.evaluate(() => {
  const frame = document.createElement("iframe"); document.body.append(frame);
  const e = new frame.contentWindow.Error("из iframe");
  return { isError: typeof Error.isError, captureStackTrace: typeof Error.captureStackTrace, instanceofError: e instanceof Error, tag: Object.prototype.toString.call(e), isErrorResult: Error.isError?.(e) };
});
console.log("Chromium 141: typeof Error.isError →", r.isError, "| typeof Error.captureStackTrace →", r.captureStackTrace);
console.log("ошибка из iframe: e instanceof Error →", r.instanceofError, "| Object.prototype.toString →", r.tag, "| Error.isError(e) →", r.isErrorResult);
await b.close();`, { filename: "run-er6-realm.mjs", collapsed: true }),
      code("text", `Node.js 22: typeof Error.isError → undefined
Node.js 22: кадров в стеке при --stack-trace-limit=100 (рекурсия 30) →  больше 30
Chromium 141: typeof Error.isError → function | typeof Error.captureStackTrace → function
ошибка из iframe: e instanceof Error → false | Object.prototype.toString → [object Error] | Error.isError(e) → true`, { filename: "замер в Node.js 22.22 и Chromium 141" }),
      p("Ошибка из другого окна или `iframe` — экземпляр `Error` **другого** глобального объекта: `e instanceof Error` вернёт `false`, хотя `Object.prototype.toString.call(e)` даёт `[object Error]`. В Chromium 141 есть `Error.isError(e)` (возвращает `true`), в Node.js 22.22 — нет, поэтому надёжная проверка — по `toString` или по наличию `name`/`message`."),
      h("Ошибки при разборе `JSON`"),
      p("`JSON.parse` бросает `SyntaxError` с позицией (`at position 1 (line 1 column 2)` в V8). Чаще всего это HTML-страница ошибки вместо JSON: проверяйте `response.ok` и `Content-Type` до разбора."),
      h("Стек при минификации"),
      p("Минифицированный код даёт `a.js:1:48210`; без source maps диагностика невозможна. Публикуйте карты в закрытое хранилище и подключайте их в инструмент сбора ошибок."),
      h("`unhandledrejection` и `await` в цикле"),
      p("Отказ, созданный заранее и ожидаемый позже (`const p = fetch(...); await other(); await p`), успевает стать «необработанным» (см. тему про [async/await](/learn/js/async-await-abort)). Подписывайтесь сразу или используйте `Promise.allSettled`."),
      h("`finally` и `await`"),
      p("`await` внутри `finally` допустим: исключение или `return` из `try` дожидаются завершения очистки. Ошибка в самой очистке заменит исходную — оборачивайте очистку в `try/catch` и логируйте."),
      h("`Error.captureStackTrace` нестандартен"),
      p("Это расширение V8 (в Node.js 22.22 и Chromium 141 — функция). Поддержка в других движках неоднородна — вызывайте с проверкой `Error.captureStackTrace?.(…)`."),
    ]),

    section("related", [
      ul(
        "[Promise](/learn/js/promises) — состояния, `AggregateError`, необработанные отказы.",
        "[async/await, отмена и AbortController](/learn/js/async-await-abort) — `try/catch/finally` в асинхронном коде, `return await`.",
        "[DOM и события](/learn/js/dom-events) — события `error`, исключения в слушателях.",
        "[Формы, FormData и fetch](/learn/js/forms-fetch) — HTTP-ошибки и CORS («Script error.»).",
        "[Цикл событий](/learn/js/event-loop) — почему `try/catch` не ловит ошибку из таймера.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Потерянная причина, проглоченная ошибка и разбор по тексту",
          code: `
            async function loadProfile(id) {
              try {
                const res = await fetch("/api/users/" + id);
                return await res.json();
              } catch (e) {
                if (e.message.includes("Failed to fetch")) return null;   // зависит от браузера
                console.log(e);                                           // и всё: ошибка потеряна
              } finally {
                return cache.get(id);                                     // перекроет всё выше
              }
            }
          `,
          note: "`finally` с `return` проглатывает ошибки, ветвление по тексту ломается между браузерами, причина не сохраняется, `res.ok` не проверяется.",
        },
        {
          title: "Типизированные ошибки, cause и очистка в finally",
          code: `
            async function loadProfile(id, { signal } = {}) {
              try {
                const res = await fetch("/api/users/" + id, { signal });
                if (res.status === 404) throw new NotFoundError("пользователь " + id);
                if (!res.ok) throw new HttpError(res.status);
                return await res.json();
              } catch (error) {
                if (error instanceof NotFoundError) return null;           // ожидаемо
                if (error.name === "AbortError") throw error;              // отмена — не ошибка
                throw new AppError("Не удалось загрузить профиль", { code: "PROFILE_LOAD", cause: error });
              } finally {
                spinner.hide();                                            // только очистка
              }
            }
          `,
          note: "Ожидаемое обрабатывается, отмена пробрасывается, остальное оборачивается с `cause`; `finally` ничего не возвращает.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.errors-debugging.ex1",
      title: "Что напечатает finally",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код (раздел «Минимальный пример»), запишите вывод и для каждой функции объясните роль `finally`."),
        code("js", `function a() {
  try { return "из try"; } finally { console.log("finally A"); }
}
function b() {
  try { throw new Error("E"); } catch (e) { return "catch " + e.message; } finally { return "из finally"; }
}
function c() {
  for (const i of [1, 2, 3]) {
    try { if (i === 2) continue; console.log("i =", i); } finally { console.log("очистка", i); }
  }
}
function d() {
  try {
    try { throw new Error("внутренняя"); } finally { console.log("внутренний finally"); }
  } catch (e) { return "поймано: " + e.message; }
}
console.log(a());
console.log(b());
c();
console.log(d());`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Когда выполняется `finally` относительно возврата значения?", "Что происходит с исключением, если `finally` содержит `return`?"],
      checks: ["Верный порядок строк", "Объяснён `return` в `finally`", "Объяснён `continue` и вложенный `finally`"],
      solution: [
        code("text", `finally A
из try
из finally
i = 1
очистка 1
очистка 2
i = 3
очистка 3
внутренний finally
поймано: внутренняя`, { filename: "вывод Node.js 22.22.0" }),
        p("`a()`: `finally A` печатается до возврата значения; `b()`: `return` из `finally` заменил и значение из `catch`, и (если бы оно было) исключение; `c()`: `finally` выполняется при `continue`; `d()`: внутренний `finally` отрабатывает, исключение продолжает подниматься и попадает во внешний `catch`."),
      ],
    }),
    exercise({
      id: "js.errors-debugging.ex2",
      title: "Читаем сообщение: кто здесь undefined",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Программа печатает разные сообщения для пользователей 2 и 3. По тексту ошибок определите, какое именно значение равно `undefined` в каждом случае, исправьте функцию так, чтобы она не падала на отсутствующих данных, а различала «пользователь не найден» и «нет профиля»."),
        code("js", `const users = new Map([
  [1, { name: "Анна", profile: { city: "Омск" } }],
  [2, { name: "Борис" }],
]);

function cityOf(id) {
  return users.get(id).profile.city.toUpperCase();
}

for (const id of [1, 2, 3]) {
  try {
    console.log(id, cityOf(id));
  } catch (e) {
    console.log(id, e.name + ":", e.message);
  }
}`, { filename: "x2-bug.mjs" }),
      ],
      hints: ["Что стоит слева от точки в тексте `reading 'city'` и `reading 'profile'`?", "Нужно ли превращать оба случая в одинаковый результат?"],
      checks: ["Для id=2 `undefined` — `profile`", "Для id=3 `undefined` — результат `users.get(3)`", "Исправление с явными проверками и разными ошибками/результатами"],
      solution: [
        code("text", `1 ОМСК
2 TypeError: Cannot read properties of undefined (reading 'city')
3 TypeError: Cannot read properties of undefined (reading 'profile')`, { filename: "вывод Node.js 22.22.0" }),
        code("js", `class NotFoundError extends Error { name = "NotFoundError"; }
function cityOf(id) {
  const user = users.get(id);
  if (!user) throw new NotFoundError("пользователь " + id);   // 3: нет такого пользователя
  return user.profile?.city?.toUpperCase() ?? null;            // 2: профиля нет — не ошибка, а отсутствие данных
}`, { filename: "исправление" }),
        p("`reading 'city'` — `undefined` стоит перед `.city`, то есть `profile` отсутствует (пользователь 2). `reading 'profile'` — `undefined` стоит перед `.profile`: пользователя нет в `Map` (пользователь 3). Исправление разделяет случаи: отсутствие пользователя — ошибка (`NotFoundError`), отсутствие профиля — допустимое «нет данных» (`null`), для которого используется `?.`."),
      ],
    }),
    exercise({
      id: "js.errors-debugging.ex3",
      title: "Иерархия ошибок приложения",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Реализуйте `AppError` (с `code`, `details`, `cause`), подклассы `NotFoundError` и `ValidationError`, функции `isAppError(value, code?)` и `wrap(error, message, ErrorClass?, options?)`. Требования: имя подкласса в `name` и в заголовке `stack`; `instanceof` на всех уровнях; `JSON.stringify` возвращает `name`, `code`, `message`, `details` и цепочку `cause`; `wrap` сохраняет первопричину."),
      ],
      hints: ["Как получить имя подкласса в конструкторе родителя?", "Как передать `cause` вторым аргументом `super`?", "Чем `JSON.stringify(error)` отличается от `JSON.stringify(error.toJSON())`?"],
      checks: ["`new.target.name` в конструкторе", "`toJSON()` с причиной", "Все 9 проверок теста проходят"],
      solution: [
        code("js", `// Иерархия ошибок приложения: код для программ, сообщение для людей, причина — для разбора.
export class AppError extends Error {
  constructor(message, { code = "APP_ERROR", cause, details } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = new.target.name;                   // имя подкласса, а не «Error»
    this.code = code;
    if (details !== undefined) this.details = details;
  }

  toJSON() {                                       // JSON.stringify(error) без этого вернул бы {}
    const json = { name: this.name, code: this.code, message: this.message };
    if (this.details !== undefined) json.details = this.details;
    if (this.cause !== undefined) json.cause = this.cause instanceof AppError ? this.cause.toJSON() : { name: this.cause?.name ?? "NonError", message: String(this.cause?.message ?? this.cause) };
    return json;
  }
}

export class NotFoundError extends AppError {
  constructor(what, options) { super(\`Не найдено: \${what}\`, { code: "NOT_FOUND", ...options }); }
}

export class ValidationError extends AppError {
  constructor(field, message, options) { super(message, { code: "VALIDATION", details: { field }, ...options }); }
}

export const isAppError = (value, code) => value instanceof AppError && (code === undefined || value.code === code);

// Оборачивает «низкоуровневую» ошибку, сохраняя причину
export function wrap(error, message, ErrorClass = AppError, options = {}) {
  return new ErrorClass(message, { ...options, cause: error });
}`, { filename: "app-error.mjs" }),
        code("text", `✓ имя класса — в name и в заголовке стека — NotFoundError: Не найдено: пользователь 7
✓ instanceof: NotFoundError, AppError, Error
✓ код и сообщение
✓ ValidationError: details.field и код VALIDATION
✓ wrap сохраняет причину и меняет код
✓ toJSON: JSON.stringify содержит имя, код, сообщение, детали и причину
✓ JSON.stringify(обычного Error) — пустой объект (мотивация toJSON)
✓ isAppError: по классу и по коду
✓ цепочка cause из трёх уровней

Все проверки пройдены: 9/9`, { filename: "результат запуска (Node.js 22.22.0)" }),
        p("`this.name = new.target.name` даёт имя подкласса, а заголовок `stack` в V8 формируется при первом обращении (поэтому имя, заданное сразу после `super`, попадает в заголовок). `toJSON()` превращает цепочку причин в простой объект, `isAppError` проверяет класс и, при необходимости, код, а `wrap` создаёт новую ошибку с `cause`. Проверено мутациями: без `new.target.name` падают 3 проверки, без передачи `cause` — 1, без `toJSON` — 1, с `instanceof Error` вместо `AppError` в `isAppError` — 1."),
      ],
    }),
  ],

  challenge: {
    id: "js.errors-debugging.challenge",
    title: "installErrorReporter: ошибки продакшена без лавины",
    scenario: [
      p("Команда не видит ошибки, которые происходят у пользователей. Вы подключаете сбор необработанных ошибок. Первая версия, «отправлять каждое событие `error`», при баге в цикле отправила 40 000 запросов за минуту и уронила приём. Напишите репортёр, который собирает ошибки аккуратно."),
    ],
    requirements: [
      "`installErrorReporter({ endpoint, send, sampleRate, random, maxPerMinute, dedupeWindowMs, flushDelayMs, context, now, target })` возвращает `{ report, flush, stats, uninstall }`",
      "Собирает `error` (в том числе ошибки ресурсов на фазе погружения), `unhandledrejection`; ошибки `Error` и не-`Error` (строки, объекты) приводятся к единому виду `{ type, name, message, stack, cause, url, ts, context }`; не-`Error` получают имя `NonError`",
      "«Script error.» без `error` и `filename` помечается `opaque: true`, имя `ScriptError`, стек пуст",
      "Цепочка `cause` включается (до 5 уровней, циклы не ломают сбор)",
      "Дедупликация по отпечатку в окне `dedupeWindowMs`; ограничение `maxPerMinute` по скользящему окну; выборка `sampleRate`",
      "Пакетная отправка: отчёты за `flushDelayMs` уходят одним вызовом `send(batch)`; `flush()` отправляет сразу; сброс при `pagehide`/`visibilitychange` и `uninstall()`",
      "Сбой транспорта (исключение или отказ) и сбой `context()` не порождают новых отчётов и исключений; повторный вход (`report()` внутри `context()`) игнорируется",
      "Не вызывает `preventDefault()`; транспорт по умолчанию — `fetch(endpoint, { method: \"POST\", keepalive: true })` с JSON-массивом",
    ],
    constraints: [
      "Без внешних библиотек; время и случайность внедряются параметрами (`now`, `random`) для тестов",
      "Не использовать глобальное состояние; `uninstall()` снимает все слушатели",
    ],
    acceptance: [
      "Все 16 проверок теста проходят в Chromium 141 (3 запуска подряд)",
      "Мутации — без `capture`, без дедупликации, без лимита, без `try/catch` транспорта, без защиты от повторного входа, без пометки `opaque`, без сброса при `uninstall()`, без защиты от циклов `cause`, без защиты `context()` — обнаруживаются тестом (красная проверка или зависание)",
    ],
    hints: [
      "Почему событие `error` ресурса не доходит до слушателя без `capture`?",
      "Что должен хранить дедупликатор: все отчёты или только отпечатки с временем?",
      "Что произойдёт, если ошибка возникнет внутри самого репортёра?",
    ],
    solution: [
      code("js", `// Сбор необработанных ошибок на странице: нормализация, дедупликация, ограничение частоты, пакетная отправка.
export function installErrorReporter({
  endpoint,
  send,                                   // (batch) => void | Promise; по умолчанию fetch(endpoint) с keepalive
  sampleRate = 1,
  random = Math.random,
  maxPerMinute = 10,
  dedupeWindowMs = 60_000,
  flushDelayMs = 200,
  context = () => ({}),
  now = Date.now,
  target = globalThis,
} = {}) {
  const lifetime = new AbortController();
  const lastSeen = new Map();             // fingerprint → время последней отправки
  const accepted = [];                    // метки времени принятых отчётов за последнюю минуту
  const queue = [];
  const stats = { captured: 0, sent: 0, suppressed: 0, dropped: 0, sampledOut: 0, failed: 0 };
  let timer = null;
  let busy = false;                       // защита от рекурсии: ошибки самого репортёра не репортим

  const deliver = send ?? ((batch) => fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(batch), keepalive: true }));

  function causeChain(error) {
    const chain = [];
    const seen = new Set([error]);
    for (let c = error?.cause; c && chain.length < 5 && !seen.has(c); c = c.cause) {
      seen.add(c);
      chain.push(c instanceof Error ? { name: c.name, message: c.message } : { name: "NonError", message: String(c) });
    }
    return chain;
  }

  function describe(type, value, extra = {}) {
    const base = value instanceof Error
      ? { name: value.name, message: value.message, stack: value.stack ?? "", cause: causeChain(value) }
      : { name: "NonError", message: typeof value === "string" ? value : safeString(value), stack: "", cause: [] };
    let ctx = {};
    try { ctx = context() ?? {}; } catch { /* контекст не должен ломать отчёт */ }
    return { type, ...base, ...extra, url: target.location?.href, ts: now(), context: ctx };
  }
  function safeString(v) { try { return typeof v === "object" && v !== null ? JSON.stringify(v) : String(v); } catch { return Object.prototype.toString.call(v); } }
  const fingerprint = (r) => [r.type, r.name, r.message, (r.stack.split("\\n")[1] ?? "").trim()].join("|");

  function capture(type, value, extra) {
    if (busy) return;                      // повторный вход (например, report() внутри context()) игнорируем
    busy = true;
    try {
      const report = describe(type, value, extra);
      stats.captured++;
      if (sampleRate < 1 && random() >= sampleRate) { stats.sampledOut++; return; }
      const key = fingerprint(report);
      const t = now();
      if (lastSeen.has(key) && t - lastSeen.get(key) < dedupeWindowMs) { stats.suppressed++; return; }
      while (accepted.length && t - accepted[0] >= 60_000) accepted.shift();
      if (accepted.length >= maxPerMinute) { stats.dropped++; return; }
      accepted.push(t);
      lastSeen.set(key, t);
      queue.push(report);
      timer ??= setTimeout(flush, flushDelayMs);
    } finally {
      busy = false;
    }
  }

  function flush() {
    clearTimeout(timer);
    timer = null;
    if (!queue.length) return;
    const batch = queue.splice(0);
    try {
      Promise.resolve(deliver(batch)).catch(() => { stats.failed++; });
      stats.sent += batch.length;
    } catch {
      stats.failed++;
    }
  }

  const on = (type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: lifetime.signal });
  on("error", (event) => {
    if (event.target && event.target !== target && event.target.tagName) {            // ошибка загрузки ресурса: событие не всплывает, ловим на погружении
      const el = event.target;
      capture("resource", new Error(\`Не загружен \${el.tagName.toLowerCase()}: \${el.currentSrc || el.src || el.href}\`), { name: "ResourceError", stack: "", tag: el.tagName });
      return;
    }
    const opaque = event.message === "Script error." && !event.error && !event.filename;   // чужой скрипт без CORS: деталей нет
    capture("error", event.error ?? new Error(event.message), opaque ? { name: "ScriptError", opaque: true, stack: "" } : {});
  }, { capture: true });
  on("unhandledrejection", (event) => capture("unhandledrejection", event.reason));
  on("pagehide", flush);
  on("visibilitychange", () => { if (target.document?.visibilityState === "hidden") flush(); });

  return {
    report: (error, extra) => capture("handled", error, extra),   // для обработанных, но важных ошибок
    flush,
    stats: () => ({ ...stats, queued: queue.length }),
    uninstall() { flush(); lifetime.abort(); },
  };
}`, { filename: "error-reporter.mjs", lineNumbers: true }),
      code("text", `✓ ErrorEvent → отчёт с именем, сообщением, стеком; ошибка не подавлена — {"type":"error","name":"RangeError","prevented":false}
✓ unhandledrejection: Error → TypeError; строка и объект → NonError — [["TypeError","не тот тип"],["NonError","просто строка"],["NonError","{\\"code\\":7}"]]
✓ ошибка загрузки изображения → type: resource, tag IMG — {"type":"resource","tag":"IMG"}
✓ чужой скрипт без CORS: opaque-отчёт ScriptError без стека — {"name":"ScriptError","opaque":true}
✓ дедупликация: 5 одинаковых → 1, другая — отдельно — {"captured":6,"sent":2,"suppressed":4,"dropped":0,"sampledOut":0,"failed":0,"queued":0}
✓ после окна дедупликации тот же отчёт снова отправляется
✓ maxPerMinute = 3: отправлено 3, отброшено 7 — {"captured":10,"sent":3,"suppressed":0,"dropped":7,"sampledOut":0,"failed":0,"queued":0}
✓ через минуту лимит освобождается
✓ три ошибки за окно → один вызов send с тремя отчётами
✓ cause попадает в отчёт; цикл cause не зависает — [[{"name":"TypeError","message":"внутренняя"},{"name":"NonError","message":"строка"}],[]]
✓ sampleRate: random 0.9 отбрасывает, 0.1 пропускает
✓ падение транспорта (throw и reject) не порождает новых отчётов и исключений — [1,1]
✓ context() добавляется к отчёту; упавший context не теряет отчёт
✓ report() внутри context() не уходит в рекурсию (повторный вход игнорируется) — {"captured":1,"sent":1,"suppressed":0,"dropped":0,"sampledOut":0,"failed":0,"queued":0}
✓ uninstall(): очередь отправлена, новые ошибки не собираются — ["в очереди"]
✓ транспорт по умолчанию: POST JSON-массива на endpoint — {"ct":"application/json","message":"дошла до сервера"}

Все проверки пройдены: 16/16`, { filename: "результат запуска (Chromium 141)" }),
      p("Конвейер `capture()` защищён флагом `busy`: внутри него нормализуется отчёт, применяются выборка, дедупликация и лимит, затем отчёт попадает в очередь, которую `flush()` отправляет пакетом с защитой от сбоев. Слушатели `error` на погружении, `unhandledrejection`, `pagehide` и `visibilitychange` подписаны с общим `signal`, поэтому `uninstall()` снимает их разом. Проверено мутациями: без `capture` падает проверка ресурсов, без дедупликации — 2, без лимита — 2, без защиты транспорта — 1, без защиты от повторного входа — 1, без `opaque` — 1, без сброса при `uninstall()` — 1; удаление защиты циклов `cause` подвешивает страницу."),
    ],
  },

  interview: [
    iq("js.errors-debugging.i1", "basic", "Какие бывают встроенные типы ошибок?", [
      ul(
        "`Error` (базовый), `TypeError` (неверный тип/значение, `undefined.x`), `RangeError` (вне диапазона, рекурсия), `ReferenceError` (нет переменной/TDZ), `SyntaxError` (в том числе `JSON.parse`), `URIError`, `EvalError`, `AggregateError` (`Promise.any`).",
        "У каждой есть `name`, `message`, `stack`; ветвить логику нужно по типу и `instanceof`, а не по тексту сообщения.",
      ),
    ]),
    iq("js.errors-debugging.i2", "basic", "Как работает `try/catch/finally`?", [
      ul(
        "`try` выполняет код; при исключении управление уходит в `catch` с объектом ошибки; `finally` выполняется всегда (и при `return`, `break`, `continue`).",
        "`return` или `throw` в `finally` заменяют результат `try`/`catch` и могут проглотить исключение.",
        "`try/catch` не ловит ошибки, возникшие позже в других макрозадачах (колбэки таймеров), и отказы без `await`.",
      ),
    ]),
    iq("js.errors-debugging.i3", "intermediate", "Как создать собственный класс ошибки и зачем нужен `cause`?", [
      ul(
        "`class AppError extends Error { constructor(msg, { code, cause } = {}) { super(msg, { cause }); this.name = new.target.name; this.code = code; } }`.",
        "`cause` сохраняет первопричину при оборачивании и позволяет восстановить цепочку «что случилось на каком уровне».",
        "`code` — для программной обработки, `message` — для людей; `toJSON` — для логирования.",
      ),
    ]),
    iq("js.errors-debugging.i4", "intermediate", "Почему `JSON.stringify(error)` возвращает `{}`?", [
      ul(
        "У `Error` свойства `message`, `stack`, `cause` неперечисляемые, `name` унаследован от прототипа.",
        "Решение: собрать объект вручную (`{ name, message, stack, cause }`) или реализовать `toJSON`.",
        "Для логов используйте структурированный формат с нормализацией ошибок.",
      ),
    ]),
    iq("js.errors-debugging.i5", "intermediate", "Что происходит с необработанным исключением в Node.js и в браузере?", [
      ul(
        "Node.js: событие `uncaughtException`, по умолчанию трассировка в `stderr` и завершение процесса с кодом `1`; необработанный отказ Promise — то же (с Node 15).",
        "Браузер: событие `error` на `window` (`window.onerror`), `unhandledrejection` для отказов; страница продолжает работать.",
        "Обработчики допустимы для логирования и корректного завершения, но не для «продолжения как ни в чём не бывало».",
      ),
    ]),
    iq("js.errors-debugging.i6", "advanced", "Что такое «Script error.» и как увидеть настоящую ошибку?", [
      ul(
        "Для скриптов с другого origin без разрешения CORS браузер скрывает детали ошибки: `message: \"Script error.\"`, нет `filename`/`lineno`/`error`.",
        "Решение: `<script crossorigin=\"anonymous\" src=\"…\">` и ответ сервера со `Access-Control-Allow-Origin`; тогда приходят `message`, `lineno`, `error`.",
        "В репортёре такие события помечают как `opaque`.",
      ),
    ]),
    iq("js.errors-debugging.i7", "engineering", "Как построить систему сбора ошибок для фронтенда?", [
      ul(
        "Сбор: `error` (с capture для ресурсов), `unhandledrejection`, ручной `report` для обработанных ошибок; нормализация (`name`, `message`, `stack`, `cause`, контекст: версия, маршрут, пользователь без секретов).",
        "Защита: дедупликация, лимит частоты, выборка, пакетная отправка и сброс при `pagehide` (`keepalive`/`sendBeacon`), защита от рекурсии.",
        "Читаемость: source maps, версия релиза, группировка по отпечатку.",
        "Реакция: алерты, приоритизация, связывание с релизами; тесты репортёра.",
      ),
    ]),
    iq("js.errors-debugging.i8", "debugging", "В продакшене стек `a.js:1:48210`, воспроизвести не удаётся. Что делать?", [
      ul(
        "Подключить source maps (в сборке и в системе сбора ошибок), сопоставить с исходниками.",
        "Добавить контекст в отчёт (маршрут, данные запроса без секретов, версия), собрать `cause`.",
        "Воспроизвести по сценарию из логов/сессии; написать регрессионный тест, затем исправить.",
        "Проверить, не «Script error.» ли это (CORS для скриптов) и не отказ ли без обработчика.",
      ),
    ]),
  ],

  exam: [
    mcq("js.errors-debugging.e1", "foundation", "Какой тип ошибки у `undefined.x`?", ["`ReferenceError`", "`RangeError`", "`TypeError`", "`SyntaxError`"], 2, "Обращение к свойству `undefined` — `TypeError: Cannot read properties of undefined (reading 'x')` (замер)."),
    mcq("js.errors-debugging.e2", "foundation", "Что вернёт `JSON.stringify(new Error(\"x\"))`?", ["`{}`", "`{\"message\":\"x\"}`", "`\"Error: x\"`", "Исключение"], 0, "Свойства `Error` неперечисляемые — результат `{}` (замер)."),
    mcq("js.errors-debugging.e3", "intermediate", "Что вернёт функция `() => { try { return 1; } finally { return 2; } }`?", ["`1`", "Исключение", "`undefined`", "`2`"], 3, "`return` в `finally` перекрывает значение из `try` (замер: `из finally`)."),
    mcq("js.errors-debugging.e4", "intermediate", "Что произойдёт при `try { setTimeout(() => { throw new Error(\"x\"); }, 0); } catch { … }` в Node.js?", ["`catch` поймает ошибку", "Процесс завершится с кодом `1`, `catch` не сработает", "Ошибка будет проигнорирована", "Выполнится только `finally`"], 1, "Исключение возникает позже, в другой макрозадаче (замер: код выхода `1`, `try/catch отработал`)."),
    mcq("js.errors-debugging.e5", "intermediate", "Что верно про `unhandledrejection` в браузере? Выберите все.", ["Событие отменяемо — `preventDefault()` убирает сообщение в консоли", "Содержит `reason` и `promise`", "Страница после него останавливается", "Если обработчик подписался позже, приходит `rejectionhandled`"], [0, 1, 3], "Замер: `cancelable: true`, поля `reason`/`promise`, затем `rejectionhandled`; страница продолжает работу."),
    mcq("js.errors-debugging.e6", "advanced", "Почему событие `error` для `<img>` не приходит в слушатель `window.addEventListener(\"error\", fn)`?", ["Оно приходит только в `document`", "Нужен `crossorigin`", "Браузер блокирует", "Событие не всплывает — нужен capture (`true`)"], 3, "Ошибки ресурсов — обычные `Event` без всплытия; слушатель на `window` получает их лишь на фазе погружения (замер)."),
    mcq("js.errors-debugging.e7", "advanced", "Что делает `Error.captureStackTrace(e, fn)` в V8?", ["Печатает стек в консоль", "Включает асинхронные стеки", "Перезаписывает `e.stack` без кадров от `fn` и выше", "Увеличивает `stackTraceLimit`"], 2, "Верхний кадр становится вызывающим `fn` (замер: вспомогательная `failHidden` исчезла из стека)."),
    open("js.errors-debugging.e8", "intermediate", "Объясните разницу между ожидаемыми ошибками и ошибками программиста и как обрабатывать каждые.", [
      ul(
        "Ожидаемые (операционные): нет сети, файл не найден, неверный ввод — обрабатываются (повтор, сообщение, значение по умолчанию), имеют собственные классы/коды.",
        "Ошибки программиста: `TypeError` из-за `undefined`, неверные аргументы — баги; их нужно исправлять, логировать и (в серверном процессе) завершать работу/запрос, а не маскировать.",
        "Граница: ловить там, где можно осмысленно отреагировать; остальное — наверх с `cause`; единый обработчик на границе приложения.",
      ),
    ], ["Названы оба типа", "Описана обработка каждого", "Упомянуты cause и единая граница"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.errors-debugging.m1", "intermediate", "Что лучше сделать в `catch`, если ошибка не ожидаема и вы не знаете, как её обработать?", ["Подавить и вернуть `null`", "Залогировать и пробросить с контекстом и `cause`", "Показать пользователю стек", "Вызвать `process.exit(0)`"], 1, "Неожиданные ошибки пробрасывают наверх с контекстом; пустой `catch` скрывает баги."),
    mcq("js.errors-debugging.m2", "advanced", "Почему `e instanceof Error` может быть `false` для настоящей ошибки?", ["Ошибка из другого `iframe`/окна — другой глобальный `Error`", "Для `TypeError` всегда `false`", "Если есть `cause`", "Если ошибку бросили в `async`-функции"], 0, "У каждого окна свой набор встроенных конструкторов; кросс-оконные ошибки лучше распознавать по `Object.prototype.toString`/`name`."),
    open("js.errors-debugging.m3", "advanced", "Вам сообщают: «Иногда приложение показывает пустую страницу, в консоли `TypeError: Cannot read properties of undefined (reading 'items')`». Опишите план диагностики и исправления.", [
      ul(
        "Прочитать сообщение: `undefined` стоит перед `.items` — какой объект ожидался (ответ API? состояние?). Найти в стеке первую строку своего кода.",
        "Воспроизвести: сетевые условия, пустые/ошибочные ответы, состояние гонки (ответ пришёл позже); записать минимальный сценарий.",
        "Проверить гипотезы: условная точка останова/`console.table` в месте обращения; смотреть реальные данные (Network, `response.ok`, `Content-Type`).",
        "Исправить причину (проверка `response.ok`, значения по умолчанию, защита от гонки), а не только поставить `?.`; добавить типизированную ошибку и тест.",
        "Включить сбор ошибок и source maps, чтобы подобные случаи были видны в продакшене.",
      ),
    ], ["Прочитано сообщение и найден кадр кода", "Назван способ воспроизведения", "Исправлена причина, а не симптом", "Добавлены тест и сбор ошибок"], { format: "debug" }),
    open("js.errors-debugging.m4", "advanced", "Спроектируйте стратегию обработки ошибок для SPA с API: слои, пользовательские сообщения, логирование и повторные попытки.", [
      ul(
        "Слой запросов: `HttpError`/`NetworkError`/`TimeoutError`/`AbortError`, проверка `response.ok`, повторы только идемпотентных запросов с задержкой.",
        "Слой приложения: `AppError` с `code`; соответствие кодов и пользовательских сообщений; `cause` сохраняется.",
        "Интерфейс: граница ошибок (`error boundary` или общий обработчик), понятные сообщения и действия («повторить»), отмена не показывается.",
        "Наблюдаемость: единый репортёр (`error`, `unhandledrejection`, ресурсы) с дедупликацией, лимитом, контекстом, source maps; связывание с релизом.",
        "Тесты: сценарии отказов, таймаутов, `422`, потери сети, отмены.",
      ),
    ], ["Описаны слои и типизированные ошибки", "Описаны сообщения пользователю и повторы", "Описан сбор ошибок", "Описаны тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.errors-debugging.f1", front: "Анатомия Error?", back: "name, message, stack, cause; ключей нет (Object.keys → []), поэтому JSON.stringify(e) → {}; сериализуйте вручную или toJSON." },
    { id: "js.errors-debugging.f2", front: "Читать сообщение?", back: "«Cannot read properties of undefined (reading 'x')» — undefined стоит ПЕРЕД .x; «is not a function» — свойство не функция; «before initialization» — TDZ. Тексты зависят от движка." },
    { id: "js.errors-debugging.f3", front: "finally?", back: "Выполняется всегда; return/throw в finally заменяют результат и проглатывают исключение. Только очистка." },
    { id: "js.errors-debugging.f4", front: "Необработанное в Node?", back: "uncaughtException / unhandledRejection → код выхода 1; try/catch не ловит ошибки из таймеров; --unhandled-rejections=warn маскирует баги." },
    { id: "js.errors-debugging.f5", front: "Ошибки в браузере?", back: "window.onerror(message, source, lineno, colno, error), unhandledrejection (reason, promise), ресурсы — только capture; чужой скрипт без CORS → «Script error.»." },
    { id: "js.errors-debugging.f6", front: "Стек?", back: "stackTraceLimit=10; at async для await; таймер обрывает цепочку; captureStackTrace(e, fn) скрывает fn (V8); имена функций делают стек читаемым." },
    { id: "js.errors-debugging.f7", front: "cause?", back: "new Error(msg, { cause }) — сохраняйте при оборачивании; AggregateError — errors[]; цепочку ограничивайте и защищайте от циклов." },
    { id: "js.errors-debugging.f8", front: "Репортёр ошибок?", back: "Нормализация, дедупликация, лимит, пакеты, pagehide-flush, защита от рекурсии и сбоев транспорта, не подавлять ошибку, source maps." },
  ],

  sources: [
    { title: "ECMAScript: Error Objects", url: "https://tc39.es/ecma262/#sec-error-objects", publisher: "ECMA" },
    { title: "ECMAScript: The try Statement", url: "https://tc39.es/ecma262/#sec-try-statement", publisher: "ECMA" },
    { title: "HTML Standard: Runtime script errors", url: "https://html.spec.whatwg.org/multipage/webappapis.html#runtime-script-errors", publisher: "WHATWG" },
    { title: "HTML Standard: Unhandled promise rejections", url: "https://html.spec.whatwg.org/multipage/webappapis.html#unhandled-promise-rejections", publisher: "WHATWG" },
    { title: "MDN: Error", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error", publisher: "MDN" },
    { title: "MDN: Error: cause", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause", publisher: "MDN" },
    { title: "MDN: try...catch", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch", publisher: "MDN" },
    { title: "MDN: Window: unhandledrejection event", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event", publisher: "MDN" },
    { title: "MDN: ErrorEvent", url: "https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent", publisher: "MDN" },
    { title: "MDN: Error.captureStackTrace()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/captureStackTrace", publisher: "MDN" },
    { title: "V8: Stack trace API", url: "https://v8.dev/docs/stack-trace-api", publisher: "Other" },
    { title: "Node.js: process — uncaughtException и unhandledRejection", url: "https://nodejs.org/api/process.html#event-uncaughtexception", publisher: "Other" },
    { title: "Chrome DevTools: JavaScript debugging", url: "https://developer.chrome.com/docs/devtools/javascript", publisher: "Other" },
  ],
};
