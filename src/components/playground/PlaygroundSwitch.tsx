import Link from "next/link";
import { cn } from "@/lib/cn";

const ITEMS = [
  { id: "web", href: "/playground", label: "HTML · CSS · JS" },
  { id: "sql", href: "/playground/sql", label: "SQL" },
] as const;

/** Переключатель между песочницами: сайт-разметка/скрипты и SQL. */
export function PlaygroundSwitch({ current }: { current: "web" | "sql" }) {
  return (
    <nav aria-label="Песочницы" className="mx-auto max-w-[1600px] px-4 pt-5 sm:px-6">
      <ul className="m-0 inline-flex list-none gap-1 rounded-[3px] border border-line bg-surface p-1">
        {ITEMS.map((i) => (
          <li key={i.id}>
            <Link
              href={i.href}
              aria-current={i.id === current ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                i.id === current ? "bg-surface-3 text-fg" : "text-fg-muted hover:text-fg",
              )}
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
