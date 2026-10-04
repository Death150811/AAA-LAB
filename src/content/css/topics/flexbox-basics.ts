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

export const flexboxBasics: Topic = {
  id: "css.flexbox-basics",
  slug: "flexbox-basics",
  domain: "css",
  module: "flexbox",
  title: "Flexbox: оси, контейнер и выравнивание",
  titleEn: "Flexbox: flex container, main and cross axes, justify-content, align-items, gap",
  summary:
    "Flexbox — одномерная раскладка: элементы выстраиваются вдоль **главной оси**, а выравниваются по **поперечной**. Тема разбирает `display: flex`, `flex-direction`, `flex-wrap`, `justify-content`, `align-items`, `align-content`, `align-self`, `gap`, `order`, автоматические поля `margin: auto`, влияние направления письма и типичные ошибки — от путаницы осей до скрытого изменения порядка чтения.",
  minutes: 55,
  prerequisites: ["css.display-flow", "css.box-model"],
  tags: ["flexbox", "flex container", "flex item", "main axis", "cross axis", "flex-direction", "flex-wrap", "justify-content", "align-items", "align-content", "align-self", "gap", "order", "margin auto", "centering"],
  keyConcepts: [
    { term: "Две оси", text: "**Главная ось** определяется `flex-direction` (по умолчанию горизонтальная в языках с письмом слева направо). **Поперечная ось** ей перпендикулярна. Выравнивание по главной задаёт `justify-content`, по поперечной — `align-items`." },
    { term: "Контейнер и элементы", text: "`display: flex` у родителя делает его flex-контейнером, а **прямых** детей — flex-элементами. Внуки на раскладку не влияют." },
    { term: "Один ряд или несколько", text: "По умолчанию все элементы в одной строке (`nowrap`). `flex-wrap: wrap` разрешает перенос; тогда несколько «линий» распределяет `align-content`." },
    { term: "`gap` вместо полей", text: "Расстояние **между** элементами задаётся `gap` контейнера: без схлопывания, без лишних полей у краёв." },
    { term: "Автоматические поля", text: "`margin: auto` во Flexbox забирает всё свободное место по своей оси: так прижимают элемент к краю или центрируют по обеим осям." },
  ],
  sections: [
    section("definition", [
      def("Flex-контейнер", "Элемент с `display: flex` или `inline-flex`. Он устанавливает контекст форматирования Flexbox для своих прямых детей.", "flex container"),
      def("Flex-элемент", "Прямой потомок flex-контейнера. Блокифицируется (значение `display` становится блочным), `float`, `clear` и `vertical-align` на нём не действуют.", "flex item"),
      def("Главная ось", "Ось, вдоль которой раскладываются элементы. Задаётся `flex-direction` (`row`, `row-reverse`, `column`, `column-reverse`).", "main axis"),
      def("Поперечная ось", "Ось, перпендикулярная главной. Направление и размер линий вдоль неё определяют выравнивание `align-items` и `align-content`.", "cross axis"),
      def("Flex-линия", "Строка (или столбец) элементов в контейнере. При `nowrap` линия одна; при `wrap` их может быть несколько.", "flex line"),
    ]),

    section("why", [
      h("Задачи, для которых создан Flexbox"),
      p("До Flexbox выравнивание по вертикали, равные по высоте колонки и распределение пространства между элементами требовали хитростей: `float`, таблиц, `inline-block` с отрицательными полями. Flexbox решает эти задачи декларативно: вы описываете **как распределять свободное место и выравнивать**, а браузер считает размеры."),
      h("Где Flexbox особенно хорош"),
      ul(
        "**Панели и тулбары:** кнопки в ряд, часть слева, часть справа.",
        "**Навигация:** пункты равномерно или с отступами, перенос на узких экранах.",
        "**Карточки:** одинаковая высота, подпись прижата книзу.",
        "**Центрирование:** по обеим осям без позиционирования.",
        "**Компоненты:** поле ввода с кнопкой, значок с текстом, строка списка с действиями.",
      ),
      insight("Flexbox — для **одномерной** раскладки (ряд или столбец). Когда нужны одновременно строки и столбцы (сетка), выбирайте Grid. Часто они дополняют друг друга: Grid — для страницы, Flexbox — для компонентов внутри."),
    ]),

    section("mental-model", [
      p("Представьте **полку для книг**. Полка (контейнер) вытянута вдоль главной оси. Книги (элементы) стоят в ряд; свободное место на полке можно распределить: сдвинуть книги к левому краю, к правому, по центру или раздвинуть равномерно (`justify-content`). Высота полки — поперечная ось: книги можно прижать к низу, к верху, поставить по центру или растянуть по высоте полки (`align-items`). Если книг слишком много, полку можно сделать многоэтажной (`flex-wrap`), и тогда этажи тоже распределяются по высоте (`align-content`)."),
      diagram(
        `
        flex-direction: row  (по умолчанию)

        главная ось  ──────────────────────────────►
        ┌──────────────────────────────────────────┐ ▲
        │  ┌─────┐  ┌───────┐  ┌────┐               │ │ поперечная
        │  │  1  │  │   2   │  │ 3  │               │ │ ось
        │  └─────┘  └───────┘  └────┘               │ ▼
        └──────────────────────────────────────────┘

        flex-direction: column

        главная ось вертикальна, поперечная — горизонтальна:
        justify-content теперь управляет вертикалью, align-items — горизонталью
        `,
        "Оси Flexbox меняются вместе с flex-direction",
      ),
      table(
        ["Свойство", "Ось", "Что делает"],
        [
          ["`flex-direction`", "—", "Выбирает главную ось и направление"],
          ["`flex-wrap`", "—", "Разрешает перенос элементов на новые линии"],
          ["`justify-content`", "Главная", "Распределяет **свободное место** между/вокруг элементов вдоль главной оси"],
          ["`align-items`", "Поперечная", "Выравнивает элементы внутри **своей линии**"],
          ["`align-content`", "Поперечная", "Распределяет **линии** внутри контейнера (нужны перенос и свободное место)"],
          ["`align-self`", "Поперечная", "Выравнивание одного элемента, переопределяет `align-items`"],
          ["`gap`", "Обе", "Расстояние между элементами и линиями"],
        ],
        "Свойства выравнивания",
      ),
    ]),

    section("technical", [
      h("Включение Flexbox"),
      code(
        "css",
        `
        .toolbar {
          display: flex;                   /* блочный контейнер; inline-flex — строчный */
          flex-direction: row;             /* row | row-reverse | column | column-reverse */
          flex-wrap: nowrap;               /* nowrap | wrap | wrap-reverse */
          justify-content: flex-start;     /* по главной оси */
          align-items: stretch;            /* по поперечной оси */
          gap: 0.5rem;                     /* между элементами */
        }

        /* сокращение: flex-flow = direction + wrap */
        .gallery { display: flex; flex-flow: row wrap; }
        `,
        { filename: "flex-container.css" },
      ),
      h("`flex-direction` и направление письма"),
      ul(
        "`row` — главная ось идёт в направлении текста (слева направо в LTR, справа налево в RTL).",
        "`row-reverse` — против направления текста; `column` — сверху вниз; `column-reverse` — снизу вверх.",
        "Перестановка через `*-reverse` и `order` меняет **только визуальный порядок**: порядок фокуса и чтения остаётся прежним (проблема доступности).",
      ),
      h("`justify-content` — главная ось"),
      table(
        ["Значение", "Результат"],
        [
          ["`flex-start` (по умолчанию)", "Элементы у начала главной оси"],
          ["`flex-end`", "У конца главной оси"],
          ["`center`", "По центру"],
          ["`space-between`", "Крайние — у краёв, свободное место поровну **между** элементами"],
          ["`space-around`", "Равные поля **вокруг** каждого элемента (между элементами вдвое больше, чем у краёв)"],
          ["`space-evenly`", "Равные промежутки между элементами **и** у краёв"],
          ["`start`, `end`", "Логические значения, зависящие от направления письма"],
        ],
        "Распределение свободного места вдоль главной оси",
      ),
      h("`align-items`, `align-self`, `align-content` — поперечная ось"),
      table(
        ["Значение", "Результат"],
        [
          ["`stretch` (по умолчанию)", "Элементы растягиваются на высоту линии (если высота не задана)"],
          ["`flex-start` / `flex-end`", "Прижать к началу / концу поперечной оси"],
          ["`center`", "По центру линии"],
          ["`baseline`", "По базовой линии текста — подписи разных размеров на одной линии"],
          ["`safe center`", "Центрировать, но не выходить за начало оси при нехватке места"],
        ],
        "Выравнивание элементов в линии",
      ),
      ul(
        "**`align-items`** работает для **каждой линии**; при одной линии высота линии равна высоте контейнера (если она задана) или самому высокому элементу.",
        "**`align-self`** переопределяет `align-items` для одного элемента.",
        "**`align-content`** действует только при **нескольких линиях** (`flex-wrap: wrap`) и наличии свободного места по поперечной оси; значения те же, что у `justify-content`, плюс `stretch`.",
      ),
      h("`gap`, `order`, автоматические поля"),
      code(
        "css",
        `
        .row { display: flex; gap: 1rem 2rem; }      /* row-gap column-gap */

        .logo   { margin-inline-end: auto; }          /* всё свободное место справа от логотипа: остальное прижато к концу */
        .center { margin: auto; }                     /* центрирование по обеим осям внутри контейнера */

        .promo { order: -1; }                         /* визуально первым (порядок чтения не меняется!) */
        `,
        { filename: "gap-order-margin.css" },
      ),
      ul(
        "**`gap`** (`row-gap`, `column-gap`) задаёт расстояния только **между** элементами: у краёв нет лишних отступов.",
        "**`order`** — целое число (по умолчанию 0): элементы упорядочиваются по возрастанию, затем по порядку в DOM. Не меняет порядок фокуса и чтения.",
        "**`margin: auto`** поглощает свободное место: `margin-inline-start: auto` прижимает элемент к концу, `margin: auto` центрирует по обеим осям.",
      ),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        .navbar {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
        }

        .navbar__brand { font-weight: 700; margin-inline-end: auto; }
        .navbar__link  { padding: 0.5rem; }

        .center-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100dvh;
        }
        `,
        [
          { line: 1, text: "Контейнер: `display: flex` превращает прямых детей во flex-элементы в ряд." },
          { line: 3, text: "Выравнивание по поперечной оси: все элементы центрируются по вертикали." },
          { line: 4, text: "`gap` — расстояние между пунктами, без полей у краёв." },
          { line: 8, text: "`margin-inline-end: auto` у бренда забирает свободное место: ссылки оказываются прижаты к правому краю." },
          { line: [11, 16], text: "Центрирование на всю высоту окна: главная ось — по горизонтали (`justify-content`), поперечная — по вертикали (`align-items`)." },
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
        <title>Flexbox</title>
        <style>
          body { font: 16px/1.5 system-ui, sans-serif; margin: 1rem; }
          .row { display: flex; gap: 0.5rem; padding: 0.5rem; background: #e8eaf6; margin-bottom: 1rem; }
          .row > div { padding: 0.5rem 1rem; background: #7986cb; color: #fff; }
          .center { justify-content: center; align-items: center; height: 6rem; }
          .between { justify-content: space-between; }
          .column { flex-direction: column; align-items: flex-start; }
        </style>
        <div class="row"><div>1</div><div>2</div><div>3</div></div>
        <div class="row center"><div>по центру</div></div>
        <div class="row between"><div>слева</div><div>середина</div><div>справа</div></div>
        <div class="row column"><div>колонка</div><div>из элементов</div></div>
        `,
        { filename: "flex-basics.html", runnable: true },
      ),
    ]),

    section("detailed-example", [
      p("Компонент «карточка сообщения»: аватар, текст и время. Разные части выравниваются по разным осям, время прижато вправо автоматическим полем, а кнопки внизу карточки — столбцом на узком экране."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Карточка сообщения</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { font: 1rem/1.5 system-ui, sans-serif; margin: 0; padding: 1rem; background: #f5f5fa; }

          .message { display: flex; gap: 0.75rem; max-width: 36rem; padding: 1rem; background: #fff; border-radius: 0.75rem; box-shadow: 0 1px 3px rgb(0 0 0 / 15%); }
          .avatar { flex: none; width: 2.5rem; aspect-ratio: 1; border-radius: 50%; background: #3949ab; }

          .body { flex: 1; min-width: 0; }
          .head { display: flex; align-items: baseline; gap: 0.5rem; }
          .name { font-weight: 600; }
          .time { margin-inline-start: auto; font-size: 0.8125rem; color: #546e7a; }
          .text { margin: 0.25rem 0 0.75rem; }

          .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
          .actions button { font: inherit; padding: 0.4rem 0.9rem; border: 1px solid #c5cae9; border-radius: 999px; background: #fff; cursor: pointer; }
          .actions button:focus-visible { outline: 3px solid #0b57d0; outline-offset: 2px; }
        </style>
        <article class="message">
          <div class="avatar" aria-hidden="true"></div>
          <div class="body">
            <div class="head"><span class="name">Анна Ковалёва</span><time class="time" datetime="2026-03-14T12:30">12:30</time></div>
            <p class="text">Отправила черновик договора. Посмотрите, пожалуйста, до конца дня и напишите замечания в документе.</p>
            <div class="actions"><button>Ответить</button><button>Переслать</button><button>В архив</button></div>
          </div>
        </article>
        </html>
        `,
        { filename: "message-card.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Приём", "Зачем"],
        [
          ["`.message { display: flex; gap }`", "Аватар и тело в ряд; расстояние между ними не зависит от полей"],
          ["`.avatar { flex: none }`", "Аватар не сжимается и не растягивается"],
          ["`.body { flex: 1; min-width: 0 }`", "Тело занимает всё оставшееся место; `min-width: 0` позволяет длинному тексту переноситься, а не растягивать карточку"],
          ["`.head { align-items: baseline }`", "Имя и время выровнены по базовой линии, хотя размер шрифта разный"],
          ["`.time { margin-inline-start: auto }`", "Время прижато к концу строки без пустых элементов"],
          ["`.actions { flex-wrap: wrap; gap }`", "Кнопки переносятся на новую строку при нехватке места, расстояния сохраняются"],
        ],
        "Что делает пример",
      ),
      ul(
        "Один и тот же приём — вложенный flex-контейнер: `.message` (ряд), `.head` (ряд), `.actions` (ряд с переносом).",
        "Размеры не заданы жёстко: карточка адаптируется к ширине и содержимому.",
        "Кнопки — настоящие `button`: они получают фокус и работают с клавиатуры; порядок DOM совпадает с визуальным.",
      ),
    ]),

    section("internals", [
      h("Как Flexbox раскладывает элементы"),
      steps(
        [
          ["Определение осей", "По `flex-direction` и направлению письма вычисляются главная и поперечная оси."],
          ["Сбор элементов", "Прямые дети контейнера становятся flex-элементами, текстовые узлы оборачиваются в анонимные элементы."],
          ["Разбиение на линии", "При `nowrap` — одна линия; при `wrap` элементы укладываются, пока помещаются по главному размеру (`flex-basis` плюс отступы), затем создаётся новая линия."],
          ["Распределение места по главной оси", "Свободное место распределяется между элементами согласно `flex-grow`/`flex-shrink`, затем `justify-content` позиционирует результат."],
          ["Выравнивание по поперечной оси", "`align-items`/`align-self` выравнивают элементы в линии; `align-content` распределяет линии."],
        ],
        "Алгоритм Flexbox (упрощённо)",
      ),
      h("Что изменяется у элементов"),
      ul(
        "`display` flex-элемента блокифицируется: `inline` → `block`, `inline-block` → `block`.",
        "`float`, `clear`, `vertical-align` не действуют; проценты `margin` и `padding` считаются от ширины контейнера.",
        "`margin` flex-элементов **не схлопываются**, поэтому поля складываются.",
        "Абсолютно позиционированные потомки контейнера выходят из раскладки flex, но используют выравнивание контейнера для статического положения.",
      ),
      h("Проверка в DevTools"),
      p("Включите значок `flex` рядом с контейнером в панели Elements: DevTools покажет оси, линии, зазоры и свободное место. Вкладка Layout даёт подсветку и перечень свойств. Для чисел используйте `getBoundingClientRect()`."),
      code(
        "js",
        `
        const box = document.querySelector(".toolbar");
        const items = [...box.children].map((el) => el.getBoundingClientRect());

        // свободное место вдоль главной оси
        const used = items.reduce((sum, r) => sum + r.width, 0);
        const free = box.getBoundingClientRect().width - used;

        // расстояния между соседними элементами
        const gaps = items.slice(1).map((r, i) => Math.round(r.left - items[i].right));
        `,
        { filename: "flex-measure.js" },
      ),
    ]),

    section("mistakes", [
      h("Ошибка 1. Путаница осей при смене направления"),
      wrongRight(
        "css",
        {
          code: `
            .stack { display: flex; flex-direction: column; }
            .stack { justify-content: center; }   /* ожидали центрирование по горизонтали */
          `,
          note: "В колонке главная ось вертикальна: `justify-content` центрирует по вертикали (при заданной высоте), по горизонтали нужен `align-items`.",
        },
        {
          code: `
            .stack { display: flex; flex-direction: column; align-items: center; }
          `,
          note: "Горизонтальное центрирование в колонке — по поперечной оси: `align-items: center`.",
        },
      ),
      h("Ошибка 2. `align-content` без переноса"),
      p("Если элементы в одной линии (`nowrap`), `align-content` ничего не делает. Для вертикального выравнивания одной линии используйте `align-items`."),
      h("Ошибка 3. Центрирование без высоты контейнера"),
      p("`align-items: center` не центрирует по вертикали, если у контейнера нет высоты: линия равна самому высокому элементу, и центрировать нечего. Задайте `min-height` (например, `100dvh`)."),
      h("Ошибка 4. Поля вместо `gap`"),
      p("`margin-right` у каждого элемента оставляет лишний отступ после последнего и усложняет перенос. `gap` задаёт расстояние между элементами корректно."),
      h("Ошибка 5. `order` без учёта доступности"),
      p("`order` и `*-reverse` меняют только визуальный порядок: Tab и скринридер идут по DOM. Это нарушает WCAG 1.3.2 (осмысленная последовательность) и 2.4.3 (порядок фокуса). Меняйте порядок в разметке."),
      h("Ошибка 6. Ожидать, что flex-элемент уважает `float`/`vertical-align`"),
      p("Эти свойства на flex-элементах не действуют. Для выравнивания используйте `align-self` и автоматические поля."),
      h("Ошибка 7. Flex на внуках"),
      p("`display: flex` влияет только на **прямых** детей. Если нужная раскладка внутри вложенного блока, сделайте flex-контейнером именно его."),
      h("Ошибка 8. Забыть про `min-width: 0`"),
      p("Длинный текст внутри flex-элемента растягивает контейнер, пока у элемента `min-width: auto`. Добавьте `min-width: 0` (подробности — в теме о размерах flex-элементов)."),
    ]),

    section("antipatterns", [
      ul(
        "**`float` и `inline-block` для раскладок** в новом коде.",
        "**`display: flex` на всём «на всякий случай»:** лишние контексты форматирования и непредсказуемое поведение полей.",
        "**Центрирование через `position: absolute` и `transform`,** когда достаточно Flexbox.",
        "**`order` вместо правильного порядка в DOM.**",
        "**Фиксированная высота контейнера и `align-items: center` для текста,** который может вырасти.",
        "**Вложенность flex-контейнеров на каждый тег** без необходимости.",
        "**`flex-direction: row` как единственный вариант:** не продуманный перенос на узких экранах.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Flexbox — для одномерных компонентов,** Grid — для двумерных раскладок и страницы.",
        "**Всегда `gap`** для расстояний между элементами.",
        "**`flex-wrap: wrap`** для рядов, которые должны переноситься на узких экранах.",
        "**Логические значения** (`start`, `end`, `margin-inline-start`) вместо `left`/`right` для поддержки RTL.",
        "**Порядок в DOM = порядок чтения.** `order` — только для декоративных случаев.",
        "**`align-items: baseline`** для подписей и значений разного размера на одной линии.",
        "**`min-height`, а не `height`,** если контейнер центрирует содержимое.",
        "**Проверяйте в DevTools:** значок flex показывает оси и свободное место.",
      ),
    ]),

    section("edge-cases", [
      h("Элементы разной высоты и `stretch`"),
      p("По умолчанию `align-items: stretch`: элементы растягиваются на высоту линии, если у них нет собственной высоты. Если `height` задана явно, растяжения нет."),
      h("`safe center`"),
      p("`align-items: center` при нехватке места может вытолкнуть начало элемента за границы контейнера, и оно станет недоступным для прокрутки. `safe center` в таких случаях прижимает элемент к началу оси."),
      h("`space-between` при одном элементе"),
      p("Один элемент с `justify-content: space-between` прижимается к началу (как `flex-start`). Если нужна иная логика, используйте `margin: auto`."),
      h("`margin: auto` и `justify-content`"),
      p("Автоматические поля забирают свободное место **до** `justify-content`: если у элемента `margin-inline-start: auto`, `justify-content` не имеет свободного места для распределения."),
      h("Пустые и скрытые элементы"),
      p("Элементы с `display: none` в раскладке не участвуют, `visibility: hidden` — занимают место. Пустой `div` с `gap` порождает лишний промежуток: не используйте пустые «распорки»."),
      h("Анонимные flex-элементы"),
      p("Текст, стоящий прямо внутри flex-контейнера, оборачивается в анонимный flex-элемент, и несколько фрагментов текста между элементами могут стать отдельными элементами. Оборачивайте текст в элементы явно."),
      h("`inline-flex`"),
      p("`inline-flex` делает контейнер строчным (вписывается в строку текста), но его дети — по-прежнему flex-элементы. Подходит для кнопок с иконкой внутри абзаца."),
    ]),

    section("related", [
      ul(
        "[Размеры flex-элементов](/learn/css/flex-sizing) — `flex-grow`, `flex-shrink`, `flex-basis`, `min-width: auto`.",
        "[Паттерны Flexbox](/learn/css/flexbox-patterns) — навигация, карточки, «липкий» подвал.",
        "[Grid: основы](/learn/css/grid-basics) — двумерная раскладка.",
        "[display и нормальный поток](/learn/css/display-flow) — что было до Flexbox.",
        "[Размеры и overflow](/learn/css/overflow-sizing) — `min-width: 0`, перенос слов.",
        "[Логические свойства](/learn/css/logical-properties) — направление письма и `start`/`end`.",
        "Из других курсов: **доступность** — порядок чтения и фокуса при `order`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Раскладка на float и inline-block",
          code: `
            .nav li { display: inline-block; margin-right: 16px; }
            .nav li:last-child { margin-right: 0; }
            .center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
            .row::after { content: ""; display: block; clear: both; }
            .row .col { float: left; width: 33.33%; }
          `,
          note: "Нужны очищающие хаки, исключения для последнего элемента и абсолютное центрирование; щели из-за пробелов в HTML.",
        },
        {
          title: "Flexbox",
          code: `
            .nav { display: flex; gap: 1rem; }
            .center { display: flex; justify-content: center; align-items: center; min-height: 100dvh; }
            .row { display: flex; gap: 1rem; }
            .row .col { flex: 1; }
          `,
          note: "Расстояния — `gap`, центрирование — свойствами контейнера, равные колонки — `flex: 1`.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.flexbox-basics.ex1",
      title: "Какое свойство нужно?",
      difficulty: "foundation",
      kind: "recall",
      prompt: [
        p("Для каждой задачи назовите свойство Flexbox (и значение):"),
        ol(
          "Расположить элементы в столбец.",
          "Прижать первый элемент влево, последний — вправо, остальные распределить поровну между ними.",
          "Отцентрировать элементы по вертикали в ряду фиксированной высоты.",
          "Разрешить перенос элементов на новую строку.",
          "Задать расстояние 1rem между элементами.",
          "Выровнять один элемент по нижнему краю линии.",
        ),
      ],
      hints: ["Какая ось главная в ряду?", "Что выравнивает отдельный элемент?"],
      checks: ["Названы все шесть свойств"],
      solution: [
        ol(
          "`flex-direction: column`.",
          "`justify-content: space-between`.",
          "`align-items: center`.",
          "`flex-wrap: wrap`.",
          "`gap: 1rem`.",
          "`align-self: flex-end`.",
        ),
      ],
    }),
    exercise({
      id: "css.flexbox-basics.ex2",
      title: "Навигационная панель",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Сверстайте панель: слева логотип, справа три ссылки и кнопка «Войти». На узких экранах ссылки переносятся под логотип. Используйте Flexbox, `gap` и автоматические поля, без `float` и позиционирования."),
      ],
      starter: {
        lang: "html",
        code: `
          <header class="nav">
            <a class="logo" href="/">DevDock</a>
            <a href="/learn">Курсы</a>
            <a href="/practice">Практика</a>
            <a href="/me">Кабинет</a>
            <button>Войти</button>
          </header>
        `,
      },
      hints: ["Как прижать группу к правому краю?", "Что разрешит перенос?", "Как расстояния сделать независимыми от полей?"],
      checks: ["`display: flex`, `gap`, `flex-wrap`", "`margin-inline-start: auto` у ссылок (или `margin-inline-end: auto` у логотипа)", "Работает на узких экранах"],
      solution: [
        code(
          "css",
          `
          .nav { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; padding: 0.75rem 1rem; }
          .logo { margin-inline-end: auto; font-weight: 700; }
          `,
        ),
        ul(
          "`margin-inline-end: auto` у логотипа забирает свободное место: ссылки и кнопка оказываются у правого края.",
          "`flex-wrap: wrap` переносит элементы на новую строку, `gap` задаёт расстояния между рядами и столбцами.",
          "`align-items: center` выравнивает ссылки и кнопку по вертикали.",
        ),
      ],
    }),
    exercise({
      id: "css.flexbox-basics.ex3",
      title: "Не центрируется",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Заголовок должен быть по центру экрана по обеим осям, но он вверху слева, а карточки в колонке растянулись во всю ширину. Исправьте три дефекта: центрирование, ширина карточек, ширина колонки."),
      ],
      starter: {
        lang: "html",
        code: `
          <style>
            .hero { display: flex; justify-content: center; }
            .stack { display: flex; flex-direction: column; justify-content: center; }
            .stack > .card { background: #e8eaf6; padding: 1rem; }
          </style>
          <section class="hero"><h1>Привет</h1></section>
          <div class="stack"><div class="card">1</div><div class="card">2</div></div>
        `,
      },
      hints: ["Есть ли у контейнера высота?", "Какая ось поперечная в колонке?", "Что растягивает элементы колонки по ширине?"],
      checks: ["`min-height` и `align-items: center` у `.hero`", "`align-items: flex-start`/`center` у `.stack`", "Ширина колонки ограничена"],
      solution: [
        code(
          "css",
          `
          .hero { display: flex; justify-content: center; align-items: center; min-height: 100dvh; }
          .stack { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; max-width: 20rem; margin-inline: auto; }
          `,
        ),
        ul(
          "`.hero`: без высоты и `align-items` центрировать по вертикали нечего — нужны `min-height` и `align-items: center`.",
          "`.stack`: в колонке `justify-content` управляет вертикалью; элементы растянуты, потому что `align-items: stretch` по умолчанию. `align-items: center` (или `flex-start`) сделает их по ширине содержимого.",
          "`max-width` и `margin-inline: auto` ограничивают колонку и центрируют её.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "css.flexbox-basics.challenge",
    title: "Адаптивная панель инструментов с тестом расстояний",
    scenario: [
      p("Панель инструментов редактора: группа кнопок слева, поиск в центре (растягивается), группа действий справа. На узком экране вторая строка с поиском, а группы сохраняют внутренние расстояния. Нужно реализовать на Flexbox и написать тест, проверяющий расстояния и перенос."),
    ],
    requirements: [
      "Три группы: слева, центр (поиск), справа",
      "Поле поиска растягивается и занимает всё свободное место",
      "На узком экране поиск переносится на отдельную строку на всю ширину",
      "Расстояния между кнопками — `gap` и не зависят от разметки",
      "Тест измеряет расстояния и положение элементов в двух ширинах",
    ],
    constraints: [
      "Без `float`, `position: absolute` и отрицательных полей",
      "Порядок DOM совпадает с порядком чтения",
    ],
    acceptance: [
      "На ширине 900px все группы на одной линии, поиск растянут",
      "На ширине 400px поиск занимает отдельную строку на всю ширину",
      "Расстояние между кнопками внутри группы равно значению `gap`",
      "Порядок фокуса совпадает с визуальным",
    ],
    hints: [
      "Какое свойство отдаёт полю поиска свободное место?",
      "Как заставить поиск перейти на новую строку на узком экране?",
      "Как проверить перенос в тесте?",
    ],
    solution: [
      code(
        "html",
        `
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; padding: 0.5rem 1rem; }
          .group { display: flex; gap: 0.5rem; }
          .search { flex: 1 1 16rem; min-width: 0; }
          .search input { width: 100%; font: inherit; padding: 0.4rem 0.6rem; }
        </style>
        <div class="toolbar">
          <div class="group"><button>Жирный</button><button>Курсив</button></div>
          <div class="search"><input type="search" aria-label="Поиск"></div>
          <div class="group"><button>Отменить</button><button>Сохранить</button></div>
        </div>
        `,
        { runnable: true, lineNumbers: true },
      ),
      code(
        "js",
        `
        for (const width of [900, 400]) {
          await page.setViewportSize({ width, height: 600 });
          const r = await page.evaluate(() => {
            const [a, b, c] = [...document.querySelectorAll(".toolbar > *")].map((e) => e.getBoundingClientRect());
            const btn = [...document.querySelectorAll(".group:first-child button")].map((e) => e.getBoundingClientRect());
            const mid = (r) => Math.round(r.top + r.height / 2);
            return { sameRow: mid(a) === mid(b) && mid(b) === mid(c), searchWidth: Math.round(b.width), gap: Math.round(btn[1].left - btn[0].right) };
          });
          console.log(width, r);   // 900: sameRow true; 400: sameRow false; gap = 8 (расстояния между кнопками)
        }
        `,
        { filename: "toolbar.test.js" },
      ),
      ul(
        "**Распределение места:** `flex: 1 1 16rem` у поиска — растёт и сжимается, базовый размер 16rem. Если на линии не хватает места, элемент переносится.",
        "**`min-width: 0`:** позволяет полю сжиматься без вылезания.",
        "**`gap`:** расстояния внутри групп и между группами не зависят от разметки.",
        "**Порядок:** DOM совпадает с визуальным, поэтому фокус идёт слева направо и сверху вниз.",
      ),
    ],
  },

  interview: [
    iq("css.flexbox-basics.i1", "basic", "Какие две оси есть во Flexbox и что на них влияет?", [
      ul(
        "Главная ось задаётся `flex-direction`; вдоль неё работает `justify-content`.",
        "Поперечная ось перпендикулярна главной; по ней работают `align-items`, `align-self`, `align-content`.",
      ),
    ]),
    iq("css.flexbox-basics.i2", "basic", "Как отцентрировать элемент по обеим осям?", [
      p("Контейнеру: `display: flex; justify-content: center; align-items: center;` и ненулевая высота (например, `min-height: 100dvh`). Либо элементу: `margin: auto` внутри flex-контейнера."),
    ]),
    iq("css.flexbox-basics.i3", "intermediate", "В чём разница между `align-items` и `align-content`?", [
      ul(
        "`align-items` выравнивает элементы **внутри каждой линии** по поперечной оси.",
        "`align-content` распределяет **сами линии** внутри контейнера; работает только при нескольких линиях (`flex-wrap: wrap`) и свободном месте по поперечной оси.",
      ),
    ]),
    iq("css.flexbox-basics.i4", "intermediate", "Зачем нужен `gap` и чем он лучше полей?", [
      p("`gap` создаёт расстояние **между** элементами и линиями: нет лишнего отступа у краёв и после последнего элемента, не нужны исключения `:last-child`, работает при переносе. Поля же складываются и требуют исправлений."),
    ]),
    iq("css.flexbox-basics.i5", "intermediate", "Как работает `margin: auto` во Flexbox?", [
      p("Автоматические поля забирают свободное место по своей оси до `justify-content`: `margin-inline-start: auto` прижимает элемент к концу, `margin: auto` центрирует по обеим осям."),
    ]),
    iq("css.flexbox-basics.i6", "advanced", "Почему `order` и `row-reverse` могут нарушать доступность?", [
      p("Они меняют лишь визуальный порядок: Tab и скринридер следуют порядку DOM. В результате фокус «прыгает» по странице, а озвучиваемая последовательность не совпадает с видимой (WCAG 1.3.2, 2.4.3). Порядок нужно менять в разметке."),
    ]),
    iq("css.flexbox-basics.i7", "engineering", "Когда использовать Flexbox, а когда Grid?", [
      ul(
        "Flexbox — одномерные компоненты: ряд или колонка, распределение места по одной оси.",
        "Grid — двумерная раскладка: строки и столбцы одновременно, области страницы.",
        "Они комбинируются: Grid для макета страницы, Flexbox для компонентов внутри ячеек.",
      ),
    ]),
    iq("css.flexbox-basics.i8", "debugging", "Элемент не центрируется по вертикали с `align-items: center`. Что проверите?", [
      ul(
        "Есть ли у контейнера высота: без неё линия равна содержимому, центрировать нечего.",
        "Нужная ли ось: в `column` вертикаль — главная (`justify-content`).",
        "Не мешают ли `align-self` у элемента, `margin` или `height: 100%` без определённой высоты.",
      ),
    ]),
  ],

  exam: [
    mcq("css.flexbox-basics.e1", "foundation", "Какое свойство задаёт направление главной оси?", ["`justify-content`", "`align-items`", "`flex-direction`", "`flex-wrap`"], 2, "`flex-direction` определяет главную ось: `row`, `row-reverse`, `column`, `column-reverse`."),
    mcq("css.flexbox-basics.e2", "foundation", "Какое свойство распределяет свободное место вдоль главной оси?", ["`justify-content`", "`align-items`", "`align-content`", "`gap`"], 0, "`justify-content` управляет положением элементов вдоль главной оси."),
    mcq("css.flexbox-basics.e3", "intermediate", "Что делает `margin-inline-start: auto` у flex-элемента?", ["Ничего", "Задаёт отступ 0", "Центрирует по вертикали", "Забирает свободное место перед элементом и прижимает его к концу оси"], 3, "Автоматические поля поглощают свободное место по своей оси."),
    mcq("css.flexbox-basics.e4", "intermediate", "Когда работает `align-content`?", ["При нескольких линиях и свободном месте по поперечной оси", "Всегда", "Только в `column`", "Только с `gap`"], 0, "`align-content` распределяет линии, поэтому нужен `flex-wrap: wrap` и свободное место по поперечной оси."),
    mcq("css.flexbox-basics.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`gap` создаёт расстояние между элементами без лишнего отступа у краёв", "`order` меняет порядок фокуса", "`float` не действует на flex-элементы", "`justify-content` в `column` управляет вертикалью"], [0, 2, 3], "`order` меняет только визуальный порядок: фокус идёт по DOM."),
    mcq("css.flexbox-basics.e6", "advanced", "Какое значение `align-items` по умолчанию?", ["`flex-start`", "`center`", "`stretch`", "`baseline`"], 2, "По умолчанию элементы растягиваются на высоту линии (`stretch`), если у них нет собственной высоты."),
    open("css.flexbox-basics.e7", "intermediate", "Объясните, как центрировать блок по обеим осям и почему иногда это «не работает».", [
      ul(
        "Контейнеру `display: flex; justify-content: center; align-items: center;`.",
        "Нужна высота контейнера (`min-height`/`height`), иначе по вертикали центрировать нечего.",
        "В `flex-direction: column` оси меняются местами.",
        "Альтернатива: `margin: auto` у элемента.",
      ),
    ], ["Названы свойства контейнера", "Упомянута высота контейнера", "Упомянуты оси в `column`"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.flexbox-basics.m1", "intermediate", "`flex-direction: column` и `justify-content: center`. Что центрируется?", ["Горизонталь", "Вертикаль (главная ось), если у контейнера есть высота", "Обе оси", "Ничего"], 1, "В колонке главная ось вертикальна: `justify-content` распределяет место по вертикали."),
    mcq("css.flexbox-basics.m2", "advanced", "Почему лучше `gap`, а не `margin-right` у каждого элемента?", ["Быстрее", "Нет разницы", "Работает только в Flexbox", "Нет лишнего отступа у последнего элемента, корректно работает при переносе строк"], 3, "`gap` создаёт расстояния только между элементами и между линиями при переносе."),
    mcq("css.flexbox-basics.m3", "advanced", "Содержимое выше контейнера, а у контейнера `align-items: center`. Что произойдёт?", ["Начало содержимого может оказаться недоступным; `safe center` защищает от этого", "Ничего", "Контейнер вырастет", "Прокрутка появится"], 0, "При нехватке места `center` выталкивает элемент за начало оси, а `safe center` прижимает его к началу."),
    open("css.flexbox-basics.m4", "advanced", "Опишите набор правил для команды по использованию Flexbox.", [
      ul(
        "Flexbox — для одномерных компонентов; страница — Grid.",
        "Расстояния — только `gap`; порядок — только в DOM, `order` для декоративных случаев.",
        "Логические значения (`start`/`end`, `margin-inline-*`) для RTL.",
        "`min-width: 0` у растягиваемых элементов с текстом; перенос слов.",
        "Тесты расстояний и переноса на нескольких ширинах; проверка клавиатурой.",
      ),
    ], ["Есть выбор между Flex и Grid", "Есть правила gap/order/min-width", "Есть тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.flexbox-basics.f1", front: "Главная и поперечная оси?", back: "Главная — вдоль `flex-direction`; поперечная — перпендикулярна." },
    { id: "css.flexbox-basics.f2", front: "`justify-content` против `align-items`?", back: "Главная ось против поперечной (внутри линии)." },
    { id: "css.flexbox-basics.f3", front: "`align-content`?", back: "Распределяет линии; нужны перенос и свободное место." },
    { id: "css.flexbox-basics.f4", front: "Центрирование по обеим осям?", back: "`justify-content: center; align-items: center` + высота; либо `margin: auto`." },
    { id: "css.flexbox-basics.f5", front: "`order` и доступность?", back: "Меняет только визуальный порядок: фокус и чтение идут по DOM." },
    { id: "css.flexbox-basics.f6", front: "`gap`?", back: "Расстояние между элементами и линиями, без лишних отступов у краёв." },
  ],

  sources: [
    { title: "CSS Flexible Box Layout Module Level 1", url: "https://www.w3.org/TR/css-flexbox-1/", publisher: "W3C" },
    { title: "CSS Box Alignment Module Level 3", url: "https://www.w3.org/TR/css-align-3/", publisher: "W3C" },
    { title: "MDN: Basic concepts of flexbox", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox", publisher: "MDN" },
    { title: "MDN: flex-direction", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction", publisher: "MDN" },
    { title: "MDN: justify-content", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content", publisher: "MDN" },
    { title: "WCAG 2.2: Meaningful Sequence", url: "https://www.w3.org/TR/WCAG22/#meaningful-sequence", publisher: "W3C" },
  ],
};
