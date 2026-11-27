import { catalogueSlug, serviceCategorySlug, serviceFamilySlug } from "../catalogue-slugs";

describe("commercial catalogue slug consistency", () => {
  it("normalises labels into stable URL slugs", () => {
    expect(catalogueSlug("Software & Digital Product Engineering")).toBe("software-digital-product-engineering");
    expect(catalogueSlug("  AI, Automation & Data  ")).toBe("ai-automation-data");
  });

  it("prefers explicit stored slugs and falls back to category and family names", () => {
    expect(serviceFamilySlug({ family: "Cloud & Infrastructure" })).toBe("cloud-infrastructure");
    expect(serviceFamilySlug({ family: "Cloud & Infrastructure", familySlug: "cloud-platforms" })).toBe("cloud-platforms");
    expect(serviceCategorySlug({ category: "AI Solutions & Automation" })).toBe("ai-solutions-automation");
    expect(serviceCategorySlug({ category: "AI Solutions", categorySlug: "intelligent-systems" })).toBe("intelligent-systems");
  });

  it("provides a safe slug for blank labels", () => {
    expect(catalogueSlug("   ")).toBe("uncategorized");
  });
});
