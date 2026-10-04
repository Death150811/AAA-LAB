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

export const containingBlock: Topic = {
  id: "css.containing-block",
  slug: "containing-block",
  domain: "css",
  module: "positioning",
  title: "Содержащий блок и точка привязки",
  titleEn: "The containing block: what percentages and offsets are relative to",
  summary:
    "Любой процентный размер и любое смещение считаются относительно **содержащего блока**. Тема объясняет, как браузер его определяет для обычных, абсолютных, фиксированных и липких элементов, какие свойства (`transform`, `filter`, `contain`, `will-change`, `backdrop-filter`) неожиданно создают новую точку привязки, почему «улетают» выпадающие меню и модальные окна, как помогает верхний слой (`dialog`, `popover`) и как отлаживать такие случаи.",
  minutes: 45,
  prerequisites: ["css.positioning", "css.box-model"],
  tags: ["containing block", "offsetParent", "transform", "filter", "contain", "will-change", "backdrop-filter", "perspective", "top layer", "dialog", "popover", "percentage", "absolute", "fixed", "clipping", "anchor positioning"],
  keyConcepts: [
    { term: "Содержащий блок", en: "containing block", text: "Прямоугольник, относительно которого вычисляются проценты (`width`, `margin`, `padding`) и смещения (`top`, `left`). Для разных значений `position` он определяется по-разному." },
    { term: "Для `absolute`", text: "Padding-box ближайшего предка с `position` не `static` **или** с `transform`, `filter`, `perspective`, `contain: layout/paint`, `will-change` этих свойств, `backdrop-filter`." },
    { term: "Для `fixed`", text: "Окно просмотра — но если у предка есть `transform`, `filter` или другое из того же списка, то этот предок. Поэтому «зафиксированный» элемент внезапно прокручивается." },
    { term: "Для остальных", text: "Content-box ближайшего блочного предка: проценты ширины, высоты и полей считаются от него." },
    { term: "Верхний слой обходит ограничения", text: "`<dialog>` в модальном режиме и `popover` отображаются в верхнем слое (top layer): их положение не зависит от `transform`, `overflow` и `z-index` предков." },
  ],
  sections: [
    section("definition", [
      def("Содержащий блок", "Прямоугольная область, относительно которой браузер вычисляет процентные значения размеров и полей, а также смещения позиционированного элемента. Не обязательно совпадает с родителем в DOM.", "containing block"),
      def("Начальный содержащий блок", "Содержащий блок корневого элемента: прямоугольник размером с окно просмотра, закреплённый в начале документа. Используется для `absolute`, если позиционированных предков нет.", "initial containing block"),
      def("Верхний слой", "Слой отрисовки над остальным содержимым страницы, в который браузер помещает модальные `dialog`, элементы в полноэкранном режиме и открытые `popover`. Не зависит от предков по стилям положения.", "top layer"),
      def("Родитель смещения", "Элемент, возвращаемый `element.offsetParent`: ближайший предок, относительно которого браузер считает `offsetTop` и `offsetLeft`. Практический способ узнать точку привязки.", "offset parent"),
    ]),

    section("why", [
      h("Две самые частые «загадки позиционирования»"),
      ul(
        "**«Мой `position: fixed` внезапно прокручивается вместе с контентом»:** у предка появился `transform` (например, для анимации) или `filter`, и он стал содержащим блоком.",
        "**«Выпадающее меню обрезано»:** предок с `overflow: hidden/auto` обрезает абсолютно позиционированного потомка, который привязан внутри него.",
        "**«Процентная высота не работает»:** у содержащего блока не определена высота.",
        "**«Абсолютный блок в углу страницы, а не карточки»:** нет позиционированного предка.",
      ),
      h("Зачем знать правило"),
      p("Если вы понимаете, как определяется содержащий блок, вы быстро находите причину в DevTools, выбираете правильное решение (верхний слой вместо ручного позиционирования) и не добавляете `transform` «для красоты» на обёртки, внутри которых живут модальные окна."),
      insight("Содержащий блок — это ответ на вопрос «от чего считается?». Если значение кажется странным, первым делом спросите: относительно какого блока оно вычисляется — и какой предок его создал."),
    ]),

    section("mental-model", [
      p("Представьте **стопку прозрачных листов**. Каждый предок, который «захватил» потомков, — это лист с рамкой. Абсолютный элемент ищет ближайший лист с рамкой (позиционированный или «захватывающий») и измеряет расстояния от его краёв. Фиксированный элемент измеряет от краёв **окна монитора**, но если на пути есть особый лист (`transform`, `filter`), элемент считает, что именно этот лист — «окно». Верхний слой — это отдельный стеклянный экран перед стопкой: что на нём лежит, не зависит от листов под ним."),
      diagram(
        `
        окно просмотра (viewport)
        └─ html (начальный содержащий блок)
           └─ .page                       position: static
              └─ .wrap                    transform: translateZ(0)   ← «захватывает» абсолютных и фиксированных потомков
                 └─ .card                 position: relative         ← ближайший позиционированный
                    ├─ .badge             position: absolute   → привязан к .card
                    └─ .toast             position: fixed      → привязан к .wrap (не к окну!)
        `,
        "Кто становится содержащим блоком",
      ),
      table(
        ["position", "Содержащий блок", "Привязка меняется, если у предка…"],
        [
          ["`static`, `relative`", "Content-box ближайшего блочного предка", "—"],
          ["`absolute`", "Padding-box ближайшего позиционированного предка (или начальный блок)", "`transform`, `filter`, `perspective`, `will-change`, `contain: layout/paint`, `backdrop-filter`"],
          ["`fixed`", "Окно просмотра", "`transform`, `filter`, `perspective`, `will-change`, `contain: layout/paint`, `backdrop-filter`"],
          ["`sticky`", "Ближайший блочный предок; прилипает относительно ближайшего прокручиваемого предка", "`overflow` не `visible` у любого предка меняет область прилипания"],
        ],
        "Определение содержащего блока",
      ),
    ]),

    section("technical", [
      h("Проценты и содержащий блок"),
      ul(
        "`width` и `max-width` в процентах — от **ширины** содержащего блока; `height` — от **высоты**, если она определена.",
        "`margin` и `padding` в процентах — всегда от **ширины** содержащего блока (даже вертикальные).",
        "`top`/`bottom` — от высоты, `left`/`right` — от ширины содержащего блока позиционированного элемента.",
        "`transform: translate(50%)` — от размеров самого элемента (а не содержащего блока).",
        "`border-radius: 50%` — от размеров самого элемента.",
      ),
      h("Какие свойства создают содержащий блок для `absolute` и `fixed`"),
      table(
        ["Свойство предка", "Создаёт содержащий блок"],
        [
          ["`position: relative/absolute/sticky/fixed`", "Для `absolute` — да (для `fixed` — нет)"],
          ["`transform` (любое значение, кроме `none`)", "Для `absolute` и `fixed`"],
          ["`filter` (кроме `none`)", "Для `absolute` и `fixed`"],
          ["`backdrop-filter` (кроме `none`)", "Для `absolute` и `fixed`"],
          ["`perspective` (кроме `none`)", "Для `absolute` и `fixed`"],
          ["`contain: layout`, `contain: paint`, `contain: strict/content`", "Для `absolute` и `fixed`"],
          ["`will-change: transform` (или `filter` и т. п.)", "Для `absolute` и `fixed`"],
        ],
        "Предки, меняющие точку привязки (проверено в современном Chromium)",
      ),
      note("Свойства `overflow`, `opacity`, `isolation` содержащий блок **не** создают, но `overflow` обрезает потомков, привязанных внутри, а `opacity` и `isolation` создают контекст наложения (см. тему о z-index). Эти эффекты не нужно путать."),
      h("Как узнать точку привязки"),
      code(
        "js",
        `
        const el = document.querySelector(".popup");

        // 1. offsetParent: ближайший предок, относительно которого считается offsetTop/Left
        el.offsetParent;     // для fixed вернёт null; для abs — позиционированного или body

        // 2. поиск «захватывающих» предков
        function findContainingAncestors(node) {
          const result = [];
          for (let p = node.parentElement; p; p = p.parentElement) {
            const s = getComputedStyle(p);
            if (
              s.position !== "static" ||
              s.transform !== "none" ||
              s.filter !== "none" ||
              s.perspective !== "none" ||
              s.willChange.includes("transform") ||
              /layout|paint|strict|content/.test(s.contain)
            ) {
              result.push(p);
            }
          }
          return result;
        }
        `,
        { filename: "containing-block.js" },
      ),
      h("Обрезка и порядок наложения: отдельные проблемы"),
      ul(
        "**Обрезка `overflow`:** потомок обрезается предком с `overflow` не `visible`, **если этот предок находится между потомком и его содержащим блоком** (или сам является им). Абсолютно позиционированный элемент, чей содержащий блок выше предка с `overflow`, не обрезается этим предком.",
        "**Порядок наложения** определяется контекстами наложения, а не содержащим блоком: выпадающее меню может оказаться под соседом, даже если привязано правильно.",
      ),
      h("Верхний слой: `dialog` и `popover`"),
      code(
        "html",
        `
        <button popovertarget="menu">Меню</button>
        <div id="menu" popover>
          <a href="/a">Пункт 1</a>
          <a href="/b">Пункт 2</a>
        </div>

        <dialog id="confirm"><p>Удалить?</p><form method="dialog"><button>Да</button><button>Нет</button></form></dialog>
        <script>
          document.getElementById("confirm").showModal();   // в верхнем слое: не зависит от transform и overflow предков
        </script>
        `,
        { filename: "top-layer.html" },
      ),
      ul(
        "`<dialog>` с `showModal()` и `popover` отображаются в **верхнем слое**: их положение и порядок наложения не зависят от `transform`, `overflow` и `z-index` предков.",
        "У `popover` встроены закрытие по Esc и по клику снаружи (`popover=\"auto\"`), доступность и управление фокусом.",
        "Для привязки подсказки к якорю используется **CSS anchor positioning** (`anchor-name`, `position-anchor`, `anchor()`) — новая возможность, поддержка которой зависит от браузера; на период перехода комбинируйте верхний слой с запасным позиционированием.",
      ),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        .card { position: relative; }

        .card .badge {
          position: absolute;
          inset-block-start: 0;
          inset-inline-end: 0;
        }

        .wrap { transform: translateZ(0); }
        .wrap .toast { position: fixed; bottom: 1rem; right: 1rem; }

        .menu[popover] {
          margin: 0;
          inset: auto;
        }
        `,
        [
          { line: 1, text: "Карточка — позиционированный предок: значок будет привязан к ней." },
          { line: [3, 7], text: "Значок в верхнем правом углу карточки через логические свойства: зеркалится в RTL." },
          { line: 9, text: "Обёртка с `transform` — теперь она «захватывает» фиксированных и абсолютных потомков." },
          { line: 10, text: "`.toast` по-прежнему `fixed`, но привязан к `.wrap`, а не к окну: при прокрутке обёртки он поедет с ней." },
          { line: [12, 15], text: "Элемент с атрибутом `popover` отображается в верхнем слое; браузерные стили позиционируют его по центру, и при необходимости их сбрасывают." },
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
        <title>Содержащий блок</title>
        <style>
          body { margin: 0; font: 14px/1.4 system-ui, sans-serif; }
          .box { width: 18rem; height: 8rem; margin: 1rem; background: #e8eaf6; position: relative; }
          .box.t { transform: translateZ(0); }
          .pin { position: absolute; right: 0; bottom: 0; background: #ffcc80; padding: 0.25rem; }
          .fix { position: fixed; right: 0; bottom: 0; background: #ef9a9a; padding: 0.25rem; }
        </style>
        <div class="box">relative: absolute-значок привязан к блоку<span class="pin">absolute</span></div>
        <div class="box t">transform: даже fixed привязан к блоку<span class="fix">fixed</span></div>
        <div style="height: 120vh"></div>
        `,
        { filename: "containing-basics.html", runnable: true },
      ),
      p("Красный `fixed`-значок во втором блоке привязан не к окну, а к блоку с `transform`: он остаётся в углу блока и прокручивается вместе со страницей."),
    ]),

    section("detailed-example", [
      p("Типичная ошибка: обёртка страницы получила `transform` ради анимации появления, и все «зафиксированные» элементы внутри (плавающая кнопка, уведомление) начали вести себя неправильно. Сравните два решения."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <title>transform и fixed</title>
        <style>
          body { margin: 0; font: 1rem/1.5 system-ui, sans-serif; }
          .page { height: 160vh; padding: 1rem; background: linear-gradient(#e8eaf6, #fff); }

          .page--bug { transform: translateY(0); }           /* создаёт содержащий блок для fixed */
          .fab { position: fixed; right: 1rem; bottom: 1rem; padding: 0.75rem 1.25rem; border: 0; border-radius: 999px; background: #c62828; color: #fff; font: inherit; }
        </style>

        <div class="page page--bug">
          <p>Прокрутите страницу: кнопка «Чат» ведёт себя неправильно, потому что у обёртки <code>transform</code>.</p>
          <button class="fab">Чат</button>
        </div>
        </html>
        `,
        { filename: "transform-fixed-bug.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
      code(
        "html",
        `
        <!-- Решение 1: вынести fixed-элемент за пределы «захватывающего» предка -->
        <div class="page page--bug"> … </div>
        <button class="fab">Чат</button>

        <!-- Решение 2: убрать transform после завершения анимации (animation-fill-mode: none) -->
        <style>
          .page { animation: appear 0.3s ease-out; }
          @keyframes appear { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        </style>

        <!-- Решение 3: для оверлеев и меню использовать верхний слой -->
        <dialog id="chat"> … </dialog>
        `,
        { filename: "transform-fixed-solutions.html", collapsed: true },
      ),
    ]),

    section("analysis", [
      steps(
        [
          ["Причина", "`transform` на `.page` делает её содержащим блоком для `fixed`-потомков. Кнопка привязана к краям страницы, а не окна, поэтому «уезжает» вниз вместе с контентом."],
          ["Решение 1", "Вынести кнопку из «захватывающего» контейнера: она снова привязана к окну. Лучше всего — разместить такие элементы на уровне `body`."],
          ["Решение 2", "Не оставлять `transform` после анимации: в конце ключевых кадров значение `none` снимает содержащий блок. Если анимация сохраняет значение (`fill-mode: forwards`), эффект остаётся."],
          ["Решение 3", "Для окон, меню и подсказок использовать верхний слой: `dialog.showModal()` и `popover` не зависят от `transform` и `overflow` предков."],
        ],
        "Как исправить",
      ),
      ul(
        "**Профилактика:** если нужен слой для анимации, используйте `opacity` и `transform` на конкретных элементах, а не на обёртках, внутри которых живут окна и закреплённые панели.",
        "**`will-change: transform`** тоже создаёт содержащий блок: не вешайте его на крупные контейнеры «для ускорения».",
        "**Проверка:** в DevTools найдите предка с `transform`/`filter` и сравните `offsetParent` у проблемного элемента.",
      ),
    ]),

    section("internals", [
      h("Как браузер вычисляет положение"),
      steps(
        [
          ["Поиск содержащего блока", "Для каждого позиционированного элемента движок поднимается по дереву, пока не найдёт предка, создающего содержащий блок для данного значения `position`."],
          ["Разрешение процентов", "Проценты размеров и смещений превращаются в длины по размерам найденного блока. Если размер не определён (например, высота), процент ведёт себя как `auto`."],
          ["Раскладка и обрезка", "Элемент раскладывается в своём контексте; обрезка `overflow` применяется предками между элементом и его содержащим блоком."],
          ["Верхний слой", "Элементы верхнего слоя вынесены в отдельный слой отрисовки, который рисуется над деревом документа в порядке открытия."],
        ],
        "Алгоритм (упрощённо)",
      ),
      h("Почему `transform` и `filter` создают содержащий блок"),
      p("Эти свойства превращают элемент в **составной слой** с собственной системой координат: потомки внутри — как «дочерний холст», который целиком сдвигается, вращается или размывается. Чтобы вычислить положение `fixed`-потомка внутри такого холста, браузер должен использовать координаты холста, а не окна. Спецификация закрепляет это правило, поэтому поведение единообразно во всех браузерах."),
      h("Исследование в консоли"),
      code(
        "js",
        `
        // быстрый поиск предков, которые «захватывают» fixed/absolute
        function trap(el) {
          for (let p = el.parentElement; p; p = p.parentElement) {
            const s = getComputedStyle(p);
            if (s.transform !== "none" || s.filter !== "none" || s.perspective !== "none"
                || s.backdropFilter !== "none" || /transform|filter/.test(s.willChange) || /layout|paint|strict|content/.test(s.contain)) {
              return p;
            }
          }
          return null;
        }
        trap(document.querySelector(".fab"));   // вернёт обёртку, которая создаёт содержащий блок
        `,
        { filename: "trap.js" },
      ),
    ]),

    section("mistakes", [
      h("Ошибка 1. `fixed` внутри анимируемой обёртки"),
      p("Классика: плавное появление страницы через `transform` на корневой обёртке ломает все закреплённые элементы внутри. Анимируйте `opacity` у контента или снимайте `transform` по завершении."),
      h("Ошибка 2. Выпадающее меню в контейнере с `overflow`"),
      wrongRight(
        "css",
        {
          code: `
            .toolbar { overflow: auto; }                       /* прокрутка при нехватке места */
            .toolbar .menu { position: absolute; top: 100%; }  /* меню обрезается */
          `,
          note: "Абсолютное меню привязано внутри `overflow`-контейнера и обрезается его границей.",
        },
        {
          code: `
            .toolbar .menu[popover] { margin: 0; inset: auto; }   /* верхний слой: не обрезается предками */
          `,
          note: "`popover` в верхнем слое не обрезается и не зависит от `overflow` и `transform` предков.",
        },
      ),
      h("Ошибка 3. Ожидать, что `opacity` или `isolation` создадут точку привязки"),
      p("Они создают **контекст наложения**, но не содержащий блок. Для привязки нужен `position`, `transform` и т. д. Не путайте эти механизмы."),
      h("Ошибка 4. Процентная высота без определённой высоты"),
      p("`height: 50%` у потомка блока с `height: auto` не работает. Либо задайте высоту родителю, либо используйте Flexbox/Grid (`min-height`, `flex`, `1fr`)."),
      h("Ошибка 5. `will-change` на крупных контейнерах"),
      p("Подсказка `will-change: transform` создаёт содержащий блок и контекст наложения и тратит память. Применяйте её к небольшим анимируемым элементам, и только на время анимации."),
      h("Ошибка 6. Ручной «перенос» элементов в `body` без доступности"),
      p("Приём «портала» (рендер меню в конец `body`) решает обрезку, но ломает порядок фокуса и ARIA-связи, если не продумать. Нативные `dialog` и `popover` решают эту задачу правильно."),
      h("Ошибка 7. Игнорировать `scroll`-родителей при расчёте позиции в JavaScript"),
      p("Если вы позиционируете подсказку по `getBoundingClientRect()` вручную, не забудьте учесть прокрутку и изменение размеров (`resize`, `scroll`); иначе подсказка «отстанет» от якоря."),
    ]),

    section("antipatterns", [
      ul(
        "**`transform: translateZ(0)` на обёртках «для производительности»:** создаёт содержащий блок и контекст наложения.",
        "**`will-change: transform` везде.**",
        "**Глубокие цепочки `position: relative`** без нужды: непонятно, к чему привязан элемент.",
        "**Меню и подсказки внутри `overflow: hidden`** без верхнего слоя.",
        "**Ручной расчёт позиции в JS** для всплывающих блоков вместо `popover`/anchor positioning.",
        "**`z-index: 9999`** как лекарство от скрытых окон — причина обычно в контексте наложения или содержащем блоке.",
        "**Модальные окна на `div` с `position: fixed`** вместо `<dialog>`: теряются фокус, Esc и инертность фона.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Знайте точку привязки каждого абсолютного элемента:** `position: relative` у компонента-владельца.",
        "**Модальные окна и всплывающие панели — `dialog` и `popover`:** верхний слой, фокус, Esc и доступность «из коробки».",
        "**Анимируйте конкретные элементы,** а не корневые обёртки; после анимации не оставляйте `transform`.",
        "**Осторожно с `filter`, `backdrop-filter`, `will-change`** на контейнерах с закреплёнными потомками.",
        "**Отлаживайте через `offsetParent` и DevTools:** ищите предков с `transform`/`filter`/`contain`.",
        "**Для сложных привязок (подсказка к элементу) используйте anchor positioning** с запасным вариантом.",
        "**Тестируйте прокрутку и изменение размера:** закреплённые элементы должны вести себя одинаково в потоке и в прокручиваемых контейнерах.",
      ),
    ]),

    section("edge-cases", [
      h("`position: sticky` и содержащий блок"),
      p("Липкий элемент остаётся внутри содержащего блока (родителя) и прилипает относительно ближайшего прокручиваемого предка. Если родитель закончился, элемент «уезжает» вместе с ним."),
      h("Начальный содержащий блок и мобильные браузеры"),
      p("Начальный содержащий блок связан с областью окна: при показе и скрытии панелей браузера его размер может меняться; для высоты используйте `dvh`, `svh`, `lvh` вместо `vh`."),
      h("Строчные (inline) предки"),
      p("Если ближайший позиционированный предок — строчный элемент, содержащим блоком становится прямоугольник вокруг его первого и последнего строчных боксов. Для переносимого на несколько строк `inline` значение смещений может быть неожиданным."),
      h("Таблицы и содержащий блок"),
      p("Ячейки таблицы с `position: relative` исторически вели себя нестабильно в некоторых браузерах; сегодня это поддерживается, но обёртка внутри ячейки надёжнее."),
      h("Теневой DOM"),
      p("Содержащий блок определяется по **дереву раскладки**, а не по дереву DOM: слоты и проекция могут менять предков. В веб-компонентах точку привязки проверяйте по итоговому дереву."),
      h("Печать"),
      p("При печати содержащим блоком для `fixed` становится страница; элементы могут повторяться на каждой. Отключайте закрепление в `@media print`."),
    ]),

    section("related", [
      ul(
        "[Позиционирование](/learn/css/positioning) — значения `position`, смещения, паттерны.",
        "[Контексты наложения и z-index](/learn/css/stacking-contexts) — порядок наложения и верхний слой.",
        "[Размеры и overflow](/learn/css/overflow-sizing) — обрезка и области прокрутки.",
        "[Интерактивные элементы HTML](/learn/html/interactive-elements) — `dialog`, `details`, `popover`.",
        "[Анимации и производительность](/learn/css/animation-performance-motion) — `transform`, `will-change`.",
        "[Рендеринг и композиция](/learn/css/rendering-pipeline) — составные слои.",
        "Из других курсов: **JS** — `offsetParent`, `getBoundingClientRect`, `ResizeObserver`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Ручное позиционирование окна",
          code: `
            .page { transform: translateZ(0); }               /* «для производительности» */
            .modal { position: fixed; inset: 0; z-index: 9999; background: rgb(0 0 0 / 50%); }
            .modal__box { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
          `,
          note: "`transform` на обёртке ломает `fixed`, `z-index: 9999` не помогает, фокус и Esc нужно реализовывать вручную.",
        },
        {
          title: "Нативный верхний слой",
          code: `
            dialog { margin: auto; padding: 1.5rem; border: 0; border-radius: 0.75rem; }
            dialog::backdrop { background: rgb(0 0 0 / 50%); }
          `,
          note: "`dialog.showModal()` создаёт подложку, центрирует окно, перехватывает фокус и закрывается по Esc; предки на него не влияют.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.containing-block.ex1",
      title: "Найдите содержащий блок",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Для каждого элемента укажите, относительно чего вычисляются его смещения (`top`, `left`):"),
        ol(
          "Абсолютный блок в `div` без `position`, внутри `body`.",
          "Абсолютный блок в `div` с `position: relative`.",
          "Фиксированный блок в `div` без `transform`.",
          "Фиксированный блок в `div` с `transform: translateX(0)`.",
          "Абсолютный блок в `div` с `overflow: hidden` без `position`.",
        ),
      ],
      hints: ["Какие предки создают содержащий блок?", "Влияет ли `overflow` на точку привязки?"],
      checks: ["Все пять случаев определены верно"],
      solution: [
        table(
          ["Случай", "Содержащий блок"],
          [
            ["1", "Начальный содержащий блок (область окна/документа)"],
            ["2", "`div` с `position: relative` (его padding-box)"],
            ["3", "Окно просмотра"],
            ["4", "`div` с `transform` — `fixed` привязывается к нему"],
            ["5", "Начальный содержащий блок; `overflow` точку привязки не создаёт (но может не обрезать, раз привязка выше)"],
          ],
        ),
      ],
    }),
    exercise({
      id: "css.containing-block.ex2",
      title: "Меню обрезается при прокрутке",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Выпадающее меню внутри панели с `overflow-x: auto` обрезается нижней границей панели. Объясните причину, предложите два решения и сравните их."),
      ],
      starter: {
        lang: "html",
        code: `
          <style>
            .bar { overflow-x: auto; border: 1px solid #ccc; padding: 0.5rem; position: relative; }
            .menu { position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #999; }
          </style>
          <div class="bar">
            <button>Меню</button>
            <div class="menu"><a href="#">Пункт 1</a><br><a href="#">Пункт 2</a></div>
          </div>
        `,
      },
      hints: ["Где находится содержащий блок меню относительно `overflow`?", "Какие элементы обходят обрезку предками?"],
      checks: ["Названа причина: меню внутри контейнера с `overflow`", "Предложены `popover` и вынос из контейнера/`position: fixed`", "Сравнение решений"],
      solution: [
        ul(
          "**Причина:** содержащий блок меню (`.bar`) сам имеет `overflow`: абсолютно позиционированное меню рисуется внутри и обрезается его границами.",
          "**Решение 1:** `popover` — меню в верхнем слое не обрезается предками и получает управление Esc и клик-вне.",
          "**Решение 2:** вынести меню из `overflow`-контейнера (поместить в `body` и позиционировать по координатам кнопки); работает, но требует JavaScript и внимания к фокусу и ARIA.",
          "**Сравнение:** `popover` проще, доступнее и не требует расчётов; ручной вынос нужен для старых браузеров.",
        ),
        code(
          "html",
          `
          <button popovertarget="m">Меню</button>
          <div id="m" popover><a href="#">Пункт 1</a><br><a href="#">Пункт 2</a></div>
          `,
        ),
      ],
    }),
    exercise({
      id: "css.containing-block.ex3",
      title: "Закреплённая кнопка уезжает",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("После добавления анимации появления страница получила `transform: translateY(0)` в конце ключевых кадров (`animation-fill-mode: forwards`), и кнопка `position: fixed` перестала быть закреплённой. Найдите причину, предложите минимум три способа исправить и напишите скрипт-диагност, который находит «захватывающего» предка."),
      ],
      starter: {
        lang: "css",
        code: `
          .page { animation: appear 0.3s ease-out forwards; }
          @keyframes appear { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          .fab { position: fixed; right: 1rem; bottom: 1rem; }
        `,
      },
      hints: ["Остаётся ли `transform` после анимации?", "Как анимировать без `transform` на обёртке?", "Что делает значение `none`?"],
      checks: ["Названа причина: `transform` создаёт содержащий блок", "Три способа исправления", "Есть скрипт-диагност"],
      solution: [
        ul(
          "**Причина:** `animation-fill-mode: forwards` сохраняет конечное значение `transform: translateY(0)`, а любое значение, кроме `none`, создаёт содержащий блок для `fixed`.",
          "**Способ 1:** в конечном кадре использовать `transform: none` (и убрать `forwards`, если значение не нужно).",
          "**Способ 2:** анимировать только `opacity` либо перенести анимацию на внутренний контейнер, не содержащий `fixed`-элементов.",
          "**Способ 3:** вынести кнопку из анимируемой обёртки (на уровень `body`).",
        ),
        code(
          "js",
          `
          function trap(el) {
            for (let p = el.parentElement; p; p = p.parentElement) {
              const s = getComputedStyle(p);
              if (s.transform !== "none" || s.filter !== "none" || s.perspective !== "none" || /transform|filter/.test(s.willChange)) return p;
            }
            return null;
          }
          console.log(trap(document.querySelector(".fab")));   // .page — виновник
          `,
          { filename: "trap.js" },
        ),
      ],
    }),
  ],

  challenge: {
    id: "css.containing-block.challenge",
    title: "Стратегия для всплывающих слоёв в библиотеке компонентов",
    scenario: [
      p("В библиотеке компонентов выпадающие меню, подсказки и модальные окна по-разному ломаются в разных контекстах: внутри таблиц с прокруткой они обрезаются, внутри анимированных обёрток теряют привязку, а `z-index` дошёл до 99999. Нужна единая стратегия."),
    ],
    requirements: [
      "Таблица «тип слоя → механизм» (меню, подсказка, модальное окно, уведомление)",
      "Правила для `position`, `transform`, `overflow` в компонентах-обёртках",
      "Автоматическая проверка: поиск предков, создающих содержащий блок, в тестовой странице",
      "План миграции с `z-index: 9999`",
    ],
    constraints: [
      "Нельзя использовать `z-index` выше 100 в компонентах",
      "Нативные механизмы предпочтительнее самодельных",
    ],
    acceptance: [
      "Модальные окна используют `dialog`, меню и подсказки — `popover`",
      "Уведомления закреплены `position: fixed` на уровне `body`",
      "Тест находит и сообщает о предках с `transform`/`filter` у контейнеров с `fixed`-потомками",
      "Описан порядок миграции",
    ],
    hints: [
      "Какие слои требуют верхнего слоя, а какие — нет?",
      "Где в дереве должны жить фиксированные уведомления?",
      "Как автоматически найти потенциальные ловушки?",
    ],
    solution: [
      table(
        ["Слой", "Механизм", "Почему"],
        [
          ["Модальное окно", "`<dialog>` + `showModal()`", "Верхний слой, подложка, фокус, Esc, инертный фон"],
          ["Выпадающее меню / подсказка с интерактивом", "`popover` (`auto`)", "Верхний слой, закрытие по Esc и клику снаружи"],
          ["Простая подсказка при наведении", "`popover=\"manual\"` или CSS anchor positioning с запасным вариантом", "Не обрезается, не требует расчётов"],
          ["Уведомления (toast)", "Контейнер на уровне `body` с `position: fixed`", "Привязка к окну, не зависит от компонентов"],
          ["Липкая шапка/панель", "`position: sticky`", "Остаётся в потоке"],
        ],
        "Стратегия слоёв",
      ),
      code(
        "js",
        `
        // тест-диагност: находит fixed-элементы, привязанные не к окну
        const issues = [];
        for (const el of document.querySelectorAll("*")) {
          if (getComputedStyle(el).position !== "fixed") continue;
          for (let p = el.parentElement; p; p = p.parentElement) {
            const s = getComputedStyle(p);
            if (s.transform !== "none" || s.filter !== "none" || s.perspective !== "none" || /transform|filter/.test(s.willChange)) {
              issues.push({ fixed: el.className, trap: p.className || p.tagName });
              break;
            }
          }
        }
        console.log(issues);   // пусто, если ни один fixed-элемент не «пойман»
        `,
        { filename: "fixed-trap-check.js" },
      ),
      ul(
        "**Правила компонентов:** обёртки не получают `transform`, `filter`, `will-change` и `contain: layout` без необходимости; анимации — на внутренних элементах; `overflow` не на контейнерах с меню.",
        "**Тест:** запускается на витрине компонентов (Storybook) и в e2e-сценариях; падает при находках.",
        "**Миграция:** найти все `z-index` ≥ 1000, для каждого выяснить причину (контекст наложения, содержащий блок, ручной слой), заменить на `dialog`/`popover`; затем ввести шкалу `z-index` на токенах и линтер.",
        "**Документация:** таблица слоёв, примеры, «чек-лист отладки»: `offsetParent`, поиск `transform`/`filter`, проверка верхнего слоя.",
      ),
    ],
  },

  interview: [
    iq("css.containing-block.i1", "basic", "Что такое содержащий блок?", [
      p("Прямоугольник, относительно которого браузер вычисляет проценты размеров и смещения элемента. Для `absolute` — ближайший позиционированный предок, для `fixed` — окно просмотра, для обычных элементов — content-box ближайшего блочного предка."),
    ]),
    iq("css.containing-block.i2", "basic", "Как узнать, к какому элементу привязан абсолютный блок?", [
      p("В DevTools, либо через `element.offsetParent`: он возвращает ближайший предок, относительно которого вычисляется положение (для позиционированных — сам предок, иначе `body`)."),
    ]),
    iq("css.containing-block.i3", "intermediate", "Почему `position: fixed` может вести себя как `absolute`?", [
      p("Если у предка есть `transform`, `filter`, `perspective`, `backdrop-filter`, `will-change` этих свойств или `contain: layout/paint`, он становится содержащим блоком для `fixed`-потомка: тот привязывается к предку, а не к окну."),
    ]),
    iq("css.containing-block.i4", "intermediate", "От чего считаются проценты в `margin-top`, `padding-top` и `height`?", [
      ul(
        "`margin` и `padding` (все стороны) — от **ширины** содержащего блока.",
        "`height` — от **высоты** содержащего блока, если она определена.",
        "`top`/`bottom` — от высоты, `left`/`right` — от ширины содержащего блока.",
      ),
    ]),
    iq("css.containing-block.i5", "intermediate", "Почему выпадающее меню обрезается и как это исправить?", [
      ul(
        "Меню внутри предка с `overflow` не `visible`, находящегося между меню и его содержащим блоком (или являющегося им), обрезается его границей.",
        "Решения: `popover` или `dialog` (верхний слой), вынос в `body` с ручным позиционированием, либо снять `overflow`.",
      ),
    ]),
    iq("css.containing-block.i6", "advanced", "Что такое верхний слой (top layer)?", [
      ul(
        "Слой отрисовки над документом для модальных `dialog`, `popover`, полноэкранных элементов.",
        "Положение и порядок не зависят от `transform`, `overflow` и `z-index` предков.",
        "Даёт встроенную доступность: управление фокусом, Esc, инертный фон у модального `dialog`.",
      ),
    ]),
    iq("css.containing-block.i7", "engineering", "Как вы избегаете проблем с содержащим блоком в библиотеке компонентов?", [
      ul(
        "Слои — `dialog` и `popover`; уведомления — на уровне `body` с `fixed`.",
        "Нет `transform`/`filter`/`will-change` на обёртках; анимации — на внутренних элементах.",
        "Тест, находящий `fixed`-элементы, пойманные предками; шкала `z-index` и линтер.",
        "Документация и обзор кода.",
      ),
    ]),
    iq("css.containing-block.i8", "debugging", "Закреплённая кнопка «уехала» вместе с контентом после добавления анимации. Что проверите?", [
      ul(
        "Найти предка с `transform`/`filter`/`will-change`: `trap(el)` или вручную по дереву.",
        "Проверить `animation-fill-mode: forwards`: он сохраняет `transform`.",
        "Исправить: `transform: none` в конце, анимировать внутренний контейнер, вынести элемент из предка.",
      ),
    ]),
  ],

  exam: [
    mcq("css.containing-block.e1", "foundation", "К чему привязан `position: absolute`, если позиционированных предков нет?", ["К родителю", "К соседу", "К `html` с `position: relative`", "К начальному содержащему блоку (область окна/документа)"], 3, "Без позиционированных предков абсолютный элемент использует начальный содержащий блок."),
    mcq("css.containing-block.e2", "foundation", "Какое свойство предка заставит `fixed`-потомка привязаться к предку, а не к окну?", ["`color`", "`margin`", "`transform`", "`display: block`"], 2, "Любое значение `transform`, кроме `none`, создаёт содержащий блок для `fixed` и `absolute` потомков."),
    mcq("css.containing-block.e3", "intermediate", "Какие предки НЕ создают содержащего блока для `absolute`?", ["`overflow: hidden`", "`position: relative`", "`transform: scale(1)`", "`filter: blur(0)`"], 0, "`overflow` содержащего блока не создаёт (но может обрезать); остальные варианты создают точку привязки."),
    mcq("css.containing-block.e4", "intermediate", "Где отображается открытый `popover`?", ["Внутри родителя с учётом `overflow`", "Под всем содержимым", "В верхнем слое, независимо от `overflow` и `transform` предков", "В теневом дереве"], 2, "Открытые `popover` и модальные `dialog` помещаются в верхний слой."),
    mcq("css.containing-block.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`will-change: transform` создаёт содержащий блок для `fixed`", "`opacity: 0.9` создаёт содержащий блок для `fixed`", "`offsetParent` помогает найти точку привязки", "`dialog.showModal()` не зависит от `transform` предков"], [0, 2, 3], "`opacity` создаёт контекст наложения, но не содержащий блок. Остальные утверждения верны."),
    mcq("css.containing-block.e6", "advanced", "От чего считается `padding-top: 10%` у абсолютно позиционированного блока?", ["От высоты содержащего блока", "От окна", "От размера шрифта", "От ширины содержащего блока"], 3, "Проценты `padding` и `margin` всегда считаются от ширины содержащего блока."),
    open("css.containing-block.e7", "intermediate", "Объясните, почему нельзя безопасно вешать `transform` на корневую обёртку страницы.", [
      ul(
        "Любое значение `transform`, кроме `none`, создаёт содержащий блок и контекст наложения.",
        "Все `fixed`-потомки привязываются к обёртке, а не к окну: закреплённые элементы начинают прокручиваться, а меню и окна ломают привязку.",
        "Решения: анимировать внутренние элементы, не оставлять `transform` после анимации, использовать `dialog`/`popover`.",
      ),
    ], ["Названа причина (содержащий блок)", "Описано влияние на `fixed`", "Предложены решения"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.containing-block.m1", "intermediate", "У предка `container-type: inline-size`. Станет ли он содержащим блоком для `fixed`-потомка?", ["Нет — по крайней мере, в современном Chromium привязка остаётся к окну", "Да", "Только для `absolute`", "Только в Safari"], 0, "Измерения показывают, что `container-type` сам по себе точку привязки для `fixed` и `absolute` не создаёт; при сомнениях проверяйте `offsetParent` и поведение в целевых браузерах."),
    mcq("css.containing-block.m2", "advanced", "Почему `dialog.showModal()` центрируется в окне даже внутри предка с `transform`?", ["Баг", "Он помещается в верхний слой и не зависит от предков по стилям положения", "Из-за `margin: auto`", "Из-за `z-index`"], 1, "Верхний слой выводит элемент за рамки дерева раскладки предков, поэтому `transform` и `overflow` на него не влияют."),
    mcq("css.containing-block.m3", "advanced", "Какое решение для «зафиксированной» кнопки внутри анимируемой обёртки самое надёжное?", ["`z-index: 9999`", "`position: absolute`", "`will-change: transform`", "Вынести кнопку на уровень `body`"], 3, "Вне «захватывающего» предка кнопка снова привязана к окну; остальные варианты не решают причину."),
    open("css.containing-block.m4", "advanced", "Опишите, как вы будете диагностировать «улетевший» всплывающий элемент в большом приложении.", [
      ul(
        "Определить `position` элемента и его `offsetParent`.",
        "Подняться по предкам, ища `transform`/`filter`/`perspective`/`will-change`/`contain` и `overflow`; использовать скрипт-диагност.",
        "Проверить контексты наложения и `z-index`, если элемент виден, но скрыт под другими.",
        "Исправить архитектурно: верхний слой (`dialog`/`popover`), вынос на уровень `body`, снятие лишних свойств; добавить тест и правило в линтере/документации.",
      ),
    ], ["Использован `offsetParent` и поиск предков", "Учтены `overflow` и контексты наложения", "Решения архитектурные и закреплены тестом"], { format: "debug" }),
  ],

  flashcards: [
    { id: "css.containing-block.f1", front: "Содержащий блок?", back: "Прямоугольник, от которого считаются проценты и смещения. Зависит от `position`." },
    { id: "css.containing-block.f2", front: "Что делает `transform` у предка?", back: "Создаёт содержащий блок для `fixed` и `absolute` потомков." },
    { id: "css.containing-block.f3", front: "Создают ли `overflow`/`opacity` содержащий блок?", back: "Нет. `overflow` обрезает, `opacity` создаёт контекст наложения." },
    { id: "css.containing-block.f4", front: "Как узнать точку привязки?", back: "`el.offsetParent` и поиск предков с transform/filter/contain." },
    { id: "css.containing-block.f5", front: "Что в верхнем слое?", back: "Модальный `dialog`, открытый `popover`, полноэкранные элементы." },
    { id: "css.containing-block.f6", front: "Проценты в `padding`?", back: "От ширины содержащего блока." },
  ],

  sources: [
    { title: "CSS 2.1: Containing blocks", url: "https://www.w3.org/TR/CSS21/visudet.html#containing-block-details", publisher: "W3C" },
    { title: "CSS Positioned Layout Module Level 3", url: "https://www.w3.org/TR/css-position-3/", publisher: "W3C" },
    { title: "MDN: Containing block", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block", publisher: "MDN" },
    { title: "MDN: Popover API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Popover_API", publisher: "MDN" },
    { title: "MDN: <dialog>", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog", publisher: "MDN" },
    { title: "MDN: Top layer", url: "https://developer.mozilla.org/en-US/docs/Glossary/Top_layer", publisher: "MDN" },
  ],
};
