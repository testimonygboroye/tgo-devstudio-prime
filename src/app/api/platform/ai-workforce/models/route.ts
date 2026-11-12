import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import { AIProvider } from "@/models/AIWorkforce";
import { decryptProviderSecret } from "@/lib/ai/provider-secrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ModelOption = { id: string; displayName: string };

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.role?.isFounderRole) {
    return NextResponse.json({ error: "Founder access required." }, { status: 403 });
  }

  const providerId = request.nextUrl.searchParams.get("providerId") || "";
  if (!/^[a-f0-9]{24}$/i.test(providerId)) {
    return NextResponse.json({ error: "Choose a valid AI provider." }, { status: 400 });
  }

  await connectToDatabase();
  const provider = await AIProvider.findById(providerId).select("+encryptedApiKey");
  if (!provider || !provider.enabled || provider.lastTestStatus !== "success") {
    return NextResponse.json({ error: "Enable and successfully test this provider before loading its models." }, { status: 409 });
  }

  const key = decryptProviderSecret(provider.encryptedApiKey);
  const base = provider.provider === "google"
    ? "https://generativelanguage.googleapis.com/v1beta/models"
    : provider.provider === "anthropic"
      ? "https://api.anthropic.com/v1/models?limit=1000"
      : (provider.provider === "openai" ? "https://api.openai.com/v1" : String(provider.baseUrl || "").replace(/\/$/, "")) + "/models";
  const headers: Record<string, string> = provider.provider === "google"
    ? { "x-goog-api-key": key }
    : provider.provider === "anthropic"
      ? { "x-api-key": key, "anthropic-version": "2023-06-01" }
      : { Authorization: "Bearer " + key };

  try {
    const response = await fetch(base, { headers, cache: "no-store", signal: AbortSignal.timeout(15000) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ error: "Provider model catalogue request failed (" + response.status + "). Verify the API key and provider account." }, { status: 502 });
    }

    let models: ModelOption[] = [];
    if (provider.provider === "google") {
      models = (Array.isArray(payload.models) ? payload.models : [])
        .filter((item: any) => Array.isArray(item.supportedGenerationMethods) && item.supportedGenerationMethods.includes("generateContent"))
        .map((item: any) => ({ id: String(item.name || "").replace(/^models\//, ""), displayName: String(item.displayName || item.name || "") }));
    } else {
      models = (Array.isArray(payload.data) ? payload.data : [])
        .map((item: any) => ({ id: String(item.id || ""), displayName: String(item.display_name || item.id || "") }));
    }

    models = models.filter((item) => item.id && /^[a-zA-Z0-9._:-]+$/.test(item.id));
    models.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return NextResponse.json({ models }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not reach the provider model catalogue. Try again shortly." }, { status: 502 });
  }
}
