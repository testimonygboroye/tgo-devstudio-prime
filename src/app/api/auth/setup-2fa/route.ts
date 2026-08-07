import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { generateTotpSecret, generateTotpQrCodeDataUrl } from "@/lib/auth/totp";

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);

  if (!session) {
    return NextResponse.json({ status: "error", message: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();

  const secret = generateTotpSecret();
  const qrCodeDataUrl = await generateTotpQrCodeDataUrl(session.user.email, secret);

  await User.findByIdAndUpdate(session.user._id, {
    twoFactorTempSecret: secret,
  });

  return NextResponse.json({
    status: "ok",
    secret,
    qrCodeDataUrl,
  });
}
