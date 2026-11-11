import { forecastMonthlyRevenue } from "../executive";

describe("executive revenue forecasting", () => {
  it("does not invent a forecast when fewer than two months are available", () => {
    expect(forecastMonthlyRevenue({ NGN: [{ month: "2026-11", amountMinor: 250000, transactions: 2 }] })).toEqual([
      { currency: "NGN", nextMonthAmountMinor: null, confidence: "insufficient_history", historyMonths: 1 },
    ]);
  });

  it("projects a directional linear trend independently for each currency", () => {
    const result = forecastMonthlyRevenue({
      NGN: [
        { month: "2026-08", amountMinor: 10000, transactions: 1 },
        { month: "2026-09", amountMinor: 20000, transactions: 2 },
        { month: "2026-10", amountMinor: 30000, transactions: 3 },
      ],
      USD: [
        { month: "2026-09", amountMinor: 5000, transactions: 1 },
        { month: "2026-10", amountMinor: 5000, transactions: 1 },
      ],
    });
    expect(result).toEqual([
      { currency: "NGN", nextMonthAmountMinor: 50000, confidence: "low", historyMonths: 3 },
      { currency: "USD", nextMonthAmountMinor: 5000, confidence: "low", historyMonths: 2 },
    ]);
  });

  it("labels forecasts with four or more months as directional rather than guaranteed", () => {
    const result = forecastMonthlyRevenue({
      NGN: [100, 200, 300, 400].map((amountMinor, index) => ({
        month: "2026-0" + (index + 1), amountMinor, transactions: 1,
      })),
    });
    expect(result[0].nextMonthAmountMinor).toBe(650);
    expect(result[0].confidence).toBe("directional");
  });
});
