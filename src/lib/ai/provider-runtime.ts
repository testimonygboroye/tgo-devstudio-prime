import { decryptProviderSecret } from "@/lib/ai/provider-secrets";
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
      return { ...result, providerId: attempt.providerId, model: attempt.modelName, fallbackUsed: attemptsTried > 1 };
    } catch (error) {
      failures.push(attempt.providerId + "/" + attempt.modelName + ": " + (error instanceof Error ? error.message : "Provider request failed."));
    }
  }
  throw new Error("All configured AI providers failed. " + failures.join(" | ").slice(0, 1800));
}
