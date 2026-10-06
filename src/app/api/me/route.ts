import { NextResponse } from "next/server";
import { authEnabled, dbKind } from "@/lib/auth/config";
import { getSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/** Роль текущего посетителя: guest / user / admin. */
export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    { enabled: authEnabled(), db: dbKind(), role: session?.role ?? "guest", email: session?.email ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
