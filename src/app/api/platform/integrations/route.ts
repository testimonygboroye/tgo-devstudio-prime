import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import IntegrationConnection from "@/models/IntegrationConnection";
import { INTEGRATION_REGISTRY, getIntegrationProvider } from "@/lib/integrations/registry";
import { encryptCredentials, decryptCredentials } from "@/lib/integrations/crypto";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
export const dynamic = "force-dynamic";
const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
async function founder() {
  const session = await getServerSession();
  if (!session) return { response: fail("Authentication required.", 401) } as const;
  if (!session.role.isFounderRole) return { response: fail("Founder access required.", 403) } as const;
  return { session } as const;
}
function serialize(row: Record<string, unknown>) {
  return { id: String(row._id), providerId: row.providerId, displayName: row.displayName, category: row.category, status: row.status, credentialNames: row.credentialNames || [], lastVerifiedAt: row.lastVerifiedAt || null, lastError: row.lastError || "", updatedAt: row.updatedAt };
}
export async function GET() {
  const auth = await founder(); if ("response" in auth) return auth.response;
  await connectToDatabase();
  const rows = await IntegrationConnection.find({}).sort({ category: 1, displayName: 1 }).lean();
  const connected = new Map(rows.map((row) => [row.providerId, serialize(row as unknown as Record<string, unknown>)]));
  return NextResponse.json({ providers: INTEGRATION_REGISTRY.map((provider) => ({ ...provider, connection: connected.get(provider.id) || null })), encryptionReady: Boolean(process.env.INTEGRATION_CREDENTIALS_KEY && (() => { try { const value = process.env.INTEGRATION_CREDENTIALS_KEY!; return /^[a-f0-9]{64}$/i.test(value) || Buffer.from(value, "base64").length === 32; } catch { return false; } })()) }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(request: NextRequest) {
  const auth = await founder(); if ("response" in auth) return auth.response;
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return fail("Invalid request body."); }
  const providerId = typeof body.providerId === "string" ? body.providerId : "";
  const provider = getIntegrationProvider(providerId);
  if (!provider) return fail("Unknown integration provider.");
  if (!provider.fields.length) return fail("This provider requires its dedicated OAuth authorization flow; API credentials cannot be entered here.", 409);
  const raw = body.credentials;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("Credentials are required.");
  const credentials: Record<string, string> = {};
  for (const field of provider.fields) {
    const value = (raw as Record<string, unknown>)[field.key];
    if (typeof value !== "string" || !value.trim() || value.length > 4000) return fail(`A valid ${field.label.toLowerCase()} is required.`);
    credentials[field.key] = value.trim();
  }
  let encrypted: string; try { encrypted = encryptCredentials(credentials); } catch (error) { return fail(error instanceof Error ? error.message : "Credential encryption is unavailable.", 503); }
  await connectToDatabase();
  const id = String(auth.session.user._id);
  const row = await IntegrationConnection.findOneAndUpdate({ providerId }, { $set: { displayName: provider.name, category: provider.category, status: "configured", credentialsCiphertext: encrypted, credentialNames: provider.fields.map((field) => field.label), lastError: "", updatedBy: id }, $setOnInsert: { createdBy: id } }, { upsert: true, new: true, runValidators: true });
  await writePlatformAuditEvent({ actorType: "human", actorId: id, actorLabel: auth.session.user.name, action: "integration.credentials_saved", module: "integrations", targetType: "IntegrationConnection", targetId: String(row._id), outcome: "success", metadata: { providerId, credentialNames: provider.fields.map((field) => field.label) } });
  return NextResponse.json({ connection: serialize(row.toObject() as unknown as Record<string, unknown>), message: "Credentials encrypted and saved. Run a connection test before relying on this provider." }, { status: 201 });
}
export async function PATCH(request: NextRequest) {
  const auth = await founder(); if ("response" in auth) return auth.response;
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return fail("Invalid request body."); }
  if (body.action !== "disconnect" || typeof body.providerId !== "string") return fail("Unsupported integration action.");
  await connectToDatabase();
  const row = await IntegrationConnection.findOne({ providerId: body.providerId }).select("+credentialsCiphertext");
  if (!row) return fail("Integration is not configured.", 404);
  row.status = "disconnected"; row.credentialsCiphertext = encryptCredentials({}); row.lastError = "Disconnected by founder."; row.updatedBy = String(auth.session.user._id);
  await row.save();
  await writePlatformAuditEvent({ actorType: "human", actorId: String(auth.session.user._id), actorLabel: auth.session.user.name, action: "integration.disconnected", module: "integrations", targetType: "IntegrationConnection", targetId: String(row._id), outcome: "success", metadata: { providerId: row.providerId } });
  return NextResponse.json({ connection: serialize(row.toObject() as unknown as Record<string, unknown>) });
}
