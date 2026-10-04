import type { Topic } from "../../types";
import {
  annotated,
  beforeAfter,
  code,
  def,
  exercise,
  h,
  insight,
  iq,
  mcq,
  note,
  open,
  p,
  section,
  steps,
  table,
  tip,
  ul,
  warn,
  wrongRight,
} from "../../dsl";

export const operatorsCoercion: Topic = {
  id: "js.operators-coercion",
  slug: "operators-coercion",
  domain: "js",
  module: "language",
  title: "Операторы, приведение типов и равенство",
  titleEn: "Operators, type coercion and equality",
  summary:
    "JavaScript автоматически преобразует значения, когда оператору нужен другой тип: `\"1\" + 2` даёт строку `\"12\"`, а `\"5\" - 2` — число `3`. Тема разбирает три преобразования (в логическое, число и строку), абстрактный алгоритм `ToPrimitive` с методами `valueOf`/`toString`/`Symbol.toPrimitive`, строгое (`===`), нестрогое (`==`) равенство и `Object.is`, логические операторы, возвращающие операнды (`||`, `&&`, `??`), короткое замыкание и опциональную цепочку `?.`, а также сравнения, арифметику, остаток, побитовые операторы и присваивания `||=`, `??=`, `&&=`. Все результаты получены замерами в Node.js 22 и Chromium 141.",
  minutes: 60,
  prerequisites: ["js.variables-types"],
  tags: ["coercion", "==", "===", "Object.is", "truthy", "falsy", "ToPrimitive", "valueOf", "??", "||", "?.", "оператор", "приведение типов", "сравнение", "NaN"],
  keyConcepts: [
    { term: "Три преобразования", text: "В логическое (`if`, `!`, `&&`), в число (`-`, `*`, `<`, унарный `+`), в строку (шаблонные строки, `String`). `+` выбирает сложение или склейку по типам операндов." },
    { term: "Восемь ложных значений", text: "`false`, `0`, `-0`, `0n`, `\"\"`, `null`, `undefined`, `NaN` — ложные. Остальные истинны, включая `\"0\"`, `\"false\"`, `[]` и `{}` (замер)." },
    { term: "Используйте `===`", text: "Строгое равенство не приводит типы: `0 == \"\"` — `true`, `0 === \"\"` — `false`. Нестрогое `== null` — единственный распространённый осознанный случай (оно ловит и `null`, и `undefined`)." },
    { term: "`??` против `||`", text: "`||` подставляет запасное значение для **любого** ложного (в том числе `0` и `\"\"`), `??` — только для `null` и `undefined`. `settings.volume || 50` при `volume: 0` даёт `50` (замер)." },
    { term: "Значение из формы — всегда строка", text: "`input.value` — `string`: `\"2\" + \"3\"` — `\"23\"`. Преобразуйте явно (`Number`) и проверяйте результат на `NaN`." },
  ],
  sections: [
    section("definition", [
      def("Приведение типов", "Преобразование значения одного типа в другое: явное (`Number(x)`, `String(x)`, `Boolean(x)`) или неявное (оператор сам преобразует операнды).", "type coercion / conversion"),
      def("Истинное и ложное (truthy/falsy)", "Результат преобразования значения в логическое. Ложных значений восемь: `false`, `0`, `-0`, `0n`, `\"\"`, `null`, `undefined`, `NaN`.", "truthy / falsy"),
      def("Строгое равенство `===`", "Сравнение без приведения типов: значения разных типов не равны; объекты равны только как одна ссылка.", "strict equality"),
      def("Нестрогое равенство `==`", "Сравнение с приведением типов по алгоритму абстрактного равенства. Правила запоминать не нужно — нужно знать, почему им лучше не пользоваться.", "loose equality"),
      def("`Object.is`", "Сравнение «как значений» (SameValue): отличается от `===` только для `NaN` (равен себе) и `-0` (не равен `+0`).", "Object.is"),
      def("`ToPrimitive`", "Внутреннее преобразование объекта в примитив: ищет `Symbol.toPrimitive`, иначе вызывает `valueOf`/`toString` в порядке, зависящем от «подсказки» (hint).", "ToPrimitive"),
      def("Короткое замыкание", "Правый операнд `&&`, `||`, `??` вычисляется только если результат нельзя определить по левому.", "short-circuit evaluation"),
      def("Опциональная цепочка `?.`", "Оператор доступа, который вместо `TypeError` возвращает `undefined`, если левая часть — `null` или `undefined`.", "optional chaining"),
    ]),

    section("why", [
      h("Каждый второй баг с данными — это приведение типов"),
      p("Пользователь вводит «10» — это строка. Сервер присылает `null` вместо числа. В объекте настроек громкость `0`, а вы подставляете значение по умолчанию. Условие проверяет `if (items.length)`, и пустой массив работает, а `if (items)` — нет, потому что `[]` истинно. Все эти ситуации объясняются тремя правилами, которые вы выучите в этой теме."),
      ul(
        "**Чтение чужого кода:** операторы `||`, `??`, `?.`, `==`, `+` используются в каждом проекте.",
        "**Работа с формами и JSON:** значения приходят строками, `null`, отсутствующими полями.",
        "**Условия и значения по умолчанию:** разница между «нет значения» и «значение ложное» — частый источник ошибок.",
        "**Собеседования:** `[] + {}`, `null >= 0`, `[] == ![]` — типичные вопросы; ответ на них — не заучивание, а применение алгоритма.",
      ),
      insight("Приведение типов — не «магия» и не «баг языка», а набор правил. Вы можете **выбрать, не использовать их** (`===`, явные `Number()`/`String()`), но должны уметь **прочитать** код, где они применены."),
    ]),

    section("mental-model", [
      p("Представьте **таможню** с тремя окнами: «в логическое», «в число», «в строку». Оператор — это пограничник, который решает, к какому окну отправить операнды. `if` и `!` отправляют значение в окно «логическое». Арифметика `-`, `*`, `/`, сравнения `<`, `>` и унарный `+` — в окно «число». Шаблонные строки и `String()` — в окно «строка». Оператор `+` — особый пограничник: он смотрит, нет ли среди операндов строки; если есть, отправляет обоих в окно «строка» (склейка), иначе — в окно «число» (сложение). Объект сначала проходит **предварительный досмотр** (`ToPrimitive`): его просят выдать примитив через `valueOf` или `toString`."),
      table(
        ["Контекст", "В какой тип приводится", "Примеры"],
        [
          ["Условие, `!`, `&&`, `||` (для проверки), тернарный оператор", "boolean", "`if (x)`, `!!x`, `x ? a : b`"],
          ["`-`, `*`, `/`, `%`, `**`, унарный `+`, сравнения `<` `>` `<=` `>=`", "number", "`\"5\" - 2` → `3`, `+\"42\"` → `42`"],
          ["`+` (если есть строка), шаблонные строки, `String()`", "string", "`\"1\" + 2` → `\"12\"`, `String([1, 2])` → `\"1,2\"`"],
          ["`==` (разные типы)", "число (в большинстве случаев)", "`\"1\" == 1`, `true == \"1\"`"],
        ],
        "Куда приводит оператор",
      ),
    ]),

    section("technical", [
      h("Логическое преобразование: truthy и falsy"),
      p("Замер значений через `Boolean(v)` (Node.js 22.22.0):"),
      code("js", `const values = [
  false, 0, -0, 0n, "", null, undefined, NaN,         // ложные значения
  "0", "false", " ", [], {}, -1, Infinity, () => {},  // истинные значения
];
const show = (v) =>
  typeof v === "function" ? "() => {}"
  : typeof v === "bigint" ? v + "n"
  : typeof v === "string" ? JSON.stringify(v)
  : Array.isArray(v) ? "[]"
  : Object.is(v, -0) ? "-0"
  : typeof v === "object" && v !== null ? "{}"
  : String(v);
for (const v of values) console.log(show(v).padEnd(10), Boolean(v));`, { filename: "o1-truthiness.mjs", lineNumbers: true }),
      code("text", `false      false
0          false
-0         false
0n         false
""         false
null       false
undefined  false
NaN        false
"0"        true
"false"    true
" "        true
[]         true
{}         true
-1         true
Infinity   true
() => {}   true`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Ложные:** `false`, `0`, `-0`, `0n`, `\"\"`, `null`, `undefined`, `NaN`. Больше — ни одного (в браузерах есть единственное историческое исключение `document.all`, см. «Крайние случаи»).",
        "**Истинные — всё остальное,** в том числе **`\"0\"`, `\"false\"`, `\" \"`, `[]`, `{}`** и `Infinity`. Из-за этого `if (items)` не проверяет, что массив пуст: нужно `items.length`.",
      ),

      h("Оператор `+`: сложение или склейка"),
      p("Если после `ToPrimitive` хотя бы один операнд — строка, `+` склеивает строки (второй операнд приводится к строке). Иначе оба операнда приводятся к числам и складываются. Остальные арифметические операторы **всегда** числовые. Замер:"),
      code("js", `const show = (v) => (typeof v === "string" ? JSON.stringify(v) : String(v));
const exprs = [
  ["1 + 2", () => 1 + 2],
  ['"1" + 2', () => "1" + 2],
  ['1 + 2 + "3"', () => 1 + 2 + "3"],
  ['"1" + 2 + 3', () => "1" + 2 + 3],
  ['"5" - 2', () => "5" - 2],
  ['"5" * "2"', () => "5" * "2"],
  ['"abc" - 1', () => "abc" - 1],
  ['+"42"', () => +"42"],
  ['+""', () => +""],
  ["+[]", () => +[]],
  ["+{}", () => +{}],
  ["+true", () => +true],
  ["+null", () => +null],
  ["+undefined", () => +undefined],
  ["[] + []", () => [] + []],
  ["[] + {}", () => [] + {}],
  ["[1, 2] + [3]", () => [1, 2] + [3]],
  ["null + 1", () => null + 1],
  ["undefined + 1", () => undefined + 1],
  ["true + true", () => true + true],
  ['"3" + null', () => "3" + null],
];
for (const [label, fn] of exprs) console.log(label.padEnd(16), show(fn()));
try { Symbol("s") + ""; } catch (e) { console.log(e.name + ": " + e.message); }`, { filename: "o2-plus.mjs", lineNumbers: true }),
      code("text", `1 + 2            3
"1" + 2          "12"
1 + 2 + "3"      "33"
"1" + 2 + 3      "123"
"5" - 2          3
"5" * "2"        10
"abc" - 1        NaN
+"42"            42
+""              0
+[]              0
+{}              NaN
+true            1
+null            0
+undefined       NaN
[] + []          ""
[] + {}          "[object Object]"
[1, 2] + [3]     "1,23"
null + 1         1
undefined + 1    NaN
true + true      2
"3" + null       "3null"
TypeError: Cannot convert a Symbol value to a string`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Порядок слева направо:** `1 + 2 + \"3\"` — `\"33\"` (сначала `3`, потом склейка), а `\"1\" + 2 + 3` — `\"123\"` (склейка с самого начала).",
        "**`-`, `*` — числовые:** `\"5\" - 2` — `3`; нечисловая строка даёт `NaN` (`\"abc\" - 1`).",
        "**Унарный `+` — самый короткий способ привести к числу:** `+\"42\"` — `42`, `+\"\"` — `0`, `+null` — `0`, `+undefined` — `NaN`, `+[]` — `0`, `+{}` — `NaN`, `+true` — `1`.",
        "**Объекты** превращаются в строки через `toString`: `[] + {}` — `\"[object Object]\"`, `[1, 2] + [3]` — `\"1,23\"`.",
        "**`Symbol`** не приводится к строке неявно: `Symbol(\"s\") + \"\"` — `TypeError: Cannot convert a Symbol value to a string` (явный `String(Symbol(\"s\"))` работает).",
      ),
      warn("Значение поля формы (`input.value`) — **всегда строка**, поэтому `a + b` склеивает: замер на странице с полями `2` и `3` дал `\"23\"`, а `Number(a) + Number(b)` — `5`. А при вводе `1,5` с запятой `Number(\"1,5\")` — `NaN`."),

      h("Явные преобразования"),
      table(
        ["Преобразование", "Что делает", "Примеры (замер)"],
        [
          ["`Number(x)`", "Строго: вся строка должна быть числом (после обрезки пробелов); пустая строка → `0`", "`Number(\"  12 \")` → `12`, `Number(\"\")` → `0`, `Number(\"12px\")` → `NaN`, `Number(\"0x10\")` → `16`, `Number(\"1_000\")` → `NaN`"],
          ["`parseInt(s, 10)` / `parseFloat(s)`", "Читает число с начала строки и останавливается на первом неподходящем символе", "`parseInt(\"12px\")` → `12`, `parseFloat(\"3.14abc\")` → `3.14`, `parseInt(\"1e3\")` → `1`"],
          ["`String(x)`", "Строка из значения; `null` → `\"null\"`", "`String(null)`, `String([1,[2,3]])` → `\"1,2,3\"`"],
          ["`Boolean(x)` / `!!x`", "Логическое значение по таблице falsy", "`!!\"0\"` — `true`"],
        ],
        "Явное приведение",
      ),
      note("`parseInt` без второго аргумента определяет систему счисления по префиксу (`0x…` — шестнадцатеричная); всегда указывайте основание: `parseInt(s, 10)`."),

      h("Равенство: `===`, `==` и `Object.is`"),
      p("`===` сравнивает без приведения: значения разных типов никогда не равны; объекты равны, только если это одна и та же ссылка. `==` сначала приводит типы. Замер:"),
      code("js", `const pairs = [
  [0, ""], [0, "0"], ["", "0"], [null, undefined], [null, 0], [undefined, 0], [NaN, NaN],
  [[], false], [[1], 1], [[1, 2], "1,2"], [{}, "[object Object]"], ["1", 1], [true, "1"], [true, 2],
];
const f = (v) => (Array.isArray(v) ? JSON.stringify(v) : typeof v === "object" && v !== null ? "{}" : typeof v === "string" ? JSON.stringify(v) : String(v));
for (const [a, b] of pairs) {
  console.log((f(a) + " vs " + f(b)).padEnd(26), "==", String(a == b).padEnd(5), "===", a === b, "Object.is", Object.is(a, b));
}`, { filename: "o3-equality.mjs", lineNumbers: true }),
      code("text", `0 vs ""                    == true  === false Object.is false
0 vs "0"                   == true  === false Object.is false
"" vs "0"                  == false === false Object.is false
null vs undefined          == true  === false Object.is false
null vs 0                  == false === false Object.is false
undefined vs 0             == false === false Object.is false
NaN vs NaN                 == false === false Object.is true
[] vs false                == true  === false Object.is false
[1] vs 1                   == true  === false Object.is false
[1,2] vs "1,2"             == true  === false Object.is false
{} vs "[object Object]"    == true  === false Object.is false
"1" vs 1                   == true  === false Object.is false
true vs "1"                == true  === false Object.is false
true vs 2                  == false === false Object.is false`, { filename: "вывод Node.js 22.22.0" }),
      p("Правила `==` (кратко): значения одного типа сравниваются как `===`; `null == undefined` — `true`, и ни с чем другим `null`/`undefined` по `==` не равны (замер: `null == 0` — `false`); строка и число — строка переводится в число; логическое значение переводится в число **раньше**, чем сравнивается; объект сравнивается с примитивом после `ToPrimitive`."),
      ul(
        "`0 == \"\"` и `0 == \"0\"` — `true`, но `\"\" == \"0\"` — `false`: `==` не транзитивно.",
        "`[] == false` — `true`: пустой массив → строка `\"\"` → число `0`; `false` → `0`. При этом `[]` истинен (`if ([])` выполняется).",
        "`true == 2` — `false` (`true` → `1`), и `true == \"1\"` — `true`.",
        "`NaN` не равен ничему по `==` и `===`; `Object.is(NaN, NaN)` — `true`.",
      ),
      tip("Практическое правило: **всегда `===` и `!==`**. Единственное осмысленное исключение — `value == null`: короткая запись для `value === null || value === undefined`."),

      h("Сравнения `<`, `>`, `<=`, `>=`"),
      p("Если оба операнда — строки, они сравниваются лексикографически по кодовым единицам UTF-16; иначе оба приводятся к числам. Замер:"),
      code("js", `console.log('"10" < "9"', "10" < "9");
console.log('"10" < 9', "10" < 9);
console.log("[2] > 1", [2] > 1);
console.log("null >= 0", null >= 0, " null == 0", null == 0, " null > 0", null > 0);
console.log("undefined >= 0", undefined >= 0, " undefined == 0", undefined == 0);
console.log("NaN < 1", NaN < 1, " NaN >= 1", NaN >= 1);
console.log("[10, 9, 1].sort()", [10, 9, 1].sort());
console.log("[10, 9, 1].sort((a, b) => a - b)", [10, 9, 1].sort((a, b) => a - b));
console.log('"a" < "b"', "a" < "b", ' "Z" < "a"', "Z" < "a", ' "ё" > "я"', "ё" > "я");
console.log("1 < 2 < 3", 1 < 2 < 3, " 3 > 2 > 1", 3 > 2 > 1);`, { filename: "o5-compare.mjs" }),
      code("text", `"10" < "9" true
"10" < 9 false
[2] > 1 true
null >= 0 true  null == 0 false  null > 0 false
undefined >= 0 false  undefined == 0 false
NaN < 1 false  NaN >= 1 false
[10, 9, 1].sort() [ 1, 10, 9 ]
[10, 9, 1].sort((a, b) => a - b) [ 1, 9, 10 ]
"a" < "b" true  "Z" < "a" true  "ё" > "я" true
1 < 2 < 3 true  3 > 2 > 1 false`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Строки:** `\"10\" < \"9\"` — `true` (сравнивается первый символ `\"1\"` и `\"9\"`), но `\"10\" < 9` — `false` (строка → число).",
        "**`null >= 0` — `true`, при этом `null == 0` — `false` и `null > 0` — `false`:** сравнения приводят `null` к `0`, а `==` — нет. `undefined >= 0` — `false` (`undefined` → `NaN`).",
        "**Любое сравнение с `NaN` — `false`,** в том числе `NaN >= 1`.",
        "**Сортировка:** `[10, 9, 1].sort()` дала `[1, 10, 9]` — без функции сравнения элементы сравниваются как строки. Для чисел: `sort((a, b) => a - b)`.",
        "**Кодовые единицы, а не алфавит:** `\"Z\" < \"a\"` — `true` (прописные раньше строчных), `\"ё\" > \"я\"` — `true`. Для человеческой сортировки используйте `localeCompare` или `Intl.Collator`.",
        "**Цепочка `1 < 2 < 3`** — это `(1 < 2) < 3`, то есть `true < 3`; `3 > 2 > 1` — `false` (`true > 1`).",
      ),

      h("Логические операторы возвращают операнды"),
      p("`||`, `&&`, `??` не обязаны возвращать `true`/`false`: они возвращают один из операндов и вычисляют правый операнд только при необходимости. Замер:"),
      code("js", `console.log(0 || 5, "" || "по умолчанию", "текст" || "по умолчанию");
console.log(0 && 5, 1 && 2, null && boom());
console.log(0 ?? 5, "" ?? "по умолчанию", null ?? 5, undefined ?? 5);

function boom() { throw new Error("не должно вызываться"); }

const settings = { volume: 0, title: "" };
console.log(settings.volume || 50, settings.volume ?? 50);
console.log(settings.title || "Без названия", settings.title ?? "Без названия");

let calls = 0;
const side = () => { calls++; return true; };
false && side();
true || side();
console.log("вызовов:", calls);

const user = { profile: { address: null } };
console.log(user.profile?.address?.city, user.settings?.theme, user.getName?.());
console.log(user.profile.address?.city ?? "город не указан");
try { console.log(user.settings.theme); } catch (e) { console.log(e.name + ": " + e.message); }`, { filename: "o4-logical.mjs", lineNumbers: true }),
      code("text", `5 по умолчанию текст
0 2 null
0  5 5
50 0
Без названия 
вызовов: 0
undefined undefined undefined
город не указан
TypeError: Cannot read properties of undefined (reading 'theme')`, { filename: "вывод Node.js 22.22.0" }),
      table(
        ["Оператор", "Возвращает", "Правый операнд вычисляется"],
        [
          ["`a || b`", "`a`, если `a` истинно, иначе `b`", "только если `a` ложно"],
          ["`a && b`", "`a`, если `a` ложно, иначе `b`", "только если `a` истинно"],
          ["`a ?? b`", "`b`, если `a` — `null`/`undefined`, иначе `a`", "только если `a` — `null`/`undefined`"],
          ["`a?.b`, `a?.[k]`, `a?.()`", "`undefined`, если `a` — `null`/`undefined`, иначе `a.b`", "доступ не выполняется при `null`/`undefined`"],
        ],
        "Операторы выбора значения",
      ),
      ul(
        "**`||` и ложные значения:** `settings.volume || 50` при `volume: 0` дало `50`, `settings.volume ?? 50` — `0`. Аналогично с пустой строкой: `\"\" || \"Без названия\"` подставила запасное значение, `\"\" ?? …` — нет.",
        "**Короткое замыкание:** `null && boom()` не вызвала `boom`; в замере счётчик вызовов после `false && side()` и `true || side()` остался `0`.",
        "**`?.` защищает цепочку:** `user.settings?.theme` — `undefined`, а `user.settings.theme` бросает `TypeError: Cannot read properties of undefined (reading 'theme')`. `?.` реагирует только на `null` и `undefined`, а не на любые ложные значения.",
        "**Смешение `??` с `||`/`&&` без скобок — синтаксическая ошибка;** пишите `(a ?? b) || c`.",
      ),

      h("`ToPrimitive`: как объект становится примитивом"),
      p("Когда оператору нужен примитив, а операнд — объект, вызывается `ToPrimitive` с подсказкой: `\"string\"` (шаблонные строки, `String()`), `\"number\"` (`-`, `*`, `<`, `>`, унарный `+`) или `\"default\"` (`+`, `==`). Если у объекта есть метод `[Symbol.toPrimitive](hint)`, используется он. Иначе при подсказке `\"string\"` сначала вызывается `toString`, затем `valueOf`; при остальных — `valueOf`, затем `toString` (первый, вернувший примитив). Замер:"),
      code("js", `const price = {
  amount: 250,
  [Symbol.toPrimitive](hint) {
    console.log("  hint:", hint);
    return hint === "string" ? \`\${this.amount} ₽\` : this.amount;
  },
};
console.log("шаблон:", \`\${price}\`);
console.log("плюс:", price + 1);
console.log("минус:", price - 50);
console.log("сравнение:", price > 200);
console.log("==:", price == 250);

const legacy = { valueOf() { return 7; }, toString() { return "семь"; } };
console.log(legacy + 1, \`\${legacy}\`, String(legacy), legacy * 2);

const d = new Date(0);
console.log(typeof (d + 1), typeof (d - 1));`, { filename: "o6-toprimitive.mjs", lineNumbers: true }),
      code("text", `  hint: string
шаблон: 250 ₽
  hint: default
плюс: 251
  hint: number
минус: 200
  hint: number
сравнение: true
  hint: default
==: true
8 семь семь 14
string number`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "Замер подсказок: шаблонная строка — `string`; `price + 1` и `price == 250` — `default`; `price - 50` и `price > 200` — `number`.",
        "У `legacy` с `valueOf` → `7` и `toString` → `\"семь\"`: `legacy + 1` — `8` (подсказка `default` → `valueOf`), шаблонная строка — `\"семь\"`, `legacy * 2` — `14`.",
        "У `Date` подсказка `default` трактуется как `string`: `typeof (d + 1)` — `string`, а `typeof (d - 1)` — `number`.",
      ),

      h("Остальные операторы"),
      code("js", `const opts = { retries: 0, name: "", cache: null };
opts.retries ||= 3;      // 0 ложно → заменяем
opts.name ??= "аноним";  // "" не null/undefined → оставляем
opts.cache ??= new Map();
opts.flag &&= "on";      // undefined → остаётся undefined
console.log(opts.retries, JSON.stringify(opts.name), opts.cache instanceof Map, opts.flag);

let a = 5;
console.log(a++, a, ++a, a--, --a);
console.log(7 % 3, -7 % 3, 7 % -3, 2 ** 3 ** 2, (-2) ** 2);
console.log(5 / 2, Math.trunc(5 / 2), 5 / 2 | 0, ~~(-5 / 2), Math.floor(-5 / 2));
console.log(1 << 3, 0b1010 & 0b0110, 0b1010 | 0b0110, 0b1010 ^ 0b0110, 2 ** 31 | 0);
console.log(void 0, typeof void 0, (1, 2, 3));
console.log("a" in { a: 1 }, "x" in { a: 1 }, delete opts.name, "name" in opts);`, { filename: "o7-assign.mjs", lineNumbers: true }),
      code("text", `3 "" true undefined
5 6 7 7 5
1 -1 1 512 4
2.5 2 2 -2 -3
8 2 14 12 -2147483648
undefined undefined 3
true false true false`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Присваивания с короткого замыкания:** `a ||= b` присваивает, только если `a` ложно; `a ??= b` — только если `a` — `null`/`undefined`; `a &&= b` — только если `a` истинно. В замере `opts.retries ||= 3` заменило `0` на `3`, а `opts.name ??= \"аноним\"` оставило `\"\"`.",
        "**Инкремент:** `a++` возвращает старое значение, `++a` — новое.",
        "**Остаток `%` берёт знак делимого:** `-7 % 3` — `-1`, `7 % -3` — `1`. `**` правоассоциативен: `2 ** 3 ** 2` — `512`; `-2 ** 2` без скобок — синтаксическая ошибка, пишите `(-2) ** 2`.",
        "**Деление всегда дробное:** `5 / 2` — `2.5`; целая часть — `Math.trunc(5 / 2)`. Побитовые `| 0` и `~~` тоже отбрасывают дробную часть, но работают в 32 битах: `2 ** 31 | 0` — `-2147483648`.",
        "**`typeof`, `void`, `in`, `delete`:** `void 0` — `undefined`; `\"a\" in obj` проверяет наличие свойства; `delete obj.key` удаляет свойство; оператор «запятая» `(1, 2, 3)` вычисляет все и возвращает последнее.",
      ),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const DECIMAL = /^[+-]?(\\d+\\.?\\d*|\\.\\d+)(e[+-]?\\d+)?$/i;

export function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;       // null, undefined, boolean, массивы, объекты
  const text = value.trim();
  if (!DECIMAL.test(text)) return null;             // "", "12px", "0x10", "1,5", "Infinity"
  const n = Number(text);
  return Number.isFinite(n) ? n : null;             // "1e999" → Infinity → null
}`,
        [
          { line: 1, text: "Регулярное выражение для десятичной записи: необязательный знак, целая и дробная часть (`12`, `5.`, `.5`), необязательная экспонента." },
          { line: 3, text: "Экспорт функции модуля: `export` делает её доступной для `import`." },
          { line: 4, text: "Для типа `number` допускаем только конечные значения: `NaN` и `Infinity` отбрасываются." },
          { line: 5, text: "Любой тип, кроме `string` и `number` (`null`, `undefined`, `boolean`, массивы, объекты), не считается числом — явное решение вместо неявного приведения." },
          { line: 6, text: "`trim()` убирает пробелы по краям строки." },
          { line: 7, text: "Проверка формата регулярным выражением отсекает пустую строку, `\"12px\"`, `\"0x10\"`, `\"1,5\"`, `\"Infinity\"`." },
          { line: [8, 9], text: "Когда формат проверен, `Number(text)` безопасен; дополнительная проверка `isFinite` отбросит переполнение вроде `\"1e999\"`." },
        ],
        "to-number.mjs",
      ),
    ]),

    section("minimal-example", [
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Сумма из полей</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 1.5rem; max-width: 28rem; }
  label { display: block; margin-block: .5rem; }
  output { display: block; margin-top: .75rem; font-family: ui-monospace, monospace; }
</style>
<h1>Сумма двух полей</h1>
<form id="f">
  <label>A <input name="a" value="2" inputmode="decimal"></label>
  <label>B <input name="b" value="3" inputmode="decimal"></label>
  <button>Посчитать</button>
</form>
<output id="out"></output>
<script type="module">
  const form = document.querySelector("#f");
  const out = document.querySelector("#out");

  function calc() {
    const a = form.elements.a.value;                     // value всегда строка
    const b = form.elements.b.value;
    const lines = [
      \`typeof a: \${typeof a}\`,
      \`a + b: \${JSON.stringify(a + b)}\`,                 // склейка строк
      \`Number(a) + Number(b): \${Number(a) + Number(b)}\`, // сложение чисел
    ];
    out.textContent = lines.join("\\n");
    out.style.whiteSpace = "pre";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calc();
  });
  calc();
</script>`, { filename: "sum-form.html", runnable: true, lineNumbers: true }),
      p("Замер в Chromium 141: по умолчанию (`2` и `3`) страница печатает `typeof a: string`, `a + b: \"23\"`, `Number(a) + Number(b): 5`. При пустом втором поле (`10` и пустая строка) `a + b` — `\"10\"`, а `Number(\"\")` — `0`, поэтому сумма `10` скрывает пропуск ввода. При вводе `1,5` и `2` получается `\"1,52\"` и `NaN`."),
    ]),

    section("detailed-example", [
      p("Функция `toNumber(value)` из примера превращает «пользовательский ввод» в число **или в `null`**, не полагаясь на неявные преобразования. Ниже — проверки (24 случая) и сравнение с `Number()`."),
      code("js", `const DECIMAL = /^[+-]?(\\d+\\.?\\d*|\\.\\d+)(e[+-]?\\d+)?$/i;

export function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;       // null, undefined, boolean, массивы, объекты
  const text = value.trim();
  if (!DECIMAL.test(text)) return null;             // "", "12px", "0x10", "1,5", "Infinity"
  const n = Number(text);
  return Number.isFinite(n) ? n : null;             // "1e999" → Infinity → null
}`, { filename: "to-number.mjs", lineNumbers: true }),
      code("js", `import { toNumber } from "./to-number.mjs";

const cases = [
  ["12", 12], [" 12 ", 12], ["-3.5", -3.5], ["+7", 7], ["1e3", 1000], [".5", 0.5], ["5.", 5],
  ["", null], ["   ", null], ["12px", null], ["0x10", null], ["1,5", null], ["Infinity", null], ["1e999", null],
  [null, null], [undefined, null], [true, null], [[], null], [[5], null], [{}, null],
  [NaN, null], [Infinity, null], [7, 7], [0, 0],
];
let failed = 0;
for (const [input, expected] of cases) {
  const got = toNumber(input);
  if (!Object.is(got, expected)) { failed++; console.log("FAIL", String(input), "ожидалось", expected, "получено", got); }
}
console.log(failed === 0 ? \`Все \${cases.length} проверок пройдены\` : \`Провалено: \${failed}\`);
console.log('Number("") =', Number(""), '| toNumber("") =', toNumber(""));
console.log('Number("0x10") =', Number("0x10"), '| toNumber("0x10") =', toNumber("0x10"));
console.log("Number([5]) =", Number([5]), "| toNumber([5]) =", toNumber([5]));
console.log("Number(null) =", Number(null), "| toNumber(null) =", toNumber(null));`, { filename: "to-number-test.mjs", collapsed: true }),
      code("text", `Все 24 проверок пройдены
Number("") = 0 | toNumber("") = null
Number("0x10") = 16 | toNumber("0x10") = null
Number([5]) = 5 | toNumber([5]) = null
Number(null) = 0 | toNumber(null) = null`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Ввод", "`Number(x)`", "`toNumber(x)`", "Почему различаются"],
        [
          ["`\"\"` и `\"   \"`", "`0`", "`null`", "Пустой ввод — не число; `Number` молча превращает его в `0` и скрывает пропуск"],
          ["`\"0x10\"`", "`16`", "`null`", "Пользователь вряд ли имел в виду шестнадцатеричную запись"],
          ["`[5]`", "`5`", "`null`", "Массив из одного элемента превращается в строку `\"5\"`, затем в число; для ввода это недопустимо"],
          ["`null`", "`0`", "`null`", "`null` — «значения нет», а не ноль"],
          ["`\"12px\"`", "`NaN`", "`null`", "Оба отказывают, но `null` не заражает расчёт значением `NaN`"],
          ["`\"1e999\"`", "`Infinity`", "`null`", "Переполнение — тоже ошибка ввода"],
        ],
        "Сравнение Number и toNumber",
      ),
      ul(
        "Функция возвращает **`null`** для «не число» вместо `NaN`: `null` легко проверить (`=== null`) и нельзя случайно сложить с числом без заметной ошибки при отладке.",
        "Регулярное выражение отвечает за **формат**, `Number` — за **значение**; так не нужны разбор строки вручную и догадки о локали.",
        "Запятую как десятичный разделитель функция отвергает (`\"1,5\"` → `null`): локализованный ввод требует отдельной обработки (`Intl`), а не угадывания.",
      ),
    ]),

    section("internals", [
      h("Алгоритм абстрактного равенства (`==`)"),
      steps(
        [
          ["Один тип", "Если типы операндов совпадают, результат — как у `===`."],
          ["`null` и `undefined`", "`null == undefined` — `true`; сравнение `null`/`undefined` с чем-либо ещё — `false`."],
          ["Число и строка", "Строка преобразуется в число, сравнение повторяется."],
          ["Логическое значение", "`true` → `1`, `false` → `0`, сравнение повторяется (поэтому `true == \"1\"` — `true`, а `true == 2` — `false`)."],
          ["Объект и примитив", "Объект преобразуется через `ToPrimitive` (подсказка `default`), сравнение повторяется."],
          ["`bigint` и `number`/`string`", "Сравниваются математические значения (`1n == 1` — `true`, `\"1\" == 1n` — `true`), но `===` для разных типов даёт `false` (замер)."],
        ],
        "Упрощённый ход `==`",
      ),
      p("Разберём `[] == ![]`: правая часть `![]` — `false` (`[]` истинен, отрицание даёт `false`), затем `false` → `0`; левая часть `[]` → `\"\"` (через `toString`) → `0`. Итог `0 == 0` — `true`. Замер: `[] == ![]` — `true`."),
      h("Алгоритм `ToPrimitive`"),
      p("Для объекта `ToPrimitive(input, hint)` ищет метод `input[Symbol.toPrimitive]`; найдя, вызывает его с подсказкой и требует примитивный результат (иначе `TypeError`). Если метода нет, срабатывает «обычный» алгоритм: подсказка `\"string\"` — порядок `toString`, `valueOf`; остальные — `valueOf`, `toString`. Базовый `valueOf` у обычных объектов возвращает сам объект (не примитив), поэтому используется `toString`, откуда и `\"[object Object]\"`."),
      h("Почему `typeof NaN` — `number`, а `NaN !== NaN`"),
      p("`NaN` — особое значение формата IEEE 754, определённое так, чтобы любое сравнение с ним давало «не равно». Поэтому проверка требует отдельной функции `Number.isNaN` или `Object.is`."),
      h("Побитовые операторы и 32 бита"),
      p("Побитовые операторы переводят операнды в 32-битные целые со знаком, выполняют операцию и возвращают число. Поэтому `2 ** 31 | 0` — `-2147483648` (замер): значение выходит за диапазон и «заворачивается». Для обычной арифметики эти операторы не нужны; они применяются для флагов и масок."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Подставлять значение по умолчанию через `||`"),
      wrongRight(
        "js",
        {
          code: `
            const volume = settings.volume || 50;      // volume: 0 → 50
            const title = settings.title || "Без названия"; // title: "" → "Без названия"
          `,
          note: "Ложные, но допустимые значения (`0`, `\"\"`, `false`) заменяются запасными. Замер: `{ volume: 0 }` → `50`.",
        },
        {
          code: `
            const volume = settings.volume ?? 50;
            const title = settings.title ?? "Без названия";
          `,
          note: "`??` подставляет запасное значение только для `null` и `undefined`.",
        },
      ),
      h("Ошибка 2. Складывать значения форм без преобразования"),
      p("`input.value` — строка, поэтому `a + b` склеивает: `\"2\" + \"3\"` — `\"23\"` (замер на странице). Преобразуйте явно и проверьте результат: `Number.isFinite(n)`."),
      h("Ошибка 3. Использовать `==` с «похожими» значениями"),
      p("`0 == \"\"`, `0 == \"0\"`, `[] == false` — все `true`, а `\"\" == \"0\"` — `false`: правила не транзитивны. Пишите `===`."),
      h("Ошибка 4. Проверять массив через `if (arr)`"),
      p("`[]` истинен (замер: `Boolean([])` — `true`). Для пустоты проверяйте `arr.length === 0`. Так же `\"0\"` и `\"false\"` — истинные строки."),
      h("Ошибка 5. Сортировать числа без функции сравнения"),
      p("`[10, 9, 1].sort()` — `[1, 10, 9]` (замер): элементы сравниваются как строки. Нужно `sort((a, b) => a - b)`."),
      h("Ошибка 6. Сравнивать с `NaN` напрямую"),
      p("`x === NaN` и `x == NaN` всегда `false`. Используйте `Number.isNaN(x)`."),
      h("Ошибка 7. Использовать `parseInt` без основания"),
      p("`parseInt(\"0x10\")` — `16`: без второго аргумента префикс определяет систему счисления. Пишите `parseInt(s, 10)` — и помните, что `parseInt(\"12px\", 10)` — `12`: функция читает число с начала строки и отбрасывает остаток."),
      h("Ошибка 8. Смешивать `??` и `||` без скобок"),
      p("`a ?? b || c` — `SyntaxError`. Используйте скобки, чтобы выразить намерение: `(a ?? b) || c`."),
    ]),

    section("antipatterns", [
      ul(
        "**`==` вместо `===`** вне идиомы `value == null`.",
        "**Неявная склейка в расчётах:** `\"Итого: \" + a + b` при числах `a` и `b` даёт строку цифр; используйте шаблонные строки и скобки.",
        "**`||` для значений по умолчанию** там, где допустимы `0`, `\"\"`, `false`.",
        "**Тернарные цепочки с приведением:** `x ? 1 : 0` вместо `Number(Boolean(x))` или явного условия там, где важна ясность.",
        "**Доверие к `isNaN` (глобальной):** она приводит аргумент к числу — `isNaN(\"abc\")` — `true`.",
        "**Игры с `+[]`, `!![]`, `[] + {}`** в рабочем коде: это интересно на собеседованиях, но делает код нечитаемым.",
        "**Магические преобразования `x | 0`, `~~x`, `+x`** без комментария и без понимания 32-битных границ.",
        "**Цепочки сравнений `a < b < c`:** они вычисляются как `(a < b) < c`.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Сравнивайте через `===` и `!==`;** `== null` — единственное осознанное исключение.",
        "**Преобразуйте явно:** `Number(x)`, `String(x)`, `Boolean(x)`, и сразу проверяйте результат (`Number.isFinite`).",
        "**Для значений по умолчанию используйте `??`,** а для логических условий — `||`/`&&`, понимая разницу.",
        "**Для оптимистичного чтения вложенных данных — `?.`,** но не заменяйте им валидацию: `?.` скрывает отсутствие данных, а не исправляет его.",
        "**Валидируйте пользовательский ввод** функцией, которая возвращает число или явную ошибку, а не `NaN`.",
        "**Для пустоты проверяйте суть** (`length === 0`, `Object.keys(o).length === 0`), а не истинность значения.",
        "**Сортируйте числа и строки осознанно:** `(a, b) => a - b` для чисел, `localeCompare`/`Intl.Collator` для текста.",
        "**Включайте линтер:** правила `eqeqeq`, `no-implicit-coercion`, `no-unsafe-optional-chaining` ловят большую часть проблем.",
      ),
      tip("Если не уверены, как будет приведено выражение, не вычисляйте это в уме: выполните в консоли DevTools. И перепишите код так, чтобы вопрос не возникал."),
    ]),

    section("edge-cases", [
      h("`document.all` — единственное «ложное» объектное значение"),
      p("В браузерах `document.all` — объект, но ведёт себя как `undefined`: замер в Chromium 141 — `Boolean(document.all)` — `false`, `typeof document.all` — `\"undefined\"`, `document.all == null` — `true`. Это исторический обход для старых сайтов, описанный в HTML Standard. В новом коде его не используют."),
      h("`BigInt` и сравнения"),
      p("`1n == 1` — `true`, `1n === 1` — `false`, `2n > 1` — `true` (замер); арифметика `bigint` с `number` — `TypeError`."),
      h("Объекты `Date` и `+`"),
      p("`Date` при подсказке `default` ведёт себя как строка: `date + 1` — строка, `date - 1` — число (замер). Поэтому `+new Date()` и `Number(date)` дают отметку времени в миллисекундах."),
      h("Числовые строки с пробелами и разделителями"),
      p("`Number(\"  \\n12\\t\")` — `12` (пробельные символы по краям отбрасываются), `Number(\"1_000\")` — `NaN`: разделитель разрядов допустим только в литерале кода (`1_000`), но не в строке. `Number(\"0b101\")` — `5`, `Number(\"-0x10\")` — `NaN`."),
      h("`-0` в условиях"),
      p("`-0` ложно, `-0 === 0` — `true`; различает их только `Object.is` и деление (`1 / -0` — `-Infinity`)."),
      h("`null` в сравнениях"),
      p("`null >= 0` — `true`, но `null == 0` — `false` (замер): операторы `>=` и `==` реализованы разными алгоритмами. Не опирайтесь на сравнение `null` с числом."),
    ]),

    section("related", [
      ul(
        "[Что такое JavaScript](/learn/js/what-is-js) — среды, режимы и способы загрузки кода.",
        "[Переменные и типы данных](/learn/js/variables-types) — типы, `typeof`, `number`, ссылки.",
        "[Формы](/learn/html/form-controls) — откуда берутся строковые значения `input.value`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Неявные преобразования",
          code: `
            function total(a, b, discount) {
              const d = discount || 10;          // скидка 0 → 10
              if (a == b) return "equal";        // "1" == 1
              return a + b - d;                  // "2" + "3" - 10 → 13
            }
          `,
          note: "Ложная скидка заменяется на 10, `==` смешивает типы, `+` склеивает строки, а `-` потом превращает результат в число.",
        },
        {
          title: "Явные преобразования и проверки",
          code: `
            function total(a, b, discount) {
              const x = toNumber(a);
              const y = toNumber(b);
              if (x === null || y === null) return null;
              const d = discount ?? 10;
              return x + y - d;
            }
          `,
          note: "Ввод проверяется функцией `toNumber`; значение по умолчанию подставляется только при `null`/`undefined`; сложение происходит над числами.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.operators-coercion.ex1",
      title: "Предскажите вывод",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код, скажите, что напечатает каждая строка, и объясните каждый результат через три преобразования."),
        code("js", `console.log([] + {});
console.log("1" + 2 + 3, 1 + 2 + "3");
console.log(null == 0, null >= 0);
console.log(0 || "а", 0 ?? "б", "" && "в");
console.log([] == false, [] ? "истинно" : "ложно");
console.log(NaN == NaN, Object.is(NaN, NaN));`, { filename: "x1-predict.mjs" }),
      ],
      hints: ["Что делает `+`, когда один операнд — объект?", "В какое число превращается `null` при сравнении `>=`, а при `==`?"],
      checks: ["Шесть строк вывода объяснены", "Названы приведения объектов и `null`", "Различены `ToBoolean` и `ToNumber`"],
      solution: [
        code("text", `[object Object]
123 33
false true
а 0 
true истинно
false true`, { filename: "вывод Node.js 22.22.0" }),
        ul(
          "`[] + {}` — оба объекта → строки `\"\"` и `\"[object Object]\"`, склейка: `\"[object Object]\"`.",
          "`\"1\" + 2 + 3` — склейка с самого начала: `\"123\"`; `1 + 2 + \"3\"` — сначала `3`, потом склейка: `\"33\"`.",
          "`null == 0` — `false` (`null` равен только `undefined`); `null >= 0` — `true` (сравнение приводит `null` к `0`).",
          "`0 || \"а\"` — `\"а\"` (ноль ложен); `0 ?? \"б\"` — `0`; `\"\" && \"в\"` — `\"\"` (первый ложный операнд).",
          "`[] == false` — `true` (`[]` → `\"\"` → `0`, `false` → `0`), но `[]` в условии истинен.",
          "`NaN == NaN` — `false`, `Object.is(NaN, NaN)` — `true`.",
        ),
      ],
    }),
    exercise({
      id: "js.operators-coercion.ex2",
      title: "Громкость ноль",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Пользователи жалуются: «Не получается выключить звук — при громкости 0 плеер снова ставит 50». Найдите причину и исправьте функцию `volume(settings)`, чтобы `0` сохранялся, а `null`/`undefined` заменялись на `50`."),
      ],
      hints: ["Какое значение `0` в логическом контексте?", "Какой оператор реагирует только на `null` и `undefined`?"],
      checks: ["Названа причина (`||` и ложный `0`)", "Исправление через `??`", "Проверены `0`, `30`, отсутствие и `null`"],
      solution: [
        code("js", `function volumeBad(settings) {
  return settings.volume || 50;      // 0 — ложное значение, поэтому «0» превращается в 50
}
function volume(settings) {
  return settings.volume ?? 50;      // подставляем 50 только для null и undefined
}
const cases = [{ volume: 0 }, { volume: 30 }, {}, { volume: null }];
for (const s of cases) console.log(JSON.stringify(s).padEnd(14), "было:", volumeBad(s), " стало:", volume(s));`, { filename: "x2-volume.mjs" }),
        code("text", `{"volume":0}   было: 50  стало: 0
{"volume":30}  было: 30  стало: 30
{}             было: 50  стало: 50
{"volume":null} было: 50  стало: 50`, { filename: "вывод Node.js 22.22.0" }),
        p("`||` подставляет запасное значение для любого ложного операнда, а `0` ложно. `??` реагирует только на `null` и `undefined`, поэтому `{ volume: 0 }` остаётся `0`."),
      ],
    }),
    exercise({
      id: "js.operators-coercion.ex3",
      title: "Что считать «пустым»",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Напишите `isEmpty(value)` для проверки данных формы: пустыми считаются `null`, `undefined`, строки из пробелов, пустые массивы и объекты без собственных ключей. Значения `0`, `false`, `NaN`, `\"0\"`, `[0]` пустыми **не** считаются."),
      ],
      hints: ["Одно условие `!value` не годится: почему?", "Как проверить `null` и `undefined` одним выражением?"],
      checks: ["12 проверочных значений", "`0` и `false` — не пустые", "Пустой объект и пустой массив — пустые"],
      solution: [
        code("js", `export function isEmpty(value) {
  if (value == null) return true;                                   // null и undefined
  if (typeof value === "string") return value.trim() === "";        // "" и "   "
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;                                                     // 0, false, NaN, функции — не «пустые»
}

const cases = [
  [undefined, true], [null, true], ["", true], ["  ", true], [[], true], [{}, true],
  [0, false], [false, false], [NaN, false], ["0", false], [[0], false], [{ a: undefined }, false],
];
const show = (v) => (typeof v === "string" ? JSON.stringify(v) : Number.isNaN(v) ? "NaN" : v === undefined ? "undefined" : JSON.stringify(v));
for (const [v, expected] of cases) {
  const got = isEmpty(v);
  console.log((got === expected ? "ok  " : "FAIL"), show(v), "→", got);
}`, { filename: "x3-isempty.mjs" }),
        code("text", `ok   undefined → true
ok   null → true
ok   "" → true
ok   "  " → true
ok   [] → true
ok   {} → true
ok   0 → false
ok   false → false
ok   NaN → false
ok   "0" → false
ok   [0] → false
ok   {} → false`, { filename: "вывод Node.js 22.22.0" }),
        p("`!value` ловит `0`, `false`, `NaN` и `\"\"` — а нужны не все. Поэтому проверка идёт по типам: `value == null` (идиома для `null`/`undefined`), строка — через `trim()`, массив — `length`, объект — `Object.keys`."),
      ],
    }),
  ],

  challenge: {
    id: "js.operators-coercion.challenge",
    title: "Безопасное преобразование пользовательского ввода",
    scenario: [
      p("В калькуляторе заказа поле «Количество» приходит строкой, иногда пустой или с единицами («12px», «1,5»). `Number()` превращает пустую строку в `0` и скрывает ошибку, а `parseInt` отрезает «хвосты». Напишите модуль `to-number.mjs` с функцией `toNumber(value)`: она возвращает **число или `null`**, не допуская неявных преобразований."),
    ],
    requirements: [
      "Принимает десятичные записи: знак, целая и дробная часть (`\"12\"`, `\"+7\"`, `\"-3.5\"`, `\"5.\"`, `\".5\"`), экспонента (`\"1e3\"`), пробелы по краям",
      "Возвращает `null` для: пустой строки и строки из пробелов, `\"12px\"`, `\"0x10\"`, `\"1,5\"`, `\"Infinity\"`, `\"1e999\"`",
      "Не-строки: конечные `number` возвращаются как есть; `NaN`, `Infinity`, `null`, `undefined`, `boolean`, массивы и объекты — `null`",
      "Не бросает исключений ни для какого ввода",
    ],
    constraints: [
      "Нельзя использовать `parseInt`/`parseFloat` (они принимают «хвосты»)",
      "Нельзя полагаться на неявное преобразование `Number([5])` и `Number(null)`",
    ],
    acceptance: [
      "Все 24 проверочных случая проходят",
      "`toNumber(\"\")` — `null`, при этом `Number(\"\")` — `0`",
      "`toNumber([5])` — `null`, при этом `Number([5])` — `5`",
    ],
    hints: [
      "Как проверить формат строки до преобразования?",
      "Какие типы нужно отсеять до вызова `Number`?",
      "Что вернёт `Number(\"1e999\")`?",
    ],
    solution: [
      code("js", `const DECIMAL = /^[+-]?(\\d+\\.?\\d*|\\.\\d+)(e[+-]?\\d+)?$/i;

export function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;       // null, undefined, boolean, массивы, объекты
  const text = value.trim();
  if (!DECIMAL.test(text)) return null;             // "", "12px", "0x10", "1,5", "Infinity"
  const n = Number(text);
  return Number.isFinite(n) ? n : null;             // "1e999" → Infinity → null
}`, { filename: "to-number.mjs", lineNumbers: true }),
      code("text", `Все 24 проверок пройдены
Number("") = 0 | toNumber("") = null
Number("0x10") = 16 | toNumber("0x10") = null
Number([5]) = 5 | toNumber([5]) = null
Number(null) = 0 | toNumber(null) = null`, { filename: "результат запуска тестов" }),
      p("Формат проверяет регулярное выражение, значение — `Number`, диапазон — `Number.isFinite`. Благодаря тому, что функция отсеивает типы до вызова `Number`, массивы и `null` не превращаются в числа."),
    ],
  },

  interview: [
    iq("js.operators-coercion.i1", "basic", "Чем `==` отличается от `===`?", [
      ul(
        "`===` сравнивает без приведения типов; значения разных типов не равны.",
        "`==` приводит типы по правилам абстрактного равенства (`0 == \"\"` — `true`, `null == undefined` — `true`).",
        "Рекомендация: всегда `===`; исключение — `value == null` для проверки на `null` и `undefined` сразу.",
      ),
    ]),
    iq("js.operators-coercion.i2", "basic", "Какие значения в JavaScript ложные?", [
      p("Восемь: `false`, `0`, `-0`, `0n`, `\"\"`, `null`, `undefined`, `NaN`. Всё остальное — истинное, включая `\"0\"`, `\"false\"`, `[]`, `{}`. (В браузерах есть ещё исторический `document.all`.)"),
    ]),
    iq("js.operators-coercion.i3", "intermediate", "Чем `??` отличается от `||`?", [
      ul(
        "`a || b` — `b`, если `a` ложно (`0`, `\"\"`, `false`, `NaN` тоже).",
        "`a ?? b` — `b`, только если `a` — `null` или `undefined`.",
        "Для значений по умолчанию, где `0` и `\"\"` допустимы, нужен `??`: `settings.volume ?? 50` при `0` оставляет `0`.",
      ),
    ]),
    iq("js.operators-coercion.i4", "intermediate", "Почему `\"1\" + 2` — `\"12\"`, а `\"5\" - 2` — `3`?", [
      ul(
        "`+` — и сложение, и склейка: если после `ToPrimitive` есть строка, склеивает.",
        "`-`, `*`, `/` — только числовые: операнды приводятся к числам.",
        "Порядок слева направо: `1 + 2 + \"3\"` — `\"33\"`, `\"1\" + 2 + 3` — `\"123\"`.",
      ),
    ]),
    iq("js.operators-coercion.i5", "intermediate", "Что такое короткое замыкание?", [
      ul(
        "`&&`, `||`, `??` вычисляют правый операнд, только если результат нельзя определить по левому.",
        "Поэтому `user && user.name`, `cache ??= load()`, `x || compute()` безопасны и экономны.",
        "Побочные эффекты правой части могут не выполниться — на этом строятся идиомы вроде `ok && log(\"…\")`.",
      ),
    ]),
    iq("js.operators-coercion.i6", "advanced", "Объясните, как работает `ToPrimitive` и чем отличаются подсказки.", [
      ul(
        "Если есть `[Symbol.toPrimitive](hint)`, он вызывается с `\"string\"`, `\"number\"` или `\"default\"`.",
        "Иначе при `\"string\"` порядок `toString` → `valueOf`, при остальных `valueOf` → `toString`.",
        "`+` и `==` используют `default`, арифметика и сравнения — `number`, шаблонные строки — `string`; у `Date` `default` трактуется как `string`.",
      ),
    ]),
    iq("js.operators-coercion.i7", "engineering", "Как бы вы валидировали числовое поле формы?", [
      ul(
        "Не использовать `Number()`/`parseInt` напрямую: пустая строка → `0`, `\"12px\"` → `12` (parseInt).",
        "Проверить формат регулярным выражением или `inputmode`/`type=number` с `valueAsNumber`, затем `Number` и `Number.isFinite`.",
        "Вернуть явный результат (`число | null` или объект ошибки), показать пользователю сообщение.",
        "Учесть локаль (запятая как разделитель) через `Intl`, а не угадыванием.",
      ),
    ]),
    iq("js.operators-coercion.i8", "debugging", "Подсчёт итога в корзине выдаёт `\"0100\"` вместо `100`. Как искать причину?", [
      ul(
        "Выписать типы слагаемых: `typeof` каждого; скорее всего значения пришли строками (из формы или JSON).",
        "Найти место, где к строке добавляется число: `\"0\" + 100`.",
        "Привести к числам на границе (`Number(...)`, `toNumber`), проверить `Number.isFinite`.",
        "Добавить тест с граничными вводами (пустая строка, пробелы, запятая).",
      ),
    ]),
  ],

  exam: [
    mcq("js.operators-coercion.e1", "foundation", "Что вернёт `\"5\" - 2`?", ["`\"52\"`", "`NaN`", "`3`", "`\"3\"`"], 2, "Оператор `-` всегда числовой: строка `\"5\"` приводится к числу, результат `3`."),
    mcq("js.operators-coercion.e2", "foundation", "Какое значение ложно?", ["`NaN`", "`[]`", "`\"0\"`", "`{}`"], 0, "Ложные: `false`, `0`, `-0`, `0n`, `\"\"`, `null`, `undefined`, `NaN`; строка `\"0\"`, `[]` и `{}` — истинные."),
    mcq("js.operators-coercion.e3", "intermediate", "Что вернёт `0 ?? 5`?", ["`5`", "`undefined`", "`null`", "`0`"], 3, "`??` подставляет правый операнд только для `null`/`undefined`; `0` остаётся."),
    mcq("js.operators-coercion.e4", "intermediate", "Что вернёт `null == 0` и `null >= 0`?", ["`true` и `true`", "`false` и `true`", "`false` и `false`", "`true` и `false`"], 1, "`==` для `null` равно только `undefined`; `>=` приводит `null` к `0`."),
    mcq("js.operators-coercion.e5", "intermediate", "Какие выражения равны `true`? Выберите все.", ["`[] == false`", "`NaN == NaN`", "`null == undefined`", "`[] === []`"], [0, 2], "`[]` → `\"\"` → `0`, `false` → `0`; `null == undefined` — `true`; `NaN` не равен себе, а два разных массива не равны по `===`."),
    mcq("js.operators-coercion.e6", "advanced", "Что вернёт `[10, 9, 1].sort()`?", ["`[1, 9, 10]`", "`[9, 10, 1]`", "`[10, 9, 1]`", "`[1, 10, 9]`"], 3, "Без функции сравнения элементы сравниваются как строки: `\"1\" < \"10\" < \"9\"`."),
    open("js.operators-coercion.e7", "intermediate", "Объясните, почему `[] + {}` и `[] == ![]` дают такие результаты.", [
      ul(
        "`[] + {}`: оба операнда — объекты, `ToPrimitive` даёт строки `\"\"` и `\"[object Object]\"`; `+` склеивает.",
        "`[] == ![]`: `![]` — `false` (массив истинен); `false` → `0`; `[]` → `\"\"` → `0`; сравнение `0 == 0` — `true`.",
        "Вывод: правила применяются последовательно; в рабочем коде таких выражений быть не должно.",
      ),
    ], ["Объяснён `ToPrimitive`", "Объяснено преобразование логического значения в число", "Сделан практический вывод"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.operators-coercion.m1", "intermediate", "Что вернёт `1 + 2 + \"3\"`?", ["`\"123\"`", "`6`", "`\"33\"`", "`NaN`"], 2, "Слева направо: сначала `1 + 2` = `3`, затем `3 + \"3\"` — склейка `\"33\"`."),
    mcq("js.operators-coercion.m2", "advanced", "Какую подсказку получит `[Symbol.toPrimitive]` при `obj - 1`?", ["`\"string\"`", "`\"number\"`", "`\"default\"`", "Метод не вызывается"], 1, "Арифметика (кроме `+`) и сравнения используют подсказку `\"number\"` (замер: `price - 50` → `hint: number`)."),
    mcq("js.operators-coercion.m3", "advanced", "Что вернёт `a ?? b || c`?", ["`SyntaxError`", "`a ?? (b || c)`", "`(a ?? b) || c`", "`undefined`"], 0, "Смешение `??` с `||`/`&&` без скобок — синтаксическая ошибка."),
    open("js.operators-coercion.m4", "advanced", "Спроектируйте разбор числового поля «Сумма» с учётом русской локали (запятая как разделитель) и нулевого ввода.", [
      ul(
        "Нормализовать строку: убрать пробелы (в том числе неразрывные), заменить запятую на точку **только** если формат подтверждён регулярным выражением.",
        "Проверять формат до `Number`; пустой ввод — отдельная ошибка «поле обязательно», не `0`.",
        "Результат — число или `null`/объект ошибки; `NaN` дальше не передавать.",
        "Для отображения — `Intl.NumberFormat(\"ru-RU\")`; для хранения денег — целые копейки.",
        "Тесты: пустая строка, пробелы, `\"1 000,5\"`, `\"1,5,5\"`, `\"12px\"`, переполнение.",
      ),
    ], ["Описана нормализация", "Описана проверка формата", "Различены пусто и ноль", "Предложены тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.operators-coercion.f1", front: "Ложные значения?", back: "false, 0, -0, 0n, \"\", null, undefined, NaN. Остальное истинно (\"0\", [], {})." },
    { id: "js.operators-coercion.f2", front: "== или ===?", back: "Всегда ===; исключение — `x == null` (null и undefined сразу)." },
    { id: "js.operators-coercion.f3", front: "?? против ||", back: "`??` — только null/undefined; `||` — любое ложное (0, \"\" тоже заменяются)." },
    { id: "js.operators-coercion.f4", front: "\"1\" + 2 и \"5\" - 2?", back: "\"12\" (склейка) и 3 (число). `+` смотрит на строку, `-` всегда числовой." },
    { id: "js.operators-coercion.f5", front: "ToPrimitive?", back: "Symbol.toPrimitive(hint) → иначе valueOf/toString (при string — toString первым). `+` и `==` — hint default." },
    { id: "js.operators-coercion.f6", front: "Значение формы?", back: "input.value — всегда строка; Number() и проверка Number.isFinite; пустая строка → 0!" },
    { id: "js.operators-coercion.f7", front: "null и сравнения?", back: "null == 0 → false, но null >= 0 → true; null == undefined → true." },
  ],

  sources: [
    { title: "ECMAScript: Type Conversion (ToPrimitive, ToNumber, ToString, ToBoolean)", url: "https://tc39.es/ecma262/#sec-type-conversion", publisher: "ECMA" },
    { title: "ECMAScript: IsLooselyEqual", url: "https://tc39.es/ecma262/#sec-islooselyequal", publisher: "ECMA" },
    { title: "ECMAScript: Equality Operators", url: "https://tc39.es/ecma262/#sec-equality-operators", publisher: "ECMA" },
    { title: "ECMAScript: The Abstract Relational Comparison", url: "https://tc39.es/ecma262/#sec-islessthan", publisher: "ECMA" },
    { title: "HTML Standard: The document.all object", url: "https://html.spec.whatwg.org/multipage/obsolete.html#dom-document-all", publisher: "WHATWG" },
    { title: "MDN: Equality comparisons and sameness", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness", publisher: "MDN" },
    { title: "MDN: Nullish coalescing operator (??)", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing", publisher: "MDN" },
    { title: "MDN: Optional chaining (?.)", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining", publisher: "MDN" },
    { title: "MDN: Symbol.toPrimitive", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive", publisher: "MDN" },
  ],
};
