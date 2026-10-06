import type { Metadata } from "next";
import { clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { authEnabled, dbConfigured, roleFor } from "@/lib/auth/config";
import { listUserStates } from "@/lib/auth/db";
import { getSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Админка", robots: { index: false, follow: false } };

const fmt = (d: Date | number | null | undefined) =>
  d ? new Date(d).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "—";

/** Список пользователей (Clerk) и их прогресс (PostgreSQL). Доступна только роли admin; остальным — 404. */
export default async function AdminPage() {
  if (!authEnabled()) notFound();
  const session = await getSession();
  if (!session || session.role !== "admin") notFound();

  const clerk = await clerkClient();
  const { data: users, totalCount } = await clerk.users.getUserList({ limit: 100, orderBy: "-created_at" });
  const states = dbConfigured() ? await listUserStates().catch(() => null) : null;
  const byUser = new Map((states ?? []).map((s) => [s.user_id, s]));

  const rows = users.map((u) => {
    const emails = u.emailAddresses.map((e) => e.emailAddress);
    const st = byUser.get(u.id)?.state as { completedTopics?: Record<string, unknown>; xp?: number } | undefined;
    return {
      id: u.id,
      email: emails[0] ?? "—",
      role: roleFor({ emails, publicMetadata: u.publicMetadata as Record<string, unknown> }),
      createdAt: u.createdAt,
      lastSignInAt: u.lastSignInAt,
      topics: st?.completedTopics ? Object.keys(st.completedTopics).length : null,
      xp: typeof st?.xp === "number" ? st.xp : null,
      syncedAt: byUser.get(u.id)?.updated_at ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-12 sm:px-6">
      <div className="eyebrow">Администрирование</div>
      <h1 className="mt-4 font-display text-[clamp(2.3rem,5vw,3.6rem)] font-light leading-[1.04] tracking-[-0.03em]">Пользователи</h1>
      <p className="mt-5 max-w-2xl font-serif text-[1.12rem] leading-[1.65] text-fg-muted">
        Всего зарегистрировано: {totalCount}. Роль «admin» выдают через переменную <code>ADMIN_EMAILS</code> или поле{" "}
        <code>publicMetadata.role = &quot;admin&quot;</code> в панели Clerk.
      </p>
      {states === null && (
        <p className="mt-6 border-l-[3px] border-l-amber bg-amber/[0.07] py-3 pl-5 pr-4 text-[0.95rem] text-fg-body" role="note">
          База данных не настроена или недоступна: прогресс пользователей не показан (задайте <code>DATABASE_URL</code>).
        </p>
      )}
      <div className="scroll-x mt-10 border border-line-strong" tabIndex={0}>
        <table className="w-full min-w-[46rem] border-collapse text-left text-[0.92rem]">
          <caption className="sr-only">Пользователи и их прогресс</caption>
          <thead>
            <tr className="bg-surface-2">
              {["E-mail", "Роль", "Регистрация", "Последний вход", "Тем изучено", "XP", "Синхронизация"].map((h) => (
                <th key={h} scope="col" className="border-b border-line-strong px-4 py-2.5 font-label text-[10px] font-medium uppercase tracking-[0.12em] text-fg-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 odd:bg-surface/40">
                <td className="px-4 py-2.5 text-fg">{r.email}</td>
                <td className="px-4 py-2.5">
                  <span className={r.role === "admin" ? "label text-accent-text" : "label text-fg-dim"}>{r.role}</span>
                </td>
                <td className="px-4 py-2.5 text-fg-muted tabular">{fmt(r.createdAt)}</td>
                <td className="px-4 py-2.5 text-fg-muted tabular">{fmt(r.lastSignInAt)}</td>
                <td className="px-4 py-2.5 tabular text-fg-body">{r.topics ?? "—"}</td>
                <td className="px-4 py-2.5 tabular text-fg-body">{r.xp ?? "—"}</td>
                <td className="px-4 py-2.5 text-fg-muted tabular">{fmt(r.syncedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
