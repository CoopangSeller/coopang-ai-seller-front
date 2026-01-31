// src/shared/lib/format/numberFormat.ts
export function formatKrw(n?: number) {
  if (n == null || Number.isNaN(n)) return "";
  return "₩ " + Math.round(n).toLocaleString();
}

export function parseNumber(input: string): number | undefined {
  const cleaned = input.replace(/[^\d.-]/g, "");
  if (!cleaned) return undefined;
  const v = Number(cleaned);
  return Number.isFinite(v) ? v : undefined;
}
