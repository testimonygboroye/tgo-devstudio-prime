import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import { AIAgent } from "@/models/AIWorkforce";
import AIAutomationSchedule from "@/models/AIAutomationSchedule";
import { runProviderCompletionWithFallback } from "@/lib/ai/provider-runtime";
import { evaluateAgentReadiness } from "@/lib/ai/agent-readiness";

export const dynamic = "force-dynamic";

async function founder() {
  const session = await getServerSession();
  if (!session) return { session: null, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (!session.role?.isFounderRole) return { session: null, response: NextResponse.json({ error: "Founder access required." }, { status: 403 }) };
  return { session, response: null };
}

export async function GET() {
  const auth = await founder();
  if (auth.response) return auth.response;
  await connectToDatabase();
  const [agents, schedules] = await Promise.all([
    AIAgent.find({}).select("name role department enabled operationalStatus providerId modelName executionConfig.scheduleEnabled lastReadinessIssues").sort({ department: 1, name: 1 }).lean(),
    AIAutomationSchedule.find({}).sort({ createdAt: -1 }).lean(),
  ]);
  return NextResponse.json({
    agents: agents.map((agent) => ({
      id: String(agent._id), name: agent.name, role: agent.role, department: agent.department,
      enabled: agent.enabled, operationalStatus: agent.operationalStatus,
      providerId: agent.providerId ? String(agent.providerId) : "", modelName: agent.modelName || "",
      scheduleEnabled: Boolean(agent.executionConfig?.scheduleEnabled),
      readinessIssues: agent.lastReadinessIssues || [],
    })),
    schedules: schedules.map((schedule) => ({
      id: String(schedule._id), agentId: String(schedule.agentId), title: schedule.title, prompt: schedule.prompt,
      intervalMinutes: schedule.intervalMinutes, enabled: schedule.enabled,
      nextRunAt: schedule.nextRunAt?.toISOString(), lastRunAt: schedule.lastRunAt?.toISOString() || null,
      lastTaskId: schedule.lastTaskId ? String(schedule.lastTaskId) : null, lastError: schedule.lastError || "",
    })),
  }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}

export async function POST(request: NextRequest) {
  const auth = await founder();
  if (auth.response || !auth.session) return auth.response || NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  await connectToDatabase();
  const action = String(body.action || "save");
  if (action === "verify-agent") {
    const agentId = String(body.agentId || "");
    if (!Types.ObjectId.isValid(agentId)) return NextResponse.json({ error: "A valid AI employee is required." }, { status: 400 });
    const agent = await AIAgent.findById(agentId);
    if (!agent) return NextResponse.json({ error: "AI employee not found." }, { status: 404 });
    if (!agent.providerId || !agent.modelName) {
      agent.operationalStatus = "needs_review";
      agent.lastReadinessCheckAt = new Date();
      agent.lastReadinessIssues = [...(agent.lastReadinessIssues || []).filter((issue) => !issue.toLowerCase().includes("provider")), "No exact provider/model assignment is configured."];
      await agent.save();
      return NextResponse.json({ success: false, status: agent.operationalStatus, issues: agent.lastReadinessIssues }, { status: 409 });
    }
    try {
      const completion = await runProviderCompletionWithFallback(
        String(agent.providerId),
        agent.modelName,
        "You are performing a provider connectivity verification for a TGO AI employee. Reply with the exact text TGO_EMPLOYEE_PROVIDER_TEST_OK and nothing else.",
        "TGO employee live provider verification. Reply exactly: TGO_EMPLOYEE_PROVIDER_TEST_OK",
        "admin"
      );
      if (!completion.text.trim()) throw new Error("The assigned provider returned an empty response.");
      const readiness = evaluateAgentReadiness({
        jobTitle: agent.jobTitle, department: agent.department, description: agent.description,
        responsibilities: agent.responsibilities, deliverables: agent.deliverables,
        systemInstructions: agent.systemInstructions, permissions: agent.permissions,
        toolAllowlist: agent.toolAllowlist, reportsToRole: agent.reportsToRole,
        reportsToAgentId: agent.reportsToAgentId, memoryConfig: agent.memoryConfig,
        executionConfig: agent.executionConfig, approvalRequirements: agent.approvalRequirements,
        performanceTargets: agent.performanceTargets, modelName: agent.modelName, providerVerified: true,
      });
      agent.lastReadinessCheckAt = new Date();
      agent.operationalStatus = readiness.status;
      agent.lastReadinessIssues = readiness.issues;
      await agent.save();
      return NextResponse.json({ success: true, providerVerified: true, status: agent.operationalStatus, issues: agent.lastReadinessIssues, model: completion.model || agent.modelName });
    } catch (error) {
      const message = (error instanceof Error ? error.message : "Provider verification failed.").slice(0, 1000);
      agent.lastReadinessCheckAt = new Date();
      agent.operationalStatus = "needs_review";
      agent.lastReadinessIssues = [...(agent.lastReadinessIssues || []).filter((issue) => !issue.toLowerCase().includes("provider")), "Live provider verification failed: " + message];
      await agent.save();
      return NextResponse.json({ success: false, providerVerified: false, status: agent.operationalStatus, issues: agent.lastReadinessIssues, error: message }, { status: 409 });
    }
  }
  if (action === "disable") {
    if (typeof body.scheduleId !== "string" || !Types.ObjectId.isValid(body.scheduleId)) return NextResponse.json({ error: "A valid schedule ID is required." }, { status: 400 });
    const schedule = await AIAutomationSchedule.findByIdAndUpdate(body.scheduleId, { $set: { enabled: false } }, { new: true });
    if (!schedule) return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    await AIAgent.updateOne({ _id: schedule.agentId }, { $set: { "executionConfig.scheduleEnabled": false } });
    return NextResponse.json({ success: true, scheduleId: String(schedule._id), enabled: false });
  }
  if (action === "enable") {
    if (typeof body.scheduleId !== "string" || !Types.ObjectId.isValid(body.scheduleId)) return NextResponse.json({ error: "A valid schedule ID is required." }, { status: 400 });
    const schedule = await AIAutomationSchedule.findById(body.scheduleId);
    if (!schedule) return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    const agent = await AIAgent.findById(schedule.agentId);
    if (!agent || !agent.enabled || agent.operationalStatus !== "ready" || !agent.providerId || !agent.modelName) return NextResponse.json({ error: "This employee is not operationally ready with an assigned provider/model. Resolve the readiness issues before enabling automation." }, { status: 409 });
    schedule.enabled = true; schedule.nextRunAt = new Date(Date.now() + schedule.intervalMinutes * 60000); schedule.lastError = ""; await schedule.save();
    agent.executionConfig.scheduleEnabled = true; await agent.save();
    return NextResponse.json({ success: true, scheduleId: String(schedule._id), enabled: true });
  }

  const agentId = String(body.agentId || "");
  const title = String(body.title || "").trim();
  const prompt = String(body.prompt || "").trim();
  const intervalMinutes = Number(body.intervalMinutes);
  if (!Types.ObjectId.isValid(agentId)) return NextResponse.json({ error: "Select a valid AI employee." }, { status: 400 });
  if (title.length < 3 || title.length > 180) return NextResponse.json({ error: "Task title must be between 3 and 180 characters." }, { status: 400 });
  if (prompt.length < 20 || prompt.length > 12000) return NextResponse.json({ error: "Task instructions must be between 20 and 12,000 characters." }, { status: 400 });
  if (!Number.isInteger(intervalMinutes) || intervalMinutes < 15 || intervalMinutes > 10080) return NextResponse.json({ error: "Choose an interval between 15 minutes and 7 days." }, { status: 400 });
  const agent = await AIAgent.findById(agentId);
  if (!agent) return NextResponse.json({ error: "AI employee not found." }, { status: 404 });
  if (!agent.enabled || agent.operationalStatus !== "ready" || !agent.providerId || !agent.modelName) return NextResponse.json({ error: "This employee must be enabled, marked ready and assigned a verified provider/model before recurring automation can be configured." }, { status: 409 });
  const now = new Date();
  const schedule = await AIAutomationSchedule.findOneAndUpdate(
    { agentId: agent._id },
    { $set: { createdBy: String(auth.session.user._id), title, prompt, intervalMinutes, enabled: true, nextRunAt: new Date(now.getTime() + intervalMinutes * 60000), lastError: "" }, $setOnInsert: { agentId: agent._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  agent.executionConfig.scheduleEnabled = true;
  await agent.save();
  return NextResponse.json({ success: true, scheduleId: String(schedule._id), nextRunAt: schedule.nextRunAt.toISOString() });
}
