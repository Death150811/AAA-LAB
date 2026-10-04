import type { Project } from "../../types";
import { code, h, note, p, table, tip, ul, warn } from "../../dsl";

export const p01ReadableArticle: Project = {
  id: "css.p01-readable-article",
  domain: "css",
  order: 1,
  title: "Читаемая статья",
  subtitle: "Типографика, цвет, блочная модель и вертикальный ритм: превратите «голый» HTML в журнальную страницу, не меняя разметку, — и докажите результат автоматической самопроверкой.",
  level: "foundation",
  estimatedHours: 6,
  buildsOn: [],
  topics: [
    "css.how-css-works",
    "css.selectors",
    "css.cascade",
    "css.specificity",
    "css.units-math",
    "css.colors",
    "css.box-model",
    "css.margin-collapsing",
    "css.typography",
    "css.overflow-sizing",
    "css.organizing-css",
  ],
  objective:
    "Написать **один файл `style.css`**, который делает длинную статью удобной для чтения на экранах от 320 до 1280 пикселей: выдержанная **шкала размеров**, колонка шириной в знаках, **контраст не ниже 4.5:1**, единый **ритм отступов**, аккуратные цитата, код и таблица — при низкой специфичности, слоях и переменных вместо «магических» чисел.",
  scenario: [
    p("Редакция журнала «Метроном» публикует статьи в виде «голого» HTML. В окне шириной 1280 пикселей ширина строки — около **156 `ch`** (измерено в Chromium), заголовок занимает пол-экрана, цитата неотличима от текста, а широкая таблица на телефоне раздвигает всю страницу. Автор вёрстки уволился, остался один файл разметки."),
    p("Ваша задача — написать `style.css` для страницы ниже. **Разметку менять нельзя**: допускается только добавить `<link rel=\"stylesheet\" href=\"style.css\">` в `<head>` (в примере он уже есть). Классы, которые вы можете использовать, уже расставлены."),
    code(
      "html",
      `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Как устроен вертикальный ритм — Метроном</title>
<link rel="stylesheet" href="style.css">
<body>
<header class="site-header">
  <a class="logo" href="/">Метроном</a>
  <nav aria-label="Основная">
    <ul>
      <li><a href="/">Журнал</a></li>
      <li><a href="/archive">Архив</a></li>
      <li><a href="/about">О нас</a></li>
    </ul>
  </nav>
</header>

<main>
  <article class="article">
    <header>
      <p class="kicker">Типографика</p>
      <h1>Как устроен вертикальный ритм</h1>
      <p class="meta">Анна Фролова · <time datetime="2026-02-12">12 февраля 2026</time> · 7 минут чтения</p>
    </header>

    <p class="lead">Ритм текста — это повторяемость расстояний: между строками, абзацами и заголовками. Когда он выдержан, страница читается спокойно, даже если читатель не может объяснить почему.</p>

    <h2>Базовая линия</h2>
    <p>Всё начинается с высоты строки основного текста. Если взять <code>line-height</code> в полтора раза больше размера шрифта, каждая строка занимает предсказуемое место, и остальные отступы удобно считать в таких же единицах. Подробности о единицах длины есть в <a href="/units">разборе единиц измерения</a>.</p>
    <p>Длина строки влияет на чтение не меньше. Слишком короткие строки заставляют глаз прыгать, слишком длинные — теряют начало следующей строки. Принято считать удобной ширину примерно от сорока пяти до семидесяти пяти знаков, поэтому колонку ограничивают единицей <code>ch</code>, а не пикселями.</p>

    <blockquote>
      <p>Хорошая типографика незаметна: читатель думает о тексте, а не о шрифте.</p>
      <footer>— из заметок редактора</footer>
    </blockquote>

    <h2>Шкала размеров</h2>
    <p>Заголовки подбирают по шкале, где каждый шаг больше предыдущего в одно и то же число раз. Так размеры связаны между собой, а страница выглядит цельной.</p>
    <ul>
      <li>основной текст — <code>1rem</code>;</li>
      <li>подзаголовок третьего уровня — один шаг шкалы;</li>
      <li>подзаголовок второго уровня — два шага;</li>
      <li>главный заголовок — три шага, но не больше, чем помещается на узком экране.</li>
    </ul>

    <figure>
      <pre><code>:root {
  --step-0: 1rem;
  --step-1: 1.25rem;
  --step-2: 1.5625rem;
}

.article { max-inline-size: 65ch; }</code></pre>
      <figcaption>Размеры шкалы и ширина колонки хранятся в переменных и в одном правиле.</figcaption>
    </figure>

    <h3>Сравнение вариантов</h3>
    <div class="table-wrap">
      <table>
        <caption>Варианты межстрочного интервала для основного текста</caption>
        <thead>
          <tr><th scope="col">Вариант</th><th scope="col">Значение</th><th scope="col">Подходит для</th><th scope="col">Заметка</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row">Плотный</th><td>1.3</td><td>заголовков</td><td>Строки не расходятся</td></tr>
          <tr><th scope="row">Обычный</th><td>1.5</td><td>длинного текста</td><td>Удобно на мобильных</td></tr>
          <tr><th scope="row">Свободный</th><td>1.7</td><td>крупного шрифта</td><td>Для длинной строки</td></tr>
          <tr><th scope="row">Двойной</th><td>2.0</td><td>рукописей</td><td>Для редактуры</td></tr>
        </tbody>
      </table>
    </div>

    <h2>Итоги</h2>
    <p>Ритм создаёт не одно правило, а договорённость: одна базовая строка, одна шкала размеров, одна ширина колонки. Всё остальное выводится из них.</p>
    <ol>
      <li>Задайте высоту строки и размер основного текста.</li>
      <li>Ограничьте колонку в знаках, а не в пикселях.</li>
      <li>Выведите размеры заголовков и отступы из шкалы.</li>
    </ol>
  </article>
</main>

<footer class="site-footer">
  <p>© 2026 Метроном. Все материалы приведены в учебных целях.</p>
</footer>
</body>
</html>`,
      { filename: "article.html", lineNumbers: true, collapsed: true },
    ),
    note("Проект рассчитан на стандартный режим документа: в разметке есть `<!doctype html>`. Без него браузер перейдёт в режим совместимости, и часть значений будет вести себя иначе (см. тему об отладке CSS)."),
  ],
  requirements: [
    "Один файл `style.css`; HTML не изменяется (кроме подключения таблицы стилей).",
    "Базовая типографика: основной текст **не меньше 16px**, `line-height` абзаца **не меньше 1.5**; три семейства шрифтов в переменных — для текста, для интерфейса (заголовки, подписи, меню) и для кода (моноширинный стек).",
    "Колонка статьи ограничена **в знаках** (`ch`), центрирована логическими свойствами (`margin-inline: auto`); в среднем строка абзаца — от 45 до 80 знаков, если экран позволяет.",
    "Шкала размеров на переменных `--step-0 … --step-3` с отношением соседних шагов **не меньше 1.1**; размер `h1` — через `clamp()`, чтобы на 320px заголовок не занимал экран.",
    "Размеры шрифта — в `rem`/`em`; значения в пикселях в `font-size` и сокращённой записи `font` не допускаются.",
    "Цвета — в переменных; **контраст не ниже 4.5:1** у основного текста, ссылок, `.meta`, `.kicker`, подписи, автора цитаты, подвала и кода.",
    "Ссылки в тексте подчёркнуты и имеют состояния `:visited`, `:hover` и заметный `:focus-visible` (обводка не тоньше 2px).",
    "Ритм отступов задан одним правилом «потока» (`.article > * + *`), а не `margin-top` у каждого абзаца; заголовки отделяются сильнее, чем абзацы.",
    "Цитата выделена линией в начале строки; блок кода прокручивается по горизонтали, а не раздвигает страницу; подпись рисунка приглушена.",
    "Таблица: подпись `caption` выделена, шапка отделена линией, строки чередуются по фону; в обёртке `.table-wrap` — горизонтальная прокрутка на узких экранах, но **без прокрутки на экранах шире 900px**.",
    "Архитектура: порядок слоёв `@layer reset, base, layout, components;`, переменные в `:root`, **ни одного `!important` и `#id`**, специфичность селекторов **не выше (0,2,0)**.",
    "Страница не прокручивается по горизонтали ни на одной ширине от 320 до 1280px.",
  ],
  constraints: [
    "Без JavaScript, фреймворков, препроцессоров и внешних шрифтов; допустимы только системные стеки.",
    "Не использовать `!important`, идентификаторы в селекторах и инлайновые стили.",
    "Не задавать `margin-top` у каждого абзаца: ритм создаёт один селектор потока.",
    "Не использовать пиксели для размеров шрифта; единицы длины для колонки — `ch`, для отступов — `rem`.",
    "Не прятать переполнение через `overflow-x: hidden` на `html` или `body`.",
    "Цвета — только в `:root` как переменные; в правилах компонентов — `var(--…)`.",
  ],
  expected: [
    "В окне 1280px статья — спокойная колонка в 50–60 знаков в строке, заголовки заметно крупнее текста, но не «кричат».",
    "На телефоне (320px) заголовок аккуратно переносится, текст читается без масштабирования, таблица прокручивается внутри своей обёртки, а страница по горизонтали — нет.",
    "Ссылки видны без наведения, посещённые отличаются цветом, при навигации клавиатурой фокус хорошо заметен.",
    "Цитата, код, подпись и таблица узнаваемы и согласованы по цветам и отступам.",
    "Самопроверка в консоли печатает таблицу из 21 проверки, и все они проходят на ширинах 320, 768 и 1280 пикселей.",
  ],
  technical: [
    "Структура файла: `@layer` (порядок) → `:root` (переменные) → слои `reset`, `base`, `layout`, `components`.",
    "Шкала: `--step-0: 1rem`, `--step-1: 1.25rem`, `--step-2: 1.5625rem` (множитель 1.25), `--step-3: clamp(1.953rem, 1.5rem + 2vw, 2.75rem)`.",
    "Колонка: `max-inline-size: 65ch`; боковые поля — `padding-inline: var(--gutter)` с `clamp()`.",
    "Контраст считайте по формуле WCAG (скрипт из темы о дизайн-токенах) или в панели DevTools; запас — не меньше 4.5.",
    "Проверки: самопроверка `check.js` (из решения) на ширинах 320, 768 и 1280; `stylelint` с правилами `selector-max-id: 0`, `declaration-no-important: true`, `selector-max-specificity: \"0,2,0\"`.",
    "Режим экрана: устройство 320px — в панели Device Toolbar; для проверки горизонтальной прокрутки сравните `scrollWidth` и `clientWidth` корня.",
  ],
  acceptance: [
    "Самопроверка `check.js`: все 21 проверка в статусе OK на ширинах 320, 768 и 1280px.",
    "Размер основного текста ≥ 16px, `line-height` абзаца ≥ 1.5, колонка задана в `ch`.",
    "Размеры `h1` > `h2` > `h3` > текст с шагом не меньше 1.1; `h1` использует `clamp()`.",
    "Во всех ролях (текст, ссылка, `.meta`, `.kicker`, подпись, автор цитаты, подвал, код) контраст ≥ 4.5:1.",
    "У ссылок есть подчёркивание, `:visited`, `:hover`, `:focus-visible` с обводкой ≥ 2px.",
    "Таблица: прокручивается в обёртке на узком экране и помещается целиком на широком (≥ 900px); строки чередуются; `caption` выделена.",
    "`stylelint` с бюджетом `0,2,0` не находит нарушений; в файле нет `!important` и `#id`; слои объявлены в первой строке.",
    "Нет горизонтальной прокрутки страницы: `scrollWidth ≤ clientWidth` на 320, 768 и 1280px.",
  ],
  hints: [
    "Начните со слоёв и переменных: сначала `@layer …;`, затем `:root` со шкалой, цветами, шрифтами и `--gutter`. Только потом правила.",
    "Для колонки используйте `max-inline-size: 65ch` на `.article` и `margin-inline: auto`; не задавайте ширину в пикселях.",
    "Ритм: `.article > * + * { margin-block-start: var(--flow) }` даёт одинаковый интервал между всеми соседними блоками; заголовкам добавьте больше через `.article > h2`.",
    "Сокращённая запись `font: 1rem / 1.6 var(--font-text)` задаёт размер, интервал и семейство сразу; не забывайте, что `font` сбрасывает остальные подсвойства шрифта.",
    "Контраст приглушённого текста проверяйте отдельно: `#7a7782` на светлом фоне даёт 4.27 (мало), `#55535c` — 7.36.",
    "Таблицу делайте шире обёртки через `min-inline-size`, а прокрутку включайте на `.table-wrap` (`overflow-x: auto`): так прокручивается только она.",
    "`:focus-visible` задайте один раз на всём документе, чтобы не пропустить ни один интерактивный элемент.",
  ],
  advanced: [
    "Добавьте тёмную тему через `prefers-color-scheme` и переопределение переменных; проверьте контраст пар заново.",
    "Сделайте шкалу плавной: все шаги через `clamp()` с интерполяцией между 320 и 1280px.",
    "Подготовьте печатную версию (`@media print`): убрать шапку и подвал, показать адреса ссылок, не разрывать таблицу.",
    "Добавьте `text-wrap: pretty` для абзацев и `hanging-punctuation` там, где он поддерживается; проверьте через `CSS.supports`.",
    "Напишите тест Playwright, который запускает `check.js` на трёх ширинах и падает при любой НЕТ.",
  ],
  failureModes: [
    "**Размеры шрифта в пикселях:** масштаб, выбранный пользователем в браузере, перестаёт работать.",
    "**`margin-top` у каждого абзаца:** отступы растут хаотично, появляются «двойные» интервалы; ритм ломается при вставке нового блока.",
    "**Колонка в пикселях:** на большом мониторе строка снова длиннее 100 знаков, на телефоне — горизонтальная прокрутка.",
    "**Серый текст «для красоты»:** контраст 4.27:1 и ниже; на солнце читать невозможно.",
    "**`outline: none` вместо `:focus-visible`:** клавиатурный пользователь теряет фокус.",
    "**Таблица раздвигает страницу:** нет обёртки с `overflow-x: auto`, а `overflow-x: hidden` на `body` лишь прячет проблему.",
    "**Победа весом:** `#article p` и `!important` ради одного абзаца — следующий разработчик вынужден повышать вес снова.",
  ],
  rubric: [
    { criterion: "Типографика и шкала", weight: 25, description: "Размер и интервал основного текста, шкала на переменных, `clamp()` для `h1`, три семейства шрифтов, единицы `rem`/`ch`." },
    { criterion: "Цвет, контраст и состояния ссылок", weight: 15, description: "Цвета в переменных, контраст ≥ 4.5:1 во всех ролях, подчёркивание, `:visited`, `:hover`, `:focus-visible`." },
    { criterion: "Блочная модель и ритм", weight: 20, description: "Один поток отступов, иерархия расстояний, логические свойства, `box-sizing`, колонка в `ch`, поля через `clamp()`." },
    { criterion: "Компоненты", weight: 15, description: "Цитата, код с прокруткой, подпись рисунка, списки, таблица: подпись, шапка, зебра, прокрутка в обёртке." },
    { criterion: "Архитектура CSS", weight: 15, description: "Слои, переменные в `:root`, нет `!important` и `#id`, специфичность ≤ (0,2,0), понятные имена." },
    { criterion: "Адаптивность и доступность", weight: 10, description: "Нет горизонтальной прокрутки на 320–1280px, масштабирование текста, заметный фокус, читаемость при увеличении." },
  ],
  solution: [
    p("Эталон — один файл. Он проходит самопроверку на ширинах 320, 768 и 1280 пикселей; без стилей та же страница проходит лишь 9 из 21 проверки."),
    h("style.css"),
    code(
      "css",
      `@layer reset, base, layout, components;

:root {
  --font-text: Georgia, "Times New Roman", serif;
  --font-ui: system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Consolas, monospace;

  --step-0: 1rem;
  --step-1: 1.25rem;
  --step-2: 1.5625rem;
  --step-3: clamp(1.953rem, 1.5rem + 2vw, 2.75rem);

  --ink: #1b1b1f;
  --paper: #fdfcf8;
  --muted: #55535c;
  --accent: #2f3d9a;
  --accent-visited: #6a2a8c;
  --rule: #d9d6cf;
  --code-bg: #f1efe8;

  --flow: 1rem;
  --gutter: clamp(1rem, 4vw, 2rem);
}

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  body, h1, h2, h3, p, ul, ol, figure, blockquote { margin: 0; }
}

@layer base {
  body { font: var(--step-0) / 1.6 var(--font-text); color: var(--ink); background: var(--paper); }
  a { color: var(--accent); text-underline-offset: 0.15em; }
  a:visited { color: var(--accent-visited); }
  a:hover { text-decoration-thickness: 0.15em; }
  :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  h1, h2, h3 { font-family: var(--font-ui); line-height: 1.25; text-wrap: balance; }
  h1 { font-size: var(--step-3); }
  h2 { font-size: var(--step-2); }
  h3 { font-size: var(--step-1); }
  code, pre { font-family: var(--font-mono); font-size: 0.9em; }
}

@layer layout {
  .site-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem 1.5rem; padding: 1rem var(--gutter); border-block-end: 1px solid var(--rule); }
  .site-header ul { display: flex; gap: 1.25rem; margin: 0; padding: 0; list-style: none; }
  .article { max-inline-size: 65ch; margin-inline: auto; padding: 2rem var(--gutter) 3rem; }
  .article > * + * { margin-block-start: var(--flow); }
  .article > h2 { margin-block-start: 2.5rem; }
  .article > h3 { margin-block-start: 2rem; }
  .site-footer { padding: 1.5rem var(--gutter); border-block-start: 1px solid var(--rule); color: var(--muted); font: 0.875rem / 1.5 var(--font-ui); }
}

@layer components {
  .logo { font: 700 1.25rem / 1 var(--font-ui); color: var(--ink); text-decoration: none; }
  .kicker { font: 600 0.875rem / 1.4 var(--font-ui); letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
  .meta { font: 0.875rem / 1.5 var(--font-ui); color: var(--muted); }
  .lead { font-size: var(--step-1); line-height: 1.5; }
  .article ul, .article ol { padding-inline-start: 1.5rem; }
  .article li + li { margin-block-start: 0.375rem; }

  blockquote { padding-inline-start: 1rem; border-inline-start: 4px solid var(--accent); font-style: italic; }
  blockquote footer { margin-block-start: 0.5rem; font: normal 0.875rem / 1.5 var(--font-ui); color: var(--muted); }

  pre { overflow-x: auto; padding: 1rem; border-radius: 0.375rem; background: var(--code-bg); line-height: 1.5; }
  figcaption { margin-block-start: 0.5rem; font: 0.875rem / 1.5 var(--font-ui); color: var(--muted); }

  .table-wrap { overflow-x: auto; }
  table { inline-size: 100%; min-inline-size: 28rem; border-collapse: collapse; font: 0.875rem / 1.4 var(--font-ui); }
  caption { padding-block-end: 0.5rem; font-weight: 600; text-align: start; }
  th, td { padding: 0.5rem 0.625rem; border-block-end: 1px solid var(--rule); text-align: start; }
  thead th { border-block-end: 2px solid var(--ink); }
  tbody tr:nth-child(even) { background: var(--code-bg); }
}`,
      { filename: "style.css", lineNumbers: true },
    ),
    h("Почему так"),
    ul(
      "**Слои и переменные.** `@layer reset, base, layout, components;` задаёт порядок раз и навсегда, а правила внутри слоёв остаются простыми: самый тяжёлый селектор — `.article li + li` (0,1,2). Все цвета и размеры — в `:root`.",
      "**Шкала.** Шаги 1 → 1.25 → 1.5625 rem — отношение 1.25; `h1` через `clamp(1.953rem, 1.5rem + 2vw, 2.75rem)` на 320px равен 31.2px, на 768px — 39.4px, на 1280px — 44px (замер).",
      "**Колонка.** `max-inline-size: 65ch` включает боковые поля, поэтому колонка текста — около 57 `ch`, а в среднем строка абзаца — около 50 знаков (замер на 768 и 1280px). На 320px колонка 34 `ch` и в строке около 29 знаков — это ограничение экрана, поэтому проверка на узких окнах не требует 45 знаков.",
      "**Контраст (замер по формуле WCAG).** Основной текст `#1b1b1f` на `#fdfcf8` — 16.72:1; приглушённый `#55535c` — 7.36:1; ссылка `#2f3d9a` — 9.07:1; посещённая `#6a2a8c` — 8.81:1; код на `#f1efe8` — 14.92:1.",
      "**Ритм.** `.article > * + *` задаёт общий интервал `--flow`, а заголовкам добавлено больше (`2.5rem` и `2rem`): абзацы объединены в группы, разделы заметны.",
      "**Таблица.** `min-inline-size: 28rem` и `overflow-x: auto` у `.table-wrap`: на 320px таблица (448px) прокручивается внутри обёртки (273px), на 768 и 1280px помещается целиком (456px).",
      "**Фокус.** Один общий `:focus-visible` с обводкой 3px и отступом 2px — видимый индикатор для всех ссылок и других интерактивных элементов.",
    ),
    h("Самопроверка"),
    p("Скрипт вставляется в консоль страницы. Он считает контраст по формуле WCAG, определяет эффективный фон, разбирает правила таблицы стилей и печатает таблицу из 21 проверки."),
    code(
      "js",
      `// check.js — самопроверка проекта «Читаемая статья»: вставьте в консоль страницы
(() => {
  // --- вспомогательные функции ---
  const rgb = (s) => s.match(/[\\d.]+/g).slice(0, 3).map(Number);
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (!/rgba?\\(.*,\\s*0\\)$|transparent/.test(c)) return rgb(c); } return [255, 255, 255]; };
  const walk = (rules, out = []) => { for (const r of rules) { if (r.cssRules && !(r instanceof CSSStyleRule)) walk(r.cssRules, out); else if (r instanceof CSSStyleRule) out.push(r); } return out; };
  const rules = [...document.styleSheets].flatMap((s) => { try { return walk(s.cssRules); } catch { return []; } });
  const weight = (sel) => {                                    // упрощённая специфичность: (a, b, c)
    const s = sel.replace(/:where\\([^)]*\\)/g, "").replace(/::?[\\w-]+(\\([^)]*\\))?/g, (m) => (m.startsWith("::") ? " x" : m.startsWith(":where") ? "" : ".p"));
    return [(s.match(/#[\\w-]+/g) || []).length, (s.match(/\\.[\\w-]+|\\[[^\\]]*\\]/g) || []).length, (s.replace(/\\.[\\w-]+|\\[[^\\]]*\\]|#[\\w-]+/g, " ").match(/(^|[\\s>+~])[a-z][\\w-]*/gi) || []).length];
  };

  const checks = [];
  const add = (name, ok, detail) => checks.push({ проверка: name, итог: ok ? "OK" : "НЕТ", детали: detail });
  const $ = (s) => document.querySelector(s);
  const px = (v) => parseFloat(v);

  // 1. размер и межстрочный интервал
  const body = getComputedStyle(document.body);
  add("Размер основного текста не меньше 16px", px(body.fontSize) >= 16, body.fontSize);
  const p = $(".article p:not(.lead):not(.meta):not(.kicker)");
  const ratio = px(getComputedStyle(p).lineHeight) / px(getComputedStyle(p).fontSize);
  add("Межстрочный интервал абзаца не меньше 1.5", ratio >= 1.5, ratio.toFixed(2));

  // 2. длина строки в знаках (абзацы не короче трёх строк)
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;width:1ch";
  document.body.append(probe);
  const ch = probe.getBoundingClientRect().width;
  probe.remove();
  const counts = [...document.querySelectorAll(".article > p")].map((el) => {
    const lh = px(getComputedStyle(el).lineHeight), lines = Math.round(el.getBoundingClientRect().height / lh);
    return lines >= 3 ? el.textContent.trim().length / lines : null;
  }).filter(Boolean);
  const avg = counts.reduce((s, v) => s + v, 0) / (counts.length || 1);
  const columnCh = $(".article > p:nth-of-type(2)").getBoundingClientRect().width / ch;     // ширина колонки в знаках «0»
  add("Строка в среднем не длиннее 80 знаков и, если экран позволяет, не короче 45", counts.length > 0 && avg <= 80 && (avg >= 45 || columnCh < 55), avg.toFixed(0) + " знаков в среднем; колонка ≈ " + columnCh.toFixed(0) + "ch");
  add("Ширина колонки задана в ch", rules.some((r) => /^\\.article$/.test(r.selectorText) && /\\d+ch/.test(r.style.maxInlineSize || r.style.maxWidth)), "max-inline-size в ch");

  // 3. шкала размеров
  const fs = (sel) => px(getComputedStyle($(sel)).fontSize);
  const [h1, h2, h3, base] = [fs("h1"), fs("h2"), fs("h3"), fs(".article > p:nth-of-type(2)")];
  add("Размеры h1 > h2 > h3 > текст с шагом не меньше 1.1", h1 / h2 >= 1.1 && h2 / h3 >= 1.1 && h3 / base >= 1.1, [h1, h2, h3, base].map((v) => v.toFixed(1)).join(" > "));
  add("Размер h1 задан через clamp()", rules.some((r) => /clamp\\(/.test(r.style.fontSize || "") || (r.selectorText === ":root" && /--step-3:\\s*clamp\\(/.test(r.cssText))), "clamp()");
  add("В размерах шрифта нет px", !rules.some((r) => /px/.test(r.style.fontSize || "") && !/pre|code/.test(r.selectorText)) && !rules.some((r) => /font:[^;]*\\d+px/.test(r.cssText)), "font-size и font без px");

  // 4. контраст текста
  const pairs = [["основной текст", ".article > p:nth-of-type(2)"], ["ссылка", ".article p a"], [".meta", ".meta"], [".kicker", ".kicker"], ["подпись", "figcaption"], ["автор цитаты", "blockquote footer"], ["подвал", ".site-footer p"], ["код", "pre code"]];
  const low = pairs.map(([n, s]) => { const el = $(s); return [n, contrast(rgb(getComputedStyle(el).color), bgOf(el))]; }).filter(([, c]) => c < 4.5);
  add("Контраст текста не ниже 4.5:1 во всех ролях", low.length === 0, low.length ? low.map(([n, c]) => n + " " + c.toFixed(2)).join(", ") : "все пары ≥ 4.5");
  const visited = rules.some((r) => /:visited/.test(r.selectorText));
  add("Заданы :visited и :hover для ссылок", visited && rules.some((r) => /^a:hover/.test(r.selectorText)), "состояния ссылок");
  add("Ссылка в тексте подчёркнута", getComputedStyle($(".article p a")).textDecorationLine.includes("underline"), getComputedStyle($(".article p a")).textDecorationLine);
  add("Есть заметный :focus-visible (обводка не тоньше 2px)", rules.some((r) => /:focus-visible/.test(r.selectorText) && px(r.style.outlineWidth || (r.style.outline.match(/(\\d+)px/) || [])[1]) >= 2), ":focus-visible { outline }");

  // 5. компоненты
  const wrap = getComputedStyle($(".table-wrap"));
  add("Таблица в блоке с горизонтальной прокруткой", ["auto", "scroll"].includes(wrap.overflowX), "overflow-x: " + wrap.overflowX);
  const tw = $(".table-wrap");
  add("На широком экране таблица помещается без прокрутки", innerWidth < 900 || tw.scrollWidth <= tw.clientWidth, "scrollWidth " + tw.scrollWidth + ", clientWidth " + tw.clientWidth);
  const rowsBg = [...document.querySelectorAll("tbody tr")].map((r) => getComputedStyle(r).backgroundColor);
  add("Строки таблицы чередуются по фону", rowsBg[0] !== rowsBg[1], rowsBg.slice(0, 2).join(" / "));
  add("Подпись таблицы выделена", px(getComputedStyle($("caption")).fontWeight) >= 600, "font-weight " + getComputedStyle($("caption")).fontWeight);
  const pre = getComputedStyle($("pre"));
  add("Код с прокруткой и моноширинным шрифтом", pre.overflowX === "auto" && /mono|Consolas|Courier/i.test(pre.fontFamily), pre.overflowX + ", " + pre.fontFamily.split(",")[0]);
  const bq = getComputedStyle($("blockquote"));
  add("Цитата выделена линией", px(bq.borderInlineStartWidth) >= 2, bq.borderInlineStartWidth);

  // 6. архитектура
  const imp = rules.filter((r) => /!important/.test(r.cssText)).length;
  const ids = rules.filter((r) => /#[\\w-]+/.test(r.selectorText)).length;
  const max = rules.reduce((m, r) => { const w = weight(r.selectorText.split(",").map((s) => s.trim()).sort((a, b) => weight(b)[1] - weight(a)[1])[0]); return (w[0] - m[0] || w[1] - m[1] || w[2] - m[2]) > 0 ? w : m; }, [0, 0, 0]);
  add("Нет !important и #id", imp === 0 && ids === 0, "!important: " + imp + ", правил с #id: " + ids);
  add("Специфичность не выше (0,2,0)", max[0] === 0 && (max[1] < 2 || (max[1] === 2 && max[2] === 0)), "(" + max.join(",") + ")");
  add("Стили в слоях @layer", rules.length > 0 && !!document.styleSheets[0] && [...document.styleSheets[0].cssRules].some((r) => r instanceof CSSLayerStatementRule || r instanceof CSSLayerBlockRule), "@layer");

  // 7. страница не прокручивается по горизонтали
  const root = document.documentElement;
  add("Нет горизонтальной прокрутки на текущей ширине", root.scrollWidth <= root.clientWidth, "scrollWidth " + root.scrollWidth + ", clientWidth " + root.clientWidth + " (" + innerWidth + " px)");

  console.table(checks);
  return checks.every((c) => c.итог === "OK");
})();`,
      { filename: "check.js", lineNumbers: true, collapsed: true },
    ),
    h("Результаты проверки решения"),
    table(
      ["Что проверялось", "Результат"],
      [
        ["Самопроверка на 320, 768 и 1280px", "все 21 проверка — OK"],
        ["Та же страница без `style.css`", "9 из 21 проверок проходят, остальные — НЕТ"],
        ["`stylelint` (`selector-max-id: 0`, `declaration-no-important: true`, `selector-max-specificity: \"0,2,0\"`, `selector-max-compound-selectors: 3`)", "0 нарушений"],
        ["Отчёт по весам (скрипт из темы об управлении специфичностью)", "36 правил, 0 с `#id`, 0 `!important`, максимум (0,1,2), единственное внеслойное правило — `:root` с переменными"],
        ["Размер `h1` на 320 / 768 / 1280px", "31.2 / 39.4 / 44 px"],
        ["Таблица: `scrollWidth` / `clientWidth` обёртки на 320 / 768 / 1280px", "448 / 273, 459 / 459, 456 / 456"],
      ],
      "Проверка эталона",
    ),
    warn("Самопроверка — не замена глазам: она не оценит гармонию, пропорции и «воздух». Откройте страницу, прочитайте абзац вслух и посмотрите на неё в разных окнах."),
    tip("Когда всё готово, уберите `style.css` и посмотрите на «голую» страницу ещё раз: разница — это ваша работа."),
  ],
};
