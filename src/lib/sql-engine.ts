/** Движок SQLite (sql.js, WebAssembly) — общий для встроенных запросов в темах и для SQL-песочницы. */
export interface ResultSet {
  columns: string[];
  values: unknown[][];
}
export interface SqlDb {
  run(sql: string): void;
  exec(sql: string): ResultSet[];
  close(): void;
}
export interface SqlJs {
  Database: new () => SqlDb;
}
declare global {
  interface Window {
    initSqlJs?: (config: { locateFile: (file: string) => string }) => Promise<SqlJs>;
  }
}

let enginePromise: Promise<{ SQL: SqlJs; version: string }> | null = null;

/** Загружается один раз и только по требованию. */
export function loadSqlEngine() {
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
