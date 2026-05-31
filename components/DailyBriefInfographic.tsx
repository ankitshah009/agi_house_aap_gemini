"use client";

import { Clock } from "lucide-react";
import type { SignalAnalysis } from "@/lib/types";
import { LENS_BY_ID } from "@/lib/lenses";

// A glanceable "60-second daily brief": one signal, four scored lenses, the NOW move each.
export default function DailyBriefInfographic({ analysis }: { analysis: SignalAnalysis }) {
  const primary = analysis.cards.reduce((a, b) => (b.score > a.score ? b : a));
  const primaryMeta = LENS_BY_ID[primary.lens];

  return (
    <div className="enter rounded-lg border border-border bg-surface p-5 md:p-6 space-y-5 shadow-e1">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-2xs text-ink-faint">
          <Clock className="w-3.5 h-3.5 text-ink-faint" aria-hidden="true" />
          60-second daily brief. {analysis.date}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xs text-ink-faint">Grounding</span>
          <span className="text-base font-semibold tnum text-ink">{analysis.hypeCheckScore}%</span>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold leading-tight text-ink">{analysis.title}</h2>
        <p className="text-sm text-ink-muted mt-1.5 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Primary lens callout */}
      <div className="rounded-lg border border-border bg-surface-2 p-3 flex items-center gap-3">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${primaryMeta.dotClass}`}
          aria-hidden="true"
        />
        <p className="text-sm text-ink-muted">
          <span className="font-semibold text-ink">Top lens: {primaryMeta.role}.</span>{" "}
          This signal matters most to {primaryMeta.role.toLowerCase()}s ({primary.scoreName}{" "}
          {primary.score}).
        </p>
      </div>

      {/* Four lens score tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {analysis.cards.map((c) => {
          const meta = LENS_BY_ID[c.lens];
          return (
            <div
              key={c.lens}
              className="rounded-lg border border-border bg-surface-2 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${meta.dotClass}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold text-ink truncate">{meta.role}</span>
                </div>
                <span className="text-lg font-semibold tnum text-ink">{c.score}</span>
              </div>
              <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-180 ease-out"
                  style={{ width: `${c.score}%`, backgroundColor: meta.cssVar }}
                />
              </div>
              <p className="text-sm text-ink-muted leading-snug line-clamp-2">{c.brief}</p>
              <div className="flex items-start gap-1.5 text-2xs text-ink-muted">
                <span className="font-medium shrink-0">Now:</span>
                <span className="line-clamp-2">{c.actionSteps[0]}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-2xs text-ink-faint text-center pt-1">
        Produced by Ada. Reviewed by Rachel. Sources available.
      </p>
    </div>
  );
}
