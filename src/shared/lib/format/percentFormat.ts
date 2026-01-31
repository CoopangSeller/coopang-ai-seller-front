export function feeRateToUiPercent(rate?: number) {
  if (rate == null || Number.isNaN(rate)) return "";
  return String(Math.round(rate * 1000) / 10); // 0.108 -> "10.8"
}

export function uiPercentToFeeRate(input: string): number | undefined {
  const cleaned = input.replace(/[^\d.-]/g, "");
  if (!cleaned) return undefined;
  const v = Number(cleaned);
  if (!Number.isFinite(v)) return undefined;
  return v / 100; // "10.8" -> 0.108
}
