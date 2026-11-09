import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { clearAuthCookies } from "@/lib/auth/cookies";
import ClientActivity from "@/models/ClientActivity";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);

  if (session) {
    await connectToDatabase();
    await User.findByIdAndUpdate(session.user._id, {
      $inc: { refreshTokenVersion: 1 },
    });
    if (session.user.accountType === "client") {
      await Promise.all([
        ClientActivity.create({ clientId: session.user._id, actorId: session.user._id, actorType: "client", action: "client.signed_out", summary: "Client signed out." }),
        writePlatformAuditEvent({ actorType: "human", actorId: String(session.user._id), actorLabel: session.user.name, action: "client.signed_out", module: "clients", targetType: "client", targetId: String(session.user._id), outcome: "success" }),
      ]);
    }
  }

  const response = NextResponse.json({ status: "ok", message: "Logged out." });
  clearAuthCookies(response);
  return response;
}
