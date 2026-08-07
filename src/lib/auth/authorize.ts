import { NextResponse } from "next/server";
import { AuthenticatedSession } from "@/lib/auth/session";

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { status: "error", message: "Not authenticated." },
    { status: 401 }
  );
}

export function forbiddenResponse(message = "You do not have permission to perform this action."): NextResponse {
  return NextResponse.json({ status: "error", message }, { status: 403 });
}

export function requireCanManageRoles(session: AuthenticatedSession): boolean {
  return session.role.canManageRoles === true;
}

export function requireCanManageUsers(session: AuthenticatedSession): boolean {
  return session.role.canManageUsers === true;
}

export function requireContentPermission(
  session: AuthenticatedSession,
  contentType: string,
  action: "create" | "edit" | "publish" | "delete" | "viewAnalytics"
): boolean {
  if (session.role.isFounderRole) {
    return true;
  }
  const permissions = session.role.contentPermissions?.get(contentType);
  return permissions ? permissions[action] === true : false;
}

export function requireAnyContentPermission(
  session: AuthenticatedSession,
  contentType: string
): boolean {
  if (session.role.isFounderRole) {
    return true;
  }
  const permissions = session.role.contentPermissions?.get(contentType);
  if (!permissions) {
    return false;
  }
  return Object.values(permissions).some(Boolean);
}
