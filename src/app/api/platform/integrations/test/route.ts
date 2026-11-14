import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import IntegrationConnection from "@/models/IntegrationConnection";
import { getIntegrationProvider } from "@/lib/integrations/registry";
import { decryptCredentials } from "@/lib/integrations/crypto";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
export const dynamic = "force-dynamic";
const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
async function verify(providerId: string, credentials: Record<string, string>): Promise<void> {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    let response: Response;
    if (providerId === "brevo") {
      const accountResponse = await fetch("https://api.brevo.com/v3/account", { headers: { "api-key": credentials.apiKey, accept: "application/json" }, signal: controller.signal, cache: "no-store" });
      if (!accountResponse.ok) {
        if (accountResponse.status === 401 || accountResponse.status === 403) throw new Error("Brevo rejected the API key. Create or copy the correct v3 API key from your Brevo account.");
        throw new Error("Brevo account verification returned HTTP " + accountResponse.status + ".");
      }
      const senderEmail = String(credentials.senderEmail || "").trim().toLowerCase();
      const senderResponse = await fetch("https://api.brevo.com/v3/senders", { headers: { "api-key": credentials.apiKey, accept: "application/json" }, signal: controller.signal, cache: "no-store" });
      if (!senderResponse.ok) throw new Error("Brevo accepted the API key, but sender verification could not be completed (HTTP " + senderResponse.status + ").");
      const senderPayload = await senderResponse.json().catch(() => ({}));
      const sender = (Array.isArray(senderPayload.senders) ? senderPayload.senders : []).find((item: { email?: string }) => String(item.email || "").trim().toLowerCase() === senderEmail);
      if (!senderEmail || !sender || sender.active !== true) {
        throw new Error("Brevo API access is valid, but the configured sender " + (senderEmail || "(empty)") + " is missing or not active/verified. Verify this exact sender in Brevo, then test again.");
      }
      return;
    }
    else if (providerId === "paystack") response = await fetch("https://api.paystack.co/balance", { headers: { Authorization: `Bearer ${credentials.secretKey}`, accept: "application/json" }, signal: controller.signal, cache: "no-store" });
    else if (providerId === "github") response = await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${credentials.token}`, accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }, signal: controller.signal, cache: "no-store" });
    else if (providerId === "vercel") response = await fetch("https://api.vercel.com/v2/user", { headers: { Authorization: `Bearer ${credentials.token}`, accept: "application/json" }, signal: controller.signal, cache: "no-store" });
    else if (providerId === "whatsapp_cloud_api") response = await fetch("https://graph.facebook.com/v22.0/" + encodeURIComponent(credentials.phoneNumberId) + "?fields=display_phone_number,verified_name", { headers: { Authorization: "Bearer " + credentials.accessToken, accept: "application/json" }, signal: controller.signal, cache: "no-store" });
    else if (providerId === "twilio") response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(credentials.accountSid)}.json`, { headers: { Authorization: `Basic ${Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString("base64")}` }, signal: controller.signal, cache: "no-store" });
    else throw new Error("A dedicated OAuth flow is required for this provider.");
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error("The provider rejected these credentials or their permissions.");
      throw new Error(`Provider verification returned HTTP ${response.status}.`);
    }
  } finally { clearTimeout(timeout); }
}
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return fail("Authentication required.", 401);
  if (!session.role.isFounderRole) return fail("Founder access required.", 403);
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return fail("Invalid request body."); }
  const providerId = typeof body.providerId === "string" ? body.providerId : "";
  const provider = getIntegrationProvider(providerId); if (!provider) return fail("Unknown provider.");
  if (!provider.testable) return fail("This connector requires OAuth authorization and cannot be tested with an API key.", 409);
  await connectToDatabase();
  const row = await IntegrationConnection.findOne({ providerId }).select("+credentialsCiphertext");
  if (!row || row.status === "disconnected") return fail("Save active credentials before testing this connection.", 409);
  let errorMessage = "";
  try {
    const credentials = decryptCredentials(row.credentialsCiphertext);
    await verify(providerId, credentials);
    row.status = "connected"; row.lastVerifiedAt = new Date(); row.lastError = "";
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Connection test failed.";
    row.status = "error"; row.lastError = errorMessage.slice(0, 300);
  }
  row.updatedBy = String(session.user._id); await row.save();
  await writePlatformAuditEvent({ actorType: "human", actorId: String(session.user._id), actorLabel: session.user.name, action: "integration.connection_tested", module: "integrations", targetType: "IntegrationConnection", targetId: String(row._id), outcome: errorMessage ? "failure" : "success", metadata: { providerId, status: row.status } });
  if (errorMessage) return fail(errorMessage, 502);
  return NextResponse.json({ status: row.status, lastVerifiedAt: row.lastVerifiedAt, message: "Provider credentials were accepted by the provider's read-only verification endpoint." });
}
