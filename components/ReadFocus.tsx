"use client";

import { ArrowRight, Star } from "lucide-react";
import type { DailyBrief, LensId, SignalAnalysis } from "@/lib/types";
import { LENS_BY_ID } from "@/lib/lenses";
import type { Persona } from "./PersonaSelector";

// How relevant a signal is to the reader: their lens's score, or overall Pulse Score
// when no persona is chosen.
function relevance(signal: SignalAnalysis, persona: Persona): number {
  if (persona === "all") return signal.pulseScore?.composite ?? signal.hypeCheckScore;
  const card = signal.cards.find((c) => c.lens === persona);
  return card?.score ?? signal.pulseScore?.composite ?? signal.hypeCheckScore;
}

function leadLens(signal: SignalAnalysis, persona: Persona): LensId {
  if (persona !== "all") return persona;
  if (!signal.cards.length) return "strategist";
  return signal.cards.reduce((a, b) => (b.score > a.score ? b : a)).lens;
}

// Read mode opens with this: all three of today's stories combined and ranked for the
// reader, so they know where to focus before diving into one full breakdown.
export default function ReadFocus({
  brief,
  persona,
  selectedId,
  onSelect,
}: {
  brief: DailyBrief;
  persona: Persona;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const ranked = [...brief.signals.slice(0, 3)].sort(
    (a, b) => relevance(b, persona) - relevance(a, persona),
  );
  const role = persona === "all" ? null : LENS_BY_ID[persona].role;

  return (
    <section
      className="enter rounded-lg border border-border bg-surface p-5 card-depth"
      aria-label="Where to focus today"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <h2 className="text-xl font-bold leading-tight tracking-tight text-gradient">Where to focus today</h2>
        <span className="text-2xs text-ink-faint">
          Ranked by {role ? `${role} relevance` : "Pulse Score"}
        </span>
      </div>
      <p className="text-xs text-ink-muted mb-4">
        {role
          ? `Reordered for ${role}. Start at the top, open any story for the full breakdown below.`
          : "All three of today's stories, ranked. Pick one to read in full below."}
      </p>

      <ol className="space-y-2">
        {ranked.map((s, i) => {
          const on = s.id === selectedId;
          const score = Math.round(relevance(s, persona));
          const why = s.masterBrief?.whyItMatters ?? s.summary;
          const lead = leadLens(s, persona);
          return (
            <li key={s.id}>
              <button
                onClick={() => onSelect(s.id)}
                aria-pressed={on}
                className={`w-full text-left rounded-lg border px-3.5 py-3 transition-colors duration-fast ${
                  on ? "border-accent bg-accent-soft" : "border-border bg-surface-2 hover:border-border-strong"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`shrink-0 mt-0.5 flex items-center justify-center w-6 h-6 rounded-md text-2xs font-semibold ${
                      i === 0 ? "bg-accent text-accent-ink" : "bg-surface border border-border text-ink-muted"
                    }`}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${LENS_BY_ID[lead].dotClass}`} aria-hidden="true" />
                      <h3 className="text-sm font-semibold text-ink leading-snug">{s.title}</h3>
                      {i === 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-2xs font-medium text-accent-quiet">
                          <Star className="h-3 w-3" aria-hidden="true" /> Start here
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted leading-relaxed line-clamp-2">{why}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-base font-semibold text-ink tnum leading-none">{score}</div>
                    <div className="mt-1 inline-flex items-center gap-1 text-2xs text-accent-quiet">
                      {on ? "Reading" : "Open"} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
