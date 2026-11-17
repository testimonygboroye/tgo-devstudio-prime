import { buildProviderAttempts } from "@/lib/ai/provider-runtime";

describe("AI employee provider fallback order", () => {
  it("tries the agent's assigned provider before the admin chatbot chain", () => {
    expect(buildProviderAttempts("agent-provider", "agent-model", {
      providerId: "admin-primary",
      modelName: "admin-model",
      fallbacks: [
        { providerId: "fallback-one", modelName: "fallback-model-one" },
        { providerId: "fallback-two", modelName: "fallback-model-two" },
      ],
    })).toEqual([
      { providerId: "agent-provider", modelName: "agent-model" },
      { providerId: "admin-primary", modelName: "admin-model" },
      { providerId: "fallback-one", modelName: "fallback-model-one" },
      { providerId: "fallback-two", modelName: "fallback-model-two" },
    ]);
  });

  it("keeps the agent's assigned model when the admin chain repeats its provider", () => {
    expect(buildProviderAttempts("shared-provider", "agent-model", {
      providerId: "shared-provider",
      modelName: "admin-model",
      fallbacks: [{ providerId: "backup-provider", modelName: "backup-model" }],
    })).toEqual([
      { providerId: "shared-provider", modelName: "agent-model" },
      { providerId: "backup-provider", modelName: "backup-model" },
    ]);
  });

  it("supports the legacy single fallback configuration", () => {
    expect(buildProviderAttempts("agent-provider", "agent-model", {
      providerId: "admin-primary",
      modelName: "admin-model",
      fallbackProviderId: "legacy-backup",
      fallbackModelName: "legacy-model",
    })).toEqual([
      { providerId: "agent-provider", modelName: "agent-model" },
      { providerId: "admin-primary", modelName: "admin-model" },
      { providerId: "legacy-backup", modelName: "legacy-model" },
    ]);
  });
});
