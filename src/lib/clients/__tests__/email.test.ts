import { hashVerificationToken } from "../email";

describe("client email verification token hashing", () => {
  it("produces a stable SHA-256 digest without storing the raw token", () => {
    const token = "a-long-random-verification-token";
    expect(hashVerificationToken(token)).toBe(hashVerificationToken(token));
    expect(hashVerificationToken(token)).not.toBe(token);
    expect(hashVerificationToken(token)).toHaveLength(64);
  });

  it("produces different digests for different tokens", () => {
    expect(hashVerificationToken("token-one")).not.toBe(hashVerificationToken("token-two"));
  });
});
