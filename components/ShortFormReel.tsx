"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { LensId, SignalAnalysis } from "@/lib/types";
import { LENS_BY_ID } from "@/lib/lenses";

const BEAT_MS = 3800;

type Beat = { kind: "intro" } | { kind: "lens"; lens: LensId } | { kind: "outro" };

function firstSentence(s: string): string {
  const m = s.split(/(?<=[.!?])\s/)[0];
  return m.length > 130 ? m.slice(0, 130) + "…" : m;
}

export default function ShortFormReel({ analysis }: { analysis: SignalAnalysis }) {
  const beats: Beat[] = [
    { kind: "intro" },
    ...analysis.cards.map((c) => ({ kind: "lens" as const, lens: c.lens })),
    { kind: "outro" },
  ];

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") synthRef.current = window.speechSynthesis;
    return () => synthRef.current?.cancel();
  }, []);

  // Advance beats.
  useEffect(() => {
    if (!playing) return;
    if (idx >= beats.length - 1) {
      const t = setTimeout(() => setPlaying(false), BEAT_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIdx((i) => Math.min(i + 1, beats.length - 1)), BEAT_MS);
    return () => clearTimeout(t);
  }, [playing, idx, beats.length]);

  // Rachel voiceover (whole script, once, when sound on).
  useEffect(() => {
    const synth = synthRef.current;
    if (!synth) return;
    if (playing && !muted && idx === 0) {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(analysis.audioScript ?? analysis.summary);
      const v = synth.getVoices().find((vv) => vv.lang.startsWith("en-US"));
      if (v) u.voice = v;
      u.rate = 1.03;
      u.pitch = 1.05;
      synth.speak(u);
    }
    if (!playing || muted) synth.cancel();
  }, [playing, muted, idx, analysis]);

  const start = () => {
    setIdx(0);
    setPlaying(true);
  };
  const beat = beats[idx];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 9:16 reel frame — a deliberate dark playback stage, distinct from app chrome */}
      <div
        data-theme="dark"
        className="relative w-[270px] aspect-[9/16] rounded-lg border border-border overflow-hidden bg-surface shadow-e2"
      >
        {/* progress dots */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          {beats.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full bg-ink/20 overflow-hidden">
              <div className={`h-full bg-ink ${i <= idx ? "w-full" : "w-0"}`} />
            </div>
          ))}
        </div>

        {/* watermark — solid ink wordmark + accent dot */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5">
          <span className="font-semibold tracking-tight text-ink text-sm">Ad AI Pulse</span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        </div>

        {/* beat content — single .enter fade-up per discrete state change */}
        <div
          key={idx}
          className="enter absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-surface"
        >
          {beat.kind === "intro" && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-bold tracking-tight text-ink text-3xl">Ad AI Pulse</span>
                <span className="w-2 h-2 rounded-full bg-accent" />
              </div>
              <p className="text-xs text-ink-muted tnum">
                Breaking signal. {analysis.date}
              </p>
              <h3 className="text-base text-ink font-semibold leading-snug">{analysis.title}</h3>
              <p className="text-sm text-ink-muted">One signal. Four decisions.</p>
            </div>
          )}

          {beat.kind === "lens" &&
            (() => {
              const meta = LENS_BY_ID[beat.lens];
              const card = analysis.cards.find((c) => c.lens === beat.lens)!;
              return (
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                    <p className="text-sm font-semibold text-ink">{meta.role}</p>
                  </div>
                  <p className="text-xs text-ink-faint">{meta.deliverable}</p>
                  <div>
                    <div className="text-3xl font-semibold tnum text-ink leading-none">{card.score}</div>
                    <p className="text-2xs text-ink-faint mt-1">{card.scoreName}</p>
                  </div>
                  <p className="text-sm text-ink leading-snug px-1">{firstSentence(card.brief)}</p>
                  <div className="text-xs text-ink-muted bg-surface-2 rounded-md px-2 py-1 inline-block">
                    Now: {card.actionSteps[0]?.slice(0, 60)}
                  </div>
                </div>
              );
            })()}

          {beat.kind === "outro" && (
            <div className="space-y-3">
              <h3 className="text-lg text-ink font-semibold leading-snug">
                Same signal.
                <br />
                Different decisions.
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Produced by Ada.
                <br />
                Reviewed by Rachel.
                <br />
                Sources available.
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-ink">Ad AI Pulse</span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => (playing ? setPlaying(false) : idx >= beats.length - 1 ? start() : setPlaying(true))}
          aria-label={playing ? "Pause reel" : idx >= beats.length - 1 ? "Replay reel" : "Play reel"}
          className="flex items-center gap-1.5 bg-accent text-accent-ink hover:bg-accent-hover rounded-md px-4 min-h-11 text-sm font-medium transition-[background-color]"
        >
          {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          {playing ? "Pause" : idx >= beats.length - 1 ? "Replay" : "Play reel"}
        </button>
        <button
          onClick={start}
          aria-label="Restart reel"
          className="flex items-center justify-center rounded-md border border-border text-ink-muted hover:text-ink hover:bg-surface-2 min-h-11 min-w-11 transition-[color,background-color]"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute Rachel voiceover" : "Mute Rachel voiceover"}
          aria-pressed={!muted}
          className="flex items-center justify-center rounded-md border border-border text-ink-muted hover:text-ink hover:bg-surface-2 min-h-11 min-w-11 transition-[color,background-color]"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-2xs text-ink-faint text-center">
        Rachel as creator. {muted ? "Voiceover muted." : "AI voiceover on."} AI-generated.
      </p>
    </div>
  );
}
