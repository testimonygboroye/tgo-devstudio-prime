import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse } from "@/lib/auth/authorize";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();

  return NextResponse.json({ status: "ok", twoFactorEnabled: session.user.twoFactorEnabled });
}
