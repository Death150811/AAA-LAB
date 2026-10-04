/**
 * Авторский DSL: короткие конструкторы блоков.
 * Контент-файлы используют только их — так структура остаётся единообразной и типобезопасной.
 */
import type {
  AnnotatedBlock,
  Block,
  CalloutBlock,
  CodeBlock,
  CodeLang,
  CompareBlock,
  CompareSide,
  Difficulty,
  Exercise,
  InterviewLevel,
  InterviewQuestion,
  McqQuestion,
  OpenQuestion,
  QuizFormat,
  Section,
  SectionKind,
} from "./types";

export const p = (text: string): Block => ({ type: "p", text });
export const h = (text: string): Block => ({ type: "h", text });
export const ul = (...items: string[]): Block => ({ type: "list", items });
export const ol = (...items: string[]): Block => ({ type: "list", ordered: true, items });

type CodeOpts = Omit<CodeBlock, "type" | "lang" | "code">;
/** Убирает общий отступ и крайние пустые строки — позволяет писать код в шаблонных строках с отступами. */
export const dedent = (s: string): string => {
  const lines = s.replace(/\t/g, "  ").split("\n");
  while (lines.length && lines[0]!.trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1]!.trim() === "") lines.pop();
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join("\n");
};

export const code = (lang: CodeLang, src: string, opts: CodeOpts = {}): CodeBlock => ({
  type: "code",
  lang,
  code: dedent(src),
  ...opts,
});

const callout =
  (tone: CalloutBlock["tone"]) =>
  (text: string, title?: string): Block => ({ type: "callout", tone, text, ...(title ? { title } : {}) });
export const note = callout("note");
export const tip = callout("tip");
export const warn = callout("warning");
export const danger = callout("danger");
export const insight = callout("insight");

export const table = (head: string[], rows: string[][], caption?: string): Block => ({
  type: "table",
  head,
  rows,
  ...(caption ? { caption } : {}),
});

export const def = (term: string, text: string, en?: string): Block => ({
  type: "definition",
  term,
  text,
  ...(en ? { en } : {}),
});

const side = (lang: CodeLang, src: string, note: string, title?: string): CompareSide => ({
  lang,
  code: dedent(src),
  note,
  ...(title ? { title } : {}),
});
export const wrongRight = (
  lang: CodeLang,
  bad: { code: string; note: string; title?: string },
  good: { code: string; note: string; title?: string },
): CompareBlock => ({
  type: "compare",
  variant: "wrong-right",
  bad: side(lang, bad.code, bad.note, bad.title),
  good: side(lang, good.code, good.note, good.title),
});
export const beforeAfter = (
  lang: CodeLang,
  bad: { code: string; note: string; title?: string },
  good: { code: string; note: string; title?: string },
): CompareBlock => ({
  type: "compare",
  variant: "before-after",
  bad: side(lang, bad.code, bad.note, bad.title),
  good: side(lang, good.code, good.note, good.title),
});

export const annotated = (
  lang: CodeLang,
  src: string,
  notes: AnnotatedBlock["notes"],
  filename?: string,
): AnnotatedBlock => ({
  type: "annotated",
  lang,
  code: dedent(src),
  notes,
  ...(filename ? { filename } : {}),
});

export const steps = (items: [title: string, text: string][], title?: string): Block => ({
  type: "steps",
  items: items.map(([t, text]) => ({ title: t, text })),
  ...(title ? { title } : {}),
});

export const diagram = (text: string, caption?: string): Block => ({
  type: "diagram",
  text: dedent(text),
  ...(caption ? { caption } : {}),
});

export const section = (kind: SectionKind, blocks: Block[], heading?: string): Section => ({
  kind,
  blocks,
  ...(heading ? { heading } : {}),
});

/* ───────── Практика и проверка ───────── */

export const mcq = (
  id: string,
  difficulty: Difficulty,
  prompt: string,
  options: string[],
  correct: number | number[],
  explanation: string,
  extra: { format?: QuizFormat; code?: { lang: CodeLang; code: string } } = {},
): McqQuestion => ({
  id,
  type: "mcq",
  format: extra.format ?? (extra.code ? "code-analysis" : "concept"),
  difficulty,
  prompt,
  options,
  correct: Array.isArray(correct) ? correct : [correct],
  explanation,
  ...(extra.code ? { code: { lang: extra.code.lang, code: dedent(extra.code.code) } } : {}),
});

export const open = (
  id: string,
  difficulty: Difficulty,
  prompt: string,
  modelAnswer: Block[],
  rubric: string[],
  extra: { format?: QuizFormat; code?: { lang: CodeLang; code: string } } = {},
): OpenQuestion => ({
  id,
  type: "open",
  format: extra.format ?? "concept",
  difficulty,
  prompt,
  modelAnswer,
  rubric,
  ...(extra.code ? { code: { lang: extra.code.lang, code: dedent(extra.code.code) } } : {}),
});

export const iq = (
  id: string,
  level: InterviewLevel,
  question: string,
  answer: Block[],
  followUps?: string[],
): InterviewQuestion => ({ id, level, question, answer, ...(followUps ? { followUps } : {}) });

export const exercise = (e: Exercise): Exercise => ({
  ...e,
  starter: e.starter ? { lang: e.starter.lang, code: dedent(e.starter.code) } : undefined,
});
