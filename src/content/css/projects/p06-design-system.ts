import type { Project } from "../../types";
import { code, h, note, p, table, tip, ul, warn } from "../../dsl";

export const p06DesignSystem: Project = {
  id: "css.p06-design-system",
  domain: "css",
  order: 6,
  title: "Дизайн-система: токены, темы, слои",
  subtitle: "Три уровня токенов, светлая, тёмная и контрастная темы без единой строки JavaScript, переключатель на :has(), light-dark(), типизированная переменная @property, вложенность и слои с политикой !important — и автоматическая проверка контраста всех ролей во всех темах.",
  level: "advanced",
  estimatedHours: 12,
  buildsOn: ["css.p05-responsive-landing"],
  topics: [
    "css.custom-properties",
    "css.design-tokens",
    "css.colors",
    "css.is-where-has",
    "css.nesting-modern",
    "css.cascade-layers",
    "css.specificity-management",
    "css.logical-properties",
    "css.organizing-css",
    "css.methodologies",
  ],
  objective:
    "Построить **мини-дизайн-систему** «Метрика»: **примитивы → роли → компонентные переменные**, три темы (светлая, тёмная, контрастная) плюс режим «Авто» по системной теме, переключатель на радиокнопках и `:has()`, `light-dark()` и `color-scheme`, типизированная переменная `@property --elevation` с анимацией, вложенные компоненты с низкой специфичностью, слои с политикой `!important` только для утилит. Проверка измеряет **реальный контраст элементов в каждой теме**.",
  scenario: [
    p("Команда продукта «Метрика» поддерживает три приложения, и в каждом свои оттенки синего, свои тёмные темы и свои переопределения через `!important`. Дизайнеры просят одну систему: меняется роль цвета — меняется везде; новая тема добавляется без правки компонентов; контраст проверяется автоматически."),
    p("Вам нужно написать единственный `style.css` для страницы-витрины компонентов: кнопки, значки, уведомления, форма с ошибкой и карточка. Переключатель тем уже есть в разметке (радиокнопки), а JavaScript использовать нельзя: тема выбирается селектором `:has()` по состоянию радиокнопок."),
    code(
      "html",
      `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Дизайн-система «Метрика»</title>
<link rel="stylesheet" href="style.css">
<body>
<header class="topbar">
  <h1>Дизайн-система «Метрика»</h1>
  <fieldset class="theme-switch">
    <legend>Тема</legend>
    <label><input type="radio" name="theme" value="auto" checked> Авто</label>
    <label><input type="radio" name="theme" value="light"> Светлая</label>
    <label><input type="radio" name="theme" value="dark"> Тёмная</label>
    <label><input type="radio" name="theme" value="contrast"> Контрастная</label>
  </fieldset>
</header>

<main class="page">
  <section aria-labelledby="buttons-title">
    <h2 id="buttons-title">Кнопки</h2>
    <div class="row">
      <button class="button button--primary" type="button">Сохранить</button>
      <button class="button" type="button">Отмена</button>
      <button class="button button--danger" type="button">Удалить</button>
      <button class="button button--primary" type="button" disabled>Недоступно</button>
    </div>
  </section>

  <section aria-labelledby="badges-title">
    <h2 id="badges-title">Значки</h2>
    <div class="row">
      <span class="badge">Новое</span>
      <span class="badge" data-variant="success">Оплачено</span>
      <span class="badge" data-variant="warning">Ожидает</span>
      <span class="badge" data-variant="danger">Отклонено</span>
    </div>
  </section>

  <section aria-labelledby="alerts-title">
    <h2 id="alerts-title">Уведомления</h2>
    <div class="stack">
      <p class="alert" role="status">Данные синхронизированы в 14:20.</p>
      <p class="alert" data-variant="success" role="status">Платёж принят, чек отправлен на почту.</p>
      <p class="alert" data-variant="warning" role="status">Подписка закончится через 3 дня.</p>
      <p class="alert" data-variant="danger" role="alert">Не удалось сохранить изменения.</p>
    </div>
  </section>

  <section aria-labelledby="form-title">
    <h2 id="form-title">Форма</h2>
    <form class="form">
      <div class="field">
        <label for="email">Почта</label>
        <input id="email" type="email" value="anna@example.com" autocomplete="email">
      </div>
      <div class="field">
        <label for="phone">Телефон</label>
        <input id="phone" type="tel" value="12-34" aria-invalid="true" aria-describedby="phone-error" autocomplete="tel">
        <p class="field__error" id="phone-error">Введите номер полностью, например +7 900 123-45-67.</p>
      </div>
      <button class="button button--primary" type="submit">Отправить</button>
    </form>
  </section>

  <section aria-labelledby="card-title">
    <h2 id="card-title">Карточка</h2>
    <article class="card">
      <h3 class="card__title">Отчёт за неделю</h3>
      <p class="muted">Обновлён сегодня в 09:00</p>
      <p>Выручка выросла на 8%, возвраты остались на прежнем уровне. <a href="#">Открыть подробный отчёт</a></p>
    </article>
  </section>
</main>
</body>
</html>`,
      { filename: "page.html", lineNumbers: true, collapsed: true },
    ),
    note("Разметку менять нельзя. Состояние ошибки задано атрибутом `aria-invalid=\"true\"` у поля телефона, а варианты уведомлений и значков — атрибутом `data-variant`. Режим «Авто» — это значение по умолчанию: он следует системной теме через `color-scheme: light dark`."),
  ],
  requirements: [
    "Один файл `style.css`; разметку менять нельзя; JavaScript не используется.",
    "**Слои:** `@layer reset, tokens, base, components, utilities;` в этом порядке; токены — в слое `tokens`, утилиты — в слое `utilities`.",
    "**Примитивы:** не менее 12 переменных `--color-*` (палитра без смысла), а также шкалы отступов и радиусов (`--space-*`, `--radius-*`) — в слое `tokens`.",
    "**Роли:** не менее 14 семантических переменных (`--surface`, `--surface-raised`, `--on-surface`, `--muted`, `--border`, `--accent`, `--on-accent`, `--link`, `--danger`, `--on-danger`, `--focus`, пары для статусов и др.), значения которых только **ссылаются на примитивы** — без литералов цвета (исключение — `--shadow`).",
    "**Темы:** светлая и тёмная — через `light-dark()` и `color-scheme`; контрастная — переопределением ролей; «Авто» следует `prefers-color-scheme`. Переключатель — `:where(:root:has(input[name=\"theme\"][value=\"…\"]:checked))`.",
    "**Контраст:** во всех темах текст и роли — не ниже 4.5:1, в контрастной теме — не ниже 7:1; границы кнопки, поля, карточки и кольцо фокуса — не ниже 3:1 относительно фона.",
    "**Компоненты** используют только роли и собственные переменные (`--btn-bg`, `--alert-bg`, `--badge-fg`, `--field-border`); литералов цвета и прямых `--color-*` в слоях `base`, `components` и `utilities` нет (кроме системных цветов в `@media (forced-colors: active)`).",
    "**Состояния без классов:** варианты — атрибутом `data-variant`; ошибка поля — `:where(.field:has([aria-invalid=\"true\"]))`, которая меняет канал `--field-border` и показывает сообщение.",
    "**Современный CSS:** `@property --elevation` (`<length>`, начальное значение `2px`) и `transition: --elevation`; нативная вложенность (`&`) у кнопки, значка, уведомления и карточки; `:has()` минимум в двух правилах.",
    "**Доступность и среды:** заметный `:focus-visible` (обводка не тоньше 2px), `@media (prefers-reduced-motion: reduce)` отключает переход, `@media (forced-colors: active)` использует системные цвета.",
    "**Логические свойства:** только `inline-*`, `block-*`, `margin-inline`, `padding-block` и т. п.; свойства `left`, `right`, `width`, `height`, `margin-left` и подобные не используются.",
    "**Политика `!important`:** разрешён только в слое `utilities` (выключатели) и сопровождается комментарием для линтера; идентификаторы в селекторах не используются.",
    "**Специфичность:** не выше (0,2,0) с учётом вложенности; нет горизонтальной прокрутки на 320 и 1280px.",
  ],
  constraints: [
    "Без JavaScript, фреймворков, препроцессоров и сборки токенов — только CSS.",
    "Без литералов цвета (`#fff`, `rgb()`, `hsl()`, `oklch()`) вне слоя `tokens`.",
    "Без идентификаторов и `!important` в слоях `base` и `components`.",
    "Тема не выбирается классами на `<html>` или атрибутами, которые ставит скрипт: только радиокнопки и `:has()`.",
    "Нельзя повышать вес селекторов ради перебивания: используйте слои, `:where()` и переменные-каналы.",
    "Нельзя использовать физические направления (`left`, `right`, `margin-left`, `width`, `height`).",
  ],
  expected: [
    "Страница при выборе «Светлая», «Тёмная» и «Контрастная» мгновенно меняет все цвета; «Авто» совпадает с системной темой.",
    "В каждой теме кнопки, уведомления, значки, поля и ссылки читаемы; кольцо фокуса видно на любом фоне.",
    "Новая роль или новая тема добавляется правкой слоя `tokens`; компоненты не меняются.",
    "Поле с `aria-invalid` получает цвет границы и сообщение об ошибке без отдельного класса.",
    "Самопроверка печатает таблицу из 15 проверок, и все они OK в светлой и тёмной системных темах и на ширинах 320 и 1280px.",
  ],
  technical: [
    "Порядок слоёв — одна строка в начале файла: `@layer reset, tokens, base, components, utilities;`; `@property` стоит вне слоёв (регистрация глобальна).",
    "Примитивы и роли в `:where(:root)`: вес нулевой, поэтому темы (`:where(:root:has(…:checked))`, тоже нулевой вес) переопределяют их **порядком записи**, а не весом. Обычный `:root` (0,1,0) победил бы любое правило с `:where()`.",
    "`color-scheme: light dark` на корне включает автоматический выбор; `light-dark(светлое, тёмное)` возвращает значение по текущему `color-scheme`. В явных темах задайте `color-scheme: light` или `dark`.",
    "Контрастная тема: `color-scheme: dark` и переопределение ролей на `--color-black`/`--color-white`/жёлтый акцент; все пары — не ниже 7:1.",
    "Канал переопределения: компонент задаёт `--btn-bg: var(--surface-raised)`, вариант меняет **переменную** (`&.button--primary { --btn-bg: var(--accent) }`), а свойство `background` читает её один раз.",
    "`@property --elevation { syntax: \"<length>\"; inherits: true; initial-value: 2px }` делает переменную анимируемой: без регистрации браузер не интерполирует значение и `transition: --elevation` ничего не плавит.",
    "Вложенность `&.button--primary` раскрывается линтером в `.button.button--primary` — вес (0,2,0); проверяйте именно раскрытый селектор.",
    "Проверки: самопроверка `check.js` (из решения; асинхронная) с `colorScheme: light` и `dark` в окружении; `stylelint` с бюджетом `0,2,0` и комментарием `stylelint-disable-next-line` у разрешённого `!important`.",
  ],
  acceptance: [
    "Самопроверка `check.js`: все 15 проверок OK на 1280 и 320px при системной светлой и системной тёмной теме.",
    "Контраст ролей: в светлой и тёмной темах каждая проверенная пара ≥ 4.5:1, в контрастной ≥ 7:1; границы кнопки, поля, карточки и кольцо фокуса ≥ 3:1.",
    "`color-scheme` корня: «light dark» при «Авто», `light` при «Светлая», `dark` при «Тёмная» и «Контрастная»; фон в «Авто» равен фону системной темы.",
    "В слое `tokens` не меньше 12 примитивов `--color-*` и 14 ролей; в ролях нет литералов цвета, кроме `--shadow`; в слоях `base`, `components`, `utilities` нет литералов цвета и прямых `--color-*`.",
    "Зарегистрировано `@property --elevation` (`<length>`), значение у карточки равно `2px`, `transition-property` содержит `--elevation`.",
    "Есть правила с `:has()` (не менее двух), вложенные правила, `light-dark()`, `prefers-reduced-motion` и `forced-colors`; физических свойств нет.",
    "`!important` только в слое `utilities`; идентификаторов нет; специфичность с учётом вложенности ≤ (0,2,0); порядок слоёв — как в задании.",
    "`stylelint` с бюджетом `0,2,0` — 0 нарушений (с комментарием у разрешённого `!important`).",
  ],
  hints: [
    "Начните с контракта: напишите список ролей (что значит «поверхность», «приглушённый текст», «акцент», «опасность») и только потом подбирайте цвета. Роль описывает **назначение**, а не оттенок.",
    "Для каждой роли, у которой есть текст на фоне, задавайте **пару** (`--accent` и `--on-accent`): так вы проверяете контраст пары, а не отдельных цветов.",
    "Если селектор `:where(:root:has(…))` не перебивает `:root`, значит, `:root` в том же слое имеет вес (0,1,0). Обернуть и базовое правило в `:where(:root)` — самый короткий путь.",
    "`light-dark()` принимает **цвета**, а не произвольные значения; для `box-shadow` целиком его использовать нельзя, зато можно использовать для цвета тени в переменной `--shadow`.",
    "Тема «Контрастная» — не «тёмная, но ярче»: проверьте каждую пару на ≥ 7:1 и посмотрите на границы — они должны быть отчётливыми (белые на чёрном).",
    "Чтобы показать сообщение об ошибке без класса, используйте `:where(.field:has([aria-invalid=\"true\"])) .field__error { display: block }`, а само сообщение по умолчанию скрыто.",
    "Если `transition: --elevation` не работает, значит, переменная не зарегистрирована через `@property` — без `syntax: \"<length>\"` браузер не знает, как её интерполировать.",
  ],
  advanced: [
    "Добавьте сохранение выбора темы между перезагрузками: `localStorage` и атрибут `data-theme` на `<html>`; сравните с чисто CSS-вариантом (он состояние не запоминает) и обсудите, кто должен владеть этим состоянием.",
    "Генерируйте токены из JSON скриптом `build-tokens.mjs` из темы о дизайн-токенах и подключайте результат слоем `tokens`; настройте проверку контраста в сборке.",
    "Добавьте четвёртую роль «предупреждение» с вариантами для кнопки и значка и докажите самопроверкой, что новая роль не потребовала правок в компонентах.",
    "Добавьте режим `@media (prefers-contrast: more)`, который включает контрастные значения без выбора вручную, и проверьте его эмуляцией в DevTools.",
    "Напишите тест Playwright, который запускает `check.js` при `colorScheme: light`, `dark` и `forcedColors: active` и выводит сводку.",
  ],
  failureModes: [
    "**Роль без пары:** `--muted` выбрана «на глаз»; замер — серый `#7a7e99` даёт 3.66:1 в светлой и 3.98:1 в тёмной теме, а в контрастной 5.27:1 вместо 7.",
    "**Литерал цвета в компоненте:** `color: #333333` в `.card__title` проходит визуальный осмотр, но не меняется при смене темы; проверка находит его по тексту правила.",
    "**Прямой примитив:** `color: var(--color-blue-700)` в компоненте обходит роли — при смене темы он остаётся синим на тёмном фоне.",
    "**`!important` в компоненте** ломает политику слоёв: следующему варианту тоже нужен `!important`; проверка находит такие объявления вне слоя `utilities`.",
    "**Без `@property`:** `transition: --elevation` ничего не анимирует: значение просто «прыгает», а проверка не находит правило регистрации.",
    "**Тёмная тема без `light-dark()`:** фон остаётся белым в обеих темах; замер — контраст текста в поле ввода 1.22:1, текста ошибки 2.01:1, кольца фокуса 1.24:1.",
    "**Вес растёт:** `.form .field label.x` (0,3,1) поверх вложенности и `:has()`; линтер раскрывает вложенность и называет итоговый селектор, например `.button.button--primary:hover:focus` (0,4,0).",
  ],
  rubric: [
    { criterion: "Архитектура токенов", weight: 25, description: "Три уровня: примитивы, роли, компонентные переменные; роли ссылаются на примитивы; компоненты — на роли." },
    { criterion: "Темы и контраст", weight: 25, description: "Светлая, тёмная, контрастная, «Авто»; `light-dark()`, `color-scheme`, `:has()`; контраст ролей и границ по порогам." },
    { criterion: "Современные возможности", weight: 15, description: "`@property`, вложенность, `:has()`, `:where()` для нулевого веса, переменные-каналы." },
    { criterion: "Слои и политика !important", weight: 15, description: "Порядок слоёв, `!important` только в `utilities`, специфичность ≤ (0,2,0) с учётом вложенности." },
    { criterion: "Доступность и среды", weight: 15, description: "`:focus-visible`, `prefers-reduced-motion`, `forced-colors`, состояние ошибки через атрибут, логические свойства." },
    { criterion: "Качество кода", weight: 5, description: "Читаемые имена ролей, комментарии у исключений, отсутствие дублирования значений." },
  ],
  solution: [
    p("Эталон — один файл. Он проходит все 15 проверок на 1280 и 320px и при системной светлой, и при системной тёмной теме; одиннадцать «плохих» вариантов (низкий контраст, литерал в компоненте, `!important` в компоненте, без `@property`, физическое свойство, неверный порядок слоёв, без `forced-colors`, тёмная тема без `light-dark()`, лишний вес и другие) ловятся своими проверками."),
    h("style.css"),
    code(
      "css",
      `@layer reset, tokens, base, components, utilities;

@property --elevation {
  syntax: "<length>";
  inherits: true;
  initial-value: 2px;
}

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  body, h1, h2, h3, p, fieldset, legend { margin: 0; padding: 0; }
  fieldset { border: 0; min-inline-size: 0; }
}

@layer tokens {
  /* 1. примитивы: сырая палитра и шкалы, без смысла */
  :where(:root) {
    --color-white: #ffffff;
    --color-black: #000000;
    --color-gray-50: #f4f5fb;
    --color-gray-100: #e8e8f0;
    --color-gray-300: #b5b6c8;
    --color-gray-500: #7a7e99;
    --color-gray-700: #55535c;
    --color-gray-800: #1f2133;
    --color-gray-900: #14151f;
    --color-ink: #1b1b1f;
    --color-blue-700: #2f3d9a;
    --color-blue-300: #aab4f0;
    --color-blue-100: #dfe3fa;
    --color-red-700: #b3261e;
    --color-red-300: #ff9c94;
    --color-red-100: #fde4e1;
    --color-green-800: #1b6137;
    --color-green-300: #7fd6a0;
    --color-green-100: #dcf3e4;
    --color-amber-800: #7a4a00;
    --color-amber-300: #ffd27a;
    --color-amber-100: #fff1d1;
    --color-yellow-300: #ffe680;

    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 1rem;
    --space-4: 1.5rem;
    --radius-1: 0.375rem;
    --radius-2: 0.75rem;
  }

  /* 2. семантика: роли; светлая и тёмная версии — через light-dark() */
  :where(:root) {
    color-scheme: light dark;
    --surface: light-dark(var(--color-white), var(--color-gray-900));
    --surface-raised: light-dark(var(--color-gray-50), var(--color-gray-800));
    --on-surface: light-dark(var(--color-ink), var(--color-gray-100));
    --muted: light-dark(var(--color-gray-700), var(--color-gray-300));
    --border: light-dark(var(--color-gray-500), var(--color-gray-500));
    --accent: light-dark(var(--color-blue-700), var(--color-blue-300));
    --on-accent: light-dark(var(--color-white), var(--color-gray-900));
    --link: light-dark(var(--color-blue-700), var(--color-blue-300));
    --danger: light-dark(var(--color-red-700), var(--color-red-300));
    --on-danger: light-dark(var(--color-white), var(--color-gray-900));
    --focus: light-dark(var(--color-blue-700), var(--color-yellow-300));
    --info-surface: light-dark(var(--color-blue-100), var(--color-gray-800));
    --on-info-surface: light-dark(var(--color-ink), var(--color-gray-100));
    --success-surface: light-dark(var(--color-green-100), var(--color-gray-800));
    --on-success-surface: light-dark(var(--color-green-800), var(--color-green-300));
    --warning-surface: light-dark(var(--color-amber-100), var(--color-gray-800));
    --on-warning-surface: light-dark(var(--color-amber-800), var(--color-amber-300));
    --danger-surface: light-dark(var(--color-red-100), var(--color-gray-800));
    --on-danger-surface: light-dark(var(--color-red-700), var(--color-red-300));
    --shadow: light-dark(rgb(27 27 31 / 0.2), rgb(0 0 0 / 0.6));
  }

  /* явный выбор темы переключателем (без JavaScript) */
  :where(:root:has(input[name="theme"][value="light"]:checked)) { color-scheme: light; }
  :where(:root:has(input[name="theme"][value="dark"]:checked)) { color-scheme: dark; }
  :where(:root:has(input[name="theme"][value="contrast"]:checked)) {
    color-scheme: dark;
    --surface: var(--color-black);
    --surface-raised: var(--color-black);
    --on-surface: var(--color-white);
    --muted: var(--color-gray-100);
    --border: var(--color-white);
    --accent: var(--color-yellow-300);
    --on-accent: var(--color-black);
    --link: var(--color-yellow-300);
    --danger: var(--color-red-300);
    --on-danger: var(--color-black);
    --focus: var(--color-yellow-300);
    --info-surface: var(--color-black);
    --on-info-surface: var(--color-white);
    --success-surface: var(--color-black);
    --on-success-surface: var(--color-green-300);
    --warning-surface: var(--color-black);
    --on-warning-surface: var(--color-amber-300);
    --danger-surface: var(--color-black);
    --on-danger-surface: var(--color-red-300);
    --shadow: transparent;
  }
}

@layer base {
  body { font: 1rem / 1.5 system-ui, sans-serif; color: var(--on-surface); background: var(--surface); }
  a { color: var(--link); }
  :focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .muted { color: var(--muted); }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.25rem; }
}

@layer components {
  .topbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-3); background: var(--surface-raised); border-block-end: 1px solid var(--border); }
  .theme-switch { display: flex; flex-wrap: wrap; gap: var(--space-3); }
  .theme-switch legend { margin-block-end: var(--space-1); font-weight: 600; }
  .page { max-inline-size: 48rem; margin-inline: auto; padding: var(--space-4) var(--space-3); }
  .page > * + * { margin-block-start: var(--space-4); }
  .page h2 { margin-block-end: var(--space-2); }
  .row { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .stack { display: grid; gap: var(--space-2); }

  .button {
    --btn-bg: var(--surface-raised);
    --btn-fg: var(--on-surface);
    --btn-border: var(--border);
    padding: var(--space-2) var(--space-3);
    border: 2px solid var(--btn-border);
    border-radius: var(--radius-1);
    background: var(--btn-bg);
    color: var(--btn-fg);
    font: inherit;
    font-weight: 600;
    cursor: pointer;

    &.button--primary { --btn-bg: var(--accent); --btn-fg: var(--on-accent); --btn-border: var(--accent); }
    &.button--danger { --btn-bg: var(--danger); --btn-fg: var(--on-danger); --btn-border: var(--danger); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  .badge {
    --badge-bg: var(--info-surface);
    --badge-fg: var(--on-info-surface);
    display: inline-block;
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--badge-fg);
    border-radius: 999px;
    background: var(--badge-bg);
    color: var(--badge-fg);
    font-size: 0.875rem;
    font-weight: 600;

    &[data-variant="success"] { --badge-bg: var(--success-surface); --badge-fg: var(--on-success-surface); }
    &[data-variant="warning"] { --badge-bg: var(--warning-surface); --badge-fg: var(--on-warning-surface); }
    &[data-variant="danger"] { --badge-bg: var(--danger-surface); --badge-fg: var(--on-danger-surface); }
  }

  .alert {
    --alert-bg: var(--info-surface);
    --alert-fg: var(--on-info-surface);
    padding: var(--space-2) var(--space-3);
    border-inline-start: 4px solid var(--alert-fg);
    border-radius: var(--radius-1);
    background: var(--alert-bg);
    color: var(--alert-fg);

    &[data-variant="success"] { --alert-bg: var(--success-surface); --alert-fg: var(--on-success-surface); }
    &[data-variant="warning"] { --alert-bg: var(--warning-surface); --alert-fg: var(--on-warning-surface); }
    &[data-variant="danger"] { --alert-bg: var(--danger-surface); --alert-fg: var(--on-danger-surface); }
  }

  .field { display: grid; gap: var(--space-1); }
  .field label { font-weight: 600; }
  .field input { padding: var(--space-2) var(--space-3); border: 2px solid var(--field-border, var(--border)); border-radius: var(--radius-1); background: var(--surface); color: var(--on-surface); font: inherit; }
  .field__error { display: none; color: var(--danger); font-size: 0.875rem; }
  :where(.field:has([aria-invalid="true"])) { --field-border: var(--danger); }
  :where(.field:has([aria-invalid="true"])) .field__error { display: block; }
  .form { display: grid; gap: var(--space-3); max-inline-size: 24rem; }

  .card {
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--radius-2);
    background: var(--surface-raised);
    box-shadow: 0 var(--elevation) calc(var(--elevation) * 4) var(--shadow);
    transition: --elevation 0.2s ease;

    &:hover { --elevation: 8px; }
  }
  .card__title { font-size: 1.125rem; }

  @media (prefers-reduced-motion: reduce) {
    .card { transition: none; }
  }

  @media (forced-colors: active) {
    .button, .field input { border: 2px solid ButtonText; }
    :focus-visible { outline-color: Highlight; }
  }
}

@layer utilities {
  .visually-hidden { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  /* stylelint-disable-next-line declaration-no-important -- выключатель: политика разрешает !important только в слое utilities */
  .u-hidden { display: none !important; }
}`,
      { filename: "style.css", lineNumbers: true },
    ),
    h("Почему так"),
    ul(
      "**Три уровня.** Примитивы (`--color-blue-700`) не знают, где будут использованы; роли (`--accent`) выбирают примитивы и описывают назначение; компонентные переменные (`--btn-bg`) принимают значения ролей и читаются одним свойством. Смена бренда — правка ролей, смена темы — правка значений ролей, новый вариант кнопки — одно значение переменной.",
      "**Нулевой вес и порядок.** Базовые роли и темы записаны через `:where(:root…)`: вес у всех равен нулю, поэтому побеждает **порядок**, а не селектор. Явные темы стоят после базового набора и перебивают его без повышения веса.",
      "**Светлая и тёмная одним набором.** `color-scheme: light dark` + `light-dark(светлое, тёмное)`: на каждую роль — одна строка. Радиокнопка «Светлая» или «Тёмная» меняет только `color-scheme`, и все роли пересчитываются сами; «Авто» остаётся «light dark» и следует системе.",
      "**Контрастная тема.** Она не использует `light-dark()`: все роли заданы явно чёрным, белым и жёлтым акцентом, потому что цель — не «красиво», а ≥ 7:1 и белые границы.",
      "**Каналы.** `.button` читает `--btn-bg`, `--btn-fg`, `--btn-border`; `&.button--primary` и `&.button--danger` меняют только переменные. Точно так же устроены `.badge`, `.alert` и поле формы (`--field-border`), поэтому состояние ошибки — одна строка с `:where(.field:has([aria-invalid=\"true\"]))` нулевого веса.",
      "**Типизированная переменная.** `@property --elevation` с `syntax: \"<length>\"` делает переменную интерполируемой: карточка плавно поднимается при наведении (`--elevation: 2px → 8px`). При `prefers-reduced-motion: reduce` переход отключён, при `forced-colors: active` границы получают системные цвета.",
      "**Политика `!important`.** В слое `utilities` разрешён `!important` у `.u-hidden`; рядом стоит комментарий `stylelint-disable-next-line`, который объясняет исключение и держит линтер включённым для остального кода.",
    ),
    h("Самопроверка"),
    p("Скрипт вставляется в консоль страницы. Он **кликает по радиокнопкам**, считает реальные цвета элементов (`getComputedStyle`), строит контраст по формуле WCAG, разбирает таблицу стилей (включая слои, вложенность и `@property`) и в конце возвращает режим «Авто»."),
    code(
      "js",
      `// check.js — самопроверка проекта «Дизайн-система: темы и токены»: вставьте в консоль страницы (скрипт асинхронный)
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const cs = (el) => getComputedStyle(el);
  const root = document.documentElement;
  const checks = [];
  const add = (name, ok, detail) => checks.push({ проверка: name, итог: ok ? "OK" : "НЕТ", детали: detail });

  // --- цвет и контраст ---
  const rgb = (s) => s.match(/[\\d.]+/g).slice(0, 3).map(Number);
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = cs(e).backgroundColor; if (!/rgba?\\(.*,\\s*0\\)$|transparent/.test(c)) return rgb(c); } return rgb(cs(document.body).backgroundColor); };
  const token = (name) => { const i = document.createElement("i"); i.style.color = "var(" + name + ")"; document.body.append(i); const c = cs(i).color; i.remove(); return rgb(c); };
  const pick = async (v) => { $("input[name=theme][value=" + v + "]").click(); await sleep(80); };

  // --- таблица стилей ---
  const flat = (rules, out = []) => { for (const r of rules) { out.push(r); if (r.cssRules) flat(r.cssRules, out); } return out; };
  const all = [...document.styleSheets].flatMap((s) => { try { return flat(s.cssRules); } catch { return []; } });
  const styleRules = all.filter((r) => r instanceof CSSStyleRule);
  const layerOf = (r) => { for (let p = r.parentRule; p; p = p.parentRule) if (p instanceof CSSLayerBlockRule) return p.name; return null; };
  const full = (r) => (r.parentRule instanceof CSSStyleRule ? r.selectorText.replace(/&/g, ":is(" + full(r.parentRule) + ")") : r.selectorText);
  const splitTop = (s) => { const out = []; let d = 0, cur = ""; for (const ch of s) { if (ch === "(" || ch === "[") d++; if (ch === ")" || ch === "]") d--; if (ch === "," && d === 0) { out.push(cur.trim()); cur = ""; } else cur += ch; } return out.concat(cur.trim()); };
  const weight = (sel) => {
    const s = sel.replace(/:where\\((?:[^()]|\\([^()]*\\))*\\)/g, "").replace(/::?[\\w-]+(\\((?:[^()]|\\([^()]*\\))*\\))?/g, (m) => (m.startsWith("::") ? " x" : ".p"));
    return [(s.match(/#[\\w-]+/g) || []).length, (s.match(/\\.[\\w-]+|\\[[^\\]]*\\]/g) || []).length, (s.replace(/\\.[\\w-]+|\\[[^\\]]*\\]|#[\\w-]+/g, " ").match(/(^|[\\s>+~])[a-z][\\w-]*/gi) || []).length];
  };
  const literalColor = /#[0-9a-f]{3,8}\\b|\\b(?:rgb|rgba|hsl|hsla|hwb|oklch|oklab|lab|lch)\\(/i;

  // 1. значения ролей в каждой теме: контраст реальных элементов
  const roles = [
    ["основной текст", ".card p:not(.muted)", 4.5], ["приглушённый текст", ".muted", 4.5], ["ссылка", ".card a", 4.5],
    ["кнопка по умолчанию", ".button:not(.button--primary):not(.button--danger)", 4.5], ["главная кнопка", ".button--primary:not(:disabled)", 4.5], ["опасная кнопка", ".button--danger", 4.5],
    ["уведомление: информация", ".alert:not([data-variant])", 4.5], ["уведомление: успех", ".alert[data-variant=success]", 4.5], ["уведомление: предупреждение", ".alert[data-variant=warning]", 4.5], ["уведомление: ошибка", ".alert[data-variant=danger]", 4.5],
    ["значок: успех", ".badge[data-variant=success]", 4.5], ["значок: ошибка", ".badge[data-variant=danger]", 4.5], ["текст поля ввода", "#email", 4.5], ["текст ошибки поля", ".field__error", 4.5],
  ];
  const bad = [], themeInfo = {};
  for (const theme of ["light", "dark", "contrast"]) {
    await pick(theme);
    const need = theme === "contrast" ? 7 : 4.5;
    const surface = token("--surface");
    const min = roles.map(([name, sel]) => { const el = $(sel); return [name, contrast(rgb(cs(el).color), bgOf(el))]; });
    min.filter(([, c]) => c < need).forEach(([n, c]) => bad.push(theme + ": " + n + " " + c.toFixed(2)));
    const ui = [["граница кнопки", rgb(cs($(".button:not(.button--primary):not(.button--danger)")).borderTopColor)], ["граница поля", rgb(cs($("#email")).borderTopColor)], ["граница карточки", rgb(cs($(".card")).borderTopColor)], ["кольцо фокуса", token("--focus")]];
    ui.filter(([, c]) => contrast(c, surface) < 3).forEach(([n, c]) => bad.push(theme + ": " + n + " " + contrast(c, surface).toFixed(2) + " < 3"));
    themeInfo[theme] = { surface: cs(root).colorScheme, worst: Math.min(...min.map(([, c]) => c)).toFixed(2) };
  }
  add("Текст и роли: контраст ≥ 4.5:1 (в контрастной теме ≥ 7:1), элементы интерфейса ≥ 3:1", bad.length === 0, bad.length ? bad.join("; ") : "худшие пары: " + Object.entries(themeInfo).map(([t, v]) => t + " " + v.worst).join(", "));

  // 2. переключатель тем
  const schemes = {};
  for (const v of ["auto", "light", "dark", "contrast"]) { await pick(v); schemes[v] = cs(root).colorScheme; }
  add("Тема меняет color-scheme: auto — «light dark», light — light, dark и contrast — dark", schemes.auto === "light dark" && schemes.light === "light" && schemes.dark === "dark" && schemes.contrast === "dark", JSON.stringify(schemes));
  await pick("light"); const sLight = token("--surface").join(); await pick("dark"); const sDark = token("--surface").join(); await pick("contrast"); const sCon = token("--surface").join(); await pick("auto"); const sAuto = token("--surface").join();
  const osDark = matchMedia("(prefers-color-scheme: dark)").matches;
  add("Режим «Авто» следует системной теме, остальные различаются", sAuto === (osDark ? sDark : sLight) && new Set([sLight, sDark, sCon]).size === 3 && (sLight !== sDark), "система: " + (osDark ? "тёмная" : "светлая") + "; фон светлой " + sLight + ", тёмной " + sDark + ", контрастной " + sCon);

  // 3. три уровня токенов
  const tokenRules = styleRules.filter((r) => layerOf(r) === "tokens");
  const declared = tokenRules.flatMap((r) => [...r.style].filter((n) => n.startsWith("--")).map((n) => [n, r.style.getPropertyValue(n).trim()]));
  const primitives = declared.filter(([n]) => /^--color-/.test(n));
  const semantic = declared.filter(([n]) => !/^--(color|space|radius)-/.test(n));
  add("Примитивы: не меньше 12 цветов --color-* в слое tokens", new Set(primitives.map(([n]) => n)).size >= 12, "примитивов: " + new Set(primitives.map(([n]) => n)).size);
  const badSem = semantic.filter(([n, v]) => literalColor.test(v) && n !== "--shadow");
  add("Семантика ссылается на примитивы: в ролях нет литералов цвета (кроме --shadow)", new Set(semantic.map(([n]) => n)).size >= 14 && badSem.length === 0, "ролей: " + new Set(semantic.map(([n]) => n)).size + (badSem.length ? ", с литералами: " + badSem.map(([n]) => n).join(", ") : ""));
  const compRules = styleRules.filter((r) => ["base", "components", "utilities"].includes(layerOf(r)) && !all.some((m) => m instanceof CSSMediaRule && [...m.cssRules].includes(r) && /forced-colors/.test(m.conditionText)));
  const badComp = compRules.filter((r) => literalColor.test(r.cssText) || /var\\(--color-/.test(r.cssText));
  add("Компоненты используют роли и свои переменные: нет литералов цвета и --color-*", badComp.length === 0, badComp.length ? badComp.map((r) => r.selectorText).join(", ") : "правил проверено: " + compRules.length);

  // 4. современные возможности
  const props = all.filter((r) => r instanceof CSSPropertyRule);
  const cardTyped = cs($(".card")).getPropertyValue("--elevation").trim();
  add("Типизированная переменная @property (--elevation: <length>) зарегистрирована и анимируется", props.some((r) => r.name === "--elevation" && /<length>/.test(r.syntax)) && cardTyped === "2px" && /--elevation/.test(cs($(".card")).transitionProperty), "@property: " + props.map((r) => r.name).join(", ") + "; значение " + cardTyped + "; transition-property: " + cs($(".card")).transitionProperty);
  const hasCount = styleRules.filter((r) => /:has\\(/.test(full(r))).length, nested = styleRules.filter((r) => r.cssRules && r.cssRules.length > 0).length;
  add("Использованы :has(), вложенность CSS и light-dark()", hasCount >= 2 && nested >= 1 && /light-dark\\(/.test(all.map((r) => r.cssText).join("")), ":has: " + hasCount + " правил, вложенных родителей: " + nested);
  const cond = all.filter((r) => r instanceof CSSMediaRule).map((r) => r.conditionText).join(" ");
  add("Учтены prefers-reduced-motion и forced-colors", /prefers-reduced-motion/.test(cond) && /forced-colors/.test(cond), cond);
  const css = all.map((r) => r.cssText).join("\\n");
  const physical = styleRules.filter((r) => /(^|[;{\\s])(margin|padding|border)-(left|right|top|bottom)\\b|(^|[;{\\s])(left|right|top|bottom|width|height|min-width|max-width|min-height|max-height)\\s*:|text-align:\\s*(left|right)|float:\\s*(left|right)/.test(r.cssText.replace(/^[^{]*\\{/, "")));
  add("Только логические свойства (inline/block), без left/right/width/height", physical.length === 0, physical.length ? physical.map((r) => r.selectorText).join(", ") : "физических свойств нет");

  // 5. архитектура
  const layerStmt = all.find((r) => r instanceof CSSLayerStatementRule);
  const order = layerStmt ? [...layerStmt.nameList] : [];
  add("Порядок слоёв: reset → tokens → base → components → utilities", order.join(",") === "reset,tokens,base,components,utilities", order.join(" → ") || "нет @layer");
  const imp = styleRules.filter((r) => /!important/.test(r.cssText)), impOut = imp.filter((r) => layerOf(r) !== "utilities");
  const ids = styleRules.filter((r) => /#[\\w-]+/.test(full(r)));
  add("!important только в слое utilities; идентификаторов в селекторах нет", impOut.length === 0 && ids.length === 0, "!important вне utilities: " + impOut.length + ", с #id: " + ids.length);
  const max = styleRules.reduce((m, r) => { const w = splitTop(full(r)).map(weight).sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]; return (w[0] - m[0] || w[1] - m[1] || w[2] - m[2]) > 0 ? w : m; }, [0, 0, 0]);
  add("Специфичность не выше (0,2,0) (с учётом вложенности)", max[0] === 0 && (max[1] < 2 || (max[1] === 2 && max[2] === 0)), "(" + max.join(",") + ")");
  add("Есть заметный :focus-visible", styleRules.some((r) => /:focus-visible/.test(r.selectorText) && parseFloat((r.style.outline.match(/(\\d+)px/) || [])[1]) >= 2), ":focus-visible { outline }");
  add("Нет горизонтальной прокрутки", root.scrollWidth <= root.clientWidth, "scrollWidth " + root.scrollWidth + ", clientWidth " + root.clientWidth + " (" + innerWidth + " px)");

  await pick("auto");
  console.table(checks);
  return checks.every((c) => c.итог === "OK");
})();`,
      { filename: "check.js", lineNumbers: true, collapsed: true },
    ),
    h("Результаты проверки решения"),
    table(
      ["Что проверялось", "Результат"],
      [
        ["Самопроверка на 1280 и 320px при системной светлой и тёмной теме", "все 15 проверок — OK"],
        ["Контраст ключевых ролей, светлая тема", "основной текст 15.78, приглушённый 6.95, ссылка 8.56, главная кнопка 9.31, опасная кнопка 6.54, ошибка 5.40, успех 6.40, предупреждение 6.68"],
        ["Контраст ключевых ролей, тёмная тема", "13.02, 7.93, 7.93, 9.07, 9.02, 7.88, 9.09, 11.15"],
        ["Контраст ключевых ролей, контрастная тема", "21.00, 17.23, 16.88, 16.88, 10.44, 10.44, 12.03, 14.75 (все ≥ 7)"],
        ["Приглушённый текст `#7a7e99`", "3.66 (светлая) и 3.98 (тёмная) — ниже 4.5; в контрастной 5.27 — ниже 7"],
        ["Тёмная тема без `light-dark()`", "13 из 15: контраст поля ввода 1.22, ошибки 2.01, кольца фокуса 1.24; фон «Светлой» и «Тёмной» одинаков (255, 255, 255)"],
        ["Литерал цвета, прямой примитив, `!important`, физическое свойство, нарушенный порядок слоёв, без `@property`, без `forced-colors`", "14 из 15: каждый вариант ловится своей проверкой"],
        ["`stylelint` (`selector-max-id: 0`, `declaration-no-important: true`, `selector-max-specificity: \"0,2,0\"`, `selector-max-compound-selectors: 3`)", "0 нарушений; без комментария у `.u-hidden` — 1 (разрешённый `!important`); с лишней специфичностью `.button.button--primary:hover:focus` — «Too high specificity»"],
      ],
      "Проверка эталона",
    ),
    warn("Переключатель на радиокнопках не запоминает выбор: после перезагрузки снова «Авто». Это ограничение чисто CSS-решения; запоминание темы — зона ответственности атрибута на `<html>` и `localStorage`, а не CSS."),
    tip("Когда понадобится ещё одна тема, не копируйте компоненты: добавьте набор ролей в слой `tokens` и одну радиокнопку. Если пришлось менять компонент — значит, в нём остались литералы или прямые примитивы."),
  ],
};
