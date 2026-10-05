import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p01AlgorithmLab: Project = {
  id: "cs.p01-algorithm-lab",
  domain: "cs",
  order: 1,
  title: "Лаборатория алгоритмов",
  subtitle: "Сортировка, двоичный поиск, быстрый выбор, динамическое программирование и оценка роста по числу операций — 40 проверок на счётчиках сравнений, а не на секундомере",
  level: "foundation",
  estimatedHours: 8,
  buildsOn: [],
  topics: ["cs.complexity-big-o", "cs.searching-sorting", "cs.recursion-dp"],
  objective:
    "Написать модуль `algos.mjs` из **девяти функций** и доказать их корректность и скорость не словами, а числами: каждая функция либо сверяется с эталоном на сотнях случайных входов, либо обязана уложиться в **доказуемую границу числа сравнений** (`n·⌈log₂n⌉` для сортировки, `⌈log₂(n + 1)⌉` для двоичного поиска, `12·n` для быстрого выбора), а функция `classifyGrowth` по измеренным операциям определяет класс роста — `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)`.",
  scenario: [
    p("Вы строите внутреннюю библиотеку для команды, где «медленно» долго считалось мнением: один считал секундомером на своём ноутбуке, другой — на сервере, третий — «на глаз». Задача — библиотека алгоритмов, у которой скорость измеряется **числом операций**: оно не зависит от процессора, нагрузки и версии движка, поэтому результат воспроизводится на любой машине. Каждая функция принимает необязательный объект `stats`, в котором считает вызовы компаратора (`stats.comparisons`)."),
    p("Заготовка лежит в `starter/algos.mjs`: функции пока бросают «не реализовано». Проверка `check.mjs` (40 проверок) запускается командой `node check.mjs .` в каталоге с вашим `algos.mjs`. Ни одной зависимости не нужно: достаточно Node.js 22."),
    code("js", `// Заготовка проекта «Лаборатория алгоритмов». Реализуйте функции, затем запустите:  node check.mjs .
// Имена экспортов и сигнатуры менять нельзя. Подробные требования — в описании проекта.

export function mergeSort(items, compare, stats) {
  throw new Error("не реализовано: mergeSort");
}

export function lowerBound(sorted, x, compare, stats) {
  throw new Error("не реализовано: lowerBound");
}

export function upperBound(sorted, x, compare, stats) {
  throw new Error("не реализовано: upperBound");
}

export function kthSmallest(items, k, compare, stats) {
  throw new Error("не реализовано: kthSmallest");
}

export function editDistance(a, b) {
  throw new Error("не реализовано: editDistance");
}

export function longestIncreasingSubsequence(items, compare, stats) {
  throw new Error("не реализовано: longestIncreasingSubsequence");
}

export function knapsack(weights, values, capacity) {
  throw new Error("не реализовано: knapsack");
}

export function coinChange(coins, amount) {
  throw new Error("не реализовано: coinChange");
}

export function classifyGrowth(points) {
  throw new Error("не реализовано: classifyGrowth");
}`, { filename: "starter/algos.mjs" }),
    table(
      ["Функция", "Что делает", "Граница или эталон в проверке"],
      [
        ["`mergeSort(items, compare, stats)`", "Устойчивая сортировка слиянием; новый массив, вход не меняется", "≤ n·⌈log₂n⌉ сравнений; 200 000 элементов быстрее 2 с; встроенный `sort` запрещён"],
        ["`lowerBound` / `upperBound(sorted, x, compare, stats)`", "Первый индекс «не меньше» / «строго больше»", "≤ ⌈log₂(n + 1)⌉ сравнений на миллионе элементов"],
        ["`kthSmallest(items, k, compare, stats)`", "k-й по величине элемент (k с нуля) без полной сортировки", "≤ 12·n сравнений на пяти видах входа по 50 000 элементов"],
        ["`editDistance(a, b)`", "Расстояние Левенштейна по кодовым точкам Unicode", "Эталон на 150 парах; две строки по 2000 символов быстрее 2 с"],
        ["`longestIncreasingSubsequence(items, compare, stats)`", "`{ length, sequence }` для строго возрастающей подпоследовательности", "O(n log n): 200 000 элементов быстрее 2 с, ≤ n·(⌈log₂n⌉ + 1) сравнений"],
        ["`knapsack(weights, values, capacity)`", "Рюкзак 0/1: `{ value, items }`", "Перебор подмножеств на 100 наборах"],
        ["`coinChange(coins, amount)`", "Наименьшее число монет или −1", "Сумма 100 000 быстрее секунды; жадность не проходит"],
        ["`classifyGrowth(points)`", "Класс роста по точкам `[n, операции]`", "Точные последовательности, шум ±3 %, измерения ваших функций"],
      ],
      "Контракт модуля",
    ),
  ],
  requirements: [
    "`algos.mjs` экспортирует девять функций с указанными именами; сигнатуры менять нельзя.",
    "`mergeSort` **устойчива**: элементы, равные по компаратору, сохраняют исходный порядок; возвращает **новый** массив и не изменяет исходный; по умолчанию сравнивает числа как числа, а строки — по кодовым единицам (`10 > 9`, `\"B\" < \"a\"`); встроенные `Array.prototype.sort` и `toSorted` не используются.",
    "Если передан объект `stats`, каждая функция увеличивает `stats.comparisons` **ровно на число вызовов компаратора** (для `mergeSort`, `lowerBound`, `upperBound`, `kthSmallest`, `longestIncreasingSubsequence`).",
    "`lowerBound` возвращает первый индекс `i`, для которого `compare(sorted[i], x) >= 0`, `upperBound` — первый, для которого `> 0`; для пустого массива и значений за границами — `0` и `sorted.length`; число сравнений не больше `⌈log₂(n + 1)⌉`.",
    "`kthSmallest` не меняет исходный массив, при `k` вне `0…n−1` бросает `RangeError`; делает не более `12·n` сравнений на случайном, отсортированном, обратном, **состоящем из одинаковых** значений и «горном» входах (быстрый выбор с трёхсторонним разбиением и устойчивым выбором опорного).",
    "`editDistance` считает **кодовые точки** Unicode (`\"😀a\"` и `\"a\"` отличаются на 1), симметрична и работает для строк в тысячи символов.",
    "`longestIncreasingSubsequence` ищет **строго** возрастающую подпоследовательность за `O(n log n)` и возвращает саму подпоследовательность (она обязана быть подпоследовательностью входа и возрастать).",
    "`knapsack` возвращает оптимальную ценность и **допустимый** набор индексов (по возрастанию, без повторов, суммарный вес не больше вместимости, сумма ценностей равна `value`).",
    "`coinChange` возвращает `0` для суммы 0 и `-1`, если сумму набрать нельзя; обрабатывает суммы до 100 000 без рекурсии.",
    "`classifyGrowth(points)` принимает не менее 4 точек `[n, число операций]` (иначе `TypeError`) и возвращает одну из строк `\"O(1)\"`, `\"O(log n)\"`, `\"O(n)\"`, `\"O(n log n)\"`, `\"O(n^2)\"`, `\"O(n^3)\"`, `\"O(2^n)\"`; точные данные и данные с шумом до ±3 % классифицируются правильно.",
  ],
  constraints: [
    "Только стандартные средства JavaScript; никаких библиотек и `Array.prototype.sort`.",
    "Никакой рекурсии глубиной порядка `n`: динамическое программирование — циклами, слияние — снизу вверх.",
    "Нельзя мутировать аргументы вызывающего (массивы входа).",
    "Скорость доказывается **счётчиками операций**, а не временем: нельзя «подогнать» счётчик, не выполняя сравнений через переданный компаратор.",
    "Не используйте глобальное состояние между вызовами (счётчики — только в переданном `stats`).",
  ],
  expected: [
    "`node check.mjs .` печатает `Пройдено проверок: 40 из 40`.",
    "Число сравнений `mergeSort` на размерах 2⁸…2¹⁵ в `classifyGrowth` даёт `\"O(n log n)\"`, `lowerBound` на 2¹⁰…2²⁰ — `\"O(log n)\"`, `kthSmallest` на 2¹⁰…2¹⁷ — `\"O(n)\"`, сортировка вставками из проверки — `\"O(n^2)\"`.",
    "`coinChange([186, 419, 83, 408], 6249)` равно `20`, `knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7)` — `{ value: 9, items: [1, 2] }`, `editDistance(\"intention\", \"execution\")` — `5`.",
  ],
  technical: [
    "Слияние снизу вверх: ширина блока 1, 2, 4, …; два буфера меняются ролями после каждого прохода. При равенстве берите **левый** элемент — это и есть устойчивость. Число сравнений слияния двух блоков не превосходит суммы их длин минус один, поэтому всего не больше `n·⌈log₂n⌉`.",
    "Двоичный поиск: инвариант «ответ в `[lo, hi]`», `mid = lo + ((hi - lo) >> 1)` (без переполнения), на каждом шаге интервал сокращается вдвое — не больше `⌈log₂(n + 1)⌉` сравнений. `lowerBound` и `upperBound` отличаются одним знаком в сравнении.",
    "Быстрый выбор: разбейте диапазон на `< pivot`, `= pivot`, `> pivot` (флаг голландского флага) и продолжайте только в той части, где лежит `k`. Опорный выбирайте медианой трёх **псевдослучайных** позиций: медиана первого, среднего и последнего ломается на «горном» входе (в замере — порядка тысячи сравнений на элемент).",
    "`editDistance`: `d[i][j] = min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i] !== b[j]))`; достаточно двух строк таблицы. Для кодовых точек разверните строку оператором `[...s]`.",
    "Наибольшая возрастающая подпоследовательность: массив «хвостов» `tails[len]` — наименьший возможный последний элемент подпоследовательности длины `len + 1`; для каждого элемента найдите двоичным поиском первую позицию с `tails[pos] >= x` (для **строгого** возрастания) и запоминайте предшественника.",
    "Рюкзак: таблица `best[i][w]`; восстановление — идите с конца: если `best[i][w] !== best[i-1][w]`, предмет `i-1` взят. Размер таблицы `(n + 1) × (capacity + 1)`.",
    "`classifyGrowth`: для каждой модели `g(n)` (константа, `log n`, `n`, `n log n`, `n²`, `n³`, `2ⁿ`) найдите по методу наименьших квадратов `a` и `b` в `c ≈ a·g(n) + b` и выберите модель с наименьшей **относительной** ошибкой; если наибольшее значение не больше наименьшего более чем на 10 % — `O(1)`. Отношение соседних значений при удвоении `n` одно не различает `n` и `n log n`.",
  ],
  acceptance: [
    "`node check.mjs .` — 40 из 40.",
    "Заготовка проходит 2 из 40 проверок (экспорты и отсутствие встроенной сортировки).",
    "Каждый из двенадцати «плохих» вариантов проваливает не менее одной проверки: от 1 (неустойчивое слияние, мутация входа, первый элемент как опорный, кодовые единицы вместо точек, классификация по наклону) до 3 (встроенная сортировка, `upperBound` как `lowerBound`, жадные монеты).",
    "Нет `Array.prototype.sort`, `toSorted` и рекурсии в динамическом программировании.",
  ],
  hints: [
    "Начните с `lowerBound`: это пять строк, а на нём держатся `upperBound` и `LIS`. Запишите инвариант цикла словами и проверьте его на пустом массиве.",
    "Если `mergeSort` проходит все проверки, кроме устойчивости, посмотрите на знак сравнения при равенстве: `<` берёт левый, `<=` — правый.",
    "Если проверка границы сравнений падает, а результат верный, вы вызываете компаратор лишний раз (например, дважды для одной пары) или не используете двоичный поиск.",
    "Для `kthSmallest` сначала напишите версию с двусторонним разбиением и посмотрите, что делает проверка с массивом из одинаковых значений: именно ради него нужно три части.",
    "Строгая и нестрогая подпоследовательность различаются одним знаком в двоичном поиске по `tails`; проверьте на `[2, 2, 2]`.",
    "В рюкзаке 0/1 цикл по весу сверху вниз (или таблица с отдельными строками) не даёт использовать один предмет дважды; в неограниченном — наоборот.",
    "Если `classifyGrowth` путает `O(n)` и `O(n log n)`, ищите ошибку в свободном члене: модель `a·n log n + b` без `b` на малых `n` ошибается.",
  ],
  advanced: [
    "Добавьте `heapSort` и `introSort` (быстрая сортировка с переходом на кучу при глубине `2·log₂n`) и сравните их числа сравнений с `mergeSort` в `classifyGrowth`.",
    "Реализуйте `medianOfMedians` — детерминированный выбор за `O(n)` в худшем случае — и покажите счётчиком, что он делает больше сравнений в среднем, но не имеет «плохих» входов.",
    "Сделайте `editDistance` с восстановлением последовательности правок (вставка, удаление, замена) и проверьте, что применение правок к `a` даёт `b`.",
    "Реализуйте `knapsack` с памятью `O(capacity)` и восстановлением предметов (алгоритм Хиршберга) и сравните размер таблиц.",
    "Напишите `measure(fn, sizes, makeInput)`, который сам строит точки `[n, операции]` и вызывает `classifyGrowth`, чтобы классифицировать **любую** функцию с `stats`.",
  ],
  failureModes: [
    "**Неустойчивое слияние** (`<=` вместо `<` при выборе): сортировка верна для чисел, но равные по ключу объекты меняются местами; в замере красная 1 проверка из 40 — устойчивость.",
    "**Сортировка меняет исходный массив** (`src = items` вместо копии): вызывающий код получает «побочный эффект»; 1 проверка из 40.",
    "**Встроенная сортировка вместо слияния:** результат верный, но `stats.comparisons` не считает вызовы, а сама функция запрещена; 3 проверки из 40 (запрет, счётчик, классификация роста).",
    "**Граница на единицу меньше** в `lowerBound` (`hi = n − 1`): ответ неверен, когда искомое больше всех элементов; 2 проверки.",
    "**`upperBound` как `lowerBound`** (`< 0` вместо `<= 0`): дубликаты обрабатываются неверно; 3 проверки.",
    "**Первый элемент как опорный** в быстром выборе: отсортированный вход даёт `n²/2` сравнений вместо `O(n)`; 1 проверка из 40 — граница `12·n`.",
    "**Расчёт по кодовым единицам** (`a.split(\"\")`): эмодзи считается двумя символами; 1 проверка.",
    "**Нестрогая возрастающая подпоследовательность:** `[2, 2, 2]` даёт длину 3 вместо 1; 2 проверки.",
    "**Неограниченный рюкзак:** предмет берётся многократно, ценность завышена; 2 проверки.",
    "**Жадные монеты:** для `[1, 3, 4]` и суммы 6 получается 3 монеты вместо 2; 3 проверки.",
    "**Счётчик не увеличивается** в слиянии: `stats.comparisons` не совпадает с числом вызовов, классификация роста не видит `n log n`; 2 проверки.",
    "**Классификация по наклону последних двух точек:** не распознаёт показательный рост (наклон растёт вместе с `n`); 1 проверка.",
  ],
  rubric: [
    { criterion: "Корректность на эталонах", weight: 25, description: "Совпадение со встроенной сортировкой, линейным поиском, перебором подмножеств и рекурсией с запоминанием на случайных входах." },
    { criterion: "Границы числа операций", weight: 25, description: "n·⌈log₂n⌉ для слияния, ⌈log₂(n + 1)⌉ для поиска, 12·n для выбора, n·(⌈log₂n⌉ + 1) для подпоследовательности; счётчик считает ровно вызовы компаратора." },
    { criterion: "Устойчивость и отсутствие побочных эффектов", weight: 15, description: "Устойчивое слияние, новые массивы, неизменный вход, `RangeError` и пограничные случаи (пустые входы, дубликаты, значения за границами)." },
    { criterion: "Динамическое программирование", weight: 15, description: "Левенштейн по кодовым точкам, строгая LIS с восстановлением, рюкзак 0/1 с допустимым набором, монеты без жадности; без рекурсии." },
    { criterion: "Оценка роста", weight: 15, description: "`classifyGrowth` подбирает модель по методу наименьших квадратов с относительной ошибкой, различает `n` и `n log n`, устойчива к шуму." },
    { criterion: "Чистота решения", weight: 5, description: "Понятные имена, инварианты в комментариях, отсутствие дублирования между `lowerBound` и `upperBound`." },
  ],
  solution: [
    p("Эталон — один файл `algos.mjs` (около 130 строк). Он проходит все 40 проверок; заготовка проходит 2 из 40, а каждый из двенадцати намеренно испорченных вариантов — меньше 40."),
    h("algos.mjs"),
    code("js", `// algos.mjs — лаборатория алгоритмов: сортировка, поиск, динамическое программирование и оценка роста по числу операций

const defaultCompare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const count = (stats) => { if (stats) stats.comparisons = (stats.comparisons ?? 0) + 1; };

/** Устойчивая сортировка слиянием снизу вверх. Возвращает новый массив, исходный не меняет. */
export function mergeSort(items, compare = defaultCompare, stats = null) {
  const n = items.length;
  let src = Array.from(items), dst = new Array(n);
  for (let width = 1; width < n; width *= 2) {
    for (let lo = 0; lo < n; lo += 2 * width) {
      const mid = Math.min(lo + width, n), hi = Math.min(lo + 2 * width, n);
      let i = lo, j = mid, k = lo;
      while (i < mid && j < hi) {
        count(stats);
        dst[k++] = compare(src[j], src[i]) < 0 ? src[j++] : src[i++];   // при равенстве берём левый: устойчивость
      }
      while (i < mid) dst[k++] = src[i++];
      while (j < hi) dst[k++] = src[j++];
    }
    [src, dst] = [dst, src];
  }
  return src;
}

/** Первый индекс i, для которого compare(sorted[i], x) >= 0; если такого нет — sorted.length. */
export function lowerBound(sorted, x, compare = defaultCompare, stats = null) {
  let lo = 0, hi = sorted.length;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    count(stats);
    if (compare(sorted[mid], x) < 0) lo = mid + 1; else hi = mid;
  }
  return lo;
}

/** Первый индекс i, для которого compare(sorted[i], x) > 0; если такого нет — sorted.length. */
export function upperBound(sorted, x, compare = defaultCompare, stats = null) {
  let lo = 0, hi = sorted.length;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    count(stats);
    if (compare(sorted[mid], x) <= 0) lo = mid + 1; else hi = mid;
  }
  return lo;
}

/** k-й по величине элемент (k с нуля) без полной сортировки: быстрый выбор с трёхсторонним разбиением и медианой трёх случайных. */
export function kthSmallest(items, k, compare = defaultCompare, stats = null) {
  if (!Number.isInteger(k) || k < 0 || k >= items.length) throw new RangeError(\`k = \${k} вне диапазона 0…\${items.length - 1}\`);
  const a = Array.from(items);
  let lo = 0, hi = a.length - 1, seed = 0x9e3779b9;                    // псевдослучайные позиции опорного элемента: ни один фиксированный вход не хуже остальных
  const pick = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return lo + (seed % (hi - lo + 1)); };
  while (lo < hi) {
    const trio = [a[pick()], a[pick()], a[pick()]];                    // медиана трёх случайных
    const pivot = (() => { count(stats); const ab = compare(trio[0], trio[1]); count(stats); const bc = compare(trio[1], trio[2]); if ((ab <= 0 && bc <= 0) || (ab >= 0 && bc >= 0)) return trio[1]; count(stats); const ac = compare(trio[0], trio[2]); return ab <= 0 ? (ac <= 0 ? trio[2] : trio[0]) : (ac <= 0 ? trio[0] : trio[2]); })();
    let lt = lo, i = lo, gt = hi;                                       // [lo, lt) < pivot, [lt, i) = pivot, (gt, hi] > pivot
    while (i <= gt) {
      count(stats);
      const c = compare(a[i], pivot);
      if (c < 0) { [a[lt], a[i]] = [a[i], a[lt]]; lt++; i++; }
      else if (c > 0) { [a[i], a[gt]] = [a[gt], a[i]]; gt--; }
      else i++;
    }
    if (k < lt) hi = lt - 1; else if (k > gt) lo = gt + 1; else return a[k];
  }
  return a[k];
}

/** Расстояние Левенштейна между строками по кодовым точкам Unicode; память — O(min(длины)). */
export function editDistance(a, b) {
  let s = [...a], t = [...b];
  if (s.length < t.length) [s, t] = [t, s];                           // t — короткая строка
  let prev = Array.from({ length: t.length + 1 }, (_, j) => j);
  for (let i = 1; i <= s.length; i++) {
    const cur = [i];
    for (let j = 1; j <= t.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[t.length];
}

/** Наибольшая строго возрастающая подпоследовательность за O(n log n). Возвращает { length, sequence }. */
export function longestIncreasingSubsequence(items, compare = defaultCompare, stats = null) {
  const tails = [], tailIndex = [], parent = new Array(items.length).fill(-1);
  for (let i = 0; i < items.length; i++) {
    let lo = 0, hi = tails.length;                                    // первая позиция, где tails[pos] >= items[i]
    while (lo < hi) { const mid = (lo + hi) >> 1; count(stats); if (compare(items[tailIndex[mid]], items[i]) < 0) lo = mid + 1; else hi = mid; }
    tails[lo] = items[i]; tailIndex[lo] = i; parent[i] = lo > 0 ? tailIndex[lo - 1] : -1;
  }
  const sequence = [];
  for (let i = tails.length ? tailIndex[tails.length - 1] : -1; i !== -1; i = parent[i]) sequence.push(items[i]);
  return { length: tails.length, sequence: sequence.reverse() };
}

/** Рюкзак 0/1: максимальная ценность и индексы выбранных предметов (по возрастанию). */
export function knapsack(weights, values, capacity) {
  const n = weights.length;
  const best = Array.from({ length: n + 1 }, () => new Float64Array(capacity + 1));
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      best[i][w] = best[i - 1][w];
      if (weights[i - 1] <= w) best[i][w] = Math.max(best[i][w], best[i - 1][w - weights[i - 1]] + values[i - 1]);
    }
  }
  const items = [];
  for (let i = n, w = capacity; i > 0; i--) if (best[i][w] !== best[i - 1][w]) { items.push(i - 1); w -= weights[i - 1]; }
  return { value: best[n][capacity], items: items.reverse() };
}

/** Наименьшее число монет для суммы или -1, если набрать нельзя. */
export function coinChange(coins, amount) {
  const INF = Infinity, dp = new Array(amount + 1).fill(INF);
  dp[0] = 0;
  for (let s = 1; s <= amount; s++) for (const c of coins) if (c <= s && dp[s - c] + 1 < dp[s]) dp[s] = dp[s - c] + 1;
  return dp[amount] === INF ? -1 : dp[amount];
}

/** По точкам [n, число операций] определяет класс роста: подбирает модель c ≈ a·g(n) + b с наименьшей относительной ошибкой. */
export function classifyGrowth(points) {
  if (!Array.isArray(points) || points.length < 4) throw new TypeError("нужно не менее 4 точек [n, операции]");
  const models = { "O(1)": () => 1, "O(log n)": (n) => Math.log2(n), "O(n)": (n) => n, "O(n log n)": (n) => n * Math.log2(n), "O(n^2)": (n) => n * n, "O(n^3)": (n) => n ** 3, "O(2^n)": (n) => 2 ** n };
  const cs = points.map((p) => p[1]);
  if (Math.max(...cs) <= Math.min(...cs) * 1.1) return "O(1)";
  let bestName = null, bestErr = Infinity;
  for (const [name, g] of Object.entries(models)) {
    if (name === "O(1)") continue;
    const xs = points.map((p) => g(p[0])), m = points.length;
    const sx = xs.reduce((s, v) => s + v, 0), sy = cs.reduce((s, v) => s + v, 0);
    const sxx = xs.reduce((s, v) => s + v * v, 0), sxy = xs.reduce((s, v, i) => s + v * cs[i], 0);
    const det = m * sxx - sx * sx;
    if (!Number.isFinite(det) || det === 0) continue;
    const a = (m * sxy - sx * sy) / det, b = (sy - a * sx) / m;
    if (a <= 0) continue;
    const err = xs.reduce((s, v, i) => s + ((cs[i] - (a * v + b)) / cs[i]) ** 2, 0);
    if (err < bestErr) { bestErr = err; bestName = name; }
  }
  return bestName ?? "O(1)";
}`, { filename: "algos.mjs", lineNumbers: true }),
    h("Самопроверка check.mjs"),
    p("Проверки охватывают контракты (экспорты, запрет встроенной сортировки, неизменность входа), эталонное сравнение на случайных входах с фиксированным начальным значением, границы числа сравнений и классификацию роста на точных и зашумлённых данных, а также на **измерениях ваших собственных функций**."),
    code("js", `// Самопроверка проекта «Лаборатория алгоритмов». Запуск: node check.mjs [каталог с algos.mjs]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = path.resolve(process.argv[2] ?? "solution");
const file = path.join(dir, "algos.mjs");
const source = fs.readFileSync(file, "utf8");
const code = source.replace(/\\/\\*[\\s\\S]*?\\*\\//g, "").replace(/(^|[^:])\\/\\/.*$/gm, "$1");     // текст без комментариев
const A = await import(pathToFileURL(file).href);

let total = 0, passed = 0;
function check(name, fn) {
  total++;
  let ok = false, note = "";
  try { const r = fn(); ok = r === true; if (!ok) note = \` (вернуло \${typeof r === "object" ? JSON.stringify(r)?.slice(0, 80) : String(r)})\`; } catch (e) { note = \` (\${e?.name ?? "Error"}: \${String(e?.message ?? e).split("\\n")[0].slice(0, 90)})\`; }
  if (ok) passed++;
  console.log(\`\${ok ? "OK " : "НЕТ"}  \${name}\${ok ? "" : note}\`);
}
const J = JSON.stringify;
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const ri = (n) => Math.floor(rnd() * n);
const seeded = (sd) => { let x = sd >>> 0; return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; };   // отдельный генератор: результат проверки не зависит от предыдущих
const arr = (n, max = 1e6) => Array.from({ length: n }, () => ri(max));
const log2c = (n) => Math.ceil(Math.log2(n));
const throws = (f, K = Error) => { try { f(); return false; } catch (e) { return e instanceof K; } };
const timed = (f) => { const t = performance.now(); const r = f(); return [r, performance.now() - t]; };

// ── Сортировка слиянием ──
check("экспортированы все девять функций", () => ["mergeSort", "lowerBound", "upperBound", "kthSmallest", "editDistance", "longestIncreasingSubsequence", "knapsack", "coinChange", "classifyGrowth"].every((n) => typeof A[n] === "function"));
check("mergeSort не использует встроенную сортировку (Array.prototype.sort / toSorted)", () => !/\\.(sort|toSorted)\\s*\\(/.test(code));
check("mergeSort: числа по возрастанию (включая пустой и одноэлементный массивы)", () => J(A.mergeSort([5, 2, 9, 1, 5, 6])) === "[1,2,5,5,6,9]" && J(A.mergeSort([])) === "[]" && J(A.mergeSort([7])) === "[7]");
check("mergeSort: числа сравниваются как числа (10 > 9), строки — по кодовым единицам", () => J(A.mergeSort([10, 9, 1, 100])) === "[1,9,10,100]" && J(A.mergeSort(["b", "a", "B", "aa"])) === '["B","a","aa","b"]');
check("mergeSort: исходный массив не изменяется, результат — новый массив", () => { const a = [3, 1, 2]; const r = A.mergeSort(a); return J(a) === "[3,1,2]" && r !== a && J(r) === "[1,2,3]"; });
check("mergeSort: пользовательский компаратор (по убыванию, по полю)", () => J(A.mergeSort([1, 3, 2], (a, b) => b - a)) === "[3,2,1]" && J(A.mergeSort([{ k: 2 }, { k: 1 }], (a, b) => a.k - b.k)) === '[{"k":1},{"k":2}]');
check("mergeSort устойчива: равные по ключу элементы сохраняют исходный порядок", () => { const a = Array.from({ length: 500 }, (_, i) => ({ k: ri(5), i })); const r = A.mergeSort(a, (x, y) => x.k - y.k); return r.every((v, j) => j === 0 || r[j - 1].k < v.k || (r[j - 1].k === v.k && r[j - 1].i < v.i)); });
check("mergeSort совпадает со встроенной сортировкой на 100 случайных массивах (с дубликатами и отрицательными)", () => { for (let t = 0; t < 100; t++) { const a = Array.from({ length: ri(60) }, () => ri(41) - 20); if (J(A.mergeSort(a)) !== J([...a].sort((x, y) => x - y))) return false; } return true; });
check("mergeSort: stats.comparisons считает вызовы компаратора и не больше n·⌈log₂n⌉ (n = 1000: случайный, отсортированный, обратный)", () => { for (const a of [arr(1000), Array.from({ length: 1000 }, (_, i) => i), Array.from({ length: 1000 }, (_, i) => 1000 - i)]) { const s = {}; let calls = 0; A.mergeSort(a, (x, y) => { calls++; return x - y; }, s); if (s.comparisons !== calls || calls > 1000 * log2c(1000)) return false; } return true; });
check("mergeSort: 200 000 элементов быстрее 2 секунд (без рекурсии глубиной в n)", () => { const [r, ms] = timed(() => A.mergeSort(arr(200000))); return r.length === 200000 && r[0] <= r[1] && ms < 2000; });

// ── Двоичный поиск ──
const refLower = (a, x) => { let i = 0; while (i < a.length && a[i] < x) i++; return i; };
const refUpper = (a, x) => { let i = 0; while (i < a.length && a[i] <= x) i++; return i; };
check("lowerBound/upperBound: примеры с дубликатами", () => { const a = [1, 2, 2, 2, 5, 7]; return A.lowerBound(a, 2) === 1 && A.upperBound(a, 2) === 4 && A.lowerBound(a, 3) === 4 && A.upperBound(a, 3) === 4; });
check("lowerBound/upperBound: пустой массив, значение меньше всех, больше всех", () => A.lowerBound([], 1) === 0 && A.upperBound([], 1) === 0 && A.lowerBound([5, 6], 1) === 0 && A.upperBound([5, 6], 9) === 2 && A.lowerBound([5, 6], 9) === 2);
check("lowerBound/upperBound совпадают с линейным поиском на 300 случайных массивах", () => { for (let t = 0; t < 300; t++) { const a = arr(ri(40), 15).sort((p, q) => p - q), x = ri(17) - 1; if (A.lowerBound(a, x) !== refLower(a, x) || A.upperBound(a, x) !== refUpper(a, x)) return false; } return true; });
check("lowerBound: не больше ⌈log₂(n + 1)⌉ сравнений на миллионе элементов (любое искомое)", () => { const a = Array.from({ length: 1_000_000 }, (_, i) => i * 2); for (const x of [-1, 0, 1, 777_777, 1_999_998, 3_000_000]) { const s = {}; A.lowerBound(a, x, undefined, s); if (!(s.comparisons <= log2c(a.length + 1))) return false; } return true; });
check("upperBound: компаратор по полю и счётчик сравнений", () => { const a = [{ k: 1 }, { k: 3 }, { k: 3 }, { k: 8 }]; const s = {}; return A.upperBound(a, { k: 3 }, (p, q) => p.k - q.k, s) === 3 && s.comparisons > 0 && s.comparisons <= 3; });

// ── k-й элемент ──
check("kthSmallest: совпадает с отсортированным массивом (200 случайных k)", () => { for (let t = 0; t < 200; t++) { const a = arr(1 + ri(60), 25), k = ri(a.length); if (A.kthSmallest(a, k) !== [...a].sort((p, q) => p - q)[k]) return false; } return true; });
check("kthSmallest: исходный массив не изменяется; k вне диапазона → RangeError", () => { const a = [3, 1, 2]; A.kthSmallest(a, 1); return J(a) === "[3,1,2]" && throws(() => A.kthSmallest([1, 2], 2), RangeError) && throws(() => A.kthSmallest([1, 2], -1), RangeError) && throws(() => A.kthSmallest([], 0), RangeError);});
check("kthSmallest: не более 12·n сравнений на 50 000 элементов (случайные, отсортированные, обратные, одинаковые, «орган»)", () => { const n = 50000, inputs = [arr(n), Array.from({ length: n }, (_, i) => i), Array.from({ length: n }, (_, i) => n - i), new Array(n).fill(7), Array.from({ length: n }, (_, i) => (i < n / 2 ? i : n - i))]; for (const a of inputs) { const s = {}; const v = A.kthSmallest(a, n >> 1, undefined, s); if (!(s.comparisons <= 12 * n) || typeof v !== "number") return false; } return true; });

// ── Динамическое программирование ──
check("editDistance: известные пары (kitten/sitting = 3, intention/execution = 5, flaw/lawn = 2)", () => A.editDistance("kitten", "sitting") === 3 && A.editDistance("intention", "execution") === 5 && A.editDistance("flaw", "lawn") === 2);
check("editDistance: пустые строки, равные строки", () => A.editDistance("", "") === 0 && A.editDistance("", "abc") === 3 && A.editDistance("abc", "") === 3 && A.editDistance("abc", "abc") === 0);
check("editDistance: считает кодовые точки Unicode (😀 — один символ)", () => A.editDistance("😀a", "a") === 1 && A.editDistance("😀", "😁") === 1 && A.editDistance("a😀b", "a😀b") === 0);
const refEdit = (a, b) => { const m = new Map(); const f = (i, j) => { const k = i * 100 + j; if (m.has(k)) return m.get(k); const r = i === a.length ? b.length - j : j === b.length ? a.length - i : a[i] === b[j] ? f(i + 1, j + 1) : 1 + Math.min(f(i + 1, j), f(i, j + 1), f(i + 1, j + 1)); m.set(k, r); return r; }; return f(0, 0); };
check("editDistance совпадает с эталоном на 150 случайных парах и симметрична", () => { const word = () => Array.from({ length: ri(9) }, () => "abc"[ri(3)]).join(""); for (let t = 0; t < 150; t++) { const a = word(), b = word(); if (A.editDistance(a, b) !== refEdit(a, b) || A.editDistance(a, b) !== A.editDistance(b, a)) return false; } return true; });
check("editDistance: две строки по 2000 символов быстрее 2 секунд", () => { const w = (n) => Array.from({ length: n }, () => "abcd"[ri(4)]).join(""); const [d, ms] = timed(() => A.editDistance(w(2000), w(2000))); return d > 0 && d <= 2000 && ms < 2000; });
const refLis = (a) => { const d = a.map(() => 1); for (let i = 0; i < a.length; i++) for (let j = 0; j < i; j++) if (a[j] < a[i]) d[i] = Math.max(d[i], d[j] + 1); return Math.max(0, ...d); };
const isIncSub = (seq, a) => { let p = 0; for (const x of a) if (p < seq.length && x === seq[p]) p++; return p === seq.length && seq.every((v, i) => i === 0 || seq[i - 1] < v); };
check("longestIncreasingSubsequence: пример [10, 9, 2, 5, 3, 7, 101, 18] → длина 4", () => { const r = A.longestIncreasingSubsequence([10, 9, 2, 5, 3, 7, 101, 18]); return r.length === 4 && r.sequence.length === 4 && isIncSub(r.sequence, [10, 9, 2, 5, 3, 7, 101, 18]); });
check("longestIncreasingSubsequence: строго возрастающая (равные не считаются), пустой массив", () => A.longestIncreasingSubsequence([2, 2, 2]).length === 1 && A.longestIncreasingSubsequence([]).length === 0 && J(A.longestIncreasingSubsequence([]).sequence) === "[]");
check("longestIncreasingSubsequence: длина и подпоследовательность верны на 150 случайных массивах", () => { for (let t = 0; t < 150; t++) { const a = arr(ri(30), 20), r = A.longestIncreasingSubsequence(a); if (r.length !== refLis(a) || r.sequence.length !== r.length || !isIncSub(r.sequence, a)) return false; } return true; });
check("longestIncreasingSubsequence: 200 000 элементов быстрее 2 секунд, не более n·(⌈log₂n⌉ + 1) сравнений", () => { const n = 200000, a = arr(n), s = {}; const [r, ms] = timed(() => A.longestIncreasingSubsequence(a, undefined, s)); return r.length > 100 && ms < 2000 && s.comparisons <= n * (log2c(n) + 1); });
const brute = (w, v, cap) => { let best = 0; for (let m = 0; m < 1 << w.length; m++) { let sw = 0, sv = 0; for (let i = 0; i < w.length; i++) if (m >> i & 1) { sw += w[i]; sv += v[i]; } if (sw <= cap && sv > best) best = sv; } return best; };
check("knapsack: классический пример (веса 1, 3, 4, 5; ценности 1, 4, 5, 7; вместимость 7 → 9, предметы 1 и 2)", () => { const r = A.knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7); return r.value === 9 && J(r.items) === "[1,2]"; });
check("knapsack: нулевая вместимость, предмет тяжелее вместимости, пустой набор", () => A.knapsack([5], [10], 0).value === 0 && A.knapsack([5], [10], 4).value === 0 && J(A.knapsack([5], [10], 4).items) === "[]" && A.knapsack([], [], 10).value === 0);
check("knapsack: оптимум совпадает с перебором подмножеств на 100 случайных наборах; выбранные предметы допустимы", () => { for (let t = 0; t < 100; t++) { const n = 1 + ri(9), w = Array.from({ length: n }, () => 1 + ri(10)), v = Array.from({ length: n }, () => ri(30)), cap = ri(30), r = A.knapsack(w, v, cap); const sw = r.items.reduce((s, i) => s + w[i], 0), sv = r.items.reduce((s, i) => s + v[i], 0); if (r.value !== brute(w, v, cap) || sw > cap || sv !== r.value || new Set(r.items).size !== r.items.length) return false; } return true; });
check("coinChange: известные случаи ([1,2,5], 11 → 3; [2], 3 → -1; сумма 0; [1,3,4], 6 → 2 — жадность не работает)", () => A.coinChange([1, 2, 5], 11) === 3 && A.coinChange([2], 3) === -1 && A.coinChange([1], 0) === 0 && A.coinChange([1, 3, 4], 6) === 2);
check("coinChange: [186, 419, 83, 408], 6249 → 20", () => A.coinChange([186, 419, 83, 408], 6249) === 20);
check("coinChange: сумма 100 000 и 5 номиналов быстрее секунды", () => { const [r, ms] = timed(() => A.coinChange([1, 5, 10, 25, 50], 100000)); return r === 2000 && ms < 1000; });

// ── Классификация роста ──
const model = { "O(1)": () => 7, "O(log n)": (n) => 3 * Math.log2(n) + 4, "O(n)": (n) => 5 * n + 11, "O(n log n)": (n) => 2 * n * Math.log2(n) + 3 * n, "O(n^2)": (n) => n * n / 2 + 40, "O(n^3)": (n) => n ** 3 / 3 + 9 * n };
check("classifyGrowth: точные последовательности O(1), O(log n), O(n), O(n log n), O(n²), O(n³)", () => Object.entries(model).every(([name, f]) => A.classifyGrowth([16, 32, 64, 128, 256, 512, 1024].map((n) => [n, f(n)])) === name));
check("classifyGrowth: экспоненциальный рост O(2^n) на размерах 10…20", () => A.classifyGrowth(Array.from({ length: 11 }, (_, i) => [10 + i, 3 * 2 ** (10 + i) + 5])) === "O(2^n)");
check("classifyGrowth: шум ±3 % не меняет ответ", () => { for (const [name, f] of Object.entries(model)) { const pts = [64, 128, 256, 512, 1024, 2048, 4096].map((n) => [n, f(n) * (1 + (rnd() - 0.5) * 0.06)]); if (A.classifyGrowth(pts) !== name) return false; } return true; });
check("classifyGrowth: меньше 4 точек → TypeError", () => throws(() => A.classifyGrowth([[1, 1], [2, 2], [4, 4]]), TypeError));
const meanComparisons = (run, n, runs, sd) => { const r = seeded(sd); let sum = 0; for (let t = 0; t < runs; t++) { const s = {}; run(Array.from({ length: n }, () => Math.floor(r() * 1e6)), s); sum += s.comparisons; } return sum / runs; };
check("число сравнений mergeSort на размерах 2⁸…2¹⁵ классифицируется как O(n log n)", () => A.classifyGrowth([...Array(8)].map((_, i) => { const n = 2 ** (8 + i); return [n, meanComparisons((a, s) => A.mergeSort(a, undefined, s), n, 3, 100 + i)]; })) === "O(n log n)");
check("число сравнений lowerBound на размерах 2¹⁰…2²⁰ — O(log n); kthSmallest (среднее по 8 входам) на 2¹⁰…2¹⁷ — O(n)", () => { const p1 = [10, 12, 14, 16, 18, 20].map((e) => { const n = 2 ** e, a = Array.from({ length: n }, (_, i) => i), s = {}; A.lowerBound(a, n / 3, undefined, s); return [n, s.comparisons]; }); const p2 = [10, 11, 12, 13, 14, 15, 16, 17].map((e, i) => { const n = 2 ** e; return [n, meanComparisons((a, s) => A.kthSmallest(a, n >> 1, undefined, s), n, 8, 500 + i)]; }); return A.classifyGrowth(p1) === "O(log n)" && A.classifyGrowth(p2) === "O(n)"; });
check("число сравнений сортировки вставками (из проверки) на размерах 100…800 — O(n²)", () => { const insertion = (a) => { let c = 0; a = [...a]; for (let i = 1; i < a.length; i++) { const x = a[i]; let j = i - 1; while (j >= 0) { c++; if (a[j] > x) { a[j + 1] = a[j]; j--; } else break; } a[j + 1] = x; } return c; }; const r = seeded(9); return A.classifyGrowth([100, 200, 400, 800, 1600].map((n) => [n, insertion(Array.from({ length: n }, () => r()))])) === "O(n^2)"; });

console.log(\`\\nПройдено проверок: \${passed} из \${total}\`);
process.exitCode = passed === total ? 0 : 1;`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 40 из 40`, { filename: "результат node check.mjs solution (Node.js 22.22.0)" }),
    code("text", `Пройдено проверок: 2 из 40`, { filename: "результат node check.mjs starter (заготовка)" }),
    h("Проверка самой проверки: «плохие» варианты"),
    code("text", `b01-unstable-merge: Пройдено проверок: 39 из 40
b02-mutates-input: Пройдено проверок: 39 из 40
b03-builtin-sort: Пройдено проверок: 37 из 40
b04-lower-bound-off-by-one: Пройдено проверок: 38 из 40
b05-upper-bound-is-lower: Пройдено проверок: 37 из 40
b06-first-pivot: Пройдено проверок: 39 из 40
b07-edit-code-units: Пройдено проверок: 39 из 40
b08-lis-non-strict: Пройдено проверок: 38 из 40
b09-knapsack-unbounded: Пройдено проверок: 38 из 40
b10-greedy-coins: Пройдено проверок: 37 из 40
b11-count-nothing: Пройдено проверок: 38 из 40
b12-classify-by-slope: Пройдено проверок: 39 из 40`, { filename: "результат check.mjs для вариантов с ошибками (из 40)" }),
    warn("Секундомер врёт: время зависит от процессора, нагрузки, прогрева движка и сборщика мусора. Если вы доказываете скорость временем, результат нельзя воспроизвести. Число сравнений, шагов или обращений к памяти — воспроизводимо, и именно оно связывает код с теорией `O(·)`."),
    tip("Когда проверка границы сравнений падает, не увеличивайте допуск. Выведите `stats.comparisons / n` для нескольких размеров: если отношение растёт — алгоритм не того класса, если постоянно — вы теряете константу (лишнее сравнение, нерациональное разбиение)."),
  ],
};
