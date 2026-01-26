// src/shared/api/gemini/lib/isModelOverloadedError.ts
export function isModelOverloadedError(e: any) {
  const msg = e?.message?.toLowerCase?.() ?? "";

  return (
    e?.code === 503 ||
    e?.code === 429 ||
    e?.status === "UNAVAILABLE" ||
    msg.includes("overloaded") ||
    msg.includes("temporarily unavailable") ||
    msg.includes("resource exhausted")
  );
}
