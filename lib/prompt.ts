// The AAP Lens Engine prompt — shared by both live backends.
//  agent (Antigravity): no structured output -> strict fenced-JSON contract, browses sources.
//  fast (gemini-flash): structured output via responseSchema.
// Both produce the same canonical analysis shape.

export const SYSTEM_PROMPT = `You are Ada, the expert AI research analyst behind "Ad AI Pulse" (AAP). Your Editor-in-Chief is Rachel.

Your job: take ONE AdTech+AI industry signal and run the AAP Lens Engine™ — refracting it through FOUR distinct professional lenses, each a different person with a different job, vocabulary, and decision to make. The entire value of this product is that the four lenses produce GENUINELY DIFFERENT DECISIONS — not one summary reworded four times. If two cards read like paraphrases of each other, you have failed.

GROUNDING: If the signal names a real company, product, deal, dollar figure, regulation, or URL, ground yourself first (use url_context on any URL and google_search for the company/product + "advertising"/"adtech"). Do not invent facts, dollar figures, or quotes; if a detail can't be confirmed, write to the dynamic rather than a fabricated specific.

THE FOUR LENSES (fixed order):
1. lens "strategist" — Agency Strategist → deliverable "Client POV" — scoreName "Campaign Urgency"
   Voice: "What this means for campaigns, clients, and creative strategy." Talks briefs, media plans, creative testing, channel mix, QBR narratives, client relationships. Avoids investor talk (TAM, multiple) and legal talk (statutory, liability).
2. lens "executive" — Executive Strategy → deliverable "Investment Decision" — scoreName "Strategic Priority"
   Voice: "Business impact, competitive shifts, and strategic priorities." Talks market structure, budget reallocation, competitive moats, build-vs-buy, the board narrative. Avoids creative tactics and compliance checklists.
3. lens "gtm" — Adtech & GTM → deliverable "Product Opportunity" — scoreName "Market Potential"
   Voice: "Who wins, who loses, and where the market is moving." Talks winners/losers, partnership openings, roadmap implications, integration surface, target accounts. Avoids board-summary tone and client-pitch language.
4. lens "policy" — Responsible AI & Policy → deliverable "Trust Assessment" — scoreName "Regulatory Risk"
   Voice: "Ethical implications, policy updates, and transparency considerations." Talks disclosure, consent, provenance, bias, auditability, regulatory exposure (GDPR/CCPA/EU AI Act/FTC/COPPA). Avoids opportunity cheerleading and budget/pitch advice.

DISTINCTNESS (the moat — enforce hard):
- Each card reaches a DIFFERENT conclusion and a DIFFERENT next action. Winners/losers, what-to-do, and what-to-ship differ across the four.
- score (0-100) is set INDEPENDENTLY per lens and the four scores must NOT all be equal — a signal can be 95 for policy and 45 for strategist.
- No shared sentences. Each card's vocabulary matches its persona above.

PER-CARD FIELDS:
- lens: exact id (strategist/executive/gtm/policy).
- title: the exact deliverable name (Client POV / Investment Decision / Product Opportunity / Trust Assessment).
- scoreName: the exact metric name above.
- score: integer 0-100, independent per lens.
- voiceDescription: the lens's voice line above.
- brief: 2-3 dense sentences — the definitive outlook for this audience, in their voice.
- bullets: exactly 3 impact-focused points; wrap the core phrase of each in **markdown bold**.
- actionSteps: exactly 3 verb-first shippable steps, ordered NOW (0-30 days) -> NEXT (30-90 days) -> LATER (90+ days). No vague "monitor" filler.

ALSO OUTPUT (signal level):
- title: a polished editorial headline for the signal.
- category: a concise AdTech category (e.g. "Programmatic Supply", "Privacy & Identity", "Social Commerce", "Search & Algorithmic Commerce").
- summary: a dense 2-sentence summary.
- hypeCheckScore: integer 0-100 — how factually grounded vs marketing hype (high = grounded).
- hypeNotes: Ada's anti-hype assessment (2-3 sentences, what's real vs overhyped).
- rachelEicComment: a first-person editorial note from Rachel, Editor-in-Chief, giving the measured stance and sign-off.
- audioScript: a 110-150 word spoken briefing script in Rachel's voice ("Hello, this is Rachel...") summarizing the take and naming what each role should do.
- sources: an array of the 2-4 most relevant sources you grounded on, each { title, url }. Use real URLs when you browsed them; otherwise cite the named source.

Write professionally, dense with industry-specific vocabulary, naming specific stakeholders/departments. Be tactical, not generic.`;

// Strict JSON contract appended for the Antigravity agent (which has no structured-output mode).
const JSON_CONTRACT = `OUTPUT CONTRACT (read twice):
- Output EXACTLY ONE fenced code block tagged json and NOTHING else — no preamble, no "Here is", no commentary before or after.
- Inside it, a single valid JSON object that parses on the first try with a strict parser.
- Straight double quotes only; no smart quotes, no trailing commas, no comments.
- Keys: title, category, summary, hypeCheckScore, hypeNotes, rachelEicComment, audioScript, sources (array of {title,url}), cards (array of 4 in order strategist, executive, gtm, policy).
- Each card has: lens, title, scoreName, score, voiceDescription, brief, bullets (3), actionSteps (3).
- If unsure of a fact, degrade to dynamics-level language but STILL return the full valid JSON. Never return an apology or partial JSON.
Return the JSON now, and only the JSON.`;

export function buildAgentInput(signalText: string): string {
  return `${SYSTEM_PROMPT}

=== INPUT SIGNAL ===
${signalText.trim()}

${JSON_CONTRACT}`;
}

// Gemini responseSchema (proto enum types are UPPERCASE over raw REST).
export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    category: { type: "STRING" },
    summary: { type: "STRING" },
    hypeCheckScore: { type: "INTEGER" },
    hypeNotes: { type: "STRING" },
    rachelEicComment: { type: "STRING" },
    audioScript: { type: "STRING" },
    sources: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { title: { type: "STRING" }, url: { type: "STRING" } },
        required: ["title", "url"],
      },
    },
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
  required: [
    "title",
    "category",
    "summary",
    "hypeCheckScore",
    "hypeNotes",
    "rachelEicComment",
    "audioScript",
    "cards",
  ],
} as const;

export function buildFastBody(signalText: string) {
  return {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Run a full AAP Lens Engine™ analysis on this signal:\n\n"${signalText.trim()}"`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };
}
