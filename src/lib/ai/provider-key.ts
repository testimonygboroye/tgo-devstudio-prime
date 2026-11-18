import { decryptProviderSecret } from "@/lib/ai/provider-secrets";

export function resolveProviderApiKey(name: string, provider: string, encryptedApiKey: string): string {
  const environmentKey = provider === "google" && name === "Gemini environment provider"
    ? process.env.GEMINI_API_KEY?.trim()
    : "";
  return environmentKey || decryptProviderSecret(encryptedApiKey);
}
