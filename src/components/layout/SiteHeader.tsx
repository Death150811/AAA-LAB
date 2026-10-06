"use client";

import { Bookmark, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useUIStore } from "@/store/ui-store";
import { Logo } from "./Logo";

export interface HeaderDomain {
  slug: string;
  title: string;
  code: string;
  available: boolean;
}

const SECTIONS = ["learn", "projects", "practice", "exam", "interview"];

export function SiteHeader({ domains }: { domains: HeaderDomain[] }) {
  const pathname = usePathname();
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  // Меню «принадлежит» странице, на которой открыто: при навигации оно закрывается без эффекта.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menu = menuPath === pathname;
  const setMenu = (next: boolean | ((m: boolean) => boolean)) => {
    const value = typeof next === "function" ? next(menu) : next;
    setMenuPath(value ? pathname : null);
  };

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuPath(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const seg = pathname.split("/").filter(Boolean);
  const activeDomain = SECTIONS.includes(seg[0] ?? "") ? seg[1] : undefined;

  const linkCls = (active: boolean) =>
    cn(
      "relative px-2.5 py-1.5 text-[13px] font-medium transition-colors",
      active ? "text-fg" : "text-fg-muted hover:text-fg",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-line-strong bg-bg">
      <div className="mx-auto flex h-[var(--header-h)] max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Основная навигация" className="ml-4 hidden items-center gap-0.5 lg:flex">
          {domains.map((d) => {
            const active = activeDomain === d.slug;
            return (
              <Link key={d.slug} href={`/learn/${d.slug}`} data-domain={d.slug} className={cn(linkCls(active), "group/nav")} aria-current={active ? "page" : undefined}>
                {d.title === "Computer Science" ? "CS" : d.title}
                <span aria-hidden className={cn("absolute inset-x-2.5 -bottom-[17px] h-[2px] origin-left bg-accent transition-transform duration-300", active ? "scale-x-100" : "scale-x-0 group-hover/nav:scale-x-100")} />
              </Link>
            );
          })}
          <span aria-hidden className="mx-2 h-4 w-px bg-line-strong" />
          <Link href="/playground" className={linkCls(pathname.startsWith("/playground"))}>
            Песочница
          </Link>
          <Link href="/flashcards" className={linkCls(pathname.startsWith("/flashcards"))}>
            Карточки
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 items-center gap-2.5 rounded-[3px] border border-line-strong px-3 text-[13px] text-fg-muted transition-colors hover:border-fg-dim hover:text-fg"
            aria-label="Открыть поиск (Ctrl+K)"
          >
            <Search size={15} aria-hidden />
            <span className="hidden sm:inline">Поиск</span>
            <kbd className="hidden rounded-[2px] border border-line-strong px-1.5 py-px font-label text-[9px] text-fg-dim md:inline">
              Ctrl K
            </kbd>
          </button>
          <Link
            href="/me"
            className="hidden h-9 items-center gap-2 rounded-[3px] border border-line-strong px-3 text-[13px] text-fg-muted transition-colors hover:border-fg-dim hover:text-fg sm:flex"
          >
            <Bookmark size={15} aria-hidden />
            Моё
          </Link>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-[3px] border border-line-strong text-fg-muted hover:text-fg lg:hidden"
            aria-label={menu ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            onClick={() => setMenu((m) => !m)}
          >
            {menu ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menu && (
        <nav id="mobile-menu" aria-label="Мобильная навигация" className="border-t border-line bg-bg-raised lg:hidden">
          <ul className="m-0 grid list-none gap-0.5 p-3 sm:grid-cols-2">
            {domains.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/learn/${d.slug}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
                >
                  <span className="mono text-[11px] text-fg-dim">{d.code}</span>
                  <span className="flex-1">{d.title}</span>
                  {!d.available && <span className="eyebrow !text-[9px]">Готовится</span>}
                </Link>
              </li>
            ))}
            {[
              ["/playground", "Песочница"],
              ["/flashcards", "Карточки"],
              ["/me", "Моё: прогресс, заметки, закладки"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href!} className="block rounded-lg px-3 py-2.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
