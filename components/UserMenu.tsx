"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";

const AUTH_ON = process.env.NEXT_PUBLIC_WORKOS_AUTH_ENABLED === "1";

function UserMenuInner() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <span className="inline-flex min-h-9 items-center rounded-pill border border-border bg-surface px-3 text-2xs text-ink-faint">
        …
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-border bg-surface px-3 text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors duration-fast"
      >
        <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
        Sign in
      </Link>
    );
  }

  const label = user.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName[0]}.` : ""}`
    : user.email;

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex min-h-9 max-w-[10rem] items-center gap-1.5 truncate rounded-pill border border-border bg-surface px-3 text-xs text-ink-muted">
        <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <a
        href="/logout"
        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-border text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors duration-fast"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  );
}

export default function UserMenu() {
  if (!AUTH_ON) return null;
  return <UserMenuInner />;
}
