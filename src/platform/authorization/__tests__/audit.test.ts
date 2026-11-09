import { sanitizeAuditMetadata } from "@/lib/platform/audit";

describe("sanitizeAuditMetadata", () => {
  it("redacts secret-like keys recursively", () => {
    expect(
      sanitizeAuditMetadata({
        safe: "visible",
        apiKey: "do-not-store",
        nested: { refreshToken: "hidden", count: 2 },
      })
    ).toEqual({
      safe: "visible",
      apiKey: "[redacted]",
      nested: { refreshToken: "[redacted]", count: 2 },
    });
  });

  it("limits nested data and collection sizes", () => {
    const longArray = Array.from({ length: 70 }, (_, index) => index);
    const result = sanitizeAuditMetadata({ longArray }) as { longArray: number[] };
    expect(result.longArray).toHaveLength(50);
  });
});
