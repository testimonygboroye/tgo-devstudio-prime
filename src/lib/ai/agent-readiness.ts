export interface AgentReadinessInput {
  jobTitle?: string;
  department?: string;
  description?: string;
  responsibilities?: string[];
  deliverables?: string[];
  systemInstructions?: string;
  permissions?: string[];
  toolAllowlist?: string[];
  reportsToRole?: string;
  reportsToAgentId?: unknown;
  memoryConfig?: { enabled?: boolean; identityKey?: string; sharedMemoryScopes?: string[] };
  executionConfig?: { maxConcurrentTasks?: number; timeoutSeconds?: number; maxDailyTokens?: number };
  approvalRequirements?: string[];
  performanceTargets?: Array<{ metric?: string; target?: number; unit?: string }>;
  modelName?: string;
}
export interface AgentReadinessResult {
  ready: boolean;
  status: "not_configured" | "needs_review" | "ready";
  issues: string[];
}
/** Operational readiness is deliberately separate from the enabled flag.
 * Missing governance, memory, role definition or execution limits block readiness. */
export function evaluateAgentReadiness(agent: AgentReadinessInput): AgentReadinessResult {
  const issues: string[] = [];
  if (!agent.jobTitle?.trim()) issues.push("Missing job title.");
  if (!agent.department?.trim()) issues.push("Missing department.");
  if (!agent.description?.trim()) issues.push("Missing job description.");
  if (!agent.responsibilities?.length) issues.push("No responsibilities defined.");
  if (!agent.deliverables?.length) issues.push("No measurable deliverables defined.");
  if (!agent.systemInstructions?.trim()) issues.push("Missing role-specific system instructions.");
  if (!agent.reportsToRole?.trim() && !agent.reportsToAgentId) issues.push("Missing reporting relationship.");
  if (!agent.memoryConfig?.enabled || !agent.memoryConfig.identityKey?.trim()) issues.push("Persistent role memory is not configured.");
  if (!agent.executionConfig?.maxConcurrentTasks || !agent.executionConfig.timeoutSeconds || !agent.executionConfig.maxDailyTokens) issues.push("Execution limits are incomplete.");
  if (!agent.approvalRequirements?.length) issues.push("Approval requirements are not defined.");
  if (!agent.performanceTargets?.length) issues.push("Performance monitoring targets are not defined.");
  if (!agent.modelName?.trim()) issues.push("No preferred model is configured.");
  if (!agent.permissions?.length || !agent.toolAllowlist?.length) issues.push("No role-specific operational tools and permissions are configured.");
  const notConfigured = !agent.jobTitle && !agent.department && !agent.description;
  return { ready: issues.length === 0, status: issues.length === 0 ? "ready" : notConfigured ? "not_configured" : "needs_review", issues };
}
