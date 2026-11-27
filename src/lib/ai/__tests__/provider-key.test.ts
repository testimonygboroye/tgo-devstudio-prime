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

  it("prefers the provider's saved encrypted key over a legacy GEMINI_API_KEY", () => {
    process.env.GEMINI_API_KEY = "stale-environment-key";
    expect(resolveProviderApiKey("TGO Gemini", "google", "stored-ciphertext")).toBe("decrypted-stored-key");
    expect(decryptProviderSecret).toHaveBeenCalledWith("stored-ciphertext");
  });

  it("uses GEMINI_API_KEY only for a legacy Google record without a saved credential", () => {
    process.env.GEMINI_API_KEY = "legacy-environment-key";
    expect(resolveProviderApiKey("Gemini environment provider", "google", "")).toBe("legacy-environment-key");
    expect(decryptProviderSecret).not.toHaveBeenCalled();
  });

  it("continues to decrypt manually configured credentials for non-Google providers", () => {
    delete process.env.GEMINI_API_KEY;
    expect(resolveProviderApiKey("Claude TGO DevStudio Production", "anthropic", "ciphertext")).toBe("decrypted-stored-key");
    expect(decryptProviderSecret).toHaveBeenCalledWith("ciphertext");
  });

  it("uses the configured server-side environment key to recover an undecryptable saved credential", () => {
    process.env.GEMINI_API_KEY = "stale-environment-key";
    (decryptProviderSecret as jest.Mock).mockImplementationOnce(() => { throw new Error("Stored credential cannot be decrypted."); });
    expect(resolveProviderApiKey("TGO Gemini", "google", "stored-ciphertext")).toBe("stale-environment-key");
  });

  it("reports a missing credential when neither a stored nor environment key exists", () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => resolveProviderApiKey("TGO Gemini", "google", "")).toThrow("No decryptable provider credential or supported server-side environment key is configured for google.");
  });
});
