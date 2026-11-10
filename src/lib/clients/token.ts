import { createHash } from "node:crypto";

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
