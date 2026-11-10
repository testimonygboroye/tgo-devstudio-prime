import { tierForLifetimePoints } from "@/lib/engagement/tiers";
describe("tierForLifetimePoints", () => {
  it("keeps users in starter until 1,500 points", () => {
    expect(tierForLifetimePoints(0)).toBe("starter");
    expect(tierForLifetimePoints(1499)).toBe("starter");
  });
  it("assigns the exact silver, gold and platinum thresholds", () => {
    expect(tierForLifetimePoints(1500)).toBe("silver");
    expect(tierForLifetimePoints(4999)).toBe("silver");
    expect(tierForLifetimePoints(5000)).toBe("gold");
    expect(tierForLifetimePoints(9999)).toBe("gold");
    expect(tierForLifetimePoints(10000)).toBe("platinum");
  });
});
