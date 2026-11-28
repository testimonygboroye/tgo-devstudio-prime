import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { AIAgent, AITask } from "@/models/AIWorkforce";
import { AIMemory } from "@/models/AIKnowledge";
import AIAutomationSchedule from "@/models/AIAutomationSchedule";
import { runProviderCompletionWithFallback } from "@/lib/ai/provider-runtime";
import { notifyFounders } from "@/lib/platform/notifications";
import { getAdminBasePath } from "@/lib/adminPath";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const MAX_SCHEDULES_PER_TICK = 5;

export async function GET(request: NextRequest) {
  const secret = process.env.PLATFORM_AUTOMATION_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "AI workforce automation is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const now = new Date();
  const due = await AIAutomationSchedule.find({ enabled: true, nextRunAt: { $lte: now } }).sort({ nextRunAt: 1 }).limit(MAX_SCHEDULES_PER_TICK).select("_id").lean();
  const results: Array<{ scheduleId: string; status: string; taskId?: string; reason?: string }> = [];

  for (const item of due) {
    // Atomic claim: another Render/Vercel instance or overlapping cron cannot run this schedule twice.
    const schedule = await AIAutomationSchedule.findOneAndUpdate(
      { _id: item._id, enabled: true, nextRunAt: { $lte: now } },
      { $set: { lastRunAt: now, nextRunAt: new Date(now.getTime() + 15 * 60000) } },
      { new: true }
    );
    if (!schedule) continue;
    // Keep a minimum safe retry interval if an individual schedule is malformed.
    schedule.nextRunAt = new Date(now.getTime() + Math.max(15, Math.min(10080, schedule.intervalMinutes || 1440)) * 60000);
    await schedule.save();

    const agent = await AIAgent.findById(schedule.agentId);
    if (!agent || !agent.enabled || agent.operationalStatus !== "ready" || !agent.executionConfig?.scheduleEnabled || !agent.providerId || !agent.modelName) {
      const reason = "Employee is disabled, not readiness-verified, or missing its exact provider/model assignment.";
      schedule.lastError = reason; await schedule.save();
      await notifyFounders({ category: "ai-task-failed", title: "Scheduled AI employee is not ready", body: (agent?.name || "An AI employee") + ": " + reason, href: getAdminBasePath() + "/ai-workforce", actionLabel: "Review employee readiness", priority: "high", requiresAction: true, sourceType: "AIAutomationSchedule", sourceId: String(schedule._id) }).catch(() => undefined);
      results.push({ scheduleId: String(schedule._id), status: "skipped", reason });
      continue;
    }

    const dayStart = new Date(now); dayStart.setUTCHours(0, 0, 0, 0);
    const usage = await AITask.aggregate([
      { $match: { agentId: agent._id, createdAt: { $gte: dayStart }, status: { $in: ["completed", "running"] } } },
      { $group: { _id: null, tokens: { $sum: { $add: [{ $ifNull: ["$inputTokens", 0] }, { $ifNull: ["$outputTokens", 0] }] } } } },
    ]);
    const dailyLimit = Math.min(Number(agent.executionConfig?.maxDailyTokens || agent.maxDailyTokens || 100000), Number(agent.maxDailyTokens || 100000));
    if (Number(usage[0]?.tokens || 0) >= dailyLimit) {
      const reason = "Daily token budget reached; scheduled run was safely skipped.";
      schedule.lastError = reason; await schedule.save();
      results.push({ scheduleId: String(schedule._id), status: "skipped", reason });
      continue;
    }

    const running = await AITask.countDocuments({ agentId: agent._id, status: "running" });
    if (running >= Math.max(1, Number(agent.executionConfig?.maxConcurrentTasks || 1))) {
      const reason = "Employee is already at its configured concurrent-task limit.";
      schedule.lastError = reason; await schedule.save();
      results.push({ scheduleId: String(schedule._id), status: "skipped", reason });
      continue;
    }

    const sharedScopes = agent.memoryConfig?.sharedMemoryScopes?.length ? agent.memoryConfig.sharedMemoryScopes : ["company-approved"];
    const memoryScope = agent.workspaceId
      ? { $or: [{ workspaceId: agent.workspaceId }, { workspaceId: { $exists: false } }] }
      : { workspaceId: { $exists: false } };
    const memoryAccess = [
      { scope: "agent" as const, agentId: agent._id },
      ...(agent.memoryConfig?.identityKey ? [{ scope: "agent" as const, agentMemoryKey: agent.memoryConfig.identityKey }] : []),
      { scope: "shared" as const, $and: [memoryScope, { $or: [{ tags: { $in: sharedScopes } }, { tags: { $size: 0 } }] }] },
    ];
    const memoryFilter = {
      active: true,
      $and: [
        { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] },
        { $or: memoryAccess },
      ],
    } as never;
    const memories = agent.memoryConfig?.enabled
      ? await AIMemory.find(memoryFilter)
          .sort({ updatedAt: -1 }).limit(20).select("title content scope tags").lean()
      : [];
    const memoryContext = memories.map((memory, index) => "MEMORY " + (index + 1) + " — " + memory.title + "\n" + String(memory.content).slice(0, 2500)).join("\n\n").slice(0, 14000);

    const task = await AITask.create({
      agentId: agent._id,
      agentMemoryKey: agent.memoryConfig?.identityKey || agent.memoryKey || undefined,
      title: schedule.title,
      input: schedule.prompt,
      status: "running",
      requestedBy: schedule.createdBy,
      startedAt: new Date(),
      executionAttempts: 1,
      inputTokens: 0,
      outputTokens: 0,
    });

    try {
      const safeSystem = [
        agent.systemInstructions || "",
        memoryContext ? "APPROVED ROLE MEMORY CONTEXT:\n" + memoryContext : "",
        "AUTOMATED SCHEDULED RUN: You are performing a recurring, text-only monitoring/reporting task.",
        "Do not claim to have inspected live systems, websites, databases, inboxes, analytics, files, or external services unless their data is included in the task prompt.",
        "Do not send messages, publish content, spend money, modify records, change permissions, deploy code, or perform external actions.",
        "Produce a concise, evidence-aware report. Clearly label missing data and decisions requiring founder approval.",
      ].filter(Boolean).join("\n\n");
      const completion = await runProviderCompletionWithFallback(
        String(agent.providerId),
        agent.modelName,
        safeSystem,
        "SCHEDULED TASK: " + schedule.title + "\n\nINSTRUCTIONS:\n" + schedule.prompt + "\n\nRun timestamp (UTC): " + now.toISOString(),
        "admin"
      );
      task.status = "completed";
      task.result = completion.text.slice(0, 50000);
      task.inputTokens = completion.inputTokens;
      task.outputTokens = completion.outputTokens;
      task.providerRequestId = completion.providerRequestId;
      task.completedAt = new Date();
      await task.save();
      schedule.lastTaskId = task._id;
      schedule.lastError = "";
      await schedule.save();
      await notifyFounders({ category: "ai-task-completed", title: "Scheduled AI employee report is ready", body: agent.name + " completed: " + schedule.title, href: getAdminBasePath() + "/ai-workforce", actionLabel: "Review report", priority: "normal", sourceType: "AITask", sourceId: String(task._id) }).catch(() => undefined);
      results.push({ scheduleId: String(schedule._id), status: "completed", taskId: String(task._id) });
    } catch (error) {
      const message = (error instanceof Error ? error.message : "Scheduled AI task failed.").slice(0, 1800);
      task.status = "failed"; task.error = message; task.completedAt = new Date(); await task.save();
      schedule.lastTaskId = task._id; schedule.lastError = message; await schedule.save();
      await notifyFounders({ category: "ai-task-failed", title: "Scheduled AI employee task failed", body: agent.name + " could not complete: " + schedule.title + ". " + message.slice(0, 240), href: getAdminBasePath() + "/ai-workforce", actionLabel: "Review failed run", priority: "high", requiresAction: true, sourceType: "AITask", sourceId: String(task._id), dedupeKey: "ai-schedule-failed:" + String(task._id) }).catch(() => undefined);
      results.push({ scheduleId: String(schedule._id), status: "failed", taskId: String(task._id), reason: message });
    }
  }
  return NextResponse.json({ status: "ok", processed: results.length, results });
}
