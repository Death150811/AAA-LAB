import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p03CpuAndCache: Project = {
  id: "cs.p03-cpu-and-cache",
  domain: "cs",
  order: 3,
  title: "Процессор и кеш",
  subtitle: "Ассемблер, 16-битный эмулятор с флагами Z N C V, симулятор кеша с политиками LRU и FIFO, классификация промахов и разбор чисел с плавающей запятой — 51 проверка на программах, флагах и независимом эталоне кеша",
  level: "core",
  estimatedHours: 14,
  buildsOn: [],
  topics: ["cs.number-systems-encoding", "cs.cpu-memory-cache", "cs.compilation-interpretation"],
  objective:
    "Построить в модуле `cpu.mjs` маленький **компьютер целиком**: ассемблер для 30 команд, эмулятор 16-битного процессора с настоящими флагами (`Z`, `N`, `C`, `V`) и стеком, **симулятор кеша** (прямое отображение и ассоциативность, LRU и FIFO, три «C» промахов) и функции представления чисел (дополнительный код, поля `float32`). Проверка запускает ваши ассемблерные программы — факториал, Фибоначчи, НОД, пузырьковую сортировку **со знаком**, рекурсию через `CALL`/`RET` — и сверяет флаги с таблицами, а кеш — с независимой реализацией на 60 случайных трассах.",
  scenario: [
    p("Команда курса «Архитектура» хочет учебный стенд, в котором можно **увидеть**, почему `0x7FFF + 1` меняет знак, чем знаковое сравнение отличается от беззнакового, откуда берётся разница в 16 раз между обходом матрицы по строкам и по столбцам и почему кеш с прямым отображением ломается на двух адресах. Стенд состоит из трёх частей: ассемблер и эмулятор процессора, симулятор кеша и функции, показывающие числа в двоичном виде."),
    p("Заготовка лежит в `starter/cpu.mjs`: функции бросают «не реализовано». Проверка `check.mjs` (51 проверка) запускается командой `node check.mjs .` в каталоге с вашим `cpu.mjs`. Нужен только Node.js 22."),
    code("js", `// Заготовка проекта «Процессор и кеш». Реализуйте функции и классы, затем запустите:  node check.mjs .
// Имена экспортов менять нельзя. Подробные требования и таблица команд — в описании проекта.

export class AsmError extends Error {
  // сообщение «строка N: …», поле line — номер строки исходного текста (с единицы)
  constructor(message, line) { super(message); this.name = "AsmError"; this.line = line; }
}
export class CpuError extends Error {
  constructor(message) { super(message); this.name = "CpuError"; }
}

export function assemble(source) {
  throw new Error("не реализовано: assemble");
}

export function run(program, options = {}) {
  throw new Error("не реализовано: run");
}

export class CacheSim {
  constructor({ size, lineSize, ways, policy = "LRU" }) { throw new Error("не реализовано: CacheSim"); }
  // config, stats { accesses, hits, misses, evictions }, reset(), access(address) → true при попадании
}

export function classifyMisses(trace, config) {
  throw new Error("не реализовано: classifyMisses");
}

export function matrixTrace(n, elemSize, order) {
  throw new Error("не реализовано: matrixTrace");
}

export function strideTrace(count, stride, start = 0) {
  throw new Error("не реализовано: strideTrace");
}

export function toTwos(n, bits) {
  throw new Error("не реализовано: toTwos");
}

export function fromTwos(u, bits) {
  throw new Error("не реализовано: fromTwos");
}

export function float32Fields(x) {
  throw new Error("не реализовано: float32Fields");
}

export function fromFloat32Hex(hex) {
  throw new Error("не реализовано: fromFloat32Hex");
}`, { filename: "starter/cpu.mjs" }),
    table(
      ["Команда", "Действие", "Флаги"],
      [
        ["`MOV rd, rs` · `LDI rd, imm`", "Копирование; константа −32768…65535 (отрицательные — в дополнительном коде)", "не меняются"],
        ["`ADD rd, rs`", "`rd = rd + rs` (по модулю 2¹⁶)", "`Z`, `N`; `C` — перенос из 15-го бита; `V` — знаковое переполнение"],
        ["`SUB rd, rs` · `CMP ra, rb`", "Вычитание; `CMP` не сохраняет результат", "`Z`, `N`; `C` — **заём** (`a < b` без знака); `V` — знаковое переполнение"],
        ["`MUL rd, rs`", "Младшие 16 бит произведения", "`Z`, `N`; `C = 1`, если произведение > 0xFFFF; `V = 0`"],
        ["`AND`, `OR`, `XOR rd, rs` · `NOT rd`", "Побитовые операции", "`Z`, `N`; `C = V = 0`"],
        ["`SHL`, `SHR`, `SAR rd, n` (0…15)", "Сдвиги: влево, логический вправо, арифметический вправо", "`Z`, `N`; `C` — последний вытолкнутый бит (при `n = 0` — 0); `V = 0`"],
        ["`LD rd, [rs]` · `ST [rd], rs`", "Чтение/запись слова памяти по адресу в регистре", "не меняются"],
        ["`LDM rd, адрес` · `STM адрес, rs`", "Чтение/запись по константному адресу (0…1023)", "не меняются"],
        ["`JMP`, `JZ`, `JNZ`, `JLT`, `JGE`, `JC`, `JNC` метка", "Переходы: `JLT` — `N ≠ V` (знаковое «меньше»), `JGE` — `N = V`, `JC` — `C = 1` (беззнаковое «меньше»)", "не меняются"],
        ["`PUSH rs` · `POP rd` · `CALL метка` · `RET`", "Стек в памяти растёт вниз от адреса 1023; `CALL` кладёт адрес возврата", "не меняются"],
        ["`NOP` · `HALT`", "Ничего; остановка", "—"],
      ],
      "Архитектура: регистры r0…r7 (16 бит), память 1024 слова, указатель стека начинается с 1024, команды хранятся отдельно от данных",
    ),
    table(
      ["Функция / класс", "Контракт"],
      [
        ["`assemble(source)`", "Массив команд; метки (`name:`), комментарии (`;`), шестнадцатеричные числа; `AsmError` с `.line` (номер строки с единицы) и сообщением «строка N: …»"],
        ["`run(program, { maxSteps, memory, regs, trace })`", "`{ regs, flags: {Z,N,C,V}, memory, pc, sp, steps, halted, accesses? }`; `CpuError` для выхода за память, пустого стека, переполнения стека и выхода за конец программы; при `trace: true` — `accesses = [[адрес слова, \"R\" | \"W\"], …]`"],
        ["`new CacheSim({ size, lineSize, ways, policy })`", "`access(адрес в байтах)` → `true` при попадании; `stats = { accesses, hits, misses, evictions }`; `reset()`; `config`; неверная геометрия → `RangeError`"],
        ["`classifyMisses(trace, config)`", "`{ accesses, hits, misses, compulsory, capacity, conflict }`: обязательные, по ёмкости (промахнулся бы и полностью ассоциативный LRU-кеш того же размера), по конфликтам"],
        ["`matrixTrace(n, elemSize, order)` · `strideTrace(count, stride, start)`", "Трассы адресов обхода матрицы `n × n` по строкам/столбцам и по арифметической прогрессии"],
        ["`toTwos`, `fromTwos`, `float32Fields`, `fromFloat32Hex`", "Дополнительный код с проверкой диапазона; поля `{ sign, exponent, mantissa, hex }` числа `float32` и обратное преобразование"],
      ],
      "Контракт модуля",
    ),
  ],
  requirements: [
    "`cpu.mjs` экспортирует `assemble`, `run`, `CacheSim`, `classifyMisses`, `matrixTrace`, `strideTrace`, `toTwos`, `fromTwos`, `float32Fields`, `fromFloat32Hex`, `AsmError`, `CpuError`.",
    "Ассемблер не зависит от регистра букв, понимает метки на отдельной строке и перед командой, отвергает неизвестные команды, регистр `r8`, неверное число операндов, число вне диапазона (`ldi r0, 70000`, `shl r0, 16`), неопределённые и повторные метки — всё с правильным номером строки.",
    "Флаги соответствуют таблице: `0x7FFF + 1` → `Z N C V = 0 1 0 1`; `0xFFFF + 1` → `1 0 1 0`; `0 − 1` → `0 1 1 0`; `0x8000 − 1` → `0 0 0 1`; `MUL` 300·300 → 24464 с `C = 1`.",
    "`JLT`/`JGE` — знаковые (учитывают `V`: 32767 против −32768 даёт `N = 1`, `V = 1`, и `JGE` срабатывает), `JC`/`JNC` — беззнаковые: на `−1` и `1` `JLT` переходит, а `JC` — нет.",
    "Стек в памяти: `PUSH` уменьшает `sp` и пишет по нему, `CALL` кладёт адрес возврата; `run` возвращает `sp = 1024` после сбалансированных вызовов; рекурсивный факториал `7! = 5040` должен работать.",
    "`run` завершает бесконечный цикл по `maxSteps` с `halted = false`; считает **каждую выполненную команду** шагом (факториал 8! — ровно 35 шагов); миллион шагов выполняется быстрее 1,5 с.",
    "`CacheSim`: набор определяется как `(адрес / lineSize) mod sets`, тег — остальная часть номера строки; LRU при попадании «освежает» строку, FIFO — нет; `evictions` считает вытеснения; кеш совпадает с независимым эталоном на 60 случайных трассах.",
    "`classifyMisses` относит первый доступ к строке к обязательным, промах, который возник бы и в полностью ассоциативном LRU-кеше такого же размера, — к ёмкостным, остальное — к конфликтным.",
    "`float32Fields` возвращает побитово верные поля для 1.0, `−0`, `Infinity`, `NaN`, `0.1` (`3dcccccd`), денормализованного `1e-45` (`00000001`) и числа, требующего округления (`16777217` → `4b800000`).",
  ],
  constraints: [
    "Только стандартные средства JavaScript; никаких библиотек.",
    "Эмулятор — единственный источник правды о флагах: нельзя «подсматривать» их у JavaScript (`ADD` на числах без маски даёт неверные `C` и `V`).",
    "Трассу памяти ведёт эмулятор (`trace: true`), а не вызывающий код; кеш получает **байтовые** адреса (слово — 2 байта).",
    "`CacheSim` не должен хранить данные: только теги и порядок вытеснения.",
  ],
  expected: [
    "`node check.mjs .` печатает `Пройдено проверок: 51 из 51`.",
    "Последовательное чтение 4096 четырёхбайтных чисел: `misses = 256`, `hits = 3840`; чередование адресов `0` и `4096`: 2000 промахов при прямом отображении и 2 при двух путях.",
    "Матрица 64×64 из `int` в кеше 4 КиБ, 2 пути: по строкам 256 промахов, по столбцам 4096 — из них 256 обязательных и 3840 **конфликтных**, ёмкостных 0.",
    "Пузырьковая сортировка со знаком на `[5, −3, 12, 0, −100, 7, 7, −1, 300, −32768, 32767, 1]` даёт отсортированный по знаку массив.",
  ],
  technical: [
    "Работайте с регистрами как с `Uint16Array`: присваивание само отсекает лишние биты. Но флаги вычисляйте от **значений до отсечения**: перенос — `a + b > 0xFFFF`, заём — `a < b`, знаковое переполнение сложения — `((a ^ res) & (b ^ res) & 0x8000) !== 0`, вычитания — `((a ^ b) & (a ^ res) & 0x8000) !== 0`.",
    "`JLT` — это «меньше со знаком» после `CMP`: результат отрицателен без переполнения или неотрицателен с переполнением, то есть `N !== V`. Проверьте на 32767 и −32768: результат вычитания `0xFFFF`, `N = 1`, `V = 1`.",
    "Стек растёт вниз: `PUSH` — `sp--; mem[sp] = x`; `POP` — `x = mem[sp]; sp++`. `CALL метка` кладёт на стек адрес **следующей** команды, `RET` извлекает его в счётчик команд.",
    "Ассемблер — два прохода: сначала разобрать строки и запомнить `метка → индекс команды`, затем подставить индексы вместо имён. Ошибки неопределённой метки сообщайте с номером строки **перехода**, а не метки.",
    "Кеш: `lineSize` и число наборов — степени двойки; набор хранит массив тегов в порядке «от старого к новому». LRU при попадании переносит тег в конец; FIFO оставляет на месте; при переполнении набора вытесняется первый элемент.",
    "Классификатор промахов запускает **две** модели параллельно: реальный кеш и полностью ассоциативный LRU той же ёмкости (`ways = size / lineSize`). Промах реального кеша, которого нет у ассоциативного, — конфликтный; первый доступ к строке — обязательный.",
    "Обход матрицы по столбцам с шагом `n·elemSize` байт: для `n = 64`, `elemSize = 4` шаг 256 байт, и все 64 строки столбца попадают в одни и те же 8 наборов из 32 — поэтому 64 строки не помещаются в 8 наборов × 2 пути = 16 строк. Но полностью ассоциативный кеш из 64 строк **все** их удержал бы: это конфликтные, а не ёмкостные промахи.",
    "`float32Fields`: `DataView.setFloat32` + `getUint32`; поля — `bits >>> 31`, `(bits >>> 23) & 0xff`, `bits & 0x7fffff`. `float32` с порядком 0 — денормализованное число, с порядком 255 — бесконечность (мантисса 0) или `NaN`.",
  ],
  acceptance: [
    "`node check.mjs .` — 51 из 51.",
    "Заготовка проходит 1 из 51 проверки (экспорты).",
    "Каждый из девятнадцати «плохих» вариантов проваливает не менее одной проверки: от 1 (нет флага переполнения при сложении, `JLT` как беззнаковое, логический `SAR`, `MUL` без переноса, отсутствие проверки диапазона константы, программа без ошибки при выходе за конец, неверный диапазон `toTwos`, нумерация строк с нуля) до 9 (строка кеша по словам вместо байтов).",
    "Ни одна проверка не зависит от внутреннего представления программы: `assemble` возвращает что угодно, `run` принимает это же.",
  ],
  hints: [
    "Сначала реализуйте `ADD`, `SUB`, `CMP`, `JZ`, `JNZ`, `HALT` и запустите факториал: этого достаточно для первой программы. Флаги дописывайте по таблицам из описания и сверяйте с четырьмя «опорными» случаями.",
    "Если сортировка со знаком работает на положительных числах, но ломается на отрицательных — вы реализовали `JGE` по флагу `N` или `C`, а не по `N === V`.",
    "Если рекурсивный факториал виснет — `RET` не меняет счётчик команд или `CALL` кладёт на стек адрес самой команды, а не следующей.",
    "Для кеша сначала добейтесь 256 промахов на последовательном чтении, потом двух промахов на чередовании двух адресов с двумя путями, и только потом пишите классификатор.",
    "Различие LRU и FIFO ищите на последовательности `A B A C A` в одном наборе двухпутевого кеша: LRU — 3 промаха, FIFO — 4.",
    "Если `classifyMisses` даёт для матрицы по столбцам «ёмкостные» промахи, вы сравниваете с кешем неправильной ёмкости: полностью ассоциативный кеш должен иметь **те же** `size` и `lineSize`.",
    "В `float32Fields` не вычитайте смещение порядка: по контракту `exponent` — это сырое поле (127 для 1.0).",
  ],
  advanced: [
    "Добавьте команды `DIV`/`MOD` и флаг деления на ноль, затем флаг `H` (перенос из 3-го бита) и команды десятичной коррекции.",
    "Сделайте двухуровневый кеш (L1 + L2) с включающей политикой и посчитайте среднее время доступа при задержках 1, 10 и 100 тактов.",
    "Реализуйте политику PLRU (дерево битов) и сравните число промахов с LRU на случайных трассах.",
    "Добавьте в эмулятор конвейер из 3 стадий и посчитайте простои при зависимости по данным и после перехода.",
    "Напишите на вашем ассемблере сито Эратосфена для чисел до 1000 и посчитайте долю попаданий в кеш при разных размерах строки.",
  ],
  failureModes: [
    "**Нет флага `V` при сложении:** `0x7FFF + 1` выглядит как обычное число; знаковые сравнения ломаются; красная 1 проверка из 51.",
    "**Флаг `C` при вычитании — «перенос», а не «заём»:** `0 − 1` даёт `C = 0`; 2 проверки.",
    "**`CMP` сохраняет результат:** сравнение портит регистр; красных 5 проверок (все программы с `cmp`).",
    "**`JLT` как беззнаковое:** отрицательные числа сортируются неверно; 1 проверка.",
    "**`JGE` только по знаку результата:** ошибка при переполнении (32767 против −32768); 2 проверки.",
    "**Логический вместо арифметического `SAR`:** знак теряется при сдвиге вправо; 1 проверка.",
    "**`MUL` без флага переноса:** переполнение умножения незаметно; 1 проверка.",
    "**Нет проверки диапазона константы:** `ldi r0, 70000` принимается; 1 проверка.",
    "**`CALL` без стека** (адрес возврата в отдельном массиве): `RET` работает, но стек и трасса памяти не соответствуют; 3 проверки.",
    "**Трасса без записей:** кеш не видит записи; 2 проверки.",
    "**Выход за конец программы молча завершает работу:** программа без `HALT` «успешна»; 1 проверка.",
    "**LRU без обновления при попадании (на деле FIFO):** `A B A C A` даёт 4 промаха вместо 3; 2 проверки.",
    "**Неверный индекс набора** (`(line >> 1) mod sets`): строки соседних наборов смешиваются; 5 проверок.",
    "**Номер строки кеша считается по словам** (`address / (2·lineSize)`): последовательное чтение даёт вдвое меньше промахов; красных 9 проверок.",
    "**Все промахи — «ёмкостные»:** конфликтные не выделяются; 2 проверки.",
    "**Матрица по столбцам совпадает с матрицей по строкам:** трасса неверна; 3 проверки.",
    "**`toTwos` принимает числа до 2^bits:** `toTwos(32768, 16)` не бросает `RangeError`; 1 проверка.",
    "**Порядок `float32` со смещением:** `1.0` даёт `exponent = 0` вместо 127; 4 проверки.",
    "**Номера строк ошибок с нуля:** `AsmError.line` на единицу меньше; 1 проверка.",
  ],
  rubric: [
    { criterion: "Ассемблер и эмулятор", weight: 30, description: "Все 30 команд, стек, лимит шагов, трасса памяти, ошибки `AsmError` и `CpuError` с понятными сообщениями." },
    { criterion: "Флаги и знаковая арифметика", weight: 20, description: "`Z N C V` для сложения, вычитания, умножения, логических операций и сдвигов; знаковые и беззнаковые переходы; сортировка со знаком." },
    { criterion: "Симулятор кеша", weight: 20, description: "Геометрия и валидация, LRU/FIFO, вытеснения, совпадение с независимым эталоном на случайных трассах." },
    { criterion: "Классификация промахов и трассы", weight: 15, description: "Три «C», трассы матриц и прогрессий, согласие с теорией на опорных случаях." },
    { criterion: "Представление чисел", weight: 10, description: "Дополнительный код с диапазонами, поля `float32` для нормализованных, денормализованных, бесконечных чисел и `NaN`." },
    { criterion: "Чистота решения", weight: 5, description: "Понятные имена, отсутствие дублирования в таблице команд, комментарии с формулами флагов." },
  ],
  solution: [
    p("Эталон — один файл `cpu.mjs` (около 200 строк). Он проходит все 51 проверку; заготовка проходит 1 из 51, а каждый из девятнадцати намеренно испорченных вариантов — меньше 51."),
    h("cpu.mjs"),
    code("js", `// cpu.mjs — учебный 16-битный процессор: ассемблер, эмулятор с флагами, кеш и представление чисел

export class AsmError extends Error { constructor(message, line) { super(\`строка \${line}: \${message}\`); this.name = "AsmError"; this.line = line; } }
export class CpuError extends Error { constructor(message) { super(message); this.name = "CpuError"; } }

const MEM_WORDS = 1024, MASK = 0xffff;
const ARITH = new Set(["MOV", "ADD", "SUB", "MUL", "AND", "OR", "XOR", "CMP"]);
const SHIFT = new Set(["SHL", "SHR", "SAR"]);
const JUMPS = new Set(["JMP", "JZ", "JNZ", "JLT", "JGE", "JC", "JNC", "CALL"]);
const NOARG = new Set(["RET", "HALT", "NOP"]);

/* ───────── ассемблер ───────── */
export function assemble(source) {
  const lines = source.split("\\n"), labels = new Map(), pending = [];
  const reg = (s, line) => { const m = /^r([0-7])$/i.exec(s); if (!m) throw new AsmError(\`ожидался регистр r0…r7, найдено «\${s}»\`, line); return Number(m[1]); };
  const imm = (s, line, lo, hi) => { if (!/^-?(0x[0-9a-f]+|\\d+)$/i.test(s)) throw new AsmError(\`ожидалось число, найдено «\${s}»\`, line); const v = Number(s); if (v < lo || v > hi) throw new AsmError(\`число \${v} вне диапазона \${lo}…\${hi}\`, line); return v & (hi > MASK ? -1 : MASK); };
  const mem = (s, line) => { const m = /^\\[(.+)\\]$/.exec(s); if (!m) throw new AsmError(\`ожидалось [rN], найдено «\${s}»\`, line); return reg(m[1].trim(), line); };
  for (let i = 0; i < lines.length; i++) {
    let text = lines[i].replace(/;.*$/, "").trim(), line = i + 1;
    if (!text) continue;
    const lab = /^([A-Za-z_]\\w*):\\s*(.*)$/.exec(text);
    if (lab) { if (labels.has(lab[1])) throw new AsmError(\`метка «\${lab[1]}» объявлена повторно\`, line); labels.set(lab[1], pending.length); text = lab[2].trim(); if (!text) continue; }
    const [mnem, ...rest] = text.split(/\\s+/); const op = mnem.toUpperCase(), args = rest.join(" ").split(",").map((s) => s.trim()).filter((s) => s !== "");
    const need = (n) => { if (args.length !== n) throw new AsmError(\`\${op} ожидает операндов: \${n}, получено \${args.length}\`, line); };
    let ins;
    if (ARITH.has(op)) { need(2); ins = { op, a: reg(args[0], line), b: reg(args[1], line) }; }
    else if (op === "LDI") { need(2); ins = { op, a: reg(args[0], line), b: imm(args[1], line, -32768, 65535) }; }
    else if (op === "NOT" || op === "PUSH" || op === "POP") { need(1); ins = { op, a: reg(args[0], line) }; }
    else if (SHIFT.has(op)) { need(2); ins = { op, a: reg(args[0], line), b: imm(args[1], line, 0, 15) }; }
    else if (op === "LD") { need(2); ins = { op, a: reg(args[0], line), b: mem(args[1], line) }; }
    else if (op === "ST") { need(2); ins = { op, a: mem(args[0], line), b: reg(args[1], line) }; }
    else if (op === "LDM") { need(2); ins = { op, a: reg(args[0], line), b: imm(args[1], line, 0, MEM_WORDS - 1) }; }
    else if (op === "STM") { need(2); ins = { op, a: imm(args[0], line, 0, MEM_WORDS - 1), b: reg(args[1], line) }; }
    else if (JUMPS.has(op)) { need(1); ins = { op, a: args[0], line }; }
    else if (NOARG.has(op)) { need(0); ins = { op }; }
    else throw new AsmError(\`неизвестная команда «\${mnem}»\`, line);
    ins.line = line; pending.push(ins);
  }
  for (const ins of pending) if (JUMPS.has(ins.op)) { if (!labels.has(ins.a)) throw new AsmError(\`метка «\${ins.a}» не определена\`, ins.line); ins.a = labels.get(ins.a); }
  return pending;
}

/* ───────── эмулятор ───────── */
export function run(program, { maxSteps = 1_000_000, memory = [], regs = {}, trace = false } = {}) {
  const r = new Uint16Array(8), m = new Uint16Array(MEM_WORDS), acc = [];
  memory.forEach((v, i) => { if (i >= MEM_WORDS) throw new CpuError("начальное содержимое не помещается в память"); m[i] = v; });
  for (const [k, v] of Object.entries(regs)) r[Number(k.slice(1))] = v;
  const f = { Z: 0, N: 0, C: 0, V: 0 };
  let pc = 0, sp = MEM_WORDS, steps = 0, halted = false;
  const addr = (a) => { if (a < 0 || a >= MEM_WORDS) throw new CpuError(\`адрес \${a} вне памяти\`); return a; };
  const rd = (a) => { addr(a); if (trace) acc.push([a, "R"]); return m[a]; };
  const wr = (a, v) => { addr(a); if (trace) acc.push([a, "W"]); m[a] = v; };
  const zn = (v) => { f.Z = v === 0 ? 1 : 0; f.N = (v >> 15) & 1; };
  while (steps < maxSteps) {
    if (pc < 0 || pc >= program.length) throw new CpuError(\`счётчик команд \${pc} вне программы\`);
    const i = program[pc++]; steps++;
    switch (i.op) {
      case "NOP": break;
      case "HALT": halted = true; break;
      case "MOV": r[i.a] = r[i.b]; break;
      case "LDI": r[i.a] = i.b; break;
      case "ADD": { const a = r[i.a], b = r[i.b], s = a + b, v = s & MASK; r[i.a] = v; f.C = s > MASK ? 1 : 0; f.V = ((a ^ v) & (b ^ v) & 0x8000) ? 1 : 0; zn(v); break; }
      case "SUB": case "CMP": { const a = r[i.a], b = r[i.b], v = (a - b) & MASK; if (i.op === "SUB") r[i.a] = v; f.C = a < b ? 1 : 0; f.V = ((a ^ b) & (a ^ v) & 0x8000) ? 1 : 0; zn(v); break; }
      case "MUL": { const p = r[i.a] * r[i.b], v = p & MASK; r[i.a] = v; f.C = p > MASK ? 1 : 0; f.V = 0; zn(v); break; }
      case "AND": { const v = r[i.a] & r[i.b]; r[i.a] = v; f.C = f.V = 0; zn(v); break; }
      case "OR": { const v = r[i.a] | r[i.b]; r[i.a] = v; f.C = f.V = 0; zn(v); break; }
      case "XOR": { const v = r[i.a] ^ r[i.b]; r[i.a] = v; f.C = f.V = 0; zn(v); break; }
      case "NOT": { const v = ~r[i.a] & MASK; r[i.a] = v; f.C = f.V = 0; zn(v); break; }
      case "SHL": { const a = r[i.a], n = i.b, v = (a << n) & MASK; f.C = n > 0 ? (a >> (16 - n)) & 1 : 0; f.V = 0; r[i.a] = v; zn(v); break; }
      case "SHR": { const a = r[i.a], n = i.b, v = a >> n; f.C = n > 0 ? (a >> (n - 1)) & 1 : 0; f.V = 0; r[i.a] = v; zn(v); break; }
      case "SAR": { const a = r[i.a], n = i.b, s = (a << 16) >> 16, v = (s >> n) & MASK; f.C = n > 0 ? (s >> (n - 1)) & 1 : 0; f.V = 0; r[i.a] = v; zn(v); break; }
      case "LD": r[i.a] = rd(r[i.b]); break;
      case "ST": wr(r[i.a], r[i.b]); break;
      case "LDM": r[i.a] = rd(i.b); break;
      case "STM": wr(i.a, r[i.b]); break;
      case "JMP": pc = i.a; break;
      case "JZ": if (f.Z) pc = i.a; break;
      case "JNZ": if (!f.Z) pc = i.a; break;
      case "JLT": if (f.N !== f.V) pc = i.a; break;
      case "JGE": if (f.N === f.V) pc = i.a; break;
      case "JC": if (f.C) pc = i.a; break;
      case "JNC": if (!f.C) pc = i.a; break;
      case "PUSH": if (sp <= 0) throw new CpuError("переполнение стека"); sp--; wr(sp, r[i.a]); break;
      case "POP": if (sp >= MEM_WORDS) throw new CpuError("стек пуст"); r[i.a] = rd(sp); sp++; break;
      case "CALL": if (sp <= 0) throw new CpuError("переполнение стека"); sp--; wr(sp, pc); pc = i.a; break;
      case "RET": if (sp >= MEM_WORDS) throw new CpuError("стек пуст"); pc = rd(sp); sp++; break;
    }
    if (halted) break;
  }
  return { regs: Array.from(r), flags: { ...f }, memory: m, pc, sp, steps, halted, ...(trace ? { accesses: acc } : {}) };
}

/* ───────── кеш ───────── */
export class CacheSim {
  #sets; #cfg;
  constructor({ size, lineSize, ways, policy = "LRU" }) {
    const pow2 = (n) => Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;
    if (!pow2(lineSize) || !Number.isInteger(ways) || ways < 1 || !Number.isInteger(size) || size % (lineSize * ways) !== 0 || !pow2(size / (lineSize * ways))) throw new RangeError("неверная геометрия кеша: размер, размер строки и число путей должны давать степень двойки наборов");
    if (policy !== "LRU" && policy !== "FIFO") throw new RangeError(\`неизвестная политика «\${policy}»\`);
    this.#cfg = { size, lineSize, ways, policy, sets: size / (lineSize * ways) };
    this.reset();
  }
  get config() { return { ...this.#cfg }; }
  reset() { this.#sets = Array.from({ length: this.#cfg.sets }, () => []); this.stats = { accesses: 0, hits: 0, misses: 0, evictions: 0 }; }
  access(address) {
    const { lineSize, ways, policy, sets } = this.#cfg, line = Math.floor(address / lineSize), set = this.#sets[line % sets], tag = Math.floor(line / sets);
    this.stats.accesses++;
    const at = set.indexOf(tag);
    if (at >= 0) { this.stats.hits++; if (policy === "LRU") { set.splice(at, 1); set.push(tag); } return true; }
    this.stats.misses++;
    if (set.length === ways) { set.shift(); this.stats.evictions++; }
    set.push(tag); return false;
  }
}
/** Классификация промахов по трём «C»: обязательные, по ёмкости (промахнулся бы и полностью ассоциативный кеш той же ёмкости), по конфликтам. */
export function classifyMisses(trace, config) {
  const real = new CacheSim(config), full = new CacheSim({ size: config.size, lineSize: config.lineSize, ways: config.size / config.lineSize, policy: "LRU" }), seen = new Set();
  let compulsory = 0, capacity = 0, conflict = 0;
  for (const a of trace) {
    const line = Math.floor(a / config.lineSize), first = !seen.has(line); seen.add(line);
    const hitReal = real.access(a), hitFull = full.access(a);
    if (!hitReal) { if (first) compulsory++; else if (!hitFull) capacity++; else conflict++; }
  }
  return { accesses: real.stats.accesses, hits: real.stats.hits, misses: real.stats.misses, compulsory, capacity, conflict };
}
export function matrixTrace(n, elemSize, order) {
  if (order !== "row" && order !== "col") throw new RangeError(\`порядок «\${order}» не поддерживается\`);
  const out = [];
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) out.push((order === "row" ? a * n + b : b * n + a) * elemSize);
  return out;
}
export function strideTrace(count, stride, start = 0) { return Array.from({ length: count }, (_, i) => start + i * stride); }

/* ───────── представление чисел ───────── */
export function toTwos(n, bits) {
  if (!Number.isInteger(n) || n < -(2 ** (bits - 1)) || n >= 2 ** (bits - 1)) throw new RangeError(\`\${n} не помещается в \${bits} бит со знаком\`);
  return n < 0 ? n + 2 ** bits : n;
}
export function fromTwos(u, bits) {
  if (!Number.isInteger(u) || u < 0 || u >= 2 ** bits) throw new RangeError(\`\${u} не помещается в \${bits} бит без знака\`);
  return u >= 2 ** (bits - 1) ? u - 2 ** bits : u;
}
export function float32Fields(x) {
  const dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, x);
  const bits = dv.getUint32(0);
  return { sign: bits >>> 31, exponent: (bits >>> 23) & 0xff, mantissa: bits & 0x7fffff, hex: bits.toString(16).padStart(8, "0") };
}
export function fromFloat32Hex(hex) { const dv = new DataView(new ArrayBuffer(4)); dv.setUint32(0, parseInt(hex, 16)); return dv.getFloat32(0); }`, { filename: "cpu.mjs", lineNumbers: true }),
    h("Самопроверка check.mjs"),
    p("Проверки собраны в четыре группы: **ассемблер** (формат, ошибки), **процессор** (таблицы флагов, переходы, семь программ: факториал, Фибоначчи, НОД, сумма массива, сортировка со знаком, рекурсивный факториал, подсчёт битов), **кеш** (опорные случаи, LRU против FIFO, независимый эталон на 60 трассах, три «C», обход матриц, связка «процессор → трасса → кеш») и **числа** (дополнительный код, `float32`)."),
    code("js", `// Самопроверка проекта «Процессор и кеш». Запуск: node check.mjs [каталог с cpu.mjs]
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = path.resolve(process.argv[2] ?? "solution");
const C = await import(pathToFileURL(path.join(dir, "cpu.mjs")).href);
const { assemble, run, CacheSim, classifyMisses, matrixTrace, strideTrace, toTwos, fromTwos, float32Fields, fromFloat32Hex, AsmError, CpuError } = C;

let total = 0, passed = 0;
function check(name, fn) {
  total++;
  let ok = false, note = "";
  try { const r = fn(); ok = r === true; if (!ok) note = \` (вернуло \${typeof r === "object" ? JSON.stringify(r)?.slice(0, 90) : String(r)})\`; } catch (e) { note = \` (\${e?.name ?? "Error"}: \${String(e?.message ?? e).split("\\n")[0].slice(0, 90)})\`; }
  if (ok) passed++;
  console.log(\`\${ok ? "OK " : "НЕТ"}  \${name}\${ok ? "" : note}\`);
}
const J = JSON.stringify;
const seeded = (sd) => { let x = sd >>> 0; return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; };
const throwsAs = (f, K) => { try { f(); return false; } catch (e) { return e instanceof K || e?.name === K.name; } };
const exec = (src, opts) => run(assemble(src), opts);
const flags = (r) => \`\${r.flags.Z}\${r.flags.N}\${r.flags.C}\${r.flags.V}\`;                 // порядок: Z N C V
const s16 = (u) => (u >= 32768 ? u - 65536 : u);

// ── Ассемблер ──
check("экспортированы assemble, run, CacheSim, classifyMisses, matrixTrace, strideTrace, toTwos, fromTwos, float32Fields, fromFloat32Hex, AsmError, CpuError", () => [assemble, run, CacheSim, classifyMisses, matrixTrace, strideTrace, toTwos, fromTwos, float32Fields, fromFloat32Hex, AsmError, CpuError].every((x) => typeof x === "function"));
check("assemble: комментарии, пустые строки, метки на своей строке и перед командой, регистр не важен, шестнадцатеричные числа", () => { const r = exec("; пример\\n\\nstart: LDI R0, 0x10\\n  ldi r1, 5 ; пять\\nloop:\\n  add r0, r1\\n  halt\\n"); return r.regs[0] === 21 && r.halted; });
check("assemble: ошибки с номером строки (AsmError.line): неизвестная команда, регистр r8, число операндов, число вне диапазона", () => { const bad = (src, line) => { try { assemble(src); return false; } catch (e) { return e instanceof AsmError && e.line === line && e.message.startsWith(\`строка \${line}:\`); } }; return bad("nop\\n\\nfoo r0, r1", 3) && bad("ldi r8, 1", 1) && bad("add r0", 1) && bad("nop\\nldi r0, 70000", 2) && bad("shl r0, 16", 1) && bad("ldi r0, -32769", 1); });
check("assemble: неопределённая и повторно объявленная метки — AsmError", () => throwsAs(() => assemble("jmp nowhere"), AsmError) && throwsAs(() => assemble("a: nop\\na: nop"), AsmError));
check("assemble: отрицательные константы — дополнительный код (ldi r0, -1 → 0xFFFF; -32768 → 0x8000)", () => { const r = exec("ldi r0, -1\\nldi r1, -32768\\nldi r2, 65535\\nhalt"); return r.regs[0] === 0xffff && r.regs[1] === 0x8000 && r.regs[2] === 0xffff; });

// ── Арифметика и флаги ──
check("ADD: 0x7FFF + 1 → 0x8000, флаги Z N C V = 0 1 0 1 (знаковое переполнение)", () => { const r = exec("ldi r0, 0x7FFF\\nldi r1, 1\\nadd r0, r1\\nhalt"); return r.regs[0] === 0x8000 && flags(r) === "0101"; });
check("ADD: 0xFFFF + 1 → 0, флаги Z N C V = 1 0 1 0 (перенос)", () => { const r = exec("ldi r0, 0xFFFF\\nldi r1, 1\\nadd r0, r1\\nhalt"); return r.regs[0] === 0 && flags(r) === "1010"; });
check("SUB: 0 − 1 → 0xFFFF, флаги Z N C V = 0 1 1 0 (заём)", () => { const r = exec("ldi r0, 0\\nldi r1, 1\\nsub r0, r1\\nhalt"); return r.regs[0] === 0xffff && flags(r) === "0110"; });
check("SUB: 0x8000 − 1 → 0x7FFF, флаги Z N C V = 0 0 0 1 (знаковое переполнение без заёма)", () => { const r = exec("ldi r0, 0x8000\\nldi r1, 1\\nsub r0, r1\\nhalt"); return r.regs[0] === 0x7fff && flags(r) === "0001"; });
check("CMP не меняет регистры, но выставляет флаги; MOV и LDI флаги не меняют", () => { const r = exec("ldi r0, 5\\nldi r1, 5\\ncmp r0, r1\\nldi r2, 9\\nmov r3, r2\\nhalt"); return r.regs[0] === 5 && r.regs[1] === 5 && flags(r) === "1000" && r.regs[3] === 9; });
check("MUL: 300 · 300 = 90000 → 24464 (младшие 16 бит), C = 1; 7 · 6 = 42, C = 0", () => { const a = exec("ldi r0, 300\\nldi r1, 300\\nmul r0, r1\\nhalt"), b = exec("ldi r0, 7\\nldi r1, 6\\nmul r0, r1\\nhalt"); return a.regs[0] === 24464 && a.flags.C === 1 && a.flags.N === 0 && b.regs[0] === 42 && b.flags.C === 0; });
check("AND, OR, XOR, NOT: значения; C и V сбрасываются; NOT 0x00FF → 0xFF00 с N = 1", () => { const r = exec("ldi r0, 0xFF00\\nldi r1, 0x0FF0\\nmov r2, r0\\nmov r3, r0\\nand r0, r1\\nor r2, r1\\nxor r3, r1\\nldi r4, 0x00FF\\nnot r4\\nhalt"); return r.regs[0] === 0x0f00 && r.regs[2] === 0xfff0 && r.regs[3] === 0xf0f0 && r.regs[4] === 0xff00 && flags(r) === "0100"; });
check("SHL: 0x8001 << 1 → 0x0002, C = 1; SHR: 0x8001 >> 1 → 0x4000, C = 1; сдвиг на 0 не меняет значение", () => { const a = exec("ldi r0, 0x8001\\nshl r0, 1\\nhalt"), b = exec("ldi r0, 0x8001\\nshr r0, 1\\nhalt"), c = exec("ldi r0, 0x1234\\nshl r0, 0\\nhalt"); return a.regs[0] === 2 && a.flags.C === 1 && b.regs[0] === 0x4000 && b.flags.C === 1 && c.regs[0] === 0x1234 && c.flags.C === 0; });
check("SAR: арифметический сдвиг сохраняет знак (0x8000 >> 3 → 0xF000; 0x7000 >> 4 → 0x0700)", () => { const a = exec("ldi r0, 0x8000\\nsar r0, 3\\nhalt"), b = exec("ldi r0, 0x7000\\nsar r0, 4\\nhalt"), c = exec("ldi r0, -4\\nsar r0, 1\\nhalt"); return a.regs[0] === 0xf000 && b.regs[0] === 0x0700 && s16(c.regs[0]) === -2; });
check("переходы: JLT/JGE — знаковое сравнение (−1 < 1), JC/JNC — беззнаковое (65535 не меньше 1)", () => { const r = exec("ldi r0, -1\\nldi r1, 1\\nldi r2, 0\\nldi r3, 0\\nldi r4, 1\\ncmp r0, r1\\njlt s\\njmp t\\ns: mov r2, r4\\nt: cmp r0, r1\\njc u\\njmp end\\nu: mov r3, r4\\nend: halt"); return r.regs[2] === 1 && r.regs[3] === 0; });
check("JGE корректно работает при переполнении: 32767 против −32768 (N = 1, V = 1) → не меньше", () => { const r = exec("ldi r0, 0x7FFF\\nldi r1, 0x8000\\nldi r2, 0\\nldi r3, 1\\ncmp r0, r1\\njge ok\\njmp end\\nok: mov r2, r3\\nend: halt"); return r.regs[2] === 1; });

// ── Память, стек, программы ──
check("LD, ST, LDM, STM, начальное содержимое памяти и регистров", () => { const r = exec("ldi r1, 100\\nldi r2, 7\\nst [r1], r2\\nld r3, [r1]\\nstm 200, r3\\nldm r4, 5\\nhalt", { memory: [0, 0, 0, 0, 0, 77] }); return r.memory[100] === 7 && r.regs[3] === 7 && r.memory[200] === 7 && r.regs[4] === 77; });
check("PUSH/POP: порядок LIFO, указатель стека возвращается к 1024", () => { const r = exec("ldi r0, 1\\nldi r1, 2\\npush r0\\npush r1\\npop r2\\npop r3\\nhalt"); return r.regs[2] === 2 && r.regs[3] === 1 && r.sp === 1024; });
check("трассировка обращений к памяти: [[100,\\"W\\"],[100,\\"R\\"],[1023,\\"W\\"],[1023,\\"R\\"]]", () => { const r = exec("ldi r1, 100\\nldi r2, 7\\nst [r1], r2\\nld r3, [r1]\\npush r3\\npop r4\\nhalt", { trace: true }); return J(r.accesses) === '[[100,"W"],[100,"R"],[1023,"W"],[1023,"R"]]'; });
check("CALL/RET записывают и читают адрес возврата в стеке (в трассировке — обращения 1023 W и R)", () => { const r = exec("call f\\nhalt\\nf: ret", { trace: true }); return r.halted && J(r.accesses) === '[[1023,"W"],[1023,"R"]]' && r.sp === 1024; });
check("ошибки процессора: чтение вне памяти, pop из пустого стека, бесконечная рекурсия, выход за конец программы — CpuError", () => throwsAs(() => exec("ldi r0, 2000\\nld r1, [r0]\\nhalt"), CpuError) && throwsAs(() => exec("pop r0\\nhalt"), CpuError) && throwsAs(() => exec("f: call f"), CpuError) && throwsAs(() => exec("nop\\nnop"), CpuError));
check("лимит шагов: бесконечный цикл завершается с halted = false и steps = maxSteps", () => { const r = exec("loop: jmp loop", { maxSteps: 1000 }); return r.halted === false && r.steps === 1000; });
check("факториал 8! = 40320 за 35 шагов", () => { const r = exec("ldi r1, 8\\nldi r0, 1\\nloop: mul r0, r1\\nldi r2, 1\\nsub r1, r2\\njnz loop\\nhalt"); return r.regs[0] === 40320 && r.steps === 35 && r.halted; });
check("число Фибоначчи F(24) = 46368", () => exec("ldi r0, 0\\nldi r1, 1\\nldi r2, 24\\nldi r5, 1\\nloop: mov r3, r0\\nadd r3, r1\\nmov r0, r1\\nmov r1, r3\\nsub r2, r5\\njnz loop\\nhalt").regs[0] === 46368);
check("НОД(1071, 462) = 21 вычитанием (используются JC и JZ)", () => exec("ldi r0, 1071\\nldi r1, 462\\nloop: cmp r0, r1\\njz done\\njc less\\nsub r0, r1\\njmp loop\\nless: sub r1, r0\\njmp loop\\ndone: halt").regs[0] === 21);
check("сумма массива из памяти: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3] → 39", () => exec("ldi r0, 0\\nldi r1, 0\\nldi r2, 10\\nldi r3, 1\\nloop: ld r4, [r1]\\nadd r0, r4\\nadd r1, r3\\nsub r2, r3\\njnz loop\\nhalt", { memory: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3] }).regs[0] === 39);
check("пузырьковая сортировка со знаком: 12 слов, включая −32768, −100 и 32767", () => { const data = [5, -3, 12, 0, -100, 7, 7, -1, 300, -32768, 32767, 1]; const src = "ldi r6, 12\\nldi r7, 1\\nouter: ldi r0, 0\\nldi r5, 0\\nmov r4, r6\\nsub r4, r7\\ninner: cmp r0, r4\\njge check\\nmov r1, r0\\nadd r1, r7\\nld r2, [r0]\\nld r3, [r1]\\ncmp r3, r2\\njge noswap\\nst [r0], r3\\nst [r1], r2\\nldi r5, 1\\nnoswap: add r0, r7\\njmp inner\\ncheck: ldi r1, 0\\ncmp r5, r1\\njnz outer\\nhalt"; const r = exec(src, { memory: data.map((v) => v & 0xffff) }); return J(Array.from(r.memory.slice(0, 12)).map(s16)) === J([...data].sort((a, b) => a - b)); });
check("рекурсивный факториал через CALL/RET и стек: 7! = 5040", () => { const r = exec("ldi r1, 7\\nldi r0, 1\\ncall fact\\nhalt\\nfact: ldi r2, 1\\ncmp r1, r2\\njz base\\npush r1\\nsub r1, r2\\ncall fact\\npop r1\\nmul r0, r1\\nret\\nbase: ret"); return r.regs[0] === 5040 && r.sp === 1024 && r.halted; });
check("число единичных битов 0xBEEF = 13 (сдвиги, AND, цикл)", () => exec("ldi r1, 0xBEEF\\nldi r0, 0\\nldi r2, 1\\nldi r3, 0\\nloop: mov r4, r1\\nand r4, r2\\nadd r0, r4\\nshr r1, 1\\ncmp r1, r3\\njnz loop\\nhalt").regs[0] === 13);
check("быстродействие: миллион шагов эмулятора быстрее 1,5 с", () => { const p = assemble("ldi r1, 1\\nloop: add r0, r1\\nadd r2, r1\\ncmp r2, r3\\njmp loop"); const t = performance.now(); const r = run(p, { maxSteps: 1_000_000 }); return r.steps === 1_000_000 && r.halted === false && performance.now() - t < 1500; });

// ── Кеш ──
const cfg = { size: 4096, lineSize: 64, ways: 2, policy: "LRU" };
const feed = (cache, trace) => { for (const a of trace) cache.access(a); return cache.stats; };
check("CacheSim: последовательное чтение 4096 четырёхбайтных чисел: 256 промахов (по одному на строку 64 байта), 3840 попаданий", () => { const s = feed(new CacheSim(cfg), strideTrace(4096, 4)); return s.accesses === 4096 && s.misses === 256 && s.hits === 3840; });
check("CacheSim: данные в кеше (2 КиБ) читаются дважды — второй проход без промахов; 8 КиБ дважды — второй проход целиком мимо (LRU)", () => { const a = feed(new CacheSim(cfg), [...strideTrace(512, 4), ...strideTrace(512, 4)]), b = feed(new CacheSim(cfg), [...strideTrace(2048, 4), ...strideTrace(2048, 4)]); return a.misses === 32 && b.misses === 256; });
check("CacheSim: два адреса на расстоянии размера кеша: прямое отображение — 2000 промахов из 2000, двухпутевой — 2", () => { const tr = Array.from({ length: 2000 }, (_, i) => (i % 2 ? 4096 : 0)); return feed(new CacheSim({ ...cfg, ways: 1 }), tr).misses === 2000 && feed(new CacheSim(cfg), tr).misses === 2; });
check("CacheSim: различие LRU и FIFO — последовательность A B A C A в одном наборе: LRU 3 промаха, FIFO 4", () => { const set = (k) => k * 2048; const tr = [0, 1, 0, 2, 0].map(set); const mk = (policy) => new CacheSim({ size: 4096, lineSize: 64, ways: 2, policy }); return feed(mk("LRU"), tr).misses === 3 && feed(mk("FIFO"), tr).misses === 4; });
check("CacheSim: вытеснения считаются (evictions), reset обнуляет кеш и счётчики", () => { const c = new CacheSim({ size: 128, lineSize: 64, ways: 1 }); feed(c, [0, 128, 256]); const ev = c.stats.evictions; c.reset(); const after = c.stats.accesses === 0 && c.access(0) === false; return ev === 2 && after; });
check("CacheSim: неверная геометрия или политика → RangeError; config возвращает параметры", () => throwsAs(() => new CacheSim({ size: 4096, lineSize: 48, ways: 2 }), RangeError) && throwsAs(() => new CacheSim({ size: 1000, lineSize: 64, ways: 2 }), RangeError) && throwsAs(() => new CacheSim({ size: 4096, lineSize: 64, ways: 3 }), RangeError) && throwsAs(() => new CacheSim({ ...cfg, policy: "MRU" }), RangeError) && new CacheSim(cfg).config.lineSize === 64);
// независимый эталон: набор — Map из номера набора в массив тегов
const refMisses = (trace, { size, lineSize, ways, policy }) => { const sets = size / (lineSize * ways), m = new Map(); let miss = 0; for (const a of trace) { const line = Math.floor(a / lineSize), s = line % sets, t = Math.floor(line / sets), arr = m.get(s) ?? []; m.set(s, arr); const i = arr.indexOf(t); if (i >= 0) { if (policy === "LRU") { arr.splice(i, 1); arr.push(t); } } else { miss++; if (arr.length === ways) arr.shift(); arr.push(t); } } return miss; };
check("CacheSim совпадает с независимым эталоном на 60 случайных трассах (разные размеры, строки, пути, LRU и FIFO)", () => { const r = seeded(31); const shapes = [[1024, 32, 1], [2048, 64, 2], [4096, 64, 4], [8192, 32, 8], [512, 16, 2]]; for (let t = 0; t < 60; t++) { const [size, lineSize, ways] = shapes[t % shapes.length], policy = t % 2 ? "FIFO" : "LRU", span = [256, 4096, 65536][t % 3], tr = Array.from({ length: 1500 }, () => Math.floor(r() * span) & ~3); const c = new CacheSim({ size, lineSize, ways, policy }); feed(c, tr); if (c.stats.misses !== refMisses(tr, { size, lineSize, ways, policy }) || c.stats.hits + c.stats.misses !== tr.length) return false; } return true; });
check("matrixTrace(n, размер элемента, порядок): n = 2 — по строкам [0,4,8,12], по столбцам [0,8,4,12]; неверный порядок → RangeError", () => J(matrixTrace(2, 4, "row")) === "[0,4,8,12]" && J(matrixTrace(2, 4, "col")) === "[0,8,4,12]" && throwsAs(() => matrixTrace(2, 4, "diag"), RangeError));
check("strideTrace(count, stride, start)", () => J(strideTrace(4, 16, 100)) === "[100,116,132,148]" && J(strideTrace(0, 4)) === "[]");
check("матрица 64×64 из int в кеше 4 КиБ, 2 пути: по строкам 256 промахов, по столбцам 4096 (все)", () => feed(new CacheSim(cfg), matrixTrace(64, 4, "row")).misses === 256 && feed(new CacheSim(cfg), matrixTrace(64, 4, "col")).misses === 4096);
check("classifyMisses: чередование двух адресов в прямом кеше — 2 обязательных, 0 по ёмкости, 1998 конфликтных", () => { const tr = Array.from({ length: 2000 }, (_, i) => (i % 2 ? 4096 : 0)); const r = classifyMisses(tr, { ...cfg, ways: 1 }); return r.misses === 2000 && r.compulsory === 2 && r.capacity === 0 && r.conflict === 1998 && r.hits === 0; });
check("classifyMisses: 8 КиБ дважды в кеше 4 КиБ — 128 обязательных, 128 по ёмкости, 0 конфликтных", () => { const r = classifyMisses([...strideTrace(2048, 4), ...strideTrace(2048, 4)], cfg); return r.compulsory === 128 && r.capacity === 128 && r.conflict === 0 && r.misses === 256; });
check("classifyMisses: матрица 64×64 по столбцам — 256 обязательных и 3840 конфликтных (полностью ассоциативный кеш удержал бы строки)", () => { const r = classifyMisses(matrixTrace(64, 4, "col"), cfg); return r.compulsory === 256 && r.capacity === 0 && r.conflict === 3840 && r.accesses === 4096; });
check("кеш и процессор вместе: трасса пузырьковой сортировки 64 слов (убывающий порядок) — число обращений равно длине трассы, попаданий больше 95 %", () => { const src = "ldi r6, 64\\nldi r7, 1\\nouter: ldi r0, 0\\nldi r5, 0\\nmov r4, r6\\nsub r4, r7\\ninner: cmp r0, r4\\njge check\\nmov r1, r0\\nadd r1, r7\\nld r2, [r0]\\nld r3, [r1]\\ncmp r3, r2\\njge noswap\\nst [r0], r3\\nst [r1], r2\\nldi r5, 1\\nnoswap: add r0, r7\\njmp inner\\ncheck: ldi r1, 0\\ncmp r5, r1\\njnz outer\\nhalt"; const r = exec(src, { memory: Array.from({ length: 64 }, (_, i) => 64 - i), trace: true, maxSteps: 2_000_000 }); const c = new CacheSim(cfg); for (const [w] of r.accesses) c.access(w * 2); return r.halted && c.stats.accesses === r.accesses.length && c.stats.hits / c.stats.accesses > 0.95 && r.memory[0] === 1 && r.memory[63] === 64; });

// ── Представление чисел ──
check("toTwos/fromTwos: 16 бит (−1 ↔ 65535, −32768 ↔ 32768, 32767 ↔ 32767) и 8 бит (−128 ↔ 128)", () => toTwos(-1, 16) === 65535 && toTwos(-32768, 16) === 32768 && toTwos(32767, 16) === 32767 && fromTwos(65535, 16) === -1 && fromTwos(32768, 16) === -32768 && fromTwos(32767, 16) === 32767 && toTwos(-128, 8) === 128 && fromTwos(255, 8) === -1 && toTwos(0, 4) === 0);
check("toTwos/fromTwos: значения вне диапазона и нецелые → RangeError", () => throwsAs(() => toTwos(32768, 16), RangeError) && throwsAs(() => toTwos(-32769, 16), RangeError) && throwsAs(() => toTwos(1.5, 16), RangeError) && throwsAs(() => fromTwos(65536, 16), RangeError) && throwsAs(() => fromTwos(-1, 16), RangeError));
check("toTwos и fromTwos взаимно обратны на всех 16-битных значениях", () => { for (let v = -32768; v < 32768; v++) if (fromTwos(toTwos(v, 16), 16) !== v) return false; return true; });
check("float32Fields: 1.0 → знак 0, порядок 127, мантисса 0, 3f800000; −0 → 80000000; бесконечность → 7f800000", () => { const a = float32Fields(1), b = float32Fields(-0), c = float32Fields(Infinity); return a.sign === 0 && a.exponent === 127 && a.mantissa === 0 && a.hex === "3f800000" && b.sign === 1 && b.hex === "80000000" && c.exponent === 255 && c.mantissa === 0 && c.hex === "7f800000"; });
check("float32Fields: 0.1 → 3dcccccd (порядок 123, мантисса 5033165); 1e-45 → 00000001 (денормализованное); 16777217 → 4b800000 (округление)", () => { const a = float32Fields(0.1), b = float32Fields(1e-45), c = float32Fields(16777217); return a.hex === "3dcccccd" && a.exponent === 123 && a.mantissa === 5033165 && b.hex === "00000001" && b.exponent === 0 && c.hex === "4b800000"; });
check("float32Fields(NaN): порядок 255 и ненулевая мантисса; fromFloat32Hex: 40490fdb ≈ 3.1415927, 3f800000 = 1, 80000000 — −0", () => { const n = float32Fields(NaN); return n.exponent === 255 && n.mantissa !== 0 && Math.abs(fromFloat32Hex("40490fdb") - Math.PI) < 1e-6 && fromFloat32Hex("3f800000") === 1 && Object.is(fromFloat32Hex("80000000"), -0) && Number.isNaN(fromFloat32Hex("7fc00000")); });
check("float32Fields совпадает с DataView (побитово) на 200 случайных числах разных порядков", () => { const r = seeded(5), dv = new DataView(new ArrayBuffer(4)); for (let i = 0; i < 200; i++) { const x = (r() - 0.5) * 10 ** Math.floor(r() * 20 - 10); dv.setFloat32(0, x); const f = float32Fields(x); if (f.hex !== dv.getUint32(0).toString(16).padStart(8, "0") || ((f.sign << 31 | f.exponent << 23 | f.mantissa) >>> 0) !== dv.getUint32(0)) return false; } return true; });

console.log(\`\\nПройдено проверок: \${passed} из \${total}\`);
process.exitCode = passed === total ? 0 : 1;`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 51 из 51`, { filename: "результат node check.mjs solution (Node.js 22.22.0)" }),
    code("text", `Пройдено проверок: 1 из 51`, { filename: "результат node check.mjs starter (заготовка)" }),
    h("Проверка самой проверки: «плохие» варианты"),
    code("text", `b01-add-no-overflow-flag: Пройдено проверок: 50 из 51
b02-sub-carry-is-carry: Пройдено проверок: 49 из 51
b03-cmp-stores-result: Пройдено проверок: 46 из 51
b04-jlt-unsigned: Пройдено проверок: 50 из 51
b05-jge-ignores-overflow: Пройдено проверок: 49 из 51
b06-sar-logical: Пройдено проверок: 50 из 51
b07-mul-no-carry: Пройдено проверок: 50 из 51
b08-no-immediate-range-check: Пройдено проверок: 50 из 51
b09-call-no-stack: Пройдено проверок: 48 из 51
b10-trace-no-writes: Пройдено проверок: 49 из 51
b11-no-step-limit-error-on-end: Пройдено проверок: 50 из 51
b12-cache-lru-as-fifo: Пройдено проверок: 49 из 51
b13-cache-set-index-wrong: Пройдено проверок: 46 из 51
b14-cache-line-by-word: Пройдено проверок: 42 из 51
b15-classify-capacity-only: Пройдено проверок: 49 из 51
b16-matrix-col-same-as-row: Пройдено проверок: 48 из 51
b17-twos-wrong-range: Пройдено проверок: 50 из 51
b18-float-exponent-bias: Пройдено проверок: 47 из 51
b19-asm-error-line-zero-based: Пройдено проверок: 50 из 51`, { filename: "результат check.mjs для вариантов с ошибками (из 51)" }),
    warn("Флаги — самая частая причина «непонятных» ошибок в эмуляторах: `C` при сложении и вычитании означает разное, а `V` не равно `C`. Проверьте себя на четырёх опорных случаях (`0x7FFF + 1`, `0xFFFF + 1`, `0 − 1`, `0x8000 − 1`): у каждого своя комбинация флагов."),
    tip("Матрица по столбцам даёт **конфликтные**, а не ёмкостные промахи, когда шаг по памяти кратен размеру набора. Если заменить размер матрицы с 64 на 65, промахи по столбцам падают с 4096 до 825 (265 обязательных и 560 ёмкостных, конфликтных нет) — проверьте это своим `classifyMisses` и объясните, почему."),
  ],
};
