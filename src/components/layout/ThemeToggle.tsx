"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { THEME_KEY, type Theme } from "@/lib/theme";

const EVENT = "devdock-theme";

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};
const read = (): Theme => (document.documentElement.dataset.theme === "paper" ? "paper" : "night");

/** Режим чтения: тёмный «атлас» или светлая «бумага». Выбор запоминается в браузере. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, read, () => "night" as Theme);
  const paper = theme === "paper";

  const toggle = () => {
    const next: Theme = paper ? "night" : "paper";
    if (next === "paper") document.documentElement.dataset.theme = "paper";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* приватный режим: выбор действует до перезагрузки */
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={paper ? "Вернуть ночной режим" : "Включить светлый режим «бумага»"}
      title={paper ? "Ночной режим" : "Режим «бумага»"}
      className={cn("group grid h-9 w-9 place-items-center rounded-[3px] border border-line-strong text-fg-muted transition-colors hover:border-fg-dim hover:text-fg", className)}
    >
      {paper ? (
        <Moon size={15} aria-hidden className="transition-transform duration-500 group-hover:-rotate-12" />
      ) : (
        <Sun size={15} aria-hidden className="transition-transform duration-500 group-hover:rotate-90" />
      )}
    </button>
  );
}
