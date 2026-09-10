import { ModelType } from "@/shared/types";
import { MissingOpenAIApiKeyError } from "@/shared/lib/async";

export type ImageAspect = "9:16" | "1:1";
export type GenerateImageOptions = { allowText?: boolean; imageSize?: string; modelOverride?: string };
export const Type = { ARRAY: "array", OBJECT: "object", STRING: "string" } as const;

async function request<T>(body: object, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("/api/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
      if (data?.error?.code === "missing_api_key") throw new MissingOpenAIApiKeyError();
      throw Object.assign(new Error(data?.error?.message || "AI 서버 연결 실패 (" + response.status + ")"), {
        code: response.status, status: response.status,
      });
    }
    return data.result as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error("AI 생성 대기 시간이 초과됐습니다. 잠시 후 다시 시도해 주세요.");
    throw error;
  } finally { clearTimeout(timer); }
}

export function generateJsonWithSchema<T>(model: string, prompt: string, schema: unknown): Promise<T> {
  return request<T>({ action: "json", model, prompt, schema }, 120_000);
}

export function generateImage(prompt: string, modelType: ModelType, aspectRatio: ImageAspect,
  referenceImages?: string[], opts?: GenerateImageOptions): Promise<string | null> {
  return request<string>({ action: "image", model: opts?.modelOverride || modelType, prompt,
    aspectRatio, referenceImages: referenceImages ?? [],
    quality: modelType === ModelType.PAID ? "high" : "medium",
    imageSize: opts?.imageSize ?? "2K", allowText: opts?.allowText ?? true,
  }, 210_000);
}
