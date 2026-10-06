"use client";

import { ArrowRight, Check, Circle, Hammer } from "lucide-react";
import Link from "next/link";
import type { NavDomain } from "@/content/nav";
import { LEVEL_LABEL, LEVEL_ORDER } from "@/content/sections";
import type { Accent } from "@/content/types";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/store/hydrate";
import { plural } from "@/lib/plural";
import { useUserStore } from "@/store/user-store";
import { ACCENT, Badge, ProgressBar } from "@/components/ui/primitives";

/** Кнопка «Продолжить»: первая неотмеченная тема курса. */
export function ContinueButton({ nav }: { nav: NavDomain }) {
  const completed = useUserStore((s) => s.completedTopics);
  const hydrated = useHydrated();
  const all = nav.modules.flatMap((m) => m.topics);
  if (!all.length) return null;
  const nextTopic = hydrated ? (all.find((t) => !completed[t.id]) ?? all[0]!) : all[0]!;
  const started = hydrated && all.some((t) => completed[t.id]);
  const finished = hydrated && all.every((t) => completed[t.id]);
  return (
    <Link
      href={nextTopic.href}
      className="inline-flex h-12 items-center gap-2.5 rounded-lg border border-accent bg-accent px-6 text-[0.95rem] font-semibold text-accent-ink transition-[transform,background-color] hover:bg-[#5ad6e8] active:scale-[0.97]"
    >
      {finished ? "Повторить курс" : started ? "Продолжить" : "Начать курс"}
      <span className="hidden max-w-[16rem] truncate font-normal opacity-80 sm:inline">· {nextTopic.title}</span>
      <ArrowRight size={17} aria-hidden />
    </Link>
  );
}

export function DomainProgress({ nav, accent }: { nav: NavDomain; accent: Accent }) {
  const completed = useUserStore((s) => s.completedTopics);
  const hydrated = useHydrated();
  const total = nav.modules.reduce((n, m) => n + m.topics.length, 0);
  const done = hydrated ? nav.modules.reduce((n, m) => n + m.topics.filter((t) => completed[t.id]).length, 0) : 0;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="text-fg-muted">Прогресс по курсу</span>
        <span className="mono tabular text-fg">
          {done} / {total} <span className="text-fg-dim">тем</span>
        </span>
      </div>
      <ProgressBar value={total ? done / total : 0} accent={accent} label="Прогресс по курсу" />
    </div>
  );
}

export function LearningPath({ nav, accent }: { nav: NavDomain; accent: Accent }) {
  const completed = useUserStore((s) => s.completedTopics);
  const hydrated = useHydrated();
  return (
    <ol className="m-0 grid list-none grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line p-0 sm:grid-cols-3 lg:grid-cols-6">
      {LEVEL_ORDER.map((lvl, i) => {
        const mods = nav.modules.filter((m) => m.level === lvl);
        const topics = mods.flatMap((m) => m.topics);
        const done = hydrated ? topics.filter((t) => completed[t.id]).length : 0;
        const ready = topics.length > 0;
        return (
          <li key={lvl} className="bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="mono text-[11px] text-fg-dim tabular">{String(i + 1).padStart(2, "0")}</span>
              {ready && done === topics.length && done > 0 && <Check size={14} className={ACCENT[accent].text} aria-label="Пройдено" />}
            </div>
            <div className="mt-3 text-[0.95rem] font-semibold text-fg">{LEVEL_LABEL[lvl]}</div>
            <div className="mt-1 text-xs text-fg-dim">
              {mods.length ? `${mods.length} ${plural(mods.length, "модуль", "модуля", "модулей")}` : "—"}
            </div>
            <ProgressBar value={topics.length ? done / topics.length : 0} accent={accent} label={`Прогресс: ${LEVEL_LABEL[lvl]}`} className="mt-3" />
          </li>
        );
      })}
    </ol>
  );
}

export function DomainCurriculum({ nav }: { nav: NavDomain }) {
  const completed = useUserStore((s) => s.completedTopics);
  const hydrated = useHydrated();
  return (
    <ol className="m-0 list-none space-y-4 p-0">
      {nav.modules.map((m) => {
        const done = hydrated ? m.topics.filter((t) => completed[t.id]).length : 0;
        const ready = m.topics.length > 0;
        return (
          <li key={m.id} className={cn("rounded-xl border bg-surface", ready ? "border-line" : "border-dashed border-line")}>
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2 p-5">
              <span className="mono mt-1 text-sm text-fg-dim tabular">{String(m.index).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-[1.15rem] font-semibold tracking-tight text-fg">{m.title}</h3>
                  {m.titleEn && <span className="mono text-xs text-fg-dim">{m.titleEn}</span>}
                </div>
                <p className="mt-1.5 max-w-2xl text-[0.93rem] leading-relaxed text-fg-muted">{m.summary}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={ready ? "accent" : "neutral"}>{LEVEL_LABEL[m.level]}</Badge>
                {ready ? (
                  <span className="mono text-xs text-fg-dim tabular">
                    {done}/{m.topics.length}
                  </span>
                ) : (
                  <Badge tone="amber">Готовится</Badge>
                )}
              </div>
            </div>
            {ready && (
              <ol className="m-0 grid list-none gap-px border-t border-line bg-line p-0 sm:grid-cols-2">
                {m.topics.map((t, i) => {
                  const isDone = hydrated && !!completed[t.id];
                  return (
                    <li key={t.id} className="bg-surface">
                      <Link
                        href={t.href}
                        className="group flex h-full items-center gap-3 px-5 py-3 text-[0.93rem] text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                      >
                        {isDone ? (
                          <Check size={15} aria-label="Изучено" className={cn("shrink-0", "text-emerald")} />
                        ) : (
                          <Circle size={15} aria-hidden className="shrink-0 text-fg-dim/50" />
                        )}
                        <span className="mono w-5 shrink-0 text-[11px] text-fg-dim tabular">{i + 1}</span>
                        <span className="min-w-0 flex-1 leading-snug">{t.title}</span>
                        <span className="mono shrink-0 text-[11px] text-fg-dim tabular">{t.minutes}′</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
            {m.project && (
              <Link
                href={m.project.href}
                className="group flex items-center gap-3 border-t border-line px-5 py-3 text-[0.93rem] text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <Hammer size={15} aria-hidden className={cn("shrink-0", "text-accent-text")} />
                <span className="mono text-[11px] uppercase tracking-wide text-fg-dim">Проект модуля</span>
                <span className="min-w-0 flex-1 leading-snug">{m.project.title}</span>
                <span className="mono shrink-0 text-[11px] text-fg-dim tabular">{m.project.hours} ч</span>
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

