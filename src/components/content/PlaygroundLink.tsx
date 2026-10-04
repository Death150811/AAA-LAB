"use client";

import { Play } from "lucide-react";
import Link from "next/link";

/** Открывает пример в песочнице. Код передаётся во фрагменте URL и не уходит на сервер. */
export function PlaygroundLink({ code }: { code: string }) {
  const encoded = encodeURIComponent(code);
  return (
    <Link
      href={`/playground#html=${encoded}`}
      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2 text-[11px] font-medium text-cyan transition-colors hover:border-cyan/50 active:scale-[0.97]"
    >
      <Play size={12} aria-hidden />
      Открыть в песочнице
    </Link>
  );
}
