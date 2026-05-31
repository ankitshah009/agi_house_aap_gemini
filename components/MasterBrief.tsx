"use client";

import { useId, useState } from "react";
import { ShieldCheck, Check, Minus, ArrowRight } from "lucide-react";
import type { MasterBrief as MasterBriefData, Confidence } from "@/lib/types";

// MasterBrief — the primary editorial read of the console (Agent 4) plus the Agent 2
// verification badge as a calm trust layer. NOT a hero-metric template: confidence is a
// small badge, never a giant centered figure. Reads like a Stripe/Notion document — one
// serif moment on the title, everything else one sans family, hairline rules, no stripes.

interface MasterBriefProps {
  brief: MasterBriefData;
  confidence?: Confidence;
}

// One labeled block of the four-part brief. Whitespace-led "document" rhythm.
function BriefBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-xs font-medium text-ink-muted">{label}</h3>
      <div className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-ink">
        {children}
      </div>
    </section>
  );
}

function YesNo({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        value ? "text-ink" : "text-ink-muted"
      }`}
    >
      {value ? (
        <Check className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
      ) : (
        <Minus className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
      )}
      {value ? "yes" : "no"}
    </span>
  );
}

// The 5-pip segmented confidence meter. Filled pips use --accent; the rest are neutral
// track. No ring, no hero number, no traffic-light gradient.
function ConfidencePips({ score }: { score: number }) {
  const filled = Math.round((Math.max(0, Math.min(100, score)) / 100) * 5);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-1.5 rounded-full transition-[background-color] duration-180 ${
            i < filled ? "bg-accent" : "bg-surface-2"
          }`}
        />
      ))}
    </span>
  );
}

function VerificationBadge({ confidence }: { confidence: Confidence }) {
  const [open, setOpen] = useState(false);
  const noteId = useId();
  const score = Math.round(confidence.score);
  const low = score < 50;
  const hasNote =
    Boolean(confidence.notes) || confidence.corroborationCount !== undefined;

  return (
    <div className="relative">
      <div
        className="flex flex-wrap items-stretch overflow-hidden rounded-md border border-border bg-surface shadow-e1 divide-x divide-border"
        // The whole cluster is the trust instrument; the trailing button is the only
        // interactive affordance (provenance disclosure).
      >
        {/* Persona micro-label — the verification trust mark. */}
        <span className="flex items-center gap-1.5 px-3 py-2 text-xs text-ink-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
          Verified by AAP
        </span>

        {/* Confidence pip-meter + value. */}
        <span className="flex items-center gap-2 px-3 py-2">
          <span className={`text-xs ${low ? "text-danger" : "text-ink-muted"}`}>
            Confidence
          </span>
          <ConfidencePips score={score} />
          <span className="tnum font-mono text-sm font-semibold text-ink">
            {score}
          </span>
        </span>

        {/* Primary source. */}
        <span className="flex items-center gap-2 px-3 py-2 text-xs">
          <span className="text-ink-muted">Primary source</span>
          <YesNo value={confidence.primarySource} />
        </span>

        {/* Independent confirmation. */}
        <span className="flex items-center gap-2 px-3 py-2 text-xs">
          <span className="text-ink-muted">Independent confirmation</span>
          <YesNo value={confidence.independentConfirmation} />
        </span>

        {hasNote && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={noteId}
            onClick={() => setOpen((v) => !v)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            className="flex min-h-11 items-center gap-1 px-3 text-xs font-medium text-accent-quiet hover:bg-accent-soft"
          >
            Provenance
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {hasNote && open && (
        <div
          id={noteId}
          role="note"
          className="enter absolute right-0 top-full z-10 mt-2 w-72 max-w-[80vw] rounded-md border border-border bg-surface p-3 text-xs leading-relaxed text-ink-muted shadow-pop"
        >
          {confidence.notes && <p className="text-ink">{confidence.notes}</p>}
          {confidence.corroborationCount !== undefined && (
            <p className="mt-1.5">
              <span className="tnum font-mono text-ink">
                {confidence.corroborationCount}
              </span>{" "}
              corroborating {confidence.corroborationCount === 1 ? "source" : "sources"}
              {confidence.tier ? ` · ${confidence.tier}` : ""}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MasterBrief({ brief, confidence }: MasterBriefProps) {
  const hasImplications = brief.keyImplications.length > 0;
  const hasWatch = brief.whatToWatch.length > 0;

  return (
    <article className="enter rounded-lg border border-border bg-surface p-6 shadow-e1 sm:p-8">
      <div className="space-y-8">
        {/* Header band: title + verification trust layer. Verification sits top-right on
            wide screens, stacks under the brief on narrow. */}
        {confidence && (
          <div className="flex justify-start lg:justify-end">
            <VerificationBadge confidence={confidence} />
          </div>
        )}

        {/* The four-part brief — single column, narrative order, no card grid. */}
        <div className="space-y-8">
          <BriefBlock label="What happened">
            {brief.whatHappened ? (
              <p>{brief.whatHappened}</p>
            ) : (
              <p className="text-ink-muted">Pending editorial.</p>
            )}
          </BriefBlock>

          <hr className="border-border" />

          <BriefBlock label="Why it matters">
            {brief.whyItMatters ? (
              <p>{brief.whyItMatters}</p>
            ) : (
              <p className="text-ink-muted">Pending editorial.</p>
            )}
          </BriefBlock>

          <hr className="border-border" />

          <BriefBlock label="Key implications">
            {hasImplications ? (
              <ul className="space-y-2">
                {brief.keyImplications.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <ArrowRight
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-faint"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-muted">Pending editorial.</p>
            )}
          </BriefBlock>

          <hr className="border-border" />

          <BriefBlock label="What to watch next">
            {hasWatch ? (
              <ul className="space-y-2">
                {brief.whatToWatch.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <ArrowRight
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-faint"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-muted">Pending editorial.</p>
            )}
          </BriefBlock>
        </div>
      </div>
    </article>
  );
}
