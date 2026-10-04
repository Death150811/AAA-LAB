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

export const eventLoop: Topic = {
  id: "js.event-loop",
  slug: "event-loop",
  domain: "js",
  module: "async",
  title: "Цикл событий: задачи и микрозадачи",
  titleEn: "The event loop: tasks and microtasks",
  summary:
    "JavaScript выполняет код в одном потоке, а асинхронность обеспечивает **цикл событий**: он берёт одну задачу (макрозадачу: таймер, событие, сетевой ответ), выполняет её до конца, затем полностью опустошает очередь микрозадач (`Promise.then`, `queueMicrotask`, `await`, `MutationObserver`), и только после этого браузер может отрисовать кадр. Тема на замерах в Node.js 22 и Chromium 141 разбирает порядок «синхронный код → микрозадачи → макрозадачи», отличия Node.js (`process.nextTick`, `setImmediate`, ESM против CommonJS), неожиданное различие порядка микрозадач при настоящем клике и при `button.click()` из скрипта, ограничение вложенных таймеров (≥ 4 мс), блокировку отрисовки длинной задачей (пауза между кадрами больше 280 мс), «голодание» таймеров микрозадачами и приёмы кооперативной работы — разбиение на порции и уступку управления; в конце вы пишете `processInChunks`.",
  minutes: 85,
  prerequisites: ["js.closures", "js.iterators-generators"],
  tags: ["event loop", "call stack", "task queue", "macrotask", "microtask", "setTimeout", "queueMicrotask", "process.nextTick", "setImmediate", "requestAnimationFrame", "blocking", "long task", "yield to main", "starvation"],
  keyConcepts: [
    { term: "Одна задача за раз, до конца", text: "Цикл событий не прерывает выполняющуюся задачу. Таймер на 10 мс при занятом на 200 мс потоке сработал не раньше, чем через 200 мс (замер)." },
    { term: "Микрозадачи — до следующей макрозадачи", text: "После каждой макрозадачи (и после каждого колбэка при пустом стеке) очередь микрозадач выполняется **целиком**, включая вновь добавленные. Поэтому `promise.then` и `await` всегда раньше `setTimeout(…, 0)`." },
    { term: "Порядок: синхронный → микро → макро", text: "В замере: `синхронный код` → `promise.then` → `queueMicrotask` → `MutationObserver` → таймеры, `MessageChannel`, `requestAnimationFrame` (порядок между разными макро-источниками не гарантирован)." },
    { term: "Отрисовка ждёт", text: "Пока выполняется длинная синхронная задача или цепочка микрозадач, кадры не рисуются: пауза между кадрами при 300-миллисекундном цикле — больше 280 мс; та же работа порциями по 10 мс — меньше 100 мс." },
    { term: "Микрозадачи могут «заморить» всё остальное", text: "Цепочка из 100 000 микрозадач, каждая из которых планирует следующую, не дала сработать таймеру `setTimeout(…, 0)` до своего конца; цепочка макрозадач дала ему вклиниться (замер)." },
  ],
  sections: [
    section("definition", [
      def("Цикл событий (event loop)", "Механизм среды, который по очереди берёт задачи из очередей и выполняет каждую до конца в основном потоке; между задачами выполняет микрозадачи и (в браузере) обновляет отрисовку.", "event loop"),
      def("Стек вызовов", "Структура активных вызовов функций. Пока стек не пуст, цикл событий не может взять следующую задачу.", "call stack"),
      def("Макрозадача (задача)", "Единица работы цикла событий: колбэк таймера, обработчик события, сетевого ответа, `MessageChannel`, выполнение скрипта.", "task / macrotask"),
      def("Микрозадача", "Короткая работа, выполняемая сразу после текущей задачи (когда стек пуст), до следующей макрозадачи и отрисовки: колбэки `Promise.then`, `queueMicrotask`, продолжение после `await`, `MutationObserver`.", "microtask"),
      def("Отрисовка (rendering opportunity)", "Момент, когда браузер пересчитывает стили, раскладку и рисует кадр; наступает между задачами, обычно раз в 16,7 мс на 60 Гц. `requestAnimationFrame` вызывается перед отрисовкой.", "rendering opportunity"),
      def("Долгая задача", "Задача, занимающая основной поток дольше ~50 мс; блокирует ввод и отрисовку.", "long task"),
      def("`process.nextTick` и `setImmediate`", "Особенности Node.js: `nextTick` — очередь, выполняемая перед микрозадачами промисов (в CommonJS); `setImmediate` — колбэк фазы «check» после ввода-вывода.", "process.nextTick / setImmediate"),
      def("Голодание (starvation)", "Ситуация, когда одна очередь (например, микрозадач) непрерывно пополняется и не даёт выполниться остальным (таймерам, вводу, отрисовке).", "starvation"),
    ]),

    section("why", [
      h("Асинхронность — это не многопоточность"),
      p("«JavaScript однопоточный, но не блокируется» — самая запутанная фраза для новичка. Она верна лишь при понимании цикла событий. Если вы не знаете, **когда** выполнится колбэк, вы не поймёте, почему «`setTimeout(f, 0)` не мгновенный», «страница зависла от цикла на тысячу итераций», «`await` выполнился раньше таймера», «в логах порядок не тот, что я ожидал»."),
      ul(
        "**Предсказуемость порядка:** на нём основаны тесты, гонки данных, инициализация, обработка событий.",
        "**Производительность интерфейса:** долгие синхронные задачи — главная причина «тормозов» и «зависаний».",
        "**Диагностика:** вы читаете вкладку Performance и понимаете, что такое длинная задача, микрозадача и кадр.",
        "**Основа следующих тем:** `Promise`, `async/await`, `AbortController` — надстройки над очередями цикла событий.",
      ),
      insight("Правило цикла событий в одну строку: **выполнить задачу целиком → опустошить микрозадачи → (в браузере) при необходимости отрисовать → следующая задача**. Всё, что вы делаете «в фоне», — это постановка колбэка в одну из очередей."),
    ]),

    section("mental-model", [
      p("Представьте **один кассовый узел магазина** с одним кассиром (поток). Перед кассой — **очередь покупателей** (макрозадачи): таймеры, клики, ответы сети. Кассир обслуживает **одного** до конца, не прерываясь. Но у кассира есть **лоток срочных поручений** (микрозадачи): пока покупатель ещё стоит у кассы, все срочные поручения, которые возникли в процессе, выполняются подряд, **включая те, что возникли во время самих поручений**, — и только когда лоток пуст, кассир зовёт следующего покупателя. Между покупателями **иногда** открывается «витрина» — отрисовка кадра: если кассир застрял на одном покупателе (долгая задача) или бесконечно пополняет лоток поручений, витрину не обновить, и посетители видят «зависший» магазин. Узел очереди (стек вызовов) должен быть пуст, чтобы кассир взял следующего."),
      table(
        ["Очередь", "Что в ней", "Когда выполняется"],
        [
          ["Стек вызовов", "Текущий синхронный код", "Сейчас; пока он не пуст, ничего другого не выполняется"],
          ["Микрозадачи", "`Promise.then/catch/finally`, `await`, `queueMicrotask`, `MutationObserver`", "Сразу после текущей задачи, до всего остального; очередь выполняется целиком"],
          ["Макрозадачи", "`setTimeout`/`setInterval`, события ввода, сеть, `MessageChannel`, скрипты", "По одной за итерацию цикла событий"],
          ["Отрисовка (браузер)", "Стили, раскладка, `requestAnimationFrame`, рисование", "Между задачами, когда браузер решит (обычно ~60 раз в секунду)"],
          ["Node.js: `nextTick`, `setImmediate`", "Дополнительные очереди среды", "`nextTick` — перед микрозадачами промисов (CommonJS); `setImmediate` — после ввода-вывода"],
        ],
        "Очереди цикла событий",
      ),
    ]),

    section("technical", [
      h("Порядок: синхронный код → микрозадачи → макрозадачи"),
      code("js", `console.log("1: синхронно");

setTimeout(() => console.log("5: макрозадача (таймер)"), 0);

Promise.resolve().then(() => console.log("3: микрозадача (promise)"));
queueMicrotask(() => console.log("4: микрозадача (queueMicrotask)"));

console.log("2: синхронно");`, { filename: "syntax.mjs" }),
      code("text", `1: синхронно
2: синхронно
3: микрозадача (promise)
4: микрозадача (queueMicrotask)
5: макрозадача (таймер)`, { filename: "вывод Node.js 22.22.0" }),
      p("Более полный замер в Node.js 22.22.0: тот же код как модуль ES (`.mjs`) и как CommonJS (`.cjs`)."),
      code("js", `const log = [];
const out = (x) => log.push(x);

out("синхронный код: начало");

setTimeout(() => out("setTimeout 0 (макрозадача)"), 0);

Promise.resolve().then(() => out("promise.then (микрозадача)"));
queueMicrotask(() => out("queueMicrotask (микрозадача)"));
process.nextTick(() => out("process.nextTick (Node.js)"));

(async () => {
  out("async-функция: код до первого await — синхронно");
  await null;
  out("код после await — микрозадача");
})();

out("синхронный код: конец");

setTimeout(() => console.log(log.map((x, i) => \`\${i + 1}. \${x}\`).join("\\n")), 20);`, { filename: "el1-order.mjs", lineNumbers: true }),
      code("text", `1. синхронный код: начало
2. async-функция: код до первого await — синхронно
3. синхронный код: конец
4. promise.then (микрозадача)
5. queueMicrotask (микрозадача)
6. код после await — микрозадача
7. process.nextTick (Node.js)
8. setTimeout 0 (макрозадача)`, { filename: "вывод для модуля ES (.mjs)" }),
      code("text", `1. синхронный код: начало
2. async-функция: код до первого await — синхронно
3. синхронный код: конец
4. process.nextTick (Node.js)
5. promise.then (микрозадача)
6. queueMicrotask (микрозадача)
7. код после await — микрозадача
8. setTimeout 0 (макрозадача)`, { filename: "вывод для CommonJS (.cjs)" }),
      ul(
        "**Синхронный код** (включая код `async`-функции **до первого `await`**) выполняется сразу и целиком.",
        "**Микрозадачи** идут сразу после: `promise.then`, `queueMicrotask`, продолжение после `await` — в порядке постановки.",
        "**Макрозадача** (`setTimeout 0`) — только после того, как очередь микрозадач опустела.",
        "**`process.nextTick` зависит от формата:** в **CommonJS** он выполнился **раньше** микрозадач промисов, а в **модуле ES** — **после** них. Причина: тело модуля ES само выполняется внутри промис-задачи, и `nextTick` обрабатывается после очереди микрозадач. Не полагайтесь на относительный порядок `nextTick` и `Promise.then`.",
      ),

      h("Вложенные микрозадачи и макрозадачи"),
      code("js", `const log = [];
setTimeout(() => {
  log.push("timer 1");
  Promise.resolve().then(() => log.push("  микрозадача из timer 1"));
}, 0);
setTimeout(() => {
  log.push("timer 2");
  Promise.resolve().then(() => log.push("  микрозадача из timer 2"));
}, 0);

Promise.resolve().then(() => {
  log.push("микрозадача A");
  Promise.resolve().then(() => log.push("  вложенная микрозадача A.1"));
}).then(() => log.push("микрозадача A (вторая цепочка then)"));
Promise.resolve().then(() => log.push("микрозадача B"));

setTimeout(() => console.log(log.join("\\n")), 20);`, { filename: "el2-nested.mjs", lineNumbers: true }),
      code("text", `микрозадача A
микрозадача B
  вложенная микрозадача A.1
микрозадача A (вторая цепочка then)
timer 1
  микрозадача из timer 1
timer 2
  микрозадача из timer 2`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Микрозадачи выполняются «волнами», но очередь опустошается целиком:** `микрозадача A`, `B`, затем вложенная `A.1` (поставлена во время `A`) и `вторая цепочка then` — всё это раньше любого таймера.",
        "**После каждой макрозадачи — микрозадачи:** `timer 1` → его микрозадача → `timer 2` → его микрозадача (микрозадача из `timer 1` не пропустила вперёд `timer 2`, но выполнилась до него).",
      ),

      h("Порядок в браузере: микрозадачи, макрозадачи и отрисовка"),
      code("html", `<!doctype html>
<meta charset="utf-8">
<button id="b">кнопка</button>
<script type="module">
  const log = (window.log = []);
  const out = (x) => log.push(x);
  const b = document.getElementById("b");

  // 1. порядок на старте
  out("sync: начало");
  setTimeout(() => out("setTimeout 0"), 0);
  Promise.resolve().then(() => out("promise.then"));
  queueMicrotask(() => out("queueMicrotask"));
  new MutationObserver(() => out("MutationObserver (микрозадача)")).observe(document.body, { childList: true });
  document.body.append(document.createElement("i"));
  const mc = new MessageChannel();
  mc.port1.onmessage = () => out("MessageChannel (макрозадача)");
  mc.port2.postMessage(1);
  requestAnimationFrame(() => out("requestAnimationFrame (перед отрисовкой)"));
  out("sync: конец");

  // 2. два обработчика клика, в каждом по микрозадаче
  window.clickLog = [];
  const cl = (x) => window.clickLog.push(x);
  b.addEventListener("click", () => { cl("обработчик 1"); Promise.resolve().then(() => cl("  микрозадача из обработчика 1")); });
  b.addEventListener("click", () => { cl("обработчик 2"); Promise.resolve().then(() => cl("  микрозадача из обработчика 2")); });

  window.scriptClick = () => { cl("— b.click() из скрипта —"); b.click(); cl("конец скрипта после b.click()"); };
</script>`, { filename: "order-page.html", collapsed: true }),
      code("text", `порядок на старте (синхронный код и микрозадачи):
  1. sync: начало
  2. sync: конец
  3. promise.then
  4. queueMicrotask
  5. MutationObserver (микрозадача)
затем макрозадачи (их взаимный порядок между разными источниками не гарантирован):
  MessageChannel (макрозадача)
  requestAnimationFrame (перед отрисовкой)
  setTimeout 0
клик пользователя:
  обработчик 1
    микрозадача из обработчика 1
  обработчик 2
    микрозадача из обработчика 2
b.click() из скрипта:
  — b.click() из скрипта —
  обработчик 1
  обработчик 2
  конец скрипта после b.click()
    микрозадача из обработчика 1
    микрозадача из обработчика 2
[]`, { filename: "вывод Chromium 141 (по http)" }),
      ul(
        "**Старт:** сначала синхронный код, затем микрозадачи (`promise.then`, `queueMicrotask`, `MutationObserver`) — в порядке постановки.",
        "**Макрозадачи после:** `setTimeout`, `MessageChannel`, `requestAnimationFrame` выполняются позже всех микрозадач; **взаимный порядок** этих источников между прогонами менялся (в замере шести запусков `setTimeout` оказывался то раньше, то позже `MessageChannel` и кадра) — на него нельзя полагаться.",
        "**Настоящий клик:** после каждого обработчика цикл событий видит пустой стек и выполняет микрозадачи: `обработчик 1` → его микрозадача → `обработчик 2` → его микрозадача.",
        "**`button.click()` из скрипта:** стек не пуст (внутри вашего кода), поэтому оба обработчика выполняются **подряд**, а микрозадачи — только когда скрипт закончился (`конец скрипта` напечатан раньше микрозадач). Это самое неожиданное отличие синтетических событий от настоящих.",
      ),

      h("Node.js: ввод-вывод, `setImmediate` и таймеры"),
      code("js", `import { readFile } from "node:fs";
const log = [];
readFile(new URL(import.meta.url), () => {                // колбэк ввода-вывода
  setTimeout(() => log.push("setTimeout 0"), 0);
  setImmediate(() => log.push("setImmediate"));
  process.nextTick(() => log.push("nextTick"));
  Promise.resolve().then(() => log.push("promise.then"));
});
setTimeout(() => console.log("внутри колбэка ввода-вывода:", log.join(" → ")), 50);`, { filename: "el1b-io.mjs" }),
      code("text", `внутри колбэка ввода-вывода: nextTick → promise.then → setImmediate → setTimeout 0`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Внутри колбэка ввода-вывода** порядок детерминирован: `nextTick` → `promise.then` → `setImmediate` → `setTimeout 0`.",
        "**Из главного модуля** порядок `setTimeout(0)` и `setImmediate` Node.js не гарантирует (документация: зависит от производительности процесса): в нашем замере шести запусков `setImmediate` всегда оказывался первым, но так полагаться нельзя.",
        "**В браузере** `setImmediate` нет; для «выполнить как можно быстрее, но после текущей задачи» — `setTimeout(…, 0)`, `MessageChannel` или `scheduler.postTask`.",
      ),

      h("Блокировка: занятый поток задерживает всё"),
      code("js", `const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const busy = (ms) => { const end = performance.now() + ms; while (performance.now() < end); };

// таймер просит 10 мс, но поток занят 200 мс
const t0 = performance.now();
let firedAfter;
setTimeout(() => { firedAfter = performance.now() - t0; }, 10);
busy(200);
await sleep(30);
console.log("таймер на 10 мс сработал не раньше, чем через 200 мс:", firedAfter >= 200);

// «сердцебиение» каждые 10 мс: насколько оно задерживается
async function maxGap(work) {
  let last = performance.now(), max = 0;
  const id = setInterval(() => { const now = performance.now(); max = Math.max(max, now - last); last = now; }, 10);
  await sleep(30);                         // даём сердцебиению начаться
  await work();
  await sleep(30);                         // даём сердцебиению шанс сработать после работы
  clearInterval(id);
  return max;
}

// монолитная задача: один длинный синхронный блок
const monolith = await maxGap(async () => { busy(300); });
// та же работа порциями по 10 мс с уступкой управления между порциями
const chunked = await maxGap(async () => {
  for (let i = 0; i < 30; i++) { busy(10); await new Promise((r) => setTimeout(r, 0)); }
});
console.log("монолит: наибольшая пауза между «ударами» больше 250 мс:", monolith > 250);
console.log("порции по 10 мс: наибольшая пауза меньше 60 мс:", chunked < 60);`, { filename: "el3-blocking.mjs", lineNumbers: true }),
      code("text", `таймер на 10 мс сработал не раньше, чем через 200 мс: true
монолит: наибольшая пауза между «ударами» больше 250 мс: true
порции по 10 мс: наибольшая пауза меньше 60 мс: true`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Таймер не точен, а «не раньше»:** `setTimeout(…, 10)` при занятом на 200 мс потоке сработал после занятия потока (`≥ 200` мс).",
        "**Монолит:** 300 мс синхронной работы — «сердцебиение» с шагом 10 мс не могло ударить 300 мс (наибольшая пауза больше 250 мс).",
        "**Порции:** та же по сути работа (30 раз по 10 мс) с уступкой `await setTimeout(0)` между порциями — наибольшая пауза меньше 60 мс: потоку дали «подышать».",
      ),
      code("html", `<!doctype html>
<meta charset="utf-8">
<div id="box" style="width:50px;height:50px;background:#4f46e5"></div>
<script type="module">
  const busy = (ms) => { const end = performance.now() + ms; while (performance.now() < end); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // записывает моменты кадров анимации
  function recordFrames() {
    const times = [];
    let running = true;
    (function frame(t) { times.push(t); if (running) requestAnimationFrame(frame); })(performance.now());
    return () => { running = false; return times; };
  }
  const maxGap = (times) => Math.max(...times.slice(1).map((t, i) => t - times[i]));

  window.measure = async () => {
    let stop = recordFrames();
    await sleep(400);
    const smooth = maxGap(stop());

    stop = recordFrames();
    await sleep(100);
    busy(300);                                  // длинная синхронная задача: ни одного кадра за 300 мс
    await sleep(100);
    const blocked = maxGap(stop());

    stop = recordFrames();
    await sleep(100);
    for (let i = 0; i < 30; i++) { busy(10); await sleep(0); }     // та же работа порциями
    await sleep(100);
    const chunked = maxGap(stop());
    return { smooth, blocked, chunked };
  };
</script>`, { filename: "frames-page.html", collapsed: true }),
      code("text", `без нагрузки: наибольшая пауза между кадрами меньше 60 мс: true
синхронный цикл на 300 мс: между кадрами пауза больше 280 мс: true
та же работа порциями по 10 мс: наибольшая пауза меньше 100 мс: true`, { filename: "вывод Chromium 141 (по http)" }),
      ul(
        "**Кадры анимации** (`requestAnimationFrame`) в простое идут без больших пауз; **синхронный цикл на 300 мс** оставил браузер без кадров (пауза больше 280 мс); **порции по 10 мс** сохранили плавность (пауза меньше 100 мс).",
        "**Правило бюджета:** чтобы страница оставалась отзывчивой, одна задача не должна занимать поток дольше ~50 мс (граница «долгой задачи»), а на кадр у вас около 16 мс.",
      ),

      h("«Голодание» таймеров микрозадачами"),
      code("js", `const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let timerRanAtStep = null;
setTimeout(() => { timerRanAtStep = steps; }, 0);

// цепочка микрозадач, каждая планирует следующую: таймер (макрозадача) ждёт, пока очередь микрозадач не опустеет
let steps = 0;
function loop() {
  if (++steps < 100_000) queueMicrotask(loop);
}
loop();
await sleep(20);
console.log("таймер сработал только после всех микрозадач:", timerRanAtStep === 100_000);

// то же через макрозадачи: таймер не ждёт
let timerRanAtStep2 = null, steps2 = 0;
setTimeout(() => { timerRanAtStep2 = steps2; }, 0);
function loop2() {
  if (++steps2 < 200) setTimeout(loop2, 0);
}
loop2();
await sleep(500);
console.log("при планировании макрозадачами таймер вклинился в середину:", timerRanAtStep2 < 200, "(шаг", timerRanAtStep2 + ")");`, { filename: "el4-starvation.mjs", lineNumbers: true }),
      code("text", `таймер сработал только после всех микрозадач: true
при планировании макрозадачами таймер вклинился в середину: true (шаг 1)`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Микрозадачи, порождающие микрозадачи,** не дают выполниться макрозадачам: таймер `setTimeout(…, 0)` сработал только после **всех** 100 000 шагов цепочки (и в браузере то же самое для отрисовки).",
        "**Цепочка макрозадач** (`setTimeout(loop2, 0)`) даёт таймеру вклиниться: он увидел начало работы (шаг 1 из 200).",
        "**Вывод:** длинную циклическую работу нужно разбивать **макрозадачами**, а не микрозадачами (`await` в цикле без реального ожидания — тоже микрозадачи!).",
      ),

      h("Вложенные таймеры и минимальная задержка"),
      code("html", `<!doctype html>
<meta charset="utf-8">
<script>
  window.gaps = [];
  let last = performance.now(), depth = 0;
  function step() {
    const now = performance.now();
    window.gaps.push(now - last);
    last = now;
    if (++depth < 14) setTimeout(step, 0);
    else window.done = true;
  }
  setTimeout(step, 0);
</script>`, { filename: "clamp-page.html", collapsed: true }),
      code("text", `вложенные setTimeout(…, 0), 14 уровней
средняя пауза на уровнях 2–5 меньше 2 мс: true
средняя пауза на уровнях 7–14 не меньше 4 мс: true`, { filename: "вывод Chromium 141 (по http)" }),
      ul(
        "**Стандарт HTML:** при вложенности `setTimeout` глубже 5 уровней задержка не меньше 4 мс. В замере первые уровни шли с паузой менее 2 мс, а с седьмого — не менее 4 мс.",
        "**Следствие:** рекурсивный `setTimeout(f, 0)` — не способ «выполнять как можно чаще»; для анимации — `requestAnimationFrame`, для разбиения работы — `scheduler.yield()`/`MessageChannel`.",
        "**Фоновые вкладки** ограничивают таймеры сильнее (обычно до одного раза в секунду).",
      ),

      h("Кооперативная работа: уступка управления"),
      p("Способ разбить работу: выполнять порцию, затем **уступить** потоку. Варианты уступки: `await new Promise((r) => setTimeout(r, 0))` (макрозадача), `await scheduler.yield()` (в Chromium 141 доступен — замер), `MessageChannel`, `requestIdleCallback` для необязательной работы."),
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Цикл событий: лаборатория</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 38rem; }
  button { font: inherit; padding: .35rem .9rem; margin: 0 .5rem .5rem 0; }
  pre { background: #8881; padding: .75rem; border-radius: 6px; min-height: 6rem; white-space: pre-wrap; }
  #box { width: 3rem; height: 3rem; background: #4f46e5; border-radius: 8px; position: relative; }
</style>
<h1>Цикл событий</h1>
<div id="box" role="img" aria-label="Движущийся квадрат"></div>
<p>
  <button id="order">Показать порядок</button>
  <button id="freeze">Заморозить на 1 с</button>
  <button id="chunk">То же порциями</button>
</p>
<pre id="log" aria-live="polite">Квадрат движется, пока поток свободен.</pre>
<script type="module">
  const box = document.querySelector("#box");
  const log = document.querySelector("#log");
  const busy = (ms) => { const end = performance.now() + ms; while (performance.now() < end); };

  // анимация: квадрат двигается на каждом кадре; при занятом потоке он замирает
  let x = 0, dir = 1;
  (function frame() {
    x += dir * 2;
    if (x > 200 || x < 0) dir = -dir;
    box.style.transform = \`translateX(\${x}px)\`;
    requestAnimationFrame(frame);
  })();

  document.querySelector("#order").addEventListener("click", () => {
    const lines = ["sync: начало"];
    setTimeout(() => { lines.push("setTimeout 0 (макрозадача)"); log.textContent = lines.join("\\n"); }, 0);
    Promise.resolve().then(() => lines.push("promise.then (микрозадача)"));
    queueMicrotask(() => lines.push("queueMicrotask (микрозадача)"));
    lines.push("sync: конец");
  });

  document.querySelector("#freeze").addEventListener("click", () => {
    log.textContent = "Считаю… интерфейс заморожен";
    busy(1000);                                         // длинная синхронная задача: ни кадров, ни кликов
    log.textContent = "Готово (квадрат стоял секунду)";
  });

  document.querySelector("#chunk").addEventListener("click", async () => {
    log.textContent = "Считаю порциями…";
    for (let i = 0; i < 100; i++) {
      busy(10);
      await new Promise((r) => setTimeout(r, 0));       // уступаем управление: квадрат продолжает двигаться
    }
    log.textContent = "Готово (квадрат двигался)";
  });
</script>`, { filename: "loop-lab.html", runnable: true, lineNumbers: true }),
      p("Замер в Chromium 141: квадрат движется в простое; «Показать порядок» печатает `sync: начало`, `sync: конец`, `promise.then`, `queueMicrotask`, `setTimeout 0`; во время «То же порциями» квадрат продолжает двигаться; «Заморозить на 1 с» останавливает анимацию на секунду. Ошибок страницы нет."),
    ]),

    section("syntax", [
      annotated(
        "js",
        `console.log("1: синхронно");

setTimeout(() => console.log("5: макрозадача (таймер)"), 0);

Promise.resolve().then(() => console.log("3: микрозадача (promise)"));
queueMicrotask(() => console.log("4: микрозадача (queueMicrotask)"));

console.log("2: синхронно");`,
        [
          { line: 1, text: "Синхронный код выполняется сразу, в порядке записи." },
          { line: 3, text: "`setTimeout` ставит колбэк в очередь **макрозадач**: он выполнится не раньше, чем освободится стек и опустеет очередь микрозадач." },
          { line: 5, text: "`Promise.resolve().then(…)` ставит колбэк в очередь **микрозадач**." },
          { line: 6, text: "`queueMicrotask` — прямой способ поставить микрозадачу без промиса." },
          { line: 8, text: "Эта строка синхронна и выполнится **до** любых колбэков: поэтому в выводе она второй." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      p("Минимальная проверка собственного понимания: что выведет программа ниже и в каком порядке? Затем сверьтесь с замером (задание «Предскажите порядок»)."),
      code("js", `const out = [];
const log = (x) => out.push(x);

log("A");
setTimeout(() => log("B"), 0);
Promise.resolve().then(() => log("C")).then(() => log("D"));
(async () => {
  log("E");
  await null;
  log("F");
})();
queueMicrotask(() => log("G"));
log("H");

setTimeout(() => console.log(out.join(" ")), 10);`, { filename: "x1-predict.mjs" }),
      code("text", `A E H C F G D B`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "`A`, `E`, `H` — синхронно (код `async`-функции до `await` тоже).",
        "Микрозадачи по очереди постановки: `C` (первый `then`), `F` (продолжение после `await`), `G` (`queueMicrotask`); `D` — второй `then` — ставится **во время** выполнения `C`, поэтому идёт после `G`.",
        "`B` — макрозадача — последней.",
      ),
    ]),

    section("detailed-example", [
      p("`processInChunks(items, fn, options)` — приём «кооперативной обработки»: выполняет `fn` для каждого элемента по порядку, а когда «бюджет» времени порции исчерпан, **уступает управление** циклу событий. Поддерживает отмену (`AbortSignal`), отчёт о прогрессе и подмену часов и функции уступки для детерминированных тестов."),
      code("js", `const defaultYield = () => new Promise((resolve) => setTimeout(resolve, 0));

// Обрабатывает элементы по порядку, уступая управление, когда «бюджет» времени порции исчерпан.
export async function processInChunks(items, fn, options = {}) {
  const { budgetMs = 8, signal, onProgress, now = () => performance.now(), yieldFn = defaultYield } = options;
  if (typeof fn !== "function") throw new TypeError("fn должна быть функцией");

  const results = [];
  let sliceStart = now();

  for (let i = 0; i < items.length; i++) {
    if (signal?.aborted) throw signal.reason ?? new DOMException("Операция отменена", "AbortError");
    results.push(await fn(items[i], i));

    const isLast = i === items.length - 1;
    if (!isLast && now() - sliceStart >= budgetMs) {
      onProgress?.(i + 1, items.length);
      await yieldFn();                                // отдаём управление: могут выполниться таймеры, ввод, отрисовка
      sliceStart = now();
    }
  }
  onProgress?.(items.length, items.length);
  return results;
}`, { filename: "chunks.mjs", lineNumbers: true }),
      code("js", `import { processInChunks } from "./chunks.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const busy = (ms) => { const end = performance.now() + ms; while (performance.now() < end); };

// 1. детерминированно, на фальшивых часах: каждый элемент «стоит» 3 мс, бюджет 8 мс
let clock = 0;
let yields = 0;
const progress = [];
const results = await processInChunks([...Array(10).keys()], (x) => { clock += 3; return x * 2; }, {
  budgetMs: 8, now: () => clock, yieldFn: async () => { yields++; }, onProgress: (done, total) => progress.push(\`\${done}/\${total}\`),
});
check("результаты в порядке элементов", results, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
check("уступка после каждых трёх элементов (3 × 3 мс ≥ 8 мс), но не после последнего", yields, 3);
check("прогресс после каждой порции и в конце", progress, ["3/10", "6/10", "9/10", "10/10"]);

// 2. асинхронные обработчики и пустой ввод
check("асинхронная fn", await processInChunks([1, 2, 3], async (x) => { await null; return x + 1; }), [2, 3, 4]);
check("пустой массив", await processInChunks([], () => 1), []);

// 3. ошибки
let type = "нет";
try { await processInChunks([1], "не функция"); } catch (e) { type = e.name; }
check("fn не функция — TypeError", type, "TypeError");
let msg = "нет";
try { await processInChunks([1, 2, 3], (x) => { if (x === 2) throw new Error("сбой на 2"); return x; }); } catch (e) { msg = e.message; }
check("ошибка обработчика прерывает обработку", msg, "сбой на 2");

// 4. отмена
const controller = new AbortController();
const seen = [];
let abortName = "нет";
try {
  await processInChunks([1, 2, 3, 4, 5], (x) => { seen.push(x); if (x === 2) controller.abort(); return x; }, { signal: controller.signal });
} catch (e) { abortName = e.name; }
check("отмена: AbortError и остановка после элемента 2", [abortName, seen], ["AbortError", [1, 2]]);

// 5. реальное время: «сердцебиение» не голодает
async function ticksDuring(work) {
  let ticks = 0;
  const id = setInterval(() => ticks++, 5);
  await sleep(20);
  ticks = 0;
  await work();
  clearInterval(id);
  return ticks;
}
const items = Array.from({ length: 40 }, (_, i) => i);
const monolithTicks = await ticksDuring(async () => { for (const _ of items) busy(5); });
const chunkedTicks = await ticksDuring(() => processInChunks(items, () => busy(5), { budgetMs: 10 }));
check("монолит блокирует таймер: за 200 мс работы ни одного удара", monolithTicks <= 1, true);
check("порциями: таймер продолжает работать (десятки ударов)", chunkedTicks >= 10, true);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "chunks-test.mjs", collapsed: true }),
      code("text", `Все 10 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Решение", "Что даёт", "Почему так"],
        [
          ["`sliceStart` и сравнение `now() - sliceStart >= budgetMs`", "Бюджет времени порции", "Измеряем реальное время, а не число элементов: элементы могут быть разной стоимости"],
          ["`await yieldFn()` — макрозадача (`setTimeout 0`)", "Цикл событий успевает выполнить таймеры, ввод, отрисовку", "Микрозадача (`await null`) не помогла бы: очередь микрозадач опустошается до макрозадач (см. «голодание»)"],
          ["`!isLast && …`", "Нет лишней уступки после последнего элемента", "В тесте: 10 элементов по 3 мс при бюджете 8 мс — 3 уступки, а не 4"],
          ["`now` и `yieldFn` как параметры", "Детерминированные тесты на фальшивых часах", "Тест проверяет число уступок и прогресс, не завися от скорости машины"],
          ["`signal?.aborted` перед каждым элементом", "Отмена между элементами", "Одиночный `fn` не прерывается, но обработка останавливается на границе элементов"],
          ["`results.push(await fn(...))`", "Поддержка асинхронных обработчиков", "Элементы обрабатываются строго последовательно; порядок результатов сохраняется"],
          ["`onProgress` после каждой порции и в конце", "Индикатор прогресса", "Прогресс публикуется в моменты уступки — интерфейс успеет его показать"],
        ],
        "Разбор processInChunks",
      ),
      ul(
        "Все 10 проверок проходят, включая реальное время: за ~200 мс работы монолитный цикл не дал таймеру ни одного удара, а `processInChunks` — десятки.",
        "**Компромисс:** уступка добавляет накладные расходы (минимум ~1 мс на `setTimeout`, а в браузере для вложенных — ≥ 4 мс), поэтому бюджет порции — не меньше нескольких миллисекунд (в примере 8–10 мс).",
        "**Для работы без ограничений на CPU** лучше `Web Worker` (отдельный поток), а не порции в основном.",
      ),
    ]),

    section("internals", [
      h("Алгоритм цикла событий (упрощённо)"),
      steps(
        [
          ["Выбрать задачу", "Взять самую старую готовую задачу из одной из очередей (таймеры, ввод, сеть…). Среда решает, из какой очереди брать; внутри одной очереди порядок FIFO."],
          ["Выполнить до конца", "Запустить колбэк; стек вызовов растёт и пустеет; прерывать задачу нельзя."],
          ["Микрозадачи", "Когда стек пуст, выполнить **все** микрозадачи (включая вновь добавленные) — «контрольная точка микрозадач»."],
          ["Отрисовка (браузер)", "Если пора: `requestAnimationFrame`-колбэки, стили, раскладка, рисование."],
          ["Повторить", "Вернуться к шагу 1; если задач нет — ждать событий."],
        ],
        "Итерация цикла событий",
      ),
      p("Микрозадачи выполняются не только после макрозадач, но и **каждый раз, когда стек вызовов пуст** (контрольная точка): например, после каждого колбэка события при настоящем клике (замер) и после каждого колбэка таймера. Если колбэк вызван из вашего кода (синтетический `click()`), стек не пуст, и контрольной точки между обработчиками нет."),
      h("Почему `await` — микрозадача"),
      p("`await x` оборачивает `x` в промис и подписывает продолжение функции через `then`: продолжение — микрозадача. Поэтому код после `await` выполняется после **синхронного** остатка текущей задачи, но раньше любых макрозадач (замер: `код после await — микрозадача`). Даже `await null` разбивает функцию на «до» и «после» и отдаёт управление вызывающему."),
      h("Таймеры в среде, а не в языке"),
      p("`setTimeout` не входит в ECMAScript: его описывает HTML Standard (браузер) и документация Node.js. Задержка — **минимальная**: колбэк ставится в очередь по истечении времени, но выполнится, когда освободится поток. В браузере вложенные таймеры (глубже 5) получают задержку не меньше 4 мс, фоновые вкладки — больше."),
      h("Фазы Node.js"),
      p("Цикл событий Node.js (libuv) состоит из фаз: таймеры (`setTimeout`/`setInterval`), колбэки ввода-вывода, `poll`, `check` (`setImmediate`), `close`. После каждого колбэка обрабатываются `process.nextTick` и микрозадачи. Поэтому внутри колбэка ввода-вывода `setImmediate` всегда раньше `setTimeout(0)` (замер), а из главного модуля порядок зависит от времени запуска."),
      h("Отрисовка и `requestAnimationFrame`"),
      p("Браузер не отрисовывает кадр во время выполнения JavaScript. `requestAnimationFrame` вызывается непосредственно перед отрисовкой следующего кадра; он удобен для анимаций, потому что синхронизирован с частотой обновления экрана. Как только вы блокируете поток дольше длительности кадра, кадры пропускаются (замер: пауза > 280 мс при цикле на 300 мс)."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Считать, что `setTimeout(f, 0)` выполняется сразу"),
      p("Колбэк станет макрозадачей: сначала весь текущий синхронный код и все микрозадачи (замер: `setTimeout 0` — последним). А в браузере вложенные таймеры получают задержку ≥ 4 мс."),
      h("Ошибка 2. Длинный синхронный цикл в обработчике"),
      wrongRight(
        "js",
        {
          code: `
            button.addEventListener("click", () => {
              for (const item of items) heavy(item);   // 300 мс без единого кадра
            });
          `,
          note: "Страница «зависает»: нет отрисовки и обработки ввода (замер: пауза между кадрами > 280 мс).",
        },
        {
          code: `
            button.addEventListener("click", async () => {
              await processInChunks(items, heavy, { budgetMs: 10 });
            });
          `,
          note: "Порции + уступка управления: страница отзывчива; для чистого CPU — Web Worker.",
        },
      ),
      h("Ошибка 3. Бесконечная цепочка микрозадач"),
      p("`queueMicrotask(loop)` в цикле не даёт выполниться таймерам и отрисовке до конца (замер: таймер дождался всех 100 000 шагов). Разбивайте работу макрозадачами."),
      h("Ошибка 4. Ожидать порядок между разными макро-источниками"),
      p("Порядок `setTimeout`, `MessageChannel`, `requestAnimationFrame` и `setImmediate` не гарантирован (замер: менялся между прогонами). Закладывайтесь только на порядок «синхронно → микрозадачи → макрозадачи»."),
      h("Ошибка 5. Полагаться на порядок `process.nextTick` и промисов"),
      p("В CommonJS `nextTick` раньше `Promise.then`, в модуле ES — позже (замер). Не комбинируйте их для управления порядком."),
      h("Ошибка 6. Путать настоящий и синтетический клик"),
      p("Тесты с `element.click()` ведут себя иначе, чем настоящий клик: микрозадачи между обработчиками не выполняются (замер). Для реалистичных тестов используйте события ввода тестового драйвера (Playwright)."),
      h("Ошибка 7. Проверять «точность» таймера"),
      p("`setTimeout(f, 10)` означает «не раньше, чем через 10 мс». Для измерения времени используйте `performance.now()`, а не число тиков таймеров."),
      h("Ошибка 8. `await` без реального ожидания в «горячем» цикле"),
      p("`for (…) { await null; … }` разбивает работу на микрозадачи и **не** отдаёт управление отрисовке и вводу. Для уступки нужен макрозадачный `await` (таймер, `scheduler.yield()`)."),
    ]),

    section("antipatterns", [
      ul(
        "**Тяжёлые вычисления в основном потоке** без разбиения и без Web Worker.",
        "**Рекурсивный `setTimeout(f, 0)` как «быстрый таймер»:** задержки ≥ 4 мс и нагрузка; используйте `requestAnimationFrame` или `scheduler`.",
        "**Опора на тонкости порядка Node.js** (`nextTick` против промисов, `setImmediate` против таймера) в прикладном коде.",
        "**Бесконечные цепочки `then`/`await` без точек уступки.**",
        "**Блокирующие API** (синхронное чтение файлов, `Atomics.wait`) в серверных обработчиках.",
        "**`setInterval` для периодических задач с длительной работой:** тики накапливаются; используйте рекурсивный `setTimeout` после завершения работы.",
        "**Измерение времени «по таймеру»:** `performance.now()` — единственный надёжный источник.",
        "**Тесты, зависящие от реальной задержки** (`await sleep(100)`) вместо управляемых часов.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Держите задачи короткими:** цель — меньше 50 мс; кадр — 16 мс.",
        "**Разбивайте длинную работу на порции** и уступайте управление (`setTimeout`, `scheduler.yield()`, `MessageChannel`).",
        "**Тяжёлые вычисления — в Web Worker.**",
        "**Для анимации — `requestAnimationFrame`;** для необязательной работы — `requestIdleCallback`.",
        "**Рассчитывайте только на гарантированное:** синхронный код → микрозадачи → макрозадачи.",
        "**Не создавайте бесконечные цепочки микрозадач** без макрозадачной уступки.",
        "**Внедряйте часы и планировщик в тестируемый код** (`now`, `yieldFn`), чтобы тесты были детерминированными.",
        "**Смотрите вкладку Performance:** «долгие задачи» (Long tasks) и «Main thread» покажут, где поток занят.",
      ),
      tip("Чтобы проверить, блокирует ли код страницу, откройте DevTools → Performance, запишите действие и найдите «красные» долгие задачи (> 50 мс). В консоли `performance.now()` до и после операции покажет её длительность."),
    ]),

    section("edge-cases", [
      h("`setInterval` и накопление"),
      p("Если колбэк `setInterval` работает дольше интервала, браузер не выполняет пропущенные тики «пачкой», но следующий тик ставится сразу после завершения; в Node.js тоже нет накопления. Для периодической работы с переменной длительностью используйте рекурсивный `setTimeout`."),
      h("Фоновые вкладки и энергосбережение"),
      p("В неактивных вкладках браузеры замедляют таймеры (обычно не чаще раза в секунду) и приостанавливают `requestAnimationFrame`. Не полагайтесь на таймеры для точного времени."),
      h("`MutationObserver` и `ResizeObserver`"),
      p("`MutationObserver` — микрозадача (замер: в списке микрозадач), а `ResizeObserver`/`IntersectionObserver` срабатывают в конце кадра/отрисовки. Это влияет на порядок обработки изменений DOM."),
      h("Синхронные API ввода-вывода"),
      p("В Node.js `fs.readFileSync` блокирует цикл событий: никакие таймеры и запросы не обрабатываются, пока не закончится чтение. На сервере — только асинхронные варианты."),
      h("`await` верхнего уровня и порядок инициализации"),
      p("Top-level `await` в модуле откладывает выполнение зависимых модулей, но не блокирует цикл событий: другие задачи продолжают выполняться."),
      h("Вложенные циклы событий"),
      p("Диалоги `alert`, `confirm`, `prompt` и синхронный `XMLHttpRequest` блокируют основной поток (замер подобного — синхронный цикл); в современном коде их избегают."),
    ]),

    section("related", [
      ul(
        "[Что такое JavaScript](/learn/js/what-is-js) — однопоточность и порядок загрузки скриптов.",
        "[Замыкания](/learn/js/closures) — колбэки, таймеры, `debounce`.",
        "[Итераторы и генераторы](/learn/js/iterators-generators) — приостановка и возобновление функций.",
        "[Загрузка ресурсов](/learn/html/resource-loading) — как скрипты и ресурсы влияют на отрисовку.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Монолитный цикл блокирует интерфейс",
          code: `
            function importAll(rows) {
              const results = [];
              for (const row of rows) results.push(parse(row));   // 100 000 строк подряд
              render(results);
            }
          `,
          note: "Страница не отзывается и не отрисовывается, пока цикл не закончится (в замере 300 мс блокировки — пауза между кадрами > 280 мс).",
        },
        {
          title: "Порции с уступкой управления",
          code: `
            async function importAll(rows, signal) {
              const results = await processInChunks(rows, parse, {
                budgetMs: 10,
                signal,
                onProgress: (done, total) => showProgress(done / total),
              });
              render(results);
            }
          `,
          note: "Интерфейс отзывчив, виден прогресс, работу можно отменить; тяжёлую работу при необходимости выносят в Web Worker.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.event-loop.ex1",
      title: "Предскажите порядок",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код, запишите порядок букв, которые будут напечатаны (код выше в разделе «Минимальный пример»). Для каждой буквы назовите очередь: синхронный код, микрозадача или макрозадача."),
        code("js", `const out = [];
const log = (x) => out.push(x);

log("A");
setTimeout(() => log("B"), 0);
Promise.resolve().then(() => log("C")).then(() => log("D"));
(async () => {
  log("E");
  await null;
  log("F");
})();
queueMicrotask(() => log("G"));
log("H");

setTimeout(() => console.log(out.join(" ")), 10);`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Что выполняется синхронно в `async`-функции до `await`?", "Когда ставится в очередь второй `then` в цепочке?"],
      checks: ["Порядок `A E H C F G D B`", "Названы очереди для каждой буквы", "Объяснено место `D`"],
      solution: [
        code("text", `A E H C F G D B`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "Синхронно: `A`, `E` (до `await`), `H`.",
          "Микрозадачи в порядке постановки: `C`, `F` (продолжение после `await`), `G`; `D` (второй `then`) ставится в очередь, когда `C` завершился, — после `G`.",
          "Макрозадача: `B` (таймер) — последним.",
        ),
      ],
    }),
    exercise({
      id: "js.event-loop.ex2",
      title: "Страница замирает",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Обработчик обрабатывает 60 элементов по 5 мс в одном цикле, и «интерфейс» (счётчик кадров) во время работы не обновляется. Объясните причину и перепишите обработку порциями так, чтобы кадры продолжали идти."),
      ],
      hints: ["Что может выполниться, пока цикл не вернул управление?", "Какая очередь даёт шанс таймерам и отрисовке — микро- или макро-?"],
      checks: ["Названа причина (занятый поток)", "Исправление через макрозадачу", "Подтверждено числом кадров во время работы"],
      solution: [
        code("js", `const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const busy = (ms) => { const end = performance.now() + ms; while (performance.now() < end); };

// «интерфейс»: счётчик «кадров» каждые 5 мс; возвращаем число кадров, прошедших во время работы
async function frames(work) {
  let n = 0;
  const id = setInterval(() => n++, 5);
  await sleep(20);
  n = 0;
  await work();
  const during = n;                         // сколько кадров прошло ВО ВРЕМЯ работы
  clearInterval(id);
  return during;
}

const items = Array.from({ length: 60 }, (_, i) => i);
const heavy = () => busy(5);                                        // обработка одного элемента ≈ 5 мс

// Было: всё в одном синхронном цикле — «интерфейс» замирает на ≈ 300 мс
const freezing = await frames(async () => { for (const item of items) heavy(item); });

// Стало: порции по ≈ 10 мс, между ними отдаём управление циклу событий
const smooth = await frames(async () => {
  let sliceStart = performance.now();
  for (const item of items) {
    heavy(item);
    if (performance.now() - sliceStart >= 10) {
      await new Promise((r) => setTimeout(r, 0));
      sliceStart = performance.now();
    }
  }
});

console.log("кадры во время монолитной обработки не обновлялись (не больше 1):", freezing <= 1);
console.log("кадры при обработке порциями продолжали идти (не меньше 20):", smooth >= 20);`, { filename: "x2-freeze.mjs" }),
        code("text", `кадры во время монолитной обработки не обновлялись (не больше 1): true
кадры при обработке порциями продолжали идти (не меньше 20): true`, { filename: "вывод Node.js 22.22.0" }),
        p("Пока цикл не завершился, цикл событий не может взять следующую задачу, поэтому таймеры (и в браузере отрисовка) ждут. Уступка управления через **макрозадачу** (`setTimeout(0)`) между порциями позволяет им выполниться."),
      ],
    }),
    exercise({
      id: "js.event-loop.ex3",
      title: "Таймер, который никогда не срабатывает вовремя",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Цикл на 50 000 шагов планирует каждую итерацию через `queueMicrotask`; таймер `setTimeout(…, 0)`, созданный до начала работы, видит все 50 000 шагов выполненными. Объясните причину и перепишите цикл так, чтобы таймер сработал в начале работы, не меняя количества шагов."),
      ],
      hints: ["Какие очереди опустошаются раньше макрозадач?", "Как часто стоит уступать управление, чтобы не замедлить работу?"],
      checks: ["Названа причина (голодание микрозадачами)", "Уступка макрозадачей раз в тысячу шагов", "Таймер срабатывает в первых 5000 шагов"],
      solution: [
        code("js", `const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TOTAL = 50_000;

// Было: каждая итерация планирует следующую микрозадачей — таймер ждёт конца всей цепочки
let stepsBefore = 0, timerSawBefore = null;
setTimeout(() => { timerSawBefore = stepsBefore; }, 0);
(function loop() { if (++stepsBefore < TOTAL) queueMicrotask(loop); })();
await sleep(50);

// Стало: раз в 1000 итераций уступаем макрозадачей — таймер вклинивается в середину
let stepsAfter = 0, timerSawAfter = null;
setTimeout(() => { timerSawAfter = stepsAfter; }, 0);
await (async function run() {
  while (stepsAfter < TOTAL) {
    stepsAfter++;
    if (stepsAfter % 1000 === 0) await new Promise((r) => setTimeout(r, 0));
  }
})();

console.log("было: таймер увидел все", TOTAL, "шагов:", timerSawBefore === TOTAL);
console.log("стало: таймер сработал в начале работы (в первых 5000 шагах):", timerSawAfter < 5000);`, { filename: "x3-starve.mjs" }),
        code("text", `было: таймер увидел все 50000 шагов: true
стало: таймер сработал в начале работы (в первых 5000 шагах): true`, { filename: "вывод Node.js 22.22.0" }),
        p("Очередь микрозадач опустошается целиком до следующей макрозадачи, а каждая итерация добавляет новую микрозадачу — очередь не пустеет до конца работы. Уступка раз в 1000 шагов макрозадачей (`await new Promise(r => setTimeout(r, 0))`) позволяет таймеру выполниться; частота уступок — компромисс между отзывчивостью и накладными расходами."),
      ],
    }),
  ],

  challenge: {
    id: "js.event-loop.challenge",
    title: "processInChunks: обработка без заморозки",
    scenario: [
      p("Приложению нужно обрабатывать большие списки (импорт, пересчёт, поиск) без блокировки интерфейса и с возможностью отмены и показа прогресса. Реализуйте модуль `chunks.mjs` с функцией `processInChunks(items, fn, options)`."),
    ],
    requirements: [
      "Элементы обрабатываются строго по порядку, `fn(item, index)` может быть асинхронной; результат — массив результатов в порядке элементов",
      "Когда с начала текущей порции прошло не меньше `budgetMs` (по умолчанию 8), функция уступает управление через `yieldFn` (по умолчанию `setTimeout(0)`); после последнего элемента уступки нет",
      "`onProgress(done, total)` вызывается после каждой порции и в конце",
      "`signal` (`AbortSignal`): отмена проверяется перед каждым элементом, ошибка — `AbortError`; ошибка `fn` прерывает обработку и пробрасывается",
      "Часы (`now`) и уступка (`yieldFn`) подменяются параметрами; не-функция вместо `fn` — `TypeError`",
    ],
    constraints: [
      "Не использовать микрозадачную уступку (`await null`): она не отдаёт управление таймерам и отрисовке",
      "Без внешних библиотек",
    ],
    acceptance: [
      "Все 10 проверок из теста проходят (включая детерминированные на фальшивых часах)",
      "За ~200 мс работы таймер с шагом 5 мс успевает «ударить» не менее 10 раз при обработке порциями и не более 1 раза — при монолитном цикле",
      "После отмены `fn` больше не вызывается",
    ],
    hints: [
      "Как измерять время порции, а не число элементов?",
      "Почему уступка должна быть макрозадачей?",
      "Что передавать в `onProgress` в момент уступки?",
    ],
    solution: [
      code("js", `const defaultYield = () => new Promise((resolve) => setTimeout(resolve, 0));

// Обрабатывает элементы по порядку, уступая управление, когда «бюджет» времени порции исчерпан.
export async function processInChunks(items, fn, options = {}) {
  const { budgetMs = 8, signal, onProgress, now = () => performance.now(), yieldFn = defaultYield } = options;
  if (typeof fn !== "function") throw new TypeError("fn должна быть функцией");

  const results = [];
  let sliceStart = now();

  for (let i = 0; i < items.length; i++) {
    if (signal?.aborted) throw signal.reason ?? new DOMException("Операция отменена", "AbortError");
    results.push(await fn(items[i], i));

    const isLast = i === items.length - 1;
    if (!isLast && now() - sliceStart >= budgetMs) {
      onProgress?.(i + 1, items.length);
      await yieldFn();                                // отдаём управление: могут выполниться таймеры, ввод, отрисовка
      sliceStart = now();
    }
  }
  onProgress?.(items.length, items.length);
  return results;
}`, { filename: "chunks.mjs", lineNumbers: true }),
      code("text", `Все 10 проверок пройдены`, { filename: "результат запуска тестов" }),
      p("`sliceStart` отмечает начало порции; после каждого элемента проверяется бюджет, и при его исчерпании вызывается `onProgress` и `await yieldFn()` (макрозадача), затем `sliceStart` обновляется. Подмена `now`/`yieldFn` делает логику проверяемой без реальных задержек."),
    ],
  },

  interview: [
    iq("js.event-loop.i1", "basic", "Что такое цикл событий?", [
      p("Механизм среды, который берёт задачи из очередей и выполняет каждую до конца в одном потоке; после каждой задачи выполняет микрозадачи, а в браузере иногда отрисовывает кадр. Благодаря ему однопоточный JavaScript умеет «ждать» таймеры, события и сеть, не блокируясь."),
    ]),
    iq("js.event-loop.i2", "basic", "Чем микрозадача отличается от макрозадачи?", [
      ul(
        "Макрозадача — единица работы цикла событий (таймер, событие, сетевой ответ); берётся по одной.",
        "Микрозадача (`Promise.then`, `queueMicrotask`, `await`, `MutationObserver`) выполняется сразу после текущей задачи, пока стек пуст, до следующей макрозадачи и отрисовки.",
        "Очередь микрозадач опустошается целиком, включая добавленные во время выполнения.",
      ),
    ]),
    iq("js.event-loop.i3", "intermediate", "В каком порядке выполнится: `console.log(1); setTimeout(() => console.log(2), 0); Promise.resolve().then(() => console.log(3)); console.log(4);`?", [
      ul(
        "`1`, `4` (синхронно), затем `3` (микрозадача), затем `2` (макрозадача).",
        "Микрозадачи выполняются до любого таймера, даже с задержкой 0.",
      ),
    ]),
    iq("js.event-loop.i4", "intermediate", "Почему `setTimeout(f, 0)` не выполняется мгновенно?", [
      ul(
        "Колбэк становится макрозадачей: сначала должен закончиться текущий синхронный код и все микрозадачи.",
        "Задержка — минимальная: в браузере вложенные таймеры (глубже 5) ≥ 4 мс (замер), в фоновых вкладках — ещё больше.",
        "Если поток занят, колбэк ждёт (замер: таймер на 10 мс сработал после 200 мс блокировки).",
      ),
    ]),
    iq("js.event-loop.i5", "intermediate", "Что произойдёт, если выполнить длинный синхронный цикл в обработчике клика?", [
      ul(
        "Цикл событий не может выполнить ничего другого: интерфейс не реагирует на ввод и не отрисовывается (пауза между кадрами в замере > 280 мс для 300 мс работы).",
        "Решения: разбить работу на порции с уступкой управления, вынести в Web Worker, уменьшить объём данных.",
      ),
    ]),
    iq("js.event-loop.i6", "advanced", "Почему микрозадачи при настоящем клике и при `element.click()` из скрипта выполняются в разном порядке?", [
      ul(
        "При настоящем клике браузер вызывает обработчики из пустого стека: после каждого обработчика — контрольная точка микрозадач.",
        "При `click()` из скрипта стек не пуст: оба обработчика выполняются подряд, микрозадачи — после завершения вашего скрипта (замер).",
        "Следствие: синтетические события в тестах могут вести себя не как настоящие.",
      ),
    ]),
    iq("js.event-loop.i7", "engineering", "Как обработать 100 000 элементов, не замораживая страницу?", [
      ul(
        "Порции по ~10 мс (по времени, а не по числу элементов) и уступка управления макрозадачей (`setTimeout 0`, `scheduler.yield()`).",
        "Индикатор прогресса и отмена (`AbortSignal`).",
        "Тяжёлую работу — в Web Worker; результат передавать сообщением.",
        "Не использовать микрозадачную уступку (`await null`): она не даёт отрисоваться.",
      ),
    ]),
    iq("js.event-loop.i8", "debugging", "Колбэк таймера «не срабатывает», пока идёт большой цикл с `await`. Что происходит?", [
      ul(
        "Если `await` не ждёт реальной макрозадачи (значение уже готово), продолжение — микрозадача: очередь микрозадач не пустеет, таймеру не дают выполниться (голодание).",
        "Исправление: уступать управление макрозадачей раз в N итераций (`await new Promise(r => setTimeout(r, 0))`), либо `scheduler.yield()`.",
        "Проверка: счётчик шагов в момент срабатывания таймера.",
      ),
    ]),
  ],

  exam: [
    mcq("js.event-loop.e1", "foundation", "Что выполнится раньше: `setTimeout(f, 0)` или `Promise.resolve().then(g)`?", ["`f`", "Одновременно", "`g`", "Зависит от браузера"], 2, "Микрозадачи (`then`) выполняются сразу после текущей задачи, до любой макрозадачи (таймера)."),
    mcq("js.event-loop.e2", "foundation", "Какой код в `async`-функции выполняется синхронно?", ["До первого `await` включительно", "Только после `await`", "Весь код", "Ничего"], 0, "Код до первого `await` выполняется сразу; всё после — микрозадача (замер: `async-функция: код до первого await — синхронно`)."),
    mcq("js.event-loop.e3", "intermediate", "Что выведет `console.log('A'); setTimeout(() => console.log('B'), 0); Promise.resolve().then(() => console.log('C')); console.log('D');`?", ["`A B C D`", "`A D B C`", "`A C D B`", "`A D C B`"], 3, "Синхронно `A`, `D`; затем микрозадача `C`; в конце макрозадача `B`."),
    mcq("js.event-loop.e4", "intermediate", "Что произойдёт, если микрозадача каждую итерацию планирует новую микрозадачу 100 000 раз?", ["Таймер сработает посередине", "Таймер и отрисовка ждут окончания всей цепочки", "Бросится `RangeError`", "Цепочка остановится на 1000-м шаге"], 1, "Очередь микрозадач опустошается целиком до следующей макрозадачи (замер: таймер увидел все 100 000 шагов)."),
    mcq("js.event-loop.e5", "intermediate", "Что относится к микрозадачам? Выберите все.", ["`Promise.then`", "`setTimeout`", "`queueMicrotask`", "`MutationObserver`"], [0, 2, 3], "Таймеры — макрозадачи; промисы, `queueMicrotask` и `MutationObserver` — микрозадачи."),
    mcq("js.event-loop.e6", "advanced", "Почему при `button.click()` из скрипта микрозадачи обработчиков выполняются после обоих обработчиков, а при настоящем клике — между ними?", ["Из-за ошибки в браузере", "Обработчики вызываются параллельно", "Микрозадачи при клике — макрозадачи", "При синтетическом вызове стек не пуст, и контрольной точки микрозадач между обработчиками нет"], 3, "Контрольная точка микрозадач выполняется, когда стек пуст; при настоящем клике — после каждого обработчика (замер)."),
    open("js.event-loop.e7", "intermediate", "Объясните, почему тяжёлый синхронный цикл «замораживает» страницу и как этого избежать.", [
      ul(
        "Цикл событий не может прервать выполняющуюся задачу: пока она не закончилась, не выполняются ни обработчики ввода, ни таймеры, ни отрисовка кадров.",
        "Избежать: разбить работу на порции по времени и уступать управление макрозадачей между ними; вынести CPU-работу в Web Worker; уменьшить объём работы (виртуализация, ленивые вычисления).",
        "Проверять: DevTools → Performance → долгие задачи (> 50 мс).",
      ),
    ], ["Названа причина (задача не прерывается)", "Названы порции и Worker", "Упомянут инструмент измерения"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.event-loop.m1", "intermediate", "Чему равен порядок вывода `A E H C F G D B` для программы из задания?", ["Он случаен", "`B` раньше `C`", "Синхронно `A E H`, микрозадачи `C F G D`, макрозадача `B`", "`D` раньше `C`"], 2, "`D` — второй `then` — ставится в очередь только после выполнения `C`, поэтому идёт после `F` и `G`."),
    mcq("js.event-loop.m2", "advanced", "Почему `await null` в цикле не отдаёт управление отрисовке?", ["Потому что `await` синхронный", "Продолжение — микрозадача, очередь микрозадач опустошается до отрисовки", "Потому что `null` не промис", "Из-за строгого режима"], 1, "Микрозадачи выполняются раньше макрозадач и отрисовки; нужен макрозадачный `await` (таймер, `scheduler.yield()`)."),
    mcq("js.event-loop.m3", "advanced", "Какой порядок гарантирован внутри колбэка ввода-вывода в Node.js?", ["`nextTick` → `promise.then` → `setImmediate` → `setTimeout 0`", "`setTimeout 0` → `setImmediate`", "`setImmediate` → `nextTick`", "Порядок не определён"], 0, "Замер: внутри колбэка ввода-вывода `setImmediate` всегда раньше `setTimeout 0`; микрозадачи и `nextTick` — сразу после колбэка."),
    open("js.event-loop.m4", "advanced", "В веб-приложении интерфейс «подлагивает» при прокрутке большого списка с фильтром по вводу. Опишите диагностику и план исправления с точки зрения цикла событий.", [
      ul(
        "Диагностика: запись в Performance; искать долгие задачи (> 50 мс) на главном потоке, пропущенные кадры, чем заняты обработчики ввода (фильтрация, рендер).",
        "Причины: синхронная фильтрация большого массива на каждый ввод, полная перерисовка списка, тяжёлые обработчики прокрутки.",
        "Исправления: `debounce` ввода, фильтрация порциями с уступкой (`processInChunks`) и отменой предыдущей, виртуализация списка (рендер только видимого), вынос фильтра в Web Worker, `passive`-слушатели прокрутки.",
        "Контроль: бюджет долгих задач в мониторинге (Long Tasks API), замеры до и после.",
      ),
    ], ["Описана диагностика", "Названы причины", "Предложены порции/виртуализация/Worker", "Упомянут контроль"], { format: "debug" }),
  ],

  flashcards: [
    { id: "js.event-loop.f1", front: "Цикл событий?", back: "Задача целиком → все микрозадачи → (браузер) отрисовка → следующая задача. Одна задача за раз, без прерывания." },
    { id: "js.event-loop.f2", front: "Микро и макро?", back: "Микро: Promise.then, queueMicrotask, await, MutationObserver — до любой макрозадачи. Макро: таймеры, события, сеть, MessageChannel." },
    { id: "js.event-loop.f3", front: "Порядок гарантирован?", back: "Синхронный код → микрозадачи → макрозадачи. Порядок разных макро-источников (timeout, MessageChannel, rAF) — нет." },
    { id: "js.event-loop.f4", front: "Блокировка?", back: "Долгая синхронная задача останавливает ввод и кадры (300 мс → пауза > 280 мс). Решение: порции + макрозадачная уступка, Worker." },
    { id: "js.event-loop.f5", front: "Голодание?", back: "Цепочка микрозадач не пускает таймеры и отрисовку. Уступайте макрозадачей (setTimeout 0, scheduler.yield())." },
    { id: "js.event-loop.f6", front: "click() и настоящий клик?", back: "Настоящий: микрозадачи между обработчиками. click() из скрипта: после всего скрипта (стек не пуст)." },
    { id: "js.event-loop.f7", front: "Node.js?", back: "nextTick: в CJS раньше промисов, в ESM позже; в I/O-колбэке: setImmediate раньше setTimeout 0; из main порядок не гарантирован." },
  ],

  sources: [
    { title: "HTML Standard: Event loops", url: "https://html.spec.whatwg.org/multipage/webappapis.html#event-loops", publisher: "WHATWG" },
    { title: "HTML Standard: Timers (вложенность и минимальная задержка)", url: "https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers", publisher: "WHATWG" },
    { title: "HTML Standard: queueMicrotask", url: "https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#microtask-queuing", publisher: "WHATWG" },
    { title: "ECMAScript: Jobs and Job Abstract Operations", url: "https://tc39.es/ecma262/#sec-jobs", publisher: "ECMA" },
    { title: "Node.js: The Node.js Event Loop", url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick", publisher: "Other" },
    { title: "MDN: JavaScript execution model", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model", publisher: "MDN" },
    { title: "MDN: Using microtasks in JavaScript with queueMicrotask()", url: "https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide", publisher: "MDN" },
    { title: "MDN: window.requestAnimationFrame()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame", publisher: "MDN" },
    { title: "MDN: Scheduler.yield()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield", publisher: "MDN" },
  ],
};
