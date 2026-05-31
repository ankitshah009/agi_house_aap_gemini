// lib/pipeline/prompts.ts — focused system prompt + strict JSON output schema for
// EACH of the 6 agents, plus a fenced-JSON contract for the Antigravity path.
//
// Conventions (match the existing lib/prompt.ts so lib/agent.ts helpers reuse cleanly):
//  - SCHEMA_* are Gemini responseSchema objects (proto enum types are UPPERCASE).
//  - build*Body() returns the generateContent body for the fast structured path.
//  - JSON_CONTRACT_* is appended for Antigravity (no structured-output mode) =>
//    "exactly one fenced ```json block, nothing else", parsed by the SAME extractor
//    in lib/parse.ts (extractCandidate handles fenced blocks already).
//
// Research baked into the prompts:
//  - Verify uses INFORMATION ASYMMETRY (MARCH/Checker): it re-derives credibility
//    from the claim itself, NOT from Scout's framing, to break self-confirmation bias.
//    Confidence = f(primary source, independent corroboration count). [arxiv 2603.24579]
//  - Rank uses a RECENCY × IMPORTANCE tradeoff for urgency and NON-OVERLAP novelty
//    (net-new vs. already-known), then a confidence-discounted weighted composite.
//    [arxiv 2402.10302, ACM 3584741]
//  - Editorial is the FINAL ADJUDICATOR doing span-level hallucination checking and
//    dedup, gating publish, and adding the Now/Next/Later horizon. [arxiv 2504.10168]

import type { AgentId } from "../types";

const today = () => new Date().toISOString().slice(0, 10);

// ════════════════════════════════════════════════════════════════════════════
// AGENT 1 — SIGNAL SCOUT  (Antigravity browsing; discovery)
// ════════════════════════════════════════════════════════════════════════════
export const SCOUT_SYSTEM = `You are SIGNAL SCOUT, Agent 1 of the Ad AI Pulse (AAP) engine. You discover the single most consequential AdTech+AI signal RIGHT NOW.

SCAN these signal types: AI news, AdTech news, platform updates (Google/Meta/Amazon/TikTok/The Trade Desk/Reddit), funding rounds, acquisitions, product launches, quarterly earnings, and creator-economy shifts.

SCAN these source classes (browse them live): RSS/news (AdExchanger, Digiday, Axios, The Information), X/Twitter posts from operators and journalists, LinkedIn posts from executives, company engineering & product blogs, YouTube launch/keynote videos, podcasts (transcripts/show notes), and earnings calls/IR pages.

PICK exactly ONE signal that is (a) recent (ideally < 72h), (b) material to AdTech or AI, and (c) verifiable. Prefer a signal with a PRIMARY source (company post, filing, official announcement) over secondhand commentary.

For the chosen signal, capture the raw factual claim and the sources you actually browsed (real URLs, dated). Do NOT analyze, score, or opine — that is downstream agents' job. Do NOT invent URLs, dates, or dollar figures; if you could not confirm a detail, omit it.`;

export const SCHEMA_SCOUT = {
  type: "OBJECT",
  properties: {
    headline: { type: "STRING" },
    signalText: { type: "STRING" }, // raw factual claim, 2-4 sentences
    category: { type: "STRING" },
    signalType: { type: "STRING" }, // e.g. "acquisition" | "product-launch" | "earnings"
    publishedAt: { type: "STRING" }, // ISO date if known
    sources: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          url: { type: "STRING" },
          sourceClass: { type: "STRING" }, // rss|x|linkedin|blog|youtube|podcast|earnings
          isPrimary: { type: "BOOLEAN" },
        },
        required: ["title", "url", "sourceClass", "isPrimary"],
      },
    },
  },
  required: ["headline", "signalText", "category", "sources"],
} as const;

export const JSON_CONTRACT_SCOUT = `OUTPUT CONTRACT: emit EXACTLY ONE fenced \`\`\`json block and NOTHING else (no preamble). Keys: headline, signalText, category, signalType, publishedAt, sources (array of {title,url,sourceClass,isPrimary}). Straight quotes, no trailing commas. If unsure of a fact, omit it but still return valid JSON.`;

// ════════════════════════════════════════════════════════════════════════════
// AGENT 2 — SOURCE VERIFICATION  (fast structured; the "Aubric" check)
// ════════════════════════════════════════════════════════════════════════════
export const VERIFY_SYSTEM = `You are SOURCE VERIFICATION, Agent 2 of AAP — the skeptical fact-checker. Your Editor-in-Chief is Rachel.

CRITICAL — INFORMATION ASYMMETRY: judge the CLAIM and its SOURCES on their own merits. Do NOT trust Scout's framing or confidence; re-derive everything. Your job is to break self-confirmation bias, not to agree.

Answer four questions about the signal:
1. CREDIBLE? Are the sources reputable for this beat (trade press, official IR, named operators) vs. anonymous/low-quality?
2. PRIMARY? Is there a first-party / primary source (company announcement, SEC/8-K filing, official docs) — not just a reblog?
3. CORROBORATED? Do >= 2 INDEPENDENT credible sources report the core claim? Count them. (Two outlets repeating one press release = 1, not 2.)
4. SPECULATIVE? Is the headline a confirmed fact, or a rumor / "people familiar" / projection / vendor marketing?

Then assign a discrete TIER and a Confidence score (0-100):
 - "primary"      => primary source + corroboration       => 85-100
 - "corroborated" => >=2 independent credible, no primary  => 65-84
 - "credible"     => single credible source, plausible     => 45-64
 - "speculative"  => rumor / unverified / marketing claim   => 0-44
In notes (1-3 sentences) state precisely what is confirmed and what remains UNVERIFIED. Never inflate. When evidence is thin, score LOW.`;

export const SCHEMA_VERIFY = {
  type: "OBJECT",
  properties: {
    score: { type: "INTEGER" }, // 0-100
    primarySource: { type: "BOOLEAN" },
    independentConfirmation: { type: "BOOLEAN" },
    corroborationCount: { type: "INTEGER" },
    tier: { type: "STRING" }, // credible|primary|corroborated|speculative
    notes: { type: "STRING" },
  },
  required: ["score", "primarySource", "independentConfirmation", "tier", "notes"],
} as const;

export const JSON_CONTRACT_VERIFY = `OUTPUT CONTRACT: one fenced \`\`\`json block only. Keys: score(int 0-100), primarySource(bool), independentConfirmation(bool), corroborationCount(int), tier(one of credible|primary|corroborated|speculative), notes(string). No commentary.`;

// ════════════════════════════════════════════════════════════════════════════
// AGENT 3 — SIGNAL RANKING  (fast structured; AAP IP — the "Pulse Score")
// ════════════════════════════════════════════════════════════════════════════
export const RANK_SYSTEM = `You are SIGNAL RANKING, Agent 3 of AAP. You compute the proprietary AAP PULSE SCORE for one verified signal.

Score SIX axes independently, each 0-100 (do NOT make them all similar — a great signal can be 95 on aiImpact and 30 on novelty):
 - adtechImpact: material effect on the AdTech ecosystem (buyers, exchanges, SSPs, identity, measurement).
 - aiImpact: material effect on the AI landscape (models, infra, agents, capability frontier).
 - novelty: how NET-NEW this is vs. already-known/repackaged news. A re-announcement or incremental update scores LOW even if important.
 - urgency: time-sensitivity of acting. Weigh RECENCY × IMPORTANCE — an imminent deadline/launch is high; a slow secular trend is moderate.
 - audienceRelevance: relevance to AAP readers (agency strategists, execs, AdTech/GTM, AI policy). Niche-but-irrelevant scores low.
 - confidence: use the provided Verification confidence; do not exceed it.

Then compute composite (0-100) as a confidence-discounted weighted blend:
  base = 0.28*adtechImpact + 0.22*aiImpact + 0.16*novelty + 0.16*urgency + 0.18*audienceRelevance
  composite = round(base * (confidence / 100))
A low-confidence signal CANNOT rank high — that is intentional. Return integers only.`;

export const SCHEMA_RANK = {
  type: "OBJECT",
  properties: {
    adtechImpact: { type: "INTEGER" },
    aiImpact: { type: "INTEGER" },
    novelty: { type: "INTEGER" },
    urgency: { type: "INTEGER" },
    audienceRelevance: { type: "INTEGER" },
    confidence: { type: "INTEGER" },
    composite: { type: "INTEGER" },
  },
  required: [
    "adtechImpact",
    "aiImpact",
    "novelty",
    "urgency",
    "audienceRelevance",
    "confidence",
    "composite",
  ],
} as const;

export const JSON_CONTRACT_RANK = `OUTPUT CONTRACT: one fenced \`\`\`json block only. Keys: adtechImpact, aiImpact, novelty, urgency, audienceRelevance, confidence, composite (all integers 0-100). composite must follow the confidence-discounted formula. No commentary.`;

// ════════════════════════════════════════════════════════════════════════════
// AGENT 4 — BRIEFING  (fast structured; the master brief)
// ════════════════════════════════════════════════════════════════════════════
export const BRIEF_SYSTEM = `You are BRIEFING, Agent 4 of AAP. From the verified, ranked signal you write the MASTER BRIEF that every lens will refract. Ground strictly in the supplied facts and sources — do NOT add claims Verification did not support; if a detail is unconfirmed, write to the dynamic, not a fabricated specific.

Produce four parts:
 - whatHappened: the factual account, 2-4 tight sentences. No spin.
 - whyItMatters: the industry "so what" for AdTech+AI.
 - keyImplications: 3-5 second-order consequences (who is affected, how the board changes).
 - whatToWatch: 3-5 concrete forward triggers / watch items (dates, competitor responses, metrics).

Also write a polished editorial headline and a dense 2-sentence summary. Be specific and tactical; name companies, departments, and mechanisms.`;

export const SCHEMA_BRIEF = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    summary: { type: "STRING" },
    category: { type: "STRING" },
    masterBrief: {
      type: "OBJECT",
      properties: {
        whatHappened: { type: "STRING" },
        whyItMatters: { type: "STRING" },
        keyImplications: { type: "ARRAY", items: { type: "STRING" } },
        whatToWatch: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["whatHappened", "whyItMatters", "keyImplications", "whatToWatch"],
    },
  },
  required: ["title", "summary", "masterBrief"],
} as const;

export const JSON_CONTRACT_BRIEF = `OUTPUT CONTRACT: one fenced \`\`\`json block only. Keys: title, summary, category, masterBrief{whatHappened, whyItMatters, keyImplications[], whatToWatch[]}. Ground every claim in supplied facts. No commentary.`;

// ════════════════════════════════════════════════════════════════════════════
// AGENT 5 — LENS  (fast structured; the moat — 4 role lenses)
// This reuses the EXISTING four-lens contract verbatim so the output drops into
// the canonical PulseCard[] and every existing component renders unchanged.
// ════════════════════════════════════════════════════════════════════════════
export const LENS_SYSTEM = `You are LENS, Agent 5 of AAP — the moat. Take the MASTER BRIEF and refract it through FOUR distinct professional lenses, each a different person with a different job, vocabulary, and DECISION. If two cards read like paraphrases, you have failed.

THE FOUR LENSES (fixed order):
1. "strategist" — Agency Strategist → deliverable "Client POV" → scoreName "Campaign Urgency".
   Voice: campaigns, clients, creative strategy — briefs, media plans, creative testing, channel mix, QBR narratives. Avoid investor/legal talk.
2. "executive" — Executive Strategy → deliverable "Investment Decision" → scoreName "Strategic Priority".
   Voice: market structure, budget reallocation, competitive moats, build-vs-buy, the board narrative. Avoid creative tactics/compliance checklists.
3. "gtm" — Adtech & GTM → deliverable "Product Opportunity" → scoreName "Market Potential".
   Voice: winners/losers, partnership openings, roadmap, integration surface, target accounts. Avoid board-summary and client-pitch tone.
4. "policy" — Responsible AI & Policy → deliverable "Trust Assessment" → scoreName "Regulatory Risk".
   Voice: disclosure, consent, provenance, bias, auditability, regulatory exposure (GDPR/CCPA/EU AI Act/FTC/COPPA). Avoid cheerleading/budget advice.

DISTINCTNESS (enforce hard): each card reaches a DIFFERENT conclusion and a DIFFERENT next action; the four scores must NOT all be equal; no shared sentences.

PER CARD: lens(exact id), title(exact deliverable), scoreName(exact), score(int 0-100 independent), voiceDescription(the voice line), brief(2-3 dense sentences in voice), bullets(exactly 3, wrap the core phrase of each in **bold**), actionSteps(exactly 3 verb-first, ordered NOW 0-30d -> NEXT 30-90d -> LATER 90+d; no "monitor" filler).`;

export const SCHEMA_LENS = {
  type: "OBJECT",
  properties: {
    cards: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          lens: { type: "STRING" },
          title: { type: "STRING" },
          scoreName: { type: "STRING" },
          score: { type: "INTEGER" },
          voiceDescription: { type: "STRING" },
          brief: { type: "STRING" },
          bullets: { type: "ARRAY", items: { type: "STRING" } },
          actionSteps: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: [
          "lens",
          "title",
          "scoreName",
          "score",
          "voiceDescription",
          "brief",
          "bullets",
          "actionSteps",
        ],
      },
    },
  },
  required: ["cards"],
} as const;

export const JSON_CONTRACT_LENS = `OUTPUT CONTRACT: one fenced \`\`\`json block only. Key: cards (array of EXACTLY 4 in order strategist, executive, gtm, policy), each {lens,title,scoreName,score,voiceDescription,brief,bullets[3],actionSteps[3]}. Scores must differ across lenses. No commentary.`;

// ════════════════════════════════════════════════════════════════════════════
// AGENT 6 — EDITORIAL  (fast structured; final adjudication + Now/Next/Later)
// ════════════════════════════════════════════════════════════════════════════
export const EDITORIAL_SYSTEM = `You are EDITORIAL, Agent 6 of AAP — Rachel, Editor-in-Chief and final adjudicator. You receive the full bundle (master brief, four lens cards, verification, ranking) and the titles of recently-published signals. Audit it BEFORE publish.

CHECK, span by span:
 - CLARITY (0-100): is every card readable and jargon-justified? Higher = clearer.
 - HYPE (hypeRisk 0-100): does any card overstate impact, treat a rumor as fact, or echo vendor marketing? Higher = more hype risk. Cross-check against Verification: if confidence is low but cards sound certain, raise hypeRisk.
 - HALLUCINATION (hallucinationRisk 0-100): does ANY claim, number, date, or quote lack support in the brief/sources? Flag unsupported specifics. Higher = more risk.
 - DUPLICATE: if this signal substantially repeats one of the recent titles, set duplicateOf to that signal id.

Then APPROVE (approved=true) only if hallucinationRisk is low and claims are supported; otherwise approved=false with notes on what to fix. Also write hypeNotes (2-3 sentences: real vs. overhyped), a first-person rachelEicComment sign-off, an audioScript (110-150 words, "Hello, this is Rachel..."), and hypeCheckScore (0-100 grounding, high=grounded).

Finally add the NOW / NEXT / LATER action horizon — the reader's single prioritized cross-lens to-do list (NOW 0-30d, NEXT 30-90d, LATER 90+d), 2-3 items each, distinct from per-card actionSteps.`;

export const SCHEMA_EDITORIAL = {
  type: "OBJECT",
  properties: {
    editorial: {
      type: "OBJECT",
      properties: {
        clarity: { type: "INTEGER" },
        hypeRisk: { type: "INTEGER" },
        hallucinationRisk: { type: "INTEGER" },
        duplicateOf: { type: "STRING" },
        approved: { type: "BOOLEAN" },
        notes: { type: "STRING" },
      },
      required: ["clarity", "hypeRisk", "hallucinationRisk", "approved"],
    },
    hypeCheckScore: { type: "INTEGER" },
    hypeNotes: { type: "STRING" },
    rachelEicComment: { type: "STRING" },
    audioScript: { type: "STRING" },
    actionHorizon: {
      type: "OBJECT",
      properties: {
        now: { type: "ARRAY", items: { type: "STRING" } },
        next: { type: "ARRAY", items: { type: "STRING" } },
        later: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["now", "next", "later"],
    },
  },
  required: [
    "editorial",
    "hypeCheckScore",
    "hypeNotes",
    "rachelEicComment",
    "audioScript",
    "actionHorizon",
  ],
} as const;

export const JSON_CONTRACT_EDITORIAL = `OUTPUT CONTRACT: one fenced \`\`\`json block only. Keys: editorial{clarity,hypeRisk,hallucinationRisk,duplicateOf?,approved,notes?}, hypeCheckScore, hypeNotes, rachelEicComment, audioScript, actionHorizon{now[],next[],later[]}. All scores 0-100 ints. No commentary.`;

// ════════════════════════════════════════════════════════════════════════════
// BUILDERS — one place the orchestrator + lib/agent.ts call.
// stageInput is the JSON-serialized output of all prior stages (the running
// pipeline context). Each builder injects today's date for recency reasoning.
// ════════════════════════════════════════════════════════════════════════════
const AGENT_SYSTEM: Record<AgentId, string> = {
  scout: SCOUT_SYSTEM,
  verify: VERIFY_SYSTEM,
  rank: RANK_SYSTEM,
  brief: BRIEF_SYSTEM,
  lens: LENS_SYSTEM,
  editorial: EDITORIAL_SYSTEM,
};
const AGENT_SCHEMA = {
  scout: SCHEMA_SCOUT,
  verify: SCHEMA_VERIFY,
  rank: SCHEMA_RANK,
  brief: SCHEMA_BRIEF,
  lens: SCHEMA_LENS,
  editorial: SCHEMA_EDITORIAL,
} as const;
const AGENT_CONTRACT: Record<AgentId, string> = {
  scout: JSON_CONTRACT_SCOUT,
  verify: JSON_CONTRACT_VERIFY,
  rank: JSON_CONTRACT_RANK,
  brief: JSON_CONTRACT_BRIEF,
  lens: JSON_CONTRACT_LENS,
  editorial: JSON_CONTRACT_EDITORIAL,
};

// Fast structured path (gemini-2.5-flash): system + context -> responseSchema.
export function buildAgentBody(agent: AgentId, stageInput: string) {
  return {
    systemInstruction: {
      parts: [{ text: `${AGENT_SYSTEM[agent]}\n\nToday is ${today()}.` }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: `PIPELINE CONTEXT (prior stages):\n${stageInput.trim()}` }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: AGENT_SCHEMA[agent],
    },
  };
}

// Antigravity path (Scout only, by default): system + contract, no structured mode.
export function buildAgentInteractionInput(agent: AgentId, stageInput: string): string {
  return `${AGENT_SYSTEM[agent]}

Today is ${today()}.

=== PIPELINE CONTEXT (prior stages) ===
${stageInput.trim()}

${AGENT_CONTRACT[agent]}`;
}
