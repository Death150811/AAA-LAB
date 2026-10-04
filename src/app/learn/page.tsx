import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { CardLink, ProgressBar, ACCENT, Badge } from "@/components/ui/primitives";
import { domains } from "@/content/registry";

export const metadata: Metadata = {
  title: "Программа",
  description: "Шесть доменов знаний: HTML, CSS, JavaScript, SQL, Git и Computer Science.",
};

export default function LearnIndex() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-14 sm:px-6">
      <div className="eyebrow">Программа</div>
      <h1 className="mt-3 text-[2.2rem] font-semibold tracking-tight">Шесть доменов знаний</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">
        Рекомендуемый порядок: HTML → CSS → JavaScript → SQL → Git, с Computer Science как параллельным фундаментом.
        Курсы, у которых ещё нет опубликованных тем, помечены «Готовится»: их программа утверждена, но содержание не
        выдаётся за готовое.
      </p>
      <ul className="m-0 mt-10 list-none space-y-4 p-0">
        {domains.map((d) => {
          const topics = d.modules.reduce((n, m) => n + m.topics.length, 0);
          const a = ACCENT[d.accent];
          return (
            <li key={d.id}>
              <CardLink href={`/learn/${d.slug}`} className="p-6">
                <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
                  <span className={`mono mt-1.5 text-sm tabular ${a.text}`}>{d.code}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <h2 className="text-2xl font-semibold tracking-tight">{d.title}</h2>
                      <span className="mono text-xs text-fg-dim">{d.subtitle}</span>
                    </div>
                    <p className="mt-2 max-w-2xl text-[0.95rem] text-fg-muted">{d.tagline}</p>
                    <p className="mt-3 text-[13px] text-fg-dim">
                      {d.modules.map((m) => m.title).join(" · ")}
                    </p>
                  </div>
                  <div className="flex w-full items-center gap-4 md:w-56 md:flex-col md:items-end md:gap-2">
                    {topics > 0 ? (
                      <Badge tone="emerald">{topics} тем</Badge>
                    ) : (
                      <Badge tone="amber">Готовится</Badge>
                    )}
                    <ProgressBar value={d.modules.filter((m) => m.topics.length > 0).length / d.modules.length} accent={d.accent} label={`Готовность ${d.title}`} className="flex-1 md:w-full" />
                    <span className="hidden items-center gap-1 text-xs text-fg-muted group-hover:text-fg md:flex">
                      Открыть <ArrowRight size={12} aria-hidden />
                    </span>
                  </div>
                </div>
              </CardLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
