import type { Project } from "../../types";
import { code, h, note, p, table, tip, ul, warn } from "../../dsl";

export const p04GridDashboard: Project = {
  id: "css.p04-grid-dashboard",
  domain: "css",
  order: 4,
  title: "Панель управления на Grid",
  subtitle: "Каркас на именованных областях, баннер на всю ширину и колонка контента на именованных линиях, показатели на auto-fit, панели на подсетке, доска с протяжёнными плитками и галерея с плотной укладкой: вся двумерная раскладка без единого media-запроса к содержимому.",
  level: "intermediate",
  estimatedHours: 10,
  buildsOn: ["css.p03-flex-components"],
  topics: [
    "css.grid-basics",
    "css.grid-areas-placement",
    "css.grid-responsive",
    "css.subgrid-alignment",
    "css.container-queries",
    "css.media-queries",
    "css.units-math",
    "css.cascade-layers",
    "css.debugging-css",
  ],
  objective:
    "Собрать **панель управления из шести Grid-раскладок**: каркас на `grid-template-areas`, колонка контента с **именованными линиями** и баннером «на всю ширину», показатели на `repeat(auto-fit, minmax())`, панели с выровненными заголовками и кнопками на **подсетке**, доска с плитками на несколько дорожек (спаны включаются **запросом к контейнеру**) и галерея с `grid-auto-flow: dense` без дыр. Результат проверяется автоматической самопроверкой из **16 проверок**.",
  scenario: [
    p("В прошлом проекте вы выровняли подвалы карточек Flexbox-ом, но заголовки и тексты в разных карточках всё равно лежали на разных линиях: Flexbox выравнивает только внутри одной строки и ничего не знает о соседях. Теперь нужна настоящая **двумерная** раскладка."),
    p("Магазину нужна панель управления: меню слева, шапка и подвал на всю ширину, баннер «Обзор за неделю» на всю ширину области, а всё остальное — в центральной колонке шириной не более 60rem. Показатели должны сами подбирать число колонок, три панели каналов продаж — иметь выровненные по строкам заголовки, тексты и ссылки (даже если один заголовок занимает три строки), доска — содержать график размером 2×2 и широкие плитки, а галерея — укладываться плотно, без дыр."),
    code(
      "html",
      `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Панель управления — Лаборатория</title>
<link rel="stylesheet" href="style.css">
<body class="app">
<header class="app__header">
  <a class="logo" href="#">Панель</a>
  <p class="app__user">Анна Фролова</p>
</header>

<nav class="app__nav" aria-label="Разделы">
  <ul>
    <li><a href="#" aria-current="page">Обзор</a></li>
    <li><a href="#">Заказы</a></li>
    <li><a href="#">Клиенты</a></li>
    <li><a href="#">Склад</a></li>
    <li><a href="#">Отчёты</a></li>
    <li><a href="#">Настройки</a></li>
  </ul>
</nav>

<main class="app__main">
  <section class="hero">
    <h1>Обзор за неделю</h1>
    <p>Ключевые показатели магазина, каналы продаж, активность команды и галерея новых поступлений.</p>
  </section>

  <section class="stats" aria-label="Показатели">
    <article class="stat"><h2 class="stat__label">Заказы</h2><p class="stat__value">1 248</p></article>
    <article class="stat"><h2 class="stat__label">Выручка</h2><p class="stat__value">2,4 млн ₽</p></article>
    <article class="stat"><h2 class="stat__label">Новые клиенты</h2><p class="stat__value">312</p></article>
    <article class="stat"><h2 class="stat__label">Возвраты</h2><p class="stat__value">1,8%</p></article>
  </section>

  <section aria-labelledby="channels-title">
    <h2 id="channels-title">Каналы продаж</h2>
    <div class="panels">
      <article class="panel">
        <h3 class="panel__title">Сайт</h3>
        <p class="panel__body">Основной канал: заказы с каталога и из корзины.</p>
        <a class="panel__link" href="#">Подробнее</a>
      </article>
      <article class="panel">
        <h3 class="panel__title">Мобильное приложение для iOS и Android с подпиской на доставку</h3>
        <p class="panel__body">Быстрые повторные заказы, пуш-уведомления о скидках и статусах доставки, отдельная программа лояльности для постоянных клиентов.</p>
        <a class="panel__link" href="#">Подробнее</a>
      </article>
      <article class="panel">
        <h3 class="panel__title">Маркетплейсы</h3>
        <p class="panel__body">Три площадки, единый склад.</p>
        <a class="panel__link" href="#">Подробнее</a>
      </article>
    </div>
  </section>

  <section aria-labelledby="board-title">
    <h2 id="board-title">Доска</h2>
    <div class="board">
      <article class="tile tile--chart">
        <h3>Продажи по дням</h3>
        <div class="chart" role="img" aria-label="Столбчатая диаграмма продаж за неделю">
          <span style="--h: 40%"></span><span style="--h: 65%"></span><span style="--h: 55%"></span><span style="--h: 80%"></span><span style="--h: 70%"></span><span style="--h: 95%"></span><span style="--h: 60%"></span>
        </div>
      </article>
      <article class="tile tile--wide"><h3>Активность</h3><p>Ирина закрыла 12 обращений, Пётр обновил цены.</p></article>
      <article class="tile"><h3>Заметки</h3><p>Проверить остатки.</p></article>
      <article class="tile"><h3>Задачи</h3><p>7 открытых.</p></article>
      <article class="tile"><h3>Отзывы</h3><p>4,8 из 5.</p></article>
      <article class="tile tile--wide"><h3>Поставки</h3><p>Три машины ожидаются в четверг.</p></article>
      <article class="tile"><h3>Склад</h3><p>92% заполнен.</p></article>
    </div>
  </section>

  <section aria-labelledby="gallery-title">
    <h2 id="gallery-title">Новые поступления</h2>
    <ul class="gallery">
      <li class="gallery__item gallery__item--tall" style="--hue: 210">Фото 1</li>
      <li class="gallery__item" style="--hue: 150">Фото 2</li>
      <li class="gallery__item gallery__item--wide" style="--hue: 30">Фото 3</li>
      <li class="gallery__item" style="--hue: 280">Фото 4</li>
      <li class="gallery__item gallery__item--tall" style="--hue: 340">Фото 5</li>
      <li class="gallery__item" style="--hue: 60">Фото 6</li>
      <li class="gallery__item gallery__item--wide" style="--hue: 190">Фото 7</li>
      <li class="gallery__item" style="--hue: 100">Фото 8</li>
      <li class="gallery__item" style="--hue: 240">Фото 9</li>
    </ul>
  </section>
</main>

<footer class="app__footer">
  <p>© 2026 Лаборатория</p>
</footer>
</body>
</html>`,
      { filename: "page.html", lineNumbers: true, collapsed: true },
    ),
    note("Разметку менять нельзя. В ней уже стоят классы и несколько инлайновых переменных (`--h` у столбцов графика, `--hue` у плиток галереи): они нужны CSS как «входные данные». Спаны плиток на доске должны включаться **не по ширине окна**, а по ширине самой доски — в проекте для этого нужен запрос к контейнеру."),
  ],
  requirements: [
    "Один файл `style.css`; разметку менять нельзя.",
    "Каркас `.app`: `display: grid` и `grid-template-areas` из четырёх областей (`header`, `nav`, `main`, `footer`); на ширинах от 768px — меню слева шириной 14rem и основная область справа, шапка и подвал на всю ширину; на узких — области столбцом; при коротком содержимом подвал прижат к низу окна.",
    "Область `main` — сетка с **именованными линиями**: `full-start`, `content-start`, `content-end`, `full-end`; колонка контента `minmax(0, 60rem)` по центру, боковые поля не уже 1rem; все секции по умолчанию в колонке `content`.",
    "Баннер `.hero` занимает `full` (на всю ширину области), а его содержимое выровнено по колонке контента — через **подсетку** по колонкам (`grid-template-columns: subgrid`).",
    "Показатели `.stats`: `repeat(auto-fit, minmax(10rem, 1fr))`, карточки равной ширины, последняя колонка первой строки доходит до правого края контейнера.",
    "Панели `.panels`: колонки `repeat(auto-fit, minmax(16rem, 1fr))`; каждая панель занимает три строки сетки (`grid-row: span 3`) и использует **`grid-template-rows: subgrid`**, поэтому заголовки, тексты и ссылки соседних панелей лежат на общих линиях.",
    "Доска `.board`: `repeat(auto-fill, minmax(10rem, 1fr))`, `grid-auto-rows`, `grid-auto-flow: dense`; график — 2×2 дорожки, широкие плитки — 2 колонки; спаны включаются **запросом к контейнеру** (`container-type: inline-size` и `@container`), когда в доске помещаются две колонки; на одной колонке дополнительных дорожек нет.",
    "Галерея `.gallery`: `repeat(auto-fill, minmax(8rem, 1fr))`, `grid-auto-rows: 6rem`, `grid-auto-flow: dense`; «высокие» плитки занимают две строки, «широкие» — два столбца; пустых ячеек в сетке меньше, чем колонок (допустима неполная последняя строка).",
    "Использованы все ключевые возможности Grid: области, именованные линии, `auto-fit`, `auto-fill`, `minmax()`, `dense`, подсетка.",
    "Архитектура: слои `@layer`, переменные в `:root`, нет `!important` и `#id`, специфичность не выше (0,2,0), нет `float` и позиционирования для раскладки.",
    "Нет горизонтальной прокрутки на ширинах от 320 до 1440px; есть заметный `:focus-visible`.",
  ],
  constraints: [
    "Без JavaScript, фреймворков и препроцессоров; разметку не менять.",
    "Без `float`, `position: absolute/fixed`, табличной раскладки и расчётов ширин через `calc(100% / n)`.",
    "Без `!important`, идентификаторов в селекторах и инлайновых стилей (кроме уже имеющихся переменных в разметке).",
    "Число колонок не задаётся вручную (`repeat(4, 1fr)` запрещён для показателей, панелей, доски и галереи).",
    "Спаны плиток доски нельзя включать `@media`: они зависят от ширины доски, а не окна.",
    "Нельзя скрывать переполнение через `overflow-x: hidden` на `html` или `body`.",
  ],
  expected: [
    "Меню слева, шапка и подвал на всю ширину, баннер на всю ширину области, остальное — в колонке 60rem по центру; на телефоне всё столбцом.",
    "Четыре показателя в одну строку на широком экране, по два или по одному — на узком; строка всегда заполнена до края.",
    "Заголовки панелей, их тексты и ссылки лежат на общих горизонтальных линиях, даже когда один из заголовков занимает три строки.",
    "График на доске занимает два столбца и две строки, широкие плитки — два столбца; на узком экране доска превращается в одну колонку без горизонтальной прокрутки.",
    "Самопроверка печатает таблицу из 16 проверок, и все они OK на ширинах от 320 до 1440px.",
  ],
  technical: [
    "Порядок слоёв: `@layer reset, base, layout, components;`; каркас и колонки `main` — в слое `layout`, плитки и галерея — в `components`.",
    "Каркас: `grid-template-columns: var(--nav-width) minmax(0, 1fr)`, `grid-template-rows: auto 1fr auto`; на узких — `@media (max-width: 47.99rem)` с одной колонкой и четырьмя строками. Здесь media уместен: он перестраивает **страницу**, а не компонент.",
    "Колонки `main`: `[full-start] minmax(1rem, 1fr) [content-start] minmax(0, var(--content-width)) [content-end] minmax(1rem, 1fr) [full-end]`; `grid-column: content` — сокращение для линий `content-start`/`content-end`.",
    "Подсетка по колонкам у баннера: подсетка наследует и имена линий родителя, поэтому в `.hero` работает `grid-column: content`.",
    "Подсетка по строкам у панелей: `.panel { grid-row: span 3; grid-template-rows: subgrid }` — три строки родителя становятся строками панели, поэтому дорожки заголовков и текстов общие для всех панелей строки.",
    "Запрос к контейнеру: `.board { container-type: inline-size }` и `@container (min-width: 21rem) { .tile--chart { … } }` — 21rem = 2 колонки по 10rem плюс зазор 1rem.",
    "Проверки: самопроверка `check.js` (из решения) на ширинах от 320 до 1440px; `stylelint` с бюджетом `0,2,0`; отладка — панель Layout в DevTools (наложение линий и имён областей).",
  ],
  acceptance: [
    "Самопроверка `check.js`: все 16 проверок OK на ширинах 320, 360, 400, 480, 560, 700, 768, 900, 1024, 1100, 1280 и 1440px.",
    "Каркас: на ≥ 768px меню 14rem слева, шапка и подвал на всю ширину; на узких области идут столбцом; подвал прижат к низу окна.",
    "Баннер равен ширине области `main`, текст баннера начинается там же, где колонка контента; все секции выровнены по колонке контента.",
    "Показатели: число колонок равно `min(4, floor((ширина + gap) / (10rem + gap)))`, карточки равной ширины, последняя колонка доходит до края.",
    "Панели: у панелей одной строки совпадают верхние границы заголовков, текстов и ссылок (±1px); в CSS есть `grid-template-rows: subgrid`.",
    "Доска: при двух и более колонках график = 2 колонки × 2 строки, широкие плитки = 2 колонки, `dense`; при одной колонке — плитки на всю ширину без дополнительных дорожек.",
    "Галерея: «высокая» плитка = 2 строки, «широкая» = 2 колонки, пустых ячеек меньше числа колонок.",
    "`stylelint` с бюджетом `0,2,0` — 0 нарушений; нет `float`, `position: absolute/fixed`, `!important`, `#id`, горизонтальной прокрутки.",
  ],
  hints: [
    "Область `main` — не просто контейнер, а сетка: в ней живут именованные линии. Дочерним секциям по умолчанию задайте `grid-column: content`, а баннеру — `full`.",
    "Подсетка по колонкам у `.hero` (`grid-template-columns: subgrid`) наследует линии родителя вместе с их именами: поэтому внутри `.hero` работает `grid-column: content`.",
    "`repeat(auto-fit, minmax(10rem, 1fr))` сжимает пустые дорожки: когда карточек меньше, чем помещается, они растягиваются на всю строку. `auto-fill` оставляет пустые дорожки — для доски и галереи это нужно, чтобы размер плитки не «прыгал».",
    "Подсетке по строкам нужно, чтобы ребёнок занимал ровно столько строк родителя, сколько дорожек вы хотите разделить: `grid-row: span 3` (заголовок, текст, ссылка).",
    "Плитка со `span 2` в сетке из одной колонки создаёт дополнительную неявную колонку и вызывает горизонтальную прокрутку: включайте спаны только когда колонок хотя бы две.",
    "Чтобы включить спаны по ширине самой доски, нужен контейнер запросов: `container-type: inline-size` на `.board` и правило `@container` для плиток внутри.",
    "`grid-auto-flow: dense` закрывает дыры, но меняет визуальный порядок: плитки могут оказаться не там, где стоят в DOM — учитывайте для навигации с клавиатуры.",
  ],
  advanced: [
    "Добавьте именованные области внутри карточки (например, `grid-template-areas: \"icon title\" \"icon meta\"`) и перестройте её по запросу к контейнеру.",
    "Реализуйте масонри-подобную галерею на `grid-template-rows: masonry`, если поддерживается (проверьте через `CSS.supports`), либо на `columns`, и сравните порядок чтения.",
    "Сделайте панель `.app__nav` сворачиваемой: на узких экранах она превращается в строку с горизонтальной прокруткой (`overflow-x: auto`, `scroll-snap`).",
    "Перепишите баннер, используя `grid-template-columns: subgrid` только по строке и по столбцам, и объясните, почему при подсетке нельзя задавать независимые размеры дорожек.",
    "Напишите тест Playwright, который запускает `check.js` на 12 ширинах и выводит таблицу прохождения.",
  ],
  failureModes: [
    "**Нет подсетки у панелей:** заголовок в три строки сдвигает текст только в своей панели; в замере проверка выравнивания падает, потому что три панели лежат на разных линиях.",
    "**Спаны без запроса к контейнеру:** на ширине 320px доска получает вторую неявную колонку (в замере — 2 колонки вместо одной), плитки вылезают за край и появляется горизонтальная прокрутка.",
    "**`repeat(4, 1fr)` для показателей:** на телефоне четыре колонки по 93px (замер) — числа не помещаются; нужна `auto-fit` с минимальной шириной.",
    "**Нет `dense` у галереи:** в сетке остаются дыры (в замере 5 пустых ячеек на 1280px и 1 на 320px).",
    "**Баннер внутри колонки контента:** вместо 1041px (ширина области) он занимает 960px; «на всю ширину» требует именованных линий или отрицательных отступов — выбор в пользу линий.",
    "**Все области в один столбец без `grid-template-areas`:** на узком экране неявные строки выстраиваются в порядке DOM, а меню получает высоту во всю колонку (в замере — 3314px).",
    "**`1fr` вместо `minmax(0, 1fr)`:** дорожка `1fr` не уже минимального содержимого, длинное слово или таблица раздвигают сетку за пределы экрана.",
  ],
  rubric: [
    { criterion: "Каркас и области", weight: 15, description: "`grid-template-areas`, колонки и строки, перестройка на узком экране, подвал внизу окна." },
    { criterion: "Именованные линии и подсетка", weight: 25, description: "Линии `full`/`content`, баннер на всю ширину, подсетка по колонкам и по строкам, выравнивание заголовков, текстов и ссылок панелей." },
    { criterion: "Адаптивные колонки", weight: 20, description: "`auto-fit`, `auto-fill`, `minmax()`, отсутствие числа колонок «руками», равные ширины, заполнение строки." },
    { criterion: "Доска и галерея", weight: 20, description: "Спаны по строкам и столбцам, `dense`, запрос к контейнеру, отсутствие дыр и горизонтальной прокрутки." },
    { criterion: "Архитектура CSS", weight: 15, description: "Слои, переменные, низкая специфичность, нет `float`, позиционирования для раскладки, `!important`, `#id`." },
    { criterion: "Доступность", weight: 5, description: "Заметный `:focus-visible`, порядок в DOM осмыслен, плотная укладка не ломает порядок чтения." },
  ],
  solution: [
    p("Эталон — один файл. Он проходит все 16 проверок на 12 ширинах от 320 до 1440px; без стилей та же страница проходит 4 из 16, а шесть «плохих» вариантов (без подсетки у панелей, без запроса к контейнеру, с фиксированными четырьмя колонками показателей, без `dense`, без именованной линии у баннера и без областей на узком экране) ловятся своими проверками."),
    h("style.css"),
    code(
      "css",
      `@layer reset, base, layout, components;

:root {
  --ink: #1b1b1f;
  --paper: #ffffff;
  --muted: #55535c;
  --accent: #2f3d9a;
  --on-accent: #ffffff;
  --rule: #d0d3e6;
  --surface: #f4f5fb;

  --gap: 1rem;
  --radius: 0.5rem;
  --nav-width: 14rem;
  --content-width: 60rem;
}

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  body, h1, h2, h3, p, ul { margin: 0; }
  ul { padding: 0; list-style: none; }
}

@layer base {
  body { font: 1rem / 1.5 system-ui, sans-serif; color: var(--ink); background: var(--paper); }
  a { color: var(--accent); }
  :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
}

@layer layout {
  .app { display: grid; grid-template-columns: var(--nav-width) minmax(0, 1fr); grid-template-rows: auto 1fr auto; grid-template-areas: "header header" "nav main" "footer footer"; min-block-size: 100vh; }
  .app__header { grid-area: header; }
  .app__nav { grid-area: nav; }
  .app__main { grid-area: main; }
  .app__footer { grid-area: footer; }

  @media (max-width: 47.99rem) {
    .app { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto 1fr auto; grid-template-areas: "header" "nav" "main" "footer"; }
  }

  .app__main { display: grid; grid-template-columns: [full-start] minmax(1rem, 1fr) [content-start] minmax(0, var(--content-width)) [content-end] minmax(1rem, 1fr) [full-end]; row-gap: 2rem; align-content: start; padding-block-end: 2rem; }
  .app__main > * { grid-column: content; }
  .app__main > .hero { grid-column: full; }
}

@layer components {
  .app__header { display: flex; align-items: center; justify-content: space-between; gap: var(--gap); padding: 0.75rem 1rem; background: var(--accent); color: var(--on-accent); }
  .logo { font-weight: 700; color: inherit; text-decoration: none; }
  .app__nav { padding: 1rem; background: var(--surface); border-inline-end: 1px solid var(--rule); }
  .app__nav ul { display: grid; gap: 0.25rem; }
  .app__nav a { display: block; padding: 0.5rem 0.75rem; border-radius: var(--radius); text-decoration: none; }
  .app__nav [aria-current] { background: var(--accent); color: var(--on-accent); }
  .app__footer { padding: 1rem; border-block-start: 1px solid var(--rule); color: var(--muted); }

  .hero { display: grid; grid-template-columns: subgrid; padding-block: 2rem; background: var(--surface); }
  .hero > * { grid-column: content; }
  .hero > * + * { margin-block-start: 0.5rem; }

  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: var(--gap); }
  .stat { padding: 1rem; border: 1px solid var(--rule); border-radius: var(--radius); background: var(--surface); }
  .stat__label { font-size: 0.875rem; font-weight: 600; color: var(--muted); }
  .stat__value { font-size: 1.5rem; font-weight: 700; }

  .panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: var(--gap); margin-block-start: 1rem; }
  .panel { display: grid; grid-row: span 3; grid-template-rows: subgrid; gap: 0.5rem; padding: 1rem; border: 1px solid var(--rule); border-radius: var(--radius); }
  .panel__title { font-size: 1.125rem; }

  .board { container-type: inline-size; display: grid; grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr)); grid-auto-rows: minmax(5rem, auto); grid-auto-flow: dense; gap: var(--gap); margin-block-start: 1rem; }
  .tile { padding: 1rem; border: 1px solid var(--rule); border-radius: var(--radius); background: var(--surface); }
  .tile h3 { margin-block-end: 0.25rem; font-size: 1rem; }
  .chart { display: flex; align-items: flex-end; gap: 0.5rem; block-size: 7rem; margin-block-start: 0.5rem; }
  .chart span { flex: 1; block-size: var(--h); border-radius: 0.25rem 0.25rem 0 0; background: var(--accent); }

  @container (min-width: 21rem) {
    .tile--chart { grid-column: span 2; grid-row: span 2; }
    .tile--wide { grid-column: span 2; }
  }

  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr)); grid-auto-rows: 6rem; grid-auto-flow: dense; gap: var(--gap); margin-block-start: 1rem; }
  .gallery__item { display: grid; place-items: center; border-radius: var(--radius); background: hsl(var(--hue) 60% 85%); font-weight: 600; }
  .gallery__item--tall { grid-row: span 2; }
  .gallery__item--wide { grid-column: span 2; }
}`,
      { filename: "style.css", lineNumbers: true },
    ),
    h("Почему так"),
    ul(
      "**Каркас.** `grid-template-areas` описывает страницу словами: `header header / nav main / footer footer`. Строки `auto 1fr auto` растягивают среднюю на всё свободное место, поэтому подвал прижат к низу без дополнительных приёмов. Колонка основной области — `minmax(0, 1fr)`: так длинное содержимое не раздвигает сетку.",
      "**Именованные линии.** `[full-start] minmax(1rem, 1fr) [content-start] minmax(0, 60rem) [content-end] minmax(1rem, 1fr) [full-end]` — три колонки с четырьмя именами; `grid-column: content` занимает среднюю, `grid-column: full` — все три. Боковые поля не уже 1rem, поэтому на узком экране контент не прижимается к краю.",
      "**Подсетка в баннере.** `.hero` занимает `full` и сам становится сеткой с `grid-template-columns: subgrid`: он получает три колонки родителя вместе с их именами, поэтому дети встают в `content`. Фон баннера — на всю область, текст — по колонке контента.",
      "**Показатели.** `auto-fit` + `minmax(10rem, 1fr)`: сколько колонок помещается, столько и появляется, свободное место делится поровну; при четырёх карточках и широком экране получается ровно четыре колонки.",
      "**Панели на подсетке.** `.panels` задаёт колонки, а каждая `.panel` занимает три строки (`grid-row: span 3`) и берёт их себе (`grid-template-rows: subgrid`). Три строки родителя становятся дорожками «заголовок / текст / ссылка» для всех панелей строки, и самая высокая определяет высоту дорожки: заголовок из трёх строк тянет всю строку, а ссылки остаются на одной линии.",
      "**Доска.** `auto-fill` сохраняет размер плитки, `grid-auto-rows: minmax(5rem, auto)` даёт строкам минимальную высоту, `dense` закрывает дыры. Спаны включает `@container (min-width: 21rem)`: 21rem = две колонки по 10rem плюс зазор 1rem; на узкой доске (одна колонка) спаны не применяются, и лишняя неявная колонка не создаётся.",
      "**Галерея.** Те же `auto-fill` и `dense`, но строки фиксированные (`6rem`): «высокая» плитка занимает две строки, «широкая» — два столбца; `dense` заполняет освободившиеся ячейки следующими плитками.",
      "**Вес.** Самый тяжёлый селектор листа — (0,2,0), например `.app__main > .hero`; `float`, `position` и `!important` не используются.",
    ),
    h("Самопроверка"),
    p("Скрипт вставляется в консоль страницы. Он считает реальные дорожки по `getComputedStyle(...).gridTemplateColumns` (браузер возвращает размеры в пикселях), поэтому проверяет **результат раскладки**, а не только текст правил."),
    code(
      "js",
      `// check.js — самопроверка проекта «Панель управления на Grid»: вставьте в консоль страницы
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const rect = (el) => el.getBoundingClientRect();
  const cs = (el) => getComputedStyle(el);
  const near = (a, b, d = 2) => Math.abs(a - b) <= d;
  const tracks = (el, prop) => cs(el)[prop].split(" ").map(parseFloat).filter((v) => !Number.isNaN(v));    // реальные размеры дорожек в px
  const rem = parseFloat(cs(document.documentElement).fontSize);
  const root = document.documentElement;
  const checks = [];
  const add = (name, ok, detail) => checks.push({ проверка: name, итог: ok ? "OK" : "НЕТ", детали: detail });
  const walk = (rules, out = []) => { for (const r of rules) { if (r instanceof CSSStyleRule) out.push(r); else if (r.cssRules) walk(r.cssRules, out); } return out; };
  const rules = [...document.styleSheets].flatMap((s) => { try { return walk(s.cssRules); } catch { return []; } });
  const cssText = rules.map((r) => r.cssText).join("\\n");
  const splitTop = (s) => { const out = []; let d = 0, cur = ""; for (const ch of s) { if (ch === "(" || ch === "[") d++; if (ch === ")" || ch === "]") d--; if (ch === "," && d === 0) { out.push(cur.trim()); cur = ""; } else cur += ch; } return out.concat(cur.trim()); };
  const weight = (sel) => {
    const s = sel.replace(/:where\\([^)]*\\)/g, "").replace(/::?[\\w-]+(\\([^)]*\\))?/g, (m) => (m.startsWith("::") ? " x" : ".p"));
    return [(s.match(/#[\\w-]+/g) || []).length, (s.match(/\\.[\\w-]+|\\[[^\\]]*\\]/g) || []).length, (s.replace(/\\.[\\w-]+|\\[[^\\]]*\\]|#[\\w-]+/g, " ").match(/(^|[\\s>+~])[a-z][\\w-]*/gi) || []).length];
  };
  const wide = innerWidth >= 768;

  // 1. каркас на областях
  const app = $(".app"), ar = rect(app), hd = rect($(".app__header")), nv = rect($(".app__nav")), mn = rect($(".app__main")), ft = rect($(".app__footer"));
  add("Каркас: сетка с именованными областями", cs(app).display === "grid" && cs(app).gridTemplateAreas !== "none" && /header/.test(cs(app).gridTemplateAreas), "grid-template-areas: " + cs(app).gridTemplateAreas.replace(/"/g, "").trim().slice(0, 60));
  if (wide) add("Широкий экран: шапка и подвал на всю ширину, меню слева 14rem, основная область справа", near(hd.width, ar.width, 1) && near(ft.width, ar.width, 1) && near(nv.width, 14 * rem, 1) && mn.left >= nv.right - 1 && near(mn.top, nv.top, 1), "меню " + nv.width.toFixed(0) + "px, основная начинается с " + mn.left.toFixed(0));
  else add("Узкий экран: области идут столбцом", near(nv.width, ar.width, 1) && nv.top >= hd.bottom - 1 && mn.top >= nv.bottom - 1 && ft.top >= mn.bottom - 1, "меню " + nv.top.toFixed(0) + "–" + nv.bottom.toFixed(0) + ", основная с " + mn.top.toFixed(0));
  const kids = $$(".app__main > *"); kids.forEach((k) => { k.dataset.d = k.style.display; k.style.display = "none"; });
  const shortFooter = rect($(".app__footer")).bottom;
  kids.forEach((k) => { k.style.display = k.dataset.d; delete k.dataset.d; });
  add("Подвал прижат к низу окна при коротком содержимом", near(shortFooter, root.clientHeight, 1), "низ подвала " + shortFooter.toFixed(0) + " при высоте окна " + root.clientHeight);

  // 2. именованные линии: баннер на всю ширину, остальное в колонке контента
  const hero = rect($(".hero")), mainBox = rect($(".app__main"));
  const contentW = Math.min(60 * rem, mainBox.width - 2 * rem), contentLeft = mainBox.left + (mainBox.width - contentW) / 2;
  const heroText = rect($(".hero h1"));
  add("Баннер на всю ширину области, текст в колонке контента", near(hero.width, mainBox.width, 1) && near(heroText.left, contentLeft, 2), "баннер " + hero.width.toFixed(0) + " из " + mainBox.width.toFixed(0) + ", текст с " + heroText.left.toFixed(0) + " (ожидалось " + contentLeft.toFixed(0) + ")");
  const sections = [".stats", ".panels", ".board", ".gallery"].map((s) => rect($(s)));
  add("Остальные блоки выровнены по колонке контента", sections.every((r) => near(r.left, contentLeft, 2) && near(r.width, contentW, 2)), sections.map((r) => Math.round(r.left) + "+" + Math.round(r.width)).join(", "));

  // 3. показатели: auto-fit
  const statsEl = $(".stats"), stats = $$(".stat").map(rect), st = rect(statsEl), gap = parseFloat(cs(statsEl).columnGap);
  const rowTop = stats[0].top, firstRow = stats.filter((r) => near(r.top, rowTop, 1));
  const expectCols = Math.min(4, Math.max(1, Math.floor((st.width + gap) / (10 * rem + gap))));
  add("Показатели: колонки подбираются сами и заполняют строку", stats.every((r) => near(r.width, stats[0].width, 1)) && firstRow.length === expectCols && near(firstRow[firstRow.length - 1].right, st.right, 1), "в первой строке " + firstRow.length + " (ожидалось " + expectCols + "), ширина " + stats[0].width.toFixed(0));

  // 4. панели на подсетке: заголовки, тексты и ссылки выровнены по строкам
  const panels = $$(".panel"), pr = panels.map(rect);
  const rows = []; pr.forEach((r, i) => { const row = rows.find((g) => near(g.top, r.top, 1)); if (row) row.items.push(i); else rows.push({ top: r.top, items: [i] }); });
  const aligned = rows.every((g) => ["panel__title", "panel__body", "panel__link"].every((cls) => { const tops = g.items.map((i) => rect(panels[i].querySelector("." + cls)).top); return tops.every((t) => near(t, tops[0], 1)); }));
  add("Панели: заголовки, тексты и ссылки лежат на общих линиях (подсетка)", aligned && /grid-template-rows:\\s*subgrid/.test(cssText), "строк панелей: " + rows.length + ", выровнены: " + aligned);

  // 5. доска: растягивание на несколько дорожек
  const board = $(".board"), cols = tracks(board, "gridTemplateColumns"), bgap = parseFloat(cs(board).columnGap), rowGap = parseFloat(cs(board).rowGap);
  const chart = rect($(".tile--chart")), tileWide = rect($(".tile--wide")), tile1 = rect($(".tile:not(.tile--chart):not(.tile--wide)"));
  const rowsH = tracks(board, "gridTemplateRows");
  if (cols.length >= 2) add("Доска: график занимает 2×2 дорожки, широкие плитки — 2 колонки", near(chart.width, cols[0] * 2 + bgap, 2) && near(chart.height, rowsH[0] + rowGap + rowsH[1], 3) && near(tileWide.width, cols[0] * 2 + bgap, 2) && cs(board).gridAutoFlow.includes("dense"), "колонок " + cols.length + ", график " + chart.width.toFixed(0) + "×" + chart.height.toFixed(0) + ", dense: " + cs(board).gridAutoFlow.includes("dense"));
  else add("Доска: на узком экране — одна колонка без лишних дорожек", cols.length === 1 && near(chart.width, rect(board).width, 1) && near(tileWide.width, rect(board).width, 1), "колонок " + cols.length + ", плитки " + chart.width.toFixed(0) + " и " + tileWide.width.toFixed(0) + " при ширине " + rect(board).width.toFixed(0));

  // 6. галерея: dense без дыр
  const gal = $(".gallery"), gcols = tracks(gal, "gridTemplateColumns"), grow = tracks(gal, "gridTemplateRows"), ggap = parseFloat(cs(gal).columnGap);
  const items = $$(".gallery__item").map(rect), tall = rect($(".gallery__item--tall")), wideItem = rect($(".gallery__item--wide"));
  const cellsUsed = items.reduce((s, r) => s + Math.round((r.width + ggap) / (gcols[0] + ggap)) * Math.round((r.height + ggap) / (grow[0] + ggap)), 0);
  const holes = gcols.length * grow.length - cellsUsed;
  add("Галерея: плитки растянуты на 2 дорожки и плотно уложены (dense), дыр нет", near(tall.height, grow[0] * 2 + ggap, 2) && near(wideItem.width, gcols[0] * 2 + ggap, 2) && cs(gal).gridAutoFlow.includes("dense") && holes >= 0 && holes < gcols.length, "колонок " + gcols.length + ", строк " + grow.length + ", пустых ячеек: " + holes);

  // 7. возможности Grid и архитектура
  const features = { "области": /grid-template-areas/, "именованные линии": /\\[content-start\\]/, "auto-fit": /auto-fit/, "auto-fill": /auto-fill/, "minmax": /minmax\\(/, "dense": /dense/, "подсетка": /subgrid/ };
  const used = Object.entries(features).filter(([, re]) => re.test(cssText)).map(([n]) => n);
  add("Использованы все ключевые возможности Grid", used.length === Object.keys(features).length, used.join(", "));
  add("Нет float, flex-раскладки страницы, абсолютного позиционирования", !rules.some((r) => (r.style.float && r.style.float !== "none") || r.style.position === "absolute" || r.style.position === "fixed"), "float / absolute не найдены");
  const imp = rules.filter((r) => /!important/.test(r.cssText)).length, ids = rules.filter((r) => /#[\\w-]+/.test(r.selectorText)).length;
  const max = rules.reduce((m, r) => { const w = splitTop(r.selectorText).map(weight).sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]; return (w[0] - m[0] || w[1] - m[1] || w[2] - m[2]) > 0 ? w : m; }, [0, 0, 0]);
  add("Нет !important и #id", imp === 0 && ids === 0, "!important: " + imp + ", правил с #id: " + ids);
  add("Специфичность не выше (0,2,0)", max[0] === 0 && (max[1] < 2 || (max[1] === 2 && max[2] === 0)), "(" + max.join(",") + ")");
  add("Стили в слоях @layer", [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r instanceof CSSLayerStatementRule || r instanceof CSSLayerBlockRule); } catch { return false; } }), "@layer");
  add("Есть заметный :focus-visible", rules.some((r) => /:focus-visible/.test(r.selectorText) && parseFloat(r.style.outlineWidth || (r.style.outline.match(/(\\d+)px/) || [])[1]) >= 2), ":focus-visible { outline }");
  add("Нет горизонтальной прокрутки", root.scrollWidth <= root.clientWidth, "scrollWidth " + root.scrollWidth + ", clientWidth " + root.clientWidth + " (" + innerWidth + " px)");

  console.table(checks);
  return checks.every((c) => c.итог === "OK");
})();`,
      { filename: "check.js", lineNumbers: true, collapsed: true },
    ),
    h("Результаты проверки решения"),
    table(
      ["Что проверялось", "Результат"],
      [
        ["Самопроверка на ширинах 320, 360, 400, 480, 560, 700, 768, 900, 1024, 1100, 1280, 1440px", "все 16 проверок — OK"],
        ["Та же страница без `style.css`", "4 из 16 проверок проходят"],
        ["Без подсетки у панелей", "15 из 16 на 1280px: три панели в одной строке, заголовки не выровнены"],
        ["Спаны доски без запроса к контейнеру (`@container (min-width: 0rem)`)", "13 из 16 на 320px: две колонки вместо одной, график 298×178"],
        ["`repeat(4, 1fr)` вместо `auto-fit` у показателей", "13 из 16 на 320px: четыре колонки по 93px"],
        ["Без `dense` у галереи", "15 из 16: 5 пустых ячеек на 1280px, 1 — на 320px"],
        ["Баннер без `grid-column: full`", "15 из 16: 960px вместо 1041px на 1280px, 273px вместо 305px на 320px"],
        ["Без `grid-template-areas` на узком экране", "15 из 16 на 320px: меню растянулось на 3314px"],
        ["`stylelint` (`selector-max-id: 0`, `declaration-no-important: true`, `selector-max-specificity: \"0,2,0\"`, `selector-max-compound-selectors: 3`)", "0 нарушений"],
        ["Отчёт по весам (скрипт из темы об управлении специфичностью)", "42 правила, 0 с `#id`, 0 `!important`, максимум (0,2,0) — `.app__main > .hero`; единственное внеслойное правило — `:root`"],
      ],
      "Проверка эталона",
    ),
    warn("`dense` меняет визуальный порядок плиток относительно DOM: клавиатурный фокус и чтение скринридером идут по DOM. Для галереи это допустимо, для списка шагов или таблицы — нет."),
    tip("Когда раскладка «ведёт себя странно», включите в DevTools панель Layout → Grid: она рисует линии, их номера и имена областей — часто причина видна сразу."),
  ],
};
