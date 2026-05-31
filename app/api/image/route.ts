import type { NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// "Nano Banana" — Gemini 2.5 Flash Image. Generates the Pulse infographic hero band.
// Best-effort: returns 404 on any problem so the client cleanly falls back to its coded
// gradient hero. Never blocks the demo.

const BASE = "https://generativelanguage.googleapis.com";
type Json = Record<string, unknown>;
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export async function POST(req: NextRequest) {
  let body: Json = {};
  try {
    body = (await req.json()) as Json;
  } catch {
    /* ignore */
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return Response.json({ error: "Missing prompt" }, { status: 400 });

  const key = serverEnv.geminiApiKey;
  if (!key) return Response.json({ error: "No API key for image" }, { status: 404 });

  try {
    const res = await fetch(`${BASE}/v1beta/models/${serverEnv.imageModel}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
      signal: AbortSignal.timeout(50_000),
    });
    if (!res.ok) return Response.json({ error: `Image ${res.status}` }, { status: 404 });

    const data = (await res.json()) as Json;
    const cand = ((asArray(data.candidates)[0] ?? {}) as Json);
    const content = (cand.content ?? {}) as Json;
    for (const p of asArray(content.parts)) {
      const part = (p ?? {}) as Json;
      const inline = (part.inlineData ?? part.inline_data ?? {}) as Json;
      const b64 = typeof inline.data === "string" ? inline.data : "";
      if (b64) {
        const mime = typeof inline.mimeType === "string" ? inline.mimeType : "image/png";
        return Response.json({ image: `data:${mime};base64,${b64}` });
      }
    }
    return Response.json({ error: "No image returned" }, { status: 404 });
  } catch {
    return Response.json({ error: "Image failed" }, { status: 404 });
  }
}
