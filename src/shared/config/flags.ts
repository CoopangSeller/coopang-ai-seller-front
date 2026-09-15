// src/shared/config/flags.ts
export const flags = {
  // The standalone Vercel deployment runs without the separate auth backend.
  // Enable the backend explicitly when deploying with authentication enabled.
  apiEnabled: (import.meta.env.VITE_API_ENABLED ?? "false") === "true",
} as const;
