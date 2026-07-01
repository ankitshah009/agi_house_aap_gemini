"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { CURATED_SIGNALS } from "@/lib/data";
import { TODAY } from "@/lib/daily";
import { buildAllDailyViews } from "@/lib/dailyBrief";
import { LENSES, LENS_BY_ID } from "@/lib/lenses";
import { viewFromAnalysis } from "@/lib/pulseSignal";
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
import ShortFormReel from "./ShortFormReel";
import AudioBriefing from "./AudioBriefing";
import AskAda from "./AskAda";
import AAPEngineDisclosure from "./AAPEngineDisclosure";
import DailyPulse from "./DailyPulse";
import InfographicCard from "./InfographicCard";
import DailyDigest from "./DailyDigest";
import VoiceBrief from "./VoiceBrief";
import ModeSwitcher, { type BriefMode } from "./ModeSwitcher";
import PersonaSelector, { type Persona } from "./PersonaSelector";
import ReadFocus from "./ReadFocus";
import DailyLensRail from "./DailyLensRail";
import CrossSignalSynthesis from "./CrossSignalSynthesis";
import PulseCard from "./PulseCard";

// Active lens-filter chip colors (functional category color; static for Tailwind).
const LENS_CHIP: Record<LensId, string> = {
  strategist: "border-lens-strategist/50 bg-lens-strategist/10 text-lens-strategist glow-lens-strategist",
  executive: "border-lens-executive/50 bg-lens-executive/10 text-lens-executive glow-lens-executive",
  gtm: "border-lens-gtm/50 bg-lens-gtm/10 text-lens-gtm glow-lens-gtm",
  policy: "border-lens-policy/50 bg-lens-policy/10 text-lens-policy glow-lens-policy",
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
  const [briefMode, setBriefMode] = useState<BriefMode>("visual");
  const [persona, setPersona] = useState<Persona>("all");
  const [selectedId, setSelectedId] = useState<string>(CURATED_SIGNALS[0].id);
  const [activeLens, setActiveLens] = useState<"all" | LensId>("all");
  const [synthesisLens, setSynthesisLens] = useState<LensId>("strategist");
  const [customSignals, setCustomSignals] = useState<SignalAnalysis[]>([]);
  const pendingCustomRef = useRef(false);
  const modeRef = useRef<HTMLElement | null>(null);
  const dailyViews = useMemo(() => buildAllDailyViews(), []);

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

  // Deep dive = pick one story and switch into the full Read breakdown.
  const onDeepDive = (id: string) => {
    onSelect(id);
    setBriefMode("read");
    requestAnimationFrame(() =>
      modeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  // Picking a persona re-ranks the focus panel and defaults the lens cards to that role.
  const onPersona = (p: Persona) => {
    setPersona(p);
    setActiveLens(p);
    if (p !== "all") setSynthesisLens(p);
  };

  const onPlayground = (text: string) => {
    if (busy) return;
    pendingCustomRef.current = true;
    setBriefMode("read");
    stream.run({ signal: text, mode: mode === "cached" ? "fast" : mode });
  };

  const sourceLabel =
    stream.source === "agent" ? "Ada · Live" : stream.source === "fast" ? "Gemini" : "Cached";
  const brief = toBrief(analysis);
  const pulseView = useMemo(() => viewFromAnalysis(analysis), [analysis]);
  const cardLens =
    activeLens !== "all" ? activeLens : synthesisLens;
  const activeCardLens = pulseView.lensById[cardLens] ?? pulseView.lenses[0];

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <BrandHeader />

      {/* Premium masthead — the brand thesis: One signal. Four decisions. */}
      <div className="border-b border-border bg-surface-2/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-2xs font-mono uppercase tracking-[0.22em] text-ink-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-accent status-live" aria-hidden="true" />
              AAP Lens Engine
            </span>
            <ThemeToggle />
          </div>
          <h2 className="text-gradient text-3xl md:text-5xl font-extrabold leading-[1.03] tracking-tight">
            One signal. Four decisions.
          </h2>
          <p className="max-w-[54ch] text-base md:text-lg leading-relaxed text-ink-muted">
            AI-native intelligence for the AdTech and AI economy. Today&apos;s top signals, refracted through four
            professional lenses.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            {LENSES.map((l) => (
              <span key={l.id} className="inline-flex items-center gap-1.5 text-2xs text-ink-faint">
                <span className={`h-2 w-2 rounded-full ${l.dotClass}`} aria-hidden="true" />
                {l.role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hero: the day's top signals (the one source) */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-10">
        <DailyPulse brief={TODAY} selectedId={selectedId} onDeepDive={onDeepDive} />
      </div>

      {/* Personalize: pick your lens, then your format — one unified control bar */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-8">
        <div className="rounded-xl border border-border bg-surface/40 p-4 md:p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-2xs font-mono uppercase tracking-wider text-ink-faint">Your lens</span>
            <PersonaSelector persona={persona} onPersona={onPersona} />
          </div>
          <div className="h-px bg-border" aria-hidden="true" />
          <div className="flex flex-col gap-2">
            <span className="text-2xs font-mono uppercase tracking-wider text-ink-faint">Your format</span>
            <ModeSwitcher mode={briefMode} onMode={setBriefMode} />
          </div>
        </div>
      </div>

      <main
        ref={modeRef}
        className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-8"
      >
        {/* VISUAL — combined "today's 3 moves + dynamics" digest, ~60s */}
        {briefMode === "visual" && (
          <div className="flex flex-col gap-5">
            <DailyLensRail
              views={dailyViews}
              active={synthesisLens}
              onChange={setSynthesisLens}
            />
            <CrossSignalSynthesis view={dailyViews[synthesisLens]} />
            <DailyDigest
              brief={TODAY}
              dailyView={dailyViews[synthesisLens]}
              onDeepDive={onDeepDive}
            />
          </div>
        )}

        {/* VOICE — Rachel reads today's top stories */}
        {briefMode === "voice" && <VoiceBrief brief={TODAY} lensId={synthesisLens} />}

        {/* VIDEO — short Rachel video brief (optional / nice-to-have) */}
        {briefMode === "video" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-ink-faint">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Experimental: a 30-second video brief with Rachel as the creator.
            </div>
            <ShortFormReel analysis={analysis} />
          </div>
        )}

        {/* READ — combined focus overview first, then the full breakdown, 3-5 min */}
        {briefMode === "read" && (
          <div className="flex flex-col gap-6">
            <ReadFocus
              brief={TODAY}
              persona={persona}
              selectedId={selectedId}
              onSelect={onSelect}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT RAIL */}
            <div className="lg:col-span-4 flex flex-col gap-5 order-2 lg:order-1">
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

            {/* RIGHT — the deep read */}
            <div className="lg:col-span-8 flex flex-col gap-5 order-1 lg:order-2">
              {stream.fallback && (
                <div className="flex items-center gap-2 rounded-md border border-border bg-warning-soft px-3 py-2 text-sm text-ink">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" aria-hidden="true" />
                  Live engine fell back to a vetted brief. The cards below are guaranteed.
                </div>
              )}

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

              {activeCardLens && (
                <PulseCard
                  signal={pulseView.signal}
                  lens={activeCardLens}
                  disclosure={pulseView.disclosure}
                />
              )}

              <InfographicCard
                key={analysis.id}
                title={analysis.title}
                summary={analysis.summary}
                brief={brief.whatHappened}
              />
              {analysis.pulseScore && <PulseScoreBreakdown score={analysis.pulseScore} />}

              {/* The four role lenses (the moat) */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter lenses">
                  <button
                    onClick={() => setActiveLens("all")}
                    className={`min-h-9 rounded-full border px-3 text-xs font-medium transition-colors duration-fast ${
                      activeLens === "all"
                        ? "border-accent bg-accent text-accent-ink glow-accent"
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

              <AudioBriefing
                script={analysis.audioScript ?? analysis.summary}
                rachelComment={analysis.rachelEicComment}
              />

              {/* Editorial sign-off + Now/Next/Later */}
              <section className="rounded-lg border border-border bg-surface p-5 card-depth">
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
            </div>
          </div>
        )}

        {/* Ada is available in every mode (project-aware + persona-aware follow-up) */}
        <AskAda
          analysis={analysis}
          roleHint={persona === "all" ? "" : LENS_BY_ID[persona].role}
        />
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
