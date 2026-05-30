"use client";

import { Database, Zap, Radio } from "lucide-react";
import type { EngineMode } from "@/lib/types";

const MODES: {
  id: EngineMode;
  label: string;
  hint: string;
  icon: typeof Database;
}[] = [
  { id: "cached", label: "Cached", hint: "Instant · bulletproof", icon: Database },
  { id: "fast", label: "Fast", hint: "Gemini structured", icon: Zap },
  { id: "agent", label: "Ada Live", hint: "Antigravity · browses sources", icon: Radio },
];

export default function ModeToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: EngineMode;
  onChange: (m: EngineMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="w-2 h-2 rounded-full bg-indigo-500" />
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-300">
          Engine Mode
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              disabled={disabled}
              title={m.hint}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 transition-all disabled:opacity-50 ${
                active
                  ? "border-indigo-500/70 bg-indigo-500/10 text-white shadow-[0_0_14px_rgba(99,102,241,0.25)]"
                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? "text-indigo-300" : ""}`} />
              <span className="text-[11px] font-sans font-bold tracking-tight">{m.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] font-mono text-slate-500 leading-snug">
        {MODES.find((m) => m.id === mode)?.hint}
      </p>
    </div>
  );
}
