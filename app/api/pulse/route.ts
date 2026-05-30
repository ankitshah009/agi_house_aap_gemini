import type { NextRequest } from "next/server";
import { CURATED_SIGNALS } from "@/lib/data";
import { serverEnv } from "@/lib/env";
import { runAgentEngine, runFastEngine, runFastSafe } from "@/lib/agent";
import type { EngineMode, LensId, SignalAnalysis, StatusEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // cold Antigravity runs can take 15-150s

const HERO = CURATED_SIGNALS[0];
const enc = new TextEncoder();
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface ReasoningStep {
  stage: string;
  label: string;
  pct: number;
  lens?: LensId;
}

// The visible content-gen pipeline: source -> filter -> frame x4 -> review -> publish.
const REASONING: ReasoningStep[] = [
  { stage: "source", label: "Ada — scanning the signal across live sources…", pct: 10 },
  { stage: "filter", label: "Anti-hype grounding check (fact vs. marketing)…", pct: 24 },
  { stage: "frame", label: "Framing the Agency Strategist lens…", pct: 40, lens: "strategist" },
  { stage: "frame", label: "Framing the Executive Strategy lens…", pct: 55, lens: "executive" },
  { stage: "frame", label: "Framing the Adtech & GTM lens…", pct: 70, lens: "gtm" },
  { stage: "frame", label: "Framing the Responsible AI & Policy lens…", pct: 82, lens: "policy" },
  { stage: "review", label: "Rachel — Editor-in-Chief reviewing & signing off…", pct: 92 },
  { stage: "publish", label: "Publishing four Pulse Cards…", pct: 98 },
];

type Settled =
  | { ok: true; analysis: SignalAnalysis }
  | { ok: false; message: string };

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* empty body ok */
  }

  const signalId = typeof body.signalId === "string" ? body.signalId : undefined;
  const freeSignal = typeof body.signal === "string" ? body.signal.trim() : "";
  const requested =
    body.mode === "agent" || body.mode === "fast" || body.mode === "cached"
      ? (body.mode as EngineMode)
      : serverEnv.defaultMode;
  const mode: EngineMode = serverEnv.forceCache ? "cached" : requested;

  const fixture = signalId
    ? CURATED_SIGNALS.find((s) => s.id === signalId)
    : undefined;
  const signalText =
    freeSignal || (fixture ? `${fixture.title}. ${fixture.originalText}` : HERO.originalText);

  const runId = `run-${Math.random().toString(16).slice(2, 8)}`;
  const t0 = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: StatusEvent) =>
        controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));

      try {
        if (mode === "cached") {
          const analysis = fixture ?? (await runFastSafe(signalText)) ?? HERO;
          for (const r of REASONING) {
            send({ type: "status", stage: r.stage, label: r.label, pct: r.pct, lens: r.lens });
            await sleep(360);
          }
          send({ type: "result", analysis });
          send({ type: "done", source: "cached", runId, ms: Date.now() - t0 });
          controller.close();
          return;
        }

        // Live (agent | fast): run the engine while streaming heartbeat reasoning.
        const enginePromise =
          mode === "agent"
            ? runAgentEngine(signalText, { id: fixture?.id })
            : runFastEngine(signalText, { id: fixture?.id });

        const work: Promise<Settled> = enginePromise
          .then((r): Settled => ({ ok: true, analysis: r.analysis }))
          .catch((e: unknown): Settled => ({
            ok: false,
            message: e instanceof Error ? e.message : String(e),
          }));

        const tick = mode === "agent" ? 1600 : 900;
        let settled: Settled | null = null;
        let i = 0;
        while (!settled) {
          if (i < REASONING.length) {
            const r = REASONING[i];
            send({ type: "status", stage: r.stage, label: r.label, pct: r.pct, lens: r.lens });
          } else {
            const secs = ((Date.now() - t0) / 1000).toFixed(0);
            const who = mode === "agent" ? "Ada (Antigravity)" : "Gemini";
            send({ type: "status", stage: "work", label: `Still synthesizing with ${who}… ${secs}s`, pct: 99 });
          }
          i++;
          settled = await Promise.race([work, sleep(tick).then(() => null)]);
        }

        if (settled.ok) {
          send({ type: "result", analysis: settled.analysis });
          send({ type: "done", source: mode, runId, ms: Date.now() - t0 });
        } else {
          send({ type: "fallback", reason: settled.message.slice(0, 160) });
          const fb =
            fixture ?? (mode === "agent" ? await runFastSafe(signalText) : null) ?? HERO;
          send({ type: "result", analysis: fb });
          send({ type: "done", source: "cached", runId, ms: Date.now() - t0 });
        }
        controller.close();
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : String(err);
        send({ type: "fallback", reason: reason.slice(0, 160) });
        send({ type: "result", analysis: fixture ?? HERO });
        send({ type: "done", source: "cached", runId, ms: Date.now() - t0 });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
