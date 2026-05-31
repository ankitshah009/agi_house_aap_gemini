// One-off: generate the AAP executive intelligence card via Gemini 2.5 Flash Image ("Nano Banana").
// Usage: GEMINI_API_KEY=... node scripts/gen-pulse-card.mjs [outfile.png]

import { writeFileSync, readFileSync, existsSync } from "node:fs";

const KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  (existsSync(".env")
    ? (readFileSync(".env", "utf8").match(/^GEMINI_API_KEY=(.+)$/m)?.[1]?.trim() ?? "")
    : "");

if (!KEY) {
  console.error("No GEMINI_API_KEY found (env or .env).");
  process.exit(1);
}

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = process.argv[2] || "pulse-exec-card.png";

const PROMPT = `Design a premium EXECUTIVE INTELLIGENCE CARD for "Ad AI Pulse (AAP)". This is a 16:9 landscape, presentation-quality executive briefing graphic — NOT a social media post, NOT a marketing infographic, NOT a Canva template. The goal: an advertising executive understands the most important market shift of the last 24 hours in under 60 seconds.

VISUAL LANGUAGE: Bloomberg Terminal x The Economist x Stratechery x Sequoia market maps x OpenAI launch visuals. Dark premium near-black navy background with a faint technical grid. Accent palette: electric purple, cyan, blue, and gold. Strong information hierarchy, generous clean whitespace, crisp executive-quality sans-serif typography. High credibility, authoritative, information-dense but instantly scannable. Sharp, legible from a presentation screen.

LAYOUT (left header block, central hero market map, right rails):

TOP-LEFT HEADER:
- Small label "AD AI PULSE — EXECUTIVE BRIEF"
- TITLE (large, bold, white): "AI Advertising Infrastructure Is Being Rewritten"
- SUBTITLE (lighter): "Discovery, Trust, and Execution are becoming AI-native."

TOP-RIGHT PULSE SCORE PANEL (prominent, gold/cyan):
- Huge number "93" with smaller "/100"
- Label "AAP PULSE SCORE"
- "Market Shift: Infrastructure Reset"
- "Importance: HIGH" (gold pill/badge)

EXECUTIVE TAKEAWAY (concise text block, upper area):
"Advertising is moving from keyword-driven workflows toward AI-native decision systems. The next-gen ad stack is owned by whoever controls Discovery, Provenance, and Real-time Execution."

HERO VISUAL — MARKET DYNAMICS MAP (center, the dominant element): a VERTICAL CAUSAL FLOW showing hierarchy and causality (NOT equal-sized circles). Three stacked layered tiers connected by bold directional downward arrows with labels:
1) DISCOVERY LAYER — "Google AI Overviews Ads"  (cyan tier)
   ↓ labeled arrow "influences" ↓
2) TRUST LAYER — "EU Synthetic Media Enforcement"  (purple tier)
   ↓ labeled arrow "enables" ↓
3) EXECUTION LAYER — "The Trade Desk · Kokai OS"  (blue tier)
   ↓ labeled arrow "results in" ↓
=> Glowing gold capstone node: "AI-NATIVE ADVERTISING STACK"
Each tier larger/brighter as it converges; show market influence and directional flow clearly.

RIGHT RAIL — two columns:
WHO WINS (cyan/green check accents): Structured Data Platforms · Verification Infrastructure · First-Party Data Owners · AI-Native Agencies · Modern DSPs
WHO IS AT RISK (red/amber accents): Keyword Arbitrage Businesses · Legacy Ad Networks · Manual Optimization Services · Black-Box AI Tools

BOTTOM STRIP — three boxes:
NOW: "Audit search, provenance, and DSP readiness."
NEXT: "Invest in structured data, AI creative workflows, and verification systems."
WATCH: "How Google, Meta, OpenAI, Amazon, and DSPs reshape the ad stack over 12 months."

All text must be spelled exactly as written and rendered crisp and legible. No fake logos. Make the market map the hero. Professional, authoritative, scannable in 60 seconds.`;

const BASE = "https://generativelanguage.googleapis.com";

const res = await fetch(`${BASE}/v1beta/models/${MODEL}:generateContent`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
  body: JSON.stringify({
    contents: [{ parts: [{ text: PROMPT }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  }),
});

if (!res.ok) {
  console.error(`Image request failed: ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

const data = await res.json();
const parts = data?.candidates?.[0]?.content?.parts ?? [];
let saved = false;
for (const p of parts) {
  const inline = p.inlineData ?? p.inline_data;
  if (inline?.data) {
    writeFileSync(OUT, Buffer.from(inline.data, "base64"));
    console.log(`Saved ${OUT} (${inline.mimeType ?? "image/png"})`);
    saved = true;
    break;
  }
}
if (!saved) {
  console.error("No image returned. Raw response:");
  console.error(JSON.stringify(data, null, 2).slice(0, 1500));
  process.exit(1);
}
