"use client";

import { Clock, Zap } from "lucide-react";
import type { SignalAnalysis } from "@/lib/types";
import { LENS_BY_ID, withAlpha } from "@/lib/lenses";
import { LENS_ICON } from "./lensIcons";

// A glanceable "60-second daily brief" — one signal, four scored lenses, the NOW move each.
export default function DailyBriefInfographic({ analysis }: { analysis: SignalAnalysis }) {
  const primary = analysis.cards.reduce((a, b) => (b.score > a.score ? b : a));
  const primaryMeta = LENS_BY_ID[primary.lens];

  return (
    <div className="rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900/40 to-slate-950/60 p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          60-Second Daily Brief · {analysis.date}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Grounding</span>
          <span className="text-sm font-mono font-black text-violet-400 tabular-nums">
            {analysis.hypeCheckScore}%
          </span>
        </div>
      </div>

      <div>
        <h2
          className="text-lg md:text-xl text-white font-semibold leading-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {analysis.title}
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Primary lens callout */}
      <div
        className="rounded-lg border p-3 flex items-center gap-3"
        style={{ borderColor: withAlpha(primaryMeta.color, 0.4), backgroundColor: withAlpha(primaryMeta.color, 0.08) }}
      >
        <Zap className="w-4 h-4 shrink-0" style={{ color: primaryMeta.color }} />
        <p className="text-[11px] text-slate-300">
          <span className="font-mono uppercase tracking-wider font-bold" style={{ color: primaryMeta.color }}>
            Top lens · {primaryMeta.role}
          </span>{" "}
          — this signal matters most to {primaryMeta.role.toLowerCase()}s ({primary.scoreName}{" "}
          {primary.score}).
        </p>
      </div>

      {/* Four lens score tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {analysis.cards.map((c) => {
          const meta = LENS_BY_ID[c.lens];
          const Icon = LENS_ICON[c.lens];
          return (
            <div
              key={c.lens}
              className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2"
              style={{ borderColor: withAlpha(meta.color, 0.2) }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: meta.color }}>
                    {meta.role}
                  </span>
                </div>
                <span className="text-base font-mono font-black tabular-nums" style={{ color: meta.color }}>
                  {c.score}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${c.score}%`, backgroundColor: meta.color }}
                />
              </div>
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{c.brief}</p>
              <div className="flex items-start gap-1.5 text-[10px] text-slate-400">
                <span
                  className="font-mono font-bold uppercase shrink-0"
                  style={{ color: meta.color }}
                >
                  Now:
                </span>
                <span className="line-clamp-2">{c.actionSteps[0]}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-mono text-slate-500 text-center pt-1">
        Produced by Ada · Reviewed by Rachel · Sources available
      </p>
    </div>
  );
}
