export type WhatsAppAiDisposition = "budget_exhausted" | "approval_required" | "execute";

export function resolveWhatsAppAiDisposition(
  requiresApproval: boolean,
  usedTokens: number,
  maxDailyTokens: number,
): WhatsAppAiDisposition {
  const used = Number.isFinite(usedTokens) ? Math.max(0, usedTokens) : 0;
  const limit = Number.isFinite(maxDailyTokens) ? Math.max(0, maxDailyTokens) : 0;
  if (limit === 0 || used >= limit) return "budget_exhausted";
  return requiresApproval ? "approval_required" : "execute";
}
