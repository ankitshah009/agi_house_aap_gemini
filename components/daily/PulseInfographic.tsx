// Format 1 — the visual Pulse Card. The 60-second read of the day:
// Nano Banana hero band + the three movers + the interrelationship (dynamics) graph,
// all framed for the selected lens.

import { ArrowRight, Sparkles, RefreshCw, Loader2, Activity } from "lucide-react";
import type { DailyView } from "@/lib/dailyBrief";
import { withAlpha } from "@/lib/lenses";
import { LENS_ICON } from "@/components/lensIcons";

export type HeroState = "idle" | "loading" | "ready" | "failed";

function CodedHero({ color }: { color: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(120% 120% at 0% 0%, ${withAlpha(color, 0.5)} 0%, transparent 45%), radial-gradient(120% 120% at 100% 0%, rgba(34,211,238,0.35) 0%, transparent 45%), radial-gradient(140% 140% at 50% 120%, rgba(139,92,246,0.4) 0%, transparent 50%), #0b1120`,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(120% 80% at 50% 0%, #000 30%, transparent 80%)",
        }}
      />
    </div>
  );
}

export default function PulseInfographic({
  view,
  hero,
  heroState,
  onRegenerate,
}: {
  view: DailyView;
  hero: string | null;
  heroState: HeroState;
  onRegenerate: () => void;
}) {
  const LensIcon = LENS_ICON[view.lensId];
  return (
    <article
      key={view.lensId}
      className="animate-deal-in overflow-hidden rounded-2xl border bg-slate-900/40"
      style={{ borderColor: withAlpha(view.color, 0.32), boxShadow: `0 0 44px ${withAlpha(view.color, 0.09)}` }}
    >
      {/* ── Nano Banana hero band ── */}
      <div className="relative h-48 w-full overflow-hidden sm:h-56 lg:h-64">
        {hero && heroState === "ready" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <CodedHero color={view.color} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-between p-4 lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-md border border-white/15 bg-black/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-200 backdrop-blur">
              The Daily Pulse · {view.date} · {view.edition}
            </span>
            <div className="flex flex-col items-end rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 backdrop-blur">
              <span className="text-[8px] font-mono uppercase tracking-widest text-slate-300">Day Pulse</span>
              <span className="text-2xl font-black tabular-nums leading-none" style={{ color: view.color }}>
                {view.dayScore}
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="max-w-2xl">
              <div className="mb-1 flex items-center gap-1.5">
                <LensIcon className="h-3.5 w-3.5" style={{ color: view.color }} />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: view.color }}>
                  {view.lensLabel}
                </span>
              </div>
              <h2 className="font-sans text-lg font-extrabold leading-[1.2] tracking-tight text-white lg:text-2xl">
                {view.through}
              </h2>
            </div>
            <button
              type="button"
              onClick={onRegenerate}
              disabled={heroState === "loading"}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-200 backdrop-blur transition-colors hover:bg-black/60 disabled:opacity-60"
              title="Generate the hero with Nano Banana (Gemini 2.5 Flash Image)"
            >
              {heroState === "loading" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : heroState === "ready" ? (
                <RefreshCw className="h-3 w-3" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span>
                {heroState === "loading"
                  ? "Generating…"
                  : heroState === "ready"
                    ? "Nano Banana"
                    : heroState === "failed"
                      ? "Retry visual"
                      : "Nano Banana"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── the three movers ── */}
      <div className="p-5 lg:p-6">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Today&apos;s 3 movers</span>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
          {view.movers.map((m, i) => (
            <div
              key={m.signalId}
              className="relative flex flex-col rounded-xl border bg-slate-950/50 p-3.5"
              style={{ borderColor: withAlpha(m.color, 0.28) }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-black tabular-nums"
                    style={{ backgroundColor: withAlpha(m.color, 0.14), color: m.color }}
                  >
                    {i + 1}
                  </span>
                  <div className="leading-tight">
                    <div className="text-sm font-extrabold tracking-tight text-white">{m.company}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{m.move}</div>
                  </div>
                </div>
                <div className="flex flex-col items-center rounded-md border px-1.5 py-0.5" style={{ borderColor: withAlpha(m.color, 0.3) }}>
                  <span className="text-base font-black tabular-nums leading-none" style={{ color: m.color }}>
                    {m.pulseScore}
                  </span>
                </div>
              </div>
              <p className="mt-2.5 text-xs leading-snug text-slate-300">{m.impact}</p>
              <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider" style={{ backgroundColor: withAlpha(m.color, 0.1), color: m.color }}>
                {m.decisionType}
              </span>
            </div>
          ))}
        </div>

        {/* ── how today connects (the dynamics graph) ── */}
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" style={{ color: view.color }} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">How today connects</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-200">{view.dynamics}</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {view.edges.map((e, i) => (
              <div key={i} className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="rounded-md bg-slate-900 px-2 py-0.5 font-semibold text-slate-200">{e.from}</span>
                <ArrowRight className="h-3 w-3 shrink-0" style={{ color: view.color }} />
                <span className="font-mono text-slate-400">{e.relation}</span>
                <ArrowRight className="h-3 w-3 shrink-0" style={{ color: view.color }} />
                <span className="rounded-md bg-slate-900 px-2 py-0.5 font-semibold text-slate-200">{e.to}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── footer ── */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/70 pt-4">
          <span className="text-[11px] font-mono text-slate-500">{view.disclosure}</span>
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text font-mono text-[10px] font-black uppercase tracking-widest text-transparent">
            AAP Lens Engine™
          </span>
        </div>
      </div>
    </article>
  );
}
