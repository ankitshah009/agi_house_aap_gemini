import type { Metadata } from "next";
import BrandHeader from "@/components/BrandHeader";
import DailyPulse from "@/components/daily/DailyPulse";
import { buildAllDailyViews, DAILY_MOVERS } from "@/lib/dailyBrief";
import { CURATED_SIGNALS } from "@/lib/data";
import { viewFromAnalysis } from "@/lib/pulseSignal";
import type { SignalAnalysis } from "@/lib/types";

export const metadata: Metadata = {
  title: "The Daily Pulse — Ad AI Pulse",
  description:
    "Today's three biggest AdTech + AI moves, synthesized across four lenses, played four ways — a visual Pulse Card, a Rachel voice brief, a video brief, and a detailed read. Produced by Ada · Reviewed by Rachel.",
};

export default function DailyPage() {
  // One intelligence source, prebuilt for instant switching:
  //  • dailyViews — per-lens synthesis + the 3 movers (Pulse / Voice / Video / header).
  //  • signalViews — the 3 movers as full single-signal views (the Detailed breakdown).
  // Ankit's live scouting engine swaps the inputs to buildAllDailyViews()/DAILY_MOVERS later.
  const dailyViews = buildAllDailyViews();
  const byId: Record<string, SignalAnalysis> = Object.fromEntries(
    CURATED_SIGNALS.map((s) => [s.id, s]),
  );
  const signalViews = DAILY_MOVERS.map((m) => byId[m.signalId])
    .filter((s): s is SignalAnalysis => Boolean(s))
    .map(viewFromAnalysis);

  return (
    <main className="min-h-screen bg-slate-950">
      <BrandHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <DailyPulse dailyViews={dailyViews} signalViews={signalViews} />
      </div>
    </main>
  );
}
