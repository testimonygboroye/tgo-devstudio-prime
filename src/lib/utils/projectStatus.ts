export const ALLOWED_PROJECT_STATUSES = ["live", "in-progress", "concept"] as const;

export type ProjectStatusValue = (typeof ALLOWED_PROJECT_STATUSES)[number];

export function normalizeProjectStatus(value: unknown): ProjectStatusValue {
  return ALLOWED_PROJECT_STATUSES.includes(value as ProjectStatusValue)
    ? (value as ProjectStatusValue)
    : "in-progress";
}
