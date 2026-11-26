import { resolveProviderApiKey } from "@/lib/ai/provider-key";
import { AIProvider } from "@/models/AIWorkforce";
import type { AIChatbotScope } from "@/models/AIChatbot";


export interface AICompletion {
  text: string;
  inputTokens: number;
  outputTokens: number;
  providerRequestId?: string;
  providerId?: string;
  model?: string;
  fallbackUsed?: boolean;
}

export async function runProviderCompletion(providerId: string, model: string, system: string, prompt: string, singleModelAttempt = false): Promise<AICompletion> {
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
  if (!singleModelAttempt) try {
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
  const candidates = (singleModelAttempt ? [model] : [model, ...preferred, ...discovered]).filter((id, index, all) => id && all.indexOf(id) === index).slice(0, singleModelAttempt ? 1 : 6);
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
function modelQualityScore(model: string): number {
  const id = model.toLowerCase();
  let score = 50;
  if (/opus|pro|o3|o1|gpt-4\.1(?!-mini|-nano)|gpt-4o(?!-mini)|gemini-2\.5-pro|gemini-3|sonnet-4/i.test(id)) score += 45;
  if (/sonnet|gpt-4|gemini-2\.5|deepseek-r1|qwen.*max/i.test(id)) score += 25;
  if (/flash|haiku|mini|nano|lite|small|fast/i.test(id)) score -= 18;
  if (/preview|experimental|latest/i.test(id)) score -= 4;
  return score;
}
async function discoverProviderModels(provider: any): Promise<string[]> {
  const key = resolveProviderApiKey(provider.name, provider.provider, provider.encryptedApiKey);
  const base = provider.provider === "google" ? "https://generativelanguage.googleapis.com/v1beta"
    : provider.provider === "openai" ? "https://api.openai.com/v1"
    : provider.provider === "anthropic" ? "https://api.anthropic.com/v1"
    : String(provider.baseUrl || "").replace(/\\/$/, "");
  const headers: Record<string, string> = provider.provider === "google" ? { "x-goog-api-key": key }
    : provider.provider === "anthropic" ? { "x-api-key": key, "anthropic-version": "2023-06-01" }
    : { Authorization: "Bearer " + key };
  const fallback = provider.provider === "google" ? ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"]
    : provider.provider === "anthropic" ? ["claude-opus-4-1", "claude-sonnet-4-5", "claude-3-5-haiku-latest"]
    : provider.provider === "openai" ? ["gpt-4.1", "o3", "gpt-4.1-mini", "gpt-4o-mini"]
    : [String(provider.lastTestedModel || "default")];
  try {
    const response = await fetch(base + "/models", { headers, signal: AbortSignal.timeout(3500), cache: "no-store" });
    if (!response.ok) return [...new Set([provider.lastTestedModel, ...fallback].filter(Boolean) as string[])];
    const body: any = await response.json().catch(() => ({}));
    const rows = Array.isArray(body.models) ? body.models : Array.isArray(body.data) ? body.data : [];
    const discovered = rows.map((row: any) => String(row.name || row.id || "").replace(/^models\\//, ""))
      .filter((id: string) => id && id.length < 120)
      .filter((id: string) => provider.provider === "google" ? /^gemini-/i.test(id) : provider.provider === "anthropic" ? /^claude-/i.test(id) : provider.provider === "openai" ? /^(gpt-|o[1-9]|chatgpt-)/i.test(id) : true);
    return [...new Set([provider.lastTestedModel, ...discovered, ...fallback].filter(Boolean) as string[])];
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
  const providers = await AIProvider.find({ enabled: true, lastTestStatus: "success", archivedAt: { $exists: false } }).select("+encryptedApiKey").lean();
  if (!providers.length) throw new Error("No active, connection-verified AI provider is available. AI employees remain enabled; add or enable a provider and retry this task.");
  const catalogues = await Promise.all(providers.map(async (provider: any) => ({ provider, models: await discoverProviderModels(provider) })));
  const candidates = catalogues.flatMap(({ provider, models }) => models.map((modelName) => ({ provider, modelName, score: modelQualityScore(modelName) })))
    .sort((a, b) => b.score - a.score || a.modelName.localeCompare(b.modelName));
  const seen = new Set<string>();
  const failures: string[] = [];
  let attempt = 0;
  for (const candidate of candidates) {
    const identity = String(candidate.provider._id) + ":" + candidate.modelName;
    if (seen.has(identity)) continue;
    seen.add(identity);
    attempt += 1;
    try {
      const result = await runProviderCompletion(String(candidate.provider._id), candidate.modelName, system, prompt, true);
      if (!result.text.trim()) throw new Error("Model returned an empty response.");
      return { ...result, providerId: String(candidate.provider._id), model: result.model || candidate.modelName, fallbackUsed: attempt > 1 };
    } catch (error) {
      failures.push(candidate.provider.name + "/" + candidate.modelName + ": " + (error instanceof Error ? error.message : "Model request failed."));
    }
  }
  throw new Error("Every globally ranked available AI model failed. " + failures.slice(0, 18).join(" | ").slice(0, 1800));
}
