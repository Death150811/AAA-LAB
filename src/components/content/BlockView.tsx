import { AlertOctagon, Check, Info, Lightbulb, Sparkles, TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Block, CalloutBlock } from "@/content/types";
import { cn } from "@/lib/cn";
import { Inline } from "@/lib/inline";
import { highlight } from "@/lib/highlight";
import { AnnotatedCode } from "./AnnotatedCode";
import { CodeView, LANG_LABEL } from "./CodeView";

const CALLOUT: Record<
  CalloutBlock["tone"],
  { icon: ReactNode; label: string; border: string; bg: string; fg: string }
> = {
  note: { icon: <Info size={15} />, label: "Заметка", border: "border-l-steel", bg: "bg-steel/[0.07]", fg: "text-steel" },
  tip: { icon: <Lightbulb size={15} />, label: "Практика", border: "border-l-emerald", bg: "bg-emerald/[0.07]", fg: "text-emerald" },
  warning: { icon: <TriangleAlert size={15} />, label: "Осторожно", border: "border-l-amber", bg: "bg-amber/[0.07]", fg: "text-amber" },
  danger: { icon: <AlertOctagon size={15} />, label: "Опасно", border: "border-l-rose", bg: "bg-rose/[0.07]", fg: "text-rose" },
  insight: { icon: <Sparkles size={15} />, label: "Ключевая идея", border: "border-l-accent", bg: "bg-accent/[0.08]", fg: "text-accent-text" },
};

export async function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "p":
      return (
        <p>
          <Inline text={block.text} />
        </p>
      );

    case "h":
      return (
        <h3 className="!mt-8 font-display text-[1.3rem] font-medium leading-snug tracking-[-0.005em] text-fg">
          {block.text}
        </h3>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag>
          {block.items.map((item, i) => (
            <li key={i}>
              <Inline text={item} />
            </li>
          ))}
        </Tag>
      );
    }

    case "code":
      return (
        <CodeView
          lang={block.lang}
          code={block.code}
          filename={block.filename}
          caption={block.caption}
          highlight={block.highlight}
          lineNumbers={block.lineNumbers}
          runnable={block.runnable}
          fixture={block.fixture}
          collapsed={block.collapsed}
        />
      );

    case "callout": {
      const c = CALLOUT[block.tone];
      return (
        <div
          role="note"
          className={cn("border-l-[3px] py-3.5 pl-5 pr-4", c.border, c.bg)}
          aria-label={block.title ?? c.label}
        >
          <div className={cn("mb-2 flex items-center gap-2 font-label text-[10.5px] font-medium uppercase tracking-[0.14em]", c.fg)}>
            {c.icon}
            <span>{block.title ?? c.label}</span>
          </div>
          <div className="text-[0.97rem] leading-relaxed text-fg-body">
            <Inline text={block.text} />
          </div>
        </div>
      );
    }

    case "table":
      return (
        <div className="scroll-x rounded-[3px] border border-line" tabIndex={0}>
          <table className="w-full min-w-[32rem] border-collapse text-left text-[0.92rem]">
            {block.caption && (
              <caption className="border-b border-line bg-surface px-4 py-2 text-left text-[13px] text-fg-muted">
                {block.caption}
              </caption>
            )}
            <thead>
              <tr className="bg-surface-2">
                {block.head.map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="border-b border-line-strong px-4 py-2.5 font-label text-[10px] font-medium uppercase tracking-[0.12em] text-fg-muted"
                  >
                    {h.trim() ? <Inline text={h} /> : <span className="sr-only">Строка</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-b border-line last:border-0 odd:bg-surface/40">
                  {row.map((cell, c) => (
                    <td key={c} className="px-4 py-2.5 align-top leading-snug text-fg-body">
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "definition":
      return (
        <div className="border-y border-line-strong border-l-[3px] border-l-accent bg-surface/60 py-4 pl-5 pr-5">
          <div className="mb-1.5 flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-[1.6rem] font-normal leading-tight tracking-[-0.01em] text-fg">{block.term}</span>
            {block.en && <span className="font-label text-[11px] text-fg-dim">{block.en}</span>}
          </div>
          <p className="!mt-0 text-[1.04rem] leading-relaxed text-fg-body">
            <Inline text={block.text} />
          </p>
        </div>
      );

    case "compare": {
      const badLabel = block.variant === "wrong-right" ? "Неправильно" : "До";
      const goodLabel = block.variant === "wrong-right" ? "Правильно" : "После";
      return (
        <div className="grid gap-3 lg:grid-cols-2">
          <CompareCard tone="bad" label={block.bad.title ?? badLabel} side={block.bad} />
          <CompareCard tone="good" label={block.good.title ?? goodLabel} side={block.good} />
        </div>
      );
    }

    case "annotated":
      return (
        <AnnotatedCode
          lines={await highlight(block.code, block.lang)}
          raw={block.code}
          notes={block.notes}
          filename={block.filename}
          label={LANG_LABEL[block.lang]}
        />
      );

    case "steps":
      return (
        <div className="rounded-[3px] border border-line bg-surface/40 px-5 py-4">
          {block.title && <div className="eyebrow mb-3">{block.title}</div>}
          <ol className="!m-0 !list-none !p-0">
            {block.items.map((s, i) => (
              <li key={i} className="relative !mt-0 flex gap-4 pb-4 last:pb-0">
                {i < block.items.length - 1 && (
                  <span aria-hidden className="absolute left-[13px] top-8 bottom-0 w-px bg-line-strong" />
                )}
                <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center border border-accent/60 bg-bg font-label text-[11px] text-accent-text tabular">
                  {i + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <div className="font-semibold text-fg">{s.title}</div>
                  <div className="mt-0.5 text-[0.95rem] leading-relaxed text-fg-muted">
                    <Inline text={s.text} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      );

    case "diagram":
      return (
        <figure className="m-0 overflow-hidden rounded-[3px] border border-line bg-code">
          <div className="scroll-x">
            <pre
              className="m-0 w-max min-w-full px-5 py-4 font-mono text-[12.5px] leading-[1.55] text-code-fg"
              tabIndex={0}
              aria-label={block.caption ?? "Схема"}
            >
              {block.text}
            </pre>
          </div>
          {block.caption && (
            <figcaption className="border-t border-line bg-surface px-4 py-2 text-[13px] text-fg-muted">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
  }
}

function CompareCard({
  tone,
  label,
  side,
}: {
  tone: "bad" | "good";
  label: string;
  side: { lang: import("@/content/types").CodeLang; code: string; note: string };
}) {
  const bad = tone === "bad";
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2.5 rounded-[3px] border p-3",
        bad ? "border-rose/30 bg-rose/[0.04]" : "border-emerald/30 bg-emerald/[0.04]",
      )}
    >
      <div className={cn("flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider", bad ? "text-rose" : "text-emerald")}>
        {bad ? <X size={14} aria-hidden /> : <Check size={14} aria-hidden />}
        {label}
      </div>
      <CodeView lang={side.lang} code={side.code} bare />
      <p className="!mt-0 px-0.5 text-[0.93rem] leading-relaxed text-fg-muted">
        <Inline text={side.note} />
      </p>
    </div>
  );
}
