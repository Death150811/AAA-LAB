import { cn } from "@/lib/cn";
import type { ResultSet } from "@/lib/sql-engine";

function Cell({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="italic text-fg-dim">NULL</span>;
  if (value instanceof Uint8Array) return <span className="italic text-fg-dim">[blob {value.length} Б]</span>;
  return <>{String(value)}</>;
}

/** Таблицы результатов запроса: общие для встроенных запросов в темах и для SQL-песочницы. */
export function SqlResultTables({ sets, max }: { sets: ResultSet[]; max: number }) {
  return (
    <>
      {sets.map((set, i) => (
        <div key={i} className="overflow-x-auto rounded-md border border-line">
          <table className="w-full border-collapse text-left font-mono text-xs">
            <caption className="sr-only">Результат {i + 1}</caption>
            <thead className="bg-surface-2 text-fg-muted">
              <tr>
                {set.columns.map((c, j) => (
                  <th key={j} scope="col" className="whitespace-nowrap border-b border-line px-3 py-1.5 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {set.values.slice(0, max).map((row, r) => (
                <tr key={r} className={cn(r % 2 === 1 && "bg-surface/50")}>
                  {row.map((v, c) => (
                    <td key={c} className="whitespace-nowrap px-3 py-1 text-fg">
                      <Cell value={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line px-3 py-1 text-[11px] text-fg-dim">
            {set.values.length} {set.values.length === 1 ? "строка" : "строк"}
            {set.values.length > max && ` (показаны первые ${max})`}
          </p>
        </div>
      ))}
    </>
  );
}
