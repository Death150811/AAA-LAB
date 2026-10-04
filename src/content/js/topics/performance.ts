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

export const performanceTopic: Topic = {
  id: "js.performance",
  slug: "performance",
  domain: "js",
  module: "engineering",
  title: "Производительность JavaScript",
  titleEn: "JavaScript performance",
  summary:
    "Оптимизировать нужно то, что измерено, а измерять — правильно. Тема на замерах в Node.js 22 и Chromium 141 разбирает инструменты (`performance.now`, `mark`/`measure`, `PerformanceObserver`, `timerify`, медиана и p95 вместо одного замера), главную нить браузера (длинные задачи ≥ 50 мс, порционная обработка и `scheduler.yield`, Web Workers и `transfer`), раскладку (200 принудительных раскладок против одной при смешении чтения и записи, `transform` против `width`), сдвиги раскладки и задержку отклика, алгоритмическую сложность (`includes` в цикле против `Set`) и устройство V8 (формы объектов, `delete`, виды элементов массива). В конце вы пишете `processInChunks` и `debounce`/`throttle`.",
  minutes: 120,
  prerequisites: ["js.event-loop", "js.memory-gc", "js.dom-events"],
  tags: ["performance", "profiling", "performance.now", "PerformanceObserver", "long task", "layout thrashing", "reflow", "Web Worker", "transferable", "scheduler.yield", "debounce", "throttle", "hidden class", "elements kind", "Big-O", "INP", "CLS", "benchmark"],
  keyConcepts: [
    { term: "Сначала измерьте, потом оптимизируйте", text: "Один замер ненадёжен (5 замеров одного кода различались); нужны прогрев, повторы, медиана и p95, измерения в реальной среде. Догадка о «горячем месте» чаще ошибочна." },
    { term: "Главная нить не должна занимать больше 50 мс подряд", text: "Задача длиннее 50 мс — «длинная»: ввод и отрисовка ждут. 150 мс одним куском дали `longtask` и отклик на клик ≥ 100 мс; те же 150 мс порциями по 5 мс — ни одной длинной задачи." },
    { term: "Смешение чтения и записи геометрии = layout thrashing", text: "`offsetWidth` после записи стиля вынуждает браузер пересчитать раскладку сразу: 200 строк — 200 раскладок; сначала все чтения, потом все записи — 1 раскладка. Повторное изменение `transform` раскладку не запускает (0), `width` — запускает." },
    { term: "Алгоритмы важнее микрооптимизаций", text: "`includes` в цикле — O(n²): при удвоении входа время растёт более чем в 2,5 раза, а `Set` на 8000 элементов быстрее более чем в 10 раз. Структура данных решает больше, чем хитрый цикл." },
    { term: "Тяжёлое — в Worker, большие данные — `transfer`", text: "250 мс вычислений в главном потоке дали паузу ≥ 200 мс, в Worker — < 100 мс. `ArrayBuffer` копируется или переносится: после `transfer` исходник пуст (`byteLength` 0)." },
    { term: "V8 любит предсказуемые формы", text: "Объекты с одинаковым порядком свойств делят форму; `delete` переводит объект в «словарный» режим; массив меняет вид элементов только в сторону «хуже» (Smi → Double → Object). Это даёт выигрыш на горячем коде, но не заменяет измерений." },
  ],
  sections: [
    section("definition", [
      def("Производительность", "Скорость и плавность работы: время загрузки, отклик на ввод, частота кадров, использование CPU и памяти. Измеряется метриками, а не ощущениями.", "performance"),
      def("Длинная задача (long task)", "Задача главного потока длительностью более 50 мс; пока она идёт, браузер не может обрабатывать ввод и отрисовывать кадры.", "long task"),
      def("Принудительная раскладка (forced reflow / layout thrashing)", "Чтение геометрии (`offsetWidth`, `getBoundingClientRect`) после изменений DOM или стилей заставляет браузер пересчитать раскладку немедленно; в цикле это превращается в сотни пересчётов.", "forced reflow"),
      def("Core Web Vitals", "Метрики пользовательского опыта: LCP (скорость показа главного контента), INP (отклик на ввод), CLS (стабильность раскладки).", "Core Web Vitals"),
      def("Web Worker", "Скрипт, выполняющийся в отдельном потоке без доступа к DOM; общается с главным потоком сообщениями (`postMessage`) со структурным клонированием и передачей (`transfer`).", "Web Worker"),
      def("Алгоритмическая сложность", "Зависимость числа операций от размера входа (O(1), O(n), O(n log n), O(n²)); определяет, выдержит ли код рост данных.", "Big-O"),
      def("Скрытый класс (форма объекта)", "Внутреннее описание структуры объекта (набор и порядок свойств), которое V8 использует для быстрого доступа через inline-кэши.", "hidden class / shape"),
      def("Debounce и throttle", "Debounce откладывает вызов до паузы между вызовами; throttle пропускает не больше одного вызова за интервал.", "debounce / throttle"),
    ]),

    section("why", [
      h("Скорость — часть функциональности"),
      p("Пользователь не отличает «медленно» от «не работает»: интерфейс, который откликается дольше 100–200 мс, ощущается сломанным, а плавная анимация требует укладываться в ≈ 16 мс на кадр. На сервере то же самое выражается в задержке ответа и числе запросов в секунду. Хорошая новость: большинство проблем — повторяющиеся шаблоны, которые находятся измерением и исправляются локально."),
      ul(
        "**Отклик:** главный поток свободен, ввод обрабатывается сразу (INP), нет длинных задач.",
        "**Плавность:** нет принудительных раскладок в циклах, анимации идут на композиторе (`transform`, `opacity`).",
        "**Масштабируемость:** сложность O(n) вместо O(n²), правильные структуры данных, кэширование.",
        "**Экономия:** меньше CPU и батареи, меньше трафика (загрузка по требованию, сжатие), меньше памяти.",
      ),
      insight("Производительность — это **бюджет**: на кадр ≈ 16 мс, на задачу главного потока — 50 мс, на загрузку — секунды. Любое решение стоит из этого бюджета; профилирование показывает, куда он уходит."),
    ]),

    section("mental-model", [
      p("**Главный поток браузера — единственный повар на кухне.** Он готовит заказы (JavaScript), ставит тарелки на стол (раскладка и отрисовка) и принимает новых гостей (ввод). Если повар надолго ушёл в заготовки (длинная задача), гости ждут, а блюдо остывает. **Layout thrashing** — это повар, который после каждой тарелки бегает в зал проверять, как она выглядит, вместо того чтобы сначала расставить все. **Worker** — второй повар в соседней комнате: у него нет доступа к залу (DOM), зато он не мешает первому. **O(n²)** — это когда для каждого гостя вы перебираете весь список бронирований. **Форма объекта** — привычный порядок ингредиентов: повар работает быстро, пока рецепты похожи, и спотыкается, когда каждый раз всё по-новому."),
      table(
        ["Симптом", "Вероятная причина", "Что проверить / сделать"],
        [
          ["Страница «замирает» на 100+ мс при действии", "Длинная задача в обработчике", "Performance → Long tasks; разбить на порции, вынести в Worker"],
          ["Прокрутка и анимации «дёргаются»", "Принудительные раскладки, дорогая отрисовка, `width`/`top` вместо `transform`", "Performance → Layout/Recalculate Style; разделить чтения и записи"],
          ["Контент «прыгает» при загрузке", "Нет зарезервированного места (картинки, баннеры, шрифты)", "CLS, `width`/`height`, `min-height`, `aspect-ratio`"],
          ["Время растёт нелинейно с данными", "Вложенные циклы, `includes`/`indexOf` в цикле", "Заменить на `Set`/`Map`, предвычислить, сортировка + двоичный поиск"],
          ["Память и пауза GC растут", "Утечки, избыточные копии, промежуточные массивы", "Memory → snapshots; потоковая обработка"],
          ["Ускорение «микрооптимизацией» не измеряется", "Узкое место в другом месте", "Профиль до/после; не оптимизировать без метрики"],
        ],
        "Как читать симптомы",
      ),
    ]),

    section("technical", [
      h("Измерение: часы, метки, наблюдатели, статистика"),
      code("js", `import { performance, PerformanceObserver } from "node:perf_hooks";
const show = (k, v) => console.log(k.padEnd(62), "→", typeof v === "string" ? v : JSON.stringify(v));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. Часы
const t0 = performance.now(), d0 = Date.now();
await sleep(20);
show("performance.now(): монотонное, дробные миллисекунды; прошло ≥ 19 мс", [performance.now() - t0 >= 19, !Number.isInteger(performance.now())]);
show("Date.now() — целые миллисекунды эпохи, performance.now() — от запуска", [Number.isInteger(d0), performance.now() < 60_000]);

// 2. Метки и измерения
const entries = [];
const observer = new PerformanceObserver((list) => entries.push(...list.getEntries().map((e) => \`\${e.entryType}:\${e.name}\`)));
observer.observe({ entryTypes: ["mark", "measure"] });
performance.mark("start");
await sleep(30);
performance.mark("end");
const measure = performance.measure("работа", "start", "end");
await sleep(10);
show("measure('работа', 'start', 'end'): тип, длительность ≥ 25 мс", [measure.entryType, measure.duration >= 25]);
show("PerformanceObserver получил записи асинхронно", entries.sort());
show("getEntriesByName('работа')", performance.getEntriesByName("работа").map((e) => e.entryType));
performance.clearMarks(); performance.clearMeasures();
show("после clearMarks/clearMeasures", performance.getEntriesByType("mark").length + performance.getEntriesByType("measure").length);
observer.disconnect();

// 3. timerify: обёртка, которая сама отправляет измерение
const fnEntries = [];
const fnObserver = new PerformanceObserver((list) => fnEntries.push(...list.getEntries().map((e) => e.name)));
fnObserver.observe({ entryTypes: ["function"] });
const busy = performance.timerify(function heavy() { const end = performance.now() + 15; while (performance.now() < end); });
busy(); busy();
await sleep(10);
show("timerify(heavy) ×2 → записи типа function", fnEntries);
fnObserver.disconnect();

// 4. Микробенчмарк: прогрев, повторы, медиана и p95 вместо одного замера
function bench(fn, { warmup = 5, runs = 25 } = {}) {
  for (let i = 0; i < warmup; i++) fn();                           // прогрев: компиляция, кэши
  const times = [];
  for (let i = 0; i < runs; i++) { const s = performance.now(); fn(); times.push(performance.now() - s); }
  times.sort((a, b) => a - b);
  const q = (p) => times[Math.min(times.length - 1, Math.floor(p * times.length))];
  return { min: times[0], median: q(0.5), p95: q(0.95), runs };
}
const r = bench(() => { let s = 0; for (let i = 0; i < 200_000; i++) s += Math.sqrt(i); return s; });
show("bench: min ≤ median ≤ p95, повторов", [r.min <= r.median, r.median <= r.p95, r.runs]);

// 5. Одно и то же — разные результаты: единичный замер ненадёжен
const singles = Array.from({ length: 5 }, () => { const s = performance.now(); let x = 0; for (let i = 0; i < 100_000; i++) x += i; return performance.now() - s; });
show("5 одиночных замеров одного и того же кода различаются", new Set(singles.map((v) => v.toFixed(4))).size > 1);`, { filename: "pf1-measure.mjs", collapsed: true, lineNumbers: true }),
      code("text", `performance.now(): монотонное, дробные миллисекунды; прошло ≥ 19 мс → [true,true]
Date.now() — целые миллисекунды эпохи, performance.now() — от запуска → [true,true]
measure('работа', 'start', 'end'): тип, длительность ≥ 25 мс   → ["measure",true]
PerformanceObserver получил записи асинхронно                  → ["mark:end","mark:start","measure:работа"]
getEntriesByName('работа')                                     → ["measure"]
после clearMarks/clearMeasures                                 → 0
timerify(heavy) ×2 → записи типа function                      → ["heavy","heavy"]
bench: min ≤ median ≤ p95, повторов                            → [true,true,25]
5 одиночных замеров одного и того же кода различаются          → true`, { filename: "вывод Node.js 22.22.0 (результаты — булевы значения; 5 запусков подряд одинаковы)" }),
      ul(
        "**`performance.now()`** — монотонные дробные миллисекунды от запуска, не зависят от перевода системных часов; `Date.now()` — целые миллисекунды эпохи (для дат, а не для измерений).",
        "**`mark`/`measure`:** `performance.mark(\"start\")`, `performance.mark(\"end\")`, `performance.measure(\"работа\", \"start\", \"end\")` — запись типа `measure` с `duration`; она же видна в панели Performance DevTools (User Timing).",
        "**`PerformanceObserver`** получает записи асинхронно; `getEntriesByName`/`clearMarks` читают и чистят буфер.",
        "**`performance.timerify(fn)`** (Node.js) — обёртка, отправляющая запись типа `function` на каждый вызов.",
        "**Микробенчмарк:** прогрев (компиляция, кэши), много повторов, **медиана и p95**, а не среднее и не единичный замер (пять одиночных замеров одного и того же кода различались).",
        "**Подводные камни:** слишком маленький код оптимизируется иначе, чем в продакшене; сборка мусора шумит; JIT «заточен» под профиль вызовов; результаты зависят от железа — сравнивайте варианты в одном запуске.",
      ),

      h("Главный поток: длинные задачи, порции и отклик"),
      code("html", `<button id="blocking">Тяжёлая работа сразу</button>
<button id="chunked">Тяжёлая работа порциями</button>
<p id="content">Текст, который не должен «прыгать».</p>
<div id="slot"></div>
<script>
  const spin = (ms) => { const end = performance.now() + ms; while (performance.now() < end); };
  const nextTask = () => new Promise((r) => setTimeout(r));

  window.entries = { longtask: [], event: [], shift: [] };
  new PerformanceObserver((l) => entries.longtask.push(...l.getEntries().map((e) => Math.round(e.duration)))).observe({ type: "longtask", buffered: true });
  new PerformanceObserver((l) => entries.event.push(...l.getEntries().filter((e) => e.name === "click").map((e) => Math.round(e.duration)))).observe({ type: "event", durationThreshold: 16, buffered: true });
  new PerformanceObserver((l) => entries.shift.push(...l.getEntries().map((e) => ({ value: e.value, recentInput: e.hadRecentInput })))).observe({ type: "layout-shift", buffered: true });

  document.getElementById("blocking").addEventListener("click", () => { spin(150); });          // один длинный кусок
  document.getElementById("chunked").addEventListener("click", async () => {                      // те же 150 мс работы, но порциями по 5 мс
    for (let i = 0; i < 30; i++) { spin(5); await nextTask(); }
  });

  // Сдвиг раскладки: блок вставляется выше уже показанного текста
  window.insertAbove = (reserve) => {
    const box = document.createElement("div");
    box.style.height = "200px"; box.style.background = "#fde68a";
    if (reserve) { document.getElementById("slot").style.minHeight = "200px"; document.getElementById("slot").append(box); }
    else document.body.insertBefore(box, document.getElementById("content"));
  };
  // Ждём два кадра, чтобы наблюдатели получили записи
  window.settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 100))));
</script>`, { filename: "pf4-main-thread.html", collapsed: true, lineNumbers: true }),
      code("text", `150 мс работы одним куском: longtask-записей ≥ 1, самая длинная ≥ 100 мс → [true,true]
задержка отклика на клик (event timing) ≥ 100 мс                   → true
те же 150 мс порциями по 5 мс: longtask-записей                    → 0
отклик на клик (event timing) < 100 мс                             → true
блок вставлен выше текста без резервирования места: сдвиг раскладки → [true,true,true]
то же с заранее зарезервированным местом (min-height): сдвигов     → 0
scheduler.yield, scheduler.postTask, requestIdleCallback, isInputPending → ["function","function","function","function"]`, { filename: "замер в Chromium 141 (5 запусков подряд одинаковы)" }),
      ul(
        "**Длинная задача:** 150 мс работы в обработчике клика одним куском → `longtask`-запись (≥ 100 мс) и задержка отклика (Event Timing) ≥ 100 мс.",
        "**Порциями:** те же 150 мс как 30 порций по 5 мс с уступкой через `setTimeout` → 0 длинных задач, отклик < 100 мс; между порциями браузер обрабатывает ввод и рисует.",
        "**Сдвиг раскладки (CLS):** блок, вставленный **выше** уже показанного текста, дал запись `layout-shift` с `value > 0` и `hadRecentInput === false`; заранее зарезервированное место (`min-height`) — 0 сдвигов.",
        "**Инструменты планировщика:** в Chromium 141 есть `scheduler.yield`, `scheduler.postTask`, `requestIdleCallback` и `navigator.scheduling.isInputPending`; в других браузерах поддержка отличается — используйте обнаружение возможностей и запасной `setTimeout`.",
        "**`longtask`** — API Chromium; кроссбраузерно полагайтесь на трассировку DevTools и RUM-метрики.",
      ),

      h("Раскладка: чтение и запись, `transform` против `width`"),
      code("html", `<div id="list"></div>
<script>
  const list = document.getElementById("list");
  const N = 200;
  function fill() {
    list.replaceChildren();
    for (let i = 0; i < N; i++) { const d = document.createElement("div"); d.className = "row"; d.textContent = "строка " + i; list.append(d); }
    return [...list.children];
  }
  window.cases = {
    // Читаем геометрию и сразу пишем стиль — на каждой итерации браузер вынужден пересчитывать раскладку
    thrash(rows) { for (const r of rows) { const w = r.offsetWidth; r.style.width = (w + 1) + "px"; } },
    // Сначала все чтения, потом все записи — одна раскладка
    batched(rows) { const widths = rows.map((r) => r.offsetWidth); rows.forEach((r, i) => { r.style.width = (widths[i] + 1) + "px"; }); },
    // Записи без чтений
    writeOnly(rows) { for (const r of rows) r.style.width = "50%"; },
    // Вставка по одному и общей порцией
    appendEach() { list.replaceChildren(); for (let i = 0; i < N; i++) { const d = document.createElement("div"); d.textContent = i; list.append(d); void list.offsetHeight; } },
    appendFragment() { list.replaceChildren(); const f = document.createDocumentFragment(); for (let i = 0; i < N; i++) { const d = document.createElement("div"); d.textContent = i; f.append(d); } list.append(f); void list.offsetHeight; },
    // Анимация: width запускает раскладку, transform — нет
    animateWidth(rows) { for (const r of rows) r.style.width = Math.random() * 100 + "%"; },
    animateTransform(rows) { for (const r of rows) r.style.transform = "translateX(" + Math.random() * 100 + "px)"; },
  };
  window.fill = fill;
</script>`, { filename: "pf3-layout.html", collapsed: true }),
      code("text", `200 строк:
чтение offsetWidth и запись width вперемешку (layout thrashing) → раскладок: 200 | пересчётов стилей: 200
сначала все чтения, затем все записи                           → раскладок: 1 | пересчётов стилей: 1
только записи                                                  → раскладок: 1 | пересчётов стилей: 1
вставка по одному с чтением offsetHeight после каждой          → раскладок: 200 | пересчётов стилей: 200
вставка через DocumentFragment                                 → раскладок: 1 | пересчётов стилей: 1
повторное изменение width (меняет геометрию)                   → раскладок: 1 | пересчётов стилей: 1
повторное изменение transform (геометрию не меняет)            → раскладок: 0 | пересчётов стилей: 1`, { filename: "замер в Chromium 141 (CDP: Performance.getMetrics, LayoutCount)" }),
      ul(
        "**Thrashing:** 200 строк, `offsetWidth` и запись `width` вперемешку → **200** раскладок и 200 пересчётов стилей; сначала все чтения, затем все записи → **1**.",
        "**Вставка:** по одному элементу с чтением `offsetHeight` после каждого → 200; через `DocumentFragment` (или пачкой) → 1.",
        "**`transform` против `width`:** повторное изменение `width` меняет геометрию → раскладка (1); повторное изменение `transform` — **0** раскладок, один пересчёт стилей (анимации на композиторе).",
        "**Что вызывает принудительную раскладку:** `offset*`, `client*`, `scroll*`, `getBoundingClientRect()`, `getComputedStyle(...).свойство` после изменений — читайте их до записей или в `requestAnimationFrame`.",
      ),

      h("Алгоритмы и структуры данных"),
      code("js", `import { performance } from "node:perf_hooks";
const show = (k, v) => console.log(k.padEnd(66), "→", typeof v === "string" ? v : JSON.stringify(v));
const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const time = (fn, repeats = 7) => { fn(); return median(Array.from({ length: repeats }, () => { const s = performance.now(); fn(); return performance.now() - s; })); };
const data = (n) => Array.from({ length: n }, (_, i) => (i * 7919) % (n * 2));      // почти без повторов

// 1. Уникальные значения: includes в цикле — O(n²), Set — O(n)
const uniqueSlow = (xs) => { const out = []; for (const x of xs) if (!out.includes(x)) out.push(x); return out; };
const uniqueFast = (xs) => [...new Set(xs)];
const n = 8000, a = data(n), b = data(2 * n);
const slow1 = time(() => uniqueSlow(a)), slow2 = time(() => uniqueSlow(b)), fast1 = time(() => uniqueFast(a));
show("результаты совпадают", JSON.stringify(uniqueSlow(data(500))) === JSON.stringify(uniqueFast(data(500))));
show("uniqueSlow: вход вырос вдвое → время выросло более чем в 2,5 раза", slow2 / slow1 > 2.5);
show("на 8000 элементах Set быстрее includes-цикла более чем в 10 раз", slow1 / fast1 > 10);

// 2. Пересечение двух списков
const common = (x, y) => x.filter((v) => y.includes(v));
const commonFast = (x, y) => { const s = new Set(y); return x.filter((v) => s.has(v)); };
const c1 = data(n), c2 = data(n).reverse();
show("пересечение: результаты совпадают, Set быстрее более чем в 10 раз", [JSON.stringify(common(c1.slice(0, 300), c2)) === JSON.stringify(commonFast(c1.slice(0, 300), c2)), time(() => common(c1, c2)) / time(() => commonFast(c1, c2)) > 10]);

// 3. Лишняя работа внутри цикла
const slowLoop = (xs) => { let s = 0; for (let i = 0; i < xs.length; i++) s += xs.slice(0, 1).length + Math.sqrt(i); return s; };
const hoisted = (xs) => { let s = 0; const first = xs.slice(0, 1).length; for (let i = 0; i < xs.length; i++) s += first + Math.sqrt(i); return s; };
const big = data(300_000);
show("вынос неизменной работы из цикла: тот же результат, быстрее в 2 и более раза", [slowLoop(big) === hoisted(big), time(() => slowLoop(big)) / time(() => hoisted(big)) > 2]);

// 4. Цепочка и один проход дают одинаковый результат — выигрыш измеряйте
const chain = (xs) => xs.map((x) => x * 2).filter((x) => x % 3 === 0).reduce((s, x) => s + x, 0);
const single = (xs) => { let s = 0; for (const x of xs) { const y = x * 2; if (y % 3 === 0) s += y; } return s; };
show("цепочка map/filter/reduce и один цикл: результаты совпадают", chain(big) === single(big));`, { filename: "pf5-complexity.mjs", collapsed: true, lineNumbers: true }),
      code("text", `результаты совпадают                                               → true
uniqueSlow: вход вырос вдвое → время выросло более чем в 2,5 раза  → true
на 8000 элементах Set быстрее includes-цикла более чем в 10 раз    → true
пересечение: результаты совпадают, Set быстрее более чем в 10 раз  → [true,true]
вынос неизменной работы из цикла: тот же результат, быстрее в 2 и более раза → [true,true]
цепочка map/filter/reduce и один цикл: результаты совпадают        → true`, { filename: "вывод Node.js 22.22.0 (12 запусков подряд одинаковы; сравниваются отношения времён, а не секунды)" }),
      ul(
        "**O(n²) на практике:** `uniqueSlow` с `includes` в цикле: вход вырос вдвое — время выросло более чем в 2,5 раза; на 8000 элементах `Set` быстрее более чем в 10 раз, результат тот же.",
        "**Пересечение списков:** `filter` + `includes` против `Set.has` — выигрыш более чем в 10 раз.",
        "**Лишняя работа в цикле:** вынос неизменяемого вычисления (`xs.slice(0, 1).length`) наружу — тот же результат и ускорение более чем в 2 раза.",
        "**Цепочки `map/filter/reduce` и один цикл** дают одинаковый результат; выигрыш (меньше промежуточных массивов) нужно измерять, а не предполагать.",
        "**Замер отношением** устойчив к машине: сравниваются варианты друг с другом и рост при удвоении входа.",
      ),

      h("Как V8 хранит объекты и массивы"),
      code("js", `// Запускает проверку в дочернем процессе с --allow-natives-syntax: %-функции V8 показывают внутреннее устройство объектов.
import { spawnSync } from "node:child_process";
const probe = \`
const show = (k, v) => console.log(k.padEnd(62), "→", typeof v === "string" ? v : JSON.stringify(v));

// 1. Объекты с одинаковым порядком свойств делят «форму» (hidden class / Map)
const a = { x: 1, y: 2 }, b = { x: 3, y: 4 }, c = { y: 5, x: 6 };
show("{x, y} и {x, y} — одна форма", %HaveSameMap(a, b));
show("{x, y} и {y, x} — разные формы", !%HaveSameMap(a, c));
function Point(withZ) { this.x = 1; this.y = 2; if (withZ) this.z = 3; }
const p1 = new Point(false), p2 = new Point(false), p3 = new Point(true);
show("два new Point(false) — одна форма", %HaveSameMap(p1, p2));
show("new Point(true) (дополнительное свойство z) — другая форма", !%HaveSameMap(p1, p3));
const e = { x: 1, y: 2 }; e.z = 3;
show("добавили z к готовому объекту: форма изменилась", !%HaveSameMap(a, e));

// 2. delete переводит объект в «словарный» режим
const f = { x: 1, y: 2, z: 3 };
show("быстрые свойства до delete", %HasFastProperties(f));
delete f.x;
show("быстрые свойства после delete f.x", %HasFastProperties(f));
const g = { x: 1, y: 2, z: 3 }; g.x = undefined;
show("g.x = undefined вместо delete: быстрые свойства", %HasFastProperties(g));

// 3. Виды элементов массива и их односторонние переходы
const kinds = (arr) => ["Smi", "Double", "Object"].find((k) => ({ Smi: %HasSmiElements(arr), Double: %HasDoubleElements(arr), Object: %HasObjectElements(arr) })[k]) + (%HasHoleyElements(arr) ? " (с дырами)" : "");
const arr = [1, 2, 3];
show("[1, 2, 3]", kinds(arr));
arr.push(4.5);
show("после push(4.5)", kinds(arr));
arr.push("строка");
show("после push('строка')", kinds(arr));
arr.pop(); arr.pop(); arr.pop(); arr.pop();
show("после удаления всех строк и чисел с дробной частью — возврата нет", kinds(arr));
show("[1, , 3] — с дырой", kinds([1, , 3]));
const holey = new Array(3); holey[0] = 1; holey[1] = 2; holey[2] = 3;
show("new Array(3) и заполнение — остаётся «с дырами»", kinds(holey));
show("Array.from({ length: 3 }, (_, i) => i)", kinds(Array.from({ length: 3 }, (_, i) => i)));
\`;
const r = spawnSync(process.execPath, ["--allow-natives-syntax", "-e", probe], { encoding: "utf8" });
process.stdout.write(r.stdout);
if (r.status !== 0) process.stdout.write("ошибка: " + r.stderr.split("\\n").slice(0, 6).join("\\n"));`, { filename: "pf2-shapes.mjs", collapsed: true }),
      code("text", `{x, y} и {x, y} — одна форма                                   → true
{x, y} и {y, x} — разные формы                                 → true
два new Point(false) — одна форма                              → true
new Point(true) (дополнительное свойство z) — другая форма     → true
добавили z к готовому объекту: форма изменилась                → true
быстрые свойства до delete                                     → true
быстрые свойства после delete f.x                              → false
g.x = undefined вместо delete: быстрые свойства                → true
[1, 2, 3]                                                      → Smi
после push(4.5)                                                → Double
после push('строка')                                           → Object
после удаления всех строк и чисел с дробной частью — возврата нет → Object
[1, , 3] — с дырой                                             → Smi (с дырами)
new Array(3) и заполнение — остаётся «с дырами»                → Smi (с дырами)
Array.from({ length: 3 }, (_, i) => i)                         → Smi`, { filename: "вывод Node.js 22.22.0 с --allow-natives-syntax (3 запуска подряд одинаковы)" }),
      ul(
        "**Формы:** два объекта с одинаковым порядком присваивания свойств делят форму (`%HaveSameMap` — `true`); `{x, y}` и `{y, x}` — разные; дополнительное свойство (`new Point(true)`, `e.z = 3`) создаёт новую форму.",
        "**`delete`** переводит объект в «словарный» режим (`HasFastProperties` → `false`); `obj.x = undefined` оставляет быстрые свойства.",
        "**Виды элементов:** `[1, 2, 3]` — Smi (малые целые); `push(4.5)` → Double; `push(\"строка\")` → Object; обратно **не возвращаются**, даже после удаления «лишних» элементов. Массив с дырой (`[1, , 3]`, `new Array(3)` с заполнением) остаётся «с дырами».",
        "**Практика:** инициализируйте все свойства в конструкторе в одном порядке; не удаляйте свойства (ставьте `null`/`undefined`); держите массивы однородными; не создавайте массивы с дырами. Эти внутренности не стандарт, но влияют на горячие участки — проверяйте профилем.",
      ),
      warn("Функции `%HaveSameMap` и другие требуют флага `--allow-natives-syntax` — это только для исследования. В рабочем коде их использовать нельзя; делайте выводы по профилю, а не по внутренним вызовам."),

      h("Worker: тяжёлая работа вне главного потока"),
      code("html", `<script>
  const spinCode = \`onmessage = (e) => { const end = performance.now() + e.data.ms; while (performance.now() < end); postMessage({ done: true, threadIsWorker: typeof document === "undefined" }); };\`;
  const worker = new Worker(URL.createObjectURL(new Blob([spinCode], { type: "text/javascript" })));

  // «Сердцебиение» главного потока: самый большой интервал между тиками
  let last = performance.now(), maxGap = 0;
  const heartbeat = setInterval(() => { const now = performance.now(); maxGap = Math.max(maxGap, now - last); last = now; }, 10);
  const resetGap = () => { maxGap = 0; last = performance.now(); };
  const gap = () => Math.round(maxGap);

  window.onMain = async (ms) => { resetGap(); await new Promise((r) => setTimeout(r, 30)); const end = performance.now() + ms; while (performance.now() < end); await new Promise((r) => setTimeout(r, 30)); return gap(); };
  window.onWorker = async (ms) => { resetGap(); const result = await new Promise((resolve) => { worker.onmessage = (e) => resolve(e.data); worker.postMessage({ ms }); }); await new Promise((r) => setTimeout(r, 30)); return { gap: gap(), ...result }; };

  // Передача данных: копирование и перенос
  window.transferDemo = () => {
    const buf = new ArrayBuffer(8 * 1024 * 1024);
    const copied = structuredClone(buf);
    const afterCopy = buf.byteLength;
    const moved = structuredClone(buf, { transfer: [buf] });
    let clonedFunction = "ошибки нет";
    try { worker.postMessage({ f() {} }); } catch (e) { clonedFunction = e.name; }
    return { afterCopy, copied: copied.byteLength, afterTransfer: buf.byteLength, moved: moved.byteLength, clonedFunction };
  };
</script>`, { filename: "pf6-worker.html", collapsed: true }),
      code("text", `250 мс вычислений в главном потоке: максимальная пауза «сердцебиения» ≥ 200 мс → true
те же 250 мс в Worker: максимальная пауза главного потока < 100 мс     → true
код выполнялся в Worker (там нет document)                             → true
передача ArrayBuffer на 8 МиБ: копия / исходный после копии            → [8388608,8388608]
перенос (transfer): исходный после переноса / новый                    → [0,8388608]
postMessage с функцией                                                 → "DataCloneError"`, { filename: "замер в Chromium 141 (6 запусков подряд одинаковы)" }),
      ul(
        "**Главный поток:** 250 мс вычислений → максимальная пауза «сердцебиения» (интервал 10 мс) ≥ 200 мс — интерфейс замирал.",
        "**Worker:** те же 250 мс в воркере → пауза главного потока < 100 мс; код выполнялся в Worker (там нет `document`).",
        "**Передача данных:** `structuredClone(buf)` копирует (оба буфера по 8 МиБ); с `transfer` — исходный становится пустым (`byteLength` 0), новый полноразмерный. Функции через `postMessage` не передаются (`DataCloneError`).",
        "**Когда оправдан Worker:** вычисления ≥ 50 мс, разбор больших данных, сжатие, криптография; накладные расходы — создание потока и передача данных.",
      ),

      h("Порционная обработка и `debounce`"),
      code("js", `// Обработка большого массива порциями: главный поток отдаётся браузеру между порциями, отмена и прогресс — по ходу.
const defaultYield = () => (globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise((resolve) => setTimeout(resolve)));

export async function processInChunks(items, worker, { budgetMs = 8, signal, onProgress, yieldFn = defaultYield, now = () => performance.now() } = {}) {
  signal?.throwIfAborted();
  const total = items.length;
  const results = new Array(total);
  let chunkStart = now();

  for (let i = 0; i < total; i++) {
    results[i] = worker(items[i], i);                  // исключение воркера прерывает всю обработку
    const done = i + 1;
    if (done < total && now() - chunkStart >= budgetMs) {   // бюджет порции исчерпан; одну запись обрабатываем всегда
      onProgress?.(done, total);
      await yieldFn();                                  // отдаём поток: браузер обработает ввод и отрисует кадр
      signal?.throwIfAborted();                         // отмена проверяется на границе порции
      chunkStart = now();
    }
  }
  onProgress?.(total, total);
  return results;
}`, { filename: "chunked.mjs", lineNumbers: true }),
      code("js", `import fs from "node:fs";
import http from "node:http";
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
const file = process.argv[2] ?? "chunked.mjs";
const { processInChunks } = await import(new URL(file, import.meta.url));
const source = fs.readFileSync(new URL(file, import.meta.url), "utf8").replace(/^export /m, "");

const results = [];
const check = (name, ok, info = "") => { results.push(ok); console.log((ok ? "✓ " : "✗ ") + name + (info ? " — " + info : "")); };
const fakeClock = () => { let t = 0; const now = () => t; now.advance = (ms) => { t += ms; }; return now; };
const items = (n) => Array.from({ length: n }, (_, i) => i);

// 1. Порядок результатов (как у map)
let r = await processInChunks(items(5), (x, i) => x * 10 + i, { yieldFn: async () => {} });
check("результаты в порядке входа, воркер получает (элемент, индекс)", JSON.stringify(r) === "[0,11,22,33,44]", JSON.stringify(r));

// 2. Бюджет: 3 мс на элемент, бюджет 10 мс → порция из 4 элементов
let clock = fakeClock(), yields = 0, progress = [];
await processInChunks(items(10), () => clock.advance(3), { budgetMs: 10, now: clock, yieldFn: async () => { yields++; }, onProgress: (d, t) => progress.push(d + "/" + t) });
check("порции по бюджету: 10 элементов по 3 мс при бюджете 10 мс → 2 уступки (после 4-го и 8-го)", yields === 2 && progress.join() === "4/10,8/10,10/10", JSON.stringify({ yields, progress }));

// 3. Каждая порция содержит хотя бы один элемент
clock = fakeClock(); yields = 0;
await processInChunks(items(4), () => clock.advance(50), { budgetMs: 10, now: clock, yieldFn: async () => { yields++; } });
check("элемент дороже бюджета не вызывает зависания: по уступке после каждого, но не после последнего", yields === 3, \`уступок: \${yields}\`);

// 4. Пустой вход и один элемент
yields = 0;
const empty = await processInChunks([], () => 1, { yieldFn: async () => { yields++; } });
check("пустой массив → [] без уступок", empty.length === 0 && yields === 0);

// 5. Ошибка воркера
let calls = 0;
const err = await processInChunks(items(10), (x) => { calls++; if (x === 3) throw new RangeError("сбой на 3"); }, { yieldFn: async () => {} }).catch((e) => e);
check("исключение воркера отклоняет обещание, остальные элементы не обрабатываются", err instanceof RangeError && calls === 4, \`вызовов: \${calls}\`);

// 6. Отмена в процессе
clock = fakeClock(); calls = 0;
const ac = new AbortController();
const aborted = await processInChunks(items(100), () => { calls++; clock.advance(5); }, { budgetMs: 10, now: clock, yieldFn: async () => { if (calls >= 6) ac.abort(new Error("отменено пользователем")); }, signal: ac.signal }).catch((e) => e);
check("отмена на границе порции: отказ причиной сигнала, обработка остановлена (≤ 8 вызовов)", aborted instanceof Error && aborted.message === "отменено пользователем" && calls <= 8, \`вызовов: \${calls}\`);

// 7. Сигнал уже отменён
calls = 0;
const pre = AbortSignal.abort(new Error("заранее"));
const preErr = await processInChunks(items(5), () => { calls++; }, { signal: pre }).catch((e) => e);
check("уже отменённый сигнал: отказ без единого вызова воркера", preErr.message === "заранее" && calls === 0);

// 8. Настоящие уступки: чужие задачи успевают выполниться между порциями
const order = [];
setTimeout(() => order.push("таймер"), 0);
await processInChunks(items(40), () => { const end = performance.now() + 1; while (performance.now() < end); }, { budgetMs: 5, onProgress: (d, t) => { if (d === t) order.push("конец"); } });
check("настоящая уступка: таймер сработал до завершения обработки", order.join() === "таймер,конец", order.join());

// 9. Браузер: отсутствие длинных задач
const html = "<!doctype html><title>t</title>";
const server = http.createServer((req, res) => { res.setHeader("content-type", "text/html"); res.end(html); });
await new Promise((res) => server.listen(0, "127.0.0.1", res));
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const page = await browser.newPage();
await page.goto(\`http://127.0.0.1:\${server.address().port}/\`);
await page.addScriptTag({ content: source + "\\nwindow.processInChunks = processInChunks;" });
const data = await page.evaluate(async () => {
  const longTasks = [];
  new PerformanceObserver((l) => longTasks.push(...l.getEntries().map((e) => e.duration))).observe({ type: "longtask" });
  const items = Array.from({ length: 1_500_000 }, (_, i) => i);
  const work = (x) => { let s = 0; for (let k = 0; k < 60; k++) s += Math.sqrt(x + k); return s; };
  const settle = () => new Promise((r) => setTimeout(r, 150));
  await new Promise((r) => setTimeout(r));                      // уходим в обычную задачу таймера: вызов через CDP как «долгая задача» не учитывается
  const t0 = performance.now(); for (const x of items) work(x); const direct = performance.now() - t0;   // целиком, без уступок
  await settle();
  const directLong = longTasks.length; longTasks.length = 0;
  await processInChunks(items, work, { budgetMs: 8 });
  await settle();
  return { directLong, chunkedLong: longTasks.length, directMs: direct };
});
check("в Chromium: цикл целиком даёт длинные задачи (≥ 50 мс), порционная обработка — ни одной", data.directMs > 100 && data.directLong >= 1 && data.chunkedLong === 0, JSON.stringify({ непрерывный: data.directLong, порциями: data.chunkedLong, циклДлился_мс: Math.round(data.directMs) >= 100 }));
await browser.close(); server.close();

const failed = results.filter((x) => !x).length;
console.log(failed ? \`\\nПровалено: \${failed}\` : \`\\nВсе проверки пройдены: \${results.length}/\${results.length}\`);
process.exit(failed ? 1 : 0);`, { filename: "chunked-test.mjs", collapsed: true }),
      code("text", `✓ результаты в порядке входа, воркер получает (элемент, индекс) — [0,11,22,33,44]
✓ порции по бюджету: 10 элементов по 3 мс при бюджете 10 мс → 2 уступки (после 4-го и 8-го) — {"yields":2,"progress":["4/10","8/10","10/10"]}
✓ элемент дороже бюджета не вызывает зависания: по уступке после каждого, но не после последнего — уступок: 3
✓ пустой массив → [] без уступок
✓ исключение воркера отклоняет обещание, остальные элементы не обрабатываются — вызовов: 4
✓ отмена на границе порции: отказ причиной сигнала, обработка остановлена (≤ 8 вызовов) — вызовов: 6
✓ уже отменённый сигнал: отказ без единого вызова воркера
✓ настоящая уступка: таймер сработал до завершения обработки — таймер,конец
✓ в Chromium: цикл целиком даёт длинные задачи (≥ 50 мс), порционная обработка — ни одной — {"непрерывный":1,"порциями":0,"циклДлился_мс":true}

Все проверки пройдены: 9/9`, { filename: "результат запуска (Node.js 22.22.0 и Chromium 141)" }),
    ]),

    section("syntax", [
      annotated(
        "js",
        `performance.mark("render:start");
renderList(items);
performance.mark("render:end");
performance.measure("render", "render:start", "render:end");

new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) report(entry.name, entry.duration);
}).observe({ type: "longtask", buffered: true });

await processInChunks(items, work, { budgetMs: 8, signal });`,
        [
          { line: [1, 4], text: "User Timing: две метки и измерение между ними — запись видна в `performance.getEntries()` и в DevTools." },
          { line: [6, 8], text: "`PerformanceObserver` получает записи асинхронно; тип `longtask` (Chromium) сообщает о задачах дольше 50 мс." },
          { line: 10, text: "Порционная обработка: бюджет порции в миллисекундах, отмена через сигнал; между порциями поток возвращается браузеру." },
        ],
        "syntax.js",
      ),
    ]),

    section("minimal-example", [
      p("Не запуская код, оцените число раскладок для каждого варианта (А–Г) на 100 строках и объясните, какие обращения заставляют браузер пересчитывать раскладку немедленно."),
      code("html", `<div id="list"></div>
<script>
  const list = document.getElementById("list");
  for (let i = 0; i < 100; i++) list.insertAdjacentHTML("beforeend", "<div class=row>строка " + i + "</div>");
  const rows = [...list.children];
  window.variants = {
    // А: чтение и запись вперемешку
    A() { for (const r of rows) { const h = r.offsetHeight; r.style.height = (h + 2) + "px"; } },
    // Б: сначала чтения, затем записи
    B() { const hs = rows.map((r) => r.offsetHeight); rows.forEach((r, i) => { r.style.height = (hs[i] + 2) + "px"; }); },
    // В: запись, затем одно чтение в конце
    V() { rows.forEach((r) => { r.style.color = "red"; }); void list.offsetHeight; },
    // Г: чтение getBoundingClientRect после каждой вставки
    G() { for (let i = 0; i < 100; i++) { list.append(document.createElement("i")); list.getBoundingClientRect(); } },
  };
</script>`, { filename: "x1-predict.html" }),
      code("text", `А: чтение и запись вперемешку                    → раскладок: 100
Б: сначала чтения, затем записи                  → раскладок: 1
В: записи стиля, одно чтение в конце             → раскладок: 1
Г: вставка и getBoundingClientRect в цикле       → раскладок: 100`, { filename: "замер в Chromium 141 (CDP LayoutCount)" }),
      ul(
        "**А (100):** `offsetHeight` после записи `style.height` на предыдущей итерации — каждое чтение требует актуальной раскладки.",
        "**Б (1):** все чтения подряд (раскладка актуальна один раз), затем все записи; пересчёт — один раз в конце кадра.",
        "**В (1):** запись `color` геометрию не меняет, одно чтение в конце; разница между записью и чтением — в наличии «грязной» раскладки.",
        "**Г (100):** добавление узла и `getBoundingClientRect()` в каждой итерации — классический thrashing.",
      ),
    ]),

    section("detailed-example", [
      p("`processInChunks(items, worker, { budgetMs, signal, onProgress, yieldFn, now })` — обработка массива без длинных задач: пока бюджет порции не исчерпан, воркер вызывается синхронно; затем поток отдаётся браузеру (`scheduler.yield` или `setTimeout`), на границе порции проверяется отмена и сообщается прогресс. Хотя бы один элемент обрабатывается в каждой порции, поэтому даже «дорогие» элементы не вызывают зависания; время и уступка внедряются параметрами, что делает логику проверяемой без реальных таймеров."),
      code("js", `// Обработка большого массива порциями: главный поток отдаётся браузеру между порциями, отмена и прогресс — по ходу.
const defaultYield = () => (globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise((resolve) => setTimeout(resolve)));

export async function processInChunks(items, worker, { budgetMs = 8, signal, onProgress, yieldFn = defaultYield, now = () => performance.now() } = {}) {
  signal?.throwIfAborted();
  const total = items.length;
  const results = new Array(total);
  let chunkStart = now();

  for (let i = 0; i < total; i++) {
    results[i] = worker(items[i], i);                  // исключение воркера прерывает всю обработку
    const done = i + 1;
    if (done < total && now() - chunkStart >= budgetMs) {   // бюджет порции исчерпан; одну запись обрабатываем всегда
      onProgress?.(done, total);
      await yieldFn();                                  // отдаём поток: браузер обработает ввод и отрисует кадр
      signal?.throwIfAborted();                         // отмена проверяется на границе порции
      chunkStart = now();
    }
  }
  onProgress?.(total, total);
  return results;
}`, { filename: "chunked.mjs", lineNumbers: true }),
    ]),

    section("analysis", [
      table(
        ["Решение в `processInChunks`", "Что даёт", "Что сломается без него (проверено мутацией теста)"],
        [
          ["Уступка `await yieldFn()` по бюджету", "Нет длинных задач; ввод и отрисовка успевают", "Без уступки: 5 красных проверок, в Chromium — длинная задача"],
          ["`signal?.throwIfAborted()` после уступки и до начала", "Отмена останавливает работу на границе порции; уже отменённый сигнал — без единого вызова", "Обработка продолжается после отмены (в тесте — десятки лишних вызовов)"],
          ["`done < total` перед уступкой", "Нет лишней паузы после последнего элемента", "Лишняя уступка в конце (красная проверка числа уступок)"],
          ["`chunkStart = now()` после уступки", "Бюджет считается заново для каждой порции", "Все последующие порции получают бюджет «ноль» — уступка после каждого элемента"],
          ["Всегда хотя бы один элемент за порцию", "Прогресс гарантирован при дорогих элементах", "Зависание при `budgetMs` меньше стоимости элемента"],
          ["`onProgress` на границах и в конце", "Индикатор прогресса без лишних обновлений", "Нет финального `total/total`"],
          ["Внедряемые `now` и `yieldFn`", "Тест без реальных таймеров, настоящий `scheduler.yield` — в продакшене", "Тесты зависят от скорости машины"],
        ],
        "Разбор processInChunks",
      ),
      ul(
        "**Выбор бюджета:** 4–8 мс на порцию оставляют запас на ввод и кадр (≈ 16 мс); меньше — больше накладных расходов на уступки.",
        "**Порции или Worker:** порции подходят, когда работа связана с DOM или ей нужен доступ к состоянию страницы; Worker — для чистых вычислений (нужно копирование/`transfer` данных).",
        "**Приоритет:** `scheduler.postTask` позволяет разделять `user-blocking`, `user-visible`, `background`; `scheduler.yield` продолжает работу без потери очереди.",
      ),
    ]),

    section("internals", [
      h("Конвейер кадра"),
      steps(
        [
          ["Ввод и задачи", "Обрабатываются события и макрозадачи (JavaScript выполняется здесь); длинная задача блокирует всё остальное."],
          ["rAF", "Колбэки `requestAnimationFrame` выполняются прямо перед расчётом стилей — место для визуальных обновлений."],
          ["Стили и раскладка", "Пересчёт стилей (Recalculate Style) и расчёт геометрии (Layout); при «грязной» раскладке и обращении к геометрии из JS они выполняются **немедленно**."],
          ["Отрисовка и композитинг", "Paint создаёт список команд, композитор собирает слои; анимации `transform`/`opacity` идут отдельно от главного потока."],
        ],
        "Что происходит за кадр",
      ),
      h("Почему чтение геометрии дорого"),
      p("Раскладка вычисляется лениво: изменения стилей лишь помечают её «грязной». Чтение `offsetWidth` требует актуальной геометрии, поэтому браузер выполняет раскладку синхронно (замер: 200 чтений после 200 записей — 200 раскладок). Если чтения и записи сгруппированы, «грязная» раскладка пересчитывается один раз."),
      h("Inline-кэши и формы"),
      p("V8 запоминает, по какой форме объекта искали свойство, и в следующий раз проверяет форму и берёт значение по готовому смещению. Если на месте вызова встречается одна форма — доступ быстрый (monomorphic), несколько — медленнее, много — общий путь. Поэтому единообразное создание объектов и порядок присваиваний важны для «горячего» кода (замер: порядок свойств и дополнительные свойства меняют форму, `delete` — режим хранения)."),
      h("Виды элементов массива"),
      p("V8 хранит массив компактно, пока тип элементов однороден, и использует специальные представления для малых целых (Smi), чисел с плавающей точкой (Double), произвольных значений (Object) и «дырявых» массивов; переходы идут только в сторону более общего вида (замер: после `push(4.5)` и строки обратно к Smi не вернуться). Это объясняет, почему лучше не смешивать типы в больших массивах."),
      h("Оценка стоимости"),
      p("Время ≈ число операций × стоимость операции. Алгоритмическая сложность задаёт число операций (замер: O(n²) растёт более чем в 2,5 раза при удвоении), структура данных — стоимость (хэш-таблица `Set` против линейного поиска). Микрооптимизации меняют лишь константу и редко важны, пока асимптотика плохая."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Чередовать чтение и запись геометрии"),
      wrongRight(
        "js",
        {
          code: `
            for (const row of rows) {
              const w = row.offsetWidth;                // чтение: нужна актуальная раскладка
              row.style.width = (w + 1) + "px";         // запись: раскладка снова «грязная»
            }
          `,
          note: "Замер: 200 строк — 200 принудительных раскладок.",
        },
        {
          code: `
            const widths = rows.map((row) => row.offsetWidth);                      // все чтения
            rows.forEach((row, i) => { row.style.width = (widths[i] + 1) + "px"; }); // все записи
          `,
          note: "Одна раскладка вместо 200 (замер).",
        },
      ),
      h("Ошибка 2. Тяжёлый цикл в обработчике"),
      p("150 мс работы одним куском блокируют ввод и отрисовку (замер: `longtask`, отклик ≥ 100 мс). Разбивайте на порции (`processInChunks`), используйте `scheduler.yield` или переносите в Worker."),
      h("Ошибка 3. Оптимизировать без измерений"),
      p("Одиночные замеры одного и того же кода различаются (замер), а микробенчмарки без прогрева и повторов вводят в заблуждение. Измеряйте до и после, в реальной среде, по медиане и p95."),
      h("Ошибка 4. `includes`/`indexOf` в цикле по большому массиву"),
      p("Это O(n²): вход вырос вдвое — время более чем в 2,5 раза (замер). Постройте `Set`/`Map` один раз и ищите за O(1)."),
      h("Ошибка 5. Анимировать `width`, `height`, `top`, `left`"),
      p("Они меняют геометрию и запускают раскладку (замер: 1 раскладка на изменение); `transform` и `opacity` не трогают раскладку (0) и идут на композиторе."),
      h("Ошибка 6. Контент без зарезервированного места"),
      p("Картинки без размеров, динамически вставляемые блоки выше видимого текста вызывают сдвиг раскладки (замер: `layout-shift` с `value > 0`). Резервируйте место: `width`/`height`, `aspect-ratio`, `min-height`."),
      h("Ошибка 7. `delete` и смешанные массивы в горячем коде"),
      p("`delete obj.x` переводит объект в словарный режим (замер), `push(4.5)` и `push(\"строка\")` ухудшают вид массива безвозвратно. Присваивайте `null`/`undefined`, держите массивы однородными."),
      h("Ошибка 8. Копировать большие буферы в Worker"),
      p("`postMessage(buf)` копирует память; `postMessage(buf, [buf])` передаёт без копирования (замер: после переноса `byteLength` равна 0)."),
      h("Ошибка 9. `debounce` вместо `throttle` (и наоборот)"),
      p("Для поля поиска нужен `debounce` (дождаться паузы), для прокрутки и `resize` — `throttle` (не чаще раза в интервал) или обработка в `requestAnimationFrame`."),
      h("Ошибка 10. Предварительная оптимизация всего подряд"),
      p("Оптимизируйте узкие места, найденные профилем; остальной код пишите читаемо. Сложность без выигрыша — это долг."),
    ]),

    section("antipatterns", [
      ul(
        "**«Оптимизация по ощущениям»** и перенос приёмов из чужих микробенчмарков.",
        "**Синхронные тяжёлые операции в обработчиках ввода** (`input`, `scroll`, `click`).",
        "**Обработчик `scroll`/`resize`/`mousemove` без `throttle`/`rAF`/пассивности.**",
        "**Чтение геометрии в циклах** и обращения к `getComputedStyle` после каждой записи.",
        "**Рендер всего списка из тысяч элементов** без виртуализации и порционной вставки.",
        "**Вложенные циклы и `includes` на больших массивах;** повторные вычисления одного и того же внутри цикла.",
        "**Глубокое клонирование через `JSON.parse(JSON.stringify(...))`** больших структур в горячем пути.",
        "**Загрузка всего кода сразу** (один огромный бандл) без разделения и `defer`.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Определите бюджет и метрики** (INP, LCP, CLS, длительность задач), собирайте реальные данные (RUM) и лабораторные профили.",
        "**Профилируйте:** DevTools → Performance (Long tasks, Layout/Recalculate Style, Event Timing), Lighthouse, `performance.mark/measure` в коде.",
        "**Не блокируйте главный поток:** порции, `scheduler.yield`, Worker; обработчики ввода — короткие.",
        "**Группируйте чтения и записи DOM,** вставляйте пачками (`DocumentFragment`, `replaceChildren`), анимируйте `transform`/`opacity`.",
        "**Выбирайте структуры и алгоритмы:** `Set`/`Map` для поиска, предвычисление, индексы, кэширование результатов (с лимитом).",
        "**Резервируйте место для контента** (размеры изображений, `aspect-ratio`), не вставляйте блоки над уже показанным.",
        "**Debounce для ввода, throttle/rAF для прокрутки;** пассивные слушатели для касаний и колеса.",
        "**Измеряйте после каждого изменения** и фиксируйте результат (тест, отчёт CI), иначе регрессии вернутся.",
      ),
      tip("В Performance DevTools включите «Screenshots» и «Web Vitals»: на треке Timings видны LCP/CLS, а красные углы задач — длинные задачи; клик по задаче покажет Bottom-Up по функциям. Для проверки раскладки смотрите фиолетовые блоки Layout и их количество в кадре."),
    ]),

    section("edge-cases", [
      h("`requestAnimationFrame` и скрытые вкладки"),
      p("В скрытых вкладках `requestAnimationFrame` не вызывается, а таймеры замедляются: не используйте их как источник реального времени (считайте по `performance.now()` от момента старта)."),
      h("Throttling браузером и энергосбережение"),
      p("Браузеры ограничивают таймеры и фоновую активность для вкладок в фоне и при низком заряде; не закладывайтесь на точность `setTimeout`/`setInterval` (см. [цикл событий](/learn/js/event-loop))."),
      h("Измерение в разработке и в продакшене"),
      p("Разработческие сборки, расширения браузера и открытые DevTools искажают результат; профилируйте в production-сборке в режиме инкогнито, на средних устройствах (замедление CPU в DevTools) и по реальным данным (RUM)."),
      h("Worker и накладные расходы"),
      p("Создание Worker и передача данных стоят времени и памяти; для коротких задач (< 5–10 мс) выгоднее порции на главном потоке. Пул воркеров ограничивайте числом ядер (`navigator.hardwareConcurrency`)."),
      h("Сборка мусора и аллокации"),
      p("Горячие циклы, создающие много временных объектов, нагружают сборщик мусора (паузы, см. [Память и сборка мусора](/learn/js/memory-gc)); переиспользуйте объекты и буферы, когда профиль показывает давление на GC."),
      h("Ложная экономия: преждевременная оптимизация формы"),
      p("Приёмы про формы и виды элементов дают заметный эффект только на горячем коде с миллионами обращений; в обычном приложении они уступают в значимости алгоритмам, сетевым запросам и размеру бандла."),
    ]),

    section("related", [
      ul(
        "[Цикл событий](/learn/js/event-loop) — почему длинная задача блокирует ввод, и порядок задач.",
        "[Память и сборка мусора](/learn/js/memory-gc) — аллокации, утечки, паузы GC.",
        "[DOM и события](/learn/js/dom-events) — делегирование, пассивные слушатели, фрагменты.",
        "[Производительность рендеринга CSS](/learn/css/rendering-pipeline) — конвейер рендеринга и композитинг.",
        "[Производительность HTML](/learn/html/html-performance) — загрузка ресурсов и критический путь.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Обработчик ввода: тяжёлая работа, thrashing и O(n²)",
          code: `
            input.addEventListener("input", () => {
              const unique = [];
              for (const item of items) if (!unique.includes(item.id)) unique.push(item.id);   // O(n²)
              for (const row of rows) {
                const h = row.offsetHeight;                                                    // чтение
                row.style.height = h + 2 + "px";                                               // запись
              }
              render(unique);                                                                  // всё — в одной длинной задаче
            });
          `,
          note: "Замеры: `includes` в цикле растёт квадратично, чередование чтения и записи даёт сотни раскладок, длинная задача блокирует ввод.",
        },
        {
          title: "Debounce, Set, разделение чтений и записей, порции",
          code: `
            const run = debounce(async () => {
              const unique = [...new Set(items.map((i) => i.id))];                              // O(n)
              const heights = rows.map((row) => row.offsetHeight);                              // все чтения
              rows.forEach((row, i) => { row.style.height = heights[i] + 2 + "px"; });          // все записи
              await processInChunks(unique, renderOne, { budgetMs: 8, signal });                // без длинных задач
            }, 150);
            input.addEventListener("input", run);
          `,
          note: "Меньше запусков (debounce), линейная сложность, одна раскладка, главный поток свободен между порциями.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.performance.ex1",
      title: "Сколько раскладок",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Для каждого из четырёх вариантов (А–Г) на 100 строках оцените число раскладок и назовите причину. Затем сверьтесь с замером."),
        code("html", `<div id="list"></div>
<script>
  const list = document.getElementById("list");
  for (let i = 0; i < 100; i++) list.insertAdjacentHTML("beforeend", "<div class=row>строка " + i + "</div>");
  const rows = [...list.children];
  window.variants = {
    // А: чтение и запись вперемешку
    A() { for (const r of rows) { const h = r.offsetHeight; r.style.height = (h + 2) + "px"; } },
    // Б: сначала чтения, затем записи
    B() { const hs = rows.map((r) => r.offsetHeight); rows.forEach((r, i) => { r.style.height = (hs[i] + 2) + "px"; }); },
    // В: запись, затем одно чтение в конце
    V() { rows.forEach((r) => { r.style.color = "red"; }); void list.offsetHeight; },
    // Г: чтение getBoundingClientRect после каждой вставки
    G() { for (let i = 0; i < 100; i++) { list.append(document.createElement("i")); list.getBoundingClientRect(); } },
  };
</script>`, { filename: "x1-predict.html" }),
      ],
      hints: ["Что делает чтение `offsetHeight`, если раскладка «грязная»?", "Меняет ли запись `color` геометрию?"],
      checks: ["А и Г — по 100", "Б и В — по 1", "Объяснено, что чтение геометрии форсирует раскладку"],
      solution: [
        code("text", `А: чтение и запись вперемешку                    → раскладок: 100
Б: сначала чтения, затем записи                  → раскладок: 1
В: записи стиля, одно чтение в конце             → раскладок: 1
Г: вставка и getBoundingClientRect в цикле       → раскладок: 100`, { filename: "замер в Chromium 141" }),
        p("Чтение геометрии (`offsetHeight`, `getBoundingClientRect`) требует актуальной раскладки: если после предыдущей записи она «грязная», браузер пересчитывает её немедленно. В вариантах А и Г чтение идёт после каждой записи — 100 раскладок; в Б чтения собраны вместе до записей, в В записи не меняют геометрию, а чтение одно — по одной раскладке."),
      ],
    }),
    exercise({
      id: "js.performance.ex2",
      title: "Уникальные идентификаторы замедляются с ростом данных",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Функция `uniqueSlow` работает быстро на тестовых данных, но на реальных (десятки тысяч записей) занимает секунды. По замеру из раздела «Алгоритмы и структуры данных» объясните причину, назовите сложность и исправьте код так, чтобы результат (и порядок) остался прежним."),
        code("js", `const uniqueSlow = (xs) => { const out = []; for (const x of xs) if (!out.includes(x)) out.push(x); return out; };`, { filename: "uniqueSlow.js" }),
      ],
      hints: ["Сколько сравнений делает `includes` на i-м элементе?", "Какая структура проверяет принадлежность за O(1) и сохраняет порядок вставки?"],
      checks: ["Названа сложность O(n²)", "Решение через `Set`", "Порядок элементов сохранён"],
      solution: [
        code("text", `результаты совпадают                                               → true
uniqueSlow: вход вырос вдвое → время выросло более чем в 2,5 раза  → true
на 8000 элементах Set быстрее includes-цикла более чем в 10 раз    → true
пересечение: результаты совпадают, Set быстрее более чем в 10 раз  → [true,true]
вынос неизменной работы из цикла: тот же результат, быстрее в 2 и более раза → [true,true]
цепочка map/filter/reduce и один цикл: результаты совпадают        → true`, { filename: "вывод Node.js 22.22.0" }),
        code("js", `const uniqueFast = (xs) => [...new Set(xs)];            // O(n), порядок первой вставки сохраняется`, { filename: "uniqueFast.js" }),
        p("`includes` перебирает `out` целиком на каждом элементе: сумма сравнений растёт квадратично (замер: вход вдвое больше — время более чем в 2,5 раза). `Set` проверяет наличие за O(1) в среднем и хранит значения в порядке вставки, поэтому `[...new Set(xs)]` даёт тот же результат за O(n)."),
      ],
    }),
    exercise({
      id: "js.performance.ex3",
      title: "debounce и throttle",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Реализуйте `debounce(fn, wait, { leading, trailing, maxWait })` с методами `cancel()`, `flush()`, `pending()` и `throttle(fn, wait)` на его основе. Требования: `trailing` по умолчанию; при `leading` без серии вызов выполняется один раз; `maxWait` гарантирует выполнение при непрерывных вызовах; `this` и аргументы сохраняются; возвращается результат последнего выполнения; `flush()` выполняет отложенный вызов сразу."),
      ],
      hints: ["Что нужно хранить между вызовами: время последнего вызова, последнего запуска, аргументы?", "Как отличить одиночный `leading`-вызов от серии?", "Чем `throttle` отличается от `debounce` с `maxWait`?"],
      checks: ["Все 12 проверок теста проходят (подмена таймеров `node:test`)", "`throttle` = `debounce` с `leading`, `trailing` и `maxWait = wait`", "`cancel`/`flush`/`pending` работают корректно"],
      solution: [
        code("js", `// debounce и throttle с leading/trailing, maxWait, cancel, flush. Время берётся из setTimeout и Date.now (подменяемы в тестах).
export function debounce(fn, wait, { leading = false, trailing = true, maxWait } = {}) {
  let timer = null, lastArgs, lastThis, lastCallTime, lastInvokeTime = 0, result;
  const hasMax = maxWait !== undefined;
  maxWait = hasMax ? Math.max(maxWait, wait) : undefined;

  function invoke(time) {
    const args = lastArgs, thisArg = lastThis;
    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = fn.apply(thisArg, args);
    return result;
  }
  function remaining(time) {
    const sinceCall = time - lastCallTime, sinceInvoke = time - lastInvokeTime;
    const untilWait = wait - sinceCall;
    return hasMax ? Math.min(untilWait, maxWait - sinceInvoke) : untilWait;
  }
  function shouldInvoke(time) {
    return lastCallTime === undefined || time - lastCallTime >= wait || time - lastCallTime < 0 || (hasMax && time - lastInvokeTime >= maxWait);
  }
  function onTimer() {
    const time = Date.now();
    if (shouldInvoke(time)) return trailingEdge(time);
    timer = setTimeout(onTimer, remaining(time));
  }
  function trailingEdge(time) {
    timer = null;
    if (trailing && lastArgs) return invoke(time);
    lastArgs = lastThis = undefined;
    return result;
  }
  function leadingEdge(time) {
    lastInvokeTime = time;
    timer = setTimeout(onTimer, wait);
    return leading ? invoke(time) : result;
  }

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    lastArgs = args; lastThis = this; lastCallTime = time;
    if (isInvoking) {
      if (timer === null) return leadingEdge(time);
    }
    timer ??= setTimeout(onTimer, wait);
    return result;
  }
  debounced.cancel = () => { clearTimeout(timer); timer = null; lastArgs = lastThis = lastCallTime = undefined; lastInvokeTime = 0; };
  debounced.flush = () => (timer === null ? result : trailingEdge(Date.now()));
  debounced.pending = () => timer !== null;
  return debounced;
}

export const throttle = (fn, wait, options = {}) => debounce(fn, wait, { leading: true, trailing: true, ...options, maxWait: wait });`, { filename: "debounce.mjs", lineNumbers: true }),
        code("js", `import { mock } from "node:test";
const { debounce, throttle } = await import(new URL(process.argv[2] ?? "debounce.mjs", import.meta.url));

mock.timers.enable({ apis: ["setTimeout", "Date"] });
const results = [];
const check = (name, ok, info = "") => { results.push(ok); console.log((ok ? "✓ " : "✗ ") + name + (info ? " — " + info : "")); };
const tick = (ms) => mock.timers.tick(ms);
const recorder = () => { const calls = []; const fn = function (...args) { calls.push({ args, self: this }); return calls.length; }; return { calls, fn }; };

// 1. trailing (по умолчанию): серия вызовов → один вызов в конце с последними аргументами
let r = recorder(), d = debounce(r.fn, 100);
d(1); tick(50); d(2); tick(50); d(3);
const early = r.calls.length;
tick(99); const almost = r.calls.length; tick(1);
check("trailing: серия вызовов быстрее wait → один вызов после паузы, с последними аргументами", early === 0 && almost === 0 && r.calls.length === 1 && r.calls[0].args[0] === 3, JSON.stringify(r.calls.map((c) => c.args)));

// 2. Пауза больше wait → новый вызов
d(4); tick(100);
check("после паузы цикл повторяется", r.calls.length === 2 && r.calls[1].args[0] === 4);

// 3. leading
r = recorder(); d = debounce(r.fn, 100, { leading: true, trailing: false });
d("a"); d("b"); tick(50); d("c");
const leadOnly = r.calls.map((c) => c.args[0]).join();
tick(100); d("d");
check("leading без trailing: первый вызов сразу, остальные в окне пропущены, после паузы — снова сразу", leadOnly === "a" && r.calls.map((c) => c.args[0]).join() === "a,d", r.calls.map((c) => c.args[0]).join());

// 4. leading + trailing: хвостовой вызов только если вызовов было больше одного
r = recorder(); d = debounce(r.fn, 100, { leading: true, trailing: true });
d("x"); tick(100);
const single = r.calls.length;
d("a"); d("b"); tick(100);
check("leading + trailing: одиночный вызов не дублируется, при серии — вызов в начале и в конце", single === 1 && r.calls.map((c) => c.args[0]).join() === "x,a,b", r.calls.map((c) => c.args[0]).join());

// 5. maxWait
r = recorder(); d = debounce(r.fn, 100, { maxWait: 250 });
for (let i = 0; i < 12; i++) { d(i); tick(50); }       // непрерывные вызовы 600 мс
const during = r.calls.length;
tick(100);
check("maxWait: при непрерывных вызовах функция выполняется не реже, чем раз в maxWait", during >= 2 && r.calls.length >= during + 1, \`во время: \${during}, всего: \${r.calls.length}\`);

// 6. cancel и pending
r = recorder(); d = debounce(r.fn, 100);
d(1); const pending1 = d.pending(); d.cancel(); tick(500);
check("cancel(): отложенный вызов отменён, pending() отражает состояние", pending1 === true && d.pending() === false && r.calls.length === 0);

// 7. flush
r = recorder(); d = debounce(r.fn, 100);
d("f"); const flushed = d.flush(); tick(500);
check("flush(): выполняет отложенный вызов сразу, второго вызова нет, возвращает результат", flushed === 1 && r.calls.length === 1 && d.pending() === false);
check("flush() без отложенного вызова ничего не делает", (() => { const rr = recorder(); const dd = debounce(rr.fn, 50); dd.flush(); return rr.calls.length === 0; })());

// 8. this и аргументы
r = recorder(); const obj = { name: "obj", run: debounce(function (...a) { return r.fn.apply(this, a); }, 10) };
obj.run(1, 2); tick(10);
check("this и аргументы передаются в исходную функцию", r.calls[0].self === obj && r.calls[0].args.join() === "1,2");

// 9. Возвращаемое значение debounced — результат последнего выполнения
r = recorder(); d = debounce(r.fn, 100);
const first = d("a"); tick(100); const second = d("b");
check("debounced возвращает результат последнего выполнения (до первого — undefined)", first === undefined && second === 1);

// 10. throttle
r = recorder(); const t = throttle(r.fn, 100);
t(1); t(2); t(3); tick(50); t(4); tick(50);
const got = r.calls.map((c) => c.args[0]).join();
tick(100);
check("throttle: первый вызов сразу, затем не чаще раза в интервал (последние аргументы окна — в конце)", got === "1,4" && r.calls.length === 2, got);

// 11. Нет «хвостов»: после выполнения таймеров не остаётся
r = recorder(); d = debounce(r.fn, 100, { maxWait: 300 });
d(1); tick(100);
check("после срабатывания нет отложенных таймеров", d.pending() === false);

mock.timers.reset();
const failed = results.filter((x) => !x).length;
console.log(failed ? \`\\nПровалено: \${failed}\` : \`\\nВсе проверки пройдены: \${results.length}/\${results.length}\`);
process.exit(failed ? 1 : 0);`, { filename: "debounce-test.mjs", collapsed: true }),
        code("text", `✓ trailing: серия вызовов быстрее wait → один вызов после паузы, с последними аргументами — [[3]]
✓ после паузы цикл повторяется
✓ leading без trailing: первый вызов сразу, остальные в окне пропущены, после паузы — снова сразу — a,d
✓ leading + trailing: одиночный вызов не дублируется, при серии — вызов в начале и в конце — x,a,b
✓ maxWait: при непрерывных вызовах функция выполняется не реже, чем раз в maxWait — во время: 2, всего: 3
✓ cancel(): отложенный вызов отменён, pending() отражает состояние
✓ flush(): выполняет отложенный вызов сразу, второго вызова нет, возвращает результат
✓ flush() без отложенного вызова ничего не делает
✓ this и аргументы передаются в исходную функцию
✓ debounced возвращает результат последнего выполнения (до первого — undefined)
✓ throttle: первый вызов сразу, затем не чаще раза в интервал (последние аргументы окна — в конце) — 1,4
✓ после срабатывания нет отложенных таймеров

Все проверки пройдены: 12/12`, { filename: "результат запуска (Node.js 22.22.0, `mock.timers` для `setTimeout` и `Date`)" }),
        p("Состояние: таймер, последние аргументы и `this`, время последнего вызова и последнего запуска. На каждом вызове решаем, нужно ли выполнять немедленно (`leading`) или отложить; таймер при срабатывании сверяется с текущим временем и либо выполняет хвостовой вызов, либо переустанавливается на остаток. `throttle` — это `debounce` с `leading`, `trailing` и `maxWait`, равным интервалу. Проверено мутациями: потеря `leading`, `trailing`, `flush`, сохранения `this` и `maxWait` у `throttle` обнаруживаются тестом."),
      ],
    }),
  ],

  challenge: {
    id: "js.performance.challenge",
    title: "processInChunks: обработка без длинных задач",
    scenario: [
      p("Страница импортирует таблицу на 400 тысяч строк: при нажатии кнопки вкладка замирает на несколько секунд, анимации стоят, ввод не обрабатывается. Нужно обрабатывать данные так, чтобы интерфейс оставался отзывчивым, прогресс отображался, а обработку можно было отменить."),
    ],
    requirements: [
      "`processInChunks(items, worker, { budgetMs = 8, signal, onProgress, yieldFn, now })` возвращает обещание массива результатов в порядке входа; `worker(item, index)` вызывается синхронно",
      "Пока бюджет порции не исчерпан, обработка идёт без пауз; затем (кроме последнего элемента) вызывается `onProgress(done, total)` и `await yieldFn()`; в каждой порции обрабатывается минимум один элемент",
      "По умолчанию уступка — `scheduler.yield()`, при отсутствии — `setTimeout`; `now` по умолчанию — `performance.now()`",
      "Отмена: `signal.throwIfAborted()` до начала и после каждой уступки (обещание отклоняется причиной сигнала, воркер больше не вызывается)",
      "Исключение воркера отклоняет обещание и прекращает обработку; пустой вход — немедленный `[]`; в конце всегда `onProgress(total, total)`",
    ],
    constraints: [
      "Без внешних библиотек; время и уступка внедряются параметрами",
      "Не использовать глобальное состояние",
    ],
    acceptance: [
      "Все 9 проверок теста проходят (3 запуска подряд), включая проверку в Chromium: цикл целиком даёт длинную задачу, порционная обработка — ни одной",
      "Мутации — без уступки, без проверки отмены (после уступки и до начала), с лишней уступкой в конце, без пересчёта бюджета, без финального `onProgress` — обнаруживаются тестом",
    ],
    hints: [
      "Как гарантировать, что при дорогом элементе вы всё равно продвинетесь вперёд?",
      "В какой момент нужно проверять отмену, чтобы не делать лишнюю работу?",
      "Как проверить логику порций без реальных таймеров?",
    ],
    solution: [
      code("js", `// Обработка большого массива порциями: главный поток отдаётся браузеру между порциями, отмена и прогресс — по ходу.
const defaultYield = () => (globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise((resolve) => setTimeout(resolve)));

export async function processInChunks(items, worker, { budgetMs = 8, signal, onProgress, yieldFn = defaultYield, now = () => performance.now() } = {}) {
  signal?.throwIfAborted();
  const total = items.length;
  const results = new Array(total);
  let chunkStart = now();

  for (let i = 0; i < total; i++) {
    results[i] = worker(items[i], i);                  // исключение воркера прерывает всю обработку
    const done = i + 1;
    if (done < total && now() - chunkStart >= budgetMs) {   // бюджет порции исчерпан; одну запись обрабатываем всегда
      onProgress?.(done, total);
      await yieldFn();                                  // отдаём поток: браузер обработает ввод и отрисует кадр
      signal?.throwIfAborted();                         // отмена проверяется на границе порции
      chunkStart = now();
    }
  }
  onProgress?.(total, total);
  return results;
}`, { filename: "chunked.mjs", lineNumbers: true }),
      code("text", `✓ результаты в порядке входа, воркер получает (элемент, индекс) — [0,11,22,33,44]
✓ порции по бюджету: 10 элементов по 3 мс при бюджете 10 мс → 2 уступки (после 4-го и 8-го) — {"yields":2,"progress":["4/10","8/10","10/10"]}
✓ элемент дороже бюджета не вызывает зависания: по уступке после каждого, но не после последнего — уступок: 3
✓ пустой массив → [] без уступок
✓ исключение воркера отклоняет обещание, остальные элементы не обрабатываются — вызовов: 4
✓ отмена на границе порции: отказ причиной сигнала, обработка остановлена (≤ 8 вызовов) — вызовов: 6
✓ уже отменённый сигнал: отказ без единого вызова воркера
✓ настоящая уступка: таймер сработал до завершения обработки — таймер,конец
✓ в Chromium: цикл целиком даёт длинные задачи (≥ 50 мс), порционная обработка — ни одной — {"непрерывный":1,"порциями":0,"циклДлился_мс":true}

Все проверки пройдены: 9/9`, { filename: "результат запуска (Node.js 22.22.0 и Chromium 141)" }),
      p("Цикл вызывает воркер для каждого элемента и после каждого проверяет бюджет по `now()`; при превышении сообщает прогресс, уступает (`yieldFn`), проверяет отмену и начинает новый отсчёт. Условие `done < total` исключает лишнюю паузу в конце, а проверка бюджета **после** обработки элемента гарантирует прогресс. Поведение в браузере подтверждено наблюдателем `longtask`: цикл на 1,5 млн элементов даёт длинную задачу, обработка порциями — нет. Проверено мутациями: без уступки красны 5 проверок, без проверки отмены — 2, без пересчёта бюджета — 2."),
    ],
  },

  interview: [
    iq("js.performance.i1", "basic", "Что такое длинная задача и чем она вредна?", [
      ul(
        "Задача главного потока длительностью более 50 мс; пока она выполняется, браузер не обрабатывает ввод и не рисует кадры.",
        "Симптомы: «замерзание» интерфейса, высокая задержка отклика (INP), пропуск кадров.",
        "Лечение: разбить на порции (`setTimeout`/`scheduler.yield`), вынести в Worker, упростить алгоритм.",
      ),
    ]),
    iq("js.performance.i2", "basic", "Зачем нужен debounce и чем он отличается от throttle?", [
      ul(
        "Debounce откладывает вызов до паузы между событиями (поле поиска, `resize`): одна обработка после серии.",
        "Throttle ограничивает частоту: не чаще раза в интервал (прокрутка, перемещение мыши).",
        "Оба возвращают обёртку; полезны `cancel`, `flush`, опции `leading`/`trailing`/`maxWait`.",
      ),
    ]),
    iq("js.performance.i3", "intermediate", "Что такое layout thrashing и как его избежать?", [
      ul(
        "Чередование чтения геометрии (`offsetWidth`, `getBoundingClientRect`) и записи стилей заставляет браузер пересчитывать раскладку на каждой итерации (замер: 200 строк — 200 раскладок).",
        "Решение: сначала все чтения, потом все записи; вставка пачкой (`DocumentFragment`, `replaceChildren`); визуальные обновления в `requestAnimationFrame`.",
        "Анимировать `transform` и `opacity`, а не `width`/`top` (замер: 0 раскладок против 1).",
      ),
    ]),
    iq("js.performance.i4", "intermediate", "Как правильно измерять производительность кода?", [
      ul(
        "Реальная среда и реальные данные; прогрев; множество повторов; медиана и p95 вместо единичного замера (одиночные замеры одного кода различаются).",
        "`performance.now`, `mark`/`measure`, профилировщик DevTools; сравнение вариантов в одном запуске.",
        "Следить за сборкой мусора, JIT и фоновой нагрузкой; фиксировать результаты и сравнивать до и после.",
      ),
    ]),
    iq("js.performance.i5", "intermediate", "Когда стоит использовать Web Worker?", [
      ul(
        "Для тяжёлых вычислений без DOM (парсинг больших данных, сжатие, криптография, обработка изображений): главный поток остаётся свободным (замер: пауза < 100 мс против ≥ 200 мс).",
        "Данные копируются (структурное клонирование) или передаются (`transfer`); функции передавать нельзя.",
        "Не для коротких задач: создание потока и передача данных дороги; число воркеров — по числу ядер.",
      ),
    ]),
    iq("js.performance.i6", "advanced", "Почему `includes` в цикле медленный и чем его заменить?", [
      ul(
        "`includes` линейный, цикл вокруг него даёт O(n²): при удвоении входа время растёт более чем в 2,5 раза; на 8000 элементах `Set` быстрее более чем в 10 раз.",
        "Замена: построить `Set`/`Map` один раз и проверять наличие за O(1); для упорядоченных данных — сортировка и двоичный поиск.",
        "Всегда сначала выясняйте асимптотику и профиль, затем микрооптимизируйте.",
      ),
    ]),
    iq("js.performance.i7", "engineering", "Как организовать мониторинг производительности веб-приложения?", [
      ul(
        "Метрики пользовательского опыта: LCP, INP, CLS (Web Vitals) — собирать у реальных пользователей (RUM), сегментировать по устройствам и сетям.",
        "Лабораторные проверки в CI: Lighthouse, бюджеты размера бандла и времени, тесты на длинные задачи и число раскладок в критичных сценариях.",
        "Профилирование по требованию (DevTools), `performance.mark/measure` для ключевых действий; алерты при регрессиях; связывание с релизами.",
      ),
    ]),
    iq("js.performance.i8", "debugging", "Страница подвисает при вводе в поле поиска. Как найти причину?", [
      ul(
        "Записать профиль (Performance): найти длинные задачи при событии `input`; посмотреть Bottom-Up по функциям и количество Layout/Recalculate Style.",
        "Проверить типичные причины: тяжёлая синхронная обработка в обработчике, чтение и запись DOM вперемешку, рендер всего списка, запросы на каждое нажатие.",
        "Исправить: `debounce`, порции/Worker, `Set`/индексы, виртуализация списка; проверить результат тем же профилем и закрепить метрикой.",
      ),
    ]),
  ],

  exam: [
    mcq("js.performance.e1", "foundation", "Какая длительность задачи главного потока считается «длинной»?", ["Более 16 мс", "Более 200 мс", "Более 50 мс", "Более 1 с"], 2, "Long Tasks API сообщает о задачах дольше 50 мс; кадр при 60 Гц — около 16 мс, но «длинной» называют задачу от 50 мс."),
    mcq("js.performance.e2", "foundation", "Что лучше для анимации положения элемента?", ["`transform`", "`width`", "`left`", "`margin`"], 0, "`transform` не меняет раскладку (замер: 0 раскладок) и идёт на композиторе; остальные свойства запускают раскладку."),
    mcq("js.performance.e3", "intermediate", "Что даст такой цикл на 200 строках: `for (const r of rows) { const w = r.offsetWidth; r.style.width = w + 1 + \"px\"; }`?", ["Одну раскладку", "Зависит только от размера экрана", "Ноль раскладок", "Около 200 раскладок"], 3, "Каждое чтение после записи форсирует раскладку (замер: 200 раскладок против 1 при разделении чтений и записей)."),
    mcq("js.performance.e4", "intermediate", "Какое утверждение о `debounce` верно?", ["Выполняет функцию не чаще раза в интервал", "Откладывает выполнение до паузы между вызовами", "Всегда выполняет функцию сразу", "Заменяет `requestAnimationFrame`"], 1, "Debounce ждёт паузу; ограничение частоты — это throttle."),
    mcq("js.performance.e5", "intermediate", "Что верно про `postMessage` для `ArrayBuffer`? Выберите все.", ["Без `transfer` буфер копируется", "С `transfer` исходный буфер становится пустым (`byteLength` 0)", "Функции передаются без ограничений", "Копирование и перенос одинаково быстры для больших буферов"], [0, 1], "Структурное клонирование копирует; перенос отсоединяет исходник (замер); функции вызывают `DataCloneError`."),
    mcq("js.performance.e6", "advanced", "Почему единичный замер времени выполнения ненадёжен?", ["`performance.now()` неточен", "Браузер кэширует результат функции", "`Date.now()` точнее", "Влияют JIT, сборка мусора, фоновая нагрузка и кэши — результаты различаются от запуска к запуску"], 3, "Замер: пять одиночных замеров одного кода различались; нужны прогрев, повторы и статистика (медиана, p95)."),
    mcq("js.performance.e7", "advanced", "Что делает `delete obj.x` с внутренним представлением объекта в V8?", ["Ничего", "Ускоряет доступ к остальным свойствам", "Переводит объект в медленный словарный режим", "Копирует объект"], 2, "`%HasFastProperties` после `delete` — `false` (замер); `obj.x = undefined` сохраняет быстрые свойства."),
    open("js.performance.e8", "intermediate", "Объясните, как вы найдёте и устраните причину подвисаний интерфейса при обработке большого списка.", [
      ul(
        "Воспроизвести и записать профиль (Performance): найти длинные задачи, раскладки, пересчёты стилей; определить функции с наибольшим временем.",
        "Выявить причину: алгоритм O(n²), thrashing, рендер всех элементов, синхронная тяжёлая работа в обработчике.",
        "Исправить: структуры данных (`Set`/`Map`), разделение чтений и записей, порционная обработка/Worker, виртуализация списка, `debounce`.",
        "Проверить тем же профилем и закрепить метрикой или тестом.",
      ),
    ], ["Описан профиль и поиск длинных задач", "Названы типичные причины", "Названы исправления", "Названа проверка результата"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.performance.m1", "intermediate", "Какой вариант не вызовет принудительной раскладки после записи `el.style.width = \"100px\"`?", ["`el.offsetWidth`", "Чтение `el.textContent`", "`getComputedStyle(el).width`", "`el.getBoundingClientRect()`"], 1, "Чтение геометрии и вычисленных значений форсирует раскладку; `textContent` от раскладки не зависит."),
    mcq("js.performance.m2", "advanced", "Почему порционная обработка не должна опираться на «пропуск кадров» как единственный механизм?", ["Нужен явный бюджет и уступка потока, чтобы ввод и отрисовка успевали между порциями", "Кадры всегда идеальны", "Браузер сам разобьёт цикл", "`requestAnimationFrame` отключён"], 0, "Браузер не разделяет синхронный цикл на части; нужны явная уступка и бюджет (замер: 0 длинных задач против 1)."),
    open("js.performance.m3", "advanced", "Опишите, как вы построите виртуализированный список на 100 000 элементов, чтобы он оставался плавным.", [
      ul(
        "Рендерить только видимое окно (+ запас), остальное — пустая прокручиваемая область с рассчитанной высотой; переиспользовать DOM-узлы.",
        "Не читать геометрию в цикле; высоты — фиксированные или измеряемые порциями с кэшем; обновления в `requestAnimationFrame`.",
        "Обработчик прокрутки — пассивный и с `throttle`/rAF; данные — в структурах с быстрым доступом по индексу.",
        "Тяжёлую подготовку данных — порциями или в Worker; тесты: число DOM-узлов, число раскладок за кадр, отсутствие длинных задач.",
      ),
    ], ["Описано окно видимых элементов", "Описано избегание thrashing и пассивные обработчики", "Описана порционная/воркерная подготовка", "Описаны метрики проверки"], { format: "architecture" }),
    open("js.performance.m4", "advanced", "Метрика INP ухудшилась после релиза. Опишите план расследования и исправления.", [
      ul(
        "Определить, на каких страницах и действиях INP плох (RUM по маршрутам/событиям/устройствам); воспроизвести в лаборатории с замедлением CPU.",
        "Профиль: найти длинные задачи в обработчиках ввода (Event Timing: input delay, processing time, presentation delay); сопоставить с изменениями релиза (bisect).",
        "Исправить: сократить работу в обработчике (отложить через `scheduler.yield`, порции, Worker), убрать thrashing, сократить рендер, оптимизировать сторонние скрипты.",
        "Закрепить: бюджет в CI/RUM-алерт, тест на длинные задачи в критичных сценариях.",
      ),
    ], ["Описаны RUM и воспроизведение", "Описан профиль по Event Timing", "Названы исправления", "Названа защита от регрессии"], { format: "debug" }),
  ],

  flashcards: [
    { id: "js.performance.f1", front: "Как измерять?", back: "performance.now, mark/measure, PerformanceObserver; прогрев, повторы, медиана и p95; реальная среда; сравнивать варианты в одном запуске." },
    { id: "js.performance.f2", front: "Длинная задача?", back: "> 50 мс в главном потоке: блокирует ввод и отрисовку. Лечение: порции (scheduler.yield/setTimeout), Worker, упрощение алгоритма." },
    { id: "js.performance.f3", front: "Layout thrashing?", back: "Чтение геометрии после записи стилей в цикле: 200 раскладок вместо 1. Сначала все чтения, потом все записи; пачки; rAF." },
    { id: "js.performance.f4", front: "Что анимировать?", back: "transform и opacity (0 раскладок, композитор); width/height/top/left запускают раскладку." },
    { id: "js.performance.f5", front: "Сложность на практике?", back: "includes в цикле = O(n²) (удвоение входа → >2,5× времени); Set/Map — O(1) на проверку; структура данных важнее микрооптимизаций." },
    { id: "js.performance.f6", front: "Worker и transfer?", back: "Тяжёлое — в Worker (пауза главного потока < 100 мс против ≥ 200 мс); ArrayBuffer копируется, с transfer переносится (byteLength 0); функции не передаются." },
    { id: "js.performance.f7", front: "V8 внутри?", back: "Форма объекта зависит от порядка свойств; delete → словарный режим; виды элементов Smi → Double → Object без возврата; дыры ухудшают." },
    { id: "js.performance.f8", front: "debounce vs throttle?", back: "debounce — после паузы (поиск); throttle — не чаще раза в интервал (прокрутка); throttle = debounce с leading, trailing, maxWait = wait; cancel/flush/pending." },
  ],

  sources: [
    { title: "User Timing Level 3", url: "https://www.w3.org/TR/user-timing/", publisher: "W3C" },
    { title: "Long Tasks API", url: "https://www.w3.org/TR/longtasks-1/", publisher: "W3C" },
    { title: "Event Timing API", url: "https://www.w3.org/TR/event-timing/", publisher: "W3C" },
    { title: "Performance Timeline", url: "https://www.w3.org/TR/performance-timeline/", publisher: "W3C" },
    { title: "HTML Standard: Web workers", url: "https://html.spec.whatwg.org/multipage/workers.html", publisher: "WHATWG" },
    { title: "HTML Standard: Event loop processing model", url: "https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model", publisher: "WHATWG" },
    { title: "MDN: Performance API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Performance_API", publisher: "MDN" },
    { title: "MDN: Web Workers API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API", publisher: "MDN" },
    { title: "MDN: Scheduler.yield()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield", publisher: "MDN" },
    { title: "web.dev: Web Vitals", url: "https://web.dev/articles/vitals", publisher: "Other" },
    { title: "web.dev: Optimize Interaction to Next Paint", url: "https://web.dev/articles/optimize-inp", publisher: "Other" },
    { title: "V8: Fast properties in V8", url: "https://v8.dev/blog/fast-properties", publisher: "Other" },
    { title: "V8: Elements kinds in V8", url: "https://v8.dev/blog/elements-kinds", publisher: "Other" },
    { title: "Node.js: perf_hooks", url: "https://nodejs.org/api/perf_hooks.html", publisher: "Other" },
  ],
};
