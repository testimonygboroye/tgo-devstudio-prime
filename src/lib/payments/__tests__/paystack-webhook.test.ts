import { createHmac } from "node:crypto";
import { verifyPaystackWebhookSignature } from "../paystack-webhook";

describe("Paystack webhook signature verification", () => {
  const body = Buffer.from('{"event":"charge.success","data":{"reference":"TGO_ABC"}}');
  const nowSeconds = 1_800_000_000;
  const webhookSecret = "whsec_test_secret";
  const secretKey = "sk_test_secret";

  it("accepts a valid timestamped Paystack-Signature header", () => {
    const timestamp = String(nowSeconds);
    const signature = createHmac("sha512", webhookSecret).update(timestamp + ".").update(body).digest("hex");
    expect(verifyPaystackWebhookSignature({
      rawBody: body,
      signatureHeader: `t=${timestamp},v1=whk_test123:${signature}`,
      webhookSecret,
      nowSeconds,
    })).toBe(true);
  });

  it("rejects stale timestamped signatures", () => {
    const timestamp = String(nowSeconds - 301);
    const signature = createHmac("sha512", webhookSecret).update(timestamp + ".").update(body).digest("hex");
    expect(verifyPaystackWebhookSignature({
      rawBody: body,
      signatureHeader: `t=${timestamp},v1=whk_test123:${signature}`,
      webhookSecret,
      nowSeconds,
    })).toBe(false);
  });

  it("accepts the legacy x-paystack-signature during migration", () => {
    const signature = createHmac("sha512", secretKey).update(body).digest("hex");
    expect(verifyPaystackWebhookSignature({ rawBody: body, legacySignatureHeader: signature, secretKey })).toBe(true);
  });

  it("rejects altered payloads and malformed signatures", () => {
    const signature = createHmac("sha512", secretKey).update(body).digest("hex");
    expect(verifyPaystackWebhookSignature({ rawBody: Buffer.from(body.toString() + " "), legacySignatureHeader: signature, secretKey })).toBe(false);
    expect(verifyPaystackWebhookSignature({ rawBody: body, legacySignatureHeader: "bad", secretKey })).toBe(false);
  });
});
