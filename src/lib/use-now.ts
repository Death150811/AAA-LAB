"use client";

import { useSyncExternalStore } from "react";

/** Текущее время с точностью до минуты; на сервере — 0 (чтобы SSR не расходился с клиентом). */
export function useNowMinute(): number {
  return useSyncExternalStore(
    (cb) => {
      const t = setInterval(cb, 30_000);
      return () => clearInterval(t);
    },
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => 0,
  );
}
