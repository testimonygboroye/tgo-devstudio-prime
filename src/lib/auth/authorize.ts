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
