import "server-only";
import { createHash } from "node:crypto";

type Entry = { dataUrl: string; expiresAt: number };

const cache = new Map<string, Entry>();
const TTL_MS = Number(process.env.IMAGE_CACHE_TTL_MS ?? 86_400_000); // 24h default

export function imageCacheKey(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

export function getCachedImage(key: string): string | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.dataUrl;
}

export function setCachedImage(key: string, dataUrl: string): void {
  cache.set(key, { dataUrl, expiresAt: Date.now() + TTL_MS });
  if (cache.size > 200) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
}
