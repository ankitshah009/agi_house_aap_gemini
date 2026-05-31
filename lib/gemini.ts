import "server-only";
import { serverEnv } from "./env";

export interface GeminiInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

// Fetch a Gemini endpoint, trying each configured key in order (primary, then backup).
// Fails over to the next key on auth/quota errors (401/403/429) or a network throw, so a
// rate-limited or revoked primary key does not break the app mid-demo. Non-key errors
// (400/404/5xx) and successes are returned as-is for the caller to handle.
export async function geminiFetch(url: string, init: GeminiInit = {}): Promise<Response> {
  const keys = serverEnv.geminiApiKeys;
  if (keys.length === 0) throw new Error("GEMINI_API_KEY missing");

  let keyFailRes: Response | null = null;
  let lastErr: unknown = null;

  for (let i = 0; i < keys.length; i++) {
    const isLast = i === keys.length - 1;
    try {
      const res = await fetch(url, {
        method: init.method ?? "POST",
        headers: { ...(init.headers ?? {}), "x-goog-api-key": keys[i] },
        body: init.body,
        signal: init.signal,
      });
      if ((res.status === 401 || res.status === 403 || res.status === 429) && !isLast) {
        keyFailRes = res;
        continue; // key problem, try the backup
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (!isLast) continue; // network problem, try the backup
      throw e;
    }
  }

  if (keyFailRes) return keyFailRes;
  throw lastErr ?? new Error("geminiFetch: all keys failed");
}
