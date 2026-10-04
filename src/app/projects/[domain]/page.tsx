import type { Metadata } from "next";
import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainHeader } from "@/components/layout/DomainHeader";
import { ProjectStatus } from "@/components/practice/ProjectStatus";
import { Badge, EmptyState } from "@/components/ui/primitives";
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
    <div className="mx-auto max-w-[1000px] px-4 pb-10 sm:px-6">
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
        <ol className="relative m-0 mt-10 list-none space-y-5 p-0">
          <span aria-hidden className="absolute bottom-6 left-[19px] top-6 hidden w-px bg-line-strong sm:block" />
          {projects.map((p) => (
            <li key={p.id} className="relative sm:pl-14">
              <span className="absolute left-0 top-5 hidden h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface font-mono text-sm tabular text-cyan sm:grid">
                {String(p.order).padStart(2, "0")}
              </span>
              <Link
                href={projectHref(p)}
                className="group block rounded-xl border border-line bg-surface p-5 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-line-strong sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="cyan">{LEVEL_LABEL[p.level]}</Badge>
                  {p.isFinal && <Badge tone="amber">Финальный</Badge>}
                  <span className="flex items-center gap-1.5 text-xs text-fg-dim"><Clock size={12} aria-hidden /> ~{p.estimatedHours} ч</span>
                  <span className="ml-auto"><ProjectStatus projectId={p.id} /></span>
                </div>
                <h2 className="mt-3 text-[1.35rem] font-semibold tracking-tight text-fg">{p.title}</h2>
                <p className="mono mt-1 text-[11px] text-fg-dim">{p.subtitle}</p>
                <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-fg-muted"><Inline text={p.objective} /></p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-cyan">
                  Открыть задание <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
