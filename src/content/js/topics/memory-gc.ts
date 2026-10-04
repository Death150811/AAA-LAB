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

export const memoryGc: Topic = {
  id: "js.memory-gc",
  slug: "memory-gc",
  domain: "js",
  module: "engineering",
  title: "Память и сборка мусора",
  titleEn: "Memory and garbage collection",
  summary:
    "JavaScript освобождает память сам, но решает за вас только одну задачу: удалить то, до чего нельзя добраться. Всё остальное — ваша ответственность. Тема на замерах в Node.js 22 и Chromium 141 показывает, что значит «достижим» (корни, циклы, замыкания и общий контекст), как `WeakRef`, `WeakMap` и `FinalizationRegistry` не удерживают объекты, где живёт память вне кучи (`Buffer`, `ArrayBuffer`), какие шаблоны дают утечки (накопители, кэши без лимита, слушатели, интервалы, «оторванные» DOM-узлы), как найти утечку (замер после сборки мусора, снимок кучи), что бывает при исчерпании лимита. В конце вы пишете LRU-кэш с TTL и весом и детектор утечек.",
  minutes: 110,
  prerequisites: ["js.closures", "js.map-set-weak", "js.dom-events"],
  tags: ["memory", "garbage collection", "reachability", "mark and sweep", "WeakRef", "WeakMap", "FinalizationRegistry", "memory leak", "heap snapshot", "detached DOM", "closures", "LRU cache", "ArrayBuffer", "transfer", "max-old-space-size"],
  keyConcepts: [
    { term: "Сборка мусора = достижимость, а не «ненужность»", text: "Объект живёт, пока до него можно добраться от корней (глобальные переменные, активные вызовы, таймеры, слушатели). Циклы (`a ↔ b`) не мешают: без внешних ссылок оба собраны. Но объект, «ненужный» программе, но достижимый — это утечка." },
    { term: "Замыкания удерживают контекст", text: "Замыкание держит переменные, которые использует, а все замыкания одной области делят **общий контекст**: возвращённое `small()` удерживает `heavy`, если его использует другое замыкание той же функции — даже когда оно уже выброшено (замер: `heavy` жива)." },
    { term: "`Weak*` не удерживают, но и не гарантируют", text: "Ключ `WeakMap` и цель `WeakRef` собираются, если других ссылок нет (замер: `Map` удержал ключ, `WeakMap` — нет). Момент сборки и вызов `FinalizationRegistry` не гарантированы — не стройте на них логику." },
    { term: "Типичные утечки — это забытое освобождение", text: "Глобальный накопитель, `Map`-кэш без вытеснения, `on()` без `off()`, `setInterval` без `clearInterval`, ссылка на удалённый DOM-узел: в замерах рост кучи после сборки мусора превышал 5 МиБ, а парные варианты — менее 1 МиБ." },
    { term: "Память бывает не только в куче", text: "`Buffer` и `ArrayBuffer` лежат вне кучи V8: 60 МиБ выросли в `arrayBuffers`, а `heapUsed` не изменился. `structuredClone(buf, { transfer })` передаёт память без копирования и «отсоединяет» исходник (`byteLength` = 0)." },
    { term: "Утечку ловят замером, а не догадкой", text: "Повторите действие, соберите мусор и смотрите на кучу; в браузере — число живых узлов и слушателей; затем снимок кучи и «кто удерживает». Лимит кучи исчерпан — процесс аварийно завершается, `try/catch` не спасёт." },
  ],
  sections: [
    section("definition", [
      def("Куча (heap)", "Область памяти, где движок размещает объекты, массивы, функции и замыкания; размер ограничен (в Node.js — `--max-old-space-size`).", "heap"),
      def("Достижимость (reachability)", "Объект достижим, если до него можно дойти по ссылкам от корней: глобальные переменные, локальные переменные активных функций, регистры, внутренние структуры (таймеры, слушатели, очереди задач).", "reachability"),
      def("Сборщик мусора (GC)", "Механизм движка, освобождающий недостижимые объекты. В V8 — поколенческий: молодое поколение собирается часто и быстро, старое — реже, инкрементально и параллельно (алгоритмы mark-sweep/mark-compact).", "garbage collector"),
      def("Утечка памяти", "Объекты, ненужные программе, но достижимые и потому не освобождаемые; симптом — устойчивый рост использования памяти после сборок мусора.", "memory leak"),
      def("`WeakRef` и `FinalizationRegistry`", "`WeakRef` — «слабая» ссылка на объект (`deref()` возвращает объект или `undefined`); `FinalizationRegistry` — вызывает колбэк после сборки зарегистрированного объекта. Оба не гарантируют момент сборки.", "WeakRef / FinalizationRegistry"),
      def("Retained size", "Сколько памяти освободится, если удалить объект: он сам плюс всё, что достижимо только через него; главный показатель в снимке кучи.", "retained size"),
      def("«Оторванный» DOM-узел (detached)", "Узел, удалённый из документа, но достижимый из JavaScript (массив, замыкание, слушатель): он и его поддерево остаются в памяти.", "detached DOM node"),
      def("Снимок кучи (heap snapshot)", "Полный дамп объектов кучи и ссылок между ними (`v8.writeHeapSnapshot`, вкладка Memory в DevTools); сравнение снимков показывает, что накапливается.", "heap snapshot"),
    ]),

    section("why", [
      h("Автоматическая память — не бесконечная память"),
      p("Страница, которая работает час, сервер, который живёт месяцами, интерфейс с тысячами строк — везде, где код выполняется долго, малая утечка превращается в замедление, подвисания сборщика мусора и аварийное завершение. Эти дефекты не видны на коротких тестах и проявляются только у пользователей."),
      ul(
        "**Стабильность:** процесс или вкладка не падает по нехватке памяти после часов работы.",
        "**Скорость:** меньше работы у сборщика мусора — меньше пауз; плоская, а не растущая кривая памяти.",
        "**Предсказуемость:** понимание, что удерживает объект (замыкание, слушатель, кэш), избавляет от «магии».",
        "**Экономия ресурсов:** ограниченные кэши, `transfer` вместо копирования, потоковая обработка больших данных.",
      ),
      insight("Сборщик мусора освобождает **недостижимое**, а не **ненужное**. Утечка — это всегда **ссылка, которую забыли разорвать**: слушатель, таймер, кэш, замыкание, глобальная переменная. Найдите ссылку — найдёте утечку."),
    ]),

    section("mental-model", [
      p("**Память — это склад, а ссылки — верёвки от крыши (корней).** Сборщик мусора раз в какое-то время идёт от крыши по верёвкам и помечает всё, до чего дошёл; всё непомеченное он вывозит. Поэтому петли из товаров, привязанных друг к другу, но не к крыше, вывозятся (`a ↔ b` собраны). Но если к ящику тянется хоть одна верёвка — например, от **будильника** (`setInterval`), от **доски объявлений** (`on(\"tick\", …)`), от **картотеки** (`Map`-кэш) или от **общего чехла замыканий** (контекст), — ящик остаётся, даже если он давно никому не нужен. **Слабые ссылки** — это не верёвки, а бирки: «этот ящик здесь, если ещё не вывезли»."),
      table(
        ["Кто держит объект", "Что удерживает", "Как отпустить"],
        [
          ["Глобальная/модульная переменная, массив-накопитель", "Всё, что в них положили", "Ограничить размер, очищать, не накапливать"],
          ["`Map`/объект-кэш", "Ключи и значения", "Лимит и вытеснение (LRU), TTL, `WeakMap` для привязки к объекту"],
          ["Слушатель (`addEventListener`, `emitter.on`)", "Функцию и всё, что она замыкает; узел, на котором висит", "`off`/`removeEventListener`, `{ signal }`, `once`"],
          ["`setTimeout`/`setInterval`", "Колбэк и его замыкание до срабатывания/отмены", "`clearTimeout`/`clearInterval`, `AbortSignal`"],
          ["Замыкание", "Используемые переменные и общий контекст области", "Не захватывать лишнее, выносить тяжёлое в отдельную функцию"],
          ["Ссылка на DOM-узел", "Узел и его поддерево после удаления из документа", "Обнулить ссылку, снять слушатели, не хранить узлы в долгоживущих структурах"],
          ["Промис, который не завершается", "Замыкание цепочки `then`", "Тайм-ауты и отмена"],
        ],
        "Что держит память и как это отпустить",
      ),
    ]),

    section("technical", [
      h("Достижимость, замыкания и слабые ссылки"),
      code("js", `import v8 from "node:v8";
import vm from "node:vm";
v8.setFlagsFromString("--expose-gc");
export const gc = vm.runInNewContext("gc");
export const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms));
export const MB = 1024 * 1024;
export const heapMB = () => process.memoryUsage().heapUsed / MB;
// WeakRef держит цель живой до конца текущей задачи, поэтому до gc() уступаем циклу событий
export async function collect() { await sleep(); gc(); await sleep(); gc(); }`, { filename: "_gc.mjs (вспомогательный модуль)", collapsed: true }),
      code("js", `import { collect, heapMB, sleep } from "./_gc.mjs";

const show = (k, v) => console.log(k.padEnd(60), "→", typeof v === "string" ? v : JSON.stringify(v));
await collect();

// 1. Выделение и освобождение
const before = heapMB();
let big = new Array(5_000_000).fill(0);
const during = heapMB();
show("массив из 5 млн элементов: куча выросла более чем на 30 МиБ", during - before > 30);
big = null;
await collect();
show("после big = null и gc(): куча вернулась (остаток < 10 МиБ)", heapMB() - before < 10);

// 2. Достижимость: WeakRef не удерживает объект
let obj = { name: "obj" };
const ref = new WeakRef(obj);
await collect();
show("есть сильная ссылка → deref() возвращает объект", ref.deref() !== undefined);
obj = null;
await collect();
show("сильных ссылок нет → после gc() deref()", String(ref.deref()));

// 3. Циклические ссылки не мешают сборке (это не подсчёт ссылок)
let a = { name: "a" }, b = { name: "b" };
a.other = b; b.other = a;
const refs = [new WeakRef(a), new WeakRef(b)];
a = b = null;
await collect();
show("цикл a ↔ b без внешних ссылок: собраны оба", refs.map((r) => r.deref() === undefined));

// 4. Замыкания удерживают то, что используют
function retains() { const data = { id: "retains" }; return { probe: new WeakRef(data), fn: () => data.id }; }
function releases() { const data = { id: "releases" }; return { probe: new WeakRef(data), fn: () => 42 }; }
let r1 = retains(), r2 = releases();
await collect();
show("замыкание использует data → data жива", r1.probe.deref() !== undefined);
show("замыкание не использует data → data собрана", r2.probe.deref() === undefined);

// 5. Общий контекст: одна используемая переменная удерживает остальные
function pair() {
  const heavy = { id: "heavy" };                // используется только вторым замыканием
  const useHeavy = () => heavy.id;
  const small = () => 1;
  return { probe: new WeakRef(heavy), small, useHeavy };
}
let p = pair();
const smallOnly = p.small; const probe = p.probe;
p = null;                                       // useHeavy выброшено, остаётся только small
await collect();
show("small() не использует heavy, но живёт в общем контексте с useHeavy → heavy", probe.deref() === undefined ? "собрана" : "жива");
void smallOnly;

// 6. Map держит ключ, WeakMap — нет
let key1 = {}, key2 = {};
const strong = new Map([[key1, "x"]]), weak = new WeakMap([[key2, "x"]]);
const k1 = new WeakRef(key1), k2 = new WeakRef(key2);
key1 = key2 = null;
await collect();
show("ключ в Map жив / ключ в WeakMap собран", [k1.deref() !== undefined, k2.deref() === undefined]);
void strong; void weak;

// 7. FinalizationRegistry (порядок и момент не гарантируются спецификацией)
const finalized = [];
const registry = new FinalizationRegistry((held) => finalized.push(held));
(function () { registry.register({}, "объект-1"); registry.register({}, "объект-2"); })();
await collect(); await sleep(20);
show("FinalizationRegistry после gc(): сработал для обоих (замер, не гарантия)", finalized.slice().sort());

// 8. Память за пределами кучи JS
const m0 = process.memoryUsage();
let buf = Buffer.alloc(60 * 1024 * 1024, 1);
const m1 = process.memoryUsage();
show("Buffer 60 МиБ: arrayBuffers вырос > 50 МиБ, heapUsed — нет", [(m1.arrayBuffers - m0.arrayBuffers) / 1048576 > 50, (m1.heapUsed - m0.heapUsed) / 1048576 < 5]);
buf = null;

// 9. Передача ArrayBuffer без копирования
const original = new ArrayBuffer(1024);
const moved = structuredClone(original, { transfer: [original] });
show("transfer: исходный буфер отсоединён, новый — полноразмерный", [original.byteLength, moved.byteLength, original.detached]);`, { filename: "mg1-reachability.mjs", collapsed: true, lineNumbers: true }),
      code("text", `массив из 5 млн элементов: куча выросла более чем на 30 МиБ  → true
после big = null и gc(): куча вернулась (остаток < 10 МиБ)   → true
есть сильная ссылка → deref() возвращает объект              → true
сильных ссылок нет → после gc() deref()                      → undefined
цикл a ↔ b без внешних ссылок: собраны оба                   → [true,true]
замыкание использует data → data жива                        → true
замыкание не использует data → data собрана                  → true
small() не использует heavy, но живёт в общем контексте с useHeavy → heavy → жива
ключ в Map жив / ключ в WeakMap собран                       → [true,true]
FinalizationRegistry после gc(): сработал для обоих (замер, не гарантия) → ["объект-1","объект-2"]
Buffer 60 МиБ: arrayBuffers вырос > 50 МиБ, heapUsed — нет   → [true,true]
transfer: исходный буфер отсоединён, новый — полноразмерный  → [0,1024,true]`, { filename: "вывод Node.js 22.22.0 (6 запусков подряд — одинаковый результат)" }),
      ul(
        "**Куча растёт и освобождается:** массив из 5 млн элементов поднял `heapUsed` более чем на 30 МиБ; после `big = null` и сборки — остаток менее 10 МиБ.",
        "**`WeakRef`:** пока есть сильная ссылка, `deref()` возвращает объект; без неё после сборки — `undefined`. Перед `gc()` нужно уступить циклу событий: цель `WeakRef` живёт до конца текущей задачи.",
        "**Циклы не мешают:** `a ↔ b` без внешних ссылок собраны оба — это не подсчёт ссылок.",
        "**Замыкания:** использует `data` — `data` жива; не использует — собрана.",
        "**Общий контекст:** `small()` не использует `heavy`, но `heavy` использует соседнее замыкание `useHeavy` — после возврата одного `small()` `heavy` осталась **жива**: замыкания одной области делят контекст. Тяжёлые данные выносите в отдельную функцию.",
        "**`Map` против `WeakMap`:** ключ в `Map` жив, в `WeakMap` собран.",
        "**`FinalizationRegistry`:** в замере колбэк сработал для обоих объектов после `gc()`, но спецификация ничего не гарантирует (порядок, момент, сам факт) — только для необязательной очистки.",
        "**Вне кучи:** `Buffer` на 60 МиБ вырос в `arrayBuffers`, `heapUsed` почти не изменился. **`transfer`:** после `structuredClone(buf, { transfer: [buf] })` исходный буфер отсоединён (`byteLength` 0, `detached: true`), новый — полноразмерный.",
      ),

      h("Шаблоны утечек и их исправление"),
      code("js", `import { EventEmitter } from "node:events";
import { collect, heapMB } from "./_gc.mjs";

const show = (k, v) => console.log(k.padEnd(62), "→", typeof v === "string" ? v : JSON.stringify(v));

// Детектор роста: прогоняем действие несколько раз и смотрим на кучу ПОСЛЕ сборки мусора
async function growth(action, rounds = 6) {
  await collect();
  const samples = [];
  for (let i = 0; i < rounds; i++) { await action(i); await collect(); samples.push(heapMB()); }
  return samples[samples.length - 1] - samples[0];       // МиБ за последние rounds - 1 раундов
}
const alloc = (n = 20_000) => Array.from({ length: n }, (_, i) => ({ id: i, payload: "x".repeat(50) }));

// 1. Глобальный накопитель
const registry = [];
show("глобальный массив, в который только добавляют: рост > 5 МиБ", (await growth(() => registry.push(alloc()))) > 5);
registry.length = 0;
show("то же без накопления: рост < 1 МиБ", (await growth(() => { alloc(); })) < 1);

// 2. Кэш без ограничения и с ограничением
const cache = new Map();
let n = 0;
show("Map-кэш без вытеснения: рост > 5 МиБ", (await growth(() => { for (let i = 0; i < 20_000; i++) cache.set("k" + n++, { payload: "x".repeat(50) }); })) > 5);
cache.clear();
const bounded = new Map();
n = 0;
const putBounded = (k, v) => { bounded.set(k, v); if (bounded.size > 1000) bounded.delete(bounded.keys().next().value); };
show("Map-кэш с лимитом 1000 записей (вытеснение старейших): рост < 1 МиБ", (await growth(() => { for (let i = 0; i < 20_000; i++) putBounded("k" + n++, { payload: "x".repeat(50) }); })) < 1);

// 3. Слушатели, которые не снимают
const bus = new EventEmitter();
bus.setMaxListeners(Infinity);
show("on() в цикле без off(): рост > 5 МиБ", (await growth(() => { for (let i = 0; i < 2000; i++) { const data = alloc(10); bus.on("tick", () => data.length); } })) > 5);
bus.removeAllListeners();
show("on() и off() парой: рост < 1 МиБ", (await growth(() => { for (let i = 0; i < 2000; i++) { const data = alloc(10); const h = () => data.length; bus.on("tick", h); bus.off("tick", h); } })) < 1);
const warnings = [];
process.on("warning", (w) => warnings.push(w.name));
const small = new EventEmitter();
for (let i = 0; i < 11; i++) small.on("x", () => {});
await new Promise((r) => setImmediate(r));
show("11-й слушатель одного события: предупреждение Node.js", warnings);

// 4. Интервал держит замыкание, пока его не остановили
let intervals = [];
show("setInterval без clearInterval: рост > 5 МиБ", (await growth(() => { const data = alloc(5000); intervals.push(setInterval(() => data.length, 1_000_000)); })) > 5);
intervals.forEach(clearInterval); intervals = [];
show("после clearInterval память освобождена: рост < 1 МиБ", (await growth(() => { const data = alloc(5000); const t = setInterval(() => data.length, 1_000_000); clearInterval(t); })) < 1);

// 5. WeakMap как «приватная» метка без утечки
const meta = new WeakMap();
show("WeakMap<объект, данные>: рост < 1 МиБ при потере объектов", (await growth(() => { for (let i = 0; i < 5000; i++) meta.set({ i }, alloc(4)); })) < 1);

// 6. Срезы и «большой хвост»
const holders = [];
show("хранение маленькой части большой структуры целиком: рост > 5 МиБ", (await growth(() => { const bigResponse = { rows: alloc(20_000) }; holders.push(bigResponse); })) > 5);
holders.length = 0;
show("хранение только нужных полей: рост < 1 МиБ", (await growth(() => { const bigResponse = { rows: alloc(20_000) }; holders.push(bigResponse.rows.slice(0, 1).map((r) => r.id)); })) < 1);`, { filename: "mg2-leaks.mjs", collapsed: true, lineNumbers: true }),
      code("text", `глобальный массив, в который только добавляют: рост > 5 МиБ    → true
то же без накопления: рост < 1 МиБ                             → true
Map-кэш без вытеснения: рост > 5 МиБ                           → true
Map-кэш с лимитом 1000 записей (вытеснение старейших): рост < 1 МиБ → true
on() в цикле без off(): рост > 5 МиБ                           → true
on() и off() парой: рост < 1 МиБ                               → true
11-й слушатель одного события: предупреждение Node.js          → ["MaxListenersExceededWarning"]
setInterval без clearInterval: рост > 5 МиБ                    → true
после clearInterval память освобождена: рост < 1 МиБ           → true
WeakMap<объект, данные>: рост < 1 МиБ при потере объектов      → true
хранение маленькой части большой структуры целиком: рост > 5 МиБ → true
хранение только нужных полей: рост < 1 МиБ                     → true`, { filename: "вывод Node.js 22.22.0 (рост измеряется после сборки мусора)" }),
      ul(
        "**Метод замера:** повторить действие несколько раз, после каждого — сборка мусора и `heapUsed`; смотреть на **рост между раундами**, а не на абсолютное значение.",
        "**Накопитель:** глобальный массив, в который только добавляют (рост > 5 МиБ) против временных данных (< 1 МиБ).",
        "**Кэш:** `Map` без вытеснения растёт без предела; с лимитом в 1000 записей и удалением самой давней — рост менее 1 МиБ.",
        "**Слушатели:** `on` в цикле без `off` (рост > 5 МиБ); парные `on`/`off` — без роста. Node.js предупреждает с одиннадцатого слушателя одного события (`MaxListenersExceededWarning`) — это сигнал, а не помеха.",
        "**Интервалы:** `setInterval` без `clearInterval` удерживает замыкание с данными; после остановки память освобождается.",
        "**`WeakMap`:** метаданные, привязанные к объектам, не мешают их сборке.",
        "**«Большой хвост»:** сохранить весь ответ ради одного поля — утечка по объёму; сохраняйте только нужное.",
      ),

      h("Лимиты, исчерпание памяти и снимки"),
      code("js", `import { spawnSync } from "node:child_process";
import v8 from "node:v8";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const show = (k, v) => console.log(k.padEnd(60), "→", typeof v === "string" ? v : JSON.stringify(v));

// 1. Лимит кучи
const stats = v8.getHeapStatistics();
show("heap_size_limit по умолчанию не меньше 256 МиБ", stats.heap_size_limit / 1048576 >= 256);
show("поля v8.getHeapStatistics()", ["total_heap_size", "used_heap_size", "heap_size_limit", "external_memory", "malloced_memory"].every((k) => k in stats));
show("поля process.memoryUsage()", Object.keys(process.memoryUsage()));

// 2. Исчерпание кучи: процесс аварийно завершается
const r = spawnSync(process.execPath, ["--max-old-space-size=24", "-e", "try { const keep = []; for (;;) keep.push(new Array(10000).fill({})); } catch (e) { console.log('поймано:', e.name); } finally { console.log('finally выполнен'); }"], { encoding: "utf8" });
const fatal = r.stderr.split("\\n").find((l) => l.includes("FATAL ERROR")) ?? "";
show("--max-old-space-size=24: код выхода не 0", r.status !== 0);
show("сообщение о нехватке памяти", fatal.replace(/^<--- Last few GCs --->.*/, "").replace(/.*(FATAL ERROR:[^.]*\\.[^.]*)\\..*/, "$1").trim().slice(0, 100));
show("try/catch и finally вокруг цикла не сработали: stdout процесса пуст", r.stdout === "");

// 3. Снимок кучи — основной инструмент поиска утечек
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heap-"));
const file = v8.writeHeapSnapshot(path.join(dir, "snap.heapsnapshot"));
const size = fs.statSync(file).size;
const head = fs.readFileSync(file, "utf8", 0).slice(0, 12);
show("writeHeapSnapshot: файл создан, это JSON с полем snapshot", [size > 100_000, head.includes("snapshot")]);
fs.rmSync(dir, { recursive: true });`, { filename: "mg3-limits.mjs", collapsed: true }),
      code("text", `heap_size_limit по умолчанию не меньше 256 МиБ               → true
поля v8.getHeapStatistics()                                  → true
поля process.memoryUsage()                                   → ["rss","heapTotal","heapUsed","external","arrayBuffers"]
--max-old-space-size=24: код выхода не 0                     → true
сообщение о нехватке памяти                                  → FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
try/catch и finally вокруг цикла не сработали: stdout процесса пуст → true
writeHeapSnapshot: файл создан, это JSON с полем snapshot    → [true,true]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Лимит кучи** зависит от версии и машины (в замере — не менее 256 МиБ); `v8.getHeapStatistics()` показывает `heap_size_limit`, `used_heap_size`, `external_memory`; `process.memoryUsage()` — `rss`, `heapTotal`, `heapUsed`, `external`, `arrayBuffers`.",
        "**Исчерпание кучи — не исключение:** при `--max-old-space-size=24` процесс аварийно завершился (`FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`), блоки `catch` и `finally` не выполнились (stdout пуст). Лимит поднимают флагом, но это отсрочка, а не лечение.",
        "**Снимок кучи:** `v8.writeHeapSnapshot()` создаёт JSON-файл; открывается в DevTools (Memory). Для утечек сравнивают три снимка: «до», «после действия», «после ещё одного действия» — растущие классы объектов и есть кандидаты.",
      ),

      h("Утечки в браузере: DOM, слушатели, таймеры"),
      code("js", `import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const page = await b.newPage();
await page.setContent(\`<div id="host"></div>\`);
const cdp = await page.context().newCDPSession(page);
await cdp.send("HeapProfiler.enable"); await cdp.send("Performance.enable");
// Метрики Chromium после принудительной сборки мусора: живые узлы DOM, слушатели JS, куча JS
async function metrics() {
  await cdp.send("HeapProfiler.collectGarbage"); await cdp.send("HeapProfiler.collectGarbage");
  const { metrics } = await cdp.send("Performance.getMetrics");
  const get = (n) => metrics.find((m) => m.name === n).value;
  return { nodes: get("Nodes"), listeners: get("JSEventListeners"), heapMB: get("JSHeapUsedSize") / 1048576 };
}
const show = (k, v) => console.log(k.padEnd(70), "→", JSON.stringify(v));

await page.evaluate(() => {
  window.build = (n) => {
    const host = document.getElementById("host"); const nodes = [];
    for (let i = 0; i < n; i++) { const el = document.createElement("div"); el.textContent = "строка " + i; host.append(el); nodes.push(el); }
    return nodes;
  };
  window.clear = () => document.getElementById("host").replaceChildren();
});
const base = await metrics();
show("база: живых узлов DOM", base.nodes);

// 1. «Оторванные» узлы
await page.evaluate(() => { window.cache = build(15000); });
show("15 000 <div> с текстом добавлены в документ: узлов (+ 15 000 текстовых)", (await metrics()).nodes - base.nodes);
await page.evaluate(() => clear());
show("удалены из документа, но лежат в window.cache: узлов всё ещё", (await metrics()).nodes - base.nodes);
await page.evaluate(() => { window.cache = null; });
show("после window.cache = null: узлов", (await metrics()).nodes - base.nodes);

// 2. Слушатели на window держат удалённые элементы
await page.evaluate(() => { for (const el of build(5000)) addEventListener("resize", () => el.textContent); clear(); });
let m = await metrics();
show("5000 слушателей на window, элементы удалены: слушателей / узлов", [m.listeners - base.listeners, m.nodes - base.nodes]);
await page.evaluate(() => { window.ac = new AbortController(); for (const el of build(5000)) addEventListener("resize", () => el.textContent, { signal: ac.signal }); clear(); });
m = await metrics();
show("ещё 5000 слушателей с { signal }: слушателей / узлов", [m.listeners - base.listeners, m.nodes - base.nodes]);
await page.evaluate(() => ac.abort());
m = await metrics();
show("после ac.abort(): слушателей / узлов (остались только слушатели без signal)", [m.listeners - base.listeners, m.nodes - base.nodes]);

// 3. Замыкание в таймере удерживает данные до срабатывания или отмены
const before = await metrics();
await page.evaluate(() => { window.t = setTimeout(((big) => () => big.length)(new Array(1_000_000).fill(1)), 3_600_000); });
const pending = await metrics();
show("таймер на час держит массив из 1 млн элементов: куча выросла > 3 МиБ", pending.heapMB - before.heapMB > 3);
await page.evaluate(() => clearTimeout(window.t));
const cleared = await metrics();
show("после clearTimeout куча вернулась (освободилось > 3 МиБ)", pending.heapMB - cleared.heapMB > 3);
await b.close();`, { filename: "run-mg4-dom.mjs", collapsed: true }),
      code("text", `база: живых узлов DOM                                                  → 5
15 000 <div> с текстом добавлены в документ: узлов (+ 15 000 текстовых) → 30000
удалены из документа, но лежат в window.cache: узлов всё ещё           → 30000
после window.cache = null: узлов                                       → 0
5000 слушателей на window, элементы удалены: слушателей / узлов        → [5000,10000]
ещё 5000 слушателей с { signal }: слушателей / узлов                   → [10000,20000]
после ac.abort(): слушателей / узлов (остались только слушатели без signal) → [5000,10000]
таймер на час держит массив из 1 млн элементов: куча выросла > 3 МиБ   → true
после clearTimeout куча вернулась (освободилось > 3 МиБ)               → true`, { filename: "замер в Chromium 141 (метрики Performance.getMetrics после принудительной сборки мусора)" }),
      ul(
        "**«Оторванные» узлы:** 15 000 `<div>` с текстом дали 30 000 живых узлов; после удаления из документа они остались (`30000`), потому что массив `window.cache` держит ссылки; после `cache = null` — 0.",
        "**Слушатели на `window`:** 5000 слушателей держат 10 000 узлов, хотя элементы давно убраны из документа; подписка с `{ signal }` освобождается после `abort()` (остаётся только неотменённая часть).",
        "**Таймер на час** удерживает замыкание с массивом в миллион элементов (куча выросла более чем на 3 МиБ); `clearTimeout` возвращает память.",
        "**Диагностика в DevTools:** Memory → Heap snapshot → поиск `Detached` (отсоединённые узлы) и цепочка Retainers; Performance monitor показывает число узлов и слушателей.",
      ),
      warn("`FinalizationRegistry` и `WeakRef` — не замена `removeEventListener` и `clearInterval`: момент сборки не гарантирован, и код, рассчитывающий на него, будет вести себя по-разному в разных движках и режимах."),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const cache = new Map();
let target = { big: new Array(1_000_000).fill(0) };

const ref = new WeakRef(target);
const registry = new FinalizationRegistry((key) => cache.delete(key));
registry.register(target, "target");

cache.set("target", ref);
target = null;

const alive = cache.get("target")?.deref();`,
        [
          { line: 1, text: "Обычный `Map` держит значения сильно: всё, что в нём лежит, достижимо." },
          { line: 2, text: "Тяжёлый объект; пока на него есть сильная ссылка (переменная `target`), он жив." },
          { line: 4, text: "`WeakRef` — слабая ссылка: не мешает сборке; `deref()` вернёт объект или `undefined`." },
          { line: [5, 6], text: "`FinalizationRegistry` вызовет колбэк после сборки объекта — подходит для необязательной очистки (не для логики)." },
          { line: [8, 9], text: "Кладём в кэш слабую ссылку и отпускаем сильную: теперь объект может быть собран." },
          { line: 11, text: "Всегда проверяйте результат `deref()`: он может быть `undefined`." },
        ],
        "syntax.js",
      ),
    ]),

    section("minimal-example", [
      p("Не запуская код, определите для каждого объекта (A–H), будет ли он собран после сборки мусора, и объясните почему."),
      code("js", `import { collect } from "./_gc.mjs";   // collect(): сборка мусора с паузами для WeakRef (хелпер из этой темы)

const alive = {};
const track = (name, obj) => { alive[name] = new WeakRef(obj); };

let a = { n: "A" };                      // A: доступна по переменной
track("A", a);

let c = { n: "C", child: { n: "B" } };   // B: доступна только через C
track("B", c.child);
track("C", c);
c = c.child = null;                      // и C, и B теперь недостижимы? (подумайте!)

let d = { n: "D" };                      // D: замыкание читает переменную d
const readD = () => d.n;
track("D", d);
d = null;

let e = { n: "E" };                      // E: ключ в WeakMap
const meta = new WeakMap([[e, "метаданные"]]);
track("E", e);
e = null;

let f = { n: "F" };                      // F: ключ в Map
const registry = new Map([[f, "запись"]]);
track("F", f);
f = null;

let g = { n: "G" }, h = { n: "H" };      // G и H ссылаются друг на друга
g.h = h; h.g = g;
track("G", g); track("H", h);
g = h = null;

await collect();
console.log(Object.entries(alive).map(([name, ref]) => \`\${name}: \${ref.deref() ? "жива" : "собрана"}\`).join("\\n"));
void [readD, meta, registry];`, { filename: "x1-predict.mjs", collapsed: true }),
      code("text", `A: жива
B: собрана
C: собрана
D: собрана
E: собрана
F: жива
G: собрана
H: собрана`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**A** жива: на неё указывает переменная. **F** жива: ключ в `Map` — сильная ссылка.",
        "**B** и **C** собраны: после `c = c.child = null` до `C` и `B` добраться нельзя.",
        "**D** собрана: замыкание держит переменную `d`, но в ней уже `null`; объект недостижим.",
        "**E** собрана: ключ `WeakMap` не удерживает объект.",
        "**G** и **H** собраны: цикл без внешних ссылок.",
      ),
    ]),

    section("detailed-example", [
      p("`createCache({ maxEntries, maxSize, sizeOf, ttlMs, now, onEvict })` — кэш, который не растёт без предела: вытесняет давно не использованные записи, ограничивает суммарный вес, удаляет просроченные при обращении и в `prune()`, не использует таймеры (нечего забывать останавливать) и не позволяет колбэку `onEvict` сломать структуру. Порядок давности хранит сам `Map`: чтение переносит запись в конец, вытесняется первая."),
      code("js", `// Кэш с ограничением по числу записей, суммарному «весу» и времени жизни. Без таймеров: просроченное удаляется при обращении и в prune().
export function createCache({ maxEntries = Infinity, maxSize = Infinity, sizeOf = () => 1, ttlMs = Infinity, now = Date.now, onEvict } = {}) {
  const map = new Map();                 // порядок вставки = порядок давности: первый — самый «старый»
  const stats = { hits: 0, misses: 0, evictions: 0, expired: 0 };
  let totalSize = 0;

  const notify = (key, value, reason) => { try { onEvict?.(key, value, reason); } catch { /* колбэк не должен ломать кэш */ } };
  const isExpired = (entry) => entry.expiresAt <= now();

  function remove(key, entry, reason) {
    map.delete(key);
    totalSize -= entry.size;
    if (reason === "capacity") stats.evictions++;
    if (reason === "expired") stats.expired++;
    notify(key, entry.value, reason);
  }

  function evictToFit() {
    while (map.size > maxEntries || totalSize > maxSize) {
      const [oldestKey, oldest] = map.entries().next().value;
      remove(oldestKey, oldest, "capacity");
    }
  }

  return {
    get(key) {
      const entry = map.get(key);
      if (!entry) { stats.misses++; return undefined; }
      if (isExpired(entry)) { remove(key, entry, "expired"); stats.misses++; return undefined; }
      map.delete(key); map.set(key, entry);              // освежаем давность: переносим в конец
      stats.hits++;
      return entry.value;
    },
    has(key) {                                           // не меняет давность и статистику
      const entry = map.get(key);
      if (!entry) return false;
      if (isExpired(entry)) { remove(key, entry, "expired"); return false; }
      return true;
    },
    set(key, value, { ttlMs: ttl = ttlMs } = {}) {
      const size = sizeOf(value);
      if (size > maxSize) return false;                  // одна запись больше всего лимита: не вытесняем ради неё остальных
      const previous = map.get(key);
      if (previous) { map.delete(key); totalSize -= previous.size; }
      map.set(key, { value, size, expiresAt: ttl === Infinity ? Infinity : now() + ttl });
      totalSize += size;
      evictToFit();
      return true;
    },
    delete(key) {
      const entry = map.get(key);
      if (!entry) return false;
      remove(key, entry, "deleted");
      return true;
    },
    prune() {                                            // удалить все просроченные, вернуть их число
      let removed = 0;
      for (const [key, entry] of [...map]) if (isExpired(entry)) { remove(key, entry, "expired"); removed++; }
      return removed;
    },
    clear() { map.clear(); totalSize = 0; },
    keys: () => [...map.keys()],                         // от самого давнего к самому свежему
    get size() { return map.size; },
    get totalSize() { return totalSize; },
    stats: () => ({ ...stats }),
  };
}`, { filename: "lru-cache.mjs", lineNumbers: true }),
      code("js", `import { collect, heapMB } from "../_gc.mjs";
const { createCache } = await import(process.argv[2] ? new URL(process.argv[2], import.meta.url) : "./lru-cache.mjs");

const results = [];
const check = (name, ok, info = "") => { results.push(ok); console.log((ok ? "✓ " : "✗ ") + name + (info ? " — " + info : "")); };
const clock = (t = 0) => { const f = () => t; f.advance = (ms) => { t += ms; }; return f; };

// 1. Основы
let c = createCache({ maxEntries: 3 });
c.set("a", 1); c.set("b", 2);
check("get/set/has/size; отсутствующий ключ → undefined", c.get("a") === 1 && c.get("zzz") === undefined && c.has("b") && !c.has("zzz") && c.size === 2);

// 2. Вытеснение давнего
const evicted = [];
c = createCache({ maxEntries: 3, onEvict: (k, v, reason) => evicted.push([k, v, reason]) });
c.set("a", 1); c.set("b", 2); c.set("c", 3);
c.get("a");                                   // a теперь самая свежая, самый давний — b
c.set("d", 4);
check("LRU: при переполнении уходит самая давняя запись (b), а не самая старая по вставке", JSON.stringify(c.keys()) === '["c","a","d"]' && JSON.stringify(evicted) === '[["b",2,"capacity"]]', JSON.stringify([c.keys(), evicted]));

// 3. Перезапись
c = createCache({ maxEntries: 2 });
c.set("a", 1); c.set("b", 2); c.set("a", 10);
check("перезапись обновляет значение и давность без вытеснения", c.size === 2 && c.get("a") === 10 && JSON.stringify(c.keys()) === '["b","a"]');

// 4. has не меняет давность, get — меняет
c = createCache({ maxEntries: 2 });
c.set("a", 1); c.set("b", 2); c.has("a"); c.set("c", 3);
check("has() не освежает запись: «a» вытеснена", !c.has("a") && c.has("b") && c.has("c"));

// 5. TTL
let now = clock();
const log = [];
c = createCache({ ttlMs: 100, now, onEvict: (k, v, r) => log.push(r + ":" + k) });
c.set("x", 1); c.set("y", 2, { ttlMs: 500 });
now.advance(99); const alive = c.get("x");
now.advance(2); const dead = c.get("x");
check("TTL: до срока значение есть, после — undefined и onEvict('expired')", alive === 1 && dead === undefined && log.join() === "expired:x");
now.advance(300);
check("индивидуальный ttlMs переопределяет общий; has() учитывает срок", c.has("y") && !c.has("x"));
c.set("y", 3, { ttlMs: 500 }); now.advance(499);
check("повторный set продлевает срок жизни", c.get("y") === 3);

// 6. prune
now = clock();
c = createCache({ ttlMs: 10, now });
for (const k of "abcde") c.set(k, 1);
now.advance(5); c.set("fresh", 1); now.advance(6);
check("prune() удаляет просроченные и возвращает их число", c.prune() === 5 && c.keys().join() === "fresh");

// 7. Вес
c = createCache({ maxSize: 10, sizeOf: (v) => v.length });
c.set("a", "xxxx"); c.set("b", "yyyy");
const tooBig = c.set("huge", "z".repeat(11));
c.set("c", "wwww");
check("maxSize: вытесняет давних, пока не уложится; запись больше лимита отвергается без вытеснения", tooBig === false && c.keys().join() === "b,c" && c.totalSize === 8, JSON.stringify([c.keys(), c.totalSize]));

// 7b. Учёт веса при удалении, перезаписи и истечении срока
now = clock();
c = createCache({ maxSize: 100, sizeOf: (v) => v.length, ttlMs: 50, now });
c.set("a", "xxxx"); c.set("b", "yy"); c.set("c", "zzz");
const w0 = c.totalSize; c.delete("b"); const w1 = c.totalSize;
c.set("a", "x"); const w2 = c.totalSize;
now.advance(60); c.prune(); const w3 = c.totalSize;
check("totalSize корректен после delete, перезаписи и истечения срока", w0 === 9 && w1 === 7 && w2 === 4 && w3 === 0, JSON.stringify([w0, w1, w2, w3]));

// 8. Статистика
c = createCache({ maxEntries: 1 });
c.set("a", 1); c.get("a"); c.get("zzz"); c.set("b", 2);
check("stats: hits, misses, evictions", JSON.stringify(c.stats()) === '{"hits":1,"misses":1,"evictions":1,"expired":0}', JSON.stringify(c.stats()));

// 9. Значения undefined/null и delete
c = createCache({ maxEntries: 5 });
c.set("u", undefined); c.set("n", null);
check("значения undefined и null различимы через has(); delete возвращает true/false", c.has("u") && c.get("n") === null && c.delete("n") === true && c.delete("n") === false && c.size === 1);

// 10. Падающий onEvict
c = createCache({ maxEntries: 1, onEvict: () => { throw new Error("сбой в onEvict"); } });
let threw = false;
try { c.set("a", 1); c.set("b", 2); } catch { threw = true; }
check("исключение в onEvict не ломает кэш", !threw && c.size === 1 && c.get("b") === 2);

// 11. Ограниченная память
await collect();
const before = heapMB();
c = createCache({ maxEntries: 1000 });
for (let i = 0; i < 200_000; i++) c.set("k" + i, { payload: "x".repeat(50), i });
await collect();
check("200 000 записей при maxEntries = 1000: в кэше 1000, куча выросла < 5 МиБ", c.size === 1000 && heapMB() - before < 5, \`size=\${c.size}, рост \${(heapMB() - before).toFixed(1)} МиБ\`);

const failed = results.filter((x) => !x).length;
console.log(failed ? \`\\nПровалено: \${failed}\` : \`\\nВсе проверки пройдены: \${results.length}/\${results.length}\`);
process.exit(failed ? 1 : 0);`, { filename: "lru-cache-test.mjs", collapsed: true }),
      code("text", `✓ get/set/has/size; отсутствующий ключ → undefined
✓ LRU: при переполнении уходит самая давняя запись (b), а не самая старая по вставке — [["c","a","d"],[["b",2,"capacity"]]]
✓ перезапись обновляет значение и давность без вытеснения
✓ has() не освежает запись: «a» вытеснена
✓ TTL: до срока значение есть, после — undefined и onEvict('expired')
✓ индивидуальный ttlMs переопределяет общий; has() учитывает срок
✓ повторный set продлевает срок жизни
✓ prune() удаляет просроченные и возвращает их число
✓ maxSize: вытесняет давних, пока не уложится; запись больше лимита отвергается без вытеснения — [["b","c"],8]
✓ totalSize корректен после delete, перезаписи и истечения срока — [9,7,4,0]
✓ stats: hits, misses, evictions — {"hits":1,"misses":1,"evictions":1,"expired":0}
✓ значения undefined и null различимы через has(); delete возвращает true/false
✓ исключение в onEvict не ломает кэш
✓ 200 000 записей при maxEntries = 1000: в кэше 1000, куча выросла < 5 МиБ — size=1000, рост 0.4 МиБ

Все проверки пройдены: 14/14`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Решение в `createCache`", "Что даёт", "Что сломается без него (проверено мутацией теста)"],
        [
          ["`map.delete(key); map.set(key, entry)` при `get`", "Порядок `Map` = порядок давности (LRU)", "Вытесняется самая старая по вставке запись, а не самая давняя по обращению"],
          ["Проверка `expiresAt` при `get`/`has`", "Просроченное значение не возвращается; `onEvict(\"expired\")`", "Протухшие данные отдаются как свежие"],
          ["`if (size > maxSize) return false`", "Одна огромная запись не стирает весь кэш", "Запись больше лимита вытесняет всё остальное и сама не помещается"],
          ["`try/catch` вокруг `onEvict`", "Ошибка в колбэке не ломает вытеснение", "Исключение посреди перестройки структуры оставляет её в неконсистентном состоянии"],
          ["Учёт `totalSize` при удалении, перезаписи и истечении", "Вес всегда точен", "Кэш «думает», что занят, и вытесняет лишнее (или зависает в цикле вытеснения)"],
          ["`has()` не освежает запись", "Проверка наличия не влияет на порядок", "`has` продлевает жизнь записям, которые никто не читает"],
          ["Нет таймеров (ленивая очистка + `prune()`)", "Нет «забытых» интервалов; кэш не удерживает процесс", "Таймер очистки сам становится источником утечки"],
        ],
        "Разбор createCache",
      ),
      ul(
        "**Ограниченная память подтверждена замером:** 200 000 вставок при `maxEntries = 1000` дали размер 1000 и рост кучи менее 5 МиБ (в замере — 0,4 МиБ).",
        "**Выбор политики:** LRU хорош, когда недавние обращения предсказывают будущие; для «горячих» ключей с редкой сменой полезен TTL; для кэша «по объекту» — `WeakMap`.",
        "**Ограничения:** кэш в памяти процесса не разделяется между процессами и вкладками; для больших и долгоживущих данных нужен внешний кэш или `IndexedDB`.",
      ),
    ]),

    section("internals", [
      h("Как V8 находит мусор"),
      steps(
        [
          ["Корни", "Сборщик начинает с корней: глобальные объекты, стеки вызовов, дескрипторы, внутренние таблицы (таймеры, слушатели, очереди микро- и макрозадач)."],
          ["Пометка", "От корней обходятся ссылки; достижимые объекты помечаются живыми (параллельно и инкрементально, чтобы не блокировать поток надолго)."],
          ["Очистка", "Непомеченные объекты освобождаются (sweep); при необходимости живые объекты переносятся и уплотняются (compact)."],
          ["Поколения", "Новые объекты размещаются в молодом поколении, которое собирается часто (scavenge) и дёшево; пережившие несколько сборок переходят в старое поколение."],
          ["Слабые ссылки", "`WeakRef`, `WeakMap` и реестры обрабатываются отдельно: цели, до которых нет сильных путей, считаются мёртвыми; `deref()` может вернуть объект до конца текущей задачи."],
        ],
        "Цикл сборки мусора (по описанию V8)",
      ),
      h("Замыкания и контекст"),
      p("Переменные, захваченные хотя бы одним замыканием, размещаются в объекте-контексте области; все замыкания этой области ссылаются на **один и тот же** контекст. Поэтому оставшееся замыкание удерживает все переменные контекста, даже если само их не читает (замер: `heavy` жива, пока жив `small`, хотя использует её только выброшенное `useHeavy`). Переменные, не захваченные никем, в контекст не попадают и освобождаются вместе со стековым кадром."),
      h("Память вне кучи"),
      p("`ArrayBuffer`, `Buffer` и данные типизированных массивов выделяются вне кучи V8 (в `arrayBuffers`/`external`); сборщик освобождает их, когда собран объект-обёртка. Поэтому крупные буферы нагружают память процесса (`rss`), не увеличивая `heapUsed` (замер: 60 МиБ вне кучи). `transfer` отсоединяет буфер и передаёт память без копирования."),
      h("Утечка в Node и в браузере"),
      p("Суть одна, различаются корни: в Node — модульные переменные, `EventEmitter`, таймеры, сокеты; в браузере к ним добавляются DOM, слушатели `window`/`document`, `MutationObserver`, `IntersectionObserver`, `requestAnimationFrame`. Метрики `Nodes` и `JSEventListeners` в Chromium (замер) показывают, что утекло, раньше, чем вырастет куча JS."),
      h("Почему нельзя полагаться на финализаторы"),
      p("Движок вправе собрать объект когда угодно (или не собирать вовсе при завершении страницы); колбэк `FinalizationRegistry` вызывается как отдельная задача, возможно, после очень долгой паузы. Кроме того, объект можно «воскресить» из слабой ссылки, пока она не очищена. Поэтому финализаторы — для оптимизаций (освободить внешний ресурс, если повезёт), а не для корректности."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Подписка без отписки"),
      wrongRight(
        "js",
        {
          code: `
            class Panel {
              constructor() { window.addEventListener("resize", () => this.layout()); }   // нечем снять
            }
            // при каждом открытии панели — ещё один слушатель, удерживающий панель
          `,
          note: "Анонимная функция нельзя снять; слушатель держит `this` (панель и её DOM) до закрытия страницы.",
        },
        {
          code: `
            class Panel {
              #lifetime = new AbortController();
              constructor() { window.addEventListener("resize", () => this.layout(), { signal: this.#lifetime.signal }); }
              destroy() { this.#lifetime.abort(); }
            }
          `,
          note: "Один сигнал снимает все слушатели компонента; `destroy()` вызывается при закрытии.",
        },
      ),
      h("Ошибка 2. Кэш без границ"),
      p("`const cache = new Map()` без лимита растёт без предела (замер: рост > 5 МиБ). Задайте лимит и политику вытеснения (LRU/TTL) или используйте `WeakMap`, если ключ — объект с собственным временем жизни."),
      h("Ошибка 3. Забытый `setInterval`/`setTimeout`"),
      p("Таймер удерживает колбэк и замыкание; интервал — до `clearInterval`. В Node.js живые таймеры не дают процессу завершиться (в замере 300 интервалов держали цикл событий, поэтому скрипту пришлось вызвать `process.exit`)."),
      h("Ошибка 4. Хранить DOM-узлы в долгоживущих структурах"),
      p("Массив/словарь/замыкание с ссылкой на узел удерживает его поддерево после удаления из документа (замер: 30 000 узлов остались). Храните идентификаторы и находите узел по месту, либо используйте `WeakRef`/`WeakMap`."),
      h("Ошибка 5. Рассчитывать на `FinalizationRegistry` как на деструктор"),
      p("Колбэк может не вызваться вовсе, вызваться поздно или в другом порядке. Освобождайте ресурсы явно (`destroy`, `close`, `using`/`dispose`), а финализатор оставьте страховкой."),
      h("Ошибка 6. Замыкание захватывает больше, чем нужно"),
      p("Одно замыкание, использующее тяжёлую переменную, удерживает её для всех замыканий области (замер: `heavy` жива). Выносите создание обработчиков в отдельные функции с минимальным набором переменных."),
      h("Ошибка 7. Копировать большие буферы вместо передачи"),
      p("`structuredClone(buf)` копирует память; `structuredClone(buf, { transfer: [buf] })` передаёт без копирования (после этого `buf` отсоединён — не используйте его)."),
      h("Ошибка 8. Измерять память без сборки мусора"),
      p("`heapUsed` сразу после действия включает мусор. Для выводов о утечке нужна принудительная сборка (`--expose-gc` или CDP `HeapProfiler.collectGarbage`) и несколько раундов."),
      h("Ошибка 9. Обнулять переменную «для сборщика» везде"),
      p("`x = null` после использования не нужен для локальных переменных (они уйдут вместе с кадром); он полезен только для долгоживущих ссылок (модульные/глобальные переменные, поля объектов, кэши)."),
    ]),

    section("antipatterns", [
      ul(
        "**Глобальные массивы и объекты-«журналы»** без ограничения (логи, история действий, события).",
        "**`Map`/`Set` как кэш без политики вытеснения.**",
        "**Подписки в конструкторах и `useEffect` без отписки.**",
        "**Таймеры без идентификатора** (нечем остановить) и без привязки к жизненному циклу.",
        "**Хранение ответа сервера целиком,** когда нужно одно поле; хранение производных данных вместе с исходными.",
        "**Цепочки колбэков, захватывающие `this` компонента** и переживающие его.",
        "**Бесконечные `Promise`-ожидания** (без тайм-аута и отмены): цепочка `then` удерживает замыкания.",
        "**Лечение утечки увеличением лимита памяти** вместо поиска причины.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Каждая подписка, таймер и ресурс имеют владельца и `destroy()`;** используйте `AbortController` для массовой отмены.",
        "**Кэшам — лимит и политика** (LRU, TTL, вес); привязку к объектам делайте через `WeakMap`.",
        "**Не храните то, что можно получить заново** (DOM-узлы, большие ответы): храните идентификаторы и минимальные данные.",
        "**Тяжёлые данные — в отдельные функции/модули,** чтобы замыкания не удерживали их без нужды.",
        "**Большие бинарные данные:** потоки вместо целиком в память, `transfer` вместо копирования, `Buffer.allocUnsafe` только осознанно.",
        "**Измеряйте:** повторяйте сценарий, принудительно собирайте мусор, сравнивайте последовательные замеры и снимки; в браузере — Memory и Performance monitor.",
        "**Автоматизируйте контроль:** тест «действие не течёт» (`checkLeak`) в CI для критичных сценариев.",
        "**Слабые ссылки — только для кэшей и необязательной очистки;** корректность не должна от них зависеть.",
      ),
      tip("В DevTools Memory используйте приём «трёх снимков»: сделайте снимок после загрузки, выполните действие, снимок, выполните действие ещё раз, снимок; в третьем смотрите объекты, созданные между вторым и третьим снимками и не освобождённые, — это и есть утечка."),
    ]),

    section("edge-cases", [
      h("Утечки через промисы и замыкания обработчиков ошибок"),
      p("Промис, который никогда не завершается, удерживает все замыкания своей цепочки. Добавляйте тайм-ауты (`AbortSignal.timeout`) и отмену — см. [async/await, отмена и AbortController](/learn/js/async-await-abort)."),
      h("`console.log` и открытый DevTools"),
      p("Объекты, выведенные в консоль при открытых DevTools, могут удерживаться консолью — отладка «ломает» картину: в замерах утечек консоль должна быть закрыта (или замеры — в CDP-сессии без консоли, как в нашем скрипте)."),
      h("Слабые ссылки и WeakRef в кэшах"),
      p("`Map<key, WeakRef<value>>` не освобождает записи с мёртвыми ссылками — сами ключи остаются; чистите их через `FinalizationRegistry` или при обращении. И помните: объект доступен через `deref()` как минимум до конца текущей задачи."),
      h("Строки и срезы"),
      p("Движки вправе разделять память между строкой и её частями (срезы, склейка «верёвкой»), поэтому маленькая подстрока большой строки в некоторых случаях удерживает её целиком; поведение зависит от движка и версии. Если надолго сохраняете малую часть большого текста, проверьте это снимком кучи, а не предположением."),
      h("Память и `Worker`/`SharedArrayBuffer`"),
      p("У воркера — своя куча; обмен данными копирует (или передаёт буферы через `transfer`). `SharedArrayBuffer` разделяет память между потоками, но требует синхронизации (`Atomics`) и специальных заголовков безопасности в браузере."),
      h("Принудительная сборка — только для измерений"),
      p("`gc()` (`--expose-gc`) и CDP `collectGarbage` нужны для замеров. В продакшене не вызывайте сборку «для порядка»: это ломает оптимизации движка."),
    ]),

    section("related", [
      ul(
        "[Замыкания](/learn/js/closures) — что захватывает функция и почему контекст общий.",
        "[Map, Set, WeakMap и WeakSet](/learn/js/map-set-weak) — слабые коллекции и привязка данных к объектам.",
        "[DOM и события](/learn/js/dom-events) — подписки, `signal`, снятие слушателей и утечки.",
        "[Хранилища, URL, History и таймеры](/learn/js/storage-url-timers) — таймеры, `setInterval` и их жизненный цикл.",
        "[Ошибки и отладка](/learn/js/errors-debugging) — исчерпание памяти как аварийное завершение, снимки и DevTools.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Панель, которая течёт: подписка, интервал и кэш без границ",
          code: `
            const cache = new Map();
            function openPanel(id) {
              const data = loadHugeData(id);
              cache.set(id, data);                                       // кэш растёт бесконечно
              window.addEventListener("resize", () => draw(data));       // нечем снять
              setInterval(() => refresh(id, data), 5000);                // не остановить
            }
          `,
          note: "Каждое открытие панели оставляет в памяти данные, слушатель и интервал; после сотни открытий вкладка тормозит и падает.",
        },
        {
          title: "Владелец ресурсов, сигнал отмены и ограниченный кэш",
          code: `
            const cache = createCache({ maxEntries: 20, ttlMs: 60_000 });
            function openPanel(id) {
              const lifetime = new AbortController();
              const data = cache.get(id) ?? (cache.set(id, loadHugeData(id)), cache.get(id));
              window.addEventListener("resize", () => draw(data), { signal: lifetime.signal });
              const timer = setInterval(() => refresh(id, data), 5000);
              lifetime.signal.addEventListener("abort", () => clearInterval(timer));
              return { close: () => lifetime.abort() };                  // один вызов освобождает всё
            }
          `,
          note: "Кэш ограничен, слушатель и интервал привязаны к сигналу жизни панели — закрытие панели разрывает все ссылки.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.memory-gc.ex1",
      title: "Что будет собрано",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код (раздел «Минимальный пример»), определите для каждого объекта A–H, будет ли он собран, и назовите причину: кто (не) держит ссылку."),
        code("js", `import { collect } from "./_gc.mjs";   // collect(): сборка мусора с паузами для WeakRef (хелпер из этой темы)

const alive = {};
const track = (name, obj) => { alive[name] = new WeakRef(obj); };

let a = { n: "A" };                      // A: доступна по переменной
track("A", a);

let c = { n: "C", child: { n: "B" } };   // B: доступна только через C
track("B", c.child);
track("C", c);
c = c.child = null;                      // и C, и B теперь недостижимы? (подумайте!)

let d = { n: "D" };                      // D: замыкание читает переменную d
const readD = () => d.n;
track("D", d);
d = null;

let e = { n: "E" };                      // E: ключ в WeakMap
const meta = new WeakMap([[e, "метаданные"]]);
track("E", e);
e = null;

let f = { n: "F" };                      // F: ключ в Map
const registry = new Map([[f, "запись"]]);
track("F", f);
f = null;

let g = { n: "G" }, h = { n: "H" };      // G и H ссылаются друг на друга
g.h = h; h.g = g;
track("G", g); track("H", h);
g = h = null;

await collect();
console.log(Object.entries(alive).map(([name, ref]) => \`\${name}: \${ref.deref() ? "жива" : "собрана"}\`).join("\\n"));
void [readD, meta, registry];`, { filename: "x1-predict.mjs", collapsed: true }),
      ],
      hints: ["Что считается корнем, от которого идёт достижимость?", "Удерживает ли ключ `WeakMap` и ключ `Map` свой объект одинаково?"],
      checks: ["A и F живы; остальные собраны", "Объяснены циклы, `Map`/`WeakMap`, замыкание", "Объяснено, что `d = null` обнуляет ссылку, а не объект"],
      solution: [
        code("text", `A: жива
B: собрана
C: собрана
D: собрана
E: собрана
F: жива
G: собрана
H: собрана`, { filename: "вывод Node.js 22.22.0" }),
        p("Живы `A` (переменная) и `F` (ключ `Map` — сильная ссылка). `C` и `B` недостижимы после `c = c.child = null`. `D`: замыкание читает переменную `d`, а в ней `null`. `E`: ключ `WeakMap` слабый. `G` и `H`: цикл без внешних ссылок собирается (это не подсчёт ссылок)."),
      ],
    }),
    exercise({
      id: "js.memory-gc.ex2",
      title: "Виджет, который не освобождается",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("После создания и «уничтожения» 300 виджетов в процессе остаются 300 подписок, 300 таймеров и 300 записей в кэше. Найдите три источника утечки по замеру, реализуйте `destroy()` и покажите по тому же замеру, что утечки нет."),
        code("js", `import { EventEmitter } from "node:events";
import { collect, heapMB } from "./_gc.mjs";

const bus = new EventEmitter();
bus.setMaxListeners(Infinity);
const history = new Map();               // «кэш последних значений»
const timers = () => process.getActiveResourcesInfo().filter((r) => r === "Timeout").length;

class Widget {
  constructor(id) {
    this.id = id;
    this.data = new Array(2000).fill(id);                    // «тяжёлое» состояние
    bus.on("tick", () => this.data.length);                  // подписка на общую шину
    this.timer = setInterval(() => this.data.length, 1e6);   // периодический опрос
    history.set(id, this.data);                              // запись в общий кэш
  }
  destroy() { /* пока пусто */ }
}

await collect();
const before = heapMB();
for (let i = 0; i < 300; i++) new Widget("w" + i).destroy();
await collect();

console.log("создали и «уничтожили» 300 виджетов:");
console.log("  подписок на шине:", bus.listenerCount("tick"));
console.log("  живых таймеров:", timers());
console.log("  записей в кэше:", history.size);
console.log("  куча выросла более чем на 2 МиБ:", heapMB() - before > 2);
process.exit(0);                         // сам процесс не завершился бы: 300 интервалов держат цикл событий`, { filename: "x2-leaky.mjs", collapsed: true }),
      ],
      hints: ["Что нужно сделать, чтобы `bus.off` смог снять именно эту подписку?", "Какой идентификатор вернёт `setInterval`?", "Кто ещё хранит `this.data`?"],
      checks: ["Названы три источника (подписка, таймер, кэш)", "Функция-слушатель сохранена в поле", "После исправления: 0 подписок, 0 таймеров, 0 записей, куча не растёт"],
      solution: [
        code("text", `создали и «уничтожили» 300 виджетов:
  подписок на шине: 300
  живых таймеров: 300
  записей в кэше: 300
  куча выросла более чем на 2 МиБ: true`, { filename: "до исправления (Node.js 22.22.0)" }),
        code("js", `import { EventEmitter } from "node:events";
import { collect, heapMB } from "./_gc.mjs";

const bus = new EventEmitter();
bus.setMaxListeners(Infinity);
const history = new Map();
const timers = () => process.getActiveResourcesInfo().filter((r) => r === "Timeout").length;

class Widget {
  #lifetime = new AbortController();
  constructor(id) {
    this.id = id;
    this.data = new Array(2000).fill(id);
    this.onTick = () => this.data.length;
    bus.on("tick", this.onTick);
    this.timer = setInterval(() => this.data.length, 1e6);
    history.set(id, this.data);
  }
  destroy() {
    bus.off("tick", this.onTick);        // подписку снимаем тем же значением функции
    clearInterval(this.timer);           // останавливаем таймер
    history.delete(this.id);             // убираем запись из общего кэша
    this.data = null;                    // и (необязательно) отпускаем само состояние
  }
}

await collect();
const before = heapMB();
for (let i = 0; i < 300; i++) new Widget("w" + i).destroy();
await collect();

console.log("создали и «уничтожили» 300 виджетов (с исправленным destroy):");
console.log("  подписок на шине:", bus.listenerCount("tick"));
console.log("  живых таймеров:", timers());
console.log("  записей в кэше:", history.size);
console.log("  куча выросла более чем на 2 МиБ:", heapMB() - before > 2);`, { filename: "x2-fixed.mjs", collapsed: true }),
        code("text", `создали и «уничтожили» 300 виджетов (с исправленным destroy):
  подписок на шине: 0
  живых таймеров: 0
  записей в кэше: 0
  куча выросла более чем на 2 МиБ: false`, { filename: "после исправления" }),
        p("Три ссылки удерживали виджет: слушатель на общей шине (`bus.on`), интервал (`setInterval`) и запись в общем `Map`. Исправление: сохранить функцию слушателя в поле (`this.onTick`) и снять `bus.off(\"tick\", this.onTick)`, остановить `clearInterval(this.timer)` и удалить `history.delete(this.id)`. Параллельно видно побочный эффект утечки: 300 живых интервалов не дали бы процессу завершиться без `process.exit`."),
      ],
    }),
    exercise({
      id: "js.memory-gc.ex3",
      title: "Детектор утечек",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Напишите `checkLeak(action, { rounds, warmup, toleranceMB, collect, heapMB })`: прогрейте действие, затем повторяйте его, после каждого раунда собирая мусор и замеряя кучу. Верните `{ leaked, growthMB, samples }`. Утечкой считайте **устойчивый** рост, превышающий допуск; одиночный всплеск и микроскопический рост — не утечка; без `collect` функция должна отказываться работать."),
      ],
      hints: ["Почему одного замера «до и после» недостаточно?", "Как отличить всплеск от устойчивого роста?", "Зачем нужен прогрев?"],
      checks: ["Критерий: рост выше допуска и устойчивый (доля растущих раундов)", "Поддерживает асинхронные действия", "Все 6 проверок теста проходят"],
      solution: [
        code("js", `// Проверка «действие не течёт»: повторяем его, собираем мусор и смотрим на рост кучи.
export async function checkLeak(action, { rounds = 8, warmup = 2, toleranceMB = 1, collect, heapMB = () => process.memoryUsage().heapUsed / 1048576 } = {}) {
  if (typeof collect !== "function") throw new TypeError("нужна функция collect(): сборка мусора с паузой для WeakRef");
  for (let i = 0; i < warmup; i++) await action(i);            // прогрев: JIT, кэши, ленивая инициализация
  await collect();
  const samples = [];
  for (let i = 0; i < rounds; i++) {
    await action(warmup + i);
    await collect();
    samples.push(heapMB());
  }
  const growth = samples.at(-1) - samples[0];
  const rising = samples.slice(1).filter((value, i) => value > samples[i]).length;   // сколько раз подряд куча росла
  const leaked = growth > toleranceMB && rising >= Math.ceil((rounds - 1) * 0.7);    // рост устойчивый, а не одиночный всплеск
  return { leaked, growthMB: Number(growth.toFixed(2)), samples: samples.map((s) => Number(s.toFixed(1))) };
}`, { filename: "leak-check.mjs" }),
        code("js", `import { collect } from "../_gc.mjs";
const { checkLeak } = await import(process.argv[2] ? new URL(process.argv[2], import.meta.url) : "./leak-check.mjs");
const results = [];
const check = (name, ok, info = "") => { results.push(ok); console.log((ok ? "✓ " : "✗ ") + name + (info ? " — " + info : "")); };

const stash = [];
const leaky = await checkLeak(() => { stash.push(new Array(100_000).fill({ x: 1 })); }, { collect });
check("накопление данных в глобальном массиве распознано как утечка", leaky.leaked === true && leaky.growthMB > 1, JSON.stringify({ growthMB: leaky.growthMB }));
stash.length = 0;

const clean = await checkLeak(() => { const tmp = new Array(100_000).fill({ x: 1 }); return tmp.length; }, { collect });
check("временные данные — не утечка", clean.leaked === false, JSON.stringify({ growthMB: clean.growthMB }));

const cache = new Map();
const asyncLeak = await checkLeak(async (i) => { await new Promise((r) => setTimeout(r)); for (let k = 0; k < 5000; k++) cache.set(i + ":" + k, { payload: "x".repeat(40) }); }, { collect });
check("асинхронное действие с растущим кэшем распознано", asyncLeak.leaked === true);
cache.clear();

const oneOff = [];
const spike = await checkLeak((i) => { if (i === 4) oneOff.push(new Array(1_000_000).fill(1)); }, { collect, warmup: 0 });
check("одиночный всплеск в середине серии (рост есть, устойчивого роста нет) — не утечка", spike.leaked === false && spike.growthMB > 1, JSON.stringify({ growthMB: spike.growthMB }));

const tiny = [];
const slow = await checkLeak(() => { tiny.push("x".repeat(1000)); }, { collect });
check("устойчивый, но микроскопический рост ниже допуска — не утечка", slow.leaked === false && slow.growthMB < 1, JSON.stringify({ growthMB: slow.growthMB }));

let rejected = null;
try { await checkLeak(() => {}, {}); } catch (e) { rejected = e.name; }
check("без collect() функция отказывается работать (иначе замер бессмыслен)", rejected === "TypeError");

const failed = results.filter((x) => !x).length;
console.log(failed ? \`\\nПровалено: \${failed}\` : \`\\nВсе проверки пройдены: \${results.length}/\${results.length}\`);
process.exit(failed ? 1 : 0);`, { filename: "leak-check-test.mjs", collapsed: true }),
        code("text", `✓ накопление данных в глобальном массиве распознано как утечка — {"growthMB":5.37}
✓ временные данные — не утечка — {"growthMB":0}
✓ асинхронное действие с растущим кэшем распознано
✓ одиночный всплеск в середине серии (рост есть, устойчивого роста нет) — не утечка — {"growthMB":7.63}
✓ устойчивый, но микроскопический рост ниже допуска — не утечка — {"growthMB":0.01}
✓ без collect() функция отказывается работать (иначе замер бессмыслен)

Все проверки пройдены: 6/6`, { filename: "результат запуска (Node.js 22.22.0)" }),
        p("Критерий — два условия: итоговый рост больше допуска **и** куча росла в большинстве раундов (не менее 70 %). Прогрев исключает разовые затраты (JIT, ленивые структуры), а сборка мусора после каждого раунда убирает временные объекты. Проверено мутациями: без проверки устойчивости одиночный всплеск считается утечкой, без допуска — микророст; без сборки мусора временные данные дают ложное срабатывание."),
      ],
    }),
  ],

  challenge: {
    id: "js.memory-gc.challenge",
    title: "createCache: LRU, TTL и вес без утечек",
    scenario: [
      p("Сервис кэширует ответы внешнего API в `Map`. Через сутки процесс падает с нехваткой памяти, а часть данных в кэше устарела. Напишите кэш, который ограничивает память по числу записей и суммарному весу, не отдаёт просроченное и не требует таймеров."),
    ],
    requirements: [
      "`createCache({ maxEntries, maxSize, sizeOf, ttlMs, now, onEvict })` возвращает `{ get, has, set, delete, prune, clear, keys, size, totalSize, stats }`",
      "LRU: `get` освежает запись; при переполнении вытесняется самая давняя; `has` порядок не меняет; перезапись освежает и не вытесняет",
      "TTL: срок общий и индивидуальный (`set(key, value, { ttlMs })`); просроченное не возвращается (`get`/`has`), удаляется с `onEvict(key, value, \"expired\")`; повторный `set` продлевает срок; `prune()` удаляет все просроченные и возвращает их число",
      "Вес: `sizeOf(value)`, `maxSize`; вытесняются давние записи, пока суммарный вес не уложится; запись тяжелее `maxSize` отвергается (`set` возвращает `false`) без вытеснения остальных",
      "`onEvict(key, value, reason)` с причинами `capacity`, `expired`, `deleted`; исключение в нём не ломает кэш",
      "`stats()` возвращает `hits`, `misses`, `evictions`, `expired`; значения `undefined` и `null` различимы через `has`",
      "Память ограничена: при 200 000 вставок и `maxEntries = 1000` в кэше 1000 записей и куча не растёт более чем на 5 МиБ",
    ],
    constraints: [
      "Без внешних библиотек и без таймеров (`setTimeout`/`setInterval`); время внедряется параметром `now`",
      "Порядок давности хранить на `Map` (без собственных связных списков)",
    ],
    acceptance: [
      "Все 14 проверок теста проходят (3 запуска подряд)",
      "Мутации — без освежения при `get`, без проверки срока, без отказа для слишком тяжёлой записи, без защиты `onEvict`, без учёта веса при перезаписи, без отказа от освежения в `has` — обнаруживаются тестом (красная проверка или зависание)",
    ],
    hints: [
      "Какая особенность `Map` позволяет обойтись без списка давности?",
      "Что должно произойти с весом при `set` существующего ключа?",
      "Почему запись тяжелее лимита нельзя «впихнуть», вытеснив всё остальное?",
    ],
    solution: [
      code("js", `// Кэш с ограничением по числу записей, суммарному «весу» и времени жизни. Без таймеров: просроченное удаляется при обращении и в prune().
export function createCache({ maxEntries = Infinity, maxSize = Infinity, sizeOf = () => 1, ttlMs = Infinity, now = Date.now, onEvict } = {}) {
  const map = new Map();                 // порядок вставки = порядок давности: первый — самый «старый»
  const stats = { hits: 0, misses: 0, evictions: 0, expired: 0 };
  let totalSize = 0;

  const notify = (key, value, reason) => { try { onEvict?.(key, value, reason); } catch { /* колбэк не должен ломать кэш */ } };
  const isExpired = (entry) => entry.expiresAt <= now();

  function remove(key, entry, reason) {
    map.delete(key);
    totalSize -= entry.size;
    if (reason === "capacity") stats.evictions++;
    if (reason === "expired") stats.expired++;
    notify(key, entry.value, reason);
  }

  function evictToFit() {
    while (map.size > maxEntries || totalSize > maxSize) {
      const [oldestKey, oldest] = map.entries().next().value;
      remove(oldestKey, oldest, "capacity");
    }
  }

  return {
    get(key) {
      const entry = map.get(key);
      if (!entry) { stats.misses++; return undefined; }
      if (isExpired(entry)) { remove(key, entry, "expired"); stats.misses++; return undefined; }
      map.delete(key); map.set(key, entry);              // освежаем давность: переносим в конец
      stats.hits++;
      return entry.value;
    },
    has(key) {                                           // не меняет давность и статистику
      const entry = map.get(key);
      if (!entry) return false;
      if (isExpired(entry)) { remove(key, entry, "expired"); return false; }
      return true;
    },
    set(key, value, { ttlMs: ttl = ttlMs } = {}) {
      const size = sizeOf(value);
      if (size > maxSize) return false;                  // одна запись больше всего лимита: не вытесняем ради неё остальных
      const previous = map.get(key);
      if (previous) { map.delete(key); totalSize -= previous.size; }
      map.set(key, { value, size, expiresAt: ttl === Infinity ? Infinity : now() + ttl });
      totalSize += size;
      evictToFit();
      return true;
    },
    delete(key) {
      const entry = map.get(key);
      if (!entry) return false;
      remove(key, entry, "deleted");
      return true;
    },
    prune() {                                            // удалить все просроченные, вернуть их число
      let removed = 0;
      for (const [key, entry] of [...map]) if (isExpired(entry)) { remove(key, entry, "expired"); removed++; }
      return removed;
    },
    clear() { map.clear(); totalSize = 0; },
    keys: () => [...map.keys()],                         // от самого давнего к самому свежему
    get size() { return map.size; },
    get totalSize() { return totalSize; },
    stats: () => ({ ...stats }),
  };
}`, { filename: "lru-cache.mjs", lineNumbers: true }),
      code("text", `✓ get/set/has/size; отсутствующий ключ → undefined
✓ LRU: при переполнении уходит самая давняя запись (b), а не самая старая по вставке — [["c","a","d"],[["b",2,"capacity"]]]
✓ перезапись обновляет значение и давность без вытеснения
✓ has() не освежает запись: «a» вытеснена
✓ TTL: до срока значение есть, после — undefined и onEvict('expired')
✓ индивидуальный ttlMs переопределяет общий; has() учитывает срок
✓ повторный set продлевает срок жизни
✓ prune() удаляет просроченные и возвращает их число
✓ maxSize: вытесняет давних, пока не уложится; запись больше лимита отвергается без вытеснения — [["b","c"],8]
✓ totalSize корректен после delete, перезаписи и истечения срока — [9,7,4,0]
✓ stats: hits, misses, evictions — {"hits":1,"misses":1,"evictions":1,"expired":0}
✓ значения undefined и null различимы через has(); delete возвращает true/false
✓ исключение в onEvict не ломает кэш
✓ 200 000 записей при maxEntries = 1000: в кэше 1000, куча выросла < 5 МиБ — size=1000, рост 0.4 МиБ

Все проверки пройдены: 14/14`, { filename: "результат запуска (Node.js 22.22.0)" }),
      p("`Map` помнит порядок вставки: `get` удаляет и вставляет запись заново (в конец), поэтому первая запись всегда самая давняя. Срок проверяется лениво при обращении и массово в `prune()`, поэтому таймеры не нужны. Вес хранится в записи и учитывается при каждом добавлении и удалении (`remove`) — в том числе при перезаписи. Запись тяжелее `maxSize` отвергается до любых изменений. Проверено мутациями: каждая из семи поломок обнаруживается красной проверкой или зависанием цикла вытеснения."),
    ],
  },

  interview: [
    iq("js.memory-gc.i1", "basic", "Как работает сборка мусора в JavaScript?", [
      ul(
        "Движок освобождает объекты, недостижимые от корней (глобальные переменные, активные вызовы, внутренние структуры); подсчёта ссылок нет, поэтому циклы не мешают.",
        "В V8 сборщик поколенческий: молодое поколение собирается часто и быстро, старое — реже, инкрементально и параллельно.",
        "Вы не управляете сборкой напрямую; ваша задача — не держать лишних ссылок.",
      ),
    ]),
    iq("js.memory-gc.i2", "basic", "Что такое утечка памяти и приведите три типичные причины.", [
      ul(
        "Объекты ненужны программе, но достижимы и потому не освобождаются; память растёт после сборок мусора.",
        "Причины: глобальные накопители и кэши без лимита, слушатели без отписки, `setInterval` без остановки, ссылки на удалённые DOM-узлы, замыкания с тяжёлыми данными.",
        "Симптом: рост кривой памяти, подвисания, аварийное завершение.",
      ),
    ]),
    iq("js.memory-gc.i3", "intermediate", "Чем `WeakMap` отличается от `Map` и когда нужен `WeakRef`?", [
      ul(
        "Ключи `WeakMap` — объекты и не удерживаются: без других ссылок на ключ запись исчезает; итерации и `size` нет.",
        "`WeakRef` хранит слабую ссылку на значение (`deref()` может вернуть `undefined`); подходит для кэшей, где значение можно пересоздать.",
        "Момент сборки не гарантирован — корректность не должна от него зависеть; `FinalizationRegistry` — для необязательной очистки.",
      ),
    ]),
    iq("js.memory-gc.i4", "intermediate", "Почему замыкание может удерживать данные, которыми не пользуется?", [
      ul(
        "Все замыкания одной области делят общий контекст с захваченными переменными: если хоть одно использует `heavy`, оно в контексте и живёт, пока жив любой «сосед».",
        "Решение: выносить создание обработчиков в отдельные функции, не захватывать лишнее, обнулять поля после использования.",
        "Замер: возвращённое `small()` удерживало `heavy` из-за выброшенного `useHeavy`.",
      ),
    ]),
    iq("js.memory-gc.i5", "intermediate", "Как найти утечку в браузере?", [
      ul(
        "DevTools → Memory: снимки кучи («до», «после действия», «после ещё одного»), сравнение, поиск `Detached` и цепочки Retainers; Performance monitor — число узлов и слушателей; запись Allocation timeline.",
        "Воспроизвести сценарий несколько раз (открыть/закрыть компонент) и смотреть рост после принудительной сборки мусора.",
        "Исправить причину (отписка, обнуление ссылки, лимит кэша) и закрепить тестом на рост памяти.",
      ),
    ]),
    iq("js.memory-gc.i6", "advanced", "Что произойдёт при нехватке памяти в Node.js и как ею управлять?", [
      ul(
        "Процесс завершается аварийно (`FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`), `try/catch` и `finally` не выполняются.",
        "Лимит старого поколения поднимается флагом `--max-old-space-size`, но это отсрочка: ищите причину (снимки, `--heapsnapshot-near-heap-limit`).",
        "Профилактика: потоки вместо целиком в память, ограниченные кэши, `transfer`, мониторинг `process.memoryUsage()`.",
      ),
    ]),
    iq("js.memory-gc.i7", "engineering", "Как спроектировать кэш в памяти процесса?", [
      ul(
        "Границы: максимум записей и (или) суммарный вес; политика вытеснения (LRU), TTL для устаревания; ленивая очистка и `prune()` вместо вечных таймеров.",
        "Метрики: hits/misses/evictions; `onEvict` с причиной; защита колбэка.",
        "Для ключей-объектов — `WeakMap`; для разделяемых данных — внешний кэш; тесты на порядок, срок, вес и ограничение памяти.",
      ),
    ]),
    iq("js.memory-gc.i8", "debugging", "Страница работает, но после часа использования подвисает, а Performance monitor показывает рост числа DOM-узлов. Что делать?", [
      ul(
        "Подозревать «оторванные» узлы: массив/кэш/замыкание/слушатель удерживает удалённые из документа узлы.",
        "В Memory искать `Detached` узлы и открыть Retainers: кто держит; проверить слушатели на `window`/`document`, `MutationObserver`, таймеры.",
        "Исправить: снять слушатели через `signal`, обнулить ссылки, хранить идентификаторы вместо узлов; добавить тест, который открывает/закрывает компонент и сверяет число узлов.",
      ),
    ]),
  ],

  exam: [
    mcq("js.memory-gc.e1", "foundation", "Когда объект может быть собран сборщиком мусора?", ["Когда он больше не нужен программе", "Когда на него нет переменных в текущей функции", "Когда до него нельзя добраться от корней", "Когда счётчик ссылок равен нулю"], 2, "Критерий — достижимость от корней; «ненужность» движок определить не может, а подсчёта ссылок в JS-движках нет."),
    mcq("js.memory-gc.e2", "foundation", "Что произойдёт с объектами `a` и `b` после `a.other = b; b.other = a; a = b = null`?", ["Будут собраны", "Утекут: ссылаются друг на друга", "Будут собраны только при перезагрузке", "Зависит от порядка присваиваний"], 0, "Сборка идёт от корней, а не по счётчику: без внешних ссылок цикл недостижим (замер: оба собраны)."),
    mcq("js.memory-gc.e3", "intermediate", "Что удерживает объект после удаления соответствующего DOM-элемента из документа?", ["Ничего — он удаляется автоматически", "Только кэш браузера", "Только `WeakRef`", "Любая достижимая ссылка: массив, замыкание, слушатель"], 3, "Узел остаётся, пока достижим из JavaScript (замер: 30 000 узлов остались, пока массив `window.cache` держал ссылки)."),
    mcq("js.memory-gc.e4", "intermediate", "Что верно про `FinalizationRegistry`? Выберите все.", ["Гарантирует вызов колбэка", "Колбэк вызывается после сборки объекта и не мгновенно", "Подходит для обязательного закрытия файлов", "Подходит для необязательной очистки"], [1, 3], "Момент и сам факт вызова не гарантируются; для корректности нужны явные `close`/`destroy`."),
    mcq("js.memory-gc.e5", "intermediate", "Почему `Map`-кэш без ограничений — потенциальная утечка?", ["`Map` медленный", "Записи достижимы через сам `Map` и не освобождаются, пока их не удалят", "`Map` не поддерживает `delete`", "Сборщик мусора не умеет работать с `Map`"], 1, "Все ключи и значения достижимы через карту (замер: рост > 5 МиБ без вытеснения, < 1 МиБ с лимитом)."),
    mcq("js.memory-gc.e6", "advanced", "Что произойдёт с `heavy` в `function pair() { const heavy = {…}; const useHeavy = () => heavy.id; const small = () => 1; return small; }` после вызова `pair()` и сохранения только `small`?", ["`heavy` будет собран сразу", "Произойдёт `ReferenceError`", "`heavy` будет собран, только если вызвать `small()`", "`heavy` останется в памяти, пока жив `small`"], 3, "`useHeavy` захватывает `heavy`, и замыкания одной функции делят общий контекст: `small` удерживает его (замер: `heavy` жива)."),
    mcq("js.memory-gc.e7", "advanced", "Что делает `structuredClone(buf, { transfer: [buf] })`?", ["Копирует буфер", "Сжимает буфер", "Передаёт владение буфером без копирования и отсоединяет исходный", "Делает буфер общим для двух потоков"], 2, "После передачи исходный `buf.byteLength` равен 0 и `detached === true`, новый буфер полноразмерный (замер)."),
    open("js.memory-gc.e8", "intermediate", "Объясните, как вы докажете, что в приложении есть утечка памяти, и как найдёте её причину.", [
      ul(
        "Доказать: повторять действие несколько раз, после каждого принудительно собирать мусор и смотреть на устойчивый рост кучи/числа узлов; сравнить с контролем (действие без нужного шаблона).",
        "Найти: снимки кучи (до/после/ещё раз), поиск растущих классов, `Detached` узлов, цепочка Retainers; проверка слушателей, таймеров, кэшей, замыканий.",
        "Исправить причину (отписка, лимит, обнуление ссылки) и закрепить автотестом на рост памяти.",
      ),
    ], ["Описан замер после сборки мусора", "Описаны снимки и Retainers", "Названо исправление и тест"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.memory-gc.m1", "intermediate", "Что даёт приём «ключ — объект, значение — метаданные в `WeakMap`»?", ["Быстрее поиск, чем в `Map`", "Метаданные исчезают вместе с объектом без явной очистки", "Можно перебрать все объекты", "Метаданные сохраняются между сессиями"], 1, "Ключ `WeakMap` не удерживает объект: после потери всех сильных ссылок запись исчезает (замер: ключ `Map` жив, ключ `WeakMap` собран)."),
    mcq("js.memory-gc.m2", "advanced", "Почему при замере утечки нужно «уступить циклу событий» перед `gc()`, если используется `WeakRef`?", ["Цель `WeakRef` остаётся живой до конца текущей задачи", "`gc()` асинхронный", "Сборщик работает только в микрозадачах", "`WeakRef` обнуляется `setTimeout`"], 0, "Спецификация удерживает цель слабой ссылки до конца текущей задачи (job); без паузы `deref()` ещё вернёт объект."),
    open("js.memory-gc.m3", "advanced", "В SPA при каждом переходе между экранами память растёт на 3–5 МиБ и не возвращается. Опишите план поиска и устранения.", [
      ul(
        "Воспроизвести: повторять переход (A→B→A) 10–20 раз с принудительной сборкой мусора; построить кривую памяти и счётчик узлов/слушателей (Performance monitor).",
        "Снимки: после первого перехода (прогрев) и после нескольких — сравнить; искать экземпляры экрана/компонентов и `Detached` узлы; в Retainers найти, кто держит (глобальный стор, шина событий, `window`-слушатель, таймер, кэш).",
        "Исправить: `destroy()` у экрана (отписка через `AbortController`, `clearInterval`, закрытие соединений), очистка подписок на стор, ограничение кэшей, не хранить узлы.",
        "Закрепить тестом: автоматический сценарий открытия/закрытия экрана и проверка числа узлов/слушателей (метрики CDP) или `checkLeak`.",
      ),
    ], ["Описан воспроизводимый замер", "Описаны снимки и Retainers", "Названы типичные причины и исправления", "Предложен автотест"], { format: "debug" }),
    open("js.memory-gc.m4", "advanced", "Спроектируйте обработку большого файла (2 ГБ) в Node.js так, чтобы память процесса оставалась малой.", [
      ul(
        "Потоки: чтение `fs.createReadStream`, построчная/покусочная обработка через `pipeline` и преобразующие потоки, обратное давление (`backpressure`).",
        "Не загружать файл целиком (`readFile`), не накапливать результат в массиве: агрегировать на лету или писать в поток вывода.",
        "Буферы: переиспользовать, `transfer` между воркерами, ограничить размер порций (`highWaterMark`).",
        "Мониторинг: `process.memoryUsage()`, лимит `--max-old-space-size` как страховка; тест на файле большого размера с проверкой пика памяти.",
      ),
    ], ["Названы потоки и backpressure", "Названо отсутствие накопления", "Названы мониторинг и тест"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.memory-gc.f1", front: "Когда объект собирается?", back: "Когда недостижим от корней (глобальные, активные вызовы, таймеры, слушатели). Подсчёта ссылок нет — циклы собираются." },
    { id: "js.memory-gc.f2", front: "Утечка = ?", back: "Ненужное, но достижимое: накопитель, Map-кэш без лимита, on() без off(), setInterval без clear, ссылка на удалённый DOM-узел, замыкание с тяжёлыми данными." },
    { id: "js.memory-gc.f3", front: "Замыкания и память?", back: "Замыкания одной области делят общий контекст: одно использует heavy — все «соседи» удерживают heavy." },
    { id: "js.memory-gc.f4", front: "Weak*?", back: "WeakMap/WeakSet/WeakRef не удерживают объект; deref() может вернуть undefined; FinalizationRegistry — только для необязательной очистки." },
    { id: "js.memory-gc.f5", front: "Как измерять?", back: "Повторить действие, принудительно собрать мусор (--expose-gc / CDP), смотреть рост между раундами; в браузере — Nodes и JSEventListeners, снимки кучи (3 снимка)." },
    { id: "js.memory-gc.f6", front: "Память вне кучи?", back: "Buffer/ArrayBuffer — в arrayBuffers/external; transfer передаёт без копирования и отсоединяет исходный (byteLength 0)." },
    { id: "js.memory-gc.f7", front: "Нехватка памяти в Node?", back: "FATAL ERROR: Reached heap limit … heap out of memory; try/catch не спасает; --max-old-space-size — отсрочка." },
    { id: "js.memory-gc.f8", front: "Кэш в памяти?", back: "Лимит записей/веса, LRU, TTL (ленивое истечение + prune), onEvict с причиной; без таймеров; ключи-объекты — WeakMap." },
  ],

  sources: [
    { title: "ECMAScript: WeakRef Objects", url: "https://tc39.es/ecma262/#sec-weak-ref-objects", publisher: "ECMA" },
    { title: "ECMAScript: FinalizationRegistry Objects", url: "https://tc39.es/ecma262/#sec-finalization-registry-objects", publisher: "ECMA" },
    { title: "ECMAScript: WeakMap Objects", url: "https://tc39.es/ecma262/#sec-weakmap-objects", publisher: "ECMA" },
    { title: "V8: Trash talk — the Orinoco garbage collector", url: "https://v8.dev/blog/trash-talk", publisher: "Other" },
    { title: "V8: Memory terminology", url: "https://v8.dev/blog/memory-terminology", publisher: "Other" },
    { title: "MDN: Memory management", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management", publisher: "MDN" },
    { title: "MDN: WeakRef", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef", publisher: "MDN" },
    { title: "MDN: FinalizationRegistry", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry", publisher: "MDN" },
    { title: "MDN: structuredClone()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone", publisher: "MDN" },
    { title: "Node.js: v8.writeHeapSnapshot и v8.getHeapStatistics", url: "https://nodejs.org/api/v8.html", publisher: "Other" },
    { title: "Node.js: process.memoryUsage()", url: "https://nodejs.org/api/process.html#processmemoryusage", publisher: "Other" },
    { title: "Chrome DevTools: Memory", url: "https://developer.chrome.com/docs/devtools/memory-problems", publisher: "Other" },
  ],
};
