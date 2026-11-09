export type PlatformScopeType =
  | "global"
  | "self"
  | "department"
  | "team"
  | "project"
  | "client";

export interface PlatformPermissionGrant {
  permission: string;
  scope: PlatformScopeType;
  resourceIds?: string[];
}

export interface PlatformPrincipal {
  userId: string;
  isFounder?: boolean;
  departmentIds?: string[];
  teamIds?: string[];
  grants: PlatformPermissionGrant[];
  deniedPermissions?: string[];
}

export interface PlatformResourceContext {
  ownerId?: string;
  departmentId?: string;
  teamId?: string;
  projectId?: string;
  clientId?: string;
}

export interface PermissionDecision {
  allowed: boolean;
  reason: "founder" | "explicit-deny" | "grant" | "scope-mismatch" | "no-grant";
}

function permissionMatches(granted: string, requested: string): boolean {
  if (granted === "*") return true;
  if (granted === requested) return true;
  if (granted.endsWith(".*")) {
    return requested.startsWith(granted.slice(0, -1));
  }
  return false;
}

function scopeMatches(
  grant: PlatformPermissionGrant,
  principal: PlatformPrincipal,
  resource?: PlatformResourceContext
): boolean {
  switch (grant.scope) {
    case "global":
      return true;
    case "self":
      return Boolean(resource?.ownerId && resource.ownerId === principal.userId);
    case "department": {
      const allowedIds = grant.resourceIds?.length ? grant.resourceIds : principal.departmentIds || [];
      return Boolean(resource?.departmentId && allowedIds.includes(resource.departmentId));
    }
    case "team": {
      const allowedIds = grant.resourceIds?.length ? grant.resourceIds : principal.teamIds || [];
      return Boolean(resource?.teamId && allowedIds.includes(resource.teamId));
    }
    case "project":
      return Boolean(resource?.projectId && grant.resourceIds?.includes(resource.projectId));
    case "client":
      return Boolean(resource?.clientId && grant.resourceIds?.includes(resource.clientId));
  }
}

export function evaluatePlatformPermission(
  principal: PlatformPrincipal,
  permission: string,
  resource?: PlatformResourceContext
): PermissionDecision {
  if (principal.deniedPermissions?.some((denied) => permissionMatches(denied, permission))) {
    return { allowed: false, reason: "explicit-deny" };
  }

  if (principal.isFounder) {
    return { allowed: true, reason: "founder" };
  }

  const matching = principal.grants.filter((grant) =>
    permissionMatches(grant.permission, permission)
  );

  if (matching.some((grant) => scopeMatches(grant, principal, resource))) {
    return { allowed: true, reason: "grant" };
  }

  return {
    allowed: false,
    reason: matching.length ? "scope-mismatch" : "no-grant",
  };
}
