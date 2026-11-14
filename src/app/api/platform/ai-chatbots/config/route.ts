import { NextRequest, NextResponse } from "next/server";
import mongoose, { type UpdateQuery } from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import { AIChatbotConfig, type IAIChatbotConfig, type AIChatbotScope } from "@/models/AIChatbot";
import { AIProvider } from "@/models/AIWorkforce";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MODEL_PATTERN = /^[a-zA-Z0-9._:-]+$/;
async function founder() {
  const session = await getServerSession();
  if (!session) return { response: NextResponse.json({ message: "Authentication required." }, { status: 401 }) } as const;
  if (!session.role?.isFounderRole) return { response: NextResponse.json({ message: "Founder access required." }, { status: 403 }) } as const;
  return { session } as const;
}
export async function GET() {
  const auth = await founder();
  if ("response" in auth) return auth.response;
  await connectToDatabase();
  const [providers, configs] = await Promise.all([
    AIProvider.find({ enabled: true, lastTestStatus: "success" }).select("name provider").sort({ name: 1 }).lean(),
    AIChatbotConfig.find({}).sort({ scope: 1 }).lean(),
  ]);
  const normalizedConfigs = configs.map((config) => ({
    ...config,
    fallbacks: Array.isArray(config.fallbacks) && config.fallbacks.length
      ? config.fallbacks
      : config.fallbackProviderId && config.fallbackModelName
        ? [{ providerId: config.fallbackProviderId, modelName: config.fallbackModelName }]
        : [],
  }));
  return NextResponse.json({ providers, configs: normalizedConfigs }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function PUT(request: NextRequest) {
  const auth = await founder();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null) as null | Record<string, unknown>;
  if (!body || !Array.isArray(body.configs) || body.configs.length !== 3) {
    return NextResponse.json({ message: "Configure exactly the public, client and admin assistants." }, { status: 400 });
  }
  await connectToDatabase();
  const scopes: AIChatbotScope[] = ["public", "client", "admin"];
  const results: Array<Record<string, unknown>> = [];
  const seenScopes = new Set<string>();
  for (const raw of body.configs) {
    if (!raw || typeof raw !== "object") return NextResponse.json({ message: "Invalid chatbot configuration." }, { status: 400 });
    const item = raw as Record<string, unknown>;
    const scope = String(item.scope || "") as AIChatbotScope;
    const providerId = String(item.providerId || "");
    const modelName = String(item.modelName || "").trim();
    const welcomeMessage = String(item.welcomeMessage || "").trim();
    if (!scopes.includes(scope) || seenScopes.has(scope) || !mongoose.isValidObjectId(providerId) || !modelName || !MODEL_PATTERN.test(modelName) || modelName.length > 120 || welcomeMessage.length > 300) {
      return NextResponse.json({ message: "A unique assistant scope, verified provider, catalogue model and short welcome message are required." }, { status: 400 });
    }
    seenScopes.add(scope);
    const provider = await AIProvider.findOne({ _id: providerId, enabled: true, lastTestStatus: "success" });
    if (!provider) return NextResponse.json({ message: "Every chatbot must use an enabled, successfully tested primary provider." }, { status: 409 });

    const rawFallbacks = Array.isArray(item.fallbacks) ? item.fallbacks : (
      item.fallbackProviderId && item.fallbackModelName
        ? [{ providerId: item.fallbackProviderId, modelName: item.fallbackModelName }]
        : []
    );
    if (rawFallbacks.length > 5) return NextResponse.json({ message: "Configure no more than five ordered fallback providers." }, { status: 400 });
    const fallbackIds = new Set<string>([providerId]);
    const fallbacks: Array<{ providerId: mongoose.Types.ObjectId; modelName: string }> = [];
    for (const rawFallback of rawFallbacks) {
      if (!rawFallback || typeof rawFallback !== "object") return NextResponse.json({ message: "Invalid fallback entry." }, { status: 400 });
      const fallback = rawFallback as Record<string, unknown>;
      const fallbackProviderId = String(fallback.providerId || "");
      const fallbackModelName = String(fallback.modelName || "").trim();
      if (!mongoose.isValidObjectId(fallbackProviderId) || fallbackIds.has(fallbackProviderId) || !fallbackModelName || !MODEL_PATTERN.test(fallbackModelName) || fallbackModelName.length > 120) {
        return NextResponse.json({ message: "Each fallback must be a different provider with a valid model identifier." }, { status: 400 });
      }
      const fallbackProvider = await AIProvider.findOne({ _id: fallbackProviderId, enabled: true, lastTestStatus: "success" });
      if (!fallbackProvider) return NextResponse.json({ message: "Every fallback provider must be enabled and connection-verified." }, { status: 409 });
      fallbackIds.add(fallbackProviderId);
      fallbacks.push({ providerId: fallbackProvider._id, modelName: fallbackModelName });
    }

    const setFields: NonNullable<UpdateQuery<IAIChatbotConfig>["$set"]> = {
      scope, providerId: provider._id, modelName, fallbacks, enabled: item.enabled === true,
      welcomeMessage, updatedBy: auth.session.user._id,
    };
    const update: UpdateQuery<IAIChatbotConfig> = {
      $set: setFields,
      $unset: { fallbackProviderId: 1, fallbackModelName: 1 },
    };
    const saved = await AIChatbotConfig.findOneAndUpdate(
      { scope }, update, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).orFail();
    results.push({
      scope: saved.scope, providerId: String(saved.providerId), modelName: saved.modelName,
      fallbacks: (saved.fallbacks || []).map((fallback) => ({ providerId: String(fallback.providerId), modelName: fallback.modelName })),
      enabled: saved.enabled, welcomeMessage: saved.welcomeMessage,
    });
  }
  if (seenScopes.size !== 3) return NextResponse.json({ message: "All public, client and admin assistant scopes must be included exactly once." }, { status: 400 });
  await writePlatformAuditEvent({
    actorType: "human", actorId: String(auth.session.user._id), actorLabel: auth.session.user.name,
    action: "ai.chatbots.configuration_updated", module: "ai-chatbots", targetType: "AIChatbotConfig", outcome: "success",
    metadata: { scopes: results.map(x => x.scope), enabled: results.filter(x => x.enabled).map(x => x.scope), fallbackCounts: results.map(x => ({ scope: x.scope, count: (x.fallbacks as unknown[]).length })) },
  });
  return NextResponse.json({ configs: results, message: "Chatbot settings saved. Each assistant has an ordered, independently verified fallback chain and retains its own conversation and account boundary." });
}
