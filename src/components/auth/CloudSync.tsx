"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useHydrated } from "@/store/hydrate";
import { hasProgress, snapshotState } from "@/store/snapshot";
import { useUserStore } from "@/store/user-store";

const TS_KEY = "devdock-local-updated";
const USER_KEY = "devdock-synced-user";
const PUSH_DELAY_MS = 2500;

const readTs = () => {
  try {
    return Number(localStorage.getItem(TS_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
};
const readUser = () => {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
};
const writeUser = (id: string) => {
  try {
    localStorage.setItem(USER_KEY, id);
  } catch {
    /* хранилище недоступно */
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
  const hydratedRef = useRef(false);
  const importing = useRef(false);
  const ready = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const push = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    hydratedRef.current = hydrated;
  }, [hydrated]);

  // Любое локальное изменение двигает метку времени и (после первой сверки) планирует отправку.
  useEffect(() => {
    const unsub = useUserStore.subscribe(() => {
      // Восстановление из localStorage и применение серверного состояния — не «правки пользователя».
      if (importing.current || !hydratedRef.current) return;
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
        const owner = readUser();
        if (owner && owner !== userId) {
          // В этом браузере раньше работал другой аккаунт: его данные нельзя отправлять в чужой профиль.
          importing.current = true;
          if (state) useUserStore.getState().importState(state);
          else useUserStore.getState().reset();
          importing.current = false;
          writeTs(serverTs);
        } else if (state && serverTs > readTs()) {
          importing.current = true;
          useUserStore.getState().importState(state);
          importing.current = false;
          writeTs(serverTs);
        } else if (hasProgress()) {
          await push.current();
        }
        if (userId) writeUser(userId);
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
