import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p05TasksApp: Project = {
  id: "js.p05-tasks-app",
  domain: "js",
  order: 5,
  title: "Приложение «Задачи» без фреймворка",
  subtitle: "DOM, делегирование событий, фильтр в адресе и истории, localStorage, синхронизация вкладок и доступность — 28 проверок в настоящем Chromium",
  level: "advanced",
  estimatedHours: 12,
  buildsOn: ["js.p04-loader"],
  topics: [
    "js.dom-events",
    "js.forms-fetch",
    "js.storage-url-timers",
    "js.errors-debugging",
  ],
  objective:
    "Написать модуль `app.mjs`, который оживляет готовую страницу `index.html`: **список задач** с добавлением, отметкой, удалением, фильтром, счётчиком, сохранением и синхронизацией между вкладками. Ограничения учат тому, что отличает аккуратное приложение от «работает у меня»: **один слушатель на контейнер** вместо сотен, **текст только через `textContent`**, **фильтр хранится в адресе** (кнопки «Назад» и «Вперёд» работают), **фокус не теряется** после удаления, **битые данные и недоступное хранилище не ломают страницу**.",
  scenario: [
    p("Команда «Лаборатории» хочет внутренний трекер задач без сборщиков и фреймворков — одну страницу и один модуль. Прототип уже есть, но у него типичные болезни: на каждую задачу вешаются три слушателя (на 300 задачах страница ощутимо тяжелеет), название задачи вставляется через `innerHTML` (задача `<img src=x onerror=...>` исполняется), после удаления фокус «улетает» в начало страницы, фильтр не попадает в адрес, а одна битая запись в `localStorage` превращает страницу в пустое место с ошибкой в консоли."),
    p("Разметка `index.html` **фиксирована** — менять её нельзя (проверка использует собственную копию). В ней уже есть форма, фильтр из трёх радиокнопок, список, счётчик с `role=\"status\"`, кнопка «Удалить готовые» и `<template id=\"item-template\">` для строки списка. Вы пишете только `app.mjs` (заготовка — `starter/app.mjs`). Проверка `check.mjs` запускает ваш модуль в Chromium через Playwright: 28 проверок, включая синхронизацию двух вкладок и сломанное хранилище."),
    code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Задачи</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 0; }
  main { max-width: 36rem; margin: 2rem auto; padding: 0 1rem; }
  ul { list-style: none; padding: 0; }
  [hidden] { display: none !important; }
  li { display: flex; gap: .5rem; align-items: center; padding: .25rem 0; }
  li[data-done="true"] .title { text-decoration: line-through; color: #6b7280; }
  .title { flex: 1; overflow-wrap: anywhere; }
  :focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; }
</style>
<main>
  <h1>Задачи</h1>
  <form id="add" autocomplete="off">
    <label>Новая задача <input name="title" required maxlength="80"></label>
    <button>Добавить</button>
  </form>
  <fieldset id="filter">
    <legend>Показать</legend>
    <label><input type="radio" name="filter" value="all" checked> все</label>
    <label><input type="radio" name="filter" value="active"> активные</label>
    <label><input type="radio" name="filter" value="done"> готовые</label>
  </fieldset>
  <ul id="list" aria-label="Задачи"></ul>
  <p id="counter" role="status" aria-live="polite"></p>
  <button id="clear-done" type="button">Удалить готовые</button>
</main>
<template id="item-template">
  <li><input type="checkbox" class="toggle"> <span class="title"></span> <button type="button" class="remove">✕</button></li>
</template>
<script type="module" src="app.mjs"></script>
</html>`, { filename: "index.html (менять нельзя)", collapsed: true }),
    code("js", `// Заготовка проекта «Задачи без фреймворка». Реализуйте приложение в этом файле; index.html менять нельзя.
// Запуск проверки:  node check.mjs .   (нужен Playwright: npm i -D playwright)

const list = document.querySelector("#list");
const form = document.querySelector("#add");
const counter = document.querySelector("#counter");
const clearDone = document.querySelector("#clear-done");
const template = document.querySelector("#item-template");

// Напишите здесь: состояние, отрисовку, обработчики событий, сохранение, фильтр в адресе, синхронизацию вкладок.`, { filename: "starter/app.mjs" }),
    table(
      ["Возможность", "Как должна работать", "Проверка"],
      [
        ["Добавление", "`submit` формы (Enter или кнопка): название обрезается, пустое игнорируется, поле очищается и остаётся в фокусе", "добавление по Enter, пустые названия, порядок и уникальные `id`"],
        ["Отметка и счётчик", "Чекбокс `.toggle`, `data-done` на `<li>`, «Осталось N задач» с правильным склонением, кнопка «Удалить готовые»", "0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25"],
        ["Удаление", "Кнопка `.remove` и клавиша `Delete` на чекбоксе; фокус на следующую задачу, иначе на предыдущую, иначе в поле", "фокус после удаления"],
        ["Фильтр", "Радиокнопки «все / активные / готовые»; значение в адресе (`?filter=active`), «Назад» и «Вперёд» его восстанавливают", "адрес, история, начальный фильтр из URL"],
        ["Хранилище", "`localStorage[\"tasks:v1\"] = { v: 1, items: [{ id, title, done }] }`; битый JSON и недоступное хранилище не ломают приложение", "перезагрузка, битые данные, исключения хранилища"],
        ["Вкладки", "Событие `storage` обновляет список в другой вкладке без обратной записи", "две страницы одного контекста"],
        ["Безопасность и устройство", "Названия — только `textContent`; делегирование: ≤ 8 слушателей на элементах при любом числе задач", "XSS, число слушателей"],
      ],
      "Контракт приложения",
    ),
  ],
  requirements: [
    "Файл `app.mjs` — ES-модуль, подключённый из `index.html`; разметку, стили и шаблон менять нельзя; вся логика — в модуле.",
    "Добавление: обработчик `submit` формы (`preventDefault()`); название обрезается по краям, пустое или из пробелов не добавляется; новая задача — в конец списка с уникальным строковым `id`; поле очищается, остаётся в фокусе, счётчик обновляется.",
    "Каждая строка создаётся клонированием `<template>`; у `<li>` есть `data-id` и `data-done`; чекбокс `.toggle` имеет `aria-label=\"Готово: название\"`, кнопка `.remove` — `aria-label=\"Удалить: название\"`.",
    "Название в DOM попадает **только через `textContent`**: в коде нет `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval` и встроенных `on…=`-обработчиков; задача `<img src=x onerror=…>` и данные такого вида из `localStorage` отображаются текстом.",
    "Отметка меняет `data-done`, счётчик и кнопку «Удалить готовые» (включена только при наличии готовых); удаление работает по кнопке `.remove` и по клавише `Delete` на сфокусированном чекбоксе.",
    "Счётчик: `Осталось 0 задач`, `Осталась 1 задача`, `Осталось 2 задачи`, `Осталось 5 задач`, `Осталось 11 задач`, `Осталась 21 задача`, `Осталось 22 задачи` — по правилам русского языка (исключения 11–14).",
    "Фокус после удаления: на чекбокс следующей **видимой** задачи, если её нет — предыдущей, если задач нет — в поле ввода; после «Удалить готовые» — в поле ввода.",
    "Фильтр: «активные» и «готовые» скрывают лишние строки атрибутом `hidden`; `list.dataset.filter` отражает текущее значение; значение хранится в адресе (`?filter=active|done`, для «все» параметра нет); каждая смена фильтра — **одна запись истории** (`pushState`); `popstate` восстанавливает фильтр и радиокнопку; неверное значение в адресе означает «все»; новая задача при фильтре «готовые» скрыта, отметка при «активные» скрывает задачу.",
    "Хранилище: после каждого изменения список сохраняется в `localStorage[\"tasks:v1\"]` как `{ v: 1, items: [{ id, title, done }] }`; при старте читается с проверкой формы (некорректные элементы отбрасываются); битый JSON даёт пустой список; исключения `localStorage` (запрет, квота) не приводят к ошибкам — приложение работает в памяти.",
    "Синхронизация вкладок: по событию `storage` (ключ `tasks:v1` или `null`) список перечитывается и перерисовывается; **обратной записи нет** (иначе вкладки зациклятся).",
    "Делегирование: на элементах страницы не более 8 слушателей независимо от числа задач (300 задач — столько же, сколько 3); слушатели `popstate` и `storage` — на `window`.",
    "На странице нет ошибок и предупреждений консоли в типичном сценарии (добавление, отметка, фильтр, «Назад», удаление, «Удалить готовые»).",
  ],
  constraints: [
    "Без фреймворков, библиотек и сборщиков; только стандартный DOM, `localStorage`, History API.",
    "Нельзя вставлять данные пользователя через `innerHTML`/`insertAdjacentHTML`; нельзя использовать `eval`, `document.write`, встроенные обработчики.",
    "Нельзя вешать слушатели на каждую строку или кнопку: только делегирование на контейнере.",
    "Нельзя хранить фильтр только в переменной: он должен восстанавливаться из адреса и истории.",
    "Нельзя писать в хранилище из обработчика `storage` (обратная запись).",
    "Нельзя менять `index.html`: проверка использует собственную копию разметки.",
  ],
  expected: [
    "`node check.mjs .` (с установленным Playwright) печатает `Пройдено проверок: 28 из 28` — повторяемо, три запуска подряд.",
    "Страница с 300 задачами работает так же отзывчиво, как с тремя; отметка задачи и пересчёт занимают доли секунды.",
    "Обновление страницы, «Назад» и открытие второй вкладки показывают тот же список и фильтр.",
    "Если `localStorage` недоступен или содержит мусор, приложение запускается пустым и продолжает работать.",
  ],
  technical: [
    "Состояние — массив `items` в модуле; DOM — производное от него: `createItem(task)` клонирует `template.content.firstElementChild`, остальное — точечные обновления (`dataset`, `hidden`, `append`, `remove`), а `rebuild()` (полная перерисовка через `replaceChildren`) нужен только при загрузке, «Удалить готовые» и синхронизации.",
    "Делегирование: `list.addEventListener(\"change\", …)` с `e.target.closest(\".toggle\")`; `click` — с `closest(\".remove\")`; `keydown` — с `e.target.matches(\".toggle\")`. Остальные слушатели: `submit` формы, `change` на `#filter`, `click` на «Удалить готовые».",
    "Фокус после удаления: найдите видимых соседей **до** удаления узла (`[...list.children].filter((li) => !li.hidden)`), затем удалите узел и сфокусируйте `neighbour?.querySelector(\".toggle\") ?? input`.",
    "Фильтр: `const url = new URL(location.href); url.searchParams.set(\"filter\", value); history.pushState({ filter: value }, \"\", url)`; чтение — `new URL(location.href).searchParams.get(\"filter\")` с проверкой по списку допустимых значений; `popstate` вызывает чтение и `applyFilter()` (без нового `pushState`).",
    "Атрибут `hidden` проигрывает правилу `li { display: flex }`, поэтому в `index.html` есть `[hidden] { display: none !important; }`: без него «скрытые» строки остаются видимыми (классическая ловушка).",
    "Склонение: `n % 10 === 1 && n % 100 !== 11` — «задача/Осталась»; `n % 10` от 2 до 4 при `n % 100` вне 12–14 — «задачи»; иначе «задач».",
    "Чтение хранилища: `try { JSON.parse(raw) } catch { [] }`, затем `filter(isTask)`; доступ к самому `localStorage` тоже оборачивайте в `try`, потому что геттер может бросить `SecurityError`.",
    "Событие `storage` приходит только в **другие** вкладки; перерисовывайте список и не вызывайте `write()` — иначе вкладки будут бесконечно перезаписывать друг друга.",
  ],
  acceptance: [
    "`node check.mjs .` — 28 из 28 (Playwright: `npm i -D playwright`), три запуска подряд.",
    "Заготовка проходит 3 из 28 проверок — три «вхолостую»: в пустом коде нет `innerHTML`, нет чтения хранилища, которое могло бы сломаться, и нет разметки, которую можно «оживить». Остальные 25 требуют реализации.",
    "Каждый из восьми «плохих» вариантов проваливает проверку: от 1 (нет синхронизации вкладок, слушатели на каждой строке) до 12 (`JSON.parse` без `try/catch`).",
    "В коде нет `innerHTML`, `eval`, `document.write`, встроенных обработчиков и слушателей на строках списка.",
    "Проверено вручную: в браузере со сломанным `localStorage` (запрет сайта на данные) страница работает; в двух вкладках изменения синхронизируются.",
  ],
  hints: [
    "Сначала `createItem` и добавление: клонируйте шаблон, заполните через `textContent` и `dataset`. Остальное строится на этом.",
    "Если «скрытые» задачи остаются на экране, дело в CSS: `hidden` перекрывается `display: flex`. Проверьте, есть ли правило `[hidden]`.",
    "Склонение проверяйте таблицей: 11–14 — всегда «задач», 21 — «задача», 22 — «задачи».",
    "Если после удаления фокус пропадает на `body`, вы удаляете узел до поиска соседа. Сначала вычислите соседа среди **видимых** строк.",
    "Если «Назад» не меняет фильтр, вы не слушаете `popstate`; если «Назад» добавляет записи, вы вызываете `pushState` внутри `popstate`.",
    "Если вкладки «спорят», обработчик `storage` вызывает функцию записи. Он должен только читать новое значение (`e.newValue`) и перерисовывать список.",
    "Если проверка слушателей красная, посчитайте `addEventListener` для элементов: должно быть по одному на форму, фильтр, кнопку и три на список — независимо от числа задач.",
  ],
  advanced: [
    "Добавьте редактирование названия по двойному клику с отменой по `Escape` и фиксацией по `Enter`/потере фокуса, не нарушая делегирования.",
    "Реализуйте отмену удаления (`Ctrl+Z`) со стеком команд и сообщением в `role=\"status\"`.",
    "Подключите `IndexedDB` вместо `localStorage` для списков в тысячи задач и сравните время старта.",
    "Сделайте перетаскивание для сортировки на `pointer`-событиях с клавиатурной альтернативой (кнопки «выше/ниже»).",
    "Напишите тест «утечки»: открыть/закрыть 1000 раз раздел и убедиться по `Performance.getMetrics`, что число узлов и слушателей не растёт.",
  ],
  failureModes: [
    "**Вставка названия через `innerHTML`:** `<img src=x onerror=…>` исполняется, разметка из хранилища «оживает»; 25 из 28 (красные: статическая проверка и обе проверки XSS).",
    "**Слушатели на каждой строке:** число слушателей на элементах растёт с числом задач (на 300 задач — тысячи); 27 из 28.",
    "**Нет сохранения:** после перезагрузки список пуст, «Удалить готовые» не обновляет хранилище; 25 из 28.",
    "**Фильтр только в памяти:** адрес не меняется, «Назад» не работает, `?filter=done` игнорируется; 24 из 28.",
    "**Склонение «задача/задач» без `few`-формы:** `2 задач`, `21 задач`; 22 из 28 — самый тяжёлый из «мелких» провалов (падают все числовые случаи).",
    "**Фокус «улетает» на `body` после удаления:** клавиатурный пользователь теряет место; 25 из 28.",
    "**Нет обработчика `storage`:** вторая вкладка остаётся устаревшей до перезагрузки; 27 из 28.",
    "**`JSON.parse` без `try/catch`:** одна битая запись — пустая страница и ошибка в консоли; 16 из 28 — самый тяжёлый провал (12 красных проверок): `JSON.parse(null)` и `data.items` бросают `TypeError` уже при первом запуске с пустым хранилищем, поэтому ломается не только случай с битым JSON, но и любая загрузка страницы.",
  ],
  rubric: [
    { criterion: "DOM и безопасность", weight: 20, description: "Шаблон `<template>`, `textContent`, нет `innerHTML`/`eval`, данные из хранилища не исполняются." },
    { criterion: "События и делегирование", weight: 20, description: "Один слушатель на контейнер, `closest`, число слушателей не зависит от числа задач, `submit` вместо `click`." },
    { criterion: "URL, история и состояние", weight: 20, description: "Фильтр в адресе, `pushState`/`popstate`, начальное состояние из URL, одна запись истории на изменение." },
    { criterion: "Хранилище и вкладки", weight: 20, description: "Формат данных, проверка формы, битый JSON, недоступное хранилище, `storage` без обратной записи." },
    { criterion: "Доступность и фокус", weight: 15, description: "Доступные имена, управление фокусом после удаления, клавиатура (`Tab`, пробел, `Delete`), `role=\"status\"`." },
    { criterion: "Чистота кода", weight: 5, description: "Состояние отдельно от DOM, короткие функции, нет ошибок и предупреждений консоли." },
  ],
  solution: [
    p("Эталон — один файл `app.mjs` (около 120 строк). Он проходит все 28 проверок при трёх запусках подряд; заготовка проходит 3 из 28, а каждый из восьми намеренно испорченных вариантов — меньше 28."),
    h("app.mjs"),
    code("js", `// Приложение «Задачи» без фреймворка: делегирование событий, URL как состояние фильтра, localStorage, синхронизация вкладок
const KEY = "tasks:v1";
const FILTERS = ["all", "active", "done"];
const list = document.querySelector("#list");
const form = document.querySelector("#add");
const input = form.elements.title;
const counter = document.querySelector("#counter");
const clearDone = document.querySelector("#clear-done");
const template = document.querySelector("#item-template");

const isTask = (t) => t && typeof t.id === "string" && typeof t.title === "string" && t.title !== "" && typeof t.done === "boolean";
function parse(raw) {
  try { const data = JSON.parse(raw); return Array.isArray(data?.items) ? data.items.filter(isTask) : []; } catch { return []; }   // битые данные не ломают приложение
}
function read() { try { return localStorage.getItem(KEY); } catch { return null; } }                                          // хранилище может быть недоступно
function write() { try { localStorage.setItem(KEY, JSON.stringify({ v: 1, items })); } catch { /* квота или запрет: работаем в памяти */ } }

let items = parse(read());
let filter = readFilter();

function readFilter() {
  const value = new URL(location.href).searchParams.get("filter");
  return FILTERS.includes(value) ? value : "all";
}
const plural = (n, one, few, many) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many; };
const remaining = (n) => \`\${plural(n, "Осталась", "Осталось", "Осталось")} \${n} \${plural(n, "задача", "задачи", "задач")}\`;
const newId = () => globalThis.crypto?.randomUUID?.() ?? \`\${Date.now().toString(36)}-\${Math.random().toString(36).slice(2)}\`;

function createItem(task) {
  const li = template.content.firstElementChild.cloneNode(true);
  li.dataset.id = task.id;
  li.dataset.done = String(task.done);
  li.querySelector(".title").textContent = task.title;                       // только textContent: разметка из названия не создаётся
  const toggle = li.querySelector(".toggle");
  toggle.checked = task.done;
  toggle.setAttribute("aria-label", \`Готово: \${task.title}\`);
  li.querySelector(".remove").setAttribute("aria-label", \`Удалить: \${task.title}\`);
  return li;
}
function applyFilter() {
  for (const li of list.children) {
    const done = li.dataset.done === "true";
    li.hidden = (filter === "active" && done) || (filter === "done" && !done);
  }
  list.dataset.filter = filter;
  document.querySelector(\`input[name="filter"][value="\${filter}"]\`).checked = true;
}
function updateSummary() {
  counter.textContent = remaining(items.filter((t) => !t.done).length);
  clearDone.disabled = !items.some((t) => t.done);
}
function rebuild() { list.replaceChildren(...items.map(createItem)); applyFilter(); updateSummary(); }
function changed() { write(); applyFilter(); updateSummary(); }

const itemOf = (el) => el.closest("li");
const taskOf = (li) => items.find((t) => t.id === li.dataset.id);

// ── события: по одному слушателю на контейнер ──
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  const task = { id: newId(), title, done: false };
  items.push(task);
  list.append(createItem(task));
  input.value = "";
  input.focus();
  changed();
});

list.addEventListener("change", (e) => {
  const toggle = e.target.closest(".toggle");
  if (!toggle) return;
  const li = itemOf(toggle), task = taskOf(li);
  task.done = toggle.checked;
  li.dataset.done = String(task.done);
  changed();
});

function removeItem(li) {
  const visible = [...list.children].filter((x) => !x.hidden);
  const index = visible.indexOf(li);
  const neighbour = visible[index + 1] ?? visible[index - 1];
  items = items.filter((t) => t.id !== li.dataset.id);
  li.remove();
  (neighbour?.querySelector(".toggle") ?? input).focus();                    // фокус не теряется
  changed();
}
list.addEventListener("click", (e) => {
  const button = e.target.closest(".remove");
  if (button) removeItem(itemOf(button));
});
list.addEventListener("keydown", (e) => {
  if (e.key === "Delete" && e.target.matches(".toggle")) removeItem(itemOf(e.target));
});

clearDone.addEventListener("click", () => {
  items = items.filter((t) => !t.done);
  rebuild();
  write();
  input.focus();
});

document.querySelector("#filter").addEventListener("change", (e) => {
  if (!FILTERS.includes(e.target.value)) return;
  filter = e.target.value;
  const url = new URL(location.href);
  if (filter === "all") url.searchParams.delete("filter"); else url.searchParams.set("filter", filter);
  history.pushState({ filter }, "", url);
  applyFilter();
});
addEventListener("popstate", () => { filter = readFilter(); applyFilter(); });                       // кнопки «Назад» и «Вперёд»
addEventListener("storage", (e) => {                                                                 // другая вкладка изменила список: только читаем, не пишем обратно
  if (e.storageArea === localStorage && (e.key === KEY || e.key === null)) { items = parse(e.newValue); rebuild(); }
});

rebuild();`, { filename: "app.mjs", lineNumbers: true }),
    h("Самопроверка check.mjs"),
    p("Проверка поднимает локальный сервер (адрес `127.0.0.1`, порт `0`), отдаёт **собственную копию** `index.html` и ваш `app.mjs`, запускает Chromium и создаёт чистый контекст для каждой проверки (пустое хранилище). Для сломанного хранилища она подменяет методы `Storage.prototype` до загрузки страницы, для синхронизации — открывает вторую страницу в том же контексте, для числа слушателей — оборачивает `addEventListener` через `addInitScript`."),
    code("js", `// Самопроверка проекта «Задачи без фреймворка». Запуск: node check.mjs [каталог с app.mjs]
// Нужен Playwright: npm i -D playwright (переменная PLAYWRIGHT может указать путь к модулю).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT ?? "playwright");
const dir = path.resolve(process.argv[2] ?? "solution");
const appSource = fs.readFileSync(path.join(dir, "app.mjs"), "utf8");
const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");        // разметка фиксирована: проверка использует свою копию

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/app.mjs")) { res.setHeader("content-type", "text/javascript"); res.end(appSource); return; }
  if (req.url.startsWith("/favicon")) { res.statusCode = 204; res.end(); return; }
  res.setHeader("content-type", "text/html; charset=utf-8"); res.end(html);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = \`http://127.0.0.1:\${server.address().port}\`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ["--no-proxy-server"] });

let total = 0, passed = 0;
const failed = [];
async function check(name, fn) {
  total++;
  let ok = false, note = "";
  let timer;
  try { const r = await Promise.race([fn(), new Promise((_, rej) => { timer = setTimeout(() => rej(new Error("не уложилось в 15 с")), 15000); })]); ok = r === true; if (!ok) note = \` (вернуло \${JSON.stringify(r)})\`; } catch (e) { note = \` (\${e?.name ?? "Error"}: \${String(e?.message).split("\\n")[0].slice(0, 90)})\`; }
  finally { clearTimeout(timer); }
  if (ok) passed++; else failed.push(name);
  console.log(\`\${ok ? "OK " : "НЕТ"}  \${name}\${ok ? "" : note}\`);
}

// Свежий контекст = пустое хранилище. init выполняется до скриптов страницы.
async function open({ query = "", tasks, init, context } = {}) {
  const ctx = context ?? (await browser.newContext());
  if (tasks) await ctx.addInitScript(([key, value]) => { if (!sessionStorage.getItem("__seeded")) { localStorage.setItem(key, value); sessionStorage.setItem("__seeded", "1"); } }, ["tasks:v1", typeof tasks === "string" ? tasks : JSON.stringify({ v: 1, items: tasks })]);
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(origin + "/" + query);
  return { ctx, page, errors };
}
const add = async (page, title) => { await page.fill("input[name=title]", title); await page.press("input[name=title]", "Enter"); };
const titles = (page) => page.$$eval("#list li", (lis) => lis.filter((l) => !l.hidden).map((l) => l.querySelector(".title").textContent));
const all = (page) => page.$$eval("#list li", (lis) => lis.map((l) => l.querySelector(".title").textContent));
const counter = (page) => page.textContent("#counter");
const seed = (n, doneEvery = 0) => Array.from({ length: n }, (_, i) => ({ id: "id" + i, title: "задача " + i, done: doneEvery > 0 && i % doneEvery === 0 }));
const focusedClass = (page) => page.evaluate(() => document.activeElement.className || document.activeElement.tagName);

// ── Статические требования ──
await check("в коде нет innerHTML, insertAdjacentHTML, outerHTML, document.write, eval и встроенных обработчиков", () => !/\\.(innerHTML|outerHTML)\\b|insertAdjacentHTML|document\\.write|\\beval\\s*\\(|\\bon\\w+\\s*=\\s*["'\`]/.test(appSource.replace(/\\/\\/.*$/gm, "")));

// ── Старт и добавление ──
await check("старт: пустой список, «Осталось 0 задач», кнопка «Удалить готовые» отключена, ошибок нет", async () => { const { ctx, page, errors } = await open(); const r = (await counter(page)) === "Осталось 0 задач" && (await page.isDisabled("#clear-done")) && (await all(page)).length === 0 && errors.length === 0; await ctx.close(); return r; });
await check("добавление по Enter: элемент, текст, поле очищено и в фокусе", async () => { const { ctx, page } = await open(); await add(page, "молоко"); const r = JSON.stringify(await all(page)) === '["молоко"]' && (await page.inputValue("input[name=title]")) === "" && (await focusedClass(page)) === "INPUT" && (await counter(page)) === "Осталась 1 задача"; await ctx.close(); return r; });
await check("название обрезается по краям; пустое и из пробелов не добавляется", async () => { const { ctx, page } = await open(); await add(page, "  хлеб  "); await page.fill("input[name=title]", "   "); await page.evaluate(() => document.querySelector("#add").requestSubmit()); const r = JSON.stringify(await all(page)) === '["хлеб"]'; await ctx.close(); return r; });
await check("доступные имена: чекбокс «Готово: …», кнопка «Удалить: …»", async () => { const { ctx, page } = await open(); await add(page, "сыр"); const names = await page.evaluate(() => [document.querySelector(".toggle").getAttribute("aria-label"), document.querySelector(".remove").getAttribute("aria-label")]); await ctx.close(); return names.join("|") === "Готово: сыр|Удалить: сыр"; });
await check("задачи добавляются в порядке ввода, идентификаторы уникальны", async () => { const { ctx, page } = await open(); for (const t of ["а", "б", "в", "г"]) await add(page, t); const ids = await page.$$eval("#list li", (l) => l.map((x) => x.dataset.id)); const r = JSON.stringify(await all(page)) === '["а","б","в","г"]' && new Set(ids).size === 4 && ids.every((i) => typeof i === "string" && i); await ctx.close(); return r; });

// ── Отметка и счётчик ──
await check("отметка: data-done, счётчик уменьшается, «Удалить готовые» включается; снятие возвращает", async () => { const { ctx, page } = await open({ tasks: seed(3) }); await page.check("li:nth-child(2) .toggle"); const a = (await counter(page)) === "Осталось 2 задачи" && (await page.getAttribute("li:nth-child(2)", "data-done")) === "true" && !(await page.isDisabled("#clear-done")); await page.uncheck("li:nth-child(2) .toggle"); const b = (await counter(page)) === "Осталось 3 задачи" && (await page.isDisabled("#clear-done")); await ctx.close(); return a && b; });
await check("склонение: 0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25", async () => {
  const expected = { 0: "Осталось 0 задач", 1: "Осталась 1 задача", 2: "Осталось 2 задачи", 4: "Осталось 4 задачи", 5: "Осталось 5 задач", 11: "Осталось 11 задач", 12: "Осталось 12 задач", 14: "Осталось 14 задач", 21: "Осталась 21 задача", 22: "Осталось 22 задачи", 25: "Осталось 25 задач" };
  const bad = [];
  for (const [n, text] of Object.entries(expected)) { const { ctx, page } = await open({ tasks: seed(Number(n)) }); if ((await counter(page)) !== text) bad.push(\`\${n}: \${await counter(page)}\`); await ctx.close(); }
  return bad.length === 0 || bad;
});
await check("клавиатура: Tab к чекбоксу и Пробел отмечают задачу", async () => { const { ctx, page } = await open({ tasks: seed(2) }); await page.focus("input[name=title]"); await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); const cls = await focusedClass(page); await page.keyboard.press("Space"); const r = cls === "toggle" && (await counter(page)) === "Осталась 1 задача"; await ctx.close(); return r || cls; });

// ── Удаление и фокус ──
await check("удаление ✕: задача пропадает, счётчик обновляется, фокус переходит к следующей задаче", async () => { const { ctx, page } = await open({ tasks: seed(3) }); await page.click("li:nth-child(2) .remove"); const r = JSON.stringify(await all(page)) === '["задача 0","задача 2"]' && (await focusedClass(page)) === "toggle" && (await page.evaluate(() => document.activeElement.closest("li").dataset.id)) === "id2"; await ctx.close(); return r; });
await check("удаление последней в списке: фокус на предыдущей; единственной — на поле ввода", async () => { const { ctx, page } = await open({ tasks: seed(2) }); await page.click("li:nth-child(2) .remove"); const a = (await page.evaluate(() => document.activeElement.closest("li")?.dataset.id)) === "id0"; await page.click("li .remove"); const b = (await focusedClass(page)) === "INPUT"; await ctx.close(); return a && b; });
await check("клавиша Delete на чекбоксе удаляет задачу и сохраняет фокус", async () => { const { ctx, page } = await open({ tasks: seed(3) }); await page.focus("li:nth-child(1) .toggle"); await page.keyboard.press("Delete"); const r = JSON.stringify(await all(page)) === '["задача 1","задача 2"]' && (await page.evaluate(() => document.activeElement.closest("li")?.dataset.id)) === "id1"; await ctx.close(); return r; });
await check("«Удалить готовые»: убирает отмеченные, фокус на поле, кнопка отключается, хранилище обновлено", async () => { const { ctx, page } = await open({ tasks: seed(4, 2) }); await page.click("#clear-done"); const stored = JSON.parse(await page.evaluate(() => localStorage.getItem("tasks:v1"))); const r = JSON.stringify(await all(page)) === '["задача 1","задача 3"]' && (await page.isDisabled("#clear-done")) && (await focusedClass(page)) === "INPUT" && stored.items.length === 2; await ctx.close(); return r; });

// ── Фильтр, URL и история ──
await check("фильтры «активные» и «готовые»: видимые задачи, радиокнопки, data-filter", async () => { const { ctx, page } = await open({ tasks: seed(4, 2) }); await page.check("input[value=active]"); const a = JSON.stringify(await titles(page)) === '["задача 1","задача 3"]' && (await page.getAttribute("#list", "data-filter")) === "active"; await page.check("input[value=done]"); const b = JSON.stringify(await titles(page)) === '["задача 0","задача 2"]'; await page.check("input[value=all]"); const c = (await titles(page)).length === 4; await ctx.close(); return a && b && c; });
await check("фильтр отражается в адресе: ?filter=active, «все» убирает параметр", async () => { const { ctx, page } = await open(); await page.check("input[value=active]"); const a = new URL(page.url()).searchParams.get("filter") === "active"; await page.check("input[value=all]"); const b = !new URL(page.url()).searchParams.has("filter"); await ctx.close(); return a && b; });
await check("начальный фильтр берётся из адреса; неверное значение даёт «все»", async () => { const one = await open({ tasks: seed(4, 2), query: "?filter=done" }); const a = JSON.stringify(await titles(one.page)) === '["задача 0","задача 2"]' && (await one.page.isChecked("input[value=done]")); await one.ctx.close(); const two = await open({ tasks: seed(4, 2), query: "?filter=zzz" }); const b = (await titles(two.page)).length === 4 && (await two.page.isChecked("input[value=all]")); await two.ctx.close(); return a && b; });
await check("«Назад» и «Вперёд» восстанавливают фильтр и радиокнопку; каждая смена — одна запись истории", async () => { const { ctx, page } = await open({ tasks: seed(4, 2) }); const len0 = await page.evaluate(() => history.length); await page.check("input[value=active]"); await page.check("input[value=done]"); const len1 = await page.evaluate(() => history.length); await page.goBack(); const a = (await page.isChecked("input[value=active]")) && (await titles(page)).length === 2; await page.goBack(); const b = (await page.isChecked("input[value=all]")) && (await titles(page)).length === 4; await page.goForward(); const c = await page.isChecked("input[value=active]"); await ctx.close(); return len1 - len0 === 2 && a && b && c; });
await check("новая задача при фильтре «готовые» скрыта; отметка при «активные» скрывает задачу", async () => { const { ctx, page } = await open({ tasks: seed(2) }); await page.check("input[value=done]"); await add(page, "новая"); const a = (await titles(page)).length === 0 && (await all(page)).length === 3; await page.check("input[value=active]"); await page.check("li:nth-child(1) .toggle"); const b = (await titles(page)).length === 2; await ctx.close(); return a && b; });

// ── Хранилище ──
await check("сохранение: формат { v: 1, items: [{ id, title, done }] }, состояние переживает перезагрузку, порядок сохранён", async () => { const { ctx, page } = await open(); await add(page, "раз"); await add(page, "два"); await page.check("li:nth-child(1) .toggle"); const stored = JSON.parse(await page.evaluate(() => localStorage.getItem("tasks:v1"))); await page.reload(); const r = stored.v === 1 && stored.items.length === 2 && stored.items.every((t) => typeof t.id === "string" && typeof t.title === "string" && typeof t.done === "boolean") && JSON.stringify(await all(page)) === '["раз","два"]' && (await page.isChecked("li:nth-child(1) .toggle")) && (await counter(page)) === "Осталась 1 задача"; await ctx.close(); return r; });
await check("битый JSON в хранилище: пустой список, без ошибок", async () => { const { ctx, page, errors } = await open({ tasks: "{не json" }); const r = (await all(page)).length === 0 && errors.length === 0; await add(page, "ок"); await ctx.close(); return r; });
await check("в хранилище посторонние записи: некорректные элементы отбрасываются", async () => { const { ctx, page, errors } = await open({ tasks: JSON.stringify({ v: 1, items: [{ id: "1", title: "верная", done: false }, { id: 2, title: "число вместо id", done: false }, { id: "3", title: "", done: false }, null, "строка", { id: "4", title: "без done" }] }) }); const r = JSON.stringify(await all(page)) === '["верная"]' && errors.length === 0; await ctx.close(); return r; });
await check("хранилище недоступно (исключения localStorage): приложение работает в памяти, ошибок нет", async () => { const { ctx, page, errors } = await open({ init: () => { for (const m of ["getItem", "setItem"]) Storage.prototype[m] = () => { throw new DOMException("запрещено", "SecurityError"); }; } }); await add(page, "работает"); await page.check("li .toggle"); const r = JSON.stringify(await all(page)) === '["работает"]' && (await counter(page)) === "Осталось 0 задач" && errors.length === 0; await ctx.close(); return r; });
await check("синхронизация вкладок: изменение в одной видно в другой без перезагрузки и без обратной записи", async () => {
  const a = await open();
  const b = await open({ context: a.ctx });
  await b.page.evaluate(() => { window.writes = 0; const original = Storage.prototype.setItem; Storage.prototype.setItem = function (...args) { window.writes++; return original.apply(this, args); }; });
  await add(a.page, "из первой вкладки");
  await b.page.waitForFunction(() => document.querySelectorAll("#list li").length === 1, null, { timeout: 5000 });
  await a.page.waitForTimeout(150);
  const writes = await b.page.evaluate(() => window.writes);
  const r = JSON.stringify(await all(b.page)) === '["из первой вкладки"]' && (await counter(b.page)) === "Осталась 1 задача" && writes === 0;
  await a.ctx.close(); return r || { writes };
});

// ── Безопасность и устройство ──
await check("разметка в названии показывается текстом: нет img/b, обработчик не срабатывает", async () => { const { ctx, page, errors } = await open(); await add(page, "<img src=x onerror=window.hacked=1>"); await add(page, "<b>жирный</b>"); await page.waitForTimeout(100); const r = (await page.locator("#list img, #list b").count()) === 0 && (await page.evaluate(() => window.hacked)) === undefined && (await titles(page)).includes("<b>жирный</b>"); await ctx.close(); return r; });
await check("перезагрузка не «оживляет» разметку из хранилища", async () => { const { ctx, page } = await open({ tasks: [{ id: "x", title: "<img src=x onerror=window.hacked=1>", done: false }] }); await page.waitForTimeout(100); const r = (await page.locator("#list img").count()) === 0 && (await page.evaluate(() => window.hacked)) === undefined; await ctx.close(); return r; });
await check("делегирование: число слушателей на элементах не зависит от числа задач (≤ 8)", async () => {
  const init = () => { window.__counts = { elements: 0, window: 0 }; const original = EventTarget.prototype.addEventListener; EventTarget.prototype.addEventListener = function (...a) { if (this instanceof Element) window.__counts.elements++; else if (this === window) window.__counts.window++; return original.apply(this, a); }; };
  const few = await open({ tasks: seed(3), init }); const nFew = await few.page.evaluate(() => window.__counts.elements); await few.ctx.close();
  const many = await open({ tasks: seed(300), init }); await many.page.waitForSelector("#list li:nth-child(300)"); const nMany = await many.page.evaluate(() => window.__counts.elements); await many.ctx.close();
  return nFew === nMany && nMany <= 8 || { 3: nFew, 300: nMany };
});
await check("300 задач: отрисовка и отметка отзывчивы (< 2 с на отметку и пересчёт)", async () => { const { ctx, page } = await open({ tasks: seed(300) }); await page.waitForSelector("#list li:nth-child(300)"); const t0 = Date.now(); await page.check("li:nth-child(150) .toggle"); const r = (await counter(page)) === "Осталось 299 задач" && Date.now() - t0 < 2000; await ctx.close(); return r; });
await check("на странице нет ошибок и предупреждений консоли после типичного сценария", async () => { const { ctx, page, errors } = await open(); await add(page, "а"); await add(page, "б"); await page.check("li:nth-child(1) .toggle"); await page.check("input[value=done]"); await page.goBack(); await page.click("li:nth-child(2) .remove"); await page.click("#clear-done"); await ctx.close(); return errors.length === 0 || errors; });

await browser.close(); server.close();
console.log(\`\\nПройдено проверок: \${passed} из \${total}\`);
if (failed.length) console.log("Не прошли: " + failed.length);
process.exit(failed.length ? 1 : 0);`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 28 из 28`, { filename: "результат node check.mjs solution (Node.js 22.22.0 + Chromium 141)" }),
    code("text", `Пройдено проверок: 3 из 28
Не прошли: 25`, { filename: "результат node check.mjs starter (заготовка)" }),
    h("Проверка самой проверки: «плохие» варианты"),
    code("text", `b1-innerhtml: Пройдено проверок: 25 из 28
b2-per-item-listeners: Пройдено проверок: 27 из 28
b3-no-persistence: Пройдено проверок: 25 из 28
b4-filter-not-in-url: Пройдено проверок: 24 из 28
b5-plural: Пройдено проверок: 22 из 28
b6-focus-lost: Пройдено проверок: 25 из 28
b7-no-tab-sync: Пройдено проверок: 27 из 28
b8-crash-on-corrupt: Пройдено проверок: 16 из 28`, { filename: "результат check.mjs для вариантов с ошибками (из 28)" }),
    warn("Атрибут `hidden` слабее любого правила CSS с `display`: `li { display: flex }` «показывает» скрытую строку. Если вы скрываете элементы атрибутом, добавьте `[hidden] { display: none !important; }` — или скрывайте через класс. Это одна из самых частых причин «фильтр не работает»."),
    tip("Прогоните проверку с замедлением процессора и в режиме без хранилища (в DevTools: Application → Storage → блокировка данных сайта): большинство продакшен-багов формы «у пользователя пустая страница» воспроизводятся именно так."),
    ul(
      "Не меняйте `index.html`: проверка использует свою копию, а значит, правки разметки решения не засчитаются.",
      "Если проверка падает по тайм-ауту, посмотрите вывод консоли страницы: чаще всего это исключение при старте (например, обращение к `localStorage` без `try`).",
    ),
  ],
};
