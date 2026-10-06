"use client";

import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import { Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const btn =
  "inline-flex h-9 items-center rounded-[3px] border px-3 text-[13px] font-medium transition-colors";

/** Кнопки входа / аккаунт; для администратора — ссылка на /admin. Рисуется только при включённом слое входа. */
export default function AuthControls() {
  const { isLoaded, isSignedIn } = useAuth();
  const [role, setRole] = useState<string>("guest");

  useEffect(() => {
    if (!isSignedIn) return;
    let off = false;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { role?: string }) => {
        if (!off && d.role) setRole(d.role);
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [isSignedIn]);

  if (!isLoaded) return <span aria-hidden className="inline-block h-9 w-[7.5rem]" />;

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <SignInButton mode="modal">
          <button type="button" className={`${btn} border-line-strong text-fg-muted hover:border-fg-dim hover:text-fg`}>
            Войти
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button type="button" className={`${btn} hidden border-accent bg-accent font-semibold text-accent-ink hover:bg-accent/85 sm:inline-flex`}>
            Регистрация
          </button>
        </SignUpButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {role === "admin" && (
        <Link href="/admin" prefetch={false} className={`${btn} gap-1.5 border-line-strong text-accent-text hover:border-accent`}>
          <Shield size={14} aria-hidden /> Админка
        </Link>
      )}
      <UserButton />
    </div>
  );
}
