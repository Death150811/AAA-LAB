import type { ReactNode } from "react";

/** Шаблон пересоздаётся при каждой навигации: страница мягко проявляется вместо резкой смены. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-in">{children}</div>;
}
