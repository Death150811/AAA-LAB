import type { Metadata } from "next";
import { MeDashboard, type DomainSummary } from "@/components/me/MeDashboard";
import { allTopics, domains, getProjects, topicHref } from "@/content/registry";

export const metadata: Metadata = {
  title: "Моё: прогресс, закладки, заметки",
  description: "Личная система знаний: прогресс по курсам, закладки, заметки, сниппеты и история практики.",
};

export default function MePage() {
  const summaries: DomainSummary[] = domains.map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    accent: d.accent,
    topics: allTopics.filter((t) => t.domain === d.id).map((t) => ({ id: t.id, title: t.title, href: topicHref(t) })),
    projects: getProjects(d.id).length,
  }));
  const topicIndex = Object.fromEntries(allTopics.map((t) => [t.id, { title: t.title, href: topicHref(t) }]));

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-12 sm:px-6">
      <div className="eyebrow">Личное</div>
      <h1 className="mt-4 font-display text-[clamp(2.3rem,5vw,3.6rem)] font-light leading-[1.04] tracking-[-0.03em]">Моя система знаний</h1>
      <p className="mt-5 max-w-2xl font-serif text-[1.12rem] leading-[1.65] text-fg-muted">Прогресс, закладки, заметки и история практики. Хранятся локально, без регистрации.</p>
      <div className="mt-10">
        <MeDashboard domains={summaries} topicIndex={topicIndex} />
      </div>
    </div>
  );
}
