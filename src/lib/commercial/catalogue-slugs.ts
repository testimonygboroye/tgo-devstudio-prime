export function catalogueSlug(value: unknown): string {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "uncategorized";
}

export function serviceFamilySlug(service: { familySlug?: unknown; family?: unknown }): string {
  return String(service.familySlug ?? "").trim() || catalogueSlug(service.family);
}

export function serviceCategorySlug(service: { categorySlug?: unknown; category?: unknown }): string {
  return String(service.categorySlug ?? "").trim() || catalogueSlug(service.category);
}
