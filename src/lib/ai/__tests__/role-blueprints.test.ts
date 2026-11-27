import { AI_ROLE_BLUEPRINT_NAMES, getAIRoleBlueprint, getAIRolePermissions } from "../role-blueprints";

describe("TGO AI role blueprint coverage", () => {
  it("defines an explicit remit, prompt and least-privilege permission set for every registered role", () => {
    expect(AI_ROLE_BLUEPRINT_NAMES).toHaveLength(49);
    for (const role of AI_ROLE_BLUEPRINT_NAMES) {
      const blueprint = getAIRoleBlueprint(role, "Test Department");
      expect(blueprint.description).toContain(role);
      expect(blueprint.responsibilities.length).toBeGreaterThan(0);
      expect(blueprint.deliverables.length).toBeGreaterThan(0);
      expect(blueprint.systemInstructions).toContain(role);
      expect(getAIRolePermissions(role).length).toBeGreaterThan(0);
    }
  });

  it("gives the Founder AI Executive Partner explicit founder-boundary instructions", () => {
    const blueprint = getAIRoleBlueprint("Founder AI Executive Partner", "Executive");
    expect(blueprint.responsibilities.join(" ")).toMatch(/Never impersonate the founder/);
    expect(blueprint.systemInstructions).toMatch(/Never impersonate the founder/);
  });
});
