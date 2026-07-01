import "server-only";
import type { NextRequest } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { serverEnv } from "./env";
import { checkRateLimit, clientIp, type RateLimitTier } from "./rateLimit";

export type GuardResult =
  | { ok: true; userId?: string }
  | { ok: false; response: Response };

/** Auth + rate-limit gate for API route handlers. Returns a 401/429 Response or null. */
export async function guardApi(req: NextRequest, tier: RateLimitTier): Promise<GuardResult> {
  let userId: string | undefined;

  if (serverEnv.workosEnabled) {
    try {
      const { user } = await withAuth();
      userId = user?.id;
      if (serverEnv.authRequired && !user) {
        return {
          ok: false,
          response: Response.json({ error: "Sign in required" }, { status: 401 }),
        };
      }
    } catch {
      if (serverEnv.authRequired) {
        return {
          ok: false,
          response: Response.json({ error: "Authentication unavailable" }, { status: 503 }),
        };
      }
    }
  }

  const key = userId ?? clientIp(req.headers);
  const rl = checkRateLimit({ key, tier, authenticated: Boolean(userId) });
  if (!rl.ok) {
    return {
      ok: false,
      response: Response.json(
        { error: "Rate limit exceeded. Try again shortly.", retryAfter: rl.retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.retryAfter),
            "X-RateLimit-Policy": tier,
          },
        },
      ),
    };
  }

  return { ok: true, userId };
}
