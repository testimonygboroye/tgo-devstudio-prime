import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { createClientIdentity } from "@/lib/clients/identity";
import { validateClientRegistration } from "@/lib/clients/validation";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const dynamic = "force-dynamic";

type GoogleTokenInfo = {
  sub?: string; email?: string; email_verified?: string | boolean;
  aud?: string; azp?: string; name?: string;
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid registration request." }, { status: 400 }); }

  const validation = validateClientRegistration(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Google registration is not configured on this deployment." }, { status: 503 });

  const idToken = typeof body.credential === "string" ? body.credential : "";
  const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
  if (!idToken && !accessToken) return NextResponse.json({ error: "Google did not provide a verifiable account credential." }, { status: 400 });

  try {
    const verifyUrl = idToken
      ? new URL("https://oauth2.googleapis.com/tokeninfo")
      : new URL("https://oauth2.googleapis.com/tokeninfo");
    if (idToken) verifyUrl.searchParams.set("id_token", idToken);
    else verifyUrl.searchParams.set("access_token", accessToken);

    const verifyResponse = await fetch(verifyUrl, { cache: "no-store" });
    if (!verifyResponse.ok) return NextResponse.json({ error: "Google account verification failed. Please try again." }, { status: 401 });
    const google = await verifyResponse.json() as GoogleTokenInfo;
    const verified = google.email_verified === true || google.email_verified === "true";
    const audienceMatches = google.aud === clientId || google.azp === clientId;
    const email = String(google.email || "").trim().toLowerCase();
    if (!google.sub || !email || !verified || (idToken && !audienceMatches)) {
      return NextResponse.json({ error: "The Google account could not be verified for this application." }, { status: 401 });
    }

    const input = validation.value;
    if (input.email !== email) {
      return NextResponse.json({ error: "The email address must match the verified Google account." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await createClientIdentity({
      name: input.name,
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      email,
      password: input.password,
      googleSub: google.sub,
      source: "google",
    });

    await writePlatformAuditEvent({
      actorType: "human",
      actorId: String(user._id),
      actorLabel: user.name,
      action: "client.account_registered",
      module: "clients",
      targetType: "client",
      targetId: String(user._id),
      outcome: "success",
      metadata: { source: "google_password_registration", emailVerifiedBy: "google" },
    });

    return NextResponse.json({
      ok: true,
      verified: true,
      message: "Your account has been created and your Google email has been verified. You can now sign in with your password or Google.",
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google registration could not be completed.";
    const duplicate = (error as { code?: number })?.code === 11000 || message.includes("already exists");
    return NextResponse.json({ error: duplicate ? "A client account with this email already exists. Sign in to the existing account." : message }, { status: duplicate ? 409 : 500 });
  }
}
