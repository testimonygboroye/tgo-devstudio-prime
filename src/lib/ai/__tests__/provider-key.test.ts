import { AIProvider } from "@/models/AIWorkforce";
import { decryptProviderSecret } from "@/lib/ai/provider-secrets";

jest.mock("@/models/AIWorkforce", () => ({
  AIProvider: { findById: jest.fn() },
}));
jest.mock("@/lib/ai/provider-secrets", () => ({
  decryptProviderSecret: jest.fn(() => "decrypted-stored-key"),
}));

describe("environment-managed Gemini provider credentials", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    jest.clearAllMocks();
  });

  it("uses the current server environment key instead of a stale encrypted snapshot", async () => {
    process.env.GEMINI_API_KEY = "current-environment-key";
    (AIProvider.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        provider: "google",
        name: "Gemini environment provider",
        enabled: true,
        lastTestStatus: "success",
        encryptedApiKey: "old-encrypted-value",
      }),
    });
    // The test only verifies the credential-selection branch without making a
    // network request or exposing the secret.
    const { resolveEnvironmentGeminiKey } = await import("@/lib/ai/provider-runtime");
    expect(resolveEnvironmentGeminiKey("Gemini environment provider", "google", "old-encrypted-value")).toBe("current-environment-key");
    expect(decryptProviderSecret).not.toHaveBeenCalled();
  });

  it("continues to decrypt manually configured provider credentials", async () => {
    delete process.env.GEMINI_API_KEY;
    const { resolveEnvironmentGeminiKey } = await import("@/lib/ai/provider-runtime");
    expect(resolveEnvironmentGeminiKey("Claude TGO DevStudio Production", "anthropic", "ciphertext")).toBe("decrypted-stored-key");
    expect(decryptProviderSecret).toHaveBeenCalledWith("ciphertext");
  });
});
