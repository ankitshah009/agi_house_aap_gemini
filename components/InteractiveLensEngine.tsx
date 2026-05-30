"use client";

import { Radio, ArrowRight, ShieldCheck } from "lucide-react";
import type { LensId, SignalAnalysis } from "@/lib/types";
import { LENSES, withAlpha } from "@/lib/lenses";
import { LENS_ICON } from "./lensIcons";

export default function InteractiveLensEngine({
  selectedSignal,
  activeLens,
  onLensSelect,
  reasoning = false,
}: {
  selectedSignal: SignalAnalysis;
  activeLens: "all" | LensId;
  onLensSelect: (l: "all" | LensId) => void;
  reasoning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#05070F] p-6 lg:p-8 relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950 to-[#05070F] opacity-90 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: identity + the incoming signal */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-sans font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-400 text-4xl select-none">
              AAP
            </span>
            <span className="bg-slate-900 border border-slate-800 text-[9px] font-mono font-bold text-slate-400 px-2 py-0.5 rounded">
              LENS ENGINE v2.0
            </span>
          </div>
          <div>
            <p className="text-xs font-mono font-bold text-cyan-400 tracking-wide">
              Same signal. Different roles. Different decisions.
            </p>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Every industry signal becomes role-specific intelligence for the people who actually
              have to act on it — advise clients, allocate budget, build products, and shape policy.
            </p>
          </div>

          {/* The signal currently entering the engine */}
          <div className="rounded-xl border border-indigo-500/30 bg-slate-950/80 p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 ${reasoning ? "animate-ping" : ""}`}
                />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                Signal // {selectedSignal.date}
              </span>
            </div>
            <p className="text-xs text-white font-semibold leading-snug">{selectedSignal.title}</p>
          </div>

          <button
            onClick={() => onLensSelect("all")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-mono tracking-wider uppercase transition-all border inline-flex items-center gap-2 ${
              activeLens === "all"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black border-transparent shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                : "bg-slate-900/60 text-slate-400 hover:text-white border-slate-800"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>All Four Lenses</span>
          </button>
        </div>

        {/* Center: the engine orb */}
        <div className="hidden lg:col-span-3 lg:flex items-center justify-center relative">
          <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-2 border-slate-800 bg-slate-950 select-none shadow-[0_0_40px_rgba(99,102,241,0.25)]">
            <div
              className={`absolute inset-1 rounded-full border-2 border-dotted border-indigo-500/25 ${reasoning ? "animate-spin-slow" : ""}`}
            />
            <div className="absolute inset-3 rounded-full border border-indigo-400/30 opacity-60" />
            <div className="relative z-10 text-center flex flex-col items-center px-4">
              <div className="p-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-1">
                <Radio className={`w-4 h-4 text-indigo-400 ${reasoning ? "animate-pulse" : ""}`} />
              </div>
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-black">
                AAP
              </span>
              <h4 className="text-xs font-sans font-black text-white tracking-widest uppercase mt-0.5 whitespace-nowrap">
                Lens Engine
              </h4>
              <p className="text-[9px] text-amber-500 font-mono mt-1">One Signal. Infinite Impact.</p>
            </div>
          </div>

          {/* Scalable decorative connectors */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {LENSES.map((lens, i) => {
              const y = 14 + i * 24;
              const on = activeLens === "all" || activeLens === lens.id;
              return (
                <path
                  key={lens.id}
                  d={`M 50 50 C 75 50, 85 ${y}, 100 ${y}`}
                  fill="none"
                  stroke={on ? lens.color : "#1e293b"}
                  strokeWidth={activeLens === lens.id ? 1.4 : 0.7}
                  strokeDasharray="3 3"
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
        </div>

        {/* Right: the four lens lanes */}
        <div className="lg:col-span-5 space-y-2.5">
          {LENSES.map((lens) => {
            const Icon = LENS_ICON[lens.id];
            const isActive = activeLens === lens.id;
            const dimmed = activeLens !== "all" && !isActive;
            return (
              <button
                key={lens.id}
                onClick={() => onLensSelect(isActive ? "all" : lens.id)}
                className={`group w-full text-left rounded-xl border p-3 flex items-center justify-between transition-all duration-300 relative overflow-hidden ${
                  dimmed ? "opacity-35 scale-[0.99]" : ""
                }`}
                style={{
                  borderColor: isActive ? lens.color : withAlpha(lens.color, 0.25),
                  backgroundColor: isActive ? withAlpha(lens.color, 0.08) : "rgba(15,23,42,0.4)",
                  boxShadow: isActive ? `0 0 20px ${withAlpha(lens.color, 0.25)}` : "none",
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 transition-all"
                  style={{ backgroundColor: lens.color, opacity: dimmed ? 0.2 : 1 }}
                />
                <div className="flex items-center gap-3 pl-1.5">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: withAlpha(lens.color, 0.12),
                      borderColor: withAlpha(lens.color, 0.3),
                      color: lens.color,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-[10px] font-mono tracking-wider font-extrabold"
                        style={{ color: isActive ? lens.color : "#cbd5e1" }}
                      >
                        {lens.role.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                        → {lens.deliverable}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{lens.voice}</p>
                  </div>
                </div>
                <ArrowRight
                  className="w-4 h-4 shrink-0 ml-2 transition-transform group-hover:translate-x-0.5"
                  style={{ color: isActive ? lens.color : "#475569" }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Disclosure ribbon */}
      <div className="mt-7 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500/30 border border-violet-500/60" />
          <span>
            Produced by <strong className="text-white">Ada</strong> / AI Intelligence Analyst
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>
            Reviewed by <strong className="text-white">Rachel</strong> / Editor-in-Chief
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/30 border border-cyan-500/60" />
          <span>
            Sources Available /{" "}
            <strong className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-teal-300">
              Transparent. Credible. Actionable.
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
