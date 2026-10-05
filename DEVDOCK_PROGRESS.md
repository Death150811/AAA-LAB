# DevDock Ultra — прогресс

**Стек:** Next.js 16 (App Router) · TypeScript 5.9 · Tailwind v4 · Framer Motion · Zustand (persist) · Shiki (сервер) · Fuse.js.
**Язык продукта:** русский. Код и идентификаторы — английские.
**Ветка разработки:** `claude/peaceful-pascal-lza3um`.

## Как продолжить (resume protocol)
1. `npm install` → `npm run validate:content` (качество контента) → `npx tsc --noEmit` → `npm run lint` → `npm run build`.
2. Новая тема = один файл `src/content/<domain>/topics/<slug>.ts` + строка в `topics/index.ts` (порядок = порядок изучения; модуль определяется полем `module` темы). UI менять не нужно.
3. Конструкторы блоков — `src/content/dsl.ts` (`diagram(text, caption)`, `code(lang, src, opts)`, `mcq`, `open`, `iq`, `exercise` …); типы — `src/content/types.ts`; нумерация разделов 01–20 — `src/content/sections.ts`.
4. Проза — в строках с инлайн-разметкой `` `код` ``, `**жирный**`, `*курсив*`, `[текст](url)`. **В шаблонных строках с кодом нельзя использовать `${`** (TS интерполирует). Обратный слеш в шаблонной строке пишется как `\\`.
5. Проверяйте приём на реальном браузере (Playwright лежит в `/opt/node-tools/node_modules/playwright`, браузер — `/opt/pw-browsers/chromium`, запуск с `--no-proxy-server`).
6. Внешние ссылки в `sources` проверить нельзя (прокси песочницы отдаёт 403) — используем только канонические URL (WHATWG, W3C, MDN en-US, Google Search Central).

## Выполнено
- [x] Phase 0–3: архитектура, модель контента, дизайн-система, шапка, глобальный поиск (Ctrl/Cmd+K), главная, страницы домена и темы, движок Topic Document (20 разделов), `validate-content`
- [x] Практика, экзамен, собеседование, страницы проектов, песочница HTML/CSS/JS (iframe sandbox без `allow-same-origin` + CSP), личный кабинет (`/me`, прогресс, закладки, заметки, импорт/экспорт), флэшкарты (SM-2-lite)
- [x] **Phase 4: HTML — 41 тема (модули 1–11) + 7 проектов (модуль 12)**
- [x] **Phase 5: CSS — 43 темы (модули 1–10) + 7 проектов (модули 2–7 и итоговый)**
- [x] **Phase 6: JavaScript — 26 тем (модули 1–9) + 7 проектов (модули 1, 4, 5, 7, 8, 9 и итоговый)**
- [ ] Phase 7+: домены SQL → Git → Computer Science

### HTML: состояние по модулям
| № | Модуль | Темы | Проект модуля |
|---|--------|------|---------------|
| 1 | Основы документа | what-is-html, document-anatomy, elements-attributes, parsing-dom ✅ | — |
| 2 | Текст и контент | headings-paragraphs, inline-text, lists ✅ | — |
| 3 | Ссылки и навигация | links, navigation-patterns ✅ | p01-profile |
| 4 | Изображения и медиа | images, responsive-images, audio-video, embedded-content ✅ | — |
| 5 | Семантический HTML | landmarks, sectioning, content-semantics ✅ | p02-portfolio |
| 6 | Таблицы | tables-structure, tables-accessibility ✅ | p03-blog |
| 7 | Формы | forms-basics, input-types, form-controls, form-validation, form-ux-autocomplete ✅ | p04-docs |
| 8 | Доступность | a11y-fundamentals, aria, keyboard-focus, accessible-forms, a11y-failures ✅ | — |
| 9 | Метаданные и SEO | head-metadata, seo-fundamentals, open-graph-structured-data ✅ | p05-product-site |
| 10 | Продвинутый HTML | resource-loading, web-storage, interactive-elements, templates-custom-elements, global-attributes, html-security ✅ | — |
| 11 | Production | progressive-enhancement, html-performance, html-quality, document-patterns ✅ | p06-accessible-production |
| 12 | Итоговый проект | — | p07-final (двуязычный сайт сети библиотек) |

Все решения проектов проверены на реальных инструментах (html-validate, axe, Playwright, Lighthouse CI); код встроен из проверенных файлов.

### CSS: состояние по модулям
| № | Модуль | Темы | Проект модуля |
|---|--------|------|---------------|
| 1 | Ментальная модель | how-css-works, selectors, pseudo-classes-elements, cascade, specificity, inheritance-values, units-math, colors ✅ | — |
| 2 | Блочная модель и поток | box-model, display-flow, margin-collapsing, overflow-sizing, typography ✅ | p01-readable-article |
| 3 | Позиционирование | positioning, containing-block, stacking-contexts ✅ | p02-interface-layers |
| 4 | Flexbox | flexbox-basics, flex-sizing, flexbox-patterns ✅ | p03-flex-components |
| 5 | Grid | grid-basics, grid-areas-placement, grid-responsive, subgrid-alignment ✅ | p04-grid-dashboard |
| 6 | Адаптивный дизайн | media-queries, fluid-typography-spacing, container-queries, responsive-media ✅ | p05-responsive-landing |
| 7 | Современный CSS | custom-properties, is-where-has, logical-properties, cascade-layers, nesting-modern ✅ | p06-design-system |
| 8 | Анимация | transitions, keyframes, transforms, animation-performance-motion ✅ | — |
| 9 | Архитектура CSS | organizing-css, methodologies, design-tokens, specificity-management ✅ | — |
| 10 | Рендеринг и производительность | rendering-pipeline, css-performance, debugging-css ✅ | — |
| 11 | Итоговый проект | — | p07-final (сайт студии: токены, темы, формулы, движение, бюджет) |

Все числа в темах CSS получены замерами в Chromium (CDP-трассировка, `getComputedStyle`, `LayerTree`, Playwright coverage, `@bramus/specificity`, stylelint); примеры и скрипты из тем извлекаются и запускаются. Каждый проект CSS сопровождается **самопроверкой** (`check.js`, 15–24 проверки по `getComputedStyle`/CSSOM) и набором «плохих» вариантов, которые она обязана ловить; код решений встроен из проверенных файлов (`scratchpad`-генератор `mkproject.py` экранирует его в TS). Итоговый проект проверяется командой `run-checks.mjs` на 7 ширинах × 2 системные темы.

### JavaScript: состояние по модулям
| № | Модуль | Темы | Проект модуля |
|---|--------|------|---------------|
| 1 | Основы языка | what-is-js, variables-types, operators-coercion, control-flow ✅ | p01-data-without-surprises (117 проверок, 3 часовых пояса) |
| 2 | Функции | functions-basics, higher-order-recursion ✅ | — |
| 3 | Выполнение | execution-context-scope, closures ✅ | — |
| 4 | Объекты и прототипы | objects-properties, prototypes-this, classes ✅ | p02-library-model (56 проверок) |
| 5 | Структуры данных | arrays, map-set-weak ✅ | p03-dependency-graph (38 проверок) |
| 6 | Современный JS | destructuring-spread, modules-esm, iterators-generators ✅ | — |
| 7 | Асинхронность | event-loop, promises, async-await-abort ✅ | p04-loader (31 проверка, настоящий http-сервер) |
| 8 | Браузерные API | dom-events, forms-fetch, storage-url-timers ✅ | p05-tasks-app (28 проверок в Chromium) |
| 9 | Инженерия JavaScript | errors-debugging, memory-gc, performance, testing-architecture ✅ | p06-tiny-test (46 проверок: память, производительность, ложные «зелёные») |
| 10 | Итоговый проект | — | p07-notes-app (44 проверки: домен + клиент API + приложение в Chromium, офлайн-очередь) |

Все числа в темах JS получены замерами (Node.js 22.22.0, Chromium 141 через Playwright, CDP `Performance.getMetrics`, `--allow-natives-syntax`, `--expose-gc`). Каждый проект JS — это `check.mjs` + заготовка + эталон + набор «плохих» вариантов (мутаций), которые проверка обязана ловить; результаты (`Пройдено проверок: X из N`) встроены в страницу проекта.

## Текущее
HTML, CSS и JavaScript завершены. Следующий домен — **SQL** (браузерный SQL-движок; структура модулей: `src/content/sql/domain.ts`).

## Дальше
1. Домены SQL (с браузерным SQL-движком) → Git → Computer Science (контент по тем же стандартам; недописанные модули помечаются «Готовится»). Проекты — `src/content/<domain>/projects/pNN-….ts`, привязка через `module.project`.
2. Валидатор должен давать **0 ошибок** (сейчас: 110 тем, 21 проект — 0 ошибок и 0 предупреждений).
3. Полировка: анимации, граф зависимостей, адаптивность, a11y-аудит интерфейса, финальный `npm run build` и «тест нового ученика».

## Известные ограничения
- Внешние URL источников не проверяются автоматически (сетевой прокси песочницы).
- До появления контента домены JS/SQL/Git/CS показывают дорожную карту модулей со статусом «Готовится» (без фейковых тем).
