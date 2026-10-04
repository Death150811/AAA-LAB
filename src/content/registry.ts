/**
 * Реестр контента: единая точка доступа к доменам, модулям, темам и проектам.
 * Состав модулей вычисляется из порядка тем — список тем нигде не дублируется.
 * Модуль серверный: клиентским компонентам передаются только лёгкие сериализуемые срезы (см. nav.ts).
 */
import type { Domain, DomainDef, DomainId, Module, Project, Topic } from "./types";
import { htmlDomain } from "./html/domain";
import { cssDomain } from "./css/domain";
import { jsDomain } from "./js/domain";
import { sqlDomain } from "./sql/domain";
import { gitDomain } from "./git/domain";
import { csDomain } from "./cs/domain";
import { htmlTopics } from "./html/topics";
import { cssTopics } from "./css/topics";
import { jsTopics } from "./js/topics";
import { sqlTopics } from "./sql/topics";
import { gitTopics } from "./git/topics";
import { csTopics } from "./cs/topics";
import { htmlProjects } from "./html/projects";
import { cssProjects } from "./css/projects";
import { jsProjects } from "./js/projects";
import { sqlProjects } from "./sql/projects";
import { gitProjects } from "./git/projects";
import { csProjects } from "./cs/projects";

const defs: DomainDef[] = [htmlDomain, cssDomain, jsDomain, sqlDomain, gitDomain, csDomain];

const topicsByDomain: Record<DomainId, Topic[]> = {
  html: htmlTopics,
  css: cssTopics,
  js: jsTopics,
  sql: sqlTopics,
  git: gitTopics,
  cs: csTopics,
};

const projectsByDomain: Record<DomainId, Project[]> = {
  html: htmlProjects,
  css: cssProjects,
  js: jsProjects,
  sql: sqlProjects,
  git: gitProjects,
  cs: csProjects,
};

function resolveDomain(def: DomainDef): Domain {
  const all = topicsByDomain[def.id];
  const modules: Module[] = def.modules.map((m) => ({
    ...m,
    topics: all.filter((t) => t.module === m.id).map((t) => t.id),
  }));
  return { ...def, modules };
}

export const domains: Domain[] = defs.map(resolveDomain);

export const allTopics: Topic[] = domains.flatMap((d) => topicsByDomain[d.id]);
export const allProjects: Project[] = domains.flatMap((d) => projectsByDomain[d.id]);

const topicById = new Map(allTopics.map((t) => [t.id, t]));
const projectById = new Map(allProjects.map((p) => [p.id, p]));

export const getDomain = (slug: string): Domain | undefined => domains.find((d) => d.slug === slug);
export const getTopicById = (id: string): Topic | undefined => topicById.get(id);
export const getTopic = (domainSlug: string, slug: string): Topic | undefined =>
  allTopics.find((t) => t.domain === domainSlug && t.slug === slug);
export const getDomainTopics = (domain: DomainId): Topic[] => topicsByDomain[domain];
export const getProjects = (domain: DomainId): Project[] =>
  [...projectsByDomain[domain]].sort((a, b) => a.order - b.order);
export const getProject = (id: string): Project | undefined => projectById.get(id);
export const getModule = (domain: Domain, moduleId: string): Module | undefined =>
  domain.modules.find((m) => m.id === moduleId);

export const topicHref = (t: Pick<Topic, "domain" | "slug">): string => `/learn/${t.domain}/${t.slug}`;
export const projectHref = (p: Pick<Project, "domain" | "id">): string => `/projects/${p.domain}/${p.id.split(".")[1]}`;

/** Порядок изучения темы в домене: порядок модулей, затем порядок внутри модуля. */
export function orderedTopics(domain: Domain): Topic[] {
  return domain.modules.flatMap((m) => m.topics.map((id) => topicById.get(id)).filter((t): t is Topic => !!t));
}

export function getAdjacent(topic: Topic): { prev?: Topic; next?: Topic } {
  const domain = domains.find((d) => d.id === topic.domain);
  if (!domain) return {};
  const list = orderedTopics(domain);
  const i = list.findIndex((t) => t.id === topic.id);
  return { prev: i > 0 ? list[i - 1] : undefined, next: i >= 0 && i < list.length - 1 ? list[i + 1] : undefined };
}

/** Темы, для которых данная тема — пререквизит. */
export function getDependents(topicId: string): Topic[] {
  return allTopics.filter((t) => t.prerequisites.includes(topicId));
}

export function getModuleOf(topic: Topic): Module | undefined {
  return domains.find((d) => d.id === topic.domain)?.modules.find((m) => m.id === topic.module);
}
