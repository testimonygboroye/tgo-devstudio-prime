import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function encryptionKey(): Buffer {
  // Keep compatibility with deployments that already use AI_ENCRYPTION_KEY,
  // while allowing the shared, already-provisioned integration key as fallback.
  const raw = process.env.AI_ENCRYPTION_KEY || process.env.INTEGRATION_CREDENTIALS_KEY || "";
  if (!raw) throw new Error("Configure AI_ENCRYPTION_KEY or INTEGRATION_CREDENTIALS_KEY as a server-side 32-byte encryption key.");
  const key = /^[a-f0-9]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("The AI provider encryption key must be a base64-encoded 32-byte key or a 64-character hex key.");
  return key;
}
export function encryptProviderSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(".");
}
export function decryptProviderSecret(value: string): string {
  const [iv, tag, ciphertext] = value.split(".");
  if (!iv || !tag || !ciphertext) throw new Error("Stored provider credential is malformed.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"), { authTagLength: 16 });
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
}
