import type { NextRequest } from "next/server";
import { generateText } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Optional Gemini refinement for the Rachel Brief. The client always has a working local
// template; this just tightens phrasing. On any failure we echo the draft back unchanged,
// so the brief never dead-ends.

const SYSTEM = `You are Rachel, Editor-in-Chief of "Ad AI Pulse". Polish the given draft into a 25–30 second spoken voiceover (about 70–90 words).

Voice: sharp, plainspoken, strategic, industry-aware. Not hypey, not generic. Plain English a busy operator would respect.

Hard rules:
- Never use the words "delve", "landscape", "game-changer", or "revolutionize".
- Keep the structure: open with "Today's signal:", say who it's for and why it matters, give ONE concrete implication, give ONE concrete next move, and end EXACTLY with "Produced by Ada, reviewed by Rachel."
- Do not invent facts, numbers, or names beyond the draft.
- Return ONLY the script text — no quotes, no preamble, no markdown.`;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* empty body ok */
  }

  const draft = typeof body.draft === "string" ? body.draft.trim() : "";
  if (!draft) return Response.json({ error: "Missing draft" }, { status: 400 });

  try {
    const out = await generateText(
      SYSTEM,
      `DRAFT:\n${draft}\n\nReturn the polished 25–30 second script now.`,
      20_000,
    );
    const script = out.trim();
    if (!script) return Response.json({ script: draft, refined: false });
    return Response.json({ script, refined: true });
  } catch {
    // No key / timeout / model error — fall back to the local draft.
    return Response.json({ script: draft, refined: false });
  }
}
