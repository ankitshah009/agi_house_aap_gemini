// Lens Engine backends. Server-only (reads the key).
//  runAgentEngine -> Antigravity managed agent (raw REST, verified-live path; browses sources)
//  runFastEngine  -> gemini structured output (fast, deterministic)

import "server-only";
import { serverEnv } from "./env";
import { buildAgentInput, buildFastBody } from "./prompt";
import { parseAnalysis } from "./parse";
import type { SignalAnalysis } from "./types";

const BASE = "https://generativelanguage.googleapis.com";

type Json = Record<string, unknown>;
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export interface RunResult {
  analysis: SignalAnalysis;
  raw: string;
  interactionId?: string;
  environmentId?: string;
}

// Raw REST has no output_text — walk to the last model_output step and join its text parts.
function extractAgentText(data: Json): string {
  const steps = asArray(data.steps);
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = (steps[i] ?? {}) as Json;
    if (s.type === "model_output") {
      return asArray(s.content)
        .filter((c): c is Json => !!c && (c as Json).type === "text")
        .map((c) => String((c as Json).text ?? ""))
        .join("");
    }
  }
  return "";
}

function extractFastText(data: Json): string {
  const first = (asArray(data.candidates)[0] ?? {}) as Json;
  const content = (first.content ?? {}) as Json;
  return asArray(content.parts)
    .map((p) => String((p as Json).text ?? ""))
    .join("");
}

export async function runAgentEngine(
  signalText: string,
  opts: { id?: string } = {},
): Promise<RunResult> {
  const key = serverEnv.geminiApiKey;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const res = await fetch(`${BASE}/v1beta/interactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
      "Api-Revision": "2026-05-20",
    },
    body: JSON.stringify({
      agent: "antigravity-preview-05-2026",
      input: buildAgentInput(signalText),
      environment: "remote",
    }),
    signal: AbortSignal.timeout(serverEnv.agentTimeoutMs),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Antigravity HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as Json;
  if (typeof data.status === "string" && data.status !== "completed") {
    throw new Error(`Antigravity status: ${data.status}`);
  }
  const text = extractAgentText(data);
  const analysis = parseAnalysis(text, { id: opts.id, originalText: signalText });
  return {
    analysis,
    raw: text,
    interactionId: typeof data.id === "string" ? data.id : undefined,
    environmentId: typeof data.environment_id === "string" ? data.environment_id : undefined,
  };
}

export async function runFastEngine(
  signalText: string,
  opts: { id?: string } = {},
): Promise<RunResult> {
  const key = serverEnv.geminiApiKey;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const res = await fetch(
    `${BASE}/v1beta/models/${serverEnv.fastModel}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(buildFastBody(signalText)),
      signal: AbortSignal.timeout(serverEnv.fastTimeoutMs),
    },
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as Json;
  const text = extractFastText(data);
  const analysis = parseAnalysis(text, { id: opts.id, originalText: signalText });
  return { analysis, raw: text };
}

// Never-throw fast path, used as a fallback layer.
export async function runFastSafe(
  signalText: string,
  opts: { id?: string } = {},
): Promise<SignalAnalysis | null> {
  try {
    return (await runFastEngine(signalText, opts)).analysis;
  } catch {
    return null;
  }
}

// Plain text generation (Ada Q&A). Non-structured.
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  timeoutMs = 40_000,
): Promise<string> {
  const key = serverEnv.geminiApiKey;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const res = await fetch(
    `${BASE}/v1beta/models/${serverEnv.fastModel}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    },
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as Json;
  return extractFastText(data);
}
