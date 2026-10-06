"use client";

import { ListTree, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Трёхколоночная раскладка темы: программа курса | документ | инструменты.
 * Ниже lg программа становится выезжающей панелью, ниже xl инструменты уходят под документ.
 */
export function TopicShell({
  nav,
  rail,
  children,
  navLabel,
}: {
  nav: ReactNode;
  rail: ReactNode;
  children: ReactNode;
  navLabel: string;
}) {
  const pathname = usePathname();
  // Панель привязана к странице, на которой открыта: при навигации закрывается без эффекта.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = (v: boolean) => setOpenPath(v ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPath(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[16.5rem_minmax(0,1fr)_18.5rem] xl:gap-12">
      {/* Мобильная панель переключения программы */}
      <div className="sticky top-[var(--header-h)] z-30 -mx-4 border-b border-line bg-bg/90 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="curriculum-panel"
          className="flex h-9 items-center gap-2 rounded-[3px] border border-line bg-surface px-3 text-[13px] text-fg-muted hover:text-fg"
        >
          <ListTree size={15} aria-hidden />
          {navLabel}
        </button>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Закрыть программу курса"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-black/60 lg:hidden"
        />
      )}

      <aside
        id="curriculum-panel"
        className={cn(
          "z-50 border-line bg-bg-raised",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:w-[min(22rem,88vw)] max-lg:overflow-y-auto max-lg:border-r max-lg:p-4 max-lg:transition-[transform,visibility] max-lg:duration-300",
          open ? "max-lg:translate-x-0 max-lg:visible" : "max-lg:-translate-x-full max-lg:invisible",
          "lg:sticky lg:top-[calc(var(--header-h)+1.25rem)] lg:z-auto lg:max-h-[calc(100dvh-var(--header-h)-2.5rem)] lg:self-start lg:overflow-y-auto lg:bg-transparent lg:py-6 lg:pr-1",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Закрыть"
          className="mb-3 grid h-8 w-8 place-items-center rounded-md border border-line text-fg-muted lg:hidden"
        >
          <X size={16} />
        </button>
        {nav}
      </aside>

      <div className="min-w-0 xl:col-span-2 xl:grid xl:grid-cols-[minmax(0,1fr)_18.5rem] xl:gap-12">
        {children}
        <aside
          aria-label="Инструменты темы"
          className="mt-14 border-t border-line pt-8 xl:sticky xl:top-[calc(var(--header-h)+1.25rem)] xl:mt-0 xl:max-h-[calc(100dvh-var(--header-h)-2.5rem)] xl:self-start xl:overflow-y-auto xl:border-0 xl:py-8 xl:pt-8"
        >
          {rail}
        </aside>
      </div>
    </div>
  );
}
