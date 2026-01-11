export type ExportFormat = "webp" | "jpg";

export type ExportProgress = {
  current: number;
  total: number;
  phase: "idle" | "capture" | "zip" | "done";
};
