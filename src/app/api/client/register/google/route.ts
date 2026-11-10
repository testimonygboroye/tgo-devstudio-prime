import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { createClientIdentity } from "@/lib/clients/identity";
import { validateClientRegistration } from "@/lib/clients/validation";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import { hashVerificationToken } from "@/lib/clients/token";
import ClientRegistrationVerification from "@/models/ClientRegistrationVerification";

export const dynamic = "force-dynamic";
type GoogleTokenInfo = { sub?: string; email?: string; email_verified?: string | boolean; aud?: string; azp?: string; name?: string };

async function verifyGoogle(body: Record<string, unknown>, clientId: string) {
  const idToken = typeof body.credential === "string" ? body.credential : "";
  const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
  if (!idToken && !accessToken) throw new Error("Google did not provide a verifiable account credential.");
  const verifyUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
  if (idToken) verifyUrl.searchParams.set("id_token", idToken);
  else verifyUrl.searchParams.set("access_token", accessToken);
  const response = await fetch(verifyUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("Google account verification failed. Please try again.");
  const google = await response.json() as GoogleTokenInfo;
  const verified = google.email_verified === true || google.email_verified === "true";
  const audienceMatches = google.aud === clientId || google.azp === clientId;
  const email = String(google.email || "").trim().toLowerCase();
  if (!google.sub || !email || !verified || !audienceMatches) throw new Error("The Google account could not be verified for this application.");
  return { google, email };
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid registration request." }, { status: 400 }); }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Google registration is not configured on this deployment." }, { status: 503 });

  try {
    const { google, email } = await verifyGoogle(body, clientId);
    await connectToDatabase();

    if (body.verifyOnly === true) {
      const existing = await (await import("@/models/User")).default.findOne({ email, accountType: "client" }).select("_id");
      if (existing) return NextResponse.json({ error: "A client account already exists with this email. Please sign in instead." }, { status: 409 });
      const token = randomBytes(32).toString("base64url");
      await ClientRegistrationVerification.deleteMany({ email, consumedAt: { $exists: false } });
      await ClientRegistrationVerification.create({
        email, googleSub: google.sub, tokenHash: hashVerificationToken(token),
        verifiedAt: new Date(), expiresAt: new Date(Date.now() + 30 * 60_000),
      });
      const response = NextResponse.json({ ok: true, verified: true, email, message: "Google verified your email. Continue creating your account." });
      response.cookies.set("tgo_client_registration_token", token, {
        httpOnly: true, secure: process.env.NODE_ENV === "production",
        sameSite: "lax", path: "/api/client/register", maxAge: 30 * 60,
      });
      return response;
    }

    const validation = validateClientRegistration(body);
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
    if (validation.value.email !== email) return NextResponse.json({ error: "The email address must match the verified Google account." }, { status: 400 });

    const input = validation.value;
    const user = await createClientIdentity({
      name: input.name, firstName: input.firstName, middleName: input.middleName,
      lastName: input.lastName, email, password: input.password,
      googleSub: google.sub, source: "google",
    });
    try {
      await writePlatformAuditEvent({
        actorType: "human", actorId: String(user._id), actorLabel: user.name,
        action: "client.account_registered", module: "clients", targetType: "client",
        targetId: String(user._id), outcome: "success",
        metadata: { source: "google_password_registration", emailVerifiedBy: "google" },
      });
    } catch (auditError) { console.error("Google client registration audit write failed", auditError); }
    return NextResponse.json({
      ok: true, verified: true,
      googleAccount: { email, name: google.name || input.name },
      message: "Your account has been created. You can now sign in with your password or Google.",
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google registration could not be completed.";
    const duplicate = (error as { code?: number })?.code === 11000 || message.includes("already exists");
    const status = duplicate ? 409 : message.includes("not configured") ? 503 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
