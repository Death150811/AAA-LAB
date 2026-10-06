import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Accent } from "@/content/types";

/** Пигменты доменов: статичные классы (Tailwind должен видеть их целиком). */
export const ACCENT: Record<Accent, { text: string; border: string; bg: string; solid: string }> = {
  vermilion: { text: "text-vermilion", border: "border-vermilion/40", bg: "bg-vermilion/10", solid: "bg-vermilion" },
  lapis: { text: "text-lapis", border: "border-lapis/40", bg: "bg-lapis/10", solid: "bg-lapis" },
  gamboge: { text: "text-gamboge", border: "border-gamboge/40", bg: "bg-gamboge/10", solid: "bg-gamboge" },
  verdigris: { text: "text-verdigris", border: "border-verdigris/40", bg: "bg-verdigris/10", solid: "bg-verdigris" },
  madder: { text: "text-madder", border: "border-madder/40", bg: "bg-madder/10", solid: "bg-madder" },
  tyrian: { text: "text-tyrian", border: "border-tyrian/40", bg: "bg-tyrian/10", solid: "bg-tyrian" },
};

type BadgeTone = "neutral" | "accent" | "emerald" | "indigo" | "amber" | "rose";
const BADGE: Record<BadgeTone, string> = {
  neutral: "border-line-strong text-fg-muted bg-surface-2",
  accent: "border-accent/35 text-accent-text bg-accent/10",
  emerald: "border-emerald/35 text-emerald bg-emerald/10",
  indigo: "border-indigo/35 text-indigo bg-indigo/10",
  amber: "border-amber/35 text-amber bg-amber/10",
  rose: "border-rose/35 text-rose bg-rose/10",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-[3px] font-label text-[9.5px] font-medium uppercase leading-none tracking-wider",
        BADGE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-[3px] border text-sm font-medium transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";
const BTN: Record<"primary" | "secondary" | "ghost", string> = {
  primary: "border-accent bg-accent text-accent-ink hover:bg-accent/85 font-semibold",
  secondary: "border-line-strong bg-surface-2 text-fg hover:border-steel/60 hover:bg-surface-3",
  ghost: "border-transparent text-fg-muted hover:bg-surface-2 hover:text-fg",
};
const BTN_SIZE = { sm: "h-8 px-3", md: "h-10 px-4", lg: "h-12 px-6 text-[0.95rem]" } as const;

type BtnProps = { variant?: keyof typeof BTN; size?: keyof typeof BTN_SIZE; className?: string };

export function Button({ variant = "secondary", size = "md", className, ...rest }: BtnProps & ComponentProps<"button">) {
  return <button type="button" className={cn(BTN_BASE, BTN[variant], BTN_SIZE[size], className)} {...rest} />;
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  ...rest
}: BtnProps & ComponentProps<typeof Link>) {
  return <Link className={cn(BTN_BASE, BTN[variant], BTN_SIZE[size], className)} {...rest} />;
}

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-line bg-surface", className)} {...rest} />;
}

/** Карточка-ссылка с контролируемым подъёмом при наведении. */
export function CardLink({ className, ...rest }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "group block rounded-xl border border-line bg-surface transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-2",
        className,
      )}
      {...rest}
    />
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("eyebrow", className)}>{children}</div>;
}

export function ProgressBar({
  value,
  accent,
  label,
  className,
}: {
  value: number; // 0..1
  accent?: Accent;
  label: string;
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn("h-[3px] w-full overflow-hidden bg-line-strong", className)}
    >
      <div
        className={cn("h-full transition-[width] duration-700 ease-out", accent ? ACCENT[accent].solid : "bg-accent")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-surface/40 px-6 py-10 text-center">
      <p className="text-[0.98rem] font-medium text-fg">{title}</p>
      {children && <div className="mx-auto mt-1.5 max-w-md text-sm text-fg-muted">{children}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
