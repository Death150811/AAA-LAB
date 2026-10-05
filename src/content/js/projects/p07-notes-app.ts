import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p07NotesApp: Project = {
  id: "js.p07-notes-app",
  domain: "js",
  order: 7,
  title: "Итоговый проект: «Заметки» с офлайн-очередью",
  subtitle: "Чистый домен, API-клиент и приложение на чистом JavaScript: оптимистичные правки, очередь операций, версии и конфликты — 44 проверки в Node.js и Chromium на настоящем сервере",
  level: "mastery",
  estimatedHours: 24,
  isFinal: true,
  buildsOn: ["js.p04-loader", "js.p05-tasks-app", "js.p06-tiny-test"],
  topics: [
    "js.modules-esm",
    "js.promises",
    "js.async-await-abort",
    "js.dom-events",
    "js.forms-fetch",
    "js.storage-url-timers",
    "js.errors-debugging",
    "js.testing-architecture",
    "js.performance",
  ],
  objective:
    "Собрать законченное приложение «Заметки» на чистом JavaScript с модульной архитектурой: **три слоя** (`notes.mjs` — чистый домен, `api.mjs` — HTTP-клиент, `app.mjs` — страница), **оптимистичный интерфейс** (изменение видно сразу, откат при отказе), **очередь операций**, которая переживает обрыв связи и перезагрузку, **версии и конфликты**, доступность, безопасность и быстродействие. Проект объединяет модули ESM, промисы и отмену, события и формы, `fetch`, хранилище, ошибки и тестируемую архитектуру.",
  scenario: [
    p("Сервис «Лаборатории» хранит заметки сотрудников. Мобильная сеть то есть, то нет: первая версия приложения ждала ответ сервера после каждого нажатия, теряла правки при потере связи, показывала чужие данные после конфликта, а список из тысячи заметок перерисовывался по секунде. Нужно переписать клиент так, чтобы пользователь **никогда не ждал сервер**, ничего не терял и всегда понимал, что с его данными."),
    p("Серверная часть и разметка страницы даны готовыми (`server.mjs`, `index.html`): сервер хранит заметки в памяти, нумерует версии, отвечает `409` на устаревшую версию и умеет по команде проверки «пропадать» (оборванные соединения), тормозить и отвечать ошибками. Ваша работа — три модуля: домен, клиент и приложение. Проверка `check.mjs` (44 проверки) тестирует каждый слой отдельно: домен — в Node.js на **замороженных** входных данных, клиент — на настоящем сервере, приложение — в Chromium через Playwright, плюс статический анализ слоёв."),
    code("html", `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Заметки</title>
  <link rel="icon" href="data:,">
  <style>
    body { font: 16px/1.4 system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; }
    [hidden] { display: none !important; }
    form label { display: block; margin: .5rem 0; }
    form input, form textarea { display: block; width: 100%; box-sizing: border-box; }
    #list { padding: 0; list-style: none; }
    #list > li { border: 1px solid #8884; border-radius: .5rem; margin: .5rem 0; padding: .5rem .75rem; }
    #list > li[data-pending="true"] { opacity: .6; }
    .note-tags { display: flex; gap: .5rem; padding: 0; list-style: none; margin: .25rem 0; }
    .note-tags li { background: #8883; padding: 0 .5rem; border-radius: 1rem; }
    [aria-invalid="true"] { outline: 2px solid crimson; }
    #error { color: crimson; }
  </style>
</head>
<body>
  <h1>Заметки</h1>
  <p id="status" role="status" aria-live="polite"></p>
  <p id="error" role="alert" hidden></p>
  <button id="retry" type="button" hidden>Повторить отправку</button>

  <form id="note-form" novalidate>
    <label>Название <input name="title" maxlength="80" required></label>
    <label>Текст <textarea name="body" rows="3"></textarea></label>
    <label>Теги (через запятую) <input name="tags"></label>
    <button type="submit">Добавить</button>
  </form>

  <label>Поиск <input id="search" type="search"></label>
  <div id="tags" role="group" aria-label="Теги"></div>
  <p id="count"></p>
  <ul id="list" aria-label="Заметки"></ul>

  <section id="editor" aria-label="Редактор" hidden>
    <form id="edit-form" novalidate>
      <label>Название <input name="title" maxlength="80" required></label>
      <label>Текст <textarea name="body" rows="3"></textarea></label>
      <label>Теги <input name="tags"></label>
      <button id="save" type="submit">Сохранить</button>
      <button id="cancel" type="button">Отмена</button>
    </form>
  </section>

  <template id="note-template">
    <li>
      <button class="open" type="button"></button>
      <p class="preview"></p>
      <ul class="note-tags"></ul>
      <button class="delete" type="button">Удалить</button>
    </li>
  </template>

  <script type="module" src="app.mjs"></script>
</body>
</html>`, { filename: "index.html (дана, менять нельзя)" }),
    code("js", `// server.mjs — учебный сервер заметок (дан готовым, менять не нужно).
// API: GET /api/notes · POST /api/notes · PUT /api/notes/:id · DELETE /api/notes/:id
// Статика: / → index.html, *.mjs → из каталога publicDir.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

export async function startServer({ publicDir, indexHtml, port = 0 } = {}) {
  const notes = new Map();
  const log = [];                                   // журнал запросов к API: { method, path, body }
  const ctl = { failNext: 0, failStatus: 500, delayMs: 0, offline: false };   // управляющие рычаги для проверок
  let tick = 1_700_000_000_000, seq = 0;
  const nextTime = () => (tick += 1000);

  const add = (data) => { const note = { id: \`n\${++seq}\`, title: data.title, body: data.body ?? "", tags: data.tags ?? [], version: 1, updatedAt: nextTime() }; notes.set(note.id, note); return note; };
  const sorted = () => [...notes.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  const valid = (d) => d && typeof d.title === "string" && d.title.trim() !== "" && d.title.length <= 80 && (d.body === undefined || typeof d.body === "string")
    && (d.tags === undefined || (Array.isArray(d.tags) && d.tags.length <= 5 && d.tags.every((t) => typeof t === "string" && t.length <= 20)));
  const reset = (seed = []) => { notes.clear(); log.length = 0; seq = 0; tick = 1_700_000_000_000; Object.assign(ctl, { failNext: 0, failStatus: 500, delayMs: 0, offline: false }); seed.forEach(add); };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    if (ctl.offline && url.pathname.startsWith("/api/")) { req.socket.destroy(); return; }   // «нет сети» для API; страница и модули уже загружены
    const send = (status, body) => setTimeout(() => {
      if (res.destroyed) return;
      if (body === undefined) { res.writeHead(status); res.end(); return; }
      res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body));
    }, ctl.delayMs);
    if (!url.pathname.startsWith("/api/")) {
      const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      if (file === "index.html" && indexHtml) { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(indexHtml); return; }
      const full = path.join(publicDir, file);
      if (!full.startsWith(publicDir) || !fs.existsSync(full)) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "content-type": file.endsWith(".mjs") ? "text/javascript" : "text/plain" }); res.end(fs.readFileSync(full)); return;
    }
    let raw = ""; for await (const chunk of req) raw += chunk;
    let body; try { body = raw ? JSON.parse(raw) : undefined; } catch { return send(400, { error: "json" }); }
    log.push({ method: req.method, path: url.pathname, body });
    if (ctl.failNext > 0) { ctl.failNext--; return send(ctl.failStatus, { error: "сбой по требованию" }); }
    const m = url.pathname.match(/^\\/api\\/notes(?:\\/([^/]+))?$/);
    if (!m) return send(404, { error: "нет такого маршрута" });
    const id = m[1];
    if (req.method === "GET" && !id) return send(200, { notes: sorted() });
    if (req.method === "POST" && !id) return valid(body) ? send(201, { note: add(body) }) : send(422, { error: "title" });
    const note = id && notes.get(id);
    if (!note) return send(404, { error: "нет заметки" });
    if (req.method === "DELETE") { notes.delete(id); return send(204); }
    if (req.method === "PUT") {
      if (!valid(body)) return send(422, { error: "title" });
      if (body.version !== note.version) return send(409, { error: "conflict", note });
      Object.assign(note, { title: body.title, body: body.body ?? "", tags: body.tags ?? [], version: note.version + 1, updatedAt: nextTime() });
      return send(200, { note });
    }
    send(405, { error: "метод" });
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  return { url: \`http://127.0.0.1:\${server.address().port}\`, notes, log, ctl, reset, add, close: () => { server.closeAllConnections(); server.close(); } };
}`, { filename: "server.mjs (дан, менять нельзя)", collapsed: true }),
    code("js", `// notes.mjs — доменная логика заметок: чистые функции без DOM, сети и хранилищ.
// Заметка: { id, title, body, tags, version, updatedAt }. Операция очереди:
//   { type: "create", tempId, data } | { type: "update", id, version, data } | { type: "delete", id },  data = { title, body, tags }.
// Все функции чистые: входные массивы и объекты не изменяются.

// "a, b ,,A" → ["a", "b"]: без пустых и без повторов (регистр не важен), первое написание сохраняется
export function parseTags(text) { throw new Error("parseTags: не реализовано"); }

// { title, body, tags: "строка из формы" } → { ok, errors: { title?, tags? }, value: { title, body, tags: [] } }
export function validate(input) { throw new Error("validate: не реализовано"); }

// Текст для списка: схлопнутые пробелы, не длиннее max символов, длинный заканчивается «…»
export function preview(body, max = 80) { throw new Error("preview: не реализовано"); }

// Что видит пользователь: подтверждённые заметки + ожидающие операции; у каждой заметки pending и local
export function project(serverNotes, queue) { throw new Error("project: не реализовано"); }

// Сервер принял queue[0]: { notes, queue } без этой операции; следующие правки той же заметки получают новую версию
export function confirm(serverNotes, queue, note) { throw new Error("confirm: не реализовано"); }

// Сервер отклонил queue[0]: откат; для conflict (error.note) и notfound — особые правила
export function fail(serverNotes, queue, error) { throw new Error("fail: не реализовано"); }

// Фильтр по тексту { q } и тегу { tag } без учёта регистра
export function visible(notes, filter) { throw new Error("visible: не реализовано"); }

// [{ tag, count }] по убыванию числа, затем по алфавиту
export function tagCounts(notes) { throw new Error("tagCounts: не реализовано"); }`, { filename: "starter/notes.mjs" }),
    code("js", `// api.mjs — клиент HTTP API заметок: единый вид ошибок, тайм-аут, отмена. Без DOM и хранилищ.
// ApiError.kind: "network" | "timeout" | "conflict" (+ note) | "notfound" | "invalid" (+ status, details) | "server" (+ status)

export class ApiError extends Error {
  // TODO: name = "ApiError", поля kind и extra
}

// createApi({ baseUrl, fetchImpl, timeoutMs }) → { list(signal), create(data, signal), update(id, data, version, signal), remove(id, signal) }
export function createApi(options = {}) {
  throw new Error("createApi: не реализовано");
}`, { filename: "starter/api.mjs" }),
    code("js", `// app.mjs — связывает домен, API и страницу: состояние, очередь операций, рендер, события.
// Разметка index.html задана: #list, #note-form, #search, #tags, #count, #status, #error, #retry,
// #editor, #edit-form, <template id="note-template">. Подключите ./notes.mjs и ./api.mjs.
const $ = (selector) => document.querySelector(selector);
const list = $("#list"), form = $("#note-form"), search = $("#search"), tagsBox = $("#tags"), count = $("#count"), status = $("#status"), errorBox = $("#error");
const retry = $("#retry"), editor = $("#editor"), editForm = $("#edit-form"), template = $("#note-template");`, { filename: "starter/app.mjs" }),
    table(
      ["Слой", "Файл", "Зависит от", "Проверяется"],
      [
        ["Домен", "`notes.mjs`", "ничего (чистые функции)", "в Node.js, входные данные заморожены"],
        ["Клиент API", "`api.mjs`", "ничего (`fetch` внедряется)", "в Node.js на настоящем сервере"],
        ["Приложение", "`app.mjs`", "`./notes.mjs`, `./api.mjs`, страница", "в Chromium, настоящий сервер"],
      ],
      "Слои приложения и способ их проверки",
    ),
  ],
  requirements: [
    "**Домен.** `parseTags(text)`: разбор по запятым, обрезка пробелов, без пустых и без повторов (без учёта регистра, остаётся первое написание). `validate({ title, body, tags })` → `{ ok, errors, value }`: название обрезается, непустое и не длиннее 80 символов (`Введите название`, `Название длиннее 80 символов`), не больше 5 тегов (`Не больше 5 тегов`), каждый тег не длиннее 20 (`Тег длиннее 20 символов`); `value = { title, body, tags: [] }`, тело по умолчанию — пустая строка. `preview(body, max = 80)`: схлопывает пробелы и переводы строк, длинный текст обрезает до `max` символов и заканчивает `…`.",
    "**Домен: очередь.** Операции: `{ type: \"create\", tempId, data }`, `{ type: \"update\", id, version, data }`, `{ type: \"delete\", id }`. `project(serverNotes, queue)` — что видит пользователь: подтверждённые заметки с `pending: false, local: false`; создания — сверху (новейшее первым) с `pending: true, local: true`, `version: 0`; обновления — на месте с `pending: true`; удаления убирают заметку; операции над неизвестной заметкой игнорируются.",
    "`confirm(serverNotes, queue, note)` — сервер принял `queue[0]`: возвращает `{ notes, queue }` без этой операции; создание добавляет `note`, обновление заменяет заметку, удаление убирает; результат отсортирован по `updatedAt` (новейшие первыми); **следующие правки той же заметки получают новую `version`**, чужие операции не меняются. `fail(serverNotes, queue, error)` — отказ: обычный сбой откатывает только `queue[0]`; `kind: \"conflict\"` заменяет заметку серверной версией `error.note` и сбрасывает остальные правки этой заметки; `kind: \"notfound\"` удаляет заметку и сбрасывает её правки.",
    "`visible(notes, { q, tag })`: поиск по названию и тексту без учёта регистра (пробелы по краям запроса игнорируются), тег — без учёта регистра, оба условия вместе, порядок сохраняется. `tagCounts(notes)` → `[{ tag, count }]`: без учёта регистра, первое написание, по убыванию числа, затем по алфавиту. **Ни одна функция домена не изменяет аргументы** (проверка передаёт замороженные данные).",
    "**Клиент.** `createApi({ baseUrl, fetchImpl, timeoutMs })` → `list(signal)`, `create(data, signal)`, `update(id, data, version, signal)`, `remove(id, signal)`; возвращают заметки (`remove` — `null`). Ошибки — `ApiError` (`name`, `kind`): `network` (нет связи, причина в `cause`), `timeout` (сообщение называет метод и путь), `conflict` (`status`, `note`), `notfound`, `invalid` (`status`, `details`), `server` (5xx и некорректный JSON в успешном ответе).",
    "Клиент: тайм-аут на каждый запрос (`AbortSignal.timeout`) объединяется с внешним сигналом (`AbortSignal.any`); отмена отклоняет промис **причиной сигнала** (не `ApiError`), уже отменённый сигнал не делает ни одного запроса; идентификатор в пути кодируется (`encodeURIComponent`); `baseUrl` и `fetchImpl` внедряются.",
    "**Приложение: загрузка и вид.** Список `#list > li[data-id]` (новейшие первыми): `.open` с названием, `.preview`, `.note-tags .tag`, кнопка `.delete` с `aria-label=\"Удалить: название\"`; `#count` — `Заметок: 3 из 3`; кнопки тегов `#tags button[data-tag]` со счётчиками (`работа (2)`) и `aria-pressed`; `#status`: `Загрузка…`, `Сохранение…`, `Синхронизировано`, `Нет связи`, `Не синхронизировано: N`; `#retry` виден только при отсутствии связи, `#error` скрыт, пока нет сообщения.",
    "**Приложение: создание.** Отправка формы проверяется `validate`; при ошибке — сообщение в `#error`, `aria-invalid=\"true\"` и фокус на первом неверном поле, запроса нет. Иначе заметка появляется **сразу** (`data-pending=\"true\"`, временный `id` `tmp-…`, кнопки заблокированы), форма очищается, фокус — на названии; после ответа заметка получает настоящий `id`, `data-pending=\"false\"`.",
    "**Приложение: правка и удаление.** `.open` открывает `#editor` (поля заполнены, фокус на названии); «Сохранить» отправляет `PUT` с версией **на момент открытия**, закрывает редактор и возвращает фокус на `.open` этой заметки; `Escape` и «Отмена» закрывают без запроса и тоже возвращают фокус. Удаление убирает заметку сразу; фокус уходит на `.open` следующей заметки, у последней — предыдущей, у единственной — в поле названия.",
    "**Приложение: ошибки.** Ответ 5xx — изменение откатывается, `#error` содержит `Не удалось`; конфликт — `изменилась на сервере`, показана серверная версия; `404` — `уже удалена`, заметка исчезает. Нет связи (`network`, `timeout`) — **не ошибка**: операции остаются в очереди, статус `Не синхронизировано: N`, сообщения нет.",
    "**Приложение: очередь.** Очередь хранится в `localStorage` (`notes:queue:v1`, формат `{ v: 1, queue }`), читается при старте с проверкой формы операций (битые данные, посторонние элементы и недоступное хранилище не ломают приложение), отправляется по порядку по кнопке `#retry` и событию `online`; успешные операции снимаются. Две правки одной заметки подряд при медленном сервере проходят без конфликта (версия переносится).",
    "**Приложение: адрес и фокус.** Поиск `#search` фильтрует без запросов к серверу и пишет `?q=` (`replaceState`); тег — `?tag=` (`pushState`), «Назад»/«Вперёд» восстанавливают фильтр, начальные `?q=` и `?tag=` применяются. Перерисовка не должна «терять» фокус (в том числе на кнопке тега и на кнопке заметки при ответе сервера).",
    "**Безопасность и скорость.** Название, текст и теги выводятся только текстом (нет `innerHTML` и аналогов); на список один набор слушателей через делегирование (3 и 300 заметок — разница не больше 8); 1000 заметок отображаются, а ввод в поиск и сброс фильтра занимают меньше 500 мс; консоль без ошибок и предупреждений.",
    "**Архитектура.** `notes.mjs` и `api.mjs` ничего не импортируют; `app.mjs` импортирует только `./notes.mjs` и `./api.mjs`; домен не обращается к `document`, `window`, хранилищам, `fetch`, `location`, времени и случайности; клиент — к `document`, `window`, хранилищам, `location`.",
  ],
  constraints: [
    "Без фреймворков и библиотек; только стандартные API браузера и Node.js. `index.html` и `server.mjs` менять нельзя.",
    "Нельзя вставлять текст пользователя через `innerHTML`, `insertAdjacentHTML`, `outerHTML`, `document.write`; нельзя `eval` и `new Function`; нельзя встроенные обработчики `onclick=`.",
    "Нельзя вешать слушатели на каждую заметку: один набор на список, один на теги.",
    "Нельзя изменять аргументы функций домена (в том числе «временно», с откатом): входные данные могут быть заморожены.",
    "Нельзя ждать ответ сервера перед показом изменения и нельзя блокировать интерфейс на время запроса.",
    "Нельзя считать отсутствие связи ошибкой пользователя: данные не теряются и не откатываются.",
    "Нельзя хранить в очереди и показывать данные без проверки формы при чтении из `localStorage`.",
    "Слои нельзя смешивать: сеть и ошибки показа не живут в домене, DOM не живёт в клиенте.",
  ],
  expected: [
    "`node check.mjs .` печатает `Пройдено проверок: 44 из 44` (повторяемо, 3 запуска подряд; нужен Playwright и Chromium).",
    "Созданная заметка видна в списке до ответа сервера (при задержке 400 мс) и после ответа получает настоящий идентификатор.",
    "При обрыве связи четыре изменения (два создания, правка, удаление) остаются на экране, в очереди `localStorage` и уходят на сервер по порядку после `#retry` или события `online`.",
    "Две правки одной заметки при задержке сервера дают версию 3 без сообщения о конфликте; правка устаревшей версии даёт `изменилась на сервере` и серверный текст.",
    "Список из 1000 заметок перерисовывается быстрее 500 мс; число слушателей на 3 и на 300 заметках отличается не более чем на 8.",
  ],
  technical: [
    "**Модель «подтверждённое + очередь».** Храните `serverNotes` (то, что подтвердил сервер) и `queue` (то, что ещё не подтверждено). Показывайте `project(serverNotes, queue)`. Откат — это просто удаление операции из очереди: пересчёт вида даёт прежнюю картину, и копий «до изменения» хранить не нужно.",
    "**Одна очередь — один отправитель.** Отправляйте только `queue[0]`, дожидайтесь результата, затем снимайте операцию через `confirm` или откатывайте через `fail`. Флаг «идёт отправка» не даёт запустить второй цикл; новые операции подхватываются условием `while (queue.length)`.",
    "**Версии.** Версия правки фиксируется при открытии редактора (то, что видел пользователь). Следующие правки той же заметки в очереди получают версию из ответа сервера (`confirm`): иначе вторая правка получит `409` на собственную же первую.",
    "**Сеть и ошибки — разные вещи.** `network` и `timeout` оставляют очередь и включают режим «нет связи»; остальное — окончательный ответ сервера: операция снимается, пользователь видит сообщение.",
    "**Локальные заметки только для чтения.** Пока создание не подтверждено, у заметки временный `id`; редактировать и удалять её нельзя (кнопки заблокированы). Это убирает целый класс гонок (правка по ещё не существующему идентификатору).",
    "**Перерисовка и фокус.** Перед `replaceChildren` запомните селектор сфокусированного элемента (по `data-id` и классу или `data-tag`), после — найдите его и верните фокус. Запоминайте через `CSS.escape`.",
    "**Делегирование.** `list.addEventListener(\"click\", …)` и `e.target.closest(…)`; соседа для переноса фокуса при удалении вычисляйте до удаления.",
    "**Проверка формы очереди.** При чтении из `localStorage` фильтруйте операции предикатом `isOp`; всё, что не похоже на операцию, молча отбрасывайте.",
    "**Тестируемость.** Чистый домен проверяется без браузера; клиент получает `fetchImpl` и `baseUrl`; приложение создаёт клиент один раз и общается с ним через методы. Точка входа `app.mjs` — единственное место, где слои соединяются.",
  ],
  acceptance: [
    "`node check.mjs .` — 44 из 44, три запуска подряд без нестабильности.",
    "Заготовка проходит 2 из 44 проверок (две «вхолостую»: в пустых модулях нет обращений к странице и нет `innerHTML`); остальные 42 требуют реализации.",
    "Каждый из одиннадцати «плохих» вариантов проваливает хотя бы одну проверку: от 1 (слушатели на каждой заметке) до 7 (клиент сам трогает страницу).",
    "Ни одна функция домена не изменяет входные данные (проверки передают замороженные объекты).",
    "Нет `innerHTML` и аналогов; слои соблюдены (проверяется статически).",
  ],
  hints: [
    "Начните с домена: он чистый, проверяется мгновенно. Сначала `parseTags`, `validate`, `preview`, затем `project`, `confirm`, `fail`.",
    "Если `confirm` и `fail` кажутся запутанными, нарисуйте очередь из трёх операций и пройдите по ней руками: что осталось, что стало версией, что должно исчезнуть при конфликте.",
    "Клиент напишите так, чтобы **все** ответы превращались в `ApiError` или в значение: любые `fetch`-исключения, `5xx`, `404`, `409`, `422`, пустой и некорректный JSON.",
    "Если отмена и тайм-аут не работают, вы не передали `signal` в `fetch` или не объединили сигналы через `AbortSignal.any`.",
    "В приложении сначала сделайте только вид: список, теги, счётчик. Затем создание (с очередью), потом правка и удаление, потом ошибки и связь.",
    "Если после правок «две правки подряд» дают конфликт, версия второй операции не переносится после подтверждения первой.",
    "Если после ответа сервера фокус «улетает» на `body`, вы перестраиваете список и не возвращаете фокус на тот же элемент.",
    "Если при отсутствии связи изменения исчезают, вы откатываете операцию на `network`/`timeout`. Откат — только для окончательных ответов сервера.",
  ],
  advanced: [
    "Синхронизируйте вкладки: событие `storage` с ключом очереди должно обновлять вид без обратной записи.",
    "Сделайте «сворачивание» очереди: две правки одной заметки превращаются в одну, создание + удаление исчезают целиком; решите, что делать с операцией, которая уже отправляется.",
    "Добавьте `Retry-After`/экспоненциальные повторы при `network`, ограничив число попыток и показывая прогресс.",
    "Замените полную перерисовку списка на **сверку по ключам** (`data-id`): обновляйте, вставляйте и удаляйте только изменившиеся элементы, сохраняя узлы и фокус без специального кода.",
    "Реализуйте виртуализацию списка: в DOM только видимые заметки и запас, а `#count` и поиск работают по всему набору.",
    "Напишите собственный набор тестов домена на `tiny-test.mjs` из предыдущего проекта и сравните его со встроенной проверкой.",
  ],
  failureModes: [
    "**Интерфейс не оптимистичный (вид без очереди):** изменение появляется только после ответа сервера; не проходят проверки создания, удаления, офлайн-режима; 39 из 44.",
    "**Версии не переносятся после подтверждения:** вторая правка той же заметки получает `409` на собственную первую; 42 из 44.",
    "**Сетевой обрыв считается ошибкой:** операции откатываются вместо ожидания в очереди; 41 из 44.",
    "**Очередь не сохраняется:** после перезагрузки правки теряются, хранилище не очищается; 39 из 44.",
    "**Название через `innerHTML`:** разметка из заметки исполняется (`<img onerror>`); 42 из 44.",
    "**Слушатели на каждой заметке:** на 300 заметках слушателей заметно больше, чем на трёх (разница далеко за пределами порога 8); 43 из 44 — самый «тихий» провал.",
    "**Фокус теряется при перерисовке:** клавиатурный пользователь оказывается на `body` после ответа сервера и после клика по тегу; 41 из 44.",
    "**Клиент не передаёт сигнал в `fetch`:** ни тайм-аута, ни отмены; 41 из 44.",
    "**Конфликт `409` не отличается от сбоя:** пользователь видит «ошибка сервера» вместо актуальной версии; 42 из 44.",
    "**Домен изменяет аргументы:** в приложении это не видно, но на замороженных данных падает `TypeError`; 42 из 44.",
    "**Клиент сам показывает ошибки на странице:** слои смешаны, в Node.js клиент не работает вовсе; 37 из 44 — самый тяжёлый провал (7 красных проверок).",
  ],
  rubric: [
    { criterion: "Доменная логика", weight: 25, description: "Чистые функции, `project`/`confirm`/`fail`, версии, валидация, фильтры, неизменяемость аргументов." },
    { criterion: "API-клиент", weight: 15, description: "Единый вид ошибок, тайм-аут, отмена причиной сигнала, кодирование пути, внедряемые зависимости, некорректный JSON." },
    { criterion: "Приложение: формы и события", weight: 20, description: "Создание, правка, удаление, делегирование, валидация, URL-состояние поиска и тегов." },
    { criterion: "Офлайн и согласованность", weight: 15, description: "Очередь в `localStorage`, повтор и `online`, перенос версий, конфликт и «уже удалена», отличие сбоя от отсутствия связи." },
    { criterion: "Доступность и безопасность", weight: 10, description: "Фокус при перерисовке, удалении и редакторе, `aria-*`, `role`, вывод только текстом, устойчивость к битому хранилищу." },
    { criterion: "Архитектура и слои", weight: 10, description: "Нет импортов в домене и клиенте, точка сборки в `app.mjs`, чистота слоёв, читаемость." },
    { criterion: "Производительность", weight: 5, description: "Перерисовка 1000 заметок, независимость числа слушателей от размера данных, отсутствие лишних запросов при поиске." },
  ],
  solution: [
    p("Эталон — три файла: `notes.mjs` (около 70 строк), `api.mjs` (около 30) и `app.mjs` (около 130). Он проходит все 44 проверки при трёх запусках подряд; заготовка проходит 2 из 44, а каждый из одиннадцати намеренно испорченных вариантов — меньше 44. Замер на 1000 заметках (Chromium 141): ввод в поиск — около 30 мс, сброс фильтра с перестроением всего списка — 80–100 мс."),
    h("notes.mjs — домен"),
    code("js", `// notes.mjs — доменная логика заметок: чистые функции без DOM, сети и хранилищ.
// Заметка: { id, title, body, tags, version, updatedAt }. Операция очереди:
//   { type: "create", tempId, data } | { type: "update", id, version, data } | { type: "delete", id },  data = { title, body, tags }.
const MAX_TITLE = 80, MAX_TAGS = 5, MAX_TAG = 20;
const byNewest = (notes) => [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

export function parseTags(text) {
  const seen = new Set(), tags = [];
  for (const part of String(text ?? "").split(",")) {
    const tag = part.trim(), key = tag.toLowerCase();
    if (tag && !seen.has(key)) { seen.add(key); tags.push(tag); }          // без пустых и без повторов (регистр не важен)
  }
  return tags;
}

export function validate({ title, body, tags }) {
  const value = { title: String(title ?? "").trim(), body: String(body ?? ""), tags: parseTags(tags) };
  const errors = {};
  if (value.title === "") errors.title = "Введите название";
  else if (value.title.length > MAX_TITLE) errors.title = \`Название длиннее \${MAX_TITLE} символов\`;
  if (value.tags.length > MAX_TAGS) errors.tags = \`Не больше \${MAX_TAGS} тегов\`;
  else if (value.tags.some((t) => t.length > MAX_TAG)) errors.tags = \`Тег длиннее \${MAX_TAG} символов\`;
  return Object.keys(errors).length ? { ok: false, errors, value } : { ok: true, errors, value };
}

export function preview(body, max = 80) {
  const text = String(body ?? "").replace(/\\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

// Что видит пользователь: подтверждённые заметки + ожидающие операции (оптимистичное отображение).
export function project(serverNotes, queue) {
  let notes = serverNotes.map((n) => ({ ...n, pending: false, local: false }));
  const created = [];
  for (const op of queue) {
    if (op.type === "create") created.unshift({ id: op.tempId, ...op.data, version: 0, pending: true, local: true });
    else if (op.type === "update") notes = notes.map((n) => (n.id === op.id ? { ...n, ...op.data, pending: true } : n));
    else if (op.type === "delete") notes = notes.filter((n) => n.id !== op.id);
  }
  return [...created, ...notes];
}

// Сервер принял первую операцию очереди: обновляем подтверждённые заметки, снимаем операцию, переносим версию на следующие правки той же заметки.
export function confirm(serverNotes, queue, note) {
  const [op, ...rest] = queue;
  if (!op) return { notes: serverNotes, queue };
  const notes = op.type === "create" ? [note, ...serverNotes]
    : op.type === "update" ? serverNotes.map((n) => (n.id === op.id ? note : n))
    : serverNotes.filter((n) => n.id !== op.id);
  const next = op.type === "update" ? rest.map((o) => (o.type === "update" && o.id === op.id ? { ...o, version: note.version } : o)) : rest;
  return { notes: byNewest(notes), queue: next };
}

// Сервер отклонил первую операцию: откат; при конфликте берём серверную версию, при «нет заметки» — удаляем её, остальные правки заметки отбрасываем.
export function fail(serverNotes, queue, error) {
  const [op, ...rest] = queue;
  if (!op) return { notes: serverNotes, queue };
  const id = op.type === "create" ? undefined : op.id;
  if (id !== undefined && error.kind === "conflict" && error.note) return { notes: byNewest(serverNotes.map((n) => (n.id === id ? error.note : n))), queue: rest.filter((o) => o.id !== id) };
  if (id !== undefined && error.kind === "notfound") return { notes: serverNotes.filter((n) => n.id !== id), queue: rest.filter((o) => o.id !== id) };
  return { notes: serverNotes, queue: rest };
}

export function visible(notes, { q = "", tag = "" } = {}) {
  const needle = q.trim().toLowerCase(), wanted = tag.toLowerCase();
  return notes.filter((n) => (!wanted || n.tags.some((t) => t.toLowerCase() === wanted)) && (!needle || n.title.toLowerCase().includes(needle) || n.body.toLowerCase().includes(needle)));
}

export function tagCounts(notes) {
  const map = new Map();
  for (const n of notes) for (const t of n.tags) { const e = map.get(t.toLowerCase()); if (e) e.count++; else map.set(t.toLowerCase(), { tag: t, count: 1 }); }
  return [...map.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ru"));
}`, { filename: "notes.mjs", lineNumbers: true }),
    h("api.mjs — клиент"),
    code("js", `// api.mjs — клиент HTTP API заметок: единый вид ошибок, тайм-аут, отмена. Без DOM и хранилищ.
export class ApiError extends Error {
  constructor(kind, message, extra = {}) { super(message); this.name = "ApiError"; this.kind = kind; Object.assign(this, extra); }
}

export function createApi({ baseUrl = "", fetchImpl = (...args) => fetch(...args), timeoutMs = 3000 } = {}) {
  async function request(method, path, body, signal) {
    signal?.throwIfAborted();                                              // уже отменено — ни одного запроса
    const timeout = AbortSignal.timeout(timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const interrupted = () => { if (signal?.aborted) throw signal.reason; if (timeout.aborted) throw new ApiError("timeout", \`Тайм-аут \${timeoutMs} мс: \${method} \${path}\`); };
    let res, data = null;
    try {
      res = await fetchImpl(baseUrl + path, { method, signal: combined, ...(body !== undefined && { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }) });
    } catch (cause) { interrupted(); throw new ApiError("network", \`Нет связи: \${method} \${path}\`, { cause }); }
    try { if (res.status !== 204) data = await res.json(); } catch { interrupted(); if (res.ok) throw new ApiError("server", \`Некорректный ответ: \${method} \${path}\`); }
    if (res.ok) return data;
    const extra = { status: res.status };
    if (res.status === 409) throw new ApiError("conflict", "Конфликт версий", { ...extra, note: data?.note });
    if (res.status === 404) throw new ApiError("notfound", "Заметка не найдена", extra);
    if (res.status >= 500) throw new ApiError("server", \`Ошибка сервера \${res.status}\`, extra);
    throw new ApiError("invalid", \`Запрос отклонён: \${res.status}\`, { ...extra, details: data });
  }
  const url = (id) => \`/api/notes/\${encodeURIComponent(id)}\`;
  return {
    list: async (signal) => (await request("GET", "/api/notes", undefined, signal)).notes,
    create: async (data, signal) => (await request("POST", "/api/notes", data, signal)).note,
    update: async (id, data, version, signal) => (await request("PUT", url(id), { ...data, version }, signal)).note,
    remove: (id, signal) => request("DELETE", url(id), undefined, signal),
  };
}`, { filename: "api.mjs", lineNumbers: true }),
    h("app.mjs — приложение"),
    code("js", `// app.mjs — связывает домен, API и страницу: состояние, очередь операций, рендер, события.
import { validate, preview, project, confirm, fail, visible, tagCounts } from "./notes.mjs";
import { createApi } from "./api.mjs";

const $ = (selector) => document.querySelector(selector);
const list = $("#list"), form = $("#note-form"), search = $("#search"), tagsBox = $("#tags"), count = $("#count"), status = $("#status"), errorBox = $("#error");
const retry = $("#retry"), editor = $("#editor"), editForm = $("#edit-form"), template = $("#note-template");
const KEY = "notes:queue:v1", api = createApi();

let serverNotes = [], queue = [], loaded = false, flushing = false, offline = false, editing = null, tmp = 0;
let filter = readFilter();

// ── хранилище очереди ──
const isData = (d) => d && typeof d.title === "string" && typeof d.body === "string" && Array.isArray(d.tags) && d.tags.every((t) => typeof t === "string");
const isOp = (o) => o && (o.type === "create" ? typeof o.tempId === "string" && isData(o.data) : o.type === "update" ? typeof o.id === "string" && Number.isInteger(o.version) && isData(o.data) : o.type === "delete" && typeof o.id === "string");
function loadQueue() { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v?.queue) ? v.queue.filter(isOp) : []; } catch { return []; } }
function saveQueue() { try { localStorage.setItem(KEY, JSON.stringify({ v: 1, queue })); } catch { /* хранилище недоступно: работаем в памяти */ } }

// ── адрес ──
function readFilter() { const p = new URLSearchParams(location.search); return { q: p.get("q") ?? "", tag: p.get("tag") ?? "" }; }
function syncUrl(mode) {
  const p = new URLSearchParams(); if (filter.q) p.set("q", filter.q); if (filter.tag) p.set("tag", filter.tag);
  history[\`\${mode}State\`](null, "", location.pathname + (p.size ? \`?\${p}\` : ""));
}

// ── отображение ──
const focusKey = () => {
  const a = document.activeElement, li = a?.closest?.("#list > li");
  if (li) return \`#list > li[data-id="\${CSS.escape(li.dataset.id)}"] .\${a.classList[0]}\`;
  return a?.matches?.("#tags button") ? \`#tags button[data-tag="\${CSS.escape(a.dataset.tag)}"]\` : null;
};
function render() {
  const notes = project(serverNotes, queue), shown = visible(notes, filter), key = focusKey(), frag = document.createDocumentFragment();
  for (const n of shown) {
    const li = template.content.firstElementChild.cloneNode(true), open = li.querySelector(".open"), del = li.querySelector(".delete");
    li.dataset.id = n.id; li.dataset.pending = String(n.pending);
    open.textContent = n.title; del.setAttribute("aria-label", \`Удалить: \${n.title}\`); li.querySelector(".preview").textContent = preview(n.body);
    if (n.local) open.disabled = del.disabled = true;                       // созданная локально заметка станет редактируемой после подтверждения
    for (const t of n.tags) { const tag = document.createElement("li"); tag.className = "tag"; tag.textContent = t; li.querySelector(".note-tags").append(tag); }
    frag.append(li);
  }
  list.replaceChildren(frag);
  tagsBox.replaceChildren(...tagCounts(notes).map(({ tag, count }) => {
    const b = document.createElement("button"); b.type = "button"; b.dataset.tag = tag; b.textContent = \`\${tag} (\${count})\`;
    b.setAttribute("aria-pressed", String(filter.tag.toLowerCase() === tag.toLowerCase())); return b;
  }));
  if (key) document.querySelector(key)?.focus();                           // перерисовка не должна «терять» фокус
  count.textContent = \`Заметок: \${shown.length} из \${notes.length}\`;
  status.textContent = !loaded && !offline ? "Загрузка…" : queue.length && offline ? \`Не синхронизировано: \${queue.length}\` : queue.length ? "Сохранение…" : offline ? "Нет связи" : "Синхронизировано";
  retry.hidden = !offline;
}
const showError = (text) => { errorBox.textContent = text; errorBox.hidden = false; };
const clearError = () => { errorBox.textContent = ""; errorBox.hidden = true; };
const MESSAGES = { conflict: "Заметка изменилась на сервере. Показана актуальная версия.", notfound: "Заметка уже удалена на сервере.", invalid: "Не удалось сохранить: сервер отклонил изменение. Изменение отменено." };

// ── очередь операций ──
const isNetwork = (e) => e?.kind === "network" || e?.kind === "timeout";
const send = (op) => op.type === "create" ? api.create(op.data) : op.type === "update" ? api.update(op.id, op.data, op.version) : api.remove(op.id);
async function flush() {
  if (flushing) return;
  flushing = true;
  try {
    if (!loaded) { try { serverNotes = await api.list(); loaded = true; offline = false; } catch (e) { offline = isNetwork(e); if (!offline) showError("Не удалось загрузить заметки."); return; } }
    while (queue.length) {
      try {
        const note = await send(queue[0]);
        ({ notes: serverNotes, queue } = confirm(serverNotes, queue, note)); offline = false;
      } catch (e) {
        if (isNetwork(e)) { offline = true; return; }                       // нет связи: операции остаются в очереди
        showError(MESSAGES[e?.kind] ?? "Не удалось сохранить: ошибка сервера. Изменение отменено.");
        ({ notes: serverNotes, queue } = fail(serverNotes, queue, e ?? {}));
      }
      saveQueue(); render();
    }
  } finally { flushing = false; saveQueue(); render(); }
}
function enqueue(op) { queue = [...queue, op]; saveQueue(); render(); flush(); }

// ── формы ──
function readForm(f) {
  const data = new FormData(f), r = validate({ title: data.get("title"), body: data.get("body"), tags: data.get("tags") });
  for (const name of ["title", "tags"]) f.elements[name].setAttribute("aria-invalid", String(Boolean(r.errors[name])));
  if (!r.ok) { showError(r.errors.title ?? r.errors.tags); f.elements[r.errors.title ? "title" : "tags"].focus(); }
  return r;
}
form.addEventListener("submit", (e) => {
  e.preventDefault(); clearError();
  const r = readForm(form); if (!r.ok) return;
  enqueue({ type: "create", tempId: \`tmp-\${Date.now()}-\${++tmp}\`, data: r.value });
  form.reset(); form.elements.title.focus();
});
function closeEditor(id) {
  editor.hidden = true; editing = null;
  if (id) list.querySelector(\`#list > li[data-id="\${CSS.escape(id)}"] .open\`)?.focus();
}
editForm.addEventListener("submit", (e) => {
  e.preventDefault(); clearError();
  const r = readForm(editForm); if (!r.ok || !editing) return;
  const { id, version } = editing;
  enqueue({ type: "update", id, version, data: r.value }); closeEditor(id);
});
editor.addEventListener("keydown", (e) => { if (e.key === "Escape") closeEditor(editing?.id); });
$("#cancel").addEventListener("click", () => closeEditor(editing?.id));

// ── события списка (одно делегирование на весь список) ──
list.addEventListener("click", (e) => {
  const li = e.target.closest("#list > li"); if (!li) return;
  const id = li.dataset.id;
  if (e.target.closest(".open")) {
    const note = project(serverNotes, queue).find((n) => n.id === id); if (!note) return;
    clearError(); editing = { id, version: note.version };
    for (const name of ["title", "body"]) editForm.elements[name].value = note[name];
    editForm.elements.tags.value = note.tags.join(", ");
    editor.hidden = false; editForm.elements.title.focus();
  } else if (e.target.closest(".delete")) {
    const next = (li.nextElementSibling ?? li.previousElementSibling)?.dataset.id;
    clearError(); if (editing?.id === id) closeEditor();
    enqueue({ type: "delete", id });
    (next && list.querySelector(\`#list > li[data-id="\${CSS.escape(next)}"] .open:not(:disabled)\`) || form.elements.title).focus();
  }
});
search.addEventListener("input", () => { filter = { ...filter, q: search.value }; syncUrl("replace"); render(); });
tagsBox.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-tag]"); if (!b) return;
  filter = { ...filter, tag: filter.tag.toLowerCase() === b.dataset.tag.toLowerCase() ? "" : b.dataset.tag }; syncUrl("push"); render();
});
window.addEventListener("popstate", () => { filter = readFilter(); search.value = filter.q; render(); });
window.addEventListener("online", flush);
retry.addEventListener("click", flush);

// ── старт ──
search.value = filter.q; queue = loadQueue(); render(); flush();`, { filename: "app.mjs", lineNumbers: true }),
    h("Самопроверка check.mjs"),
    p("Проверка состоит из четырёх частей: домен (11 проверок на замороженных данных), клиент (9 проверок на настоящем сервере с оборванными соединениями, задержками и ответами `409`, `422`, `5xx`), статический анализ слоёв (3 проверки) и страница в Chromium (21 проверка). Для каждой браузерной проверки создаётся свежий контекст, а сервер сбрасывается в исходное состояние; управляющие рычаги сервера (`ctl.offline`, `ctl.delayMs`, `ctl.failNext`) позволяют воспроизводить сбои без нестабильных пауз."),
    code("js", `// Самопроверка итогового проекта «Заметки». Запуск: node check.mjs [каталог с notes.mjs, api.mjs, app.mjs]
// Нужен Playwright (npm i -D playwright; путь к Chromium — переменная CHROMIUM, к модулю — PLAYWRIGHT).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { startServer } from "./server.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.argv[2] ?? "solution");
const indexHtml = fs.readFileSync(path.join(here, "index.html"), "utf8");
const load = (name) => import(pathToFileURL(path.join(dir, name)).href);
const N = await load("notes.mjs"), A = await load("api.mjs");
const { chromium } = await import(process.env.PLAYWRIGHT ?? "playwright");
const srv = await startServer({ publicDir: dir, indexHtml });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ["--no-proxy-server"] });
process.on("unhandledRejection", () => {});

let total = 0, passed = 0;
async function check(name, fn, limitMs = 15000) {
  total++;
  let ok = false, note = "", timer;
  try {
    const r = await Promise.race([fn(), new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(\`не уложилось в \${limitMs / 1000} с\`)), limitMs); })]);
    ok = r === true;
    if (!ok) note = \` (вернуло \${typeof r === "object" ? JSON.stringify(r) : String(r)})\`.slice(0, 220);
  } catch (e) { note = \` (\${e?.name ?? "Error"}: \${String(e?.message).split("\\n")[0].slice(0, 90)})\`; }
  finally { clearTimeout(timer); }
  if (ok) passed++;
  console.log(\`\${ok ? "OK " : "НЕТ"}  \${name}\${ok ? "" : note}\`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freeze = (o) => { if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(freeze); } return o; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const note = (id, title, o = {}) => freeze({ id, title, body: "", tags: [], version: 1, updatedAt: Number(id.slice(1)) * 1000, ...o });
const data = (title, body = "", tags = []) => ({ title, body, tags });

// ─────────── домен: notes.mjs (входные данные заморожены: любая мутация даёт TypeError) ───────────
await check("parseTags: обрезка пробелов, пустые и повторы (без учёта регистра) отбрасываются, первое написание сохраняется", async () =>
  same(N.parseTags(" a, b ,,A,  ,Б, б "), ["a", "b", "Б"]) && same(N.parseTags(""), []) && same(N.parseTags(undefined), []) && same(N.parseTags("один"), ["один"]) && same(N.parseTags("a,b,c"), ["a", "b", "c"]));
await check("validate: корректные данные — ok, название обрезается, теги разбираются, тело по умолчанию пустое", async () => {
  const r = N.validate({ title: "  Заметка  ", body: "текст", tags: "x, y" }), r2 = N.validate({ title: "T" });
  return r.ok === true && same(r.value, { title: "Заметка", body: "текст", tags: ["x", "y"] }) && same(r.errors, {}) && r2.ok && same(r2.value, { title: "T", body: "", tags: [] });
});
await check("validate: ошибки — пустое название, длина названия 80, не больше 5 тегов, тег не длиннее 20; несколько ошибок сразу", async () => {
  const e = (o) => N.validate({ title: "T", body: "", tags: "", ...o });
  const empty = e({ title: "   " }), long = e({ title: "я".repeat(81) }), edge = e({ title: "я".repeat(80) }), many = e({ tags: "a,b,c,d,e,f" }), five = e({ tags: "a,b,c,d,e" }), fat = e({ tags: "x".repeat(21) }), both = N.validate({ title: "", tags: "a,b,c,d,e,f" });
  return !empty.ok && empty.errors.title === "Введите название" && !long.ok && long.errors.title === "Название длиннее 80 символов" && edge.ok
    && many.errors.tags === "Не больше 5 тегов" && five.ok && fat.errors.tags === "Тег длиннее 20 символов" && !both.ok && Boolean(both.errors.title && both.errors.tags);
});
await check("preview: схлопывает пробелы и переводы строк, обрезает до 80 символов с «…», короткий текст не меняет", async () => {
  const long = "слово ".repeat(40), p = N.preview(long);
  return N.preview("a\\n\\n  b\\t c") === "a b c" && N.preview("") === "" && N.preview("я".repeat(80)) === "я".repeat(80) && p.length === 80 && p.endsWith("…") && N.preview("abcdefghij", 5) === "abcd…" && N.preview(undefined) === "";
});
await check("project: пустая очередь — копия с pending: false; create — сверху, newest first, pending и local; update — на месте; delete — убирает", async () => {
  const server = freeze([note("n3", "C"), note("n2", "B"), note("n1", "A")]);
  const base = N.project(server, freeze([]));
  const q = freeze([{ type: "create", tempId: "tmp-1", data: data("Первая") }, { type: "create", tempId: "tmp-2", data: data("Вторая", "т", ["x"]) }]);
  const withCreates = N.project(server, q);
  const upd = N.project(server, freeze([{ type: "update", id: "n2", version: 1, data: data("B2", "тело", ["t"]) }]));
  const del = N.project(server, freeze([{ type: "delete", id: "n3" }]));
  return base.length === 3 && base.every((n) => n.pending === false && n.local === false) && base[0] !== server[0]
    && same(withCreates.map((n) => n.id), ["tmp-2", "tmp-1", "n3", "n2", "n1"]) && withCreates[0].pending && withCreates[0].local && withCreates[0].title === "Вторая" && same(withCreates[0].tags, ["x"]) && withCreates[0].version === 0
    && same(upd.map((n) => n.title), ["C", "B2", "A"]) && upd[1].pending === true && upd[1].local === false && upd[1].version === 1 && upd[1].body === "тело" && upd[0].pending === false
    && same(del.map((n) => n.id), ["n2", "n1"]);
});
await check("project: смесь операций применяется по порядку; операции над неизвестной заметкой игнорируются", async () => {
  const server = freeze([note("n3", "C"), note("n2", "B"), note("n1", "A")]);
  const r = N.project(server, freeze([{ type: "create", tempId: "t1", data: data("X") }, { type: "update", id: "n2", version: 1, data: data("B!") }, { type: "delete", id: "n1" }, { type: "create", tempId: "t2", data: data("Y") }, { type: "update", id: "zzz", version: 1, data: data("?") }, { type: "delete", id: "nope" }]));
  const twice = N.project(server, freeze([{ type: "update", id: "n1", version: 1, data: data("A1") }, { type: "update", id: "n1", version: 1, data: data("A2") }]));
  return same(r.map((n) => n.title), ["Y", "X", "C", "B!"]) && twice.find((n) => n.id === "n1").title === "A2";
});
await check("confirm: create — заметка сервера сверху и операция снята; update — замена и сортировка по updatedAt; delete — удаление", async () => {
  const server = freeze([note("n3", "C"), note("n2", "B"), note("n1", "A")]);
  const c = N.confirm(server, freeze([{ type: "create", tempId: "t1", data: data("Н") }, { type: "delete", id: "n1" }]), note("n9", "Н", { updatedAt: 9000 }));
  const u = N.confirm(server, freeze([{ type: "update", id: "n1", version: 1, data: data("A!") }]), note("n1", "A!", { version: 2, updatedAt: 99000 }));
  const d = N.confirm(server, freeze([{ type: "delete", id: "n2" }]), null);
  const empty = N.confirm(server, freeze([]), null);
  return same(c.notes.map((n) => n.id), ["n9", "n3", "n2", "n1"]) && same(c.queue, [{ type: "delete", id: "n1" }]) && same(u.notes.map((n) => n.id), ["n1", "n3", "n2"]) && u.notes[0].version === 2 && u.queue.length === 0
    && same(d.notes.map((n) => n.id), ["n3", "n1"]) && empty.notes.length === 3 && empty.queue.length === 0;
});
await check("confirm: после подтверждения update следующие правки той же заметки получают новую версию, чужие не меняются", async () => {
  const server = freeze([note("n2", "B"), note("n1", "A")]);
  const q = freeze([{ type: "update", id: "n1", version: 1, data: data("A1") }, { type: "update", id: "n2", version: 1, data: data("B1") }, { type: "update", id: "n1", version: 1, data: data("A2") }, { type: "delete", id: "n1" }]);
  const r = N.confirm(server, q, note("n1", "A1", { version: 2, updatedAt: 50000 }));
  return same(r.queue.map((o) => \`\${o.type}:\${o.id}:\${o.version ?? "-"}\`), ["update:n2:1", "update:n1:2", "delete:n1:-"]);
});
await check("fail: обычный отказ — откат первой операции; конфликт — серверная версия и сброс правок заметки; «нет заметки» — удаление и сброс", async () => {
  const server = freeze([note("n2", "B"), note("n1", "A")]);
  const q = freeze([{ type: "update", id: "n1", version: 1, data: data("A1") }, { type: "update", id: "n2", version: 1, data: data("B1") }, { type: "update", id: "n1", version: 1, data: data("A2") }]);
  const plain = N.fail(server, q, { kind: "server" }), inv = N.fail(server, freeze([{ type: "create", tempId: "t", data: data("X") }]), { kind: "invalid" });
  const conflict = N.fail(server, q, { kind: "conflict", note: note("n1", "Сервер", { version: 5, updatedAt: 70000 }) });
  const gone = N.fail(server, q, { kind: "notfound" });
  return same(plain.notes.map((n) => n.id), ["n2", "n1"]) && plain.queue.length === 2 && plain.queue[0].id === "n2" && inv.queue.length === 0 && inv.notes.length === 2
    && same(conflict.notes.map((n) => \`\${n.id}:\${n.title}:\${n.version}\`), ["n1:Сервер:5", "n2:B:1"]) && same(conflict.queue.map((o) => o.id), ["n2"])
    && same(gone.notes.map((n) => n.id), ["n2"]) && same(gone.queue.map((o) => o.id), ["n2"]);
});
await check("visible: поиск по названию и тексту без учёта регистра, тег без учёта регистра, оба условия вместе, порядок сохраняется", async () => {
  const notes = freeze([note("n3", "Релиз", { body: "в пятницу", tags: ["Работа"] }), note("n2", "Хлеб", { body: "купить РЕЛИЗНЫЙ хлеб", tags: ["дом"] }), note("n1", "План", { tags: ["работа", "идеи"] })]);
  const ids = (o) => N.visible(notes, o).map((n) => n.id).join();
  return ids({}) === "n3,n2,n1" && ids({ q: "релиз" }) === "n3,n2" && ids({ q: "  ХЛЕБ " }) === "n2" && ids({ tag: "РАБОТА" }) === "n3,n1" && ids({ q: "релиз", tag: "работа" }) === "n3" && ids({ q: "нет такого" }) === "" && N.visible(notes).length === 3;
});
await check("tagCounts: счёт без учёта регистра, первое написание, порядок — по убыванию числа, затем по алфавиту", async () => {
  const notes = freeze([note("n3", "a", { tags: ["Работа", "идеи"] }), note("n2", "b", { tags: ["работа", "дом"] }), note("n1", "c", { tags: ["еда", "дом", "работа"] })]);
  return same(N.tagCounts(notes), [{ tag: "Работа", count: 3 }, { tag: "дом", count: 2 }, { tag: "еда", count: 1 }, { tag: "идеи", count: 1 }]) && same(N.tagCounts([]), []);
});

// ─────────── API-клиент: api.mjs (против настоящего сервера) ───────────
const api = (o = {}) => A.createApi({ baseUrl: srv.url, ...o });
const rejects = async (p) => { try { await p; } catch (e) { return e; } return null; };
const seedServer = () => srv.reset([data("Купить хлеб", "батон", ["дом"]), data("План", "", ["работа"]), data("Идеи", "поиск", ["работа", "идеи"])]);
await check("list: возвращает массив заметок, новейшие первыми; запрос GET /api/notes", async () => {
  seedServer(); const notes = await api().list();
  return same(notes.map((n) => n.id), ["n3", "n2", "n1"]) && notes[0].title === "Идеи" && srv.log.length === 1 && srv.log[0].method === "GET" && srv.log[0].path === "/api/notes";
});
await check("create/update/remove: возвращают заметку с версией, на сервер уходит JSON (с version для update); remove даёт null", async () => {
  seedServer(); const a = api();
  const created = await a.create(data("Новая", "т", ["x"])), updated = await a.update("n1", data("Хлеб", "два", ["дом"]), 1), removed = await a.remove("n2");
  return created.id === "n4" && created.version === 1 && same(created.tags, ["x"]) && updated.version === 2 && updated.title === "Хлеб" && removed === null && !srv.notes.has("n2")
    && same(srv.log.map((l) => \`\${l.method} \${l.path}\`), ["POST /api/notes", "PUT /api/notes/n1", "DELETE /api/notes/n2"]) && same(srv.log[0].body, data("Новая", "т", ["x"])) && same(srv.log[1].body, { title: "Хлеб", body: "два", tags: ["дом"], version: 1 });
});
await check("ошибки: конфликт версий (kind conflict с актуальной заметкой), нет заметки (notfound), отклонено (invalid + status)", async () => {
  seedServer(); const a = api();
  await a.update("n1", data("v2"), 1);
  const c = await rejects(a.update("n1", data("v3"), 1)), nf = await rejects(a.remove("n99")), nf2 = await rejects(a.update("n99", data("x"), 1)), inv = await rejects(a.create(data("   ")));
  return c instanceof A.ApiError && c.kind === "conflict" && c.note?.version === 2 && c.note?.title === "v2" && c.status === 409 && nf?.kind === "notfound" && nf.status === 404 && nf2?.kind === "notfound" && inv?.kind === "invalid" && inv.status === 422 && inv.details?.error === "title";
});
await check("ошибки: ответ 5xx — kind server со статусом; следующий запрос проходит", async () => {
  seedServer(); srv.ctl.failNext = 1; const a = api();
  const e = await rejects(a.list()), ok = await a.list();
  return e instanceof A.ApiError && e.kind === "server" && e.status === 500 && e.name === "ApiError" && e instanceof Error && ok.length === 3;
});
await check("ошибки: нет связи — kind network (и с настоящим сервером, и с fetchImpl, бросающим TypeError, причина в cause)", async () => {
  seedServer(); srv.ctl.offline = true;
  const e1 = await rejects(api().list()); srv.ctl.offline = false;
  const boom = new TypeError("fetch failed"), e2 = await rejects(A.createApi({ fetchImpl: async () => { throw boom; } }).list());
  return e1?.kind === "network" && e1 instanceof A.ApiError && e2?.kind === "network" && e2.cause === boom;
});
await check("тайм-аут: медленный сервер — kind timeout быстрее, чем ответ; сообщение называет метод и путь", async () => {
  seedServer(); srv.ctl.delayMs = 700; const t0 = performance.now();
  const e = await rejects(api({ timeoutMs: 80 }).create(data("x")));
  return e?.kind === "timeout" && /POST/.test(e.message) && /\\/api\\/notes/.test(e.message) && performance.now() - t0 < 450;
});
await check("отмена: abort() прерывает запрос, наружу уходит signal.reason (не ApiError); уже отменённый сигнал — ни одного запроса", async () => {
  seedServer(); srv.ctl.delayMs = 600; const ac = new AbortController(), reason = new Error("пользователь ушёл");
  setTimeout(() => ac.abort(reason), 30);
  const t0 = performance.now(), e1 = await rejects(api().list(ac.signal)), fast = performance.now() - t0;
  srv.log.length = 0; const done = AbortSignal.abort(new DOMException("уже", "AbortError")), e2 = await rejects(api().remove("n1", done));
  return e1 === reason && fast < 400 && !(e2 instanceof A.ApiError) && e2?.name === "AbortError" && srv.log.length === 0;
});
await check("адрес: идентификатор кодируется (encodeURIComponent); baseUrl и fetchImpl внедряются", async () => {
  seedServer(); const e = await rejects(api().update("a/b?c", data("x"), 1));
  const calls = [], fake = async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify({ notes: [{ id: "z" }] }), { status: 200 }); };
  const list = await A.createApi({ baseUrl: "https://api.example.test", fetchImpl: fake }).list();
  return e?.kind === "notfound" && srv.log.at(-1)?.path === "/api/notes/a%2Fb%3Fc" && same(list, [{ id: "z" }]) && calls.length === 1 && calls[0].url === "https://api.example.test/api/notes" && calls[0].init.method === "GET" && calls[0].init.signal instanceof AbortSignal;
});
await check("некорректный ответ: 200 без JSON — kind server, а не необработанная ошибка парсинга", async () => {
  const e = await rejects(A.createApi({ fetchImpl: async () => new Response("<html>не json</html>", { status: 200 }) }).list());
  const e2 = await rejects(A.createApi({ fetchImpl: async () => new Response("упал", { status: 502 }) }).list());
  return e?.kind === "server" && e2?.kind === "server" && e2.status === 502;
});

// ─────────── архитектура (статическая проверка модулей) ───────────
const source = (name) => fs.readFileSync(path.join(dir, name), "utf8").replace(/\\/\\*[\\s\\S]*?\\*\\//g, "").replace(/(^|[^:])\\/\\/.*$/gm, "$1");
const imports = (name) => [...source(name).matchAll(/^\\s*import\\s[^;]*?from\\s+["']([^"']+)["']/gm)].map((m) => m[1]);
await check("слои: notes.mjs и api.mjs ничего не импортируют, app.mjs подключает только ./notes.mjs и ./api.mjs", async () =>
  imports("notes.mjs").length === 0 && imports("api.mjs").length === 0 && same(imports("app.mjs").sort(), ["./api.mjs", "./notes.mjs"]));
await check("чистота: домен не знает о странице, сети, хранилищах, времени и случайности; API-клиент — о странице и хранилищах", async () => {
  const domain = source("notes.mjs"), client = source("api.mjs");
  const bad = /\\b(document|window|localStorage|sessionStorage|fetch|location|history|navigator|Date\\.now|Math\\.random|setTimeout|setInterval|new Date)\\b/.exec(domain);
  const bad2 = /\\b(document|window|localStorage|sessionStorage|location|history)\\b/.exec(client);
  return bad === null && bad2 === null ? true : \`\${bad?.[0] ?? ""} \${bad2?.[0] ?? ""}\`;
});
await check("безопасность: в коде нет innerHTML, insertAdjacentHTML, outerHTML, document.write, eval, new Function и встроенных обработчиков", async () =>
  ["notes.mjs", "api.mjs", "app.mjs"].every((f) => !/\\b(innerHTML|insertAdjacentHTML|outerHTML|document\\.write|eval\\(|new Function)\\b|\\bon[a-z]+\\s*=\\s*["']/.test(source(f))));

// ─────────── страница (Chromium + настоящий сервер) ───────────
const SEED = [data("Купить хлеб", "Белый и чёрный, два батона", ["дом", "еда"]), data("План на неделю", "Понедельник: созвон.\\nВторник: релиз.", ["работа"]), data("Идеи для проекта", "Сделать поиск по заметкам и теги", ["работа", "идеи"])];
const QUEUE_KEY = "notes:queue:v1";
async function web(name, fn, { seed = SEED, init, limit = 25000 } = {}) {
  await check(name, async () => {
    srv.reset(seed);
    const ctx = await browser.newContext(), page = await ctx.newPage(), problems = [];
    page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") problems.push(m.text()); });
    page.on("pageerror", (e) => problems.push(String(e)));
    if (init) await ctx.addInitScript(init.script, init.arg);
    try { return await fn(page, { problems, ctx, open: async (qs = "") => { await page.goto(srv.url + "/" + qs); } }); } finally { await ctx.close(); }
  }, limit);
}
const ready = (page, text = "Синхронизировано") => page.waitForFunction((t) => document.querySelector("#status")?.textContent === t, text, { timeout: 8000 });
const titles = (page) => page.$$eval("#list > li .open", (els) => els.map((e) => e.textContent));
const ids = (page) => page.$$eval("#list > li", (els) => els.map((e) => e.dataset.id));
const queueOf = (page) => page.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k))?.queue ?? null; } catch { return "ошибка"; } }, QUEUE_KEY);
const focusedIs = (page, sel) => page.evaluate((s) => document.activeElement === document.querySelector(s), sel);
const addNote = async (page, title, body = "", tags = "") => { await page.fill("#note-form [name=title]", title); await page.fill("#note-form [name=body]", body); await page.fill("#note-form [name=tags]", tags); await page.click("#note-form [type=submit]"); };
const errorText = (page) => page.evaluate(() => { const e = document.querySelector("#error"); return e.hidden ? null : e.textContent; });

await web("загрузка: заметки новейшими первыми, название, превью, теги, счётчик, статус «Синхронизировано», один запрос GET", async (page, { open }) => {
  await open(); await ready(page);
  const prev = await page.$eval("#list > li:nth-child(2) .preview", (e) => e.textContent), tags = await page.$$eval("#list > li:nth-child(1) .note-tags .tag", (els) => els.map((e) => e.textContent));
  return same(await titles(page), ["Идеи для проекта", "План на неделю", "Купить хлеб"]) && same(await ids(page), ["n3", "n2", "n1"]) && prev === "Понедельник: созвон. Вторник: релиз." && same(tags, ["работа", "идеи"])
    && await page.textContent("#count") === "Заметок: 3 из 3" && await page.isHidden("#retry") && await page.isHidden("#error") && srv.log.length === 1 && srv.log[0].method === "GET";
});
await web("создание: заметка появляется сразу (pending, временный id, поля заблокированы), после ответа получает настоящий id; форма очищена, фокус на названии", async (page, { open }) => {
  await open(); await ready(page); srv.ctl.delayMs = 400;
  await addNote(page, "  Новая заметка ", "текст", "a, b,A");
  const during = await page.evaluate(() => { const li = document.querySelector("#list > li"); return { n: document.querySelectorAll("#list > li").length, id: li.dataset.id, pending: li.dataset.pending, title: li.querySelector(".open").textContent, locked: li.querySelector(".open").disabled && li.querySelector(".delete").disabled, status: document.querySelector("#status").textContent, titleField: document.querySelector("#note-form [name=title]").value, focus: document.activeElement === document.querySelector("#note-form [name=title]") }; });
  await ready(page);
  const after = await page.evaluate(() => { const li = document.querySelector("#list > li"); return { id: li.dataset.id, pending: li.dataset.pending, open: !li.querySelector(".open").disabled }; });
  const post = srv.log.find((l) => l.method === "POST");
  return during.n === 4 && during.id.startsWith("tmp-") && during.pending === "true" && during.title === "Новая заметка" && during.locked && during.status === "Сохранение…" && during.titleField === "" && during.focus
    && /^n\\d+$/.test(after.id) && after.pending === "false" && after.open && same(post.body, data("Новая заметка", "текст", ["a", "b"]));
});
await web("валидация: пустое название — без запроса, сообщение «Введите название», aria-invalid и фокус; шесть тегов — своё сообщение; после исправления ошибка снимается", async (page, { open }) => {
  await open(); await ready(page);
  await page.fill("#note-form [name=title]", "   "); await page.click("#note-form [type=submit]");
  const e1 = await errorText(page), inv1 = await page.getAttribute("#note-form [name=title]", "aria-invalid"), f1 = await focusedIs(page, "#note-form [name=title]");
  await addNote(page, "Хорошее", "", "1,2,3,4,5,6");
  const e2 = await errorText(page), f2 = await focusedIs(page, "#note-form [name=tags]");
  await addNote(page, "Хорошее", "", "1,2");
  await ready(page);
  return e1 === "Введите название" && inv1 === "true" && f1 && e2 === "Не больше 5 тегов" && f2 && await errorText(page) === null && await page.getAttribute("#note-form [name=title]", "aria-invalid") === "false" && srv.log.filter((l) => l.method === "POST").length === 1;
});
await web("редактирование: открытие заполняет форму и ставит фокус, сохранение отправляет PUT с версией и возвращает фокус на заметку; Escape и «Отмена» закрывают без запроса", async (page, { open }) => {
  await open(); await ready(page);
  await page.click("#list > li[data-id=n2] .open");
  const shown = await page.evaluate(() => ({ visible: !document.querySelector("#editor").hidden, title: document.querySelector("#edit-form [name=title]").value, body: document.querySelector("#edit-form [name=body]").value, tags: document.querySelector("#edit-form [name=tags]").value, focus: document.activeElement === document.querySelector("#edit-form [name=title]") }));
  await page.fill("#edit-form [name=title]", "План v2"); await page.click("#save"); await ready(page);
  const put = srv.log.find((l) => l.method === "PUT");
  const afterSave = { hidden: await page.isHidden("#editor"), top: (await titles(page))[0], focus: await focusedIs(page, "#list > li[data-id=n2] .open") };
  await page.click("#list > li[data-id=n1] .open"); await page.keyboard.press("Escape");
  const esc = { hidden: await page.isHidden("#editor"), focus: await focusedIs(page, "#list > li[data-id=n1] .open") };
  await page.click("#list > li[data-id=n3] .open"); await page.click("#cancel");
  const cancel = { hidden: await page.isHidden("#editor"), focus: await focusedIs(page, "#list > li[data-id=n3] .open") };
  return shown.visible && shown.title === "План на неделю" && shown.body.startsWith("Понедельник") && shown.tags === "работа" && shown.focus && put.path === "/api/notes/n2" && same(put.body, { title: "План v2", body: "Понедельник: созвон.\\nВторник: релиз.", tags: ["работа"], version: 1 })
    && afterSave.hidden && afterSave.top === "План v2" && afterSave.focus && esc.hidden && esc.focus && cancel.hidden && cancel.focus && srv.log.filter((l) => l.method === "PUT").length === 1;
});
await web("удаление: заметка исчезает сразу и уходит DELETE; фокус — на следующую, у последней — на предыдущую, у единственной — в поле названия", async (page, { open }) => {
  await open(); await ready(page); srv.ctl.delayMs = 150;
  await page.click("#list > li[data-id=n2] .delete");
  const first = { gone: !(await ids(page)).includes("n2"), focus: await focusedIs(page, "#list > li[data-id=n1] .open") };
  await ready(page); await page.click("#list > li[data-id=n1] .delete");
  const second = await focusedIs(page, "#list > li[data-id=n3] .open");
  await ready(page); await page.click("#list > li[data-id=n3] .delete");
  const third = await focusedIs(page, "#note-form [name=title]");
  await ready(page);
  return first.gone && first.focus && second && third && same(srv.log.filter((l) => l.method === "DELETE").map((l) => l.path), ["/api/notes/n2", "/api/notes/n1", "/api/notes/n3"]) && srv.notes.size === 0 && (await ids(page)).length === 0;
});
await web("ошибка сервера при создании: заметка появляется и исчезает, сообщение «Не удалось…», очередь пуста, статус «Синхронизировано»", async (page, { open }) => {
  await open(); await ready(page); srv.ctl.failNext = 1; srv.ctl.delayMs = 250;
  await addNote(page, "Не сохранится");
  const during = (await titles(page))[0];
  await page.waitForFunction(() => !document.querySelector("#error").hidden, null, { timeout: 5000 }); await ready(page);
  return during === "Не сохранится" && /Не удалось/.test(await errorText(page)) && same(await titles(page), ["Идеи для проекта", "План на неделю", "Купить хлеб"]) && same(await queueOf(page), []) && await page.isHidden("#retry") && srv.notes.size === 3;
});
await web("нет связи: изменения остаются на экране и в очереди (localStorage), статус «Не синхронизировано: 4», кнопка «Повторить», без сообщения об ошибке", async (page, { open }) => {
  await open(); await ready(page); srv.ctl.offline = true;
  await addNote(page, "Офлайн 1"); await addNote(page, "Офлайн 2");
  await page.click("#list > li[data-id=n1] .open"); await page.fill("#edit-form [name=title]", "Купить молоко"); await page.click("#save");
  await page.click("#list > li[data-id=n2] .delete");
  await ready(page, "Не синхронизировано: 4");
  const q = await queueOf(page);
  return same(await titles(page), ["Офлайн 2", "Офлайн 1", "Идеи для проекта", "Купить молоко"]) && await page.isVisible("#retry") && await errorText(page) === null
    && same(q.map((o) => o.type), ["create", "create", "update", "delete"]) && srv.notes.size === 3 && srv.notes.get("n1").title === "Купить хлеб";
});
const queued = [{ type: "create", tempId: "tmp-1-1", data: data("Из прошлого сеанса", "т", ["x"]) }, { type: "update", id: "n2", version: 1, data: data("План обновлён", "", ["работа"]) }, { type: "delete", id: "n1" }];
const withQueue = { script: ([k, q]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify({ v: 1, queue: q })); }, arg: [QUEUE_KEY, queued] };
await web("очередь переживает перезагрузку: сохранённые операции видны без сети, после «Повторить» уходят по порядку, очередь очищается", async (page, { open }) => {
  srv.ctl.offline = true; await open(); await ready(page, "Не синхронизировано: 3");
  const offlineList = await titles(page), retryShown = await page.isVisible("#retry");
  srv.ctl.offline = false; srv.log.length = 0; await page.click("#retry"); await ready(page);
  const order = srv.log.map((l) => \`\${l.method} \${l.path}\`);
  return same(offlineList, ["Из прошлого сеанса"]) && retryShown && same(order, ["GET /api/notes", "POST /api/notes", "PUT /api/notes/n2", "DELETE /api/notes/n1"])
    && same([...srv.notes.values()].map((n) => n.title).sort(), ["Идеи для проекта", "Из прошлого сеанса", "План обновлён"]) && same(await queueOf(page), []) && (await titles(page)).length === 3;
}, { init: withQueue });
await web("событие online запускает отправку очереди без нажатия кнопки", async (page, { open }) => {
  srv.ctl.offline = true; await open(); await ready(page, "Не синхронизировано: 3");
  srv.ctl.offline = false; await page.evaluate(() => window.dispatchEvent(new Event("online"))); await ready(page);
  return srv.notes.size === 3 && !srv.notes.has("n1") && srv.notes.get("n2").title === "План обновлён" && await page.isHidden("#retry");
}, { init: withQueue });
await web("конфликт версий: сообщение «изменилась на сервере», показана серверная версия, очередь пуста", async (page, { open }) => {
  await open(); await ready(page);
  await page.click("#list > li[data-id=n2] .open");
  Object.assign(srv.notes.get("n2"), { title: "Серверная версия", version: 2, updatedAt: 99999999999999 });
  await page.fill("#edit-form [name=title]", "Моя версия"); await page.click("#save");
  await page.waitForFunction(() => !document.querySelector("#error").hidden, null, { timeout: 5000 }); await ready(page);
  return /изменилась на сервере/.test(await errorText(page)) && (await titles(page))[0] === "Серверная версия" && !(await titles(page)).includes("Моя версия") && same(await queueOf(page), []) && srv.notes.get("n2").title === "Серверная версия";
});
await web("заметка удалена на сервере: сообщение «уже удалена», заметка исчезает из списка", async (page, { open }) => {
  await open(); await ready(page);
  await page.click("#list > li[data-id=n1] .open"); srv.notes.delete("n1");
  await page.fill("#edit-form [name=title]", "Поздно"); await page.click("#save");
  await page.waitForFunction(() => !document.querySelector("#error").hidden, null, { timeout: 5000 }); await ready(page);
  return /уже удалена/.test(await errorText(page)) && !(await ids(page)).includes("n1") && same(await queueOf(page), []);
});
await web("две правки подряд при медленном сервере: вторая получает новую версию (без конфликта), на сервере версия 3 и последний текст", async (page, { open }) => {
  await open(); await ready(page); srv.ctl.delayMs = 250;
  await page.click("#list > li[data-id=n2] .open"); await page.fill("#edit-form [name=title]", "v2"); await page.click("#save");
  await page.click("#list > li[data-id=n2] .open"); const shown = await page.inputValue("#edit-form [name=title]");
  await page.fill("#edit-form [name=title]", "v3"); await page.click("#save");
  await ready(page);
  const puts = srv.log.filter((l) => l.method === "PUT").map((l) => l.body.version);
  return shown === "v2" && same(puts, [1, 2]) && srv.notes.get("n2").title === "v3" && srv.notes.get("n2").version === 3 && await errorText(page) === null && (await titles(page))[0] === "v3";
});
await web("поиск: фильтрует по названию и тексту без запросов к серверу, отражается в адресе (?q=), очищается; начальный ?q= применяется", async (page, { open }) => {
  await open(); await ready(page); const before = srv.log.length;
  await page.fill("#search", "РЕЛИЗ");
  const hit = { titles: await titles(page), count: await page.textContent("#count"), url: new URL(page.url()).searchParams.get("q") };
  await page.fill("#search", "");
  const cleared = { n: (await titles(page)).length, search: new URL(page.url()).search };
  await page.goto(srv.url + "/?q=" + encodeURIComponent("хлеб")); await ready(page);
  return same(hit.titles, ["План на неделю"]) && hit.count === "Заметок: 1 из 3" && hit.url === "РЕЛИЗ" && srv.log.length === before + 1 && cleared.n === 3 && cleared.search === "" && same(await titles(page), ["Купить хлеб"]) && await page.inputValue("#search") === "хлеб";
});
await web("теги: кнопки со счётчиками, фильтр по клику (aria-pressed, ?tag=, фокус остаётся), «Назад»/«Вперёд» восстанавливают фильтр; начальный ?tag= применяется", async (page, { open }) => {
  await open(); await ready(page);
  const labels = await page.$$eval("#tags button", (els) => els.map((e) => e.textContent));
  await page.click("#tags button[data-tag=работа]");
  const on = { titles: await titles(page), pressed: await page.getAttribute("#tags button[data-tag=работа]", "aria-pressed"), tag: new URL(page.url()).searchParams.get("tag"), focus: await focusedIs(page, "#tags button[data-tag=работа]") };
  await page.goBack(); const back = { n: (await titles(page)).length, search: new URL(page.url()).search };
  await page.goForward(); const fwd = (await titles(page)).length;
  await page.click("#tags button[data-tag=работа]"); const off = (await titles(page)).length;
  await page.goto(srv.url + "/?tag=" + encodeURIComponent("идеи")); await ready(page);
  return same(labels, ["работа (2)", "дом (1)", "еда (1)", "идеи (1)"]) && same(on.titles, ["Идеи для проекта", "План на неделю"]) && on.pressed === "true" && on.tag === "работа" && on.focus
    && back.n === 3 && back.search === "" && fwd === 2 && off === 3 && same(await titles(page), ["Идеи для проекта"]);
});
await web("фокус не теряется при перерисовке по ответу сервера: пользователь стоит на кнопке заметки, ответ приходит и список перестраивается", async (page, { open }) => {
  await open(); await ready(page); srv.ctl.delayMs = 350;
  await addNote(page, "Фокус");
  await page.focus("#list > li[data-id=n1] .open");
  await ready(page);
  return await focusedIs(page, "#list > li[data-id=n1] .open") && (await titles(page))[0] === "Фокус";
});
await web("разметка в названии, тексте и тегах показывается текстом: нет img/b, обработчик не срабатывает", async (page, { open }) => {
  await open(); await ready(page);
  const evil = '<img src=x onerror="window.__x=1">';
  await addNote(page, evil, "<b>жирный</b>", "<b>t</b>"); await ready(page); await sleep(100);
  const r = await page.evaluate(() => ({ imgs: document.querySelectorAll("#list img").length, bs: document.querySelectorAll("#list b").length, x: window.__x, t: document.querySelector("#list > li .open").textContent, prev: document.querySelector("#list > li .preview").textContent, tag: document.querySelector("#list > li .tag").textContent }));
  await page.reload(); await ready(page); await sleep(100);
  const r2 = await page.evaluate(() => ({ imgs: document.querySelectorAll("#list img").length, x: window.__x }));
  return r.imgs === 0 && r.bs === 0 && r.x === undefined && r.t === evil && r.prev === "<b>жирный</b>" && r.tag === "<b>t</b>" && r2.imgs === 0 && r2.x === undefined;
});
const manyNotes = (n) => Array.from({ length: n }, (_, i) => data(\`Заметка \${i}\`, \`тело заметки номер \${i}\`, [\`t\${i % 7}\`]));
await web("делегирование: число слушателей событий не зависит от числа заметок (3 и 300 отличаются не более чем на 8)", async (page, { open }) => {
  const measure = async (seed) => {
    srv.reset(seed); const p = await page.context().newPage(); await p.goto(srv.url + "/"); await ready(p);
    const cdp = await p.context().newCDPSession(p); await cdp.send("Performance.enable");
    const { metrics } = await cdp.send("Performance.getMetrics"); await p.close();
    return metrics.find((m) => m.name === "JSEventListeners").value;
  };
  const few = await measure(manyNotes(3)), many = await measure(manyNotes(300));
  return many - few <= 8 ? true : { few, many };
});
await web("производительность: 1000 заметок отображаются, ввод в поиск и сброс фильтра перерисовывают список быстрее 500 мс", async (page, { open }) => {
  await open(); await page.waitForFunction(() => document.querySelectorAll("#list > li").length === 1000, null, { timeout: 8000 }); await ready(page);
  const time = (value) => page.evaluate((v) => new Promise((resolve) => { const t = performance.now(), s = document.querySelector("#search"); s.value = v; s.dispatchEvent(new Event("input", { bubbles: true })); requestAnimationFrame(() => requestAnimationFrame(() => resolve([performance.now() - t, document.querySelectorAll("#list > li").length]))); }), value);
  const [t1, n1] = await time("заметка 99"), [t2, n2] = await time("");
  return n1 === 11 && n2 === 1000 && t1 < 500 && t2 < 500 ? true : { t1, n1, t2, n2 };
}, { seed: manyNotes(1000), limit: 40000 });
await web("повреждённая очередь в хранилище и недоступное хранилище: приложение работает, ошибок в консоли нет", async (page, { open, ctx }) => {
  const results = [];
  for (const bad of ["{не json", JSON.stringify({ v: 1, queue: [{ type: "nope" }, 5, null, { type: "delete" }, { type: "update", id: "n1" }] })]) {
    const p = await ctx.newPage(), errs = []; p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    await p.addInitScript(([k, v]) => localStorage.setItem(k, v), [QUEUE_KEY, bad]);
    await p.goto(srv.url + "/"); await ready(p); results.push(errs.length === 0 && (await titles(p)).length === 3); await p.close();
  }
  const blocked = await ctx.newPage(), errs = []; blocked.on("pageerror", (e) => errs.push(String(e))); blocked.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await blocked.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("denied", "SecurityError"); } }); });
  await blocked.goto(srv.url + "/"); await ready(blocked); await addNote(blocked, "Без хранилища"); await ready(blocked);
  results.push(errs.length === 0 && srv.notes.size === 4 && (await titles(blocked))[0] === "Без хранилища");
  return results.every(Boolean) ? true : results;
});
await web("доступность: у кнопок заметки понятные имена, «Удалить: название», status и alert размечены, ошибка скрыта без сообщения, aria-pressed у тегов", async (page, { open }) => {
  await open(); await ready(page);
  const r = await page.evaluate(() => ({ del: document.querySelector("#list > li[data-id=n2] .delete").getAttribute("aria-label"), status: document.querySelector("#status").getAttribute("role"), alert: document.querySelector("#error").getAttribute("role"), hidden: document.querySelector("#error").hidden, pressed: [...document.querySelectorAll("#tags button")].every((b) => b.getAttribute("aria-pressed") === "false") }));
  return r.del === "Удалить: План на неделю" && r.status === "status" && r.alert === "alert" && r.hidden && r.pressed && await page.getByRole("button", { name: "План на неделю", exact: true }).count() === 1;
});
await web("на странице нет ошибок и предупреждений консоли после типичного сценария", async (page, { open, problems }) => {
  await open(); await ready(page);
  await addNote(page, "Сценарий", "т", "x"); await ready(page);
  await page.click("#list > li:first-child .open"); await page.fill("#edit-form [name=title]", "Сценарий 2"); await page.click("#save"); await ready(page);
  await page.fill("#search", "хлеб"); await page.fill("#search", ""); await page.click("#tags button >> nth=0"); await page.click("#tags button >> nth=0");
  await page.click("#list > li:last-child .delete"); await ready(page); await sleep(100);
  return problems.length === 0 ? true : problems.slice(0, 2);
});

await browser.close(); srv.close();
console.log(\`\\nПройдено проверок: \${passed} из \${total}\`);
if (passed !== total) console.log(\`Не прошли: \${total - passed}\`);
process.exit(passed === total ? 0 : 1);`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 44 из 44`, { filename: "результат node check.mjs solution (Node.js 22.22.0 + Chromium 141)" }),
    code("text", `Пройдено проверок: 2 из 44
Не прошли: 42`, { filename: "результат node check.mjs starter (заготовка)" }),
    h("Проверка самой проверки: «плохие» варианты"),
    code("text", `m1-no-optimistic: Пройдено проверок: 39 из 44
m2-no-rebase: Пройдено проверок: 42 из 44
m3-network-as-failure: Пройдено проверок: 41 из 44
m4-queue-not-persisted: Пройдено проверок: 39 из 44
m5-innerhtml: Пройдено проверок: 42 из 44
m6-listener-per-note: Пройдено проверок: 43 из 44
m7-focus-lost: Пройдено проверок: 41 из 44
m8-api-no-signal: Пройдено проверок: 41 из 44
m9-conflict-as-server: Пройдено проверок: 42 из 44
m10-domain-mutates: Пройдено проверок: 42 из 44
m11-api-touches-dom: Пройдено проверок: 37 из 44`, { filename: "результат check.mjs для вариантов с ошибками (из 44)" }),
    warn("Приложение, которое «работает у разработчика», проверяйте на трёх сценариях: **нет связи**, **медленная сеть** и **параллельное изменение данных другим клиентом**. Именно на них ломаются оптимистичные интерфейсы, очереди и версии; обычный «счастливый путь» их не показывает."),
    tip("Когда логика приложения запутывается, вынесите её в чистые функции с данными на входе и данными на выходе: `project`, `confirm` и `fail` проверяются за миллисекунды без браузера и сервера, а страница остаётся тонкой оболочкой."),
    ul(
      "Для замороженных данных (`Object.freeze` рекурсивно) любая мутация в строгом режиме (модули ESM строгие) превращается в `TypeError` — это самая дешёвая проверка чистоты функций.",
      "Состояние «нет связи» воспроизводится в проверке без переключения сети браузера: сервер обрывает соединения только для `/api/`, а страница и модули уже загружены.",
      "Если у вас получилось быстрее и проще — проверьте себя на `advanced`: сверка по ключам и сворачивание очереди дают наибольший прирост качества.",
    ),
  ],
};
