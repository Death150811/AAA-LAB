import { DomainMotif } from "@/components/motifs/DomainMotif";
import { domains } from "@/content/registry";
import type { Domain } from "@/content/types";
import { roman } from "@/lib/numerals";
import { DomainSubnav, type DomainTab } from "./DomainSubnav";

const TAB_LABEL: Record<DomainTab, string> = {
  learn: "Курс",
  projects: "Проекты",
  practice: "Практика",
  exam: "Экзамен",
  interview: "Собеседование",
};

/** Шапка вторичных разделов домена (проекты, практика, экзамен, собеседование): та же таблица, что и на странице курса. */
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
  const numeral = roman(domains.findIndex((d) => d.id === domain.id) + 1);
  return (
    <header className="pt-12 sm:pt-16">
      <div className="flex items-start justify-between gap-12">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="label text-accent-text">Таблица {numeral}</span>
            <span aria-hidden className="h-px w-8 bg-line-strong" />
            <span className="label text-fg-dim">
              {domain.title} · {TAB_LABEL[tab]}
            </span>
          </div>
          <h1 className="mt-5 font-display text-[clamp(2.3rem,5vw,4rem)] font-light leading-[1.02] tracking-[-0.03em] text-fg">{title}</h1>
          <p className="mt-5 max-w-2xl font-serif text-[1.12rem] leading-[1.65] text-fg-muted">{lead}</p>
        </div>
        <div aria-hidden className="hidden w-[17rem] shrink-0 border border-line bg-bg-raised/60 p-3 lg:block">
          <DomainMotif domain={domain.id} />
        </div>
      </div>
      <div className="mt-10">
        <DomainSubnav slug={domain.slug} active={tab} />
      </div>
    </header>
  );
}
