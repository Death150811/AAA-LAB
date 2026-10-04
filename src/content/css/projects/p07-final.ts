import type { Project } from "../../types";
import { code, h, note, p, table, tip, ul, warn } from "../../dsl";

export const p07Final: Project = {
  id: "css.p07-final",
  domain: "css",
  order: 7,
  title: "Итоговый проект: сайт студии на чистом CSS",
  subtitle: "Дизайн-система на токенах и слоях, темы, адаптивность на формулах, Grid и Flexbox, движение только на transform и opacity с уважением к reduced motion, бюджет производительности и 24 автоматические проверки на семи ширинах при двух системных темах.",
  level: "mastery",
  estimatedHours: 20,
  isFinal: true,
  buildsOn: [
    "css.p01-readable-article",
    "css.p02-interface-layers",
    "css.p03-flex-components",
    "css.p04-grid-dashboard",
    "css.p05-responsive-landing",
    "css.p06-design-system",
  ],
  topics: [
    "css.cascade",
    "css.specificity-management",
    "css.cascade-layers",
    "css.custom-properties",
    "css.design-tokens",
    "css.is-where-has",
    "css.nesting-modern",
    "css.logical-properties",
    "css.media-queries",
    "css.fluid-typography-spacing",
    "css.container-queries",
    "css.responsive-media",
    "css.grid-responsive",
    "css.flexbox-patterns",
    "css.transitions",
    "css.keyframes",
    "css.animation-performance-motion",
    "css.rendering-pipeline",
    "css.css-performance",
    "css.debugging-css",
  ],
  objective:
    "Собрать **одностраничный сайт студии «Верста» на одном CSS-файле**, в котором работают все приёмы курса сразу: слои и три уровня токенов, светлая и тёмная темы без JavaScript, **плавные размеры по формуле**, сетки на `auto-fit` с `min()`, компонент на запросе к контейнеру, движение **только на `transform` и `opacity`** (включая прокручиваемые анимации `view()`) с отключением по `prefers-reduced-motion`, `content-visibility` для секций ниже первого экрана, бюджет **6 КБ gzip**, нулевой сдвиг раскладки и печатная версия. Результат проверяется **24 автоматическими проверками на 7 ширинах при светлой и тёмной системных темах** — это 14 прогонов одной командой.",
  scenario: [
    p("Студия «Верста» делает сайты и дизайн-системы, а собственный сайт у неё — устаревший: стили лежат в трёх файлах с `!important`, тёмной темы нет, анимации двигают `margin`, а на телефоне при увеличенном шрифте страница прокручивается вбок. Руководитель просит показать, что студия умеет то, что продаёт: новый сайт без единой строки JavaScript и без внешних зависимостей, с измеримым качеством."),
    p("Разметка готова и менять её нельзя. Вам нужно написать единственный `style.css`, который собирает из неё **шесть секций** (герой, услуги, работы, тарифы, вопросы, контакты), шапку с переключателем темы и подвал. Критерии приёмки — не вкусовые, а проверяемые: каждый из них закрыт автоматической проверкой, которую вы запускаете сами."),
    code(
      "html",
      `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Студия «Верста» — сайты и интерфейсы</title>
<link rel="stylesheet" href="style.css">
<body>
<a class="skip-link" href="#content">Перейти к содержимому</a>

<header class="site-header">
  <a class="logo" href="#top">Верста</a>
  <nav class="site-nav" aria-label="Основная">
    <ul>
      <li><a href="#services">Услуги</a></li>
      <li><a href="#work">Работы</a></li>
      <li><a href="#pricing">Тарифы</a></li>
      <li><a href="#faq">Вопросы</a></li>
      <li><a href="#contact">Контакты</a></li>
    </ul>
  </nav>
  <fieldset class="theme-switch">
    <legend class="visually-hidden">Тема оформления</legend>
    <label><input type="radio" name="theme" value="auto" checked> Авто</label>
    <label><input type="radio" name="theme" value="light"> Светлая</label>
    <label><input type="radio" name="theme" value="dark"> Тёмная</label>
  </fieldset>
</header>

<main id="content">
  <section class="hero" id="top">
    <div class="hero__text">
      <p class="eyebrow">Студия интерфейсов</p>
      <h1>Сайты, которые быстро загружаются и приятно читаются</h1>
      <p>Мы проектируем и верстаем интерфейсы без лишнего кода: чистый CSS, доступность и скорость — по умолчанию.</p>
      <p><a class="button" href="#contact">Обсудить проект</a></p>
    </div>
    <img class="hero__img" src="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22900%22%20height=%22600%22%20viewBox=%220%200%20900%20600%22%3E%3Crect%20width=%22900%22%20height=%22600%22%20fill=%22hsl%28230%2055%25%2070%25%29%22/%3E%3Crect%20x=%22250%22%20y=%22150%22%20width=%22400%22%20height=%22300%22%20rx=%2224%22%20fill=%22%23fff%22%20fill-opacity=%22.6%22/%3E%3C/svg%3E" alt="Абстрактная иллюстрация интерфейса" width="900" height="600">
  </section>

  <section class="section reveal" id="services" aria-labelledby="services-title">
    <h2 id="services-title">Услуги</h2>
    <ul class="services">
      <li class="service"><h3>Дизайн-системы</h3><p>Токены, темы и библиотека компонентов с проверкой контраста.</p></li>
      <li class="service"><h3>Адаптивная вёрстка</h3><p>От телефона до широкого монитора без горизонтальной прокрутки.</p></li>
      <li class="service"><h3>Доступность</h3><p>Клавиатура, масштаб текста, читаемость и корректные роли.</p></li>
      <li class="service"><h3>Производительность</h3><p>Быстрая первая отрисовка и минимальный CSS.</p></li>
      <li class="service"><h3>Анимация</h3><p>Движение, которое помогает, а не отвлекает, и отключается по просьбе.</p></li>
      <li class="service"><h3>Поддержка</h3><p>Рефакторинг старых стилей без регрессий и с доказательствами.</p></li>
    </ul>
  </section>

  <section class="section reveal" id="work" aria-labelledby="work-title">
    <h2 id="work-title">Работы</h2>
    <ul class="gallery">
      <li><figure><img src="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22900%22%20height=%22600%22%20viewBox=%220%200%20900%20600%22%3E%3Crect%20width=%22900%22%20height=%22600%22%20fill=%22hsl%28230%2055%25%2070%25%29%22/%3E%3Ccircle%20cx=%22450%22%20cy=%22300%22%20r=%22140%22%20fill=%22%23fff%22%20fill-opacity=%22.6%22/%3E%3C/svg%3E" alt="Интернет-магазин кофе" width="900" height="600" loading="lazy"><figcaption>Интернет-магазин кофе</figcaption></figure></li>
      <li><figure><img src="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22900%22%20height=%22600%22%20viewBox=%220%200%20900%20600%22%3E%3Crect%20width=%22900%22%20height=%22600%22%20fill=%22hsl%28170%2055%25%2070%25%29%22/%3E%3Crect%20x=%22250%22%20y=%22150%22%20width=%22400%22%20height=%22300%22%20rx=%2224%22%20fill=%22%23fff%22%20fill-opacity=%22.6%22/%3E%3C/svg%3E" alt="Панель аналитики" width="900" height="600" loading="lazy"><figcaption>Панель аналитики</figcaption></figure></li>
      <li><figure><img src="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22900%22%20height=%22600%22%20viewBox=%220%200%20900%20600%22%3E%3Crect%20width=%22900%22%20height=%22600%22%20fill=%22hsl%2830%2055%25%2070%25%29%22/%3E%3Cpolygon%20points=%22450,120%20640,460%20260,460%22%20fill=%22%23fff%22%20fill-opacity=%22.6%22/%3E%3C/svg%3E" alt="Сайт фестиваля" width="900" height="600" loading="lazy"><figcaption>Сайт фестиваля</figcaption></figure></li>
      <li><figure><img src="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22900%22%20height=%22600%22%20viewBox=%220%200%20900%20600%22%3E%3Crect%20width=%22900%22%20height=%22600%22%20fill=%22hsl%28300%2055%25%2070%25%29%22/%3E%3Ccircle%20cx=%22450%22%20cy=%22300%22%20r=%22140%22%20fill=%22%23fff%22%20fill-opacity=%22.6%22/%3E%3C/svg%3E" alt="Мобильное приложение доставки" width="900" height="600" loading="lazy"><figcaption>Мобильное приложение</figcaption></figure></li>
      <li><figure><img src="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22900%22%20height=%22600%22%20viewBox=%220%200%20900%20600%22%3E%3Crect%20width=%22900%22%20height=%22600%22%20fill=%22hsl%28100%2055%25%2070%25%29%22/%3E%3Crect%20x=%22250%22%20y=%22150%22%20width=%22400%22%20height=%22300%22%20rx=%2224%22%20fill=%22%23fff%22%20fill-opacity=%22.6%22/%3E%3C/svg%3E" alt="Сайт архитектурного бюро" width="900" height="600" loading="lazy"><figcaption>Архитектурное бюро</figcaption></figure></li>
      <li><figure><img src="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22900%22%20height=%22600%22%20viewBox=%220%200%20900%20600%22%3E%3Crect%20width=%22900%22%20height=%22600%22%20fill=%22hsl%280%2055%25%2070%25%29%22/%3E%3Cpolygon%20points=%22450,120%20640,460%20260,460%22%20fill=%22%23fff%22%20fill-opacity=%22.6%22/%3E%3C/svg%3E" alt="Платформа курсов" width="900" height="600" loading="lazy"><figcaption>Платформа курсов</figcaption></figure></li>
    </ul>
  </section>

  <section class="section reveal" id="pricing" aria-labelledby="pricing-title">
    <h2 id="pricing-title">Тарифы</h2>
    <ul class="plans">
      <li class="plan">
        <h3>Лендинг</h3>
        <p class="plan__price">90 000 ₽</p>
        <p>Одностраничный сайт: дизайн, вёрстка, адаптивность.</p>
        <a class="button" href="#contact">Заказать</a>
      </li>
      <li class="plan plan--featured">
        <h3>Сайт</h3>
        <p class="plan__price">240 000 ₽</p>
        <p>До десяти страниц, дизайн-система, темы, доступность и аудит производительности.</p>
        <a class="button" href="#contact">Заказать</a>
      </li>
      <li class="plan">
        <h3>Поддержка</h3>
        <p class="plan__price">30 000 ₽ / мес</p>
        <p>Правки, рефакторинг и контроль качества стилей.</p>
        <a class="button" href="#contact">Подключить</a>
      </li>
    </ul>
  </section>

  <section class="section reveal" id="faq" aria-labelledby="faq-title">
    <h2 id="faq-title">Вопросы</h2>
    <div class="faq">
      <details><summary>Сколько занимает проект?</summary><p>Лендинг — три недели, сайт на десять страниц — от шести недель в зависимости от объёма материалов.</p></details>
      <details><summary>Работаете ли вы с готовым дизайном?</summary><p>Да: берём макет, проверяем контраст и состояния, затем верстаем на токенах и слоях.</p></details>
      <details><summary>Что с поддержкой старых браузеров?</summary><p>Используем современные возможности CSS с запасными вариантами там, где это необходимо.</p></details>
      <details><summary>Как проверяется качество?</summary><p>Автоматическими проверками: контраст, переполнение на разных ширинах, бюджет специфичности и размера.</p></details>
    </div>
  </section>

  <section class="section reveal" id="contact" aria-labelledby="contact-title">
    <h2 id="contact-title">Контакты</h2>
    <form class="form">
      <div class="field"><label for="name">Имя</label><input id="name" type="text" autocomplete="name"></div>
      <div class="field"><label for="email">Почта</label><input id="email" type="email" autocomplete="email"></div>
      <div class="field"><label for="msg">Сообщение</label><textarea id="msg" rows="4"></textarea></div>
      <button class="button" type="submit">Отправить</button>
    </form>
  </section>
</main>

<footer class="site-footer">
  <p>© 2026 Студия «Верста»</p>
</footer>
</body>
</html>`,
      { filename: "page.html", lineNumbers: true, collapsed: true },
    ),
    note("Секции с классом `reveal` должны появляться при прокрутке (анимация `view()`), а секции ниже первого экрана — рисоваться лениво (`content-visibility: auto`). Оба приёма можно сломать так, что страница станет непригодной для печати, поиска или людей с `prefers-reduced-motion`: в проекте вы закроете эти риски."),
  ],
  requirements: [
    "Один файл `style.css`, без `@import`; разметку менять нельзя; JavaScript не используется.",
    "**Слои:** `@layer reset, tokens, base, layout, components, utilities;` в этом порядке; примитивы и роли — в `tokens`, `!important` разрешён только в `utilities`, идентификаторов нет, специфичность ≤ (0,2,0) с учётом вложенности.",
    "**Токены:** не менее 8 примитивов `--color-*` и 8 ролей (`--surface`, `--on-surface`, `--muted`, `--border`, `--accent`, `--on-accent`, `--focus`, `--shadow`, …); роли ссылаются на примитивы; в компонентах нет литералов цвета и прямых `--color-*`.",
    "**Темы:** светлая и тёмная через `color-scheme` и `light-dark()`; переключатель — радиокнопки и `:where(:root:has(input[name=\"theme\"][value=\"…\"]:checked))`; «Авто» следует системной теме; контраст текста ≥ 4.5:1, границ и кольца фокуса ≥ 3:1 в обеих темах.",
    "**Только логические свойства:** `inline-*`, `block-*`, `margin-inline` и т. п.; `left`, `right`, `width`, `height`, `margin-left` и подобные не используются.",
    "**Mobile-first:** единственный `@media (width >= 48rem)` с порогом в `rem` для перестройки героя, плюс хотя бы один `@container`; `max-width`-запросов нет.",
    "**Плавные размеры:** `h1` — от 2rem (320px) до 4rem (1280px); отступы секций — от 2.5rem до 6rem; боковые поля — `max(1rem, (100% - 68rem) / 2)`; формулы — `clamp()` с интерполяцией.",
    "**Сетки:** услуги, работы и тарифы — `repeat(auto-fit, minmax(min(18rem, 100%), 1fr))`; число колонок не задаётся вручную; картинки работ — `aspect-ratio: 3 / 2`, `object-fit: cover`; герой — две колонки от 48rem.",
    "**Устойчивость:** нет горизонтальной прокрутки на 320–1440px и при корневом шрифте 200%; цели нажатия ≥ 44px; строка текста ≤ 66 знаков; перенос длинных слов.",
    "**Движение:** `@keyframes` и переходы меняют только `transform`, `opacity` и (для переходов) цвета и тени; прокручиваемая анимация `animation-timeline: view()` — внутри `@supports`; `@media (prefers-reduced-motion: reduce)` отключает анимации, переходы и плавную прокрутку.",
    "**Производительность:** `content-visibility: auto` и `contain-intrinsic-size` у секций ниже первого экрана (не у героя); CSS не больше **6 КБ после gzip**; нет глобального `will-change`; сдвиг раскладки при загрузке (CLS) ≤ 0.05, у картинок заданы `width` и `height`.",
    "**Доступность и среды:** ссылка «Перейти к содержимому» невидима до фокуса и появляется в окне при фокусе; заметный `:focus-visible` (обводка ≥ 2px); печатная версия (`@media print`) скрывает шапку и форму, отключает анимации и показывает все секции.",
  ],
  constraints: [
    "Без JavaScript, фреймворков, препроцессоров, внешних шрифтов и сборки.",
    "Без `!important` вне слоя `utilities`, идентификаторов в селекторах и литералов цвета вне слоя `tokens`.",
    "Без физических свойств направления и размеров (`left`, `width`, `margin-left` и т. п.).",
    "Только `min-width`/`width >=` в `@media`; пороги — в `rem`.",
    "Анимировать можно только `transform`, `opacity`, цвета и тени; свойства раскладки (`width`, `margin`, `top`, `height` и др.) запрещены.",
    "Нельзя скрывать переполнение через `overflow-x: hidden` на `html` или `body` и нельзя отключать масштабирование страницы.",
  ],
  expected: [
    "Страница на 1440px — центрированная колонка 68rem, герой в две колонки, по три карточки в рядах услуг, работ и тарифов; на 320px — одна колонка без прокрутки вбок.",
    "Переключатель темы мгновенно меняет все цвета; «Авто» совпадает с системной темой; в обеих темах всё читаемо и фокус виден.",
    "При прокрутке секции мягко «выплывают»; при включённом `prefers-reduced-motion` страница полностью статична.",
    "Страница загружается без сдвигов, CSS занимает около 2.5 КБ после gzip, секции ниже первого экрана не рисуются, пока не понадобятся.",
    "Команда `node run-checks.mjs <адрес>` печатает 14 строк «✓» (7 ширин × 2 темы) и завершается с кодом 0.",
  ],
  technical: [
    "Структура файла: `@layer`-строка → слои `reset` → `tokens` (примитивы, роли, темы, плавные размеры) → `base` → `layout` → `components` (включая движение и печать) → `utilities`.",
    "Формулы: `--step-h1: clamp(2rem, 1.3333rem + 3.3333vw, 4rem)`; `--space-section: clamp(2.5rem, 1.3333rem + 5.8333vw, 6rem)`; `--gutter: max(1rem, (100% - 68rem) / 2)`. Вывод: размер(px) = мин + (макс − мин) × (ширина − 320) / 960; наклон — в `vw`, сдвиг — в `rem`.",
    "Нулевой вес у тем и ролей: `:where(:root)` и `:where(:root:has(…:checked))` — порядок записи решает, а не специфичность.",
    "Низкий вес у эффектов наведения: `:where(.gallery figure):hover { --zoom: 1.04 }` меняет переменную, а `transform: scale(var(--zoom, 1))` читает её; селектор `.gallery figure:hover img` был бы (0,2,2) и нарушил бы бюджет.",
    "`content-visibility: auto` требует оценки размера: `contain-intrinsic-size: auto 27rem` — это размер **содержимого** (без полей секции), поэтому оценка 36rem завышала высоту страницы на 648px, а 27rem — на 216px (замер на 1280px).",
    "Прокручиваемая анимация: `animation-timeline: view(); animation-range: entry 0% entry 35%` внутри `@supports (animation-timeline: view())`; без поддержки секции остаются видимыми.",
    "Печать: `@media print` скрывает шапку, ссылку-пропуск и форму, использует системные цвета `CanvasText`/`Canvas`, отключает анимации и возвращает `content-visibility: visible`.",
    "Проверки: самопроверка `check.js` (из решения) и `run-checks.mjs` для 7 ширин × 2 темы; `stylelint` с бюджетом `0,2,0`; DevTools → Rendering для эмуляции `prefers-reduced-motion`, `prefers-color-scheme` и печати.",
  ],
  acceptance: [
    "`node run-checks.mjs <адрес>`: все 14 прогонов (1440, 1280, 1024, 768, 480, 360, 320px × светлая и тёмная системные темы) — «24 из 24», код выхода 0.",
    "Контраст: в обеих темах текст ≥ 4.5:1; граница поля, граница карточки и кольцо фокуса ≥ 3:1 (худшие пары в замере решения — 6.95 в светлой и 7.93 в тёмной теме).",
    "Слои — в заданном порядке; не менее 8 примитивов и 8 ролей; в `base`, `layout`, `components`, `utilities` нет литералов цвета и `--color-*`; `!important` вне `utilities` и `#id` отсутствуют; специфичность ≤ (0,2,0).",
    "Плавные размеры совпадают с формулами (±0.7px) на каждой ширине; поля равны `max(1rem, (clientWidth − 68rem) / 2)` (±1px).",
    "Нет горизонтальной прокрутки на всех семи ширинах и при корневом шрифте 200%; число колонок сеток равно `min(N, floor((ширина + gap) / (18rem + gap)))`.",
    "Движение: в `@keyframes` — только `opacity` и `transform`; в переходах — только `transform` и `box-shadow`; есть `@supports (animation-timeline: view())`; в `prefers-reduced-motion: reduce` отключены `animation`, `transition` и `scroll-behavior`.",
    "Производительность: ≥ 4 секции с `content-visibility: auto` и `contain-intrinsic-size`, у героя нет; gzip ≤ 6144 байт; нет `@import` и `will-change`; CLS ≤ 0.05; у всех картинок `width` и `height`.",
    "`stylelint` с бюджетом `0,2,0` — 0 нарушений; ссылка-пропуск появляется при фокусе; печатная версия скрывает шапку и форму.",
  ],
  hints: [
    "Стройте сверху вниз: слои и токены → базовые стили → раскладка страницы → компоненты → движение → печать. На каждом шаге запускайте `check.js` — красные проверки подскажут, что ещё не сделано.",
    "Все числа в формулах выводите на бумаге: две точки (320px → мин, 1280px → макс) дают наклон (в `vw`) и сдвиг (в `rem`). Затем сверьте значение на трёх ширинах.",
    "Если проверка контраста падает в тёмной теме, а в светлой всё хорошо, значит, роль задана литералом или не использует `light-dark()`.",
    "Эффекты наведения через `:where()` и переменную (`--zoom`) удерживают вес на нуле; не поднимайте вес ради эффекта.",
    "При `content-visibility: auto` секция вне окна не раскладывается, поэтому тесты геометрии нужно запускать, предварительно прокрутив секцию в окно (в `check.js` это делает вспомогательная функция `show`).",
    "`prefers-reduced-motion` нужно отключать не только анимации и переходы, но и `scroll-behavior: smooth`; для печати — отдельный блок, иначе невидимые (ещё не «выплывшие») секции не попадут на бумагу.",
    "Если не проходит проверка 200%, запустите `findOverflow()` из темы об отладке CSS при `html { font-size: 200% }`: виновниками обычно бывают элементы с `white-space: nowrap`, фиксированными отступами и длинными словами.",
  ],
  advanced: [
    "Добавьте контрастную тему (`prefers-contrast: more`) и проверьте её порог 7:1; встройте проверку в `check.js`.",
    "Сгенерируйте токены из JSON скриптом `build-tokens.mjs` из темы о дизайн-токенах и добавьте шаг в сборку с падением при нарушении контраста.",
    "Подключите `View Transitions` для перехода между темами или якорями и проверьте, что при `prefers-reduced-motion` они отключены.",
    "Замерьте стадии конвейера для эффектов наведения скриптом `trace-stages.mjs` и докажите, что `transform` и `opacity` не вызывают раскладки.",
    "Добавьте `<picture>`/`srcset` для героя и работ (на HTML-стороне) и сравните сетевую нагрузку на 360 и 1280px.",
  ],
  failureModes: [
    "**Литерал цвета в компоненте** (`color: #666666` у `.eyebrow`): в тёмной теме контраст падает до 3.16:1, а проверка находит литерал по тексту правила.",
    "**Анимация свойства раскладки** (`width` в `@keyframes` или `margin` в `transition`): запускает раскладку на каждом кадре; проверка находит свойство в списках анимаций.",
    "**Вес растёт из-за эффекта наведения:** `.gallery figure:hover img` — (0,2,2); решение — переменная `--zoom` и `:where(.gallery figure):hover`.",
    "**Завышенная оценка `contain-intrinsic-size`:** 36rem вместо 27rem увеличивает высоту страницы на 648px (4653 против 4005px на 1280px) и вызывает «прыжки» полосы прокрутки; значение `auto` запоминает реальный размер только после первой раскладки.",
    "**Нет `prefers-reduced-motion`:** секции «выплывают» у пользователей, которым это вредит; проверка требует отключить `animation`, `transition` и `scroll-behavior`.",
    "**Прокручиваемая анимация без `@supports`:** в браузере без `animation-timeline` секции остаются прозрачными; запасной вариант — оставить их видимыми.",
    "**Бюджет размера нарушен:** 260 лишних правил поднимают gzip до 6780 байт при бюджете 6144; проверка считает размер через `CompressionStream` прямо в странице.",
    "**Ссылка-пропуск всегда на виду** (`inset-block-start: 0`): проверка требует, чтобы до фокуса она была за пределами окна (в замере решения — −64px) и выходила в окно при фокусе (+8px).",
  ],
  rubric: [
    { criterion: "Архитектура и токены", weight: 20, description: "Слои, три уровня токенов, роли без литералов, нулевой вес тем, `!important` только в `utilities`, специфичность ≤ (0,2,0)." },
    { criterion: "Темы и контраст", weight: 15, description: "`color-scheme`, `light-dark()`, `:has()`, «Авто», контраст текста, границ и фокуса в обеих темах." },
    { criterion: "Адаптивность и раскладка", weight: 20, description: "Формулы `clamp()`, `max()`/`min()`, `auto-fit`, запрос к контейнеру, герой в одну/две колонки, 200% без прокрутки." },
    { criterion: "Движение", weight: 15, description: "Только `transform`/`opacity`, `view()` под `@supports`, `prefers-reduced-motion`, переходы без смены раскладки." },
    { criterion: "Производительность", weight: 15, description: "`content-visibility` с реалистичной оценкой, бюджет gzip, CLS, отсутствие `@import` и `will-change`." },
    { criterion: "Доступность и среды", weight: 10, description: "Ссылка-пропуск, `:focus-visible`, цели нажатия, печать, логические свойства." },
    { criterion: "Автоматизация проверок", weight: 5, description: "`check.js` проходит на всех ширинах и темах; `stylelint` без нарушений; `run-checks.mjs` завершается кодом 0." },
  ],
  solution: [
    p("Эталон — один файл. Он проходит все 24 проверки на 7 ширинах (1440, 1280, 1024, 768, 480, 360, 320px) при светлой и при тёмной системной теме — 14 прогонов подряд; тринадцать «плохих» вариантов (анимация `width`, переход `margin`, без `content-visibility`, глобальный `will-change`, без `prefers-reduced-motion`, `view()` без `@supports`, `!important` в компоненте, литерал цвета, ссылка-пропуск на виду, без `@media print`, лишний вес, 260 лишних правил, физическое свойство) ловятся своими проверками."),
    h("style.css"),
    code(
      "css",
      `@layer reset, tokens, base, layout, components, utilities;

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  body, h1, h2, h3, p, ul, figure, fieldset, legend { margin: 0; padding: 0; }
  ul { list-style: none; }
  fieldset { border: 0; min-inline-size: 0; }
  img { display: block; max-inline-size: 100%; block-size: auto; }
}

@layer tokens {
  /* примитивы */
  :where(:root) {
    --color-white: #ffffff;
    --color-gray-50: #f4f5fb;
    --color-gray-100: #e8e8f0;
    --color-gray-300: #b5b6c8;
    --color-gray-500: #7a7e99;
    --color-gray-700: #55535c;
    --color-gray-800: #1f2133;
    --color-gray-900: #14151f;
    --color-ink: #1b1b1f;
    --color-blue-700: #2f3d9a;
    --color-blue-300: #aab4f0;

    --space-1: 0.5rem;
    --space-2: 1rem;
    --space-3: 1.5rem;
    --radius: 0.75rem;
    --header-height: 3.75rem;
    --z-header: 100;
  }

  /* роли: светлая и тёмная версии в одной строке */
  :where(:root) {
    color-scheme: light dark;
    --surface: light-dark(var(--color-white), var(--color-gray-900));
    --surface-raised: light-dark(var(--color-gray-50), var(--color-gray-800));
    --on-surface: light-dark(var(--color-ink), var(--color-gray-100));
    --muted: light-dark(var(--color-gray-700), var(--color-gray-300));
    --border: light-dark(var(--color-gray-500), var(--color-gray-500));
    --accent: light-dark(var(--color-blue-700), var(--color-blue-300));
    --on-accent: light-dark(var(--color-white), var(--color-gray-900));
    --focus: light-dark(var(--color-blue-700), var(--color-blue-300));
    --shadow: light-dark(rgb(27 27 31 / 0.18), rgb(0 0 0 / 0.55));
  }
  :where(:root:has(input[name="theme"][value="light"]:checked)) { color-scheme: light; }
  :where(:root:has(input[name="theme"][value="dark"]:checked)) { color-scheme: dark; }

  /* плавные размеры: 320px → 1280px */
  :where(:root) {
    --gutter: max(1rem, (100% - 68rem) / 2);
    --space-section: clamp(2.5rem, 1.3333rem + 5.8333vw, 6rem);
    --step-h1: clamp(2rem, 1.3333rem + 3.3333vw, 4rem);
    --step-h2: clamp(1.5rem, 1.1667rem + 1.6667vw, 2.5rem);
  }
}

@layer base {
  html { scroll-padding-block-start: var(--header-height); scroll-behavior: smooth; }
  body { font: 1rem / 1.6 system-ui, sans-serif; color: var(--on-surface); background: var(--surface); overflow-wrap: anywhere; }
  a { color: var(--accent); }
  :focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  h1 { font-size: var(--step-h1); line-height: 1.1; text-wrap: balance; }
  h2 { font-size: var(--step-h2); line-height: 1.2; }
  h3 { font-size: 1.125rem; }
  p { max-inline-size: 65ch; }
}

@layer layout {
  .skip-link { position: absolute; inset-block-start: -4rem; inset-inline-start: var(--space-2); z-index: calc(var(--z-header) + 1); padding: var(--space-1) var(--space-2); border-radius: var(--radius); background: var(--accent); color: var(--on-accent); }
  .skip-link:focus { inset-block-start: var(--space-1); }

  .site-header { position: sticky; inset-block-start: 0; z-index: var(--z-header); display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1) var(--space-2); min-block-size: var(--header-height); padding: var(--space-1) var(--gutter); background: var(--surface-raised); border-block-end: 1px solid var(--border); }
  .site-nav { min-inline-size: 0; margin-inline-start: auto; overflow-x: auto; }
  .site-nav ul { display: flex; gap: 0.25rem; }
  .theme-switch { display: flex; flex-wrap: wrap; gap: 0 var(--space-2); }

  .hero { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-3); align-items: center; padding: var(--space-section) var(--gutter); }
  .section { padding: var(--space-section) var(--gutter); content-visibility: auto; contain-intrinsic-size: auto 27rem; }
  .section > * + * { margin-block-start: var(--space-3); }

  .services { display: grid; gap: var(--space-2); grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr)); }
  .gallery { display: grid; gap: var(--space-2); grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr)); }
  .plans { display: grid; gap: var(--space-2); grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr)); }
  .site-footer { padding: var(--space-3) var(--gutter); border-block-start: 1px solid var(--border); color: var(--muted); }

  @media (width >= 48rem) {
    .hero { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
}

@layer components {
  .logo { font-weight: 700; color: var(--on-surface); text-decoration: none; }
  .site-nav a, .theme-switch label { display: flex; align-items: center; min-block-size: 2.75rem; padding-inline: 0.75rem; text-decoration: none; white-space: nowrap; }
  .eyebrow { color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.875rem; }
  .hero__text > * + * { margin-block-start: var(--space-2); }
  .hero__img { inline-size: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: var(--radius); }

  .button { display: inline-flex; align-items: center; justify-content: center; min-block-size: 2.75rem; max-inline-size: 100%; padding-inline: 1.25rem; border: 0; border-radius: var(--radius); background: var(--accent); color: var(--on-accent); font: inherit; font-weight: 600; text-decoration: none; text-align: center; cursor: pointer; transition: transform 0.15s ease; }
  .button:hover { transform: translateY(-2px); }

  .service { container-type: inline-size; padding: min(1.5rem, 5vw); border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface-raised); transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .service:hover { transform: translateY(-4px); box-shadow: 0 0.5rem 1.5rem var(--shadow); }
  .service h3 { margin-block-end: var(--space-1); }

  @container (min-width: 22rem) {
    .service h3 { font-size: 1.375rem; }
  }

  .gallery figure { overflow: hidden; border-radius: var(--radius); background: var(--surface-raised); }
  .gallery img { inline-size: 100%; aspect-ratio: 3 / 2; object-fit: cover; transform: scale(var(--zoom, 1)); transition: transform 0.3s ease; }
  :where(.gallery figure):hover { --zoom: 1.04; }
  .gallery figcaption { padding: var(--space-1) var(--space-2); color: var(--muted); font-size: 0.875rem; }

  .plan { display: flex; flex-direction: column; gap: var(--space-1); padding: min(1.5rem, 5vw); border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface-raised); }
  .plan .button { margin-block-start: auto; align-self: flex-start; }
  .plan--featured { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .plan__price { font-size: 1.5rem; font-weight: 700; }

  .faq { display: grid; gap: var(--space-1); }
  .faq details { border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface-raised); }
  .faq summary { display: flex; align-items: center; min-block-size: 2.75rem; padding-inline: var(--space-2); font-weight: 600; cursor: pointer; }
  .faq details p { padding: 0 var(--space-2) var(--space-2); }

  .form { display: grid; gap: var(--space-2); max-inline-size: 28rem; }
  .field { display: grid; gap: 0.25rem; }
  .field label { font-weight: 600; }
  .field :is(input, textarea) { padding: var(--space-1) var(--space-2); border: 2px solid var(--border); border-radius: var(--radius); background: var(--surface); color: var(--on-surface); font: inherit; }

  /* движение: только transform и opacity */
  @keyframes rise {
    from { opacity: 0; transform: translateY(1.5rem); }
    to { opacity: 1; transform: none; }
  }
  .hero__text > * { animation: rise 0.6s ease both; }
  .hero__text > :nth-child(2) { animation-delay: 0.08s; }
  .hero__text > :nth-child(3) { animation-delay: 0.16s; }
  .hero__text > :nth-child(4) { animation-delay: 0.24s; }

  @supports (animation-timeline: view()) {
    .reveal > * { animation: rise linear both; animation-timeline: view(); animation-range: entry 0% entry 35%; }
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    .hero__text > *, .reveal > * { animation: none; }
    .button, .service, .gallery img { transition: none; }
    .button:hover, .service:hover { transform: none; }
    :where(.gallery figure):hover { --zoom: 1; }
  }

  @media print {
    .site-header, .skip-link, .form { display: none; }
    body { color: CanvasText; background: Canvas; }
    .reveal > *, .hero__text > * { animation: none; }
    .section { content-visibility: visible; padding-block: 1rem; }
  }
}

@layer utilities {
  .visually-hidden { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}`,
      { filename: "style.css", lineNumbers: true },
    ),
    h("Почему так"),
    ul(
      "**Слои и токены.** Порядок слоёв — один раз в первой строке. Примитивы (`--color-*`) и роли (`--surface`, `--accent`…) лежат в `tokens` под `:where(:root)`: вес нулевой, поэтому темы переключателем перебивают их порядком записи. Роли возвращают `light-dark(светлое, тёмное)` по текущему `color-scheme`.",
      "**Формулы вместо порогов.** Размеры `h1` и отступы секций выведены из двух точек и записаны как `clamp(мин, сдвиг + наклон·vw, макс)`. Единственный `@media (width >= 48rem)` перестраивает герой; всё остальное подстраивается само благодаря `auto-fit` и `min(18rem, 100%)`.",
      "**Контейнерный запрос.** Каждая карточка услуги — контейнер (`container-type: inline-size`), и заголовок крупнее, когда карточке хватает ширины (`@container (min-width: 22rem)`), независимо от окна.",
      "**Движение.** Анимации `rise` и переходы меняют `opacity`, `transform` и `box-shadow`. Прокручиваемая анимация `view()` стоит под `@supports`, поэтому в браузерах без неё секции просто видны. При `prefers-reduced-motion: reduce` анимации и переходы выключены, плавная прокрутка отменена, а наведение не двигает элементы.",
      "**Эффект наведения без веса.** Вместо `.gallery figure:hover img { transform: … }` (0,2,2) переменная `--zoom` меняется у `figure` через `:where(.gallery figure):hover` (0,1,0), а картинка читает её в `transform: scale(var(--zoom, 1))`. Переход плавный, вес — в бюджете.",
      "**Ленивая отрисовка.** `.section` получает `content-visibility: auto; contain-intrinsic-size: auto 27rem` — оценку размера **содержимого**. Замер: страница 4005px; с оценкой 36rem — 4653px (+648), с оценкой 27rem — 4221px (+216). Герой не ленивый: он на первом экране.",
      "**Печать.** Отдельный блок скрывает шапку, ссылку-пропуск и форму, переключает цвета на системные (`CanvasText`, `Canvas`), отключает анимации и возвращает видимость секциям — иначе невыплывшие и пропущенные секции не попали бы на бумагу.",
    ),
    h("Самопроверка"),
    p("Скрипт вставляется в консоль страницы. Он **кликает по радиокнопкам**, **прокручивает секции в окно** (иначе из-за `content-visibility` раскладка ниже первого экрана ещё не посчитана), временно меняет корневой шрифт на 200%, считает контраст по формуле WCAG, измеряет CLS, размер CSS в gzip через `CompressionStream` и печатает таблицу из 24 проверок."),
    code(
      "js",
      `// check.js — самопроверка итогового проекта «Студия»: вставьте в консоль страницы (скрипт асинхронный)
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const show = async (el) => { el.scrollIntoView({ block: "center", behavior: "instant" }); await sleep(120); };   // content-visibility: auto раскладывает секцию только вблизи окна
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const cs = (el) => getComputedStyle(el);
  const rect = (el) => el.getBoundingClientRect();
  const near = (a, b, d = 1) => Math.abs(a - b) <= d;
  const root = document.documentElement;
  const rem = parseFloat(cs(root).fontSize), W = innerWidth;
  const checks = [];
  const add = (name, ok, detail) => checks.push({ проверка: name, итог: ok ? "OK" : "НЕТ", детали: detail });

  // CLS: сдвиги раскладки с начала загрузки (читаем до любых манипуляций)
  const cls = await new Promise((resolve) => { let sum = 0; const po = new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) sum += e.value; })); po.observe({ type: "layout-shift", buffered: true }); setTimeout(() => { po.disconnect(); resolve(sum); }, 150); });

  // --- цвет ---
  const rgb = (s) => s.match(/[\\d.]+/g).slice(0, 3).map(Number);
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = cs(e).backgroundColor; if (!/rgba?\\(.*,\\s*0\\)$|transparent/.test(c)) return rgb(c); } return rgb(cs(document.body).backgroundColor); };
  const token = (name) => { const i = document.createElement("i"); i.style.color = "var(" + name + ")"; document.body.append(i); const c = cs(i).color; i.remove(); return rgb(c); };
  const pick = async (v) => { $("input[name=theme][value=" + v + "]").click(); await sleep(80); };

  // --- таблица стилей ---
  const flat = (rules, out = []) => { for (const r of rules) { out.push(r); if (r.cssRules) flat(r.cssRules, out); } return out; };
  const all = [...document.styleSheets].flatMap((s) => { try { return flat(s.cssRules); } catch { return []; } });
  const styleRules = all.filter((r) => r instanceof CSSStyleRule);
  const layerOf = (r) => { for (let p = r.parentRule; p; p = p.parentRule) if (p instanceof CSSLayerBlockRule) return p.name; return null; };
  const full = (r) => (r.parentRule instanceof CSSStyleRule ? r.selectorText.replace(/&/g, ":is(" + full(r.parentRule) + ")") : r.selectorText);
  const splitTop = (s) => { const out = []; let d = 0, cur = ""; for (const ch of s) { if (ch === "(" || ch === "[") d++; if (ch === ")" || ch === "]") d--; if (ch === "," && d === 0) { out.push(cur.trim()); cur = ""; } else cur += ch; } return out.concat(cur.trim()); };
  const weight = (sel) => {
    const s = sel.replace(/:where\\((?:[^()]|\\([^()]*\\))*\\)/g, "").replace(/::?[\\w-]+(\\((?:[^()]|\\([^()]*\\))*\\))?/g, (m) => (m.startsWith("::") ? " x" : ".p"));
    return [(s.match(/#[\\w-]+/g) || []).length, (s.match(/\\.[\\w-]+|\\[[^\\]]*\\]/g) || []).length, (s.replace(/\\.[\\w-]+|\\[[^\\]]*\\]|#[\\w-]+/g, " ").match(/(^|[\\s>+~])[a-z][\\w-]*/gi) || []).length];
  };
  const literalColor = /#[0-9a-f]{3,8}\\b|\\b(?:rgb|rgba|hsl|hsla|hwb|oklch|oklab|lab|lch)\\(/i;
  const lerp = (min, max, w) => min + (max - min) * Math.min(1, Math.max(0, (w - 320) / 960));

  // ===== 1. архитектура и токены =====
  const layerStmt = all.find((r) => r instanceof CSSLayerStatementRule), order = layerStmt ? [...layerStmt.nameList].join(",") : "";
  add("Слои: reset → tokens → base → layout → components → utilities", order === "reset,tokens,base,layout,components,utilities", order || "нет @layer");
  const tokenDecl = styleRules.filter((r) => layerOf(r) === "tokens").flatMap((r) => [...r.style].filter((n) => n.startsWith("--")).map((n) => [n, r.style.getPropertyValue(n).trim()]));
  const prim = new Set(tokenDecl.filter(([n]) => /^--color-/.test(n)).map(([n]) => n)), roles = new Set(tokenDecl.filter(([n]) => !/^--(color|space|radius|header|z|gutter|step)/.test(n)).map(([n]) => n));
  const rolesBad = tokenDecl.filter(([n, v]) => !/^--color-/.test(n) && n !== "--shadow" && literalColor.test(v));
  add("Токены: ≥ 8 примитивов и ≥ 8 ролей; роли без литералов цвета", prim.size >= 8 && roles.size >= 8 && rolesBad.length === 0, "примитивов " + prim.size + ", ролей " + roles.size + (rolesBad.length ? ", с литералами: " + rolesBad.map(([n]) => n).join(", ") : ""));
  const compRules = styleRules.filter((r) => ["base", "layout", "components", "utilities"].includes(layerOf(r)));
  const badComp = compRules.filter((r) => literalColor.test(r.cssText) || /var\\(--color-/.test(r.cssText));
  add("Компоненты используют роли: нет литералов цвета и прямых --color-*", badComp.length === 0, badComp.length ? badComp.map((r) => r.selectorText).join(", ") : "правил проверено: " + compRules.length);
  const imp = styleRules.filter((r) => /!important/.test(r.cssText) && layerOf(r) !== "utilities"), ids = styleRules.filter((r) => /#[\\w-]+/.test(full(r)));
  add("Нет !important вне utilities и #id", imp.length === 0 && ids.length === 0, "!important вне utilities: " + imp.length + ", #id: " + ids.length);
  const max = styleRules.reduce((m, r) => { const w = splitTop(full(r)).map(weight).sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]; return (w[0] - m[0] || w[1] - m[1] || w[2] - m[2]) > 0 ? w : m; }, [0, 0, 0]);
  add("Специфичность не выше (0,2,0)", max[0] === 0 && (max[1] < 2 || (max[1] === 2 && max[2] === 0)), "(" + max.join(",") + ")");
  const physical = styleRules.filter((r) => /(^|[;{\\s])(margin|padding|border)-(left|right|top|bottom)\\b|(^|[;{\\s])(left|right|top|bottom|width|height|min-width|max-width|min-height|max-height)\\s*:|text-align:\\s*(left|right)|float:\\s*(left|right)/.test(r.cssText.replace(/^[^{]*\\{/, "")));
  add("Только логические свойства (inline/block)", physical.length === 0, physical.length ? physical.map((r) => r.selectorText).join(", ") : "физических свойств нет");

  // ===== 2. темы и контраст =====
  const roleEls = [["текст", ".service p"], ["заголовок", "h2"], ["приглушённый (подпись)", ".gallery figcaption"], ["надзаголовок", ".eyebrow"], ["ссылка меню", ".site-nav a"], ["кнопка", ".button"], ["подвал", ".site-footer p"], ["вопрос", ".faq summary"]];
  const badC = [], worst = {};
  for (const t of ["light", "dark"]) {
    await pick(t);
    const surface = token("--surface");
    const vals = roleEls.map(([n, s]) => { const el = $(s); return [n, contrast(rgb(cs(el).color), bgOf(el))]; });
    vals.filter(([, c]) => c < 4.5).forEach(([n, c]) => badC.push(t + ": " + n + " " + c.toFixed(2)));
    [["граница поля", rgb(cs($("#name")).borderTopColor)], ["граница карточки", rgb(cs($(".service")).borderTopColor)], ["кольцо фокуса", token("--focus")]].filter(([, c]) => contrast(c, surface) < 3).forEach(([n, c]) => badC.push(t + ": " + n + " " + contrast(c, surface).toFixed(2) + " < 3"));
    worst[t] = Math.min(...vals.map(([, c]) => c)).toFixed(2);
  }
  add("Светлая и тёмная темы: контраст текста ≥ 4.5:1, границ и фокуса ≥ 3:1", badC.length === 0, badC.length ? badC.join("; ") : "худшие пары: светлая " + worst.light + ", тёмная " + worst.dark);
  const sc = {}; for (const v of ["auto", "light", "dark"]) { await pick(v); sc[v] = cs(root).colorScheme; }
  await pick("light"); const sL = token("--surface").join(); await pick("dark"); const sD = token("--surface").join(); await pick("auto"); const sA = token("--surface").join();
  add("Переключатель тем: color-scheme и «Авто» по системе", sc.auto === "light dark" && sc.light === "light" && sc.dark === "dark" && sL !== sD && sA === (matchMedia("(prefers-color-scheme: dark)").matches ? sD : sL), JSON.stringify(sc));

  // ===== 3. адаптивность =====
  const media = all.filter((r) => r instanceof CSSMediaRule).map((r) => r.conditionText);
  const mq = media.filter((c) => !/prefers-|forced-colors|^print$|print/.test(c));
  add("Запросы к ширине — «от малого к большому» в rem; есть @container", mq.length >= 1 && mq.every((c) => !/max-width|width\\s*<|<=/.test(c) && !/\\d+px/.test(c)) && all.some((r) => r instanceof CSSContainerRule), "запросы: " + mq.join("; ") + ", @container: " + all.filter((r) => r instanceof CSSContainerRule).length);
  const h1 = parseFloat(cs($("h1")).fontSize), sec = parseFloat(cs($(".section")).paddingTop), gutter = parseFloat(cs($(".section")).paddingLeft);
  add("Плавные размеры: h1 2→4rem и отступы секций 2.5→6rem между 320 и 1280px, поля max()", near(h1, lerp(2 * rem, 4 * rem, W), 0.7) && near(sec, lerp(2.5 * rem, 6 * rem, W), 0.7) && near(gutter, Math.max(rem, (root.clientWidth - 68 * rem) / 2), 1), "h1 " + h1.toFixed(1) + ", отступ " + sec.toFixed(1) + ", поле " + gutter.toFixed(0));
  add("Нет горизонтальной прокрутки", root.scrollWidth <= root.clientWidth, "scrollWidth " + root.scrollWidth + ", clientWidth " + root.clientWidth + " (" + W + "px)");
  root.style.fontSize = "200%"; const zoomOk = root.scrollWidth <= root.clientWidth, zoomD = root.scrollWidth + "/" + root.clientWidth; root.style.fontSize = "";
  add("При шрифте 200% нет горизонтальной прокрутки", zoomOk, "scrollWidth/clientWidth " + zoomD);
  window.scrollTo({ top: 0, behavior: "instant" }); await sleep(120);
  const hero = rect($(".hero__text")), himg = rect($(".hero__img"));
  add(W >= 48 * rem ? "Герой в две колонки на широком экране" : "Герой в одну колонку на узком", W >= 48 * rem ? himg.left >= hero.right - 1 : himg.top >= hero.bottom - 1, "текст " + Math.round(hero.left) + "–" + Math.round(hero.right) + ", картинка " + Math.round(himg.left) + "–" + Math.round(himg.right));
  for (const s of [".services", ".gallery", ".plans"]) await show($(s));
  const gcols = (s) => cs($(s)).gridTemplateColumns.split(" ").length, gw = (s) => rect($(s)).width, ggap = (s) => parseFloat(cs($(s)).columnGap);
  const exp = (s, minRem, cap) => Math.min(cap, Math.max(1, Math.floor((gw(s) + ggap(s)) / (minRem * rem + ggap(s)))));
  add("Сетки подбирают колонки сами: услуги, работы, тарифы", gcols(".services") === exp(".services", 18, 6) && gcols(".gallery") === exp(".gallery", 18, 6) && gcols(".plans") === exp(".plans", 18, 3), "услуги " + gcols(".services") + ", работы " + gcols(".gallery") + ", тарифы " + gcols(".plans"));
  await show($("#faq")); await show($("#contact"));
  const targets = [...$$(".button"), ...$$(".site-nav a"), ...$$(".faq summary"), ...$$(".theme-switch label")].map((el) => rect(el).height);
  add("Цели нажатия не ниже 44px", Math.min(...targets) >= 43.5, "минимум " + Math.min(...targets).toFixed(1) + "px");
  const chOf = (el) => { const pr = document.createElement("span"); pr.style.cssText = "position:absolute;visibility:hidden;width:1ch"; el.append(pr); const w = pr.getBoundingClientRect().width; pr.remove(); return w; };
  add("Строка текста не длиннее 66 знаков", Math.max(...$$("main p").map((p) => rect(p).width / chOf(p))) <= 66, "максимум ≈ " + Math.max(...$$("main p").map((p) => rect(p).width / chOf(p))).toFixed(0) + "ch");

  // ===== 4. движение =====
  const allowedMotion = new Set(["opacity", "transform", "translate", "scale", "rotate", "box-shadow", "background-color", "color", "border-color", "filter"]);
  const layoutProp = /^(all|width|height|min-|max-|margin|padding|top|left|right|bottom|inset|font|line-height|letter-spacing|border-width|border-.*-width|flex|grid|gap|display|position)/;
  const kf = all.filter((r) => r instanceof CSSKeyframesRule), kfProps = new Set(kf.flatMap((r) => [...r.cssRules].flatMap((k) => [...k.style])));
  const trProps = new Set(styleRules.flatMap((r) => (r.style.transitionProperty || "").split(",").map((s) => s.trim()).filter((s) => s && s !== "all" && s !== "none")));
  const badMotion = [...kfProps, ...trProps].filter((n) => layoutProp.test(n));
  add("Анимации и переходы меняют только transform, opacity и цвета/тени", kf.length >= 1 && trProps.size >= 1 && badMotion.length === 0, "keyframes: " + [...kfProps].join(", ") + "; transition: " + [...trProps].join(", ") + (badMotion.length ? "; ЛИШНЕЕ: " + badMotion.join(", ") : ""));
  const scrollAnims = document.getAnimations().filter((a) => a.timeline && a.timeline.constructor.name === "ViewTimeline").length;
  const rm = all.filter((r) => r instanceof CSSMediaRule && /prefers-reduced-motion:\\s*reduce/.test(r.conditionText)).flatMap((r) => flat(r.cssRules)).filter((r) => r instanceof CSSStyleRule);
  add("Прокрутка-анимация (view()) под @supports; reduce-motion отключает движение", all.some((r) => r instanceof CSSSupportsRule && /animation-timeline/.test(r.conditionText)) && rm.some((r) => r.style.animationName === "none") && rm.some((r) => r.style.transitionProperty === "none") && rm.some((r) => r.style.scrollBehavior === "auto"), "ViewTimeline-анимаций на странице: " + scrollAnims + ", правил в reduce: " + rm.length);

  // ===== 5. производительность =====
  const cv = $$(".section").filter((s) => cs(s).contentVisibility === "auto" && cs(s).containIntrinsicBlockSize !== "none");
  add("content-visibility: auto + contain-intrinsic-size у секций ниже первого экрана", cv.length >= 4 && cs($(".hero")).contentVisibility !== "auto", "секций: " + cv.length);
  const css = [...document.styleSheets].map((s) => { try { return [...s.cssRules].map((r) => r.cssText).join("\\n"); } catch { return ""; } }).join("\\n");
  const gz = (await new Response(new Blob([css]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer()).byteLength;
  add("Бюджет размера: CSS не больше 6 КБ в gzip, нет @import, нет глобального will-change", gz <= 6144 && !all.some((r) => r instanceof CSSImportRule) && !/will-change/.test(css), "gzip " + gz + " Б из 6144, исходных символов " + css.length);
  add("Сдвиги раскладки при загрузке (CLS) ≤ 0.05; у картинок заданы width и height", cls <= 0.05 && $$("img").every((i) => i.getAttribute("width") && i.getAttribute("height")), "CLS " + cls.toFixed(3) + ", картинок " + $$("img").length);

  // ===== 6. доступность и среда =====
  window.scrollTo({ top: 0, behavior: "instant" }); await sleep(120);
  const skip = $(".skip-link"); const before = rect(skip).top; skip.focus(); await sleep(60); const after = rect(skip).top; skip.blur();
  add("Ссылка «Перейти к содержимому» появляется при фокусе", before < 0 && after >= 0, "top до фокуса " + before.toFixed(0) + ", после " + after.toFixed(0));
  add("Есть заметный :focus-visible", styleRules.some((r) => /:focus-visible/.test(r.selectorText) && parseFloat((r.style.outline.match(/(\\d+)px/) || [])[1]) >= 2), ":focus-visible { outline }");
  const pr = all.filter((r) => r instanceof CSSMediaRule && /print/.test(r.conditionText)).flatMap((r) => flat(r.cssRules)).filter((r) => r instanceof CSSStyleRule);
  add("Печатная версия: скрыты шапка и форма, движение отключено, секции показаны", pr.some((r) => /display:\\s*none/.test(r.cssText)) && pr.some((r) => r.style.animationName === "none") && pr.some((r) => /content-visibility:\\s*visible/.test(r.cssText)), "правил в @media print: " + pr.length);

  await pick("auto");
  console.table(checks);
  return checks.every((c) => c.итог === "OK");
})();`,
      { filename: "check.js", lineNumbers: true, collapsed: true },
    ),
    h("Запуск на всех ширинах и темах"),
    p("Скрипт для Node.js с Playwright. Он открывает страницу на семи ширинах при светлой и тёмной системных темах (`colorScheme`), использует классические полосы прокрутки (иначе `100vw` совпадёт с шириной окна и часть ошибок не воспроизведётся), запускает `check.js` и завершается с кодом 1, если хотя бы одна проверка не пройдена."),
    code(
      "js",
      `// run-checks.mjs <url> — запускает check.js на семи ширинах при светлой и тёмной системной теме
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const url = process.argv[2];
const check = readFileSync("check.js", "utf8").trim().replace(/;$/, "");
const widths = [1440, 1280, 1024, 768, 480, 360, 320];
const browser = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });        // классические полосы прокрутки
let failed = 0;

for (const colorScheme of ["light", "dark"]) {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 800 }, colorScheme });
    await page.goto(url);
    const rows = await page.evaluate("(async () => { const out = []; const orig = console.table; console.table = (t) => out.push(...t); await (" + check + "); console.table = orig; return out; })()");
    const bad = rows.filter((r) => r.итог !== "OK");
    console.log((bad.length ? "✗" : "✓") + " " + colorScheme.padEnd(5) + " " + String(width).padStart(4) + " px: " + (rows.length - bad.length) + " из " + rows.length);
    for (const r of bad) console.log("    НЕТ " + r.проверка + " — " + r.детали);
    failed += bad.length;
    await page.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);`,
      { filename: "run-checks.mjs", lineNumbers: true, collapsed: true },
    ),
    h("Результаты проверки решения"),
    table(
      ["Что проверялось", "Результат"],
      [
        ["`node run-checks.mjs` для эталона", "14 прогонов (7 ширин × 2 темы) — «24 из 24», код выхода 0"],
        ["Тот же запуск с `.eyebrow { color: #666666 }`", "22 из 24 в каждом прогоне, код выхода 1: литерал цвета и контраст 3.16:1 в тёмной теме"],
        ["Контраст: худшие пары среди проверяемых ролей", "6.95:1 в светлой теме, 7.93:1 в тёмной"],
        ["Токены в `tokens`", "11 примитивов и 9 ролей; в остальных слоях проверено 64 правила без литералов цвета"],
        ["Анимации", "`@keyframes`: `opacity`, `transform`; переходы: `transform`, `box-shadow`; на странице 10 прокручиваемых анимаций `view()`"],
        ["Производительность", "CSS: 2498 байт gzip (бюджет 6144), 8867 символов в нормализованном виде; CLS 0.000; 5 секций с `content-visibility: auto`"],
        ["Высота страницы на 1280px: без ленивой отрисовки / оценка 36rem / оценка 27rem", "4005 / 4653 / 4221px"],
        ["Число объектов раскладки при загрузке (трассировка)", "265 с `content-visibility` и без — для небольшой страницы выигрыш не виден; он проявляется на больших документах (тема о производительности CSS: 3000 карточек, 501 → 61 мс)"],
        ["`stylelint` (`selector-max-id: 0`, `declaration-no-important: true`, `selector-max-specificity: \"0,2,0\"`, `selector-max-compound-selectors: 3`)", "0 нарушений"],
        ["Тринадцать «плохих» вариантов", "каждый ловится своей проверкой (23 из 24 или 22 из 24)"],
      ],
      "Проверка эталона",
    ),
    warn("Автоматические проверки подтверждают измеримое, но не заменяют глаз: пройдитесь по странице клавиатурой, включите увеличение текста, переключите темы, запустите печать и режим уменьшенного движения. Эти проверки — страховка от регрессий, а не оценка дизайна."),
    tip("Проект — не конец, а основа портфолио. Положите `check.js`, `run-checks.mjs` и `stylelint`-конфиг рядом с `style.css`: любой, кто изменит стили, сразу увидит, что сломал."),
  ],
};
