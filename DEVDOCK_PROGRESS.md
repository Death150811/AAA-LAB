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
- [x] **Phase 7: SQL — 27 тем (модули 1–9) + 7 проектов (модули 1–7 и итоговый)** — все примеры и числа получены замерами на PostgreSQL 16.14 (портируемые — ещё и на SQLite 3.49)
- [x] **Phase 8: Git — 21 тема (модули 1–7) + 7 проектов (модули 2–7 и итоговый)** — все примеры — воспроизводимые сеансы на реальном git 2.43.0
- [x] **Phase 9: Computer Science — 22 темы (модули 1–8) + 7 проектов (модули 1–6 и итоговый)** — все числа и примеры получены замерами на этой машине (Node.js 22.22.0, CPython 3.11, gcc 13.3, rustc 1.97, Go, Java, valgrind, clang); проекты проверяются `check.mjs` с независимыми эталонами, «плохими» вариантами и (для итогового) покрытием и мутационным тестированием.
- [ ] Phase 10: полировка (анимации, граф зависимостей, a11y-аудит интерфейса), финальный `npm run build`, «тест нового ученика», итоговый архив

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

### SQL: состояние по модулям
| № | Модуль | Темы | Проект модуля |
|---|--------|------|---------------|
| 1 | Реляционная модель | relational-model, data-types-null, keys-constraints ✅ | p01-shop-schema |
| 2 | Запросы | select-where, order-limit-distinct, group-by-having, expressions-case-dates ✅ | p02-sales-analytics |
| 3 | Изменение данных | insert-update-delete, upsert-returning ✅ | — |
| 4 | JOIN | inner-left-joins, other-joins, join-pitfalls ✅ | p03-join-reports |
| 5 | Продвинутый SQL | subqueries, ctes, recursive-ctes, window-functions ✅ | p04-rankings-hierarchies |
| 6 | Проектирование БД | normalization, relationships, schema-patterns ✅ | p05-school-normalization |
| 7 | Транзакции | acid-transactions, isolation-levels, locking-deadlocks ✅ | p06-reliable-booking (28 проверок, до 40 параллельных соединений) |
| 8 | Производительность | indexes-btree, explain-plans, query-tuning ✅ | — |
| 9 | Production-мышление | migrations-safe-ddl, sql-security ✅ | — |
| 10 | Итоговый проект | — | p07-shop-final (56 проверок: схема, индексы по числу страниц буфера, представление, роли, 6 отчётов на 60 000 заказов) |

Методология SQL: каждое утверждение и число в темах — из замеров PostgreSQL 16.14 (детерминизм: несколько прогонов, прогрев, `max_parallel_workers_per_gather = 0`, `autovacuum_enabled = false`; числа, зависящие от случайной выборки `ANALYZE`, в тексте только приближённые). Каждый проект — `check.mjs` (временная база, `psql`, пакет `pg`) + заготовка + решение + 8 «плохих» вариантов; в странице проекта показаны реальные результаты запусков решения, заготовки и мутантов (три прогона подряд дают одинаковые числа). Темы ссылаются вперёд друг на друга (`@@REL@@` при сборке) — после добавления новой темы пересобирать темы, на которые она должна ссылаться.

Инструментарий создания SQL-контента (шаблоны тем, сборщики, фикстуры, `check.mjs`-генераторы) лежал во временной директории сеанса и **в репозиторий не входит**; сгенерированные файлы `src/content/sql/**` — окончательный источник. Для проверки примеров нужен PostgreSQL 16 (в песочнице запускался под пользователем `nobody`: `pg_ctl -D /tmp/devdock-pg/data -o "-p 54329 -c listen_addresses=127.0.0.1 -c unix_socket_directories=/tmp -c fsync=off" start`).

### Git: состояние по модулям
| № | Модуль | Темы | Проект модуля |
|---|--------|------|---------------|
| 1 | Основы | git-mental-model, three-areas, commits-history ✅ | — |
| 2 | Базовые операции | undoing-changes, gitignore-tracking, searching-history ✅ | p01-tidy-history (24 проверки) |
| 3 | Ветки и слияние | branches-head, merge, merge-conflicts ✅ | p02-merge-conflicts (21 проверка) |
| 4 | Совместная работа | remotes-fetch-push, remote-collaboration ✅ | p03-remote-sync (22 проверки, «сервер» + клон коллеги) |
| 5 | Продвинутый Git | rebase, interactive-rebase, cherry-pick-stash, reset-revert-reflog, bisect ✅ | p04-history-rescue (17 проверок: rebase -i, reflog, bisect) |
| 6 | Внутреннее устройство | objects-content-addressing, refs-packfiles-gc ✅ | p05-plumbing-repo (15 проверок, хэши эталона) |
| 7 | Инженерный процесс | branching-strategies, commit-quality-hooks, releases-tags ✅ | p06-release-flow (25 проверок: хук, версия, журнал, теги, hotfix) |
| 8 | Итоговый проект | — | p07-incident-day (27 проверок: разведка, чистка истории, конфликт, слияние, выпуски 3.0.1 и 3.1.0) |

Методология Git: каждый пример в темах — детерминированный сеанс на **git 2.43.0** (фиксированные авторы Alice Dev / Bob Coder / Carol Ops, фиксированные даты, одинаковый каталог запуска, двойной прогон для проверки одинаковости вывода; хэши в прозе — только из итоговых сеансов). Каждый проект — `setup.sh` (воспроизводимый репозиторий с фиксированными датами; **изолирован от глобальных настроек Git** — `GIT_CONFIG_GLOBAL=/dev/null`, потому что подпись коммитов меняет хэши), `check.mjs` (Node 18+, только читает репозитории; хэши исходных коммитов зашиты, потому что `setup.sh` воспроизводим; хуки и тесты запускаются во временном каталоге), эталонное `solution.sh`, заготовка и 8–10 «плохих» вариантов; в странице проекта — реальные результаты запусков (решение, заготовка, мутанты).

Инструментарий Git-контента (шаблоны тем, сборщики `mktopic.py`/`mkproject.py`, сценарии примеров, мутанты) лежал во временной директории сеанса и **в репозиторий не входит**; сгенерированные файлы `src/content/git/**` — окончательный источник. Скрипты проектов (`setup.sh`, `solution.sh`, `check.mjs`) целиком вшиты в страницы проектов.

### Computer Science: состояние по модулям
| № | Модуль | Темы | Проект модуля |
|---|--------|------|---------------|
| 1 | Алгоритмы и сложность | complexity-big-o, searching-sorting, recursion-dp ✅ | p01-algorithm-lab (40 проверок, 12 плохих вариантов) |
| 2 | Структуры данных | arrays-linked-lists, stacks-queues, hash-tables, trees-heaps, graphs ✅ | p02-data-structure-library (48 проверок, 14 плохих) |
| 3 | Архитектура компьютера | number-systems-encoding, cpu-memory-cache ✅ | p03-cpu-and-cache (51 проверка: ассемблер, эмулятор с флагами, симулятор кеша, float32; 19 плохих) |
| 4 | Операционные системы | processes-threads, virtual-memory-files, concurrency-scheduling ✅ | p04-scheduler-and-memory (46 проверок, независимые эталоны, 20 плохих) |
| 5 | Сети | network-model-ip-tcp, dns-http, tls-caching-cookies ✅ | p05-wire-protocols (53 проверки: IPv4, UDP, DNS, HTTP/1.1, кеш RFC 9111; 24 плохих) |
| 6 | Базы данных (теория) | relational-theory-indexes, transactions-consistency-theory ✅ | p06-mini-database (42 проверки: индексы, транзакции, журнал и сбой в любой точке; 22 плохих) |
| 7 | Языки программирования | compilation-interpretation, types-memory-models ✅ | — |
| 8 | Программная инженерия | abstraction-modularity, software-testing-design ✅ | — |
| 9 | Итоговый проект | — | p07-mini-ml (47 проверок: лексер, парсер, вывод типов Хиндли — Милнера, интерпретатор, компилятор и ВМ, 400 случайных программ против эталона, покрытие и мутационный индекс тестов; 38 плохих вариантов) |

Методология CS: темы собираются из шаблонов `topic.tpl.ts` + скриптов примеров (`@@RUN` запускается дважды и обязан давать одинаковый вывод; в страницу попадают только устойчивые числа — счётчики, отношения, булевы значения; время — только как калибровка в прозе «порядка»). Проекты — `pNN/{solution,starter,bad.py,check.mjs}` + `mkproject.py`; каждый «плохой» вариант — реальная ошибка в эталоне, и проверка обязана её заметить.

Инструментарий CS-контента (шаблоны, сборщики, скрипты примеров, проекты) лежал во временной директории сеанса и в репозиторий не входит — в репозитории только результат (`src/content/cs/`).

## Текущее
Контент всех шести доменов (HTML, CSS, JavaScript, SQL, Git, Computer Science) написан и проходит валидатор: **180 тем, 42 проекта, 0 ошибок**. Остаются полировка интерфейса, полная сборка `npm run build`, проверка в реальном браузере и итоговый архив.

## Проверено
- `npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm run validate:content` — без ошибок.
- Chromium (Playwright), `next start`: все 180 тем и 42 проекта + маршруты доменов (`learn`, `practice`, `exam`, `interview`, `projects`), `/flashcards`, `/playground`, `/me` при ширине 375 и 1280 px — статус 200, один `h1`, нет ошибок консоли и горизонтальной прокрутки; поиск по Ctrl+K находит темы и проект.
- axe-core (Chromium, 1280 px): **0 нарушений** на всех 180 темах, 42 проектах и маршрутах доменов (исправлены: контраст кнопок-ссылок и комментариев в коде, порядок заголовков, `tablist`, повторяющиеся ориентиры `aside`, фокус на прокручиваемых таблицах).

## Дальше
1. Дальнейшая полировка: анимации, граф зависимостей, «тест нового ученика» (прохождение пути от первой темы до итогового проекта глазами новичка).
2. Валидатор должен оставаться на **0 ошибок** при любых правках контента.

## Известные ограничения
- Внешние URL источников не проверяются автоматически (сетевой прокси песочницы).
- Инструментарий создания контента (шаблоны тем, сборщики, скрипты примеров, эталоны и `check.mjs` проектов) лежал во временной директории сеанса; в репозитории только результат — страницы тем и проектов с встроенным проверенным кодом.
