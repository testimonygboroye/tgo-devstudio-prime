import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/passwords";

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);

  if (!session) {
    return NextResponse.json({ status: "error", message: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const { password } = body as { password?: string };

  if (!password) {
    return NextResponse.json({ status: "error", message: "Password is required." }, { status: 400 });
  }

  await connectToDatabase();
  const user = await User.findById(session.user._id);

  if (!user) {
    return NextResponse.json({ status: "error", message: "User not found." }, { status: 404 });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ status: "error", message: "Incorrect password." }, { status: 401 });
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorTempSecret = undefined;
  user.backupCodeHashes = [];
  await user.save();

  return NextResponse.json({ status: "ok", message: "Two-factor authentication disabled." });
}
