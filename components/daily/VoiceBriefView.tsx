"use client";

// Format 2 — the Voice Brief. Rachel reads the day's three moves for the selected lens.
// Script via generateDailyVoiceBrief(); audio via the Gemini TTS route with Web Speech fallback.

import { useEffect, useRef, useState } from "react";
import { Play, Square, Copy, Check, Mic, Loader2 } from "lucide-react";
import type { DailyView } from "@/lib/dailyBrief";
import { generateDailyVoiceBrief, generateRachelBriefAudio, estimateSeconds, type BriefAudio } from "@/lib/rachelBrief";
import { withAlpha } from "@/lib/lenses";

type AudioState = "idle" | "loading" | "playing";

export default function VoiceBriefView({ view }: { view: DailyView }) {
  const [script, setScript] = useState(() => generateDailyVoiceBrief(view));
  const [copied, setCopied] = useState(false);
  const [audio, setAudio] = useState<AudioState>("idle");
  const [via, setVia] = useState<"server" | "browser" | null>(null);
  const audioRef = useRef<BriefAudio | null>(null);

  // Regenerate the script when the lens changes; stop any playback.
  useEffect(() => {
    setScript(generateDailyVoiceBrief(view));
    audioRef.current?.stop();
    audioRef.current = null;
    setAudio("idle");
  }, [view]);

  const seconds = estimateSeconds(script);
  const words = script.trim().split(/\s+/).filter(Boolean).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const stop = () => {
    audioRef.current?.stop();
    audioRef.current = null;
    setAudio("idle");
  };

  const toggle = async () => {
    if (audio === "playing") return stop();
    setAudio("loading");
    const player = await generateRachelBriefAudio(script, () => {
      audioRef.current = null;
      setAudio("idle");
    });
    if (!player) return setAudio("idle");
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
    <div className="animate-deal-in grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* player + script */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-5 lg:col-span-2">
        <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-gradient-to-br from-violet-600/10 to-teal-400/0 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-500 bg-slate-800 text-lg font-bold text-amber-500 shadow-lg"
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
                <h3 className="font-sans text-sm font-bold text-slate-100">Voice Brief — Rachel</h3>
                <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-400">
                  {seconds}s · {words}w
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                The day in audio · {view.lensLabel}
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

        <div className="relative mt-4">
          <div className="mb-1 flex w-fit items-center gap-1 rounded bg-slate-900/60 px-2 py-0.5 font-mono text-[10px] text-slate-400">
            <Mic className="h-3 w-3 text-amber-500" />
            <span>AUDIO SCRIPT{via ? ` · AI VOICE VIA ${via.toUpperCase()}` : " · EDITABLE"}</span>
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={7}
            spellCheck={false}
            className="thin-scroll w-full resize-none rounded-lg border border-slate-800/60 bg-slate-950/50 p-3.5 text-[13px] italic leading-relaxed text-slate-200 outline-none focus:border-slate-700"
            style={{ fontFamily: "var(--font-serif)" }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            disabled={audio === "loading" || !script.trim()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-all disabled:opacity-50"
            style={{ background: audio === "playing" ? "rgba(225,29,72,0.2)" : `linear-gradient(90deg, ${view.color}, ${withAlpha(view.color, 0.7)})` }}
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
                <span>Play Briefing</span>
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
        </div>
      </div>

      {/* chapters — visual aid while listening */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">In this briefing</span>
        <div className="mt-3 flex flex-col gap-2.5">
          {view.movers.map((m, i) => (
            <div key={m.signalId} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-black tabular-nums"
                style={{ backgroundColor: withAlpha(m.color, 0.14), color: m.color }}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white">
                  {m.company} <span className="font-mono text-[10px] font-normal text-slate-500">· {m.move}</span>
                </div>
                <p className="text-[11px] leading-snug text-slate-400">{m.impact}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-slate-800/70 pt-2.5 text-[10px] font-mono text-slate-600">{view.disclosure}</div>
      </div>
    </div>
  );
}
