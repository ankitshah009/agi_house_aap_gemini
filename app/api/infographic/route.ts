import type { NextRequest } from "next/server";

// Server-side image generation via Nano Banana (Gemini 2.5 Flash Image).
// Verified live: model `gemini-2.5-flash-image` returns a base64 PNG at
// candidates[0].content.parts[].inlineData.{data,mimeType}.
// NEVER 500 the user: on ANY failure we return 200 { dataUrl: null, error }.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BASE = "https://generativelanguage.googleapis.com";
// Override if the preview alias is served to this key instead.
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";

type Json = Record<string, unknown>;

function readKey(): string {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "";
}

// Build a tight editorial-infographic prompt from the signal.
function buildPrompt(title: string, summary: string, brief?: string): string {
  const ctx = [summary, brief].filter(Boolean).join("\n\n");
  return [
    "Create a clean, modern editorial INFOGRAPHIC in a 16:9 landscape format that vividly explains this news signal.",
    "",
    `HEADLINE: ${title}`,
    "",
    "WHAT TO EXPLAIN (visually, with simple iconography and short labels):",
    "- What happened (the core event)",
    "- Who moved (the key players / companies involved)",
    "- What it means (the implication or so-what)",
    "",
    "CONTEXT TO GROUND THE VISUAL:",
    ctx || title,
    "",
    "STYLE: restrained, professional editorial design suitable for a business-intelligence brief.",
    "Use a calm, neutral palette with a single accent color, generous whitespace, clear visual hierarchy,",
    "simple flat icons, and a few short, correctly-spelled labels (3-6 words max each).",
    "Use real, legible words only — absolutely NO gibberish or fake/garbled text, no lorem ipsum.",
    "Prefer a structured layout: a clear title area and 2-4 labeled sections or a simple flow.",
    "No photos of real people, no watermarks, no logos of real brands.",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  let body: Json = {};
  try {
    body = (await req.json()) as Json;
  } catch {
    /* ignore — handled below */
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const brief = typeof body.brief === "string" ? body.brief.trim() : undefined;

  if (!title && !summary) {
    return Response.json({ dataUrl: null, error: "Missing title/summary" });
  }

  const key = readKey();
  if (!key) {
    return Response.json({ dataUrl: null, error: "No API key for image generation" });
  }

  try {
    const res = await fetch(`${BASE}/v1beta/models/${IMAGE_MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(title, summary, brief) }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
      signal: AbortSignal.timeout(110_000),
    });

    if (!res.ok) {
      let detail = "";
      try {
        detail = (await res.text()).slice(0, 300);
      } catch {
        /* ignore */
      }
      return Response.json({ dataUrl: null, error: `Image API ${res.status}${detail ? `: ${detail}` : ""}` });
    }

    const data = (await res.json()) as Json;
    const cand = (((data.candidates as unknown[]) ?? [])[0] ?? {}) as Json;
    const content = (cand.content ?? {}) as Json;
    const parts = (content.parts as unknown[]) ?? [];

    // Find the first part carrying inline image bytes (camelCase or snake_case).
    let b64 = "";
    let mime = "image/png";
    for (const p of parts) {
      const part = (p ?? {}) as Json;
      const inline = (part.inlineData ?? part.inline_data ?? {}) as Json;
      const dataStr = typeof inline.data === "string" ? inline.data : "";
      if (dataStr) {
        b64 = dataStr;
        const m =
          (typeof inline.mimeType === "string" && inline.mimeType) ||
          (typeof inline.mime_type === "string" && inline.mime_type) ||
          "image/png";
        mime = m;
        break;
      }
    }

    if (!b64) {
      return Response.json({ dataUrl: null, error: "No image returned" });
    }

    return Response.json({ dataUrl: `data:${mime};base64,${b64}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Image generation failed";
    return Response.json({ dataUrl: null, error: msg });
  }
}
