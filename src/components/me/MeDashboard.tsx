"use client";

import { Download, Flame, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { ACCENT, EmptyState, ProgressBar } from "@/components/ui/primitives";
import type { Accent } from "@/content/types";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/store/hydrate";
import { useUserStore } from "@/store/user-store";

export interface DomainSummary {
  id: string;
  slug: string;
  title: string;
  accent: Accent;
  topics: { id: string; title: string; href: string }[];
  projects: number;
}

export function MeDashboard({
  domains,
  topicIndex,
}: {
  domains: DomainSummary[];
  topicIndex: Record<string, { title: string; href: string }>;
}) {
  const hydrated = useHydrated();
  const s = useUserStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!hydrated) {
    return <p className="py-16 text-center text-sm text-fg-dim">Загрузка личных данных…</p>;
  }

  const attempts = s.attempts.filter((a) => a.correct !== null);
  const correct = attempts.filter((a) => a.correct).length;
  const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : null;
  const topicsDone = Object.keys(s.completedTopics).length;
  const projectsDone = Object.keys(s.completedProjects).length;
  const totalTopics = domains.reduce((n, d) => n + d.topics.length, 0);

  function exportData() {
    const data = {
      app: "devdock-ultra",
      version: 1,
      exportedAt: new Date().toISOString(),
      state: {
        completedTopics: s.completedTopics,
        completedProjects: s.completedProjects,
        projectChecks: s.projectChecks,
        xp: s.xp,
        streak: s.streak,
        bookmarks: s.bookmarks,
        notes: s.notes,
        snippets: s.snippets,
        recent: s.recent,
        attempts: s.attempts,
        cards: s.cards,
      },
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `devdock-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as { app?: string; state?: Record<string, unknown> };
      if (parsed.app !== "devdock-ultra" || typeof parsed.state !== "object" || !parsed.state) throw new Error("format");
      const st = parsed.state;
      useUserStore.getState().importState(st);
      setMessage("Данные импортированы.");
    } catch {
      setMessage("Не удалось импортировать: файл не похож на резервную копию DevDock.");
    }
  }

  return (
    <div className="space-y-12">
      {/* Сводка */}
      <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-5">
        {[
          ["Изучено тем", `${topicsDone}/${totalTopics}`],
          ["Проектов", String(projectsDone)],
          ["Точность ответов", accuracy === null ? "—" : `${accuracy}%`],
          ["Опыт (XP)", String(s.xp)],
          ["Серия дней", String(s.streak.current)],
        ].map(([k, v], i) => (
          <div key={k} className="bg-surface px-5 py-4">
            <dd className="m-0 flex items-center gap-2 text-2xl font-semibold tabular text-fg">
              {v}
              {i === 4 && s.streak.current > 0 && <Flame size={16} className="text-amber" aria-hidden />}
            </dd>
            <dt className="mt-0.5 text-xs text-fg-dim">{k}</dt>
          </div>
        ))}
      </dl>

      {/* Прогресс по доменам */}
      <section aria-labelledby="progress">
        <h2 id="progress" className="eyebrow mb-4">
          Прогресс по курсам
        </h2>
        <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
          {domains.map((d) => {
            const done = d.topics.filter((t) => s.completedTopics[t.id]).length;
            const a = ACCENT[d.accent];
            return (
              <li key={d.id}>
                <Link href={`/learn/${d.slug}`} className="block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong">
                  <div className="flex items-baseline justify-between">
                    <span className={cn("font-semibold", a.text)}>{d.title}</span>
                    <span className="mono text-xs text-fg-dim tabular">{d.topics.length ? `${done}/${d.topics.length} тем` : "курс готовится"}</span>
                  </div>
                  <ProgressBar value={d.topics.length ? done / d.topics.length : 0} accent={d.accent} label={`Прогресс: ${d.title}`} className="mt-3" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Недавнее и закладки */}
      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="recent">
          <h2 id="recent" className="eyebrow mb-4">
            Недавно просмотренное
          </h2>
          {s.recent.length === 0 ? (
            <EmptyState title="Пока ничего">Откройте любую тему — она появится здесь.</EmptyState>
          ) : (
            <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0">
              {s.recent.slice(0, 8).map((r) => (
                <li key={r.id}>
                  <Link href={r.href} className="block px-4 py-2.5 text-[0.93rem] text-fg-muted hover:text-fg">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="bookmarks">
          <h2 id="bookmarks" className="eyebrow mb-4">
            Закладки
          </h2>
          {s.bookmarks.length === 0 ? (
            <EmptyState title="Закладок нет">Нажмите «В закладки» на странице темы.</EmptyState>
          ) : (
            <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0">
              {s.bookmarks.map((b) => (
                <li key={b.id} className="flex items-center gap-2 px-4">
                  <Link href={b.href} className="min-w-0 flex-1 truncate py-2.5 text-[0.93rem] text-fg-muted hover:text-fg">
                    {b.title}
                  </Link>
                  <button type="button" onClick={() => s.toggleBookmark(b)} aria-label={`Убрать закладку «${b.title}»`} className="text-fg-dim hover:text-rose">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Заметки */}
      <section aria-labelledby="notes">
        <h2 id="notes" className="eyebrow mb-4">
          Заметки
        </h2>
        {s.notes.length === 0 ? (
          <EmptyState title="Заметок пока нет">Заметку можно оставить к любой теме — поле находится рядом с текстом.</EmptyState>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
            {s.notes.map((n) => {
              const t = n.topicId ? topicIndex[n.topicId] : undefined;
              return (
                <li key={n.id} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    {t ? (
                      <Link href={t.href} className="text-sm font-medium text-fg hover:text-cyan">
                        {t.title}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-fg">{n.title}</span>
                    )}
                    <button type="button" onClick={() => s.deleteNote(n.id)} aria-label="Удалить заметку" className="shrink-0 text-fg-dim hover:text-rose">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-[0.9rem] leading-relaxed text-fg-muted">{n.body}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* История практики */}
      <section aria-labelledby="history">
        <h2 id="history" className="eyebrow mb-4">
          История практики
        </h2>
        {s.attempts.length === 0 ? (
          <EmptyState title="Ответов пока нет">Решайте упражнения и вопросы — результаты появятся здесь.</EmptyState>
        ) : (
          <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0">
            {s.attempts.slice(0, 12).map((a) => {
              const t = a.topicId ? topicIndex[a.topicId] : undefined;
              const label = a.correct === true ? "Верно" : a.correct === false ? "Неверно" : "Частично";
              return (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-[0.9rem]">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", a.correct === true ? "bg-emerald" : a.correct === false ? "bg-rose" : "bg-amber")} role="img" aria-label={label} />
                  <span className="min-w-0 flex-1 truncate text-fg-muted">{t ? t.title : a.ref}</span>
                  <time className="mono shrink-0 text-[11px] text-fg-dim" dateTime={new Date(a.at).toISOString()}>
                    {new Date(a.at).toLocaleDateString("ru-RU")}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Данные */}
      <section aria-labelledby="data" className="rounded-xl border border-line bg-surface p-5">
        <h2 id="data" className="eyebrow mb-2">
          Ваши данные
        </h2>
        <p className="text-sm leading-relaxed text-fg-muted">
          Всё хранится только в вашем браузере (localStorage). Сделайте резервную копию, если хотите перенести прогресс на другое устройство.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={exportData} className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-surface-2 px-3.5 text-[13px] text-fg hover:bg-surface-3">
            <Download size={14} aria-hidden /> Экспорт
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-surface-2 px-3.5 text-[13px] text-fg hover:bg-surface-3">
            <Upload size={14} aria-hidden /> Импорт
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="sr-only"
            aria-label="Файл резервной копии"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importData(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Удалить весь прогресс, заметки и закладки? Это нельзя отменить.")) {
                s.reset();
                setMessage("Данные удалены.");
              }
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose/40 px-3.5 text-[13px] text-rose hover:bg-rose/10"
          >
            <Trash2 size={14} aria-hidden /> Сбросить всё
          </button>
        </div>
        {message && (
          <p role="status" className="mt-3 text-sm text-fg-muted">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
