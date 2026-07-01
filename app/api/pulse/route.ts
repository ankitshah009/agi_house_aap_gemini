import type { NextRequest } from "next/server";
import { CURATED_SIGNALS } from "@/lib/data";
import { serverEnv } from "@/lib/env";
import { guardApi } from "@/lib/apiGuard";
import { runFastSafe } from "@/lib/agent";
import { runPipeline } from "@/lib/pipeline/orchestrate";
import {
  AGENT_ORDER,
  AGENT_META,
  type AgentEvent,
  type AgentId,
  type EngineMode,
  type PipelineStage,
  type SignalAnalysis,
  type StatusEvent,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // cold Antigravity runs can take 15-150s

const HERO = CURATED_SIGNALS[0];
const enc = new TextEncoder();
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Map an AgentId -> a legacy PipelineStage so the existing ReasoningPanel (which keys
// off {type:"status"}) still lights up while the new 6-lane tracker reads {type:"agent"}.
const AGENT_TO_LEGACY_STAGE: Record<AgentId, PipelineStage> = {
  scout: "source",
  verify: "filter",
  rank: "filter",
  brief: "frame",
  lens: "frame",
  editorial: "review",
};

export async function POST(req: NextRequest) {
  const denied = await guardApi(req, "pulse");
  if (!denied.ok) return denied.response;

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

  const runId = `run-${Math.random().toString(16).slice(2, 8)}`;
  const t0 = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: StatusEvent) =>
        controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));

      try {
        // ── CACHED MODE: bulletproof. Replay scripted agent events + legacy
        //    heartbeat, then emit the fixture. Never touches the live pipeline.
        if (mode === "cached") {
          const analysis =
            fixture ?? (freeSignal ? await runFastSafe(freeSignal) : null) ?? HERO;
          // Scripted 6-agent narration (start -> done) interleaved with the
          // legacy REASONING heartbeat, so BOTH the 6-lane tracker and the old
          // ReasoningPanel animate from one stream.
          for (let i = 0; i < AGENT_ORDER.length; i++) {
            const agent = AGENT_ORDER[i];
            const meta = AGENT_META[agent];
            const pct = Math.round(((i + 1) / AGENT_ORDER.length) * 96);
            send({ type: "agent", agent, phase: "start", pct, label: `${meta.name} — ${meta.role}` });
            send({
              type: "status",
              stage: AGENT_TO_LEGACY_STAGE[agent],
              label: `${meta.name} — ${meta.role}`,
              pct,
            });
            await sleep(300);
            send({ type: "agent", agent, phase: "done", pct, label: scriptedDone(agent, analysis) });
            await sleep(160);
          }
          send({ type: "status", stage: "publish", label: "Publishing four Pulse Cards…", pct: 98 });
          send({ type: "result", analysis });
          send({ type: "done", source: "cached", runId, ms: Date.now() - t0 });
          controller.close();
          return;
        }

        // ── LIVE MODE (fast | agent): run the 6-agent pipeline. The orchestrator
        //    emits AgentEvents via onEvent; we forward each verbatim AND mirror a
        //    legacy {type:"status"} so existing components keep working. The
        //    orchestrator owns per-stage fallbacks and ALWAYS returns 4 cards.
        const recentTitles = CURATED_SIGNALS.map((s) => ({ id: s.id, title: s.title }));

        const analysis = await runPipeline(freeSignal || undefined, {
          mode, // "agent" => Scout via Antigravity; "fast" => Scout-fast
          signalId,
          fixture, // 4-card guarantee carrier
          recentTitles, // for Editorial dedup
          onEvent: (ev: AgentEvent) => {
            send(ev); // 1) the new 6-agent tracker event, verbatim
            // 2) mirror a legacy status event so ReasoningPanel still animates
            if (ev.phase === "start" || ev.phase === "done" || ev.phase === "skipped") {
              send({
                type: "status",
                stage: AGENT_TO_LEGACY_STAGE[ev.agent],
                label: ev.label,
                pct: ev.pct,
              });
            }
          },
        });

        send({ type: "result", analysis });
        send({ type: "done", source: mode, runId, ms: Date.now() - t0 });
        controller.close();
      } catch (err: unknown) {
        // Outer catch-all: the orchestrator already does per-stage fallback, so this
        // only fires on a truly unexpected throw. Never leave the user empty.
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

// Compact "done" labels for the cached replay, sourced from the fixture so the
// scripted run shows real numbers (confidence, pulse score, etc.).
function scriptedDone(agent: AgentId, a: SignalAnalysis): string {
  switch (agent) {
    case "scout":
      return `Locked a signal across ${a.disclosure.sources.length} sources`;
    case "verify":
      return a.confidence ? `Confidence ${a.confidence.score} — ${a.confidence.tier ?? "assessed"}` : "Credibility assessed";
    case "rank":
      return a.pulseScore ? `Pulse Score ${a.pulseScore.composite}/100` : "Pulse Score computed";
    case "brief":
      return "Master brief assembled";
    case "lens":
      return `Refracted into ${a.cards.length} lenses`;
    case "editorial":
      return a.editorial?.approved === false ? "Flagged for review — Rachel, EIC" : "Approved for publish — Rachel, EIC";
  }
}
