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

  const comment =
    rachelComment.length > 96 ? rachelComment.slice(0, 96) + "…" : rachelComment;

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-e1">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-lg font-semibold text-ink">
            R
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">Rachel, Editor-in-Chief</h3>
              <span className="text-2xs text-ink-faint">30s briefing</span>
            </div>
            <p className="mt-1 max-w-md text-sm italic text-ink-muted">
              &ldquo;{comment}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {isPlaying && (
            <div
              className="flex h-9 items-end gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-2"
              aria-hidden="true"
            >
              {[0, 0.12, 0.24, 0.36, 0.48].map((delay, i) => (
                <span
                  key={i}
                  className="level-bar h-full w-1 rounded-sm bg-accent"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          )}
          <button
            onClick={toggle}
            disabled={isLoading}
            aria-pressed={isPlaying}
            className={`flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${
              isPlaying
                ? "border border-border bg-surface-2 text-ink hover:bg-surface"
                : "bg-accent text-accent-ink hover:bg-accent-hover"
            }`}
          >
            {isLoading ? (
              <>
                <span className="working h-3.5 w-3.5 rounded-full" />
                <span>Synthesizing…</span>
              </>
            ) : isPlaying ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Play briefing</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="thin-scroll mt-4 max-h-32 overflow-y-auto rounded-md border border-border bg-surface-2 p-3.5">
        <div className="mb-1.5 flex w-fit items-center gap-1.5 text-2xs text-ink-faint">
          <Mic className="h-3 w-3 text-ink-faint" />
          <span>
            Audio script. {via ? `AI voice via ${via}.` : "AI-generated voice, disclosed."}
          </span>
        </div>
        <p className="text-sm italic leading-relaxed text-ink-muted">
          &ldquo;{script}&rdquo;
        </p>
      </div>
    </div>
  );
}
