import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { hashVerificationToken } from "@/lib/clients/token";
import { validateClientRegistration } from "@/lib/clients/validation";
import { createClientIdentity } from "@/lib/clients/identity";
import { rememberClientAccount } from "@/lib/clients/account-selector";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import ClientRegistrationVerification from "@/models/ClientRegistrationVerification";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("tgo_client_registration_token")?.value || "";
  if (token.length < 30 || token.length > 200) return NextResponse.json({ error: "Verify your email first. The registration session is missing or expired." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid registration details." }, { status: 400 }); }

  await connectToDatabase();
  const verification = await ClientRegistrationVerification.findOne({
    tokenHash: hashVerificationToken(token), verifiedAt: { $exists: true },
    consumedAt: { $exists: false }, expiresAt: { $gt: new Date() },
  });
  if (!verification) return NextResponse.json({ error: "Your verified registration session has expired. Verify your email again." }, { status: 401 });

  const validation = validateClientRegistration({ ...body, email: verification.email });
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  try {
    const user = await createClientIdentity({
      name: validation.value.name, firstName: validation.value.firstName,
      middleName: validation.value.middleName, lastName: validation.value.lastName,
      email: verification.email, password: validation.value.password, source: "self_registration",
    });
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();
    verification.consumedAt = new Date();
    await verification.save();
    const response = NextResponse.json({ ok: true, message: "Your client account has been created. You can now sign in." }, { status: 201 });
    response.cookies.delete("tgo_client_registration_token");
    rememberClientAccount(response, request, verification.email);
    try {
      await writePlatformAuditEvent({ actorType: "human", actorId: String(user._id), actorLabel: user.name, action: "client.email_first_registration_completed", module: "clients", targetType: "client", targetId: String(user._id), outcome: "success" });
    } catch (error) { console.error("Client registration completion audit failed", error); }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Account creation failed.";
    const duplicate = (error as { code?: number })?.code === 11000 || message.includes("already exists");
    return NextResponse.json({ error: duplicate ? "A client account with this email already exists. Sign in instead." : message }, { status: duplicate ? 409 : 500 });
  }
}
