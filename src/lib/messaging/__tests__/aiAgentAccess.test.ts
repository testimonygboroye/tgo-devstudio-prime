import { buildAccessibleAIAgentFilter } from "@/lib/messaging/aiAgentAccess";

describe("messaging AI employee access scope", () => {
  it("lets the founder see every enabled AI employee", () => {
    expect(buildAccessibleAIAgentFilter({ isFounder: true, userId: "founder-id", hasPrivateCounterpart: false })).toEqual({ enabled: true });
  });
  it("restricts an employee with a private counterpart to that counterpart only", () => {
    expect(buildAccessibleAIAgentFilter({ isFounder: false, userId: "employee-id", positionId: "6af000000000000000000001", hasPrivateCounterpart: true })).toEqual({ enabled: true, assignedUserId: "employee-id" });
  });
  it("otherwise exposes only the employee's own role counterpart", () => {
    expect(buildAccessibleAIAgentFilter({ isFounder: false, userId: "employee-id", positionId: "6af000000000000000000001", hasPrivateCounterpart: false })).toEqual({
      enabled: true,
      $or: [
        { assignedUserId: "employee-id" },
        { positionId: "6af000000000000000000001", assignedUserId: { $exists: false } },
      ],
    });
  });
  it("does not expose another role's AI employee when no role counterpart exists", () => {
    expect(buildAccessibleAIAgentFilter({ isFounder: false, userId: "employee-id", positionId: "", hasPrivateCounterpart: false })).toEqual({ enabled: true, $or: [{ assignedUserId: "employee-id" }] });
  });
  it("denies an unauthenticated non-founder scope", () => {
    expect(buildAccessibleAIAgentFilter({ isFounder: false, userId: "", hasPrivateCounterpart: false })).toBeNull();
  });
});
