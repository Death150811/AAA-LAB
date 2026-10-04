import type { Project } from "../../types";
import { code, h, note, p, table, tip, ul, warn } from "../../dsl";

export const p05ResponsiveLanding: Project = {
  id: "css.p05-responsive-landing",
  domain: "css",
  order: 5,
  title: "Адаптивный лендинг",
  subtitle: "Mobile-first без «магических» чисел: плавные размеры на clamp(), поля на max(), сетки на auto-fit с min(), компонент на запросе к контейнеру, картинка с object-fit и страница, которая переживает масштаб текста 200% на экране 320px.",
  level: "intermediate",
  estimatedHours: 10,
  buildsOn: ["css.p04-grid-dashboard"],
  topics: [
    "css.units-math",
    "css.media-queries",
    "css.fluid-typography-spacing",
    "css.container-queries",
    "css.responsive-media",
    "css.grid-responsive",
    "css.flexbox-patterns",
    "css.cascade-layers",
    "css.debugging-css",
  ],
  objective:
    "Написать **адаптивный лендинг по принципу mobile-first**: базовые стили для узкого экрана, единственный `@media` с порогом в `rem` и синтаксисом диапазона, **плавные размеры** заголовков и отступов по формуле, поля `max(1rem, (100% - 64rem) / 2)`, сетки `auto-fit` с `min()`, компонент, зависящий от **ширины контейнера**, картинка с `aspect-ratio` и `object-fit`, цели нажатия не ниже 44px и **отсутствие горизонтальной прокрутки при масштабе текста 200%**. Результат проверяется самопроверкой из **21 проверки**.",
  scenario: [
    p("Кофейня «Зерно» запускает подписку на свежую обжарку. Маркетолог принёс макет для десктопа, а 70% будущих заказов — с телефонов. В прошлой версии вёрстка держалась на `px` и четырёх `max-width`-запросах: на 360px кнопки вылезали за карточки, а при увеличенном шрифте в настройках телефона страница прокручивалась вбок."),
    p("Разметку менять нельзя. Нужно написать `style.css`, где всё строится **от малого экрана к большому**, размеры меняются **плавно, а не скачками**, а компонент «преимущество» сам решает, как выглядеть — в зависимости от ширины **своей** карточки, а не окна."),
    code(
      "html",
      `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Кофейня «Зерно» — свежая обжарка каждую неделю</title>
<link rel="stylesheet" href="style.css">
<body>
<header class="site-header">
  <a class="logo" href="#">Зерно</a>
  <nav class="site-nav" aria-label="Основная">
    <ul>
      <li><a href="#about">О нас</a></li>
      <li><a href="#features">Преимущества</a></li>
      <li><a href="#plans">Подписка</a></li>
      <li><a href="#reviews">Отзывы</a></li>
      <li><a href="#contacts">Контакты</a></li>
    </ul>
  </nav>
</header>

<main>
  <section class="hero" id="about">
    <div class="hero__text">
      <h1>Свежая обжарка у вас дома каждую неделю</h1>
      <p>Мы обжариваем зёрна небольшими партиями и отправляем их в течение суток после обжарки. Выберите вкус, частоту доставки и пейте кофе, который не стоял на полке.</p>
      <p><a class="button" href="#plans">Выбрать подписку</a></p>
    </div>
    <img class="hero__img" src="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22900%22%20height=%22600%22%20viewBox=%220%200%20900%20600%22%3E%3Cdefs%3E%3ClinearGradient%20id=%22g%22%20x1=%220%22%20y1=%220%22%20x2=%221%22%20y2=%221%22%3E%3Cstop%20offset=%220%22%20stop-color=%22%23c5cae9%22/%3E%3Cstop%20offset=%221%22%20stop-color=%22%237986cb%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width=%22900%22%20height=%22600%22%20fill=%22url%28%23g%29%22/%3E%3Ccircle%20cx=%22450%22%20cy=%22300%22%20r=%22150%22%20fill=%22%23fff%22%20fill-opacity=%22.55%22/%3E%3C/svg%3E" alt="Мешок свежеобжаренных зёрен" width="900" height="600">
  </section>

  <section class="section" id="features" aria-labelledby="features-title">
    <h2 id="features-title">Почему «Зерно»</h2>
    <ul class="features">
      <li class="feature">
        <div class="feature__inner">
          <span class="feature__icon" aria-hidden="true">☕</span>
          <div class="feature__body"><h3>Малые партии</h3><p>Обжариваем до 20 килограммов за раз и контролируем каждую обжарку.</p></div>
        </div>
      </li>
      <li class="feature">
        <div class="feature__inner">
          <span class="feature__icon" aria-hidden="true">📦</span>
          <div class="feature__body"><h3>Доставка за сутки</h3><p>Отправляем в день обжарки, курьер привозит свежие зёрна на следующий день.</p></div>
        </div>
      </li>
      <li class="feature">
        <div class="feature__inner">
          <span class="feature__icon" aria-hidden="true">🔁</span>
          <div class="feature__body"><h3>Гибкая подписка</h3><p>Пропустите неделю, поменяйте сорт или остановите доставку в один клик.</p></div>
        </div>
      </li>
    </ul>
  </section>

  <section class="section section--tint" id="plans" aria-labelledby="plans-title">
    <h2 id="plans-title">Подписка</h2>
    <ul class="plans">
      <li class="plan">
        <h3>Пробный</h3>
        <p class="plan__price">590 ₽</p>
        <p>Одна упаковка 250 г, один вкус на выбор.</p>
        <a class="button" href="#contacts">Заказать</a>
      </li>
      <li class="plan plan--featured">
        <h3>Домашний</h3>
        <p class="plan__price">1 490 ₽</p>
        <p>Две упаковки по 250 г в месяц, смена вкуса, бесплатная доставка и скидка на аксессуары.</p>
        <a class="button" href="#contacts">Оформить</a>
      </li>
      <li class="plan">
        <h3>Офисный</h3>
        <p class="plan__price">4 900 ₽</p>
        <p>Килограмм в месяц для команды.</p>
        <a class="button" href="#contacts">Связаться</a>
      </li>
    </ul>
  </section>

  <section class="section" id="reviews" aria-labelledby="reviews-title">
    <h2 id="reviews-title">Отзывы</h2>
    <blockquote class="review">
      <p>Раньше кофе из магазина был «никаким». С подпиской каждое утро — как в хорошей кофейне. Особенно нравится, что можно пропустить неделю в отпуск.</p>
      <footer>— Марина, подписчик с 2024 года</footer>
    </blockquote>
  </section>

  <section class="section section--tint" id="contacts" aria-labelledby="contacts-title">
    <h2 id="contacts-title">Остались вопросы?</h2>
    <p>Напишите нам — ответим в течение рабочего дня.</p>
    <p><a class="button" href="#about">Написать в поддержку</a></p>
  </section>
</main>

<footer class="site-footer">
  <p>© 2026 Кофейня «Зерно»</p>
</footer>
</body>
</html>`,
      { filename: "page.html", lineNumbers: true, collapsed: true },
    ),
    note("Для проверки нужен режим документа «стандартный» (в разметке есть `<!doctype html>`) и `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">`: без неё мобильный браузер отрисует страницу как на широком экране и сожмёт."),
  ],
  requirements: [
    "Один файл `style.css`; разметку менять нельзя.",
    "**Mobile-first:** базовые правила — для узкого экрана; все запросы `@media` — только «от малого к большому» (`min-width` или `width >=`), пороги — в `rem` или `em`; хотя бы один `@media` и один `@container`.",
    "**Плавный заголовок:** размер `h1` линейно растёт от `2rem` на 320px до `4rem` на 1280px и дальше не меняется (формула в разделе «Технические требования»).",
    "**Плавные отступы:** вертикальные отступы секций (`.section`, `.hero`) растут от `2rem` на 320px до `5rem` на 1280px.",
    "**Поля страницы:** `padding-inline: max(1rem, (100% - 64rem) / 2)` — не меньше 1rem и контент не шире 64rem; на широком экране поля растут сами.",
    "**Герой:** на ширинах от 48rem — две колонки (текст слева, картинка справа), на узких — одна колонка (картинка под текстом); колонки `minmax(0, 1fr)`; минимальная высота `min(40rem, 80svh)`.",
    "**Картинка героя:** пропорции 4:3 (`aspect-ratio`) при исходнике 3:2, `object-fit: cover`, ширина 100% колонки.",
    "**Компонент на контейнере:** карточка `.feature` — контейнер (`container-type: inline-size`); внутри при ширине контейнера от 28rem иконка и текст идут строкой, в узком — столбцом. Условие — `@container`, а не `@media`.",
    "**Сетки без переполнения:** тарифы — `repeat(auto-fit, minmax(min(20rem, 100%), 1fr))` (до трёх колонок), преимущества — `auto-fit` с минимумом `min(16rem, 100%)`.",
    "**Касание и чтение:** кнопки и ссылки меню не ниже 44px; строка текста — не длиннее 66 знаков (`max-inline-size: 65ch`).",
    "**Масштаб текста:** при `font-size: 200%` на корневом элементе (эмуляция увеличенного шрифта) на 320px нет горизонтальной прокрутки.",
    "**Единицы:** в размерах контейнеров нет пикселей (только `rem`, `%`, `ch`, `vw`, `clamp()`, `min()`, `max()`).",
    "**Архитектура:** слои `@layer`, переменные, нет `!important` и `#id`, специфичность ≤ (0,2,0), заметный `:focus-visible`.",
  ],
  constraints: [
    "Без JavaScript, фреймворков и препроцессоров; разметку не менять.",
    "Только `min-width` / `width >=` в `@media`; `max-width` и `width <` запрещены; пороги — не в пикселях.",
    "Ширины контейнеров, колонок и текста — без `px` (допустимы `px` в границах и тенях).",
    "Нельзя использовать JavaScript или `resize`-слушатели для подбора размеров.",
    "Нельзя скрывать переполнение через `overflow-x: hidden` на `html` или `body`.",
    "Нельзя отключать масштабирование в `<meta name=\"viewport\">` (`user-scalable=no`, `maximum-scale=1`).",
  ],
  expected: [
    "На 320px страница — одна колонка: заголовок крупный, но не больше экрана, кнопки на всю ширину карточки, меню прокручивается внутри шапки.",
    "На 768px герой превращается в две колонки, карточки преимуществ и тарифов раскладываются по две-три в ряд.",
    "На 1280px и шире контент центрирован в колонке 64rem, заголовок равен 4rem, отступы секций — 5rem.",
    "Карточка преимущества показывает иконку слева от текста, когда ей хватает ширины, независимо от ширины окна.",
    "Если пользователь увеличил шрифт в настройках до 200%, горизонтальной прокрутки нет, длинные слова переносятся, кнопки остаются внутри карточек.",
    "Самопроверка печатает таблицу из 21 проверки, и все они OK на ширинах от 320 до 1440px.",
  ],
  technical: [
    "Порядок слоёв: `@layer reset, base, layout, components;`; единственный `@media (width >= 48rem)` — в слое `layout`, `@container (min-width: 28rem)` — в `components`.",
    "Плавный `h1` (от 2rem на 320px до 4rem на 1280px): размер(px) = 32 + (ширина − 320) / 30 = 3.3333vw + 1.3333rem; в CSS: `clamp(2rem, 1.3333rem + 3.3333vw, 4rem)`. Проверка: 320px → 32px, 800px → 48px, 1280px → 64px.",
    "Плавные отступы (от 2rem до 5rem): размер(px) = 32 + (ширина − 320) × 0.05 = 5vw + 1rem; в CSS: `clamp(2rem, 1rem + 5vw, 5rem)`.",
    "Поля: переменная `--gutter: max(1rem, (100% - 64rem) / 2)`; процент в `padding` считается от ширины содержащего блока, поэтому поля подстраиваются под ширину секции.",
    "`min(20rem, 100%)` внутри `minmax()` не даёт колонке стать шире контейнера: без него на 320px сетка тарифов дала бы переполнение (замер: 336px при ширине 305px).",
    "Перенос слов: `overflow-wrap: anywhere` на `body` уменьшает минимальную ширину содержимого, поэтому flex- и grid-элементы с длинными словами сжимаются; `max-inline-size: 100%` у кнопок удерживает их в карточках.",
    "Проверки: самопроверка `check.js` (из решения) на 9 ширинах; `stylelint` с бюджетом `0,2,0`; для масштаба текста — режим «Размер шрифта» браузера или `html { font-size: 200% }` в консоли.",
  ],
  acceptance: [
    "Самопроверка `check.js`: все 21 проверка OK на ширинах 320, 360, 480, 600, 768, 900, 1024, 1280 и 1440px.",
    "Все `@media` — «от малого к большому» с порогом в `rem`; есть хотя бы один `@container`.",
    "`h1` равен формуле (±0.7px) на каждой ширине; отступы секций равны формуле (±0.7px); боковые поля равны `max(1rem, (clientWidth − 64rem) / 2)` (±1px).",
    "При `font-size: 200%` на корневом элементе `scrollWidth ≤ clientWidth` на всех ширинах.",
    "Герой: от 768px текст слева и картинка справа на одной горизонтали, на узких — картинка под текстом; пропорции картинки 4:3, `object-fit: cover`.",
    "Карточка `.feature` при принудительной ширине 40rem показывает иконку слева от текста, при 16rem — над ним (независимо от ширины окна).",
    "Тарифы: число колонок равно `min(3, floor((ширина + gap) / (20rem + gap)))`, колонки равной ширины; кнопки и ссылки меню не ниже 44px; строка не длиннее 66 знаков.",
    "`stylelint` с бюджетом `0,2,0` — 0 нарушений; нет `!important`, `#id`, горизонтальной прокрутки.",
  ],
  hints: [
    "Сначала решите, что от чего зависит. Окно меняет **раскладку страницы** (герой в одну или две колонки) — это `@media`. Ширина карточки меняет **её внутреннее устройство** — это `@container`.",
    "Формулу плавного размера выведите на бумаге: у вас две точки (320px → 32px и 1280px → 64px). Наклон = (64 − 32) / (1280 − 320) = 1/30 пикселя на пиксель = 3.3333vw, сдвиг = 32 − 320/30 = 21.333px = 1.3333rem.",
    "`clamp(min, предпочтительное, max)` обрезает формулу на концах: ниже 320px размер не меньше 2rem, выше 1280px не больше 4rem.",
    "Для контейнерных запросов нужен элемент с `container-type: inline-size`; **сам контейнер запрашивать нельзя**, поэтому стили внутри `@container` относятся к его потомку (`.feature__inner`).",
    "`aspect-ratio: 4 / 3` с `object-fit: cover` обрезает картинку по краям, а не растягивает её: сравните с `object-fit: fill`, которое искажает.",
    "Если на масштабе 200% что-то вылезает, запустите `findOverflow()` из темы об отладке CSS: он покажет элементы, шире родителя (обычно кнопки, заголовки и длинные слова).",
    "Помните про кнопки: цель нажатия — не только размер самой ссылки, но и область вокруг; `min-block-size: 2.75rem` даёт 44px при корневом шрифте 16px.",
  ],
  advanced: [
    "Добавьте тёмную тему через `prefers-color-scheme` и переменные; проверьте контраст пар заново (см. проект с токенами).",
    "Замените `overflow-wrap: anywhere` на `hyphens: auto` и `overflow-wrap: break-word` для заголовков; сравните качество переносов на 200%.",
    "Добавьте `<picture>` с несколькими источниками и `sizes`, подберите `sizes` для героя и проверьте в панели Network, какой файл загружается на 360 и 1280px.",
    "Постройте шкалу типографики для всех шагов (`--step--1 … --step-4`) на `clamp()` с интерполяцией и выведите отступы из неё.",
    "Напишите тест Playwright, который запускает `check.js` на 9 ширинах и дополнительно проверяет масштаб текста 200% и 400% по ширине 320px.",
  ],
  failureModes: [
    "**Desktop-first:** запросы с `max-width` или `width <` перестраивают страницу «вниз»: база написана для широкого экрана, а узкий потом «чинится» исключениями; проверка находит такие запросы по тексту условия.",
    "**Пороги в пикселях:** `(min-width: 768px)` не масштабируется с шрифтом: при увеличенном шрифте переключение происходит слишком рано или слишком поздно.",
    "**Фиксированный `h1`:** `2.5rem` везде — на 1280px заголовок 40px вместо 64px, на 320px — 40px вместо 32px (замер): теряется и плавность, и иерархия.",
    "**`minmax(20rem, 1fr)` без `min()`:** на 320px дорожка не сжимается ниже 20rem и сетка выступает на 31px (336px при ширине 305px), а при масштабе 200% — на 367px (672px).",
    "**Картинка без `aspect-ratio` и `object-fit`:** при исходнике 3:2 вместо 4:3 остаётся 3:2 (замер: 1.500) и `object-fit: fill`; на узком экране она растягивается.",
    "**`@media` вместо `@container`:** карточка меняет вид по ширине окна, а не по своей ширине: в замере при принудительных 40rem и 16rem она осталась «строкой» в обоих случаях на 1280px.",
    "**Нет `overflow-wrap` и `max-inline-size` у кнопок:** при масштабе 200% на 320px (замер на промежуточной версии решения) кнопки выступали на 22–48px, слова в карточках — на 10–11px, итоговая ширина страницы была 353px при окне 305px.",
  ],
  rubric: [
    { criterion: "Mobile-first и запросы", weight: 15, description: "База для узкого экрана, `min-width`/`width >=`, пороги в `rem`, одно перестроение страницы." },
    { criterion: "Плавные размеры", weight: 20, description: "`clamp()`, формула интерполяции, `max()`/`min()` для полей и сеток, отсутствие скачков." },
    { criterion: "Компонент на контейнере", weight: 20, description: "`container-type`, `@container`, внутренний вид зависит от ширины карточки, а не окна." },
    { criterion: "Адаптивные медиа и сетки", weight: 15, description: "`aspect-ratio`, `object-fit`, `auto-fit` с `min()`, герой в одну/две колонки, `svh`." },
    { criterion: "Масштаб текста и касание", weight: 20, description: "200% без горизонтальной прокрутки, перенос слов, `max-inline-size`, цели нажатия ≥ 44px, строка ≤ 66 знаков." },
    { criterion: "Архитектура CSS", weight: 10, description: "Слои, переменные, нет `px` в размерах контейнеров, нет `!important`/`#id`, специфичность ≤ (0,2,0), `:focus-visible`." },
  ],
  solution: [
    p("Эталон — один файл. Он проходит все 21 проверку на 9 ширинах от 320 до 1440px (включая масштаб текста 200%); без стилей та же страница проходит 6 из 21, а семь «плохих» вариантов (desktop-first, пороги в пикселях, фиксированный `h1`, сетка без `min()`, картинка без `aspect-ratio`, `@media` вместо `@container`, нет переноса слов) ловятся своими проверками."),
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
  --tint: #f4f5fb;
  --rule: #d0d3e6;

  --gutter: max(1rem, (100% - 64rem) / 2);
  --space-section: clamp(2rem, 1rem + 5vw, 5rem);
  --step-h1: clamp(2rem, 1.3333rem + 3.3333vw, 4rem);
  --step-h2: clamp(1.5rem, 1.1667rem + 1.6667vw, 2.5rem);
  --radius: 0.75rem;
}

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  body, h1, h2, h3, p, ul, blockquote { margin: 0; }
  ul { padding: 0; list-style: none; }
  img { display: block; max-inline-size: 100%; block-size: auto; }
}

@layer base {
  body { font: 1rem / 1.6 system-ui, sans-serif; color: var(--ink); background: var(--paper); overflow-wrap: anywhere; }
  a { color: var(--accent); }
  :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  h1 { font-size: var(--step-h1); line-height: 1.1; text-wrap: balance; }
  h2 { font-size: var(--step-h2); line-height: 1.2; }
  p { max-inline-size: 65ch; }
}

@layer layout {
  .site-header { display: flex; align-items: center; gap: 1rem; padding: 0.5rem var(--gutter); border-block-end: 1px solid var(--rule); }
  .site-nav { min-inline-size: 0; margin-inline-start: auto; overflow-x: auto; }
  .site-nav ul { display: flex; gap: 0.25rem; }

  .hero { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2rem; align-items: center; padding: var(--space-section) var(--gutter); min-block-size: min(40rem, 80svh); background: var(--tint); }
  .section { padding: var(--space-section) var(--gutter); }
  .section--tint { background: var(--tint); }
  .section > * + * { margin-block-start: 1.5rem; }

  .features { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr)); }
  .plans { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr)); }
  .site-footer { padding: 1.5rem var(--gutter); border-block-start: 1px solid var(--rule); color: var(--muted); }

  @media (width >= 48rem) {
    .hero { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
}

@layer components {
  .logo { font-weight: 700; color: var(--ink); text-decoration: none; }
  .site-nav a { display: flex; align-items: center; min-block-size: 2.75rem; padding-inline: 0.75rem; text-decoration: none; white-space: nowrap; }
  .button { display: inline-flex; align-items: center; justify-content: center; min-block-size: 2.75rem; max-inline-size: 100%; padding-inline: 1.25rem; text-align: center; border-radius: var(--radius); background: var(--accent); color: var(--on-accent); font-weight: 600; text-decoration: none; }

  .hero__text > * + * { margin-block-start: 1rem; }
  .hero__img { inline-size: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: var(--radius); }

  .feature { container-type: inline-size; }
  .feature__inner { display: flex; flex-direction: column; gap: 0.75rem; block-size: 100%; padding: min(1.25rem, 5vw); border: 1px solid var(--rule); border-radius: var(--radius); background: var(--paper); }
  .feature__icon { font-size: 2rem; line-height: 1; }
  .feature h3 { font-size: 1.125rem; }

  @container (min-width: 28rem) {
    .feature__inner { flex-direction: row; align-items: center; gap: 1.25rem; }
  }

  .plan { display: flex; flex-direction: column; gap: 0.75rem; padding: min(1.5rem, 5vw); border: 1px solid var(--rule); border-radius: var(--radius); background: var(--paper); }
  .plan .button { margin-block-start: auto; align-self: flex-start; }
  .plan--featured { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .plan__price { font-size: 1.75rem; font-weight: 700; }

  .review { padding-inline-start: 1rem; border-inline-start: 4px solid var(--accent); font-size: 1.125rem; }
  .review footer { margin-block-start: 0.75rem; font-size: 0.875rem; color: var(--muted); }
}`,
      { filename: "style.css", lineNumbers: true },
    ),
    h("Почему так"),
    ul(
      "**Формулы вместо чисел.** `--step-h1: clamp(2rem, 1.3333rem + 3.3333vw, 4rem)` и `--space-section: clamp(2rem, 1rem + 5vw, 5rem)` — линейная интерполяция между 320 и 1280px, обрезанная на концах. Самопроверка сравнивает реальный размер с формулой на текущей ширине окна.",
      "**Поля.** `--gutter: max(1rem, (100% - 64rem) / 2)`: на узких экранах поля 1rem, на широких — разница между шириной секции и 64rem делится пополам. Одна переменная даёт центрирование контента без обёрток и `max-width` с `margin: auto` в каждом блоке.",
      "**Один `@media`.** Перестраивается только **страница**: герой переходит из одной колонки в две на 48rem. Всё остальное (сетки тарифов и преимуществ) подстраивается само за счёт `auto-fit` и `min()`.",
      "**Компонент на контейнере.** `.feature` — контейнер (`container-type: inline-size`), а запрос `@container (min-width: 28rem)` относится к его потомку `.feature__inner`: контейнер не может запрашивать собственный размер. Поэтому карточка выглядит одинаково в узкой колонке большого экрана и в широкой колонке маленького.",
      "**Картинка.** `aspect-ratio: 4 / 3` и `object-fit: cover` дают одинаковую форму кадра при любой ширине колонки; исходник 3:2 обрезается по краям, а не растягивается.",
      "**Масштаб 200%.** Переносы слов (`overflow-wrap: anywhere`) уменьшают минимальную ширину содержимого, `max-inline-size: 100%` у кнопок не даёт им выйти из карточки, а внутренние отступы карточек ограничены `min(1.5rem, 5vw)`, чтобы при увеличенном корневом шрифте они не съедали ширину.",
      "**Карточка тарифа.** У выбранного тарифа рамка 1px и дополнительная тень `0 0 0 1px`: толщина рамки не меняет размеры содержимого, поэтому кнопки во всех тарифах остаются на одной линии.",
    ),
    h("Самопроверка"),
    p("Скрипт вставляется в консоль страницы. Он читает таблицу стилей (запросы, правила), измеряет геометрию и **временно меняет страницу**: увеличивает корневой шрифт до 200% и задаёт карточке ширину 40rem и 16rem. После каждой проверки значения возвращаются."),
    code(
      "js",
      `// check.js — самопроверка проекта «Адаптивный лендинг»: вставьте в консоль страницы
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const rect = (el) => el.getBoundingClientRect();
  const cs = (el) => getComputedStyle(el);
  const near = (a, b, d = 1) => Math.abs(a - b) <= d;
  const root = document.documentElement;
  const rem = parseFloat(cs(root).fontSize);
  const W = innerWidth;
  const checks = [];
  const add = (name, ok, detail) => checks.push({ проверка: name, итог: ok ? "OK" : "НЕТ", детали: detail });
  const walk = (rules, out = [], ctx = []) => { for (const r of rules) { if (r instanceof CSSStyleRule) out.push(r); else if (r.cssRules) walk(r.cssRules, out, ctx); } return out; };
  const allRules = (rules, out = []) => { for (const r of rules) { out.push(r); if (r.cssRules) allRules(r.cssRules, out); } return out; };
  const sheets = [...document.styleSheets].flatMap((s) => { try { return allRules(s.cssRules); } catch { return []; } });
  const rules = sheets.filter((r) => r instanceof CSSStyleRule);
  const lerp = (min, max, w) => min + (max - min) * Math.min(1, Math.max(0, (w - 320) / 960));      // линейно от 320px до 1280px
  const splitTop = (s) => { const out = []; let d = 0, cur = ""; for (const ch of s) { if (ch === "(" || ch === "[") d++; if (ch === ")" || ch === "]") d--; if (ch === "," && d === 0) { out.push(cur.trim()); cur = ""; } else cur += ch; } return out.concat(cur.trim()); };
  const weight = (sel) => {
    const s = sel.replace(/:where\\([^)]*\\)/g, "").replace(/::?[\\w-]+(\\([^)]*\\))?/g, (m) => (m.startsWith("::") ? " x" : ".p"));
    return [(s.match(/#[\\w-]+/g) || []).length, (s.match(/\\.[\\w-]+|\\[[^\\]]*\\]/g) || []).length, (s.replace(/\\.[\\w-]+|\\[[^\\]]*\\]|#[\\w-]+/g, " ").match(/(^|[\\s>+~])[a-z][\\w-]*/gi) || []).length];
  };

  // 1. запросы: от малого к большому, в относительных единицах
  const media = sheets.filter((r) => r instanceof CSSMediaRule).map((r) => r.conditionText);
  const queries = sheets.filter((r) => r instanceof CSSContainerRule);
  const notMobileFirst = media.filter((c) => /max-width|width\\s*<|<=|max-height/.test(c));
  add("Запросы медиа — только «от малого к большому» (min-width или width >=)", media.length >= 1 && notMobileFirst.length === 0, "запросов: " + media.length + (notMobileFirst.length ? ", нарушают: " + notMobileFirst.join("; ") : ""));
  add("Пороги запросов заданы в rem/em, а не в пикселях", media.every((c) => !/\\d+px/.test(c)), media.join("; ") || "—");
  add("Есть запрос к контейнеру (@container)", queries.length >= 1, "запросов к контейнеру: " + queries.length);

  // 2. плавные размеры
  const h1 = parseFloat(cs($("h1")).fontSize), h1x = lerp(2 * rem, 4 * rem, W);
  add("Заголовок h1 плавно растёт от 2rem (320px) до 4rem (1280px)", near(h1, h1x, 0.7), "сейчас " + h1.toFixed(1) + "px, ожидалось " + h1x.toFixed(1) + "px на " + W + "px");
  const sec = parseFloat(cs($(".section")).paddingTop), secx = lerp(2 * rem, 5 * rem, W);
  add("Вертикальные отступы секций плавно растут от 2rem до 5rem", near(sec, secx, 0.7), "сейчас " + sec.toFixed(1) + "px, ожидалось " + secx.toFixed(1) + "px");
  const padL = parseFloat(cs($(".section")).paddingLeft), padx = Math.max(rem, (root.clientWidth - 64 * rem) / 2);
  add("Боковые поля: не меньше 1rem, контент не шире 64rem (max())", near(padL, padx, 1), "сейчас " + padL.toFixed(0) + "px, ожидалось " + padx.toFixed(0) + "px");

  // 3. горизонтальная прокрутка и масштаб текста
  add("Нет горизонтальной прокрутки", root.scrollWidth <= root.clientWidth, "scrollWidth " + root.scrollWidth + ", clientWidth " + root.clientWidth + " (" + W + "px)");
  root.style.fontSize = "200%";
  const zoomOk = root.scrollWidth <= root.clientWidth;
  const zoomDetail = "scrollWidth " + root.scrollWidth + ", clientWidth " + root.clientWidth;
  root.style.fontSize = "";
  add("При увеличении шрифта до 200% нет горизонтальной прокрутки", zoomOk, zoomDetail);

  // 4. героический блок
  const hero = rect($(".hero")), text = rect($(".hero__text")), img = $(".hero__img"), ir = rect(img);
  const twoCols = W >= 48 * rem;
  add(twoCols ? "Герой в две колонки: текст слева, картинка справа" : "Герой в одну колонку: картинка под текстом", twoCols ? ir.left >= text.right - 1 && Math.abs((ir.top + ir.height / 2) - (text.top + text.height / 2)) < 120 : ir.top >= text.bottom - 1 && near(ir.width, text.width, 2), "текст " + Math.round(text.left) + "–" + Math.round(text.right) + ", картинка " + Math.round(ir.left) + "–" + Math.round(ir.right));
  add("Картинка героя: пропорции 4:3 и object-fit: cover (исходник 3:2)", near(ir.width / ir.height, 4 / 3, 0.02) && cs(img).objectFit === "cover" && near(img.naturalWidth / img.naturalHeight, 1.5, 0.01), "отношение " + (ir.width / ir.height).toFixed(3) + ", object-fit: " + cs(img).objectFit);
  const svhMin = Math.min(40 * rem, 0.8 * innerHeight);
  add("Высота героя: не меньше min(40rem, 80svh)", hero.height >= svhMin - 1 && parseFloat(cs($(".hero")).minHeight) > 0, "высота " + hero.height.toFixed(0) + ", минимум " + svhMin.toFixed(0));

  // 5. компонент на запросе к контейнеру
  const f = $(".feature"), icon = f.querySelector(".feature__icon"), body = f.querySelector(".feature__body");
  const place = (w) => { f.style.inlineSize = w; f.style.maxInlineSize = "none"; const i = rect(icon), b = rect(body); const row = b.left >= i.right - 1 && Math.abs((i.top + i.height / 2) - (b.top + b.height / 2)) < 60; const col = b.top >= i.bottom - 1; f.style.inlineSize = ""; f.style.maxInlineSize = ""; return { row, col }; };
  const wideP = place("40rem"), narrowP = place("16rem");
  add("Карточка преимущества: в широком контейнере — строкой, в узком — столбцом", wideP.row && narrowP.col, "40rem: " + (wideP.row ? "строка" : "столбец") + ", 16rem: " + (narrowP.col ? "столбец" : "строка"));

  // 6. адаптивные сетки
  const plans = $(".plans"), pcols = cs(plans).gridTemplateColumns.split(" ").map(parseFloat), pw = rect(plans).width, pg = parseFloat(cs(plans).columnGap);
  const expCols = Math.min(3, Math.max(1, Math.floor((pw + pg) / (20 * rem + pg))));
  add("Тарифы: число колонок подбирается само (до трёх), без переполнения", pcols.length === expCols && pcols.every((v) => near(v, pcols[0], 1)), "колонок " + pcols.length + " (ожидалось " + expCols + "), ширина " + pcols[0].toFixed(0));
  const featCols = cs($(".features")).gridTemplateColumns.split(" ").length;
  add("Преимущества: сетка подбирает колонки по минимуму 16rem", /auto-fit|auto-fill/.test(sheets.map((r) => r.cssText).join("")) && featCols >= 1, "колонок " + featCols);

  // 7. навигация и касание
  const nav = $(".site-nav"), hdr = rect($(".site-header"));
  add("Меню помещается в шапку или прокручивается внутри себя", rect(nav).right <= hdr.right + 1 && (nav.scrollWidth <= nav.clientWidth || ["auto", "scroll"].includes(cs(nav).overflowX)), "scrollWidth " + nav.scrollWidth + ", clientWidth " + nav.clientWidth + ", overflow-x: " + cs(nav).overflowX);
  const targets = [...$$(".button"), ...$$(".site-nav a")].map((el) => rect(el).height);
  add("Цели нажатия не ниже 44px (кнопки и ссылки меню)", Math.min(...targets) >= 44 - 0.5, "минимум " + Math.min(...targets).toFixed(1) + "px");
  const chOf = (el) => { const probe = document.createElement("span"); probe.style.cssText = "position:absolute;visibility:hidden;width:1ch"; el.append(probe); const w = probe.getBoundingClientRect().width; probe.remove(); return w; };
  const longest = Math.max(...$$("main p").map((p) => rect(p).width / chOf(p)));
  add("Строка текста не длиннее 66 знаков", longest <= 66, "самая широкая колонка ≈ " + longest.toFixed(0) + "ch");

  // 8. архитектура
  const pxWidths = rules.filter((r) => /(^|[;\\s])(width|max-width|min-width|inline-size|max-inline-size|min-inline-size)\\s*:\\s*[^;]*(?<![\\w.])(?:[1-9]\\d*(?:\\.\\d+)?|0\\.\\d*[1-9]\\d*)px/.test(r.style.cssText));
  add("В размерах контейнеров нет пикселей (rem, %, ch, vw, clamp)", pxWidths.length === 0, pxWidths.length ? pxWidths.map((r) => r.selectorText).join(", ") : "width/inline-size без px");
  const imp = rules.filter((r) => /!important/.test(r.cssText)).length, ids = rules.filter((r) => /#[\\w-]+/.test(r.selectorText)).length;
  const max = rules.reduce((m, r) => { const w = splitTop(r.selectorText).map(weight).sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]; return (w[0] - m[0] || w[1] - m[1] || w[2] - m[2]) > 0 ? w : m; }, [0, 0, 0]);
  add("Нет !important и #id; специфичность не выше (0,2,0)", imp === 0 && ids === 0 && max[0] === 0 && (max[1] < 2 || (max[1] === 2 && max[2] === 0)), "!important: " + imp + ", #id: " + ids + ", максимум (" + max.join(",") + ")");
  add("Стили в слоях @layer", sheets.some((r) => r instanceof CSSLayerStatementRule || r instanceof CSSLayerBlockRule), "@layer");
  add("Есть заметный :focus-visible", rules.some((r) => /:focus-visible/.test(r.selectorText) && parseFloat(r.style.outlineWidth || (r.style.outline.match(/(\\d+)px/) || [])[1]) >= 2), ":focus-visible { outline }");

  console.table(checks);
  return checks.every((c) => c.итог === "OK");
})();`,
      { filename: "check.js", lineNumbers: true, collapsed: true },
    ),
    h("Результаты проверки решения"),
    table(
      ["Что проверялось", "Результат"],
      [
        ["Самопроверка на 320, 360, 480, 600, 768, 900, 1024, 1280 и 1440px", "все 21 проверка — OK"],
        ["Та же страница без `style.css`", "6 из 21 проверок проходят"],
        ["Запрос `@media (width < 48rem)` вместо `>=`", "19 из 21 на 1280px: не mobile-first, герой остался в одну колонку"],
        ["Порог `(min-width: 768px)` в пикселях", "20 из 21: порог не в `rem`"],
        ["`h1` фиксированного размера 2.5rem", "20 из 21: 40px вместо 64px на 1280px и вместо 32px на 320px"],
        ["Тарифы `minmax(20rem, 1fr)` без `min()`", "19 из 21 на 320px: `scrollWidth` 336 при `clientWidth` 305; на масштабе 200% — 672"],
        ["Без `aspect-ratio` и `object-fit` у картинки", "20 из 21: отношение 1.500, `object-fit: fill`"],
        ["`@container` заменён на `@media (width >= 80rem)`", "19 из 21: при ширинах карточки 40rem и 16rem вид одинаков"],
        ["Без `overflow-wrap` у `body`", "20 из 21 на 320px: при 200% `scrollWidth` 360 при `clientWidth` 305"],
        ["`stylelint` (`selector-max-id: 0`, `declaration-no-important: true`, `selector-max-specificity: \"0,2,0\"`, `selector-max-compound-selectors: 3`)", "0 нарушений"],
        ["Отчёт по весам (скрипт из темы об управлении специфичностью)", "37 правил, 0 с `#id`, 0 `!important`, максимум (0,2,0) — `.plan .button`; единственное внеслойное правило — `:root`"],
      ],
      "Проверка эталона",
    ),
    warn("Масштаб 200% корневого шрифта — не то же самое, что масштаб страницы: он меняет размеры в `rem` и пороги `@media` в `rem`, но не `px`. Проверяйте оба сценария: увеличенный шрифт и масштаб страницы 200–400% в браузере."),
    tip("Когда страница «ломается» только на одной ширине, не добавляйте ещё один порог: найдите элемент, у которого минимальная ширина содержимого (`min-content`) больше доступной. `findOverflow()` из темы об отладке CSS покажет его."),
  ],
};
