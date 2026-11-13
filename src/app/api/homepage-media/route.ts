import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import LaunchSettings from "@/models/LaunchSettings";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectToDatabase();
  const settings = await LaunchSettings.findOne().lean();
  return NextResponse.json({ status: "ok", settings: settings || {
    enabled: false, countdownEnabled: true, countdownVisible: true, launchDate: null, title: "Something exceptional is coming",
    description: "A new chapter in intelligent digital experiences is almost here.", countdownLabel: "COUNTDOWN", countdownStatusLabel: "LIVE TIMER", countdownYearsLabel:"YEARS",countdownMonthsLabel:"MONTHS",countdownDaysLabel:"DAYS",countdownHoursLabel:"HOURS",countdownMinutesLabel:"MINUTES",countdownSecondsLabel:"SECONDS",
    videoUrl: "", flyerUrl: "", afterLaunchVideoUrl: "", afterLaunchFlyerUrl: "", videoAudioEnabled: false, flyerDurationMinutes: 0, flyerDurationSeconds: 8,
    videoSeconds: 0, flyerSeconds: 8, videoDurationHours: 0, videoDurationMinutes: 0, videoDurationSeconds: 0, useVideoDurationOverride: false
  }}, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function PUT(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireContentPermission(session, "homeSettings", "edit")) return forbiddenResponse("You do not have permission to manage homepage media.");
  const body = await request.json();
  const flyerMinutes = Math.min(1439, Math.max(0, Number(body.flyerDurationMinutes) || 0));
  const flyerSecondsPart = Math.min(59, Math.max(0, Number(body.flyerDurationSeconds) || 0));
  const flyerTotalSeconds = Math.min(86400, Math.max(1, flyerMinutes * 60 + flyerSecondsPart));
  const update = {
    enabled: body.enabled === true,
    countdownEnabled: body.countdownEnabled !== false,
    countdownVisible: body.countdownVisible !== false,
    launchDate: body.launchDate ? new Date(body.launchDate) : null,
    title: String(body.title || "").trim().slice(0, 140),
    description: String(body.description || "").trim().slice(0, 400),
    countdownLabel: String(body.countdownLabel || "COUNTDOWN").trim().slice(0, 80),
    countdownStatusLabel: String(body.countdownStatusLabel || "LIVE TIMER").trim().slice(0, 40),
    countdownYearsLabel:String(body.countdownYearsLabel||"YEARS").trim().slice(0,24),countdownMonthsLabel:String(body.countdownMonthsLabel||"MONTHS").trim().slice(0,24),countdownDaysLabel:String(body.countdownDaysLabel||"DAYS").trim().slice(0,24),countdownHoursLabel:String(body.countdownHoursLabel||"HOURS").trim().slice(0,24),countdownMinutesLabel:String(body.countdownMinutesLabel||"MINUTES").trim().slice(0,24),countdownSecondsLabel:String(body.countdownSecondsLabel||"SECONDS").trim().slice(0,24),
    videoUrl: String(body.videoUrl || "").trim().slice(0, 1000),
    videoAudioEnabled: body.videoAudioEnabled === true,
    flyerDurationMinutes: Math.floor(flyerTotalSeconds / 60),
    flyerDurationSeconds: flyerTotalSeconds % 60,
    flyerUrl: String(body.flyerUrl || "").trim().slice(0, 1000),
    afterLaunchVideoUrl: String(body.afterLaunchVideoUrl || "").trim().slice(0, 1000),
    afterLaunchFlyerUrl: String(body.afterLaunchFlyerUrl || "").trim().slice(0, 1000),
    videoSeconds: 0,
    flyerSeconds: flyerTotalSeconds,
    videoDurationHours: Math.min(24, Math.max(0, Number(body.videoDurationHours) || 0)),
    videoDurationMinutes: Math.min(59, Math.max(0, Number(body.videoDurationMinutes) || 0)),
    videoDurationSeconds: Math.min(59, Math.max(0, Number(body.videoDurationSeconds) || 0)),
    useVideoDurationOverride: body.useVideoDurationOverride === true,
  };
  if (update.launchDate && Number.isNaN(update.launchDate.getTime())) return NextResponse.json({ status: "error", message: "Enter a valid launch date and time." }, { status: 400 });
  for (const field of ["videoUrl", "flyerUrl", "afterLaunchVideoUrl", "afterLaunchFlyerUrl"] as const) {
    if (update[field] && !/^https:\/\//i.test(update[field])) return NextResponse.json({ status: "error", message: "Media URLs must use HTTPS." }, { status: 400 });
  }
  await connectToDatabase();
  const settings = await LaunchSettings.findOneAndUpdate({}, { $set: update }, { returnDocument: "after", upsert: true, setDefaultsOnInsert: true, runValidators: true });
  return NextResponse.json({ status: "ok", settings }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
