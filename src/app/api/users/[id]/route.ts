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
import { sendAccountStatusChangeEmail } from "@/lib/email/sendAccountStatusChange";
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
  if (user.role.hierarchyLevel <= session.role.hierarchyLevel && !session.role.isFounderRole) {
    return forbiddenResponse("You cannot modify a user at or above your own hierarchy level.");
  }

  const body = await request.json();
  const { name, roleId, newPassword, banAction } = body as {
    name?: string;
    roleId?: string;
    newPassword?: string;
    banAction?: "ban" | "unban";
  };

  if (name && name.trim().length > 0) {
    user.name = name.trim();
  }

  let roleChangeOutcome: "none" | "applied" | "pending" = "none";
  const basePath = getAdminBasePath();
  const siteUrl = process.env.SITE_URL || "";

  if (roleId && roleId !== user.role._id.toString()) {
    const targetRole = await Role.findById(roleId);
    if (!targetRole) {
      return NextResponse.json({ status: "error", message: "Role not found." }, { status: 404 });
    }
    if (targetRole.isFounderRole) {
      return forbiddenResponse("Cannot assign the Founder role through this endpoint.");
    }
    if (targetRole.hierarchyLevel <= session.role.hierarchyLevel && !session.role.isFounderRole) {
      return forbiddenResponse("You can only assign roles below your own hierarchy level.");
    }

    const previousRoleName = user.role.name;

    if (targetRole.hierarchyLevel > user.role.hierarchyLevel) {
      // Numerically higher hierarchyLevel = lower authority = demotion. Applies immediately.
      user.role = targetRole._id as unknown as IRole;
      roleChangeOutcome = "applied";

      await Message.create({
        recipient: user._id,
        type: "general",
        title: "Your role has changed",
        body: `Your role was changed from ${previousRoleName} to ${targetRole.name} by ${session.user.name}.`,
      });
      await sendAccountStatusChangeEmail({
        toEmail: user.email,
        toName: user.name,
        subject: "Your role has changed",
        message: `Your role was changed from ${previousRoleName} to ${targetRole.name}.`,
      });
      await Message.create({
        recipient: session.user._id,
        type: "general",
        title: `Role change applied: ${user.name}`,
        body: `You changed ${user.name}'s role from ${previousRoleName} to ${targetRole.name}. This took effect immediately.`,
      });
    } else {
      // Numerically lower hierarchyLevel = higher authority = promotion. Requires acceptance.
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
        body: `You've been offered a role change from ${previousRoleName} to ${targetRole.name}. Review and accept or reject below.`,
        relatedId: changeRequest._id,
      });
      await sendRoleChangeRequestEmail({
        toEmail: user.email,
        toName: user.name,
        currentRoleName: previousRoleName,
        requestedRoleName: targetRole.name,
        reviewUrl: `${siteUrl}${basePath}/messages`,
      });
      await Message.create({
        recipient: session.user._id,
        type: "general",
        title: `Role change pending: ${user.name}`,
        body: `You offered ${user.name} a role change from ${previousRoleName} to ${targetRole.name}. Awaiting their acceptance.`,
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

  if (banAction) {
    if (!session.role.canBanUsers && !session.role.isFounderRole) {
      return forbiddenResponse("You do not have permission to ban or unban users.");
    }
    if (session.role.hierarchyLevel === 100) {
      return forbiddenResponse("The lowest hierarchy role cannot ban or unban users.");
    }

    user.isBanned = banAction === "ban";
    user.bannedAt = banAction === "ban" ? new Date() : undefined;
    if (banAction === "ban") {
      user.refreshTokenVersion += 1;
    }

    await Message.create({
      recipient: user._id,
      type: "general",
      title: banAction === "ban" ? "Your account has been suspended" : "Your account has been reinstated",
      body:
        banAction === "ban"
          ? `Your account was suspended by ${session.user.name}.`
          : `Your account was reinstated by ${session.user.name}.`,
    });
    await sendAccountStatusChangeEmail({
      toEmail: user.email,
      toName: user.name,
      subject: banAction === "ban" ? "Your account has been suspended" : "Your account has been reinstated",
      message:
        banAction === "ban"
          ? "Your admin account access has been suspended. Contact the Founder if you believe this is a mistake."
          : "Your admin account access has been reinstated. You can log in normally.",
    });
  }

  await user.save();

  return NextResponse.json({ status: "ok", message: "User updated.", roleChangeOutcome });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();

  if (!session.role.canDeleteUsers && !session.role.isFounderRole) {
    return forbiddenResponse("Only the Founder or roles with delete-user permission can delete users.");
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
  if (user.role.hierarchyLevel <= session.role.hierarchyLevel && !session.role.isFounderRole) {
    return forbiddenResponse("You cannot delete a user at or above your own hierarchy level.");
  }

  await user.deleteOne();
  return NextResponse.json({ status: "ok", message: "User deleted." });
}
