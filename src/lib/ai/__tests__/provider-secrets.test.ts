import { decryptProviderSecret, encryptProviderSecret } from "@/lib/ai/provider-secrets";
describe("AI provider credential encryption", () => {
  const original = process.env.AI_ENCRYPTION_KEY;
  beforeEach(() => { process.env.AI_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64"); });
  afterAll(() => { if (original === undefined) delete process.env.AI_ENCRYPTION_KEY; else process.env.AI_ENCRYPTION_KEY = original; });
  it("round-trips provider secrets without storing plaintext", () => {
    const secret = "test-provider-secret";
    const encrypted = encryptProviderSecret(secret);
    expect(encrypted).not.toContain(secret);
    expect(decryptProviderSecret(encrypted)).toBe(secret);
  });
  it("rejects tampered ciphertext", () => {
    const encrypted = encryptProviderSecret("provider-secret");
    const [iv, tag, data] = encrypted.split(".");
    expect(() => decryptProviderSecret([iv, tag, data.slice(0, -2) + "AA"].join("."))).toThrow();
  });
});
