"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { LensId, SignalAnalysis } from "@/lib/types";
import { LENS_BY_ID, withAlpha } from "@/lib/lenses";
import { LENS_ICON } from "./lensIcons";

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
      {/* 9:16 reel frame */}
      <div className="relative w-[270px] aspect-[9/16] rounded-2xl border border-slate-800 overflow-hidden bg-[#05070F] shadow-2xl">
        {/* progress dots */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          {beats.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full bg-white/15 overflow-hidden">
              <div className={`h-full bg-white/80 ${i < idx ? "w-full" : i === idx ? "w-full" : "w-0"}`} />
            </div>
          ))}
        </div>

        {/* watermark */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5">
          <span className="font-sans font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 text-sm">
            AAP
          </span>
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">30s</span>
        </div>

        {/* beat content */}
        <div key={idx} className="animate-deal-in absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          {beat.kind === "intro" && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-[#05070F]" />
              <div className="relative z-10 space-y-3">
                <span className="font-sans font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-400 text-4xl">
                  AAP
                </span>
                <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  Breaking Signal · {analysis.date}
                </p>
                <h3
                  className="text-base text-white font-semibold leading-snug"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {analysis.title}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">One signal. Four decisions.</p>
              </div>
            </>
          )}

          {beat.kind === "lens" &&
            (() => {
              const meta = LENS_BY_ID[beat.lens];
              const Icon = LENS_ICON[beat.lens];
              const card = analysis.cards.find((c) => c.lens === beat.lens)!;
              return (
                <>
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(ellipse at center, ${withAlpha(meta.color, 0.22)}, #05070F 75%)`,
                    }}
                  />
                  <div className="relative z-10 space-y-3 w-full">
                    <div
                      className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center border"
                      style={{
                        backgroundColor: withAlpha(meta.color, 0.15),
                        borderColor: withAlpha(meta.color, 0.4),
                        color: meta.color,
                      }}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: meta.color }}>
                        {meta.role}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        → {meta.deliverable}
                      </p>
                    </div>
                    <div
                      className="text-4xl font-mono font-black tabular-nums leading-none"
                      style={{ color: meta.color }}
                    >
                      {card.score}
                      <span className="text-[10px] text-slate-500 block font-sans tracking-widest uppercase mt-1">
                        {card.scoreName}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-200 leading-snug px-1">{firstSentence(card.brief)}</p>
                    <div
                      className="text-[10px] font-mono rounded px-2 py-1 inline-block"
                      style={{ color: meta.color, backgroundColor: withAlpha(meta.color, 0.12) }}
                    >
                      NOW: {card.actionSteps[0]?.slice(0, 60)}
                    </div>
                  </div>
                </>
              );
            })()}

          {beat.kind === "outro" && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-[#05070F]" />
              <div className="relative z-10 space-y-3">
                <h3 className="text-lg text-white font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
                  Same Signal.
                  <br />
                  <span className="text-cyan-400">Different Decisions.</span>
                </h3>
                <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                  Produced by Ada
                  <br />
                  Reviewed by Rachel
                  <br />
                  Sources available
                </p>
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Ad AI Pulse</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => (playing ? setPlaying(false) : idx >= beats.length - 1 ? start() : setPlaying(true))}
          className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all"
        >
          {playing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          {playing ? "Pause" : idx >= beats.length - 1 ? "Replay" : "Play Reel"}
        </button>
        <button
          onClick={start}
          className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Restart"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title={muted ? "Unmute Rachel voiceover" : "Mute"}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-teal-400" />}
        </button>
      </div>
      <p className="text-[10px] font-mono text-slate-500 text-center">
        Rachel as creator · {muted ? "voiceover muted" : "AI voiceover on"} · AI-generated
      </p>
    </div>
  );
}
