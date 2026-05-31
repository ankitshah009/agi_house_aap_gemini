"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGrid, Gauge, Clapperboard, AlertTriangle } from "lucide-react";
import { CURATED_SIGNALS } from "@/lib/data";
import { TODAY } from "@/lib/daily";
import { LENSES } from "@/lib/lenses";
import type { EngineMode, LensId, MasterBrief as MasterBriefData, SignalAnalysis } from "@/lib/types";
import { usePulseStream } from "@/hooks/usePulseStream";
import BrandHeader from "./BrandHeader";
import ThemeToggle from "./ThemeToggle";
import SignalFeed from "./SignalFeed";
import ModeToggle from "./ModeToggle";
import Playground from "./Playground";
import PipelineTracker from "./PipelineTracker";
import MasterBrief from "./MasterBrief";
import PulseScoreBreakdown from "./PulseScoreBreakdown";
import LensCards from "./LensCards";
import DailyBriefInfographic from "./DailyBriefInfographic";
import ShortFormReel from "./ShortFormReel";
import AudioBriefing from "./AudioBriefing";
import AskAda from "./AskAda";
import AAPEngineDisclosure from "./AAPEngineDisclosure";
import DailyPulse from "./DailyPulse";
import InfographicCard from "./InfographicCard";

type View = "cards" | "brief" | "reel";

const VIEWS: { id: View; label: string; icon: typeof LayoutGrid }[] = [
  { id: "cards", label: "Pulse Cards", icon: LayoutGrid },
  { id: "brief", label: "60s Brief", icon: Gauge },
  { id: "reel", label: "Video Brief", icon: Clapperboard },
];

// Active lens-filter chip colors (functional category color; static for Tailwind).
const LENS_CHIP: Record<LensId, string> = {
  strategist: "border-lens-strategist/50 bg-lens-strategist/10 text-lens-strategist",
  executive: "border-lens-executive/50 bg-lens-executive/10 text-lens-executive",
  gtm: "border-lens-gtm/50 bg-lens-gtm/10 text-lens-gtm",
  policy: "border-lens-policy/50 bg-lens-policy/10 text-lens-policy",
};

// MasterBrief needs a full brief; synthesize from summary when the pipeline hasn't
// produced one (keeps old fixtures + live single-call output valid).
function toBrief(a: SignalAnalysis): MasterBriefData {
  return (
    a.masterBrief ?? {
      whatHappened: a.summary,
      whyItMatters: "",
      keyImplications: [],
      whatToWatch: [],
    }
  );
}

const HORIZONS: { key: "now" | "next" | "later"; label: string }[] = [
  { key: "now", label: "Now" },
  { key: "next", label: "Next" },
  { key: "later", label: "Later" },
];

export default function PulseConsole() {
  const stream = usePulseStream(CURATED_SIGNALS[0]);
  const [mode, setMode] = useState<EngineMode>("cached");
  const [selectedId, setSelectedId] = useState<string>(CURATED_SIGNALS[0].id);
  const [view, setView] = useState<View>("cards");
  const [activeLens, setActiveLens] = useState<"all" | LensId>("all");
  const [customSignals, setCustomSignals] = useState<SignalAnalysis[]>([]);
  const pendingCustomRef = useRef(false);
  const detailRef = useRef<HTMLElement | null>(null);

  const analysis = stream.analysis;
  const busy = stream.phase === "reasoning";
  const allSignals = [...customSignals, ...CURATED_SIGNALS];

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
    const custom = customSignals.find((s) => s.id === id);
    if (custom) stream.show(custom);
    else stream.run({ signalId: id, mode });
  };

  const onDeepDive = (id: string) => {
    onSelect(id);
    requestAnimationFrame(() =>
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const onPlayground = (text: string) => {
    if (busy) return;
    pendingCustomRef.current = true;
    stream.run({ signal: text, mode: mode === "cached" ? "fast" : mode });
  };

  const sourceLabel =
    stream.source === "agent" ? "Ada · Live" : stream.source === "fast" ? "Gemini" : "Cached";
  const brief = toBrief(analysis);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <BrandHeader />

      {/* Quiet scope strip (no gradient, no ping) */}
      <div className="border-b border-border bg-surface-2">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-accent status-live shrink-0" aria-hidden="true" />
            <span className="text-sm text-ink truncate">One signal, four decisions</span>
            <span className="hidden sm:inline text-xs text-ink-faint">· One signal. Infinite impact.</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <DailyPulse brief={TODAY} selectedId={selectedId} onDeepDive={onDeepDive} />
      </div>

      <main
        ref={detailRef}
        className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* LEFT RAIL */}
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
          <PipelineTracker events={stream.agentEvents} progress={stream.progress} />
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {stream.fallback && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-warning-soft px-3 py-2 text-sm text-ink">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" aria-hidden="true" />
              Live engine fell back to a vetted brief. The cards below are guaranteed.
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-ink-muted">
              {analysis.category}
            </span>
            <span className="font-mono text-ink-faint">{analysis.date}</span>
            <span
              className={`rounded-md border px-2 py-0.5 ${
                stream.source === "cached"
                  ? "border-border text-ink-muted"
                  : "border-accent text-accent-quiet"
              }`}
            >
              {sourceLabel}
            </span>
          </div>

          <MasterBrief brief={brief} confidence={analysis.confidence} />
          <InfographicCard
            key={analysis.id}
            title={analysis.title}
            summary={analysis.summary}
            brief={brief.whatHappened}
          />
          {analysis.pulseScore && <PulseScoreBreakdown score={analysis.pulseScore} />}

          {/* View tabs (Linear under-tab indicator) */}
          <div className="flex items-center gap-1 border-b border-border">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              const on = view === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`relative flex items-center gap-1.5 px-3 min-h-11 text-sm transition-colors duration-fast ${
                    on ? "text-ink font-medium" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {v.label}
                  {on && (
                    <span
                      className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {view === "cards" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter lenses">
                <button
                  onClick={() => setActiveLens("all")}
                  className={`min-h-9 rounded-full border px-3 text-xs font-medium transition-colors duration-fast ${
                    activeLens === "all"
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-border bg-surface text-ink-muted hover:text-ink"
                  }`}
                >
                  All lenses
                </button>
                {LENSES.map((l) => {
                  const on = activeLens === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setActiveLens(on ? "all" : l.id)}
                      aria-pressed={on}
                      className={`min-h-9 inline-flex items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-fast ${
                        on ? LENS_CHIP[l.id] : "border-border bg-surface text-ink-muted hover:text-ink"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${l.dotClass}`} aria-hidden="true" />
                      {l.role}
                    </button>
                  );
                })}
              </div>
              <LensCards cards={analysis.cards} activeLens={activeLens} />
            </div>
          )}
          {view === "brief" && <DailyBriefInfographic analysis={analysis} />}
          {view === "reel" && (
            <div className="py-2">
              <ShortFormReel analysis={analysis} />
            </div>
          )}

          <AudioBriefing
            script={analysis.audioScript ?? analysis.summary}
            rachelComment={analysis.rachelEicComment}
          />

          <AskAda analysis={analysis} />

          {/* Editorial sign-off + Now/Next/Later */}
          <section className="rounded-lg border border-border bg-surface p-5 shadow-e1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-ink">Editorial</span>
              <span className="text-ink-muted">reviewed for clarity, hype, and duplicates.</span>
            </div>
            <p className="mt-2 max-w-[68ch] text-sm italic text-ink-muted">
              {analysis.rachelEicComment}
            </p>
            {analysis.actionHorizon && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-4">
                {HORIZONS.map(({ key, label }) => (
                  <div key={key}>
                    <div className="text-xs font-medium text-ink-muted mb-1.5">{label}</div>
                    <ul className="space-y-1">
                      {analysis.actionHorizon![key].map((item, i) => (
                        <li key={i} className="text-sm text-ink leading-snug">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          <AAPEngineDisclosure
            sources={analysis.disclosure.sources}
            provenanceHash={analysis.disclosure.provenanceHash}
          />
        </div>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
          <p>Ad AI Pulse. From signal to strategy.</p>
          <div className="flex items-center gap-2">
            <span>Rachel, Editor-in-Chief</span>
            <span className="text-border-strong" aria-hidden="true">·</span>
            <span>Ada, AI Research Analyst</span>
            <span className="text-border-strong" aria-hidden="true">·</span>
            <span>AAP Engine provenance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
