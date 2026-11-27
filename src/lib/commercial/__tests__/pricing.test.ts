import { calculateCommercialOrderTotal, resolveCommercialPrice } from "../pricing";

describe("commercial promotional pricing", () => {
  const now = new Date("2026-11-27T12:00:00.000Z");
  it("uses the promotional price only inside the configured window", () => {
    const result = resolveCommercialPrice({ price: 100000, originalPrice: 120000, promotionPrice: 80000, promotionStartsAt: "2026-11-27T00:00:00.000Z", promotionEndsAt: "2026-11-28T00:00:00.000Z" }, now);
    expect(result.amount).toBe(80000);
    expect(result.promotionActive).toBe(true);
    expect(result.currencyAmountBeforePromotion).toBe(120000);
  });
  it("restores normal price after expiry", () => {
    const result = resolveCommercialPrice({ price: 100000, promotionPrice: 80000, promotionEndsAt: "2026-11-26T23:59:59.000Z" }, now);
    expect(result.amount).toBe(100000);
    expect(result.promotionActive).toBe(false);
  });
  it("does not activate a promotion that has not started", () => {
    expect(resolveCommercialPrice({ price: 100000, promotionPrice: 80000, promotionStartsAt: "2026-11-28T00:00:00.000Z" }, now).amount).toBe(100000);
  });
  it("calculates quantities and optional add-ons from server prices", () => {
    expect(calculateCommercialOrderTotal([{ price: { price: 100, promotionPrice: 80 }, quantity: 2, addOns: [10, 5] }], now)).toBe(190);
  });
});
