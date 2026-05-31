import type { NextRequest } from "next/server";
import { geminiFetch } from "@/lib/gemini";
import { serverEnv, hasGeminiKey } from "@/lib/env";

// Infographic generation via Nano Banana Pro (Gemini 3 Pro Image), with a 2.5-flash-image
// fallback. Key failover (primary -> backup) is handled by geminiFetch.
// NEVER 500 the user: on ANY failure we return 200 { dataUrl: null, error }.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // Pro image gen can take 15-30s

const BASE = "https://generativelanguage.googleapis.com";

type Json = Record<string, unknown>;

// Gemini 3 image models (Nano Banana Pro) are served on v1alpha; 2.x on v1beta.
function endpoint(model: string): string {
  const ver = model.startsWith("gemini-3") || model.includes("nano-banana") ? "v1alpha" : "v1beta";
  return `${BASE}/${ver}/models/${model}:generateContent`;
}

function buildPrompt(title: string, summary: string, brief?: string): string {
  const ctx = [summary, brief].filter(Boolean).join("\n\n");
  return [
    "Design a polished, magazine-quality editorial INFOGRAPHIC, 16:9 landscape, that explains this advertising and AI news at a glance for a business-intelligence brief.",
    "",
    `HEADLINE (render this exact text, large and legible across the top): ${title}`,
    "",
    "Lay it out as a clear visual story with three labeled sections, left to right:",
    "1) WHAT HAPPENED   2) WHO MOVED   3) WHAT IT MEANS",
    "Each section gets a simple, modern flat icon and a short caption of 4 to 8 words.",
    "",
    "Ground every label in these facts (use them, do not invent companies or numbers):",
    ctx || title,
    "",
    "STYLE: clean modern grid with generous whitespace and crisp sans-serif typography, but VIVID and colorful — give each of the three sections its own bold, saturated accent color with bright modern icons and energetic highlights. The colors must pop; never flat, washed out, or monochrome.",
    "Every word must be real, correctly spelled English, legible, and meaningful. No gibberish, no lorem ipsum, no random letters.",
    "No real brand logos, no photographs of real people, no watermarks, no signatures.",
  ].join("\n");
}

// Digest = a premium executive strategic MARKET MAP (Bloomberg / Sequoia aesthetic).
// Fully GENERIC: the players, roles, key ideas, relationships, score, and benefits/at-risk
// are all data-driven via `spec`, so the same template adapts to ANY day's signals (any
// companies, categories, or counts) — the example brief is just one instance of this template.
type BlueprintSpec = {
  headline: string;
  subtitle: string;
  pulseScore: number;
  importance: string; // HIGH | MEDIUM | MODERATE
  layers: { label: string; subject: string }[]; // fallback tiers when players are absent
  players: { entity: string; role: string; keyIdea: string }[]; // power-map players (data-driven)
  relationships: { from: string; to: string; relation: string }[]; // directional influence arrows
  marketContext: string; // grounded source for WHO BENEFITS / AT RISK (condensed by the model)
  actionContext: string; // grounded source for NOW / NEXT / WATCH (condensed by the model)
};

function buildDigestPrompt(spec: BlueprintSpec): string {
  // Generic: players, roles, key ideas, relationships, score and the benefits/at-risk
  // lists are all data-driven, so this Bloomberg-style market map adapts to ANY day's signals.
  const players = spec.players.length
    ? spec.players
    : spec.layers.map((l) => ({ entity: l.subject, role: l.label, keyIdea: l.subject }));

  const positions = ["LEFT", "TOP RIGHT", "BOTTOM LEFT", "BOTTOM RIGHT", "CENTER"];
  const playerLines = players.map((p, i) => {
    const pos = positions[i] ?? `REGION ${i + 1}`;
    return `- ${pos}: "${p.entity}" — Role: ${p.role}. Key idea: ${p.keyIdea}`;
  });
  const relLines = spec.relationships.length
    ? spec.relationships.map((r) => `- ${r.from} -> ${r.to}: ${r.relation}`)
    : ["- Draw only the few most important directional arrows implied by the players above."];

  return [
    "Create a premium executive strategic MARKET MAP for Ad AI Pulse. It is NOT an infographic, NOT a dashboard, NOT a social-media graphic. It must feel like a Bloomberg intelligence slide or a Sequoia market map.",
    "GOAL: help a senior advertising executive instantly understand how AI is reshaping the advertising industry, in under 10 seconds. Prioritize clarity, hierarchy, and strategic understanding over decoration. Minimal text, maximum comprehension.",
    "",
    "STYLE:",
    "- 16:9 landscape.",
    "- Dark, premium background (deep charcoal or near-black navy).",
    "- Minimal, clean, highly legible. Modern strategic visualization with sharp, confident typography.",
    "- High-end consulting / Bloomberg-terminal aesthetic. SUBTLE neon accents ONLY (a little electric cyan and soft gold), used sparingly for emphasis. Do NOT overload with UI elements or clutter.",
    "",
    "TITLE (top-left, large and bold): AI ADVERTISING POWER MAP",
    `Subtitle (under the title, smaller): ${spec.subtitle}`,
    `Top-right badge (one clean line): AAP Pulse Score: ${spec.pulseScore} / 100`,
    "",
    "MAIN VISUAL: a strategic TERRITORY MAP of the dominant players below, each controlling a different layer of the advertising stack. DO NOT use equal-sized quadrants — create clear HIERARCHY and RELATIONSHIPS, using size and position to convey dominance. Give each player a small, distinct visual motif fitting its role (for example a search and answer ecosystem, an audience graph, bidding pipelines, or a retail and commerce grid). Place the players at these regions:",
    ...playerLines,
    "",
    "RELATIONSHIPS: draw ONLY these few major directional arrows (subtle, thin, never busy), showing how influence flows between the players:",
    ...relLines,
    "",
    "BOTTOM BAR — three concise blocks. Derive ONE short line for each from the ACTION CONTEXT (condense; do not render the context verbatim):",
    '- "NOW": the immediate audit or move.',
    '- "NEXT": the 30 to 90 day investment.',
    '- "WATCH": the open strategic question to monitor.',
    "ACTION CONTEXT: " +
      (spec.actionContext ||
        "Audit AI readiness across discovery, targeting, and DSP infrastructure; invest in structured data, AI workflows, and first-party data; watch which platform becomes the operating system for AI-native advertising."),
    "",
    "Two small, clean lists in the lower corners (4 crisp 2-to-4-word items each, derived from the MARKET CONTEXT, never invented):",
    '- "WHO BENEFITS": the platforms, infrastructure, and data advantages that gain.',
    '- "AT RISK": the tactics, players, and models that are exposed.',
    "MARKET CONTEXT: " + spec.marketContext,
    "",
    "A senior advertising executive should understand the market shift in under 10 seconds. Every rendered word must be real, correctly spelled English, legible, and meaningful. No gibberish, no lorem ipsum. Render company NAMES as clean text labels only — no real brand logos, no photographs of people, no watermarks, no signatures.",
  ].join("\n");
}

// Build a BlueprintSpec from the request body, with safe fallbacks so the route still
// produces a coherent power map even when only title/summary are provided.
function specFromBody(body: Json, title: string, summary: string): BlueprintSpec {
  const bp = (body.blueprint ?? {}) as Json;

  const rawLayers = Array.isArray(bp.layers) ? (bp.layers as Json[]) : [];
  const layers = rawLayers
    .map((l) => {
      const o = (l ?? {}) as Json;
      return {
        label: typeof o.label === "string" ? o.label : "",
        subject: typeof o.subject === "string" ? o.subject : "",
      };
    })
    .filter((l) => l.label && l.subject);

  const rawPlayers = Array.isArray(bp.players) ? (bp.players as Json[]) : [];
  const players = rawPlayers
    .map((p) => {
      const o = (p ?? {}) as Json;
      return {
        entity: typeof o.entity === "string" ? o.entity : "",
        role: typeof o.role === "string" ? o.role : "",
        keyIdea: typeof o.keyIdea === "string" ? o.keyIdea : "",
      };
    })
    .filter((p) => p.entity)
    .slice(0, 5);

  const rawRels = Array.isArray(bp.relationships) ? (bp.relationships as Json[]) : [];
  const relationships = rawRels
    .map((r) => {
      const o = (r ?? {}) as Json;
      return {
        from: typeof o.from === "string" ? o.from : "",
        to: typeof o.to === "string" ? o.to : "",
        relation: typeof o.relation === "string" ? o.relation : "",
      };
    })
    .filter((r) => r.from && r.to)
    .slice(0, 6);

  // Fallback: derive tiers from a numbered summary list ("1. ...\n2. ...").
  const fallbackLayers = summary
    .split("\n")
    .map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean)
    .map((subject, i) => ({ label: `LAYER ${i + 1}`, subject }));

  const finalLayers = (layers.length ? layers : fallbackLayers).slice(0, 5);

  return {
    headline:
      typeof bp.headline === "string" && bp.headline ? bp.headline : title || "Today in AdTech and AI",
    subtitle:
      typeof bp.subtitle === "string" && bp.subtitle
        ? bp.subtitle
        : "How AI is reshaping discovery, audience targeting, execution, and commerce.",
    pulseScore: typeof bp.pulseScore === "number" ? Math.round(bp.pulseScore) : 90,
    importance: typeof bp.importance === "string" && bp.importance ? bp.importance : "HIGH",
    layers: finalLayers.length ? finalLayers : [{ label: "SIGNAL LAYER", subject: title }],
    players,
    relationships,
    marketContext: typeof bp.marketContext === "string" && bp.marketContext ? bp.marketContext : summary || title,
    actionContext: typeof bp.actionContext === "string" ? bp.actionContext : "",
  };
}

function extractImage(data: Json): { b64: string; mime: string } | null {
  const cand = (((data.candidates as unknown[]) ?? [])[0] ?? {}) as Json;
  const content = (cand.content ?? {}) as Json;
  const parts = (content.parts as unknown[]) ?? [];
  for (const p of parts) {
    const part = (p ?? {}) as Json;
    const inline = (part.inlineData ?? part.inline_data ?? {}) as Json;
    const dataStr = typeof inline.data === "string" ? inline.data : "";
    if (dataStr) {
      const mime =
        (typeof inline.mimeType === "string" && inline.mimeType) ||
        (typeof inline.mime_type === "string" && inline.mime_type) ||
        "image/png";
      return { b64: dataStr, mime };
    }
  }
  return null;
}

async function tryModel(
  model: string,
  prompt: string,
  timeoutMs: number,
): Promise<string | null> {
  const res = await geminiFetch(endpoint(model), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) return null;
  const img = extractImage((await res.json()) as Json);
  return img ? `data:${img.mime};base64,${img.b64}` : null;
}

export async function POST(req: NextRequest) {
  let body: Json = {};
  try {
    body = (await req.json()) as Json;
  } catch {
    /* handled below */
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const brief = typeof body.brief === "string" ? body.brief.trim() : undefined;

  if (!title && !summary) {
    return Response.json({ dataUrl: null, error: "Missing title/summary" });
  }
  if (!hasGeminiKey()) {
    return Response.json({ dataUrl: null, error: "No API key for image generation" });
  }

  const kind = body.kind === "digest" ? "digest" : "signal";
  const prompt =
    kind === "digest"
      ? buildDigestPrompt(specFromBody(body, title, summary))
      : buildPrompt(title, summary, brief);

  // 1) Nano Banana Pro. 2) flash fallback. Either may be swallowed; the client shows a
  //    tasteful placeholder rather than an error.
  try {
    const pro = await tryModel(serverEnv.imageModel, prompt, 250_000).catch(() => null);
    if (pro) return Response.json({ dataUrl: pro, model: serverEnv.imageModel });
    const fb = await tryModel(serverEnv.imageFallbackModel, prompt, 90_000).catch(() => null);
    if (fb) return Response.json({ dataUrl: fb, model: serverEnv.imageFallbackModel });
    return Response.json({ dataUrl: null, error: "No image returned" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Image generation failed";
    return Response.json({ dataUrl: null, error: msg });
  }
}
