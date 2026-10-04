import type { Project } from "../../types";
import { code, h, note, p, table, tip, ul, warn } from "../../dsl";

export const p02InterfaceLayers: Project = {
  id: "css.p02-interface-layers",
  domain: "css",
  order: 2,
  title: "Слои интерфейса",
  subtitle: "Липкая шапка, выпадающее меню, значки, подсказки, окно на :target, кнопка «Наверх» и прилипающая шапка таблицы: позиционирование, содержащие блоки и контексты наложения — без `z-index: 99999` и без JavaScript.",
  level: "core",
  estimatedHours: 8,
  buildsOn: ["css.p01-readable-article"],
  topics: [
    "css.display-flow",
    "css.box-model",
    "css.overflow-sizing",
    "css.positioning",
    "css.containing-block",
    "css.stacking-contexts",
    "css.pseudo-classes-elements",
    "css.cascade-layers",
    "css.debugging-css",
  ],
  objective:
    "Расставить элементы интерфейса по «этажам» страницы с помощью **позиционирования** и **контекстов наложения**: `sticky` для шапки и шапки таблицы, `absolute` для меню и значков, `fixed` для кнопки и окна, подсказки поверх соседних карточек — с **шкалой `z-index` на переменных** и проверкой каждого поведения автоматической самопроверкой.",
  scenario: [
    p("Интернет-магазин кухонных принадлежностей «Лаборатория» просит собрать «каркас» интерфейса без скриптов. Разметка уже готова (она ниже и менять её нельзя), нужно написать `style.css`: шапка остаётся на месте при прокрутке, меню открывается поверх страницы, у карточек появляются значки и подсказки, окно подписки открывается по ссылке, а шапка таблицы остаётся видимой внутри прокручиваемого блока."),
    p("Главная трудность — **наложение**. Карточка при наведении должна приподниматься (`transform`) и получать тень, а её подсказка — выступать **поверх соседних карточек**. Это классическая ловушка: `transform` создаёт контекст наложения, и подсказка оказывается под следующей карточкой. Вам нужно понять причину и решить её без «магических» чисел."),
    code(
      "html",
      `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Слои интерфейса — Лаборатория</title>
<link rel="stylesheet" href="style.css">
<body>
<header class="site-header">
  <a class="logo" href="#top">Лаборатория</a>
  <nav aria-label="Основная">
    <details class="menu">
      <summary>Разделы</summary>
      <ul class="menu__panel">
        <li><a class="menu__link" href="#cards">Карточки</a></li>
        <li><a class="menu__link" href="#orders">Таблица заказов</a></li>
        <li><a class="menu__link" href="#modal">Подписка</a></li>
      </ul>
    </details>
  </nav>
</header>

<main id="top">
  <h1>Слои интерфейса</h1>
  <p class="lead">Меню, подсказки, окно подписки и липкие элементы живут на разных «этажах» страницы. Ваша задача — расставить их без хаков с огромными значениями <code>z-index</code>.</p>

  <section id="cards" aria-labelledby="cards-title">
    <h2 id="cards-title">Карточки</h2>
    <ul class="cards">
      <li class="card">
        <span class="badge">Новое</span>
        <h3><a class="card__link" href="#cards" aria-describedby="tip-1">Кофемолка</a></h3>
        <p>Стальные жернова, двенадцать режимов помола.</p>
        <span class="tip" role="tooltip" id="tip-1">В наличии: 14 шт. Доставка завтра.</span>
      </li>
      <li class="card">
        <h3><a class="card__link" href="#cards" aria-describedby="tip-2">Воронка</a></h3>
        <p>Керамика, подходит для чашек и колб.</p>
        <span class="tip" role="tooltip" id="tip-2">В наличии: 6 шт. Доставка завтра.</span>
      </li>
      <li class="card">
        <span class="badge">Скидка</span>
        <h3><a class="card__link" href="#cards" aria-describedby="tip-3">Весы</a></h3>
        <p>Точность до 0,1 грамма и таймер.</p>
        <span class="tip" role="tooltip" id="tip-3">В наличии: 3 шт. Доставка завтра.</span>
      </li>
      <li class="card">
        <h3><a class="card__link" href="#cards" aria-describedby="tip-4">Чайник</a></h3>
        <p>Узкий носик и термометр на крышке.</p>
        <span class="tip" role="tooltip" id="tip-4">Нет в наличии. Ожидаем поставку.</span>
      </li>
    </ul>
  </section>

  <section id="orders" aria-labelledby="orders-title">
    <h2 id="orders-title">Таблица заказов</h2>
    <div class="table-wrap" role="region" aria-labelledby="orders-title" tabindex="0">
      <table>
        <thead>
          <tr><th scope="col">№</th><th scope="col">Клиент</th><th scope="col">Товар</th><th scope="col">Сумма</th></tr>
        </thead>
        <tbody>
          <tr><td>1001</td><td>Ирина</td><td>Кофемолка</td><td>4 900 ₽</td></tr>
          <tr><td>1002</td><td>Пётр</td><td>Воронка</td><td>1 200 ₽</td></tr>
          <tr><td>1003</td><td>Марина</td><td>Весы</td><td>2 700 ₽</td></tr>
          <tr><td>1004</td><td>Олег</td><td>Чайник</td><td>3 100 ₽</td></tr>
          <tr><td>1005</td><td>Анна</td><td>Кофемолка</td><td>4 900 ₽</td></tr>
          <tr><td>1006</td><td>Игорь</td><td>Весы</td><td>2 700 ₽</td></tr>
          <tr><td>1007</td><td>Лена</td><td>Воронка</td><td>1 200 ₽</td></tr>
          <tr><td>1008</td><td>Сергей</td><td>Чайник</td><td>3 100 ₽</td></tr>
          <tr><td>1009</td><td>Вера</td><td>Весы</td><td>2 700 ₽</td></tr>
          <tr><td>1010</td><td>Денис</td><td>Кофемолка</td><td>4 900 ₽</td></tr>
          <tr><td>1011</td><td>Нина</td><td>Воронка</td><td>1 200 ₽</td></tr>
          <tr><td>1012</td><td>Глеб</td><td>Чайник</td><td>3 100 ₽</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <p><a class="button" href="#modal">Подписаться на новости</a></p>

  <div class="spacer" aria-hidden="true"></div>
</main>

<a class="to-top" href="#top">Наверх</a>

<div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="modal__dialog">
    <h2 id="modal-title">Подписка на новости</h2>
    <p>Раз в месяц присылаем подборку новых товаров. Без спама.</p>
    <p><a class="button" href="#top">Закрыть</a></p>
  </div>
</div>
</body>
</html>`,
      { filename: "page.html", lineNumbers: true, collapsed: true },
    ),
    note("Окно подписки открывается псевдоклассом `:target`: ссылка `href=\"#modal\"` делает элемент с `id=\"modal\"` целью перехода, а `.modal:target` его показывает. Это приём без JavaScript, но у него есть ограничения (нет ловушки фокуса и закрытия по Esc) — их вы обсудите в разделе «Усложнение»."),
  ],
  requirements: [
    "Один файл `style.css`; разметку менять нельзя.",
    "Шапка `.site-header`: `position: sticky; top: 0`, остаётся на месте при прокрутке и **перекрывает** прокручиваемый контент.",
    "Меню `.menu` (`details`): панель `.menu__panel` — `absolute` под кнопкой, выровнена по правому краю блока меню, **не меняет высоту страницы** при открытии и лежит поверх контента.",
    "Значок `.badge` привязан к правому верхнему углу карточки (`absolute` внутри `relative`), отступ 4–14px от краёв.",
    "Карточка при наведении и при фокусе внутри (`:hover`, `:focus-within`) приподнимается на 2px (`transform`) и получает тень.",
    "Подсказка `.tip` (роль `tooltip`) скрыта по умолчанию (`visibility: hidden`), показывается при наведении и фокусе и **лежит поверх соседних карточек**; ширина подсказки не выходит за карточку.",
    "Окно `.modal` — `position: fixed` на весь экран, по умолчанию скрыто, показывается по `:target`, затемнение **перекрывает липкую шапку**, диалог — по центру; ссылка «Закрыть» (`#top`) его скрывает.",
    "Кнопка `.to-top` — `fixed` в правом нижнем углу (16px от краёв).",
    "Шапка таблицы `thead th` — `sticky` внутри блока `.table-wrap` (`max-block-size`, `overflow: auto`) и остаётся над строками при прокрутке блока.",
    "Шкала `z-index`: не менее трёх переменных `--z-*` в `:root`; в правилах — только `var(--z-…)` или целые от −10 до 10; значения больше 10 — только в переменных.",
    "Архитектура: слои (`@layer`), переменные, **ни одного `!important` и `#id`**, специфичность селекторов не выше (0,2,0).",
    "Нет горизонтальной прокрутки страницы на ширинах 320, 768 и 1280px; без JavaScript.",
  ],
  constraints: [
    "Без JavaScript, фреймворков и препроцессоров.",
    "Без `!important`, идентификаторов в селекторах и инлайновых стилей; разметку не менять.",
    "Никаких `z-index` с числами больше 10 в правилах — только переменные из шкалы.",
    "Подсказку нельзя вынести из карточки и нельзя показывать «всегда»: поведение — на `:hover` и `:focus-within`.",
    "Нельзя прятать проблемы наложения через `overflow: hidden` на карточках или на `main`.",
    "Положение элементов — логическими свойствами (`inset-block-start`, `inset-inline-end`), где это возможно.",
  ],
  expected: [
    "Шапка не уезжает при прокрутке, выпадающее меню открывается под ней и закрывает контент, не сдвигая его.",
    "При наведении или Tab на ссылку карточки появляется подсказка; она видна полностью, даже если под ней лежит соседняя карточка.",
    "Ссылка «Подписаться на новости» открывает затемнённое окно поверх всей страницы, включая шапку; «Закрыть» убирает его.",
    "Кнопка «Наверх» всегда в углу окна, а шапка таблицы остаётся видимой при прокрутке строк.",
    "Самопроверка печатает таблицу из 21 проверки, и все они OK на ширинах 320, 768 и 1280px.",
  ],
  technical: [
    "Порядок слоёв: `@layer reset, base, layout, components, overlays;` — окно подписки в самом верхнем слое.",
    "Шкала: `--z-raised: 1`, `--z-header: 100`, `--z-dropdown: 200`, `--z-modal: 1000`; меню лежит **внутри** контекста шапки, поэтому его `z-index` сравнивается с шапкой, а не со страницей.",
    "Контексты наложения: `sticky` с `z-index` создаёт контекст шапки; карточке при `:hover` задайте `z-index` из шкалы, чтобы весь её контекст (с подсказкой) поднялся над соседями.",
    "Позиционирование логическими свойствами: `inset-block-start`, `inset-inline-end`, `inset: 0`.",
    "Подсказка: `inline-size: max-content; max-inline-size: 100%`, иначе скрытая подсказка выходит за правый край и создаёт горизонтальную прокрутку.",
    "Проверки: самопроверка `check.js` (из решения; асинхронная) на трёх ширинах; `stylelint` с бюджетом `0,2,0`; для отладки наложения — `stackingChain` из темы об отладке CSS.",
  ],
  acceptance: [
    "Самопроверка `check.js`: все 21 проверка OK на ширинах 320, 768 и 1280px.",
    "Шапка: `position: sticky`, `top` = 0 после прокрутки на 600px; `elementFromPoint` в её центре возвращает элемент шапки.",
    "Меню: панель `absolute`, под кнопкой, выровнена по правому краю блока, высота страницы одинакова при открытом и закрытом меню, `elementFromPoint` в панели возвращает элемент панели.",
    "Подсказки первой и второй карточек при фокусе видимы и перекрывают соседей (`elementFromPoint` в центре подсказки — сама подсказка); без фокуса — `visibility: hidden`.",
    "Окно: `fixed` на весь экран, затемнение под курсором в верхней части экрана принадлежит `.modal`, диалог — в центре; после `#top` — `display: none`.",
    "`.to-top`: `fixed`, отступы 16px справа и снизу; `thead th`: `sticky`, прилипает к верху блока после прокрутки на 120px.",
    "Все `z-index` — из переменных `--z-*` или малые целые; переменных не меньше трёх.",
    "`stylelint` с бюджетом `0,2,0` — 0 нарушений; нет `!important`, `#id`, горизонтальной прокрутки и скриптов.",
  ],
  hints: [
    "Для липкой шапки нужны `position: sticky`, `top: 0` и `z-index`: без него контент, позиционированный позже, окажется поверх шапки.",
    "У `.menu` нужен `position: relative` — он станет содержащим блоком для панели. Положение панели: `inset-block-start: calc(100% + 0.25rem)` и `inset-inline-end: 0`.",
    "Подсказка внутри карточки с `transform`: у карточки контекст наложения, поэтому `z-index` подсказки сравнивается только внутри карточки. Поднимайте **карточку**: `.card:hover { z-index: var(--z-raised) }` (карточке для этого нужен `position: relative`).",
    "`visibility` и `opacity` анимируются вместе, поэтому подсказка может плавно появляться; а `aria-describedby` по правилам вычисления описания учитывает и скрытый элемент, на который ссылается.",
    "Чтобы снизить вес селектора для показа подсказки, используйте `:where()`: `:where(.card:hover, .card:focus-within) .tip` имеет вес (0,1,0).",
    "Окно: `position: fixed; inset: 0` и `display: none`, а `.modal:target { display: grid }`. Затемнение должно иметь `z-index` выше шапки.",
    "Для проверки наложения используйте `document.elementFromPoint(x, y)` — он возвращает самый верхний элемент в точке.",
  ],
  advanced: [
    "Замените окно на `:target` на `<dialog>` с `showModal()` и стилизуйте `::backdrop`; сравните поведение фокуса и закрытия по Esc.",
    "Исследуйте Popover API (`popover`, `popovertarget`) для меню и подсказок: что даёт «верхний слой» (top layer) и можно ли обойтись без шкалы `z-index`.",
    "Добавьте якорное позиционирование подсказки (CSS anchor positioning), если оно доступно, и сравните с `absolute`.",
    "Сделайте шапку таблицы с тенью, которая появляется только при прокрутке (подсказка: `animation-timeline: scroll()`).",
    "Напишите тест Playwright, который запускает `check.js` на трёх ширинах и падает при любой НЕТ.",
  ],
  failureModes: [
    "**Подсказка под соседней карточкой:** `transform` у карточки создаёт контекст наложения, а `z-index` подсказки сравнивается лишь внутри него. В замере самопроверка ловит это на всех трёх ширинах.",
    "**Гонка `z-index`:** `9999` в шапке, `99999` в окне, `999999` в меню — каждый следующий разработчик повышает ставку. Решение — шкала переменных.",
    "**`absolute` без `relative`:** значок и панель улетают в угол страницы, потому что ближайший позиционированный предок — не карточка и не меню.",
    "**`overflow: hidden` на предке `sticky`:** шапка перестаёт прилипать (в замере `top` равен −300 вместо 0 при прокрутке на 300px).",
    "**Меню в потоке:** панель без `position: absolute` раздвигает страницу — высота растёт на высоту панели (в замере без стилей 1330 вместо 1260px).",
    "**Скрытая подсказка вылезает за край:** `max-content` без ограничения ширины создаёт горизонтальную прокрутку даже при `visibility: hidden`.",
    "**`position: fixed` внутри `transform`:** окно или кнопка перестают привязываться к окну браузера — их содержащим блоком становится трансформированный предок.",
  ],
  rubric: [
    { criterion: "Позиционирование и содержащие блоки", weight: 25, description: "`sticky`, `absolute`, `fixed`, `inset`, правильный содержащий блок у меню, значков, окна и кнопки." },
    { criterion: "Контексты наложения и шкала z-index", weight: 25, description: "Подсказки поверх соседей, шапка и окно в нужном порядке, `--z-*`, отсутствие больших литералов." },
    { criterion: "Интерактивность без JavaScript", weight: 15, description: "`details`, `:hover`, `:focus-within`, `:target`; состояния клавиатуры и мыши согласованы." },
    { criterion: "Липкие элементы и прокрутка", weight: 10, description: "Шапка страницы и шапка таблицы, `max-block-size`, `overflow: auto`, `scroll-padding`." },
    { criterion: "Доступность", weight: 10, description: "Заметный `:focus-visible`, подсказка доступна по фокусу, роли и `aria-describedby` не нарушены." },
    { criterion: "Архитектура CSS", weight: 15, description: "Слои, переменные, `:where()` для снижения веса, нет `!important` и `#id`, специфичность ≤ (0,2,0)." },
  ],
  solution: [
    p("Эталон — один файл. Он проходит самопроверку на ширинах 320, 768 и 1280px; без стилей та же страница проходит 7 из 21 проверки, а два «плохих» варианта (без `z-index` у карточки при наведении и с `z-index: 9999`) ловятся своими проверками."),
    h("style.css"),
    code(
      "css",
      `@layer reset, base, layout, components, overlays;

:root {
  --ink: #1b1b1f;
  --paper: #ffffff;
  --muted: #55535c;
  --accent: #2f3d9a;
  --on-accent: #ffffff;
  --rule: #d0d3e6;
  --surface: #f4f5fb;
  --shadow: 0 4px 16px rgb(27 27 31 / 0.18);

  --header-height: 3.5rem;
  --gutter: 1rem;
  --radius: 0.5rem;

  --z-raised: 1;
  --z-header: 100;
  --z-dropdown: 200;
  --z-modal: 1000;
}

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  body, h1, h2, h3, p, ul { margin: 0; }
  ul { padding: 0; list-style: none; }
}

@layer base {
  html { scroll-padding-block-start: var(--header-height); }
  body { font: 1rem / 1.5 system-ui, sans-serif; color: var(--ink); background: var(--paper); }
  a { color: var(--accent); }
  :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  code { font-family: ui-monospace, Consolas, monospace; font-size: 0.9em; }
}

@layer layout {
  .site-header { position: sticky; top: 0; z-index: var(--z-header); display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-block-size: var(--header-height); padding-inline: var(--gutter); background: var(--surface); border-block-end: 1px solid var(--rule); }
  main { max-inline-size: 60rem; margin-inline: auto; padding: 1.5rem var(--gutter) 0; }
  main > * + * { margin-block-start: 1.5rem; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1rem; }
  .spacer { block-size: 60vh; }
}

@layer components {
  .logo { font-weight: 700; color: var(--ink); text-decoration: none; }

  .menu { position: relative; }
  .menu summary { padding: 0.5rem 0.75rem; border-radius: var(--radius); cursor: pointer; }
  .menu__panel { position: absolute; inset-block-start: calc(100% + 0.25rem); inset-inline-end: 0; z-index: var(--z-dropdown); min-inline-size: 13rem; padding: 0.5rem; background: var(--paper); border: 1px solid var(--rule); border-radius: var(--radius); box-shadow: var(--shadow); }
  .menu__link { display: block; padding: 0.5rem 0.75rem; border-radius: 0.25rem; text-decoration: none; }
  .menu__link:hover { background: var(--surface); }

  .card { position: relative; padding: 1rem; background: var(--surface); border: 1px solid var(--rule); border-radius: var(--radius); transition: transform 0.15s ease, box-shadow 0.15s ease; }
  .card:hover, .card:focus-within { z-index: var(--z-raised); transform: translateY(-2px); box-shadow: var(--shadow); }
  .badge { position: absolute; inset-block-start: 0.5rem; inset-inline-end: 0.5rem; padding: 0.125rem 0.5rem; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: 0.75rem; font-weight: 600; }
  .tip { position: absolute; inset-block-start: calc(100% + 0.5rem); inset-inline-start: 0; inline-size: max-content; max-inline-size: 100%; padding: 0.5rem 0.75rem; border-radius: var(--radius); background: var(--ink); color: var(--paper); font-size: 0.875rem; visibility: hidden; opacity: 0; transition: opacity 0.15s ease, visibility 0.15s; }
  :where(.card:hover, .card:focus-within) .tip { visibility: visible; opacity: 1; }

  .table-wrap { max-block-size: 12rem; overflow: auto; border: 1px solid var(--rule); border-radius: var(--radius); }
  table { inline-size: 100%; border-collapse: collapse; }
  th, td { padding: 0.5rem 0.75rem; text-align: start; border-block-end: 1px solid var(--rule); }
  thead th { position: sticky; inset-block-start: 0; z-index: var(--z-raised); background: var(--surface); }

  .button { display: inline-block; padding: 0.5rem 1rem; border-radius: var(--radius); background: var(--accent); color: var(--on-accent); font-weight: 600; text-decoration: none; }
  .to-top { position: fixed; inset-block-end: 1rem; inset-inline-end: 1rem; padding: 0.5rem 0.75rem; border-radius: var(--radius); background: var(--ink); color: var(--paper); text-decoration: none; }
}

@layer overlays {
  .modal { position: fixed; inset: 0; z-index: var(--z-modal); display: none; place-items: center; padding: var(--gutter); background: rgb(0 0 0 / 0.55); }
  .modal:target { display: grid; }
  .modal__dialog { max-inline-size: 28rem; padding: 1.5rem; border-radius: var(--radius); background: var(--paper); box-shadow: var(--shadow); }
  .modal__dialog > * + * { margin-block-start: 1rem; }
}`,
      { filename: "style.css", lineNumbers: true },
    ),
    h("Почему так"),
    ul(
      "**Шкала `z-index`.** `--z-raised: 1`, `--z-header: 100`, `--z-dropdown: 200`, `--z-modal: 1000`. Шапка (`sticky` с `z-index`) создаёт свой контекст, поэтому меню с `z-index: 200` сравнивается с другими элементами **внутри шапки**, а сама шапка — с остальной страницей числом 100.",
      "**Подсказка поверх соседей.** Карточка — `position: relative` с `transform` при наведении, то есть контекст наложения. Подсказка внутри него может быть сколь угодно высокой, но соседние карточки сравниваются с контекстом карточки целиком. Поэтому `z-index: var(--z-raised)` задан **карточке** при `:hover` и `:focus-within`: контекст поднимается над соседями вместе с подсказкой.",
      "**Вес.** `:where(.card:hover, .card:focus-within) .tip` весит (0,1,0), а не (0,3,0): правило показа не конфликтует по весу с правилом скрытия `.tip`, и порядок записи решает. Самые тяжёлые селекторы листа — (0,2,0): `.menu__link:hover`, `.card:hover`, `.modal:target`.",
      "**Ширина подсказки.** `max-inline-size: 100%` удерживает её в пределах карточки: без ограничения скрытая подсказка выходила за правый край и давала горизонтальную прокрутку.",
      "**Окно.** `position: fixed; inset: 0` в слое `overlays` и `z-index: var(--z-modal)` выше шапки; `display: none` по умолчанию и `display: grid` при `:target`.",
      "**Липкая шапка таблицы.** `thead th` — `sticky` с `z-index: var(--z-raised)` и фоном; прилипает к верху `.table-wrap`, а не окна, потому что блок прокручивается (`overflow: auto`).",
      "**Фокус.** Подсказка показывается и по `:hover`, и по `:focus-within`, поэтому клавиатурный пользователь видит ту же информацию, что и пользователь мыши.",
    ),
    h("Самопроверка"),
    p("Скрипт вставляется в консоль страницы и **асинхронный** (внутри `await`): он прокручивает страницу, открывает меню, фокусирует ссылки, переключает `location.hash`, проверяет, что лежит поверх чего через `elementFromPoint`, и печатает таблицу из 21 проверки."),
    code(
      "js",
      `// check.js — самопроверка проекта «Слои интерфейса»: вставьте в консоль страницы (скрипт асинхронный)
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (s) => document.querySelector(s);
  const rect = (el) => el.getBoundingClientRect();
  const topAt = (x, y) => document.elementFromPoint(x, y);
  const inside = (el, root) => !!el && !!root && root.contains(el);
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

  // 1. липкая шапка
  window.scrollTo(0, 600); await sleep(100);
  const header = $(".site-header");
  add("Шапка прилипает к верху окна при прокрутке", getComputedStyle(header).position === "sticky" && near(rect(header).top, 0, 1), "position: " + getComputedStyle(header).position + ", top = " + rect(header).top.toFixed(1));
  const hitHeader = topAt(root.clientWidth / 2, rect(header).height / 2);
  add("Прокручиваемый контент не перекрывает шапку", inside(hitHeader, header), hitHeader ? hitHeader.tagName.toLowerCase() : "ничего");
  window.scrollTo(0, 0); await sleep(50);

  // 2. выпадающее меню
  const menu = $(".menu"), panel = $(".menu__panel");
  const heightClosed = root.scrollHeight;
  menu.open = true; await sleep(80);
  const pr = rect(panel), sr = rect($(".menu summary")), mr = rect(menu);
  add("Панель меню абсолютно позиционирована под кнопкой", getComputedStyle(panel).position === "absolute" && pr.top >= sr.bottom - 1, "position: " + getComputedStyle(panel).position + ", top панели " + pr.top.toFixed(0) + " ≥ низ кнопки " + sr.bottom.toFixed(0));
  add("Панель выровнена по краю блока меню", near(pr.right, mr.right, 2), "правый край панели " + pr.right.toFixed(0) + " и меню " + mr.right.toFixed(0));
  add("Открытое меню не меняет высоту страницы", root.scrollHeight === heightClosed, root.scrollHeight + " и " + heightClosed);
  const hitPanel = topAt(pr.left + pr.width / 2, pr.top + 12);
  add("Панель меню видна поверх контента", inside(hitPanel, panel), hitPanel ? hitPanel.tagName.toLowerCase() : "ничего");
  menu.open = false;

  // 3. значок на карточке
  const card = $(".card"), badge = $(".badge");
  const cr = rect(card), br = rect(badge);
  add("Значок привязан к углу карточки (absolute в relative)", getComputedStyle(badge).position === "absolute" && getComputedStyle(card).position !== "static" && cr.right - br.right >= 4 && cr.right - br.right <= 14 && br.top - cr.top >= 4 && br.top - cr.top <= 14, "отступы справа " + (cr.right - br.right).toFixed(0) + ", сверху " + (br.top - cr.top).toFixed(0));

  // 4. подсказки поверх соседних карточек
  const tipResult = [];
  for (const i of [0, 1]) {
    const c = document.querySelectorAll(".card")[i];
    c.scrollIntoView({ block: "center" }); await sleep(120);
    c.querySelector("a").focus({ preventScroll: true }); await sleep(250);
    const tip = c.querySelector(".tip"), tr = rect(tip);
    const hit = topAt(tr.left + tr.width / 2, tr.top + tr.height / 2);
    tipResult.push({ i, visible: getComputedStyle(tip).visibility === "visible" && getComputedStyle(tip).opacity === "1", onTop: inside(hit, tip) });
    document.activeElement.blur();
  }
  await sleep(250);
  add("Подсказка показывается при фокусе и лежит поверх соседних карточек", tipResult.every((t) => t.visible && t.onTop), JSON.stringify(tipResult));
  add("Подсказка скрыта без наведения и фокуса", getComputedStyle($(".tip")).visibility === "hidden", "visibility: " + getComputedStyle($(".tip")).visibility);

  // 5. модальное окно на :target
  const modal = $(".modal");
  location.hash = "#modal"; await sleep(150);
  const mrect = rect(modal);
  add("Окно подписки — fixed на весь экран", getComputedStyle(modal).position === "fixed" && near(mrect.width, root.clientWidth, 1) && near(mrect.height, root.clientHeight, 1), Math.round(mrect.width) + "×" + Math.round(mrect.height) + " при окне " + root.clientWidth + "×" + root.clientHeight);
  const hitTop = topAt(root.clientWidth / 2, 10), hitCenter = topAt(root.clientWidth / 2, root.clientHeight / 2);
  add("Затемнение перекрывает липкую шапку, диалог в центре", inside(hitTop, modal) && inside(hitCenter, $(".modal__dialog")), (hitTop ? hitTop.className || hitTop.tagName.toLowerCase() : "ничего") + " сверху, " + (hitCenter ? hitCenter.tagName.toLowerCase() : "ничего") + " в центре");
  location.hash = "#top"; await sleep(150);
  add("Окно закрывается ссылкой на #top", getComputedStyle(modal).display === "none", "display: " + getComputedStyle(modal).display);

  // 6. кнопка «Наверх»
  const toTop = $(".to-top"), tt = rect(toTop);
  add("«Наверх» закреплена у правого нижнего угла (fixed)", getComputedStyle(toTop).position === "fixed" && near(root.clientWidth - tt.right, 16, 2) && near(root.clientHeight - tt.bottom, 16, 2), "отступы справа " + (root.clientWidth - tt.right).toFixed(0) + ", снизу " + (root.clientHeight - tt.bottom).toFixed(0));

  // 7. липкая шапка таблицы внутри прокручиваемого блока
  const wrap = $(".table-wrap");
  wrap.scrollIntoView({ block: "center" }); await sleep(120);
  wrap.scrollTop = 120; await sleep(80);
  const th = $("thead th"), wr = rect(wrap), thr = rect(th);
  const hitTh = topAt(thr.left + thr.width / 2, thr.top + thr.height / 2);
  add("Шапка таблицы прилипает внутри блока с прокруткой", getComputedStyle(th).position === "sticky" && near(thr.top, wr.top + parseFloat(getComputedStyle(wrap).borderTopWidth), 2) && inside(hitTh, th), "scrollTop " + wrap.scrollTop + ", top th " + thr.top.toFixed(0) + ", top блока " + wr.top.toFixed(0));
  wrap.scrollTop = 0;

  // 8. шкала z-index
  const zRules = rules.filter((r) => r.style.zIndex);
  const bad = zRules.filter((r) => !/^var\\(--z-[\\w-]+\\)$/.test(r.style.zIndex) && !(/^-?\\d+$/.test(r.style.zIndex) && Math.abs(+r.style.zIndex) <= 10));
  const zVars = new Set(rules.flatMap((r) => [...r.style].filter((n) => n.startsWith("--z-"))));
  add("z-index берётся из шкалы переменных --z-* (не меньше трёх)", bad.length === 0 && zVars.size >= 3, "переменных: " + zVars.size + (bad.length ? ", вне шкалы: " + bad.map((r) => r.selectorText + " " + r.style.zIndex).join(", ") : ""));

  // 9. архитектура
  const imp = rules.filter((r) => /!important/.test(r.cssText)).length;
  const ids = rules.filter((r) => /#[\\w-]+/.test(r.selectorText)).length;
  const max = rules.reduce((m, r) => { const w = splitTop(r.selectorText).map(weight).sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]; return (w[0] - m[0] || w[1] - m[1] || w[2] - m[2]) > 0 ? w : m; }, [0, 0, 0]);
  add("Нет !important и #id", imp === 0 && ids === 0, "!important: " + imp + ", правил с #id: " + ids);
  add("Специфичность не выше (0,2,0)", max[0] === 0 && (max[1] < 2 || (max[1] === 2 && max[2] === 0)), "(" + max.join(",") + ")");
  add("Стили в слоях @layer", [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r instanceof CSSLayerStatementRule || r instanceof CSSLayerBlockRule); } catch { return false; } }), "@layer");
  add("Есть заметный :focus-visible", rules.some((r) => /:focus-visible/.test(r.selectorText) && parseFloat(r.style.outlineWidth || (r.style.outline.match(/(\\d+)px/) || [])[1]) >= 2), ":focus-visible { outline }");
  add("Без JavaScript на странице", document.scripts.length === 0, "скриптов: " + document.scripts.length);
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
        ["Самопроверка на 320, 768 и 1280px", "все 21 проверка — OK"],
        ["Та же страница без `style.css`", "7 из 21 проверок проходят"],
        ["Вариант без `z-index` у `.card:hover`", "20 из 21: подсказка первой карточки оказывается под соседней (на 320px — обеих проверяемых карточек)"],
        ["Вариант с `z-index: 9999` у шапки", "20 из 21: нарушена шкала `z-index`"],
        ["`stylelint` (`selector-max-id: 0`, `declaration-no-important: true`, `selector-max-specificity: \"0,2,0\"`, `selector-max-compound-selectors: 3`)", "0 нарушений"],
        ["Отчёт по весам (скрипт из темы об управлении специфичностью)", "35 правил, 0 с `#id`, 0 `!important`, максимум (0,2,0) — `.menu__link:hover`, единственное внеслойное правило — `:root`"],
      ],
      "Проверка эталона",
    ),
    warn("Метод `:target` не ловит фокус внутри окна и не закрывается по Esc: клавиатурный пользователь может уйти Tab за затемнение. В боевом интерфейсе используйте `<dialog>` с `showModal()` или Popover API."),
    tip("Когда «что-то оказалось не поверх», не повышайте `z-index`: запустите `stackingChain(элемент)` из темы об отладке CSS и найдите предка, который создал контекст."),
  ],
};
