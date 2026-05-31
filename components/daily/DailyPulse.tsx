"use client";

// The Daily Pulse orchestrator. One intelligence source (today's 3 movers), two selectors:
//   • Lens  — reframes every format (DailyLensRail)
//   • Format — Pulse Card / Voice Brief / Video (beta) / Detailed
// The Nano Banana hero is generated once per lens and shared by the Pulse + Video formats.

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutDashboard, Volume2, Clapperboard, FileText } from "lucide-react";
import type { LensId } from "@/lib/types";
import type { DailyView } from "@/lib/dailyBrief";
import type { PulseSignalView } from "@/lib/pulseSignal";
import { LENS_ORDER, withAlpha } from "@/lib/lenses";
import { buildHeroPrompt, generateHeroImage } from "@/lib/nanoBanana";
import DailyLensRail from "./DailyLensRail";
import PulseInfographic, { type HeroState } from "./PulseInfographic";
import VoiceBriefView from "./VoiceBriefView";
import VideoBriefStub from "./VideoBriefStub";
import DetailedBreakdown from "./DetailedBreakdown";

type FormatKey = "pulse" | "voice" | "video" | "detailed";
interface Hero {
  url: string | null;
  state: HeroState;
}

const FORMATS: { key: FormatKey; label: string; icon: typeof LayoutDashboard; hint: string; beta?: boolean }[] = [
  { key: "pulse", label: "Pulse Card", icon: LayoutDashboard, hint: "60-second visual" },
  { key: "voice", label: "Voice Brief", icon: Volume2, hint: "listen" },
  { key: "video", label: "Video", icon: Clapperboard, hint: "beta", beta: true },
  { key: "detailed", label: "Detailed", icon: FileText, hint: "3–5 min read" },
];

export default function DailyPulse({
  dailyViews,
  signalViews,
}: {
  dailyViews: Record<LensId, DailyView>;
  signalViews: PulseSignalView[];
}) {
  const [activeLens, setActiveLens] = useState<LensId>(LENS_ORDER[0]);
  const [format, setFormat] = useState<FormatKey>("pulse");
  const [heroes, setHeroes] = useState<Record<string, Hero>>({});

  const heroesRef = useRef(heroes);
  heroesRef.current = heroes;
  const inflight = useRef<Set<string>>(new Set());

  const view = dailyViews[activeLens];
  const railViews = LENS_ORDER.map((id) => dailyViews[id]);
  const activeHero: Hero = heroes[activeLens] ?? { url: null, state: "idle" };

  const ensureHero = useCallback(
    async (lensId: LensId, force = false) => {
      const cur = heroesRef.current[lensId];
      if (inflight.current.has(lensId)) return;
      if (!force && (cur?.state === "ready" || cur?.state === "loading")) return;
      inflight.current.add(lensId);
      setHeroes((h) => ({ ...h, [lensId]: { url: h[lensId]?.url ?? null, state: "loading" } }));
      const url = await generateHeroImage(buildHeroPrompt(dailyViews[lensId]));
      inflight.current.delete(lensId);
      setHeroes((h) => ({ ...h, [lensId]: { url, state: url ? "ready" : "failed" } }));
    },
    [dailyViews],
  );

  // Generate the hero when a visual format is showing.
  useEffect(() => {
    if (format === "pulse" || format === "video") ensureHero(activeLens);
  }, [format, activeLens, ensureHero]);

  return (
    <div className="flex flex-col gap-5">
      {/* masthead */}
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-400">
            The Daily Pulse · {view.date} · {view.edition}
          </span>
        </div>
        <h1 className="mt-1 font-sans text-2xl font-extrabold tracking-tight text-white">
          Today&apos;s 3 movers — <span className="text-slate-400">one intelligence, four ways to read it.</span>
        </h1>
      </div>

      <DailyLensRail views={railViews} active={activeLens} onChange={setActiveLens} />

      {/* through-line strip — always visible context */}
      <div
        className="rounded-xl border-l-2 bg-slate-900/30 px-4 py-2.5"
        style={{ borderColor: view.color }}
      >
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">Through-line</span>
        <p className="text-[13px] font-medium leading-snug text-slate-200">{view.through}</p>
      </div>

      {/* format tabs */}
      <div className="flex flex-wrap gap-2">
        {FORMATS.map((f) => {
          const Icon = f.icon;
          const on = f.key === format;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFormat(f.key)}
              aria-pressed={on}
              className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-left transition-all"
              style={{
                borderColor: on ? withAlpha(view.color, 0.55) : "rgba(148,163,184,0.14)",
                backgroundColor: on ? withAlpha(view.color, 0.12) : "rgba(2,6,23,0.55)",
              }}
            >
              <Icon className="h-4 w-4" style={{ color: on ? view.color : "#64748b" }} />
              <span className="flex flex-col leading-tight">
                <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: on ? "#fff" : "#cbd5e1" }}>
                  {f.label}
                  {f.beta && (
                    <span className="rounded bg-amber-500/15 px-1 py-px font-mono text-[8px] uppercase tracking-wider text-amber-400">
                      beta
                    </span>
                  )}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{f.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* active format */}
      {format === "pulse" && (
        <PulseInfographic
          view={view}
          hero={activeHero.url}
          heroState={activeHero.state}
          onRegenerate={() => ensureHero(activeLens, true)}
        />
      )}
      {format === "voice" && <VoiceBriefView view={view} />}
      {format === "video" && <VideoBriefStub view={view} hero={activeHero.url} heroState={activeHero.state} />}
      {format === "detailed" && <DetailedBreakdown view={view} signalViews={signalViews} lensId={activeLens} />}
    </div>
  );
}
