"use client";

import { Check, RotateCcw, X } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import type { DomainId, McqQuestion, OpenQuestion, QuizQuestion } from "@/content/types";
import { DIFFICULTY_LABEL } from "@/content/sections";
import { cn } from "@/lib/cn";
import { Inline } from "@/lib/inline";
import { useUserStore } from "@/store/user-store";
import { Badge } from "@/components/ui/primitives";

export interface QuizItem {
  question: QuizQuestion;
  /** Серверно-подсвеченный код вопроса. */
  codeNode?: ReactNode;
  /** Серверно-отрисованный эталонный ответ (для открытых вопросов). */
  answerNode?: ReactNode;
  topicId: string | null;
  domain: DomainId;
  /** Подпись источника вопроса (название темы) — для экзаменов. */
  source?: string;
}

const FORMAT_LABEL: Record<string, string> = {
  concept: "Концепция",
  "code-analysis": "Анализ кода",
  output: "Вывод программы",
  debug: "Отладка",
  architecture: "Архитектура",
  sql: "SQL",
};

type Result = boolean | null;

export function QuizRunner({
  items,
  onComplete,
  completeLabel,
}: {
  items: QuizItem[];
  /** Вызывается из итоговой панели, если набрано достаточно баллов. */
  onComplete?: () => void;
  completeLabel?: string;
}) {
  const [results, setResults] = useState<Record<string, Result>>({});
  const answered = Object.keys(results).length;
  const correct = Object.values(results).filter((r) => r === true).length;
  const total = items.length;
  const pct = total ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <QuestionCard
          key={item.question.id}
          index={i + 1}
          item={item}
          onResult={(r) => setResults((prev) => ({ ...prev, [item.question.id]: r }))}
          onReset={() =>
            setResults((prev) => {
              const next = { ...prev };
              delete next[item.question.id];
              return next;
            })
          }
        />
      ))}

      {total > 1 && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-line bg-surface px-5 py-4"
        >
          <div>
            <div className="eyebrow">Итог</div>
            <div className="mt-1.5 text-sm text-fg-muted">
              Отвечено {answered} из {total}
              {answered > 0 && (
                <>
                  {" · "}
                  <span className={cn("font-medium tabular", pct >= 70 ? "text-emerald" : "text-fg")}>
                    верно {correct} ({pct}%)
                  </span>
                </>
              )}
            </div>
          </div>
          {onComplete && answered === total && pct >= 70 && (
            <button
              type="button"
              onClick={onComplete}
              className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-emerald/50 bg-emerald/10 px-3.5 text-[13px] font-medium text-emerald transition-transform active:scale-[0.97]"
            >
              <Check size={15} aria-hidden />
              {completeLabel ?? "Отметить тему изученной"}
            </button>
          )}
          {onComplete && answered === total && pct < 70 && (
            <p className="max-w-sm text-[13px] text-fg-muted">
              Порог — 70%. Вернитесь к разделам, где ошиблись, и попробуйте ещё раз: объяснения под каждым вопросом
              подскажут, что перечитать.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  index,
  item,
  onResult,
  onReset,
}: {
  index: number;
  item: QuizItem;
  onResult: (r: Result) => void;
  onReset: () => void;
}) {
  const q = item.question;
  return (
    <article className="rounded-[3px] border border-line bg-surface/70 p-4 sm:p-5">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mono text-xs text-fg-dim tabular">№ {index}</span>
        <Badge tone={q.difficulty === "advanced" ? "rose" : q.difficulty === "intermediate" ? "amber" : "emerald"}>
          {DIFFICULTY_LABEL[q.difficulty]}
        </Badge>
        <Badge>{FORMAT_LABEL[q.format] ?? q.format}</Badge>
        {item.source && <span className="ml-auto truncate text-xs text-fg-dim">{item.source}</span>}
      </header>
      {q.type === "mcq" ? (
        <McqCard q={q} item={item} onResult={onResult} onReset={onReset} />
      ) : (
        <OpenCard q={q} item={item} onResult={onResult} onReset={onReset} />
      )}
    </article>
  );
}

function McqCard({
  q,
  item,
  onResult,
  onReset,
}: {
  q: McqQuestion;
  item: QuizItem;
  onResult: (r: Result) => void;
  onReset: () => void;
}) {
  const name = useId();
  const multi = q.correct.length > 1;
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const record = useUserStore((s) => s.recordAttempt);

  const isRight = checked && picked.length === q.correct.length && picked.every((p) => q.correct.includes(p));

  function check() {
    if (!picked.length) return;
    setChecked(true);
    const right = picked.length === q.correct.length && picked.every((p) => q.correct.includes(p));
    onResult(right);
    record({ ref: q.id, topicId: item.topicId, domain: item.domain, correct: right });
  }

  function reset() {
    setPicked([]);
    setChecked(false);
    onReset();
  }

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-3 p-0 text-[1.02rem] font-medium leading-relaxed text-fg">
        <Inline text={q.prompt} />
        {multi && <span className="ml-2 text-xs font-normal text-fg-dim">(выберите все верные)</span>}
      </legend>
      {item.codeNode && <div className="mb-3">{item.codeNode}</div>}
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const selected = picked.includes(i);
          const correct = q.correct.includes(i);
          const state = !checked ? "idle" : correct ? "right" : selected ? "wrong" : "idle";
          return (
            <label
              key={i}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-[3px] border px-3.5 py-2.5 text-[0.95rem] leading-relaxed transition-colors",
                checked && "cursor-default",
                state === "right" && "border-emerald/50 bg-emerald/[0.07]",
                state === "wrong" && "border-rose/50 bg-rose/[0.07]",
                state === "idle" && (selected ? "border-accent/50 bg-accent/[0.06]" : "border-line hover:border-line-strong hover:bg-surface-2"),
              )}
            >
              <input
                type={multi ? "checkbox" : "radio"}
                name={name}
                checked={selected}
                disabled={checked}
                onChange={() =>
                  setPicked((p) => (multi ? (selected ? p.filter((x) => x !== i) : [...p, i]) : [i]))
                }
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
              />
              <span className="min-w-0 flex-1">
                <Inline text={opt} />
              </span>
              {checked && correct && <Check size={16} aria-label="Верный вариант" className="mt-1 shrink-0 text-emerald" />}
              {checked && !correct && selected && <X size={16} aria-label="Неверный вариант" className="mt-1 shrink-0 text-rose" />}
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!checked ? (
          <button
            type="button"
            onClick={check}
            disabled={!picked.length}
            className="h-9 rounded-[3px] border border-accent bg-accent px-4 text-[13px] font-semibold text-accent-ink transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Проверить
          </button>
        ) : (
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-line-strong bg-surface-2 px-3.5 text-[13px] text-fg-muted hover:text-fg"
          >
            <RotateCcw size={14} aria-hidden />
            Ещё раз
          </button>
        )}
      </div>

      {checked && (
        <div
          role="status"
          className={cn(
            "mt-4 rounded-[3px] border px-4 py-3 text-[0.94rem] leading-relaxed",
            isRight ? "border-emerald/30 bg-emerald/[0.05]" : "border-amber/30 bg-amber/[0.05]",
          )}
        >
          <div className={cn("mb-1 text-[13px] font-semibold", isRight ? "text-emerald" : "text-amber")}>
            {isRight ? "Верно" : "Не совсем"}
          </div>
          <div className="text-fg-body">
            <Inline text={q.explanation} />
          </div>
        </div>
      )}
    </fieldset>
  );
}

function OpenCard({
  q,
  item,
  onResult,
  onReset,
}: {
  q: OpenQuestion;
  item: QuizItem;
  onResult: (r: Result) => void;
  onReset: () => void;
}) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const [rated, setRated] = useState<null | "ok" | "partial" | "no">(null);
  const record = useUserStore((s) => s.recordAttempt);

  function rate(v: "ok" | "partial" | "no") {
    setRated(v);
    const r: Result = v === "ok" ? true : v === "no" ? false : null;
    onResult(r);
    record({ ref: q.id, topicId: item.topicId, domain: item.domain, correct: r });
  }

  return (
    <div>
      <p className="mb-3 text-[1.02rem] font-medium leading-relaxed text-fg">
        <Inline text={q.prompt} />
      </p>
      {item.codeNode && <div className="mb-3">{item.codeNode}</div>}
      <label htmlFor={id} className="sr-only">
        Ваш ответ
      </label>
      <textarea
        id={id}
        rows={4}
        placeholder="Сформулируйте ответ своими словами, прежде чем смотреть эталон. Текст нигде не сохраняется."
        className="w-full resize-y rounded-[3px] border border-line bg-bg-raised px-3 py-2.5 text-[0.93rem] leading-relaxed text-fg placeholder:text-fg-dim focus:border-accent/60 focus:outline-none"
      />
      {!shown ? (
        <button
          type="button"
          onClick={() => setShown(true)}
          className="mt-3 h-9 rounded-[3px] border border-line-strong bg-surface-2 px-4 text-[13px] font-medium text-fg hover:bg-surface-3"
        >
          Показать эталонный ответ
        </button>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="doc rounded-[3px] border border-line bg-bg-raised/60 p-4 !text-[0.97rem]">{item.answerNode}</div>
          <div>
            <div className="eyebrow mb-2">Критерии самооценки</div>
            <ul className="m-0 list-none space-y-1.5 p-0">
              {q.rubric.map((r, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer items-start gap-2.5 text-[0.92rem] leading-relaxed text-fg-muted">
                    <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]" />
                    <span>{r}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          {rated === null ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-fg-muted">Мой ответ был:</span>
              <button type="button" onClick={() => rate("ok")} className="h-8 rounded-md border border-emerald/40 px-3 text-[13px] text-emerald hover:bg-emerald/10">
                Полным
              </button>
              <button type="button" onClick={() => rate("partial")} className="h-8 rounded-md border border-amber/40 px-3 text-[13px] text-amber hover:bg-amber/10">
                Частичным
              </button>
              <button type="button" onClick={() => rate("no")} className="h-8 rounded-md border border-rose/40 px-3 text-[13px] text-rose hover:bg-rose/10">
                Неверным
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setRated(null);
                setShown(false);
                onReset();
              }}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-line-strong px-3 text-[13px] text-fg-muted hover:text-fg"
            >
              <RotateCcw size={13} aria-hidden />
              Ещё раз
            </button>
          )}
        </div>
      )}
    </div>
  );
}
