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

export const abstractionModularity: Topic = {
  id: "cs.abstraction-modularity",
  slug: "abstraction-modularity",
  domain: "cs",
  module: "software-engineering",
  title: "Абстракция и модульность: сокрытие информации, зацепление, связность и контракты",
  titleEn: "Abstraction and Modularity: Information Hiding, Coupling, Cohesion and Contracts",
  summary:
    "Программа живёт дольше, чем первоначальные решения, и качество структуры определяется тем, сколько кода приходится менять, когда решение меняется. Тема измеряет это: задача Парнаса KWIC в двух разбиениях (при смене способа хранения строк правки требуют 4 модуля из 4 против 1 из 5), граф зависимостей магазина из 12 модулей (49 связей, 2 цикла и 18 нарушений направления против 20 связей, 0 циклов и 0 нарушений; средний «радиус поражения» при изменении модуля 7,5 против 3,0), связность класса по LCOM4 («божественный» класс — 3 независимые части), подмену времени и хранилища (7 подмен глобального `Date`, тест A сломан чужой подменой; 1000 запусков без единой записи на диск; контрактные тесты ловят неверное хранилище — 2 из 5), совместимость API, проверенную компилятором (из 15 изменений 7 совместимы и 8 ломают клиента) и протечки абстракций («число», «строка», «сутки», ORM с 101 запросом вместо 1).",
  minutes: 140,
  prerequisites: ["cs.graphs", "cs.types-memory-models", "cs.compilation-interpretation"],
  tags: ["абстракция", "модуль", "интерфейс", "сокрытие информации", "зацепление", "связность", "инверсия зависимостей", "внедрение зависимостей", "контракт", "SemVer", "протекающая абстракция", "рефакторинг", "SOLID"],
  keyConcepts: [
    { term: "Сокрытие информации", text: "Модуль определяется решением, которое он скрывает. В задаче KWIC при замене способа хранения строк (массивы слов → упакованные строки) в разбиении с общими данными ломаются все 4 модуля (`shift`, `alphabetize`, `output` падают с `TypeError`, `input` создаёт старое представление), а в разбиении с модулем `Lines` правится 1 модуль из 5; результат остаётся верным." },
    { term: "Зацепление и граф зависимостей", text: "Магазин из 12 модулей: «как получилось» — 49 связей, 2 цикла (из 7 и 3 модулей), 18 зависимостей изнутри наружу, средний радиус поражения 7,5 модуля (максимум 11 из 11); со слоями и инверсией — 20 связей, 0 циклов, 0 нарушений, радиус 3,0 (максимум 9). Среднее число зависимостей ядра — 4,25 против 1,50." },
    { term: "Связность", text: "LCOM4 — число компонент графа «методы — общие поля и вызовы». `OrderManager` из 7 методов даёт 3 части (корзина, письма, хранилище); после разделения `Cart`, `Mailer` и `OrderRepository` — по 1; `Stack` — 1." },
    { term: "Зависимости как параметры", text: "Для проверки 7 дней недели с `Date` внутри функции пришлось 7 раз подменять глобальный `Date`; упавший тест оставил подмену включённой, а конкурентный тест B сломал тест A (получил «Без скидки» вместо «Пятница: скидка 10 %»). С параметром — 0 подмен и 0 взаимного влияния. 1000 запусков операции: 1000 записей на диск против 0, все 1000 результатов одинаковы." },
    { term: "Контракты и подстановка", text: "Общие 5 проверок хранилища: `MemoryRepo` — 5 из 5, `FileRepo` — 5 из 5, `BuggyRepo` — 2 из 5 (возвращает `undefined` вместо `null`, не копирует объекты). Реализация, подставляемая вместо другой, обязана пройти тот же контракт." },
    { term: "Совместимость API", text: "Один клиент компилировался против старого и нового описания API: из 15 изменений 7 совместимы (необязательный параметр, расширение типа параметра, сужение результата, новая функция, необязательное поле, добавленное поле результата, метод в интерфейсе, который клиент только использует) и 8 ломают (обязательный параметр, переименование, сужение параметра, расширение результата, обязательное поле, удаление поля, метод в реализуемом интерфейсе, новый вариант объединения)." },
    { term: "Протечки абстракций", text: "`0.1 + 0.2 === 0.3` — `false`; `'😀'.length` — 2; `'é'` и `'é'` в разных нормализациях не равны; сутки при переходе на летнее время — 23 часа; `[10, 9, 1].sort()` — `[1, 10, 9]`. Ленивая загрузка связей в ORM: 101 запрос вместо 1 (или 2 при предзагрузке) — по тексту кода не видно." },
    { term: "Рефакторинг без изменения поведения", text: "Цикл `cart ↔ pricing` разорван выносом общей функции в модуль `items` (связей 2 → 3, цикла нет); «золотой эталон» из 300 сценариев — отпечаток результатов `78629926` до и после, совпало 300 из 300." },
  ],
  sections: [
    section("definition", [
      def("Абстракция", "Упрощённое представление, которое оставляет существенное для решаемой задачи и скрывает остальное: «счёт», «очередь», «файл». Хорошая абстракция позволяет рассуждать о системе, не зная устройства деталей.", "abstraction"),
      def("Модуль", "Единица программы со своим интерфейсом и скрытой реализацией. По Парнасу, модуль выделяют не по шагам обработки, а по **проектному решению, которое может измениться** и поэтому должно быть спрятано внутри.", "module"),
      def("Интерфейс и реализация", "Интерфейс — то, что обещает модуль (имена, типы, поведение); реализация — как он это делает. Клиент зависит только от интерфейса, поэтому реализацию можно менять.", "interface, implementation"),
      def("Сокрытие информации", "Принцип: каждое решение, которое вероятно изменится, скрыто за интерфейсом одного модуля. Измеряется тем, сколько модулей приходится править при изменении решения.", "information hiding"),
      def("Зацепление (coupling)", "Степень зависимости модулей друг от друга: чем меньше связей и чем они «слабее» (только через интерфейс), тем легче менять модули независимо. Метрики: число входящих (Ca) и исходящих (Ce) связей, неустойчивость I = Ce / (Ca + Ce).", "coupling"),
      def("Связность (cohesion)", "Степень, в которой части модуля или класса относятся к одной задаче. Метрика LCOM4 — число компонент связности графа «методы — общие поля»: 1 — связный, больше 1 — склейка независимых частей.", "cohesion"),
      def("Инверсия зависимостей", "Принцип: модули верхнего уровня (правила предметной области) не зависят от деталей (база, сеть, интерфейс); обе стороны зависят от абстракции, которую объявляет ядро. Зависимость адаптера направлена **внутрь**, к ядру.", "dependency inversion"),
      def("Внедрение зависимостей", "Приём: объект получает нужные ему зависимости (часы, хранилище, почтовый шлюз) от вызывающего кода, а не создаёт или не берёт их из глобального состояния. Место, где всё собирается, — корень композиции.", "dependency injection"),
      def("Контракт", "Совокупность обещаний интерфейса: предусловия, постусловия, инварианты. Реализация-замена должна принимать не меньше и обещать не меньше: параметры можно расширять, результаты — сужать (принцип подстановки Лисков).", "contract, Liskov substitution"),
      def("Совместимость API", "Свойство новой версии интерфейса не ломать существующих клиентов. Семантическое версионирование (SemVer) связывает тип изменения с номером версии: несовместимое — мажорная, совместимое добавление — минорная, исправление — патч.", "API compatibility, SemVer"),
      def("Протекающая абстракция", "Абстракция, детали которой «просачиваются» в поведение: удобная модель «число», «строка», «время», «связанные объекты» перестаёт работать в граничных случаях, и пользователь вынужден знать устройство под ней.", "leaky abstraction"),
      def("Золотой эталон (characterization test)", "Тест, фиксирующий **текущее** наблюдаемое поведение на большом наборе входов, чтобы рефакторинг можно было проверять: до и после результаты обязаны совпасть.", "characterization / golden master test"),
    ]),

    section("why", [
      h("Зачем знать, как делить программу на части"),
      p("Корректная программа — только половина дела. Вторая половина — сколько стоит её менять: требования, форматы, базы и библиотеки меняются, а код остаётся. Стоимость изменения определяется тем, сколько модулей знают о том, что изменилось. Абстракция и модульность — способ сделать это число малым."),
      ul(
        "**Стоимость изменений.** При смене способа хранения строк в задаче KWIC правки требуют 4 модуля из 4 в разбиении с общими данными и 1 из 5 в разбиении с сокрытием информации.",
        "**Диагностика структуры.** Метрики на графе зависимостей находят циклы (2 в «спагетти»-варианте магазина), зависимости изнутри наружу (18) и «радиус поражения» (в среднем 7,5 модуля против 3,0) — это не мнение, а числа, которые можно считать в CI.",
        "**Тестируемость.** Код, получающий зависимости параметрами, проверяется быстро и независимо: 1000 запусков без записи на диск, 0 подмен глобального состояния; код с зависимостями внутри — 7 подмен `Date` и взаимное влияние тестов.",
        "**Эволюция библиотек и API.** Из 15 типовых изменений интерфейса 8 ломают клиентов; знание правил (расширять параметры, сужать результаты, не добавлять обязательное) отличает совместимое обновление от аварии.",
        "**Честность перед абстракциями.** Любая абстракция протекает: `0.1 + 0.2`, UTF-16, часовые пояса, запросы к базе под ORM. Знать, где именно, — часть профессионализма.",
      ),
      tip("Три вопроса о любой границе в программе: какое решение она скрывает; что сломается у клиентов, если это решение изменится; кто владеет контрактом и как он проверяется (тестами, типами, версионированием)."),
    ]),

    section("mental-model", [
      h("Модуль скрывает решение, а не шаг алгоритма"),
      diagram(
        `
        по шагам обработки (поток данных)            по решениям, которые могут измениться
        ───────────────────────────────────          ───────────────────────────────────
        ввод → сдвиги → упорядочение → вывод         Lines (как хранятся строки)  ← скрывает представление
        каждый модуль знает общий формат данных      Shift (как строятся сдвиги)  ← скрывает алгоритм
        изменили хранение → правим все 4             Alphabetizer, Output        ← работают через интерфейс Lines
                                                    изменили хранение → правим 1 из 5
        `,
        "Классическое наблюдение Парнаса (1972): разбиение по блок-схеме даёт модули, которые все знают формат данных; разбиение по скрытым решениям даёт модули, изменение которых локально. В замере: 4 из 4 против 1 из 5.",
      ),
      h("Направление зависимостей"),
      diagram(
        `
        «как получилось»                         слои и инверсия
        ui ⇄ cart ⇄ pricing ⇄ db                 ui ───────▶ services ───────▶ ядро (pricing, tax, inventory)
        logger ⇄ config ⇄ utils                                                      ▲
        любой знает любого                       db, payments ─ реализуют интерфейсы ─┘   (зависимость направлена внутрь)
        49 связей, 2 цикла                       20 связей, 0 циклов
        `,
        "Ядро (правила предметной области) не знает ни о базе, ни о сети, ни об интерфейсе: детали зависят от ядра, а не наоборот. Это даёт стабильный центр и взаимозаменяемые края.",
      ),
      h("Вариантность в контрактах"),
      diagram(
        `
        параметры:   можно расширять (принимаем больше)         string → string | number   ✔ совместимо
                     сужать нельзя                             string | number → string   ✘ ломает клиента
        результаты:  можно сужать (обещаем больше)             string | null → string      ✔ совместимо
                     расширять нельзя                          string → string | null      ✘ ломает клиента
        реализуемое: добавлять обязательные члены нельзя        interface Logger + warn()   ✘ ломает реализующих
        `,
        "Замена версии не должна ломать клиентов: она должна принимать не меньше и обещать не меньше. Компилятор проверяет это механически — на 15 изменениях API получено 7 совместимых и 8 ломающих.",
      ),
      insight("Модульность — не про красоту диаграмм, а про **локальность изменений**: хорошая граница — та, при которой типичное изменение требования затрагивает один модуль. Метрики (Ca, Ce, циклы, радиус поражения, LCOM4) измеряют, насколько структура этому способствует."),
    ]),

    section("technical", [
      h("Метрики структуры"),
      table(
        ["Метрика", "Что измеряет", "Хорошо", "Замер в примере"],
        [
          ["Ce (исходящие связи)", "От скольких модулей зависит модуль", "Мало", "Ядро (`pricing`, `tax`, `discounts`, `inventory`): в среднем 4,25 против 1,50"],
          ["Ca (входящие связи)", "Сколько модулей зависят от данного", "Высокое — у стабильных модулей", "`utils` в слоях: Ca = 6, Ce = 0 (неустойчивость 0)"],
          ["Неустойчивость I = Ce / (Ca + Ce)", "Насколько модуль подвержен чужим изменениям", "Низкая у ядра, высокая у краёв", "`ui`, `db`, `payments` — 1,00; `config`, `utils` — 0,00"],
          ["Циклы зависимостей", "Модули, которые нельзя понять и менять по отдельности", "0", "2 цикла (7 и 3 модуля) против 0"],
          ["Нарушения направления", "Зависимости изнутри наружу", "0", "18 против 0"],
          ["Радиус поражения", "Сколько модулей транзитивно зависят от данного", "Мал, особенно у часто меняющихся", "Среднее 7,5 против 3,0; максимум 11 против 9"],
          ["LCOM4", "Число независимых частей класса", "1", "`OrderManager` — 3, после разделения — 1, 1, 1"],
        ],
        "Метрики зацепления и связности (граф зависимостей магазина из 12 модулей)",
      ),
      h("Правила совместимости интерфейса (проверены компилятором TypeScript 5.9)"),
      table(
        ["Изменение API", "Клиент собирается?", "Код ошибки"],
        [
          ["Добавлен необязательный параметр", "Да", "—"],
          ["Добавлен обязательный параметр", "Нет", "TS2554"],
          ["Функция переименована", "Нет", "TS2305"],
          ["Тип параметра расширен: `string` → `string | number`", "Да", "—"],
          ["Тип параметра сужен: `string | number` → `string`", "Нет", "TS2345"],
          ["Тип результата расширен: `string` → `string | null`", "Нет", "TS2531"],
          ["Тип результата сужен: `string | null` → `string`", "Да", "—"],
          ["Добавлена новая функция", "Да", "—"],
          ["Добавлено обязательное поле в объект параметров", "Нет", "TS2345"],
          ["Добавлено необязательное поле в объект параметров", "Да", "—"],
          ["Добавлено поле в результат-объект", "Да", "—"],
          ["Удалено поле из результата-объекта", "Нет", "TS2339"],
          ["Добавлен метод в интерфейс, который клиент **реализует**", "Нет", "TS2741"],
          ["Добавлен метод в интерфейс, который клиент только **использует**", "Да", "—"],
          ["Добавлен вариант в объединение, которое перебирает клиент", "Нет", "TS2322"],
        ],
        "Совместимость изменений API",
      ),
      h("Принципы проектирования и что они значат на практике"),
      table(
        ["Принцип", "Содержание", "Как проверить"],
        [
          ["Единственная причина изменения (SRP)", "Модуль или класс меняется по одной причине", "LCOM4 = 1; изменение формата письма правит один класс"],
          ["Открытость и закрытость (OCP)", "Расширять без правки существующего кода", "Новый вариант добавляется новым модулем; перебор вариантов проверяется компилятором (`never`)"],
          ["Подстановка Лисков (LSP)", "Реализация-замена не нарушает контракт", "Один набор контрактных тестов для всех реализаций"],
          ["Разделение интерфейсов (ISP)", "Клиент не зависит от методов, которые не использует", "Узкие интерфейсы; добавление метода не ломает только-использующих"],
          ["Инверсия зависимостей (DIP)", "Ядро объявляет интерфейс, детали реализуют его", "0 зависимостей изнутри наружу"],
        ],
        "Принципы SOLID как проверяемые утверждения",
      ),
    ]),

    section("syntax", [
      annotated(
        "ts",
        `
          // ядро объявляет, что ему нужно (порты)
          export interface Clock { now(): Date }
          export interface OrderRepo {
            save(o: Order): void;
            find(id: number): Order | null;      // контракт: null, а не undefined
          }

          export class OrderService {
            constructor(private readonly deps: { repo: OrderRepo; clock: Clock }) {}
            place(o: Order): Order {
              const stamped = { ...o, placedAt: this.deps.clock.now().toISOString() };
              this.deps.repo.save(stamped);
              return stamped;
            }
          }

          // корень композиции: единственное место, где выбираются реализации
          const service = new OrderService({ repo: new PostgresRepo(), clock: { now: () => new Date() } });
        `,
        [
          { line: 2, text: "Порт — интерфейс, объявленный **ядром**. Ядро не знает, что за ним стоит: часы системы или фиксированная дата в тесте." },
          { line: 5, text: "Контракт описывается типами и комментарием; поведение (например, «не найдено — `null`») проверяется контрактными тестами для всех реализаций." },
          { line: 9, text: "Зависимости приходят через конструктор: класс не создаёт их и не берёт из глобального состояния (`Date`, синглтон, `process.env`)." },
          { line: 11, text: "Время берётся из порта, а не из `new Date()`: тест подставляет `{ now: () => new Date('2024-01-12') }` без подмены глобальных объектов." },
          { line: 18, text: "Корень композиции — единственное место, знающее конкретные классы (`PostgresRepo`); адаптеры зависят от ядра, ядро — ни от чего внешнего." },
        ],
        "Порты, внедрение зависимостей и корень композиции",
      ),
      code(
        "json",
        `
          {
            "name": "shop-lib",
            "version": "2.3.1",
            "exports": {
              ".": "./dist/index.js",
              "./pricing": "./dist/pricing.js"
            }
          }
        `,
        { filename: "package.json: публичный интерфейс пакета" },
      ),
    ]),

    section("minimal-example", [
      h("Сокрытие информации: задача KWIC в двух разбиениях"),
      code("js", `// Сокрытие информации (Парнас, 1972): задача KWIC — все циклические сдвиги строк, упорядоченные по алфавиту.
// Два разбиения на модули; затем меняется решение «как хранить строки» — какие модули придётся править?
const TITLES = \`The Art of Computer Programming
Structure and Interpretation of Computer Programs
Compilers Principles Techniques and Tools
Types and Programming Languages\`;

// ───── Вариант A: общие данные. Каждый модуль знает, что строки — массив массивов слов ─────
const A = {
  input(text) { return text.trim().split("\\n").map((l) => l.trim().split(/\\s+/)); },
  shift(lines) { const out = []; lines.forEach((w, i) => w.forEach((_, k) => out.push([i, k]))); return out; },
  alphabetize(lines, shifts) {
    const key = ([i, k]) => lines[i].slice(k).concat(lines[i].slice(0, k)).join(" ").toLowerCase();
    return [...shifts].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
  },
  output(lines, shifts) { return shifts.map(([i, k]) => lines[i].slice(k).concat(lines[i].slice(0, k)).join(" ")); },
};

// ───── Вариант B: сокрытие информации. Представление строк знает только модуль Lines ─────
function makeLines(representation) {
  const data = [];
  if (representation === "arrays") return {                                    // строки — массивы слов
    add(text) { data.push(text.trim().split(/\\s+/)); },
    count() { return data.length; },
    wordCount(i) { return data[i].length; },
    word(i, k) { return data[i][k]; },
  };
  return {                                                                      // строки — одна упакованная строка со словами через пробел
    add(text) { data.push(text.trim().replace(/\\s+/g, " ")); },
    count() { return data.length; },
    wordCount(i) { return data[i].split(" ").length; },
    word(i, k) { return data[i].split(" ")[k]; },
  };
}
const B = {
  input(L, text) { for (const line of text.trim().split("\\n")) L.add(line); },
  shift(L) { const out = []; for (let i = 0; i < L.count(); i++) for (let k = 0; k < L.wordCount(i); k++) out.push([i, k]); return out; },
  alphabetize(L, shifts) {
    const phrase = ([i, k]) => { const n = L.wordCount(i), w = []; for (let j = 0; j < n; j++) w.push(L.word(i, (k + j) % n)); return w.join(" "); };
    return [...shifts].sort((a, b) => (phrase(a).toLowerCase() < phrase(b).toLowerCase() ? -1 : phrase(a).toLowerCase() > phrase(b).toLowerCase() ? 1 : 0));
  },
  output(L, shifts) { return shifts.map(([i, k]) => { const n = L.wordCount(i), w = []; for (let j = 0; j < n; j++) w.push(L.word(i, (k + j) % n)); return w.join(" "); }); },
};

const pipelineA = (lines) => { const sh = A.shift(lines); return A.output(lines, A.alphabetize(lines, sh)); };
const pipelineB = (L) => { const sh = B.shift(L); return B.output(L, B.alphabetize(L, sh)); };
const outA = pipelineA(A.input(TITLES));
const LA = makeLines("arrays"); B.input(LA, TITLES); const outB = pipelineB(LA);
console.log("1) обе реализации дают один и тот же результат:", JSON.stringify(outA) === JSON.stringify(outB) ? "да" : "нет", "; строк в результате:", outA.length, "(сумма слов в заголовках)");
console.log("   первые строки:", outA.slice(0, 3).map((x) => "«" + x + "»").join(", "));

console.log("\\n2) меняется решение о хранении: строки теперь — упакованные строки «слово слово …» вместо массивов слов");
const packed = TITLES.trim().split("\\n").map((l) => l.trim().replace(/\\s+/g, " "));                 // новое представление, созданное новым модулем ввода
const shiftsOK = A.shift(A.input(TITLES));
const attempt = (name, f, expected) => { try { const r = f(); return name.padEnd(12) + (JSON.stringify(r) === JSON.stringify(expected) ? "результат верный" : "ответ неверный: " + r.length + " элементов вместо " + expected.length); } catch (e) { return name.padEnd(12) + "ломается: " + e.constructor.name + " — " + e.message.split("\\n")[0]; } };
console.log("   вариант A: модули shift, alphabetize, output без изменений получают упакованные строки:");
const results = [attempt("shift", () => A.shift(packed), shiftsOK), attempt("alphabetize", () => A.alphabetize(packed, shiftsOK), A.alphabetize(A.input(TITLES), shiftsOK)), attempt("output", () => A.output(packed, shiftsOK), outA)];
results.forEach((r) => console.log("     " + r));
console.log("     input       строит массивы слов, то есть создаёт старое представление: его тоже нужно переписать");
const LB = makeLines("packed"); B.input(LB, TITLES); const outB2 = pipelineB(LB);
console.log("   вариант B: заменён только модуль Lines (makeLines('packed')); input, shift, alphabetize, output не менялись:");
console.log("     результат верный:", JSON.stringify(outB2) === JSON.stringify(outA) ? "да" : "нет");

const brokenA = results.filter((r) => !r.includes("результат верный")).length + 1;
console.log("\\n3) итог: изменение решения о хранении требует правки модулей — в A:", brokenA, "из 4 (ввод, сдвиги, упорядочение, вывод), в B: 1 из 5 (только Lines)");
console.log("   разница не в объёме кода, а в том, сколько модулей знают, как устроены данные: в A — все, в B — один");`, { filename: "02-information-hiding.mjs", collapsed: true }),
      code("text", `1) обе реализации дают один и тот же результат: да ; строк в результате: 20 (сумма слов в заголовках)
   первые строки: «and Interpretation of Computer Programs Structure», «and Programming Languages Types», «and Tools Compilers Principles Techniques»

2) меняется решение о хранении: строки теперь — упакованные строки «слово слово …» вместо массивов слов
   вариант A: модули shift, alphabetize, output без изменений получают упакованные строки:
     shift       ломается: TypeError — w.forEach is not a function
     alphabetize ломается: TypeError — lines[i].slice(...).concat(...).join is not a function
     output      ломается: TypeError — lines[i].slice(...).concat(...).join is not a function
     input       строит массивы слов, то есть создаёт старое представление: его тоже нужно переписать
   вариант B: заменён только модуль Lines (makeLines('packed')); input, shift, alphabetize, output не менялись:
     результат верный: да

3) итог: изменение решения о хранении требует правки модулей — в A: 4 из 4 (ввод, сдвиги, упорядочение, вывод), в B: 1 из 5 (только Lines)
   разница не в объёме кода, а в том, сколько модулей знают, как устроены данные: в A — все, в B — один`, { filename: "два разбиения на модули и замена способа хранения строк" }),
      ul(
        "**Задача.** По списку заголовков получить все циклические сдвиги слов каждого заголовка, упорядоченные по алфавиту (20 сдвигов для четырёх заголовков). Обе реализации дают одинаковый результат.",
        "**Разбиение A (общие данные):** каждый модуль (`input`, `shift`, `alphabetize`, `output`) знает, что строки — массив массивов слов. Решение «хранить по-другому» требует править **все 4**: `shift` падает с `w.forEach is not a function`, `alphabetize` и `output` — с `...join is not a function`, а `input` создаёт старое представление.",
        "**Разбиение B (сокрытие информации):** представление знает только модуль `Lines` (`add`, `count`, `wordCount`, `word`); остальные работают через интерфейс. Замена `makeLines('arrays')` на `makeLines('packed')` — единственная правка; результат верный без изменений остальных модулей. **1 модуль из 5** против 4 из 4.",
        "**Вывод Парнаса:** критерий разбиения — не шаги алгоритма, а решения, которые могут измениться. Разница не в объёме кода, а в числе модулей, знающих устройство данных.",
      ),
      h("Связность класса: LCOM4"),
      code("js", `// Связность класса: LCOM4 — число компонент связности графа «методы ↔ используемые поля и вызовы друг друга»
// 1 — класс связный (все методы работают над общими данными); больше 1 — класс склеен из нескольких независимых частей
function lcom4(Class) {
  const proto = Class.prototype, methods = Object.getOwnPropertyNames(proto).filter((n) => n !== "constructor" && typeof proto[n] === "function");
  const uses = {}, calls = {};
  for (const m of methods) {
    const src = String(proto[m]);
    uses[m] = new Set([...src.matchAll(/this\\.(\\w+)(?!\\w|\\s*\\()/g)].map((x) => x[1]).filter((f) => !methods.includes(f)));
    calls[m] = new Set([...src.matchAll(/this\\.(\\w+)\\s*\\(/g)].map((x) => x[1]).filter((f) => methods.includes(f)));
  }
  const parent = Object.fromEntries(methods.map((m) => [m, m])), find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x]))), union = (a, b) => { parent[find(a)] = find(b); };
  for (const a of methods) { for (const b of calls[a]) union(a, b); for (const b of methods) if (a !== b && [...uses[a]].some((f) => uses[b].has(f))) union(a, b); }
  const groups = {}; for (const m of methods) (groups[find(m)] ??= []).push(m);
  return { methods, parts: Object.values(groups), fields: [...new Set(methods.flatMap((m) => [...uses[m]]))].sort() };
}
class OrderManager {                                    // «божественный объект»: корзина, письма и хранилище в одном классе
  constructor() { this.items = []; this.smtp = null; this.template = "Заказ {id}"; this.db = null; }
  addItem(item) { this.items.push(item); }
  removeItem(name) { this.items = this.items.filter((i) => i.name !== name); }
  total() { return this.items.reduce((s, i) => s + i.price * i.qty, 0); }
  renderEmail(id) { return this.template.replace("{id}", id); }
  sendConfirmation(id) { return this.smtp.send(this.renderEmail(id)); }
  save(order) { return this.db.insert(order); }
  load(id) { return this.db.find(id); }
}
class Cart { constructor() { this.items = []; } add(i) { this.items.push(i); } remove(n) { this.items = this.items.filter((i) => i.name !== n); } total() { return this.items.reduce((s, i) => s + i.price * i.qty, 0); } }
class Mailer { constructor() { this.smtp = null; this.template = "Заказ {id}"; } render(id) { return this.template.replace("{id}", id); } send(id) { return this.smtp.send(this.render(id)); } }
class OrderRepository { constructor() { this.db = null; } save(order) { return this.db.insert(order); } load(id) { return this.db.find(id); } }
class Stack { constructor() { this.items = []; } push(x) { this.items.push(x); } pop() { return this.items.pop(); } peek() { return this.items[this.items.length - 1]; } size() { return this.items.length; } }
class Report { constructor() { this.rows = []; this.format = "csv"; this.out = null; } addRow(r) { this.rows.push(r); } count() { return this.rows.length; } setFormat(f) { this.format = f; } write(s) { this.out = s; } isCsv() { return this.format === "csv"; } }
console.log("класс                методов  LCOM4  части (методы, работающие над общими данными)");
for (const C of [OrderManager, Cart, Mailer, OrderRepository, Stack, Report]) {
  const r = lcom4(C);
  console.log(C.name.padEnd(21) + String(r.methods.length).padEnd(9) + String(r.parts.length).padEnd(7) + r.parts.map((p) => "{" + p.join(", ") + "}").join(" "));
}
console.log("\\nOrderManager склеен из трёх независимых частей — корзины (поле items), писем (smtp, template) и хранилища (db): LCOM4 = 3.");
console.log("После разделения на Cart, Mailer и OrderRepository у каждого класса LCOM4 = 1; общий список изменений теперь делится по причинам:");
console.log("   изменился формат письма → правится только Mailer; сменилась база → только OrderRepository; изменился расчёт суммы → только Cart");
const ok = [Cart, Mailer, OrderRepository, Stack].every((C) => lcom4(C).parts.length === 1);
console.log("все четыре связных класса дают LCOM4 = 1:", ok ? "да" : "нет", "; Report (LCOM4 = " + lcom4(Report).parts.length + ") — кандидат на разделение: строки, формат и вывод — три независимые группы методов");`, { filename: "03-cohesion-lcom.mjs", collapsed: true }),
      code("text", `класс                методов  LCOM4  части (методы, работающие над общими данными)
OrderManager         7        3      {addItem, removeItem, total} {renderEmail, sendConfirmation} {save, load}
Cart                 3        1      {add, remove, total}
Mailer               2        1      {render, send}
OrderRepository      2        1      {save, load}
Stack                4        1      {push, pop, peek, size}
Report               5        3      {addRow, count} {setFormat, isCsv} {write}

OrderManager склеен из трёх независимых частей — корзины (поле items), писем (smtp, template) и хранилища (db): LCOM4 = 3.
После разделения на Cart, Mailer и OrderRepository у каждого класса LCOM4 = 1; общий список изменений теперь делится по причинам:
   изменился формат письма → правится только Mailer; сменилась база → только OrderRepository; изменился расчёт суммы → только Cart
все четыре связных класса дают LCOM4 = 1: да ; Report (LCOM4 = 3) — кандидат на разделение: строки, формат и вывод — три независимые группы методов`, { filename: "LCOM4: «божественный» класс и его части" }),
      ul(
        "`OrderManager` (7 методов: корзина, письма, хранилище) даёт **LCOM4 = 3**: части `{addItem, removeItem, total}` (поле `items`), `{renderEmail, sendConfirmation}` (`smtp`, `template`) и `{save, load}` (`db`) не имеют общих данных и не вызывают друг друга.",
        "После разделения `Cart`, `Mailer`, `OrderRepository` и вспомогательный `Stack` дают **LCOM4 = 1**. Практический смысл: изменение формата письма правит только `Mailer`, смена базы — только `OrderRepository`, расчёт суммы — только `Cart`.",
        "`Report` с методами для строк, формата и вывода — LCOM4 = 3: три независимые группы методов, кандидат на разделение.",
      ),
    ]),

    section("detailed-example", [
      h("Граф зависимостей: циклы, направление, радиус поражения"),
      code("js", `// Метрики зацепления на графе зависимостей: Ca, Ce, неустойчивость, циклы, нарушения слоёв, «радиус поражения» при изменении модуля
// Один и тот же магазин из 12 модулей в двух вариантах: «как получилось» и со слоями и инверсией зависимостей
const RANK = { ui: 3, db: 3, payments: 3, logger: 3, config: 0, cart: 2, orders: 2, pricing: 1, tax: 1, discounts: 1, inventory: 1, utils: 0 };   // 3 — внешний слой (интерфейс, инфраструктура), 0 — самое внутреннее (чистые данные и помощники)
const TANGLED = {
  ui: ["cart", "orders", "pricing", "utils", "logger", "config"],
  cart: ["pricing", "inventory", "db", "ui", "utils", "logger"],
  orders: ["cart", "payments", "db", "inventory", "logger", "utils", "ui"],
  pricing: ["tax", "discounts", "db", "config", "utils", "cart"],
  tax: ["config", "utils", "db"],
  discounts: ["db", "cart", "utils", "logger"],
  inventory: ["db", "orders", "logger", "utils"],
  db: ["config", "logger", "utils"],
  payments: ["config", "logger", "db", "orders"],
  logger: ["config", "utils"],
  config: ["logger", "utils"],
  utils: ["config", "logger"],
};
const LAYERED = {
  ui: ["cart", "orders"],
  cart: ["pricing", "inventory", "utils"],
  orders: ["cart", "pricing", "inventory", "utils"],            // платёжный шлюз — интерфейс, объявленный в orders
  pricing: ["tax", "discounts", "utils"],
  tax: ["utils"],
  discounts: ["utils"],
  inventory: ["utils"],                                          // интерфейс хранилища объявлен здесь
  db: ["inventory", "config"],                                   // адаптер реализует интерфейс из ядра: зависимость направлена внутрь
  payments: ["orders", "config"],
  logger: ["config"],
  config: [],
  utils: [],
};
function analyse(g) {
  const names = Object.keys(g), Ce = {}, Ca = Object.fromEntries(names.map((n) => [n, 0]));
  let edges = 0;
  for (const n of names) { Ce[n] = g[n].length; edges += g[n].length; for (const m of g[n]) Ca[m]++; }
  // сильно связные компоненты (алгоритм Тарьяна): циклы зависимостей
  let idx = 0; const st = [], on = new Set(), index = {}, low = {}, comps = [];
  const dfs = (v) => { index[v] = low[v] = idx++; st.push(v); on.add(v); for (const w of g[v]) { if (!(w in index)) { dfs(w); low[v] = Math.min(low[v], low[w]); } else if (on.has(w)) low[v] = Math.min(low[v], index[w]); }
    if (low[v] === index[v]) { const c = []; let w; do { w = st.pop(); on.delete(w); c.push(w); } while (w !== v); comps.push(c); } };
  for (const n of names) if (!(n in index)) dfs(n);
  const cycles = comps.filter((c) => c.length > 1).sort((a, b) => b.length - a.length);
  // «радиус поражения»: сколько модулей транзитивно зависят от данного (они могут сломаться при его изменении)
  const rev = Object.fromEntries(names.map((n) => [n, []])); for (const n of names) for (const m of g[n]) rev[m].push(n);
  const blast = {}; for (const n of names) { const seen = new Set(), s = [n]; while (s.length) for (const d of rev[s.pop()]) if (!seen.has(d) && d !== n) { seen.add(d); s.push(d); } blast[n] = seen.size; }
  const violations = []; for (const n of names) for (const m of g[n]) if (RANK[m] > RANK[n]) violations.push(n + "→" + m);
  return { names, Ca, Ce, edges, cycles, blast, violations };
}
const show = (title, g) => {
  const r = analyse(g), avg = Object.values(r.blast).reduce((a, b) => a + b, 0) / r.names.length;
  console.log(title);
  console.log("   модуль      Ca  Ce  неустойчивость  радиус поражения");
  for (const n of r.names) { const t = r.Ca[n] + r.Ce[n]; console.log("   " + n.padEnd(11) + String(r.Ca[n]).padStart(2) + "  " + String(r.Ce[n]).padStart(2) + "  " + (t ? (r.Ce[n] / t).toFixed(2) : "—").padStart(14) + "  " + String(r.blast[n]).padStart(16)); }
  console.log("   рёбер:", r.edges, "; циклов зависимостей (компонент связности из 2+ модулей):", r.cycles.length, r.cycles.length ? "(размеры " + r.cycles.map((c) => c.length).join(", ") + "; в первом: " + r.cycles[0].sort().join(", ") + ")" : "");
  console.log("   зависимостей изнутри наружу (нарушение направления внутрь):", r.violations.length, r.violations.length ? "→ " + r.violations.join(", ") : "");
  console.log("   радиус поражения: в среднем", avg.toFixed(1).replace(".", ","), "модуля, максимум", Math.max(...Object.values(r.blast)), "из", r.names.length - 1);
  return { r, avg };
};
console.log("Ca — сколько модулей зависят от данного (входящие), Ce — от скольких зависит он (исходящие), неустойчивость I = Ce / (Ca + Ce)\\n");
const a = show("A) «как получилось»: модули обращаются друг к другу напрямую", TANGLED); console.log();
const b = show("B) слои и инверсия зависимостей: ядро не знает о базе, платежах и интерфейсе", LAYERED);
console.log("\\nсравнение: рёбер", a.r.edges, "→", b.r.edges, "; циклов", a.r.cycles.length, "→", b.r.cycles.length, "; нарушений направления", a.r.violations.length, "→", b.r.violations.length, "; средний радиус поражения", a.avg.toFixed(1).replace(".", ","), "→", b.avg.toFixed(1).replace(".", ","));
const core = ["pricing", "tax", "discounts", "inventory"];
console.log("модуль ядра \`pricing\` (правила цен): изменение затрагивает", a.r.blast.pricing, "модулей в A и", b.r.blast.pricing, "в B; зависит от", a.r.Ce.pricing, "и", b.r.Ce.pricing, "модулей соответственно");
console.log("среднее число зависимостей ядра (" + core.join(", ") + "): A", (core.reduce((s, n) => s + a.r.Ce[n], 0) / core.length).toFixed(2).replace(".", ","), ", B", (core.reduce((s, n) => s + b.r.Ce[n], 0) / core.length).toFixed(2).replace(".", ","));`, { filename: "01-dependency-metrics.mjs", collapsed: true }),
      code("text", `Ca — сколько модулей зависят от данного (входящие), Ce — от скольких зависит он (исходящие), неустойчивость I = Ce / (Ca + Ce)

A) «как получилось»: модули обращаются друг к другу напрямую
   модуль      Ca  Ce  неустойчивость  радиус поражения
   ui          2   6            0.75                 6
   cart        4   6            0.60                 6
   orders      3   7            0.70                 6
   pricing     2   6            0.75                 6
   tax         1   3            0.75                 7
   discounts   1   4            0.80                 6
   inventory   2   4            0.67                 6
   db          7   3            0.30                 8
   payments    1   4            0.80                 6
   logger      9   2            0.18                11
   config      7   2            0.22                11
   utils      10   2            0.17                11
   рёбер: 49 ; циклов зависимостей (компонент связности из 2+ модулей): 2 (размеры 7, 3; в первом: cart, discounts, inventory, orders, payments, pricing, ui)
   зависимостей изнутри наружу (нарушение направления внутрь): 18 → cart→db, cart→ui, cart→logger, orders→payments, orders→db, orders→logger, orders→ui, pricing→db, pricing→cart, tax→db, discounts→db, discounts→cart, discounts→logger, inventory→db, inventory→orders, inventory→logger, config→logger, utils→logger
   радиус поражения: в среднем 7,5 модуля, максимум 11 из 11

B) слои и инверсия зависимостей: ядро не знает о базе, платежах и интерфейсе
   модуль      Ca  Ce  неустойчивость  радиус поражения
   ui          0   2            1.00                 0
   cart        2   3            0.60                 3
   orders      2   4            0.67                 2
   pricing     2   3            0.60                 4
   tax         1   1            0.50                 5
   discounts   1   1            0.50                 5
   inventory   3   1            0.25                 5
   db          0   2            1.00                 0
   payments    0   2            1.00                 0
   logger      0   1            1.00                 0
   config      3   0            0.00                 3
   utils       6   0            0.00                 9
   рёбер: 20 ; циклов зависимостей (компонент связности из 2+ модулей): 0 
   зависимостей изнутри наружу (нарушение направления внутрь): 0 
   радиус поражения: в среднем 3,0 модуля, максимум 9 из 11

сравнение: рёбер 49 → 20 ; циклов 2 → 0 ; нарушений направления 18 → 0 ; средний радиус поражения 7,5 → 3,0
модуль ядра \`pricing\` (правила цен): изменение затрагивает 6 модулей в A и 4 в B; зависит от 6 и 3 модулей соответственно
среднее число зависимостей ядра (pricing, tax, discounts, inventory): A 4,25 , B 1,50`, { filename: "магазин из 12 модулей: «как получилось» и со слоями" }),
      ul(
        "**«Как получилось»:** 49 связей; 2 цикла зависимостей (компоненты из 7 модулей — `cart`, `discounts`, `inventory`, `orders`, `payments`, `pricing`, `ui` — и из 3); **18** зависимостей изнутри наружу (например, `pricing → db`, `inventory → orders`, `utils → logger`); радиус поражения при изменении модуля — в среднем **7,5** из 11 возможных, максимум 11 (изменение `logger`, `config` или `utils` затрагивает всех).",
        "**Слои и инверсия:** 20 связей; **0 циклов**; **0** нарушений; радиус в среднем **3,0**, у `ui`, `db`, `payments`, `logger` — 0 (от них никто не зависит). Ядро не знает о `db`: адаптер `db → inventory` реализует интерфейс, объявленный в ядре, и зависимость направлена внутрь.",
        "**Ядро становится стабильным:** среднее число зависимостей у `pricing`, `tax`, `discounts`, `inventory` — **1,50** против 4,25; изменение `pricing` затрагивает 4 модуля вместо 6.",
        "**Оговорка:** `utils` в слоях имеет радиус 9 (от него зависят почти все) — но он стабилен: Ce = 0, неустойчивость 0. Общие помощники допустимы, если они малы, стабильны и ни от чего не зависят; опасны не «много зависимых», а «много зависимых и сам зависит от других» (в «спагетти»-варианте `utils → config, logger` замыкает цикл).",
      ),
      h("Зависимости как параметры: тестируемость и подстановка"),
      code("js", `// Зависимости как параметры: тестируемость, глобальное состояние и подстановка реализаций (контрактные тесты)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const RealDate = Date;
const DAYS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
const withFakeNow = (iso) => { globalThis.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [iso])); } }; };   // подмена глобального времени
const restore = () => { globalThis.Date = RealDate; };

// ───── 1. Время внутри функции и время как параметр ─────
const bannerHidden = () => (new Date().getDay() === 5 ? "Пятница: скидка 10 %" : "Без скидки");   // обращение к глобальным часам
const bannerPure = (date) => (date.getDay() === 5 ? "Пятница: скидка 10 %" : "Без скидки");        // дата — параметр
const week = [...Array(7)].map((_, i) => new RealDate(Date.UTC(2024, 0, 7 + i, 12)));              // 7 января 2024 — воскресенье; полдень UTC, чтобы пояс не влиял на день
process.env.TZ = "UTC";
let patched = 0;
const hiddenResults = week.map((d) => { withFakeNow(d.toISOString()); patched++; const r = bannerHidden(); restore(); return r; });
const pureResults = week.map((d) => bannerPure(d));
console.log("1) проверка поведения по дням недели (7 проверок):");
console.log("   время внутри функции: потребовалось подменить глобальный Date", patched, "раз(а); результаты совпадают с параметрической версией:", JSON.stringify(hiddenResults) === JSON.stringify(pureResults) ? "да" : "нет");
console.log("   время как параметр: подмен глобального состояния 0; скидка в день:", DAYS[pureResults.findIndex((r) => r.startsWith("Пятница"))]);
withFakeNow(week[5].toISOString());
try { bannerHidden(); throw new Error("упал тест до restore()"); } catch { /* тест упал, restore() не выполнен */ }
console.log("   тест упал до восстановления: Date остался подменённым:", new Date().getDay() === 5 ? "да (любой следующий код видит пятницу)" : "нет");
restore();
const a = async () => { withFakeNow(week[5].toISOString()); await null; await null; return bannerHidden(); };                        // «тест A»: ждёт пятницу, но читает время позже
const b = async () => { await null; withFakeNow(week[1].toISOString()); return bannerHidden(); };                               // «тест B»: подменяет время на понедельник между шагами A
const [ra, rb] = await Promise.all([a(), b()]); restore();
console.log("   два теста с подменой выполняются конкурентно: A ждёт «Пятница: скидка 10 %», получил «" + ra + "»; B ждёт «Без скидки», получил «" + rb + "» → тест A сломан чужой подменой:", ra.startsWith("Пятница") ? "нет" : "да");
const [pa, pb] = await Promise.all([(async () => { await null; return bannerPure(week[5]); })(), (async () => { await null; return bannerPure(week[1]); })()]);
console.log("   то же с параметром: A получил «" + pa + "», B получил «" + pb + "» — влияния нет");

// ───── 2. Порты и адаптеры: сервис получает зависимости ─────
class OrderService {
  constructor({ repo, mailer, clock }) { this.repo = repo; this.mailer = mailer; this.clock = clock; }
  place(order) {
    const stamped = { ...order, placedAt: this.clock.now(), total: order.items.reduce((s, i) => s + i.price * i.qty, 0) };
    this.repo.save(stamped); this.mailer.send(order.email, \`Заказ \${order.id}: \${stamped.total}\`); return stamped;
  }
}
const logFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "svc-")), "orders.log");
let fileWrites = 0; const realAppend = fs.appendFileSync; fs.appendFileSync = (...args) => { fileWrites++; return realAppend(...args); };
const hardcodedPlace = (order) => { const total = order.items.reduce((s, i) => s + i.price * i.qty, 0); fs.appendFileSync(logFile, JSON.stringify({ ...order, placedAt: new RealDate().toISOString(), total }) + "\\n"); return total; };
const order = { id: 7, email: "a@example.com", items: [{ price: 120, qty: 2 }, { price: 50, qty: 1 }] };
for (let i = 0; i < 1000; i++) hardcodedPlace(order);
const hardcodedWrites = fileWrites; fileWrites = 0;
const saved = [], sent = []; const fakeClock = { now: () => "2024-01-12T12:00:00Z" };
const svc = new OrderService({ repo: { save: (o) => saved.push(o) }, mailer: { send: (to, text) => sent.push([to, text]) }, clock: fakeClock });
let same = true, first; for (let i = 0; i < 1000; i++) { const r = JSON.stringify(svc.place(order)); first ??= r; if (r !== first) same = false; }
console.log("\\n2) 1000 запусков одной операции «разместить заказ»:");
console.log("   зависимости внутри функции: записей в файл на диске —", hardcodedWrites, "; результат зависит от текущего времени и состояния диска");
console.log("   зависимости переданы: записей на диск —", fileWrites, "; сохранено заказов в памяти —", saved.length, ", отправлено писем —", sent.length, "; все 1000 результатов одинаковы:", same ? "да" : "нет", "; итог:", sent[0][1]);
fs.appendFileSync = realAppend; fs.rmSync(path.dirname(logFile), { recursive: true });

// ───── 3. Подстановка реализаций и контрактные тесты ─────
class MemoryRepo { #m = new Map(); save(o) { this.#m.set(o.id, structuredClone(o)); } find(id) { return this.#m.has(id) ? structuredClone(this.#m.get(id)) : null; } count() { return this.#m.size; } }
class FileRepo { constructor() { this.f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "repo-")), "db.json"); fs.writeFileSync(this.f, "{}"); }
  #r() { return JSON.parse(fs.readFileSync(this.f, "utf8")); } save(o) { const d = this.#r(); d[o.id] = o; fs.writeFileSync(this.f, JSON.stringify(d)); } find(id) { return this.#r()[id] ?? null; } count() { return Object.keys(this.#r()).length; } cleanup() { fs.rmSync(path.dirname(this.f), { recursive: true }); } }
class BuggyRepo { #m = new Map(); save(o) { this.#m.set(o.id, o); } find(id) { return this.#m.get(id); } count() { return this.#m.size; } }    // не копирует объекты и возвращает undefined
const contract = (make) => {
  const tests = {
    "найденный объект равен сохранённому": (r) => { r.save({ id: 1, v: "a" }); return JSON.stringify(r.find(1)) === JSON.stringify({ id: 1, v: "a" }); },
    "отсутствующий объект — null, а не undefined": (r) => r.find(99) === null,
    "повторное сохранение заменяет запись": (r) => { r.save({ id: 2, v: "a" }); r.save({ id: 2, v: "b" }); return r.find(2).v === "b" && r.count() === 1; },
    "изменение исходного объекта после сохранения не меняет хранилище": (r) => { const o = { id: 3, v: "a" }; r.save(o); o.v = "changed"; return r.find(3).v === "a"; },
    "изменение найденного объекта не меняет хранилище": (r) => { r.save({ id: 4, v: "a" }); const x = r.find(4); x.v = "changed"; return r.find(4).v === "a"; },
  };
  const failed = []; let passed = 0;
  for (const [name, t] of Object.entries(tests)) { const r = make(); let ok; try { ok = t(r); } catch { ok = false; } r.cleanup?.(); if (ok) passed++; else failed.push(name); }
  return { passed, total: Object.keys(tests).length, failed };
};
console.log("\\n3) одни и те же контрактные тесты (5 проверок) для трёх реализаций хранилища:");
for (const [name, make] of [["MemoryRepo", () => new MemoryRepo()], ["FileRepo", () => new FileRepo()], ["BuggyRepo", () => new BuggyRepo()]]) {
  const r = contract(make);
  console.log("   " + name.padEnd(11) + "прошло " + r.passed + " из " + r.total + (r.failed.length ? "; нарушены: " + r.failed.map((f) => "«" + f + "»").join(", ") : ""));
}
console.log("   реализация, подставляемая вместо другой, обязана пройти тот же контракт: иначе подстановка ломает код, который на неё полагался");`, { filename: "06-dependency-injection.mjs", collapsed: true }),
      code("text", `1) проверка поведения по дням недели (7 проверок):
   время внутри функции: потребовалось подменить глобальный Date 7 раз(а); результаты совпадают с параметрической версией: да
   время как параметр: подмен глобального состояния 0; скидка в день: пятница
   тест упал до восстановления: Date остался подменённым: да (любой следующий код видит пятницу)
   два теста с подменой выполняются конкурентно: A ждёт «Пятница: скидка 10 %», получил «Без скидки»; B ждёт «Без скидки», получил «Без скидки» → тест A сломан чужой подменой: да
   то же с параметром: A получил «Пятница: скидка 10 %», B получил «Без скидки» — влияния нет

2) 1000 запусков одной операции «разместить заказ»:
   зависимости внутри функции: записей в файл на диске — 1000 ; результат зависит от текущего времени и состояния диска
   зависимости переданы: записей на диск — 0 ; сохранено заказов в памяти — 1000 , отправлено писем — 1000 ; все 1000 результатов одинаковы: да ; итог: Заказ 7: 290

3) одни и те же контрактные тесты (5 проверок) для трёх реализаций хранилища:
   MemoryRepo прошло 5 из 5
   FileRepo   прошло 5 из 5
   BuggyRepo  прошло 2 из 5; нарушены: «отсутствующий объект — null, а не undefined», «изменение исходного объекта после сохранения не меняет хранилище», «изменение найденного объекта не меняет хранилище»
   реализация, подставляемая вместо другой, обязана пройти тот же контракт: иначе подстановка ломает код, который на неё полагался`, { filename: "время, порты и контрактные тесты" }),
      ul(
        "**Время внутри функции:** для проверки 7 дней недели пришлось **7 раз** подменять глобальный `Date`; результаты совпали с версией, где дата — параметр, но если тест упал до восстановления, `Date` **остался подменённым** для всего последующего кода; два конкурентных теста с подменой мешают друг другу (тест A ждал «Пятница: скидка 10 %» и получил «Без скидки» — подмену успел переписать тест B). С датой-параметром — 0 подмен, влияния нет.",
        "**Порты и адаптеры:** 1000 запусков операции «разместить заказ» — при зависимостях внутри функции **1000 записей в файл**, результат зависит от времени и диска; при переданных зависимостях — **0 записей**, 1000 заказов сохранено в памяти, 1000 писем отправлено в фиктивный почтовый шлюз, все 1000 результатов одинаковы.",
        "**Контрактные тесты** (5 проверок хранилища: найденное равно сохранённому; отсутствующее — `null`; повторное сохранение заменяет; изменение исходного объекта и найденного объекта не меняет хранилище): `MemoryRepo` — 5 из 5, `FileRepo` — 5 из 5, `BuggyRepo` — **2 из 5** (возвращает `undefined`, хранит и отдаёт ссылки на изменяемые объекты). Реализация, которую подставляют вместо другой, обязана пройти тот же контракт.",
      ),
      h("Совместимость API: один клиент, две версии"),
      code("js", `// Совместимость контрактов, проверенная компилятором: один и тот же клиентский код собирается против старого и нового описания API
import ts from "typescript";

const OPTS = { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, types: [] };
function compile(files) {
  const host = ts.createCompilerHost(OPTS), orig = host.getSourceFile.bind(host), exists = host.fileExists.bind(host), read = host.readFile.bind(host);
  host.getSourceFile = (f, ...r) => (f in files ? ts.createSourceFile(f, files[f], OPTS.target, true) : orig(f, ...r));
  const dirExists = host.directoryExists?.bind(host);
  host.fileExists = (f) => f in files || exists(f); host.readFile = (f) => files[f] ?? read(f);
  host.directoryExists = (d) => d === "/virtual" || (dirExists ? dirExists(d) : false);
  const prog = ts.createProgram(Object.keys(files).filter((f) => f.endsWith("client.ts")), OPTS, host);
  return ts.getPreEmitDiagnostics(prog).filter((d) => d.file && d.file.fileName in files).map((d) => "TS" + d.code);
}
const cases = [
  ["добавлен необязательный параметр", \`export function greet(name: string): string { return name; }\`, \`export function greet(name: string, loud?: boolean): string { return name; }\`, \`import { greet } from "./api"; greet("Ann");\`],
  ["добавлен обязательный параметр", \`export function greet(name: string): string { return name; }\`, \`export function greet(name: string, loud: boolean): string { return name; }\`, \`import { greet } from "./api"; greet("Ann");\`],
  ["функция переименована", \`export function greet(name: string): string { return name; }\`, \`export function hello(name: string): string { return name; }\`, \`import { greet } from "./api"; greet("Ann");\`],
  ["тип параметра расширен: string → string | number", \`export function show(x: string): string { return x; }\`, \`export function show(x: string | number): string { return String(x); }\`, \`import { show } from "./api"; show("a");\`],
  ["тип параметра сужен: string | number → string", \`export function show(x: string | number): string { return String(x); }\`, \`export function show(x: string): string { return x; }\`, \`import { show } from "./api"; show(42);\`],
  ["тип результата расширен: string → string | null", \`export function find(id: number): string { return "x"; }\`, \`export function find(id: number): string | null { return null; }\`, \`import { find } from "./api"; find(1).length;\`],
  ["тип результата сужен: string | null → string", \`export function find(id: number): string | null { return null; }\`, \`export function find(id: number): string { return "x"; }\`, \`import { find } from "./api"; find(1)?.length;\`],
  ["добавлена новая функция", \`export function a(): number { return 1; }\`, \`export function a(): number { return 1; }\\nexport function b(): number { return 2; }\`, \`import { a } from "./api"; a();\`],
  ["в объект параметров добавлено обязательное поле", \`export function open(o: { host: string }): void {}\`, \`export function open(o: { host: string; port: number }): void {}\`, \`import { open } from "./api"; open({ host: "h" });\`],
  ["в объект параметров добавлено необязательное поле", \`export function open(o: { host: string }): void {}\`, \`export function open(o: { host: string; port?: number }): void {}\`, \`import { open } from "./api"; open({ host: "h" });\`],
  ["в результат-объект добавлено поле", \`export function user(): { name: string } { return { name: "a" }; }\`, \`export function user(): { name: string; age: number } { return { name: "a", age: 1 }; }\`, \`import { user } from "./api"; const u: { name: string } = user(); u.name;\`],
  ["из результата-объекта удалено поле", \`export function user(): { name: string; age: number } { return { name: "a", age: 1 }; }\`, \`export function user(): { name: string } { return { name: "a" }; }\`, \`import { user } from "./api"; user().age.toFixed();\`],
  ["добавлен метод в интерфейс, который клиент РЕАЛИЗУЕТ", \`export interface Logger { log(m: string): void }\`, \`export interface Logger { log(m: string): void; warn(m: string): void }\`, \`import type { Logger } from "./api"; export const l: Logger = { log(m) {} };\`],
  ["добавлен метод в интерфейс, который клиент только ИСПОЛЬЗУЕТ", \`export interface Logger { log(m: string): void }\\nexport const logger: Logger = { log() {} };\`, \`export interface Logger { log(m: string): void; warn(m: string): void }\\nexport const logger: Logger = { log() {}, warn() {} };\`, \`import { logger } from "./api"; logger.log("x");\`],
  ["в объединение, возвращаемое API, добавлен вариант (клиент перебирает варианты)", \`export type Status = "ok" | "fail";\\nexport function status(): Status { return "ok"; }\`, \`export type Status = "ok" | "fail" | "retry";\\nexport function status(): Status { return "ok"; }\`, \`import { status } from "./api";\\nexport function label(): string {\\n  const s = status();\\n  switch (s) { case "ok": return "ok"; case "fail": return "fail"; default: { const n: never = s; return n; } }\\n}\`],
];
console.log("изменение API".padEnd(83) + "ошибок до → после  вывод");
let broken = 0, ok = 0;
for (const [title, v1, v2, client] of cases) {
  const before = compile({ "/virtual/api.ts": v1, "/virtual/client.ts": client }), after = compile({ "/virtual/api.ts": v2, "/virtual/client.ts": client });
  const verdict = before.length === 0 && after.length === 0 ? "совместимо" : before.length === 0 ? "ЛОМАЕТ клиента" : "клиент не собирался и до изменения";
  if (verdict === "совместимо") ok++; else broken++;
  console.log("   " + title.padEnd(80) + String(before.length + " → " + after.length).padEnd(10) + verdict + (after.length ? " (" + after[0] + ")" : ""));
}
console.log("\\nитого: совместимых изменений", ok, ", ломающих", broken, "из", cases.length);
console.log("правило: параметры можно расширять (контравариантность), результаты — сужать (ковариантность); добавлять необязательное — можно, обязательное — нельзя; всё, что клиент реализует, нельзя расширять");`, { filename: "07-api-compat.mjs", collapsed: true }),
      code("text", `изменение API                                                                      ошибок до → после  вывод
   добавлен необязательный параметр                                                0 → 0     совместимо
   добавлен обязательный параметр                                                  0 → 1     ЛОМАЕТ клиента (TS2554)
   функция переименована                                                           0 → 1     ЛОМАЕТ клиента (TS2305)
   тип параметра расширен: string → string | number                                0 → 0     совместимо
   тип параметра сужен: string | number → string                                   0 → 1     ЛОМАЕТ клиента (TS2345)
   тип результата расширен: string → string | null                                 0 → 1     ЛОМАЕТ клиента (TS2531)
   тип результата сужен: string | null → string                                    0 → 0     совместимо
   добавлена новая функция                                                         0 → 0     совместимо
   в объект параметров добавлено обязательное поле                                 0 → 1     ЛОМАЕТ клиента (TS2345)
   в объект параметров добавлено необязательное поле                               0 → 0     совместимо
   в результат-объект добавлено поле                                               0 → 0     совместимо
   из результата-объекта удалено поле                                              0 → 1     ЛОМАЕТ клиента (TS2339)
   добавлен метод в интерфейс, который клиент РЕАЛИЗУЕТ                            0 → 1     ЛОМАЕТ клиента (TS2741)
   добавлен метод в интерфейс, который клиент только ИСПОЛЬЗУЕТ                    0 → 0     совместимо
   в объединение, возвращаемое API, добавлен вариант (клиент перебирает варианты)  0 → 1     ЛОМАЕТ клиента (TS2322)

итого: совместимых изменений 7 , ломающих 8 из 15
правило: параметры можно расширять (контравариантность), результаты — сужать (ковариантность); добавлять необязательное — можно, обязательное — нельзя; всё, что клиент реализует, нельзя расширять`, { filename: "компилятор TypeScript 5.9: 15 изменений API" }),
      ul(
        "**Метод:** для каждого изменения один и тот же клиентский код собирался (в режиме `strict`) против описания API до и после; число ошибок «до → после» и их коды показывают, ломается ли клиент.",
        "**Совместимо — 7 из 15:** добавлен необязательный параметр; тип параметра расширен; тип результата сужен; добавлена функция; добавлено необязательное поле в объект параметров; добавлено поле в результат-объект; добавлен метод в интерфейс, который клиент только использует.",
        "**Ломает — 8 из 15:** добавлен обязательный параметр (TS2554); функция переименована (TS2305); параметр сужен (TS2345); результат расширен (TS2531); добавлено обязательное поле параметров (TS2345); из результата удалено поле (TS2339); добавлен метод в интерфейс, который клиент реализует (TS2741); в возвращаемое объединение добавлен вариант, который клиент перебирает (TS2322).",
        "**Оговорка:** результат зависит от клиента. Закон Хайрама: у достаточно большого числа пользователей любое наблюдаемое поведение становится чьей-то зависимостью, поэтому «совместимое» по типам изменение может сломать того, кто полагался на порядок, сроки или текст ошибки.",
      ),
    ]),

    section("analysis", [
      h("Протечки абстракций"),
      code("js", `// «Закон дырявых абстракций»: удобная абстракция («число», «строка», «время», «массив») протекает деталями реализации
process.env.TZ = "America/New_York";
const rows = [];
const leak = (abstraction, expected, actual, cause) => rows.push([abstraction, expected, actual, cause]);

leak("число — это десятичное число", "0.1 + 0.2 === 0.3", String(0.1 + 0.2 === 0.3) + " (результат " + (0.1 + 0.2) + ")", "двоичная запись: 0.1 и 0.2 не представимы точно");
leak("число — любое целое", "2**53 + 1 !== 2**53", String(2 ** 53 + 1 !== 2 ** 53) + " (9007199254740993 → " + 9007199254740993 + ")", "53 бита мантиссы double");
leak("строка — последовательность символов", "'😀'.length === 1", String("😀".length === 1) + " (длина " + "😀".length + ")", "длина считается в 16-битных единицах UTF-16");
leak("равные на вид строки равны", "'é' === 'é'", String("é" === "é") + " (длины " + "é".length + " и " + "é".length + "; после normalize: " + ("é" === "é".normalize()) + ")", "один символ — несколько представлений Юникода");
const d1 = new Date(2024, 2, 9), d2 = new Date(2024, 2, 10), d3 = new Date(2024, 2, 11);
leak("сутки — это 24 часа", "между полуночью 10 и 11 марта 24 часа", ((d3 - d2) / 3600000) + " ч (TZ America/New_York, переход на летнее время)", "локальные сутки зависят от часового пояса");
leak("сортировка чисел по умолчанию", "[10, 9, 1].sort() — по возрастанию", JSON.stringify([10, 9, 1].sort()), "без функции сравнения элементы сравниваются как строки");
leak("порядок ключей объекта — порядок вставки", "ключи b, a, 2, 1", JSON.stringify(Object.keys({ b: 1, a: 1, 2: 1, 1: 1 })), "целочисленные ключи идут первыми по возрастанию");
leak("JSON сохраняет значение", "JSON.parse(JSON.stringify(x)) deepEquals x", JSON.stringify(JSON.parse(JSON.stringify({ a: undefined, b: NaN, c: new Date(0), d: -0 }))), "undefined пропадает, NaN → null, Date → строка, −0 → 0");
leak("indexOf(x) !== -1 — то же, что includes(x)", "для NaN оба способа находят элемент", "includes: " + [NaN].includes(NaN) + ", indexOf: " + [NaN].indexOf(NaN), "разные алгоритмы сравнения: SameValueZero и строгое равенство");
console.log("абстракция → ожидание → что на самом деле → причина");
for (const [a, e, r, c] of rows) console.log("   " + a + "\\n      ожидание: " + e + "\\n      на деле:  " + r + "\\n      причина:  " + c);
console.log("\\nвсего протечек показано:", rows.length, "; во всех случаях программа работает без ошибок — результат просто отличается от ожидаемого");`, { filename: "04-leaky-abstractions.mjs", collapsed: true }),
      code("text", `абстракция → ожидание → что на самом деле → причина
   число — это десятичное число
      ожидание: 0.1 + 0.2 === 0.3
      на деле:  false (результат 0.30000000000000004)
      причина:  двоичная запись: 0.1 и 0.2 не представимы точно
   число — любое целое
      ожидание: 2**53 + 1 !== 2**53
      на деле:  false (9007199254740993 → 9007199254740992)
      причина:  53 бита мантиссы double
   строка — последовательность символов
      ожидание: '😀'.length === 1
      на деле:  false (длина 2)
      причина:  длина считается в 16-битных единицах UTF-16
   равные на вид строки равны
      ожидание: 'é' === 'é'
      на деле:  false (длины 1 и 2; после normalize: true)
      причина:  один символ — несколько представлений Юникода
   сутки — это 24 часа
      ожидание: между полуночью 10 и 11 марта 24 часа
      на деле:  23 ч (TZ America/New_York, переход на летнее время)
      причина:  локальные сутки зависят от часового пояса
   сортировка чисел по умолчанию
      ожидание: [10, 9, 1].sort() — по возрастанию
      на деле:  [1,10,9]
      причина:  без функции сравнения элементы сравниваются как строки
   порядок ключей объекта — порядок вставки
      ожидание: ключи b, a, 2, 1
      на деле:  ["1","2","b","a"]
      причина:  целочисленные ключи идут первыми по возрастанию
   JSON сохраняет значение
      ожидание: JSON.parse(JSON.stringify(x)) deepEquals x
      на деле:  {"b":null,"c":"1970-01-01T00:00:00.000Z","d":0}
      причина:  undefined пропадает, NaN → null, Date → строка, −0 → 0
   indexOf(x) !== -1 — то же, что includes(x)
      ожидание: для NaN оба способа находят элемент
      на деле:  includes: true, indexOf: -1
      причина:  разные алгоритмы сравнения: SameValueZero и строгое равенство

всего протечек показано: 9 ; во всех случаях программа работает без ошибок — результат просто отличается от ожидаемого`, { filename: "девять протечек в «простых» абстракциях JavaScript" }),
      ul(
        "**Число:** `0.1 + 0.2 === 0.3` — `false` (результат `0.30000000000000004`); `2**53 + 1 !== 2**53` — `false`: 53 бита мантиссы.",
        "**Строка:** `'😀'.length` — 2 (длина в 16-битных единицах UTF-16); `'é'` в двух представлениях Юникода (`\\u00e9` и `e\\u0301`) — разной длины (1 и 2) и не равны до `normalize()`.",
        "**Время:** между полуночью 10 и 11 марта 2024 в поясе `America/New_York` — **23 часа**: сутки зависят от часового пояса и перехода на летнее время.",
        "**Коллекции:** `[10, 9, 1].sort()` — `[1, 10, 9]` (элементы сравниваются как строки); ключи объекта `{b, a, 2, 1}` перечисляются как `1, 2, b, a`; `[NaN].includes(NaN)` — `true`, а `[NaN].indexOf(NaN)` — `-1` (разные алгоритмы сравнения); JSON теряет `undefined`, превращает `NaN` в `null`, `Date` — в строку, `−0` — в `0`.",
        "**Общий вывод:** во всех девяти случаях программа работает без ошибок — результат просто не совпадает с интуицией. Закон дырявых абстракций (Спольски): не существует нетривиальной абстракции, которая не протекает.",
      ),
      h("Протечка «объекты вместо SQL»: запросов 101 вместо 1"),
      code("python", `# Протечка абстракции «объекты вместо SQL»: ленивая загрузка связей скрывает число запросов (проблема N + 1)
import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE author (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE book   (id INTEGER PRIMARY KEY, author_id INTEGER REFERENCES author(id), title TEXT);
CREATE INDEX book_author ON book(author_id);
""")
db.executemany("INSERT INTO author VALUES (?, ?)", [(i, f"автор {i}") for i in range(1, 101)])
db.executemany("INSERT INTO book VALUES (?, ?, ?)", [(i * 10 + j, i, f"книга {i}-{j}") for i in range(1, 101) for j in range(5)])
db.commit()

statements = []
db.set_trace_callback(lambda s: statements.append(s) if s.lstrip().upper().startswith("SELECT") else None)

class Author:
    """Объект предметной области: «у автора есть книги» — атрибут, а не запрос."""
    def __init__(self, id, name): self.id, self.name = id, name
    @property
    def books(self):                                           # ленивая загрузка: запрос выполняется при первом обращении
        return [r[0] for r in db.execute("SELECT title FROM book WHERE author_id = ?", (self.id,))]

def all_authors():
    return [Author(*r) for r in db.execute("SELECT id, name FROM author ORDER BY id")]

def run(title, fn):
    statements.clear()
    result = fn()
    print(f"   {title}: запросов к базе — {len(statements)}; книг получено — {result}")
    return len(statements)

print("100 авторов, у каждого по 5 книг (500 книг); задача: посчитать книги всех авторов")
n_lazy = run("ленивая загрузка (цикл по авторам, обращение к .books)", lambda: sum(len(a.books) for a in all_authors()))
n_join = run("один запрос с JOIN и группировкой", lambda: sum(r[0] for r in db.execute("SELECT count(*) FROM author a JOIN book b ON b.author_id = a.id GROUP BY a.id")))
def prefetch():
    authors = all_authors(); by_author = {}
    for aid, title in db.execute("SELECT author_id, title FROM book WHERE author_id IN (SELECT id FROM author)"): by_author.setdefault(aid, []).append(title)
    return sum(len(by_author[a.id]) for a in authors)
n_pre = run("предзагрузка: авторы + книги двумя запросами", prefetch)
print(f"   запросов: {n_lazy} (1 + N, где N = 100) против {n_join} и {n_pre}")
rtt_ms = 1
print(f"   расчёт (не замер): при задержке {rtt_ms} мс на обращение к базе по сети — {n_lazy * rtt_ms} мс ожидания против {n_join * rtt_ms} мс и {n_pre * rtt_ms} мс; в локальной памяти разницы не видно")
authors = all_authors()
print("   исходный текст \`a.books\` одинаков для 100 и для 10 000 авторов, а число запросов равно 1 + N: растёт линейно вместе с данными, и по тексту этого не видно")
print("   проверка содержимого: у первых трёх авторов по 5 книг —", all(len(a.books) == 5 for a in authors[:3]))`, { filename: "05-orm-n-plus-one.py", collapsed: true }),
      code("text", `100 авторов, у каждого по 5 книг (500 книг); задача: посчитать книги всех авторов
   ленивая загрузка (цикл по авторам, обращение к .books): запросов к базе — 101; книг получено — 500
   один запрос с JOIN и группировкой: запросов к базе — 1; книг получено — 500
   предзагрузка: авторы + книги двумя запросами: запросов к базе — 2; книг получено — 500
   запросов: 101 (1 + N, где N = 100) против 1 и 2
   расчёт (не замер): при задержке 1 мс на обращение к базе по сети — 101 мс ожидания против 1 мс и 2 мс; в локальной памяти разницы не видно
   исходный текст \`a.books\` одинаков для 100 и для 10 000 авторов, а число запросов равно 1 + N: растёт линейно вместе с данными, и по тексту этого не видно
   проверка содержимого: у первых трёх авторов по 5 книг — True`, { filename: "ленивая загрузка связей скрывает число запросов" }),
      ul(
        "Для 100 авторов с 5 книгами каждого (500 книг) цикл с обращением к `a.books` выполнил **101 запрос** (1 + N); один запрос с `JOIN` — **1**, предзагрузка двумя запросами — **2**; результат один и тот же (500 книг).",
        "Исходный текст `a.books` одинаков для 100 и для 10 000 авторов, а число запросов растёт линейно с данными — по тексту этого не видно. При задержке 1 мс на обращение к базе по сети (расчёт, не замер) это 101 мс ожидания против 1 и 2 мс.",
        "**Урок:** абстракция «связь — это атрибут» скрывает стоимость. Диагностика — счётчик запросов в тестах и журнал SQL (см. [планы выполнения в SQL](/learn/sql/explain-plans)); лечение — явная загрузка связей, предзагрузка, запросы с `JOIN`.",
      ),
    ]),

    section("internals", [
      h("Как модульность реализуется в языках и инструментах"),
      ul(
        "**Модули ECMAScript** задают статический граф зависимостей (`import`/`export`): он известен до выполнения, поэтому сборщики и анализаторы строят его целиком (так же, как скрипт `01` — граф магазина). **CommonJS** строит граф динамически при вызовах `require`, и циклы разрешаются частично заполненным объектом экспорта — так загружались модули в упражнении с рефакторингом.",
        "**Приватность:** `#поле` в JavaScript, `private` в TypeScript, пакетная видимость в Java — разные силы сокрытия: приватные поля (`#`) недоступны даже через рефлексию, `private` TypeScript — только проверка типов (стирается при компиляции, см. [типы и модели памяти](/learn/cs/types-memory-models)), соглашение об `_имени` — лишь договорённость.",
        "**Публичный интерфейс пакета:** поле `exports` в `package.json` ограничивает, какие файлы можно импортировать; всё остальное — внутренняя реализация, на которую клиенты не должны полагаться.",
        "**API и ABI:** API — договорённость на уровне исходного кода (типы, имена), ABI — на уровне двоичного кода (размещение структур, соглашения о вызовах; см. [размеры и выравнивание структур](/learn/cs/types-memory-models)). Совместимость API не гарантирует совместимость ABI.",
        "**Семантическое версионирование** кодирует тип изменения номером: `MAJOR.MINOR.PATCH`; `MAJOR` — несовместимое изменение API, `MINOR` — совместимое добавление, `PATCH` — исправление. Правила совместимости на практике — те самые, что проверены компилятором выше.",
        "**Корень композиции** — единственная точка, где создаются конкретные объекты и передаются зависимости; контейнеры внедрения зависимостей автоматизируют это, но принцип работает и без них (пример выше — обычные параметры конструктора).",
      ),
    ]),

    section("mistakes", [
      wrongRight(
        "js",
        {
          title: "Неверно",
          code: `
            class BuggyRepo {
              #m = new Map();
              save(o) { this.#m.set(o.id, o); }          // хранит ссылку на чужой изменяемый объект
              find(id) { return this.#m.get(id); }        // отдаёт внутреннюю ссылку; нет записи — undefined
            }
          `,
          note: "Контрактные тесты: 2 из 5. Изменение объекта после сохранения и после чтения меняет «хранилище», отсутствующая запись — `undefined`, а не `null`. Внутреннее состояние «протекло» наружу.",
        },
        {
          title: "Верно",
          code: `
            class MemoryRepo {
              #m = new Map();
              save(o) { this.#m.set(o.id, structuredClone(o)); }
              find(id) { return this.#m.has(id) ? structuredClone(this.#m.get(id)) : null; }
            }
          `,
          note: "Модуль владеет своими данными: на входе и на выходе копии, отсутствие — `null`, как обещает контракт. Тот же набор тестов проходит и файловая реализация (5 из 5).",
        },
      ),
      ul(
        "**Разбивать модули по шагам алгоритма, а не по решениям.** Все модули знают общий формат данных: смена формата правит все 4 из 4.",
        "**Допускать циклы зависимостей.** Модули цикла нельзя понять, собрать и тестировать по отдельности: в замере циклы из 7 и 3 модулей; затронуть один — значит затронуть все.",
        "**Зависимость ядра от деталей.** `pricing → db`, `inventory → orders`: правила предметной области меняются из-за схемы базы; 18 нарушений в «спагетти»-варианте против 0 с инверсией.",
        "**Брать время, случайность, окружение и сеть из глобального состояния внутри логики.** Тесты требуют подмен, мешают друг другу и ломаются в параллельном запуске.",
        "**Считать «добавление» всегда совместимым.** Добавление метода в реализуемый интерфейс или варианта в перебираемое объединение ломает клиентов (TS2741, TS2322).",
        "**Доверять абстракции там, где у неё стоимость.** Ленивая загрузка связей скрыла 101 запрос вместо 1.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**«Божественный» класс или модуль.** LCOM4 = 3 для `OrderManager`: три независимые ответственности в одном месте; изменение любой причины затрагивает общий файл и его тесты.",
        "**Общий модуль `utils`/`common`, в который сваливается всё.** Он имеет огромный радиус поражения; допустим только малый и стабильный (Ce = 0), иначе замыкает циклы (`utils → config, logger` в «спагетти»-варианте).",
        "**Синглтоны и глобальные переменные как скрытые зависимости.** Их не видно в сигнатуре, их нужно подменять в тестах (7 подмен `Date`), они создают взаимное влияние тестов.",
        "**Преждевременные абстракции.** Интерфейс «на всякий случай» с одной реализацией и без реальной причины изменения — лишняя косвенность; абстракцию стоит вводить, когда есть вторая реализация или явная граница изменений.",
        "**Нарушение контракта при подстановке.** Реализация, возвращающая `undefined` вместо `null` или отдающая внутренние ссылки, формально «подходит по типам», но ломает клиентов — отсюда нужны контрактные тесты.",
        "**Мажорные изменения под видом минорных.** Удаление поля, добавление обязательного параметра, расширение результата — поломка клиентов без предупреждения номером версии.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Определите, какие решения изменятся,** и спрячьте каждое за интерфейсом одного модуля: формат хранения, источник времени, база, внешние сервисы, правила цен.",
        "**Направляйте зависимости внутрь:** ядро объявляет порты, адаптеры их реализуют; собирайте систему в корне композиции.",
        "**Измеряйте структуру:** циклы, нарушения направления, Ca/Ce, радиус поражения — автоматически в CI; запрещайте новые циклы.",
        "**Получайте зависимости параметрами:** время, случайность, файловую систему, сеть — через интерфейсы; тесты тогда быстры (0 записей на диск за 1000 запусков) и независимы.",
        "**Пишите контрактные тесты для интерфейсов** и гоняйте их на каждой реализации; новая реализация считается допустимой, только если проходит весь набор.",
        "**Версионируйте по правилам совместимости:** автоматически сравнивайте описания API (компилятор, инструменты проверки), обязательное добавлять только в мажорной версии.",
        "**Рефакторьте под защитой «золотого эталона»:** фиксируйте текущее поведение на сотнях входов, меняйте структуру, сравнивайте результаты (300 из 300) и граф зависимостей (цикл разорван).",
        "**Знайте, где абстракция протекает,** и держите рядом средства наблюдения: счётчик запросов, нормализация строк, явные часовые пояса, проверка точности чисел.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Разрыв цикла двумя способами:** выделить общее в третий модуль (так в упражнении: `items` для `cart` и `pricing`) или ввести интерфейс и инвертировать зависимость (адаптер реализует порт ядра).",
        "**Цена модульности:** больше интерфейсов, больше косвенности, больше кода «склейки»; для маленькой программы граница между модулями может стоить больше, чем даёт. Критерий — реальная вероятность изменения.",
        "**Общие данные иногда оправданы:** в критичных по скорости участках модуль может знать формат данных соседа — это сознательный компромисс (см. [выравнивание и представление данных](/learn/cs/types-memory-models)), и он должен быть задокументирован и локализован.",
        "**Совместимость зависит от клиента:** пример с `null` в результате безопасен для клиента, который использует `?.`, и ломает того, кто пишет `.length`; закон Хайрама добавляет неявные зависимости (порядок, сроки, текст ошибок).",
        "**Циклы на уровне пакетов и на уровне функций:** цикл между файлами внутри одного модуля допустим (локально понятен), цикл между пакетами — нет.",
        "**Внедрение зависимостей не лечит плохую границу:** если интерфейс повторяет реализацию (много методов, «протекающие» детали), клиенты по-прежнему зависят от деталей; граница должна выражать смысл, а не устройство.",
        "**Контракт включает ошибки и производительность:** `find` возвращает `null`, но сколько он длится и какие исключения бросает — тоже часть контракта; их нужно описывать и проверять.",
      ),
    ]),

    section("related", [
      ul(
        "[Графы](/learn/cs/graphs) — граф зависимостей, сильно связные компоненты (алгоритм Тарьяна), достижимость.",
        "[Типы и модели памяти](/learn/cs/types-memory-models) — система типов как проверка интерфейсов, структурная и номинальная типизация, стирание типов.",
        "[Компиляция и интерпретация](/learn/cs/compilation-interpretation) — разрешение модулей и компоновка; оптимизации, не меняющие поведения.",
        "[Транзакции и согласованность](/learn/cs/transactions-consistency-theory) — контракты на уровне данных: инварианты и их защита.",
        "[Хеш-таблицы](/learn/cs/hash-tables) — пример абстракции с чёткой стоимостью: операции, амортизированная сложность, протечки (порядок обхода).",
        "[JavaScript: модули ESM](/learn/js/modules-esm) — статический граф зависимостей, экспорты и циклы.",
        "[JavaScript: тестирование и архитектура](/learn/js/testing-architecture) — подмена зависимостей и структура приложения на практике.",
        "[JavaScript: классы](/learn/js/classes) — приватные поля, инкапсуляция.",
        "[SQL: схемы и шаблоны проектирования](/learn/sql/schema-patterns) — границы между данными и приложением.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Время и ввод-вывод внутри функции",
          code: `
            const banner = () => (new Date().getDay() === 5 ? "Пятница: скидка 10 %" : "Без скидки");
            function place(order) {
              fs.appendFileSync(logFile, JSON.stringify({ ...order, placedAt: new Date() }) + "\\n");
            }
          `,
          note: "Для 7 дней недели — 7 подмен глобального `Date`; упавший тест оставляет подмену; конкурентные тесты мешают друг другу; 1000 запусков — 1000 записей в файл.",
        },
        {
          title: "Зависимости переданы параметрами",
          code: `
            const banner = (date) => (date.getDay() === 5 ? "Пятница: скидка 10 %" : "Без скидки");
            class OrderService {
              constructor({ repo, mailer, clock }) { this.repo = repo; this.mailer = mailer; this.clock = clock; }
              place(order) { /* clock.now(), repo.save(...), mailer.send(...) */ }
            }
          `,
          note: "0 подмен глобального состояния, 0 записей на диск за 1000 запусков, все результаты одинаковы; реализации (`MemoryRepo`, `FileRepo`) подменяются при условии прохождения тех же 5 контрактных проверок.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "cs.abstraction-modularity.ex1",
      title: "Совместимо или ломает: классифицируйте изменения API",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Библиотека выпускает версию 2.0 с шестью изменениями: (а) в функцию `parse(text)` добавлен необязательный параметр `strict?: boolean`; (б) функция `find(id)` теперь возвращает `string | null` вместо `string`; (в) параметр `show(x)` расширен с `string` до `string | number`; (г) в объект параметров `open({ host })` добавлено обязательное поле `port: number`; (д) в интерфейс `Logger { log() }`, который реализуют клиенты, добавлен метод `warn()`; (е) в тип результата `user(): { name }` добавлено поле `age`. Для каждого изменения определите, ломает ли оно клиентов, и объясните правилом вариантности."),
      ],
      hints: [
        "Параметры можно расширять (принимать больше), результаты — сужать (обещать больше).",
        "Что происходит у клиента, который использует результат как `string` и вдруг получает `string | null`?",
        "Кто обязан обновиться при добавлении метода в интерфейс: тот, кто его реализует, или тот, кто использует?",
      ],
      checks: ["(а) совместимо", "(б) ломает: результат расширен", "(в) совместимо: параметр расширен", "(г) ломает: новое обязательное поле", "(д) ломает реализующих клиентов", "(е) совместимо: результат содержит больше"],
      solution: [
        code("text", `изменение API                                                                      ошибок до → после  вывод
   добавлен необязательный параметр                                                0 → 0     совместимо
   добавлен обязательный параметр                                                  0 → 1     ЛОМАЕТ клиента (TS2554)
   функция переименована                                                           0 → 1     ЛОМАЕТ клиента (TS2305)
   тип параметра расширен: string → string | number                                0 → 0     совместимо
   тип параметра сужен: string | number → string                                   0 → 1     ЛОМАЕТ клиента (TS2345)
   тип результата расширен: string → string | null                                 0 → 1     ЛОМАЕТ клиента (TS2531)
   тип результата сужен: string | null → string                                    0 → 0     совместимо
   добавлена новая функция                                                         0 → 0     совместимо
   в объект параметров добавлено обязательное поле                                 0 → 1     ЛОМАЕТ клиента (TS2345)
   в объект параметров добавлено необязательное поле                               0 → 0     совместимо
   в результат-объект добавлено поле                                               0 → 0     совместимо
   из результата-объекта удалено поле                                              0 → 1     ЛОМАЕТ клиента (TS2339)
   добавлен метод в интерфейс, который клиент РЕАЛИЗУЕТ                            0 → 1     ЛОМАЕТ клиента (TS2741)
   добавлен метод в интерфейс, который клиент только ИСПОЛЬЗУЕТ                    0 → 0     совместимо
   в объединение, возвращаемое API, добавлен вариант (клиент перебирает варианты)  0 → 1     ЛОМАЕТ клиента (TS2322)

итого: совместимых изменений 7 , ломающих 8 из 15
правило: параметры можно расширять (контравариантность), результаты — сужать (ковариантность); добавлять необязательное — можно, обязательное — нельзя; всё, что клиент реализует, нельзя расширять`, { filename: "проверка компилятором: те же шесть видов изменений" }),
        ul(
          "(а) **Совместимо.** Необязательный параметр не требует от существующих вызовов ничего нового.",
          "(б) **Ломает.** Клиент, который вызывает `find(1).length`, получает ошибку компиляции (в замере TS2531): результат стал обещать меньше (может быть `null`).",
          "(в) **Совместимо.** Функция принимает больше значений; прежние вызовы остаются допустимыми (контравариантность параметров).",
          "(г) **Ломает.** Вызов `open({ host: 'h' })` больше не удовлетворяет типу (TS2345); обязательное поле можно добавлять только в мажорной версии, необязательное — в минорной.",
          "(д) **Ломает тех, кто реализует интерфейс** (TS2741: у объекта клиента нет `warn`); тех, кто только вызывает `logger.log`, не затрагивает.",
          "(е) **Совместимо.** Результат стал обещать больше (дополнительное поле); клиент, который читает `name`, не замечает разницы (ковариантность результатов).",
        ),
      ],
    }),
    exercise({
      id: "cs.abstraction-modularity.ex2",
      title: "Напишите анализатор зависимостей",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Граф зависимостей задан объектом `{ модуль: [модули, от которых он зависит] }`. Напишите `analyse(graph)`, возвращающую: `ce` (число исходящих связей), `ca` (число входящих), `cycles` (список циклов — групп из двух и более модулей, достижимых друг из друга) и `blast` (для каждого модуля — число модулей, которые прямо или косвенно от него зависят). Проверьте на графе `web → service, utils; service → repo, utils; repo → db; db → config; config → utils; utils → logger; logger → config`; затем уберите зависимость `logger → config` и покажите, что цикл исчез."),
      ],
      starter: {
        lang: "js",
        code: `
          function analyse(graph) {
            // ce, ca — подсчёт рёбер
            // cycles — сильно связные компоненты размера 2+ (алгоритм Тарьяна или поиск достижимости)
            // blast — обратная достижимость
            return { ce: {}, ca: {}, cycles: [], blast: {} };
          }
        `,
      },
      hints: [
        "Входящие связи для модуля `m` — это модули, в списке зависимостей которых он встречается.",
        "Цикл — это группа модулей, каждый из которых достижим из каждого другого; для небольшого графа подойдёт обход в глубину от каждой вершины.",
        "Радиус поражения — обход графа в обратную сторону (по входящим связям) с множеством посещённых вершин.",
      ],
      checks: ["Цикл до исправления: `{config, logger, utils}`", "Радиус поражения `utils` до исправления — 6, после — 5", "После удаления `logger → config` циклов нет", "`Ce(web) = 2`, `Ca(utils) = 3`"],
      solution: [
        code("js", `// Упражнение: циклы зависимостей, число входящих и исходящих связей, «радиус поражения»
function analyse(graph) {
  const names = Object.keys(graph);
  const ce = Object.fromEntries(names.map((n) => [n, graph[n].length]));
  const ca = Object.fromEntries(names.map((n) => [n, names.filter((m) => graph[m].includes(n)).length]));

  // циклы: сильно связные компоненты из двух и более модулей (алгоритм Тарьяна)
  let counter = 0; const index = {}, low = {}, stack = [], onStack = new Set(), cycles = [];
  function visit(v) {
    index[v] = low[v] = counter++; stack.push(v); onStack.add(v);
    for (const w of graph[v]) {
      if (!(w in index)) { visit(w); low[v] = Math.min(low[v], low[w]); }
      else if (onStack.has(w)) low[v] = Math.min(low[v], index[w]);
    }
    if (low[v] === index[v]) {
      const comp = []; let w;
      do { w = stack.pop(); onStack.delete(w); comp.push(w); } while (w !== v);
      if (comp.length > 1) cycles.push(comp.sort());
    }
  }
  for (const n of names) if (!(n in index)) visit(n);

  // радиус поражения: все модули, которые прямо или косвенно зависят от данного
  const blast = {};
  for (const n of names) {
    const seen = new Set(), todo = [n];
    while (todo.length) { const cur = todo.pop(); for (const m of names) if (graph[m].includes(cur) && !seen.has(m) && m !== n) { seen.add(m); todo.push(m); } }
    blast[n] = seen.size;
  }
  return { ce, ca, cycles, blast };
}

const before = {
  web: ["service", "utils"], service: ["repo", "utils"], repo: ["db"], db: ["config"],
  config: ["utils"], utils: ["logger"], logger: ["config"],
};
const after = { ...before, logger: [] };                       // логгер получает настройки параметром и не импортирует config
for (const [title, g] of [["до исправления", before], ["после: logger не зависит от config", after]]) {
  const r = analyse(g);
  console.log(title + ":");
  console.log("   Ce (исходящие):", JSON.stringify(r.ce));
  console.log("   Ca (входящие): ", JSON.stringify(r.ca));
  console.log("   циклы:", r.cycles.length ? r.cycles.map((c) => "{" + c.join(", ") + "}").join(" ") : "нет", "; радиус поражения utils:", r.blast.utils, "модулей; logger:", r.blast.logger);
}`, { filename: "решение", collapsed: true }),
        code("text", `до исправления:
   Ce (исходящие): {"web":2,"service":2,"repo":1,"db":1,"config":1,"utils":1,"logger":1}
   Ca (входящие):  {"web":0,"service":1,"repo":1,"db":1,"config":2,"utils":3,"logger":1}
   циклы: {config, logger, utils} ; радиус поражения utils: 6 модулей; logger: 6
после: logger не зависит от config:
   Ce (исходящие): {"web":2,"service":2,"repo":1,"db":1,"config":1,"utils":1,"logger":0}
   Ca (входящие):  {"web":0,"service":1,"repo":1,"db":1,"config":1,"utils":3,"logger":1}
   циклы: нет ; радиус поражения utils: 5 модулей; logger: 6`, { filename: "результат на графе из условия" }),
        ul(
          "**Цикл.** `utils → logger → config → utils`: три модуля достижимы друг из друга, алгоритм Тарьяна находит их как одну сильно связную компоненту размера 3.",
          "**Радиус поражения.** До исправления от `utils` зависят все остальные 6 модулей (через `config` и `logger`); после — 5 (`logger` больше не входит в цепочку зависимостей `config`).",
          "**Исправление.** Логгер получает уровень и формат параметрами вместо чтения `config`: зависимость `logger → config` исчезает, цикл разорван, остальной граф не изменился.",
        ),
      ],
    }),
    exercise({
      id: "cs.abstraction-modularity.ex3",
      title: "Тест иногда падает: общие часы и параллельный запуск",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Функция `banner()` обращается к `new Date()`, и для проверки поведения в пятницу тест подменяет глобальный `Date`. Пока тесты шли последовательно, всё работало; после включения параллельного запуска тест «пятница» иногда получает «Без скидки». Кроме того, после одного упавшего теста подмена осталась включённой и сломала несвязанные тесты. Объясните причины и предложите исправление, не зависящее от порядка и параллельности."),
      ],
      hints: [
        "Сколько экземпляров глобального `Date` существует в процессе?",
        "Что произойдёт, если между подменой и чтением времени выполнится другой тест?",
        "Как сделать так, чтобы функции вообще не требовалось обращаться к глобальному состоянию?",
      ],
      checks: ["Причина: разделяемое глобальное состояние; тесты влияют друг на друга", "Подмена не восстановлена при ошибке", "Исправление: дата или порт `Clock` передаётся параметром", "После исправления 7 проверок дней недели — без единой подмены"],
      solution: [
        code("text", `1) проверка поведения по дням недели (7 проверок):
   время внутри функции: потребовалось подменить глобальный Date 7 раз(а); результаты совпадают с параметрической версией: да
   время как параметр: подмен глобального состояния 0; скидка в день: пятница
   тест упал до восстановления: Date остался подменённым: да (любой следующий код видит пятницу)
   два теста с подменой выполняются конкурентно: A ждёт «Пятница: скидка 10 %», получил «Без скидки»; B ждёт «Без скидки», получил «Без скидки» → тест A сломан чужой подменой: да
   то же с параметром: A получил «Пятница: скидка 10 %», B получил «Без скидки» — влияния нет

2) 1000 запусков одной операции «разместить заказ»:
   зависимости внутри функции: записей в файл на диске — 1000 ; результат зависит от текущего времени и состояния диска
   зависимости переданы: записей на диск — 0 ; сохранено заказов в памяти — 1000 , отправлено писем — 1000 ; все 1000 результатов одинаковы: да ; итог: Заказ 7: 290

3) одни и те же контрактные тесты (5 проверок) для трёх реализаций хранилища:
   MemoryRepo прошло 5 из 5
   FileRepo   прошло 5 из 5
   BuggyRepo  прошло 2 из 5; нарушены: «отсутствующий объект — null, а не undefined», «изменение исходного объекта после сохранения не меняет хранилище», «изменение найденного объекта не меняет хранилище»
   реализация, подставляемая вместо другой, обязана пройти тот же контракт: иначе подстановка ломает код, который на неё полагался`, { filename: "подмена времени, взаимное влияние, исправление параметром" }),
        ul(
          "**Причина 1.** `Date` — глобальный объект процесса; подмена видна всему коду, в том числе другим тестам, выполняющимся между подменой и чтением (в замере тест A получил «Без скидки» вместо «Пятница: скидка 10 %»).",
          "**Причина 2.** Если тест падает до `restore()`, подмена остаётся (в замере: `Date` остался подменённым, любой следующий код видит пятницу). Нужен `try/finally` — но это лишь лечит симптом.",
          "**Исправление.** Сделать дату параметром (`banner(date)`) или передавать порт `Clock { now() }` в конструктор сервиса; в тесте — обычное значение: 7 проверок дней недели без подмен, влияния нет.",
          "**Профилактика.** Все источники недетерминизма (время, случайность, окружение, сеть, файловая система) — параметры или порты; в корне композиции подставляются настоящие, в тестах — фиктивные.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "cs.abstraction-modularity.challenge",
    title: "Разорвать цикл зависимостей, не изменив поведения",
    scenario: [
      p("В магазине модуль `cart` зовёт `pricing` для пересчёта суммы, а `pricing` зовёт `cart.count`, чтобы узнать число товаров для скидки: цикл `cart ↔ pricing`. Из-за него `pricing` нельзя тестировать без корзины, а изменение любого из модулей затрагивает оба. Нужно устранить цикл так, чтобы наблюдаемое поведение (число товаров и сумма корзины) не изменилось, и доказать это."),
    ],
    requirements: [
      "Зафиксировать «золотой эталон»: не менее 300 детерминированных сценариев (последовательности добавления позиций), результаты — число товаров и сумма корзины",
      "Выделить общую чистую функцию в отдельный модуль и убрать зависимость `pricing → cart`",
      "Автоматически собрать граф зависимостей при загрузке модулей и проверить его на циклы до и после",
      "Показать, что отпечаток результатов до и после совпадает на всех сценариях",
      "Описать, почему этот способ разрыва допустим, и чем он отличается от инверсии зависимостей через интерфейс",
    ],
    constraints: [
      "Нельзя менять формулу скидки и правила округления",
      "Сценарии генерируются детерминированно (фиксированное начальное значение)",
      "Рефакторинг не должен менять публичные функции модуля `cart` (`newCart`, `count`, `addItem`)",
    ],
    acceptance: [
      "До рефакторинга в графе есть цикл `cart ↔ pricing`, после — нет",
      "Результаты всех 300 сценариев совпадают (один и тот же отпечаток)",
      "Связей стало больше (2 → 3), но зависимость стала однонаправленной: `cart → pricing → items`",
      "Объяснён критерий: общее вынесено в стабильный модуль без зависимостей",
    ],
    hints: [
      "Эталон строится до изменения кода: запишите результаты старой версии и сравнивайте с новой.",
      "Общее — это функция, которую нужны обоим модулям: подсчёт количества и суммы по списку позиций.",
      "Модуль, в который выносится общее, не должен ни от чего зависеть: тогда цикл не возникнет снова.",
    ],
    solution: [
      code("js", `// Рефакторинг без изменения поведения: разрыв цикла cart ↔ pricing. Проверка — «золотой эталон» (characterization test) и граф зависимостей, собранный при загрузке модулей
function load(sources) {
  const cache = {}, edges = [];
  const require = (from, name) => { edges.push([from, name]); if (!cache[name]) { cache[name] = {}; const mod = { exports: cache[name] }; new Function("require", "exports", "module", sources[name])((n) => require(name, n), mod.exports, mod); cache[name] = mod.exports; } return cache[name]; };
  const api = Object.fromEntries(Object.keys(sources).map((n) => [n, require("<тест>", n)]));
  return { api, edges: [...new Set(edges.filter(([f]) => f !== "<тест>").map((e) => e.join(">")))].sort() };
}
const BEFORE = {
  cart: \`const pricing = require("pricing");
         exports.newCart = () => ({ items: [], total: 0 });
         exports.count = (cart) => cart.items.reduce((s, i) => s + i.qty, 0);
         exports.addItem = (cart, item) => { cart.items.push(item); cart.total = pricing.priceCart(cart); };\`,
  pricing: \`const cart = require("cart");                       // цикл: pricing зовёт cart, cart зовёт pricing
         exports.priceCart = (c) => {
           const subtotal = c.items.reduce((s, i) => s + i.price * i.qty, 0);
           const n = cart.count(c);
           const discount = n >= 10 ? 0.1 : n >= 5 ? 0.05 : 0;
           return Math.round(subtotal * (1 - discount) * 100) / 100;
         };\`,
};
const AFTER = {
  items: \`exports.quantity = (items) => items.reduce((s, i) => s + i.qty, 0);       // общая чистая функция вынесена в отдельный модуль
         exports.subtotal = (items) => items.reduce((s, i) => s + i.price * i.qty, 0);\`,
  pricing: \`const items = require("items");                  // pricing больше не знает о корзине: работает со списком позиций
         exports.priceItems = (list) => {
           const discount = items.quantity(list) >= 10 ? 0.1 : items.quantity(list) >= 5 ? 0.05 : 0;
           return Math.round(items.subtotal(list) * (1 - discount) * 100) / 100;
         };\`,
  cart: \`const pricing = require("pricing"), items = require("items");
         exports.newCart = () => ({ items: [], total: 0 });
         exports.count = (cart) => items.quantity(cart.items);
         exports.addItem = (cart, item) => { cart.items.push(item); cart.total = pricing.priceItems(cart.items); };\`,
};
let seed = 77; const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
const scenarios = [...Array(300)].map(() => [...Array(1 + rnd(12))].map(() => ({ name: "p" + rnd(9), price: (1 + rnd(5000)) / 100, qty: 1 + rnd(4) })));
const runAll = (mods) => scenarios.map((sc) => { const c = mods.cart.newCart(); sc.forEach((it) => mods.cart.addItem(c, { ...it })); return [mods.cart.count(c), c.total]; });
const fnv = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, "0"); };

const before = load(BEFORE), after = load(AFTER);
const outBefore = runAll(before.api), outAfter = runAll(after.api);
const same = outBefore.filter((o, i) => JSON.stringify(o) === JSON.stringify(outAfter[i])).length;
console.log("золотой эталон: 300 сценариев (от 1 до 12 добавлений позиций), результаты — число товаров и сумма корзины");
console.log("   отпечаток результатов до рефакторинга:", fnv(JSON.stringify(outBefore)), "; после:", fnv(JSON.stringify(outAfter)), "; совпали сценариев:", same, "из", scenarios.length);
console.log("   пример сценария №1: товаров", outBefore[0][0], ", сумма", outBefore[0][1], "→ после", outAfter[0][0], ",", outAfter[0][1]);
const hasCycle = (edges) => { const g = {}; edges.forEach((e) => { const [a, b] = e.split(">"); (g[a] ??= []).push(b); }); const st = {}; const dfs = (n) => { st[n] = 1; for (const m of g[n] ?? []) { if (st[m] === 1 || (!st[m] && dfs(m))) return true; } st[n] = 2; return false; }; return Object.keys(g).some((n) => !st[n] && dfs(n)); };
console.log("\\nграф зависимостей, собранный при загрузке модулей:");
console.log("   до:   ", before.edges.join("  "), "; цикл:", hasCycle(before.edges) ? "есть" : "нет");
console.log("   после:", after.edges.join("  "), "; цикл:", hasCycle(after.edges) ? "есть" : "нет");
console.log("\\nвывод: структура изменилась (рёбер", before.edges.length, "→", after.edges.length + "; цикл разорван), наблюдаемое поведение — нет (" + same + " из " + scenarios.length + ")");`, { filename: "решение: эталон, рефакторинг, граф зависимостей", collapsed: true }),
      code("text", `золотой эталон: 300 сценариев (от 1 до 12 добавлений позиций), результаты — число товаров и сумма корзины
   отпечаток результатов до рефакторинга: 78629926 ; после: 78629926 ; совпали сценариев: 300 из 300
   пример сценария №1: товаров 7 , сумма 147.35 → после 7 , 147.35

граф зависимостей, собранный при загрузке модулей:
   до:    cart>pricing  pricing>cart ; цикл: есть
   после: cart>items  cart>pricing  pricing>items ; цикл: нет

вывод: структура изменилась (рёбер 2 → 3; цикл разорван), наблюдаемое поведение — нет (300 из 300)`, { filename: "результат: эталон совпал, цикл разорван" }),
      p("Старая версия: `cart` вызывает `pricing.priceCart(cart)`, а `pricing` вызывает `cart.count`; граф, собранный при загрузке модулей, содержит рёбра `cart>pricing` и `pricing>cart` — цикл. Рефакторинг выносит чистые функции `quantity` и `subtotal` в модуль `items` без зависимостей; `pricing` работает со списком позиций (`priceItems`) и больше не знает о корзине; `cart` использует и `pricing`, и `items`. Граф после: `cart>items`, `cart>pricing`, `pricing>items` — связей три вместо двух, но все направлены одним образом, цикла нет. Поведение подтверждено эталоном: отпечаток результатов `78629926` до и после, совпали 300 из 300 сценариев. Это способ «вынести общее»; альтернатива — инверсия зависимости: `pricing` объявляет интерфейс «источник количества», а `cart` его реализует — полезно, когда общее не является чистой функцией и принадлежит одной из сторон."),
    ],
  },

  interview: [
    iq("cs.abstraction-modularity.i1", "basic", "Что такое сокрытие информации и чем оно лучше разбиения по шагам алгоритма?", [
      ul(
        "Каждое проектное решение, которое может измениться, скрыто внутри одного модуля; остальные работают через его интерфейс.",
        "В задаче KWIC при смене способа хранения строк разбиение по шагам требует правки 4 модулей из 4, а разбиение по скрытым решениям — 1 из 5.",
        "Критерий разбиения — вероятные изменения, а не последовательность обработки.",
      ),
    ], ["Что скрывает модуль `Lines` в примере?", "Как оценить, что решение «скрыто» хорошо?"]),
    iq("cs.abstraction-modularity.i2", "basic", "Чем зацепление отличается от связности?", [
      ul(
        "Зацепление (coupling) — зависимость **между** модулями; нужно слабое. Связность (cohesion) — единство задачи **внутри** модуля; нужна сильная.",
        "Метрики: Ca, Ce, неустойчивость, циклы, радиус поражения — для зацепления; LCOM4 — для связности (в замере `OrderManager` — 3, разделённые классы — 1).",
        "Хороший модуль: высокая связность и слабое зацепление.",
      ),
    ]),
    iq("cs.abstraction-modularity.i3", "intermediate", "Что такое инверсия зависимостей и зачем она нужна?", [
      ul(
        "Ядро (правила предметной области) объявляет интерфейс; детали (база, платежи, интерфейс) реализуют его, и зависимость адаптера направлена внутрь.",
        "Результат: ядро не знает о деталях; в замере 18 зависимостей изнутри наружу превратились в 0, циклов стало 0, средний радиус поражения — 3,0 вместо 7,5.",
        "Реализации взаимозаменяемы: хранилище в памяти для тестов, база данных в продакшене.",
      ),
    ]),
    iq("cs.abstraction-modularity.i4", "intermediate", "Почему подмена глобального времени в тестах — плохая практика и чем её заменить?", [
      ul(
        "Глобальное состояние разделяется всем процессом: упавший тест оставляет подмену, конкурентные тесты мешают друг другу (в замере тест A получил чужую дату).",
        "Замена: время — параметр функции или порт `Clock` в конструкторе; в тесте — обычное значение, в корне композиции — настоящие часы.",
        "Побочный эффект: 1000 запусков без единой записи на диск и с одинаковым результатом.",
      ),
    ]),
    iq("cs.abstraction-modularity.i5", "intermediate", "Какие изменения интерфейса совместимы, а какие ломают клиентов?", [
      ul(
        "Параметры можно расширять, результаты — сужать; добавлять можно необязательное, новые функции, поля в результатах.",
        "Ломают: обязательный параметр, переименование, сужение параметра, расширение результата, удаление поля, новый член в реализуемом интерфейсе, новый вариант в перебираемом объединении (8 из 15 в замере).",
        "SemVer: несовместимое — мажорная версия, совместимое добавление — минорная, исправление — патч; помнить закон Хайрама о неявных зависимостях.",
      ),
    ]),
    iq("cs.abstraction-modularity.i6", "advanced", "Что такое протекающая абстракция? Приведите примеры и способы защиты.", [
      ul(
        "Абстракция, детали которой влияют на поведение: `0.1 + 0.2 !== 0.3`, `'😀'.length === 2`, сутки по 23 часа при смене времени, ORM с 101 запросом вместо 1.",
        "Защита: знать границы абстракции, тестировать граничные случаи, наблюдать стоимость (счётчик запросов, профилировщик), использовать явные типы (десятичная арифметика, нормализация строк, явные часовые пояса).",
        "Закон Спольски: любая нетривиальная абстракция протекает — задача не избежать, а знать, где.",
      ),
    ]),
    iq("cs.abstraction-modularity.i7", "engineering", "Как безопасно разорвать цикл зависимостей в работающей системе?", [
      ul(
        "Сначала зафиксировать поведение «золотым эталоном» (300 сценариев, отпечаток результатов); затем выделить общее в модуль без зависимостей или инвертировать зависимость через интерфейс; после — сравнить отпечаток и граф зависимостей.",
        "Делать маленькими шагами с запуском эталона на каждом; автоматическая проверка циклов в CI предотвращает возврат.",
        "Выбор способа: выносить общее — если это чистая функция; инверсия — если общее принадлежит одной из сторон и ядро не должно знать деталей.",
      ),
    ]),
    iq("cs.abstraction-modularity.i8", "debugging", "Нашли, что страница с 100 авторами выполняет 101 запрос к базе. Что делать?", [
      ul(
        "Это проблема N + 1 из-за ленивой загрузки связей: один запрос за списком и по запросу на каждый элемент.",
        "Исправление: предзагрузка (2 запроса) или `JOIN` (1 запрос), счётчик запросов в тестах, чтобы регрессия не вернулась; смотреть журнал SQL и план выполнения.",
        "Урок: абстракция «связь — атрибут» скрывает стоимость; код выглядит одинаково при 100 и при 10 000 авторов.",
      ),
    ]),
  ],

  exam: [
    mcq("cs.abstraction-modularity.e1", "foundation", "Сколько модулей пришлось править при замене способа хранения строк в KWIC в разбиении с общими данными и в разбиении с сокрытием информации?", ["1 и 1", "1 и 4", "4 из 4 и 1 из 5", "2 и 2"], 2, "При общих данных все четыре модуля знали формат: `shift`, `alphabetize` и `output` падали с `TypeError`, а `input` создавал старое представление; при сокрытии формат знал только модуль `Lines`, поэтому менялся один модуль из пяти."),
    mcq("cs.abstraction-modularity.e2", "foundation", "Чему равен LCOM4 класса `OrderManager`, склеенного из корзины, писем и хранилища?", ["3", "2", "1", "7"], 0, "Граф «методы — общие поля и вызовы» распадается на три компоненты: `{addItem, removeItem, total}`, `{renderEmail, sendConfirmation}`, `{save, load}` — они не имеют общих данных; семь — это число методов, а не компонент."),
    mcq("cs.abstraction-modularity.e3", "foundation", "Какое изменение API совместимо?", ["Добавлен обязательный параметр", "Функция переименована", "Из результата удалено поле", "Тип параметра расширен с `string` до `string | number`"], 3, "Функция, принимающая больше значений, по-прежнему обслуживает прежние вызовы (контравариантность параметров); остальные три варианта ломают клиентов (TS2554, TS2305, TS2339)."),
    mcq("cs.abstraction-modularity.e4", "intermediate", "Сколько запросов к базе выполнил цикл по 100 авторам с обращением к ленивому `a.books`?", ["1", "101", "100", "2"], 1, "Один запрос за списком авторов и по одному на каждого при первом обращении к `.books`: 1 + N = 101; `JOIN` даёт 1, предзагрузка — 2, а результат один и тот же (500 книг)."),
    mcq("cs.abstraction-modularity.e5", "intermediate", "Что показал замер со временем внутри функции при проверке 7 дней недели?", ["Подмена `Date` не нужна", "Тесты ускорились в 7 раз", "Результаты оказались разными для разных версий функции", "Потребовалось 7 подмен глобального `Date`; упавший тест оставил подмену включённой"], 3, "Время, взятое из глобального состояния, заставляет подменять `Date` в каждой проверке; если тест падает до восстановления, подмена остаётся и влияет на весь следующий код, а конкурентные тесты мешают друг другу."),
    mcq("cs.abstraction-modularity.e6", "intermediate", "Что дала инверсия зависимостей в примере магазина из 12 модулей?", ["Больше связей и циклов", "Только переименование модулей", "20 связей вместо 49, 0 циклов вместо 2, 0 нарушений направления вместо 18", "Запрет использовать базу данных"], 2, "Ядро перестало знать о базе, платежах и интерфейсе: детали реализуют интерфейсы ядра, зависимости направлены внутрь; граф стал проще и ацикличным, радиус поражения уменьшился с 7,5 до 3,0."),
    mcq("cs.abstraction-modularity.e7", "advanced", "Какие изменения API в замере сломали клиента? Выберите все.", ["Добавлен обязательный параметр", "Добавлен метод в интерфейс, который клиент только использует", "Тип результата расширен до `string | null`", "Добавлен метод в интерфейс, который клиент реализует"], [0, 2, 3], "Обязательный параметр (TS2554), расширение результата (TS2531) и новый член в реализуемом интерфейсе (TS2741) ломают сборку клиента; добавление метода в интерфейс, который клиент лишь вызывает, совместимо."),
    open("cs.abstraction-modularity.e8", "intermediate", "Объясните, как сокрытие информации, инверсия зависимостей и внедрение зависимостей вместе делают систему тестируемой и изменяемой.", [
      ul(
        "Сокрытие информации определяет границы модулей по решениям, которые могут измениться (хранение, время, база): правки локальны.",
        "Инверсия зависимостей направляет зависимости внутрь: ядро объявляет порты, адаптеры их реализуют; нет циклов и нарушений направления.",
        "Внедрение зависимостей передаёт реализации снаружи: тесты подставляют фиктивные (0 записей на диск, 0 подмен), корень композиции — настоящие; контрактные тесты гарантируют подстановку без нарушения обещаний.",
      ),
    ], ["Локальность изменений: границы по решениям", "Направление зависимостей и порты", "Параметры вместо глобального состояния, корень композиции", "Контрактные тесты как гарантия подстановки"]),
  ],

  mastery: [
    mcq("cs.abstraction-modularity.m1", "intermediate", "Почему `BuggyRepo` проходит проверку типов, но ломает клиентов?", ["Потому что типы всегда игнорируются", "Потому что контракт включает поведение (null вместо undefined, копирование данных), которое типы не выражают", "Потому что `Map` не подходит для хранилищ", "Потому что он написан не на классах"], 1, "Тип описывает форму, а не все обещания: возврат `undefined` вместо `null` и отдача внутренних ссылок нарушают поведенческий контракт (принцип подстановки Лисков); общий набор контрактных тестов поймал это — 2 из 5."),
    mcq("cs.abstraction-modularity.m2", "advanced", "Почему общий модуль `utils` с большим радиусом поражения в слоях допустим, а в «спагетти»-варианте опасен?", ["Потому что в слоях он стабилен (не зависит ни от кого), а в «спагетти»-варианте зависит от `config` и `logger` и замыкает цикл", "Потому что в слоях он меньше", "Потому что в слоях у него нет клиентов", "Потому что названия разные"], 0, "Радиус поражения показывает, сколько модулей затронет изменение; он безопасен, пока модуль стабилен (Ce = 0) и меняется редко. Если же сам модуль зависит от других (`utils → config, logger`), он замыкает циклы и становится каналом распространения изменений."),
    mcq("cs.abstraction-modularity.m3", "advanced", "Когда выносить общее в третий модуль, а когда инвертировать зависимость интерфейсом?", ["Всегда выносить общее", "Всегда инвертировать", "Выносить, если общее — чистая функция или данные без собственной роли; инвертировать, если общее принадлежит одной стороне и ядро не должно знать деталей", "Ни то ни другое: цикл безвреден"], 2, "Вынесенный модуль должен быть стабильным и без зависимостей (как `items` в упражнении); если же общее — поведение, которое реализует одна из сторон (адаптер), ядро объявляет интерфейс, а детали зависят от него."),
    open("cs.abstraction-modularity.m4", "advanced", "Вы унаследовали монолит без тестов, где модули зависят друг от друга по кругу, а изменения в одном месте регулярно ломают другое. Составьте план оздоровления структуры.", [
      ul(
        "Измерение: собрать граф зависимостей, найти циклы, нарушения направления, модули с наибольшим радиусом поражения и классы с LCOM4 > 1; приоритизировать по частоте изменений.",
        "Защита: «золотой эталон» на критичных сценариях (сотни входов, отпечаток результатов), контрактные тесты на границах; журнал и счётчики для протечек (запросы, время).",
        "Рефакторинг малыми шагами: разрыв циклов (вынос общего или инверсия), разделение «божественных» классов, замена скрытых зависимостей (время, окружение, сеть) параметрами и портами; после каждого шага — эталон и граф.",
        "Закрепление: проверка циклов и направления в CI, правила публичного интерфейса (`exports`, видимость), версионирование API по правилам совместимости.",
      ),
    ], ["Метрики структуры и приоритеты", "Эталон и контрактные тесты до изменений", "Малые шаги: циклы, порты, параметры вместо глобального состояния", "Автоматические проверки в CI и версионирование"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "cs.abstraction-modularity.f1", front: "Сокрытие информации?", back: "Модуль скрывает решение, которое может измениться. KWIC: смена хранения строк — 4 из 4 модулей в разбиении по шагам против 1 из 5 в разбиении по решениям." },
    { id: "cs.abstraction-modularity.f2", front: "Зацепление и связность?", back: "Зацепление между модулями — слабое; связность внутри — сильная. Метрики: Ca, Ce, I = Ce/(Ca+Ce), циклы, радиус поражения; LCOM4 (OrderManager: 3 → после разделения 1, 1, 1)." },
    { id: "cs.abstraction-modularity.f3", front: "Граф зависимостей магазина?", back: "«Как получилось»: 49 связей, 2 цикла (7 и 3), 18 нарушений направления, радиус 7,5. Слои и инверсия: 20, 0, 0, 3,0." },
    { id: "cs.abstraction-modularity.f4", front: "Инверсия и внедрение зависимостей?", back: "Ядро объявляет порты, адаптеры реализуют (зависимость внутрь). Зависимости — параметры конструктора, корень композиции собирает. Тест: 7 подмен Date против 0; 1000 запусков — 0 записей на диск." },
    { id: "cs.abstraction-modularity.f5", front: "Контракты и подстановка?", back: "Реализация-замена принимает не меньше, обещает не меньше. Один набор из 5 контрактных тестов: Memory 5/5, File 5/5, Buggy 2/5 (undefined вместо null, нет копий)." },
    { id: "cs.abstraction-modularity.f6", front: "Совместимость API?", back: "Параметры расширять можно, сужать нельзя; результаты сужать можно, расширять нельзя. Ломают: обязательный параметр, переименование, удаление поля, новый член в реализуемом интерфейсе. 7 совместимых и 8 ломающих из 15." },
    { id: "cs.abstraction-modularity.f7", front: "Протечки абстракций?", back: "0.1 + 0.2 ≠ 0.3; '😀'.length = 2; 'é' в разных нормализациях не равны; сутки 23 часа; sort() даёт [1, 10, 9]; ORM: 101 запрос вместо 1. Закон Спольски: любая нетривиальная абстракция протекает." },
    { id: "cs.abstraction-modularity.f8", front: "Рефакторинг цикла?", back: "Эталон из 300 сценариев → вынести общее (items) или инвертировать зависимость → сравнить отпечаток (78629926 до и после) и граф (цикл cart ↔ pricing разорван, 2 → 3 связи)." },
  ],

  sources: [
    { title: "Parnas D. On the Criteria To Be Used in Decomposing Systems into Modules (CACM, 1972)", url: "https://doi.org/10.1145/361598.361623", publisher: "Other" },
    { title: "Liskov B., Wing J. A Behavioral Notion of Subtyping (ACM TOPLAS, 1994)", url: "https://doi.org/10.1145/197320.197383", publisher: "Other" },
    { title: "Chidamber S., Kemerer C. A Metrics Suite for Object Oriented Design (IEEE TSE, 1994)", url: "https://doi.org/10.1109/32.295895", publisher: "Other" },
    { title: "Spolsky J. The Law of Leaky Abstractions (2002)", url: "https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/", publisher: "Other" },
    { title: "Semantic Versioning 2.0.0", url: "https://semver.org/", publisher: "Other" },
    { title: "Hyrum's Law", url: "https://www.hyrumslaw.com/", publisher: "Other" },
    { title: "Ousterhout J. A Philosophy of Software Design", url: "https://web.stanford.edu/~ouster/cgi-bin/book.php", publisher: "Other" },
    { title: "Cockburn A. Hexagonal Architecture (Ports and Adapters)", url: "https://alistair.cockburn.us/hexagonal-architecture/", publisher: "Other" },
    { title: "Fowler M. Refactoring: Improving the Design of Existing Code", url: "https://martinfowler.com/books/refactoring.html", publisher: "Other" },
    { title: "Feathers M. Working Effectively with Legacy Code (characterization tests)", url: "https://www.oreilly.com/library/view/working-effectively-with/0131177052/", publisher: "Other" },
    { title: "ECMAScript Language Specification: Modules", url: "https://tc39.es/ecma262/#sec-modules", publisher: "ECMA" },
    { title: "Node.js documentation: Package entry points (exports)", url: "https://nodejs.org/api/packages.html#package-entry-points", publisher: "Other" },
  ],
};
