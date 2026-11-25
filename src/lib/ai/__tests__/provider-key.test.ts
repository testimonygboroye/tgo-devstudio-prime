import { decryptProviderSecret } from "@/lib/ai/provider-secrets";
import { resolveProviderApiKey } from "@/lib/ai/provider-key";

jest.mock("@/lib/ai/provider-secrets", () => ({
  decryptProviderSecret: jest.fn(() => "decrypted-stored-key"),
}));

describe("AI provider credential resolution", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    jest.clearAllMocks();
  });

  it("uses GEMINI_API_KEY for every Google provider record, regardless of its stored display name", () => {
    process.env.GEMINI_API_KEY = "current-environment-key";
    expect(resolveProviderApiKey("Gemini Production", "google", "old-encrypted-value")).toBe("current-environment-key");
    expect(decryptProviderSecret).not.toHaveBeenCalled();
  });

  it("continues to decrypt manually configured credentials for non-Google providers", () => {
    delete process.env.GEMINI_API_KEY;
    expect(resolveProviderApiKey("Claude TGO DevStudio Production", "anthropic", "ciphertext")).toBe("decrypted-stored-key");
    expect(decryptProviderSecret).toHaveBeenCalledWith("ciphertext");
  });

  it("falls back to encrypted Google credentials when no environment key is configured", () => {
    delete process.env.GEMINI_API_KEY;
    expect(resolveProviderApiKey("Gemini Production", "google", "ciphertext")).toBe("decrypted-stored-key");
    expect(decryptProviderSecret).toHaveBeenCalledWith("ciphertext");
  });
});
