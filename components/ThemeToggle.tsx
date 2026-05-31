"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "aap-theme";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  // Light is the default token set (no attribute); dark opts in via [data-theme="dark"].
  document.documentElement.dataset.theme = theme === "dark" ? "dark" : "";
}

export default function ThemeToggle() {
  // Default to light. `mounted` gates the icon swap so SSR (always light) and the
  // first client paint agree, avoiding a hydration mismatch before we read storage.
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    const next: Theme = stored === "dark" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable (private mode); theme still applies for this session */
    }
  }

  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-surface text-ink-muted transition-colors duration-[130ms] hover:bg-surface-2 hover:text-ink"
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
