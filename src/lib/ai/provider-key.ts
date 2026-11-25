import { decryptProviderSecret } from "@/lib/ai/provider-secrets";

/**
 * Manually entered credentials are authoritative. The optional environment
 * key is only a recovery source for the dedicated environment-import record;
 * it must never silently override a key the founder just replaced in the UI.
 */
export function resolveProviderApiKey(name: string, provider: string, encryptedApiKey: string): string {
  if (provider !== "google") return decryptProviderSecret(encryptedApiKey);
  try {
    const savedKey = decryptProviderSecret(encryptedApiKey);
    if (savedKey) return savedKey;
  } catch (error) {
    if (name !== "Gemini environment provider") throw error;
  }
  const environmentKey = process.env.GEMINI_API_KEY?.trim();
  if (name === "Gemini environment provider" && environmentKey) return environmentKey;
  throw new Error("The saved Gemini API key could not be decrypted. Replace the provider key in AI Workforce.");
}
