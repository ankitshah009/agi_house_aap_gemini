"use client";

import { Radio } from "lucide-react";
import type { LensId, SignalAnalysis } from "@/lib/types";
import { LENSES } from "@/lib/lenses";

export default function InteractiveLensEngine({
  selectedSignal,
  activeLens,
  onLensSelect,
  reasoning = false,
}: {
  selectedSignal: SignalAnalysis;
  activeLens: "all" | LensId;
  onLensSelect: (l: "all" | LensId) => void;
  reasoning?: boolean;
}) {
  const allActive = activeLens === "all";

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-e1 lg:p-6">
      {/* Headline + subhead (Notion prose, no orb, no cosmic bg) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Same signal, different decisions
          </h2>
          <p className="max-w-xl text-base text-ink-muted">
            Every industry signal becomes role-specific intelligence for the people who have to act
            on it: advise clients, allocate budget, build products, and shape policy.
          </p>
        </div>

        {/* All four lenses toggle chip */}
        <button
          type="button"
          onClick={() => onLensSelect("all")}
          aria-pressed={allActive}
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
            allActive
              ? "border-accent bg-accent text-accent-ink hover:bg-accent-hover"
              : "border-border bg-surface text-ink-muted hover:bg-surface-2"
          }`}
        >
          <Radio
            className={`h-4 w-4 ${allActive ? "text-accent-ink" : "text-ink-faint"}`}
            aria-hidden="true"
          />
          <span>All four lenses</span>
        </button>
      </div>

      {/* The incoming signal */}
      <div className="mt-4 rounded-md border border-border bg-surface-2 p-3">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full bg-success ${reasoning ? "status-live" : ""}`}
            aria-hidden="true"
          />
          <span className="text-2xs text-ink-faint tnum">Signal · {selectedSignal.date}</span>
        </div>
        <p className="text-sm font-medium leading-snug text-ink">{selectedSignal.title}</p>
      </div>

      {/* Four lens lanes — clean rows */}
      <ul className="enter mt-4 space-y-2">
        {LENSES.map((lens) => {
          const isActive = activeLens === lens.id;
          const selected = allActive || isActive;
          return (
            <li key={lens.id}>
              <button
                type="button"
                onClick={() => onLensSelect(isActive ? "all" : lens.id)}
                aria-pressed={selected}
                className={`relative flex min-h-11 w-full items-start gap-3 overflow-hidden rounded-md border px-3 py-2.5 text-left transition-colors ${
                  selected
                    ? "border-border bg-accent-soft"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                {/* ≤2px accent left selection indicator */}
                {selected && (
                  <span
                    className="absolute inset-y-0 left-0 w-0.5 bg-accent"
                    aria-hidden="true"
                  />
                )}

                {/* 8px lens identity dot */}
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${lens.dotClass}`}
                  aria-hidden="true"
                />

                <span className="min-w-0 space-y-0.5">
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-semibold text-ink">{lens.role}</span>
                    <span className="text-xs text-ink-faint">{lens.deliverable}</span>
                  </span>
                  <span className="block text-sm text-ink-muted">{lens.voice}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Provenance byline — neutral, no colored chips */}
      <div className="mt-5 flex flex-col gap-1 border-t border-border pt-4 text-2xs text-ink-faint sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
        <span>
          Produced by <span className="font-medium text-ink-muted">Ada</span>, AI Intelligence
          Analyst.
        </span>
        <span>
          Reviewed by <span className="font-medium text-ink-muted">Rachel</span>, Editor in Chief.
        </span>
        <span>Sources available.</span>
      </div>
    </section>
  );
}
