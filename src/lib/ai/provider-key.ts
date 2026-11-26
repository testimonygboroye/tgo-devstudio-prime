import { decryptProviderSecret } from "@/lib/ai/provider-secrets";

/**
 * Prefer the provider-specific encrypted credential saved in TGO's registry.
 * GEMINI_API_KEY is only a compatibility fallback for legacy Google records
 * that have no encrypted credential. It must never shadow a newly saved key.
 */
export function resolveProviderApiKey(_name: string, provider: string, encryptedApiKey: string): string {
  if (typeof encryptedApiKey === "string" && encryptedApiKey.trim()) {
    return decryptProviderSecret(encryptedApiKey);
  }
  const environmentKey = provider === "google" ? process.env.GEMINI_API_KEY?.trim() : "";
  if (environmentKey) return environmentKey;
  throw new Error("No encrypted provider credential or supported server-side environment key is configured.");
}
