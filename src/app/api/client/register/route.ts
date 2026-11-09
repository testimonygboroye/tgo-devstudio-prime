import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { createClientIdentity } from "@/lib/clients/identity";
import { createEmailVerification, sendClientVerificationEmail } from "@/lib/clients/email";
import ClientProfile from "@/models/ClientProfile";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Enter your name (2–120 characters)." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json({ error: "Use at least 12 characters with uppercase, lowercase and a number." }, { status: 400 });
  }
  await connectToDatabase();
  let user;
  try {
    user = await createClientIdentity({ name, email, password, source: "self_registration" });
    const token = await createEmailVerification(String(user._id));
    await sendClientVerificationEmail(email, name, token);
    return NextResponse.json({ ok: true, message: "Account created. Check your email for the verification link." }, { status: 201 });
  } catch (error) {
    if (user?._id) {
      await Promise.all([
        ClientProfile.deleteOne({ userId: user._id }),
        User.deleteOne({ _id: user._id, isEmailVerified: false }),
      ]);
    }
    const message = error instanceof Error ? error.message : "Registration could not be completed.";
    const status = message.includes("already exists") ? 409 : message.includes("not configured") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
