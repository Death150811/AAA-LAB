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

export const flexboxPatterns: Topic = {
  id: "css.flexbox-patterns",
  slug: "flexbox-patterns",
  domain: "css",
  module: "flexbox",
  title: "Паттерны Flexbox и типичные ловушки",
  titleEn: "Flexbox patterns: sticky footer, equal-height cards, input groups, scroll areas and common traps",
  summary:
    "Практическое применение Flexbox: «липкий» подвал, карточки одинаковой высоты с кнопкой внизу, группа «поле + кнопка», шапка с автоматическими полями, чат с прокручиваемой областью, переупорядочивание. Для каждого паттерна — рабочий код, объяснение механики и подводные камни (`min-height: 0`, `height: 100%`, `order`, влияние на доступность), а также чек-лист отладки Flexbox.",
  minutes: 55,
  prerequisites: ["css.flexbox-basics", "css.flex-sizing"],
  tags: ["flexbox", "sticky footer", "equal height", "card", "input group", "media object", "scroll area", "min-height: 0", "margin auto", "order", "baseline", "holy grail", "app layout", "debugging"],
  keyConcepts: [
    { term: "Колонка на всю высоту", text: "`body { display: flex; flex-direction: column; min-height: 100dvh }` и `main { flex: 1 }` прижимают подвал к низу окна при коротком содержимом." },
    { term: "Карточки одинаковой высоты", text: "Flex-контейнер растягивает элементы ряда (`align-items: stretch`); внутри карточки `display: flex; flex-direction: column` и `margin-top: auto` прижимают кнопку к низу." },
    { term: "`min-height: 0` в колонке", text: "Вложенная прокручиваемая область внутри flex-колонки не прокручивается, пока у родителя-элемента автоматический минимум `min-height: auto` равен высоте содержимого." },
    { term: "Автоматические поля — рычаг", text: "`margin-inline-start: auto`, `margin-block-start: auto` решают «прижать к краю» без пустых элементов и без `justify-content`." },
    { term: "Порядок — в DOM", text: "`order` и `*-reverse` меняют лишь визуальный порядок: для доступности последовательность фокуса и чтения должна совпадать с разметкой." },
  ],
  sections: [
    section("definition", [
      def("Паттерн раскладки", "Проверенный приём построения типового интерфейсного фрагмента из небольшого набора свойств: «липкий» подвал, равные карточки, группа ввода. Паттерн ценен тем, что его механику понимают все в команде.", "layout pattern"),
      def("«Липкий» подвал", "Раскладка страницы, при которой подвал оказывается у нижнего края окна, если содержимого мало, и уходит вниз по мере его роста.", "sticky footer"),
      def("Прокручиваемая область в колонке", "Блок с `overflow: auto` внутри flex-колонки известной высоты (чат, панель, список), занимающий всё оставшееся место и прокручивающийся независимо от страницы.", "scrollable region in a flex column"),
    ]),

    section("why", [
      h("Знание свойств ≠ умение раскладывать"),
      p("Можно знать, что делают `flex-grow` и `margin: auto`, и всё же потратить час на «простой» подвал или карточки с кнопкой внизу. Паттерны — это **готовые ответы** на типовые вопросы. Вы узнаёте задачу и сразу применяете проверенное решение, не тратя время на перебор."),
      h("Паттерны также учат ловушкам"),
      ul(
        "Почему прокручиваемая панель внутри колонки не прокручивается (и растягивает страницу).",
        "Почему карточки одинаковой высоты, а кнопки на разных уровнях.",
        "Почему порядок, изменённый `order`, мешает пользователям клавиатуры.",
        "Почему контейнер с `height: 100%` не растягивается, а с `flex: 1` — да.",
      ),
      insight("Каждый паттерн Flexbox — это комбинация трёх вещей: направление и перенос контейнера, правила `flex` у элементов и автоматические поля для исключений. Если задача не решается этой тройкой — возможно, вам нужен Grid."),
    ]),

    section("mental-model", [
      p("Представьте **конструктор из трёх деталей**: «рама» (контейнер: направление, перенос, выравнивание), «пружины» (`flex`: кто растягивается, кто сжимается, кто жёсткий) и «клинья» (автоматические поля: прижать, разделить, центрировать). Большинство интерфейсных фрагментов — комбинации этих деталей."),
      diagram(
        `
        Паттерн                   Рама                         Пружины                       Клинья
        ───────────────────────   ──────────────────────────   ───────────────────────────   ─────────────
        Липкий подвал             body: column, min-height     main: flex 1                  —
        Равные карточки           row + wrap                   card: flex 1 1 16rem          кнопка: margin-top auto
        Группа «поле + кнопка»    row                          input: flex 1; button: none   —
        Шапка                     row + align center + wrap    —                             логотип: margin-end auto
        Чат                       column, height               scroll: flex 1; min-height 0  —
        `,
        "Паттерны как комбинации «рама + пружины + клинья»",
      ),
      table(
        ["Задача", "Решение"],
        [
          ["Подвал внизу окна при коротком содержимом", "Колонка на всю высоту + `main { flex: 1 }`"],
          ["Кнопка внизу карточки при разной длине текста", "Карточка — колонка; `margin-top: auto` у кнопки"],
          ["Поле растягивается, кнопка нет", "`input { flex: 1; min-width: 0 }`; `button { flex: none }`"],
          ["Логотип слева, ссылки справа", "`margin-inline-end: auto` у логотипа"],
          ["Прокручиваемая область внутри колонки", "`flex: 1; min-height: 0; overflow: auto`"],
          ["Подписи разного размера на одной строке", "`align-items: baseline`"],
        ],
        "Задача → решение",
      ),
    ]),

    section("technical", [
      h("1. «Липкий» подвал"),
      code(
        "css",
        `
        body {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;       /* на всю высоту окна; dvh учитывает панели мобильного браузера */
          margin: 0;
        }
        main   { flex: 1; }          /* забирает свободное место и прижимает подвал вниз */
        footer { flex: none; }
        `,
        { filename: "sticky-footer.css" },
      ),
      p("Без этого правила при коротком содержимом подвал стоит сразу под основным блоком (в нашем замере — на 118px от верха окна высотой 600px). С колонкой и `flex: 1` у `main` подвал оказывается у нижней границы окна. При длинном содержимом страница просто прокручивается, как обычно."),
      h("2. Карточки одинаковой высоты с кнопкой внизу"),
      code(
        "css",
        `
        .cards { display: flex; flex-wrap: wrap; gap: 1rem; }
        .card  { flex: 1 1 16rem; display: flex; flex-direction: column; padding: 1rem; border: 1px solid #c5cae9; }
        .card > .more { margin-top: auto; }        /* кнопка прижата к низу карточки */
        `,
        { filename: "equal-cards.css" },
      ),
      ul(
        "Карточки в одной линии растягиваются по высоте (`align-items: stretch` по умолчанию).",
        "Сама карточка — flex-колонка: `margin-top: auto` у кнопки забирает свободное место **над** ней, поэтому кнопки всех карточек стоят на одном уровне. В измерении без колонки нижние края кнопок были 76 и 166px, с колонкой — по 167px у обеих.",
      ),
      h("3. Группа «поле + кнопка»"),
      code(
        "css",
        `
        .search { display: flex; gap: 0.5rem; }
        .search input  { flex: 1; min-width: 0; }
        .search button { flex: none; }
        `,
        { filename: "input-group.css" },
      ),
      h("4. Шапка с автоматическими полями"),
      code(
        "css",
        `
        .header { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; }
        .logo   { margin-inline-end: auto; }       /* всё свободное место справа от логотипа */
        `,
        { filename: "header.css" },
      ),
      h("5. Приложение с прокручиваемой областью"),
      code(
        "css",
        `
        .app   { display: flex; flex-direction: column; height: 100dvh; }
        .pane  { flex: 1; min-height: 0; display: flex; flex-direction: column; }  /* min-height: 0 — ключевой */
        .list  { flex: 1; overflow: auto; }
        `,
        { filename: "scroll-area.css" },
      ),
      p("Измерение показывает разницу. Без `min-height: 0` у `.pane` панель растягивается до высоты всего содержимого (в нашем опыте — 1066px при высоте приложения 300px), а список не прокручивается. С `min-height: 0` панель укладывается в 220px, а список получает собственную прокрутку (scrollHeight 1036px при clientHeight 190px)."),
      h("6. Выравнивание по базовой линии"),
      code(
        "css",
        `
        .price-line { display: flex; align-items: baseline; gap: 0.25rem; }
        .price-line .amount { font-size: 2rem; }
        .price-line .unit   { font-size: 0.875rem; }
        `,
        { filename: "baseline.css" },
      ),
      h("7. Переупорядочивание — осторожно"),
      ul(
        "Допустимо для **декоративных** изменений: переместить блок в сетке без влияния на смысл.",
        "Недопустимо менять порядок смыслового содержимого, форм и навигации: фокус и скринридер идут по DOM.",
        "Для разных макетов под разные размеры экрана лучше держать порядок в DOM логичным и использовать Grid-области или перестановку разметки.",
      ),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        .page { display: flex; flex-direction: column; min-height: 100dvh; }
        .page > main { flex: 1; }

        .card { display: flex; flex-direction: column; }
        .card > .actions { margin-top: auto; }

        .field { display: flex; gap: 0.5rem; }
        .field > input { flex: 1; min-width: 0; }
        `,
        [
          { line: 1, text: "Страница — колонка минимум на высоту окна: подвал окажется внизу даже при коротком содержимом." },
          { line: 2, text: "Основная область забирает свободное место: растягивается, пока подвал остаётся у нижнего края." },
          { line: 4, text: "Карточка — колонка, поэтому внутри можно использовать вертикальные автоматические поля." },
          { line: 5, text: "`margin-top: auto` прижимает действия к низу карточки независимо от длины текста." },
          { line: [7, 8], text: "Группа ввода: поле занимает всё доступное место, `min-width: 0` разрешает ему сжиматься." },
        ],
        "syntax.css",
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <title>Липкий подвал</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { display: flex; flex-direction: column; min-height: 100dvh; margin: 0; font: 1rem/1.5 system-ui, sans-serif; }
          header { padding: 1rem; background: #1a237e; color: #fff; }
          main { flex: 1; padding: 1rem; }
          footer { padding: 1rem; background: #eceff1; }
        </style>
        <header>Шапка</header>
        <main>Короткое содержимое. Подвал всё равно у нижнего края окна.</main>
        <footer>Подвал</footer>
        </html>
        `,
        { filename: "sticky-footer.html", runnable: true },
      ),
    ]),

    section("detailed-example", [
      p("Каталог карточек с одинаковой высотой, кнопкой «Подробнее» у нижнего края каждой карточки и группой «поиск + кнопка» над ним. Меняйте ширину окна: ряд перестраивается, а кнопки остаются на одном уровне внутри линии."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Каталог</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; font: 1rem/1.5 system-ui, sans-serif; background: #f5f5fa; }
          .wrap { max-width: 60rem; margin-inline: auto; padding: 1rem; }

          .search { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
          .search input { flex: 1; min-width: 0; font: inherit; padding: 0.5rem 0.75rem; border: 1px solid #9fa8da; border-radius: 0.5rem; }
          .search button { flex: none; font: inherit; padding: 0.5rem 1rem; border: 0; border-radius: 0.5rem; background: #1a237e; color: #fff; }
          .search :is(input, button):focus-visible { outline: 3px solid #0b57d0; outline-offset: 2px; }

          .cards { display: flex; flex-wrap: wrap; gap: 1rem; }
          .card { flex: 1 1 16rem; max-width: 24rem; display: flex; flex-direction: column; padding: 1rem; background: #fff; border: 1px solid #c5cae9; border-radius: 0.75rem; }
          .card h2 { margin: 0 0 0.5rem; font-size: 1.125rem; }
          .card p { margin: 0 0 1rem; }
          .card .more { margin-top: auto; align-self: flex-start; padding: 0.4rem 0.9rem; border: 1px solid #1a237e; border-radius: 999px; color: #1a237e; text-decoration: none; }
          .card .more:focus-visible { outline: 3px solid #0b57d0; outline-offset: 2px; }
        </style>
        <div class="wrap">
          <form class="search" role="search"><input type="search" aria-label="Поиск по каталогу" placeholder="Найти товар"><button>Найти</button></form>
          <div class="cards">
            <article class="card"><h2>Рюкзак «Город»</h2><p>Короткое описание.</p><a class="more" href="#">Подробнее</a></article>
            <article class="card"><h2>Куртка «Ветер»</h2><p>Длинное описание, которое занимает несколько строк: ветрозащитная ткань, проклеенные швы, капюшон с регулировкой и два внутренних кармана для мелочей.</p><a class="more" href="#">Подробнее</a></article>
            <article class="card"><h2>Шапка «Зима»</h2><p>Среднее по длине описание в две строки.</p><a class="more" href="#">Подробнее</a></article>
          </div>
        </div>
        </html>
        `,
        { filename: "catalog.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает"],
        [
          ["`.search { display: flex; gap }`", "Поле и кнопка в одной линии с расстоянием; кнопка не растягивается"],
          ["`.search input { flex: 1; min-width: 0 }`", "Поле занимает остаток; не вылезает при узком экране"],
          ["`.cards { flex-wrap: wrap }` + `.card { flex: 1 1 16rem }`", "Адаптивный ряд без медиазапросов"],
          ["`.card { display: flex; flex-direction: column }`", "Внутри карточки вертикальные автополя работают"],
          ["`.more { margin-top: auto; align-self: flex-start }`", "Кнопка внизу карточки, шириной по содержимому (а не растянутая)"],
          ["`:focus-visible`", "Заметная рамка фокуса у полей и ссылок"],
        ],
        "Как устроен каталог",
      ),
      ul(
        "`align-self: flex-start` важен: в колонке `align-items: stretch` растянул бы ссылку по ширине карточки.",
        "Карточки в строке растягиваются по высоте, но высота определяется самой длинной; `margin-top: auto` выравнивает действия по нижнему краю.",
        "Один и тот же приём — вложенные flex-контейнеры: страница (колонка), ряд карточек, карточка (колонка), группа поиска (ряд).",
      ),
    ]),

    section("internals", [
      h("Почему `min-height: 0` решает проблему прокрутки"),
      steps(
        [
          ["Автоматический минимум", "Для flex-элемента `min-height: auto` (в колонке) равен минимальному размеру содержимого — в нашем случае высоте всех сообщений."],
          ["Рост панели", "Родительская колонка не может сжать панель ниже минимума, поэтому панель растёт вместе с содержимым и выходит за пределы приложения."],
          ["Прокрутка не появляется", "Внутренний `.list { overflow: auto }` получает всё место, которое требуется: его высота равна высоте содержимого, поэтому прокручивать нечего."],
          ["Исправление", "`min-height: 0` у панели заменяет автоматический минимум нулём: панель умещается в доступное место, а переполненное содержимое прокручивается во внутреннем списке."],
        ],
        "Цепочка, объясняющая ловушку",
      ),
      note("Правило памяти: в цепочке «колонка → панель → список с прокруткой» **каждый** flex-элемент между фиксированным по высоте предком и прокручиваемым списком должен иметь `min-height: 0` (или `overflow` не `visible`)."),
      h("Как проверять паттерны"),
      code(
        "js",
        `
        // подвал у нижнего края окна?
        const f = document.querySelector("footer").getBoundingClientRect();
        const atBottom = Math.round(f.bottom) === window.innerHeight;

        // кнопки в карточках на одном уровне?
        const bottoms = [...document.querySelectorAll(".card .more")].map((b) => Math.round(b.getBoundingClientRect().bottom));
        const aligned = new Set(bottoms).size === 1;     // в одной линии — одинаковые значения

        // список прокручивается?
        const list = document.querySelector(".list");
        const scrolls = list.scrollHeight > list.clientHeight;
        `,
        { filename: "pattern-checks.js" },
      ),
    ]),

    section("mistakes", [
      h("Ошибка 1. `height: 100%` вместо `flex: 1`"),
      wrongRight(
        "css",
        {
          code: `
            html, body { height: 100%; }
            main { height: 100%; }          /* вместе с шапкой и подвалом выходит за окно */
          `,
          note: "Проценты не вычитают соседей: `main` займёт 100 % и вытолкнет подвал за окно.",
        },
        {
          code: `
            body { display: flex; flex-direction: column; min-height: 100dvh; }
            main { flex: 1; }
          `,
          note: "`flex: 1` забирает только оставшееся место.",
        },
      ),
      h("Ошибка 2. Забыть `min-height: 0`"),
      p("Чат, панель настроек или список «не прокручиваются», а страница растёт. Добавьте `min-height: 0` flex-элементу, содержащему прокручиваемый блок (всей цепочке)."),
      h("Ошибка 3. Кнопка растянулась на всю ширину карточки"),
      p("В колонке `align-items: stretch` растягивает ссылки и кнопки. Добавьте `align-self: flex-start` (или `align-items: flex-start` контейнеру)."),
      h("Ошибка 4. Кнопки на разных уровнях"),
      p("Если карточка не flex-колонка, кнопка идёт сразу за текстом: её уровень зависит от длины описания. Сделайте карточку колонкой и `margin-top: auto` у действий."),
      h("Ошибка 5. `order` для смысловых изменений"),
      p("Перенос «важного» блока наверх на мобильных через `order` нарушает последовательность фокуса и чтения. Меняйте порядок в разметке или используйте Grid с осмысленным порядком DOM."),
      h("Ошибка 6. Поле ввода без `min-width: 0`"),
      p("У `input` есть собственная минимальная ширина: в узком flex-контейнере поле выталкивает кнопку за край. Добавьте `min-width: 0`."),
      h("Ошибка 7. `100vh` в мобильных браузерах"),
      p("`min-height: 100vh` вызывает прокрутку из-за панели адреса. Используйте `100dvh` (с запасным `100vh`)."),
      h("Ошибка 8. Центрирование без свободного места"),
      p("`margin: auto` и `align-items: center` работают только при наличии свободного места по оси; без заданной высоты контейнера по вертикали нечего центрировать."),
    ]),

    section("antipatterns", [
      ul(
        "**`position: fixed` для подвала** с компенсирующим `padding-bottom` у страницы.",
        "**Расчёты высот в пикселях** (`height: calc(100vh - 120px)`), зависящие от размера шапки и подвала.",
        "**Равные карточки через JavaScript** (выравнивание высот) — Flexbox/Grid делают это без скриптов.",
        "**`display: table` для центрирования и равных колонок** в новом коде.",
        "**Вложенные flex-контейнеры без `min-height`/`min-width: 0`** там, где есть прокрутка или длинный текст.",
        "**Фиксированные высоты для чатов и списков** вместо flex-колонки.",
        "**`order` как способ «исправить» разметку** для разных экранов.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Раскладка страницы — колонка:** `min-height: 100dvh` и `flex: 1` у содержимого.",
        "**Карточки — колонки,** действия прижимайте `margin-top: auto`; не растягивайте кнопки (`align-self`).",
        "**Для прокрутки в колонке** — цепочка `flex: 1; min-height: 0; overflow: auto`.",
        "**Поля ввода** — `flex: 1; min-width: 0`; кнопки — `flex: none`.",
        "**Порядок DOM = порядок чтения;** `order` — для декоративных случаев.",
        "**Единицы окна — `dvh`,** а не `vh`.",
        "**Паттерны оформляйте как переиспользуемые классы** (`.stack`, `.cluster`, `.sidebar`) с документацией.",
        "**Проверяйте автоматически:** положение подвала, выравнивание кнопок, наличие прокрутки.",
      ),
    ]),

    section("edge-cases", [
      h("Safari и `min-height: 100dvh`"),
      p("`dvh` поддерживается современными браузерами; для старых оставляйте запасной вариант: `min-height: 100vh; min-height: 100dvh;`."),
      h("`flex: 1` и `height: auto` у `main`"),
      p("Если родитель — flex-колонка, `main { flex: 1 }` растягивается; если родитель — обычный блок, `flex: 1` не действует. Убедитесь, что `display: flex` включён на **прямом** родителе."),
      h("Прокручиваемый flex-контейнер и `justify-content: center`"),
      p("`justify-content: center` при переполнении обрезает начало содержимого, которое невозможно прокрутить. Используйте `safe center` или `margin: auto` у первого и последнего элементов."),
      h("`flex-wrap` и равные ряды"),
      p("Флекс-ряд с переносом выравнивает элементы в линиях независимо друг от друга: последняя линия может иметь меньше элементов, и они растянутся. Если нужна сетка, используйте Grid с `auto-fill`."),
      h("Изображения в карточках"),
      p("Изображение внутри flex-колонки растягивается по ширине; задайте `aspect-ratio`, `object-fit` и `flex: none`, чтобы оно не сжималось по высоте."),
      h("Печать"),
      p("При печати высота окна — это страница: `min-height: 100dvh` может создавать пустые листы. Для печатных стилей отключайте высоты: `@media print { body { min-height: 0 } }`."),
    ]),

    section("related", [
      ul(
        "[Flexbox: основы](/learn/css/flexbox-basics) — оси, выравнивание, `gap`.",
        "[Размеры flex-элементов](/learn/css/flex-sizing) — `flex-grow`, `flex-shrink`, `min-width: auto`.",
        "[Grid: основы](/learn/css/grid-basics) — когда нужна двумерная раскладка.",
        "[Размеры и overflow](/learn/css/overflow-sizing) — прокручиваемые области и их доступность.",
        "[Позиционирование](/learn/css/positioning) — закрепление при прокрутке (`sticky`).",
        "[Фокус и клавиатура](/learn/html/keyboard-focus) — порядок фокуса и `order`.",
        "Из других курсов: **UX** — шаблоны интерфейсов и приложений.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Хрупкая раскладка страницы",
          code: `
            footer { position: absolute; bottom: 0; width: 100%; height: 60px; }
            body { padding-bottom: 60px; }
            .chat { height: calc(100vh - 120px); overflow: auto; }
            .card .more { position: absolute; bottom: 1rem; }
            .card { position: relative; padding-bottom: 3.5rem; }
          `,
          note: "Размеры зависят от пикселей шапки и подвала; позиционирование ломается при увеличении шрифта и разной длине текста.",
        },
        {
          title: "Flexbox-паттерны",
          code: `
            body { display: flex; flex-direction: column; min-height: 100dvh; }
            main { flex: 1; }
            .chat { flex: 1; min-height: 0; overflow: auto; }
            .card { display: flex; flex-direction: column; }
            .card .more { margin-top: auto; }
          `,
          note: "Раскладка выражает намерение и сама подстраивается под высоту окна, шрифт и длину текста.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.flexbox-patterns.ex1",
      title: "Подвал внизу окна",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("Страница с шапкой, коротким основным содержимым и подвалом: подвал сейчас сразу под содержимым, на широком экране в середине окна. Прижмите его к низу окна, сохранив нормальную прокрутку при длинном содержимом."),
      ],
      starter: {
        lang: "html",
        code: `
          <style>
            body { margin: 0; }
            header, footer { padding: 1rem; background: #eceff1; }
          </style>
          <header>Шапка</header>
          <main>Короткое содержимое</main>
          <footer>Подвал</footer>
        `,
      },
      hints: ["Какой контейнер нужен на `body`?", "Какой элемент должен забрать свободное место?", "Какая единица высоты учитывает панели мобильных браузеров?"],
      checks: ["`body` — flex-колонка с `min-height`", "`main { flex: 1 }`", "Используется `dvh` (с запасным `vh`)"],
      solution: [
        code(
          "css",
          `
          body { margin: 0; display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh; }
          main { flex: 1; }
          `,
        ),
        ul(
          "`min-height` (а не `height`) позволяет странице расти при длинном содержимом.",
          "`flex: 1` у `main` забирает свободное место, прижимая подвал.",
          "Запасное `100vh` для браузеров без `dvh`.",
        ),
      ],
    }),
    exercise({
      id: "css.flexbox-patterns.ex2",
      title: "Кнопки на одном уровне",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("В ряду карточек кнопки «Подробнее» стоят на разных уровнях: их позиция зависит от длины текста. Исправьте так, чтобы кнопки были внизу карточек на одном уровне, и не растягивались на всю ширину."),
      ],
      starter: {
        lang: "html",
        code: `
          <style>
            .row { display: flex; gap: 1rem; }
            .card { flex: 1; border: 1px solid #ccc; padding: 1rem; }
          </style>
          <div class="row">
            <div class="card"><p>Коротко.</p><a href="#" class="more">Подробнее</a></div>
            <div class="card"><p>Длинный текст, который занимает несколько строк и делает вторую карточку выше первой, а кнопка уезжает.</p><a href="#" class="more">Подробнее</a></div>
          </div>
        `,
      },
      hints: ["Карточки уже одинаковой высоты — что внутри них?", "Что делает `margin-top: auto` в колонке?", "Что растягивает ссылку в колонке?"],
      checks: ["Карточка — flex-колонка", "`margin-top: auto` у кнопки", "`align-self: flex-start`"],
      solution: [
        code(
          "css",
          `
          .card { flex: 1; display: flex; flex-direction: column; border: 1px solid #ccc; padding: 1rem; }
          .card .more { margin-top: auto; align-self: flex-start; }
          `,
        ),
        ul(
          "Ряд растягивает карточки по высоте, но содержимое внутри идёт сверху вниз: кнопка стоит за текстом.",
          "Карточка-колонка позволяет `margin-top: auto` забрать свободное место над кнопкой.",
          "`align-self: flex-start` сохраняет ширину кнопки по содержимому.",
        ),
      ],
    }),
    exercise({
      id: "css.flexbox-patterns.ex3",
      title: "Чат с прокруткой",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Интерфейс чата: заголовок, панель сообщений с прокруткой и поле ввода внизу. Приложение должно занимать высоту окна. Сейчас список сообщений не прокручивается, а страница растёт. Найдите причину и исправьте; опишите автоматическую проверку."),
      ],
      starter: {
        lang: "html",
        code: `
          <style>
            .app { display: flex; flex-direction: column; height: 100dvh; }
            .pane { flex: 1; display: flex; flex-direction: column; }
            .list { flex: 1; overflow: auto; }
          </style>
          <div class="app">
            <header>Чат</header>
            <div class="pane"><div class="toolbar">Тулбар</div><div class="list"><!-- много сообщений --></div></div>
            <form>Поле ввода</form>
          </div>
        `,
      },
      hints: ["Чему равен `min-height` у `.pane` по умолчанию?", "Какая цепочка flex-элементов ведёт к прокручиваемому списку?"],
      checks: ["`min-height: 0` у `.pane`", "Описана автоматическая проверка"],
      solution: [
        code(
          "css",
          `
          .pane { flex: 1; min-height: 0; display: flex; flex-direction: column; }
          .list { flex: 1; min-height: 0; overflow: auto; }
          `,
        ),
        ul(
          "**Причина:** у `.pane` `min-height: auto` равен высоте содержимого списка; панель растёт вместе с ним, и внутреннему `.list` прокручивать нечего.",
          "**Исправление:** `min-height: 0` у `.pane` (и у `.list` при вложенности): панель умещается в доступное место, переполнение прокручивается во внутреннем списке.",
          "**Проверка:** `list.scrollHeight > list.clientHeight` и `list.clientHeight < window.innerHeight`; `document.documentElement.scrollHeight <= window.innerHeight`.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "css.flexbox-patterns.challenge",
    title: "Каркас приложения: шапка, боковая панель, прокручиваемое содержимое, подвал",
    scenario: [
      p("Нужен каркас административного приложения: закреплённая шапка, боковая панель фиксированной ширины с собственной прокруткой, основное содержимое с независимой прокруткой и подвал, который на коротких страницах прижат к низу. На мобильных боковая панель складывается над содержимым. Всё — на Flexbox, с тестом, проверяющим размеры и прокрутку."),
    ],
    requirements: [
      "Приложение на всю высоту окна, страница целиком не прокручивается",
      "Боковая панель 16rem с собственной прокруткой при длинном меню",
      "Основное содержимое прокручивается независимо",
      "Подвал внизу окна",
      "На ширине менее 40rem боковая панель переходит над содержимым",
      "Тест: размеры панелей, наличие прокрутки в панели и содержимом, отсутствие прокрутки страницы",
    ],
    constraints: [
      "Без `position: fixed` и расчётов высоты в пикселях",
      "Порядок DOM совпадает с порядком чтения",
    ],
    acceptance: [
      "`document.documentElement.scrollHeight` не превышает высоту окна",
      "Панель и содержимое прокручиваются независимо (`scrollHeight > clientHeight`)",
      "Ширина панели равна 16rem",
      "На узком экране панель над содержимым",
    ],
    hints: [
      "Какая цепочка свойств нужна для вложенных прокручиваемых областей?",
      "Как сделать панель фиксированной ширины?",
      "Как перестроить раскладку на узком экране без изменения DOM?",
    ],
    solution: [
      code(
        "html",
        `
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; }
          .app { display: flex; flex-direction: column; height: 100vh; height: 100dvh; }
          .app > header { flex: none; padding: 0.75rem 1rem; background: #1a237e; color: #fff; }
          .body { flex: 1; min-height: 0; display: flex; }
          .nav { flex: 0 0 16rem; overflow: auto; padding: 1rem; background: #eceff1; }
          .content { flex: 1; min-width: 0; overflow: auto; padding: 1rem; }
          .app > footer { flex: none; padding: 0.75rem 1rem; background: #cfd8dc; }
          @media (max-width: 40rem) { .body { flex-direction: column; } .nav { flex: none; max-height: 40%; } }
        </style>
        <div class="app">
          <header>Заголовок</header>
          <div class="body">
            <nav class="nav" aria-label="Разделы"><!-- длинное меню --></nav>
            <main class="content"><!-- длинное содержимое --></main>
          </div>
          <footer>Подвал</footer>
        </div>
        `,
        { runnable: true, lineNumbers: true },
      ),
      code(
        "js",
        `
        const doc = document.documentElement;
        const nav = document.querySelector(".nav");
        const content = document.querySelector(".content");

        console.log("страница не прокручивается:", doc.scrollHeight <= window.innerHeight);
        console.log("панель прокручивается:", nav.scrollHeight > nav.clientHeight);
        console.log("содержимое прокручивается:", content.scrollHeight > content.clientHeight);
        console.log("ширина панели 16rem:", Math.round(nav.getBoundingClientRect().width) === 16 * parseFloat(getComputedStyle(doc).fontSize));
        `,
        { filename: "app-layout.test.js" },
      ),
      ul(
        "**Высота:** `.app` занимает высоту окна; `.body` с `flex: 1; min-height: 0` занимает остаток между шапкой и подвалом.",
        "**Прокрутка:** `overflow: auto` у панели и содержимого; благодаря `min-height: 0` у `.body` каждая область получает собственную прокрутку.",
        "**Панель:** `flex: 0 0 16rem` — жёсткая ширина; `min-width: 0` у содержимого защищает от длинных слов.",
        "**Адаптивность:** на узких экранах `.body` становится колонкой, панель получает `flex: none` и ограничение высоты.",
      ),
    ],
  },

  interview: [
    iq("css.flexbox-patterns.i1", "basic", "Как прижать подвал к низу окна при коротком содержимом?", [
      p("Сделать `body` flex-колонкой с `min-height: 100dvh` и дать основному блоку `flex: 1`: он забирает свободное место, и подвал оказывается внизу. Если содержимое длинное, страница прокручивается как обычно."),
    ]),
    iq("css.flexbox-patterns.i2", "basic", "Как расположить кнопки внизу карточек одинаковой высоты?", [
      p("Ряд растягивает карточки по высоте. Каждую карточку делают flex-колонкой, а кнопке задают `margin-top: auto`: она получает всё свободное место над собой и прижимается к низу."),
    ]),
    iq("css.flexbox-patterns.i3", "intermediate", "Почему внутри flex-колонки блок с `overflow: auto` не прокручивается?", [
      p("У родительского flex-элемента `min-height: auto` равен высоте содержимого, поэтому он растёт, и прокручивать нечего. Нужен `min-height: 0` у элементов цепочки между фиксированным по высоте предком и прокручиваемым блоком."),
    ]),
    iq("css.flexbox-patterns.i4", "intermediate", "Как сделать группу «поле + кнопка»?", [
      p("Контейнер `display: flex; gap`. Полю — `flex: 1; min-width: 0`, кнопке — `flex: none`. Поле занимает остаток и сжимается, кнопка сохраняет размер."),
    ]),
    iq("css.flexbox-patterns.i5", "intermediate", "Чем опасен `order` и когда его допустимо использовать?", [
      ul(
        "Меняет только визуальный порядок: фокус и скринридер идут по DOM, возникает рассогласование (WCAG 1.3.2, 2.4.3).",
        "Допустим для декоративных элементов, не влияющих на смысл и навигацию.",
        "Для смысловых перестановок меняйте порядок в разметке.",
      ),
    ]),
    iq("css.flexbox-patterns.i6", "advanced", "Почему `height: 100%` хуже `flex: 1` для основного блока страницы?", [
      p("Проценты не вычитают размеры соседей: `main { height: 100% }` вместе с шапкой и подвалом превысит высоту окна. `flex: 1` распределяет **оставшееся** место между гибкими элементами."),
    ]),
    iq("css.flexbox-patterns.i7", "engineering", "Как вы оформите повторяющиеся паттерны Flexbox в проекте?", [
      ul(
        "Небольшая библиотека раскладок: `stack`, `cluster`, `sidebar`, `switcher`, `cover` — с понятными переменными.",
        "Документация с примерами и ограничениями (`min-width: 0`, `min-height: 0`).",
        "Автоматические проверки размеров и прокрутки в e2e/визуальных тестах.",
        "Правила обзора: порядок DOM, `gap` вместо полей, `dvh` вместо `vh`.",
      ),
    ]),
    iq("css.flexbox-patterns.i8", "debugging", "Подвал уехал за пределы окна, а страница получила лишнюю прокрутку. Что проверите?", [
      ul(
        "`height: 100%` у `main` (вместо `flex: 1`) или `100vh` с шапкой.",
        "Нет ли `min-height: auto` у вложенных элементов с прокруткой (нужен `min-height: 0`).",
        "`100vh` на мобильных: используйте `100dvh`.",
        "В DevTools — Flex Item Info и подсветка размеров.",
      ),
    ]),
  ],

  exam: [
    mcq("css.flexbox-patterns.e1", "foundation", "Какое сочетание прижимает подвал к низу окна?", ["`body { display: flex; flex-direction: column; min-height: 100dvh }` и `main { flex: 1 }`", "`footer { position: absolute }`", "`main { height: 100% }`", "`body { display: grid }`"], 0, "Колонка минимум на высоту окна и `flex: 1` у основного блока отдают свободное место содержимому, прижимая подвал."),
    mcq("css.flexbox-patterns.e2", "foundation", "Что делает `margin-top: auto` у кнопки в flex-колонке?", ["Ничего", "Прижимает кнопку к низу контейнера, забирая свободное место над собой", "Центрирует по горизонтали", "Убирает поля"], 1, "Автоматическое поле поглощает свободное место по своей оси и прижимает элемент к противоположному краю."),
    mcq("css.flexbox-patterns.e3", "intermediate", "Почему список с `overflow: auto` не прокручивается внутри flex-колонки?", ["Нужен `display: grid`", "Родитель-flex-элемент не может сжаться ниже содержимого: нужен `min-height: 0`", "Нужен `position: fixed`", "Нужен `z-index`"], 1, "Автоматический минимум по высоте равен высоте содержимого; `min-height: 0` позволяет панели уместиться и прокручивать переполнение."),
    mcq("css.flexbox-patterns.e4", "intermediate", "Что задают полю ввода в группе «поле + кнопка»?", ["`flex: none`", "`flex: 1; min-width: 0`", "`width: 100%` и `float: left`", "`position: absolute`"], 1, "Поле занимает оставшееся место и может сжиматься; кнопке — `flex: none`."),
    mcq("css.flexbox-patterns.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`order` не меняет порядок фокуса", "`flex: 1` у `main` в колонке забирает свободное место", "`height: 100%` вычитает высоты соседей", "`min-height: 100dvh` учитывает панели мобильного браузера"], [0, 1, 3], "Проценты высоты не вычитают соседей; остальные утверждения верны."),
    mcq("css.flexbox-patterns.e6", "advanced", "Что не позволит ссылке в карточке-колонке растянуться на всю ширину?", ["`align-self: flex-start`", "`justify-content: center`", "`flex: 1`", "`order: -1`"], 0, "В колонке `align-items: stretch` растягивает элементы по ширине; `align-self: flex-start` оставляет размер по содержимому."),
    open("css.flexbox-patterns.e7", "intermediate", "Опишите решение для чата: заголовок, прокручиваемый список, поле ввода внизу.", [
      ul(
        "Контейнер — flex-колонка высотой окна (`height: 100dvh`).",
        "Заголовок и поле ввода — `flex: none`; список — `flex: 1; min-height: 0; overflow: auto`.",
        "Если между ними есть промежуточные flex-панели, `min-height: 0` нужен каждой из них.",
        "Проверка: `scrollHeight > clientHeight` у списка и отсутствие прокрутки страницы.",
      ),
    ], ["Описана колонка и высота", "Есть `min-height: 0` и `overflow: auto`", "Названа проверка"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.flexbox-patterns.m1", "intermediate", "Что даёт `flex: 1 1 16rem; max-width: 24rem` у карточек с `flex-wrap`?", ["Фиксированные три колонки", "Адаптивный ряд: число карточек в линии зависит от ширины, а одинокая не растягивается дальше 24rem", "Растяжение на всю ширину", "Ошибка"], 1, "Базовый размер определяет число карточек в линии, `flex-grow` растягивает их, `max-width` ограничивает рост."),
    mcq("css.flexbox-patterns.m2", "advanced", "Почему лучше `min-height: 100dvh`, а не `height: 100vh` для корня страницы?", ["Нет разницы", "`min-height` позволяет странице расти при длинном содержимом, `dvh` учитывает панели браузера", "`vh` устарело", "`dvh` быстрее"], 1, "`height` обрежет рост, а `vh` на мобильных соответствует большому окну."),
    mcq("css.flexbox-patterns.m3", "advanced", "Две вложенные flex-колонки, внутри — список с `overflow: auto`. Где нужен `min-height: 0`?", ["Только у списка", "У каждого flex-элемента-предка списка между ним и фиксированным по высоте контейнером", "У `body`", "Нигде"], 1, "Каждый элемент цепочки имеет автоматический минимум по содержимому; нужно обнулить его на каждом звене."),
    open("css.flexbox-patterns.m4", "advanced", "Составьте библиотеку из 4–5 раскладочных паттернов Flexbox для дизайн-системы и опишите их контракты и тесты.", [
      ul(
        "**stack** — вертикальные отступы между потомками (`> * + *` или `gap`); **cluster** — ряд с переносом и `gap`; **sidebar** — панель фиксированной ширины + растягиваемое содержимое; **switcher** — ряд, переходящий в колонку при нехватке места; **cover** — центрированное содержимое при минимальной высоте.",
        "Контракты: переменные для `gap`, ширин, порогов; обязательные `min-width: 0`/`min-height: 0`; порядок DOM.",
        "Тесты: измерение расстояний и ширин, отсутствие горизонтальной прокрутки, поведение на 320/768/1280, длинные слова и переводы.",
        "Документация с примерами и антипримерами.",
      ),
    ], ["Названы паттерны и их назначение", "Описаны контракты", "Описаны автоматические проверки"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.flexbox-patterns.f1", front: "Липкий подвал?", back: "`body`: column + `min-height: 100dvh`; `main { flex: 1 }`." },
    { id: "css.flexbox-patterns.f2", front: "Кнопка внизу карточки?", back: "Карточка — flex-колонка; кнопке `margin-top: auto`." },
    { id: "css.flexbox-patterns.f3", front: "Прокрутка внутри flex-колонки?", back: "`flex: 1; min-height: 0; overflow: auto` по всей цепочке." },
    { id: "css.flexbox-patterns.f4", front: "Поле и кнопка в ряд?", back: "Поле `flex: 1; min-width: 0`, кнопка `flex: none`." },
    { id: "css.flexbox-patterns.f5", front: "`order` и доступность?", back: "Меняет только вид: фокус и чтение идут по DOM." },
    { id: "css.flexbox-patterns.f6", front: "Почему не `height: 100%`?", back: "Не вычитает соседей: используйте `flex: 1`." },
  ],

  sources: [
    { title: "CSS Flexible Box Layout Module Level 1", url: "https://www.w3.org/TR/css-flexbox-1/", publisher: "W3C" },
    { title: "MDN: Common flexbox use cases", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Typical_use_cases_of_flexbox", publisher: "MDN" },
    { title: "MDN: Mastering wrapping of flex items", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Mastering_wrapping_of_flex_items", publisher: "MDN" },
    { title: "WCAG 2.2: Meaningful Sequence", url: "https://www.w3.org/TR/WCAG22/#meaningful-sequence", publisher: "W3C" },
    { title: "WCAG 2.2: Focus Order", url: "https://www.w3.org/TR/WCAG22/#focus-order", publisher: "W3C" },
    { title: "MDN: min-height", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/min-height", publisher: "MDN" },
  ],
};
