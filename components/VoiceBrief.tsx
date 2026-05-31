"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, Mic, Copy, Check } from "lucide-react";
import type { DailyBrief, SignalAnalysis } from "@/lib/types";
import type { DailyView } from "@/lib/dailyBrief";

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

// Build a spoken script from a DailyView (lens-aware).
function buildViewScript(view: DailyView): string {
  const intro = clean(
    `Here is your Ad AI Pulse briefing, read for the ${view.lensLabel}.`,
  );
  const through = clean(view.through);
  const moverLines = view.movers.map((m) => {
    const company = clean(m.company);
    const move = clean(m.move);
    const impact = clean(m.impact);
    return impact
      ? `${company}, ${move}. ${impact}.`
      : `${company}, ${move}.`;
  });
  const signoff =
    "That is your pulse for today. Stay sharp, and I will see you tomorrow.";
  return [intro, through, ...moverLines, signoff].join(" ");
}

// ── Component ────────────────────────────────────────────────────────────────

export interface VoiceBriefProps {
  brief: DailyBrief;
  view?: DailyView;
}

export default function VoiceBrief({ brief, view }: VoiceBriefProps) {
  // Derive the canonical script from either the view or the brief signals.
  const canonicalScript = useMemo(
    () => (view ? buildViewScript(view) : buildScript(brief.signals)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view, brief.signals],
  );

  // Editable script state — reset whenever the canonical source changes.
  const [editedScript, setEditedScript] = useState(canonicalScript);
  useEffect(() => {
    setEditedScript(canonicalScript);
  }, [canonicalScript]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [via, setVia] = useState<"server" | "browser" | null>(null);
  const [copied, setCopied] = useState(false);
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
    if (!synth || !editedScript) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(editedScript);
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
        body: JSON.stringify({ text: editedScript }),
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable in some sandboxed environments */
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-e1">
      {/* ── Header row: Rachel avatar + play controls ── */}
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
              {view && (
                <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-2xs font-medium text-ink-faint">
                  {view.lensLabel}
                </span>
              )}
            </div>
            <p className="mt-1 max-w-md text-sm text-ink-muted">
              {view
                ? `The day's top moves, read for the ${view.lensLabel}.`
                : "The day’s top three stories, read aloud."}
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

      {/* ── Main body: 2-col on lg (script | chapters), stacked on mobile ── */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Script panel — col-span-2 on lg */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="voice-brief-script"
              className="flex items-center gap-1.5 text-2xs text-ink-faint"
            >
              <Mic className="h-3 w-3 text-ink-faint" aria-hidden="true" />
              <span>
                {via
                  ? `AI-generated voice via ${via}, disclosed.`
                  : "AI-generated voice, disclosed."}
              </span>
            </label>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy script to clipboard"
              className="flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-2xs font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink"
            >
              {copied ? (
                <Check className="h-3 w-3 text-success" aria-hidden="true" />
              ) : (
                <Copy className="h-3 w-3" aria-hidden="true" />
              )}
              <span>{copied ? "Copied" : "Copy script"}</span>
            </button>
            {/* aria-live region announces the copy confirmation to screen readers */}
            <span
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            >
              {copied ? "Copied" : ""}
            </span>
          </div>

          <textarea
            id="voice-brief-script"
            value={editedScript}
            onChange={(e) => setEditedScript(e.target.value)}
            rows={6}
            spellCheck={false}
            className="thin-scroll w-full resize-y rounded-md border border-border bg-surface-2 p-3.5 text-sm italic leading-relaxed text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Editable voice brief script"
          />
        </div>

        {/* Chapters panel — inline on lg, collapsible on mobile */}
        {view && (
          <>
            {/* Desktop: always-visible aside */}
            <div className="hidden lg:flex lg:flex-col lg:gap-2">
              <p className="text-2xs font-medium text-ink-faint uppercase tracking-wide">
                In this briefing
              </p>
              <dl className="flex flex-col gap-3">
                {view.movers.map((m) => (
                  <div key={m.signalId}>
                    <dt className="text-xs font-semibold text-ink">
                      {m.company}{" "}
                      <span className="font-normal text-ink-muted">
                        &middot; {m.move}
                      </span>
                    </dt>
                    {m.impact && (
                      <dd className="mt-0.5 text-xs text-ink-muted leading-snug">
                        {m.impact}
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            </div>

            {/* Mobile: collapsible details */}
            <details className="lg:hidden rounded-md border border-border bg-surface-2">
              <summary className="cursor-pointer list-none px-3.5 py-2.5 text-xs font-medium text-ink-muted select-none [&::-webkit-details-marker]:hidden">
                In this briefing
                <span className="ml-1 text-ink-faint" aria-hidden="true">
                  &#x25BE;
                </span>
              </summary>
              <dl className="flex flex-col gap-3 px-3.5 pb-3.5 pt-2 border-t border-border">
                {view.movers.map((m) => (
                  <div key={m.signalId}>
                    <dt className="text-xs font-semibold text-ink">
                      {m.company}{" "}
                      <span className="font-normal text-ink-muted">
                        &middot; {m.move}
                      </span>
                    </dt>
                    {m.impact && (
                      <dd className="mt-0.5 text-xs text-ink-muted leading-snug">
                        {m.impact}
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            </details>
          </>
        )}

        {/* No-view fallback: full-width script read-only display (matches original layout) */}
        {!view && null}
      </div>
    </div>
  );
}
