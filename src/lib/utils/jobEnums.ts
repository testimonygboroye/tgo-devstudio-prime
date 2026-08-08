export const ALLOWED_LOCATION_TYPES = ["remote", "onsite", "hybrid"] as const;
export type LocationTypeValue = (typeof ALLOWED_LOCATION_TYPES)[number];

export const ALLOWED_EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "freelance",
] as const;
export type EmploymentTypeValue = (typeof ALLOWED_EMPLOYMENT_TYPES)[number];

export function normalizeLocationType(value: unknown): LocationTypeValue {
  return ALLOWED_LOCATION_TYPES.includes(value as LocationTypeValue)
    ? (value as LocationTypeValue)
    : "remote";
}

export function normalizeEmploymentType(value: unknown): EmploymentTypeValue {
  return ALLOWED_EMPLOYMENT_TYPES.includes(value as EmploymentTypeValue)
    ? (value as EmploymentTypeValue)
    : "full-time";
}
