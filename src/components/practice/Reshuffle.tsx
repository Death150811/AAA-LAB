"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

const newSeed = () => Math.floor(Math.random() * 1_000_000);

/** Форма параметров: перед отправкой подставляет новый seed (случайность — только в обработчике события). */
export function SeedForm({ children, ...rest }: Omit<ComponentProps<"form">, "method" | "onSubmit">) {
  return (
    <form
      method="get"
      onSubmit={(e) => {
        const input = e.currentTarget.elements.namedItem("seed");
        if (input instanceof HTMLInputElement) input.value = String(newSeed());
      }}
      {...rest}
    >
      {children}
    </form>
  );
}

/** Ссылка «другой вариант»: те же фильтры, новый seed. */
export function ReshuffleLink({ children, className }: { children: ReactNode; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const next = new URLSearchParams(params.toString());
        next.set("seed", String(newSeed()));
        router.push(`${pathname}?${next.toString()}`);
      }}
    >
      {children}
    </button>
  );
}
