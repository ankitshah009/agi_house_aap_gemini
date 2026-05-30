"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Square, Mic } from "lucide-react";

export default function AudioBriefing({
  script,
  rachelComment,
}: {
  script: string;
  rachelComment: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [via, setVia] = useState<"server" | "browser" | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") synthRef.current = window.speechSynthesis;
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = () => {
    synthRef.current?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const playBrowser = () => {
    const synth = synthRef.current;
    if (!synth || !script) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(script);
    const voices = synth.getVoices();
    const pick = voices.find(
      (v) =>
        v.name.includes("Google US English") ||
        v.name.includes("Samantha") ||
        v.name.includes("Female") ||
        v.lang.startsWith("en-US"),
    );
    if (pick) u.voice = pick;
    u.rate = 1.0;
    u.pitch = 1.05;
    u.onend = () => setIsPlaying(false);
    u.onerror = () => setIsPlaying(false);
    setVia("browser");
    setIsPlaying(true);
    synth.speak(u);
  };

  const toggle = async () => {
    if (isPlaying) {
      stop();
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: script }),
      });
      if (res.ok) {
        const data = (await res.json()) as { audio?: string; mime?: string };
        if (data.audio) {
          const bytes = atob(data.audio);
          const arr = new Uint8Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
          const url = URL.createObjectURL(new Blob([arr], { type: data.mime ?? "audio/wav" }));
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => setIsPlaying(false);
          setVia("server");
          setIsPlaying(true);
          setIsLoading(false);
          await audio.play();
          return;
        }
      }
    } catch {
      /* fall through to browser */
    }
    setIsLoading(false);
    playBrowser();
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-600/10 to-teal-400/0 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500 bg-slate-800 flex items-center justify-center text-amber-500 font-bold text-lg shrink-0 shadow-lg" style={{ fontFamily: "var(--font-serif)" }}>
              R
            </div>
            {isPlaying && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-sans font-bold text-sm text-slate-100">Rachel — Editor-in-Chief</h3>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                30s Briefing
              </span>
            </div>
            <p
              className="text-xs text-slate-400 italic mt-0.5 max-w-md"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              &ldquo;{rachelComment.length > 96 ? rachelComment.slice(0, 96) + "…" : rachelComment}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isPlaying && (
            <div className="flex items-end gap-1 px-2.5 py-2 rounded-lg bg-slate-950/60 border border-slate-800 h-8">
              <div className="w-1 h-full bg-teal-400 rounded-sm origin-bottom animate-wave-1" />
              <div className="w-1 h-full bg-teal-400 rounded-sm origin-bottom animate-wave-2" />
              <div className="w-1 h-full bg-teal-400 rounded-sm origin-bottom animate-wave-3" />
              <div className="w-1 h-full bg-teal-400 rounded-sm origin-bottom animate-wave-4" />
              <div className="w-1 h-full bg-teal-400 rounded-sm origin-bottom animate-wave-5" />
            </div>
          )}
          <button
            onClick={toggle}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all uppercase ${
              isPlaying
                ? "bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-900/20"
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Synthesizing…</span>
              </>
            ) : isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Briefing</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 bg-slate-950/50 rounded-lg p-3.5 border border-slate-800/60 max-h-32 overflow-y-auto thin-scroll">
        <div className="flex items-center gap-1 mb-1 bg-slate-900/60 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 w-fit">
          <Mic className="w-3 h-3 text-amber-500" />
          <span>
            AUDIO SCRIPT · {via ? `AI VOICE VIA ${via.toUpperCase()}` : "AI-GENERATED VOICE (DISCLOSED)"}
          </span>
        </div>
        <p
          className="text-xs text-slate-300 leading-relaxed italic"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          &ldquo;{script}&rdquo;
        </p>
      </div>
    </div>
  );
}
