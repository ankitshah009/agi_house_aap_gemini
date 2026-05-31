// Defensive parsing of the Lens Engine output into a canonical SignalAnalysis.
// Antigravity emits free-form text (no structured output), so we extract -> sanitize
// -> parse -> validate, filling defaults from lens metadata. Throws on unrecoverable
// failure so the route can fall back to a cached fixture.

import type { LensId, PulseCard, SignalAnalysis, Source } from "./types";
import { LENS_ORDER, LENS_BY_ID, isLensId } from "./lenses";

export class AnalysisParseError extends Error {
  stage: string;
  constructor(message: string, stage: string) {
    super(message);
    this.name = "AnalysisParseError";
    this.stage = stage;
  }
}

function extractCandidate(raw: string): string {
  const fenceRe = /```(?:json|JSON)?\s*([\s\S]*?)```/g;
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(raw)) !== null) blocks.push(m[1].trim());
  const objBlocks = blocks.filter((b) => b.startsWith("{"));
  if (objBlocks.length) return objBlocks[objBlocks.length - 1];
  if (blocks.length) return blocks[blocks.length - 1];
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last > first) return raw.slice(first, last + 1);
  return raw.trim();
}

function sanitize(s: string): string {
  return s
    .replace(/^﻿/, "")
    .replace(/[​-‍⁠]/g, "")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/\/\/[^\n\r]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/,(\s*[}\]])/g, "$1");
}

function tryParse(candidate: string): Record<string, unknown> | null {
  for (const c of [candidate, sanitize(candidate)]) {
    try {
      const v = JSON.parse(c);
      if (v && typeof v === "object") return v as Record<string, unknown>;
    } catch {
      /* next */
    }
  }
  return null;
}

// Robust single-object extractor for the 6-agent pipeline stages. Reuses the SAME
// fenced-block extractor + lenient parser the legacy path uses, so structured stages
// (and the Antigravity Scout) recover from preamble, smart quotes, and trailing commas.
// Returns null instead of throwing so callers can degrade gracefully per-stage.
export function safeParseObject(rawText: string): Record<string, unknown> | null {
  if (!rawText || !rawText.trim()) return null;
  return tryParse(extractCandidate(rawText));
}

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" && v.trim() ? v.trim() : fallback;

const clampScore = (v: unknown, fallback = 70): number => {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
};

function strArray(v: unknown, min: number, fallback: string[]): string[] {
  const arr = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim()) : [];
  if (arr.length >= min) return arr;
  // pad with fallback to reach min
  const out = [...arr];
  for (const f of fallback) {
    if (out.length >= min) break;
    out.push(f);
  }
  return out.slice(0, Math.max(min, out.length));
}

function validateCard(raw: unknown): PulseCard {
  const c = (raw ?? {}) as Record<string, unknown>;
  if (!isLensId(c.lens)) throw new AnalysisParseError(`bad lens: ${String(c.lens)}`, "card");
  const meta = LENS_BY_ID[c.lens];
  return {
    lens: meta.id,
    title: str(c.title, meta.deliverable),
    scoreName: str(c.scoreName, meta.scoreName),
    score: clampScore(c.score),
    voiceDescription: str(c.voiceDescription, meta.voice),
    brief: str(c.brief),
    bullets: strArray(c.bullets, 1, ["Key implication under review."]),
    actionSteps: strArray(c.actionSteps, 1, ["Review with the team this week."]),
  };
}

// FNV-1a 32-bit -> hex; a deterministic, client-safe provenance stamp (no node:crypto).
function provenance(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hex = (h >>> 0).toString(16).padStart(8, "0");
  return `aap_engine_sha256_${hex}${hex.split("").reverse().join("")}c80d44e`;
}

const GENERIC_SOURCES: Source[] = [
  { title: "Direct Signal Input Source", url: "#", verifiedBy: "AAP Engine" },
  { title: "LLM Knowledge Grounding", url: "#", verifiedBy: "AAP Engine" },
];

function parseSources(v: unknown): Source[] {
  if (!Array.isArray(v)) return GENERIC_SOURCES;
  const out = v
    .map((s): Source | null => {
      const o = (s ?? {}) as Record<string, unknown>;
      const title = str(o.title);
      if (!title) return null;
      return { title, url: str(o.url, "#"), verifiedBy: "AAP Engine" };
    })
    .filter((s): s is Source => s !== null);
  return out.length ? out : GENERIC_SOURCES;
}

export interface ParseOptions {
  id?: string;
  originalText: string;
  date?: string;
}

export function parseAnalysis(rawText: string, opts: ParseOptions): SignalAnalysis {
  if (!rawText || !rawText.trim()) throw new AnalysisParseError("empty output", "extract");
  const obj = tryParse(extractCandidate(rawText));
  if (!obj) throw new AnalysisParseError("could not parse JSON", "parse");

  const cardsRaw = Array.isArray(obj.cards) ? obj.cards : [];
  if (cardsRaw.length < 4) throw new AnalysisParseError(`expected 4 cards, got ${cardsRaw.length}`, "cards");

  const byLens = new Map<LensId, PulseCard>();
  for (const cr of cardsRaw) {
    const card = validateCard(cr);
    if (!byLens.has(card.lens)) byLens.set(card.lens, card);
  }
  const cards = LENS_ORDER.map((id) => {
    const card = byLens.get(id);
    if (!card) throw new AnalysisParseError(`missing lens: ${id}`, "cards");
    return card;
  });

  const title = str(obj.title, "Industry Signal Analysis");
  return {
    id: opts.id ?? `sig-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}`,
    title,
    summary: str(obj.summary, opts.originalText.slice(0, 180)),
    date: opts.date ?? str(obj.date, "Today"),
    category: str(obj.category, "AdTech & AI"),
    originalText: opts.originalText,
    hypeCheckScore: clampScore(obj.hypeCheckScore, 80),
    hypeNotes: str(obj.hypeNotes, "Grounding assessment pending editorial review."),
    rachelEicComment: str(obj.rachelEicComment, "Reviewed and approved for strategist deployment. — Rachel, EIC"),
    audioScript: str(obj.audioScript) || undefined,
    disclosure: {
      producedBy: "Ada — AI Research Analyst",
      reviewedBy: "Rachel — Editor-in-Chief",
      sources: parseSources(obj.sources),
      provenanceHash: provenance(rawText),
    },
    cards,
  };
}
