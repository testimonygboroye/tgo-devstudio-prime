import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getExecutiveSnapshot } from "@/lib/analytics/executive";
import { ExecutiveReportSchedule, ExecutiveReportRun } from "@/models/ExecutiveIntelligence";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import Role from "@/models/Role";
import User from "@/models/User";
import { UnifiedConversation, UnifiedMessage } from "@/models/UnifiedConversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function nextRun(frequency: string, from: Date) {
  const date = new Date(from);
  if (frequency === "daily") date.setDate(date.getDate() + 1);
  else if (frequency === "weekly") date.setDate(date.getDate() + 7);
  else date.setMonth(date.getMonth() + 1);
  return date;
}
export async function GET(request: NextRequest) {
  const secret = process.env.PLATFORM_AUTOMATION_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Executive report scheduler is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== "Bearer " + secret) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  await connectToDatabase();
  const due = await ExecutiveReportSchedule.find({ active: true, nextRunAt: { $lte: new Date() } }).sort({ nextRunAt: 1 }).limit(20);
  let generated = 0, failed = 0;
  for (const schedule of due) {
    try {
      const snapshot = await getExecutiveSnapshot();
      const run = await ExecutiveReportRun.create({ scheduleId: schedule._id, name: schedule.name, periodStart: schedule.lastRunAt || new Date(Date.now() - 30 * 86400000), periodEnd: new Date(), snapshot, generatedBy: "schedule", createdBy: schedule.createdBy });
      const founderRoles = await Role.find({ isFounderRole: true }).select("_id").lean();
      const founderUsers = await User.find({ role: { $in: founderRoles.map((item) => item._id) }, accountType: "staff", isBanned: { $ne: true } }).select("_id").lean();
      const recipients = founderUsers.length ? founderUsers.map((item) => item._id) : [schedule.createdBy];
      const reportChannel = await UnifiedConversation.findOneAndUpdate(
        { kind: "channel", title: "Executive Reports" },
        { $set: { memberIds: recipients, lastMessageAt: new Date() }, $setOnInsert: { kind: "channel", title: "Executive Reports", createdBy: schedule.createdBy } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await UnifiedMessage.create({ conversationId: reportChannel._id, senderType: "system", senderLabel: "Executive Intelligence", body: "Scheduled report generated: " + schedule.name + "\\nRun ID: " + String(run._id) + "\\n\\n" + JSON.stringify(snapshot).slice(0, 9000), messageType: "system" });
      schedule.lastRunAt = new Date(); schedule.nextRunAt = nextRun(schedule.frequency, schedule.lastRunAt); await schedule.save();
      await writePlatformAuditEvent({ actorType: "system", actorId: "executive-report-scheduler", actorLabel: "Executive report scheduler", action: "executive.report.scheduled", module: "executive-intelligence", targetType: "ExecutiveReportRun", targetId: String(run._id), outcome: "success", metadata: { scheduleId: String(schedule._id), frequency: schedule.frequency } });
      generated++;
    } catch (error) {
      failed++;
      await writePlatformAuditEvent({ actorType: "system", actorId: "executive-report-scheduler", action: "executive.report.schedule_failed", module: "executive-intelligence", targetType: "ExecutiveReportSchedule", targetId: String(schedule._id), outcome: "failure", metadata: { error: error instanceof Error ? error.message.slice(0, 300) : "Unknown error" } }).catch(() => undefined);
    }
  }
  return NextResponse.json({ ok: true, scanned: due.length, generated, failed });
}
