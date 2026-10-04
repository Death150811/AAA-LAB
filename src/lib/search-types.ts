export type SearchKind = "domain" | "topic" | "concept" | "exercise" | "interview" | "project" | "code" | "exam";

export interface SearchEntry {
  id: string;
  kind: SearchKind;
  title: string;
  /** Плоский текст для сопоставления (без разметки). */
  text: string;
  href: string;
  domain: string;
  /** Контекст для отображения: «HTML · Формы». */
  context: string;
  tags: string[];
}

export const KIND_LABEL: Record<SearchKind, string> = {
  domain: "Курс",
  topic: "Тема",
  concept: "Понятие",
  exercise: "Упражнение",
  interview: "Собеседование",
  project: "Проект",
  code: "Код",
  exam: "Экзамен",
};
