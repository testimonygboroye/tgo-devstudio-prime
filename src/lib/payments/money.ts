export function currencyMinorUnitExponent(currency: string): number { void currency; return 2; }

export function toMinorUnits(amount: number, currency: string): number {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Money amount must be a non-negative finite number.");
  if (currency.toUpperCase() === "XOF" && !Number.isInteger(amount)) throw new Error("XOF payments must use whole-number amounts.");
  const minor = Math.round((amount + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(minor)) throw new Error("Money amount exceeds the supported precision.");
  return minor;
}

export function fromMinorUnits(amountMinor: number, currency: string): number {
  void currency;
  if (!Number.isSafeInteger(amountMinor)) throw new Error("Minor-unit amount must be a safe integer.");
  return amountMinor / 100;
}
