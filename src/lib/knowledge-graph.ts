import type { Domain, Topic } from "@/content/types";
import type { MapDomain, MapNode } from "@/components/home/KnowledgeMap";
import { layoutGraph } from "./graph-layout";

export const MAP_W = 800;
export const MAP_H = 700;

const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];
/** Якоря кластеров в системе координат карты: порядок — как в списке доменов реестра (html, css, js, sql, git, cs). */
const ANCHORS = [
  { x: 165, y: 205 },
  { x: 420, y: 110 },
  { x: 655, y: 220 },
  { x: 650, y: 500 },
  { x: 155, y: 510 },
  { x: 410, y: 600 },
];

/** Узлы, рёбра и подписи доменов для карты знаний. Чистая функция: результат одинаков при каждой сборке. */
export function buildKnowledgeMap(domains: Domain[], topics: Topic[]) {
  const order = domains.map((d) => d.id);
  const idx = new Map(topics.map((t, i) => [t.id, i]));
  const counter: Record<string, number> = {};
  const layoutNodes = topics.map((t) => ({ domain: order.indexOf(t.domain), order: (counter[t.domain] = (counter[t.domain] ?? -1) + 1) }));
  const edges: [number, number][] = [];
  for (const t of topics) for (const p of t.prerequisites) if (idx.has(p)) edges.push([idx.get(p)!, idx.get(t.id)!]);
  const bonds: [number, number][] = [];
  for (let i = 1; i < topics.length; i++) if (topics[i]!.domain === topics[i - 1]!.domain && topics[i]!.module === topics[i - 1]!.module) bonds.push([i - 1, i]);

  const pos = layoutGraph(layoutNodes, { width: MAP_W, height: MAP_H, anchors: ANCHORS, edges, bonds });
  const moduleTitle = new Map(domains.flatMap((d) => d.modules.map((m) => [`${d.id}.${m.id}`, m.title] as const)));

  const nodes: MapNode[] = topics.map((t, i) => ({
    id: t.id,
    x: pos[i]!.x,
    y: pos[i]!.y,
    d: order.indexOf(t.domain),
    title: t.title,
    module: moduleTitle.get(`${t.domain}.${t.module}`) ?? t.module,
    href: `/learn/${t.domain}/${t.slug}`,
  }));

  const mapDomains: MapDomain[] = domains.map((d, k) => {
    const own = nodes.filter((n) => n.d === k);
    const cx = own.reduce((s, n) => s + n.x, 0) / own.length;
    const cy = own.reduce((s, n) => s + n.y, 0) / own.length;
    const top = cy < MAP_H / 2;
    const minY = Math.min(...own.map((n) => n.y));
    const maxY = Math.max(...own.map((n) => n.y));
    return {
      id: d.id,
      slug: d.slug,
      title: d.title,
      numeral: NUMERALS[k]!,
      topics: own.length,
      cx: Math.round(cx),
      cy: Math.round(cy),
      lx: Math.round(cx),
      ly: Math.round(top ? minY - 22 : maxY + 34),
    };
  });
  return { nodes, edges, domains: mapDomains };
}
