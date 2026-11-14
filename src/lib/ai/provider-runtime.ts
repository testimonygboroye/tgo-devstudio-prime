import { decryptProviderSecret } from "@/lib/ai/provider-secrets";
import { AIProvider } from "@/models/AIWorkforce";
import { AIChatbotConfig, type AIChatbotScope } from "@/models/AIChatbot";

export interface AICompletion {
  text: string;
  inputTokens: number;
  outputTokens: number;
  providerRequestId?: string;
}

export async function runProviderCompletion(providerId: string, model: string, system: string, prompt: string): Promise<AICompletion> {
  const provider = await AIProvider.findById(providerId).select("+encryptedApiKey");
  if (!provider || !provider.enabled || provider.lastTestStatus !== "success") throw new Error("AI provider is not enabled and connection-verified.");
  const key = decryptProviderSecret(provider.encryptedApiKey);
  const timeout = AbortSignal.timeout(60000);
  if (provider.provider === "google") {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent";
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, signal: timeout, cache: "no-store", body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 4096, temperature: 0.2 } }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error("Gemini request failed (" + response.status + "): " + String(data?.error?.message || "Provider error").slice(0, 500));
    return { text: (data.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join(""), inputTokens: Number(data.usageMetadata?.promptTokenCount || 0), outputTokens: Number(data.usageMetadata?.candidatesTokenCount || 0) };
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
  const config = await AIChatbotConfig.findOne({ scope, enabled: true }).lean();
  const configured = [
    ...(config?.providerId && config?.modelName ? [{ providerId: String(config.providerId), modelName: config.modelName }] : []),
    ...((config?.fallbacks || []).map((item) => ({ providerId: String(item.providerId), modelName: item.modelName }))),
    ...(config?.fallbacks?.length ? [] : (config?.fallbackProviderId && config?.fallbackModelName
      ? [{ providerId: String(config.fallbackProviderId), modelName: config.fallbackModelName }]
      : [])),
  ];
  const attempts = [{ providerId, modelName: model }, ...configured];
  const visited = new Set<string>();
  const failures: string[] = [];
  for (const attempt of attempts) {
    const key = attempt.providerId;
    if (!attempt.providerId || !attempt.modelName || visited.has(key)) continue;
    visited.add(key);
    try {
      const result = await runProviderCompletion(attempt.providerId, attempt.modelName, system, prompt);
      if (!result.text.trim()) throw new Error("Provider returned an empty response.");
      return result;
    } catch (error) {
      failures.push(attempt.providerId + "/" + attempt.modelName + ": " + (error instanceof Error ? error.message : "Provider request failed."));
    }
  }
  throw new Error("All configured AI providers failed. " + failures.join(" | ").slice(0, 1800));
}
