"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useHydrated } from "@/store/hydrate";
import { hasProgress, snapshotState } from "@/store/snapshot";
import { useUserStore } from "@/store/user-store";

const TS_KEY = "devdock-local-updated";
const PUSH_DELAY_MS = 2500;

const readTs = () => {
  try {
    return Number(localStorage.getItem(TS_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
};
const writeTs = (ts: number) => {
  try {
    localStorage.setItem(TS_KEY, String(ts));
  } catch {
    /* хранилище недоступно */
  }
};

/**
 * Синхронизация прогресса с сервером для вошедшего пользователя («последняя запись побеждает»).
 * Ничего не рисует. Если база не настроена (ответ 503) — молча выключается: вход работает, прогресс остаётся локальным.
 */
export default function CloudSync() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const hydrated = useHydrated();
  const importing = useRef(false);
  const ready = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const push = useRef<() => Promise<void>>(async () => {});

  // Любое локальное изменение двигает метку времени и (после первой сверки) планирует отправку.
  useEffect(() => {
    const unsub = useUserStore.subscribe(() => {
      if (importing.current) return;
      writeTs(Date.now());
      if (!ready.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void push.current(), PUSH_DELAY_MS);
    });
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Первая сверка после входа.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !hydrated) return;
    let cancelled = false;
    ready.current = false;

    push.current = async () => {
      try {
        const res = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: snapshotState() }) });
        if (!res.ok) return;
        const { updatedAt } = (await res.json()) as { updatedAt?: string };
        if (updatedAt) writeTs(Date.parse(updatedAt));
      } catch {
        /* нет сети: повторим при следующем изменении */
      }
    };

    (async () => {
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (!res.ok || cancelled) return; // 503: база не настроена
        const { state, updatedAt } = (await res.json()) as { state: Record<string, unknown> | null; updatedAt: string | null };
        const serverTs = updatedAt ? Date.parse(updatedAt) : 0;
        if (state && serverTs > readTs()) {
          importing.current = true;
          useUserStore.getState().importState(state);
          importing.current = false;
          writeTs(serverTs);
        } else if (hasProgress()) {
          await push.current();
        }
        ready.current = true;
      } catch {
        /* сеть недоступна: остаёмся в локальном режиме */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, hydrated]);

  return null;
}
