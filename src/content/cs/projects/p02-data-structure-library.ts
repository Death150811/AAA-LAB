import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p02DataStructureLibrary: Project = {
  id: "cs.p02-data-structure-library",
  domain: "cs",
  order: 2,
  title: "Библиотека структур данных",
  subtitle: "Кольцевая очередь, хеш-таблица, куча с индексом, АВЛ-дерево, система непересекающихся множеств и алгоритм Дейкстры — 48 проверок: модели, инварианты и границы высоты",
  level: "core",
  estimatedHours: 12,
  buildsOn: ["cs.p01-algorithm-lab"],
  topics: ["cs.arrays-linked-lists", "cs.stacks-queues", "cs.hash-tables", "cs.trees-heaps", "cs.graphs"],
  objective:
    "Написать модуль `ds.mjs` с **шестью структурами и алгоритмом**, каждая из которых проходит проверку тремя способами: **сверкой с эталонной моделью** на десятках тысяч случайных операций (массив, `Map`, отсортированный список, перебор), **проверкой инварианта** (`validate()` для АВЛ-дерева, коэффициент заполнения `≤ 0,75` для хеш-таблицы, порядок в куче) и **границей скорости** на больших входах (миллион элементов, 100 000 ключей, граф на 250 000 рёбер).",
  scenario: [
    p("Вы пишете ядро сервиса маршрутизации: нужны очередь с обоих концов (буфер событий), словарь без сюрпризов (кеш маршрутов), приоритетная очередь с понижением приоритета (поиск кратчайших путей), упорядоченное отображение с запросами «ближайший» и «диапазон» (тарифные зоны), система непересекающихся множеств (связность сети) и сам алгоритм Дейкстры. Стандартные `Map`, `Array` и `sort` использовать **для хеш-таблицы и очередей** нельзя: цель — понять, что внутри. Каждая структура в проверке получает «враждебные» данные: ключи, кратные 1024, строки с общим префиксом, последовательные ключи (худший случай для обычного дерева), цепочку из миллиона объединений."),
    p("Заготовка лежит в `starter/ds.mjs`: конструкторы бросают «не реализовано». Проверку `check.mjs` (48 проверок) запускайте так: `node check.mjs .` — в каталоге с вашим `ds.mjs`. Зависимостей нет, нужен Node.js 22."),
    code("js", `// Заготовка проекта «Библиотека структур данных». Реализуйте классы и функции, затем запустите:  node check.mjs .
// Имена экспортов, методы и свойства менять нельзя. Подробные требования — в описании проекта.

export class Deque {
  constructor(iterable = []) { throw new Error("не реализовано: Deque"); }
  // size, capacity, pushFront, pushBack, popFront, popBack, peekFront, peekBack, at, clear, toArray, [Symbol.iterator]
}

export class HashMap {
  constructor(entries = []) { throw new Error("не реализовано: HashMap"); }
  // size, capacity, loadFactor, set, get, has, delete, clear, entries, keys, values, [Symbol.iterator]
}

export class IndexedMinHeap {
  constructor() { throw new Error("не реализовано: IndexedMinHeap"); }
  // size, push, decrease, popMin, peek, has, priorityOf
}

export class AVLTree {
  constructor(compare) { throw new Error("не реализовано: AVLTree"); }
  // size, height, set, get, has, delete, validate, min, max, floor, ceiling, range, [Symbol.iterator]
}

export class UnionFind {
  constructor(n) { throw new Error("не реализовано: UnionFind"); }
  // count, find, union, connected, sizeOf
}

export function dijkstra(adj, source) {
  throw new Error("не реализовано: dijkstra");
}

export function pathTo(result, target) {
  throw new Error("не реализовано: pathTo");
}`, { filename: "starter/ds.mjs" }),
    table(
      ["Структура", "Контракт", "Что проверяется"],
      [
        ["`Deque`", "`pushFront/pushBack/popFront/popBack/peekFront/peekBack/at/clear/toArray/size/capacity`, итерация спереди назад", "Модель на массиве (20 000 операций, значения `undefined`), миллион операций быстрее 1,5 с, без `shift/unshift/splice`, ёмкость удвоением"],
        ["`HashMap`", "`set/get/has/delete/clear/size/capacity/loadFactor`, `entries/keys/values`, итерация", "Модель на `Map` (30 000 операций), `NaN`, `−0`, `__proto__`, коэффициент ≤ 0,75, ключи с шагом 1024, нет `Map`/`Set`/объекта-словаря"],
        ["`IndexedMinHeap`", "`push(key, priority)`, `decrease`, `popMin`, `peek`, `has`, `priorityOf`, `size`", "Модель на словаре (20 000 операций), 100 000 элементов быстрее 1,5 с, ошибки `RangeError` и `Error`"],
        ["`AVLTree`", "`set/get/has/delete/size/height/validate/min/max/floor/ceiling/range`, итерация по возрастанию", "Модель, `validate()`, высота ≤ 1,4405·log₂(n + 2) − 0,3277 на 100 000 последовательных ключей, нерекурсивная итерация"],
        ["`UnionFind`", "`find/union/connected/sizeOf/count`", "Модель на метках, цепочка из 1 000 000 объединений без рекурсии"],
        ["`dijkstra(adj, source)`, `pathTo(result, target)`", "`{ dist, prev }` по спискам смежности `adj[u] = [[v, вес], …]`", "Сверка с алгоритмом Беллмана — Форда на 60 графах, граф из 50 000 вершин и 250 000 рёбер, использование вашей кучи"],
      ],
      "Контракт модуля",
    ),
  ],
  requirements: [
    "`ds.mjs` экспортирует `Deque`, `HashMap`, `IndexedMinHeap`, `AVLTree`, `UnionFind`, `dijkstra`, `pathTo`; методы и свойства названы как в таблице.",
    "`Deque` — кольцевой буфер: операции с обоих концов за `O(1)` амортизированно, рост удвоением (`size ≤ capacity ≤ 2·size` после тысячи добавлений); пустая очередь возвращает `undefined`, `at(i)` вне диапазона бросает `RangeError`; значения `undefined` и `null` хранятся как обычные.",
    "`HashMap` — открытая адресация или цепочки **без** `Map`, `Set` и обычных объектов как хранилища; ключи сравниваются как `SameValueZero` (`NaN` равен `NaN`, `0` равен `−0`), разные типы различаются (`1` и `\"1\"`), объекты — по ссылке; коэффициент заполнения `loadFactor ≤ 0,75` после каждой вставки; удаление не разрывает цепочки зондирования.",
    "`IndexedMinHeap` хранит индекс «ключ → позиция» (подойдёт ваша `HashMap`): `decrease(key, p)` за `O(log n)`; `push` существующего ключа — `Error`; `decrease` с большим приоритетом или неизвестного ключа — `RangeError`; `popMin()` пустой кучи — `undefined`.",
    "`AVLTree` принимает необязательный компаратор; `set` заменяет значение, не меняя размер; `floor(k)` — наибольший ключ `≤ k`, `ceiling(k)` — наименьший `≥ k`, `range(lo, hi)` — пары с ключами из `[lo, hi)`; `validate()` возвращает `true` тогда и только тогда, когда выполнены порядок ключей, баланс `|h(левого) − h(правого)| ≤ 1` и записанные высоты верны; итерация не рекурсивна по размеру.",
    "`UnionFind(n)`: `union` возвращает `true`, если множества объединены; `find` вне `0…n−1` — `RangeError`; сжатие путей и объединение по размеру; `find` без рекурсии.",
    "`dijkstra` возвращает `dist` (`Infinity` для недостижимых) и `prev` (`−1` для источника и недостижимых); отрицательный вес — `RangeError`; использует вашу `IndexedMinHeap` и не сортирует массив на каждом шаге; `pathTo` возвращает путь от источника или `[]`.",
  ],
  constraints: [
    "Только стандартные средства JavaScript; никаких библиотек.",
    "`Deque` — без `Array.prototype.shift`, `unshift`, `splice`; `HashMap` — без `Map`, `Set`, `Object.create`, `Object.fromEntries` и без объекта как словаря (для идентификаторов объектов допустим `WeakMap`).",
    "Нельзя полагаться на порядок обхода `HashMap`: проверка сравнивает наборы пар, а не последовательности.",
    "Рекурсия допустима только там, где её глубина ограничена логарифмом (деревья АВЛ); `UnionFind.find`, итерации и обходы не должны зависеть от стека вызовов.",
    "Хеш-функцию строк и чисел пишете вы: готовые `hashCode` и `String.prototype.hash` отсутствуют, а плохая хеш-функция проявится на ключах с общим префиксом и кратных 1024.",
  ],
  expected: [
    "`node check.mjs .` печатает `Пройдено проверок: 48 из 48` менее чем за 3 секунды.",
    "`new AVLTree()` после вставки ключей `1…100000` по порядку имеет `height ≤ 23` (в эталоне — 17) и `validate() === true`.",
    "`dijkstra([[[1, 4], [2, 1]], [[3, 1]], [[1, 2], [3, 5]], [[4, 3]], []], 0)` даёт `dist = [0, 3, 1, 4, 7]`, `pathTo(r, 4)` — `[0, 2, 1, 3, 4]`.",
  ],
  technical: [
    "Кольцевой буфер: хранится `head` и `size`, индекс элемента `i` — `(head + i) % capacity`. При росте копируйте элементы **в логическом порядке** с нулевой головы: копирование «как лежит» ломает очередь после оборота.",
    "Открытая адресация с линейным зондированием: ёмкость — степень двойки, индекс `hash & (capacity − 1)`. Удаление — **сдвиг назад**: после освобождения ячейки `i` просматривайте следующие занятые и возвращайте в `i` тех, чей «домашний» индекс не лежит строго между `i` и ними; так не нужны «надгробия».",
    "Хеш строк — FNV‑1a (`h ^= code; h *= 16777619` через `Math.imul`) с финальным перемешиванием битов (две умножающие «встряски» из MurmurHash3): без перемешивания ключи, кратные 1024, попадают в одну ячейку при маске степени двойки.",
    "Идентификатор объекта-ключа — число из счётчика, сохранённое в `WeakMap`; хеш числа с дробной частью берите из битов `Float64Array`/`Uint32Array`.",
    "Куча с индексом: при каждом обмене обновляйте позиции **обоих** ключей; тогда `decrease` — это «поднять по индексу». Забытый индекс даёт ошибки только на редких последовательностях операций.",
    "АВЛ: храните высоту узла; после вставки и **после удаления** на обратном пути вызывайте `rebalance`: левый-левый и правый-правый случаи — одинарное вращение, левый-правый и правый-левый — двойное. Удаление узла с двумя детьми — замена минимальным из правого поддерева.",
    "Объединение по размеру и прореживание путей (`p[x] = p[p[x]]`) дают почти константное время; рекурсивный `find` на цепочке из миллиона элементов переполняет стек.",
    "Дейкстра: вершина извлекается из кучи один раз; при улучшении расстояния — `decrease`, если вершина уже в куче, иначе `push`; отрицательные веса ломают инвариант «извлечённая вершина окончательна».",
  ],
  acceptance: [
    "`node check.mjs .` — 48 из 48.",
    "Заготовка проходит 2 из 48 проверок (экспорты и запрет `Map`/`Set` в хеш-таблице, который в пустой заготовке выполнен тривиально).",
    "Каждый из четырнадцати «плохих» вариантов проваливает не менее одной проверки: от 1 (смещение `peekBack`, рост очереди без головы, коэффициент 0,9, `NaN`, слабая хеш-функция строк, удаление без перебалансировки, одинарные вращения, неверный `ceiling`, рекурсивный `find`, отрицательный вес) до 5 (хеш-таблица без сдвига назад).",
    "Ни одна из структур не использует запрещённые средства (проверяется по исходному тексту).",
    "Все проверки идут без таймаутов: проверка `AVLTree` на 100 000 ключей по порядку и цепочка из миллиона объединений укладываются в 1,5 с.",
  ],
  hints: [
    "Начните с `Deque` и проверьте оборот: добавьте элементы с `pushFront` (голова уходит «за ноль»), затем вырастите буфер — здесь ломается большинство первых версий.",
    "Если `HashMap` проходит простые ключи, но падает на модели с удалениями, ищите ошибку в удалении: ячейку нельзя просто очистить, цепочка зондирования рвётся.",
    "Если проверка скорости хеш-таблицы красная, а результаты верные, выведите длину самой длинной цепочки зондирования для ключей `i * 1024`: чаще всего хеш числа не перемешивает нижние биты.",
    "Для куч с индексом напишите внутреннюю функцию `check()` — полный обход, что `pos[key]` указывает на ключ и что приоритет родителя не больше приоритета ребёнка; вызывайте её в своих тестах после каждой операции.",
    "Для АВЛ-дерева сначала добейтесь `validate() === true` после вставок, потом после удалений: ошибки удаления проявляются только на 3–4 уровнях вложенности.",
    "Если `UnionFind` проходит маленькие тесты и падает на цепочке — `find` рекурсивен или объединение не по размеру: нарисуйте дерево после `union(0,1), union(1,2), union(2,3)`.",
    "Дейкстру проверьте на графе с нулевыми весами и параллельными рёбрами: эти случаи ломают версии, сравнивающие `<=` вместо `<`.",
  ],
  advanced: [
    "Добавьте в `AVLTree` порядковую статистику: хранение размера поддерева, `rank(key)` и `select(i)` за `O(log n)`; проверьте на модели.",
    "Реализуйте `HashMap` с цепочками и с кукушечным хешированием и сравните число зондирований на ключах с общим префиксом.",
    "Реализуйте `SkipList` с тем же интерфейсом, что `AVLTree`, и сравните высоту и число сравнений на 100 000 ключах.",
    "Добавьте в `Deque` метод `rotate(k)` за `O(1)` и `Deque.prototype.slice` без копирования (представление на буфер).",
    "Напишите `kruskal(n, edges)` на `UnionFind` и `aStar(adj, source, target, heuristic)` на `IndexedMinHeap`; сверьте с `dijkstra` на случайных графах.",
  ],
  failureModes: [
    "**`peekBack` на единицу правее:** возвращает пустую ячейку; 1 проверка из 48 (модель очереди).",
    "**Рост буфера без учёта головы:** после оборота элементы перемешиваются; 1 проверка (модель на массиве).",
    "**Удаление из хеш-таблицы без сдвига назад:** ключи после «дыры» не находятся; красных 5 проверок из 48 — модель словаря, цепочки после удалений, а также куча и Дейкстра, которые используют вашу хеш-таблицу.",
    "**Коэффициент заполнения 0,9:** таблица работает, но нарушает инвариант `≤ 0,75`; 1 проверка.",
    "**`NaN` не равен `NaN`:** ключ `NaN` добавляется заново при каждом `set`; 1 проверка.",
    "**Слабая хеш-функция строк (длина и первый символ):** результаты верны, но 90 000 вставок не укладываются в секунду (в замере на этом варианте проверка идёт около 8 с); 1 проверка.",
    "**`decrease` без подъёма по куче:** приоритет изменён, а порядок не восстановлен; красных 3 проверки (проверка `decrease`, модель, Дейкстра).",
    "**Позиции не обновлены при обмене:** `decrease` поднимает не тот элемент; 3 проверки.",
    "**Удаление в АВЛ без перебалансировки:** порядок ключей верен, но баланс нарушен — `validate()` ловит это после удаления 90 % ключей; 1 проверка.",
    "**Только одинарные вращения:** случаи «левый-правый» и «правый-левый» не исправляются, `validate()` обнаруживает нарушение баланса; 1 проверка.",
    "**`ceiling` ищет не в ту сторону:** возвращает `undefined` или неверный ключ; 1 проверка.",
    "**Рекурсивный `find` без объединения по размеру:** на цепочке из миллиона элементов — `RangeError: Maximum call stack size exceeded`; 1 проверка.",
    "**Отрицательные веса разрешены:** Дейкстра молча выдаёт неверные расстояния; 1 проверка.",
    "**`push` вместо `decrease` при улучшении расстояния:** повторный ключ в куче; красных 3 проверки.",
  ],
  rubric: [
    { criterion: "Корректность на моделях", weight: 30, description: "Совпадение с массивом, `Map`, отсортированным списком, метками компонент и алгоритмом Беллмана — Форда на случайных операциях и графах." },
    { criterion: "Инварианты", weight: 20, description: "`validate()` для АВЛ-дерева, `loadFactor ≤ 0,75`, свойство кучи и актуальность индекса, сдвиг назад в таблице, `size ≤ capacity ≤ 2·size`." },
    { criterion: "Скорость на больших входах", weight: 20, description: "Миллион операций очереди, 90 000 вставок в таблицу, 100 000 в кучу и дерево, цепочка из миллиона объединений, граф на 250 000 рёбер — без рекурсии глубиной в `n`." },
    { criterion: "Хеширование и ключи", weight: 15, description: "Перемешивание бит, `SameValueZero`, объекты по ссылке, безопасные ключи (`__proto__`), отсутствие запрещённых хранилищ." },
    { criterion: "Ошибки и контракт", weight: 10, description: "`RangeError`, `Error`, значения `undefined` для пустых структур, различие «нет ключа» и «значение `undefined`»." },
    { criterion: "Читаемость", weight: 5, description: "Закрытые поля `#`, короткие методы, комментарии с инвариантами." },
  ],
  solution: [
    p("Эталон — один файл `ds.mjs` (около 230 строк). Он проходит все 48 проверок; заготовка проходит 2 из 48, а каждый из четырнадцати намеренно испорченных вариантов — меньше 48."),
    h("ds.mjs"),
    code("js", `// ds.mjs — библиотека структур данных: кольцевая очередь, хеш-таблица, куча с индексом, АВЛ-дерево, система непересекающихся множеств и алгоритм Дейкстры

const defaultCompare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/* ───────── Deque: кольцевой буфер, все операции с концов — O(1) амортизированно ───────── */
export class Deque {
  #buf = new Array(8); #head = 0; #size = 0;
  constructor(iterable = []) { for (const x of iterable) this.pushBack(x); }
  get size() { return this.#size; }
  get capacity() { return this.#buf.length; }
  #grow() {
    if (this.#size < this.#buf.length) return;
    const next = new Array(this.#buf.length * 2);
    for (let i = 0; i < this.#size; i++) next[i] = this.#buf[(this.#head + i) % this.#buf.length];
    this.#buf = next; this.#head = 0;
  }
  pushBack(x) { this.#grow(); this.#buf[(this.#head + this.#size) % this.#buf.length] = x; this.#size++; return this; }
  pushFront(x) { this.#grow(); this.#head = (this.#head - 1 + this.#buf.length) % this.#buf.length; this.#buf[this.#head] = x; this.#size++; return this; }
  popFront() { if (!this.#size) return undefined; const x = this.#buf[this.#head]; this.#buf[this.#head] = undefined; this.#head = (this.#head + 1) % this.#buf.length; this.#size--; return x; }
  popBack() { if (!this.#size) return undefined; const i = (this.#head + this.#size - 1) % this.#buf.length, x = this.#buf[i]; this.#buf[i] = undefined; this.#size--; return x; }
  peekFront() { return this.#size ? this.#buf[this.#head] : undefined; }
  peekBack() { return this.#size ? this.#buf[(this.#head + this.#size - 1) % this.#buf.length] : undefined; }
  at(i) { if (!Number.isInteger(i) || i < 0 || i >= this.#size) throw new RangeError(\`индекс \${i} вне диапазона 0…\${this.#size - 1}\`); return this.#buf[(this.#head + i) % this.#buf.length]; }
  clear() { this.#buf = new Array(8); this.#head = 0; this.#size = 0; }
  toArray() { return [...this]; }
  *[Symbol.iterator]() { for (let i = 0; i < this.#size; i++) yield this.#buf[(this.#head + i) % this.#buf.length]; }
}

/* ───────── HashMap: открытая адресация с линейным зондированием и сдвигом назад при удалении ───────── */
const ids = new WeakMap(); let nextId = 1;
function mix(h) { h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; }
const f64 = new Float64Array(1), u32 = new Uint32Array(f64.buffer);
function hashOf(k) {
  switch (typeof k) {
    case "string": { let h = 0x811c9dc5; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 0x01000193); } return mix(h ^ 0x73); }
    case "number": if (Number.isInteger(k) && Math.abs(k) < 2 ** 31) return mix(k | 0); f64[0] = k; return mix(u32[0] ^ Math.imul(u32[1], 0x9e3779b1));
    case "boolean": return k ? 0x1234567 : 0x7654321;
    case "undefined": return 0x2468ace;
    case "bigint": return hashOf(k.toString()) ^ 0x62;
    case "symbol": case "function": case "object": {
      if (k === null) return 0x13579bd;
      let id = ids.get(k); if (id === undefined) { id = nextId++; ids.set(k, id); } return mix(id * 0x9e3779b1);
    }
  }
}
const same = (a, b) => a === b || (a !== a && b !== b);                       // SameValueZero: NaN равен NaN, 0 равен −0
export class HashMap {
  #keys; #vals; #used; #size = 0; #cap;
  constructor(entries = []) { this.#alloc(8); for (const [k, v] of entries) this.set(k, v); }
  #alloc(cap) { this.#cap = cap; this.#keys = new Array(cap); this.#vals = new Array(cap); this.#used = new Uint8Array(cap); }
  get size() { return this.#size; }
  get capacity() { return this.#cap; }
  get loadFactor() { return this.#size / this.#cap; }
  #find(k) { let i = hashOf(k) & (this.#cap - 1); while (this.#used[i]) { if (same(this.#keys[i], k)) return i; i = (i + 1) & (this.#cap - 1); } return -1 - i; }   // найден: i ≥ 0; нет: -(слот для вставки) - 1
  has(k) { return this.#find(k) >= 0; }
  get(k) { const i = this.#find(k); return i >= 0 ? this.#vals[i] : undefined; }
  set(k, v) {
    if (k === 0) k = 0;                                                           // −0 → 0
    const i = this.#find(k);
    if (i >= 0) { this.#vals[i] = v; return this; }
    if ((this.#size + 1) * 4 > this.#cap * 3) { this.#resize(this.#cap * 2); return this.set(k, v); }
    const slot = -1 - i; this.#keys[slot] = k; this.#vals[slot] = v; this.#used[slot] = 1; this.#size++; return this;
  }
  #resize(cap) { const keys = this.#keys, vals = this.#vals, used = this.#used, old = this.#cap; this.#alloc(cap); this.#size = 0; for (let i = 0; i < old; i++) if (used[i]) this.set(keys[i], vals[i]); }
  delete(k) {
    let i = this.#find(k); if (i < 0) return false;
    const mask = this.#cap - 1; this.#used[i] = 0; this.#keys[i] = undefined; this.#vals[i] = undefined; this.#size--;
    for (let j = (i + 1) & mask; this.#used[j]; j = (j + 1) & mask) {              // сдвиг назад: возвращаем в «дыру» тех, кому она нужна
      const home = hashOf(this.#keys[j]) & mask;
      if (((j - home) & mask) >= ((j - i) & mask)) { this.#keys[i] = this.#keys[j]; this.#vals[i] = this.#vals[j]; this.#used[i] = 1; this.#used[j] = 0; this.#keys[j] = undefined; this.#vals[j] = undefined; i = j; }
    }
    return true;
  }
  clear() { this.#alloc(8); this.#size = 0; }
  *entries() { for (let i = 0; i < this.#cap; i++) if (this.#used[i]) yield [this.#keys[i], this.#vals[i]]; }
  *keys() { for (const [k] of this.entries()) yield k; }
  *values() { for (const [, v] of this.entries()) yield v; }
  [Symbol.iterator]() { return this.entries(); }
}

/* ───────── IndexedMinHeap: двоичная куча с индексом «ключ → позиция» (поддерживает decrease) ───────── */
export class IndexedMinHeap {
  #keys = []; #prio = []; #pos = new HashMap();
  get size() { return this.#keys.length; }
  has(key) { return this.#pos.has(key); }
  priorityOf(key) { const i = this.#pos.get(key); return i === undefined ? undefined : this.#prio[i]; }
  peek() { return this.#keys.length ? { key: this.#keys[0], priority: this.#prio[0] } : undefined; }
  push(key, priority) {
    if (this.#pos.has(key)) throw new Error(\`ключ \${String(key)} уже есть в куче\`);
    this.#keys.push(key); this.#prio.push(priority); this.#pos.set(key, this.#keys.length - 1); this.#up(this.#keys.length - 1); return this;
  }
  decrease(key, priority) {
    const i = this.#pos.get(key);
    if (i === undefined) throw new RangeError(\`ключа \${String(key)} нет в куче\`);
    if (priority > this.#prio[i]) throw new RangeError("новый приоритет больше текущего");
    this.#prio[i] = priority; this.#up(i); return this;
  }
  popMin() {
    const n = this.#keys.length; if (!n) return undefined;
    const top = { key: this.#keys[0], priority: this.#prio[0] };
    this.#swap(0, n - 1); this.#keys.pop(); this.#prio.pop(); this.#pos.delete(top.key);
    if (this.#keys.length) this.#down(0);
    return top;
  }
  #swap(i, j) { [this.#keys[i], this.#keys[j]] = [this.#keys[j], this.#keys[i]]; [this.#prio[i], this.#prio[j]] = [this.#prio[j], this.#prio[i]]; this.#pos.set(this.#keys[i], i); this.#pos.set(this.#keys[j], j); }
  #up(i) { while (i > 0) { const p = (i - 1) >> 1; if (this.#prio[p] <= this.#prio[i]) break; this.#swap(i, p); i = p; } }
  #down(i) { const n = this.#keys.length; for (;;) { let m = i; const l = 2 * i + 1, r = l + 1; if (l < n && this.#prio[l] < this.#prio[m]) m = l; if (r < n && this.#prio[r] < this.#prio[m]) m = r; if (m === i) return; this.#swap(i, m); i = m; } }
}

/* ───────── AVLTree: упорядоченное отображение с самобалансировкой ───────── */
const h = (n) => (n ? n.h : 0);
const fix = (n) => { n.h = 1 + Math.max(h(n.l), h(n.r)); return n; };
const rotR = (n) => { const l = n.l; n.l = l.r; l.r = fix(n); return fix(l); };
const rotL = (n) => { const r = n.r; n.r = r.l; r.l = fix(n); return fix(r); };
const rebalance = (n) => {
  fix(n); const b = h(n.l) - h(n.r);
  if (b > 1) { if (h(n.l.l) < h(n.l.r)) n.l = rotL(n.l); return rotR(n); }
  if (b < -1) { if (h(n.r.r) < h(n.r.l)) n.r = rotR(n.r); return rotL(n); }
  return n;
};
export class AVLTree {
  #root = null; #size = 0; #cmp;
  constructor(compare = defaultCompare) { this.#cmp = compare; }
  get size() { return this.#size; }
  get height() { return h(this.#root); }
  #node(k) { let n = this.#root; while (n) { const c = this.#cmp(k, n.k); if (c === 0) return n; n = c < 0 ? n.l : n.r; } return null; }
  has(k) { return this.#node(k) !== null; }
  get(k) { return this.#node(k)?.v; }
  set(k, v) {
    const ins = (n) => {
      if (!n) { this.#size++; return { k, v, h: 1, l: null, r: null }; }
      const c = this.#cmp(k, n.k);
      if (c === 0) n.v = v; else if (c < 0) n.l = ins(n.l); else n.r = ins(n.r);
      return rebalance(n);
    };
    this.#root = ins(this.#root); return this;
  }
  delete(k) {
    let found = false;
    const popMin = (n) => { if (!n.l) return [n.r, n]; const [rest, min] = popMin(n.l); n.l = rest; return [rebalance(n), min]; };
    const del = (n) => {
      if (!n) return null;
      const c = this.#cmp(k, n.k);
      if (c < 0) n.l = del(n.l); else if (c > 0) n.r = del(n.r);
      else { found = true; if (!n.l) return n.r; if (!n.r) return n.l; const [rest, min] = popMin(n.r); min.l = n.l; min.r = rest; return rebalance(min); }
      return rebalance(n);
    };
    this.#root = del(this.#root); if (found) this.#size--; return found;
  }
  /** Проверка инварианта: порядок ключей, высоты узлов записаны верно, баланс каждого узла |h(левого) − h(правого)| ≤ 1. */
  validate() {
    const walk = (n, lo, hi) => {
      if (!n) return 0;
      if ((lo !== undefined && this.#cmp(n.k, lo) <= 0) || (hi !== undefined && this.#cmp(n.k, hi) >= 0)) return -1;
      const a = walk(n.l, lo, n.k), b = walk(n.r, n.k, hi);
      if (a < 0 || b < 0 || Math.abs(a - b) > 1 || n.h !== 1 + Math.max(a, b)) return -1;
      return n.h;
    };
    return walk(this.#root, undefined, undefined) >= 0;
  }
  min() { let n = this.#root; if (!n) return undefined; while (n.l) n = n.l; return [n.k, n.v]; }
  max() { let n = this.#root; if (!n) return undefined; while (n.r) n = n.r; return [n.k, n.v]; }
  floor(k) { let n = this.#root, best = null; while (n) { const c = this.#cmp(k, n.k); if (c === 0) return [n.k, n.v]; if (c < 0) n = n.l; else { best = n; n = n.r; } } return best ? [best.k, best.v] : undefined; }
  ceiling(k) { let n = this.#root, best = null; while (n) { const c = this.#cmp(k, n.k); if (c === 0) return [n.k, n.v]; if (c > 0) n = n.r; else { best = n; n = n.l; } } return best ? [best.k, best.v] : undefined; }
  *range(lo, hi) { const self = this; function* walk(n) { if (!n) return; if (self.#cmp(lo, n.k) < 0) yield* walk(n.l); if (self.#cmp(n.k, lo) >= 0 && self.#cmp(n.k, hi) < 0) yield [n.k, n.v]; if (self.#cmp(n.k, hi) < 0) yield* walk(n.r); } yield* walk(this.#root); }
  *[Symbol.iterator]() { const st = []; let n = this.#root; while (n || st.length) { while (n) { st.push(n); n = n.l; } n = st.pop(); yield [n.k, n.v]; n = n.r; } }
}

/* ───────── UnionFind: сжатие путей (прореживание) и объединение по размеру ───────── */
export class UnionFind {
  #p; #sz; #count;
  constructor(n) { this.#p = Int32Array.from({ length: n }, (_, i) => i); this.#sz = new Int32Array(n).fill(1); this.#count = n; }
  get count() { return this.#count; }
  find(x) { const p = this.#p; if (!Number.isInteger(x) || x < 0 || x >= p.length) throw new RangeError(\`элемент \${x} вне диапазона 0…\${p.length - 1}\`); while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; }
  union(a, b) { let x = this.find(a), y = this.find(b); if (x === y) return false; if (this.#sz[x] < this.#sz[y]) [x, y] = [y, x]; this.#p[y] = x; this.#sz[x] += this.#sz[y]; this.#count--; return true; }
  connected(a, b) { return this.find(a) === this.find(b); }
  sizeOf(x) { return this.#sz[this.find(x)]; }
}

/* ───────── Дейкстра: кратчайшие пути в графе с неотрицательными весами ───────── */
// adj[u] = [[v, вес], …]; вершины 0…n−1; возвращает { dist, prev }: dist[v] = Infinity, если v недостижима; prev[v] = −1 для источника и недостижимых
export function dijkstra(adj, source) {
  const n = adj.length, dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1);
  if (!Number.isInteger(source) || source < 0 || source >= n) throw new RangeError(\`источник \${source} вне диапазона 0…\${n - 1}\`);
  const heap = new IndexedMinHeap(), done = new Uint8Array(n);
  dist[source] = 0; heap.push(source, 0);
  while (heap.size) {
    const { key: u, priority: d } = heap.popMin(); done[u] = 1;
    for (const [v, w] of adj[u]) {
      if (w < 0) throw new RangeError(\`отрицательный вес ребра \${u} → \${v}: \${w}\`);
      if (done[v] || d + w >= dist[v]) continue;
      dist[v] = d + w; prev[v] = u;
      if (heap.has(v)) heap.decrease(v, dist[v]); else heap.push(v, dist[v]);
    }
  }
  return { dist, prev };
}
export function pathTo(result, target) {
  if (result.dist[target] === Infinity) return [];
  const path = []; for (let v = target; v !== -1; v = result.prev[v]) path.push(v); return path.reverse();
}`, { filename: "ds.mjs", lineNumbers: true }),
    h("Самопроверка check.mjs"),
    p("Проверки используют фиксированные начальные значения генераторов: результат одинаков при любом запуске. Модели — встроенные `Array` и `Map`, эталон кратчайших путей — алгоритм Беллмана — Форда; инварианты проверяет ваш `validate()` и независимые вычисления границ."),
    code("js", `// Самопроверка проекта «Библиотека структур данных». Запуск: node check.mjs [каталог с ds.mjs]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = path.resolve(process.argv[2] ?? "solution");
const file = path.join(dir, "ds.mjs");
const source = fs.readFileSync(file, "utf8");
const code = source.replace(/\\/\\*[\\s\\S]*?\\*\\//g, "").replace(/(^|[^:])\\/\\/.*$/gm, "$1");
const M = await import(pathToFileURL(file).href);
const { Deque, HashMap, IndexedMinHeap, AVLTree, UnionFind, dijkstra, pathTo } = M;

let total = 0, passed = 0;
function check(name, fn) {
  total++;
  let ok = false, note = "";
  try { const r = fn(); ok = r === true; if (!ok) note = \` (вернуло \${typeof r === "object" ? JSON.stringify(r)?.slice(0, 80) : String(r)})\`; } catch (e) { note = \` (\${e?.name ?? "Error"}: \${String(e?.message ?? e).split("\\n")[0].slice(0, 90)})\`; }
  if (ok) passed++;
  console.log(\`\${ok ? "OK " : "НЕТ"}  \${name}\${ok ? "" : note}\`);
}
const J = JSON.stringify;
const seeded = (sd) => { let x = sd >>> 0; return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; };
const throws = (f, K = Error) => { try { f(); return false; } catch (e) { return e instanceof K; } };
const timed = (f) => { const t = performance.now(); const r = f(); return [r, performance.now() - t]; };

// ── Deque ──
check("экспортированы Deque, HashMap, IndexedMinHeap, AVLTree, UnionFind, dijkstra, pathTo", () => [Deque, HashMap, IndexedMinHeap, AVLTree, UnionFind, dijkstra, pathTo].every((x) => typeof x === "function"));
check("Deque: порядок элементов при добавлении и удалении с обоих концов", () => { const d = new Deque(); d.pushBack(2).pushBack(3).pushFront(1).pushFront(0); return J(d.toArray()) === "[0,1,2,3]" && d.popFront() === 0 && d.popBack() === 3 && d.size === 2 && d.peekFront() === 1 && d.peekBack() === 2; });
check("Deque: пустая очередь — popFront/popBack/peek возвращают undefined; at вне диапазона → RangeError", () => { const d = new Deque(); return d.popFront() === undefined && d.popBack() === undefined && d.peekFront() === undefined && d.peekBack() === undefined && d.size === 0 && throws(() => d.at(0), RangeError) && throws(() => new Deque([1]).at(1), RangeError) && throws(() => new Deque([1]).at(-1), RangeError); });
check("Deque: at(i), конструктор из итерируемого, итерация спереди назад, clear", () => { const d = new Deque("abc"); const it = [...d]; d.clear(); return J(it) === '["a","b","c"]' && new Deque([5, 6, 7]).at(1) === 6 && d.size === 0 && J(d.toArray()) === "[]"; });
check("Deque: 20 000 случайных операций совпадают с моделью на массиве (хранит undefined и null корректно)", () => { const r = seeded(1), d = new Deque(), m = []; for (let i = 0; i < 20000; i++) { const op = Math.floor(r() * 6), x = Math.floor(r() * 3) === 0 ? undefined : i; if (op === 0) { d.pushBack(x); m.push(x); } else if (op === 1) { d.pushFront(x); m.unshift(x); } else if (op === 2) { if (d.popFront() !== m.shift()) return false; } else if (op === 3) { if (d.popBack() !== m.pop()) return false; } else if (op === 4 && m.length) { const k = Math.floor(r() * m.length); if (d.at(k) !== m[k]) return false; } if (d.size !== m.length) return false; } return J([...d]) === J(m); });
check("Deque: не использует shift/unshift/splice массива; 1 000 000 операций с обоих концов быстрее 1,5 с", () => { if (/\\.(shift|unshift|splice)\\s*\\(/.test(code.split("export class HashMap")[0])) return false; const d = new Deque(); const [, ms] = timed(() => { for (let i = 0; i < 500000; i++) { d.pushBack(i); d.pushFront(i); } for (let i = 0; i < 400000; i++) { d.popFront(); d.popBack(); } }); return d.size === 200000 && ms < 1500; });
check("Deque: ёмкость растёт удвоением: capacity ≥ size и не более 2·size после тысячи добавлений", () => { const d = new Deque(); for (let i = 0; i < 1000; i++) d.pushBack(i); return d.capacity >= 1000 && d.capacity <= 2000; });

// ── HashMap ──
check("HashMap: set/get/has/delete/size на простых ключах; set возвращает this; delete возвращает true/false", () => { const m = new HashMap(); const r = m.set("a", 1).set("b", 2); return r === m && m.get("a") === 1 && m.has("b") && !m.has("c") && m.get("c") === undefined && m.size === 2 && m.delete("a") === true && m.delete("a") === false && m.size === 1; });
check("HashMap: ключи разных типов различаются (1 и \\"1\\", true и \\"true\\", null и undefined и \\"null\\")", () => { const m = new HashMap(); m.set(1, "n").set("1", "s").set(true, "b").set("true", "bs").set(null, "nul").set(undefined, "und").set("null", "sn"); return m.get(1) === "n" && m.get("1") === "s" && m.get(true) === "b" && m.get("true") === "bs" && m.get(null) === "nul" && m.get(undefined) === "und" && m.get("null") === "sn" && m.size === 7; });
check("HashMap: NaN — один ключ; 0 и −0 — один ключ; объекты и функции — по ссылке", () => { const m = new HashMap(); const o1 = {}, o2 = {}; m.set(NaN, 1).set(NaN, 2).set(0, "z").set(-0, "nz").set(o1, "a").set(o2, "b"); return m.get(NaN) === 2 && m.get(0) === "nz" && m.get(-0) === "nz" && m.get(o1) === "a" && m.get(o2) === "b" && m.get({}) === undefined && m.size === 4; });
check("HashMap: undefined как значение отличается от отсутствия ключа", () => { const m = new HashMap().set("k", undefined); return m.has("k") && m.get("k") === undefined && m.size === 1; });
check("HashMap: ключи __proto__, constructor, toString — обычные ключи", () => { const m = new HashMap().set("__proto__", 1).set("constructor", 2).set("toString", 3); return m.get("__proto__") === 1 && m.get("constructor") === 2 && m.get("toString") === 3 && m.size === 3 && !m.has("hasOwnProperty"); });
check("HashMap: не использует Map, Set и обычный объект как словарь", () => !/new\\s+(Map|Set)\\s*\\(/.test(code.split("/* ───────── IndexedMinHeap")[0]) && !/Object\\.(create|fromEntries)/.test(code.split("/* ───────── IndexedMinHeap")[0]));
check("HashMap: коэффициент заполнения не превышает 0,75 после любой вставки (10 000 вставок)", () => { const m = new HashMap(); for (let i = 0; i < 10000; i++) { m.set("k" + i, i); if (m.loadFactor > 0.75 || m.capacity < m.size) return false; } return m.size === 10000; });
check("HashMap: 30 000 случайных операций (вставка, замена, удаление, чтение) совпадают с Map", () => { const r = seeded(7), h = new HashMap(), m = new Map(); const key = () => { const t = Math.floor(r() * 4), v = Math.floor(r() * 400); return t === 0 ? v : t === 1 ? "s" + v : t === 2 ? String.fromCharCode(97 + (v % 26)) : v * 1024; }; for (let i = 0; i < 30000; i++) { const k = key(), op = Math.floor(r() * 4); if (op === 0 || op === 1) { h.set(k, i); m.set(k, i); } else if (op === 2) { if (h.delete(k) !== m.delete(k)) return false; } else if (h.get(k) !== m.get(k) || h.has(k) !== m.has(k)) return false; if (h.size !== m.size) return false; } for (const [k, v] of m) if (h.get(k) !== v) return false; return true; });
check("HashMap: после удалений остальные ключи находятся (цепочки зондирования не рвутся)", () => { const h = new HashMap(), keys = Array.from({ length: 3000 }, (_, i) => "key-" + i); keys.forEach((k, i) => h.set(k, i)); for (let i = 0; i < 3000; i += 2) h.delete(keys[i]); return keys.every((k, i) => (i % 2 === 0 ? !h.has(k) : h.get(k) === i)) && h.size === 1500; });
check("HashMap: итерация entries/keys/values/[Symbol.iterator] отдаёт каждую пару ровно один раз", () => { const h = new HashMap(); for (let i = 0; i < 500; i++) h.set(i, i * 2); h.delete(10); const e = [...h], k = [...h.keys()], v = [...h.values()]; return e.length === 499 && new Set(e.map((x) => x[0])).size === 499 && k.length === 499 && v.length === 499 && e.every(([a, b]) => b === a * 2) && J([...h.entries()].length) === "499"; });
check("HashMap: 90 000 вставок быстрее секунды: числа подряд, числа с шагом 1024 и строки с общим префиксом", () => { const [, ms] = timed(() => { const a = new HashMap(), b = new HashMap(), c = new HashMap(); for (let i = 0; i < 30000; i++) { a.set(i, i); b.set(i * 1024, i); c.set("prefix-common-" + i, i); } if (a.size + b.size + c.size !== 90000 || b.get(1024 * 29999) !== 29999 || c.get("prefix-common-5") !== 5) throw new Error("неверно"); }); return ms < 1000; });
check("HashMap: clear и конструктор из пар", () => { const h = new HashMap([["a", 1], ["b", 2]]); const was = h.size; h.clear(); return was === 2 && h.size === 0 && !h.has("a") && h.set("c", 3).get("c") === 3; });

// ── IndexedMinHeap ──
check("IndexedMinHeap: popMin выдаёт ключи по неубыванию приоритета", () => { const h = new IndexedMinHeap(); [["a", 5], ["b", 2], ["c", 9], ["d", 1]].forEach(([k, p]) => h.push(k, p)); const out = []; while (h.size) out.push(h.popMin().key); return J(out) === '["d","b","a","c"]' && h.popMin() === undefined; });
check("IndexedMinHeap: peek, has, priorityOf, size", () => { const h = new IndexedMinHeap().push("x", 3).push("y", 1); return J(h.peek()) === '{"key":"y","priority":1}' && h.has("x") && !h.has("z") && h.priorityOf("x") === 3 && h.priorityOf("z") === undefined && h.size === 2 && new IndexedMinHeap().peek() === undefined; });
check("IndexedMinHeap: decrease поднимает ключ; больший приоритет → RangeError; неизвестный ключ → RangeError; повторный push → Error", () => { const h = new IndexedMinHeap().push("a", 10).push("b", 5).push("c", 7); h.decrease("a", 1); return h.peek().key === "a" && throws(() => h.decrease("a", 20), RangeError) && throws(() => h.decrease("zzz", 1), RangeError) && throws(() => h.push("a", 0)); });
check("IndexedMinHeap: 20 000 случайных операций совпадают с моделью (push, decrease, popMin)", () => { const r = seeded(5), h = new IndexedMinHeap(), m = new Map(); let nextKey = 0; for (let i = 0; i < 20000; i++) { const op = Math.floor(r() * 3); if (op === 0) { const k = nextKey++, p = Math.floor(r() * 1000); h.push(k, p); m.set(k, p); } else if (op === 1 && m.size) { const k = [...m.keys()][Math.floor(r() * m.size)], p = m.get(k) - Math.floor(r() * 50); h.decrease(k, p); m.set(k, p); } else if (op === 2 && m.size) { const min = Math.min(...m.values()), t = h.popMin(); if (t.priority !== min || m.get(t.key) !== t.priority) return false; m.delete(t.key); } if (h.size !== m.size) return false; } return true; });
check("IndexedMinHeap: 100 000 добавлений и извлечений быстрее 1,5 с, порядок верный", () => { const r = seeded(3), h = new IndexedMinHeap(); const [ok, ms] = timed(() => { for (let i = 0; i < 100000; i++) h.push(i, r()); let prev = -1; while (h.size) { const t = h.popMin(); if (t.priority < prev) return false; prev = t.priority; } return true; }); return ok && ms < 1500; });
check("IndexedMinHeap: ключи разных типов (числа, строки, объекты) и нулевой/отрицательный приоритет", () => { const o = {}; const h = new IndexedMinHeap().push(1, 0).push("1", -5).push(o, 3); return h.popMin().key === "1" && h.popMin().key === 1 && h.popMin().key === o; });

// ── AVLTree ──
check("AVLTree: set/get/has/delete/size, замена значения не меняет размер", () => { const t = new AVLTree(); t.set(5, "a").set(2, "b").set(8, "c").set(5, "A"); return t.get(5) === "A" && t.size === 3 && t.has(2) && !t.has(7) && t.get(7) === undefined && t.delete(2) === true && t.delete(2) === false && t.size === 2; });
check("AVLTree: итерация — по возрастанию ключей; min и max; пустое дерево", () => { const t = new AVLTree(); [5, 1, 9, 3, 7].forEach((k) => t.set(k, k * 10)); const e = new AVLTree(); return J([...t].map((x) => x[0])) === "[1,3,5,7,9]" && J(t.min()) === "[1,10]" && J(t.max()) === "[9,90]" && e.min() === undefined && e.max() === undefined && e.height === 0 && e.size === 0; });
check("AVLTree: floor и ceiling (точное совпадение, между ключами, за границами)", () => { const t = new AVLTree(); [10, 20, 30].forEach((k) => t.set(k, k)); return J(t.floor(20)) === "[20,20]" && J(t.floor(25)) === "[20,20]" && t.floor(5) === undefined && J(t.ceiling(25)) === "[30,30]" && J(t.ceiling(20)) === "[20,20]" && t.ceiling(35) === undefined && J(t.floor(99)) === "[30,30]"; });
check("AVLTree: range(lo, hi) — ключи из полуинтервала [lo, hi) по возрастанию", () => { const t = new AVLTree(); for (let i = 0; i < 50; i += 5) t.set(i, i); return J([...t.range(10, 30)].map((x) => x[0])) === "[10,15,20,25]" && [...t.range(100, 200)].length === 0 && [...t.range(-5, 1)].length === 1; });
check("AVLTree: пользовательский компаратор (обратный порядок, строки по длине)", () => { const t = new AVLTree((a, b) => b - a); [1, 3, 2].forEach((k) => t.set(k, 0)); const s = new AVLTree((a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0)); ["ccc", "a", "bb"].forEach((k) => s.set(k, 0)); return J([...t].map((x) => x[0])) === "[3,2,1]" && J([...s].map((x) => x[0])) === '["a","bb","ccc"]'; });
check("AVLTree: 20 000 случайных операций совпадают с отсортированным массивом", () => { const r = seeded(11), t = new AVLTree(), m = new Map(); for (let i = 0; i < 20000; i++) { const k = Math.floor(r() * 500), op = Math.floor(r() * 3); if (op === 0) { t.set(k, i); m.set(k, i); } else if (op === 1) { if (t.delete(k) !== m.delete(k)) return false; } else if (t.get(k) !== m.get(k)) return false; if (t.size !== m.size) return false; } const keys = [...m.keys()].sort((a, b) => a - b); return J([...t].map((x) => x[0])) === J(keys) && (keys.length === 0 || (t.min()[0] === keys[0] && t.max()[0] === keys[keys.length - 1])); });
check("AVLTree: высота ≤ 1,4405·log₂(n + 2) − 0,3277 для 100 000 ключей подряд (худший случай для обычного дерева)", () => { const t = new AVLTree(), n = 100000; for (let i = 1; i <= n; i++) t.set(i, i); return t.height <= 1.4405 * Math.log2(n + 2) - 0.3277 + 1e-9 && t.size === n; });
check("AVLTree: validate() подтверждает инвариант (порядок, высоты, баланс) после случайных вставок и удалений 90 % ключей и после «зигзагообразной» вставки", () => { const r = seeded(6), t = new AVLTree(); const keys = Array.from({ length: 30000 }, () => Math.floor(r() * 1e9)); keys.forEach((k) => t.set(k, 1)); const okA = t.validate(); const uk = [...t].map((x) => x[0]); for (let i = uk.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [uk[i], uk[j]] = [uk[j], uk[i]]; } for (let i = 0; i < Math.floor(uk.length * 0.9); i++) { t.delete(uk[i]); if (i % 4000 === 0 && !t.validate()) return false; } const z = new AVLTree(); for (let i = 0; i < 5000; i++) { z.set(i, 1); z.set(9999 - i, 1); } return okA && t.validate() && z.validate() && z.size === 10000; });
check("AVLTree: высота ограничена и после удаления половины ключей и при случайных вставках", () => { const r = seeded(2), t = new AVLTree(); for (let i = 0; i < 50000; i++) t.set(Math.floor(r() * 1e9), i); const ok1 = t.height <= 1.4405 * Math.log2(t.size + 2) - 0.3277 + 1e-9; const keys = [...t].map((x) => x[0]); keys.forEach((k, i) => { if (i % 2 === 0) t.delete(k); }); return ok1 && t.height <= 1.4405 * Math.log2(t.size + 2) - 0.3277 + 1e-9 && t.size === keys.length - Math.ceil(keys.length / 2); });
check("AVLTree: 100 000 вставок, поиска и удалений быстрее 1,5 с", () => { const r = seeded(4), t = new AVLTree(); const [, ms] = timed(() => { const ks = Array.from({ length: 100000 }, () => Math.floor(r() * 1e9)); ks.forEach((k) => t.set(k, 1)); ks.forEach((k) => t.get(k)); ks.forEach((k, i) => { if (i % 3 === 0) t.delete(k); }); }); return ms < 1500; });
check("AVLTree: итерация дерева из 100 000 ключей не рекурсивна по размеру (без переполнения стека)", () => { const t = new AVLTree(); for (let i = 0; i < 100000; i++) t.set(i, i); let c = 0, prev = -1; for (const [k] of t) { if (k <= prev) return false; prev = k; c++; } return c === 100000; });

// ── UnionFind ──
check("UnionFind: объединение, connected, count, sizeOf", () => { const u = new UnionFind(6); const a = u.union(0, 1), b = u.union(1, 2), c = u.union(0, 2); u.union(3, 4); return a && b && !c && u.connected(0, 2) && !u.connected(0, 3) && u.count === 3 && u.sizeOf(2) === 3 && u.sizeOf(5) === 1; });
check("UnionFind: find вне диапазона → RangeError; нулевое число элементов", () => throws(() => new UnionFind(3).find(3), RangeError) && throws(() => new UnionFind(3).find(-1), RangeError) && new UnionFind(0).count === 0);
check("UnionFind: 5000 случайных объединений совпадают с метками компонент", () => { const n = 300, r = seeded(9), u = new UnionFind(n), lab = Array.from({ length: n }, (_, i) => i); for (let i = 0; i < 5000; i++) { const a = Math.floor(r() * n), b = Math.floor(r() * n); const merged = u.union(a, b), la = lab[a], lb = lab[b]; if (merged !== (la !== lb)) return false; if (la !== lb) for (let k = 0; k < n; k++) if (lab[k] === lb) lab[k] = la; } return new Set(lab).size === u.count && Array.from({ length: 200 }, () => [Math.floor(r() * n), Math.floor(r() * n)]).every(([a, b]) => u.connected(a, b) === (lab[a] === lab[b])); });
check("UnionFind: цепочка из 1 000 000 элементов: объединения и find без рекурсии, быстрее 1,5 с", () => { const n = 1_000_000, u = new UnionFind(n); const [, ms] = timed(() => { for (let i = 0; i + 1 < n; i++) u.union(i, i + 1); }); return u.count === 1 && u.connected(0, n - 1) && u.sizeOf(500000) === n && ms < 1500; });

// ── Dijkstra ──
const bellman = (adj, s) => { const n = adj.length, d = new Array(n).fill(Infinity); d[s] = 0; for (let i = 0; i < n; i++) { let ch = false; for (let u = 0; u < n; u++) if (d[u] < Infinity) for (const [v, w] of adj[u]) if (d[u] + w < d[v]) { d[v] = d[u] + w; ch = true; } if (!ch) break; } return d; };
check("dijkstra: пример из пяти вершин, пути восстанавливаются через pathTo", () => { const adj = [[[1, 4], [2, 1]], [[3, 1]], [[1, 2], [3, 5]], [[4, 3]], []]; const r = dijkstra(adj, 0); return J(r.dist) === "[0,3,1,4,7]" && J(pathTo(r, 4)) === "[0,2,1,3,4]" && J(pathTo(r, 0)) === "[0]"; });
check("dijkstra: недостижимые вершины — Infinity, путь к ним [], prev = -1", () => { const r = dijkstra([[[1, 1]], [], []], 0); return r.dist[2] === Infinity && J(pathTo(r, 2)) === "[]" && r.prev[2] === -1 && r.prev[0] === -1; });
check("dijkstra: нулевые веса, параллельные рёбра, петли", () => { const r = dijkstra([[[0, 5], [1, 0], [1, 7]], [[2, 0]], []], 0); return J(r.dist) === "[0,0,0]"; });
check("dijkstra: отрицательный вес → RangeError; источник вне диапазона → RangeError", () => throws(() => dijkstra([[[1, -1]], []], 0), RangeError) && throws(() => dijkstra([[]], 5), RangeError));
check("dijkstra совпадает с алгоритмом Беллмана — Форда на 60 случайных графах (вес 0…20)", () => { const r = seeded(13); for (let t = 0; t < 60; t++) { const n = 2 + Math.floor(r() * 25), adj = Array.from({ length: n }, () => []); for (let e = 0; e < n * 3; e++) adj[Math.floor(r() * n)].push([Math.floor(r() * n), Math.floor(r() * 21)]); const s = Math.floor(r() * n), d = dijkstra(adj, s).dist, ref = bellman(adj, s); if (J(d) !== J(ref)) return false; } return true; });
check("dijkstra: пути в результате действительно существуют и их длина равна dist", () => { const r = seeded(17), n = 200, adj = Array.from({ length: n }, () => []); for (let e = 0; e < 800; e++) adj[Math.floor(r() * n)].push([Math.floor(r() * n), 1 + Math.floor(r() * 9)]); const res = dijkstra(adj, 0); for (let v = 0; v < n; v++) { const p = pathTo(res, v); if (res.dist[v] === Infinity) { if (p.length) return false; continue; } if (p[0] !== 0 || p[p.length - 1] !== v) return false; let len = 0; for (let i = 1; i < p.length; i++) { const w = Math.min(...adj[p[i - 1]].filter(([x]) => x === p[i]).map(([, ww]) => ww)); if (!Number.isFinite(w)) return false; len += w; } if (len !== res.dist[v]) return false; } return true; });
check("dijkstra использует вашу IndexedMinHeap, а не сортировку при каждом шаге", () => /IndexedMinHeap/.test(dijkstra.toString()) && !/\\.sort\\s*\\(/.test(dijkstra.toString()));
check("dijkstra: граф из 50 000 вершин и 250 000 рёбер быстрее 1,5 с", () => { const r = seeded(21), n = 50000, adj = Array.from({ length: n }, () => []); for (let e = 0; e < 250000; e++) adj[Math.floor(r() * n)].push([Math.floor(r() * n), 1 + Math.floor(r() * 100)]); for (let i = 0; i + 1 < n; i++) adj[i].push([i + 1, 50]); const [res, ms] = timed(() => dijkstra(adj, 0)); return res.dist.every((d) => d < Infinity) && ms < 1500; });

console.log(\`\\nПройдено проверок: \${passed} из \${total}\`);
process.exitCode = passed === total ? 0 : 1;`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 48 из 48`, { filename: "результат node check.mjs solution (Node.js 22.22.0)" }),
    code("text", `Пройдено проверок: 2 из 48`, { filename: "результат node check.mjs starter (заготовка)" }),
    h("Проверка самой проверки: «плохие» варианты"),
    code("text", `b01-deque-peek-back-off-by-one: Пройдено проверок: 47 из 48
b02-deque-grow-ignores-head: Пройдено проверок: 47 из 48
b03-hash-no-backshift: Пройдено проверок: 43 из 48
b04-hash-load-0.9: Пройдено проверок: 47 из 48
b05-hash-nan-unequal: Пройдено проверок: 47 из 48
b06-hash-weak-string-hash: Пройдено проверок: 47 из 48
b07-heap-decrease-no-sift: Пройдено проверок: 45 из 48
b08-heap-stale-index: Пройдено проверок: 45 из 48
b09-avl-delete-no-rebalance: Пройдено проверок: 47 из 48
b10-avl-single-rotation-only: Пройдено проверок: 47 из 48
b11-avl-ceiling-wrong: Пройдено проверок: 47 из 48
b12-uf-recursive-unbalanced: Пройдено проверок: 47 из 48
b13-dijkstra-allows-negative: Пройдено проверок: 47 из 48
b14-dijkstra-duplicate-push: Пройдено проверок: 45 из 48`, { filename: "результат check.mjs для вариантов с ошибками (из 48)" }),
    warn("Структура данных, которая проходит «счастливые» примеры, почти всегда ломается на последовательности операций: вставка–удаление–вставка. Поэтому проверка сравнивает вашу реализацию с моделью на **длинных случайных последовательностях**, а не на трёх примерах."),
    tip("Хотите найти ошибку в собственной структуре быстро — напишите тест-сверку с моделью (массив, `Map`) и дайте ей 20 000 случайных операций с фиксированным начальным значением. Когда первое расхождение найдено, сократите последовательность до минимальной — это и есть ваш воспроизводимый тест."),
  ],
};
