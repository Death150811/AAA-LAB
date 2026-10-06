import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Угловые метки «таблицы» — как на листах атласа. */
function Corner({ className }: { className: string }) {
  return (
    <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" className={cn("absolute text-line-strong", className)}>
      <path d="M0 6V0h6" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/** Рамка «таблицы» с подписью: номер, название, пояснение внизу. */
export function Plate({ number, title, children, className, caption }: { number?: string; title?: string; children: ReactNode; className?: string; caption?: ReactNode }) {
  return (
    <figure className={cn("relative m-0 border border-line bg-bg-raised/60 p-5", className)}>
      <Corner className="-left-px -top-px" />
      <Corner className="-right-px -top-px rotate-90" />
      <Corner className="-bottom-px -right-px rotate-180" />
      <Corner className="-bottom-px -left-px -rotate-90" />
      {(number || title) && (
        <div className="mb-4 flex items-baseline justify-between gap-4">
          {number && <span className="label shrink-0 whitespace-nowrap text-fg-dim">Таблица {number}</span>}
          {title && <span className="font-display text-[0.95rem] italic text-fg-muted">{title}</span>}
        </div>
      )}
      {children}
      {caption && <figcaption className="mt-4 text-[11.5px] leading-snug text-fg-dim">{caption}</figcaption>}
    </figure>
  );
}
