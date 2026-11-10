import { validateClientRegistration } from "../validation";

describe("validateClientRegistration", () => {
  it("normalizes the name and email for valid registration", () => {
    expect(validateClientRegistration({ name: "  Ada Lovelace ", email: " ADA@example.com ", password: "StrongPassword123" })).toEqual({
      ok: true, value: { name: "Ada Lovelace", email: "ada@example.com", password: "StrongPassword123" },
    });
  });

  it("rejects weak passwords", () => {
    expect(validateClientRegistration({ name: "Ada Lovelace", email: "ada@example.com", password: "weak" }).ok).toBe(false);
  });

  it("rejects malformed email addresses", () => {
    expect(validateClientRegistration({ name: "Ada Lovelace", email: "not-an-email", password: "StrongPassword123" })).toEqual({
      ok: false, error: "Enter a valid email address.",
    });
  });

  it("rejects missing or overlong names", () => {
    expect(validateClientRegistration({ name: "A", email: "ada@example.com", password: "StrongPassword123" }).ok).toBe(false);
    expect(validateClientRegistration({ name: "x".repeat(121), email: "ada@example.com", password: "StrongPassword123" }).ok).toBe(false);
  });
});
