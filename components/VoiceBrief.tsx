"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, Mic } from "lucide-react";
import type { DailyBrief, SignalAnalysis } from "@/lib/types";

// ── Script helpers ──────────────────────────────────────────────────────────

// Strip em/en dashes (spoken voice rule: NO em-dashes), collapse whitespace.
function clean(text: string): string {
  return text
    .replace(/[—–]/g, ", ") // em/en dash -> comma pause
    .replace(/\s+/g, " ")
    .trim();
}

// Take whole sentences from a body of text, never truncating mid-sentence, and
// keep each story to one or two sentences so the combined brief stays in the
// ~45-75s spoken window. We add sentences until adding another would exceed the
// soft character budget, but always keep at least the first one.
function firstSentences(text: string, max = 2, budget = 240): string {
  const cleaned = clean(text);
  const parts = cleaned.match(/[^.!?]+[.!?]+/g);
  if (!parts || parts.length === 0) {
    // No sentence punctuation: take whole words up to the budget, add a period.
    if (cleaned.length <= budget) return cleaned ? cleaned + "." : "";
    const slice = cleaned.slice(0, budget);
    const lastSpace = slice.lastIndexOf(" ");
    return slice.slice(0, lastSpace > 0 ? lastSpace : budget).trim() + ".";
  }
  let out = parts[0].trim();
  for (let i = 1; i < Math.min(max, parts.length); i++) {
    const next = (out + " " + parts[i].trim()).trim();
    if (next.length > budget) break;
    out = next;
  }
  return out;
}

// Trim a trailing period off the headline so it reads cleanly before "."
function headlineLead(title: string): string {
  return clean(title).replace(/[.!?]+$/, "");
}

// Build ONE combined ~45-75s Rachel script from the top 3 signals.
function buildScript(signals: SignalAnalysis[]): string {
  const top3 = signals.slice(0, 3);
  const intro =
    "Here is your Ad AI Pulse briefing for today. Three stories matter.";

  const ordinals = ["First", "Second", "Third"];
  const bodies = top3.map((s, i) => {
    const lead = headlineLead(s.title);
    const detailSource = s.masterBrief?.whyItMatters ?? s.summary ?? "";
    const detail = firstSentences(detailSource, 2);
    const opener = ordinals[i] ?? "Next";
    // "First, <headline>. <one or two sentences>."
    const sentence = detail
      ? `${opener}, ${lead}. ${detail}`
      : `${opener}, ${lead}.`;
    return clean(sentence);
  });

  const signoff =
    "That is your pulse for today. Stay sharp, and I will see you tomorrow.";

  return [intro, ...bodies, signoff].join(" ");
}

// ── Component ────────────────────────────────────────────────────────────────

export interface VoiceBriefProps {
  brief: DailyBrief;
}

export default function VoiceBrief({ brief }: VoiceBriefProps) {
  const script = useMemo(() => buildScript(brief.signals), [brief.signals]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [via, setVia] = useState<"server" | "browser" | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = () => {
    synthRef.current?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") synthRef.current = window.speechSynthesis;
    return () => stop();
    // run once on mount; cleanup stops any in-flight playback on unmount
  }, []);

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
          const url = URL.createObjectURL(
            new Blob([arr], { type: data.mime ?? "audio/wav" }),
          );
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
    <div className="rounded-lg border border-border bg-surface p-5 shadow-e1">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-lg font-semibold text-ink">
            R
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">
                Rachel, Editor-in-Chief
              </h3>
              <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-2xs font-medium text-ink-faint">
                Voice brief
              </span>
            </div>
            <p className="mt-1 max-w-md text-sm text-ink-muted">
              The day&rsquo;s top three stories, read aloud.
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
            aria-label={isPlaying ? "Stop voice brief" : "Play voice brief"}
            className={`flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${
              isPlaying
                ? "border border-border bg-surface-2 text-ink hover:bg-surface"
                : "bg-accent text-accent-ink hover:bg-accent-hover"
            }`}
          >
            {isLoading ? (
              <>
                <span className="working h-3.5 w-3.5 rounded-full" />
                <span>Synthesizing&hellip;</span>
              </>
            ) : isPlaying ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span>Play brief</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="thin-scroll mt-4 max-h-40 overflow-y-auto rounded-md border border-border bg-surface-2 p-3.5">
        <div className="mb-1.5 flex w-fit items-center gap-1.5 text-2xs text-ink-faint">
          <Mic className="h-3 w-3 text-ink-faint" aria-hidden="true" />
          <span>
            {via
              ? `AI-generated voice via ${via}, disclosed.`
              : "AI-generated voice, disclosed."}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-ink-muted">
          &ldquo;{script}&rdquo;
        </p>
      </div>
    </div>
  );
}
