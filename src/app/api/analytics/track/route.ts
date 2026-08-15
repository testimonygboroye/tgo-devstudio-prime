import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { logPageView } from "@/lib/audit/logPageView";

const VISITOR_COOKIE = "tgo_visitor_id";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { path, referrer } = body as { path?: string; referrer?: string };

  if (!path) {
    return NextResponse.json({ status: "error", message: "path is required." }, { status: 400 });
  }

  let visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const isNewVisitor = !visitorId;
  if (!visitorId) {
    visitorId = randomUUID();
  }

  const userAgent = request.headers.get("user-agent") || "unknown";

  await logPageView({ path, visitorId, userAgent, referrer });

  const response = NextResponse.json({ status: "ok" });
  if (isNewVisitor) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
