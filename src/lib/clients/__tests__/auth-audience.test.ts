import { canUseAuthenticationAudience } from "../auth-audience";

describe("client/staff authentication audience boundary", () => {
  it("allows client identities only through the client audience", () => {
    expect(canUseAuthenticationAudience("client", "client")).toBe(true);
    expect(canUseAuthenticationAudience("client", undefined)).toBe(false);
    expect(canUseAuthenticationAudience("client", "staff")).toBe(false);
  });

  it("does not allow staff identities into the client portal", () => {
    expect(canUseAuthenticationAudience("staff", "client")).toBe(false);
    expect(canUseAuthenticationAudience(undefined, "client")).toBe(false);
  });

  it("preserves legacy staff sign-in behavior when audience is not client", () => {
    expect(canUseAuthenticationAudience("staff", undefined)).toBe(true);
    expect(canUseAuthenticationAudience(undefined, undefined)).toBe(true);
  });
});
