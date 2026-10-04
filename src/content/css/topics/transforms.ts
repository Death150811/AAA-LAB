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
  open,
  p,
  section,
  steps,
  table,
  ul,
  wrongRight,
} from "../../dsl";

export const transforms: Topic = {
  id: "css.transforms",
  slug: "transforms",
  domain: "css",
  module: "animation",
  title: "Трансформации: translate, rotate, scale и 3D",
  titleEn: "CSS transforms: translate, rotate, scale, skew, transform-origin, order of operations, individual properties, perspective and 3D",
  summary:
    "Трансформации двигают, поворачивают и масштабируют элемент **после** раскладки, не меняя положение соседей. Тема разбирает функции `translate`, `rotate`, `scale`, `skew`, порядок применения (справа налево в системе координат), `transform-origin`, проценты в `translate`, отдельные свойства `translate`/`rotate`/`scale`, влияние на раскладку и прокрутку (положительное смещение растягивает прокрутку, отрицательное — нет), `perspective` и `transform-style`, обратную сторону (`backface-visibility`), чтение матрицы через `DOMMatrix` и тесты геометрии.",
  minutes: 50,
  prerequisites: ["css.box-model", "css.units-math"],
  tags: ["transform", "translate", "rotate", "scale", "skew", "matrix", "transform-origin", "perspective", "preserve-3d", "backface-visibility", "DOMMatrix", "individual transform properties", "hit testing", "stacking context"],
  keyConcepts: [
    { term: "После раскладки", text: "Трансформация не меняет место, которое элемент занимает в потоке: сосед остаётся там же (замер: `translateX(2000px)` не сдвинул соседа). Меняется лишь то, где элемент рисуется и куда попадают клики." },
    { term: "Порядок важен", text: "Функции применяются к системе координат **справа налево по записи**: `translateX(100px) rotate(90deg)` и `rotate(90deg) translateX(100px)` дают разные положения (центр (450, 225) против (350, 325))." },
    { term: "`transform-origin` — точка вращения", text: "Поворот и масштаб идут вокруг точки (по умолчанию центр). Один и тот же `rotate(90deg)` при `0 0` и `100% 100%` ставит элемент в разные места." },
    { term: "Отдельные свойства", text: "`translate`, `rotate`, `scale` можно задавать отдельно: они применяются в порядке translate → rotate → scale, а затем `transform`. Это упрощает анимацию одного параметра без пересборки всей строки." },
    { term: "Трансформация создаёт контекст", text: "Любая трансформация (кроме `none`) создаёт контекст наложения и содержащий блок для `position: fixed` и `absolute` потомков (замер: `fixed`-потомок позиционировался относительно трансформированного родителя)." },
  ],
  sections: [
    section("definition", [
      def("Трансформация", "Преобразование системы координат элемента (перенос, поворот, масштаб, наклон, матрица), применяемое после раскладки и влияющее на отрисовку и проверку попаданий.", "CSS transform"),
      def("`transform-origin`", "Точка, относительно которой выполняются поворот, масштаб и наклон. По умолчанию — центр блока (`50% 50%`).", "transform-origin"),
      def("Перспектива", "Параметр `perspective` (на родителе) или функция `perspective()` (в `transform`): расстояние до наблюдателя, создающее эффект глубины в 3D-трансформациях.", "perspective"),
      def("Матрица трансформации", "Числовое представление трансформации: `matrix(a, b, c, d, e, f)` для 2D и `matrix3d(...)` для 3D. Итоговая вычисленная `transform` всегда возвращается матрицей.", "transformation matrix"),
      def("Содержащий блок трансформации", "Элемент с трансформацией становится содержащим блоком для потомков с `position: fixed` и `position: absolute`, а также создаёт контекст наложения.", "containing block from transform"),
    ]),

    section("why", [
      h("Зачем нужны трансформации"),
      ul(
        "**Движение без перерасчёта раскладки:** `transform` и `opacity` — дешёвые свойства для анимации.",
        "**Центрирование без знания размеров:** `translate(-50%, -50%)`.",
        "**Визуальные эффекты:** наклон, масштаб при наведении, переворот карточки, 3D-панели.",
        "**Точное позиционирование поверх потока:** смещения без `margin` и `top/left`.",
        "**Единый механизм:** анимации и переходы используют те же трансформации.",
      ),
      h("Подводные камни"),
      p("Трансформация создаёт контекст наложения и содержащий блок, не меняет занимаемое место и может «ломать» `position: fixed`. Положительное смещение за пределы страницы увеличивает область прокрутки, а отрицательное — нет."),
      insight("Трансформация — это **«рисуй иначе»**, а не **«размещай иначе»**. Если нужно изменить место в потоке — меняйте раскладку, а не трансформацию."),
    ]),

    section("mental-model", [
      p("Представьте **лист стекла с рисунком**, лежащий на столе. Раскладка определяет, где лежит лист. Трансформация двигает, вращает и растягивает **рисунок вместе со стеклом**, но место на столе остаётся занятым: соседние листы не сдвигаются. Вращаете вы лист вокруг гвоздика — это `transform-origin`."),
      p("Порядок записи читается как **цепочка преобразований системы координат**: `translateX(100px) rotate(90deg)` — «сначала переместить систему координат на 100px вправо, затем повернуть её (вместе с элементом) на 90°». Поэтому `rotate(90deg) translateX(100px)` сдвигает элемент уже **вдоль повёрнутой оси** — вниз."),
      diagram(
        `
        элемент 100 × 50 в позиции (300, 200); центр (350, 225)

        translateX(100px) rotate(90deg)        rotate(90deg) translateX(100px)
        центр → (450, 225)                      центр → (350, 325)
        +----+                                        |
        |    |   →→→  [ ] ← повёрнут на месте          ▼  сдвиг идёт вдоль повёрнутой оси
        +----+                                        [ ]

        transform-origin: 0 0     → поворот вокруг левого верхнего угла
        transform-origin: 50% 50% → вокруг центра (по умолчанию)
        `,
        "Порядок функций и точка вращения",
      ),
    ]),

    section("technical", [
      h("Функции 2D"),
      code(
        "css",
        `
        .a {
          transform: translate(20px, 10px);       /* перенос: x, y */
          transform: translateX(50%);              /* проценты — от размеров самого элемента */
          transform: rotate(45deg);                /* поворот по часовой стрелке */
          transform: scale(1.1);                   /* масштаб по обеим осям */
          transform: scale(1.5, 0.5);              /* x и y отдельно */
          transform: skewX(-10deg);                /* наклон */
          transform: matrix(1, 0, 0, 1, 20, 10);   /* общая форма */
        }
        `,
        { filename: "transform-functions.css" },
      ),
      ul(
        "Проценты в `translate` считаются от **размеров самого элемента**, а не родителя: замер для блока 100×50 в позиции (300, 200) и `translate(-50%, -50%)` — сдвиг на (−50, −25), то есть центрирование относительно прежнего центра.",
        "Углы — в `deg`, `turn`, `rad`, `grad`; положительный угол — по часовой стрелке.",
        "Несколько функций записываются через пробел в одном свойстве `transform` (повторное объявление **заменяет** предыдущее).",
      ),
      h("Порядок функций"),
      table(
        ["Запись", "Положение элемента 100×50 (позиция 300, 200) — замер"],
        [
          ["`translateX(100px) rotate(90deg)`", "прямоугольник 50×100 с центром (450, 225): сдвиг по горизонтали, затем поворот на месте"],
          ["`rotate(90deg) translateX(100px)`", "прямоугольник 50×100 с центром (350, 325): сдвиг идёт вдоль повёрнутой оси"],
          ["`scale(2) rotate(90deg) translate(100px, 0)`", "100×200 с левым верхним углом (300, 325) — совсем другой результат, чем у `translate rotate scale`"],
        ],
        "Одни и те же функции, разный порядок",
      ),
      h("`transform-origin`"),
      code(
        "css",
        `
        .a { transform: rotate(90deg); transform-origin: 0 0; }      /* вокруг левого верхнего угла */
        .b { transform: scale(2); transform-origin: 100% 100%; }      /* растёт к левому верхнему */
        `,
        { filename: "transform-origin.css" },
      ),
      p("Замер для элемента 100×50 в позиции (300, 200) и `rotate(90deg)`:"),
      table(
        ["`transform-origin`", "Ограничивающий прямоугольник (left, top, width, height)"],
        [
          ["`50% 50%` (по умолчанию)", "325, 175, 50 × 100 — центр на месте"],
          ["`0 0` / `left top`", "250, 200, 50 × 100 — вращение вокруг левого верхнего угла"],
          ["`100% 100%`", "400, 150, 50 × 100 — вокруг правого нижнего угла"],
          ["`-100px 25px`", "175, 325, 50 × 100 — точка вне элемента"],
        ],
        "Точка вращения",
      ),
      h("Отдельные свойства `translate`, `rotate`, `scale`"),
      code(
        "css",
        `
        .card {
          translate: 0 -4px;
          rotate: 2deg;
          scale: 1.02;
          transition: translate 150ms, scale 150ms;          /* анимируем отдельно */
        }
        .card:hover { translate: 0 -8px; scale: 1.05; }
        `,
        { filename: "individual-properties.css" },
      ),
      p("Отдельные свойства применяются в порядке **translate → rotate → scale**, а затем `transform`. Замер: `translate: 100px 0; rotate: 90deg; scale: 2` дали тот же прямоугольник (400, 125, 100 × 200), что и `transform: translate(100px, 0) rotate(90deg) scale(2)`, а `scale(2) rotate(90deg) translate(100px, 0)` — другой (300, 325). Сочетание `translate: 100px 0; transform: rotate(90deg)` равно `transform: translate(100px) rotate(90deg)`: отдельное свойство «внешнее» по отношению к `transform`."),
      h("Влияние на раскладку и прокрутку"),
      ul(
        "**Место в потоке не меняется:** элемент 100×100 с `translateX(2000px)` оставил соседа на месте.",
        "**Геометрия:** `getBoundingClientRect()` учитывает трансформацию (замер `scale(2)`: ширина 200), а `offsetWidth` и вычисленная `width` — нет (100 и `100px`).",
        "**Прокрутка:** смещение вправо и вниз добавляет область прокрутки (замер: `scrollWidth` вырос до 2100 при окне 1000px), смещение влево и вверх — нет (`scrollWidth` остался 1000). Не прячьте элементы за левым краем через `translateX(-2000px)` в надежде на отсутствие прокрутки: они недоступны и для прокрутки.",
        "**Попадания:** клики и `:hover` следуют за видимым положением: `elementFromPoint` на старом месте вернул `HTML`, на новом — сам элемент.",
        "**Строчные элементы:** `transform` не действует на обычные строчные (`<span>`): замер — смещения нет; у `display: inline-block` смещение +100px сработало.",
      ),
      h("Контекст наложения и содержащий блок"),
      p("Любая трансформация, кроме `none`, создаёт контекст наложения и содержащий блок для `fixed` и `absolute` потомков. Замер: `position: fixed; top: 0; left: 0` внутри блока с `transform: translate(0, 0)` и отступом 100px оказался в (100, 100), а не в углу окна. Это частая причина «сломанных» фиксированных шапок и модальных окон внутри трансформированных контейнеров."),
      h("3D: перспектива и глубина"),
      code(
        "css",
        `
        .scene { perspective: 800px; }                              /* на родителе: для всех детей */
        .card  { transform-style: preserve-3d; transition: transform 600ms; }
        .card.is-flipped { transform: rotateY(180deg); }
        .face  { position: absolute; inset: 0; backface-visibility: hidden; }
        .face--back { transform: rotateY(180deg); }
        `,
        { filename: "3d-flip.css" },
      ),
      p("Замер для блока 200×100 и `rotateY(60deg)`: без перспективы проекция имеет ширину 100 (200 × cos 60°) и высоту 100; с `perspective: 400px` на родителе — 104.9 × 127.6 (ближний край «вырос»), с `perspective: 1000px` — 100.8 × 109.5 (эффект слабее); запись `perspective(400px) rotateY(60deg)` в самом `transform` дала такой же результат, как перспектива на родителе. Чем меньше значение перспективы, тем сильнее искажение."),
      ul(
        "`perspective` на родителе задаёт общую перспективу для детей; `perspective()` в `transform` — для самого элемента.",
        "`transform-style: preserve-3d` сохраняет 3D-сцену для потомков (иначе они «сплющиваются» в плоскость родителя).",
        "`backface-visibility: hidden` скрывает «обратную» сторону элемента, повёрнутого спиной к зрителю.",
        "`perspective-origin` задаёт точку, откуда смотрит наблюдатель (по умолчанию центр).",
      ),
      h("Чтение матрицы: `DOMMatrix`"),
      code(
        "js",
        `
        const m = new DOMMatrix(getComputedStyle(el).transform);

        console.log(m.a, m.d);          // масштаб по x и y (для scale(2): 2, 2)
        console.log(m.e, m.f);          // перенос (translate(10px, 20px): 10, 20)
        const angle = Math.atan2(m.b, m.a) * 180 / Math.PI;   // поворот в градусах (rotate(90deg): 90)
        `,
        { filename: "dommatrix.js" },
      ),
      p("Замер: для `translate(10px, 20px) scale(2)` получилось `a = 2`, `d = 2`, `e = 10`, `f = 20`; для `rotate(90deg)` — `a = 0`, `b = 1`, `c = −1`, угол 90°. Вычисленная `transform` всегда возвращается матрицей, поэтому для проверок удобнее разбирать `DOMMatrix`, чем строки."),
      h("Доступность и движение"),
      ul(
        "Трансформация не меняет порядок чтения и фокуса: визуально перевёрнутый или смещённый элемент остаётся на своём месте в дереве доступности.",
        "Крупное движение и вращение отключайте при `prefers-reduced-motion: reduce`.",
        "Переворот карточки скрывает одну из сторон: скрытую сторону помечайте `inert` или `aria-hidden`, чтобы скринридер и клавиатура не заходили в невидимое.",
        "Не масштабируйте текст `scale()` до нечитаемости и не используйте повороты для основного текста.",
      ),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        .modal {
          position: absolute;
          inset-block-start: 50%;
          inset-inline-start: 50%;
          translate: -50% -50%;
        }

        .card {
          transition: translate 150ms ease-out, scale 150ms ease-out;
        }
        .card:hover { translate: 0 -4px; scale: 1.03; }

        .scene { perspective: 800px; }
        .flip  { transform-style: preserve-3d; }
        `,
        [
          { line: [2, 5], text: "Центрирование: левый верхний угол в центре родителя, затем сдвиг на половину **собственных** размеров назад — размеры элемента знать не нужно." },
          { line: 8, text: "Переходы по отдельным свойствам: движение и масштаб анимируются независимо и не мешают друг другу." },
          { line: 10, text: "На наведении меняются отдельные свойства: нет необходимости переписывать всю строку `transform`." },
          { line: 12, text: "Перспектива на родителе: дети получают общий «взгляд из точки»; `preserve-3d` сохраняет глубину вложенных элементов." },
        ],
        "syntax.css",
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>transform</title>
        <style>
          body { margin: 0; padding: 1rem; font: 16px/1.5 system-ui, sans-serif; }
          .stage { position: relative; inline-size: 20rem; block-size: 8rem; margin-block: 1rem; background: #f4f5fb; border: 1px dashed #8a8fb8; }
          .box { position: absolute; inset-block-start: 3rem; inset-inline-start: 8rem; inline-size: 4rem; block-size: 2rem; background: #2f3d9a; opacity: 0.8; }
          .ghost { background: #b3261e; opacity: 0.35; }
          .a { transform: translateX(4rem) rotate(90deg); }
          .b { transform: rotate(90deg) translateX(4rem); }
          .c { transform: rotate(90deg); transform-origin: 0 0; }
          p { margin: 0; }
        </style>
        <p>Красный — исходное положение; синий — после трансформации.</p>
        <div class="stage"><div class="box ghost"></div><div class="box a"></div></div>
        <p>translateX(4rem) rotate(90deg)</p>
        <div class="stage"><div class="box ghost"></div><div class="box b"></div></div>
        <p>rotate(90deg) translateX(4rem): сдвиг идёт вдоль повёрнутой оси</p>
        <div class="stage"><div class="box ghost"></div><div class="box c"></div></div>
        <p>rotate(90deg) вокруг левого верхнего угла</p>
        </html>
        `,
        { filename: "transform-order.html", runnable: true },
      ),
      p("Три «сцены» показывают исходный прямоугольник (красный, полупрозрачный) и результат трансформации. Поменяйте порядок функций или `transform-origin` и сравните с замерами из раздела «Порядок функций» и «`transform-origin`»."),
    ]),

    section("detailed-example", [
      p("Карточка-«переворот» с 3D-эффектом: лицевая сторона и обратная, управление кнопкой с `aria-pressed`. Скрытая сторона помечается `inert`, чтобы клавиатура и скринридеры её не видели. Для `prefers-reduced-motion: reduce` переворот мгновенный. Рядом — маленький «наклон» при наведении на отдельных свойствах `rotate`/`scale`."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Трансформации: переворот карточки</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; padding: 1rem; font: 1rem/1.5 system-ui, sans-serif; color: #1b1b1f; background: #f4f5fb; }
          button { font: inherit; cursor: pointer; }

          .scene { perspective: 900px; inline-size: 16rem; block-size: 10rem; margin-block: 1rem; }
          .flip { position: relative; inline-size: 100%; block-size: 100%; transform-style: preserve-3d; transition: transform 600ms ease; }
          .flip.is-flipped { transform: rotateY(180deg); }
          .face { position: absolute; inset: 0; display: grid; place-content: center; gap: 0.5rem; padding: 1rem; text-align: center; border-radius: 0.75rem; backface-visibility: hidden; }
          .face--front { color: #fff; background: #2f3d9a; }
          .face--back { background: #fff; transform: rotateY(180deg); }

          .tilt { display: inline-block; padding: 0.75rem 1.25rem; background: #fff; border-radius: 0.5rem; transition: rotate 150ms ease-out, scale 150ms ease-out; }
          .tilt:hover { rotate: -2deg; scale: 1.05; }

          @media (prefers-reduced-motion: reduce) {
            .flip, .tilt { transition: none; }
          }
        </style>
        <div class="scene">
          <div class="flip" id="flip">
            <div class="face face--front" id="front"><strong>Лицевая сторона</strong><span>Нажмите кнопку ниже</span></div>
            <div class="face face--back" id="back" inert><strong>Обратная сторона</strong><button type="button" id="inner">Кнопка на обороте</button></div>
          </div>
        </div>
        <button id="toggle" type="button" aria-pressed="false">Перевернуть</button>
        <p><span class="tilt">Наведите курсор: отдельные свойства rotate и scale</span></p>
        <script>
          const flip = document.getElementById("flip");
          const front = document.getElementById("front");
          const back = document.getElementById("back");
          const toggle = document.getElementById("toggle");
          toggle.addEventListener("click", () => {
            const flipped = flip.classList.toggle("is-flipped");
            toggle.setAttribute("aria-pressed", String(flipped));
            front.inert = flipped;
            back.inert = !flipped;
          });
        </script>
        </html>
        `,
        { filename: "flip-card.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает"],
        [
          [".scene { perspective: 900px }", "Общая перспектива для детей сцены: переворот выглядит объёмным"],
          [".flip { transform-style: preserve-3d }", "Сохраняет 3D-структуру: две стороны остаются отдельными плоскостями в одной сцене"],
          [".flip.is-flipped { transform: rotateY(180deg) }", "Поворот вокруг вертикальной оси: передняя сторона уходит назад, обратная выходит вперёд"],
          [".face--back { transform: rotateY(180deg) }", "Обратная сторона заранее повёрнута, чтобы после поворота родителя оказаться лицом к зрителю"],
          ["`backface-visibility: hidden`", "Скрывает сторону, повёрнутую спиной: видна всегда только одна"],
          ["`inert` на скрытой стороне", "Исключает невидимую сторону из табуляции и дерева доступности"],
          [".tilt:hover { rotate; scale }", "Наклон и масштаб на отдельных свойствах: переходы независимы"],
        ],
        "Как устроена карточка",
      ),
      ul(
        "Состояние хранится в атрибутах: `aria-pressed` на кнопке и `inert` на скрытой стороне — вспомогательные технологии видят то же, что и пользователь.",
        "Трансформации создают контекст наложения, поэтому `backface-visibility` и порядок слоёв в сцене предсказуемы.",
        "Для пользователей с `reduce` переворот происходит мгновенно: смысл (смена стороны) сохраняется без движения.",
      ),
    ]),

    section("internals", [
      h("Как браузер применяет трансформацию"),
      steps(
        [
          ["Раскладка", "Сначала элемент размещается по обычным правилам (поток, Flex, Grid, позиционирование). Его размеры и место в потоке от трансформации не зависят."],
          ["Построение матрицы", "Значения `translate`, `rotate`, `scale` и `transform` вычисляются относительно рамки элемента (`transform-box`, по умолчанию `border-box`) и точки `transform-origin`, затем перемножаются в порядке: перенос, поворот, масштаб, `transform`."],
          ["Контекст", "Элемент с матрицей, отличной от единичной, создаёт контекст наложения и содержащий блок для `fixed`/`absolute` потомков."],
          ["Отрисовка", "При отрисовке слой элемента преобразуется матрицей: для `transform` и `opacity` часто на композиторе, без перерасчёта раскладки и перерисовки содержимого."],
          ["Попадания и геометрия", "Проверка попаданий и `getBoundingClientRect()` учитывают матрицу; `offsetWidth`, `clientWidth` и вычисленные `width`/`height` — нет."],
        ],
        "Путь трансформации",
      ),
      h("`transform-box`"),
      p("Для HTML-элементов по умолчанию используется `border-box`: проценты в `transform-origin` и `translate` считаются от рамки. Для SVG `transform-box` по умолчанию `view-box` (поэтому у SVG-элементов точка вращения по умолчанию «в начале координат»); `transform-box: fill-box` привязывает вращение к самому элементу."),
      h("Проверка геометрии в тестах"),
      code(
        "js",
        `
        const r = el.getBoundingClientRect();                         // после трансформации
        const center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        const hit = document.elementFromPoint(center.x, center.y);    // кликабельность на новом месте
        `,
        { filename: "geometry-check.js" },
      ),
      note("Для сравнения положений используйте центр (`left + width / 2`): он не меняется при повороте на месте. Для проверки порядка трансформаций сравнивайте центры, а не углы."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Ожидание, что трансформация сдвинет соседей"),
      p("Трансформированный элемент занимает прежнее место в потоке: сосед не сдвигается (замер: `translateX(2000px)`). Если нужно освободить место, меняйте раскладку (`margin`, Grid, Flex), а не `transform`."),
      h("Ошибка 2. Неверный порядок функций"),
      wrongRight(
        "css",
        {
          code: `
            .a { transform: rotate(90deg) translateX(100px); }   /* уехал вниз */
          `,
          note: "Сдвиг выполняется вдоль повёрнутой оси: центр (350, 325) вместо ожидаемого (450, 225).",
        },
        {
          code: `
            .a { transform: translateX(100px) rotate(90deg); }
          `,
          note: "Сначала перенос по горизонтали, затем поворот на месте; либо используйте отдельные свойства `translate` и `rotate`.",
        },
      ),
      h("Ошибка 3. `position: fixed` внутри трансформированного предка"),
      p("Трансформация делает предка содержащим блоком: фиксированный элемент позиционируется относительно него, а не окна (замер: (100, 100) вместо (0, 0)). Выносите шапки и модальные окна из трансформированных контейнеров."),
      h("Ошибка 4. Трансформация строчного элемента"),
      p("`transform` не действует на обычные `<span>` и `<a>` в строке (замер: смещения нет). Сделайте элемент `inline-block`, `block`, `flex`-элементом или обёрните его."),
      h("Ошибка 5. Прятать элементы за левым краем"),
      p("Отрицательное смещение не создаёт прокрутку (замер: `scrollWidth` остался 1000 при `translateX(-2000px)`), но положительное — создаёт (2100). Скрывайте элементы корректно: `display: none`, `visibility`, `inert`, `clip-path`."),
      h("Ошибка 6. Перезаписывание `transform` целиком"),
      p("`.a:hover { transform: scale(1.1) }` заменяет весь предыдущий `transform` (например, поворот). Используйте отдельные свойства `translate`, `rotate`, `scale` или повторяйте полный список."),
      h("Ошибка 7. Трансформации и доступность"),
      p("Визуально перевёрнутые или смещённые элементы остаются в прежнем порядке для клавиатуры и скринридера. Скрытую сторону карточки помечайте `inert`; не меняйте порядок чтения трансформациями."),
      h("Ошибка 8. Анимация layout-свойств вместо трансформаций"),
      p("Движение через `top`, `left`, `margin` вызывает перерасчёт раскладки; `transform` и `translate` — нет. Для перемещения используйте их."),
    ]),

    section("antipatterns", [
      ul(
        "**`transform: scale()` вместо изменения размера шрифта и блоков:** размытый текст, смещённые клики.",
        "**Позиционирование через `translate`** вместо раскладки (потеря места в потоке).",
        "**Центрирование модальных окон `position: fixed` внутри трансформированных контейнеров.**",
        "**3D без `prefers-reduced-motion`** и без `inert` на скрытых сторонах.",
        "**Повторное объявление `transform`** в состояниях вместо отдельных свойств.",
        "**`will-change: transform` везде** «для плавности» (память и композитинг).",
        "**Расчёты геометрии через `offsetWidth`** после трансформации.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Для движения — `transform`/`translate`,** для появления — `opacity`; раскладку не анимируйте.",
        "**Отдельные свойства** `translate`, `rotate`, `scale` для независимых анимаций.",
        "**Центрирование:** `inset` + `translate: -50% -50%` или Grid/Flex (проще).",
        "**`transform-origin` задавайте явно** там, где вращение или масштаб должны идти не вокруг центра.",
        "**3D:** `perspective` на сцене, `preserve-3d` на объекте, `backface-visibility` на гранях, `inert` на скрытых.",
        "**`prefers-reduced-motion`:** отключайте вращение и крупные смещения.",
        "**Тесты геометрии:** центры, `elementFromPoint`, `DOMMatrix` вместо строк.",
        "**Фиксированные элементы** держите вне трансформированных предков.",
      ),
    ]),

    section("edge-cases", [
      h("`will-change` и композитинг"),
      p("`will-change: transform` заранее выделяет слой и может создать контекст наложения. Используйте точечно и только на время анимации: постоянное включение расходует память."),
      h("Размытый текст"),
      p("Дробные смещения и масштабы могут приводить к размытию текста на некоторых экранах. Избегайте дробных значений `translate` для статичного текста и проверяйте на экранах с разной плотностью."),
      h("Трансформации и `overflow`"),
      p("Содержимое, выходящее за рамки родителя с `overflow: hidden`, обрезается и после трансформации: элемент может «исчезнуть» при смещении. Для эффектов, выходящих за рамки, не обрезайте родителя."),
      h("Вложенные трансформации"),
      p("Трансформации потомков **перемножаются** с трансформациями предков. Результат зависит от порядка вложенности: поворот родителя меняет направление `translate` потомка."),
      h("`transform` и SVG"),
      p("В SVG `transform-origin` по умолчанию относится к началу координат `viewBox`, а не к центру элемента. Для вращения элемента на месте используйте `transform-box: fill-box; transform-origin: center`."),
      h("Печать"),
      p("Трансформации в печатной версии могут обрезаться по границам страницы. Для печати отключайте декоративные смещения и повороты."),
    ]),

    section("related", [
      ul(
        "[Переходы](/learn/css/transitions) — плавное изменение `transform`.",
        "[Ключевые кадры](/learn/css/keyframes) — анимации с `transform`.",
        "[Производительность анимаций и движение](/learn/css/animation-performance-motion) — почему `transform` дёшев.",
        "[Содержащий блок](/learn/css/containing-block) — трансформация как содержащий блок.",
        "[Контексты наложения](/learn/css/stacking-contexts) — трансформация создаёт контекст.",
        "[Позиционирование](/learn/css/positioning) — центрирование через `inset` и `translate`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Позиционирование и анимация layout-свойств",
          code: `
            .modal { position: absolute; top: 50%; left: 50%; margin-left: -150px; margin-top: -100px; }   /* знание размеров */
            .card { transition: margin-top 200ms; }
            .card:hover { margin-top: -4px; }                                                         /* перерасчёт раскладки */
          `,
          note: "Центрирование требует знания размеров, а анимация `margin` перерасчитывает раскладку на каждом кадре.",
        },
        {
          title: "Трансформации",
          code: `
            .modal { position: absolute; inset-block-start: 50%; inset-inline-start: 50%; translate: -50% -50%; }
            .card { transition: translate 200ms; }
            .card:hover { translate: 0 -4px; }
          `,
          note: "Размеры не нужны; движение через `translate` не затрагивает раскладку соседей.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.transforms.ex1",
      title: "Порядок функций",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("Блок 100×50 стоит в позиции (300, 200), центр (350, 225). Куда сместится центр при `translateX(100px) rotate(90deg)` и при `rotate(90deg) translateX(100px)`? Каковы размеры ограничивающего прямоугольника?"),
      ],
      hints: ["В какой системе координат выполняется перенос после поворота?", "Как меняются ширина и высота при повороте на 90°?"],
      checks: ["Первый вариант: центр (450, 225)", "Второй вариант: центр (350, 325)", "Прямоугольник 50 × 100"],
      solution: [
        ul(
          "**`translateX(100px) rotate(90deg)`:** центр (450, 225) — прямоугольник [425, 175, 50 × 100]: сначала сдвиг вправо, затем поворот на месте.",
          "**`rotate(90deg) translateX(100px)`:** центр (350, 325) — прямоугольник [325, 275, 50 × 100]: после поворота ось X направлена вниз, и перенос идёт вдоль неё.",
        ),
        p("Оба результата получены замером в Chromium. Размеры 50 × 100 — результат поворота прямоугольника 100 × 50 на 90°."),
      ],
    }),
    exercise({
      id: "css.transforms.ex2",
      title: "Точка вращения",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Блок 100×50 в позиции (300, 200) повернули `rotate(90deg)`. Определите ограничивающий прямоугольник при `transform-origin`: `50% 50%`, `0 0`, `100% 100%`. Какой origin подойдёт, чтобы блок «упёрся» левым верхним углом в исходную позицию (300, 200) и ушёл влево?"),
      ],
      hints: ["Где находится точка вращения в координатах страницы?", "Как повернётся прямоугольник вокруг неё?"],
      checks: ["50% 50%: 325, 175, 50×100", "0 0: 250, 200, 50×100", "100% 100%: 400, 150, 50×100", "Подходит `0 0`"],
      solution: [
        table(
          ["origin", "Прямоугольник (left, top, width × height)"],
          [
            ["`50% 50%`", "325, 175, 50 × 100"],
            ["`0 0`", "250, 200, 50 × 100"],
            ["`100% 100%`", "400, 150, 50 × 100"],
          ],
        ),
        p("При `0 0` точка вращения — левый верхний угол (300, 200): повёрнутый по часовой стрелке блок уходит влево от неё (x от 250 до 300) и вниз (y от 200 до 300). Результаты подтверждены замером."),
      ],
    }),
    exercise({
      id: "css.transforms.ex3",
      title: "Шапка «уехала» вместе с контейнером",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Фиксированная шапка `position: fixed; top: 0; left: 0` лежит внутри контейнера с `transform: translate(0, 0)` (добавлен ради анимации появления). Шапка перестала прилипать к верху окна и прокручивается вместе с контейнером. Объясните причину и предложите два решения."),
      ],
      starter: {
        lang: "css",
        code: `
          .page { transform: translate(0, 0); }
          .page .header { position: fixed; top: 0; left: 0; }
        `,
      },
      hints: ["Что делает любая трансформация с содержащим блоком?", "Можно ли вынести шапку из контейнера?"],
      checks: ["Причина: трансформация — содержащий блок для `fixed`", "Решение 1: убрать лишнюю трансформацию", "Решение 2: вынести шапку из трансформированного предка"],
      solution: [
        p("**Причина.** Любая трансформация, кроме `none`, делает элемент содержащим блоком для `fixed` и `absolute` потомков. Шапка позиционируется относительно `.page`, а не окна: в замере она оказалась в (100, 100) при отступе контейнера 100px вместо (0, 0)."),
        code(
          "css",
          `
          /* 1. не оставлять пустую трансформацию */
          .page { transform: none; }                  /* анимацию делайте на потомках или через opacity */
          `,
        ),
        code(
          "html",
          `
          <!-- 2. вынести шапку из трансформированного контейнера -->
          <header class="header">…</header>
          <div class="page">…</div>
          `,
        ),
        p("Если нужна анимация появления, не оставляйте `transform` после её завершения (`animation-fill-mode` без `forwards` для `transform`) или применяйте анимацию к вложенному элементу."),
      ],
    }),
  ],

  challenge: {
    id: "css.transforms.challenge",
    title: "Тест геометрии: центрирование, порядок, попадания и матрица",
    scenario: [
      p("Команда делает компонент-«всплывашку» и карточку с наклоном. Разработчики путают порядок функций, забывают про содержащий блок и проверяют результат «на глаз». Нужен набор тестов, который проверяет **геометрию** трансформаций: центр, порядок, попадания и разбор матрицы."),
    ],
    requirements: [
      "Центрирование всплывашки в родителе через `inset` и `translate: -50% -50%`; центр совпадает с центром родителя (допуск 0.5px)",
      "Проверка порядка: центры для `translateX(100px) rotate(90deg)` и `rotate(90deg) translateX(100px)` различаются ожидаемым образом",
      "Проверка попаданий: `elementFromPoint` в центре сдвинутого элемента возвращает его, а на старом месте — нет",
      "Разбор `DOMMatrix`: масштаб, перенос и угол соответствуют CSS",
      "Тест: `position: fixed` внутри трансформированного предка позиционируется относительно предка (смещение от угла предка равно 0)",
    ],
    constraints: [
      "Нельзя использовать `margin` отрицательные значения для центрирования",
      "Нельзя сравнивать строки `transform` — только числа из геометрии и матрицы",
    ],
    acceptance: [
      "Центр всплывашки отличается от центра родителя не более чем на 0.5px",
      "Центры при двух порядках: (450, 225) и (350, 325) для блока 100×50 в (300, 200)",
      "Элемент найден по `elementFromPoint` на новом месте и не найден на старом",
      "Для `translate(10px, 20px) scale(2)`: a = 2, d = 2, e = 10, f = 20",
      "Фиксированный потомок совпадает с левым верхним углом трансформированного предка (смещение 0, 0), а не с углом окна",
    ],
    hints: [
      "Как вычислить центр прямоугольника из `getBoundingClientRect()`?",
      "Как получить матрицу из вычисленного `transform`?",
      "Как проверить содержащий блок для `fixed`?",
    ],
    solution: [
      code(
        "css",
        `
        .parent { position: relative; inline-size: 400px; block-size: 300px; }
        .popup  { position: absolute; inset-block-start: 50%; inset-inline-start: 50%; translate: -50% -50%; inline-size: 120px; block-size: 60px; }

        .a { position: absolute; left: 300px; top: 200px; width: 100px; height: 50px; }
        .a.order1 { transform: translateX(100px) rotate(90deg); }
        .a.order2 { transform: rotate(90deg) translateX(100px); }

        .box { inline-size: 100px; block-size: 100px; transform: translate(10px, 20px) scale(2); }
        .host { position: relative; margin: 100px; transform: translate(0, 0); }
        .host .fixed { position: fixed; top: 0; left: 0; inline-size: 10px; block-size: 10px; }
        `,
        { filename: "transforms.css", lineNumbers: true },
      ),
      code(
        "js",
        `
        const center = (sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);

        const [pc, qc] = [await center(".parent"), await center(".popup")];
        console.log("центр всплывашки:", qc, "родителя:", pc, Math.abs(pc[0] - qc[0]) < 0.5 && Math.abs(pc[1] - qc[1]) < 0.5 ? "ok" : "FAIL");

        console.log("порядок 1:", await center(".a.order1"), "порядок 2:", await center(".a.order2"));   // [450, 225], [350, 325]

        const hit = await page.evaluate(() => [document.elementFromPoint(350, 225)?.className, document.elementFromPoint(450, 225)?.className]);
        console.log("попадания (старый центр / новый центр):", hit);

        const m = await page.evaluate(() => { const t = new DOMMatrix(getComputedStyle(document.querySelector(".box")).transform); return { a: t.a, d: t.d, e: t.e, f: t.f }; });
        console.log("матрица:", m);                                  // { a: 2, d: 2, e: 10, f: 20 }

        const fixed = await page.evaluate(() => {
          const h = document.querySelector(".host").getBoundingClientRect();
          const f = document.querySelector(".host .fixed").getBoundingClientRect();
          return [f.left - h.left, f.top - h.top];
        });
        console.log("fixed относительно трансформированного предка:", fixed);   // [0, 0]
        `,
        { filename: "transforms.test.js" },
      ),
      ul(
        "**Центр, а не углы:** центр не меняется при вращении на месте; углы зависят от поворота.",
        "**Порядок:** разные центры подтверждают, что порядок функций имеет значение.",
        "**Попадания:** `elementFromPoint` проверяет, что клики идут на видимое место, а не на исходное.",
        "**Матрица:** числа `a`, `d`, `e`, `f` вместо сравнения строк `transform`.",
        "**Содержащий блок:** `fixed` внутри трансформированного предка позиционируется относительно него.",
      ),
    ],
  },

  interview: [
    iq("css.transforms.i1", "basic", "Влияет ли `transform` на раскладку соседних элементов?", [
      p("Нет. Трансформация применяется после раскладки: место элемента в потоке остаётся прежним (замер: `translateX(2000px)` оставил соседа на месте). Меняются только отрисовка, геометрия `getBoundingClientRect()` и область попаданий."),
    ]),
    iq("css.transforms.i2", "basic", "Как центрировать абсолютно позиционированный элемент без знания размеров?", [
      p("`inset-block-start: 50%; inset-inline-start: 50%; translate: -50% -50%` (или `transform: translate(-50%, -50%)`). Проценты в `translate` считаются от размеров самого элемента (замер: сдвиг (−50, −25) для блока 100×50)."),
    ]),
    iq("css.transforms.i3", "intermediate", "Почему порядок функций в `transform` важен?", [
      p("Функции применяются к системе координат по цепочке, поэтому перенос после поворота идёт вдоль повёрнутой оси. Для блока 100×50 в (300, 200): `translateX(100px) rotate(90deg)` → центр (450, 225), а `rotate(90deg) translateX(100px)` → центр (350, 325) (замеры)."),
    ]),
    iq("css.transforms.i4", "intermediate", "Что делает `transform-origin`?", [
      p("Задаёт точку, вокруг которой выполняются поворот, масштаб и наклон; по умолчанию центр. Для `rotate(90deg)` блока 100×50 в (300, 200): `0 0` → прямоугольник [250, 200, 50 × 100], `100% 100%` → [400, 150, 50 × 100] (замеры)."),
    ]),
    iq("css.transforms.i5", "intermediate", "Чем отдельные свойства `translate`, `rotate`, `scale` отличаются от `transform`?", [
      p("Они задаются независимо и применяются в порядке translate → rotate → scale, а затем `transform`; удобны для анимации одного параметра. Замер: `translate: 100px 0; rotate: 90deg; scale: 2` дали тот же прямоугольник, что и `transform: translate(100px, 0) rotate(90deg) scale(2)`."),
    ]),
    iq("css.transforms.i6", "advanced", "Какие побочные эффекты есть у `transform`?", [
      ul(
        "Создаётся контекст наложения и содержащий блок для `fixed`/`absolute` потомков (замер: `fixed` оказался в (100, 100) вместо (0, 0)).",
        "Положительное смещение растягивает прокрутку (`scrollWidth` 2100), отрицательное — нет.",
        "Не действует на обычные строчные элементы.",
        "Размывание текста при дробных значениях; обрезание `overflow: hidden` у предка.",
      ),
    ]),
    iq("css.transforms.i7", "engineering", "Как тестировать трансформации?", [
      ul(
        "Сравнивать центры из `getBoundingClientRect()`, а не строки `transform`.",
        "Разбирать вычисленную матрицу через `DOMMatrix` (`a`, `d`, `e`, `f`, угол по `atan2(b, a)`).",
        "Проверять попадания через `elementFromPoint` на старом и новом местах.",
        "Проверять содержащий блок для `fixed`-потомков и отсутствие неожиданных контекстов наложения.",
      ),
    ]),
    iq("css.transforms.i8", "debugging", "Элемент не трансформируется или ведёт себя неожиданно. Что проверите?", [
      ul(
        "Не обычный ли это строчный элемент (`span`, `a`): нужно `inline-block` или другое отображение.",
        "Нет ли переопределения `transform` в другом правиле (последнее объявление заменяет предыдущее) и конфликта с отдельными свойствами.",
        "Порядок функций и `transform-origin`.",
        "Нет ли `fixed`-потомков внутри трансформированного предка или обрезки `overflow: hidden`.",
        "Вычисленная `transform` в DevTools и значение матрицы.",
      ),
    ]),
  ],

  exam: [
    mcq("css.transforms.e1", "foundation", "Сдвинет ли `transform: translateX(500px)` соседние элементы?", ["Да, на 500px", "Только вниз", "Нет, место в потоке сохраняется", "Только если сосед `inline`"], 2, "Трансформация применяется после раскладки и место элемента в потоке не меняет."),
    mcq("css.transforms.e2", "foundation", "Чему равны проценты в `translate(-50%, -50%)`?", ["50% размеров самого элемента", "50% родителя", "50% окна", "50% документа"], 0, "Проценты в `translate` считаются от размеров самого элемента: типичный приём центрирования."),
    mcq("css.transforms.e3", "intermediate", "Блок 100×50 в (300, 200). Где окажется центр при `rotate(90deg) translateX(100px)`?", ["(450, 225)", "(350, 125)", "(250, 225)", "(350, 325)"], 3, "После поворота ось X смотрит вниз, поэтому перенос идёт вниз: центр (350, 325)."),
    mcq("css.transforms.e4", "intermediate", "Что вернёт `offsetWidth` элемента 100px шириной с `transform: scale(2)`?", ["200", "100", "50", "0"], 1, "`offsetWidth` не учитывает трансформацию; `getBoundingClientRect().width` вернёт 200."),
    mcq("css.transforms.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`transform` создаёт содержащий блок для `fixed` потомков", "`transform` действует на обычные строчные `span`", "Отрицательное смещение влево создаёт прокрутку", "`translate`, `rotate`, `scale` применяются до `transform`"], [0, 3], "К обычным строчным элементам `transform` не применяется, а влево прокрутка не создаётся."),
    mcq("css.transforms.e6", "advanced", "Зачем `backface-visibility: hidden` в карточке-перевороте?", ["Чтобы создать контекст наложения", "Чтобы отключить анимацию", "Чтобы включить перспективу", "Чтобы скрыть сторону, повёрнутую спиной к зрителю"], 3, "Без него обратная сторона просвечивала бы «зеркально» сквозь переднюю."),
    open("css.transforms.e7", "intermediate", "Объясните, как корректно сделать переворот карточки: CSS, доступность и reduced motion.", [
      ul(
        "`perspective` на сцене, `transform-style: preserve-3d` на карточке, две грани с `backface-visibility: hidden`, вторая заранее повёрнута на 180°.",
        "Состояние в атрибутах: `aria-pressed` на кнопке; скрытая сторона — `inert`.",
        "`prefers-reduced-motion: reduce`: переворот без анимации.",
      ),
    ], ["Описана 3D-конструкция", "Учтены `inert` и ARIA", "Учтён reduced motion"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.transforms.m1", "intermediate", "`translate: 100px 0; transform: rotate(90deg)` для блока 100×50 в (300, 200). С чем это равно?", ["`transform: rotate(90deg) translate(100px)`", "`transform: translate(100px)`", "`transform: translate(100px) rotate(90deg)`", "`transform: rotate(90deg)`"], 2, "Отдельное свойство `translate` применяется раньше `transform`: итог — перенос, затем поворот (центр (450, 225))."),
    mcq("css.transforms.m2", "advanced", "Фиксированная шапка лежит в блоке с `transform: translate(0, 0)` и отступом 100px. Где она окажется при `top: 0; left: 0`?", ["(0, 0)", "(100, 100)", "(100, 0)", "Вне окна"], 1, "Трансформация делает предка содержащим блоком для `fixed`: шапка позиционируется относительно него."),
    mcq("css.transforms.m3", "advanced", "Что вернёт `DOMMatrix` для `translate(10px, 20px) scale(2)`?", ["a=2, d=2, e=10, f=20", "a=1, d=1, e=10, f=20", "a=2, d=2, e=20, f=40", "a=0, d=0"], 0, "Масштаб 2 по обеим осям и перенос (10, 20): `a = 2`, `d = 2`, `e = 10`, `f = 20`."),
    open("css.transforms.m4", "advanced", "Спроектируйте правила использования трансформаций в проекте: когда использовать, какие риски, как тестировать.", [
      ul(
        "Использовать для движения и визуальных эффектов (дешёвые `transform`/`opacity`), не для раскладки.",
        "Риски: содержащий блок для `fixed`, контекст наложения, прокрутка от положительных смещений, обрезка `overflow: hidden`, доступность скрытых сторон.",
        "Отдельные свойства `translate`/`rotate`/`scale`, явный `transform-origin`, `prefers-reduced-motion`.",
        "Тесты: центры, `elementFromPoint`, `DOMMatrix`, отсутствие неожиданных контекстов; проверки на разных экранах.",
      ),
    ], ["Когда использовать", "Риски", "Тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.transforms.f1", front: "Влияет ли `transform` на раскладку?", back: "Нет: место в потоке сохраняется; меняются отрисовка, геометрия и попадания." },
    { id: "css.transforms.f2", front: "Порядок функций?", back: "Применяются к системе координат: `translate rotate` ≠ `rotate translate`." },
    { id: "css.transforms.f3", front: "Центрирование через `translate`?", back: "`inset: 50%` по осям + `translate: -50% -50%` (проценты — от самого элемента)." },
    { id: "css.transforms.f4", front: "Побочные эффекты `transform`?", back: "Контекст наложения и содержащий блок для `fixed`/`absolute` потомков." },
    { id: "css.transforms.f5", front: "Отдельные свойства?", back: "`translate` → `rotate` → `scale`, затем `transform`; анимируются независимо." },
    { id: "css.transforms.f6", front: "3D-переворот?", back: "`perspective` на сцене, `preserve-3d`, `backface-visibility: hidden`, `inert` на скрытой грани." },
  ],

  sources: [
    { title: "CSS Transforms Module Level 1", url: "https://www.w3.org/TR/css-transforms-1/", publisher: "W3C" },
    { title: "CSS Transforms Module Level 2", url: "https://www.w3.org/TR/css-transforms-2/", publisher: "W3C" },
    { title: "MDN: CSS transforms", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transforms", publisher: "MDN" },
    { title: "MDN: transform", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/transform", publisher: "MDN" },
    { title: "MDN: transform-origin", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin", publisher: "MDN" },
    { title: "MDN: Using CSS transforms", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transforms/Using_CSS_transforms", publisher: "MDN" },
    { title: "MDN: DOMMatrix", url: "https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix", publisher: "MDN" },
    { title: "MDN: inert", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert", publisher: "MDN" },
  ],
};
