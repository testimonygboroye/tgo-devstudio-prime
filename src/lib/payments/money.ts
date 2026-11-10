const ZERO_DECIMAL_CURRENCIES = new Set(["XOF"]);

export function currencyMinorUnitExponent(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
}

export function toMinorUnits(amount: number, currency: string): number {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Money amount must be a non-negative finite number.");
  const factor = 10 ** currencyMinorUnitExponent(currency);
  const minor = Math.round((amount + Number.EPSILON) * factor);
  if (!Number.isSafeInteger(minor)) throw new Error("Money amount exceeds the supported precision.");
  return minor;
}

export function fromMinorUnits(amountMinor: number, currency: string): number {
  if (!Number.isSafeInteger(amountMinor)) throw new Error("Minor-unit amount must be a safe integer.");
  return amountMinor / (10 ** currencyMinorUnitExponent(currency));
}
