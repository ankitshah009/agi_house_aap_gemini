// Format 4 — the Detailed Breakdown (the 3–5 minute read).
// The cross-signal synthesis, then each of the three movers in depth for the selected lens,
// reusing the single-signal PulseCard so the deep view stays consistent with the rest of AAP.

import { Activity, ArrowRight, Layers } from "lucide-react";
import type { LensId } from "@/lib/types";
import type { DailyView } from "@/lib/dailyBrief";
import type { PulseSignalView } from "@/lib/pulseSignal";
import { withAlpha } from "@/lib/lenses";
import PulseCard from "@/components/PulseCard";

export default function DetailedBreakdown({
  view,
  signalViews,
  lensId,
}: {
  view: DailyView;
  signalViews: PulseSignalView[];
  lensId: LensId;
}) {
  return (
    <div className="animate-deal-in flex flex-col gap-5">
      {/* synthesis / through-line */}
      <div className="rounded-2xl border bg-slate-900/40 p-5" style={{ borderColor: withAlpha(view.color, 0.3) }}>
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" style={{ color: view.color }} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
            Today&apos;s through-line · {view.lensLabel}
          </span>
        </div>
        <h2 className="mt-2 font-sans text-xl font-extrabold leading-snug tracking-tight text-white">{view.through}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{view.dynamics}</p>

        <div className="mt-3 flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">The dynamics</span>
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
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

      {/* each mover in depth */}
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
        The three moves, in depth
      </span>
      {signalViews.map((sv, i) => {
        const lens = sv.lensById[lensId];
        if (!lens) return null;
        return (
          <div key={sv.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-slate-500">
              <span
                className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-black tabular-nums"
                style={{ backgroundColor: withAlpha(lens.color, 0.14), color: lens.color }}
              >
                {i + 1}
              </span>
              <span>Move {i + 1} of {signalViews.length}</span>
            </div>
            <PulseCard signal={sv.signal} lens={lens} disclosure={sv.disclosure} />
          </div>
        );
      })}
    </div>
  );
}
