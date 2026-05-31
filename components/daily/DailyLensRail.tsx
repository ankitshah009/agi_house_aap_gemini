"use client";

// Global lens selector for the Daily Pulse. Picking a lens reframes EVERY format.
// Shows each lens's day-pulse (mean of the three movers' scores) so the moat is visible.

import type { LensId } from "@/lib/types";
import type { DailyView } from "@/lib/dailyBrief";
import { withAlpha } from "@/lib/lenses";
import { LENS_ICON } from "@/components/lensIcons";

export default function DailyLensRail({
  views,
  active,
  onChange,
}: {
  views: DailyView[];
  active: LensId;
  onChange: (id: LensId) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-slate-500">
        Lens — same three moves, four readings
      </span>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {views.map((v) => {
          const Icon = LENS_ICON[v.lensId];
          const on = v.lensId === active;
          return (
            <button
              key={v.lensId}
              type="button"
              onClick={() => onChange(v.lensId)}
              aria-pressed={on}
              className="group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-px"
              style={{
                borderColor: on ? withAlpha(v.color, 0.6) : "rgba(148,163,184,0.14)",
                backgroundColor: on ? withAlpha(v.color, 0.12) : "rgba(2,6,23,0.55)",
                boxShadow: on ? `0 0 18px ${withAlpha(v.color, 0.2)}` : "none",
              }}
            >
              <span
                className="shrink-0 rounded-lg p-1.5"
                style={{ backgroundColor: withAlpha(v.color, on ? 0.2 : 0.1), color: v.color }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-bold tracking-tight" style={{ color: on ? "#fff" : "#cbd5e1" }}>
                  {v.lensLabel}
                </span>
                <span className="block text-[9px] font-mono uppercase tracking-wider" style={{ color: on ? v.color : "#64748b" }}>
                  Day Pulse
                </span>
              </span>
              <span className="shrink-0 text-base font-black tabular-nums" style={{ color: on ? v.color : "#475569" }}>
                {v.dayScore}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
