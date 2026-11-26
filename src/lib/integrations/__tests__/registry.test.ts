import { INTEGRATION_REGISTRY } from "../registry";

describe("TGO integration catalogue", () => {
  it("uses unique stable provider IDs", () => {
    const ids = INTEGRATION_REGISTRY.map((provider) => provider.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("defines credential metadata for every catalogue entry", () => {
    for (const provider of INTEGRATION_REGISTRY) {
      expect(provider.id).toMatch(/^[a-z0-9_]+$/);
      expect(provider.name.trim()).not.toBe("");
      expect(provider.description.trim()).not.toBe("");
      expect(Array.isArray(provider.fields)).toBe(true);
      expect(typeof provider.testable).toBe("boolean");
      expect(provider.testLabel.trim()).not.toBe("");
    }
  });

  it("covers native mobile app delivery, subscriptions and push services", () => {
    const ids = new Set(INTEGRATION_REGISTRY.map((provider) => provider.id));
    for (const id of ["expo", "app_store_connect", "apple_developer", "google_play_console", "firebase_app_distribution", "revenuecat", "onesignal", "bitrise", "codemagic", "fastlane", "ionic"]) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it("does not label unsupported provider adapters as live-testable", () => {
    const unsupportedMobile = ["app_store_connect", "apple_developer", "google_play_console", "firebase_app_distribution", "codemagic", "appcircle", "fastlane"];
    for (const id of unsupportedMobile) {
      const provider = INTEGRATION_REGISTRY.find((item) => item.id === id);
      expect(provider).toBeDefined();
      expect(provider?.testable).toBe(false);
    }
  });
});
