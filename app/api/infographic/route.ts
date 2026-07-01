import type { NextRequest } from "next/server";
import { geminiFetch } from "@/lib/gemini";
import { serverEnv, hasGeminiKey } from "@/lib/env";
import { guardApi } from "@/lib/apiGuard";
import { getCachedImage, imageCacheKey, setCachedImage } from "@/lib/imageCache";

// Infographic generation via Nano Banana (2.5 Flash Image) with optional Pro upgrade.
// Server-side cache avoids repeat Gemini calls for the same digest/signal.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
    "STYLE: clean modern grid on a DARK premium background (deep charcoal-navy, near-black), light text, with a vivid violet-to-blue accent and a subtle neon glow, crisp sans-serif typography, thin hairline dividers. Do NOT use a white or light background.",
    "Every word must be real, correctly spelled English, legible, and meaningful.",
    "FINAL CHECK before you finish: re-read every label, caption, and sentence in the image and confirm each one is coherent, grammatically correct, and actually makes sense in context, with NO duplicated words, no broken or nonsensical phrases, and no random characters. If any text fails, fix it.",
    "No gibberish, no lorem ipsum, no random letters, no real brand logos, no photographs of real people, no watermarks, no signatures.",
  ].join("\n");
}

// Digest: ONE infographic that combines the top 3 stories of the day, one panel each.
function buildDigestPrompt(title: string, storiesText: string): string {
  return [
    "Design a polished, magazine-quality editorial INFOGRAPHIC, 16:9 landscape: a DAILY DIGEST of the top stories in advertising and AI today.",
    "",
    `HEADLINE (render this exact text, large across the top): ${title}`,
    "",
    "Show the 3 stories below as connected nodes with simple arrows or connectors that convey the DYNAMICS between them (who pressures whom, what shifts because of what, the shared impact). It must read like a clear map of today's moves, not three isolated boxes. For each story: a simple flat icon, a short bold label (3 to 6 words: who did what), and a one-line impact (5 to 9 words).",
    "",
    "THE THREE STORIES (use these exactly, do not invent companies or numbers):",
    storiesText,
    "",
    "STYLE: clean modern editorial diagram on a DARK premium background (deep charcoal-navy, near-black) with light text, a vivid violet-to-blue accent, and glowing connector lines and arrows to show the relationships, crisp sans-serif typography. Do NOT use a white or light background.",
    "Every word must be real, correctly spelled English, legible, and meaningful.",
    "FINAL CHECK before you finish: re-read every label, caption, and sentence and confirm each is coherent, grammatically correct, and actually makes sense in context, with NO duplicated words (for example never repeat a word like 'Today Today'), no broken or nonsensical phrases, and no random characters. If any text fails, fix it.",
    "No gibberish, no lorem ipsum, no real brand logos, no photographs of people, no watermarks.",
  ].join("\n");
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
  const denied = await guardApi(req, "infographic");
  if (!denied.ok) return denied.response;

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
  const prompt = kind === "digest" ? buildDigestPrompt(title, summary) : buildPrompt(title, summary, brief);

  const cacheKey = imageCacheKey([kind, title, summary, brief ?? ""]);
  const cached = getCachedImage(cacheKey);
  if (cached) return Response.json({ dataUrl: cached, model: "cache" });

  const usePro = process.env.GEMINI_IMAGE_USE_PRO === "1";
  const models = usePro
    ? [serverEnv.imageUpgradeModel, serverEnv.imageModel, serverEnv.imageFallbackModel]
    : [serverEnv.imageModel, serverEnv.imageFallbackModel];

  try {
    for (const model of models) {
      const timeout = model.includes("pro") || model.startsWith("gemini-3") ? 250_000 : 90_000;
      const url = await tryModel(model, prompt, timeout).catch(() => null);
      if (url) {
        setCachedImage(cacheKey, url);
        return Response.json({ dataUrl: url, model });
      }
    }
    return Response.json({ dataUrl: null, error: "No image returned" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Image generation failed";
    return Response.json({ dataUrl: null, error: msg });
  }
}
