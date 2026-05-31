"use client";

import { Users } from "lucide-react";
import { LENSES } from "@/lib/lenses";
import type { LensId } from "@/lib/types";

// Who the reader is. The four personas are the four lenses; "all" = no tailoring.
export type Persona = "all" | LensId;

const CHIP: Record<LensId, string> = {
  strategist: "border-lens-strategist/50 bg-lens-strategist/10 text-lens-strategist",
  executive: "border-lens-executive/50 bg-lens-executive/10 text-lens-executive",
  gtm: "border-lens-gtm/50 bg-lens-gtm/10 text-lens-gtm",
  policy: "border-lens-policy/50 bg-lens-policy/10 text-lens-policy",
};

export default function PersonaSelector({
  persona,
  onPersona,
}: {
  persona: Persona;
  onPersona: (p: Persona) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Choose your role">
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted shrink-0">
        <Users className="h-3.5 w-3.5" aria-hidden="true" /> I am a
      </span>
      <button
        onClick={() => onPersona("all")}
        aria-pressed={persona === "all"}
        className={`min-h-9 rounded-full border px-3 text-xs font-medium transition-colors duration-fast ${
          persona === "all"
            ? "border-accent bg-accent text-accent-ink"
            : "border-border bg-surface text-ink-muted hover:text-ink"
        }`}
      >
        Everyone
      </button>
      {LENSES.map((l) => {
        const on = persona === l.id;
        return (
          <button
            key={l.id}
            onClick={() => onPersona(l.id)}
            aria-pressed={on}
            className={`min-h-9 inline-flex items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-fast ${
              on ? CHIP[l.id] : "border-border bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${l.dotClass}`} aria-hidden="true" />
            {l.role}
          </button>
        );
      })}
    </div>
  );
}
