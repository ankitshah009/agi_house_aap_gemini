"use client";

import { useState } from "react";
import { ShieldCheck, CheckCircle, ExternalLink, Layers, Info } from "lucide-react";
import type { Source } from "@/lib/types";

// The trust mechanism: Ada produces, Rachel reviews, sources are available —
// evolving into Aubric-verified provenance as Aubric ships (matches the strategy doc).
const TRUST_PHASES = [
  {
    id: "today" as const,
    tab: "Today",
    title: "Phase 1 · Current Ingestion Moat",
    badge: "LIVE PIPELINE",
    formula: "Produced by Ada · Reviewed by Rachel · Sources available",
    desc: "Confidence built through transparent source listing. Manual review by the Editor-in-Chief prevents downstream hallucination.",
  },
  {
    id: "future" as const,
    tab: "Future",
    title: "Phase 2 · Near-Future Hardening",
    badge: "UPCOMING",
    formula: "Produced by Ada · Reviewed by Rachel · Provenance provided by Aubric",
    desc: "Cryptographic trace anchors register original content provenance on a ledger before publishing, protecting brand integrity.",
  },
  {
    id: "later" as const,
    tab: "Later",
    title: "Phase 3 · Deep Verification Standard",
    badge: "VISION",
    formula: "Produced by Ada · Reviewed by Rachel · Sources verified by Aubric",
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
    <div className="rounded-xl border border-teal-500/20 bg-teal-950/10 p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4 relative">
        <div className="flex items-center gap-2">
          <span className="bg-teal-500/10 text-teal-400 p-1.5 rounded-lg border border-teal-500/20">
            <ShieldCheck className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-mono font-bold tracking-widest text-teal-400 uppercase">
              AAP Engine · Trust Registry
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              Provenance verified · cryptographic integrity stamp
            </p>
          </div>
        </div>
        <div className="text-[11px] font-mono text-slate-500 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800 h-fit">
          Hash: <span className="text-teal-500">{provenanceHash.slice(0, 18)}…</span>
        </div>
      </div>

      <div className="mb-4">
        <span className="text-[10px] font-mono tracking-widest text-slate-400 block mb-2 font-black uppercase">
          Aubric Trust Progression
        </span>
        <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800 mb-3">
          {TRUST_PHASES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPhase(p.id)}
              className={`py-1.5 px-1 rounded text-[10px] font-mono uppercase tracking-tight transition-all text-center ${
                phase === p.id
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              {p.tab}
            </button>
          ))}
        </div>
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-teal-400 font-bold">{current.title}</span>
            <span className="bg-teal-500/10 text-[9px] px-1.5 py-0.5 rounded border border-teal-500/20 text-teal-400 tracking-wider">
              {current.badge}
            </span>
          </div>
          <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-900 border-l-2 border-l-teal-500 text-xs font-mono font-bold text-slate-200">
            &ldquo;{current.formula}&rdquo;
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">{current.desc}</p>
        </div>
      </div>

      <div className="pt-1">
        <h5 className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mb-2 flex items-center gap-1">
          <Layers className="w-3 h-3 text-slate-500" />
          Verified Ingested Sources ({sources.length})
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sources.map((src, idx) => {
            const isLink = !src.url.startsWith("#");
            return (
              <a
                key={idx}
                href={isLink ? src.url : undefined}
                target={isLink ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={`flex items-center justify-between p-2.5 rounded-lg text-xs leading-none transition-all ${
                  isLink
                    ? "bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white"
                    : "bg-slate-900/40 border border-slate-800 cursor-default"
                }`}
              >
                <div className="flex items-center gap-2 max-w-[85%]">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  <span className="truncate font-sans font-medium">{src.title}</span>
                </div>
                {isLink && <ExternalLink className="w-3 h-3 text-slate-400" />}
              </a>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-start gap-1.5 text-[10px] text-slate-500 leading-normal">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p>
          This disclosure confirms traceable provenance on the AAP Engine, protecting downstream
          consumers against generative drift.
        </p>
      </div>
    </div>
  );
}
