"use client";

import { Check } from "lucide-react";
import type { StatusLine } from "@/hooks/usePulseStream";
import { LENS_BY_ID, isLensId } from "@/lib/lenses";

const PIPELINE: { stage: string; label: string }[] = [
  { stage: "source", label: "Source" },
  { stage: "filter", label: "Filter" },
  { stage: "frame", label: "Frame ×4" },
  { stage: "review", label: "Review" },
  { stage: "publish", label: "Publish" },
];

export default function ReasoningPanel({
  log,
  progress,
}: {
  log: StatusLine[];
  progress: number;
}) {
  const seen = new Set(log.map((l) => l.stage));

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-950/60 p-5 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-3 relative">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 font-mono text-[10px] font-black">
            ADA
          </span>
          <div>
            <h3 className="text-xs font-sans font-bold text-white">Ada is reasoning</h3>
            <p className="text-[10px] font-mono text-slate-500">
              content pipeline · source → filter → frame → review → publish
            </p>
          </div>
        </div>
        <span className="font-mono text-sm text-indigo-300 font-bold tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="flex items-stretch gap-1.5 mb-3">
        {PIPELINE.map((p) => (
          <div key={p.stage} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full h-1.5 rounded-full transition-colors ${
                seen.has(p.stage) ? "bg-indigo-500" : "bg-slate-800"
              }`}
            />
            <span
              className={`text-[8px] font-mono uppercase tracking-wider ${
                seen.has(p.stage) ? "text-indigo-300" : "text-slate-600"
              }`}
            >
              {p.label}
            </span>
          </div>
        ))}
      </div>

      <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-1.5 max-h-40 overflow-y-auto thin-scroll font-mono text-[11px] relative">
        {log.map((l, i) => {
          const last = i === log.length - 1;
          const color = l.lens && isLensId(l.lens) ? LENS_BY_ID[l.lens].color : undefined;
          return (
            <div key={i} className="flex items-start gap-2 text-slate-400">
              {last ? (
                <span className="text-cyan-400 animate-blink">▌</span>
              ) : (
                <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
              )}
              <span style={color ? { color } : undefined}>{l.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
