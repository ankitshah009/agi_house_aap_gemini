"use client";

// The "Switch Lens" control. All four lenses are preloaded on the view, so switching is
// instant client-side state — no refetch. Shows each lens's live Pulse Score so the moat
// ("Same Signal. Different Decisions.") is visible at a glance.

import type { LensId } from "@/lib/types";
import type { LensView } from "@/lib/pulseSignal";
import { withAlpha } from "@/lib/lenses";
import { LENS_ICON } from "./lensIcons";

export default function LensSwitcher({
  lenses,
  active,
  onChange,
}: {
  lenses: LensView[];
  active: LensId;
  onChange: (id: LensId) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-slate-500">
        Switch Lens — same signal, different decisions
      </span>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {lenses.map((lens) => {
          const Icon = LENS_ICON[lens.lensId];
          const on = lens.lensId === active;
          return (
            <button
              key={lens.lensId}
              type="button"
              onClick={() => onChange(lens.lensId)}
              aria-pressed={on}
              className="group flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-px"
              style={{
                borderColor: on ? withAlpha(lens.color, 0.6) : "rgba(148,163,184,0.14)",
                backgroundColor: on ? withAlpha(lens.color, 0.12) : "rgba(2,6,23,0.55)",
                boxShadow: on ? `0 0 18px ${withAlpha(lens.color, 0.2)}` : "none",
              }}
            >
              <span
                className="shrink-0 rounded-lg p-1.5 transition-colors"
                style={{ backgroundColor: withAlpha(lens.color, on ? 0.2 : 0.1), color: lens.color }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-bold tracking-tight" style={{ color: on ? "#fff" : "#cbd5e1" }}>
                  {lens.label}
                </span>
                <span
                  className="block truncate text-[9px] font-mono uppercase tracking-wider"
                  style={{ color: on ? lens.color : "#64748b" }}
                >
                  {lens.decisionType}
                </span>
              </span>
              <span className="shrink-0 text-sm font-black tabular-nums" style={{ color: on ? lens.color : "#475569" }}>
                {lens.pulseScore}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
