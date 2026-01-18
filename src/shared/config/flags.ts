// src/shared/config/flags.ts
export const flags = {
  apiEnabled: (import.meta.env.VITE_API_ENABLED ?? "true") === "true",
} as const;
