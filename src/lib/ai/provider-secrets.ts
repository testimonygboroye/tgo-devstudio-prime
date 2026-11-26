import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AI credentials have existed under both AI_ENCRYPTION_KEY and the shared
 * INTEGRATION_CREDENTIALS_KEY. Deployments can temporarily have both values
 * configured, and the preferred key can differ from the key that originally
 * encrypted a stored credential. Decryption therefore tries both keys in a
 * deterministic order; encryption continues to use the preferred AI key.
 */
function configuredEncryptionKeys(): Buffer[] {
  const rawValues = [process.env.AI_ENCRYPTION_KEY, process.env.INTEGRATION_CREDENTIALS_KEY]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const keys: Buffer[] = [];
  for (const raw of rawValues) {
    const key = /^[a-f0-9]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
    if (key.length === 32 && !keys.some((existing) => existing.equals(key))) keys.push(key);
  }
  if (!keys.length) {
    throw new Error("Configure AI_ENCRYPTION_KEY or INTEGRATION_CREDENTIALS_KEY as a valid 32-byte server-side encryption key.");
  }
  return keys;
}

function encryptionKey(): Buffer {
  return configuredEncryptionKeys()[0];
}

export function encryptProviderSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptProviderSecret(value: string): string {
  const [iv, tag, ciphertext] = String(value || "").split(".");
  if (!iv || !tag || !ciphertext) throw new Error("Stored provider credential is malformed.");
  const ivBytes = Buffer.from(iv, "base64");
  const tagBytes = Buffer.from(tag, "base64");
  const ciphertextBytes = Buffer.from(ciphertext, "base64");
  if (ivBytes.length !== 12 || tagBytes.length !== 16 || !ciphertextBytes.length) {
    throw new Error("Stored provider credential is malformed.");
  }

  let lastError: unknown;
  for (const key of configuredEncryptionKeys()) {
    try {
      const decipher = createDecipheriv("aes-256-gcm", key, ivBytes, { authTagLength: 16 });
      decipher.setAuthTag(tagBytes);
      return Buffer.concat([decipher.update(ciphertextBytes), decipher.final()]).toString("utf8");
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    "Stored AI provider credentials could not be decrypted with either configured key. Restore the original AI_ENCRYPTION_KEY or INTEGRATION_CREDENTIALS_KEY used when the provider was saved.",
    { cause: lastError },
  );
}
