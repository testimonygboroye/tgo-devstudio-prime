import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import LaunchSettings from "@/models/LaunchSettings";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

export async function GET() {
  await connectToDatabase();
  const settings = await LaunchSettings.findOne().lean();
  return NextResponse.json({ status: "ok", settings: settings || {
    enabled: false, launchDate: null, title: "Something exceptional is launching",
    description: "A new chapter in intelligent digital experiences is almost here.",
    videoUrl: "", flyerUrl: "", afterLaunchVideoUrl: "", afterLaunchFlyerUrl: "",
    videoSeconds: 8, flyerSeconds: 8
  }});
}

export async function PUT(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireContentPermission(session, "homeSettings", "edit")) return forbiddenResponse("You do not have permission to manage launch settings.");
  const body = await request.json();
  const update = {
    enabled: body.enabled === true,
    launchDate: body.launchDate ? new Date(body.launchDate) : null,
    title: String(body.title || "").trim().slice(0, 140),
    description: String(body.description || "").trim().slice(0, 400),
    videoUrl: String(body.videoUrl || "").trim().slice(0, 1000),
    flyerUrl: String(body.flyerUrl || "").trim().slice(0, 1000),
    afterLaunchVideoUrl: String(body.afterLaunchVideoUrl || "").trim().slice(0, 1000),
    afterLaunchFlyerUrl: String(body.afterLaunchFlyerUrl || "").trim().slice(0, 1000),
    videoSeconds: Math.min(60, Math.max(1, Number(body.videoSeconds) || 8)),
    flyerSeconds: Math.min(60, Math.max(1, Number(body.flyerSeconds) || 8)),
  };
  if (update.launchDate && Number.isNaN(update.launchDate.getTime())) return NextResponse.json({ status: "error", message: "Enter a valid launch date and time." }, { status: 400 });
  for (const field of ["videoUrl", "flyerUrl", "afterLaunchVideoUrl", "afterLaunchFlyerUrl"] as const) {
    if (update[field] && !/^https:\/\//i.test(update[field])) return NextResponse.json({ status: "error", message: "Media URLs must use HTTPS." }, { status: 400 });
  }
  await connectToDatabase();
  const settings = await LaunchSettings.findOneAndUpdate({}, update, { new: true, upsert: true, setDefaultsOnInsert: true });
  return NextResponse.json({ status: "ok", settings });
}
