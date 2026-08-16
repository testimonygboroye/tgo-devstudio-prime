import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PageView from "@/models/PageView";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.role.isFounderRole) {
    return forbiddenResponse("Only the Founder can view visitor analytics.");
  }

  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10), 1000);

  const [views, totalCount, uniqueVisitors] = await Promise.all([
    PageView.find().sort({ createdAt: -1 }).limit(limit).lean(),
    PageView.countDocuments(),
    PageView.distinct("visitorId"),
  ]);

  return NextResponse.json({
    status: "ok",
    views,
    totalCount,
    uniqueVisitorCount: uniqueVisitors.length,
  });
}
