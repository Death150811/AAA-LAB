import { cn } from "@/lib/cn";
import type { TokenLine } from "@/lib/highlight-types";

/** Чистое представление строк кода (без состояния): используется и на сервере, и в клиентских компонентах. */
export function CodeLines({
  lines,
  showNumbers,
  highlighted,
}: {
  lines: TokenLine[];
  showNumbers: boolean;
  highlighted?: ReadonlySet<number>;
}) {
  return (
    <div className="scroll-x">
      <pre className="m-0 w-max min-w-full py-3 font-mono text-[13px] leading-[1.65]" tabIndex={0}>
        <code>
          {lines.map((line, i) => {
            const n = i + 1;
            const marked = highlighted?.has(n);
            const empty = line.length === 0 || (line.length === 1 && line[0]!.content === "");
            return (
              <span
                key={i}
                className={cn(
                  "flex px-4 transition-colors duration-200",
                  marked && "bg-cyan/10 shadow-[inset_2px_0_0_var(--cyan)]",
                )}
              >
                {showNumbers && (
                  <span aria-hidden className="mr-4 inline-block w-5 shrink-0 select-none text-right text-fg-dim tabular">
                    {n}
                  </span>
                )}
                <span className="whitespace-pre">
                  {empty
                    ? " "
                    : line.map((t, j) => (
                        <span
                          key={j}
                          style={{ color: t.color }}
                          className={cn(t.italic && "italic", t.bold && "font-semibold")}
                        >
                          {t.content}
                        </span>
                      ))}
                </span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
