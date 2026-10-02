import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import { verifyPassword } from "@/lib/auth/passwords";
import { signAccessToken, signRefreshToken, signTemp2FAToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { apiError, apiSuccess } from "@/lib/i18n/apiResponse";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return apiError("emailPasswordRequired", "Email and password are required.", 400);
  }

  await connectToDatabase();

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return apiError("invalidCredentials", "Invalid credentials.", 401);
  }

  if (user.isBanned) {
    return apiError(
      "accountSuspended",
      "This account has been suspended. Contact the Founder if you believe this is a mistake.",
      403
    );
  }

  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    const minutesRemaining = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    return apiError(
      "accountLocked",
      `Account temporarily locked due to repeated failed login attempts. Try again in ${minutesRemaining} minute(s).`,
      423,
      { minutes: minutesRemaining }
    );
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.failedLoginAttempts = 0;
    }

    await user.save();

    return apiError("invalidCredentials", "Invalid credentials.", 401);
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  if (user.twoFactorEnabled) {
    let skipTwoFactor = false;

    if (process.env.TWO_FACTOR_ENABLED === "false") {
      const role = await Role.findById(user.role).select("isFounderRole");
      skipTwoFactor = Boolean(role?.isFounderRole);
    }

    if (!skipTwoFactor) {
      const tempToken = signTemp2FAToken({ userId: user._id.toString() });
      return NextResponse.json({
        status: "2fa_required",
        tempToken,
      });
    }
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
