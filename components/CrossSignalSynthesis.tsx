"use client";

import { ArrowRight } from "lucide-react";
import type { DailyView } from "@/lib/dailyBrief";

export interface CrossSignalSynthesisProps {
  view: DailyView;
}

export default function CrossSignalSynthesis({ view }: CrossSignalSynthesisProps) {
  return (
    <section
      className="enter rounded-lg border border-border bg-surface p-5 shadow-e1 border-l-2"
      style={{ borderLeftColor: `var(--color-lens-${view.lensId})` }}
      aria-label={`Today's through-line for ${view.lensLabel}`}
    >
      {/* Eyebrow */}
      <p className="text-2xs font-mono uppercase tracking-wider text-ink-faint mb-2">
        THROUGH-LINE · {view.lensLabel}
      </p>

      {/* Primary frame — the through-line */}
      <p className="text-sm text-ink leading-relaxed font-medium mb-2">
        {view.through}
      </p>

      {/* Dynamics — how the three moves interrelate */}
      <p className="text-sm text-ink-muted leading-relaxed mb-4">
        {view.dynamics}
      </p>

      {/* Signal relationships */}
      <ol
        aria-label="Signal relationships"
        className="flex flex-col gap-2"
      >
        {view.edges.map((edge, i) => (
          <li
            key={i}
            className="flex flex-wrap items-center gap-1.5"
          >
            {/* From chip */}
            <span className="bg-surface-2 rounded-md px-2 py-0.5 text-sm font-semibold text-ink">
              {edge.from}
            </span>

            <ArrowRight
              className="h-3.5 w-3.5 shrink-0 text-ink-faint"
              aria-hidden="true"
            />

            {/* Relation label */}
            <span className="text-xs font-mono text-ink-faint">
              {edge.relation}
            </span>

            <ArrowRight
              className="h-3.5 w-3.5 shrink-0 text-ink-faint"
              aria-hidden="true"
            />

            {/* To chip */}
            <span className="bg-surface-2 rounded-md px-2 py-0.5 text-sm font-semibold text-ink">
              {edge.to}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
