import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { verifyTotpToken } from "@/lib/auth/totp";
import { generateBackupCodes, hashBackupCodes } from "@/lib/auth/backupCodes";
import { apiError, apiSuccess } from "@/lib/i18n/apiResponse";

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);

  if (!session) {
    return apiError("unauthorized", "Not authenticated.", 401);
  }

  const body = await request.json();
  const { code } = body as { code?: string };

  if (!code) {
    return apiError("allFieldsRequired", "All fields are required.", 400);
  }

  await connectToDatabase();

  const user = await User.findById(session.user._id).select("+twoFactorTempSecret");

  if (!user || !user.twoFactorTempSecret) {
    return apiError("invalid2faCode", "No 2FA setup in progress. Call setup-2fa first.", 400);
  }

  const isCodeValid = await verifyTotpToken(code, user.twoFactorTempSecret);

  if (!isCodeValid) {
    return apiError("invalid2faCode", "Invalid authentication code.", 401);
  }

  const backupCodes = generateBackupCodes();
  const backupCodeHashes = await hashBackupCodes(backupCodes);

  user.twoFactorSecret = user.twoFactorTempSecret;
  user.twoFactorTempSecret = undefined;
  user.twoFactorEnabled = true;
  user.backupCodeHashes = backupCodeHashes;
  await user.save();

  return apiSuccess({ backupCodes }, "twoFactorEnabled", "Two-factor authentication enabled.", 200);
}
