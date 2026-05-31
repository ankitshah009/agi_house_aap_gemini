"use client";

import { Database, Zap, Radio } from "lucide-react";
import type { EngineMode } from "@/lib/types";

const MODES: {
  id: EngineMode;
  label: string;
  hint: string;
  icon: typeof Database;
}[] = [
  { id: "cached", label: "Cached", hint: "Instant, bulletproof fixtures.", icon: Database },
  { id: "fast", label: "Fast", hint: "Gemini structured output.", icon: Zap },
  { id: "agent", label: "Ada Live", hint: "Antigravity agent browses sources.", icon: Radio },
];

export default function ModeToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: EngineMode;
  onChange: (m: EngineMode) => void;
  disabled?: boolean;
}) {
  const activeHint = MODES.find((m) => m.id === mode)?.hint;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-e1">
      <h3 className="mb-2.5 text-sm font-semibold text-ink">Engine mode</h3>

      <div
        role="radiogroup"
        aria-label="Engine mode"
        className="flex gap-1 rounded-lg bg-surface-2 p-1"
      >
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(m.id)}
              disabled={disabled}
              className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors duration-[130ms] disabled:opacity-50 ${
                active
                  ? "bg-surface text-ink shadow-e1"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${active ? "text-ink-muted" : "text-ink-faint"}`}
                aria-hidden="true"
              />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-2.5 text-xs leading-snug text-ink-muted">{activeHint}</p>
    </div>
  );
}
