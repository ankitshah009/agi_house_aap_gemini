// Deliverable 5 — the Rachel Brief.
//
// generateRachelBrief() builds a 25–30 second voiceover script in Rachel's voice from
// the view model, using pure template logic so it works with ZERO backend. An optional
// Gemini pass (refineRachelBrief -> /api/rachel-brief) can tighten the phrasing; the local
// script is always the fallback.
//
// Audio reuses the repo's existing Gemini TTS route (/api/speech, gemini-2.5-flash-preview-tts)
// with the browser's Web Speech API as the only fallback. No third-party voice vendor.

import type { LensId } from "./types";
import type { SignalView, LensView, Implication, PulseSignalView } from "./pulseSignal";
import type { DailyView } from "./dailyBrief";

// ---------- house style ----------

// Words Rachel never says — swapped for plainspoken equivalents (belt-and-suspenders:
// the templates avoid them, this scrubs anything that arrives from engine data or Gemini).
function deHype(text: string): string {
  return text
    .replace(/\bgame[-\s]?changer(s)?\b/gi, "turning point")
    .replace(/\brevolutioni[sz](e|es|ed|ing)\b/gi, "reshape")
    .replace(/\brevolutionary\b/gi, "major")
    .replace(/\bdelv(e|es|ed|ing)\b/gi, "dig into")
    .replace(/\blandscapes?\b/gi, "market")
    .replace(/\s+/g, " ")
    .trim();
}

// How each lens is addressed in spoken voice.
const AUDIENCE: Record<LensId, string> = {
  strategist: "agency strategists",
  executive: "the executive team",
  gtm: "AdTech and go-to-market teams",
  policy: "policy and trust leads",
};

// ---------- small text utilities ----------

function sentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]*/g) ?? [text]).map((s) => s.trim()).filter(Boolean);
}

function firstSentence(text: string): string {
  return sentences(text)[0] ?? text.trim();
}

function stripPeriod(text: string): string {
  return text.trim().replace(/[.,;:]+$/, "");
}

// Trim to <= max words on a word boundary (keeps the brief inside its time budget).
function clampWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/);
  return words.length <= max ? text.trim() : words.slice(0, max).join(" ");
}

// Lowercase the leading word for mid-sentence joins, but leave acronyms/brands alone
// (AI, GMV, AdTech, Google, OpenAI all keep their casing).
function lowerLead(text: string): string {
  const t = text.trim();
  const first = t.split(/\s+/)[0] ?? "";
  if (/^[A-Z]{2,}/.test(first) || /^[A-Z][a-z]+[A-Z]/.test(first) || /^(Google|OpenAI|Meta|Gemini|TikTok|Amazon)\b/.test(first)) {
    return t;
  }
  return t.charAt(0).toLowerCase() + t.slice(1);
}

// Fallback "one concrete implication" line, built from the lens's key implications when
// the brief itself only had a single sentence to give.
function chipImplication(imps: Implication[]): string {
  const picks = imps.slice(0, 2).map((i) => stripPeriod(i.detail || i.label)).filter(Boolean);
  if (!picks.length) return "";
  if (picks.length === 1) return `The concrete read: ${lowerLead(picks[0])}.`;
  return `The concrete read: ${lowerLead(picks[0])}, and ${lowerLead(picks[1])}.`;
}

// ---------- the brief ----------

/**
 * generateRachelBrief(signal, lensOutput) — Deliverable 5.
 *
 * Returns a 25–30 second (~70–90 word) voiceover script in Rachel's voice.
 * Structure: Today's signal → why it matters for this lens → one concrete implication →
 * one concrete action → "Produced by Ada, reviewed by Rachel."
 */
export function generateRachelBrief(signal: SignalView, lens: LensView): string {
  const headline = stripPeriod(signal.title);
  const summary = stripPeriod(clampWords(firstSentence(signal.summary), 22));

  const why = sentences(lens.whyItMatters);
  const why1 = clampWords(why[0] ?? lens.whyItMatters, 26);
  const why2 = why[1] ? clampWords(why[1], 24) : "";

  const implication = why2 ? `${stripPeriod(why2)}.` : chipImplication(lens.keyImplications);
  const action = clampWords(stripPeriod(lens.ladder.now || lens.ladder.next), 20);
  const audience = AUDIENCE[lens.lensId] ?? lens.label.toLowerCase();

  const lines = [
    `Today's signal: ${headline} — ${lowerLead(summary)}.`,
    `For ${audience}, this matters because ${lowerLead(stripPeriod(why1))}.`,
    implication,
    `Your next move: ${lowerLead(action)}.`,
    "Produced by Ada, reviewed by Rachel.",
  ].filter(Boolean);

  return deHype(lines.join(" "));
}

// Convenience: build the brief straight from a view + lens id.
export function briefForView(view: PulseSignalView, lensId: LensId): string {
  const lens = view.lensById[lensId];
  return lens ? generateRachelBrief(view.signal, lens) : "";
}

// Rough spoken-duration estimate at an editorial pace (~155 wpm).
export function estimateSeconds(script: string): number {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((words / 155) * 60);
}

/**
 * generateDailyVoiceBrief(dailyView) — the ~45–60s spoken daily brief for one lens.
 *
 * Covers the through-line, the three movers, how they connect, and one concrete action,
 * all in Rachel's voice. Same house style as the single-signal brief.
 */
export function generateDailyVoiceBrief(view: DailyView): string {
  const audience = AUDIENCE[view.lensId] ?? view.lensLabel.toLowerCase();
  const through = stripPeriod(clampWords(view.through, 28));

  const moves = view.movers
    .map((m, i) => {
      const ordinal = ["First", "Second", "Third", "Fourth", "Fifth"][i] ?? `Next`;
      return `${ordinal}, ${m.company}: ${lowerLead(stripPeriod(clampWords(m.impact, 18)))}.`;
    })
    .join(" ");

  const connect = stripPeriod(clampWords(firstSentence(view.dynamics), 26));

  const top = [...view.movers].sort((a, b) => b.pulseScore - a.pulseScore)[0];
  const action = top?.now ? clampWords(stripPeriod(top.now), 18) : "start with today's highest-urgency move";

  const lines = [
    `Good morning. This is your Ad AI Pulse daily brief for ${view.date}, for ${audience}.`,
    `Today's through-line: ${lowerLead(through)}.`,
    `Three moves to know. ${moves}`,
    `How they connect: ${lowerLead(connect)}.`,
    `Your move: ${lowerLead(action)}.`,
    "Produced by Ada, reviewed by Rachel.",
  ];

  return deHype(lines.join(" "));
}

// ---------- optional Gemini refinement (local script is always the fallback) ----------

export async function refineRachelBrief(draft: string): Promise<{ script: string; refined: boolean }> {
  try {
    const res = await fetch("/api/rachel-brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft }),
    });
    if (res.ok) {
      const data = (await res.json()) as { script?: string; refined?: boolean };
      if (data.script && data.script.trim()) {
        return { script: deHype(data.script), refined: Boolean(data.refined) };
      }
    }
  } catch {
    /* fall through to the local draft */
  }
  return { script: draft, refined: false };
}

// ---------- audio (Gemini TTS via /api/speech, Web Speech fallback) ----------

export interface BriefAudio {
  via: "server" | "browser";
  play: () => Promise<void>;
  stop: () => void;
}

/**
 * generateRachelBriefAudio(script) — best-effort spoken Rachel Brief.
 *
 * 1) Tries the server Gemini TTS route (/api/speech). 2) Falls back to the browser's
 * Web Speech API. Returns null only if neither path exists. `onEnded` fires when playback
 * finishes so the UI can reset. No ElevenLabs / third-party vendor.
 */
export async function generateRachelBriefAudio(
  script: string,
  onEnded?: () => void,
): Promise<BriefAudio | null> {
  // 1) Server-side Gemini TTS — returns base64 WAV.
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
        audio.onended = () => onEnded?.();
        return {
          via: "server",
          play: () => audio.play(),
          stop: () => {
            audio.pause();
            URL.revokeObjectURL(url);
          },
        };
      }
    }
  } catch {
    /* fall through to the browser */
  }

  // 2) Browser Web Speech fallback.
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    return {
      via: "browser",
      play: async () => {
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance(script);
        const pick = synth
          .getVoices()
          .find((v) => /Google US English|Samantha|Female/i.test(v.name) || v.lang.startsWith("en-US"));
        if (pick) u.voice = pick;
        u.rate = 1.0;
        u.pitch = 1.05;
        u.onend = () => onEnded?.();
        u.onerror = () => onEnded?.();
        synth.speak(u);
      },
      stop: () => window.speechSynthesis.cancel(),
    };
  }

  return null;
}
