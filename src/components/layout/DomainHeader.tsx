import type { Domain } from "@/content/types";
import { ACCENT } from "@/components/ui/primitives";
import { DomainSubnav, type DomainTab } from "./DomainSubnav";

/** Компактная шапка вторичных разделов домена (проекты, практика, экзамен, собеседование). */
export function DomainHeader({
  domain,
  tab,
  title,
  lead,
}: {
  domain: Domain;
  tab: DomainTab;
  title: string;
  lead: string;
}) {
  const a = ACCENT[domain.accent];
  return (
    <header className="pt-10 sm:pt-14">
      <div className="flex items-center gap-3">
        <span className={`mono text-sm tabular ${a.text}`}>DOMAIN {domain.code}</span>
        <span aria-hidden className="h-px w-8 bg-line-strong" />
        <span className="mono text-xs text-fg-dim">{domain.title}</span>
      </div>
      <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-fg sm:text-[2.5rem]">{title}</h1>
      <p className="mt-3 max-w-2xl text-[1.02rem] leading-relaxed text-fg-muted">{lead}</p>
      <div className="mt-8">
        <DomainSubnav slug={domain.slug} active={tab} />
      </div>
    </header>
  );
}
