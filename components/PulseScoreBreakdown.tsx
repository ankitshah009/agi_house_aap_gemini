"use client";

import type { PulseScore } from "@/lib/types";

// PulseScoreBreakdown — Agent 3's composite Pulse Score made legible by SHOWING its six
// axes, not by enlarging the number. A restrained scorecard (think a Linear insights row
// or Stripe usage breakdown): one accent, hairline gridline, no gauge / ring / glow.
// The composite is present but small; the six axes are the content.

interface PulseScoreBreakdownProps {
  score: PulseScore;
}

// Fixed order, fixed labels. The axes are differentiated by label + length, never by hue.
const AXES: { key: keyof Omit<PulseScore, "composite">; label: string }[] = [
  { key: "adtechImpact", label: "AdTech Impact" },
  { key: "aiImpact", label: "AI Impact" },
  { key: "novelty", label: "Novelty" },
  { key: "urgency", label: "Urgency" },
  { key: "audienceRelevance", label: "Audience Relevance" },
  { key: "confidence", label: "Confidence" },
];

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function AxisRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number;
  emphasize: boolean;
}) {
  const v = clamp(value);
  return (
    <div className="grid min-h-7 grid-cols-[8.5rem_1fr_2rem] items-center gap-3">
      <span className="text-[13px] text-ink-muted">{label}</span>
      <div
        role="meter"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${v} of 100`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
      >
        {/* Single accent for all six bars; comparison is by length, not color. */}
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-220 ease-out"
          style={{ width: `${v}%` }}
        />
      </div>
      <span
        className={`tnum text-right font-mono text-xs ${
          emphasize ? "font-semibold text-ink" : "text-ink"
        }`}
      >
        {v}
      </span>
    </div>
  );
}

export default function PulseScoreBreakdown({ score }: PulseScoreBreakdownProps) {
  const composite = clamp(score.composite);

  // Subtle, earned emphasis: only the single highest axis gets weight (no color), so the
  // eye finds the driver. Ties resolve to the first axis in fixed order.
  let topKey: (typeof AXES)[number]["key"] = AXES[0].key;
  let topVal = -1;
  for (const { key } of AXES) {
    const val = clamp(score[key]);
    if (val > topVal) {
      topVal = val;
      topKey = key;
    }
  }

  return (
    <section
      aria-label="Pulse Score breakdown"
      className="enter rounded-lg border border-border bg-surface shadow-e1"
    >
      {/* Composite header — restrained, not hero. */}
      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-medium text-ink">Pulse Score</h3>
          <p className="mt-0.5 text-xs text-ink-muted">
            Composite of impact, novelty, urgency, relevance and confidence.
          </p>
        </div>
        <div className="flex shrink-0 items-baseline gap-1">
          <span className="tnum font-mono text-xl font-semibold text-ink">
            {composite}
          </span>
          <span className="text-sm text-ink-muted">/ 100</span>
        </div>
      </div>

      <hr className="border-border" />

      {/* The six axes — one shared baseline grid so the bars read as a comparison. */}
      <div className="space-y-2 p-4 sm:p-5">
        {AXES.map(({ key, label }) => (
          <AxisRow
            key={key}
            label={label}
            value={score[key]}
            emphasize={key === topKey}
          />
        ))}
      </div>
    </section>
  );
}
