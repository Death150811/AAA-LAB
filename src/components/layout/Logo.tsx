import Link from "next/link";

/** Знак: лист атласа с координатной сеткой, одна клетка закрашена пигментом киновари. */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="21" height="21" stroke="var(--fg)" strokeWidth="1.2" />
      <path d="M12 1.5v21M1.5 12h21" stroke="var(--fg)" strokeWidth="0.8" opacity="0.55" />
      <rect x="12.6" y="1.9" width="9.5" height="9.5" fill="var(--vermilion)" />
      <circle cx="6.8" cy="17.2" r="1.7" fill="var(--fg)" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="DevDock — на главную">
      <LogoMark />
      <span className="flex items-baseline gap-2">
        <span className="font-display text-[1.32rem] font-medium leading-none tracking-[-0.01em] text-fg">DevDock</span>
        <span className="label hidden text-[9px] tracking-[0.2em] text-fg-dim sm:inline">Атлас</span>
      </span>
    </Link>
  );
}
