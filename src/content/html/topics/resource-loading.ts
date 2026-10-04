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

export const resourceLoading: Topic = {
  id: "html.resource-loading",
  slug: "resource-loading",
  domain: "html",
  module: "advanced",
  title: "Загрузка ресурсов: скрипты, стили, подсказки",
  titleEn: "Resource loading: async/defer/module, render-blocking CSS, preload, preconnect, fetchpriority, lazy loading",
  summary:
    "Скорость первой отрисовки определяется не «весом страницы», а порядком и приоритетами загрузки. Тема объясняет критический путь рендеринга, поведение скриптов (`defer`, `async`, `module`), блокирующие стили, подсказки ресурсов (`preload`, `preconnect`, `prefetch`), `fetchpriority` и ленивую загрузку.",
  minutes: 60,
  prerequisites: ["html.head-metadata", "html.parsing-dom", "html.responsive-images"],
  tags: ["defer", "async", "module", "render-blocking", "preload", "preconnect", "dns-prefetch", "prefetch", "fetchpriority", "lazy loading", "critical rendering path", "speculation rules", "DOMContentLoaded", "LCP", "preload scanner"],
  keyConcepts: [
    { term: "Критический путь рендеринга", text: "HTML → DOM, CSS → CSSOM, затем дерево отображения, раскладка и отрисовка. Стили блокируют **отрисовку**, синхронные скрипты — **парсинг**." },
    { term: "defer, async, module", text: "`defer` — после парсинга, по порядку; `async` — как только загрузится, без порядка; `type=\"module\"` — отложенный по умолчанию." },
    { term: "Подсказки ресурсов", text: "`preconnect` готовит соединение, `preload` загружает **нужное на этой странице** ресурс заранее, `prefetch` — то, что понадобится **на следующей**." },
    { term: "Приоритеты", text: "Браузер назначает ресурсам приоритет; `fetchpriority` и `loading` позволяют его скорректировать. Не всё может быть «высоким»." },
    { term: "Не лениться с главным", text: "Изображение LCP (главное содержимое первого экрана) нельзя загружать лениво (`loading=\"lazy\"`)." },
  ],
  sections: [
    section("definition", [
      def("Критический путь рендеринга", "Последовательность шагов, которые браузер выполняет, чтобы превратить HTML, CSS и JavaScript в пиксели: построение DOM и CSSOM, объединение в дерево отображения, раскладка (layout), отрисовка (paint), композиция.", "critical rendering path"),
      def("Блокирующий ресурс", "Ресурс, из-за которого браузер **не может продолжить** работу. **Блокирующие отрисовку** — CSS: пока стили не загружены, страница не показывается. **Блокирующие парсинг** — синхронные скрипты: парсер ждёт их загрузки и выполнения.", "render-blocking / parser-blocking resource"),
      def("Подсказка ресурса (resource hint)", "Атрибут `rel` у `<link>` (`preconnect`, `dns-prefetch`, `preload`, `prefetch`, `modulepreload`), сообщающий браузеру о будущем использовании ресурса, чтобы он начал загрузку или подготовку заранее.", "resource hint"),
    ]),

    section("why", [
      h("Скорость — это функция"),
      p("Пользователь решает, остаться ли на странице, за секунды. Задержка первой отрисовки на несколько сотен миллисекунд заметно сказывается на отказах и конверсии. Поисковики учитывают скорость как один из сигналов, а на мобильных сетях и бюджетных устройствах она критична."),
      h("«Лёгкая» страница может быть медленной"),
      p("Размер — лишь часть истории. Один синхронный скрипт в начале `head` останавливает парсинг; цепочка `@import` откладывает стили; шрифт, который браузер обнаружил только после загрузки CSS, появляется поздно; изображение, найденное скриптом, а не парсером, стартует с задержкой. Главное — **когда** ресурс обнаружен и **с каким приоритетом** загружен."),
      h("Управляемость"),
      p("HTML даёт декларативные средства: `defer`, `async`, `preload`, `preconnect`, `fetchpriority`, `loading`, `media`. Они не требуют сложных инструментов и часто дают самый большой выигрыш при минимальных изменениях."),
      insight("Главная цель: как можно раньше показать важное (контент первого экрана) и как можно позже загружать неважное. Каждый ресурс отвечает на вопрос «нужен ли он **сейчас**?»"),
    ]),

    section("mental-model", [
      p("Представьте **кухню ресторана**: официант (парсер) принимает заказ и передаёт на кухню (сеть). Одни блюда нужны немедленно (CSS, главный шрифт, главная картинка), другие можно готовить параллельно (асинхронные скрипты), третьи — к десерту (отложенные). Если повар вынужден ждать редкий ингредиент, пока стоят все остальные, — это блокирующий ресурс. Подсказки — предупредить поставщика заранее."),
      diagram(
        `
        HTML ──парсер──► DOM ─────────────┐
                │                         ├─► дерево отображения ─► раскладка ─► отрисовка (LCP)
        CSS ────┴────► CSSOM ─────────────┘
                │      ▲ блокирует отрисовку
        <script> ──► блокирует парсинг (если не defer/async/module)

        preload scanner: заранее просматривает HTML и запускает загрузку
                         стилей, скриптов, изображений, найденных в разметке
        `,
        "Критический путь рендеринга",
      ),
      table(
        ["Ресурс", "Блокирует парсинг?", "Блокирует отрисовку?", "Как смягчить"],
        [
          ["`<link rel=\"stylesheet\">`", "Нет (но блокирует выполнение последующих скриптов)", "**Да**", "Минимум CSS, критический CSS, `media`"],
          ["`<script src>`", "**Да**", "Да (косвенно)", "`defer` / `async` / `type=\"module\"`"],
          ["`<script>` инлайновый", "**Да** (выполняется сразу)", "Да (косвенно)", "Размещать ниже или упрощать"],
          ["`<img>`", "Нет", "Нет", "`width`/`height`, `loading`, `fetchpriority`"],
          ["Шрифт", "Нет", "Скрывает/подменяет текст", "`font-display`, `preload`"],
        ],
        "Что блокирует",
      ),
    ]),

    section("technical", [
      h("Скрипты: `defer`, `async`, `module`"),
      table(
        ["Вариант", "Загрузка", "Выполнение", "Порядок", "Когда выбирать"],
        [
          ["`<script src>`", "Останавливает парсер", "Сразу", "В порядке документа", "Редко: когда скрипт должен выполниться немедленно"],
          ["`<script defer src>`", "Параллельно с парсингом", "После парсинга, до `DOMContentLoaded`", "**Сохраняется**", "Основные скрипты приложения"],
          ["`<script async src>`", "Параллельно", "Сразу после загрузки (может прервать парсинг)", "**Не гарантирован**", "Независимые скрипты (аналитика)"],
          ["`<script type=\"module\">`", "Параллельно", "Как `defer`", "Сохраняется", "Современный код с `import`"],
          ["`<script type=\"module\" async>`", "Параллельно", "Сразу после загрузки", "Не гарантирован", "Независимые модули"],
          ["`<script nomodule>`", "Только в старых браузерах", "—", "—", "Запасной вариант"],
        ],
      ),
      ul(
        "`defer` и `async` действуют **только** на внешние скрипты (`src`); для инлайновых они не применяются (кроме `type=\"module\"`, которые отложены всегда).",
        "Скрипты, созданные динамически (`document.createElement(\"script\")`), по умолчанию **`async`**; для сохранения порядка нужно задать `script.async = false`.",
        "Модули выполняются в строгом режиме, поддерживают `import`/`export`, загружаются по CORS и **один раз** на URL.",
        "`<script type=\"importmap\">` позволяет задать соответствие «имя модуля → URL» без сборщика.",
      ),
      h("Стили"),
      ul(
        "`<link rel=\"stylesheet\">` **блокирует отрисовку** страницы до загрузки и разбора. Держите критическое небольшим: для первого экрана иногда встраивают минимальный CSS в `<style>`, остальное подключают отдельно.",
        "**`media`** позволяет не блокировать отрисовку стилями, не подходящими текущему устройству: `<link rel=\"stylesheet\" href=\"print.css\" media=\"print\">` или `media=\"(min-width: 900px)\"` (файл всё равно загружается, но с низким приоритетом).",
        "**`@import`** внутри CSS создаёт цепочку: браузер узнаёт о втором файле только после загрузки первого. Используйте отдельные `<link>`.",
        "**Порядок:** синхронный скрипт после `<link rel=\"stylesheet\">` ждёт загрузки стилей (скрипт может читать вычисленные стили); поэтому скрипты ставят с `defer` или после стилей.",
        "**Неблокирующая загрузка CSS** (приём `rel=\"preload\" as=\"style\"` с последующей заменой на `stylesheet`) — компромисс; применяйте только для действительно некритичных стилей.",
      ),
      h("Подсказки ресурсов"),
      table(
        ["Подсказка", "Что делает", "Когда использовать"],
        [
          ["`dns-prefetch`", "Заранее разрешает DNS-имя", "Сторонние домены, запасной вариант к `preconnect`"],
          ["`preconnect`", "DNS + TCP + TLS заранее", "2–4 критичных источника (шрифты, API, CDN); для CORS-ресурсов — с `crossorigin`"],
          ["`preload`", "Загружает конкретный ресурс **с высоким приоритетом** для **этой** страницы", "Поздно обнаруживаемые, но критичные: шрифт, фоновое изображение LCP, модуль"],
          ["`modulepreload`", "Загружает и разбирает ES-модуль заранее", "Критичные модули"],
          ["`prefetch`", "Загружает ресурс с низким приоритетом для **следующей** навигации", "Вероятный следующий шаг (страница оформления)"],
          ["Speculation Rules", "Предзагрузка (`prefetch`) или предрендер страниц следующего перехода", "Прогнозируемые переходы (поддержка выборочная, как улучшение)"],
        ],
      ),
      code(
        "html",
        `
        <!-- Подключение к критичным источникам -->
        <link rel="preconnect" href="https://cdn.example.com" crossorigin>
        <link rel="dns-prefetch" href="https://analytics.example.com">

        <!-- Поздно обнаруживаемые критичные ресурсы -->
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
        <link rel="preload" href="/img/hero.avif" as="image" type="image/avif" fetchpriority="high">

        <!-- Стили и скрипты -->
        <link rel="stylesheet" href="/css/main.css">
        <link rel="stylesheet" href="/css/print.css" media="print">
        <script src="/js/app.js" defer></script>
        <script src="https://analytics.example.com/a.js" async></script>

        <!-- Следующая навигация (низкий приоритет) -->
        <link rel="prefetch" href="/checkout">
        `,
        { lineNumbers: true, filename: "resource-hints.html" },
      ),
      ul(
        "**`preload` обязателен к использованию:** загруженный, но не использованный в течение нескольких секунд ресурс вызывает предупреждение в консоли. Атрибуты `as` и `type` должны быть верными, иначе загрузка дублируется.",
        "**Шрифты в `preload` всегда с `crossorigin`,** даже при загрузке с того же домена (запросы шрифтов используют режим CORS), иначе файл загрузится дважды.",
        "**Не злоупотребляйте:** десять `preload` конкурируют друг с другом и вытесняют действительно критичное.",
      ),
      h("Приоритеты: `fetchpriority`"),
      ul(
        "`fetchpriority=\"high\" | \"low\" | \"auto\"` на `<img>`, `<link>`, `<script>`, `<iframe>` — подсказка относительного приоритета внутри одного типа ресурсов.",
        "**Главное изображение первого экрана (кандидат LCP)** — `fetchpriority=\"high\"` и **без** `loading=\"lazy\"`.",
        "Второстепенные картинки в карусели и ниже первого экрана — `fetchpriority=\"low\"` или `loading=\"lazy\"`.",
        "Это подсказка: браузер вправе проигнорировать её.",
      ),
      h("Ленивая загрузка"),
      code(
        "html",
        `
        <img src="/img/hero.jpg" alt="…" width="1200" height="600" fetchpriority="high">

        <img src="/img/gallery-1.jpg" alt="…" width="600" height="400" loading="lazy" decoding="async">
        <iframe src="https://www.youtube.com/embed/ID" title="Видеообзор" loading="lazy" width="560" height="315"></iframe>
        `,
      ),
      ul(
        "`loading=\"lazy\"` откладывает загрузку `<img>` и `<iframe>`, пока элемент не приблизится к области просмотра.",
        "Не применяйте к изображениям **на первом экране** — это задержит LCP.",
        "Всегда указывайте `width` и `height` (или `aspect-ratio`), чтобы браузер заранее зарезервировал место и не было сдвигов (CLS).",
        "`decoding=\"async\"` позволяет декодировать изображение вне основного потока.",
        "Для видео — атрибут `preload=\"none\"|\"metadata\"` и постер.",
      ),
      h("Шрифты"),
      ul(
        "Критичный шрифт — `preload` (с `crossorigin`) и формат WOFF2.",
        "`font-display: swap` показывает запасной шрифт сразу; `optional` не подменяет шрифт, если он не успел загрузиться (меньше сдвигов).",
        "Ограничивайте число начертаний и используйте подмножества символов (`unicode-range`).",
      ),
      h("Сторонние скрипты"),
      ul(
        "Загружайте с `async` или `defer`; помните, что они выполняются в вашем контексте и могут замедлить страницу.",
        "Отложите всё необязательное: чаты, виджеты — до взаимодействия пользователя (паттерн «фасад»: статичная заглушка вместо тяжёлого встраивания).",
        "Оценивайте стоимость: объём, время выполнения, число запросов; в бюджетах производительности отделяйте «наш» и «чужой» код.",
      ),
      h("События загрузки"),
      table(
        ["Событие", "Когда наступает"],
        [
          ["`readystatechange` (`loading`)", "Парсер начал работу"],
          ["`DOMContentLoaded`", "HTML разобран, **выполнены все `defer`-скрипты и модули**; стили и изображения могут быть ещё не готовы"],
          ["`load`", "Загружены все ресурсы: изображения, стили, фреймы"],
          ["`readystatechange` (`complete`)", "Совпадает по времени с `load`"],
        ],
      ),
      h("Транспорт: быстрые победы"),
      ul(
        "**Сжатие:** Brotli или gzip для текстовых ресурсов (HTML, CSS, JS, SVG).",
        "**Кэширование:** долгоживущие версии с хэшем в имени для статики (`Cache-Control: public, max-age=31536000, immutable`), короткие или проверяемые — для HTML.",
        "**HTTP/2 и HTTP/3:** мультиплексирование делает «склеивание» сотен файлов менее критичным, но не отменяет необходимости уменьшать объём.",
        "**CDN:** ближе к пользователю; подключение (`preconnect`) к домену CDN.",
        "**103 Early Hints:** сервер может отправить заголовки `Link` с подсказками до готовности основного ответа (поддержка выборочная).",
      ),
      h("Как измерять"),
      ul(
        "**DevTools → Network:** водопад запросов, приоритеты, время; **Performance:** метки FCP, LCP, долгие задачи.",
        "**Lighthouse / PageSpeed Insights / WebPageTest:** диагностика и лабораторные метрики; **CrUX и RUM:** реальные пользователи.",
        "**`PerformanceObserver`:** скрипт для сбора LCP/CLS/INP на реальных сессиях.",
      ),
    ]),

    section("syntax", [
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Кроссовки Run — Магазин</title>

          <link rel="preconnect" href="https://cdn.example.com" crossorigin>
          <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
          <link rel="preload" href="/img/hero.avif" as="image" type="image/avif" fetchpriority="high">

          <style>/* критический CSS первого экрана (≈ несколько КБ) */</style>
          <link rel="stylesheet" href="/css/main.css">

          <script src="/js/app.js" defer></script>
          <script src="https://analytics.example.com/a.js" async></script>
        </head>
        <body>
          <header>…</header>
          <main>
            <img src="/img/hero.avif" alt="Беговые кроссовки Run" width="1200" height="600" fetchpriority="high">
            …
            <img src="/img/gallery-1.jpg" alt="…" width="600" height="400" loading="lazy" decoding="async">
          </main>
        </body>
        </html>
        `,
        { lineNumbers: true, filename: "optimized-head.html" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <script>
          console.log("1. обычный inline-скрипт (блокирует парсер); readyState:", document.readyState);
          document.addEventListener("DOMContentLoaded", () => console.log("3. DOMContentLoaded"));
          window.addEventListener("load", () => console.log("4. load"));
          console.log("динамически созданный script по умолчанию async:", document.createElement("script").async);
        </script>

        <p>Текст страницы</p>

        <script type="module">
          console.log("2. module-скрипт: отложенный, выполняется после парсинга");
        </script>
        `,
        { runnable: true },
      ),
      p("Порядок в консоли: обычный скрипт → модуль (после парсинга) → `DOMContentLoaded` → `load`. Модули, как и `defer`-скрипты, выполняются **до** `DOMContentLoaded`, а `load` наступает последним, когда готовы все ресурсы."),
    ]),

    section("detailed-example", [
      p("Одна и та же страница статьи с главным изображением, шрифтом, CSS, аналитикой и галереей. Сначала «как есть» (медленно), затем оптимизированная версия."),
      code(
        "html",
        `
        <!-- До -->
        <head>
          <script src="https://analytics.example.com/a.js"></script>
          <script src="/js/vendor.js"></script>
          <link rel="stylesheet" href="/css/main.css">
          <style>@import url("/css/fonts.css");</style>
        </head>
        <body>
          <img src="/img/hero.jpg" alt="…" loading="lazy">
          <div style="background-image:url(/img/banner.jpg)"></div>
          <img src="/img/gallery-1.jpg" alt="…">
          <img src="/img/gallery-2.jpg" alt="…">
        </body>
        `,
        { filename: "slow.html" },
      ),
      code(
        "html",
        `
        <!-- После -->
        <head>
          <link rel="preconnect" href="https://cdn.example.com" crossorigin>
          <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
          <link rel="preload" href="/img/hero.avif" as="image" type="image/avif" fetchpriority="high">
          <link rel="stylesheet" href="/css/main.css">
          <script src="/js/vendor.js" defer></script>
          <script src="https://analytics.example.com/a.js" async></script>
        </head>
        <body>
          <img src="/img/hero.avif" alt="…" width="1200" height="600" fetchpriority="high">
          <img src="/img/gallery-1.jpg" alt="…" width="600" height="400" loading="lazy" decoding="async">
          <img src="/img/gallery-2.jpg" alt="…" width="600" height="400" loading="lazy" decoding="async">
        </body>
        `,
        { lineNumbers: true, filename: "fast.html", collapsed: true },
      ),
      ul(
        "**Аналитика и вендорный бандл** больше не блокируют парсинг (`async`/`defer`).",
        "**`@import`** убран: шрифты подключаются через `preload` и объявляются в основном CSS.",
        "**Главное изображение** не ленивое, имеет `fetchpriority=\"high\"`, размеры и современный формат.",
        "**Галерея** — ленивая, с размерами (нет сдвигов).",
        "**Подключение к CDN** (`preconnect`) начинается заранее.",
      ),
    ]),

    section("analysis", [
      annotated(
        "html",
        `
        <link rel="preconnect" href="https://cdn.example.com" crossorigin>
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
        <link rel="stylesheet" href="/css/print.css" media="print">
        <script src="/js/app.js" defer></script>
        <script src="/js/ads.js" async></script>
        <img src="/img/hero.avif" alt="…" width="1200" height="600" fetchpriority="high">
        <img src="/img/card.jpg" alt="…" width="600" height="400" loading="lazy">
        `,
        [
          { line: 1, text: "`preconnect` заранее устанавливает соединение (DNS+TCP+TLS) с CDN. `crossorigin` нужен, если с этого домена будут загружаться CORS-ресурсы (шрифты, `fetch`)." },
          { line: 2, text: "Шрифт обнаруживается только после загрузки CSS; `preload` запускает загрузку сразу. `crossorigin` обязателен даже для того же домена, иначе файл загрузится дважды." },
          { line: 3, text: "`media=\"print\"`: стиль не блокирует отрисовку на экране (загружается с низким приоритетом) и применяется при печати." },
          { line: 4, text: "`defer`: скрипт загружается параллельно и выполняется после парсинга, сохраняя порядок относительно других `defer`." },
          { line: 5, text: "`async`: независимый скрипт выполняется сразу после загрузки, порядок не гарантируется — подходит для рекламы и аналитики." },
          { line: 6, text: "Главное изображение: `fetchpriority=\"high\"`, без `lazy`, с размерами — быстрый LCP и нулевой CLS." },
          { line: 7, text: "Изображение ниже первого экрана: `loading=\"lazy\"` откладывает загрузку; размеры резервируют место." },
        ],
        "resource-annotated.html",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Запрос и первый байт", "Браузер запрашивает HTML. TTFB (время до первого байта) задаёт нижнюю границу всего последующего. Кэш и CDN сокращают его."],
          ["Парсер и предсканер", "Парсер строит DOM. Параллельно **preload scanner** просматривает уже полученный HTML и запускает загрузку стилей, скриптов и изображений, найденных в разметке — даже пока основной парсер заблокирован скриптом."],
          ["CSSOM и блокировка отрисовки", "Стили строят CSSOM; пока обязательные стили не готовы, браузер **не отрисовывает** страницу (чтобы не показывать «голый» HTML). Синхронный скрипт после `<link rel=\"stylesheet\">` ждёт CSS."],
          ["Выполнение скриптов", "Синхронные скрипты останавливают парсер; `defer`/модули выполняются после разбора; `async` — по готовности. Обработчики `DOMContentLoaded` запускаются после `defer`."],
          ["Раскладка и отрисовка", "Из DOM и CSSOM строится дерево отображения, рассчитывается раскладка, затем отрисовка. Первое содержательное изображение/текст определяет LCP."],
          ["Поздние ресурсы", "Ресурсы, найденные не парсером, а CSS (`url()`, шрифты) или JS (динамические вставки), обнаруживаются **позже**. `preload` переводит их в раннюю фазу."],
        ],
        "Что происходит от запроса до отрисовки",
      ),
      note("Предсканер не видит ресурсы, добавленные скриптом и фоновые изображения в CSS. Если это критичные ресурсы (главная картинка, шрифт), добавьте их в HTML (`<img>`, `preload`)."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Синхронный скрипт в начале `head`"),
      wrongRight(
        "html",
        {
          code: `
            <head>
              <script src="/js/vendor.js"></script>
              <script src="/js/app.js"></script>
            </head>
          `,
          note: "Парсер останавливается на каждом скрипте; до их загрузки и выполнения страница не продолжается.",
        },
        {
          code: `
            <head>
              <script src="/js/vendor.js" defer></script>
              <script src="/js/app.js" defer></script>
            </head>
          `,
          note: "Скрипты загружаются параллельно с парсингом и выполняются по порядку после него.",
        },
      ),
      h("Ошибка 2. `loading=\"lazy\"` на главном изображении"),
      p("Ленивая загрузка откладывает самую важную картинку, и LCP растёт. Главное изображение первого экрана — обычная загрузка с `fetchpriority=\"high\"`."),
      h("Ошибка 3. `preload` шрифта без `crossorigin`"),
      wrongRight(
        "html",
        {
          code: `
            <link rel="preload" href="/fonts/inter.woff2" as="font">
          `,
          note: "Режим запроса не совпадает с тем, который использует CSS для шрифтов: файл загрузится дважды.",
        },
        {
          code: `
            <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
          `,
          note: "Совпадение режима CORS и верный `type`: ресурс используется повторно.",
        },
      ),
      h("Ошибка 4. Цепочки `@import`"),
      p("Файл A импортирует B, B импортирует C: каждый следующий обнаруживается после загрузки предыдущего. Подключайте файлы отдельными `<link>` или собирайте в один."),
      h("Ошибка 5. Слишком много `preload` и `preconnect`"),
      p("Если «приоритетны» десять ресурсов, приоритетов нет. `preconnect` — для 2–4 критичных источников; `preload` — для 1–3 действительно поздно обнаруживаемых."),
      h("Ошибка 6. Изображения без размеров"),
      p("Без `width`/`height` браузер не знает, сколько места зарезервировать; при загрузке контент «прыгает» (CLS). Указывайте размеры или `aspect-ratio`."),
      h("Ошибка 7. Тяжёлый сторонний код в `<head>` без `async`/`defer`"),
      p("Чаты, рекламные и аналитические скрипты, подключённые синхронно, могут «положить» страницу вместе с чужим сервером. Всегда асинхронно и по возможности отложенно."),
      h("Ошибка 8. Ориентация на «баллы» вместо реальных пользователей"),
      p("Лабораторные метрики (Lighthouse) полезны, но измерять нужно реальный опыт (RUM, CrUX). Оптимизация под 100 баллов в лаборатории может не улучшить жизнь пользователей."),
    ]),

    section("antipatterns", [
      ul(
        "**«Склеить всё в один JS-файл на 3 МБ»** и подключить синхронно: ни кэширования, ни параллелизма.",
        "**Загрузка всех библиотек «на всякий случай»** на каждой странице.",
        "**Критичный CSS «целиком» в `<style>`** на сотни КБ: он не кэшируется и раздувает HTML.",
        "**Предзагрузка всего подряд** (`prefetch` десятков страниц) — трата трафика пользователя.",
        "**Фоновые изображения в CSS** для главного контента: поздно обнаруживаются, не имеют `alt` и не получают `fetchpriority`.",
        "**Блокирующие шрифты без запасного** — невидимый текст («FOIT») на медленных сетях.",
        "**Динамическая вставка критичных ресурсов скриптом** — предсканер их не видит.",
        "**Отсутствие бюджета производительности:** нет порогов, которые блокируют ухудшение.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Скрипты — `defer` (или `type=\"module\"`) по умолчанию;** `async` — для независимых; синхронные — только осознанно.",
        "**CSS: минимум, без `@import`;** `media` для условных стилей; критический CSS — компактный.",
        "**`preconnect` — к 2–4 критичным источникам;** `dns-prefetch` — для остальных сторонних доменов.",
        "**`preload` — только для поздно обнаруживаемых критичных ресурсов** (шрифт, фон LCP); верные `as`, `type`, `crossorigin`.",
        "**Главное изображение — `fetchpriority=\"high\"`, без `lazy`;** остальные — `loading=\"lazy\"`, `decoding=\"async\"`.",
        "**`width`/`height` у всех изображений и видео.**",
        "**Современные форматы (AVIF/WebP), WOFF2, Brotli,** кэш с версиями в именах файлов.",
        "**Сторонние скрипты** — асинхронно, по возможности по требованию (фасады), с ревизией пользы.",
        "**Измеряйте реальных пользователей** и держите бюджет производительности в CI.",
        "**Тестируйте на слабых устройствах и медленных сетях** (эмуляция в DevTools).",
      ),
    ]),

    section("edge-cases", [
      h("`async` и зависимости"),
      p("Если скрипт B зависит от A, `async` на обоих не гарантирует порядок. Используйте `defer` (порядок сохраняется) или модули с `import`."),
      h("`defer` и инлайновые скрипты"),
      p("Инлайновый `<script>` выполняется сразу при встрече парсером, даже если рядом стоят `defer`-скрипты. Если ему нужен код из `defer`-файла — оберните вызов в обработчик `DOMContentLoaded`."),
      h("Модули и CORS"),
      p("Модули загружаются по CORS: сервер, отдающий их с другого домена, должен присылать заголовки `Access-Control-Allow-Origin`. Расширение файла не важно, MIME-тип — JavaScript."),
      h("`preload` и `as=\"fetch\"`"),
      p("Предзагрузка данных для `fetch()` (`as=\"fetch\"` с `crossorigin`) возможна, но требует совпадения заголовков запроса; иначе браузер загрузит повторно."),
      h("`prefetch` и приватность"),
      p("Предзагрузка страниц тратит трафик и может засчитывать «посещения» на сервере. Для динамических страниц используйте с осторожностью и учитывайте режим экономии трафика."),
      h("Ленивая загрузка и SEO"),
      p("Нативный `loading=\"lazy\"` поисковики понимают; самодельная «ленивая загрузка» через `data-src` и скрипт может скрыть изображения от роботов. Предпочитайте нативную."),
      h("Speculation Rules"),
      p("`<script type=\"speculationrules\">` позволяет предзагружать и предрендерить вероятные страницы (в браузерах на базе Chromium). Это дополнение: сайт должен хорошо работать и без него, а предрендеринг требует аккуратности со сторонним кодом, аналитикой и побочными эффектами."),
      h("Режим «сохранения данных»"),
      p("При медленном соединении или режиме экономии трафика агрессивные `prefetch`/`preload` могут навредить. Учитывайте `navigator.connection.saveData` там, где он поддерживается."),
    ]),

    section("related", [
      ul(
        "[Элемент head и метаданные](/learn/html/head-metadata) — порядок элементов в `head`.",
        "[Парсинг и DOM](/learn/html/parsing-dom) — как парсер обрабатывает скрипты.",
        "[Адаптивные изображения](/learn/html/responsive-images) — `srcset`, `sizes`, `picture`, форматы.",
        "[Встраиваемое содержимое](/learn/html/embedded-content) — `iframe`, `loading=\"lazy\"`.",
        "[Производительность HTML](/learn/html/html-performance) — бюджеты, метрики, оптимизации.",
        "[Прогрессивное улучшение](/learn/html/progressive-enhancement) — работа страницы без JS.",
        "Из других курсов: **CSS** — `font-display`, `content-visibility`, критический CSS; **JS** — модули, динамический `import()`, `PerformanceObserver`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "Блокирующая шапка",
          code: `
            <head>
              <script src="https://chat.example.com/widget.js"></script>
              <script src="/js/jquery.js"></script>
              <script src="/js/app.js"></script>
              <link rel="stylesheet" href="/css/all.css">
            </head>
            <body>
              <img src="/img/hero.jpg" alt="…" loading="lazy">
            </body>
          `,
          note: "Три синхронных скрипта блокируют парсинг, один из них сторонний; главное изображение загружается лениво.",
        },
        {
          title: "Быстрая отрисовка",
          code: `
            <head>
              <link rel="preconnect" href="https://cdn.example.com" crossorigin>
              <link rel="stylesheet" href="/css/main.css">
              <script src="/js/app.js" defer></script>
              <script src="https://chat.example.com/widget.js" async></script>
            </head>
            <body>
              <img src="/img/hero.avif" alt="…" width="1200" height="600" fetchpriority="high">
            </body>
          `,
          note: "Скрипты отложены или асинхронны, главное изображение приоритетно и с размерами, соединение с CDN готовится заранее.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.resource-loading.ex1",
      title: "Порядок выполнения скриптов",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Дан фрагмент `<head>`. Какие порядки выполнения гарантированы, какие — нет?"),
        code(
          "html",
          `
          <script src="a.js"></script>
          <script src="b.js" defer></script>
          <script src="c.js" async></script>
          <script src="d.js" type="module"></script>
          <script src="e.js" defer></script>
          `,
        ),
      ],
      hints: ["Что делает синхронный скрипт с парсером?", "В каком порядке выполняются `defer` и модули?", "Что происходит с `async`?"],
      checks: ["a — первым среди остальных", "b, d, e — в порядке документа после парсинга", "c — непредсказуемо, но не раньше a"],
      solution: [
        ul(
          "**a.js** выполняется первым и блокирует парсер: остальные скрипты загружаются после его выполнения (но предсканер может начать загрузку заранее).",
          "**b.js, d.js, e.js** (`defer` и модуль) выполняются **после** разбора документа, **в порядке документа** (b → d → e), до `DOMContentLoaded`.",
          "**c.js** (`async`) выполняется, как только загрузится: это может быть до окончания парсинга или после, и до или между b/d/e — порядок **не гарантирован**.",
        ),
      ],
    }),
    exercise({
      id: "html.resource-loading.ex2",
      title: "Оптимизируйте head и первый экран",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Дан медленный `<head>` и разметка героя. Перепишите так, чтобы улучшить LCP и убрать сдвиги: подключение к CDN, шрифт, главное изображение, стили, скрипты, галерея. Объясните, что и почему вы изменили."),
        code(
          "html",
          `
          <head>
            <script src="https://analytics.example.com/a.js"></script>
            <script src="/js/app.js"></script>
            <link rel="stylesheet" href="/css/main.css">
            <link rel="stylesheet" href="/css/print.css">
          </head>
          <body>
            <img src="https://cdn.example.com/hero.jpg" alt="Кроссовки Run" loading="lazy">
            <img src="https://cdn.example.com/g1.jpg" alt="…">
            <img src="https://cdn.example.com/g2.jpg" alt="…">
          </body>
          `,
        ),
      ],
      hints: ["Какие скрипты можно отложить?", "Какое изображение — кандидат LCP?", "Что делает `media=\"print\"`?"],
      checks: ["`defer`/`async` у скриптов", "`preconnect` к CDN", "`fetchpriority=\"high\"` и без `lazy` у героя", "`lazy` и размеры у галереи", "`media=\"print\"`"],
      solution: [
        code(
          "html",
          `
          <head>
            <link rel="preconnect" href="https://cdn.example.com" crossorigin>
            <link rel="stylesheet" href="/css/main.css">
            <link rel="stylesheet" href="/css/print.css" media="print">
            <script src="/js/app.js" defer></script>
            <script src="https://analytics.example.com/a.js" async></script>
          </head>
          <body>
            <img src="https://cdn.example.com/hero.jpg" alt="Кроссовки Run" width="1200" height="600" fetchpriority="high">
            <img src="https://cdn.example.com/g1.jpg" alt="…" width="600" height="400" loading="lazy" decoding="async">
            <img src="https://cdn.example.com/g2.jpg" alt="…" width="600" height="400" loading="lazy" decoding="async">
          </body>
          `,
          { lineNumbers: true, collapsed: true },
        ),
        ul(
          "**Скрипты:** аналитика — `async` (независима), приложение — `defer`.",
          "**CSS печати** с `media=\"print\"` не блокирует отрисовку экрана.",
          "**`preconnect`** к CDN: соединение готовится параллельно с CSS.",
          "**Герой:** ленивая загрузка снята, добавлен `fetchpriority=\"high\"`, размеры предотвращают сдвиги; формат стоит заменить на AVIF/WebP с `<picture>`.",
          "**Галерея:** `lazy` + размеры + `decoding=\"async\"`.",
        ),
      ],
    }),
    exercise({
      id: "html.resource-loading.ex3",
      title: "Почему LCP — 6 секунд?",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Страница на 4G показывает LCP 6 секунд. В водопаде: синхронный сторонний скрипт ждёт 1,2 секунды; `main.css` импортирует `fonts.css` и `theme.css`; шрифт загружается дважды; главное изображение — `loading=\"lazy\"`; при загрузке карточки «прыгают». Найдите причины и предложите исправления."),
      ],
      starter: {
        lang: "html",
        code: `
          <head>
            <script src="https://widgets.example.com/chat.js"></script>
            <link rel="stylesheet" href="/css/main.css">   <!-- @import fonts.css; @import theme.css -->
            <link rel="preload" href="/fonts/inter.woff2" as="font">
          </head>
          <body>
            <img src="/img/hero.jpg" alt="…" loading="lazy">
            <div class="cards"><img src="/img/c1.jpg" alt="…"><img src="/img/c2.jpg" alt="…"></div>
          </body>
        `,
      },
      hints: ["Что блокирует парсер?", "Как обнаруживаются стили из `@import`?", "Что значит двойная загрузка шрифта?", "Что нужно изображениям, чтобы не было сдвигов?"],
      checks: ["`async`/`defer` для чата", "Без `@import`", "`crossorigin` у `preload` шрифта", "Герой без `lazy`, с `fetchpriority`", "Размеры у изображений"],
      solution: [
        ul(
          "**Синхронный сторонний скрипт** блокирует парсер → `async` (или загружать по требованию).",
          "**`@import` в CSS** создаёт цепочку запросов → отдельные `<link>`, либо сборка в один файл.",
          "**`preload` шрифта без `crossorigin`** (и без `type`) → шрифт грузится дважды; добавить `crossorigin` и `type=\"font/woff2\"`.",
          "**`loading=\"lazy\"` у героя** откладывает главный элемент → убрать, добавить `fetchpriority=\"high\"`.",
          "**Нет `width`/`height`** → сдвиги CLS; указать размеры.",
        ),
        code(
          "html",
          `
          <head>
            <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
            <link rel="stylesheet" href="/css/main.css">
            <link rel="stylesheet" href="/css/theme.css">
            <script src="https://widgets.example.com/chat.js" async></script>
          </head>
          <body>
            <img src="/img/hero.jpg" alt="…" width="1200" height="600" fetchpriority="high">
            <div class="cards">
              <img src="/img/c1.jpg" alt="…" width="400" height="300" loading="lazy">
              <img src="/img/c2.jpg" alt="…" width="400" height="300" loading="lazy">
            </div>
          </body>
          `,
          { lineNumbers: true },
        ),
      ],
    }),
  ],

  challenge: {
    id: "html.resource-loading.challenge",
    title: "Бюджет производительности для новостного сайта",
    scenario: [
      p("Новостной портал: главная страница с главной новостью (крупная фотография), лентой из 20 карточек с изображениями, шапкой, шрифтом, аналитикой, рекламными блоками и чат-виджетом. По данным реальных пользователей (CrUX): LCP 4,3 с, INP 380 мс, CLS 0,22 на мобильных. Бизнес хочет уложиться в «зелёную» зону (LCP ≤ 2,5 с, INP ≤ 200 мс, CLS ≤ 0,1) за квартал."),
      p("Составьте план: диагностика, приоритетные правки HTML, правки загрузки скриптов, бюджет (в КБ и мс), автоматические проверки и мониторинг."),
    ],
    requirements: [
      "Список гипотез и способов их проверки (водопад, трасса Performance, RUM)",
      "Правки разметки `head`, героя и ленты (приоритеты, ленивая загрузка, размеры)",
      "Политика для рекламы, аналитики и чата (async, фасады, лимиты)",
      "Бюджет производительности и проверки в CI",
      "Мониторинг и критерии успеха",
    ],
    constraints: [
      "Реклама — обязательная часть бизнес-модели",
      "Нельзя ломать SEO и доступность",
      "Изменения — безопасные, с возможностью отката",
    ],
    acceptance: [
      "LCP-элемент определён и загружается с высоким приоритетом",
      "Сдвиги от изображений и рекламы устранены резервированием места",
      "Сторонние скрипты не блокируют парсинг; чат загружается по требованию",
      "Бюджет закреплён в CI и сопровождается мониторингом реальных пользователей",
    ],
    hints: [
      "Что является LCP-элементом на главной?",
      "Как зарезервировать место под рекламу?",
      "Что можно перенести на «после первого взаимодействия»?",
    ],
    solution: [
      ol(
        "**Диагностика.** CrUX + RUM: распределение по устройствам и страницам; Lighthouse/WebPageTest на «медленном 4G» и среднем Android; DevTools Performance: определить LCP-элемент (скорее всего, фото главной новости), длинные задачи (INP), источники сдвигов (CLS: реклама, шрифт, изображения без размеров).",
        "**LCP.** Главное фото: `<img>` с `fetchpriority=\"high\"`, без `lazy`, `srcset`/`sizes` и AVIF/WebP; при необходимости `preload` с `imagesrcset`. `preconnect` к CDN. Сокращение TTFB (кэш HTML/CDN, потоковая отдача).",
        "**CSS и шрифты.** Критический CSS шапки и первой новости встроить (малый объём), остальное — отдельным файлом; убрать `@import`; `preload` WOFF2 с `crossorigin`, `font-display: swap` (или `optional`), подмножества шрифта.",
        "**Скрипты.** Собственный код — `defer`/модули; аналитика и реклама — `async`; чат — фасад (кнопка), загрузка по клику/через `requestIdleCallback`; сократить сторонний JS, удалить неиспользуемое.",
        "**CLS.** `width`/`height` у всех изображений; блоки рекламы — фиксированные контейнеры с `min-height`/`aspect-ratio`; не вставлять контент выше уже показанного.",
        "**INP.** Разбить долгие задачи, убрать тяжёлые обработчики в основном потоке, отложить сторонние виджеты; измерить через Performance/RUM.",
        "**Лента.** Карточки ниже первого экрана — `loading=\"lazy\"`, `decoding=\"async\"`; размеры и `aspect-ratio`.",
        "**Бюджет.** Например: HTML ≤ 40 КБ (gzip/Brotli), CSS ≤ 70 КБ, собственный JS ≤ 170 КБ, сторонний JS ≤ 100 КБ, изображения первого экрана ≤ 250 КБ; LCP ≤ 2,5 с, CLS ≤ 0,1, INP ≤ 200 мс (75-й процентиль).",
        "**Проверки в CI.** Lighthouse CI/Playwright-трасса на ключевых страницах с порогами; проверка размеров бандлов; линтеры HTML (`img` без размеров, `script` без `defer/async`).",
        "**Мониторинг.** RUM-скрипт с `PerformanceObserver` (LCP, CLS, INP) → дашборды и алерты; еженедельный просмотр худших страниц; откат при ухудшении.",
      ),
      code(
        "html",
        `
        <head>
          <link rel="preconnect" href="https://cdn.example.com" crossorigin>
          <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
          <link rel="preload" as="image" href="/img/lead-800.avif"
                imagesrcset="/img/lead-800.avif 800w, /img/lead-1600.avif 1600w" imagesizes="100vw" fetchpriority="high">
          <style>/* критический CSS шапки и первой новости */</style>
          <link rel="stylesheet" href="/css/main.css">
          <script src="/js/app.js" defer></script>
          <script src="https://ads.example.com/ads.js" async></script>
        </head>
        <body>
          <img src="/img/lead-800.avif" srcset="/img/lead-800.avif 800w, /img/lead-1600.avif 1600w"
               sizes="100vw" alt="…" width="1600" height="900" fetchpriority="high">

          <div class="ad-slot" style="min-height:250px"></div>

          <button type="button" id="chat-open">Нужна помощь? Открыть чат</button>
          <script>
            document.getElementById("chat-open").addEventListener("click", () => {
              const s = document.createElement("script");
              s.src = "https://chat.example.com/widget.js";
              document.head.append(s);
            }, { once: true });
          </script>
        </body>
        `,
        { lineNumbers: true, filename: "news-optimized.html", collapsed: true },
      ),
      ul(
        "**Критерий успеха:** 75-й процентиль мобильных пользователей в «зелёной» зоне по трём метрикам в течение четырёх недель подряд.",
        "**Риски:** снижение выручки от рекламы (согласовать эксперименты), предрендеринг и предзагрузка расходуют трафик, фасады чата снижают долю обращений — измерять и обсуждать с бизнесом.",
      ),
    ],
  },

  interview: [
    iq("html.resource-loading.i1", "basic", "Чем `defer` отличается от `async`?", [
      ul(
        "`defer`: загрузка параллельно с парсингом, выполнение после разбора документа, **в порядке** подключения, до `DOMContentLoaded`.",
        "`async`: загрузка параллельно, выполнение **сразу после загрузки**, порядок не гарантирован.",
        "`defer` — для основных скриптов, зависящих друг от друга и от DOM; `async` — для независимых (аналитика).",
      ),
    ]),
    iq("html.resource-loading.i2", "basic", "Что блокирует отрисовку страницы?", [
      p("CSS: пока стили не загружены, браузер не показывает страницу. Синхронные скрипты блокируют парсинг HTML и косвенно задерживают отрисовку."),
    ]),
    iq("html.resource-loading.i3", "intermediate", "Чем `preload` отличается от `prefetch` и `preconnect`?", [
      ul(
        "`preload` — загрузить конкретный ресурс **для текущей** страницы с высоким приоритетом (шрифт, фон LCP).",
        "`prefetch` — загрузить ресурс для **следующей** навигации с низким приоритетом.",
        "`preconnect` — только установить соединение (DNS+TCP+TLS) с источником заранее.",
      ),
    ]),
    iq("html.resource-loading.i4", "intermediate", "Зачем `crossorigin` у `preload` шрифта?", [
      p("Шрифты загружаются в режиме CORS даже с того же домена. Если `preload` выполнен без `crossorigin`, его запрос не совпадает по режиму, и браузер загружает шрифт второй раз."),
    ]),
    iq("html.resource-loading.i5", "intermediate", "Почему нельзя применять `loading=\"lazy\"` к главному изображению?", [
      p("Ленивая загрузка откладывает запрос до тех пор, пока браузер не определит видимость; главный элемент первого экрана (LCP) должен загружаться как можно раньше, с `fetchpriority=\"high\"`."),
    ]),
    iq("html.resource-loading.i6", "advanced", "Что такое preload scanner и как он влияет на структуру страницы?", [
      p("Это параллельный «сканер» HTML, который находит в уже полученной разметке ссылки на ресурсы и запускает их загрузку, пока основной парсер блокирован. Он не видит ресурсы, добавленные скриптом или заданные в CSS (`url()`), поэтому критичные ресурсы должны быть объявлены в HTML или предзагружены."),
    ]),
    iq("html.resource-loading.i7", "engineering", "Как вы встроите контроль производительности в процесс разработки?", [
      ul(
        "Бюджеты (размеры бандлов, метрики Web Vitals) и автоматические проверки в CI (Lighthouse CI, тесты размеров).",
        "RUM-мониторинг реальных пользователей и алерты при деградации.",
        "Линтеры HTML/JS: `img` без размеров, синхронные скрипты, большие зависимости.",
        "Обзор сторонних скриптов и ответственных владельцев; процесс отката.",
      ),
    ]),
    iq("html.resource-loading.i8", "debugging", "LCP высокий, хотя картинка маленькая. Что вы проверите по водопаду?", [
      ul(
        "Когда начинается запрос картинки (обнаружена ли парсером, есть ли `lazy`, `fetchpriority`).",
        "Что блокирует старт: синхронные скрипты, CSS-цепочки, задержка TTFB, очередь запросов.",
        "Не загружается ли картинка из CSS/JS (поздно) и не слишком ли она тяжёлая для формата.",
        "Использование CDN и кэша, соединение (`preconnect`).",
      ),
    ]),
  ],

  exam: [
    mcq("html.resource-loading.e1", "foundation", "Какой атрибут откладывает выполнение скрипта до окончания парсинга и сохраняет порядок?", ["`async`", "`defer`", "`nomodule`", "`lazy`"], 1, "`defer` загружает параллельно и выполняет после разбора документа в порядке подключения."),
    mcq("html.resource-loading.e2", "foundation", "Что блокирует отрисовку страницы по умолчанию?", ["`<img>`", "`<link rel=\"stylesheet\">`", "`<script async>`", "`<link rel=\"prefetch\">`"], 1, "Пока стили не готовы, браузер не отрисовывает страницу, чтобы не показать «голый» HTML."),
    mcq("html.resource-loading.e3", "intermediate", "Для чего нужен `rel=\"preconnect\"`?", ["Загрузить ресурс заранее", "Заранее установить соединение с источником (DNS+TCP+TLS)", "Отложить скрипт", "Выполнить редирект"], 1, "`preconnect` готовит соединение; сам ресурс он не загружает."),
    mcq("html.resource-loading.e4", "intermediate", "Какие утверждения верны? Выберите все.", ["Модули (`type=\"module\"`) выполняются отложенно по умолчанию", "`defer` работает для инлайновых скриптов", "Скрипты, созданные динамически, по умолчанию `async`", "`loading=\"lazy\"` подходит для главного изображения первого экрана"], [0, 2], "`defer` действует только на внешние скрипты; главное изображение лениво загружать нельзя."),
    mcq("html.resource-loading.e5", "intermediate", "Когда наступает `DOMContentLoaded`?", ["После загрузки всех изображений", "Когда HTML разобран и выполнены `defer`-скрипты и модули", "До парсинга", "После `load`"], 1, "`DOMContentLoaded` не ждёт стили, изображения и фреймы (это событие `load`)."),
    mcq("html.resource-loading.e6", "advanced", "Что произойдёт при `preload` шрифта без `crossorigin`?", ["Ничего", "Шрифт загрузится дважды", "Шрифт не загрузится", "Шрифт загрузится быстрее"], 1, "Режимы запросов не совпадают, поэтому предзагруженный файл не используется повторно."),
    open("html.resource-loading.e7", "intermediate", "Объясните, как вы определите и ускорите LCP на странице с большой фотографией на первом экране.", [
      ol(
        "Определить LCP-элемент в DevTools/Lighthouse (обычно главное изображение или заголовок).",
        "Убедиться, что оно обнаружено парсером (`<img>`), без `loading=\"lazy\"`, с `fetchpriority=\"high\"`; при поздней обнаруживаемости — `preload`.",
        "Оптимизировать формат и размер (AVIF/WebP, `srcset`/`sizes`).",
        "Убрать блокирующие ресурсы выше по цепочке: синхронные скрипты, CSS-цепочки; ускорить TTFB (CDN, кэш); `preconnect` к источнику.",
      ),
    ], ["Определён LCP-элемент", "Названы `fetchpriority`/`preload`/без `lazy`", "Названы блокирующие ресурсы и TTFB"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.resource-loading.m1", "intermediate", "Какой вариант подходит для независимого рекламного скрипта?", ["`<script src>` без атрибутов", "`<script async src>`", "`<script defer src>` после `</body>`", "Динамический `<script>` с `async=false`"], 1, "`async` не блокирует парсинг, а порядок для независимых скриптов не важен."),
    mcq("html.resource-loading.m2", "advanced", "Почему нельзя полагаться на preload scanner для фонового изображения, заданного в CSS?", ["Он не поддерживает JPEG", "Он не просматривает CSS и скрипты, поэтому ресурс обнаруживается поздно", "Он отключён по умолчанию", "Он блокирует CSS"], 1, "Предсканер работает с HTML; ресурсы из CSS и JS обнаруживаются позже — для критичных нужен `preload` или `<img>`."),
    mcq("html.resource-loading.m3", "advanced", "Что даёт `media=\"print\"` у `<link rel=\"stylesheet\">`?", ["Блокирует печать", "Не блокирует отрисовку на экране; файл загружается с низким приоритетом", "Ускоряет JS", "Отключает кэш"], 1, "Стиль, не подходящий текущему устройству, не блокирует первую отрисовку."),
    open("html.resource-loading.m4", "advanced", "Команда предлагает «предзагрузить всё»: добавить `preload` для 25 ресурсов, `prefetch` для 10 страниц и `preconnect` ко всем сторонним доменам. Что вы ответите?", [
      ul(
        "Приоритет — ограниченный ресурс: когда «всё важно», важного нет; `preload` конкурируют с действительно критичными запросами.",
        "`preconnect` дорог (держит соединения): 2–4 источника; для остальных — `dns-prefetch`.",
        "`prefetch` тратит трафик пользователя и может влиять на серверные метрики; применять для вероятных переходов (по данным).",
        "Метод: измерять водопад, находить поздно обнаруживаемые критичные ресурсы, предзагружать только их; проверять эффект на RUM.",
      ),
    ], ["Названа проблема конкуренции приоритетов", "Названы ограничения preconnect/prefetch", "Предложен измеримый подход"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.resource-loading.f1", front: "defer vs async?", back: "`defer`: после парсинга, по порядку, до DOMContentLoaded. `async`: сразу по готовности, без порядка." },
    { id: "html.resource-loading.f2", front: "Что блокирует?", back: "CSS блокирует отрисовку; синхронные скрипты — парсинг." },
    { id: "html.resource-loading.f3", front: "preload vs prefetch vs preconnect?", back: "preload — нужно сейчас; prefetch — на следующей странице; preconnect — только соединение." },
    { id: "html.resource-loading.f4", front: "Шрифт в preload?", back: "С `crossorigin` и `type=\"font/woff2\"`, иначе загрузится дважды." },
    { id: "html.resource-loading.f5", front: "Главное изображение (LCP)?", back: "`fetchpriority=\"high\"`, без `loading=\"lazy\"`, с `width`/`height`." },
    { id: "html.resource-loading.f6", front: "Порог Core Web Vitals?", back: "LCP ≤ 2,5 с; INP ≤ 200 мс; CLS ≤ 0,1 (75-й процентиль)." },
  ],

  sources: [
    { title: "HTML Living Standard — Scripting: the script element (async, defer)", url: "https://html.spec.whatwg.org/multipage/scripting.html#the-script-element", publisher: "WHATWG" },
    { title: "MDN: <script>", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script", publisher: "MDN" },
    { title: "MDN: rel=\"preload\"", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload", publisher: "MDN" },
    { title: "MDN: rel=\"preconnect\"", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preconnect", publisher: "MDN" },
    { title: "MDN: Lazy loading", url: "https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Lazy_loading", publisher: "MDN" },
    { title: "web.dev: Optimize resource loading with the Fetch Priority API", url: "https://web.dev/articles/fetch-priority", publisher: "Other" },
    { title: "web.dev: Largest Contentful Paint (LCP)", url: "https://web.dev/articles/lcp", publisher: "Other" },
  ],
};
