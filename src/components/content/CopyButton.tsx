"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ text, label = "Копировать код" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      // Буфер обмена недоступен (небезопасный контекст) — молча оставляем кнопку без эффекта.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={done ? "Скопировано" : label}
      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2 text-[11px] font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg active:scale-[0.97]"
    >
      {done ? <Check size={13} className="text-emerald" aria-hidden /> : <Copy size={13} aria-hidden />}
      <span aria-live="polite">{done ? "Скопировано" : "Копировать"}</span>
    </button>
  );
}
