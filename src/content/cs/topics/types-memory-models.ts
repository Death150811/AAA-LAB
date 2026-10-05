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
  diagram,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const typesMemoryModels: Topic = {
  id: "cs.types-memory-models",
  slug: "types-memory-models",
  domain: "cs",
  module: "languages",
  title: "Типы и модели памяти: проверка типов, представление данных, владение и сборка мусора",
  titleEn: "Types and Memory Models: Type Checking, Data Layout, Ownership and Garbage Collection",
  summary:
    "Тип говорит, какие значения допустимы и сколько байт они занимают; модель памяти говорит, кто и когда освобождает эти байты. Тема разбирает обе стороны на измерениях: настоящий компилятор TypeScript 5.9 (из 7 фрагментов отвергает 5 ошибок и пропускает 4 «дыры», которые падают во время выполнения), вывод типов по Хиндли — Милнеру на собственной реализации (6 программ типизированы без аннотаций, 5 отвергнуты, включая `λx. x x`), размер и выравнивание структур (12 байт против 8 при тех же полях, 24 против 16), области памяти процесса и кадр стека (64 байта; предел 8192 КиБ достигнут на 99,8 % и закончился сигналом SIGSEGV), шесть видов ошибок памяти (пять из них обычная сборка пропускает с кодом 0, AddressSanitizer называет каждую), владение и заимствование в Rust 1.97 (пять ошибок отвергнуты при компиляции), подсчёт ссылок против пометки и очистки (цикл утёк 2000 объектов из 2000; помечено 100 из 10 000), сборщик V8 (104 МБ после gc() — около нуля) и цену объектов Python (список из миллиона целых в 9 раз больше массива).",
  minutes: 150,
  prerequisites: ["cs.compilation-interpretation", "cs.cpu-memory-cache", "cs.virtual-memory-files"],
  tags: ["типы", "статическая типизация", "вывод типов", "структурная типизация", "выравнивание", "стек", "куча", "malloc", "use-after-free", "AddressSanitizer", "владение", "Rust", "сборка мусора", "подсчёт ссылок", "утечка памяти"],
  keyConcepts: [
    { term: "Проверка типов и её границы", text: "TypeScript 5.9 в режиме `strict` отвергает присваивание строки числу (TS2322), возможный `null` (TS18047), лишнее поле в литерале (TS2353) и неполный перебор вариантов (значение попало в тип `never`), но пропускает ковариантность массивов, `any`, `as unknown as` и `JSON.parse`: во всех четырёх случаях ошибок компиляции 0, а во время выполнения — `TypeError`. Типы стираются: после компиляции интерфейсы и аннотации исчезают." },
    { term: "Структурная и номинальная типизация", text: "Структурно совместимый объект принимается без объявления связи: переменная с лишним полем проходит, а литерал с лишним полем отвергается; псевдонимы `Meters` и `Seconds` взаимозаменяемы, а «бренд» (`number & { __brand }`) делает их различными." },
    { term: "Вывод типов", text: "Алгоритм Хиндли — Милнера нашёл `(a -> a) -> a -> a` для `λf. λx. f (f x)` и `(a -> b) -> (c -> a) -> c -> b` для композиции без единой аннотации. Обобщение в `let` разрешает `(id 1, id true)`, а параметр лямбды остаётся мономорфным и отвергается; `λx. x x` отвергнут проверкой вхождения." },
    { term: "Представление данных", text: "Тот же набор полей занимает 12 байт в порядке `char, int, char` и 8 при порядке `int, char, char`; `Mixed` с `double` — 24 байта против 16 у `Sorted` (на 50 % больше). Упакованная структура — 6 байт, но поле `int` лежит по смещению 1. Число `0x01020304` хранится как байты 4 3 2 1 (little-endian); `float 1.0` — `0x3f800000`, `−0.0` — `0x80000000`." },
    { term: "Области памяти и стек", text: "Порядок адресов: код < `.data` < `.bss` < куча < отображения (большой блок malloc, libc) < стек; стек растёт вниз. Кадр рекурсивной функции — 64 байта, предел стека — 8192 КиБ, ожидаемая глубина 131 072, достигнуто около 130 800 (99,8 %) и сигнал `SIGSEGV`. `malloc(1)` выдаёт 24 полезных байта, `malloc(25)` — 40; после `free` тот же размер возвращает тот же адрес." },
    { term: "Ошибки памяти", text: "Чтение после `free`, запись за концом блока в куче, запись за концом локального массива, выход за границы глобального массива и утечка завершились с кодом 0 без проверок; двойной `free` — 134 (SIGABRT, заметил сам распределитель). AddressSanitizer назвал все шесть; UBSan — переполнение знакового `int` и сдвиг на 32; Valgrind — `Invalid read of size 4`." },
    { term: "Владение и заимствование", text: "Rust 1.97 отверг при компиляции использование после перемещения (E0382), ссылку внутрь вектора при `push` (E0502), ссылку на умершую переменную (E0597), две изменяемые ссылки (E0499) и передачу `Rc` в поток (E0277). Освобождение — по выходу из области видимости в порядке, обратном объявлению; `Rc` — когда счётчик достиг нуля." },
    { term: "Подсчёт ссылок и трассировка", text: "Цепочка A → B → C освобождается подсчётом ссылок сразу (3 из 3); цикл X ↔ Y — никогда: в цикле из 1000 итераций утекло 2000 объектов, а пометка и очистка освободила все 2000. Стоимость пометки пропорциональна живому: 100 помеченных из 10 000. В V8 миллион объектов дал прирост кучи около 104 МБ, после `gc()` — около нуля. В CPython `sys.getrefcount` показал 2 → 3 → 4 → 3, а `list` из миллиона `int` занимает 36 000 056 байт против 4 000 000 у `array('i')` (в 9,0 раза больше)." },
  ],
  sections: [
    section("definition", [
      def("Тип", "Множество допустимых значений вместе с набором операций над ними. Тип отвечает на вопросы «что можно делать с этим значением» и «как оно представлено в памяти».", "type"),
      def("Статическая и динамическая типизация", "При статической типы проверяются до выполнения (компилятор, проверка типов); при динамической — во время выполнения, по типам значений. Типы могут проверяться статически и при этом стираться: в TypeScript после компиляции остаётся JavaScript без аннотаций.", "static / dynamic typing"),
      def("Строгая и слабая типизация", "Строгая типизация не выполняет неявных преобразований между несвязанными типами (в Python `1 + '1'` — `TypeError`); слабая выполняет (в JavaScript `1 + '1'` — строка `'11'`). Это шкала, а не бинарное свойство.", "strong / weak typing"),
      def("Структурная и номинальная типизация", "При структурной типы совместимы, если совместимы их формы (набор полей и методов); при номинальной — только если связаны объявлением (имя, наследование).", "structural / nominal typing"),
      def("Вывод типов", "Автоматическое определение типов выражений без аннотаций. Алгоритм Хиндли — Милнера использует унификацию и обобщение в `let` и находит наиболее общий тип.", "type inference"),
      def("Выравнивание и заполнение", "Поле размера k размещается по адресу, кратному k (обычно); компилятор вставляет неиспользуемые байты (padding) между полями и в конец структуры. Размер структуры зависит от порядка полей.", "alignment, padding"),
      def("Стек и куча", "Стек — область для кадров вызовов с локальными переменными; выделение и освобождение — смещением указателя, жизнь значения ограничена вызовом. Куча — область динамического выделения (`malloc`, `new`): размер и время жизни выбирает программа.", "stack, heap"),
      def("Безопасность памяти", "Свойство программы не обращаться к освобождённой памяти, не выходить за границы объектов и не читать неинициализированное. Нарушения — источник уязвимостей: use-after-free, переполнение буфера, двойное освобождение.", "memory safety"),
      def("Владение и заимствование", "Модель Rust: у каждого значения один владелец; при выходе владельца из области значение освобождается. Ссылки заимствуют значение: сколько угодно неизменяемых или одна изменяемая; компилятор проверяет это статически.", "ownership, borrowing"),
      def("Подсчёт ссылок", "Каждый объект хранит число ссылок на себя и освобождается, когда оно достигает нуля. Освобождает сразу, но не справляется с циклами.", "reference counting"),
      def("Сборка мусора (трассировка)", "Автоматическое освобождение объектов, недостижимых от корней (стек, глобальные переменные): сборщик помечает достижимые и очищает остальные. Стоимость пропорциональна числу живых объектов.", "garbage collection, mark-and-sweep"),
    ]),

    section("why", [
      h("Зачем знать, как языки обращаются с типами и памятью"),
      p("Большинство серьёзных сбоев в продакшене — это нарушение предположений о типах («здесь всегда число») или о памяти («этот указатель ещё действителен»). Понимание того, что именно проверяет компилятор, что остаётся на совести программиста и что делает среда выполнения, превращает загадочные падения в диагностируемые классы ошибок."),
      ul(
        "**Корректность.** Из четырёх «дыр» в системе типов TypeScript все четыре компилируются без единой ошибки и падают во время выполнения: типы — это проверка, а не гарантия, если в коде есть `any`, `as` и данные извне.",
        "**Безопасность.** Чтение после `free`, запись за концом блока и двойное освобождение — основа классов уязвимостей; в замере 5 из 6 таких ошибок обычная сборка пропустила с кодом выхода 0, а санитайзер диагностировал каждую.",
        "**Производительность и память.** Порядок полей меняет размер структуры на 50 % (24 против 16 байт); список из миллиона целых в Python занимает в 9 раз больше памяти, чем массив; кадры стека ограничивают глубину рекурсии (около 131 тысячи вызовов при кадре 64 байта).",
        "**Выбор языка и инструментов.** Языки с ручным управлением (C), владением (Rust), подсчётом ссылок и трассирующей сборкой (Python, JavaScript, Java, Go) дают разные компромиссы между контролем, безопасностью и предсказуемостью.",
        "**Диагностика.** Сообщения вида `heap-use-after-free`, `E0382`, `RecursionError`, `Cannot read properties of undefined` — это язык, на котором среда сообщает, какое правило нарушено.",
      ),
      tip("Три вопроса о любом участке кода: какие типы здесь гарантированы **проверкой**, а какие только **соглашением**; кто владеет этими данными и когда они освобождаются; что произойдёт при неожиданных данных извне — упадёт сразу или испортит память молча."),
    ]),

    section("mental-model", [
      h("Три слоя гарантий"),
      diagram(
        `
        проверка до выполнения        система типов, проверка заимствований       «неверно — не скомпилируется»
        ─────────────────────────────────────────────────────────────────────────
        проверка при выполнении       границы массивов, null, RecursionError      «неверно — исключение»
        ─────────────────────────────────────────────────────────────────────────
        без проверок                  C: выход за границы, висячие указатели      «неверно — тишина или авария»
        инструменты поверх            AddressSanitizer, UBSan, Valgrind           «найдём при тестировании»
        `,
        "Чем раньше обнаружена ошибка, тем дешевле её исправление; чем меньше проверок, тем выше производительность и ответственность программиста. Языки отличаются тем, где проходит граница.",
      ),
      h("Как значение живёт в памяти"),
      diagram(
        `
        высокие адреса   ┌──────────────┐
                         │    стек      │  кадры вызовов; растёт вниз; предел 8192 КиБ
                         ├──────────────┤
                         │ отображения  │  libc, большие блоки malloc, файлы
                         ├──────────────┤
                         │    куча      │  малые блоки malloc; растёт вверх
                         ├──────────────┤
                         │  .bss  .data │  глобальные переменные
                         ├──────────────┤
                         │    код       │  машинные команды, константы
        низкие адреса    └──────────────┘
        `,
        "Порядок областей проверен измерением: код < `.data` < `.bss` < куча < отображения < стек. Конкретные адреса меняются от запуска к запуску (ASLR), порядок — нет.",
      ),
      h("Кто освобождает память"),
      diagram(
        `
        вручную (C)              free(p)                        ошибки: use-after-free, двойной free, утечка
        по владению (Rust)       выход из области видимости     ошибки отвергаются при компиляции
        подсчёт ссылок (CPython) счётчик стал 0                 мгновенно, но циклы утекают без сборщика
        трассировка (V8, JVM)    недостижим от корней           паузы сборки; циклы не страшны
        `,
        "Четыре модели; у каждой своя цена: ручная — ответственность, владение — ограничения на форму программы, подсчёт ссылок — накладные расходы и циклы, трассировка — паузы и память под запас.",
      ),
      insight("Тип — это не только «что можно», но и «сколько байт» и «кто отвечает»: порядок полей, пустые байты между ними, коробки вокруг чисел и правила освобождения — всё это следствия типов, и всё это можно измерить."),
    ]),

    section("technical", [
      h("Что проверяет компилятор TypeScript"),
      table(
        ["Фрагмент", "Результат компиляции (strict)", "Вывод"],
        [
          ["`let n: number = \"5\";`", "TS2322: Type 'string' is not assignable to type 'number'", "Несовместимые типы"],
          ["`x.length` при `x: string | null`", "TS18047: 'x' is possibly 'null'", "Проверка null; без `strict` ошибок нет"],
          ["Переменная с лишним полем → `Point`", "Ошибок нет", "Структурная совместимость"],
          ["Литерал с лишним полем → `Point`", "TS2353: Object literal may only specify known properties", "Проверка избыточных свойств"],
          ["`Meters = number`, `Seconds = number`", "Ошибок нет", "Псевдонимы не создают новых типов"],
          ["Бренд `number & { __brand: \"m\" }`", "TS2322: Type 'Meters' is not assignable to type 'Seconds'", "Номинальность поверх структурной типизации"],
          ["Неполный `switch` по объединению", "TS2322: ... is not assignable to type 'never'", "Проверка исчерпанности"],
        ],
        "Замеры компилятора TypeScript 5.9 через программный интерфейс",
      ),
      h("Что компилятор пропускает"),
      table(
        ["Приём", "Ошибок компиляции", "Что происходит при выполнении"],
        [
          ["Ковариантность массивов: `Dog[]` присвоен `Animal[]`, затем `push(new Cat())`", "0", "`TypeError: dogs[1].bark is not a function`"],
          ["`any`: `const n: number = v` (где `v: any`)", "0", "`TypeError: n.toFixed is not a function`"],
          ["`\"5\" as unknown as number`", "0", "`TypeError: n.toFixed is not a function`"],
          ["`JSON.parse(...)` присвоен `User`", "0", "`TypeError: Cannot read properties of undefined (reading 'toFixed')`"],
        ],
        "Дыры в системе типов",
      ),
      h("Размеры и выравнивание (x86-64, gcc 13.3)"),
      table(
        ["Структура", "Размер", "Выравнивание", "Смещения полей"],
        [
          ["`Bad { char a; int b; char c; }`", "12", "4", "a=0, b=4, c=8 (3 байта дыры после `a`, 3 в хвосте)"],
          ["`Good { int b; char a; char c; }`", "8", "4", "b=0, a=4, c=5 (2 байта в хвосте)"],
          ["`Packed` (атрибут `packed`)", "6", "1", "поле `int` по смещению 1 — не выровнено"],
          ["`Mixed { char; double; char; short }`", "24", "8", "flag=0, value=8, tag=16, n=18"],
          ["`Sorted { double; short; char; char }`", "16", "8", "value=0, n=8, flag=10, tag=11"],
        ],
        "Размер структур и порядок полей; размеры типов: char 1, short 2, int 4, long 8, указатель 8, float 4, double 8 байт",
      ),
      h("Модели управления памятью"),
      table(
        ["Модель", "Когда освобождается", "Сильные стороны", "Слабые стороны"],
        [
          ["Ручная (C)", "Явным `free`", "Полный контроль, нет скрытых пауз", "Use-after-free, двойной `free`, утечки, переполнения"],
          ["Владение (Rust)", "При выходе владельца из области", "Безопасность проверяется при компиляции, нет сборщика", "Нужно выразить время жизни; ограничения на формы данных"],
          ["Подсчёт ссылок (CPython, Swift, `Rc`)", "Когда счётчик равен 0", "Мгновенное освобождение, предсказуемость", "Циклы утекают; счётчики стоят времени"],
          ["Трассирующая сборка (V8, JVM, Go)", "После достижимости от корней", "Циклы не проблема, удобство", "Паузы, запас памяти, нет точного момента освобождения"],
        ],
        "Четыре модели управления памятью",
      ),
    ]),

    section("syntax", [
      annotated(
        "ts",
        `
          interface Point { x: number; y: number }

          type Meters = number & { __brand: "m" };

          type Shape =
            | { k: "circle"; r: number }
            | { k: "square"; a: number };

          function area(s: Shape): number {
            switch (s.k) {
              case "circle": return Math.PI * s.r ** 2;
              case "square": return s.a ** 2;
              default: { const _never: never = s; return _never; }
            }
          }
        `,
        [
          { line: 1, text: "Интерфейс описывает **форму**: любой объект с числовыми `x` и `y` совместим, даже если создан в другом месте (структурная типизация)." },
          { line: 3, text: "«Бренд» — вымышленное поле, которое отличает `Meters` от обычного `number`: тип становится номинальным, а в выполняемом коде от него ничего не остаётся." },
          { line: 5, text: "Объединение с общим полем-тегом `k` (размеченное объединение): компилятор по значению `k` сужает тип в каждой ветке." },
          { line: 10, text: "`switch` по тегу: внутри `case \"circle\"` доступен `s.r`, внутри `case \"square\"` — `s.a`." },
          { line: 13, text: "Присваивание `never` проверяет исчерпанность: добавите вариант `tri` и забудете ветку — получите ошибку TS2322 (в замере: `Type '{ k: \"tri\"; b: number; }' is not assignable to type 'never'`)." },
        ],
        "Типы TypeScript: форма, бренд и размеченное объединение",
      ),
      code(
        "c",
        `
          struct Sorted { double value; short n; char flag; char tag; };   /* 16 байт */
          size_t size  = sizeof(struct Sorted);
          size_t align = _Alignof(struct Sorted);
          size_t off   = offsetof(struct Sorted, n);                       /* 8 */
          int *p = malloc(4 * sizeof *p);                                  /* куча */
          free(p);                                                         /* и только один раз */
        `,
        { filename: "размер, выравнивание, смещение, куча" },
      ),
      code(
        "bash",
        `
          gcc -O0 -g -fsanitize=address prog.c -o prog      # AddressSanitizer
          gcc -O0 -g -fsanitize=undefined prog.c -o prog    # UBSan
          valgrind --error-exitcode=9 -q ./prog             # без перекомпиляции
          rustc --edition 2021 prog.rs                      # проверка владения при компиляции
          node --expose-gc app.js                           # доступ к gc() для экспериментов
        `,
        { filename: "инструменты проверки памяти" },
      ),
    ]),

    section("minimal-example", [
      h("Что проверяет и что пропускает настоящая система типов"),
      code("js", `// Проверка типов настоящим компилятором TypeScript: что он отвергает, что пропускает и что остаётся после стирания типов
import ts from "typescript";
import vm from "node:vm";

const OPTS = { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, types: [] };
function check(src, options = OPTS) {
  const name = "/virtual.ts", host = ts.createCompilerHost(options), orig = host.getSourceFile.bind(host);
  host.getSourceFile = (f, ...rest) => (f === name ? ts.createSourceFile(f, src, options.target, true) : orig(f, ...rest));
  const origExists = host.fileExists.bind(host); host.fileExists = (f) => f === name || origExists(f);
  const program = ts.createProgram([name], options, host);
  return ts.getPreEmitDiagnostics(program).filter((d) => d.file?.fileName === name).map((d) => "TS" + d.code + ": " + ts.flattenDiagnosticMessageText(d.messageText, "\\n").split("\\n")[0]);
}
function run(src) {                                    // стираем типы и выполняем получившийся JavaScript
  const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  try { vm.runInNewContext(js, {}, { timeout: 1000 }); return "выполнено без ошибок"; } catch (e) { return e.constructor.name + ": " + e.message; }
}
const cases = [
  ["1. присваивание строки числу", \`let n: number = "5";\`],
  ["2. возможный null при strict", \`function len(x: string | null) { return x.length; }\`],
  ["3. структурная типизация: переменная с лишним полем", \`interface Point { x: number; y: number }\\nconst p3 = { x: 1, y: 2, z: 3 };\\nconst q: Point = p3;\`],
  ["4. лишнее поле в литерале", \`interface Point { x: number; y: number }\\nconst r: Point = { x: 1, y: 2, z: 3 };\`],
  ["5. псевдонимы Meters и Seconds взаимозаменяемы", \`type Meters = number; type Seconds = number;\\nconst m: Meters = 5;\\nconst s: Seconds = m;\`],
  ["6. «бренд» делает типы различными", \`type Meters = number & { __brand: "m" }; type Seconds = number & { __brand: "s" };\\nconst m = 5 as Meters;\\nconst s: Seconds = m;\`],
  ["7. неполный перебор вариантов", \`type Shape = { k: "circle"; r: number } | { k: "square"; a: number } | { k: "tri"; b: number };\\nfunction area(s: Shape): number {\\n  switch (s.k) {\\n    case "circle": return 3 * s.r * s.r;\\n    case "square": return s.a * s.a;\\n    default: { const _never: never = s; return _never; }\\n  }\\n}\`],
];
console.log("1) что отвергает компилятор TypeScript " + ts.version.split(".").slice(0, 2).join(".") + " (strict: true):");
for (const [title, src] of cases) { const d = check(src); console.log("   " + title.padEnd(52) + "→ " + (d.length ? d[0] : "ошибок нет")); }
const loose = check(cases[1][1], { ...OPTS, strict: false });
console.log("   то же, что в п. 2, без strict:".padEnd(55) + "→ " + (loose.length ? loose[0] : "ошибок нет") + "  (проверка null отключена)");

console.log("\\n2) то, что компилятор ПРОПУСКАЕТ, хотя программа неверна («дыры» в типах); выполнение — после стирания типов:");
const holes = [
  ["ковариантность массивов", \`class Animal { constructor(public name: string) {} }\\nclass Dog extends Animal { bark() { return "гав"; } }\\nclass Cat extends Animal { meow() { return "мяу"; } }\\nconst dogs: Dog[] = [new Dog("a")];\\nconst animals: Animal[] = dogs;\\nanimals.push(new Cat("b"));\\ndogs[1].bark();\`],
  ["any отключает проверку", \`const v: any = "x";\\nconst n: number = v;\\nn.toFixed(2);\`],
  ["утверждение типа as unknown as", \`const n = "5" as unknown as number;\\nn.toFixed(1);\`],
  ["JSON.parse возвращает any", \`interface User { name: string; age: number }\\nconst u: User = JSON.parse('{"name": "Ann"}');\\nu.age.toFixed(0);\`],
];
for (const [title, src] of holes) { const d = check(src); console.log("   " + title.padEnd(34) + "ошибок компиляции: " + d.length + "; выполнение: " + run(src)); }

console.log("\\n3) стирание типов: что остаётся от кода с типами после компиляции");
const typed = \`interface User { name: string; age: number }\\nfunction greet(u: User, times: number = 1): string {\\n  return ("Привет, " + u.name + "! ").repeat(times);\\n}\\nconst x: User = { name: "Ann", age: 30 };\\nconsole.log(greet(x, 2) as string);\`;
const js = ts.transpileModule(typed, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText.trim();
console.log(js.split("\\n").map((l) => "   | " + l).join("\\n"));
console.log("   интерфейс исчез целиком, аннотации типов и утверждение as удалены; значение по умолчанию и логика остались");`, { filename: "01-ts-types.mjs", collapsed: true }),
      code("text", `1) что отвергает компилятор TypeScript 5.9 (strict: true):
   1. присваивание строки числу                        → TS2322: Type 'string' is not assignable to type 'number'.
   2. возможный null при strict                        → TS18047: 'x' is possibly 'null'.
   3. структурная типизация: переменная с лишним полем → ошибок нет
   4. лишнее поле в литерале                           → TS2353: Object literal may only specify known properties, and 'z' does not exist in type 'Point'.
   5. псевдонимы Meters и Seconds взаимозаменяемы      → ошибок нет
   6. «бренд» делает типы различными                   → TS2322: Type 'Meters' is not assignable to type 'Seconds'.
   7. неполный перебор вариантов                       → TS2322: Type '{ k: "tri"; b: number; }' is not assignable to type 'never'.
   то же, что в п. 2, без strict:                      → ошибок нет  (проверка null отключена)

2) то, что компилятор ПРОПУСКАЕТ, хотя программа неверна («дыры» в типах); выполнение — после стирания типов:
   ковариантность массивов           ошибок компиляции: 0; выполнение: TypeError: dogs[1].bark is not a function
   any отключает проверку            ошибок компиляции: 0; выполнение: TypeError: n.toFixed is not a function
   утверждение типа as unknown as    ошибок компиляции: 0; выполнение: TypeError: n.toFixed is not a function
   JSON.parse возвращает any         ошибок компиляции: 0; выполнение: TypeError: Cannot read properties of undefined (reading 'toFixed')

3) стирание типов: что остаётся от кода с типами после компиляции
   | function greet(u, times = 1) {
   |     return ("Привет, " + u.name + "! ").repeat(times);
   | }
   | const x = { name: "Ann", age: 30 };
   | console.log(greet(x, 2));
   интерфейс исчез целиком, аннотации типов и утверждение as удалены; значение по умолчанию и логика остались`, { filename: "компилятор TypeScript 5.9: отвергнутое, пропущенное, стирание типов" }),
      ul(
        "**Отвергнуто** (режим `strict`): присваивание строки числу (TS2322), возможный `null` (TS18047), лишнее поле в литерале (TS2353), несовместимость «брендированных» типов (TS2322), неполный перебор вариантов (значение попало в `never`).",
        "**Пропущено** структурной совместимостью: переменная с лишним полем (`Point`), псевдонимы `Meters` и `Seconds` — они одно и то же. Без `strict` проверка `null` отключена, и ошибка пропадает.",
        "**«Дыры»:** во всех четырёх случаях (ковариантность массивов, `any`, `as unknown as`, `JSON.parse`) **ошибок компиляции 0**, а во время выполнения — `TypeError`. Данные извне и приведения типов — зоны, где проверка типов бессильна: нужна проверка на границе (схема, `typeof`, валидатор).",
        "**Стирание типов:** после компиляции интерфейс `User` исчез целиком, аннотации и утверждение `as` удалены; осталась логика и значение по умолчанию. Типы TypeScript существуют только при проверке и невидимы во время выполнения.",
      ),
      h("Вывод типов без аннотаций"),
      code("js", `// Вывод типов по Хиндли — Милнеру (алгоритм W): унификация, обобщение в let, проверка вхождения
let counter = 0;
const fresh = () => ({ k: "var", id: counter++, ref: null });
const TInt = { k: "con", name: "Int" }, TBool = { k: "con", name: "Bool" };
const fn = (a, b) => ({ k: "fn", a, b }), pair = (a, b) => ({ k: "pair", a, b });
const prune = (t) => (t.k === "var" && t.ref ? (t.ref = prune(t.ref)) : t);
let unifications = 0;
function occurs(v, t) { t = prune(t); return t === v || (t.k === "fn" || t.k === "pair" ? occurs(v, t.a) || occurs(v, t.b) : false); }
function unify(a, b) {
  unifications++; a = prune(a); b = prune(b);
  if (a === b) return;
  if (a.k === "var") { if (occurs(a, b)) throw new TypeError("бесконечный тип (проверка вхождения)"); a.ref = b; return; }
  if (b.k === "var") return unify(b, a);
  if (a.k !== b.k || (a.k === "con" && a.name !== b.name)) throw new TypeError("несовпадение типов: " + show(a) + " и " + show(b));
  if (a.k === "fn" || a.k === "pair") { unify(a.a, b.a); unify(a.b, b.b); }
}
function show(t, names = new Map()) {
  t = prune(t);
  if (t.k === "con") return t.name;
  if (t.k === "var") { if (!names.has(t.id)) names.set(t.id, String.fromCharCode(97 + names.size)); return names.get(t.id); }
  const l = t.k === "fn" ? (prune(t.a).k === "fn" ? "(" + show(t.a, names) + ")" : show(t.a, names)) : show(t.a, names);
  return t.k === "fn" ? l + " -> " + show(t.b, names) : "(" + l + ", " + show(t.b, names) + ")";
}
// схема типа: переменные, связанные квантором; создаём свежие копии при каждом использовании
const freeVars = (t, out = new Set()) => { t = prune(t); if (t.k === "var") out.add(t); else if (t.k === "fn" || t.k === "pair") { freeVars(t.a, out); freeVars(t.b, out); } return out; };
const envFree = (env) => { const s = new Set(); for (const sc of env.values()) freeVars(sc.type).forEach((v) => { if (!sc.vars.has(v)) s.add(v); }); return s; };
const generalize = (env, t) => { const ef = envFree(env); return { vars: new Set([...freeVars(t)].filter((v) => !ef.has(v))), type: t }; };
const instantiate = (sc) => { const m = new Map([...sc.vars].map((v) => [v, fresh()])); const go = (t) => { t = prune(t); if (t.k === "var") return m.get(t) ?? t; if (t.k === "fn" || t.k === "pair") return { k: t.k, a: go(t.a), b: go(t.b) }; return t; }; return go(sc.type); };
function infer(e, env) {
  switch (e.k) {
    case "int": return TInt; case "bool": return TBool;
    case "var": { const sc = env.get(e.name); if (!sc) throw new ReferenceError("неизвестное имя " + e.name); return instantiate(sc); }
    case "lam": { const tv = fresh(), env2 = new Map(env).set(e.x, { vars: new Set(), type: tv }); return fn(tv, infer(e.body, env2)); }
    case "app": { const tf = infer(e.f, env), ta = infer(e.a, env), tr = fresh(); unify(tf, fn(ta, tr)); return tr; }
    case "pair": return pair(infer(e.a, env), infer(e.b, env));
    case "if": { unify(infer(e.c, env), TBool); const t1 = infer(e.t, env), t2 = infer(e.e, env); unify(t1, t2); return t1; }
    case "let": { const t1 = infer(e.v, env); return infer(e.body, new Map(env).set(e.x, generalize(env, t1))); }
  }
}
const V = (name) => ({ k: "var", name }), L = (x, body) => ({ k: "lam", x, body }), A = (f, a) => ({ k: "app", f, a }), I = (v) => ({ k: "int", v }), B = (v) => ({ k: "bool", v });
const prelude = new Map([["add", { vars: new Set(), type: fn(TInt, fn(TInt, TInt)) }], ["not", { vars: new Set(), type: fn(TBool, TBool) }]]);
const progs = [
  ["λx. x", L("x", V("x"))],
  ["λf. λx. f (f x)", L("f", L("x", A(V("f"), A(V("f"), V("x")))))],
  ["λf. λg. λx. f (g x)  (композиция)", L("f", L("g", L("x", A(V("f"), A(V("g"), V("x"))))))],
  ["λx. add x 1", L("x", A(A(V("add"), V("x")), I(1)))],
  ["λx. if x then 1 else 2", L("x", { k: "if", c: V("x"), t: I(1), e: I(2) })],
  ["let id = λx. x in (id 1, id true)", { k: "let", x: "id", v: L("x", V("x")), body: pair2(A(V("id"), I(1)), A(V("id"), B(true))) }],
  ["λid. (id 1, id true)", L("id", pair2(A(V("id"), I(1)), A(V("id"), B(true))))],
  ["λx. x x", L("x", A(V("x"), V("x")))],
  ["add true 1", A(A(V("add"), B(true)), I(1))],
  ["if 1 then 2 else 3", { k: "if", c: I(1), t: I(2), e: I(3) }],
  ["foo 1", A(V("foo"), I(1))],
];
function pair2(a, b) { return { k: "pair", a, b }; }
console.log("вывод типов без единой аннотации (Int, Bool, функции, пары; add : Int -> Int -> Int, not : Bool -> Bool):");
let ok = 0, rejected = 0;
for (const [title, e] of progs) {
  const before = unifications;
  try { const t = infer(e, prelude); ok++; console.log("   " + title.padEnd(40) + ": " + show(t).padEnd(32) + "вызовов unify: " + (unifications - before)); }
  catch (err) { rejected++; console.log("   " + title.padEnd(40) + "✗ " + err.constructor.name + ": " + err.message); }
}
console.log("\\nитог: типизированы", ok, "программ, отвергнуты", rejected);
console.log("   (id 1, id true) проходит в let (тип id обобщён: a -> a для любого a) и не проходит для λid: параметр лямбды получает один, мономорфный тип");
console.log("   λx. x x отвергнут проверкой вхождения: для x : a требовалось бы a = a -> b — тип бесконечной длины");`, { filename: "02-hindley-milner.mjs", collapsed: true }),
      code("text", `вывод типов без единой аннотации (Int, Bool, функции, пары; add : Int -> Int -> Int, not : Bool -> Bool):
   λx. x                                   : a -> a                          вызовов unify: 0
   λf. λx. f (f x)                         : (a -> a) -> a -> a              вызовов unify: 4
   λf. λg. λx. f (g x)  (композиция)       : (a -> b) -> (c -> a) -> c -> b  вызовов unify: 2
   λx. add x 1                             : Int -> Int                      вызовов unify: 9
   λx. if x then 1 else 2                  : Bool -> Int                     вызовов unify: 2
   let id = λx. x in (id 1, id true)       : (Int, Bool)                     вызовов unify: 8
   λid. (id 1, id true)                    ✗ TypeError: несовпадение типов: Int и Bool
   λx. x x                                 ✗ TypeError: бесконечный тип (проверка вхождения)
   add true 1                              ✗ TypeError: несовпадение типов: Int и Bool
   if 1 then 2 else 3                      ✗ TypeError: несовпадение типов: Int и Bool
   foo 1                                   ✗ ReferenceError: неизвестное имя foo

итог: типизированы 6 программ, отвергнуты 5
   (id 1, id true) проходит в let (тип id обобщён: a -> a для любого a) и не проходит для λid: параметр лямбды получает один, мономорфный тип
   λx. x x отвергнут проверкой вхождения: для x : a требовалось бы a = a -> b — тип бесконечной длины`, { filename: "алгоритм Хиндли — Милнера: унификация, let-полиморфизм, проверка вхождения" }),
      ul(
        "**Типы найдены без единой аннотации:** `λx. x` — `a -> a`; `λf. λx. f (f x)` — `(a -> a) -> a -> a`; композиция — `(a -> b) -> (c -> a) -> c -> b`; `λx. add x 1` — `Int -> Int`; `λx. if x then 1 else 2` — `Bool -> Int`.",
        "**Обобщение в `let`:** `let id = λx. x in (id 1, id true)` получил тип `(Int, Bool)`: `id` обобщён до `a -> a` для любого `a`. А `λid. (id 1, id true)` отвергнут: параметр лямбды имеет один мономорфный тип и не может быть `Int -> …` и `Bool -> …` одновременно.",
        "**Проверка вхождения:** `λx. x x` отвергнут (`бесконечный тип`): для `x : a` потребовалось бы `a = a -> b`.",
        "**Итог:** 6 программ типизированы, 5 отвергнуты (несовпадение `Int` и `Bool`, бесконечный тип, неизвестное имя). Число вызовов унификации — 0…9 на выражение: вывод типов — это решение системы равенств.",
      ),
    ]),

    section("detailed-example", [
      h("Представление данных: размер, выравнивание, порядок байтов"),
      code("c", `// Представление данных в памяти: размер, выравнивание, заполнение (padding), порядок байтов, объединения
#include <stdio.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

struct Bad    { char a; int b; char c; };                    // поля в «неудобном» порядке
struct Good   { int b; char a; char c; };                    // те же поля, отсортированы по убыванию размера
struct Packed { char a; int b; char c; } __attribute__((packed));
struct Mixed  { char flag; double value; char tag; short n; };
struct Sorted { double value; short n; char flag; char tag; };
union  Num    { uint32_t u; float f; unsigned char bytes[4]; };

#define SHOW(T) printf("   %-14s размер %2zu, выравнивание %zu\\n", #T, sizeof(struct T), _Alignof(struct T))
int main(void) {
    printf("модель данных: char %zu, short %zu, int %zu, long %zu, указатель %zu, float %zu, double %zu байт\\n",
           sizeof(char), sizeof(short), sizeof(int), sizeof(long), sizeof(void *), sizeof(float), sizeof(double));
    printf("1) выравнивание: поле размера k лежит по адресу, кратному k; компилятор добавляет «дыры»\\n");
    SHOW(Bad); SHOW(Good); SHOW(Packed); SHOW(Mixed); SHOW(Sorted);
    printf("   смещения Bad:    a=%zu b=%zu c=%zu (после a — %zu байта дыры, после c — %zu байта хвоста)\\n",
           offsetof(struct Bad, a), offsetof(struct Bad, b), offsetof(struct Bad, c),
           offsetof(struct Bad, b) - 1, sizeof(struct Bad) - offsetof(struct Bad, c) - 1);
    printf("   смещения Good:   b=%zu a=%zu c=%zu (хвост %zu байта)\\n",
           offsetof(struct Good, b), offsetof(struct Good, a), offsetof(struct Good, c), sizeof(struct Good) - offsetof(struct Good, c) - 1);
    printf("   смещения Mixed:  flag=%zu value=%zu tag=%zu n=%zu; Sorted: value=%zu n=%zu flag=%zu tag=%zu\\n",
           offsetof(struct Mixed, flag), offsetof(struct Mixed, value), offsetof(struct Mixed, tag), offsetof(struct Mixed, n),
           offsetof(struct Sorted, value), offsetof(struct Sorted, n), offsetof(struct Sorted, flag), offsetof(struct Sorted, tag));
    printf("   потеря: Bad занимает на %zu%% больше Good; Mixed — на %zu%% больше Sorted; миллион записей: Bad — %zu МБ, Good — %zu МБ\\n",
           (sizeof(struct Bad) - sizeof(struct Good)) * 100 / sizeof(struct Good), (sizeof(struct Mixed) - sizeof(struct Sorted)) * 100 / sizeof(struct Sorted),
           sizeof(struct Bad), sizeof(struct Good));
    printf("2) упакованная структура (packed) занимает %zu байт, но поле b лежит по смещению %zu — не кратному 4: обращение к нему невыровнено; на x86 работает, на строгих архитектурах — ошибка шины\\n",
           sizeof(struct Packed), offsetof(struct Packed, b));
    union Num n; n.u = 0x01020304;
    printf("3) порядок байтов: число 0x01020304 лежит как %u %u %u %u → %s\\n", n.bytes[0], n.bytes[1], n.bytes[2], n.bytes[3], n.bytes[0] == 4 ? "little-endian (младший байт первым)" : "big-endian");
    n.f = 1.0f;
    printf("4) объединение: float 1.0 как 32-битное целое — 0x%08x (знак 0, порядок 127, мантисса 0)\\n", n.u);
    n.f = -0.0f; uint32_t neg_zero = n.u;
    n.f = 0.0f;  uint32_t pos_zero = n.u;
    printf("   float -0.0 — 0x%08x; float 0.0 — 0x%08x (равны как числа, различны как битовые строки)\\n", neg_zero, pos_zero);
    int arr[4] = {10, 20, 30, 40};
    printf("5) массив и указатель: &arr[3] - &arr[0] = %td элемента, но в байтах — %td; arr[3] и *(arr + 3) — один и тот же доступ: %d\\n",
           &arr[3] - &arr[0], (char *)&arr[3] - (char *)&arr[0], arr[3] == *(arr + 3));
    return 0;
}`, { filename: "03-layout.c", collapsed: true }),
      code("text", `модель данных: char 1, short 2, int 4, long 8, указатель 8, float 4, double 8 байт
1) выравнивание: поле размера k лежит по адресу, кратному k; компилятор добавляет «дыры»
   Bad            размер 12, выравнивание 4
   Good           размер  8, выравнивание 4
   Packed         размер  6, выравнивание 1
   Mixed          размер 24, выравнивание 8
   Sorted         размер 16, выравнивание 8
   смещения Bad:    a=0 b=4 c=8 (после a — 3 байта дыры, после c — 3 байта хвоста)
   смещения Good:   b=0 a=4 c=5 (хвост 2 байта)
   смещения Mixed:  flag=0 value=8 tag=16 n=18; Sorted: value=0 n=8 flag=10 tag=11
   потеря: Bad занимает на 50% больше Good; Mixed — на 50% больше Sorted; миллион записей: Bad — 12 МБ, Good — 8 МБ
2) упакованная структура (packed) занимает 6 байт, но поле b лежит по смещению 1 — не кратному 4: обращение к нему невыровнено; на x86 работает, на строгих архитектурах — ошибка шины
3) порядок байтов: число 0x01020304 лежит как 4 3 2 1 → little-endian (младший байт первым)
4) объединение: float 1.0 как 32-битное целое — 0x3f800000 (знак 0, порядок 127, мантисса 0)
   float -0.0 — 0x80000000; float 0.0 — 0x00000000 (равны как числа, различны как битовые строки)
5) массив и указатель: &arr[3] - &arr[0] = 3 элемента, но в байтах — 12; arr[3] и *(arr + 3) — один и тот же доступ: 1`, { filename: "размеры и смещения структур, порядок байтов, представление float" }),
      ul(
        "**Размеры типов:** `char` 1, `short` 2, `int` 4, `long` 8, указатель 8, `float` 4, `double` 8 байт.",
        "**Заполнение:** `Bad { char; int; char }` занимает **12** байт (дыра 3 байта после `a`, хвост 3 байта), `Good { int; char; char }` — **8**; `Mixed` с `double` — **24**, `Sorted` (по убыванию размера) — **16**: потеря **50 %** при тех же данных. Для миллиона записей это 12 МБ против 8 МБ.",
        "**Упакованная структура** — 6 байт, но поле `int` по смещению 1: обращение невыровнено; на x86 работает, на других архитектурах может завершаться ошибкой.",
        "**Порядок байтов:** `0x01020304` лежит как `4 3 2 1` — **little-endian**; `float 1.0` — `0x3f800000` (знак 0, порядок 127, мантисса 0), `−0.0` — `0x80000000`, `+0.0` — `0x00000000`: равны как числа, различны как битовые строки.",
        "**Массив и указатель:** `&arr[3] - &arr[0]` равно 3 элемента, в байтах — 12; `arr[3]` и `*(arr + 3)` — один и тот же доступ.",
      ),
      h("Области памяти, стек и распределитель"),
      code("c", `// Области памяти процесса: код, данные, куча, отображения, стек; рост стека; поведение malloc; переполнение стека
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <malloc.h>
#include <signal.h>
#include <sys/mman.h>
#include <sys/wait.h>
#include <sys/resource.h>
#include <unistd.h>

int initialized_global = 42;           // раздел .data
int zero_global;                       // раздел .bss
static volatile uintptr_t sink;

static volatile unsigned long *shared_depth;
// кадр без оптимизации: локальный массив, рекурсивный вызов, результат используется после возврата
__attribute__((noinline, optimize("O0"))) static uintptr_t dive(unsigned long n, unsigned long stop) {
    char pad[16]; pad[0] = (char)n; sink = (uintptr_t)pad;
    if (n == stop) return (uintptr_t)pad;
    *shared_depth = n;
    return dive(n + 1, stop) + (uintptr_t)(pad[0] - pad[0]);
}
int main(void) {
    int local = 0;
    void *small = malloc(100), *large = malloc(1 << 20);
    uintptr_t code = (uintptr_t)&main, data = (uintptr_t)&initialized_global, bss = (uintptr_t)&zero_global;
    uintptr_t heap = (uintptr_t)small, mapped = (uintptr_t)large, libc = (uintptr_t)&printf, stack = (uintptr_t)&local;
    printf("1) расположение областей (адреса меняются от запуска к запуску из-за ASLR, порядок — нет):\\n");
    printf("   код main < данные (.data) < .bss: %s\\n", code < data && data < bss ? "да" : "нет");
    printf("   .bss < куча (malloc 100 байт) < отображение (malloc 1 МиБ) < стек: %s\\n", bss < heap && heap < mapped && mapped < stack ? "да" : "нет");
    printf("   библиотека libc лежит рядом с отображениями, выше кучи и ниже стека: %s\\n", libc > heap && libc < stack ? "да" : "нет");
    printf("   большой блок (1 МиБ) выдан не из кучи, а отдельным отображением страниц: адрес %% 4096 = %lu (16 байт заголовка блока)\\n", (unsigned long)(mapped % 4096));
    shared_depth = mmap(NULL, 4096, PROT_READ | PROT_WRITE, MAP_SHARED | MAP_ANONYMOUS, -1, 0);
    uintptr_t a0 = dive(0, 0), a10 = dive(0, 10), a100 = dive(0, 100);
    printf("2) стек растёт вниз: адрес локальной переменной на глубине 10 ниже, чем на глубине 0: %s; на глубине 100 ещё ниже: %s\\n", a10 < a0 ? "да" : "нет", a100 < a10 ? "да" : "нет");
    size_t frame = (a0 - a100) / 100;
    printf("   кадр одного вызова (функция с массивом в 16 байт, без оптимизации): %zu байт, 100 вызовов — %zu байт\\n", frame, a0 - a100);
    struct rlimit rl; getrlimit(RLIMIT_STACK, &rl);
    printf("   предел стека процесса: %lu КиБ; ожидаемая глубина рекурсии до предела при кадре %zu байт — около %lu вызовов\\n", (unsigned long)(rl.rlim_cur / 1024), frame, (unsigned long)(rl.rlim_cur / frame));
    fflush(stdout);
    pid_t pid = fork();
    if (pid == 0) { dive(1, (unsigned long)-1); _exit(0); }
    int status; waitpid(pid, &status, 0);
    unsigned long depth = *shared_depth;
    printf("3) бесконечная рекурсия в дочернем процессе: завершён сигналом %d (%s); достигнутая глубина больше 100000: %s\\n",
           WIFSIGNALED(status) ? WTERMSIG(status) : 0, WIFSIGNALED(status) && WTERMSIG(status) == SIGSEGV ? "SIGSEGV — переполнение стека" : "иное",
           depth > 100000 ? "да" : "нет");
    double ratio = (double)depth * (double)frame / (double)rl.rlim_cur;
    fprintf(stderr, "(калибровка) достигнутая глубина %lu, доля предела %.4f\\n", depth, ratio);
    printf("   глубина × размер кадра заняла от 95 до 100 %% предела стека: %s\\n", ratio >= 0.95 && ratio <= 1.0 ? "да" : "нет");
    printf("4) поведение malloc (glibc): запрос → полезный размер блока:");
    size_t sizes[] = {1, 24, 25, 40, 41, 100};
    for (int i = 0; i < 6; i++) { void *q = malloc(sizes[i]); printf(" %zu→%zu", sizes[i], malloc_usable_size(q)); free(q); }
    printf("\\n");
    void *p1 = malloc(64); uintptr_t addr1 = (uintptr_t)p1; free(p1);
    void *p2 = malloc(64); printf("   после free(64 байта) следующий malloc(64) вернул тот же адрес: %s (блок вернулся в список свободных)\\n", (uintptr_t)p2 == addr1 ? "да" : "нет");
    void *p3 = malloc(64); printf("   а второй подряд malloc(64) — другой адрес: %s\\n", (uintptr_t)p3 != (uintptr_t)p2 ? "да" : "нет");
    free(p2); free(p3); free(small); free(large);
    return 0;
}`, { filename: "04-memory-regions.c", collapsed: true }),
      code("text", `1) расположение областей (адреса меняются от запуска к запуску из-за ASLR, порядок — нет):
   код main < данные (.data) < .bss: да
   .bss < куча (malloc 100 байт) < отображение (malloc 1 МиБ) < стек: да
   библиотека libc лежит рядом с отображениями, выше кучи и ниже стека: да
   большой блок (1 МиБ) выдан не из кучи, а отдельным отображением страниц: адрес % 4096 = 16 (16 байт заголовка блока)
2) стек растёт вниз: адрес локальной переменной на глубине 10 ниже, чем на глубине 0: да; на глубине 100 ещё ниже: да
   кадр одного вызова (функция с массивом в 16 байт, без оптимизации): 64 байт, 100 вызовов — 6400 байт
   предел стека процесса: 8192 КиБ; ожидаемая глубина рекурсии до предела при кадре 64 байт — около 131072 вызовов
3) бесконечная рекурсия в дочернем процессе: завершён сигналом 11 (SIGSEGV — переполнение стека); достигнутая глубина больше 100000: да
   глубина × размер кадра заняла от 95 до 100 % предела стека: да
4) поведение malloc (glibc): запрос → полезный размер блока: 1→24 24→24 25→40 40→40 41→56 100→104
   после free(64 байта) следующий malloc(64) вернул тот же адрес: да (блок вернулся в список свободных)
   а второй подряд malloc(64) — другой адрес: да`, { filename: "порядок областей, рост стека, переполнение стека, поведение malloc" }),
      ul(
        "**Порядок областей** (адреса меняются, порядок — нет): код `main` < `.data` < `.bss` < куча (малый `malloc`) < отображение (`malloc` на 1 МиБ) < стек; libc лежит между кучей и стеком. Большой блок выдан отдельным отображением страниц: его адрес по модулю 4096 равен 16 — заголовок блока.",
        "**Стек растёт вниз:** локальная переменная на глубине 10 лежит ниже, чем на глубине 0, на глубине 100 — ещё ниже. Кадр одного вызова (функция с массивом в 16 байт, без оптимизации) — **64 байта**.",
        "**Переполнение стека:** предел процесса — **8192 КиБ**; ожидаемая глубина до предела при кадре 64 байта — **131 072** вызова; бесконечная рекурсия в дочернем процессе остановилась на глубине около **130 800** (в калибровочных прогонах 130 804–130 844; 99,8 % предела) с сигналом **11 (SIGSEGV)**.",
        "**Поведение `malloc` (glibc):** запрос → полезный размер блока: `1→24`, `24→24`, `25→40`, `40→40`, `41→56`, `100→104`: распределитель выдаёт блоки с шагом 16 байт. После `free(64 байта)` следующий `malloc(64)` вернул **тот же адрес** — блок вернулся в список свободных; второй подряд `malloc(64)` — другой.",
      ),
      h("Ошибки памяти и инструменты их поиска"),
      code("bash", `#!/bin/bash
# Ошибки работы с памятью в C: что делает программа без проверок, что находят AddressSanitizer, UBSan и Valgrind
d=$(mktemp -d); cd "$d"
echo "gcc $(gcc -dumpfullversion), valgrind $(valgrind --version | sed 's/valgrind-//')"
w() { cat > "$1.c"; }
w uaf   <<'C'
#include <stdio.h>
#include <stdlib.h>
int main(int argc, char **argv) { (void)argv; int *p = malloc(sizeof(int)); *p = 7; free(p); volatile int v = *p; (void)v; return argc - 1; }
C
w hbo   <<'C'
#include <stdlib.h>
int main(int argc, char **argv) { (void)argv; char *b = malloc(8); b[7 + argc] = 'x'; free(b); return 0; }
C
w sbo   <<'C'
int main(int argc, char **argv) { (void)argv; char buf[8]; buf[7 + argc] = 'x'; return buf[0] == 'y'; }
C
w dfree <<'C'
#include <stdlib.h>
int main(void) { char *p = malloc(16); free(p); free(p); return 0; }
C
w leak  <<'C'
#include <stdlib.h>
int main(void) { char *p = malloc(100); p[0] = 1; p = NULL; return 0; }
C
w gbo   <<'C'
int table[4] = {1, 2, 3, 4};
int main(int argc, char **argv) { (void)argv; return table[3 + argc] == 99; }
C
w ovf   <<'C'
#include <limits.h>
#include <stdio.h>
int main(int argc, char **argv) { (void)argv; int x = INT_MAX; x += argc; printf("%d\\n", x); return 0; }
C
w shift <<'C'
#include <stdio.h>
int main(int argc, char **argv) { (void)argv; int s = 31 + argc; printf("%d\\n", 1 << s); return 0; }
C
asan() { gcc -O0 -g -fsanitize=address -o "$1.asan" "$1.c" 2>/dev/null && ./"$1.asan" 2>&1 >/dev/null | grep -oE "(AddressSanitizer|LeakSanitizer): [a-zA-Z -]+" | head -1 | sed -E 's/^AddressSanitizer: //; s/ on address *$//; s/ on *$//; s/ *$//'; }
plain() { gcc -O0 -g -fno-stack-protector -o "$1.plain" "$1.c" 2>/dev/null; ./"$1.plain" >/dev/null 2>&1; echo $?; }
echo "ошибка → код выхода без проверок | диагноз AddressSanitizer:"
for t in "uaf|чтение после free" "hbo|запись за концом блока в куче" "sbo|запись за концом локального массива" "dfree|двойной free" "leak|утечка (память не освобождена)" "gbo|выход за границы глобального массива"; do
  n=\${t%%|*}; title=\${t#*|}
  echo "   $title → $(plain $n) | $(asan $n)"
done
echo "   (код 0 — программа «успешно» завершилась, хотя нарушила правила памяти; 134 — аварийное завершение сигналом SIGABRT: двойной free заметил сам распределитель glibc)"
echo
echo "UBSan (-fsanitize=undefined) — неопределённое поведение без нарушения границ памяти:"
for t in "ovf|переполнение знакового int: INT_MAX + 1" "shift|сдвиг 1 << 32 для 32-битного int"; do
  n=\${t%%|*}; title=\${t#*|}; plain $n >/dev/null
  gcc -O0 -g -fsanitize=undefined -o $n.ub $n.c 2>/dev/null
  echo "   $title: без проверок печатает $(./$n.plain | head -1); UBSan сообщает: $(./$n.ub 2>&1 >/dev/null | sed 's/^[^ ]* runtime error: //' | head -1)"
done
echo
echo "Valgrind (без перекомпиляции, программа выполняется на виртуальном процессоре):"
gcc -O0 -g -o uaf.vg uaf.c
valgrind --error-exitcode=9 -q ./uaf.vg 2> uaf.vg.log >/dev/null; code=$?
echo "   чтение после free: код выхода $code; сообщения: $(grep -oE 'Invalid (read|write) of size [0-9]+' uaf.vg.log | sort -u | tr '\\n' ';') $(grep -oE 'inside a block of size [0-9]+ free.d' uaf.vg.log | head -1)"
cd /; rm -rf "$d"`, { filename: "05-memory-safety.sh", collapsed: true }),
      code("text", `gcc 13.3.0, valgrind 3.22.0
ошибка → код выхода без проверок | диагноз AddressSanitizer:
   чтение после free → 0 | heap-use-after-free
   запись за концом блока в куче → 0 | heap-buffer-overflow
   запись за концом локального массива → 0 | stack-buffer-overflow
   двойной free → 134 | attempting double-free
   утечка (память не освобождена) → 0 | LeakSanitizer: detected memory leaks
   выход за границы глобального массива → 0 | global-buffer-overflow
   (код 0 — программа «успешно» завершилась, хотя нарушила правила памяти; 134 — аварийное завершение сигналом SIGABRT: двойной free заметил сам распределитель glibc)

UBSan (-fsanitize=undefined) — неопределённое поведение без нарушения границ памяти:
   переполнение знакового int: INT_MAX + 1: без проверок печатает -2147483648; UBSan сообщает: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'
   сдвиг 1 << 32 для 32-битного int: без проверок печатает 1; UBSan сообщает: shift exponent 32 is too large for 32-bit type 'int'

Valgrind (без перекомпиляции, программа выполняется на виртуальном процессоре):
   чтение после free: код выхода 9; сообщения: Invalid read of size 4; inside a block of size 4 free'd`, { filename: "шесть ошибок памяти: без проверок, AddressSanitizer, UBSan, Valgrind" }),
      ul(
        "**Без проверок** программы с чтением после `free`, записью за концом блока в куче, записью за концом локального массива, выходом за границы глобального массива и утечкой завершились с **кодом 0**: ничто не сообщило об ошибке. Двойной `free` дал код **134** (SIGABRT): его заметил сам распределитель glibc.",
        "**AddressSanitizer** назвал каждую ошибку: `heap-use-after-free`, `heap-buffer-overflow`, `stack-buffer-overflow`, `attempting double-free`, `LeakSanitizer: detected memory leaks`, `global-buffer-overflow`.",
        "**UBSan** поймал неопределённое поведение без нарушения границ памяти: `signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'` (без проверок программа печатает −2147483648) и `shift exponent 32 is too large for 32-bit type 'int'` (без проверок — 1).",
        "**Valgrind** нашёл чтение после `free` без перекомпиляции: `Invalid read of size 4` внутри освобождённого блока размера 4, код выхода 9.",
      ),
      warn("Код выхода 0 не означает корректность: ошибки памяти часто молча портят данные. Запускайте тесты под AddressSanitizer и UBSan — это самый дешёвый способ найти такие ошибки до продакшена."),
    ]),

    section("analysis", [
      h("Владение и заимствование: ошибки памяти отвергаются при компиляции"),
      code("bash", `#!/bin/bash
# Владение, заимствование и время жизни в Rust: те же ошибки памяти отвергаются при компиляции; освобождение по выходу из области видимости
d=$(mktemp -d); cd "$d"
echo "$(rustc --version | awk '{print "rustc", $2}')"
bad() { cat > "$1.rs"; }
good() { cat > "$1.rs"; }
bad move1 <<'R'
fn main() {
    let s = String::from("привет");
    let t = s;                // значение перемещено: s больше не владеет строкой
    println!("{} {}", s, t);
}
R
bad borrow1 <<'R'
fn main() {
    let mut v = vec![1, 2, 3];
    let first = &v[0];        // неизменяемая ссылка внутрь вектора
    v.push(4);                // может перевыделить память — ссылка first повисла бы
    println!("{}", first);
}
R
bad dangling <<'R'
fn longest() -> &'static str { "ok" }
fn main() {
    let r;
    {
        let x = 5;
        r = &x;               // x умрёт в конце блока
    }
    println!("{} {}", r, longest());
}
R
bad twice <<'R'
fn main() {
    let mut s = String::from("a");
    let a = &mut s;
    let b = &mut s;           // две изменяемые ссылки одновременно
    a.push('x'); b.push('y');
}
R
bad thread <<'R'
use std::rc::Rc;
use std::thread;
fn main() {
    let data = Rc::new(5);    // счётчик ссылок без атомарных операций
    let h = thread::spawn(move || println!("{}", data));
    h.join().unwrap();
}
R
echo "ошибки, которые C пропускает молча, а Rust отвергает при компиляции:"
for t in "move1|использование после перемещения (аналог use-after-free)" "borrow1|ссылка внутрь вектора и push (аналог инвалидации указателя)" "dangling|ссылка на переменную, вышедшую из области видимости" "twice|две изменяемые ссылки на одно значение" "thread|передача Rc в другой поток (гонка на счётчике)"; do
  n=\${t%%|*}; title=\${t#*|}
  out=$(rustc --edition 2021 -o /dev/null "$n.rs" 2>&1); code=$?
  e=$(echo "$out" | grep -oE '^error(\\[E[0-9]+\\])?' | head -1)
  msg=$(echo "$out" | grep -E '^error' | head -1 | sed -E 's/^error(\\[E[0-9]+\\])?: //')
  echo "   $title → компиляция завершилась кодом $code; $e $msg"
done
good raii <<'R'
struct Noisy(&'static str);
impl Drop for Noisy { fn drop(&mut self) { println!("   освобождён {}", self.0); } }
fn consume(n: Noisy) { println!("   consume получил {}", n.0); }       // владение передано, освобождение — в конце функции
fn main() {
    let _a = Noisy("a");
    let b = Noisy("b");
    {
        let _inner = Noisy("inner");
        println!("   конец внутреннего блока");
    }
    consume(b);
    let moved = Noisy("c");
    let _kept = moved;                    // перемещение: освобождение один раз, у нового владельца
    let rc = std::rc::Rc::new(Noisy("rc"));
    let rc2 = std::rc::Rc::clone(&rc);
    println!("   счётчик ссылок Rc: {}", std::rc::Rc::strong_count(&rc));
    drop(rc);
    println!("   после drop(rc): счётчик {}, значение живо", std::rc::Rc::strong_count(&rc2));
    println!("   конец main");
}
R
rustc --edition 2021 -O -o raii raii.rs 2>&1 | head -3
echo
echo "освобождение по областям видимости (RAII) — порядок вывода детерминирован:"
./raii
echo "   (локальные значения освобождаются в порядке, обратном объявлению; Rc — когда счётчик достигает нуля)"
cd /; rm -rf "$d"`, { filename: "06-rust-ownership.sh", collapsed: true }),
      code("text", `rustc 1.97.0
ошибки, которые C пропускает молча, а Rust отвергает при компиляции:
   использование после перемещения (аналог use-after-free) → компиляция завершилась кодом 1; error[E0382] borrow of moved value: \`s\`
   ссылка внутрь вектора и push (аналог инвалидации указателя) → компиляция завершилась кодом 1; error[E0502] cannot borrow \`v\` as mutable because it is also borrowed as immutable
   ссылка на переменную, вышедшую из области видимости → компиляция завершилась кодом 1; error[E0597] \`x\` does not live long enough
   две изменяемые ссылки на одно значение → компиляция завершилась кодом 1; error[E0499] cannot borrow \`s\` as mutable more than once at a time
   передача Rc в другой поток (гонка на счётчике) → компиляция завершилась кодом 1; error[E0277] \`Rc<i32>\` cannot be sent between threads safely

освобождение по областям видимости (RAII) — порядок вывода детерминирован:
   конец внутреннего блока
   освобождён inner
   consume получил b
   освобождён b
   счётчик ссылок Rc: 2
   после drop(rc): счётчик 1, значение живо
   конец main
   освобождён rc
   освобождён c
   освобождён a
   (локальные значения освобождаются в порядке, обратном объявлению; Rc — когда счётчик достигает нуля)`, { filename: "Rust 1.97: ошибки владения при компиляции; освобождение по областям видимости" }),
      ul(
        "**Отвергнуто при компиляции** (код 1): использование после перемещения (`E0382`, аналог use-after-free), ссылка внутрь вектора с последующим `push` (`E0502`, аналог инвалидации указателя после `realloc`), ссылка на переменную, вышедшую из области (`E0597`), две изменяемые ссылки одновременно (`E0499`), передача `Rc` в другой поток (`E0277`).",
        "**Освобождение по областям (RAII):** внутренний блок завершился — `inner` освобождён; значение передано в `consume` — освобождено в конце функции; перемещённое значение освобождено один раз у нового владельца; `Rc` держит значение, пока счётчик больше нуля (после `drop(rc)` счётчик 1, значение живо; освобождение — в конце `main`). Локальные значения освобождаются в порядке, обратном объявлению: `rc`, затем `c`, затем `a`.",
        "**Цена:** программу нужно писать так, чтобы время жизни и владельца было видно компилятору; взамен нет ни сборщика, ни целого класса ошибок. То, что в C компилируется молча (см. таблицу выше), здесь не скомпилируется.",
      ),
      h("Подсчёт ссылок против трассировки"),
      code("js", `// Модели управления памятью: подсчёт ссылок и трассирующий сборщик (пометка и очистка) на игрушечной куче; настоящий сборщик V8
import v8 from "node:v8";
import vm from "node:vm";

class Heap {
  constructor() { this.objs = new Map(); this.roots = new Set(); this.next = 1; this.freed = 0; }
  alloc() { const o = { id: this.next++, refs: new Set(), rc: 0 }; this.objs.set(o.id, o); return o; }
  link(a, b) { a.refs.add(b); b.rc++; }
  unlink(a, b) { if (a.refs.delete(b)) this.decRef(b); }
  addRoot(o) { this.roots.add(o); o.rc++; }
  dropRoot(o) { this.roots.delete(o); this.decRef(o); }
  decRef(o) { if (--o.rc === 0 && this.objs.has(o.id)) { this.objs.delete(o.id); this.freed++; for (const c of [...o.refs]) { o.refs.delete(c); this.decRef(c); } } }   // подсчёт ссылок: освобождение сразу и каскадом
  markSweep() { const marked = new Set(), st = [...this.roots]; while (st.length) { const o = st.pop(); if (marked.has(o)) continue; marked.add(o); for (const c of o.refs) st.push(c); }
    let swept = 0; for (const [id, o] of this.objs) if (!marked.has(o)) { this.objs.delete(id); swept++; } return { marked: marked.size, swept }; }
}
console.log("1) цепочка A → B → C, корень указывает на A; корень убирают:");
let h = new Heap(); const [a, b, c] = [h.alloc(), h.alloc(), h.alloc()]; h.link(a, b); h.link(b, c); h.addRoot(a); h.dropRoot(a);
console.log("   подсчёт ссылок: сразу освобождено", h.freed, "из 3, живых", h.objs.size);
h = new Heap(); const [a2, b2, c2] = [h.alloc(), h.alloc(), h.alloc()]; h.link(a2, b2); h.link(b2, c2); h.addRoot(a2); h.roots.delete(a2);
{ const before = h.objs.size, res = JSON.stringify(h.markSweep()); console.log(\`   пометка и очистка: до сборки живых \${before}; сборка \${res}; после — живых \${h.objs.size}\`); }

console.log("2) цикл X ↔ Y, корень указывает на X; корень убирают:");
h = new Heap(); const [x, y] = [h.alloc(), h.alloc()]; h.link(x, y); h.link(y, x); h.addRoot(x); h.dropRoot(x);
console.log("   подсчёт ссылок: освобождено", h.freed, "из 2, живых (утечка)", h.objs.size, "; у каждого счётчик ссылок", x.rc, "и", y.rc);
h = new Heap(); const [x2, y2] = [h.alloc(), h.alloc()]; h.link(x2, y2); h.link(y2, x2); h.addRoot(x2); h.roots.delete(x2);
console.log("   пометка и очистка:", JSON.stringify(h.markSweep()), "→ живых", h.objs.size, "(недостижимость определяется от корней, а не по счётчику)");

console.log("3) 1000 итераций: создать пару объектов с циклом и отпустить:");
h = new Heap(); for (let i = 0; i < 1000; i++) { const [p, q] = [h.alloc(), h.alloc()]; h.link(p, q); h.link(q, p); h.addRoot(p); h.dropRoot(p); }
const leaked = h.objs.size; const gcres = h.markSweep();
console.log(\`   подсчёт ссылок: утекло \${leaked} объектов; пометка и очистка нашла и освободила \${gcres.swept}, осталось \${h.objs.size}\`);

console.log("4) стоимость сборки пропорциональна живому: куча из 10000 объектов, из которых достижимы 100:");
h = new Heap(); const live = []; for (let i = 0; i < 10000; i++) { const o = h.alloc(); if (i < 100) { live.push(o); h.addRoot(o); } }
const r = h.markSweep(); console.log(\`   помечено \${r.marked} (обход только живых), очищено \${r.swept}; доля живых \${(r.marked / 10000 * 100).toFixed(1).replace(".", ",")} % от выделенных\`);
console.log("   на этом наблюдении (работа пропорциональна числу живых) строятся поколенческие сборщики: опыт показывает, что большинство объектов умирает молодыми, и «молодое» поколение собирают чаще");

// настоящий сборщик V8
v8.setFlagsFromString("--expose-gc");
const gc = vm.runInNewContext("gc");
gc(); const base = process.memoryUsage().heapUsed;
let big = Array.from({ length: 1_000_000 }, (_, i) => ({ a: i, b: [i] }));
const grown = process.memoryUsage().heapUsed - base;
console.log("\\n5) настоящий сборщик V8 (Node " + process.versions.node.split(".").slice(0, 2).join(".") + ", принудительная сборка gc()):");
console.log("   миллион объектов увеличил кучу более чем на 50 МБ:", grown > 50e6 ? "да" : "нет");
big = null; gc();
const after = process.memoryUsage().heapUsed - base;
console.log("   после обнуления ссылки и gc() прирост кучи упал более чем на 90 %:", after < grown * 0.1 ? "да" : "нет");
console.error("   (калибровка) прирост:", (grown / 1e6).toFixed(0), "МБ, после gc:", (after / 1e6).toFixed(1), "МБ");
let strong = { name: "кеш" }; const weak = new WeakRef(strong);
await new Promise((r) => setTimeout(r, 0));
console.log("   слабая ссылка (WeakRef), пока есть сильная:", weak.deref() ? "объект доступен" : "объекта нет");
strong = null; await new Promise((r) => setTimeout(r, 0)); gc(); await new Promise((r) => setTimeout(r, 0));
console.log("   после обнуления сильной ссылки и сборки:", weak.deref() ? "объект доступен" : "объект собран (слабая ссылка пуста)");
console.log("   спецификация не гарантирует момент и сам факт сборки: WeakRef нельзя использовать для логики корректности, только для кешей");`, { filename: "07-gc-models.mjs", collapsed: true }),
      code("text", `1) цепочка A → B → C, корень указывает на A; корень убирают:
   подсчёт ссылок: сразу освобождено 3 из 3, живых 0
   пометка и очистка: до сборки живых 3; сборка {"marked":0,"swept":3}; после — живых 0
2) цикл X ↔ Y, корень указывает на X; корень убирают:
   подсчёт ссылок: освобождено 0 из 2, живых (утечка) 2 ; у каждого счётчик ссылок 1 и 1
   пометка и очистка: {"marked":0,"swept":2} → живых 0 (недостижимость определяется от корней, а не по счётчику)
3) 1000 итераций: создать пару объектов с циклом и отпустить:
   подсчёт ссылок: утекло 2000 объектов; пометка и очистка нашла и освободила 2000, осталось 0
4) стоимость сборки пропорциональна живому: куча из 10000 объектов, из которых достижимы 100:
   помечено 100 (обход только живых), очищено 9900; доля живых 1,0 % от выделенных
   на этом наблюдении (работа пропорциональна числу живых) строятся поколенческие сборщики: опыт показывает, что большинство объектов умирает молодыми, и «молодое» поколение собирают чаще

5) настоящий сборщик V8 (Node 22.22, принудительная сборка gc()):
   миллион объектов увеличил кучу более чем на 50 МБ: да
   после обнуления ссылки и gc() прирост кучи упал более чем на 90 %: да
   слабая ссылка (WeakRef), пока есть сильная: объект доступен
   после обнуления сильной ссылки и сборки: объект собран (слабая ссылка пуста)
   спецификация не гарантирует момент и сам факт сборки: WeakRef нельзя использовать для логики корректности, только для кешей`, { filename: "игрушечная куча: подсчёт ссылок и пометка и очистка; сборщик V8" }),
      ul(
        "**Цепочка** A → B → C: подсчёт ссылок освобождает все 3 объекта сразу, каскадом, в момент потери последней ссылки; пометка и очистка освобождает их при следующей сборке.",
        "**Цикл** X ↔ Y после потери корня: у каждого объекта счётчик остаётся равным 1 — подсчёт ссылок не освободил **ничего** (утечка 2 из 2). За **1000 итераций** утекло **2000** объектов; пометка и очистка нашла и освободила все 2000. Недостижимость определяется от корней, а не по счётчику.",
        "**Стоимость сборки пропорциональна живому:** в куче из 10 000 объектов достижимы 100 — помечено 100, очищено 9900 (доля живых 1,0 %). На этом строятся поколенческие сборщики: считается, что большинство объектов умирает молодыми, и «молодое» поколение собирают чаще.",
        "**Настоящий V8:** миллион объектов увеличил кучу более чем на 50 МБ (в калибровочных прогонах — около 104 МБ); после обнуления ссылки и `gc()` прирост упал более чем на 90 % (в калибровке — около нуля). Слабая ссылка `WeakRef` пока есть сильная — объект доступен, после сборки — пуста; момент и сам факт сборки спецификация не гарантирует, поэтому `WeakRef` — только для кешей.",
      ),
      h("Python: динамическая типизация, счётчики, предел рекурсии, цена объектов"),
      code("python", `# Python: динамическая строгая типизация, подсчёт ссылок и сборщик циклов, предел рекурсии, цена «коробочных» объектов
import array, gc, sys

print("CPython", sys.version.split()[0])
print("1) динамическая типизация: тип у значения, а не у переменной; типизация строгая — неявных преобразований между строкой и числом нет")
x = 1; t1 = type(x).__name__
x = "a"; t2 = type(x).__name__
print(f"   x = 1 → {t1}; затем x = 'a' → {t2}: одно имя, разные типы значений")
for expr in ["1 + '1'", "[] + ()", "'a' * 2.0", "None + 1"]:
    try: print("   ", expr.ljust(10), "→", eval(expr))
    except TypeError as e: print("   ", expr.ljust(10), "→ TypeError:", e)
print(f"    1 + True → {1 + True} (bool — подкласс int: {issubclass(bool, int)})")

class Noisy:
    def __init__(self, name): self.name = name
    def __del__(self): print("    __del__", self.name)

print("2) подсчёт ссылок: sys.getrefcount (включает временную ссылку самого вызова)")
o = Noisy("o"); c1 = sys.getrefcount(o)
alias = o; c2 = sys.getrefcount(o)
holder = [o]; c3 = sys.getrefcount(o)
del alias; c4 = sys.getrefcount(o)
print("   одна переменная:", c1, "; плюс псевдоним:", c2, "; плюс список:", c3, "; после del псевдонима:", c4)
print("   удаляем последние две ссылки (del holder; del o):")
del holder; del o
print("   вывод __del__ появился до этой строки: объект уничтожен в момент, когда счётчик стал нулём")

print("3) цикл ссылок: подсчёт ссылок его не освобождает; сборщик циклов — освобождает")
gc.disable()
a = Noisy("a"); b = Noisy("b"); a.other = b; b.other = a
del a, b
print("   после del обеих переменных __del__ не вызывался (счётчики не обнулились)")
found = gc.collect()
print("   gc.collect() нашёл недостижимых объектов не меньше 2:", "да" if found >= 2 else "нет", "(и вызвал __del__ выше)")
print("   у ссылок нет понятия «владелец» — только достижимость от корней; порядок вызова __del__ у объектов цикла определён реализацией")
gc.enable()

print("4) стек вызовов и предел рекурсии:")
print("   предел по умолчанию:", sys.getrecursionlimit())
def depth(n): return 0 if n == 0 else 1 + depth(n - 1)
try: depth(5000)
except RecursionError as e: print("   depth(5000) → RecursionError:", e)
sys.setrecursionlimit(20000)
print("   после setrecursionlimit(20000): depth(5000) =", depth(5000), "(кадры Python живут в куче; предел защищает стек C)")

print("5) тип определяет представление: миллион целых")
n = 1_000_000
lst = list(range(1000, 1000 + n)); arr = array.array("i", range(1000, 1000 + n))
boxed = sys.getsizeof(lst) + sum(sys.getsizeof(i) for i in lst)
raw = arr.itemsize * len(arr)
print("   размер объекта int:", sys.getsizeof(1000), "байт; пустого списка:", sys.getsizeof([]), "; пустой строки:", sys.getsizeof(""), "; кортежа из трёх элементов:", sys.getsizeof((1, 2, 3)))
print(f"   list из миллиона int: {boxed:,} байт (указатели {sys.getsizeof(lst):,} + объекты {boxed - sys.getsizeof(lst):,}); данные array('i'): {raw:,} байт ({arr.itemsize} байта на число); отношение: {boxed / raw:.1f}".replace(",", " "))`, { filename: "08-python-types-refcount.py", collapsed: true }),
      code("text", `CPython 3.11.15
1) динамическая типизация: тип у значения, а не у переменной; типизация строгая — неявных преобразований между строкой и числом нет
   x = 1 → int; затем x = 'a' → str: одно имя, разные типы значений
    1 + '1'    → TypeError: unsupported operand type(s) for +: 'int' and 'str'
    [] + ()    → TypeError: can only concatenate list (not "tuple") to list
    'a' * 2.0  → TypeError: can't multiply sequence by non-int of type 'float'
    None + 1   → TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'
    1 + True → 2 (bool — подкласс int: True)
2) подсчёт ссылок: sys.getrefcount (включает временную ссылку самого вызова)
   одна переменная: 2 ; плюс псевдоним: 3 ; плюс список: 4 ; после del псевдонима: 3
   удаляем последние две ссылки (del holder; del o):
    __del__ o
   вывод __del__ появился до этой строки: объект уничтожен в момент, когда счётчик стал нулём
3) цикл ссылок: подсчёт ссылок его не освобождает; сборщик циклов — освобождает
   после del обеих переменных __del__ не вызывался (счётчики не обнулились)
    __del__ a
    __del__ b
   gc.collect() нашёл недостижимых объектов не меньше 2: да (и вызвал __del__ выше)
   у ссылок нет понятия «владелец» — только достижимость от корней; порядок вызова __del__ у объектов цикла определён реализацией
4) стек вызовов и предел рекурсии:
   предел по умолчанию: 1000
   depth(5000) → RecursionError: maximum recursion depth exceeded
   после setrecursionlimit(20000): depth(5000) = 5000 (кадры Python живут в куче; предел защищает стек C)
5) тип определяет представление: миллион целых
   размер объекта int: 28 байт; пустого списка: 56 ; пустой строки: 49 ; кортежа из трёх элементов: 64
   list из миллиона int: 36 000 056 байт (указатели 8 000 056 + объекты 28 000 000); данные array('i'): 4 000 000 байт (4 байта на число); отношение: 9.0`, { filename: "CPython 3.11: типы, getrefcount, __del__, gc.collect, recursionlimit, getsizeof" }),
      ul(
        "**Динамическая строгая типизация:** одно имя `x` держало `int`, затем `str` — тип у значения; но `1 + '1'`, `[] + ()`, `'a' * 2.0`, `None + 1` дают `TypeError`: неявных преобразований нет. `bool` — подкласс `int` (`1 + True = 2`).",
        "**Подсчёт ссылок:** `sys.getrefcount` — 2 (переменная плюс временная ссылка вызова), 3 с псевдонимом, 4 со списком, 3 после `del` псевдонима. Когда последние ссылки удалены, `__del__` вызывается **в ту же строку** — освобождение мгновенное.",
        "**Цикл ссылок:** после `del` обеих переменных `__del__` не вызывался; `gc.collect()` нашёл не менее 2 недостижимых объектов и вызвал `__del__` у обоих.",
        "**Предел рекурсии:** по умолчанию 1000; `depth(5000)` — `RecursionError`; после `setrecursionlimit(20000)` — 5000 (кадры Python живут в куче, предел защищает стек C).",
        "**Цена «коробочных» значений:** `int` — 28 байт, пустой список — 56, пустая строка — 49, кортеж из трёх элементов — 64. Список из миллиона `int` занимает **36 000 056** байт (указатели 8 000 056 + объекты 28 000 000), данные `array('i')` — **4 000 000** байт: в **9,0 раза** меньше.",
      ),
    ]),

    section("internals", [
      h("Что происходит под капотом"),
      ul(
        "**Проверка типов** — отдельная стадия компилятора (см. [компиляцию и интерпретацию](/learn/cs/compilation-interpretation)): таблица символов, вывод через унификацию, проверка совместимости. Результаты проверки можно отбросить (стирание типов) или использовать при генерации кода (размеры и смещения в C).",
        "**Размещение полей** определяется правилами ABI платформы: поле выравнивается по собственному размеру, структура — по самому строгому полю; размер округляется до кратного выравниванию. Поэтому `Mixed` занимает 24 байта при 12 полезных, а `Record` из упражнения — 24 при 14 (10 пустых байт, 41 %).",
        "**Стек** управляется процессором и компилятором: вызов уменьшает указатель стека на размер кадра и кладёт адрес возврата; выход — восстанавливает. Предел стека — параметр процесса (`RLIMIT_STACK`); при его превышении ядро присылает `SIGSEGV`.",
        "**Распределитель (glibc `malloc`)** держит списки свободных блоков по размерам: малые блоки берёт из кучи (область, растущая вверх), большие (от 128 КиБ по умолчанию) — отдельными отображениями страниц; освобождённый блок возвращается в список, поэтому следующий запрос того же размера получает тот же адрес. Это объясняет, почему ошибки вроде use-after-free часто «работают».",
        "**AddressSanitizer** окружает блоки «красными зонами» и помечает освобождённую память в теневой карте; каждое обращение проверяется — отсюда точные диагнозы и замедление работы. **Valgrind** выполняет программу на виртуальном процессоре и проверяет каждое обращение без перекомпиляции.",
        "**Сборщик V8** делит кучу на поколения: «молодое» собирается часто и быстро, «старое» — реже; часть работы выполняется параллельно с программой. **CPython** использует подсчёт ссылок и дополнительный сборщик циклов (модуль `gc`).",
        "**Модель памяти в смысле многопоточности** — отдельная тема: в C11 гонка данных — неопределённое поведение, а видимость записей между потоками определяется отношением «происходит раньше» (см. [конкурентность и планирование](/learn/cs/concurrency-scheduling)).",
      ),
    ]),

    section("mistakes", [
      wrongRight(
        "c",
        {
          title: "Неверно",
          code: `
            Vec v = {0};
            push(&v, 10); push(&v, 20);
            int *first = &v.data[0];       /* указатель внутрь блока */
            push(&v, 30);                  /* realloc может переместить блок */
            printf("%d\\n", *first);        /* чтение после освобождения старого блока */
          `,
          note: "Под AddressSanitizer: `heap-use-after-free`, `READ of size 4`; блок освобождён внутри `realloc` при вызове `push`. Без проверок программа может «работать» годами.",
        },
        {
          title: "Верно",
          code: `
            Vec v = {0};
            push(&v, 10); push(&v, 20);
            size_t first = 0;              /* индекс, а не указатель */
            push(&v, 30);
            printf("%d\\n", v.data[first]); /* всегда верный адрес после перемещения */
          `,
          note: "Индекс остаётся верным при любом перемещении блока; в Rust аналогичный код с ссылкой не скомпилируется (`E0502`).",
        },
      ),
      ul(
        "**Считать, что `strict` в TypeScript гарантирует типы.** Данные извне (`JSON.parse`, ответы API), `any` и `as` обходят проверку: 4 из 4 «дыр» скомпилировались без ошибок.",
        "**Полагаться на «у меня работает» при ошибках памяти.** 5 из 6 ошибок завершились с кодом 0; одна и та же программа с ошибкой может не падать годами и упасть после смены распределителя или компилятора.",
        "**Хранить указатель или ссылку на элемент растущего контейнера.** После перераспределения она указывает на освобождённую память; храните индекс или перечитывайте указатель.",
        "**Рассчитывать на подсчёт ссылок без учёта циклов.** Цикл из двух объектов не освобождается: в замере утекло 2000 из 2000 объектов.",
        "**Складывать поля структуры «как придётся».** Тот же набор полей — 12 или 8 байт, 24 или 16; для миллионов записей это десятки процентов памяти и кеша.",
        "**Передавать глубоко вложенные данные рекурсией без ограничения.** Предел стека — 8192 КиБ (около 131 тысячи кадров по 64 байта), у Python — 1000 вызовов по умолчанию.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**`any` и `as` как способ «заставить компилятор замолчать».** Это отключает проверку именно там, где она нужна. Вместо этого — `unknown` и сужение типа проверкой во время выполнения.",
        "**Доверять размерам и индексам из внешних данных** (длины в заголовках, счётчики элементов) без проверки границ: классический путь к переполнению буфера (см. задание: доверчивый разбор падает на первом же некорректном входе под ASan).",
        "**Освобождать память «где-нибудь потом».** Неясное владение даёт утечки и двойное освобождение; определите владельца каждого блока и правило освобождения (в C — парные функции, в C++ и Rust — RAII).",
        "**Отключать санитайзеры «из-за скорости» в тестах.** Замедление в разы — малая цена за обнаружение целого класса ошибок; запускайте набор тестов под ASan/UBSan в CI.",
        "**Использовать `WeakRef` и финализаторы для логики программы.** Момент сборки не гарантирован; допустимо только для кешей и необязательной очистки.",
        "**Мерить память по числу элементов, забыв про представление.** Миллион `int` в списке Python — 36 МБ, в массиве — 4 МБ.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Типы на границах:** данные извне проверяйте при входе (схема, валидатор, `typeof`); внутри программы полагайтесь на статические типы без `any`.",
        "**Включайте строгие режимы:** `strict` в TypeScript, `-Wall -Wextra` и санитайзеры в C, `clippy` в Rust; ошибка при сборке дешевле ошибки в продакшене.",
        "**Моделируйте вариантами:** размеченные объединения и проверка исчерпанности (`never`) превращают добавление нового варианта в ошибку компиляции везде, где его забыли обработать.",
        "**Определите владельца каждого ресурса:** кто выделяет, кто освобождает; для файлов, соединений и блокировок — RAII, `with`, `try-finally`, `using`, а не сборщик мусора.",
        "**Тестируйте под AddressSanitizer и UBSan**, запускайте случайные входы (fuzzing) для разбора внешних форматов; в замере проверяющий парсер выдержал 200 000 случайных входов без ошибок.",
        "**Упорядочивайте поля по убыванию размера** для массивов миллионов структур, но проверяйте измерением: читаемость и совместимость формата важнее нескольких байт.",
        "**Проверяйте границы через вычитание**, а не сложение (`len > size - pos`): `pos + len` может переполниться.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Ковариантность и контравариантность.** Массивы TypeScript ковариантны (небезопасно): `Dog[]` присваивается `Animal[]`; результат — в замере `TypeError` при выполнении. Безопасны неизменяемые коллекции и функции, контравариантные по параметрам.",
        "**Нулевые и пустые значения.** `null`, `undefined`, `NaN`, `−0` — значения с особым поведением: `−0` и `+0` равны как числа и различны как битовые строки (`0x80000000` и `0x00000000`).",
        "**Неопределённое поведение.** Знаковое переполнение, сдвиг на 32 бита, выход за границы — в C не «ошибка с последствиями», а свобода для оптимизатора: при компиляции с оптимизацией результат может отличаться от ожидаемого; без проверок в замере `INT_MAX + 1` дало −2147483648, а `1 << 32` — 1.",
        "**Ошибки, зависящие от распределителя.** Чтение после `free` может вернуть старое значение, мусор или авария — зависит от состояния кучи; повторный запрос того же размера возвращает тот же адрес.",
        "**Утечки в языках со сборщиком.** Объект, достижимый от корня (в кеше, обработчике событий, глобальном массиве), не собирается: это утечка, хотя `free` не нужен (подробнее — [управление памятью в JavaScript](/learn/js/memory-gc)).",
        "**Финализаторы и слабые ссылки.** Порядок и время вызова не определены; на них нельзя строить корректность.",
        "**Пределы глубины.** Рекурсия ограничена стеком (около 131 тысячи кадров по 64 байта при пределе 8192 КиБ) или настройкой языка (1000 в Python); для обхода глубоких структур используйте явный стек.",
      ),
    ]),

    section("related", [
      ul(
        "[Компиляция и интерпретация](/learn/cs/compilation-interpretation) — стадии, где работает проверка типов; стирание типов и представление в байт-коде.",
        "[Системы счисления и кодирование](/learn/cs/number-systems-encoding) — порядок байтов, представление чисел с плавающей запятой, `NaN` и `−0`.",
        "[Процессор, память и кеш](/learn/cs/cpu-memory-cache) — выравнивание, кеш-линии, цена размещения данных.",
        "[Виртуальная память и файловые системы](/learn/cs/virtual-memory-files) — страницы, отображения, `mmap`, откуда берётся память кучи.",
        "[Процессы и потоки](/learn/cs/processes-threads) — стек потока, `fork`, границы процессов.",
        "[Конкурентность и планирование](/learn/cs/concurrency-scheduling) — модель памяти при многопоточности, гонки данных.",
        "[Хеш-таблицы](/learn/cs/hash-tables) — представление объектов, указатели и коллизии.",
        "[Массивы и связные списки](/learn/cs/arrays-linked-lists) — непрерывное и ссылочное размещение, `realloc`, динамические массивы.",
        "[JavaScript: память и сборка мусора](/learn/js/memory-gc) — утечки, достижимость, `WeakRef` на практике.",
        "[JavaScript: переменные и типы](/learn/js/variables-types) — динамические типы и преобразования.",
        "[JavaScript: операторы и приведение типов](/learn/js/operators-coercion) — слабая типизация на примерах.",
        "[Абстракция и модульность](/learn/cs/abstraction-modularity) — типы как интерфейсы и границы модулей.",
        "[Тестирование и проектирование ПО](/learn/cs/software-testing-design) — санитайзеры, случайные входы и проверка корректности.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "c",
        {
          title: "Доверчивый разбор длин из входных данных",
          code: `
            unsigned n = buf[0];
            for (unsigned i = 0; i < n; i++) {
              unsigned l = buf[pos++];                 /* длина из данных — на веру */
              for (unsigned k = 0; k < l; k++) sum += buf[pos++];
            }
          `,
          note: "Обычная сборка: все 200 000 случайных входов «обработаны» с кодом 0; под AddressSanitizer — `heap-buffer-overflow`, `READ of size 1` уже на входе №1.",
        },
        {
          title: "Проверка границ перед каждым чтением",
          code: `
            if (pos >= len) return fail();
            size_t l = buf[pos++];
            if (l > len - pos) return fail();         /* вычитание: без переполнения */
            for (size_t k = 0; k < l; k++) sum += buf[pos++];
            /* в конце: принять только если pos == len */
          `,
          note: "На 200 000 случайных входах: принято 4165, отвергнуто 195 835, ошибок AddressSanitizer нет; на всех допустимых входах результаты совпали с доверчивой версией.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "cs.types-memory-models.ex1",
      title: "Размер структуры и порядок полей",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Структура `struct Record { char a; double b; char c; int d; }` компилируется на x86-64 (`char` 1, `int` 4, `double` 8 байт; поле выравнивается по собственному размеру, структура — по самому строгому полю). Определите смещения полей, размер и выравнивание структуры; затем переставьте поля так, чтобы размер стал минимальным, и объясните, где в исходной версии пропадают байты."),
      ],
      hints: [
        "Начните с `a` по смещению 0; следующее поле ставится по ближайшему адресу, кратному его размеру.",
        "Размер структуры округляется до кратного её выравниванию (самому строгому полю).",
        "Минимум обычно получается, если расположить поля по убыванию размера.",
      ],
      checks: ["`Record`: `a = 0`, `b = 8`, `c = 16`, `d = 20`, размер 24, выравнивание 8", "Пустых байт: 7 после `a` и 3 после `c` плюс 0 в хвосте — всего 10 из 24 (41 %)", "`Compact { double b; int d; char a; char c; }`: размер 16, `b = 0`, `d = 8`, `a = 12`, `c = 13`; пустых 2 из 16 (12 %)"],
      solution: [
        code("c", `// Упражнение: размер и смещения структуры; переупорядочивание полей уменьшает размер
#include <stdio.h>
#include <stddef.h>

struct Record  { char a; double b; char c; int d; };       // исходный порядок
struct Compact { double b; int d; char a; char c; };       // по убыванию размера

int main(void) {
    printf("Record : размер %zu, выравнивание %zu; смещения a=%zu b=%zu c=%zu d=%zu\\n", sizeof(struct Record), _Alignof(struct Record),
           offsetof(struct Record, a), offsetof(struct Record, b), offsetof(struct Record, c), offsetof(struct Record, d));
    printf("Compact: размер %zu, выравнивание %zu; смещения b=%zu d=%zu a=%zu c=%zu\\n", sizeof(struct Compact), _Alignof(struct Compact),
           offsetof(struct Compact, b), offsetof(struct Compact, d), offsetof(struct Compact, a), offsetof(struct Compact, c));
    size_t used = sizeof(char) * 2 + sizeof(double) + sizeof(int);
    printf("полезных байт %zu; пустых в Record %zu (%zu%%), в Compact %zu (%zu%%)\\n", used, sizeof(struct Record) - used, (sizeof(struct Record) - used) * 100 / sizeof(struct Record), sizeof(struct Compact) - used, (sizeof(struct Compact) - used) * 100 / sizeof(struct Compact));
    return 0;
}`, { filename: "проверка размеров и смещений", collapsed: true }),
        code("text", `Record : размер 24, выравнивание 8; смещения a=0 b=8 c=16 d=20
Compact: размер 16, выравнивание 8; смещения b=0 d=8 a=12 c=13
полезных байт 14; пустых в Record 10 (41%), в Compact 2 (12%)`, { filename: "результат на gcc 13.3" }),
        ul(
          "`a` — смещение 0. `b` (`double`) должно лежать по адресу, кратному 8: смещение 8 (7 пустых байт). `c` — смещение 16. `d` (`int`) — кратное 4: смещение 20 (3 пустых байта). Итого 24 байта, выравнивание 8 (из-за `double`).",
          "Полезных данных 14 байт (1 + 8 + 1 + 4), пустых — 10 (41 %).",
          "Порядок `double, int, char, char` даёт смещения 0, 8, 12, 13 и размер 16: после `c` остаётся 2 байта хвоста — округление до кратного 8. Выигрыш 8 байт на запись, то есть 33 % от исходного размера.",
        ),
      ],
    }),
    exercise({
      id: "cs.types-memory-models.ex2",
      title: "Сборщик мусора «пометка и очистка»",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Куча — это `Map` из идентификатора в объект `{ refs: [id, ...] }`, корни — массив идентификаторов. Напишите `collect(heap, roots)`: удалить из кучи все объекты, недостижимые от корней, и вернуть отсортированный массив их идентификаторов. Алгоритм должен корректно работать с циклами (и достижимыми, и недостижимыми) и не зацикливаться."),
      ],
      starter: {
        lang: "js",
        code: `
          function collect(heap, roots) {
            // 1) пометить всё достижимое от корней
            // 2) удалить из heap непомеченное, вернуть список освобождённых id
          }
        `,
      },
      hints: [
        "Обход графа от корней — как поиск в глубину; множество помеченных защищает от циклов.",
        "Не удаляйте из `Map` во время итерации по нему — возьмите копию списка ключей.",
        "Ссылка на несуществующий идентификатор не должна вызывать ошибку.",
      ],
      checks: ["Для графа 1→{2,3}, 2→4, 4→2, 5↔6, 7→1 и корня `[1]`: освобождены `[5, 6, 7]`", "При корнях `[1, 5]`: освобождён только `[7]`", "Без корней освобождены все 7 объектов", "Повторная сборка ничего не освобождает"],
      solution: [
        code("js", `// Упражнение: сборщик мусора «пометка и очистка» для графа объектов
function collect(heap, roots) {
  // heap: Map(id → { refs: [id, ...] }); roots: [id, ...]; возвращает отсортированный список освобождённых id
  const marked = new Set();
  const stack = [...roots];
  while (stack.length) {
    const id = stack.pop();
    if (marked.has(id) || !heap.has(id)) continue;       // уже помечен (защита от циклов) или не существует
    marked.add(id);
    for (const child of heap.get(id).refs) stack.push(child);
  }
  const freed = [];
  for (const id of [...heap.keys()]) if (!marked.has(id)) { heap.delete(id); freed.push(id); }
  return freed.sort((a, b) => a - b);
}

const graph = () => new Map([
  [1, { refs: [2, 3] }],     // корень 1 → 2, 3
  [2, { refs: [4] }],
  [3, { refs: [] }],
  [4, { refs: [2] }],        // цикл 2 ↔ 4, достижимый из корня
  [5, { refs: [6] }],        // недостижимый цикл 5 ↔ 6
  [6, { refs: [5] }],
  [7, { refs: [1] }],        // недостижимый объект, ссылающийся на живой
]);
let h = graph();
console.log("корень [1]: освобождены", JSON.stringify(collect(h, [1])), "; осталось", JSON.stringify([...h.keys()]));
h = graph();
console.log("корни [1, 5]: освобождены", JSON.stringify(collect(h, [1, 5])), "; осталось", JSON.stringify([...h.keys()]));
h = graph();
console.log("корней нет: освобождены", JSON.stringify(collect(h, [])), "; осталось", JSON.stringify([...h.keys()]));
h = graph();
console.log("повторная сборка ничего не освобождает:", JSON.stringify(collect(h, [1]) && collect(h, [1])));`, { filename: "решение", collapsed: true }),
        code("text", `корень [1]: освобождены [5,6,7] ; осталось [1,2,3,4]
корни [1, 5]: освобождены [7] ; осталось [1,2,3,4,5,6]
корней нет: освобождены [1,2,3,4,5,6,7] ; осталось []
повторная сборка ничего не освобождает: []`, { filename: "проверка на графе с циклами" }),
        p("Решение — обход в глубину с явным стеком: достижимые объекты помечаются в множестве `marked`, повторный заход в помеченный объект пропускается (так циклы не зацикливают обход). Затем все объекты кучи, которых нет в `marked`, удаляются. Объект `7` ссылается на живой `1`, но сам недостижим — освобождён: достижимость идёт от корней, а не к ним. Цикл `5 ↔ 6`, недостижимый от корней, освобождён целиком — именно это не умеет подсчёт ссылок."),
      ],
    }),
    exercise({
      id: "cs.types-memory-models.ex3",
      title: "Динамический массив иногда выводит мусор",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Программа хранит целые в динамическом массиве (`push` увеличивает блок через `realloc` вдвое при заполнении), берёт указатель на первый элемент, добавляет ещё один элемент и читает значение по сохранённому указателю. Обычная сборка выводит нужное число, но иногда — мусор или падает. Найдите ошибку инструментом, объясните причину и исправьте код."),
      ],
      hints: [
        "Соберите программу с `-fsanitize=address -g` и посмотрите, где блок был освобождён.",
        "Что делает `realloc`, когда блок нельзя расширить на месте?",
        "Какой способ ссылки на элемент не зависит от адреса блока?",
      ],
      checks: ["Диагноз: `heap-use-after-free`, `READ of size 4`", "Блок освобождён внутри `realloc`, вызванного из `push`", "Исправление: хранить индекс элемента, а не указатель; результат `realloc` проверять перед присваиванием", "Исправленная версия под ASan выводит 10 и завершается кодом 0"],
      solution: [
        code("bash", `#!/bin/bash
# Упражнение: указатель на элемент динамического массива переживает realloc; поиск ошибки AddressSanitizer и исправление индексом
d=$(mktemp -d); cd "$d"
cat > bug.c <<'C'
#include <stdio.h>
#include <stdlib.h>

typedef struct { int *data; size_t len, cap; } Vec;

static void push(Vec *v, int x) {
    if (v->len == v->cap) {
        v->cap = v->cap ? v->cap * 2 : 2;
        v->data = realloc(v->data, v->cap * sizeof(int));     // блок может переехать на другой адрес
    }
    v->data[v->len++] = x;
}

int main(void) {
    Vec v = {0};
    push(&v, 10); push(&v, 20);
    int *first = &v.data[0];            // указатель на элемент внутри блока
    push(&v, 30);                       // len == cap: realloc выделяет новый блок и освобождает старый
    printf("первый элемент: %d\\n", *first);
    free(v.data);
    return 0;
}
C
cat > fixed.c <<'C'
#include <stdio.h>
#include <stdlib.h>

typedef struct { int *data; size_t len, cap; } Vec;

static void push(Vec *v, int x) {
    if (v->len == v->cap) {
        size_t cap = v->cap ? v->cap * 2 : 2;
        int *p = realloc(v->data, cap * sizeof(int));
        if (!p) { perror("realloc"); exit(1); }                // старый блок цел, если realloc вернул NULL
        v->data = p; v->cap = cap;
    }
    v->data[v->len++] = x;
}

int main(void) {
    Vec v = {0};
    push(&v, 10); push(&v, 20);
    size_t first = 0;                   // индекс остаётся верным после перемещения блока
    push(&v, 30);
    printf("первый элемент: %d\\n", v.data[first]);
    free(v.data);
    return 0;
}
C
gcc -O0 -g -fsanitize=address -o bug bug.c && ./bug > bug.out 2> bug.err; echo "версия с ошибкой под ASan: код выхода $?"
echo "   диагноз: $(grep -oE 'ERROR: AddressSanitizer: [a-z-]+' bug.err | head -1 | sed 's/ERROR: AddressSanitizer: //'); чтение $(grep -oE 'READ of size [0-9]+' bug.err | head -1)"
echo "   блок освобождён внутри: $(awk '/freed by thread/{f=1} f&&/#[0-9]+ /{print $4; n++} n==3{exit}' bug.err | tr '\\n' ' ')"
echo "   (в стеке освобождения realloc и push — блок был освобождён при увеличении массива)"
gcc -O0 -g -fsanitize=address -o fixed fixed.c && ./fixed; echo "исправленная версия под ASan: код выхода $?, ошибок AddressSanitizer: 0"
cd /; rm -rf "$d"`, { filename: "стенд: ошибочная и исправленная версии", collapsed: true }),
        code("text", `версия с ошибкой под ASan: код выхода 1
   диагноз: heap-use-after-free; чтение READ of size 4
   блок освобождён внутри: realloc push main 
   (в стеке освобождения realloc и push — блок был освобождён при увеличении массива)
первый элемент: 10
исправленная версия под ASan: код выхода 0, ошибок AddressSanitizer: 0`, { filename: "AddressSanitizer на ошибочной и исправленной версиях" }),
        ul(
          "**Причина.** При третьем `push` массив заполнен (`len == cap`), `realloc` выделяет новый блок, копирует данные и **освобождает старый**. Сохранённый `first` остаётся адресом внутри освобождённого блока: чтение — use-after-free. Если `realloc` смог расширить блок на месте, ошибка не проявляется — отсюда «иногда».",
          "**Диагноз ASan:** `heap-use-after-free`, `READ of size 4`; в стеке освобождения — `realloc`, `push`, `main`.",
          "**Исправление 1.** Хранить индекс (`size_t first = 0`) и читать `v.data[first]` после всех добавлений.",
          "**Исправление 2.** Присваивать результат `realloc` временной переменной и проверять на `NULL`: при неудаче старый блок цел, а прямое присваивание `v->data = realloc(...)` потеряло бы его.",
          "**Профилактика.** Запускать тесты под AddressSanitizer; в Rust такой код не скомпилируется (`E0502`).",
        ),
      ],
    }),
  ],

  challenge: {
    id: "cs.types-memory-models.challenge",
    title: "Безопасный разбор бинарного сообщения",
    scenario: [
      p("Сетевой сервис на C принимает сообщения формата `[n][len1][байты…][len2][байты…]…`: первый байт — число элементов, далее для каждого — байт длины и столько байт данных. Первая версия разбора доверяет длинам из сообщения и подозревается в уязвимости. Нужно написать проверяющий разбор, доказать на случайных входах отсутствие обращений за пределы буфера и показать, что на корректных входах результаты не изменились."),
    ],
    requirements: [
      "Проверяющий разбор: перед каждым чтением проверять, что оно укладывается в буфер; принимать сообщение, только если оно использует буфер ровно целиком",
      "Проверка границ без переполнения (`l > len - pos`, а не `pos + l > len`)",
      "Тестовый стенд: не менее 100 000 случайных входов фиксированной длины 1…24 байта, буфер каждого выделен ровно по размеру входа",
      "Запуск под AddressSanitizer: доверчивая версия должна быть уличена, проверяющая — пройти без ошибок",
      "Сравнение реализаций на допустимых входах: результаты (число элементов, сумма байтов) совпадают",
    ],
    constraints: [
      "Генератор случайных входов детерминирован (фиксированное начальное значение), чтобы результаты воспроизводились",
      "Результат доверчивой версии должен быть использован (иначе компилятор вправе выбросить вызов)",
      "Нельзя полагаться на то, что обычная сборка «не падает»: критерий — отсутствие ошибок под санитайзером",
    ],
    acceptance: [
      "Под ASan доверчивая версия завершается с `heap-buffer-overflow` и сообщением о номере входа",
      "Проверяющая версия обработала все входы; число принятых и отвергнутых указано",
      "Сравнение на допустимых входах: расхождений 0",
      "Описано, почему обычная сборка не обнаружила ошибку",
    ],
    hints: [
      "Буфер должен быть выделен ровно под вход: тогда любое чтение за концом попадёт в красную зону ASan.",
      "Для вывода номера входа при аварии подойдёт обратный вызов `__sanitizer_set_death_callback`.",
      "Допустимых входов будет мало (доли процента случайных): задавайте байтам небольшие значения, чтобы длины часто помещались.",
    ],
    solution: [
      code("c", `// Разбор сообщения [n][len1 байты…][len2 байты…]…: доверчивая и проверяющая реализации, случайные входы
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#ifdef __SANITIZE_ADDRESS__
#include <sanitizer/common_interface_defs.h>      // доступно только в сборке с AddressSanitizer
#endif

typedef struct { int ok; unsigned items, payload; } Result;

// ОШИБКА: длины из входных данных принимаются на веру
static Result parse_naive(const uint8_t *buf, size_t len) {
    (void)len;
    Result r = {1, 0, 0};
    size_t pos = 1;
    unsigned n = buf[0];
    for (unsigned i = 0; i < n; i++) {
        unsigned l = buf[pos++];
        for (unsigned k = 0; k < l; k++) r.payload += buf[pos++];      // читает за концом буфера
        r.items++;
    }
    return r;
}

// ВЕРНО: перед каждым чтением проверяется, что оно укладывается в буфер; в конце не должно быть лишних байтов
static Result parse_checked(const uint8_t *buf, size_t len) {
    Result r = {0, 0, 0};
    if (len < 1) return r;
    size_t pos = 1;
    unsigned n = buf[0];
    for (unsigned i = 0; i < n; i++) {
        if (pos >= len) return (Result){0, 0, 0};
        size_t l = buf[pos++];
        if (l > len - pos) return (Result){0, 0, 0};                   // без переполнения: сравнение через вычитание
        for (size_t k = 0; k < l; k++) r.payload += buf[pos++];
        r.items++;
    }
    r.ok = (pos == len);
    return r;
}

static uint32_t rng = 2463534242u;
static uint32_t next(void) { rng ^= rng << 13; rng ^= rng >> 17; rng ^= rng << 5; return rng; }
static size_t current;
static volatile unsigned sink;                                          // результат должен быть наблюдаем, иначе компилятор выбросит вызов
#ifdef __SANITIZE_ADDRESS__
static void on_death(void) { printf("   первое падение на входе №%zu\\n", current); fflush(stdout); }
#endif

int main(int argc, char **argv) {
    const char *mode = argc > 1 ? argv[1] : "checked";
    const size_t N = 200000;
    size_t accepted = 0, rejected = 0, compared = 0, mismatches = 0;
#ifdef __SANITIZE_ADDRESS__
    __sanitizer_set_death_callback(on_death);        // при аварийном завершении напечатать номер входа
#endif
    for (current = 1; current <= N; current++) {
        size_t len = 1 + next() % 24;
        uint8_t *buf = malloc(len);                                     // буфер ровно нужного размера: любое чтение за концом заметно
        for (size_t i = 0; i < len; i++) buf[i] = next() % 10;
        if (!strcmp(mode, "naive")) { sink += parse_naive(buf, len).payload; }
        else {
            Result c = parse_checked(buf, len);
            if (c.ok) {
                accepted++;
                if (!strcmp(mode, "diff")) { Result n = parse_naive(buf, len); compared++; if (n.items != c.items || n.payload != c.payload) mismatches++; }
            } else rejected++;
        }
        free(buf);
    }
    if (!strcmp(mode, "naive")) printf("   все %zu входов обработаны без падений\\n", N);
    else if (!strcmp(mode, "checked")) printf("   %zu входов: принято %zu, отвергнуто %zu\\n", N, accepted, rejected);
    else printf("   на %zu допустимых входах результаты двух реализаций совпали: %s (расхождений %zu)\\n", compared, mismatches == 0 ? "да" : "нет", mismatches);
    return 0;
}`, { filename: "решение: доверчивый и проверяющий разбор, стенд", collapsed: true }),
      code("bash", `#!/bin/bash
# Сборка и запуск: без проверок, под AddressSanitizer и проверяющая версия
d=$(mktemp -d); cp 11-safe-parser.c "$d/p.c"; cd "$d"
echo "gcc $(gcc -dumpfullversion)"
gcc -O1 -g -o plain p.c && gcc -O1 -g -fsanitize=address -o asan p.c || exit 1
echo "1) доверчивый разбор, обычная сборка:"; ./plain naive; echo "   код выхода $?"
echo "2) доверчивый разбор под AddressSanitizer:"; ./asan naive 2>asan.err; echo "   код выхода $?; диагноз: $(grep -oE 'ERROR: AddressSanitizer: [a-z-]+' asan.err | head -1 | sed 's/ERROR: AddressSanitizer: //'); $(grep -oE '(READ|WRITE) of size [0-9]+' asan.err | head -1)"
echo "3) проверяющий разбор под AddressSanitizer:"; ./asan checked; echo "   код выхода $?"
echo "4) сравнение реализаций на допустимых входах под AddressSanitizer:"; ./asan diff; echo "   код выхода $?"
cd /; rm -rf "$d"`, { filename: "сборка и запуск", collapsed: true }),
      code("text", `gcc 13.3.0
1) доверчивый разбор, обычная сборка:
   все 200000 входов обработаны без падений
   код выхода 0
2) доверчивый разбор под AddressSanitizer:
   первое падение на входе №1
   код выхода 1; диагноз: heap-buffer-overflow; READ of size 1
3) проверяющий разбор под AddressSanitizer:
   200000 входов: принято 4165, отвергнуто 195835
   код выхода 0
4) сравнение реализаций на допустимых входах под AddressSanitizer:
   на 4165 допустимых входах результаты двух реализаций совпали: да (расхождений 0)
   код выхода 0`, { filename: "обычная сборка, AddressSanitizer, проверяющий разбор, сравнение" }),
      p("В обычной сборке доверчивый разбор «успешно» обработал все 200 000 входов с кодом 0: чтение за концом буфера не вызвало аварии, потому что рядом лежала чужая, но доступная память. Под AddressSanitizer та же программа остановилась на первом же некорректном входе (№1) с `heap-buffer-overflow`, `READ of size 1`: буфер выделен ровно по размеру входа, и любое чтение за концом попадает в красную зону. Проверяющий разбор перед каждым чтением сравнивает `l` с `len - pos` (без сложения, которое может переполниться) и принимает сообщение, только если оно использовало буфер целиком. Из 200 000 случайных входов принято 4165, отвергнуто 195 835; ошибок ASan нет; на допустимых входах результаты двух реализаций совпали (расхождений 0). Вывод: корректность проверяется под санитайзером и на случайных входах, а не по тому, что программа «не падает»."),
    ],
  },

  interview: [
    iq("cs.types-memory-models.i1", "basic", "Чем статическая типизация отличается от динамической и строгая от слабой?", [
      ul(
        "Статическая проверяет типы до выполнения, динамическая — во время (по типам значений); строгая не делает неявных преобразований между несвязанными типами, слабая делает.",
        "Python — динамическая и строгая (`1 + '1'` — `TypeError`), JavaScript — динамическая и слабая (`1 + '1'` — `'11'`), TypeScript проверяет типы статически, но стирает их при компиляции.",
        "Это независимые шкалы: типы могут проверяться статически и быть строгими или слабыми.",
      ),
    ], ["Что такое стирание типов?", "Что такое структурная типизация?"]),
    iq("cs.types-memory-models.i2", "basic", "Чем стек отличается от кучи?", [
      ul(
        "Стек хранит кадры вызовов и локальные переменные; выделение и освобождение — смещением указателя, время жизни ограничено вызовом; размер ограничен (в замере 8192 КиБ, кадр 64 байта — около 131 тысячи вызовов).",
        "Куча выделяется явно (`malloc`, `new`), размер и время жизни выбирает программа; управляет распределитель.",
        "Порядок в адресном пространстве: код < данные < куча < отображения < стек; стек растёт вниз.",
      ),
    ]),
    iq("cs.types-memory-models.i3", "intermediate", "Почему порядок полей структуры влияет на её размер?", [
      ul(
        "Каждое поле выравнивается по собственному размеру, а структура — по самому строгому полю; между полями и в конце добавляются пустые байты.",
        "`char, int, char` — 12 байт, `int, char, char` — 8; `char, double, char, short` — 24, `double, short, char, char` — 16 (на 50 % меньше).",
        "Расположение по убыванию размера обычно минимизирует заполнение; для обмена данными порядок и упаковка должны быть зафиксированы форматом.",
      ),
    ]),
    iq("cs.types-memory-models.i4", "intermediate", "Что такое use-after-free и как его найти?", [
      ul(
        "Обращение к блоку после `free`: распределитель мог отдать блок другому коду или оставить прежнее содержимое, поэтому программа может работать, портить данные или падать.",
        "Найти: AddressSanitizer (`heap-use-after-free`, `READ of size 4`, стек освобождения), Valgrind (`Invalid read of size 4`), тесты со случайными входами.",
        "Предотвратить: чёткое владение, индексы вместо указателей на элементы растущих контейнеров, обнуление указателей, языки с проверкой владения (Rust: `E0382`, `E0502`).",
      ),
    ]),
    iq("cs.types-memory-models.i5", "intermediate", "Чем подсчёт ссылок отличается от трассирующей сборки мусора?", [
      ul(
        "Подсчёт ссылок освобождает объект сразу, когда счётчик достиг нуля (предсказуемо), но не освобождает циклы: в замере цикл X ↔ Y не освобождён, за 1000 итераций утекло 2000 объектов.",
        "Трассирующая сборка помечает достижимое от корней и очищает остальное: циклы не проблема, но момент освобождения не определён и бывают паузы; стоимость пропорциональна живым объектам (100 помеченных из 10 000).",
        "CPython сочетает подсчёт ссылок и сборщик циклов (`gc.collect()`), V8 использует поколенческую трассировку.",
      ),
    ]),
    iq("cs.types-memory-models.i6", "advanced", "Как Rust обеспечивает безопасность памяти без сборщика мусора?", [
      ul(
        "Владение: у значения один владелец, при его выходе из области значение освобождается (в обратном порядке объявления); перемещение передаёт владение, использование после перемещения — ошибка `E0382`.",
        "Заимствование: сколько угодно неизменяемых ссылок или одна изменяемая (`E0499`, `E0502`); ссылка не должна пережить владельца (`E0597`).",
        "Типы-маркеры (`Send`, `Sync`) запрещают неатомарный `Rc` в потоках (`E0277`); цена — нужно выразить владение в структуре программы.",
      ),
    ]),
    iq("cs.types-memory-models.i7", "engineering", "Как бы вы защитили сервис, разбирающий бинарные сообщения от внешних клиентов?", [
      ul(
        "Проверять каждую длину перед чтением (`l > len - pos`), принимать только сообщения, использующие буфер ровно целиком; ограничить максимальные размеры и глубину.",
        "Тестировать под AddressSanitizer и UBSan на случайных и мутированных входах (fuzzing); в замере доверчивый разбор уличён на входе №1, проверяющий выдержал 200 000 входов.",
        "Рассмотреть язык с безопасностью памяти для разбора внешних форматов, изолировать разбор в отдельном процессе с ограниченными правами, журналировать отвергнутые входы.",
      ),
    ]),
    iq("cs.types-memory-models.i8", "debugging", "Приложение на TypeScript падает с `Cannot read properties of undefined`, хотя компилируется без ошибок. Где искать причину?", [
      ul(
        "В местах, где проверка типов обойдена: данные извне (`JSON.parse`, ответы API), `any`, утверждения `as`, ковариантные массивы — во всех четырёх случаях замера ошибок компиляции 0, а во время выполнения `TypeError`.",
        "Проверять данные на границе (схема, валидатор), использовать `unknown` и сужение вместо `any`, включить `strict`, добавить проверку исчерпанности для вариантов.",
        "Помнить: типы стираются при компиляции — во время выполнения защиты нет, пока вы не проверите сами.",
      ),
    ]),
  ],

  exam: [
    mcq("cs.types-memory-models.e1", "foundation", "Что останется от интерфейса `interface User { name: string }` в JavaScript после компиляции TypeScript?", ["Объект-описание в памяти", "Проверки типов при каждом вызове", "Ничего: типы стираются", "Комментарий с описанием"], 2, "Типы TypeScript существуют только при проверке: компилятор удаляет интерфейсы и аннотации, в выполняемом JavaScript остаётся лишь логика, поэтому во время выполнения проверять форму данных нужно самостоятельно."),
    mcq("cs.types-memory-models.e2", "foundation", "Сколько байт занимает `struct { char a; int b; char c; }` на x86-64 в замере?", ["12", "8", "6", "16"], 0, "Поле `b` выравнивается по 4 байтам (3 пустых байта после `a`), а размер структуры округляется до кратного 4 (3 байта в хвосте): 1 + 3 + 4 + 1 + 3 = 12. Порядок `int, char, char` даёт 8."),
    mcq("cs.types-memory-models.e3", "foundation", "В какую сторону растёт стек в замере?", ["Вверх: адреса растут с глубиной вызовов", "Зависит от типа переменной", "Не меняется", "Вниз: адреса уменьшаются с глубиной вызовов"], 3, "Локальная переменная на глубине 10 лежит по меньшему адресу, чем на глубине 0, а на глубине 100 — ещё ниже: на x86-64 стек растёт вниз, к меньшим адресам."),
    mcq("cs.types-memory-models.e4", "intermediate", "Какой код выхода дала обычная сборка программы с чтением после `free` в замере?", ["134 (SIGABRT)", "0 — ошибка не замечена", "139 (SIGSEGV)", "1 — сообщение об ошибке"], 1, "Без санитайзера программа с чтением после `free` завершилась с кодом 0: память осталась доступной, и ничто не сообщило о нарушении; AddressSanitizer на той же программе сообщил `heap-use-after-free`."),
    mcq("cs.types-memory-models.e5", "intermediate", "Сколько объектов утекло при 1000 итераций «создать пару с циклом и отпустить» при подсчёте ссылок?", ["0", "1000", "10 000", "2000"], 3, "В каждой итерации создаются 2 объекта, ссылающиеся друг на друга: счётчики не достигают нуля, поэтому не освобождается ни один — 2 × 1000 = 2000; пометка и очистка освободила все 2000."),
    mcq("cs.types-memory-models.e6", "intermediate", "Какой тип получает `λx. x x` в алгоритме Хиндли — Милнера?", ["`a -> a`", "`(a -> b) -> b`", "Никакого: проверка вхождения отвергает бесконечный тип", "`Int -> Int`"], 2, "Для `x : a` применение `x x` требует `a = a -> b`, то есть тип, содержащий сам себя бесконечно; проверка вхождения при унификации отвергает такое равенство, и выражение не типизируется."),
    mcq("cs.types-memory-models.e7", "advanced", "Какие из этих фрагментов TypeScript в замере скомпилировались без ошибок, но упали при выполнении? Выберите все.", ["`Dog[]` присвоен `Animal[]`, затем `push(new Cat())`", "`let n: number = \"5\"`", "`const n: number = v` при `v: any`", "`const u: User = JSON.parse(...)`"], [0, 2, 3], "Ковариантность массивов, `any` и `JSON.parse` (возвращает `any`) обходят проверку: ошибок компиляции 0, а при выполнении `TypeError`; присваивание строки числу компилятор отвергает (TS2322)."),
    open("cs.types-memory-models.e8", "intermediate", "Сравните четыре модели управления памятью (ручная, владение, подсчёт ссылок, трассирующая сборка) на примере одной и той же ошибки или задачи.", [
      ul(
        "Ручная (C): `free` вызывает программист; use-after-free и двойной `free` компилируются; обычная сборка завершилась с кодом 0, ASan диагностировал `heap-use-after-free`.",
        "Владение (Rust): та же ошибка — `E0382`/`E0502` при компиляции; освобождение по выходу из области видимости; нет сборщика.",
        "Подсчёт ссылок (CPython, `Rc`): объект освобождается мгновенно при нулевом счётчике, но цикл из двух объектов утекает (2000 из 2000 за 1000 итераций), нужен сборщик циклов.",
        "Трассирующая сборка (V8): освобождает недостижимое от корней, включая циклы; стоимость пропорциональна живому; момент освобождения не определён.",
      ),
    ], ["Ручная: ошибки и инструменты поиска", "Владение: проверка при компиляции", "Подсчёт ссылок: мгновенно, но циклы", "Трассировка: циклы, паузы, неопределённый момент"]),
  ],

  mastery: [
    mcq("cs.types-memory-models.m1", "intermediate", "Почему программа с ошибкой памяти может годами «работать» и упасть после смены компилятора или распределителя?", ["Потому что ошибки памяти случайны", "Потому что поведение зависит от состояния кучи: освобождённый блок может сохранять старое содержимое, соседняя память может быть доступной", "Потому что компилятор исправляет такие ошибки", "Потому что ошибка проявляется только в Windows"], 1, "Чтение после `free` или за концом блока — неопределённое поведение: результат зависит от того, что лежит рядом и вернул ли распределитель блок в список. Пять из шести ошибок в замере завершились кодом 0, пока санитайзер не показал их."),
    mcq("cs.types-memory-models.m2", "advanced", "Почему в проверяющем разборе условие записано как `l > len - pos`, а не `pos + l > len`?", ["Сложение может переполниться и дать малое значение, из-за чего проверка пройдёт на недопустимых данных; вычитание после проверки `pos < len` переполнения не даёт", "Так быстрее", "Так требует стандарт C", "Это эквивалентная запись без разницы"], 0, "При больших `l` сумма `pos + l` может переполнить тип и стать меньше `len`: проверка пропустит чтение за границей. Вычитание `len - pos` безопасно, если ранее установлено `pos ≤ len`."),
    mcq("cs.types-memory-models.m3", "advanced", "Почему `WeakRef` и финализаторы нельзя использовать для логики корректности?", ["Они медленные", "Они запрещены в строгом режиме", "Время и сам факт сборки спецификацией не гарантированы: объект может жить дольше или исчезнуть позже ожидаемого", "Они работают только в браузерах"], 2, "Сборщик собирает объекты, когда сочтёт нужным, и среда может вообще не вызвать финализатор; поэтому слабые ссылки допустимы только для кешей и необязательной очистки, но не для освобождения ресурсов, от которых зависит корректность."),
    open("cs.types-memory-models.m4", "advanced", "Вы пишете библиотеку разбора внешних данных, которой будут пользоваться из разных языков. Выберите язык и модель управления памятью, опишите границы проверки типов и план тестирования.", [
      ul(
        "Язык: для разбора ненадёжных данных — язык с безопасностью памяти (Rust, Go, Java) или C/C++ со строгой дисциплиной и санитайзерами; компромисс — контроль и размер против гарантий; границу с другими языками (C ABI) делать узкой и с явной передачей владения.",
        "Типы: данные извне — только через проверку на входе (схема, явные ограничения размеров и глубины); внутри — статические типы без `any`; размеченные объединения для вариантов и проверка исчерпанности.",
        "Память: единый владелец буферов, правило освобождения на границе (кто выделил — тот освобождает), RAII/`Drop`, никаких указателей на элементы растущих контейнеров (индексы).",
        "Тестирование: случайные и мутированные входы (fuzzing) под AddressSanitizer и UBSan, сравнение с эталонной реализацией на допустимых входах, регрессионные тесты на найденные ошибки.",
      ),
    ], ["Выбор языка и граница с другими языками", "Проверка данных на входе, статические типы внутри", "Владелец и освобождение буферов", "Fuzzing, санитайзеры, сравнение с эталоном"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "cs.types-memory-models.f1", front: "Типизация: шкалы?", back: "Статическая/динамическая — когда проверяется; строгая/слабая — неявные преобразования. Python: динамическая строгая (1 + '1' → TypeError); JS: динамическая слабая; TypeScript: статическая, типы стираются." },
    { id: "cs.types-memory-models.f2", front: "Дыры в типах TypeScript?", back: "Ковариантность массивов, any, as unknown as, JSON.parse: 0 ошибок компиляции, TypeError при выполнении. Типы стираются; данные извне проверять самому." },
    { id: "cs.types-memory-models.f3", front: "Хиндли — Милнер?", back: "Унификация + let-полиморфизм. λf.λx.f (f x) : (a→a)→a→a. (id 1, id true) в let — ок, в λ — нет. λx.x x — отвергнуто проверкой вхождения." },
    { id: "cs.types-memory-models.f4", front: "Размер структуры?", back: "Поля выравниваются по своему размеру; char,int,char = 12, int,char,char = 8; char,double,char,short = 24, double,short,char,char = 16. Little-endian: 0x01020304 → 4 3 2 1." },
    { id: "cs.types-memory-models.f5", front: "Области памяти и стек?", back: "Код < .data < .bss < куча < отображения < стек (растёт вниз). Кадр 64 Б, предел 8192 КиБ → ≈131 072 вызова; достигнуто ≈130 800 → SIGSEGV. malloc(1) → 24 Б, malloc(25) → 40 Б." },
    { id: "cs.types-memory-models.f6", front: "Ошибки памяти и инструменты?", back: "use-after-free, переполнения, двойной free, утечка: без проверок код 0 (двойной free — 134). ASan называет каждую; UBSan — signed overflow, shift 32; Valgrind — Invalid read." },
    { id: "cs.types-memory-models.f7", front: "Rust: владение?", back: "Один владелец, освобождение по выходу из области (обратный порядок). Отвергает: E0382 (после перемещения), E0502, E0597, E0499, E0277 (Rc в поток). Нет сборщика." },
    { id: "cs.types-memory-models.f8", front: "Подсчёт ссылок и трассировка?", back: "Счётчик: мгновенно, циклы утекают (2000 из 2000). Трассировка: достижимость от корней, стоимость ∝ живому (100 из 10 000). Python list из 1 млн int 36 МБ против 4 МБ у array (×9)." },
  ],

  sources: [
    { title: "Pierce B. Types and Programming Languages (MIT Press, 2002)", url: "https://www.cis.upenn.edu/~bcpierce/tapl/", publisher: "Other" },
    { title: "Damas L., Milner R. Principal type-schemes for functional programs (POPL 1982)", url: "https://doi.org/10.1145/582153.582176", publisher: "Other" },
    { title: "Cardelli L., Wegner P. On Understanding Types, Data Abstraction, and Polymorphism (ACM Computing Surveys, 1985)", url: "https://doi.org/10.1145/6041.6042", publisher: "Other" },
    { title: "TypeScript Handbook: Type Compatibility", url: "https://www.typescriptlang.org/docs/handbook/type-compatibility.html", publisher: "Other" },
    { title: "The Rust Programming Language: Understanding Ownership", url: "https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html", publisher: "Other" },
    { title: "Jones R., Hosking A., Moss E. The Garbage Collection Handbook", url: "https://gchandbook.org/", publisher: "Other" },
    { title: "McCarthy J. Recursive Functions of Symbolic Expressions and Their Computation by Machine (CACM, 1960)", url: "https://doi.org/10.1145/367177.367199", publisher: "Other" },
    { title: "Serebryany K. et al. AddressSanitizer: A Fast Address Sanity Checker (USENIX ATC 2012)", url: "https://www.usenix.org/conference/atc12/technical-sessions/presentation/serebryany", publisher: "Other" },
    { title: "ISO/IEC 9899:2011 (C11), рабочий проект N1570", url: "https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf", publisher: "Other" },
    { title: "Valgrind User Manual", url: "https://valgrind.org/docs/manual/manual.html", publisher: "Other" },
    { title: "Python documentation: gc — Garbage Collector interface", url: "https://docs.python.org/3.11/library/gc.html", publisher: "Other" },
    { title: "V8: Trash talk — the Orinoco garbage collector", url: "https://v8.dev/blog/trash-talk", publisher: "Other" },
    { title: "ECMAScript Language Specification: Type Conversion", url: "https://tc39.es/ecma262/#sec-type-conversion", publisher: "ECMA" },
  ],
};
