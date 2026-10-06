-- DevDock Ultra: прогресс ученика. Таблица создаётся приложением автоматически (src/lib/auth/db.ts);
-- файл нужен для ручного развёртывания и чтобы схема была видна в репозитории.
CREATE TABLE IF NOT EXISTS user_state (
  user_id    text PRIMARY KEY,                -- id пользователя в Clerk
  email      text,
  state      jsonb NOT NULL,                  -- то же, что экспортирует страница «Моё» (src/store/user-store.ts)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
