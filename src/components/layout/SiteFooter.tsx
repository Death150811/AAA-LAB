import Link from "next/link";
import { LogoMark } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-sm text-fg-muted">
          <LogoMark size={20} />
          <span>DevDock Ultra — персональная инженерная система знаний</span>
        </div>
        <nav aria-label="Служебные ссылки" className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-fg-dim">
          <Link href="/learn" className="hover:text-fg">Программа</Link>
          <Link href="/playground" className="hover:text-fg">Песочница</Link>
          <Link href="/flashcards" className="hover:text-fg">Карточки</Link>
          <Link href="/me" className="hover:text-fg">Мой прогресс</Link>
        </nav>
      </div>
    </footer>
  );
}
