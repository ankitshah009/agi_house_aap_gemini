"use client";

import { useCallback, useRef, useState } from "react";
import type { AgentEvent, EngineMode, SignalAnalysis, StatusEvent } from "@/lib/types";

export type Phase = "idle" | "reasoning" | "done";

export interface PulseRunPayload {
  signalId?: string;
  signal?: string;
  mode: EngineMode;
}

export interface StatusLine {
  stage: string;
  label: string;
  pct?: number;
  lens?: string;
}

export function usePulseStream(initial: SignalAnalysis) {
  const [phase, setPhase] = useState<Phase>("done");
  const [log, setLog] = useState<StatusLine[]>([]);
  const [progress, setProgress] = useState(100);
  const [analysis, setAnalysis] = useState<SignalAnalysis>(initial);
  const [source, setSource] = useState<EngineMode>("cached");
  const [fallback, setFallback] = useState<string | null>(null);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (payload: PulseRunPayload) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setPhase("reasoning");
    setLog([]);
    setProgress(0);
    setFallback(null);
    setAgentEvents([]);

    try {
      const res = await fetch("/api/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          let ev: StatusEvent;
          try {
            ev = JSON.parse(line) as StatusEvent;
          } catch {
            continue;
          }
          if (ev.type === "status") {
            setLog((l) => [...l, { stage: ev.stage, label: ev.label, pct: ev.pct, lens: ev.lens }]);
            if (typeof ev.pct === "number") setProgress(ev.pct);
          } else if (ev.type === "agent") {
            const aev = ev;
            setAgentEvents((a) => [...a, aev]);
            if (typeof aev.pct === "number") setProgress(aev.pct);
          } else if (ev.type === "result") {
            setAnalysis(ev.analysis);
          } else if (ev.type === "fallback") {
            setFallback(ev.reason);
          } else if (ev.type === "done") {
            setSource(ev.source);
            setProgress(100);
            setPhase("done");
          }
        }
      }
    } catch (e) {
      if ((e as { name?: string })?.name !== "AbortError") {
        setProgress(100);
        setPhase("done");
      }
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setPhase("done");
    setProgress(100);
  }, []);

  // Display an already-computed analysis instantly (no network) — e.g. a cached
  // fixture or a previously-run custom signal.
  const show = useCallback((a: SignalAnalysis) => {
    abortRef.current?.abort();
    setAnalysis(a);
    setSource("cached");
    setFallback(null);
    setLog([]);
    setProgress(100);
    setPhase("done");
  }, []);

  return { phase, log, progress, analysis, source, fallback, agentEvents, run, cancel, show };
}
