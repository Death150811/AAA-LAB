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

export const animationPerformanceMotion: Topic = {
  id: "css.animation-performance-motion",
  slug: "animation-performance-motion",
  domain: "css",
  module: "animation",
  title: "Производительность анимаций и доступное движение",
  titleEn: "Animation performance: layout, paint, composite, will-change, FLIP, Web Animations API, prefers-reduced-motion",
  summary:
    "Анимация плавна, если каждый кадр укладывается в бюджет (около 16.7 мс при 60 Гц). Тема показывает, что происходит с кадром при анимации разных свойств (замеры числа раскладок и пересчётов стилей: `transform` и `opacity` — единицы, `left`/`width` — около 50 за 800 мс), как анимации раскладки порождают сдвиги макета, как работает приём FLIP для плавной перестановки элементов, как управлять анимациями через Web Animations API, когда нужен `will-change` и чем он опасен, как измерять производительность и как проектировать доступное движение (`prefers-reduced-motion`, WCAG 2.2.2, 2.3.1, 2.3.3).",
  minutes: 55,
  prerequisites: ["css.transitions", "css.keyframes", "css.transforms"],
  tags: ["performance", "compositor", "layout", "paint", "composite", "will-change", "FLIP", "Web Animations API", "prefers-reduced-motion", "CLS", "jank", "frame budget", "DevTools", "accessibility", "vestibular"],
  keyConcepts: [
    { term: "Кадр — это конвейер", text: "Стили → раскладка → отрисовка → композитинг. Чем раньше этап, тем дороже изменение: анимация `width` проходит все этапы каждый кадр, `transform` и `opacity` — только композитинг." },
    { term: "Замер важнее догадок", text: "За 800 мс анимации `left`, `margin-top` и `width` дали ≈ 50 раскладок и ≈ 50 пересчётов стилей, `background-color` — 0 раскладок и ≈ 50 пересчётов, а `transform` и `opacity` — по 1 раскладке и 5–6 пересчётов в начале и конце." },
    { term: "Анимация раскладки — это и сдвиг макета", text: "Если анимируемый блок двигает соседей, браузер фиксирует `layout-shift`: в замере анимация `height` дала сумму 0.204, а `transform` — ноль." },
    { term: "FLIP и WAAPI", text: "FLIP (First–Last–Invert–Play) превращает перестановку элементов в анимацию `transform`: измерили до, изменили DOM, измерили после, «отыграли» разницу. Выполняется через `element.animate()`." },
    { term: "Движение — вопрос доступности", text: "Для части пользователей движение вызывает тошноту и головокружение. `prefers-reduced-motion: reduce` — сигнал убрать лишнее, а не удалить смысл. Критичная информация не должна жить только в анимации." },
  ],
  sections: [
    section("definition", [
      def("Бюджет кадра", "Время, отведённое на подготовку одного кадра: при 60 Гц — около 16.7 мс, при 120 Гц — около 8.3 мс. Если работа не укладывается, кадр пропускается, и анимация «дёргается» (jank).", "frame budget"),
      def("Поток композитора", "Отдельный поток браузера, который собирает кадр из готовых слоёв и умеет двигать, поворачивать, масштабировать слои и менять их прозрачность без участия основного потока.", "compositor thread"),
      def("Основной поток", "Поток, в котором выполняются JavaScript, расчёт стилей, раскладка и отрисовка. Если он занят, анимации, зависящие от него, задерживаются.", "main thread"),
      def("FLIP", "Приём: First (запомнить положение) → Last (изменить DOM и измерить новое положение) → Invert (смещением вернуть элемент на старое место) → Play (анимировать смещение к нулю).", "FLIP technique"),
      def("Web Animations API", "JavaScript-интерфейс к тому же механизму, что и CSS-анимации: `element.animate()`, `getAnimations()`, `Animation.finished`, `commitStyles()`.", "WAAPI"),
    ]),

    section("why", [
      h("Почему анимации тормозят"),
      p("Пользователь замечает потерю кадров, когда основной поток занят и кадр не успевает за ~16.7 мс. Раскладка и отрисовка стоят дорого: анимация `width` заставляет браузер заново считать положение всех затронутых элементов каждый кадр. На слабом устройстве или в тяжёлой странице этого достаточно для рывков."),
      h("Что даёт правильный выбор свойств и приёмов"),
      ul(
        "**Плавность на слабых устройствах:** композиторные анимации не зависят от занятости основного потока.",
        "**Нет сдвигов макета:** страница не «прыгает», метрика CLS остаётся низкой.",
        "**Энергосбережение:** меньше вычислений — дольше работает батарея.",
        "**Доступность:** движение под контролем пользователя.",
        "**Предсказуемые тесты:** WAAPI даёт детерминированный способ проверки.",
      ),
      insight("Вопрос к любой анимации: **какие этапы конвейера она запускает на каждом кадре?** Если раскладку — ищите замену на `transform` или `opacity`."),
    ]),

    section("mental-model", [
      p("Представьте **типографию**. Чтобы напечатать страницу, нужно: (1) решить, какие стили применить, (2) расставить блоки, (3) нарисовать каждый слой, (4) собрать слои вместе. Если вы просто сдвигаете **готовый слой на столе** (композитинг), всё быстро. Если меняется размер блока — приходится заново расставлять всё остальное (раскладка) и перерисовывать (отрисовка)."),
      diagram(
        `
        Стили  →  Раскладка  →  Отрисовка  →  Композитинг
          |           |             |              |
          |     width, height,   color, box-      transform,
          |     margin, top,     shadow, bg,      opacity
          |     left, font-size  border-radius    (слои уже нарисованы)
          |
        каждое изменение «слева» запускает все этапы «справа»

        транзит-анимация transform / opacity:   только Композитинг   (дёшево)
        анимация background-color / box-shadow: Отрисовка + Композитинг
        анимация left / width / margin:         Раскладка + Отрисовка + Композитинг  (дорого)
        `,
        "Что запускает изменение свойства",
      ),
      table(
        ["Анимируемое свойство (800 мс, Chromium)", "Раскладок", "Пересчётов стилей", "Этапы на кадр"],
        [
          ["покой", "0", "0", "—"],
          ["`transform: translateX`", "1", "5", "композитинг"],
          ["`opacity`", "1", "6", "композитинг"],
          ["`left`", "50", "50", "раскладка → отрисовка → композитинг"],
          ["`margin-top`", "49", "50", "раскладка → отрисовка → композитинг"],
          ["`width`", "49", "50", "раскладка → отрисовка → композитинг"],
          ["`background-color`", "0", "50", "отрисовка → композитинг"],
          ["`box-shadow`", "0", "50", "отрисовка → композитинг"],
        ],
        "Замер через `Performance.getMetrics` (CDP): прирост счётчиков за время анимации",
      ),
    ]),

    section("technical", [
      h("Что дорого, а что дёшево"),
      table(
        ["Группа", "Свойства", "Цена"],
        [
          ["Раскладка", "`width`, `height`, `margin`, `padding`, `top`, `left`, `font-size`, `display`", "высокая: перерасчёт положения и размеров, затем отрисовка"],
          ["Отрисовка", "`color`, `background`, `box-shadow`, `border-radius`, `outline`, `filter` (во многих случаях)", "средняя: перерисовка слоя без раскладки"],
          ["Композитинг", "`transform`, `opacity`", "низкая: слой двигается и смешивается без раскладки и отрисовки"],
        ],
        "Классификация",
      ),
      p("Из замера: за 800 мс анимации `left` потребовалось около 50 раскладок (по одной на кадр) и 50 пересчётов стилей; суммарная длительность раскладок в этом простом примере — единицы миллисекунд, но на реальной странице с тысячами элементов она растёт многократно. Анимации `transform` и `opacity` вызвали 1 раскладку (создание слоя) и 5–6 пересчётов в начале и конце: между ними основной поток почти не участвовал."),
      note("Цифры зависят от версии браузера и устройства. Правило сохраняется: ищите анимации, которые запускают раскладку на каждом кадре, и заменяйте их на `transform`/`opacity`."),
      h("Анимация раскладки и сдвиги макета"),
      p("Если анимируемый блок меняет положение соседей, браузер записывает смещения как `layout-shift` (метрика CLS). Замер в Chromium: анимация `height` блока 100 → 300px сдвигала соседа (`100 → 104` и далее) и дала 192 записи `layout-shift` на сумму 0.204; анимация `transform: translateY` — ни одной. Сдвиги не засчитываются, если произошли в пределах 500 мс после действия пользователя, но случайные анимации раскладки на загрузке портят метрику."),
      h("Замена анимации раскладки на `transform`"),
      wrongRight(
        "css",
        {
          code: `
            .panel { position: relative; left: -300px; transition: left 300ms; }
            .panel.is-open { left: 0; }
          `,
          note: "На каждом кадре — раскладка. В замере анимация `left` дала ≈ 50 раскладок и ≈ 50 пересчётов стилей за 800 мс.",
        },
        {
          code: `
            .panel { translate: -300px 0; transition: translate 300ms; }
            .panel.is-open { translate: 0 0; }
          `,
          note: "Только композитинг: слой смещается без раскладки соседей. Раскладка остаётся прежней.",
        },
      ),
      h("`will-change`: когда помогает и чем опасен"),
      code(
        "css",
        `
        .drawer { transition: translate 300ms; }
        .drawer.is-animating { will-change: translate; }     /* только на время анимации */
        `,
        { filename: "will-change.css" },
      ),
      ul(
        "`will-change` подсказывает браузеру заранее выделить слой для свойства. Это ускоряет **начало** анимации, но требует видеопамяти и может создать контекст наложения и содержащий блок (как `transform`).",
        "Не ставьте `will-change` на десятки элементов и не оставляйте его постоянным: слоёв становится слишком много, расход памяти растёт, а выигрыша нет.",
        "Включайте перед анимацией (например, по `pointerenter` или за кадр до запуска) и снимайте после `animationend`/`transitionend`.",
        "Для `transform` и `opacity` браузер обычно сам создаёт слой на время анимации: `will-change` нужен редко.",
      ),
      h("Приём FLIP: плавная перестановка"),
      p("Когда нужно анимировать перестановку элементов (сортировка, фильтрация), сама раскладка не анимируется: элементы «прыгают» на новые места. FLIP делает перестановку плавной через `transform`:"),
      code(
        "js",
        `
        function flip(list, mutate) {
          const items = [...list.children];
          const first = new Map(items.map((el) => [el, el.getBoundingClientRect()]));     // F: запомнить положения

          mutate();                                                                       // изменить DOM (сортировка, добавление…)

          for (const el of items) {
            const last = el.getBoundingClientRect();                                      // L: измерить новые положения
            const dx = first.get(el).left - last.left;
            const dy = first.get(el).top - last.top;
            if (!dx && !dy) continue;
            el.animate(                                                                   // I+P: вернуть на старое место и отыграть
              [{ transform: "translate(" + dx + "px, " + dy + "px)" }, { transform: "none" }],
              { duration: 300, easing: "ease-out" },
            );
          }
        }
        `,
        { filename: "flip.js" },
      ),
      p("Замер для списка из четырёх элементов высотой 30px с интервалом 10px, где первый переносится в конец: смещения `dy` равны −120 для перенесённого и 40 для остальных; сразу после запуска вертикальные положения совпали со старыми (0, 40, 80, 120), а в конце — с новыми (120, 0, 40, 80). Перестановка анимируется через `transform`, раскладка выполняется один раз."),
      h("Web Animations API"),
      code(
        "js",
        `
        const a = el.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: 200, easing: "ease-out", fill: "forwards" },
        );

        await a.finished;          // промис завершения
        a.commitStyles();          // зафиксировать итоговые значения в style
        a.cancel();                // снять анимацию (значения остались благодаря commitStyles)

        console.log(el.getAnimations().length);     // все активные анимации элемента (включая CSS)
        `,
        { filename: "waapi.js" },
      ),
      ul(
        "`element.animate()` использует тот же механизм, что и CSS: `transform` и `opacity` могут идти на композиторе.",
        "`a.finished` — промис: удобно ждать завершения вместо `setTimeout`.",
        "`commitStyles()` записывает итоговые значения в `style`, после чего анимацию можно отменить без «отката» (замер: после `commitStyles()` и `cancel()` `opacity` осталась 1).",
        "`getAnimations()` возвращает и CSS-анимации, и переходы — полезно для тестов и отладки.",
      ),
      h("Измерения"),
      table(
        ["Инструмент", "Что показывает"],
        [
          ["DevTools → Performance", "Кадры, длительность раскладки и отрисовки, длинные задачи; потерянные кадры"],
          ["DevTools → Rendering", "Paint flashing (перерисованные области), Layout Shift Regions, FPS meter, Layer borders"],
          ["`PerformanceObserver` (`layout-shift`)", "Сдвиги макета и их источники (элементы и прямоугольники)"],
          ["`PerformanceObserver` (`long-animation-frame`, `longtask`)", "Долгие кадры и задачи основного потока (поддержка зависит от браузера)"],
          ["CDP `Performance.getMetrics`", "Счётчики `LayoutCount`, `RecalcStyleCount`, длительности — использовались для замеров этой темы"],
        ],
        "Как измерять",
      ),
      h("Доступное движение"),
      code(
        "css",
        `
        .card { animation: enter 400ms ease-out both; transition: translate 150ms; }

        @media (prefers-reduced-motion: reduce) {
          .card { animation: none; transition: none; }          /* убираем движение, оставляем состояние */
        }
        `,
        { filename: "reduced-motion-component.css" },
      ),
      code(
        "js",
        `
        const reduce = matchMedia("(prefers-reduced-motion: reduce)");
        function duration(ms) { return reduce.matches ? 0 : ms; }

        el.animate(frames, { duration: duration(300) });
        reduce.addEventListener("change", () => { /* пользователь поменял настройку на лету */ });
        `,
        { filename: "reduced-motion.js" },
      ),
      ul(
        "**Не удаляйте смысл:** при `reduce` оставляйте смену состояния (цвет, видимость, текст), убирайте перемещения, масштабирование, вращение, параллакс и бесконечные циклы.",
        "**Подстраховка:** общий сброс (`animation-duration: 0.01ms`) защищает от забытых анимаций, но не заменяет продуманную обработку компонентов.",
        "**JavaScript-анимации** тоже должны уважать настройку (`matchMedia`).",
        "**WCAG 2.2.2 (Pause, Stop, Hide):** автоматически запускающееся движение дольше 5 секунд должно останавливаться пользователем.",
        "**WCAG 2.3.1 (Three Flashes):** не более трёх вспышек в секунду.",
        "**WCAG 2.3.3 (Animation from Interactions, AAA):** движение, вызванное действием, можно отключить, если оно не необходимо для функциональности.",
      ),
      h("Проектирование движения"),
      ul(
        "**Длительность:** 100–300 мс для откликов интерфейса; крупные перемещения — до 400–500 мс; дольше — только по причине.",
        "**Кривые по смыслу:** появление — `ease-out`, исчезновение — `ease-in`, перемещение — `ease-in-out`; линейное — для непрерывных процессов.",
        "**Иерархия:** анимируйте то, что помогает понять изменение (появление, перестановка), а не всё подряд.",
        "**Согласованность:** одни и те же токены длительностей и кривых во всём продукте.",
      ),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        .drawer {
          translate: -100% 0;
          transition: translate 250ms ease-out;
        }
        .drawer.is-open { translate: 0 0; }

        .drawer.is-animating { will-change: translate; }

        @media (prefers-reduced-motion: reduce) {
          .drawer { transition: none; }
        }
        `,
        [
          { line: [1, 4], text: "Выдвижная панель двигается отдельным свойством `translate`: композиторная анимация без раскладки." },
          { line: 6, text: "`will-change` включается только на время анимации скриптом (класс `is-animating`) и снимается после `transitionend`." },
          { line: [8, 10], text: "Для `reduce` движение отключается: панель появляется сразу, состояние (открыта/закрыта) сохраняется." },
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
        <title>left против transform</title>
        <style>
          body { margin: 0; padding: 1rem; font: 16px/1.5 system-ui, sans-serif; }
          .track { position: relative; block-size: 3rem; margin-block: 0.5rem; background: #eef0fb; border-radius: 0.5rem; }
          .dot { position: absolute; inset-block-start: 0.5rem; inset-inline-start: 0; inline-size: 2rem; block-size: 2rem; background: #2f3d9a; border-radius: 50%; }
          @keyframes by-left { to { inset-inline-start: calc(100% - 2rem); } }
          @keyframes by-transform { to { transform: translateX(calc(20rem - 2rem)); } }
          .track { max-inline-size: 20rem; }
          .left .dot { animation: by-left 2s ease-in-out infinite alternate; }
          .transform .dot { animation: by-transform 2s ease-in-out infinite alternate; }
          @media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
        </style>
        <p>Верхняя точка движется через <code>left</code> (раскладка на каждом кадре), нижняя — через <code>transform</code> (композитинг).</p>
        <div class="track left"><div class="dot"></div></div>
        <div class="track transform"><div class="dot"></div></div>
        </html>
        `,
        { filename: "left-vs-transform.html", runnable: true },
      ),
      p("Визуально обе точки движутся одинаково, но стоимость кадра разная. Откройте DevTools → Performance, запишите анимацию и сравните расход времени на раскладку у верхней и нижней точек."),
    ]),

    section("detailed-example", [
      p("Список задач с плавной перестановкой по FLIP: сортировка и добавление элементов анимируются через `element.animate()`, а при `prefers-reduced-motion: reduce` перестановка происходит мгновенно. Кнопки имеют текстовые названия и живое сообщение о результате для скринридеров."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>FLIP: плавная перестановка списка</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; padding: 1rem; font: 1rem/1.5 system-ui, sans-serif; color: #1b1b1f; background: #f4f5fb; }
          button { font: inherit; padding: 0.375rem 0.75rem; cursor: pointer; }
          .tools { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-block: 1rem; }
          ul { max-inline-size: 24rem; margin: 0; padding: 0; list-style: none; }
          li { display: flex; justify-content: space-between; margin-block-end: 0.5rem; padding: 0.75rem 1rem; background: #fff; border-radius: 0.5rem; }
          .status { min-block-size: 1.5rem; color: #444; }
        </style>
        <h1>Список с плавной перестановкой</h1>
        <div class="tools">
          <button id="sort" type="button">По алфавиту</button>
          <button id="shuffle" type="button">Перемешать</button>
          <button id="add" type="button">Добавить</button>
        </div>
        <ul id="list">
          <li data-id="3"><span>Тесты</span><span>3</span></li>
          <li data-id="1"><span>Вёрстка</span><span>1</span></li>
          <li data-id="4"><span>Релиз</span><span>4</span></li>
          <li data-id="2"><span>Анимации</span><span>2</span></li>
        </ul>
        <p class="status" id="status" role="status"></p>
        <script>
          const list = document.getElementById("list");
          const status = document.getElementById("status");
          const reduce = matchMedia("(prefers-reduced-motion: reduce)");

          function flip(mutate) {
            const items = [...list.children];
            const first = new Map(items.map((el) => [el, el.getBoundingClientRect()]));
            mutate();
            if (reduce.matches) return;
            for (const el of list.children) {
              const f = first.get(el);
              const l = el.getBoundingClientRect();
              if (!f) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }); continue; }
              const dx = f.left - l.left, dy = f.top - l.top;
              if (dx || dy) el.animate([{ transform: "translate(" + dx + "px, " + dy + "px)" }, { transform: "none" }], { duration: 300, easing: "ease-out" });
            }
          }

          document.getElementById("sort").addEventListener("click", () => {
            flip(() => [...list.children].sort((a, b) => a.dataset.id - b.dataset.id).forEach((el) => list.append(el)));
            status.textContent = "Список отсортирован по номеру";
          });
          document.getElementById("shuffle").addEventListener("click", () => {
            flip(() => [...list.children].sort(() => Math.random() - 0.5).forEach((el) => list.append(el)));
            status.textContent = "Список перемешан";
          });
          let n = 5;
          document.getElementById("add").addEventListener("click", () => {
            flip(() => { const li = document.createElement("li"); li.dataset.id = n; li.innerHTML = "<span>Задача " + n + "</span><span>" + n + "</span>"; list.prepend(li); n++; });
            status.textContent = "Добавлена задача " + (n - 1);
          });
        </script>
        </html>
        `,
        { filename: "flip-list.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает"],
        [
          ["`first = Map(el → getBoundingClientRect())`", "F (First): положения до изменения DOM"],
          ["`mutate()`", "Единственная раскладка: DOM меняется сразу, без анимации"],
          ["`dx = f.left − l.left`, `dy = f.top − l.top`", "I (Invert): на сколько нужно сдвинуть элемент, чтобы он визуально остался на старом месте"],
          ["`el.animate([{ transform: translate(dx, dy) }, { transform: none }], …)`", "P (Play): плавное движение к нулевому смещению через `transform`"],
          ["`if (reduce.matches) return;`", "Для `prefers-reduced-motion: reduce` перестановка мгновенная"],
          ["`role=\"status\"`", "Сообщение о результате для скринридеров: смысл не только в движении"],
        ],
        "Как устроена перестановка",
      ),
      ul(
        "Анимируются только `transform` и `opacity`: раскладка выполняется один раз (в `mutate`), а не на каждом кадре.",
        "Новый элемент появляется через `opacity`: у него нет «до», поэтому для него нет FLIP-смещения.",
        "Анимация не меняет порядок в DOM и фокус: клавиатурная навигация следует за реальным порядком.",
      ),
    ]),

    section("internals", [
      h("Как браузер строит кадр"),
      steps(
        [
          ["Стили", "Для каждого элемента вычисляются актуальные значения, включая значения анимаций на текущий момент."],
          ["Раскладка", "Если изменились свойства раскладки, браузер пересчитывает размеры и положения элементов, которых это касается."],
          ["Отрисовка", "Для каждого слоя формируются команды рисования (цвета, тени, текст). Если изменился только слой с `transform`/`opacity`, его содержимое повторно не рисуется."],
          ["Композитинг", "Слои собираются в итоговый кадр с учётом их трансформаций и прозрачности. Это работа потока композитора и графического процессора."],
          ["Вывод", "Готовый кадр отправляется на экран по сигналу обновления дисплея."],
        ],
        "Конвейер рендеринга",
      ),
      h("Почему композиторные анимации «переживают» занятый основной поток"),
      p("Если анимируются только `transform` и `opacity`, поток композитора сам вычисляет положение слоя на каждом кадре. Даже если основной поток занят JavaScript, такая анимация продолжает идти плавно. Анимации раскладки и отрисовки зависят от основного потока и «замирают» при его блокировке."),
      h("Проверка идущих анимаций"),
      code(
        "js",
        `
        const info = document.getAnimations().map((a) => [
          a.constructor.name,                     // CSSAnimation | CSSTransition | Animation
          a.animationName ?? a.transitionProperty,
          a.playState,
          Object.keys(a.effect.getKeyframes()[0]).filter((k) => !["offset", "easing", "composite", "computedOffset"].includes(k)),
        ]);
        console.log(info);
        `,
        { filename: "list-animations.js" },
      ),
      note("Список ключей первого кадра показывает, какие свойства анимируются: если среди них `left`, `width`, `margin-*`, `top` — это кандидат на замену трансформацией."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Анимация свойств раскладки"),
      p("`left`, `top`, `margin`, `width`, `height` запускают раскладку на каждом кадре (замер: ≈ 50 раскладок за 800 мс) и сдвигают соседей (замер: 192 записи `layout-shift`, сумма 0.204 для `height`). Используйте `transform` и `opacity`."),
      h("Ошибка 2. `will-change` везде"),
      p("Постоянный `will-change` на многих элементах создаёт множество слоёв: растёт расход памяти, браузер реже может оптимизировать. Включайте на время анимации и снимайте."),
      h("Ошибка 3. Анимация `box-shadow` и `filter` на множестве элементов"),
      p("Они не вызывают раскладку (замер: 0 раскладок), но дают пересчёт стилей на каждом кадре (≈ 50 за 800 мс) и перерисовку слоя. На больших списках используйте тень на псевдоэлементе с анимацией `opacity`."),
      h("Ошибка 4. Анимация через `setInterval` и `requestAnimationFrame` вручную"),
      p("Ручной цикл, меняющий `style.left`, делает раскладку на каждом кадре и не может уйти на композитор. Используйте CSS-анимации и `element.animate()` для `transform`/`opacity`."),
      h("Ошибка 5. Игнорирование `prefers-reduced-motion`"),
      p("Параллакс, масштабирование и бесконечные циклы вызывают дискомфорт. Отключайте движение для `reduce` и обрабатывайте JavaScript-анимации через `matchMedia`."),
      h("Ошибка 6. Измерения «на глаз»"),
      p("Плавность на мощном ноутбуке не гарантирует плавность на слабом телефоне. Проверяйте в DevTools (Performance, Rendering) с замедлением процессора."),
      h("Ошибка 7. Анимация как единственный носитель смысла"),
      p("Перестановка, ошибка, успех должны быть понятны без движения: текст, роль `status`/`alert`, изменение состояния. Это же помогает при `reduce`."),
      h("Ошибка 8. FLIP с принудительными раскладками в цикле"),
      p("Чередование `getBoundingClientRect()` и записи стилей внутри цикла вызывает «layout thrashing». Сначала прочитайте все положения, затем меняйте DOM, затем снова прочитайте все и только после этого запускайте анимации."),
    ]),

    section("antipatterns", [
      ul(
        "**Анимация `width`/`height` вместо `transform: scale()` или раскрытия через `grid-template-rows`.**",
        "**`transition: all`**, которая цепляет свойства раскладки.",
        "**Постоянный `will-change`** на всех карточках «для плавности».",
        "**Параллакс-прокрутка на JavaScript** с записью `style.top` в `scroll`.",
        "**Бесконечные анимации** без паузы и без учёта `reduce`.",
        "**Тяжёлые `filter: blur()` на большой площади** в анимации.",
        "**Анимации в списках на тысячи элементов** без виртуализации и без проверки.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Двигайте `transform`/`translate`, меняйте `opacity`;** остальное — осознанно и на малой площади.",
        "**Измеряйте:** DevTools Performance и Rendering; `PerformanceObserver` для CLS и долгих кадров; тесты счётчиков (`LayoutCount`).",
        "**FLIP** для перестановок; **`grid-template-rows`** для раскрытия; **WAAPI** для анимаций из JavaScript.",
        "**`will-change` — точечно и временно.**",
        "**Токены движения:** длительности и кривые в одном месте; короткие анимации откликов.",
        "**`prefers-reduced-motion`:** убирайте движение, оставляйте смысл; JavaScript проверяет `matchMedia`.",
        "**Тестируйте на слабых устройствах** или с замедлением CPU.",
        "**Документируйте правила:** какие свойства разрешено анимировать в проекте.",
      ),
    ]),

    section("edge-cases", [
      h("Слои и память"),
      p("Каждый композиторный слой занимает видеопамять, пропорциональную площади. Большие слои (во весь экран) на мобильных устройствах дороги. Следите за числом слоёв в DevTools (Layers, Layer borders)."),
      h("Частота обновления экрана"),
      p("На экранах 120–144 Гц бюджет кадра сокращается до 8.3–6.9 мс. Анимации раскладки, терпимые на 60 Гц, могут давать рывки. Композиторные анимации масштабируются лучше."),
      h("Фоновые вкладки и энергосбережение"),
      p("В неактивных вкладках анимации замедляются или останавливаются. Режим энергосбережения также может снижать частоту кадров: не привязывайте логику к конкретной длительности."),
      h("Анимации и `content-visibility`/`contain`"),
      p("`contain` и `content-visibility: auto` ограничивают область перерасчёта и пропускают отрисовку невидимых блоков: полезно для длинных списков, но анимации внутри скрытых блоков не идут. Подробнее — в теме про производительность CSS."),
      h("JavaScript-анимации и `requestAnimationFrame`"),
      p("`requestAnimationFrame` синхронизирует работу с кадром, но выполняется в основном потоке. Если в нём меняются свойства раскладки, возникает та же стоимость. Для простых случаев `element.animate()` эффективнее."),
      h("Скролл-анимации"),
      p("Анимации, привязанные к прокрутке (`animation-timeline`), с `transform`/`opacity` могут идти вне основного потока, в отличие от обработчиков `scroll` на JavaScript. Проверяйте поддержку и запасной вариант."),
    ]),

    section("related", [
      ul(
        "[Переходы](/learn/css/transitions) — как запускаются и тестируются переходы.",
        "[Ключевые кадры](/learn/css/keyframes) — сценарии, заливка, события.",
        "[Трансформации](/learn/css/transforms) — `transform`, `translate`, `rotate`, `scale`.",
        "[Конвейер рендеринга](/learn/css/rendering-pipeline) — стили, раскладка, отрисовка, композитинг.",
        "[Производительность CSS](/learn/css/css-performance) — `contain`, `content-visibility`, стоимость селекторов.",
        "[Контексты наложения](/learn/css/stacking-contexts) — как `will-change` и `transform` создают контекст.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Анимация раскладки и постоянный will-change",
          code: `
            .card { will-change: transform, opacity, width; transition: all 300ms; }
            .card:hover { width: 22rem; margin-top: -4px; box-shadow: 0 20px 40px rgba(0,0,0,.4); }
            .drawer { left: -300px; transition: left 300ms; }
          `,
          note: "Раскладка на каждом кадре, лишние слои, анимация `all`, тени на множестве элементов.",
        },
        {
          title: "Композиторные свойства и доступность",
          code: `
            .card { transition: translate 150ms ease-out, scale 150ms ease-out; }
            .card:hover { translate: 0 -4px; scale: 1.02; }
            .drawer { translate: -300px 0; transition: translate 300ms; }
            @media (prefers-reduced-motion: reduce) { .card, .drawer { transition: none; } }
          `,
          note: "Только `translate`/`scale`; раскладка не затрагивается; для `reduce` движение отключено.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.animation-performance-motion.ex1",
      title: "Классифицируйте свойства",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("Разделите свойства на группы по этапу конвейера, который они запускают при анимации: `width`, `opacity`, `background-color`, `transform`, `margin-top`, `box-shadow`, `left`, `color`. Какие две из них самые дешёвые?"),
      ],
      hints: ["Что требует перерасчёта положения соседей?", "Что требует только перерисовки слоя?"],
      checks: ["Раскладка: width, margin-top, left", "Отрисовка: background-color, box-shadow, color", "Композитинг: opacity, transform"],
      solution: [
        ul(
          "**Раскладка:** `width`, `margin-top`, `left` (замер: ≈ 49–50 раскладок за 800 мс).",
          "**Отрисовка:** `background-color`, `box-shadow`, `color` (замер: 0 раскладок, ≈ 50 пересчётов стилей).",
          "**Композитинг:** `opacity`, `transform` (замер: по 1 раскладке и 5–6 пересчётов в начале и конце).",
        ),
        p("Самые дешёвые — `transform` и `opacity`."),
      ],
    }),
    exercise({
      id: "css.animation-performance-motion.ex2",
      title: "Замените анимацию `left` на трансформацию",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Выдвижная панель анимируется через `left` и «тормозит» на слабых устройствах. Перепишите на `translate`, добавьте отключение при `prefers-reduced-motion: reduce` и объясните, почему раскладка перестанет запускаться на каждом кадре."),
      ],
      starter: {
        lang: "css",
        code: `
          .drawer { position: fixed; top: 0; left: -300px; width: 300px; height: 100%; transition: left 300ms; }
          .drawer.is-open { left: 0; }
        `,
      },
      hints: ["Какое свойство двигает слой без раскладки?", "Какое начальное смещение нужно?"],
      checks: ["`translate: -100% 0` → `0 0`", "Только `translate` в `transition`", "`@media (prefers-reduced-motion: reduce)`"],
      solution: [
        code(
          "css",
          `
          .drawer { position: fixed; inset-block: 0; inset-inline-start: 0; inline-size: 300px; translate: -100% 0; transition: translate 300ms ease-out; }
          .drawer.is-open { translate: 0 0; }

          @media (prefers-reduced-motion: reduce) { .drawer { transition: none; } }
          `,
        ),
        p("Положение панели в раскладке не меняется (`inset-inline-start: 0` постоянно); движение — смещение готового слоя. В замере анимация `left` давала ≈ 50 раскладок за 800 мс, а `transform` — одну."),
      ],
    }),
    exercise({
      id: "css.animation-performance-motion.ex3",
      title: "Плавная перестановка по FLIP",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Список из 4 элементов высотой 30px с интервалом 10px. Первый элемент переносят в конец. Реализуйте FLIP и вычислите смещения `dy` для каждого элемента, а также вертикальные положения сразу после запуска и в конце."),
      ],
      hints: ["Как вычисляется `dy` для каждого элемента?", "Каким должно быть положение сразу после запуска?"],
      checks: ["dy: −120, 40, 40, 40", "Старт: 0, 40, 80, 120", "Конец: 120, 0, 40, 80"],
      solution: [
        code(
          "js",
          `
          const first = new Map([...list.children].map((el) => [el, el.getBoundingClientRect()]));
          list.append(list.firstElementChild);                       // первый — в конец
          for (const el of list.children) {
            const l = el.getBoundingClientRect(), f = first.get(el);
            const dy = f.top - l.top;
            if (dy) el.animate([{ transform: "translateY(" + dy + "px)" }, { transform: "none" }], { duration: 300, easing: "ease-out" });
          }
          `,
        ),
        p("Замер: `dy` = −120 для перенесённого элемента и 40 для остальных; сразу после запуска положения по вертикали (0, 40, 80, 120) совпадают со старыми, в конце — с новыми (120, 0, 40, 80). Раскладка выполняется один раз."),
      ],
    }),
  ],

  challenge: {
    id: "css.animation-performance-motion.challenge",
    title: "Тест бюджета: анимации не должны запускать раскладку и должны уважать reduced motion",
    scenario: [
      p("В продукте появились рывки при открытии панели и наведении на карточки. Профилирование показало: анимируются `left`, `margin-top` и `width`. Нужно переписать анимации на композиторные свойства и добавить **автоматический тест**, который считает раскладки во время анимации и проверяет поведение при `prefers-reduced-motion: reduce`."),
    ],
    requirements: [
      "Панель: выезд через `translate`, не более 300 мс",
      "Карточка: подъём при наведении через `translate` и `scale`",
      "Тест: за время анимации прирост `LayoutCount` не более 3 (в замере 0; контроль: версия на `left` даёт десятки раскладок)",
      "Тест: при `reducedMotion: reduce` анимаций нет",
      "Тест: ни одной анимации раскладки среди `getAnimations()` (проверка по ключам кадров)",
    ],
    constraints: [
      "Нельзя анимировать `top`, `left`, `margin-*`, `width`, `height`",
      "Нельзя использовать `will-change` постоянно",
    ],
    acceptance: [
      "Прирост `LayoutCount` для версии на `translate`: не более 3",
      "Прирост `LayoutCount` для версии на `left`: более 10 (в замере — 24 за переход 300 мс)",
      "Среди ключей кадров нет свойств раскладки",
      "При `reduce` число анимаций: 0",
    ],
    hints: [
      "Как получить `LayoutCount` из браузера в Playwright?",
      "Как отличить свойства раскладки по ключам кадров?",
      "Сколько ждать, чтобы набрались кадры?",
    ],
    solution: [
      code(
        "css",
        `
        .drawer { translate: -100% 0; transition: translate 300ms ease-out; }
        .drawer.is-open { translate: 0 0; }

        .card { transition: translate 150ms ease-out, scale 150ms ease-out; }
        .card:hover { translate: 0 -4px; scale: 1.02; }

        @media (prefers-reduced-motion: reduce) { .drawer, .card { transition: none; } }
        `,
        { filename: "motion.css", lineNumbers: true },
      ),
      code(
        "js",
        `
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Performance.enable");
        const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));

        async function layouts(trigger) {
          await page.waitForTimeout(300);
          const m0 = await metrics();
          await page.evaluate(trigger);
          await page.waitForTimeout(800);                          // анимация + запас
          const m1 = await metrics();
          return Math.round(m1.LayoutCount - m0.LayoutCount);
        }

        console.log("translate:", await layouts(() => document.querySelector(".drawer").classList.add("is-open")));   // ≤ 3
        // контроль: версия на left
        console.log("left:", await layouts(() => document.querySelector(".bad").classList.add("is-open")));            // > 10 (в замере 24)

        const layoutKeys = ["left", "top", "right", "bottom", "width", "height", "marginTop", "marginLeft"];
        const bad = await page.evaluate((keys) => document.getAnimations().flatMap((a) => Object.keys(a.effect.getKeyframes()[0]).filter((k) => keys.includes(k))), layoutKeys);
        console.log("свойства раскладки в анимациях:", bad);       // []

        await page.emulateMedia({ reducedMotion: "reduce" });
        console.log("reduce:", await page.evaluate(() => { document.querySelector(".drawer").classList.remove("is-open"); document.querySelector(".drawer").getBoundingClientRect(); document.querySelector(".drawer").classList.add("is-open"); return document.getAnimations().length; }));   // 0
        `,
        { filename: "motion.test.js" },
      ),
      ul(
        "**Счётчик раскладок:** `Performance.getMetrics` (CDP) возвращает накопленный `LayoutCount`: прирост за время анимации — объективная метрика.",
        "**Контроль:** версия на `left` должна давать заметно больший прирост; иначе тест бесполезен.",
        "**Ключи кадров:** `effect.getKeyframes()[0]` показывает, какие свойства анимируются; свойства раскладки — нарушение.",
        "**Reduced motion:** `emulateMedia({ reducedMotion: \"reduce\" })` и `getAnimations().length === 0`.",
      ),
    ],
  },

  interview: [
    iq("css.animation-performance-motion.i1", "basic", "Какие CSS-свойства дёшево анимировать и почему?", [
      p("`transform` и `opacity`: они обрабатываются на этапе композитинга — готовый слой двигается и смешивается без раскладки и отрисовки. В замере за 800 мс они дали по 1 раскладке и 5–6 пересчётов стилей, тогда как `left`, `margin-top`, `width` — ≈ 50 раскладок."),
    ]),
    iq("css.animation-performance-motion.i2", "basic", "Почему не стоит анимировать `width`, `left`, `margin`?", [
      p("Они запускают раскладку на каждом кадре (замер ≈ 49–50 раскладок и ≈ 50 пересчётов стилей за 800 мс), двигают соседей и вызывают сдвиги макета (замер: `height` — 192 записи `layout-shift`, сумма 0.204). Это приводит к рывкам и ухудшает CLS."),
    ]),
    iq("css.animation-performance-motion.i3", "intermediate", "Что такое `will-change` и когда его применять?", [
      p("Подсказка браузеру о том, какое свойство изменится: он заранее выделяет слой. Применяйте точечно и временно — перед анимацией и до её окончания. Постоянный `will-change` на многих элементах расходует память и может создавать контексты наложения."),
    ]),
    iq("css.animation-performance-motion.i4", "intermediate", "Как работает приём FLIP?", [
      ul(
        "First: запомнить положения элементов (`getBoundingClientRect`).",
        "Last: изменить DOM и измерить новые положения.",
        "Invert: смещением `transform` вернуть элементы на старые места (`translate(dx, dy)`).",
        "Play: анимировать смещение к нулю (`element.animate`). Раскладка выполняется один раз.",
      ),
    ]),
    iq("css.animation-performance-motion.i5", "intermediate", "Как реагировать на `prefers-reduced-motion`?", [
      p("Для `reduce` убирать движение (перемещения, масштаб, вращение, параллакс, бесконечные циклы), но сохранять смысл (смену состояния, текст, цвет). CSS: `@media (prefers-reduced-motion: reduce) { … }`; JavaScript: `matchMedia(\"(prefers-reduced-motion: reduce)\")` с учётом смены настройки на лету."),
    ]),
    iq("css.animation-performance-motion.i6", "advanced", "Как измерить производительность анимации объективно?", [
      ul(
        "DevTools → Performance (кадры, раскладка, отрисовка), Rendering (Paint flashing, Layout Shift Regions, FPS).",
        "`PerformanceObserver` для `layout-shift` и долгих задач/кадров.",
        "CDP `Performance.getMetrics`: прирост `LayoutCount` и `RecalcStyleCount` за время анимации — удобная метрика для автотестов.",
        "Проверка на слабом устройстве или с замедлением CPU.",
      ),
    ]),
    iq("css.animation-performance-motion.i7", "engineering", "Как встроить требования к анимациям в процесс разработки?", [
      ul(
        "Линтер и ревью: запрет анимации свойств раскладки и `transition: all`.",
        "Автотесты: WAAPI (`getAnimations`, ключи кадров), счётчики раскладок, эмуляция `reduce`.",
        "Токены движения (длительности, кривые) и документация по доступности.",
        "Мониторинг CLS и долгих кадров в продакшене.",
      ),
    ]),
    iq("css.animation-performance-motion.i8", "debugging", "Анимация рывками. Что проверите?", [
      ul(
        "Какие свойства анимируются: нет ли `left`, `top`, `margin`, `width`, `height`.",
        "Не заблокирован ли основной поток JavaScript; не запускаются ли раскладки в `scroll`/`rAF` обработчиках.",
        "Число слоёв и размер: не создано ли слишком много `will-change`.",
        "Тяжёлые `filter`, `box-shadow` на больших областях; частота экрана и режим энергосбережения.",
        "DevTools Performance: где проходит время кадра.",
      ),
    ]),
  ],

  exam: [
    mcq("css.animation-performance-motion.e1", "foundation", "Какие два свойства дешевле всего анимировать?", ["`width` и `height`", "`left` и `top`", "`transform` и `opacity`", "`margin` и `padding`"], 2, "Они обрабатываются на композиторе: без раскладки и отрисовки на каждом кадре."),
    mcq("css.animation-performance-motion.e2", "foundation", "Что делает анимация `left` на каждом кадре?", ["Раскладку, отрисовку и композитинг", "Только композитинг", "Только отрисовку", "Ничего"], 0, "`left` меняет положение в раскладке: нужен перерасчёт, отрисовка и композитинг."),
    mcq("css.animation-performance-motion.e3", "intermediate", "Для чего нужен `will-change`?", ["Для включения анимации", "Для работы `prefers-reduced-motion`", "Для отключения раскладки", "Подсказка о будущем изменении: слой создаётся заранее"], 3, "`will-change` подсказывает браузеру выделить слой заранее; применять нужно точечно и временно."),
    mcq("css.animation-performance-motion.e4", "intermediate", "Что означает «I» в FLIP?", ["Initialize", "Invert: вернуть элемент на старое место смещением", "Insert", "Interpolate"], 1, "Invert — смещение `transform`, визуально возвращающее элемент на прежнее положение."),
    mcq("css.animation-performance-motion.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["Анимация `height` может давать записи `layout-shift`", "`transform` не меняет раскладку соседей", "Для `prefers-reduced-motion: reduce` следует удалить смысловые изменения состояния", "Постоянный `will-change` на всех карточках бесплатен"], [0, 1], "При `reduce` убирают движение, но сохраняют смысл; постоянный `will-change` расходует память."),
    mcq("css.animation-performance-motion.e6", "advanced", "Анимация `box-shadow` на 1000 элементов. Какой этап конвейера нагружается?", ["Только композитинг", "Раскладка", "Ничего", "Отрисовка на каждом кадре"], 3, "Тень не меняет раскладку, но перерисовывает слой на каждом кадре; на больших списках лучше анимировать `opacity` слоя с тенью."),
    open("css.animation-performance-motion.e7", "intermediate", "Объясните, как сделать плавную и доступную анимацию перестановки элементов списка.", [
      ul(
        "FLIP через `element.animate()` с `transform`: измерить до и после, вернуть на старое место, отыграть к нулю.",
        "`prefers-reduced-motion: reduce`: перестановка мгновенная; результат объявляется через `role=\"status\"`.",
        "Раскладка выполняется один раз; порядок в DOM и фокус отражают реальный порядок.",
      ),
    ], ["Описан FLIP", "Учтён reduced motion", "Учтены доступность и порядок DOM"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.animation-performance-motion.m1", "intermediate", "Список из 4 элементов (30px + 10px), первый перенесли в конец. Чему равен `dy` для второго элемента?", ["−120", "0", "40", "120"], 2, "Второй элемент стоял на 40 и перешёл на 0: `dy = 40 − 0 = 40` — сместить на 40px вниз, чтобы визуально остаться на старом месте."),
    mcq("css.animation-performance-motion.m2", "advanced", "Что даёт `commitStyles()` в WAAPI?", ["Останавливает анимацию", "Записывает итоговые значения в `style`, чтобы их можно было сохранить после `cancel()`", "Запускает анимацию заново", "Отключает композитинг"], 1, "Итоговые значения фиксируются в `style`; анимацию можно снять без возврата к исходному состоянию."),
    mcq("css.animation-performance-motion.m3", "advanced", "Почему композиторная анимация `transform` продолжает идти плавно при занятом основном потоке?", ["Потому что поток композитора сам считает положение слоя на каждом кадре", "Потому что JavaScript быстрее", "Потому что раскладка кешируется", "Это неверно: она тоже замирает"], 0, "Положение слоя вычисляется потоком композитора; основной поток для такой анимации не нужен."),
    open("css.animation-performance-motion.m4", "advanced", "Спроектируйте политику производительности и доступности анимаций для крупного продукта.", [
      ul(
        "Правила: `transform`/`opacity` для движения, запрет анимации свойств раскладки, `will-change` только временно, FLIP для перестановок.",
        "Доступность: `prefers-reduced-motion`, паузы для долгих анимаций, отсутствие мигания, смысл вне анимации.",
        "Тесты: счётчики `LayoutCount`, WAAPI-проверки ключей кадров, эмуляция `reduce`, контроль CLS.",
        "Мониторинг: Core Web Vitals (CLS), долгие кадры, регулярный профилинг на слабых устройствах.",
        "Документация: токены движения и примеры «как» и «как не».",
      ),
    ], ["Правила", "Тесты и мониторинг", "Доступность"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.animation-performance-motion.f1", front: "Дёшево анимировать?", back: "`transform`, `opacity` (композитинг). Дорого: `left`, `top`, `margin`, `width`, `height` (раскладка)." },
    { id: "css.animation-performance-motion.f2", front: "Замер за 800 мс?", back: "`left`/`margin`/`width` ≈ 50 раскладок; `transform`/`opacity` — 1 раскладка; `background-color` — 0 раскладок, ≈ 50 пересчётов стилей." },
    { id: "css.animation-performance-motion.f3", front: "FLIP?", back: "First → Last → Invert → Play: измерить, изменить DOM, вернуть `transform`ом, отыграть к нулю." },
    { id: "css.animation-performance-motion.f4", front: "`will-change`?", back: "Точечно и временно; постоянный расходует память и создаёт контекст наложения." },
    { id: "css.animation-performance-motion.f5", front: "`prefers-reduced-motion: reduce`?", back: "Убрать движение, сохранить смысл; JS — `matchMedia`." },
    { id: "css.animation-performance-motion.f6", front: "Измерять как?", back: "DevTools Performance/Rendering, `PerformanceObserver`, CDP `Performance.getMetrics` (`LayoutCount`)." },
  ],

  sources: [
    { title: "Web Animations", url: "https://www.w3.org/TR/web-animations-1/", publisher: "W3C" },
    { title: "CSS Will Change Module Level 1", url: "https://www.w3.org/TR/css-will-change-1/", publisher: "W3C" },
    { title: "MDN: CSS and JavaScript animation performance", url: "https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance", publisher: "MDN" },
    { title: "MDN: Element.animate()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/animate", publisher: "MDN" },
    { title: "MDN: will-change", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/will-change", publisher: "MDN" },
    { title: "MDN: prefers-reduced-motion", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion", publisher: "MDN" },
    { title: "web.dev: Cumulative Layout Shift (CLS)", url: "https://web.dev/articles/cls", publisher: "Other" },
    { title: "WCAG 2.2: Animation from Interactions", url: "https://www.w3.org/TR/WCAG22/#animation-from-interactions", publisher: "W3C" },
    { title: "WCAG 2.2: Pause, Stop, Hide", url: "https://www.w3.org/TR/WCAG22/#pause-stop-hide", publisher: "W3C" },
  ],
};
