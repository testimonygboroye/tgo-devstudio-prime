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
  const environmentKey = environmentProviderKey(provider);
  // Explicit OpenAI/Anthropic environment keys are the operator's current
  // credentials and must override older saved rows after key rotation.
  // Gemini keeps per-provider saved keys first so multiple Google accounts can
  // remain separate; its environment key is the fallback for the env provider.
  if (provider !== "google" && environmentKey) return environmentKey;
  if (typeof encryptedApiKey === "string" && encryptedApiKey.trim()) {
    try { return decryptProviderSecret(encryptedApiKey); }
    catch (error) {
      if (environmentKey) return environmentKey;
      throw error;
    }
  }
  if (environmentKey) return environmentKey;
  throw new Error("No decryptable provider credential or supported server-side environment key is configured for " + provider + ".");
}
