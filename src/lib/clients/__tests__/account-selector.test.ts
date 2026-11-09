import { readRememberedClientAccounts } from "../account-selector";

describe("readRememberedClientAccounts", () => {
  it("returns normalized unique valid identities from an encoded cookie", () => {
    expect(readRememberedClientAccounts(encodeURIComponent(JSON.stringify([
      "Ada@Example.com", "ada@example.com", "invalid", "grace@example.org",
    ])))).toEqual(["ada@example.com", "grace@example.org"]);
  });

  it("supports cookie values already decoded by the request parser", () => {
    expect(readRememberedClientAccounts(JSON.stringify(["one@example.com"]))).toEqual(["one@example.com"]);
  });

  it("limits remembered identities to five", () => {
    expect(readRememberedClientAccounts(encodeURIComponent(JSON.stringify([
      "a@example.com", "b@example.com", "c@example.com", "d@example.com", "e@example.com", "f@example.com",
    ])))).toHaveLength(5);
  });

  it("fails closed on malformed cookie data", () => {
    expect(readRememberedClientAccounts("%not-json")).toEqual([]);
  });
});
