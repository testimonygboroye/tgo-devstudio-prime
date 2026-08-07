import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Role from "@/models/Role";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireCanManageRoles } from "@/lib/auth/authorize";
import { slugify } from "@/lib/utils/slugify";
import { sanitizeContentPermissions, sanitizeAnalyticsPermissions } from "@/lib/utils/permissions";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  await connectToDatabase();
  const roles = await Role.find().sort({ createdAt: 1 });

  return NextResponse.json({ status: "ok", roles });
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireCanManageRoles(session)) {
    return forbiddenResponse("Only roles with role-management permission can create roles.");
  }

  const body = await request.json();
  const {
    name,
    canManageUsers,
    requiresTwoFactor,
    contentPermissions,
    analyticsPermissions,
  } = body as {
    name?: string;
    canManageUsers?: boolean;
    requiresTwoFactor?: boolean;
    contentPermissions?: unknown;
    analyticsPermissions?: unknown;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { status: "error", message: "A role name is required." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const slug = slugify(name);
  const existingRole = await Role.findOne({ slug });
  if (existingRole) {
    return NextResponse.json(
      { status: "error", message: "A role with this name already exists." },
      { status: 409 }
    );
  }

  const newRole = await Role.create({
    name: name.trim(),
    slug,
    isFounderRole: false,
    isSystemRole: false,
    canManageRoles: false,
    canManageUsers: Boolean(canManageUsers),
    requiresTwoFactor: Boolean(requiresTwoFactor),
    contentPermissions: sanitizeContentPermissions(contentPermissions),
    analyticsPermissions: sanitizeAnalyticsPermissions(analyticsPermissions),
  });

  return NextResponse.json({ status: "ok", role: newRole }, { status: 201 });
}
