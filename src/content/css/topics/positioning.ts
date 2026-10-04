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

export const positioning: Topic = {
  id: "css.positioning",
  slug: "positioning",
  domain: "css",
  module: "positioning",
  title: "Позиционирование: static, relative, absolute, fixed, sticky",
  titleEn: "Positioning: static, relative, absolute, fixed, sticky and inset",
  summary:
    "Свойство `position` позволяет сдвинуть элемент относительно его обычного места, привязать к родителю или окну, закрепить при прокрутке. Тема разбирает пять значений, смещения (`top`, `right`, `bottom`, `left`, `inset`), вывод из потока, ширину абсолютных блоков, центрирование, типовые паттерны (значки, подсказки, оверлеи, липкие заголовки) и ограничения — когда позиционирование нужно, а когда лучше Flexbox и Grid.",
  minutes: 55,
  prerequisites: ["css.box-model", "css.display-flow"],
  tags: ["position", "static", "relative", "absolute", "fixed", "sticky", "top", "left", "inset", "out of flow", "overlay", "badge", "tooltip", "sticky header", "scroll-margin", "scroll-padding"],
  keyConcepts: [
    { term: "`position: static`", text: "Значение по умолчанию: элемент в нормальном потоке, свойства `top/left/…` и `z-index` на него не действуют." },
    { term: "`relative`", text: "Остаётся в потоке и занимает своё место, но визуально сдвигается смещениями. Главное применение — стать **точкой привязки** для абсолютных потомков." },
    { term: "`absolute`", text: "Выходит из потока: не занимает места, позиционируется относительно ближайшего **позиционированного предка** (с `position` не `static`)." },
    { term: "`fixed`", text: "Привязывается к окну просмотра и не прокручивается вместе со страницей; тоже выходит из потока." },
    { term: "`sticky`", text: "Гибрид: ведёт себя как `relative`, пока не достигнет порога прокрутки, затем «прилипает», как `fixed`, оставаясь внутри родителя." },
  ],
  sections: [
    section("definition", [
      def("Позиционирование", "Механизм CSS, позволяющий определять положение элемента относительно потока, ближайшего позиционированного предка или окна. Управляется свойством `position` и смещениями `top`, `right`, `bottom`, `left` (или `inset`).", "positioning"),
      def("Позиционированный элемент", "Элемент, у которого вычисленное значение `position` отличается от `static`. Такие элементы создают точку привязки для абсолютных потомков и участвуют в порядке наложения.", "positioned element"),
      def("Вывод из потока", "Состояние, при котором элемент не занимает места в раскладке родителя и не влияет на положение соседей. Характерно для `absolute` и `fixed`.", "out-of-flow"),
      def("Смещения", "Свойства `top`, `right`, `bottom`, `left` и сокращение `inset`, задающие расстояние от соответствующих краёв точки отсчёта. Работают только у позиционированных элементов.", "inset properties"),
    ]),

    section("why", [
      h("Когда без позиционирования не обойтись"),
      ul(
        "**Наложение:** значок на углу аватара, метка на карточке, подпись поверх изображения.",
        "**Оверлеи:** затемнение, модальные окна, выпадающие меню и подсказки.",
        "**Закрепление:** шапка, боковая панель, оглавление, «липкие» заголовки таблиц.",
        "**Декор:** псевдоэлементы с абсолютным положением (линии, стрелки, подчёркивания).",
      ),
      h("И когда нельзя"),
      p("Для основной раскладки страницы позиционирование — плохой выбор: абсолютные блоки не занимают места, высота родителя не учитывает их содержимое, а адаптивность превращается в ручной подбор чисел. Колонки, ряды и сетки решают Flexbox и Grid."),
      insight("Позиционирование — инструмент для **исключений из потока** (наложить, закрепить, привязать к углу), а не для построения страницы. Если вы раскладываете блоки через `position: absolute` и `left: 340px`, вы пишете карту, а не вёрстку."),
    ]),

    section("mental-model", [
      p("Представьте **доску с магнитами**. Нормальный поток — это строки текста, написанные на доске мелом. `relative` — вы слегка сдвинули напечатанное слово, но «дырка» от него осталась. `absolute` — вы прикрепили магнит: он лежит поверх доски и мел под ним не стирается; положение магнита задано расстоянием от краёв **ближайшей рамки** на доске (позиционированного предка). `fixed` — стикер на экране монитора: прокрутка доски его не двигает. `sticky` — резиновая лента: пока доска позволяет, карточка едет вместе с текстом, а у края — прилипает."),
      diagram(
        `
        нормальный поток:        A  B  C

        B relative top:10 left:20:   A     (место B сохраняется)
                                          B  (смещён визуально)
                                     C

        B absolute:               A  C        (место B освободилось, соседи сдвинулись)
                                  B  — лежит поверх, привязан к ближайшему позиционированному предку
        `,
        "Относительное и абсолютное позиционирование",
      ),
      table(
        ["Значение", "В потоке?", "Привязка", "Типичное применение"],
        [
          ["`static`", "Да", "—", "Всё по умолчанию"],
          ["`relative`", "Да (место сохраняется)", "К собственному обычному месту", "Точка привязки для потомков, небольшой сдвиг"],
          ["`absolute`", "Нет", "К ближайшему позиционированному предку", "Значки, подсказки, оверлеи внутри компонента"],
          ["`fixed`", "Нет", "К окну просмотра", "Шапка, чат-кнопка, баннеры"],
          ["`sticky`", "Да", "К ближайшему прокручиваемому предку", "Липкие заголовки и оглавления"],
        ],
        "Пять значений position",
      ),
    ]),

    section("technical", [
      h("Смещения и `inset`"),
      code(
        "css",
        `
        .corner-badge {
          position: absolute;
          top: 0;
          right: 0;
          transform: translate(50%, -50%);     /* центр значка на углу */
        }

        .overlay {
          position: absolute;
          inset: 0;                            /* сокращение для top/right/bottom/left: 0 */
        }

        .sidebar {
          position: fixed;
          inset-block: 0;                      /* логические: сверху и снизу */
          inset-inline-start: 0;               /* слева в LTR, справа в RTL */
        }
        `,
        { filename: "inset.css" },
      ),
      ul(
        "Смещения **обязательно** сочетаются с `position` не `static`: иначе они не действуют.",
        "Проценты считаются от размеров **содержащего блока**: `top: 50%` — половина его высоты.",
        "Если заданы и `left`, и `right` у блока с `width: auto`, он растягивается между ними; если задана и ширина — остаётся свободное место, которое можно распределить `margin: auto`.",
        "`inset` — сокращение для четырёх смещений; логические `inset-inline`, `inset-block` подходят для любого направления письма.",
      ),
      h("`relative`"),
      p("Блок остаётся в потоке и занимает исходное место, а затем визуально сдвигается. Соседи его сдвиг **не замечают**. На практике `position: relative` без смещений используют, чтобы сделать элемент точкой привязки для абсолютных потомков."),
      h("`absolute`"),
      ul(
        "**Выходит из потока:** родитель не учитывает его при расчёте высоты, соседи занимают освободившееся место.",
        "**Привязка:** к ближайшему предку с `position` не `static`; если такого нет — к начальному содержащему блоку (область окна на первой странице).",
        "**Ширина:** при `width: auto` и отсутствии `left`/`right` блок «сжимается» по содержимому (shrink-to-fit). Если заданы `left` и `right`, он растягивается между ними.",
        "**Блокификация:** `display` вычисляется как блочный: `inline` превращается в `block`, `inline-block` — в `block`.",
        "**Центрирование:** при `inset: 0` и заданных размерах `margin: auto` центрирует блок в содержащем блоке.",
      ),
      code(
        "css",
        `
        .modal {
          position: absolute;
          inset: 0;
          width: min(90%, 30rem);
          height: fit-content;
          margin: auto;                /* центр по обеим осям */
        }
        `,
        { filename: "center-absolute.css" },
      ),
      h("`fixed`"),
      ul(
        "Привязывается к окну просмотра: не двигается при прокрутке страницы.",
        "Не занимает места в потоке: контент под ним нужно **освободить** отступом (`padding-top`) или `scroll-padding-top` для якорей.",
        "**Исключение:** если у предка есть `transform`, `filter`, `perspective`, `contain: layout/paint` или `will-change` этих свойств, `fixed` привязывается к этому предку, а не к окну (подробнее — в теме «Содержащий блок»).",
        "Мобильные браузеры изменяют размер окна при показе панелей: для высоты используйте `dvh`.",
      ),
      h("`sticky`"),
      code(
        "css",
        `
        .table-header {
          position: sticky;
          top: 0;                         /* порог: прилипнуть, когда верх достигнет верха прокручиваемой области */
          background: white;
          z-index: 1;
        }
        `,
        { filename: "sticky.css" },
      ),
      ul(
        "Остаётся в потоке и занимает исходное место.",
        "Прилипает относительно **ближайшего прокручиваемого предка** (то есть предка с `overflow` не `visible`), а при его отсутствии — окна.",
        "Не выходит за границы **родителя**: прилипший блок «уезжает» вместе с концом родительского контейнера.",
        "Требует порога: хотя бы одно из `top`, `bottom`, `left`, `right` должно быть задано.",
        "Частая причина неработающего `sticky`: у предка стоит `overflow: hidden/auto`, высота родителя равна высоте элемента или порог не задан.",
      ),
      h("Порядок наложения"),
      p("Позиционированные элементы рисуются **поверх** непозиционированных в порядке следования в документе. Явное управление — свойством `z-index`, которому посвящена отдельная тема."),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        .avatar { position: relative; width: 3rem; }

        .avatar__status {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 0.75rem;
          aspect-ratio: 1;
          border: 2px solid white;
          border-radius: 50%;
          background: #2e7d32;
        }

        .toolbar {
          position: sticky;
          top: 0;
        }
        `,
        [
          { line: 1, text: "Аватар становится точкой привязки: сам не смещается, но задаёт систему координат для потомков." },
          { line: [3, 6], text: "Индикатор статуса вынут из потока и прижат к правому нижнему углу аватара." },
          { line: [7, 10], text: "Размер задан `width` и `aspect-ratio`; белая рамка отделяет индикатор от фото." },
          { line: [14, 17], text: "Панель инструментов остаётся в потоке, но при прокрутке прилипает к верху прокручиваемой области." },
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
        <title>position</title>
        <style>
          body { font: 16px/1.5 system-ui, sans-serif; margin: 1rem; }
          .box { background: #e8eaf6; padding: 0.5rem; margin-bottom: 0.5rem; }
          .rel { position: relative; top: 8px; left: 24px; background: #c5cae9; }
          .wrap { position: relative; height: 6rem; background: #fff3e0; margin-block: 1rem; }
          .abs { position: absolute; right: 0.5rem; bottom: 0.5rem; background: #ffcc80; padding: 0.25rem 0.5rem; }
        </style>
        <div class="box">Обычный блок</div>
        <div class="box rel">Relative: сдвинут, а место сохранено</div>
        <div class="box">Следующий блок</div>
        <div class="wrap">Контейнер (relative)<span class="abs">absolute: правый нижний угол</span></div>
        `,
        { filename: "position-basics.html", runnable: true },
      ),
    ]),

    section("detailed-example", [
      p("Карточка товара с наложениями: метка «Новинка» в углу, подпись поверх изображения, закрытие по кнопке, липкая шапка списка. Каждый приём решается своим значением `position`."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <title>Карточки</title>
        <style>
          body { margin: 0; font: 1rem/1.5 system-ui, sans-serif; }
          header { position: sticky; top: 0; z-index: 2; background: #1a237e; color: #fff; padding: 0.75rem 1rem; }

          .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 1rem; padding: 1rem; }

          .card { position: relative; overflow: hidden; border-radius: 0.75rem; background: #eceff1; }
          .card__img { display: block; width: 100%; aspect-ratio: 4 / 3; background: linear-gradient(135deg, #7986cb, #3949ab); }

          .card__tag { position: absolute; top: 0.5rem; left: 0.5rem; padding: 0.125rem 0.5rem; border-radius: 999px; background: #ffd54f; font-size: 0.8125rem; font-weight: 600; }
          .card__caption { position: absolute; inset: auto 0 0 0; padding: 0.5rem 0.75rem; color: #fff; background: rgb(0 0 0 / 55%); }
          .card__close { position: absolute; top: 0.25rem; right: 0.25rem; width: 2rem; height: 2rem; border: 0; border-radius: 50%; background: rgb(255 255 255 / 80%); cursor: pointer; }
          .card__close:focus-visible { outline: 3px solid #0b57d0; outline-offset: 2px; }

          .fab { position: fixed; right: 1rem; bottom: 1rem; padding: 0.75rem 1.25rem; border: 0; border-radius: 999px; background: #c62828; color: #fff; font: inherit; }
        </style>
        <header>Каталог (липкая шапка)</header>
        <div class="grid">
          <article class="card"><div class="card__img"></div><span class="card__tag">Новинка</span><button class="card__close" aria-label="Скрыть карточку">×</button><div class="card__caption">Кроссовки «Лёгкий шаг»</div></article>
          <article class="card"><div class="card__img"></div><div class="card__caption">Рюкзак «Город»</div></article>
          <article class="card"><div class="card__img"></div><div class="card__caption">Куртка «Ветер»</div></article>
          <article class="card"><div class="card__img"></div><div class="card__caption">Шапка «Зима»</div></article>
        </div>
        <div style="height: 80vh"></div>
        <button class="fab">Чат</button>
        </html>
        `,
        { filename: "cards-position.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Элемент", "Значение", "Роль"],
        [
          ["`header`", "`sticky; top: 0`", "Остаётся в потоке, прилипает к верху окна при прокрутке; `z-index` держит шапку над карточками"],
          ["`.card`", "`relative`", "Точка привязки для меток и кнопок; `overflow: hidden` скругляет и обрезает"],
          ["`.card__tag`", "`absolute; top/left`", "Метка в верхнем левом углу карточки"],
          ["`.card__caption`", "`absolute; inset: auto 0 0 0`", "Подпись на всю ширину у нижнего края: `top: auto`, остальные — 0"],
          ["`.card__close`", "`absolute; top/right`", "Кнопка закрытия: настоящая `button` с `aria-label`, а не `div`"],
          ["`.fab`", "`fixed; right/bottom`", "Плавающая кнопка в углу окна"],
        ],
        "Что делает пример",
      ),
      ul(
        "У карточек нет фиксированной высоты: она определяется изображением (`aspect-ratio`). Абсолютные потомки не влияют на размер — для подписи это ожидаемо.",
        "Подпись поверх изображения — полупрозрачный фон гарантирует контраст независимо от фото.",
        "Интерактивные наложения реализованы настоящими элементами (`button`), поэтому сохраняют клавиатуру и фокус; видимый фокус задан явно.",
      ),
    ]),

    section("internals", [
      h("Как браузер определяет положение"),
      steps(
        [
          ["Содержащий блок", "Для `absolute` — ближайший предок с `position` не `static` (его padding-box); для `fixed` — окно просмотра; для `relative` и `sticky` — как у обычных потоковых элементов."],
          ["Расчёт смещений", "Применяются `top/right/bottom/left` относительно краёв содержащего блока; недостающие размеры вычисляются из уравнения «left + margin + width + margin + right = ширина содержащего блока»."],
          ["Выход из потока", "Абсолютные и фиксированные блоки не участвуют в раскладке соседей и не влияют на высоту родителя."],
          ["Порядок наложения", "Позиционированные потомки рисуются в отдельном проходе над обычными блоками; порядок среди них — по `z-index`, затем по порядку в DOM."],
        ],
        "Расчёт положения",
      ),
      h("Измерение в JavaScript"),
      code(
        "js",
        `
        const badge = document.querySelector(".card__tag");
        const card = document.querySelector(".card");

        // положение относительно окна
        const b = badge.getBoundingClientRect();
        const c = card.getBoundingClientRect();

        // смещение относительно содержащего блока (padding-box родителя)
        const offsetLeft = b.left - c.left;

        // ближайший позиционированный предок: offsetParent
        badge.offsetParent === card;     // true, если card — позиционированный предок
        `,
        { filename: "position.js" },
      ),
      note("`element.offsetParent` возвращает ближайший позиционированный предок (или `body`, `td`, `th`, `table`): удобно, чтобы убедиться, к чему привязан абсолютный блок."),
    ]),

    section("mistakes", [
      h("Ошибка 1. `absolute` без позиционированного родителя"),
      wrongRight(
        "css",
        {
          code: `
            .card { }                       /* position: static */
            .badge { position: absolute; top: 0; right: 0; }
          `,
          note: "Значок привяжется не к карточке, а к ближайшему позиционированному предку или окну и «улетит» в угол страницы.",
        },
        {
          code: `
            .card { position: relative; }
            .badge { position: absolute; top: 0; right: 0; }
          `,
          note: "Родитель становится точкой привязки.",
        },
      ),
      h("Ошибка 2. Смещения без `position`"),
      p("`top: 10px` у `position: static` ничего не делает. Если смещение «не работает», проверьте `position` в Computed."),
      h("Ошибка 3. Ожидать, что `absolute` растянет родителя"),
      p("Абсолютные потомки не участвуют в расчёте высоты родителя: контейнер может схлопнуться, если в нём только абсолютные элементы. Задайте `min-height` или используйте поток."),
      h("Ошибка 4. `fixed` без компенсации"),
      p("Закреплённая шапка перекрывает начало страницы и целевые якоря. Добавьте `padding-top` и `scroll-padding-top` (или `scroll-margin-top` у якорей)."),
      h("Ошибка 5. `sticky` не прилипает"),
      ul(
        "У предка `overflow: hidden/auto` — прилипание к нему, а не к окну.",
        "Не задан порог (`top: 0`).",
        "Родитель по высоте равен самому элементу — «ехать» нечему.",
        "У предка `display: flex` с `align-items` по умолчанию: элемент растягивается на всю высоту; задайте `align-self: start`.",
      ),
      h("Ошибка 6. Позиционирование для основной раскладки"),
      p("`position: absolute; left: 280px; width: 700px` — хрупкая раскладка: не учитывает размер окна и содержимого. Используйте Flexbox и Grid."),
      h("Ошибка 7. Позиционирование интерактивных элементов вместо реальных"),
      p("Кнопка закрытия, нарисованная на `div` и спозиционированная поверх, недоступна клавиатуре. Используйте `button` и позиционируйте его."),
      h("Ошибка 8. Наложение скрывает содержимое при увеличении шрифта"),
      p("Подписи и метки, жёстко привязанные к углам, перекрывают текст, когда он вырастает. Оставляйте запас и тестируйте масштаб 200 %."),
    ]),

    section("antipatterns", [
      ul(
        "**Раскладка страницы через `absolute`** и числовые координаты.",
        "**`position: relative` повсюду «на всякий случай»:** создаёт лишние точки привязки и контексты наложения.",
        "**Магические `z-index: 9999`** вместо понятной шкалы.",
        "**Центрирование через `top: 50%; left: 50%; transform: translate(-50%, -50%)`** там, где достаточно Flexbox/Grid.",
        "**`fixed`-шапка без учёта якорей и мобильных панелей.**",
        "**Позиционированные интерактивные элементы без клавиатуры и фокуса.**",
        "**Абсолютные подписи без запаса места** — перекрытие при переводе и масштабировании.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Используйте поток, Flexbox и Grid** для раскладки; позиционирование — для наложений и закрепления.",
        "**Делайте точку привязки явной:** `position: relative` у компонента, внутри которого есть абсолютные потомки.",
        "**Логические свойства** (`inset-inline-start`) для сторон, зависящих от направления письма.",
        "**`sticky` вместо JavaScript** для липких заголовков; проверяйте `overflow` у предков.",
        "**Для центрирования** используйте `place-items: center` или `margin: auto`; для модальных окон — `<dialog>`.",
        "**Компенсируйте `fixed`-элементы** отступами и `scroll-padding-top`.",
        "**Оставляйте запас места под наложения** и проверяйте на длинных текстах и крупном шрифте.",
        "**Проверяйте `offsetParent` и содержащий блок** при отладке «улетевших» элементов.",
      ),
    ]),

    section("edge-cases", [
      h("`sticky` и `overflow`"),
      p("`overflow: hidden/auto` у любого предка делает его прокручиваемым контейнером, и прилипание считается относительно него. Чтобы прилипать к окну, уберите `overflow` у предков или используйте `overflow: clip`, который контейнера прокрутки не создаёт."),
      h("`position: fixed` внутри `transform`"),
      p("Если у предка есть `transform`, `filter`, `perspective`, `contain: layout/paint` или `will-change` этих свойств, `fixed`-потомок привязывается к этому предку: «зафиксированный» элемент начинает прокручиваться вместе с ним."),
      h("Процентные смещения"),
      p("`top: 50%` — половина **высоты** содержащего блока, `left: 50%` — половина ширины. Если высота содержащего блока не определена, процент ведёт себя как `auto`."),
      h("Относительное положение и `z-index`"),
      p("`position: relative` с `z-index` создаёт контекст наложения; без `z-index` порядок определяется положением в DOM. Подробнее — в теме о контекстах наложения."),
      h("Абсолютные и `inline`"),
      p("Абсолютные элементы всегда блокифицируются: `display: inline` у них недействителен. Вычисленное значение становится `block`."),
      h("Печать и `fixed`"),
      p("При печати `fixed`-элементы могут повторяться на каждой странице или пропадать, в зависимости от браузера. Для печатных стилей отключайте закрепление: `@media print { .fab { display: none } }`."),
      h("Якорная навигация и закреплённая шапка"),
      p("Переход по `#section` прокручивает цель к верху окна, под шапку. Решение: `scroll-margin-top` у целевых элементов или `scroll-padding-top` на `html`."),
    ]),

    section("related", [
      ul(
        "[Содержащий блок и привязка](/learn/css/containing-block) — как определяется точка отсчёта и что её меняет.",
        "[Контексты наложения и z-index](/learn/css/stacking-contexts) — порядок наложения.",
        "[display и нормальный поток](/learn/css/display-flow) — потоковые и выведенные из потока блоки.",
        "[Flexbox: основы](/learn/css/flexbox-basics) и [Grid: основы](/learn/css/grid-basics) — раскладка без позиционирования.",
        "[Размеры и overflow](/learn/css/overflow-sizing) — `overflow`, влияющий на `sticky`.",
        "[Интерактивные элементы HTML](/learn/html/interactive-elements) — `dialog`, `popover`, верхний слой.",
        "Из других курсов: **JS** — `getBoundingClientRect`, `offsetParent`, `IntersectionObserver` для липких элементов.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Позиционирование для раскладки",
          code: `
            .sidebar { position: absolute; left: 0; top: 80px; width: 280px; }
            .content { margin-left: 300px; }
            .modal { position: absolute; top: 50%; left: 50%; margin: -150px 0 0 -200px; width: 400px; height: 300px; }
          `,
          note: "Числа подогнаны под один размер окна; модальное окно центрируется отрицательными полями.",
        },
        {
          title: "Позиционирование для исключений",
          code: `
            .layout { display: grid; grid-template-columns: 17.5rem 1fr; gap: 1.25rem; }
            .sidebar { position: sticky; top: 1rem; align-self: start; }
            dialog { margin: auto; }              /* верхний слой, центр по умолчанию */
          `,
          note: "Раскладка — Grid; позиционирование — только липкая панель; модальное окно — `<dialog>` в верхнем слое.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.positioning.ex1",
      title: "Какое значение position?",
      difficulty: "foundation",
      kind: "recall",
      prompt: [
        p("Для каждой задачи выберите значение `position` и объясните выбор:"),
        ol(
          "Значок «Новинка» в углу карточки.",
          "Шапка, которая остаётся вверху при прокрутке и занимает место в потоке.",
          "Кнопка «Чат» в углу окна.",
          "Небольшой сдвиг блока при сохранении его места в потоке.",
          "Затемнение на весь родитель.",
        ),
      ],
      hints: ["Что должно остаться в потоке?", "К чему должен быть привязан элемент: к родителю или окну?"],
      checks: ["Выбор обоснован для всех пяти"],
      solution: [
        table(
          ["Задача", "position", "Обоснование"],
          [
            ["Значок в углу карточки", "`absolute` у значка + `relative` у карточки", "Привязка к карточке, значок не занимает места"],
            ["Шапка при прокрутке", "`sticky; top: 0`", "Остаётся в потоке, прилипает при прокрутке"],
            ["Кнопка «Чат»", "`fixed`", "Привязка к окну"],
            ["Небольшой сдвиг", "`relative` со смещением", "Место в потоке сохраняется"],
            ["Затемнение родителя", "`absolute; inset: 0`", "Покрывает родителя целиком"],
          ],
        ),
      ],
    }),
    exercise({
      id: "css.positioning.ex2",
      title: "Значок улетел в угол страницы",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Значок с количеством уведомлений должен быть в правом верхнем углу кнопки, но оказался в углу страницы. Объясните причину, исправьте и покажите, как проверить, к какому элементу привязан значок."),
      ],
      starter: {
        lang: "html",
        code: `
          <style>
            .bell { padding: 0.5rem 1rem; }
            .count { position: absolute; top: 0; right: 0; background: crimson; color: #fff; border-radius: 999px; padding: 0 0.4rem; }
          </style>
          <button class="bell">Уведомления <span class="count">3</span></button>
        `,
      },
      hints: ["Какое значение `position` у кнопки?", "Что делает `position: relative` у родителя?", "Какое свойство DOM показывает ближайший позиционированный предок?"],
      checks: ["Назван статичный родитель", "Добавлен `relative`", "Использован `offsetParent` для проверки"],
      solution: [
        code(
          "css",
          `
          .bell { position: relative; padding: 0.5rem 1rem; }
          .count { position: absolute; top: 0; right: 0; transform: translate(50%, -50%); background: crimson; color: #fff; border-radius: 999px; padding: 0 0.4rem; }
          `,
        ),
        ul(
          "**Причина:** у кнопки `position: static`, значок не нашёл позиционированного предка и привязался к окну.",
          "**Исправление:** `position: relative` у кнопки делает её точкой привязки.",
          "**Проверка:** `document.querySelector(\".count\").offsetParent` вернёт кнопку; до исправления — `body`.",
        ),
      ],
    }),
    exercise({
      id: "css.positioning.ex3",
      title: "Липкий заголовок не прилипает",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Заголовок раздела с `position: sticky; top: 0` не прилипает при прокрутке. Найдите четыре возможные причины и проверьте их в DevTools. Исправьте пример."),
      ],
      starter: {
        lang: "html",
        code: `
          <style>
            .page { overflow: hidden; }
            .section { display: flex; }
            .section h2 { position: sticky; background: #e8eaf6; margin: 0; }
          </style>
          <div class="page">
            <div class="section"><h2>Раздел</h2><div style="height: 120vh">Содержимое</div></div>
          </div>
        `,
      },
      hints: ["Где задан порог?", "Какой предок имеет `overflow`?", "Как ведёт себя flex-элемент по высоте?"],
      checks: ["Задан `top`", "Убран `overflow: hidden` или заменён `clip`", "Добавлен `align-self: start`"],
      solution: [
        ul(
          "**Нет порога:** не задан `top`/`bottom`/`left`/`right`. Добавьте `top: 0`.",
          "**`overflow: hidden` у предка** создаёт прокручиваемый контейнер: `sticky` прилипает к нему, а не к окну. Уберите `overflow` или замените на `overflow: clip`.",
          "**`display: flex` у родителя:** по умолчанию `align-items: stretch` растягивает заголовок на всю высоту, ему негде «ехать». Добавьте `align-self: start`.",
          "**Родитель слишком мал:** прилипший элемент не выходит за границы родителя; убедитесь, что высота родителя больше высоты заголовка.",
        ),
        code(
          "css",
          `
          .page { overflow: clip; }
          .section { display: flex; }
          .section h2 { position: sticky; top: 0; align-self: start; background: #e8eaf6; margin: 0; }
          `,
        ),
      ],
    }),
  ],

  challenge: {
    id: "css.positioning.challenge",
    title: "Закреплённая шапка без перекрытия якорей и контента",
    scenario: [
      p("На сайте документации шапка закреплена `position: fixed`. После перехода по ссылке-якорю заголовок раздела оказывается под шапкой, начало страницы скрыто, а на мобильных устройствах шапка занимает слишком много места. Нужно исправить закрепление, не ломая доступность."),
    ],
    requirements: [
      "Шапка закреплена, но не перекрывает контент",
      "Якоря прокручиваются так, чтобы заголовок был виден под шапкой",
      "Шапка не дублируется в печатной версии",
      "Работает клавиатурная навигация: фокус не прячется под шапкой",
    ],
    constraints: [
      "Нельзя использовать JavaScript для расчёта отступов",
      "Высота шапки может меняться (адаптивность)",
    ],
    acceptance: [
      "Заголовок раздела полностью виден после перехода по якорю",
      "Фокус на элементе под шапкой не прячется",
      "Отступы привязаны к высоте шапки через переменную",
      "В печати шапка не закреплена",
    ],
    hints: [
      "Какое свойство задаёт отступ прокрутки для якорей?",
      "Как избежать дублирования высоты шапки в нескольких местах?",
      "Какое решение сохраняет место шапки в потоке?",
    ],
    solution: [
      code(
        "css",
        `
        :root { --header-h: 3.5rem; }

        header {
          position: sticky;                 /* остаётся в потоке: не нужно компенсировать padding */
          top: 0;
          z-index: 10;
          min-height: var(--header-h);
          background: #fff;
          box-shadow: 0 1px 0 rgb(0 0 0 / 12%);
        }

        html { scroll-padding-top: calc(var(--header-h) + 1rem); }   /* якоря и фокус не прячутся под шапкой */
        :target { scroll-margin-top: calc(var(--header-h) + 1rem); }

        @media (max-width: 40rem) { :root { --header-h: 3rem; } }
        @media print { header { position: static; } }
        `,
        { filename: "sticky-header.css", lineNumbers: true },
      ),
      ul(
        "**`sticky` вместо `fixed`:** шапка остаётся в потоке и занимает своё место, поэтому отступ сверху не нужен; при прокрутке она прилипает.",
        "**`scroll-padding-top`:** учитывается при переходе по якорям и при программной фокусировке элементов, то есть фокус не прячется под шапкой.",
        "**Переменная `--header-h`:** высота шапки задана в одном месте и меняется в медиазапросе.",
        "**Печать:** в `@media print` закрепление отключено.",
        "**Проверка:** переход по `#section`, навигация клавишей Tab, масштаб 200 %, мобильный экран.",
      ),
    ],
  },

  interview: [
    iq("css.positioning.i1", "basic", "Чем `relative` отличается от `absolute`?", [
      ul(
        "`relative` остаётся в потоке и сохраняет своё место, смещается лишь визуально.",
        "`absolute` выходит из потока, не занимает места и привязывается к ближайшему позиционированному предку.",
      ),
    ]),
    iq("css.positioning.i2", "basic", "К чему привязан `position: absolute`?", [
      p("К ближайшему предку с `position` не `static` (его padding-box). Если такого предка нет — к начальному содержащему блоку (область окна). Поэтому родителю обычно задают `position: relative`."),
    ]),
    iq("css.positioning.i3", "intermediate", "Как работает `position: sticky`?", [
      ul(
        "Ведёт себя как `relative`, пока элемент не достигнет порога (`top`, `bottom`…) относительно ближайшего прокручиваемого предка.",
        "Затем «прилипает», как `fixed`, но не выходит за границы родителя.",
        "Остаётся в потоке и занимает исходное место.",
      ),
    ]),
    iq("css.positioning.i4", "intermediate", "Почему `sticky` может не работать?", [
      ul(
        "Нет порога (`top: 0`).",
        "У предка `overflow: hidden/auto`: прилипание идёт относительно него.",
        "Родитель по высоте равен элементу.",
        "Flex/Grid-родитель растягивает элемент (`align-items: stretch`): нужен `align-self: start`.",
      ),
    ]),
    iq("css.positioning.i5", "intermediate", "Как центрировать абсолютный блок?", [
      p("Задать `inset: 0`, размеры (`width`, `height` или `fit-content`) и `margin: auto`. Допустимо `top: 50%; left: 50%; transform: translate(-50%, -50%)`, но чаще проще Flexbox/Grid или `dialog`."),
    ]),
    iq("css.positioning.i6", "advanced", "Как `transform` у предка влияет на `fixed`-потомка?", [
      p("Если у предка есть `transform`, `filter`, `perspective`, `contain: layout/paint` или `will-change` этих свойств, он становится содержащим блоком для `fixed`: потомок прокручивается вместе с ним, а не привязан к окну."),
    ]),
    iq("css.positioning.i7", "engineering", "Как вы закрепите шапку и обеспечите корректную работу якорей и фокуса?", [
      ul(
        "`position: sticky; top: 0` — шапка остаётся в потоке, нет компенсирующего отступа.",
        "`scroll-padding-top` на `html` и/или `scroll-margin-top` у целей — якоря и фокус не прячутся.",
        "Высота шапки — переменная CSS; адаптация через медиазапросы.",
        "Печатные стили без закрепления; проверка клавиатурой.",
      ),
    ]),
    iq("css.positioning.i8", "debugging", "Абсолютный блок оказался в углу страницы, а не в контейнере. Что проверить?", [
      ul(
        "У контейнера нет `position`: добавить `position: relative`.",
        "Проверить `offsetParent` у блока — он показывает точку привязки.",
        "Не мешают ли `transform`/`filter` у промежуточного предка, которые меняют содержащий блок.",
      ),
    ]),
  ],

  exam: [
    mcq("css.positioning.e1", "foundation", "Какое значение `position` по умолчанию?", ["`relative`", "`static`", "`absolute`", "`fixed`"], 1, "У элементов по умолчанию `position: static`: они в нормальном потоке, смещения на них не действуют."),
    mcq("css.positioning.e2", "foundation", "Какое значение выводит элемент из потока и привязывает к окну?", ["`relative`", "`sticky`", "`fixed`", "`static`"], 2, "`fixed` не занимает места в потоке и позиционируется относительно окна просмотра."),
    mcq("css.positioning.e3", "intermediate", "У родителя `position: static`. К чему привяжется потомок с `position: absolute`?", ["К родителю", "К соседу", "Никуда", "К ближайшему позиционированному предку или к начальному содержащему блоку"], 3, "Абсолютный блок ищет ближайшего предка с `position` не `static`; если такого нет, использует начальный содержащий блок."),
    mcq("css.positioning.e4", "intermediate", "Какие утверждения верны? Выберите все.", ["`relative` оставляет место в потоке", "`absolute` увеличивает высоту родителя", "`sticky` требует порога `top`/`bottom`", "`fixed` привязан к окну (без `transform` у предков)"], [0, 2, 3], "Абсолютные элементы вне потока и высоту родителя не увеличивают; остальные утверждения верны."),
    mcq("css.positioning.e5", "intermediate", "Что делает `inset: 0` у `position: absolute`?", ["Задаёт нулевые внутренние отступы", "Сдвигает на 0 пикселей", "Растягивает блок на весь содержащий блок: top, right, bottom, left = 0", "Центрирует блок"], 2, "`inset` — сокращение для четырёх смещений; нулевые значения растягивают блок на размер содержащего блока."),
    mcq("css.positioning.e6", "advanced", "Почему `sticky` не прилипает к окну, если у предка `overflow: auto`?", ["Прилипание идёт относительно ближайшего прокручиваемого предка", "Баг", "Нужен `z-index`", "Нужен `display: block`"], 0, "Предок с `overflow` не `visible` становится контейнером прокрутки, и `sticky` считается относительно него."),
    open("css.positioning.e7", "intermediate", "Объясните, когда использовать позиционирование, а когда Flexbox и Grid.", [
      ul(
        "Позиционирование — для исключений: наложения (значки, подписи), оверлеи, закрепление при прокрутке.",
        "Flexbox и Grid — для раскладки: колонки, ряды, сетки, выравнивание.",
        "Абсолютные блоки не занимают места и не учитываются в размерах родителя; раскладка на них хрупка и неадаптивна.",
      ),
    ], ["Названы сценарии позиционирования", "Названа роль Flexbox/Grid", "Упомянуто, что абсолютные блоки не учитываются в размерах"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.positioning.m1", "intermediate", "Какой вариант не требует компенсирующего отступа под шапкой?", ["`position: fixed`", "`position: sticky`", "`position: absolute`", "Все требуют"], 1, "`sticky` остаётся в потоке и занимает своё место; `fixed` и `absolute` выходят из потока."),
    mcq("css.positioning.m2", "advanced", "Как избежать того, что якорь прячется под закреплённой шапкой?", ["`z-index` на цели", "`position: relative` на цели", "`scroll-margin-top`/`scroll-padding-top`", "`overflow: hidden`"], 2, "Свойства scroll-margin/scroll-padding задают отступ при прокрутке к цели, поэтому цель не оказывается под шапкой."),
    mcq("css.positioning.m3", "advanced", "Что вернёт `offsetParent` для абсолютного блока в `static`-родителе без позиционированных предков?", ["`body`", "Родитель", "`html`", "`null`"], 0, "Если позиционированного предка нет, `offsetParent` возвращает `body` (для видимых элементов)."),
    open("css.positioning.m4", "advanced", "Опишите набор правил для команды: как использовать позиционирование в компонентах.", [
      ul(
        "Позиционирование — только для исключений: наложения, оверлеи, закрепление; раскладка — Flexbox/Grid.",
        "Компонент с абсолютными потомками явно задаёт `position: relative`.",
        "Логические свойства `inset-*`; шкала `z-index` на токенах; `sticky` вместо `fixed`, где возможно.",
        "Интерактивные элементы — настоящие `button`/`a`; видимый фокус; тесты на масштаб и длинные тексты.",
        "Модальные окна и всплывающие панели — `dialog` и `popover` (верхний слой), а не ручное позиционирование.",
      ),
    ], ["Есть правила применения", "Упомянуты `dialog`/`popover` и доступность", "Есть проверки и токены"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.positioning.f1", front: "Пять значений position?", back: "static, relative, absolute, fixed, sticky." },
    { id: "css.positioning.f2", front: "К чему привязан absolute?", back: "К ближайшему позиционированному предку (position не static)." },
    { id: "css.positioning.f3", front: "`relative` и поток?", back: "Остаётся в потоке: место сохраняется, смещение только визуальное." },
    { id: "css.positioning.f4", front: "Почему sticky не прилипает?", back: "Нет порога, у предка overflow, родитель мал или align-items: stretch." },
    { id: "css.positioning.f5", front: "`inset: 0`?", back: "top, right, bottom, left = 0: растянуть на содержащий блок." },
    { id: "css.positioning.f6", front: "Якорь под шапкой?", back: "`scroll-margin-top` / `scroll-padding-top`." },
  ],

  sources: [
    { title: "CSS Positioned Layout Module Level 3", url: "https://www.w3.org/TR/css-position-3/", publisher: "W3C" },
    { title: "MDN: position", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/position", publisher: "MDN" },
    { title: "MDN: Introduction to positioning", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Positioning", publisher: "MDN" },
    { title: "MDN: inset", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/inset", publisher: "MDN" },
    { title: "MDN: scroll-padding", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding", publisher: "MDN" },
    { title: "MDN: HTMLElement.offsetParent", url: "https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent", publisher: "MDN" },
  ],
};
