// The Pulse Card view model — the single shape the PulseCard renders from.
//
// Two adapters feed it, so the card is decoupled from where the data comes from:
//   • viewFromAnalysis()  — Ankit's canonical SignalAnalysis (lib/types.ts). THE REAL
//                           Lens Engine path: /api/pulse, runFastEngine, runAgentEngine,
//                           and CURATED_SIGNALS all emit this shape.
//   • viewFromSample()    — the external/mock contract in data/sample_signal.json, the
//                           shape a future backend might POST before it speaks SignalAnalysis.
//
// When the live engine is wired up, render `viewFromAnalysis(analysis)` — nothing in the
// card changes. This file is the only seam between engine data and presentation.

import type { LensId, SignalAnalysis, PulseCard as EnginePulseCard } from "./types";
import { LENS_BY_ID, LENS_ORDER, isLensId } from "./lenses";

export const DISCLOSURE_LINE = "Produced by Ada · Reviewed by Rachel · Sources available";

export interface Implication {
  label: string; // short chip text ("Workflow disruption")
  detail: string; // optional expansion, shown on hover
}

export interface LensView {
  lensId: LensId;
  label: string; // "Agency Strategist"
  decisionType: string; // "Client POV"
  scoreName: string; // "Campaign Urgency"
  pulseScore: number; // 0-100, independent per lens
  whyItMatters: string;
  ladder: { now: string; next: string; later: string };
  watchout: string;
  keyImplications: Implication[];
  color: string; // accent hex (from lens metadata)
}

export interface SignalView {
  title: string;
  source: string;
  date: string;
  summary: string;
  confidence: string; // "High" | "Medium" | "Emerging"
}

export interface PulseSignalView {
  id: string;
  signal: SignalView;
  lenses: LensView[]; // in LENS_ORDER, preloaded for instant switching
  lensById: Record<LensId, LensView>;
  disclosure: string;
  rachelComment?: string; // Rachel's EIC note (Ankit's model)
  audioScript?: string; // Ada/Rachel pre-baked audio script, when present
}

// ---------- shared helpers ----------

// "**QBR Narrative Shift**: Reassure clients…" -> { label: "QBR Narrative Shift", detail: "Reassure clients…" }
// "Workflow disruption" (short, no markup)      -> { label: "Workflow disruption", detail: "" }
export function parseImplication(raw: string): Implication {
  const s = raw.trim();
  const bold = /^\*\*(.+?)\*\*\s*[:：-]?\s*(.*)$/.exec(s);
  if (bold) return { label: bold[1].trim(), detail: bold[2].trim() };
  if (s.length <= 38 && !s.includes(".")) return { label: s, detail: "" };
  const colon = s.indexOf(":");
  if (colon > 0 && colon <= 42) return { label: s.slice(0, colon).trim(), detail: s.slice(colon + 1).trim() };
  return { label: "", detail: s };
}

// Ankit's hypeCheckScore is a grounding score (high = factually solid). Map it to a
// presentation-friendly confidence band for the signal header.
export function confidenceFromHype(score: number): string {
  if (score >= 85) return "High";
  if (score >= 65) return "Medium";
  return "Emerging";
}

function orderLenses(lensById: Record<LensId, LensView>): LensView[] {
  return LENS_ORDER.filter((id) => lensById[id]).map((id) => lensById[id]);
}

// ---------- adapter A: the real engine (SignalAnalysis) ----------

function lensViewFromCard(card: EnginePulseCard, analysis: SignalAnalysis): LensView {
  const meta = LENS_BY_ID[card.lens];
  const [now = "", next = "", later = ""] = card.actionSteps;
  return {
    lensId: card.lens,
    label: meta.role,
    decisionType: card.title,
    scoreName: card.scoreName,
    pulseScore: card.score,
    whyItMatters: card.brief,
    ladder: { now, next, later },
    // The engine carries one anti-hype assessment at the signal level (Ada's grounding
    // pass). Surface it as the lens watch-out — it is exactly "what to be careful about".
    watchout: analysis.hypeNotes,
    keyImplications: card.bullets.map(parseImplication),
    color: meta.color,
  };
}

export function viewFromAnalysis(analysis: SignalAnalysis): PulseSignalView {
  const lensById = {} as Record<LensId, LensView>;
  for (const card of analysis.cards) {
    if (isLensId(card.lens)) lensById[card.lens] = lensViewFromCard(card, analysis);
  }
  return {
    id: analysis.id,
    signal: {
      title: analysis.title,
      source: analysis.disclosure?.sources?.[0]?.title ?? analysis.category,
      date: analysis.date,
      summary: analysis.summary,
      confidence: confidenceFromHype(analysis.hypeCheckScore),
    },
    lenses: orderLenses(lensById),
    lensById,
    disclosure: DISCLOSURE_LINE,
    rachelComment: analysis.rachelEicComment,
    audioScript: analysis.audioScript,
  };
}

// ---------- adapter B: the external JSON contract (data/sample_signal.json) ----------

export interface SampleLensOutput {
  label: string;
  decisionType: string;
  pulseScore: number;
  whyItMatters: string;
  now: string;
  next: string;
  later: string;
  watchout: string;
  keyImplications: string[];
}

export interface SampleSignalInput {
  signal: { title: string; source: string; date: string; summary: string; confidence: string };
  selectedLens?: string;
  lensOutputs: Record<string, SampleLensOutput>;
  disclosure: string;
}

// Maps the external lens keys onto Ankit's canonical LensId.
const SAMPLE_KEY_TO_LENS: Record<string, LensId> = {
  agency_strategist: "strategist",
  executive_strategy: "executive",
  adtech_gtm: "gtm",
  responsible_ai_policy: "policy",
};

export function viewFromSample(input: SampleSignalInput): PulseSignalView {
  const lensById = {} as Record<LensId, LensView>;
  for (const [key, out] of Object.entries(input.lensOutputs)) {
    const id = SAMPLE_KEY_TO_LENS[key] ?? (isLensId(key) ? key : undefined);
    if (!id) continue;
    const meta = LENS_BY_ID[id];
    lensById[id] = {
      lensId: id,
      label: out.label || meta.role,
      decisionType: out.decisionType || meta.deliverable,
      scoreName: meta.scoreName,
      pulseScore: out.pulseScore,
      whyItMatters: out.whyItMatters,
      ladder: { now: out.now, next: out.next, later: out.later },
      watchout: out.watchout,
      keyImplications: (out.keyImplications ?? []).map(parseImplication),
      color: meta.color,
    };
  }
  const slug = input.signal.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24);
  return {
    id: `sample-${slug}`,
    signal: { ...input.signal },
    lenses: orderLenses(lensById),
    lensById,
    disclosure: input.disclosure || DISCLOSURE_LINE,
  };
}
