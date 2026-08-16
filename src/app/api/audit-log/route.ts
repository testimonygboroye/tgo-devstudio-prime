import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.role.isFounderRole) {
    return forbiddenResponse("Only the Founder can view the audit log.");
  }

  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(limit).lean();
  return NextResponse.json({ status: "ok", logs });
}
