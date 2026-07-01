import "server-only";

/** Per-route cost tiers — tuned for Gemini quota + abuse prevention. */
export type RateLimitTier = "pulse" | "infographic" | "ada" | "speech" | "health";

type Window = { count: number; resetAt: number };

const store = new Map<string, Window>();

/** Limits per minute (short window) and per day (long window). */
const LIMITS: Record<
  RateLimitTier,
  { anon: { minute: number; day: number }; auth: { minute: number; day: number } }
> = {
  pulse: { anon: { minute: 2, day: 8 }, auth: { minute: 6, day: 40 } },
  infographic: { anon: { minute: 2, day: 6 }, auth: { minute: 5, day: 24 } },
  ada: { anon: { minute: 4, day: 30 }, auth: { minute: 15, day: 120 } },
  speech: { anon: { minute: 3, day: 20 }, auth: { minute: 10, day: 80 } },
  health: { anon: { minute: 120, day: 10_000 }, auth: { minute: 120, day: 10_000 } },
};

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

function bump(key: string, windowMs: number, limit: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const bucketKey = `${key}:${windowMs}`;
  const cur = store.get(bucketKey);
  if (!cur || now >= cur.resetAt) {
    store.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (cur.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)) };
  }
  cur.count += 1;
  return { ok: true, retryAfter: 0 };
}

// Opportunistic prune so the in-memory map does not grow without bound.
function prune() {
  if (store.size < 500) return;
  const now = Date.now();
  for (const [k, v] of store) {
    if (now >= v.resetAt) store.delete(k);
  }
}

export function checkRateLimit(opts: {
  key: string;
  tier: RateLimitTier;
  authenticated: boolean;
}): { ok: boolean; retryAfter: number; remainingMinute?: number } {
  if (opts.tier === "health") return { ok: true, retryAfter: 0 };

  const limits = LIMITS[opts.tier][opts.authenticated ? "auth" : "anon"];
  const base = `${opts.tier}:${opts.key}`;

  const minute = bump(base, MINUTE_MS, limits.minute);
  if (!minute.ok) return minute;

  const day = bump(base, DAY_MS, limits.day);
  if (!day.ok) return day;

  prune();
  return { ok: true, retryAfter: 0, remainingMinute: limits.minute };
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
