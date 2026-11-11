import { decryptCredentials, encryptCredentials } from "@/lib/integrations/crypto";
describe("integration credential encryption", () => {
  const original = process.env.INTEGRATION_CREDENTIALS_KEY;
  beforeEach(() => { process.env.INTEGRATION_CREDENTIALS_KEY = Buffer.from(Array.from({ length: 32 }, (_, i) => i + 1)).toString("base64"); });
  afterAll(() => { if (original === undefined) delete process.env.INTEGRATION_CREDENTIALS_KEY; else process.env.INTEGRATION_CREDENTIALS_KEY = original; });
  it("encrypts and decrypts credentials without storing plaintext", () => {
    const credentials = { apiKey: "private-api-key", senderEmail: "verified@example.com" };
    const ciphertext = encryptCredentials(credentials);
    expect(ciphertext).not.toContain(credentials.apiKey);
    expect(decryptCredentials(ciphertext)).toEqual(credentials);
  });
  it("uses a fresh nonce for each encryption", () => {
    const first = encryptCredentials({ token: "same-secret" });
    const second = encryptCredentials({ token: "same-secret" });
    expect(first).not.toBe(second);
    expect(decryptCredentials(first)).toEqual(decryptCredentials(second));
  });
  it("rejects tampered ciphertext", () => {
    const ciphertext = encryptCredentials({ token: "secret" });
    const parts = ciphertext.split(".");
    parts[2] = Buffer.from("tampered").toString("base64url");
    expect(() => decryptCredentials(parts.join("."))).toThrow();
  });
  it("rejects an invalid encryption key", () => {
    process.env.INTEGRATION_CREDENTIALS_KEY = "short";
    expect(() => encryptCredentials({ token: "secret" })).toThrow(/32-byte/);
  });
});
