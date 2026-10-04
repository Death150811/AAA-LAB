import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
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

export const asyncAwaitAbort: Topic = {
  id: "js.async-await-abort",
  slug: "async-await-abort",
  domain: "js",
  module: "async",
  title: "async/await, отмена и AbortController",
  titleEn: "async/await, cancellation and AbortController",
  summary:
    "`async`-функция всегда возвращает `Promise`, а `await` приостанавливает **только её** до результата обещания, не блокируя поток: код после `await` — микрозадача. Тема на замерах в Node.js 22 и Chromium 141 разбирает последовательные и параллельные `await` (≈ 100 мс против ≈ 50 мс для двух операций по 50 мс), циклы (`for…of` ждёт, `forEach` и `map` — нет), `try/catch/finally` и `return await`, «висящие» обещания, которые роняют процесс, а затем — отмену: `AbortController` и `AbortSignal` (`abort`, `reason`, `throwIfAborted`, `AbortSignal.timeout`, `AbortSignal.any`), `fetch` с сигналом (обрыв виден серверу), кооперативную отмену своих функций, гонку «поиск при вводе» и приём «побеждает последний». В конце вы пишете `createLatestSearch` и `fetchJson`.",
  minutes: 90,
  prerequisites: ["js.promises"],
  tags: ["async", "await", "try/catch", "AbortController", "AbortSignal", "AbortError", "TimeoutError", "fetch", "cancellation", "race condition", "debounce", "return await", "parallel", "sequential", "floating promise"],
  keyConcepts: [
    { term: "`async` = обещание, `await` = подписка", text: "`async function f() { return 42 }` возвращает `Promise` (`pf instanceof Promise`); `throw` внутри — отказ. `await` приостанавливает только эту функцию: «вызывающий: сразу после вызова» напечатан раньше «work: после await»." },
    { term: "Параллелизм — это когда обещания созданы до `await`", text: "`await a(); await b()` — последовательно (≈ 100 мс для двух операций по 50 мс); `await Promise.all([a(), b()])` или «создать оба, ждать потом» — параллельно (< 90 мс)." },
    { term: "`for…of` ждёт, `forEach` и `map` — нет", text: "`forEach(async …)` не дожидается колбэков; `map(async …)` возвращает массив обещаний. Нужны `for…of` с `await` (последовательно) или `Promise.all(array.map(…))` (параллельно)." },
    { term: "`return await` внутри `try`", text: "Без `await` отказ случится уже после выхода из `try`, и `catch` его не увидит (замер: «не поймано: отказ»). С `return await` — «поймано внутри»." },
    { term: "Отмена — это сигнал, а не принуждение", text: "`controller.abort()` лишь **сообщает** через `signal`; `fetch` прерывает запрос и отклоняется `AbortError` (сервер увидел обрыв), а собственная функция должна сама слушать сигнал, проверять `signal.aborted` и чистить ресурсы." },
  ],
  sections: [
    section("definition", [
      def("`async`-функция", "Функция, объявленная с `async`: всегда возвращает `Promise` (значение `return` — выполнение, `throw` — отказ) и может использовать `await` внутри.", "async function"),
      def("`await`", "Оператор внутри `async`-функции (или на верхнем уровне модуля): приостанавливает функцию до завершения обещания и возвращает его значение либо бросает причину отказа.", "await"),
      def("Последовательное и параллельное выполнение", "Последовательное: следующая операция стартует после завершения предыдущей. Параллельное: операции стартуют сразу, ожидание — общее.", "sequential / parallel"),
      def("Висящее обещание (floating promise)", "Обещание, на результат или отказ которого никто не подписан (забытый `await`/`catch`): ошибки теряются или становятся необработанными отказами.", "floating promise"),
      def("`AbortController`", "Объект-пульт отмены: метод `abort(reason)` переводит связанный `signal` в состояние «отменено».", "AbortController"),
      def("`AbortSignal`", "Объект-сигнал: свойства `aborted` и `reason`, событие `abort`, метод `throwIfAborted()`, фабрики `AbortSignal.timeout(ms)`, `AbortSignal.any([...])`, `AbortSignal.abort()`.", "AbortSignal"),
      def("`AbortError` и `TimeoutError`", "Имена `DOMException` для причины отмены: `AbortError` — вызвали `abort()`, `TimeoutError` — вышло время `AbortSignal.timeout`.", "AbortError / TimeoutError"),
      def("Гонка запросов (race condition)", "Ситуация, когда ответ на более ранний запрос приходит позже ответа на более поздний и перезаписывает актуальные данные.", "request race"),
    ]),

    section("why", [
      h("Читаемый асинхронный код и управляемые операции"),
      p("`async/await` делает асинхронный код похожим на синхронный: линейный текст, `try/catch`, `return`. Но за простотой прячутся ловушки: «лишние» последовательные ожидания, потерянные ошибки, `forEach`, который «не ждёт», запросы, которые нельзя прервать, и гонки, когда на экране остаётся результат устаревшего запроса. Всё это — повседневные дефекты реальных приложений."),
      ul(
        "**Производительность:** три независимых запроса по `await` подряд — втрое медленнее, чем параллельно.",
        "**Надёжность:** корректная обработка ошибок и очистка ресурсов (`finally`), отсутствие «висящих» обещаний.",
        "**Отзывчивость:** отмена ненужных операций (уход со страницы, новый поисковый запрос) экономит сеть и память и исключает показ устаревших данных.",
        "**Контракт API:** функции, принимающие `{ signal }`, становятся совместимыми с `fetch`, потоками и таймерами.",
      ),
      insight("`await` — это «подождать **эту** операцию»; параллелизм получается, когда **запуск** и **ожидание** разделены. А отмена — это договорённость: тот, кто отменяет, шлёт сигнал; тот, кто выполняет, **обязан** его слушать."),
    ]),

    section("mental-model", [
      p("**`await` — это закладка в книге.** Когда функция доходит до `await`, она ставит закладку и **отдаёт книгу** вызывающему коду: тот читает дальше свои страницы. Когда обещание завершится, цикл событий возвращает книгу и функция продолжается с закладки (микрозадача). Поэтому функция выглядит линейно, а на деле «нарезана» на куски вокруг `await`. **Параллелизм** — это когда вы раздали заказы нескольким курьерам (создали обещания) и только потом начали ждать; **последовательность** — когда вы отправили одного курьера, дождались и только потом отправили второго. **Отмена** — это «красный флажок» (`signal`) на двери: курьер, который ходит мимо, видит флажок и разворачивается (`fetch` делает это сам), а ваша функция должна **смотреть на флажок сама** и, увидев, сворачивать работу и убирать за собой."),
      table(
        ["Задача", "Приём", "Замечание"],
        [
          ["Независимые операции — быстро", "`await Promise.all([...])` или стартовать до `await`", "Один отказ отклоняет `all` (остальные не отменяются)"],
          ["Зависимые операции — по порядку", "`await` подряд, `for…of` с `await`", "Каждая стартует после предыдущей"],
          ["Нужны результаты всех, даже с ошибками", "`Promise.allSettled`", "Не отклоняется; проверьте `status`"],
          ["Ограничить время", "`AbortSignal.timeout(ms)`", "Причина — `TimeoutError`"],
          ["Отменить вручную", "`controller.abort(reason?)`", "Причина по умолчанию — `AbortError`"],
          ["Отмена или время — что раньше", "`AbortSignal.any([signal, timeout])`", "Объединяет сигналы"],
          ["Показывать только свежий результат", "Отмена предыдущего запроса или номер версии", "Защита от гонки"],
        ],
        "Приёмы управления асинхронными операциями",
      ),
    ]),

    section("technical", [
      h("`async`/`await`: основы и параллелизм"),
      code("js", `const wait = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));

// async-функция всегда возвращает обещание
async function f() { return 42; }
async function g() { throw new Error("сбой"); }
const pf = f();
console.log(pf instanceof Promise, await pf, await g().catch((e) => e.message));

// await приостанавливает ТОЛЬКО эту функцию; вызывающий код продолжает работу
const log = [];
async function work() {
  log.push("work: до await");
  await null;
  log.push("work: после await (микрозадача)");
}
const p = work();
log.push("вызывающий: сразу после вызова work()");
await p;
console.log(log.join("\\n"));

// await не-обещания разрешается через микрозадачу, а thenable — вызовом его then
console.log(await 5, await { then(resolve) { resolve("из thenable"); } });

// последовательно и параллельно
const t0 = performance.now();
const a = await wait(50, "a");
const b = await wait(50, "b");
const sequential = performance.now() - t0;

const t1 = performance.now();
const [c, d] = await Promise.all([wait(50, "c"), wait(50, "d")]);
const parallel = performance.now() - t1;

const t2 = performance.now();
const pc = wait(50, "e"), pd = wait(50, "f");           // стартуем оба, ждём потом
const [e, ff] = [await pc, await pd];
const startFirst = performance.now() - t2;
console.log("последовательно ≥ 100 мс:", sequential >= 95, "| параллельно < 90 мс:", parallel < 90, "| «старт сразу, await потом» < 90 мс:", startFirst < 90, [a, b, c, d, e, ff].join(""));

// циклы: for…of ждёт, forEach и map — нет
const order = [];
for (const n of [1, 2, 3]) { await wait(10); order.push("for-of " + n); }
[4, 5].forEach(async (n) => { await wait(10); order.push("forEach " + n); });
const mapped = [6, 7].map(async (n) => { await wait(10); return "map " + n; });
order.push("после forEach и map");
order.push(...(await Promise.all(mapped)));
console.log(order.join(" | "));

// методы и стрелки
class Repo {
  async find(id) { return { id }; }
  findArrow = async (id) => ({ id, arrow: true });
}
console.log(await new Repo().find(1), await new Repo().findArrow(2));

// await на верхнем уровне модуля
const top = await Promise.resolve("значение на верхнем уровне");
console.log(top);`, { filename: "aw1-basics.mjs", lineNumbers: true }),
      code("text", `true 42 сбой
work: до await
вызывающий: сразу после вызова work()
work: после await (микрозадача)
5 из thenable
последовательно ≥ 100 мс: true | параллельно < 90 мс: true | «старт сразу, await потом» < 90 мс: true abcdef
for-of 1 | for-of 2 | for-of 3 | после forEach и map | forEach 4 | forEach 5 | map 6 | map 7
{ id: 1 } { id: 2, arrow: true }
значение на верхнем уровне`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Всегда обещание:** `f()` → `Promise` (`true`), `await pf` — `42`; `throw` в `g()` — отказ (`сбой`).",
        "**`await` приостанавливает только функцию:** сначала `work: до await`, затем `вызывающий: сразу после вызова work()`, и только потом `work: после await (микрозадача)`.",
        "**Что можно `await`:** обещание, значение (`await 5` → `5`, всё равно через микрозадачу) и thenable (`из thenable`).",
        "**Время:** последовательные `await` — не менее 100 мс (две операции по 50 мс); `Promise.all` — меньше 90; «стартовать оба, ждать потом» (`const pc = wait(); const pd = wait(); await pc; await pd`) — тоже меньше 90.",
        "**Циклы:** `for…of` с `await` обработал `1, 2, 3` по порядку; `forEach(async …)` не ждётся (строка «после forEach и map» напечатана раньше `forEach 4`); `map(async …)` дал обещания, которые собрал `Promise.all`.",
        "**Методы и стрелки** тоже бывают `async` (`async find()`, `findArrow = async () => …`).",
        "**Top-level `await`** допустим в модулях.",
      ),

      h("Ошибки: `try/catch/finally`, `return await`, висящие обещания"),
      code("js", `import { spawnSync } from "node:child_process";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = async (ms, msg) => { await wait(ms); throw new Error(msg); };

// try / catch / finally с await
async function load(shouldFail) {
  try {
    const value = await (shouldFail ? fail(5, "не загрузилось") : wait(5).then(() => "данные"));
    return value;
  } catch (e) {
    return "запасное значение (" + e.message + ")";
  } finally {
    console.log("  finally: освобождаем ресурсы");
  }
}
console.log(await load(false));
console.log(await load(true));

// return await внутри try нужен, чтобы catch поймал отказ
async function noAwait() { try { return fail(1, "отказ"); } catch { return "поймано внутри"; } }
async function withAwait() { try { return await fail(1, "отказ"); } catch { return "поймано внутри"; } }
console.log(await noAwait().catch((e) => "не поймано: " + e.message), "|", await withAwait());

// ошибки нескольких параллельных операций
const results = await Promise.allSettled([fail(5, "A"), wait(5).then(() => "B"), fail(5, "C")]);
console.log(results.map((r) => r.status === "fulfilled" ? r.value : "✗" + r.reason.message).join(" "));
try { await Promise.all([fail(5, "первая"), fail(10, "вторая")]); } catch (e) { console.log("Promise.all сообщил только:", e.message); }

// «висящее» обещание: ошибка произошла, пока мы ждали другое
const code = \`
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const fail = async (ms, msg) => { await wait(ms); throw new Error(msg); };
  (async () => {
    const slow = wait(50);
    const quickFail = fail(10, "упало, пока ждали slow");   // ещё никто не подписан на отказ
    await slow;
    try { await quickFail; } catch (e) { console.log("поймали:", e.message); }
  })();
\`;
const r = spawnSync(process.execPath, ["-e", code], { encoding: "utf8" });
console.log("висящее обещание: код выхода", r.status, "|", r.stderr.split("\\n").find((l) => l.startsWith("Error")) ?? "(нет)");
const fixed = \`
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const fail = async (ms, msg) => { await wait(ms); throw new Error(msg); };
  (async () => {
    const [slow, quick] = await Promise.allSettled([wait(50), fail(10, "упало")]);
    console.log("исправлено:", slow.status, quick.status, quick.reason.message);
  })();
\`;
const r2 = spawnSync(process.execPath, ["-e", fixed], { encoding: "utf8" });
console.log("код выхода", r2.status, "|", r2.stdout.trim());`, { filename: "aw2-errors.mjs", lineNumbers: true }),
      code("text", `  finally: освобождаем ресурсы
данные
  finally: освобождаем ресурсы
запасное значение (не загрузилось)
не поймано: отказ | поймано внутри
✗A B ✗C
Promise.all сообщил только: первая
висящее обещание: код выхода 1 | Error: упало, пока ждали slow
код выхода 0 | исправлено: fulfilled rejected упало`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`try/catch/finally`** работает как в синхронном коде: отказ `await` — исключение, `finally` выполняется в любом случае (при успехе и при ошибке).",
        "**`return await` в `try`:** `noAwait` вернула обещание, и отказ случился после выхода из `try` — снаружи `не поймано: отказ`; `withAwait` — `поймано внутри`. Вне `try` разница несущественна (кроме трассировки стека).",
        "**Несколько операций:** `allSettled` даёт результаты всех (`✗A B ✗C`); `Promise.all` сообщает только о **первом** отказе (`первая`).",
        "**Висящее обещание:** `quickFail` отклонилось через 10 мс, пока мы ждали `slow` (50 мс), — на него никто не был подписан, и **процесс Node.js завершился с кодом 1** (`Error: упало, пока ждали slow`). Исправление: подписаться сразу — `Promise.allSettled([...])` или `Promise.all`.",
        "**Правило:** если создали обещание, подпишитесь на него в том же «тике» (`await`, `then`, `catch` или передайте в комбинатор).",
      ),
      warn("Забытый `await` (`save(item);` без ожидания) превращает ошибку `save` в необработанный отказ, а порядок операций — в гонку. Включите правило линтера `no-floating-promises` (typescript-eslint) или `require-await` и проверяйте вызовы `async`-функций."),

      h("`AbortController` и `AbortSignal`"),
      code("js", `import { setTimeout as sleep } from "node:timers/promises";

// контроллер и сигнал
const controller = new AbortController();
const { signal } = controller;
console.log(signal.aborted, signal.reason, typeof controller.abort);
signal.addEventListener("abort", () => console.log("событие abort, причина:", signal.reason.name), { once: true });
controller.abort();
console.log(signal.aborted, signal.reason instanceof DOMException, signal.reason.name, signal.reason.message);
controller.abort(new Error("другая причина"));                 // повторный abort ничего не меняет
console.log("после повторного abort причина прежняя:", signal.reason.name);

// собственная причина
const c2 = new AbortController();
c2.abort("строка вместо исключения");
console.log(c2.signal.reason);

// throwIfAborted
try { signal.throwIfAborted(); } catch (e) { console.log("throwIfAborted бросил:", e.name); }

// слушатель, добавленный после abort, уже не сработает — проверяйте signal.aborted
let fired = false;
signal.addEventListener("abort", () => { fired = true; });
console.log("слушатель после abort сработал:", fired);

// тайм-аут и объединение сигналов
const timeoutSignal = AbortSignal.timeout(20);
await sleep(40);
console.log("AbortSignal.timeout:", timeoutSignal.aborted, timeoutSignal.reason.name);

const manual = new AbortController();
const combined = AbortSignal.any([manual.signal, AbortSignal.timeout(1000)]);
manual.abort(new Error("ручная отмена"));
console.log("AbortSignal.any:", combined.aborted, combined.reason.message);

// отменяемые таймеры и ожидание
const ac = new AbortController();
const pending = sleep(1000, "готово", { signal: ac.signal });
setTimeout(() => ac.abort(), 10);
console.log("отменённый sleep:", await pending.catch((e) => e.name + " (код " + e.code + ")"));

// кооперативная отмена собственной функции: проверяем сигнал и подписываемся на abort
function cancellableDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const id = setTimeout(() => { signal?.removeEventListener("abort", onAbort); resolve("прошло " + ms + " мс"); }, ms);
    const onAbort = () => { clearTimeout(id); reject(signal.reason); };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
const c3 = new AbortController();
setTimeout(() => c3.abort(), 5);
console.log(await cancellableDelay(500, c3.signal).catch((e) => "отменено: " + e.name), "|", await cancellableDelay(5));

// цикл с проверками сигнала
async function process(items, signal) {
  const done = [];
  for (const item of items) {
    signal.throwIfAborted();
    await sleep(5);
    done.push(item);
  }
  return done;
}
const c4 = new AbortController();
setTimeout(() => c4.abort(), 18);
let partial;
try { await process([1, 2, 3, 4, 5, 6], c4.signal); } catch (e) { partial = e.name; }
console.log("цикл остановлен по сигналу:", partial);`, { filename: "aw3-abort.mjs", lineNumbers: true }),
      code("text", `false undefined function
событие abort, причина: AbortError
true true AbortError This operation was aborted
после повторного abort причина прежняя: AbortError
строка вместо исключения
throwIfAborted бросил: AbortError
слушатель после abort сработал: false
AbortSignal.timeout: true TimeoutError
AbortSignal.any: true ручная отмена
отменённый sleep: AbortError (код ABORT_ERR)
отменено: AbortError | прошло 5 мс
цикл остановлен по сигналу: AbortError`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Состояние:** до отмены `signal.aborted` — `false`, `reason` — `undefined`; после `abort()` — `true`, `reason` — `DOMException` с именем `AbortError` и сообщением `This operation was aborted`; событие `abort` срабатывает **один раз**.",
        "**Повторный `abort()`** ничего не меняет (причина прежняя). `abort(\"строка\")` задаёт собственную причину (любое значение; лучше `Error`/`DOMException`).",
        "**`throwIfAborted()`** бросает причину, если сигнал уже отменён, — удобно в начале функции и в циклах.",
        "**Слушатель, добавленный после отмены, не сработает** (событие уже прошло): перед подпиской проверьте `signal.aborted`.",
        "**`AbortSignal.timeout(20)`** отменяется через 20 мс с причиной `TimeoutError`; **`AbortSignal.any([...])`** отменяется, как только отменён любой из сигналов (причина — причина первого); **`AbortSignal.abort()`** — уже отменённый сигнал.",
        "**Таймеры и события Node.js:** `timers/promises.setTimeout(ms, value, { signal })` отклоняется `AbortError` (код `ABORT_ERR`).",
        "**Кооперативная отмена:** `cancellableDelay` сначала проверяет `signal.aborted`, подписывается на `abort`, при отмене снимает таймер и отклоняет обещание причиной, а при нормальном завершении убирает слушатель; цикл `process` проверяет `signal.throwIfAborted()` на каждой итерации и остановился по сигналу.",
      ),

      h("`fetch` и отмена"),
      code("js", `import http from "node:http";
import { once } from "node:events";

// локальный сервер: ответ с задержкой, считает «обрывы» соединения
const stats = { started: 0, completed: 0, closedEarly: 0 };
const server = http.createServer((req, res) => {
  stats.started++;
  const delay = Number(new URL(req.url, "http://x").searchParams.get("delay") ?? 0);
  const timer = setTimeout(() => { stats.completed++; res.end(JSON.stringify({ delay })); }, delay);
  res.on("close", () => { if (!res.writableEnded) { stats.closedEarly++; clearTimeout(timer); } });
});
server.listen(0);
await once(server, "listening");
const base = \`http://127.0.0.1:\${server.address().port}\`;
const settle = () => new Promise((r) => setTimeout(r, 30));

// 1. обычный запрос
console.log("обычный:", await (await fetch(\`\${base}/?delay=10\`)).json());

// 2. отмена в процессе
const c = new AbortController();
setTimeout(() => c.abort(), 20);
const err = await fetch(\`\${base}/?delay=500\`, { signal: c.signal }).catch((e) => e);
await settle();
console.log("отмена:", err.name, "|", err.message, "| сервер видит обрыв:", stats.closedEarly);

// 3. тайм-аут сигналом
const err2 = await fetch(\`\${base}/?delay=500\`, { signal: AbortSignal.timeout(20) }).catch((e) => e);
await settle();
console.log("тайм-аут:", err2.name, "| сервер видит обрыв:", stats.closedEarly);

// 4. уже отменённый сигнал: запрос даже не отправляется
const before = stats.started;
const err3 = await fetch(\`\${base}/?delay=10\`, { signal: AbortSignal.abort() }).catch((e) => e);
await settle();
console.log("уже отменён:", err3.name, "| новых запросов на сервере:", stats.started - before);

// 5. «побеждает последний» (поиск при вводе): предыдущие запросы отменяются
let current = null;
async function search(q, delay) {
  current?.abort();
  const ctrl = (current = new AbortController());
  try {
    const res = await fetch(\`\${base}/?delay=\${delay}\`, { signal: ctrl.signal });
    return { q, data: await res.json() };
  } catch (e) {
    if (e.name === "AbortError") return { q, cancelled: true };
    throw e;
  }
}
const results = await Promise.all([search("а", 200), search("ав", 150), search("авт", 20)]);
await settle();
console.log("результаты:", JSON.stringify(results));
console.log("статистика сервера:", JSON.stringify(stats));
server.close();`, { filename: "aw4-fetch.mjs", lineNumbers: true }),
      code("text", `обычный: { delay: 10 }
отмена: AbortError | This operation was aborted | сервер видит обрыв: 1
тайм-аут: TimeoutError | сервер видит обрыв: 2
уже отменён: AbortError | новых запросов на сервере: 0
результаты: [{"q":"а","cancelled":true},{"q":"ав","cancelled":true},{"q":"авт","data":{"delay":20}}]
статистика сервера: {"started":6,"completed":2,"closedEarly":4}`, { filename: "вывод Node.js 22.22.0 (локальный http-сервер)" }),
      ul(
        "**Отмена посреди запроса:** `fetch` отклонился `AbortError`, сервер увидел обрыв соединения (`closedEarly: 1`) — ресурсы освобождены на обеих сторонах.",
        "**Тайм-аут:** `AbortSignal.timeout(20)` — `TimeoutError`, сервер снова увидел обрыв (`2`).",
        "**Уже отменённый сигнал:** запрос **не отправляется** (`новых запросов на сервере: 0`).",
        "**«Побеждает последний»:** три запроса подряд (`а`, `ав`, `авт`) — первые два отменены (`cancelled: true`), результат есть только у последнего; статистика сервера: стартовало 6, завершилось 2, оборвано 4.",
        "**Особенность `fetch`:** ответ `404`/`500` — **не отказ**: `fetch` отклоняется только при сетевой ошибке или отмене; статус нужно проверять через `response.ok`.",
      ),

      h("Гонка запросов при вводе: без отмены и с отменой"),
      p("Классическая гонка: пользователь печатает «авто», запросы уходят на `а`, `ав`, `авт`, `авто`, но ответы на короткие запросы приходят **позже** (у сервера они обрабатываются дольше). Без защиты на экране окажется результат первого, самого устаревшего запроса."),
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Поиск при вводе</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 34rem; }
  input { font: inherit; padding: .35rem .5rem; width: 100%; box-sizing: border-box; }
  label { display: block; margin-block: .5rem; }
  output { display: block; margin-top: .75rem; font-weight: 600; }
  pre { background: #8881; padding: .75rem; border-radius: 6px; min-height: 4rem; white-space: pre-wrap; }
</style>
<h1>Поиск при вводе</h1>
<label>Запрос <input id="q" autocomplete="off"></label>
<label><input type="checkbox" id="safe" checked style="width:auto"> отменять устаревшие запросы (AbortController)</label>
<output id="result" aria-live="polite">Введите запрос.</output>
<pre id="log"></pre>
<script type="module">
  const q = document.querySelector("#q");
  const safe = document.querySelector("#safe");
  const result = document.querySelector("#result");
  const log = document.querySelector("#log");
  let controller = null;

  async function search(query) {
    let signal;
    if (safe.checked) {
      controller?.abort();                         // предыдущий запрос больше не нужен
      controller = new AbortController();
      signal = controller.signal;
    }
    log.textContent += \`→ запрос «\${query}»\\n\`;
    try {
      const response = await fetch(\`/search?q=\${encodeURIComponent(query)}\`, { signal });
      const data = await response.json();
      result.textContent = \`Результат для «\${data.q}»\`;
      log.textContent += \`← ответ на «\${query}»\\n\`;
    } catch (error) {
      if (error.name === "AbortError") { log.textContent += \`✗ отменён «\${query}»\\n\`; return; }
      result.textContent = "Ошибка: " + error.message;
    }
  }

  q.addEventListener("input", () => search(q.value));     // без debounce — чтобы были гонки
</script>`, { filename: "search-page.html", collapsed: true }),
      code("text", `Без отмены: "Результат для «а»"
   → запрос «а»
   → запрос «ав»
   → запрос «авт»
   → запрос «авто»
   ← ответ на «авто»
   ← ответ на «авт»
   ← ответ на «ав»
   ← ответ на «а»
С отменой: "Результат для «авто»"
   → запрос «а»
   → запрос «ав»
   ✗ отменён «а»
   → запрос «авт»
   ✗ отменён «ав»
   → запрос «авто»
   ✗ отменён «авт»
   ← ответ на «авто»`, { filename: "вывод Chromium 141 (локальный сервер: ответы приходят в обратном порядке)" }),
      ul(
        "**Без отмены:** все четыре ответа пришли в порядке `авто → авт → ав → а`, и последним отрисовался `«а»` — **неверный результат** остался на экране.",
        "**С `AbortController`:** каждый новый запрос отменяет предыдущий (`✗ отменён «а»`…), и остался только ответ на `«авто»`.",
        "**Альтернатива без отмены:** хранить «номер версии» запроса и игнорировать ответы с устаревшим номером — но тогда лишние запросы всё равно выполняются на сервере.",
        "**Дополнительно:** `debounce` ввода (пауза 150–300 мс) уменьшает число запросов; он не заменяет защиту от гонок.",
      ),

      h("Отмена в интерфейсе"),
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Отмена асинхронных операций</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 36rem; }
  button { font: inherit; padding: .35rem .9rem; margin: 0 .5rem .5rem 0; }
  progress { width: 100%; }
  pre { background: #8881; padding: .75rem; border-radius: 6px; min-height: 5rem; white-space: pre-wrap; }
</style>
<h1>Отмена операции</h1>
<p>
  <button id="start">Загрузить (1 с)</button>
  <button id="cancel" disabled>Отменить</button>
  <button id="timeout">Загрузить с тайм-аутом 0,4 с</button>
</p>
<progress id="bar" max="10" value="0" aria-label="Прогресс"></progress>
<pre id="log" aria-live="polite"></pre>
<script type="module">
  const bar = document.querySelector("#bar");
  const log = document.querySelector("#log");
  const cancelBtn = document.querySelector("#cancel");
  const print = (text) => { log.textContent += text + "\\n"; };

  // «загрузка»: 10 шагов; поддерживает отмену — проверяет сигнал и не оставляет таймеров после отмены
  function download(ms, signal) {
    return new Promise((resolve, reject) => {
      signal.throwIfAborted?.();
      let step = 0;
      const id = setInterval(() => {
        bar.value = ++step;
        if (step === 10) { cleanup(); resolve("данные получены"); }
      }, ms / 10);
      const onAbort = () => { cleanup(); reject(signal.reason); };
      const cleanup = () => { clearInterval(id); signal.removeEventListener("abort", onAbort); };
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  let controller = null;
  async function run(signal, label) {
    bar.value = 0;
    log.textContent = label + "\\n";
    try {
      print("Готово: " + (await download(1000, signal)));
    } catch (error) {
      // причина отмены различается по имени: AbortError — пользователь, TimeoutError — время вышло
      print(\`Остановлено: \${error.name}\${error.name === "AbortError" ? " (отменено пользователем)" : error.name === "TimeoutError" ? " (вышло время)" : ""}\`);
    } finally {
      cancelBtn.disabled = true;
      print(\`Прогресс на момент остановки: \${bar.value} из 10\`);
    }
  }

  document.querySelector("#start").addEventListener("click", () => {
    controller?.abort();                       // предыдущая загрузка больше не нужна
    controller = new AbortController();
    cancelBtn.disabled = false;
    run(controller.signal, "Загрузка…");
  });
  cancelBtn.addEventListener("click", () => controller?.abort());
  document.querySelector("#timeout").addEventListener("click", () => run(AbortSignal.timeout(400), "Загрузка с тайм-аутом…"));
</script>`, { filename: "abort-lab.html", runnable: true, lineNumbers: true }),
      code("text", `полная загрузка: Загрузка… | Готово: данные получены | Прогресс на момент остановки: 10 из 10
отмена кнопкой: Загрузка… | Остановлено: AbortError (отменено пользователем) | Прогресс на момент остановки: N из 10 | прогресс между 2 и 6: true
тайм-аут: Загрузка с тайм-аутом… | Остановлено: TimeoutError (вышло время) | Прогресс на момент остановки: N из 10 | прогресс между 2 и 6: true
[]`, { filename: "замер в Chromium 141" }),
      p("Функция `download` поддерживает отмену **корректно**: проверяет `signal.throwIfAborted?.()` до начала, подписывается на `abort`, при отмене снимает таймер и отклоняет обещание причиной сигнала, а при завершении убирает слушатель. Интерфейс различает причины по `error.name`: `AbortError` — «отменено пользователем», `TimeoutError` — «вышло время». Замер: полная загрузка — `10 из 10`; отмена кнопкой — `AbortError` на середине (`2…6 из 10`); тайм-аут 0,4 с — `TimeoutError` (`2…6 из 10`); ошибок страницы нет."),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const wait = (ms, signal) => new Promise((resolve, reject) => {
  const id = setTimeout(resolve, ms);
  signal?.addEventListener("abort", () => { clearTimeout(id); reject(signal.reason); }, { once: true });
});

async function loadPage(id, { signal } = {}) {          // async-функция всегда возвращает Promise
  signal?.throwIfAborted();                              // уже отменено — не начинаем
  try {
    await wait(10, signal);                              // await ждёт обещание, не блокируя поток
    return { id };                                       // return → значение обещания
  } catch (error) {
    if (error.name === "AbortError") return null;        // отмену обрабатываем отдельно
    throw error;                                         // остальное — выше (throw → отказ)
  } finally {
    console.log("страница", id, "обработана");           // выполняется всегда
  }
}

const controller = new AbortController();
const [a, b] = await Promise.all([loadPage(1), loadPage(2, { signal: controller.signal })]);   // параллельно
console.log(a, b);`,
        [
          { line: [1, 4], text: "Отменяемое ожидание: подписка на `abort` снимает таймер и отклоняет обещание причиной сигнала." },
          { line: 6, text: "`async` — функция всегда возвращает `Promise`; опции с `signal` — стандартный способ принять отмену." },
          { line: 7, text: "`throwIfAborted()` — не начинать работу, если уже отменено." },
          { line: [8, 10], text: "`await wait(...)` приостанавливает функцию, не блокируя поток; `return` задаёт значение обещания." },
          { line: [11, 13], text: "`catch`: отмену (`AbortError`) обрабатываем отдельно, остальные ошибки пробрасываем — `throw` внутри `async` превращается в отказ." },
          { line: [14, 15], text: "`finally` выполняется всегда: при успехе, ошибке и отмене." },
          { line: 19, text: "`Promise.all` запускает обе загрузки параллельно; ждём результаты вместе." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      p("Минимальная проверка собственного понимания порядка выполнения при `await`: что и в каком порядке напечатает программа? Затем сверьтесь с замером."),
      code("js", `const out = [];
const log = (x) => { out.push(x); };

async function a() {
  log("a1");
  await b();
  log("a2");
}
async function b() {
  log("b1");
}

log("start");
a();
Promise.resolve().then(() => log("p"));
(async () => {
  log("c1");
  await new Promise((resolve) => setTimeout(resolve, 0));
  log("c2 (после таймера)");
})();
log("end");

setTimeout(() => console.log(out.join(" → ")), 20);`, { filename: "x1-predict.mjs" }),
      code("text", `start → a1 → b1 → c1 → end → a2 → p → c2 (после таймера)`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "Синхронно: `start`, `a1`, `b1` (вызов `b()` выполняется до своего конца синхронно), `c1` (до `await`), `end`.",
        "Микрозадачи по очереди постановки: `a2` (продолжение `a` после `await b()` — обещание от `b()` уже выполнено), затем `p`.",
        "Макрозадача (таймер из `c`): `c2` — последней.",
      ),
    ]),

    section("detailed-example", [
      p("`createLatestSearch(searchFn, { debounceMs })` — защита от гонок для «поиска при вводе»: `debounce` (быстрая серия вызовов приводит к одному запросу), отмена идущего запроса через `AbortController`, отбрасывание устаревших ответов по номеру версии (если `searchFn` не учитывает сигнал) и метод `cancel()`. Вытесненные вызовы получают `null`, а не ошибку."),
      code("js", `// «Побеждает последний»: debounce + отмена устаревших запросов + защита от устаревших ответов.
// search(q) → { query, result } для актуального запроса или null, если запрос вытеснен более новым.
export function createLatestSearch(searchFn, { debounceMs = 100 } = {}) {
  let timer = null;
  let controller = null;
  let supersede = null;                 // функция, которая «закрывает» предыдущий ожидающий вызов значением null
  let version = 0;

  function search(query) {
    version++;
    const myVersion = version;
    clearTimeout(timer);                // новый вызов отменяет ещё не начатый (debounce)
    controller?.abort();                // и прерывает запрос, который уже идёт
    supersede?.();

    return new Promise((resolve, reject) => {
      supersede = () => resolve(null);
      timer = setTimeout(async () => {
        const mine = (controller = new AbortController());
        try {
          const result = await searchFn(query, mine.signal);
          resolve(myVersion === version ? { query, result } : null);          // ответ мог устареть, если searchFn не учитывает signal
        } catch (error) {
          if (mine.signal.aborted || myVersion !== version) resolve(null);    // отмена — не ошибка
          else reject(error);
        } finally {
          if (controller === mine) controller = null;                         // завершённый запрос отменять уже нечего
        }
      }, debounceMs);
    });
  }

  search.cancel = () => {
    version++;
    clearTimeout(timer);
    controller?.abort();
    supersede?.();
  };
  return search;
}`, { filename: "latest-search.mjs", lineNumbers: true }),
      code("js", `import { createLatestSearch } from "./latest-search.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// «сервер»: учитывает сигнал, ответ приходит через delay мс
function makeSearchFn(log) {
  return (query, signal) => new Promise((resolve, reject) => {
    log.started.push(query);
    const delay = query.length === 1 ? 60 : 10;                      // короткие запросы отвечают дольше
    const onAbort = () => { clearTimeout(id); log.aborted.push(query); reject(signal.reason); };
    const id = setTimeout(() => { signal.removeEventListener("abort", onAbort); log.completed.push(query); resolve(query.toUpperCase()); }, delay);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

// 1. debounce: быстрая серия вызовов — запрос уходит только для последнего
let log = { started: [], completed: [], aborted: [] };
let search = createLatestSearch(makeSearchFn(log), { debounceMs: 20 });
let results = await Promise.all([search("п"), search("пр"), search("при")]);
check("debounce: результаты вытесненных — null, последнего — ответ", results, [null, null, { query: "при", result: "ПРИ" }]);
check("debounce: на «сервер» ушёл один запрос", log.started, ["при"]);

// 2. новый запрос прерывает идущий
log = { started: [], completed: [], aborted: [] };
search = createLatestSearch(makeSearchFn(log), { debounceMs: 5 });
const first = search("а");                      // уйдёт на сервер и будет отвечать 60 мс
await sleep(20);
const second = search("аб");                    // через 20 мс: первый ещё в пути
results = await Promise.all([first, second]);
check("первый вытеснен, второй актуален", results, [null, { query: "аб", result: "АБ" }]);
check("первый запрос отменён сигналом, а не завершён", [log.aborted, log.completed], [["а"], ["аб"]]);

// 3. последовательные неперекрывающиеся запросы не мешают друг другу
log = { started: [], completed: [], aborted: [] };
search = createLatestSearch(makeSearchFn(log), { debounceMs: 5 });
const a = await search("аб");
const b = await search("вг");
check("два последовательных запроса", [a, b], [{ query: "аб", result: "АБ" }, { query: "вг", result: "ВГ" }]);
check("ничего не отменялось", log.aborted, []);

// 4. searchFn игнорирует сигнал — устаревший ответ всё равно отбрасывается
let calls = 0;
const ignoring = (query) => new Promise((resolve) => setTimeout(() => resolve(query), calls++ === 0 ? 50 : 5));
search = createLatestSearch(ignoring, { debounceMs: 1 });
const slowFirst = search("старый");
await sleep(10);
const fastSecond = search("новый");
check("устаревший ответ отброшен", await Promise.all([slowFirst, fastSecond]), [null, { query: "новый", result: "новый" }]);

// 5. реальная ошибка актуального запроса пробрасывается
search = createLatestSearch(async () => { throw new RangeError("сервер недоступен"); }, { debounceMs: 1 });
let name = "нет";
try { await search("x"); } catch (e) { name = e.name; }
check("ошибка пробрасывается", name, "RangeError");

// 6. cancel()
log = { started: [], completed: [], aborted: [] };
search = createLatestSearch(makeSearchFn(log), { debounceMs: 5 });
const p1 = search("а");
await sleep(15);
search.cancel();
check("cancel: результат null и запрос прерван", [await p1, log.aborted], [null, ["а"]]);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "latest-search-test.mjs", collapsed: true }),
      code("text", `Все 9 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Решение", "Что даёт", "Почему так"],
        [
          ["`version++` на каждый вызов и сравнение `myVersion === version`", "Отбрасывание устаревших ответов", "Работает даже если `searchFn` игнорирует сигнал (проверено: устаревший ответ `старый` отброшен)"],
          ["`clearTimeout(timer)`", "Debounce", "Быстрая серия `п`, `пр`, `при` приводит к одному запросу (`started: [\"при\"]`)"],
          ["`controller?.abort()` до нового запроса", "Прерывание идущего запроса", "Освобождает сеть; запрос `а` отменён сигналом, а не завершён (`aborted: [\"а\"]`)"],
          ["`supersede?.()` — `resolve(null)` предыдущего вызова", "Вытесненные вызовы не висят вечно", "Вызывающий код получает `null` и понимает, что результат не нужен"],
          ["`mine.signal.aborted || myVersion !== version` → `null`", "Отмена не считается ошибкой", "`AbortError` от `fetch` не показывают пользователю"],
          ["`finally { if (controller === mine) controller = null }`", "Завершённый запрос не отменяется повторно", "Без этого следующий вызов `abort()` вызвал бы лишние обработчики `abort`"],
          ["`search.cancel()`", "Явная отмена всего (уход со страницы)", "Увеличивает версию, снимает таймер, отменяет запрос"],
        ],
        "Разбор createLatestSearch",
      ),
      ul(
        "Все 9 проверок проходят: debounce, прерывание идущего запроса, последовательные запросы, игнорирование устаревших ответов, пробрасывание реальных ошибок, `cancel()`.",
        "**Два уровня защиты:** отмена (экономит ресурсы) и версия (гарантирует корректность, даже если отмена не поддерживается).",
        "**Идемпотентность и побочные эффекты:** отмена не откатывает действия, уже выполненные на сервере; для запросов с побочными эффектами (запись) защита от гонок строится иначе (идентификаторы операций, порядок на сервере).",
      ),
    ]),

    section("internals", [
      h("Что делает `await`"),
      p("`await x` преобразует `x` в обещание (`PromiseResolve`), подписывает продолжение функции через `then` и приостанавливает функцию, возвращая управление вызывающему. Продолжение — микрозадача: код после `await` выполняется после синхронного остатка текущей задачи, но до любых макрозадач (замеры: `a2` раньше `c2`). Если `x` — уже выполненное нативное обещание, продолжение ставится в очередь немедленно; возврат из `async`-функции значения, не являющегося обещанием, выполняет результирующее обещание."),
      h("Асинхронная функция как конечный автомат"),
      p("Движок превращает `async`-функцию в конечный автомат: локальные переменные и «точка продолжения» сохраняются между `await`. Концептуально это то же, что генератор, который отдаёт обещания, а «драйвер» возобновляет его по их завершении. Поэтому `async`-функция не занимает стек, пока ждёт, и может «жить» долго."),
      h("`return` и `return await`"),
      p("`return promise` в `async`-функции возвращает наружу обещание, которое «подхватывается» результирующим обещанием **после** выхода из функции. Внутри `try` это значит, что `catch` отказ не увидит. `return await promise` ждёт обещание внутри `try`, превращая отказ в исключение, которое можно поймать. Вне `try` оба варианта эквивалентны по результату."),
      h("Как устроена отмена"),
      steps(
        [
          ["Создание", "`AbortController` создаёт `AbortSignal`; у сигнала состояние «не отменён»."],
          ["Передача", "Сигнал передаётся в `fetch`, таймеры, свои функции через параметр `{ signal }`."],
          ["Отмена", "`abort(reason)` один раз переводит сигнал в состояние «отменён», записывает `reason` и синхронно вызывает обработчики события `abort`."],
          ["Реакция исполнителя", "`fetch` обрывает соединение и отклоняется с `reason`; собственная функция должна сама проверить `signal.aborted` или подписаться на `abort`, снять таймеры/слушатели и отклонить обещание."],
        ],
        "Жизненный цикл отмены",
      ),
      p("Важно: **отмена не откатывает** уже выполненные побочные эффекты и **не гарантирует**, что операция не завершится: обещание можно отклонить раньше, чем сервер перестанет работать. Для `fetch` это значит, что запрос мог уже дойти до сервера и выполниться."),
      h("Причины отмены: `AbortError` и `TimeoutError`"),
      p("По умолчанию `reason` — `DOMException` с именем `AbortError`; `AbortSignal.timeout` использует `TimeoutError`. Различайте их по `error.name`: `AbortError` обычно не нужно показывать пользователю, а `TimeoutError` — нужно. Свою причину можно передать в `abort(reason)`; тогда `fetch` отклонится именно ею."),
      h("`AbortSignal.any` и время жизни"),
      p("`AbortSignal.any([...])` создаёт сигнал, зависящий от остальных: он отменяется с причиной первого отменённого. Зависимые сигналы удерживаются, пока жив исходный, поэтому такие сигналы лучше не создавать в бесконечных циклах."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Последовательные `await` для независимых операций"),
      wrongRight(
        "js",
        {
          code: `
            const user = await getUser(id);
            const orders = await getOrders(id);     // не зависит от user, но ждёт его
            const prefs = await getPrefs(id);
          `,
          note: "Три независимые операции стартуют по очереди — суммарное время вместо максимального.",
        },
        {
          code: `
            const [user, orders, prefs] = await Promise.all([getUser(id), getOrders(id), getPrefs(id)]);
          `,
          note: "Стартуют сразу; ждём общего результата (замер: < 90 мс против ≥ 100 мс для двух операций по 50 мс).",
        },
      ),
      h("Ошибка 2. `forEach(async …)` и `map(async …)` без `Promise.all`"),
      p("`forEach` не ждёт: «после forEach и map» напечатано раньше `forEach 4` (замер). `map(async)` возвращает массив обещаний. Используйте `for…of` с `await` или `await Promise.all(items.map(...))`."),
      h("Ошибка 3. Забытый `await`"),
      p("Вызов `async`-функции без `await` — висящее обещание: ошибки теряются или роняют процесс (код выхода `1`), а порядок операций нарушается."),
      h("Ошибка 4. `return promise` вместо `return await` внутри `try`"),
      p("`catch` не ловит отказ (замер: `не поймано: отказ`). Пишите `return await` внутри `try`."),
      h("Ошибка 5. Создали обещание и ждёте другое"),
      p("В примере `quickFail` создали до `await slow`: когда оно отклонилось, на него никто не был подписан — процесс упал (код `1`). Подписывайтесь сразу (`allSettled`, `all`)."),
      h("Ошибка 6. Считать отмену принудительной"),
      p("`abort()` — только сигнал. Собственная функция, не слушающая `signal`, продолжит работать. Проверяйте `signal.aborted`/`throwIfAborted()` и подписывайтесь на `abort`."),
      h("Ошибка 7. Показывать `AbortError` пользователю"),
      p("Отмена — штатная ситуация (смена запроса, уход со страницы). Ловите `AbortError` и молча выходите; ошибки сети и `TimeoutError` обрабатывайте отдельно."),
      h("Ошибка 8. Не проверять `response.ok` у `fetch`"),
      p("`fetch` не отклоняется при 404/500 (замер: `HttpError` создавали сами). Всегда проверяйте `response.ok` и бросайте осмысленную ошибку."),
    ]),

    section("antipatterns", [
      ul(
        "**`async`-функции без `await` внутри** (`require-await`): лишняя обёртка в обещание.",
        "**`await` в цикле по независимым операциям** вместо `Promise.all`.",
        "**«Fire and forget» без `catch`:** запуск `async`-функции без обработки отказа.",
        "**`new Promise(async (resolve) => …)`:** исключения внутри `async`-исполнителя не отклоняют обещание.",
        "**Вложенные `try/catch` на каждый `await`,** когда достаточно одного блока на сценарий.",
        "**Отмена через флаг `cancelled = true`** вместо `AbortSignal`: не совместима с `fetch` и другими API.",
        "**Глобальный общий `AbortController` на все запросы:** одна отмена убьёт всё.",
        "**Игнорирование `finally`-очистки** (таймеры, слушатели) при отмене.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Запускайте независимое параллельно** (`Promise.all`/`allSettled`), зависимое — по порядку.",
        "**Подписывайтесь на обещание сразу;** используйте линтер для `no-floating-promises`.",
        "**Внутри `try` используйте `return await`** и очищайте ресурсы в `finally`.",
        "**Все длительные API принимают `{ signal }`;** проверяйте `signal.throwIfAborted()` перед шагами и в циклах.",
        "**Различайте причины:** `AbortError` (тихо выйти), `TimeoutError` (сообщить), `HttpError` (по статусу), ошибки сети (повторить/сообщить).",
        "**Для сценария — один `AbortController`:** уход со страницы, смена запроса, закрытие диалога отменяют его.",
        "**Защита от гонок:** отмена предыдущего запроса + номер версии; `debounce` для ввода.",
        "**Проверяйте `response.ok`** и обрабатывайте тело ответа внутри того же `try`.",
      ),
      tip("Чтобы не забывать отмену, оформляйте функции так: `async function load(url, { signal } = {})`, а внутри передавайте `signal` дальше (`fetch(url, { signal })`) — отмена протечёт по всему стеку вызовов без дополнительного кода."),
    ]),

    section("edge-cases", [
      h("`await` в `finally` и порядок"),
      p("`await` внутри `finally` допустим: функция приостановится до завершения очистки, а затем продолжит выход (возврат/исключение сохраняются)."),
      h("`await` в конструкторах и геттерах"),
      p("Конструктор не может быть `async`; асинхронную инициализацию выносят в статическую фабрику (`static async create()`). Геттеры тоже не `async` (они могут вернуть обещание)."),
      h("Несколько отказов одновременно"),
      p("`Promise.all` сообщает о первом отказе и «поглощает» остальные (необработанных отказов не будет); `allSettled` даёт все. Если вы вручную ждёте несколько обещаний подряд, отказ второго до ожидания первым — висящее обещание."),
      h("Отмена и уже завершённая операция"),
      p("`abort()` после завершения запроса безвреден: сигнал меняет состояние, но слушателей, влияющих на завершённую операцию, нет (мы снимаем слушатели в `finally`)."),
      h("`AbortSignal` и `addEventListener`"),
      p("`addEventListener(type, handler, { signal })` снимает обработчик при отмене сигнала — удобный способ массового снятия слушателей (в том числе в компонентах интерфейса)."),
      h("Повторное использование сигнала"),
      p("Отменённый сигнал нельзя «сбросить»: для нового запроса создавайте новый `AbortController`. Один контроллер на несколько запросов — только если они должны отменяться вместе."),
    ]),

    section("related", [
      ul(
        "[Promise](/learn/js/promises) — состояния, цепочки, `all`/`race`/`any`, необработанные отказы.",
        "[Цикл событий](/learn/js/event-loop) — микрозадачи и порядок выполнения после `await`.",
        "[Формы, fetch и FormData](/learn/js/forms-fetch) — запросы к серверу в браузере.",
        "[Итераторы и генераторы](/learn/js/iterators-generators) — генераторы как основа `async/await`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Гонка запросов, лишняя последовательность и потерянные ошибки",
          code: `
            input.addEventListener("input", async () => {
              const user = await fetch("/me").then((r) => r.json());          // не зависит от запроса поиска
              const results = await fetch("/search?q=" + input.value).then((r) => r.json());
              render(results);                                                // придёт ли ответ на актуальный запрос?
            });
          `,
          note: "Запросы идут по очереди, ответы могут прийти в другом порядке (устаревший результат перезапишет свежий), ошибки не обрабатываются.",
        },
        {
          title: "Параллельно, с отменой и обработкой ошибок",
          code: `
            const search = createLatestSearch((q, signal) => fetchJson("/search?q=" + q, { signal }), { debounceMs: 200 });
            input.addEventListener("input", async () => {
              try {
                const found = await search(input.value);
                if (found) render(found.result);          // null — запрос вытеснен, ничего не делаем
              } catch (error) {
                showError(error);                         // настоящие ошибки (сеть, HTTP, таймаут)
              }
            });
          `,
          note: "Debounce, отмена предыдущего запроса, отбрасывание устаревших ответов и единая обработка ошибок.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.async-await-abort.ex1",
      title: "Предскажите порядок",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код (раздел «Минимальный пример»), запишите порядок вывода и для каждого шага назовите очередь: синхронный код, микрозадача, макрозадача."),
        code("js", `const out = [];
const log = (x) => { out.push(x); };

async function a() {
  log("a1");
  await b();
  log("a2");
}
async function b() {
  log("b1");
}

log("start");
a();
Promise.resolve().then(() => log("p"));
(async () => {
  log("c1");
  await new Promise((resolve) => setTimeout(resolve, 0));
  log("c2 (после таймера)");
})();
log("end");

setTimeout(() => console.log(out.join(" → ")), 20);`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Что выполняется синхронно в `a()` до `await`?", "Когда возобновляется `a` — до или после `p`?"],
      checks: ["Порядок `start → a1 → b1 → c1 → end → a2 → p → c2`", "Названы очереди", "Объяснено место `a2` перед `p`"],
      solution: [
        code("text", `start → a1 → b1 → c1 → end → a2 → p → c2 (после таймера)`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "Синхронно: `start`, затем `a()` выполняется до `await b()`: `a1`, `b1` (тело `b` синхронно), далее `c1` и `end`.",
          "`await b()` ждёт уже выполненное обещание: продолжение `a` поставлено в очередь микрозадач **раньше**, чем `then` из `Promise.resolve().then(...)`, поэтому `a2` идёт перед `p`.",
          "`c2` — после таймера (макрозадача) — последний.",
        ),
      ],
    }),
    exercise({
      id: "js.async-await-abort.ex2",
      title: "Висящее обещание и неуловимая ошибка",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Программа из `aw2-errors.mjs` завершается с кодом `1` из-за «висящего» обещания, а `try/catch` не ловит отказ в `noAwait`. Объясните обе проблемы по выводу и покажите исправления."),
      ],
      hints: ["На какое обещание никто не подписан в момент отказа?", "Когда именно отклоняется обещание, возвращённое без `await` внутри `try`?"],
      checks: ["Причина кода выхода 1", "Объяснён `return await`", "Исправление через `allSettled`/`all`"],
      solution: [
        code("js", `import { spawnSync } from "node:child_process";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = async (ms, msg) => { await wait(ms); throw new Error(msg); };

// try / catch / finally с await
async function load(shouldFail) {
  try {
    const value = await (shouldFail ? fail(5, "не загрузилось") : wait(5).then(() => "данные"));
    return value;
  } catch (e) {
    return "запасное значение (" + e.message + ")";
  } finally {
    console.log("  finally: освобождаем ресурсы");
  }
}
console.log(await load(false));
console.log(await load(true));

// return await внутри try нужен, чтобы catch поймал отказ
async function noAwait() { try { return fail(1, "отказ"); } catch { return "поймано внутри"; } }
async function withAwait() { try { return await fail(1, "отказ"); } catch { return "поймано внутри"; } }
console.log(await noAwait().catch((e) => "не поймано: " + e.message), "|", await withAwait());

// ошибки нескольких параллельных операций
const results = await Promise.allSettled([fail(5, "A"), wait(5).then(() => "B"), fail(5, "C")]);
console.log(results.map((r) => r.status === "fulfilled" ? r.value : "✗" + r.reason.message).join(" "));
try { await Promise.all([fail(5, "первая"), fail(10, "вторая")]); } catch (e) { console.log("Promise.all сообщил только:", e.message); }

// «висящее» обещание: ошибка произошла, пока мы ждали другое
const code = \`
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const fail = async (ms, msg) => { await wait(ms); throw new Error(msg); };
  (async () => {
    const slow = wait(50);
    const quickFail = fail(10, "упало, пока ждали slow");   // ещё никто не подписан на отказ
    await slow;
    try { await quickFail; } catch (e) { console.log("поймали:", e.message); }
  })();
\`;
const r = spawnSync(process.execPath, ["-e", code], { encoding: "utf8" });
console.log("висящее обещание: код выхода", r.status, "|", r.stderr.split("\\n").find((l) => l.startsWith("Error")) ?? "(нет)");
const fixed = \`
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const fail = async (ms, msg) => { await wait(ms); throw new Error(msg); };
  (async () => {
    const [slow, quick] = await Promise.allSettled([wait(50), fail(10, "упало")]);
    console.log("исправлено:", slow.status, quick.status, quick.reason.message);
  })();
\`;
const r2 = spawnSync(process.execPath, ["-e", fixed], { encoding: "utf8" });
console.log("код выхода", r2.status, "|", r2.stdout.trim());`, { filename: "aw2-errors.mjs", collapsed: true }),
        code("text", `  finally: освобождаем ресурсы
данные
  finally: освобождаем ресурсы
запасное значение (не загрузилось)
не поймано: отказ | поймано внутри
✗A B ✗C
Promise.all сообщил только: первая
висящее обещание: код выхода 1 | Error: упало, пока ждали slow
код выхода 0 | исправлено: fulfilled rejected упало`, { filename: "вывод Node.js 22.22.0" }),
        p("1) `quickFail` создали, но подписались на него только после `await slow`; когда оно отклонилось (10 мс), обработчика не было — необработанный отказ завершил процесс. Исправление: подписаться сразу (`Promise.allSettled([slow, quickFail])`). 2) `return fail()` без `await` возвращает обещание, отказ которого происходит **после** выхода из `try`; `return await fail()` превращает отказ в исключение внутри `try`."),
      ],
    }),
    exercise({
      id: "js.async-await-abort.ex3",
      title: "fetchJson с тайм-аутом и отменой",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Напишите `fetchJson(url, { timeoutMs, signal })`: GET + разбор JSON; тайм-аут и внешняя отмена объединяются в один сигнал; статусы 4xx/5xx превращаются в `HttpError` со `status`; различимы `TimeoutError`, `AbortError`, `HttpError` и сетевая ошибка (`TypeError`). Уже отменённый сигнал не должен отправлять запрос."),
      ],
      hints: ["Как объединить внешний сигнал и тайм-аут?", "Что делает `fetch` при ответе `404`?"],
      checks: ["`AbortSignal.any`/`timeout`", "`response.ok` → `HttpError`", "Запрос не отправляется при отменённом сигнале", "Сервер видит обрывы"],
      solution: [
        code("js", `export class HttpError extends Error {
  constructor(status, url) {
    super(\`HTTP \${status}\`);
    this.name = "HttpError";
    this.status = status;
    this.url = url;
  }
}

// GET + разбор JSON с тайм-аутом и внешней отменой; различает виды ошибок по имени
export async function fetchJson(url, { timeoutMs = 5000, signal } = {}) {
  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;       // сработает любой из сигналов
  const response = await fetch(url, { signal: combined });                      // отказ: AbortError (внешняя отмена) или TimeoutError
  if (!response.ok) throw new HttpError(response.status, url);                  // fetch не считает 4xx/5xx ошибкой
  return await response.json();                                                 // чтение тела тоже может быть прервано сигналом
}`, { filename: "fetch-json.mjs" }),
        code("js", `import http from "node:http";
import { once } from "node:events";
import { fetchJson, HttpError } from "./fetch-json.mjs";

const stats = { started: 0, closedEarly: 0 };
const server = http.createServer((req, res) => {
  stats.started++;
  const url = new URL(req.url, "http://x");
  const delay = Number(url.searchParams.get("delay") ?? 0);
  const status = Number(url.searchParams.get("status") ?? 200);
  const timer = setTimeout(() => { res.statusCode = status; res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ ok: status < 400, path: url.pathname })); }, delay);
  res.on("close", () => { if (!res.writableEnded) { stats.closedEarly++; clearTimeout(timer); } });
});
server.listen(0);
await once(server, "listening");
const base = \`http://127.0.0.1:\${server.address().port}\`;

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);
const describe = async (p) => { try { return { ok: await p }; } catch (e) { return { error: e.name, ...(e.status ? { status: e.status } : {}) }; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

check("успех", await describe(fetchJson(\`\${base}/a?delay=5\`)), { ok: { ok: true, path: "/a" } });
check("404 — HttpError со статусом", await describe(fetchJson(\`\${base}/b?status=404\`)), { error: "HttpError", status: 404 });
check("500 — HttpError", await describe(fetchJson(\`\${base}/b?status=500\`)), { error: "HttpError", status: 500 });
check("тайм-аут — TimeoutError", await describe(fetchJson(\`\${base}/slow?delay=300\`, { timeoutMs: 30 })), { error: "TimeoutError" });

const controller = new AbortController();
setTimeout(() => controller.abort(), 20);
check("внешняя отмена — AbortError", await describe(fetchJson(\`\${base}/slow?delay=300\`, { signal: controller.signal, timeoutMs: 1000 })), { error: "AbortError" });
await sleep(30);
check("сервер увидел обрывы (тайм-аут и отмена)", stats.closedEarly, 2);

const before = stats.started;
check("уже отменённый сигнал — запрос не отправляется", [await describe(fetchJson(\`\${base}/never\`, { signal: AbortSignal.abort() })), stats.started - before], [{ error: "AbortError" }, 0]);

check("сетевая ошибка (порт закрыт) — не AbortError и не TimeoutError", (await describe(fetchJson("http://127.0.0.1:1/x", { timeoutMs: 500 }))).error, "TypeError");
check("HttpError — наследник Error", new HttpError(418, "u") instanceof Error, true);

server.close();
let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "fetch-json-test.mjs", collapsed: true }),
        code("text", `Все 9 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0, локальный сервер)" }),
        p("`AbortSignal.any([signal, AbortSignal.timeout(ms)])` объединяет внешнюю отмену и тайм-аут; `fetch` отклонится `AbortError` (внешняя) или `TimeoutError` (время); статус проверяется `response.ok`; сетевая ошибка — `TypeError`. Тест на живом сервере подтверждает обрывы соединений (`closedEarly: 2`) и отсутствие запроса при отменённом сигнале."),
      ],
    }),
  ],

  challenge: {
    id: "js.async-await-abort.challenge",
    title: "createLatestSearch: поиск без гонок",
    scenario: [
      p("В поле поиска пользователь печатает быстро; сервер отвечает за разное время, поэтому ответы на старые запросы приходят позже новых. Реализуйте модуль `latest-search.mjs` с функцией `createLatestSearch(searchFn, { debounceMs })`, возвращающей `search(query)`."),
    ],
    requirements: [
      "`search(q)` возвращает обещание: `{ query, result }` для актуального запроса или `null`, если запрос вытеснен более новым (или отменён)",
      "Debounce: серия вызовов быстрее `debounceMs` приводит к одному вызову `searchFn` — для последнего запроса",
      "`searchFn(query, signal)` получает `AbortSignal`; идущий запрос отменяется при новом вызове",
      "Если `searchFn` игнорирует сигнал, устаревший ответ всё равно отбрасывается (номер версии)",
      "Отмена — не ошибка (`null`); реальная ошибка актуального запроса пробрасывается; метод `search.cancel()` отменяет всё",
    ],
    constraints: [
      "Без внешних библиотек",
      "Не использовать глобальное состояние: каждый вызов `createLatestSearch` независим",
    ],
    acceptance: [
      "Все 9 проверок из теста проходят (без нестабильности при 5 запусках подряд)",
      "На «сервер» уходит один запрос после быстрой серии `п`, `пр`, `при`",
      "Запрос, вытесненный посреди пути, отменён сигналом (а не просто проигнорирован)",
    ],
    hints: [
      "Что нужно хранить, чтобы отличить актуальный запрос от устаревшего?",
      "Как гарантировать, что вытесненный вызов не повиснет навсегда?",
      "Когда `AbortError` — не ошибка?",
    ],
    solution: [
      code("js", `// «Побеждает последний»: debounce + отмена устаревших запросов + защита от устаревших ответов.
// search(q) → { query, result } для актуального запроса или null, если запрос вытеснен более новым.
export function createLatestSearch(searchFn, { debounceMs = 100 } = {}) {
  let timer = null;
  let controller = null;
  let supersede = null;                 // функция, которая «закрывает» предыдущий ожидающий вызов значением null
  let version = 0;

  function search(query) {
    version++;
    const myVersion = version;
    clearTimeout(timer);                // новый вызов отменяет ещё не начатый (debounce)
    controller?.abort();                // и прерывает запрос, который уже идёт
    supersede?.();

    return new Promise((resolve, reject) => {
      supersede = () => resolve(null);
      timer = setTimeout(async () => {
        const mine = (controller = new AbortController());
        try {
          const result = await searchFn(query, mine.signal);
          resolve(myVersion === version ? { query, result } : null);          // ответ мог устареть, если searchFn не учитывает signal
        } catch (error) {
          if (mine.signal.aborted || myVersion !== version) resolve(null);    // отмена — не ошибка
          else reject(error);
        } finally {
          if (controller === mine) controller = null;                         // завершённый запрос отменять уже нечего
        }
      }, debounceMs);
    });
  }

  search.cancel = () => {
    version++;
    clearTimeout(timer);
    controller?.abort();
    supersede?.();
  };
  return search;
}`, { filename: "latest-search.mjs", lineNumbers: true }),
      code("text", `Все 9 проверок пройдены`, { filename: "результат запуска тестов" }),
      p("Номер версии растёт при каждом вызове; таймер debounce, контроллер и функция «закрытия» предыдущего вызова заменяются при новом запросе. Ответ принимается, только если версия совпадает; отмена и устаревшие запросы завершаются `null`, реальные ошибки — пробрасываются."),
    ],
  },

  interview: [
    iq("js.async-await-abort.i1", "basic", "Что возвращает `async`-функция и что делает `await`?", [
      ul(
        "`async`-функция всегда возвращает `Promise`: `return` — выполнение, `throw` — отказ.",
        "`await` приостанавливает функцию до завершения обещания и возвращает значение (или бросает причину отказа); остальной код продолжает работать.",
        "Код после `await` выполняется как микрозадача.",
      ),
    ]),
    iq("js.async-await-abort.i2", "basic", "Как выполнить несколько независимых запросов параллельно?", [
      ul(
        "`await Promise.all([a(), b(), c()])` — все стартуют сразу; ждём общего результата.",
        "Или создать обещания заранее (`const p1 = a(); const p2 = b();`) и `await` потом.",
        "Не писать `await` подряд для независимых операций — они пойдут по очереди (замер: ≥ 100 мс против < 90).",
      ),
    ]),
    iq("js.async-await-abort.i3", "intermediate", "Почему `forEach(async …)` не ждёт завершения?", [
      ul(
        "`forEach` вызывает колбэк и игнорирует возвращаемое обещание; следующая итерация не ждёт.",
        "Используйте `for…of` с `await` (по порядку) или `await Promise.all(items.map(async …))` (параллельно).",
        "Ошибки колбэков в `forEach(async)` становятся необработанными отказами.",
      ),
    ]),
    iq("js.async-await-abort.i4", "intermediate", "Зачем нужен `return await` внутри `try`?", [
      ul(
        "Без `await` функция возвращает обещание, отказ которого произойдёт после выхода из `try` — `catch` его не ловит.",
        "С `await` отказ становится исключением внутри `try` и обрабатывается.",
        "Вне `try` разницы по результату нет.",
      ),
    ]),
    iq("js.async-await-abort.i5", "intermediate", "Как работает `AbortController`?", [
      ul(
        "`controller.signal` передают в API (`fetch`, таймеры, свои функции); `controller.abort(reason)` переводит сигнал в состояние «отменён» и запускает событие `abort` (один раз).",
        "`fetch` прерывает запрос и отклоняется причиной (`AbortError` по умолчанию); сервер видит обрыв соединения.",
        "Своя функция должна проверять `signal.aborted`/`throwIfAborted()` и подписываться на `abort`.",
        "Новый запрос — новый контроллер: отменённый сигнал не сбрасывается.",
      ),
    ]),
    iq("js.async-await-abort.i6", "advanced", "Как реализовать тайм-аут запроса?", [
      ul(
        "`fetch(url, { signal: AbortSignal.timeout(ms) })`: по истечении времени запрос прерывается, ошибка — `TimeoutError`.",
        "Совместно с отменой пользователем: `AbortSignal.any([userSignal, AbortSignal.timeout(ms)])`.",
        "`Promise.race` с таймером не прерывает запрос — только перестаёт ждать; предпочтительнее сигнал.",
      ),
    ]),
    iq("js.async-await-abort.i7", "engineering", "Как защититься от гонки «ответ на старый запрос пришёл позже нового»?", [
      ul(
        "Отменять предыдущий запрос (`AbortController`) при каждом новом.",
        "Хранить «версию» запроса и игнорировать ответы устаревших версий (работает, даже если отмена не поддерживается).",
        "Добавить `debounce` ввода, чтобы уменьшить число запросов.",
        "Для запросов с побочными эффектами — идентификаторы операций и упорядочение на сервере.",
      ),
    ]),
    iq("js.async-await-abort.i8", "debugging", "Процесс Node.js внезапно завершился с кодом 1 без видимой причины после `async`-кода. Что искать?", [
      ul(
        "Необработанный отказ: обещание, созданное без подписки на отказ (забытый `await`, `catch`, висящее обещание).",
        "Смотреть сообщение об ошибке и трассировку; включить `--trace-uncaught`; найти вызовы `async`-функций без `await`.",
        "Проверить параллельные операции: подпишитесь сразу (`Promise.all`/`allSettled`).",
        "Добавить обработчик `unhandledRejection` только для логирования, а причину исправить.",
      ),
    ]),
  ],

  exam: [
    mcq("js.async-await-abort.e1", "foundation", "Что вернёт `async function f() { return 1 }`?", ["Число `1`", "`undefined`", "`Promise`, выполняющееся значением `1`", "Функцию"], 2, "`async`-функция всегда возвращает обещание (замер: `pf instanceof Promise`)."),
    mcq("js.async-await-abort.e2", "foundation", "Сколько примерно займут две независимые операции по 50 мс при `await a(); await b()`?", ["≈ 100 мс", "≈ 50 мс", "≈ 25 мс", "Зависит от порядка"], 0, "Они выполняются последовательно: время складывается (замер: ≥ 100 мс)."),
    mcq("js.async-await-abort.e3", "intermediate", "Что делает `controller.abort()`?", ["Останавливает любую операцию принудительно", "Удаляет контроллер", "Закрывает вкладку", "Переводит сигнал в состояние «отменён» и запускает событие `abort`; реагируют на него только операции, слушающие сигнал"], 3, "Отмена — кооперативная: `fetch` реагирует сам, свои функции должны слушать сигнал."),
    mcq("js.async-await-abort.e4", "intermediate", "Какое имя у ошибки `fetch(url, { signal: AbortSignal.timeout(20) })` при истечении времени?", ["`AbortError`", "`TimeoutError`", "`TypeError`", "`NetworkError`"], 1, "`AbortSignal.timeout` использует причину `TimeoutError` (замер)."),
    mcq("js.async-await-abort.e5", "intermediate", "Что верно для `fetch`? Выберите все.", ["Ответ 404 отклоняет обещание", "Проверять нужно `response.ok`", "Отмена сигналом отклоняет обещание `AbortError`", "Уже отменённый сигнал не отправляет запрос"], [1, 2, 3], "`fetch` отклоняется только при сетевой ошибке или отмене; статус проверяется вручную."),
    mcq("js.async-await-abort.e6", "advanced", "Почему в `try { return fail(); } catch { … }` внутри `async` функции `catch` не сработает?", ["`catch` не работает в `async`", "Из-за `finally`", "`fail` синхронная", "Возвращённое без `await` обещание отклоняется после выхода из `try`"], 3, "Нужен `return await fail()` (замер: `не поймано: отказ`)."),
    open("js.async-await-abort.e7", "intermediate", "Объясните, как предотвратить показ устаревшего результата поиска при быстром вводе.", [
      ul(
        "Причина: ответы на ранние запросы могут прийти позже поздних и перезаписать актуальный результат.",
        "Отмена предыдущего запроса `AbortController`-ом при каждом новом (запрос обрывается, сервер видит обрыв).",
        "Номер версии: сравнивать версию запроса с текущей и игнорировать устаревшие ответы — работает даже без поддержки отмены.",
        "`debounce` ввода уменьшает число запросов; обработка `AbortError` без показа пользователю.",
      ),
    ], ["Названа причина гонки", "Описана отмена", "Описан номер версии", "Упомянут debounce"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.async-await-abort.m1", "intermediate", "В каком порядке выполнится `console.log('a')` в `async` функции с `await null` перед ним и `console.log('b')` в синхронном коде после вызова?", ["`a`, затем `b`", "Одновременно", "`b`, затем `a`", "Зависит от среды"], 2, "Код после `await` — микрозадача, она выполнится после синхронного остатка текущей задачи."),
    mcq("js.async-await-abort.m2", "advanced", "Что произойдёт при `Promise.all([fail1, fail2])`, если отклонятся оба обещания?", ["Два необработанных отказа", "`all` отклонится первой причиной; второй отказ «поглощён» и необработанным не будет", "`AggregateError`", "Выполнится успешно"], 1, "`all` подписан на оба обещания; сообщает о первом отказе (замер: `Promise.all сообщил только: первая`)."),
    mcq("js.async-await-abort.m3", "advanced", "Зачем в `createLatestSearch` кроме отмены хранится номер версии?", ["`searchFn` может не учитывать сигнал, и устаревший ответ всё равно придёт — версия позволяет его отбросить", "Для скорости", "Для отладки", "Версия нужна `fetch`"], 0, "Отмена — кооперативная; номер версии даёт гарантию корректности независимо от реализации `searchFn`."),
    open("js.async-await-abort.m4", "advanced", "Спроектируйте механизм отмены для многошагового сценария «загрузить данные → обработать → сохранить» с возможностью уйти со страницы в любой момент.", [
      ul(
        "Один `AbortController` на сценарий; `signal` передаётся во все шаги: `fetch`, таймеры, собственные циклы (`throwIfAborted()` между шагами).",
        "При отмене: прерывание сетевых запросов, снятие слушателей и таймеров в `finally`, откат или пометка частично выполненных операций (отмена не откатывает побочные эффекты).",
        "Шаг «сохранить» — идемпотентный, с идентификатором операции; не отменять после «точки невозврата» или делать компенсирующее действие.",
        "Обработка `AbortError` без показа пользователю; логирование причины.",
        "Тесты: отмена до начала, посреди каждого шага, после завершения; нет «висящих» таймеров и слушателей.",
      ),
    ], ["Один контроллер на сценарий", "Сигнал передаётся во все шаги", "Описана очистка и компенсация", "Описаны тесты отмены"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.async-await-abort.f1", front: "async/await?", back: "async-функция всегда возвращает Promise; await приостанавливает только её; код после await — микрозадача." },
    { id: "js.async-await-abort.f2", front: "Параллельно или по очереди?", back: "await подряд — по очереди (≥100 мс для 2×50); Promise.all или «создать, потом await» — параллельно." },
    { id: "js.async-await-abort.f3", front: "forEach и map?", back: "forEach(async) не ждёт; map(async) → массив обещаний → Promise.all; for…of с await — по порядку." },
    { id: "js.async-await-abort.f4", front: "return await в try?", back: "Без await отказ приходит после выхода из try — catch не поймает." },
    { id: "js.async-await-abort.f5", front: "AbortController?", back: "signal в API; abort(reason) → aborted=true, reason (AbortError), событие abort один раз. Свои функции должны слушать сигнал." },
    { id: "js.async-await-abort.f6", front: "Тайм-аут?", back: "AbortSignal.timeout(ms) → TimeoutError; AbortSignal.any([...]) объединяет сигналы; fetch обрывает запрос." },
    { id: "js.async-await-abort.f7", front: "Гонка запросов?", back: "Отменять предыдущий запрос + номер версии + debounce; AbortError не показывать пользователю." },
  ],

  sources: [
    { title: "ECMAScript: Async Function Definitions", url: "https://tc39.es/ecma262/#sec-async-function-definitions", publisher: "ECMA" },
    { title: "ECMAScript: Await", url: "https://tc39.es/ecma262/#await", publisher: "ECMA" },
    { title: "DOM Standard: Aborting ongoing activities (AbortController, AbortSignal)", url: "https://dom.spec.whatwg.org/#aborting-ongoing-activities", publisher: "WHATWG" },
    { title: "Fetch Standard", url: "https://fetch.spec.whatwg.org/", publisher: "WHATWG" },
    { title: "MDN: async function", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function", publisher: "MDN" },
    { title: "MDN: await", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await", publisher: "MDN" },
    { title: "MDN: AbortController", url: "https://developer.mozilla.org/en-US/docs/Web/API/AbortController", publisher: "MDN" },
    { title: "MDN: AbortSignal.timeout()", url: "https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static", publisher: "MDN" },
    { title: "MDN: AbortSignal.any()", url: "https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static", publisher: "MDN" },
  ],
};
