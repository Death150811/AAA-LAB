"use client";

import { Database, Loader2, Play } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface ResultSet {
  columns: string[];
  values: unknown[][];
}
interface SqlDb {
  run(sql: string): void;
  exec(sql: string): ResultSet[];
  close(): void;
}
interface SqlJs {
  Database: new () => SqlDb;
}
declare global {
  interface Window {
    initSqlJs?: (config: { locateFile: (file: string) => string }) => Promise<SqlJs>;
  }
}

const MAX_ROWS = 200;
let enginePromise: Promise<{ SQL: SqlJs; version: string }> | null = null;

/** Движок SQLite (sql.js, WebAssembly) загружается один раз и только по требованию. */
function loadEngine() {
  enginePromise ??= new Promise<{ SQL: SqlJs; version: string }>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/sql/sql-wasm.js";
    script.onload = () => {
      window
        .initSqlJs?.({ locateFile: (file) => `/sql/${file}` })
        .then((SQL) => {
          const db = new SQL.Database();
          const version = String(db.exec("select sqlite_version()")[0]?.values[0]?.[0] ?? "");
          db.close();
          resolve({ SQL, version });
        }, reject);
    };
    script.onerror = () => reject(new Error("Не удалось загрузить движок SQLite."));
    document.head.append(script);
  }).catch((e: unknown) => {
    enginePromise = null;
    throw e;
  });
  return enginePromise;
}

function Cell({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="italic text-fg-dim">NULL</span>;
  if (value instanceof Uint8Array) return <span className="italic text-fg-dim">[blob {value.length} Б]</span>;
  return <>{String(value)}</>;
}

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
      const engine = await loadEngine();
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
            {state.sets.map((set, i) => (
              <div key={i} className="overflow-x-auto rounded-md border border-line">
                <table className="w-full border-collapse text-left font-mono text-xs">
                  <caption className="sr-only">Результат {i + 1}</caption>
                  <thead className="bg-surface-2 text-fg-muted">
                    <tr>
                      {set.columns.map((c, j) => (
                        <th key={j} scope="col" className="whitespace-nowrap border-b border-line px-3 py-1.5 font-semibold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {set.values.slice(0, MAX_ROWS).map((row, r) => (
                      <tr key={r} className={cn(r % 2 === 1 && "bg-surface/50")}>
                        {row.map((v, c) => (
                          <td key={c} className="whitespace-nowrap px-3 py-1 text-fg">
                            <Cell value={v} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-line px-3 py-1 text-[11px] text-fg-dim">
                  {set.values.length} {set.values.length === 1 ? "строка" : "строк"}
                  {set.values.length > MAX_ROWS && ` (показаны первые ${MAX_ROWS})`}
                </p>
              </div>
            ))}
            <p className="text-[11px] text-fg-dim">
              Выполнено движком SQLite {state.version} (sql.js, в вашем браузере) за {state.ms.toFixed(1)} мс. Диалект отличается от PostgreSQL, на котором получены результаты в тексте.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
