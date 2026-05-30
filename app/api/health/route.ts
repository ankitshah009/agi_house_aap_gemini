import { hasGeminiKey, serverEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stage pre-flight: confirm the key is present without ever echoing it.
export async function GET() {
  return Response.json({
    status: "ok",
    hasApiKey: hasGeminiKey(),
    fastModel: serverEnv.fastModel,
    forceCache: serverEnv.forceCache,
    defaultMode: serverEnv.defaultMode,
    timestamp: new Date().toISOString(),
  });
}
