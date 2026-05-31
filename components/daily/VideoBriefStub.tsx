// Format 3 — the Video Brief (Beta stub today). Uses the Nano Banana hero as the poster
// frame and documents the path: Rachel figure / motion + Gemini voice (Veo) wired later.

import { Play, Clapperboard, Sparkles } from "lucide-react";
import type { DailyView } from "@/lib/dailyBrief";
import { withAlpha } from "@/lib/lenses";
import type { HeroState } from "./PulseInfographic";

export default function VideoBriefStub({
  view,
  hero,
  heroState,
}: {
  view: DailyView;
  hero: string | null;
  heroState: HeroState;
}) {
  return (
    <div className="animate-deal-in overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
      <div className="relative aspect-video w-full overflow-hidden">
        {hero && heroState === "ready" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(120% 120% at 50% 0%, ${withAlpha(view.color, 0.45)} 0%, transparent 50%), radial-gradient(120% 120% at 50% 120%, rgba(139,92,246,0.4) 0%, transparent 55%), #0b1120`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-slate-950/40" />

        {/* beta badge */}
        <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-black/50 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-300 backdrop-blur">
          <Clapperboard className="h-3 w-3" /> Video Brief · Beta
        </span>

        {/* disabled play */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-black/40 backdrop-blur">
            <Play className="h-7 w-7 fill-white/80 text-white/80" />
          </div>
          <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 font-mono text-[11px] text-slate-200 backdrop-blur">
            Rachel video · coming soon
          </span>
        </div>

        {/* lower caption */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 to-transparent p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: view.color }}>
            {view.lensLabel}
          </div>
          <div className="mt-0.5 max-w-2xl text-sm font-bold text-white">{view.through}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
          <p className="max-w-xl text-xs leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-200">On the roadmap:</span> a ~45-second video brief — a Rachel
            presenter (or motion-graphic) reading today&apos;s three moves, with Gemini voice. The poster above is the
            Nano Banana hero; the motion layer (Veo) plugs in next. Voice &amp; visual scripts already exist in the other
            two formats.
          </p>
        </div>
        <span className="shrink-0 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-wider text-slate-500">
          Not today&apos;s must-have
        </span>
      </div>
    </div>
  );
}
