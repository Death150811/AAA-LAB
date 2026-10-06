"use client";

import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHydrated } from "@/store/hydrate";
import { useUserStore } from "@/store/user-store";
import type { NavDomain } from "@/content/nav";
import { LEVEL_LABEL } from "@/content/sections";
import { cn } from "@/lib/cn";

export function CurriculumNav({ nav }: { nav: NavDomain }) {
  const pathname = usePathname();
  const completed = useUserStore((s) => s.completedTopics);
  const hydrated = useHydrated();

  const total = nav.modules.reduce((n, m) => n + m.topics.length, 0);
  const done = hydrated ? nav.modules.reduce((n, m) => n + m.topics.filter((t) => completed[t.id]).length, 0) : 0;

  return (
    <nav aria-label={`Программа курса ${nav.title}`} className="text-sm">
      <div className="mb-4 px-1">
        <Link href={`/learn/${nav.slug}`} className="eyebrow hover:text-fg">
          ← {nav.title} · программа
        </Link>
        <div className="mt-2 flex items-center gap-2.5">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-emerald transition-[width] duration-700"
              style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
            />
          </div>
          <span className="mono text-[11px] text-fg-dim tabular">
            {done}/{total}
          </span>
        </div>
      </div>

      <ol className="m-0 list-none space-y-1 p-0">
        {nav.modules.map((m) => {
          const hasActive = m.topics.some((t) => t.href === pathname);
          const modDone = hydrated ? m.topics.filter((t) => completed[t.id]).length : 0;
          return (
            <li key={m.id}>
              <details open={hasActive || undefined} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-1.5 py-1.5 text-[13px] text-fg-muted marker:hidden hover:bg-surface-2 hover:text-fg [&::-webkit-details-marker]:hidden">
                  <ChevronRight
                    size={14}
                    aria-hidden
                    className="shrink-0 text-fg-dim transition-transform duration-200 group-open:rotate-90"
                  />
                  <span className="mono w-5 shrink-0 text-[11px] text-fg-dim tabular">{String(m.index).padStart(2, "0")}</span>
                  <span className={cn("flex-1 leading-snug", hasActive && "text-fg")}>{m.title}</span>
                  {m.topics.length > 0 ? (
                    <span className="mono text-[10px] text-fg-dim tabular">
                      {modDone}/{m.topics.length}
                    </span>
                  ) : (
                    <span className="eyebrow !text-[9px]" title={LEVEL_LABEL[m.level]}>
                      скоро
                    </span>
                  )}
                </summary>
                {m.topics.length > 0 && (
                  <ol className="m-0 mt-0.5 list-none space-y-px border-l border-line p-0 pl-0 ml-[1.15rem]">
                    {m.topics.map((t) => {
                      const active = t.href === pathname;
                      const isDone = hydrated && !!completed[t.id];
                      return (
                        <li key={t.id}>
                          <Link
                            href={t.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "relative flex items-start gap-2 rounded-r-md py-1.5 pl-3 pr-2 text-[13px] leading-snug transition-colors",
                              active
                                ? "bg-accent/[0.08] text-fg before:absolute before:inset-y-0 before:-left-px before:w-[2px] before:bg-accent"
                                : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                            )}
                          >
                            <span className="min-w-0 flex-1">{t.title}</span>
                            {isDone && <Check size={13} aria-label="Изучено" className="mt-[3px] shrink-0 text-emerald" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </details>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
