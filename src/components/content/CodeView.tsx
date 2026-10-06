import { highlight } from "@/lib/highlight";
import { cn } from "@/lib/cn";
import { CodeLines } from "./CodeLines";
import type { CodeLang } from "@/content/types";
import { CopyButton } from "./CopyButton";
import { PlaygroundLink } from "./PlaygroundLink";
import { SqlRunner } from "./SqlRunner";
import { SQL_FIXTURES } from "@/content/sql/fixtures";

export const LANG_LABEL: Record<CodeLang, string> = {
  html: "HTML",
  css: "CSS",
  js: "JavaScript",
  ts: "TypeScript",
  json: "JSON",
  sql: "SQL",
  bash: "Shell",
  http: "HTTP",
  text: "Text",
  diff: "Diff",
  c: "C",
  python: "Python",
  yaml: "YAML",
};

interface Props {
  lang: CodeLang;
  code: string;
  filename?: string;
  caption?: string;
  highlight?: number[];
  lineNumbers?: boolean;
  runnable?: boolean;
  fixture?: string;
  collapsed?: boolean;
  /** Компактный вид внутри сравнения/решения. */
  bare?: boolean;
}

export async function CodeView({
  lang,
  code,
  filename,
  caption,
  highlight: hl = [],
  lineNumbers,
  runnable,
  fixture,
  collapsed,
  bare,
}: Props) {
  const lines = await highlight(code, lang);
  const showNumbers = lineNumbers ?? (!bare && lang !== "text" && lines.length > 6);
  const hlSet = new Set(hl);

  const body = <CodeLines lines={lines} showNumbers={showNumbers} highlighted={hlSet} />;

  const header = (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-3 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="eyebrow !text-[10px] text-fg-dim">{LANG_LABEL[lang]}</span>
        {filename && <span className="truncate font-mono text-xs text-fg-muted">{filename}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {runnable && lang === "html" && <PlaygroundLink code={code} />}
        <CopyButton text={code} />
      </div>
    </div>
  );

  const frame = (
    <figure
      className={cn(
        "m-0 overflow-hidden rounded-lg border border-line bg-code",
        bare && "rounded-md",
      )}
    >
      {header}
      {body}
      {runnable && lang === "sql" && <SqlRunner code={code} fixtureName={fixture} setup={fixture ? SQL_FIXTURES[fixture] : undefined} />}
      {caption && (
        <figcaption className="border-t border-line bg-surface px-4 py-2 text-[13px] leading-snug text-fg-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );

  if (collapsed) {
    return (
      <details className="group rounded-lg border border-line bg-surface/40">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm text-fg-muted marker:hidden hover:text-fg">
          <span>
            <span className="eyebrow mr-2">Пример</span>
            {filename ?? LANG_LABEL[lang]} · {lines.length} стр.
          </span>
          <span className="text-xs text-accent-text group-open:hidden">Показать</span>
          <span className="hidden text-xs text-accent-text group-open:inline">Скрыть</span>
        </summary>
        <div className="p-2 pt-0">{frame}</div>
      </details>
    );
  }
  return frame;
}
