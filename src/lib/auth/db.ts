import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Pool } from "pg";
import { dbKind } from "./config";

/**
 * Состояние ученика. Два хранилища с одним интерфейсом:
 *  - DATABASE_URL задан  → PostgreSQL (Neon, Supabase, Vercel Postgres …);
 *  - иначе (свой сервер/компьютер) → файл SQLite (встроенный в Node модуль node:sqlite), по умолчанию data/devdock.sqlite.
 * Схема — docs/db/schema.sql; таблица создаётся при первом обращении.
 */
export interface StateRow {
  user_id: string;
  email: string | null;
  state: Record<string, unknown>;
  updated_at: Date;
}

interface Store {
  get(userId: string): Promise<StateRow | null>;
  put(userId: string, email: string | null, state: Record<string, unknown>): Promise<Date>;
  list(): Promise<StateRow[]>;
}

/* ───────────────────────── PostgreSQL ───────────────────────── */
function postgresStore(url: string): Store {
  const pool = new Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 10_000,
    // Облачные базы (Neon, Supabase) требуют TLS; локальная — нет. sslmode задаётся в самой строке подключения.
    ssl: /sslmode=(require|verify)/.test(url) ? { rejectUnauthorized: false } : undefined,
  });
  let ready: Promise<void> | undefined;
  const ensure = () =>
    (ready ??= pool
      .query(
        `CREATE TABLE IF NOT EXISTS user_state (
           user_id    text PRIMARY KEY,
           email      text,
           state      jsonb NOT NULL,
           created_at timestamptz NOT NULL DEFAULT now(),
           updated_at timestamptz NOT NULL DEFAULT now()
         )`,
      )
      .then(() => undefined)
      .catch((e) => {
        ready = undefined;
        throw e;
      }));
  return {
    async get(userId) {
      await ensure();
      const r = await pool.query<StateRow>("SELECT user_id, email, state, updated_at FROM user_state WHERE user_id = $1", [userId]);
      return r.rows[0] ?? null;
    },
    async put(userId, email, state) {
      await ensure();
      const r = await pool.query<{ updated_at: Date }>(
        `INSERT INTO user_state (user_id, email, state) VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, state = EXCLUDED.state, updated_at = now()
         RETURNING updated_at`,
        [userId, email, JSON.stringify(state)],
      );
      return r.rows[0]!.updated_at;
    },
    async list() {
      await ensure();
      const r = await pool.query<StateRow>("SELECT user_id, email, state, updated_at FROM user_state ORDER BY updated_at DESC LIMIT 500");
      return r.rows;
    },
  };
}

/* ───────────────────────── SQLite (node:sqlite) ───────────────────────── */
type SqliteRow = { user_id: string; email: string | null; state: string; updated_at: string };

function sqliteStore(): Store {
  // process.getBuiltinModule обходит сборщик: node:sqlite — встроенный модуль Node (22.5+), ставить ничего не нужно.
  const { DatabaseSync } = process.getBuiltinModule("node:sqlite") as typeof import("node:sqlite");
  // Путь к файлу БД вычисляется во время работы: сборщику не нужно «трассировать» весь проект.
  const file = resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.SQLITE_PATH || "data/devdock.sqlite");
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  db.exec(
    `CREATE TABLE IF NOT EXISTS user_state (
       user_id    TEXT PRIMARY KEY,
       email      TEXT,
       state      TEXT NOT NULL,
       created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
       updated_at TEXT NOT NULL
     )`,
  );
  const toRow = (r: SqliteRow): StateRow => ({ user_id: r.user_id, email: r.email, state: JSON.parse(r.state), updated_at: new Date(r.updated_at) });
  return {
    async get(userId) {
      const r = db.prepare("SELECT user_id, email, state, updated_at FROM user_state WHERE user_id = ?").get(userId) as SqliteRow | undefined;
      return r ? toRow(r) : null;
    },
    async put(userId, email, state) {
      const now = new Date();
      db.prepare(
        `INSERT INTO user_state (user_id, email, state, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, state = excluded.state, updated_at = excluded.updated_at`,
      ).run(userId, email, JSON.stringify(state), now.toISOString());
      return now;
    },
    async list() {
      const rows = db.prepare("SELECT user_id, email, state, updated_at FROM user_state ORDER BY updated_at DESC LIMIT 500").all() as SqliteRow[];
      return rows.map(toRow);
    },
  };
}

/* ───────────────────────── выбор хранилища ───────────────────────── */
const g = globalThis as unknown as { __devdockStore?: Store };

function store(): Store {
  if (g.__devdockStore) return g.__devdockStore;
  const kind = dbKind();
  if (kind === "none") throw new Error("База данных недоступна в этом окружении: задайте DATABASE_URL");
  g.__devdockStore = kind === "postgres" ? postgresStore(process.env.DATABASE_URL!) : sqliteStore();
  return g.__devdockStore;
}

export const getUserState = (userId: string) => store().get(userId);
export const putUserState = (userId: string, email: string | null, state: Record<string, unknown>) => store().put(userId, email, state);
export const listUserStates = () => store().list();
