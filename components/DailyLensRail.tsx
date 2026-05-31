"use client";

import { useRef, type KeyboardEvent } from "react";
import { Target, Award, TrendingUp, ShieldAlert } from "lucide-react";
import { LENSES, LENS_BY_ID } from "@/lib/lenses";
import type { LensId } from "@/lib/types";
import type { DailyView } from "@/lib/dailyBrief";

// ---------- prop interface ----------

export interface DailyLensRailProps {
  views: Record<LensId, DailyView>;
  active: LensId;
  onChange: (id: LensId) => void;
}

// ---------- static icon map (Tailwind needs literal classes; same rule applies) ----------

const ICON_MAP = {
  Target,
  Award,
  TrendingUp,
  ShieldAlert,
} as const;

// ---------- static score-color map (literal classes so Tailwind scans them) ----------

const SCORE_COLOR: Record<LensId, string> = {
  strategist: "text-lens-strategist",
  executive: "text-lens-executive",
  gtm: "text-lens-gtm",
  policy: "text-lens-policy",
};

// ---------- component ----------

export default function DailyLensRail({ views, active, onChange }: DailyLensRailProps) {
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lensIds = LENSES.map((l) => l.id);

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next =
      e.key === "ArrowRight"
        ? (index + 1) % lensIds.length
        : (index - 1 + lensIds.length) % lensIds.length;
    const nextId = lensIds[next];
    onChange(nextId);
    btnRefs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Choose your lens"
      className="grid grid-cols-2 gap-2 lg:grid-cols-4"
    >
      {LENSES.map((lens, index) => {
        const isActive = active === lens.id;
        const view = views[lens.id];
        const Icon = ICON_MAP[lens.icon];
        const scoreColor = SCORE_COLOR[lens.id];

        return (
          <button
            key={lens.id}
            ref={(el) => {
              btnRefs.current[index] = el;
            }}
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(lens.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              "rounded-lg border p-3 min-h-11 text-left transition-colors",
              "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
              isActive
                ? "border-accent bg-accent-soft"
                : "border-border bg-surface hover:border-border-strong",
            ].join(" ")}
          >
            {/* Top row: dot + icon */}
            <div className="flex items-center justify-between mb-2">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${lens.dotClass}`}
                aria-hidden="true"
              />
              <Icon
                className="h-4 w-4 text-ink-muted shrink-0"
                aria-hidden="true"
              />
            </div>

            {/* Day Pulse eyebrow */}
            <p className="text-2xs font-mono uppercase tracking-wider text-ink-faint leading-none mb-0.5">
              Day Pulse
            </p>

            {/* Day score — prominent, lens-colored, tabular nums */}
            <p className={`text-xl font-semibold tnum leading-none mb-1.5 ${scoreColor}`}>
              {view.dayScore}
            </p>

            {/* Role label */}
            <p className="text-sm font-medium text-ink leading-snug">
              {LENS_BY_ID[lens.id].role}
            </p>
          </button>
        );
      })}
    </div>
  );
}
