import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { verifyPassword } from "@/lib/auth/passwords";
import { generateTotpSecret } from "@/lib/auth/totp";
import { generateBackupCodes, hashBackupCodes } from "@/lib/auth/backupCodes";
import { send2FARecoveryEmail } from "@/lib/email/send2FARecovery";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };

  const genericSuccess = NextResponse.json({
    status: "ok",
    message:
      "If the details are correct and two-factor authentication is enabled on that account, new recovery details have been emailed.",
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

  const newSecret = generateTotpSecret();
  const backupCodes = generateBackupCodes();
  const backupCodeHashes = await hashBackupCodes(backupCodes);

  user.twoFactorSecret = newSecret;
  user.twoFactorTempSecret = undefined;
  user.backupCodeHashes = backupCodeHashes;
  user.refreshTokenVersion += 1;
  await user.save();

  await send2FARecoveryEmail({
    toEmail: user.email,
    toName: user.name,
    secret: newSecret,
    backupCodes,
  });

  return genericSuccess;
}
