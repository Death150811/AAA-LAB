import type { CSSProperties, ReactNode } from "react";
import type { DomainId } from "@/content/types";

/**
 * Шесть анимированных мотивов — по одному на домен. Каждый объясняет суть домена движением и цветом пигмента
 * (берётся из --accent, который задаёт [data-domain]). Анимации — чистый CSS (классы m-*, см. globals.css):
 * при prefers-reduced-motion остаётся статичная законченная картинка.
 */
const d = (s: number): CSSProperties => ({ ["--d" as string]: `${s}s` });
const T = ({ x, y, children, anchor = "middle", size = 8, fill = "var(--fg-dim)", style }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end"; size?: number; fill?: string; style?: CSSProperties }) => (
  <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={fill} fontFamily="var(--font-label)" letterSpacing="0.4" style={style}>
    {children}
  </text>
);

/* ───── HTML: дерево разбора растёт, затем парсер обходит его ───── */
const TREE: { tag: string; x: number; y: number; parent?: number }[] = [
  { tag: "html", x: 160, y: 24 },
  { tag: "head", x: 78, y: 70, parent: 0 },
  { tag: "body", x: 226, y: 70, parent: 0 },
  { tag: "meta", x: 38, y: 120, parent: 1 },
  { tag: "title", x: 112, y: 120, parent: 1 },
  { tag: "h1", x: 184, y: 120, parent: 2 },
  { tag: "ul", x: 268, y: 120, parent: 2 },
  { tag: "li", x: 238, y: 172, parent: 6 },
  { tag: "li", x: 298, y: 172, parent: 6 },
];
function HtmlMotif() {
  return (
    <>
      {TREE.map((n, i) => {
        if (n.parent === undefined) return null;
        const p = TREE[n.parent]!;
        return <line key={`e${i}`} x1={p.x} y1={p.y + 9} x2={n.x} y2={n.y - 9} pathLength={1} stroke="var(--accent)" strokeOpacity="0.7" strokeWidth="1.2" className="m-line" style={d(0.15 + i * 0.3)} />;
      })}
      {TREE.map((n, i) => (
        <g key={`n${i}`}>
          <g className="m-in" style={d(0.3 + i * 0.3)}>
            <rect x={n.x - 22} y={n.y - 9} width="44" height="18" rx="2" fill="var(--bg)" stroke="var(--accent)" strokeWidth="1.2" />
            <T x={n.x} y={n.y + 3} size={8.5} fill="var(--fg)">
              {`<${n.tag}>`}
            </T>
          </g>
          <rect x={n.x - 25} y={n.y - 12} width="50" height="24" rx="3" fill="none" stroke="var(--accent)" strokeWidth="1.6" className="m-flash" style={d(3.4 + i * 0.4)} />
        </g>
      ))}
    </>
  );
}

/* ───── CSS: слои блочной модели и гибкая строка ───── */
function CssMotif() {
  const bars = [
    { y: 52, w: 100, d: 0 },
    { y: 84, w: 70, d: 0.4 },
    { y: 116, w: 40, d: 0.8 },
  ];
  return (
    <>
      <g className="m-in" style={d(0.1)}>
        <rect x="18" y="26" width="148" height="148" fill="none" stroke="var(--fg-dim)" strokeWidth="1" strokeDasharray="3 4" />
        <rect x="18" y="26" width="148" height="148" className="hatch" fill="var(--accent)" fillOpacity="0.05" />
        <T x={24} y={37} anchor="start">margin</T>
      </g>
      <g className="m-in" style={d(0.7)}>
        <rect x="36" y="44" width="112" height="112" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2.4" />
        <T x={42} y={55} anchor="start" fill="var(--accent-text)">border</T>
      </g>
      <g className="m-in" style={d(1.3)}>
        <rect x="42" y="50" width="100" height="100" fill="var(--accent)" fillOpacity="0.16" />
        <T x={48} y={66} anchor="start">padding</T>
      </g>
      <g className="m-in" style={d(1.9)}>
        <rect x="62" y="72" width="60" height="56" fill="var(--accent)" fillOpacity="0.9" />
        <T x={92} y={104} fill="var(--accent-ink)" size={8.5}>content</T>
      </g>
      {/* Flexbox: ширина делится по flex-grow */}
      <T x={188} y={40} anchor="start">display: flex</T>
      {bars.map((b, i) => (
        <g key={i}>
          <rect x="188" y={b.y - 10} width="120" height="20" fill="none" stroke="var(--line-strong)" strokeWidth="1" />
          <rect x="188" y={b.y - 10} width={b.w} height="20" fill="var(--accent)" fillOpacity={0.35 + i * 0.2} className="m-flex" style={{ ...d(2.2 + b.d), transformOrigin: "188px center" }} />
        </g>
      ))}
      <T x={188} y={150} anchor="start">flex: 1 1 0</T>
      <g className="m-in" style={d(3)}>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <rect key={k} x={188 + (k % 3) * 42} y={160 + Math.floor(k / 3) * 14} width="38" height="10" fill="var(--accent)" fillOpacity={k === 1 || k === 4 ? 0.8 : 0.25} />
        ))}
      </g>
    </>
  );
}

/* ───── JS: стек вызовов, микрозадачи, задачи и цикл событий ───── */
function JsMotif() {
  return (
    <>
      <T x={18} y={20} anchor="start">call stack</T>
      <rect x="18" y="28" width="76" height="144" fill="none" stroke="var(--line-strong)" strokeWidth="1" />
      <rect x="22" y="146" width="68" height="22" fill="var(--bg)" stroke="var(--fg-dim)" />
      <T x={56} y={160} fill="var(--fg-muted)">main()</T>
      <g className="m-frame" style={d(0.8)}>
        <rect x="22" y="120" width="68" height="22" fill="var(--accent)" fillOpacity="0.9" />
        <T x={56} y={134} fill="var(--accent-ink)">f()</T>
      </g>
      <g className="m-frame" style={d(1.1)}>
        <rect x="22" y="94" width="68" height="22" fill="var(--accent)" fillOpacity="0.55" />
        <T x={56} y={108} fill="var(--fg)">g()</T>
      </g>
      <T x={118} y={46} anchor="start">microtasks</T>
      <line x1="118" y1="54" x2="310" y2="54" stroke="var(--line-strong)" />
      <T x={118} y={104} anchor="start">tasks</T>
      <line x1="118" y1="112" x2="310" y2="112" stroke="var(--line-strong)" />
      <rect x="118" y="45" width="22" height="18" fill="var(--accent)" className="m-token-a" style={d(0)} />
      <rect x="118" y="103" width="22" height="18" fill="none" stroke="var(--accent)" strokeWidth="1.6" className="m-token-b" style={d(0)} />
      <g transform="translate(210 154)">
        <circle r="17" fill="none" stroke="var(--line-strong)" />
        <circle r="17" fill="none" stroke="var(--accent)" strokeWidth="2" pathLength={1} strokeDasharray="0.28 0.72" className="m-spin" />
        <T x={0} y={3} size={7}>loop</T>
      </g>
      <T x={252} y={158} anchor="start">event</T>
      <T x={252} y={168} anchor="start">loop</T>
    </>
  );
}

/* ───── SQL: соединение двух таблиц по ключу ───── */
function SqlMotif() {
  const left = [1, 2, 3];
  const right = [1, 3, 5];
  const res: [string, string][] = [["1", "1"], ["2", "NULL"], ["3", "3"]];
  return (
    <>
      <T x={14} y={26} anchor="start">A</T>
      <T x={124} y={26} anchor="start">B</T>
      <T x={232} y={26} anchor="start">A LEFT JOIN B</T>
      {left.map((v, i) => (
        <g key={`l${i}`} className="m-in" style={d(0.1 + i * 0.15)}>
          <rect x="14" y={36 + i * 34} width="64" height="26" fill="var(--bg)" stroke="var(--fg-dim)" />
          <T x={46} y={53 + i * 34} fill="var(--fg)" size={10}>{v}</T>
        </g>
      ))}
      {right.map((v, i) => (
        <g key={`r${i}`} className="m-in" style={d(0.3 + i * 0.15)}>
          <rect x="124" y={36 + i * 34} width="64" height="26" fill="var(--bg)" stroke="var(--fg-dim)" />
          <T x={156} y={53 + i * 34} fill="var(--fg)" size={10}>{v}</T>
        </g>
      ))}
      <line x1="78" y1="49" x2="124" y2="49" pathLength={1} stroke="var(--accent)" strokeWidth="1.6" className="m-line" style={d(1.0)} />
      <line x1="78" y1="117" x2="124" y2="87" pathLength={1} stroke="var(--accent)" strokeWidth="1.6" className="m-line" style={d(1.5)} />
      <line x1="78" y1="83" x2="124" y2="83" pathLength={1} stroke="var(--fg-dim)" strokeWidth="1.2" strokeDasharray="3 3" className="m-line-dash" style={d(2.0)} />
      {res.map(([a, b], i) => (
        <g key={`o${i}`} className="m-slide" style={d(2.3 + i * 0.5)}>
          <rect x="232" y={36 + i * 34} width="38" height="26" fill="var(--accent)" fillOpacity={b === "NULL" ? 0.25 : 0.9} />
          <rect x="270" y={36 + i * 34} width="38" height="26" fill="var(--accent)" fillOpacity={b === "NULL" ? 0.08 : 0.5} stroke={b === "NULL" ? "var(--accent)" : "none"} strokeDasharray="3 3" />
          <T x={251} y={53 + i * 34} fill={b === "NULL" ? "var(--fg)" : "var(--accent-ink)"} size={10}>{a}</T>
          <T x={289} y={53 + i * 34} fill="var(--fg)" size={b === "NULL" ? 7.5 : 10}>{b}</T>
        </g>
      ))}
      <T x={160} y={160} size={7.5}>ON A.id = B.id</T>
    </>
  );
}

/* ───── Git: ветка, слияние, коммит-слияние ───── */
function GitMotif() {
  const c = (x: number, y: number, delay: number, hash: string, merge = false) => (
    <g key={hash} className="m-in" style={d(delay)}>
      <circle cx={x} cy={y} r={merge ? 8 : 6.5} fill={merge ? "var(--accent)" : "var(--bg)"} stroke="var(--accent)" strokeWidth="2" />
      <T x={x} y={y + 21} size={7.5}>{hash}</T>
    </g>
  );
  return (
    <>
      <T x={14} y={22} anchor="start">main</T>
      <T x={118} y={44} anchor="start">feature</T>
      <path d="M24 118 H296" pathLength={1} fill="none" stroke="var(--fg-dim)" strokeWidth="1.5" className="m-line" style={d(0.1)} />
      <path d="M84 118 C104 118 110 66 136 66 H212" pathLength={1} fill="none" stroke="var(--accent)" strokeWidth="1.8" className="m-line" style={d(1.0)} />
      <path d="M212 66 C246 66 258 118 288 118" pathLength={1} fill="none" stroke="var(--accent)" strokeWidth="1.8" className="m-line" style={d(2.3)} />
      {c(30, 118, 0.2, "a3f9c1")}
      {c(84, 118, 0.6, "7be21d")}
      {c(166, 118, 1.4, "c04e8a")}
      {c(136, 66, 1.5, "5d1f37")}
      {c(212, 66, 2.1, "e90b2c")}
      {c(288, 118, 3.1, "merge", true)}
      <T x={288} y={96} size={7.5} fill="var(--accent-text)">2 parents</T>
    </>
  );
}

/* ───── CS: двоичный счётчик и лента машины ───── */
function CsMotif() {
  const bits = [7, 6, 5, 4, 3, 2, 1, 0];
  return (
    <>
      <T x={16} y={24} anchor="start">tape</T>
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={16 + i * 25} y={32} width="22" height="22" fill="none" stroke="var(--line-strong)" />
      ))}
      <path d="M0 -7 L7 0 L-7 0 Z" transform="translate(27 66)" fill="var(--accent)" className="m-head" />
      <T x={16} y={104} anchor="start">binary counter</T>
      {bits.map((k, i) => (
        <g key={k}>
          <rect x={16 + i * 37} y={112} width="32" height="32" fill="none" stroke="var(--fg-dim)" />
          <rect
            x={16 + i * 37}
            y={112}
            width="32"
            height="32"
            fill="var(--accent)"
            className={k <= 5 ? "m-bit" : undefined}
            style={k <= 5 ? ({ ["--p" as string]: `${0.6 * 2 ** (k + 1)}s` } as CSSProperties) : { opacity: 0 }}
          />
          <T x={32 + i * 37} y={158} size={7.5}>{2 ** k}</T>
        </g>
      ))}
    </>
  );
}

const MOTIFS: Record<DomainId, () => ReactNode> = { html: HtmlMotif, css: CssMotif, js: JsMotif, sql: SqlMotif, git: GitMotif, cs: CsMotif };
const LABEL: Record<DomainId, string> = {
  html: "Дерево разбора документа",
  css: "Блочная модель и гибкая раскладка",
  js: "Стек, очереди и цикл событий",
  sql: "Соединение таблиц по ключу",
  git: "Ветка, слияние, коммит с двумя родителями",
  cs: "Биты и лента машины",
};

/** Анимированный мотив домена. Пигмент берётся из ближайшего [data-domain]. */
export function DomainMotif({ domain, className }: { domain: DomainId; className?: string }) {
  const Motif = MOTIFS[domain];
  return (
    <svg viewBox="0 0 320 190" role="img" aria-label={LABEL[domain]} className={className ?? "block h-auto w-full"}>
      <Motif />
    </svg>
  );
}
