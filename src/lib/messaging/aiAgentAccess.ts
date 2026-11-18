export type AIAgentAccessMode = "own" | "selected" | "all";

export type AIAgentAccessInput = {
  isFounder: boolean;
  userId: string;
  positionId?: string;
  hasPrivateCounterpart: boolean;
  accessMode?: AIAgentAccessMode;
  allowedAgentIds?: string[];
};

export function buildAccessibleAIAgentFilter(input: AIAgentAccessInput): Record<string, unknown> | null {
  if (input.isFounder) return { enabled: true };
  if (!input.userId) return null;
  if (input.accessMode === "all") return { enabled: true };

  const scope: Record<string, unknown>[] = [];
  if (input.hasPrivateCounterpart) {
    scope.push({ assignedUserId: input.userId });
  } else {
    scope.push({ assignedUserId: input.userId });
    if (input.positionId && /^[a-f0-9]{24}$/i.test(input.positionId)) {
      scope.push({ positionId: input.positionId, assignedUserId: { $exists: false } });
    }
  }

  if (input.accessMode === "selected") {
    const selectedIds = [...new Set((input.allowedAgentIds || []).filter(id => /^[a-f0-9]{24}$/i.test(id)))];
    if (selectedIds.length) scope.push({ _id: { $in: selectedIds } });
  }

  return { enabled: true, $or: scope };
}
