import type { NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { guardApi } from "@/lib/apiGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASE = "https://generativelanguage.googleapis.com";
type Json = Record<string, unknown>;

// Gemini TTS returns raw 16-bit PCM; wrap it in a WAV header so the browser can <audio> it.
function pcmToWavBase64(pcmB64: string, sampleRate: number): string {
  const pcm = Buffer.from(pcmB64, "base64");
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buf = Buffer.alloc(44 + pcm.length);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + pcm.length, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(bitsPerSample, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(pcm.length, 40);
  pcm.copy(buf, 44);
  return buf.toString("base64");
}

// Returns 404 on any problem so the client cleanly falls back to browser Web Speech.
export async function POST(req: NextRequest) {
  const denied = await guardApi(req, "speech");
  if (!denied.ok) return denied.response;

  let body: Json = {};
  try {
    body = (await req.json()) as Json;
  } catch {
    /* ignore */
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return Response.json({ error: "Missing text" }, { status: 400 });

  const key = serverEnv.geminiApiKey;
  if (!key) return Response.json({ error: "No API key for TTS" }, { status: 404 });

  try {
    const res = await fetch(
      `${BASE}/v1beta/models/${serverEnv.ttsModel}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Read this editorial advertising-intelligence brief in a confident, warm, authoritative female editorial voice: ${text}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
            },
          },
        }),
        signal: AbortSignal.timeout(50_000),
      },
    );
    if (!res.ok) return Response.json({ error: `TTS ${res.status}` }, { status: 404 });

    const data = (await res.json()) as Json;
    const cand = (((data.candidates as unknown[]) ?? [])[0] ?? {}) as Json;
    const content = (cand.content ?? {}) as Json;
    const part = (((content.parts as unknown[]) ?? [])[0] ?? {}) as Json;
    const inline = (part.inlineData ?? part.inline_data ?? {}) as Json;
    const b64 = typeof inline.data === "string" ? inline.data : "";
    const mime = typeof inline.mimeType === "string" ? inline.mimeType : "audio/L16;rate=24000";
    if (!b64) return Response.json({ error: "No audio returned" }, { status: 404 });

    const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000);
    const wav = pcmToWavBase64(b64, rate);
    return Response.json({ audio: wav, mime: "audio/wav" });
  } catch {
    return Response.json({ error: "TTS failed" }, { status: 404 });
  }
}
