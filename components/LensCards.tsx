"use client";

import { CheckCircle2, FileText } from "lucide-react";
import type { PulseCard, LensId } from "@/lib/types";
import { LENS_BY_ID } from "@/lib/lenses";
import { LENS_ICON } from "./lensIcons";
import type { ReactNode } from "react";

const STEP_LABELS = ["Now", "Next", "Later"];

// Per-lens color identity. Color here is FUNCTIONAL (which role's decision this is),
// so each card wears its lens hue: tinted header, colored icon tile, colored score.
// Static class strings so Tailwind v4 generates the token + opacity utilities.
const LENS_STYLE: Record<
  LensId,
  { headerBg: string; text: string; border: string; iconBg: string }
> = {
  strategist: {
    headerBg: "bg-lens-strategist/10",
    text: "text-lens-strategist",
    border: "border-lens-strategist/35",
    iconBg: "bg-lens-strategist/15",
  },
  executive: {
    headerBg: "bg-lens-executive/10",
    text: "text-lens-executive",
    border: "border-lens-executive/35",
    iconBg: "bg-lens-executive/15",
  },
  gtm: {
    headerBg: "bg-lens-gtm/10",
    text: "text-lens-gtm",
    border: "border-lens-gtm/35",
    iconBg: "bg-lens-gtm/15",
  },
  policy: {
    headerBg: "bg-lens-policy/10",
    text: "text-lens-policy",
    border: "border-lens-policy/35",
    iconBg: "bg-lens-policy/15",
  },
};

function boldify(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-ink">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export default function LensCards({
  cards,
  activeLens = "all",
}: {
  cards: PulseCard[];
  activeLens?: "all" | LensId;
}) {
  const visible = activeLens === "all" ? cards : cards.filter((c) => c.lens === activeLens);

  return (
    <div className="flex flex-col gap-4">
      {visible.map((card) => {
        const meta = LENS_BY_ID[card.lens];
        const Icon = LENS_ICON[card.lens];
        const s = LENS_STYLE[card.lens];
        return (
          <article
            key={card.lens}
            className={`enter flex flex-col overflow-hidden rounded-lg border ${s.border} bg-surface shadow-e1`}
          >
            {/* Colored identity header */}
            <header className={`flex items-start justify-between gap-3 border-b ${s.border} ${s.headerBg} px-4 py-3`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-md ${s.iconBg} ${s.text} shrink-0`}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className={`text-sm font-semibold ${s.text}`}>{meta.role}</div>
                  <div className="text-2xs text-ink-muted">{card.title}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-2xl font-semibold tnum leading-none ${s.text}`}>
                  {card.score}
                </div>
                <div className="text-2xs text-ink-faint mt-1">{card.scoreName}</div>
              </div>
            </header>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-3 p-4">
              <p className="text-sm italic text-ink-muted leading-snug">{card.voiceDescription}</p>
              <p className="text-sm text-ink leading-relaxed">{card.brief}</p>

              <ul className="space-y-1.5">
                {card.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink leading-snug">
                    <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${s.text}`} aria-hidden="true" />
                    <span>{boldify(b)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto space-y-1.5 pt-1">
                {card.actionSteps.slice(0, 3).map((step, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-md bg-surface-2 px-2.5 py-1.5">
                    <span className={`w-9 shrink-0 text-2xs font-semibold ${s.text}`}>
                      {STEP_LABELS[i] ?? `#${i + 1}`}
                    </span>
                    <span className="text-xs text-ink leading-snug">{step}</span>
                  </div>
                ))}
              </div>

              <div className="mt-1 flex items-center gap-1.5 border-t border-border pt-2.5 text-xs">
                <FileText className={`h-3.5 w-3.5 ${s.text}`} aria-hidden="true" />
                <span className="text-ink-faint">Deliverable:</span>
                <span className="font-medium text-ink">{card.title}</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
