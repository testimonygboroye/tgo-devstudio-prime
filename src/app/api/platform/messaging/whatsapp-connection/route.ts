import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";
import { connectToDatabase } from "@/lib/db";
import UserWhatsAppConnection from "@/models/UserWhatsAppConnection";
import IntegrationConnection from "@/models/IntegrationConnection";
import { encryptCredentials, decryptCredentials } from "@/lib/integrations/crypto";
import { ensureWhatsAppRecipientIndexes } from "@/lib/messaging/whatsappIndexes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fail = (message: string, status = 400) => NextResponse.json({ status: "error", message }, { status });

async function getSharedSender() {
  const integration = await IntegrationConnection.findOne({ providerId: "whatsapp_cloud_api", status: "connected" }).select("+credentialsCiphertext");
  if (!integration) return null;
  try { return decryptCredentials(integration.credentialsCiphertext); } catch { return null; }
}

async function verifyBusinessPhone(phoneNumberId: string, accessToken: string) {
  const response = await fetch("https://graph.facebook.com/v22.0/" + encodeURIComponent(phoneNumberId) + "?fields=display_phone_number,verified_name", {
    headers: { Authorization: "Bearer " + accessToken },
    signal: AbortSignal.timeout(12000),
    cache: "no-store",
  }).catch(() => null);
  if (!response?.ok) return null;
  return await response.json().catch(() => null) as { display_phone_number?: string; verified_name?: string } | null;
}

async function authorize(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return { response: unauthorizedResponse() } as const;
  if (session.user.accountType !== "staff" && session.user.accountType !== "client") return { response: forbiddenResponse() } as const;
  if (session.user.accountType === "client" && !session.user.isEmailVerified) return { response: forbiddenResponse("Verify your email before connecting WhatsApp.") } as const;
  return { session } as const;
}

export async function GET(request: NextRequest) {
  const auth = await authorize(request); if ("response" in auth) return auth.response;
  await connectToDatabase();
  await ensureWhatsAppRecipientIndexes();
  const row = await UserWhatsAppConnection.findOne({ userId: auth.session.user._id }).select("+credentialsCiphertext").lean();
  if (!row) return NextResponse.json({ status: "ok", connected: false, sharedSenderConfigured: Boolean(await getSharedSender()) });
  let credentials: Record<string, string> = {};
  try { if (row.credentialsCiphertext) credentials = decryptCredentials(row.credentialsCiphertext); } catch {}
  const shared = credentials.accessToken ? null : await getSharedSender();
  return NextResponse.json({
    status: "ok",
    connected: row.status === "connected",
    personalPhoneNumber: row.personalPhoneNumber,
    displayPhone: credentials.displayPhone || shared?.displayPhone || "",
    lastVerifiedAt: row.lastVerifiedAt || null,
    optedIn: Boolean(row.optInAt),
    sharedSenderConfigured: Boolean(shared || credentials.accessToken),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const auth = await authorize(request); if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const personalPhoneNumber = String(body.personalPhoneNumber || "").replace(/[^0-9]/g, "");
  if (personalPhoneNumber.length < 8 || personalPhoneNumber.length > 15) return fail("Enter your WhatsApp number in international format, digits only (example: 2348012345678).");
  if (body.consent !== true) return fail("Explicit consent is required before TGO can send WhatsApp messages to this number.");

  await connectToDatabase();
  await ensureWhatsAppRecipientIndexes();

  // Legacy per-user sender credentials remain supported during migration.
  const accessToken = String(body.accessToken || "").trim();
  const legacyPhoneNumberId = String(body.phoneNumberId || "").trim();
  const businessAccountId = String(body.businessAccountId || "").trim();
  const appSecret = String(body.appSecret || "").trim();
  const webhookVerifyToken = String(body.webhookVerifyToken || "").trim();
  const legacyMode = Boolean(accessToken && legacyPhoneNumberId && businessAccountId && appSecret && webhookVerifyToken);
  const shared = legacyMode ? null : await getSharedSender();
  const sender = legacyMode ? {
    accessToken,
    phoneNumberId: legacyPhoneNumberId,
    businessAccountId,
    appSecret,
    webhookVerifyToken,
  } : shared;

  if (!sender?.accessToken || !sender.phoneNumberId || !sender.businessAccountId) {
    return fail("TGO's WhatsApp Cloud API sender is not configured yet. The founder must connect WhatsApp Cloud API in Admin → Integrations first.", 503);
  }

  const meta = await verifyBusinessPhone(sender.phoneNumberId, sender.accessToken);
  if (!meta) return fail("Meta could not verify TGO's WhatsApp sender. Ask the administrator to check the integration credentials.", 502);

  const conflict = await UserWhatsAppConnection.findOne({ personalPhoneNumber, userId: { $ne: auth.session.user._id }, status: "connected" });
  if (conflict) return fail("This WhatsApp destination is already registered to another TGO account. Disconnect it there first.", 409);

  const set: Record<string, unknown> = {
    phoneNumberId: sender.phoneNumberId,
    businessAccountId: sender.businessAccountId,
    personalPhoneNumber,
    status: "connected",
    lastVerifiedAt: new Date(),
    lastInboundAt: undefined,
    optInAt: new Date(),
    consentSource: auth.session.user.accountType === "client" ? "client_settings" : auth.session.role.isFounderRole ? "founder_settings" : "staff_settings",
    lastError: "",
  };
  if (legacyMode) set.credentialsCiphertext = encryptCredentials({ accessToken, appSecret, webhookVerifyToken, displayPhone: meta.display_phone_number || "" });
  const update = await UserWhatsAppConnection.findOneAndUpdate(
    { userId: auth.session.user._id },
    { $set: set, $setOnInsert: { userId: auth.session.user._id }, ...(legacyMode ? {} : { $unset: { credentialsCiphertext: 1 } }) },
    { upsert: true, new: true, runValidators: true },
  );
  return NextResponse.json({
    status: "ok",
    connected: true,
    displayPhone: meta.display_phone_number || "",
    personalPhoneNumber,
    message: "Your WhatsApp destination is registered. Delivery will occur only when Meta's messaging rules and recipient-consent requirements permit it.",
  });
}

export async function DELETE(request: NextRequest) {
  const auth = await authorize(request); if ("response" in auth) return auth.response;
  await connectToDatabase();
  await UserWhatsAppConnection.updateOne({ userId: auth.session.user._id }, { $set: { status: "disconnected" }, $unset: { optInAt: 1, lastInboundAt: 1, currentConversationId: 1 } });
  return NextResponse.json({ status: "ok", connected: false });
}
