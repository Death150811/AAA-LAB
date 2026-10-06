"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { Inline } from "@/lib/inline";
import { useNowMinute } from "@/lib/use-now";
import { useHydrated } from "@/store/hydrate";
import { useUserStore } from "@/store/user-store";

export interface CardData {
  id: string;
  front: string;
  back: string;
  topicTitle: string;
  topicHref: string;
  domain: string;
}

const GRADES: { grade: 0 | 1 | 2 | 3; label: string; hint: string; cls: string }[] = [
  { grade: 0, label: "Не помню", hint: "повторить сейчас", cls: "border-rose/40 text-rose hover:bg-rose/10" },
  { grade: 1, label: "Трудно", hint: "скоро", cls: "border-amber/40 text-amber hover:bg-amber/10" },
  { grade: 2, label: "Хорошо", hint: "по графику", cls: "border-accent/40 text-accent-text hover:bg-accent/10" },
  { grade: 3, label: "Легко", hint: "реже", cls: "border-emerald/40 text-emerald hover:bg-emerald/10" },
];

const NEW_PER_SESSION = 15;

export function FlashcardsApp({ cards, domains }: { cards: CardData[]; domains: { id: string; title: string }[] }) {
  const hydrated = useHydrated();
  const state = useUserStore((s) => s.cards);
  const review = useUserStore((s) => s.reviewCard);
  const now = useNowMinute();

  const [domain, setDomain] = useState<string>("all");
  const [queue, setQueue] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const pool = useMemo(() => cards.filter((c) => domain === "all" || c.domain === domain), [cards, domain]);
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const counts = useMemo(() => {
    let fresh = 0;
    let due = 0;
    let learned = 0;
    for (const c of pool) {
      const st = state[c.id];
      if (!st) fresh++;
      else if (st.due <= now) due++;
      else learned++;
    }
    return { fresh, due, learned };
  }, [pool, state, now]);

  function start() {
    const t = Date.now();
    const dueIds = pool.filter((c) => state[c.id] && state[c.id]!.due <= t).map((c) => c.id);
    const newIds = pool.filter((c) => !state[c.id]).slice(0, NEW_PER_SESSION).map((c) => c.id);
    setQueue([...dueIds, ...newIds]);
    setIndex(0);
    setFlipped(false);
    setReviewed(0);
  }

  const current = queue && index < queue.length ? byId.get(queue[index]!) : undefined;
  const finished = queue !== null && index >= queue.length;

  function grade(g: 0 | 1 | 2 | 3) {
    if (!current || !queue) return;
    review(current.id, g);
    setReviewed((n) => n + 1);
    setFlipped(false);
    if (g === 0) {
      // «Не помню» — карточка возвращается в конец текущей сессии
      setQueue([...queue, current.id]);
    }
    setIndex((i) => i + 1);
  }

  // Клавиатура: Space/Enter — перевернуть, 1–4 — оценка
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === " " && !flipped) {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        grade((Number(e.key) - 1) as 0 | 1 | 2 | 3);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, flipped, queue]);

  if (cards.length === 0) {
    return (
      <EmptyState title="Карточек пока нет">
        Карточки создаются вместе с темами курсов: определения, различия, правила и крайние случаи.
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="block text-[13px] text-fg-muted">
          <span className="mb-1.5 block">Курс</span>
          <select
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setQueue(null);
            }}
            className="h-10 rounded-[3px] border border-line-strong bg-surface px-3 text-sm text-fg focus:border-accent/60 focus:outline-none"
          >
            <option value="all">Все курсы</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </label>
        <dl className="m-0 flex gap-6 text-sm">
          {[
            ["Новые", counts.fresh],
            ["К повторению", counts.due],
            ["Выучено (в графике)", counts.learned],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dd className="m-0 text-xl font-semibold tabular text-fg">{hydrated ? v : "—"}</dd>
              <dt className="text-xs text-fg-dim">{k}</dt>
            </div>
          ))}
        </dl>
      </div>

      {queue === null && (
        <div className="rounded-[3px] border border-line bg-surface p-8 text-center">
          <p className="mx-auto max-w-lg text-[0.97rem] leading-relaxed text-fg-muted">
            Карточки закрепляют **определения, различия и правила**, а не заменяют понимание. Сначала попытайтесь
            ответить вслух, затем переверните карточку и честно оцените себя: интервал повторения зависит от оценки.
          </p>
          <button
            type="button"
            onClick={start}
            disabled={counts.fresh + counts.due === 0}
            className="mt-6 h-11 rounded-[3px] border border-accent bg-accent px-6 text-sm font-semibold text-accent-ink transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {counts.fresh + counts.due === 0 ? "На сегодня всё повторено" : "Начать сессию"}
          </button>
        </div>
      )}

      {current && (
        <div>
          <div className="mb-3 flex items-center justify-between text-xs text-fg-dim">
            <span className="mono tabular">
              {Math.min(index + 1, queue!.length)} / {queue!.length}
            </span>
            <Link href={current.topicHref} className="hover:text-fg">
              {current.topicTitle}
            </Link>
          </div>
          <div
            className={cn(
              "min-h-[15rem] rounded-2xl border bg-surface p-8 transition-colors sm:p-10",
              flipped ? "border-accent/40" : "border-line",
            )}
          >
            <div className="eyebrow mb-4">{flipped ? "Ответ" : "Вопрос"}</div>
            <p className="text-[1.3rem] leading-relaxed text-fg">
              <Inline text={flipped ? current.back : current.front} />
            </p>
          </div>

          {!flipped ? (
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="mt-4 h-11 w-full rounded-[3px] border border-line-strong bg-surface-2 text-sm font-medium text-fg hover:bg-surface-3"
            >
              Показать ответ <kbd className="ml-2 font-mono text-[10px] text-fg-dim">Space</kbd>
            </button>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADES.map((g) => (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => grade(g.grade)}
                  className={cn("rounded-[3px] border px-3 py-2.5 text-sm font-medium transition-transform active:scale-[0.97]", g.cls)}
                >
                  {g.label}
                  <span className="mt-0.5 block text-[11px] font-normal opacity-70">
                    {g.hint} · {g.grade + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {finished && (
        <div className="rounded-[3px] border border-emerald/30 bg-emerald/[0.05] p-8 text-center">
          <p className="text-lg font-semibold text-fg">Сессия завершена</p>
          <p className="mt-1 text-sm text-fg-muted">Оценено карточек: {reviewed}. Следующее повторение — по графику.</p>
          <button
            type="button"
            onClick={() => setQueue(null)}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-[3px] border border-line-strong bg-surface-2 px-4 text-sm text-fg hover:bg-surface-3"
          >
            <RotateCcw size={14} aria-hidden /> К началу
          </button>
        </div>
      )}
    </div>
  );
}
