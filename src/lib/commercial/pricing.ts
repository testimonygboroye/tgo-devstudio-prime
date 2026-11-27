export interface PromotionalPriceInput {
  price: number;
  originalPrice?: number;
  promotionPrice?: number;
  promotionStartsAt?: Date | string;
  promotionEndsAt?: Date | string;
  promotionDescription?: string;
}
export interface ResolvedPrice {
  amount: number;
  currencyAmountBeforePromotion: number | null;
  promotionActive: boolean;
  promotionDescription: string;
  promotionStartsAt: Date | null;
  promotionEndsAt: Date | null;
}
function validDate(value?: Date | string): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
/** Resolve the authoritative price at request time. Expired and not-yet-started
 * promotions never affect checkout totals. Call this on the server for every order. */
export function resolveCommercialPrice(input: PromotionalPriceInput, now = new Date()): ResolvedPrice {
  const starts = validDate(input.promotionStartsAt);
  const ends = validDate(input.promotionEndsAt);
  const hasPromo = Number.isFinite(input.promotionPrice) && Number(input.promotionPrice) >= 0;
  const inWindow = (!starts || starts.getTime() <= now.getTime()) && (!ends || ends.getTime() >= now.getTime());
  const validDiscount = hasPromo && Number(input.promotionPrice) < input.price;
  const active = Boolean(validDiscount && inWindow);
  return {
    amount: active ? Number(input.promotionPrice) : Number(input.price),
    currencyAmountBeforePromotion: active ? Number(input.originalPrice ?? input.price) : null,
    promotionActive: active,
    promotionDescription: active ? String(input.promotionDescription || "") : "",
    promotionStartsAt: starts,
    promotionEndsAt: ends,
  };
}
export function calculateCommercialOrderTotal(items: Array<{ price: PromotionalPriceInput; quantity?: number; addOns?: number[] }>, now = new Date()): number {
  return items.reduce((sum, item) => {
    const quantity = Math.max(1, Math.floor(Number(item.quantity || 1)));
    const addOns = (item.addOns || []).reduce((subtotal, amount) => subtotal + Math.max(0, Number(amount) || 0), 0);
    return sum + (resolveCommercialPrice(item.price, now).amount + addOns) * quantity;
  }, 0);
}
