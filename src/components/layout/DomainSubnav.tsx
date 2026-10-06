import Link from "next/link";
import { cn } from "@/lib/cn";

const TABS = [
  { key: "learn", label: "Курс" },
  { key: "projects", label: "Проекты" },
  { key: "practice", label: "Практика" },
  { key: "exam", label: "Экзамен" },
  { key: "interview", label: "Собеседование" },
] as const;

export type DomainTab = (typeof TABS)[number]["key"];

export function DomainSubnav({ slug, active }: { slug: string; active: DomainTab }) {
  return (
    <nav aria-label="Разделы домена" className="scroll-x -mx-4 border-b border-line px-4 sm:mx-0 sm:px-0">
      <ul className="m-0 flex list-none gap-1 p-0">
        {TABS.map((t) => (
          <li key={t.key}>
            <Link
              href={`/${t.key}/${slug}`}
              aria-current={t.key === active ? "page" : undefined}
              className={cn(
                "relative block whitespace-nowrap px-3.5 py-3 text-[13px] font-medium transition-colors",
                t.key === active ? "text-fg" : "text-fg-muted hover:text-fg",
              )}
            >
              {t.label}
              {t.key === active && <span aria-hidden className="absolute inset-x-3 -bottom-px h-[2px] bg-accent" />}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
