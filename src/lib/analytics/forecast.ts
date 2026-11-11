export function forecastMonthlyRevenue(monthly: Record<string, Array<{ month: string; amountMinor: number; transactions: number }>>) {
  return Object.entries(monthly).map(([currency, rows]) => {
    const values = rows.slice(-6).map((row) => row.amountMinor);
    if (values.length < 2) return { currency, nextMonthAmountMinor: null, confidence: "insufficient_history", historyMonths: values.length };
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, value) => sum + value, 0) / n;
    let numerator = 0, denominator = 0;
    values.forEach((value, index) => { numerator += (index - xMean) * (value - yMean); denominator += (index - xMean) ** 2; });
    const slope = denominator ? numerator / denominator : 0;
    return { currency, nextMonthAmountMinor: Math.max(0, Math.round(yMean + slope * n)), confidence: values.length >= 4 ? "directional" : "low", historyMonths: values.length };
  });
}
