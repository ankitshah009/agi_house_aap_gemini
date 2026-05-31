"use client";

import { useMemo } from "react";
import { ArrowRight, Sparkles, Square, TrendingUp } from "lucide-react";
import type { DailyBrief, SignalAnalysis } from "@/lib/types";
import { LENS_BY_ID } from "@/lib/lenses";
import { DAILY_MOVERS, buildDailyView } from "@/lib/dailyBrief";
import InfographicCard from "./InfographicCard";

// ─── Prop interface ────────────────────────────────────────────────────────────
export interface DailyDigestProps {
  brief: DailyBrief;
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

// ─── Blueprint spec: data-driven + generalized for ANY day's signals ────────────
// Each signal's category maps to a stack tier (Discovery / Trust / Execution, with a
// graceful fallback). The winners / at-risk / now-next-watch are NOT hardcoded: they are
// grounded context drawn from each signal's real GTM lens + action data, which the image
// model condenses. So the blueprint adapts to any companies, categories, or counts.
function layerFor(category: string): { rank: number; label: string; word: string } {
  const c = category.toLowerCase();
  if (/search|discover|commerce|overview|answer|attention|audience|consumer/.test(c))
    return { rank: 0, label: "DISCOVERY LAYER", word: "Discovery" };
  if (/policy|trust|complian|watermark|regulat|synthetic|safety|provenance|privacy|brand/.test(c))
    return { rank: 1, label: "TRUST LAYER", word: "Trust" };
  if (/dsp|infrastructure|bidding|execution|programmatic|inference|exchange|supply|measure|identity|stack/.test(c))
    return { rank: 2, label: "EXECUTION LAYER", word: "Execution" };
  const head = category.split(/[\s&/]+/)[0] || "Signal";
  return { rank: 3, label: `${head.toUpperCase()} LAYER`, word: head };
}

function gtmCardOf(s: SignalAnalysis) {
  return s.cards.find((c) => c.lens === "gtm");
}

// Power-map derivations: clean entity name, strategic role, and a one-line key idea.
const COMPANY_BY_ID: Record<string, string> = Object.fromEntries(
  DAILY_MOVERS.map((m) => [m.signalId, m.company]),
);

function companyFor(s: SignalAnalysis): string {
  return COMPANY_BY_ID[s.id] ?? s.title.split(/\s+/).slice(0, 2).join(" ");
}

function roleFor(category: string): string {
  const c = category.toLowerCase();
  if (/audience|targeting|social|prediction|behavior/.test(c)) return "Audience Engine";
  if (/policy|trust|complian|watermark|regulat|synthetic|safety|provenance|privacy/.test(c))
    return "Trust & Compliance Engine";
  if (/dsp|infrastructure|bidding|execution|programmatic|inference|exchange|supply/.test(c))
    return "Execution Engine";
  if (/retail|shopping|amazon|conversion/.test(c)) return "Commerce Engine";
  if (/search|discover|overview|answer|commerce/.test(c)) return "Discovery Engine";
  return "AI Engine";
}

function keyIdeaFor(s: SignalAnalysis): string {
  const text = s.masterBrief?.whyItMatters ?? s.summary;
  const first = (text.match(/[^.!?]+[.!?]?/) ?? [text])[0].trim();
  const words = first.split(/\s+/);
  return (words.length <= 14 ? first : words.slice(0, 14).join(" ")).replace(/[.,;:]+$/, "");
}

function buildBlueprintSpec(brief: DailyBrief) {
  const layered = brief.signals
    .slice(0, 5)
    .map((s) => ({ ...layerFor(s.category), s }))
    .sort((a, b) => a.rank - b.rank);

  const layers = layered.map((l) => ({ label: l.label, subject: l.s.title }));

  const words = Array.from(new Set(layered.map((l) => l.word)));
  const subtitle =
    words.length >= 2
      ? `${words.slice(0, -1).join(", ")}, and ${words[words.length - 1]} are becoming AI-native.`
      : `${words[0] ?? "The ad stack"} is becoming AI-native.`;

  const top = Math.max(0, ...brief.signals.map((s) => s.pulseScore?.composite ?? s.hypeCheckScore));
  const pulseScore = Math.round(top);
  const importance = pulseScore >= 85 ? "HIGH" : pulseScore >= 70 ? "MEDIUM" : "MODERATE";

  const marketContext = layered
    .map((l) => {
      const g = gtmCardOf(l.s);
      const bullets = g ? g.bullets.map((b) => b.replace(/\*\*/g, "")).join(" ") : "";
      return `- ${l.s.category}: ${g?.brief ?? l.s.summary} ${bullets}`.trim();
    })
    .join("\n");

  const actionContext = layered
    .map((l) => {
      const now = l.s.actionHorizon?.now?.[0] ?? gtmCardOf(l.s)?.actionSteps?.[0] ?? "";
      const next = l.s.actionHorizon?.next?.[0] ?? "";
      const watch = l.s.masterBrief?.whatToWatch?.[0] ?? "";
      return `- ${l.s.category}: NOW ${now} | NEXT ${next} | WATCH ${watch}`;
    })
    .join("\n");

  const players = brief.signals.slice(0, 4).map((s) => ({
    entity: companyFor(s),
    role: roleFor(s.category),
    keyIdea: keyIdeaFor(s),
  }));
  const relationships = buildDailyView("executive").edges;

  return {
    headline: brief.headline,
    subtitle,
    pulseScore,
    importance,
    layers,
    players,
    relationships,
    marketContext,
    actionContext,
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function DailyDigest({ brief, onDeepDive }: DailyDigestProps) {
  const signals = brief.signals.slice(0, 3);
  const blueprint = useMemo(() => buildBlueprintSpec(brief), [brief]);

  // Build the numbered list for the infographic image prompt.
  const infographicSummary = signals
    .map((s, i) => `${i + 1}. ${s.title}`)
    .join("\n");

  const bottomLine = deriveBottomLine(signals);

  return (
    <article
      className="enter rounded-lg border border-border bg-surface shadow-e1 overflow-hidden"
      aria-label="Today's digest: top three signals"
    >
      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-ink leading-tight">Today&apos;s Digest</h2>
          </div>
          <p className="text-xs text-ink-muted">3 signals that matter</p>
        </div>
        <time
          className="text-2xs font-mono text-ink-faint shrink-0 mt-0.5"
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
            title="AI Advertising Power Map"
            summary={infographicSummary}
            blueprint={blueprint}
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
          <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2.5">
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
