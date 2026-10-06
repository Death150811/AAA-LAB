/**
 * Необязательный слой входа (Clerk + PostgreSQL). Включается переменными окружения;
 * без них сайт работает как раньше: гость, прогресс в браузере. См. README, раздел 7.
 */
export type Role = "guest" | "user" | "admin";

/** Слой входа включён, только если заданы оба ключа Clerk. Вызывать на сервере. */
export const authEnabled = (): boolean => Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

export type DbKind = "postgres" | "sqlite" | "none";

/**
 * Какая база используется: PostgreSQL (задан DATABASE_URL), файл SQLite (свой сервер/компьютер) или никакая.
 * На бессерверных хостингах (Vercel и т. п.) файловая система временная, поэтому SQLite там не включается.
 */
export function dbKind(): DbKind {
  if (process.env.DATABASE_URL) return "postgres";
  const serverless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
  return serverless ? "none" : "sqlite";
}

export const dbConfigured = (): boolean => dbKind() !== "none";

export const adminEmails = (): string[] =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

/** admin — e-mail из ADMIN_EMAILS или publicMetadata.role === "admin" в Clerk; иначе user. */
export function roleFor(user: { emails: string[]; publicMetadata?: Record<string, unknown> | null }): Exclude<Role, "guest"> {
  const admins = adminEmails();
  if (user.publicMetadata?.role === "admin") return "admin";
  if (user.emails.some((e) => admins.includes(e.toLowerCase()))) return "admin";
  return "user";
}
