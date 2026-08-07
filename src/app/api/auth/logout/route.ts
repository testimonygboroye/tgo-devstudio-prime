import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { clearAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);

  if (session) {
    await connectToDatabase();
    await User.findByIdAndUpdate(session.user._id, {
      $inc: { refreshTokenVersion: 1 },
    });
  }

  const response = NextResponse.json({ status: "ok", message: "Logged out." });
  clearAuthCookies(response);
  return response;
}
