"use client";

import { Database, Loader2, Play } from "lucide-react";
import { useRef, useState } from "react";
import { loadSqlEngine, type ResultSet } from "@/lib/sql-engine";
import { SqlResultTables } from "./SqlResultTables";

const MAX_ROWS = 200;

interface Props {
  code: string;
  setup?: string;
  fixtureName?: string;
}

export function SqlRunner({ code, setup, fixtureName }: Props) {
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "busy" } | { kind: "done"; sets: ResultSet[]; ms: number; version: string } | { kind: "error"; message: string; version?: string }
  >({ kind: "idle" });
  const seq = useRef(0);

  async function run() {
    const id = ++seq.current;
    setState({ kind: "busy" });
    let version: string | undefined;
    try {
      const engine = await loadSqlEngine();
      version = engine.version;
      const db = new engine.SQL.Database();
      try {
        db.run("PRAGMA foreign_keys = ON");
        if (setup) db.run(setup);
        const t0 = performance.now();
        const sets = db.exec(code);
        if (id === seq.current) setState({ kind: "done", sets, ms: performance.now() - t0, version });
      } finally {
        db.close();
      }
    } catch (e) {
      if (id === seq.current) setState({ kind: "error", message: e instanceof Error ? e.message : String(e), version });
    }
  }

  return (
    <div className="border-t border-line bg-surface/60 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={state.kind === "busy"}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-cyan/40 bg-cyan/10 px-3 text-xs font-semibold text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-60 active:scale-[0.97]"
        >
          {state.kind === "busy" ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Play size={13} aria-hidden />}
          Выполнить в браузере
        </button>
        {fixtureName && (
          <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
            <Database size={13} aria-hidden />
            Данные: набор «{fixtureName}» создаётся перед запросом
          </span>
        )}
      </div>
      <div aria-live="polite" className="mt-2">
        {state.kind === "error" && (
          <pre role="alert" className="overflow-x-auto whitespace-pre-wrap rounded-md border border-rose/40 bg-rose/10 px-3 py-2 font-mono text-xs text-rose">
            {state.message}
          </pre>
        )}
        {state.kind === "done" && (
          <div className="space-y-3">
            {state.sets.length === 0 && <p className="text-xs text-fg-muted">Запрос выполнен, строк не возвращено.</p>}
            <SqlResultTables sets={state.sets} max={MAX_ROWS} />
            <p className="text-[11px] text-fg-dim">
              Выполнено движком SQLite {state.version} (sql.js, в вашем браузере) за {state.ms.toFixed(1)} мс. Диалект отличается от PostgreSQL, на котором получены результаты в тексте.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
