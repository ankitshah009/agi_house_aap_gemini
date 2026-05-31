"use client";

// The Rachel Brief surface: the generated 25–30s script (editable), Copy Script, an
// optional "Refine with Gemini" pass, and audio playback (server Gemini TTS -> Web Speech).

import { useRef, useState } from "react";
import { Copy, Check, Play, Square, Sparkles, Mic, Loader2 } from "lucide-react";
import type { LensView } from "@/lib/pulseSignal";
import { estimateSeconds, generateRachelBriefAudio, type BriefAudio } from "@/lib/rachelBrief";
import { withAlpha } from "@/lib/lenses";

type AudioState = "idle" | "loading" | "playing";

export default function RachelBriefPanel({
  script,
  lens,
  refined,
  refining,
  onScriptChange,
  onRefine,
}: {
  script: string;
  lens: LensView;
  refined: boolean;
  refining: boolean;
  onScriptChange: (value: string) => void;
  onRefine: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [audio, setAudio] = useState<AudioState>("idle");
  const [via, setVia] = useState<"server" | "browser" | null>(null);
  const audioRef = useRef<BriefAudio | null>(null);

  const seconds = estimateSeconds(script);
  const words = script.trim().split(/\s+/).filter(Boolean).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  const stop = () => {
    audioRef.current?.stop();
    audioRef.current = null;
    setAudio("idle");
  };

  const toggleAudio = async () => {
    if (audio === "playing") {
      stop();
      return;
    }
    setAudio("loading");
    const player = await generateRachelBriefAudio(script, () => {
      audioRef.current = null;
      setAudio("idle");
    });
    if (!player) {
      setAudio("idle");
      return;
    }
    audioRef.current = player;
    setVia(player.via);
    setAudio("playing");
    try {
      await player.play();
    } catch {
      stop();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-gradient-to-br from-violet-600/10 to-teal-400/0 blur-3xl" />

      {/* header */}
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-500 bg-slate-800 text-lg font-bold text-amber-500 shadow-lg"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              R
            </div>
            {audio === "playing" && (
              <span className="absolute bottom-0 right-0 h-3 w-3 animate-pulse rounded-full border-2 border-slate-900 bg-emerald-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-sans text-sm font-bold text-slate-100">Rachel Brief</h3>
              <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-400">
                {seconds}s · {words}w
              </span>
              {refined && (
                <span className="rounded border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 font-mono text-[10px] text-violet-300">
                  Gemini-refined
                </span>
              )}
            </div>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
              Voiceover script · {lens.label}
            </p>
          </div>
        </div>

        {audio === "playing" && (
          <div className="flex h-8 items-end gap-1 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-2">
            <div className="animate-wave-1 h-full w-1 origin-bottom rounded-sm bg-teal-400" />
            <div className="animate-wave-2 h-full w-1 origin-bottom rounded-sm bg-teal-400" />
            <div className="animate-wave-3 h-full w-1 origin-bottom rounded-sm bg-teal-400" />
            <div className="animate-wave-4 h-full w-1 origin-bottom rounded-sm bg-teal-400" />
            <div className="animate-wave-5 h-full w-1 origin-bottom rounded-sm bg-teal-400" />
          </div>
        )}
      </div>

      {/* editable script */}
      <div className="relative mt-4">
        <div className="mb-1 flex w-fit items-center gap-1 rounded bg-slate-900/60 px-2 py-0.5 font-mono text-[10px] text-slate-400">
          <Mic className="h-3 w-3 text-amber-500" />
          <span>AUDIO SCRIPT{via ? ` · AI VOICE VIA ${via.toUpperCase()}` : " · EDITABLE"}</span>
        </div>
        <textarea
          value={script}
          onChange={(e) => onScriptChange(e.target.value)}
          rows={5}
          spellCheck={false}
          className="thin-scroll w-full resize-none rounded-lg border border-slate-800/60 bg-slate-950/50 p-3.5 text-[13px] italic leading-relaxed text-slate-200 outline-none focus:border-slate-700"
          style={{ fontFamily: "var(--font-serif)" }}
        />
      </div>

      {/* controls */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleAudio}
          disabled={audio === "loading" || !script.trim()}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-all disabled:opacity-50"
          style={{ background: audio === "playing" ? "rgba(225,29,72,0.2)" : `linear-gradient(90deg, ${lens.color}, ${withAlpha(lens.color, 0.7)})` }}
        >
          {audio === "loading" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Synthesizing…</span>
            </>
          ) : audio === "playing" ? (
            <>
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Generate Audio</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition-colors hover:bg-slate-800"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? "Copied" : "Copy Script"}</span>
        </button>

        <button
          type="button"
          onClick={onRefine}
          disabled={refining || !script.trim()}
          className="ml-auto flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-violet-200 transition-colors hover:bg-violet-500/20 disabled:opacity-50"
          title="Tighten the script with Gemini (local template stays as fallback)"
        >
          {refining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          <span>{refining ? "Refining…" : "Refine with Gemini"}</span>
        </button>
      </div>
    </div>
  );
}
