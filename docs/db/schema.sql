-- DevDock Ultra: прогресс ученика. Таблица создаётся приложением автоматически (src/lib/auth/db.ts);
-- файл нужен для ручного развёртывания и чтобы схема была видна в репозитории.

-- PostgreSQL (когда задан DATABASE_URL):
CREATE TABLE IF NOT EXISTS user_state (
  user_id    text PRIMARY KEY,                -- id пользователя в Clerk
  email      text,
  state      jsonb NOT NULL,                  -- то же, что экспортирует страница «Моё» (src/store/user-store.ts)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- SQLite (по умолчанию, файл data/devdock.sqlite) — та же таблица, JSON и время хранятся текстом:
-- CREATE TABLE IF NOT EXISTS user_state (
--   user_id TEXT PRIMARY KEY, email TEXT, state TEXT NOT NULL,
--   created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT NOT NULL
-- );
