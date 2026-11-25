import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth/session";
import Visitor from "@/models/Visitor";
import { ANALYTICS_BOT_USER_AGENT_PATTERN } from "@/lib/analytics/reporting";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ID_PATTERN = /^[a-zA-Z0-9-]{12,80}$/;

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get("user-agent") || "";
    const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
      .split(",")[0].trim().toLowerCase().split(":")[0];
    const isPreview = /^tgo-devstudio-prime-[a-z0-9]+-testimonygboroye\.vercel\.app$/.test(host);
    if (isPreview || new RegExp(ANALYTICS_BOT_USER_AGENT_PATTERN, "i").test(userAgent)) {
      return NextResponse.json({ status: "ok", ignored: true }, { headers: { "Cache-Control": "no-store" } });
    }

    if (await getAuthenticatedSession(request)) {
      return NextResponse.json({ status: "ok", ignored: true }, { headers: { "Cache-Control": "no-store" } });
    }

    const body = await request.json().catch(() => ({}));
    const visitorId = request.cookies.get("tgo_visitor_id")?.value ||
      (typeof body?.visitorId === "string" && ID_PATTERN.test(body.visitorId) ? body.visitorId : "");
    if (!visitorId || !ID_PATTERN.test(visitorId)) {
      return NextResponse.json({ status: "ok", tracked: false }, { headers: { "Cache-Control": "no-store" } });
    }

    await connectToDatabase();
    const now = new Date();
    const result = await Visitor.updateOne(
      { visitorId, isInternal: { $ne: true } },
      { $max: { lastActiveAt: now } }
    );

    return NextResponse.json(
      { status: "ok", tracked: result.matchedCount > 0, at: now.toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[TGO Analytics] Presence heartbeat failed:", error);
    return NextResponse.json({ status: "error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
