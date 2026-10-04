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

export const organizingCss: Topic = {
  id: "css.organizing-css",
  slug: "organizing-css",
  domain: "css",
  module: "architecture",
  title: "Организация CSS: слои, структура и контроль качества",
  titleEn: "Organizing CSS at scale: layers, file structure, layout primitives, @scope, quality gates",
  summary:
    "Большой CSS ломается не из-за свойств, а из-за порядка, веса и глобальности. Тема показывает, как организовать стили: порядок приоритетов через `@layer` (ITCSS в современном виде), структуру файлов, лёгкие компоновочные примитивы (stack, cluster), локальность через `@scope` (замеры: «бублик» и близость), метрики качества (число `#id`, `!important`, максимальная специфичность — со скриптом на `css-tree` и `@bramus/specificity`) и безопасную миграцию «старого» CSS.",
  minutes: 55,
  prerequisites: ["css.cascade-layers", "css.specificity", "css.custom-properties"],
  tags: ["architecture", "ITCSS", "@layer", "@scope", "layout primitives", "stylelint", "dead CSS", "specificity budget", "file structure", "migration", "CSS debt", "css-tree"],
  keyConcepts: [
    { term: "Порядок задаётся явно", text: "Одна строка `@layer reset, base, layout, components, utilities;` определяет приоритеты проекта. Порядок файлов в сборке больше не влияет на результат." },
    { term: "Слои вместо «войн специфичности»", text: "Внутри слоя селекторы остаются простыми (один класс), а победитель между слоями определяется порядком. Метрика здоровья: число `#id` и `!important` стремится к нулю." },
    { term: "Локальность", text: "Стили компонента лежат рядом с ним и не протекают наружу: префиксы имён, теневой DOM, CSS-модули или `@scope`. В замере `@scope (.card) to (.card__content)` стилизовал картинки в карточке, но не внутри `.card__content`." },
    { term: "Примитивы раскладки", text: "Небольшой набор универсальных паттернов (stack, cluster, sidebar, center) заменяет сотни одноразовых правил: отступы между элементами задаются в одном месте." },
    { term: "Качество измеряется", text: "Скрипт разбирает CSS и считает правила, `#id`, `!important`, максимальную специфичность. На примере: «плохой» файл — 3 `#id`, 2 `!important`, максимум (1,4,3); «хороший» — 0, 0, (0,2,0)." },
  ],
  sections: [
    section("definition", [
      def("Архитектура CSS", "Набор договорённостей о том, как делить стили на части, в каком порядке они применяются, как называются сущности и как контролируется качество. Цель — предсказуемость при росте кода и команды.", "CSS architecture"),
      def("ITCSS", "Inverted Triangle CSS: порядок стилей от общих и слабых (настройки, сброс, элементы) к специфичным и сильным (компоненты, утилиты). Сегодня естественно выражается через `@layer`.", "ITCSS"),
      def("Компоновочный примитив", "Небольшой переиспользуемый паттерн раскладки (`stack`, `cluster`, `sidebar`, `center`), который решает одну задачу и компонуется с другими.", "layout primitive"),
      def("Бюджет специфичности", "Договорённость о допустимом весе селекторов (например, не выше (0,2,0)), проверяемая линтером или скриптом.", "specificity budget"),
      def("Мёртвый CSS", "Правила, которые не применяются ни к одному элементу на реальных страницах. Увеличивают размер и усложняют поддержку.", "dead CSS"),
    ]),

    section("why", [
      h("Как «ломается» большой CSS"),
      ul(
        "**Порядок подключения.** Работает, пока файлы подключены в нужной последовательности; перестановка ломает страницу.",
        "**Гонка специфичности.** Чтобы перебить чужое правило, пишут ещё более тяжёлое или `!important`; вес только растёт.",
        "**Глобальность.** Класс `.title` в одном месте неожиданно влияет на другой экран.",
        "**Страх удаления.** Никто не знает, что ещё использует правило, поэтому его не удаляют — и CSS растёт.",
        "**Дублирование.** Одни и те же отступы и цвета заданы числами десятки раз.",
      ),
      h("Что даёт архитектура"),
      p("Хорошая организация делает изменения **локальными** (правка компонента не ломает другие), **предсказуемыми** (победитель определяется слоем, а не случайностью) и **проверяемыми** (метрики и тесты ловят деградацию). Это инвестиция в скорость команды, а не вопрос вкуса."),
      insight("Организация CSS — это набор **ограничений**, которые позволяют масштабироваться: порядок слоёв, потолок специфичности, один словарь токенов."),
    ]),

    section("mental-model", [
      p("Представьте **город**. Генплан (порядок слоёв) определяет зоны: сначала фундамент (токены и сброс), затем улицы (раскладка), дома (компоненты) и вывески (утилиты). Кварталы (компоненты) не лезут друг к другу в окна. Типовые детали (примитивы) используются везде. Инспекция (линтер и метрики) следит, чтобы никто не построил небоскрёб без разрешения — то есть селектор с `#id` и `!important`."),
      diagram(
        `
        @layer reset, tokens, base, layout, components, utilities;

        слабее ────────────────────────────────────────────────► сильнее
        reset     нормализация, box-sizing
        tokens    :root { --color-*, --space-*, --radius }          (переменные, не правила)
        base      body, h1, a — стили элементов
        layout    .stack, .cluster, .sidebar, .center              (примитивы раскладки)
        components .card, .btn, .menu                              (основная масса)
        utilities .u-text-center, .u-visually-hidden               (точечные исключения)

        внутри слоя: простые селекторы (один класс), специфичность ≤ (0,2,0)
        `,
        "Порядок слоёв как архитектурная схема",
      ),
    ]),

    section("technical", [
      h("Принципы"),
      ul(
        "**Явный порядок:** слои объявляются в самом первом файле.",
        "**Низкая специфичность:** компонент — один класс; составные селекторы — только для состояний.",
        "**Локальность:** стили живут рядом с компонентом и не протекают наружу.",
        "**Токены вместо чисел:** цвета, отступы и радиусы берутся из переменных.",
        "**Мало исключений:** `!important` и `#id` в селекторах запрещены линтером.",
      ),
      h("ITCSS на слоях"),
      table(
        ["ITCSS", "Слой", "Что внутри"],
        [
          ["Settings", "`tokens` (в `:root`)", "Переменные, значения по умолчанию"],
          ["Generic", "`reset`", "Нормализация, `box-sizing`, сброс отступов"],
          ["Elements", "`base`", "Стили голых элементов: `body`, `h1`, `a`, `button`"],
          ["Objects", "`layout`", "Примитивы раскладки без оформления"],
          ["Components", "`components`", "Классы компонентов (`.card`, `.btn`)"],
          ["Trumps", "`utilities`", "Однострочные классы-исключения"],
        ],
        "Соответствие ITCSS и `@layer`",
      ),
      code(
        "css",
        `
        /* main.css — единственная точка входа */
        @layer reset, tokens, base, layout, components, utilities;

        @import url("reset.css") layer(reset);
        @import url("tokens.css") layer(tokens);
        @import url("base.css") layer(base);
        @import url("layout.css") layer(layout);
        @import url("components/card.css") layer(components);
        @import url("components/button.css") layer(components);
        @import url("utilities.css") layer(utilities);
        `,
        { filename: "main.css" },
      ),
      p("В реальных проектах `@import` чаще выполняет сборщик (он склеивает файлы в один), но принцип тот же: список слоёв объявлен в начале, а каждый файл попадает в свой слой."),
      h("Структура файлов"),
      diagram(
        `
        styles/
          main.css              ← объявление слоёв и подключения
          reset.css
          tokens.css            ← :root { --color-…; --space-…; … }
          base.css
          layout.css            ← .stack, .cluster, .sidebar, .center
          components/
            button.css          ← всё про .btn: варианты, состояния, @media/@container
            card.css
            menu.css
          utilities.css
        `,
        "Файловая структура",
      ),
      ul(
        "**Компонент — один файл:** базовый вид, варианты, состояния и адаптивность рядом.",
        "**Файл не знает о соседях:** зависимости — только токены и примитивы.",
        "**Имена файлов = имена компонентов:** по классу сразу понятно, где его искать.",
        "**Страничные стили** (редкие исключения) — отдельный слой после `components` с понятным префиксом.",
      ),
      h("Компоновочные примитивы"),
      code(
        "css",
        `
        @layer layout {
          /* вертикальный ритм между потомками */
          :where(.stack) { display: flex; flex-direction: column; gap: var(--stack-gap, 1rem); }

          /* ряд с переносом: теги, кнопки */
          :where(.cluster) { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cluster-gap, 0.5rem); }

          /* центрированная колонка с полями */
          :where(.center) { box-sizing: content-box; max-inline-size: var(--measure, 60ch); margin-inline: auto; padding-inline: var(--center-pad, 1rem); }

          /* боковая панель: сворачивается без медиазапросов */
          :where(.sidebar) { display: flex; flex-wrap: wrap; gap: var(--sidebar-gap, 1rem); }
          :where(.sidebar) > :first-child { flex-basis: var(--sidebar-width, 16rem); flex-grow: 1; }
          :where(.sidebar) > :last-child { flex-basis: 0; flex-grow: 999; min-inline-size: 50%; }
        }
        `,
        { filename: "layout.css" },
      ),
      p("Примитивы пишут через `:where()`: вес нулевой, любой компонент может их перебить без борьбы за специфичность. Параметры задаются переменными (`--stack-gap`), поэтому один паттерн покрывает многие случаи."),
      h("Локальность: `@scope`"),
      code(
        "css",
        `
        @scope (.card) to (.card__content) {
          img { border-radius: 0.5rem; }            /* только картинки «рамки» карточки, не её содержимого */
        }
        `,
        { filename: "scope.css" },
      ),
      ul(
        "`@scope (корень) to (граница)` задаёт область «бубликом»: правило действует внутри корня, но не внутри границы. Замер: картинка в карточке получила стиль, картинка в `.card__content` и вне карточки — нет.",
        "**Близость побеждает порядок:** при двух областях (`.light` и `.dark`) вложенный `<p>` берёт стиль ближайшей, даже если дальняя описана позже (замер: победил синий из `.light`).",
        "**Специфичность:** неявный `:scope` не добавляет веса: `@scope (.card) { p { … } }` весит как `p` (0,0,1) и проиграл обычному `.card p` (0,1,1) в замере.",
        "**Поддержка:** `@scope` есть в современных браузерах не у всех одинаково давно — проверьте таблицы совместимости и держите запасной вариант (префиксы имён).",
      ),
      h("Контроль качества: линтер и метрики"),
      code(
        "json",
        `
        {
          "extends": ["stylelint-config-standard"],
          "rules": {
            "declaration-no-important": true,
            "selector-max-id": 0,
            "selector-max-specificity": "0,2,0",
            "max-nesting-depth": 2,
            "selector-class-pattern": "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9-]+)?(?:--[a-z0-9-]+)?$"
          }
        }
        `,
        { filename: ".stylelintrc.json" },
      ),
      p("Линтер ловит нарушения при каждом изменении. Для общей картины полезен скрипт-метрика: он разбирает CSS парсером и считает показатели:"),
      code(
        "js",
        `
        import * as csstree from "css-tree";
        import Specificity from "@bramus/specificity";

        export function analyze(css) {
          const ast = csstree.parse(css);
          const stats = { rules: 0, selectors: 0, ids: 0, important: 0, maxSpec: [0, 0, 0] };
          const greater = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

          csstree.walk(ast, {
            visit: "Rule",
            enter(rule) {
              if (rule.prelude.type !== "SelectorList") return;
              stats.rules++;
              rule.prelude.children.forEach((sel) => {
                const [s] = Specificity.calculate(csstree.generate(sel));
                stats.selectors++;
                if (s.a > 0) stats.ids++;
                if (greater([s.a, s.b, s.c], stats.maxSpec) > 0) stats.maxSpec = [s.a, s.b, s.c];
              });
            },
          });
          csstree.walk(ast, { visit: "Declaration", enter(d) { if (d.important) stats.important++; } });
          return stats;
        }
        `,
        { filename: "analyze-css.mjs" },
      ),
      table(
        ["Пример стилей", "Правил", "Селекторов с `#id`", "`!important`", "Максимальная специфичность"],
        [
          ["«Плохой»: `#app .page .sidebar ul li a.link:hover`, `#header nav a { … !important }`, цепочки из пяти классов", "6", "3", "2", "(1,4,3)"],
          ["«Хороший»: `.btn`, `.btn--primary`, `.card`, `.card__title`, `.card:hover`, `:where(.stack) > * + *`, `.u-text-center`", "7", "0", "0", "(0,2,0)"],
        ],
        "Замер скриптом на двух небольших файлах",
      ),
      p("Показатели можно проверять в CI: число `#id` и `!important` не должно расти, максимальная специфичность не должна превышать бюджет. Для размера — бюджет в килобайтах после сжатия; для мёртвого кода — панель Coverage в DevTools или инструменты анализа неиспользуемого CSS (результат нужно проверять вручную: динамические классы)."),
      h("Миграция старого CSS"),
      steps(
        [
          ["Фиксируем порядок", "Объявляем слои первой строкой проекта; весь старый CSS подключаем в слабый слой `legacy`: `@import url(\"legacy.css\") layer(legacy);`."],
          ["Измеряем", "Запускаем скрипт-метрику: сколько `#id`, `!important`, какая максимальная специфичность. Это стартовая точка."],
          ["Выносим по частям", "Переносим правила из `legacy` в `base`, `layout`, `components`, упрощая селекторы. Каждое перенесённое правило — тест визуальной регрессии."],
          ["Запрещаем ухудшение", "Линтер в CI: новые `#id` и `!important` недопустимы; бюджет специфичности — не хуже текущего."],
          ["Удаляем", "Когда `legacy` пуст, удаляем слой. Остаются только слои новой архитектуры."],
        ],
        "Безопасная миграция",
      ),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        @layer reset, tokens, base, layout, components, utilities;

        @layer tokens {
          :root { --space-m: 1rem; --color-accent: #2f3d9a; }
        }

        @layer layout {
          :where(.stack) { display: flex; flex-direction: column; gap: var(--stack-gap, var(--space-m)); }
        }

        @layer components {
          .btn { padding: 0.5rem 1rem; background: var(--color-accent); color: #fff; }
          .btn:hover { filter: brightness(1.1); }
        }

        @layer utilities {
          .u-hidden { display: none; }
        }
        `,
        [
          { line: 1, text: "Порядок слоёв — архитектурная схема проекта. Объявляется один раз, в самом начале." },
          { line: [3, 5], text: "Токены в слое `tokens`: переменные, а не правила. Доступны всем слоям ниже." },
          { line: [7, 9], text: "Примитив раскладки с нулевым весом (`:where`) и параметром `--stack-gap`." },
          { line: [11, 14], text: "Компонент — простые селекторы (один класс, класс + состояние). Победу над слоями ниже обеспечивает порядок слоёв." },
          { line: [16, 18], text: "Утилиты — сильнейший слой: побеждают компоненты без `!important`." },
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
        <title>Слои и примитивы</title>
        <style>
          @layer reset, tokens, base, layout, components, utilities;

          @layer reset { *, *::before, *::after { box-sizing: border-box; } body { margin: 0; } }
          @layer tokens { :root { --space-m: 1rem; --color-accent: #2f3d9a; --radius: 0.5rem; } }
          @layer base { body { padding: var(--space-m); font: 1rem/1.5 system-ui, sans-serif; } }
          @layer layout {
            :where(.stack) { display: flex; flex-direction: column; gap: var(--stack-gap, var(--space-m)); }
            :where(.cluster) { display: flex; flex-wrap: wrap; gap: var(--cluster-gap, 0.5rem); }
          }
          @layer components {
            .card { padding: var(--space-m); background: #eef0fb; border-radius: var(--radius); }
            .tag { padding: 0.125rem 0.5rem; color: #fff; background: var(--color-accent); border-radius: 999px; font-size: 0.875rem; }
          }
          @layer utilities { .u-tight { --stack-gap: 0.25rem; } }
        </style>
        <div class="stack">
          <article class="card stack">
            <h2>Карточка</h2>
            <p>Отступы между блоками задаёт примитив <code>stack</code>.</p>
            <div class="cluster"><span class="tag">css</span><span class="tag">архитектура</span><span class="tag">слои</span></div>
          </article>
          <article class="card stack u-tight">
            <h2>Плотная карточка</h2>
            <p>Утилита меняет только параметр <code>--stack-gap</code>.</p>
          </article>
        </div>
        </html>
        `,
        { filename: "layers-primitives.html", runnable: true },
      ),
      p("Весь CSS лежит в слоях, а отступы между блоками задаёт один примитив с параметром. Вариант «плотная карточка» не добавляет правил к компоненту — утилита лишь переопределяет переменную."),
    ]),

    section("detailed-example", [
      p("Мини-система: порядок слоёв, токены, примитивы раскладки, компонент карточки с `@container`, утилита и страница, собранная только из этих частей. На странице нет ни `#id`, ни `!important`, а специфичность не превышает (0,2,0)."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Мини-система на слоях</title>
        <style>
          @layer reset, tokens, base, layout, components, utilities;

          @layer reset { *, *::before, *::after { box-sizing: border-box; } body { margin: 0; } }

          @layer tokens {
            :root {
              --space-s: 0.5rem; --space-m: 1rem; --space-l: 2rem;
              --color-bg: #f4f5fb; --color-surface: #fff; --color-text: #1b1b1f; --color-accent: #2f3d9a;
              --radius: 0.5rem; --measure: 60rem;
            }
          }

          @layer base {
            body { padding: var(--space-m); font: 1rem/1.6 system-ui, sans-serif; color: var(--color-text); background: var(--color-bg); }
            h1, h2 { margin: 0; line-height: 1.2; }
            a { color: var(--color-accent); }
          }

          @layer layout {
            :where(.stack) { display: flex; flex-direction: column; gap: var(--stack-gap, var(--space-m)); }
            :where(.cluster) { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cluster-gap, var(--space-s)); }
            :where(.center) { max-inline-size: var(--measure); margin-inline: auto; }
            :where(.grid) { display: grid; gap: var(--space-m); grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
          }

          @layer components {
            .card { container-type: inline-size; padding: var(--space-m); background: var(--color-surface); border-radius: var(--radius); }
            .card__body { display: grid; gap: var(--space-s); }
            .card__meta { color: #555; font-size: 0.875rem; }
            @container (width >= 24rem) { .card__body { grid-template-columns: 1fr auto; align-items: center; } }

            .btn { display: inline-block; padding: var(--space-s) var(--space-m); color: #fff; text-decoration: none; background: var(--color-accent); border-radius: var(--radius); }
            .btn:focus-visible { outline: 3px solid #1b1b1f; outline-offset: 2px; }
          }

          @layer utilities { .u-tight { --stack-gap: var(--space-s); } .u-center-text { text-align: center; } }
        </style>
        <main class="center stack">
          <h1>Мини-система</h1>
          <div class="grid">
            <article class="card"><div class="card__body"><div class="stack u-tight"><h2>Первая</h2><p class="card__meta">Слои, токены, примитивы</p></div><a class="btn" href="#one">Открыть</a></div></article>
            <article class="card"><div class="card__body"><div class="stack u-tight"><h2>Вторая</h2><p class="card__meta">Контейнерный запрос внутри компонента</p></div><a class="btn" href="#two">Открыть</a></div></article>
          </div>
          <p class="u-center-text">Ни <code>#id</code>, ни <code>!important</code>: победителя выбирают слои.</p>
        </main>
        </html>
        `,
        { filename: "mini-system.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает"],
        [
          ["`@layer reset, tokens, base, layout, components, utilities;`", "Единый порядок приоритетов для всей страницы"],
          ["`:where(.stack)`, `:where(.grid)`", "Примитивы с нулевым весом: компонент может их переопределить, а параметры задаются переменными"],
          ["`.card { container-type: inline-size }` + `@container`", "Компонент сам решает, как выглядеть по ширине контейнера, и не зависит от окна"],
          ["`.u-tight { --stack-gap: … }`", "Утилита меняет параметр примитива, а не переписывает его правило"],
          ["Нет `#id` и `!important`", "Приоритет определяют слои; специфичность селекторов ограничена (0,2,0)"],
        ],
        "Как устроена страница",
      ),
      ul(
        "Весь «словарь» состоит из токенов, пяти примитивов и компонентов: новая страница собирается без нового CSS.",
        "Каждый слой отвечает за своё: изменить отступы — токены; изменить рамку карточки — компонент.",
        "Добавление нового компонента не ломает существующие: селекторы простые, а порядок слоёв зафиксирован.",
      ),
    ]),

    section("internals", [
      h("Почему порядок слоёв надёжнее порядка файлов"),
      p("Без слоёв победитель при равной специфичности определяется порядком подключения: перестановка `<link>` или изменение сборщика меняют результат. С `@layer` порядок записан в коде (первая строка), а специфичность сравнивается только внутри слоя. Поэтому простые селекторы и надёжная предсказуемость сочетаются."),
      h("Как работает `@scope`"),
      steps(
        [
          ["Корень области", "Селектор в скобках (`.card`) определяет элементы, к потомкам которых применяются правила внутри блока."],
          ["Граница («бублик»)", "Необязательная часть `to (.card__content)` исключает поддеревья: правила не действуют внутри границы."],
          ["Относительные селекторы", "Внутри блока селекторы разбираются относительно корня (`:scope`): `img` означает «картинка внутри корня»."],
          ["Близость", "При конфликте правил из разных областей, помимо специфичности, учитывается расстояние до корня: ближняя область побеждает дальнюю независимо от порядка в файле."],
        ],
        "Что делает `@scope`",
      ),
      note("Близость сравнивается **после** специфичности: правило с большим весом выигрывает у правила из ближней области. Неявный `:scope` веса не добавляет."),
      h("Как контролировать архитектуру в CI"),
      ul(
        "Линтер (`stylelint`) — запрет `!important`, `#id`, ограничение глубины и веса, шаблон имён классов.",
        "Скрипт-метрика — сводные числа и тренды (число `#id` и `!important` не растёт).",
        "Размер: бюджет сжатого файла; рост выше порога требует обоснования.",
        "Визуальные тесты: скриншоты ключевых страниц и состояний ловят регрессии при переносе правил.",
      ),
    ]),

    section("mistakes", [
      h("Ошибка 1. Слои для части кода"),
      p("Если часть стилей остаётся вне слоёв, она побеждает все слои (для обычных значений). Внеслойные стили — только осознанные. Начинайте миграцию с объявления порядка и слоя `legacy`."),
      h("Ошибка 2. Слишком много слоёв"),
      p("Десять слоёв «на всякий случай» превращают порядок в головоломку. 5–7 слоёв достаточно для большинства проектов; детали — внутри слоя селекторами и именованием."),
      h("Ошибка 3. Компоненты зависят друг от друга"),
      wrongRight(
        "css",
        {
          code: `
            .sidebar .card .title { font-size: 1.25rem; }       /* карточка знает о сайдбаре */
            .page .card { margin-top: 2rem; }                    /* страница лезет в компонент */
          `,
          note: "Компонент меняет вид в зависимости от места расположения: переносить его опасно, вес селекторов растёт.",
        },
        {
          code: `
            .card__title { font-size: 1.25rem; }
            .card--compact .card__title { font-size: 1rem; }     /* вариант самого компонента */
          `,
          note: "Вариант принадлежит компоненту; расположение определяет примитив раскладки (`stack`, `grid`).",
        },
      ),
      h("Ошибка 4. Примитивы с весом"),
      p("`.stack { … }` с весом класса мешает переопределению. Используйте `:where(.stack)` для примитивов: вес нулевой, конфликтов нет."),
      h("Ошибка 5. Токены, которые «все знают»"),
      p("Цвета и отступы, повторяющиеся числами по файлам, расходятся со временем. Любое значение, которое можно назвать, должно быть токеном."),
      h("Ошибка 6. Линтер без исключений и без обоснований"),
      p("Жёсткий запрет `!important` без объяснений приводит к обходам. Запишите исключения (утилита `.u-visually-hidden`, сторонний виджет), и пусть они проходят обзор."),
      h("Ошибка 7. Удаление «неиспользуемого» CSS по отчёту Coverage"),
      p("Coverage видит только то, что выполнилось на текущей странице. Динамические классы, состояния и редкие экраны покажутся «мёртвыми». Проверяйте на нескольких сценариях и по поиску в коде."),
      h("Ошибка 8. Архитектура без измерений"),
      p("Без метрик договорённости растворяются. Простая CI-проверка (число `#id`, `!important`, максимальная специфичность) заметит деградацию, пока она дёшева."),
    ]),

    section("antipatterns", [
      ul(
        "**Один гигантский файл** без слоёв и структуры.",
        "**Страничные переопределения** компонентов: `.page-home .card { … }`.",
        "**`!important` как стратегия** переопределения чужих стилей.",
        "**Каскад из десятков слоёв.**",
        "**Компоненты, зависящие от разметки родителя** (`.sidebar .card`).",
        "**Дублирование чисел** вместо токенов и примитивов.",
        "**Миграция «всё и сразу»** без `legacy`-слоя и тестов.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Первая строка:** `@layer reset, tokens, base, layout, components, utilities;`.",
        "**Один компонент — один файл,** простые селекторы, варианты и состояния рядом.",
        "**Примитивы через `:where()`,** параметры — переменными.",
        "**Бюджет:** специфичность ≤ (0,2,0), `#id` и `!important` — 0; проверка в CI.",
        "**Локальность:** префиксы или `@scope`; не стилизуйте чужие внутренности.",
        "**Токены на всё именуемое:** цвета, отступы, радиусы, тени.",
        "**Метрики и визуальные тесты** при миграции.",
        "**Документация:** схема слоёв, соглашения об именах, список исключений.",
      ),
    ]),

    section("edge-cases", [
      h("Сторонние библиотеки"),
      p("Подключайте через `@import … layer(vendor)` или оборачивайте при сборке в `@layer vendor`: так их можно переопределить без `!important`. Виджеты, вставляющие `<style>` без слоя, побеждают всё — изолируйте их в теневом DOM или `iframe`."),
      h("CSS-in-JS и CSS-модули"),
      p("CSS-модули и подходы с генерацией классов решают проблему глобальности иначе — хэшированием имён. Слои и токены полезны и в них: порядок и общие значения остаются вашей ответственностью."),
      h("Монорепозитории и несколько приложений"),
      p("Общая библиотека токенов и примитивов подключается как отдельный пакет; приложения добавляют свои слои после общих. Версионируйте токены как публичный API."),
      h("Тёмная тема и варианты"),
      p("Меняйте токены (`[data-theme]`), а не копируйте правила компонентов. Тогда число правил не растёт с числом тем."),
      h("Печать"),
      p("Печатные стили — отдельный слой с `@media print` либо блоки внутри компонентов. Не смешивайте их с утилитами экрана."),
      h("Производительность"),
      p("Организация не должна приводить к раздуванию: объединяйте файлы при сборке, удаляйте неиспользуемое, применяйте критический CSS для первого экрана."),
    ]),

    section("related", [
      ul(
        "[Каскадные слои](/learn/css/cascade-layers) — порядок приоритетов и миграция.",
        "[Специфичность](/learn/css/specificity) — расчёт веса и бюджеты.",
        "[Методологии CSS](/learn/css/methodologies) — БЭМ, утилиты, CUBE.",
        "[Дизайн-токены](/learn/css/design-tokens) — организация значений.",
        "[Управление специфичностью](/learn/css/specificity-management) — стратегии против «войн».",
        "[Вложенность CSS](/learn/css/nesting-modern) — родная вложенность в компонентах.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Плоский глобальный CSS",
          code: `
            #app .page .sidebar .card .title { font-size: 1.25rem !important; }
            .page-home .card { margin-top: 2rem; }
            .btn { background: #2f3d9a; }
            .toolbar .btn { background: #b3261e !important; }
          `,
          note: "Вес растёт, компоненты зависят от расположения, `!important` вместо порядка.",
        },
        {
          title: "Слои, токены и простые селекторы",
          code: `
            @layer reset, tokens, base, layout, components, utilities;
            @layer components {
              .card__title { font-size: 1.25rem; }
              .btn { background: var(--color-accent); }
              .btn--danger { background: var(--color-danger); }
            }
            @layer utilities { .u-mt-l { margin-top: var(--space-l); } }
          `,
          note: "Порядок слоёв определяет приоритет, селекторы — один класс; вариант принадлежит компоненту, исключения — утилиты.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.organizing-css.ex1",
      title: "Расставьте по слоям",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("Разнесите правила по слоям `reset`, `tokens`, `base`, `layout`, `components`, `utilities` и запишите порядок слоёв первой строкой."),
        code(
          "css",
          `
          *, *::before, *::after { box-sizing: border-box; }
          :root { --space-m: 1rem; }
          h1 { font-size: 2rem; }
          .stack { display: flex; flex-direction: column; gap: var(--space-m); }
          .card { padding: var(--space-m); background: #eef0fb; }
          .u-hidden { display: none; }
          `,
        ),
      ],
      hints: ["Что слабее всего?", "Где живут переменные?", "Где утилиты относительно компонентов?"],
      checks: ["Порядок объявлен списком", "`*` → reset; `:root` → tokens; `h1` → base", "`.stack` → layout; `.card` → components; `.u-hidden` → utilities"],
      solution: [
        code(
          "css",
          `
          @layer reset, tokens, base, layout, components, utilities;

          @layer reset      { *, *::before, *::after { box-sizing: border-box; } }
          @layer tokens     { :root { --space-m: 1rem; } }
          @layer base       { h1 { font-size: 2rem; } }
          @layer layout     { :where(.stack) { display: flex; flex-direction: column; gap: var(--space-m); } }
          @layer components { .card { padding: var(--space-m); background: #eef0fb; } }
          @layer utilities  { .u-hidden { display: none; } }
          `,
        ),
        p("Порядок записан явно; примитив `stack` обёрнут в `:where()`, чтобы его вес был нулевым."),
      ],
    }),
    exercise({
      id: "css.organizing-css.ex2",
      title: "Оцените «здоровье» стилей",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Для двух файлов определите число правил с `#id`, число `!important` и максимальную специфичность."),
        code(
          "css",
          `
          /* A */
          #app .page .sidebar ul li a.link:hover { color: red !important; }
          #header nav a { color: #333 !important; }
          div.container > div.row > div.col .btn.btn-primary { background: blue; }
          .page .content p span.note { color: gray; }
          .a .b .c .d .e { margin: 0; }
          body #main .card .title { font-size: 2rem; }

          /* B */
          .btn { padding: 0.5rem 1rem; }
          .card:hover { box-shadow: 0 2px 8px #0003; }
          :where(.stack) > * + * { margin-block-start: 1rem; }
          `,
        ),
      ],
      hints: ["Как считать вес `a.link:hover` и `:where(…)`?", "Сколько селекторов начинаются с `#`?"],
      checks: ["A: 3 селектора с `#id`", "A: 2 `!important`", "A: максимум (1,4,3)", "B: 0 / 0 / (0,2,0)"],
      solution: [
        ul(
          "**A:** `#id` в трёх селекторах (`#app`, `#header`, `#main`), два `!important`, максимальная специфичность `#app .page .sidebar ul li a.link:hover` = (1,4,3): `#app` — (1,0,0), `.page .sidebar .link :hover` — четыре класса/псевдокласса, `ul li a` — три типа.",
          "**B:** без `#id`, без `!important`; максимум (0,2,0) у `.card:hover` (класс + псевдокласс); `:where(.stack) > * + *` весит (0,0,0).",
        ),
        p("Эти же числа дал скрипт `analyze-css.mjs` на файлах такого вида: «плохой» — 3 / 2 / (1,4,3), «хороший» — 0 / 0 / (0,2,0)."),
      ],
    }),
    exercise({
      id: "css.organizing-css.ex3",
      title: "Миграция без поломок",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Проект: 12 000 строк старого CSS в одном файле, половина правил с `#id`, повсюду `!important`. Нужно перейти на слои, не сломав страницы. Опишите шаги, метрики и защитные проверки."),
      ],
      hints: ["Как «заморозить» старый CSS в слабом слое?", "Что измерять и как не дать ухудшиться?", "Чем проверять визуальные регрессии?"],
      checks: ["Слой `legacy` и порядок слоёв", "Метрики и линтер в CI", "Поэтапный перенос с визуальными тестами"],
      solution: [
        ul(
          "**Порядок:** `@layer legacy, reset, tokens, base, layout, components, utilities;` и `@import url(\"old.css\") layer(legacy);` — старый CSS становится самым слабым слоем, новые слои побеждают его без `!important`.",
          "**Метрики:** скрипт фиксирует стартовые числа (правила, `#id`, `!important`, максимум специфичности, размер); цель — только улучшение.",
          "**CI:** линтер запрещает новые `#id` и `!important` в новых файлах; бюджет специфичности (0,2,0) для слоёв, кроме `legacy`.",
          "**Перенос по экранам/компонентам:** правило → простой селектор → слой; для каждого — скриншоты до/после (Playwright).",
          "**Финал:** когда `legacy` пуст, удаляем его и `!important`-исключения; фиксируем схему слоёв в документации.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "css.organizing-css.challenge",
    title: "CI-проверка качества CSS: слои, `#id`, `!important`, специфичность",
    scenario: [
      p("Команда договорилась о правилах (все стили в слоях, без `#id` и `!important`, специфичность не выше (0,2,0)), но через месяц они нарушены. Нужно написать скрипт, который разбирает CSS и **падает в CI**, если договорённости нарушены, и выдаёт отчёт."),
    ],
    requirements: [
      "Разбор CSS парсером (`css-tree`), расчёт специфичности через `@bramus/specificity`",
      "Метрики: число правил, число селекторов с `#id`, число `!important`, максимальная специфичность",
      "Проверка: правила вне `@layer` (кроме `@layer`-объявлений и `@import … layer`)",
      "Пороги: `#id` = 0, `!important` = 0, максимум не выше (0,2,0), внеслойных правил = 0",
      "Отчёт со списком нарушителей (селектор и причина) и код выхода 1 при нарушениях",
    ],
    constraints: [
      "Нельзя использовать регулярные выражения для разбора селекторов",
      "Нельзя проверять только «на глаз» — нужен автоматический запуск",
    ],
    acceptance: [
      "Для «плохого» файла: нарушителей больше нуля, код выхода 1",
      "Для «хорошего» файла (всё в слоях, простые селекторы): нарушителей нет, код выхода 0",
      "Правила `:where(…)` не считаются тяжёлыми (вес 0)",
      "Отчёт указывает причину для каждого нарушения",
    ],
    hints: [
      "Как отличить правило верхнего уровня от правила внутри `@layer`?",
      "Как получить число из специфичности для сравнения?",
      "Как завершить процесс с ненулевым кодом?",
    ],
    solution: [
      code(
        "js",
        `
        import * as csstree from "css-tree";
        import Specificity from "@bramus/specificity";
        import fs from "node:fs";

        const MAX = [0, 2, 0];
        const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

        export function check(css) {
          const ast = csstree.parse(css);
          const problems = [];

          // 1. правила вне слоёв: Rule, лежащее прямо в корне таблицы
          ast.children.forEach((node) => {
            if (node.type === "Rule") problems.push({ selector: csstree.generate(node.prelude), reason: "правило вне @layer" });
          });

          // 2. селекторы и важность во всех правилах (включая вложенные в слои)
          csstree.walk(ast, {
            visit: "Rule",
            enter(rule) {
              if (rule.prelude.type !== "SelectorList") return;
              rule.prelude.children.forEach((sel) => {
                const text = csstree.generate(sel);
                const [s] = Specificity.calculate(text);
                if (s.a > 0) problems.push({ selector: text, reason: "содержит #id" });
                if (cmp([s.a, s.b, s.c], MAX) > 0) problems.push({ selector: text, reason: "специфичность (" + s.a + "," + s.b + "," + s.c + ") выше бюджета (0,2,0)" });
              });
            },
          });
          csstree.walk(ast, { visit: "Declaration", enter(d) { if (d.important) problems.push({ selector: d.property, reason: "!important" }); } });
          return problems;
        }

        const css = fs.readFileSync(process.argv[2], "utf8");
        const problems = check(css);
        for (const p of problems) console.log("✗", p.selector, "—", p.reason);
        console.log(problems.length ? problems.length + " нарушений" : "ok");
        process.exit(problems.length ? 1 : 0);
        `,
        { filename: "check-css.mjs", lineNumbers: true },
      ),
      ul(
        "**Вне слоёв:** прямые дети корня AST типа `Rule` — внеслойные правила; `@layer`-блоки и `@import` проблемой не являются.",
        "**Вес:** `Specificity.calculate` возвращает `a, b, c`; `:where(…)` даёт ноль, поэтому примитивы не попадают в нарушители.",
        "**CI:** `process.exit(1)` при нарушениях останавливает конвейер.",
        "**Отчёт:** селектор и причина для каждого нарушения — задача для быстрого исправления.",
      ),
    ],
  },

  interview: [
    iq("css.organizing-css.i1", "basic", "Как организовать большой CSS-проект?", [
      p("Слоями: `@layer reset, tokens, base, layout, components, utilities;` в самом начале; один компонент — один файл с простыми селекторами; токены вместо чисел; примитивы раскладки; линтер и метрики в CI. Порядок приоритетов определяют слои, а не порядок файлов или вес селекторов."),
    ]),
    iq("css.organizing-css.i2", "basic", "Что такое ITCSS и как он связан с `@layer`?", [
      p("ITCSS упорядочивает стили от общих и слабых (настройки, сброс, элементы) к частным и сильным (компоненты, утилиты). Каскадные слои выражают этот порядок в самом CSS: каждый уровень ITCSS соответствует слою."),
    ]),
    iq("css.organizing-css.i3", "intermediate", "Зачем примитивы раскладки писать через `:where()`?", [
      p("У `:where()` нулевая специфичность: примитив (`stack`, `cluster`) легко переопределить любым компонентом без борьбы за вес. Параметры задаются переменными (`--stack-gap`), поэтому утилита меняет значение, а не переписывает правило."),
    ]),
    iq("css.organizing-css.i4", "intermediate", "Как работает `@scope` и чем он отличается от вложенности?", [
      p("`@scope (.card) to (.card__content)` ограничивает область действия правил: они применяются внутри корня, но не внутри границы («бублик»). Близость областей участвует в каскаде после специфичности. Вложенность лишь сокращает запись селекторов и не ограничивает область (замер: `img` в карточке получил стиль, в `.card__content` — нет)."),
    ]),
    iq("css.organizing-css.i5", "intermediate", "Какие метрики качества CSS вы бы измеряли?", [
      ul(
        "Число селекторов с `#id` и деклараций `!important`.",
        "Максимальная и распределение специфичности (бюджет, например, ≤ (0,2,0)).",
        "Доля правил вне слоёв; глубина вложенности.",
        "Размер (сжатый) и доля неиспользуемого кода по Coverage.",
      ),
    ]),
    iq("css.organizing-css.i6", "advanced", "Как безопасно мигрировать старый CSS на слои?", [
      ul(
        "Объявить порядок слоёв и подключить весь старый CSS в слой `legacy`.",
        "Снять метрики, включить линтер для нового кода.",
        "Переносить по компонентам с визуальными тестами; упрощать селекторы.",
        "Удалить `legacy`, когда он пуст.",
      ),
    ]),
    iq("css.organizing-css.i7", "engineering", "Как предотвратить деградацию архитектуры CSS со временем?", [
      ul(
        "Автоматические проверки в CI: линтер и скрипт-метрики с порогами.",
        "Обзор кода по чек-листу: слой, токены, простота селектора, отсутствие `!important`.",
        "Документация схемы слоёв и соглашений; обучение команды.",
        "Регулярная чистка мёртвого кода и пересмотр исключений.",
      ),
    ]),
    iq("css.organizing-css.i8", "debugging", "Новое правило в компоненте «не работает». Что проверите?", [
      ul(
        "В каком слое лежит правило и нет ли внеслойного/более позднего слоя, который побеждает.",
        "Нет ли `!important` или `#id` в старом коде; специфичность в панели Styles.",
        "Не мешает ли примитив с весом (должен быть `:where()`).",
        "Подключён ли файл в нужный слой и в правильном порядке (CSSOM).",
      ),
    ]),
  ],

  exam: [
    mcq("css.organizing-css.e1", "foundation", "Как зафиксировать порядок приоритетов в проекте?", ["Порядком `<link>`", "Увеличением специфичности", "Первой строкой `@layer a, b, c;`", "`!important` в каждом правиле"], 2, "Объявление порядка слоёв в начале определяет приоритеты независимо от порядка файлов."),
    mcq("css.organizing-css.e2", "foundation", "Где в архитектуре на слоях живут переменные (токены)?", ["В `:root` внутри слоя `tokens`", "В слое `utilities`", "В каждом компоненте отдельно", "В `!important`"], 0, "Токены — общий словарь; их размещают в `:root` слоя `tokens`."),
    mcq("css.organizing-css.e3", "intermediate", "Почему примитивы раскладки пишут в `:where()`?", ["Чтобы они работали быстрее", "Чтобы создать слой", "Чтобы отключить наследование", "Чтобы их вес был нулевым и их легко переопределить"], 3, "Нулевая специфичность исключает «войну весов» между примитивом и компонентом."),
    mcq("css.organizing-css.e4", "intermediate", "Что делает `@scope (.card) to (.card__content) { img { … } }`?", ["Стилизует все картинки на странице", "Стилизует картинки в карточке, кроме находящихся внутри `.card__content`", "Стилизует только `.card__content`", "Ничего"], 1, "`to` задаёт границу «бублика»: внутри неё правила не действуют."),
    mcq("css.organizing-css.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["Неявный `:scope` добавляет вес селектору", "Ближняя область `@scope` побеждает дальнюю независимо от порядка (при равной специфичности)", "Линтер `selector-max-id: 0` запрещает `#id` в селекторах", "Правило вне слоя слабее правила в слое"], [1, 2], "Неявный `:scope` веса не добавляет, а внеслойные правила сильнее слойных."),
    mcq("css.organizing-css.e6", "advanced", "Скрипт вернул для файла: `#id` = 3, `!important` = 2, максимум (1,4,3). Что это значит?", ["Файл здоров", "Нужно добавить слои", "Нарушен только бюджет размера", "Нарушены бюджеты `#id`, `!important` и специфичности"], 3, "При бюджете (0 `#id`, 0 `!important`, ≤ (0,2,0)) все три показателя превышены."),
    open("css.organizing-css.e7", "intermediate", "Опишите, как вы организуете CSS нового проекта: слои, файлы, правила и проверки.", [
      ul(
        "Слои: `reset, tokens, base, layout, components, utilities`; порядок — первой строкой.",
        "Файлы: компонент — файл; примитивы раскладки через `:where()`; токены в `tokens`.",
        "Правила: один класс на селектор, без `#id` и `!important`, локальность; проверки линтером и скриптом-метрикой в CI.",
      ),
    ], ["Слои и порядок", "Файлы и примитивы", "Правила и CI"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.organizing-css.m1", "intermediate", "Где окажется старый CSS при миграции, чтобы новые слои его побеждали?", ["В самом сильном слое", "Вне слоёв", "В слое `legacy`, объявленном первым", "В `utilities`"], 2, "Слабый слой `legacy` проигрывает всем последующим слоям; внеслойные стили, наоборот, победили бы."),
    mcq("css.organizing-css.m2", "advanced", "`@scope (.card) { p { color: blue } }` и `.card p { color: red }` (позже). Какой цвет у `<p>` в карточке?", ["Синий", "Красный", "Чёрный", "Зависит от порядка"], 1, "Вес `@scope`-правила — (0,0,1), а `.card p` — (0,1,1): специфичность выше у обычного правила."),
    mcq("css.organizing-css.m3", "advanced", "Что покажет Coverage в DevTools для редко используемого состояния компонента?", ["Правило как неиспользуемое, если состояние не воспроизводилось", "Всегда верный отчёт", "Ошибку", "Правило с `!important`"], 0, "Coverage отражает выполнение на конкретной странице; динамические состояния нужно воспроизвести или проверять другими способами."),
    open("css.organizing-css.m4", "advanced", "Спроектируйте архитектуру CSS для продукта с 5 командами и общей библиотекой: слои, пакеты, правила, тесты.", [
      ul(
        "Общий пакет: токены, сброс, базовые стили, примитивы; версионирование как у публичного API.",
        "Слои: общий порядок объявляется в пакете; команды добавляют компоненты в `components` и свои слои после общих.",
        "Правила: простые селекторы, запрет `#id` и `!important`, шаблон имён, локальность (`@scope`/префиксы).",
        "Контроль: линтер и скрипт-метрики в CI каждой команды; визуальные тесты; отчёт по трендам.",
        "Процесс: документация, обзор изменений токенов и примитивов, план удаления `legacy`.",
      ),
    ], ["Пакет и слои", "Правила и локальность", "Контроль и процесс"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.organizing-css.f1", front: "Слои проекта?", back: "`@layer reset, tokens, base, layout, components, utilities;` — порядок первой строкой." },
    { id: "css.organizing-css.f2", front: "Примитивы раскладки?", back: "`:where(.stack)`, `.cluster`, `.sidebar`, `.center`: нулевой вес, параметры переменными." },
    { id: "css.organizing-css.f3", front: "`@scope` «бублик»?", back: "`@scope (.card) to (.card__content)`: правила внутри корня, но не внутри границы; близость побеждает порядок." },
    { id: "css.organizing-css.f4", front: "Бюджет качества?", back: "`#id` = 0, `!important` = 0, специфичность ≤ (0,2,0), внеслойных правил = 0 — проверка в CI." },
    { id: "css.organizing-css.f5", front: "Миграция?", back: "Порядок слоёв → `legacy` → метрики → перенос по частям → удалить `legacy`." },
    { id: "css.organizing-css.f6", front: "Coverage?", back: "Показывает использование только на выполненных сценариях; не удаляйте по нему слепо." },
  ],

  sources: [
    { title: "CSS Cascading and Inheritance Level 5: Cascade Layers", url: "https://www.w3.org/TR/css-cascade-5/#layering", publisher: "W3C" },
    { title: "CSS Cascading and Inheritance Level 6: Scoping (@scope)", url: "https://www.w3.org/TR/css-cascade-6/", publisher: "W3C" },
    { title: "MDN: @scope", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@scope", publisher: "MDN" },
    { title: "MDN: @layer", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@layer", publisher: "MDN" },
    { title: "stylelint: rules", url: "https://stylelint.io/user-guide/rules/", publisher: "Other" },
    { title: "css-tree (парсер CSS)", url: "https://github.com/csstree/csstree", publisher: "Other" },
    { title: "@bramus/specificity", url: "https://github.com/bramus/specificity", publisher: "Other" },
  ],
};
