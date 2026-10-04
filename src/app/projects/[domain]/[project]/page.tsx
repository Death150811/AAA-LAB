import type { Metadata } from "next";
import { Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Blocks } from "@/components/content/Blocks";
import { DomainHeader } from "@/components/layout/DomainHeader";
import { AcceptanceChecklist, CompleteProjectButton, HintsReveal, RubricSelfEval, SolutionReveal } from "@/components/practice/ProjectTools";
import { Badge } from "@/components/ui/primitives";
import { allProjects, getDomain, getProject, getTopicById, projectHref, topicHref } from "@/content/registry";
import { LEVEL_LABEL } from "@/content/sections";
import { Inline } from "@/lib/inline";

export function generateStaticParams() {
  return allProjects.map((p) => ({ domain: p.domain, project: p.id.split(".")[1]! }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string; project: string }> }): Promise<Metadata> {
  const { domain, project } = await params;
  const p = getProject(`${domain}.${project}`);
  return { title: p ? `Проект: ${p.title}` : "Проект" };
}

function Section({ id, num, title, children }: { id: string; num: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24">
      <h2 id={`${id}-h`} className="flex items-baseline gap-3 border-b border-line pb-3 text-xl font-semibold tracking-tight text-fg">
        <span className="mono text-sm font-medium text-cyan tabular">{num}</span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="m-0 list-none space-y-2 p-0">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 text-[0.97rem] leading-relaxed text-[#cbd3df]">
          <span aria-hidden className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-[1px] bg-steel" />
          <span>
            <Inline text={t} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function ProjectPage({ params }: { params: Promise<{ domain: string; project: string }> }) {
  const { domain: dSlug, project: pSlug } = await params;
  const domain = getDomain(dSlug);
  const project = getProject(`${dSlug}.${pSlug}`);
  if (!domain || !project) notFound();

  const builds = project.buildsOn.flatMap((id) => {
    const b = getProject(id);
    return b ? [b] : [];
  });
  const topics = project.topics.flatMap((id) => {
    const t = getTopicById(id);
    return t ? [t] : [];
  });

  return (
    <div className="mx-auto max-w-[900px] px-4 pb-10 sm:px-6">
      <DomainHeader
        domain={domain}
        tab="projects"
        title={`${String(project.order).padStart(2, "0")} · ${project.title}`}
        lead={project.subtitle}
      />

      <div className="mt-6 flex flex-wrap items-center gap-2.5 text-xs text-fg-dim">
        <Badge tone="cyan">{LEVEL_LABEL[project.level]}</Badge>
        {project.isFinal && <Badge tone="amber">Финальный проект</Badge>}
        <span className="flex items-center gap-1.5"><Clock size={12} aria-hidden /> ~{project.estimatedHours} ч</span>
        {builds.length > 0 && (
          <span>
            Опирается на:{" "}
            {builds.map((b, i) => (
              <span key={b.id}>
                {i > 0 && ", "}
                <Link href={projectHref(b)} className="text-cyan hover:underline">{b.title}</Link>
              </span>
            ))}
          </span>
        )}
      </div>

      <div className="mt-10 space-y-14">
        <Section id="objective" num="01" title="Цель">
          <p className="text-[1.05rem] leading-relaxed text-[#d4dbe6]"><Inline text={project.objective} /></p>
          {topics.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-fg-dim">Нужны знания:</span>
              {topics.map((t) => (
                <Link key={t.id} href={topicHref(t)} className="rounded-md border border-line px-2 py-0.5 text-[13px] text-fg-muted hover:border-line-strong hover:text-fg">
                  {t.title}
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section id="scenario" num="02" title="Сценарий">
          <div className="doc space-y-3"><Blocks blocks={project.scenario} /></div>
        </Section>

        <Section id="requirements" num="03" title="Требования">
          <Bullets items={project.requirements} />
        </Section>

        <Section id="constraints" num="04" title="Ограничения">
          <Bullets items={project.constraints} />
        </Section>

        <Section id="expected" num="05" title="Ожидаемое поведение и функциональность">
          <Bullets items={project.expected} />
        </Section>

        <Section id="technical" num="06" title="Технические требования">
          <Bullets items={project.technical} />
        </Section>

        <Section id="acceptance" num="07" title="Критерии приёмки">
          <AcceptanceChecklist projectId={project.id} items={project.acceptance} />
        </Section>

        <Section id="hints" num="08" title="Подсказки">
          <HintsReveal hints={project.hints} />
        </Section>

        <Section id="advanced" num="09" title="Дополнительные требования (по желанию)">
          <Bullets items={project.advanced} />
        </Section>

        <Section id="failures" num="10" title="Типичные провалы">
          <Bullets items={project.failureModes} />
        </Section>

        <Section id="rubric" num="11" title="Рубрика оценки">
          <RubricSelfEval rubric={project.rubric} />
        </Section>

        {project.solution && (
          <Section id="solution" num="12" title="Разбор решения">
            <SolutionReveal>
              <Blocks blocks={project.solution} />
            </SolutionReveal>
          </Section>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-8">
          <CompleteProjectButton projectId={project.id} />
          <Link href={`/projects/${domain.slug}`} className="text-sm text-fg-muted hover:text-fg">← Все проекты</Link>
        </div>
      </div>
    </div>
  );
}
