"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { LensView, SignalView } from "@/lib/pulseSignal";
import { withAlpha } from "@/lib/lenses";
import { LENS_ICON } from "./lensIcons";

const LADDER = [
  { key: "now" as const, label: "NOW", window: "0–30d" },
  { key: "next" as const, label: "NEXT", window: "30–90d" },
  { key: "later" as const, label: "LATER", window: "90d+" },
];

function ScoreDial({
  score,
  color,
  scoreName,
}: {
  score: number;
  color: string;
  scoreName: string;
}) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="148" height="148" viewBox="0 0 148 148" className="-rotate-90" aria-hidden="true">
          <circle cx="74" cy="74" r={r} fill="none" stroke="var(--color-border)" strokeWidth="11" />
          <circle
            cx="74"
            cy="74"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)",
              filter: `drop-shadow(0 0 7px ${withAlpha(color, 0.45)})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black tabular-nums leading-none tracking-tighter text-ink">
            {score}
          </span>
          <span className="text-2xs font-mono uppercase tracking-wider text-ink-faint mt-1.5">
            / 100
          </span>
        </div>
      </div>
      <span className="mt-2 text-2xs font-mono uppercase tracking-wider text-center text-ink-muted">
        {scoreName}
      </span>
    </div>
  );
}

export default function PulseCard({
  signal,
  lens,
  disclosure,
}: {
  signal: SignalView;
  lens: LensView;
  disclosure: string;
}) {
  const Icon = LENS_ICON[lens.lensId];
  return (
    <article
      key={lens.lensId}
      className="enter relative overflow-hidden rounded-xl border border-border bg-surface card-depth"
      style={{
        borderColor: withAlpha(lens.color, 0.35),
        boxShadow: `inset 0 1px 0 oklch(100% 0 0 / 0.06), 0 0 32px ${withAlpha(lens.color, 0.08)}`,
      }}
    >
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${lens.color}, ${withAlpha(lens.color, 0)})` }}
      />

      <div className="relative p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="rounded-lg p-2"
              style={{ backgroundColor: withAlpha(lens.color, 0.14), color: lens.color }}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <span
                className="block text-2xs font-mono font-bold uppercase tracking-wider"
                style={{ color: lens.color }}
              >
                {lens.label}
              </span>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-2xs font-mono text-ink-faint">Decision</span>
                <span className="text-sm font-bold tracking-tight text-ink">{lens.decisionType}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              <span className="text-2xs font-mono uppercase tracking-wider text-ink-muted">
                {signal.confidence} confidence
              </span>
            </div>
            <div className="mt-1 text-2xs font-mono text-ink-faint">
              {signal.source} · {signal.date}
            </div>
          </div>
        </div>

        <h2 className="mt-5 text-xl md:text-2xl font-extrabold leading-tight tracking-tight text-ink">
          {signal.title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">{signal.summary}</p>

        <div
          className="my-5 h-px w-full"
          style={{ background: `linear-gradient(90deg, ${withAlpha(lens.color, 0.45)}, transparent)` }}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            <div>
              <span className="text-2xs font-mono uppercase tracking-wider text-ink-faint">
                Why it matters
              </span>
              <p className="mt-1.5 text-base leading-relaxed text-ink">{lens.whyItMatters}</p>
            </div>

            <div>
              <span className="text-2xs font-mono uppercase tracking-wider text-ink-faint">
                Action Ladder
              </span>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {LADDER.map((step) => (
                  <div key={step.key} className="rounded-lg border border-border bg-surface-2 p-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-2xs font-mono font-bold uppercase tracking-wider"
                        style={{ color: lens.color, backgroundColor: withAlpha(lens.color, 0.12) }}
                      >
                        {step.label}
                      </span>
                      <span className="text-2xs font-mono text-ink-faint">{step.window}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-snug text-ink-muted">{lens.ladder[step.key]}</p>
                  </div>
                ))}
              </div>
            </div>

            {lens.watchout && (
              <div className="flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning-soft p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                <div>
                  <span className="text-2xs font-mono font-bold uppercase tracking-wider text-warning">
                    Watch-out
                  </span>
                  <p className="mt-0.5 text-xs leading-snug text-ink-muted">{lens.watchout}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-5">
            <div className="flex w-full flex-col items-center rounded-lg border border-border bg-surface-2 p-4">
              <span className="text-2xs font-mono uppercase tracking-wider text-ink-faint">
                Pulse Score
              </span>
              <div className="mt-2">
                <ScoreDial score={lens.pulseScore} color={lens.color} scoreName={lens.scoreName} />
              </div>
            </div>

            <div className="w-full">
              <span className="text-2xs font-mono uppercase tracking-wider text-ink-faint">
                Key Implications
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {lens.keyImplications.map((imp, i) => (
                  <span
                    key={i}
                    title={imp.detail || undefined}
                    className="rounded-full border px-2.5 py-1 text-xs font-medium text-ink-muted"
                    style={{
                      borderColor: withAlpha(lens.color, 0.32),
                      backgroundColor: withAlpha(lens.color, 0.08),
                    }}
                  >
                    {imp.label || imp.detail}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-2xs font-mono text-ink-faint">{disclosure}</p>
          <span className="text-gradient text-2xs font-mono font-bold uppercase tracking-wider">
            AAP Lens Engine™
          </span>
        </div>
      </div>
    </article>
  );
}
