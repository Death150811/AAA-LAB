"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Inline } from "@/lib/inline";
import type { TokenLine } from "@/lib/highlight-types";
import { CodeLines } from "./CodeLines";
import { CopyButton } from "./CopyButton";

interface Note {
  line: number | [number, number];
  text: string;
}

const rangeOf = (l: Note["line"]): number[] => {
  if (typeof l === "number") return [l];
  const out: number[] = [];
  for (let i = l[0]; i <= l[1]; i++) out.push(i);
  return out;
};

/**
 * Код с построчными пояснениями. Выбранное пояснение подсвечивает свои строки в коде —
 * подсветка несёт смысл («о каких строках сейчас речь»), а не декорацию.
 */
export function AnnotatedCode({
  lines,
  raw,
  notes,
  filename,
  label,
}: {
  lines: TokenLine[];
  raw: string;
  notes: Note[];
  filename?: string;
  label: string;
}) {
  const [active, setActive] = useState(0);
  const highlighted = new Set(rangeOf(notes[active]?.line ?? 0));

  return (
    <div className="space-y-3">
      <figure
        className={cn(
          "m-0 overflow-hidden rounded-lg border border-line bg-code",
          // Короткий код остаётся на виду, пока читаются пояснения (только на широких экранах).
          lines.length <= 14 && "md:sticky md:top-[calc(var(--header-h)+0.75rem)] md:z-10 md:shadow-[0_12px_24px_-12px_rgb(0_0_0/0.8)]",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-3 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="eyebrow !text-[10px]">{label}</span>
            {filename && <span className="truncate font-mono text-xs text-fg-muted">{filename}</span>}
          </div>
          <CopyButton text={raw} />
        </div>
        <CodeLines lines={lines} showNumbers highlighted={highlighted} />
      </figure>

      <ol className="!m-0 !list-none !p-0 space-y-2" aria-label="Пояснения к строкам кода">
        {notes.map((n, i) => {
          const on = i === active;
          const tag = typeof n.line === "number" ? `L${n.line}` : `L${n.line[0]}–${n.line[1]}`;
          return (
            <li
              key={i}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "!mt-0 flex gap-3 rounded-md border px-3.5 py-2.5 text-[0.95rem] leading-relaxed transition-colors",
                on ? "border-accent/40 bg-accent/[0.06]" : "border-line bg-surface/50",
              )}
            >
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={on}
                aria-label={`Показать строки ${tag} в коде`}
                className={cn(
                  "mt-[3px] h-fit shrink-0 rounded border px-1.5 py-0.5 font-mono text-[11px] tabular transition-colors",
                  on ? "border-accent/60 bg-accent/20 text-accent-text" : "border-line-strong text-fg-dim hover:text-fg",
                )}
              >
                {tag}
              </button>
              <span className="min-w-0">
                <Inline text={n.text} />
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
