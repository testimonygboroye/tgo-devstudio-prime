import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { verifyTotpToken } from "@/lib/auth/totp";

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);

  if (!session) {
    return NextResponse.json({ status: "error", message: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const { code } = body as { code?: string };

  if (!code) {
    return NextResponse.json({ status: "error", message: "code is required." }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findById(session.user._id).select("+twoFactorTempSecret");

  if (!user || !user.twoFactorTempSecret) {
    return NextResponse.json(
      { status: "error", message: "No 2FA setup in progress. Call setup-2fa first." },
      { status: 400 }
    );
  }

  const isCodeValid = await verifyTotpToken(code, user.twoFactorTempSecret);

  if (!isCodeValid) {
    return NextResponse.json({ status: "error", message: "Invalid authentication code." }, { status: 401 });
  }

  user.twoFactorSecret = user.twoFactorTempSecret;
  user.twoFactorTempSecret = undefined;
  user.twoFactorEnabled = true;
  await user.save();

  return NextResponse.json({ status: "ok", message: "Two-factor authentication enabled." });
}
