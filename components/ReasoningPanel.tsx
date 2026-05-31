"use client";

import { Check } from "lucide-react";
import type { StatusLine } from "@/hooks/usePulseStream";
import { LENS_BY_ID, isLensId } from "@/lib/lenses";

// Five pipeline segments. Done = accent fill, pending = border.
const PIPELINE: { stage: string; label: string }[] = [
  { stage: "source", label: "Source" },
  { stage: "filter", label: "Filter" },
  { stage: "frame", label: "Frame" },
  { stage: "review", label: "Review" },
  { stage: "publish", label: "Publish" },
];

export default function ReasoningPanel({
  log,
  progress,
}: {
  log: StatusLine[];
  progress: number;
}) {
  const seen = new Set(log.map((l) => l.stage));
  const indeterminate = progress <= 0 || progress >= 100 ? false : log.length === 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-e1">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">Ada is reasoning</h3>
          <p className="text-xs text-ink-muted">
            Source, filter, frame, review, publish.
          </p>
        </div>
        <span className="tnum font-mono text-xs text-ink-muted" aria-hidden="true">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Five segments: done = accent, pending = border hairline. */}
      <div className="mb-3 flex items-stretch gap-1.5">
        {PIPELINE.map((p) => {
          const done = seen.has(p.stage);
          return (
            <div key={p.stage} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-pill transition-colors ${
                  done ? "bg-accent" : "bg-border"
                }`}
              />
              <span
                className={`text-2xs ${done ? "text-ink" : "text-ink-faint"}`}
              >
                {p.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar: accent fill, or working shimmer while indeterminate. */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-pill bg-surface-2">
        {indeterminate ? (
          <div className="working h-full w-full" />
        ) : (
          <div
            className="h-full rounded-pill bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        )}
      </div>

      {/* Log lines: done = success check + muted text, active = accent + caret. */}
      <ul className="thin-scroll max-h-40 space-y-1.5 overflow-y-auto text-xs">
        {log.map((l, i) => {
          const active = i === log.length - 1;
          const dot =
            l.lens && isLensId(l.lens) ? LENS_BY_ID[l.lens].dotClass : undefined;
          return (
            <li key={i} className="flex items-start gap-2">
              {active ? (
                <span
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 font-mono text-accent"
                >
                  ›
                </span>
              ) : (
                <Check
                  aria-hidden="true"
                  className="mt-0.5 h-3 w-3 shrink-0 text-success"
                />
              )}
              {dot && (
                <span
                  aria-hidden="true"
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dot}`}
                />
              )}
              <span className={active ? "text-accent" : "text-ink-muted"}>
                {l.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
