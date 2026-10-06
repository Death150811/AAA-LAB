"use client";

import { BookmarkPlus, Check, Database, KeyRound, Loader2, Play, RotateCcw, Table2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SqlResultTables } from "@/components/content/SqlResultTables";
import { PLAYGROUND_DATASETS, type PlaygroundDataset } from "@/content/sql/playground-datasets";
import { cn } from "@/lib/cn";
import { loadSqlEngine, type ResultSet, type SqlDb } from "@/lib/sql-engine";
import { readLocal, writeLocal } from "@/store/storage";
import { useUserStore } from "@/store/user-store";

const STORAGE_KEY = "devdock-sql-playground-v1";
const MAX_ROWS = 500;

interface ColumnInfo {
  name: string;
  type: string;
  pk: boolean;
  notNull: boolean;
  references?: string;
}
interface TableInfo {
  name: string;
  rows: number;
  columns: ColumnInfo[];
}
interface Schema {
  tables: TableInfo[];
  indexes: { name: string; table: string }[];
}
type RunState =
  | { kind: "idle" }
  | { kind: "done"; sets: ResultSet[]; ms: number }
  | { kind: "error"; message: string };

const q = (name: string) => `"${name.replace(/"/g, '""')}"`;

/** Схема читается из самой базы, поэтому отражает и таблицы, созданные запросами ученика. */
function readSchema(db: SqlDb): Schema {
  const names = (db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")[0]?.values ?? []).map((r) => String(r[0]));
  const tables = names.map((name) => {
    const fks = new Map<string, string>();
    for (const r of db.exec(`PRAGMA foreign_key_list(${q(name)})`)[0]?.values ?? []) fks.set(String(r[3]), `${String(r[2])}.${String(r[4])}`);
    const columns = (db.exec(`PRAGMA table_info(${q(name)})`)[0]?.values ?? []).map((r) => ({
      name: String(r[1]),
      type: String(r[2] || "—"),
      notNull: Number(r[3]) === 1,
      pk: Number(r[5]) > 0,
      references: fks.get(String(r[1])),
    }));
    const rows = Number(db.exec(`SELECT COUNT(*) FROM ${q(name)}`)[0]?.values[0]?.[0] ?? 0);
    return { name, rows, columns };
  });
  const indexes = (db.exec("SELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name")[0]?.values ?? []).map((r) => ({ name: String(r[0]), table: String(r[1]) }));
  return { tables, indexes };
}

function readSaved(): { dataset?: string; sql?: Record<string, string> } {
  try {
    const raw = readLocal(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { dataset?: string; sql?: Record<string, string> }) : {};
  } catch {
    return {};
  }
}

export function SqlPlayground() {
  const [datasetId, setDatasetId] = useState(PLAYGROUND_DATASETS[0]!.id);
  const dataset: PlaygroundDataset = PLAYGROUND_DATASETS.find((d) => d.id === datasetId) ?? PLAYGROUND_DATASETS[0]!;
  const [sql, setSql] = useState(dataset.examples[0]?.sql ?? "");
  const [activeExample, setActiveExample] = useState<string | null>(dataset.examples[0]?.id ?? null);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [version, setVersion] = useState("");
  const [engineError, setEngineError] = useState<string | null>(null);
  const [run, setRun] = useState<RunState>({ kind: "idle" });
  const [saved, setSaved] = useState(false);
  const [restored, setRestored] = useState(false);
  const dbRef = useRef<SqlDb | null>(null);
  const sqlRef = useRef<Record<string, string>>({});
  const saveSnippet = useUserStore((s) => s.saveSnippet);

  /** Создаёт базу заново: данные набора возвращаются к исходным, созданные запросами таблицы пропадают. */
  const openDatabase = useCallback(async (ds: PlaygroundDataset) => {
    try {
      const engine = await loadSqlEngine();
      dbRef.current?.close();
      const db = new engine.SQL.Database();
      db.run("PRAGMA foreign_keys = ON");
      if (ds.setup) db.run(ds.setup);
      dbRef.current = db;
      setVersion(engine.version);
      setEngineError(null);
      setSchema(readSchema(db));
    } catch (e) {
      setEngineError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  // Восстановление сохранённого состояния — только в браузере и только один раз (SSR отдаёт первый пример).
  useEffect(() => {
    const s = readSaved();
    sqlRef.current = s.sql ?? {};
    const ds = PLAYGROUND_DATASETS.find((d) => d.id === s.dataset) ?? PLAYGROUND_DATASETS[0]!;
    /* eslint-disable react-hooks/set-state-in-effect -- однократное чтение localStorage после монтирования */
    setDatasetId(ds.id);
    const saved = sqlRef.current[ds.id];
    if (saved !== undefined) {
      setSql(saved);
      setActiveExample(null);
    } else {
      setSql(ds.examples[0]?.sql ?? "");
      setActiveExample(ds.examples[0]?.id ?? null);
    }
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    void openDatabase(ds);
    return () => dbRef.current?.close();
  }, [openDatabase]);

  const persist = (nextDataset: string, nextSql: string) => {
    sqlRef.current = { ...sqlRef.current, [nextDataset]: nextSql };
    writeLocal(STORAGE_KEY, JSON.stringify({ dataset: nextDataset, sql: sqlRef.current }));
  };

  const execute = useCallback(
    (text: string) => {
      const db = dbRef.current;
      if (!db || !text.trim()) return;
      const t0 = performance.now();
      try {
        const sets = db.exec(text);
        setRun({ kind: "done", sets, ms: performance.now() - t0 });
      } catch (e) {
        setRun({ kind: "error", message: e instanceof Error ? e.message : String(e) });
      }
      setSchema(readSchema(db));
    },
    [],
  );

  const changeDataset = (id: string) => {
    const ds = PLAYGROUND_DATASETS.find((d) => d.id === id);
    if (!ds) return;
    setDatasetId(id);
    const keep = sqlRef.current[id];
    setSql(keep ?? ds.examples[0]?.sql ?? "");
    setActiveExample(keep === undefined ? (ds.examples[0]?.id ?? null) : null);
    setRun({ kind: "idle" });
    persist(id, keep ?? ds.examples[0]?.sql ?? "");
    void openDatabase(ds);
  };

  const loadExample = (id: string) => {
    const ex = dataset.examples.find((x) => x.id === id);
    if (!ex) return;
    setSql(ex.sql);
    setActiveExample(id);
    setRun({ kind: "idle" });
    persist(datasetId, ex.sql);
  };

  const resetData = () => {
    setRun({ kind: "idle" });
    void openDatabase(dataset);
  };

  const onEdit = (text: string) => {
    setSql(text);
    setActiveExample(null);
    persist(datasetId, text);
  };

  const previewTable = (name: string) => {
    const text = `SELECT * FROM ${q(name)} LIMIT 20;`;
    setSql(text);
    setActiveExample(null);
    persist(datasetId, text);
    execute(text);
  };

  const saveAsSnippet = () => {
    if (!sql.trim()) return;
    saveSnippet({ title: `SQL: ${dataset.title} — ${new Date().toLocaleString("ru-RU")}`, lang: "sql", code: sql });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const example = dataset.examples.find((x) => x.id === activeExample);
  const loading = !schema && !engineError;

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-10 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <div className="eyebrow">Песочница</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">SQL</h1>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="sql-dataset">
            Набор данных
          </label>
          <select
            id="sql-dataset"
            value={datasetId}
            onChange={(e) => changeDataset(e.target.value)}
            className="h-9 rounded-lg border border-line-strong bg-surface px-3 text-[13px] text-fg focus:border-cyan/60 focus:outline-none"
          >
            {PLAYGROUND_DATASETS.map((d) => (
              <option key={d.id} value={d.id}>
                Набор: {d.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => execute(sql)}
            disabled={loading || !restored}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-cyan bg-cyan px-3.5 text-[13px] font-semibold text-bg active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Play size={14} aria-hidden />} Выполнить
            <kbd className="hidden font-mono text-[10px] opacity-70 sm:inline">Ctrl+Enter</kbd>
          </button>
          <button
            type="button"
            onClick={resetData}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-[13px] text-fg-muted hover:text-fg disabled:opacity-50"
          >
            <RotateCcw size={14} aria-hidden /> Сбросить данные
          </button>
          <button
            type="button"
            onClick={saveAsSnippet}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-[13px] text-fg-muted hover:text-fg"
          >
            {saved ? <Check size={14} className="text-emerald" aria-hidden /> : <BookmarkPlus size={14} aria-hidden />} {saved ? "Сохранено" : "В сниппеты"}
          </button>
        </div>
      </div>
      <p className="mb-5 max-w-3xl text-sm text-fg-muted">{dataset.description}</p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* Редактор и результаты */}
        <div className="min-w-0 space-y-4">
          <section aria-label="Редактор запросов" className="overflow-hidden rounded-xl border border-line bg-[#0b1017]">
            <label htmlFor="sql-editor" className="sr-only">
              SQL-запрос
            </label>
            <textarea
              id="sql-editor"
              value={sql}
              onChange={(e) => onEdit(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  execute(sql);
                }
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              rows={Math.min(18, Math.max(8, sql.split("\n").length + 1))}
              className="block w-full resize-y bg-transparent px-4 py-3 font-mono text-[13px] leading-[1.65] text-[#d4dbe6] focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2 text-[11px] text-fg-dim">
              <span className="inline-flex items-center gap-1.5">
                <Database size={12} aria-hidden /> {version ? `SQLite ${version} (sql.js) в вашем браузере` : "Загрузка движка SQLite…"}
              </span>
              <span>Несколько операторов через «;» выполняются подряд; при ошибке уже выполненные остаются в силе — «Сбросить данные» вернёт исходное состояние.</span>
            </div>
          </section>

          {example && (
            <div role="note" aria-label="Пояснение к примеру" className="rounded-lg border border-cyan/30 bg-cyan/[0.06] px-4 py-3 text-sm leading-relaxed text-fg-muted">
              <span className="font-semibold text-fg">{example.title}.</span> {example.note}
            </div>
          )}

          <section aria-label="Результаты" aria-live="polite" className="space-y-3">
            {engineError && (
              <p role="alert" className="rounded-md border border-rose/40 bg-rose/10 px-3 py-2 text-sm text-rose">
                {engineError}
              </p>
            )}
            {run.kind === "idle" && !engineError && (
              <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-sm text-fg-dim">
                Результат появится здесь. Нажмите «Выполнить» или Ctrl+Enter; щёлкните таблицу справа, чтобы посмотреть её строки.
              </p>
            )}
            {run.kind === "error" && (
              <pre role="alert" className="overflow-x-auto whitespace-pre-wrap rounded-md border border-rose/40 bg-rose/10 px-3 py-2 font-mono text-xs text-rose">
                {run.message}
              </pre>
            )}
            {run.kind === "done" && (
              <>
                {run.sets.length === 0 && <p className="rounded-md border border-line px-3 py-2 text-sm text-fg-muted">Запрос выполнен, строк не возвращено.</p>}
                <SqlResultTables sets={run.sets} max={MAX_ROWS} />
                <p className="text-[11px] text-fg-dim">Выполнено за {run.ms.toFixed(1)} мс. Диалект SQLite отличается от PostgreSQL, на котором получены результаты в темах.</p>
              </>
            )}
          </section>
        </div>

        {/* Схема и примеры */}
        <aside aria-label="Схема и примеры" className="min-w-0 space-y-5">
          <section aria-labelledby="schema-h">
            <h2 id="schema-h" className="eyebrow mb-2 flex items-center gap-1.5">
              <Table2 size={12} aria-hidden /> Схема
            </h2>
            {loading && <p className="text-sm text-fg-dim">Загрузка…</p>}
            {schema && schema.tables.length === 0 && <p className="rounded-lg border border-dashed border-line-strong px-3 py-3 text-sm text-fg-dim">В базе нет таблиц. Создайте их запросом CREATE TABLE.</p>}
            <ul className="m-0 list-none space-y-2 p-0">
              {schema?.tables.map((t) => (
                <li key={t.name} className="rounded-lg border border-line bg-surface">
                  <button
                    type="button"
                    onClick={() => previewTable(t.name)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-surface-2"
                    aria-label={`Показать строки таблицы ${t.name}`}
                  >
                    <span className="mono text-[13px] font-semibold text-fg">{t.name}</span>
                    <span className="mono text-[11px] text-fg-dim">{t.rows} стр.</span>
                  </button>
                  <ul className="m-0 list-none border-t border-line p-0">
                    {t.columns.map((c) => (
                      <li key={c.name} className="flex items-baseline gap-2 px-3 py-1 text-[12px]">
                        <span className="mono text-fg">{c.name}</span>
                        <span className="mono text-fg-dim">{c.type.toLowerCase()}</span>
                        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-fg-dim">
                          {c.pk && (
                            <span className="inline-flex items-center gap-0.5 text-amber" title="первичный ключ">
                              <KeyRound size={10} aria-hidden /> PK
                            </span>
                          )}
                          {c.references && <span title={`внешний ключ → ${c.references}`}>→ {c.references}</span>}
                          {c.notNull && !c.pk && <span title="NOT NULL">NN</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            {schema && schema.indexes.length > 0 && (
              <p className="mt-2 text-[12px] text-fg-muted">
                Индексы:{" "}
                {schema.indexes.map((i, k) => (
                  <span key={i.name} className="mono">
                    {k > 0 && ", "}
                    {i.name} <span className="text-fg-dim">({i.table})</span>
                  </span>
                ))}
              </p>
            )}
          </section>

          <section aria-labelledby="examples-h">
            <h2 id="examples-h" className="eyebrow mb-2">
              Примеры
            </h2>
            <ul className="m-0 list-none space-y-1 p-0">
              {dataset.examples.map((x) => (
                <li key={x.id}>
                  <button
                    type="button"
                    onClick={() => loadExample(x.id)}
                    aria-current={x.id === activeExample ? "true" : undefined}
                    className={cn(
                      "w-full rounded-md border px-3 py-1.5 text-left text-[13px] transition-colors",
                      x.id === activeExample ? "border-cyan/50 bg-cyan/10 text-fg" : "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg",
                    )}
                  >
                    {x.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
