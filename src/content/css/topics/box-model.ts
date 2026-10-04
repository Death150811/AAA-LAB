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

export const boxModel: Topic = {
  id: "css.box-model",
  slug: "box-model",
  domain: "css",
  module: "box-flow",
  title: "Блочная модель",
  titleEn: "The box model: content, padding, border, margin and box-sizing",
  summary:
    "Каждый элемент в CSS — прямоугольная коробка из четырёх слоёв: содержимое, внутренний отступ, граница и внешний отступ. Тема разбирает, как считается размер коробки, чем отличаются `content-box` и `border-box`, как работают `margin: auto`, отрицательные поля, `outline`, `box-shadow` и скругления, почему вертикальные отступы у строчных элементов ведут себя иначе и как отлаживать размеры в DevTools.",
  minutes: 50,
  prerequisites: ["css.how-css-works", "css.units-math"],
  tags: ["box model", "content", "padding", "border", "margin", "box-sizing", "border-box", "content-box", "outline", "box-shadow", "border-radius", "margin auto", "negative margin", "logical properties", "DevTools"],
  keyConcepts: [
    { term: "Четыре слоя коробки", text: "Изнутри наружу: **content** (содержимое), **padding** (внутренний отступ), **border** (граница), **margin** (внешний отступ). Фон закрашивает content, padding и border, но не margin." },
    { term: "`box-sizing`", text: "`content-box` (по умолчанию): `width` — размер содержимого, отступы и границы добавляются сверху. `border-box`: `width` включает padding и border — размер, который вы задали, и есть размер коробки." },
    { term: "Отступы не наследуются и не складываются как кажется", text: "`margin` — пространство **между** коробками, а не часть самой коробки; вертикальные отступы соседних блоков могут схлопываться (отдельная тема)." },
    { term: "`outline` и `box-shadow` не занимают места", text: "Рамка фокуса и тени рисуются поверх, не влияя на размеры и раскладку соседей." },
    { term: "Строчные элементы устроены иначе", text: "У `inline` вертикальные `margin` не действуют, а `padding` и `border` рисуются, но не раздвигают строки." },
  ],
  sections: [
    section("definition", [
      def("Блочная модель", "Модель CSS, по которой каждый элемент отображается как прямоугольная коробка (box) из областей content, padding, border и margin. Размеры и положение коробок определяют раскладку страницы.", "box model"),
      def("Область содержимого", "Внутренняя область, где располагаются текст и дочерние элементы. Её размеры задают `width` и `height` (в `content-box`) либо вычисляются как остаток после вычета отступов и границ (в `border-box`).", "content box"),
      def("Padding", "Пространство между содержимым и границей. Закрашивается фоном элемента. Не принимает отрицательных значений.", "padding"),
      def("Border", "Линия вокруг padding. Участвует в размере коробки и закрашивается своим цветом поверх фона.", "border"),
      def("Margin", "Прозрачное пространство вокруг границы, отделяющее коробку от соседних. Не закрашивается фоном; может быть отрицательным и `auto`.", "margin"),
      def("`box-sizing`", "Свойство, определяющее, к какой области относится заданное `width`/`height`: к содержимому (`content-box`) или к границе (`border-box`).", "box-sizing"),
    ]),

    section("why", [
      h("Почему «ширина 300px» не равна 300px"),
      p("Самый частый сюрприз новичка: блок с `width: 300px; padding: 20px; border: 5px solid` занимает на экране **350** пикселей. Если не понимать модель, размеры «ломаются»: сетки не умещаются в строку, блоки вылезают за контейнер, пропадают расчёты процентов."),
      h("Что даёт понимание"),
      ul(
        "**Точные размеры:** вы заранее знаете, сколько места займёт блок, и подбираете значения без проб.",
        "**Надёжные раскладки:** одинаковое поведение компонентов независимо от того, есть ли у них padding и border.",
        "**Отладка:** диаграмма блочной модели в DevTools объясняет, куда «ушли» пиксели.",
        "**Единый подход:** `border-box` для всего сайта делает размеры интуитивными.",
      ),
      insight("Практическое правило: на всех элементах включайте `box-sizing: border-box`. Тогда заданная ширина — это ширина коробки целиком, а padding и border «отъедают» место внутри неё, не раздвигая блок."),
    ]),

    section("mental-model", [
      p("Представьте **картину в раме на стене**. Картина — содержимое. Паспарту вокруг картины — padding: оно того же цвета, что холст. Рама — border. Расстояние от рамы до соседних картин — margin: оно принадлежит стене, а не картине. В режиме `content-box` вы измеряете **только картину**, а рамка и паспарту прибавляются. В `border-box` вы измеряете **вместе с рамой**: общий габарит фиксирован, а картина внутри подстраивается."),
      diagram(
        `
        ┌───────────────────────── margin ─────────────────────────┐
        │  ┌─────────────────────── border ────────────────────┐   │
        │  │  ┌───────────────────── padding ──────────────┐   │   │
        │  │  │  ┌────────────── content ─────────────┐    │   │   │
        │  │  │  │   width × height (content-box)     │    │   │   │
        │  │  │  └────────────────────────────────────┘    │   │   │
        │  │  └────────────────────────────────────────────┘   │   │
        │  └───────────────────────────────────────────────────┘   │
        └──────────────────────────────────────────────────────────┘
        фон: content + padding + border (по умолчанию до внешнего края border)
        `,
        "Слои коробки",
      ),
      table(
        ["Режим", "Что задаёт `width`", "Итоговая ширина коробки при `width: 300px; padding: 20px; border: 5px`"],
        [
          ["`content-box` (по умолчанию)", "Ширину **содержимого**", "300 + 2×20 + 2×5 = **350px**"],
          ["`border-box`", "Ширину **до внешнего края границы**", "**300px** (содержимое 250px)"],
        ],
        "Два режима расчёта",
      ),
    ]),

    section("technical", [
      h("Свойства слоёв"),
      table(
        ["Слой", "Свойства", "Особенности"],
        [
          ["Content", "`width`, `height`, `min-*`, `max-*`", "Проценты считаются от размеров контейнера"],
          ["Padding", "`padding`, `padding-top/right/bottom/left`, `padding-inline/block`", "Не бывает отрицательным; проценты — от **ширины** контейнера"],
          ["Border", "`border`, `border-width/style/color`, `border-radius`, `border-image`", "Без `border-style` границы нет; `border-radius` скругляет внешний край и фон"],
          ["Margin", "`margin`, `margin-top/…`, `margin-inline/block`", "Может быть отрицательным и `auto`; соседние вертикальные могут схлопываться"],
        ],
        "Что задаёт каждый слой",
      ),
      h("Сокращённые записи"),
      code(
        "css",
        `
        .a { margin: 10px; }                  /* все четыре стороны */
        .b { margin: 10px 20px; }             /* вертикали | горизонтали */
        .c { margin: 10px 20px 30px; }        /* сверху | горизонтали | снизу */
        .d { margin: 10px 20px 30px 40px; }   /* сверху, справа, снизу, слева — по часовой стрелке */

        .e { padding-inline: 1rem; padding-block: 0.5rem; }   /* логические: по оси текста */
        .f { border: 1px solid #ccc; border-bottom-width: 3px; }
        `,
        { filename: "shorthand.css" },
      ),
      h("`box-sizing`"),
      code(
        "css",
        `
        /* стандартный сброс: размеры считаются по внешнему краю границы */
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        .card {
          width: 20rem;        /* вся коробка 20rem, включая padding и border */
          padding: 1.5rem;
          border: 2px solid #c5cae9;
        }
        `,
        { filename: "border-box.css" },
      ),
      note("`min-width`, `max-width`, `min-height` и `max-height` тоже следуют `box-sizing`. А вот `outline`, `box-shadow` и `margin` никогда не входят в размер коробки."),
      h("Центрирование и `margin: auto`"),
      ul(
        "`margin-inline: auto` у блока с **заданной** шириной делит оставшееся горизонтальное место поровну между левым и правым полями — блок оказывается по центру.",
        "Если ширина не задана (`auto`), блок и так растягивается на всю ширину контейнера, и центрировать нечего: поэтому нужен `max-width` или `width`.",
        "Вертикальное `margin: auto` в обычном потоке ведёт себя как 0; в Flexbox и Grid оно распределяет свободное место и используется для выталкивания элементов.",
      ),
      h("Отрицательные поля"),
      p("Отрицательный `margin` «тянет» коробку в сторону: `margin-left: -10px` сдвигает элемент влево и позволяет перекрывать соседей, `margin-top: -1px` — наложить границы соседних ячеек. Это рабочий инструмент, но он ломает предсказуемость: пользуйтесь им осознанно и документируйте."),
      h("Что не занимает места"),
      ul(
        "**`outline`** рисуется поверх вне границы и не влияет на раскладку; подходит для индикатора фокуса. Поддерживает `outline-offset`.",
        "**`box-shadow`** — тень вокруг коробки: может выходить за границы родителя (будет обрезана при `overflow: hidden`), но не раздвигает соседей.",
        "**`transform`** сдвигает визуальное представление, исходное место в потоке сохраняется.",
      ),
      h("Строчные (inline) элементы"),
      p("У элементов с `display: inline` горизонтальные `margin` и `padding` работают, а вертикальные `margin` — **нет**; вертикальные `padding` и `border` рисуются, но **не раздвигают** соседние строки (могут перекрывать их). Размеры `width` и `height` на них не действуют. Для полноценной коробки нужен `display: inline-block`, `block`, `flex` или `grid`."),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        *, *::before, *::after { box-sizing: border-box; }

        .card {
          width: min(100%, 24rem);
          margin-inline: auto;
          padding: 1.25rem 1.5rem;
          border: 1px solid #c5cae9;
          border-radius: 0.75rem;
          box-shadow: 0 2px 8px rgb(0 0 0 / 12%);
        }

        .card:focus-within {
          outline: 3px solid #0b57d0;
          outline-offset: 2px;
        }
        `,
        [
          { line: 1, text: "Общий сброс: `border-box` для всех элементов и их псевдоэлементов — размеры считаются по внешней границе." },
          { line: 4, text: "Ширина ограничена 24rem и не превышает контейнер: `min(100%, 24rem)` включает padding и border благодаря `border-box`." },
          { line: 5, text: "`margin-inline: auto` центрирует блок по горизонтали (ширина задана)." },
          { line: [6, 7], text: "Внутренний отступ сверху/снизу и слева/справа; тонкая граница; скругление применяется к фону и границе." },
          { line: 9, text: "Тень рисуется за пределами коробки и **не занимает места**: соседние элементы не сдвигаются." },
          { line: [12, 15], text: "Рамка фокуса через `outline` с отступом: тоже не влияет на раскладку, поэтому при появлении не вызывает «прыжков»." },
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
        <title>Блочная модель</title>
        <style>
          .box { width: 300px; padding: 20px; border: 5px solid steelblue; background: lightsteelblue; margin: 10px; }
          .a { box-sizing: content-box; }   /* итого 350px */
          .b { box-sizing: border-box; }    /* итого 300px */
        </style>
        <div class="box a">content-box: 300 + 40 + 10 = 350px</div>
        <div class="box b">border-box: всего 300px</div>
        `,
        { filename: "box-sizing.html", runnable: true },
      ),
    ]),

    section("detailed-example", [
      p("Двухколоночная раскладка с отступами. С `content-box` колонки 50 % + padding не помещаются в строку; с `border-box` помещаются. Переключите режим и посмотрите разницу."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <title>Колонки</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }    /* закомментируйте — колонки упадут на новую строку */

          body { font: 1rem/1.5 system-ui, sans-serif; margin: 0; padding: 1rem; }
          .row { display: flex; flex-wrap: wrap; margin-inline: -0.5rem; }
          .col {
            width: 50%;
            padding: 0.5rem;
          }
          .col > div {
            padding: 1rem;
            border: 1px solid #c5cae9;
            border-radius: 0.5rem;
            background: #f5f5fa;
          }
        </style>
        <div class="row">
          <div class="col"><div>Колонка 1: ширина 50 % включает внутренние отступы.</div></div>
          <div class="col"><div>Колонка 2: промежуток между блоками создают padding колонок.</div></div>
        </div>
        </html>
        `,
        { filename: "columns.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      steps(
        [
          ["Внешний уровень", "`.col { width: 50%; padding: 0.5rem }` с `border-box`: ширина колонки — ровно половина строки; padding уменьшает область содержимого, но не ширину коробки."],
          ["Промежуток", "Расстояние между блоками создают padding колонок: так сетка не зависит от схлопывания полей."],
          ["Внутренний блок", "`.col > div` оформляет карточку: рамку, фон и свой внутренний отступ."],
          ["Отрицательные поля", "`margin-inline: -0.5rem` у `.row` компенсирует padding крайних колонок, чтобы внешние края карточек совпали с границами контейнера."],
        ],
        "Как устроена раскладка",
      ),
      ul(
        "Без `border-box` ширина каждой колонки стала бы `50% + 2 × 0.5rem`, сумма превысила бы 100 %, и вторая колонка перешла бы на следующую строку.",
        "Разделение «внешний слой — отступы, внутренний — оформление» — приём, который делает сетки устойчивыми.",
      ),
    ]),

    section("internals", [
      h("Как браузер считает размеры"),
      steps(
        [
          ["Ширина содержимого", "Для блока в нормальном потоке при `width: auto` содержимое занимает всю доступную ширину минус margin, border и padding. При заданной ширине используется она (с учётом `box-sizing`)."],
          ["Высота содержимого", "При `height: auto` определяется содержимым: сумма высот потомков. Процентная высота работает только если у родителя высота определена."],
          ["Добавление слоёв", "Из размера содержимого плюс padding и border получается размер border-box; margin определяет внешнее пространство."],
          ["Ограничения", "Применяются `min-*` и `max-*`: сначала `max`, затем `min` (min побеждает при конфликте)."],
        ],
        "Как вычисляется размер блока",
      ),
      h("Свойства, зависящие от модели, в JavaScript"),
      code(
        "js",
        `
        const el = document.querySelector(".card");
        const r = el.getBoundingClientRect();   // размеры border-box в пикселях, включая трансформации

        el.offsetWidth;     // ширина border-box (целое число)
        el.clientWidth;     // ширина padding-box без полос прокрутки
        el.scrollWidth;     // полная ширина содержимого, включая то, что за краем

        getComputedStyle(el).boxSizing;   // "border-box" или "content-box"
        getComputedStyle(el).width;       // зависит от box-sizing: у border-box включает padding и border
        `,
        { filename: "box-metrics.js" },
      ),
      note("Для `border-box` `getComputedStyle(el).width` возвращает ширину **всей коробки**, а для `content-box` — только содержимого. Это важно при чтении и записи размеров из скриптов."),
      h("Подсказки DevTools"),
      ul(
        "Вкладка **Computed** содержит диаграмму модели: слои подписаны цветами (содержимое — голубой, padding — зелёный, border — жёлтый, margin — оранжевый).",
        "При наведении на элемент в панели Elements страница подсвечивает те же слои.",
        "Режим **Layout** показывает Flex/Grid-накладки, но для проверки модели удобнее диаграмма и `getBoundingClientRect()`.",
      ),
    ]),

    section("mistakes", [
      h("Ошибка 1. Забыть про `box-sizing`"),
      wrongRight(
        "css",
        {
          code: `
            .col { width: 50%; padding: 1rem; float: left; }
            /* две колонки не помещаются в строку */
          `,
          note: "В `content-box` ширина колонки — `50% + 2rem`, поэтому две колонки шире 100 % и переносятся.",
        },
        {
          code: `
            *, *::before, *::after { box-sizing: border-box; }
            .col { width: 50%; padding: 1rem; float: left; }
          `,
          note: "С `border-box` ширина колонки ровно 50 %, padding внутри.",
        },
      ),
      h("Ошибка 2. `width: 100%` вместе с padding"),
      p("В `content-box` блок с `width: 100%` и `padding: 1rem` шире родителя на 2rem — появляется горизонтальная прокрутка. Лучше не задавать `width` блокам (они растянутся сами) либо включить `border-box`."),
      h("Ошибка 3. Центрирование без ширины"),
      wrongRight(
        "css",
        {
          code: `
            .box { margin: 0 auto; }
            /* блок и так на всю ширину — центрировать нечего */
          `,
          note: "Без заданной (или ограниченной) ширины `margin: auto` не имеет видимого эффекта.",
        },
        {
          code: `
            .box { max-width: 40rem; margin-inline: auto; }
          `,
          note: "Ширина ограничена, оставшееся место делится поровну.",
        },
      ),
      h("Ошибка 4. Вертикальные поля и отступы на строчных элементах"),
      p("`span { margin-top: 20px }` не работает, а `padding-top: 20px` рисуется, но не раздвигает строки. Используйте `display: inline-block` или `block` либо меняйте раскладку (Flexbox)."),
      h("Ошибка 5. Задавать `height` вместо `min-height`"),
      p("Фиксированная высота обрезает содержимое при увеличении шрифта или перевода интерфейса. Используйте `min-height` и позволяйте блоку расти."),
      h("Ошибка 6. Считать, что `outline` и `box-shadow` увеличивают блок"),
      p("Они не участвуют в раскладке: рамка фокуса может перекрыть соседей или быть обрезана `overflow: hidden` у родителя. Оставляйте зазор или используйте `outline-offset`."),
      h("Ошибка 7. Негативный margin вместо правильной раскладки"),
      p("Отрицательные поля «починяют» симптомы, но скрывают проблему: при изменении контента или ширины экрана они ломаются. Пользуйтесь `gap`, Flexbox, Grid или `position: sticky/relative`."),
      h("Ошибка 8. Единица измерения в `padding` как процент без понимания"),
      p("`padding-top: 10%` — это 10 % ширины контейнера, а не высоты. Для пропорционального блока используйте `aspect-ratio`."),
    ]),

    section("antipatterns", [
      ul(
        "**Размеры в `px` на каждом блоке и расчёты «ширина минус отступы» вручную.**",
        "**`width: 100%` + padding без `border-box`.**",
        "**Фиксированная высота контейнеров с текстом.**",
        "**Отрицательные поля для выравнивания** вместо `gap`, Flexbox и Grid.",
        "**Поля у строчных элементов для вертикальных интервалов.**",
        "**`!important` на `box-sizing`** в компонентах: нарушает единую систему расчёта.",
        "**Тени и рамки внутри `overflow: hidden`** без учёта обрезки.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Глобально включайте `box-sizing: border-box`** на `*`, `::before`, `::after`.",
        "**Блокам не задавайте `width`:** пусть заполняют контейнер; ограничивайте `max-width`.",
        "**Используйте `min-height`,** а не `height`, для блоков с текстом.",
        "**Отступы между элементами — через `gap`** в Flexbox/Grid или `margin-block` с единой шкалой.",
        "**Логические свойства** (`margin-inline`, `padding-block`) вместо `left/right/top/bottom`: подготовка к другим направлениям письма.",
        "**Единая шкала отступов** (например, 0.25, 0.5, 1, 1.5, 2, 3rem) в токенах.",
        "**Рамку фокуса задавайте `outline`** с `outline-offset`, а не `border`, чтобы не сдвигать раскладку.",
        "**Проверяйте размеры в DevTools,** а не «на глаз».",
      ),
    ]),

    section("edge-cases", [
      h("Фон и `background-clip`"),
      p("По умолчанию фон простирается под границу (`background-clip: border-box`). Если граница полупрозрачна, под ней виден фон. Чтобы фон не заходил под границу, используйте `background-clip: padding-box`."),
      h("`border-radius` и `overflow`"),
      p("`border-radius` скругляет фон и границу, но **не обрезает содержимое** автоматически: для обрезки дочерних элементов по скруглению нужен `overflow: hidden` (или `clip-path`)."),
      h("Проценты в `padding` и `margin`"),
      p("И горизонтальные, и вертикальные проценты считаются от **ширины** содержащего блока. У элементов Grid содержащим блоком служит их **область сетки**, а не весь контейнер: проценты `padding` и `margin` считаются от её ширины."),
      h("Столбцы и `margin: auto` во Flexbox"),
      p("`margin-left: auto` у дочернего элемента flex-контейнера прижимает его вправо, забирая всё свободное место; вертикальное `margin: auto` центрирует по оси. Это более мощный механизм, чем в обычном потоке."),
      h("Таблицы"),
      p("У `display: table-cell` нет `margin`, а модель границ определяется `border-collapse`: при `collapse` соседние границы объединяются, и `padding` внутри ячеек работает как обычно."),
      h("Минимальный размер содержимого"),
      p("Блок не может быть уже, чем минимальная ширина его содержимого (самое длинное слово, изображение, непереносимая строка), если не задан `overflow`, `min-width: 0` (у flex/grid-элементов) или перенос слов (`overflow-wrap: anywhere`)."),
      h("Печать"),
      p("При печати браузеры могут игнорировать фоны, но размеры коробок сохраняются. Для документов используйте единицы длины, понятные печати, и не опирайтесь на фон как на единственный способ показать границу."),
    ]),

    section("related", [
      ul(
        "[Единицы измерения и функции](/learn/css/units-math) — `rem`, `%`, `min()`, `clamp()` для размеров.",
        "[Режимы display и нормальный поток](/learn/css/display-flow) — как коробки раскладываются.",
        "[Схлопывание полей и BFC](/learn/css/margin-collapsing) — как складываются вертикальные отступы.",
        "[Размеры и overflow](/learn/css/overflow-sizing) — `min-content`, `max-content`, `aspect-ratio`.",
        "[Flexbox: основы](/learn/css/flexbox-basics) и [Grid: основы](/learn/css/grid-basics) — `gap` вместо хаков с `margin`.",
        "[Логические свойства](/learn/css/logical-properties) — `margin-inline`, `padding-block`.",
        "Из других курсов: **JS** — `getBoundingClientRect`, `offsetWidth`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Ручные расчёты размеров",
          code: `
            .sidebar { width: 280px; padding: 20px; border: 1px solid #ccc; float: left; }
            .content { width: 658px; padding: 20px; float: left; margin-left: 20px; }  /* 1000 − 280 − 2 − 40 − 20 − 40 */
          `,
          note: "Размеры зависят от арифметики; любое изменение padding ломает раскладку.",
        },
        {
          title: "border-box и гибкая сетка",
          code: `
            *, *::before, *::after { box-sizing: border-box; }
            .layout { display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; max-width: 62.5rem; margin-inline: auto; }
            .sidebar, .content { padding: 1.25rem; border: 1px solid #ccc; }
          `,
          note: "Колонки подстраиваются сами, отступы можно менять независимо, размеры не требуют арифметики.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.box-model.ex1",
      title: "Итоговая ширина коробки",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Вычислите полную ширину и высоту коробки (от внешнего края margin до внешнего) в обоих режимах:"),
        code(
          "css",
          `
          .box {
            width: 200px;
            height: 100px;
            padding: 10px 20px;
            border: 4px solid;
            margin: 15px;
          }
          `,
        ),
      ],
      hints: ["В `content-box` padding и border добавляются к `width`.", "Margin не входит в размер коробки, но входит в «занятое место»."],
      checks: ["Правильно посчитаны ширина и высота в обоих режимах", "Отдельно указано занимаемое место с margin"],
      solution: [
        table(
          ["Режим", "Коробка (border-box)", "Занимаемое место с margin"],
          [
            ["`content-box`", "ширина 200 + 2×20 + 2×4 = **248px**, высота 100 + 2×10 + 2×4 = **128px**", "278px × 158px"],
            ["`border-box`", "**200px × 100px** (содержимое 152 × 72)", "230px × 130px"],
          ],
        ),
      ],
    }),
    exercise({
      id: "css.box-model.ex2",
      title: "Блок вылезает за контейнер",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("На странице появляется горизонтальная прокрутка. Найдите причину и исправьте тремя разными способами."),
      ],
      starter: {
        lang: "html",
        code: `
          <style>
            body { margin: 0; }
            .container { width: 600px; background: #eee; }
            .panel { width: 100%; padding: 24px; border: 2px solid #333; background: white; }
          </style>
          <div class="container"><div class="panel">Панель</div></div>
        `,
      },
      hints: ["Сколько пикселей добавляют padding и border к `width: 100%` в `content-box`?", "Нужна ли блоку вообще явная ширина?"],
      checks: ["Названа причина: ширина 100 % + padding и border", "Предложены три способа"],
      solution: [
        ul(
          "**Причина:** `.panel` в режиме `content-box` занимает `100% + 2×24 + 2×2 = 100% + 52px`, то есть шире родителя на 52px.",
          "**Способ 1:** включить `box-sizing: border-box` (глобально или для `.panel`).",
          "**Способ 2:** убрать `width: 100%` — блок и так займёт всю доступную ширину контейнера с учётом padding и border.",
          "**Способ 3:** задать `width: calc(100% - 52px)` — работает, но хрупко: любое изменение отступов потребует правки.",
        ),
        code("css", `*, *::before, *::after { box-sizing: border-box; }`),
      ],
    }),
    exercise({
      id: "css.box-model.ex3",
      title: "Карточка с точными размерами",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Сверстайте карточку по техническому заданию и проверьте размеры измерением в консоли: общая ширина 320px (включая рамку), рамка 1px, внутренний отступ 24px, скругление 12px, тень не должна влиять на раскладку. Две карточки должны стоять рядом с зазором 16px. Напишите CSS и скрипт проверки."),
      ],
      hints: ["Какой режим `box-sizing` делает ширину 320px итоговой?", "Как задать зазор, не используя margin у карточек?", "Какой метод даёт размеры border-box?"],
      checks: ["Карточка ровно 320px", "Зазор 16px через `gap`", "Тень без влияния на раскладку", "Размеры подтверждены `getBoundingClientRect()`"],
      solution: [
        code(
          "html",
          `
          <style>
            *, *::before, *::after { box-sizing: border-box; }
            .cards { display: flex; gap: 16px; }
            .card {
              width: 320px;
              padding: 24px;
              border: 1px solid #c5cae9;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgb(0 0 0 / 12%);
            }
          </style>
          <div class="cards">
            <div class="card">Карточка 1</div>
            <div class="card">Карточка 2</div>
          </div>
          <script>
            const [a, b] = [...document.querySelectorAll(".card")].map((c) => c.getBoundingClientRect());
            console.log(a.width, b.left - a.right);   // 320 16
          </script>
          `,
          { runnable: true, lineNumbers: true },
        ),
        ul(
          "`border-box` делает ширину 320px итоговой: padding 24px и рамка 1px уменьшают область содержимого до 270px.",
          "Зазор создаёт `gap: 16px` у контейнера: он не зависит от margin и не складывается с ним.",
          "Тень рисуется вне коробки и в раскладке не участвует: расстояние между карточками остаётся 16px.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "css.box-model.challenge",
    title: "Система отступов и компонентов без «ломающихся» размеров",
    scenario: [
      p("В продукте компоненты ломаются при добавлении рамки или padding: кнопки «прыгают» при фокусе, карточки вылезают из колонок, а отступы между блоками — то 12, то 15, то 18 пикселей. Нужен набор правил и базовый CSS, при которых размеры предсказуемы."),
    ],
    requirements: [
      "Глобальный сброс модели и базовая шкала отступов (токены)",
      "Правило фокуса, не сдвигающее раскладку",
      "Правила межэлементных отступов (`gap` вместо `margin`)",
      "Пример компонентов: кнопка и карточка",
      "Проверка размеров скриптом",
    ],
    constraints: [
      "Нельзя использовать `margin` между соседними компонентами",
      "Фокус не должен менять размеры элемента",
    ],
    acceptance: [
      "`border-box` включён глобально",
      "Шкала отступов в `rem` задана токенами",
      "Фокус реализован `outline` с `outline-offset`",
      "Скрипт подтверждает, что при фокусе размеры кнопки не меняются",
    ],
    hints: [
      "Что произойдёт с размерами при добавлении `border` на `:focus`?",
      "Как сделать так, чтобы рамка фокуса не занимала места?",
      "Где в компонентах уместен `margin`, а где `gap`?",
    ],
    solution: [
      code(
        "html",
        `
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          :root { --space-1: 0.5rem; --space-2: 1rem; --space-3: 1.5rem; }

          .stack > * + * { margin-block-start: var(--space-2); }    /* «стековый» отступ только между соседями */
          .row { display: flex; gap: var(--space-2); }

          .btn {
            font: inherit;
            padding: var(--space-1) var(--space-2);
            border: 2px solid transparent;                      /* граница есть всегда: фокус и наведение не меняют размер */
            background: #1a237e; color: #fff;
            border-radius: 0.5rem;
          }
          .btn:hover { background: #283593; }
          .btn:focus-visible { outline: 3px solid #0b57d0; outline-offset: 2px; }

          .card { padding: var(--space-3); border: 1px solid #c5cae9; border-radius: 0.75rem; }
        </style>
        <div class="stack">
          <div class="card">Карточка</div>
          <div class="row"><button class="btn" id="b">Кнопка</button><button class="btn">Ещё</button></div>
        </div>
        <script>
          const b = document.getElementById("b");
          const before = b.getBoundingClientRect().width;
          b.focus();
          console.log(before === b.getBoundingClientRect().width);   // true: фокус размеры не меняет
        </script>
        `,
        { runnable: true, lineNumbers: true },
      ),
      ul(
        "**`border-box` и токены:** размеры предсказуемы; шкала отступов в `rem` масштабируется вместе с текстом.",
        "**Межэлементные отступы:** `gap` у `flex`/`grid` и «стековое» правило `.stack > * + *` задают расстояние **между** соседями, не создавая лишних отступов у первого и последнего элементов.",
        "**Фокус:** `outline` не занимает места, поэтому кнопка не «прыгает»; прозрачная граница всегда занимает место, а цвет границы меняется без изменения размера.",
        "**Проверка:** в тесте (Playwright) сравнивают `getBoundingClientRect()` до и после фокуса и наведения; визуальные снимки фиксируют отступы.",
      ),
    ],
  },

  interview: [
    iq("css.box-model.i1", "basic", "Из чего состоит блочная модель?", [
      p("Из четырёх слоёв: содержимое (content), внутренний отступ (padding), граница (border) и внешний отступ (margin). Фон закрашивает content, padding и border."),
    ]),
    iq("css.box-model.i2", "basic", "Чем `content-box` отличается от `border-box`?", [
      p("В `content-box` (по умолчанию) `width` задаёт размер содержимого, а padding и border добавляются сверху. В `border-box` `width` включает padding и border: итоговый размер равен заданному."),
    ]),
    iq("css.box-model.i3", "intermediate", "Как отцентрировать блок по горизонтали?", [
      p("Задать блоку ширину (или `max-width`) и поставить `margin-inline: auto`. Свободное место делится поровну между левым и правым полями. Без заданной ширины блок и так занимает всю ширину."),
    ]),
    iq("css.box-model.i4", "intermediate", "Какие свойства не влияют на размеры коробки и раскладку?", [
      ul(
        "`outline` — рисуется поверх, не занимает места.",
        "`box-shadow` — тень вокруг коробки.",
        "`transform` — меняет только визуальное представление.",
        "`margin` не входит в размер коробки, но влияет на положение соседей.",
      ),
    ]),
    iq("css.box-model.i5", "intermediate", "Почему вертикальные `margin` у `span` не работают?", [
      p("У строчных элементов вертикальные поля не применяются, а вертикальные `padding` и `border` рисуются, но не раздвигают соседние строки. Нужен `display: inline-block`, `block`, `flex` или `grid`."),
    ]),
    iq("css.box-model.i6", "advanced", "От чего считаются проценты в `padding-top` и `margin-top`?", [
      p("От **ширины** содержащего блока, а не от высоты. Это свойство используется для приёма «пропорционального блока» через `padding-top: 56.25%`, но сегодня вместо него применяют `aspect-ratio`."),
    ]),
    iq("css.box-model.i7", "engineering", "Как построить предсказуемую систему отступов в компонентной библиотеке?", [
      ul(
        "Глобальный `border-box`, шкала отступов в токенах (`rem`).",
        "Отступы **между** соседями — `gap` (Flexbox/Grid) или «стековое» правило `> * + *`; внутренние — `padding` компонента.",
        "Логические свойства (`margin-inline`, `padding-block`) для поддержки разных направлений письма.",
        "Фокус и состояния не должны менять размеры: `outline`, прозрачные границы.",
        "Тесты размеров и визуальные снимки.",
      ),
    ]),
    iq("css.box-model.i8", "debugging", "Блок шире родителя на несколько пикселей. С чего начнёте?", [
      ul(
        "Проверить `box-sizing`: `width: 100%` с padding и border в `content-box` шире на их сумму.",
        "Вкладка Computed: диаграмма блочной модели и фактические размеры.",
        "Проверить `margin` и отрицательные поля, `100vw`, фиксированные ширины внутри.",
        "Исправить: `border-box`, убрать явную `width`, использовать `max-width`/`min()`.",
      ),
    ]),
  ],

  exam: [
    mcq("css.box-model.e1", "foundation", "Какова полная ширина коробки при `content-box`, `width: 200px`, `padding: 10px`, `border: 5px`?", ["200px", "215px", "230px", "220px"], 2, "К ширине содержимого добавляются padding и border с обеих сторон: 200 + 2×10 + 2×5 = 230px."),
    mcq("css.box-model.e2", "foundation", "Что входит в ширину `width` при `box-sizing: border-box`?", ["Только содержимое", "Содержимое, padding и border", "Содержимое и margin", "Всё, включая margin и outline"], 1, "В `border-box` `width` задаёт размер до внешнего края границы: padding и border входят в заданную ширину."),
    mcq("css.box-model.e3", "intermediate", "Какое значение центрирует блок с заданной шириной по горизонтали?", ["`margin: 0 auto`", "`padding: auto`", "`text-align: center`", "`float: center`"], 0, "Автоматические боковые поля делят свободное место поровну и центрируют блок; `text-align` центрирует строчное содержимое, а не сам блок."),
    mcq("css.box-model.e4", "intermediate", "Какие утверждения верны? Выберите все.", ["`outline` не занимает места в раскладке", "`box-shadow` увеличивает размер блока", "`margin` может быть отрицательным", "`padding` может быть отрицательным"], [0, 2], "`outline` и тени в раскладке не участвуют, `margin` может быть отрицательным, а `padding` — нет."),
    mcq("css.box-model.e5", "intermediate", "У `span` задан `margin-top: 20px`. Что произойдёт?", ["Отступ появится", "Отступ не применится: у строчных элементов вертикальные поля игнорируются", "Элемент станет блочным", "Появится ошибка"], 1, "Вертикальные `margin` не действуют на `display: inline`; нужен `inline-block` или другой режим."),
    mcq("css.box-model.e6", "advanced", "От чего считается `padding-top: 10%`?", ["От высоты родителя", "От ширины содержащего блока", "От шрифта", "От высоты окна"], 1, "Все процентные `margin` и `padding` считаются от ширины содержащего блока, даже вертикальные."),
    open("css.box-model.e7", "intermediate", "Объясните, почему рекомендуют глобально включать `border-box`.", [
      ul(
        "Заданная ширина становится итоговой: padding и border не раздвигают блок.",
        "Расчёты и сетки проще: `width: 50%` с padding остаётся половиной.",
        "Компоненты ведут себя единообразно, и добавление рамки не ломает раскладку.",
        "Включают на `*`, `::before`, `::after`.",
      ),
    ], ["Названо предсказуемость размеров", "Упомянуты сетки/проценты", "Указан способ включения"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.box-model.m1", "intermediate", "Кнопка «прыгает» при фокусе, потому что на `:focus` добавляется `border: 2px solid`. Что исправит проблему?", ["Увеличить `padding`", "Использовать `outline` или постоянную прозрачную границу", "Убрать `box-sizing`", "Добавить `position: absolute`"], 1, "`outline` не занимает места, а постоянная (в том числе прозрачная) граница не меняет размер при смене цвета."),
    mcq("css.box-model.m2", "advanced", "Что вернёт `getComputedStyle(el).width` для `border-box` с `width: 300px; padding: 20px`?", ["260px", "300px", "340px", "Зависит от браузера"], 1, "В `border-box` вычисленная ширина — ширина всей коробки: 300px, содержимое внутри 260px (минус border)."),
    mcq("css.box-model.m3", "advanced", "Почему `border-radius` не обрезает дочерние элементы?", ["Это баг", "Оно скругляет только фон и границу самого элемента; обрезка нужна через `overflow: hidden` или `clip-path`", "Дочерние элементы всегда внутри", "Из-за `box-sizing`"], 1, "Скругление применяется к фону и границе; чтобы обрезать содержимое по скруглённому краю, нужен `overflow` или `clip-path`."),
    open("css.box-model.m4", "advanced", "Вам нужно перевести проект с фиксированных размеров в пикселях и `content-box` на `border-box` и `gap`. Опишите план миграции.", [
      ul(
        "Измерить: найти компоненты с `width`+`padding`/`border`, расчёты в `calc()`, отрицательные поля.",
        "Включить `border-box` глобально за флагом/в слое, сверить ключевые страницы визуальными тестами.",
        "Заменять ручные расчёты и `margin` между соседями на `gap` и стековые правила по компонентам.",
        "Логические свойства и `min-height` вместо `height`; токены отступов.",
        "Контроль: стилелинт, тесты размеров, поэтапный релиз.",
      ),
    ], ["Есть измерение до изменений", "Есть поэтапный план и тесты", "Названы `gap` и токены"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.box-model.f1", front: "Слои коробки?", back: "Content → padding → border → margin." },
    { id: "css.box-model.f2", front: "`content-box` против `border-box`?", back: "В первом `width` — только содержимое; во втором — вместе с padding и border." },
    { id: "css.box-model.f3", front: "Что не занимает места?", back: "`outline`, `box-shadow`, `transform`." },
    { id: "css.box-model.f4", front: "Как центрировать блок?", back: "Задать ширину/`max-width` и `margin-inline: auto`." },
    { id: "css.box-model.f5", front: "Вертикальные margin у `inline`?", back: "Не действуют. Нужен `inline-block`, `block`, `flex` или `grid`." },
    { id: "css.box-model.f6", front: "Проценты в padding?", back: "От ширины содержащего блока — даже вертикальные." },
  ],

  sources: [
    { title: "CSS Box Model Module Level 3", url: "https://www.w3.org/TR/css-box-3/", publisher: "W3C" },
    { title: "CSS Basic User Interface Module Level 4 — box-sizing", url: "https://www.w3.org/TR/css-ui-4/#box-sizing", publisher: "W3C" },
    { title: "MDN: The box model", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model", publisher: "MDN" },
    { title: "MDN: box-sizing", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing", publisher: "MDN" },
    { title: "MDN: margin", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/margin", publisher: "MDN" },
    { title: "MDN: outline", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/outline", publisher: "MDN" },
  ],
};
