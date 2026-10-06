import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContinueButton, DomainCurriculum, DomainProgress, LearningPath } from "@/components/nav/DomainCurriculum";
import { DomainSubnav } from "@/components/layout/DomainSubnav";
import { ACCENT, Badge, EmptyState } from "@/components/ui/primitives";
import { buildNav } from "@/content/nav";
import { domains, getDomain, getProjects } from "@/content/registry";
import { Inline } from "@/lib/inline";
import { plural } from "@/lib/plural";

export function generateStaticParams() {
  return domains.map((d) => ({ domain: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const d = getDomain(domain);
  if (!d) return {};
  return { title: `${d.title} — ${d.tagline}`, description: d.overview[0]?.replace(/[*`]/g, "") };
}

export default async function DomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain: slug } = await params;
  const domain = getDomain(slug);
  if (!domain) notFound();

  const nav = buildNav(domain);
  const topicCount = domain.modules.reduce((n, m) => n + m.topics.length, 0);
  const projects = getProjects(domain.id);
  const published = topicCount > 0;
  const a = ACCENT[domain.accent];

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
      <header className="relative pt-12 pb-8 sm:pt-16">
        <div aria-hidden className="bg-blueprint pointer-events-none absolute inset-x-[-1rem] top-0 h-72 opacity-70 sm:inset-x-[-2rem]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className={`mono text-sm tabular ${a.text}`}>DOMAIN {domain.code}</span>
            <span aria-hidden className="h-px w-10 bg-line-strong" />
            <span className="mono text-xs text-fg-dim">{domain.subtitle}</span>
          </div>
          <h1 className="mt-4 text-[2.6rem] font-semibold leading-none tracking-tight text-fg sm:text-[3.75rem]">
            {domain.title}
          </h1>
          <p className="mt-3 text-xl text-fg-muted sm:text-2xl">{domain.tagline}</p>

          <div className="mt-8 grid gap-x-12 gap-y-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="doc space-y-4 !text-[1.05rem]">
              {domain.overview.map((t, i) => (
                <p key={i}>
                  <Inline text={t} />
                </p>
              ))}
            </div>
            <dl className="m-0 grid grid-cols-2 gap-px self-start overflow-hidden rounded-xl border border-line bg-line">
              {[
                ["Модулей", String(domain.modules.length)],
                ["Тем опубликовано", String(topicCount)],
                ["Проектов", String(projects.length)],
                ["Часов (оценка)", `~${domain.estimatedHours}`],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface px-5 py-4">
                  <dd className="m-0 text-2xl font-semibold tabular text-fg">{v}</dd>
                  <dt className="mt-0.5 text-xs text-fg-dim">{k}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {published ? (
              <ContinueButton nav={nav} />
            ) : (
              <Badge tone="amber" className="!px-3 !py-2 !text-[11px]">
                Курс готовится — программа опубликована, темы пишутся
              </Badge>
            )}
          </div>
        </div>
      </header>

      <DomainSubnav slug={domain.slug} active="learn" />

      <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-14">
          <section aria-labelledby="path">
            <h2 id="path" className="eyebrow mb-4">Путь обучения</h2>
            <LearningPath nav={nav} accent={domain.accent} />
          </section>

          <section aria-labelledby="curriculum">
            <h2 id="curriculum" className="eyebrow mb-4">Программа</h2>
            {!published && (
              <div className="mb-4">
                <EmptyState title="Темы этого курса ещё пишутся">
                  Структура ниже — утверждённая программа. Каждый модуль появится целиком, с практикой и проверкой, а не
                  в виде набора коротких заметок.
                </EmptyState>
              </div>
            )}
            <DomainCurriculum nav={nav} />
          </section>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          {published && (
            <div className="rounded-xl border border-line bg-surface p-5">
              <DomainProgress nav={nav} accent={domain.accent} />
            </div>
          )}
          <section aria-labelledby="outcomes">
            <h2 id="outcomes" className="eyebrow mb-3">После курса вы сможете</h2>
            <ul className="m-0 list-none space-y-2.5 p-0">
              {domain.outcomes.map((o) => (
                <li key={o} className="flex gap-2.5 text-[0.93rem] leading-snug text-fg-muted">
                  <span aria-hidden className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-[1px] ${a.solid}`} />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="why">
            <h2 id="why" className="eyebrow mb-3">Зачем это нужно</h2>
            <div className="space-y-3 text-[0.93rem] leading-relaxed text-fg-muted">
              {domain.why.map((w, i) => (
                <p key={i}>
                  <Inline text={w} />
                </p>
              ))}
            </div>
          </section>
          <section aria-labelledby="prereq">
            <h2 id="prereq" className="eyebrow mb-3">Предварительные требования</h2>
            <ul className="m-0 list-none space-y-2 p-0 text-[0.93rem] text-fg-muted">
              {domain.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-fg-dim">
              Оценка: {domain.estimatedHours} {plural(domain.estimatedHours, "час", "часа", "часов")} вместе с практикой.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
