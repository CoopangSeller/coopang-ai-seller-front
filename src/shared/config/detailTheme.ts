// src/shared/config/detailTheme.ts
// Detail page theme tokens (Coupang-style: clean, readable, commercial)

export const detailTheme = {
  bg: "#FFFFFF",
  text: "#0F172A", // slate-900
  subText: "#475569", // slate-600
  line: "#E2E8F0", // slate-200
  accent: "#2563EB", // blue-600 (default)
  accentSoft: "#DBEAFE", // blue-100
} as const;

export type DetailTheme = typeof detailTheme;
