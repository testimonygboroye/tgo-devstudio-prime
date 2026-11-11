import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import { getExecutiveSnapshot, buildExecutiveInsights, forecastMonthlyRevenue } from "@/lib/analytics/executive";
import { ExecutiveRecommendation, ExecutiveDecision, ExecutiveReportSchedule, ExecutiveReportRun } from "@/models/ExecutiveIntelligence";
import BusinessOperation from "@/models/BusinessOperation";
import { AIAgent } from "@/models/AIWorkforce";
import { runProviderCompletion } from "@/lib/ai/provider-runtime";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fail = (message: string, status = 400) => NextResponse.json({ ok: false, error: message }, { status });
async function founder() {
  const session = await getServerSession();
  if (!session) return { response: fail("Authentication required.", 401) } as const;
  if (!session.role.isFounderRole) return { response: fail("Founder access required.", 403) } as const;
  return { session } as const;
}
const nextRun = (frequency: string, from = new Date()) => {
  const date = new Date(from);
  if (frequency === "daily") date.setDate(date.getDate() + 1);
  else if (frequency === "weekly") date.setDate(date.getDate() + 7);
  else date.setMonth(date.getMonth() + 1);
  return date;
};

export async function GET() {
  const auth = await founder(); if ("response" in auth) return auth.response;
  await connectToDatabase();
  const [snapshot, recommendations, decisions, schedules, reports] = await Promise.all([
    getExecutiveSnapshot(),
    ExecutiveRecommendation.find({}).sort({ status: 1, priority: -1, updatedAt: -1 }).limit(50).lean(),
    ExecutiveDecision.find({}).populate("ownerId", "name email").sort({ createdAt: -1 }).limit(50).lean(),
    ExecutiveReportSchedule.find({ createdBy: String(auth.session.user._id) }).sort({ nextRunAt: 1 }).lean(),
    ExecutiveReportRun.find({}).sort({ createdAt: -1 }).limit(12).lean(),
  ]);
  return NextResponse.json({ ok: true, snapshot, forecasts: forecastMonthlyRevenue(snapshot.revenue.monthly), recommendations, generatedInsights: buildExecutiveInsights(snapshot), decisions, schedules, reports }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const auth = await founder(); if ("response" in auth) return auth.response;
  const actorId = String(auth.session.user._id);
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return fail("Invalid request body."); }
  await connectToDatabase();
  const action = String(body.action || "");
  try {
    if (action === "insights.refresh") {
      const snapshot = await getExecutiveSnapshot();
      const insights = buildExecutiveInsights(snapshot);
      let created = 0;
      for (const insight of insights) {
        const existing = await ExecutiveRecommendation.findOne({ fingerprint: insight.fingerprint });
        if (existing) {
          if (existing.status === "proposed") { existing.summary = insight.summary; existing.rationale = insight.rationale; existing.priority = insight.priority; await existing.save(); }
          continue;
        }
        await ExecutiveRecommendation.create({ ...insight, createdBy: actorId });
        created++;
      }
      await writePlatformAuditEvent({ actorType: "human", actorId, actorLabel: auth.session.user.name, action: "executive.insights.refreshed", module: "executive-intelligence", outcome: "success", metadata: { generated: insights.length, created } });
      return NextResponse.json({ ok: true, generated: insights.length, created });
    }
    if (action === "recommendation.review") {
      if (!Types.ObjectId.isValid(String(body.id || "")) || !["approve", "reject"].includes(String(body.decision))) return fail("A valid recommendation and approval decision are required.");
      const recommendation = await ExecutiveRecommendation.findOne({ _id: new Types.ObjectId(String(body.id)), status: "proposed" });
      if (!recommendation) return fail("Recommendation not found or already reviewed.", 404);
      if (body.decision === "approve" && recommendation.actionType === "create_follow_up") {
        const payload = recommendation.actionPayload || {};
        const operation = await BusinessOperation.create({
          type: "workflow", title: String(payload.title || recommendation.title).slice(0, 180),
          description: String(payload.description || recommendation.summary).slice(0, 3000),
          details: "Created from approved executive recommendation " + String(recommendation._id),
          reference: "EXEC-" + String(recommendation._id).slice(-10).toUpperCase(), status: "open",
          currency: "NGN", createdBy: auth.session.user._id, updatedBy: auth.session.user._id,
        });
        recommendation.operationId = operation._id;
      }
      recommendation.status = body.decision === "approve" ? "approved" : "rejected";
      recommendation.reviewedBy = actorId; recommendation.reviewedAt = new Date(); await recommendation.save();
      await writePlatformAuditEvent({ actorType: "human", actorId, actorLabel: auth.session.user.name, action: "executive.recommendation." + recommendation.status, module: "executive-intelligence", targetType: "ExecutiveRecommendation", targetId: String(recommendation._id), outcome: "success", metadata: { actionType: recommendation.actionType, operationId: recommendation.operationId ? String(recommendation.operationId) : null } });
      return NextResponse.json({ ok: true, recommendation, message: recommendation.operationId ? "Approved. A real operational follow-up has been created." : "Decision recorded. This recommendation requires human execution." });
    }
    if (action === "decision.create") {
      const title = String(body.title || "").trim(), decision = String(body.decision || "").trim();
      if (title.length < 3 || decision.length < 5) return fail("Enter a decision title and a meaningful decision record.");
      const dueAt = body.dueAt ? new Date(String(body.dueAt)) : undefined;
      if (dueAt && !Number.isFinite(dueAt.getTime())) return fail("Invalid decision due date.");
      const row = await ExecutiveDecision.create({ title: title.slice(0, 180), decision: decision.slice(0, 5000), rationale: String(body.rationale || "").slice(0, 3000), ownerId: body.ownerId && Types.ObjectId.isValid(String(body.ownerId)) ? new Types.ObjectId(String(body.ownerId)) : undefined, dueAt, createdBy: actorId, updatedBy: actorId });
      await writePlatformAuditEvent({ actorType: "human", actorId, actorLabel: auth.session.user.name, action: "executive.decision.created", module: "executive-intelligence", targetType: "ExecutiveDecision", targetId: String(row._id), outcome: "success" });
      return NextResponse.json({ ok: true, decision: row }, { status: 201 });
    }
    if (action === "decision.update") {
      if (!Types.ObjectId.isValid(String(body.id || ""))) return fail("Invalid decision identifier.");
      const status = String(body.status || "");
      if (!["open", "in_progress", "completed", "cancelled"].includes(status)) return fail("Invalid decision status.");
      const row = await ExecutiveDecision.findByIdAndUpdate(new Types.ObjectId(String(body.id)), { $set: { status, outcome: String(body.outcome || "").slice(0, 3000), updatedBy: actorId, completedAt: status === "completed" ? new Date() : undefined } }, { new: true, runValidators: true });
      if (!row) return fail("Decision not found.", 404);
      await writePlatformAuditEvent({ actorType: "human", actorId, actorLabel: auth.session.user.name, action: "executive.decision.updated", module: "executive-intelligence", targetType: "ExecutiveDecision", targetId: String(row._id), outcome: "success", metadata: { status } });
      return NextResponse.json({ ok: true, decision: row });
    }
    if (action === "schedule.create") {
      const name = String(body.name || "").trim(), frequency = String(body.frequency || "");
      if (name.length < 3 || !["daily", "weekly", "monthly"].includes(frequency)) return fail("Provide a report name and valid frequency.");
      const schedule = await ExecutiveReportSchedule.create({ name: name.slice(0, 140), frequency: frequency as "daily" | "weekly" | "monthly", createdBy: actorId, nextRunAt: nextRun(frequency) });
      await writePlatformAuditEvent({ actorType: "human", actorId, actorLabel: auth.session.user.name, action: "executive.report_schedule.created", module: "executive-intelligence", targetType: "ExecutiveReportSchedule", targetId: String(schedule._id), outcome: "success", metadata: { frequency } });
      return NextResponse.json({ ok: true, schedule }, { status: 201 });
    }
    if (action === "schedule.toggle") {
      if (!Types.ObjectId.isValid(String(body.id || ""))) return fail("Invalid report schedule.");
      const schedule = await ExecutiveReportSchedule.findOne({ _id: new Types.ObjectId(String(body.id)), createdBy: actorId });
      if (!schedule) return fail("Report schedule not found.", 404);
      schedule.active = !schedule.active; if (schedule.active && schedule.nextRunAt < new Date()) schedule.nextRunAt = nextRun(schedule.frequency);
      await schedule.save();
      await writePlatformAuditEvent({ actorType: "human", actorId, actorLabel: auth.session.user.name, action: "executive.report_schedule.toggled", module: "executive-intelligence", targetType: "ExecutiveReportSchedule", targetId: String(schedule._id), outcome: "success", metadata: { active: schedule.active } });
      return NextResponse.json({ ok: true, schedule });
    }
    if (action === "report.run") {
      const snapshot = await getExecutiveSnapshot();
      const run = await ExecutiveReportRun.create({ name: String(body.name || "Executive operational report").slice(0, 140), periodStart: new Date(Date.now() - 30 * 86400000), periodEnd: new Date(), snapshot, generatedBy: "founder", createdBy: actorId });
      await writePlatformAuditEvent({ actorType: "human", actorId, actorLabel: auth.session.user.name, action: "executive.report.generated", module: "executive-intelligence", targetType: "ExecutiveReportRun", targetId: String(run._id), outcome: "success" });
      return NextResponse.json({ ok: true, report: run }, { status: 201 });
    }
    if (action === "analytics.ask") {
      const question = String(body.question || "").trim();
      if (question.length < 4 || question.length > 2000) return fail("Enter an analytics question (4–2,000 characters).");
      const agent = await AIAgent.findOne({ enabled: true }).sort({ updatedAt: -1 }).lean();
      if (!agent) return fail("No enabled AI employee is available. Configure and enable an AI agent in AI Workforce first.", 503);
      const snapshot = await getExecutiveSnapshot();
      const completion = await runProviderCompletion(String(agent.providerId), agent.modelName, "You are TGO DevStudio's executive analytics assistant. Answer only from the supplied company-wide aggregate snapshot. Never invent numbers, currencies, causes or trends. If data is missing, say so. Distinguish verified collected payments from revenue forecasts. Never reveal personal client or employee data. Clearly label hypotheses and limitations. Give concise, actionable recommendations and cite the relevant snapshot fields by name.", "Company snapshot JSON:\n" + JSON.stringify(snapshot) + "\n\nFounder question:\n" + question);
      await writePlatformAuditEvent({ actorType: "ai", actorId: String(agent._id), actorLabel: agent.name, action: "executive.analytics.question_answered", module: "executive-intelligence", outcome: "success", metadata: { questionLength: question.length, inputTokens: completion.inputTokens, outputTokens: completion.outputTokens, providerRequestId: completion.providerRequestId || null } });
      return NextResponse.json({ ok: true, answer: completion.text, usage: { inputTokens: completion.inputTokens, outputTokens: completion.outputTokens }, agent: { name: agent.name, modelName: agent.modelName } });
    }
    return fail("Unsupported executive intelligence action.");
  } catch (error) {
    await writePlatformAuditEvent({ actorType: "human", actorId, actorLabel: auth.session.user.name, action: "executive.action.failed", module: "executive-intelligence", outcome: "failure", metadata: { action, error: error instanceof Error ? error.message.slice(0, 300) : "Unknown error" } }).catch(() => undefined);
    return fail(error instanceof Error ? error.message : "Executive intelligence action failed.", 500);
  }
}
