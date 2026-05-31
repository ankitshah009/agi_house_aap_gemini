"use client";

import { Clock } from "lucide-react";
import type { SignalAnalysis } from "@/lib/types";

export default function SignalFeed({
  signals,
  selectedId,
  onSelect,
  customIds,
  disabled,
}: {
  signals: SignalAnalysis[];
  selectedId: string;
  onSelect: (id: string) => void;
  customIds?: Set<string>;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-e1">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Signal feed</h2>
        <span className="text-2xs tabular-nums text-ink-faint tnum">
          {signals.length} signals
        </span>
      </div>

      <ul className="enter -mx-1 max-h-[44vh] space-y-1 overflow-y-auto px-1 thin-scroll">
        {signals.map((sig) => {
          const isSelected = selectedId === sig.id;
          const isCustom = customIds?.has(sig.id);
          const hot = sig.hypeCheckScore > 85;
          return (
            <li key={sig.id}>
              <button
                type="button"
                onClick={() => onSelect(sig.id)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={`relative flex min-h-11 w-full flex-col gap-2 rounded-md border px-3 py-3 text-left transition-colors duration-[130ms] disabled:opacity-60 ${
                  isSelected
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent"
                  />
                )}

                <div className="flex items-center justify-between gap-2 text-2xs text-ink-muted">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-ink-faint" aria-hidden="true" />
                    <span className="tnum">{sig.date}</span>
                  </span>
                  <span className="text-ink-faint">
                    {isCustom ? "Playground" : "Vetted brief"}
                  </span>
                </div>

                <h3 className="text-sm font-medium leading-snug text-ink">
                  {sig.title}
                </h3>

                <div className="flex items-center justify-between gap-2 text-2xs">
                  <span className="truncate text-ink-muted">{sig.category}</span>
                  <span className="flex shrink-0 items-center gap-1 text-ink-muted">
                    Hype
                    <span
                      className={`tnum font-semibold ${hot ? "text-success" : "text-warning"}`}
                    >
                      {sig.hypeCheckScore}%
                    </span>
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
