import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p04SchedulerAndMemory: Project = {
  id: "cs.p04-scheduler-and-memory",
  domain: "cs",
  order: 4,
  title: "Планировщик и виртуальная память",
  subtitle: "Пять политик планирования, четыре алгоритма замещения страниц с аномалией Билэди, адресное пространство с TLB, поиск взаимных блокировок и алгоритм банкира — 46 проверок против независимых пошаговых эталонов",
  level: "intermediate",
  estimatedHours: 12,
  buildsOn: [],
  topics: ["cs.processes-threads", "cs.virtual-memory-files", "cs.concurrency-scheduling"],
  objective:
    "Написать модуль `os.mjs` — «ядро» учебной операционной системы из **четырёх подсистем**: планировщик процессов (`FCFS`, `SJF`, `SRTF`, `RR`, `PRIORITY` с метриками ожидания, оборота и отклика), страничная память (`FIFO`, `LRU`, `CLOCK`, `OPT` и поиск аномалии Билэди), адресное пространство с таблицей страниц, TLB и формулой среднего времени доступа, обнаружение взаимных блокировок по графу ожидания и безопасное состояние по алгоритму банкира. Правильность проверяется **независимыми пошаговыми эталонами** на сотнях случайных нагрузок и классическими числами из учебников: ожидание 8,75 / 7,75 / 6,5 / 11,75 мс, промахи 9 → 10 при росте числа кадров.",
  scenario: [
    p("Вы делаете симулятор для курса по операционным системам: студенты вводят процессы и последовательность обращений к страницам, а симулятор показывает, **кто когда выполнялся**, **сколько каждый ждал** и **почему стало хуже при добавлении памяти**. Все правила ничьих и порядок событий заданы в описании точно — поэтому результаты воспроизводимы и сверяются с независимой реализацией, написанной по единицам времени (тактам), а не по событиям."),
    p("Заготовка лежит в `starter/os.mjs`: функции бросают «не реализовано». Проверка `check.mjs` (46 проверок) запускается командой `node check.mjs .` в каталоге с вашим `os.mjs`. Нужен только Node.js 22."),
    code("js", `// Заготовка проекта «Планировщик и виртуальная память». Реализуйте функции и классы, затем запустите:  node check.mjs .
// Имена экспортов менять нельзя. Подробные правила и контракты — в описании проекта.

export function schedule(processes, policy, options = {}) {
  throw new Error("не реализовано: schedule");
}

export function simulatePaging(refs, frames, algorithm) {
  throw new Error("не реализовано: simulatePaging");
}

export function beladyAnomaly(refs, algorithm, maxFrames) {
  throw new Error("не реализовано: beladyAnomaly");
}

export class PageFault extends Error {
  constructor(page, address) { super(\`страничное нарушение: страница \${page}\`); this.name = "PageFault"; this.page = page; this.address = address; }
}

export class AddressSpace {
  constructor({ pageSize }) { throw new Error("не реализовано: AddressSpace"); }
  // pageSize, map(vpn, pfn), unmap(vpn), translate(vaddr)
}

export class TLB {
  constructor(entries) { throw new Error("не реализовано: TLB"); }
  // stats { hits, misses }, lookup(vpn), insert(vpn, pfn)
}

export function translateWithTlb(space, tlb, vaddr) {
  throw new Error("не реализовано: translateWithTlb");
}

export function effectiveAccessTime(hitRatio, tlbNs, memNs, levels) {
  throw new Error("не реализовано: effectiveAccessTime");
}

export function findDeadlock(holds, waits) {
  throw new Error("не реализовано: findDeadlock");
}

export function safeSequence(available, max, allocation) {
  throw new Error("не реализовано: safeSequence");
}`, { filename: "starter/os.mjs" }),
    table(
      ["Политика", "Правило выбора процесса", "Вытеснение"],
      [
        ["`FCFS`", "Раньше прибыл — раньше выполняется (при равенстве — раньше в списке)", "Нет"],
        ["`SJF`", "Наименьшая **длительность** среди прибывших; ничья — раньше прибыл, затем раньше в списке", "Нет"],
        ["`SRTF`", "Наименьший **остаток** среди прибывших, решение каждую единицу времени; ничья — раньше прибыл, затем раньше в списке (текущему преимущества нет)", "Да"],
        ["`PRIORITY`", "Меньшее число `priority` — важнее (по умолчанию 0); ничья — раньше прибыл, затем раньше в списке; решение каждую единицу времени", "Да"],
        ["`RR` (квант `quantum`, по умолчанию 4)", "Очередь FIFO; процесс выполняется `min(квант, остаток)`; **прибывшие до конца кванта (включительно) встают в очередь раньше вытесненного процесса**", "По кванту"],
      ],
      "Правила планировщика",
    ),
    table(
      ["Функция / класс", "Контракт"],
      [
        ["`schedule(processes, policy, { quantum })`", "`processes = [{ id, arrival, burst, priority? }]` → `{ timeline: [{ id, start, end }], metrics: { id: { completion, turnaround, waiting, response } }, averages: { turnaround, waiting, response }, contextSwitches }`; простой процессора — отрезок с `id = null`; соседние отрезки одного процесса сливаются; `contextSwitches` — число отрезков процессов минус один"],
        ["`simulatePaging(refs, frames, algorithm)`", "`{ faults, hits, faultAt }` для `\"FIFO\"`, `\"LRU\"`, `\"CLOCK\"`, `\"OPT\"`; `faultAt` — индексы обращений, вызвавших промах"],
        ["`beladyAnomaly(refs, algorithm, maxFrames)`", "Наименьшее `k`, при котором промахов больше, чем при `k − 1` кадрах: `{ frames, before, after }`, иначе `null`"],
        ["`AddressSpace({ pageSize })` · `PageFault`", "`map(vpn, pfn)`, `unmap(vpn)`, `translate(vaddr)`; неотображённая страница → `PageFault` с полями `page` и `address`; размер страницы — степень двойки"],
        ["`TLB(entries)` · `translateWithTlb(space, tlb, vaddr)`", "Кеш трансляций с вытеснением давнейшей записи (LRU); `stats = { hits, misses }`"],
        ["`effectiveAccessTime(hitRatio, tlbNs, memNs, levels)`", "`tlbNs + hitRatio·memNs + (1 − hitRatio)·(levels + 1)·memNs`"],
        ["`findDeadlock(holds, waits)`", "`holds = { ресурс: владелец }`, `waits = { процесс: ресурс }` → цикл ожидания, начатый с наименьшего участника, или `null`"],
        ["`safeSequence(available, max, allocation)`", "Порядок завершения по алгоритму банкира (всегда наименьший подходящий номер) или `null`"],
      ],
      "Контракт модуля",
    ),
  ],
  requirements: [
    "`os.mjs` экспортирует `schedule`, `simulatePaging`, `beladyAnomaly`, `PageFault`, `AddressSpace`, `TLB`, `translateWithTlb`, `effectiveAccessTime`, `findDeadlock`, `safeSequence`.",
    "На классическом примере `P1(0, 8)`, `P2(1, 4)`, `P3(2, 9)`, `P4(3, 5)` среднее ожидание: `FCFS` 8,75; `SJF` 7,75; `SRTF` 6,5; `RR` (квант 4) 11,75; шкала `RR` — `P1 0–4, P2 4–8, P3 8–12, P4 12–16, P1 16–20, P3 20–24, P4 24–25, P3 25–26`, 7 переключений.",
    "Ожидание = оборот − длительность, оборот = завершение − прибытие, отклик = первый запуск − прибытие; простой процессора отражается отрезком `id = null` и не считается переключением.",
    "Входные данные проверяются: неизвестная политика, длительность меньше 1, дробное или отрицательное время прибытия, квант меньше 1 → `RangeError`; повторный идентификатор → `Error`; входной массив не изменяется.",
    "Страничная память: на последовательности `1,2,3,4,1,2,5,1,2,3,4,5` `FIFO` даёт 9 промахов при 3 кадрах и **10 при 4** (аномалия Билэди), `LRU` — 10 и 8, `OPT` — 7 и 6, `CLOCK` — 9 и 10; `OPT` никогда не хуже остальных; для `LRU` и `OPT` число промахов не растёт с ростом числа кадров.",
    "`CLOCK`: пока кадры не заполнены, страницы занимают ячейки 0, 1, 2…; при попадании ставится бит обращения; при промахе стрелка (начиная с 0) сбрасывает биты, пока не найдёт ячейку с нулём, заменяет страницу (бит 1) и сдвигается на следующую ячейку.",
    "`AddressSpace`: адрес `0x1234` при страницах по 4096 и отображении `1 → 5` переводится в `0x5234`; смещение — остаток от деления; адрес должен быть неотрицательным целым.",
    "`TLB`: давнейшая (по последнему обращению) запись вытесняется; на последовательности страниц `1, 2, 1, 3, 1, 2` при двух записях — 2 попадания и 4 промаха; `effectiveAccessTime(0.98, 1, 100, 4)` равно 109.",
    "`findDeadlock` игнорирует ожидание ресурса, которым владеет сам процесс, и свободные ресурсы; из нескольких циклов выбирает содержащий наименьший процесс и начинает его с этого процесса.",
    "`safeSequence` на классическом примере (доступно `[3, 3, 2]`, пять процессов, три ресурса) возвращает `[1, 3, 0, 2, 4]`; для небезопасного состояния — `null`; если процесс занял больше своего максимума или размеры несогласованы — `RangeError`.",
  ],
  constraints: [
    "Только стандартные средства JavaScript; никаких библиотек.",
    "Результат `schedule` не должен зависеть от порядка ключей объектов или от порядка `Map`: все ничьи разрешаются правилами из таблицы.",
    "Время дискретно: все величины — целые числа; средние значения — обычные числа с плавающей запятой.",
    "`simulatePaging` не должен менять входной массив обращений.",
    "Реализация `OPT` может смотреть в будущее: это эталон для сравнения, а не реализуемый алгоритм.",
  ],
  expected: [
    "`node check.mjs .` печатает `Пройдено проверок: 46 из 46`.",
    "`beladyAnomaly([1,2,3,4,1,2,5,1,2,3,4,5], \"FIFO\", 6)` возвращает `{ frames: 4, before: 9, after: 10 }`, а для `LRU` и `OPT` — `null`; среди случайных последовательностей аномалия `FIFO` встречается, у `LRU` — ни разу.",
    "`SRTF` не хуже `SJF` и `FCFS` по среднему ожиданию на 100 случайных нагрузках.",
    "`findDeadlock({ r1: \"A\", r2: \"B\", r3: \"C\" }, { A: \"r2\", B: \"r3\", C: \"r1\" })` — `[\"A\", \"B\", \"C\"]`.",
  ],
  technical: [
    "Для `SRTF` и `PRIORITY` проще всего принимать решение **каждую единицу времени**: выберите среди прибывших нужный процесс, продвиньте время на 1, при необходимости слейте соседние отрезки одного процесса. Для `FCFS` и `SJF` решение принимается, когда процессор свободен, и процесс выполняется до конца.",
    "`RR` — очередь и «часы»: перед выбором добавьте в очередь всех прибывших к текущему моменту; после выполнения среза добавьте прибывших к его **концу**, и только потом вытесненный процесс — так поступают учебники, и так устроена эталонная реализация проверки.",
    "Не выводите метрики из временной шкалы «по памяти»: храните момент завершения и первого запуска в самом процессе. Это исключает ошибки при слиянии отрезков и при простое.",
    "`LRU`: удобно держать массив страниц в порядке «от давней к недавней»: попадание — перенос страницы в конец; вытеснение — удаление первой. `FIFO` отличается только отсутствием переноса при попадании.",
    "`OPT`: для каждой страницы в кадрах найдите индекс следующего обращения после текущего; вытесните ту, у которой он наибольший (или обращения больше не будет). Какую из «никогда не понадобятся» выбрать — не влияет на число промахов.",
    "`CLOCK` держите в двух параллельных массивах (страница, бит) или в `Map` битов: «стрелка» — индекс, а не указатель; не забудьте сдвинуть её **после** замены.",
    "Аномалия Билэди возможна только у алгоритмов, не обладающих свойством включения («стековых»): `FIFO` и `CLOCK` её допускают, `LRU` и `OPT` — нет. Поэтому `beladyAnomaly(…, \"LRU\", …)` обязана вернуть `null` на любых данных.",
    "Граф ожидания устроен как «функциональный»: у процесса не более одного исходящего ребра (он ждёт один ресурс), поэтому цикл ищется простым обходом по цепочке с запоминанием позиций; хвост, ведущий в цикл, в ответ не входит.",
    "Алгоритм банкира: `need = max − allocation`; на каждом шаге берётся **наименьший** непройденный процесс, для которого `need ≤ work` покомпонентно; `work += allocation` процесса. Если подходящего нет, а процессы остались, состояние небезопасно.",
  ],
  acceptance: [
    "`node check.mjs .` — 46 из 46.",
    "Заготовка проходит 1 из 46 проверок (экспорты).",
    "Каждый из двадцати «плохих» вариантов проваливает не менее одной проверки: от 1 (бит обращения `CLOCK` на попадании, смещение адреса, TLB без обновления порядка, формула среднего времени, самоожидание в блокировках, ненормированный цикл, порядок выбора банкира, смещение индексов промахов) до 9 (отрезки одного процесса не сливаются).",
    "Все пять политик и четыре алгоритма замещения совпадают с независимыми эталонами на сотнях случайных нагрузок (80 нагрузок на политику, 80 последовательностей на алгоритм).",
  ],
  hints: [
    "Начните с `FCFS` и метрик: получив 8,75 / 15,25 / 8,75 на классическом примере, вы уже проверили формулы ожидания, оборота и отклика. Остальные политики меняют только выбор процесса.",
    "Если `RR` даёт другой порядок отрезков, чем в описании, — вы ставите вытесненный процесс в очередь **до** процессов, прибывших к концу кванта.",
    "Если `SRTF` и `PRIORITY` проходят примеры, но падают на случайных нагрузках, ищите ничьи: при равенстве остатков (или приоритетов) побеждает тот, кто **раньше прибыл**, а не тот, кто сейчас выполняется.",
    "Простой процессора — частая причина расхождений: на нём не должно быть ни процесса, ни переключения, а время должно «перескакивать» к ближайшему прибытию.",
    "Для `CLOCK` нарисуйте на бумаге три кадра и последовательность Билэди: у вас должно получиться 9 промахов при трёх кадрах и 10 при четырёх; это быстрая самопроверка.",
    "Если `beladyAnomaly` для `LRU` возвращает не `null`, ошибка в самом `LRU` (не обновляется порядок при попадании), а не в поиске аномалии.",
    "В `findDeadlock` сначала постройте отображение «процесс → владелец ресурса, которого он ждёт», а потом идите по цепочке; поворот цикла к наименьшему идентификатору делайте в самом конце.",
  ],
  advanced: [
    "Добавьте политику `MLFQ` (многоуровневые очереди с понижением приоритета по израсходованному кванту) и сравните отклик интерактивных и ожидание «тяжёлых» процессов.",
    "Реализуйте двухуровневую таблицу страниц (`AddressSpace` с каталогом и таблицами) и посчитайте число обращений к памяти при обходе.",
    "Добавьте в `simulatePaging` алгоритм рабочего набора (`WSClock`) и обнаружение «пробуксовки» (доля промахов выше порога).",
    "Реализуйте `canGrant(request)` — проверку запроса ресурса по алгоритму банкира: запрос удовлетворяется, только если после него состояние остаётся безопасным.",
    "Напишите генератор нагрузок и постройте график зависимости среднего ожидания от кванта `RR` (оптимум — не 1 и не бесконечность).",
  ],
  failureModes: [
    "**`FCFS` по порядку в списке, а не по прибытию:** результат зависит от порядка записей; 2 проверки из 46.",
    "**`SJF` берёт самый длинный процесс:** среднее ожидание вместо 7,75 становится больше; 2 проверки.",
    "**`SRTF` по исходной длительности, а не по остатку:** вытеснение работает неверно; 3 проверки.",
    "**`RR`: вытесненный процесс встаёт в очередь раньше прибывших:** порядок отрезков не совпадает с эталоном; 2 проверки.",
    "**Ожидание считается как отклик** (`первый запуск − прибытие`): метрики верны только для процессов без вытеснения; красных 7 проверок из 46.",
    "**Простой считается переключением:** лишняя единица в `contextSwitches`; 2 проверки.",
    "**Приоритеты наоборот** (больше число — важнее): 2 проверки.",
    "**Отрезки одного процесса не сливаются:** шкала состоит из единичных отрезков для `SRTF` и `PRIORITY`; красных 9 проверок.",
    "**`LRU` без обновления при попадании:** на деле `FIFO`; 5 проверок, включая сравнение с аномалией Билэди.",
    "**`CLOCK` без установки бита при попадании:** вторая попытка не работает; 1 проверка.",
    "**`OPT` вытесняет ближайшую страницу:** промахов больше, чем у `LRU`; 3 проверки.",
    "**`beladyAnomaly` с нестрогим сравнением** (`≥`): `LRU` «показывает аномалию» там, где число промахов лишь не уменьшилось; 2 проверки.",
    "**Неверное смещение при трансляции:** `0x1234` переводится в чужой адрес; 1 проверка.",
    "**TLB как FIFO** (не обновляется порядок при попадании): вместо 2 попаданий — 1; 1 проверка.",
    "**Формула среднего времени без обращения за данными при промахе:** 109 превращается в 105; 1 проверка.",
    "**Процесс, ждущий собственный ресурс, считается блокировкой:** ложная тревога; 1 проверка.",
    "**Цикл блокировки не повёрнут к наименьшему участнику:** ответ зависит от того, с какой вершины вошли в цикл; 1 проверка.",
    "**Банкир с нестрогим «подходит» вместо `≤`:** безопасное состояние объявляется небезопасным; 2 проверки.",
    "**Банкир берёт наибольший подходящий номер:** последовательность верна, но не совпадает с контрактом; 1 проверка.",
    "**Индексы промахов со сдвигом на единицу:** `faultAt` вместо `[0, 1, 2, …]` даёт `[1, 2, 3, …]`; 1 проверка.",
  ],
  rubric: [
    { criterion: "Планировщик", weight: 30, description: "Пять политик, метрики, простой, ничьи и порядок `RR`; совпадение с пошаговым эталоном на 80 нагрузках на политику." },
    { criterion: "Замещение страниц", weight: 25, description: "`FIFO`, `LRU`, `CLOCK`, `OPT`, позиции промахов, аномалия Билэди, свойства стековых алгоритмов и сравнение с эталонами." },
    { criterion: "Адресное пространство и TLB", weight: 15, description: "Трансляция адреса, `PageFault`, LRU-вытеснение в TLB, формула среднего времени доступа, проверка входных данных." },
    { criterion: "Блокировки и банкир", weight: 20, description: "Цикл в графе ожидания с правильным поворотом; безопасная последовательность и отказ на небезопасном состоянии; сверка перебором перестановок." },
    { criterion: "Чистота и ошибки", weight: 10, description: "`RangeError` для неверных параметров, неизменность входов, читаемость, отсутствие побочных эффектов." },
  ],
  solution: [
    p("Эталон — один файл `os.mjs` (около 230 строк). Он проходит все 46 проверок; заготовка проходит 1 из 46, а каждый из двадцати намеренно испорченных вариантов — меньше 46."),
    h("os.mjs"),
    code("js", `// os.mjs — учебная операционная система: планировщик процессов, страничная память, TLB, взаимные блокировки и алгоритм банкира

/* ───────── Планировщик ───────── */
// processes: [{ id, arrival, burst, priority? }]; policy: "FCFS" | "SJF" | "SRTF" | "RR" | "PRIORITY"; options.quantum — для RR (по умолчанию 4)
// Правила ничьих: раньше прибыл → раньше в списке. Приоритет: меньшее число — важнее. RR: прибывшие к концу кванта встают в очередь раньше вытесненного.
export function schedule(processes, policy, { quantum = 4 } = {}) {
  const POLICIES = ["FCFS", "SJF", "SRTF", "RR", "PRIORITY"];
  if (!POLICIES.includes(policy)) throw new RangeError(\`неизвестная политика «\${policy}»\`);
  if (policy === "RR" && (!Number.isInteger(quantum) || quantum < 1)) throw new RangeError("квант должен быть целым числом не меньше 1");
  const ids = new Set();
  const procs = processes.map((p, index) => {
    if (!Number.isInteger(p.arrival) || p.arrival < 0) throw new RangeError(\`процесс \${p.id}: время прибытия должно быть целым неотрицательным\`);
    if (!Number.isInteger(p.burst) || p.burst < 1) throw new RangeError(\`процесс \${p.id}: длительность должна быть целым числом не меньше 1\`);
    if (ids.has(p.id)) throw new Error(\`повторный идентификатор \${p.id}\`);
    ids.add(p.id);
    return { id: p.id, arrival: p.arrival, burst: p.burst, priority: p.priority ?? 0, remaining: p.burst, index, start: null, completion: null };
  });
  const slices = [];                                                           // [{ id, start, end }]
  const push = (id, start, end) => { if (start === end) return; const last = slices[slices.length - 1]; if (last && last.id === id && last.end === start) last.end = end; else slices.push({ id, start, end }); };
  const byArrival = (a, b) => a.arrival - b.arrival || a.index - b.index;
  let time = 0, left = procs.length;
  const finish = (p, t) => { p.completion = t; left--; };
  if (policy === "RR") {
    const pending = [...procs].sort(byArrival), queue = [];
    const admit = (upTo) => { while (pending.length && pending[0].arrival <= upTo) queue.push(pending.shift()); };
    while (left > 0) {
      admit(time);
      if (!queue.length) { const next = pending[0].arrival; push(null, time, next); time = next; admit(time); }
      const p = queue.shift(), run = Math.min(quantum, p.remaining);
      if (p.start === null) p.start = time;
      push(p.id, time, time + run); time += run; p.remaining -= run;
      admit(time);
      if (p.remaining > 0) queue.push(p); else finish(p, time);
    }
  } else if (policy === "FCFS" || policy === "SJF") {
    const pending = [...procs].sort(byArrival);
    while (left > 0) {
      const ready = pending.filter((p) => p.arrival <= time);
      if (!ready.length) { const next = pending[0].arrival; push(null, time, next); time = next; continue; }
      const p = policy === "FCFS" ? ready[0] : ready.reduce((best, q) => (q.burst < best.burst || (q.burst === best.burst && byArrival(q, best) < 0) ? q : best));
      pending.splice(pending.indexOf(p), 1);
      p.start = time; push(p.id, time, time + p.burst); time += p.burst; p.remaining = 0; finish(p, time);
    }
  } else {                                                                     // SRTF и PRIORITY: решение принимается каждую единицу времени
    const key = policy === "SRTF" ? (p) => p.remaining : (p) => p.priority;
    while (left > 0) {
      const ready = procs.filter((p) => p.remaining > 0 && p.arrival <= time);
      if (!ready.length) { const next = Math.min(...procs.filter((p) => p.remaining > 0).map((p) => p.arrival)); push(null, time, next); time = next; continue; }
      const p = ready.reduce((best, q) => (key(q) < key(best) || (key(q) === key(best) && byArrival(q, best) < 0) ? q : best));
      if (p.start === null) p.start = time;
      push(p.id, time, time + 1); time += 1; p.remaining -= 1;
      if (p.remaining === 0) finish(p, time);
    }
  }
  const metrics = {}; let sumT = 0, sumW = 0, sumR = 0;
  for (const p of procs) {
    const turnaround = p.completion - p.arrival, waiting = turnaround - p.burst, response = p.start - p.arrival;
    metrics[p.id] = { completion: p.completion, turnaround, waiting, response }; sumT += turnaround; sumW += waiting; sumR += response;
  }
  const n = procs.length || 1, busy = slices.filter((s) => s.id !== null);
  return { timeline: slices, metrics, averages: { turnaround: sumT / n, waiting: sumW / n, response: sumR / n }, contextSwitches: Math.max(0, busy.length - 1) };
}

/* ───────── Замещение страниц ───────── */
// refs — последовательность номеров страниц; frames — число кадров; algorithm: "FIFO" | "LRU" | "CLOCK" | "OPT"
export function simulatePaging(refs, frames, algorithm) {
  if (!Number.isInteger(frames) || frames < 1) throw new RangeError("число кадров должно быть целым не меньше 1");
  if (!["FIFO", "LRU", "CLOCK", "OPT"].includes(algorithm)) throw new RangeError(\`неизвестный алгоритм «\${algorithm}»\`);
  const mem = []; let hand = 0, faults = 0; const faultAt = [], refBit = new Map();
  for (let t = 0; t < refs.length; t++) {
    const page = refs[t], at = mem.indexOf(page);
    if (at >= 0) {                                                             // попадание
      if (algorithm === "LRU") { mem.splice(at, 1); mem.push(page); }
      if (algorithm === "CLOCK") refBit.set(page, 1);
      continue;
    }
    faults++; faultAt.push(t);
    if (mem.length < frames) { mem.push(page); if (algorithm === "CLOCK") refBit.set(page, 1); continue; }
    if (algorithm === "FIFO" || algorithm === "LRU") { mem.shift(); mem.push(page); }
    else if (algorithm === "CLOCK") {
      while (refBit.get(mem[hand]) === 1) { refBit.set(mem[hand], 0); hand = (hand + 1) % frames; }
      refBit.delete(mem[hand]); mem[hand] = page; refBit.set(page, 1); hand = (hand + 1) % frames;
    } else {                                                                   // OPT: вытесняем страницу, которая понадобится позже всех (или никогда)
      let victim = 0, farthest = -1;
      mem.forEach((q, i) => { let next = refs.indexOf(q, t + 1); if (next === -1) next = Infinity; if (next > farthest) { farthest = next; victim = i; } });
      mem[victim] = page;
    }
  }
  return { faults, hits: refs.length - faults, faultAt };
}
export function beladyAnomaly(refs, algorithm, maxFrames) {
  let prev = simulatePaging(refs, 1, algorithm).faults;
  for (let k = 2; k <= maxFrames; k++) { const cur = simulatePaging(refs, k, algorithm).faults; if (cur > prev) return { frames: k, before: prev, after: cur }; prev = cur; }
  return null;
}

/* ───────── Адресное пространство и TLB ───────── */
export class PageFault extends Error { constructor(page, address) { super(\`страничное нарушение: страница \${page} (адрес \${address}) не отображена\`); this.name = "PageFault"; this.page = page; this.address = address; } }
export class AddressSpace {
  #pageSize; #table = new Map();
  constructor({ pageSize }) {
    if (!Number.isInteger(pageSize) || pageSize < 2 || (pageSize & (pageSize - 1)) !== 0) throw new RangeError("размер страницы должен быть степенью двойки");
    this.#pageSize = pageSize;
  }
  get pageSize() { return this.#pageSize; }
  map(vpn, pfn) { this.#table.set(vpn, pfn); return this; }
  unmap(vpn) { return this.#table.delete(vpn); }
  translate(vaddr) {
    if (!Number.isInteger(vaddr) || vaddr < 0) throw new RangeError("виртуальный адрес должен быть неотрицательным целым");
    const vpn = Math.floor(vaddr / this.#pageSize), offset = vaddr % this.#pageSize, pfn = this.#table.get(vpn);
    if (pfn === undefined) throw new PageFault(vpn, vaddr);
    return pfn * this.#pageSize + offset;
  }
}
export class TLB {
  #cap; #m = new Map();
  constructor(entries) { if (!Number.isInteger(entries) || entries < 1) throw new RangeError("размер TLB — целое не меньше 1"); this.#cap = entries; this.stats = { hits: 0, misses: 0 }; }
  lookup(vpn) { if (!this.#m.has(vpn)) { this.stats.misses++; return undefined; } const pfn = this.#m.get(vpn); this.#m.delete(vpn); this.#m.set(vpn, pfn); this.stats.hits++; return pfn; }
  insert(vpn, pfn) { this.#m.delete(vpn); if (this.#m.size >= this.#cap) this.#m.delete(this.#m.keys().next().value); this.#m.set(vpn, pfn); }
}
export function translateWithTlb(space, tlb, vaddr) {
  const vpn = Math.floor(vaddr / space.pageSize), offset = vaddr % space.pageSize, hit = tlb.lookup(vpn);
  if (hit !== undefined) return hit * space.pageSize + offset;
  const paddr = space.translate(vaddr); tlb.insert(vpn, Math.floor(paddr / space.pageSize)); return paddr;
}
/** Среднее время доступа: поиск в TLB + (при попадании — одно обращение к памяти; при промахе — levels обращений обхода таблиц и одно за данными). */
export function effectiveAccessTime(hitRatio, tlbNs, memNs, levels) {
  if (!(hitRatio >= 0 && hitRatio <= 1)) throw new RangeError("доля попаданий — число от 0 до 1");
  return tlbNs + hitRatio * memNs + (1 - hitRatio) * (levels + 1) * memNs;
}

/* ───────── Взаимные блокировки ───────── */
// holds: { ресурс: процесс-владелец }, waits: { процесс: ресурс, которого он ждёт } → цикл ожидания или null
export function findDeadlock(holds, waits) {
  const next = {};
  for (const [p, r] of Object.entries(waits)) { const owner = holds[r]; if (owner !== undefined && owner !== p) next[p] = owner; }
  const cycles = [], doneNodes = new Set();
  for (const start of Object.keys(next).sort()) {
    if (doneNodes.has(start)) continue;
    const path = [], pos = new Map(); let cur = start;
    while (cur !== undefined && !doneNodes.has(cur) && !pos.has(cur)) { pos.set(cur, path.length); path.push(cur); cur = next[cur]; }
    if (cur !== undefined && pos.has(cur)) { const cycle = path.slice(pos.get(cur)); const m = cycle.indexOf([...cycle].sort()[0]); cycles.push([...cycle.slice(m), ...cycle.slice(0, m)]); }
    path.forEach((x) => doneNodes.add(x));
  }
  if (!cycles.length) return null;
  return cycles.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))[0];
}
// Алгоритм банкира: порядок завершения процессов (всегда берётся наименьший подходящий номер) или null, если состояние небезопасно
export function safeSequence(available, max, allocation) {
  const n = max.length, m = available.length;
  if (allocation.length !== n || max.some((row) => row.length !== m) || allocation.some((row) => row.length !== m)) throw new RangeError("размеры векторов и матриц не согласованы");
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) if (allocation[i][j] > max[i][j]) throw new RangeError(\`процесс \${i} занял больше заявленного максимума по ресурсу \${j}\`);
  const work = [...available], done = new Array(n).fill(false), order = [];
  while (order.length < n) {
    const i = [...Array(n).keys()].find((k) => !done[k] && max[k].every((mx, j) => mx - allocation[k][j] <= work[j]));
    if (i === undefined) return null;
    done[i] = true; order.push(i); for (let j = 0; j < m; j++) work[j] += allocation[i][j];
  }
  return order;
}`, { filename: "os.mjs", lineNumbers: true }),
    h("Самопроверка check.mjs"),
    p("В проверке есть **независимые эталоны**, написанные другим способом: планировщик моделируется по единицам времени (в решении — по событиям), замещение страниц — на простых массивах с отметками времени, банкир сверяется перебором всех перестановок процессов для небольших состояний. Совпадение двух разных реализаций на сотнях случайных входов надёжнее любого набора ручных примеров."),
    code("js", `// Самопроверка проекта «Планировщик и виртуальная память». Запуск: node check.mjs [каталог с os.mjs]
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = path.resolve(process.argv[2] ?? "solution");
const O = await import(pathToFileURL(path.join(dir, "os.mjs")).href);
const { schedule, simulatePaging, beladyAnomaly, PageFault, AddressSpace, TLB, translateWithTlb, effectiveAccessTime, findDeadlock, safeSequence } = O;

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
const near = (a, b) => Math.abs(a - b) < 1e-9;

// ── независимые эталоны (по единицам времени) ──
function refSchedule(procs, policy, q) {
  const n = procs.length, rem = procs.map((p) => p.burst), first = new Array(n).fill(null), done = new Array(n).fill(null), who = [];
  const order = (a, b) => procs[a].arrival - procs[b].arrival || a - b;
  const queue = []; let running = -1, sliceLeft = 0, finished = 0, t = 0;
  const arrivedAt = (time) => procs.map((p, i) => [p, i]).filter(([p]) => p.arrival === time).map(([, i]) => i);
  if (policy === "RR") for (const i of arrivedAt(0)) queue.push(i);
  while (finished < n) {
    let pick = -1;
    if (policy === "RR") { if (running === -1 && queue.length) { running = queue.shift(); sliceLeft = q; } pick = running; }
    else {
      const ready = [...Array(n).keys()].filter((i) => rem[i] > 0 && procs[i].arrival <= t);
      if (policy === "FCFS" || policy === "SJF") {
        if (running !== -1) pick = running;
        else if (ready.length) pick = [...ready].sort((a, b) => (policy === "FCFS" ? 0 : procs[a].burst - procs[b].burst) || order(a, b))[0];
      } else if (ready.length) {
        const key = (i) => (policy === "SRTF" ? rem[i] : (procs[i].priority ?? 0));
        pick = [...ready].sort((a, b) => key(a) - key(b) || order(a, b))[0];
      }
      if (pick !== -1 && (policy === "FCFS" || policy === "SJF")) running = pick;
    }
    who.push(pick === -1 ? null : procs[pick].id);
    if (pick !== -1) {
      if (first[pick] === null) first[pick] = t;
      rem[pick]--; if (policy === "RR") sliceLeft--;
    }
    t++;
    if (policy === "RR") { for (const i of arrivedAt(t)) queue.push(i); }
    if (pick !== -1 && rem[pick] === 0) { done[pick] = t; finished++; if (policy === "FCFS" || policy === "SJF" || policy === "RR") running = -1; }
    else if (policy === "RR" && pick !== -1 && sliceLeft === 0) { queue.push(pick); running = -1; }
  }
  const tl = []; who.forEach((id, i) => { const last = tl[tl.length - 1]; if (last && last.id === id) last.end = i + 1; else tl.push({ id, start: i, end: i + 1 }); });
  const metrics = {}; procs.forEach((p, i) => { const ta = done[i] - p.arrival; metrics[p.id] = { completion: done[i], turnaround: ta, waiting: ta - p.burst, response: first[i] - p.arrival }; });
  return { timeline: tl, metrics };
}
const refPaging = (refs, frames, alg) => {
  let faults = 0; const mem = [], used = new Map(), bits = [], pages = []; let hand = 0;
  refs.forEach((p, t) => {
    const hit = alg === "CLOCK" ? pages.includes(p) : mem.includes(p);
    if (hit) { used.set(p, t); if (alg === "CLOCK") bits[pages.indexOf(p)] = 1; return; }
    faults++;
    if (alg === "CLOCK") {
      if (pages.length < frames) { pages.push(p); bits.push(1); return; }
      while (bits[hand] === 1) { bits[hand] = 0; hand = (hand + 1) % frames; }
      pages[hand] = p; bits[hand] = 1; hand = (hand + 1) % frames; return;
    }
    if (mem.length < frames) { mem.push(p); used.set(p, t); return; }
    let v;
    if (alg === "FIFO") v = 0;
    else if (alg === "LRU") v = mem.reduce((best, x, i) => (used.get(x) < used.get(mem[best]) ? i : best), 0);
    else { let far = -1; v = 0; mem.forEach((x, i) => { const nx = refs.slice(t + 1).indexOf(x); const d = nx === -1 ? 1e9 : nx; if (d > far) { far = d; v = i; } }); }
    mem.splice(v, 1); mem.push(p); used.set(p, t);
  });
  return faults;
};

// ── Планировщик ──
const classic = [{ id: "P1", arrival: 0, burst: 8 }, { id: "P2", arrival: 1, burst: 4 }, { id: "P3", arrival: 2, burst: 9 }, { id: "P4", arrival: 3, burst: 5 }];
const tlOf = (r) => r.timeline.map((s) => \`\${s.id}:\${s.start}-\${s.end}\`).join(" ");
check("экспортированы все функции и классы", () => [schedule, simulatePaging, beladyAnomaly, PageFault, AddressSpace, TLB, translateWithTlb, effectiveAccessTime, findDeadlock, safeSequence].every((x) => typeof x === "function"));
check("FCFS на классическом примере: среднее ожидание 8,75, оборот 15,25, отклик 8,75; временная шкала P1 0–8, P2 8–12, P3 12–21, P4 21–26", () => { const r = schedule(classic, "FCFS"); return near(r.averages.waiting, 8.75) && near(r.averages.turnaround, 15.25) && near(r.averages.response, 8.75) && tlOf(r) === "P1:0-8 P2:8-12 P3:12-21 P4:21-26" && r.contextSwitches === 3; });
check("SJF (без вытеснения): P1, P2, P4, P3; среднее ожидание 7,75", () => { const r = schedule(classic, "SJF"); return tlOf(r) === "P1:0-8 P2:8-12 P4:12-17 P3:17-26" && near(r.averages.waiting, 7.75); });
check("SRTF (с вытеснением): среднее ожидание 6,5, отклик 4,25; P1 вытесняется на 1-й единице и возвращается на 10-й", () => { const r = schedule(classic, "SRTF"); return tlOf(r) === "P1:0-1 P2:1-5 P4:5-10 P1:10-17 P3:17-26" && near(r.averages.waiting, 6.5) && near(r.averages.response, 4.25) && r.contextSwitches === 4; });
check("RR с квантом 4: временная шкала, среднее ожидание 11,75, отклик 4,5, 7 переключений; прибывшие к концу кванта — раньше вытесненного", () => { const r = schedule(classic, "RR", { quantum: 4 }); return tlOf(r) === "P1:0-4 P2:4-8 P3:8-12 P4:12-16 P1:16-20 P3:20-24 P4:24-25 P3:25-26" && near(r.averages.waiting, 11.75) && near(r.averages.response, 4.5) && r.contextSwitches === 7 && r.metrics.P1.completion === 20 && r.metrics.P3.completion === 26; });
check("PRIORITY (меньшее число — важнее, с вытеснением): высокоприоритетный процесс прерывает текущий", () => { const r = schedule([{ id: "A", arrival: 0, burst: 6, priority: 3 }, { id: "B", arrival: 2, burst: 2, priority: 1 }, { id: "C", arrival: 3, burst: 3, priority: 2 }], "PRIORITY"); return tlOf(r) === "A:0-2 B:2-4 C:4-7 A:7-11" && r.metrics.A.waiting === 5 && r.metrics.B.response === 0; });
check("PRIORITY при равных приоритетах работает как FCFS; приоритет по умолчанию — 0", () => tlOf(schedule(classic, "PRIORITY")) === tlOf(schedule(classic, "FCFS")));
check("простой процессора: пока никого нет, на шкале — отрезок с id = null; он не считается переключением", () => { const r = schedule([{ id: "X", arrival: 5, burst: 2 }], "FCFS"); return J(r.timeline) === '[{"id":null,"start":0,"end":5},{"id":"X","start":5,"end":7}]' && r.metrics.X.waiting === 0 && r.metrics.X.response === 0 && r.contextSwitches === 0; });
check("простой между процессами (RR и SRTF): шкала содержит null-отрезок и корректные метрики", () => { const ps = [{ id: "A", arrival: 0, burst: 2 }, { id: "B", arrival: 6, burst: 3 }]; return ["RR", "SRTF", "SJF", "FCFS", "PRIORITY"].every((pol) => tlOf(schedule(ps, pol)) === "A:0-2 null:2-6 B:6-9") && schedule(ps, "RR").contextSwitches === 1; });
check("RR: квант больше любой длительности даёт тот же порядок, что FCFS; одиночный процесс — одна запись шкалы", () => { const r = schedule(classic, "RR", { quantum: 100 }); const one = schedule([{ id: "S", arrival: 0, burst: 10 }], "RR", { quantum: 3 }); return tlOf(r) === tlOf(schedule(classic, "FCFS")) && J(one.timeline) === '[{"id":"S","start":0,"end":10}]'; });
check("RR: квант по умолчанию — 4; квант 1 даёт «по очереди» по единице", () => { const r1 = schedule([{ id: "A", arrival: 0, burst: 3 }, { id: "B", arrival: 0, burst: 2 }], "RR", { quantum: 1 }); return tlOf(schedule(classic, "RR")) === tlOf(schedule(classic, "RR", { quantum: 4 })) && tlOf(r1) === "A:0-1 B:1-2 A:2-3 B:3-4 A:4-5"; });
check("ничьи: одинаковая длительность — раньше пришёл, затем раньше в списке (SJF); равные остатки в SRTF — раньше пришёл", () => { const a = schedule([{ id: "L", arrival: 0, burst: 5 }, { id: "Y", arrival: 1, burst: 2 }, { id: "X", arrival: 1, burst: 2 }], "SJF"); const b = schedule([{ id: "A", arrival: 0, burst: 4 }, { id: "B", arrival: 1, burst: 3 }], "SRTF"); return tlOf(a) === "L:0-5 Y:5-7 X:7-9" && tlOf(b) === "A:0-4 B:4-7"; });
check("пустой список процессов → пустая шкала и нулевые средние", () => { const r = schedule([], "FCFS"); return J(r.timeline) === "[]" && r.averages.waiting === 0 && r.contextSwitches === 0 && J(r.metrics) === "{}"; });
check("проверка входных данных: неизвестная политика, длительность 0, дробное прибытие, квант 0 → RangeError; повторный id → Error", () => throwsAs(() => schedule(classic, "LIFO"), RangeError) && throwsAs(() => schedule([{ id: "a", arrival: 0, burst: 0 }], "FCFS"), RangeError) && throwsAs(() => schedule([{ id: "a", arrival: 0.5, burst: 1 }], "FCFS"), RangeError) && throwsAs(() => schedule(classic, "RR", { quantum: 0 }), RangeError) && throwsAs(() => schedule([{ id: "a", arrival: 0, burst: 1 }, { id: "a", arrival: 1, burst: 1 }], "FCFS"), Error));
check("входной массив не изменяется", () => { const copy = J(classic); schedule(classic, "SRTF"); schedule(classic, "RR"); return J(classic) === copy; });
const randomLoad = (r) => Array.from({ length: 1 + Math.floor(r() * 7) }, (_, i) => ({ id: "p" + i, arrival: Math.floor(r() * 16), burst: 1 + Math.floor(r() * 9), priority: Math.floor(r() * 4) }));
check("инварианты на 100 случайных нагрузках × 5 политик: отрезки не пересекаются, суммы равны длительностям, нет работы до прибытия, оборот = завершение − прибытие, ожидание ≥ 0", () => { const r = seeded(41); for (let t = 0; t < 100; t++) { const ps = randomLoad(r); for (const pol of ["FCFS", "SJF", "SRTF", "RR", "PRIORITY"]) { const res = schedule(ps, pol, { quantum: 1 + (t % 5) }); let prev = 0; for (const s of res.timeline) { if (s.start !== prev || s.end <= s.start) return false; prev = s.end; } for (const p of ps) { const mine = res.timeline.filter((s) => s.id === p.id), sum = mine.reduce((a, s) => a + s.end - s.start, 0), m = res.metrics[p.id]; if (sum !== p.burst || mine[0].start < p.arrival || m.turnaround !== m.completion - p.arrival || m.waiting !== m.turnaround - p.burst || m.waiting < 0 || m.response < 0) return false; } } } return true; });
for (const pol of ["FCFS", "SJF", "SRTF", "RR", "PRIORITY"]) check(\`\${pol}: совпадает с независимым пошаговым эталоном на 80 случайных нагрузках (временная шкала и метрики)\`, () => { const r = seeded(100 + pol.length); for (let t = 0; t < 80; t++) { const ps = randomLoad(r), q = 1 + (t % 5), got = schedule(ps, pol, { quantum: q }), ref = refSchedule(ps, pol, q); if (J(got.timeline) !== J(ref.timeline) || J(got.metrics) !== J(ref.metrics)) return false; } return true; });
check("SRTF не хуже SJF и FCFS по среднему ожиданию на 100 случайных нагрузках (теорема об оптимальности SRTF)", () => { const r = seeded(77); for (let t = 0; t < 100; t++) { const ps = randomLoad(r), a = schedule(ps, "SRTF").averages.waiting; if (a > schedule(ps, "SJF").averages.waiting + 1e-9 || a > schedule(ps, "FCFS").averages.waiting + 1e-9) return false; } return true; });

// ── Страничная память ──
const belady = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
const faults = (refs, f, a) => simulatePaging(refs, f, a).faults;
check("FIFO на последовательности Билэди: 3 кадра — 9 промахов, 4 кадра — 10 (аномалия)", () => faults(belady, 3, "FIFO") === 9 && faults(belady, 4, "FIFO") === 10);
check("LRU: 3 кадра — 10, 4 кадра — 8; OPT: 3 — 7, 4 — 6", () => faults(belady, 3, "LRU") === 10 && faults(belady, 4, "LRU") === 8 && faults(belady, 3, "OPT") === 7 && faults(belady, 4, "OPT") === 6);
check("CLOCK (вторая попытка): 3 кадра — 9 промахов, 4 кадра — 10", () => faults(belady, 3, "CLOCK") === 9 && faults(belady, 4, "CLOCK") === 10);
check("simulatePaging возвращает hits и позиции промахов (FIFO, 3 кадра: [0,1,2,3,4,5,6,9,10])", () => { const r = simulatePaging(belady, 3, "FIFO"); return r.hits === 3 && J(r.faultAt) === "[0,1,2,3,4,5,6,9,10]" && r.faults + r.hits === belady.length; });
check("пустая последовательность и один кадр: промахов столько, сколько смен страницы", () => faults([], 3, "LRU") === 0 && faults([1, 1, 2, 2, 1], 1, "FIFO") === 3 && faults([1, 2, 3], 5, "OPT") === 3);
check("все четыре алгоритма совпадают с независимыми эталонами на 80 случайных последовательностях (страницы 0…7, до 60 обращений, 1…5 кадров)", () => { const r = seeded(9); for (let t = 0; t < 80; t++) { const refs = Array.from({ length: 1 + Math.floor(r() * 60) }, () => Math.floor(r() * 8)), f = 1 + (t % 5); for (const a of ["FIFO", "LRU", "CLOCK", "OPT"]) if (faults(refs, f, a) !== refPaging(refs, f, a)) return false; } return true; });
check("OPT не превосходит остальных; LRU и OPT не растут с числом кадров (стековые алгоритмы) на 100 случайных последовательностях", () => { const r = seeded(15); for (let t = 0; t < 100; t++) { const refs = Array.from({ length: 40 }, () => Math.floor(r() * 7)); let lastLru = Infinity, lastOpt = Infinity; for (let f = 1; f <= 6; f++) { const o = faults(refs, f, "OPT"), l = faults(refs, f, "LRU"); if (o > l || o > faults(refs, f, "FIFO") || o > faults(refs, f, "CLOCK") || l > lastLru || o > lastOpt) return false; lastLru = l; lastOpt = o; } } return true; });
check("beladyAnomaly: FIFO на последовательности Билэди — { frames: 4, before: 9, after: 10 }; LRU и OPT — null", () => J(beladyAnomaly(belady, "FIFO", 6)) === '{"frames":4,"before":9,"after":10}' && beladyAnomaly(belady, "LRU", 6) === null && beladyAnomaly(belady, "OPT", 6) === null);
check("среди 300 случайных последовательностей есть такие, где FIFO даёт аномалию Билэди, а LRU — ни одной", () => { const r = seeded(21); let fifo = 0; for (let t = 0; t < 300; t++) { const refs = Array.from({ length: 30 }, () => Math.floor(r() * 7)); if (beladyAnomaly(refs, "FIFO", 6)) fifo++; if (beladyAnomaly(refs, "LRU", 6)) return false; } return fifo > 0; });
check("simulatePaging: число кадров 0, дробное или неизвестный алгоритм → RangeError", () => throwsAs(() => simulatePaging([1], 0, "FIFO"), RangeError) && throwsAs(() => simulatePaging([1], 1.5, "FIFO"), RangeError) && throwsAs(() => simulatePaging([1], 2, "MRU"), RangeError));

// ── Адресное пространство, TLB ──
check("AddressSpace: трансляция 0x1234 при странице 4096 и отображении 1 → 5 даёт 0x5234; границы страниц", () => { const s = new AddressSpace({ pageSize: 4096 }).map(1, 5).map(0, 9); return s.translate(0x1234) === 0x5234 && s.translate(4095) === 9 * 4096 + 4095 && s.translate(4096) === 5 * 4096 && s.pageSize === 4096; });
check("AddressSpace: неотображённая страница → PageFault с полями page и address; unmap снимает отображение", () => { const s = new AddressSpace({ pageSize: 256 }).map(2, 7); let page = null; try { s.translate(1000); } catch (e) { if (e instanceof PageFault || e.name === "PageFault") page = [e.page, e.address]; } const had = s.unmap(2); return J(page) === "[3,1000]" && had === true && throwsAs(() => s.translate(512), PageFault); });
check("AddressSpace: размер страницы не степень двойки, отрицательный или дробный адрес → RangeError", () => throwsAs(() => new AddressSpace({ pageSize: 3000 }), RangeError) && throwsAs(() => new AddressSpace({ pageSize: 0 }), RangeError) && throwsAs(() => new AddressSpace({ pageSize: 4096 }).translate(-1), RangeError) && throwsAs(() => new AddressSpace({ pageSize: 4096 }).translate(1.5), RangeError));
check("TLB (LRU, 2 записи): последовательность страниц 1,2,1,3,1,2 даёт 2 попадания и 4 промаха; translateWithTlb совпадает с translate", () => { const s = new AddressSpace({ pageSize: 4096 }).map(1, 10).map(2, 11).map(3, 12), tlb = new TLB(2); const out = [1, 2, 1, 3, 1, 2].map((p) => translateWithTlb(s, tlb, p * 4096 + 7)); return tlb.stats.hits === 2 && tlb.stats.misses === 4 && out.every((v, i) => v === s.translate([1, 2, 1, 3, 1, 2][i] * 4096 + 7)); });
check("TLB: lookup неизвестной страницы — undefined и промах; вставка сверх ёмкости вытесняет самую давнюю; неверный размер → RangeError", () => { const t = new TLB(1); const a = t.lookup(5); t.insert(5, 50); t.insert(6, 60); return a === undefined && t.lookup(5) === undefined && t.lookup(6) === 60 && throwsAs(() => new TLB(0), RangeError); });
check("effectiveAccessTime: 98 % попаданий, TLB 1 нс, память 100 нс, 4 уровня → 109 нс; 100 % → 101; 0 % → 501", () => near(effectiveAccessTime(0.98, 1, 100, 4), 109) && near(effectiveAccessTime(1, 1, 100, 4), 101) && near(effectiveAccessTime(0, 1, 100, 4), 501) && throwsAs(() => effectiveAccessTime(1.2, 1, 100, 4), RangeError));

// ── Блокировки ──
check("findDeadlock: цикл A → B → C → A, начатый с наименьшего процесса", () => J(findDeadlock({ r1: "A", r2: "B", r3: "C" }, { A: "r2", B: "r3", C: "r1" })) === '["A","B","C"]' && J(findDeadlock({ r1: "C", r2: "A", r3: "B" }, { A: "r1", B: "r2", C: "r3" })) === '["A","C","B"]');
check("findDeadlock: цепочка без цикла, ожидание свободного ресурса и ожидание собственного ресурса — null", () => findDeadlock({ r1: "A" }, { B: "r1" }) === null && findDeadlock({ r1: "A" }, { B: "r2" }) === null && findDeadlock({ r1: "A" }, { A: "r1" }) === null && findDeadlock({}, {}) === null && findDeadlock({ r1: "A", r2: "B" }, { C: "r1", D: "r2" }) === null);
check("findDeadlock: два независимых цикла — возвращается цикл с наименьшим процессом; хвост, ведущий в цикл, в ответ не входит", () => { const holds = { a: "D", b: "E", c: "B", d: "C", e: "X" }, waits = { D: "b", E: "a", B: "d", C: "c", X: "a" }; return J(findDeadlock(holds, waits)) === '["B","C"]'; });
check("findDeadlock: хвост входит в цикл не с наименьшего процесса — ответ всё равно начинается с наименьшего участника цикла", () => J(findDeadlock({ rB: "B", rC: "C", rD: "D" }, { A: "rD", D: "rB", B: "rC", C: "rD" })) === '["B","C","D"]');
const classicBank = { available: [3, 3, 2], max: [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]], alloc: [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]] };
check("safeSequence: классический пример из пяти процессов и трёх ресурсов → [1, 3, 0, 2, 4] (всегда наименьший подходящий номер)", () => J(safeSequence(classicBank.available, classicBank.max, classicBank.alloc)) === "[1,3,0,2,4]");
check("safeSequence: небезопасное состояние → null; пустой набор процессов → []", () => safeSequence([0], [[2], [2]], [[1], [1]]) === null && J(safeSequence([1, 1], [], [])) === "[]");
check("safeSequence: занято больше максимума или размеры не согласованы → RangeError", () => throwsAs(() => safeSequence([1], [[1]], [[2]]), RangeError) && throwsAs(() => safeSequence([1, 1], [[1]], [[0]]), RangeError) && throwsAs(() => safeSequence([1], [[1], [1]], [[0]]), RangeError));
check("safeSequence: на 200 случайных состояниях результат либо null (перебором нет ни одной безопасной перестановки), либо реально выполнимая последовательность", () => { const r = seeded(33); const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]))); const runs = (order, av, mx, al) => { const w = [...av]; for (const i of order) { if (!mx[i].every((m, j) => m - al[i][j] <= w[j])) return false; al[i].forEach((v, j) => (w[j] += v)); } return true; }; for (let t = 0; t < 200; t++) { const n = 1 + Math.floor(r() * 4), m = 1 + Math.floor(r() * 3), mx = Array.from({ length: n }, () => Array.from({ length: m }, () => Math.floor(r() * 5))), al = mx.map((row) => row.map((v) => Math.floor(r() * (v + 1)))), av = Array.from({ length: m }, () => Math.floor(r() * 4)), res = safeSequence(av, mx, al), exists = perms([...Array(n).keys()]).some((o) => runs(o, av, mx, al)); if (res === null ? exists : !(res.length === n && new Set(res).size === n && runs(res, av, mx, al))) return false; } return true; });

console.log(\`\\nПройдено проверок: \${passed} из \${total}\`);
process.exitCode = passed === total ? 0 : 1;`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 46 из 46`, { filename: "результат node check.mjs solution (Node.js 22.22.0)" }),
    code("text", `Пройдено проверок: 1 из 46`, { filename: "результат node check.mjs starter (заготовка)" }),
    h("Проверка самой проверки: «плохие» варианты"),
    code("text", `b01-fcfs-input-order: Пройдено проверок: 44 из 46
b02-sjf-longest-first: Пройдено проверок: 44 из 46
b03-srtf-by-burst: Пройдено проверок: 43 из 46
b04-rr-preempted-first: Пройдено проверок: 44 из 46
b05-waiting-is-response: Пройдено проверок: 39 из 46
b06-idle-counts-as-switch: Пройдено проверок: 44 из 46
b07-priority-reversed: Пройдено проверок: 44 из 46
b08-no-slice-merge: Пройдено проверок: 37 из 46
b09-lru-no-refresh: Пройдено проверок: 41 из 46
b10-clock-no-ref-on-hit: Пройдено проверок: 45 из 46
b11-opt-nearest: Пройдено проверок: 43 из 46
b12-belady-greater-equal: Пройдено проверок: 44 из 46
b13-translate-wrong-offset: Пройдено проверок: 45 из 46
b14-tlb-fifo: Пройдено проверок: 45 из 46
b15-eat-no-data-access: Пройдено проверок: 45 из 46
b16-deadlock-self-wait: Пройдено проверок: 45 из 46
b17-deadlock-not-rotated: Пройдено проверок: 45 из 46
b18-banker-strict: Пройдено проверок: 44 из 46
b19-banker-highest-first: Пройдено проверок: 45 из 46
b20-fault-index-off-by-one: Пройдено проверок: 45 из 46`, { filename: "результат check.mjs для вариантов с ошибками (из 46)" }),
    warn("Аномалия Билэди — не «баг симулятора»: при `FIFO` добавление памяти на этой последовательности действительно увеличивает число промахов с 9 до 10. Если ваша `LRU` повторяет аномалию, это ошибка (нет обновления порядка при попадании); если `FIFO` её не повторяет — тоже."),
    tip("Когда два алгоритма расходятся на случайных данных, не ищите ошибку «на глаз»: напишите цикл, который перебирает короткие входы (длина до 8, три страницы или три процесса) и печатает **первый** отличающийся. Минимальный контрпример почти всегда виден сразу."),
  ],
};
