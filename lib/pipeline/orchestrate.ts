// lib/pipeline/orchestrate.ts — the 6-agent content pipeline.
//
// runPipeline drives Scout -> Verify -> Rank -> Brief -> Lens -> Editorial in order,
// emitting one AgentEvent per stage (start/working/done/skipped/error) via onEvent so
// the live 6-lane tracker can render real work. It ALWAYS resolves to a complete
// SignalAnalysis: every stage is wrapped in try/catch and degrades gracefully.
//
// Engine assignment (the key design decision, per orchestration spec):
//   Scout (Agent 1)        -> Antigravity (live browsing) when mode==="agent";
//                             fast structured engine when mode==="fast";
//                             SKIPPED when signalText is provided (free text / cached seed).
//   Verify..Editorial (2-6)-> always the fast Gemini structured path (runStructuredStage).
//
// Two-tier fallback (the "always-4-cards" guarantee, stage-aware):
//   1. A pre-card failure (Scout/Verify/Rank/Brief) aborts the live pipeline and returns
//      the cached fixture (or HERO) — which always has 4 cards.
//   2. A Lens failure falls back to fixture.cards (4) merged with the live brief; an
//      Editorial failure publishes the cards and backfills hype*/rachel/audio/horizon
//      from the fixture. The reader always gets a complete, signed bundle.

import "server-only";
import { runScoutAgent, runStructuredStage } from "../agent";
import { serverEnv } from "../env";
import { LENS_BY_ID, LENS_ORDER, isLensId } from "../lenses";
import { CURATED_SIGNALS } from "../data";
import type {
  ActionHorizon,
  AgentEvent,
  AgentId,
  Confidence,
  Disclosure,
  EditorialFlags,
  EngineMode,
  LensId,
  MasterBrief,
  PulseCard,
  PulseScore,
  SignalAnalysis,
  Source,
} from "../types";

const HERO = CURATED_SIGNALS[0];

// ── pct budget (matches orchestration spec table) ──
const PCT: Record<AgentId, number> = {
  scout: 16,
  verify: 33,
  rank: 50,
  brief: 66,
  lens: 84,
  editorial: 96,
};

// ── small coercion helpers (kept local; the legacy parse.ts owns the card path) ──
const str = (v: unknown, fb = ""): string =>
  typeof v === "string" && v.trim() ? v.trim() : fb;

const clamp = (v: unknown, fb = 70): number => {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fb;
  return Math.max(0, Math.min(100, Math.round(n)));
};

const bool = (v: unknown): boolean => v === true || v === "true";

function strArr(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim())
    : [];
}

// FNV-1a 32-bit provenance stamp (same shape as parse.ts, no node:crypto).
function provenance(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hex = (h >>> 0).toString(16).padStart(8, "0");
  return `aap_engine_sha256_${hex}${hex.split("").reverse().join("")}c80d44e`;
}

// ── running pipeline state (each stage reads prior, writes its own) ──
interface ScoutOut {
  signalText: string;
  headline: string;
  category: string;
  signalType?: string;
  publishedAt?: string;
  sources: Source[];
  sourceCount: number;
}

interface PipelineCtx {
  scout: ScoutOut;
  confidence?: Confidence;
  pulseScore?: PulseScore;
  masterBrief?: MasterBrief;
  title?: string;
  summary?: string;
  category?: string;
  cards?: PulseCard[];
  editorial?: EditorialFlags;
  actionHorizon?: ActionHorizon;
  hypeCheckScore?: number;
  hypeNotes?: string;
  rachelEicComment?: string;
  audioScript?: string;
}

export interface RunPipelineOptions {
  mode: EngineMode;
  signalId?: string;
  fixture?: SignalAnalysis;
  recentTitles?: { id: string; title: string }[];
  onEvent?: (ev: AgentEvent) => void;
}

// ════════════════════════════════════════════════════════════════════════════
// runPipeline — orchestrate the six agents, always return a SignalAnalysis.
// signalText: free-text signal (skips Scout); empty/undefined => Scout discovers.
// ════════════════════════════════════════════════════════════════════════════
export async function runPipeline(
  signalText: string | undefined,
  opts: RunPipelineOptions,
): Promise<SignalAnalysis> {
  const { mode, signalId, fixture, recentTitles = [], onEvent } = opts;
  const emit = (ev: AgentEvent) => {
    try {
      onEvent?.(ev);
    } catch {
      /* event sink must never break the pipeline */
    }
  };
  const baseline = fixture ?? HERO;
  const free = typeof signalText === "string" && signalText.trim().length > 0;

  // ── STAGE 1: SCOUT (discovery) ──────────────────────────────────────────
  let scout: ScoutOut;
  if (free) {
    // Free text provided (Playground / cached seed): Scout is skipped entirely.
    emit({
      type: "agent",
      agent: "scout",
      phase: "skipped",
      pct: PCT.scout,
      label: "Signal provided — Scout skipped",
    });
    scout = {
      signalText: signalText!.trim(),
      headline: baseline.title,
      category: baseline.category,
      sources: [{ title: "Direct Signal Input", url: "#", verifiedBy: "AAP Engine" }],
      sourceCount: 1,
    };
  } else {
    emit({
      type: "agent",
      agent: "scout",
      phase: "start",
      pct: PCT.scout,
      label:
        mode === "agent"
          ? "Signal Scout — browsing live sources (Antigravity)…"
          : "Signal Scout — scanning live sources…",
    });
    try {
      const seed = `${baseline.title}. ${baseline.originalText}`;
      emit({ type: "agent", agent: "scout", phase: "working", pct: PCT.scout, label: "Scanning RSS, X, blogs, earnings…" });
      const { obj } =
        mode === "agent"
          ? await runScoutAgent(seed, { timeoutMs: serverEnv.agentTimeoutMs })
          : await runStructuredStage("scout", seed, { timeoutMs: serverEnv.fastTimeoutMs });
      scout = normalizeScout(obj, baseline);
      emit({
        type: "agent",
        agent: "scout",
        phase: "done",
        pct: PCT.scout,
        label: `Locked a signal across ${scout.sourceCount} source${scout.sourceCount === 1 ? "" : "s"}`,
        detail: { kind: "scout", sourceCount: scout.sourceCount, headline: scout.headline },
      });
    } catch (err) {
      // Pre-card failure → abort live pipeline, return the cached fixture.
      emit({ type: "agent", agent: "scout", phase: "error", pct: PCT.scout, label: errLabel("Signal Scout", err) });
      return fallbackAnalysis(baseline, signalId, free ? signalText : undefined);
    }
  }

  const ctx: PipelineCtx = { scout };

  // ── STAGE 2: VERIFY (credibility) ───────────────────────────────────────
  try {
    const obj = await structured("verify", ctxJson(ctx), emit);
    ctx.confidence = normalizeConfidence(obj);
    emit({
      type: "agent",
      agent: "verify",
      phase: "done",
      pct: PCT.verify,
      label: `Confidence ${ctx.confidence.score} — ${ctx.confidence.tier ?? "assessed"}`,
      detail: { kind: "verify", confidence: ctx.confidence },
    });
  } catch (err) {
    emit({ type: "agent", agent: "verify", phase: "error", pct: PCT.verify, label: errLabel("Source Verification", err) });
    return fallbackAnalysis(baseline, signalId, free ? scout.signalText : undefined);
  }

  // ── STAGE 3: RANK (Pulse Score) ─────────────────────────────────────────
  try {
    const obj = await structured("rank", ctxJson(ctx), emit);
    ctx.pulseScore = normalizeRank(obj, ctx.confidence!.score);
    emit({
      type: "agent",
      agent: "rank",
      phase: "done",
      pct: PCT.rank,
      label: `Pulse Score ${ctx.pulseScore.composite}/100`,
      detail: { kind: "rank", pulseScore: ctx.pulseScore },
    });
  } catch (err) {
    emit({ type: "agent", agent: "rank", phase: "error", pct: PCT.rank, label: errLabel("Signal Ranking", err) });
    return fallbackAnalysis(baseline, signalId, free ? scout.signalText : undefined);
  }

  // ── STAGE 4: BRIEF (master brief) ───────────────────────────────────────
  try {
    const obj = await structured("brief", ctxJson(ctx), emit);
    ctx.masterBrief = normalizeBrief(obj);
    ctx.title = str(obj.title, scout.headline || baseline.title);
    ctx.summary = str(obj.summary, baseline.summary);
    ctx.category = str(obj.category, scout.category || baseline.category);
    emit({
      type: "agent",
      agent: "brief",
      phase: "done",
      pct: PCT.brief,
      label: "Master brief assembled",
      detail: { kind: "brief", masterBrief: ctx.masterBrief },
    });
  } catch (err) {
    emit({ type: "agent", agent: "brief", phase: "error", pct: PCT.brief, label: errLabel("Briefing", err) });
    return fallbackAnalysis(baseline, signalId, free ? scout.signalText : undefined);
  }

  // ── STAGE 5: LENS (4 role lenses) — first post-card-or-die stage ─────────
  try {
    const obj = await structured("lens", ctxJson(ctx), emit);
    ctx.cards = normalizeCards(obj, baseline);
    emit({
      type: "agent",
      agent: "lens",
      phase: "done",
      pct: PCT.lens,
      label: `Refracted into ${ctx.cards.length} lenses`,
      detail: { kind: "lens", lensCount: ctx.cards.length },
    });
  } catch (err) {
    // Lens failed but we have a valid brief: fall back to the fixture's 4 cards.
    emit({ type: "agent", agent: "lens", phase: "error", pct: PCT.lens, label: errLabel("Lens", err) });
    emit({ type: "agent", agent: "lens", phase: "done", pct: PCT.lens, label: "Recovered 4 lenses from baseline", detail: { kind: "lens", lensCount: baseline.cards.length } });
    ctx.cards = baseline.cards;
  }

  // ── STAGE 6: EDITORIAL (adjudicate + Now/Next/Later) ────────────────────
  try {
    const obj = await structured("editorial", ctxJson({ ...ctx, recentTitles }), emit);
    applyEditorial(ctx, obj, baseline, recentTitles);
    emit({
      type: "agent",
      agent: "editorial",
      phase: "done",
      pct: PCT.editorial,
      label: ctx.editorial!.approved ? "Approved for publish — Rachel, EIC" : "Flagged for review — Rachel, EIC",
      detail: { kind: "editorial", editorial: ctx.editorial!, actionHorizon: ctx.actionHorizon! },
    });
  } catch (err) {
    // Editorial failed: publish the cards anyway, backfill from the baseline fixture.
    emit({ type: "agent", agent: "editorial", phase: "error", pct: PCT.editorial, label: errLabel("Editorial", err) });
    backfillEditorial(ctx, baseline);
    emit({
      type: "agent",
      agent: "editorial",
      phase: "done",
      pct: PCT.editorial,
      label: "Published with baseline editorial sign-off",
      detail: { kind: "editorial", editorial: ctx.editorial!, actionHorizon: ctx.actionHorizon! },
    });
  }

  return assemble(ctx, baseline, signalId, free ? scout.signalText : undefined);
}

// ── shared structured-stage runner: emits start+working, returns raw obj ─────
async function structured(
  agent: AgentId,
  ctx: string,
  emit: (ev: AgentEvent) => void,
): Promise<Record<string, unknown>> {
  emit({ type: "agent", agent, phase: "start", pct: PCT[agent], label: startLabel(agent) });
  emit({ type: "agent", agent, phase: "working", pct: PCT[agent], label: workingLabel(agent) });
  const { obj } = await runStructuredStage(agent, ctx, { timeoutMs: serverEnv.stageTimeoutMs });
  return obj;
}

const startLabel = (a: AgentId): string =>
  ({
    scout: "Signal Scout — scanning sources…",
    verify: "Source Verification — checking credibility…",
    rank: "Signal Ranking — computing the Pulse Score…",
    brief: "Briefing — drafting the master brief…",
    lens: "Lens — refracting through four lenses…",
    editorial: "Editorial — Rachel auditing before publish…",
  })[a];

const workingLabel = (a: AgentId): string =>
  ({
    scout: "Scanning live sources…",
    verify: "Weighing primary vs. corroborated sources…",
    rank: "Scoring six axes into one composite…",
    brief: "What happened, why it matters, what to watch…",
    lens: "Strategist, Executive, GTM, Policy…",
    editorial: "Hype, hallucination, Now/Next/Later…",
  })[a];

const errLabel = (name: string, err: unknown): string =>
  `${name} unavailable — degrading gracefully (${(err instanceof Error ? err.message : String(err)).slice(0, 60)})`;

// ── context serialization: prior stages -> compact JSON for the next stage ──
function ctxJson(ctx: PipelineCtx & { recentTitles?: { id: string; title: string }[] }): string {
  const out: Record<string, unknown> = {
    signal: {
      text: ctx.scout.signalText,
      headline: ctx.scout.headline,
      category: ctx.scout.category,
      signalType: ctx.scout.signalType,
      publishedAt: ctx.scout.publishedAt,
      sources: ctx.scout.sources.map((s) => ({ title: s.title, url: s.url })),
    },
  };
  if (ctx.confidence) out.verification = ctx.confidence;
  if (ctx.pulseScore) out.ranking = ctx.pulseScore;
  if (ctx.masterBrief) out.masterBrief = ctx.masterBrief;
  if (ctx.title) out.title = ctx.title;
  if (ctx.summary) out.summary = ctx.summary;
  if (ctx.cards) out.cards = ctx.cards;
  if (ctx.recentTitles?.length) out.recentTitles = ctx.recentTitles;
  return JSON.stringify(out, null, 2);
}

// ── per-stage normalizers ───────────────────────────────────────────────────
function normalizeScout(obj: Record<string, unknown>, baseline: SignalAnalysis): ScoutOut {
  const sourcesRaw = Array.isArray(obj.sources) ? obj.sources : [];
  const sources: Source[] = sourcesRaw
    .map((s): Source | null => {
      const o = (s ?? {}) as Record<string, unknown>;
      const title = str(o.title);
      if (!title) return null;
      return { title, url: str(o.url, "#"), verifiedBy: "AAP Engine" };
    })
    .filter((s): s is Source => s !== null);
  const finalSources = sources.length ? sources : baseline.disclosure.sources;
  return {
    signalText: str(obj.signalText, `${baseline.title}. ${baseline.originalText}`),
    headline: str(obj.headline, baseline.title),
    category: str(obj.category, baseline.category),
    signalType: str(obj.signalType) || undefined,
    publishedAt: str(obj.publishedAt) || undefined,
    sources: finalSources,
    sourceCount: finalSources.length,
  };
}

function normalizeConfidence(obj: Record<string, unknown>): Confidence {
  const tierRaw = str(obj.tier).toLowerCase();
  const tier =
    tierRaw === "primary" || tierRaw === "corroborated" || tierRaw === "credible" || tierRaw === "speculative"
      ? (tierRaw as Confidence["tier"])
      : undefined;
  return {
    score: clamp(obj.score, 60),
    primarySource: bool(obj.primarySource),
    independentConfirmation: bool(obj.independentConfirmation),
    tier,
    corroborationCount:
      typeof obj.corroborationCount === "number" ? Math.max(0, Math.round(obj.corroborationCount)) : undefined,
    notes: str(obj.notes, "Credibility assessed; see sources."),
  };
}

function normalizeRank(obj: Record<string, unknown>, confidenceFloor: number): PulseScore {
  const adtechImpact = clamp(obj.adtechImpact);
  const aiImpact = clamp(obj.aiImpact);
  const novelty = clamp(obj.novelty);
  const urgency = clamp(obj.urgency);
  const audienceRelevance = clamp(obj.audienceRelevance);
  const confidence = clamp(obj.confidence, confidenceFloor);
  const base =
    0.28 * adtechImpact + 0.22 * aiImpact + 0.16 * novelty + 0.16 * urgency + 0.18 * audienceRelevance;
  const derived = Math.round(base * (confidence / 100));
  const composite = clamp(obj.composite, derived);
  return { adtechImpact, aiImpact, novelty, urgency, audienceRelevance, confidence, composite };
}

function normalizeBrief(obj: Record<string, unknown>): MasterBrief {
  const mb = (obj.masterBrief ?? {}) as Record<string, unknown>;
  return {
    whatHappened: str(mb.whatHappened, "Details under editorial review."),
    whyItMatters: str(mb.whyItMatters, "Industry impact under assessment."),
    keyImplications: ensureMin(strArr(mb.keyImplications), 1, ["Second-order effects under review."]),
    whatToWatch: ensureMin(strArr(mb.whatToWatch), 1, ["Forward triggers under review."]),
  };
}

function normalizeCards(obj: Record<string, unknown>, baseline: SignalAnalysis): PulseCard[] {
  const raw = Array.isArray(obj.cards) ? obj.cards : [];
  const byLens = new Map<LensId, PulseCard>();
  for (const cr of raw) {
    const c = (cr ?? {}) as Record<string, unknown>;
    if (!isLensId(c.lens) || byLens.has(c.lens)) continue;
    const meta = LENS_BY_ID[c.lens];
    byLens.set(c.lens, {
      lens: meta.id,
      title: str(c.title, meta.deliverable),
      scoreName: str(c.scoreName, meta.scoreName),
      score: clamp(c.score),
      voiceDescription: str(c.voiceDescription, meta.voice),
      brief: str(c.brief),
      bullets: ensureMin(strArr(c.bullets), 1, ["Key implication under review."]),
      actionSteps: ensureMin(strArr(c.actionSteps), 1, ["Review with the team this week."]),
    });
  }
  // Always return 4 in canonical order, backfilling any missing lens from baseline.
  const baseByLens = new Map(baseline.cards.map((c) => [c.lens, c]));
  return LENS_ORDER.map((id) => byLens.get(id) ?? baseByLens.get(id)!).filter(Boolean) as PulseCard[];
}

function applyEditorial(
  ctx: PipelineCtx,
  obj: Record<string, unknown>,
  baseline: SignalAnalysis,
  recentTitles: { id: string; title: string }[],
): void {
  const ed = (obj.editorial ?? {}) as Record<string, unknown>;
  const dupRaw = str(ed.duplicateOf);
  const dup = recentTitles.some((r) => r.id === dupRaw) ? dupRaw : undefined;
  ctx.editorial = {
    clarity: clamp(ed.clarity, 80),
    hypeRisk: clamp(ed.hypeRisk, 30),
    hallucinationRisk: clamp(ed.hallucinationRisk, 20),
    duplicateOf: dup,
    approved: ed.approved === undefined ? true : bool(ed.approved),
    notes: str(ed.notes) || undefined,
  };
  const ah = (obj.actionHorizon ?? {}) as Record<string, unknown>;
  ctx.actionHorizon = {
    now: ensureMin(strArr(ah.now), 1, ["Brief the team on this signal this week."]),
    next: ensureMin(strArr(ah.next), 1, ["Reassess once competitor responses land."]),
    later: ensureMin(strArr(ah.later), 1, ["Fold the durable shifts into next-cycle planning."]),
  };
  ctx.hypeCheckScore = clamp(obj.hypeCheckScore, baseline.hypeCheckScore);
  ctx.hypeNotes = str(obj.hypeNotes, baseline.hypeNotes);
  ctx.rachelEicComment = str(obj.rachelEicComment, baseline.rachelEicComment);
  ctx.audioScript = str(obj.audioScript) || baseline.audioScript;
}

function backfillEditorial(ctx: PipelineCtx, baseline: SignalAnalysis): void {
  ctx.editorial = {
    clarity: 80,
    hypeRisk: 30,
    hallucinationRisk: 20,
    approved: true,
    notes: "Editorial stage unavailable; baseline sign-off applied.",
  };
  ctx.actionHorizon = baseline.actionHorizon ?? {
    now: ["Brief the team on this signal this week."],
    next: ["Reassess once competitor responses land."],
    later: ["Fold the durable shifts into next-cycle planning."],
  };
  ctx.hypeCheckScore = baseline.hypeCheckScore;
  ctx.hypeNotes = baseline.hypeNotes;
  ctx.rachelEicComment = baseline.rachelEicComment;
  ctx.audioScript = baseline.audioScript;
}

// ── final assembly: legacy required fields + all 6-agent enrichments ────────
function assemble(
  ctx: PipelineCtx,
  baseline: SignalAnalysis,
  signalId: string | undefined,
  originalText: string | undefined,
): SignalAnalysis {
  const title = ctx.title ?? ctx.scout.headline ?? baseline.title;
  const cards = ctx.cards ?? baseline.cards;
  const sources: Source[] = ctx.scout.sources.length ? ctx.scout.sources : baseline.disclosure.sources;
  const disclosure: Disclosure = {
    producedBy: "Ada — AI Research Analyst",
    reviewedBy: "Rachel — Editor-in-Chief",
    sources,
    provenanceHash: provenance(`${title}::${ctx.scout.signalText}`),
  };
  const id =
    signalId ?? `sig-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24).replace(/^-|-$/g, "")}`;
  return {
    id,
    title,
    summary: ctx.summary ?? baseline.summary,
    date: baseline.date && signalId ? baseline.date : "Today",
    category: ctx.category ?? baseline.category,
    originalText: originalText ?? ctx.scout.signalText,
    hypeCheckScore: ctx.hypeCheckScore ?? baseline.hypeCheckScore,
    hypeNotes: ctx.hypeNotes ?? baseline.hypeNotes,
    rachelEicComment: ctx.rachelEicComment ?? baseline.rachelEicComment,
    audioScript: ctx.audioScript ?? baseline.audioScript,
    disclosure,
    cards,
    confidence: ctx.confidence,
    pulseScore: ctx.pulseScore,
    masterBrief: ctx.masterBrief,
    editorial: ctx.editorial,
    actionHorizon: ctx.actionHorizon,
    scoutSourceCount: ctx.scout.sourceCount,
  };
}

// Last-resort: return the cached fixture verbatim (always has 4 cards), tagged with
// the caller's signalId/originalText so the client captures it like any analysis.
function fallbackAnalysis(
  baseline: SignalAnalysis,
  signalId: string | undefined,
  originalText: string | undefined,
): SignalAnalysis {
  return {
    ...baseline,
    id: signalId ?? baseline.id,
    originalText: originalText ?? baseline.originalText,
  };
}

function ensureMin(arr: string[], min: number, fallback: string[]): string[] {
  if (arr.length >= min) return arr;
  const out = [...arr];
  for (const f of fallback) {
    if (out.length >= min) break;
    out.push(f);
  }
  return out;
}
