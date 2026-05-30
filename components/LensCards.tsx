"use client";

import { CheckCircle2, ArrowUpRight, FileText } from "lucide-react";
import type { PulseCard, LensId } from "@/lib/types";
import { LENS_BY_ID, withAlpha } from "@/lib/lenses";
import { LENS_ICON } from "./lensIcons";
import type { ReactNode } from "react";

const STEP_LABELS = ["NOW · 0–30d", "NEXT · 30–90d", "LATER · 90d+"];

function boldify(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="text-white font-bold">
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {visible.map((card, idx) => {
        const meta = LENS_BY_ID[card.lens];
        const Icon = LENS_ICON[card.lens];
        return (
          <article
            key={card.lens}
            className="animate-deal-in rounded-xl border bg-slate-900/30 p-5 pt-0 flex flex-col overflow-hidden"
            style={{
              animationDelay: `${idx * 70}ms`,
              borderColor: withAlpha(meta.color, 0.25),
              boxShadow: `0 0 20px ${withAlpha(meta.color, 0.06)}`,
            }}
          >
            <div className="h-0.5 -mx-5 mb-4" style={{ backgroundColor: meta.color }} />

            <div className="flex items-start justify-between gap-3 border-b border-slate-800/70 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="p-1.5 rounded-lg"
                  style={{ backgroundColor: withAlpha(meta.color, 0.12), color: meta.color }}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <div>
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest block font-bold"
                    style={{ color: meta.color }}
                  >
                    {meta.role}
                  </span>
                  <h3 className="font-sans font-extrabold text-sm text-white tracking-tight mt-0.5">
                    {card.title}
                  </h3>
                </div>
              </div>

              <div
                className="flex flex-col items-center px-2.5 py-1 rounded-lg border font-mono shrink-0"
                style={{
                  borderColor: withAlpha(meta.color, 0.3),
                  backgroundColor: withAlpha(meta.color, 0.08),
                  color: meta.color,
                }}
              >
                <span className="text-[7px] uppercase tracking-wider text-slate-400 leading-none text-center">
                  {card.scoreName}
                </span>
                <span className="text-xl font-black tracking-tighter leading-none mt-1 tabular-nums">
                  {card.score}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50 text-[11px] font-mono mb-3 text-slate-400 flex items-start gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: meta.color }} />
              <p>
                <span className="text-slate-300 font-bold uppercase tracking-wider">Perspective: </span>
                &ldquo;{card.voiceDescription}&rdquo;
              </p>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed mb-3 font-sans">{card.brief}</p>

            <ul className="space-y-2 mb-4">
              {card.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-normal">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{boldify(b)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-slate-800/60 pt-3 mt-auto">
              <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase block mb-2">
                Action Ladder · To-Ship
              </span>
              <div className="space-y-2">
                {card.actionSteps.slice(0, 3).map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 bg-slate-950/70 border border-slate-900 px-2.5 py-2 rounded-lg text-xs"
                  >
                    <span
                      className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 mt-0.5 whitespace-nowrap"
                      style={{ color: meta.color, backgroundColor: withAlpha(meta.color, 0.1) }}
                    >
                      {STEP_LABELS[i] ?? `STEP ${i + 1}`}
                    </span>
                    <span className="text-slate-200 font-sans leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono">
              <FileText className="w-3.5 h-3.5" style={{ color: meta.color }} />
              <span className="text-slate-500">Deliverable:</span>
              <span className="text-slate-300 font-semibold">{card.title}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
