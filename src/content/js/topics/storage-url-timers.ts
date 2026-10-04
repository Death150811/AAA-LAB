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

export const storageUrlTimers: Topic = {
  id: "js.storage-url-timers",
  slug: "storage-url-timers",
  domain: "js",
  module: "browser",
  title: "Хранилища, URL, History и таймеры",
  titleEn: "Storage, URL, History and timers",
  summary:
    "Четыре «маленьких» API определяют, запомнит ли приложение выбор пользователя, можно ли поделиться ссылкой на состояние, работает ли кнопка «Назад» и не сломаются ли отложенные действия. Тема на замерах в Chromium 141 и Node.js 22 разбирает `localStorage` и `sessionStorage` (только строки, `QuotaExceededError` при 5 242 880 символов, событие `storage` лишь в других вкладках), IndexedDB (транзакции и ловушка `TransactionInactiveError`), `URL` и `URLSearchParams` (инъекция параметров, проверка схем), `History API` (`pushState` не вызывает `popstate`) и таймеры (`setInterval` и перекрытие, `unref`, исключения, предел задержки). В конце вы пишете `createPersistentStore` — состояние с миграциями, debounce-записью и синхронизацией вкладок.",
  minutes: 120,
  prerequisites: ["js.dom-events", "js.event-loop"],
  tags: ["localStorage", "sessionStorage", "storage event", "QuotaExceededError", "IndexedDB", "structuredClone", "URL", "URLSearchParams", "History API", "pushState", "popstate", "setTimeout", "setInterval", "requestAnimationFrame", "debounce", "migration", "encodeURIComponent"],
  keyConcepts: [
    { term: "`localStorage` хранит только строки", text: "`setItem(\"o\", {a: 1})` сохранит `[object Object]`, `setItem(\"u\", undefined)` — строку `undefined` (а `JSON.parse(\"undefined\")` — `SyntaxError`). Объекты — через `JSON.stringify`/`JSON.parse` и `try/catch`." },
    { term: "Лимит и ошибки записи", text: "В Chromium 141 помещается 5 242 880 символов (ключи и значения вместе); сверх лимита — `QuotaExceededError`, старое значение остаётся. Запись может упасть и в приватном режиме или при запрете хранилища — оборачивайте в `try/catch`." },
    { term: "Событие `storage` — только для других вкладок", text: "Изменение `localStorage` в одной вкладке вызывает `storage` в **остальных** вкладках того же origin (с `key`, `oldValue`, `newValue`); в самой вкладке события нет, при записи того же значения — тоже; `clear()` даёт `key === null`." },
    { term: "Адрес собирают через `URL`, а не строками", text: "`\"/search?q=\" + input` при `a&admin=1` создаёт лишний параметр `admin=1`; `url.searchParams.set(\"q\", input)` кодирует значение (`q=a%26admin%3D1`). Схему пользовательской ссылки проверяют через `new URL(...).protocol`." },
    { term: "`pushState` меняет адрес, но не вызывает `popstate`", text: "`popstate` приходит при переходах по истории (`back`, `forward`, `go`), а не при `pushState`/`replaceState`. Приложение само рисует состояние после `pushState` и слушает `popstate` для кнопок браузера." },
    { term: "Таймеры — не гарантии времени", text: "Колбэк запускается не раньше задержки и только когда поток свободен; `setInterval` не ждёт завершения асинхронного колбэка (тики перекрываются), исключение в колбэке интервал не останавливает (браузер), а в Node завершает процесс." },
  ],
  sections: [
    section("definition", [
      def("Web Storage", "API `localStorage` (живёт, пока пользователь не очистит данные) и `sessionStorage` (живёт, пока открыта вкладка) — синхронные хранилища «строка → строка» с привязкой к origin.", "Web Storage"),
      def("Origin", "Тройка «схема + хост + порт»; разные origin имеют раздельные хранилища (замер: `127.0.0.1` и `localhost` — разные).", "origin"),
      def("IndexedDB", "Асинхронная транзакционная база данных в браузере: хранилища объектов (`objectStore`), индексы, курсоры; значения сохраняются структурным клонированием (`Date`, `Set`, `Map` сохраняются, функции — нет).", "IndexedDB"),
      def("Структурное клонирование", "Алгоритм копирования значений (`structuredClone`, `postMessage`, IndexedDB): поддерживает вложенные объекты, `Date`, `Map`, `Set`, циклические ссылки; не поддерживает функции (`DataCloneError`).", "structured clone"),
      def("`URL` и `URLSearchParams`", "Классы для разбора, сборки и безопасного кодирования адресов и строки запроса; `url.searchParams` — «живое» представление `url.search`.", "URL, URLSearchParams"),
      def("History API", "`history.pushState`, `replaceState`, `back`, `forward`, `go`, событие `popstate`: управление записями истории без перезагрузки страницы.", "History API"),
      def("Таймер", "Отложенный вызов `setTimeout` или повторяющийся `setInterval`; ставит задачу в очередь макрозадач по истечении задержки.", "timer"),
      def("Debounce и throttle", "Debounce откладывает действие до паузы в событиях (одна запись после серии изменений); throttle выполняет действие не чаще, чем раз в интервал.", "debounce / throttle"),
    ]),

    section("why", [
      h("Состояние живёт дольше одной загрузки страницы"),
      p("Пользователь ожидает, что выбранная тема, корзина и черновик сообщения переживут перезагрузку, что ссылку на отфильтрованный список можно отправить другу, что «Назад» вернёт предыдущий экран, а запрос к серверу не уйдёт на каждое нажатие клавиши. За эти ожидания отвечают небольшие API, и у каждого есть неочевидные границы: типы, лимиты, события, безопасность."),
      ul(
        "**Данные не теряются:** безопасное чтение (`try/catch`), версия схемы и миграции, обработка квоты и недоступного хранилища.",
        "**Состояние адресуемо:** фильтры и страницы — в `URL` (`searchParams`) и истории; ссылка воспроизводит экран.",
        "**Безопасность:** параметры кодируются, схемы пользовательских ссылок проверяются (`javascript:` не должен попасть в `href`), секреты не лежат в `localStorage` (доступен любому скрипту страницы).",
        "**Предсказуемое время:** `debounce` экономит записи и запросы; интервалы не накапливают параллельную работу; таймеры не удерживают процесс Node.js.",
      ),
      insight("Хранилище — это **распределённая система в миниатюре**: несколько вкладок, одна общая память, нет блокировок и транзакций у `localStorage`. Всё, что вы знаете про версии схемы, конфликты и валидацию данных, нужно и здесь."),
    ]),

    section("mental-model", [
      p("**`localStorage` — магнитики-записки на общем холодильнике:** одни и те же записки видят все вкладки одного origin, на них помещаются только слова (строки), место ограничено (≈ 5 МиБ), а когда записку меняет один жилец, остальным можно подать сигнал (`storage`). **`sessionStorage`** — записки на двери вашей комнаты: у каждой вкладки свои. **IndexedDB** — картотека с карточками и ящиками (хранилища и индексы), где с карточками работают **сессиями-транзакциями**: пока вы ходите за чужим чаем, окошко выдачи закрывается. **`URL`** — почтовый адрес с точными полями; склеивать его из кусков вручную — значит однажды отправить письмо не туда. **History** — стопка открыток с адресами: `pushState` кладёт открытку сверху (но не оглашает это вслух), а `back` достаёт предыдущую и объявляет (`popstate`). **Таймеры** — будильники, которые звонят только когда комната свободна: если вы заняты, звонок откладывается, но не раньше положенного."),
      table(
        ["Хранилище", "Живёт", "Объём (замер)", "Тип данных", "Доступ"],
        [
          ["`localStorage`", "до очистки пользователем", "5 242 880 символов (ключи + значения)", "строки", "синхронный; общий для вкладок origin"],
          ["`sessionStorage`", "пока открыта вкладка (переживает перезагрузку)", "аналогично", "строки", "синхронный; своя копия у вкладки"],
          ["IndexedDB", "до очистки пользователем", "определяется квотой хранилища браузера (Storage Standard)", "структурно клонируемые значения, файлы", "асинхронный, транзакции, индексы"],
          ["Cookie", "по атрибутам", "малый (≈ 4 КБ на cookie)", "строки, уходят на сервер", "см. HTTP и безопасность"],
          ["`history.state`", "запись истории", "малый", "структурно клонируемые значения", "синхронный; привязан к записи истории"],
        ],
        "Где хранить данные в браузере",
      ),
    ]),

    section("technical", [
      h("Web Storage: API и подводные камни"),
      code("js", `import { start } from "./_srv.mjs";
const t = await start();
const page = await t.context.newPage();
await page.goto(t.origin + "/");
const out = (k, v) => console.log(k.padEnd(46), "→", JSON.stringify(v));
const r = await page.evaluate(() => {
  const L = {};
  localStorage.clear();
  localStorage.setItem("n", 42); localStorage.setItem("flag", true); localStorage.setItem("obj", { a: 1 }); localStorage.setItem("arr", [1, 2]);
  L["setItem(42) → getItem"] = [localStorage.getItem("n"), typeof localStorage.getItem("n")];
  L["setItem(true) → getItem"] = localStorage.getItem("flag");
  L["setItem({a: 1}) → getItem"] = localStorage.getItem("obj");
  L["setItem([1, 2]) → getItem"] = localStorage.getItem("arr");
  L["getItem(несуществующий ключ) === null"] = localStorage.getItem("nope") === null;
  L["length, key(0)"] = [localStorage.length, typeof localStorage.key(0)];
  localStorage.title = "через свойство";
  L["localStorage.title = … → getItem('title')"] = localStorage.getItem("title");
  L["'title' in localStorage"] = "title" in localStorage;
  L["'length' — это ключ или свойство?"] = (() => { localStorage.setItem("length", "x"); return [typeof localStorage.length, localStorage.getItem("length")]; })();
  localStorage.removeItem("length");
  const j = (v) => { try { return JSON.parse(v); } catch (e) { return e.name; } };
  L["JSON.stringify(undefined) === undefined"] = JSON.stringify(undefined) === undefined;
  L["setItem('u', undefined) → getItem"] = (() => { localStorage.setItem("u", undefined); return localStorage.getItem("u"); })();
  L["JSON.parse('undefined')"] = j("undefined");
  L["JSON.parse(null) (getItem отсутствующего)"] = j(null);
  L["JSON.parse('{плохо')"] = j("{плохо");
  L["Date через JSON"] = (() => { const s = JSON.stringify({ d: new Date(0) }); return [s, typeof JSON.parse(s).d]; })();
  L["Map через JSON"] = JSON.stringify({ m: new Map([[1, 2]]) });
  L["structuredClone(Map)"] = (() => { const c = structuredClone({ m: new Map([[1, 2]]), d: new Date(0) }); return [c.m instanceof Map, c.d instanceof Date]; })();
  L["structuredClone(функция)"] = (() => { try { structuredClone({ f() {} }); } catch (e) { return e.name; } })();
  return L;
});
for (const [k, v] of Object.entries(r)) out(k, v);

// sessionStorage и localStorage между вкладками
await page.evaluate(() => { localStorage.setItem("shared", "из первой вкладки"); sessionStorage.setItem("mine", "только первая вкладка"); });
const page2 = await t.context.newPage();
await page2.goto(t.origin + "/");
out("вторая вкладка: localStorage.shared", await page2.evaluate(() => localStorage.getItem("shared")));
out("вторая вкладка: sessionStorage.mine", await page2.evaluate(() => sessionStorage.getItem("mine")));
await page.reload();
out("после перезагрузки первой: sessionStorage.mine", await page.evaluate(() => sessionStorage.getItem("mine")));
// другой origin (другой порт/хост) — другое хранилище
const other = await t.context.newPage();
await other.goto(t.origin.replace("127.0.0.1", "localhost") + "/");
out("тот же сервер по имени localhost: localStorage.shared", await other.evaluate(() => localStorage.getItem("shared")));
await t.close();`, { filename: "run-st1-storage.mjs", collapsed: true }),
      code("text", `setItem(42) → getItem                          → ["42","string"]
setItem(true) → getItem                        → "true"
setItem({a: 1}) → getItem                      → "[object Object]"
setItem([1, 2]) → getItem                      → "1,2"
getItem(несуществующий ключ) === null          → true
length, key(0)                                 → [4,"string"]
localStorage.title = … → getItem('title')      → "через свойство"
'title' in localStorage                        → true
'length' — это ключ или свойство?              → ["number","x"]
JSON.stringify(undefined) === undefined        → true
setItem('u', undefined) → getItem              → "undefined"
JSON.parse('undefined')                        → "SyntaxError"
JSON.parse(null) (getItem отсутствующего)      → null
JSON.parse('{плохо')                           → "SyntaxError"
Date через JSON                                → ["{\\"d\\":\\"1970-01-01T00:00:00.000Z\\"}","string"]
Map через JSON                                 → "{\\"m\\":{}}"
structuredClone(Map)                           → [true,true]
structuredClone(функция)                       → "DataCloneError"
вторая вкладка: localStorage.shared            → "из первой вкладки"
вторая вкладка: sessionStorage.mine            → null
после перезагрузки первой: sessionStorage.mine → "только первая вкладка"
тот же сервер по имени localhost: localStorage.shared → null`, { filename: "замер в Chromium 141 (страница с локального сервера)" }),
      ul(
        "**Только строки:** `42` → `\"42\"`, `true` → `\"true\"`, `{a: 1}` → `\"[object Object]\"`, `[1, 2]` → `\"1,2\"`. `getItem` несуществующего ключа возвращает `null` (не `undefined`).",
        "**Свойства вместо методов работают, но опасны:** `localStorage.title = …` записывает ключ, `\"title\" in localStorage` — `true`; ключ `\"length\"` сохраняется (`getItem` вернёт `\"x\"`), но свойство `localStorage.length` остаётся числом — пользуйтесь методами.",
        "**JSON:** `JSON.stringify(undefined)` возвращает `undefined` (не строку) — `setItem(\"u\", undefined)` сохранит строку `\"undefined\"`, а `JSON.parse(\"undefined\")` бросит `SyntaxError`; `JSON.parse(null)` вернёт `null`; битая строка — `SyntaxError`. Поэтому чтение всегда в `try/catch` с запасным значением.",
        "**Потери при JSON:** `Date` превращается в строку, `Map` — в `{}`. `structuredClone` сохраняет `Map` и `Date`, но бросает `DataCloneError` для функций.",
        "**Область:** `localStorage` общий у всех вкладок origin (`из первой вкладки` видна во второй); `sessionStorage` у новой вкладки пуст (`null`), но переживает перезагрузку своей вкладки. Тот же сервер по имени `localhost` вместо `127.0.0.1` — другой origin и пустое хранилище.",
      ),

      h("Событие `storage` и синхронизация вкладок"),
      code("js", `import { start } from "./_srv.mjs";
const t = await start();
const a = await t.context.newPage(), b = await t.context.newPage();
await a.goto(t.origin + "/"); await b.goto(t.origin + "/");
for (const p of [a, b]) await p.evaluate(() => { window.ev = []; localStorage.clear(); addEventListener("storage", (e) => ev.push({ key: e.key, old: e.oldValue, new: e.newValue, area: e.storageArea === localStorage ? "localStorage" : e.storageArea === sessionStorage ? "sessionStorage" : "?", url: e.url.replace(location.origin, "ORIGIN") })); });
const flush = (p) => p.evaluate(() => new Promise((r) => setTimeout(() => r(ev.splice(0)), 100)));
const show = async (title) => { console.log(title); console.log("  вкладка A (изменяла):", JSON.stringify(await flush(a))); console.log("  вкладка B (другая):  ", JSON.stringify(await flush(b))); };

await a.evaluate(() => localStorage.setItem("theme", "dark")); await show("setItem('theme', 'dark')");
await a.evaluate(() => localStorage.setItem("theme", "dark")); await show("setItem с тем же значением");
await a.evaluate(() => localStorage.setItem("theme", "light")); await show("setItem('theme', 'light')");
await a.evaluate(() => localStorage.removeItem("theme")); await show("removeItem('theme')");
await a.evaluate(() => localStorage.removeItem("нет такого")); await show("removeItem несуществующего ключа");
await a.evaluate(() => { localStorage.setItem("x", "1"); }); await flush(a); await flush(b);
await a.evaluate(() => localStorage.clear()); await show("clear()");
await a.evaluate(() => sessionStorage.setItem("s", "1")); await show("sessionStorage.setItem в первой вкладке");
await t.close();`, { filename: "run-st2-event.mjs", collapsed: true }),
      code("text", `setItem('theme', 'dark')
  вкладка A (изменяла): []
  вкладка B (другая):   [{"key":"theme","old":null,"new":"dark","area":"localStorage","url":"ORIGIN/"}]
setItem с тем же значением
  вкладка A (изменяла): []
  вкладка B (другая):   []
setItem('theme', 'light')
  вкладка A (изменяла): []
  вкладка B (другая):   [{"key":"theme","old":"dark","new":"light","area":"localStorage","url":"ORIGIN/"}]
removeItem('theme')
  вкладка A (изменяла): []
  вкладка B (другая):   [{"key":"theme","old":"light","new":null,"area":"localStorage","url":"ORIGIN/"}]
removeItem несуществующего ключа
  вкладка A (изменяла): []
  вкладка B (другая):   []
clear()
  вкладка A (изменяла): []
  вкладка B (другая):   [{"key":null,"old":null,"new":null,"area":"localStorage","url":"ORIGIN/"}]
sessionStorage.setItem в первой вкладке
  вкладка A (изменяла): []
  вкладка B (другая):   []`, { filename: "замер в Chromium 141 (две вкладки одного контекста)" }),
      ul(
        "**Только «чужие» вкладки:** при `setItem` вкладка A события не получила (`[]`), вкладка B получила `key`, `oldValue`, `newValue`, `storageArea`, `url`.",
        "**Нет изменения — нет события:** повторный `setItem` с тем же значением и `removeItem` несуществующего ключа событий не породили.",
        "**`clear()`** даёт одно событие с `key: null`; изменения `sessionStorage` в первой вкладке второй вкладке не видны.",
        "**Шаблон синхронизации:** слушать `storage`, сравнивать `event.key` с нужным и разбирать `event.newValue` (может быть `null` при удалении); не записывать обратно то, что только что прочитали, — иначе вкладки зациклятся.",
      ),

      h("Квота"),
      code("js", `import { start } from "./_srv.mjs";
const t = await start();
const page = await t.context.newPage();
await page.goto(t.origin + "/");
const r = await page.evaluate(() => {
  localStorage.clear();
  const fits = (n) => { try { localStorage.setItem("k", "x".repeat(n)); return true; } catch { return false; } };
  let lo = 0, hi = 20 * 1024 * 1024;
  while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (fits(mid)) lo = mid; else hi = mid - 1; }
  const max = lo;
  fits(max);
  let err;
  try { localStorage.setItem("k", "x".repeat(max + 1)); } catch (e) { err = { name: e.name, code: e.code, instance: e instanceof DOMException }; }
  const kept = localStorage.getItem("k").length;
  localStorage.clear();
  localStorage.setItem("long-key-name-" + "y".repeat(1000), "x");
  const keyCounts = (() => { let lo = 0, hi = 20 * 1024 * 1024; const f = (n) => { try { localStorage.setItem("k", "x".repeat(n)); return true; } catch { return false; } }; while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (f(mid)) lo = mid; else hi = mid - 1; } return lo; })();
  localStorage.clear();
  return { max, err, kept, keyCounts, mib: max / 1024 / 1024 };
});
console.log("максимальная длина значения под ключом 'k':", r.max, "символов (≈", r.mib.toFixed(3), "МиБ)");
console.log("ошибка при превышении:", JSON.stringify(r.err));
console.log("после неудачной записи старое значение цело, длина:", r.kept === r.max);
console.log("ключ длиной 1014 символов + значение 'x' уменьшают доступный объём на", r.max - r.keyCounts, "символа (ключи и значения считаются вместе)");
await t.close();`, { filename: "run-st3-quota.mjs", collapsed: true }),
      code("text", `максимальная длина значения под ключом 'k': 5242879 символов (≈ 5.000 МиБ)
ошибка при превышении: {"name":"QuotaExceededError","code":22,"instance":true}
после неудачной записи старое значение цело, длина: true
ключ длиной 1014 символов + значение 'x' уменьшают доступный объём на 1015 символа (ключи и значения считаются вместе)`, { filename: "замер в Chromium 141 (бинарный поиск предела)" }),
      ul(
        "**Предел:** значение длиной **5 242 879** символов под ключом из одного символа помещается, на один символ больше — нет (`5 242 880` = 5 МиБ в единицах UTF-16 для ключа и значения вместе). Предел зависит от браузера — спецификация размер не фиксирует.",
        "**Ошибка:** `DOMException` с именем `QuotaExceededError` и кодом `22`; **старое значение осталось невредимым**.",
        "**Ключи тоже расходуют квоту:** ключ длиной 1014 символов плюс значение `x` уменьшили доступное место на 1015 символов.",
        "**Синхронность:** операции блокируют главный поток — большие объёмы данных и частые записи хранят в IndexedDB или пишут редко (debounce).",
      ),

      h("IndexedDB: транзакции вместо блокировок"),
      code("html", `<script>
  const wrap = (request) => new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const done = (tx) => new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);      // ошибка запроса всплывает до транзакции
    tx.onabort = () => reject(tx.error ?? new DOMException("abort", "AbortError"));
  });

  function openDb(name, version, upgrade) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);
      request.onupgradeneeded = (e) => upgrade(request.result, e.oldVersion);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function demo() {
    const L = [];
    const log = (k, v) => L.push(k.padEnd(48) + "→ " + JSON.stringify(v));
    await new Promise((r) => { const q = indexedDB.deleteDatabase("shop"); q.onsuccess = q.onerror = r; });

    // 1. Создание схемы
    const db = await openDb("shop", 1, (db, old) => {
      log("onupgradeneeded: старая версия", old);
      const items = db.createObjectStore("items", { keyPath: "id" });
      items.createIndex("byPrice", "price");
    });
    log("версия, хранилища", [db.version, [...db.objectStoreNames]]);

    // 2. Запись нескольких объектов в одной транзакции
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    for (const item of [{ id: 1, title: "ручка", price: 10, created: new Date(0), tags: new Set(["a"]) }, { id: 2, title: "тетрадь", price: 25 }, { id: 3, title: "линейка", price: 15 }]) store.put(item);
    await done(tx);

    // 3. Чтение, индекс, диапазон
    const read = db.transaction("items").objectStore("items");
    const one = await wrap(read.get(1));
    log("get(1): Date и Set сохранились как есть", [one.created instanceof Date, one.tags instanceof Set]);
    log("getAll()", (await wrap(read.getAll())).map((i) => i.title));
    log("индекс byPrice, диапазон 10…15", (await wrap(read.index("byPrice").getAll(IDBKeyRange.bound(10, 15)))).map((i) => i.title));
    log("count()", await wrap(read.count()));

    // 4. add с существующим ключом — ошибка
    try { await wrap(db.transaction("items", "readwrite").objectStore("items").add({ id: 1, title: "дубль", price: 1 })); } catch (e) { log("add() с занятым ключом", e.name); }

    // 5. Функцию сохранить нельзя
    try { db.transaction("items", "readwrite").objectStore("items").put({ id: 9, fn() {} }); } catch (e) { log("put({ fn() {} })", e.name); }

    // 6. Ловушка: транзакция закрывается, пока вы ждёте чужое обещание
    const bad = db.transaction("items", "readwrite").objectStore("items");
    await wrap(bad.put({ id: 4, title: "первая запись", price: 1 }));
    await new Promise((r) => setTimeout(r, 0));          // ожидание, не связанное с IndexedDB
    try { bad.put({ id: 5, title: "вторая запись", price: 1 }); } catch (e) { log("put после await setTimeout внутри транзакции", e.name); }

    // 7. Правильно: подготовить данные до открытия транзакции
    const prepared = await Promise.resolve({ id: 6, title: "готовые данные", price: 5 });
    const ok = db.transaction("items", "readwrite"); ok.objectStore("items").put(prepared); await done(ok);
    log("запись из подготовленных данных, всего записей", await wrap(db.transaction("items").objectStore("items").count()));

    // 8. Миграция схемы: версия 2
    db.close();
    const db2 = await openDb("shop", 2, (db, old) => { log("миграция: старая версия", old); db.createObjectStore("settings"); });
    log("версия, хранилища после миграции", [db2.version, [...db2.objectStoreNames]]);
    log("данные после миграции на месте", await wrap(db2.transaction("items").objectStore("items").count()));

    // 9. Ошибка запроса откатывает всю транзакцию
    const atomic = db2.transaction("items", "readwrite");
    atomic.objectStore("items").put({ id: 100, title: "будет откатена", price: 1 });
    atomic.objectStore("items").add({ id: 1, title: "дубль", price: 1 });       // ConstraintError без перехвата
    try { await done(atomic); } catch (e) { log("транзакция с ошибкой в запросе", e.name); }
    log("запись id=100 после отката", (await wrap(db2.transaction("items").objectStore("items").get(100))) ?? "нет");
    db2.close();
    return L;
  }
  window.ready = demo();
</script>`, { filename: "st4-indexeddb.html", collapsed: true, lineNumbers: true }),
      code("text", `onupgradeneeded: старая версия                  → 0
версия, хранилища                               → [1,["items"]]
get(1): Date и Set сохранились как есть         → [true,true]
getAll()                                        → ["ручка","тетрадь","линейка"]
индекс byPrice, диапазон 10…15                  → ["ручка","линейка"]
count()                                         → 3
add() с занятым ключом                          → "ConstraintError"
put({ fn() {} })                                → "DataCloneError"
put после await setTimeout внутри транзакции    → "TransactionInactiveError"
запись из подготовленных данных, всего записей  → 5
миграция: старая версия                         → 1
версия, хранилища после миграции                → [2,["items","settings"]]
данные после миграции на месте                  → 5
транзакция с ошибкой в запросе                  → "ConstraintError"
запись id=100 после отката                      → "нет"`, { filename: "замер в Chromium 141" }),
      ul(
        "**Схема создаётся только в `onupgradeneeded`:** старая версия `0` при первом создании, затем миграция `1 → 2` добавила хранилище `settings`, а данные (5 записей) остались на месте.",
        "**Структурное клонирование:** `Date` и `Set` вернулись теми же типами (`[true, true]`); функция в объекте — `DataCloneError`.",
        "**Индекс и диапазон:** `index(\"byPrice\").getAll(IDBKeyRange.bound(10, 15))` вернул «ручку» и «линейку».",
        "**`add()` с занятым ключом** — `ConstraintError` (для замены есть `put()`); необработанная ошибка запроса **откатывает всю транзакцию** (запись `id=100`, сделанная в той же транзакции, исчезла).",
        "**Ловушка:** после `await new Promise(setTimeout)` внутри транзакции следующая запись упала `TransactionInactiveError` — транзакция завершается, когда в очереди не осталось запросов, а чужое асинхронное ожидание её не удерживает. Подготовьте данные **до** открытия транзакции.",
        "**Обёртки над запросами в обещания:** `request.onsuccess/onerror` → `new Promise`; завершение транзакции — событие `complete` (не готовность последнего запроса).",
      ),

      h("`URL` и `URLSearchParams`"),
      code("js", `const show = (k, v) => console.log(k.padEnd(44), "→", typeof v === "string" ? v : JSON.stringify(v));

// 1. Части адреса
const u = new URL("https://user:pw@example.com:8080/a/b/../c?x=1&y=2#top");
show("разбор адреса", { protocol: u.protocol, username: u.username, host: u.host, hostname: u.hostname, port: u.port, pathname: u.pathname, search: u.search, hash: u.hash, origin: u.origin });
show("порт по умолчанию отбрасывается", [new URL("https://example.com:443/").port, new URL("https://example.com:443/").host]);
show("кириллица в адресе", [new URL("https://пример.рф/привет мир").hostname, new URL("https://пример.рф/привет мир").pathname]);

// 2. Относительные адреса
const base = "https://example.com/blog/post/index.html?old=1#frag";
for (const rel of ["../img/a.png", "/root.css", "//cdn.example.com/x.js", "?q=1", "#top", "other.html"]) show(\`new URL("\${rel}", base)\`, new URL(rel, base).href);

// 3. Ошибки и проверка
try { new URL("не адрес"); } catch (e) { show("new URL('не адрес')", [e.name, e.code]); }
show("URL.canParse", [URL.canParse("не адрес"), URL.canParse("/path", "https://e.com"), URL.canParse("/path")]);

// 4. URLSearchParams
const p = new URLSearchParams("a=1&a=2&b=3+4&c=%D1%8F");
show("getAll('a'), get('a'), get('b'), get('c'), get('нет')", [p.getAll("a"), p.get("a"), p.get("b"), p.get("c"), p.get("нет")]);
p.set("a", "9"); p.append("d", "x y&z=1"); p.delete("b");
show("после set/append/delete → toString()", p.toString());
show("has('a'), Object.fromEntries", [p.has("a"), Object.fromEntries(new URLSearchParams("t=1&t=2"))]);
show("объект и массив в конструкторе", new URLSearchParams({ n: 1, ok: true, list: [1, 2], nil: null, und: undefined }).toString());
const link = new URL("https://example.com/search");
link.searchParams.set("q", "кот & пёс");
show("searchParams.set меняет url.search", [link.search, link.href]);

// 5. Склейка строк и инъекция параметров
const input = "a&admin=1";
show("'/search?q=' + input", new URL("https://e.com/search?q=" + input).searchParams.get("admin"));
const safe = new URL("https://e.com/search"); safe.searchParams.set("q", input);
show("searchParams.set('q', input)", [safe.searchParams.get("admin"), safe.search]);

// 6. encodeURIComponent и encodeURI
show("encodeURIComponent('a b&c/d?e=ж')", encodeURIComponent("a b&c/d?e=ж"));
show("encodeURI('https://e.com/a b?x=1&y=ж')", encodeURI("https://e.com/a b?x=1&y=ж"));
show("encodeURIComponent('~!*()\\\\'')", encodeURIComponent("~!*()'"));

// 7. Опасные схемы в пользовательских ссылках (второй элемент: обманутся ли проверкой startsWith)
for (const href of ["javascript:alert(1)", "data:text/html,<b>x</b>", "HTTPS://Example.com/Path", " \\tjavascript:alert(1)"]) {
  const parsed = URL.canParse(href) ? new URL(href) : null;
  show(\`протокол \${JSON.stringify(href)}\`, [parsed && parsed.protocol, href.startsWith("javascript:")]);
}
const safeHref = (value) => { try { const x = new URL(value, "https://example.com"); return ["http:", "https:"].includes(x.protocol) ? x.href : null; } catch { return null; } };
show("safeHref('javascript:alert(1)'), safeHref('/ok')", [safeHref("javascript:alert(1)"), safeHref("/ok")]);`, { filename: "st5-url.mjs", collapsed: true, lineNumbers: true }),
      code("text", `разбор адреса                                → {"protocol":"https:","username":"user","host":"example.com:8080","hostname":"example.com","port":"8080","pathname":"/a/c","search":"?x=1&y=2","hash":"#top","origin":"https://example.com:8080"}
порт по умолчанию отбрасывается              → ["","example.com"]
кириллица в адресе                           → ["xn--e1afmkfd.xn--p1ai","/%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82%20%D0%BC%D0%B8%D1%80"]
new URL("../img/a.png", base)                → https://example.com/blog/img/a.png
new URL("/root.css", base)                   → https://example.com/root.css
new URL("//cdn.example.com/x.js", base)      → https://cdn.example.com/x.js
new URL("?q=1", base)                        → https://example.com/blog/post/index.html?q=1
new URL("#top", base)                        → https://example.com/blog/post/index.html?old=1#top
new URL("other.html", base)                  → https://example.com/blog/post/other.html
new URL('не адрес')                          → ["TypeError","ERR_INVALID_URL"]
URL.canParse                                 → [false,true,false]
getAll('a'), get('a'), get('b'), get('c'), get('нет') → [["1","2"],"1","3 4","я",null]
после set/append/delete → toString()         → a=9&c=%D1%8F&d=x+y%26z%3D1
has('a'), Object.fromEntries                 → [true,{"t":"2"}]
объект и массив в конструкторе               → n=1&ok=true&list=1%2C2&nil=null&und=undefined
searchParams.set меняет url.search           → ["?q=%D0%BA%D0%BE%D1%82+%26+%D0%BF%D1%91%D1%81","https://example.com/search?q=%D0%BA%D0%BE%D1%82+%26+%D0%BF%D1%91%D1%81"]
'/search?q=' + input                         → 1
searchParams.set('q', input)                 → [null,"?q=a%26admin%3D1"]
encodeURIComponent('a b&c/d?e=ж')            → a%20b%26c%2Fd%3Fe%3D%D0%B6
encodeURI('https://e.com/a b?x=1&y=ж')       → https://e.com/a%20b?x=1&y=%D0%B6
encodeURIComponent('~!*()\\'')                → ~!*()'
протокол "javascript:alert(1)"               → ["javascript:",true]
протокол "data:text/html,<b>x</b>"           → ["data:",false]
протокол "HTTPS://Example.com/Path"          → ["https:",false]
протокол " \\tjavascript:alert(1)"            → ["javascript:",false]
safeHref('javascript:alert(1)'), safeHref('/ok') → [null,"https://example.com/ok"]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Части адреса:** `/a/b/../c` нормализуется до `/a/c`, порт по умолчанию (`:443`) отбрасывается; кириллический хост переводится в punycode (`xn--e1afmkfd.xn--p1ai`), путь кодируется процентами.",
        "**Относительные адреса** разрешаются от базового: `../img/a.png`, `/root.css`, `//cdn.example.com/x.js`, `?q=1` (заменяет только запрос), `#top`, `other.html`.",
        "**Ошибки:** `new URL(\"не адрес\")` — `TypeError` (`ERR_INVALID_URL`); безопасная проверка — `URL.canParse` (`false` для адреса без базы, `true` с базой).",
        "**`URLSearchParams`:** `get` — первое значение, `getAll` — все, отсутствующий — `null`; `+` читается как пробел; при записи пробел — `+`, `&` и `=` кодируются (`x+y%26z%3D1`). `Object.fromEntries` теряет дубликаты (`t: \"2\"`).",
        "**Приведение типов:** конструктор из объекта превращает массив в `1,2` (`list=1%2C2`), `null` — в `null`, `undefined` — в `undefined`; проверяйте данные до сборки.",
        "**Инъекция параметров:** `\"/search?q=\" + \"a&admin=1\"` дал `searchParams.get(\"admin\") === \"1\"`; `searchParams.set(\"q\", input)` сохранил всё значение (`?q=a%26admin%3D1`, `admin` — `null`).",
        "**`encodeURIComponent`** кодирует всё, кроме букв, цифр и `-_.!~*'()`; `encodeURI` оставляет структуру адреса (`/`, `?`, `&`, `=`). Для значений параметров — только `encodeURIComponent` (или `searchParams`).",
        "**Схемы:** `javascript:` и `data:` — корректные `URL`; `startsWith(\"javascript:\")` не поймал `\" \\tjavascript:alert(1)\"` (ведущие пробелы и табуляция отбрасываются при разборе, `protocol === \"javascript:\"`). Проверка по списку: `[\"http:\", \"https:\"].includes(new URL(value, base).protocol)`.",
      ),

      h("History API"),
      code("js", `import { start } from "./_srv.mjs";
const t = await start();
const page = await t.context.newPage();
await page.goto(t.origin + "/start");
await page.evaluate(() => {
  window.L = [];
  const at = () => location.pathname + location.search + location.hash;
  addEventListener("popstate", (e) => L.push(\`popstate: state=\${JSON.stringify(e.state)}, адрес=\${at()}\`));
  addEventListener("hashchange", (e) => L.push(\`hashchange: \${new URL(e.oldURL).hash || "(пусто)"} → \${new URL(e.newURL).hash}\`));
  window.at = at; window.startLen = history.length;
});
const step = async (title, fn) => { await page.evaluate(() => L.splice(0)); await page.evaluate(fn); await page.waitForTimeout(120); console.log(title.padEnd(44), "→ адрес:", await page.evaluate(() => at()), "| события:", JSON.stringify(await page.evaluate(() => L.splice(0))), "| записей добавлено:", await page.evaluate(() => history.length - startLen)); };
await step("pushState({page: 1}, '', '/list?p=1')", () => history.pushState({ page: 1 }, "", "/list?p=1"));
await step("pushState({page: 2}, '', '/list?p=2')", () => history.pushState({ page: 2 }, "", "/list?p=2"));
await step("replaceState({page: 2, v: 2}, '', ...)", () => history.replaceState({ page: 2, v: 2 }, "", "/list?p=2"));
await step("history.back()", () => history.back());
await step("history.forward()", () => history.forward());
await step("location.hash = '#top'", () => { location.hash = "#top"; });
await step("history.go(-2)", () => history.go(-2));
try { await page.evaluate(() => history.pushState({}, "", "https://evil.example/x")); } catch (e) { console.log("pushState на чужой origin →", /(\\w+Error)/.exec(e.message)[1]); }
console.log("history.state после перехода назад:", JSON.stringify(await page.evaluate(() => history.state)));
console.log("history.scrollRestoration:", await page.evaluate(() => history.scrollRestoration));
// перезагрузка: сервер отдаёт страницу на любой путь, но состояние сохраняется
await page.evaluate(() => history.pushState({ keep: "me" }, "", "/deep/link"));
await page.reload();
console.log("после перезагрузки на /deep/link: history.state =", JSON.stringify(await page.evaluate(() => history.state)), "| адрес:", await page.evaluate(() => location.pathname));
await t.close();`, { filename: "run-st6-history.mjs", collapsed: true }),
      code("text", `pushState({page: 1}, '', '/list?p=1')        → адрес: /list?p=1 | события: [] | записей добавлено: 1
pushState({page: 2}, '', '/list?p=2')        → адрес: /list?p=2 | события: [] | записей добавлено: 2
replaceState({page: 2, v: 2}, '', ...)       → адрес: /list?p=2 | события: [] | записей добавлено: 2
history.back()                               → адрес: /list?p=1 | события: ["popstate: state={\\"page\\":1}, адрес=/list?p=1"] | записей добавлено: 2
history.forward()                            → адрес: /list?p=2 | события: ["popstate: state={\\"page\\":2,\\"v\\":2}, адрес=/list?p=2"] | записей добавлено: 2
location.hash = '#top'                       → адрес: /list?p=2#top | события: ["popstate: state=null, адрес=/list?p=2#top","hashchange: (пусто) → #top"] | записей добавлено: 3
history.go(-2)                               → адрес: /list?p=1 | события: ["popstate: state={\\"page\\":1}, адрес=/list?p=1"] | записей добавлено: 3
pushState на чужой origin → SecurityError
history.state после перехода назад: {"page":1}
history.scrollRestoration: auto
после перезагрузки на /deep/link: history.state = {"keep":"me"} | адрес: /deep/link`, { filename: "замер в Chromium 141" }),
      ul(
        "**`pushState` и `replaceState` не вызывают `popstate`** (`события: []`); `pushState` добавляет запись (`записей добавлено: 1, 2`), `replaceState` заменяет текущую (число не изменилось, `state` заменён на `{page: 2, v: 2}`).",
        "**`back`/`forward`/`go`** вызывают `popstate` со `state` целевой записи (`{page: 1}`, `{page: 2, v: 2}`).",
        "**Смена `location.hash`** добавляет запись и вызывает и `popstate` (`state: null`), и `hashchange` (`(пусто) → #top`).",
        "**Только свой origin:** `pushState` на чужой адрес — `SecurityError`.",
        "**Перезагрузка** сохраняет `history.state` (`{keep: \"me\"}`), но сервер должен отдавать страницу и для «глубоких» адресов (`/deep/link`) — иначе после обновления будет `404`.",
        "**Шаблон:** рисуем состояние из `URL` при загрузке и в `popstate`; `pushState` вызываем при действиях пользователя; `replaceState` — для уточнения текущей записи (например, подстановка значения по умолчанию).",
      ),

      h("Таймеры в браузере"),
      code("html", `<script>
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const sleepBlocking = (ms) => { const end = performance.now() + ms; while (performance.now() < end); };
  async function demo() {
    const L = [];
    const log = (k, v) => L.push(k.padEnd(52) + "→ " + JSON.stringify(v));

    // 1. Тип идентификатора и аргументы
    const id = setTimeout(() => {}, 0);
    log("typeof setTimeout(...) в браузере", typeof id);
    clearTimeout(id);
    const args = await new Promise((r) => setTimeout((a, b) => r([a, b]), 5, "один", "два"));
    log("setTimeout(fn, 5, 'один', 'два') → аргументы", args);

    // 2. Слишком большая задержка
    const t0 = performance.now();
    await new Promise((r) => setTimeout(r, 2 ** 31));
    log("setTimeout(fn, 2**31): сработал быстро (< 200 мс)", performance.now() - t0 < 200);

    // 3. clearTimeout и clearInterval взаимозаменяемы; повторный и «мусорный» вызовы безопасны
    let fired = 0;
    clearInterval(setTimeout(() => fired++, 10));
    clearTimeout(setInterval(() => fired++, 10));
    clearTimeout(undefined); clearTimeout(12345); clearTimeout("не число");
    await wait(60);
    log("отменены через «чужую» функцию, сработало раз", fired);

    // 4. Одинаковая задержка — порядок создания
    const order = [];
    setTimeout(() => order.push("a"), 10); setTimeout(() => order.push("b"), 10); setTimeout(() => order.push("c"), 5);
    await wait(40);
    log("a(10), b(10), c(5) →", order);

    // 5. setInterval: исключение не останавливает таймер
    let ticks = 0;
    const errs = [];
    const onerror = (e) => { errs.push(e.message); e.preventDefault(); };
    addEventListener("error", onerror);
    const iv = setInterval(() => { ticks++; throw new Error("сбой в тике " + ticks); }, 15);
    await wait(80);
    clearInterval(iv);
    removeEventListener("error", onerror);
    log("исключение в setInterval: тиков >= 3, ошибок столько же", [ticks >= 3, errs.length === ticks, errs[0]]);

    // 6. setInterval и медленный async-колбэк: перекрытие; рекурсивный setTimeout не перекрывается
    const measureOverlap = async (schedule) => {
      let running = 0, max = 0, count = 0;
      const job = async () => { running++; max = Math.max(max, running); await wait(50); running--; count++; };
      const stop = schedule(job);
      await wait(200);
      stop();
      await wait(80);
      return { maxConcurrent: max, started: count > 0 };
    };
    log("setInterval(job, 20), job длится 50 мс: перекрытие", (await measureOverlap((job) => { const i = setInterval(job, 20); return () => clearInterval(i); })).maxConcurrent >= 2);
    log("рекурсивный setTimeout после завершения job: перекрытие", (await measureOverlap((job) => { let on = true; (async function loop() { while (on) { await job(); await wait(20); } })(); return () => { on = false; }; })).maxConcurrent >= 2);

    // 7. Блокировка потока: тики интервала не копятся
    let beats = 0;
    const hb = setInterval(() => beats++, 20);
    await wait(10);
    sleepBlocking(150);
    await wait(60);
    clearInterval(hb);
    log("интервал 20 мс, блокировка 150 мс, окно ≈ 220 мс: тиков < 10", beats < 10);

    // 8. requestAnimationFrame и requestIdleCallback
    const frames = await new Promise((r) => { const ts = []; const tick = (t) => { ts.push(t); ts.length < 3 ? requestAnimationFrame(tick) : r(ts); }; requestAnimationFrame(tick); });
    log("rAF: три кадра, метки времени растут, тип", [frames[0] < frames[1] && frames[1] < frames[2], typeof frames[0]]);
    let cancelled = true;
    const raf = requestAnimationFrame(() => { cancelled = false; }); cancelAnimationFrame(raf);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    log("cancelAnimationFrame отменил колбэк", cancelled);
    log("typeof requestIdleCallback, typeof scheduler.postTask", [typeof requestIdleCallback, typeof globalThis.scheduler?.postTask]);
    return L;
  }
  window.ready = demo();
</script>`, { filename: "st7-timers.html", collapsed: true, lineNumbers: true }),
      code("text", `typeof setTimeout(...) в браузере                   → "number"
setTimeout(fn, 5, 'один', 'два') → аргументы        → ["один","два"]
setTimeout(fn, 2**31): сработал быстро (< 200 мс)   → true
отменены через «чужую» функцию, сработало раз       → 0
a(10), b(10), c(5) →                                → ["c","a","b"]
исключение в setInterval: тиков >= 3, ошибок столько же→ [true,true,"Uncaught Error: сбой в тике 1"]
setInterval(job, 20), job длится 50 мс: перекрытие  → true
рекурсивный setTimeout после завершения job: перекрытие→ false
интервал 20 мс, блокировка 150 мс, окно ≈ 220 мс: тиков < 10→ true
rAF: три кадра, метки времени растут, тип           → [true,"number"]
cancelAnimationFrame отменил колбэк                 → true
typeof requestIdleCallback, typeof scheduler.postTask→ ["function","function"]`, { filename: "замер в Chromium 141" }),
      ul(
        "**Идентификатор — число** (`typeof setTimeout(...) === \"number\"`); дополнительные аргументы передаются колбэку (`[\"один\", \"два\"]`).",
        "**Слишком большая задержка** (`2 ** 31` и больше не помещается в 32-битное знаковое число) — колбэк сработал сразу (< 200 мс).",
        "**`clearTimeout` и `clearInterval` взаимозаменяемы:** обе отменили чужой таймер (`сработало раз: 0`); отмена несуществующего или «мусорного» идентификатора безвредна.",
        "**Порядок:** таймер с меньшей задержкой сработал раньше (`c(5)`), одинаковые — в порядке создания (`a`, `b`).",
        "**Исключение в колбэке `setInterval` интервал не останавливает:** тиков не меньше 3, ошибок столько же (`Uncaught Error: сбой в тике 1`).",
        "**`setInterval` с медленным `async`-колбэком (50 мс при интервале 20 мс) перекрывается** (`true`); цикл «выполнить → пауза → повторить» (рекурсивный `setTimeout` или `while` с `await`) не перекрывается (`false`).",
        "**Блокировка потока:** при блокировке на 150 мс интервал 20 мс не «догоняет» пропущенные тики (за ≈ 220 мс < 10 тиков) — [цикл событий](/learn/js/event-loop).",
        "**`requestAnimationFrame`:** три кадра с растущими числовыми метками времени; `cancelAnimationFrame` отменяет колбэк; в Chromium есть `requestIdleCallback` и `scheduler.postTask`.",
      ),
      h("Таймеры в Node.js"),
      code("js", `import { execFileSync, spawnSync } from "node:child_process";
import { setTimeout as sleep, setInterval as every } from "node:timers/promises";

const show = (k, v) => console.log(k.padEnd(52), "→", typeof v === "string" ? v : JSON.stringify(v));

// 1. В Node setTimeout возвращает объект
const t = setTimeout(() => {}, 0);
show("typeof setTimeout(...) в Node", typeof t);
show("методы объекта Timeout", ["ref", "unref", "hasRef", "refresh"].map((m) => typeof t[m]));
show("приведение к числу: Number(timeout) — идентификатор", typeof Number(t));
clearTimeout(t);

// 2. unref(): таймер не удерживает процесс
const child = (code) => spawnSync(process.execPath, ["-e", code], { encoding: "utf8" });
let r = child(\`setTimeout(() => console.log("сработал"), 300); console.log("конец скрипта")\`);
show("обычный таймер: вывод процесса", r.stdout.trim().split("\\n"));
r = child(\`setTimeout(() => console.log("сработал"), 300).unref(); console.log("конец скрипта")\`);
show("с unref(): вывод процесса", r.stdout.trim().split("\\n"));

// 3. Исключение в колбэке таймера
r = child(\`setInterval(() => { throw new Error("сбой") }, 10); setTimeout(() => console.log("не напечатается"), 100)\`);
show("исключение в таймере: код выхода, первая строка stderr", [r.status, r.stderr.split("\\n").find((l) => l.startsWith("Error:"))]);

// 4. Слишком большая задержка
r = child(\`const t0 = Date.now(); setTimeout(() => console.log("сработал, быстро:", Date.now() - t0 < 200), 2 ** 31)\`);
show("setTimeout(fn, 2**31): вывод", r.stdout.trim());
show("предупреждение в stderr", r.stderr.split("\\n").find((l) => l.includes("TimeoutOverflowWarning"))?.replace(/^\\(node:\\d+\\) /, ""));

// 5. Promise-версии
const started = performance.now();
show("await sleep(30, 'значение')", [await sleep(30, "значение"), performance.now() - started >= 25]);
let n = 0;
for await (const _ of every(15)) { if (++n === 3) break; }
show("for await (… of setInterval(15)) — 3 тика, затем break", n);

// 6. refresh(): перезапуск отсчёта
const log = [];
const t0 = performance.now();
const r1 = setTimeout(() => log.push(performance.now() - t0 >= 75), 50);
await sleep(30); r1.refresh();
await sleep(100);
show("refresh(): таймер на 50 мс, сброс на 30-й мс — сработал не раньше 75 мс", log);`, { filename: "st7-node-timers.mjs", collapsed: true }),
      code("text", `typeof setTimeout(...) в Node                        → object
методы объекта Timeout                               → ["function","function","function","function"]
приведение к числу: Number(timeout) — идентификатор  → number
обычный таймер: вывод процесса                       → ["конец скрипта","сработал"]
с unref(): вывод процесса                            → ["конец скрипта"]
исключение в таймере: код выхода, первая строка stderr → [1,"Error: сбой"]
setTimeout(fn, 2**31): вывод                         → сработал, быстро: true
предупреждение в stderr                              → TimeoutOverflowWarning: 2147483648 does not fit into a 32-bit signed integer.
await sleep(30, 'значение')                          → ["значение",true]
for await (… of setInterval(15)) — 3 тика, затем break → 3
refresh(): таймер на 50 мс, сброс на 30-й мс — сработал не раньше 75 мс → [true]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Идентификатор — объект `Timeout`** с методами `ref`, `unref`, `hasRef`, `refresh`; `Number(timeout)` даёт числовой идентификатор.",
        "**`unref()`** не даёт таймеру удерживать процесс: без него вывод `конец скрипта`, `сработал`; с ним — только `конец скрипта`.",
        "**Исключение в колбэке таймера завершает процесс** с кодом `1` (в браузере — лишь сообщение в консоли).",
        "**Задержка `2 ** 31`:** предупреждение `TimeoutOverflowWarning`, колбэк срабатывает сразу.",
        "**`timers/promises`:** `await sleep(30, \"значение\")`, асинхронный итератор `for await (… of setInterval(15))` с `break`; `refresh()` перезапускает отсчёт (сработал не раньше 75 мс при 50 мс и сбросе на 30-й миллисекунде).",
      ),

      h("Живая страница: настройки, которые помнят выбор"),
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Настройки, которые помнят выбор</title>
<style>
  :root { color-scheme: light; }
  body { font: 16px system-ui, sans-serif; margin: 1.5rem; max-width: 30rem; transition: background .2s; }
  body[data-theme="dark"] { background: #111827; color: #e5e7eb; color-scheme: dark; }
  label { display: block; margin: .8rem 0; }
  #sample { padding: .75rem; border: 1px solid currentColor; border-radius: 8px; }
  #info { font-size: .85rem; opacity: .85; white-space: pre-wrap; }
</style>
<h1>Настройки</h1>
<label>Тема
  <select id="theme"><option value="light">светлая</option><option value="dark">тёмная</option></select>
</label>
<label>Размер текста: <output id="sizeOut"></output> px
  <input id="size" type="range" min="12" max="28" step="1">
</label>
<p id="sample">Пример текста: съешь же ещё этих мягких французских булок.</p>
<button id="reset" type="button">Сбросить</button>
<p id="info" role="status"></p>
<script>
  // Небольшое состояние, которое переживает перезагрузку, мигрирует между версиями и синхронизируется между вкладками.
  function createPersistentStore({
    key,
    version = 1,
    defaults = {},
    migrate = {},                       // migrate[n](data) переводит данные версии n в версию n + 1
    storage = globalThis.localStorage,
    eventArea = storage,                // область, чьи события storage нас интересуют (если storage — обёртка)
    debounceMs = 50,
    onError,
  } = {}) {
    const lifetime = new AbortController();
    const subscribers = new Set();
    let timer = null;
    let state = load(storage.getItem.bind(storage, key));

    function parse(raw) {
      if (raw == null) return null;
      try {
        const envelope = JSON.parse(raw);
        if (!envelope || typeof envelope !== "object" || !Number.isInteger(envelope.v) || envelope.v > version) return null;
        let data = envelope.data;
        for (let v = envelope.v; v < version; v++) data = migrate[v] ? migrate[v](data) : data;
        return data && typeof data === "object" ? { ...defaults, ...data } : null;
      } catch {
        return null;                    // битый JSON или упавшая миграция — не повод ронять приложение
      }
    }
    function load(read) {
      try { return parse(read()) ?? { ...defaults }; } catch (error) { onError?.(error); return { ...defaults }; }
    }

    function write() {
      timer = null;
      try { storage.setItem(key, JSON.stringify({ v: version, data: state })); } catch (error) { onError?.(error); } // квота, приватный режим
    }
    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(write, debounceMs);
    }
    function flush() {
      if (timer !== null) { clearTimeout(timer); write(); }
    }

    function replace(next) {
      const changed = Object.keys({ ...state, ...next }).some((k) => !Object.is(state[k], next[k]));
      if (!changed) return false;
      const prev = state;
      state = next;
      for (const fn of [...subscribers]) fn(state, prev);
      return true;
    }

    // Другая вкладка изменила то же хранилище: обновляем состояние, но не пишем обратно
    addEventListener("storage", (event) => {
      if (event.storageArea !== eventArea || (event.key !== key && event.key !== null)) return;
      if (event.key === null) return void replace({ ...defaults });          // clear()
      const incoming = parse(event.newValue);
      replace(incoming ?? { ...defaults });
    }, { signal: lifetime.signal });
    addEventListener("pagehide", flush, { signal: lifetime.signal });

    return {
      get: () => state,
      set(patch) {
        const next = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
        if (replace(next)) schedule();
      },
      subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
      flush,
      destroy() { flush(); lifetime.abort(); subscribers.clear(); },
    };
  }

  // Хранилище может быть недоступно (песочница, приватный режим, запрет cookie): тогда работаем в памяти
  function pickStorage() {
    try {
      const probe = "__probe__";
      localStorage.setItem(probe, "1"); localStorage.removeItem(probe);
      return { storage: localStorage, kind: "localStorage" };
    } catch {
      const map = new Map();
      return { kind: "память (localStorage недоступен)", storage: { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, String(v)), removeItem: (k) => void map.delete(k) } };
    }
  }
  const { storage, kind } = pickStorage();
  const errors = [];
  const store = createPersistentStore({
    key: "demo:settings", version: 2, storage, eventArea: kind === "localStorage" ? localStorage : undefined, debounceMs: 150,
    defaults: { theme: "light", size: 16 },
    migrate: { 1: (data) => ({ ...data, size: data.fontSize ?? 16, fontSize: undefined }) },   // v1 хранил размер в fontSize
    onError: (e) => errors.push(e.name),
  });

  const $ = (id) => document.getElementById(id);
  function render(state) {
    document.body.dataset.theme = state.theme;
    $("theme").value = state.theme;
    $("size").value = state.size; $("sizeOut").textContent = state.size;
    $("sample").style.fontSize = state.size + "px";
    $("info").textContent = "Хранилище: " + kind + "\\nСостояние: " + JSON.stringify(state) + (errors.length ? "\\nОшибки записи: " + errors.join(", ") : "");
  }
  store.subscribe((state) => render(state));
  render(store.get());
  $("theme").addEventListener("change", (e) => store.set({ theme: e.target.value }));
  $("size").addEventListener("input", (e) => store.set({ size: Number(e.target.value) }));
  $("reset").addEventListener("click", () => store.set({ theme: "light", size: 16 }));
</script>
</html>`, { filename: "settings-demo.html", runnable: true, collapsed: true }),
      code("text", `первый запуск                                                → {"theme":"light","size":"16px","info":"Хранилище: localStorage"}
в localStorage после паузы (debounce)                        → {"v":2,"data":{"theme":"dark","size":22}}
после перезагрузки страницы                                  → {"theme":"dark","size":"22px","info":"Хранилище: localStorage"}
первая вкладка после изменения во второй                     → {"theme":"light","size":"22px","info":"Хранилище: localStorage"}
данные версии 1 ({fontSize: 26}) после миграции              → {"theme":"dark","size":"26px","info":"Хранилище: localStorage"}
страница без доступа к localStorage (about:blank)            → {"theme":"dark","info":"Хранилище: память (localStorage недоступен)"}
ошибки страниц                                               → []`, { filename: "сценарий в Chromium 141 (Playwright)" }),
      p("Страница использует `createPersistentStore` из раздела «Задача»: тема и размер текста сохраняются через `localStorage` с задержкой 150 мс (debounce), переживают перезагрузку, синхронизируются между вкладками и мигрируют из версии 1 (`fontSize` → `size`). Если `localStorage` недоступен (песочница, приватный режим, запрет хранилища), `pickStorage` переключается на хранилище в памяти — приложение работает, просто ничего не запоминает; в окне предпросмотра ниже вы увидите именно этот режим."),
      warn("Не храните в `localStorage` токены доступа и персональные данные: любой скрипт на странице (в том числе из-за XSS) может их прочитать. Для сессий используйте `HttpOnly` cookie, недоступные JavaScript."),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const settings = JSON.parse(localStorage.getItem("settings") ?? "{}");
settings.theme = "dark";
localStorage.setItem("settings", JSON.stringify(settings));

addEventListener("storage", (event) => {
  if (event.key === "settings") applySettings(JSON.parse(event.newValue ?? "{}"));
});

const url = new URL("/search", location.origin);
url.searchParams.set("q", "кот & пёс");
history.pushState({ q: "кот & пёс" }, "", url);
addEventListener("popstate", (event) => render(event.state));

const timer = setTimeout(save, 300);
clearTimeout(timer);`,
        [
          { line: [1, 3], text: "Чтение с запасным значением (`?? \"{}\"`), изменение и запись через `JSON.stringify` — хранилище принимает только строки." },
          { line: [5, 7], text: "Событие `storage` приходит в **другие** вкладки; `newValue` равно `null` при удалении ключа." },
          { line: [9, 10], text: "`URL` и `searchParams.set` кодируют значение — склейка строк запрещена." },
          { line: 11, text: "`pushState(state, \"\", url)` добавляет запись истории, но `popstate` не вызывает." },
          { line: 12, text: "`popstate` приходит при `back`/`forward`/`go`; рисуем экран из `event.state`." },
          { line: [14, 15], text: "Отложенный вызов и его отмена: идентификатор нужен для `clearTimeout`." },
        ],
        "syntax.js",
      ),
    ]),

    section("minimal-example", [
      p("Не запуская код, запишите вывод каждой строки и объясните, почему `canParse` возвращает разные значения."),
      code("js", `const base = "https://example.com/docs/guide/index.html?v=1#intro";
const a = new URL("../api/?q=a b&q=c", base);

console.log(a.href);
console.log(a.searchParams.getAll("q"));
a.searchParams.set("q", "x&y");
console.log(a.search);
console.log(new URLSearchParams({ n: 1, list: [1, 2] }).toString());
console.log(URL.canParse("//cdn.example.com/x"), URL.canParse("//cdn.example.com/x", base));`, { filename: "x1-predict.mjs" }),
      code("text", `https://example.com/docs/api/?q=a%20b&q=c
[ 'a b', 'c' ]
?q=x%26y
n=1&list=1%2C2
false true`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "`../api/` от `/docs/guide/index.html` — `/docs/api/`; запрос из относительного адреса заменяет старый (`?v=1` пропал), хэш `#intro` не наследуется; пробел в `href` кодируется как `%20`.",
        "`getAll(\"q\")` — `[\"a b\", \"c\"]`: значения декодируются; `set` заменяет оба и кодирует `&` как `%26`.",
        "Массив `[1, 2]` превращается в строку `1,2` (`%2C`).",
        "`//cdn.example.com/x` — адрес «без схемы»: без базы разобрать нельзя (`false`), с базой берёт её схему (`true`).",
      ),
    ]),

    section("detailed-example", [
      p("`createPersistentStore({ key, version, defaults, migrate, storage, debounceMs, onError })` — компактное состояние приложения: безопасная загрузка (битые, чужие и «будущие» данные → значения по умолчанию), миграции по шагам, уведомление подписчиков только при реальных изменениях, запись с debounce, сброс на `pagehide`, синхронизация вкладок по событию `storage` без обратной записи и корректное уничтожение."),
      code("js", `// Небольшое состояние, которое переживает перезагрузку, мигрирует между версиями и синхронизируется между вкладками.
export function createPersistentStore({
  key,
  version = 1,
  defaults = {},
  migrate = {},                       // migrate[n](data) переводит данные версии n в версию n + 1
  storage = globalThis.localStorage,
  eventArea = storage,                // область, чьи события storage нас интересуют (если storage — обёртка)
  debounceMs = 50,
  onError,
} = {}) {
  const lifetime = new AbortController();
  const subscribers = new Set();
  let timer = null;
  let state = load(storage.getItem.bind(storage, key));

  function parse(raw) {
    if (raw == null) return null;
    try {
      const envelope = JSON.parse(raw);
      if (!envelope || typeof envelope !== "object" || !Number.isInteger(envelope.v) || envelope.v > version) return null;
      let data = envelope.data;
      for (let v = envelope.v; v < version; v++) data = migrate[v] ? migrate[v](data) : data;
      return data && typeof data === "object" ? { ...defaults, ...data } : null;
    } catch {
      return null;                    // битый JSON или упавшая миграция — не повод ронять приложение
    }
  }
  function load(read) {
    try { return parse(read()) ?? { ...defaults }; } catch (error) { onError?.(error); return { ...defaults }; }
  }

  function write() {
    timer = null;
    try { storage.setItem(key, JSON.stringify({ v: version, data: state })); } catch (error) { onError?.(error); } // квота, приватный режим
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(write, debounceMs);
  }
  function flush() {
    if (timer !== null) { clearTimeout(timer); write(); }
  }

  function replace(next) {
    const changed = Object.keys({ ...state, ...next }).some((k) => !Object.is(state[k], next[k]));
    if (!changed) return false;
    const prev = state;
    state = next;
    for (const fn of [...subscribers]) fn(state, prev);
    return true;
  }

  // Другая вкладка изменила то же хранилище: обновляем состояние, но не пишем обратно
  addEventListener("storage", (event) => {
    if (event.storageArea !== eventArea || (event.key !== key && event.key !== null)) return;
    if (event.key === null) return void replace({ ...defaults });          // clear()
    const incoming = parse(event.newValue);
    replace(incoming ?? { ...defaults });
  }, { signal: lifetime.signal });
  addEventListener("pagehide", flush, { signal: lifetime.signal });

  return {
    get: () => state,
    set(patch) {
      const next = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
      if (replace(next)) schedule();
    },
    subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
    flush,
    destroy() { flush(); lifetime.abort(); subscribers.clear(); },
  };
}`, { filename: "persistent-store.mjs", lineNumbers: true }),
      code("js", `import fs from "node:fs";
import { start } from "../_srv.mjs";

const src = fs.readFileSync(process.argv[2] ?? "persistent-store.mjs", "utf8").replace(/^export /m, "");
const t = await start();
const a = await t.context.newPage();
const b = await t.context.newPage();
for (const p of [a, b]) { await p.goto(t.origin + "/"); await p.evaluate(() => localStorage.clear()); await p.addScriptTag({ content: src + "\\nwindow.createPersistentStore = createPersistentStore;" }); }

const results = [];
const check = (name, ok, info = "") => { results.push(ok); console.log((ok ? "✓ " : "✗ ") + name + (info ? " — " + info : "")); };
const run = (page, fn, arg) => page.evaluate(fn, arg);

// Подготовка в странице: «хранилище-обёртка» со счётчиками
await a.evaluate(() => {
  window.counting = (inner = localStorage, failWith) => {
    const s = { writes: 0, getItem: (k) => inner.getItem(k), setItem(k, v) { if (failWith) throw failWith; s.writes++; inner.setItem(k, v); }, removeItem: (k) => inner.removeItem(k) };
    return s;
  };
  window.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
});

// 1–2. defaults и слияние
let r = await run(a, () => {
  localStorage.clear();
  const s1 = createPersistentStore({ key: "app", defaults: { theme: "light", size: 14 } });
  const first = { ...s1.get() };
  s1.destroy();
  localStorage.setItem("app", JSON.stringify({ v: 1, data: { theme: "dark" } }));
  const s2 = createPersistentStore({ key: "app", defaults: { theme: "light", size: 14 } });
  const merged = { ...s2.get() }; s2.destroy();
  return { first, merged };
});
check("пустое хранилище → значения по умолчанию", JSON.stringify(r.first) === '{"theme":"light","size":14}');
check("сохранённые данные сливаются с defaults (новые поля получают значения)", JSON.stringify(r.merged) === '{"theme":"dark","size":14}', JSON.stringify(r.merged));

// 3. Битые данные
r = await run(a, () => {
  const out = [];
  for (const raw of ["{плохо", "null", "42", '{"v":"x","data":{}}', '{"v":1,"data":null}', '{"v":1}']) {
    localStorage.setItem("app", raw);
    try { const s = createPersistentStore({ key: "app", defaults: { n: 0 } }); out.push(JSON.stringify(s.get())); s.destroy(); } catch (e) { out.push("исключение " + e.name); }
  }
  return out;
});
check("битые и неожиданные данные → defaults, без исключений", r.every((x) => x === '{"n":0}'), r.join(" "));

// 4–5. Миграции и «данные из будущего»
r = await run(a, () => {
  localStorage.setItem("app", JSON.stringify({ v: 1, data: { name: "Анна" } }));
  const migrate = { 1: (d) => ({ ...d, fullName: d.name, name: undefined }), 2: (d) => ({ ...d, lang: "ru" }) };
  const s = createPersistentStore({ key: "app", version: 3, defaults: { fullName: "", lang: "en" }, migrate });
  const migrated = JSON.stringify({ fullName: s.get().fullName, lang: s.get().lang }); s.destroy();
  localStorage.setItem("app", JSON.stringify({ v: 9, data: { fullName: "из будущего" } }));
  const f = createPersistentStore({ key: "app", version: 3, defaults: { fullName: "", lang: "en" }, migrate });
  const future = f.get().fullName; f.destroy();
  localStorage.setItem("app", JSON.stringify({ v: 1, data: { name: "x" } }));
  const g = createPersistentStore({ key: "app", version: 2, defaults: { ok: true }, migrate: { 1: () => { throw new Error("сбой миграции"); } } });
  const failing = JSON.stringify(g.get()); g.destroy();
  return { migrated, future, failing };
});
check("миграция v1 → v2 → v3 по шагам", r.migrated === '{"fullName":"Анна","lang":"ru"}', r.migrated);
check("данные более новой версии игнорируются (defaults)", r.future === "", JSON.stringify(r.future));
check("упавшая миграция не роняет загрузку", r.failing === '{"ok":true}', r.failing);

// 6. set, подписчики, отсутствие лишних уведомлений, функция-патч
r = await run(a, () => {
  localStorage.clear();
  const s = createPersistentStore({ key: "c", defaults: { count: 0, tag: "a" }, storage: counting() });
  const calls = [];
  const off = s.subscribe((next, prev) => calls.push([prev.count, next.count]));
  s.set({ count: 1 }); s.set({ count: 1 }); s.set((st) => ({ count: st.count + 1 }));
  off(); s.set({ count: 99 });
  const res = { calls, final: s.get().count }; s.destroy(); return res;
});
check("подписчики: уведомление только при изменении, патч-функция, отписка", JSON.stringify(r.calls) === "[[0,1],[1,2]]" && r.final === 99, JSON.stringify(r));

// 7. Debounce и flush
r = await run(a, async () => {
  localStorage.clear();
  const st = counting();
  const s = createPersistentStore({ key: "d", defaults: { n: 0 }, storage: st, debounceMs: 40 });
  for (let i = 1; i <= 5; i++) s.set({ n: i });
  const immediately = st.writes;
  await sleep(120);
  const afterDebounce = st.writes;
  s.set({ n: 6 }); s.flush();
  const afterFlush = st.writes;
  await sleep(80);
  const saved = JSON.parse(localStorage.getItem("d")).data.n;
  s.destroy();
  return { immediately, afterDebounce, afterFlush, afterTimer: st.writes, saved };
});
check("debounce: 5 быстрых set → одна запись; flush пишет сразу и отменяет таймер", r.immediately === 0 && r.afterDebounce === 1 && r.afterFlush === 2 && r.afterTimer === 2 && r.saved === 6, JSON.stringify(r));

// 8. Ошибка записи (квота)
r = await run(a, async () => {
  const errors = [];
  const quota = new DOMException("полон", "QuotaExceededError");
  const s = createPersistentStore({ key: "q", defaults: { n: 0 }, storage: counting(localStorage, quota), debounceMs: 10, onError: (e) => errors.push(e.name) });
  let thrown = null;
  try { s.set({ n: 1 }); await sleep(60); } catch (e) { thrown = e.name; }
  const res = { thrown, errors, n: s.get().n }; s.destroy(); return res;
});
check("QuotaExceededError: onError вызван, исключения нет, состояние в памяти обновлено", r.thrown === null && r.errors.join() === "QuotaExceededError" && r.n === 1, JSON.stringify(r));

// 9–10. Синхронизация вкладок
await a.evaluate(() => { localStorage.clear(); window.st = counting(); window.sync = createPersistentStore({ key: "sync", defaults: { theme: "light" }, storage: st, eventArea: localStorage, debounceMs: 10 }); window.seen = []; sync.subscribe((n, p) => seen.push(p.theme + "→" + n.theme)); });
await b.evaluate(() => localStorage.setItem("sync", JSON.stringify({ v: 1, data: { theme: "dark" } })));
await a.waitForFunction(() => seen.length === 1);
r = await a.evaluate(async () => { await sleep(80); return { theme: sync.get().theme, seen: [...seen], writes: st.writes }; });
check("изменение в другой вкладке доходит до подписчиков, обратной записи нет", r.theme === "dark" && r.seen.join() === "light→dark" && r.writes === 0, JSON.stringify(r));
await b.evaluate(() => localStorage.setItem("sync", "{мусор"));
await a.evaluate(() => sleep(60));
await b.evaluate(() => localStorage.setItem("sync", JSON.stringify({ v: 1, data: { theme: "blue" } })));
await a.waitForFunction(() => seen.length >= 2);
r = await a.evaluate(() => ({ theme: sync.get().theme, seen: [...seen] }));
check("мусор из другой вкладки не ломает состояние (возврат к defaults, затем новое значение)", r.theme === "blue" && r.seen.join() === "light→dark,dark→light,light→blue", JSON.stringify(r));
await b.evaluate(() => localStorage.clear());
const cleared = await a.waitForFunction(() => sync.get().theme === "light", null, { timeout: 3000 }).then(() => true, () => false);
check("clear() в другой вкладке (key === null) → defaults", cleared);

// 11. destroy и pagehide
r = await a.evaluate(async () => {
  sync.destroy();
  localStorage.clear();
  const s = createPersistentStore({ key: "z", defaults: { n: 0 }, storage: counting(), debounceMs: 500 });
  s.set({ n: 5 });
  s.destroy();                                      // отложенная запись выполняется при destroy
  const saved = JSON.parse(localStorage.getItem("z") ?? "null")?.data.n;
  const p = createPersistentStore({ key: "p", defaults: { n: 0 }, debounceMs: 500 });
  p.set({ n: 8 });
  const before = localStorage.getItem("p");
  dispatchEvent(new Event("pagehide"));             // уход со страницы: сохранить немедленно
  const afterHide = JSON.parse(localStorage.getItem("p") ?? "null")?.data.n;
  p.destroy();
  window.s3 = createPersistentStore({ key: "z3", defaults: { n: 0 }, storage: counting(), eventArea: localStorage });
  s3.destroy();
  return { saved, before, afterHide };
});
await b.evaluate(() => localStorage.setItem("z3", JSON.stringify({ v: 1, data: { n: 77 } })));
await a.evaluate(() => sleep(80));
const stale = await a.evaluate(() => s3.get().n);
check("destroy(): отложенная запись сохранена", r.saved === 5, JSON.stringify(r.saved));
check("pagehide: незаписанное состояние сохраняется немедленно", r.before === null && r.afterHide === 8, JSON.stringify(r));
check("после destroy() события storage из других вкладок не меняют состояние", stale === 0, String(stale));

const failed = results.filter((x) => !x).length;
console.log(failed ? \`\\nПровалено: \${failed}\` : \`\\nВсе проверки пройдены: \${results.length}/\${results.length}\`);
await t.close();
process.exit(failed ? 1 : 0);`, { filename: "persistent-store-test.mjs", collapsed: true }),
      code("text", `✓ пустое хранилище → значения по умолчанию
✓ сохранённые данные сливаются с defaults (новые поля получают значения) — {"theme":"dark","size":14}
✓ битые и неожиданные данные → defaults, без исключений — {"n":0} {"n":0} {"n":0} {"n":0} {"n":0} {"n":0}
✓ миграция v1 → v2 → v3 по шагам — {"fullName":"Анна","lang":"ru"}
✓ данные более новой версии игнорируются (defaults) — ""
✓ упавшая миграция не роняет загрузку — {"ok":true}
✓ подписчики: уведомление только при изменении, патч-функция, отписка — {"calls":[[0,1],[1,2]],"final":99}
✓ debounce: 5 быстрых set → одна запись; flush пишет сразу и отменяет таймер — {"immediately":0,"afterDebounce":1,"afterFlush":2,"afterTimer":2,"saved":6}
✓ QuotaExceededError: onError вызван, исключения нет, состояние в памяти обновлено — {"thrown":null,"errors":["QuotaExceededError"],"n":1}
✓ изменение в другой вкладке доходит до подписчиков, обратной записи нет — {"theme":"dark","seen":["light→dark"],"writes":0}
✓ мусор из другой вкладки не ломает состояние (возврат к defaults, затем новое значение) — {"theme":"blue","seen":["light→dark","dark→light","light→blue"]}
✓ clear() в другой вкладке (key === null) → defaults
✓ destroy(): отложенная запись сохранена — 5
✓ pagehide: незаписанное состояние сохраняется немедленно — {"saved":5,"before":null,"afterHide":8}
✓ после destroy() события storage из других вкладок не меняют состояние — 0

Все проверки пройдены: 15/15`, { filename: "результат запуска (Chromium 141: две вкладки одного контекста)" }),
    ]),

    section("analysis", [
      table(
        ["Решение в `createPersistentStore`", "Что даёт", "Что сломается без него (проверено мутацией теста)"],
        [
          ["`parse()` в `try/catch`, проверка формы данных и версии", "Битый JSON, `null`, число, чужая структура → `defaults`", "Исключение при загрузке роняет приложение у части пользователей"],
          ["`{ ...defaults, ...data }`", "Новые поля получают значения по умолчанию", "После обновления приложения у старых данных нет новых полей — тест слияния падает"],
          ["Цепочка `migrate[v]` и отказ от `v > version`", "Старые данные переносятся, «будущие» не портят состояние", "Без миграции остаётся `fullName: \"\"`; без проверки версии читаются данные новой схемы"],
          ["`replace()` сравнивает по ключам через `Object.is`", "Подписчики вызываются только при изменении", "Лишние перерисовки и лишние записи"],
          ["`clearTimeout` перед `setTimeout` (debounce)", "Серия `set` → одна запись", "Пять `set` дают пять записей"],
          ["`try/catch` вокруг `setItem` + `onError`", "Квота и приватный режим не ломают приложение", "`QuotaExceededError` вылетает из `setTimeout` в консоль, состояние теряется"],
          ["Обработчик `storage` не вызывает `schedule()`", "Нет «пинг-понга» между вкладками", "Каждая вкладка перезаписывает хранилище в ответ на чужую запись — бесконечный обмен"],
          ["`{ signal: lifetime.signal }` у слушателей и `flush()` в `destroy()`", "Утечек нет, отложенная запись не теряется", "После `destroy()` состояние продолжает меняться от чужих вкладок; недописанное теряется"],
          ["`pagehide` → `flush`", "Состояние сохраняется при закрытии вкладки раньше, чем сработает debounce", "Последние изменения за последние 50 мс теряются"],
        ],
        "Разбор createPersistentStore",
      ),
      ul(
        "**Источник правды в памяти,** хранилище — отражение: чтение один раз при создании, дальше только записи и события.",
        "**Версия — часть формата:** конверт `{ v, data }` позволяет менять схему, не ломая старых пользователей.",
        "**Хранилище внедряется** (`storage`, `eventArea`): тесты подставляют заглушку со счётчиком записей и ошибкой квоты.",
        "**Ограничения:** `localStorage` не транзакционен — при одновременной записи из двух вкладок побеждает последняя; для критичных данных нужны IndexedDB и серверная сверка.",
      ),
    ]),

    section("internals", [
      h("Что происходит при `localStorage.setItem`"),
      p("Запись проверяется на лимит (при превышении — `QuotaExceededError`, прежнее значение остаётся), затем изменение становится видимым всем документам того же origin, а им отправляется событие `storage`. Изменение, не меняющее значение, событий не порождает (замер). Событие получают только другие документы: `storageArea` указывает на область, `url` — адрес страницы, внёсшей изменение. Сами операции синхронны и блокируют главный поток."),
      h("Жизненный цикл транзакции IndexedDB"),
      steps(
        [
          ["Создание", "`db.transaction(stores, mode)` создаёт транзакцию в активном состоянии; запросы к хранилищам ставятся в её очередь."],
          ["Активность", "Транзакция активна только в тех колбэках, которые вызываются в ответ на её запросы (и синхронно сразу после создания)."],
          ["Автозавершение", "Когда очередь запросов пуста и нового запроса не поставлено, транзакция фиксируется (`complete`)."],
          ["Закрытие", "Любое постороннее асинхронное ожидание (`await fetch`, `setTimeout`) пропускает момент активности — следующий запрос бросит `TransactionInactiveError` (замер)."],
          ["Откат", "Ошибка запроса без `preventDefault()` или `tx.abort()` откатывает все изменения транзакции (замер: запись `id=100` после `ConstraintError` отсутствует)."],
        ],
        "Транзакция IndexedDB",
      ),
      h("Как `URL` разбирает адрес"),
      p("Алгоритм из WHATWG URL Standard: удаляет ведущие и конечные управляющие символы и пробелы, табуляции и переводы строк внутри адреса, разбирает схему, авторитет (userinfo, хост, порт), путь (нормализует `.` и `..`), запрос и фрагмент; хост переводится в punycode, порт по умолчанию отбрасывается. Именно поэтому `\" \\tjavascript:…\"` — валидный адрес со схемой `javascript:`, а проверка `startsWith` — ненадёжна. `searchParams` — «живое» представление: изменение через него перезаписывает `url.search`."),
      h("Как работает история"),
      p("Сеансовая история — список записей: адрес, `state` и служебные данные. `pushState` усекает «будущие» записи после текущей, добавляет новую и обновляет адрес без загрузки документа; `popstate` порождается только при **переходе** между записями (в том числе при `hash`-навигации). Документ при этом остаётся тем же, поэтому состояние приложения в памяти не сбрасывается."),
      h("Как исполняются таймеры"),
      p("Таймер — запись «выполнить не раньше времени T». Когда цикл событий свободен и время пришло, колбэк ставится в очередь макрозадач (порядок: по времени, при равенстве — по созданию). Поэтому реальная задержка = задержка + ожидание свободного потока (замер: после блокировки на 150 мс интервал не «догоняет»). Вложенные таймеры в браузерах получают минимальную задержку ≈ 4 мс, а скрытые вкладки — ещё больше (подробно — в теме [цикл событий](/learn/js/event-loop))."),
    ]),

    section("mistakes", [
      h("Ошибка 1. `setItem` с объектом без `JSON.stringify`"),
      wrongRight(
        "js",
        {
          code: `
            localStorage.setItem("prefs", { theme: "dark" });     // сохранится "[object Object]"
            const prefs = JSON.parse(localStorage.getItem("prefs")); // SyntaxError
          `,
          note: "Замер: в хранилище лежит `[object Object]`, `JSON.parse` падает; при первом запуске `getItem` вернёт `null`, и `.theme` бросит `TypeError`.",
        },
        {
          code: `
            localStorage.setItem("prefs", JSON.stringify({ theme: "dark" }));
            function loadPrefs(defaults) {
              try {
                const parsed = JSON.parse(localStorage.getItem("prefs"));
                return parsed && typeof parsed === "object" ? { ...defaults, ...parsed } : { ...defaults };
              } catch {
                return { ...defaults };
              }
            }
          `,
          note: "Сериализация явная; чтение защищено; результат всегда с полями по умолчанию.",
        },
      ),
      h("Ошибка 2. Запись без `try/catch`"),
      p("`setItem` может бросить `QuotaExceededError` (лимит) и `SecurityError` (доступ запрещён). Необработанное исключение ломает сценарий — оборачивайте запись и сообщайте пользователю или переходите на хранилище в памяти."),
      h("Ошибка 3. Ждать `storage` в той же вкладке"),
      p("Событие приходит в **другие** вкладки (замер: вкладка A получила `[]`). Для реакции в своей вкладке вызывайте код напрямую после записи."),
      h("Ошибка 4. Склеивать адрес строкой"),
      p("`\"/search?q=\" + input` пропускает `&admin=1` как отдельный параметр (замер: `admin === \"1\"`). Используйте `url.searchParams.set` или `encodeURIComponent` для значения."),
      h("Ошибка 5. Проверять ссылку через `startsWith(\"http\")`"),
      p("Ведущие пробелы и табуляции обходят строковую проверку (`\" \\tjavascript:…\"`). Разбирайте через `new URL(value, base)` и сверяйте `protocol` со списком разрешённых."),
      h("Ошибка 6. Ждать `popstate` после `pushState`"),
      p("`pushState` событий не вызывает (замер). Рисуйте новое состояние сами, а `popstate` используйте для кнопок «Назад»/«Вперёд»."),
      h("Ошибка 7. Долгое ожидание внутри транзакции IndexedDB"),
      p("`await fetch(...)` или `setTimeout` внутри транзакции — `TransactionInactiveError`. Получите данные заранее, затем откройте транзакцию и выполните запросы подряд."),
      h("Ошибка 8. `setInterval` для асинхронной работы"),
      p("Интервал не ждёт завершения `async`-колбэка: запросы перекрываются (замер: `maxConcurrent >= 2`). Используйте цикл «работа → пауза» (`await` + `setTimeout`)."),
      h("Ошибка 9. Забытые таймеры и интервалы"),
      p("Необходимо отменять `setInterval` и `setTimeout` при уходе со страницы или удалении компонента; в Node.js — `unref()` для фоновых таймеров, иначе процесс не завершится."),
      h("Ошибка 10. Секреты в `localStorage`"),
      p("Хранилище доступно любому скрипту страницы. Токены сессии — в `HttpOnly` cookie; в `localStorage` — только то, что не страшно показать."),
    ]),

    section("antipatterns", [
      ul(
        "**`localStorage` как база данных:** большие объёмы, частые записи, структуры со связями — для этого IndexedDB или сервер.",
        "**Синхронная запись в `localStorage` на каждое нажатие клавиши** вместо debounce.",
        "**Данные без версии схемы:** после релиза у старых пользователей — `undefined`-поля и падения.",
        "**Хранение производного состояния** (то, что можно вычислить из адреса или данных) — рассинхронизация источников правды.",
        "**«Прыгающая» история:** `pushState` на каждое нажатие клавиши в поиске — «Назад» превращается в пытку (здесь нужен `replaceState`).",
        "**`setTimeout(fn, 0)` как «подожди готовности DOM»:** вместо событий и промисов.",
        "**Ручные парсеры адресов регулярными выражениями** вместо `URL`.",
        "**Использование `document.cookie` для данных интерфейса:** cookie уходят на сервер с каждым запросом.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Оборачивайте чтение и запись хранилища** в `try/catch`; имейте запасной вариант (память).",
        "**Конверт `{ v, data }` и миграции:** версия схемы — с первого релиза.",
        "**Debounce записи** и сброс на `pagehide`/`visibilitychange`; большие данные — в IndexedDB.",
        "**Синхронизация вкладок:** слушайте `storage`, не пишите обратно, разбирайте `null` (удаление) и `key === null` (`clear`).",
        "**Собирайте адреса через `URL`/`URLSearchParams`;** проверяйте схему пользовательских ссылок по списку.",
        "**Состояние, которое должно переживать ссылку, — в адресе;** `pushState` — на осмысленные шаги, `replaceState` — на уточнения.",
        "**Отменяйте таймеры** при уничтожении компонента (`AbortSignal`, `clearTimeout`); для опроса — цикл с `await`, а не `setInterval`.",
        "**Для анимаций — `requestAnimationFrame`,** для фоновой работы — `requestIdleCallback`/`scheduler.postTask`, а не короткие `setTimeout`.",
      ),
      tip("Откройте DevTools → Application: там видны `localStorage`, `sessionStorage`, IndexedDB и cookie выбранного origin, можно редактировать значения и очищать данные — удобно воспроизводить миграции и «битые» данные."),
    ]),

    section("edge-cases", [
      h("Приватные окна и запрет данных сайтов"),
      p("В некоторых режимах `localStorage` недоступен (обращение к `window.localStorage` бросает `SecurityError`) или очищается при закрытии. Сам доступ к свойству — внутри `try/catch`, как в `pickStorage`. В iframe с `sandbox` без `allow-same-origin` хранилище недоступно (в окне предпросмотра примеров так и есть)."),
      h("Одновременная запись из двух вкладок"),
      p("Транзакций нет: последняя запись побеждает. Для счётчиков и списков используйте IndexedDB (транзакции) или Web Locks API, либо делайте записи идемпотентными и сливайте состояние при `storage`."),
      h("Событие `storage` и `sessionStorage`"),
      p("У `sessionStorage` у каждой вкладки своя копия, поэтому изменения одной вкладки другим вкладкам не видны и события `storage` для синхронизации вкладок не вызывают (замер: вкладка B ничего не получила). Для обмена между вкладками используйте `localStorage`, `BroadcastChannel` или Service Worker."),
      h("Относительные адреса и `<base>`"),
      p("Базовый адрес документа (`document.baseURI`) может отличаться от `location.href` из-за элемента `<base>`: `new URL(href, document.baseURI)` соответствует тому, как браузер разрешает ссылки. В `about:blank` и `about:srcdoc` базовый адрес не годится для разрешения путей — `new URL(\"/x\", document.baseURI)` бросает `TypeError`."),
      h("Часовые пояса и `Date` в хранилище"),
      p("Даты сохраняйте в `ISO 8601` (UTC, `toISOString()`) или числом миллисекунд; `JSON.stringify(new Date())` даёт ISO-строку, но `JSON.parse` вернёт строку — преобразование обратно в `Date` на вас."),
      h("Скрытые вкладки и таймеры"),
      p("Фоновые вкладки ограничивают таймеры (редкие срабатывания, «усыпление» цепочек), а `requestAnimationFrame` на них не вызывается. Для часов, будильников и опросов считайте время по `Date.now()`/`performance.now()` от момента начала, а не суммой тиков."),
      h("`history.length` и пустые записи"),
      p("Значение `history.length` включает все записи сеанса вкладки, в том числе до вашего сайта; не используйте его как счётчик «своих» переходов (в замере считается разность с исходной длиной)."),
    ]),

    section("related", [
      ul(
        "[Цикл событий](/learn/js/event-loop) — очереди задач, ограничение вложенных таймеров, блокировка потока.",
        "[DOM и события](/learn/js/dom-events) — события `storage` и `popstate`, подписка и снятие слушателей.",
        "[Формы, FormData и fetch](/learn/js/forms-fetch) — `URLSearchParams` как тело запроса, `Content-Type`, CORS и cookie.",
        "[Web Storage в HTML](/learn/html/web-storage) — элементарные сведения о хранилищах и безопасности.",
        "[Безопасность HTML](/learn/html/html-security) — XSS и защита данных на странице.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Сохранение без защиты, склейка адреса и интервал для запросов",
          code: `
            const prefs = JSON.parse(localStorage.getItem("prefs"));            // null → TypeError ниже
            prefs.theme = document.querySelector("#theme").value;
            localStorage.setItem("prefs", prefs);                               // "[object Object]"
            location.href = "/search?q=" + input.value;                         // инъекция параметров
            setInterval(async () => { await refreshFeed(); }, 1000);            // запросы перекрываются
          `,
          note: "Падение при первом запуске, потеря данных при сохранении, лишние параметры в адресе, накопление параллельных запросов.",
        },
        {
          title: "Защищённое чтение, JSON, URL и цикл с паузой",
          code: `
            const prefs = loadPrefs({ theme: "light" });                        // try/catch + defaults
            localStorage.setItem("prefs", JSON.stringify({ ...prefs, theme: select.value }));
            const url = new URL("/search", location.origin);
            url.searchParams.set("q", input.value);
            location.assign(url);

            const stop = new AbortController();
            (async function poll() {
              while (!stop.signal.aborted) {
                await refreshFeed({ signal: stop.signal }).catch(() => {});
                await new Promise((r) => setTimeout(r, 1000));
              }
            })();
          `,
          note: "Данные сериализуются явно, адрес собран безопасно, запросы не перекрываются и отменяются сигналом.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.storage-url-timers.ex1",
      title: "Разбор адреса в уме",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код (раздел «Минимальный пример»), запишите вывод каждой строки и объясните три момента: что случилось с `?v=1` и `#intro`, как кодируется пробел и что делает `set`, почему `canParse` вернул разные значения."),
        code("js", `const base = "https://example.com/docs/guide/index.html?v=1#intro";
const a = new URL("../api/?q=a b&q=c", base);

console.log(a.href);
console.log(a.searchParams.getAll("q"));
a.searchParams.set("q", "x&y");
console.log(a.search);
console.log(new URLSearchParams({ n: 1, list: [1, 2] }).toString());
console.log(URL.canParse("//cdn.example.com/x"), URL.canParse("//cdn.example.com/x", base));`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Что заменяет относительный адрес, начинающийся с `../`?", "Какой символ кодирует пробел в `href`, а какой в `search` после `set`?"],
      checks: ["Верный `href` (`/docs/api/?q=a%20b&q=c`)", "`getAll` вернул массив из двух значений", "Объяснён `//cdn.example.com/x` без базы"],
      solution: [
        code("text", `https://example.com/docs/api/?q=a%20b&q=c
[ 'a b', 'c' ]
?q=x%26y
n=1&list=1%2C2
false true`, { filename: "вывод Node.js 22.22.0" }),
        p("Относительный адрес заменяет путь, запрос и хэш: `?v=1` и `#intro` пропали. Пробел в исходной строке кодируется в `%20`; `getAll` возвращает декодированные значения; `set` заменяет оба значения одним и кодирует `&` как `%26`. Адрес `//cdn.example.com/x` без схемы разрешается только относительно базового адреса, поэтому без базы `canParse` даёт `false`."),
      ],
    }),
    exercise({
      id: "js.storage-url-timers.ex2",
      title: "Настройки падают у новых пользователей и «пропадают» у старых",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Из-за функций `savePrefs`/`loadPrefs` у новых пользователей приложение падает при запуске, а у остальных настройки не загружаются. Найдите все ошибки по замеру, исправьте и объясните, почему оба симптома связаны с типами хранилища."),
        code("js", `// Минимальная имитация Storage (в Node его нет): хранит строки, как localStorage
const data = new Map();
const storage = {
  getItem: (k) => (data.has(k) ? data.get(k) : null),
  setItem: (k, v) => void data.set(k, String(v)),
};

// Исходный код
function savePrefs(prefs) { storage.setItem("prefs", prefs); }
function loadPrefs() { return JSON.parse(storage.getItem("prefs")); }

const attempt = (label, fn) => { try { console.log(label, "→", fn()); } catch (e) { console.log(label, "→", e.name + ":", e.message); } };

attempt("первый запуск: loadPrefs().theme", () => loadPrefs().theme);
savePrefs({ theme: "dark" });
console.log("в хранилище лежит:", storage.getItem("prefs"));
attempt("после savePrefs: loadPrefs()", () => loadPrefs());
storage.setItem("prefs", undefined);
attempt("значение undefined: loadPrefs()", () => loadPrefs());

// Исправленный вариант
function save(prefs) { storage.setItem("prefs", JSON.stringify(prefs)); }
function load(defaults) {
  try {
    const parsed = JSON.parse(storage.getItem("prefs"));
    return parsed && typeof parsed === "object" ? { ...defaults, ...parsed } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}
console.log("— исправленный вариант —");
console.log("пусто или битое:", load({ theme: "light" }));
save({ theme: "dark" });
console.log("после save:", load({ theme: "light", size: 16 }));`, { filename: "x2-prefs.mjs", collapsed: true }),
      ],
      hints: ["Что вернёт `getItem` у ключа, которого нет?", "Что лежит в хранилище после `setItem(\"prefs\", { theme: \"dark\" })`?"],
      checks: ["Названы `null` при первом запуске", "Названо `[object Object]`", "Исправления: `JSON.stringify`, `try/catch`, слияние с `defaults`"],
      solution: [
        code("text", `первый запуск: loadPrefs().theme → TypeError: Cannot read properties of null (reading 'theme')
в хранилище лежит: [object Object]
после savePrefs: loadPrefs() → SyntaxError: "[object Object]" is not valid JSON
значение undefined: loadPrefs() → SyntaxError: "undefined" is not valid JSON
— исправленный вариант —
пусто или битое: { theme: 'light' }
после save: { theme: 'dark', size: 16 }`, { filename: "вывод Node.js 22.22.0 (имитация Storage)" }),
        p("Первая ошибка: при первом запуске `getItem` возвращает `null`, `JSON.parse(null)` даёт `null`, и обращение к `.theme` падает `TypeError`. Вторая: `setItem` приводит объект к строке `[object Object]`, а `JSON.parse` её не принимает (`SyntaxError`); то же для значения `undefined` (строка `\"undefined\"`). Исправление: сериализовать `JSON.stringify`, читать в `try/catch`, проверять тип результата и сливать с `defaults`."),
      ],
    }),
    exercise({
      id: "js.storage-url-timers.ex3",
      title: "Транзакция закрылась посреди записи",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Функция сохранения заказа открывает транзакцию IndexedDB, затем делает `await fetch(\"/api/price\")` и пытается записать вторую запись — получает `TransactionInactiveError`. Объясните причину по замеру из раздела про IndexedDB и перепишите последовательность шагов так, чтобы запись была атомарной."),
      ],
      hints: ["Когда транзакция остаётся активной?", "Что можно сделать до `db.transaction(...)`?"],
      checks: ["Названа причина (автозавершение транзакции при постороннем `await`)", "Данные подготовлены до открытия транзакции", "Обе записи — в одной транзакции и дожидаются `complete`"],
      solution: [
        code("text", `onupgradeneeded: старая версия                  → 0
версия, хранилища                               → [1,["items"]]
get(1): Date и Set сохранились как есть         → [true,true]
getAll()                                        → ["ручка","тетрадь","линейка"]
индекс byPrice, диапазон 10…15                  → ["ручка","линейка"]
count()                                         → 3
add() с занятым ключом                          → "ConstraintError"
put({ fn() {} })                                → "DataCloneError"
put после await setTimeout внутри транзакции    → "TransactionInactiveError"
запись из подготовленных данных, всего записей  → 5
миграция: старая версия                         → 1
версия, хранилища после миграции                → [2,["items","settings"]]
данные после миграции на месте                  → 5
транзакция с ошибкой в запросе                  → "ConstraintError"
запись id=100 после отката                      → "нет"`, { filename: "замер в Chromium 141 (смотрите строки про TransactionInactiveError и «запись из подготовленных данных»)" }),
        code("js", `async function saveOrder(db, order) {
  const price = await (await fetch("/api/price")).json();      // 1. всё внешнее — ДО транзакции
  const tx = db.transaction(["orders", "audit"], "readwrite"); // 2. транзакция
  tx.objectStore("orders").put({ ...order, price });
  tx.objectStore("audit").put({ id: order.id, at: Date.now() });
  await new Promise((resolve, reject) => {                      // 3. ждём complete, а не последнего запроса
    tx.oncomplete = resolve;
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}`, { filename: "saveOrder.js" }),
        p("Транзакция остаётся активной, пока в очереди есть запросы; чужое `await` (сеть, таймер) пропускает этот момент, и следующий запрос бросает `TransactionInactiveError`. Поэтому данные подготавливают заранее, а запросы внутри транзакции ставят подряд; обе записи фиксируются атомарно по `complete` (при ошибке откатываются обе)."),
      ],
    }),
  ],

  challenge: {
    id: "js.storage-url-timers.challenge",
    title: "createPersistentStore: состояние, которое помнит и синхронизируется",
    scenario: [
      p("В приложении настройки живут в трёх местах: `localStorage` с ручным `JSON.parse`, глобальная переменная и поля формы. После релиза у части пользователей приложение падает на старых данных, а вкладки перезаписывают настройки друг друга. Напишите `createPersistentStore`, который решит все эти проблемы в одном месте."),
    ],
    requirements: [
      "`createPersistentStore({ key, version = 1, defaults, migrate, storage, eventArea, debounceMs, onError })` возвращает `{ get, set, subscribe, flush, destroy }`",
      "Загрузка: значение хранится в конверте `{ v, data }`; пустое хранилище, битый JSON, не-объект, неверный конверт и версия **новее** кода дают `defaults`; результат — `{ ...defaults, ...data }`",
      "Миграции: `migrate[n](data)` переводит данные версии `n` в `n + 1`; шаги выполняются последовательно; упавшая миграция не бросает исключение (результат — `defaults`)",
      "`set(patch | (state) => patch)` — неглубокое слияние; подписчики `(state, prev)` вызываются синхронно и только если значения изменились (`Object.is`); `subscribe` возвращает функцию отписки",
      "Запись откладывается на `debounceMs` (серия `set` — одна запись); `flush()` пишет сразу и отменяет таймер; запись также выполняется при `pagehide` и `destroy()`",
      "Ошибки записи (`QuotaExceededError`, `SecurityError`) не бросаются наружу: вызывается `onError`, состояние в памяти остаётся актуальным",
      "Событие `storage` из другой вкладки (нужный ключ и область, `newValue` или `key === null`) обновляет состояние и уведомляет подписчиков **без** обратной записи; мусор в `newValue` возвращает `defaults`",
      "`destroy()` сохраняет отложенную запись, снимает слушатели и подписчиков",
    ],
    constraints: [
      "Без внешних библиотек; хранилище внедряется параметрами (`storage`, `eventArea`), по умолчанию — `localStorage`",
      "Не использовать глобальное состояние: каждый вызов независим",
    ],
    acceptance: [
      "Все 15 проверок теста проходят в Chromium 141 (3 запуска подряд)",
      "Мутации — отсутствие `try/catch` вокруг `setItem`, обратная запись из `storage`, потеря `clearTimeout`, пропущенные миграции, чтение данных «из будущего», снятие слушателя без `signal`, потеря `pagehide` — обнаруживаются тестом",
    ],
    hints: [
      "Что хранить в `localStorage`, чтобы потом можно было менять формат данных?",
      "Что произойдёт, если обработчик `storage` вызовет ту же функцию записи, что и `set`?",
      "Как гарантировать, что отложенная запись не потеряется при уходе со страницы?",
    ],
    solution: [
      code("js", `// Небольшое состояние, которое переживает перезагрузку, мигрирует между версиями и синхронизируется между вкладками.
export function createPersistentStore({
  key,
  version = 1,
  defaults = {},
  migrate = {},                       // migrate[n](data) переводит данные версии n в версию n + 1
  storage = globalThis.localStorage,
  eventArea = storage,                // область, чьи события storage нас интересуют (если storage — обёртка)
  debounceMs = 50,
  onError,
} = {}) {
  const lifetime = new AbortController();
  const subscribers = new Set();
  let timer = null;
  let state = load(storage.getItem.bind(storage, key));

  function parse(raw) {
    if (raw == null) return null;
    try {
      const envelope = JSON.parse(raw);
      if (!envelope || typeof envelope !== "object" || !Number.isInteger(envelope.v) || envelope.v > version) return null;
      let data = envelope.data;
      for (let v = envelope.v; v < version; v++) data = migrate[v] ? migrate[v](data) : data;
      return data && typeof data === "object" ? { ...defaults, ...data } : null;
    } catch {
      return null;                    // битый JSON или упавшая миграция — не повод ронять приложение
    }
  }
  function load(read) {
    try { return parse(read()) ?? { ...defaults }; } catch (error) { onError?.(error); return { ...defaults }; }
  }

  function write() {
    timer = null;
    try { storage.setItem(key, JSON.stringify({ v: version, data: state })); } catch (error) { onError?.(error); } // квота, приватный режим
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(write, debounceMs);
  }
  function flush() {
    if (timer !== null) { clearTimeout(timer); write(); }
  }

  function replace(next) {
    const changed = Object.keys({ ...state, ...next }).some((k) => !Object.is(state[k], next[k]));
    if (!changed) return false;
    const prev = state;
    state = next;
    for (const fn of [...subscribers]) fn(state, prev);
    return true;
  }

  // Другая вкладка изменила то же хранилище: обновляем состояние, но не пишем обратно
  addEventListener("storage", (event) => {
    if (event.storageArea !== eventArea || (event.key !== key && event.key !== null)) return;
    if (event.key === null) return void replace({ ...defaults });          // clear()
    const incoming = parse(event.newValue);
    replace(incoming ?? { ...defaults });
  }, { signal: lifetime.signal });
  addEventListener("pagehide", flush, { signal: lifetime.signal });

  return {
    get: () => state,
    set(patch) {
      const next = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
      if (replace(next)) schedule();
    },
    subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
    flush,
    destroy() { flush(); lifetime.abort(); subscribers.clear(); },
  };
}`, { filename: "persistent-store.mjs", lineNumbers: true }),
      code("text", `✓ пустое хранилище → значения по умолчанию
✓ сохранённые данные сливаются с defaults (новые поля получают значения) — {"theme":"dark","size":14}
✓ битые и неожиданные данные → defaults, без исключений — {"n":0} {"n":0} {"n":0} {"n":0} {"n":0} {"n":0}
✓ миграция v1 → v2 → v3 по шагам — {"fullName":"Анна","lang":"ru"}
✓ данные более новой версии игнорируются (defaults) — ""
✓ упавшая миграция не роняет загрузку — {"ok":true}
✓ подписчики: уведомление только при изменении, патч-функция, отписка — {"calls":[[0,1],[1,2]],"final":99}
✓ debounce: 5 быстрых set → одна запись; flush пишет сразу и отменяет таймер — {"immediately":0,"afterDebounce":1,"afterFlush":2,"afterTimer":2,"saved":6}
✓ QuotaExceededError: onError вызван, исключения нет, состояние в памяти обновлено — {"thrown":null,"errors":["QuotaExceededError"],"n":1}
✓ изменение в другой вкладке доходит до подписчиков, обратной записи нет — {"theme":"dark","seen":["light→dark"],"writes":0}
✓ мусор из другой вкладки не ломает состояние (возврат к defaults, затем новое значение) — {"theme":"blue","seen":["light→dark","dark→light","light→blue"]}
✓ clear() в другой вкладке (key === null) → defaults
✓ destroy(): отложенная запись сохранена — 5
✓ pagehide: незаписанное состояние сохраняется немедленно — {"saved":5,"before":null,"afterHide":8}
✓ после destroy() события storage из других вкладок не меняют состояние — 0

Все проверки пройдены: 15/15`, { filename: "результат запуска (Chromium 141)" }),
      p("Состояние в памяти — источник правды; конверт `{ v, data }` позволяет мигрировать схему; `replace()` сравнивает значения по ключам и уведомляет подписчиков, а `set` дополнительно планирует запись (debounce через `clearTimeout`/`setTimeout`). Слушатель `storage` вызывает `replace`, но не `schedule` — поэтому обмена между вкладками по кругу нет. Все слушатели подписаны с `signal`, `destroy()` сбрасывает отложенную запись и снимает их. Проверено мутациями: каждая из девяти поломок (слушатель без `signal`, обратная запись, потеря `clearTimeout`, отсутствие `try/catch`, пропуск миграций, `flush` в `destroy`, проверка версии, `pagehide`, слияние с `defaults`) приводит к красному тесту."),
    ],
  },

  interview: [
    iq("js.storage-url-timers.i1", "basic", "Чем `localStorage` отличается от `sessionStorage`?", [
      ul(
        "`localStorage` живёт, пока его не очистят, и общий для всех вкладок origin; `sessionStorage` — пока открыта вкладка (переживает перезагрузку), у каждой вкладки своя копия.",
        "Оба — синхронные хранилища «строка → строка», привязанные к origin (схема + хост + порт).",
        "Объём ограничен (в Chromium 141 — 5 242 880 символов), превышение — `QuotaExceededError`.",
      ),
    ]),
    iq("js.storage-url-timers.i2", "basic", "Как сохранить объект в `localStorage`?", [
      ul(
        "`localStorage.setItem(key, JSON.stringify(obj))` и чтение `JSON.parse(localStorage.getItem(key))`.",
        "Без `JSON.stringify` сохранится `[object Object]`; `getItem` отсутствующего ключа возвращает `null`.",
        "Чтение защищают `try/catch` и запасным значением; `Date`, `Map`, `Set` и функции через JSON теряются.",
      ),
    ]),
    iq("js.storage-url-timers.i3", "intermediate", "Когда срабатывает событие `storage` и как синхронизировать вкладки?", [
      ul(
        "В других вкладках того же origin при изменении `localStorage` (`setItem`, `removeItem`, `clear`); в самой вкладке — нет; при записи того же значения — нет.",
        "Поля `key`, `oldValue`, `newValue` (`null` при удалении), `storageArea`; у `clear()` `key === null`.",
        "Синхронизация: слушать `storage`, обновлять состояние, не писать обратно (иначе цикл).",
      ),
    ]),
    iq("js.storage-url-timers.i4", "intermediate", "Почему нельзя собирать адрес конкатенацией строк?", [
      ul(
        "Пользовательский ввод может содержать `&`, `=`, `#`, `?` и превратиться в лишние параметры (`a&admin=1` → `admin=1`).",
        "`url.searchParams.set(name, value)` кодирует значения и сохраняет их целиком; `encodeURIComponent` — для отдельных значений.",
        "Схему ссылки проверяют разбором через `URL`, а не `startsWith`.",
      ),
    ]),
    iq("js.storage-url-timers.i5", "intermediate", "Чем `pushState` отличается от `replaceState` и когда вызывается `popstate`?", [
      ul(
        "`pushState` добавляет запись истории, `replaceState` заменяет текущую; оба меняют адрес без перезагрузки и **не** вызывают `popstate`.",
        "`popstate` приходит при переходах между записями (`back`, `forward`, `go`, смена `hash`) со `state` целевой записи.",
        "Для поиска с вводом по клавише лучше `replaceState`; сервер должен отдавать страницу для «глубоких» адресов.",
      ),
    ]),
    iq("js.storage-url-timers.i6", "advanced", "В чём опасность `setInterval` с асинхронным колбэком и чем его заменить?", [
      ul(
        "`setInterval` не ждёт завершения `async`-колбэка: тики перекрываются (замер: параллельных выполнений ≥ 2), нагрузка накапливается.",
        "Замена: цикл `while` с `await работа; await пауза` или рекурсивный `setTimeout` после завершения работы.",
        "Исключение в колбэке не останавливает интервал в браузере (в Node завершает процесс); отменять нужно явно (`clearInterval`, `AbortSignal`).",
      ),
    ]),
    iq("js.storage-url-timers.i7", "engineering", "Как спроектировать хранение настроек, чтобы новые релизы не ломали старых пользователей?", [
      ul(
        "Конверт `{ v, data }` с версией схемы, миграции по шагам, слияние с `defaults` и валидация данных при чтении.",
        "Безопасное чтение (`try/catch`), запись с debounce и обработкой квоты, запасное хранилище в памяти.",
        "Синхронизация вкладок через `storage`; тесты с битыми, старыми и «будущими» данными.",
        "Секреты в `localStorage` не хранить.",
      ),
    ]),
    iq("js.storage-url-timers.i8", "debugging", "`TransactionInactiveError` при записи в IndexedDB после `await fetch`. Почему?", [
      ul(
        "Транзакция автоматически завершается, когда в очереди нет запросов; ожидание постороннего обещания пропускает момент активности.",
        "Исправление: выполнить `fetch` и подготовить данные до `db.transaction(...)`, затем поставить все запросы подряд и дождаться `complete`.",
        "Проверить: нет ли `await` внутри `onsuccess`-цепочки, не связанного с запросами IndexedDB.",
      ),
    ]),
  ],

  exam: [
    mcq("js.storage-url-timers.e1", "foundation", "Что вернёт `localStorage.getItem(\"нет такого\")`?", ["`undefined`", "Пустую строку", "`null`", "Исключение"], 2, "Для отсутствующего ключа `getItem` возвращает `null`, а не `undefined` (замер в Chromium 141)."),
    mcq("js.storage-url-timers.e2", "foundation", "Что окажется в хранилище после `localStorage.setItem(\"a\", { x: 1 })`?", ["`[object Object]`", "`{\"x\":1}`", "Ничего: будет ошибка", "`x=1`"], 0, "Значение приводится к строке; для объектов нужен `JSON.stringify`."),
    mcq("js.storage-url-timers.e3", "intermediate", "Где сработает событие `storage` после `localStorage.setItem` в вкладке A?", ["В вкладке A", "Во всех вкладках origin, включая A", "Только при изменении значения в `sessionStorage`", "Во всех вкладках origin, кроме A"], 3, "Событие приходит в другие документы origin, а не в тот, где изменение сделано (замер: у вкладки A — `[]`)."),
    mcq("js.storage-url-timers.e4", "intermediate", "Что вызывает событие `popstate`?", ["`history.pushState`", "`history.back()`", "`history.replaceState`", "Изменение `document.title`"], 1, "`popstate` — это переход между записями; `pushState`/`replaceState` его не вызывают (замер)."),
    mcq("js.storage-url-timers.e5", "intermediate", "Что даст `new URL(\"?q=1\", \"https://e.com/a/b?x=0#h\").href`?", ["`https://e.com/a/b?x=0&q=1#h`", "`TypeError`", "`https://e.com/?q=1`", "`https://e.com/a/b?q=1`"], 3, "Относительный адрес из одного запроса заменяет запрос и отбрасывает хэш: `https://e.com/a/b?q=1`."),
    mcq("js.storage-url-timers.e6", "advanced", "Что верно про таймеры? Выберите все.", ["`clearTimeout` может отменить интервал", "Исключение в колбэке `setInterval` в браузере останавливает интервал", "`setInterval` с `async`-колбэком может запускать выполнения параллельно", "В Node.js `unref()` не даёт таймеру удерживать процесс"], [0, 2, 3], "Отмена взаимозаменяема, интервал продолжается после исключения (браузер), перекрытие возможно, `unref()` снимает удержание процесса (замеры)."),
    mcq("js.storage-url-timers.e7", "advanced", "Почему `url.startsWith(\"javascript:\")` — ненадёжная защита?", ["Регистр букв", "`javascript:` не бывает в `URL`", "Ведущие пробелы и управляющие символы отбрасываются при разборе, адрес остаётся валидным", "`startsWith` не работает со строками"], 2, "Замер: `\" \\tjavascript:alert(1)\"` разобран со схемой `javascript:`, а `startsWith` вернул `false`. Проверяйте `new URL(...).protocol` по списку."),
    open("js.storage-url-timers.e8", "intermediate", "Опишите, как безопасно читать и записывать настройки в `localStorage`.", [
      ul(
        "Читать в `try/catch`: `JSON.parse` на `null`, пустых и битых данных; проверять тип результата; сливать с `defaults`.",
        "Писать `JSON.stringify`, оборачивать `setItem` в `try/catch` (`QuotaExceededError`, `SecurityError`), иметь запасное хранилище.",
        "Версионировать схему и мигрировать; откладывать запись (debounce), сохранять при `pagehide`.",
        "Синхронизировать вкладки через `storage` без обратной записи.",
      ),
    ], ["Названо try/catch при чтении", "Названа JSON-сериализация и ошибки записи", "Названы версия и миграции", "Названа синхронизация вкладок"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.storage-url-timers.m1", "intermediate", "Что делает `history.pushState(state, \"\", \"/list?p=2\")`, если вы находитесь в середине истории?", ["Перезагружает страницу", "Добавляет запись после текущей и удаляет «будущие» записи, `popstate` не вызывает", "Заменяет текущую запись", "Вызывает `popstate` и `hashchange`"], 1, "`pushState` усекает записи после текущей, добавляет новую и меняет адрес без загрузки документа и без событий."),
    mcq("js.storage-url-timers.m2", "advanced", "Почему `JSON.parse(localStorage.getItem(\"k\"))` безопасен для отсутствующего ключа, но `.theme` у результата — нет?", ["`JSON.parse(null)` возвращает `null`, и обращение к свойству `null` бросает `TypeError`", "`JSON.parse(null)` бросает исключение", "`getItem` возвращает `undefined`", "`JSON.parse` возвращает `{}`"], 0, "Замер: `JSON.parse(null)` → `null`; поэтому нужен запасной объект и проверка типа результата."),
    open("js.storage-url-timers.m3", "advanced", "Одновременно открыты две вкладки приложения; в обеих пользователь добавляет задачи в список, хранящийся в `localStorage`. Часть задач пропадает. Объясните причину и предложите решения.", [
      ul(
        "Состояние читается один раз при загрузке, и каждая вкладка записывает свой полный список поверх чужого — побеждает последняя запись (транзакций у `localStorage` нет).",
        "Решения: слушать `storage` и сливать (например, по идентификаторам задач), либо хранить задачи отдельными ключами/записями, либо перейти на IndexedDB с транзакциями и/или Web Locks API, либо сервер как источник правды.",
        "Перед записью перечитывать актуальное значение и сливать (оптимистично), помнить о гонке между чтением и записью.",
        "Тесты: две вкладки, одновременные добавления, удаление в одной и изменение в другой.",
      ),
    ], ["Названа причина: последняя запись побеждает", "Предложено слияние или IndexedDB/сервер", "Упомянута проверка в тестах"], { format: "debug" }),
    open("js.storage-url-timers.m4", "advanced", "Спроектируйте поиск с фильтрами, состояние которого находится в адресе и работает с кнопками «Назад»/«Вперёд» и перезагрузкой.", [
      ul(
        "Источник правды — `URL`: параметры `q`, `page`, `sort`; при загрузке парсить `location.search` через `URLSearchParams` и приводить типы (с валидацией и значениями по умолчанию).",
        "Изменение фильтра — `pushState` (осмысленный шаг), ввод по клавише — `replaceState` с debounce; `popstate` перерисовывает экран из адреса.",
        "Запросы отменять `AbortController` при смене фильтра (защита от гонок), ссылки собирать через `URL`.",
        "Сервер отдаёт страницу для всех путей приложения; параметры кодируются автоматически; проверяются недоверенные значения.",
        "Тесты: переход по ссылке, перезагрузка, «Назад» после нескольких фильтров, кривые параметры.",
      ),
    ], ["Описан URL как источник правды", "Различены pushState и replaceState", "Описаны popstate и отмена запросов", "Упомянуты тесты и валидация параметров"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.storage-url-timers.f1", front: "localStorage vs sessionStorage?", back: "Оба строки, синхронные, по origin. localStorage — общий для вкладок и надолго; sessionStorage — своя копия вкладки, переживает перезагрузку." },
    { id: "js.storage-url-timers.f2", front: "Что сохранит setItem(k, {a: 1})?", back: "Строку «[object Object]». Нужны JSON.stringify/JSON.parse в try/catch. getItem отсутствующего ключа → null; JSON.parse(null) → null." },
    { id: "js.storage-url-timers.f3", front: "Событие storage?", back: "Только в других вкладках origin; key/oldValue/newValue (null при удалении); clear → key=null; то же значение — события нет." },
    { id: "js.storage-url-timers.f4", front: "Квота?", back: "Chromium 141: 5 242 880 символов (ключи + значения), QuotaExceededError (код 22), старое значение цело; запись оборачивать в try/catch." },
    { id: "js.storage-url-timers.f5", front: "IndexedDB и транзакции?", back: "Транзакция живёт, пока в очереди есть запросы; посторонний await → TransactionInactiveError; данные готовить заранее, ждать oncomplete." },
    { id: "js.storage-url-timers.f6", front: "URL безопасно?", back: "new URL(rel, base); searchParams.set кодирует значения; не склеивать строки; схему проверять по списку через .protocol, а не startsWith." },
    { id: "js.storage-url-timers.f7", front: "History?", back: "pushState/replaceState не вызывают popstate; popstate — при back/forward/go/hash; сервер должен отдавать «глубокие» адреса." },
    { id: "js.storage-url-timers.f8", front: "Таймеры?", back: "Не раньше задержки и только в свободном потоке; setInterval перекрывается для async; исключение в браузере интервал не останавливает, в Node — завершает процесс; unref() в Node." },
  ],

  sources: [
    { title: "HTML Standard: Web storage", url: "https://html.spec.whatwg.org/multipage/webstorage.html", publisher: "WHATWG" },
    { title: "HTML Standard: Session history and navigation (History API)", url: "https://html.spec.whatwg.org/multipage/nav-history-apis.html", publisher: "WHATWG" },
    { title: "HTML Standard: Timers", url: "https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers", publisher: "WHATWG" },
    { title: "URL Standard", url: "https://url.spec.whatwg.org/", publisher: "WHATWG" },
    { title: "Indexed Database API 3.0", url: "https://www.w3.org/TR/IndexedDB/", publisher: "W3C" },
    { title: "Storage Standard (квоты и хранилище)", url: "https://storage.spec.whatwg.org/", publisher: "WHATWG" },
    { title: "MDN: Web Storage API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API", publisher: "MDN" },
    { title: "MDN: Using IndexedDB", url: "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB", publisher: "MDN" },
    { title: "MDN: URL", url: "https://developer.mozilla.org/en-US/docs/Web/API/URL", publisher: "MDN" },
    { title: "MDN: History API", url: "https://developer.mozilla.org/en-US/docs/Web/API/History_API", publisher: "MDN" },
    { title: "MDN: setInterval()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval", publisher: "MDN" },
    { title: "Node.js: Timers", url: "https://nodejs.org/api/timers.html", publisher: "Other" },
  ],
};
