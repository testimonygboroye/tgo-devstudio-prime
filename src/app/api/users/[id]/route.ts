import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireCanManageUsers } from "@/lib/auth/authorize";
import { hashPassword } from "@/lib/auth/passwords";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireCanManageUsers(session)) {
    return forbiddenResponse("Only roles with user-management permission can view user details.");
  }

  const { id } = await params;

  await connectToDatabase();
  const user = await User.findById(id)
    .select("-passwordHash -twoFactorSecret -twoFactorTempSecret")
    .populate("role", "name slug");

  if (!user) {
    return NextResponse.json({ status: "error", message: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", user });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireCanManageUsers(session)) {
    return forbiddenResponse("Only roles with user-management permission can edit users.");
  }

  const { id } = await params;

  await connectToDatabase();
  const user = await User.findById(id).populate("role");

  if (!user) {
    return NextResponse.json({ status: "error", message: "User not found." }, { status: 404 });
  }

  if ((user.role as unknown as { isFounderRole: boolean }).isFounderRole) {
    return forbiddenResponse("The Founder account cannot be modified through this endpoint.");
  }

  const body = await request.json();
  const { name, roleId, newPassword } = body as {
    name?: string;
    roleId?: string;
    newPassword?: string;
  };

  if (name && typeof name === "string" && name.trim().length > 0) {
    user.name = name.trim();
  }

  if (roleId) {
    const targetRole = await Role.findById(roleId);
    if (!targetRole) {
      return NextResponse.json({ status: "error", message: "Role not found." }, { status: 404 });
    }
    if (targetRole.isFounderRole) {
      return forbiddenResponse("Cannot assign the Founder role through this endpoint.");
    }
    user.role = targetRole._id;
  }

  if (newPassword) {
    if (newPassword.length < 12) {
      return NextResponse.json(
        { status: "error", message: "Password must be at least 12 characters long." },
        { status: 400 }
      );
    }
    user.passwordHash = await hashPassword(newPassword);
    user.refreshTokenVersion += 1;
  }

  await user.save();

  return NextResponse.json({ status: "ok", message: "User updated." });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireCanManageUsers(session)) {
    return forbiddenResponse("Only roles with user-management permission can delete users.");
  }

  const { id } = await params;

  await connectToDatabase();
  const user = await User.findById(id).populate("role");

  if (!user) {
    return NextResponse.json({ status: "error", message: "User not found." }, { status: 404 });
  }

  if ((user.role as unknown as { isFounderRole: boolean }).isFounderRole) {
    return forbiddenResponse("The Founder account cannot be deleted.");
  }

  await user.deleteOne();

  return NextResponse.json({ status: "ok", message: "User deleted." });
}
