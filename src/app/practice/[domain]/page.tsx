import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainHeader } from "@/components/layout/DomainHeader";
import { SolvedMark } from "@/components/practice/SolvedMark";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { domains, getDomain, getDomainTopics, topicHref } from "@/content/registry";
import { DIFFICULTY_LABEL, PRACTICE_KIND_LABEL } from "@/content/sections";
import type { Exercise, Topic } from "@/content/types";

export function generateStaticParams() {
  return domains.map((d) => ({ domain: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const d = getDomain(domain);
  return { title: d ? `Практика: ${d.title}` : "Практика" };
}

type Kind = keyof typeof PRACTICE_KIND_LABEL;

const CATEGORIES: { kind: Kind; title: string; question: string; description: string }[] = [
  { kind: "recall", title: "Вспомнить", question: "Помню ли я определение?", description: "Термины, различия и правила. Работает карточками и вопросами на концепцию." },
  { kind: "understanding", title: "Понять", question: "Могу ли я объяснить, почему это работает?", description: "Предсказание поведения, разбор механизма, объяснение своими словами." },
  { kind: "application", title: "Применить", question: "Могу ли я использовать это в деле?", description: "Написать разметку, настроить, собрать небольшой артефакт по требованиям." },
  { kind: "debugging", title: "Отладить", question: "Могу ли я найти, что сломано?", description: "Найти ошибку в готовом коде, объяснить причину и исправить." },
  { kind: "engineering", title: "Спроектировать", question: "Могу ли я принять решение и обосновать его?", description: "Инженерные задачи с компромиссами, ограничениями и критериями приёмки." },
];

interface Row {
  id: string;
  title: string;
  topic: Topic;
  difficulty?: Exercise["difficulty"];
  anchor: string;
}

export default async function PracticePage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain: slug } = await params;
  const domain = getDomain(slug);
  if (!domain) notFound();

  const topics = getDomainTopics(domain.id);
  const rows: Record<string, Row[]> = { recall: [], understanding: [], application: [], debugging: [], engineering: [] };

  for (const t of topics) {
    for (const e of t.exercises) {
      rows[e.kind]!.push({ id: e.id, title: e.title, topic: t, difficulty: e.difficulty, anchor: `#${e.id}` });
    }
    if (t.challenge) {
      rows.engineering!.push({ id: t.challenge.id, title: t.challenge.title, topic: t, anchor: "#challenge" });
    }
  }

  const questionCount = topics.reduce((n, t) => n + t.exam.length + t.mastery.length, 0);
  const interviewCount = topics.reduce((n, t) => n + t.interview.length, 0);
  const cardCount = topics.reduce((n, t) => n + (t.flashcards?.length ?? 0), 0);
  const hasContent = topics.length > 0;

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-10 sm:px-6">
      <DomainHeader
        domain={domain}
        tab="practice"
        title={`Практика: ${domain.title}`}
        lead="Запоминание — не мастерство. Практика разделена по тому, что именно вы тренируете: вспомнить, понять, применить, отладить, спроектировать — а затем объяснить на собеседовании и решить на экзамене."
      />

      {!hasContent ? (
        <div className="mt-10">
          <EmptyState title="Практика появится вместе с темами курса">
            Упражнения, инженерные задачи и вопросы пишутся вместе с каждой темой, а не отдельным набором «для галочки».
          </EmptyState>
        </div>
      ) : (
        <>
          <ul className="m-0 mt-8 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            <li>
              <Link href="/flashcards" className="group block h-full rounded-[3px] border border-line bg-surface p-5 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-line-strong">
                <div className="eyebrow">Вспомнить</div>
                <div className="mt-2 text-[1.05rem] font-semibold text-fg">Карточки</div>
                <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">Определения и различия с интервальным повторением. {cardCount} карточек.</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-accent-text">Открыть <ArrowRight size={12} aria-hidden /></span>
              </Link>
            </li>
            {CATEGORIES.filter((c) => c.kind !== "recall").map((c) => (
              <li key={c.kind}>
                <a href={`#${c.kind}`} className="group block h-full rounded-[3px] border border-line bg-surface p-5 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-line-strong">
                  <div className="eyebrow">{c.title}</div>
                  <div className="mt-2 text-[1.05rem] font-semibold text-fg">{c.question}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{c.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-fg-dim">{rows[c.kind]!.length} заданий</span>
                </a>
              </li>
            ))}
            <li>
              <Link href={`/interview/${domain.slug}`} className="group block h-full rounded-[3px] border border-line bg-surface p-5 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-line-strong">
                <div className="eyebrow">Собеседование</div>
                <div className="mt-2 text-[1.05rem] font-semibold text-fg">Смогу ли я объяснить под давлением?</div>
                <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{interviewCount} вопросов: от «что такое X» до отладки и инженерных решений.</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-accent-text">Тренировка <ArrowRight size={12} aria-hidden /></span>
              </Link>
            </li>
            <li>
              <Link href={`/exam/${domain.slug}`} className="group block h-full rounded-[3px] border border-line bg-surface p-5 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-line-strong">
                <div className="eyebrow">Экзамен</div>
                <div className="mt-2 text-[1.05rem] font-semibold text-fg">Решу ли я теоретические вопросы?</div>
                <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{questionCount} вопросов с объяснениями; вариант собирается по нарастающей сложности.</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-accent-text">Составить вариант <ArrowRight size={12} aria-hidden /></span>
              </Link>
            </li>
          </ul>

          {CATEGORIES.filter((c) => c.kind !== "recall").map((c) => (
            <section key={c.kind} id={c.kind} aria-labelledby={`h-${c.kind}`} className="mt-14 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-line pb-3">
                <h2 id={`h-${c.kind}`} className="text-xl font-semibold tracking-tight">{c.title}</h2>
                <span className="text-sm text-fg-dim">{c.question}</span>
              </div>
              {rows[c.kind]!.length === 0 ? (
                <p className="mt-4 text-sm text-fg-muted">В этой категории пока нет заданий.</p>
              ) : (
                <ul className="m-0 mt-2 list-none divide-y divide-line p-0">
                  {rows[c.kind]!.map((r) => (
                    <li key={r.id}>
                      <Link href={`${topicHref(r.topic)}${r.anchor}`} className="flex items-center gap-3 py-3 text-[0.95rem] text-fg-muted transition-colors hover:text-fg">
                        <SolvedMark refId={r.id} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-fg">{r.title}</span>
                          <span className="block truncate text-xs text-fg-dim">{r.topic.title}</span>
                        </span>
                        {r.difficulty && (
                          <Badge tone={r.difficulty === "advanced" ? "rose" : r.difficulty === "intermediate" ? "amber" : "emerald"}>
                            {DIFFICULTY_LABEL[r.difficulty]}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
