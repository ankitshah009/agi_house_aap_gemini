"use client";

import { ArrowRight, Sparkles, Square, TrendingUp } from "lucide-react";
import type { DailyBrief, SignalAnalysis } from "@/lib/types";
import type { DailyView } from "@/lib/dailyBrief";
import { LENS_BY_ID } from "@/lib/lenses";
import InfographicCard from "./InfographicCard";

// ─── Prop interface ────────────────────────────────────────────────────────────
export interface DailyDigestProps {
  brief: DailyBrief;
  dailyView?: DailyView;
  onDeepDive: (id: string) => void;
}

// ─── Lead lens: the card with the highest score for a given signal ─────────────
// Falls back to "strategist" when cards is empty (defensive only; data guarantees 4).
function deriveLeadLens(signal: SignalAnalysis): string {
  if (!signal.cards.length) return LENS_BY_ID["strategist"].dotClass;
  const lead = signal.cards.reduce((a, b) => (b.score > a.score ? b : a));
  return LENS_BY_ID[lead.lens].dotClass;
}

// ─── Lead lens score label (for aria-label on the dot) ─────────────────────────
function deriveLeadLensRole(signal: SignalAnalysis): string {
  if (!signal.cards.length) return LENS_BY_ID["strategist"].role;
  const lead = signal.cards.reduce((a, b) => (b.score > a.score ? b : a));
  return LENS_BY_ID[lead.lens].role;
}

// ─── Action item: now[0] -> strategist actionSteps[0] -> first available ────────
function deriveAction(signal: SignalAnalysis): string {
  const nowFirst = signal.actionHorizon?.now?.[0];
  if (nowFirst) return nowFirst;
  const strategistStep = signal.cards.find((c) => c.lens === "strategist")?.actionSteps?.[0];
  if (strategistStep) return strategistStep;
  for (const card of signal.cards) {
    if (card.actionSteps?.[0]) return card.actionSteps[0];
  }
  return "Review this signal and identify next steps.";
}

// ─── Bottom line: one synthesized sentence from the 3 signals ─────────────────
// Derives a throughline by naming each category and threading them together.
// Pure computation, no API call.
function deriveBottomLine(signals: SignalAnalysis[]): string {
  const top = signals.slice(0, 3);
  if (!top.length) return "No signals available today.";

  const categories = top.map((s) => s.category);

  // Build a short editorial sentence that names the intersection.
  // Pattern: "[Cat1], [Cat2], and [Cat3] are converging on [theme]..."
  if (categories.length === 3) {
    return (
      `${categories[0]}, ${categories[1]}, and ${categories[2]} are all shifting at once ` +
      `pointing to a week when AI-native formats, targeting data, and platform accountability ` +
      `are being renegotiated in parallel.`
    );
  }
  if (categories.length === 2) {
    return (
      `${categories[0]} and ${categories[1]} are shifting together, ` +
      `signaling a broader recalibration of how advertising inventory is bought and measured.`
    );
  }
  // Single signal
  return `${categories[0]} is the dominant force shaping AdTech decisions today.`;
}

// ─── Pulse score display value ──────────────────────────────────────────────────
function pulseDisplay(signal: SignalAnalysis): number {
  return signal.pulseScore?.composite ?? signal.hypeCheckScore;
}

// ─── Score chip color band ──────────────────────────────────────────────────────
// High (>=75): success-tinted. Mid (50-74): ink-muted. Low (<50): ink-faint.
function scoreChipClass(score: number): string {
  if (score >= 75) return "bg-surface-2 text-ink border border-border";
  if (score >= 50) return "bg-surface-2 text-ink-muted border border-border";
  return "bg-surface-2 text-ink-faint border border-border";
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function DailyDigest({ brief, dailyView, onDeepDive }: DailyDigestProps) {
  const signals = brief.signals.slice(0, 3);

  const infographicSummary = dailyView
    ? dailyView.movers.map((m, i) => `${i + 1}. ${m.company}: ${m.move}`).join("\n")
    : signals.map((s, i) => `${i + 1}. ${s.title}`).join("\n");

  const bottomLine = dailyView?.through ?? deriveBottomLine(signals);

  return (
    <article
      className="enter rounded-lg border border-border bg-surface card-depth overflow-hidden"
      aria-label="Today's digest: top three signals"
    >
      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
            <h2 className="text-xl font-bold leading-tight text-gradient">Today&apos;s Digest</h2>
          </div>
          <p className="text-xs text-ink-muted">3 signals that matter</p>
        </div>
        <time
          className="text-2xs font-mono uppercase tracking-wider text-ink-faint shrink-0 mt-0.5"
          dateTime={brief.date}
        >
          {brief.date}
        </time>
      </header>

      <div className="px-5 pb-5 space-y-5">
        {/* ── 2. Combined dynamics infographic ──────────────────────────────── */}
        <div className="mt-5">
          <InfographicCard
            kind="digest"
            title="Today in AdTech and AI"
            summary={infographicSummary}
          />
        </div>

        {/* ── 3. Bottom line (synthesized throughline) ──────────────────────── */}
        <p className="text-sm text-ink-muted leading-relaxed border-l-2 border-border pl-3">
          {bottomLine}
        </p>

        {/* ── 4. The 3 signal rows ──────────────────────────────────────────── */}
        <ol className="space-y-3" aria-label="Top three signals">
          {signals.map((signal, i) => {
            const score = pulseDisplay(signal);
            const leadDotClass = deriveLeadLens(signal);
            const leadRole = deriveLeadLensRole(signal);
            const whyItMatters =
              signal.masterBrief?.whyItMatters ?? signal.summary;

            return (
              <li
                key={signal.id}
                className="rounded-lg border border-border bg-surface-2 p-3.5 space-y-2"
              >
                {/* Row top: rank + headline + score chip */}
                <div className="flex items-start gap-3">
                  {/* Rank badge */}
                  <span
                    className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-border text-2xs font-semibold tnum text-ink-muted mt-0.5"
                    aria-label={`Signal ${i + 1}`}
                  >
                    {i + 1}
                  </span>

                  {/* Headline */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-ink leading-snug">
                      {signal.title}
                    </h3>
                  </div>

                  {/* Pulse score chip */}
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold tnum ${scoreChipClass(score)}`}
                    aria-label={`Pulse score ${score}`}
                  >
                    <TrendingUp className="w-3 h-3" aria-hidden="true" />
                    {score}
                  </span>
                </div>

                {/* Why it matters */}
                <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 pl-9">
                  {whyItMatters}
                </p>

                {/* Row bottom: lead lens dot + category + deep dive button */}
                <div className="flex items-center justify-between gap-3 pl-9 pt-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${leadDotClass}`}
                      aria-label={`Lead lens: ${leadRole}`}
                    />
                    <span className="text-2xs text-ink-faint truncate">{signal.category}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeepDive(signal.id)}
                    aria-label={`Deep dive into ${signal.title}`}
                    className="shrink-0 inline-flex items-center gap-1 min-h-[44px] min-w-[44px] px-3 text-xs font-medium text-accent-quiet hover:text-accent transition-colors duration-fast"
                  >
                    Deep dive
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        {/* ── 5. What to do today ───────────────────────────────────────────── */}
        <section aria-label="What to do today">
          <h3 className="text-2xs font-mono uppercase tracking-wider text-ink-faint mb-2.5">
            What to do today
          </h3>
          <ul className="space-y-2">
            {signals.map((signal) => {
              const action = deriveAction(signal);
              return (
                <li
                  key={`action-${signal.id}`}
                  className="flex items-start gap-2.5"
                >
                  {/* Checkbox-style square (visual only, not interactive) */}
                  <Square
                    className="w-4 h-4 shrink-0 text-border mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-ink-muted leading-snug">{action}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ── 6. Footer disclosure ──────────────────────────────────────────── */}
        <footer className="pt-1 border-t border-border">
          <p className="text-2xs text-ink-faint">
            Produced by Ada, reviewed by Rachel
          </p>
        </footer>
      </div>
    </article>
  );
}
