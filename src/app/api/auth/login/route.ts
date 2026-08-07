import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { verifyPassword } from "@/lib/auth/passwords";
import { signAccessToken, signRefreshToken, signTemp2FAToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json(
      { status: "error", message: "Email and password are required." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return NextResponse.json({ status: "error", message: "Invalid credentials." }, { status: 401 });
  }

  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    const minutesRemaining = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json(
      {
        status: "error",
        message: `Account temporarily locked due to repeated failed login attempts. Try again in ${minutesRemaining} minute(s).`,
      },
      { status: 423 }
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

    return NextResponse.json({ status: "error", message: "Invalid credentials." }, { status: 401 });
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  if (user.twoFactorEnabled) {
    const tempToken = signTemp2FAToken({ userId: user._id.toString() });
    return NextResponse.json({
      status: "2fa_required",
      tempToken,
    });
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

  const response = NextResponse.json({ status: "ok", message: "Logged in successfully." });
  setAuthCookies(response, accessToken, refreshToken);
  return response;
}
