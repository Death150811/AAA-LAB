"use client";

import { Check } from "lucide-react";
import { useHydrated } from "@/store/hydrate";
import { useUserStore } from "@/store/user-store";

/** Отметка «решено» для элемента списка практики (по истории попыток пользователя). */
export function SolvedMark({ refId }: { refId: string }) {
  const solved = useUserStore((s) => s.attempts.some((a) => a.ref === refId && a.correct === true));
  const hydrated = useHydrated();
  if (!hydrated || !solved) return <span aria-hidden className="inline-block h-4 w-4 rounded-full border border-line-strong" />;
  return <Check size={16} aria-label="Решено" className="text-emerald" />;
}
