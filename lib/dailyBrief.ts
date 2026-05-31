// The Daily Pulse — one day's intelligence, synthesized across the four lenses.
//
// Adopted from the feat/daily-pulse-ui branch. The NEW value here is the cross-signal
// SYNTHESIS: per lens, how the three moves interrelate (the through-line + the dynamics
// edges that make the day legible in 60 seconds). Drop-in compatible with main's types,
// lenses, and CURATED_SIGNALS (the signal ids match).

import type { LensId, SignalAnalysis, PulseCard } from "./types";
import { LENS_BY_ID, LENS_ORDER } from "./lenses";
import { CURATED_SIGNALS } from "./data";

export const DAILY_DATE = "Today";
export const DAILY_EDITION = "Morning Edition";
export const DAILY_DISCLOSURE = "Produced by Ada · Reviewed by Rachel · Sources available";

export interface DailyMoverMeta {
  signalId: string;
  company: string; // short display name / node label
  move: string; // the product/move name (the "ticker")
}

// Today's top-3 movers, in editorial priority order (Signal Scout replaces this live).
export const DAILY_MOVERS: DailyMoverMeta[] = [
  { signalId: "sig-overviews-ads", company: "Google", move: "AI Overviews Ads" },
  { signalId: "sig-eu-watermark", company: "EU AI Act", move: "Watermark Mandate" },
  { signalId: "sig-ttd-os", company: "The Trade Desk", move: "Kokai OS" },
];

// One directed relationship between two movers (drawn as an edge in the synthesis).
export interface DailyEdge {
  from: string; // company name (must match DAILY_MOVERS[].company)
  to: string;
  relation: string; // short label, e.g. "new ad surface triggers disclosure duty"
}

export interface LensSynthesis {
  headline: string; // the day's through-line for this lens
  dynamics: string; // 2-3 sentences: how the three moves interrelate
  edges: DailyEdge[]; // the interrelationship graph for this lens
}

// The cross-signal synthesis — distinct per lens (the moat: same three moves, four readings).
export const LENS_SYNTHESIS: Record<LensId, LensSynthesis> = {
  strategist: {
    headline:
      "Your media plan is being rewritten at three layers at once — where ads show, what you must disclose, and how bids clear.",
    dynamics:
      "Google opens answer-box inventory your Performance Max campaigns get auto-opted into. The EU mandate means the AI creative you scale to fill it now ships with provenance tags. And Kokai rewards more creative variants, not fewer. The brief moves from fixed assets to governed asset libraries.",
    edges: [
      { from: "Google", to: "EU AI Act", relation: "new ad surface triggers disclosure duty" },
      { from: "EU AI Act", to: "The Trade Desk", relation: "provenance becomes a delivery requirement" },
      { from: "Google", to: "The Trade Desk", relation: "fresh inventory to bid via Kokai" },
    ],
  },
  executive: {
    headline:
      "Budget, compliance, and infrastructure are all repricing in the same week — allocate capital accordingly.",
    dynamics:
      "Google pulls spend toward answer surfaces. The EU turns provenance into both a cost line and a moat. The Trade Desk consolidates programmatic into an edge-native stack. The squeeze lands on manual production; the premium accrues to governed automation.",
    edges: [
      { from: "Google", to: "The Trade Desk", relation: "spend shifts into edge-native delivery" },
      { from: "EU AI Act", to: "Google", relation: "compliance gates the new ad surface" },
      { from: "EU AI Act", to: "The Trade Desk", relation: "verified delivery becomes the default" },
    ],
  },
  gtm: {
    headline:
      "The winners cluster around governed automation — provenance, feeds, and edge bidding. The losers are the manual middle layers.",
    dynamics:
      "Google's new inventory is an opening for feed and measurement tools. The EU mandate spins up an entire provenance-verification category. The Trade Desk's edge layer compresses standalone DSP differentiation. Position around the seams between these three, not against any one of them.",
    edges: [
      { from: "Google", to: "The Trade Desk", relation: "inventory expansion feeds the edge stack" },
      { from: "EU AI Act", to: "Google", relation: "disclosure spec creates a verification market" },
      { from: "EU AI Act", to: "The Trade Desk", relation: "provenance APIs become integration surface" },
    ],
  },
  policy: {
    headline:
      "Surfaces expanded before the disclosure rules caught up — the gap between them is the risk.",
    dynamics:
      "Google blurs the line between organic answer and sponsored card, reviving native-ad disclosure questions. The EU's watermarking mandate is the control arriving to close that gap. The Trade Desk's edge bidding quietly reduces individual-ID tracking. Read today as expansion, control, and privacy moving at different speeds.",
    edges: [
      { from: "Google", to: "EU AI Act", relation: "ad-in-answer blur meets disclosure mandate" },
      { from: "EU AI Act", to: "The Trade Desk", relation: "provenance standard, edge-native enforcement" },
      { from: "Google", to: "The Trade Desk", relation: "more surfaces, fewer stored identifiers" },
    ],
  },
};

// ---------- view model ----------

export interface MoverView {
  signalId: string;
  company: string;
  move: string; // product/move name
  signalTitle: string; // full editorial headline (for the detailed view)
  decisionType: string; // lens card.title, e.g. "Client POV"
  pulseScore: number; // lens card.score
  impact: string; // one-line immediate impact for this lens
  now: string; // the NOW action for this lens (card.actionSteps[0])
  color: string; // lens accent
}

export interface DailyView {
  date: string;
  edition: string;
  lensId: LensId;
  lensLabel: string;
  color: string;
  through: string; // synthesis headline
  dynamics: string;
  edges: DailyEdge[];
  dayScore: number; // mean of the three movers' lens scores
  movers: MoverView[]; // 3, in priority order
  disclosure: string;
}

const SIGNAL_BY_ID: Record<string, SignalAnalysis> = CURATED_SIGNALS.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<string, SignalAnalysis>,
);

function cardFor(signal: SignalAnalysis, lensId: LensId): PulseCard | undefined {
  return signal.cards.find((c) => c.lens === lensId);
}

// First sentence of the brief, clamped to a node-sized one-liner.
function impactLine(brief: string, maxWords = 16): string {
  const first = (brief.match(/[^.!?]+[.!?]?/) ?? [brief])[0].trim();
  const words = first.split(/\s+/);
  const text = words.length <= maxWords ? first : words.slice(0, maxWords).join(" ") + "…";
  return text.replace(/[.,;:]+$/, "");
}

export function buildDailyView(lensId: LensId): DailyView {
  const meta = LENS_BY_ID[lensId];
  const synth = LENS_SYNTHESIS[lensId];

  const movers: MoverView[] = DAILY_MOVERS.map((m) => {
    const signal = SIGNAL_BY_ID[m.signalId];
    const card = signal ? cardFor(signal, lensId) : undefined;
    return {
      signalId: m.signalId,
      company: m.company,
      move: m.move,
      signalTitle: signal?.title ?? m.move,
      decisionType: card?.title ?? meta.deliverable,
      pulseScore: card?.score ?? 0,
      impact: card ? impactLine(card.brief) : "",
      now: card?.actionSteps?.[0] ?? "",
      color: meta.color,
    };
  });

  const dayScore = movers.length
    ? Math.round(movers.reduce((sum, m) => sum + m.pulseScore, 0) / movers.length)
    : 0;

  return {
    date: DAILY_DATE,
    edition: DAILY_EDITION,
    lensId,
    lensLabel: meta.role,
    color: meta.color,
    through: synth.headline,
    dynamics: synth.dynamics,
    edges: synth.edges,
    dayScore,
    movers,
    disclosure: DAILY_DISCLOSURE,
  };
}

// All four lens views, prebuilt for instant switching (no refetch).
export function buildAllDailyViews(): Record<LensId, DailyView> {
  return LENS_ORDER.reduce(
    (acc, id) => {
      acc[id] = buildDailyView(id);
      return acc;
    },
    {} as Record<LensId, DailyView>,
  );
}
