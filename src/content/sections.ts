import type { SectionKind } from "./types";

export type DocSectionId = SectionKind | "practice" | "challenge" | "interview" | "exam" | "mastery";

export interface SectionMeta {
  id: DocSectionId;
  num: string;
  title: string;
  en: string;
}

/** Фиксированная нумерация Topic Document (01–20). */
export const SECTION_META: Record<DocSectionId, SectionMeta> = {
  definition: { id: "definition", num: "01", title: "Определение", en: "Definition" },
  why: { id: "why", num: "02", title: "Зачем это существует", en: "Why it exists" },
  "mental-model": { id: "mental-model", num: "03", title: "Ментальная модель", en: "Mental model" },
  technical: { id: "technical", num: "04", title: "Техническое объяснение", en: "Technical explanation" },
  syntax: { id: "syntax", num: "05", title: "Синтаксис и структура", en: "Syntax & structure" },
  "minimal-example": { id: "minimal-example", num: "06", title: "Минимальный пример", en: "Minimal example" },
  "detailed-example": { id: "detailed-example", num: "07", title: "Подробный пример", en: "Detailed example" },
  analysis: { id: "analysis", num: "08", title: "Разбор по частям", en: "Line-by-line analysis" },
  internals: { id: "internals", num: "09", title: "Что происходит внутри", en: "Internals" },
  mistakes: { id: "mistakes", num: "10", title: "Типичные ошибки", en: "Common mistakes" },
  antipatterns: { id: "antipatterns", num: "11", title: "Антипаттерны", en: "Anti-patterns" },
  "best-practices": { id: "best-practices", num: "12", title: "Лучшие практики", en: "Best practices" },
  "edge-cases": { id: "edge-cases", num: "13", title: "Крайние случаи", en: "Edge cases" },
  related: { id: "related", num: "14", title: "Связанные понятия", en: "Related concepts" },
  "before-after": { id: "before-after", num: "15", title: "До и после", en: "Before / After" },
  practice: { id: "practice", num: "16", title: "Практика", en: "Practice" },
  challenge: { id: "challenge", num: "17", title: "Инженерная задача", en: "Engineering challenge" },
  interview: { id: "interview", num: "18", title: "Вопросы с собеседований", en: "Interview questions" },
  exam: { id: "exam", num: "19", title: "Экзаменационные вопросы", en: "Exam questions" },
  mastery: { id: "mastery", num: "20", title: "Проверка мастерства", en: "Mastery check" },
};

export const LEVEL_LABEL = {
  foundation: "Foundation",
  core: "Core",
  intermediate: "Intermediate",
  advanced: "Advanced",
  engineering: "Engineering",
  mastery: "Mastery",
} as const;

export const LEVEL_ORDER = ["foundation", "core", "intermediate", "advanced", "engineering", "mastery"] as const;

export const DIFFICULTY_LABEL = { foundation: "Базовый", intermediate: "Средний", advanced: "Продвинутый" } as const;

export const INTERVIEW_LEVEL_LABEL = {
  basic: "Базовый",
  intermediate: "Средний",
  advanced: "Продвинутый",
  engineering: "Инженерный",
  debugging: "Отладка",
} as const;

export const PRACTICE_KIND_LABEL = {
  recall: "Вспомнить",
  understanding: "Понять",
  application: "Применить",
  debugging: "Отладить",
  engineering: "Спроектировать",
} as const;
