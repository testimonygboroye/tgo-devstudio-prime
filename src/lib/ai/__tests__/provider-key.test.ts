import { decryptProviderSecret } from "@/lib/ai/provider-secrets";
import { resolveProviderApiKey } from "@/lib/ai/provider-key";

jest.mock("@/lib/ai/provider-secrets", () => ({
  decryptProviderSecret: jest.fn(() => "decrypted-stored-key"),
}));

describe("environment-managed AI provider credentials", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    jest.clearAllMocks();
  });

  it("uses the current server environment key instead of a stale encrypted Gemini snapshot", () => {
    process.env.GEMINI_API_KEY = "current-environment-key";
    expect(resolveProviderApiKey("Gemini environment provider", "google", "old-encrypted-value")).toBe("current-environment-key");
    expect(decryptProviderSecret).not.toHaveBeenCalled();
  });

  it("continues to decrypt manually configured provider credentials", () => {
    delete process.env.GEMINI_API_KEY;
    expect(resolveProviderApiKey("Claude TGO DevStudio Production", "anthropic", "ciphertext")).toBe("decrypted-stored-key");
    expect(decryptProviderSecret).toHaveBeenCalledWith("ciphertext");
  });

  it("does not use the Gemini environment variable for unrelated Google providers", () => {
    process.env.GEMINI_API_KEY = "current-environment-key";
    expect(resolveProviderApiKey("Other Google provider", "google", "ciphertext")).toBe("decrypted-stored-key");
    expect(decryptProviderSecret).toHaveBeenCalledWith("ciphertext");
  });
});
