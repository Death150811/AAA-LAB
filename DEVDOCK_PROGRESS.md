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
- [ ] Phase 5+: домены CSS → JavaScript → SQL → Git → Computer Science

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

## Текущее
HTML завершён. Следующий домен — **CSS** (структура модулей: `src/content/css/domain.ts`, темы — `src/content/css/topics/`).

## Дальше
1. Домены CSS → JavaScript → SQL (с браузерным SQL-движком) → Git → Computer Science (контент по тем же стандартам; недописанные модули помечаются «Готовится»). Проекты — `src/content/<domain>/projects/pNN-….ts`, привязка через `module.project`.
2. Валидатор должен давать **0 ошибок** (сейчас: 41 тема, 7 проектов — 0 ошибок и 0 предупреждений).
3. Полировка: анимации, граф зависимостей, адаптивность, a11y-аудит интерфейса, финальный `npm run build` и «тест нового ученика».

## Известные ограничения
- Внешние URL источников не проверяются автоматически (сетевой прокси песочницы).
- До появления контента домены CSS/JS/SQL/Git/CS показывают дорожную карту модулей со статусом «Готовится» (без фейковых тем).
