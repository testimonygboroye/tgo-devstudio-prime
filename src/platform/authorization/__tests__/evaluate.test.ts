import { evaluatePlatformPermission } from "../evaluate";

describe("evaluatePlatformPermission", () => {
  it("denies access when no matching grant exists", () => {
    const decision = evaluatePlatformPermission(
      { userId: "user-1", grants: [] },
      "finance.view"
    );
    expect(decision).toEqual({ allowed: false, reason: "no-grant" });
  });

  it("allows a global permission grant", () => {
    const decision = evaluatePlatformPermission(
      {
        userId: "user-1",
        grants: [{ permission: "projects.view", scope: "global" }],
      },
      "projects.view"
    );
    expect(decision.allowed).toBe(true);
  });

  it("supports module wildcards without matching sibling modules", () => {
    const principal = {
      userId: "user-1",
      grants: [{ permission: "projects.*", scope: "global" as const }],
    };
    expect(evaluatePlatformPermission(principal, "projects.create").allowed).toBe(true);
    expect(evaluatePlatformPermission(principal, "finance.view").allowed).toBe(false);
  });

  it("requires ownership for self-scoped grants", () => {
    const principal = {
      userId: "user-1",
      grants: [{ permission: "clients.view", scope: "self" as const }],
    };
    expect(
      evaluatePlatformPermission(principal, "clients.view", { ownerId: "user-1" }).allowed
    ).toBe(true);
    expect(
      evaluatePlatformPermission(principal, "clients.view", { ownerId: "user-2" }).allowed
    ).toBe(false);
  });

  it("does not allow a founder bypass to override an explicit deny", () => {
    const decision = evaluatePlatformPermission(
      {
        userId: "founder",
        isFounder: true,
        grants: [],
        deniedPermissions: ["finance.refunds.*"],
      },
      "finance.refunds.approve"
    );
    expect(decision).toEqual({ allowed: false, reason: "explicit-deny" });
  });

  it("restricts project-scoped grants to listed project ids", () => {
    const principal = {
      userId: "manager",
      grants: [
        {
          permission: "projects.deliverables.release",
          scope: "project" as const,
          resourceIds: ["project-a"],
        },
      ],
    };
    expect(
      evaluatePlatformPermission(principal, "projects.deliverables.release", {
        projectId: "project-a",
      }).allowed
    ).toBe(true);
    expect(
      evaluatePlatformPermission(principal, "projects.deliverables.release", {
        projectId: "project-b",
      }).allowed
    ).toBe(false);
  });
});
