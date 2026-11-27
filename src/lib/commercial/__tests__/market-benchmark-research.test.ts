import { MARKET_BENCHMARK_RESEARCH } from "../market-benchmark-research";

describe("researched Nigerian market benchmarks", () => {
  it("contains dated, sourced, internally consistent evidence only", () => {
    expect(MARKET_BENCHMARK_RESEARCH.length).toBeGreaterThan(0);
    for (const item of MARKET_BENCHMARK_RESEARCH) {
      const benchmark = item.benchmark;
      expect(item.serviceNames.length).toBeGreaterThan(0);
      expect(benchmark.currency).toBe("NGN");
      expect(benchmark.checkedAt).toBe("2026-11-27");
      expect(benchmark.low).toBeGreaterThanOrEqual(0);
      expect(benchmark.low).toBeLessThanOrEqual(benchmark.typical);
      expect(benchmark.typical).toBeLessThanOrEqual(benchmark.high);
      expect(benchmark.methodology.length).toBeGreaterThan(40);
      expect(benchmark.sources.length).toBeGreaterThan(0);
      for (const source of benchmark.sources) {
        expect(source.url).toMatch(/^https:\/\//);
        expect(source.label.length).toBeGreaterThan(5);
      }
    }
  });

  it("does not claim a national average for the researched midpoint", () => {
    expect(MARKET_BENCHMARK_RESEARCH.every(item => /midpoint|not a market average|not an observed average/i.test(item.benchmark.methodology))).toBe(true);
  });
});
