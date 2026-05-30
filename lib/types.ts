// Canonical AAP data model — matches the deck + the reference build so the app,
// the pitch deck, and the demo all tell one story.

export type LensId = "strategist" | "executive" | "gtm" | "policy";

export interface Source {
  title: string;
  url: string;
  verifiedBy: "AAP Engine" | "None";
}

// One Pulse Card = one lens's decision about the signal.
export interface PulseCard {
  lens: LensId;
  title: string; // deliverable name, e.g. "Client POV"
  scoreName: string; // per-lens metric, e.g. "Campaign Urgency"
  score: number; // 0-100
  voiceDescription: string; // the lens's voice line
  brief: string; // the definitive outlook for this audience
  bullets: string[]; // key angles (may contain **markdown bold**)
  actionSteps: string[]; // 3 shippable steps (NOW / NEXT / LATER)
}

export interface Disclosure {
  producedBy: string; // "Ada — AI Research Analyst"
  reviewedBy: string; // "Rachel — Editor-in-Chief"
  sources: Source[];
  provenanceHash: string; // AAP Engine provenance stamp
}

// The full Lens Engine analysis of one signal.
export interface SignalAnalysis {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  originalText: string;
  hypeCheckScore: number; // 0-100 grounding/anti-hype score (Ada)
  hypeNotes: string; // Ada's anti-hype assessment
  rachelEicComment: string; // Rachel's Editor-in-Chief note
  audioScript?: string; // Rachel-voice briefing script
  disclosure: Disclosure;
  cards: PulseCard[]; // 4, in LENS_ORDER
}

// Engine backends behind one interface (presenter picks on stage):
//  cached -> local fixtures (bulletproof)
//  fast   -> gemini-3.5-flash structured output (what the team proved)
//  agent  -> Antigravity managed agent (live browsing, real sources)
export type EngineMode = "cached" | "fast" | "agent";

// NDJSON events streamed from /api/pulse to the client console.
export type StatusEvent =
  | { type: "status"; stage: string; label: string; pct?: number; lens?: LensId }
  | { type: "result"; analysis: SignalAnalysis }
  | { type: "fallback"; reason: string }
  | { type: "error"; message: string }
  | { type: "done"; source: EngineMode; runId: string; ms: number };
