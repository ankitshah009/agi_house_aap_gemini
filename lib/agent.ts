// Lens Engine backends. Server-only. All Gemini calls go through geminiFetch, which
// fails over from the primary key to the backup on auth/quota errors.
//  runAgentEngine -> Antigravity managed agent (raw REST, verified-live path; browses sources)
//  runFastEngine  -> gemini structured output (fast, deterministic)

import "server-only";
import { serverEnv } from "./env";
import { geminiFetch } from "./gemini";
import { buildAgentInput, buildFastBody } from "./prompt";
import { parseAnalysis, safeParseObject } from "./parse";
import { buildAgentBody, buildAgentInteractionInput } from "./pipeline/prompts";
import type { AgentId, SignalAnalysis } from "./types";

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
  const res = await geminiFetch(`${BASE}/v1beta/interactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Api-Revision": "2026-05-20" },
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
  const res = await geminiFetch(`${BASE}/v1beta/models/${serverEnv.fastModel}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildFastBody(signalText)),
    signal: AbortSignal.timeout(serverEnv.fastTimeoutMs),
  });
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
  const res = await geminiFetch(`${BASE}/v1beta/models/${serverEnv.fastModel}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as Json;
  return extractFastText(data);
}

// ── 6-AGENT PIPELINE RUNNERS ────────────────────────────────────────────────
// These power lib/pipeline/orchestrate.ts. They reuse the SAME extractors and the
// SAME robust JSON recovery (safeParseObject) as the legacy single-call path.

export interface StageResult {
  raw: string;
  obj: Record<string, unknown>;
  interactionId?: string;
}

// Generic structured stage call (Agents 2-6, and Scout in "fast" mode).
export async function runStructuredStage(
  agent: AgentId,
  ctxJson: string,
  opts: { timeoutMs?: number } = {},
): Promise<StageResult> {
  const res = await geminiFetch(`${BASE}/v1beta/models/${serverEnv.fastModel}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildAgentBody(agent, ctxJson)),
    signal: AbortSignal.timeout(opts.timeoutMs ?? serverEnv.stageTimeoutMs),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const text = extractFastText((await res.json()) as Json);
  const obj = safeParseObject(text);
  if (!obj) throw new Error(`stage ${agent}: unparseable structured output`);
  return { raw: text, obj };
}

// Antigravity stage (Scout in "agent" mode): live browsing, fenced-JSON contract.
export async function runScoutAgent(
  ctxJson: string,
  opts: { timeoutMs?: number } = {},
): Promise<StageResult> {
  const res = await geminiFetch(`${BASE}/v1beta/interactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Api-Revision": "2026-05-20" },
    body: JSON.stringify({
      agent: "antigravity-preview-05-2026",
      input: buildAgentInteractionInput("scout", ctxJson),
      environment: "remote",
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? serverEnv.agentTimeoutMs),
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
  const obj = safeParseObject(text);
  if (!obj) throw new Error("scout: unparseable Antigravity output");
  return {
    raw: text,
    obj,
    interactionId: typeof data.id === "string" ? data.id : undefined,
  };
}
