import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { DomainMotif } from "@/components/motifs/DomainMotif";
import { ProgressBar } from "@/components/ui/primitives";
import { domains } from "@/content/registry";
import { roman } from "@/lib/numerals";

export const metadata: Metadata = {
  title: "Программа",
  description: "Шесть доменов знаний: HTML, CSS, JavaScript, SQL, Git и Computer Science.",
};

export default function LearnIndex() {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-14 sm:px-6">
      <div className="eyebrow">Программа</div>
      <h1 className="mt-4 font-display text-[clamp(2.3rem,5vw,3.6rem)] font-light leading-[1.04] tracking-[-0.03em]">
        Шесть доменов <em className="italic text-fg-muted">знаний</em>
      </h1>
      <p className="mt-5 max-w-2xl font-serif text-[1.12rem] leading-[1.65] text-fg-muted">
        Рекомендуемый порядок: HTML → CSS → JavaScript → SQL → Git, с Computer Science как параллельным фундаментом.
        Курсы, у которых ещё нет опубликованных тем, помечены «Готовится»: их программа утверждена, но содержание не
        выдаётся за готовое.
      </p>
      <ul className="m-0 mt-12 list-none border-b border-line-strong p-0">
        {domains.map((d, i) => {
          const topics = d.modules.reduce((n, m) => n + m.topics.length, 0);
          return (
            <li key={d.id} data-domain={d.id} className="border-t border-line-strong">
              <Link
                href={`/learn/${d.slug}`}
                className="group relative -mx-4 grid gap-x-10 gap-y-6 px-4 py-9 transition-colors hover:bg-surface/50 sm:-mx-5 sm:px-5 lg:grid-cols-[5.5rem_minmax(0,1fr)_17rem]"
              >
                <span aria-hidden className="absolute left-0 top-0 h-full w-[2px] origin-top scale-y-0 bg-accent transition-transform duration-300 group-hover:scale-y-100" />
                <span aria-hidden className="font-display text-[3.4rem] font-light leading-[0.85] text-accent-text/70 lg:text-[4.2rem]">
                  {roman(i + 1)}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h2 className="font-display text-[clamp(2rem,3.6vw,2.8rem)] font-light leading-none tracking-[-0.025em] text-fg">{d.title}</h2>
                    <span className="font-display text-[1.05rem] italic text-fg-dim">{d.subtitle}</span>
                  </div>
                  <p className="mt-3 max-w-2xl font-serif text-[1.05rem] leading-relaxed text-fg-muted">{d.tagline}</p>
                  <p className="mt-4 max-w-3xl text-[13px] leading-relaxed text-fg-dim">{d.modules.map((m) => m.title).join(" · ")}</p>
                  <div className="mt-5 flex items-center gap-5">
                    {topics > 0 ? (
                      <span className="label text-accent-text">{topics} тем</span>
                    ) : (
                      <span className="label border border-amber/40 px-2 py-1 text-amber">Готовится</span>
                    )}
                    <ProgressBar
                      value={d.modules.filter((m) => m.topics.length > 0).length / d.modules.length}
                      accent={d.accent}
                      label={`Готовность ${d.title}`}
                      className="max-w-[14rem] flex-1"
                    />
                    <span className="inline-flex items-center gap-1.5 text-[0.9rem] text-accent-text">
                      Открыть <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
                <div aria-hidden className="hidden self-start border border-line bg-bg-raised/60 p-3 lg:block">
                  <DomainMotif domain={d.id} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
