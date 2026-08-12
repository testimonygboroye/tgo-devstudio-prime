import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import { hashToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/passwords";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, password, confirmPassword } = body as {
    token?: string;
    password?: string;
    confirmPassword?: string;
  };

  if (!token || !password || !confirmPassword) {
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
  const resetToken = await PasswordResetToken.findOne({ tokenHash });

  if (!resetToken) {
    return NextResponse.json({ status: "error", message: "Invalid or expired reset link." }, { status: 404 });
  }
  if (resetToken.usedAt) {
    return NextResponse.json({ status: "error", message: "This reset link has already been used." }, { status: 410 });
  }
  if (resetToken.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ status: "error", message: "This reset link has expired." }, { status: 410 });
  }

  const user = await User.findById(resetToken.user);
  if (!user) {
    return NextResponse.json({ status: "error", message: "User not found." }, { status: 404 });
  }

  user.passwordHash = await hashPassword(password);
  user.refreshTokenVersion += 1;
  await user.save();

  resetToken.usedAt = new Date();
  await resetToken.save();

  return NextResponse.json({ status: "ok", message: "Password reset successfully. You can now log in." });
}
