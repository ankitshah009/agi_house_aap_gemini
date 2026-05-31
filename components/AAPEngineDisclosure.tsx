"use client";

import { useState } from "react";
import { ShieldCheck, CheckCircle, ExternalLink } from "lucide-react";
import type { Source } from "@/lib/types";

// The trust mechanism: Ada produces, Rachel reviews, sources are available,
// evolving into Aubric-verified provenance as Aubric ships (matches the strategy doc).
const TRUST_PHASES = [
  {
    id: "today" as const,
    tab: "Today",
    title: "Phase 1: Current Ingestion Moat",
    badge: "Live pipeline",
    formula: "Produced by Ada. Reviewed by Rachel. Sources available.",
    desc: "Confidence built through transparent source listing. Manual review by the Editor-in-Chief prevents downstream hallucination.",
  },
  {
    id: "future" as const,
    tab: "Future",
    title: "Phase 2: Near-Future Hardening",
    badge: "Upcoming",
    formula: "Produced by Ada. Reviewed by Rachel. Provenance provided by Aubric.",
    desc: "Cryptographic trace anchors register original content provenance on a ledger before publishing, protecting brand integrity.",
  },
  {
    id: "later" as const,
    tab: "Later",
    title: "Phase 3: Deep Verification Standard",
    badge: "Vision",
    formula: "Produced by Ada. Reviewed by Rachel. Sources verified by Aubric.",
    desc: "Autonomous deep-watermark scanning runs real-time credibility checks, deployed once machine confidence clears the bar.",
  },
];

export default function AAPEngineDisclosure({
  sources,
  provenanceHash,
}: {
  sources: Source[];
  provenanceHash: string;
}) {
  const [phase, setPhase] = useState<"today" | "future" | "later">("today");
  const current = TRUST_PHASES.find((p) => p.id === phase)!;

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-e1">
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-ink-muted" />
          <div>
            <h4 className="text-base font-bold leading-tight tracking-tight text-gradient">AAP Engine trust registry</h4>
            <p className="text-xs text-ink-muted">
              Provenance and cryptographic integrity stamp.
            </p>
          </div>
        </div>
        <p className="font-mono text-xs text-ink-muted">
          Hash: <span className="text-ink tnum">{provenanceHash.slice(0, 18)}…</span>
        </p>
      </div>

      <div className="mt-4">
        <h5 className="mb-2 text-sm font-bold leading-tight tracking-tight text-ink">Aubric trust progression</h5>

        {/* Linear-style under-tab: active = text-ink + 2px accent underline indicator */}
        <div
          role="tablist"
          aria-label="Trust progression phase"
          className="flex items-center gap-4 border-b border-border"
        >
          {TRUST_PHASES.map((p) => {
            const active = phase === p.id;
            return (
              <button
                key={p.id}
                role="tab"
                aria-selected={active}
                onClick={() => setPhase(p.id)}
                className={`relative -mb-px flex min-h-11 items-center text-sm transition-colors ${
                  active ? "text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                {p.tab}
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">{current.title}</span>
            <span className="text-2xs text-ink-muted">{current.badge}</span>
          </div>

          {/* Formula box: bg-surface-2, NO colored left stripe */}
          <div className="rounded-md border border-border bg-surface-2 p-3 font-mono text-xs text-ink">
            {current.formula}
          </div>

          <p className="text-sm leading-relaxed text-ink-muted">{current.desc}</p>
        </div>
      </div>

      <div className="mt-4 pt-1">
        <h5 className="mb-2 text-sm font-bold leading-tight tracking-tight text-ink">
          Verified ingested sources{" "}
          <span className="text-2xs text-ink-faint tnum">({sources.length})</span>
        </h5>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {sources.map((src, idx) => {
            const isLink = !src.url.startsWith("#");
            return (
              <a
                key={idx}
                href={isLink ? src.url : undefined}
                target={isLink ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={`flex min-h-11 items-center justify-between gap-2 rounded-md border border-border px-3 text-xs transition-colors ${
                  isLink
                    ? "bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink"
                    : "cursor-default bg-surface-2 text-ink-muted"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                  <span className="truncate font-medium">{src.title}</span>
                </span>
                {isLink && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-faint" />}
              </a>
            );
          })}
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs leading-normal text-ink-muted">
          This disclosure confirms traceable provenance on the AAP Engine, protecting downstream
          consumers against generative drift.
        </p>
      </div>
    </div>
  );
}
