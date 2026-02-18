export function toRoiPercent(value?: number | null): number | null {
  if (value == null) return null;
  if (!Number.isFinite(value)) return null;

  // 케이스 A) 이미 퍼센트로 저장(예: 143)
  if (value > 10) return value;

  // 케이스 B) 배수/비율로 저장(예: 1.43 -> 143%)
  return value * 100;
}

export function formatRoiPercent(value?: number | null): string {
  const pct = toRoiPercent(value);
  if (pct == null) return "-";
  // 0자리 정수 %로 통일(원하면 소수 1자리로 바꿔도 됨)
  return `${Math.round(pct)}%`;
}
