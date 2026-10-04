import Link from "next/link";

export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="21" height="21" rx="5" stroke="var(--line-strong)" strokeWidth="1.2" />
      <rect x="5" y="6" width="14" height="2.2" rx="1.1" fill="var(--cyan)" />
      <rect x="5" y="10.9" width="10" height="2.2" rx="1.1" fill="var(--fg-muted)" />
      <rect x="5" y="15.8" width="6" height="2.2" rx="1.1" fill="var(--steel)" opacity="0.7" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 rounded-md" aria-label="DevDock Ultra — на главную">
      <LogoMark />
      <span className="text-[0.95rem] font-semibold tracking-tight text-fg">
        DevDock<span className="ml-1 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-cyan">Ultra</span>
      </span>
    </Link>
  );
}
