import Link from "next/link";
import { LogoMark } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line-strong bg-bg-raised">
      <div className="mx-auto grid max-w-[1360px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark size={22} />
            <span className="font-display text-[1.3rem] font-medium tracking-[-0.01em]">DevDock</span>
          </div>
          <p className="mt-4 max-w-md font-serif text-[0.98rem] leading-relaxed text-fg-muted">
            Атлас инженерных знаний: HTML, CSS, JavaScript, SQL, Git и Computer Science — в одной связанной системе.
          </p>
        </div>
        <nav aria-label="Служебные ссылки" className="flex flex-wrap gap-x-7 gap-y-2 text-[13px] text-fg-muted">
          <Link href="/learn" className="hover:text-fg">Программа</Link>
          <Link href="/playground" className="hover:text-fg">Песочницы</Link>
          <Link href="/flashcards" className="hover:text-fg">Карточки</Link>
          <Link href="/me" className="hover:text-fg">Мой прогресс</Link>
        </nav>
      </div>
    </footer>
  );
}
