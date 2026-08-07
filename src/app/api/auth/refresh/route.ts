import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { verifyRefreshToken, signAccessToken } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json({ status: "error", message: "No refresh token provided." }, { status: 401 });
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid or expired refresh token." },
      { status: 401 }
    );
  }

  await connectToDatabase();

  const user = await User.findById(payload.userId);

  if (!user || user.refreshTokenVersion !== payload.tokenVersion) {
    return NextResponse.json(
      { status: "error", message: "Session no longer valid. Please log in again." },
      { status: 401 }
    );
  }

  const newAccessToken = signAccessToken({
    userId: user._id.toString(),
    roleId: user.role.toString(),
    tokenVersion: user.refreshTokenVersion,
  });

  const response = NextResponse.json({ status: "ok" });
  response.cookies.set("accessToken", newAccessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60,
  });

  return response;
}
