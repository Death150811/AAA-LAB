"use client";

import { CornerDownLeft, FileCode2, GraduationCap, HelpCircle, Layers, Lightbulb, MessagesSquare, Search, Target } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { KIND_LABEL, type SearchEntry, type SearchKind } from "@/lib/search-types";
import { useUIStore } from "@/store/ui-store";
import { useUserStore } from "@/store/user-store";
import { cn } from "@/lib/cn";

type Searcher = (q: string) => SearchEntry[];

let indexPromise: Promise<{ entries: SearchEntry[]; search: Searcher }> | null = null;

const KIND_PENALTY: Record<SearchKind, number> = {
  domain: 0.85,
  topic: 1,
  concept: 1.05,
  project: 1,
  exercise: 1.15,
  interview: 1.15,
  exam: 1.15,
  code: 1.3,
};

/** Загружает индекс один раз. Если Fuse недоступен — простой индексированный поиск по подстроке. */
function loadIndex() {
  indexPromise ??= (async () => {
    const res = await fetch("/search-index.json");
    if (!res.ok) throw new Error("search index unavailable");
    const entries = (await res.json()) as SearchEntry[];

    try {
      const { default: Fuse } = await import("fuse.js");
      const fuse = new Fuse(entries, {
        keys: [
          { name: "title", weight: 3 },
          { name: "tags", weight: 1.6 },
          { name: "context", weight: 0.6 },
          { name: "text", weight: 1 },
        ],
        threshold: 0.34,
        ignoreLocation: true,
        minMatchCharLength: 2,
        includeScore: true,
      });
      const search: Searcher = (q) =>
        fuse
          .search(q, { limit: 60 })
          .map((r) => ({ e: r.item, s: (r.score ?? 1) * KIND_PENALTY[r.item.kind] }))
          .sort((a, b) => a.s - b.s)
          .slice(0, 30)
          .map((r) => r.e);
      return { entries, search };
    } catch {
      const lowered = entries.map((e) => ({ e, hay: `${e.title} ${e.tags.join(" ")} ${e.text}`.toLowerCase() }));
      const search: Searcher = (q) => {
        const needle = q.toLowerCase();
        return lowered
          .filter((x) => x.hay.includes(needle))
          .slice(0, 30)
          .map((x) => x.e);
      };
      return { entries, search };
    }
  })().catch((err) => {
    indexPromise = null; // позволяем повторную попытку при следующем открытии
    throw err;
  });
  return indexPromise;
}

const KIND_ICON: Record<SearchKind, React.ReactNode> = {
  domain: <Layers size={15} />,
  topic: <GraduationCap size={15} />,
  concept: <Lightbulb size={15} />,
  exercise: <Target size={15} />,
  interview: <MessagesSquare size={15} />,
  project: <FileCode2 size={15} />,
  code: <FileCode2 size={15} />,
  exam: <HelpCircle size={15} />,
};

export function CommandPalette() {
  const open = useUIStore((s) => s.searchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  const router = useRouter();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const [query, setQuery] = useState("");
  const [searcher, setSearcher] = useState<Searcher | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [active, setActive] = useState(0);

  const recent = useUserStore((s) => s.recent);
  const bookmarks = useUserStore((s) => s.bookmarks);

  // Глобальные сочетания: Ctrl/Cmd+K и «/»
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey);
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if (isK) {
        e.preventDefault();
        setOpen(!useUIStore.getState().searchOpen);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  // Синхронизация состояния с нативным <dialog>
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      setStatus((s) => (s === "ready" ? s : "loading"));
      loadIndex()
        .then(({ search }) => {
          setSearcher(() => search);
          setStatus("ready");
        })
        .catch(() => setStatus("error"));
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Закрываем при навигации
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  const results = useMemo<SearchEntry[]>(
    () => (searcher && query.trim().length >= 2 ? searcher(query.trim()) : []),
    [query, searcher],
  );

  const quick = useMemo(() => {
    const items: { id: string; title: string; href: string; hint: string }[] = [];
    for (const r of recent.slice(0, 5)) items.push({ id: `r:${r.id}`, title: r.title, href: r.href, hint: "Недавнее" });
    for (const b of bookmarks.slice(0, 4)) items.push({ id: `b:${b.id}`, title: b.title, href: b.href, hint: "Закладка" });
    return items;
  }, [recent, bookmarks]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router, setOpen],
  );

  const list: { id: string; title: string; href: string; hint: string; kind?: SearchKind; context?: string; text?: string }[] =
    query.trim().length >= 2
      ? results.map((r) => ({ id: r.id, title: r.title, href: r.href, hint: KIND_LABEL[r.kind], kind: r.kind, context: r.context, text: r.text }))
      : quick;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(list.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      const item = list[active];
      if (item) {
        e.preventDefault();
        go(item.href);
      }
    }
  }

  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  return (
    <dialog
      ref={dialogRef}
      onClose={() => {
        setOpen(false);
        setQuery("");
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) setOpen(false);
      }}
      aria-label="Поиск по платформе"
      className="m-auto mt-[10vh] w-[min(42rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-line-strong bg-surface p-0 text-fg shadow-[0_24px_80px_-12px_rgb(0_0_0/0.7)] backdrop:bg-black/60 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search size={17} className="shrink-0 text-fg-dim" aria-hidden />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={list.length > 0}
          aria-controls={listId}
          aria-activedescendant={list.length ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          placeholder="Тема, понятие, код, вопрос…"
          className="h-14 min-w-0 flex-1 bg-transparent text-[0.98rem] text-fg outline-none placeholder:text-fg-dim"
        />
        <kbd className="hidden rounded border border-line-strong px-1.5 py-0.5 font-mono text-[10px] text-fg-dim sm:block">Esc</kbd>
      </div>

      <div className="max-h-[min(26rem,60vh)] overflow-y-auto p-1.5">
        {status === "error" && (
          <p className="px-3 py-6 text-center text-sm text-rose">Не удалось загрузить поисковый индекс. Попробуйте позже.</p>
        )}
        {status === "loading" && query.trim().length >= 2 && (
          <p className="px-3 py-6 text-center text-sm text-fg-dim">Загрузка индекса…</p>
        )}
        {status === "ready" && query.trim().length >= 2 && results.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-fg-muted">
            Ничего не найдено по запросу «{query.trim()}». Попробуйте другое слово или английский термин.
          </p>
        )}
        {query.trim().length < 2 && quick.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-fg-muted">
            Введите хотя бы два символа. Ищем по темам, понятиям, коду, упражнениям, проектам и вопросам собеседований.
          </p>
        )}
        {query.trim().length < 2 && quick.length > 0 && <p className="eyebrow px-3 pb-1 pt-2">Быстрый переход</p>}

        <ul id={listId} role="listbox" aria-label="Результаты поиска" className="m-0 list-none p-0">
          {list.map((item, i) => (
            <li
              key={item.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => go(item.href)}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5",
                i === active ? "bg-surface-3" : "hover:bg-surface-2",
              )}
            >
              <span className={cn("mt-0.5 shrink-0", i === active ? "text-cyan" : "text-fg-dim")}>
                {item.kind ? KIND_ICON[item.kind] : <CornerDownLeft size={15} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.93rem] font-medium text-fg">{item.title}</span>
                {(item.context || item.text) && (
                  <span className="block truncate text-xs text-fg-dim">{item.context}</span>
                )}
              </span>
              <span className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-dim">
                {item.hint}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between border-t border-line bg-bg-raised px-4 py-2 text-[11px] text-fg-dim">
        <span className="flex items-center gap-3">
          <span><kbd className="font-mono">↑↓</kbd> выбор</span>
          <span><kbd className="font-mono">Enter</kbd> открыть</span>
        </span>
        <span className="hidden sm:inline">Нечёткий поиск · русский и English</span>
      </div>
    </dialog>
  );
}
