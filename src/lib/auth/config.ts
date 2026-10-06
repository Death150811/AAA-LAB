/**
 * Необязательный слой входа (Clerk + PostgreSQL). Включается переменными окружения;
 * без них сайт работает как раньше: гость, прогресс в браузере. См. README, раздел 7.
 */
export type Role = "guest" | "user" | "admin";

/** Слой входа включён, только если заданы оба ключа Clerk. Вызывать на сервере. */
export const authEnabled = (): boolean => Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

export const dbConfigured = (): boolean => Boolean(process.env.DATABASE_URL);

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
