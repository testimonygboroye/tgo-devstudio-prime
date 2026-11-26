import { resolveProviderApiKey } from "@/lib/ai/provider-key";
import { AIProvider } from "@/models/AIWorkforce";
import { AIChatbotConfig, type AIChatbotScope } from "@/models/AIChatbot";
import { buildProviderAttempts } from "@/lib/ai/provider-attempts";


export interface AICompletion {
  text: string;
  inputTokens: number;
  outputTokens: number;
  providerRequestId?: string;
  providerId?: string;
  model?: string;
  fallbackUsed?: boolean;
}

export async function runProviderCompletion(providerId: string, model: string, system: string, prompt: string): Promise<AICompletion> {
  const provider = await AIProvider.findById(providerId).select("+encryptedApiKey");
  if (!provider || !provider.enabled || provider.lastTestStatus !== "success" || provider.archivedAt) throw new Error("AI provider is not enabled and connection-verified.");
  const key = resolveProviderApiKey(provider.name, provider.provider, provider.encryptedApiKey);
  const base = provider.provider === "google" ? "https://generativelanguage.googleapis.com/v1beta" : provider.provider === "openai" ? "https://api.openai.com/v1" : provider.provider === "anthropic" ? "https://api.anthropic.com/v1" : String(provider.baseUrl || "").replace(/\\/$/, "");
  const headers: Record<string, string> = provider.provider === "google"
    ? { "Content-Type": "application/json", "x-goog-api-key": key }
    : provider.provider === "anthropic"
      ? { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }
      : { "Content-Type": "application/json", Authorization: "Bearer " + key };
  const preferred = provider.provider === "google"
    ? ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    : provider.provider === "anthropic"
      ? ["claude-3-5-haiku-latest", "claude-3-7-sonnet-latest", "claude-sonnet-4-5"]
      : provider.provider === "openai"
        ? ["gpt-4.1-mini", "gpt-4o-mini", "gpt-4.1-nano"]
        : [model || "default"];
  const discovered: string[] = [];
  try {
    const catalogueUrl = provider.provider === "google" ? base + "/models" : base + "/models";
    const catalogueResponse = await fetch(catalogueUrl, { headers: provider.provider === "google" ? { "x-goog-api-key": key } : provider.provider === "anthropic" ? { "x-api-key": key, "anthropic-version": "2023-06-01" } : { Authorization: "Bearer " + key }, signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (catalogueResponse.ok) {
      const catalogue = await catalogueResponse.json().catch(() => ({}));
      const rows = Array.isArray(catalogue.models) ? catalogue.models : Array.isArray(catalogue.data) ? catalogue.data : [];
      for (const row of rows) {
        const id = String(row.name || row.id || "").replace(/^models\\//, "");
        if (!id || id.length > 120) continue;
        if (provider.provider === "google" && (!Array.isArray(row.supportedGenerationMethods) || !row.supportedGenerationMethods.includes("generateContent") || !/^gemini-/i.test(id))) continue;
        if (provider.provider === "openai" && !/^(gpt-|o[1-9]|chatgpt-)/i.test(id)) continue;
        if (provider.provider === "anthropic" && !/^claude-/i.test(id)) continue;
        discovered.push(id);
      }
    }
  } catch { /* Use known model fallbacks when catalogue discovery is unavailable. */ }
  const candidates = [model, ...preferred, ...discovered].filter((id, index, all) => id && all.indexOf(id) === index).slice(0, 6);
  const failures: string[] = [];
  for (const candidate of candidates) {
    try {
      let response: Response;
      let data: any;
      if (provider.provider === "google") {
        response = await fetch(base + "/models/" + encodeURIComponent(candidate) + ":generateContent", { method: "POST", headers, signal: AbortSignal.timeout(9000), cache: "no-store", body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 4096, temperature: 0.2 } }) });
        data = await response.json().catch(() => ({}));
        if (response.ok) {
          const text = (data.candidates?.[0]?.content?.parts || []).map((part: { text?: string }) => part.text || "").join("");
          if (text.trim()) return { text, inputTokens: Number(data.usageMetadata?.promptTokenCount || 0), outputTokens: Number(data.usageMetadata?.candidatesTokenCount || 0), model: candidate, fallbackUsed: candidate !== model };
        }
      } else if (provider.provider === "anthropic") {
        response = await fetch(base + "/messages", { method: "POST", headers, signal: AbortSignal.timeout(11000), cache: "no-store", body: JSON.stringify({ model: candidate, system, max_tokens: 4096, temperature: 0.2, messages: [{ role: "user", content: prompt }] }) });
        data = await response.json().catch(() => ({}));
        if (response.ok) {
          const text = (data.content || []).filter((part: { type?: string }) => part.type === "text").map((part: { text?: string }) => part.text || "").join("");
          if (text.trim()) return { text, inputTokens: Number(data.usage?.input_tokens || 0), outputTokens: Number(data.usage?.output_tokens || 0), providerRequestId: data.id, model: candidate, fallbackUsed: candidate !== model };
        }
      } else {
        response = await fetch(base + "/chat/completions", { method: "POST", headers, signal: AbortSignal.timeout(11000), cache: "no-store", body: JSON.stringify({ model: candidate, temperature: 0.2, max_tokens: 4096, messages: [{ role: "system", content: system }, { role: "user", content: prompt }] }) });
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
 * Runs an internal AI workflow through the founder-governed admin assistant
 * fallback chain. The agent's own provider/model always gets the first attempt;
 * the admin assistant's configured primary and ordered fallbacks are then used
 * as eligible alternatives, without duplicating the same provider.
 */
export async function runProviderCompletionWithFallback(
  providerId: string,
  model: string,
  system: string,
  prompt: string,
  scope: AIChatbotScope = "admin",
): Promise<AICompletion> {
  const config = await AIChatbotConfig.findOne({ scope }).lean();
  // AI employees belong to TGO, not to an inference vendor. A legacy providerId is
  // intentionally not treated as a binding: any healthy, verified TGO provider can run any agent.
  const configuredAttempts = buildProviderAttempts("", "", config);
  const configuredIds = new Set(configuredAttempts.map((attempt) => attempt.providerId));
  const availableProviders = await AIProvider.find({
    enabled: true,
    lastTestStatus: "success",
    archivedAt: { $exists: false },
  }).select("_id provider lastTestedModel updatedAt").sort({ updatedAt: -1 }).lean();
  const providerModels: Record<string, string> = {
    google: "gemini-2.5-flash",
    openai: "gpt-4.1-mini",
    anthropic: "claude-3-5-haiku-latest",
    "openai-compatible": "default",
  };
  const attempts = [
    ...configuredAttempts.filter((attempt) => availableProviders.some((provider) => String(provider._id) === attempt.providerId)),
    ...availableProviders
      .filter((provider) => !configuredIds.has(String(provider._id)))
      .map((provider) => ({
        providerId: String(provider._id),
        modelName: String(provider.lastTestedModel || providerModels[provider.provider] || model || ""),
      })),
  ];
  const failures: string[] = [];
  let attemptsTried = 0;
  if (!attempts.length) throw new Error("No active, connection-verified AI provider is available. AI employees remain enabled; add or enable a provider and retry this task.");
  for (const attempt of attempts) {
    attemptsTried += 1;
    try {
      const result = await runProviderCompletion(attempt.providerId, attempt.modelName, system, prompt);
      if (!result.text.trim()) throw new Error("Provider returned an empty response.");
      return { ...result, providerId: attempt.providerId, model: result.model || attempt.modelName, fallbackUsed: Boolean(result.fallbackUsed || attemptsTried > 1) };
    } catch (error) {
      failures.push(attempt.providerId + "/" + attempt.modelName + ": " + (error instanceof Error ? error.message : "Provider request failed."));
    }
  }
  throw new Error("All configured AI providers failed. " + failures.join(" | ").slice(0, 1800));
}
