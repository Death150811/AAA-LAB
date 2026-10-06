"use client";

import { Check, Eye, Lightbulb } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { DomainId, Difficulty } from "@/content/types";
import { DIFFICULTY_LABEL, PRACTICE_KIND_LABEL } from "@/content/sections";
import { cn } from "@/lib/cn";
import { Inline } from "@/lib/inline";
import { useUserStore } from "@/store/user-store";
import { Badge } from "@/components/ui/primitives";

interface Props {
  id: string;
  title: string;
  kind: keyof typeof PRACTICE_KIND_LABEL;
  difficulty: Difficulty;
  topicId: string;
  domain: DomainId;
  hints: string[];
  checks: string[];
  promptNode: ReactNode;
  starterNode?: ReactNode;
  solutionNode: ReactNode;
  index: number;
}

export function ExerciseCard({ id, title, kind, difficulty, topicId, domain, hints, checks, promptNode, starterNode, solutionNode, index }: Props) {
  const [hintCount, setHintCount] = useState(0);
  const [solution, setSolution] = useState(false);
  const [ticked, setTicked] = useState<boolean[]>(() => checks.map(() => false));
  const solved = useUserStore((s) => s.attempts.some((a) => a.ref === id && a.correct === true));
  const record = useUserStore((s) => s.recordAttempt);

  return (
    <article id={id} className="scroll-mt-24 rounded-xl border border-line bg-surface/70 p-4 sm:p-5">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mono text-xs text-fg-dim tabular">Задание {index}</span>
        <Badge tone={difficulty === "advanced" ? "rose" : difficulty === "intermediate" ? "amber" : "emerald"}>
          {DIFFICULTY_LABEL[difficulty]}
        </Badge>
        <Badge tone="indigo">{PRACTICE_KIND_LABEL[kind]}</Badge>
        {solved && (
          <Badge tone="emerald">
            <Check size={10} aria-hidden /> решено
          </Badge>
        )}
      </header>
      <h3 className="mb-3 text-[1.05rem] font-semibold tracking-tight text-fg">{title}</h3>
      <div className="doc !text-[1rem] space-y-3">{promptNode}</div>
      {starterNode && (
        <div className="mt-4">
          <div className="eyebrow mb-2">Заготовка</div>
          {starterNode}
        </div>
      )}

      {checks.length > 0 && (
        <div className="mt-5">
          <div className="eyebrow mb-2">Критерии самопроверки</div>
          <ul className="m-0 list-none space-y-1.5 p-0">
            {checks.map((c, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-2.5 text-[0.92rem] leading-relaxed text-fg-muted">
                  <input
                    type="checkbox"
                    checked={ticked[i]}
                    onChange={(e) => setTicked((t) => t.map((v, j) => (j === i ? e.target.checked : v)))}
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                  />
                  <span>
                    <Inline text={c} />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hintCount > 0 && (
        <ol className="m-0 mt-4 list-none space-y-2 p-0">
          {hints.slice(0, hintCount).map((h, i) => (
            <li key={i} className="flex gap-2.5 rounded-lg border border-amber/25 bg-amber/[0.05] px-3.5 py-2.5 text-[0.93rem] leading-relaxed text-fg-muted">
              <Lightbulb size={15} aria-hidden className="mt-1 shrink-0 text-amber" />
              <span>
                <span className="mr-1.5 font-semibold text-amber">Подсказка {i + 1}.</span>
                <Inline text={h} />
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {hintCount < hints.length && (
          <button
            type="button"
            onClick={() => setHintCount((n) => n + 1)}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-line-strong bg-surface-2 px-3 text-[13px] text-fg-muted hover:text-fg"
          >
            <Lightbulb size={14} aria-hidden />
            Подсказка {hintCount + 1} из {hints.length}
          </button>
        )}
        <button
          type="button"
          onClick={() => setSolution((v) => !v)}
          aria-expanded={solution}
          className="inline-flex h-8 items-center gap-2 rounded-md border border-line-strong bg-surface-2 px-3 text-[13px] text-fg-muted hover:text-fg"
        >
          <Eye size={14} aria-hidden />
          {solution ? "Скрыть решение" : "Показать решение"}
        </button>
        <button
          type="button"
          onClick={() => record({ ref: id, topicId, domain, correct: true })}
          disabled={solved}
          className={cn(
            "ml-auto inline-flex h-8 items-center gap-2 rounded-md border px-3 text-[13px] transition-colors",
            solved ? "border-emerald/40 text-emerald" : "border-accent/40 text-accent-text hover:bg-accent/10",
          )}
        >
          <Check size={14} aria-hidden />
          {solved ? "Решено" : "Я решил(а)"}
        </button>
      </div>

      {solution && (
        <div className="mt-4 rounded-lg border border-line bg-bg-raised/60 p-4">
          <div className="eyebrow mb-3">Решение</div>
          <div className="doc !text-[0.98rem] space-y-3">{solutionNode}</div>
        </div>
      )}
    </article>
  );
}
