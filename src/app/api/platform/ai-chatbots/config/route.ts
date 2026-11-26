import { NextRequest, NextResponse } from "next/server";
import { type UpdateQuery } from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import { AIChatbotConfig, type IAIChatbotConfig, type AIChatbotScope } from "@/models/AIChatbot";
import { AIProvider } from "@/models/AIWorkforce";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const scopes: AIChatbotScope[] = ["public", "client", "admin"];
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
    AIProvider.find({ enabled: true, lastTestStatus: "success", archivedAt: { $exists: false } })
      .select("name provider lastTestedModel lastTestedAt").sort({ lastTestedAt: -1 }).lean(),
    AIChatbotConfig.find({}).sort({ scope: 1 }).lean(),
  ]);
  return NextResponse.json({
    providers: providers.map(provider => ({ id: String(provider._id), name: provider.name, provider: provider.provider, lastTestedModel: provider.lastTestedModel || "" })),
    providerRouting: "global-ranked",
    configs: configs.map(config => ({ scope: config.scope, enabled: config.enabled, welcomeMessage: config.welcomeMessage })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function PUT(request: NextRequest) {
  const auth = await founder();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null) as null | Record<string, unknown>;
  if (!body || !Array.isArray(body.configs) || body.configs.length !== 3) {
    return NextResponse.json({ message: "Configure exactly the public, client and admin assistants." }, { status: 400 });
  }
  await connectToDatabase();
  const provider = await AIProvider.findOne({ enabled: true, lastTestStatus: "success", archivedAt: { $exists: false } }).sort({ lastTestedAt: -1 }).lean();
  const seen = new Set<string>();
  const results: Array<Record<string, unknown>> = [];
  for (const raw of body.configs) {
    if (!raw || typeof raw !== "object") return NextResponse.json({ message: "Invalid assistant configuration." }, { status: 400 });
    const item = raw as Record<string, unknown>;
    const scope = String(item.scope || "") as AIChatbotScope;
    const enabled = item.enabled === true;
    const welcomeMessage = String(item.welcomeMessage || "").trim();
    if (!scopes.includes(scope) || seen.has(scope) || welcomeMessage.length < 1 || welcomeMessage.length > 300) {
      return NextResponse.json({ message: "Each assistant requires a unique audience, an enabled setting and a welcome message under 300 characters." }, { status: 400 });
    }
    seen.add(scope);
    const existing = await AIChatbotConfig.findOne({ scope }).lean();
    const selectedProvider = provider || (existing ? await AIProvider.findOne({ _id: existing.providerId, lastTestStatus: "success", archivedAt: { $exists: false } }).lean() : null);
    if (enabled && !selectedProvider) return NextResponse.json({ message: "No enabled, live-tested provider is available. Run a successful live-generation test in AI Workforce first." }, { status: 409 });
    if (!selectedProvider) continue;
    const setFields: NonNullable<UpdateQuery<IAIChatbotConfig>["$set"]> = {
      scope, providerId: selectedProvider._id, modelName: selectedProvider.lastTestedModel || "auto",
      fallbacks: [], enabled, welcomeMessage, updatedBy: auth.session.user._id,
    };
    const update: UpdateQuery<IAIChatbotConfig> = { $set: setFields, $unset: { fallbackProviderId: 1, fallbackModelName: 1 } };
    const saved = await AIChatbotConfig.findOneAndUpdate(
      { scope }, update, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).orFail();
    results.push({ scope: saved.scope, enabled: saved.enabled, welcomeMessage: saved.welcomeMessage });
  }
  if (seen.size !== 3) return NextResponse.json({ message: "All three assistant audiences must be included exactly once." }, { status: 400 });
  await writePlatformAuditEvent({
    actorType: "human", actorId: String(auth.session.user._id), actorLabel: auth.session.user.name,
    action: "ai.chatbots.configuration_updated", module: "ai-chatbots", targetType: "AIChatbotConfig", outcome: "success",
    metadata: { scopes: results.map(item => item.scope), enabled: results.filter(item => item.enabled).map(item => item.scope), providerRouting: "global-ranked" },
  });
  return NextResponse.json({ configs: results, message: "Assistant audiences saved. Every enabled assistant uses the shared global-ranked provider pool; provider and model selection are automatic." });
}
