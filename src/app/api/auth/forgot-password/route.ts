import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { sendPasswordResetEmail } from "@/lib/email/sendPasswordReset";
import { getAdminBasePath } from "@/lib/adminPath";

const RESET_EXPIRY_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email } = body as { email?: string };

  if (!email) {
    return NextResponse.json({ status: "error", message: "Email is required." }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (user) {
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_EXPIRY_MS),
    });

    const basePath = getAdminBasePath();
    const siteUrl = process.env.SITE_URL || "";
    const resetUrl = `${siteUrl}${basePath}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({ toEmail: user.email, resetUrl });
  }

  return NextResponse.json({
    status: "ok",
    message: "If an account exists with that email, a reset link has been sent.",
  });
}
