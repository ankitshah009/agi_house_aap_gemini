"use client";

import { Newspaper, Clock } from "lucide-react";
import type { SignalAnalysis } from "@/lib/types";

export default function SignalFeed({
  signals,
  selectedId,
  onSelect,
  customIds,
  disabled,
}: {
  signals: SignalAnalysis[];
  selectedId: string;
  onSelect: (id: string) => void;
  customIds?: Set<string>;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Newspaper className="w-4 h-4 text-slate-400" />
          <h2 className="font-sans font-extrabold text-xs uppercase tracking-widest text-slate-300">
            Signal Dispatch Feed
          </h2>
        </div>
        <span className="text-[9px] font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-500 border border-slate-900 uppercase">
          {signals.length} live
        </span>
      </div>

      <div className="space-y-3 max-h-[44vh] overflow-y-auto thin-scroll pr-1">
        {signals.map((sig) => {
          const isSelected = selectedId === sig.id;
          const isCustom = customIds?.has(sig.id);
          return (
            <button
              key={sig.id}
              onClick={() => onSelect(sig.id)}
              disabled={disabled}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col relative overflow-hidden group disabled:opacity-60 ${
                isSelected
                  ? "bg-slate-900 border-indigo-500/80"
                  : "bg-slate-950/40 border-slate-900 hover:bg-slate-900/60"
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-violet-500 to-indigo-600" />
              )}
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap text-[10px] font-mono leading-none">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3 h-3" />
                  {sig.date}
                </span>
                {isCustom ? (
                  <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider">
                    Playground
                  </span>
                ) : (
                  <span className="bg-slate-950/80 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800/80 font-medium">
                    Vetted Brief
                  </span>
                )}
              </div>
              <h3
                className={`font-sans font-bold text-xs tracking-tight leading-snug group-hover:text-indigo-300 transition-colors ${
                  isSelected ? "text-white" : "text-slate-300"
                }`}
              >
                {sig.title}
              </h3>
              <div className="mt-3 pt-2.5 border-t border-slate-900/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-900 text-indigo-400 font-bold tracking-tight truncate max-w-[60%]">
                  {sig.category}
                </span>
                <span className="flex items-center gap-1">
                  Hype:{" "}
                  <span className={sig.hypeCheckScore > 85 ? "text-emerald-400" : "text-amber-400"}>
                    {sig.hypeCheckScore}%
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
