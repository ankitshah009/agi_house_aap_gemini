import type { NextRequest } from "next/server";
import { generateText } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYSTEM = `You are Ada, the AI research analyst behind "Ad AI Pulse". A professional is asking a follow-up question about a brief you produced. Answer concisely (<= 110 words), tactically, and grounded in the provided brief context. When relevant, point to the right lens — Agency Strategist, Executive Strategy, Adtech & GTM, or Responsible AI & Policy. Speak as Ada: confident, specific, no fluff. Do not invent facts beyond the brief; if something isn't covered, say what you'd check.`;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const context = typeof body.context === "string" ? body.context : "";
  if (!question) {
    return Response.json({ error: "Missing question" }, { status: 400 });
  }

  const user = `BRIEF CONTEXT:\n${context}\n\nFOLLOW-UP QUESTION: ${question}\n\nAnswer as Ada, concisely and tactically.`;

  try {
    const answer = await generateText(SYSTEM, user, 40_000);
    return Response.json({ answer: answer.trim() || "Let me look into that and follow up." });
  } catch {
    // Graceful offline answer so Ask Ada never dead-ends on stage.
    return Response.json({
      answer:
        "I'm offline this second — but from this brief, start with the lens that scores highest for your role and execute its NOW step first; that's where the next 30 days of value sits.",
      offline: true,
    });
  }
}
