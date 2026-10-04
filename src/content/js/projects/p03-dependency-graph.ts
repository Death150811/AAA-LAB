import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p03DependencyGraph: Project = {
  id: "js.p03-dependency-graph",
  domain: "js",
  order: 3,
  title: "Граф зависимостей",
  subtitle: "Порядок сборки, циклы, обход генератором и «что пересобрать» на Map и Set — без рекурсии, на 30 000 узлов",
  level: "intermediate",
  estimatedHours: 10,
  buildsOn: ["js.p02-library-model"],
  topics: [
    "js.higher-order-recursion",
    "js.arrays",
    "js.map-set-weak",
    "js.destructuring-spread",
    "js.modules-esm",
    "js.iterators-generators",
  ],
  objective:
    "Написать модуль `graph.mjs` с классом `DependencyGraph`, который хранит зависимости между пакетами (или задачами сборки) и отвечает на практические вопросы: **в каком порядке собирать**, **есть ли цикл**, **что пересобрать при изменении**, **какие пакеты можно собирать параллельно**. Проект про выбор структур данных (`Map` и `Set` вместо объектов и массивов), про генераторы как «ленивые» обходы и про осознанный отказ от рекурсии там, где граф может быть глубоким.",
  scenario: [
    p("В монорепозитории «Лаборатории» 300 пакетов. Скрипт сборки на рекурсии падал с `RangeError: Maximum call stack size exceeded` на длинных цепочках зависимостей, путал порядок (результат зависел от порядка в `package.json`), терял пакеты с именами вроде `constructor` и не умел отвечать на вопрос «что пересобрать, если я поправил `core`?». Вам нужно заменить его компактным графом."),
    p("Модуль `graph.mjs` экспортирует `DependencyGraph`, базовую ошибку `GraphError` и её подклассы `CycleError` (с полем `cycle`) и `UnknownNodeError` (с полем `node`). Результаты должны быть **детерминированными**: одинаковый граф всегда даёт одинаковый порядок, независимо от порядка добавления узлов. Проверка `check.mjs` содержит 38 проверок, включая цепочку из 30 000 узлов."),
    code("js", `// Заготовка проекта «Граф зависимостей». Реализуйте класс и ошибки, затем запустите:  node check.mjs .
// Имена экспортов менять нельзя; подробности — в описании проекта.

export class GraphError extends Error {}
export class CycleError extends GraphError {
  // поле cycle: ["a", "b", "a"]; сообщение «Обнаружен цикл: a → b → a»
}
export class UnknownNodeError extends GraphError {
  // поле node
}

export class DependencyGraph {
  add(name, deps = []) { throw new Error("не реализовано: add"); }
  has(name) { throw new Error("не реализовано: has"); }
  get size() { throw new Error("не реализовано: size"); }
  dependenciesOf(name) { throw new Error("не реализовано: dependenciesOf"); }
  dependentsOf(name) { throw new Error("не реализовано: dependentsOf"); }
  detectCycle() { throw new Error("не реализовано: detectCycle"); }
  topologicalOrder() { throw new Error("не реализовано: topologicalOrder"); }
  levels() { throw new Error("не реализовано: levels"); }
  *walk(name, options) { throw new Error("не реализовано: walk"); }
  affectedBy(changed) { throw new Error("не реализовано: affectedBy"); }
  buildPlan(targets) { throw new Error("не реализовано: buildPlan"); }
  toJSON() { throw new Error("не реализовано: toJSON"); }
  static fromJSON(source) { throw new Error("не реализовано: fromJSON"); }
}`, { filename: "starter/graph.mjs" }),
    table(
      ["Метод", "Что возвращает", "Пример (app → ui, api; ui → core; api → core, db)"],
      [
        ["`add(name, deps = [])`", "`this`; создаёт узлы, объединяет зависимости, копирует список", "`graph.add(\"app\", [\"ui\", \"api\"])`"],
        ["`dependenciesOf(name)`, `dependentsOf(name)`", "Прямые зависимости / зависящие, по алфавиту", "`[\"api\", \"ui\"]` для `app`"],
        ["`detectCycle()`", "`null` или цикл `[\"a\", \"b\", \"a\"]`, начатый с наименьшего имени", "`[\"x\", \"x\"]` для самозависимости"],
        ["`topologicalOrder()`", "Порядок сборки: зависимости раньше, при равенстве — по алфавиту", "`[\"core\", \"db\", \"api\", \"ui\", \"app\"]`"],
        ["`levels()`", "Уровни для параллельной сборки", "`[[\"core\", \"db\"], [\"api\", \"ui\"], [\"app\"]]`"],
        ["`*walk(name, { direction })`", "Генератор достижимых узлов в глубину (без начального)", "`\"api\", \"core\", \"db\", \"ui\"`"],
        ["`affectedBy(changed)`, `buildPlan(targets)`", "Что пересобрать / минимальный план сборки целей", "`affectedBy([\"db\"])` → `[\"db\", \"api\", \"app\"]`"],
        ["`toJSON()`, `DependencyGraph.fromJSON(source)`", "Круговая сериализация", "`{ nodes: { app: [\"api\", \"ui\"], … } }`"],
      ],
      "Контракт модуля",
    ),
  ],
  requirements: [
    "`graph.mjs` экспортирует `DependencyGraph`, `GraphError`, `CycleError`, `UnknownNodeError`; ошибки наследуют `GraphError` и `Error`, `name` равен имени класса, `CycleError.cycle` и `UnknownNodeError.node` заполнены, сообщение цикла — `Обнаружен цикл: a → b → a`.",
    "`add(name, deps)` возвращает `this`, создаёт отсутствующие узлы, повторный вызов **объединяет** зависимости, список зависимостей **копируется** (последующее изменение массива вызывающим не влияет), принимает любой итерируемый список (массив, `Set`, генератор); имя — непустая строка, иначе `TypeError`.",
    "Узлы с именами `__proto__`, `constructor`, `toString` — обычные узлы (поэтому хранение в `Map`, а не в объекте).",
    "`dependenciesOf`, `dependentsOf`, `walk`, `affectedBy`, `buildPlan` для неизвестного узла бросают `UnknownNodeError`; `has`, `size` и итерация по графу (в порядке добавления) работают.",
    "`detectCycle()` находит цикл любой длины и самозависимость; цикл начинается и заканчивается **наименьшим по имени** узлом (`[\"a\", \"b\", \"c\", \"a\"]`); для DAG и пустого графа — `null`.",
    "`topologicalOrder()`: зависимости раньше зависящих; при равенстве — по алфавиту (по кодовым единицам, без `localeCompare`); результат не зависит от порядка добавления; при цикле — `CycleError`.",
    "`levels()`: уровень узла — `1 +` самый глубокий уровень его зависимостей (узлы без зависимостей — уровень 0); имена внутри уровня по алфавиту.",
    "`*walk(name, { direction = \"dependencies\" })` — **генератор**: обходит достижимые узлы в глубину, соседи по алфавиту, каждый узел один раз, начальный узел не выдаётся, циклы не ломают обход; `direction: \"dependents\"` идёт по зависящим.",
    "`affectedBy(changed)` возвращает изменённые узлы и все зависящие от них в порядке сборки; `buildPlan(targets)` — цели и все их зависимости в порядке сборки; оба бросают `CycleError` при цикле.",
    "Все методы работают на цепочке из 30 000 узлов (обход, порядок, уровни, план, `affectedBy`, поиск цикла) без `RangeError`, а граф из одного узла с 20 000 зависимостями обрабатывается быстрее 3 секунд.",
    "`toJSON()` — `{ nodes: { имя: [зависимости по алфавиту] } }` (узлы в порядке добавления); `fromJSON` принимает объект или строку JSON.",
  ],
  constraints: [
    "Только `Map`, `Set`, массивы и генераторы; без внешних библиотек.",
    "Никакой рекурсии в обходах: ни в поиске цикла, ни в `walk`, ни в порядке сборки (глубина графа не ограничена).",
    "Нельзя хранить граф в обычных объектах (`{}`): имена узлов — произвольные строки.",
    "Нельзя сравнивать имена через `localeCompare` (результат зависит от локали окружения); сортировка — по кодовым единицам.",
    "Нельзя мутировать аргументы вызывающего; нельзя хранить ссылку на переданный массив.",
    "Каждая операция должна быть линейной по размеру графа (с поправкой на сортировку), без `includes` внутри циклов.",
  ],
  expected: [
    "`node check.mjs .` печатает `Пройдено проверок: 38 из 38`.",
    "`topologicalOrder()` для графа из описания — `[\"core\", \"db\", \"api\", \"ui\", \"app\"]`; перестановка вызовов `add` порядок не меняет.",
    "Цикл из трёх узлов в любом порядке добавления печатается как `a → b → c → a`.",
    "На цепочке из 30 000 узлов все методы работают за доли секунды и без переполнения стека.",
  ],
  technical: [
    "Храните два отображения: `Map<узел, Set<зависимость>>` и обратное `Map<узел, Set<зависящий>>`. Тогда `dependentsOf`, `affectedBy` и обход «вверх» не требуют перебора всего графа.",
    "Порядок сборки — **алгоритм Кана**: посчитайте для каждого узла число зависимостей, соберите готовые (счётчик 0), по очереди «снимайте» их с зависящих. Чтобы порядок был детерминированным, держите очередь отсортированной.",
    "Поиск цикла — итеративный обход в глубину с явным стеком путей и итераторов: состояние узла «на текущем пути» (1) и «обработан» (2); возвращение на узел с состоянием 1 означает цикл. Вращайте найденный цикл так, чтобы он начинался с наименьшего имени.",
    "`walk` — цикл с явным стеком: кладите соседей в обратном порядке, чтобы первым извлекался наименьший по алфавиту; множество `seen` не даёт посетить узел дважды и защищает от циклов.",
    "Уровни считайте по топологическому порядку: `level[n] = 1 + max(level[d])` по зависимостям; группируйте через `(result[l] ??= []).push(n)`.",
    "Сортировка `a < b ? -1 : a > b ? 1 : 0` сравнивает кодовые единицы и одинакова во всех окружениях; `localeCompare` зависит от ICU и локали.",
    "`Object.fromEntries` с ключом `__proto__` создаёт собственное свойство и безопасно для `toJSON`; но обратное чтение лучше делать через `Object.entries`.",
  ],
  acceptance: [
    "`node check.mjs .` — 38 из 38.",
    "Заготовка проходит 1 из 38 проверок (только экспорты).",
    "Каждый из восьми «плохих» вариантов проваливает проверку: от 1 (рекурсия, объект вместо `Map`, самозависимость) до 5 (порядок вставки вместо алфавита).",
    "Рекурсивная реализация падает на цепочке из 30 000 узлов с `RangeError: Maximum call stack size exceeded`.",
    "Нет `console.log`, `localeCompare` и обращений к `{}` как к словарю.",
  ],
  hints: [
    "Сначала `add`, `has`, `dependenciesOf`: две `Map` и вспомогательная функция, создающая узел в обеих. Остальное строится на них.",
    "Если порядок сборки «плавает» между запусками — вы берёте узлы из `Set` в порядке вставки. Отсортируйте очередь готовых узлов по имени при каждом добавлении.",
    "Для обхода в глубину без рекурсии держите стек. Если соседей надо посещать по алфавиту, кладите их в стек **в обратном порядке**.",
    "Цикл — это путь, на который вы вернулись. Храните текущий путь отдельным массивом: `path.slice(path.indexOf(dep))` — это и есть цикл.",
    "Если `levels()` на ромбе даёт неверный результат, вы берёте `min` вместо `max`: узел должен стоять выше самой глубокой зависимости.",
    "`affectedBy` и `buildPlan` не нужно писать с нуля: соберите `Set` нужных узлов (через `walk`) и отфильтруйте `topologicalOrder()`.",
    "Имя `__proto__` ломает `{}`: `obj[\"__proto__\"]` не создаёт ключ. Это главная причина брать `Map`.",
  ],
  advanced: [
    "Добавьте `shortestPath(from, to)` (поиск в ширину) и `commonDependencies(a, b)` через пересечение множеств.",
    "Сделайте `walk` асинхронным генератором, который подгружает соседей (`await loadDeps(name)`), и добавьте отмену через `AbortSignal`.",
    "Реализуйте инкрементальный пересчёт: `graph.remove(name)` с корректным обновлением обратных связей и проверкой, что удаление не оставляет «висячих» ссылок.",
    "Постройте граф по `package.json` монорепозитория и выведите уровни параллельной сборки в формате, пригодном для CI.",
    "Измерьте время `topologicalOrder` на графах 10⁴–10⁶ узлов и оцените, где сортировка очереди становится узким местом; замените её на очередь с приоритетом.",
  ],
  failureModes: [
    "**Рекурсивный обход в глубину:** на цепочке из 30 000 узлов — `RangeError: Maximum call stack size exceeded`; в замере проваливается проверка масштаба.",
    "**Граф в обычном объекте:** узел `__proto__` не создаётся, `constructor` и `toString` «уже существуют»; в замере падает проверка имён (`TypeError: … .add is not a function`).",
    "**Порядок вставки вместо алфавита:** результат зависит от порядка `add` и меняется между запусками; 5 проверок из 38 красные (порядок, `affectedBy`).",
    "**Хранится сам переданный массив:** изменение массива вызывающим меняет граф; 1 проверка из 38.",
    "**Самозависимость не считается циклом:** `add(\"x\", [\"x\"])` проходит как DAG; 1 проверка.",
    "**`affectedBy` без изменённых узлов:** пересборка пропускает сам изменённый пакет; 3 проверки из 38.",
    "**Уровни по самой короткой дороге (`min`):** ромб попадает не на тот уровень и параллельная сборка ломается; 1 проверка.",
    "**Обход без множества посещённых:** узлы повторяются, в графе с циклом обход зацикливается (сработал предохранитель); 4 проверки из 38.",
  ],
  rubric: [
    { criterion: "Структуры данных", weight: 20, description: "`Map` и `Set`, прямое и обратное отображения, копирование входных данных, безопасные имена." },
    { criterion: "Алгоритмы графов", weight: 25, description: "Алгоритм Кана, поиск цикла, уровни, `affectedBy`, `buildPlan`; корректность на ромбах и циклах." },
    { criterion: "Итераторы и генераторы", weight: 15, description: "`*walk`, `Symbol.iterator`, ленивость, `yield`, поведение при остановке итерации." },
    { criterion: "Детерминизм", weight: 15, description: "Порядок не зависит от порядка добавления и локали; сортировка по кодовым единицам; стабильные результаты." },
    { criterion: "Масштаб и производительность", weight: 15, description: "Отсутствие рекурсии, линейные операции, 30 000 узлов и 20 000 зависимостей без проблем." },
    { criterion: "Ошибки и контракт", weight: 10, description: "`GraphError`, `CycleError.cycle`, `UnknownNodeError.node`, `TypeError` для имён; читаемые сообщения." },
  ],
  solution: [
    p("Эталон — один файл `graph.mjs` (около 150 строк). Он проходит все 38 проверок; заготовка проходит 1 из 38, а каждый из восьми намеренно испорченных вариантов — меньше 38."),
    h("graph.mjs"),
    code("js", `// Граф зависимостей на Map и Set: порядок сборки, циклы, обход генератором. Без рекурсии — глубокие цепочки безопасны.
export class GraphError extends Error {
  constructor(message) { super(message); this.name = new.target.name; }
}
export class CycleError extends GraphError {
  constructor(cycle) { super(\`Обнаружен цикл: \${cycle.join(" → ")}\`); this.cycle = cycle; }
}
export class UnknownNodeError extends GraphError {
  constructor(node) { super(\`Неизвестный узел: \${node}\`); this.node = node; }
}

const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);          // порядок кодовых единиц: одинаков в любом окружении
const checkName = (name) => {
  if (typeof name !== "string" || name === "") throw new TypeError("имя узла — непустая строка");
  return name;
};

export class DependencyGraph {
  #deps = new Map();                    // узел → Set его зависимостей
  #rev = new Map();                     // узел → Set узлов, которые от него зависят

  #node(name) {
    if (!this.#deps.has(name)) { this.#deps.set(name, new Set()); this.#rev.set(name, new Set()); }
  }
  #need(name) {
    if (!this.#deps.has(name)) throw new UnknownNodeError(name);
    return name;
  }

  /** Добавляет узел и его зависимости (неизвестные создаются сами); повторный вызов объединяет зависимости. */
  add(name, deps = []) {
    checkName(name);
    const list = [...deps].map(checkName);                       // копия: внешний массив потом можно менять
    this.#node(name);
    for (const dep of list) { this.#node(dep); this.#deps.get(name).add(dep); this.#rev.get(dep).add(name); }
    return this;
  }
  has(name) { return this.#deps.has(name); }
  get size() { return this.#deps.size; }
  dependenciesOf(name) { return [...this.#deps.get(this.#need(name))].sort(byName); }
  dependentsOf(name) { return [...this.#rev.get(this.#need(name))].sort(byName); }
  *[Symbol.iterator]() { yield* this.#deps.keys(); }              // в порядке добавления

  /** null или цикл, начинающийся и заканчивающийся одним узлом (наименьшим по имени): ["a","b","c","a"]. */
  detectCycle() {
    const state = new Map();                                       // 1 — на текущем пути, 2 — полностью обработан
    for (const start of [...this.#deps.keys()].sort(byName)) {
      if (state.has(start)) continue;
      const path = [start], iterators = [this.dependenciesOf(start)[Symbol.iterator]()];
      state.set(start, 1);
      while (path.length) {
        const next = iterators.at(-1).next();
        if (next.done) { state.set(path.pop(), 2); iterators.pop(); continue; }
        const dep = next.value;
        if (state.get(dep) === 1) {                                // вернулись на текущий путь: нашли цикл
          const cycle = path.slice(path.indexOf(dep));
          const min = cycle.reduce((m, n, i) => (byName(n, cycle[m]) < 0 ? i : m), 0);
          const rotated = [...cycle.slice(min), ...cycle.slice(0, min)];
          return [...rotated, rotated[0]];
        }
        if (!state.has(dep)) { state.set(dep, 1); path.push(dep); iterators.push(this.dependenciesOf(dep)[Symbol.iterator]()); }
      }
    }
    return null;
  }

  /** Зависимости раньше зависящих; при равенстве — по алфавиту. */
  topologicalOrder() {
    const cycle = this.detectCycle();
    if (cycle) throw new CycleError(cycle);
    const left = new Map([...this.#deps].map(([n, deps]) => [n, deps.size]));
    const ready = [...left].filter(([, k]) => k === 0).map(([n]) => n).sort(byName);
    const order = [];
    while (ready.length) {
      const node = ready.shift();
      order.push(node);
      for (const dependent of this.#rev.get(node)) {
        left.set(dependent, left.get(dependent) - 1);
        if (left.get(dependent) === 0) { ready.push(dependent); ready.sort(byName); }
      }
    }
    return order;
  }

  /** Уровни для параллельной сборки: узел стоит на уровень выше самой «глубокой» из своих зависимостей. */
  levels() {
    const level = new Map();
    for (const node of this.topologicalOrder()) {
      const deps = this.#deps.get(node);
      level.set(node, deps.size === 0 ? 0 : 1 + Math.max(...[...deps].map((d) => level.get(d))));
    }
    const result = [];
    for (const [node, l] of level) (result[l] ??= []).push(node);
    return result.map((names) => names.sort(byName));
  }

  /** Обход достижимых узлов в глубину (без самого начального), каждый один раз; соседи — по алфавиту. */
  *walk(name, { direction = "dependencies" } = {}) {
    this.#need(name);
    const next = direction === "dependents" ? (n) => this.dependentsOf(n) : (n) => this.dependenciesOf(n);
    const seen = new Set([name]);
    const stack = [...next(name)].reverse();
    while (stack.length) {
      const node = stack.pop();
      if (seen.has(node)) continue;
      seen.add(node);
      yield node;
      for (const n of next(node).reverse()) if (!seen.has(n)) stack.push(n);
    }
  }

  /** Всё, что придётся пересобрать при изменении узлов: они сами и все зависящие от них, в порядке сборки. */
  affectedBy(changed) {
    const affected = new Set();
    for (const name of changed) { this.#need(name); affected.add(name); for (const n of this.walk(name, { direction: "dependents" })) affected.add(n); }
    return this.topologicalOrder().filter((n) => affected.has(n));
  }

  /** Минимальный план сборки целей: цели и все их зависимости, в порядке сборки. */
  buildPlan(targets) {
    const needed = new Set();
    for (const name of targets) { this.#need(name); needed.add(name); for (const n of this.walk(name)) needed.add(n); }
    return this.topologicalOrder().filter((n) => needed.has(n));
  }

  toJSON() { return { nodes: Object.fromEntries([...this.#deps].map(([n, deps]) => [n, [...deps].sort(byName)])) }; }
  static fromJSON(source) {
    const data = typeof source === "string" ? JSON.parse(source) : source;
    const graph = new DependencyGraph();
    for (const [name, deps] of Object.entries(data.nodes)) graph.add(name, deps);
    return graph;
  }
}`, { filename: "graph.mjs", lineNumbers: true }),
    h("Самопроверка check.mjs"),
    p("Проверки охватывают API (создание узлов, копирование входных данных, ошибки), порядок (на ручных примерах и на случайном DAG из 300 узлов), циклы, обход (ромбы и циклы), сериализацию и масштаб (цепочка из 30 000 узлов — для рекурсивных реализаций это смертельный тест)."),
    code("js", `// Самопроверка проекта «Граф зависимостей». Запуск: node check.mjs [каталог с graph.mjs]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = path.resolve(process.argv[2] ?? "solution");
const file = path.join(dir, "graph.mjs");
const source = fs.readFileSync(file, "utf8");
const { DependencyGraph, CycleError, UnknownNodeError, GraphError } = await import(pathToFileURL(file).href);

let total = 0, passed = 0;
const failed = [];
function check(name, fn) {
  total++;
  let ok = false, note = "";
  try { const r = fn(); ok = r === true; if (!ok) note = \` (вернуло \${typeof r === "object" ? JSON.stringify(r) : String(r)})\`; } catch (e) { note = \` (\${e?.name ?? "Error"}: \${String(e?.message).slice(0, 60)})\`; }
  if (ok) passed++; else failed.push(name);
  console.log(\`\${ok ? "OK " : "НЕТ"}  \${name}\${ok ? "" : note}\`);
}
const kind = (fn, K) => { try { fn(); return false; } catch (e) { return e instanceof K; } };
const J = JSON.stringify;
const build = () => new DependencyGraph().add("app", ["ui", "api"]).add("ui", ["core"]).add("api", ["core", "db"]).add("db").add("core");

// ── Структура и API ──
check("экспортированы DependencyGraph, CycleError, UnknownNodeError, GraphError", () => [DependencyGraph, CycleError, UnknownNodeError, GraphError].every((c) => typeof c === "function"));
check("ошибки наследуют GraphError и Error; name — имя класса", () => { const e = new CycleError(["a", "b", "a"]), u = new UnknownNodeError("x"); return e instanceof GraphError && u instanceof GraphError && e instanceof Error && e.name === "CycleError" && u.name === "UnknownNodeError" && e.cycle.join() === "a,b,a" && u.node === "x"; });
check("используются Map и Set", () => /new Map\\(/.test(source) && /new Set\\(/.test(source));
check("add возвращает this; узлы без зависимостей создаются", () => { const g = new DependencyGraph(); return g.add("a") === g && g.has("a") && g.size === 1; });
check("add создаёт неизвестные зависимости автоматически", () => { const g = new DependencyGraph().add("a", ["b", "c"]); return g.has("b") && g.has("c") && g.size === 3; });
check("повторный add объединяет зависимости", () => { const g = new DependencyGraph().add("a", ["b"]).add("a", ["c", "b"]); return J(g.dependenciesOf("a")) === '["b","c"]'; });
check("add копирует список зависимостей: последующее изменение массива не влияет", () => { const deps = ["b"]; const g = new DependencyGraph().add("a", deps); deps.push("zzz"); return J(g.dependenciesOf("a")) === '["b"]' && !g.has("zzz"); });
check("add принимает любой итерируемый список (Set, генератор)", () => { const g = new DependencyGraph().add("a", new Set(["b", "c"])).add("d", (function* () { yield "e"; })()); return g.has("c") && g.has("e"); });
check("add: неверное имя (пустое, число, null) → TypeError", () => kind(() => new DependencyGraph().add(""), TypeError) && kind(() => new DependencyGraph().add(1), TypeError) && kind(() => new DependencyGraph().add("a", [null]), TypeError));
check("dependenciesOf и dependentsOf: по алфавиту", () => { const g = build(); return J(g.dependenciesOf("app")) === '["api","ui"]' && J(g.dependentsOf("core")) === '["api","ui"]' && J(g.dependentsOf("app")) === "[]"; });
check("неизвестный узел → UnknownNodeError (dependenciesOf, dependentsOf, walk, affectedBy, buildPlan)", () => { const g = build(); return [() => g.dependenciesOf("?"), () => g.dependentsOf("?"), () => [...g.walk("?")], () => g.affectedBy(["?"]), () => g.buildPlan(["?"])].every((f) => kind(f, UnknownNodeError)); });
check("итерация по графу — узлы в порядке добавления", () => { const g = new DependencyGraph().add("z", ["m"]).add("a"); return J([...g]) === '["z","m","a"]'; });
check("имена вроде __proto__, constructor, toString — обычные узлы", () => { const g = new DependencyGraph().add("__proto__", ["constructor"]).add("toString", ["__proto__"]); return g.size === 3 && J(g.dependenciesOf("toString")) === '["__proto__"]' && J(g.topologicalOrder()) === '["constructor","__proto__","toString"]'; });

// ── Порядок сборки ──
check("topologicalOrder: зависимости раньше, при равенстве — по алфавиту", () => J(build().topologicalOrder()) === '["core","db","api","ui","app"]');
check("topologicalOrder: каждый узел идёт после всех своих зависимостей (случайный DAG)", () => { let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; const g = new DependencyGraph(); for (let i = 0; i < 300; i++) g.add("n" + i, Array.from({ length: Math.floor(rnd() * 4) }, () => "n" + Math.floor(rnd() * i))); const pos = new Map(g.topologicalOrder().map((n, i) => [n, i])); return pos.size === g.size && [...g].every((n) => g.dependenciesOf(n).every((d) => pos.get(d) < pos.get(n))); });
check("topologicalOrder: результат не зависит от порядка добавления", () => { const a = new DependencyGraph().add("b", ["a"]).add("c", ["a"]).add("a"); const b = new DependencyGraph().add("a").add("c", ["a"]).add("b", ["a"]); return J(a.topologicalOrder()) === J(b.topologicalOrder()) && J(a.topologicalOrder()) === '["a","b","c"]'; });
check("пустой граф: порядок [], уровни [], цикла нет", () => { const g = new DependencyGraph(); return J(g.topologicalOrder()) === "[]" && J(g.levels()) === "[]" && g.detectCycle() === null; });
check("levels: уровень = 1 + самый глубокий уровень зависимостей", () => J(build().levels()) === '[["core","db"],["api","ui"],["app"]]');
check("levels: ромб с «длинной» и «короткой» дорогой", () => { const g = new DependencyGraph().add("d", ["b", "a"]).add("b", ["c"]).add("c", ["a"]).add("a"); return J(g.levels()) === '[["a"],["c"],["b"],["d"]]'; });

// ── Циклы ──
check("detectCycle: null для DAG", () => build().detectCycle() === null);
check("detectCycle: цикл из трёх узлов, начинается с наименьшего имени", () => J(new DependencyGraph().add("b", ["c"]).add("c", ["a"]).add("a", ["b"]).detectCycle()) === '["a","b","c","a"]');
check("detectCycle: самозависимость", () => J(new DependencyGraph().add("x", ["x"]).detectCycle()) === '["x","x"]');
check("detectCycle: цикл не на первом узле и «хвост» в него", () => J(new DependencyGraph().add("a", ["b"]).add("b", ["c"]).add("c", ["d"]).add("d", ["c"]).detectCycle()) === '["c","d","c"]');
check("topologicalOrder, levels, buildPlan, affectedBy бросают CycleError с полем cycle", () => { const g = new DependencyGraph().add("a", ["b"]).add("b", ["a"]); return [() => g.topologicalOrder(), () => g.levels(), () => g.buildPlan(["a"]), () => g.affectedBy(["a"])].every((f) => { try { f(); return false; } catch (e) { return e instanceof CycleError && J(e.cycle) === '["a","b","a"]' && /a → b → a/.test(e.message); } }); });

// ── Обход, план, затронутые узлы ──
check("walk по зависимостям: в глубину, соседи по алфавиту, без начального узла и повторов", () => J([...build().walk("app")]) === '["api","core","db","ui"]');
check("walk по зависящим: direction \\"dependents\\"", () => J([...build().walk("core", { direction: "dependents" })]) === '["api","app","ui"]');
check("walk — генератор: ленивый, можно остановить раньше", () => { const it = build().walk("app"); const first = it.next().value; return first === "api" && typeof it[Symbol.iterator] === "function" && typeof it.return === "function"; });
check("walk: ромб не даёт повторов", () => { const g = new DependencyGraph().add("a", ["b", "c"]).add("b", ["d"]).add("c", ["d"]).add("d"); return J([...g.walk("a")]) === '["b","d","c"]'; });
check("walk терпит циклы (каждый узел один раз)", () => { const g = new DependencyGraph().add("a", ["b"]).add("b", ["a"]); return J([...g.walk("a")]) === '["b"]'; });
check("affectedBy: изменённые и все зависящие, в порядке сборки", () => J(build().affectedBy(["db"])) === '["db","api","app"]' && J(build().affectedBy(["core"])) === '["core","api","ui","app"]');
check("affectedBy нескольких узлов — объединение без повторов", () => J(build().affectedBy(["db", "core"])) === '["core","db","api","ui","app"]');
check("buildPlan: цели и их зависимости, в порядке сборки", () => J(build().buildPlan(["ui"])) === '["core","ui"]' && J(build().buildPlan(["api", "ui"])) === '["core","db","api","ui"]');
check("buildPlan([]) → []", () => J(build().buildPlan([])) === "[]");

// ── Сериализация ──
check("toJSON и fromJSON: круговой обмен (объект и строка)", () => { const g = build(); const a = DependencyGraph.fromJSON(JSON.parse(JSON.stringify(g))), b = DependencyGraph.fromJSON(JSON.stringify(g)); return J(a.topologicalOrder()) === J(g.topologicalOrder()) && J(b.levels()) === J(g.levels()) && a.size === 5; });
check("toJSON: зависимости по алфавиту; узлы в порядке добавления", () => J(build().toJSON()) === '{"nodes":{"app":["api","ui"],"ui":["core"],"api":["core","db"],"core":[],"db":[]}}');

// ── Масштаб: нет рекурсии, нет квадратичных сюрпризов ──
check("цепочка из 30 000 узлов: обход, порядок, уровни, план без переполнения стека", () => { const g = new DependencyGraph(); for (let i = 1; i < 30000; i++) g.add("n" + i, ["n" + (i - 1)]); return [...g.walk("n29999")].length === 29999 && g.topologicalOrder().length === 30000 && g.levels().length === 30000 && g.buildPlan(["n29999"]).length === 30000 && g.affectedBy(["n0"]).length === 30000; });
check("цикл в цепочке из 30 000 узлов находится без переполнения стека", () => { const g = new DependencyGraph(); for (let i = 1; i < 30000; i++) g.add("n" + i, ["n" + (i - 1)]); g.add("n0", ["n29999"]); const c = g.detectCycle(); return c !== null && c.length === 30001; });
check("широкий граф (1 узел → 20 000 зависимостей) обрабатывается быстро (< 3 с)", () => { const g = new DependencyGraph(); g.add("root", Array.from({ length: 20000 }, (_, i) => "d" + i)); const t = performance.now(); const order = g.topologicalOrder(); g.levels(); g.buildPlan(["root"]); return order.length === 20001 && performance.now() - t < 3000; });

console.log(\`\\nПройдено проверок: \${passed} из \${total}\`);
if (failed.length) console.log("Не прошли: " + failed.length);
process.exit(failed.length ? 1 : 0);`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 38 из 38`, { filename: "результат node check.mjs solution (Node.js 22.22.0)" }),
    code("text", `Пройдено проверок: 1 из 38
Не прошли: 37`, { filename: "результат node check.mjs starter (заготовка)" }),
    h("Проверка самой проверки: «плохие» варианты"),
    code("text", `b1-recursive-dfs: Пройдено проверок: 37 из 38
b2-plain-object: Пройдено проверок: 37 из 38
b3-insertion-order: Пройдено проверок: 33 из 38
b4-keeps-input-array: Пройдено проверок: 37 из 38
b5-no-self-loop: Пройдено проверок: 37 из 38
b6-affected-without-self: Пройдено проверок: 35 из 38
b7-levels-shortest: Пройдено проверок: 37 из 38
b8-walk-revisits: Пройдено проверок: 34 из 38`, { filename: "результат check.mjs для вариантов с ошибками (из 38)" }),
    warn("Рекурсия выглядит естественнее для обхода графа, но глубина стека ограничена, а входные данные — нет. Если вход может быть «цепочкой» (а в зависимостях пакетов это обычное дело), используйте явный стек: код чуть длиннее, зато не имеет скрытого предела."),
    tip("Когда тест на масштаб падает, не уменьшайте размер данных: именно он показывает, что решение работает только на «игрушечных» примерах. Лучше измерить время и найти место, где алгоритм становится квадратичным."),
  ],
};
