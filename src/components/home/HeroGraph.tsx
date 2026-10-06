"use client";

import { MotionConfig, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";

export interface GraphDomain {
  id: string;
  slug: string;
  code: string;
  title: string;
  tagline: string;
  modules: number;
  topics: number;
}

/** Позиции узлов в системе координат SVG (viewBox 640×420). */
const POS: Record<string, { x: number; y: number }> = {
  html: { x: 105, y: 120 },
  css: { x: 300, y: 62 },
  js: { x: 505, y: 128 },
  sql: { x: 530, y: 282 },
  git: { x: 110, y: 290 },
  cs: { x: 320, y: 354 },
};

/** Зависимости: from → to означает «to опирается на from». dashed — «объясняет, почему». */
const EDGES: { from: string; to: string; dashed?: boolean }[] = [
  { from: "html", to: "css" },
  { from: "html", to: "js" },
  { from: "css", to: "js" },
  { from: "cs", to: "html", dashed: true },
  { from: "cs", to: "js", dashed: true },
  { from: "cs", to: "sql", dashed: true },
  { from: "cs", to: "git", dashed: true },
  { from: "js", to: "sql" },
];

const W = 150;
const H = 54;

export function HeroGraph({ domains }: { domains: GraphDomain[] }) {
  const [active, setActive] = useState<string | null>(null);
  const info = domains.find((d) => d.id === (active ?? "html"))!;

  const linked = (id: string) =>
    active === null || id === active || EDGES.some((e) => (e.from === active && e.to === id) || (e.to === active && e.from === id));

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative">
        <svg
          viewBox="0 0 640 420"
          role="group"
          aria-label="Граф зависимостей между шестью доменами знаний"
          className="h-auto w-full overflow-visible"
        >
          <defs>
            <linearGradient id="edge" x1="0" x2="1">
              <stop offset="0" stopColor="var(--steel)" stopOpacity="0.35" />
              <stop offset="1" stopColor="var(--steel)" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {EDGES.map((e) => {
            const a = POS[e.from]!;
            const b = POS[e.to]!;
            const hot = active !== null && (e.from === active || e.to === active);
            const dim = active !== null && !hot;
            return (
              <line
                key={`${e.from}-${e.to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={hot ? "var(--cyan)" : "url(#edge)"}
                strokeWidth={hot ? 1.6 : 1}
                strokeDasharray={e.dashed ? "3 5" : hot ? "6 6" : undefined}
                className={cn("transition-[opacity,stroke] duration-300", hot && !e.dashed && "animate-dash")}
                opacity={dim ? 0.15 : 1}
              />
            );
          })}

          {domains.map((d, i) => {
            const p = POS[d.id];
            if (!p) return null;
            const on = active === d.id;
            return (
              <motion.g
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: linked(d.id) ? 1 : 0.35, y: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  href={`/learn/${d.slug}`}
                  onMouseEnter={() => setActive(d.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(d.id)}
                  onBlur={() => setActive(null)}
                  aria-label={`${d.title}: ${d.tagline}`}
                >
                  <rect
                    x={p.x - W / 2}
                    y={p.y - H / 2}
                    width={W}
                    height={H}
                    rx={9}
                    fill="var(--surface)"
                    stroke={on ? "var(--cyan)" : "var(--line-strong)"}
                    strokeWidth={on ? 1.5 : 1}
                    className="transition-[stroke] duration-200"
                  />
                  <text x={p.x - W / 2 + 14} y={p.y - 6} fontSize="10" className="mono" fill="var(--fg-dim)" letterSpacing="1.2">
                    {d.code}
                  </text>
                  <text x={p.x - W / 2 + 14} y={p.y + 14} fontSize="15" fontWeight="600" fill="var(--fg)">
                    {d.title === "Computer Science" ? "CS" : d.title}
                  </text>
                  <text x={p.x + W / 2 - 12} y={p.y + 14} fontSize="10" textAnchor="end" className="mono" fill={d.topics ? "var(--emerald)" : "var(--fg-dim)"}>
                    {d.topics ? `${d.topics} тем` : "скоро"}
                  </text>
                  {on && (
                    <circle cx={p.x + W / 2 - 14} cy={p.y - H / 2 + 14} r="3" fill="var(--cyan)" />
                  )}
                </Link>
              </motion.g>
            );
          })}
        </svg>

        <div
          aria-live="polite"
          className="mt-2 rounded-xl border border-line bg-surface/70 px-5 py-3.5 backdrop-blur-sm"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[0.95rem] font-semibold text-fg">{info.title}</span>
            <span className="mono text-[11px] text-fg-dim tabular">
              {info.modules} модулей · {info.topics} тем
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-snug text-fg-muted">{info.tagline}</p>
        </div>
        <p className="mt-3 text-center text-[11px] text-fg-dim">
          Сплошная линия — «опирается на». Пунктир — «объясняет, почему это так устроено».
        </p>
      </div>
    </MotionConfig>
  );
}
