// Server-only environment access. NEVER import this from a Client Component.
// The Gemini key is read here and nowhere else; it is never prefixed NEXT_PUBLIC_.

import "server-only";
import type { EngineMode } from "./types";

function readMode(v: string | undefined): EngineMode {
  return v === "agent" || v === "fast" || v === "cached" ? v : "cached";
}

export const serverEnv = {
  geminiApiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "",
  // Kill-switch: force cached output regardless of client request (flaky-wifi insurance).
  forceCache: process.env.DEMO_FORCE_CACHE === "1",
  // Default mode the UI opens in.
  defaultMode: readMode(process.env.DEMO_DEFAULT_MODE),
  // Model for the "fast" structured path. Override if 3.5-flash isn't served to this key.
  fastModel: process.env.GEMINI_FAST_MODEL ?? "gemini-2.5-flash",
  // TTS model for Rachel-voice briefings (best-effort; client Web Speech is the fallback).
  ttsModel: process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts",
  // Image model ("Nano Banana") for the Pulse infographic hero (best-effort; coded fallback).
  imageModel: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image",
  // Antigravity (agent) timeout before falling back to cached.
  agentTimeoutMs: Number(process.env.PULSE_TIMEOUT_MS ?? 150_000),
  // Fast-path timeout.
  fastTimeoutMs: Number(process.env.FAST_TIMEOUT_MS ?? 60_000),
} as const;

export function hasGeminiKey(): boolean {
  return serverEnv.geminiApiKey.length > 0;
}
