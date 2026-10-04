import type { Domain, Level } from "./types";
import { allProjects, getTopicById, projectHref, topicHref } from "./registry";

/** Лёгкий сериализуемый срез домена для клиентских компонентов навигации. */
export interface NavTopic {
  id: string;
  title: string;
  href: string;
  minutes: number;
}
export interface NavProject {
  title: string;
  href: string;
  hours: number;
}
export interface NavModule {
  id: string;
  index: number;
  title: string;
  titleEn?: string;
  summary: string;
  level: Level;
  topics: NavTopic[];
  /** Проект, завершающий модуль (если он написан). */
  project?: NavProject;
}
export interface NavDomain {
  slug: string;
  title: string;
  modules: NavModule[];
}

export function buildNav(domain: Domain): NavDomain {
  return {
    slug: domain.slug,
    title: domain.title,
    modules: domain.modules.map((m) => {
      const project = m.project ? allProjects.find((p) => p.id === m.project) : undefined;
      return {
        id: m.id,
        index: m.index,
        title: m.title,
        titleEn: m.titleEn,
        summary: m.summary,
        level: m.level,
        topics: m.topics.flatMap((id) => {
          const t = getTopicById(id);
          return t
            ? [
                {
                  id: t.id,
                  title: t.title,
                  href: topicHref(t),
                  minutes: t.minutes,
                },
              ]
            : [];
        }),
        project: project
          ? {
              title: project.title,
              href: projectHref(project),
              hours: project.estimatedHours,
            }
          : undefined,
      };
    }),
  };
}
