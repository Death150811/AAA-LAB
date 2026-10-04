"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useUserStore } from "./user-store";

let hydrated = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Вызывается один раз в корневом layout: восстанавливает состояние из localStorage. */
export function StoreHydrator() {
  useEffect(() => {
    if (hydrated) return;
    Promise.resolve(useUserStore.persist.rehydrate()).finally(() => {
      hydrated = true;
      notify();
    });
  }, []);
  return null;
}

/** true после восстановления состояния — до этого UI показывает нейтральные значения. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => hydrated,
    () => false,
  );
}
