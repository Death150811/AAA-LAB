import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteOfDay, type NoteTopic } from "@/components/home/NoteOfDay";
import { DomainSubnav } from "@/components/layout/DomainSubnav";
import { DomainMotif, MOTIF_LABEL } from "@/components/motifs/DomainMotif";
import { ContinueButton, DomainCurriculum, DomainProgress, LearningPath } from "@/components/nav/DomainCurriculum";
import { Plate } from "@/components/ui/Plate";
import { EmptyState } from "@/components/ui/primitives";
import { LORE } from "@/content/lore";
import { buildNav } from "@/content/nav";
import { allTopics, domains, getDomain, getProjects } from "@/content/registry";
import { Inline } from "@/lib/inline";
import { roman } from "@/lib/numerals";
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
  const numeral = roman(domains.findIndex((d) => d.id === domain.id) + 1);

  // «Заметка дня» этого домена: его фразы и общие; клиентскому блоку нужны заголовки и адреса связанных тем.
  const pool = LORE.filter((l) => l.domain === domain.id || l.domain === "all");
  const noteTopics: Record<string, NoteTopic> = {};
  for (const l of pool) {
    const t = l.topic ? allTopics.find((x) => x.id === l.topic) : undefined;
    if (t && l.topic) noteTopics[l.topic] = { id: t.id, title: t.title, href: `/learn/${t.domain}/${t.slug}` };
  }

  const longTitle = domain.title.length > 12;

  return (
    <>
      {/* ───────────── Титул домена ───────────── */}
      <header className="relative overflow-hidden border-b border-line-strong">
        <div aria-hidden className="bg-blueprint pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative mx-auto grid max-w-[1360px] items-center gap-x-12 gap-y-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:py-16">
          <div>
            <div className="animate-fade-up flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="label text-accent-text">Таблица {numeral}</span>
              <span aria-hidden className="h-px w-8 bg-line-strong" />
              <span className="label text-fg-dim">Domain {domain.code}</span>
            </div>
            <h1
              className={`animate-fade-up mt-5 font-display font-light leading-[0.95] tracking-[-0.035em] text-fg ${
                longTitle ? "text-[clamp(2.6rem,6vw,5.2rem)]" : "text-[clamp(3.6rem,9vw,7.4rem)]"
              }`}
              style={{ animationDelay: "60ms" }}
            >
              {domain.title}
              <span className="text-accent-text">.</span>
            </h1>
            <p className="animate-fade-up mt-5 font-display text-[clamp(1.25rem,2.2vw,1.7rem)] font-light italic leading-snug text-fg-muted" style={{ animationDelay: "120ms" }}>
              {domain.tagline}
            </p>
            <div className="animate-fade-up mt-7 max-w-[36rem] space-y-3 font-serif text-[1.06rem] leading-[1.65] text-fg-muted" style={{ animationDelay: "180ms" }}>
              {domain.overview.map((t, i) => (
                <p key={i}>
                  <Inline text={t} />
                </p>
              ))}
            </div>
            <div className="animate-fade-up mt-9 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ animationDelay: "240ms" }}>
              {published ? (
                <ContinueButton nav={nav} />
              ) : (
                <span className="label border border-amber/40 px-3 py-2.5 text-amber">Курс готовится — программа опубликована, темы пишутся</span>
              )}
              <Link href={`/projects/${domain.slug}`} className="group inline-flex items-center gap-2 text-[0.95rem] text-fg-muted transition-colors hover:text-fg">
                <span className="underline decoration-line-strong decoration-1 underline-offset-[6px] transition-colors group-hover:decoration-accent">Проекты курса</span>
              </Link>
            </div>
          </div>

          <Plate number={numeral} title={domain.subtitle} caption={MOTIF_LABEL[domain.id]} className="animate-fade-up !p-5 sm:!p-7">
            <DomainMotif domain={domain.id} />
          </Plate>
        </div>
      </header>

      {/* ───────────── Ведомость ───────────── */}
      <section aria-label="Курс в цифрах" className="border-b border-line-strong">
        <div className="mx-auto grid max-w-[1360px] grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1.4fr]">
          {[
            ["Модулей", String(domain.modules.length)],
            ["Тем", String(topicCount)],
            ["Проектов", String(projects.length)],
            ["Часов, оценка", `~${domain.estimatedHours}`],
          ].map(([k, v], i) => (
            <dl key={k} className={`m-0 flex flex-col justify-between gap-4 border-line-strong px-5 py-5 sm:px-6 lg:border-l ${i === 0 ? "lg:!border-l-0 lg:!pl-0" : ""} ${i > 1 ? "border-t lg:border-t-0" : ""} ${i % 2 === 1 ? "border-l" : ""}`}>
              <dt className="label text-fg-dim">{k}</dt>
              <dd className="m-0 font-display text-[2.6rem] font-light leading-none text-fg tabular">{v}</dd>
            </dl>
          ))}
          {published && (
            <DomainProgress nav={nav} accent={domain.accent} className="col-span-2 border-t border-line-strong px-5 py-5 sm:px-6 lg:col-span-1 lg:border-l lg:border-t-0" />
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
        <div className="pt-2">
          <DomainSubnav slug={domain.slug} active="learn" />
        </div>
      </div>

      <NoteOfDay pool={pool} topics={noteTopics} variant="compact" className="mt-0 border-t-0" />

      <div className="mx-auto grid max-w-[1360px] gap-x-14 gap-y-14 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-16">
          <section aria-labelledby="path">
            <h2 id="path" className="eyebrow mb-5">Путь обучения</h2>
            <LearningPath nav={nav} accent={domain.accent} />
          </section>

          <section aria-labelledby="curriculum">
            <h2 id="curriculum" className="mb-6 font-display text-[clamp(1.7rem,3vw,2.3rem)] font-light leading-tight tracking-[-0.02em] text-fg">
              Программа <em className="italic text-fg-muted">курса</em>
            </h2>
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

        <aside className="space-y-10 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <section aria-labelledby="outcomes">
            <h2 id="outcomes" className="eyebrow mb-4">После курса вы сможете</h2>
            <ul className="m-0 list-none space-y-3 p-0">
              {domain.outcomes.map((o) => (
                <li key={o} className="flex gap-3 font-serif text-[0.97rem] leading-snug text-fg-muted">
                  <span aria-hidden className="mt-[8px] h-1.5 w-1.5 shrink-0 bg-accent" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="why" className="border-t border-line-strong pt-8">
            <h2 id="why" className="eyebrow mb-4">Зачем это нужно</h2>
            <div className="space-y-3 font-serif text-[0.97rem] leading-relaxed text-fg-muted">
              {domain.why.map((w, i) => (
                <p key={i}>
                  <Inline text={w} />
                </p>
              ))}
            </div>
          </section>
          <section aria-labelledby="prereq" className="border-t border-line-strong pt-8">
            <h2 id="prereq" className="eyebrow mb-4">Предварительные требования</h2>
            <ul className="m-0 list-none space-y-2 p-0 font-serif text-[0.97rem] text-fg-muted">
              {domain.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-fg-dim">
              Оценка: {domain.estimatedHours} {plural(domain.estimatedHours, "час", "часа", "часов")} вместе с практикой.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
