import { resolveProviderApiKey } from "@/lib/ai/provider-key";
import { AIProvider } from "@/models/AIWorkforce";
import type { AIChatbotScope } from "@/models/AIChatbot";
import { randomUUID } from "node:crypto";
import { connectToDatabase } from "@/lib/db";
import AIExecutionLog from "@/models/AIExecutionLog";


export interface AICompletion {
  text: string;
  inputTokens: number;
  outputTokens: number;
  providerRequestId?: string;
  providerId?: string;
  model?: string;
  fallbackUsed?: boolean;
}

export async function runProviderCompletion(providerId: string, model: string, system: string, prompt: string, singleModelAttempt = false, timeoutMs = 11000): Promise<AICompletion> {
  const provider = providerId === "__gemini_environment__"
    ? { name: "Gemini environment provider", provider: "google", encryptedApiKey: "", enabled: true, lastTestStatus: "success", archivedAt: undefined, baseUrl: "" }
    : await AIProvider.findById(providerId).select("+encryptedApiKey");
  if (!provider || !provider.enabled || provider.lastTestStatus !== "success" || provider.archivedAt) throw new Error("AI provider is not enabled and connection-verified.");
  const key = resolveProviderApiKey(provider.name, provider.provider, provider.encryptedApiKey);
  const base = provider.provider === "google" ? "https://generativelanguage.googleapis.com/v1beta" : provider.provider === "openai" ? "https://api.openai.com/v1" : provider.provider === "anthropic" ? "https://api.anthropic.com/v1" : String(provider.baseUrl || "").replace(/\/$/, "");
  const headers: Record<string, string> = provider.provider === "google"
    ? { "Content-Type": "application/json", "x-goog-api-key": key }
    : provider.provider === "anthropic"
      ? { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }
      : { "Content-Type": "application/json", Authorization: "Bearer " + key };
  const preferred = provider.provider === "google"
    ? ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"]
    : provider.provider === "anthropic"
      ? ["claude-3-5-haiku-latest", "claude-3-7-sonnet-latest", "claude-sonnet-4-5"]
      : provider.provider === "openai"
        ? ["gpt-4.1-mini", "gpt-4o-mini", "gpt-4.1-nano"]
        : [model || "default"];
  const discovered: string[] = [];
  if (!singleModelAttempt) try {
    const catalogueUrl = provider.provider === "google" ? base + "/models" : base + "/models";
    const catalogueResponse = await fetch(catalogueUrl, { headers: provider.provider === "google" ? { "x-goog-api-key": key } : provider.provider === "anthropic" ? { "x-api-key": key, "anthropic-version": "2023-06-01" } : { Authorization: "Bearer " + key }, signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (catalogueResponse.ok) {
      const catalogue = await catalogueResponse.json().catch(() => ({}));
      const rows = Array.isArray(catalogue.models) ? catalogue.models : Array.isArray(catalogue.data) ? catalogue.data : [];
      for (const row of rows) {
        const id = String(row.name || row.id || "").replace(/^models\//, "");
        if (!id || id.length > 120) continue;
        if (provider.provider === "google" && !/^gemini-/i.test(id)) continue;
        if (provider.provider === "openai" && !/^(gpt-|o[1-9]|chatgpt-)/i.test(id)) continue;
        if (provider.provider === "anthropic" && !/^claude-/i.test(id)) continue;
        discovered.push(id);
      }
    }
  } catch { /* Use known model fallbacks when catalogue discovery is unavailable. */ }
  const candidates = (singleModelAttempt ? [model] : [model, ...preferred, ...discovered]).filter((id, index, all) => id && all.indexOf(id) === index).slice(0, singleModelAttempt ? 1 : 6);
  const failures: string[] = [];
  for (const candidate of candidates) {
    try {
      let response: Response;
      let data: any;
      if (provider.provider === "google") {
        const interactionInput = [system.trim() ? "SYSTEM INSTRUCTIONS:\n" + system.trim() : "", "USER REQUEST:\n" + prompt].filter(Boolean).join("\n\n");
        response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", { method: "POST", headers, signal: AbortSignal.timeout(Math.min(15000, timeoutMs)), cache: "no-store", body: JSON.stringify({ model: candidate.replace(/^models\//, ""), input: interactionInput, store: false }) });
        data = await response.json().catch(() => ({}));
        if (response.ok) {
          const text = Array.isArray(data.steps) ? data.steps.filter((step: any) => step.type === "model_output").flatMap((step: any) => step.content || []).filter((part: any) => part.type === "text").map((part: any) => part.text || "").join("") : String(data.output_text || "");
          if (text.trim()) return { text, inputTokens: Number(data.usage?.total_input_tokens || data.usage?.input_tokens || 0), outputTokens: Number(data.usage?.total_output_tokens || data.usage?.output_tokens || 0), providerRequestId: data.id, model: candidate, fallbackUsed: candidate !== model };
        }
      } else if (provider.provider === "anthropic") {
        response = await fetch(base + "/messages", { method: "POST", headers, signal: AbortSignal.timeout(timeoutMs), cache: "no-store", body: JSON.stringify({ model: candidate, system, max_tokens: 4096, temperature: 0.2, messages: [{ role: "user", content: prompt }] }) });
        data = await response.json().catch(() => ({}));
        if (response.ok) {
          const text = (data.content || []).filter((part: { type?: string }) => part.type === "text").map((part: { text?: string }) => part.text || "").join("");
          if (text.trim()) return { text, inputTokens: Number(data.usage?.input_tokens || 0), outputTokens: Number(data.usage?.output_tokens || 0), providerRequestId: data.id, model: candidate, fallbackUsed: candidate !== model };
        }
      } else {
        response = await fetch(base + "/chat/completions", { method: "POST", headers, signal: AbortSignal.timeout(timeoutMs), cache: "no-store", body: JSON.stringify({ model: candidate, temperature: 0.2, max_tokens: 4096, messages: [{ role: "system", content: system }, { role: "user", content: prompt }] }) });
        data = await response.json().catch(() => ({}));
        if (response.ok) {
          const text = String(data.choices?.[0]?.message?.content || "");
          if (text.trim()) return { text, inputTokens: Number(data.usage?.prompt_tokens || 0), outputTokens: Number(data.usage?.completion_tokens || 0), providerRequestId: data.id, model: candidate, fallbackUsed: candidate !== model };
        }
      }
      const message = String(data?.error?.message || data?.message || "Provider returned no completion.").slice(0, 260);
      failures.push(candidate + " (HTTP " + response.status + "): " + message);
      if ([401, 403].includes(response.status)) break;
    } catch (error) {
      failures.push(candidate + ": " + (error instanceof Error ? error.message : "Request failed."));
    }
  }
  throw new Error("All available models for provider " + provider.name + " failed. " + failures.join(" | ").slice(0, 1400));
}

/**
 * Routes every TGO AI completion through one globally ranked list of
 * live-verified provider/model pairs. Agent identity and memory remain TGO-owned;
 * no agent is pinned to a provider. Attempts share one bounded request budget.
 */
function modelQualityScore(model: string): number {
  const id = model.toLowerCase();
  let score = 50;
  if (/opus|pro|o3|o1|gpt-4\.1(?!-mini|-nano)|gpt-4o(?!-mini)|gemini-3\.1-pro|gemini-3\.8|gemini-3\.7|sonnet-4/i.test(id)) score += 45;
  if (/sonnet|gpt-4|gemini-3\.1-pro|gemini-3\.8|gemini-3\.7|deepseek-r1|qwen.*max/i.test(id)) score += 25;
  if (/flash|haiku|mini|nano|lite|small|fast/i.test(id)) score -= 18;
  if (/preview|experimental|latest/i.test(id)) score -= 4;
  return score;
}
async function discoverProviderModels(provider: any): Promise<string[]> {
  const base = provider.provider === "google" ? "https://generativelanguage.googleapis.com/v1beta"
    : provider.provider === "openai" ? "https://api.openai.com/v1"
    : provider.provider === "anthropic" ? "https://api.anthropic.com/v1"
    : String(provider.baseUrl || "").replace(/\/$/, "");
  let key = "";
  try { key = resolveProviderApiKey(provider.name, provider.provider, provider.encryptedApiKey); }
  catch { return []; }
  const headers: Record<string, string> = provider.provider === "google" ? { "x-goog-api-key": key }
    : provider.provider === "anthropic" ? { "x-api-key": key, "anthropic-version": "2023-06-01" }
    : { Authorization: "Bearer " + key };
  const fallback = provider.provider === "google" ? ["gemini-3.1-pro-preview", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash-lite"]
    : provider.provider === "anthropic" ? ["claude-opus-4-1", "claude-sonnet-4-5", "claude-3-5-haiku-latest"]
    : provider.provider === "openai" ? ["gpt-4.1", "o3", "gpt-4.1-mini", "gpt-4o-mini"]
    : [String(provider.lastTestedModel || "default")];
  try {
    const response = await fetch(base + "/models", { headers, signal: AbortSignal.timeout(3500), cache: "no-store" });
    if (!response.ok) return [...new Set([provider.lastTestedModel, ...fallback].filter(Boolean) as string[])].filter((id) => !(provider.provider === "google" && /^gemini-2\.5-pro(?:-|$)/i.test(id)));
    const body: any = await response.json().catch(() => ({}));
    const rows = Array.isArray(body.models) ? body.models : Array.isArray(body.data) ? body.data : [];
    const discovered = rows.map((row: any) => String(row.name || row.id || "").replace(/^models\//, ""))
      .filter((id: string) => id && id.length < 120)
      .filter((id: string) => !(provider.provider === "google" && /^gemini-2\.5-pro(?:-|$)/i.test(id)))
      .filter((id: string) => provider.provider === "google" ? /^gemini-/i.test(id) : provider.provider === "anthropic" ? /^claude-/i.test(id) : provider.provider === "openai" ? /^(gpt-|o[1-9]|chatgpt-)/i.test(id) : true);
    return [...new Set([provider.lastTestedModel, ...discovered, ...fallback].filter(Boolean) as string[])].filter((id) => !(provider.provider === "google" && /^gemini-2\.5-pro(?:-|$)/i.test(id)));
  } catch {
    return [...new Set([provider.lastTestedModel, ...fallback].filter(Boolean) as string[])];
  }
}

/** TGO-wide model router: one global ranking across every verified provider/model. */
export async function runProviderCompletionWithFallback(
  _providerId: string,
  _model: string,
  system: string,
  prompt: string,
  _scope: AIChatbotScope = "admin",
): Promise<AICompletion> {
  await connectToDatabase();
  const traceId = randomUUID();
  const storedProviders: any[] = await AIProvider.find({}).select("+encryptedApiKey").lean();
  // Mongoose legacy rows can store archivedAt as null. `$exists:false` would
  // silently exclude those valid, unarchived providers from the global pool.
  const providers: any[] = storedProviders.filter((provider) =>
    provider.enabled === true && provider.lastTestStatus === "success" && !provider.archivedAt
  );
  // The founder can explicitly import/test GEMINI_API_KEY in Vercel without
  // relying on a database provider row being enabled on every deployment.
  // Keep it as a final, provider-independent fallback; never expose the key.
  const environmentGeminiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || "";
  if (!providers.some((provider) => provider.provider === "google")) {
    console.warn("[TGO AI] Google provider inventory", {
      environmentKeyConfigured: Boolean(environmentGeminiKey),
      storedGoogleProviders: storedProviders.filter((provider) => provider.provider === "google").map((provider) => ({ enabled: provider.enabled === true, liveTestPassed: provider.lastTestStatus === "success", archived: Boolean(provider.archivedAt), disabled: Boolean(provider.disabledAt), encryptedCredentialPresent: Boolean(provider.encryptedApiKey) })),
    });
  }
  if (environmentGeminiKey) providers.push({
    _id: "__gemini_environment__", name: "Gemini environment provider", provider: "google",
    encryptedApiKey: "", enabled: true, lastTestStatus: "success", lastTestedModel: "gemini-3.1-pro-preview",
  });
  if (!providers.length) throw new Error("No active, connection-verified AI provider is available. AI employees remain enabled; add or enable a provider and retry this task.");
  const failures: string[] = [];
  const catalogues = await Promise.all(providers.map(async (provider: any) => ({ provider, models: await discoverProviderModels(provider) })));
  for (const catalogue of catalogues) {
    if (catalogue.models.length) continue;
    const message = catalogue.provider.name + ": provider credentials could not be resolved or no model candidates were discovered.";
    failures.push(message);
    await AIExecutionLog.create({ traceId, feature: "ai_model_discovery", providerId: String(catalogue.provider._id), providerName: catalogue.provider.name, providerType: catalogue.provider.provider, model: "model-discovery", status: "failure", errorCode: "model_discovery_unavailable", errorMessage: message }).catch(() => undefined);
  }
  const candidates = catalogues.flatMap(({ provider, models }) => models.map((modelName) => ({ provider, modelName, score: modelQualityScore(modelName) })))
    .sort((a, b) => b.score - a.score || a.modelName.localeCompare(b.modelName));
  const seen = new Set<string>();
  let attempt = 0;
  const routingDeadline = Date.now() + 42000;
  const maximumAttempts = 8;
  for (const candidate of candidates) {
    if (attempt >= maximumAttempts || routingDeadline - Date.now() < 1800) break;
    const identity = String(candidate.provider._id) + ":" + candidate.modelName;
    if (seen.has(identity)) continue;
    seen.add(identity);
    attempt += 1;
    const startedAt = Date.now();
    try {
      const result = await runProviderCompletion(String(candidate.provider._id), candidate.modelName, system, prompt, true, Math.min(9000, routingDeadline - Date.now()));
      if (!result.text.trim()) throw new Error("Model returned an empty response.");
      await AIExecutionLog.create({ traceId, feature: "ai_completion", ...(String(candidate.provider._id) === "__gemini_environment__" ? {} : { providerId: String(candidate.provider._id) }), providerName: candidate.provider.name, providerType: candidate.provider.provider, model: candidate.modelName, status: attempt > 1 ? "fallback" : "success", durationMs: Date.now() - startedAt, inputTokens: result.inputTokens, outputTokens: result.outputTokens, fallbackFrom: attempt > 1 ? failures[failures.length - 1]?.slice(0, 300) : undefined }).catch(() => undefined);
      return { ...result, providerId: String(candidate.provider._id), model: result.model || candidate.modelName, fallbackUsed: attempt > 1 };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Model request failed.";
      const match = message.match(/HTTP\s+(\d{3})/i);
      const httpStatus = match ? Number(match[1]) : undefined;
      const errorCode = httpStatus === 429 ? "rate_limit" : httpStatus === 401 || httpStatus === 403 ? "authentication_or_permission" : httpStatus && httpStatus >= 500 ? "provider_server_error" : /timeout|abort/i.test(message) ? "timeout" : "model_unavailable_or_request_failed";
      failures.push(candidate.provider.name + "/" + candidate.modelName + ": " + message);
      await AIExecutionLog.create({ traceId, feature: "ai_completion", ...(String(candidate.provider._id) === "__gemini_environment__" ? {} : { providerId: String(candidate.provider._id) }), providerName: candidate.provider.name, providerType: candidate.provider.provider, model: candidate.modelName, status: "failure", durationMs: Date.now() - startedAt, httpStatus, errorCode, errorMessage: message.slice(0, 1900) }).catch(() => undefined);
    }
  }
  const reason = failures.length ? failures.slice(0, 8).join(" | ").slice(0, 1500) : "The global model routing time budget was exhausted before another candidate could be attempted.";
  throw new Error("Every attempted globally ranked AI model failed or the routing time budget expired. " + reason);
}
