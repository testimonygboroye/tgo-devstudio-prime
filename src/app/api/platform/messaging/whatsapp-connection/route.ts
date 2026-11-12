import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";
import { connectToDatabase } from "@/lib/db";
import UserWhatsAppConnection from "@/models/UserWhatsAppConnection";
import { encryptCredentials, decryptCredentials } from "@/lib/integrations/crypto";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fail = (message: string, status = 400) => NextResponse.json({ status: "error", message }, { status });
export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request); if (!session) return unauthorizedResponse();
  if (session.user.accountType !== "staff") return forbiddenResponse();
  await connectToDatabase();
  const row = await UserWhatsAppConnection.findOne({ userId: session.user._id }).select("+credentialsCiphertext").lean();
  if (!row) return NextResponse.json({ status: "ok", connected: false });
  let displayPhone = ""; try { displayPhone = decryptCredentials(row.credentialsCiphertext).displayPhone || ""; } catch {}
  return NextResponse.json({ status: "ok", connected: row.status === "connected", personalPhoneNumber: row.personalPhoneNumber, displayPhone, lastVerifiedAt: row.lastVerifiedAt || null });
}
export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request); if (!session) return unauthorizedResponse();
  if (session.user.accountType !== "staff") return forbiddenResponse();
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const accessToken = String(body.accessToken || "").trim(), phoneNumberId = String(body.phoneNumberId || "").trim();
  const businessAccountId = String(body.businessAccountId || "").trim(), appSecret = String(body.appSecret || "").trim();
  const webhookVerifyToken = String(body.webhookVerifyToken || "").trim();
  const personalPhoneNumber = String(body.personalPhoneNumber || "").replace(/[^0-9]/g, "");
  if ([accessToken, phoneNumberId, businessAccountId, appSecret, webhookVerifyToken, personalPhoneNumber].some(v => !v)) return fail("Complete every WhatsApp connection field.");
  if (personalPhoneNumber.length < 8 || personalPhoneNumber.length > 15) return fail("Enter your personal WhatsApp number in international format, digits only (example: 2348012345678).");
  const response = await fetch("https://graph.facebook.com/v22.0/" + encodeURIComponent(phoneNumberId) + "?fields=display_phone_number,verified_name", { headers: { Authorization: "Bearer " + accessToken }, signal: AbortSignal.timeout(12000), cache: "no-store" }).catch(() => null);
  if (!response?.ok) return fail("Meta could not verify this WhatsApp Business phone number. Check the token and Phone Number ID.", 502);
  const meta = await response.json().catch(() => ({})) as { display_phone_number?: string };
  await connectToDatabase();
  const conflict = await UserWhatsAppConnection.findOne({ phoneNumberId, userId: { $ne: session.user._id } });
  if (conflict) return fail("This WhatsApp Business phone number is already connected to another platform account.", 409);
  const credentialsCiphertext = encryptCredentials({ accessToken, appSecret, webhookVerifyToken, displayPhone: meta.display_phone_number || "" });
  await UserWhatsAppConnection.findOneAndUpdate({ userId: session.user._id },
    { $set: { phoneNumberId, businessAccountId, personalPhoneNumber, credentialsCiphertext, status: "connected", lastVerifiedAt: new Date(), lastError: "" }, $setOnInsert: { userId: session.user._id } },
    { upsert: true, new: true, runValidators: true });
  return NextResponse.json({ status: "ok", connected: true, displayPhone: meta.display_phone_number || "", personalPhoneNumber, message: "Your personal WhatsApp connection is verified and encrypted." });
}
export async function DELETE(request: NextRequest) {
  const session = await getAuthenticatedSession(request); if (!session) return unauthorizedResponse();
  if (session.user.accountType !== "staff") return forbiddenResponse();
  await connectToDatabase(); await UserWhatsAppConnection.deleteOne({ userId: session.user._id });
  return NextResponse.json({ status: "ok", connected: false });
}
