"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, LayoutGrid, Gauge, Clapperboard, Activity } from "lucide-react";
import { CURATED_SIGNALS } from "@/lib/data";
import type { EngineMode, LensId, SignalAnalysis } from "@/lib/types";
import { usePulseStream } from "@/hooks/usePulseStream";
import BrandHeader from "./BrandHeader";
import InteractiveLensEngine from "./InteractiveLensEngine";
import SignalFeed from "./SignalFeed";
import ModeToggle from "./ModeToggle";
import Playground from "./Playground";
import ReasoningPanel from "./ReasoningPanel";
import AudioBriefing from "./AudioBriefing";
import HypeAndEditorial from "./HypeAndEditorial";
import LensCards from "./LensCards";
import DailyBriefInfographic from "./DailyBriefInfographic";
import ShortFormReel from "./ShortFormReel";
import AskAda from "./AskAda";
import AAPEngineDisclosure from "./AAPEngineDisclosure";

type View = "cards" | "brief" | "reel";
const CURATED_IDS = new Set(CURATED_SIGNALS.map((s) => s.id));

const VIEWS: { id: View; label: string; icon: typeof LayoutGrid }[] = [
  { id: "cards", label: "Pulse Cards", icon: LayoutGrid },
  { id: "brief", label: "60s Brief", icon: Gauge },
  { id: "reel", label: "Reel", icon: Clapperboard },
];

export default function PulseConsole() {
  const stream = usePulseStream(CURATED_SIGNALS[0]);
  const [mode, setMode] = useState<EngineMode>("cached");
  const [selectedId, setSelectedId] = useState<string>(CURATED_SIGNALS[0].id);
  const [activeLens, setActiveLens] = useState<"all" | LensId>("all");
  const [view, setView] = useState<View>("cards");
  const [customSignals, setCustomSignals] = useState<SignalAnalysis[]>([]);
  const pendingCustomRef = useRef(false);

  const analysis = stream.analysis;
  const busy = stream.phase === "reasoning";
  const allSignals = [...customSignals, ...CURATED_SIGNALS];

  // Capture a free-text (playground) result into the feed once it finishes.
  useEffect(() => {
    if (stream.phase === "done" && pendingCustomRef.current) {
      pendingCustomRef.current = false;
      const a = stream.analysis;
      setCustomSignals((prev) => (prev.some((s) => s.id === a.id) ? prev : [a, ...prev]));
      setSelectedId(a.id);
    }
  }, [stream.phase, stream.analysis]);

  const onSelect = (id: string) => {
    if (busy) return;
    setSelectedId(id);
    setActiveLens("all");
    const custom = customSignals.find((s) => s.id === id);
    if (custom) {
      stream.show(custom); // already analyzed — instant
    } else {
      // Curated signal: run it. Cached = animated fixture; Fast/Agent = live (falls back to fixture).
      stream.run({ signalId: id, mode });
    }
  };

  const onPlayground = (text: string) => {
    if (busy) return;
    pendingCustomRef.current = true;
    setActiveLens("all");
    stream.run({ signal: text, mode: mode === "cached" ? "fast" : mode });
  };

  const sourceLabel =
    stream.source === "agent" ? "Ada · Live" : stream.source === "fast" ? "Gemini · Fast" : "Cached";

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader />

      {/* scope banner */}
      <div className="bg-gradient-to-r from-violet-950/20 via-slate-900/40 to-amber-950/20 border-b border-slate-800/80 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
            </span>
            <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase font-black">
              AAP Lens Engine™
            </span>
            <span className="text-xs text-slate-300">One Signal → Four Decisions</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">
            Tagline: <span className="text-amber-400">One Signal. Infinite Impact.</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto px-4 md:px-6 pt-6">
        <InteractiveLensEngine
          selectedSignal={analysis}
          activeLens={activeLens}
          onLensSelect={setActiveLens}
          reasoning={busy}
        />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left rail */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <SignalFeed
            signals={allSignals}
            selectedId={selectedId}
            onSelect={onSelect}
            customIds={new Set(customSignals.map((s) => s.id))}
            disabled={busy}
          />
          <ModeToggle mode={mode} onChange={setMode} disabled={busy} />
          <Playground onSubmit={onPlayground} disabled={busy} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900/20 to-slate-950/60 p-6 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide uppercase">
                  {analysis.category}
                </span>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span
                    className={`px-2 py-0.5 rounded border ${
                      stream.source === "cached"
                        ? "border-slate-700 text-slate-400"
                        : "border-emerald-500/40 text-emerald-400"
                    }`}
                  >
                    {sourceLabel}
                  </span>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{analysis.date}</span>
                </div>
              </div>
              <h2
                className="font-semibold text-xl md:text-2xl leading-tight text-white"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {analysis.title}
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed pl-3 border-l-2 border-indigo-500/60 bg-slate-950/20 py-2 rounded-r-lg">
                <span className="text-indigo-400 uppercase font-mono tracking-widest text-[9px] block mb-1 font-bold">
                  Brief Summary
                </span>
                {analysis.summary}
              </p>
            </div>

            {busy ? (
              <ReasoningPanel log={stream.log} progress={stream.progress} />
            ) : (
              <AudioBriefing
                script={analysis.audioScript ?? analysis.summary}
                rachelComment={analysis.rachelEicComment}
              />
            )}

            {stream.fallback && !busy && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                <Activity className="w-3.5 h-3.5" />
                Live engine fell back to a vetted brief ({stream.fallback}). Cards below are
                guaranteed.
              </div>
            )}

            <HypeAndEditorial
              hypeCheckScore={analysis.hypeCheckScore}
              hypeNotes={analysis.hypeNotes}
              rachelEicComment={analysis.rachelEicComment}
            />

            {/* View switch */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300">
                  One Intelligence · Multiple Formats
                </h4>
              </div>
              <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-lg p-1">
                {VIEWS.map((v) => {
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setView(v.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono tracking-wider uppercase transition-all ${
                        view === v.id
                          ? "bg-slate-800 text-white font-bold border border-slate-700/60"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {view === "cards" && <LensCards cards={analysis.cards} activeLens={activeLens} />}
            {view === "brief" && <DailyBriefInfographic analysis={analysis} />}
            {view === "reel" && (
              <div className="py-2">
                <ShortFormReel analysis={analysis} />
              </div>
            )}

            <AskAda analysis={analysis} />

            <AAPEngineDisclosure
              sources={analysis.disclosure.sources}
              provenanceHash={analysis.disclosure.provenanceHash}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-6 px-6 mt-6 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 text-center sm:text-left">
          <p>© 2026 Ad AI Pulse — From Signal to Strategy.</p>
          <div className="flex items-center gap-3">
            <span>Rachel · Editor-in-Chief</span>
            <span>•</span>
            <span>Ada · AI Research Analyst</span>
            <span>•</span>
            <span className="text-teal-400">AAP Engine Provenance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
