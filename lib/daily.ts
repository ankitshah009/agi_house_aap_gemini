import { CURATED_SIGNALS } from "./data";
import type { DailyBrief } from "./types";

// Today's Pulse: the top signals of the day, ranked by Pulse Score. Curated-real for
// demo reliability; Signal Scout produces this live (agent mode) from lib/sources.ts.
export const TODAY: DailyBrief = {
  date: "Today",
  headline: "Today in AdTech and AI",
  signals: [...CURATED_SIGNALS].sort(
    (a, b) =>
      (b.pulseScore?.composite ?? b.hypeCheckScore) -
      (a.pulseScore?.composite ?? a.hypeCheckScore),
  ),
};
