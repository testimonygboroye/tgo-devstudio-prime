import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { verifyTemp2FAToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { verifyTotpToken } from "@/lib/auth/totp";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tempToken, code } = body as { tempToken?: string; code?: string };

  if (!tempToken || !code) {
    return NextResponse.json(
      { status: "error", message: "tempToken and code are both required." },
      { status: 400 }
    );
  }

  let payload;
  try {
    payload = verifyTemp2FAToken(tempToken);
  } catch {
    return NextResponse.json(
      { status: "error", message: "This 2FA session has expired. Please log in again." },
      { status: 401 }
    );
  }

  await connectToDatabase();

  const user = await User.findById(payload.userId).select("+twoFactorSecret");

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ status: "error", message: "Invalid 2FA session." }, { status: 401 });
  }

  const isCodeValid = verifyTotpToken(code, user.twoFactorSecret);

  if (!isCodeValid) {
    return NextResponse.json({ status: "error", message: "Invalid authentication code." }, { status: 401 });
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
