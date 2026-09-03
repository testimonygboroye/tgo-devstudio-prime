import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import TwoFactorDisableToken from "@/models/TwoFactorDisableToken";
import { verifyPassword } from "@/lib/auth/passwords";
import { hashToken } from "@/lib/auth/tokens";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, email, password } = body as { token?: string; email?: string; password?: string };

  if (!token || !email || !password) {
    return NextResponse.json({ status: "error", message: "All fields are required." }, { status: 400 });
  }

  await connectToDatabase();

  const tokenHash = hashToken(token);
  const disableToken = await TwoFactorDisableToken.findOne({ tokenHash });

  if (!disableToken) {
    return NextResponse.json({ status: "error", message: "Invalid or expired link." }, { status: 404 });
  }
  if (disableToken.usedAt) {
    return NextResponse.json({ status: "error", message: "This link has already been used." }, { status: 410 });
  }
  if (disableToken.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ status: "error", message: "This link has expired." }, { status: 410 });
  }

  const user = await User.findById(disableToken.user);
  if (!user || user.email !== email.toLowerCase().trim()) {
    return NextResponse.json({ status: "error", message: "Email does not match this recovery link." }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ status: "error", message: "Incorrect password." }, { status: 401 });
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorTempSecret = undefined;
  user.backupCodeHashes = [];
  user.refreshTokenVersion += 1;
  await user.save();

  disableToken.usedAt = new Date();
  await disableToken.save();

  return NextResponse.json({ status: "ok", message: "Two-factor authentication has been disabled." });
}
