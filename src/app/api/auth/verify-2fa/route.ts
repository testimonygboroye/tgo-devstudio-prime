import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { verifyTemp2FAToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { verifyTotpToken } from "@/lib/auth/totp";
import { verifyAndConsumeBackupCode } from "@/lib/auth/backupCodes";
import { setAuthCookies } from "@/lib/auth/cookies";
import { apiError, apiSuccess } from "@/lib/i18n/apiResponse";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tempToken, code, isBackupCode } = body as {
    tempToken?: string;
    code?: string;
    isBackupCode?: boolean;
  };

  if (!tempToken || !code) {
    return apiError("allFieldsRequired", "All fields are required.", 400);
  }

  let payload;
  try {
    payload = verifyTemp2FAToken(tempToken);
  } catch {
    return apiError("sessionInvalid", "This 2FA session has expired. Please log in again.", 401);
  }

  await connectToDatabase();

  const user = await User.findById(payload.userId).select("+twoFactorSecret +backupCodeHashes");

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return apiError("sessionInvalid", "Invalid 2FA session.", 401);
  }

  let isCodeValid = false;

  if (isBackupCode) {
    const result = await verifyAndConsumeBackupCode(code, user.backupCodeHashes || []);
    isCodeValid = result.valid;
    if (isCodeValid) {
      user.backupCodeHashes = result.remainingHashes;
      await user.save();
    }
  } else {
    isCodeValid = await verifyTotpToken(code, user.twoFactorSecret);
  }

  if (!isCodeValid) {
    return apiError("invalid2faCode", "Invalid authentication code.", 401);
  }

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    roleId: user.role.toString(),
    tokenVersion: user.refreshTokenVersion,
  });
  const refreshToken = signRefreshToken({
    userId: user._id.toString(),
    tokenVersion: user.refreshTokenVersion,
  });

  const response = await apiSuccess({}, "loggedIn", "Logged in successfully.", 200);
  setAuthCookies(response, accessToken, refreshToken);
  return response;
}
