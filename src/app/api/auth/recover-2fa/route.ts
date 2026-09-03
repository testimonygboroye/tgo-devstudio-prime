import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import TwoFactorDisableToken from "@/models/TwoFactorDisableToken";
import { verifyPassword } from "@/lib/auth/passwords";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { send2FARecoveryEmail } from "@/lib/email/send2FARecovery";
import { getAdminBasePath } from "@/lib/adminPath";

const DISABLE_TOKEN_EXPIRY_MS = 30 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };

  const genericSuccess = NextResponse.json({
    status: "ok",
    message:
      "If the details are correct and two-factor authentication is enabled on that account, a disable link has been emailed.",
  });

  if (!email || !password) {
    return NextResponse.json({ status: "error", message: "Email and password are required." }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return genericSuccess;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return genericSuccess;
  }

  if (!user.twoFactorEnabled) {
    return genericSuccess;
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  await TwoFactorDisableToken.create({
    user: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + DISABLE_TOKEN_EXPIRY_MS),
  });

  const basePath = getAdminBasePath();
  const siteUrl = process.env.SITE_URL || "";
  const disableUrl = `${siteUrl}${basePath}/disable-2fa-confirm?token=${rawToken}`;

  await send2FARecoveryEmail({ toEmail: user.email, toName: user.name, disableUrl });

  return genericSuccess;
}
