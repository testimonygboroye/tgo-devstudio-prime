import crypto from "crypto";

export function generateUnsubscribeToken(subscriberId: string): string {
  const secret = process.env.JWT_ACCESS_SECRET as string;
  return crypto.createHmac("sha256", secret).update(subscriberId).digest("hex");
}

export function verifyUnsubscribeToken(subscriberId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(subscriberId);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
