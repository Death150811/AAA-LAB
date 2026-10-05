/**
 * Типизированная модель образовательного контента DevDock Ultra.
 *
 * Иерархия:  Domain → Module → Topic → (Section → Block) + Exercise / Challenge / Interview / Exam / Mastery
 * Контент — это данные. UI знает только про эти типы и не содержит учебного текста.
 */

export type DomainId = "html" | "css" | "js" | "sql" | "git" | "cs";

/** Ступени пути внутри домена: Foundation → Core → Intermediate → Advanced → Engineering → Mastery */
export type Level = "foundation" | "core" | "intermediate" | "advanced" | "engineering" | "mastery";

export type Difficulty = "foundation" | "intermediate" | "advanced";

export type Accent = "cyan" | "emerald" | "indigo" | "steel";

/* ───────────────────────────── Блоки ───────────────────────────── */

export type CodeLang =
  | "html"
  | "css"
  | "js"
  | "ts"
  | "json"
  | "sql"
  | "bash"
  | "http"
  | "text"
  | "diff"
  | "c"
  | "python"
  | "yaml";

export type CalloutTone = "note" | "tip" | "warning" | "danger" | "insight";

/**
 * Инлайн-разметка внутри текстовых полей:
 *   **жирный**, *курсив*, `код`, [текст](url).
 * Внутренние ссылки начинаются с «/».
 */
export type Inline = string;

export interface ParagraphBlock {
  type: "p";
  text: Inline;
}

export interface SubheadingBlock {
  type: "h";
  text: string;
}

export interface ListBlock {
  type: "list";
  ordered?: boolean;
  items: Inline[];
}

export interface CodeBlock {
  type: "code";
  lang: CodeLang;
  code: string;
  filename?: string;
  caption?: string;
  /** Номера строк (с 1), которые нужно подсветить. */
  highlight?: number[];
  /** Показывать нумерацию строк. По умолчанию — если строк больше 6. */
  lineNumbers?: boolean;
  /** Блок можно выполнить в браузере: html открывается в песочнице, sql — выполняется движком SQLite (sql.js). */
  runnable?: boolean;
  /** Для sql: имя набора таблиц из `SQL_FIXTURES`, который создаётся перед выполнением блока. */
  fixture?: string;
  /** Блок раскрывается кнопкой (длинные примеры). */
  collapsed?: boolean;
}

export interface CalloutBlock {
  type: "callout";
  tone: CalloutTone;
  title?: string;
  text: Inline;
}

export interface TableBlock {
  type: "table";
  caption?: string;
  head: Inline[];
  rows: Inline[][];
}

export interface DefinitionBlock {
  type: "definition";
  term: string;
  /** Оригинальный английский термин. */
  en?: string;
  text: Inline;
}

export interface CompareSide {
  title?: string;
  lang: CodeLang;
  code: string;
  note: Inline;
}

/** Сравнение: неправильно/правильно или до/после. */
export interface CompareBlock {
  type: "compare";
  variant: "wrong-right" | "before-after";
  bad: CompareSide;
  good: CompareSide;
}

export interface AnnotatedBlock {
  type: "annotated";
  lang: CodeLang;
  code: string;
  filename?: string;
  /** Пояснения к строкам кода: line — номер (с 1) или диапазон [от, до]. */
  notes: { line: number | [number, number]; text: Inline }[];
}

export interface StepsBlock {
  type: "steps";
  title?: string;
  items: { title: string; text: Inline }[];
}

/** Текстовая схема в моноширинном шрифте (деревья, потоки, граф коммитов). */
export interface DiagramBlock {
  type: "diagram";
  text: string;
  caption?: string;
}

export type Block =
  | ParagraphBlock
  | SubheadingBlock
  | ListBlock
  | CodeBlock
  | CalloutBlock
  | TableBlock
  | DefinitionBlock
  | CompareBlock
  | AnnotatedBlock
  | StepsBlock
  | DiagramBlock;

/* ───────────────────────────── Секции документа ───────────────────────────── */

/**
 * Секции Topic Document. Нумерация фиксирована (01…20) для всех тем:
 * это превращает документ в справочник — «Типичные ошибки» всегда в одном и том же месте.
 * Секции 16–20 (практика, задача, собеседование, экзамен, проверка) строятся из отдельных полей Topic.
 */
export type SectionKind =
  | "definition" //        01 Определение
  | "why" //               02 Зачем это нужно
  | "mental-model" //      03 Ментальная модель
  | "technical" //         04 Техническое объяснение
  | "syntax" //            05 Синтаксис / структура
  | "minimal-example" //   06 Минимальный пример
  | "detailed-example" //  07 Подробный пример
  | "analysis" //          08 Разбор по строкам
  | "internals" //         09 Что происходит внутри
  | "mistakes" //          10 Типичные ошибки
  | "antipatterns" //      11 Антипаттерны
  | "best-practices" //    12 Лучшие практики
  | "edge-cases" //        13 Крайние случаи
  | "related" //           14 Связанные понятия
  | "before-after"; //     15 До / после

export interface Section {
  kind: SectionKind;
  /** Необязательный заголовок-уточнение справа от стандартного названия секции. */
  heading?: string;
  blocks: Block[];
}

/* ───────────────────────────── Практика ───────────────────────────── */

export type PracticeKind =
  | "recall"
  | "understanding"
  | "application"
  | "debugging"
  | "engineering"
  | "interview"
  | "exam";

export interface Exercise {
  id: string;
  title: string;
  difficulty: Difficulty;
  kind: Exclude<PracticeKind, "interview" | "exam">;
  prompt: Block[];
  /** Заготовка кода для старта. */
  starter?: { lang: CodeLang; code: string };
  hints: string[];
  /** Критерии самопроверки: что должно быть истинным, чтобы задача считалась решённой. */
  checks: string[];
  /** Решение раскрывается отдельно, после попытки. */
  solution: Block[];
}

export interface Challenge {
  id: string;
  title: string;
  scenario: Block[];
  requirements: string[];
  constraints: string[];
  acceptance: string[];
  hints: string[];
  solution: Block[];
}

export type QuizFormat = "concept" | "code-analysis" | "output" | "debug" | "architecture" | "sql";

export interface McqQuestion {
  id: string;
  type: "mcq";
  format: QuizFormat;
  difficulty: Difficulty;
  prompt: Inline;
  code?: { lang: CodeLang; code: string };
  options: Inline[];
  /** Индексы верных вариантов. Если их больше одного — вопрос с множественным выбором. */
  correct: number[];
  explanation: Inline;
}

export interface OpenQuestion {
  id: string;
  type: "open";
  format: QuizFormat;
  difficulty: Difficulty;
  prompt: Inline;
  code?: { lang: CodeLang; code: string };
  /** Эталонный ответ — раскрывается после попытки ответить самостоятельно. */
  modelAnswer: Block[];
  /** Критерии самооценки. */
  rubric: string[];
}

export type QuizQuestion = McqQuestion | OpenQuestion;

export type InterviewLevel = "basic" | "intermediate" | "advanced" | "engineering" | "debugging";

export interface InterviewQuestion {
  id: string;
  level: InterviewLevel;
  question: Inline;
  answer: Block[];
  followUps?: string[];
}

export interface Flashcard {
  id: string;
  front: Inline;
  back: Inline;
}

/* ───────────────────────────── Тема ───────────────────────────── */

export interface KeyConcept {
  term: string;
  en?: string;
  text: Inline;
}

export interface Source {
  title: string;
  url: string;
  publisher: "WHATWG" | "W3C" | "MDN" | "ECMA" | "PostgreSQL" | "Git" | "IETF" | "Other";
}

export interface Topic {
  /** Глобально уникальный идентификатор: «<domain>.<slug>». */
  id: string;
  slug: string;
  domain: DomainId;
  /** id модуля внутри домена. */
  module: string;
  title: string;
  titleEn?: string;
  summary: string;
  /** Оценка времени чтения и разбора, минут. */
  minutes: number;
  /** id тем-пререквизитов (глобальные). */
  prerequisites: string[];
  tags: string[];
  keyConcepts: KeyConcept[];
  sections: Section[];
  exercises: Exercise[];
  challenge?: Challenge;
  interview: InterviewQuestion[];
  exam: QuizQuestion[];
  mastery: QuizQuestion[];
  flashcards?: Flashcard[];
  sources?: Source[];
}

/* ───────────────────────────── Модули, домены ───────────────────────────── */

/** Определение модуля в файле домена. Список тем заполняет реестр по порядку в topics/index.ts. */
export interface ModuleDef {
  id: string;
  index: number;
  title: string;
  titleEn?: string;
  summary: string;
  level: Level;
  /** id проекта, завершающего модуль (если есть). */
  project?: string;
}

export interface Module extends ModuleDef {
  /** Упорядоченные id тем (вычисляется реестром). */
  topics: string[];
}

export interface DomainDef {
  id: DomainId;
  /** Порядковый код: «01»…«06». */
  code: string;
  slug: string;
  title: string;
  /** Подзаголовок: «Semantic Document Engineering». */
  subtitle: string;
  tagline: string;
  overview: string[];
  why: string[];
  outcomes: string[];
  prerequisites: string[];
  estimatedHours: number;
  accent: Accent;
  modules: ModuleDef[];
}

export interface Domain extends Omit<DomainDef, "modules"> {
  modules: Module[];
}

/* ───────────────────────────── Проекты ───────────────────────────── */

export interface RubricCriterion {
  criterion: string;
  weight: number;
  description: string;
}

export interface Project {
  id: string;
  domain: DomainId;
  order: number;
  title: string;
  subtitle: string;
  level: Level;
  estimatedHours: number;
  isFinal?: boolean;
  /** Проекты, на результатах которых строится этот. */
  buildsOn: string[];
  /** Темы, знания которых нужны. */
  topics: string[];
  objective: string;
  scenario: Block[];
  requirements: string[];
  constraints: string[];
  expected: string[];
  technical: string[];
  acceptance: string[];
  hints: string[];
  advanced: string[];
  failureModes: string[];
  rubric: RubricCriterion[];
  /** Решение раскрывается отдельно. */
  solution?: Block[];
}

/* ───────────────────────────── Пользовательские данные ───────────────────────────── */

export interface Progress {
  completedTopics: Record<string, number>; // topicId → timestamp
  completedProjects: Record<string, number>;
  xp: number;
  streak: { current: number; lastDay: string | null };
}

export interface Bookmark {
  id: string; // стабильный ключ: kind:ref
  kind: "topic" | "project" | "interview" | "exercise";
  ref: string;
  title: string;
  href: string;
  createdAt: number;
}

export interface Note {
  id: string;
  topicId: string | null;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export interface Snippet {
  id: string;
  title: string;
  lang: CodeLang;
  code: string;
  createdAt: number;
}

export interface PracticeAttempt {
  id: string;
  ref: string; // id вопроса или упражнения
  topicId: string | null;
  domain: DomainId;
  correct: boolean | null; // null — самооценка не применима
  at: number;
}
