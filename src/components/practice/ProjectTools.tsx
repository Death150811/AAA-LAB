"use client";

import { Check, CircleCheck, CircleDashed, Eye, Lightbulb } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Inline } from "@/lib/inline";
import { useHydrated } from "@/store/hydrate";
import { useUserStore } from "@/store/user-store";

export function AcceptanceChecklist({ projectId, items }: { projectId: string; items: string[] }) {
  const checked = useUserStore((s) => s.projectChecks[projectId]);
  const toggle = useUserStore((s) => s.toggleProjectCheck);
  const hydrated = useHydrated();
  const set = new Set(hydrated ? (checked ?? []) : []);
  const done = set.size;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-fg-muted">Отметьте выполненное — прогресс сохраняется в браузере</span>
        <span className="mono text-xs tabular text-fg-dim">{done}/{items.length}</span>
      </div>
      <ul className="m-0 list-none space-y-2 p-0">
        {items.map((t, i) => (
          <li key={i}>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-2.5 text-[0.95rem] leading-relaxed transition-colors",
                set.has(i) ? "border-emerald/40 bg-emerald/[0.05] text-fg" : "border-line text-fg-muted hover:border-line-strong",
              )}
            >
              <input
                type="checkbox"
                checked={set.has(i)}
                onChange={() => toggle(projectId, i)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--emerald)]"
              />
              <span>
                <Inline text={t} />
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CompleteProjectButton({ projectId }: { projectId: string }) {
  const done = useUserStore((s) => !!s.completedProjects[projectId]);
  const toggle = useUserStore((s) => s.toggleProject);
  const hydrated = useHydrated();
  const on = hydrated && done;
  return (
    <button
      type="button"
      onClick={() => toggle(projectId)}
      aria-pressed={on}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-[transform,background-color,border-color] active:scale-[0.97]",
        on ? "border-emerald/50 bg-emerald/10 text-emerald" : "border-line-strong bg-surface-2 text-fg hover:border-steel/60 hover:bg-surface-3",
      )}
    >
      {on ? <CircleCheck size={16} aria-hidden /> : <CircleDashed size={16} aria-hidden />}
      {on ? "Проект завершён" : "Отметить проект завершённым"}
    </button>
  );
}

export function HintsReveal({ hints }: { hints: string[] }) {
  const [n, setN] = useState(0);
  return (
    <div>
      {n > 0 && (
        <ol className="m-0 mb-3 list-none space-y-2 p-0">
          {hints.slice(0, n).map((h, i) => (
            <li key={i} className="flex gap-2.5 rounded-lg border border-amber/25 bg-amber/[0.05] px-3.5 py-2.5 text-[0.93rem] leading-relaxed text-[#cdbf9f]">
              <Lightbulb size={15} aria-hidden className="mt-1 shrink-0 text-amber" />
              <span>
                <span className="mr-1.5 font-semibold text-amber">Подсказка {i + 1}.</span>
                <Inline text={h} />
              </span>
            </li>
          ))}
        </ol>
      )}
      {n < hints.length ? (
        <button
          type="button"
          onClick={() => setN((v) => v + 1)}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-surface-2 px-3.5 text-[13px] text-fg-muted hover:text-fg"
        >
          <Lightbulb size={14} aria-hidden />
          Показать подсказку {n + 1} из {hints.length}
        </button>
      ) : (
        <p className="text-xs text-fg-dim">Все подсказки показаны.</p>
      )}
    </div>
  );
}

export function SolutionReveal({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {!open ? (
        <div className="rounded-xl border border-dashed border-line-strong p-5">
          <p className="text-[0.95rem] text-fg-muted">
            Решение раскрывается отдельно. Сначала сделайте собственную попытку и сверьтесь с критериями приёмки и
            рубрикой — разбор решения полезнее, когда у вас уже есть своё.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-surface-2 px-3.5 text-[13px] text-fg hover:bg-surface-3"
          >
            <Eye size={14} aria-hidden />
            Я попробовал(а) — показать решение
          </button>
        </div>
      ) : (
        <div className="doc space-y-3 rounded-xl border border-line bg-bg-raised/60 p-5">{children}</div>
      )}
    </div>
  );
}

/** Самооценка по рубрике: уровень 0–4 по каждому критерию → взвешенный итог. */
export function RubricSelfEval({ rubric }: { rubric: { criterion: string; weight: number; description: string }[] }) {
  const [scores, setScores] = useState<number[]>(() => rubric.map(() => 0));
  const total = rubric.reduce((sum, r, i) => sum + (r.weight * (scores[i] ?? 0)) / 4, 0);
  const rounded = Math.round(total);
  return (
    <div className="space-y-3">
      <ul className="m-0 list-none space-y-3 p-0">
        {rubric.map((r, i) => (
          <li key={r.criterion} className="rounded-xl border border-line bg-surface/60 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium text-fg">{r.criterion}</span>
              <span className="mono text-xs text-fg-dim tabular">вес {r.weight}%</span>
            </div>
            <p className="mt-1 text-[0.9rem] leading-relaxed text-fg-muted">
              <Inline text={r.description} />
            </p>
            <fieldset className="mt-3 border-0 p-0">
              <legend className="sr-only">Самооценка: {r.criterion}</legend>
              <div className="flex flex-wrap gap-1.5" role="radiogroup">
                {[0, 1, 2, 3, 4].map((v) => (
                  <label
                    key={v}
                    className={cn(
                      "cursor-pointer rounded-md border px-3 py-1 text-xs transition-colors",
                      scores[i] === v ? "border-cyan/60 bg-cyan/15 text-cyan" : "border-line text-fg-muted hover:text-fg",
                    )}
                  >
                    <input
                      type="radio"
                      name={`rubric-${i}`}
                      className="sr-only"
                      checked={scores[i] === v}
                      onChange={() => setScores((s) => s.map((x, j) => (j === i ? v : x)))}
                    />
                    {["не сделано", "слабо", "частично", "хорошо", "отлично"][v]}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ul>
      <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-xl border border-line bg-surface px-5 py-3.5">
        <Check size={16} aria-hidden className={rounded >= 70 ? "text-emerald" : "text-fg-dim"} />
        <span className="text-sm text-fg-muted">
          Итог самооценки: <span className="mono tabular text-lg font-semibold text-fg">{rounded}</span> / 100
          {rounded >= 70 ? " — проект можно считать выполненным." : " — до зачёта нужно 70."}
        </span>
      </div>
    </div>
  );
}
