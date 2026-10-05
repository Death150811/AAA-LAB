import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p04Loader: Project = {
  id: "js.p04-loader",
  domain: "js",
  order: 4,
  title: "Загрузчик с лимитом, повторами и отменой",
  subtitle: "fetchAll, createLimiter и retry: параллелизм не выше limit, повторы с удваивающейся задержкой, тайм-аут на попытку и отмена — 31 проверка на настоящем http-сервере",
  level: "advanced",
  estimatedHours: 12,
  buildsOn: ["js.p03-dependency-graph"],
  topics: [
    "js.event-loop",
    "js.promises",
    "js.async-await-abort",
    "js.errors-debugging",
  ],
  objective:
    "Написать модуль `loader.mjs`, который загружает сотни адресов так, как это делает надёжный продакшен-код: **не больше N запросов одновременно**, повторы только там, где они имеют смысл (сеть, тайм-аут, `5xx`, `429`), **удваивающиеся задержки**, **тайм-аут на каждую попытку**, прогресс и **отмена**, которая прерывает запросы и не ждёт задержек. Проект закрепляет `Promise`, `async/await`, `AbortController`, очереди и ошибки.",
  scenario: [
    p("Сервис «Лаборатории» собирает карточки товаров с сотни партнёрских адресов. Первая версия делала `Promise.all(urls.map(fetch))`: на 500 адресах партнёры банили за шквал запросов, один упавший адрес ронял всю загрузку, а при уходе пользователя со страницы запросы продолжались. «Починка» через `setTimeout` вставила паузы, но не научилась отличать временный сбой от окончательного."),
    p("Вам нужно написать модуль `loader.mjs` с тремя «кирпичами» и их композицией: `createLimiter(limit)` (очередь с ограничением параллелизма), `retry(fn, options)` (повторы с задержкой и отменой) и `fetchAll(urls, options)` (загрузка списка адресов). `fetchAll` **никогда не отклоняется из-за сбоя отдельного адреса** — результат каждого адреса описывается элементом `{ ok, value | error, attempts }` в порядке входа. Отклоняется он только при отмене. Проверка `check.mjs` (31 проверка) запускает настоящий http-сервер с задержками, сбоями, оборванными соединениями и подсчётом одновременных запросов."),
    code("js", `// Заготовка проекта «Загрузчик». Реализуйте модуль, затем запустите:  node check.mjs .
// Имена экспортов менять нельзя; подробности — в описании проекта.

export class HttpError extends Error {
  // name = "HttpError", поле status
}

export function isRetriable(error) { throw new Error("не реализовано: isRetriable"); }
export function createLimiter(limit) { throw new Error("не реализовано: createLimiter"); }
export async function retry(fn, options) { throw new Error("не реализовано: retry"); }
export async function fetchAll(urls, options) { throw new Error("не реализовано: fetchAll"); }`, { filename: "starter/loader.mjs" }),
    table(
      ["Функция", "Что делает", "Ключевые параметры"],
      [
        ["`createLimiter(limit)`", "Возвращает `run(task)`: одновременно выполняется не больше `limit` задач, остальные ждут; ошибка задачи освобождает место", "`limit` — целое ≥ 1, иначе `RangeError`"],
        ["`retry(fn, options)`", "`fn(attempt)` с повторами; возвращает `{ value, attempts }`; последняя ошибка получает поле `attempts`", "`retries`, `delayMs` (× 2 на каждую попытку), `shouldRetry`, `signal`, `sleep`"],
        ["`isRetriable(error)`", "Сеть (`TypeError`), `TimeoutError`, `HttpError` 5xx и 429 — да; остальные 4xx и отмена — нет", "—"],
        ["`fetchAll(urls, options)`", "Загрузка списка с лимитом, повторами, тайм-аутом, прогрессом и отменой", "`limit`, `retries`, `retryDelayMs`, `timeoutMs`, `signal`, `fetchImpl`, `onProgress`, `parse`, `sleep`"],
        ["`HttpError`", "Ошибка статуса: `name = \"HttpError\"`, поле `status`", "—"],
      ],
      "Контракт модуля",
    ),
  ],
  requirements: [
    "`loader.mjs` экспортирует `HttpError`, `isRetriable`, `createLimiter`, `retry`, `fetchAll`.",
    "`createLimiter(limit)`: не больше `limit` задач одновременно (замер по данным сервера и по счётчику), задачи стартуют в порядке постановки, результат и отказ задачи возвращаются её вызывающему; ошибка (в том числе синхронная) освобождает место и не останавливает очередь; неверный `limit` (`0`, `1.5`, `-1`, строка) — `RangeError`.",
    "`retry(fn, { retries = 2, delayMs = 50, shouldRetry = isRetriable, signal, sleep })`: всего до `retries + 1` попыток; перед повтором — задержка `delayMs × 2^(попытка − 1)` (50, 100, 200…); возвращает `{ value, attempts }`; после последней неудачи бросает последнюю ошибку с полем `attempts`; неповторяемая ошибка — одна попытка; `signal` прерывает задержку и новые попытки не допускает.",
    "`isRetriable`: `TypeError` (сеть), `TimeoutError`, `HttpError` со статусом ≥ 500 и `429` — да; `HttpError` 4xx (кроме 429), обычные `Error`, `AbortError` — нет.",
    "`fetchAll(urls, options)`: результаты в **порядке входа**, а не в порядке завершения; элемент — `{ url, ok: true, value, attempts }` или `{ url, ok: false, error, attempts }`; `parse: \"json\"` (по умолчанию) или `\"text\"`; пустой список — `[]`; `fetchImpl` внедряется (по умолчанию глобальный `fetch`).",
    "Одновременно выполняется не больше `limit` запросов (по умолчанию 4); сервер подтверждает, что лимит достигается, но не превышается; `limit = 1` — строго по очереди.",
    "Повторы: `5xx` повторяется (`fail=2` при `retries = 2` — успех с третьей попытки, `retries = 1` — ошибка `HttpError` 500 после двух попыток); `4xx` не повторяется (один запрос), `429` повторяется; оборванное соединение повторяется и в итоге даёт `TypeError`.",
    "Тайм-аут применяется **к каждой попытке** (`AbortSignal.timeout(timeoutMs)` объединяется с внешним сигналом через `AbortSignal.any`): медленный ответ даёт `TimeoutError`, попытки повторяются, общее время ограничено.",
    "`onProgress({ done, total, failed })` вызывается после завершения каждого адреса; в конце `done === total`, `failed` равно числу неудач.",
    "Отмена через `signal`: `fetchAll` отклоняется **причиной сигнала**, идущие запросы прерываются (сервер видит оборванные соединения), новые не стартуют, ожидание задержки повтора прерывается немедленно; уже отменённый сигнал — отказ без единого запроса.",
    "Сбой отдельных адресов не отклоняет `fetchAll` (аналог `Promise.allSettled`), но отмена — отклоняет: это не «результат с ошибкой».",
  ],
  constraints: [
    "Без внешних библиотек: только `fetch`, `AbortController`, `AbortSignal`, `Promise`, таймеры.",
    "Нельзя запускать все запросы разом (`Promise.all(urls.map(...))` без ограничителя) и нельзя проверять лимит пакетами «по N, ждём самого медленного».",
    "Нельзя повторять `4xx` (кроме `429`) и ошибки логики; нельзя ждать задержку повтора при отменённом сигнале.",
    "Нельзя использовать `setInterval` для очередей и опроса; нельзя оставлять активные таймеры после завершения.",
    "Нельзя глотать причину отмены: наружу уходит `signal.reason`, а не новая ошибка.",
    "Время (`sleep`) и сеть (`fetchImpl`) внедряются параметрами, чтобы логика проверялась без реальных задержек.",
  ],
  expected: [
    "`node check.mjs .` печатает `Пройдено проверок: 31 из 31` (повторяемо, 3 запуска подряд).",
    "На сервере максимум одновременных запросов равен `limit` (3 при `limit: 3`, 1 при `limit: 1`).",
    "Нестабильный адрес (`500, 500, затем 200`) загружается с третьей попытки, а запрещённый (`403`) — ровно одним запросом.",
    "Отмена в середине загрузки 20 адресов оставляет не более 4 стартовавших запросов и оборванные соединения на сервере.",
  ],
  technical: [
    "Очередь ограничителя: `active` — число работающих задач, `queue` — ожидающие; `next()` запускает задачи, пока `active < limit`; освобождение места — в `finally` (иначе ошибка «съедает» слот и очередь встаёт: проверьте `limit = 1`).",
    "Запускайте задачу через `Promise.resolve().then(task)`: так синхронное исключение превращается в отказ и не ломает очередь.",
    "Задержка повтора — `delayMs * 2 ** (attempt - 1)`; ожидание делайте отменяемым: `setTimeout` + подписка на `abort` с `clearTimeout` и `removeEventListener`.",
    "Тайм-аут попытки: `AbortSignal.timeout(ms)` создаёт сигнал с причиной `TimeoutError`; объединение с внешним — `AbortSignal.any([signal, timeout])`; `fetch` отклоняется причиной сигнала.",
    "`fetch` не отклоняется на `404`/`500`: проверяйте `response.ok` и бросайте `HttpError`. Сетевая ошибка — `TypeError`.",
    "Различайте «ошибку результата» и отмену: если `signal.aborted`, перебрасывайте `signal.reason` вместо возврата `{ ok: false }`.",
    "Порядок результатов обеспечивается тем, что вы собираете массив промисов в порядке входа (`Promise.all(list.map(...))`), а не пушите результаты по мере завершения.",
    "Не оставляйте «висящих» обещаний: после отмены очередь отклоняет ожидающие задачи сразу, а не запускает их.",
  ],
  acceptance: [
    "`node check.mjs .` — 31 из 31, три запуска подряд без нестабильности.",
    "Заготовка проходит 0 из 31 проверок: каждая проверка действительно требует реализации.",
    "Каждый из восьми «плохих» вариантов проваливает проверку: от 1 (утечка слота ограничителя) до 7 (отказ всего результата при сбое отдельного адреса).",
    "После `fetchAll` на сервере нет висящих соединений; процесс проверки завершается сам (нет активных таймеров).",
    "Нет `setInterval`, `Promise.all(urls.map(fetch))` без ограничителя и повторов `4xx`.",
  ],
  hints: [
    "Начните с `createLimiter` и проверьте его отдельно: максимум одновременных задач, порядок, ошибка освобождает место. Остальное строится на нём.",
    "Если очередь «встала» после первой ошибки, вы освобождаете слот только при успехе. Используйте `.finally`.",
    "`retry` легко проверить без сети: внедрите `sleep` и запишите задержки — должно получиться `50, 100, 200`.",
    "Если `fetchAll` отклоняется при сбое одного адреса, вы пробрасываете ошибку элемента. Для элемента нужен `{ ok: false, error }`, а отмена — отдельная ветка.",
    "Если порядок результатов «плавает», вы собираете результаты по мере завершения. Собирайте массив промисов по порядку входа.",
    "Если тайм-аут не срабатывает, вы не передали сигнал в `fetch` или не объединили его с внешним (`AbortSignal.any`).",
    "Если после отмены запросы продолжаются, проверьте, что сигнал попадает и в `fetch`, и в ожидание задержки, и что очередь не запускает новые задачи.",
  ],
  advanced: [
    "Добавьте уважение к заголовку `Retry-After` (секунды и дата) для `429` и `503`.",
    "Реализуйте джиттер задержек (`full jitter`) с внедряемым генератором случайных чисел и сравните нагрузку на сервер.",
    "Добавьте приоритеты и отмену отдельных задач в `createLimiter` (`run(task, { priority, signal })`).",
    "Сделайте `fetchAll` асинхронным генератором, выдающим результаты по мере готовности (`for await`), сохраняя порядок индексов в элементах.",
    "Добавьте «автоматический выключатель» (circuit breaker): после N подряд неудач к хосту повторы прекращаются на время охлаждения.",
  ],
  failureModes: [
    "**Все запросы разом (`Promise.all` без ограничителя):** сервер видит больше трёх одновременных запросов при `limit: 3`; проваливаются проверки лимита и отмены; 28 из 31.",
    "**Повторяются все `HttpError`, включая `403`:** запрещённый адрес запрашивается несколько раз; 27 из 31.",
    "**Задержка без удвоения:** повторы идут с постоянным интервалом; 29 из 31.",
    "**Результаты в порядке завершения:** порядок зависит от скорости ответов; 27 из 31.",
    "**Сбой отдельного адреса отклоняет весь результат:** вместо `{ ok: false }` приходит исключение; 24 из 31 — самый тяжёлый провал.",
    "**Игнорирование сигнала отмены:** запросы продолжаются, задержка повтора не прерывается; 29 из 31.",
    "**Нет тайм-аута на попытку:** медленный адрес не даёт `TimeoutError`, он ждёт ответа до конца; 29 из 31.",
    "**Слот ограничителя освобождается только при успехе:** после первой ошибки очередь с `limit = 1` встаёт навсегда (проверка падает по тайм-ауту); 30 из 31.",
  ],
  rubric: [
    { criterion: "Ограничение параллелизма", weight: 20, description: "Очередь с `limit`, освобождение слота при любом исходе, порядок старта, поведение при `limit = 1`." },
    { criterion: "Повторы и задержки", weight: 20, description: "Какие ошибки повторяются, удвоение задержки, число попыток, поле `attempts`, `shouldRetry`." },
    { criterion: "Тайм-ауты и отмена", weight: 25, description: "`AbortSignal.timeout`, `AbortSignal.any`, прерывание запросов и задержки, причина отмены, отсутствие новых запросов." },
    { criterion: "Результаты и ошибки", weight: 15, description: "Порядок входа, элементы `{ ok, … }`, `HttpError`, различие сбоя и отмены, `RangeError` для неверного `limit`." },
    { criterion: "Прогресс и API", weight: 10, description: "`onProgress`, `parse`, `fetchImpl`, `sleep`, пустой вход, чистота интерфейса." },
    { criterion: "Тестируемость и чистота", weight: 10, description: "Внедряемые зависимости, нет активных таймеров, нет `setInterval`, читаемый код." },
  ],
  solution: [
    p("Эталон — один файл `loader.mjs` (около 75 строк). Он проходит все 31 проверку при трёх запусках подряд; заготовка проходит 0 из 31, а каждый из восьми намеренно испорченных вариантов — меньше 31."),
    h("loader.mjs"),
    code("js", `// Загрузчик: лимит параллелизма, повторы с задержкой, тайм-аут на попытку и отмена
export class HttpError extends Error {
  constructor(status) { super(\`HTTP \${status}\`); this.name = "HttpError"; this.status = status; }
}

const sleepDefault = (ms, signal) => new Promise((resolve, reject) => {
  signal?.throwIfAborted();
  const timer = setTimeout(() => { signal?.removeEventListener("abort", onAbort); resolve(); }, ms);
  const onAbort = () => { clearTimeout(timer); reject(signal.reason); };
  signal?.addEventListener("abort", onAbort, { once: true });
});

/** Повторяемые сбои: сеть, тайм-аут, 5xx и 429. Остальные 4xx и отмена — нет. */
export const isRetriable = (error) =>
  error?.name === "TimeoutError" || error instanceof TypeError || (error instanceof HttpError && (error.status >= 500 || error.status === 429));

/** Одновременно выполняется не больше \`limit\` задач; остальные ждут в очереди. Ошибка задачи освобождает место. */
export function createLimiter(limit) {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError("limit — целое число не меньше 1");
  let active = 0;
  const queue = [];
  const next = () => {
    while (active < limit && queue.length) {
      const { task, resolve, reject } = queue.shift();
      active++;
      Promise.resolve().then(task).then(resolve, reject).finally(() => { active--; next(); });
    }
  };
  return (task) => new Promise((resolve, reject) => { queue.push({ task, resolve, reject }); next(); });
}

/** Выполняет fn(attempt); при повторяемом сбое ждёт delayMs × 2^(попытка − 1) и пробует снова, всего retries + 1 попыток. */
export async function retry(fn, { retries = 2, delayMs = 50, shouldRetry = isRetriable, signal, sleep = sleepDefault } = {}) {
  for (let attempt = 1; ; attempt++) {
    signal?.throwIfAborted();
    try {
      return { value: await fn(attempt), attempts: attempt };
    } catch (error) {
      if (signal?.aborted || attempt > retries || !shouldRetry(error)) { error.attempts = attempt; throw error; }
      await sleep(delayMs * 2 ** (attempt - 1), signal);
    }
  }
}

/** Загружает все адреса; результаты в порядке входа; сбой одного не отклоняет общий результат. */
export async function fetchAll(urls, { limit = 4, retries = 2, retryDelayMs = 50, timeoutMs = 1000, signal, fetchImpl = globalThis.fetch, onProgress, parse = "json", sleep } = {}) {
  const list = [...urls];
  const run = createLimiter(limit);
  const total = list.length;
  let done = 0, failed = 0;
  signal?.throwIfAborted();

  const one = async (url) => {
    try {
      const { value, attempts } = await retry(async () => {
        const attemptSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
        const response = await fetchImpl(url, { signal: attemptSignal });
        if (!response.ok) throw new HttpError(response.status);
        return parse === "text" ? await response.text() : await response.json();
      }, { retries, delayMs: retryDelayMs, signal, sleep });
      return { url, ok: true, value, attempts };
    } catch (error) {
      if (signal?.aborted) throw signal.reason;                      // отмена — это не «результат с ошибкой»
      failed++;
      return { url, ok: false, error, attempts: error.attempts ?? 1 };
    } finally {
      done++;
      onProgress?.({ done, total, failed });
    }
  };

  const results = await Promise.all(list.map((url) => run(() => (signal?.aborted ? Promise.reject(signal.reason) : one(url)))));
  signal?.throwIfAborted();
  return results;
}`, { filename: "loader.mjs", lineNumbers: true }),
    h("Самопроверка check.mjs"),
    p("Проверка поднимает локальный http-сервер с маршрутами `ok` (задержка), `flaky` (500 на первых N запросах), `forbidden` (403), `rate` (429 на первом запросе), `slow` (800 мс), `boom` (обрыв соединения) и считает одновременные запросы, общее число запросов и оборванные соединения. Каждая проверка ограничена по времени (5 секунд): зависшая реализация даёт красную строку, а не бесконечное ожидание."),
    code("js", `// Самопроверка проекта «Загрузчик». Запуск: node check.mjs [каталог с loader.mjs]
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = path.resolve(process.argv[2] ?? "solution");
const { fetchAll, createLimiter, retry, HttpError, isRetriable } = await import(pathToFileURL(path.join(dir, "loader.mjs")).href);

// ── Тестовый сервер: задержки, сбои, учёт одновременных запросов ──
const stats = { inflight: 0, max: 0, requests: 0, aborted: 0, perPath: new Map() };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const n = (stats.perPath.get(url.pathname + url.search) ?? 0) + 1;
  stats.perPath.set(url.pathname + url.search, n);
  stats.requests++; stats.inflight++; stats.max = Math.max(stats.max, stats.inflight);
  let finished = false;
  const done = () => { if (!finished) { finished = true; stats.inflight--; } };
  req.on("close", () => { if (!res.writableEnded) { stats.aborted++; } done(); });
  const reply = (status, body = {}, delay = 20, headers = {}) => setTimeout(() => { if (res.destroyed) return; res.writeHead(status, { "content-type": "application/json", ...headers }); res.end(JSON.stringify(body)); done(); }, delay);
  const [, kind, id] = url.pathname.split("/");
  if (kind === "ok") return reply(200, { id: Number(id) }, Number(url.searchParams.get("ms") ?? 20));
  if (kind === "text") return reply(200, { id }, 5);
  if (kind === "flaky") { const failUntil = Number(url.searchParams.get("fail") ?? 2); return n <= failUntil ? reply(500, { error: "сбой" }, 5) : reply(200, { id: Number(id), attempt: n }, 5); }
  if (kind === "forbidden") return reply(403, { error: "нельзя" }, 5);
  if (kind === "rate") return n === 1 ? reply(429, {}, 5) : reply(200, { ok: true }, 5);
  if (kind === "slow") return reply(200, { slow: true }, 800);
  if (kind === "boom") { res.destroy(); return; }
  reply(404, {}, 5);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = \`http://127.0.0.1:\${server.address().port}\`;
const reset = () => { stats.max = 0; stats.requests = 0; stats.aborted = 0; stats.perPath.clear(); };

let total = 0, passed = 0;
const failed = [];
async function check(name, fn) {
  total++;
  let ok = false, note = "";
  let timer;
  try { const r = await Promise.race([fn(), new Promise((_, rej) => { timer = setTimeout(() => rej(new Error("проверка не уложилась в 5 с (зависание?)")), 5000); })]); ok = r === true; if (!ok) note = \` (вернуло \${typeof r === "object" ? JSON.stringify(r) : String(r)})\`; } catch (e) { note = \` (\${e?.name ?? "Error"}: \${String(e?.message).slice(0, 70)})\`; }
  finally { clearTimeout(timer); }
  if (ok) passed++; else failed.push(name);
  console.log(\`\${ok ? "OK " : "НЕТ"}  \${name}\${ok ? "" : note}\`);
}
const urls = (kind, n, q = "") => Array.from({ length: n }, (_, i) => \`\${base}/\${kind}/\${i}\${q}\`);
const fast = { retryDelayMs: 5 };

// ── createLimiter ──
await check("createLimiter: не больше limit одновременно, все задачи выполнены, результаты возвращены", async () => {
  const run = createLimiter(3); let active = 0, max = 0;
  const out = await Promise.all(Array.from({ length: 10 }, (_, i) => run(async () => { active++; max = Math.max(max, active); await new Promise((r) => setTimeout(r, 10)); active--; return i * 2; })));
  return max === 3 && out.join() === "0,2,4,6,8,10,12,14,16,18";
});
await check("createLimiter: ошибка задачи освобождает место и не останавливает очередь", async () => {
  const run = createLimiter(1); const results = await Promise.allSettled([run(async () => { throw new Error("сбой"); }), run(async () => "вторая"), run(() => "третья")]);
  return results.map((r) => r.status + ":" + (r.value ?? r.reason.message)).join() === "rejected:сбой,fulfilled:вторая,fulfilled:третья";
});
await check("createLimiter: задачи стартуют в порядке постановки; синхронная ошибка задачи не ломает лимитер", async () => {
  const run = createLimiter(2); const started = [];
  await Promise.allSettled(Array.from({ length: 5 }, (_, i) => run(() => { started.push(i); if (i === 1) throw new Error("синхронно"); return new Promise((r) => setTimeout(r, 5)); })));
  return started.join() === "0,1,2,3,4";
});
await check("createLimiter(0) и createLimiter(1.5) → RangeError", () => [0, 1.5, -1, "2"].every((v) => { try { createLimiter(v); return false; } catch (e) { return e instanceof RangeError; } }));

// ── retry ──
await check("retry: успех с первой попытки — attempts 1, fn получает номер попытки", async () => { const seen = []; const r = await retry((a) => { seen.push(a); return "ok"; }); return r.value === "ok" && r.attempts === 1 && seen.join() === "1"; });
await check("retry: повторяет повторяемые сбои до успеха, задержки удваиваются (50, 100, 200)", async () => {
  const delays = []; let n = 0;
  const r = await retry(() => { if (++n < 4) throw new HttpError(503); return "готово"; }, { retries: 3, delayMs: 50, sleep: async (ms) => { delays.push(ms); } });
  return r.value === "готово" && r.attempts === 4 && delays.join() === "50,100,200";
});
await check("retry: после retries + 1 попыток бросает последнюю ошибку с полем attempts", async () => { try { await retry(() => { throw new HttpError(500); }, { retries: 2, sleep: async () => {} }); return false; } catch (e) { return e instanceof HttpError && e.status === 500 && e.attempts === 3; } });
await check("retry: неповторяемая ошибка (HTTP 403, обычный Error) — одна попытка", async () => { let n = 0; for (const err of [new HttpError(403), new Error("логика")]) { try { await retry(() => { n++; throw err; }, { retries: 5, sleep: async () => {} }); } catch {} } return n === 2; });
await check("retry: shouldRetry можно переопределить", async () => { let n = 0; try { await retry(() => { n++; throw new Error("любая"); }, { retries: 2, shouldRetry: () => true, sleep: async () => {} }); } catch {} return n === 3; });
await check("retry: отмена прерывает ожидание задержки и новых попыток не делает", async () => { const ac = new AbortController(); let n = 0; const p = retry(() => { n++; throw new HttpError(500); }, { retries: 5, delayMs: 200, signal: ac.signal }); setTimeout(() => ac.abort(new Error("стоп")), 30); const t0 = Date.now(); try { await p; return false; } catch (e) { return e.message === "стоп" && n === 1 && Date.now() - t0 < 150; } });
await check("isRetriable: сеть (TypeError), TimeoutError, 5xx, 429 — да; 4xx, AbortError — нет", () => isRetriable(new TypeError("fetch failed")) && isRetriable(new DOMException("t", "TimeoutError")) && isRetriable(new HttpError(500)) && isRetriable(new HttpError(429)) && !isRetriable(new HttpError(404)) && !isRetriable(new DOMException("a", "AbortError")));

// ── fetchAll ──
await check("fetchAll: результаты в порядке входа, значения разобраны", async () => { reset(); const r = await fetchAll(urls("ok", 8, "?ms=5"), { limit: 4 }); return r.length === 8 && r.every((x, i) => x.ok && x.value.id === i && x.attempts === 1 && x.url.endsWith(\`/ok/\${i}?ms=5\`)); });
await check("fetchAll: порядок входа сохраняется, даже если ответы приходят в другом порядке", async () => { const u = [\`\${base}/ok/0?ms=150\`, \`\${base}/ok/1?ms=10\`, \`\${base}/ok/2?ms=60\`]; const r = await fetchAll(u, { limit: 3 }); return r.map((x) => x.value.id).join() === "0,1,2"; });
await check("fetchAll: одновременно не больше limit запросов (по данным сервера), лимит достигается", async () => { reset(); await fetchAll(urls("ok", 12), { limit: 3 }); return stats.max === 3; });
await check("fetchAll: limit = 1 — строго по очереди", async () => { reset(); await fetchAll(urls("ok", 5, "?ms=5"), { limit: 1 }); return stats.max === 1 && stats.requests === 5; });
await check("fetchAll: пустой список → []", async () => (await fetchAll([])).length === 0);
await check("fetchAll: сбои не отклоняют общий результат; ошибка и число попыток в элементе", async () => {
  reset(); const r = await fetchAll([\`\${base}/ok/1\`, \`\${base}/forbidden/1\`, \`\${base}/ok/2\`], { ...fast });
  return r[0].ok && r[2].ok && r[1].ok === false && r[1].error instanceof HttpError && r[1].error.status === 403 && r[1].attempts === 1;
});
await check("fetchAll: 5xx повторяется: fail=2 при retries=2 — успех с третьей попытки", async () => { reset(); const [r] = await fetchAll([\`\${base}/flaky/1?fail=2\`], { retries: 2, ...fast }); return r.ok && r.attempts === 3 && r.value.attempt === 3 && stats.requests === 3; });
await check("fetchAll: retries=1 при fail=2 — ошибка HttpError 500 после двух попыток", async () => { reset(); const [r] = await fetchAll([\`\${base}/flaky/2?fail=2\`], { retries: 1, ...fast }); return !r.ok && r.error.status === 500 && r.attempts === 2 && stats.requests === 2; });
await check("fetchAll: 4xx не повторяется (один запрос), 429 повторяется", async () => { reset(); const [a] = await fetchAll([\`\${base}/forbidden/9\`], { retries: 3, ...fast }); const forbiddenRequests = stats.requests; const [b] = await fetchAll([\`\${base}/rate/9\`], { retries: 3, ...fast }); return !a.ok && forbiddenRequests === 1 && b.ok && b.attempts === 2; });
await check("fetchAll: разрыв соединения (сеть) повторяется и в итоге ошибка TypeError", async () => { reset(); const [r] = await fetchAll([\`\${base}/boom/1\`], { retries: 2, ...fast }); return !r.ok && r.error instanceof TypeError && r.attempts === 3 && stats.requests === 3; });
await check("fetchAll: тайм-аут на попытку: TimeoutError, попытки повторяются, общее время ограничено", async () => { reset(); const t0 = Date.now(); const [r] = await fetchAll([\`\${base}/slow/1\`], { timeoutMs: 80, retries: 1, ...fast }); const ms = Date.now() - t0; return !r.ok && r.error.name === "TimeoutError" && r.attempts === 2 && ms < 600; });
await check("fetchAll: задержки повторов настраиваются и удваиваются (внедрённый sleep)", async () => { const delays = []; await fetchAll([\`\${base}/flaky/3?fail=3\`], { retries: 3, retryDelayMs: 40, sleep: async (ms) => { delays.push(ms); } }); return delays.join() === "40,80,160"; });
await check("fetchAll: onProgress вызывается по мере завершения и в конце даёт done === total", async () => { const events = []; await fetchAll([\`\${base}/ok/1\`, \`\${base}/forbidden/1\`, \`\${base}/ok/3\`], { onProgress: (e) => events.push(e), ...fast }); return events.length === 3 && events.map((e) => e.done).join() === "1,2,3" && events.at(-1).total === 3 && events.at(-1).failed === 1; });
await check("fetchAll: parse: \\"text\\" возвращает строку", async () => { const [r] = await fetchAll([\`\${base}/text/7\`], { parse: "text" }); return r.ok && typeof r.value === "string" && JSON.parse(r.value).id === "7"; });
await check("fetchAll: внедряемый fetchImpl используется вместо глобального", async () => { const calls = []; const fake = async (u, init) => { calls.push([u, init.signal instanceof AbortSignal]); return { ok: true, json: async () => ({ fake: true }) }; }; const [r] = await fetchAll(["https://example.test/a"], { fetchImpl: fake }); return r.ok && r.value.fake && calls.length === 1 && calls[0][1] === true; });
await check("fetchAll: limit некорректен → RangeError", async () => { try { await fetchAll(urls("ok", 2), { limit: 0 }); return false; } catch (e) { return e instanceof RangeError; } });
await check("fetchAll: отмена в процессе — отказ причиной сигнала, запросы прерваны, новые не стартуют", async () => {
  reset(); const ac = new AbortController(); const p = fetchAll(urls("ok", 20, "?ms=200"), { limit: 4, signal: ac.signal });
  setTimeout(() => ac.abort(new Error("пользователь отменил")), 60);
  try { await p; return false; } catch (e) { await new Promise((r) => setTimeout(r, 300)); return e.message === "пользователь отменил" && stats.requests <= 4 && stats.aborted >= 1; }
});
await check("fetchAll: уже отменённый сигнал — отказ без единого запроса", async () => { reset(); try { await fetchAll(urls("ok", 3), { signal: AbortSignal.abort(new Error("заранее")) }); return false; } catch (e) { return e.message === "заранее" && stats.requests === 0; } });
await check("fetchAll: пока идёт ожидание повтора, отмена не ждёт конца задержки", async () => { reset(); const ac = new AbortController(); const t0 = Date.now(); const p = fetchAll([\`\${base}/flaky/5?fail=5\`], { retries: 5, retryDelayMs: 300, signal: ac.signal }); setTimeout(() => ac.abort(new Error("стоп")), 60); try { await p; return false; } catch (e) { return e.message === "стоп" && Date.now() - t0 < 250; } });
await check("fetchAll: смесь успехов и сбоев при ограниченной параллельности сохраняет порядок", async () => { const u = [\`\${base}/ok/0\`, \`\${base}/forbidden/1\`, \`\${base}/flaky/2?fail=1\`, \`\${base}/ok/3\`, \`\${base}/forbidden/4\`]; const r = await fetchAll(u, { limit: 2, retries: 2, ...fast }); return r.map((x) => (x.ok ? "ok" : "err")).join() === "ok,err,ok,ok,err" && r[2].attempts === 2; });

server.closeAllConnections?.(); server.close();
console.log(\`\\nПройдено проверок: \${passed} из \${total}\`);
if (failed.length) console.log("Не прошли: " + failed.length);
process.exit(failed.length ? 1 : 0);`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 31 из 31`, { filename: "результат node check.mjs solution (Node.js 22.22.0)" }),
    code("text", `Пройдено проверок: 0 из 31
Не прошли: 31`, { filename: "результат node check.mjs starter (заготовка)" }),
    h("Проверка самой проверки: «плохие» варианты"),
    code("text", `b1-unlimited: Пройдено проверок: 28 из 31
b2-retry-4xx: Пройдено проверок: 27 из 31
b3-no-backoff: Пройдено проверок: 29 из 31
b4-completion-order: Пройдено проверок: 27 из 31
b5-reject-on-failure: Пройдено проверок: 24 из 31
b6-ignore-signal: Пройдено проверок: 29 из 31
b7-no-timeout: Пройдено проверок: 29 из 31
b8-slot-leak: Пройдено проверок: 30 из 31`, { filename: "результат check.mjs для вариантов с ошибками (из 31)" }),
    warn("Лимит параллелизма нельзя проверять «на глаз» по времени работы: измеряйте его там, где он реально ощущается — на сервере (счётчик одновременных запросов). Тест, который смотрит только на результаты клиента, пропустит и шквал запросов, и гонки."),
    tip("Когда отмена «не срабатывает», пройдите по цепочке: сигнал → `fetch` → ожидание задержки → очередь. Нужно, чтобы **каждое** звено подписывалось на сигнал: достаточно одного забытого — и запросы продолжают идти уже после отмены."),
    ul(
      "Для проверок в вашем окружении сохраните порт `0` у тестового сервера: так проверки не конфликтуют между запусками.",
      "Не уменьшайте тайм-ауты в проверках «чтобы быстрее»: они подобраны с запасом для медленных машин.",
    ),
  ],
};
