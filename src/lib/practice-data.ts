import "server-only";
/**
 * Выборка учебных материалов для режимов практики, экзамена и собеседования.
 * Выбор детерминирован по seed — ссылка на вариант экзамена воспроизводима.
 */
import { getDomainTopics } from "@/content/registry";
import type { DomainId, Difficulty, InterviewLevel, InterviewQuestion, QuizFormat, QuizQuestion, Topic } from "@/content/types";

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(list: readonly T[], seed: number): T[] {
  const rnd = mulberry32(seed);
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export interface PoolQuestion {
  question: QuizQuestion;
  topic: Topic;
}

const DIFF_ORDER: Record<Difficulty, number> = { foundation: 0, intermediate: 1, advanced: 2 };

export interface ExamFilters {
  level: Difficulty | "all";
  module: string | "all";
  format: QuizFormat | "all";
  count: number;
  seed: number;
}

export function questionPool(domain: DomainId, f: Pick<ExamFilters, "level" | "module" | "format">): PoolQuestion[] {
  return getDomainTopics(domain)
    .filter((t) => f.module === "all" || t.module === f.module)
    .flatMap((t) => [...t.exam, ...t.mastery].map((question) => ({ question, topic: t })))
    .filter((x) => f.level === "all" || x.question.difficulty === f.level)
    .filter((x) => f.format === "all" || x.question.format === f.format);
}

/**
 * Составляет вариант экзамена. Для режима «all» сохраняется пропорция Foundation → Intermediate → Advanced
 * (≈ 35 / 40 / 25 %), чтобы вариант охватывал весь диапазон сложности; внутри — по возрастанию сложности.
 */
export function composeExam(domain: DomainId, f: ExamFilters): PoolQuestion[] {
  const pool = questionPool(domain, f);
  if (f.level !== "all") {
    return seededShuffle(pool, f.seed)
      .slice(0, f.count)
      .sort((a, b) => DIFF_ORDER[a.question.difficulty] - DIFF_ORDER[b.question.difficulty]);
  }
  const buckets: Record<Difficulty, PoolQuestion[]> = { foundation: [], intermediate: [], advanced: [] };
  for (const x of seededShuffle(pool, f.seed)) buckets[x.question.difficulty].push(x);
  const want = {
    foundation: Math.round(f.count * 0.35),
    intermediate: Math.round(f.count * 0.4),
    advanced: 0,
  };
  want.advanced = Math.max(0, f.count - want.foundation - want.intermediate);
  const picked: PoolQuestion[] = [];
  const order: Difficulty[] = ["foundation", "intermediate", "advanced"];
  for (const d of order) picked.push(...buckets[d].splice(0, want[d]));
  // добираем недостающее из оставшихся (если в какой-то корзине вопросов мало)
  if (picked.length < f.count) {
    const rest = order.flatMap((d) => buckets[d]);
    picked.push(...rest.slice(0, f.count - picked.length));
  }
  return picked.sort((a, b) => DIFF_ORDER[a.question.difficulty] - DIFF_ORDER[b.question.difficulty]);
}

export interface InterviewItem {
  q: InterviewQuestion;
  topic: Topic;
}

export function interviewPool(domain: DomainId, level: InterviewLevel | "all", module: string | "all"): InterviewItem[] {
  return getDomainTopics(domain)
    .filter((t) => module === "all" || t.module === module)
    .flatMap((t) => t.interview.map((q) => ({ q, topic: t })))
    .filter((x) => level === "all" || x.q.level === level);
}

export function clampInt(v: string | string[] | undefined, min: number, max: number, fallback: number): number {
  const n = Number.parseInt(Array.isArray(v) ? (v[0] ?? "") : (v ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function oneOf<T extends string>(v: string | string[] | undefined, allowed: readonly T[], fallback: T): T {
  const s = Array.isArray(v) ? v[0] : v;
  return (allowed as readonly string[]).includes(s ?? "") ? (s as T) : fallback;
}
