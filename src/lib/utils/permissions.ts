export interface PermissionSetInput {
  create?: boolean;
  edit?: boolean;
  publish?: boolean;
  delete?: boolean;
  viewAnalytics?: boolean;
}

export function sanitizeContentPermissions(
  input: unknown
): Record<string, PermissionSetInput> {
  const result: Record<string, PermissionSetInput> = {};

  if (typeof input !== "object" || input === null) {
    return result;
  }

  for (const [contentType, rawPermissions] of Object.entries(input as Record<string, unknown>)) {
    if (typeof rawPermissions !== "object" || rawPermissions === null) {
      continue;
    }

    const permissions = rawPermissions as Record<string, unknown>;

    result[contentType] = {
      create: Boolean(permissions.create),
      edit: Boolean(permissions.edit),
      publish: Boolean(permissions.publish),
      delete: Boolean(permissions.delete),
      viewAnalytics: Boolean(permissions.viewAnalytics),
    };
  }

  return result;
}

export function sanitizeAnalyticsPermissions(input: unknown) {
  const permissions = (typeof input === "object" && input !== null ? input : {}) as Record<
    string,
    unknown
  >;

  return {
    viewOwnContentAnalytics: Boolean(permissions.viewOwnContentAnalytics),
    viewSiteWideAnalytics: Boolean(permissions.viewSiteWideAnalytics),
    viewFormSubmissionData: Boolean(permissions.viewFormSubmissionData),
  };
}
