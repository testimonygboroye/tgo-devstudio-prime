import { createHmac, timingSafeEqual } from "node:crypto";

function safeHexEqual(expected: Buffer, suppliedHex: string): boolean {
  if (!/^[0-9a-f]{128}$/i.test(suppliedHex)) return false;
  const supplied = Buffer.from(suppliedHex, "hex");
  return supplied.length === expected.length && timingSafeEqual(expected, supplied);
}

export function verifyPaystackWebhookSignature(input: {
  rawBody: Buffer;
  signatureHeader?: string | null;
  legacySignatureHeader?: string | null;
  webhookSecret?: string;
  secretKey?: string;
  nowSeconds?: number;
}): boolean {
  const { rawBody, signatureHeader, legacySignatureHeader, webhookSecret, secretKey } = input;
  if (!Buffer.isBuffer(rawBody)) return false;

  if (signatureHeader && webhookSecret) {
    let timestamp: number | null = null;
    const signatures: Array<{ keyId: string; hex: string }> = [];
    for (const part of signatureHeader.split(",")) {
      const separator = part.indexOf("=");
      if (separator < 0) continue;
      const key = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      if (key === "t") {
        if (timestamp !== null || !/^[0-9]+$/.test(value)) return false;
        timestamp = Number(value);
      } else if (key === "v1") {
        const colon = value.indexOf(":");
        if (colon > 0) signatures.push({ keyId: value.slice(0, colon), hex: value.slice(colon + 1) });
      }
    }
    const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
    if (timestamp === null || !Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > 300 || !signatures.length) return false;
    const expected = createHmac("sha512", webhookSecret).update(String(timestamp) + ".").update(rawBody).digest();
    return signatures.some(({ keyId, hex }) => /^whk_[a-zA-Z0-9_-]+$/.test(keyId) && safeHexEqual(expected, hex));
  }

  if (legacySignatureHeader && secretKey) {
    const expected = createHmac("sha512", secretKey).update(rawBody).digest();
    return safeHexEqual(expected, legacySignatureHeader);
  }

  return false;
}
