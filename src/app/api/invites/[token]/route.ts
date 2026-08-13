import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Invite from "@/models/Invite";
import { hashToken } from "@/lib/auth/tokens";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  await connectToDatabase();

  const tokenHash = hashToken(token);
  const invite = await Invite.findOne({ tokenHash }).populate("role", "name");

  if (!invite) {
    return NextResponse.json({ status: "error", message: "Invite not found or invalid." }, { status: 404 });
  }
  if (invite.approvalStatus !== "approved") {
    return NextResponse.json({ status: "error", message: "This invite has not been approved yet." }, { status: 403 });
  }
  if (invite.usedAt) {
    return NextResponse.json({ status: "error", message: "This invite has already been used." }, { status: 410 });
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ status: "error", message: "This invite has expired." }, { status: 410 });
  }

  const roleDoc = invite.role as unknown as { name: string };

  return NextResponse.json({
    status: "ok",
    invite: { email: invite.email, roleName: roleDoc.name },
  });
}
