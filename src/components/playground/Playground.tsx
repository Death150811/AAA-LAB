"use client";

import { BookmarkPlus, Check, Link2, Play, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXAMPLES } from "@/content/playground-examples";
import { cn } from "@/lib/cn";
import { buildSrcDoc, decodeHash, encodeHash, type PlaygroundSource } from "@/lib/playground";
import { readLocal, writeLocal } from "@/store/storage";
import { useUserStore } from "@/store/user-store";

type Tab = "html" | "css" | "js";
interface LogLine {
  id: number;
  level: "log" | "info" | "warn" | "error" | "debug";
  text: string;
}

const STORAGE_KEY = "devdock-playground-v1";
const MAX_LOG = 500;
const TAB_LABEL: Record<Tab, string> = { html: "HTML", css: "CSS", js: "JavaScript" };
const LEVELS = ["log", "info", "warn", "error", "debug"];
const LEVEL_STYLE: Record<LogLine["level"], string> = {
  log: "text-fg",
  info: "text-accent-text",
  debug: "text-fg-muted",
  warn: "text-amber",
  error: "text-rose",
};

const EMPTY: PlaygroundSource = { html: "", css: "", js: "" };
const FIRST: PlaygroundSource = { html: EXAMPLES[0]!.html, css: EXAMPLES[0]!.css, js: EXAMPLES[0]!.js };

/** Начальное состояние: хэш URL → сохранённое в браузере → первый пример. Вызывается только на клиенте. */
function readInitialSource(): PlaygroundSource {
  const fromHash = decodeHash(window.location.hash);
  if (fromHash) return { ...EMPTY, ...fromHash };
  try {
    const raw = readLocal(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlaygroundSource>;
      if (typeof parsed.html === "string") return { html: parsed.html, css: parsed.css ?? "", js: parsed.js ?? "" };
    }
  } catch {
    /* повреждённое сохранение игнорируем */
  }
  return FIRST;
}

export function Playground() {
  const [source, setSource] = useState<PlaygroundSource>(FIRST);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("html");
  const [auto, setAuto] = useState(true);
  const [run, setRun] = useState<{ id: string; doc: string } | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const runIdRef = useRef("");
  const lineId = useRef(0);
  const lastHtmlCss = useRef("");
  const escapeTab = useRef(false);
  const saveSnippet = useUserStore((s) => s.saveSnippet);
  const snippets = useUserStore((s) => s.snippets);
  const deleteSnippet = useUserStore((s) => s.deleteSnippet);

  const execute = useCallback((src: PlaygroundSource) => {
    const id = Math.random().toString(36).slice(2);
    runIdRef.current = id;
    lastHtmlCss.current = src.html + "\u0000" + src.css;
    setLog([]);
    setRun({ id, doc: buildSrcDoc(src, id) });
  }, []);

  // Инициализация после монтирования: window.location доступен только на клиенте.
  useEffect(() => {
    const src = readInitialSource();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- однократная синхронизация с внешним источником (URL, localStorage)
    setSource(src);
    setReady(true);
    execute(src);
  }, [execute]);

  // Автообновление по HTML/CSS (JS выполняется по Ctrl+Enter — защита от зацикливания при наборе)
  useEffect(() => {
    if (!ready || !auto) return;
    if (source.html + "\u0000" + source.css === lastHtmlCss.current) return;
    const t = setTimeout(() => execute(source), 700);
    return () => clearTimeout(t);
  }, [source, auto, ready, execute]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => writeLocal(STORAGE_KEY, JSON.stringify(source)), 500);
    return () => clearTimeout(t);
  }, [source, ready]);

  // Консоль: принимаем сообщения только от нашего iframe и только текущего запуска
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const d = e.data as { source?: string; run?: string; level?: LogLine["level"]; text?: unknown } | null;
      if (!d || d.source !== "devdock-playground" || d.run !== runIdRef.current) return;
      if (typeof d.text !== "string" || !LEVELS.includes(d.level ?? "")) return;
      const level = d.level!;
      const text = d.text;
      setLog((prev) => [...prev.slice(-(MAX_LOG - 1)), { id: ++lineId.current, level, text }]);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const loadSource = (src: PlaygroundSource) => {
    setSource(src);
    execute(src);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      execute(source);
      return;
    }
    if (e.key === "Escape") {
      escapeTab.current = true; // следующий Tab покинет редактор (нет «ловушки клавиатуры»)
      return;
    }
    if (e.key === "Tab" && !e.shiftKey) {
      if (escapeTab.current) {
        escapeTab.current = false;
        return;
      }
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: end, value } = el;
      const next = value.slice(0, s) + "  " + value.slice(end);
      setSource((prev) => ({ ...prev, [tab]: next }));
      requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2));
    } else {
      escapeTab.current = false;
    }
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/playground#${encodeHash(source)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.hash = encodeHash(source);
    }
  };

  const saveAsSnippet = () => {
    const doc =
      source.css || source.js
        ? `<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n<title>Сниппет</title>\n${source.css ? `<style>\n${source.css}\n</style>\n` : ""}</head>\n<body>\n${source.html}\n${source.js ? `<script>\n${source.js}\n</script>\n` : ""}</body>\n</html>`
        : source.html;
    const h1 = source.html.match(/<h1[^>]*>([^<]+)</i)?.[1]?.trim();
    saveSnippet({ title: h1 || `Сниппет ${new Date().toLocaleString("ru-RU")}`, lang: "html", code: doc });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const errorCount = useMemo(() => log.filter((l) => l.level === "error").length, [log]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <div className="eyebrow">Песочница</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">HTML · CSS · JavaScript</h1>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="examples">
            Загрузить пример
          </label>
          <select
            id="examples"
            defaultValue=""
            onChange={(e) => {
              const ex = EXAMPLES.find((x) => x.id === e.target.value);
              if (ex) loadSource({ html: ex.html, css: ex.css, js: ex.js });
              e.target.value = "";
            }}
            className="h-9 rounded-[3px] border border-line-strong bg-surface px-3 text-[13px] text-fg-muted focus:border-accent/60 focus:outline-none"
          >
            <option value="" disabled>
              Загрузить пример…
            </option>
            {EXAMPLES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => execute(source)} className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-accent bg-accent px-3.5 text-[13px] font-semibold text-accent-ink active:scale-[0.97]">
            <Play size={14} aria-hidden /> Запустить <kbd className="hidden font-mono text-[10px] opacity-70 sm:inline">Ctrl+Enter</kbd>
          </button>
          <button type="button" onClick={() => loadSource(EMPTY)} className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-line-strong bg-surface px-3 text-[13px] text-fg-muted hover:text-fg">
            <RotateCcw size={14} aria-hidden /> Сброс
          </button>
          <button type="button" onClick={shareLink} className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-line-strong bg-surface px-3 text-[13px] text-fg-muted hover:text-fg">
            {copied ? <Check size={14} className="text-emerald" aria-hidden /> : <Link2 size={14} aria-hidden />} {copied ? "Ссылка скопирована" : "Ссылка"}
          </button>
          <button type="button" onClick={saveAsSnippet} className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-line-strong bg-surface px-3 text-[13px] text-fg-muted hover:text-fg">
            {saved ? <Check size={14} className="text-emerald" aria-hidden /> : <BookmarkPlus size={14} aria-hidden />} {saved ? "Сохранено" : "В сниппеты"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Редактор */}
        <section aria-label="Редактор" className="flex min-w-0 flex-col overflow-hidden rounded-[3px] border border-line bg-code">
          <div className="flex items-center border-b border-line bg-surface px-2">
            <div role="tablist" aria-label="Язык редактора" className="flex items-center">
            {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                id={`tab-${t}`}
                aria-selected={tab === t}
                aria-controls="editor-panel"
                onClick={() => setTab(t)}
                className={cn("relative px-3.5 py-2.5 text-[13px] font-medium transition-colors", tab === t ? "text-fg" : "text-fg-muted hover:text-fg")}
              >
                {TAB_LABEL[t]}
                {source[t].trim() && <span aria-hidden className="ml-1.5 inline-block h-1 w-1 rounded-full bg-accent align-middle" />}
                {tab === t && <span aria-hidden className="absolute inset-x-2 -bottom-px h-[2px] bg-accent" />}
              </button>
            ))}
            </div>
            <label className="ml-auto flex cursor-pointer items-center gap-2 px-2 text-[12px] text-fg-muted">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--accent)]" />
              Автообновление HTML/CSS
            </label>
          </div>
          <div id="editor-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="min-h-[22rem] flex-1">
            <label htmlFor="editor" className="sr-only">
              Код {TAB_LABEL[tab]}
            </label>
            <textarea
              id="editor"
              value={source[tab]}
              onChange={(e) => setSource((prev) => ({ ...prev, [tab]: e.target.value }))}
              onKeyDown={onKey}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              wrap="off"
              className="block h-full min-h-[22rem] w-full resize-y bg-transparent p-4 font-mono text-[13px] leading-[1.65] text-code-fg outline-none"
              placeholder={tab === "html" ? "<h1>Привет</h1>" : tab === "css" ? "h1 { color: tomato; }" : "console.log('Привет');"}
            />
          </div>
          <p className="border-t border-line bg-surface px-3 py-1.5 text-[11px] text-fg-dim">
            Tab — отступ. Esc, затем Tab — выйти из редактора. JavaScript выполняется по кнопке «Запустить» или Ctrl+Enter.
          </p>
        </section>

        {/* Результат и консоль */}
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-label="Результат" className="overflow-hidden rounded-[3px] border border-line bg-white">
            <div className="flex items-center justify-between border-b border-line bg-surface px-3 py-2">
              <span className="eyebrow">Результат</span>
              <span className="text-[11px] text-fg-dim">изолированный фрейм · без доступа к сайту и сети</span>
            </div>
            <iframe
              ref={iframeRef}
              title="Результат выполнения кода"
              sandbox="allow-scripts allow-forms allow-modals"
              srcDoc={run?.doc ?? ""}
              className="block h-[24rem] w-full border-0 bg-white"
            />
          </section>

          <section aria-label="Консоль" className="overflow-hidden rounded-[3px] border border-line bg-code">
            <div className="flex items-center justify-between border-b border-line bg-surface px-3 py-2">
              <span className="eyebrow">
                Консоль{" "}
                {log.length > 0 && (
                  <span className="ml-1 text-fg-muted">
                    · {log.length}
                    {errorCount ? ` · ошибок ${errorCount}` : ""}
                  </span>
                )}
              </span>
              <button type="button" onClick={() => setLog([])} className="inline-flex items-center gap-1.5 text-[11px] text-fg-dim hover:text-fg">
                <Trash2 size={12} aria-hidden /> очистить
              </button>
            </div>
            <ol aria-live="polite" className="m-0 max-h-52 min-h-[5rem] list-none overflow-auto p-0 font-mono text-[12.5px] leading-[1.6]">
              {log.length === 0 && <li className="px-3 py-2 text-fg-dim">Пока пусто. Используйте console.log() в JavaScript.</li>}
              {log.map((l) => (
                <li key={l.id} className={cn("whitespace-pre-wrap break-words border-b border-line/50 px-3 py-1.5 last:border-0", LEVEL_STYLE[l.level])}>
                  {l.text}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {snippets.length > 0 && (
        <section aria-labelledby="snippets" className="mt-8">
          <h2 id="snippets" className="eyebrow mb-3">
            Мои сниппеты
          </h2>
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {snippets.slice(0, 9).map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-[3px] border border-line bg-surface px-3 py-2">
                <button type="button" onClick={() => loadSource({ html: s.code, css: "", js: "" })} className="min-w-0 flex-1 truncate text-left text-sm text-fg-muted hover:text-fg">
                  {s.title}
                </button>
                <button type="button" onClick={() => deleteSnippet(s.id)} aria-label={`Удалить сниппет «${s.title}»`} className="text-fg-dim hover:text-rose">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
