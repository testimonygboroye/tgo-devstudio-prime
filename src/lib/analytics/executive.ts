import PaymentTransaction from "@/models/PaymentTransaction";
import CommercialOrder from "@/models/CommercialOrder";
import DeliveryProject from "@/models/DeliveryProject";
import DeliveryMilestone from "@/models/DeliveryMilestone";
import EmployeeProfile from "@/models/EmployeeProfile";
import Department from "@/models/Department";
import User from "@/models/User";
import ClientProfile from "@/models/ClientProfile";
import SupportTicket from "@/models/SupportTicket";
import BusinessOperation from "@/models/BusinessOperation";
import FinancialLedgerEntry from "@/models/FinancialLedgerEntry";
import AttendanceRecord from "@/models/AttendanceRecord";
import PlatformEvent from "@/models/PlatformEvent";
import IntegrationConnection from "@/models/IntegrationConnection";
import PlatformAuditEvent from "@/models/PlatformAuditEvent";
import { AIAgent, AITask, AIProvider } from "@/models/AIWorkforce";

const currencyTotals = (rows: Array<{ _id: string; total: number; count: number }>) =>
  rows.map((row) => ({ currency: row._id || "UNKNOWN", amountMinor: Number(row.total || 0), transactions: Number(row.count || 0) }));

export async function getExecutiveSnapshot() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [
    paidRevenue, paymentCounts, monthlyRevenue, orderCounts, projectCounts, overdueProjects, blockedMilestones,
    workforceCounts, departmentCounts, clientCounts, clientLifecycle, supportCounts, overdueTickets,
    operationCounts, agentCounts, taskCounts, tokenTotals, providerCounts, auditCounts, ledgerTotals, attendanceSummary, platformEventCounts, integrationCounts,
  ] = await Promise.all([
    PaymentTransaction.aggregate([
      { $match: { status: { $in: ["paid", "partially_refunded"] }, verifiedAt: { $exists: true } } },
      { $group: { _id: "$currency", total: { $sum: { $subtract: ["$amountMinor", { $ifNull: ["$refundAmountMinor", 0] }] } }, count: { $sum: 1 } } },
    ]),
    PaymentTransaction.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    PaymentTransaction.aggregate([
      { $match: { status: { $in: ["paid", "partially_refunded"] }, verifiedAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $dateToString: { format: "%Y-%m", date: "$verifiedAt" } }, currency: "$currency" }, total: { $sum: { $subtract: ["$amountMinor", { $ifNull: ["$refundAmountMinor", 0] }] } }, count: { $sum: 1 } } },
      { $sort: { "_id.month": 1 } },
    ]),
    CommercialOrder.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, value: { $sum: "$amount" } } }]),
    DeliveryProject.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    DeliveryProject.countDocuments({ targetDate: { $lt: now }, status: { $nin: ["completed", "cancelled"] } }),
    DeliveryMilestone.countDocuments({ status: "blocked" }),
    EmployeeProfile.aggregate([{ $group: { _id: "$employmentStatus", count: { $sum: 1 } } }]),
    Department.countDocuments({ status: "active" }),
    User.countDocuments({ accountType: "client" }),
    ClientProfile.aggregate([{ $group: { _id: "$lifecycle", count: { $sum: 1 } } }]),
    SupportTicket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    SupportTicket.countDocuments({ status: { $in: ["open", "in_progress", "waiting_on_team"] }, firstResponseDueAt: { $lt: now }, firstRespondedAt: { $exists: false } }),
    BusinessOperation.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    AIAgent.aggregate([{ $group: { _id: "$enabled", count: { $sum: 1 } } }]),
    AITask.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    AITask.aggregate([{ $group: { _id: null, inputTokens: { $sum: "$inputTokens" }, outputTokens: { $sum: "$outputTokens" } } }]),
    AIProvider.aggregate([{ $group: { _id: "$lastTestStatus", count: { $sum: 1 } } }]),
    PlatformAuditEvent.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    FinancialLedgerEntry.aggregate([{ $match: { postedAt: { $gte: thirtyDaysAgo } } }, { $group: { _id: { currency: "$currency", account: "$accountCode", direction: "$direction" }, total: { $sum: "$amountMinor" }, count: { $sum: 1 } } }]),
    AttendanceRecord.aggregate([{ $match: { workDate: { $gte: thirtyDaysAgo.toISOString().slice(0, 10) } } }, { $group: { _id: null, records: { $sum: 1 }, completedShifts: { $sum: { $cond: [{ $ne: ["$clockOutAt", null] }, 1, 0] } }, minutes: { $sum: { $cond: [{ $and: [{ $ne: ["$clockOutAt", null] }, { $ne: ["$clockInAt", null] }] }, { $divide: [{ $subtract: ["$clockOutAt", "$clockInAt"] }, 60000] }, 0] } } } }]),
    PlatformEvent.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    IntegrationConnection.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const countMap = (rows: Array<{ _id: string | boolean | null; count: number }>) =>
    Object.fromEntries(rows.map((row) => [String(row._id ?? "unknown"), Number(row.count || 0)]));
  const revenueByCurrency = currencyTotals(paidRevenue);
  const monthlyByCurrency: Record<string, Array<{ month: string; amountMinor: number; transactions: number }>> = {};
  for (const row of monthlyRevenue as Array<{ _id: { month: string; currency: string }; total: number; count: number }>) {
    const currency = row._id.currency || "UNKNOWN";
    (monthlyByCurrency[currency] ||= []).push({ month: row._id.month, amountMinor: Number(row.total || 0), transactions: Number(row.count || 0) });
  }
  const projectStatus = countMap(projectCounts);
  const workforceStatus = countMap(workforceCounts);
  const supportStatus = countMap(supportCounts);
  const aiTaskStatus = countMap(taskCounts);
  const token = tokenTotals[0] || { inputTokens: 0, outputTokens: 0 };
  return {
    generatedAt: now.toISOString(),
    coverage: {
      revenue: "Verified payment transactions; amounts are net of recorded refunds and grouped by currency.",
      finance: "Ledger entries are shown separately and are not mixed across currencies.",
      projects: "DeliveryProject and DeliveryMilestone records.",
      workforce: "EmployeeProfile records; inactive and terminated statuses are retained in the breakdown.",
      clients: "User client accounts and ClientProfile lifecycle records.",
      ai: "Configured agents, tasks, verified providers and recorded token usage.",
      platform: "Platform event outbox and configured integration connection statuses.",
    },
    revenue: { verifiedCollected: revenueByCurrency, monthly: monthlyByCurrency, paymentStatuses: countMap(paymentCounts), ledgerLast30Days: ledgerTotals.map((r: { _id: { currency: string; account: string; direction: string }; total: number; count: number }) => ({ currency: r._id.currency, account: r._id.account, direction: r._id.direction, amountMinor: r.total, entries: r.count })) },
    projects: { total: Object.values(projectStatus).reduce((a, b) => a + b, 0), byStatus: projectStatus, overdue: overdueProjects, blockedMilestones },
    workforce: { total: Object.values(workforceStatus).reduce((a, b) => a + b, 0), byStatus: workforceStatus, activeDepartments: departmentCounts, attendanceLast30Days: { records: Number(attendanceSummary[0]?.records || 0), completedShifts: Number(attendanceSummary[0]?.completedShifts || 0), hoursRecorded: Math.round(Number(attendanceSummary[0]?.minutes || 0) / 60) } },
    clients: { total: clientCounts, newLast30Days: await User.countDocuments({ accountType: "client", createdAt: { $gte: thirtyDaysAgo } }), lifecycle: countMap(clientLifecycle) },
    support: { byStatus: supportStatus, overdueFirstResponses: overdueTickets },
    operations: { byStatus: countMap(operationCounts) },
    aiWorkforce: { agents: countMap(agentCounts), tasks: aiTaskStatus, tokens: { input: Number(token.inputTokens || 0), output: Number(token.outputTokens || 0) }, providers: countMap(providerCounts) },
    activity: { auditEventsLast30Days: auditCounts },
    platform: { events: countMap(platformEventCounts), integrations: countMap(integrationCounts) },
  };
}

export function buildExecutiveInsights(snapshot: Awaited<ReturnType<typeof getExecutiveSnapshot>>) {
  const items: Array<{ fingerprint: string; title: string; summary: string; rationale: string; priority: "low" | "medium" | "high" | "critical"; domain: string; actionType: "create_follow_up" | "review_only"; actionPayload: Record<string, unknown> }> = [];
  if (snapshot.projects.overdue > 0) items.push({ fingerprint: "projects:overdue:" + snapshot.projects.overdue, title: "Resolve overdue delivery projects", summary: snapshot.projects.overdue + " active delivery project(s) have passed their target date.", rationale: "Overdue work can affect client confidence, milestone billing and team capacity. Review owners, blockers and revised delivery dates.", priority: snapshot.projects.overdue >= 5 ? "critical" : "high", domain: "projects", actionType: "create_follow_up", actionPayload: { type: "workflow", title: "Review overdue delivery projects", description: "Review each overdue active project, assign an owner, document blockers and agree revised delivery dates." } });
  if (snapshot.projects.blockedMilestones > 0) items.push({ fingerprint: "projects:blocked-milestones:" + snapshot.projects.blockedMilestones, title: "Unblock delivery milestones", summary: snapshot.projects.blockedMilestones + " milestone(s) are currently marked blocked.", rationale: "Blocked milestones may delay delivery and downstream approvals or payments. Identify dependencies and escalation owners.", priority: snapshot.projects.blockedMilestones >= 3 ? "high" : "medium", domain: "projects", actionType: "create_follow_up", actionPayload: { type: "workflow", title: "Review blocked project milestones", description: "Inspect blocked milestones, record dependency owners and agree a resolution plan." } });
  if (snapshot.support.overdueFirstResponses > 0) items.push({ fingerprint: "support:first-response:" + snapshot.support.overdueFirstResponses, title: "Address overdue client support responses", summary: snapshot.support.overdueFirstResponses + " open support ticket(s) have passed their first-response deadline.", rationale: "Response delays can increase client churn and escalation risk. Triage urgent tickets and rebalance assignments.", priority: snapshot.support.overdueFirstResponses >= 5 ? "critical" : "high", domain: "clients", actionType: "create_follow_up", actionPayload: { type: "workflow", title: "Triage overdue client support tickets", description: "Review overdue first-response tickets, prioritise urgent clients and assign response owners." } });
  const pendingPayments = snapshot.revenue.paymentStatuses.pending_review || 0;
  if (pendingPayments > 0) items.push({ fingerprint: "finance:pending-review:" + pendingPayments, title: "Review pending payment confirmations", summary: pendingPayments + " payment(s) are awaiting manual review.", rationale: "Unreviewed payment evidence can delay order progression and create reconciliation gaps. Confirm provider or bank evidence before posting any financial changes.", priority: pendingPayments >= 5 ? "high" : "medium", domain: "finance", actionType: "review_only", actionPayload: {} });
  const failedEvents = snapshot.platform.events.failed || 0;
  if (failedEvents > 0) items.push({ fingerprint: "platform:failed-events:" + failedEvents, title: "Improve platform event delivery reliability", summary: failedEvents + " platform event(s) are recorded as failed.", rationale: "Failed outbox events can prevent downstream integrations and workflows from receiving important business changes. Inspect failure reasons and retry only after confirming idempotency.", priority: failedEvents >= 5 ? "high" : "medium", domain: "platform", actionType: "create_follow_up", actionPayload: { type: "workflow", title: "Investigate failed platform events", description: "Review failed platform event records, confirm idempotency and retry or repair the affected event handlers." } });
  const failedAi = snapshot.aiWorkforce.tasks.failed || 0;
  if (failedAi > 0) items.push({ fingerprint: "ai:failed-tasks:" + failedAi, title: "Investigate failed AI workforce tasks", summary: failedAi + " AI task(s) are recorded as failed.", rationale: "Review provider availability, task permissions and failure details before retrying work.", priority: failedAi >= 5 ? "high" : "medium", domain: "ai-workforce", actionType: "review_only", actionPayload: {} });
  if (snapshot.workforce.total > 0 && (snapshot.workforce.byStatus.active || 0) === 0) items.push({ fingerprint: "workforce:no-active-employees", title: "Review workforce activation status", summary: "Employee profiles exist, but none are marked active.", rationale: "Confirm onboarding and employment-status records are current before interpreting capacity or performance.", priority: "high", domain: "workforce", actionType: "review_only", actionPayload: {} });
  return items;
}

export function forecastMonthlyRevenue(monthly: Record<string, Array<{ month: string; amountMinor: number; transactions: number }>>) {
  return Object.entries(monthly).map(([currency, rows]) => {
    const values = rows.slice(-6).map((row) => row.amountMinor);
    if (values.length < 2) return { currency, nextMonthAmountMinor: null, confidence: "insufficient_history", historyMonths: values.length };
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, value) => sum + value, 0) / n;
    let numerator = 0, denominator = 0;
    values.forEach((value, index) => { numerator += (index - xMean) * (value - yMean); denominator += (index - xMean) ** 2; });
    const slope = denominator ? numerator / denominator : 0;
    return { currency, nextMonthAmountMinor: Math.max(0, Math.round(yMean + slope * n)), confidence: values.length >= 4 ? "directional" : "low", historyMonths: values.length };
  });
}
