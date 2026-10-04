# DevDock Ultra — прогресс

**Стек:** Next.js 16 (App Router) · TypeScript 5.9 · Tailwind v4 · Framer Motion · Zustand (persist) · Shiki (сервер) · Fuse.js.
**Язык продукта:** русский. Код и идентификаторы — английские.

## Как продолжить (resume protocol)
1. `npm install` → `npm run validate:content` (качество контента) → `npm run build`.
2. Новая тема = один файл `src/content/<domain>/topics/<slug>.ts` + строка в `topics/index.ts` (порядок = порядок изучения). UI менять не нужно.
3. Конструкторы блоков — `src/content/dsl.ts`; типы — `src/content/types.ts`; фиксированная нумерация разделов 01–20 — `src/content/sections.ts`.
4. Проза в тексте — строки в одинарных кавычках (двойные кавычки внутри кода свободны); русские кавычки — «ёлочки».

## Выполнено
- [x] Phase 0–2: архитектура, модель контента, дизайн-система, шапка, поиск (Ctrl+K), главная, страницы домена и темы
- [x] Phase 3: движок Topic Document (20 разделов, практика, собеседование, экзамен, мастерство), `validate-content`
- [ ] Phase 4: HTML — 1 из ~44 тем написана (`what-is-html`)

## Текущее
HTML, модуль 1 «Основы документа».

## Дальше
Остальные темы HTML → проекты HTML → страницы проектов/практики/экзамена/собеседования → песочница → CSS → …

## Известные проблемы
- Страницы `/playground`, `/me`, `/flashcards`, `/projects/*`, `/practice/*`, `/exam/*`, `/interview/*` ещё не реализованы (ссылки ведут на 404).
