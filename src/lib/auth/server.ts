import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { authEnabled, roleFor, type Role } from "./config";

export interface Session {
  userId: string;
  email: string | null;
  role: Exclude<Role, "guest">;
}

/** Текущая сессия или null (гость / слой входа выключен). */
export async function getSession(): Promise<Session | null> {
  if (!authEnabled()) return null;
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const emails = (user?.emailAddresses ?? []).map((e) => e.emailAddress);
  const role = roleFor({ emails, publicMetadata: (user?.publicMetadata as Record<string, unknown> | undefined) ?? null });
  return { userId, email: emails[0] ?? null, role };
}
