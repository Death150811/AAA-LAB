"use client";

import { useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/store/hydrate";
import { useUserStore } from "@/store/user-store";

export interface MapNode {
  id: string;
  x: number;
  y: number;
  /** Индекс домена. */
  d: number;
  title: string;
  module: string;
  href: string;
}
export interface MapDomain {
  id: string;
  slug: string;
  title: string;
  numeral: string;
  topics: number;
  cx: number;
  cy: number;
  /** Позиция подписи. */
  lx: number;
  ly: number;
}

const PIGMENT: Record<string, string> = {
  html: "var(--vermilion)",
  css: "var(--lapis)",
  js: "var(--gamboge)",
  sql: "var(--verdigris)",
  git: "var(--madder)",
  cs: "var(--tyrian)",
};

/** Связи между доменами: сплошная — «опирается на», пунктир — «объясняет, почему». */
const DOMAIN_LINKS: [string, string, boolean][] = [
  ["html", "css", false],
  ["html", "js", false],
  ["css", "js", false],
  ["js", "sql", false],
  ["cs", "html", true],
  ["cs", "js", true],
  ["cs", "sql", true],
  ["cs", "git", true],
];

interface Props {
  nodes: MapNode[];
  edges: [number, number][];
  domains: MapDomain[];
  width: number;
  height: number;
}

export function KnowledgeMap({ nodes, edges, domains, width, height }: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const hydrated = useHydrated();
  const completed = useUserStore((s) => s.completedTopics);
  const lastId = useUserStore((s) => s.recent[0]?.id);
  const [hover, setHover] = useState<number | null>(null);
  const [hoverDomain, setHoverDomain] = useState<string | null>(null);

  const domainById = useMemo(() => new Map(domains.map((d) => [d.id, d])), [domains]);
  const domainOf = (i: number) => domains[nodes[i]!.d]!;

  const neighbours = useMemo(() => {
    const m = new Map<number, Set<number>>();
    for (const [a, b] of edges) {
      (m.get(a) ?? m.set(a, new Set()).get(a)!).add(b);
      (m.get(b) ?? m.set(b, new Set()).get(b)!).add(a);
    }
    return m;
  }, [edges]);

  // Несколько «сигналов» бегут по связям: наглядно показывают, что знание опирается на знание.
  const pulses = useMemo(() => {
    if (reduce) return [];
    const picks: number[] = [];
    for (let k = 0; k < 9; k++) picks.push((k * 43 + 7) % edges.length);
    return picks;
  }, [edges.length, reduce]);

  const doneCount = hydrated ? nodes.filter((n) => completed[n.id]).length : 0;
  const lit = hover !== null ? new Set([hover, ...(neighbours.get(hover) ?? [])]) : null;
  const litDomain = hoverDomain ?? (hover !== null ? domainOf(hover).id : null);

  const tip = hover !== null ? nodes[hover]! : null;

  return (
    <figure className="relative m-0" aria-label="Карта знаний">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={`Карта знаний: ${nodes.length} тем шести доменов, ${edges.length} связей «опирается на». Изучено тем: ${doneCount}.`}
        className="block h-auto w-full overflow-visible"
      >
        {/* Связи между доменами */}
        {DOMAIN_LINKS.map(([a, b, dashed]) => {
          const A = domainById.get(a)!;
          const B = domainById.get(b)!;
          const mx = (A.cx + B.cx) / 2;
          const my = (A.cy + B.cy) / 2;
          const nx = (B.cy - A.cy) * 0.12;
          const ny = (A.cx - B.cx) * 0.12;
          return (
            <path
              key={`${a}-${b}`}
              d={`M${A.cx} ${A.cy} Q${mx + nx} ${my + ny} ${B.cx} ${B.cy}`}
              fill="none"
              stroke="var(--fg)"
              strokeOpacity={litDomain && (litDomain === a || litDomain === b) ? 0.34 : 0.1}
              strokeWidth={1}
              strokeDasharray={dashed ? "2 7" : undefined}
              className="transition-[stroke-opacity] duration-300"
            />
          );
        })}

        {/* Связи «опирается на» между темами */}
        <g>
          {edges.map(([a, b], i) => {
            const A = nodes[a]!;
            const B = nodes[b]!;
            const hot = lit ? lit.has(a) && lit.has(b) && (a === hover || b === hover) : false;
            const dim = lit ? !hot : litDomain ? A.d !== B.d || domainOf(a).id !== litDomain : false;
            return (
              <line
                key={i}
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                pathLength={1}
                stroke={hot ? PIGMENT[domainOf(a).id] : "var(--fg)"}
                strokeWidth={hot ? 1.5 : 0.7}
                strokeOpacity={hot ? 0.95 : dim ? 0.05 : 0.22}
                className="km-edge"
                style={{ ["--i" as string]: i }}
              />
            );
          })}
        </g>

        {/* Бегущие сигналы */}
        {pulses.map((e, k) => {
          const [a, b] = edges[e]!;
          const A = nodes[a]!;
          const B = nodes[b]!;
          return (
            <circle key={k} r={2.2} fill={PIGMENT[domainOf(a).id]} opacity={0}>
              <animateMotion dur={`${3.4 + (k % 3) * 0.7}s`} begin={`${1.6 + k * 0.55}s`} repeatCount="indefinite" path={`M${A.x} ${A.y} L${B.x} ${B.y}`} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
              <animate attributeName="opacity" values="0;0.95;0.95;0" keyTimes="0;0.15;0.85;1" dur={`${3.4 + (k % 3) * 0.7}s`} begin={`${1.6 + k * 0.55}s`} repeatCount="indefinite" />
            </circle>
          );
        })}

        {/* Темы */}
        <g>
          {nodes.map((n, i) => {
            const done = hydrated && !!completed[n.id];
            const current = hydrated && lastId === n.id;
            const faded = lit ? !lit.has(i) : litDomain ? domains[n.d]!.id !== litDomain : false;
            const color = PIGMENT[domains[n.d]!.id];
            return (
              <g
                key={n.id}
                className="km-node"
                style={{ ["--i" as string]: i, opacity: faded ? 0.22 : undefined, cursor: "pointer", transition: "opacity .25s" }}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover((h) => (h === i ? null : h))}
                onClick={() => router.push(n.href)}
              >
                <circle cx={n.x} cy={n.y} r={9} fill="transparent" />
                {current && <circle cx={n.x} cy={n.y} r={7.5} fill="none" stroke={color} strokeWidth={1} className="km-breathe" />}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={hover === i ? 5.2 : 3.7}
                  fill={done ? color : "var(--bg)"}
                  fillOpacity={1}
                  stroke={color}
                  strokeWidth={done ? 0 : 1.5}
                  style={{ transition: "r .15s" }}
                />
                {!done && <circle cx={n.x} cy={n.y} r={1.3} fill={color} />}
              </g>
            );
          })}
        </g>

        {/* Подписи доменов — ссылки */}
        {domains.map((d, k) => (
          <a
            key={d.id}
            href={`/learn/${d.slug}`}
            onPointerEnter={() => setHoverDomain(d.id)}
            onPointerLeave={() => setHoverDomain(null)}
            onFocus={() => setHoverDomain(d.id)}
            onBlur={() => setHoverDomain(null)}
            className="km-caption"
            style={{ ["--i" as string]: k }}
          >
            <text x={d.lx} y={d.ly} textAnchor="middle" className={cn("select-none")} fill="var(--fg)">
              <tspan fontFamily="var(--font-label)" fontSize="9.5" letterSpacing="1.6" fill={PIGMENT[d.id]}>
                {d.numeral}
              </tspan>
              <tspan dx="8" fontFamily="var(--font-display)" fontStyle="italic" fontSize="21" fontWeight="300">
                {d.title === "Computer Science" ? "CS" : d.title}
              </tspan>
              <tspan dx="8" fontFamily="var(--font-label)" fontSize="9" fill="var(--fg-dim)">
                {d.topics}
              </tspan>
            </text>
          </a>
        ))}
      </svg>

      {/* Подсказка */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute z-10 w-max max-w-[17rem] -translate-x-1/2 border border-line-strong bg-bg-raised px-3 py-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.9)] transition-opacity duration-150",
          tip ? "opacity-100" : "opacity-0",
        )}
        style={tip ? { left: `${(tip.x / width) * 100}%`, top: `calc(${(tip.y / height) * 100}% - 3.4rem)` } : { left: "50%", top: 0 }}
      >
        {tip && (
          <>
            <div className="label text-[9.5px]" style={{ color: PIGMENT[domains[tip.d]!.id] }}>
              {domains[tip.d]!.title} · {tip.module}
            </div>
            <div className="mt-1 font-display text-[1.02rem] leading-snug text-fg">{tip.title}</div>
          </>
        )}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[11.5px] text-fg-dim">
        <span>Каждая точка — тема, линия — «опирается на». Нажмите точку, чтобы открыть тему.</span>
        <span className="tabular">
          {doneCount > 0 ? `Изучено ${doneCount} из ${nodes.length}` : `${nodes.length} тем · ${edges.length} связей`}
        </span>
      </figcaption>
    </figure>
  );
}
