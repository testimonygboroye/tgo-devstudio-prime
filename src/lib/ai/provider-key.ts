import { decryptProviderSecret } from "@/lib/ai/provider-secrets";

function environmentProviderKey(provider: string): string {
  const names = provider === "google" ? ["GEMINI_API_KEY", "GOOGLE_API_KEY"]
    : provider === "openai" ? ["OPENAI_API_KEY"]
    : provider === "anthropic" ? ["ANTHROPIC_API_KEY", "CLAUDE_API_KEY"]
    : [];
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

/**
 * Prefer a decryptable provider-specific credential. If an old encrypted row
 * cannot be opened because its original encryption key was rotated, use the
 * provider's explicit server-side environment key as a safe recovery path.
 */
export function resolveProviderApiKey(_name: string, provider: string, encryptedApiKey: string): string {
  if (typeof encryptedApiKey === "string" && encryptedApiKey.trim()) {
    try { return decryptProviderSecret(encryptedApiKey); }
    catch (error) {
      const fallback = environmentProviderKey(provider);
      if (fallback) return fallback;
      throw error;
    }
  }
  const environmentKey = environmentProviderKey(provider);
  if (environmentKey) return environmentKey;
  throw new Error("No decryptable provider credential or supported server-side environment key is configured for " + provider + ".");
}
