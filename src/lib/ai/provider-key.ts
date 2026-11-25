import { decryptProviderSecret } from "@/lib/ai/provider-secrets";

/**
 * Prefer an explicitly configured server-side provider key. This keeps a
 * deployment from depending on an encryption key merely to use its own
 * environment-managed Gemini credential. Manually entered credentials remain
 * encrypted at rest and continue through the normal decryption path.
 */
export function resolveProviderApiKey(_name: string, provider: string, encryptedApiKey: string): string {
  const environmentKey = provider === "google" ? process.env.GEMINI_API_KEY?.trim() : "";
  return environmentKey || decryptProviderSecret(encryptedApiKey);
}
