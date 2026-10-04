import type { Topic } from "../../types";
import {
  annotated,
  beforeAfter,
  code,
  def,
  diagram,
  exercise,
  h,
  insight,
  iq,
  mcq,
  note,
  ol,
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

export const gridBasics: Topic = {
  id: "css.grid-basics",
  slug: "grid-basics",
  domain: "css",
  module: "grid",
  title: "Grid: треки, линии и размещение",
  titleEn: "CSS Grid: tracks, lines, fr units, gap, implicit grid and auto-placement",
  summary:
    "Grid — двумерная раскладка: вы описываете **столбцы и строки** контейнера, а браузер размещает элементы по ячейкам. Тема разбирает явную и неявную сетки, треки и линии, единицу `fr`, `repeat()`, `minmax()`, `gap`, размещение по номерам линий и через `span`, автоматическое размещение, выравнивание элементов (`place-items`) и содержимого (`place-content`), а также ловушку `1fr` с длинным содержимым.",
  minutes: 60,
  prerequisites: ["css.display-flow", "css.flexbox-basics"],
  tags: ["grid", "grid-template-columns", "grid-template-rows", "fr", "repeat", "minmax", "gap", "grid-auto-rows", "grid-auto-flow", "grid-column", "grid-row", "span", "implicit grid", "place-items", "place-content", "grid lines", "auto-placement"],
  keyConcepts: [
    { term: "Две оси сразу", text: "В отличие от Flexbox, Grid управляет и строками, и столбцами. Контейнер объявляет **треки** (столбцы и строки), элементы занимают **ячейки** и **области**." },
    { term: "Единица `fr`", text: "Доля свободного места: `1fr 2fr` делит доступную ширину в пропорции 1:2 **после** вычета `gap` и треков с фиксированным размером." },
    { term: "Линии, а не только ячейки", text: "Размещение идёт по **номерам линий** (`grid-column: 1 / 3` — от первой линии до третьей) или через `span`. Отрицательные номера считаются с конца явной сетки." },
    { term: "Явная и неявная сетки", text: "Треки, описанные в `grid-template-*`, образуют явную сетку. Элементы, не помещающиеся в неё, создают **неявные** треки, размеры которых задают `grid-auto-rows/columns`." },
    { term: "`1fr` не равно `minmax(0, 1fr)`", text: "Минимум трека `1fr` — размер содержимого (`min-content`): длинное слово растягивает колонку. `minmax(0, 1fr)` позволяет колонке сжиматься." },
  ],
  sections: [
    section("definition", [
      def("Grid-контейнер", "Элемент с `display: grid` или `inline-grid`. Его прямые дети становятся grid-элементами и размещаются в ячейках сетки.", "grid container"),
      def("Трек", "Столбец или строка сетки: промежуток между двумя соседними линиями. Размер трека задаётся в `grid-template-columns`/`rows` или неявно.", "grid track"),
      def("Линия", "Разделитель между треками, нумеруется с единицы. У сетки из трёх столбцов четыре вертикальные линии: 1, 2, 3, 4 (и −4, −3, −2, −1 с конца).", "grid line"),
      def("Ячейка и область", "Ячейка — пересечение строки и столбца. Область — прямоугольная группа ячеек, ограниченная четырьмя линиями.", "grid cell / area"),
      def("Неявная сетка", "Треки, созданные автоматически для элементов, не поместившихся в явно заданную сетку; размеры определяют `grid-auto-rows` и `grid-auto-columns`.", "implicit grid"),
    ]),

    section("why", [
      h("Что Grid делает проще, чем Flexbox и поток"),
      ul(
        "**Макет страницы:** шапка, боковая панель, содержимое, подвал в двух измерениях.",
        "**Галереи и каталоги:** ровные столбцы и строки без «рваного» края последней линии.",
        "**Формы:** подписи и поля в выровненных столбцах.",
        "**Наложение:** несколько элементов в одной ячейке без позиционирования.",
        "**Адаптивность:** `repeat(auto-fit, minmax(...))` создаёт число колонок по ширине без медиазапросов.",
      ),
      h("Grid и Flexbox дополняют друг друга"),
      p("Flexbox начинает с **содержимого** и распределяет место вдоль одной оси; Grid начинает с **сетки** и размещает в ней содержимое. Для макета страницы и двумерных блоков берите Grid; для строки кнопок или карточки внутри — Flexbox."),
      insight("Выбирайте инструмент по вопросу: «Что важнее — размеры содержимого или структура?» Если структура (колонки, строки, области) — Grid. Если содержимое определяет размеры в одну линию — Flexbox."),
    ]),

    section("mental-model", [
      p("Представьте **лист в клетку**. Вы сначала размечаете страницу линиями: «три столбца, две строки, зазоры между клетками». Затем говорите каждому блоку: «ты занимаешь клетки от линии 1 до линии 3 по горизонтали». Если вы ничего не говорите, блоки заполняют клетки по порядку, слева направо, сверху вниз. Если клеток не хватает, браузер сам дорисовывает строки (неявная сетка)."),
      diagram(
        `
        grid-template-columns: 200px 1fr 1fr;     grid-template-rows: auto auto;

          линия 1    линия 2          линия 3          линия 4
             │  200px  │      1fr       │      1fr       │
          ───┼─────────┼────────────────┼────────────────┼─── линия 1 (строка)
             │  1      │  2             │  3             │
          ───┼─────────┼────────────────┼────────────────┼─── линия 2
             │  4      │  5             │  6             │
          ───┼─────────┼────────────────┼────────────────┼─── линия 3

        grid-column: 2 / 4;  — элемент от линии 2 до линии 4 (две колонки)
        grid-column: 1 / -1; — на всю ширину
        `,
        "Линии и треки",
      ),
      table(
        ["Свойство", "Что задаёт"],
        [
          ["`grid-template-columns`, `grid-template-rows`", "Явные столбцы и строки"],
          ["`gap`, `row-gap`, `column-gap`", "Расстояния между треками"],
          ["`grid-auto-rows`, `grid-auto-columns`, `grid-auto-flow`", "Неявные треки и направление автоматического размещения"],
          ["`grid-column`, `grid-row`", "Положение элемента по линиям или `span`"],
          ["`justify-items`, `align-items`, `place-items`", "Выравнивание **элементов внутри их ячеек**"],
          ["`justify-content`, `align-content`, `place-content`", "Выравнивание **сетки внутри контейнера** (если треки меньше контейнера)"],
        ],
        "Основные свойства",
      ),
    ]),

    section("technical", [
      h("Описание треков"),
      code(
        "css",
        `
        .layout {
          display: grid;
          grid-template-columns: 200px 1fr 2fr;       /* три столбца: фиксированный и две гибкие доли */
          grid-template-rows: auto 1fr auto;          /* шапка, содержимое, подвал */
          gap: 1rem 1.5rem;                           /* row-gap column-gap */
        }

        .gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);      /* три равные колонки */
          gap: 1rem;
        }
        `,
        { filename: "grid-tracks.css" },
      ),
      ul(
        "**Фиксированные значения:** `200px`, `12rem`, `30%`.",
        "**`fr`:** доля свободного места. `1fr 2fr` при ширине 600px и без `gap` даёт 200px и 400px; при `gap: 30px` — 190px и 380px (место для долей = 600 − 30).",
        "**`auto`:** по содержимому, с растяжением на свободное место (для строк по умолчанию).",
        "**`min-content`, `max-content`, `fit-content(...)`:** размер по содержимому.",
        "**`minmax(min, max)`:** трек не меньше `min` и не больше `max`; `minmax(0, 1fr)` — гибкий трек без нижнего предела по содержимому.",
        "**`repeat(n, треки)`:** повторение; `repeat(3, 1fr)` эквивалентно `1fr 1fr 1fr`. С `auto-fit`/`auto-fill` число повторений вычисляется по ширине.",
      ),
      h("Размещение по линиям"),
      code(
        "css",
        `
        .hero    { grid-column: 1 / -1; }          /* от первой до последней линии: на всю ширину */
        .sidebar { grid-column: 1 / 2; grid-row: 2 / 4; }
        .wide    { grid-column: span 2; }          /* занять две колонки, начало определяет автоматическое размещение */
        .box     { grid-column: 2 / span 2; grid-row: 1 / span 3; }   /* начиная с линии 2, шириной 2 колонки */
        `,
        { filename: "grid-placement.css" },
      ),
      ul(
        "`grid-column: 2 / 4` — от линии 2 до линии 4 (занимает два трека: 2 и 3).",
        "**Конец исключительно:** `grid-column: 1 / 3` занимает столбцы 1 и 2, а не 1–3.",
        "**Отрицательные номера** считаются с конца **явной** сетки: `-1` — последняя линия.",
        "`span n` задаёт ширину в треках; позиция тогда определяется автоматически или другой границей.",
      ),
      h("Неявная сетка и автоматическое размещение"),
      code(
        "css",
        `
        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-auto-rows: minmax(4rem, auto);      /* высота строк, созданных автоматически */
          grid-auto-flow: row;                      /* row (по умолчанию) | column | dense */
        }
        `,
        { filename: "grid-implicit.css" },
      ),
      ul(
        "Если элементов больше, чем ячеек явной сетки, браузер добавляет **неявные строки** (при `grid-auto-flow: row`) высотой `grid-auto-rows` (по умолчанию `auto`).",
        "`grid-auto-flow: column` заполняет сетку по столбцам; тогда неявно добавляются **столбцы** (`grid-auto-columns`).",
        "`dense` заполняет «дыры» мелкими элементами, но **меняет визуальный порядок** — осторожно с доступностью.",
        "Элементы без явных координат размещаются по порядку DOM в первую подходящую свободную ячейку.",
      ),
      h("Выравнивание"),
      table(
        ["Свойство", "Объект выравнивания", "Значения"],
        [
          ["`justify-items` / `align-items` / `place-items`", "Элементы внутри своих ячеек (по строчной / блочной оси)", "`stretch` (по умолчанию), `start`, `end`, `center`, `baseline`"],
          ["`justify-self` / `align-self` / `place-self`", "Один элемент", "Те же значения"],
          ["`justify-content` / `align-content` / `place-content`", "Сетка в контейнере, если треки не занимают всё место", "`start`, `end`, `center`, `space-between`, `space-around`, `space-evenly`, `stretch`"],
        ],
        "Выравнивание в Grid",
      ),
      note("В отличие от Flexbox, у Grid оси называются по направлению письма: «строчная» (inline) ось идёт вдоль строк текста, «блочная» (block) — поперёк. В горизонтальных языках `justify-*` — по горизонтали, `align-*` — по вертикали."),
      h("Расстояния: `gap`"),
      p("`gap` задаёт расстояние между треками: `row-gap` между строками, `column-gap` между столбцами. Оно не добавляется у внешних краёв. Доли `fr` вычисляются **после** вычета `gap`."),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        .page {
          display: grid;
          grid-template-columns: 16rem minmax(0, 1fr);
          grid-template-rows: auto 1fr auto;
          gap: 1rem;
          min-height: 100dvh;
        }

        .page > header, .page > footer { grid-column: 1 / -1; }
        .page > nav { grid-row: 2; }
        .page > main { grid-row: 2; }
        `,
        [
          { line: 2, text: "Контейнер включает Grid: прямые дети становятся элементами сетки." },
          { line: 3, text: "Два столбца: фиксированная панель и гибкий остаток; `minmax(0, 1fr)` позволяет основной колонке сжиматься ниже длинного слова." },
          { line: 4, text: "Три строки: шапка и подвал по содержимому, средняя забирает всё остальное." },
          { line: 5, text: "Расстояние между треками по обеим осям." },
          { line: 9, text: "Шапка и подвал растягиваются на всю ширину: от первой линии до последней." },
          { line: [10, 11], text: "Панель и содержимое ставятся во вторую строку; столбец определяется автоматически — первый свободный." },
        ],
        "syntax.css",
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <!doctype html>
        <meta charset="utf-8">
        <title>Grid</title>
        <style>
          body { font: 16px/1.5 system-ui, sans-serif; margin: 1rem; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
          .grid > div { padding: 0.75rem; background: #c5cae9; }
          .wide { grid-column: span 2; background: #7986cb !important; color: #fff; }
          .full { grid-column: 1 / -1; background: #3949ab !important; color: #fff; }
        </style>
        <div class="grid">
          <div>1</div><div>2</div><div>3</div>
          <div class="wide">span 2</div><div>5</div>
          <div class="full">1 / -1: на всю ширину</div>
        </div>
        `,
        { filename: "grid-basics.html", runnable: true },
      ),
    ]),

    section("detailed-example", [
      p("Каркас страницы: шапка и подвал на всю ширину, боковая панель и содержимое посередине. Измените ширину окна: при нехватке места панель переходит над содержимым. Обратите внимание на `minmax(0, 1fr)` и на то, как элементы получают позиции."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Каркас на Grid</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; font: 1rem/1.5 system-ui, sans-serif; }

          .page { display: grid; grid-template-columns: 14rem minmax(0, 1fr); grid-template-rows: auto 1fr auto; gap: 1rem; min-height: 100dvh; padding: 1rem; }
          .page > * { padding: 1rem; border-radius: 0.5rem; }
          header, footer { grid-column: 1 / -1; background: #1a237e; color: #fff; }
          nav { background: #e8eaf6; }
          main { background: #fff3e0; overflow-wrap: anywhere; }

          @media (max-width: 40rem) {
            .page { grid-template-columns: minmax(0, 1fr); }
          }
        </style>
        <div class="page">
          <header>Шапка</header>
          <nav aria-label="Разделы">Панель</nav>
          <main>Основное содержимое. ОченьДлинноеСловоКоторомуНекудаПереноситься не растягивает колонку, потому что трек minmax(0, 1fr).</main>
          <footer>Подвал</footer>
        </div>
        </html>
        `,
        { filename: "grid-page.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Строка", "Что делает"],
        [
          ["`grid-template-columns: 14rem minmax(0, 1fr)`", "Фиксированная панель и гибкая основная колонка, которая может сжиматься"],
          ["`grid-template-rows: auto 1fr auto`", "Шапка и подвал по содержимому, средняя строка занимает остаток высоты"],
          ["`header, footer { grid-column: 1 / -1 }`", "Шапка и подвал на всю ширину; строка определяется порядком в DOM"],
          ["`nav`, `main` без координат", "Размещаются автоматически в следующие свободные ячейки второй строки"],
          ["`@media (max-width: 40rem)`", "Один столбец: элементы идут друг под другом в порядке DOM"],
        ],
        "Что делает каркас",
      ),
      ul(
        "Порядок DOM — «шапка, панель, содержимое, подвал» — совпадает с порядком чтения; визуальная раскладка получается без `order`.",
        "`gap` и `padding` разделены: `gap` — между элементами, `padding` — внутри.",
        "`min-height: 100dvh` и `1fr` у средней строки прижимают подвал к низу окна.",
      ),
    ]),

    section("internals", [
      h("Как Grid определяет размеры треков"),
      steps(
        [
          ["Инициализация треков", "Для каждого трека определяются минимальный и максимальный размеры по `grid-template-*` (для `auto` — по содержимому)."],
          ["Базовые размеры", "Треки получают базовый размер: максимум из минимальных вкладов элементов (`min-content`) и заданного минимума."],
          ["Разрешение `fr`", "Свободное место (за вычетом фиксированных треков и `gap`) делится между `fr`-треками пропорционально; если минимум трека больше доли, он забирает свой минимум, и доли пересчитываются."],
          ["Растяжение `auto`", "Оставшееся место распределяется между `auto`-треками (в зависимости от `justify-content`/`align-content`)."],
          ["Размещение элементов", "Элементы занимают ячейки/области; для неявных элементов создаются дополнительные треки."],
        ],
        "Алгоритм определения размеров (упрощённо)",
      ),
      h("`1fr` и минимальный размер содержимого"),
      p("Минимум трека `1fr` равен `minmax(auto, 1fr)`: нижний предел — минимальный размер содержимого. Если слово длиннее доли, колонка растёт. В нашем замере сетка `1fr 1fr` шириной 600px с длинным словом в первой ячейке дала колонки **388px и 212px**; с `minmax(0, 1fr)` — по **300px**."),
      code(
        "css",
        `
        .cols  { grid-template-columns: 1fr 1fr; }                              /* может «взорваться» от длинного слова */
        .safe  { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }       /* строго равные доли */
        `,
        { filename: "fr-blowout.css" },
      ),
      h("Инструменты"),
      ul(
        "DevTools: значок `grid` рядом с контейнером включает **наложение**: линии, номера, имена областей, размеры треков.",
        "Вкладка Layout показывает все сетки страницы и позволяет включить подписи треков.",
        "`getComputedStyle(grid).gridTemplateColumns` возвращает размеры треков в пикселях (используемые значения), например `\"200px 200px 200px\"`.",
      ),
      code(
        "js",
        `
        const grid = document.querySelector(".gallery");
        const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").map(parseFloat);   // [186.66, 186.67, 186.67]
        const total = cols.reduce((a, b) => a + b, 0);
        `,
        { filename: "grid-computed.js" },
      ),
    ]),

    section("mistakes", [
      h("Ошибка 1. `1fr` вместо `minmax(0, 1fr)`"),
      wrongRight(
        "css",
        {
          code: `
            .layout { display: grid; grid-template-columns: 16rem 1fr; }
            /* длинное слово или таблица в основной колонке растягивает страницу */
          `,
          note: "Минимум `1fr` — размер содержимого: колонка не сжимается ниже длинного слова.",
        },
        {
          code: `
            .layout { display: grid; grid-template-columns: 16rem minmax(0, 1fr); }
          `,
          note: "`minmax(0, 1fr)` разрешает колонке сжиматься; длинные слова нужно переносить.",
        },
      ),
      h("Ошибка 2. Путать номера линий и треков"),
      p("`grid-column: 1 / 3` занимает **два** столбца (1 и 2), а не три. Номер второй границы — это линия **после** последнего занятого трека."),
      h("Ошибка 3. `repeat(3, 33.33%)` с `gap`"),
      p("Три трека по 33,33 % вместе с `gap` превышают ширину. Используйте `fr`: `repeat(3, 1fr)` вычитает `gap` автоматически."),
      h("Ошибка 4. Отрицательные номера и неявная сетка"),
      p("`grid-column: 1 / -1` охватывает только **явную** сетку. Если колонки создаются автоматически (`auto-fill`), `-1` указывает на последнюю явную линию, а не на конец неявных столбцов."),
      h("Ошибка 5. `grid-auto-flow: dense` и порядок чтения"),
      p("`dense` «заполняет дыры», меняя визуальный порядок, но не порядок фокуса и чтения. Используйте осознанно (галереи), но не для форм и навигации."),
      h("Ошибка 6. Задавать размеры элементам вместо треков"),
      p("`width: 33%` у grid-элементов внутри трека ведёт к странностям: проценты считаются от **трека**, а не контейнера. Размеры задавайте на уровне сетки."),
      h("Ошибка 7. Жёсткие высоты строк"),
      p("`grid-template-rows: 100px 300px` обрезает содержимое при увеличении шрифта. Используйте `auto`, `minmax(min, auto)` и `fr`."),
      h("Ошибка 8. Забыть `align-items`"),
      p("По умолчанию элементы растягиваются на ячейку (`stretch`). Если нужно сохранить размер по содержимому, задайте `align-items: start` или `align-self`."),
    ]),

    section("antipatterns", [
      ul(
        "**Сетка через `float` и проценты** в новом коде.",
        "**Позиционирование каждого элемента по номерам линий** без осмысленных областей (см. следующую тему).",
        "**Жёсткие размеры в `px` для треков** без `minmax()` и `fr`.",
        "**Вложенные Grid на каждый элемент:** лишняя сложность.",
        "**`1fr` во всех колонках** без `minmax(0, 1fr)` там, где есть пользовательский контент.",
        "**`order` и `dense` для смысловых перестановок.**",
        "**Использование Grid для одной строки кнопок,** где достаточно Flexbox.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Описывайте сетку на контейнере,** а не размеры на элементах.",
        "**`fr` и `minmax()` вместо процентов и фиксированных пикселей;** `minmax(0, 1fr)` для колонок с пользовательским текстом.",
        "**`gap`** для расстояний.",
        "**Порядок DOM = порядок чтения;** сетка определяет визуальное расположение.",
        "**Для адаптивных галерей** — `repeat(auto-fit, minmax(…, 1fr))` (следующие темы).",
        "**`grid-template-areas`** для макетов страниц (тема об именованных областях).",
        "**Проверяйте DevTools:** наложение сетки показывает линии и размеры треков.",
        "**Сочетайте с Flexbox:** Grid для макета, Flexbox для содержимого ячеек.",
      ),
    ]),

    section("edge-cases", [
      h("Элементы за пределами явной сетки"),
      p("Если элементу явно указана линия вне сетки (`grid-column: 5` при трёх столбцах), браузер создаёт неявные столбцы до нужного номера. Их ширина — `grid-auto-columns` (по умолчанию `auto`)."),
      h("`auto` и растяжение треков"),
      p("Треки `auto` растягиваются, чтобы заполнить свободное место (`justify-content: normal` ведёт себя как `stretch`). Если нужно этого избежать, задайте `justify-content: start` или используйте `fit-content()`."),
      h("Пустые элементы и `gap`"),
      p("Пустая ячейка сетки не занимает места, но `gap` вокруг неё остаётся. Скрытый элемент (`display: none`) не участвует в размещении; `visibility: hidden` занимает ячейку."),
      h("Несколько элементов в одной ячейке"),
      p("Можно явно поместить элементы в одну область (`grid-area: 1 / 1`): они накладываются друг на друга по порядку DOM и `z-index`. Это способ наложения без `position: absolute`."),
      h("`align-content` и сетка меньше контейнера"),
      p("Если сумма треков меньше контейнера (например, фиксированные пиксели), распределить пространство можно `justify-content` и `align-content`: `center`, `space-between` и т. д."),
      h("Подсетка"),
      p("Вложенный Grid по умолчанию не наследует линии родителя. Чтобы выровнять внутренние элементы по линиям внешней сетки, используется `subgrid` (отдельная тема)."),
      h("Печать и разрывы"),
      p("Grid-контейнеры плохо разрываются между страницами; для печатных стилей рассмотрите упрощённую раскладку (`display: block`)."),
    ]),

    section("related", [
      ul(
        "[Именованные области и размещение](/learn/css/grid-areas-placement) — `grid-template-areas`, `grid-area`, `auto-flow`.",
        "[Адаптивные сетки](/learn/css/grid-responsive) — `auto-fit`, `auto-fill`, `minmax()`.",
        "[Subgrid и выравнивание](/learn/css/subgrid-alignment) — единая сетка для вложенных элементов.",
        "[Flexbox: основы](/learn/css/flexbox-basics) — одномерная раскладка.",
        "[Размеры и overflow](/learn/css/overflow-sizing) — `min-content`, `max-content`, `minmax(0, 1fr)`.",
        "[Единицы и функции](/learn/css/units-math) — `fr`, `rem`, `clamp()`.",
        "Из других курсов: **дизайн** — модульные сетки и ритм.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Сетка на float и процентах",
          code: `
            .col { float: left; width: 31.333%; margin: 0 1% 1rem; }
            .col:nth-child(3n + 1) { clear: left; }
            .row::after { content: ""; display: table; clear: both; }
          `,
          note: "Проценты и поля складываются в ошибки, нужны `clear` и очищающие хаки, высота строки зависит от самого высокого элемента только с дополнительными приёмами.",
        },
        {
          title: "Grid",
          code: `
            .row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
          `,
          note: "Одно объявление создаёт три равные колонки с расстоянием; высоты строк выравниваются автоматически.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.grid-basics.ex1",
      title: "Вычислите ширины колонок",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Контейнер шириной 600px. Определите ширины колонок:"),
        ol(
          "`grid-template-columns: 1fr 2fr`",
          "`grid-template-columns: 1fr 2fr; gap: 30px`",
          "`grid-template-columns: 200px 1fr 1fr`",
          "`grid-template-columns: repeat(3, 1fr); gap: 20px`",
        ),
      ],
      hints: ["`gap` вычитается до распределения `fr`.", "Фиксированные треки вычитаются из свободного места."],
      checks: ["200/400; 190/380; 200/200/200; ≈186,67 × 3"],
      solution: [
        table(
          ["Случай", "Результат", "Расчёт"],
          [
            ["1", "200px и 400px", "600 / 3 = 200 на долю"],
            ["2", "190px и 380px", "(600 − 30) / 3 = 190"],
            ["3", "200px, 200px, 200px", "(600 − 200) / 2 = 200"],
            ["4", "≈186,67px × 3", "(600 − 2×20) / 3 = 186,67"],
          ],
        ),
      ],
    }),
    exercise({
      id: "css.grid-basics.ex2",
      title: "Разместите элементы по линиям",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Сетка из трёх колонок и трёх строк. Напишите правила размещения: A — на всю ширину сверху; B — левая колонка на строки 2–3; C — две правые колонки в строке 2; D — правая колонка в строке 3."),
      ],
      starter: {
        lang: "html",
        code: `
          <style>
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 4rem); gap: 0.5rem; }
            .grid > div { background: #c5cae9; padding: 0.5rem; }
          </style>
          <div class="grid"><div class="a">A</div><div class="b">B</div><div class="c">C</div><div class="d">D</div></div>
        `,
      },
      hints: ["Конец диапазона исключительно: `2 / 4` — колонки 2 и 3.", "Как записать «на всю ширину»?", "Что делает `span`?"],
      checks: ["A: `1 / -1`", "B: `1 / 2` и `2 / 4`", "C: `2 / 4`, строка 2", "D: колонка 3, строка 3"],
      solution: [
        code(
          "css",
          `
          .a { grid-column: 1 / -1; grid-row: 1; }
          .b { grid-column: 1; grid-row: 2 / 4; }
          .c { grid-column: 2 / 4; grid-row: 2; }
          .d { grid-column: 3; grid-row: 3; }
          `,
        ),
        ul(
          "`1 / -1` — от первой до последней линии явной сетки: вся ширина.",
          "`grid-row: 2 / 4` занимает строки 2 и 3 (конец исключительно).",
          "Можно использовать `span`: `.c { grid-column: span 2 }` (с явной строкой), но номера линий нагляднее.",
        ),
      ],
    }),
    exercise({
      id: "css.grid-basics.ex3",
      title: "Колонка взорвалась",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("В сетке `1fr 1fr` длинное слово в первой ячейке растягивает колонку до 388px вместо 300px. Объясните причину и исправьте тремя способами."),
      ],
      starter: {
        lang: "html",
        code: `
          <style>
            .g { display: grid; grid-template-columns: 1fr 1fr; width: 600px; }
          </style>
          <div class="g"><div>ОченьДлинноеСловоКоторомуНекудаПереноситься</div><div>b</div></div>
        `,
      },
      hints: ["Каков минимум у трека `1fr`?", "Какие значения заменяют минимум по содержимому?"],
      checks: ["Названа причина: `minmax(auto, 1fr)`", "Три способа"],
      solution: [
        ul(
          "**Причина:** `1fr` — это `minmax(auto, 1fr)`; минимум `auto` равен `min-content`, то есть длине самого длинного слова.",
          "**Способ 1:** `minmax(0, 1fr)` вместо `1fr` — колонки точно по 300px.",
          "**Способ 2:** `min-width: 0` у grid-элемента (или `overflow` не `visible`).",
          "**Способ 3:** `overflow-wrap: anywhere` — уменьшает `min-content`, и колонка сжимается.",
        ),
        code("css", `.g { grid-template-columns: repeat(2, minmax(0, 1fr)); }`),
      ],
    }),
  ],

  challenge: {
    id: "css.grid-basics.challenge",
    title: "Форма на Grid с выровненными подписями и полями",
    scenario: [
      p("Форма профиля: подписи слева, поля справа, две строки с двумя полями, широкое текстовое поле на всю ширину и кнопки внизу справа. На узком экране всё превращается в одну колонку. Нужно реализовать на Grid, проверить выравнивание и доступность."),
    ],
    requirements: [
      "Двухколоночная форма: подписи и поля выровнены по колонкам",
      "Текстовое поле на всю ширину (`1 / -1`)",
      "Кнопки в нижнем правом углу",
      "На ширине менее 36rem — одна колонка",
      "Метки привязаны к полям (`label for`)",
    ],
    constraints: [
      "Без таблиц и `float`",
      "Порядок DOM совпадает с порядком чтения",
    ],
    acceptance: [
      "Левые края полей совпадают по вертикали",
      "Широкое поле занимает всю ширину",
      "Кнопки справа внизу",
      "На узком экране метки над полями",
    ],
    hints: [
      "Как расположить метку и поле в двух колонках без обёрток?",
      "Что даёт `grid-column: 1 / -1`?",
      "Как выровнять кнопки по правому краю?",
    ],
    solution: [
      code(
        "html",
        `
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          form { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 0.75rem 1rem; align-items: center; max-width: 36rem; }
          form label { justify-self: end; }
          form input, form textarea { font: inherit; padding: 0.4rem 0.6rem; width: 100%; }
          form .wide { grid-column: 1 / -1; }
          form label.wide { justify-self: start; }
          form .actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 0.5rem; }
          @media (max-width: 36rem) {
            form { grid-template-columns: minmax(0, 1fr); }
            form label { justify-self: start; }
          }
        </style>
        <form>
          <label for="n">Имя</label><input id="n">
          <label for="e">Почта</label><input id="e" type="email">
          <label class="wide" for="m">Сообщение</label>
          <textarea class="wide" id="m" rows="4"></textarea>
          <div class="actions"><button type="button">Отмена</button><button>Сохранить</button></div>
        </form>
        `,
        { runnable: true, lineNumbers: true },
      ),
      ul(
        "**Колонки:** `max-content` для подписей (ширина по самой длинной подписи) и `minmax(0, 1fr)` для полей: поля выровнены по одной вертикали.",
        "**Без обёрток:** метки и поля — прямые дети формы; Grid размещает их парами в порядке DOM.",
        "**Широкое поле:** `grid-column: 1 / -1`.",
        "**Кнопки:** контейнер на всю ширину с Flexbox `justify-content: flex-end`.",
        "**Узкий экран:** одна колонка; метки над полями.",
        "**Доступность:** порядок DOM метка → поле сохраняется; `label for` связывает пары.",
      ),
    ],
  },

  interview: [
    iq("css.grid-basics.i1", "basic", "Чем Grid отличается от Flexbox?", [
      ul(
        "Flexbox — одномерная раскладка (ряд или столбец), размеры определяются содержимым.",
        "Grid — двумерная: описываются и строки, и столбцы; размещение элементов идёт по сетке.",
        "Они дополняют друг друга: Grid для макета, Flexbox для компонентов.",
      ),
    ]),
    iq("css.grid-basics.i2", "basic", "Что означает единица `fr`?", [
      p("Доля свободного места в контейнере: `1fr 2fr` делит доступную ширину (после вычета фиксированных треков и `gap`) в пропорции 1:2."),
    ]),
    iq("css.grid-basics.i3", "intermediate", "Как работает `grid-column: 1 / 3`?", [
      p("Элемент идёт от линии 1 до линии 3, то есть занимает два столбца (1 и 2). Конец диапазона исключительно. `1 / -1` — до последней линии явной сетки."),
    ]),
    iq("css.grid-basics.i4", "intermediate", "Что такое явная и неявная сетка?", [
      p("Явная сетка — треки, описанные в `grid-template-columns/rows`. Если элементов больше, браузер создаёт неявные треки; их размеры определяют `grid-auto-rows/columns`, направление заполнения — `grid-auto-flow`."),
    ]),
    iq("css.grid-basics.i5", "intermediate", "Чем `1fr` отличается от `minmax(0, 1fr)`?", [
      p("Минимум `1fr` — `auto` (размер содержимого): длинное слово растягивает колонку. `minmax(0, 1fr)` задаёт нулевой минимум: колонка может сжиматься, и равные доли остаются равными."),
    ]),
    iq("css.grid-basics.i6", "advanced", "Что делают `justify-items`, `align-items` и `place-items`?", [
      ul(
        "Выравнивают элементы **внутри своих ячеек**: `justify-*` по строчной оси, `align-*` по блочной.",
        "`place-items` — сокращение для обоих значений.",
        "Для выравнивания **самой сетки** в контейнере служат `justify-content`, `align-content`, `place-content`.",
      ),
    ]),
    iq("css.grid-basics.i7", "engineering", "Как вы выбираете между Grid и Flexbox?", [
      ul(
        "Grid, когда структура важнее содержимого: колонки, строки, области, макет страницы, выровненные формы.",
        "Flexbox, когда нужно распределять место вдоль одной оси по содержимому: панели инструментов, навигация, карточки.",
        "Часто комбинируют: Grid для каркаса, Flexbox внутри ячеек.",
      ),
    ]),
    iq("css.grid-basics.i8", "debugging", "Колонки в `1fr 1fr` получились разной ширины. Почему?", [
      ul(
        "Содержимое с большим минимальным размером (длинное слово, изображение, `pre`) расширяет трек: минимум `1fr` — по содержимому.",
        "Исправление: `minmax(0, 1fr)`, `overflow-wrap: anywhere`, `min-width: 0` у элемента.",
        "Проверка: включить наложение Grid в DevTools и посмотреть размеры треков.",
      ),
    ]),
  ],

  exam: [
    mcq("css.grid-basics.e1", "foundation", "Что делает `display: grid` у контейнера?", ["Включает Flexbox", "Делает прямых детей элементами сетки", "Скрывает контейнер", "Включает позиционирование"], 1, "Контейнер устанавливает контекст форматирования Grid, и его прямые дети размещаются в ячейках."),
    mcq("css.grid-basics.e2", "foundation", "Как записать три равные колонки?", ["`grid-template-columns: repeat(3, 1fr)`", "`columns: 3`", "`grid-columns: 3`", "`flex: 3`"], 0, "`repeat(3, 1fr)` создаёт три колонки по доле свободного места."),
    mcq("css.grid-basics.e3", "intermediate", "Сколько столбцов занимает `grid-column: 1 / 3`?", ["1", "2", "3", "4"], 1, "Конец диапазона исключительно: занимает столбцы 1 и 2."),
    mcq("css.grid-basics.e4", "intermediate", "Ширина контейнера 600px. `grid-template-columns: 1fr 2fr; gap: 30px`. Ширины колонок?", ["200 и 400", "190 и 380", "300 и 300", "180 и 360"], 1, "Место для долей: 600 − 30 = 570; доля 190: колонки 190px и 380px."),
    mcq("css.grid-basics.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`gap` не добавляется у внешних краёв сетки", "`1fr` имеет минимум по содержимому", "`grid-column: 1 / -1` охватывает явные колонки", "`dense` не влияет на визуальный порядок"], [0, 1, 2], "`dense` может менять визуальный порядок, остальные утверждения верны."),
    mcq("css.grid-basics.e6", "advanced", "Что создаёт `grid-auto-rows: 50px` при четырёх элементах и двух столбцах?", ["Две неявные строки по 50px", "Ничего", "Четыре строки по 50px", "Ошибку"], 0, "Явных строк нет, четыре элемента в двух столбцах дают две неявные строки высотой 50px."),
    open("css.grid-basics.e7", "intermediate", "Объясните, зачем использовать `minmax(0, 1fr)` вместо `1fr` в основной колонке макета.", [
      ul(
        "Минимум `1fr` равен `min-content` содержимого: длинное слово, таблица, `pre` растягивают колонку и страницу.",
        "`minmax(0, 1fr)` задаёт нулевой минимум: колонка сжимается, а содержимое переносится или прокручивается.",
        "Это особенно важно для пользовательского контента.",
      ),
    ], ["Объяснён минимум по содержимому", "Описан эффект `minmax(0, 1fr)`", "Упомянут пользовательский контент"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.grid-basics.m1", "intermediate", "Какая запись растягивает элемент на всю ширину явной сетки?", ["`grid-column: 1 / -1`", "`width: 100vw`", "`grid-column: auto`", "`grid-row: 1 / -1`"], 0, "Линия 1 — начало, −1 — последняя линия явной сетки: элемент охватывает все явные столбцы."),
    mcq("css.grid-basics.m2", "advanced", "В чём разница между `justify-items` и `justify-content` в Grid?", ["Нет разницы", "Первое выравнивает элементы в ячейках, второе — всю сетку внутри контейнера", "Первое — для строк, второе — для столбцов", "Первое — для Flexbox"], 1, "`*-items` действует внутри ячеек, `*-content` — на положение треков, если они не занимают весь контейнер."),
    mcq("css.grid-basics.m3", "advanced", "Что произойдёт при `repeat(3, 33.33%)` и `gap: 20px`?", ["Всё поместится", "Сумма треков и зазоров превысит ширину: появится переполнение", "Колонки сожмутся", "`gap` игнорируется"], 1, "Проценты не учитывают `gap`; три трека по 33,33 % плюс два зазора превышают 100 %. `fr` вычитает `gap` автоматически."),
    open("css.grid-basics.m4", "advanced", "Составьте рекомендации по использованию Grid для команды.", [
      ul(
        "Grid для макета страницы и двумерных блоков; Flexbox — для компонентов в одну линию.",
        "`fr`, `minmax()`, `gap`; `minmax(0, 1fr)` для колонок с пользовательским контентом.",
        "Порядок DOM = порядок чтения; `order` и `dense` — только для декоративных случаев.",
        "Не задавать размеры элементам, задавать на уровне сетки; не использовать жёсткие высоты строк.",
        "Проверять DevTools и тестами размеров на нескольких ширинах.",
      ),
    ], ["Выбор между Grid и Flexbox", "Правила размеров и порядка", "Проверки"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.grid-basics.f1", front: "`fr`?", back: "Доля свободного места после вычета фиксированных треков и `gap`." },
    { id: "css.grid-basics.f2", front: "`grid-column: 1 / 3`?", back: "Две колонки (1 и 2): конец исключительно." },
    { id: "css.grid-basics.f3", front: "`1 / -1`?", back: "На всю ширину явной сетки." },
    { id: "css.grid-basics.f4", front: "`1fr` против `minmax(0, 1fr)`?", back: "У `1fr` минимум по содержимому; у `minmax(0, 1fr)` — ноль." },
    { id: "css.grid-basics.f5", front: "Неявная сетка?", back: "Треки, созданные автоматически; размеры — `grid-auto-rows/columns`." },
    { id: "css.grid-basics.f6", front: "`place-items`?", back: "Выравнивание элементов в ячейках (align + justify)." },
  ],

  sources: [
    { title: "CSS Grid Layout Module Level 2", url: "https://www.w3.org/TR/css-grid-2/", publisher: "W3C" },
    { title: "CSS Box Alignment Module Level 3", url: "https://www.w3.org/TR/css-align-3/", publisher: "W3C" },
    { title: "MDN: Basic concepts of grid layout", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout", publisher: "MDN" },
    { title: "MDN: grid-template-columns", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-columns", publisher: "MDN" },
    { title: "MDN: Grid layout using line-based placement", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Grid_layout_using_line-based_placement", publisher: "MDN" },
    { title: "MDN: Relationship of grid layout to other layout methods", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Relationship_of_grid_layout_with_other_layout_methods", publisher: "MDN" },
  ],
};
