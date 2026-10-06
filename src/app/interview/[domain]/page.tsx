import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Blocks } from "@/components/content/Blocks";
import { DomainHeader } from "@/components/layout/DomainHeader";
import { ReshuffleLink, SeedForm } from "@/components/practice/Reshuffle";
import { Badge, ButtonLink, EmptyState } from "@/components/ui/primitives";
import { domains, getDomain, topicHref } from "@/content/registry";
import { INTERVIEW_LEVEL_LABEL } from "@/content/sections";
import type { InterviewLevel } from "@/content/types";
import { Inline } from "@/lib/inline";
import { clampInt, interviewPool, oneOf, seededShuffle } from "@/lib/practice-data";

export function generateStaticParams() {
  return domains.map((d) => ({ domain: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const d = getDomain(domain);
  return { title: d ? `Собеседование: ${d.title}` : "Собеседование" };
}

const LEVELS = ["all", "basic", "intermediate", "advanced", "engineering", "debugging"] as const;
type SP = Record<string, string | string[] | undefined>;

const TONE: Record<InterviewLevel, "emerald" | "accent" | "indigo" | "amber" | "rose"> = {
  basic: "emerald",
  intermediate: "accent",
  advanced: "indigo",
  engineering: "amber",
  debugging: "rose",
};

export default async function InterviewPage({ params, searchParams }: { params: Promise<{ domain: string }>; searchParams: Promise<SP> }) {
  const { domain: slug } = await params;
  const sp = await searchParams;
  const domain = getDomain(slug);
  if (!domain) notFound();

  const level = oneOf(sp.level, LEVELS, "all");
  const moduleIds = domain.modules.filter((m) => m.topics.length > 0).map((m) => m.id);
  const moduleId = oneOf(sp.module, ["all", ...moduleIds] as const, "all");
  const count = clampInt(sp.count, 5, 50, 10);
  const seed = clampInt(sp.seed, 0, 999_999, 1);

  const all = interviewPool(domain.id, "all", "all");
  const pool = interviewPool(domain.id, level, moduleId);
  const picked = seededShuffle(pool, seed).slice(0, count);

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-10 sm:px-6">
      <DomainHeader
        domain={domain}
        tab="interview"
        title={`Собеседование: ${domain.title}`}
        lead="Отвечайте вслух — так, как отвечали бы интервьюеру: определение, механизм, пример, границы применимости. Только затем раскрывайте эталон и сравнивайте."
      />

      {all.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="Вопросы собеседования появятся вместе с темами курса">
            Вопросы пишутся вместе с каждой темой и охватывают уровни от «что такое X» до отладки и инженерных решений.
          </EmptyState>
        </div>
      ) : (
        <>
          <SeedForm className="mt-8 grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Параметры тренировки">
            <label className="block text-[13px] text-fg-muted">
              <span className="mb-1.5 block">Уровень</span>
              <select name="level" defaultValue={level} className="h-10 w-full rounded-lg border border-line-strong bg-bg-raised px-3 text-sm text-fg focus:border-accent/60 focus:outline-none">
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l === "all" ? "Все уровни" : INTERVIEW_LEVEL_LABEL[l]}</option>
                ))}
              </select>
            </label>
            <label className="block text-[13px] text-fg-muted">
              <span className="mb-1.5 block">Модуль</span>
              <select name="module" defaultValue={moduleId} className="h-10 w-full rounded-lg border border-line-strong bg-bg-raised px-3 text-sm text-fg focus:border-accent/60 focus:outline-none">
                <option value="all">Все модули</option>
                {domain.modules.filter((m) => m.topics.length > 0).map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </label>
            <label className="block text-[13px] text-fg-muted">
              <span className="mb-1.5 block">Вопросов</span>
              <select name="count" defaultValue={String(count)} className="h-10 w-full rounded-lg border border-line-strong bg-bg-raised px-3 text-sm text-fg focus:border-accent/60 focus:outline-none">
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div className="flex items-end">
              <input type="hidden" name="seed" defaultValue="1" />
              <button type="submit" className="h-10 w-full rounded-lg border border-accent bg-accent px-4 text-sm font-semibold text-accent-ink transition-transform active:scale-[0.97]">
                Новая подборка
              </button>
            </div>
          </SeedForm>
          <p className="mt-3 text-xs text-fg-dim">В выбранном пуле — {pool.length} из {all.length} вопросов.</p>

          {picked.length === 0 ? (
            <div className="mt-10">
              <EmptyState title="Под выбранные условия нет вопросов" action={<ButtonLink href={`/interview/${domain.slug}`}>Сбросить фильтры</ButtonLink>} />
            </div>
          ) : (
            <section aria-labelledby="iv-list" className="mt-10">
              <div className="mb-5 flex items-center gap-3">
                <h2 id="iv-list" className="text-xl font-semibold tracking-tight">Подборка №{seed}</h2>
                <Badge tone="accent">{picked.length} вопросов</Badge>
              </div>
              <ol className="m-0 list-none space-y-2.5 p-0">
                {picked.map(({ q, topic }, i) => (
                  <li key={q.id}>
                    <details className="group rounded-xl border border-line bg-surface/60 open:bg-surface">
                      <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3.5 marker:hidden [&::-webkit-details-marker]:hidden">
                        <span className="mono mt-0.5 w-6 shrink-0 text-xs text-fg-dim tabular">{i + 1}</span>
                        <Badge tone={TONE[q.level]} className="mt-0.5 shrink-0">{INTERVIEW_LEVEL_LABEL[q.level]}</Badge>
                        <span className="flex-1 text-[1rem] font-medium leading-relaxed text-fg">
                          <Inline text={q.question} />
                        </span>
                      </summary>
                      <div className="doc space-y-3 border-t border-line px-4 py-4 text-[0.98rem]">
                        <Blocks blocks={q.answer} />
                        {q.followUps && q.followUps.length > 0 && (
                          <div className="!mt-5 rounded-lg border border-line bg-bg-raised/60 px-4 py-3">
                            <div className="eyebrow mb-2">Уточняющие вопросы</div>
                            <ul className="!m-0 !pl-5 text-[0.93rem]">
                              {q.followUps.map((f, k) => <li key={k}><Inline text={f} /></li>)}
                            </ul>
                          </div>
                        )}
                        <p className="!mt-4 text-xs text-fg-dim">
                          Тема: <Link href={topicHref(topic)}>{topic.title}</Link>
                        </p>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
              <div className="mt-6">
                <ReshuffleLink className="text-sm text-accent-text hover:underline">Другая подборка →</ReshuffleLink>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
