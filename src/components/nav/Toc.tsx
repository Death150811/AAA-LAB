"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export interface TocItem {
  id: string;
  num: string;
  title: string;
}

/** Оглавление с подсветкой текущего раздела (IntersectionObserver). */
export function Toc({ items, label = "Содержание" }: { items: TocItem[]; label?: string }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const first = els.find((el) => visible.has(el.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-72px 0px -62% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav aria-label={label}>
      <ol className="m-0 list-none space-y-px border-l border-line p-0">
        {items.map((i) => {
          const on = i.id === active;
          return (
            <li key={i.id}>
              <a
                href={`#${i.id}`}
                aria-current={on ? "location" : undefined}
                className={cn(
                  "relative flex gap-2.5 py-1 pl-3 pr-1 text-[13px] leading-snug transition-colors",
                  on
                    ? "text-fg before:absolute before:inset-y-0 before:-left-px before:w-[2px] before:bg-cyan"
                    : "text-fg-muted hover:text-fg",
                )}
              >
                <span className="mono mt-px w-5 shrink-0 text-[11px] text-fg-dim tabular">{i.num}</span>
                <span>{i.title}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
