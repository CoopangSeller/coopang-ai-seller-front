export function parseNumber(input: string): number {
  if (!input) return 0;
  // allow commas, spaces, % sign
  const normalized = input.replace(/,/g, "").replace(/\s+/g, "").replace(/%/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function formatNumber(n: number, opts?: { maximumFractionDigits?: number }): string {
  const maximumFractionDigits = opts?.maximumFractionDigits ?? 0;
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("ko-KR", { maximumFractionDigits });
}

export function formatDecimal(n: number, fractionDigits: number): string {
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("ko-KR", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function formatPercent(rate0to1: number, fractionDigits = 2): string {
  const pct = (rate0to1 || 0) * 100;
  return formatDecimal(pct, fractionDigits) + "%";
}
