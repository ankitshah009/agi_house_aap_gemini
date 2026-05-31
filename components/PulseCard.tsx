// Deliverable 4 — the Pulse Card.
//
// Presentational only: give it one signal + one lens view and it renders. Switching lenses
// is just a different `lens` prop (the demo preloads all four). 16:9-friendly and clean
// enough to screenshot / share. Per-lens colors are inline hex (never dynamic Tailwind
// class names), matching the rest of the app so nothing gets purged.

import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { LensView, SignalView } from "@/lib/pulseSignal";
import { withAlpha } from "@/lib/lenses";
import { LENS_ICON } from "./lensIcons";

const LADDER = [
  { key: "now", label: "NOW", window: "0–30d" },
  { key: "next", label: "NEXT", window: "30–90d" },
  { key: "later", label: "LATER", window: "90d+" },
] as const;

function ScoreDial({ score, color, scoreName }: { score: number; color: string; scoreName: string }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="148" height="148" viewBox="0 0 148 148" className="-rotate-90">
          <circle cx="74" cy="74" r={r} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="11" />
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
              filter: `drop-shadow(0 0 7px ${withAlpha(color, 0.55)})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black tabular-nums leading-none tracking-tighter" style={{ color }}>
            {score}
          </span>
          <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-slate-500 mt-1.5">/ 100</span>
        </div>
      </div>
      <span className="mt-2 text-[10px] font-mono uppercase tracking-widest text-center" style={{ color }}>
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
      // re-keying on the lens id replays the deal-in animation on every switch
      key={lens.lensId}
      className="animate-deal-in relative overflow-hidden rounded-2xl border bg-slate-900/40 backdrop-blur"
      style={{
        borderColor: withAlpha(lens.color, 0.32),
        boxShadow: `0 0 44px ${withAlpha(lens.color, 0.09)}, inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${lens.color}, ${withAlpha(lens.color, 0)})` }} />
      <div
        className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full blur-3xl"
        style={{ background: withAlpha(lens.color, 0.1) }}
      />

      <div className="relative p-6 lg:p-8">
        {/* ── header: lens + decision type · confidence + provenance ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl p-2" style={{ backgroundColor: withAlpha(lens.color, 0.14), color: lens.color }}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <span className="block text-[10px] font-mono font-bold uppercase tracking-[0.22em]" style={{ color: lens.color }}>
                {lens.label}
              </span>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500">Decision</span>
                <span className="text-sm font-bold tracking-tight text-white">{lens.decisionType}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300">
                {signal.confidence} confidence
              </span>
            </div>
            <div className="mt-1 text-[10px] font-mono text-slate-500">
              {signal.source} · {signal.date}
            </div>
          </div>
        </div>

        {/* ── the signal ── */}
        <h2 className="mt-5 font-sans text-2xl font-extrabold leading-[1.15] tracking-tight text-white lg:text-[28px]">
          {signal.title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{signal.summary}</p>

        <div className="my-6 h-px w-full" style={{ background: `linear-gradient(90deg, ${withAlpha(lens.color, 0.45)}, transparent)` }} />

        {/* ── body: framing + ladder + watch-out  |  score + implications ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Why it matters</span>
              <p className="mt-1.5 font-sans text-[15px] leading-relaxed text-slate-100">{lens.whyItMatters}</p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Action Ladder · To-Ship</span>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {LADDER.map((step) => (
                  <div key={step.key} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider"
                        style={{ color: lens.color, backgroundColor: withAlpha(lens.color, 0.12) }}
                      >
                        {step.label}
                      </span>
                      <span className="text-[9px] font-mono text-slate-600">{step.window}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-snug text-slate-200">{lens.ladder[step.key]}</p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="flex items-start gap-2.5 rounded-xl border p-3"
              style={{ borderColor: withAlpha("#f59e0b", 0.3), backgroundColor: withAlpha("#f59e0b", 0.06) }}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400/90">Watch-out</span>
                <p className="mt-0.5 text-xs leading-snug text-amber-100/90">{lens.watchout}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5">
            <div className="flex w-full flex-col items-center rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500">Pulse Score</span>
              <div className="mt-2">
                <ScoreDial score={lens.pulseScore} color={lens.color} scoreName={lens.scoreName} />
              </div>
            </div>

            <div className="w-full">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Key Implications</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {lens.keyImplications.map((imp, i) => (
                  <span
                    key={i}
                    title={imp.detail || undefined}
                    className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-slate-200"
                    style={{ borderColor: withAlpha(lens.color, 0.32), backgroundColor: withAlpha(lens.color, 0.08) }}
                  >
                    {imp.label || imp.detail}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── disclosure footer ── */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/70 pt-4">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <span className="inline-flex items-center -space-x-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-violet-500/40 bg-slate-900 text-[9px] font-bold text-violet-300">
                A
              </span>
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-500/40 bg-slate-900 text-[9px] font-bold text-amber-300"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                R
              </span>
            </span>
            <span>{disclosure}</span>
          </div>
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-[10px] font-mono font-black uppercase tracking-widest text-transparent">
            AAP Lens Engine™
          </span>
        </div>
      </div>
    </article>
  );
}
