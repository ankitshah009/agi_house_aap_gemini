"use client";

// Wires Deliverables 4 + 5 together for the demo page.
//   • Signal source toggle: the live engine fixture (Ankit's SignalAnalysis) vs the external
//     JSON contract — both flow through the same view model, proving the card is source-agnostic.
//   • Switch Lens: instant, from preloaded data.
//   • Generate Rachel Brief: builds the script from the selected lens; it stays in sync as
//     you switch lenses, and can be refined with Gemini.

import { useState } from "react";
import { Radio, FileJson, Sparkles } from "lucide-react";
import type { LensId } from "@/lib/types";
import type { PulseSignalView } from "@/lib/pulseSignal";
import { briefForView, refineRachelBrief } from "@/lib/rachelBrief";
import PulseCard from "./PulseCard";
import LensSwitcher from "./LensSwitcher";
import RachelBriefPanel from "./RachelBriefPanel";

export interface DemoSignal {
  label: string;
  sublabel: string;
  view: PulseSignalView;
}

export default function PulseCardDemo({ signals }: { signals: DemoSignal[] }) {
  const [signalIdx, setSignalIdx] = useState(0);
  const view = signals[signalIdx].view;
  const [activeLens, setActiveLens] = useState<LensId>(view.lenses[0]?.lensId ?? "strategist");

  const [script, setScript] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const [refined, setRefined] = useState(false);

  const lens = view.lensById[activeLens] ?? view.lenses[0];

  // Keep the brief in sync with whatever lens/signal is showing (only once it exists).
  const resyncBrief = (v: PulseSignalView, lensId: LensId) => {
    if (script !== null) {
      setScript(briefForView(v, lensId));
      setRefined(false);
    }
  };

  const changeLens = (id: LensId) => {
    setActiveLens(id);
    resyncBrief(view, id);
  };

  const changeSignal = (idx: number) => {
    setSignalIdx(idx);
    const v = signals[idx].view;
    const first = v.lenses[0]?.lensId ?? "strategist";
    setActiveLens(first);
    resyncBrief(v, first);
  };

  const generate = () => {
    setScript(briefForView(view, activeLens));
    setRefined(false);
  };

  const refine = async () => {
    if (script === null) return;
    setRefining(true);
    const { script: out, refined: ok } = await refineRachelBrief(script);
    setScript(out);
    setRefined(ok);
    setRefining(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* title + signal source toggle */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-sans text-xl font-extrabold tracking-tight text-white">Pulse Card</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            One signal, four role-specific decisions — rendered from structured Lens Engine JSON.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950/60 p-1">
          {signals.map((s, idx) => {
            const on = idx === signalIdx;
            const Icon = idx === 0 ? Radio : FileJson;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => changeSignal(idx)}
                aria-pressed={on}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  on ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{s.label}</span>
                <span className="hidden font-mono text-[9px] uppercase tracking-wider text-slate-500 sm:inline">
                  {s.sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <LensSwitcher lenses={view.lenses} active={activeLens} onChange={changeLens} />

      <PulseCard signal={view.signal} lens={lens} disclosure={view.disclosure} />

      {/* Rachel Brief */}
      {script === null ? (
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="font-sans text-sm font-bold text-white">Generate the Rachel Brief</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              A 25–30 second voiceover script for the <span className="text-slate-200">{lens.label}</span> lens — reviewed by Rachel, narrated by Gemini.
            </p>
          </div>
          <button
            type="button"
            onClick={generate}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-900/30 transition-all hover:from-violet-500 hover:to-indigo-500"
          >
            <Sparkles className="h-4 w-4" />
            Generate Rachel Brief
          </button>
        </div>
      ) : (
        <RachelBriefPanel
          script={script}
          lens={lens}
          refined={refined}
          refining={refining}
          onScriptChange={(v) => {
            setScript(v);
            setRefined(false);
          }}
          onRefine={refine}
        />
      )}
    </div>
  );
}
