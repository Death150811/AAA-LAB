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

export const designTokens: Topic = {
  id: "css.design-tokens",
  slug: "design-tokens",
  domain: "css",
  module: "architecture",
  title: "Дизайн-токены: от палитры до компонентов",
  titleEn: "Design tokens: primitive, semantic and component tiers, DTCG format, theming, contrast checks, build pipeline",
  summary:
    "Дизайн-токены — именованные значения (цвета, отступы, радиусы, шрифты), общий словарь дизайнеров и разработчиков. Тема разбирает три уровня (примитивные → семантические → компонентные), формат W3C Design Tokens (`$value`, `$type`, ссылки `{color.blue.500}`), темы через переопределение семантического уровня, шкалы (отступы, типографика), скрипт сборки JSON → CSS-переменные с проверкой ссылок, циклов и контраста (в замере: 17.17 и 9.31 в светлой теме, 13.02 и 9.07 в тёмной) и правила использования в компонентах.",
  minutes: 50,
  prerequisites: ["css.custom-properties", "css.organizing-css"],
  tags: ["design tokens", "DTCG", "custom properties", "theming", "semantic tokens", "primitive tokens", "contrast", "type scale", "spacing scale", "build pipeline", "design system", "color-scheme"],
  keyConcepts: [
    { term: "Три уровня", text: "**Примитивы** (`--color-blue-500`) — палитра и шкалы; **семантика** (`--accent`, `--surface`) — роли; **компонентные** (`--btn-bg`) — параметры компонента. Компоненты читают только семантику и свои токены." },
    { term: "Тема — смена семантики", text: "Светлая и тёмная темы отличаются только значениями семантических токенов: `--surface` указывает на `--color-white` или `--color-gray-800`. Правила компонентов не меняются." },
    { term: "Токены — данные, не код", text: "Источник правды — JSON (формат DTCG: `$value`, `$type`, ссылки `{группа.имя}`); из него скрипт генерирует CSS, JS и документацию. Ссылки сохраняются как `var()`, чтобы связь «алиас → значение» была видна в браузере." },
    { term: "Проверка при сборке", text: "Сборка падает при несуществующей ссылке, цикле или недостаточном контрасте пары «цвет текста / фон». Замер: `surface/on-surface` 17.17 и `accent/on-accent` 9.31 (светлая), 13.02 и 9.07 (тёмная) — все выше 4.5." },
    { term: "Шкалы вместо произвольных значений", text: "Отступы (`0.5rem, 1rem, 2rem`) и размеры текста (ряд с множителем 1.25: 0.8, 1, 1.25, 1.5625, 1.953…) ограничивают выбор и делают интерфейс единообразным." },
  ],
  sections: [
    section("definition", [
      def("Дизайн-токен", "Именованное значение дизайна (цвет, отступ, радиус, шрифт, тень, длительность), хранимое независимо от платформы и используемое в коде и в дизайн-инструментах.", "design token"),
      def("Примитивный токен", "Базовое значение без смысла: `--color-blue-500`, `--space-2`. Образует палитру и шкалы.", "primitive / global token"),
      def("Семантический токен", "Роль значения в интерфейсе: `--surface`, `--on-surface`, `--accent`, `--border`. Ссылается на примитив; именно его меняют темы.", "semantic / alias token"),
      def("Компонентный токен", "Параметр конкретного компонента: `--btn-bg`, `--card-pad`. Ссылается на семантику и допускает локальное переопределение.", "component token"),
      def("Формат DTCG", "Формат обмена токенами, разрабатываемый сообществом W3C (Design Tokens Community Group): значения в `$value`, типы в `$type`, ссылки в фигурных скобках `{color.blue.500}`.", "Design Tokens format (DTCG)"),
    ]),

    section("why", [
      h("Проблема: «магические числа» и расхождения"),
      p("В продукте десятки оттенков «почти синего» и отступы от 13px до 17px. Дизайнеры называют цвета в своих терминах, разработчики — в своих. Смена бренда или добавление тёмной темы превращается в поиск и замену по сотням файлов."),
      h("Что дают токены"),
      ul(
        "**Единый словарь:** дизайн и код говорят о `--accent` и `--space-2`, а не о `#2f3d9a` и `16px`.",
        "**Темы без копирования:** новая тема — новый набор значений семантических токенов.",
        "**Единообразие:** шкалы ограничивают выбор; произвольные значения становятся заметными исключениями.",
        "**Автоматизация:** из одного источника получаются CSS, платформенные файлы и документация; сборка проверяет ссылки и контраст.",
        "**Безопасные изменения:** правка одного токена затрагивает всё, где он используется.",
      ),
      insight("Токены — это не «переменные CSS», а **контракт** между дизайном и кодом. CSS-переменные — лишь способ доставить его в браузер."),
    ]),

    section("mental-model", [
      p("Представьте **палитру художника и подписанные тюбики**. Примитивы — краски на столе («кобальт», «умбра»). Семантика — ярлыки на баночках с назначением («фон стены», «цвет акцента»). Компонентные токены — рабочие смеси для конкретной работы («цвет кнопки»). Чтобы перекрасить комнату для ночного режима, меняют, **какая краска стоит под ярлыком**, а не переписывают инструкцию к каждой работе."),
      diagram(
        `
        Примитивы (палитра, шкалы)         Семантика (роли, темы)              Компоненты (параметры)
        --color-blue-500: #2f3d9a   ◄──    --accent  (light)                    --btn-bg: var(--accent)
        --color-blue-300: #aab4f0   ◄──    --accent  (dark)        ◄──────      .btn { background: var(--btn-bg) }
        --color-white:    #ffffff   ◄──    --surface (light)
        --color-gray-800: #1f2133   ◄──    --surface (dark)
        --space-2:        1rem      ◄──    --space-card                         --card-pad: var(--space-card)

        компоненты НЕ читают примитивы напрямую; тема переключает только средний уровень
        `,
        "Три уровня токенов",
      ),
      table(
        ["Уровень", "Пример", "Меняется при смене темы?", "Кто использует"],
        [
          ["Примитив", "`--color-blue-500: #2f3d9a`", "Нет", "Только семантический уровень и документация палитры"],
          ["Семантика", "`--accent: var(--color-blue-500)`", "Да", "Компоненты и страницы"],
          ["Компонент", "`--btn-bg: var(--accent)`", "Нет (следует за семантикой)", "Правила одного компонента, варианты и переопределения"],
        ],
        "Роли уровней",
      ),
    ]),

    section("technical", [
      h("Три уровня в CSS"),
      code(
        "css",
        `
        :root {
          /* 1. примитивы */
          --color-white: #ffffff;
          --color-blue-500: #2f3d9a;
          --color-blue-300: #aab4f0;
          --color-gray-800: #1f2133;
          --space-2: 1rem;
        }

        :root, [data-theme="light"] {
          color-scheme: light;
          /* 2. семантика */
          --surface: var(--color-white);
          --accent: var(--color-blue-500);
        }
        [data-theme="dark"] {
          color-scheme: dark;
          --surface: var(--color-gray-800);
          --accent: var(--color-blue-300);
        }

        .btn {
          /* 3. компонентные токены с запасным значением из семантики */
          background: var(--btn-bg, var(--accent));
          padding: var(--btn-pad, var(--space-2));
        }
        `,
        { filename: "tokens.css" },
      ),
      h("Именование"),
      ul(
        "**Примитивы:** `--категория-оттенок-шаг` (`--color-blue-500`, `--space-3`, `--radius-2`). Числа — позиция на шкале, а не значение.",
        "**Семантика:** по роли, не по виду (`--accent`, `--surface`, `--on-surface`, `--border-subtle`, `--danger`). Пары `фон` и `on-фон` определяют вместе.",
        "**Компоненты:** с префиксом компонента (`--btn-bg`, `--card-pad`).",
        "**Не называйте токены цветами** (`--blue-button`): при смене бренда имя станет ложью.",
      ),
      h("Формат DTCG и ссылки"),
      code(
        "json",
        `
        {
          "color": {
            "$type": "color",
            "white": { "$value": "#ffffff" },
            "blue": { "300": { "$value": "#aab4f0" }, "500": { "$value": "#2f3d9a" } },
            "gray": { "100": { "$value": "#e8e8f0" }, "800": { "$value": "#1f2133" }, "900": { "$value": "#1b1b1f" }, "950": { "$value": "#14151f" } }
          },
          "space": { "$type": "dimension", "1": { "$value": "0.5rem" }, "2": { "$value": "1rem" }, "3": { "$value": "2rem" } }
        }
        `,
        { filename: "tokens.json" },
      ),
      ul(
        "`$value` — значение, `$type` — тип (`color`, `dimension`, `fontFamily`, `duration`, …); тип можно задавать на группе, и он наследуется потомками.",
        "Ссылка на другой токен записывается в фигурных скобках по пути: `{color.blue.500}`.",
        "Формат находится в разработке сообществом W3C: проверяйте актуальную редакцию спецификации и совместимость инструментов.",
      ),
      h("Сборка: JSON → CSS с проверками"),
      code(
        "js",
        `
        const themes = {
          light: { "surface": "{color.white}", "on-surface": "{color.gray.900}", "accent": "{color.blue.500}", "on-accent": "{color.white}" },
          dark:  { "surface": "{color.gray.800}", "on-surface": "{color.gray.100}", "accent": "{color.blue.300}", "on-accent": "{color.gray.950}" },
        };

        function flatten(node, path = [], out = new Map()) {
          for (const [key, value] of Object.entries(node)) {
            if (key === "$type") continue;
            if (value && typeof value === "object" && "$value" in value) out.set(path.concat(key).join("."), value.$value);
            else if (value && typeof value === "object") flatten(value, path.concat(key), out);
          }
          return out;
        }

        const prim = flatten(tokens);
        const cssName = (path) => "--" + path.replace(/\\./g, "-");

        function resolve(ref, seen = []) {                        // конечное значение с проверкой ссылок
          const m = /^\\{(.+)\\}$/.exec(ref);
          if (!m) return ref;
          if (seen.includes(m[1])) throw new Error("цикл: " + [...seen, m[1]].join(" → "));
          if (!prim.has(m[1])) throw new Error("нет токена: " + m[1]);
          return resolve(prim.get(m[1]), [...seen, m[1]]);
        }

        let css = ":root {\\n";
        for (const [path, value] of prim) css += "  " + cssName(path) + ": " + value + ";\\n";
        css += "}\\n";
        for (const [theme, map] of Object.entries(themes)) {
          css += (theme === "light" ? ':root, [data-theme="light"]' : '[data-theme="' + theme + '"]') + " {\\n";
          for (const [role, ref] of Object.entries(map)) css += "  --" + role + ": var(" + cssName(ref.slice(1, -1)) + ");\\n";
          css += "}\\n";
        }
        `,
        { filename: "build-tokens.mjs" },
      ),
      p("Скрипт плоско разворачивает группы, создаёт CSS-переменные примитивов и для каждой темы — семантические переменные как `var()`-ссылки. Ссылки остаются ссылками: в DevTools видна цепочка `--accent → --color-blue-500 → #2f3d9a`. Функция `resolve` вычисляет конечное значение и сообщает об ошибках: на несуществующий путь `{color.nope}` она выбросила `нет токена: color.nope`, а цикл выявляется по списку посещённых путей."),
      p("Результат сборки (фрагмент): примитивы вида `--color-blue-500: #2f3d9a;`, светлая тема (`:root, [data-theme=\"light\"]`) с `--surface: var(--color-white); --on-surface: var(--color-gray-900); --accent: var(--color-blue-500);` и тёмная (`[data-theme=\"dark\"]`) с `--surface: var(--color-gray-800); --accent: var(--color-blue-300);`."),
      h("Проверка контраста при сборке"),
      code(
        "js",
        `
        const lum = (hex) => {
          const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
          const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

        let failed = false;
        for (const [theme, map] of Object.entries(themes)) {
          for (const [bg, fg] of [["surface", "on-surface"], ["accent", "on-accent"]]) {
            const r = ratio(resolve(map[bg]), resolve(map[fg]));
            console.log(theme, bg + "/" + fg, r.toFixed(2));
            if (r < 4.5) failed = true;                              // WCAG 1.4.3 для обычного текста
          }
        }
        if (failed) process.exit(1);
        `,
        { filename: "check-contrast.mjs" },
      ),
      table(
        ["Тема", "Пара", "Контраст (замер)"],
        [
          ["светлая", "`surface` / `on-surface`", "17.17"],
          ["светлая", "`accent` / `on-accent`", "9.31"],
          ["тёмная", "`surface` / `on-surface`", "13.02"],
          ["тёмная", "`accent` / `on-accent`", "9.07"],
        ],
        "Контраст пар «фон / текст» (порог 4.5:1)",
      ),
      h("Шкалы"),
      table(
        ["Шкала", "Правило", "Значения"],
        [
          ["Отступы", "кратные базе 0.5rem", "0.5rem, 1rem, 2rem (и так далее)"],
          ["Типографика (ряд ×1.25)", "каждый шаг = предыдущий × 1.25", "0.8, 1, 1.25, 1.5625, 1.953, 2.441 (в `rem`)"],
          ["Радиусы", "малый / средний / круглый", "0.25rem, 0.5rem, 999px"],
          ["Длительности", "по назначению", "100ms, 200ms, 300ms"],
        ],
        "Примеры шкал",
      ),
      p("Типографическую шкалу можно сделать плавной (токены с `clamp()`, см. тему про плавную типографику): тогда токен хранит формулу, а не число."),
      h("Темы, режимы и предпочтения"),
      ul(
        "**Переключение:** атрибут `data-theme` на `html`; для системной настройки — `@media (prefers-color-scheme: dark)` с теми же значениями.",
        "**`color-scheme`:** сообщает браузеру схему, чтобы встроенные элементы (поля, скроллбар) соответствовали теме.",
        "**Контраст и принудительные цвета:** `@media (prefers-contrast: more)` может усиливать границы, `@media (forced-colors: active)` — отключать декоративные цвета.",
        "**Тема бренда:** сторонние бренды — отдельный набор семантики поверх тех же примитивов или своих.",
      ),
      h("Правила использования в компонентах"),
      wrongRight(
        "css",
        {
          code: `
            .btn { background: var(--color-blue-500); color: #fff; padding: 12px 18px; }
          `,
          note: "Компонент читает примитив напрямую и содержит произвольные числа: тема его не перекрасит, шкалу он нарушает.",
        },
        {
          code: `
            .btn { background: var(--btn-bg, var(--accent)); color: var(--btn-fg, var(--on-accent)); padding: var(--btn-pad, var(--space-2)); }
          `,
          note: "Семантика и параметры компонента: тема работает автоматически, варианты переопределяют компонентные токены.",
        },
      ),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        :root {
          --color-blue-500: #2f3d9a;
          --color-white: #ffffff;
        }

        :root, [data-theme="light"] {
          --accent: var(--color-blue-500);
          --on-accent: var(--color-white);
        }

        .btn {
          color: var(--btn-fg, var(--on-accent));
          background: var(--btn-bg, var(--accent));
        }
        .btn--danger { --btn-bg: var(--danger); }
        `,
        [
          { line: [1, 4], text: "Примитивы: палитра без смысла. Меняются редко (при смене бренда)." },
          { line: [6, 9], text: "Семантика: роли. Темы переопределяют именно этот уровень; ссылки остаются `var()`." },
          { line: [12, 13], text: "Компонент читает семантику через собственные токены с запасным значением: значения по умолчанию берутся из роли." },
          { line: 15, text: "Вариант переопределяет компонентный токен ссылкой на другую роль, а не копирует цвет." },
        ],
        "syntax.css",
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru" data-theme="light">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Токены в трёх уровнях</title>
        <style>
          :root {
            --color-white: #ffffff; --color-blue-300: #aab4f0; --color-blue-500: #2f3d9a;
            --color-gray-50: #f4f5fb; --color-gray-100: #e8e8f0; --color-gray-800: #1f2133; --color-gray-900: #1b1b1f; --color-gray-950: #14151f;
            --space-2: 1rem;
          }
          :root, [data-theme="light"] { color-scheme: light; --page: var(--color-gray-50); --surface: var(--color-white); --on-surface: var(--color-gray-900); --accent: var(--color-blue-500); --on-accent: var(--color-white); }
          [data-theme="dark"] { color-scheme: dark; --page: var(--color-gray-950); --surface: var(--color-gray-800); --on-surface: var(--color-gray-100); --accent: var(--color-blue-300); --on-accent: var(--color-gray-950); }

          body { margin: 0; padding: var(--space-2); font: 1rem/1.5 system-ui, sans-serif; color: var(--on-surface); background: var(--page); }
          .card { padding: var(--space-2); margin-block: var(--space-2); background: var(--surface); border-radius: 0.5rem; }
          .btn { padding: 0.5rem var(--space-2); font: inherit; border: 0; border-radius: 0.5rem; cursor: pointer; color: var(--btn-fg, var(--on-accent)); background: var(--btn-bg, var(--accent)); }
        </style>
        <button class="btn" id="t" type="button" aria-pressed="false">Тёмная тема</button>
        <div class="card"><p>Фон и текст берутся из семантики; тема меняет только её значения.</p><button class="btn" type="button">Действие</button></div>
        <script>
          const t = document.getElementById("t");
          t.addEventListener("click", () => {
            const dark = document.documentElement.dataset.theme !== "dark";
            document.documentElement.dataset.theme = dark ? "dark" : "light";
            t.setAttribute("aria-pressed", String(dark));
          });
        </script>
        </html>
        `,
        { filename: "tokens-basics.html", runnable: true },
      ),
      p("Переключение темы меняет шесть семантических значений; правила `.card` и `.btn` не содержат ни одного цвета-числа."),
    ]),

    section("detailed-example", [
      p("Страница «палитра и пары контраста»: токены из сборки, переключатель темы и таблица, в которой браузер вычисляет контраст каждой пары «фон / текст» по реальным вычисленным цветам. Если пара ниже 4.5:1, строка помечается — проверка происходит прямо в интерфейсе."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru" data-theme="light">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Токены и контраст</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          :root {
            --color-white: #ffffff; --color-blue-300: #aab4f0; --color-blue-500: #2f3d9a;
            --color-gray-50: #f4f5fb; --color-gray-100: #e8e8f0; --color-gray-800: #1f2133; --color-gray-900: #1b1b1f; --color-gray-950: #14151f;
            --space-1: 0.5rem; --space-2: 1rem; --radius-1: 0.5rem;
          }
          :root, [data-theme="light"] { color-scheme: light; --page: var(--color-gray-50); --surface: var(--color-white); --on-surface: var(--color-gray-900); --accent: var(--color-blue-500); --on-accent: var(--color-white); }
          [data-theme="dark"] { color-scheme: dark; --page: var(--color-gray-950); --surface: var(--color-gray-800); --on-surface: var(--color-gray-100); --accent: var(--color-blue-300); --on-accent: var(--color-gray-950); }

          body { margin: 0; padding: var(--space-2); font: 1rem/1.5 system-ui, sans-serif; color: var(--on-surface); background: var(--page); }
          button { font: inherit; cursor: pointer; padding: var(--space-1) var(--space-2); border: 0; border-radius: var(--radius-1); color: var(--on-accent); background: var(--accent); }
          .pair { display: grid; grid-template-columns: 1fr auto; gap: var(--space-2); align-items: center; max-inline-size: 36rem; margin-block: var(--space-1); padding: var(--space-2); border-radius: var(--radius-1); }
          .pair--surface { color: var(--on-surface); background: var(--surface); }
          .pair--accent { color: var(--on-accent); background: var(--accent); }
          .ratio { font-variant-numeric: tabular-nums; font-weight: 700; }
          .ratio[data-ok="false"]::after { content: " ✗"; }
          .ratio[data-ok="true"]::after { content: " ✓"; }
        </style>
        <button id="toggle" type="button" aria-pressed="false">Тёмная тема</button>
        <div class="pair pair--surface"><span>surface / on-surface</span><span class="ratio"></span></div>
        <div class="pair pair--accent"><span>accent / on-accent</span><span class="ratio"></span></div>
        <script>
          const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
          const rgb = (s) => s.match(/\\d+/g).slice(0, 3).map(Number);
          const ratio = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

          function update() {
            document.querySelectorAll(".pair").forEach((el) => {
              const cs = getComputedStyle(el);
              const r = ratio(cs.backgroundColor, cs.color);
              const out = el.querySelector(".ratio");
              out.textContent = r.toFixed(2);
              out.dataset.ok = String(r >= 4.5);
            });
          }
          update();

          const toggle = document.getElementById("toggle");
          toggle.addEventListener("click", () => {
            const dark = document.documentElement.dataset.theme !== "dark";
            document.documentElement.dataset.theme = dark ? "dark" : "light";
            toggle.setAttribute("aria-pressed", String(dark));
            update();
          });
        </script>
        </html>
        `,
        { filename: "tokens-contrast.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает"],
        [
          [":root { --color-*, --space-*, --radius-* }", "Примитивы: палитра и шкалы — единственное место, где встречаются «сырые» значения"],
          [":root, [data-theme=\"light\"] / [data-theme=\"dark\"]", "Семантика: роли для двух тем; компоненты их не различают"],
          [".pair--surface / .pair--accent", "Компоненты читают только роли (`--surface`, `--accent` и их `on-*`)"],
          ["`update()` в скрипте", "Берёт вычисленные цвета элементов и считает отношение яркостей по формуле WCAG; результат — 17.17 / 9.31 (светлая) и 13.02 / 9.07 (тёмная)"],
          ["`color-scheme`", "Встроенные элементы подстраиваются под тему"],
        ],
        "Как устроена страница",
      ),
      ul(
        "Смена темы — одна запись атрибута; контраст пересчитывается из реальных значений, а не из «ожиданий».",
        "Пары «фон / текст» определены вместе: тема не может изменить одно и забыть другое.",
        "Все пары выше порога 4.5:1 в обеих темах; нарушение отметится крестиком.",
      ),
    ]),

    section("internals", [
      h("Как токены попадают в браузер"),
      steps(
        [
          ["Источник", "JSON-файлы токенов (формат DTCG) лежат в репозитории как единый источник правды; изменения проходят обзор как изменения API."],
          ["Сборка", "Скрипт разворачивает группы, проверяет ссылки и циклы, вычисляет конечные значения, генерирует CSS-переменные (и при необходимости файлы для других платформ)."],
          ["Проверки", "Контраст пар, ссылки на несуществующие токены, дубликаты и пропущенные темы: сборка падает при нарушении."],
          ["Доставка", "CSS подключается в слое `tokens`; приложение читает только семантику и компонентные токены."],
          ["Использование", "`var()` вычисляется для каждого элемента; смена `data-theme` перевычисляет семантику и всё, что от неё зависит."],
        ],
        "Конвейер токенов",
      ),
      h("Почему ссылки сохраняют как `var()`"),
      p("Если сборка записывает в CSS уже вычисленные цвета (`--accent: #2f3d9a`), связь с палитрой теряется: в браузере нельзя понять, откуда значение. Ссылка `--accent: var(--color-blue-500)` сохраняет цепочку и позволяет переопределить примитив на лету, например, для темы бренда. Минус: чуть более длинная цепочка вычислений — на практике незаметная."),
      h("Версионирование"),
      ul(
        "Токены — публичный API дизайн-системы: добавление безопасно, переименование и удаление — **ломающее изменение**.",
        "Устаревшие токены помечают (`$deprecated`/комментарий) и держат один релиз.",
        "Журнал изменений описывает, какие токены изменились и как это скажется на внешнем виде.",
      ),
      note("Формат DTCG развивается: расширения (`$extensions`), составные типы (тени, градиенты) и режимы (темы) описаны в черновиках. Опирайтесь на актуальную редакцию и возможности выбранных инструментов сборки."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Компоненты читают примитивы"),
      p("`var(--color-blue-500)` внутри `.btn` не перекрашивается темой и привязывает компонент к палитре. Компонент должен читать семантику (`--accent`) и собственные токены."),
      h("Ошибка 2. Семантика, названная по виду"),
      p("`--blue-button` и `--big-padding` теряют смысл при смене бренда или шкалы. Называйте по роли: `--accent`, `--space-card`."),
      h("Ошибка 3. Пары без `on-*`"),
      p("Определили `--accent`, но текст на нём задали числом: в тёмной теме он нечитаем. Фон и текст на нём определяют вместе (`--accent` и `--on-accent`) и проверяют контраст."),
      h("Ошибка 4. Слишком много токенов"),
      p("Сотни токенов на каждое свойство делают систему непригодной. Достаточно шкал и ролей; компонентные токены — только там, где нужна настройка."),
      h("Ошибка 5. Ссылки без проверки"),
      p("Опечатка в пути `{color.blu.500}` приводит к пустому значению и «сломанному» CSS. Сборка должна падать при несуществующем токене (замер: `{color.nope}` → `нет токена: color.nope`) и при циклах."),
      h("Ошибка 6. Копирование значений вместо ссылок"),
      p("Если `--on-accent` — просто `#ffffff`, смена палитры оставит «белый» на месте. Ссылайтесь на токены (`{color.white}`), чтобы изменения распространялись."),
      h("Ошибка 7. Темы через переписывание правил"),
      p("`body.dark .card { … }` для каждого компонента умножает код. Меняйте семантику (`[data-theme=\"dark\"] { --surface: … }`) — компоненты остаются прежними."),
      h("Ошибка 8. Забытые режимы доступности"),
      p("Токены без вариантов для `prefers-contrast` и `forced-colors` оставляют часть пользователей без читаемого интерфейса. Предусмотрите усиленный контраст и отключение декоративных цветов."),
    ]),

    section("antipatterns", [
      ul(
        "**«Токены» только в Figma** без выгрузки в код: расхождение гарантировано.",
        "**Примитивы в компонентах** и произвольные числа в правилах.",
        "**Имена по цвету** (`--blue-button`, `--red-text`).",
        "**Темы копированием правил** компонентов.",
        "**Отсутствие проверок** сборки (ссылки, циклы, контраст).",
        "**Переименования без миграции:** удаление токена ломает потребителей молча.",
        "**Токен на каждое свойство каждого компонента:** шум вместо системы.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Три уровня:** примитивы → семантика → компоненты; компоненты читают только два последних.",
        "**Источник правды — данные** (JSON), из них генерируются CSS и документация.",
        "**Ссылки сохраняйте как `var()`:** видна цепочка, можно переопределять на лету.",
        "**Пары `фон` и `on-фон`** определяйте вместе; проверяйте контраст при сборке (4.5:1 для обычного текста).",
        "**Шкалы:** отступы, размеры текста, радиусы, длительности — ограниченные наборы.",
        "**Темы — только семантика;** `color-scheme` для встроенных элементов; предпочтения (`prefers-contrast`) — отдельные значения.",
        "**Версионируйте как API:** добавление безопасно, удаление — ломающее.",
        "**Документируйте:** смысл токена, допустимые значения, где используется, примеры.",
      ),
    ]),

    section("edge-cases", [
      h("Составные токены"),
      p("Тени, градиенты и переходы состоят из нескольких значений. Храните их как отдельные токены (`--shadow-2`) либо собирайте из компонентных токенов (`--shadow-color`, `--shadow-blur`). Составные типы DTCG описаны в черновиках: следите за поддержкой в инструментах."),
      h("Единицы и доступность"),
      p("Отступы и шрифты — в `rem`, чтобы уважать настройки пользователя; радиусы и границы — в `px` или `rem` по ситуации; цвета — в sRGB либо современных пространствах (`oklch`) с проверкой совместимости."),
      h("Токены и JavaScript"),
      p("Если значения нужны в JS (графики, холсты), читайте их из `getComputedStyle(document.documentElement).getPropertyValue(\"--accent\")` или генерируйте JS-модуль из того же источника. Не дублируйте значения вручную."),
      h("Динамические токены"),
      p("Значения, зависящие от окна или контейнера, задаются формулами (`clamp()`, `cqi`). Токен хранит формулу; компонент об этом не знает."),
      h("Несколько брендов"),
      p("Для нескольких брендов делают свои наборы примитивов и семантики поверх общих компонентов. Компонентные токены остаются общими."),
      h("Тёмная тема и изображения"),
      p("Токены не решают вопрос иллюстраций: для тёмной темы нужны варианты изображений (`<picture>`, `prefers-color-scheme`) или SVG с `currentColor`."),
    ]),

    section("related", [
      ul(
        "[Пользовательские свойства](/learn/css/custom-properties) — механизм доставки токенов в браузер.",
        "[Организация CSS](/learn/css/organizing-css) — слой `tokens` и порядок слоёв.",
        "[Цвет](/learn/css/colors) — цветовые функции и контраст.",
        "[Плавная типографика и отступы](/learn/css/fluid-typography-spacing) — токены с `clamp()`.",
        "[Методологии CSS](/learn/css/methodologies) — CUBE и токены.",
        "[Управление специфичностью](/learn/css/specificity-management) — как токены уменьшают потребность в переопределениях.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Числа и копирование тем",
          code: `
            .btn { background: #2f3d9a; color: #fff; padding: 12px 18px; }
            body.dark .btn { background: #aab4f0; color: #14151f; }
            .badge { background: #2f3d9a; color: #fff; }
            body.dark .badge { background: #aab4f0; color: #14151f; }
          `,
          note: "Значения повторяются, тема дублируется для каждого компонента; смена цвета бренда — поиск и замена.",
        },
        {
          title: "Токены трёх уровней",
          code: `
            :root { --color-blue-500: #2f3d9a; --color-white: #fff; --space-2: 1rem; }
            :root, [data-theme="light"] { --accent: var(--color-blue-500); --on-accent: var(--color-white); }
            [data-theme="dark"] { --accent: var(--color-blue-300); --on-accent: var(--color-gray-950); }

            .btn, .badge { background: var(--accent); color: var(--on-accent); }
          `,
          note: "Один источник значений; тема — смена семантики; компоненты не знают о палитре.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.design-tokens.ex1",
      title: "Распределите токены по уровням",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("Разнесите по уровням (примитив / семантика / компонент): `--color-gray-800`, `--surface`, `--btn-bg`, `--space-2`, `--on-accent`, `--card-pad`, `--color-blue-500`, `--accent`. Какие из них меняет тёмная тема?"),
      ],
      hints: ["Какие токены не имеют роли, только значение?", "Какие описывают роль в интерфейсе?", "Какие принадлежат конкретному компоненту?"],
      checks: ["Примитивы: `--color-gray-800`, `--space-2`, `--color-blue-500`", "Семантика: `--surface`, `--on-accent`, `--accent`", "Компоненты: `--btn-bg`, `--card-pad`", "Тема меняет семантику"],
      solution: [
        ul(
          "**Примитивы:** `--color-gray-800`, `--space-2`, `--color-blue-500`.",
          "**Семантика:** `--surface`, `--on-accent`, `--accent`.",
          "**Компонентные:** `--btn-bg`, `--card-pad`.",
        ),
        p("Тёмная тема меняет **семантику**: `--surface` указывает на `--color-gray-800`, `--accent` — на `--color-blue-300`. Примитивы остаются прежними, компонентные токены следуют за семантикой через `var()`."),
      ],
    }),
    exercise({
      id: "css.design-tokens.ex2",
      title: "Контраст пары токенов",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Для светлой темы заданы `surface = #ffffff`, `on-surface = #1b1b1f`, `accent = #2f3d9a`, `on-accent = #ffffff`. Для тёмной — `surface = #1f2133`, `on-surface = #e8e8f0`, `accent = #aab4f0`, `on-accent = #14151f`. Достаточен ли контраст по порогу 4.5:1? Какие значения даёт сборочный скрипт?"),
      ],
      hints: ["Как считается отношение яркостей?", "Какой порог для обычного текста?"],
      checks: ["Светлая: 17.17 и 9.31", "Тёмная: 13.02 и 9.07", "Все выше 4.5"],
      solution: [
        table(
          ["Тема", "Пара", "Контраст"],
          [
            ["светлая", "`surface` / `on-surface`", "17.17"],
            ["светлая", "`accent` / `on-accent`", "9.31"],
            ["тёмная", "`surface` / `on-surface`", "13.02"],
            ["тёмная", "`accent` / `on-accent`", "9.07"],
          ],
        ),
        p("Все пары превышают порог 4.5:1 (WCAG 1.4.3 для обычного текста). Значения получены скриптом `check-contrast.mjs`."),
      ],
    }),
    exercise({
      id: "css.design-tokens.ex3",
      title: "Сборка должна падать",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("В токенах появились: ссылка на несуществующий путь `{color.blu.500}`, цикл `a → b → a` и пара с контрастом 3.1:1. Какие проверки должна выполнять сборка и как должны выглядеть сообщения об ошибках? Что произойдёт без проверок?"),
      ],
      hints: ["Как обнаружить цикл при разрешении ссылок?", "Что вернёт `resolve` для несуществующего пути?"],
      checks: ["Проверка существования: `нет токена: …`", "Проверка циклов: список посещённых путей", "Проверка контраста с порогом 4.5"],
      solution: [
        ul(
          "**Несуществующий путь:** `resolve` бросает `нет токена: color.blu.500` (в замере аналогичная ошибка для `{color.nope}`).",
          "**Цикл:** список посещённых путей (`a → b → a`) выдаётся в сообщении `цикл: …`.",
          "**Контраст:** пара ниже 4.5 помечается, процесс завершается с кодом 1.",
        ),
        p("Без проверок опечатка превращается в пустое значение в CSS и «молча» ломает интерфейс (например, прозрачный фон), а нечитаемая пара доезжает до продакшена."),
      ],
    }),
  ],

  challenge: {
    id: "css.design-tokens.challenge",
    title: "Сборка токенов с проверками ссылок, циклов и контраста",
    scenario: [
      p("Команда вручную переносит значения из дизайн-инструмента в CSS: цвета расходятся, в тёмной теме часть текста нечитаема, а опечатки в именах приводят к прозрачным фонам. Нужно написать **сборку токенов**: из JSON (формат DTCG) получить CSS-переменные и упасть, если ссылки, циклы или контраст нарушены."),
    ],
    requirements: [
      "Плоское разворачивание групп; вывод примитивов как CSS-переменных",
      "Две темы; семантические переменные как `var()`-ссылки на примитивы",
      "Проверка ссылок: несуществующие пути — ошибка; циклы — ошибка со списком путей",
      "Проверка контраста пар `surface/on-surface` и `accent/on-accent` в обеих темах (≥ 4.5)",
      "Код выхода 1 при любых нарушениях; отчёт читаемый",
    ],
    constraints: [
      "Нельзя записывать вычисленные цвета в семантические токены (только ссылки)",
      "Нельзя пропускать проверку для тёмной темы",
    ],
    acceptance: [
      "Для корректных токенов: CSS сгенерирован, контраст 17.17 / 9.31 / 13.02 / 9.07, код выхода 0",
      "Для `{color.nope}`: `нет токена: color.nope`, код выхода 1",
      "Для цикла: `цикл: a → b → a`, код выхода 1",
      "Для пары с контрастом ниже 4.5: сообщение с темой и парой, код выхода 1",
    ],
    hints: [
      "Как хранить посещённые пути при разрешении ссылок?",
      "Как рассчитывается относительная яркость цвета?",
      "Как собрать несколько ошибок в один отчёт?",
    ],
    solution: [
      code(
        "js",
        `
        // build-tokens.mjs — полный скрипт: разворачивание, проверка ссылок и циклов, контраст, генерация CSS
        const lum = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

        export function build(tokens, themes) {
          const errors = [];
          const prim = new Map();
          (function flatten(node, path = []) {
            for (const [k, v] of Object.entries(node)) {
              if (k === "$type") continue;
              if (v && typeof v === "object" && "$value" in v) prim.set(path.concat(k).join("."), v.$value);
              else if (v && typeof v === "object") flatten(v, path.concat(k));
            }
          })(tokens);

          const resolve = (ref, seen = []) => {
            const m = /^\\{(.+)\\}$/.exec(ref);
            if (!m) return ref;
            if (seen.includes(m[1])) throw new Error("цикл: " + [...seen, m[1]].join(" → "));
            if (!prim.has(m[1])) throw new Error("нет токена: " + m[1]);
            return resolve(prim.get(m[1]), [...seen, m[1]]);
          };

          const name = (p) => "--" + p.replace(/\\./g, "-");
          let css = ":root {\\n" + [...prim].map(([p, v]) => "  " + name(p) + ": " + v + ";").join("\\n") + "\\n}\\n";

          for (const [theme, map] of Object.entries(themes)) {
            css += (theme === "light" ? ':root, [data-theme="light"]' : '[data-theme="' + theme + '"]') + " {\\n";
            for (const [role, ref] of Object.entries(map)) {
              try { resolve(ref); css += "  --" + role + ": var(" + name(ref.slice(1, -1)) + ");\\n"; }
              catch (e) { errors.push(theme + "." + role + ": " + e.message); }
            }
            css += "}\\n";
            for (const [bg, fg] of [["surface", "on-surface"], ["accent", "on-accent"]]) {
              try {
                const r = ratio(resolve(map[bg]), resolve(map[fg]));
                if (r < 4.5) errors.push(theme + " " + bg + "/" + fg + ": контраст " + r.toFixed(2) + " < 4.5");
                else console.log(theme, bg + "/" + fg, r.toFixed(2));
              } catch { /* ссылка уже учтена выше */ }
            }
          }
          return { css, errors };
        }

        // const { css, errors } = build(tokens, themes);
        // if (errors.length) { errors.forEach((e) => console.error("✗", e)); process.exit(1); }
        `,
        { filename: "build-tokens.mjs", lineNumbers: true },
      ),
      ul(
        "**Ссылки и циклы:** `resolve` проверяет существование пути и ведёт список посещённых путей.",
        "**Отчёт:** ошибки накапливаются по темам и ролям, а не прерывают сборку на первой.",
        "**Контраст:** пара проверяется по реальным разрешённым значениям, порог 4.5:1.",
        "**CSS:** семантические токены записываются как `var()`-ссылки на примитивы; примитивы — значениями.",
      ),
    ],
  },

  interview: [
    iq("css.design-tokens.i1", "basic", "Что такое дизайн-токены?", [
      p("Именованные значения дизайна (цвета, отступы, радиусы, шрифты, тени), хранимые независимо от платформы и используемые в коде и в дизайн-инструментах. Это общий словарь и источник правды; в CSS их обычно доставляют пользовательскими свойствами."),
    ]),
    iq("css.design-tokens.i2", "basic", "Какие уровни токенов вы используете и зачем?", [
      p("Примитивы (палитра и шкалы), семантика (роли: `--surface`, `--accent`) и компонентные токены (`--btn-bg`). Темы меняют только семантику; компоненты читают семантику и свои токены, поэтому не зависят ни от палитры, ни от темы."),
    ]),
    iq("css.design-tokens.i3", "intermediate", "Как реализовать тёмную тему на токенах?", [
      p("Семантические токены переопределяются для `[data-theme=\"dark\"]` ссылками на другие примитивы (`--surface: var(--color-gray-800)`), `color-scheme: dark` настраивает встроенные элементы. Правила компонентов не меняются; контраст пар проверяется при сборке (в замере 13.02 и 9.07)."),
    ]),
    iq("css.design-tokens.i4", "intermediate", "Почему ссылки между токенами лучше хранить как `var()`, а не как готовые значения?", [
      p("Цепочка `--accent → --color-blue-500 → #2f3d9a` остаётся видимой в DevTools, а примитив можно переопределить на лету (тема бренда). Готовые значения теряют связь: смена палитры не доезжает до ролей."),
    ]),
    iq("css.design-tokens.i5", "intermediate", "Что такое формат DTCG?", [
      p("Формат обмена токенами сообщества W3C: значения в `$value`, типы в `$type` (наследуются от группы), ссылки `{группа.имя}`. Формат развивается: расширения и составные типы описаны в черновиках, поэтому следите за актуальной редакцией и поддержкой инструментов."),
    ]),
    iq("css.design-tokens.i6", "advanced", "Какие проверки должна выполнять сборка токенов?", [
      ul(
        "Существование ссылок (`нет токена: …`) и отсутствие циклов (`цикл: a → b → a`).",
        "Контраст пар «фон / текст» по порогу (4.5:1) для всех тем.",
        "Полнота тем: у каждой темы есть все семантические роли; нет дубликатов имён.",
        "Устаревшие токены и ломающие изменения (удаление, переименование) — по сравнению с предыдущей версией.",
      ),
    ]),
    iq("css.design-tokens.i7", "engineering", "Как управлять изменениями токенов в большой системе?", [
      ul(
        "Токены — публичный API: добавление безопасно, переименование и удаление — ломающие изменения с миграцией.",
        "Пометка устаревших токенов на один релиз; журнал изменений с описанием визуального эффекта.",
        "Автоматические проверки и визуальные тесты в CI; обзор изменений дизайнерами и разработчиками.",
        "Один источник правды и генерация всех артефактов (CSS, JS, документация).",
      ),
    ]),
    iq("css.design-tokens.i8", "debugging", "После обновления токенов часть интерфейса стала нечитаемой. Что проверите?", [
      ul(
        "Не переопределена ли семантика темы без парного `on-*`; контраст пар в обеих темах.",
        "Нет ли компонентов, читающих примитивы напрямую или использующих произвольные цвета.",
        "Цепочку `var()` в DevTools: какая ссылка указывает на неверное значение.",
        "Результат сборки: ошибки ссылок, циклов, пустые значения.",
      ),
    ]),
  ],

  exam: [
    mcq("css.design-tokens.e1", "foundation", "Какой токен семантический?", ["`--color-blue-500`", "`--space-2`", "`--accent`", "`--btn-pad`"], 2, "`--accent` описывает роль в интерфейсе; `--color-blue-500` и `--space-2` — примитивы, `--btn-pad` — компонентный токен."),
    mcq("css.design-tokens.e2", "foundation", "Что меняет тёмная тема в трёхуровневой системе?", ["Семантические токены", "Примитивы", "Компонентные правила", "Всё"], 0, "Тема переопределяет значения семантики; примитивы и правила компонентов остаются прежними."),
    mcq("css.design-tokens.e3", "intermediate", "Как в формате DTCG записывается ссылка на токен?", ["`$ref: color.blue.500`", "`@color.blue.500`", "`var(--color-blue-500)`", "`{color.blue.500}` в `$value`"], 3, "Ссылка записывается в `$value` в фигурных скобках по пути токена."),
    mcq("css.design-tokens.e4", "intermediate", "Какой контраст в замере у пары `surface/on-surface` светлой темы (#ffffff и #1b1b1f)?", ["9.31", "17.17", "13.02", "4.5"], 1, "Скрипт посчитал 17.17; для `accent/on-accent` светлой темы — 9.31."),
    mcq("css.design-tokens.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["Компоненты должны читать примитивы напрямую", "Пары `фон` и `on-фон` определяют вместе", "Ссылки лучше хранить как `var()`", "Сборка должна падать при несуществующей ссылке"], [1, 2, 3], "Компоненты читают семантику и компонентные токены, а не примитивы."),
    mcq("css.design-tokens.e6", "advanced", "Что вернёт `resolve(\"{color.nope}\")` в скрипте сборки?", ["Пустую строку", "Значение по умолчанию", "`undefined`", "Ошибку «нет токена: color.nope»"], 3, "Функция проверяет существование пути и бросает ошибку, чтобы опечатка не превратилась в пустое значение."),
    open("css.design-tokens.e7", "intermediate", "Объясните, как построить систему дизайн-токенов для продукта с тёмной темой и несколькими командами.", [
      ul(
        "Три уровня (примитивы, семантика, компоненты); темы — смена семантики; компоненты читают роли.",
        "Источник — JSON (DTCG); сборка генерирует CSS и проверяет ссылки, циклы, контраст.",
        "Процесс: версионирование как API, обзор изменений, документация, визуальные тесты.",
      ),
    ], ["Уровни токенов", "Сборка и проверки", "Процесс изменений"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.design-tokens.m1", "intermediate", "Для типографического ряда с множителем 1.25 и базой 1rem каково четвёртое значение (1, 1.25, …)?", ["1.5", "1.75", "1.5625", "1.953"], 2, "Ряд: 1, 1.25, 1.5625 (1.25²), 1.953 (1.25³)… Третье значение — 1.5625."),
    mcq("css.design-tokens.m2", "advanced", "Почему переименование токена — ломающее изменение?", ["Потому что CSS перестанет собираться", "Потому что потребители, использующие старое имя, получат пустое значение", "Потому что браузер кеширует имя", "Это не ломающее изменение"], 1, "Использование несуществующей переменной даёт значение, недопустимое во время вычисления: интерфейс «ломается» молча."),
    mcq("css.design-tokens.m3", "advanced", "Контраст пары в тёмной теме 3.1:1. Что должна сделать сборка?", ["Упасть с ошибкой и указать тему и пару", "Сгенерировать CSS и предупредить", "Автоматически изменить цвет", "Проигнорировать"], 0, "Порог 4.5:1 для обычного текста: нарушение должно останавливать сборку и называть тему и пару."),
    open("css.design-tokens.m4", "advanced", "Спроектируйте процесс жизненного цикла токенов: добавление, изменение, устаревание, удаление, проверка.", [
      ul(
        "Источник правды — JSON; изменения идут через обзор с описанием визуального эффекта.",
        "Добавление безопасно; изменение значения — по визуальным тестам; переименование/удаление — через пометку устаревшим и миграцию.",
        "Сборка проверяет ссылки, циклы, контраст, полноту тем и сравнивает с предыдущей версией (автоматический список ломающих изменений).",
        "Документация и каталог токенов генерируются из источника; журнал изменений публикуется для потребителей.",
      ),
    ], ["Источник и обзор", "Автоматические проверки", "Документация и версионирование"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.design-tokens.f1", front: "Уровни токенов?", back: "Примитивы → семантика → компоненты; тема меняет семантику; компоненты читают роли." },
    { id: "css.design-tokens.f2", front: "Ссылки между токенами?", back: "В JSON — `{color.blue.500}`; в CSS — `var(--color-blue-500)` (цепочка видна в DevTools)." },
    { id: "css.design-tokens.f3", front: "Пары контраста?", back: "`фон` и `on-фон` определяют вместе; порог 4.5:1 (WCAG 1.4.3)." },
    { id: "css.design-tokens.f4", front: "Сборка падает при…", back: "Несуществующей ссылке, цикле, контрасте ниже порога, неполной теме." },
    { id: "css.design-tokens.f5", front: "Именование семантики?", back: "По роли (`--accent`, `--surface`), а не по виду (`--blue-button`)." },
    { id: "css.design-tokens.f6", front: "Версионирование?", back: "Добавление безопасно; переименование/удаление — ломающее изменение." },
  ],

  sources: [
    { title: "Design Tokens Community Group: Format Module", url: "https://www.designtokens.org/tr/drafts/format/", publisher: "W3C" },
    { title: "MDN: Using CSS custom properties", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties", publisher: "MDN" },
    { title: "MDN: color-scheme", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme", publisher: "MDN" },
    { title: "WCAG 2.2: Contrast (Minimum)", url: "https://www.w3.org/TR/WCAG22/#contrast-minimum", publisher: "W3C" },
    { title: "MDN: prefers-contrast", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast", publisher: "MDN" },
    { title: "MDN: forced-colors", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors", publisher: "MDN" },
  ],
};
