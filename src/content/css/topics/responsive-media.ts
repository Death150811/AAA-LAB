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
  open,
  p,
  section,
  steps,
  table,
  ul,
  wrongRight,
} from "../../dsl";

export const responsiveMedia: Topic = {
  id: "css.responsive-media",
  slug: "responsive-media",
  domain: "css",
  module: "responsive",
  title: "Адаптивные изображения и медиа в CSS",
  titleEn: "Responsive media in CSS: max-width, aspect-ratio, object-fit, SVG, backgrounds, embeds",
  summary:
    "Изображения, видео и встраиваемые окна — заменяемые элементы со своими правилами размеров. Тема разбирает CSS-сторону адаптивных медиа: сброс `max-width: 100%; height: auto`, почему атрибуты `width`/`height` предотвращают скачки макета, как работает `aspect-ratio` и где он «не слушается», что делают `object-fit` и `object-position`, как ведёт себя SVG, как оформлять фоновые изображения, `image-set()` и запрос `resolution`, и как делать адаптивные встраивания (iframe, видео).",
  minutes: 50,
  prerequisites: ["css.box-model", "css.overflow-sizing"],
  tags: ["img", "max-width", "height: auto", "aspect-ratio", "object-fit", "object-position", "svg", "viewBox", "background-size", "image-set", "resolution", "iframe", "video", "CLS", "layout shift", "replaced elements"],
  keyConcepts: [
    { term: "Заменяемый элемент", text: "`img`, `video`, `iframe`, `svg`, `canvas` имеют собственные («внутренние») размеры и пропорции, которые CSS должен учитывать, а не ломать." },
    { term: "Сброс `max-width: 100%; height: auto`", text: "`max-width: 100%` не даёт картинке выйти из контейнера, `height: auto` сохраняет пропорции. Только `max-width` с атрибутом `height` растягивает картинку (300×400 вместо 300×150)." },
    { term: "Атрибуты `width` и `height`", text: "Задают пропорции до загрузки. В замере незагруженная картинка с атрибутами зарезервировала 300×150, а без них — 0×0: страница «прыгала» бы при загрузке." },
    { term: "`aspect-ratio` и `object-fit`", text: "Рамка и содержимое — разные задачи: `aspect-ratio` задаёт форму рамки, `object-fit` решает, как картинка вписывается в неё (`cover`, `contain`, …)." },
    { term: "Контент — `<img>`, декор — фон", text: "Смысловая картинка требует `alt` и живёт в `<img>`; декоративная — фон или `<img alt=\"\">`. Фоновые изображения не читаются скринридерами." },
  ],
  sections: [
    section("definition", [
      def("Заменяемый элемент", "Элемент, содержимое которого не описывается CSS: `img`, `video`, `iframe`, `svg`, `canvas`, `embed`. Имеет внутренние размеры и/или пропорции.", "replaced element"),
      def("Внутренние размеры и пропорции", "Собственные ширина, высота и отношение сторон у изображения или видео (`intrinsic size`, `intrinsic ratio`). Если размеров нет, используется размер по умолчанию 300×150.", "intrinsic dimensions"),
      def("`aspect-ratio`", "Свойство, задающее предпочтительное отношение ширины к высоте рамки (`16 / 9`). Для заменяемых элементов с собственными пропорциями — переопределяет их.", "aspect-ratio"),
      def("`object-fit`", "Свойство, определяющее, как содержимое заменяемого элемента вписывается в его рамку: `fill`, `contain`, `cover`, `none`, `scale-down`.", "object-fit"),
      def("Смещение макета (CLS)", "Неожиданное перемещение содержимого при загрузке (например, картинка без заданных размеров). Метрика Cumulative Layout Shift в Core Web Vitals измеряет его; значение до 0.1 считается хорошим.", "cumulative layout shift"),
    ]),

    section("why", [
      h("Картинка — главная причина сломанной вёрстки"),
      p("Картинка шириной 800px в колонке 300px вылезает за границу. Растянутая картинка искажает пропорции и выглядит небрежно. Незагруженная картинка без размеров занимает ноль пикселей, а после загрузки раздвигает страницу: текст «прыгает» под пальцем пользователя."),
      h("Что даёт правильный CSS для медиа"),
      ul(
        "**Нет переполнения:** картинки и встраивания не шире контейнера.",
        "**Сохранённые пропорции:** без растягивания и сплющивания.",
        "**Стабильный макет:** место под картинку резервируется до загрузки.",
        "**Единообразные рамки:** карточки с разными по пропорциям фото выглядят ровно (`aspect-ratio` + `object-fit`).",
        "**Чёткость на любом экране:** фон и `image-set()` учитывают плотность пикселей.",
      ),
      insight("Две независимые задачи: **какого размера рамка** (ширина, высота, пропорции) и **как картинка вписана в рамку** (`object-fit`, `object-position`). Не смешивайте их."),
    ]),

    section("mental-model", [
      p("Представьте **картину в раме за стеклом**. Рама — это сам элемент `<img>`: её размер задают `width`, `height`, `aspect-ratio`. Картина — содержимое: её можно растянуть на всю раму (`fill`), вписать целиком с полями (`contain`), заполнить раму с обрезкой (`cover`) или оставить в натуральную величину (`none`). Куда сместить картину внутри рамы, решает `object-position`."),
      diagram(
        `
        изображение 800 × 400 (слева красное, справа синее), рамка 200 × 200

        fill (по умолчанию)   cover                  contain                none
        +-----+-----+         +-----+-----+          +-----------+          +-----+-----+
        |красн|синий|         |красн|синий|          |  (поле)   |          |красн|синий|
        |     |     |         |     |     |          |красн|синий|          | центр оригинала |
        |растянуто  |         |обрезано по бокам     |  (поле)   |          | обрезан со всех сторон
        +-----+-----+         +-----+-----+          +-----------+          +-----+-----+

        cover + object-position: left  → видна только красная часть
        `,
        "Как картинка вписывается в рамку",
      ),
      table(
        ["Вопрос", "Свойства"],
        [
          ["Какой размер у рамки?", "`width`, `height`, `max-width`, `aspect-ratio`, атрибуты `width`/`height`"],
          ["Как картинка вписывается в рамку?", "`object-fit`, `object-position`"],
          ["Что видно, пока картинка не загрузилась?", "Атрибуты `width`/`height` (пропорции), `background-color`, `alt`"],
        ],
        "Три независимых вопроса",
      ),
    ]),

    section("technical", [
      h("Базовый сброс"),
      code(
        "css",
        `
        img, video, svg, canvas {
          display: block;
          max-width: 100%;
          height: auto;
        }
        `,
        { filename: "media-reset.css" },
      ),
      p("Замер для картинки 800×400 с атрибутами `width=\"800\" height=\"400\"` в контейнере 300px:"),
      table(
        ["CSS", "Размер", "Комментарий"],
        [
          ["без правил", "800 × 400", "Выходит из контейнера на 500px"],
          ["`max-width: 100%`", "300 × 400", "Ширина ограничена, а высота из атрибута осталась — картинка растянута по вертикали"],
          ["`max-width: 100%; height: auto`", "300 × 150", "Пропорции сохранены"],
          ["`width: 100%; height: auto`", "300 × 150", "Заполняет контейнер и сохраняет пропорции (увеличивает маленькие картинки)"],
        ],
        "Размер картинки в контейнере 300px",
      ),
      ul(
        "`display: block` убирает зазор снизу, возникающий у строчной картинки из-за базовой линии.",
        "`max-width: 100%` не увеличивает картинку выше натурального размера; `width: 100%` — увеличивает.",
        "Процентный `max-width` у заменяемого элемента не заставляет колонку растягиваться: картинка в сетке `1fr 1fr` шириной 300px сжалась до 150px.",
      ),
      h("Атрибуты `width` и `height`: место до загрузки"),
      code(
        "html",
        `
        <img src="photo.jpg" alt="Описание" width="800" height="400" loading="lazy">
        `,
        { filename: "img-attrs.html" },
      ),
      p("Атрибуты задают пропорции: браузер рассчитывает отношение сторон `800 / 400` и резервирует место, ещё не получив файл. Замер: картинка с атрибутами, запрос которой не завершился, при `max-width: 100%; height: auto` в контейнере 300px заняла **300×150**, а без атрибутов — **0×0**. После загрузки такая картинка расталкивала бы страницу."),
      note("Атрибуты `width` и `height` — это не «пиксели на экране», а пара чисел для расчёта пропорций. Фактический размер задаёт CSS (`height: auto` обязателен, иначе атрибут `height` останется абсолютным)."),
      h("`aspect-ratio`"),
      code(
        "css",
        `
        .thumb  { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; height: auto; }
        .embed  { width: 100%; aspect-ratio: 16 / 9; border: 0; }
        .square { aspect-ratio: 1; }
        `,
        { filename: "aspect-ratio.css" },
      ),
      ul(
        "Для iframe шириной 640px `aspect-ratio: 16 / 9` дал высоту 360px — без обёртки с `padding-top: 56.25%`.",
        "**Ловушка 1.** Атрибут `height` у `<img>` задаёт явную высоту. Когда и ширина, и высота заданы, `aspect-ratio` не используется: в замере картинка с `width: 100%; aspect-ratio: 16/9` и атрибутами 800×400 получила 300×400. С `height: auto` — 300×168.8.",
        "**Ловушка 2.** Для обычных блоков `aspect-ratio` — предпочтение, а не жёсткое правило: блок шириной 200px с `aspect-ratio: 1` и содержимым высотой 300px вырос до 300px. С `overflow: hidden` (или `min-height: 0`) остаётся 200px.",
      ),
      h("`object-fit` и `object-position`"),
      code(
        "css",
        `
        .photo { width: 100%; height: 12rem; object-fit: cover; object-position: 50% 30%; }
        `,
        { filename: "object-fit.css" },
      ),
      table(
        ["Значение", "Поведение", "Замер (картинка 800×400, рамка 200×200)"],
        [
          ["`fill` (по умолчанию)", "Растягивает, пропорции не сохраняет", "красная левая половина и синяя правая заполняют рамку"],
          ["`cover`", "Заполняет рамку, лишнее обрезает", "то же по центру; с `object-position: left` видна только красная часть"],
          ["`contain`", "Вписывает целиком, остаются поля", "сверху и снизу видны поля (цвет фона рамки)"],
          ["`none`", "Натуральный размер, лишнее обрезается", "виден центральный фрагмент оригинала"],
          ["`scale-down`", "Меньшее из `none` и `contain`", "для большой картинки совпал с `contain`"],
        ],
        "Режимы вписывания",
      ),
      p("`object-position` задаёт, какая часть картинки остаётся видимой при `cover` и `none` (`50% 30%` — чуть выше центра). Для фото с лицами выбирайте точку интереса: обрезка по центру может срезать голову."),
      h("SVG"),
      code(
        "html",
        `
        <svg viewBox="0 0 100 50" role="img" aria-label="Логотип"> … </svg>
        `,
        { filename: "svg-viewbox.html" },
      ),
      ul(
        "Встроенный `<svg>` с `viewBox` и без `width`/`height` заполняет ширину контейнера и подбирает высоту по пропорциям: в контейнере 500px — 500×250.",
        "Без `viewBox` и размеров размер по умолчанию — 300×150, независимо от контейнера (замер в том же контейнере).",
        "Явный `width: 2rem` с `viewBox` 100×50 даёт 32×16 — пропорции сохраняются через `viewBox`.",
        "Для иконок задавайте размер в `em`/`rem` (`width: 1.25em`), чтобы они масштабировались вместе с текстом.",
      ),
      h("Фоновые изображения"),
      code(
        "css",
        `
        .hero {
          min-height: 50vh;
          background: #1a237e url("hero.jpg") center / cover no-repeat;
        }
        .logo-bg { background: url("logo.svg") left center / contain no-repeat; }
        `,
        { filename: "backgrounds.css" },
      ),
      table(
        ["Значение `background-size`", "Поведение"],
        [
          ["`cover`", "Заполняет блок, лишнее обрезается (как `object-fit: cover`)"],
          ["`contain`", "Вписывает целиком, возможны поля"],
          ["`auto` (по умолчанию)", "Натуральный размер, повторяется плиткой"],
          ["`100% auto`, `20rem`", "Явные размеры"],
        ],
        "Размеры фона",
      ),
      ul(
        "**Контент — в `<img>` с `alt`, декор — в фоне.** У фона нет текстовой альтернативы, его не видят скринридеры и режим принудительных цветов.",
        "Фон не участвует в размерах блока: задайте `min-height` или `aspect-ratio`, иначе блок схлопнётся.",
        "Контраст текста поверх фото обеспечивайте затемняющим слоем, а не надеждой на «светлую область» картинки.",
      ),
      h("Плотность пикселей: `image-set()` и `resolution`"),
      code(
        "css",
        `
        .logo { background-image: url("logo.png"); }

        @media (min-resolution: 2dppx) {
          .logo { background-image: url("logo@2x.png"); }
        }

        .badge { background-image: image-set(url("badge.png") 1x, url("badge@2x.png") 2x); }
        `,
        { filename: "resolution.css" },
      ),
      p("Замер при `deviceScaleFactor: 2`: `(min-resolution: 2dppx)` и `(min-resolution: 192dpi)` истинны (1dppx = 96dpi), `(min-resolution: 3dppx)` ложно, а на обычном экране `(min-resolution: 2dppx)` ложно; `image-set()` поддерживается. Для `<img>` с несколькими файлами используйте `srcset` и `sizes` — подробно в теме HTML «Адаптивные изображения»."),
      h("Адаптивные встраивания"),
      code(
        "css",
        `
        iframe, video { display: block; width: 100%; aspect-ratio: 16 / 9; border: 0; }
        `,
        { filename: "embed.css" },
      ),
      p("Замер: iframe в блоке шириной 640px получает высоту 360px. Для видео с собственными пропорциями достаточно `max-width: 100%; height: auto`; для iframe, у которого собственных пропорций нет, нужен `aspect-ratio`."),
      h("Изображения во flex и grid"),
      p("Картинка с `max-width: 100%` как flex-элемент в ряду 300px сжалась до 300×150; в сетке `1fr 1fr` шириной 300px — до 150×75. Процентный максимум у заменяемого элемента не раздувает минимальный размер колонки, поэтому сетки с картинками ведут себя предсказуемо. Без `max-width: 100%` картинка влияет на размер колонки и может её распереть."),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        img { display: block; max-width: 100%; height: auto; }

        .card__media {
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          object-position: 50% 30%;
          background: #c5cae9;
        }

        .embed iframe { width: 100%; aspect-ratio: 16 / 9; border: 0; }
        `,
        [
          { line: 1, text: "Сброс для всех картинок: не шире контейнера, пропорции из `height: auto`. Атрибуты `width`/`height` в разметке дают пропорции до загрузки." },
          { line: [3, 9], text: "Единая рамка 16:9 для фото разных пропорций. `object-fit: cover` обрезает лишнее, `object-position` выбирает, что оставить. Фон рамки виден, пока картинка грузится." },
          { line: 11, text: "У iframe нет собственных пропорций, поэтому форму задаёт `aspect-ratio` вместо обёртки с `padding-top`." },
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
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>object-fit</title>
        <style>
          body { margin: 0; padding: 1rem; font: 16px/1.5 system-ui, sans-serif; }
          .row { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr)); }
          figure { margin: 0; }
          figcaption { font: 0.875rem/1.4 monospace; }
          img { display: block; width: 100%; height: auto; aspect-ratio: 1; background: #c5cae9; }
        </style>
        <div class="row">
          <figure><img style="object-fit: fill" alt="Растянуто" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgODAwIDQwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNjNjI4MjgiLz48cmVjdCB4PSI0MDAiIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMTU2NWMwIi8+PGNpcmNsZSBjeD0iNDAwIiBjeT0iMjAwIiByPSIxMTAiIGZpbGw9IiNmZGQ4MzUiLz48L3N2Zz4=" width="800" height="400"><figcaption>fill</figcaption></figure>
          <figure><img style="object-fit: cover" alt="Заполняет с обрезкой" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgODAwIDQwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNjNjI4MjgiLz48cmVjdCB4PSI0MDAiIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMTU2NWMwIi8+PGNpcmNsZSBjeD0iNDAwIiBjeT0iMjAwIiByPSIxMTAiIGZpbGw9IiNmZGQ4MzUiLz48L3N2Zz4=" width="800" height="400"><figcaption>cover</figcaption></figure>
          <figure><img style="object-fit: cover; object-position: left" alt="Заполняет, левая часть" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgODAwIDQwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNjNjI4MjgiLz48cmVjdCB4PSI0MDAiIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMTU2NWMwIi8+PGNpcmNsZSBjeD0iNDAwIiBjeT0iMjAwIiByPSIxMTAiIGZpbGw9IiNmZGQ4MzUiLz48L3N2Zz4=" width="800" height="400"><figcaption>cover + left</figcaption></figure>
          <figure><img style="object-fit: contain" alt="Вписано целиком" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgODAwIDQwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNjNjI4MjgiLz48cmVjdCB4PSI0MDAiIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMTU2NWMwIi8+PGNpcmNsZSBjeD0iNDAwIiBjeT0iMjAwIiByPSIxMTAiIGZpbGw9IiNmZGQ4MzUiLz48L3N2Zz4=" width="800" height="400"><figcaption>contain</figcaption></figure>
        </div>
        </html>
        `,
        { filename: "object-fit.html", runnable: true },
      ),
      p("Одна и та же картинка 800×400 в квадратной рамке: `fill` её искажает, `cover` обрезает, `contain` вписывает с полями (виден фон рамки). Измените `object-position` и посмотрите, какая часть остаётся в кадре."),
    ]),

    section("detailed-example", [
      p("Лента с разнопропорциональными фото: у всех карточек рамка 4:3, у «героя» — 21:9, видео-встраивание 16:9. У каждой картинки есть `width`/`height` для резервирования места, а смысловая нагрузка отражена в `alt`. Фон рамки виден, пока картинка не загрузилась."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Адаптивные медиа</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; padding: 1rem; font: 1rem/1.5 system-ui, sans-serif; color: #1b1b1f; background: #f4f5fb; }
          img, iframe { display: block; max-width: 100%; height: auto; }

          .wrap { max-width: 64rem; margin-inline: auto; display: grid; gap: 1rem; }
          .hero img { width: 100%; aspect-ratio: 21 / 9; object-fit: cover; background: #c5cae9; border-radius: 0.5rem; }
          .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); }
          .tile { margin: 0; background: #fff; border-radius: 0.5rem; overflow: hidden; }
          .tile img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: #c5cae9; }
          .tile figcaption { padding: 0.5rem 0.75rem; font-size: 0.875rem; }
          .embed iframe { width: 100%; aspect-ratio: 16 / 9; border: 0; background: #fff; border-radius: 0.5rem; }
          .icon { display: inline-block; width: 1.25em; height: 1.25em; vertical-align: -0.25em; }
        </style>
        <div class="wrap">
          <header class="hero">
            <img alt="Красное и синее поле с жёлтым кругом на границе" width="800" height="400"
                 src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgODAwIDQwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNjNjI4MjgiLz48cmVjdCB4PSI0MDAiIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMTU2NWMwIi8+PGNpcmNsZSBjeD0iNDAwIiBjeT0iMjAwIiByPSIxMTAiIGZpbGw9IiNmZGQ4MzUiLz48L3N2Zz4=">
          </header>
          <main class="grid">
            <figure class="tile">
              <img alt="Зелёная и фиолетовая половины с белым кругом" width="400" height="600"
                   src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgNDAwIDYwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMyZTdkMzIiLz48cmVjdCB5PSIzMDAiIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjNmExYjlhIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMzAwIiByPSI5MCIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPg==">
              <figcaption>Портретное фото в рамке 4:3</figcaption>
            </figure>
            <figure class="tile">
              <img alt="Оранжевый фон с тёмной горой" width="500" height="500"
                   src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiB2aWV3Qm94PSIwIDAgNTAwIDUwMCI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiNlZjZjMDAiLz48cGF0aCBkPSJNMCA1MDAgTDI1MCAxMjAgTDUwMCA1MDBaIiBmaWxsPSIjNGUzNDJlIi8+PC9zdmc+">
              <figcaption>Квадратное фото в рамке 4:3</figcaption>
            </figure>
            <figure class="tile">
              <img alt="Красное и синее поле с жёлтым кругом на границе" width="800" height="400"
                   src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgODAwIDQwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNjNjI4MjgiLz48cmVjdCB4PSI0MDAiIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMTU2NWMwIi8+PGNpcmNsZSBjeD0iNDAwIiBjeT0iMjAwIiByPSIxMTAiIGZpbGw9IiNmZGQ4MzUiLz48L3N2Zz4=">
              <figcaption>Панорамное фото в рамке 4:3</figcaption>
            </figure>
          </main>
          <div class="embed">
            <iframe title="Демонстрация встраивания" srcdoc="<p style='font:16px system-ui;padding:1rem'>Встраивание 16:9 без обёртки</p>"></iframe>
          </div>
        </div>
        </html>
        `,
        { filename: "responsive-media.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает"],
        [
          ["`img, iframe { display: block; max-width: 100%; height: auto }`", "Сброс: не шире контейнера, пропорции сохраняются, нет зазора снизу"],
          ["`width`/`height` в разметке", "Дают пропорции до загрузки: место резервируется, страница не прыгает"],
          ["`.tile img { aspect-ratio: 4 / 3; object-fit: cover }`", "Все фото в одинаковой рамке 4:3, вне зависимости от оригинальных пропорций"],
          ["`.hero img { aspect-ratio: 21 / 9 }`", "Широкая рамка героя; `height: auto` из сброса обязателен, иначе атрибут `height` перебил бы `aspect-ratio`"],
          ["`.embed iframe { aspect-ratio: 16 / 9 }`", "Встраивание держит форму 16:9 без обёртки с `padding-top`"],
          ["`background: #c5cae9` у картинок", "Цвет рамки виден, пока файл загружается, и в случае ошибки"],
        ],
        "Как устроена страница",
      ),
      ul(
        "Сетка карточек строится автоповтором колонок: число колонок подбирается по ширине, а рамки картинок — по пропорции.",
        "Для картинок и сетки дважды выполнена одна и та же идея: **рамка задаётся CSS, содержимое вписывается через `object-fit`**.",
        "Если фото важно целиком (схемы, скриншоты), используйте `object-fit: contain`, а не `cover`: обрезка потеряет информацию.",
      ),
    ]),

    section("internals", [
      h("Как браузер считает размер картинки"),
      steps(
        [
          ["Внутренние размеры", "Если файл уже загружен, у картинки есть собственные размеры и пропорции. До загрузки пропорции берутся из атрибутов `width` и `height` (они превращаются в `aspect-ratio: auto W / H`)."],
          ["Определение рамки", "Ширина берётся из `width`/`max-width`; если ширина `auto`, а внутренних размеров нет, используется размер по умолчанию 300×150. Если заданы и ширина, и высота (в том числе высота из атрибута), `aspect-ratio` не применяется."],
          ["Ограничения", "`max-width`, `min-width`, `max-height` усекают размер; при `height: auto` высота подбирается по пропорции."],
          ["Вписывание содержимого", "`object-fit` и `object-position` определяют, как картинка размещается внутри уже посчитанной рамки; на размер рамки они не влияют."],
          ["Отрисовка", "Часть картинки за пределами рамки обрезается; незакрытая часть показывает фон элемента."],
        ],
        "Размеры заменяемого элемента",
      ),
      h("Проверка в DevTools и в коде"),
      code(
        "js",
        `
        const img = document.querySelector("img");
        console.log(img.naturalWidth, img.naturalHeight);        // внутренние размеры (0 до загрузки)
        console.log(img.getBoundingClientRect().height);         // фактическая высота рамки
        console.log(getComputedStyle(img).objectFit, getComputedStyle(img).aspectRatio);
        `,
        { filename: "check-image.js" },
      ),
      note("В панели Computed видно, откуда взята высота: если `height` задана числом, а ожидалось `auto`, найдите её в атрибуте разметки: он работает как стиль с самым низким приоритетом (его легко переопределить через `height: auto`), но пока он не переопределён, высота считается заданной."),
    ]),

    section("mistakes", [
      h("Ошибка 1. `max-width` без `height: auto`"),
      wrongRight(
        "css",
        {
          code: `
            img { max-width: 100%; }
          `,
          note: "Картинка с атрибутами 800×400 в контейнере 300px стала 300×400: ширина сжалась, высота осталась из атрибута.",
        },
        {
          code: `
            img { max-width: 100%; height: auto; }
          `,
          note: "Пропорции сохраняются: 300×150.",
        },
      ),
      h("Ошибка 2. Нет `width` и `height` в разметке"),
      p("Незагруженная картинка занимает 0×0, а после загрузки раздвигает страницу. Замер: с атрибутами — 300×150 зарезервированы сразу, без них — 0×0. Всегда указывайте атрибуты с натуральными размерами файла."),
      h("Ошибка 3. `aspect-ratio` вместе с атрибутом `height`"),
      p("Атрибут `height` на `<img>` задаёт явную высоту, а при заданных ширине и высоте `aspect-ratio` не используется: в замере `width: 100%; aspect-ratio: 16/9` дал 300×400. Добавьте `height: auto` в сброс или в правило компонента: получится 300×168.8."),
      h("Ошибка 4. Ожидание, что `aspect-ratio` жёсткий"),
      p("Для обычного блока `aspect-ratio` — предпочтение: блок шириной 200px с содержимым выше растёт (замер: 300px при `aspect-ratio: 1`). Чтобы форма не нарушалась, используйте `overflow: hidden` или `min-height: 0`, а лишнее содержимое обрабатывайте явно."),
      h("Ошибка 5. `cover` для важных изображений"),
      p("Скриншоты, диаграммы и логотипы с подписями нельзя обрезать. Для них — `object-fit: contain` и фон рамки; для фото — `cover` с осмысленным `object-position`."),
      h("Ошибка 6. Фон вместо `<img>` для содержимого"),
      p("У фоновых изображений нет `alt`, их не видят скринридеры, и они пропадают в режиме принудительных цветов и при печати. Если картинка несёт смысл, оформляйте её как `<img>`."),
      h("Ошибка 7. SVG без `viewBox`"),
      p("Встроенный `<svg>` без `viewBox` и размеров получает 300×150 и не масштабируется по контейнеру (замер при контейнере 500px). С `viewBox` — 500×250."),
      h("Ошибка 8. Фиксированная высота рамки для переменной ширины"),
      p("`height: 200px` для картинок, ширина которых меняется, искажает или сильно обрезает фото. Задавайте пропорцию (`aspect-ratio`) и позволяйте высоте меняться вместе с шириной."),
    ]),

    section("antipatterns", [
      ul(
        "**`width: 100%` и фиксированная высота** вместо `aspect-ratio` и `object-fit`.",
        "**Обёртки с `padding-top: 56.25%`** вместо `aspect-ratio` для встраиваний.",
        "**Отсутствие `width`/`height`** — скачки макета при загрузке.",
        "**Содержательные картинки в `background-image`** без текстовой альтернативы.",
        "**`object-fit: cover` для схем и скриншотов.**",
        "**Увеличение растровых картинок** через `width: 100%` в рамке шире оригинала: картинка размывается.",
        "**Одинаковая картинка для всех экранов** без `srcset`/`picture`, когда размеры сильно различаются.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Сброс:** `img, video, svg { display: block; max-width: 100%; height: auto }`.",
        "**Атрибуты `width` и `height`** с натуральными размерами файла — всегда.",
        "**Форма карточек — `aspect-ratio`**, вписывание — `object-fit`, фокус — `object-position`.",
        "**Контент — `<img alt>`**, декор — фон или `alt=\"\"`.",
        "**Фон блока** (`background-color`) под картинкой: виден при загрузке и ошибке.",
        "**`image-set()`/`resolution` для фонов**, `srcset` и `sizes` для `<img>`.",
        "**Иконки в `em`/`rem`**, чтобы они масштабировались вместе с текстом.",
        "**Тесты:** проверка отсутствия горизонтальной прокрутки и резервирования места до загрузки.",
      ),
    ]),

    section("edge-cases", [
      h("Картинка в строке текста"),
      p("Строчная картинка стоит на базовой линии, и под ней появляется зазор высотой в нижний выносной элемент шрифта. `display: block` или `vertical-align: middle` его убирает."),
      h("Картинка за пределами контейнера в сетке"),
      p("Без `max-width: 100%` картинка влияет на минимальный размер колонки и может её раздвинуть. С процентным `max-width` картинка в колонке `1fr 1fr` шириной 300px сжалась до 150px."),
      h("Анимированные и векторные изображения"),
      p("SVG масштабируется без потери качества, но требует `viewBox`. Анимированные GIF/WebP занимают много памяти — уважайте `prefers-reduced-motion` (например, подменой источника в `<picture>`)."),
      h("Темы оформления"),
      p("Для тёмной темы можно подменять изображения через `<picture>` с `media=\"(prefers-color-scheme: dark)\"`, а для SVG-иконок использовать `currentColor`."),
      h("Печать"),
      p("Фоновые изображения при печати часто отключены; контентные `<img>` печатаются. Ещё одна причина не прятать смысл в фоне."),
      h("Высота экрана и герои"),
      p("`min-height: 100vh` на мобильных браузерах с динамической панелью адреса может быть выше видимой области; вариант `100dvh` учитывает изменение панели. Проверяйте поддержку и запасной вариант."),
    ]),

    section("related", [
      ul(
        "[Адаптивные изображения в HTML](/learn/html/responsive-images) — `srcset`, `sizes`, `<picture>`.",
        "[Изображения: img, alt и размеры](/learn/html/images) — `alt`, `width`/`height`, ленивая загрузка.",
        "[Блочная модель](/learn/css/box-model) — размеры и границы рамки.",
        "[Переполнение и размеры](/learn/css/overflow-sizing) — `overflow`, `min-height`, `aspect-ratio`.",
        "[Адаптивные сетки](/learn/css/grid-responsive) — картинки в `auto-fit` сетках.",
        "[Плавная типографика и отступы](/learn/css/fluid-typography-spacing) — `em` для иконок и отступов.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Хаки с фиксированными размерами",
          code: `
            .thumb img { width: 100%; height: 200px; }                      /* искажение */
            .video { position: relative; padding-top: 56.25%; }
            .video iframe { position: absolute; inset: 0; width: 100%; height: 100%; }
          `,
          note: "Фиксированная высота искажает фото; для iframe нужна обёртка с процентным `padding-top` и позиционирование.",
        },
        {
          title: "aspect-ratio и object-fit",
          code: `
            .thumb img { width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; }
            .video iframe { width: 100%; aspect-ratio: 16 / 9; border: 0; }
          `,
          note: "Форма рамки и вписывание содержимого задаются отдельно; нет обёрток и абсолютного позиционирования.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.responsive-media.ex1",
      title: "Растянутая картинка",
      difficulty: "foundation",
      kind: "debugging",
      prompt: [
        p("Картинка 800×400 с атрибутами `width=\"800\" height=\"400\"` в колонке шириной 300px выглядит вытянутой по вертикали. В CSS: `img { max-width: 100%; }`. Объясните причину и исправьте. Какой размер получится?"),
      ],
      starter: {
        lang: "css",
        code: `
          img { max-width: 100%; }
        `,
      },
      hints: ["Откуда берётся высота?", "Какое значение возвращает пропорциональный расчёт высоты?"],
      checks: ["Причина: высота из атрибута", "Исправление: `height: auto`", "Размер 300×150"],
      solution: [
        code(
          "css",
          `
          img { max-width: 100%; height: auto; }
          `,
        ),
        p("**Причина.** Атрибут `height=\"400\"` задаёт явную высоту, а `max-width: 100%` ограничивает только ширину: получилось 300×400 (замер). `height: auto` возвращает расчёт по пропорциям: 300×150."),
      ],
    }),
    exercise({
      id: "css.responsive-media.ex2",
      title: "Карточка 16:9 не держит пропорцию",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Превью в карточках должно быть 16:9 с обрезкой лишнего. В коде `width: 100%; aspect-ratio: 16 / 9; object-fit: cover;`, а в разметке `<img width=\"800\" height=\"400\">`. В колонке 300px высота получилась 400px. Найдите причину и исправьте. Какая высота получится после исправления?"),
      ],
      starter: {
        lang: "css",
        code: `
          .card img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
        `,
      },
      hints: ["Что делает атрибут `height` у `<img>`?", "Какое значение «снимает» явную высоту?"],
      checks: ["Причина: заданная высота (атрибут `height`) отключает `aspect-ratio`", "Исправление: `height: auto`", "Высота 168.8px"],
      solution: [
        code(
          "css",
          `
          .card img { width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; }
          `,
        ),
        p("Явная высота из атрибута (400px) побеждает `aspect-ratio` — замер дал 300×400. С `height: auto` рамка получает форму 16:9: `300 / (16/9) = 168.75`, в замере 168.8px."),
      ],
    }),
    exercise({
      id: "css.responsive-media.ex3",
      title: "Квадрат, который вырос",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Блок шириной 200px с `aspect-ratio: 1` содержит дочерний элемент высотой 300px. Какая высота у блока? Что сделать, чтобы блок остался квадратом, а лишнее содержимое прокручивалось? Что изменится, если вместо блока взять `<img>` с `object-fit: cover`?"),
      ],
      hints: ["`aspect-ratio` — предпочтение или правило?", "Что устанавливает минимальную высоту для блока с видимым переполнением?"],
      checks: ["Высота 300px", "`overflow: auto` (или `hidden`)", "У `<img>` содержимое вписывается, а рамка остаётся квадратом"],
      solution: [
        p("Высота будет **300px** (замер): у блока с `overflow: visible` минимальная высота по содержимому, и `aspect-ratio` её не нарушает."),
        code(
          "css",
          `
          .square { aspect-ratio: 1; overflow: auto; }   /* квадрат 200×200, лишнее прокручивается */
          `,
        ),
        p("С `overflow: hidden` в замере блок остался 200×200. Для `<img>` содержимое не влияет на размер рамки: рамка задаётся `aspect-ratio`, а картинка вписывается через `object-fit: cover`."),
      ],
    }),
  ],

  challenge: {
    id: "css.responsive-media.challenge",
    title: "Галерея без смещений макета с автоматической проверкой",
    scenario: [
      p("Галерея новостей показывает фото разных пропорций. Пользователи жалуются на «прыгающую» страницу при загрузке, на растянутые снимки и на горизонтальную прокрутку на узких телефонах. Нужно привести галерею в порядок и написать тест, который проверяет резервирование места, пропорции рамок и отсутствие прокрутки."),
    ],
    requirements: [
      "Сброс для медиа: `display: block; max-width: 100%; height: auto`",
      "Атрибуты `width`/`height` у каждой картинки",
      "Рамка карточки 4:3 с `object-fit: cover`",
      "Колонки по месту: автоповтор с минимумом 14rem и защитой `min(100%, …)`",
      "Тест: до загрузки картинки (запрос не завершён) её высота соответствует пропорции атрибутов; рамки 4:3; нет горизонтальной прокрутки на 320px",
    ],
    constraints: [
      "Нельзя задавать фиксированную высоту картинкам",
      "Нельзя использовать обёртки с `padding-top` для пропорций",
    ],
    acceptance: [
      "До загрузки картинка 800×400 в колонке 300px занимает 300×150 (а не 0×0)",
      "Рамка карточки в колонке 300px имеет высоту 225px (4:3)",
      "На ширине 320px `scrollWidth` не больше `clientWidth`",
      "Тест выводит фактические размеры и результат проверки",
    ],
    hints: [
      "Как удержать запрос картинки, чтобы измерить её до загрузки?",
      "Как вычислить высоту рамки 4:3 для ширины 300px?",
      "Что ещё, кроме `max-width`, нужно для сохранения пропорций?",
    ],
    solution: [
      code(
        "css",
        `
        img { display: block; max-width: 100%; height: auto; }

        .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr)); }
        .tile img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: #c5cae9; }
        `,
        { filename: "gallery.css", lineNumbers: true },
      ),
      code(
        "js",
        `
        // html(тело, ширина) — страница-обёртка с CSS галереи; запрос картинки не завершается, поэтому файл не загружен
        await page.route("**/slow.jpg", () => {});
        await page.setContent(html("<img src='http://localhost:9/slow.jpg' width='800' height='400' alt=''>", 300), { waitUntil: "commit" });
        const box = await page.evaluate(() => document.querySelector("img").getBoundingClientRect());
        console.log("до загрузки:", Math.round(box.width), "×", Math.round(box.height));   // 300 × 150

        // 2) рамка 4:3 и отсутствие прокрутки
        await page.setViewportSize({ width: 320, height: 800 });
        const r = await page.evaluate(() => {
          const img = document.querySelector(".tile img").getBoundingClientRect();
          return { w: Math.round(img.width), h: Math.round(img.height), overflow: document.documentElement.scrollWidth > innerWidth };
        });
        console.log(r, r.h === Math.round(r.w * 3 / 4) ? "ok" : "FAIL", r.overflow ? "FAIL" : "ok");
        `,
        { filename: "gallery.test.js" },
      ),
      ul(
        "**Резервирование:** атрибуты `width`/`height` задают пропорции, а `height: auto` позволяет им работать — до загрузки картинка 800×400 в колонке 300px занимает 300×150.",
        "**Рамка:** `aspect-ratio: 4 / 3` вместе с `object-fit: cover`; из-за `height: auto` в сбросе атрибут `height` не отключает `aspect-ratio`.",
        "**Колонки:** `min(100%, 14rem)` защищает узкие окна — прокрутки нет.",
        "**Тест:** запрос удерживается маршрутом, поэтому измерение происходит до загрузки; после этого проверяется форма рамки 4:3.",
      ),
    ],
  },

  interview: [
    iq("css.responsive-media.i1", "basic", "Зачем `max-width: 100%; height: auto` для картинок?", [
      p("`max-width: 100%` не даёт картинке выйти за контейнер, `height: auto` сохраняет пропорции. Без `height: auto` атрибут `height` остаётся явной высотой, и картинка растягивается (замер: 300×400 вместо 300×150)."),
    ]),
    iq("css.responsive-media.i2", "basic", "Зачем указывать `width` и `height` в `<img>`, если размеры задаёт CSS?", [
      p("Атрибуты дают пропорции до загрузки файла: браузер резервирует место (замер: 300×150 вместо 0×0), и страница не «прыгает» при загрузке. Это снижает смещение макета (CLS)."),
    ]),
    iq("css.responsive-media.i3", "intermediate", "Чем отличаются `object-fit: cover` и `contain`?", [
      p("`cover` заполняет рамку целиком и обрезает лишнее; `contain` вписывает картинку целиком, оставляя поля. `fill` растягивает без сохранения пропорций. `object-position` выбирает, какая часть остаётся видимой."),
    ]),
    iq("css.responsive-media.i4", "intermediate", "Почему `aspect-ratio` на `<img>` может не работать?", [
      p("Атрибут `height` на `<img>` — явная высота, и она побеждает `aspect-ratio` (замер 300×400). Добавьте `height: auto`. Для блока с видимым переполнением содержимое может увеличить высоту: нужны `overflow: hidden` или `min-height: 0`."),
    ]),
    iq("css.responsive-media.i5", "intermediate", "Как сделать адаптивное видео-встраивание (iframe)?", [
      p("`iframe { width: 100%; aspect-ratio: 16 / 9; border: 0 }`. Раньше использовали обёртку с `padding-top: 56.25%` и абсолютное позиционирование. В замере iframe шириной 640px получил высоту 360px."),
    ]),
    iq("css.responsive-media.i6", "advanced", "Когда использовать фон, а когда `<img>`?", [
      ul(
        "Содержательная картинка → `<img>` с `alt`, чтобы её видели скринридеры, печать и режим принудительных цветов.",
        "Декор, текстуры, градиенты → CSS-фон.",
        "Фон не влияет на размеры блока: нужны `min-height` или `aspect-ratio`.",
        "Для плотности пикселей: `image-set()` и запрос `resolution` у фона, `srcset` у `<img>`.",
      ),
    ]),
    iq("css.responsive-media.i7", "engineering", "Как предотвратить смещения макета из-за изображений в большом проекте?", [
      ul(
        "Правило в код-ревью и линтере: у каждой `<img>` есть `width`/`height` (и `alt`).",
        "Единый сброс для медиа: `display: block; max-width: 100%; height: auto`.",
        "Компоненты используют `aspect-ratio` и `object-fit` вместо фиксированных высот.",
        "Тест: удержать запрос картинки и проверить размер рамки до загрузки; лабораторные и полевые метрики CLS.",
      ),
    ]),
    iq("css.responsive-media.i8", "debugging", "Картинка вылезает за пределы колонки или искажена. Что проверите?", [
      ul(
        "Есть ли `max-width: 100%` и `height: auto`; нет ли фиксированной высоты или атрибута `height` без `height: auto`.",
        "Не растягивается ли элемент flex/grid (`min-width: auto`, колонка `1fr` без `minmax(0, 1fr)`).",
        "Есть ли `object-fit` для рамки с принудительной формой.",
        "Размеры в панели Computed и естественный размер изображения (`naturalWidth`/`naturalHeight`).",
      ),
    ]),
  ],

  exam: [
    mcq("css.responsive-media.e1", "foundation", "Какой размер получит картинка 800×400 с атрибутами `width=800 height=400` при `img { max-width: 100% }` в контейнере 300px?", ["300 × 150", "800 × 400", "300 × 300", "300 × 400"], 3, "Ширина ограничена контейнером, а высота осталась из атрибута: картинка растянута по вертикали. Нужен `height: auto`."),
    mcq("css.responsive-media.e2", "foundation", "Что даёт `object-fit: cover`?", ["Растягивает картинку без сохранения пропорций", "Вписывает целиком с полями", "Скрывает картинку", "Заполняет рамку целиком, лишнее обрезает"], 3, "`cover` сохраняет пропорции, заполняет всю рамку и обрезает то, что не помещается; `contain` оставляет поля."),
    mcq("css.responsive-media.e3", "intermediate", "Зачем указывать `width` и `height` у `<img>`?", ["Чтобы браузер знал пропорции и зарезервировал место до загрузки", "Чтобы всегда показывать картинку в этом размере", "Для SEO", "Чтобы отключить кэш"], 0, "Атрибуты задают пропорции: место резервируется до загрузки, и страница не смещается (в замере 300×150 против 0×0)."),
    mcq("css.responsive-media.e4", "intermediate", "iframe шириной 640px, `aspect-ratio: 16 / 9`. Какая высота?", ["320px", "400px", "360px", "480px"], 2, "Высота равна ширине, делённой на отношение сторон: 640 / (16/9) = 360px, обёртка с `padding-top` не нужна."),
    mcq("css.responsive-media.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["Фон не виден скринридерам", "`max-width: 100%` у картинки в `1fr`-колонке раздвигает колонку", "Атрибут `height` у `<img>` при заданной ширине отключает `aspect-ratio`", "SVG без `viewBox` и размеров получает 300×150"], [0, 2, 3], "Процентный `max-width` у заменяемого элемента не раздвигает колонку: в замере картинка сжалась до половины 300px."),
    mcq("css.responsive-media.e6", "advanced", "Блок шириной 200px с `aspect-ratio: 1` содержит содержимое высотой 300px и `overflow: visible`. Какая высота?", ["200px", "100px", "0", "300px"], 3, "`aspect-ratio` для блока — предпочтение: минимальная высота по содержимому её нарушает. С `overflow: hidden` будет 200px."),
    open("css.responsive-media.e7", "intermediate", "Опишите, как сделать галерею с разнопропорциональными фото аккуратной и стабильной при загрузке.", [
      ul(
        "Атрибуты `width`/`height` у каждой `<img>`; сброс `max-width: 100%; height: auto`.",
        "Единая рамка `aspect-ratio` и `object-fit: cover` (или `contain` для схем); `object-position` для фокуса.",
        "Фон рамки под картинкой; `alt` для смысловых изображений; адаптивные колонки автоповтором.",
      ),
    ], ["Названы атрибуты и сброс", "Описаны `aspect-ratio` и `object-fit`", "Учтены `alt` и колонки"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.responsive-media.m1", "intermediate", "Что вернёт `(min-resolution: 2dppx)` на экране с плотностью 2 и на обычном?", ["true и true", "false и true", "true и false", "false и false"], 2, "На экране с `deviceScaleFactor: 2` запрос истинен (также `192dpi`), а на обычном — ложен."),
    mcq("css.responsive-media.m2", "advanced", "Картинка с атрибутами 800×400 ещё не загружена. Какой размер займёт `<img>` с `max-width: 100%; height: auto` в колонке 300px, если атрибутов нет?", ["300 × 150", "300 × 300", "800 × 400", "0 × 0"], 3, "Без атрибутов пропорций нет: до загрузки рамка 0×0, а с атрибутами — 300×150."),
    mcq("css.responsive-media.m3", "advanced", "Что произойдёт с `<svg viewBox=\"0 0 100 50\">` без размеров в контейнере 500px?", ["500 × 250", "300 × 150", "100 × 50", "0 × 0"], 0, "Встроенный SVG с `viewBox` заполняет ширину контейнера и берёт высоту по пропорциям; без `viewBox` — 300×150."),
    open("css.responsive-media.m4", "advanced", "Спроектируйте правила работы с изображениями в дизайн-системе: разметка, CSS, проверки.", [
      ul(
        "Разметка: `alt`, `width`/`height`, `loading`, `srcset`/`sizes`/`picture` для разных размеров и тем.",
        "CSS: общий сброс для медиа; компоненты используют `aspect-ratio` и `object-fit`; фон рамки; декор — фон.",
        "Проверки: линтер разметки, тест резервирования места до загрузки, метрики CLS, проверка прокрутки на узких окнах.",
        "Доступность: смысловые изображения не прячутся в фон; контраст текста поверх фото.",
      ),
    ], ["Разметка и сброс", "Компоненты и рамки", "Проверки и доступность"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.responsive-media.f1", front: "Базовый сброс для картинок?", back: "`img { display: block; max-width: 100%; height: auto }`." },
    { id: "css.responsive-media.f2", front: "Зачем `width`/`height` в `<img>`?", back: "Пропорции до загрузки → резерв места, нет смещений (CLS)." },
    { id: "css.responsive-media.f3", front: "`object-fit`?", back: "`fill` растягивает, `cover` заполняет с обрезкой, `contain` вписывает с полями, `none`/`scale-down`." },
    { id: "css.responsive-media.f4", front: "Ловушка `aspect-ratio` на `<img>`?", back: "Заданные ширина и высота (в том числе атрибут `height`) отключают `aspect-ratio`; нужен `height: auto`." },
    { id: "css.responsive-media.f5", front: "Адаптивный iframe?", back: "`width: 100%; aspect-ratio: 16 / 9; border: 0`." },
    { id: "css.responsive-media.f6", front: "SVG без `viewBox`?", back: "Размер по умолчанию 300×150; с `viewBox` — по ширине контейнера." },
  ],

  sources: [
    { title: "CSS Images Module Level 3", url: "https://www.w3.org/TR/css-images-3/", publisher: "W3C" },
    { title: "CSS Sizing Module Level 4: aspect-ratio", url: "https://www.w3.org/TR/css-sizing-4/#aspect-ratio", publisher: "W3C" },
    { title: "MDN: object-fit", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit", publisher: "MDN" },
    { title: "MDN: aspect-ratio", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio", publisher: "MDN" },
    { title: "MDN: Replaced elements", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Replaced_element", publisher: "MDN" },
    { title: "MDN: image-set()", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/image/image-set", publisher: "MDN" },
    { title: "web.dev: Cumulative Layout Shift (CLS)", url: "https://web.dev/articles/cls", publisher: "Other" },
  ],
};
