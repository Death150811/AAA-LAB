import type { Metadata } from "next";
import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainHeader } from "@/components/layout/DomainHeader";
import { ProjectStatus } from "@/components/practice/ProjectStatus";
import { EmptyState } from "@/components/ui/primitives";
import { domains, getDomain, getProjects, projectHref } from "@/content/registry";
import { LEVEL_LABEL } from "@/content/sections";
import { Inline } from "@/lib/inline";

export function generateStaticParams() {
  return domains.map((d) => ({ domain: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const d = getDomain(domain);
  return { title: d ? `Проекты: ${d.title}` : "Проекты" };
}

export default async function ProjectsPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain: slug } = await params;
  const domain = getDomain(slug);
  if (!domain) notFound();
  const projects = getProjects(domain.id);

  return (
    <div className="mx-auto max-w-[1360px] px-4 pb-10 sm:px-6">
      <DomainHeader
        domain={domain}
        tab="projects"
        title={`Проекты: ${domain.title}`}
        lead="Проекты кумулятивны: каждый следующий опирается на результат предыдущего и на новые темы курса. У каждого — сценарий, требования, ограничения, критерии приёмки и рубрика. Решение раскрывается отдельно, после собственной попытки."
      />

      {projects.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="Проекты этого курса готовятся">
            Проекты пишутся после основных тем курса: так, чтобы каждый требовал рассуждения, а не копирования примеров.
          </EmptyState>
        </div>
      ) : (
        <ol className="m-0 mt-12 list-none border-b border-line-strong p-0">
          {projects.map((p) => (
            <li key={p.id} className="border-t border-line-strong">
              <Link
                href={projectHref(p)}
                className="group relative -mx-4 grid gap-x-8 gap-y-4 px-4 py-8 transition-colors hover:bg-surface/50 sm:-mx-5 sm:px-5 md:grid-cols-[5.5rem_minmax(0,1fr)_auto]"
              >
                <span aria-hidden className="absolute left-0 top-0 h-full w-[2px] origin-top scale-y-0 bg-accent transition-transform duration-300 group-hover:scale-y-100" />
                <span aria-hidden className="font-display text-[3.4rem] font-light leading-[0.85] text-accent-text/70 tabular md:text-[4.2rem]">
                  {String(p.order).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="label border border-line-strong px-2 py-1 text-fg-muted">{LEVEL_LABEL[p.level]}</span>
                    {p.isFinal && <span className="label border border-amber/40 px-2 py-1 text-amber">Финальный</span>}
                    <span className="label flex items-center gap-1.5 text-fg-dim">
                      <Clock size={11} aria-hidden /> ~{p.estimatedHours} ч
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-[1.75rem] font-normal leading-tight tracking-[-0.015em] text-fg">{p.title}</h2>
                  <p className="mt-1 font-display text-[1.05rem] italic text-fg-dim">{p.subtitle}</p>
                  <p className="mt-4 max-w-2xl font-serif text-[1rem] leading-relaxed text-fg-muted">
                    <Inline text={p.objective} />
                  </p>
                </div>
                <div className="flex items-end justify-between gap-4 md:flex-col md:items-end">
                  <ProjectStatus projectId={p.id} />
                  <span className="inline-flex items-center gap-1.5 text-[0.9rem] text-accent-text">
                    Открыть задание <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
