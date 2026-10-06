import { NextResponse } from "next/server";
import { authEnabled, dbConfigured } from "@/lib/auth/config";
import { getUserState, putUserState } from "@/lib/auth/db";
import { getSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const MAX_BYTES = 1_500_000;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Состояние ученика текущего пользователя. */
export async function GET() {
  if (!authEnabled()) return json({ error: "auth_disabled" }, 404);
  const session = await getSession();
  if (!session) return json({ error: "unauthorized" }, 401);
  if (!dbConfigured()) return json({ error: "db_not_configured" }, 503);
  try {
    const row = await getUserState(session.userId);
    return json({ state: row?.state ?? null, updatedAt: row?.updated_at.toISOString() ?? null });
  } catch {
    return json({ error: "db_error" }, 500);
  }
}

/** Сохраняет состояние (последняя запись побеждает). */
export async function PUT(req: Request) {
  if (!authEnabled()) return json({ error: "auth_disabled" }, 404);
  const session = await getSession();
  if (!session) return json({ error: "unauthorized" }, 401);
  if (!dbConfigured()) return json({ error: "db_not_configured" }, 503);
  const text = await req.text();
  if (text.length > MAX_BYTES) return json({ error: "too_large" }, 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const state = (body as { state?: unknown } | null)?.state;
  if (typeof state !== "object" || state === null || Array.isArray(state)) return json({ error: "bad_state" }, 400);
  try {
    const updatedAt = await putUserState(session.userId, session.email, state as Record<string, unknown>);
    return json({ updatedAt: updatedAt.toISOString() });
  } catch {
    return json({ error: "db_error" }, 500);
  }
}
