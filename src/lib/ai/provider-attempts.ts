type ProviderAttempt = { providerId: string; modelName: string };

/** The AI employee's assigned provider/model is always primary; admin chatbot providers are ordered fallbacks. */
export function buildProviderAttempts(
  agentProviderId: string,
  agentModel: string,
  config?: {
    providerId?: unknown;
    modelName?: string;
    fallbacks?: Array<{ providerId: unknown; modelName: string }>;
    fallbackProviderId?: unknown;
    fallbackModelName?: string;
  } | null,
): ProviderAttempt[] {
  const configured: ProviderAttempt[] = [
    ...(config?.providerId && config?.modelName
      ? [{ providerId: String(config.providerId), modelName: config.modelName }]
      : []),
    ...((config?.fallbacks || []).map((item) => ({ providerId: String(item.providerId), modelName: item.modelName }))),
    ...(config?.fallbacks?.length ? [] : (config?.fallbackProviderId && config?.fallbackModelName
      ? [{ providerId: String(config.fallbackProviderId), modelName: config.fallbackModelName }]
      : [])),
  ];
  const visited = new Set<string>();
  return [{ providerId: agentProviderId, modelName: agentModel }, ...configured].filter((attempt) => {
    if (!attempt.providerId || !attempt.modelName || visited.has(attempt.providerId)) return false;
    visited.add(attempt.providerId);
    return true;
  });
}
