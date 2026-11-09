import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { createClientIdentity } from "@/lib/clients/identity";
import { createEmailVerification, sendClientVerificationEmail } from "@/lib/clients/email";
import ClientProfile from "@/models/ClientProfile";
import User from "@/models/User";
import ClientEmailVerification from "@/models/ClientEmailVerification";
import { validateClientRegistration } from "@/lib/clients/validation";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const validation = validateClientRegistration(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const { name, email, password } = validation.value;
  await connectToDatabase();
  let user;
  try {
    user = await createClientIdentity({ name, email, password, source: "self_registration" });
    const token = await createEmailVerification(String(user._id));
    await sendClientVerificationEmail(email, name, token);
    await writePlatformAuditEvent({ actorType: "human", actorId: String(user._id), actorLabel: name, action: "client.account_registered", module: "clients", targetType: "client", targetId: String(user._id), outcome: "success", metadata: { source: "self_registration" } });
    return NextResponse.json({ ok: true, message: "Account created. Check your email for the verification link." }, { status: 201 });
  } catch (error) {
    if (user?._id) {
      await Promise.all([
        ClientEmailVerification.deleteMany({ userId: user._id }),
        ClientProfile.deleteOne({ userId: user._id }),
        User.deleteOne({ _id: user._id, isEmailVerified: false }),
      ]);
    }
    const message = error instanceof Error ? error.message : "Registration could not be completed.";
    const status = message.includes("already exists") ? 409 : message.includes("not configured") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
