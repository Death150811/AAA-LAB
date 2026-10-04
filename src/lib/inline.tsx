import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Мини-разметка в текстовых полях контента: `код`, **жирный**, *курсив*, [текст](url).
 * Реализовано вручную (без HTML-строк и dangerouslySetInnerHTML): контент рендерится как React-узлы,
 * поэтому XSS через текст невозможен.
 */
type Matcher = { re: RegExp; build: (m: RegExpExecArray, key: string) => ReactNode };

const matchers: Matcher[] = [
  { re: /`([^`]+)`/, build: (m, key) => <code key={key}>{m[1]}</code> },
  { re: /\*\*(.+?)\*\*/, build: (m, key) => <strong key={key}>{parse(m[1]!, key)}</strong> },
  {
    re: /(?<![\w*])\*(?![\s*])(.+?)(?<![\s*])\*(?![\w*])/,
    build: (m, key) => <em key={key}>{parse(m[1]!, key)}</em>,
  },
  {
    re: /\[([^\]]+)\]\(([^)\s]+)\)/,
    build: (m, key) => {
      const href = m[2]!;
      if (href.startsWith("/")) {
        return (
          <Link key={key} href={href}>
            {parse(m[1]!, key)}
          </Link>
        );
      }
      return (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer">
          {parse(m[1]!, key)}
        </a>
      );
    },
  },
];

function parse(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;
  let n = 0;
  while (rest.length) {
    let best: { index: number; m: RegExpExecArray; matcher: Matcher } | null = null;
    for (const matcher of matchers) {
      const m = matcher.re.exec(rest);
      if (m && (best === null || m.index < best.index)) best = { index: m.index, m, matcher };
    }
    if (!best) {
      out.push(rest);
      break;
    }
    if (best.index > 0) out.push(rest.slice(0, best.index));
    out.push(best.matcher.build(best.m, `${keyBase}-${n++}`));
    rest = rest.slice(best.index + best.m[0].length);
  }
  return out;
}

export function Inline({ text }: { text: string }) {
  return <>{parse(text, "i")}</>;
}

/** Текст без разметки — для индекса поиска и aria-атрибутов. */
export function stripInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(?<![\w*])\*(?![\s*])(.+?)(?<![\s*])\*(?![\w*])/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}
