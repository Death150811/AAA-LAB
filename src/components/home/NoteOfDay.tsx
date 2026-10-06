"use client";

import { ArrowUpRight, Check, NotebookPen, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { dayNumber, type Lore, type LoreKind } from "@/content/lore";
import { cn } from "@/lib/cn";
import { useUserStore } from "@/store/user-store";

const KIND_LABEL: Record<LoreKind, string> = {
  quote: "Цитата",
  law: "Закон",
  fact: "Факт",
  folklore: "Фольклор",
  attributed: "Приписывается",
};

export interface NoteTopic {
  id: string;
  title: string;
  href: string;
}

interface Props {
  pool: Lore[];
  /** Темы, на которые ссылаются заметки: id → заголовок и адрес. */
  topics: Record<string, NoteTopic>;
  variant?: "wide" | "compact";
  className?: string;
}

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

/** «Заметка дня»: одна на сутки (по местной дате), «Ещё» листает дальше, «В заметки» кладёт в личные заметки. */
export function NoteOfDay({ pool, topics, variant = "wide", className }: Props) {
  const [shift, setShift] = useState(0);
  const [today, setToday] = useState<Date | null>(null);
  const [saved, setSaved] = useState(false);
  const saveNote = useUserStore((s) => s.saveNote);

  useEffect(() => {
    // Дата известна только в браузере: до монтирования показана первая заметка.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(new Date());
  }, []);

  const day = today ? dayNumber(today) : 0;
  const index = (day + shift) % pool.length;
  const lore = pool[index]!;
  const topic = lore.topic ? topics[lore.topic] : undefined;
  const wide = variant === "wide";

  const save = () => {
    saveNote({
      topicId: topic?.id ?? null,
      title: `${KIND_LABEL[lore.kind]}: ${lore.text.slice(0, 48)}${lore.text.length > 48 ? "…" : ""}`,
      body: `${lore.text}\n\n${lore.ru}\n\n— ${[lore.author, lore.source].filter(Boolean).join(", ")}`.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section aria-label="Заметка дня" className={cn("relative border-y border-line-strong", className)}>
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
        <div className={cn("grid gap-x-12 gap-y-6 py-9 lg:grid-cols-[13rem_minmax(0,1fr)]", wide ? "lg:py-12" : "lg:py-9")}>
          <header className="flex items-start justify-between gap-4 lg:flex-col lg:justify-start lg:gap-5">
            <div>
              <div className="eyebrow text-accent-text">Заметка дня</div>
              <div className="mt-2 font-display text-[1.35rem] leading-none text-fg tabular" style={{ minHeight: "1.35rem" }}>
                {today ? `${today.getDate()} ${MONTHS[today.getMonth()]}` : " "}
              </div>
              <div className="label mt-3 text-fg-dim">
                <span className="tabular">№ {index + 1}</span> из {pool.length}
              </div>
            </div>
            <div className="flex gap-2 lg:flex-col lg:items-start">
              <button
                type="button"
                onClick={() => setShift((s) => s + 1)}
                className="group inline-flex h-9 items-center gap-2 border border-line-strong px-3 text-[12.5px] text-fg-muted transition-colors hover:border-accent hover:text-fg"
              >
                <RefreshCw size={13} aria-hidden className="transition-transform duration-500 group-hover:rotate-180" /> Ещё
              </button>
              <button
                type="button"
                onClick={save}
                className="inline-flex h-9 items-center gap-2 border border-line-strong px-3 text-[12.5px] text-fg-muted transition-colors hover:border-accent hover:text-fg"
              >
                {saved ? <Check size={13} aria-hidden className="text-emerald" /> : <NotebookPen size={13} aria-hidden />} {saved ? "Сохранено" : "В заметки"}
              </button>
            </div>
          </header>

          {/* Видна и без JS (по умолчанию — первая заметка); после определения даты плавно сменяется заметкой дня. */}
          <figure className={cn("relative m-0", today && "animate-fade-up")} key={lore.id} aria-live="polite">
            <span aria-hidden className="pointer-events-none absolute -left-1 -top-7 select-none font-display text-[5.5rem] leading-none text-accent-text/35 lg:-left-9">
              “
            </span>
            <blockquote className="m-0">
              <p
                className={cn(
                  "m-0 font-display font-light italic leading-[1.18] tracking-[-0.01em] text-fg",
                  wide ? "text-[1.7rem] sm:text-[2.15rem]" : "text-[1.4rem] sm:text-[1.7rem]",
                )}
                lang="en"
              >
                {lore.text}
              </p>
              <p className="mt-4 max-w-3xl font-serif text-[0.98rem] leading-relaxed text-fg-muted">{lore.ru}</p>
            </blockquote>
            <figcaption className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px]">
              <span className="label border border-accent/50 px-2 py-1 text-accent-text">{KIND_LABEL[lore.kind]}</span>
              {lore.author && <span className="font-medium text-fg">{lore.author}</span>}
              {lore.source && <span className="text-fg-dim">{lore.source}</span>}
              {topic && (
                <Link href={topic.href} className="ml-auto inline-flex items-center gap-1.5 text-accent-text hover:underline">
                  Разобрать: {topic.title} <ArrowUpRight size={14} aria-hidden />
                </Link>
              )}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
