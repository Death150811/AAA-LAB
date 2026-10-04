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

export const gridAreasPlacement: Topic = {
  id: "css.grid-areas-placement",
  slug: "grid-areas-placement",
  domain: "css",
  module: "grid",
  title: "Именованные области, линии и размещение в Grid",
  titleEn: "Grid template areas, named lines, full-bleed layouts, overlap and auto-placement control",
  summary:
    "Номера линий неудобно читать и менять. Тема показывает, как давать сетке имена: `grid-template-areas` и `grid-area`, именованные линии (`[content-start]`), шаблоны «на всю ширину» (full-bleed), перестройку макета в медиазапросах простой подменой карты областей, наложение элементов в одной ячейке, управление автоматическим размещением (`grid-auto-flow`, `dense`) и влияние на доступность.",
  minutes: 55,
  prerequisites: ["css.grid-basics"],
  tags: ["grid-template-areas", "grid-area", "named lines", "grid-template", "full-bleed", "overlap", "z-index", "grid-auto-flow", "dense", "order", "accessibility", "responsive layout", "layout shorthand"],
  keyConcepts: [
    { term: "Именованные области", en: "grid areas", text: "`grid-template-areas` рисует макет «ASCII-картой»; элемент указывает `grid-area: имя`. Макет читается как чертёж и перестраивается подменой карты." },
    { term: "Именованные линии", text: "Имена линий в скобках (`[content-start]`) позволяют ссылаться на границы смыслово: `grid-column: content`. `-start` и `-end` дают неявную область." },
    { term: "Full-bleed", text: "Шаблон «колонка контента + боковые поля»: обычные элементы занимают центральный трек, а особые (`full`) растягиваются от края до края окна." },
    { term: "Наложение в ячейке", text: "Несколько элементов можно поместить в одну ячейку/область (`grid-area: 1 / 1`): они накладываются по порядку DOM и `z-index`. Это наложение без позиционирования." },
    { term: "Порядок DOM остаётся", text: "Сетка меняет **визуальные** позиции, но не порядок фокуса и чтения. Не перекраивайте смысловой порядок через области, `order` и `dense`." },
  ],
  sections: [
    section("definition", [
      def("Именованная область", "Прямоугольная область сетки, которой дано имя в `grid-template-areas`. Элемент помещается в неё через `grid-area: имя`.", "grid template area"),
      def("Именованная линия", "Линия сетки, получившая имя в скобках внутри `grid-template-columns/rows`. На неё можно ссылаться по имени в `grid-column`, `grid-row` и `grid-area`.", "named grid line"),
      def("Неявная именованная область", "Если линии названы как `имя-start` и `имя-end`, браузер автоматически создаёт область `имя`, на которую можно ссылаться через `grid-column: имя`.", "implicit named area"),
      def("Full-bleed", "Приём раскладки, при котором основное содержимое занимает центральную колонку, а отдельные блоки (иллюстрации, баннеры) выходят до краёв окна.", "full-bleed layout"),
    ]),

    section("why", [
      h("Читаемость макета"),
      p("Запись `grid-column: 2 / 4; grid-row: 1 / 3` требует мысленно строить сетку. Запись `grid-area: sidebar` и карта в контейнере показывают макет сразу, как чертёж. При изменении дизайна достаточно переписать карту, а не искать числа в десятках правил."),
      h("Что даёт именование"),
      ul(
        "**Макеты страниц:** шапка, меню, основное, боковая колонка, подвал — вся раскладка в одном месте.",
        "**Адаптивность:** на узком экране вы меняете карту областей, а правила элементов остаются прежними.",
        "**Full-bleed:** без `calc(50% - 50vw)` и отрицательных полей.",
        "**Наложение:** подпись поверх изображения без `position: absolute`.",
      ),
      insight("Именуйте то, что меняется смыслом (области макета, границы колонки контента), и оставляйте числа для случаев, когда структура регулярна (галереи, сетки карточек)."),
    ]),

    section("mental-model", [
      p("Представьте **чертёж этажа**. Вы рисуете план комнат ASCII-символами: «кухня, кухня, коридор; гостиная, гостиная, балкон». Затем жильцам (элементам) выдаёте только названия комнат — они сами занимают нужную область. Если нужно переставить комнаты для другого типа дома (мобильного экрана), вы перечерчиваете план, а жильцов не трогаете."),
      diagram(
        `
        grid-template-areas:
          "head  head  head"
          "nav   main  aside"
          "foot  foot  foot";

        grid-template-columns: 12rem minmax(0, 1fr) 10rem;
        grid-template-rows:    auto  1fr  auto;

        header { grid-area: head }      nav   { grid-area: nav }
        main   { grid-area: main }      aside { grid-area: aside }
        footer { grid-area: foot }

        мобильный макет (подмена карты):
          "head" "main" "nav" "aside" "foot"
        `,
        "Карта областей и её подмена",
      ),
      table(
        ["Правила карты", "Пояснение"],
        [
          ["Строки в кавычках", "Каждая строка карты — одна строка сетки; число слов равно числу столбцов"],
          ["Повтор имени", "Область, занимающая несколько ячеек, должна быть **прямоугольной** и непрерывной"],
          ["`.` (точка)", "Пустая ячейка"],
          ["Несколько точек подряд", "Считаются одной пустой ячейкой (`...` = один пустой столбец)"],
        ],
        "Правила записи карты",
      ),
    ]),

    section("technical", [
      h("`grid-template-areas`"),
      code(
        "css",
        `
        .page {
          display: grid;
          grid-template-columns: 12rem minmax(0, 1fr) 10rem;
          grid-template-rows: auto 1fr auto;
          grid-template-areas:
            "head head  head"
            "nav  main  aside"
            "foot foot  foot";
          min-height: 100dvh;
        }

        .page > header { grid-area: head; }
        .page > nav    { grid-area: nav; }
        .page > main   { grid-area: main; }
        .page > aside  { grid-area: aside; }
        .page > footer { grid-area: foot; }

        @media (max-width: 40rem) {
          .page {
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: auto;
            grid-template-areas: "head" "main" "nav" "aside" "foot";
          }
        }
        `,
        { filename: "areas.css" },
      ),
      ul(
        "Размеры колонок и строк задаются отдельно: `grid-template-columns`/`rows`; карта лишь называет ячейки.",
        "Одна и та же область не может быть разорвана: она должна быть прямоугольником.",
        "Сокращение `grid-template` объединяет карту и размеры, но читаемее писать по отдельности.",
        "`grid-area` принимает и имя области, и числа: `grid-area: 1 / 2 / 3 / 4` (строка начала, колонка начала, строка конца, колонка конца).",
      ),
      h("Именованные линии и неявные области"),
      code(
        "css",
        `
        .article {
          display: grid;
          grid-template-columns:
            [full-start] minmax(1rem, 1fr)
            [content-start] minmax(0, 40rem)
            [content-end] minmax(1rem, 1fr)
            [full-end];
        }

        .article > *       { grid-column: content; }   /* содержимое — в центральной колонке */
        .article > .full   { grid-column: full; }      /* полная ширина окна */
        .article > .wide   { grid-column: 1 / -1; }    /* то же без имён */
        `,
        { filename: "full-bleed.css" },
      ),
      ul(
        "Линия может иметь **несколько имён**: `[content-end full-end]`.",
        "Пара `имя-start` / `имя-end` создаёт **область** `имя`: `grid-column: content` означает от `content-start` до `content-end`.",
        "Отрицательные номера и имена не зависят от числа колонок в сетке: `full` всегда охватывает от одного края до другого.",
        "Замер в Chromium при ширине окна 1000px: центральный трек занял 640px (40rem) со смещением 180px от края, боковые поля — по 180px, а блок `.full` растянулся на все 1000px.",
      ),
      h("Наложение элементов"),
      code(
        "css",
        `
        .stack { display: grid; }
        .stack > * { grid-area: 1 / 1; }                /* все дети в одной ячейке */
        .stack > .caption { align-self: end; background: rgb(0 0 0 / 55%); color: #fff; }
        `,
        { filename: "overlap.css" },
      ),
      p("Элементы в одной ячейке накладываются по порядку DOM (следующий выше) и `z-index`. Размер ячейки определяет самый большой из них. Это чище, чем `position: absolute`: оба элемента остаются в потоке сетки, и контейнер сам учитывает их размеры."),
      h("Управление автоматическим размещением"),
      table(
        ["Приём", "Эффект", "Осторожно"],
        [
          ["`grid-auto-flow: row` (по умолчанию)", "Заполнение по строкам", "—"],
          ["`grid-auto-flow: column`", "Заполнение по столбцам", "Нужны `grid-template-rows` и `grid-auto-columns`"],
          ["`grid-auto-flow: row dense`", "Мелкие элементы заполняют «дыры» после крупных", "Визуальный порядок отличается от DOM"],
          ["`order`", "Перестановка элементов в сетке", "Порядок фокуса и чтения не меняется"],
        ],
        "Автоматическое размещение",
      ),
      p("Замер в Chromium: сетка из трёх колонок по 100px, элементы A и B занимают по две колонки (`span 2`), C — одну. Без `dense` A стоит в строке 1, B и C — в строке 2 (C на x = 200px), а третья ячейка строки 1 остаётся пустой. С `grid-auto-flow: row dense` элемент C перепрыгивает в эту дыру (x = 200px, строка 1), хотя в DOM он идёт последним."),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        .app {
          display: grid;
          grid-template-columns: 14rem minmax(0, 1fr);
          grid-template-areas:
            "nav  main"
            "nav  foot";
        }

        .app > nav  { grid-area: nav; }
        .app > main { grid-area: main; }
        .app > footer { grid-area: foot; }

        .hero { display: grid; }
        .hero > * { grid-area: 1 / 1; }
        `,
        [
          { line: [4, 6], text: "Карта: боковое меню занимает левую колонку на обе строки (имя `nav` повторено вертикально), справа — содержимое и подвал." },
          { line: 9, text: "Каждый элемент просто называет свою область; координаты не нужны." },
          { line: [13, 14], text: "Наложение: все дети героя — в одной ячейке `1 / 1`; порядок DOM определяет, кто выше." },
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
        <title>grid-template-areas</title>
        <style>
          body { margin: 0; font: 16px/1.5 system-ui, sans-serif; }
          .page { display: grid; gap: 0.5rem; padding: 0.5rem; min-height: 100vh;
                  grid-template-columns: 10rem 1fr 8rem; grid-template-rows: auto 1fr auto;
                  grid-template-areas: "head head head" "nav main aside" "foot foot foot"; }
          .page > * { padding: 0.5rem; background: #c5cae9; }
          header { grid-area: head; background: #1a237e; color: #fff; }
          nav { grid-area: nav; }
          main { grid-area: main; background: #fff3e0; }
          aside { grid-area: aside; }
          footer { grid-area: foot; }
        </style>
        <div class="page"><header>header</header><nav>nav</nav><main>main</main><aside>aside</aside><footer>footer</footer></div>
        `,
        { filename: "areas-basics.html", runnable: true },
      ),
    ]),

    section("detailed-example", [
      p("Статья в формате full-bleed: текст в колонке до 40rem по центру, а иллюстрация и цитата растягиваются на всю ширину. Подпись на фото выполнена наложением в одной ячейке. Меняйте ширину окна: боковые поля сохраняются не менее 1rem."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Статья full-bleed</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; font: 1.125rem/1.6 Georgia, serif; color: #1b1b1f; }

          .article {
            display: grid;
            grid-template-columns:
              [full-start] minmax(1rem, 1fr)
              [content-start] minmax(0, 40rem)
              [content-end] minmax(1rem, 1fr)
              [full-end];
          }
          .article > * { grid-column: content; }
          .article > .full { grid-column: full; }
          .article h1 { font: 700 2.25rem/1.15 system-ui, sans-serif; margin: 2rem 0 1rem; }

          .figure { display: grid; margin: 1.5rem 0; }
          .figure > * { grid-area: 1 / 1; }
          .figure .photo { min-height: 14rem; background: linear-gradient(135deg, #7986cb, #3949ab); }
          .figure figcaption { align-self: end; padding: 0.5rem 1rem; color: #fff; background: rgb(0 0 0 / 55%); font: 0.875rem/1.4 system-ui, sans-serif; }

          blockquote { margin: 1.5rem 0; padding: 1.5rem 1rem; background: #fff3e0; font-style: italic; }
        </style>
        <article class="article">
          <h1>Сетка с именованными линиями</h1>
          <p>Обычные элементы автоматически попадают в центральную колонку. Ширина текста ограничена, а боковые поля растут вместе с окном.</p>
          <figure class="figure full"><div class="photo"></div><figcaption>Иллюстрация на всю ширину с подписью, наложенной в той же ячейке</figcaption></figure>
          <p>После иллюстрации текст продолжается в той же колонке без дополнительных обёрток и отрицательных полей.</p>
          <blockquote class="full">Цитата тоже может занимать всю ширину окна: достаточно одного класса.</blockquote>
          <p>Конец статьи.</p>
        </article>
        </html>
        `,
        { filename: "full-bleed.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает"],
        [
          ["`[full-start] minmax(1rem, 1fr) [content-start] minmax(0, 40rem) [content-end] minmax(1rem, 1fr) [full-end]`", "Три колонки: боковые поля (не менее 1rem) и центральная (до 40rem)"],
          ["`.article > * { grid-column: content }`", "Все дети по умолчанию в центральной колонке"],
          ["`.full { grid-column: full }`", "Выбранные блоки растягиваются от `full-start` до `full-end`"],
          ["`.figure > * { grid-area: 1 / 1 }`", "Фото и подпись в одной ячейке; подпись выровнена вниз (`align-self: end`)"],
        ],
        "Как работает шаблон",
      ),
      ul(
        "`full` — это неявная область, образованная линиями `full-start` и `full-end`. Такое имя нельзя спутать с номерами.",
        "Читатель кода видит смысл: `content`, `full`. Если колонки или поля поменяются, правила элементов не потребуют правки.",
        "Иллюстрация остаётся в потоке сетки: высота определяется содержимым, а не `position: absolute`.",
      ),
    ]),

    section("internals", [
      h("Как браузер строит области"),
      steps(
        [
          ["Разбор карты", "Каждая строка карты даёт строку сетки, каждое слово — ячейку. Одинаковые слова объединяются в прямоугольные области; несвязные области делают объявление недопустимым."],
          ["Создание линий", "Для области `имя` создаются линии `имя-start` и `имя-end` по обеим осям, а также неявные имена для `grid-column: имя`/`grid-row: имя`."],
          ["Размещение элементов", "Элемент с `grid-area: имя` занимает область; без явных координат элементы заполняют свободные ячейки по алгоритму автоматического размещения."],
          ["Наложение", "Несколько элементов в одной области рисуются в порядке DOM и `z-index`; размер области определяется их совокупным вкладом."],
        ],
        "Построение областей и линий",
      ),
      h("Отладка карты"),
      ul(
        "Включите наложение Grid в DevTools и отметьте «показывать названия областей»: подписаны линии и области.",
        "Ошибка в карте (непрямоугольная область, разное число слов в строках) делает **всё** объявление недопустимым: `getComputedStyle(el).gridTemplateAreas` вернёт `none`, а дети уйдут в неявные треки. Проверьте вкладку Styles — недопустимое объявление там зачёркнуто.",
        "Для проверки числа треков: `getComputedStyle(el).gridTemplateColumns` вернёт список размеров.",
      ),
      code(
        "js",
        `
        const cs = getComputedStyle(document.querySelector(".page"));
        cs.gridTemplateAreas;      // '"head head head" "nav main aside" "foot foot foot"'
        cs.gridTemplateColumns;    // "192px 648px 160px" — при ширине .page 1000px
        `,
        { filename: "grid-areas-computed.js" },
      ),
      note("`grid-template-areas` в computed style возвращается в нормализованном виде. Сравнивать карты в тестах удобнее по нему, чем по исходной записи."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Разное число слов в строках карты"),
      wrongRight(
        "css",
        {
          code: `
            grid-template-areas:
              "head head head"
              "nav main";            /* только два слова */
          `,
          note: "Строки карты должны содержать одинаковое число ячеек: иначе объявление недопустимо и области пропадут.",
        },
        {
          code: `
            grid-template-areas:
              "head head head"
              "nav  main main";
          `,
          note: "Всюду по три ячейки; повторение имени задаёт ширину области.",
        },
      ),
      h("Ошибка 2. Разорванная область"),
      p("Область `nav` в двух несмежных ячейках или Г-образная — недопустима: области должны быть прямоугольниками. Вместо этого используйте разные имена."),
      h("Ошибка 3. Забыть размеры колонок"),
      p("Карта лишь называет ячейки. Без `grid-template-columns` все колонки получают размер `auto` и делят свободное место по содержимому: в замере карта `\"nav main aside\"` на ширине 1000px дала колонки 304px, 409px и 288px — боковые колонки раздулись. Задавайте размеры явно."),
      h("Ошибка 4. Менять смысловой порядок областями"),
      p("Меню в DOM идёт после содержимого, но на экране слева — фокус и скринридер начнут с содержимого. Держите разметку в логическом порядке и перестраивайте только вид."),
      h("Ошибка 5. `dense` для содержимого с порядком"),
      p("Автоматическая «упаковка» меняет визуальный порядок: читатели видят карточки в другой последовательности, чем слышат скринридером. Применяйте к декоративным коллекциям (иконки, фото-мозаика)."),
      h("Ошибка 6. Наложение без учёта доступности"),
      p("Если подпись накладывается на изображение, убедитесь в достаточном контраст-фоне (полупрозрачная плашка), а текст не перекрывает значимые части картинки."),
      h("Ошибка 7. Опечатки в именах областей"),
      p("`grid-area: sidbar` при карте с областью `sidebar` не вызывает ошибки: такой области нет, и элемент уходит в неявные треки за пределами карты. В замере сетка с картой `\"nav main\"` (2 колонки, 1 строка) выросла до 4 колонок и 3 строк. Если элемент оказался не там, ищите опечатку; наложение Grid в DevTools покажет лишние треки."),
    ]),

    section("antipatterns", [
      ul(
        "**Номера линий везде** в макете страницы, где подходят имена.",
        "**Дублирование карты для каждого брейкпоинта** с разными именами: меняйте только карту, не правила элементов.",
        "**Позиционирование для наложения подписей** там, где работает одна ячейка.",
        "**Отрицательные поля и `calc(50% - 50vw)`** для full-bleed.",
        "**Перестановка смысла через `grid-area` и `order`.**",
        "**Слишком детальные карты** с десятками областей для простых компонентов.",
        "**Жёстко заданные высоты строк** в карте.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Именуйте области смыслом:** `head`, `nav`, `main`, `aside`, `foot`; в компонентах — `media`, `title`, `actions`.",
        "**Перестраивайте макет подменой карты** в медиазапросах или контейнерных запросах.",
        "**Размеры треков задавайте отдельно** (`minmax(0, 1fr)`, `auto`, `rem`).",
        "**Для full-bleed** — именованные линии `full`/`content`, а не хаки с `vw`.",
        "**Для наложения** — общая ячейка `1 / 1` и `align-self`/`justify-self`.",
        "**Порядок DOM = порядок чтения.**",
        "**Проверяйте карту DevTools и тестами** вычисленных стилей.",
        "**Документируйте имена областей** в README дизайн-системы.",
      ),
    ]),

    section("edge-cases", [
      h("Элементы без областей"),
      p("Если у элемента нет `grid-area`, он размещается автоматически в первую свободную ячейку — возможно, поверх или рядом с областями. Явно назначайте области всем детям контейнера."),
      h("Пересечение именованных линий"),
      p("Если имя встречается несколько раз (например, `[col]` у нескольких линий), можно ссылаться на n-ое вхождение: `grid-column: col 2 / col 4`."),
      h("`grid-template` и `grid`"),
      p("`grid-template: \"a b\" auto \"c d\" 1fr / 1fr 2fr` задаёт карту, высоты строк и ширины колонок за один раз. Сокращение `grid` ещё шире (включает `auto-*`). Для читаемости чаще пишут свойства отдельно."),
      h("Пустые области"),
      p("Область без элемента остаётся пустой, но занимает размеры, заданные треками. Если нужно, чтобы она «сворачивалась», задайте строку/столбец `auto`."),
      h("Области и `z-index`"),
      p("Элементы в одной области накладываются; чтобы поднять один, используйте `z-index`. Для grid-элементов он работает без `position` и создаёт контекст наложения."),
      h("Перестройка и анимация"),
      p("Смена `grid-template-areas` не анимируется плавно; плавными бывают лишь изменения размеров треков. Для плавной перестройки используйте анимацию размеров (`grid-template-columns`) и транзиции там, где это поддерживается."),
      h("Вложенные сетки и области"),
      p("Имена областей локальны для контейнера: внутри вложенной сетки одноимённые области — независимые. Выровнять внутреннюю сетку по линиям внешней позволяет `subgrid`."),
    ]),

    section("related", [
      ul(
        "[Grid: треки, линии и размещение](/learn/css/grid-basics) — основы и размещение по номерам.",
        "[Адаптивные сетки](/learn/css/grid-responsive) — `auto-fit`, `auto-fill`, `minmax()`.",
        "[Subgrid и выравнивание](/learn/css/subgrid-alignment) — наследование линий родителя.",
        "[Контейнерные запросы](/learn/css/container-queries) — адаптация карты по размеру контейнера.",
        "[Фокус и клавиатура](/learn/html/keyboard-focus) — порядок фокуса при перестановках.",
        "[Семантика страницы](/learn/html/landmarks) — `header`, `nav`, `main`, `aside`, `footer`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Номера и позиционирование",
          code: `
            .head { grid-column: 1 / 4; grid-row: 1; }
            .nav  { grid-column: 1; grid-row: 2; }
            .main { grid-column: 2; grid-row: 2; }
            .aside{ grid-column: 3; grid-row: 2; }
            .foot { grid-column: 1 / 4; grid-row: 3; }
            .full { width: 100vw; margin-left: calc(50% - 50vw); }
            .caption { position: absolute; bottom: 0; left: 0; right: 0; }
          `,
          note: "Макет читается только по числам; full-bleed — хак с `vw` (ломается из-за полосы прокрутки); подпись требует позиционированного родителя.",
        },
        {
          title: "Имена и наложение",
          code: `
            .page { grid-template-areas: "head head head" "nav main aside" "foot foot foot"; }
            .head { grid-area: head; }   .nav { grid-area: nav; }   .main { grid-area: main; }
            .article > .full { grid-column: full; }
            .figure > * { grid-area: 1 / 1; }
          `,
          note: "Макет — чертёж; full-bleed — именованная область; наложение — общая ячейка без позиционирования.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.grid-areas-placement.ex1",
      title: "Нарисуйте карту областей",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("Опишите картой `grid-template-areas` макет: шапка на всю ширину; под ней слева меню, справа основное содержимое; ниже подвал только под основным содержимым, а под меню — пустая ячейка."),
      ],
      hints: ["Сколько колонок и строк нужно?", "Как записать пустую ячейку?"],
      checks: ["Две колонки и три строки", "Шапка повторена в обеих колонках", "Пустая ячейка обозначена точкой"],
      solution: [
        code(
          "css",
          `
          .page {
            display: grid;
            grid-template-columns: 12rem minmax(0, 1fr);
            grid-template-areas:
              "head head"
              "nav  main"
              ".    foot";
          }
          `,
        ),
        p("Шапка названа в обеих колонках первой строки, поэтому занимает всю ширину. Точка в третьей строке — пустая ячейка под меню; подвал стоит только под основным содержимым. Если бы меню должно было тянуться на две строки, слово `nav` повторили бы в строках 2 и 3 вместо точки."),
      ],
    }),
    exercise({
      id: "css.grid-areas-placement.ex2",
      title: "Адаптивная перестройка карты",
      difficulty: "intermediate",
      kind: "engineering",
      prompt: [
        p("Макет «шапка / меню / содержимое / боковая колонка / подвал» нужно перестроить для экранов уже 40rem: порядок «шапка, содержимое, меню, боковая колонка, подвал» в один столбец. Элементы не должны получать новых правил. Напишите решение и объясните, почему порядок DOM остаётся логичным."),
      ],
      starter: {
        lang: "css",
        code: `
          .page { display: grid; grid-template-columns: 12rem minmax(0, 1fr) 10rem; grid-template-areas: "head head head" "nav main aside" "foot foot foot"; }
          .page > header { grid-area: head; }
          .page > nav { grid-area: nav; }
          .page > main { grid-area: main; }
          .page > aside { grid-area: aside; }
          .page > footer { grid-area: foot; }
        `,
      },
      hints: ["Что нужно заменить: размеры, карту или правила элементов?", "В каком порядке идёт разметка?"],
      checks: ["Одна колонка", "Карта переписана", "Правила элементов не менялись"],
      solution: [
        code(
          "css",
          `
          @media (max-width: 40rem) {
            .page {
              grid-template-columns: minmax(0, 1fr);
              grid-template-areas: "head" "main" "nav" "aside" "foot";
            }
          }
          `,
        ),
        ul(
          "Элементы остаются привязанными к областям по именам, поэтому их правила не нужны.",
          "Порядок DOM — «шапка, меню, содержимое, боковая колонка, подвал» или другой логичный: сетка меняет только визуальное расположение.",
          "Если меню должно быть доступно раньше содержимого для пользователей клавиатуры, в разметке оно идёт первым; на мобильной карте оно визуально ниже — проверьте, не вредит ли это (при необходимости добавьте ссылку-пропуск).",
        ),
      ],
    }),
    exercise({
      id: "css.grid-areas-placement.ex3",
      title: "Full-bleed без хаков",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Сделайте колонку статьи шириной до 40rem по центру, с боковыми полями не менее 1rem. Иллюстрация и цитата должны растягиваться на всю ширину окна. Не используйте `100vw`, отрицательные поля и `calc(50% - 50vw)`."),
      ],
      hints: ["Назовите линии границ колонки контента и всей сетки.", "Как задать «по умолчанию в центре» всем детям?"],
      checks: ["Именованные линии `content-*` и `full-*`", "Дети по умолчанию в `content`", "Особые блоки — `full`"],
      solution: [
        code(
          "css",
          `
          .article {
            display: grid;
            grid-template-columns:
              [full-start] minmax(1rem, 1fr)
              [content-start] minmax(0, 40rem)
              [content-end] minmax(1rem, 1fr)
              [full-end];
          }
          .article > *     { grid-column: content; }
          .article > .full { grid-column: full; }
          `,
          { lineNumbers: true },
        ),
        ul(
          "Центральный трек — `minmax(0, 40rem)`: до 40rem, но может сжаться.",
          "Боковые треки — `minmax(1rem, 1fr)`: гарантированное поле не менее 1rem и растягивающееся остальное место.",
          "`full` не зависит от полосы прокрутки и размеров окна; хаки с `vw` ломаются из-за полосы прокрутки.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "css.grid-areas-placement.challenge",
    title: "Макет страницы с тестом соответствия карты и порядка чтения",
    scenario: [
      p("Дизайн-система вводит единый макет страницы на Grid с областями и несколькими вариантами (с боковой колонкой и без, мобильный). Команда обеспокоена тем, что перестройки могут нарушить порядок чтения. Нужно реализовать макет и написать тест, который проверяет положение областей на трёх ширинах и **совпадение порядка фокуса с визуальным порядком** для основного содержимого."),
    ],
    requirements: [
      "Единый макет с областями `head`, `nav`, `main`, `aside`, `foot` и вариант без `aside`",
      "Мобильная карта без изменений правил элементов",
      "Тест положения областей на 1200, 800 и 400px",
      "Тест порядка: DOM-порядок областей и визуальный порядок (сверху вниз)",
    ],
    constraints: [
      "Нельзя использовать `order`",
      "Правила элементов не зависят от ширины окна",
    ],
    acceptance: [
      "Положения областей соответствуют ожидаемым на всех трёх ширинах",
      "На мобильных в одном столбце порядок сверху вниз: head, main, nav, aside, foot (осознанно описан)",
      "Тест сообщает, где визуальный порядок расходится с DOM",
      "Расхождение для nav на мобильных документировано и обосновано",
    ],
    hints: [
      "Как получить вертикальный порядок областей в тесте?",
      "Где допустимо расхождение DOM и визуального порядка?",
      "Как сравнить порядок?",
    ],
    solution: [
      code(
        "css",
        `
        .layout {
          display: grid;
          grid-template-columns: 14rem minmax(0, 1fr) 12rem;
          grid-template-areas: "head head head" "nav main aside" "foot foot foot";
          gap: 1rem;
        }
        .layout--no-aside { grid-template-columns: 14rem minmax(0, 1fr); grid-template-areas: "head head" "nav main" "foot foot"; }
        .layout > header { grid-area: head; }  .layout > nav { grid-area: nav; }  .layout > main { grid-area: main; }
        .layout > aside { grid-area: aside; }  .layout > footer { grid-area: foot; }

        @media (max-width: 40rem) {
          .layout, .layout--no-aside { grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "main" "nav" "aside" "foot"; }
        }
        `,
        { filename: "layout.css", lineNumbers: true },
      ),
      code(
        "js",
        `
        for (const width of [1200, 800, 400]) {
          await page.setViewportSize({ width, height: 800 });
          const rects = await page.evaluate(() => Object.fromEntries(
            ["header", "nav", "main", "aside", "footer"].map((t) => {
              const r = document.querySelector(".layout > " + t).getBoundingClientRect();
              return [t, { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width) }];
            })
          ));
          // широкий макет: nav слева от main, aside справа
          // мобильный: все в одной колонке сверху вниз: header, main, nav, aside, footer
          const dom = ["header", "nav", "main", "aside", "footer"];
          const visual = Object.entries(rects).sort((a, b) => a[1].top - b[1].top || a[1].left - b[1].left).map(([t]) => t);
          console.log(width, { dom, visual });   // 400: visual = header, main, nav, aside, footer
        }
        `,
        { filename: "layout.test.js" },
      ),
      ul(
        "**Карта:** меняется только `grid-template-areas`/`columns`; правила элементов (`grid-area`) постоянны. В варианте без боковой колонки элемент `aside` в разметке отсутствует: при его наличии он ушёл бы в неявные треки.",
        "**Порядок:** на узких экранах `main` оказывается выше `nav`, тогда как в DOM `nav` идёт раньше. Для пользователей клавиатуры это означает, что фокус сначала попадёт в `nav`. Это допустимо, если в начале страницы есть ссылка-пропуск к `main`; в противном случае лучше оставить `nav` в DOM после `main`.",
        "**Тест:** сопоставляет DOM-порядок и визуальный порядок и выводит расхождения; они должны быть **осознанными и описанными** в документации.",
        "**Без `order`:** все перестановки выражены картой областей; порядок фокуса не обещает визуального порядка.",
      ),
    ],
  },

  interview: [
    iq("css.grid-areas-placement.i1", "basic", "Как работает `grid-template-areas`?", [
      p("Карта в кавычках описывает ячейки сетки: каждая строка — строка сетки, каждое слово — ячейка; повторяющиеся имена образуют прямоугольную область. Элемент помещается в неё через `grid-area: имя`. Точка `.` — пустая ячейка."),
    ]),
    iq("css.grid-areas-placement.i2", "basic", "Зачем именованные линии?", [
      p("Они дают границам смысловые имена (`content-start`, `full-end`) и позволяют ссылаться на области по имени: `grid-column: content` вместо чисел. Макет становится читаемым и устойчивым к изменению числа колонок."),
    ]),
    iq("css.grid-areas-placement.i3", "intermediate", "Как реализовать full-bleed раскладку на Grid?", [
      p("Задать колонки `[full-start] minmax(1rem, 1fr) [content-start] minmax(0, 40rem) [content-end] minmax(1rem, 1fr) [full-end]`; детям по умолчанию `grid-column: content`, особым — `grid-column: full`. Без `100vw` и отрицательных полей."),
    ]),
    iq("css.grid-areas-placement.i4", "intermediate", "Как наложить подпись на изображение без `position`?", [
      p("Контейнер — Grid; изображению и подписи задать `grid-area: 1 / 1`. Они займут одну ячейку и наложатся по порядку DOM; подпись выравнивают `align-self: end`. Размер ячейки определяется самым большим из них."),
    ]),
    iq("css.grid-areas-placement.i5", "intermediate", "Что делает `grid-auto-flow: dense` и чем опасен?", [
      p("Заполняет «дыры» в сетке, перемещая мелкие элементы вперёд, чтобы они заняли пустые ячейки. Меняет визуальный порядок элементов без изменения порядка DOM, поэтому порядок чтения и фокуса расходится с видимым."),
    ]),
    iq("css.grid-areas-placement.i6", "advanced", "Какие ошибки делают `grid-template-areas` недопустимым?", [
      ul(
        "Строки карты с разным числом ячеек.",
        "Непрямоугольные или разорванные области.",
        "Пустая карта или синтаксические ошибки в строках.",
      ),
    ]),
    iq("css.grid-areas-placement.i7", "engineering", "Как организовать адаптивный макет на областях?", [
      ul(
        "Правила элементов постоянны (`grid-area: имя`); меняется только карта и размеры колонок в медиазапросах или контейнерных запросах.",
        "Порядок DOM логичен; визуальные перестановки документированы и проверены с точки зрения фокуса.",
        "Тесты положения областей на ключевых ширинах и порядка фокуса.",
      ),
    ]),
    iq("css.grid-areas-placement.i8", "debugging", "Области не применяются, всё идёт в одну колонку. Что проверите?", [
      ul(
        "Корректность карты: одинаковое число ячеек, прямоугольные области.",
        "Опечатки в именах `grid-area` относительно карты.",
        "Есть ли `display: grid` на контейнере и заданы ли `grid-template-columns`.",
        "Включить наложение Grid в DevTools и показать названия областей.",
      ),
    ]),
  ],

  exam: [
    mcq("css.grid-areas-placement.e1", "foundation", "Что обозначает точка `.` в `grid-template-areas`?", ["Область-заглушка", "Пустую ячейку", "Конец строки", "Ошибку"], 1, "Точка (или несколько подряд) — пустая ячейка, к которой не относится ни одна область."),
    mcq("css.grid-areas-placement.e2", "foundation", "Как элемент попадает в область `main`?", ["`grid-area: main`", "`area: main`", "`grid-template: main`", "`position: main`"], 0, "`grid-area` принимает имя области из карты."),
    mcq("css.grid-areas-placement.e3", "intermediate", "Что делает пара линий `[content-start]` и `[content-end]`?", ["Ничего", "Скрывает колонку", "Задаёт ширину", "Создаёт неявную область `content`, на которую можно ссылаться `grid-column: content`"], 3, "Имена с суффиксами `-start`/`-end` образуют неявную область с базовым именем."),
    mcq("css.grid-areas-placement.e4", "intermediate", "Как наложить два элемента в одну ячейку?", ["`position: absolute` обязательно", "`grid-area: 1 / 1` обоим", "`float: overlay`", "Нельзя"], 1, "Одинаковые координаты помещают элементы в одну ячейку; порядок DOM и `z-index` определяют, кто выше."),
    mcq("css.grid-areas-placement.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["Области в карте должны быть прямоугольными", "`dense` меняет порядок фокуса", "Подмена карты в медиазапросе перестраивает макет без новых правил элементов", "Строки карты могут содержать разное число слов"], [0, 2], "`dense` визуальный порядок меняет, но порядок фокуса остаётся по DOM; строки карты должны быть одинаковой длины."),
    mcq("css.grid-areas-placement.e6", "advanced", "Что произойдёт при опечатке в имени `grid-area`?", ["Ошибка в консоли", "Элемент скроется", "Элемент уйдёт в неявные треки за пределами карты, ошибки не будет", "Ничего"], 2, "Такой области в карте нет: браузер не выдаёт ошибок, а элемент размещается в неявных треках, и раскладка сдвигается."),
    open("css.grid-areas-placement.e7", "intermediate", "Объясните, почему перестановка областей не должна менять смысловой порядок.", [
      ul(
        "Сетка меняет только визуальное расположение; порядок фокуса и чтения скринридером остаётся по DOM.",
        "Расхождение запутывает пользователей клавиатуры и скринридеров (WCAG 1.3.2, 2.4.3).",
        "Порядок DOM нужно делать логичным, а расхождения — осознанными и документированными (ссылки-пропуски).",
      ),
    ], ["Названо различие визуального и DOM-порядка", "Указаны критерии доступности", "Предложены меры"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.grid-areas-placement.m1", "intermediate", "Какая запись центрального трека в full-bleed обеспечивает ширину до 40rem и возможность сжатия?", ["`40rem`", "`minmax(40rem, 1fr)`", "`1fr`", "`minmax(0, 40rem)`"], 3, "`minmax(0, 40rem)` ограничивает рост 40rem и позволяет сжиматься при узком окне."),
    mcq("css.grid-areas-placement.m2", "advanced", "Почему `calc(50% - 50vw)` для full-bleed хрупок?", ["`100vw` включает полосу прокрутки, и появляется горизонтальный скролл", "Это быстро", "Не поддерживается", "Оно слишком короткое"], 0, "`vw` включает ширину полосы прокрутки, поэтому хак выходит за область документа."),
    mcq("css.grid-areas-placement.m3", "advanced", "Два элемента в `grid-area: 1 / 1`. Кто выше без `z-index`?", ["Первый в DOM", "Последний в DOM", "Больший по размеру", "Случайный"], 1, "При одинаковом уровне позже стоящий в DOM рисуется выше."),
    open("css.grid-areas-placement.m4", "advanced", "Опишите, как построить систему макетов страниц на Grid с вариантами и тестами.", [
      ul(
        "Один контейнер `.layout` с областями; варианты — модификаторы, меняющие карту и размеры колонок; правила элементов постоянны.",
        "Адаптивность: подмена карты в медиазапросах/контейнерных запросах; не использовать `order`.",
        "Именованные линии для колонки контента и full-bleed.",
        "Тесты положения областей на ключевых ширинах и сравнение DOM- и визуального порядков; документация расхождений.",
        "Доступность: ссылки-пропуски, проверка клавиатурой и скринридером.",
      ),
    ], ["Единая система областей", "Именованные линии и full-bleed", "Тесты и доступность"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.grid-areas-placement.f1", front: "Карта областей?", back: "`grid-template-areas`: строки в кавычках, одинаковое число ячеек, прямоугольные области." },
    { id: "css.grid-areas-placement.f2", front: "Пустая ячейка?", back: "Точка `.` в карте." },
    { id: "css.grid-areas-placement.f3", front: "Именованные линии?", back: "`[content-start]`/`[content-end]` → область `content`; `grid-column: content`." },
    { id: "css.grid-areas-placement.f4", front: "Наложение в Grid?", back: "`grid-area: 1 / 1` для нескольких элементов; порядок DOM и `z-index`." },
    { id: "css.grid-areas-placement.f5", front: "`dense`?", back: "Заполняет дыры; меняет визуальный порядок, не порядок фокуса." },
    { id: "css.grid-areas-placement.f6", front: "Адаптивная перестройка?", back: "Подменить карту областей в медиазапросе; правила элементов не меняются." },
  ],

  sources: [
    { title: "CSS Grid Layout Module Level 2", url: "https://www.w3.org/TR/css-grid-2/", publisher: "W3C" },
    { title: "MDN: Grid template areas", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Grid_template_areas", publisher: "MDN" },
    { title: "MDN: grid-template-areas", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas", publisher: "MDN" },
    { title: "MDN: Layout using named grid lines", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Grid_layout_using_named_grid_lines", publisher: "MDN" },
    { title: "MDN: grid-auto-flow", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/grid-auto-flow", publisher: "MDN" },
    { title: "WCAG 2.2: Meaningful Sequence", url: "https://www.w3.org/TR/WCAG22/#meaningful-sequence", publisher: "W3C" },
  ],
};
