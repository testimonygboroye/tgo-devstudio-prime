import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Invite from "@/models/Invite";
import Role from "@/models/Role";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireCanManageUsers } from "@/lib/auth/authorize";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireCanManageUsers(session)) {
    return forbiddenResponse("You do not have permission to manage invites.");
  }

  await connectToDatabase();
  const invites = await Invite.find().populate("role", "name hierarchyLevel").populate("invitedBy", "name").sort({ createdAt: -1 }).lean();
  return NextResponse.json({ status: "ok", invites });
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();

  const body = await request.json();
  const { email, roleId } = body as { email?: string; roleId?: string };

  if (!email || !roleId) {
    return NextResponse.json({ status: "error", message: "Email and role are required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ status: "error", message: "Invalid email format." }, { status: 400 });
  }

  await connectToDatabase();

  const targetRole = await Role.findById(roleId);
  if (!targetRole) {
    return NextResponse.json({ status: "error", message: "Role not found." }, { status: 404 });
  }

  const inviterLevel = session.role.hierarchyLevel;
  if (targetRole.hierarchyLevel <= inviterLevel) {
    return NextResponse.json(
      { status: "error", message: "You can only invite people into a role below your own hierarchy level." },
      { status: 403 }
    );
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  const invite = await Invite.create({
    email: email.toLowerCase().trim(),
    role: targetRole._id,
    tokenHash,
    invitedBy: session.user._id,
    expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
    approvalStatus: "pending",
  });

  return NextResponse.json(
    {
      status: "ok",
      message: "Invite submitted for approval. It will only be sent once approved.",
      invite,
    },
    { status: 201 }
  );
}
