import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicDocument, TopicRail } from "@/components/content/TopicDocument";
import { TopicShell } from "@/components/content/TopicShell";
import { CurriculumNav } from "@/components/nav/CurriculumNav";
import { buildNav } from "@/content/nav";
import { allTopics, getDomain, getTopic } from "@/content/registry";

export function generateStaticParams() {
  return allTopics.map((t) => ({ domain: t.domain, topic: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; topic: string }>;
}): Promise<Metadata> {
  const { domain, topic } = await params;
  const t = getTopic(domain, topic);
  if (!t) return {};
  return { title: t.title, description: t.summary.replace(/[*`]/g, "") };
}

export default async function TopicPage({ params }: { params: Promise<{ domain: string; topic: string }> }) {
  const { domain: domainSlug, topic: topicSlug } = await params;
  const domain = getDomain(domainSlug);
  const topic = getTopic(domainSlug, topicSlug);
  if (!domain || !topic) notFound();

  return (
    <TopicShell
      navLabel={`Программа курса ${domain.title}`}
      nav={<CurriculumNav nav={buildNav(domain)} />}
      rail={<TopicRail topic={topic} />}
    >
      <TopicDocument topic={topic} domain={domain} />
    </TopicShell>
  );
}
