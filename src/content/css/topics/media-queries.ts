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
  warn,
  wrongRight,
} from "../../dsl";

export const mediaQueries: Topic = {
  id: "css.media-queries",
  slug: "media-queries",
  domain: "css",
  module: "responsive",
  title: "Медиазапросы и подход mobile-first",
  titleEn: "Media queries, viewport meta, range syntax, user-preference features, mobile-first",
  summary:
    "Медиазапрос — условие, при котором применяется блок правил. Тема объясняет, зачем нужен `<meta name=\"viewport\">` (без него мобильный браузер строит страницу в 980px), как записываются условия (`min-width`, диапазонная запись `width >= 40rem`), почему `em` в запросах не зависят от `font-size` корня, как не получить пересечение на границе, как строить стили mobile-first, как реагировать на предпочтения пользователя (`prefers-color-scheme`, `prefers-reduced-motion`, `hover`, `pointer`, `print`) и как следить за запросом из JavaScript.",
  minutes: 55,
  prerequisites: ["css.cascade", "css.units-math"],
  tags: ["@media", "viewport", "mobile-first", "breakpoints", "range syntax", "prefers-color-scheme", "prefers-reduced-motion", "hover", "pointer", "print", "matchMedia", "responsive", "reflow", "WCAG 1.4.10"],
  keyConcepts: [
    { term: "Условие для блока правил", text: "`@media (условие) { правила }` — «если условие истинно, применить правила». Условие пересчитывается при изменении окна, масштаба, ориентации и настроек пользователя. Специфичность правил внутри не меняется." },
    { term: "Метатег viewport", text: "Без `width=device-width` мобильный браузер строит страницу в виртуальном окне ~980px и уменьшает её. Все медиазапросы по ширине тогда считают «окно» равным 980px." },
    { term: "Mobile-first", text: "Базовые правила — для самого узкого экрана; `@media (width >= …)` только **добавляют** возможности. Так меньше переопределений и проще каскад." },
    { term: "Единицы в запросах", text: "`em` и `rem` в медиазапросах считаются от **начального** размера шрифта браузера (обычно 16px), а не от `font-size` на `html`. Пороги в `rem` масштабируются вместе с настройкой пользователя, а не с вашим CSS." },
    { term: "Не только ширина", text: "Запросы описывают пользователя: `prefers-color-scheme`, `prefers-reduced-motion`, `hover`, `pointer`, `forced-colors`, `print`. Их корректная обработка — часть доступности, а не украшение." },
  ],
  sections: [
    section("definition", [
      def("Медиазапрос", "Условие, записанное в `@media` (или в атрибуте `media`), от которого зависит применение блока правил или загрузка ресурса. Состоит из необязательного типа (`screen`, `print`) и условий на признаки.", "media query"),
      def("Медиапризнак", "Измеримое свойство среды: `width`, `height`, `orientation`, `resolution`, `hover`, `pointer`, `prefers-color-scheme` и т. д. Записывается в скобках: `(width >= 40rem)`.", "media feature"),
      def("Viewport (область просмотра)", "Прямоугольник, в котором строится вёрстка. На мобильных устройствах различают «виртуальное» окно, по которому считается раскладка, и видимую часть, на которую пользователь приближает страницу. Размер задаёт `<meta name=\"viewport\">`.", "viewport"),
      def("Breakpoint", "Значение признака (чаще всего ширины), при котором раскладка меняется. Это решение о вёрстке, а не свойство устройства.", "breakpoint"),
      def("Mobile-first", "Стратегия: базовые стили — для самого узкого экрана, дальше запросами `min-width` или `width >= …` добавляется сложность для более широких.", "mobile-first"),
    ]),

    section("why", [
      h("Что даёт медиазапрос"),
      ul(
        "**Перестройка структуры:** одна колонка на телефоне, две на планшете, боковая панель на ноутбуке.",
        "**Уважение к пользователю:** тёмная тема, отключение анимации, повышенный контраст, режим принудительных цветов.",
        "**Разные способы ввода:** эффекты наведения только там, где есть наведение; крупные цели нажатия для касаний.",
        "**Печать:** убрать навигацию, показать адреса ссылок, не разрывать карточки.",
        "**Доступность масштаба:** WCAG 1.4.10 (Reflow) требует, чтобы содержимое при ширине 320 CSS-пикселей читалось без горизонтальной прокрутки; медиазапросы в `rem` позволяют раскладке уступать место тексту при увеличении шрифта.",
      ),
      h("Что медиазапрос не умеет"),
      p("Он смотрит на **окно** (или на среду), а не на место, которое получил компонент. Карточка в узкой боковой колонке на широком экране не узнает, что ей тесно, — для этого есть контейнерные запросы. Автоповтор колонок в Grid решает ещё одну часть задачи без запросов вообще."),
      insight("Используйте медиазапросы для **структуры страницы** и **предпочтений пользователя**. Размеры компонентов доверяйте Grid, Flexbox и контейнерным запросам."),
    ]),

    section("mental-model", [
      p("Представьте таблицу стилей как **набор условных веток**. Блок `@media` — ветка `if`. Браузер постоянно проверяет условия и «включает» или «выключает» ветки; общий каскад пересчитывается заново. Внутри ветки правила ничем не лучше остальных: у них та же специфичность, и если два правила равны, побеждает написанное позже."),
      p("**Mobile-first** — это ступенчатая лестница. Нижняя ступень — база для самых узких экранов. Каждый `min-width` — следующая ступень: он не отменяет базу, а добавляет к ней. Desktop-first — лестница вниз: база для широкого экрана и цепочка `max-width`, отменяющих лишнее. Вторая версия требует больше отмен и ломается при добавлении новых ступеней."),
      diagram(
        `
        mobile-first                                     desktop-first
        --------------------------------------------     --------------------------------------------
        .page { 1 колонка }                              .page { 3 колонки }
        @media (width >= 40rem) { 2 колонки }            @media (width < 64rem) { 2 колонки }
        @media (width >= 64rem) { 3 колонки }            @media (width < 40rem) { 1 колонка }

        базовые стили = самый узкий экран                базовые стили = самый широкий экран
        каждое правило ДОБАВЛЯЕТ                         каждое правило ОТМЕНЯЕТ часть предыдущего
        `,
        "Две стратегии медиазапросов",
      ),
    ]),

    section("technical", [
      h("Метатег viewport"),
      code(
        "html",
        `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        `,
        { filename: "viewport.html" },
      ),
      p("Замер в Chromium с эмуляцией мобильного устройства шириной 375px: без метатега `innerWidth` равнялся 981, а `(max-width: 600px)` не срабатывал; с метатегом `innerWidth` стал 375, и запрос сработал. Без метатега мобильный браузер строит страницу в виртуальном окне около 980px и масштабирует её вниз: адаптивные стили просто не включаются."),
      warn("Не добавляйте `user-scalable=no` и `maximum-scale=1`. Запрет масштабирования мешает людям с ослабленным зрением и нарушает требование WCAG 1.4.4 (Resize Text)."),
      h("Синтаксис условий"),
      code(
        "css",
        `
        @media screen and (min-width: 40rem) { /* правила */ }          /* тип + условие */
        @media (min-width: 40rem) and (max-width: 63.99rem) { /* правила */ }  /* «и» */
        @media (hover: none), (pointer: coarse) { /* правила */ }       /* запятая — «или» */
        @media not print { /* правила */ }                              /* отрицание */

        /* Диапазонная запись (Media Queries Level 4) */
        @media (width >= 40rem) { /* правила */ }
        @media (40rem <= width < 64rem) { /* правила */ }
        @media (width < 40rem) or (hover: none) { /* правила */ }
        `,
        { filename: "syntax.css" },
      ),
      table(
        ["Элемент", "Значение"],
        [
          ["`screen`, `print`, `all`", "Медиатип: экран, печать, любой. Без типа запрос относится ко всем"],
          ["`and`", "Все условия должны быть истинны"],
          [", (запятая) / `or`", "Достаточно одного условия"],
          ["`not`", "Отрицание всего запроса: `@media not print`"],
          ["`(width >= 40rem)`", "Диапазонная запись: сравнение вместо пары `min-width`/`max-width`"],
        ],
        "Что можно писать в условии",
      ),
      p("Замер при ширине 800px: `(width >= 40rem)` истинно, `(400px <= width <= 900px)` истинно, `(width < 640px)` ложно; запрос `(width < 100px) or (hover: hover)` истинен за счёт второго условия. Диапазонная запись поддерживается актуальными браузерами (Chrome и Edge с 104, Firefox с 63, Safari с 16.4) — для старых версий проверьте таблицы совместимости."),
      h("Граница порогов: пересечение `min-width` и `max-width`"),
      p("Классическая ошибка: `@media (max-width: 600px)` для телефона и `@media (min-width: 600px)` для планшета. Замер при ширине ровно 600px: **оба запроса истинны**. Одновременно применяются оба блока, и результат зависит от порядка. Диапазонная запись исключает пересечение: `(width < 600px)` ложно, `(width >= 600px)` истинно."),
      code(
        "css",
        `
        /* пересечение на 600px */
        @media (max-width: 600px) { .menu { display: none; } }
        @media (min-width: 600px) { .menu { display: flex; } }

        /* нет пересечения */
        @media (width < 600px)  { .menu { display: none; } }
        @media (width >= 600px) { .menu { display: flex; } }
        `,
        { filename: "boundary.css" },
      ),
      h("Единицы в медиазапросах"),
      p("Относительные единицы (`em`, `rem`) в условии считаются от **начального значения** `font-size` — это размер шрифта по умолчанию в браузере (обычно 16px), а не от того, что вы задали на `html`. Замер: при `html { font-size: 32px }` и окне 800px запросы `(min-width: 40em)` и `(min-width: 40rem)` истинны (порог 640px), а `(min-width: 1280px)` ложно. Поэтому пороги в `rem` предсказуемы: `40rem` — это 640px при стандартных настройках, и порог сдвигается, если пользователь изменил размер шрифта в браузере."),
      h("Mobile-first на практике"),
      code(
        "css",
        `
        .page { display: grid; gap: 1rem; }                 /* база: 1 колонка */

        @media (width >= 40rem) {
          .page { grid-template-columns: repeat(2, 1fr); }  /* добавляем */
        }
        @media (width >= 64rem) {
          .page { grid-template-columns: repeat(3, 1fr); }  /* добавляем */
        }
        `,
        { filename: "mobile-first.css" },
      ),
      ul(
        "База описывает самую простую раскладку: она работает везде, даже если медиазапросы не сработали.",
        "Каждый следующий порог **переопределяет только то, что меняется**: не нужно повторять отступы, цвета и шрифты.",
        "Новый порог добавляется между существующими, не ломая остальные: правила не зависят друг от друга.",
      ),
      h("Где ставить пороги"),
      p("Пороги выбирают **по содержимому**, а не по устройствам: расширяйте окно, пока строка не станет слишком длинной или колонки слишком широкими, и ставьте порог там. Названия устройств быстро устаревают, а границы между «телефоном» и «планшетом» размыты. Небольшой набор (например, `40rem`, `64rem`) обычно достаточен; остальное решают Grid и Flexbox."),
      h("Предпочтения пользователя и среда"),
      table(
        ["Признак", "Значения", "Для чего"],
        [
          ["`prefers-color-scheme`", "`light`, `dark`", "Светлая и тёмная тема"],
          ["`prefers-reduced-motion`", "`no-preference`, `reduce`", "Отключить или упростить анимацию"],
          ["`prefers-contrast`", "`more`, `less`, `custom`, `no-preference`", "Усилить контраст"],
          ["`forced-colors`", "`none`, `active`", "Режим принудительных цветов (например, Windows High Contrast)"],
          ["`hover`, `any-hover`", "`none`, `hover`", "Есть ли наведение у основного (любого) устройства ввода"],
          ["`pointer`, `any-pointer`", "`none`, `coarse`, `fine`", "Точность указателя: палец или мышь"],
          ["`orientation`", "`portrait`, `landscape`", "Ориентация окна (по соотношению сторон)"],
          ["`resolution`", "`2dppx` и др.", "Плотность пикселей"],
          ["`display-mode`", "`standalone`, `browser` и др.", "Режим запуска установленного приложения"],
          ["`print`", "тип", "Печать и сохранение в PDF"],
        ],
        "Часто используемые признаки",
      ),
      p("Замеры в Chromium: с эмуляцией `colorScheme: dark`, `reducedMotion: reduce`, `forcedColors: active` и `media: print` запросы `prefers-color-scheme: dark`, `prefers-reduced-motion: reduce`, `forced-colors: active` и `print` стали истинными, а `screen` — ложным. В эмуляции мобильного устройства с касанием `(pointer: coarse)` и `(hover: none)` истинны, а `(hover: hover)` и `(any-hover: hover)` — нет; в настольной среде — наоборот: `(pointer: fine)` и `(hover: hover)`."),
      code(
        "css",
        `
        :root { color-scheme: light dark; --bg: #fff; --fg: #1b1b1f; }
        @media (prefers-color-scheme: dark) { :root { --bg: #14151f; --fg: #e8e8f0; } }

        .card { transition: transform 0.2s; }
        @media (hover: hover) { .card:hover { transform: translateY(-2px); } }   /* только где есть наведение */
        @media (prefers-reduced-motion: reduce) { .card { transition: none; } }

        @media print {
          .nav { display: none; }
          a[href^="http"]::after { content: " (" attr(href) ")"; }
        }
        `,
        { filename: "preferences.css" },
      ),
      p("Замер печати: в режиме экрана `getComputedStyle(a, \"::after\").content` равнялся `none`, в режиме печати — `\" (https://example.com/x)\"`."),
      h("Порядок правил и специфичность"),
      p("`@media` не повышает специфичность. Замер при окне 800px: если блок `@media (min-width: 40rem) { .a { color: red } }` стоит **раньше** базового `.a { color: blue }`, текст остаётся синим; если **после** — красным. Размещайте медиазапросы после базовых правил того же компонента."),
      h("Чего нельзя"),
      ul(
        "**Переменные в условии не работают:** `@media (min-width: var(--bp))` недопустимо. Замер: правило не сработало при окне 800px и пороге `40rem`. Пороги пишут значениями или генерируют препроцессором.",
        "**Опечатка в имени признака** делает условие ложным: `(min-widht: 600px)` не совпало, а `not all and (min-widht: 600px)` тоже ложно — отрицание неизвестного условия не превращает его в истину.",
        "**`@custom-media`** присутствует в черновике Media Queries Level 5, но в браузерах нативно не поддерживается: проверяйте таблицы совместимости, а пока используйте константы препроцессора.",
      ),
      h("Медиазапросы в JavaScript"),
      code(
        "js",
        `
        const mql = window.matchMedia("(width < 40rem)");
        console.log(mql.matches);                       // true / false сейчас

        mql.addEventListener("change", (event) => {
          document.body.classList.toggle("is-compact", event.matches);
        });
        `,
        { filename: "matchMedia.js" },
      ),
      p("Замер: при изменении ширины окна 500 → 700 → 300 → 900px слушатель `change` для запроса `(width < 600px)` получил `true`, `false`, `true`, `false` — по одному событию на каждое пересечение порога, а не на каждое изменение размера. Это дешевле, чем слушать `resize`."),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        .page { display: grid; gap: 1rem; }

        @media (width >= 40rem) {
          .page { grid-template-columns: 1fr 1fr; }
        }

        @media (hover: hover) {
          .card:hover { transform: translateY(-2px); }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
        `,
        [
          { line: 1, text: "База: одна колонка. Это правило работает везде, включая окружения, где запросы не выполнились." },
          { line: [3, 5], text: "Порог по ширине в диапазонной записи: от `40rem` включительно. Блок добавляет колонку и после базы." },
          { line: [7, 9], text: "Эффект наведения только там, где наведение есть: на сенсорных экранах `:hover` «залипает» после касания." },
          { line: [11, 13], text: "Реакция на настройку пользователя «уменьшить движение». `!important` в таком сбросе допустим как намеренное исключение." },
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
        <title>mobile-first</title>
        <style>
          body { margin: 0; font: 16px/1.5 system-ui, sans-serif; }
          .page { display: grid; gap: 0.5rem; padding: 0.5rem; }
          .page > div { padding: 1.5rem 1rem; background: #c5cae9; border-radius: 0.5rem; text-align: center; }
          .page::before { content: "1 колонка"; grid-column: 1 / -1; font-weight: 700; }

          @media (width >= 40rem) {
            .page { grid-template-columns: repeat(2, 1fr); }
            .page::before { content: "2 колонки (от 40rem)"; }
          }
          @media (width >= 64rem) {
            .page { grid-template-columns: repeat(3, 1fr); }
            .page::before { content: "3 колонки (от 64rem)"; }
          }
        </style>
        <div class="page"><div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div></div>
        </html>
        `,
        { filename: "mobile-first.html", runnable: true },
      ),
      p("Меняйте ширину окна: подпись и число колонок переключаются на 40rem (640px) и 64rem (1024px). Замените `>=` на пару `min-width`/`max-width` с одинаковым значением на границе и посмотрите, что происходит на ровно 640px."),
    ]),

    section("detailed-example", [
      p("Адаптивная страница с тёмной темой, эффектами только для наведения, отключением анимации и печатной версией. Структура — mobile-first: база в одну колонку, пороги `40rem` и `64rem` добавляют колонки. Предпочтения пользователя обрабатываются отдельными блоками."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Адаптивная страница</title>
        <style>
          :root { color-scheme: light dark; --bg: #f4f5fb; --fg: #1b1b1f; --card: #fff; --accent: #2f3d9a; }
          @media (prefers-color-scheme: dark) {
            :root { --bg: #14151f; --fg: #e8e8f0; --card: #1f2133; --accent: #aab4f0; }
          }
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; font: 1rem/1.6 system-ui, sans-serif; color: var(--fg); background: var(--bg); }
          a { color: var(--accent); }

          .top { display: grid; gap: 0.5rem; padding: 1rem; }
          .nav ul { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin: 0; padding: 0; list-style: none; }
          .page { display: grid; gap: 1rem; padding: 1rem; max-width: 72rem; margin-inline: auto; }
          .card { padding: 1rem; background: var(--card); border-radius: 0.5rem; transition: transform 0.2s; }
          .card h2 { margin-top: 0; font-size: 1.25rem; }
          .hero h1 { margin-top: 0; }

          @media (width >= 40rem) {
            .top { grid-auto-flow: column; justify-content: space-between; align-items: center; }
            .page { grid-template-columns: repeat(2, 1fr); padding: 1.5rem; }
            .hero { grid-column: 1 / -1; }
          }
          @media (width >= 64rem) {
            .page { grid-template-columns: repeat(3, 1fr); }
          }

          @media (hover: hover) {
            .card:hover { transform: translateY(-2px); }
          }
          @media (prefers-reduced-motion: reduce) {
            .card { transition: none; }
          }

          @media print {
            body { color: #000; background: #fff; }
            .nav { display: none; }
            .card { background: #fff; border: 1px solid #000; break-inside: avoid; }
            a[href^="http"]::after { content: " (" attr(href) ")"; }
          }
        </style>
        <header class="top">
          <a class="brand" href="#">DevDock</a>
          <nav class="nav" aria-label="Основная">
            <ul><li><a href="#courses">Курсы</a></li><li><a href="#practice">Практика</a></li><li><a href="#blog">Блог</a></li></ul>
          </nav>
        </header>
        <main class="page">
          <section class="card hero">
            <h1>Адаптивная страница</h1>
            <p>Измените ширину окна, включите тёмную тему или печать (Ctrl/Cmd + P): страница отреагирует на каждое условие.</p>
          </section>
          <section class="card"><h2>Структура</h2><p>Колонки добавляются порогами 40rem и 64rem.</p></section>
          <section class="card"><h2>Предпочтения</h2><p>Тёмная тема и уменьшение движения обрабатываются отдельно.</p></section>
          <section class="card"><h2>Ввод</h2><p>Подъём карточки при наведении — только на устройствах с наведением.</p></section>
          <section class="card"><h2>Печать</h2><p>Меню скрыто, ссылки <a href="https://developer.mozilla.org/">показывают адрес</a>.</p></section>
          <section class="card"><h2>Источники</h2><p>Подробности — в <a href="https://www.w3.org/TR/mediaqueries-4/">спецификации</a>.</p></section>
        </main>
        </html>
        `,
        { filename: "responsive-page.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает"],
        [
          ["`<meta name=\"viewport\" …>`", "Окно раскладки равно ширине устройства; без него запросы по ширине срабатывают для ~980px"],
          ["`.page { display: grid; gap: 1rem }`", "База: одна колонка, работающая без единого запроса"],
          ["`@media (width >= 40rem) { … }`", "Добавляет две колонки, раскладывает шапку в ряд и растягивает `hero` на всю ширину"],
          ["`@media (width >= 64rem) { … }`", "Три колонки; больше ничего не переопределяется"],
          ["`@media (hover: hover)`", "Подъём карточки только там, где есть наведение"],
          ["`@media (prefers-reduced-motion: reduce)`", "Отключает переход для людей, выбравших уменьшенное движение"],
          ["`@media print`", "Скрывает навигацию, убирает фон, показывает адреса ссылок, не разрывает карточки"],
        ],
        "Как устроена страница",
      ),
      ul(
        "Блоки предпочтений стоят после структурных, но не конфликтуют с ними: каждый отвечает за своё свойство.",
        "Цвета заданы переменными: тёмная тема переопределяет четыре значения в одном месте, а не десятки правил.",
        "Пороги написаны в `rem`: при увеличении шрифта в браузере раскладка переключится раньше.",
      ),
    ]),

    section("internals", [
      h("Как браузер вычисляет условия"),
      steps(
        [
          ["Разбор", "При разборе таблицы стилей условие каждого `@media` превращается в список запросов. Неизвестный признак или синтаксическая ошибка делают соответствующее условие ложным."],
          ["Оценка среды", "Браузер знает размеры окна, плотность пикселей, ориентацию, настройки пользователя и устройства ввода и вычисляет значение каждого признака. Относительные единицы приводятся к пикселям от начального размера шрифта."],
          ["Включение блоков", "Правила из блоков с истинным условием участвуют в каскаде, остальные игнорируются. Пересчёт стилей запускается, когда значение признака изменилось."],
          ["Каскад как обычно", "Внутри каскада блок `@media` ничем не отличается от остальных правил: сравниваются важность, слои, специфичность и порядок."],
          ["Уведомления", "Для запросов, созданных через `matchMedia`, при смене значения генерируется событие `change` — по одному на пересечение порога."],
        ],
        "Жизненный цикл медиазапроса",
      ),
      h("`media` в `<link>`"),
      code(
        "html",
        `
        <link rel="stylesheet" href="base.css">
        <link rel="stylesheet" href="wide.css" media="(width >= 64rem)">
        <link rel="stylesheet" href="print.css" media="print">
        `,
        { filename: "link-media.html" },
      ),
      p("Атрибут `media` у `<link>` задаёт условие применения файла. Стили, не подходящие под условие, не блокируют отрисовку страницы, но браузер всё равно может их загрузить с пониженным приоритетом — они пригодятся при изменении размера окна. Разбивка CSS по запросам оправдана для крупных печатных или редких файлов; для обычных адаптивных стилей проще держать запросы внутри файла."),
      note("Следите за запросами во время отладки через DevTools: панель «Rendering» позволяет эмулировать `prefers-color-scheme`, `prefers-reduced-motion`, `forced-colors` и тип носителя `print`; режим адаптивного просмотра проверяет пороги ширины."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Нет метатега viewport"),
      p("Страница на телефоне строится в окне ~980px и уменьшается: шрифт крошечный, а адаптивные стили не включаются. Замер: без метатега `(max-width: 600px)` ложно при реальной ширине 375px."),
      h("Ошибка 2. Пересечение на границе"),
      wrongRight(
        "css",
        {
          code: `
            @media (max-width: 600px) { .menu { display: none; } }
            @media (min-width: 600px) { .menu { display: flex; } }
          `,
          note: "На ровно 600px истинны оба запроса: применяются оба блока, результат зависит от порядка.",
        },
        {
          code: `
            @media (width < 600px)  { .menu { display: none; } }
            @media (width >= 600px) { .menu { display: flex; } }
          `,
          note: "Диапазонная запись делит ось без пересечений и без «магических» значений вроде `599.98px`.",
        },
      ),
      h("Ошибка 3. Пороги по устройствам"),
      p("Значения «320 / 768 / 1024» повторяют ширину конкретных устройств прошлых лет. Новые устройства попадают между ними, и макет выглядит случайным. Ставьте пороги там, где ломается **ваше содержимое**."),
      h("Ошибка 4. Ожидание, что `em` берётся от `html`"),
      p("`@media (min-width: 40em)` при `html { font-size: 32px }` срабатывает с 640px, а не с 1280px. Не пытайтесь «подогнать» порог под собственный размер шрифта: пороги привязаны к начальному размеру шрифта браузера."),
      h("Ошибка 5. `:hover` на сенсорных экранах"),
      p("На экранах без наведения `:hover` срабатывает при касании и может «залипать» до следующего касания. Оборачивайте эффекты в `@media (hover: hover)` и не прячьте за наведением основное содержимое."),
      h("Ошибка 6. `var()` в условии"),
      p("`@media (min-width: var(--bp))` не работает: переменные в условиях медиазапросов недопустимы. Записывайте значения явно или подставляйте их препроцессором."),
      h("Ошибка 7. Запрет масштабирования"),
      p("`user-scalable=no` и `maximum-scale=1` мешают приближать страницу. Это нарушение WCAG 1.4.4 и частая причина жалоб пользователей с ослабленным зрением."),
      h("Ошибка 8. Забытые предпочтения и печать"),
      p("Тёмная тема, `prefers-reduced-motion` и печатная версия — не «доработки на потом»: без них часть пользователей получает неудобную или нечитаемую страницу."),
    ]),

    section("antipatterns", [
      ul(
        "**Цепочка `max-width` от широкого к узкому**, переопределяющая то, что уже задано.",
        "**Множество порогов** (по 6–8 штук), каждый из которых правит три свойства.",
        "**Медиазапросы вместо Grid и Flexbox** там, где достаточно `auto-fit` и `flex-wrap`.",
        "**Пороги в `px` в `em`-вёрстке** и наоборот: единицы разные, поведение при масштабе текста тоже.",
        "**Спрятать содержимое** (`display: none`) на малых экранах вместо перестройки: пользователь теряет информацию.",
        "**Дублирование порогов** в CSS и JavaScript: значения расходятся. Читайте состояние запроса через `matchMedia` с тем же текстом условия.",
        "**`!important` внутри медиазапросов** для победы над базой, вместо правильного порядка и специфичности.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Всегда** `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">`, без запрета масштабирования.",
        "**Mobile-first:** база для узкого экрана, `width >= …` — для расширения.",
        "**Диапазонная запись** (`width >= 40rem`) вместо пар `min-width`/`max-width` с пересечениями.",
        "**Пороги в `rem`:** раскладка учитывает размер шрифта, выбранный пользователем.",
        "**Пороги — по содержимому**, их немного; остальное решают Grid, Flexbox и контейнерные запросы.",
        "**Блок рядом с компонентом**, после его базовых правил: проще читать, не мешает порядок.",
        "**Предпочтения пользователя — обязательная часть:** `prefers-reduced-motion`, `prefers-color-scheme`, `hover`, `forced-colors`, `print`.",
        "**Проверяйте границы:** ширины на пороге и на 1px меньше (например, 639, 640, 1023, 1024px).",
      ),
    ]),

    section("edge-cases", [
      h("Масштаб страницы и дробные пиксели"),
      p("При масштабе браузера ширина окна в CSS-пикселях меняется и может быть дробной. Поэтому раньше писали `max-width: 599.98px` — чтобы исключить пересечение. Диапазонная запись снимает эту проблему: `width < 600px` и `width >= 600px` описывают разные множества при любой дробной ширине."),
      h("Полоса прокрутки и `100vw`"),
      p("Ширина окна в запросах включает полосу прокрутки (если она занимает место). Единица `100vw` тоже включает её, поэтому блок шириной `100vw` может вызвать горизонтальную прокрутку. Для «по ширине окна без полосы» используйте процентную ширину или Grid."),
      h("Ориентация"),
      p("`orientation` определяется по соотношению сторон окна, а не по физическому положению устройства. На настольном браузере окно «портретное», если оно выше, чем шире. Опираться на ориентацию в раскладке почти всегда хуже, чем на ширину."),
      h("Складывающиеся и множественные экраны"),
      p("Окно может менять размер на лету (разделение экрана, складные устройства). Раскладка, написанная через запросы и относительные единицы, переживает это без специальных усилий — `matchMedia` с `change` сообщит о пересечении порога."),
      h("Принтер и PDF"),
      p("В режиме печати действуют запросы `print` и размеры страницы бумаги. Проверяйте печать через предпросмотр: перенос карточек, `break-inside`, уход фона. Фоновые цвета печатаются не всегда: пользователь может отключить печать фона."),
      h("Запросы и контейнеры"),
      p("Медиазапрос смотрит на окно. Компонент в боковой панели шириной 300px на экране 1600px ничего не узнает о тесноте. Для таких случаев — контейнерные запросы; для сеток — автоповтор колонок."),
    ]),

    section("related", [
      ul(
        "[Единицы и вычисления](/learn/css/units-math) — `rem`, `vw`, `clamp()`.",
        "[Адаптивные сетки](/learn/css/grid-responsive) — число колонок без запросов.",
        "[Контейнерные запросы](/learn/css/container-queries) — реакция на размер контейнера.",
        "[Плавная типографика и отступы](/learn/css/fluid-typography-spacing) — размеры без порогов.",
        "[Каскад](/learn/css/cascade) — порядок и специфичность внутри `@media`.",
        "[Метаданные документа](/learn/html/metadata-seo) — `<meta name=\"viewport\">` и `color-scheme`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Desktop-first с пересечением",
          code: `
            .page { grid-template-columns: repeat(3, 1fr); }
            @media (max-width: 1024px) { .page { grid-template-columns: repeat(2, 1fr); } }
            @media (max-width: 640px)  { .page { grid-template-columns: 1fr; } }
            @media (min-width: 640px) and (max-width: 1024px) { .page { gap: 1rem; } }
          `,
          note: "Цепочка отмен; на ровно 640px и 1024px истинны два запроса одновременно; пороги не связаны с содержимым.",
        },
        {
          title: "Mobile-first и диапазоны",
          code: `
            .page { display: grid; gap: 1rem; }
            @media (width >= 40rem) { .page { grid-template-columns: repeat(2, 1fr); } }
            @media (width >= 64rem) { .page { grid-template-columns: repeat(3, 1fr); } }
          `,
          note: "База работает без запросов, пороги только добавляют, пересечений нет, значения в `rem` учитывают размер шрифта пользователя.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.media-queries.ex1",
      title: "Перепишите desktop-first в mobile-first",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("Страница написана «сверху вниз»: на широком экране три колонки, цепочка `max-width` убирает лишнее. Перепишите в mobile-first: база — одна колонка, пороги — `40rem` и `64rem`, диапазонная запись."),
      ],
      starter: {
        lang: "css",
        code: `
          .page { display: grid; gap: 1rem; grid-template-columns: repeat(3, 1fr); }
          @media (max-width: 1023px) { .page { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 639px)  { .page { grid-template-columns: 1fr; } }
        `,
      },
      hints: ["Какая раскладка должна быть без единого запроса?", "Какой оператор добавляет раскладку для более широкого окна?"],
      checks: ["База — одна колонка", "Два блока с `width >=`", "Нет пересекающихся условий"],
      solution: [
        code(
          "css",
          `
          .page { display: grid; gap: 1rem; }
          @media (width >= 40rem) { .page { grid-template-columns: repeat(2, 1fr); } }
          @media (width >= 64rem) { .page { grid-template-columns: repeat(3, 1fr); } }
          `,
        ),
        p("Три правила вместо четырёх, и ни одно ничего не отменяет: база работает даже без запросов, а пороги `40rem` = 640px и `64rem` = 1024px только добавляют колонки."),
      ],
    }),
    exercise({
      id: "css.media-queries.ex2",
      title: "Меню пропадает ровно на 600px",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("На окне шириной ровно 600px пользователи видят одновременно и бургер-кнопку, и обычное меню. Найдите причину и исправьте без «магических» значений вроде `599.98px`."),
      ],
      starter: {
        lang: "css",
        code: `
          .burger { display: none; }
          .menu { display: flex; }
          @media (max-width: 600px) { .burger { display: block; } .menu { display: none; } }
          @media (min-width: 600px) { .burger { display: none; } .menu { display: flex; } }
        `,
      },
      hints: ["Что вернёт `matchMedia` для каждого запроса при ширине 600px?", "Как записать условия так, чтобы множества не пересекались?"],
      checks: ["Названо пересечение на 600px", "Использована диапазонная запись `<` и `>=`", "Лишние переопределения убраны"],
      solution: [
        p("**Причина.** При ширине ровно 600px истинны и `(max-width: 600px)`, и `(min-width: 600px)`: применяются оба блока, итог зависит от порядка (замер: оба запроса `true`)."),
        code(
          "css",
          `
          .burger { display: none; }
          .menu { display: flex; }
          @media (width < 600px) { .burger { display: block; } .menu { display: none; } }
          `,
        ),
        p("Достаточно одного запроса: база описывает широкий экран, а запрос `width < 600px` включает компактный вид. Если базой остаётся мобильный вид, второй блок записывается как `width >= 600px`."),
      ],
    }),
    exercise({
      id: "css.media-queries.ex3",
      title: "Порог в `em` при нестандартном шрифте",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("На странице `html { font-size: 32px }`. Разработчик пишет `@media (min-width: 40em)`, рассчитывая на порог 1280px. При какой ширине окна он реально сработает и почему? Как проверить предположение в консоли и какой порог выбрать, если нужен именно 1280px?"),
      ],
      hints: ["От какого значения `font-size` считаются `em` в условии?", "Какой метод позволяет проверить запрос из консоли?"],
      checks: ["Ответ: 640px", "Пояснение: начальный размер шрифта 16px", "Проверка через `matchMedia`", "Для 1280px — `80rem` или `1280px`"],
      solution: [
        p("**Ответ: с 640px.** `em` и `rem` в условии считаются от начального размера шрифта браузера (16px), а не от `font-size` на `html`: `40em = 640px`. В замере при окне 800px `matchMedia(\"(min-width: 40em)\")` и `(min-width: 40rem)` истинны, а `(min-width: 1280px)` ложно."),
        code(
          "js",
          `
          matchMedia("(min-width: 40em)").matches;     // сравните при разной ширине окна
          matchMedia("(min-width: 1280px)").matches;
          `,
        ),
        p("Если нужен порог 1280px, запишите `(width >= 80rem)` (80 × 16) или `(width >= 1280px)`. Подгонять `em` под собственный размер шрифта не нужно."),
      ],
    }),
  ],

  challenge: {
    id: "css.media-queries.challenge",
    title: "Адаптивный каркас с тестом на границах и предпочтениях",
    scenario: [
      p("Команда делает каркас страницы: одна, две или три колонки по ширине, тёмная тема, отключаемая анимация и печатная версия. Раньше пороги были пересекающимися, а на границах (640 и 1024px) страница ломалась. Нужно переписать стили mobile-first и написать тест, который проверяет **границы** и **предпочтения пользователя**."),
    ],
    requirements: [
      "Mobile-first: база — одна колонка; пороги `40rem` и `64rem` в диапазонной записи",
      "Тёмная тема через переменные и `prefers-color-scheme`",
      "Подъём карточки при наведении только при `(hover: hover)`; `prefers-reduced-motion: reduce` отключает переход",
      "Печать: скрыть навигацию, показать адреса ссылок",
      "Тест: число колонок на 639, 640, 1023, 1024px; цвет фона в тёмной теме; `transition-duration` при reduced motion; `display` навигации в печати",
    ],
    constraints: [
      "Условия не должны пересекаться на границе",
      "Нельзя использовать `max-width`-запросы для структуры",
      "Нельзя использовать JavaScript для раскладки",
    ],
    acceptance: [
      "Колонок: 1, 2, 2, 3 на ширинах 639, 640, 1023, 1024px",
      "В тёмной теме цвет фона `body` отличается от светлой",
      "При reduced motion `transition-duration` карточки равен `0s`",
      "В режиме печати навигация скрыта, а у внешних ссылок `::after` содержит адрес",
    ],
    hints: [
      "Как в Playwright переключить `prefers-color-scheme`, `prefers-reduced-motion` и тип носителя?",
      "Какие значения ширины окна проверять, чтобы поймать пересечение?",
      "Как получить число колонок из `getComputedStyle`?",
    ],
    solution: [
      code(
        "css",
        `
        :root { color-scheme: light dark; --bg: #f4f5fb; --fg: #1b1b1f; --card: #fff; }
        @media (prefers-color-scheme: dark) { :root { --bg: #14151f; --fg: #e8e8f0; --card: #1f2133; } }

        body { margin: 0; color: var(--fg); background: var(--bg); }
        .page { display: grid; gap: 1rem; padding: 1rem; }
        .card { padding: 1rem; background: var(--card); transition: transform 0.2s; }

        @media (width >= 40rem) { .page { grid-template-columns: repeat(2, 1fr); } }
        @media (width >= 64rem) { .page { grid-template-columns: repeat(3, 1fr); } }
        @media (hover: hover) { .card:hover { transform: translateY(-2px); } }
        @media (prefers-reduced-motion: reduce) { .card { transition: none; } }
        @media print {
          .nav { display: none; }
          a[href^="http"]::after { content: " (" attr(href) ")"; }
        }
        `,
        { filename: "frame.css", lineNumbers: true },
      ),
      code(
        "js",
        `
        const cols = () => page.evaluate(() => getComputedStyle(document.querySelector(".page")).gridTemplateColumns.split(" ").length);
        for (const [width, expected] of [[639, 1], [640, 2], [1023, 2], [1024, 3]]) {
          await page.setViewportSize({ width, height: 800 });
          console.log(width, "колонок:", await cols(), "ожидалось:", expected);
        }

        await page.emulateMedia({ colorScheme: "dark" });
        console.log("фон тёмной темы:", await page.evaluate(() => getComputedStyle(document.body).backgroundColor));

        await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
        console.log("transition:", await page.evaluate(() => getComputedStyle(document.querySelector(".card")).transitionDuration));

        await page.emulateMedia({ reducedMotion: "no-preference", media: "print" });
        console.log("nav в печати:", await page.evaluate(() => getComputedStyle(document.querySelector(".nav")).display));
        `,
        { filename: "frame.test.js" },
      ),
      ul(
        "**Границы:** проверка на 639/640 и 1023/1024px ловит и пересечение, и ошибку «на единицу». Диапазонная запись `width >= 40rem` даёт 1 колонку на 639 и 2 на 640.",
        "**Предпочтения:** `page.emulateMedia` переключает `prefers-color-scheme`, `prefers-reduced-motion` и тип носителя без смены системных настроек.",
        "**Порядок:** каждый предпочтительный блок стоит после базового правила, которое он переопределяет.",
      ),
    ],
  },

  interview: [
    iq("css.media-queries.i1", "basic", "Зачем нужен `<meta name=\"viewport\">`?", [
      p("Без него мобильный браузер строит страницу в виртуальном окне около 980px и уменьшает её. `width=device-width, initial-scale=1` делает окно раскладки равным ширине устройства, и медиазапросы по ширине срабатывают корректно (в замере: `innerWidth` 981 без метатега и 375 с ним)."),
    ]),
    iq("css.media-queries.i2", "basic", "Что такое mobile-first и чем он лучше desktop-first?", [
      p("Базовые стили описывают самый узкий экран, запросы `min-width`/`width >= …` добавляют сложность для широких. В desktop-first база сложная, а запросы `max-width` отменяют лишнее — больше переопределений, выше риск конфликтов. Mobile-first даёт рабочую базу даже без запросов."),
    ]),
    iq("css.media-queries.i3", "intermediate", "Почему `max-width: 600px` и `min-width: 600px` вместе — ошибка?", [
      p("На ширине ровно 600px истинны оба запроса: применяются оба блока, а результат зависит от порядка. Решение — диапазонная запись `(width < 600px)` и `(width >= 600px)`, где множества не пересекаются."),
    ]),
    iq("css.media-queries.i4", "intermediate", "От чего считаются `em` и `rem` в медиазапросах?", [
      p("От начального размера шрифта браузера (обычно 16px), а не от `font-size` на `html`. При `html { font-size: 32px }` порог `40em` остаётся 640px (проверено `matchMedia`). Пороги в `rem` масштабируются вместе с пользовательской настройкой шрифта."),
    ]),
    iq("css.media-queries.i5", "intermediate", "Как реагировать на предпочтения пользователя?", [
      ul(
        "`prefers-color-scheme` — тёмная и светлая темы через переменные.",
        "`prefers-reduced-motion: reduce` — отключить или упростить анимацию.",
        "`hover: hover` и `pointer: fine` — эффекты наведения и мелкие цели только там, где они уместны.",
        "`forced-colors: active` и `prefers-contrast` — не ломать читаемость в режиме высокого контраста.",
        "`print` — убрать навигацию, показать адреса ссылок.",
      ),
    ]),
    iq("css.media-queries.i6", "advanced", "Можно ли использовать переменные в условии медиазапроса?", [
      p("Нет. `@media (min-width: var(--bp))` недопустимо — в замере правило не сработало. Значения пишут напрямую или подставляют препроцессором. Нативный `@custom-media` пока в черновике и в браузерах не поддерживается."),
    ]),
    iq("css.media-queries.i7", "engineering", "Как организовать пороги в большом проекте?", [
      ul(
        "Небольшой набор порогов в `rem`, выбранных по содержимому, зафиксирован в документации.",
        "Mobile-first: компоненты имеют базу и добавляют правила запросами рядом с собой.",
        "Структурные изменения — запросами; размеры компонентов — Grid/Flexbox/контейнерными запросами.",
        "Пороги проверяются тестами на границах (например, 639/640 и 1023/1024px).",
      ),
    ]),
    iq("css.media-queries.i8", "debugging", "Адаптивные стили не включаются на телефоне, хотя в эмуляции окна всё работает. Что проверите?", [
      ul(
        "Есть ли `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">`.",
        "Реальная ширина окна: `innerWidth` на устройстве (без метатега — около 980).",
        "Не пересекаются ли пороги и не перебивают ли блоки друг друга порядком.",
        "Нет ли опечатки в имени признака: неизвестный признак даёт ложное условие.",
      ),
    ]),
  ],

  exam: [
    mcq("css.media-queries.e1", "foundation", "Что делает `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">`?", ["Блокирует масштабирование", "Включает тёмную тему", "Загружает мобильные стили", "Делает окно раскладки равным ширине устройства"], 3, "Без метатега мобильный браузер использует виртуальное окно около 980px; с ним ширина окна равна ширине устройства."),
    mcq("css.media-queries.e2", "foundation", "Какая запись добавляет две колонки от 640px в подходе mobile-first?", ["`@media (width >= 40rem)`", "`@media (max-width: 640px)`", "`@media (width <= 40rem)`", "`@media not (width >= 40rem)`"], 0, "Mobile-first использует `min-width` или `width >= …`: правила добавляются для более широких окон."),
    mcq("css.media-queries.e3", "intermediate", "На ширине ровно 600px что вернут `(max-width: 600px)` и `(min-width: 600px)`?", ["true и false", "false и true", "true и true", "false и false"], 2, "Обе границы включают 600px, поэтому оба запроса истинны одновременно. Для разведения используйте `width < 600px` и `width >= 600px`."),
    mcq("css.media-queries.e4", "intermediate", "`html { font-size: 32px }`, окно 800px. Сработает ли `@media (min-width: 1280px)` и `(min-width: 40em)`?", ["Оба истинны", "Оба ложны", "`1280px` истинно, `40em` ложно", "`1280px` ложно, `40em` истинно"], 3, "`40em` считается от начального 16px: 640px ≤ 800px; `1280px` больше окна."),
    mcq("css.media-queries.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`@media` не повышает специфичность правил", "В условии можно использовать `var(--bp)`", "Неизвестный признак делает условие ложным", "`:hover` лучше оборачивать в `@media (hover: hover)`"], [0, 2, 3], "Переменные в условиях медиазапросов недопустимы."),
    mcq("css.media-queries.e6", "advanced", "Что произойдёт с блоком `@media (min-width: 40rem) { .a { color: red } }`, написанным раньше `.a { color: blue }`?", ["Красный", "Ошибка", "Зависит от окна", "Синий: оба правила равны по специфичности, побеждает последнее"], 3, "Медиазапрос не меняет специфичность. Блок раньше базового правила проигрывает по порядку: в замере цвет остался синим."),
    open("css.media-queries.e7", "intermediate", "Объясните, как строить адаптивную страницу с учётом доступности: какие запросы и принципы вы используете?", [
      ul(
        "Метатег viewport без запрета масштабирования; mobile-first с порогами в `rem`.",
        "`prefers-reduced-motion`, `prefers-color-scheme`, `hover`, `forced-colors`, `print`.",
        "Проверка Reflow (WCAG 1.4.10): 320 CSS-пикселей без горизонтальной прокрутки.",
      ),
    ], ["Названы метатег и mobile-first", "Перечислены признаки предпочтений", "Упомянут критерий Reflow"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.media-queries.m1", "intermediate", "Сколько событий `change` получит слушатель для `(width < 600px)` при изменении ширины 500 → 700 → 300 → 900px?", ["Четыре: по одному на каждое изменение", "Одно", "Ни одного", "Четыре: по одному на пересечение порога"], 3, "Событие приходит при смене значения запроса: true, false, true, false."),
    mcq("css.media-queries.m2", "advanced", "Почему `not all and (min-widht: 600px)` не становится истинным из-за опечатки?", ["Потому что `not` не работает", "Потому что запрос не разбирается вообще", "Неизвестное условие даёт «неизвестно», а оно не превращается в true через `not`", "Потому что опечатка исправляется браузером"], 2, "Неизвестный признак делает условие ложным, а отрицание «неизвестного» в Media Queries тоже даёт ложь."),
    mcq("css.media-queries.m3", "advanced", "Как правильно скрыть эффект наведения на устройствах без наведения?", ["`@media (pointer: none)`", "`:hover { pointer-events: none }`", "`@media (hover: hover) { … }` вокруг `:hover`-правил", "`@media (orientation: landscape)`"], 2, "`hover: hover` проверяет, что основное устройство ввода умеет наводить; на сенсорных экранах `:hover` может залипать."),
    open("css.media-queries.m4", "advanced", "Спроектируйте стратегию порогов и тестов для дизайн-системы с десятками компонентов.", [
      ul(
        "Единый набор порогов в `rem`, выбранных по содержимому и зафиксированных в документации.",
        "Mobile-first: компонент имеет базу, запросы добавляют; блоки рядом с компонентом.",
        "Структура страницы — медиазапросы; размеры компонентов — Grid/Flex/контейнерные запросы.",
        "Предпочтения пользователя (`prefers-*`, `hover`, `forced-colors`, `print`) — обязательная часть базовых компонентов.",
        "Тесты на границах и с эмуляцией предпочтений в CI.",
      ),
    ], ["Единый набор порогов", "Разделение ответственностей", "Тесты на границах и предпочтениях"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.media-queries.f1", front: "Метатег viewport?", back: "`width=device-width, initial-scale=1`; без него окно раскладки ~980px. Не запрещайте масштабирование." },
    { id: "css.media-queries.f2", front: "Mobile-first?", back: "База — узкий экран; `width >= …` добавляют сложность. Меньше отмен, проще каскад." },
    { id: "css.media-queries.f3", front: "Как избежать пересечения порогов?", back: "Диапазонная запись: `width < 600px` и `width >= 600px`." },
    { id: "css.media-queries.f4", front: "`em`/`rem` в `@media`?", back: "От начального размера шрифта браузера (16px), не от `html`." },
    { id: "css.media-queries.f5", front: "`var()` в `@media`?", back: "Не работает; значения пишут явно или подставляет препроцессор." },
    { id: "css.media-queries.f6", front: "Эффекты наведения?", back: "`@media (hover: hover)`; на сенсорных экранах `:hover` залипает." },
  ],

  sources: [
    { title: "Media Queries Level 4", url: "https://www.w3.org/TR/mediaqueries-4/", publisher: "W3C" },
    { title: "Media Queries Level 5", url: "https://www.w3.org/TR/mediaqueries-5/", publisher: "W3C" },
    { title: "MDN: Using media queries", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries", publisher: "MDN" },
    { title: "MDN: @media", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@media", publisher: "MDN" },
    { title: "MDN: Window.matchMedia()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia", publisher: "MDN" },
    { title: "MDN: prefers-reduced-motion", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion", publisher: "MDN" },
    { title: "MDN: Viewport meta tag", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag", publisher: "MDN" },
    { title: "WCAG 2.2: Reflow", url: "https://www.w3.org/TR/WCAG22/#reflow", publisher: "W3C" },
    { title: "WCAG 2.2: Resize Text", url: "https://www.w3.org/TR/WCAG22/#resize-text", publisher: "W3C" },
  ],
};
