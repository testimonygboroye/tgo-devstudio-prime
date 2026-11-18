import { buildAccessibleAIAgentFilter } from "@/lib/messaging/aiAgentAccess";

describe("messaging AI employee access scope", () => {
  it("lets the founder see every enabled AI employee", () => {
    expect(buildAccessibleAIAgentFilter({ isFounder: true, userId: "founder-id", hasPrivateCounterpart: false })).toEqual({ enabled: true });
  });
  it("restricts an employee with a private counterpart to that counterpart by default", () => {
    expect(buildAccessibleAIAgentFilter({ isFounder: false, userId: "employee-id", positionId: "6af000000000000000000001", hasPrivateCounterpart: true })).toEqual({
      enabled: true, $or: [{ assignedUserId: "employee-id" }],
    });
  });
  it("exposes only the employee's own role counterpart by default", () => {
    expect(buildAccessibleAIAgentFilter({ isFounder: false, userId: "employee-id", positionId: "6af000000000000000000001", hasPrivateCounterpart: false })).toEqual({
      enabled: true,
      $or: [
        { assignedUserId: "employee-id" },
        { positionId: "6af000000000000000000001", assignedUserId: { $exists: false } },
      ],
    });
  });
  it("adds only founder-selected AI teammates to an employee's own counterpart", () => {
    expect(buildAccessibleAIAgentFilter({
      isFounder: false, userId: "employee-id", positionId: "6af000000000000000000001",
      hasPrivateCounterpart: false, accessMode: "selected",
      allowedAgentIds: ["6af000000000000000000010", "not-an-object-id"],
    })).toEqual({
      enabled: true,
      $or: [
        { assignedUserId: "employee-id" },
        { positionId: "6af000000000000000000001", assignedUserId: { $exists: false } },
        { _id: { $in: ["6af000000000000000000010"] } },
      ],
    });
  });
  it("allows all enabled AI employees only when the founder sets all access", () => {
    expect(buildAccessibleAIAgentFilter({
      isFounder: false, userId: "employee-id", hasPrivateCounterpart: true, accessMode: "all",
    })).toEqual({ enabled: true });
  });
  it("does not expose another role's AI employee when no role counterpart exists", () => {
    expect(buildAccessibleAIAgentFilter({ isFounder: false, userId: "employee-id", positionId: "", hasPrivateCounterpart: false })).toEqual({ enabled: true, $or: [{ assignedUserId: "employee-id" }] });
  });
  it("denies an unauthenticated non-founder scope", () => {
    expect(buildAccessibleAIAgentFilter({ isFounder: false, userId: "", hasPrivateCounterpart: false })).toBeNull();
  });
});
