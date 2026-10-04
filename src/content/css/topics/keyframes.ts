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

export const keyframes: Topic = {
  id: "css.keyframes",
  slug: "keyframes",
  domain: "css",
  module: "animation",
  title: "Ключевые кадры: @keyframes и animation",
  titleEn: "CSS keyframe animations: @keyframes, animation shorthand, fill-mode, direction, iteration, events, scroll-driven animations",
  summary:
    "`@keyframes` описывает последовательность состояний, а свойство `animation` запускает её без участия пользователя: с задержкой, повторами, возвратом и заливкой до и после. Тема разбирает синтаксис и порядок значений в сокращении, четыре режима `animation-fill-mode` и четыре направления (замеры значений в нужные моменты времени), неявные ключевые кадры, функции времени внутри кадров, место анимации в каскаде (перебивает обычные значения, но проигрывает `!important`), события, паузу и управление из JavaScript, анимации, привязанные к прокрутке, и тестирование через Web Animations API.",
  minutes: 55,
  prerequisites: ["css.transitions", "css.cascade"],
  tags: ["@keyframes", "animation", "animation-fill-mode", "animation-direction", "animation-iteration-count", "animation-play-state", "animation-delay", "animationend", "scroll-driven animations", "animation-timeline", "Web Animations API", "prefers-reduced-motion"],
  keyConcepts: [
    { term: "Переход — две точки, кадры — сценарий", text: "`@keyframes` задаёт любое число состояний по процентам времени. Анимация запускается сама (при появлении элемента или смене `animation-name`), а не в ответ на изменение значения." },
    { term: "Заливка решает, что до и после", text: "По умолчанию вне активной фазы анимация ничего не меняет. `backwards` применяет первый кадр в период задержки, `forwards` оставляет последний кадр после конца, `both` — и то и другое (замер: при `none` на 1500 мс значение вернулось к исходному 0.5, при `forwards` осталось 1)." },
    { term: "Направление и повторы", text: "`animation-iteration-count` задаёт число проходов (или `infinite`), `animation-direction` — порядок: `alternate` на чётных проходах идёт назад. На трёх проходах `alternate` даёт 0.25 → 0.75 → 0.75 → 0.25 → 0.25 → 0.75 в точках 250/750/1250/…" },
    { term: "Место в каскаде", text: "Значение из анимации сильнее обычных объявлений автора (замер: `forwards` перекрасило элемент), но слабее `!important`: правило с `!important` анимацию не пропускает." },
    { term: "Движение — это право пользователя", text: "Бесконечные и крупные анимации нужно отключать при `prefers-reduced-motion: reduce`. Критически важная информация не должна существовать только внутри анимации." },
  ],
  sections: [
    section("definition", [
      def("`@keyframes`", "At-правило, задающее именованную последовательность ключевых кадров: состояний свойств в определённые моменты времени (в процентах от длительности). Браузер интерполирует значения между кадрами.", "@keyframes"),
      def("Анимация (`animation`)", "Применение набора ключевых кадров к элементу: имя, длительность, функция времени, задержка, число повторов, направление, режим заливки, состояние воспроизведения.", "CSS animation"),
      def("Режим заливки", "Свойство `animation-fill-mode`: определяет, какие значения анимация задаёт **до** начала (в период задержки) и **после** окончания.", "animation-fill-mode"),
      def("Неявный ключевой кадр", "Если в `@keyframes` нет кадра `0%`/`from` или `100%`/`to`, браузер подставляет значение свойства из обычных стилей элемента.", "implicit keyframe"),
      def("Анимация, привязанная к прокрутке", "Анимация, прогресс которой определяется положением прокрутки (`animation-timeline: scroll()` или `view()`), а не временем.", "scroll-driven animation"),
    ]),

    section("why", [
      h("Когда нужны ключевые кадры"),
      ul(
        "**Само запускающиеся анимации:** появление страницы, индикатор загрузки, привлечение внимания.",
        "**Многошаговые сценарии:** пульсация, тряска, пружина, «печать» текста.",
        "**Повторение:** бесконечный спиннер, мерцающий скелетон.",
        "**Привязка к прокрутке:** индикатор чтения, появление блоков при прокрутке.",
        "**Независимость от JavaScript:** анимация идёт сама, а нагрузку на основной поток можно минимизировать.",
      ),
      h("Чем отличаются от переходов"),
      p("Переход — реакция на **изменение** значения между двумя точками. Ключевые кадры задают **траекторию из любого числа точек** и могут запускаться без изменений состояния: достаточно, чтобы элемент появился или получил `animation-name`."),
      insight("Выбор: ответ на состояние (hover, класс) — переход; сценарий, цикл или многошаговое движение — `@keyframes`."),
    ]),

    section("mental-model", [
      p("Представьте **раскадровку мультфильма**. Вы рисуете ключевые кадры («здесь персонаж спрятан», «здесь он выпрыгнул», «здесь стоит»), а браузер дорисовывает промежуточные. Свойство `animation` — это режиссёрская пометка: когда начинать, сколько длится, сколько раз повторять, играть ли в обратную сторону и что показывать до начала и после конца."),
      diagram(
        `
        @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
        .a { opacity: 0.5; animation: fade 1000ms linear 500ms 1 normal <fill-mode>; }

        время →   0         500                1500          2000
                  |--delay--|-----активная-----|---после-----|
        none      0.5       0 ........... 1     0.5            ← до/после — исходное 0.5
        backwards 0   (первый кадр) 0 ..... 1  0.5
        forwards  0.5       0 ........... 1     1  (последний кадр остаётся)
        both      0         0 ........... 1     1
        `,
        "Что показывает анимация до, во время и после",
      ),
      table(
        ["`fill-mode`", "В период задержки", "После окончания", "Значения (0 / 499 / 500 / 1500 / 2000 мс)"],
        [
          ["`none`", "исходное значение (0.5)", "исходное (0.5)", "0.5 / 0.5 / 0 / 0.5 / 0.5"],
          ["`backwards`", "первый кадр (0)", "исходное", "0 / 0 / 0 / 0.5 / 0.5"],
          ["`forwards`", "исходное", "последний кадр (1)", "0.5 / 0.5 / 0 / 1 / 1"],
          ["`both`", "первый кадр", "последний кадр", "0 / 0 / 0 / 1 / 1"],
        ],
        "Замер: opacity в базовых стилях 0.5, анимация 0 → 1 за 1000 мс с задержкой 500 мс",
      ),
    ]),

    section("technical", [
      h("Объявление и запуск"),
      code(
        "css",
        `
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.08); }
        }

        .badge {
          animation: pulse 1.2s ease-in-out infinite;
        }
        `,
        { filename: "keyframes-basic.css" },
      ),
      ul(
        "Ключевые кадры задают в процентах от длительности; `from` = `0%`, `to` = `100%`. Несколько селекторов через запятую (`0%, 100%`) делят одно состояние.",
        "Свойства внутри кадров должны быть анимируемыми (см. тему про переходы); дискретные меняются скачком в середине сегмента.",
        "Имя анимации — идентификатор; если определено несколько `@keyframes` с одним именем, действует последнее по порядку.",
      ),
      h("Сокращение `animation`"),
      code(
        "css",
        `
        .a {
          animation: spin 2s linear infinite;
          /* имя  длительность  функция  повторы */
        }

        .b {
          animation: fade 1s ease-out 2s 1 normal both running;
          /*  имя  длительность функция задержка повторы направление заливка состояние */
        }

        .c { animation: a 1s, b 2s 500ms; }       /* несколько анимаций */
        `,
        { filename: "animation-shorthand.css" },
      ),
      p("Замер сокращений: `animation: spin 2s linear infinite` → имя `spin`, длительность `2s`, функция `linear`, задержка `0s`, повторы `infinite`. Для `animation: 1s 2s fade` получилось: длительность `1s`, задержка `2s`, функция по умолчанию `ease`, один повтор. Первое время в сокращении — длительность, второе — задержка. Для читаемости сложные анимации задают развёрнутыми свойствами."),
      h("Заливка, повторы и направление: замеры"),
      p("Анимация `fade` (0 → 1) за 1000 мс линейно, три прохода. Значение `opacity` в моменты 250 / 750 / 1250 / 1750 / 2250 / 2750 мс:"),
      table(
        ["`animation-direction`", "Значения", "Что происходит"],
        [
          ["`normal`", "0.25, 0.75, 0.25, 0.75, 0.25, 0.75", "Каждый проход заново с 0 до 1"],
          ["`reverse`", "0.75, 0.25, 0.75, 0.25, 0.75, 0.25", "Каждый проход от 1 к 0"],
          ["`alternate`", "0.25, 0.75, 0.75, 0.25, 0.25, 0.75", "Нечётные проходы вперёд, чётные назад"],
          ["`alternate-reverse`", "0.75, 0.25, 0.25, 0.75, 0.75, 0.25", "Первый проход назад, затем чередование"],
        ],
        "Направления",
      ),
      p("`animation-iteration-count` принимает число (в том числе дробное, например `1.5`) или `infinite`. События: `animationstart`, `animationiteration` (между проходами — в замере 3 прохода дали два события `animationiteration`) и `animationend`."),
      h("Функции времени внутри кадров"),
      code(
        "css",
        `
        @keyframes bounce {
          0%   { transform: translateY(0);     animation-timing-function: ease-out; }
          50%  { transform: translateY(-1rem); animation-timing-function: ease-in; }
          100% { transform: translateY(0); }
        }
        .ball { animation: bounce 600ms infinite; }
        `,
        { filename: "keyframe-easing.css" },
      ),
      p("`animation-timing-function` в кадре действует на сегмент **от этого кадра до следующего**. Замер для `0%` (`ease-in`), `50%` (`linear`) и `animation-timing-function: ease-out` на правиле: значения opacity на 125 / 250 мс первого сегмента — 0.093 и 0.315 (кривая `ease-in`), а на 750 и 875 мс второго — 0.5 и 0.25 (линейно)."),
      h("Неявный начальный кадр"),
      p("Если нет `from`, используется значение из обычных стилей: для `@keyframes up { to { opacity: 1 } }` и базового `opacity: 0.4` в замере значения были 0.4 / 0.7 / 1 на 0 / 500 / 1000 мс. Это удобно для анимаций, зависящих от состояния элемента."),
      h("Анимация в каскаде"),
      code(
        "css",
        `
        @keyframes c { to { color: blue; } }

        .a { color: red; animation: c 1s forwards; }              /* после конца: синий */
        .b { color: red !important; animation: c 1s forwards; }   /* !important сильнее анимации: остаётся красным */
        `,
        { filename: "animation-cascade.css" },
      ),
      p("Замер: после завершения `forwards` обычное `color: red` проиграло анимации (синий), а `color: red !important` — выиграло у неё (красный). Значения из анимаций сильнее обычных автора и слабее важных (по спецификации — слой между ними). Отсюда практический вывод: `!important` у анимируемого свойства «замораживает» его — это источник странных багов."),
      h("Управление воспроизведением"),
      code(
        "css",
        `
        .spinner { animation: spin 1s linear infinite; }
        .spinner.is-paused { animation-play-state: paused; }
        `,
        { filename: "play-state.css" },
      ),
      code(
        "js",
        `
        const el = document.querySelector(".spinner");

        el.addEventListener("animationiteration", () => { /* конец очередного оборота */ });
        el.addEventListener("animationend", () => { /* конец всей анимации */ });

        // Web Animations API
        const [anim] = el.getAnimations();
        anim.pause();
        anim.currentTime = 500;     // перемотать
        anim.play();
        `,
        { filename: "animation-control.js" },
      ),
      p("Замер: `animation: fade … paused` дал `playState = \"paused\"`. `getAnimations()` возвращает `CSSAnimation` — объект Web Animations API с `pause()`, `play()`, `finish()`, `currentTime` и `effect.getTiming()`."),
      h("Анимации, привязанные к прокрутке"),
      code(
        "css",
        `
        @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        @supports (animation-timeline: scroll()) {
          .progress {
            position: fixed; inset: 0 0 auto 0; block-size: 4px; background: #2f3d9a;
            transform-origin: 0 50%;
            animation: grow linear both;
            animation-timeline: scroll(root block);   /* прогресс = прокрутка страницы */
          }
        }
        `,
        { filename: "scroll-driven.css" },
      ),
      p("Замер: на странице высотой 3000px (окно 800px) значение `transform` полоски на прокрутке 0 / 1100 / 2200 было `scaleX(0)` / `scaleX(0.5)` / `scaleX(1)`. Привязка к прокрутке поддерживается не всеми браузерами одинаково: используйте `@supports`, а без неё элемент должен выглядеть нормально (прогресс-бар просто отсутствует). `animation-timeline: view()` привязывает прогресс к появлению элемента в окне."),
      h("Доступность: движение и мигание"),
      code(
        "css",
        `
        @media (prefers-reduced-motion: reduce) {
          .spinner, .pulse, .shimmer { animation: none; }
          .enter { animation-duration: 0.01ms; animation-iteration-count: 1; }
        }
        `,
        { filename: "keyframes-reduced-motion.css" },
      ),
      ul(
        "При `prefers-reduced-motion: reduce` отключайте движение: бесконечные циклы, параллакс, крупные смещения и масштабирование. Если нужно сохранить конечное состояние, оставьте `animation-fill-mode: forwards` с минимальной длительностью.",
        "Мигание чаще трёх раз в секунду может вызвать приступы (WCAG 2.3.1): не используйте быстро мигающие анимации.",
        "Анимация, которая длится дольше 5 секунд и запускается сама, должна быть останавливаемой (WCAG 2.2.2).",
      ),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        @keyframes enter {
          from { opacity: 0; transform: translateY(0.75rem); }
          to   { opacity: 1; transform: none; }
        }

        .card {
          animation: enter 400ms ease-out both;
          animation-delay: calc(var(--i, 0) * 80ms);
        }

        @media (prefers-reduced-motion: reduce) {
          .card { animation: none; }
        }
        `,
        [
          { line: [1, 4], text: "Два кадра: появление снизу с нарастанием непрозрачности. `from`/`to` — то же, что `0%`/`100%`." },
          { line: 7, text: "`both`: пока длится задержка, показывается первый кадр (скрыто), а после конца остаётся последний кадр (видимо)." },
          { line: 8, text: "Ступенчатая задержка по индексу элемента: карточки появляются волной." },
          { line: [11, 13], text: "Для пользователей с `reduce` анимации нет: карточки видны сразу в обычном состоянии." },
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
        <title>@keyframes</title>
        <style>
          body { margin: 0; padding: 1rem; font: 16px/1.5 system-ui, sans-serif; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
          .row { display: flex; gap: 2rem; align-items: center; margin-bottom: 1rem; }
          .spinner { inline-size: 2.5rem; block-size: 2.5rem; border: 4px solid #c5cae9; border-top-color: #2f3d9a; border-radius: 50%; animation: spin 1s linear infinite; }
          .dot { inline-size: 1.5rem; block-size: 1.5rem; background: #b3261e; border-radius: 50%; animation: pulse 1.2s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) { .spinner, .dot { animation: none; } }
        </style>
        <div class="row"><div class="spinner" role="status" aria-label="Загрузка"></div><div class="dot" aria-hidden="true"></div></div>
        <button id="b" type="button">Пауза</button>
        <script>
          const b = document.getElementById("b");
          let paused = false;
          b.addEventListener("click", () => {
            paused = !paused;
            document.querySelectorAll(".spinner, .dot").forEach((e) => { e.style.animationPlayState = paused ? "paused" : "running"; });
            b.textContent = paused ? "Продолжить" : "Пауза";
          });
        </script>
        </html>
        `,
        { filename: "keyframes-basics.html", runnable: true },
      ),
      p("Спиннер крутится равномерно (`linear`), а точка пульсирует с плавным замедлением на краях (`ease-in-out`). Кнопка ставит анимацию на паузу через `animation-play-state`."),
    ]),

    section("detailed-example", [
      p("Страница с четырьмя видами анимаций: появление карточек волной (`both` + ступенчатая задержка), «скелетон» с мерцанием, индикатор чтения, привязанный к прокрутке, и колокольчик, который «звонит» несколько раз и останавливается. Все анимации отключаются при `prefers-reduced-motion: reduce`, а индикатор чтения включается только при поддержке `animation-timeline`."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Анимации на ключевых кадрах</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; padding: 1rem; font: 1rem/1.5 system-ui, sans-serif; color: #1b1b1f; background: #f4f5fb; }
          main { max-inline-size: 40rem; margin-inline: auto; }
          h1 { margin-top: 0; }

          @keyframes enter { from { opacity: 0; transform: translateY(0.75rem); } to { opacity: 1; transform: none; } }
          @keyframes shimmer { from { background-position: 150% 0; } to { background-position: -50% 0; } }
          @keyframes ring { 0%, 100% { transform: rotate(0); } 15% { transform: rotate(14deg); } 30% { transform: rotate(-12deg); } 45% { transform: rotate(8deg); } 60% { transform: rotate(-6deg); } 75% { transform: rotate(0); } }
          @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

          .card { padding: 1rem; margin-block-end: 0.75rem; background: #fff; border-radius: 0.5rem; animation: enter 400ms ease-out both; animation-delay: calc(var(--i) * 80ms); }
          .skeleton { block-size: 1rem; margin-block-end: 0.5rem; border-radius: 0.25rem; background: linear-gradient(90deg, #e0e3f3 25%, #f4f5fb 50%, #e0e3f3 75%) 150% 0 / 200% 100%; animation: shimmer 1.4s linear infinite; }
          .bell { display: inline-block; font-size: 1.5rem; transform-origin: 50% 0; animation: ring 1s ease-in-out 3; }

          @supports (animation-timeline: scroll()) {
            .progress { position: fixed; inset: 0 0 auto 0; block-size: 4px; background: #2f3d9a; transform-origin: 0 50%; animation: grow linear both; animation-timeline: scroll(root block); }
          }

          .filler { block-size: 60rem; }

          @media (prefers-reduced-motion: reduce) {
            .card, .skeleton, .bell, .progress { animation: none; }
          }
        </style>
        <div class="progress" aria-hidden="true"></div>
        <main>
          <h1>Анимации на ключевых кадрах <span class="bell" aria-hidden="true">🔔</span></h1>
          <section class="card" style="--i: 0"><h2>Появление</h2><p>Карточки появляются волной: <code>both</code> и ступенчатая задержка.</p></section>
          <section class="card" style="--i: 1"><h2>Скелетон</h2><div class="skeleton"></div><div class="skeleton" style="inline-size: 70%"></div></section>
          <section class="card" style="--i: 2"><h2>Индикатор чтения</h2><p>Прокрутите страницу: полоса сверху растёт вместе с прокруткой (если браузер поддерживает привязку к прокрутке).</p></section>
          <div class="filler"></div>
        </main>
        </html>
        `,
        { filename: "keyframes-demo.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает"],
        [
          ["`animation: enter 400ms ease-out both` + `animation-delay: calc(var(--i) * 80ms)`", "Карточки появляются волной; `both` скрывает их в период задержки и оставляет видимыми после"],
          ["`@keyframes shimmer` на `background-position`", "Бесконечное мерцание фона; свойство не влияет на раскладку, но перерисовывает область"],
          ["`animation: ring 1s ease-in-out 3`", "Три «звонка» и остановка: конечное число повторов вместо `infinite`"],
          ["`@supports (animation-timeline: scroll())`", "Индикатор чтения включается только там, где привязка к прокрутке поддерживается"],
          ["`@media (prefers-reduced-motion: reduce)`", "Отключает все анимации; контент остаётся доступным"],
          ["`aria-hidden=\"true\"` на декоративных элементах", "Анимация не должна быть единственным носителем смысла"],
        ],
        "Как устроена страница",
      ),
      ul(
        "Движение сведено к `transform` и `opacity`, кроме мерцания фона: оно дешёвое, но использует перерисовку.",
        "Бесконечная анимация только у скелетона — он исчезнет, когда загрузятся данные; колокольчик останавливается сам.",
        "Если `animation-timeline` не поддерживается, индикатор просто отсутствует: страница остаётся полноценной.",
      ),
    ]),

    section("internals", [
      h("Как браузер запускает и считает анимацию"),
      steps(
        [
          ["Назначение", "При разборе стилей элемента определяется `animation-name`. Если для имени есть `@keyframes` и длительность больше нуля, создаётся `CSSAnimation`. Новая анимация запускается при первом назначении имени или при его изменении."],
          ["Построение эффекта", "Ключевые кадры сортируются по смещению. Для отсутствующих `0%`/`100%` подставляются значения из вычисленных стилей элемента (неявные кадры)."],
          ["Расчёт фазы", "Для текущего времени вычисляются: фаза (до/активная/после), номер прохода, направление и прогресс в проходе, функция времени сегмента."],
          ["Применение значения", "Значения анимируемых свойств подставляются в каскад в слое анимаций: сильнее обычных объявлений, слабее `!important`. Заливка определяет, действует ли анимация вне активной фазы."],
          ["События", "`animationstart`, `animationiteration`, `animationend` и `animationcancel` генерируются при смене фаз. Для `infinite` события `end` не будет."],
        ],
        "Жизненный цикл анимации",
      ),
      h("Перезапуск анимации"),
      p("Анимация запускается заново, если изменилось `animation-name` (или она была снята и назначена снова). Простое переключение класса, в котором то же имя, анимацию не перезапускает. Приёмы: назначить `animation: none`, принудительно пересчитать стили и вернуть имя, либо использовать Web Animations API (`el.animate(...)`, `anim.currentTime = 0`)."),
      h("Тестирование"),
      code(
        "js",
        `
        const el = document.querySelector(".card");
        const [anim] = el.getAnimations();

        console.log(anim.animationName, anim.effect.getTiming());   // имя, длительность, fill, direction, iterations
        anim.pause();
        anim.currentTime = 200;                                      // детерминированный кадр
        console.log(getComputedStyle(el).opacity);
        `,
        { filename: "animation-test.js" },
      ),
      note("Для тестов не используйте ожидание по таймеру: пауза и установка `currentTime` дают воспроизводимые значения. Сравнивать нужно значения в ключевых точках (начало, середина, конец) и режим заливки."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Элемент «прыгает» после конца анимации"),
      wrongRight(
        "css",
        {
          code: `
            .card { opacity: 0; animation: fade 500ms; }      /* после конца: снова opacity: 0 */
          `,
          note: "По умолчанию заливки после конца нет: элемент возвращается к обычным стилям (`opacity: 0`) и исчезает.",
        },
        {
          code: `
            .card { opacity: 0; animation: fade 500ms forwards; }
            /* или: базовый стиль — конечное состояние, анимация идёт из from */
            .card { animation: appear 500ms backwards; }
          `,
          note: "`forwards` оставляет последний кадр; лучше сделать обычное состояние конечным и использовать `backwards` для начального.",
        },
      ),
      h("Ошибка 2. Задержка без `backwards`"),
      p("В период задержки элемент показывается в обычном состоянии, а не в первом кадре: карточка видна, затем «мигает» в скрытый вид и появляется. `both` или `backwards` применяют первый кадр сразу."),
      h("Ошибка 3. `!important` у анимируемого свойства"),
      p("`color: red !important` сильнее анимации: она не меняет цвет (замер: красный остался). Анимируемые свойства не должны быть важными."),
      h("Ошибка 4. Бесконечные анимации без остановки"),
      p("Вечный спиннер, мерцание и параллакс отвлекают и утомляют. Ограничивайте число повторов, давайте кнопку паузы, отключайте при `prefers-reduced-motion: reduce`."),
      h("Ошибка 5. Анимация свойств раскладки"),
      p("`width`, `height`, `top`, `left`, `margin` в `@keyframes` вызывают перерасчёт раскладки на каждом кадре. Для движения используйте `transform`, для появления — `opacity`."),
      h("Ошибка 6. Опечатка в имени анимации"),
      p("Если `animation-name` не совпадает с `@keyframes`, анимации просто нет — без ошибки. Проверяйте `el.getAnimations().length` и имена."),
      h("Ошибка 7. Анимация как единственный носитель смысла"),
      p("Если сообщение об ошибке «показывается» только как тряска поля, пользователи с `reduce` или скринридером его не заметят. Добавляйте текст и роли (`role=\"alert\"`)."),
      h("Ошибка 8. Забытый перезапуск"),
      p("Повторное добавление класса с тем же `animation-name` не перезапускает анимацию. Используйте Web Animations API или принудительную смену имени."),
    ]),

    section("antipatterns", [
      ul(
        "**`animation: ... infinite` для всего декоративного** — нагрузка и отвлечение.",
        "**Длинные цепочки задержек** на десятки элементов: страница «собирается» секундами.",
        "**Анимации на `width`/`height`/`top`/`left`.**",
        "**Анимация без `prefers-reduced-motion`.**",
        "**`!important` внутри свойств, которые анимируются.**",
        "**JavaScript-таймеры вместо `@keyframes`** для простых циклов.",
        "**Ожидание `animationend` для критичной логики** без запасного пути (вкладка в фоне, `reduce`, `display: none`).",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Анимируйте `transform` и `opacity`;** остальное — осознанно и коротко.",
        "**Заливка:** `both` для анимаций появления; `forwards` — когда итог должен остаться.",
        "**Конечное число повторов** для привлечения внимания; `infinite` — только для индикаторов процесса.",
        "**`prefers-reduced-motion: reduce`:** отключайте движение; сохраняйте итоговое состояние.",
        "**Токены анимаций:** длительности и кривые в переменных (`--duration-enter`, `--ease-out`).",
        "**Имена кадров по смыслу** (`enter`, `shimmer`), общие `@keyframes` — в одном месте.",
        "**Тесты:** `getAnimations()`, пауза и `currentTime`, число событий.",
        "**Запасные варианты:** `@supports` для привязки к прокрутке, текст вместо анимации-сообщения.",
      ),
    ]),

    section("edge-cases", [
      h("Анимации и `display: none`"),
      p("Элемент с `display: none` анимацию не выполняет: при показе она стартует с начала. Скрытие через `visibility` или `opacity` сохраняет анимации идущими (и расходует ресурсы)."),
      h("Несколько анимаций на одном свойстве"),
      p("Если две анимации меняют одно свойство, побеждает та, что стоит **позже** в списке `animation-name`. Для комбинирования значений существует `animation-composition: add | accumulate` (проверьте поддержку)."),
      h("Анимации и слои каскада"),
      p("Анимации находятся между обычными и `!important` значениями автора. Слои определяют порядок внутри обычных значений, но анимация сильнее любого слоя (для обычных значений)."),
      h("Фоновые вкладки"),
      p("В неактивной вкладке анимации замедляются или приостанавливаются. События `animationend` могут приходить с задержкой: не строите на них критичную логику без запасного таймера."),
      h("Дробное число повторов и смещение"),
      p("`animation-iteration-count: 1.5` завершает анимацию на половине второго прохода; в сочетании с `forwards` элемент остаётся в промежуточном состоянии. Удобно для «полуповоротов»."),
      h("Привязка к `view()`"),
      p("`animation-timeline: view()` связывает прогресс с видимостью элемента в окне; диапазоны `animation-range` позволяют указать фазы входа и выхода. Это новая возможность: сверяйтесь с таблицами совместимости и держите запасной вариант."),
    ]),

    section("related", [
      ul(
        "[Переходы](/learn/css/transitions) — ответ на изменение состояния.",
        "[Трансформации](/learn/css/transforms) — `translate`, `rotate`, `scale`, `perspective`.",
        "[Производительность анимаций и движение](/learn/css/animation-performance-motion) — что дёшево, `will-change`, доступность.",
        "[Пользовательские свойства](/learn/css/custom-properties) — `@property` и анимация переменных.",
        "[Медиазапросы и mobile-first](/learn/css/media-queries) — `prefers-reduced-motion`.",
        "[Контексты наложения](/learn/css/stacking-contexts) — как анимации создают контекст.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Бесконечные анимации и JS-таймеры",
          code: `
            .card { animation: enter 0.5s; }                    /* исчезает после конца */
            .badge { animation: pulse 1s infinite; }            /* вечно, всегда */
            .box { animation: move 1s infinite; }
            @keyframes move { 0% { left: 0 } 100% { left: 200px } }   /* раскладка */
          `,
          note: "Нет заливки (после конца элемент возвращается), вечные анимации без остановки, анимация `left`, ни одного учёта `prefers-reduced-motion`.",
        },
        {
          title: "Заливка, трансформации и доступность",
          code: `
            .card { animation: enter 400ms ease-out both; animation-delay: calc(var(--i) * 80ms); }
            .badge { animation: pulse 1s ease-in-out 3; }
            @keyframes move { to { transform: translateX(200px); } }
            @media (prefers-reduced-motion: reduce) { .card, .badge { animation: none; } }
          `,
          note: "`both` фиксирует начало и конец, число повторов конечно, движение — через `transform`, пользователям с `reduce` анимации отключены.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.keyframes.ex1",
      title: "Значения при разных режимах заливки",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("Базовый стиль элемента `opacity: 0.5`. Анимация `fade` (0 → 1), `1000ms linear`, задержка `500ms`. Определите `opacity` в моменты 0, 499, 1000, 1500 и 2000 мс для `none`, `forwards`, `backwards`, `both`."),
      ],
      hints: ["Что показывается в период задержки?", "Что остаётся после конца?"],
      checks: ["none: 0.5 / 0.5 / 0.5 / 0.5 / 0.5", "forwards: 0.5 / 0.5 / 0.5 / 1 / 1", "backwards: 0 / 0 / 0.5 / 0.5 / 0.5", "both: 0 / 0 / 0.5 / 1 / 1"],
      solution: [
        table(
          ["Режим", "0", "499", "1000", "1500", "2000"],
          [
            ["`none`", "0.5", "0.5", "0.5", "0.5", "0.5"],
            ["`forwards`", "0.5", "0.5", "0.5", "1", "1"],
            ["`backwards`", "0", "0", "0.5", "0.5", "0.5"],
            ["`both`", "0", "0", "0.5", "1", "1"],
          ],
        ),
        p("Момент 1000 мс — середина активной фазы (прошло 500 мс из 1000): прогресс 0.5, значение 0.5. Момент 1500 мс — конец активной фазы: `none` и `backwards` вернулись к базовым 0.5, а `forwards` и `both` оставили последний кадр. Все значения подтверждены замером."),
      ],
    }),
    exercise({
      id: "css.keyframes.ex2",
      title: "Элемент исчезает после анимации",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Карточка скрыта `opacity: 0`, анимация `fade-in 500ms` выводит её на экран, но после конца карточка снова пропадает. Объясните причину и предложите два исправления. Какое лучше и почему?"),
      ],
      starter: {
        lang: "css",
        code: `
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          .card { opacity: 0; animation: fade-in 500ms; }
        `,
      },
      hints: ["Что показывается после конца без заливки?", "Можно ли поменять базовое состояние?"],
      checks: ["Причина: нет `animation-fill-mode: forwards`", "Исправление 1: `forwards`", "Исправление 2: базовый `opacity: 1` + `backwards`"],
      solution: [
        p("**Причина.** По умолчанию вне активной фазы анимация ничего не задаёт: после конца элемент возвращается к обычным стилям (`opacity: 0`)."),
        code(
          "css",
          `
          /* 1. оставить последний кадр */
          .card { opacity: 0; animation: fade-in 500ms forwards; }

          /* 2. лучше: итоговое состояние — обычное, начальное — через заливку */
          .card { animation: fade-in 500ms backwards; }
          `,
        ),
        p("Второй вариант надёжнее: если анимация не сработала (`prefers-reduced-motion`, неподдерживаемое свойство), элемент остаётся видимым. В первом при отказе анимации он останется скрытым."),
      ],
    }),
    exercise({
      id: "css.keyframes.ex3",
      title: "Анимация не меняет цвет",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Анимация `blink` должна менять цвет текста с красного на синий и оставлять синий (`forwards`). В стилях есть `color: red !important`. Цвет остаётся красным. Объясните причину и исправьте так, чтобы анимация работала и в тесте можно было проверить результат детерминированно."),
      ],
      starter: {
        lang: "css",
        code: `
          @keyframes blink { to { color: blue; } }
          .a { color: red !important; animation: blink 1s forwards; }
        `,
      },
      hints: ["Что сильнее: анимация или `!important`?", "Как проверить значение в конце, не дожидаясь таймера?"],
      checks: ["Причина: `!important` сильнее анимации", "Исправление: убрать `!important`", "Тест через `finish()` и `getComputedStyle`"],
      solution: [
        code(
          "css",
          `
          @keyframes blink { to { color: blue; } }
          .a { color: red; animation: blink 1s forwards; }
          `,
        ),
        p("**Причина.** Объявление с `!important` сильнее значений из анимаций (замер: красный остался). Без `!important` анимация с `forwards` оставила синий."),
        code(
          "js",
          `
          const [anim] = document.querySelector(".a").getAnimations();
          anim.finish();                                              // перейти в конец
          getComputedStyle(document.querySelector(".a")).color;       // "rgb(0, 0, 255)"
          `,
        ),
      ],
    }),
  ],

  challenge: {
    id: "css.keyframes.challenge",
    title: "Тест анимации: заливка, повторы и reduced motion без таймеров",
    scenario: [
      p("Команда добавила анимации появления карточек, колокольчика и спиннера. QA жалуется на «мигающие» карточки (нет заливки), бесконечные «звонки» и отсутствие учёта `prefers-reduced-motion`. Нужно описать анимации правильно и написать тест, использующий Web Animations API без ожидания по таймеру."),
    ],
    requirements: [
      "Появление карточки: `enter 400ms ease-out both` с ступенчатой задержкой `calc(var(--i) * 80ms)`",
      "Колокольчик: 3 повтора, не `infinite`",
      "Спиннер: `infinite`, `linear`",
      "Для `prefers-reduced-motion: reduce` — все анимации отключены",
      "Тест: параметры анимаций (имя, длительность, fill, повторы), значения в момент задержки и в конце, число анимаций при `reduce`",
    ],
    constraints: [
      "Нельзя использовать `setTimeout` для проверки значений",
      "Нельзя анимировать `top`, `left`, `width`, `height`",
    ],
    acceptance: [
      "Первая карточка: `fill = both`, `duration = 400`, `iterations = 1`",
      "Значение `opacity` карточки с задержкой в начале задержки равно 0 и равно 1 в конце",
      "Колокольчик: `iterations = 3`",
      "Спиннер: `iterations = Infinity`",
      "При `reducedMotion: reduce` число анимаций 0",
    ],
    hints: [
      "Как получить параметры анимации?",
      "Как проверить значение в период задержки?",
      "Как включить `reduce` в тесте?",
    ],
    solution: [
      code(
        "css",
        `
        @keyframes enter { from { opacity: 0; transform: translateY(0.75rem); } to { opacity: 1; transform: none; } }
        @keyframes ring  { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(12deg); } 75% { transform: rotate(-12deg); } }
        @keyframes spin  { to { transform: rotate(360deg); } }

        .card    { animation: enter 400ms ease-out both; animation-delay: calc(var(--i, 0) * 80ms); }
        .bell    { animation: ring 1s ease-in-out 3; }
        .spinner { animation: spin 1s linear infinite; }

        @media (prefers-reduced-motion: reduce) { .card, .bell, .spinner { animation: none; } }
        `,
        { filename: "animations.css", lineNumbers: true },
      ),
      code(
        "js",
        `
        const info = (sel) => page.evaluate((s) => {
          const [a] = document.querySelector(s).getAnimations();
          const t = a.effect.getTiming();
          return { name: a.animationName, duration: t.duration, fill: t.fill, iterations: t.iterations, delay: t.delay };
        }, sel);

        console.log(await info(".card"));       // { name: "enter", duration: 400, fill: "both", iterations: 1, delay: 0 }
        console.log(await info(".bell"));       // iterations: 3
        console.log(await info(".spinner"));    // iterations: Infinity (в JSON выводится как null)

        // карточка с задержкой 160 мс: значения в начале и в конце
        const values = await page.evaluate(() => {
          const el = document.querySelector(".card:nth-child(3)");      // --i: 2, delay 160ms
          const [a] = el.getAnimations(); a.pause();
          const read = (t) => { a.currentTime = t; return getComputedStyle(el).opacity; };
          return { delay: read(0), end: read(160 + 400) };
        });
        console.log(values);                    // { delay: "0", end: "1" }

        await page.emulateMedia({ reducedMotion: "reduce" });
        console.log("reduce:", await page.evaluate(() => document.getAnimations().length));   // 0
        `,
        { filename: "animations.test.js" },
      ),
      ul(
        "**Параметры:** `effect.getTiming()` — имя, длительность, режим заливки, повторы, задержка: без ожиданий.",
        "**Задержка и конец:** `currentTime` внутри периода задержки (0) и в конце (задержка + длительность) дают `opacity` 0 и 1: проверка `both`.",
        "**Reduced motion:** `emulateMedia({ reducedMotion: \"reduce\" })` и `document.getAnimations().length === 0`.",
        "**Ограничения:** только `transform` и `opacity`; свойства раскладки не анимируются.",
      ),
    ],
  },

  interview: [
    iq("css.keyframes.i1", "basic", "Чем `@keyframes` отличаются от переходов?", [
      p("Переход — реакция на изменение значения: две точки, запуск по смене состояния. `@keyframes` — сценарий из любого числа кадров, который может запускаться сам (при появлении элемента или назначении `animation-name`), повторяться, идти в обратную сторону и т. д."),
    ]),
    iq("css.keyframes.i2", "basic", "Что делает `animation-fill-mode`?", [
      p("Определяет, что анимация показывает вне активной фазы: `backwards` — первый кадр в период задержки, `forwards` — последний кадр после конца, `both` — и то и другое, `none` — ничего (элемент в обычном состоянии). В замере при `none` значение на 1500 мс вернулось к исходному 0.5, при `forwards` осталось 1."),
    ]),
    iq("css.keyframes.i3", "intermediate", "Как работает `animation-direction: alternate`?", [
      p("Чётные проходы идут в обратную сторону: при трёх проходах `fade` значения на 250/750/1250/1750/2250/2750 мс — 0.25, 0.75, 0.75, 0.25, 0.25, 0.75. `reverse` проходит каждый раз в обратную сторону, `alternate-reverse` начинает с обратного."),
    ]),
    iq("css.keyframes.i4", "intermediate", "Как анимация взаимодействует с каскадом и `!important`?", [
      p("Значения анимации сильнее обычных объявлений автора (в замере `forwards` перекрасило элемент) и слабее `!important` (красный `!important` анимацию не пропустил). Поэтому у анимируемых свойств `!important` быть не должно."),
    ]),
    iq("css.keyframes.i5", "intermediate", "Что значит отсутствие кадра `from`?", [
      p("Неявный кадр берёт значение из обычных стилей элемента: для `@keyframes up { to { opacity: 1 } }` и базового `opacity: 0.4` значения на 0/500/1000 мс равны 0.4/0.7/1."),
    ]),
    iq("css.keyframes.i6", "advanced", "Как тестировать CSS-анимацию надёжно?", [
      ul(
        "Читать `el.getAnimations()`: `animationName`, `effect.getTiming()` (длительность, `fill`, `iterations`, задержка).",
        "`anim.pause()` и `anim.currentTime = t` для значений в нужные моменты, `anim.finish()` для конца.",
        "Эмулировать `prefers-reduced-motion: reduce` и проверять число анимаций.",
        "Не ждать таймеры и не опираться на реальное время.",
      ),
    ]),
    iq("css.keyframes.i7", "engineering", "Как организовать анимации в дизайн-системе?", [
      ul(
        "Общие `@keyframes` в одном файле с понятными именами; длительности и кривые — токены.",
        "Правила: `transform`/`opacity`, заливка `both` для появления, конечное число повторов для акцентов.",
        "Доступность: `prefers-reduced-motion`, паузы для долгих анимаций, отсутствие мигания.",
        "Тесты по Web Animations API и обзор анимаций в документации компонентов.",
      ),
    ]),
    iq("css.keyframes.i8", "debugging", "Анимация не запускается или ведёт себя странно. Что проверите?", [
      ul(
        "Совпадает ли `animation-name` с именем `@keyframes`; ненулевая ли длительность.",
        "Нет ли `animation: none` из `prefers-reduced-motion` или более специфичного правила; не `display: none` ли у элемента.",
        "Есть ли заливка: без неё после конца элемент возвращается к обычному виду.",
        "Не перебивает ли анимируемое свойство `!important`.",
        "Для повторного запуска — менялось ли имя анимации; для привязки к прокрутке — поддержка `animation-timeline`.",
      ),
    ]),
  ],

  exam: [
    mcq("css.keyframes.e1", "foundation", "Какое сокращение запускает бесконечное вращение за 2 секунды равномерно?", ["`animation: 2s infinite spin ease`", "`animation: spin linear 2s`", "`animation: spin 2s linear infinite`", "`animation: infinite spin`"], 2, "Имя, длительность, линейная функция и `infinite`; порядок значений может быть любым, но длительность — первое время."),
    mcq("css.keyframes.e2", "foundation", "Что оставляет `animation-fill-mode: forwards`?", ["Последний кадр после конца анимации", "Первый кадр после начала", "Исходное значение", "Среднее значение"], 0, "`forwards` сохраняет значения последнего кадра после завершения; без него элемент возвращается к обычному виду."),
    mcq("css.keyframes.e3", "intermediate", "Для `alternate` и 3 проходов `fade` (0 → 1, 1000 мс) значение на 1250 мс равно…", ["0.25", "1", "0.5", "0.75"], 3, "Второй проход идёт назад: на 250 мс второго прохода значение 1 − 0.25 = 0.75."),
    mcq("css.keyframes.e4", "intermediate", "Что сильнее: значение из анимации или обычное объявление автора?", ["Обычное объявление", "Значение из анимации", "Зависит от специфичности", "Одинаково"], 1, "Анимации сильнее обычных значений автора, но слабее `!important`."),
    mcq("css.keyframes.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["Без `from` используется значение из обычных стилей", "`animation-timing-function` в кадре действует на сегмент до следующего кадра", "`!important` у свойства блокирует его анимацию", "Повторное добавление класса с тем же `animation-name` всегда перезапускает анимацию"], [0, 1, 2], "Перезапуск требует смены имени или Web Animations API."),
    mcq("css.keyframes.e6", "advanced", "Сколько событий `animationiteration` будет у анимации с тремя проходами?", ["3", "0", "1", "2"], 3, "Событие приходит между проходами: после первого и второго; после третьего приходит `animationend`."),
    open("css.keyframes.e7", "intermediate", "Объясните, как правильно сделать анимацию появления карточек волной и что учесть для доступности.", [
      ul(
        "`@keyframes enter` (opacity и transform), `animation: enter 400ms ease-out both` и ступенчатая задержка `calc(var(--i) * 80ms)`.",
        "`both` скрывает карточки в период задержки и оставляет видимыми после.",
        "`prefers-reduced-motion: reduce` отключает анимацию; контент виден и без неё.",
      ),
    ], ["Названы кадры и заливка", "Ступенчатая задержка", "Учтён reduced motion"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.keyframes.m1", "intermediate", "Базовый `opacity: 0.5`, анимация 0 → 1 за 1000 мс с задержкой 500 мс и `forwards`. Чему равна `opacity` на 499 мс?", ["0", "1", "0.5", "0.25"], 2, "В период задержки без `backwards` показывается обычное значение 0.5."),
    mcq("css.keyframes.m2", "advanced", "`@keyframes up { to { opacity: 1 } }`, базовый `opacity: 0.4`. Чему равна `opacity` на середине анимации?", ["0", "0.7", "0.5", "1"], 1, "Неявный кадр `from` берёт 0.4: на середине между 0.4 и 1 значение 0.7."),
    mcq("css.keyframes.m3", "advanced", "Что произойдёт с `animation-timeline: scroll()` в браузере без поддержки, если нет `@supports`?", ["Свойство игнорируется, анимация идёт по времени (может выглядеть неверно)", "Анимация по времени", "Ошибка JavaScript", "Анимация отключится"], 0, "Неизвестное свойство игнорируется: остаётся обычная временная анимация, которая может выглядеть некорректно. Оборачивайте в `@supports`."),
    open("css.keyframes.m4", "advanced", "Спроектируйте правила работы с анимациями в продукте: производительность, доступность, тесты.", [
      ul(
        "Производительность: `transform`/`opacity`, конечные повторы, отсутствие анимации раскладки, ограничение числа одновременно анимируемых элементов.",
        "Доступность: `prefers-reduced-motion`, паузы для долгих, отсутствие мигания, смысл вне анимации.",
        "Организация: общие `@keyframes`, токены длительностей и кривых, понятные имена.",
        "Тесты: Web Animations API (параметры, значения в ключевых точках), эмуляция reduce, отсутствие `!important` у анимируемых свойств.",
      ),
    ], ["Производительность и организация", "Доступность", "Тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.keyframes.f1", front: "`animation-fill-mode`?", back: "`backwards` — первый кадр в задержку; `forwards` — последний после конца; `both` — оба; `none` — ничего." },
    { id: "css.keyframes.f2", front: "Сокращение `animation`?", back: "`имя длительность функция задержка повторы направление заливка состояние`; первое время — длительность." },
    { id: "css.keyframes.f3", front: "`alternate`?", back: "Чётные проходы идут назад." },
    { id: "css.keyframes.f4", front: "Анимация и `!important`?", back: "Анимация сильнее обычных, слабее `!important`." },
    { id: "css.keyframes.f5", front: "Тест анимации?", back: "`getAnimations()`, `pause()`, `currentTime`, `finish()`; `getTiming()`." },
    { id: "css.keyframes.f6", front: "Движение и доступность?", back: "`prefers-reduced-motion: reduce` → отключить; без мигания; смысл не только в анимации." },
  ],

  sources: [
    { title: "CSS Animations Level 1", url: "https://www.w3.org/TR/css-animations-1/", publisher: "W3C" },
    { title: "CSS Animations Level 2", url: "https://www.w3.org/TR/css-animations-2/", publisher: "W3C" },
    { title: "Web Animations", url: "https://www.w3.org/TR/web-animations-1/", publisher: "W3C" },
    { title: "Scroll-driven Animations", url: "https://www.w3.org/TR/scroll-animations-1/", publisher: "W3C" },
    { title: "MDN: Using CSS animations", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations", publisher: "MDN" },
    { title: "MDN: animation-fill-mode", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/animation-fill-mode", publisher: "MDN" },
    { title: "MDN: Element.getAnimations()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/getAnimations", publisher: "MDN" },
    { title: "WCAG 2.2: Three Flashes or Below Threshold", url: "https://www.w3.org/TR/WCAG22/#three-flashes-or-below-threshold", publisher: "W3C" },
    { title: "WCAG 2.2: Pause, Stop, Hide", url: "https://www.w3.org/TR/WCAG22/#pause-stop-hide", publisher: "W3C" },
  ],
};
