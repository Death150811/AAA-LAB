import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  note,
  tip,
  insight,
  table,
  def,
  wrongRight,
  beforeAfter,
  annotated,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const arrays: Topic = {
  id: "js.arrays",
  slug: "arrays",
  domain: "js",
  module: "collections",
  title: "Массивы",
  titleEn: "Arrays",
  summary:
    "Массив — упорядоченный объект с числовыми индексами и свойством `length`. Тема на замерах в Node.js 22 и Chromium 141 разбирает создание (в том числе ловушки `Array(3)` и `fill([])`), `length` и «дыры», методы, которые изменяют массив (`push`, `splice`, `sort`, `reverse`, `fill`) и которые возвращают копию (`slice`, `concat`, `map`, `filter`, `toSorted`, `toSpliced`, `toReversed`, `with`), поиск (`indexOf`, `includes` и `NaN`, `find`, `findLast`, `some`, `every`), сортировку (строковое сравнение по умолчанию, устойчивость, `localeCompare`), `Array.from` для итерируемых и array-подобных объектов, деструктуризацию, spread, изменение массива во время обхода и бинарный поиск.",
  minutes: 75,
  prerequisites: ["js.higher-order-recursion", "js.objects-properties"],
  tags: ["array", "length", "sparse array", "splice", "slice", "sort", "toSorted", "includes", "Array.from", "spread", "destructuring", "flat", "binary search", "immutable", "holes"],
  keyConcepts: [
    { term: "Массив — это объект", text: "`typeof [] === \"object\"`, проверка — `Array.isArray`. Индексы — ключи-строки, `length` вычисляется: `arr.extra = …` не меняет длину (`['0', '1', '2', 'extra']`, длина `3`)." },
    { term: "Изменяющие и копирующие методы", text: "`push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill` меняют массив; `slice`, `concat`, `map`, `filter`, `flat`, `toSorted`, `toReversed`, `toSpliced`, `with` возвращают новый. `sort()` возвращает **тот же** массив (`sorted === c` — `true`)." },
    { term: "Дыры — это не `undefined`", text: "`[1, , 3]` и `delete arr[1]` создают пропуск: индекс отсутствует (`1 in holes` — `false`), `forEach` и `map` его пропускают, а `for…of` и spread видят `undefined`; в JSON дыра становится `null`." },
    { term: "`fill` копирует ссылку, а не объект", text: "`Array(3).fill([])` создаёт три ссылки на один массив: `grid[0] === grid[1]`. Нужен `Array.from({ length: 3 }, () => [])`." },
    { term: "Не меняйте массив, по которому идёте", text: "`splice` внутри `for…of` сдвигает индексы: из `[1, 2, 3, 4]` при удалении `2` цикл пропустил `3` (замер: `1 2 4`)." },
  ],
  sections: [
    section("definition", [
      def("Массив", "Упорядоченная коллекция значений с доступом по целочисленному индексу, начиная с `0`. В JavaScript — объект со специальным свойством `length`; элементы могут быть любого типа.", "array"),
      def("Индекс и `length`", "Индекс — позиция элемента (`0 … length − 1`). `length` — число, на единицу большее максимального индекса; его можно записывать: уменьшение обрезает массив, увеличение создаёт дыры.", "index / length"),
      def("Дыра (пустой слот)", "Отсутствующий индекс в массиве (`[1, , 3]`). Отличается от элемента со значением `undefined`.", "hole / sparse array"),
      def("Изменяющий метод", "Метод, меняющий массив на месте: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`.", "mutating method"),
      def("Копирующий метод", "Метод, возвращающий новый массив и не меняющий исходный: `slice`, `concat`, `map`, `filter`, `flat`, `toSorted`, `toReversed`, `toSpliced`, `with`.", "non-mutating method"),
      def("Array-подобный объект", "Объект с числовыми ключами и `length` (например, `arguments`, `NodeList`), но без методов массива; превращается в массив через `Array.from`.", "array-like"),
      def("Итерируемый объект", "Объект с методом `Symbol.iterator`: массив, строка, `Set`, `Map`; работает с `for…of`, spread, `Array.from`.", "iterable"),
      def("Устойчивая сортировка", "Сортировка, сохраняющая относительный порядок равных элементов; в JavaScript это гарантируется стандартом.", "stable sort"),
    ]),

    section("why", [
      h("Самая используемая структура данных"),
      p("Списки товаров, строки таблицы, ответы API, очередь задач, история действий — почти любые данные приложения лежат в массивах, а работа с ними — это преобразование массивов. Большинство ошибок здесь проявляются как «список пропал или изменился неожиданно», «сортировка выдаёт странный порядок», «в таблице все строки одинаковые», «элемент остался после удаления»."),
      ul(
        "**Правильный выбор метода:** знать, какой метод меняет массив, а какой — нет, определяет, будут ли обновления предсказуемыми (особенно в интерфейсах).",
        "**Сортировка и поиск:** строковое сравнение по умолчанию, `NaN`, объекты по ссылке и устойчивость — типичные вопросы собеседований и источники багов.",
        "**Копирование:** поверхностная копия и общие вложенные объекты — причина «призрачных» изменений.",
        "**Основа алгоритмов:** бинарный поиск, двухуказательные приёмы, скользящее окно — все строятся на индексах массива.",
      ),
      insight("Массив в JavaScript — не «блок памяти из C», а **объект с индексами-ключами**. Это даёт гибкость (дыры, свойства, `length`), но требует дисциплины: проверяйте `Array.isArray`, избегайте дыр, различайте изменяющие и копирующие методы."),
    ]),

    section("mental-model", [
      p("Представьте **ряд пронумерованных ячеек** в камере хранения. Номера идут с нуля; на табличке написано, сколько ячеек в ряду (`length`). Вы можете **заменить содержимое** ячейки, **добавить** ячейку в конец или **убрать** ячейку, сдвинув остальные (`splice`). Есть методы, которые меняют ряд на месте (**изменяющие**), и методы, которые **фотографируют** ряд и выдают новый (**копирующие**). «Дыра» — ячейка, которой нет вовсе (дверца отсутствует), а не ячейка с надписью «пусто» (`undefined`). Наконец, в ячейках лежат **ссылки на вещи**: копия ряда (`[...a]`) — это новый ряд с теми же ссылками, поэтому вещь, изменённая через копию, изменится и в оригинале."),
      table(
        ["Задача", "Изменяет массив", "Не изменяет (копия)"],
        [
          ["Добавить в конец / начало", "`push` / `unshift`", "`[...a, x]` / `[x, ...a]`, `concat`"],
          ["Убрать с конца / начала", "`pop` / `shift`", "`slice(0, -1)` / `slice(1)`"],
          ["Вставить / удалить / заменить в позиции", "`splice`", "`toSpliced`, `with`, `filter`"],
          ["Упорядочить", "`sort`, `reverse`", "`toSorted`, `toReversed`"],
          ["Преобразовать / отобрать", "—", "`map`, `filter`, `flat`, `flatMap`"],
          ["Взять часть", "—", "`slice`, `at`"],
        ],
        "Изменяющие и копирующие операции",
      ),
    ]),

    section("technical", [
      h("Создание, `length`, дыры"),
      code("js", `const fruits = ["яблоко", "груша", "слива"];
console.log(fruits.length, fruits[0], fruits[fruits.length - 1], fruits.at(-1), fruits[10], fruits.at(10));
console.log(typeof fruits, Array.isArray(fruits), Array.isArray({ length: 0 }), Object.keys(fruits));

// массив — объект: индексы — ключи-строки, length вычисляется
fruits.extra = "не элемент";
console.log(fruits.length, Object.keys(fruits));
delete fruits.extra;

// length можно менять
const nums = [1, 2, 3, 4, 5];
nums.length = 2;
console.log(nums);
nums.length = 4;
console.log(nums, nums.length, 3 in nums);                  // создались пропуски (дыры)

// запись за границей создаёт дыру
const sparse = [1, 2];
sparse[5] = 6;
console.log(sparse, sparse.length, Object.keys(sparse));

// дыры и методы
const holes = [1, , 3];
const visited = [];
holes.forEach((v) => visited.push(v));
console.log(visited, holes.map((v) => v * 2), [...holes], JSON.stringify(holes), 1 in holes);

// delete оставляет дыру, длина не меняется
const d = [10, 20, 30];
delete d[1];
console.log(d, d.length);

// создание массивов
console.log(Array(3), Array.from({ length: 3 }), Array.from({ length: 3 }, (_, i) => i * i), Array.of(3), new Array(3).fill(0));
try { new Array(-1); } catch (e) { console.log(e.name + ": " + e.message); }

// fill ссылкой: одни и те же объекты
const grid = Array(3).fill([]);
grid[0].push("x");
console.log(grid, grid[0] === grid[1]);
const okGrid = Array.from({ length: 3 }, () => []);
okGrid[0].push("x");
console.log(okGrid);

// очистка массива
const big = [1, 2, 3];
const alias = big;
big.length = 0;
console.log(alias, big === alias);`, { filename: "a1-basics.mjs", lineNumbers: true }),
      code("text", `3 яблоко слива слива undefined undefined
object true false [ '0', '1', '2' ]
3 [ '0', '1', '2', 'extra' ]
[ 1, 2 ]
[ 1, 2, <2 empty items> ] 4 false
[ 1, 2, <3 empty items>, 6 ] 6 [ '0', '1', '5' ]
[ 1, 3 ] [ 2, <1 empty item>, 6 ] [ 1, undefined, 3 ] [1,null,3] false
[ 10, <1 empty item>, 30 ] 3
[ <3 empty items> ] [ undefined, undefined, undefined ] [ 0, 1, 4 ] [ 3 ] [ 0, 0, 0 ]
RangeError: Invalid array length
[ [ 'x' ], [ 'x' ], [ 'x' ] ] true
[ [ 'x' ], [], [] ]
[] true`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Доступ:** `fruits[0]` — первый, `fruits[fruits.length - 1]` — последний; `at(-1)` — последний короче. Выход за границы даёт `undefined`, а не ошибку.",
        "**Объект:** `typeof` — `object`, `Array.isArray(fruits)` — `true`, а `Array.isArray({ length: 0 })` — `false`. Добавленное свойство `extra` попало в `Object.keys`, но длину не изменило.",
        "**Запись в `length`:** `nums.length = 2` обрезала массив до `[1, 2]`, а `nums.length = 4` вернула длину, но создала **дыры** (`<2 empty items>`, `3 in nums` — `false`; удалённые значения не вернулись).",
        "**Запись за границей** `sparse[5] = 6` создала три дыры и длину `6` (`Object.keys` — `['0', '1', '5']`).",
        "**Дыры и методы:** `forEach` пропустил дыру (`[1, 3]`), `map` сохранил её (`[2, <1 empty item>, 6]`), spread превратил в `undefined`, `JSON.stringify` — в `null`.",
        "**`delete arr[1]`** оставляет дыру и не меняет `length`; убирать элемент нужно через `splice` или `filter`.",
        "**Создание:** `Array(3)` — три дыры; `Array.from({ length: 3 })` — три `undefined`; `Array.from({ length: 3 }, (_, i) => i * i)` — `[0, 1, 4]`; `Array.of(3)` — `[3]`, тогда как `Array(3)` — массив длины 3. `new Array(-1)` — `RangeError: Invalid array length`.",
        "**Ловушка `fill`:** `Array(3).fill([])` — три ссылки на один массив (`grid[0] === grid[1]`); `Array.from({ length: 3 }, () => [])` — три разных.",
        "**Очистка:** `big.length = 0` опустошает **тот же** массив (`alias` тоже пуст), а `big = []` создала бы новый.",
      ),

      h("Изменяющие и копирующие методы"),
      code("js", `// Изменяющие методы: меняют массив на месте и возвращают разные вещи
const a = [1, 2, 3];
console.log("push →", a.push(4, 5), a);              // возвращает новую длину
console.log("pop →", a.pop(), a);                     // удалённый элемент
console.log("unshift →", a.unshift(0), a);            // новая длина
console.log("shift →", a.shift(), a);                 // удалённый элемент

const b = [1, 2, 3, 4, 5];
console.log("splice(1, 2) →", b.splice(1, 2), b);                 // удаляет и возвращает удалённые
console.log("splice(1, 0, 'a', 'b') →", b.splice(1, 0, "a", "b"), b);   // вставка
console.log("splice(-1, 1, 'z') →", b.splice(-1, 1, "z"), b);     // замена с конца

const c = [3, 1, 2];
const sorted = c.sort();
console.log("sort возвращает тот же массив:", sorted === c, c);
console.log("reverse:", c.reverse(), c);
console.log("fill:", [1, 2, 3, 4].fill(0, 1, 3));

// Копирующие методы: исходный массив не меняется
const src = [3, 1, 2, 1];
console.log("toSorted:", src.toSorted(), "toReversed:", src.toReversed(), "with:", src.with(0, 99), "toSpliced:", src.toSpliced(1, 2), "→ исходный:", src);
console.log("slice:", src.slice(1, 3), src.slice(-2), src.slice(), "concat:", JSON.stringify(src.concat([9], 8, [[7]])));
console.log("map/filter не меняют:", src.map((x) => x * 2), src.filter((x) => x > 1), src);
console.log("flat:", [1, [2, [3, [4]]]].flat(), [1, [2, [3, [4]]]].flat(Infinity));

// копирование массива поверхностное
const objs = [{ n: 1 }];
const copy = [...objs];
copy[0].n = 2;
console.log(objs, objs[0] === copy[0], objs === copy);

// удаление элемента без мутации
const arr = [10, 20, 30, 40];
const without = arr.filter((_, i) => i !== 1);
const inserted = [...arr.slice(0, 2), 25, ...arr.slice(2)];
console.log(without, inserted, arr);`, { filename: "a2-mutation.mjs", lineNumbers: true }),
      code("text", `push → 5 [ 1, 2, 3, 4, 5 ]
pop → 5 [ 1, 2, 3, 4 ]
unshift → 5 [ 0, 1, 2, 3, 4 ]
shift → 0 [ 1, 2, 3, 4 ]
splice(1, 2) → [ 2, 3 ] [ 1, 4, 5 ]
splice(1, 0, 'a', 'b') → [] [ 1, 'a', 'b', 4, 5 ]
splice(-1, 1, 'z') → [ 5 ] [ 1, 'a', 'b', 4, 'z' ]
sort возвращает тот же массив: true [ 1, 2, 3 ]
reverse: [ 3, 2, 1 ] [ 3, 2, 1 ]
fill: [ 1, 0, 0, 4 ]
toSorted: [ 1, 1, 2, 3 ] toReversed: [ 1, 2, 1, 3 ] with: [ 99, 1, 2, 1 ] toSpliced: [ 3, 1 ] → исходный: [ 3, 1, 2, 1 ]
slice: [ 1, 2 ] [ 2, 1 ] [ 3, 1, 2, 1 ] concat: [3,1,2,1,9,8,[7]]
map/filter не меняют: [ 6, 2, 4, 2 ] [ 3, 2 ] [ 3, 1, 2, 1 ]
flat: [ 1, 2, [ 3, [ 4 ] ] ] [ 1, 2, 3, 4 ]
[ { n: 2 } ] true false
[ 10, 30, 40 ] [ 10, 20, 25, 30, 40 ] [ 10, 20, 30, 40 ]`, { filename: "вывод Node.js 22.22.0" }),
      table(
        ["Метод", "Что делает", "Что возвращает"],
        [
          ["`push(...x)` / `unshift(...x)`", "Добавляет в конец / начало", "Новую длину (`5`)"],
          ["`pop()` / `shift()`", "Убирает последний / первый", "Убранный элемент"],
          ["`splice(start, count, ...items)`", "Удаляет `count` элементов с `start` и вставляет `items`", "Массив удалённых"],
          ["`sort(cmp)` / `reverse()`", "Упорядочивает / разворачивает на месте", "Тот же массив"],
          ["`fill(v, from, to)`", "Заполняет диапазон значением", "Тот же массив"],
          ["`slice(from, to)`", "Копия части (отрицательные индексы — от конца)", "Новый массив"],
          ["`concat(...x)`", "Склейка; массивы-аргументы разворачивает на один уровень", "Новый массив"],
          ["`toSorted`, `toReversed`, `toSpliced`, `with(i, v)`", "Копирующие версии изменяющих методов", "Новый массив"],
        ],
        "Методы массива и их результаты",
      ),
      ul(
        "**`splice` в трёх формах:** `splice(1, 2)` — удаление (вернул `[2, 3]`), `splice(1, 0, 'a', 'b')` — вставка (вернул `[]`), `splice(-1, 1, 'z')` — замена с конца.",
        "**Копирующие методы** (`toSorted`, `toReversed`, `with`, `toSpliced`) оставили исходный `[3, 1, 2, 1]` без изменений; `with(0, 99)` вернул копию с заменой.",
        "**`concat` разворачивает один уровень:** `[3, 1, 2, 1].concat([9], 8, [[7]])` → `[3, 1, 2, 1, 9, 8, [7]]`.",
        "**Копия поверхностная:** `[...objs]` создала новый массив, но `copy[0] === objs[0]` — объект общий (`n` стало `2` и в оригинале).",
        "**Удаление и вставка без мутации:** `filter((_, i) => i !== 1)` и `[...arr.slice(0, 2), 25, ...arr.slice(2)]`.",
      ),

      h("Поиск и сортировка"),
      code("js", `const items = [5, 12, NaN, 8, 12, 130];
console.log(items.indexOf(12), items.lastIndexOf(12), items.indexOf(NaN), items.includes(NaN), items.includes(130));
console.log(items.find((x) => x > 10), items.findLast((x) => x > 10), items.findIndex((x) => x > 10), items.findLastIndex((x) => x > 10), items.find((x) => x > 1000));

// сравнение значений: объекты по ссылке
const people = [{ id: 1 }, { id: 2 }];
console.log(people.includes({ id: 1 }), people.some((p) => p.id === 1), people.indexOf(people[1]));

// пустые массивы
console.log([].some((x) => x), [].every((x) => x), [].find((x) => x), [].reduce((a, b) => a + b, "пусто"));

// сортировка
console.log([10, 9, 1, 100].sort(), [10, 9, 1, 100].sort((a, b) => a - b), ["б", "а", "ё", "е", "Я", "я"].sort());
console.log(["б", "а", "ё", "е", "Я", "я"].sort((a, b) => a.localeCompare(b, "ru")));
const people2 = [{ n: "Вера", age: 30 }, { n: "Аня", age: 25 }, { n: "Борис", age: 30 }, { n: "Глеб", age: 25 }];
console.log(people2.toSorted((a, b) => a.age - b.age).map((p) => p.n).join(", "));    // устойчивая сортировка
console.log([3, undefined, 1, , 2].sort());

// join / split
console.log([1, [2, 3], null, undefined, "x"].join("-"), "a,b,,c".split(","), "abc".split(""), [..."привет"].reverse().join(""));

// сумма, максимум
const nums = [4, 9, 2];
console.log(Math.max(...nums), Math.min(...nums), nums.reduce((a, b) => a + b, 0), Math.max());`, { filename: "a3-search.mjs", lineNumbers: true }),
      code("text", `1 4 -1 true true
12 130 1 5 undefined
false true 1
false true undefined пусто
[ 1, 10, 100, 9 ] [ 1, 9, 10, 100 ] [ 'Я', 'а', 'б', 'е', 'я', 'ё' ]
[ 'а', 'б', 'е', 'ё', 'я', 'Я' ]
Аня, Глеб, Вера, Борис
[ 1, 2, 3, undefined, <1 empty item> ]
1-2,3---x [ 'a', 'b', '', 'c' ] [ 'a', 'b', 'c' ] тевирп
9 2 15 -Infinity`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**`indexOf` и `includes` и `NaN`:** `indexOf(NaN)` — `-1`, `includes(NaN)` — `true` (`includes` сравнивает как `SameValueZero`).",
        "**`find`/`findLast`/`findIndex`/`findLastIndex`** ищут по условию (`12`, `130`, `1`, `5`); отсутствие — `undefined` или `-1`.",
        "**Объекты — по ссылке:** `people.includes({ id: 1 })` — `false`, нужен `some((p) => p.id === 1)`.",
        "**Пустой массив:** `some` — `false`, `every` — `true` (пустая истина), `find` — `undefined`, `reduce` с начальным значением возвращает его.",
        "**Сортировка по умолчанию — строковая:** `[10, 9, 1, 100].sort()` → `[1, 10, 100, 9]`. Для чисел — `(a, b) => a - b`. Русские буквы по кодовым единицам: `ё` (U+0451) оказалась после `я`, а `Я` — перед `а`; для человеческого порядка — `localeCompare(b, \"ru\")` (`а, б, е, ё, я, Я`).",
        "**Устойчивость:** при сортировке по возрасту равные элементы сохранили исходный порядок (`Аня, Глеб, Вера, Борис`).",
        "**`undefined` и дыры** при сортировке уходят в конец без вызова функции сравнения (`[1, 2, 3, undefined, <1 empty item>]`).",
        "**`join`/`split`:** `join` превращает `null` и `undefined` в пустую строку (`1-2,3---x`); `\"a,b,,c\".split(\",\")` сохраняет пустую часть; `[...\"привет\"].reverse().join(\"\")` разворачивает строку по кодовым точкам.",
        "**`Math.max(...nums)`** принимает числа аргументами; `Math.max()` без аргументов — `-Infinity`. Для очень длинных массивов spread в аргументы исчерпывает стек: в замере (Node.js 22.22.0) `Math.max(...a)` работала для 100 000 элементов и падала с `RangeError: Maximum call stack size exceeded` для 150 000 — используйте `reduce`.",
      ),

      h("Итерация, `Array.from`, деструктуризация"),
      code("js", `const a = ["x", "y", "z"];
for (const v of a) process.stdout.write(v + " ");
console.log();
for (const [i, v] of a.entries()) process.stdout.write(i + "=" + v + " ");
console.log();
console.log([...a.keys()], [...a.values()], Array.from(a.entries()));

// array-like и итерируемые объекты
const arrayLike = { length: 2, 0: "a", 1: "b" };
console.log(Array.from(arrayLike), Array.prototype.map.call(arrayLike, (s) => s.toUpperCase()));
console.log(Array.from("привет"), Array.from(new Set([1, 1, 2])), Array.from(new Map([["k", 1]])), Array.from({ length: 3 }, (_, i) => i + 1));
try { [...arrayLike]; } catch (e) { console.log(e.name + ": " + e.message); }
console.log(typeof arrayLike.map, Array.isArray(Array.from(arrayLike)));

// деструктуризация и spread
const [first, , third = "по умолчанию", ...rest] = [1, 2, undefined, 4, 5];
console.log(first, third, rest);
let p = 1, q = 2;
[p, q] = [q, p];
console.log(p, q);
console.log(Math.max(...[1, 5, 3]), [...[1, 2], ...[3]], [..."ab", ..."cd"]);

// изменение во время обхода
const live = [1, 2, 3, 4];
for (const v of live) { if (v === 2) live.splice(live.indexOf(v), 1); process.stdout.write(v + " "); }
console.log("→", live);`, { filename: "a4-iteration.mjs", lineNumbers: true }),
      code("text", `x y z 
0=x 1=y 2=z 
[ 0, 1, 2 ] [ 'x', 'y', 'z' ] [ [ 0, 'x' ], [ 1, 'y' ], [ 2, 'z' ] ]
[ 'a', 'b' ] [ 'A', 'B' ]
[ 'п', 'р', 'и', 'в', 'е', 'т' ] [ 1, 2 ] [ [ 'k', 1 ] ] [ 1, 2, 3 ]
TypeError: arrayLike is not iterable
undefined true
1 по умолчанию [ 4, 5 ]
2 1
5 [ 1, 2, 3 ] [ 'a', 'b', 'c', 'd' ]
1 2 4 → [ 1, 3, 4 ]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Способы обхода:** `for…of` (значения), `entries()` (пары индекс–значение), `keys()`, `values()`; `forEach` — без возможности прервать.",
        "**`Array.from`** превращает итерируемое и array-подобное в массив: строку (`['п', 'р', …]`), `Set`, `Map`, `{ length: 2, 0: 'a', 1: 'b' }`; второй аргумент — функция преобразования.",
        "**Array-подобные не итерируемы:** `[...arrayLike]` — `TypeError: arrayLike is not iterable`; методы массива к ним применяют через `Array.prototype.map.call` или сначала `Array.from`.",
        "**Деструктуризация:** `[first, , third = \"по умолчанию\", ...rest]` берёт элементы по позициям, пропускает лишние, подставляет значение по умолчанию только для `undefined`, остаток собирает в массив. Обмен значений: `[p, q] = [q, p]`.",
        "**Изменение во время обхода:** `splice` внутри `for…of` сдвинул индексы — элемент `3` пропущен (`1 2 4`, массив стал `[1, 3, 4]`). Меняйте копию или стройте новый массив через `filter`.",
      ),
      note("Деструктуризация объектов и массивов подробно разобрана в теме «Деструктуризация и spread/rest»: там же — паттерны вложенности и значения по умолчанию."),

      h("Бинарный поиск: алгоритм на индексах"),
      p("Если массив отсортирован, искать в нём можно за логарифмическое число шагов: сравнить с серединой и отбросить половину. Для массива из миллиона элементов это не более 20 сравнений."),
      code("js", `// Бинарный поиск в отсортированном по compare массиве: индекс элемента или -1
export function binarySearch(sorted, target, compare = (a, b) => a - b) {
  let lo = 0, hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);               // без переполнения при больших индексах
    const c = compare(sorted[mid], target);
    if (c === 0) return mid;
    if (c < 0) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}

// Индекс, куда нужно вставить target, чтобы массив остался отсортированным (левая граница)
export function lowerBound(sorted, target, compare = (a, b) => a - b) {
  let lo = 0, hi = sorted.length;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (compare(sorted[mid], target) < 0) lo = mid + 1; else hi = mid;
  }
  return lo;
}`, { filename: "binary-search.mjs", lineNumbers: true }),
      code("js", `import { binarySearch, lowerBound } from "./binary-search.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);
const xs = [1, 3, 5, 7, 9, 11];

check("найден в середине", binarySearch(xs, 7), 3);
check("первый и последний", [binarySearch(xs, 1), binarySearch(xs, 11)], [0, 5]);
check("не найден", [binarySearch(xs, 4), binarySearch(xs, 0), binarySearch(xs, 100)], [-1, -1, -1]);
check("пустой и один элемент", [binarySearch([], 1), binarySearch([5], 5), binarySearch([5], 6)], [-1, 0, -1]);
check("lowerBound", [lowerBound(xs, 0), lowerBound(xs, 4), lowerBound(xs, 5), lowerBound(xs, 100)], [0, 2, 2, 6]);
check("lowerBound с повторами возвращает первый", lowerBound([1, 2, 2, 2, 3], 2), 1);
check("вставка сохраняет порядок", (() => { const a = [1, 3, 5]; a.splice(lowerBound(a, 4), 0, 4); return a; })(), [1, 3, 4, 5]);
check("строки с компаратором", binarySearch(["аня", "боря", "вера"], "боря", (a, b) => a.localeCompare(b, "ru")), 1);

// сверка с линейным поиском на случайных данных (детерминированный генератор)
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
let mismatches = 0;
for (let t = 0; t < 500; t++) {
  const arr = [...new Set(Array.from({ length: Math.floor(rnd() * 30) }, () => Math.floor(rnd() * 100)))].sort((a, b) => a - b);
  const target = Math.floor(rnd() * 100);
  if (binarySearch(arr, target) !== arr.indexOf(target)) mismatches++;
}
check("500 случайных массивов совпадают с indexOf", mismatches, 0);

let steps = 0;
const big = Array.from({ length: 1_000_000 }, (_, i) => i * 2);
binarySearch(big, 777_777, (a, b) => { steps++; return a - b; });
check("шагов для массива из миллиона элементов не больше 20", steps <= 20, true);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);
console.log("шагов сравнения для миллиона элементов:", steps);`, { filename: "binary-search-test.mjs", collapsed: true }),
      code("text", `Все 10 проверок пройдены
шагов сравнения для миллиона элементов: 20`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const planets = ["Меркурий", "Венера", "Земля"];      // литерал массива

planets.push("Марс");                                  // добавить в конец (меняет массив)
const upper = planets.map((p) => p.toUpperCase());     // новый массив (исходный не меняется)
const [first, , third] = planets;                      // деструктуризация: пропуск второго элемента
const copy = [...planets, "Юпитер"];                   // spread: копия + новый элемент

console.log(planets.length, planets.at(-1), upper[0], first, third);
console.log(copy.includes("Юпитер"), planets.indexOf("Земля"), Array.isArray(planets));
for (const [i, name] of planets.entries()) console.log(i, name);`,
        [
          { line: 1, text: "Литерал массива: значения через запятую в квадратных скобках." },
          { line: 3, text: "`push` добавляет элемент в конец и **меняет** массив (возвращает новую длину)." },
          { line: 4, text: "`map` создаёт **новый** массив; исходный `planets` не меняется." },
          { line: 5, text: "Деструктуризация по позициям: пустое место между запятыми пропускает второй элемент." },
          { line: 6, text: "Spread `...planets` копирует элементы в новый массив (поверхностно) и позволяет добавить новый." },
          { line: [8, 9], text: "`length`, `at(-1)` (последний), `includes`, `indexOf`, `Array.isArray` — основные операции чтения." },
          { line: 10, text: "`entries()` даёт пары `[индекс, значение]`, которые деструктурируются прямо в заголовке `for…of`." },
        ],
        "syntax.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Плейлист</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 30rem; }
  ol { padding-left: 1.5rem; }
  li { padding: .15rem 0; }
  li.current { font-weight: 700; }
  .controls { display: flex; gap: .5rem; flex-wrap: wrap; margin-block: 1rem; }
  button { font: inherit; padding: .3rem .8rem; }
</style>
<h1>Плейлист</h1>
<div class="controls">
  <button id="next">Следующий</button>
  <button id="shuffle">Перемешать</button>
  <button id="remove">Убрать текущий</button>
  <button id="reverse">Развернуть</button>
</div>
<ol id="list"></ol>
<p id="info" role="status"></p>
<script type="module">
  let tracks = ["Рассвет", "Дорога", "Река", "Огни", "Туман"];
  let current = 0;

  const list = document.querySelector("#list");
  const info = document.querySelector("#info");

  // детерминированное «перемешивание» для примера: Фишер–Йейтс с фиксированным генератором
  function shuffled(array, seed = 7) {
    const copy = [...array];                                   // копия — исходный массив не меняем
    for (let i = copy.length - 1; i > 0; i--) {
      seed = (seed * 48271) % 2147483647;
      const j = seed % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];                 // обмен через деструктуризацию
    }
    return copy;
  }

  function render() {
    list.replaceChildren(
      ...tracks.map((title, i) => {
        const li = document.createElement("li");
        li.textContent = title;
        li.classList.toggle("current", i === current);
        return li;
      }),
    );
    info.textContent = tracks.length
      ? \`Играет: «\${tracks[current]}» (\${current + 1} из \${tracks.length})\`
      : "Плейлист пуст";
  }

  document.querySelector("#next").addEventListener("click", () => {
    if (tracks.length) current = (current + 1) % tracks.length;           // зацикливание индекса
    render();
  });
  document.querySelector("#shuffle").addEventListener("click", () => {
    const playing = tracks[current];
    tracks = shuffled(tracks);
    current = Math.max(0, tracks.indexOf(playing));                       // текущий трек остаётся текущим
    render();
  });
  document.querySelector("#remove").addEventListener("click", () => {
    tracks = tracks.filter((_, i) => i !== current);                      // удаление без мутации
    current = Math.min(current, Math.max(0, tracks.length - 1));
    render();
  });
  document.querySelector("#reverse").addEventListener("click", () => {
    const playing = tracks[current];
    tracks = tracks.toReversed();
    current = tracks.indexOf(playing);
    render();
  });
  render();
</script>`, { filename: "playlist.html", runnable: true, lineNumbers: true }),
      p("Плейлист на массиве: «Следующий» — арифметика индекса с зацикливанием, «Перемешать» — копия и обмен элементов через деструктуризацию, «Убрать текущий» — `filter` без мутации, «Развернуть» — `toReversed`. Замер в Chromium 141: старт — «Играет: «Рассвет» (1 из 5)»; после «Следующий» и «Перемешать» текущим остаётся «Дорога»; «Развернуть» ставит её на 4-е место; «Убрать текущий» переключает на соседний трек; когда список пуст, показывается «Плейлист пуст», а нажатие «Следующий» не вызывает ошибок."),
    ]),

    section("detailed-example", [
      p("Мини-библиотека `array-utils.mjs`: `chunk`, `zip`, `unique` (по ключу), `partition`, `rotate`. Все функции **чистые**: не меняют входной массив, обрабатывают граничные случаи (пустой массив, размер больше длины, отрицательный сдвиг, `NaN`)."),
      code("js", `// Разбивает массив на части длиной size
export function chunk(array, size) {
  if (!Number.isInteger(size) || size < 1) throw new RangeError("size должен быть целым числом ≥ 1");
  const result = [];
  for (let i = 0; i < array.length; i += size) result.push(array.slice(i, i + size));
  return result;
}

// Сшивает массивы поэлементно; длина — по самому короткому
export function zip(...arrays) {
  if (arrays.length === 0) return [];
  const length = Math.min(...arrays.map((a) => a.length));
  return Array.from({ length }, (_, i) => arrays.map((a) => a[i]));
}

// Убирает повторы, сохраняя первое вхождение; ключ — по функции (по умолчанию само значение)
export function unique(array, keyFn = (x) => x) {
  const seen = new Set();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Делит массив на два: подходящие и остальные
export function partition(array, predicate) {
  const pass = [], fail = [];
  for (const [i, item] of array.entries()) (predicate(item, i, array) ? pass : fail).push(item);
  return [pass, fail];
}

// Циклический сдвиг: положительное k — влево, отрицательное — вправо; без изменения исходного
export function rotate(array, k) {
  if (array.length === 0) return [];
  const shift = ((k % array.length) + array.length) % array.length;
  return [...array.slice(shift), ...array.slice(0, shift)];
}`, { filename: "array-utils.mjs", lineNumbers: true }),
      code("js", `import { chunk, zip, unique, partition, rotate } from "./array-utils.mjs";

const checks = [];
const check = (label, got, expected) => checks.push([label, JSON.stringify(got), JSON.stringify(expected)]);
const throws = (fn) => { try { fn(); return "без ошибки"; } catch (e) { return e.name; } };

check("chunk", chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
check("chunk: пустой и size больше длины", [chunk([], 3), chunk([1, 2], 5)], [[], [[1, 2]]]);
check("chunk: некорректный size", [throws(() => chunk([1], 0)), throws(() => chunk([1], 1.5)), throws(() => chunk([1], "2"))], ["RangeError", "RangeError", "RangeError"]);

check("zip", zip([1, 2, 3], ["a", "b", "c"]), [[1, "a"], [2, "b"], [3, "c"]]);
check("zip: по короткому", zip([1, 2, 3], ["a"]), [[1, "a"]]);
check("zip: три массива и пустой вызов", [zip([1], [2], [3]), zip()], [[[1, 2, 3]], []]);

check("unique: значения", unique([1, 2, 1, 3, 2]), [1, 2, 3]);
check("unique: по ключу", unique([{ id: 1, v: "a" }, { id: 2, v: "b" }, { id: 1, v: "c" }], (o) => o.id).map((o) => o.v), ["a", "b"]);
check("unique: NaN считается равным NaN", unique([NaN, NaN, 1]).length, 2);

check("partition", partition([1, 2, 3, 4, 5], (n) => n % 2), [[1, 3, 5], [2, 4]]);
check("partition: пустой", partition([], () => true), [[], []]);

check("rotate влево", rotate([1, 2, 3, 4], 1), [2, 3, 4, 1]);
check("rotate вправо", rotate([1, 2, 3, 4], -1), [4, 1, 2, 3]);
check("rotate на длину и больше", [rotate([1, 2, 3], 3), rotate([1, 2, 3], 7), rotate([1, 2, 3], -7)], [[1, 2, 3], [2, 3, 1], [3, 1, 2]]);
check("rotate: пустой", rotate([], 5), []);

const src = [1, 2, 3];
rotate(src, 1); chunk(src, 2); unique(src); partition(src, Boolean);
check("входной массив не изменяется", src, [1, 2, 3]);

let failed = 0;
for (const [label, got, expected] of checks) {
  if (got !== expected) { failed++; console.log("FAIL", label, got, "≠", expected); }
}
console.log(failed === 0 ? \`Все \${checks.length} проверок пройдены\` : \`Провалено: \${failed}\`);`, { filename: "array-utils-test.mjs", collapsed: true }),
      code("text", `Все 16 проверок пройдены`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Функция", "Приём", "Граничные случаи"],
        [
          ["`chunk(array, size)`", "Шаг цикла `i += size` и `slice(i, i + size)`", "`size < 1` или нецелое — `RangeError`; пустой массив → `[]`; `size` больше длины → одна часть"],
          ["`zip(...arrays)`", "Длина по самому короткому, `Array.from({ length }, (_, i) => …)`", "Нет аргументов → `[]`; разная длина → обрезка по короткому"],
          ["`unique(array, keyFn)`", "`Set` увиденных ключей + `filter`", "`NaN` считается равным `NaN` (`Set` использует `SameValueZero`); первое вхождение сохраняется"],
          ["`partition(array, predicate)`", "Один проход с распределением по двум массивам", "Пустой массив → `[[], []]`; предикат получает `(item, index, array)`"],
          ["`rotate(array, k)`", "Остаток `((k % n) + n) % n` и склейка двух `slice`", "Отрицательный `k`, `k` больше длины, пустой массив"],
        ],
        "Разбор библиотеки",
      ),
      ul(
        "Все 16 проверок проходят, включая неизменность входного массива после вызова всех функций.",
        "**Формула `((k % n) + n) % n`** нужна потому, что `%` сохраняет знак делимого (`-7 % 3` — `-1`); добавление `n` делает остаток неотрицательным.",
        "**`Set` вместо `indexOf`:** `unique` работает за один проход (O(n)), а вариант с `indexOf` или `includes` внутри `filter` — O(n²).",
      ),
    ]),

    section("internals", [
      h("Массив как объект"),
      p("В спецификации массив — «экзотический объект»: у него особый внутренний метод `[[DefineOwnProperty]]`, поддерживающий связь между индексами и `length`. Запись индекса, не меньшего `length`, увеличивает `length`; запись `length` удаляет элементы с индексами, не меньшими нового значения (замер: `nums.length = 2`). Поэтому дыры — это просто отсутствующие свойства, а `Object.keys` возвращает только существующие индексы."),
      h("Представление в движках"),
      p("Движки хранят плотные массивы (без дыр, с однородными элементами) в компактных непрерывных буферах и переключаются на медленное «словарное» представление для разреженных массивов. Поэтому «дырявые» массивы и `delete arr[i]` вредят производительности, а на корректность влияют так: методы по-разному реагируют на пропуски (`forEach` пропускает, `for…of` — нет). Подробные оптимизации — тема о производительности."),
      h("Как работает `sort`"),
      p("Без функции сравнения `sort` преобразует элементы в строки и сравнивает их по кодовым единицам UTF-16; поэтому `100` оказывается перед `9`. С функцией `cmp(a, b)` отрицательное значение ставит `a` раньше `b`, положительное — позже, `0` — «равны» (порядок равных сохраняется: сортировка устойчива с ES2019). `undefined` и дыры всегда уходят в конец, функция для них не вызывается. Несогласованная функция сравнения (например, `() => Math.random() - 0.5`) даёт неопределённый порядок и не годится для честного перемешивания — используйте алгоритм Фишера–Йейтса."),
      h("`Array.from`, итераторы и spread"),
      p("`Array.from(x)` сначала ищет `x[Symbol.iterator]`; если он есть, обходит итератором, иначе читает `x.length` и индексы (array-подобный объект). Spread `[...x]` требует именно итерируемого значения: поэтому для `{ length: 2, … }` он падает, а `Array.from` работает."),
      h("`includes`, `indexOf` и сравнение"),
      p("`indexOf` использует строгое равенство (`NaN !== NaN`), `includes` — `SameValueZero` (`NaN` равен `NaN`, `+0` равен `-0`). Объекты сравниваются по ссылке в обоих случаях."),
      h("Бинарный поиск: почему `lo + ((hi - lo) >> 1)`"),
      p("Запись середины как `(lo + hi) / 2` в языках с 32-битными целыми может переполняться; формула `lo + ((hi - lo) >> 1)` безопасна и даёт целое число. В JavaScript числа — `double`, переполнения нет, но формула остаётся привычной и целочисленной (замер: поиск в массиве из миллиона элементов выполнил 20 сравнений)."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Таблица из общих строк"),
      wrongRight(
        "js",
        {
          code: `
            const grid = Array(3).fill(Array(3).fill(0));
            grid[1][1] = 5;           // изменились все строки
          `,
          note: "`fill` копирует ссылку: три строки — один и тот же массив (замер: `[[0,5,0],[0,5,0],[0,5,0]]`).",
        },
        {
          code: `
            const grid = Array.from({ length: 3 }, () => Array(3).fill(0));
            grid[1][1] = 5;           // изменилась одна строка
          `,
          note: "`Array.from` с функцией создаёт независимые массивы (замер: `[[0,0,0],[0,5,0],[0,0,0]]`).",
        },
      ),
      h("Ошибка 2. `sort()` чисел без функции и мутация"),
      p("`scores.sort()` вернула `[1, 10, 100, 9]` и **изменила** исходный массив (`scores === wrong` — `true`). Используйте `toSorted((a, b) => a - b)`."),
      h("Ошибка 3. `delete arr[i]` вместо `splice`"),
      p("`delete list[1]` оставила дыру и длину `3`; `splice(1, 1)` удалила элемент и сдвинула остальные (длина `2`)."),
      h("Ошибка 4. Удаление элементов в цикле по тому же массиву"),
      p("`splice` внутри `for…of` сдвигает индексы: из `[1, 2, 2, 3, 2, 4]` при удалении двоек остались `[1, 3, 2, 4]` (замер) — часть двоек пропущена. Используйте `filter`."),
      h("Ошибка 5. `includes`/`indexOf` для объектов"),
      p("Массив объектов сравнивается по ссылке: `people.includes({ id: 1 })` — `false` (замер). Ищите по полю: `some`, `find`."),
      h("Ошибка 6. `Array(n)` и `map`"),
      p("`Array(3).map(...)` ничего не делает — дыры пропускаются. Используйте `Array.from({ length: 3 }, fn)` или `[...Array(3)].map(...)`."),
      h("Ошибка 7. Считать копию массива глубокой"),
      p("`[...objs]` скопировала только массив; `copy[0] === objs[0]` (замер). Для вложенных данных — `structuredClone`."),
      h("Ошибка 8. Проверять массив через `typeof` или `instanceof` из другого окна"),
      p("`typeof []` — `object`; `instanceof Array` не работает для массивов из другого фрейма. Надёжно — `Array.isArray`."),
    ]),

    section("antipatterns", [
      ul(
        "**Дырявые массивы** (`arr[1000] = x`, `delete arr[i]`, `Array(n)` без заполнения).",
        "**Массивы как словари** (`arr[\"key\"] = …`): свойства не входят в `length` и теряются при копировании; используйте объект или `Map`.",
        "**`shift()` в цикле для обработки очереди** больших размеров и `splice` в середине массива в «горячем» коде: переносы элементов.",
        "**Мутация входного массива в функциях** (`sort`, `reverse`, `splice` без копии).",
        "**`includes`/`indexOf` внутри циклов** по большим данным: квадратичная сложность; используйте `Set`/`Map`.",
        "**`sort(() => Math.random() - 0.5)` для перемешивания:** неравномерный и неопределённый результат.",
        "**Смешение типов в массиве** (числа, строки, объекты вместе), где нужна однородность.",
        "**Spread огромных массивов в аргументы** (`Math.max(...hugeArray)`): риск переполнения стека.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Предпочитайте копирующие методы** (`toSorted`, `toSpliced`, `with`, `filter`, `map`) в коде, где важна неизменяемость данных.",
        "**Сортируйте с явной функцией сравнения;** текст — через `localeCompare`/`Intl.Collator`.",
        "**Создавайте таблицы через `Array.from({ length }, fn)`,** а не `fill` ссылкой.",
        "**Для поиска по условию — `find`/`some`,** для проверки значения — `includes`; для частых проверок принадлежности — `Set`.",
        "**Не меняйте массив во время обхода;** стройте новый.",
        "**Используйте `at(-1)`** для последнего элемента и деструктуризацию для небольших кортежей.",
        "**Проверяйте `Array.isArray`** на границах (JSON, внешние данные).",
        "**Тестируйте граничные случаи:** пустой массив, один элемент, повторы, отрицательные индексы, `NaN`.",
      ),
      tip("Чтобы быстро увидеть различие между дырой и `undefined`, выведите массив в консоли: `[1, , 3]` покажет `<1 empty item>`, а `[1, undefined, 3]` — `undefined`."),
    ]),

    section("edge-cases", [
      h("`length` и очень большие индексы"),
      p("Максимальная длина массива — `2^32 − 1`; `new Array(-1)` и `arr.length = -1` — `RangeError: Invalid array length` (замер). Индекс `2^32 − 1` и выше — уже не индекс, а обычное строковое свойство."),
      h("Целочисленные и нецелочисленные «индексы»"),
      p("`arr[\"1\"]` — тот же элемент, что `arr[1]`; `arr[1.5]` и `arr[\"01\"]` — обычные свойства (не индексы), в `length` не учитываются."),
      h("`concat` и `Symbol.isConcatSpreadable`"),
      p("`concat` разворачивает массивы-аргументы на один уровень (`[[7]]` остаётся вложенным), но не array-подобные объекты, если у них не задан `Symbol.isConcatSpreadable`."),
      h("`sort` и смешанные типы"),
      p("При строковой сортировке числа и строки сравниваются как строки; `undefined` уходит в конец. Для смешанных данных всегда задавайте функцию сравнения."),
      h("`flat` и пустые слоты"),
      p("`flat()` убирает дыры из результата; `flat(Infinity)` разворачивает вложенность любой глубины (замер: `[1, 2, 3, 4]`)."),
      h("Массивы фиксированных типов"),
      p("Для числовых данных большого объёма и работы с байтами есть типизированные массивы (`Uint8Array`, `Float64Array`): фиксированная длина и тип, методы массива, но без `push` и дыр. Их применяют для графики, звука и бинарных данных."),
    ]),

    section("related", [
      ul(
        "[Функции высшего порядка и рекурсия](/learn/js/higher-order-recursion) — `map`, `filter`, `reduce`, `sort` и их реализация.",
        "[Объекты и свойства](/learn/js/objects-properties) — массив как объект, копирование, `structuredClone`.",
        "[Управляющие конструкции](/learn/js/control-flow) — `for…of`, `entries`, изменение во время обхода.",
        "[Переменные и типы данных](/learn/js/variables-types) — ссылки и сравнение.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Мутации, дыры и общие ссылки",
          code: `
            function removeAndSort(list, i) {
              delete list[i];                        // дыра, длина не меняется
              return list.sort();                    // строковая сортировка, меняет исходный массив
            }
            const table = Array(3).fill([]);        // одна общая строка
          `,
          note: "`delete` оставляет дыру, `sort()` сравнивает как строки и мутирует вход, `fill([])` создаёт общую строку.",
        },
        {
          title: "Копирующие методы и независимые строки",
          code: `
            const removeAndSort = (list, i) =>
              list.filter((_, idx) => idx !== i).toSorted((a, b) => a - b);
            const table = Array.from({ length: 3 }, () => []);
          `,
          note: "Вход не меняется, дыр нет, сортировка числовая, строки независимы.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.arrays.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код, скажите, что напечатает каждая строка. Помните, что `console.log` печатает **текущее** состояние переданных массивов после выполнения всех аргументов."),
        code("js", `const a = [1, 2, 3];
const b = a;
b.push(4);
console.log(a.length, a === b, [...a] === a);

const c = [1, 2, 3, 4, 5];
console.log(c.splice(1, 2), c, c.slice(1, 3), c);

const d = [5, 25, 100];
console.log(d.sort(), d.toSorted((x, y) => x - y), d);

const e = Array(3);
e[1] = "x";
console.log(e.length, e.map((v) => v + "!"), Object.keys(e));

const grid = Array(2).fill([]);
grid[0].push(1);
console.log(JSON.stringify(grid));

console.log([1, 2, 3].includes(2), [NaN].includes(NaN), [NaN].indexOf(NaN), [].concat([1], [[2]], 3));`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Что делают `splice` и `sort` с исходным массивом?", "Чем дыра отличается от `undefined`?"],
      checks: ["Объяснён `[...a] === a`", "Объяснено состояние `c` после `splice`", "Объяснены дыры у `e`", "Объяснён `grid`"],
      solution: [
        code("text", `4 true false
[ 2, 3 ] [ 1, 4, 5 ] [ 4, 5 ] [ 1, 4, 5 ]
[ 100, 25, 5 ] [ 5, 25, 100 ] [ 100, 25, 5 ]
3 [ <1 empty item>, 'x!', <1 empty item> ] [ '1' ]
[[1],[1]]
true true -1 [ 1, [ 2 ], 3 ]`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "`b` — вторая ссылка на `a`: после `push` длина `4`, `a === b` — `true`; `[...a]` — новый массив, поэтому `[...a] === a` — `false`.",
          "`c.splice(1, 2)` вернула `[2, 3]` и оставила `[1, 4, 5]`; `c.slice(1, 3)` — `[4, 5]`; оба `c` печатаются в итоговом состоянии `[1, 4, 5]`.",
          "`d.sort()` без функции сравнивает как строки (`\"100\" < \"25\" < \"5\"`) и меняет `d` на `[100, 25, 5]`; `toSorted((x, y) => x - y)` возвращает копию `[5, 25, 100]`; в конце `d` — по-прежнему `[100, 25, 5]`.",
          "`Array(3)` — три дыры; запись `e[1] = \"x\"`: длина `3`, `map` обрабатывает только существующий индекс и сохраняет дыры, `Object.keys(e)` — `['1']`.",
          "`Array(2).fill([])` — две ссылки на один массив: `push` виден в обеих строках `[[1],[1]]`.",
          "`includes(NaN)` — `true`, `indexOf(NaN)` — `-1`; `concat` разворачивает один уровень: `[1, [2], 3]`.",
        ),
      ],
    }),
    exercise({
      id: "js.arrays.ex2",
      title: "Четыре ловушки массивов",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("В примере четыре классические ошибки: таблица из общих строк, сортировка чисел с мутацией, удаление через `delete` и удаление во время обхода. Для каждой объясните причину по выводу и покажите правильный вариант."),
      ],
      hints: ["Что именно копирует `fill`?", "Как `for…of` держит индекс при `splice`?"],
      checks: ["Четыре причины названы", "Четыре исправления", "Исходные массивы не мутируются там, где не нужно"],
      solution: [
        code("js", `// Ошибка 1: «таблица» из общих строк
const badGrid = Array(3).fill(Array(3).fill(0));
badGrid[1][1] = 5;
console.log("было:", JSON.stringify(badGrid));
const grid = Array.from({ length: 3 }, () => Array(3).fill(0));
grid[1][1] = 5;
console.log("стало:", JSON.stringify(grid));

// Ошибка 2: сортировка чисел и мутация
const scores = [10, 9, 100, 1];
const wrong = scores.sort();
console.log("sort():", wrong, "исходный изменён:", scores === wrong);
const prices = [10, 9, 100, 1];
const right = prices.toSorted((a, b) => a - b);
console.log("toSorted:", right, "исходный:", prices);

// Ошибка 3: удаление через delete
const list = ["a", "b", "c"];
delete list[1];
console.log("delete:", list, list.length);
const list2 = ["a", "b", "c"];
list2.splice(1, 1);
console.log("splice:", list2, list2.length);

// Ошибка 4: удаление во время обхода
const nums = [1, 2, 2, 3, 2, 4];
for (const n of nums) { if (n === 2) nums.splice(nums.indexOf(n), 1); }
console.log("удаление в цикле:", nums);
console.log("filter:", [1, 2, 2, 3, 2, 4].filter((n) => n !== 2));`, { filename: "x2-pitfalls.mjs" }),
        code("text", `было: [[0,5,0],[0,5,0],[0,5,0]]
стало: [[0,0,0],[0,5,0],[0,0,0]]
sort(): [ 1, 10, 100, 9 ] исходный изменён: true
toSorted: [ 1, 9, 10, 100 ] исходный: [ 10, 9, 100, 1 ]
delete: [ 'a', <1 empty item>, 'c' ] 3
splice: [ 'a', 'c' ] 2
удаление в цикле: [ 1, 3, 2, 4 ]
filter: [ 1, 3, 4 ]`, { filename: "вывод Node.js 22.22.0" }),
        p("1) `fill` повторяет ссылку; `Array.from` с функцией создаёт независимые строки. 2) `sort()` строковый и изменяет массив; нужен `toSorted((a, b) => a - b)`. 3) `delete` оставляет дыру; `splice(1, 1)` удаляет и сдвигает. 4) `splice` в цикле по тому же массиву сдвигает индексы — часть элементов пропущена; `filter` строит новый массив."),
      ],
    }),
    exercise({
      id: "js.arrays.ex3",
      title: "Бинарный поиск и вставка",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Реализуйте `binarySearch(sorted, target, compare)` — индекс элемента или `-1`, и `lowerBound(sorted, target, compare)` — позицию вставки, сохраняющую порядок (для повторов — первую). Проверьте: пустой массив, один элемент, повторы, строки с `localeCompare`, сверку с `indexOf` на случайных данных, число сравнений для миллиона элементов."),
      ],
      hints: ["Что делать с границами `lo` и `hi` после сравнения?", "Чем `lowerBound` отличается от поиска точного совпадения?"],
      checks: ["Находит первый, последний, отсутствующий", "`lowerBound` возвращает первый из повторов", "Не более 20 сравнений на миллион элементов"],
      solution: [
        code("js", `// Бинарный поиск в отсортированном по compare массиве: индекс элемента или -1
export function binarySearch(sorted, target, compare = (a, b) => a - b) {
  let lo = 0, hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);               // без переполнения при больших индексах
    const c = compare(sorted[mid], target);
    if (c === 0) return mid;
    if (c < 0) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}

// Индекс, куда нужно вставить target, чтобы массив остался отсортированным (левая граница)
export function lowerBound(sorted, target, compare = (a, b) => a - b) {
  let lo = 0, hi = sorted.length;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (compare(sorted[mid], target) < 0) lo = mid + 1; else hi = mid;
  }
  return lo;
}`, { filename: "binary-search.mjs" }),
        code("text", `Все 10 проверок пройдены
шагов сравнения для миллиона элементов: 20`, { filename: "результат запуска (Node.js 22.22.0)" }),
        p("Инвариант: искомое (если есть) лежит в `[lo, hi]`. Каждое сравнение отбрасывает половину диапазона, поэтому шагов не больше ⌈log₂ n⌉ + 1 (для миллиона — около 20; в замере для отсутствующего значения — `20`). `lowerBound` сужает диапазон до первой позиции, где `sorted[i] >= target`, поэтому при повторах возвращает первый."),
      ],
    }),
  ],

  challenge: {
    id: "js.arrays.challenge",
    title: "Мини-библиотека массивов",
    scenario: [
      p("В проекте часто повторяются одни и те же операции над массивами. Напишите модуль `array-utils.mjs` с чистыми функциями `chunk`, `zip`, `unique`, `partition`, `rotate`."),
    ],
    requirements: [
      "`chunk(array, size)`: части длины `size`; `size` — целое ≥ 1, иначе `RangeError`",
      "`zip(...arrays)`: поэлементные кортежи по самому короткому массиву; без аргументов — `[]`",
      "`unique(array, keyFn)`: первое вхождение каждого ключа; `NaN` считается равным `NaN`",
      "`partition(array, predicate)`: `[подходящие, остальные]`",
      "`rotate(array, k)`: циклический сдвиг влево при `k > 0`, вправо при `k < 0`; любые `k` по модулю длины",
    ],
    constraints: [
      "Входные массивы не изменяются",
      "`unique` работает за один проход (без `indexOf`/`includes` внутри цикла)",
    ],
    acceptance: [
      "Все 16 проверок из теста проходят",
      "Пустые входы не приводят к ошибке (кроме некорректного `size`)",
      "После всех вызовов входной массив равен исходному",
    ],
    hints: [
      "Как получить неотрицательный остаток для отрицательного `k`?",
      "Какая структура даёт проверку принадлежности за O(1) и корректно работает с `NaN`?",
      "Как построить `zip`, не зная заранее число массивов?",
    ],
    solution: [
      code("js", `// Разбивает массив на части длиной size
export function chunk(array, size) {
  if (!Number.isInteger(size) || size < 1) throw new RangeError("size должен быть целым числом ≥ 1");
  const result = [];
  for (let i = 0; i < array.length; i += size) result.push(array.slice(i, i + size));
  return result;
}

// Сшивает массивы поэлементно; длина — по самому короткому
export function zip(...arrays) {
  if (arrays.length === 0) return [];
  const length = Math.min(...arrays.map((a) => a.length));
  return Array.from({ length }, (_, i) => arrays.map((a) => a[i]));
}

// Убирает повторы, сохраняя первое вхождение; ключ — по функции (по умолчанию само значение)
export function unique(array, keyFn = (x) => x) {
  const seen = new Set();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Делит массив на два: подходящие и остальные
export function partition(array, predicate) {
  const pass = [], fail = [];
  for (const [i, item] of array.entries()) (predicate(item, i, array) ? pass : fail).push(item);
  return [pass, fail];
}

// Циклический сдвиг: положительное k — влево, отрицательное — вправо; без изменения исходного
export function rotate(array, k) {
  if (array.length === 0) return [];
  const shift = ((k % array.length) + array.length) % array.length;
  return [...array.slice(shift), ...array.slice(0, shift)];
}`, { filename: "array-utils.mjs", lineNumbers: true }),
      code("text", `Все 16 проверок пройдены`, { filename: "результат запуска тестов" }),
      p("`rotate` использует `((k % n) + n) % n`, `unique` — `Set` увиденных ключей (его сравнение `SameValueZero` корректно для `NaN`), `zip` — `Array.from({ length }, …)` по минимальной длине."),
    ],
  },

  interview: [
    iq("js.arrays.i1", "basic", "Как проверить, что значение — массив?", [
      ul(
        "`Array.isArray(value)` — надёжно, в том числе для массивов из других фреймов.",
        "`typeof []` — `\"object\"` (не подходит); `instanceof Array` ломается между окнами.",
      ),
    ]),
    iq("js.arrays.i2", "basic", "Какие методы массива изменяют его, а какие возвращают копию?", [
      ul(
        "Изменяют: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`.",
        "Копируют: `slice`, `concat`, `map`, `filter`, `flat`, `flatMap`, `toSorted`, `toReversed`, `toSpliced`, `with`.",
        "Помните, что `sort()` и `reverse()` возвращают тот же массив.",
      ),
    ]),
    iq("js.arrays.i3", "intermediate", "Почему `[10, 9, 1, 100].sort()` даёт `[1, 10, 100, 9]` и как исправить?", [
      ul(
        "Без функции сравнения элементы приводятся к строкам и сравниваются по кодовым единицам.",
        "Для чисел — `sort((a, b) => a - b)`; для копии — `toSorted`.",
        "Текст на разных языках — `localeCompare`/`Intl.Collator`.",
      ),
    ]),
    iq("js.arrays.i4", "intermediate", "Чем дыра отличается от `undefined` и как с ней обращаются методы?", [
      ul(
        "Дыра — отсутствующий индекс (`1 in [1, , 3]` — `false`); `undefined` — существующий элемент.",
        "`forEach`, `map`, `filter`, `reduce` пропускают дыры; `for…of`, spread и `Array.from` видят `undefined`.",
        "`JSON.stringify` превращает дыру в `null`; `flat` её убирает.",
        "Дыры создают `Array(n)`, `delete arr[i]`, запись за границей `length` и увеличение `length`.",
      ),
    ]),
    iq("js.arrays.i5", "intermediate", "Как создать двумерный массив (матрицу) без общих ссылок?", [
      ul(
        "`Array.from({ length: rows }, () => Array(cols).fill(0))` — каждая строка новая.",
        "`Array(rows).fill(Array(cols).fill(0))` — одна общая строка (ошибка).",
        "Для значений-примитивов `fill` внутри строки безопасен.",
      ),
    ]),
    iq("js.arrays.i6", "advanced", "Как удалить элементы из массива по условию и не сломаться при обходе?", [
      ul(
        "`filter` — построить новый массив (чисто и предсказуемо).",
        "Если нужен тот же массив — обход с конца индексным циклом и `splice`, либо `arr.length = 0; arr.push(...kept)`.",
        "Нельзя вызывать `splice` внутри `for…of`/`forEach` по тому же массиву: индексы сдвигаются, элементы пропускаются.",
      ),
    ]),
    iq("js.arrays.i7", "engineering", "Как выбрать структуру: массив, `Set` или `Map`?", [
      ul(
        "Массив — упорядоченный список, доступ по индексу, повторы допустимы.",
        "`Set` — уникальные значения и быстрая проверка принадлежности (`has`).",
        "`Map` — ключ → значение для любых ключей; поиск по ключу без обхода.",
        "Для частых поисков по идентификатору превращайте массив в `Map` один раз, а не вызывайте `find` в цикле.",
      ),
    ]),
    iq("js.arrays.i8", "debugging", "В таблице все строки получили одно и то же значение после присваивания в одну ячейку. Что искать?", [
      ul(
        "Создание через `Array(n).fill(obj)` или `fill([])`: одна ссылка на все строки.",
        "Копирование «поверхностной» копией (`[...rows]`, `slice`) вложенных массивов.",
        "Исправление: `Array.from({ length }, () => newRow())` и глубокая копия (`structuredClone`) при копировании таблицы.",
      ),
    ]),
  ],

  exam: [
    mcq("js.arrays.e1", "foundation", "Что вернёт `[1, 2, 3].at(-1)`?", ["`1`", "`undefined`", "`3`", "`-1`"], 2, "`at` принимает отрицательные индексы: `-1` — последний элемент."),
    mcq("js.arrays.e2", "foundation", "Что делает `arr.length = 0`?", ["Опустошает тот же массив", "Ничего", "Создаёт новый пустой массив", "Бросает ошибку"], 0, "Запись `length` удаляет элементы с индексами не меньше нового значения; ссылки на этот массив видят пустой массив (замер)."),
    mcq("js.arrays.e3", "intermediate", "Что вернёт `[NaN].indexOf(NaN)` и `[NaN].includes(NaN)`?", ["`0` и `true`", "`0` и `false`", "`-1` и `false`", "`-1` и `true`"], 3, "`indexOf` использует строгое равенство, `includes` — `SameValueZero`, где `NaN` равен `NaN` (замер)."),
    mcq("js.arrays.e4", "intermediate", "Что даст `Array(3).fill([])` после `grid[0].push(1)`?", ["`[[1], [], []]`", "`[[1], [1], [1]]`", "`[[1], [1], []]`", "Ошибку"], 1, "`fill` копирует ссылку: три элемента — один и тот же массив (замер)."),
    mcq("js.arrays.e5", "intermediate", "Какие методы НЕ изменяют исходный массив? Выберите все.", ["`toSorted`", "`splice`", "`slice`", "`with`"], [0, 2, 3], "`splice` изменяет массив; `toSorted`, `slice`, `with` возвращают новый."),
    mcq("js.arrays.e6", "advanced", "Что произойдёт при удалении элемента `splice` внутри `for…of` по тому же массиву?", ["Всё работает корректно", "Цикл станет бесконечным", "`TypeError`", "Следующий элемент будет пропущен из-за сдвига индексов"], 3, "После удаления элементы сдвигаются влево, а итератор переходит к следующему индексу — один элемент пропущен (замер: `1 2 4`)."),
    open("js.arrays.e7", "intermediate", "Объясните, как работает сортировка по умолчанию и когда её опасно использовать.", [
      ul(
        "Без функции сравнения элементы преобразуются в строки и сравниваются по кодовым единицам UTF-16.",
        "Числа сортируются как строки (`100` перед `9`), русские буквы — по кодам (`ё` после `я`, прописные перед строчными).",
        "`undefined` и дыры уходят в конец; сортировка меняет массив и устойчива.",
        "Решение: функция сравнения для чисел, `localeCompare`/`Intl.Collator` для текста, `toSorted` для копии.",
      ),
    ], ["Названо строковое сравнение", "Приведены примеры", "Названы способы исправления"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.arrays.m1", "intermediate", "Чем отличается `delete arr[1]` от `arr.splice(1, 1)`?", ["Ничем", "`splice` оставляет дыру", "`delete` оставляет дыру и не меняет длину, `splice` удаляет элемент и сдвигает остальные", "`delete` изменяет длину"], 2, "Замер: после `delete` длина `3` и дыра, после `splice` — длина `2`."),
    mcq("js.arrays.m2", "advanced", "Сколько сравнений (порядок величины) потребует бинарный поиск в отсортированном массиве из миллиона элементов?", ["Около 1000", "Около 20", "Около 500 000", "Около 1 000 000"], 1, "Каждый шаг отбрасывает половину диапазона: ⌈log₂ 1 000 000⌉ ≈ 20 (замер: 20)."),
    mcq("js.arrays.m3", "advanced", "Почему `sort(() => Math.random() - 0.5)` не годится для честного перемешивания?", ["Несогласованная функция сравнения даёт неравномерное распределение и неопределённый порядок", "Метод `sort` не принимает функции", "Результат всегда отсортирован", "Функция слишком медленная"], 0, "Сортировке нужна согласованная функция (антисимметричная и транзитивная); для перемешивания применяют алгоритм Фишера–Йейтса."),
    open("js.arrays.m4", "advanced", "Опишите, как вы реализуете ленту из 100 000 сообщений с фильтром, поиском и сортировкой, чтобы интерфейс не тормозил.", [
      ul(
        "Данные хранить в плотном массиве, индексировать по идентификатору в `Map`, поиск по тексту — по предварительно построенному индексу (нижний регистр, нормализация).",
        "Фильтрацию и сортировку выполнять копирующими методами и мемоизировать результат по параметрам; сортировать один раз и поддерживать порядок вставкой бинарным поиском.",
        "Рендерить только видимую часть (виртуализация списка), а не 100 000 элементов DOM.",
        "Тяжёлые вычисления — порциями или в Web Worker; измерять профайлером, а не гадать.",
        "Тесты на граничные случаи (пустой результат, один элемент, повторы) и на неизменяемость исходного массива.",
      ),
    ], ["Описан индекс", "Описан порядок операций", "Упомянута виртуализация", "Упомянуты замеры и тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.arrays.f1", front: "Мутирующие и копирующие?", back: "Мутируют: push/pop/shift/unshift/splice/sort/reverse/fill. Копируют: slice/concat/map/filter/toSorted/toReversed/toSpliced/with." },
    { id: "js.arrays.f2", front: "sort() по умолчанию?", back: "Сравнивает как строки и меняет массив: [10,9,1,100] → [1,10,100,9]. Числа: (a,b)=>a-b; копия: toSorted." },
    { id: "js.arrays.f3", front: "Array(3).fill([])?", back: "Три ссылки на один массив. Независимые: Array.from({length:3}, () => [])." },
    { id: "js.arrays.f4", front: "Дыра против undefined?", back: "Дыра — нет индекса (`1 in a` false); forEach/map пропускают, for…of видит undefined; JSON → null." },
    { id: "js.arrays.f5", front: "includes и indexOf?", back: "includes находит NaN (SameValueZero), indexOf — нет; объекты — по ссылке." },
    { id: "js.arrays.f6", front: "splice форма?", back: "splice(start, count, ...items): удаляет и/или вставляет, возвращает удалённые." },
    { id: "js.arrays.f7", front: "Бинарный поиск?", back: "Отсортированный массив; на каждом шаге отбрасывается половина: ~20 сравнений на миллион элементов." },
  ],

  sources: [
    { title: "ECMAScript: Array Objects", url: "https://tc39.es/ecma262/#sec-array-objects", publisher: "ECMA" },
    { title: "ECMAScript: Array.prototype.sort", url: "https://tc39.es/ecma262/#sec-array.prototype.sort", publisher: "ECMA" },
    { title: "ECMAScript: SameValueZero", url: "https://tc39.es/ecma262/#sec-samevaluezero", publisher: "ECMA" },
    { title: "MDN: Array", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array", publisher: "MDN" },
    { title: "MDN: Indexed collections", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections", publisher: "MDN" },
    { title: "MDN: Array.from()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from", publisher: "MDN" },
    { title: "MDN: Array.prototype.toSorted()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted", publisher: "MDN" },
    { title: "MDN: Array.prototype.splice()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice", publisher: "MDN" },
    { title: "MDN: Typed arrays", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays", publisher: "MDN" },
  ],
};
