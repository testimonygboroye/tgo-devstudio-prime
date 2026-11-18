export type AIAgentAccessInput = {
  isFounder: boolean;
  userId: string;
  positionId?: string;
  hasPrivateCounterpart: boolean;
};

export function buildAccessibleAIAgentFilter(input: AIAgentAccessInput): Record<string, unknown> | null {
  if (input.isFounder) return { enabled: true };
  if (!input.userId) return null;
  if (input.hasPrivateCounterpart) return { enabled: true, assignedUserId: input.userId };
  const scope: Record<string, unknown>[] = [{ assignedUserId: input.userId }];
  if (input.positionId && /^[a-f0-9]{24}$/i.test(input.positionId)) {
    scope.push({ positionId: input.positionId, assignedUserId: { $exists: false } });
  }
  return { enabled: true, $or: scope };
}
