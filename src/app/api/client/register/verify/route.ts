import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { hashVerificationToken } from "@/lib/clients/token";
import ClientRegistrationVerification from "@/models/ClientRegistrationVerification";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let token = "";
  try { token = String((await request.json()).token || ""); }
  catch { return NextResponse.json({ error: "Invalid verification request." }, { status: 400 }); }
  if (token.length < 30 || token.length > 200) return NextResponse.json({ error: "This verification link is invalid or expired. Request a new one." }, { status: 400 });

  await connectToDatabase();
  const record = await ClientRegistrationVerification.findOne({
    tokenHash: hashVerificationToken(token),
    expiresAt: { $gt: new Date() },
    consumedAt: { $exists: false },
  });
  if (!record) return NextResponse.json({ error: "This verification link is invalid or expired. Request a new one." }, { status: 400 });
  record.verifiedAt = new Date();
  await record.save();

  const response = NextResponse.json({ ok: true, email: record.email, message: "Email verified. Continue creating your client account." });
  response.cookies.set("tgo_client_registration_token", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/api/client/register", maxAge: 30 * 60,
  });
  return response;
}
