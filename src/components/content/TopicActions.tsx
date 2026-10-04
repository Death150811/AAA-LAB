"use client";

import { Bookmark, BookmarkCheck, Check, CircleDashed, CircleCheck, NotebookPen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useHydrated } from "@/store/hydrate";
import { useUserStore } from "@/store/user-store";
import { cn } from "@/lib/cn";

/** Фиксирует просмотр темы (раздел «недавнее»). */
export function TopicTracker({ id, title, href }: { id: string; title: string; href: string }) {
  const visit = useUserStore((s) => s.visit);
  useEffect(() => {
    // Ждём гидратации: иначе перезапись восстановленных данных пустым состоянием.
    const t = setTimeout(() => visit({ id, title, href }), 400);
    return () => clearTimeout(t);
  }, [id, title, href, visit]);
  return null;
}

export function CompleteButton({ topicId, className }: { topicId: string; className?: string }) {
  const done = useUserStore((s) => !!s.completedTopics[topicId]);
  const toggle = useUserStore((s) => s.toggleTopic);
  const hydrated = useHydrated();
  const on = hydrated && done;
  return (
    <button
      type="button"
      onClick={() => toggle(topicId)}
      aria-pressed={on}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-[13px] font-medium transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97]",
        on
          ? "border-emerald/50 bg-emerald/10 text-emerald"
          : "border-line-strong bg-surface-2 text-fg hover:border-steel/60 hover:bg-surface-3",
        className,
      )}
    >
      {on ? <CircleCheck size={15} aria-hidden /> : <CircleDashed size={15} aria-hidden />}
      {on ? "Тема изучена" : "Отметить изученной"}
    </button>
  );
}

export function BookmarkButton({
  kind,
  refId,
  title,
  href,
}: {
  kind: "topic" | "project" | "interview" | "exercise";
  refId: string;
  title: string;
  href: string;
}) {
  const id = `${kind}:${refId}`;
  const on = useUserStore((s) => s.bookmarks.some((b) => b.id === id));
  const toggle = useUserStore((s) => s.toggleBookmark);
  const hydrated = useHydrated();
  const active = hydrated && on;
  return (
    <button
      type="button"
      onClick={() => toggle({ id, kind, ref: refId, title, href })}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97]",
        active
          ? "border-cyan/50 bg-cyan/10 text-cyan"
          : "border-line-strong bg-surface-2 text-fg-muted hover:border-steel/60 hover:text-fg",
      )}
    >
      {active ? <BookmarkCheck size={15} aria-hidden /> : <Bookmark size={15} aria-hidden />}
      {active ? "В закладках" : "В закладки"}
    </button>
  );
}

export function PrereqStatus({ items }: { items: { id: string; title: string; href: string }[] }) {
  const completed = useUserStore((s) => s.completedTopics);
  const hydrated = useHydrated();
  return (
    <ul className="m-0 list-none space-y-1.5 p-0">
      {items.map((p) => {
        const ok = hydrated && !!completed[p.id];
        return (
          <li key={p.id}>
            <Link
              href={p.href}
              className="flex items-start gap-2 rounded-md px-1 py-1 text-[13px] leading-snug text-fg-muted hover:text-fg"
            >
              {ok ? (
                <Check size={14} aria-label="Изучено" className="mt-0.5 shrink-0 text-emerald" />
              ) : (
                <CircleDashed size={14} aria-label="Не изучено" className="mt-0.5 shrink-0 text-amber" />
              )}
              <span>{p.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Персональная заметка к теме. Сохраняется локально. */
export function TopicNotes({ topicId, topicTitle }: { topicId: string; topicTitle: string }) {
  const notes = useUserStore((s) => s.notes);
  const save = useUserStore((s) => s.saveNote);
  const hydrated = useHydrated();
  const existing = notes.find((n) => n.topicId === topicId);
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const value = draft ?? (hydrated ? (existing?.body ?? "") : "");

  function commit() {
    if (draft === null) return;
    if (draft.trim() === "" && !existing) return;
    save({ id: existing?.id, topicId, title: topicTitle, body: draft });
    setDraft(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div>
      <label htmlFor={`note-${topicId}`} className="mb-1.5 flex items-center gap-2 text-[13px] text-fg-muted">
        <NotebookPen size={14} aria-hidden />
        Заметка к теме
        {saved && <span className="ml-auto text-emerald">сохранено</span>}
      </label>
      <textarea
        id={`note-${topicId}`}
        value={value}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        rows={4}
        placeholder="Что стоит запомнить? Сохраняется локально в браузере."
        className="w-full resize-y rounded-lg border border-line bg-bg-raised px-3 py-2 text-[13px] leading-relaxed text-fg placeholder:text-fg-dim focus:border-cyan/60 focus:outline-none"
      />
    </div>
  );
}
