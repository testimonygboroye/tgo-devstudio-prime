import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Invite from "@/models/Invite";
import User from "@/models/User";
import { hashToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/passwords";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, name, password, confirmPassword } = body as {
    token?: string;
    name?: string;
    password?: string;
    confirmPassword?: string;
  };

  if (!token || !name || !password || !confirmPassword) {
    return NextResponse.json({ status: "error", message: "All fields are required." }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ status: "error", message: "Passwords do not match." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ status: "error", message: "Password must be at least 8 characters." }, { status: 400 });
  }

  await connectToDatabase();

  const tokenHash = hashToken(token);
  const invite = await Invite.findOne({ tokenHash });

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

  const existingUser = await User.findOne({ email: invite.email });
  if (existingUser) {
    return NextResponse.json(
      { status: "error", message: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  await User.create({
    name: name.trim(),
    email: invite.email,
    passwordHash,
    role: invite.role,
  });

  invite.usedAt = new Date();
  await invite.save();

  return NextResponse.json({ status: "ok", message: "Account created. You can now log in." }, { status: 201 });
}
