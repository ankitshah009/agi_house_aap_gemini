import { hasGeminiKey, serverEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stage pre-flight: confirm the key is present without ever echoing it.
export async function GET() {
  return Response.json({
    status: "ok",
    hasApiKey: hasGeminiKey(),
    fastModel: serverEnv.fastModel,
    imageModel: serverEnv.imageModel,
    forceCache: serverEnv.forceCache,
    defaultMode: serverEnv.defaultMode,
    authEnabled: serverEnv.workosEnabled,
    authRequired: serverEnv.authRequired,
    timestamp: new Date().toISOString(),
  });
}
