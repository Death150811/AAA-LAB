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

export const promises: Topic = {
  id: "js.promises",
  slug: "promises",
  domain: "js",
  module: "async",
  title: "Promise",
  titleEn: "Promises",
  summary:
    "`Promise` — объект, представляющий результат операции, которого ещё нет: он ожидает (`pending`), выполняется (`fulfilled`) или отклоняется (`rejected`), и состояние меняется **один раз**. Метод `then` возвращает **новое** обещание, что даёт цепочки: значение идёт вперёд, исключение превращается в отказ и «перепрыгивает» через `then` до ближайшего `catch`, `finally` не меняет результат. Тема на замерах в Node.js 22 и Chromium 141 разбирает цепочки и их порядок в очереди микрозадач (возврат обещания из `then` стоит двух лишних «раундов»), `Promise.all`/`allSettled`/`race`/`any`, `AggregateError`, необработанные отказы (процесс Node.js завершается с кодом 1, браузер генерирует `unhandledrejection`), типичные ошибки (забытый `return`, проглоченные ошибки, `then(a, b)`), таймаут и повтор (`retry`, `withTimeout`), ограничение параллелизма (`mapLimit`) и собственные `Promise.all`/`any`.",
  minutes: 90,
  prerequisites: ["js.event-loop", "js.closures"],
  tags: ["Promise", "then", "catch", "finally", "Promise.all", "Promise.allSettled", "Promise.race", "Promise.any", "AggregateError", "unhandled rejection", "thenable", "withResolvers", "retry", "timeout", "concurrency", "microtask"],
  keyConcepts: [
    { term: "Три состояния, один переход", text: "`pending` → `fulfilled` или `rejected`, и всё: повторные `resolve`/`reject` игнорируются (замер: после `resolve(\"значение\")` обещание осталось выполненным). Выполненное обещание можно ждать сколько угодно раз." },
    { term: "`then` возвращает новое обещание", text: "Результат обработчика становится значением следующего: `x + 1`, затем `x * 10`; «забытый `return`» даёт `undefined` (замер); возвращённое обещание «разворачивается» (`101`)." },
    { term: "Исключение = отказ", text: "`throw` в `then` отклоняет обещание цепочки; следующие `then` пропускаются до ближайшего `catch`; `catch` возвращает значение — цепочка снова успешна; `finally` пропускает значение и ошибку насквозь." },
    { term: "Необработанный отказ — ошибка", text: "В Node.js 22 необработанный отказ завершает процесс с кодом `1` (`Error: никто не поймал`), для не-ошибки — `ERR_UNHANDLED_REJECTION`; в браузере — событие `unhandledrejection` (и `rejectionhandled`, если обработчик добавили позже)." },
    { term: "Параллелизм — выбор программиста", text: "Три «запроса» по 100 мс: `await` в цикле — около 300 мс, `Promise.all` — около 100 мс; `Promise.all` отклоняется на первом отказе, но не отменяет остальные операции (медленная всё равно завершилась)." },
  ],
  sections: [
    section("definition", [
      def("`Promise` (обещание)", "Объект-заместитель значения, которое будет получено позже: ожидает, выполняется со значением или отклоняется с причиной. Подписка — через `then`, `catch`, `finally`.", "Promise"),
      def("Состояния", "`pending` (ожидает), `fulfilled` (выполнено), `rejected` (отклонено). Выполненное или отклонённое обещание называют «завершённым» (settled) и больше не меняется.", "pending / fulfilled / rejected"),
      def("Исполнитель (executor)", "Функция `(resolve, reject) => …`, передаваемая в `new Promise`: вызывается **синхронно** при создании; `resolve`/`reject` можно вызвать позже и откуда угодно.", "executor"),
      def("Цепочка (chaining)", "Последовательность вызовов `then`/`catch`/`finally`: каждый возвращает новое обещание, значение которого определяется результатом обработчика.", "promise chain"),
      def("Thenable", "Любой объект с методом `then`: `Promise.resolve` и `await` «разворачивают» его так же, как настоящее обещание.", "thenable"),
      def("Комбинаторы", "`Promise.all` (все успешны), `allSettled` (все завершены), `race` (первый завершившийся), `any` (первый успешный).", "Promise combinators"),
      def("`AggregateError`", "Ошибка с массивом `errors`: причина отказа `Promise.any`, когда отклонились все обещания.", "AggregateError"),
      def("Необработанный отказ", "Отклонённое обещание, у которого к моменту проверки среды нет обработчика отказа; считается ошибкой программы.", "unhandled rejection"),
    ]),

    section("why", [
      h("Обещания — основа современной асинхронности"),
      p("Запросы к серверу, чтение файлов, таймеры, анимации, загрузка модулей — всё асинхронное в современном JavaScript возвращает `Promise`; `async/await` — синтаксис поверх него. Если вы не понимаете, как работают цепочки, порядок выполнения и обработка ошибок, код «иногда работает»: теряются ошибки, запросы идут по очереди вместо параллельных, `forEach` «не ждёт», в консоли — таинственные «Uncaught (in promise)»."),
      ul(
        "**Композиция:** `all`, `race`, `any` строят сложные сценарии (параллельные запросы, таймауты, резервные источники) из простых операций.",
        "**Обработка ошибок:** единая модель отказов вместо вложенных колбэков с ошибкой первым аргументом.",
        "**Предсказуемость:** обещание завершается один раз и всегда асинхронно доставляет результат (микрозадача).",
        "**Диагностика:** понимание необработанных отказов и забытого `return` экономит часы отладки.",
      ),
      insight("`Promise` — это **договорённость о доставке результата**: «когда значение появится (или операция упадёт), я вызову ваш обработчик ровно один раз и асинхронно». Цепочка — это конвейер таких договорённостей."),
    ]),

    section("mental-model", [
      p("Представьте **талон в очереди на получение посылки**. Вы получили талон сразу (обещание — `pending`), а посылку получите позже. В итоге произойдёт **одно из двух** — посылку выдали (`fulfilled`, значение) или сообщили, что её нет (`rejected`, причина), — и результат **не изменится**, сколько бы раз вы ни спрашивали. Вы оставляете инструкцию «когда выдадут, сделайте вот это» (`then`) — и получаете **новый талон** на результат этой инструкции; поэтому инструкции выстраиваются в цепочку. Если на шаге случилась беда, все последующие «обычные» инструкции пропускаются, пока не встретится инструкция «если беда, сделайте …» (`catch`). И **всегда** результат доставляется не мгновенно, а в ближайшую «почтовую раздачу» — микрозадачу."),
      table(
        ["Метод", "Когда вызывается обработчик", "Что вернёт новое обещание"],
        [
          ["`then(onFulfilled)`", "При выполнении", "Результат обработчика; исключение → отказ; отказ предыдущего проходит насквозь"],
          ["`then(onFulfilled, onRejected)`", "При выполнении / при отказе", "Результат вызванного обработчика (`onRejected` не ловит ошибки из `onFulfilled` этого же `then`)"],
          ["`catch(onRejected)`", "При отказе", "Результат обработчика (значение «лечит» цепочку); исключение → новый отказ"],
          ["`finally(fn)`", "В любом случае, без аргументов", "То же значение или причина, что у исходного (если `fn` не бросил)"],
          ["`Promise.resolve(x)` / `Promise.reject(e)`", "—", "Выполненное / отклонённое обещание (`resolve` возвращает тот же объект, если `x` — обещание)"],
        ],
        "Методы обещания",
      ),
    ]),

    section("technical", [
      h("Создание, состояния, цепочки"),
      code("js", `const log = (...a) => console.log(...a);

// состояния и исполнитель
const p = new Promise((resolve, reject) => {
  log("исполнитель выполняется синхронно");
  resolve("значение");
  resolve("игнорируется");             // состояние меняется один раз
  reject(new Error("игнорируется"));
});
log("после создания:", p);
log(await p, await p);                   // уже выполненное обещание можно ждать сколько угодно раз

const pending = new Promise(() => {});
const rejected = Promise.reject(new Error("отказ"));
rejected.catch(() => {});                // обработали, чтобы не было необработанного отказа
log(pending, (await Promise.allSettled([rejected]))[0].status);

// then возвращает НОВОЕ обещание; значение идёт по цепочке
const chain = await Promise.resolve(1)
  .then((x) => x + 1)
  .then((x) => { log("получено", x); return x * 10; })
  .then(() => { /* забыли return */ })
  .then((x) => x);
log("после «забытого return»:", chain);

// возвращённое обещание «разворачивается»
log(await Promise.resolve(1).then((x) => Promise.resolve(x + 100)));

// исключение в then превращается в отказ и «перепрыгивает» через then до catch
const res = await Promise.resolve()
  .then(() => { throw new TypeError("упало"); })
  .then(() => log("не выполнится"))
  .catch((e) => \`поймано: \${e.name}: \${e.message}\`)
  .then((v) => \`catch вернул значение, цепочка продолжается: \${v}\`);
log(res);

// finally: не получает значения, не меняет результат, но пропускает ошибку дальше
log(await Promise.resolve("A").finally(() => "игнорируется"));
try { await Promise.reject(new Error("B")).finally(() => log("finally выполнен")); } catch (e) { log("ошибка прошла через finally:", e.message); }

// then(onFulfilled, onRejected) и then().catch() — разное
const failing = () => Promise.resolve().then(() => { throw new Error("в успешной ветке"); });
await failing().then(() => {}, () => log("не сработает: второй аргумент не ловит ошибки первого")).catch((e) => log("поймал catch:", e.message));`, { filename: "pr1-basics.mjs", lineNumbers: true }),
      code("text", `исполнитель выполняется синхронно
после создания: Promise { 'значение' }
значение значение
Promise { <pending> } rejected
получено 2
после «забытого return»: undefined
101
catch вернул значение, цепочка продолжается: поймано: TypeError: упало
A
finally выполнен
ошибка прошла через finally: B
не сработает: второй аргумент не ловит ошибки первого`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Исполнитель синхронен:** сообщение «исполнитель выполняется синхронно» напечатано до выхода из `new Promise`. Первый вызов `resolve` побеждает, остальные игнорируются; `Promise { 'значение' }` — уже выполненное; `Promise { <pending> }` никогда не завершится.",
        "**Значение идёт вперёд:** `1` → `2` → `20`; обработчик **без `return`** вернул `undefined` (замер: `после «забытого return»: undefined`).",
        "**Разворачивание:** обработчик, вернувший обещание, подставляет его результат (`101`).",
        "**Исключение превращается в отказ** и пропускает «успешные» `then` до `catch`; `catch`, вернувший значение, «лечит» цепочку: следующий `then` снова выполняется.",
        "**`finally`** не получает значения и не меняет результат (`A` прошло насквозь), но пропускает и ошибку (`B`).",
        "**`then(a, b)` против `then(a).catch(b)`:** второй аргумент `then` **не ловит** ошибки из `a` того же вызова; поймал только отдельный `catch`.",
      ),

      h("Порядок в очереди микрозадач"),
      code("js", `const log = [];
const out = (x) => log.push(x);

// две независимые цепочки идут «вперемешку»: по одному then за раунд микрозадач
Promise.resolve().then(() => out("a1")).then(() => out("a2")).then(() => out("a3"));
Promise.resolve().then(() => out("b1")).then(() => out("b2")).then(() => out("b3"));

// возврат обещания из then стоит ещё «раундов»
Promise.resolve().then(() => Promise.resolve()).then(() => out("c (после then, вернувшего обещание)"));
Promise.resolve().then(() => 1).then(() => 2).then(() => 3).then(() => out("d (три обычных then)"));

// Promise.resolve(p) возвращает тот же объект; new Promise — нет
const p = Promise.resolve(1);
out(\`Promise.resolve(p) === p: \${Promise.resolve(p) === p}; new Promise(r => r(p)) === p: \${new Promise((r) => r(p)) === p}\`);

// thenable разворачивается тоже
const thenable = { then(resolve) { out("  then() у thenable вызван"); resolve("из thenable"); } };
Promise.resolve(thenable).then((v) => out("  значение: " + v));
out("синхронный код закончен");

setTimeout(() => console.log(log.join("\\n")), 10);`, { filename: "pr2-order.mjs", lineNumbers: true }),
      code("text", `Promise.resolve(p) === p: true; new Promise(r => r(p)) === p: false
синхронный код закончен
a1
b1
  then() у thenable вызван
a2
b2
  значение: из thenable
a3
b3
c (после then, вернувшего обещание)
d (три обычных then)`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Цепочки чередуются:** `a1 b1 a2 b2 a3 b3` — каждый `then` отдаёт следующий в **конец** очереди микрозадач, поэтому независимые цепочки идут «вперемешку».",
        "**Возврат обещания из `then` стоит двух дополнительных раундов:** `c` (после `then`, вернувшего обещание) оказался позже `a3`/`b3`, тогда как обычная цепочка из четырёх `then` (`d`) пришла в тот же раунд.",
        "**`Promise.resolve(p) === p`** — тот же объект; `new Promise(r => r(p))` — новое обещание, повторяющее состояние `p`.",
        "**Thenable** разворачивается асинхронно: метод `then` у объекта вызван в микрозадаче (после `b1`), а не сразу.",
        "**Вывод:** не стройте логику на точном числе «раундов». Закладывайтесь только на то, что колбэки выполнятся после синхронного кода и в порядке подписки на одно обещание.",
      ),

      h("Комбинаторы: `all`, `allSettled`, `race`, `any`"),
      code("js", `const sleep = (ms, value, fail = false) => new Promise((resolve, reject) => setTimeout(() => (fail ? reject(new Error(value)) : resolve(value)), ms));
const show = async (label, promise) => {
  try { console.log(label.padEnd(24), "→", JSON.stringify(await promise)); }
  catch (e) { console.log(label.padEnd(24), "→ отказ:", e.constructor.name, e.message, e.errors ? JSON.stringify(e.errors.map((x) => x.message)) : ""); }
};

await show("all: все успешны", Promise.all([sleep(30, "A"), sleep(10, "B"), 3]));              // порядок результатов — как в массиве
await show("all: один отказал", Promise.all([sleep(10, "A"), sleep(20, "сбой B", true), sleep(30, "C")]));
await show("allSettled", Promise.allSettled([sleep(10, "A"), sleep(10, "сбой B", true)]).then((r) => r.map((x) => x.status + ":" + (x.value ?? x.reason.message))));
await show("race: победил быстрый", Promise.race([sleep(30, "медленный"), sleep(10, "быстрый")]));
await show("race: быстрый отказ", Promise.race([sleep(30, "медленный"), sleep(10, "отказ", true)]));
await show("any: первый успешный", Promise.any([sleep(10, "сбой 1", true), sleep(20, "успех"), sleep(30, "позже")]));
await show("any: все отказали", Promise.any([sleep(10, "сбой 1", true), sleep(20, "сбой 2", true)]));

// пустые массивы
console.log("пустые:", await Promise.all([]), await Promise.allSettled([]));
const hang = Promise.race([]);
console.log("race([]) навсегда pending:", await Promise.race([hang, sleep(20, "таймаут")]));
try { await Promise.any([]); } catch (e) { console.log("any([]):", e.constructor.name, e.errors.length); }

// «Promise.all отказал, остальные продолжили работу»
const finished = [];
const slow = sleep(30).then(() => finished.push("медленная операция завершилась"));
await Promise.all([slow, sleep(5, "сбой", true)]).catch((e) => console.log("all отказал сразу:", e.message, "| завершённых к этому моменту:", finished.length));
await slow;
console.log("но отменить медленную операцию all не может:", finished);

// запуск параллельно и последовательно
const t0 = performance.now();
await Promise.all([sleep(50), sleep(50), sleep(50)]);
const parallel = performance.now() - t0;
const t1 = performance.now();
for (const _ of [1, 2, 3]) await sleep(50);
const sequential = performance.now() - t1;
console.log("параллельно ≈ 50 мс (меньше 100):", parallel < 100, "| последовательно ≈ 150 мс (больше 140):", sequential > 140);`, { filename: "pr3-combinators.mjs", lineNumbers: true }),
      code("text", `all: все успешны         → ["A","B",3]
all: один отказал        → отказ: Error сбой B 
allSettled               → ["fulfilled:A","rejected:сбой B"]
race: победил быстрый    → "быстрый"
race: быстрый отказ      → отказ: Error отказ 
any: первый успешный     → "успех"
any: все отказали        → отказ: AggregateError All promises were rejected ["сбой 1","сбой 2"]
пустые: [] []
race([]) навсегда pending: таймаут
any([]): AggregateError 0
all отказал сразу: сбой | завершённых к этому моменту: 0
но отменить медленную операцию all не может: [ 'медленная операция завершилась' ]
параллельно ≈ 50 мс (меньше 100): true | последовательно ≈ 150 мс (больше 140): true`, { filename: "вывод Node.js 22.22.0" }),
      table(
        ["Комбинатор", "Результат при успехе", "Отказ", "Пустой массив"],
        [
          ["`Promise.all`", "Массив значений в порядке ввода (не завершения); не-обещания допустимы", "Первый отказ (остальные не отменяются)", "Сразу `[]`"],
          ["`Promise.allSettled`", "Массив `{ status, value | reason }` для каждого", "Никогда не отклоняется", "Сразу `[]`"],
          ["`Promise.race`", "Значение первого завершившегося", "Отказ первого завершившегося", "Вечно `pending`"],
          ["`Promise.any`", "Значение первого **успешного**", "`AggregateError` с `errors`, когда отклонены все", "`AggregateError` с пустым `errors`"],
        ],
        "Комбинаторы обещаний",
      ),
      ul(
        "**`all`** вернул `[\"A\", \"B\", 3]` независимо от скорости операций; при одном отказе — сразу ошибка (`сбой B`), но медленная операция всё равно завершилась позже (`all` ничего не отменяет — нужен `AbortController`, см. следующую тему).",
        "**`allSettled`** — когда нужны результаты всех (`fulfilled:A`, `rejected:сбой B`).",
        "**`race`** — таймауты и «кто быстрее»: побеждает **первое завершение**, в том числе отказ (`race: быстрый отказ`).",
        "**`any`** — резервные источники: первый успех; если все отказали — `AggregateError: All promises were rejected` с `errors: ['сбой 1', 'сбой 2']`.",
        "**Время:** три операции по 50 мс параллельно — ≈ 50 мс (меньше 100), последовательно — ≈ 150 мс (больше 140).",
      ),
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Обещания: параллельно и по очереди</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 38rem; }
  button { font: inherit; padding: .35rem .9rem; margin: 0 .5rem .5rem 0; }
  pre { background: #8881; padding: .75rem; border-radius: 6px; min-height: 8rem; white-space: pre-wrap; }
  label { display: inline-block; margin-right: 1rem; }
</style>
<h1>Три «запроса»</h1>
<p>
  <label><input type="checkbox" id="fail"> второй запрос завершится ошибкой</label>
</p>
<p>
  <button id="seq">По очереди (await в цикле)</button>
  <button id="all">Параллельно (Promise.all)</button>
  <button id="settled">Параллельно (allSettled)</button>
  <button id="timeout">С таймаутом 50 мс (race)</button>
</p>
<pre id="log" aria-live="polite"></pre>
<script type="module">
  const log = document.querySelector("#log");
  const fail = document.querySelector("#fail");
  const print = (text) => { log.textContent += text + "\\n"; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // «запрос»: возвращает обещание, готовится 100 мс; второй может завершиться ошибкой
  const request = async (n) => {
    await sleep(100);
    if (n === 2 && fail.checked) throw new Error(\`запрос \${n} не удался\`);
    return \`ответ \${n}\`;
  };
  const run = async (title, fn) => {
    log.textContent = title + "\\n";
    const t0 = performance.now();
    try { await fn(); } catch (error) { print("Ошибка: " + error.message); }
    print(\`Время: около \${Math.round((performance.now() - t0) / 50) * 50} мс\`);
  };

  document.querySelector("#seq").addEventListener("click", () => run("По очереди:", async () => {
    for (const n of [1, 2, 3]) print(await request(n));              // следующий запрос стартует после предыдущего
  }));
  document.querySelector("#all").addEventListener("click", () => run("Promise.all:", async () => {
    print((await Promise.all([1, 2, 3].map(request))).join(", "));   // все стартуют сразу; первый отказ отклоняет всё
  }));
  document.querySelector("#settled").addEventListener("click", () => run("Promise.allSettled:", async () => {
    const results = await Promise.allSettled([1, 2, 3].map(request));
    for (const r of results) print(r.status === "fulfilled" ? r.value : "отказ: " + r.reason.message);
  }));
  document.querySelector("#timeout").addEventListener("click", () => run("race с таймаутом 50 мс:", async () => {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("таймаут 50 мс")), 50));
    print(await Promise.race([request(1), timeout]));
  }));
</script>`, { filename: "pr-lab.html", runnable: true, lineNumbers: true }),
      p("Замер в Chromium 141 для трёх «запросов» по 100 мс: «По очереди» — около 300 мс; `Promise.all` — около 100 мс; `Promise.all` с ошибкой второго запроса — сразу «Ошибка: запрос 2 не удался» (около 100 мс); `allSettled` — `ответ 1`, `отказ: запрос 2 не удался`, `ответ 3`; `race` с таймаутом 50 мс — «Ошибка: таймаут 50 мс». Ошибок страницы нет."),

      h("Необработанные отказы"),
      code("js", `import { spawnSync } from "node:child_process";

const run = (code, args = []) => {
  const r = spawnSync(process.execPath, [...args, "-e", code], { encoding: "utf8" });
  return { status: r.status, error: (r.stderr.split("\\n").find((l) => /^(Error|TypeError|UnhandledPromiseRejection)/.test(l)) ?? "").slice(0, 60), out: r.stdout.trim() };
};

console.log("необработанный отказ:", JSON.stringify(run('Promise.reject(new Error("никто не поймал")); setTimeout(() => console.log("таймер"), 50);')));
console.log("обработанный позже, но в той же микрозадаче:", JSON.stringify(run('const p = Promise.reject(new Error("x")); setTimeout(() => console.log("таймер"), 50); p.catch(() => console.log("поймали сразу"));')));
console.log("обработан слишком поздно:", JSON.stringify(run('const p = Promise.reject(new Error("x")); setTimeout(() => p.catch(() => {}), 10); setTimeout(() => console.log("таймер"), 50);')));
console.log("с обработчиком unhandledRejection:", JSON.stringify(run('process.on("unhandledRejection", (r) => console.log("перехвачено:", r.message)); Promise.reject(new Error("тихо")); setTimeout(() => console.log("таймер"), 50);')));
console.log("отказ не-ошибкой (строкой):", JSON.stringify(run('Promise.reject("просто строка"); setTimeout(() => console.log("таймер"), 50);')));
console.log("исключение внутри async без await:", JSON.stringify(run('(async () => { throw new Error("в async"); })(); setTimeout(() => console.log("таймер"), 50);')));`, { filename: "pr4-unhandled.mjs", lineNumbers: true, collapsed: true }),
      code("text", `необработанный отказ: {"status":1,"error":"Error: никто не поймал","out":""}
обработанный позже, но в той же микрозадаче: {"status":0,"error":"","out":"поймали сразу\\nтаймер"}
обработан слишком поздно: {"status":1,"error":"Error: x","out":""}
с обработчиком unhandledRejection: {"status":0,"error":"","out":"перехвачено: тихо\\nтаймер"}
отказ не-ошибкой (строкой): {"status":1,"error":"UnhandledPromiseRejection: This error originated either by t","out":""}
исключение внутри async без await: {"status":1,"error":"Error: в async","out":""}`, { filename: "вывод Node.js 22.22.0 (каждый случай — отдельный процесс)" }),
      ul(
        "**Необработанный отказ завершает процесс Node.js** с кодом `1` и ошибкой `Error: никто не поймал`; таймер, поставленный после, не успел сработать (`out` пуст).",
        "**Обработчик добавлен сразу** (`p.catch` в том же шаге) — всё в порядке (`status: 0`). **Слишком поздно** (через 10 мс) — процесс уже упал.",
        "**`process.on(\"unhandledRejection\")`** перехватывает отказ и не даёт процессу упасть — но это страховка, а не способ обработки.",
        "**Отказ не-ошибкой** (`Promise.reject(\"строка\")`) даёт `UnhandledPromiseRejection` с кодом `ERR_UNHANDLED_REJECTION`; бросать в отказах нужно объекты `Error`.",
        "**Исключение в `async`-функции без `await`/`catch`** — тот же необработанный отказ.",
      ),
      code("html", `<!doctype html>
<meta charset="utf-8">
<script>
  window.events = [];
  addEventListener("unhandledrejection", (e) => { window.events.push("unhandledrejection: " + e.reason.message); e.preventDefault(); });
  addEventListener("rejectionhandled", (e) => window.events.push("rejectionhandled: " + e.reason.message));
  const p = Promise.reject(new Error("никто не поймал"));
  setTimeout(() => p.catch(() => {}), 100);          // обработчик добавлен слишком поздно
  Promise.reject(new Error("поймали сразу")).catch(() => {});
</script>`, { filename: "unhandled-page.html", collapsed: true }),
      code("text", `unhandledrejection: никто не поймал
rejectionhandled: никто не поймал`, { filename: "вывод Chromium 141 (по http)" }),
      ul(
        "**В браузере:** событие `unhandledrejection` у `window` (с `event.reason`), `preventDefault()` подавляет сообщение в консоли.",
        "**Поздний обработчик:** после `p.catch` через 100 мс браузер отправил `rejectionhandled` — отказ всё-таки обработан, но слишком поздно.",
        "**Правило:** обработчик отказа добавляйте в том же шаге, где создано обещание; в приложении держите глобальный обработчик `unhandledrejection` для логирования.",
      ),

      h("Практические приёмы"),
      code("js", `import { readFile } from "node:fs";
import { promisify } from "node:util";

// 1. превращение колбэков в обещания
const readFileP = promisify(readFile);
const text = await readFileP(new URL(import.meta.url), "utf8");
console.log("promisify:", text.length > 100);

function wait(ms) {                          // ручная «обёртка» вокруг колбэчного API
  return new Promise((resolve) => setTimeout(resolve, ms));          // resolve вызывается позже и снаружи исполнителя
}
await wait(5);

// 2. Promise.withResolvers: внешние resolve/reject без вложенного исполнителя
const { promise, resolve } = Promise.withResolvers();
setTimeout(() => resolve("значение извне"), 5);
console.log(await promise);

// 3. таймаут через race
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, reject) => setTimeout(() => reject(new Error("таймаут " + ms + " мс")), ms))]);
console.log(await withTimeout(wait(5).then(() => "успел"), 50));
try { await withTimeout(wait(100), 10); } catch (e) { console.log(e.message); }

// 4. антипаттерн: лишний new Promise вокруг готового обещания
const bad = (id) => new Promise((resolve, reject) => { fetchUser(id).then(resolve).catch(reject); });
const good = (id) => fetchUser(id);
async function fetchUser(id) { if (id < 0) throw new RangeError("id < 0"); return { id }; }
console.log(await bad(1), await good(1));
await bad(-1).catch((e) => console.log("bad:", e.name)); await good(-1).catch((e) => console.log("good:", e.name));

// 5. последовательная цепочка через reduce и параллельная через map
const ids = [1, 2, 3];
const order = [];
await ids.reduce((chain, id) => chain.then(async () => { await wait(10 - id); order.push("seq" + id); }), Promise.resolve());
await Promise.all(ids.map(async (id) => { await wait(10 - id); order.push("par" + id); }));
console.log(order.join(" "));

// 6. thenable
const thenable = { then(resolve) { resolve("из thenable"); } };
console.log(await thenable, await Promise.resolve(thenable));`, { filename: "pr5-patterns.mjs", lineNumbers: true }),
      code("text", `promisify: true
значение извне
успел
таймаут 10 мс
{ id: 1 } { id: 1 }
bad: RangeError
good: RangeError
seq1 seq2 seq3 par3 par2 par1
из thenable из thenable`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Колбэки → обещания:** `util.promisify` (Node.js) или ручная обёртка `new Promise` с вызовом `resolve` позже.",
        "**`Promise.withResolvers()`** (доступен в Node.js 22.22.0) возвращает `{ promise, resolve, reject }`: внешние функции без вложенного исполнителя. Метод `Promise.try` в Node.js 22.22.0 отсутствует (`typeof` — `undefined`) — не используйте без проверки.",
        "**Таймаут через `race`:** `Promise.race([operation, timeout])`; не забывайте снимать таймер.",
        "**Антипаттерн:** оборачивать готовое обещание в `new Promise((resolve, reject) => p.then(resolve).catch(reject))` — лишний код (замер: оба варианта отказываются одинаково).",
        "**Последовательно и параллельно:** цепочка через `reduce` выполнила операции по порядку (`seq1 seq2 seq3`), `Promise.all(map(...))` — параллельно (`par3 par2 par1` — по времени завершения).",
        "**Thenable:** объект с `then` — «обещание»: `await` и `Promise.resolve` его разворачивают.",
      ),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));   // создание: resolve вызывается позже

function loadUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => (id > 0 ? resolve({ id, name: "Аня" }) : reject(new RangeError("id должен быть > 0"))), 10);
  });
}

loadUser(1)
  .then((user) => user.name)               // значение переходит по цепочке
  .then((name) => \`Привет, \${name}!\`)
  .catch((error) => \`Ошибка: \${error.message}\`)   // ловит отказ любого предыдущего шага
  .finally(() => console.log("завершено"))        // выполняется в любом случае
  .then(console.log);

const [a, b] = await Promise.all([loadUser(1), loadUser(2)]);   // параллельно: обе операции стартуют сразу
console.log(a.id, b.id);`,
        [
          { line: 1, text: "Обёртка таймера: `new Promise` создаёт обещание, `resolve` вызывается позже (по таймеру) — так колбэчные API превращают в обещания." },
          { line: [3, 7], text: "Функция возвращает обещание: исполнитель стартует синхронно, а результат (`resolve` или `reject`) поступит асинхронно." },
          { line: [9, 11], text: "`then` возвращает новое обещание: значение предыдущего шага (`user`) идёт в следующий (`name` → строка приветствия)." },
          { line: 12, text: "`catch` ловит отказ любого предыдущего шага и **возвращает значение**, с которым цепочка продолжается." },
          { line: 13, text: "`finally` выполнится в любом случае и пропустит значение дальше." },
          { line: 14, text: "`.then(console.log)` — передача функции вместо стрелки: значение цепочки выводится." },
          { line: 16, text: "`Promise.all` с `await` на верхнем уровне модуля: обе операции стартуют сразу, результаты — массив в порядке ввода." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      p("Минимальная проверка собственного понимания цепочки: что и в каком порядке напечатает программа? Затем сверьтесь с замером."),
      code("js", `const out = [];
const log = (x) => { out.push(x); };

Promise.resolve("a")
  .then((v) => { log("1: " + v); throw new Error("сбой"); })
  .then(() => log("2: не выполнится"))
  .catch((e) => { log("3: " + e.message); return "восстановлено"; })
  .then((v) => { log("4: " + v); return "итог шага 4"; })
  .finally(() => log("5: finally"))
  .then((v) => log("6: " + v));

new Promise((resolve) => { log("исполнитель"); resolve(1); resolve(2); }).then((v) => log("значение " + v));
log("конец синхронного кода");

setTimeout(() => console.log(out.join("\\n")), 10);`, { filename: "x1-predict.mjs" }),
      code("text", `исполнитель
конец синхронного кода
1: a
значение 1
3: сбой
4: восстановлено
5: finally
6: итог шага 4`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "Исполнитель выполняется синхронно (`исполнитель`), как и конец кода; затем микрозадачи двух цепочек по очереди (`1: a`, `значение 1`, `3: сбой`…).",
        "Второй `resolve(2)` игнорируется: значение `1`.",
        "`throw` на шаге 1 пропускает шаг 2 и попадает в `catch` (шаг 3), который возвращает значение — шаг 4 успешен; `finally` (шаг 5) не меняет `итог шага 4` — его видит шаг 6.",
      ),
    ]),

    section("detailed-example", [
      p("Три полезных инструмента на обещаниях: `retry` (повтор с экспоненциальной паузой, отменой и условием повторения), `withTimeout` (ограничение ожидания; таймер снимается в любом случае) и `mapLimit` (параллелизм не больше `limit` с сохранением порядка результатов и прекращением запуска при первой ошибке). Паузы в тестах подменяются, чтобы проверка была детерминированной."),
      code("js", `const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const id = setTimeout(resolve, ms);
  signal?.addEventListener("abort", () => { clearTimeout(id); reject(signal.reason ?? new DOMException("Операция отменена", "AbortError")); }, { once: true });
});

// Повторяет асинхронную операцию с экспоненциальной паузой.
// fn получает номер попытки (с 1). shouldRetry решает, стоит ли повторять после ошибки.
export async function retry(fn, { retries = 3, delayMs = 100, factor = 2, shouldRetry = () => true, signal, sleepFn = sleep } = {}) {
  let attempt = 0;
  while (true) {
    attempt++;
    if (signal?.aborted) throw signal.reason ?? new DOMException("Операция отменена", "AbortError");
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt > retries || !shouldRetry(error, attempt)) throw error;
      await sleepFn(delayMs * factor ** (attempt - 1), signal);
    }
  }
}

// Ограничивает время ожидания; сама операция при этом не отменяется (если она не принимает signal)
export function withTimeout(promise, ms, message = \`Таймаут \${ms} мс\`) {
  let id;
  const timeout = new Promise((_, reject) => { id = setTimeout(() => reject(new Error(message)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(id));      // таймер снимается в любом случае
}`, { filename: "retry.mjs", lineNumbers: true }),
      code("js", `// Выполняет fn для каждого элемента не более чем в \`limit\` параллельных вызовов; результаты — в порядке элементов.
// Первая ошибка прекращает запуск новых задач и отклоняет результат.
export async function mapLimit(items, limit, fn) {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError("limit должен быть целым числом ≥ 1");
  const results = new Array(items.length);
  let next = 0;
  let failed = false;

  async function worker() {
    while (!failed && next < items.length) {
      const index = next++;
      try {
        results[index] = await fn(items[index], index);
      } catch (error) {
        failed = true;                         // новые элементы больше не берём
        throw error;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}`, { filename: "map-limit.mjs", lineNumbers: true }),
      code("js", `import { retry, withTimeout } from "./retry.mjs";
import { mapLimit } from "./map-limit.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errName = async (p) => { try { await p; return "без ошибки"; } catch (e) { return e.name + ": " + e.message; } };

// retry: паузы фиксируем через подменённый sleepFn
const delays = [];
const fakeSleep = async (ms) => { delays.push(ms); };
let calls = 0;
const flaky = async (attempt) => { calls++; if (attempt < 3) throw new Error("сбой " + attempt); return "успех на попытке " + attempt; };
check("retry: успех после двух сбоев", [await retry(flaky, { retries: 5, delayMs: 100, sleepFn: fakeSleep }), calls], ["успех на попытке 3", 3]);
check("экспоненциальные паузы 100, 200", delays, [100, 200]);

delays.length = 0;
check("исчерпаны попытки: последняя ошибка", await errName(retry(async (a) => { throw new Error("всегда " + a); }, { retries: 2, delayMs: 10, sleepFn: fakeSleep })), "Error: всегда 3");
check("всего 3 попытки (1 + 2 повтора), 2 паузы", delays, [10, 20]);

delays.length = 0;
check("shouldRetry: фатальная ошибка не повторяется", [await errName(retry(async () => { throw new TypeError("фатально"); }, { retries: 5, shouldRetry: (e) => !(e instanceof TypeError), sleepFn: fakeSleep })), delays.length], ["TypeError: фатально", 0]);

const controller = new AbortController();
controller.abort();
check("отмена до начала", await errName(retry(async () => "x", { signal: controller.signal })), "AbortError: This operation was aborted");

// withTimeout
check("withTimeout: успел", await withTimeout(sleep(5).then(() => "успел"), 100), "успел");
check("withTimeout: таймаут", await errName(withTimeout(sleep(100), 10)), "Error: Таймаут 10 мс");
check("withTimeout: ошибка исходного обещания пробрасывается", await errName(withTimeout(Promise.reject(new RangeError("исходная")), 100)), "RangeError: исходная");

// mapLimit
let running = 0, maxRunning = 0;
const task = async (x) => { running++; maxRunning = Math.max(maxRunning, running); await sleep(10 - x); running--; return x * 2; };
const input = [1, 2, 3, 4, 5, 6, 7, 8];
const out = await mapLimit(input, 3, task);
check("порядок результатов сохранён", out, [2, 4, 6, 8, 10, 12, 14, 16]);
check("одновременно не больше трёх", maxRunning, 3);
check("limit больше числа элементов", await mapLimit([1, 2], 10, async (x) => x + 1), [2, 3]);
check("пустой ввод", await mapLimit([], 3, async (x) => x), []);
check("некорректный limit", await errName(mapLimit([1], 0, async (x) => x)), "RangeError: limit должен быть целым числом ≥ 1");

const started = [];
const failing = await errName(mapLimit([1, 2, 3, 4, 5, 6], 2, async (x) => { started.push(x); await sleep(5); if (x === 2) throw new Error("сбой на 2"); return x; }));
await sleep(30);
check("ошибка: новые задачи не запускаются", [failing, started.length < 6], ["Error: сбой на 2", true]);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "retry-test.mjs", collapsed: true }),
      code("text", `Все 15 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Решение", "Что даёт", "Почему так"],
        [
          ["`while (true)` + `try { return await fn(attempt) }`", "Повтор без рекурсии", "`await` внутри `try` превращает отказ в исключение, которое ловит `catch`; без `await` отказ не был бы пойман (пример в упражнении)"],
          ["`delayMs * factor ** (attempt - 1)`", "Экспоненциальная пауза 100, 200, 400…", "Проверено подменённым `sleepFn`: паузы `[100, 200]` и `[10, 20]`"],
          ["`attempt > retries || !shouldRetry(error, attempt)`", "Остановка при исчерпании попыток или фатальной ошибке", "Всего `1 + retries` попыток; `TypeError` в тесте не повторяется (паузы не было)"],
          ["`finally(() => clearTimeout(id))`", "Таймер `withTimeout` снимается всегда", "Иначе после успеха висел бы таймер, удерживая процесс Node.js"],
          ["Пул `worker`-циклов в `mapLimit`", "Не больше `limit` параллельных вызовов", "Каждый worker берёт следующий индекс `next++` — порядок результатов сохраняется по индексам (`results[index]`)"],
          ["`failed = true` и `throw error` в worker", "После первой ошибки новые задачи не стартуют", "Уже запущенные завершатся (отменить их нельзя без `AbortSignal`), но очередь не растёт"],
          ["`Promise.all(workers)`", "Ожидание всех worker и пробрасывание первой ошибки", "Результат — массив `results`, заполненный по индексам"],
        ],
        "Разбор retry, withTimeout, mapLimit",
      ),
      ul(
        "Все 15 проверок проходят: успех после сбоев, паузы, исчерпание попыток, фатальные ошибки, отмена, таймаут, пробрасывание ошибки, порядок результатов, максимум `3` параллельных, граничные случаи `limit`, остановка запуска при ошибке.",
        "**Ограничения:** `withTimeout` не отменяет саму операцию (нужен `AbortSignal`); `retry` повторяет только идемпотентные операции (повтор оплаты — опасен).",
        "**`mapLimit` против `Promise.all(items.map(fn))`:** второй запускает **все** операции сразу — для сотен запросов к одному серверу это ошибка.",
      ),
    ]),

    section("internals", [
      h("Как устроено обещание"),
      p("Обещание хранит состояние, результат (значение или причину) и списки реакций для `then`. `resolve(value)`: если `value` — обещание или thenable, обещание «подписывается» на него (через дополнительную микрозадачу `NewPromiseResolveThenableJob` — отсюда лишние раунды, замер `c` позже `a3`); иначе — выполняется. Реакции `then` не вызываются сразу, а ставятся в **очередь микрозадач** — даже для уже выполненного обещания (поэтому колбэк всегда асинхронен и порядок предсказуем)."),
      h("Что возвращает `then`"),
      steps(
        [
          ["Создаётся новое обещание", "Результат `then` — промис-«потомок» (derived promise)."],
          ["Реакция ставится в очередь", "Когда родитель завершится, в очередь микрозадач попадает вызов нужного обработчика (или «сквозная» реакция, если обработчика нет)."],
          ["Результат обработчика", "Возвращённое значение выполняет потомка; исключение отклоняет; возвращённое обещание или thenable «разворачивается»."],
          ["Отсутствие обработчика", "Если нужного обработчика нет (например, `then(onFulfilled)` при отказе), состояние родителя копируется в потомка — так отказ «проходит» сквозь цепочку."],
        ],
        "Жизнь вызова then",
      ),
      h("Необработанные отказы"),
      p("Среда отслеживает отклонённые обещания без обработчика. Node.js после опустошения очереди микрозадач (и `nextTick`) проверяет такие обещания и, по умолчанию, завершает процесс с ошибкой (режим `throw`, замер: код `1`); браузер отправляет `unhandledrejection` и, если обработчик добавили позже, `rejectionhandled`. Момент проверки — **после** текущей порции микрозадач, поэтому обработчик нужно добавить в том же «тике»."),
      h("`finally` и `catch` — это `then`"),
      p("`catch(f)` ≡ `then(undefined, f)`; `finally(f)` ≡ `then(v => Promise.resolve(f()).then(() => v), e => Promise.resolve(f()).then(() => { throw e; }))`. Поэтому `finally` умеет ждать асинхронную очистку, а исключение внутри него заменяет результат."),
      h("Комбинаторы"),
      p("`Promise.all` подписывается на каждый элемент (приводя не-обещания через `Promise.resolve`), хранит результаты по индексам и считает оставшиеся; первый отказ отклоняет итог. Остальные операции продолжают выполняться — у обещаний нет отмены (замер: «медленная операция завершилась» после отказа `all`). Собственная реализация ниже воспроизводит поведение нативных методов."),
      code("js", `// Собственные Promise.all / allSettled / race / any
export function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = [...iterable];
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return resolve(results);
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value;                          // порядок результатов — порядок ввода, а не завершения
        if (--remaining === 0) resolve(results);
      }, reject);                                    // первый отказ отклоняет всё
    });
  });
}

export function promiseAllSettled(iterable) {
  return promiseAll([...iterable].map((item) =>
    Promise.resolve(item).then(
      (value) => ({ status: "fulfilled", value }),
      (reason) => ({ status: "rejected", reason }),
    )));
}

export function promiseRace(iterable) {
  return new Promise((resolve, reject) => {
    for (const item of iterable) Promise.resolve(item).then(resolve, reject);     // побеждает первый завершившийся
  });
}

export function promiseAny(iterable) {
  return new Promise((resolve, reject) => {
    const items = [...iterable];
    const errors = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return reject(new AggregateError([], "All promises were rejected"));
    items.forEach((item, i) => {
      Promise.resolve(item).then(resolve, (error) => {
        errors[i] = error;
        if (--remaining === 0) reject(new AggregateError(errors, "All promises were rejected"));
      });
    });
  });
}`, { filename: "combinators.mjs", lineNumbers: true }),
      code("text", `Все 11 проверок пройдены`, { filename: "сверка с нативными методами (Node.js 22.22.0)" }),
      h("Обещания и `async/await`"),
      p("`async`-функция всегда возвращает обещание: `return x` — выполнение, `throw` — отказ; `await p` подписывается на `p` и приостанавливает функцию до результата (подробно — в следующей теме)."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Забытый `return` в цепочке"),
      wrongRight(
        "js",
        {
          code: `
            getUser(id)
              .then((user) => { getOrders(user); })     // нет return
              .then((orders) => render(orders));        // orders === undefined
          `,
          note: "Следующий `then` получает `undefined`, цепочка не ждёт вложенный запрос (замер: `1. undefined`).",
        },
        {
          code: `
            getUser(id)
              .then((user) => getOrders(user))
              .then((orders) => render(orders));
          `,
          note: "Вернули обещание — цепочка дождалась его и передала результат.",
        },
      ),
      h("Ошибка 2. «Пирамида» вложенных `then`"),
      p("Вложенные `then` внутри `then` повторяют колбэк-ад. Возвращайте обещание из обработчика и выстраивайте плоскую цепочку (или используйте `async/await`)."),
      h("Ошибка 3. Проглоченные ошибки"),
      p("Пустой `catch(() => {})` скрывает проблему (замер: `undefined`, «ошибки никто не увидел»). Логируйте, преобразуйте или пробрасывайте."),
      h("Ошибка 4. Необработанный отказ"),
      p("В Node.js — падение процесса (код `1`), в браузере — `unhandledrejection`. Добавляйте `catch` в конец каждой цепочки или обрабатывайте в `async`-функции."),
      h("Ошибка 5. `then(a, b)` вместо `then(a).catch(b)`"),
      p("Второй аргумент `then` не ловит ошибки из `a` (замер: поймал только отдельный `catch`). По умолчанию пишите `.then(a).catch(b)`."),
      h("Ошибка 6. `async`-колбэк в `forEach` и `map` без `Promise.all`"),
      p("`forEach` не ждёт (замер: массив пуст сразу после, `[1, 2]` позже); `map(async …)` возвращает массив обещаний (`[true, true]`) — оберните в `Promise.all`."),
      h("Ошибка 7. Последовательные `await` там, где можно параллельно"),
      p("Три независимых запроса по `await` в цикле — 300 мс вместо 100 (замер). Запускайте сразу и ждите `Promise.all`."),
      h("Ошибка 8. Ждать, что `Promise.all` отменит остальные операции"),
      p("Обещания не отменяются: после отказа `all` медленная операция всё равно завершилась (замер). Для отмены нужен `AbortController` (следующая тема)."),
    ]),

    section("antipatterns", [
      ul(
        "**`new Promise` вокруг готового обещания** (antipattern «явного конструирования»).",
        "**Вложенные цепочки и «пирамиды»** вместо возврата обещаний.",
        "**`Promise.all` для сотен одновременных запросов** без ограничения параллелизма.",
        "**Отказ без объекта `Error`** (`Promise.reject(\"строка\")`): теряется трассировка, а в Node.js получите `ERR_UNHANDLED_REJECTION`.",
        "**Глобальный `catch` как единственная обработка:** ошибки нужно обрабатывать там, где знаете, что делать.",
        "**Повтор неидемпотентных операций** (платёж, отправка письма) через `retry`.",
        "**Смешение колбэков и обещаний в одном API** без чёткого договора.",
        "**`await` внутри `Promise.all(array.map(async …))` с побочными эффектами порядка,** когда результат зависит от очерёдности.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Всегда возвращайте обещание из `then`** и завершайте цепочку `catch` (или используйте `async/await` с `try/catch`).",
        "**Отклоняйте обещания только объектами `Error`** (лучше — осмысленными подклассами).",
        "**Запускайте независимые операции параллельно** (`Promise.all`/`allSettled`), зависимые — по порядку.",
        "**Ограничивайте параллелизм** (`mapLimit`, пулы) при большом числе операций.",
        "**Для таймаутов и отмены — `AbortController` и `AbortSignal`,** а не только `race`.",
        "**Повторяйте только идемпотентные операции,** с экспоненциальной паузой и верхней границей.",
        "**Регистрируйте глобальные обработчики `unhandledrejection`** (в Node.js — `process.on`) для логирования, не для «молчания».",
        "**Покрывайте тестами ветки отказа,** а не только успех.",
      ),
      tip("Чтобы увидеть, на каком шаге цепочка свернула в отказ, добавьте `.catch((e) => { console.error(e); throw e; })` в нужном месте: ошибка залогируется и пойдёт дальше."),
    ]),

    section("edge-cases", [
      h("Обработчик, добавленный после завершения"),
      p("`then` на уже выполненном обещании тоже вызывается асинхронно (микрозадача), порядок подписок сохраняется. Это делает поведение одинаковым независимо от того, завершено обещание или нет."),
      h("Несколько `then` на одно обещание"),
      p("Это не цепочка, а «ветки»: каждый `then` получает то же значение; ошибка в одной ветке не влияет на другую, но необработанная ветка с отказом — необработанный отказ."),
      h("`Promise.resolve` и обещания разных реализаций"),
      p("`Promise.resolve(thenable)` разворачивает чужой thenable через его `then` (асинхронно); настоящие обещания возвращает как есть."),
      h("`finally` и возвращаемое значение"),
      p("Значение, возвращённое из `finally`, игнорируется, **кроме** случая, когда оно — отказ или `finally` бросил исключение: тогда результат заменяется."),
      h("Порядок результатов `allSettled`"),
      p("Совпадает с порядком ввода, а не завершения; поля — `status` и `value`/`reason`."),
      h("Исключения в исполнителе"),
      p("Исключение, брошенное синхронно в исполнителе `new Promise`, превращается в отказ этого обещания; в асинхронных колбэках внутри исполнителя (`setTimeout(() => { throw … })`) — **не** превращается: нужен явный `reject`."),
    ]),

    section("related", [
      ul(
        "[Цикл событий: задачи и микрозадачи](/learn/js/event-loop) — очередь микрозадач, в которой выполняются реакции `then`.",
        "[Async/await, отмена и AbortController](/learn/js/async-await-abort) — синтаксис поверх обещаний и отмена операций.",
        "[Замыкания](/learn/js/closures) — колбэки и состояние в обработчиках.",
        "[Итераторы и генераторы](/learn/js/iterators-generators) — асинхронные итераторы.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Пирамида, потерянные ошибки и последовательные запросы",
          code: `
            function loadAll(ids) {
              return new Promise((resolve) => {
                const results = [];
                ids.reduce((chain, id) => chain.then(() => {
                  fetchItem(id).then((item) => results.push(item));   // нет return, нет catch
                }), Promise.resolve()).then(() => resolve(results));
              });
            }
          `,
          note: "Лишний `new Promise`, нет `return` (результаты потеряются), нет обработки ошибок, запросы по очереди.",
        },
        {
          title: "Плоско, параллельно, с контролем ошибок",
          code: `
            const loadAll = (ids) => mapLimit(ids, 4, fetchItem);   // параллельно, не больше 4; порядок сохранён; ошибка пробрасывается
          `,
          note: "Один вызов: параллельность ограничена, порядок результатов сохранён, первая ошибка отклоняет итог.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.promises.ex1",
      title: "Предскажите порядок и значения",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код (раздел «Минимальный пример»), запишите порядок строк и объясните: что делает второй `resolve`, как `throw` проходит по цепочке, что возвращает `catch`, и почему `finally` не меняет результат."),
        code("js", `const out = [];
const log = (x) => { out.push(x); };

Promise.resolve("a")
  .then((v) => { log("1: " + v); throw new Error("сбой"); })
  .then(() => log("2: не выполнится"))
  .catch((e) => { log("3: " + e.message); return "восстановлено"; })
  .then((v) => { log("4: " + v); return "итог шага 4"; })
  .finally(() => log("5: finally"))
  .then((v) => log("6: " + v));

new Promise((resolve) => { log("исполнитель"); resolve(1); resolve(2); }).then((v) => log("значение " + v));
log("конец синхронного кода");

setTimeout(() => console.log(out.join("\\n")), 10);`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Что выполняется синхронно?", "Что получает шаг 6 после `finally`?"],
      checks: ["Порядок строк верный", "Объяснён пропуск шага 2", "Объяснён `итог шага 4` в шаге 6"],
      solution: [
        code("text", `исполнитель
конец синхронного кода
1: a
значение 1
3: сбой
4: восстановлено
5: finally
6: итог шага 4`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "Синхронно: `исполнитель` (второй `resolve(2)` игнорируется) и `конец синхронного кода`.",
          "Микрозадачи двух цепочек чередуются: `1: a` и `значение 1`, затем `3: сбой`: исключение шага 1 пропустило шаг 2 (его `then` без обработчика отказа) и дошло до `catch`.",
          "`catch` вернул `восстановлено` — цепочка снова успешна (шаг 4); `finally` выполнился (шаг 5), но значение прошло насквозь: шаг 6 получил `итог шага 4`.",
        ),
      ],
    }),
    exercise({
      id: "js.promises.ex2",
      title: "Семь ошибок с обещаниями",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("В коде семь типичных ошибок: забытый `return`, `map(async …)` без `Promise.all`, `forEach(async …)`, последовательные запросы, проглоченная ошибка, `then(a, b)` и `try/catch` без `await`. Объясните каждую по выводу и покажите исправление."),
      ],
      hints: ["Что возвращает `async`-функция?", "Что ловит `try/catch` вокруг `return promise` без `await`?"],
      checks: ["Семь причин названы", "Семь исправлений проверены выводом", "Объяснён `return await` в `try`"],
      solution: [
        code("js", `const wait = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));
const getUser = (id) => wait(5, { id, name: "Пользователь " + id });

// Ошибка 1: забыли return — следующий then получает undefined
const r1 = await getUser(1).then((u) => { u.name.toUpperCase(); }).then((v) => v);
console.log("1.", r1);
const r1ok = await getUser(1).then((u) => u.name.toUpperCase());
console.log("1 исправлено.", r1ok);

// Ошибка 2: map с async-колбэком без await — получили массив обещаний
const wrong = [1, 2].map(async (id) => (await getUser(id)).name);
console.log("2.", wrong.map((p) => p instanceof Promise));
console.log("2 исправлено.", await Promise.all(wrong));

// Ошибка 3: forEach не ждёт
const done = [];
[1, 2].forEach(async (id) => { await wait(5); done.push(id); });
console.log("3. сразу после forEach:", done);
await wait(20);
console.log("3. позже:", done);

// Ошибка 4: последовательно там, где можно параллельно
const t0 = performance.now();
for (const id of [1, 2, 3]) await getUser(id);
const sequential = performance.now() - t0;
const t1 = performance.now();
await Promise.all([1, 2, 3].map(getUser));
const parallel = performance.now() - t1;
console.log("4. параллельно быстрее последовательного:", parallel < sequential);

// Ошибка 5: ошибка «проглочена» пустым catch
const swallowed = await Promise.reject(new Error("важная ошибка")).catch(() => {});
console.log("5. результат после пустого catch:", swallowed, "(ошибки никто не увидел)");
const logged = await Promise.reject(new Error("важная ошибка")).catch((e) => { console.log("5 исправлено. залогировали:", e.message); return null; });

// Ошибка 6: then(a, b) не ловит ошибку из a
await Promise.resolve().then(() => { throw new Error("в a"); }, () => console.log("не сработает")).catch((e) => console.log("6. поймал только отдельный catch:", e.message));

// Ошибка 7: try/catch без await не ловит отказ
async function bad() { try { return Promise.reject(new Error("отказ")); } catch { return "поймано внутри"; } }
async function good() { try { return await Promise.reject(new Error("отказ")); } catch { return "поймано внутри"; } }
console.log("7.", await bad().catch((e) => "не поймано в функции: " + e.message), "|", await good());`, { filename: "x2-bugs.mjs" }),
        code("text", `1. undefined
1 исправлено. ПОЛЬЗОВАТЕЛЬ 1
2. [ true, true ]
2 исправлено. [ 'Пользователь 1', 'Пользователь 2' ]
3. сразу после forEach: []
3. позже: [ 1, 2 ]
4. параллельно быстрее последовательного: true
5. результат после пустого catch: undefined (ошибки никто не увидел)
5 исправлено. залогировали: важная ошибка
6. поймал только отдельный catch: в a
7. не поймано в функции: отказ | поймано внутри`, { filename: "вывод Node.js 22.22.0" }),
        p("1) Нужен `return`. 2) `map(async)` даёт массив обещаний — `Promise.all`. 3) `forEach` не ждёт — `for…of` с `await` или `Promise.all`. 4) Независимые запросы — параллельно. 5) Пустой `catch` скрывает ошибку — залогируйте. 6) Второй аргумент `then` не ловит ошибки первого. 7) Без `await` внутри `try` функция вернула обещание, которое отклонилось уже после выхода из `try`: `catch` его не поймал; нужен `return await`."),
      ],
    }),
    exercise({
      id: "js.promises.ex3",
      title: "Свои all, allSettled, race, any",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Реализуйте `promiseAll`, `promiseAllSettled`, `promiseRace`, `promiseAny` без использования нативных комбинаторов: принимают любой итерируемый объект (в том числе значения, не являющиеся обещаниями), сохраняют порядок результатов, ведут себя на пустом вводе как нативные, `promiseAny` отклоняется `AggregateError` с `errors`. Сверьте с нативными методами."),
      ],
      hints: ["Как обработать значения, не являющиеся обещаниями?", "Как сохранить порядок результатов независимо от скорости завершения?"],
      checks: ["Порядок как у ввода", "Пустой ввод: `all` → `[]`, `race` — вечно pending, `any` — `AggregateError`", "Совпадение с нативными в тестах"],
      solution: [
        code("js", `// Собственные Promise.all / allSettled / race / any
export function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = [...iterable];
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return resolve(results);
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value;                          // порядок результатов — порядок ввода, а не завершения
        if (--remaining === 0) resolve(results);
      }, reject);                                    // первый отказ отклоняет всё
    });
  });
}

export function promiseAllSettled(iterable) {
  return promiseAll([...iterable].map((item) =>
    Promise.resolve(item).then(
      (value) => ({ status: "fulfilled", value }),
      (reason) => ({ status: "rejected", reason }),
    )));
}

export function promiseRace(iterable) {
  return new Promise((resolve, reject) => {
    for (const item of iterable) Promise.resolve(item).then(resolve, reject);     // побеждает первый завершившийся
  });
}

export function promiseAny(iterable) {
  return new Promise((resolve, reject) => {
    const items = [...iterable];
    const errors = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return reject(new AggregateError([], "All promises were rejected"));
    items.forEach((item, i) => {
      Promise.resolve(item).then(resolve, (error) => {
        errors[i] = error;
        if (--remaining === 0) reject(new AggregateError(errors, "All promises were rejected"));
      });
    });
  });
}`, { filename: "combinators.mjs" }),
        code("text", `Все 11 проверок пройдены`, { filename: "сверка с нативными (Node.js 22.22.0)" }),
        p("`Promise.resolve(item)` приводит и значения, и thenable к обещаниям; результаты пишутся по индексу, а счётчик `remaining` определяет момент завершения. `race` просто подписывается на каждый элемент: побеждает первый завершившийся. `any` собирает причины и отклоняется `AggregateError`, когда отклонены все."),
      ],
    }),
  ],

  challenge: {
    id: "js.promises.challenge",
    title: "mapLimit: параллелизм с ограничением",
    scenario: [
      p("Нужно загрузить 200 страниц с внешнего API, не открывая более 5 соединений одновременно, сохранив порядок результатов и остановив запуск новых запросов при первой ошибке. Реализуйте модуль `map-limit.mjs` с функцией `mapLimit(items, limit, fn)`."),
    ],
    requirements: [
      "`fn(item, index)` вызывается для каждого элемента; одновременно выполняется не более `limit` вызовов",
      "Результат — массив значений в порядке элементов (а не завершения)",
      "`limit` — целое ≥ 1, иначе `RangeError`; `limit` больше числа элементов и пустой ввод работают без ошибок",
      "При первой ошибке новые вызовы не запускаются, итоговое обещание отклоняется этой ошибкой",
    ],
    constraints: [
      "Без внешних библиотек",
      "Не запускать все операции сразу (`Promise.all(items.map(fn))` не подходит)",
    ],
    acceptance: [
      "Максимум одновременных вызовов равен `limit` (в тесте — `3` при 8 элементах)",
      "Порядок результатов сохраняется при разной длительности операций",
      "После ошибки на элементе 2 запущены не все элементы",
    ],
    hints: [
      "Как заставить фиксированное число «рабочих» брать задачи из общей очереди?",
      "Как сохранить порядок результатов?",
      "Как остановить запуск новых задач при ошибке?",
    ],
    solution: [
      code("js", `// Выполняет fn для каждого элемента не более чем в \`limit\` параллельных вызовов; результаты — в порядке элементов.
// Первая ошибка прекращает запуск новых задач и отклоняет результат.
export async function mapLimit(items, limit, fn) {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError("limit должен быть целым числом ≥ 1");
  const results = new Array(items.length);
  let next = 0;
  let failed = false;

  async function worker() {
    while (!failed && next < items.length) {
      const index = next++;
      try {
        results[index] = await fn(items[index], index);
      } catch (error) {
        failed = true;                         // новые элементы больше не берём
        throw error;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}`, { filename: "map-limit.mjs", lineNumbers: true }),
      code("text", `Все 15 проверок пройдены`, { filename: "результат запуска тестов (retry, withTimeout, mapLimit)" }),
      p("Запускается `min(limit, items.length)` рабочих циклов; каждый берёт следующий индекс (`next++`), ждёт `fn` и записывает результат в `results[index]`. Флаг `failed` останавливает взятие новых элементов после первой ошибки; `Promise.all` пробрасывает её."),
    ],
  },

  interview: [
    iq("js.promises.i1", "basic", "Что такое Promise и какие у него состояния?", [
      ul(
        "Объект, представляющий результат асинхронной операции.",
        "Состояния: `pending` (ожидает), `fulfilled` (выполнено со значением), `rejected` (отклонено с причиной).",
        "Состояние меняется один раз и дальше неизменно; подписка — `then`/`catch`/`finally`.",
      ),
    ]),
    iq("js.promises.i2", "basic", "Как работает цепочка `then`?", [
      ul(
        "Каждый `then` возвращает новое обещание; значение следующего определяется результатом обработчика.",
        "Возвращённое обещание «разворачивается»; исключение превращается в отказ; отказ пропускает `then` без обработчика отказа до ближайшего `catch`.",
        "Забытый `return` — следующий шаг получит `undefined`.",
      ),
    ]),
    iq("js.promises.i3", "intermediate", "Чем `Promise.all`, `allSettled`, `race` и `any` отличаются?", [
      ul(
        "`all` — массив значений при успехе всех; первый отказ отклоняет всё.",
        "`allSettled` — результат по каждому, не отклоняется.",
        "`race` — результат первого завершившегося (успех или отказ).",
        "`any` — первый успешный; если все отказали — `AggregateError`.",
      ),
    ]),
    iq("js.promises.i4", "intermediate", "Что произойдёт с необработанным отказом?", [
      ul(
        "Node.js 22: процесс завершается с кодом 1 (по умолчанию); можно перехватить `process.on(\"unhandledRejection\")`.",
        "Браузер: событие `unhandledrejection` и сообщение в консоли; если позже добавить `catch` — `rejectionhandled`.",
        "Обрабатывайте отказы в том же шаге; отклоняйте объектами `Error`.",
      ),
    ]),
    iq("js.promises.i5", "intermediate", "Чем `.then(a, b)` отличается от `.then(a).catch(b)`?", [
      ul(
        "`b` во втором аргументе `then` обрабатывает только отказ предшествующего обещания, но не ошибки внутри `a`.",
        "`catch` после `then(a)` ловит и отказ предыдущих шагов, и ошибки внутри `a`.",
        "Практическое правило: `.then(a).catch(b)`.",
      ),
    ]),
    iq("js.promises.i6", "advanced", "Почему возврат обещания из `then` «стоит» дополнительных тиков?", [
      ul(
        "Разворачивание обещания требует дополнительной микрозадачи `NewPromiseResolveThenableJob`, которая подписывает внешнее обещание на возвращённое.",
        "В замере цепочка с таким `then` отстала от обычных на два раунда.",
        "Практический вывод: не полагайтесь на точный порядок микрозадач между независимыми цепочками.",
      ),
    ]),
    iq("js.promises.i7", "engineering", "Как загрузить 1000 ресурсов, не перегрузив сервер, и корректно обработать ошибки?", [
      ul(
        "Ограничить параллелизм (`mapLimit`/пул, 5–10 одновременных запросов), сохранять порядок результатов.",
        "Отмена оставшихся запросов при ошибке — `AbortController`; повтор временных ошибок с экспоненциальной паузой (`retry`) только для идемпотентных запросов.",
        "Таймаут каждого запроса; сбор отчёта об ошибках через `allSettled`, если частичный успех допустим.",
        "Метрики и тесты: максимальный параллелизм, поведение при ошибке.",
      ),
    ]),
    iq("js.promises.i8", "debugging", "Консоль показывает «Uncaught (in promise)», а `try/catch` вокруг вызова ничего не поймал. Почему?", [
      ul(
        "`try/catch` ловит только синхронные исключения и `await` внутри `async`-функции; отказ обещания без `await` в блок не попадает.",
        "Нужен `await` в `try` (`return await …`) или `.catch()` у обещания.",
        "Проверьте `forEach(async …)` и «забытые» вызовы асинхронных функций без `await`.",
      ),
    ]),
  ],

  exam: [
    mcq("js.promises.e1", "foundation", "Сколько раз может измениться состояние обещания?", ["Сколько угодно", "Дважды", "Один раз — из `pending` в `fulfilled` или `rejected`", "Только при `finally`"], 2, "Первый вызов `resolve`/`reject` определяет состояние; остальные игнорируются (замер)."),
    mcq("js.promises.e2", "foundation", "Что вернёт `Promise.resolve(1).then(() => {}).then((v) => v)`?", ["Обещание со значением `undefined`", "Обещание со значением `1`", "`1` синхронно", "Отказ"], 0, "Обработчик без `return` вернул `undefined`, и следующий шаг получил его."),
    mcq("js.promises.e3", "intermediate", "Что произойдёт при `Promise.all([fast, failingSlow, slow])`, если `failingSlow` отклонится?", ["Дождёмся всех и вернём массив", "Вернётся массив с ошибкой", "Отменятся все операции", "Сразу отклонится ошибкой `failingSlow`, но остальные операции продолжат выполняться"], 3, "`all` отклоняется на первом отказе, но обещания не отменяются (замер: медленная операция завершилась)."),
    mcq("js.promises.e4", "intermediate", "Что вернёт `Promise.any([Promise.reject(1), Promise.reject(2)])`?", ["Отказ `1`", "Отказ `AggregateError` с `errors: [1, 2]`", "Выполнится с `undefined`", "Массив `[1, 2]`"], 1, "Если отклонены все, `any` отклоняется `AggregateError` (замер: `All promises were rejected`)."),
    mcq("js.promises.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`finally` получает значение обещания", "`catch`, вернувший значение, «лечит» цепочку", "Исполнитель `new Promise` вызывается синхронно", "`then` на выполненном обещании вызывается синхронно"], [1, 2], "`finally` не получает значения, а `then` всегда асинхронен (микрозадача)."),
    mcq("js.promises.e6", "advanced", "Почему `async function f() { try { return Promise.reject(new Error(\"x\")); } catch { return \"поймано\"; } }` не вернёт «поймано»?", ["`catch` не работает в `async`", "Из-за строгого режима", "`return` запрещён в `try`", "Без `await` отказ происходит после выхода из `try`, и `catch` его не видит"], 3, "Нужен `return await …`: тогда отказ превращается в исключение внутри `try` (замер: `не поймано в функции`)."),
    open("js.promises.e7", "intermediate", "Объясните, как обработка ошибок работает в цепочке обещаний, и как не потерять ошибку.", [
      ul(
        "Исключение в обработчике и отказ превращаются в отказ обещания цепочки; следующие `then` без обработчика отказа пропускаются.",
        "Ближайший `catch` ловит отказ; вернув значение, он «лечит» цепочку, а брошенное исключение — продолжает отказ.",
        "Чтобы не потерять: `catch` в конце каждой цепочки (или `try/catch` с `await`), не оставлять пустых `catch`, отклонять объектами `Error`, логировать в глобальном `unhandledrejection`.",
        "`finally` — для очистки, ошибку он пропускает дальше.",
      ),
    ], ["Описан путь отказа по цепочке", "Описано действие `catch`", "Названы способы не потерять ошибку"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.promises.m1", "intermediate", "Что выведет `Promise.resolve(\"A\").finally(() => \"B\").then(console.log)`?", ["`B`", "`undefined`", "`A`", "Ничего"], 2, "Значение из `finally` игнорируется, результат исходного обещания проходит насквозь (замер: `A`)."),
    mcq("js.promises.m2", "advanced", "Какой комбинатор подходит для «взять данные из первого ответившего зеркала, игнорируя сбойные»?", ["`Promise.all`", "`Promise.any`", "`Promise.race`", "`Promise.allSettled`"], 1, "`any` берёт первый **успешный** результат и игнорирует отказы, пока есть надежда."),
    mcq("js.promises.m3", "advanced", "Почему `retry` нужно применять только к идемпотентным операциям?", ["Повтор неидемпотентной операции (платёж, отправка) может выполнить её дважды", "Он слишком медленный", "Он не работает с `async`", "Из-за `AggregateError`"], 0, "Если первая попытка на самом деле дошла до сервера, повтор продублирует действие."),
    open("js.promises.m4", "advanced", "Опишите дизайн клиента API с повторами, таймаутами, ограничением параллелизма и отменой для приложения, делающего сотни запросов.", [
      ul(
        "Единая функция `request(url, { signal, timeoutMs, retries })`: таймаут через `AbortSignal.timeout` или `race` + `AbortController`, повтор с экспоненциальной паузой и джиттером только для идемпотентных методов и временных статусов (429, 5xx).",
        "Пул/ограничитель параллелизма (`mapLimit`) по числу соединений и по хосту; приоритеты и очередь.",
        "Отмена: общий `AbortController` на сценарий (смена страницы, закрытие диалога); при отмене запросы прерываются, а не просто игнорируются.",
        "Ошибки: типизированные (`NetworkError`, `HttpError`, `TimeoutError`), метрики, глобальный `unhandledrejection` для логов.",
        "Тесты: подменённые часы и `fetch`, граничные случаи (все попытки неудачны, отмена в середине, параллелизм не превышен).",
      ),
    ], ["Описан таймаут и повтор", "Описано ограничение параллелизма", "Описана отмена", "Описаны ошибки и тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.promises.f1", front: "Состояния Promise?", back: "pending → fulfilled | rejected; меняется один раз; повторные resolve/reject игнорируются." },
    { id: "js.promises.f2", front: "then и цепочка?", back: "Возвращает новое обещание; return → значение, throw → отказ, возвращённое обещание разворачивается. Забытый return → undefined." },
    { id: "js.promises.f3", front: "all / allSettled / race / any?", back: "all — все или первый отказ; allSettled — результат по каждому; race — первый завершившийся; any — первый успешный (AggregateError)." },
    { id: "js.promises.f4", front: "Необработанный отказ?", back: "Node 22: процесс падает (код 1); браузер: unhandledrejection (+ rejectionhandled). catch — в том же шаге." },
    { id: "js.promises.f5", front: "then(a, b) vs then(a).catch(b)?", back: "b второго аргумента не ловит ошибки из a; пишите .then(a).catch(b)." },
    { id: "js.promises.f6", front: "Параллелизм?", back: "await в цикле — последовательно (300 мс); Promise.all — параллельно (100 мс); обещания не отменяются." },
    { id: "js.promises.f7", front: "Возврат Promise из then?", back: "Стоит ~2 дополнительных раунда микрозадач (NewPromiseResolveThenableJob); не полагайтесь на точный порядок." },
  ],

  sources: [
    { title: "ECMAScript: Promise Objects", url: "https://tc39.es/ecma262/#sec-promise-objects", publisher: "ECMA" },
    { title: "ECMAScript: Promise Jobs (NewPromiseResolveThenableJob)", url: "https://tc39.es/ecma262/#sec-promise-jobs", publisher: "ECMA" },
    { title: "HTML Standard: Promise rejection events (unhandledrejection)", url: "https://html.spec.whatwg.org/multipage/webappapis.html#unhandled-promise-rejections", publisher: "WHATWG" },
    { title: "MDN: Promise", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise", publisher: "MDN" },
    { title: "MDN: Using promises", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises", publisher: "MDN" },
    { title: "MDN: Promise.withResolvers()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers", publisher: "MDN" },
    { title: "MDN: AggregateError", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError", publisher: "MDN" },
    { title: "MDN: Window: unhandledrejection event", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event", publisher: "MDN" },
    { title: "Node.js: process 'unhandledRejection'", url: "https://nodejs.org/api/process.html#event-unhandledrejection", publisher: "Other" },
  ],
};
