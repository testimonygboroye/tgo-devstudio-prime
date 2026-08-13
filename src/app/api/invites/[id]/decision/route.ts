import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Invite from "@/models/Invite";
import Role from "@/models/Role";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireCanManageUsers } from "@/lib/auth/authorize";
import { sendInviteEmail } from "@/lib/email/sendInvite";
import { getAdminBasePath } from "@/lib/adminPath";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireCanManageUsers(session)) {
    return forbiddenResponse("You do not have permission to approve or reject invites.");
  }

  const { id } = await params;
  const body = await request.json();
  const { decision } = body as { decision?: "approve" | "reject" };

  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json({ status: "error", message: "Invalid decision." }, { status: 400 });
  }

  await connectToDatabase();

  const invite = await Invite.findById(id).populate("role", "name");
  if (!invite) {
    return NextResponse.json({ status: "error", message: "Invite not found." }, { status: 404 });
  }

  if (invite.approvalStatus !== "pending") {
    return NextResponse.json({ status: "error", message: "This invite has already been decided." }, { status: 400 });
  }

  invite.approvalStatus = decision === "approve" ? "approved" : "rejected";
  invite.approvedBy = session.user._id;
  invite.approvedAt = new Date();

  if (decision === "approve") {
    const rawToken = generateRawToken();
    invite.tokenHash = hashToken(rawToken);

    await invite.save();

    const roleDoc = invite.role as unknown as { name: string };
    const basePath = getAdminBasePath();
    const siteUrl = process.env.SITE_URL || "";
    const inviteUrl = `${siteUrl}${basePath}/signup?token=${rawToken}`;

    await sendInviteEmail({ toEmail: invite.email, roleName: roleDoc.name, inviteUrl });
  } else {
    await invite.save();
  }

  return NextResponse.json({ status: "ok", message: `Invite ${decision}d.` });
}
