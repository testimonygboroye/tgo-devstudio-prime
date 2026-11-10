import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import { AIProvider, AIAgent, AITask } from "@/models/AIWorkforce";
import { decryptProviderSecret, encryptProviderSecret } from "@/lib/ai/provider-secrets";
import { runProviderCompletion } from "@/lib/ai/provider-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function founder() {
  const session = await getServerSession();
  if (!session?.role?.isFounderRole) return null;
  return session;
}
export async function GET() {
  const session = await founder();
  if (!session) return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
  await connectToDatabase();
  const [providers, agents, tasks] = await Promise.all([
    AIProvider.find().select("-encryptedApiKey").sort({ createdAt: -1 }).lean(),
    AIAgent.find().populate("providerId", "name provider").sort({ createdAt: -1 }).lean(),
    AITask.find().populate("agentId", "name role").sort({ createdAt: -1 }).limit(100).lean(),
  ]);
  return NextResponse.json({ status: "ok", providers, agents, tasks });
}
export async function POST(request: NextRequest) {
  const session = await founder();
  if (!session) return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
  await connectToDatabase();
  const body = await request.json().catch(() => ({}));
  const actorId = String(session.user._id);
  try {
    if (body.action === "provider.create") {
      const name = String(body.name || "").trim();
      const apiKey = String(body.apiKey || "").trim();
      const provider = String(body.provider || "");
      if (!name || !apiKey || !["google", "openai", "anthropic", "openai-compatible"].includes(provider)) return NextResponse.json({ status: "error", message: "Provider name, supported provider type and API key are required." }, { status: 400 });
      if (provider === "openai-compatible" && !/^https:\/\//i.test(String(body.baseUrl || ""))) return NextResponse.json({ status: "error", message: "A valid HTTPS base URL is required for compatible providers." }, { status: 400 });
      const created = await AIProvider.create({ name, provider, baseUrl: body.baseUrl, encryptedApiKey: encryptProviderSecret(apiKey), createdBy: actorId });
      await writePlatformAuditEvent({ actorType: "human", actorId, actorLabel: session.user.name, action: "ai.provider.created", module: "ai-workforce", targetType: "AIProvider", targetId: String(created._id), outcome: "success", metadata: { provider, name } });
      return NextResponse.json({ status: "ok", provider: { id: created._id, name: created.name, provider: created.provider } }, { status: 201 });
    }
    if (body.action === "provider.test") {
      const provider = await AIProvider.findById(body.providerId).select("+encryptedApiKey");
      if (!provider) return NextResponse.json({ status: "error", message: "Provider not found." }, { status: 404 });
      const key = decryptProviderSecret(provider.encryptedApiKey);
      let endpoint = "";
      let headers: Record<string, string> = {};
      if (provider.provider === "google") { endpoint = "https://generativelanguage.googleapis.com/v1beta/models?key=" + encodeURIComponent(key); }
      else if (provider.provider === "anthropic") { endpoint = "https://api.anthropic.com/v1/models"; headers = { "x-api-key": key, "anthropic-version": "2023-06-01" }; }
      else { endpoint = (provider.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "") + "/models"; headers = { Authorization: "Bearer " + key }; }
      const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(12000), cache: "no-store" });
      provider.lastTestedAt = new Date();
      provider.lastTestStatus = response.ok ? "success" : "failed";
      await provider.save();
      await writePlatformAuditEvent({ actorType: "human", actorId, action: "ai.provider.tested", module: "ai-workforce", targetType: "AIProvider", targetId: String(provider._id), outcome: response.ok ? "success" : "failure", metadata: { statusCode: response.status } });
      return NextResponse.json({ status: response.ok ? "ok" : "error", httpStatus: response.status, message: response.ok ? "Provider connection verified." : "Provider rejected the connection. Check the credential and provider configuration." }, { status: response.ok ? 200 : 502 });
    }
    if (body.action === "agent.create") {
      const provider = await AIProvider.findOne({ _id: body.providerId, enabled: true });
      if (!provider) return NextResponse.json({ status: "error", message: "Select an enabled provider." }, { status: 400 });
      const name = String(body.name || "").trim(), modelName = String(body.model || "").trim(), instructions = String(body.systemInstructions || "").trim();
      if (!name || !modelName || !instructions) return NextResponse.json({ status: "error", message: "Agent name, model and system instructions are required." }, { status: 400 });
      const agent = await AIAgent.create({ name, role: String(body.role || "General assistant"), department: String(body.department || "Operations"), description: String(body.description || ""), providerId: provider._id, model: modelName, systemInstructions: instructions, permissions: [], requiresApproval: true, maxDailyTokens: Math.max(1000, Math.min(1000000, Number(body.maxDailyTokens) || 100000)), enabled: false, createdBy: actorId });
      await writePlatformAuditEvent({ actorType: "human", actorId, action: "ai.agent.created", module: "ai-workforce", targetType: "AIAgent", targetId: String(agent._id), outcome: "success", metadata: { name, provider: provider.name } });
      return NextResponse.json({ status: "ok", agentId: agent._id, message: "Agent created disabled and with no operational permissions. Enablement requires a separate reviewed workflow." }, { status: 201 });
    }
    if (body.action === "agent.enable" || body.action === "agent.disable") {
      const agent = await AIAgent.findById(body.agentId);
      if (!agent) return NextResponse.json({ status: "error", message: "Agent not found." }, { status: 404 });
      if (body.action === "agent.enable") {
        const provider = await AIProvider.findOne({ _id: agent.providerId, enabled: true, lastTestStatus: "success" });
        if (!provider) return NextResponse.json({ status: "error", message: "Test and enable the agent's provider before enabling this agent." }, { status: 409 });
        agent.enabled = true;
      } else agent.enabled = false;
      agent.permissions = [];
      agent.requiresApproval = true;
      await agent.save();
      await writePlatformAuditEvent({ actorType: "human", actorId, action: body.action === "agent.enable" ? "ai.agent.enabled" : "ai.agent.disabled", module: "ai-workforce", targetType: "AIAgent", targetId: String(agent._id), outcome: "success", metadata: { enabled: agent.enabled, permissions: [] } });
      return NextResponse.json({ status: "ok", message: agent.enabled ? "Agent enabled for approval-gated AI text tasks." : "Agent disabled." });
    }
    if (body.action === "task.enqueue") {
      const agent = await AIAgent.findOne({ _id: body.agentId, enabled: true });
      if (!agent) return NextResponse.json({ status: "error", message: "Agent is unavailable or disabled." }, { status: 400 });
      const title = String(body.title || "").trim(), input = String(body.input || "").trim();
      if (!title || !input) return NextResponse.json({ status: "error", message: "Task title and instructions are required." }, { status: 400 });
      const task = await AITask.create({ agentId: agent._id, title, input, requestedBy: actorId, status: "awaiting_approval" });
      await writePlatformAuditEvent({ actorType: "human", actorId, action: "ai.task.queued", module: "ai-workforce", targetType: "AITask", targetId: String(task._id), outcome: "success", metadata: { agentId: String(agent._id), title } });
      return NextResponse.json({ status: "ok", taskId: task._id, message: "Task queued for human approval. No agent execution occurs before approval." }, { status: 201 });
    }
    if (body.action === "task.approve" || body.action === "task.reject") {
      const task = await AITask.findOneAndUpdate({ _id: body.taskId, status: "awaiting_approval" }, { $set: { status: body.action === "task.approve" ? "queued" : "cancelled", approvedBy: actorId } }, { new: true });
      if (!task) return NextResponse.json({ status: "error", message: "Task not found or already reviewed." }, { status: 409 });
      await writePlatformAuditEvent({ actorType: "human", actorId, action: body.action === "task.approve" ? "ai.task.approved" : "ai.task.rejected", module: "ai-workforce", targetType: "AITask", targetId: String(task._id), outcome: "success" });
      return NextResponse.json({ status: "ok", taskId: task._id, statusValue: task.status, message: "Approval recorded. Execution remains disabled until a reviewed execution adapter is configured." });
    }
    if (body.action === "task.execute") {
      const task = await AITask.findOneAndUpdate({ _id: body.taskId, status: "queued" }, { $set: { status: "running", startedAt: new Date(), error: "" }, $inc: { executionAttempts: 1 } }, { new: true });
      if (!task) return NextResponse.json({ status: "error", message: "Task is not queued, was not approved, or is already running." }, { status: 409 });
      try {
        const agent = await AIAgent.findOne({ _id: task.agentId, enabled: true });
        if (!agent || agent.requiresApproval !== true) throw new Error("Agent is disabled or its approval policy is invalid.");
        if (agent.permissions.length > 0) throw new Error("This execution adapter only supports text-only agents; operational tools are not enabled.");
        const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
        const dailyUsage = await AITask.aggregate([{ $match: { agentId: agent._id, status: "completed", completedAt: { $gte: dayStart } } }, { $group: { _id: null, tokens: { $sum: { $add: ["$inputTokens", "$outputTokens"] } } } }]);
        const usedTokens = Number(dailyUsage[0]?.tokens || 0);
        if (usedTokens >= agent.maxDailyTokens) throw new Error("Agent daily token budget exhausted (" + usedTokens + "/" + agent.maxDailyTokens + ").");
        const completion = await runProviderCompletion(String(agent.providerId), agent.model, agent.systemInstructions, task.input);
        if (!completion.text.trim()) throw new Error("The provider returned an empty response.");
        task.status = "completed";
        task.result = completion.text.slice(0, 50000);
        task.inputTokens = completion.inputTokens;
        task.outputTokens = completion.outputTokens;
        task.providerRequestId = completion.providerRequestId;
        task.completedAt = new Date();
        await task.save();
        await writePlatformAuditEvent({ actorType: "ai", actorId: String(agent._id), actorLabel: agent.name, action: "ai.task.completed", module: "ai-workforce", targetType: "AITask", targetId: String(task._id), outcome: "success", metadata: { model: agent.model, inputTokens: completion.inputTokens, outputTokens: completion.outputTokens, providerRequestId: completion.providerRequestId } });
        return NextResponse.json({ status: "ok", message: "AI task completed.", taskId: task._id, result: task.result, usage: { inputTokens: completion.inputTokens, outputTokens: completion.outputTokens } });
      } catch (error) {
        task.status = "failed";
        task.error = (error instanceof Error ? error.message : "AI execution failed.").slice(0, 2000);
        task.completedAt = new Date();
        await task.save();
        await writePlatformAuditEvent({ actorType: "system", actorId: "ai-workforce-runtime", action: "ai.task.failed", module: "ai-workforce", targetType: "AITask", targetId: String(task._id), outcome: "failure", metadata: { error: task.error, attempt: task.executionAttempts } });
        return NextResponse.json({ status: "error", message: "AI task failed. Review the recorded error before retrying.", taskId: task._id, error: task.error }, { status: 502 });
      }
    }
    if (body.action === "task.retry") {
      const task = await AITask.findOneAndUpdate({ _id: body.taskId, status: "failed", executionAttempts: { $lt: 5 } }, { $set: { status: "awaiting_approval", error: "", completedAt: null } }, { new: true });
      if (!task) return NextResponse.json({ status: "error", message: "Task cannot be retried or has reached its five-attempt limit." }, { status: 409 });
      await writePlatformAuditEvent({ actorType: "human", actorId, action: "ai.task.retry_requested", module: "ai-workforce", targetType: "AITask", targetId: String(task._id), outcome: "success" });
      return NextResponse.json({ status: "ok", message: "Task returned to human approval before another attempt." });
    }
    if (body.action === "task.handover") {
      const note = String(body.note || "").trim();
      if (!note) return NextResponse.json({ status: "error", message: "A handover note is required." }, { status: 400 });
      const task = await AITask.findOneAndUpdate({ _id: body.taskId, status: { $in: ["queued", "failed", "completed"] } }, { $set: { status: "cancelled", handedOverAt: new Date(), handedOverBy: actorId, handoverNote: note.slice(0, 2000) } }, { new: true });
      if (!task) return NextResponse.json({ status: "error", message: "Task cannot be handed over in its current state." }, { status: 409 });
      await writePlatformAuditEvent({ actorType: "human", actorId, action: "ai.task.handed_over", module: "ai-workforce", targetType: "AITask", targetId: String(task._id), outcome: "success", metadata: { note: note.slice(0, 500) } });
      return NextResponse.json({ status: "ok", message: "Task handed over to a human. The handover note is recorded." });
    }
    return NextResponse.json({ status: "error", message: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ status: "error", message }, { status: 400 });
  }
}
