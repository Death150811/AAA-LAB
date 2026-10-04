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

export const nestingModern: Topic = {
  id: "css.nesting-modern",
  slug: "nesting-modern",
  domain: "css",
  module: "modern",
  title: "Вложенность в CSS (nesting)",
  titleEn: "Native CSS nesting: the & selector, relaxed syntax, nested at-rules, specificity, differences from Sass",
  summary:
    "Родная вложенность позволяет писать правила внутри правил без препроцессора: `.card { &:hover { … } .title { … } @media (…) { … } }`. Тема разбирает селектор `&`, упрощённую запись (`.title` без `&`), ведущие комбинаторы, вложенные `@media`, `@supports`, `@container`, `@layer`, расчёт специфичности (`&` ведёт себя как `:is()` родителя), порядок объявлений, главное отличие от Sass (`&__title` **не работает**), ограничения глубины и безопасный перенос плоского CSS во вложенный.",
  minutes: 45,
  prerequisites: ["css.selectors", "css.specificity"],
  tags: ["nesting", "&", "nested rules", "relaxed nesting", "specificity", ":is()", "@media", "@layer", "Sass", "BEM", "stylelint", "CSSOM"],
  keyConcepts: [
    { term: "`&` — ссылка на родителя", text: "`&` заменяется родительским селектором: `&:hover`, `&.is-active`, `.dark &`, `& + &`. Без `&` вложенный селектор по умолчанию значит «потомок родителя»: `.card { .title { … } }` = `.card .title`." },
    { term: "Нет склейки имён", text: "`&__title` и `&-big` из Sass **не работают**: `&` — это целый селектор, а не строка. Замер: правила `&__title` и `&-big` не сработали. БЭМ-имена пишут полностью: `.card__title`." },
    { term: "Специфичность как у `:is()`", text: "`&` весит как самый специфичный селектор родителя. В `.x, #y { & p { … } }` вес равен `#y` + `p` даже для элемента, подошедшего по `.x` (замер: перебило `.x p.q.r.s`)." },
    { term: "Вложенные at-правила", text: "Внутрь правила можно класть `@media`, `@supports`, `@container`, `@layer`: объявления внутри них относятся к родительскому селектору. Условие остаётся рядом с компонентом." },
    { term: "Вложенность — не вёрстка дерева", text: "Вкладывайте состояния, варианты и условия, а не всю структуру DOM. Глубина больше 2–3 уровней усложняет чтение и повышает специфичность." },
  ],
  sections: [
    section("definition", [
      def("Вложенное правило", "Правило стиля, записанное внутри другого правила. Его селектор строится из селектора родителя: либо через `&`, либо неявно как потомок.", "nested style rule"),
      def("Селектор вложенности `&`", "Подставляется на место родительского селектора. Эквивалентен `:is(родитель)` и несёт специфичность самого специфичного элемента родительского списка.", "nesting selector"),
      def("Упрощённая вложенность", "Запись вложенного селектора без `&` (`.title`, `p`, `> .actions`). В современных браузерах разрешена: к селектору автоматически добавляется `& ` в начало.", "relaxed nesting"),
      def("Вложенное at-правило", "`@media`, `@supports`, `@container`, `@layer` внутри правила стиля: условие применяется, а объявления адресуются родительскому селектору.", "nested at-rule"),
    ]),

    section("why", [
      h("Что решает вложенность"),
      ul(
        "**Меньше повторов:** `.card` не пишется десять раз.",
        "**Условия рядом с компонентом:** `@media` и `@container` лежат внутри правила, к которому относятся.",
        "**Состояния и варианты в одном месте:** `&:hover`, `&:focus-visible`, `&.is-featured`.",
        "**Нет сборки:** родной синтаксис работает в браузере без препроцессора.",
        "**Читаемость:** структура файла отражает структуру компонента.",
      ),
      h("Чего вложенность не делает"),
      p("Она **не склеивает строки** (в отличие от Sass), не вводит переменные и не меняет каскад: вложенное правило — обычное правило с вычисленным селектором. Поэтому все законы специфичности и порядка остаются в силе, а размножение уровней вложенности легко завышает вес селекторов."),
      insight("Думайте о вложенности как о **сокращении записи**, а не как о новой модели: результат всегда можно развернуть в плоский CSS и проверить его специфичность."),
    ]),

    section("mental-model", [
      p("Представьте **оглавление с подпунктами**. Родитель — «глава», вложенные правила — «подпункты», которые считаются относящимися к главе. Знак `&` — «эта самая глава»: `&:hover` — «эта глава при наведении», `.dark &` — «эта глава внутри `.dark`». Подпункт без `&` читается как «в этой главе: …»."),
      diagram(
        `
        .card {                              .card { … }
          padding: 1rem;
          &:hover { … }                  →   .card:hover { … }
          .title { … }                   →   .card .title { … }
          > .actions { … }               →   .card > .actions { … }
          &.is-featured { … }            →   .card.is-featured { … }
          .dark & { … }                  →   .dark .card { … }
          @media (width >= 40rem) {      →   @media (width >= 40rem) { .card { padding: 1.5rem } }
            padding: 1.5rem;
          }
        }

        &__title (Sass)                  →   НЕ РАБОТАЕТ: & — целый селектор, а не строка
        `,
        "Как вложенные правила разворачиваются в плоские",
      ),
    ]),

    section("technical", [
      h("Базовые формы"),
      code(
        "css",
        `
        .card {
          padding: 1rem;
          border: 2px solid transparent;

          &:hover { border-color: #2f3d9a; }          /* .card:hover */
          &.is-featured { background: #eef0fb; }      /* .card.is-featured */
          .title { margin: 0; }                       /* .card .title  (без &) */
          > .actions { display: flex; gap: 0.5rem; }  /* .card > .actions */
          + .card { margin-block-start: 1rem; }       /* .card + .card */
          .dark & { background: #1f2133; }            /* .dark .card */
        }
        `,
        { filename: "nesting-basic.css" },
      ),
      ul(
        "**Без `&`** вложенный селектор — потомок родителя (замер: `.card { .title { … } p { … } }` покрасил и `.title`, и `p` внутри карточки).",
        "**Ведущие комбинаторы** (`>`, `+`, `~`) разрешены: `> .actions`, `+ .card`, `~ .x` сработали в замере.",
        "**`&` в середине** (`.dark &`, `.list &`) ставит родителя после другого селектора: `.list &` покрасил `.card` внутри `.list`.",
        "**`&` можно комбинировать с классами и псевдоклассами:** `&.big`, `&:hover`, `&:not(.x)`.",
      ),
      h("Главное отличие от Sass: нет склейки"),
      wrongRight(
        "css",
        {
          code: `
            .card {
              color: blue;
              &__title { color: red; }     /* .card__title в Sass */
              &-big { color: red; }        /* .card-big в Sass */
            }
          `,
          note: "В родном CSS правила не применились (замер: `.card__title` остался синим по наследованию, `.card-big` — чёрным). `&` — селектор целиком, а не строка.",
        },
        {
          code: `
            .card {
              color: blue;
              .card__title { color: red; }
              &.card--big { color: red; }
            }
          `,
          note: "Полные имена классов; БЭМ-имена не склеиваются, но вложенность всё равно сокращает повторы родителя.",
        },
      ),
      h("Специфичность"),
      p("`&` соответствует родительскому селектору как `:is()`: берётся **самый специфичный** элемент списка. Для одиночного селектора `.card { &:hover }` вес равен `.card:hover` — (0,2,0), как у плоской записи."),
      code(
        "css",
        `
        .x, #y { & p { color: red; } }
        /* эквивалент: :is(.x, #y) p → вес (1, 0, 1) */

        .x p.q.r.s { color: blue; }                    /* вес (0, 4, 1) */
        `,
        { filename: "nesting-specificity.css" },
      ),
      p("Замер: для `<div class=\"x\"><p class=\"q r s\">` победило красное: `&` в списке `.x, #y` взял вес `#y`, хотя элемент подошёл только по `.x`. Сравните с обычным `.x p` (0,1,1). Вложенное `.a { .b { .c { … } } }` и плоское `.a .b .c` в замере дали одинаковый вес: победило написанное позже."),
      p("Уменьшить вес родителя можно через `:where(&)`: замер для `.a { :where(&) p { color: red } }` против позднего `p { color: blue }` показал синий — вес равен `p` (0,0,1), и побеждает порядок, а `.a { & p { … } }` (0,1,1) победило красным."),
      h("Вложенные at-правила"),
      code(
        "css",
        `
        .card {
          display: grid;
          gap: 0.75rem;

          @media (width >= 40rem) { gap: 1.5rem; }                 /* объявления относятся к .card */
          @supports (display: subgrid) { & .title { grid-row: span 2; } }
          @container (width >= 30rem) { grid-template-columns: 10rem 1fr; }
          @layer components { & p { margin: 0; } }
        }
        `,
        { filename: "nested-at-rules.css" },
      ),
      p("Замеры: `@media (min-width: 500px) { color: blue }` внутри `.a` перекрасило `.a` при окне 1000px; `@supports` с вложенным `& p` сработал; `@container` внутри правила сработал для контейнера шириной 600px; `@layer comps { & p { … } }` внутри `.a` поместило правило в слой `comps` и оно перебило более ранний слой."),
      h("Порядок объявлений и вложенных правил"),
      code(
        "css",
        `
        .a {
          color: red;
          & p { color: blue; }
          color: green;              /* объявление после вложенного правила */
        }
        `,
        { filename: "declarations-after-rules.css" },
      ),
      p("Замер в Chromium: итоговый цвет `.a` — зелёный, а `p` — синий. Правила и объявления в современных браузерах сохраняют порядок записи, но порядок объявлений относительно вложенных правил менялся между версиями спецификации. Надёжное правило: **сначала объявления, потом вложенные правила**."),
      h("Ошибки в списках"),
      p("Вложенный список селекторов **не прощает** ошибок: замер для `.a { &:unknown-thing, & p { color: red } }` — правило отброшено целиком. Заворачивайте сомнительные части в `:is()`."),
      h("CSSOM"),
      code(
        "js",
        `
        const sheet = document.styleSheets[0];
        const rule = sheet.cssRules[0];                     // CSSStyleRule
        console.log(rule.cssRules.length);                  // вложенные правила
        console.log(rule.cssText);                          // включает вложенные: ".a { color: red; &:hover { … } }"
        `,
        { filename: "nesting-cssom.js" },
      ),
      p("В замере правило `.a { color: red; &:hover { color: blue } @media (width > 1px) { color: green } }` имело `cssRules` с `CSSStyleRule` и `CSSMediaRule`, а `cssText` содержал вложенные части."),
      h("Поддержка"),
      p("Родная вложенность (включая упрощённую запись без `&`) поддерживается современными браузерами с конца 2023 года; проверьте таблицы совместимости для нужных версий. В браузере без поддержки внутренние правила **не применяются**, а объявления родителя — применяются. Для критичных стилей держите запасной плоский вариант или собирайте вложенный CSS в плоский на сборке."),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        .card {
          padding: 1rem;
          border: 2px solid transparent;

          &:hover { border-color: #2f3d9a; }
          &.is-featured { background: #eef0fb; }

          .title { margin: 0; }
          > .actions { display: flex; gap: 0.5rem; }
          .dark & { background: #1f2133; }

          @media (width >= 40rem) { padding: 1.5rem; }
        }
        `,
        [
          { line: [2, 3], text: "Сначала объявления самого `.card`: так порядок читается однозначно." },
          { line: 5, text: "`&:hover` разворачивается в `.card:hover` — вес (0,2,0), как у плоской записи." },
          { line: 8, text: "Без `&`: `.title` внутри `.card` — потомок. Вес `.card .title` (0,2,0)." },
          { line: 9, text: "Ведущий комбинатор: `> .actions` — только прямой ребёнок `.card`." },
          { line: 10, text: "`&` в середине: карточка внутри `.dark`. Вес (0,2,0)." },
          { line: 12, text: "Вложенный `@media`: объявления относятся к `.card`, условие лежит рядом с компонентом." },
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
        <title>nesting</title>
        <style>
          body { margin: 0; padding: 1rem; font: 16px/1.5 system-ui, sans-serif; }
          .card {
            max-inline-size: 24rem;
            padding: 1rem;
            border: 2px solid #c5cae9;
            border-radius: 0.5rem;

            &:hover { border-color: #2f3d9a; }
            .title { margin: 0 0 0.5rem; font-size: 1.25rem; }
            &.is-featured { background: #eef0fb; .title { color: #2f3d9a; } }

            @media (width >= 40rem) { padding: 1.5rem; }
          }
        </style>
        <article class="card"><h2 class="title">Обычная карточка</h2><p>Наведите курсор: рамка меняет цвет.</p></article>
        <article class="card is-featured" style="margin-top: 1rem"><h2 class="title">Выделенная карточка</h2><p>Вариант и заголовок описаны внутри правила карточки.</p></article>
        </html>
        `,
        { filename: "nesting-basics.html", runnable: true },
      ),
      p("Измените ширину окна: от 40rem поля карточки увеличиваются — `@media` лежит внутри `.card`. Замените `.title` на `&__title` и убедитесь, что правило перестало работать."),
    ]),

    section("detailed-example", [
      p("Компонент карточки с состояниями, вариантами, тёмной темой, условием по ширине и слоем — всё внутри одного правила. Объявления идут перед вложенными правилами, а БЭМ-имена написаны полностью."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Компонент на вложенности</title>
        <style>
          @layer base, components;

          @layer base {
            *, *::before, *::after { box-sizing: border-box; }
            body { margin: 0; padding: 1rem; font: 1rem/1.5 system-ui, sans-serif; color: #1b1b1f; background: #f4f5fb; }
            body.dark { color: #e8e8f0; background: #14151f; }
          }

          @layer components {
            .card {
              --card-pad: 1rem;
              display: grid;
              gap: 0.75rem;
              max-inline-size: 36rem;
              margin-block-end: 1rem;
              padding: var(--card-pad);
              background: #fff;
              border: 2px solid transparent;
              border-radius: 0.5rem;
              transition: border-color 0.2s;

              &:hover { border-color: #2f3d9a; }
              &:has(.card__media) { grid-template-columns: 6rem 1fr; align-items: start; }
              &.card--featured { background: #eef0fb; .card__title { color: #2f3d9a; } }
              .dark & { background: #1f2133; &.card--featured { background: #2a2d4a; } }

              .card__media { aspect-ratio: 1; background: linear-gradient(135deg, #7986cb, #3949ab); border-radius: 0.25rem; }
              .card__title { margin: 0; font-size: 1.25rem; }
              .card__text { margin: 0.25rem 0 0; }
              > .card__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; grid-column: 1 / -1; }

              @media (width >= 40rem) { --card-pad: 1.5rem; }
              @media (prefers-reduced-motion: reduce) { transition: none; }
            }

            .card__actions button { font: inherit; padding: 0.375rem 0.75rem; }
          }
        </style>
        <button id="theme" type="button" aria-pressed="false">Тёмная тема</button>
        <article class="card" style="margin-top: 1rem">
          <div class="card__media"></div>
          <div><h2 class="card__title">Карточка с изображением</h2><p class="card__text">Сетка включается через :has() внутри вложенного правила.</p></div>
          <div class="card__actions"><button type="button">Открыть</button><button type="button">Сохранить</button></div>
        </article>
        <article class="card card--featured">
          <div><h2 class="card__title">Выделенная карточка</h2><p class="card__text">Вариант описан вложенным правилом, заголовок получает цвет акцента.</p></div>
          <div class="card__actions"><button type="button">Подробнее</button></div>
        </article>
        <script>
          const btn = document.getElementById("theme");
          btn.addEventListener("click", () => {
            const dark = document.body.classList.toggle("dark");
            btn.setAttribute("aria-pressed", String(dark));
          });
        </script>
        </html>
        `,
        { filename: "nesting-component.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Развёртывание", "Вес"],
        [
          ["`&:hover`", "`.card:hover`", "(0,2,0)"],
          ["`&:has(.card__media)`", "`.card:has(.card__media)`", "(0,2,0)"],
          ["`&.card--featured .card__title`", "`.card.card--featured .card__title`", "(0,3,0)"],
          [".dark & { &.card--featured }", "`.dark .card.card--featured`", "(0,3,0)"],
          ["`> .card__actions`", "`.card > .card__actions`", "(0,2,0)"],
          ["`@media (width >= 40rem) { --card-pad }`", "`@media … { .card { --card-pad: 1.5rem } }`", "(0,1,0)"],
        ],
        "Что получается после развёртывания",
      ),
      ul(
        "Все БЭМ-имена написаны полностью; вложенность лишь убирает повтор `.card`.",
        "Объявления идут перед вложенными правилами: так порядок не зависит от версии браузера.",
        "Весь компонент лежит в слое `components`: вложенность и слои работают вместе, как независимые инструменты.",
        "Вариант `--featured` и тёмная тема получились (0,3,0): вес растёт на каждом уровне вложенности — это нужно учитывать при переопределениях.",
      ),
    ]),

    section("internals", [
      h("Как браузер разворачивает вложенность"),
      steps(
        [
          ["Разбор правила", "Внутри блока правила браузер различает объявления и вложенные правила (по структуре: селектор + `{…}` или at-правило)."],
          ["Построение селектора", "Для каждого вложенного селектора `&` заменяется на `:is(родительский список)`; если `&` нет, в начало добавляется `& ` (потомок), для ведущего комбинатора — `& комбинатор …`."],
          ["Специфичность", "Считается так же, как для обычного селектора с `:is()`: максимум по аргументам родительского списка плюс вес остальной части."],
          ["Условные блоки", "Вложенное `@media`/`@supports`/`@container`/`@layer` превращается в условное правило, внутри которого объявления адресуются родительскому селектору."],
          ["Каскад", "Развёрнутые правила участвуют в каскаде как обычные: сравниваются слой, специфичность и порядок появления."],
        ],
        "Развёртывание вложенного правила",
      ),
      h("Что показывает инструмент разработчика"),
      p("DevTools в панели Styles показывает вложенные правила с их полным селектором или с `&` в зависимости от версии браузера. Для проверки веса удобно мысленно развернуть вложенность в плоский селектор и посчитать (0,a,b)."),
      note("Если вложенное правило «не работает», сначала проверьте, не использовали ли вы Sass-склейку (`&__x`, `&-x`): в родном CSS она недопустима."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Склейка `&__title`, `&-modifier`"),
      p("В Sass это работает, в родном CSS — нет: `&` — целый селектор. Правило молча не применяется. Замер: ни `&__title`, ни `&-big` не сработали. Пишите `.card__title` и `&.card--big`."),
      h("Ошибка 2. Рост специфичности из-за глубины"),
      p("`.page { .section { .card { .title { … } } } }` разворачивается в `.page .section .card .title` — (0,4,0). Любое будущее переопределение должно быть не слабее. Ограничьте глубину 2–3 уровнями."),
      h("Ошибка 3. Вес `&` от списка"),
      p("`.x, #y { & p { … } }` весит как `#y p` (замер: перебило `.x p.q.r.s`). Не объединяйте в родительском списке селекторы разного веса, если ждёте одинакового поведения."),
      h("Ошибка 4. Объявления после вложенных правил"),
      p("Порядок объявлений относительно вложенных правил менялся между версиями спецификации. Пишите сначала объявления, затем вложенные правила."),
      h("Ошибка 5. Вложенный список с неизвестным селектором"),
      p("`.a { &:unknown, & p { … } }` — вложенный список не прощает ошибок: правило отброшено целиком (замер). Оберните сомнительную часть в `:is()` или разделите правила."),
      h("Ошибка 6. Вложенность ради вложенности"),
      p("Повторение иерархии DOM (`nav { ul { li { a { … } } } }`) создаёт хрупкие селекторы, привязанные к разметке. Вкладывайте состояния, варианты и условия, а не структуру страницы."),
      h("Ошибка 7. Нет запасного варианта"),
      p("В браузере без поддержки вложенные правила не применяются. Для критичных стилей используйте сборку, разворачивающую вложенность, либо держите базовые стили на верхнем уровне."),
      h("Ошибка 8. Путаница `&` в списках внутри `:is()`"),
      p("`:is(&, .x) p` вместо `& p, .x p` расширяет вес до `max`. Следите за весом при смешивании списков и `&`."),
    ]),

    section("antipatterns", [
      ul(
        "**Вложенность на 5+ уровней** — высокий вес и привязка к DOM.",
        "**Копирование структуры разметки** в CSS.",
        "**`&__element`** по привычке из Sass.",
        "**Смешение вложенных правил и объявлений** в произвольном порядке.",
        "**Объединение разновесных селекторов в родительском списке** (`.a, #b { & … }`).",
        "**Вложенность и `!important`** как способ «победить» старые правила.",
        "**Отсутствие линтера** глубины и веса вложенных селекторов.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Вкладывайте состояния, варианты и условия:** `&:hover`, `&.is-active`, `@media`, `@container`.",
        "**Объявления — до вложенных правил.**",
        "**Глубина — не более 2–3 уровней;** настройте линтер (`stylelint`: `max-nesting-depth`).",
        "**Полные имена классов** (`.card__title`); `&` — для состояний и вариантов.",
        "**Контролируйте вес:** разворачивайте вложенность мысленно; используйте `:where(&)` для базовых правил.",
        "**Комбинируйте со слоями:** компонент целиком в `@layer components { .card { … } }`.",
        "**Запасной вариант** для браузеров без поддержки: сборка в плоский CSS или плоский базовый уровень.",
        "**Тестируйте:** сравнивайте вычисленные стили плоской и вложенной версий.",
      ),
    ]),

    section("edge-cases", [
      h("`&` без вложенности"),
      p("Вне вложенного правила `&` означает `:scope` (в обычной таблице стилей — корень документа): замер показал, что `& p { color: red }` на верхнем уровне окрасило абзац внутри документа. Используйте это осознанно или избегайте: читателю такая запись непонятна."),
      h("Несколько `&` в селекторе"),
      p("`& + &` и `& &` допустимы: каждое `&` заменяется родителем (`.card + .card`). Вес складывается: для `.card { & + & }` получается (0,2,0)."),
      h("Родитель со списком"),
      p("`.a, .b { & p }` разворачивается в `:is(.a, .b) p` — не в `.a p, .b p`. Разница видна в весе: у `:is()` берётся максимальный аргумент."),
      h("`@scope` как альтернатива"),
      p("Для ограничения области действия стилей существует отдельное правило `@scope`; оно решает другую задачу (границы применимости), а не сокращение записи. Проверяйте поддержку по таблицам совместимости."),
      h("Анимации и вложенность"),
      p("`@keyframes` нельзя вкладывать в правила стиля: в замере вложенное `@keyframes` было отброшено (в `cssRules` родителя вложенных правил не осталось). Определяйте их на верхнем уровне, а внутри правила используйте `animation-name`."),
      h("Печать и инструменты"),
      p("Некоторые минификаторы и старые инструменты не понимают вложенность. Проверьте цепочку сборки: если она «ломает» вложенный CSS, используйте плагин-развёртыватель или обновите инструмент."),
    ]),

    section("related", [
      ul(
        "[Селекторы](/learn/css/selectors) — типы селекторов и комбинаторы.",
        "[Специфичность](/learn/css/specificity) — расчёт веса.",
        "[Логические селекторы](/learn/css/is-where-has) — `:is()`, `:where()` и `&`.",
        "[Каскадные слои](/learn/css/cascade-layers) — слои вместе с вложенностью.",
        "[Организация CSS](/learn/css/organizing-css) — как структурировать файлы и компоненты.",
        "[Методологии CSS](/learn/css/methodologies) — БЭМ и вложенность.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Плоский CSS с повтором родителя",
          code: `
            .card { padding: 1rem; }
            .card:hover { border-color: #2f3d9a; }
            .card .card__title { margin: 0; }
            .card.card--featured { background: #eef0fb; }
            .card.card--featured .card__title { color: #2f3d9a; }
            @media (width >= 40rem) { .card { padding: 1.5rem; } }
          `,
          note: "Родитель повторён шесть раз; условие `@media` оторвано от компонента.",
        },
        {
          title: "Вложенный CSS",
          code: `
            .card {
              padding: 1rem;

              &:hover { border-color: #2f3d9a; }
              .card__title { margin: 0; }
              &.card--featured { background: #eef0fb; .card__title { color: #2f3d9a; } }
              @media (width >= 40rem) { padding: 1.5rem; }
            }
          `,
          note: "Родитель назван один раз, условия и варианты лежат рядом; специфичность та же, но нужно следить за глубиной.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.nesting-modern.ex1",
      title: "Переведите во вложенный CSS",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("Перепишите плоский CSS во вложенный. Названия классов БЭМ оставьте полными. Какие записи Sass здесь **не** сработают?"),
      ],
      starter: {
        lang: "css",
        code: `
          .tab { padding: 0.5rem 1rem; border-bottom: 2px solid transparent; }
          .tab:hover { border-bottom-color: #c5cae9; }
          .tab.is-active { border-bottom-color: #2f3d9a; }
          .tab .tab__badge { margin-inline-start: 0.25rem; }
          @media (width >= 40rem) { .tab { padding: 0.75rem 1.5rem; } }
        `,
      },
      hints: ["Какие записи начинаются с `.tab` и могут стать вложенными?", "Как записать `.tab.is-active` через `&`?", "Что делает `&__badge` в родном CSS?"],
      checks: ["Родитель `.tab` записан один раз", "`&:hover`, `&.is-active`", "Полное `.tab__badge`", "`@media` внутри"],
      solution: [
        code(
          "css",
          `
          .tab {
            padding: 0.5rem 1rem;
            border-bottom: 2px solid transparent;

            &:hover { border-bottom-color: #c5cae9; }
            &.is-active { border-bottom-color: #2f3d9a; }
            .tab__badge { margin-inline-start: 0.25rem; }

            @media (width >= 40rem) { padding: 0.75rem 1.5rem; }
          }
          `,
        ),
        p("Не сработает склейка Sass: `&__badge` в родном CSS недопустимо (замер: `&__title` и `&-big` не применились). Полное имя `.tab__badge` внутри правила разворачивается в `.tab .tab__badge`."),
      ],
    }),
    exercise({
      id: "css.nesting-modern.ex2",
      title: "Почему победило вложенное правило",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Дан CSS. Элемент `<p class=\"q r s\">` лежит внутри `.x`. Вы ожидали синий цвет (вес `.x p.q.r.s` = (0,4,1)), но получаете красный. Объясните и предложите два исправления."),
      ],
      starter: {
        lang: "css",
        code: `
          .x, #y { & p { color: red; } }
          .x p.q.r.s { color: blue; }
        `,
      },
      hints: ["Во что разворачивается `& p` у родителя `.x, #y`?", "Какой вес у `:is(.x, #y) p`?"],
      checks: ["`&` → `:is(.x, #y)`", "Вес (1,0,1) выше (0,4,1)", "Исправление: разделить правила или `:where(&)`"],
      solution: [
        p("**Причина.** `& p` разворачивается в `:is(.x, #y) p`. Вес `:is()` — максимальный из аргументов, то есть `#y` (1,0,0): итог (1,0,1) больше (0,4,1). Это происходит даже когда элемент подошёл только по `.x` (замер: красный)."),
        code(
          "css",
          `
          /* 1. разделить правила */
          .x { & p { color: red; } }
          #y { & p { color: red; } }

          /* 2. снизить вес родителя */
          .x, #y { :where(&) p { color: red; } }          /* вес (0,0,1) */
          `,
        ),
        p("После разделения у `.x p` вес (0,1,1) — меньше (0,4,1), и победит синее. С `:where(&)` вес `p` (0,0,1), тоже меньше."),
      ],
    }),
    exercise({
      id: "css.nesting-modern.ex3",
      title: "Порядок объявлений и вложенных правил",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Определите итоговые цвета `.a` и `p` внутри. Объясните, почему на практике объявления лучше писать до вложенных правил."),
        code(
          "css",
          `
          .a {
            color: red;
            & p { color: blue; }
            color: green;
          }
          `,
        ),
      ],
      hints: ["К какому элементу относится `color: green`?", "Влияет ли вложенное правило на объявление родителя?"],
      checks: [".a — зелёный (замер)", "p — синий", "Рекомендация: объявления до вложенных правил"],
      solution: [
        p("`.a` получает зелёный (последнее объявление выигрывает), `p` — синий (вложенное правило); замер в Chromium подтвердил оба цвета. Но порядок объявлений относительно вложенных правил менялся между версиями спецификации и поддерживается не всеми инструментами одинаково, поэтому надёжный стиль — сначала объявления родителя, затем вложенные правила."),
        code(
          "css",
          `
          .a {
            color: green;
            & p { color: blue; }
          }
          `,
        ),
      ],
    }),
  ],

  challenge: {
    id: "css.nesting-modern.challenge",
    title: "Безопасная миграция плоского CSS во вложенный с тестом эквивалентности",
    scenario: [
      p("Команда переводит стили карточки на вложенный CSS. Первая попытка использовала `&__title` из Sass, и заголовок остался без стилей; вторая — `.a, .b { & … }` и неожиданно поменяла приоритеты. Нужно выполнить перенос и написать тест, который сравнивает **вычисленные стили плоской и вложенной версий** в нескольких состояниях."),
    ],
    requirements: [
      "Плоская версия: `.card`, `.card:hover`, `.card__title`, `.card__meta`, `.card--featured`, `.card--featured .card__title`, `@media (width >= 40rem)`",
      "Вложенная версия без склейки `&__…`, с объявлениями до вложенных правил",
      "Тест: для набора элементов и свойств сравнить `getComputedStyle` двух версий в состояниях: по умолчанию, наведение, ширина 800px",
      "Тест выводит расхождения и итог",
    ],
    constraints: [
      "Нельзя использовать `&__` и `&-` для составления имён классов",
      "Вложенность не глубже двух уровней",
    ],
    acceptance: [
      "Для всех проверяемых элементов и свойств плоская и вложенная версии дают одинаковые значения",
      "Заголовок `.card__title` в вложенной версии получает свои стили",
      "Тест находит ошибку, если заменить `.card__title` на `&__title`",
    ],
    hints: [
      "Как загрузить две версии стилей на одной странице для сравнения?",
      "Как смоделировать наведение и ширину в тесте?",
      "Какие свойства сравнивать?",
    ],
    solution: [
      code(
        "css",
        `
        /* плоская */
        .flat { padding: 1rem; border: 2px solid transparent; }
        .flat:hover { border-color: rgb(47, 61, 154); }
        .flat .card__title { margin: 0; font-size: 1.25rem; }
        .flat .card__meta { color: rgb(85, 85, 85); }
        .flat.card--featured { background: rgb(238, 240, 251); }
        .flat.card--featured .card__title { color: rgb(47, 61, 154); }
        @media (width >= 40rem) { .flat { padding: 1.5rem; } }

        /* вложенная */
        .nested {
          padding: 1rem;
          border: 2px solid transparent;

          &:hover { border-color: rgb(47, 61, 154); }
          .card__title { margin: 0; font-size: 1.25rem; }
          .card__meta { color: rgb(85, 85, 85); }
          &.card--featured { background: rgb(238, 240, 251); .card__title { color: rgb(47, 61, 154); } }

          @media (width >= 40rem) { padding: 1.5rem; }
        }
        `,
        { filename: "migration.css", lineNumbers: true },
      ),
      code(
        "js",
        `
        const props = ["paddingLeft", "borderTopColor", "backgroundColor", "marginTop", "fontSize", "color"];
        const pairs = [[".flat", ".nested"], [".flat .card__title", ".nested .card__title"], [".flat .card__meta", ".nested .card__meta"]];
        const read = (sel) => page.evaluate(([s, p]) => { const cs = getComputedStyle(document.querySelector(s)); return p.map((k) => cs[k]); }, [sel, props]);

        async function compare(label, hover) {
          if (!hover) await page.mouse.move(900, 700);      // убрать курсор с элементов
          for (const [a, b] of pairs) {
            if (hover) await page.hover(a);
            const x = await read(a);
            if (hover) await page.hover(b);
            const y = await read(b);
            const diff = props.filter((_, i) => x[i] !== y[i]);
            console.log(label, a, diff.length ? "РАСХОЖДЕНИЕ: " + diff.join(", ") : "ok");
          }
        }

        await page.setViewportSize({ width: 500, height: 800 });
        await compare("по умолчанию");
        await compare("наведение", true);               // каждый элемент измеряется под курсором
        await page.setViewportSize({ width: 800, height: 800 });
        await compare("800px");
        `,
        { filename: "migration.test.js" },
      ),
      ul(
        "**Идея:** обе версии лежат на одной странице под разными классами-корнями, поэтому можно сравнить вычисленные значения напрямую.",
        "**Опасные места:** склейка `&__title` (правило не применится — тест покажет расхождение для `.card__title`) и списки `& …` (изменится вес).",
        "**Вес:** `.nested.card--featured .card__title` весит (0,3,0), а плоское `.flat.card--featured .card__title` — тоже (0,3,0); при переносе проверяйте, что новые правила не стали тяжелее старых.",
      ),
    ],
  },

  interview: [
    iq("css.nesting-modern.i1", "basic", "Что такое вложенность в CSS и как она записывается?", [
      p("Правила стиля можно писать внутри других правил: `.card { &:hover { … } .title { … } @media (…) { … } }`. `&` — ссылка на родительский селектор; без `&` вложенный селектор означает потомка. Это родной синтаксис без препроцессора."),
    ]),
    iq("css.nesting-modern.i2", "basic", "Работает ли `&__title` как в Sass?", [
      p("Нет. `&` в родном CSS — целый селектор, а не строка, поэтому склейка `&__title` и `&-big` не работает (в замере правила не применились). Пишите `.card__title` полностью, а `&` используйте для состояний и вариантов (`&:hover`, `&.is-active`)."),
    ]),
    iq("css.nesting-modern.i3", "intermediate", "Как считается специфичность вложенных правил?", [
      p("`&` ведёт себя как `:is()` родительского списка: берётся наибольший вес. `.card { &:hover }` = `.card:hover` (0,2,0). Для `.x, #y { & p }` вес `:is(.x, #y) p` = (1,0,1) даже для элемента, подошедшего по `.x` (замер: перебило `.x p.q.r.s`). Вложенное `.a { .b { .c } }` весит как `.a .b .c`."),
    ]),
    iq("css.nesting-modern.i4", "intermediate", "Какие at-правила можно вкладывать?", [
      p("`@media`, `@supports`, `@container`, `@layer` (и `@scope`): объявления внутри них адресуются родительскому селектору. В замерах вложенные `@media`, `@supports`, `@container` и `@layer` сработали. `@keyframes` вкладывать нельзя."),
    ]),
    iq("css.nesting-modern.i5", "intermediate", "Как снизить вес вложенного селектора?", [
      p("`:where(&)` даёт нулевой вес родителя: `.a { :where(&) p { … } }` имеет вес `p` (0,0,1) — в замере проиграл более позднему `p`, тогда как `.a { & p }` (0,1,1) победило. Также помогает разделить родительский список на отдельные правила."),
    ]),
    iq("css.nesting-modern.i6", "advanced", "Что произойдёт с вложенным списком, содержащим неизвестный селектор?", [
      p("Список во вложенном правиле не прощает ошибок: `.a { &:unknown, & p { … } }` отбрасывается целиком (замер). Решение — завернуть сомнительную часть в `:is()` или разделить правила."),
    ]),
    iq("css.nesting-modern.i7", "engineering", "Как мигрировать большой проект на вложенный CSS?", [
      ul(
        "Определить правила: глубина ≤ 3, полные имена БЭМ, объявления перед вложенными правилами.",
        "Автоматизированная миграция с проверкой эквивалентности вычисленных стилей (тест на двух версиях).",
        "Линтер (`stylelint`): ограничение глубины, запрет склейки `&__`/`&-`, контроль веса.",
        "Запасной план для старых браузеров: сборка, разворачивающая вложенность.",
      ),
    ]),
    iq("css.nesting-modern.i8", "debugging", "Вложенное правило не применяется. Что проверите?", [
      ul(
        "Нет ли склейки `&__x` или `&-x` — она недопустима.",
        "Поддерживает ли браузер вложенность и упрощённую запись без `&`.",
        "Нет ли ошибки внутри списка селекторов (весь список отбрасывается).",
        "Не перебивает ли правило более тяжёлое: разверните вложенность в плоский селектор и посчитайте вес.",
        "Не вложено ли оно в неподходящее at-правило (например, `@keyframes`).",
      ),
    ]),
  ],

  exam: [
    mcq("css.nesting-modern.e1", "foundation", "Во что разворачивается `.card { &:hover { … } }`?", ["`.card :hover`", "`.card > :hover`", "`.card:hover`", "`:hover .card`"], 2, "`&` заменяется родителем без пробела: `.card:hover`."),
    mcq("css.nesting-modern.e2", "foundation", "Сработает ли `.card { &__title { color: red } }` в родном CSS?", ["Нет: `&` — селектор целиком, склейка невозможна", "Да, как `.card__title`", "Да, но только в Chrome", "Да, с `@import`"], 0, "В отличие от Sass, `&` не склеивается со строками: правило не применяется."),
    mcq("css.nesting-modern.e3", "intermediate", "Какой вес у вложенного `.x, #y { & p { … } }`?", ["(0,1,1)", "(1,1,1)", "(0,0,1)", "(1,0,1)"], 3, "`&` — это `:is(.x, #y)`: берётся самый специфичный аргумент `#y`, итог `:is(.x, #y) p` = (1,0,1)."),
    mcq("css.nesting-modern.e4", "intermediate", "Что означает вложенный `> .actions` внутри `.card`?", ["`.card .actions`", "`.card > .actions`", "`.card + .actions`", "Недопустимая запись"], 1, "Ведущий комбинатор разрешён: селектор разворачивается в `.card > .actions`."),
    mcq("css.nesting-modern.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["Внутрь правила можно вкладывать `@media`", "`@keyframes` можно вкладывать в правило стиля", "`.a { .b { … } }` весит как `.a .b`", "Вложенный список не прощает ошибок"], [0, 2, 3], "`@keyframes` определяют на верхнем уровне."),
    mcq("css.nesting-modern.e6", "advanced", "`.a { :where(&) p { color: red } } p { color: blue }` (второе правило позже). Какой цвет у `p` внутри `.a`?", ["Красный", "Ошибка", "Чёрный", "Синий"], 3, "`:where(&)` весит 0, итог `p` (0,0,1) — равен позднему `p`, побеждает порядок."),
    open("css.nesting-modern.e7", "intermediate", "Объясните, чем родная вложенность отличается от Sass и какие правила стоит принять в команде.", [
      ul(
        "Нет склейки строк: `&__title`, `&-big` не работают; БЭМ-имена пишут полностью.",
        "`&` — это `:is(родитель)`: вес берётся максимальный; глубина повышает специфичность.",
        "Правила: объявления до вложенных, глубина ≤ 2–3, вкладывать состояния, варианты и условия, линтер.",
      ),
    ], ["Нет склейки", "Специфичность `&`", "Правила команды"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.nesting-modern.m1", "intermediate", "`.card { .dark & { background: black } }` разворачивается в…", ["`.card .dark`", "`.dark.card`", "`.dark .card`", "Недопустимо"], 2, "`&` подставляется на своё место: `.dark .card`."),
    mcq("css.nesting-modern.m2", "advanced", "Вложенное `.page { .section { .card { .title { … } } } }`. Какой вес у `.title`?", ["(0,1,0)", "(0,4,0)", "(0,2,0)", "(0,3,0)"], 1, "Разворачивается в `.page .section .card .title`: четыре класса — (0,4,0)."),
    mcq("css.nesting-modern.m3", "advanced", "В браузере без поддержки вложенности встретилось `.a { color: red; & p { color: blue } }`. Что применится?", ["`color: red` для `.a`, вложенное правило проигнорировано", "Ничего", "Оба правила", "Ошибка разбора всего файла"], 0, "Объявления родителя работают, неизвестное вложенное правило отбрасывается. Для критичных стилей нужен плоский запасной вариант."),
    open("css.nesting-modern.m4", "advanced", "Спроектируйте политику использования вложенности в дизайн-системе: правила, инструменты, тесты.", [
      ul(
        "Правила: глубина ≤ 3, полные БЭМ-имена, объявления перед вложенными правилами, вложенность для состояний/вариантов/условий.",
        "Инструменты: `stylelint` (глубина, запрет склейки, контроль селекторов), сборка с разворачиванием для старых браузеров.",
        "Тесты: эквивалентность плоской и вложенной версий по вычисленным стилям; контроль веса.",
        "Взаимодействие: слои для приоритетов, `:where(&)` для баз; документация примеров.",
      ),
    ], ["Правила и ограничения", "Инструменты и сборка", "Тесты и документация"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.nesting-modern.f1", front: "`&`?", back: "Родительский селектор целиком (как `:is(родитель)`); без `&` вложенный селектор — потомок." },
    { id: "css.nesting-modern.f2", front: "`&__title` как в Sass?", back: "Не работает: нет склейки строк. Пишите `.card__title`." },
    { id: "css.nesting-modern.f3", front: "Вес `& p` при `.x, #y`?", back: "Максимальный аргумент: `:is(.x, #y) p` = (1,0,1)." },
    { id: "css.nesting-modern.f4", front: "Снизить вес родителя?", back: "`:where(&) p` — вес `p`." },
    { id: "css.nesting-modern.f5", front: "Что можно вкладывать?", back: "`@media`, `@supports`, `@container`, `@layer`; не `@keyframes`." },
    { id: "css.nesting-modern.f6", front: "Порядок записи?", back: "Сначала объявления, потом вложенные правила; глубина ≤ 2–3." },
  ],

  sources: [
    { title: "CSS Nesting Module", url: "https://www.w3.org/TR/css-nesting-1/", publisher: "W3C" },
    { title: "MDN: CSS nesting", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting", publisher: "MDN" },
    { title: "MDN: Using CSS nesting", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting", publisher: "MDN" },
    { title: "MDN: Nesting selector (&)", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Nesting_selector", publisher: "MDN" },
    { title: "Selectors Level 4: :is() and :where()", url: "https://www.w3.org/TR/selectors-4/#logical-combination", publisher: "W3C" },
  ],
};
