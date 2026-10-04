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
    <div className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6">
      <div className="eyebrow">Личное</div>
      <h1 className="mt-3 text-[2.2rem] font-semibold tracking-tight">Моя система знаний</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">Прогресс, закладки, заметки и история практики. Хранятся локально, без регистрации.</p>
      <div className="mt-10">
        <MeDashboard domains={summaries} topicIndex={topicIndex} />
      </div>
    </div>
  );
}
