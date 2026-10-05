import type { DomainDef } from "../types";

export const jsDomain: DomainDef = {
  id: "js",
  code: "03",
  slug: "js",
  title: "JavaScript",
  subtitle: "Language + Runtime + Browser",
  tagline: "Язык, среда выполнения, браузер",
  overview: [
    "Курс по самому языку JavaScript — без фреймворков. Цель — понимать модель исполнения: контексты, лексические окружения, замыкания, прототипы, цикл событий.",
    "После языка — браузерная среда: DOM, события, формы, `fetch`, хранилища, и инженерные темы: ошибки, память, производительность, отладка.",
  ],
  why: [
    "Фреймворки меняются, семантика языка — нет. Понимание ядра позволяет читать любой код и находить причину, а не симптом.",
    "Большинство трудных багов (потерянный `this`, гонки промисов, утечки памяти) — следствие неверной ментальной модели.",
  ],
  outcomes: [
    "Объяснять и предсказывать поведение замыканий, `this`, цепочки прототипов",
    "Рассуждать о порядке выполнения асинхронного кода через модель цикла событий",
    "Работать с DOM и событиями без библиотек",
    "Проектировать модульный код на ESM",
    "Диагностировать ошибки, утечки памяти и проблемы производительности",
  ],
  prerequisites: ["Курс HTML (модули 1–5)", "Желательно: основы CSS"],
  estimatedHours: 90,
  accent: "emerald",
  modules: [
    { id: "language", index: 1, project: "js.p01-data-without-surprises", title: "Основы языка", titleEn: "Language Fundamentals", summary: "Переменные, типы, операторы, приведение, равенство, управляющие конструкции.", level: "foundation" },
    { id: "functions", index: 2, title: "Функции", titleEn: "Functions", summary: "Объявления, выражения, параметры, функции высшего порядка, рекурсия.", level: "foundation" },
    { id: "execution", index: 3, title: "Модель исполнения", titleEn: "Execution Model", summary: "Контексты, лексические окружения, scope chain, hoisting, TDZ, замыкания.", level: "core" },
    { id: "objects", index: 4, project: "js.p02-library-model", title: "Объекты и прототипы", titleEn: "Objects & Prototypes", summary: "Объектная модель, прототипы, this, call/apply/bind, классы.", level: "core" },
    { id: "collections", index: 5, project: "js.p03-dependency-graph", title: "Структуры данных", titleEn: "Data Structures", summary: "Array, Object, Map, Set, WeakMap, WeakSet, итерация.", level: "intermediate" },
    { id: "modern", index: 6, title: "Современный JavaScript", titleEn: "Modern JavaScript", summary: "Деструктуризация, spread/rest, модули ESM, итераторы, генераторы.", level: "intermediate" },
    { id: "async", index: 7, project: "js.p04-loader", title: "Асинхронность", titleEn: "Asynchronous JavaScript", summary: "Цикл событий, микро- и макрозадачи, Promise, async/await, AbortController.", level: "advanced" },
    { id: "browser", index: 8, project: "js.p05-tasks-app", title: "Браузерные API", titleEn: "Browser APIs", summary: "DOM, события, делегирование, формы, fetch, хранилища, URL, таймеры.", level: "advanced" },
    { id: "engineering", index: 9, title: "Инженерия JavaScript", titleEn: "JavaScript Engineering", summary: "Память, сборка мусора, производительность, ошибки, архитектура, отладка.", level: "engineering" },
    { id: "capstone", index: 10, title: "Итоговый проект", titleEn: "Final Project", summary: "Приложение на чистом JavaScript с модульной архитектурой.", level: "mastery" },
  ],
};
