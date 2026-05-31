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
    "STYLE: clean modern grid, generous whitespace, a restrained palette with a deep indigo accent on a soft near-white background, crisp sans-serif typography, subtle hairline dividers.",
    "Every word must be real, correctly spelled English, legible, and meaningful. No gibberish, no lorem ipsum, no random letters.",
    "No real brand logos, no photographs of real people, no watermarks, no signatures.",
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

  const prompt = buildPrompt(title, summary, brief);

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
