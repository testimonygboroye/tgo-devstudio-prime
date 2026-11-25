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
  if (!provider || !provider.enabled || provider.lastTestStatus !== "success") throw new Error("AI provider is not enabled and connection-verified.");
  const key = resolveProviderApiKey(provider.name, provider.provider, provider.encryptedApiKey);
  // Keep each provider attempt below the 50-second Hobby function ceiling so fallback providers can run.
  const timeout = AbortSignal.timeout(14000);
  if (provider.provider === "google") {
    const catalogueResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models", { headers: { "x-goog-api-key": key }, signal: timeout, cache: "no-store" });
    const catalogue = await catalogueResponse.json().catch(() => ({}));
    if (!catalogueResponse.ok) throw new Error("Gemini model catalogue failed (" + catalogueResponse.status + "): " + String(catalogue?.error?.message || "Provider error").slice(0, 400));
    const available = (Array.isArray(catalogue.models) ? catalogue.models : [])
      .filter((item: any) => Array.isArray(item.supportedGenerationMethods) && item.supportedGenerationMethods.includes("generateContent"))
      .map((item: any) => String(item.name || "").replace(/^models\//, ""))
      .filter((id: string) => /^gemini-/i.test(id));
    const preferred = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    const candidates = [model, ...preferred.filter((id) => id !== model && available.includes(id)), ...available.filter((id: string) => id !== model && !preferred.includes(id))].filter((id, index, all) => id && all.indexOf(id) === index).slice(0, 4);
    const failures: string[] = [];
    for (const candidate of candidates) {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(candidate) + ":generateContent";
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, signal: AbortSignal.timeout(14000), cache: "no-store", body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 4096, temperature: 0.2 } }) });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const text = (data.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("");
        if (text.trim()) return { text, inputTokens: Number(data.usageMetadata?.promptTokenCount || 0), outputTokens: Number(data.usageMetadata?.candidatesTokenCount || 0), model: candidate, fallbackUsed: candidate !== model };
      }
      const message = String(data?.error?.message || "Provider error").slice(0, 300);
      failures.push(candidate + " (HTTP " + response.status + "): " + message);
      if (![404, 429, 500, 502, 503, 504].includes(response.status)) break;
    }
    throw new Error("Gemini generation failed across available models. " + failures.join(" | ").slice(0, 1200));
  }
  if (provider.provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, signal: timeout, cache: "no-store", body: JSON.stringify({ model, system, max_tokens: 4096, temperature: 0.2, messages: [{ role: "user", content: prompt }] }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error("Anthropic request failed (" + response.status + "): " + String(data?.error?.message || "Provider error").slice(0, 500));
    return { text: (data.content || []).filter((p: { type?: string }) => p.type === "text").map((p: { text?: string }) => p.text || "").join(""), inputTokens: Number(data.usage?.input_tokens || 0), outputTokens: Number(data.usage?.output_tokens || 0), providerRequestId: data.id };
  }
  const base = provider.provider === "openai" ? "https://api.openai.com/v1" : String(provider.baseUrl || "").replace(/\/$/, "");
  const response = await fetch(base + "/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key }, signal: timeout, cache: "no-store", body: JSON.stringify({ model, temperature: 0.2, max_tokens: 4096, messages: [{ role: "system", content: system }, { role: "user", content: prompt }] }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("OpenAI-compatible completion failed (" + response.status + "): " + String(data?.error?.message || "Provider error").slice(0, 500));
  return { text: String(data.choices?.[0]?.message?.content || ""), inputTokens: Number(data.usage?.prompt_tokens || 0), outputTokens: Number(data.usage?.completion_tokens || 0), providerRequestId: data.id };
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
  const attempts = buildProviderAttempts(providerId, model, config);
  const failures: string[] = [];
  let attemptsTried = 0;
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
