// lib/types.ts — AAP canonical model + 6-agent pipeline additions.
//
// DESIGN RULE: the existing SignalAnalysis / PulseCard shapes are PRESERVED untouched
// so every existing component and every cached fixture in lib/data.ts keep working with
// zero edits. The 6-agent pipeline ENRICHES this model: all new fields are OPTIONAL on
// SignalAnalysis, so a bare 4-card fixture is still a valid SignalAnalysis. That is what
// makes the "always-4-cards fallback" free.

export type LensId = "strategist" | "executive" | "gtm" | "policy";

export interface Source {
  title: string;
  url: string;
  verifiedBy: "AAP Engine" | "None";
}

// One Pulse Card = one lens's decision about the signal. (UNCHANGED)
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
  producedBy: string; // "Ada, AI Research Analyst"
  reviewedBy: string; // "Rachel, Editor-in-Chief"
  sources: Source[];
  provenanceHash: string; // AAP Engine provenance stamp
}

// ───────────────────────────────────────────────────────────────────────────
// 6-AGENT PIPELINE — IDENTITY & STREAMING
// ───────────────────────────────────────────────────────────────────────────

// The six agents, in execution order.
export type AgentId =
  | "scout" // Agent 1 — Signal Scout (discovery; Antigravity browsing)
  | "verify" // Agent 2 — Source Verification (credibility -> Confidence)
  | "rank" // Agent 3 — Signal Ranking (6 axes -> Pulse Score)
  | "brief" // Agent 4 — Briefing (master brief)
  | "lens" // Agent 5 — Lens (master brief -> 4 role lenses)
  | "editorial"; // Agent 6 — Editorial (clarity/hype/hallucination + Now/Next/Later)

export const AGENT_ORDER: AgentId[] = ["scout", "verify", "rank", "brief", "lens", "editorial"];

export const AGENT_META: Record<AgentId, { n: number; name: string; role: string }> = {
  scout: { n: 1, name: "Signal Scout", role: "Discovers signals across sources" },
  verify: { n: 2, name: "Source Verification", role: "Credibility, primary, corroboration" },
  rank: { n: 3, name: "Signal Ranking", role: "Six axes into one Pulse Score" },
  brief: { n: 4, name: "Briefing", role: "Builds the master brief" },
  lens: { n: 5, name: "Lens", role: "Master brief into four lenses" },
  editorial: { n: 6, name: "Editorial", role: "Hype, hallucination, Now/Next/Later" },
};

export type PipelineStage =
  | AgentId
  | "source"
  | "filter"
  | "frame"
  | "review"
  | "publish"
  | "work";

export type AgentPhase = "start" | "working" | "done" | "skipped" | "error";

// ── Agent 2 — Source Verification ──
export interface Confidence {
  score: number; // 0-100 overall confidence
  primarySource: boolean;
  independentConfirmation: boolean;
  tier?: "credible" | "primary" | "corroborated" | "speculative";
  corroborationCount?: number;
  notes: string;
}

// ── Agent 3 — Signal Ranking (the AAP "Pulse Score") ──
export interface PulseScore {
  adtechImpact: number;
  aiImpact: number;
  novelty: number;
  urgency: number;
  audienceRelevance: number;
  confidence: number;
  composite: number; // 0-100 — final Pulse Score
}

// ── Agent 4 — Briefing (the master brief) ──
export interface MasterBrief {
  whatHappened: string;
  whyItMatters: string;
  keyImplications: string[];
  whatToWatch: string[];
}

// ── Agent 6 — Editorial ──
export interface EditorialFlags {
  clarity: number;
  hypeRisk: number;
  hallucinationRisk: number;
  duplicateOf?: string;
  approved: boolean;
  notes?: string;
}

export interface ActionHorizon {
  now: string[]; // 0-30 days
  next: string[]; // 30-90 days
  later: string[]; // 90+ days
}

// ── Full analysis: legacy fields (required) + pipeline enrichments (optional) ──
export interface SignalAnalysis {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  originalText: string;
  hypeCheckScore: number;
  hypeNotes: string;
  rachelEicComment: string;
  audioScript?: string;
  disclosure: Disclosure;
  cards: PulseCard[]; // 4, in LENS_ORDER — the fallback guarantee

  // ── 6-agent enrichments (all OPTIONAL: absence => render legacy view) ──
  confidence?: Confidence; // Agent 2
  pulseScore?: PulseScore; // Agent 3
  masterBrief?: MasterBrief; // Agent 4
  editorial?: EditorialFlags; // Agent 6
  actionHorizon?: ActionHorizon; // Agent 6
  scoutSourceCount?: number; // Agent 1 telemetry
}

// ── Daily brief: the top signals of the day (Signal Scout output) ──
export interface DailyBrief {
  date: string;
  headline: string;
  signals: SignalAnalysis[]; // top 3-5, ranked
}

// ── Project-aware Ada: the user's role + active project, sent with each question ──
export interface UserProfile {
  role: string;
  project: string;
}

// ── Nano Banana infographic for a signal ──
export interface Infographic {
  dataUrl: string; // data:image/png;base64,... or a placeholder flag
  alt: string;
}

// Engine backends behind one interface:
//  cached -> local fixtures (bulletproof)
//  fast   -> gemini-2.5-flash structured output
//  agent  -> Antigravity managed agent (live browsing)
export type EngineMode = "cached" | "fast" | "agent";

// Mini-output each agent emits so the live 6-agent tracker can show real work.
export interface AgentEvent {
  type: "agent";
  agent: AgentId;
  phase: AgentPhase;
  pct?: number;
  label: string;
  detail?:
    | { kind: "scout"; sourceCount: number; headline: string }
    | { kind: "verify"; confidence: Confidence }
    | { kind: "rank"; pulseScore: PulseScore }
    | { kind: "brief"; masterBrief: MasterBrief }
    | { kind: "lens"; lensCount: number }
    | { kind: "editorial"; editorial: EditorialFlags; actionHorizon: ActionHorizon };
}

// NDJSON events streamed from /api/pulse to the client console.
export type StatusEvent =
  | { type: "status"; stage: PipelineStage; label: string; pct?: number; lens?: LensId }
  | AgentEvent
  | { type: "result"; analysis: SignalAnalysis }
  | { type: "fallback"; reason: string; agent?: AgentId }
  | { type: "error"; message: string; agent?: AgentId }
  | { type: "done"; source: EngineMode; runId: string; ms: number };
