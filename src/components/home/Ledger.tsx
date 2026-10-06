"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/store/hydrate";
import { useUserStore } from "@/store/user-store";

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Серия считается живой, если последний день — сегодня или вчера. */
function liveStreak(s: { current: number; lastDay: string | null }, now: Date): number {
  if (!s.lastDay) return 0;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return s.lastDay === dayKey(now) || s.lastDay === dayKey(y) ? s.current : 0;
}

const plural = (n: number, forms: [string, string, string]) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? forms[0] : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? forms[1] : forms[2];
};

/** Личная «ведомость»: продолжить, серия дней, очередь повторения, прогресс. До восстановления состояния показывает нули. */
export function Ledger({ totalTopics, className }: { totalTopics: number; className?: string }) {
  const hydrated = useHydrated();
  const recent = useUserStore((s) => s.recent[0]);
  const streak = useUserStore((s) => s.streak);
  const cards = useUserStore((s) => s.cards);
  const done = useUserStore((s) => Object.keys(s.completedTopics).length);
  const xp = useUserStore((s) => s.xp);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
  }, []);

  const ready = hydrated && now !== null;
  const days = ready ? liveStreak(streak, now) : 0;
  const due = ready ? Object.values(cards).filter((c) => c.due <= now.getTime()).length : 0;
  const pct = ready ? Math.round((done / totalTopics) * 100) : 0;

  const cell = "flex flex-col justify-between gap-5 border-t border-line-strong px-5 py-5 sm:gap-6 sm:px-6 lg:border-l lg:border-t-0";
  const num = "font-display text-[2.6rem] font-light leading-none text-fg tabular";

  return (
    <section aria-label="Ваш путь" className={cn("border-b border-line-strong", className)}>
      <div className="mx-auto grid max-w-[1360px] grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className={cn(cell, "col-span-2 !border-t-0 lg:col-span-1 lg:!border-l-0 lg:!pl-0")}>
          <div className="label text-fg-dim">{recent ? "Продолжить" : "Начало пути"}</div>
          {recent ? (
            <Link href={recent.href} className="group font-display text-[1.45rem] leading-tight text-fg">
              <span className="underline decoration-line-strong decoration-1 underline-offset-[6px] transition-colors group-hover:decoration-accent">{recent.title}</span>
              <ArrowRight size={18} aria-hidden className="ml-2 inline -translate-y-px transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <Link href="/learn/html" className="group font-display text-[1.45rem] leading-tight text-fg">
              <span className="underline decoration-line-strong decoration-1 underline-offset-[6px] transition-colors group-hover:decoration-accent">Первая тема: что такое HTML</span>
              <ArrowRight size={18} aria-hidden className="ml-2 inline -translate-y-px transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
        <div className={cell}>
          <div className="label text-fg-dim">Серия</div>
          <div>
            <span className={num}>{days}</span>
            <span className="ml-2 text-[13px] text-fg-muted">{plural(days, ["день", "дня", "дней"])}<span className="hidden sm:inline"> подряд</span></span>
          </div>
        </div>
        <Link href="/flashcards" className={cn(cell, "group border-l transition-colors hover:bg-surface/60")}>
          <div className="label text-fg-dim">К повторению</div>
          <div>
            <span className={num}>{due}</span>
            <span className="ml-2 text-[13px] text-fg-muted">{due === 0 ? "всё повторено" : plural(due, ["карточка", "карточки", "карточек"])}</span>
          </div>
        </Link>
        <Link href="/me" className={cn(cell, "group col-span-2 transition-colors hover:bg-surface/60 lg:col-span-1")}>
          <div className="label text-fg-dim">Пройдено</div>
          <div>
            <span className={num}>{done}</span>
            <span className="ml-2 text-[13px] text-fg-muted">
              из {totalTopics} · {pct}% · {xp} XP
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
