import type { LensId, SignalAnalysis, PulseCard as EnginePulseCard } from "./types";
import { LENS_BY_ID, LENS_ORDER, isLensId } from "./lenses";

export const DISCLOSURE_LINE = "Produced by Ada · Reviewed by Rachel · Sources available";

export interface Implication {
  label: string;
  detail: string;
}

export interface LensView {
  lensId: LensId;
  label: string;
  decisionType: string;
  scoreName: string;
  pulseScore: number;
  whyItMatters: string;
  ladder: { now: string; next: string; later: string };
  watchout: string;
  keyImplications: Implication[];
  color: string;
}

export interface SignalView {
  title: string;
  source: string;
  date: string;
  summary: string;
  confidence: string;
}

export interface PulseSignalView {
  id: string;
  signal: SignalView;
  lenses: LensView[];
  lensById: Record<LensId, LensView>;
  disclosure: string;
  rachelComment?: string;
  audioScript?: string;
}

export function parseImplication(raw: string): Implication {
  const s = raw.trim();
  const bold = /^\*\*(.+?)\*\*\s*[:：-]?\s*(.*)$/.exec(s);
  if (bold) return { label: bold[1].trim(), detail: bold[2].trim() };
  if (s.length <= 38 && !s.includes(".")) return { label: s, detail: "" };
  const colon = s.indexOf(":");
  if (colon > 0 && colon <= 42) return { label: s.slice(0, colon).trim(), detail: s.slice(colon + 1).trim() };
  return { label: "", detail: s };
}

export function confidenceFromHype(score: number): string {
  if (score >= 85) return "High";
  if (score >= 65) return "Medium";
  return "Emerging";
}

function orderLenses(lensById: Record<LensId, LensView>): LensView[] {
  return LENS_ORDER.filter((id) => lensById[id]).map((id) => lensById[id]);
}

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
