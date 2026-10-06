import type { ReactNode } from "react";

/** Пигмент домена задаёт акцент всей страницы (см. [data-domain] в globals.css). */
export default async function DomainLayout({ children, params }: { children: ReactNode; params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  return <div data-domain={domain}>{children}</div>;
}
