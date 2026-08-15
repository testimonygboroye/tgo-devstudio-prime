import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Role from "@/models/Role";
import User from "@/models/User";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireCanManageRoles } from "@/lib/auth/authorize";
import { sanitizeContentPermissions, sanitizeAnalyticsPermissions } from "@/lib/utils/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;

  await connectToDatabase();
  const role = await Role.findById(id);

  if (!role) {
    return NextResponse.json({ status: "error", message: "Role not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", role });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireCanManageRoles(session)) {
    return forbiddenResponse("Only roles with role-management permission can edit roles.");
  }

  const { id } = await params;

  await connectToDatabase();
  const role = await Role.findById(id);

  if (!role) {
    return NextResponse.json({ status: "error", message: "Role not found." }, { status: 404 });
  }

  if (role.isFounderRole) {
    return forbiddenResponse("The Founder role cannot be modified.");
  }

  if (role.hierarchyLevel <= session.role.hierarchyLevel && !session.role.isFounderRole) {
    return forbiddenResponse("You cannot modify a role at or above your own hierarchy level.");
  }

  const body = await request.json();
  const {
    name,
    hierarchyLevel,
    canManageUsers,
    canBanUsers,
    canDeleteUsers,
    requiresTwoFactor,
    contentPermissions,
    analyticsPermissions,
  } = body as {
    name?: string;
    hierarchyLevel?: number;
    canManageUsers?: boolean;
    canBanUsers?: boolean;
    canDeleteUsers?: boolean;
    requiresTwoFactor?: boolean;
    contentPermissions?: unknown;
    analyticsPermissions?: unknown;
  };

  if (name && typeof name === "string" && name.trim().length > 0) {
    role.name = name.trim();
  }
  if (typeof hierarchyLevel === "number") {
    if (hierarchyLevel <= session.role.hierarchyLevel && !session.role.isFounderRole) {
      return NextResponse.json(
        { status: "error", message: "You cannot set a hierarchy level at or above your own." },
        { status: 400 }
      );
    }
    role.hierarchyLevel = hierarchyLevel;
  }
  if (typeof canManageUsers === "boolean") {
    role.canManageUsers = canManageUsers;
  }
  if (typeof canBanUsers === "boolean") {
    role.canBanUsers = canBanUsers;
  }
  if (typeof canDeleteUsers === "boolean") {
    role.canDeleteUsers = canDeleteUsers;
  }
  if (typeof requiresTwoFactor === "boolean") {
    role.requiresTwoFactor = requiresTwoFactor;
  }
  if (contentPermissions !== undefined) {
    role.contentPermissions = new Map(
      Object.entries(sanitizeContentPermissions(contentPermissions))
    ) as typeof role.contentPermissions;
  }
  if (analyticsPermissions !== undefined) {
    role.analyticsPermissions = sanitizeAnalyticsPermissions(analyticsPermissions);
  }

  await role.save();

  return NextResponse.json({ status: "ok", role });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireCanManageRoles(session)) {
    return forbiddenResponse("Only roles with role-management permission can delete roles.");
  }

  const { id } = await params;

  await connectToDatabase();
  const role = await Role.findById(id);

  if (!role) {
    return NextResponse.json({ status: "error", message: "Role not found." }, { status: 404 });
  }

  if (role.isFounderRole) {
    return forbiddenResponse("The Founder role cannot be deleted.");
  }

  const usersWithRole = await User.countDocuments({ role: role._id });
  if (usersWithRole > 0) {
    return NextResponse.json(
      {
        status: "error",
        message: `${usersWithRole} user(s) are still assigned to this role. Reassign them before deleting it.`,
      },
      { status: 409 }
    );
  }

  await role.deleteOne();

  return NextResponse.json({ status: "ok", message: "Role deleted." });
}
