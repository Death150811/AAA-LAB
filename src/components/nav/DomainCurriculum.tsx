"use client";

import { ArrowRight, Check, Hammer } from "lucide-react";
import Link from "next/link";
import type { NavDomain } from "@/content/nav";
import { LEVEL_LABEL, LEVEL_ORDER } from "@/content/sections";
import type { Accent } from "@/content/types";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/store/hydrate";
import { plural } from "@/lib/plural";
import { useUserStore } from "@/store/user-store";
import { ACCENT, ProgressBar } from "@/components/ui/primitives";

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
      className="group inline-flex h-12 items-center gap-2.5 rounded-[3px] border border-accent bg-accent px-6 text-[0.95rem] font-semibold text-accent-ink transition-[transform,background-color] hover:bg-accent/85 active:scale-[0.97]"
    >
      {finished ? "Повторить курс" : started ? "Продолжить" : "Начать курс"}
      <span className="hidden max-w-[16rem] truncate font-normal sm:inline">· {nextTopic.title}</span>
      <ArrowRight size={17} aria-hidden className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

/** Ячейка «ведомости»: сколько тем курса пройдено. */
export function DomainProgress({ nav, accent, className }: { nav: NavDomain; accent: Accent; className?: string }) {
  const completed = useUserStore((s) => s.completedTopics);
  const hydrated = useHydrated();
  const total = nav.modules.reduce((n, m) => n + m.topics.length, 0);
  const done = hydrated ? nav.modules.reduce((n, m) => n + m.topics.filter((t) => completed[t.id]).length, 0) : 0;
  return (
    <div className={cn("flex flex-col justify-between gap-4", className)}>
      <div className="label text-fg-dim">Пройдено</div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[2.6rem] font-light leading-none text-fg tabular">{done}</span>
          <span className="text-[13px] text-fg-muted tabular">
            из {total} {plural(total, "темы", "тем", "тем")}
          </span>
        </div>
        <ProgressBar value={total ? done / total : 0} accent={accent} label="Прогресс по курсу" className="mt-4" />
      </div>
    </div>
  );
}

/** Шесть уровней: от основ до самостоятельных проектов; каждый заполняется по мере прохождения. */
export function LearningPath({ nav, accent }: { nav: NavDomain; accent: Accent }) {
  const completed = useUserStore((s) => s.completedTopics);
  const hydrated = useHydrated();
  return (
    <ol className="m-0 grid list-none grid-cols-2 gap-px border border-line-strong bg-line-strong p-0 sm:grid-cols-3 lg:grid-cols-6">
      {LEVEL_ORDER.map((lvl, i) => {
        const mods = nav.modules.filter((m) => m.level === lvl);
        const topics = mods.flatMap((m) => m.topics);
        const done = hydrated ? topics.filter((t) => completed[t.id]).length : 0;
        const ready = topics.length > 0;
        const full = ready && done === topics.length;
        return (
          <li key={lvl} className="bg-bg p-4">
            <div className="flex items-center justify-between">
              <span className="label tabular text-fg-dim">{String(i + 1).padStart(2, "0")}</span>
              {full && <Check size={14} className={ACCENT[accent].text} aria-label="Пройдено" />}
            </div>
            <div className="mt-4 font-display text-[1.2rem] leading-none text-fg">{LEVEL_LABEL[lvl]}</div>
            <div className="mt-2 text-[12px] text-fg-dim">
              {mods.length ? `${mods.length} ${plural(mods.length, "модуль", "модуля", "модулей")} · ${topics.length} тем` : "—"}
            </div>
            <ProgressBar value={topics.length ? done / topics.length : 0} accent={accent} label={`Прогресс: ${LEVEL_LABEL[lvl]}`} className="mt-4" />
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
    <ol className="m-0 list-none border-b border-line-strong p-0">
      {nav.modules.map((m) => {
        const done = hydrated ? m.topics.filter((t) => completed[t.id]).length : 0;
        const ready = m.topics.length > 0;
        return (
          <li key={m.id} className="grid gap-x-8 gap-y-4 border-t border-line-strong py-8 md:grid-cols-[5.5rem_minmax(0,1fr)]">
            <div aria-hidden className="font-display text-[3.4rem] font-light leading-[0.85] text-accent-text/70 tabular md:text-[4.2rem]">
              {String(m.index).padStart(2, "0")}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h3 className="font-display text-[1.65rem] font-normal leading-tight tracking-[-0.01em] text-fg">{m.title}</h3>
                {m.titleEn && <span className="font-display text-[1.02rem] italic text-fg-dim">{m.titleEn}</span>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="label border border-line-strong px-2 py-1 text-fg-muted">{LEVEL_LABEL[m.level]}</span>
                {ready ? (
                  <span className="flex items-center gap-3">
                    {/* По одной отметке на тему: заполняется пигментом домена. */}
                    <span aria-hidden className="flex gap-[3px]">
                      {m.topics.map((t) => (
                        <span key={t.id} className={cn("h-[7px] w-[7px] border transition-colors duration-500", hydrated && completed[t.id] ? "border-accent bg-accent" : "border-line-strong")} />
                      ))}
                    </span>
                    <span className="label tabular text-fg-dim">
                      {done}/{m.topics.length}
                    </span>
                  </span>
                ) : (
                  <span className="label border border-amber/40 px-2 py-1 text-amber">Готовится</span>
                )}
              </div>
              <p className="mt-4 max-w-2xl font-serif text-[1rem] leading-relaxed text-fg-muted">{m.summary}</p>

              {ready && (
                <ol className="m-0 mt-6 grid list-none gap-x-8 p-0 sm:grid-cols-2">
                  {m.topics.map((t, i) => {
                    const isDone = hydrated && !!completed[t.id];
                    return (
                      <li key={t.id} className="border-t border-line">
                        <Link
                          href={t.href}
                          className="group flex items-center gap-3 py-3 text-[0.95rem] text-fg-muted transition-colors hover:text-fg"
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "grid h-[18px] w-[18px] shrink-0 place-items-center border font-label text-[9px] tabular transition-colors",
                              isDone ? "border-accent bg-accent text-accent-ink" : "border-line-strong text-fg-dim group-hover:border-accent group-hover:text-accent-text",
                            )}
                          >
                            {isDone ? <Check size={11} strokeWidth={3} /> : i + 1}
                          </span>
                          {isDone && <span className="sr-only">Изучено: </span>}
                          <span className="min-w-0 flex-1 leading-snug transition-transform duration-200 group-hover:translate-x-0.5">{t.title}</span>
                          <span className="label tabular shrink-0 text-fg-dim">{t.minutes}′</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
              {m.project && (
                <Link
                  href={m.project.href}
                  className="group mt-1 flex items-center gap-3 border-y border-line-strong bg-surface/40 px-3 py-3 text-[0.95rem] text-fg-muted transition-colors hover:border-accent hover:text-fg"
                >
                  <Hammer size={15} aria-hidden className="shrink-0 text-accent-text" />
                  <span className="label shrink-0 text-accent-text">Проект модуля</span>
                  <span className="min-w-0 flex-1 leading-snug">{m.project.title}</span>
                  <span className="label tabular shrink-0 text-fg-dim">{m.project.hours} ч</span>
                  <ArrowRight size={14} aria-hidden className="shrink-0 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
