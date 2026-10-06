import "server-only";
import { Pool } from "pg";

/** Состояние ученика в PostgreSQL. Схема — docs/db/schema.sql; таблица создаётся при первом обращении. */
const globalForPg = globalThis as unknown as { __devdockPool?: Pool; __devdockSchema?: Promise<void> };

function pool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL не задан");
  return (globalForPg.__devdockPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10_000,
    // Облачные базы (Neon, Supabase) требуют TLS; локальная — нет. sslmode можно задать в самой строке.
    ssl: /sslmode=(require|verify)/.test(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
  }));
}

function ensureSchema(): Promise<void> {
  return (globalForPg.__devdockSchema ??= pool()
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
      globalForPg.__devdockSchema = undefined;
      throw e;
    }));
}

export interface StateRow {
  user_id: string;
  email: string | null;
  state: Record<string, unknown>;
  updated_at: Date;
}

export async function getUserState(userId: string): Promise<StateRow | null> {
  await ensureSchema();
  const r = await pool().query<StateRow>("SELECT user_id, email, state, updated_at FROM user_state WHERE user_id = $1", [userId]);
  return r.rows[0] ?? null;
}

export async function putUserState(userId: string, email: string | null, state: Record<string, unknown>): Promise<Date> {
  await ensureSchema();
  const r = await pool().query<{ updated_at: Date }>(
    `INSERT INTO user_state (user_id, email, state) VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, state = EXCLUDED.state, updated_at = now()
     RETURNING updated_at`,
    [userId, email, JSON.stringify(state)],
  );
  return r.rows[0]!.updated_at;
}

export async function listUserStates(): Promise<StateRow[]> {
  await ensureSchema();
  const r = await pool().query<StateRow>("SELECT user_id, email, state, updated_at FROM user_state ORDER BY updated_at DESC LIMIT 500");
  return r.rows;
}
