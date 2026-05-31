"use client";

import { ArrowRight, TrendingUp, Clock } from "lucide-react";
import type { DailyBrief } from "@/lib/types";

// Today's Pulse: the ranked top signals of the day (auto mode). Pick one to deep dive
// into the full four-lens treatment (manual mode).
export default function DailyPulse({
  brief,
  selectedId,
  onDeepDive,
}: {
  brief: DailyBrief;
  selectedId: string;
  onDeepDive: (id: string) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface card-depth p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold leading-tight text-gradient">{brief.headline}</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Top {brief.signals.length} signals of the day, ranked by Pulse Score. Pick one to deep
            dive.
          </p>
        </div>
        <span className="text-2xs font-mono text-ink-faint flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {brief.date}
        </span>
      </div>
      <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {brief.signals.map((sig, i) => {
          const active = sig.id === selectedId;
          const score = sig.pulseScore?.composite ?? sig.hypeCheckScore;
          return (
            <li key={sig.id}>
              <button
                onClick={() => onDeepDive(sig.id)}
                aria-pressed={active}
                className={`group flex w-full flex-col text-left rounded-lg border p-3.5 min-h-11 transition-colors duration-fast ${
                  active ? "border-accent bg-accent-soft glow-accent" : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xs font-mono uppercase tracking-wider text-ink-faint">
                    #{i + 1} · {sig.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold tnum text-ink">
                    <TrendingUp className="h-3 w-3 text-accent" aria-hidden="true" />
                    {score}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-ink leading-snug line-clamp-2">
                  {sig.title}
                </h3>
                <p className="text-xs text-ink-muted mt-1.5 line-clamp-2 flex-1">{sig.summary}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-quiet group-hover:text-accent">
                  Deep dive
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
