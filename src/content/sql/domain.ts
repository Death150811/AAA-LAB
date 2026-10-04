import type { DomainDef } from "../types";

export const sqlDomain: DomainDef = {
  id: "sql",
  code: "04",
  slug: "sql",
  title: "SQL",
  subtitle: "Data and Database Engineering",
  tagline: "Данные и инженерия баз данных",
  overview: [
    "SQL — декларативный язык работы с реляционными данными: вы описываете **какой результат** нужен, а СУБД решает, как его получить. Курс учит не «писать запросы», а рассуждать о задаче данных.",
    "От реляционной модели и JOIN — к оконным функциям, проектированию схем, транзакциям, индексам и чтению планов выполнения.",
  ],
  why: [
    "Данные живут дольше кода. Ошибки в схеме и запросах дороги и часто необратимы.",
    "Понимание плана выполнения и транзакций отличает инженера от человека, который «получил нужные строки».",
  ],
  outcomes: [
    "Формулировать задачу в терминах множеств и отношений",
    "Писать корректные запросы с JOIN, агрегацией, подзапросами, CTE и оконными функциями",
    "Проектировать нормализованную схему с ограничениями",
    "Объяснять ACID и уровни изоляции, предсказывать аномалии",
    "Читать `EXPLAIN` и обоснованно выбирать индексы",
  ],
  prerequisites: ["Базовое понимание таблиц и структурированных данных"],
  estimatedHours: 70,
  accent: "steel",
  modules: [
    { id: "relational", index: 1, title: "Реляционная модель", titleEn: "Relational Model", summary: "Таблицы, строки, ключи, ограничения, NULL, типы данных.", level: "foundation" },
    { id: "queries", index: 2, title: "Запросы", titleEn: "Querying", summary: "SELECT, WHERE, ORDER BY, GROUP BY, HAVING, DISTINCT, LIMIT.", level: "foundation" },
    { id: "modification", index: 3, title: "Изменение данных", titleEn: "Data Modification", summary: "INSERT, UPDATE, DELETE, upsert.", level: "core" },
    { id: "joins", index: 4, title: "JOIN", summary: "INNER, LEFT, RIGHT, FULL, CROSS, SELF: визуально и концептуально.", level: "core" },
    { id: "advanced-sql", index: 5, title: "Продвинутый SQL", titleEn: "Advanced SQL", summary: "Подзапросы, CTE, рекурсивные CTE, оконные функции.", level: "intermediate" },
    { id: "design", index: 6, title: "Проектирование БД", titleEn: "Database Design", summary: "Нормализация, связи, ограничения, схемы.", level: "intermediate" },
    { id: "transactions", index: 7, title: "Транзакции", titleEn: "Transactions", summary: "ACID, границы транзакций, изоляция, конкурентность.", level: "advanced" },
    { id: "performance", index: 8, title: "Производительность", titleEn: "Performance", summary: "Индексы, B-tree, планировщик, EXPLAIN ANALYZE.", level: "advanced" },
    { id: "production", index: 9, title: "Production-мышление", titleEn: "Production Thinking", summary: "Рассуждение о задачах данных, миграции, безопасность запросов.", level: "engineering" },
    { id: "capstone", index: 10, title: "Итоговый проект", titleEn: "Final Project", summary: "Схема и аналитические запросы для реалистичной предметной области.", level: "mastery" },
  ],
};
