import { evaluateAgentReadiness } from "../agent-readiness";

describe("AI employee operational readiness", () => {
  it("blocks an employee missing operational foundations", () => {
    const result = evaluateAgentReadiness({ jobTitle: "Marketing Director", department: "Marketing" });
    expect(result.ready).toBe(false);
    expect(result.status).toBe("needs_review");
    expect(result.issues).toContain("Missing role-specific system instructions.");
  });
  it("does not require a provider-specific model assignment when the global router is available", () => {
    const result = evaluateAgentReadiness({
      jobTitle: "Operations Analyst", department: "Operations", description: "Reviews operational workflows.",
      responsibilities: ["Review workflows"], deliverables: ["Weekly report"], systemInstructions: "Follow TGO governance.",
      permissions: ["projects.read_summary"], toolAllowlist: ["projects.read_summary"], reportsToRole: "COO",
      memoryConfig: { enabled: true, identityKey: "tgo-role:operations:analyst", sharedMemoryScopes: ["company-approved"] },
      executionConfig: { maxConcurrentTasks: 1, timeoutSeconds: 120, maxDailyTokens: 50000 },
      approvalRequirements: ["external_communications"], performanceTargets: [{ metric: "completion", target: 90, unit: "percent" }],
      providerVerified: true,
    });
    expect(result.ready).toBe(true);
    expect(result.issues).not.toContain("No preferred model is configured.");
  });
  it("marks only fully configured roles as ready", () => {
    const result = evaluateAgentReadiness({
      jobTitle: "Marketing Director", department: "Marketing", description: "Leads marketing strategy.",
      responsibilities: ["Plan campaigns"], deliverables: ["Monthly report"], systemInstructions: "Act as TGO marketing director.",
      permissions: ["marketing.read"], toolAllowlist: ["marketing.read"], reportsToRole: "CEO",
      memoryConfig: { enabled: true, identityKey: "tgo-role:marketing:director", sharedMemoryScopes: ["company-approved"] },
      executionConfig: { maxConcurrentTasks: 1, timeoutSeconds: 120, maxDailyTokens: 50000 },
      approvalRequirements: ["external_communications"], performanceTargets: [{ metric: "completion", target: 90, unit: "percent" }],
      modelName: "configured-model", providerVerified: true,
    });
    expect(result.ready).toBe(true);
    expect(result.status).toBe("ready");
    expect(result.issues).toHaveLength(0);
  });
});
