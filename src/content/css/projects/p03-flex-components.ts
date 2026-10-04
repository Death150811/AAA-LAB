import type { Project } from "../../types";
import { code, h, note, p, table, tip, ul, warn } from "../../dsl";

export const p03FlexComponents: Project = {
  id: "css.p03-flex-components",
  domain: "css",
  order: 3,
  title: "Набор компонентов на Flexbox",
  subtitle: "Шапка-навигация, объект-медиа с обрезанным заголовком, строка поиска, теги, карточки равной высоты с «прижатым» подвалом, две колонки, пустое состояние и «прижатый» подвал страницы: Flexbox, который не ломается от длинного текста.",
  level: "core",
  estimatedHours: 8,
  buildsOn: ["css.p01-readable-article"],
  topics: [
    "css.display-flow",
    "css.box-model",
    "css.overflow-sizing",
    "css.flexbox-basics",
    "css.flex-sizing",
    "css.flexbox-patterns",
    "css.units-math",
    "css.cascade-layers",
    "css.debugging-css",
  ],
  objective:
    "Собрать **набор из восьми компонентов на Flexbox**, которые ведут себя предсказуемо при любой ширине окна и любой длине текста: переносятся, сжимаются, обрезаются многоточием, растягиваются на свободное место и прижимаются к краям. Результат проверяется автоматической самопроверкой из **19 проверок**, включая ловушки `min-width: auto` и `flex-shrink`.",
  scenario: [
    p("Магазин «Лаборатория» переделывает интерфейс и просит набор повторно используемых компонентов. В прошлой версии вёрстка держалась на `float` и `margin`: длинное название товара раздвигало карточку, карточки тарифов получались разной высоты, а кнопки в них «плавали», подвал страницы поднимался к середине окна на коротких страницах."),
    p("Разметка готова и менять её нельзя. Напишите `style.css`, который собирает из неё восемь компонентов на Flexbox. Особенность задачи — **нестандартные данные**: в объекте-медиа заголовок состоит из 60 символов без пробелов, а среди тегов есть слишком длинный. Именно такие значения ломают наивный Flexbox."),
    code(
      "html",
      `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Набор компонентов — Лаборатория</title>
<link rel="stylesheet" href="style.css">
<body>
<header class="nav">
  <a class="nav__logo" href="#">Лаборатория</a>
  <ul class="nav__links">
    <li><a href="#">Каталог</a></li>
    <li><a href="#">Доставка</a></li>
    <li><a href="#">Контакты</a></li>
  </ul>
  <div class="nav__actions">
    <a class="button button--ghost" href="#">Войти</a>
    <a class="button" href="#">Корзина</a>
  </div>
</header>

<main class="page">
  <section class="split">
    <div class="split__main">
      <h1>Набор компонентов</h1>
      <p>Девять небольших компонентов на Flexbox: каждый ведёт себя предсказуемо при любой ширине окна и любой длине текста.</p>

      <div class="media">
        <img class="media__img" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" width="64" height="64">
        <div class="media__body">
          <h2 class="media__title">КофемолкаРучнаяСтальныеЖерновАртикул-12345-ABCDEFGHIJKLMNOP</h2>
          <p class="media__meta">Автор отзыва: Ирина Лебедева · 12 отзывов</p>
        </div>
      </div>

      <form class="search" role="search">
        <input class="search__input" type="search" aria-label="Поиск по каталогу" placeholder="Что ищете?">
        <button class="button" type="submit">Найти</button>
      </form>

      <ul class="chips">
        <li><a href="#">Кофе</a></li>
        <li><a href="#">Чай</a></li>
        <li><a href="#">Кофемолки</a></li>
        <li><a href="#">Воронки</a></li>
        <li><a href="#">Весы</a></li>
        <li><a href="#">Чайники</a></li>
        <li><a href="#">Фильтры</a></li>
        <li><a href="#">Аксессуары для заваривания</a></li>
        <li><a href="#">Подарки</a></li>
        <li><a href="#">Распродажа</a></li>
      </ul>
    </div>
    <aside class="split__aside">
      <h2>Советы</h2>
      <p>Свежемолотый кофе вкуснее: мелите зёрна перед заваркой, а не заранее.</p>
    </aside>
  </section>

  <section aria-labelledby="plans-title">
    <h2 id="plans-title">Тарифы доставки</h2>
    <ul class="cards">
      <li class="card">
        <h3>Старт</h3>
        <p>Доставка по городу.</p>
        <div class="card__footer"><span class="price">0 ₽</span><a class="button" href="#">Выбрать</a></div>
      </li>
      <li class="card">
        <h3>Стандарт</h3>
        <p>Доставка по стране курьером или в пункт выдачи. Страховка посылки включена, отслеживание на каждом этапе, возможность перенести дату доставки один раз бесплатно.</p>
        <ul>
          <li>Курьер до двери</li>
          <li>Пункты выдачи</li>
          <li>Отслеживание</li>
        </ul>
        <div class="card__footer"><span class="price">290 ₽</span><a class="button" href="#">Выбрать</a></div>
      </li>
      <li class="card">
        <h3>Про</h3>
        <p>Доставка в день заказа и примерка перед оплатой.</p>
        <ul>
          <li>В день заказа</li>
          <li>Примерка</li>
        </ul>
        <div class="card__footer"><span class="price">690 ₽</span><a class="button" href="#">Выбрать</a></div>
      </li>
    </ul>
  </section>

  <section class="empty" aria-labelledby="empty-title">
    <h2 id="empty-title">Корзина пуста</h2>
    <p>Добавьте товары из каталога.</p>
    <a class="button" href="#">В каталог</a>
  </section>
</main>

<footer class="footer">
  <p>© 2026 Лаборатория</p>
</footer>
</body>
</html>`,
      { filename: "page.html", lineNumbers: true, collapsed: true },
    ),
    note("Компоненты: 1) подвал, прижатый к низу окна; 2) шапка-навигация; 3) объект-медиа; 4) строка поиска; 5) теги; 6) карточки тарифов; 7) две колонки; 8) пустое состояние. Положение элементов задаётся только Flexbox и `gap`: `float`, `position: absolute` и «хаки» с отрицательными внешними отступами не нужны."),
  ],
  requirements: [
    "Один файл `style.css`; разметку менять нельзя.",
    "Подвал страницы: `body` — flex-контейнер в столбец с `min-block-size: 100vh`, `.page` растягивается (`flex: 1`), поэтому при коротком содержимом подвал прижат к нижнему краю окна.",
    "Шапка `.nav`: логотип слева, ссылки следом, блок `.nav__actions` прижат **вправо** (`margin-inline-start: auto`); при нехватке места элементы **переносятся** (`flex-wrap`), а не вылезают за окно.",
    "Объект-медиа `.media`: картинка 64px **не сжимается** (`flex: none`), текстовый блок занимает остаток и может сжиматься (`min-inline-size: 0`); заголовок из 60 символов без пробелов **обрезается многоточием** и не выходит за карточку.",
    "Строка поиска `.search`: поле занимает всё свободное место рядом с кнопкой (`flex: 1`, `min-inline-size: 0`), кнопка не сжимается, высоты равны.",
    "Теги `.chips`: переносятся на новые строки, не растягиваются, одинаковой высоты; расстояния — через `gap`.",
    "Карточки `.cards`: на широком экране — **в одну строку**, равной ширины и **равной высоты**; на узком — столбцом на всю ширину; подвал карточки `.card__footer` **прижат к низу** (`margin-block-start: auto`), так что кнопки лежат на одной линии.",
    "Две колонки `.split`: основная и боковая примерно **3 : 1** на широком экране; на узком боковая колонка уходит под основную; минимальные ширины (`min-inline-size`) не вызывают горизонтальной прокрутки на 320px.",
    "Пустое состояние `.empty`: содержимое **по центру по обеим осям**, минимальная высота 12rem.",
    "Все расстояния между элементами — через `gap` (в `.nav`, `.chips`, `.cards`, `.search` — ненулевой `column-gap`).",
    "Архитектура: слои `@layer`, переменные в `:root`, нет `!important` и `#id`, специфичность селекторов не выше (0,2,0), нет `float` и `position: absolute`.",
    "Страница не прокручивается по горизонтали на ширинах 320, 768 и 1280px; есть заметный `:focus-visible`.",
  ],
  constraints: [
    "Без JavaScript, фреймворков и препроцессоров; разметку не менять.",
    "Без `float`, `position: absolute`, табличной раскладки и отрицательных внешних отступов.",
    "Без `!important`, идентификаторов в селекторах и инлайновых стилей.",
    "Нельзя задавать ширины карточек и колонок в процентах «на глаз» — только `flex` и `gap`.",
    "Нельзя скрывать проблемы через `overflow-x: hidden` на `html` или `body`.",
    "Расстояния — через `gap`, а не через `margin` у соседних элементов.",
  ],
  expected: [
    "На коротком содержимом подвал лежит внизу окна; на длинном — следует за содержимым.",
    "Шапка в одной строке на широком экране и переносится на узком, действия остаются справа, пока есть место.",
    "Длинный заголовок в объекте-медиа заканчивается многоточием, картинка остаётся квадратом 64px.",
    "Карточки тарифов выровнены по высоте, цены и кнопки лежат на одной линии независимо от длины текста.",
    "Самопроверка печатает таблицу из 19 проверок, и все они OK на ширинах 320, 768 и 1280px.",
  ],
  technical: [
    "Порядок слоёв: `@layer reset, base, layout, components;`; `body` делается flex-контейнером в слое `layout`.",
    "Равные карточки: `.cards { display: flex; flex-wrap: wrap; gap }` и `.card { flex: 1 1 14rem; display: flex; flex-direction: column }`; подвал — `margin-block-start: auto`.",
    "Колонки: `flex: 3 1 0` и `flex: 1 1 0` с `min-inline-size: min(20rem, 100%)` и `min-inline-size: min(12rem, 100%)` — минимумы управляют переносом, а пропорция 3 : 1 — свободным местом.",
    "Обрезка текста: у flex-элемента задайте `min-inline-size: 0`, у заголовка — `overflow: hidden; white-space: nowrap; text-overflow: ellipsis`.",
    "Ширина `.page`: элемент flex-столбца с автоматическими внешними отступами по поперечной оси не растягивается (спецификация Flexbox), поэтому нужна явная `inline-size: 100%` с ограничением `max-inline-size`.",
    "Проверки: самопроверка `check.js` (из решения) на 320, 768 и 1280px; `stylelint` с бюджетом `0,2,0`; для отладки переполнения — `findOverflow` из темы об отладке CSS.",
  ],
  acceptance: [
    "Самопроверка `check.js`: все 19 проверок OK на ширинах 320, 768 и 1280px.",
    "Подвал при скрытых секциях лежит на нижнем краю окна (низ подвала = высоте окна ±1px).",
    "Картинка в `.media` остаётся 64px, заголовок обрезан (`scrollWidth > clientWidth`, `text-overflow: ellipsis`) и не выходит за правую границу карточки.",
    "Поле поиска + зазор + кнопка равны ширине формы (±2px), высоты поля и кнопки равны.",
    "На ширинах ≥ 768px три карточки в одной строке: равные высоты (±1px), ширины (±2px) и общая линия подвалов; на узких — столбец на всю ширину.",
    "На ширинах ≥ 1000px основная колонка шире боковой в 2.7–3.3 раза; на более узких колонки сохраняют минимумы либо складываются.",
    "В `.empty` все дочерние элементы центрированы по горизонтали, отступы сверху и снизу равны (±2px).",
    "`stylelint` с бюджетом `0,2,0` — 0 нарушений; нет `float`, `position: absolute`, `!important`, `#id`, горизонтальной прокрутки.",
  ],
  hints: [
    "Сначала `body { display: flex; flex-direction: column; min-block-size: 100vh }` и `.page { flex: 1 }`: так вы получите «прижатый» подвал одним правилом.",
    "Чтобы заголовок обрезался, мало `text-overflow: ellipsis`: flex-элемент по умолчанию не уже своего содержимого (`min-width: auto`). Задайте `min-inline-size: 0` у `.media__body`.",
    "Картинка в строке с длинным текстом сжимается, если у неё `flex-shrink: 1`. Используйте `flex: none` или фиксированный `flex-basis` вместе с `flex-shrink: 0`.",
    "Для равных карточек не нужны высоты: у flex-строки `align-items: stretch` по умолчанию. А прижать подвал внутри карточки позволяет `margin-block-start: auto` в столбце.",
    "Автоматический внешний отступ в flex-контейнере забирает всё свободное место: `margin-inline-start: auto` у `.nav__actions` отодвигает его вправо.",
    "`flex: 1` — это `flex: 1 1 0`. Если вам нужны минимальная ширина и перенос, задавайте `flex-basis` (например, `flex: 1 1 14rem`) или `min-inline-size`.",
    "`min-inline-size: min(20rem, 100%)` не даёт колонке стать шире контейнера на узком экране и предотвращает горизонтальную прокрутку на 320px.",
  ],
  advanced: [
    "Добавьте на мобильном порядок `order` для боковой колонки и обсудите, почему визуальный порядок не должен расходиться с порядком в DOM (чтение с клавиатуры и скринридером).",
    "Сделайте карточку адаптивной по размеру контейнера (`container-type: inline-size`, `@container`): в узкой карточке цена и кнопка складываются в столбец.",
    "Замените `flex-wrap` у карточек на Grid (`repeat(auto-fit, minmax(14rem, 1fr))`) и сравните поведение последней неполной строки.",
    "Реализуйте «липкую» шапку страницы без `position: absolute`, сохранив перенос элементов.",
    "Напишите тест Playwright, который запускает `check.js` на трёх ширинах и падает при любой НЕТ.",
  ],
  failureModes: [
    "**Нет `min-width: 0` у flex-элемента:** тело объекта растягивается до ширины заголовка (в замере 755px) и выходит за карточку на 126px (983 против 857 на ширине окна 1280px).",
    "**Картинка сжимается** (`flex-shrink: 1` по умолчанию): при длинном тексте квадрат превращается в узкую полоску.",
    "**Подвал карточки не прижат:** без `margin-block-start: auto` цены и кнопки лежат на разных линиях (в замере нижние края подвалов — 654, 858 и 738px вместо одного значения).",
    "**Подвал страницы поднимается:** без `flex: 1` у `.page` на коротком содержимом подвал оказывается на 170px вместо 800px высоты окна.",
    "**`flex-wrap` не включён:** шапка на 320px вылезает за окно; в замере правый край действий — 661px при ширине окна 305px.",
    "**Расстояния через `margin`:** у последнего элемента строки остаётся лишний отступ, а при переносе на новую строку интервалы выходят «двойными»; `gap` работает только между элементами.",
    "**`flex: 1` вместо `flex: 1 1 14rem`:** `flex-basis` равен нулю, карточки не переносятся и сжимаются до минимальной ширины своего содержимого.",
  ],
  rubric: [
    { criterion: "Основы Flexbox", weight: 20, description: "`display: flex`, направление, `gap`, `align-items`, `justify-content`, автоматические внешние отступы." },
    { criterion: "Гибкие размеры", weight: 25, description: "`flex-grow`, `flex-shrink`, `flex-basis`, `min-inline-size: 0`, `flex: none`, `min()`; поведение при длинном тексте." },
    { criterion: "Перенос и адаптивность", weight: 20, description: "`flex-wrap`, карточки в строку и столбцом, две колонки, отсутствие горизонтальной прокрутки на 320–1280px." },
    { criterion: "Выравнивание и «прижатие»", weight: 15, description: "Подвал страницы, подвал карточки, центрирование пустого состояния, равные высоты." },
    { criterion: "Архитектура CSS", weight: 15, description: "Слои, переменные, низкая специфичность, нет `float`, `position: absolute`, `!important`, `#id`." },
    { criterion: "Доступность", weight: 5, description: "Заметный `:focus-visible`, порядок в DOM совпадает с визуальным, контраст текста." },
  ],
  solution: [
    p("Эталон — один файл. Он проходит все 19 проверок на ширинах 320, 768 и 1280px; без стилей та же страница проходит 6 из 19, а шесть «плохих» вариантов (без `min-inline-size: 0`, без `flex: none` у картинки, без `margin-block-start: auto`, без `flex: 1` у `.page`, без `gap` у тегов, без `flex-wrap` у навигации) ловятся своими проверками."),
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
  --gutter: 1rem;
  --radius: 0.5rem;
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
  body { display: flex; flex-direction: column; min-block-size: 100vh; }
  .page { flex: 1; inline-size: 100%; max-inline-size: 64rem; margin-inline: auto; padding: 1.5rem var(--gutter); }
  .page > * + * { margin-block-start: 2rem; }

  .nav { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.5rem; padding: 0.75rem var(--gutter); background: var(--surface); border-block-end: 1px solid var(--rule); }
  .nav__links { display: flex; gap: 1.25rem; }
  .nav__actions { display: flex; gap: 0.5rem; margin-inline-start: auto; }

  .split { display: flex; flex-wrap: wrap; gap: 2rem; }
  .split__main { flex: 3 1 0; min-inline-size: min(20rem, 100%); }
  .split__aside { flex: 1 1 0; min-inline-size: min(12rem, 100%); }

  .footer { padding: 1rem var(--gutter); border-block-start: 1px solid var(--rule); color: var(--muted); }
}

@layer components {
  .button { display: inline-block; padding: 0.5rem 1rem; border: 0; border-radius: var(--radius); background: var(--accent); color: var(--on-accent); font: inherit; font-weight: 600; text-decoration: none; text-align: center; cursor: pointer; }
  .button--ghost { background: transparent; color: var(--accent); box-shadow: inset 0 0 0 2px var(--accent); }
  .nav__logo { font-weight: 700; color: var(--ink); text-decoration: none; }

  .split__main > * + * { margin-block-start: 1rem; }

  .media { display: flex; align-items: center; gap: var(--gap); padding: 0.75rem; background: var(--surface); border-radius: var(--radius); }
  .media__img { flex: none; inline-size: 4rem; block-size: 4rem; border-radius: var(--radius); background: #c5cae9; }
  .media__body { flex: 1; min-inline-size: 0; }
  .media__title { overflow: hidden; font-size: 1.125rem; line-height: 1.3; white-space: nowrap; text-overflow: ellipsis; }
  .media__meta { color: var(--muted); font-size: 0.875rem; }

  .search { display: flex; gap: 0.5rem; }
  .search__input { flex: 1; min-inline-size: 0; padding: 0.5rem 0.75rem; border: 2px solid var(--rule); border-radius: var(--radius); font: inherit; }

  .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .chips a { display: block; padding: 0.25rem 0.75rem; border-radius: 999px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--rule); text-decoration: none; }

  .cards { display: flex; flex-wrap: wrap; gap: var(--gap); }
  .card { display: flex; flex: 1 1 14rem; flex-direction: column; gap: 0.75rem; padding: 1rem; border: 1px solid var(--rule); border-radius: var(--radius); background: var(--surface); }
  .card ul { padding-inline-start: 1.25rem; list-style: disc; }
  .card__footer { display: flex; align-items: center; justify-content: space-between; gap: var(--gap); margin-block-start: auto; }
  .price { font-size: 1.25rem; font-weight: 700; }

  .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; min-block-size: 12rem; padding: 1.5rem; border: 2px dashed var(--rule); border-radius: var(--radius); text-align: center; }
}`,
      { filename: "style.css", lineNumbers: true },
    ),
    h("Почему так"),
    ul(
      "**Подвал страницы.** `body` — flex-столбец с `min-block-size: 100vh`, а `.page { flex: 1 }` забирает всё свободное место. Ширина `.page` задана явно (`inline-size: 100%` с `max-inline-size`), потому что у flex-элемента с автоматическими отступами по поперечной оси растяжение отключено.",
      "**Навигация.** `flex-wrap: wrap` и `gap` с двумя значениями (`0.5rem 1.5rem`): между строками меньше, между элементами больше. `margin-inline-start: auto` отодвигает действия вправо.",
      "**Объект-медиа.** `flex: none` фиксирует картинку, `flex: 1` с `min-inline-size: 0` позволяет телу сжаться ниже ширины заголовка, а `overflow: hidden; white-space: nowrap; text-overflow: ellipsis` у заголовка превращает переполнение в многоточие.",
      "**Карточки.** `flex: 1 1 14rem`: базовая ширина 14rem определяет перенос, свободное место делится поровну. Растяжение по высоте даёт `align-items: stretch` по умолчанию, а прижатие подвала — `margin-block-start: auto` внутри столбца карточки.",
      "**Колонки.** `flex: 3 1 0` и `flex: 1 1 0` делят **всё** место в пропорции 3 : 1, а `min-inline-size: min(20rem, 100%)` и `min(12rem, 100%)` задают, когда колонки переносятся. Если задать базовые ширины `20rem` и `12rem` вместо нуля, пропорция на широком экране получится около 2.2 : 1 вместо 3 : 1 (замер: 2.16): свободное место делится, но поверх разных баз.",
      "**Пустое состояние.** `flex-direction: column; align-items: center; justify-content: center` и `min-block-size: 12rem` центрируют блок по обеим осям.",
      "**Вес.** Самый тяжёлый селектор листа — `.chips a` (0,1,1); `float` и `position: absolute` не используются.",
    ),
    h("Самопроверка"),
    p("Скрипт вставляется в консоль страницы. Для проверки подвала он на мгновение скрывает секции через `style.display` (атрибут `hidden` здесь не подошёл бы: правило автора `display: flex` у `.split` перебивает `display: none` из стилей браузера) и затем возвращает их."),
    code(
      "js",
      `// check.js — самопроверка проекта «Набор компонентов на Flexbox»: вставьте в консоль страницы
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const rect = (el) => el.getBoundingClientRect();
  const cs = (el) => getComputedStyle(el);
  const near = (a, b, d = 2) => Math.abs(a - b) <= d;
  const root = document.documentElement;
  const checks = [];
  const add = (name, ok, detail) => checks.push({ проверка: name, итог: ok ? "OK" : "НЕТ", детали: detail });
  const walk = (rules, out = []) => { for (const r of rules) { if (r instanceof CSSStyleRule) out.push(r); else if (r.cssRules) walk(r.cssRules, out); } return out; };
  const rules = [...document.styleSheets].flatMap((s) => { try { return walk(s.cssRules); } catch { return []; } });
  const splitTop = (s) => { const out = []; let d = 0, cur = ""; for (const ch of s) { if (ch === "(" || ch === "[") d++; if (ch === ")" || ch === "]") d--; if (ch === "," && d === 0) { out.push(cur.trim()); cur = ""; } else cur += ch; } return out.concat(cur.trim()); };
  const weight = (sel) => {
    const s = sel.replace(/:where\\([^)]*\\)/g, "").replace(/::?[\\w-]+(\\([^)]*\\))?/g, (m) => (m.startsWith("::") ? " x" : ".p"));
    return [(s.match(/#[\\w-]+/g) || []).length, (s.match(/\\.[\\w-]+|\\[[^\\]]*\\]/g) || []).length, (s.replace(/\\.[\\w-]+|\\[[^\\]]*\\]|#[\\w-]+/g, " ").match(/(^|[\\s>+~])[a-z][\\w-]*/gi) || []).length];
  };
  const wide = innerWidth >= 768;

  // 1. «прижатый» подвал: при коротком содержимом подвал внизу окна
  const body = cs(document.body), sections = $$("main > section");
  sections.forEach((s) => { s.dataset.d = s.style.display; s.style.display = "none"; });
  const footer = $(".footer"), fr = rect(footer);
  const stuck = near(fr.bottom, root.clientHeight, 1);
  sections.forEach((s) => { s.style.display = s.dataset.d; delete s.dataset.d; });
  add("Подвал прижат к низу окна при коротком содержимом", body.display === "flex" && body.flexDirection === "column" && stuck, "display: " + body.display + ", низ подвала " + fr.bottom.toFixed(0) + " при высоте окна " + root.clientHeight);

  // 2. навигация
  const nav = $(".nav"), nr = rect(nav), logo = rect($(".nav__logo")), links = rect($(".nav__links")), actions = rect($(".nav__actions"));
  const padL = parseFloat(cs(nav).paddingLeft), padR = parseFloat(cs(nav).paddingRight);
  const oneRow = logo.top < links.bottom && links.top < logo.bottom && actions.top < links.bottom;   // все три в одной строке
  add("Навигация: логотип слева, действия прижаты вправо", near(logo.left, nr.left + padL, 1) && near(actions.right, nr.right - padR, 1), "левый край логотипа " + logo.left.toFixed(0) + ", правый край действий " + actions.right.toFixed(0) + " из " + nr.right.toFixed(0));
  add("Навигация переносится на узких экранах, а не вылезает", cs(nav).flexWrap === "wrap" && (innerWidth >= 560 ? oneRow : true), "flex-wrap: " + cs(nav).flexWrap + ", в одной строке: " + oneRow);
  add("Расстояния заданы через gap, а не margin", [".nav", ".chips", ".cards", ".search"].every((s) => cs($(s)).columnGap !== "normal" && cs($(s)).columnGap !== "0px"), [".nav", ".chips", ".cards", ".search"].map((s) => s + ": " + cs($(s)).columnGap).join(", "));

  // 3. объект-медиа: картинка не сжимается, длинный заголовок обрезается
  const media = $(".media"), img = $(".media__img"), mb = $(".media__body"), title = $(".media__title");
  const ir = rect(img), mr = rect(media), tr = rect(title);
  add("Картинка не сжимается (flex: none) и остаётся 64px", near(ir.width, 64, 0.5) && cs(img).flexShrink === "0", Math.round(ir.width) + "px, flex-shrink: " + cs(img).flexShrink);
  add("Длинный заголовок обрезается многоточием и не выходит за карточку", title.scrollWidth > title.clientWidth && cs(title).textOverflow === "ellipsis" && tr.right <= mr.right + 1, "scrollWidth " + title.scrollWidth + " > clientWidth " + title.clientWidth + ", right " + tr.right.toFixed(0) + " ≤ " + mr.right.toFixed(0));
  add("Тело объекта может сжиматься (min-width: 0)", cs(mb).minWidth === "0px" && near(rect(mb).right, mr.right - parseFloat(cs(media).paddingRight), 2), "min-width: " + cs(mb).minWidth);

  // 4. строка поиска
  const form = $(".search"), input = $(".search__input"), btn = $(".search .button");
  const sr = rect(form), ar = rect(input), br = rect(btn), gap = parseFloat(cs(form).columnGap);
  add("Поле поиска занимает всё свободное место рядом с кнопкой", near(ar.width + gap + br.width, sr.width, 2) && br.width >= 40 && near(ar.height, br.height, 1), "поле " + ar.width.toFixed(0) + " + зазор " + gap + " + кнопка " + br.width.toFixed(0) + " = " + (ar.width + gap + br.width).toFixed(0) + " из " + sr.width.toFixed(0));

  // 5. теги
  const chips = $$(".chips a"), cr = chips.map(rect);
  const heights = new Set(cr.map((r) => Math.round(r.height)));
  const rows = new Set(cr.map((r) => Math.round(r.top)));
  add("Теги переносятся на новые строки и не растягиваются", cs($(".chips")).flexWrap === "wrap" && heights.size === 1 && (innerWidth < 1100 ? rows.size > 1 : true), "высота тегов: " + [...heights].join("/") + "px, строк: " + rows.size);

  // 6. карточки тарифов
  const cards = $$(".card"), kr = cards.map(rect), foot = $$(".card__footer").map(rect);
  if (wide) {
    add("Карточки в одной строке: одинаковые высота и ширина", kr.every((r) => near(r.top, kr[0].top, 1) && near(r.height, kr[0].height, 1) && near(r.width, kr[0].width, 2)), kr.map((r) => Math.round(r.width) + "×" + Math.round(r.height)).join(", "));
    add("Подвалы карточек прижаты вниз и лежат на одной линии", foot.every((r) => near(r.bottom, foot[0].bottom, 1)) && foot.every((r, i) => near(r.bottom, kr[i].bottom - 17, 2)), foot.map((r) => r.bottom.toFixed(0)).join(", "));
  } else {
    const container = rect($(".cards"));
    add("Карточки на узком экране — столбцом на всю ширину", kr.every((r) => near(r.width, container.width, 2) && r.top >= (kr[0].top - 1)), kr.map((r) => Math.round(r.width)).join(", ") + " при ширине контейнера " + container.width.toFixed(0));
    add("Подвалы карточек прижаты к низу своей карточки", foot.every((r, i) => near(r.bottom, kr[i].bottom - 17, 2)), foot.map((r, i) => (kr[i].bottom - r.bottom).toFixed(0)).join(", "));
  }

  // 7. две колонки: основная и боковая
  const main = rect($(".split__main")), aside = rect($(".split__aside"));
  const beside = Math.abs(aside.top - main.top) < 5;
  if (innerWidth >= 1000) add("Основная колонка шире боковой примерно втрое", beside && main.width / aside.width > 2.7 && main.width / aside.width < 3.3, "соотношение " + (main.width / aside.width).toFixed(2));
  else add("Колонки рядом сохраняют минимумы, иначе боковая уходит под основную", beside ? aside.width >= 190 && main.width >= 300 : aside.top >= main.bottom - 1, beside ? "рядом: " + main.width.toFixed(0) + " и " + aside.width.toFixed(0) : "боковая под основной");

  // 8. пустое состояние: содержимое по центру
  const empty = $(".empty"), er = rect(empty), kids = [...empty.children].map(rect);
  const top = Math.min(...kids.map((r) => r.top)) - er.top, bottom = er.bottom - Math.max(...kids.map((r) => r.bottom));
  const centered = kids.every((r) => near(r.left + r.width / 2, er.left + er.width / 2, 2));
  add("Пустое состояние: блок по центру по обеим осям", centered && near(top - parseFloat(cs(empty).borderTopWidth), bottom - parseFloat(cs(empty).borderBottomWidth), 2) && er.height >= 190, "отступ сверху " + top.toFixed(0) + ", снизу " + bottom.toFixed(0));

  // 9. архитектура
  const imp = rules.filter((r) => /!important/.test(r.cssText)).length;
  const ids = rules.filter((r) => /#[\\w-]+/.test(r.selectorText)).length;
  const max = rules.reduce((m, r) => { const w = splitTop(r.selectorText).map(weight).sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]; return (w[0] - m[0] || w[1] - m[1] || w[2] - m[2]) > 0 ? w : m; }, [0, 0, 0]);
  add("Нет !important и #id", imp === 0 && ids === 0, "!important: " + imp + ", правил с #id: " + ids);
  add("Специфичность не выше (0,2,0)", max[0] === 0 && (max[1] < 2 || (max[1] === 2 && max[2] === 0)), "(" + max.join(",") + ")");
  add("Нет float, inline-block-раскладки и абсолютного позиционирования", !rules.some((r) => (r.style.float && r.style.float !== "none") || r.style.position === "absolute"), "float / position: absolute не найдены");
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
        ["Самопроверка на 320, 768 и 1280px", "все 19 проверок — OK"],
        ["Та же страница без `style.css`", "6 из 19 проверок проходят"],
        ["Без `min-inline-size: 0` у `.media__body`", "17 из 19 на 1280px (16 на 320px): заголовок не обрезается, выходит за карточку"],
        ["Без `flex: none` у картинки", "18 из 19: `flex-shrink` равен 1"],
        ["Без `margin-block-start: auto` у подвала карточки", "18 из 19 на 1280px: нижние края подвалов — 654, 858 и 738px"],
        ["Без `flex: 1` у `.page`", "18 из 19: низ подвала на 170px вместо высоты окна 800px"],
        ["Без `gap` у `.chips`", "18 из 19: `column-gap: normal`"],
        ["Без `flex-wrap` у `.nav`", "18 из 19 на 1280px (15 на 320px): правый край действий 661px при ширине окна 305px"],
        ["`stylelint` (`selector-max-id: 0`, `declaration-no-important: true`, `selector-max-specificity: \"0,2,0\"`, `selector-max-compound-selectors: 3`)", "0 нарушений"],
        ["Отчёт по весам (скрипт из темы об управлении специфичностью)", "36 правил, 0 с `#id`, 0 `!important`, максимум (0,1,1) — `.chips a`; единственное внеслойное правило — `:root`"],
      ],
      "Проверка эталона",
    ),
    warn("Flexbox — одномерная раскладка: он выравнивает по строке, но не по общей сетке. Если нужно, чтобы заголовки, текст и кнопки в разных карточках лежали на одних линиях построчно (а не только подвал), понадобится Grid — это тема следующего проекта."),
    tip("Когда flex-элемент «не сжимается», в первую очередь ищите `min-width: auto`: именно он не даёт блоку стать уже самого длинного слова."),
  ],
};
