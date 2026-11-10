import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import ClientActivity from "@/models/ClientActivity";
import { verifyPassword, hashPassword } from "@/lib/auth/passwords";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client" || !session.user.isEmailVerified) return NextResponse.json({ error: "Verified client sign-in required." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
  if (!session.user.authProviders?.includes("password")) return NextResponse.json({ error: "This account uses Google sign-in only. Password changes require provider re-verification and are not enabled for this account." }, { status: 409 });
  if (!currentPassword || newPassword.length < 12 || Buffer.byteLength(newPassword, "utf8") > 72 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) return NextResponse.json({ error: "Enter your current password and a new password with 12–72 UTF-8 bytes, uppercase, lowercase and a number." }, { status: 400 });
  if (newPassword !== confirmPassword) return NextResponse.json({ error: "The new password and confirmation do not match." }, { status: 400 });
  if (currentPassword === newPassword) return NextResponse.json({ error: "Choose a new password that is different from your current password." }, { status: 400 });
  if (!await verifyPassword(currentPassword, session.user.passwordHash)) return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  await connectToDatabase();
  const user = await User.findOne({ _id: session.user._id, accountType: "client" });
  if (!user) return NextResponse.json({ error: "Client account not found." }, { status: 404 });
  user.passwordHash = await hashPassword(newPassword);
  user.refreshTokenVersion += 1;
  await user.save();
  await Promise.all([
    ClientActivity.create({ clientId: user._id, actorId: user._id, actorType: "client", action: "client.password_changed", summary: "Client password changed; existing sessions were revoked." }),
    writePlatformAuditEvent({ actorType: "human", actorId: String(user._id), actorLabel: user.name, action: "client.password_changed", module: "clients", targetType: "client", targetId: String(user._id), outcome: "success", metadata: { sessionsRevoked: true } }),
  ]);
  const response = NextResponse.json({ ok: true, message: "Password changed. Sign in again with your new password." });
  clearAuthCookies(response);
  return response;
}
