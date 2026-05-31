// Server-only environment access. NEVER import this from a Client Component.
// The Gemini keys are read here and nowhere else; never prefixed NEXT_PUBLIC_.

import "server-only";
import type { EngineMode } from "./types";

function readMode(v: string | undefined): EngineMode {
  return v === "agent" || v === "fast" || v === "cached" ? v : "cached";
}

const primaryKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "";
const backupKey = process.env.GEMINI_API_KEY_BACKUP ?? "";

export const serverEnv = {
  geminiApiKey: primaryKey,
  geminiApiKeyBackup: backupKey,
  // Primary first, then backup; deduped, non-empty. geminiFetch fails over across these
  // on auth/quota errors so a rate-limited primary key cannot kill a live demo.
  geminiApiKeys: [primaryKey, backupKey].filter((k, i, a) => k.length > 0 && a.indexOf(k) === i),
  // Kill-switch: force cached output regardless of client request (flaky-wifi insurance).
  forceCache: process.env.DEMO_FORCE_CACHE === "1",
  defaultMode: readMode(process.env.DEMO_DEFAULT_MODE),
  fastModel: process.env.GEMINI_FAST_MODEL ?? "gemini-2.5-flash",
  ttsModel: process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts",
  // Nano Banana Pro (Gemini 3 Pro Image): best legible text, served on v1alpha (see gemini.ts).
  imageModel: process.env.GEMINI_IMAGE_MODEL ?? "gemini-3-pro-image-preview",
  imageFallbackModel: process.env.GEMINI_IMAGE_FALLBACK_MODEL ?? "gemini-2.5-flash-image",
  agentTimeoutMs: Number(process.env.PULSE_TIMEOUT_MS ?? 150_000),
  fastTimeoutMs: Number(process.env.FAST_TIMEOUT_MS ?? 60_000),
  stageTimeoutMs: Number(process.env.STAGE_TIMEOUT_MS ?? 30_000),
} as const;

export function hasGeminiKey(): boolean {
  return serverEnv.geminiApiKeys.length > 0;
}
