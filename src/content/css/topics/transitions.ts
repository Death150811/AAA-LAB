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

export const transitions: Topic = {
  id: "css.transitions",
  slug: "transitions",
  domain: "css",
  module: "animation",
  title: "Переходы (transitions)",
  titleEn: "CSS transitions: transition shorthand, timing functions, reversal, display and height transitions, @starting-style",
  summary:
    "Переход плавно меняет значение свойства при его изменении. Тема объясняет, когда переход запускается (и почему не запускается при первой отрисовке), как читать `transition`, как ведут себя функции времени (замеры значений на 25/50/75% времени), почему `transition: all` вредит, как переходят `visibility`, `display` (`transition-behavior: allow-discrete`) и появление элементов (`@starting-style`), как анимировать высоту `auto` (`grid-template-rows: 0fr → 1fr`, `interpolate-size`), как переход обращается при прерывании и как уважать `prefers-reduced-motion`.",
  minutes: 50,
  prerequisites: ["css.cascade", "css.pseudo-classes-elements"],
  tags: ["transition", "transition-property", "transition-timing-function", "cubic-bezier", "steps", "linear()", "transition-behavior", "allow-discrete", "@starting-style", "height auto", "interpolate-size", "prefers-reduced-motion", "transitionend", "getAnimations"],
  keyConcepts: [
    { term: "Переход запускается изменением вычисленного значения", text: "Браузер сравнивает «до» и «после» при пересчёте стилей. Если свойство в `transition` и значение изменилось, создаётся анимация. При первой отрисовке «до» нет — перехода не будет (для этого есть `@starting-style`)." },
    { term: "Только то, что нужно", text: "`transition: all` создаёт анимацию для каждого изменившегося свойства: в замере три свойства дали три анимации, `transition: opacity` — одну. Перечисляйте свойства явно." },
    { term: "Функция времени — это форма кривой", text: "На 50% времени `ease` даёт 0.80 прогресса, `linear` — 0.50, `ease-in` — 0.32, `ease-out` — 0.69. Выбирайте кривую по смыслу: появление — `ease-out`, исчезновение — `ease-in`." },
    { term: "Дискретные свойства", text: "`visibility` и (с `transition-behavior: allow-discrete`) `display` переключаются **не плавно**: уход в `hidden`/`none` происходит в конце перехода, появление — сразу. Это позволяет анимировать исчезновение." },
    { term: "Высота `auto` не анимируется", text: "Из `height: 0` в `auto` переход не создаётся (замер: 0 анимаций). Решения: `grid-template-rows: 0fr → 1fr` или `interpolate-size: allow-keywords` (где поддерживается)." },
  ],
  sections: [
    section("definition", [
      def("Переход (transition)", "Механизм CSS, который при изменении вычисленного значения свойства плавно проводит его от старого значения к новому за заданное время вместо мгновенной смены.", "CSS transition"),
      def("Функция времени", "Кривая, задающая, как прогресс (0 → 1) зависит от прошедшего времени: `linear`, `ease`, `cubic-bezier()`, `steps()`, `linear()`.", "timing function / easing"),
      def("Анимируемое свойство", "Свойство, значения которого браузер умеет интерполировать (числа, длины, цвета, трансформации). Дискретные свойства (`display`, `visibility`) переключаются скачком в определённый момент.", "animatable property"),
      def("`@starting-style`", "Правило, задающее начальные значения для первого пересчёта стилей элемента: это даёт «до» для перехода при появлении элемента на странице или после `display: none`.", "@starting-style"),
      def("`transition-behavior`", "Свойство, разрешающее переходы дискретных свойств (`allow-discrete`), в частности `display` и `content-visibility`.", "transition-behavior"),
    ]),

    section("why", [
      h("Зачем нужны переходы"),
      ul(
        "**Обратная связь:** кнопка плавно меняет цвет при наведении, переключатель «переезжает», а не «прыгает».",
        "**Непрерывность:** раскрытие и сворачивание блоков помогают понять, что произошло.",
        "**Внимание без шума:** короткие переходы направляют взгляд к изменению.",
        "**Простота:** одна строка CSS вместо JavaScript-анимации.",
      ),
      h("Когда переходов недостаточно"),
      p("Переход описывает **две точки** — начало и конец. Для последовательностей из нескольких шагов, зацикленных и самозапускающихся анимаций нужны `@keyframes`. А для анимаций, привязанных к прокрутке или сложной логике, — отдельные инструменты (см. следующие темы)."),
      insight("Переход — это ответ на **изменение состояния**: наведение, фокус, класс. Если анимация должна начаться сама или повторяться, вам нужны `@keyframes`."),
    ]),

    section("mental-model", [
      p("Представьте **резинку между двумя гвоздиками**. Каждый раз, когда браузер пересчитывает стили, он смотрит: «значение свойства `opacity` изменилось? есть ли у него `transition`?» Если да — привязывает к текущему значению резинку, растянутую к новому, и тянет за неё в течение `duration`. Если значение изменилось, пока резинка тянется, браузер **перепривязывает** её от текущей точки к новому значению."),
      diagram(
        `
        .btn { opacity: 0.6; transition: opacity 300ms ease-out; }
        .btn:hover { opacity: 1; }

        наведение ──► значение изменилось (0.6 → 1) + есть transition → создаётся анимация
                      t = 0        150 мс        300 мс
                      0.6   ──────►  ~0.93  ─────►  1

        при первой отрисовке:  «до» нет  → перехода НЕТ (нужен @starting-style)
        height: 0 → auto:      auto не интерполируется → перехода НЕТ
        `,
        "Когда переход запускается",
      ),
    ]),

    section("technical", [
      h("Синтаксис"),
      code(
        "css",
        `
        .btn {
          transition: background-color 200ms ease-out, transform 150ms ease-out 50ms;
          /*          свойство         длительность функция       задержка          */
        }

        /* развёрнуто */
        .panel {
          transition-property: opacity, transform;
          transition-duration: 250ms, 250ms;
          transition-timing-function: ease-out;
          transition-delay: 0s;
          transition-behavior: normal;
        }
        `,
        { filename: "transition-syntax.css" },
      ),
      ul(
        "В сокращении первое время — **длительность**, второе — **задержка**: `opacity 300ms ease 100ms`.",
        "Список через запятую задаёт переходы для разных свойств; короткие списки значений повторяются по кругу.",
        "Переход объявляют на **элементе** (в исходном или в итоговом состоянии). Переход, объявленный в `:hover`, работает при наведении, но не «возвращает» при уходе курсора; обычно его пишут в базовом правиле.",
        "Задержка `300ms` при длительности `500ms` в замере: значение стояло на 0 до 300 мс, на 550 мс было 0.5, на 800 мс — 1.",
      ),
      h("Функции времени: замеры"),
      p("Opacity 0 → 1 за 1000 мс, значение на 250 / 500 / 750 мс (детерминированный замер через Web Animations API):"),
      table(
        ["Функция", "250 мс", "500 мс", "750 мс", "Характер"],
        [
          ["`linear`", "0.250", "0.500", "0.750", "Равномерно; для непрерывных процессов (прогресс, вращение)"],
          ["`ease` (по умолчанию)", "0.409", "0.802", "0.960", "Быстрый старт, мягкое замедление"],
          ["`ease-in`", "0.093", "0.315", "0.622", "Медленный старт: для исчезновения"],
          ["`ease-out`", "0.378", "0.685", "0.907", "Быстрый старт, замедление: для появления и реакции на действие"],
          ["`ease-in-out`", "0.129", "0.500", "0.871", "Симметрично: для перемещений между точками"],
          ["`cubic-bezier(0.4, 0, 0.2, 1)`", "0.237", "0.776", "0.959", "Популярная кривая «стандартного» движения"],
          ["`steps(4)`", "0.250", "0.500", "0.750", "Скачки по четырём ступеням (в конце каждого шага)"],
          ["`steps(4, jump-none)`", "0.333", "0.667", "1.000", "Ступени от 0 до 1 без пропуска концов"],
          ["`linear(0, 0.25 25%, 1)`", "0.250", "0.500", "0.750", "Кусочно-линейная кривая из точек"],
        ],
        "Прогресс по времени",
      ),
      p("Функцию выбирают по смыслу: **появление** (вход) — `ease-out`: быстрое начало создаёт ощущение отклика. **Исчезновение** — `ease-in`. **Перемещение** между двумя состояниями — `ease-in-out`. Для декоративных пружин и отскоков подходит `linear()` со списком точек."),
      h("Что переходит, а что нет"),
      table(
        ["Случай", "Результат (замер)"],
        [
          ["`opacity`, `transform`, цвета, длины, `grid-template-rows`", "Переходят плавно"],
          ["`height: 0` → `height: auto`", "Анимаций 0: переход не создаётся"],
          ["`background-image: linear-gradient(red…)` → `linear-gradient(blue…)`", "Анимаций 0: градиенты в переходах не интерполируются"],
          ["`display: none` → `block` без `@starting-style`", "Анимаций 0"],
          ["`visibility: visible` → `hidden`", "Остаётся `visible` до самого конца, затем `hidden`"],
          ["`visibility: hidden` → `visible`", "Становится `visible` сразу"],
        ],
        "Анимируемость в Chromium",
      ),
      h("`transition: all` — ловушка"),
      wrongRight(
        "css",
        {
          code: `
            .card { transition: all 300ms; }
          `,
          note: "Анимируется всё, что изменится: ширина, цвет, отступы, тени. В замере три изменившихся свойства дали три анимации и три `transitionend`; случайные изменения макета тоже станут «плавными» и вызовут перерасчёты.",
        },
        {
          code: `
            .card { transition: opacity 300ms ease-out, transform 300ms ease-out; }
          `,
          note: "Только нужные свойства: один переход на свойство, предсказуемая нагрузка и события.",
        },
      ),
      h("Исчезновение и появление: `allow-discrete` и `@starting-style`"),
      code(
        "css",
        `
        .toast {
          display: none;
          opacity: 0;
          transition: opacity 300ms ease-out, display 300ms allow-discrete;
        }

        .toast.is-open {
          display: block;
          opacity: 1;
        }

        @starting-style {
          .toast.is-open { opacity: 0; }       /* «до» для первого пересчёта */
        }
        `,
        { filename: "starting-style.css" },
      ),
      ul(
        "**Появление.** Элемент переходит из `display: none` в `block`: без `@starting-style` у него нет «до», и переход не создаётся (замер: 0 анимаций). С `@starting-style` создаётся одна анимация `opacity`: 0 → 0.5 → 1 на 0 / 250 / 500 мс.",
        "**Исчезновение.** `transition: display 300ms allow-discrete` держит `display: block` до конца перехода: в замере `display` был `block` на 0, 250 и 499 мс и стал `none` на 500 мс. Так `opacity` успевает плавно уйти в 0.",
        "**Поддержка.** `@starting-style` и `transition-behavior: allow-discrete` поддерживаются современными браузерами не так давно: проверьте таблицы совместимости. Без них элемент просто появится и исчезнет мгновенно — приемлемый запасной вариант.",
      ),
      h("Высота `auto`"),
      code(
        "css",
        `
        /* 1. Сетка: интерполируется 0fr → 1fr */
        .collapse { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 300ms ease; }
        .collapse.is-open { grid-template-rows: 1fr; }
        .collapse > .inner { overflow: hidden; }

        /* 2. Современный вариант (где поддерживается) */
        :root { interpolate-size: allow-keywords; }
        .panel { height: 0; overflow: hidden; transition: height 300ms; }
        .panel.is-open { height: auto; }
        `,
        { filename: "height-auto.css" },
      ),
      p("Замеры в Chromium: `grid-template-rows: 0fr → 1fr` создал одну анимацию. Для содержимого 100px и линейного перехода значение строки на 0 / 10 / 25 / 50 / 75 / 90 / 100% времени составило `0` / `1` / `6.25` / `25` / `56.25` / `81` / `100px`: рост **нелинейный** (близок к квадрату прогресса), поэтому середина перехода показывает лишь четверть высоты. Другие браузеры могут давать иные промежуточные значения — проверяйте. С `interpolate-size: allow-keywords` переход `height: 0 → auto` тоже создался (50px на середине 500-мс линейного перехода). Приём с `max-height` и «достаточно большим» числом даёт неверный тайминг: анимируется воображаемая высота, а не реальная."),
      h("Прерывание и обращение"),
      p("Если значение изменилось, пока переход идёт, браузер создаёт новый переход от **текущего** значения. Замер: при длительности 1000 мс и снятии класса на 400 мс (значение 0.4) обратный переход получил длительность 400 мс и начал с 0.4 — резинка не «перематывается» с самого начала. Это называется **укорочением при обращении**."),
      h("События и JavaScript"),
      code(
        "js",
        `
        const el = document.querySelector(".panel");

        el.addEventListener("transitionend", (e) => console.log(e.propertyName));   // по одному на свойство
        el.classList.add("is-open");

        // Проверка через Web Animations API
        for (const a of el.getAnimations()) console.log(a.transitionProperty, a.effect.getTiming().duration);
        `,
        { filename: "transition-events.js" },
      ),
      p("Замер: `transition: all 100ms` для изменившихся `opacity` и `width` вызвал два `transitionend` (`opacity`, `width`). События `transitionrun`, `transitionstart`, `transitioncancel` позволяют отслеживать жизненный цикл. `getAnimations()` возвращает `CSSTransition`: удобно для тестов."),
      h("Ступенчатое появление"),
      code(
        "css",
        `
        .list > li {
          opacity: 0;
          transition: opacity 300ms ease-out calc(var(--i) * 60ms);   /* задержка по индексу */
        }
        .list.is-open > li { opacity: 1; }
        `,
        { filename: "stagger.css" },
      ),
      h("Уважение к настройкам пользователя"),
      code(
        "css",
        `
        @media (prefers-reduced-motion: reduce) {
          * { transition-duration: 0.01ms !important; }
        }
        `,
        { filename: "reduced-motion.css" },
      ),
      p("Для `prefers-reduced-motion: reduce` в замере переход, обёрнутый в `@media (prefers-reduced-motion: reduce) { .a { transition: none } }`, не создал ни одной анимации. Оставляйте смену состояния (цвет, видимость), но убирайте движение, масштаб и параллакс."),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        .btn {
          background: #2f3d9a;
          transition: background-color 200ms ease-out, transform 150ms ease-out;
        }
        .btn:hover { background: #3949ab; transform: translateY(-1px); }

        .toast { display: none; opacity: 0; transition: opacity 300ms, display 300ms allow-discrete; }
        .toast.is-open { display: block; opacity: 1; }
        @starting-style { .toast.is-open { opacity: 0; } }

        @media (prefers-reduced-motion: reduce) { .btn { transition: none; } }
        `,
        [
          { line: 3, text: "Два перехода для двух свойств: у каждого своя длительность и функция. Объявление в базовом правиле работает и в одну, и в другую сторону." },
          { line: 4, text: "Состояние `:hover` меняет вычисленные значения — это запускает переход." },
          { line: 6, text: "`display` участвует в переходе через `allow-discrete`: элемент остаётся отображаемым до конца." },
          { line: 8, text: "`@starting-style` даёт «начальное» значение прозрачности при появлении." },
          { line: 10, text: "Для пользователей с `reduce` переходы отключаются: смена состояния остаётся, плавного движения нет." },
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
        <title>transition</title>
        <style>
          body { margin: 0; padding: 1rem; font: 16px/1.5 system-ui, sans-serif; }
          .btn { padding: 0.5rem 1rem; font: inherit; color: #fff; background: #2f3d9a; border: 0; border-radius: 0.5rem; cursor: pointer;
                 transition: background-color 200ms ease-out, transform 150ms ease-out; }
          .btn:hover, .btn:focus-visible { background: #3949ab; transform: translateY(-2px); }
          .btn:active { transform: translateY(0); }
          @media (prefers-reduced-motion: reduce) { .btn { transition: none; } }
        </style>
        <button class="btn" type="button">Наведите курсор или сфокусируйтесь</button>
        </html>
        `,
        { filename: "transition-basics.html", runnable: true },
      ),
      p("Замените `ease-out` на `linear` или `steps(3)` и посмотрите, как меняется характер движения. Включите в системе «уменьшение движения» — анимация исчезнет."),
    ]),

    section("detailed-example", [
      p("Аккордеон и всплывающее уведомление. Аккордеон раскрывается через `grid-template-rows: 0fr → 1fr` (высота `auto` без JavaScript-измерений), уведомление появляется и исчезает с помощью `@starting-style` и `allow-discrete`. Состояния передаются атрибутами `aria-expanded`, а уведомление не мешает работе вспомогательных технологий."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Переходы: аккордеон и уведомление</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; padding: 1rem; font: 1rem/1.5 system-ui, sans-serif; color: #1b1b1f; background: #f4f5fb; }
          button { font: inherit; cursor: pointer; }

          .acc { max-inline-size: 36rem; background: #fff; border-radius: 0.5rem; }
          .acc__btn { display: flex; justify-content: space-between; inline-size: 100%; padding: 0.75rem 1rem; color: inherit; background: none; border: 0; text-align: start; }
          .acc__btn::after { content: "▾"; transition: transform 250ms ease-out; }
          .acc__btn[aria-expanded="true"]::after { transform: rotate(180deg); }

          .collapse { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 300ms ease; }
          .collapse.is-open { grid-template-rows: 1fr; }
          .collapse > .inner { overflow: hidden; }
          .inner > p { margin: 0; padding: 0 1rem 1rem; }

          .toast { position: fixed; inset-block-end: 1rem; inset-inline-end: 1rem; padding: 0.75rem 1rem; color: #fff; background: #1b1b1f; border-radius: 0.5rem;
                   display: none; opacity: 0; transform: translateY(0.5rem);
                   transition: opacity 300ms ease-out, transform 300ms ease-out, display 300ms allow-discrete; }
          .toast.is-open { display: block; opacity: 1; transform: none; }
          @starting-style { .toast.is-open { opacity: 0; transform: translateY(0.5rem); } }

          @media (prefers-reduced-motion: reduce) {
            .acc__btn::after, .collapse, .toast { transition: none; }
          }
        </style>
        <div class="acc">
          <button class="acc__btn" id="acc-btn" type="button" aria-expanded="false" aria-controls="acc-panel">Что такое переход?</button>
          <div class="collapse" id="acc-panel" role="region" aria-labelledby="acc-btn">
            <div class="inner"><p>Переход плавно меняет значение свойства при изменении состояния. Высота блока определяется содержимым, а раскрытие анимируется через <code>grid-template-rows</code>.</p></div>
          </div>
        </div>
        <p><button id="notify" type="button">Показать уведомление</button></p>
        <div class="toast" id="toast" role="status">Готово: изменения сохранены</div>
        <script>
          const btn = document.getElementById("acc-btn");
          const panel = document.getElementById("acc-panel");
          btn.addEventListener("click", () => {
            const open = btn.getAttribute("aria-expanded") !== "true";
            btn.setAttribute("aria-expanded", String(open));
            panel.classList.toggle("is-open", open);
          });

          const toast = document.getElementById("toast");
          let timer;
          document.getElementById("notify").addEventListener("click", () => {
            toast.classList.add("is-open");
            clearTimeout(timer);
            timer = setTimeout(() => toast.classList.remove("is-open"), 2500);
          });
        </script>
        </html>
        `,
        { filename: "transitions-demo.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает"],
        [
          [".collapse { grid-template-rows: 0fr → 1fr }", "Раскрытие по реальной высоте содержимого: внутренний элемент с `overflow: hidden` сжимается до нуля и разворачивается до своей высоты"],
          [".acc__btn::after + transform", "Стрелка поворачивается; `transform` не вызывает перерасчёта раскладки"],
          [".toast { display: none; opacity: 0 }", "Исходное скрытое состояние; `display` и `opacity` переходят вместе"],
          ["`display 300ms allow-discrete`", "Элемент остаётся в потоке до конца ухода `opacity`"],
          ["`@starting-style`", "Задаёт «до» для появления: из прозрачного и смещённого состояния"],
          ["`@media (prefers-reduced-motion: reduce)`", "Отключает переходы: аккордеон раскрывается и уведомление появляется без движения"],
          ["`aria-expanded`, `role=\"status\"`", "Состояния доступны скринридерам независимо от анимации"],
        ],
        "Как устроена страница",
      ),
      ul(
        "Раскрытие не измеряет высоту скриптом: переход строится по `fr`-интерполяции.",
        "Все переходы — по конкретным свойствам; `transition: all` нигде не используется.",
        "Если `@starting-style` или `allow-discrete` не поддерживаются, уведомление просто появляется и исчезает мгновенно — функциональность сохраняется.",
      ),
    ]),

    section("internals", [
      h("Как браузер запускает переход"),
      steps(
        [
          ["Пересчёт стилей", "При изменении класса, состояния или значения браузер вычисляет новые стили элемента. Для каждого свойства есть «до» (стиль предыдущего пересчёта) и «после»."],
          ["Условия запуска", "Переход создаётся, если свойство есть в `transition-property`, `duration` (плюс `delay`) больше нуля, значения «до» и «после» различаются и интерполируются, а элемент отображался в «до»."],
          ["Создание анимации", "Для каждого свойства создаётся `CSSTransition` с начальным и конечным значениями, функцией времени и временем начала (с учётом задержки)."],
          ["Выполнение", "На каждом кадре значение вычисляется по прогрессу; браузер подставляет его как вычисленное значение элемента. Если свойство анимируется на композиторе (`transform`, `opacity`), кадры могут обновляться без участия основного потока."],
          ["Завершение", "По окончании значение фиксируется как итоговое, генерируется `transitionend` для каждого свойства. При прерывании создаётся новый переход от текущего значения."],
        ],
        "Жизненный цикл перехода",
      ),
      h("Почему нет перехода при первой отрисовке"),
      p("Для первого кадра у элемента нет предыдущего стиля: «до» отсутствует, и браузер сразу использует итоговые значения. `@starting-style` явно задаёт «до» для такого случая. Аналогично, при смене `display: none → block` элемент считается «новым» и нуждается в `@starting-style`."),
      h("Принудительный пересчёт в JavaScript"),
      code(
        "js",
        `
        el.style.opacity = "0";
        el.getBoundingClientRect();         // принудительно зафиксировать «до»
        el.style.opacity = "1";             // теперь переход сработает
        `,
        { filename: "force-reflow.js" },
      ),
      note("Раньше этот приём был обязателен для анимации «после вставки в DOM». Сейчас предпочтительнее `@starting-style`; принудительные пересчёты стоят дорого и подходят только как запасной вариант."),
    ]),

    section("mistakes", [
      h("Ошибка 1. `transition: all`"),
      p("Анимируются все изменившиеся свойства, включая случайные и дорогие (ширина, отступы). В замере три свойства — три анимации и три события. Перечисляйте только нужные свойства."),
      h("Ошибка 2. Ожидание перехода при появлении элемента"),
      p("Элемент, добавленный в DOM или показанный из `display: none`, не имеет «до»: переход не запустится (замер: 0 анимаций). Используйте `@starting-style` или анимацию `@keyframes`."),
      h("Ошибка 3. Переход высоты в `auto`"),
      p("`height: 0 → auto` не анимируется (замер: 0 анимаций). Используйте `grid-template-rows: 0fr → 1fr` или `interpolate-size: allow-keywords` там, где он поддерживается. Приём `max-height: 999px` даёт неверный тайминг."),
      h("Ошибка 4. `display: none` без `allow-discrete`"),
      p("Без `transition-behavior: allow-discrete` элемент пропадает мгновенно: `opacity` не успевает дойти до нуля. Добавьте `display` в список переходов с `allow-discrete`."),
      h("Ошибка 5. Градиенты и переходы"),
      p("Фон-градиент между двумя градиентами не анимируется (замер: 0 анимаций). Анимируйте `opacity` дополнительного слоя, `background-position` или зарегистрированную переменную (`@property`)."),
      h("Ошибка 6. Слишком долгие переходы"),
      p("Для откликов интерфейса хватает 100–300 мс; дольше — раздражает и тормозит работу. Крупные перемещения допустимо делать длиннее, но не более 500 мс без причины."),
      h("Ошибка 7. Движение без учёта `prefers-reduced-motion`"),
      p("Масштабирование, параллакс и крупные смещения могут вызывать дискомфорт. Для `reduce` отключайте движение (но не смену состояния)."),
      h("Ошибка 8. Переход на дорогих свойствах"),
      p("Анимация `width`, `height`, `top`, `left`, `margin` запускает перерасчёт раскладки на каждом кадре. Для движения используйте `transform` и `opacity` — подробнее в теме про производительность анимаций."),
    ]),

    section("antipatterns", [
      ul(
        "**`transition: all 0.3s`** «на всякий случай».",
        "**Переход, объявленный только в `:hover`**: при уходе курсора значение «прыгает» назад.",
        "**Длительность 1 с и больше** для обычных откликов интерфейса.",
        "**JavaScript-анимация** простых переходов, которые делает CSS.",
        "**`max-height` с огромным значением** для раскрытия блоков.",
        "**Игнорирование `prefers-reduced-motion`.**",
        "**Анимация свойств раскладки** (`width`, `top`, `margin`) вместо `transform`.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Свойства — явно:** `transition: opacity 200ms ease-out, transform 200ms ease-out`.",
        "**Переход в базовом правиле,** а не в `:hover`: работает в обе стороны.",
        "**Короткие длительности:** 100–300 мс для откликов; кривая по смыслу (`ease-out` — вход, `ease-in` — выход).",
        "**`@starting-style` и `allow-discrete`** для появления и исчезновения; запасной вариант — мгновенная смена.",
        "**Раскрытие блоков:** `grid-template-rows: 0fr → 1fr`.",
        "**`prefers-reduced-motion`:** отключайте движение, сохраняйте смену состояния.",
        "**Тестируйте детерминированно:** `getAnimations()` и `currentTime` вместо ожидания по таймеру.",
        "**Не прячьте смысл в анимации:** состояние должно быть понятно и без неё (атрибуты ARIA, текст).",
      ),
    ]),

    section("edge-cases", [
      h("Несколько изменений сразу"),
      p("Если за один пересчёт изменилось несколько свойств, для каждого из них создаётся собственный переход со своими параметрами. События `transitionend` приходят отдельно по каждому свойству."),
      h("Задержка и длительность ноль"),
      p("При `duration: 0s` переход не создаётся. Отрицательная задержка начинает переход «с середины»: удобна для синхронизации нескольких анимаций."),
      h("Переходы и `!important`/слои"),
      p("Переходы работают с вычисленными значениями, а не с источником: победитель каскада определяет значения «до» и «после». Переход, объявленный в более слабом слое, но не переопределённый, продолжает действовать."),
      h("Переходы и `@property`"),
      p("Пользовательские свойства интерполируются только после регистрации типа (`@property`). Без регистрации значение меняется скачком."),
      h("Переходы и CSS-переменные в целом"),
      p("Если переходит `background-color`, а значение задаётся переменной, переход сработает: интерполируется вычисленный цвет. Изменение самой переменной без регистрации перехода не создаёт, но создаёт его для свойств, чьё вычисленное значение изменилось."),
      h("Скрытые вкладки и фоновые окна"),
      p("В неактивной вкладке анимации замедляются или приостанавливаются; события `transitionend` могут прийти позже. Не используйте их для критичной логики (например, для удаления элемента без запасного таймера)."),
    ]),

    section("related", [
      ul(
        "[Ключевые кадры (@keyframes)](/learn/css/keyframes) — сложные и повторяющиеся анимации.",
        "[Трансформации](/learn/css/transforms) — `translate`, `rotate`, `scale`.",
        "[Производительность анимаций и движение](/learn/css/animation-performance-motion) — что можно анимировать дёшево.",
        "[Пользовательские свойства](/learn/css/custom-properties) — `@property` и анимация переменных.",
        "[Псевдоклассы и псевдоэлементы](/learn/css/pseudo-classes-elements) — `:hover`, `:focus-visible`.",
        "[Цвет](/learn/css/colors) — интерполяция цветов.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Всё сразу и JavaScript-измерения",
          code: `
            .card { transition: all 0.5s; }
            .panel { max-height: 0; overflow: hidden; transition: max-height 0.5s; }
            .panel.open { max-height: 999px; }          /* «достаточно большое» число */
            .toast { display: none; }                    /* исчезает мгновенно */
          `,
          note: "`all` анимирует лишнее; `max-height` даёт неверный тайминг; `display: none` не плавный; нет учёта `prefers-reduced-motion`.",
        },
        {
          title: "Точные свойства и современные приёмы",
          code: `
            .card { transition: transform 200ms ease-out, box-shadow 200ms ease-out; }
            .collapse { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 300ms ease; }
            .collapse.is-open { grid-template-rows: 1fr; }
            .toast { display: none; opacity: 0; transition: opacity 300ms, display 300ms allow-discrete; }
            @media (prefers-reduced-motion: reduce) { .card, .collapse, .toast { transition: none; } }
          `,
          note: "Перечисленные свойства, раскрытие по реальной высоте, плавное исчезновение и уважение к настройкам пользователя.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.transitions.ex1",
      title: "Предскажите значения",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("`opacity` меняется от 0 до 1 за 1000 мс. Определите примерное значение на 500 мс для `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`. Какую функцию выберете для появления всплывающей подсказки и почему?"),
      ],
      hints: ["Какая функция даёт самый быстрый старт?", "Какая симметрична относительно середины?"],
      checks: ["linear 0.50", "ease 0.80", "ease-in 0.32", "ease-out 0.69", "ease-in-out 0.50", "Для появления — ease-out"],
      solution: [
        p("Замер через Web Animations API: `linear` — 0.500, `ease` — 0.802, `ease-in` — 0.315, `ease-out` — 0.685, `ease-in-out` — 0.500. Для появления подсказки подходит `ease-out`: быстрое начало создаёт ощущение мгновенного отклика, затем движение замедляется. `ease-in` лучше для исчезновения."),
      ],
    }),
    exercise({
      id: "css.transitions.ex2",
      title: "Лишние анимации и «прыжки»",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("У карточки `transition: all 300ms`, на `:hover` меняются `transform`, `opacity` и случайно ещё и `width` (из-за правила в другом файле). Пользователи видят «плывущую» ширину. Исправьте и опишите, как проверить число анимаций."),
      ],
      starter: {
        lang: "css",
        code: `
          .card { transition: all 300ms; }
          .card:hover { transform: translateY(-2px); opacity: 1; }
        `,
      },
      hints: ["Какие свойства нужно анимировать?", "Как посмотреть список запущенных анимаций?"],
      checks: ["Явный список свойств", "`getAnimations()` в тесте", "Ширина мгновенная или не меняется"],
      solution: [
        code(
          "css",
          `
          .card { transition: transform 200ms ease-out, opacity 200ms ease-out; }
          `,
        ),
        p("Проверка: `el.getAnimations().map((a) => a.transitionProperty)` после наведения должен вернуть `[\"transform\", \"opacity\"]` без `width`. В замере `transition: all` для трёх изменившихся свойств создал три анимации, а `transition: opacity` — одну."),
      ],
    }),
    exercise({
      id: "css.transitions.ex3",
      title: "Раскрытие блока с высотой `auto`",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Блок `.panel` должен плавно раскрываться до высоты содержимого без JavaScript-измерений и без `max-height`. Напишите решение и объясните, чему равна высота первой строки на 0, 250 и 500 мс при линейном переходе 500 мс и содержимом 100px."),
      ],
      starter: {
        lang: "css",
        code: `
          .panel { height: 0; overflow: hidden; transition: height 300ms; }
          .panel.is-open { height: auto; }
        `,
      },
      hints: ["Что интерполируется между `0fr` и `1fr`?", "Какой элемент должен иметь `overflow: hidden`?"],
      checks: ["`grid-template-rows: 0fr → 1fr`", "`overflow: hidden` на внутреннем элементе", "0 / 25 / 100px"],
      solution: [
        code(
          "css",
          `
          .panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 500ms linear; }
          .panel.is-open { grid-template-rows: 1fr; }
          .panel > .inner { overflow: hidden; }
          `,
        ),
        p("Значения строки на 0 / 250 / 500 мс: `0px`, `25px`, `100px` (замер) — интерполируется доля свободного места (`fr`), а внутренний элемент с `overflow: hidden` обрезает содержимое. Исходный вариант `height: 0 → auto` перехода не создаёт (0 анимаций)."),
      ],
    }),
  ],

  challenge: {
    id: "css.transitions.challenge",
    title: "Детерминированный тест переходов: свойства, длительность и reduced motion",
    scenario: [
      p("В библиотеке компонентов разные люди писали `transition: all`, разные длительности и забывали про `prefers-reduced-motion`. Нужно описать переходы компонентов единообразно и написать тест, который через Web Animations API проверяет **какие свойства анимируются, сколько это длится и что при `reduce` анимаций нет**."),
    ],
    requirements: [
      "Кнопка: переходит только `background-color` и `transform`, не более 200 мс",
      "Аккордеон: `grid-template-rows` 0fr → 1fr, не более 300 мс",
      "Для `prefers-reduced-motion: reduce` переходов нет",
      "Тест: после переключения состояния `getAnimations()` содержит только ожидаемые свойства и длительности",
      "Тест: значение на середине перехода строго между начальным и конечным (детерминированно через `currentTime`)",
    ],
    constraints: [
      "Нельзя использовать `transition: all`",
      "Нельзя использовать `setTimeout` для проверки значений в середине перехода",
    ],
    acceptance: [
      "Кнопка при наведении создаёт 2 анимации: `background-color` и `transform`",
      "Аккордеон создаёт 1 анимацию `grid-template-rows` длительностью ≤ 300 мс",
      "На 50% перехода строка аккордеона равна 25px для содержимого 100px (замер в Chromium; нелинейный рост)",
      "С `reducedMotion: reduce` анимаций 0",
    ],
    hints: [
      "Как получить список переходов элемента?",
      "Как зафиксировать время анимации на середине?",
      "Как включить `reduce` в тесте?",
    ],
    solution: [
      code(
        "css",
        `
        .btn { background: rgb(47, 61, 154); transition: background-color 200ms ease-out, transform 150ms ease-out; }
        .btn:hover, .btn.is-hover { background: rgb(57, 73, 171); transform: translateY(-2px); }

        .collapse { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 300ms linear; }
        .collapse.is-open { grid-template-rows: 1fr; }
        .collapse > .inner { overflow: hidden; }

        @media (prefers-reduced-motion: reduce) { .btn, .collapse { transition: none; } }
        `,
        { filename: "transitions.css", lineNumbers: true },
      ),
      code(
        "js",
        `
        const list = (sel) => page.evaluate((s) => {
          const el = document.querySelector(s);
          getComputedStyle(el).opacity;                              // зафиксировать «до»
          el.classList.add(s === ".btn" ? "is-hover" : "is-open");
          return el.getAnimations().map((a) => [a.transitionProperty, a.effect.getTiming().duration]);
        }, sel);

        console.log("кнопка:", JSON.stringify(await list(".btn")));        // [["background-color",200],["transform",150]]
        console.log("аккордеон:", JSON.stringify(await list(".collapse"))); // [["grid-template-rows",300]]

        // середина перехода детерминированно
        const mid = await page.evaluate(() => {
          const el = document.querySelector(".collapse");
          const a = el.getAnimations()[0];
          a.pause(); a.currentTime = 150;
          return getComputedStyle(el).gridTemplateRows;                  // "25px" для содержимого 100px (Chromium)
        });
        console.log("50%:", mid);

        // reduced motion
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.evaluate(() => document.querySelector(".collapse").classList.remove("is-open"));
        const count = await page.evaluate(() => { const el = document.querySelector(".collapse"); getComputedStyle(el).opacity; el.classList.add("is-open"); return el.getAnimations().length; });
        console.log("reduce:", count);                                      // 0
        `,
        { filename: "transitions.test.js" },
      ),
      ul(
        "**Свойства и длительности** читаются из `getAnimations()`: `transitionProperty` и `effect.getTiming().duration` — детерминированно, без ожидания.",
        "**Середина перехода:** `pause()` и `currentTime = 150` фиксируют кадр; значение не зависит от скорости машины.",
        "**Reduced motion:** `emulateMedia({ reducedMotion: \"reduce\" })` и проверка, что анимаций нет.",
        "**Запрет `all`:** тест падает, если появляется неожиданное свойство в списке.",
      ),
    ],
  },

  interview: [
    iq("css.transitions.i1", "basic", "Как работает CSS-переход и когда он запускается?", [
      p("Когда вычисленное значение свойства из `transition-property` меняется между двумя пересчётами стилей, браузер плавно проводит значение от старого к новому за `duration` с заданной функцией времени. При первой отрисовке «до» нет, поэтому перехода нет; для появления элементов используют `@starting-style`."),
    ]),
    iq("css.transitions.i2", "basic", "Почему `transition: all` — плохая идея?", [
      p("Анимируются все изменившиеся свойства, включая случайные и дорогие (в замере три свойства — три анимации и три `transitionend`). Это вызывает лишние перерасчёты и непредсказуемое поведение. Перечисляйте нужные свойства явно."),
    ]),
    iq("css.transitions.i3", "intermediate", "Как плавно скрыть элемент, который потом получает `display: none`?", [
      p("`transition: opacity 300ms, display 300ms allow-discrete` и итоговое `display: none; opacity: 0`: `display` переключится в конце перехода (в замере `block` на 499 мс и `none` на 500 мс), поэтому `opacity` успеет плавно дойти до нуля. Запасной вариант — мгновенное исчезновение."),
    ]),
    iq("css.transitions.i4", "intermediate", "Как анимировать высоту `auto`?", [
      ul(
        "`grid-template-rows: 0fr → 1fr` на контейнере и `overflow: hidden` на внутреннем элементе (замер: 0 / 25 / 100px на 0 / 250 / 500 мс).",
        "`interpolate-size: allow-keywords` (где поддерживается) делает `height: 0 → auto` анимируемым.",
        "Не использовать `max-height: 999px`: тайминг не соответствует реальной высоте.",
      ),
    ]),
    iq("css.transitions.i5", "intermediate", "Что произойдёт, если прервать переход на середине?", [
      p("Создаётся новый переход от текущего значения к новому. Длительность обратного перехода укорачивается пропорционально пройденному пути: в замере при отмене на значении 0.4 из 1000 мс новый переход начал с 0.4 и длился 400 мс."),
    ]),
    iq("css.transitions.i6", "advanced", "Какие свойства не интерполируются переходами и что с ними делать?", [
      ul(
        "`height: auto`, `display`, градиенты `background-image` — не интерполируются обычным образом (замеры: 0 анимаций).",
        "`display` и `content-visibility` можно переключать с `allow-discrete`; `visibility` переключается скачком в конце (при уходе) или сразу (при появлении).",
        "Для градиентов — анимировать `opacity` слоя, `background-position` или зарегистрированную переменную.",
      ),
    ]),
    iq("css.transitions.i7", "engineering", "Как тестировать переходы без нестабильных таймеров?", [
      ul(
        "Читать `el.getAnimations()`: свойства, `effect.getTiming()`, `currentTime`.",
        "Ставить анимацию на паузу и задавать `currentTime`, чтобы получить значение в нужный момент детерминированно.",
        "Проверять `prefers-reduced-motion` эмуляцией и числом анимаций.",
        "Запрещать `transition: all` линтером и тестом списка свойств.",
      ),
    ]),
    iq("css.transitions.i8", "debugging", "Переход «не работает». Что проверите?", [
      ul(
        "Есть ли свойство в `transition-property` и ненулевая `duration`.",
        "Меняется ли вычисленное значение и интерполируется ли свойство (`auto`, `display`, градиенты — нет).",
        "Не появляется ли элемент впервые (нужен `@starting-style`).",
        "Не стоит ли `transition` только в `:hover` (обратный ход мгновенный).",
        "Не включено ли `prefers-reduced-motion: reduce` и не переопределён ли переход слоем или более специфичным правилом.",
      ),
    ]),
  ],

  exam: [
    mcq("css.transitions.e1", "foundation", "Что означает `transition: opacity 300ms ease-out 100ms`?", ["Задержка 300 мс, длительность 100 мс", "Длительность 100 мс, функция `ease-out`", "Длительность 300 мс, задержка 100 мс", "Два перехода"], 2, "В сокращении первое время — длительность, второе — задержка."),
    mcq("css.transitions.e2", "foundation", "Какая функция времени даёт самый медленный старт?", ["`ease-in`", "`ease-out`", "`linear`", "`ease`"], 0, "`ease-in` начинается медленно и ускоряется: на 50% времени прогресс 0.32 против 0.50 у `linear`."),
    mcq("css.transitions.e3", "intermediate", "Элемент появляется из `display: none` в `block` без `@starting-style`. Что произойдёт с `transition: opacity`?", ["Плавное появление", "Появление за 1 секунду", "Ошибка", "Переход не запустится"], 3, "У элемента нет «до»: переход не создаётся (замер: 0 анимаций)."),
    mcq("css.transitions.e4", "intermediate", "Что делает `transition-behavior: allow-discrete` для `display`?", ["Ускоряет анимацию", "Откладывает переключение `display` до конца перехода", "Отключает переход", "Делает `display` плавным"], 1, "Дискретные значения не интерполируются: `display` переключается в конце перехода (замер: `block` до 499 мс, `none` на 500)."),
    mcq("css.transitions.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`height: 0 → auto` анимируется без дополнительных приёмов", "`grid-template-rows: 0fr → 1fr` анимируется", "`transition: all` создаёт отдельную анимацию на каждое изменившееся свойство", "Переход при первой отрисовке запускается всегда"], [1, 2], "`auto` не интерполируется, а при первой отрисовке нет значения «до»."),
    mcq("css.transitions.e6", "advanced", "Переход 1000 мс прервали на значении 0.4. Какой будет длительность обратного перехода?", ["1000 мс", "600 мс", "0 мс", "400 мс"], 3, "Обратный переход укорачивается пропорционально пройденному пути: в замере он длился 400 мс и стартовал с 0.4."),
    open("css.transitions.e7", "intermediate", "Объясните, как сделать плавное появление и исчезновение уведомления и что делать в браузерах без поддержки.", [
      ul(
        "`display: none; opacity: 0` по умолчанию; в открытом состоянии `display: block; opacity: 1`.",
        "`transition: opacity 300ms, display 300ms allow-discrete` и `@starting-style` для начального состояния.",
        "Запасной вариант: мгновенное появление и исчезновение; плюс `prefers-reduced-motion`.",
      ),
    ], ["Описаны `allow-discrete` и `@starting-style`", "Указан запасной вариант", "Учтён reduced motion"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.transitions.m1", "intermediate", "Содержимое 100px, `grid-template-rows: 0fr → 1fr` за 500 мс линейно. Какая высота строки на 250 мс в Chromium?", ["0px", "50px", "25px", "100px"], 2, "Замер дал 25px: интерполируется значение `fr`, а высота растёт нелинейно (1 / 6.25 / 25 / 56.25 / 81px на 10 / 25 / 50 / 75 / 90% времени)."),
    mcq("css.transitions.m2", "advanced", "Какую анимацию создаст изменение фона с `linear-gradient(red, red)` на `linear-gradient(blue, blue)` при `transition: background-image 1s`?", ["Плавную смену цвета", "Ни одной (переход не создаётся)", "Дискретное переключение на середине", "Ошибку"], 1, "Градиенты в переходах не интерполируются: в замере анимаций 0."),
    mcq("css.transitions.m3", "advanced", "Как правильно проверить значение в середине перехода в тесте?", ["`getAnimations()[0].pause(); currentTime = 150`", "`setTimeout(..., 150)`", "`await sleep(100)`", "Нельзя"], 0, "Фиксация `currentTime` даёт детерминированное значение независимо от скорости машины."),
    open("css.transitions.m4", "advanced", "Спроектируйте систему переходов в дизайн-системе: токены, правила, тесты, доступность.", [
      ul(
        "Токены длительностей и функций времени (`--duration-fast`, `--ease-out`), переходы по свойствам.",
        "Правила: запрет `transition: all`, раскрытие через `grid-template-rows`, появление через `@starting-style`.",
        "Доступность: `prefers-reduced-motion`, состояния в ARIA, анимация не несёт смысл.",
        "Тесты: `getAnimations()`, детерминированные кадры, проверка reduce и отсутствие неожиданных свойств.",
      ),
    ], ["Токены и правила", "Доступность", "Тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.transitions.f1", front: "Когда запускается переход?", back: "При изменении вычисленного значения свойства из `transition-property`; при первой отрисовке — нет (`@starting-style`)." },
    { id: "css.transitions.f2", front: "Сокращение `transition`?", back: "`свойство длительность функция задержка`; первое время — длительность." },
    { id: "css.transitions.f3", front: "Появление и исчезновение?", back: "`display ... allow-discrete` + `@starting-style`; запасной — мгновенно." },
    { id: "css.transitions.f4", front: "Высота `auto`?", back: "`grid-template-rows: 0fr → 1fr` или `interpolate-size: allow-keywords`." },
    { id: "css.transitions.f5", front: "`transition: all`?", back: "Анимирует всё изменившееся: лишние анимации и перерасчёты." },
    { id: "css.transitions.f6", front: "Тест перехода?", back: "`getAnimations()`, `pause()`, `currentTime` — детерминированно." },
  ],

  sources: [
    { title: "CSS Transitions Level 1", url: "https://www.w3.org/TR/css-transitions-1/", publisher: "W3C" },
    { title: "CSS Transitions Level 2 (@starting-style, transition-behavior)", url: "https://www.w3.org/TR/css-transitions-2/", publisher: "W3C" },
    { title: "CSS Easing Functions Level 1", url: "https://www.w3.org/TR/css-easing-1/", publisher: "W3C" },
    { title: "MDN: Using CSS transitions", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions", publisher: "MDN" },
    { title: "MDN: @starting-style", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style", publisher: "MDN" },
    { title: "MDN: transition-behavior", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior", publisher: "MDN" },
    { title: "MDN: prefers-reduced-motion", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion", publisher: "MDN" },
    { title: "WCAG 2.2: Animation from Interactions", url: "https://www.w3.org/TR/WCAG22/#animation-from-interactions", publisher: "W3C" },
  ],
};
