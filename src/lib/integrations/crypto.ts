import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
function key(): Buffer {
  const raw = process.env.INTEGRATION_CREDENTIALS_KEY || "";
  let value: Buffer;
  if (/^[a-f0-9]{64}$/i.test(raw)) value = Buffer.from(raw, "hex");
  else value = Buffer.from(raw, "base64");
  if (value.length !== 32) throw new Error("INTEGRATION_CREDENTIALS_KEY must be a 32-byte base64 or 64-character hex key.");
  return value;
}
export function encryptCredentials(credentials: Record<string, string>): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(credentials), "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}
export function decryptCredentials(value: string): Record<string, string> {
  const [ivPart, tagPart, dataPart] = value.split(".");
  if (!ivPart || !tagPart || !dataPart) throw new Error("Stored integration credentials are invalid.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]).toString("utf8");
  const parsed: unknown = JSON.parse(decrypted);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Stored integration credentials are invalid.");
  return parsed as Record<string, string>;
}
