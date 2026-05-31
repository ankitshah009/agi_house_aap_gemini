"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, ChevronRight } from "lucide-react";
import type { AgentEvent, AgentId } from "@/lib/types";
import { AGENT_ORDER, AGENT_META } from "@/lib/types";
import { LENS_BY_ID, isLensId } from "@/lib/lenses";

// PipelineTracker — the live trace of the 6-agent run. A calm, editorial-desk
// status list (CI-checks meets Linear activity feed): one row per agent, fixed
// order, a single vertical connector, accent only on the running/done glyphs.
//
// Prop contract (the orchestrator owns the stream):
//   events   — the streamed AgentEvent items, in arrival order.
//   progress — 0-100 aggregate, used only for the resting/idle decision and the
//              header count fallback; per-row state is DERIVED from `events`.

export interface PipelineTrackerProps {
  events: AgentEvent[];
  progress: number;
}

type RowState = "queued" | "running" | "done" | "error";

interface RowModel {
  id: AgentId;
  name: string;
  state: RowState;
  output: string; // latest one-line label for this agent
  lens?: string; // optional lens hue source (8px dot only)
  elapsedMs?: number; // running: live; done: final
}

// Derive each agent's state + latest output from the event log.
function deriveRows(
  events: AgentEvent[],
  timings: Map<AgentId, { startedAt: number; endedAt?: number }>,
  now: number,
): { rows: RowModel[]; running: AgentId | null; doneCount: number; errored: boolean } {
  // Latest label + last phase seen per agent.
  const lastLabel = new Map<AgentId, string>();
  const lastLens = new Map<AgentId, string>();
  const lastPhase = new Map<AgentId, AgentEvent["phase"]>();
  let frontier = -1; // index of the most recent agent to appear
  let errored = false;
  let erroredAgent: AgentId | null = null;

  for (const ev of events) {
    const idx = AGENT_ORDER.indexOf(ev.agent);
    if (idx < 0) continue;
    if (idx > frontier) frontier = idx;
    if (ev.label) lastLabel.set(ev.agent, ev.label);
    // Some events may carry a lens id alongside the agent payload (the one
    // sanctioned place a per-lens hue appears here, only as an 8px dot).
    const maybeLens = (ev as { lens?: unknown }).lens;
    if (isLensId(maybeLens)) lastLens.set(ev.agent, maybeLens);
    lastPhase.set(ev.agent, ev.phase);
    if (ev.phase === "error") {
      errored = true;
      erroredAgent = ev.agent;
    }
  }

  // The running agent = the frontier agent, unless it has emitted a terminal phase.
  const frontierId = frontier >= 0 ? AGENT_ORDER[frontier] : null;
  const frontierPhase = frontierId ? lastPhase.get(frontierId) : undefined;
  const frontierDone =
    frontierPhase === "done" || frontierPhase === "skipped";
  let runningId: AgentId | null =
    !errored && frontierId && !frontierDone ? frontierId : null;

  let doneCount = 0;

  const rows: RowModel[] = AGENT_ORDER.map((id, idx) => {
    const meta = AGENT_META[id];
    const phase = lastPhase.get(id);
    let state: RowState;

    if (errored && id === erroredAgent) {
      state = "error";
    } else if (errored && idx > AGENT_ORDER.indexOf(erroredAgent as AgentId)) {
      state = "queued";
    } else if (id === runningId) {
      state = "running";
    } else if (frontier >= 0 && idx < frontier) {
      // a later agent has appeared => this one is finished
      state = "done";
    } else if (frontier >= 0 && idx === frontier && frontierDone) {
      state = "done";
    } else if (phase === "done" || phase === "skipped") {
      state = "done";
    } else {
      state = "queued";
    }

    if (state === "done") doneCount += 1;

    const t = timings.get(id);
    let elapsedMs: number | undefined;
    if (state === "running" && t) elapsedMs = now - t.startedAt;
    else if (state === "done" && t)
      elapsedMs = (t.endedAt ?? now) - t.startedAt;

    return {
      id,
      name: meta.name,
      state,
      output: lastLabel.get(id) ?? "",
      lens: lastLens.get(id),
      elapsedMs,
    };
  });

  return { rows, running: runningId, doneCount, errored };
}

function fmtMs(ms: number | undefined): string {
  if (ms == null) return "–"; // en-dash placeholder for "no timing yet"
  const s = ms / 1000;
  if (s < 10) return `${s.toFixed(1)}s`;
  return `${Math.round(s)}s`;
}

// State glyph: queued ring, running spinning arc, done check disc, error ring.
function StateGlyph({ state }: { state: RowState }) {
  if (state === "done") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-ink">
        <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="flex h-5 w-5 items-center justify-center text-danger">
        <AlertCircle aria-hidden="true" className="h-5 w-5" />
      </span>
    );
  }
  if (state === "running") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="h-5 w-5"
        fill="none"
      >
        <circle
          cx="10"
          cy="10"
          r="8"
          stroke="var(--color-border-strong)"
          strokeWidth="1.5"
        />
        <circle
          cx="10"
          cy="10"
          r="8"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="14 36"
          className="origin-center motion-safe:animate-spin"
        />
      </svg>
    );
  }
  // queued
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
      <circle
        cx="10"
        cy="10"
        r="8"
        stroke="var(--color-ink-faint)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function STATE_WORD(state: RowState): string {
  if (state === "running") return "running";
  if (state === "done") return "done";
  if (state === "error") return "error";
  return "queued";
}

function PipelineRows({ rows }: { rows: RowModel[] }) {
  const frontierIdx = rows.findIndex((r) => r.state === "running");
  return (
    <ul className="relative">
      {rows.map((row, i) => {
        const dot =
          row.lens && isLensId(row.lens) ? LENS_BY_ID[row.lens].dotClass : undefined;
        // Connector above this row: accent when the prior row is finished, else border.
        const aboveDone = i > 0 && rows[i - 1].state === "done";
        const isLast = i === rows.length - 1;
        return (
          <li key={row.id} className="relative flex min-h-11 gap-3 py-2">
            {/* Glyph gutter with 1px vertical connector linking the sequence. */}
            <div className="relative flex w-5 shrink-0 flex-col items-center">
              {/* connector above */}
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute -top-2 left-1/2 h-2 w-px -translate-x-1/2 ${
                    aboveDone ? "bg-accent/40" : "bg-border"
                  }`}
                />
              )}
              {/* connector below */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute top-7 bottom-[-0.5rem] left-1/2 w-px -translate-x-1/2 ${
                    row.state === "done" ? "bg-accent/40" : "bg-border"
                  }`}
                />
              )}
              <div className="relative z-10 motion-safe:transition-opacity motion-safe:duration-200">
                <StateGlyph state={row.state} />
              </div>
            </div>

            {/* Name + live one-line output. */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={`truncate text-sm text-ink ${
                    row.state === "running" ? "font-semibold" : "font-medium"
                  }`}
                >
                  {row.name}
                </span>
                <span className="tnum shrink-0 font-mono text-xs text-ink-muted">
                  {row.state === "queued" ? "–" : fmtMs(row.elapsedMs)}
                </span>
              </div>
              {row.output ? (
                <div className="mt-0.5 flex items-center gap-1.5">
                  {dot && (
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 shrink-0 rounded-full ${dot}`}
                    />
                  )}
                  <span className="truncate text-[0.8125rem] leading-snug text-ink-muted">
                    {row.output}
                  </span>
                </div>
              ) : null}
            </div>

            <span className="sr-only">
              {row.name}, {STATE_WORD(row.state)}.
            </span>
          </li>
        );
      })}
      {/* keep frontierIdx referenced for clarity / future scroll-to */}
      <span hidden data-frontier={frontierIdx} />
    </ul>
  );
}

export default function PipelineTracker({ events, progress }: PipelineTrackerProps) {
  // Per-agent timing captured client-side (the protocol carries no timestamps).
  const timingsRef = useRef<Map<AgentId, { startedAt: number; endedAt?: number }>>(
    new Map(),
  );
  // Tick so the running row's elapsed time advances visibly.
  const [, setTick] = useState(0);
  const [expanded, setExpanded] = useState(false);

  // Maintain start/end timestamps as new events arrive.
  useEffect(() => {
    const now = performance.now();
    const m = timingsRef.current;
    let frontier = -1;
    for (const ev of events) {
      const idx = AGENT_ORDER.indexOf(ev.agent);
      if (idx < 0) continue;
      if (idx > frontier) frontier = idx;
      if (!m.has(ev.agent)) m.set(ev.agent, { startedAt: now });
      if (ev.phase === "done" || ev.phase === "skipped" || ev.phase === "error") {
        const t = m.get(ev.agent)!;
        if (t.endedAt == null) t.endedAt = now;
      }
    }
    // When a later agent starts, close out the previous one.
    if (frontier >= 0) {
      for (let i = 0; i < frontier; i++) {
        const t = m.get(AGENT_ORDER[i]);
        if (t && t.endedAt == null) t.endedAt = now;
      }
    }
  }, [events]);

  const { rows, running, doneCount, errored } = deriveRows(
    events,
    timingsRef.current,
    performance.now(),
  );

  const isRunning = running != null && !errored;
  const total = AGENT_ORDER.length;
  const complete = doneCount >= total && events.length > 0;

  // Advance the elapsed clock ~6fps while a row is running.
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 160);
    return () => window.clearInterval(id);
  }, [isRunning]);

  const statusWord = errored
    ? "Attention"
    : complete
      ? "Complete"
      : isRunning
        ? "Running"
        : "Idle";

  // Total elapsed across all started agents.
  const totalElapsed = (() => {
    const m = timingsRef.current;
    let min = Infinity;
    let max = 0;
    const now = performance.now();
    for (const t of m.values()) {
      min = Math.min(min, t.startedAt);
      max = Math.max(max, t.endedAt ?? now);
    }
    return min === Infinity ? undefined : max - min;
  })();

  // Idle/resting collapse: when complete and not actively running, show a single
  // summary row with a "View run" disclosure that expands the 6 done rows.
  const collapsed = complete && !isRunning && !expanded;

  return (
    <section
      aria-label="Analysis pipeline"
      className="rounded-lg border border-border bg-surface p-4 shadow-e1"
    >
      {/* Header: one restrained line. */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">Pipeline</span>
          <span className="text-xs text-ink-muted">{statusWord}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="tnum font-mono text-xs text-ink-muted">
            {doneCount} / {total}
          </span>
          {totalElapsed != null && (
            <span className="tnum font-mono text-xs text-ink-muted">
              {fmtMs(totalElapsed)}
            </span>
          )}
        </div>
      </div>

      {collapsed ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-ink">
              <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3} />
            </span>
            <span>
              Pipeline complete
              <span className="mx-1.5 text-border-strong" aria-hidden="true">
                ·
              </span>
              {total} agents
              <span className="mx-1.5 text-border-strong" aria-hidden="true">
                ·
              </span>
              <span className="tnum font-mono">{fmtMs(totalElapsed)}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-accent-quiet hover:text-accent"
          >
            View run
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <PipelineRows rows={rows} />
      )}

      {/* progress is part of the contract; reflect it for assistive tech only. */}
      <span className="sr-only" role="status">
        {Math.round(progress)} percent complete.
      </span>
    </section>
  );
}
