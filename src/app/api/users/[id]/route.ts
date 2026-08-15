import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Role, { IRole } from "@/models/Role";
import RoleChangeRequest from "@/models/RoleChangeRequest";
import Message from "@/models/Message";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireCanManageUsers } from "@/lib/auth/authorize";
import { hashPassword } from "@/lib/auth/passwords";
import { sendRoleChangeRequestEmail } from "@/lib/email/sendRoleChangeRequest";
import { getAdminBasePath } from "@/lib/adminPath";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireCanManageUsers(session)) {
    return forbiddenResponse("Only roles with user-management permission can view user details.");
  }

  const { id } = await params;
  await connectToDatabase();
  const user = await User.findById(id)
    .select("-passwordHash -twoFactorSecret -twoFactorTempSecret")
    .populate("role", "name slug hierarchyLevel");

  if (!user) {
    return NextResponse.json({ status: "error", message: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", user });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireCanManageUsers(session)) {
    return forbiddenResponse("Only roles with user-management permission can edit users.");
  }

  const { id } = await params;
  await connectToDatabase();
  const user = await User.findById(id).populate<{ role: IRole }>("role");

  if (!user) {
    return NextResponse.json({ status: "error", message: "User not found." }, { status: 404 });
  }
  if (user.role.isFounderRole) {
    return forbiddenResponse("The Founder account cannot be modified through this endpoint.");
  }

  const body = await request.json();
  const { name, roleId, newPassword } = body as {
    name?: string;
    roleId?: string;
    newPassword?: string;
  };

  if (name && name.trim().length > 0) {
    user.name = name.trim();
  }

  let roleChangeOutcome: "none" | "applied" | "pending" = "none";

  if (roleId && roleId !== user.role._id.toString()) {
    const targetRole = await Role.findById(roleId);
    if (!targetRole) {
      return NextResponse.json({ status: "error", message: "Role not found." }, { status: 404 });
    }
    if (targetRole.isFounderRole) {
      return forbiddenResponse("Cannot assign the Founder role through this endpoint.");
    }
    if (targetRole.hierarchyLevel <= session.role.hierarchyLevel) {
      return forbiddenResponse("You can only assign roles below your own hierarchy level.");
    }

    if (targetRole.hierarchyLevel > user.role.hierarchyLevel) {
      // Downgrade (lower authority) — applies immediately
      user.role = targetRole._id as unknown as IRole;
      roleChangeOutcome = "applied";
    } else {
      // Upgrade (more authority than they currently have) — requires their acceptance
      const existingPending = await RoleChangeRequest.findOne({ user: user._id, status: "pending" });
      if (existingPending) {
        return NextResponse.json(
          { status: "error", message: "This user already has a pending role change request." },
          { status: 409 }
        );
      }

      const changeRequest = await RoleChangeRequest.create({
        user: user._id,
        currentRole: user.role._id,
        requestedRole: targetRole._id,
        requestedBy: session.user._id,
      });

      await Message.create({
        recipient: user._id,
        type: "roleChangeRequest",
        title: `Role change offered: ${targetRole.name}`,
        body: `You've been offered a role change from ${user.role.name} to ${targetRole.name}. Review and accept or reject this in your Messages.`,
        relatedId: changeRequest._id,
      });

      const basePath = getAdminBasePath();
      const siteUrl = process.env.SITE_URL || "";
      await sendRoleChangeRequestEmail({
        toEmail: user.email,
        toName: user.name,
        currentRoleName: user.role.name,
        requestedRoleName: targetRole.name,
        reviewUrl: `${siteUrl}${basePath}/messages`,
      });

      roleChangeOutcome = "pending";
    }
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

  return NextResponse.json({ status: "ok", message: "User updated.", roleChangeOutcome });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireCanManageUsers(session)) {
    return forbiddenResponse("Only roles with user-management permission can delete users.");
  }

  const { id } = await params;
  await connectToDatabase();
  const user = await User.findById(id).populate<{ role: IRole }>("role");

  if (!user) {
    return NextResponse.json({ status: "error", message: "User not found." }, { status: 404 });
  }
  if (user.role.isFounderRole) {
    return forbiddenResponse("The Founder account cannot be deleted.");
  }

  await user.deleteOne();
  return NextResponse.json({ status: "ok", message: "User deleted." });
}
