import { ModelType } from "@/shared/types";
import { MissingOpenAIApiKeyError } from "@/shared/lib/async";

export type ImageAspect = "9:16" | "1:1";
export type GenerateImageOptions = {
  allowText?: boolean;
  imageSize?: string;
  modelOverride?: string;
  quality?: "low" | "medium" | "high";
  background?: "opaque" | "transparent";
};
export type JsonOptions = { referenceImages?: string[]; useWebSearch?: boolean };
export interface AiUsage {
  model: string;
  kind: "text" | "image";
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens: number;
  cacheWriteInputTokens: number;
  textInputTokens: number;
  imageInputTokens: number;
  reasoningTokens: number;
  webSearchCalls: number;
}
export interface TrackedResult<T> {
  value: T;
  usage: AiUsage;
}

export interface AiUsageSummary {
  requestCount: number;
  textRequestCount: number;
  imageRequestCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  webSearchCalls: number;
  estimatedCostUsd: number;
}
export const Type = { ARRAY: "array", OBJECT: "object", STRING: "string" } as const;

const zeroUsage = (model: string, kind: "text" | "image"): AiUsage => ({
  model,
  kind,
  requestCount: 1,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  cachedInputTokens: 0,
  cacheWriteInputTokens: 0,
  textInputTokens: 0,
  imageInputTokens: 0,
  reasoningTokens: 0,
  webSearchCalls: 0,
});

export function summarizeAiUsage(items: AiUsage[]): AiUsageSummary {
  return items.reduce<AiUsageSummary>(
    (summary, item) => {
      const requests = item.requestCount || 1;
      summary.requestCount += requests;
      summary.textRequestCount += item.kind === "text" ? requests : 0;
      summary.imageRequestCount += item.kind === "image" ? requests : 0;
      summary.inputTokens += item.inputTokens;
      summary.outputTokens += item.outputTokens;
      summary.totalTokens += item.totalTokens;
      summary.webSearchCalls += item.webSearchCalls;

      if (item.kind === "image") {
        summary.estimatedCostUsd +=
          (item.textInputTokens * 5 + item.imageInputTokens * 8 + item.outputTokens * 30) /
          1_000_000;
      } else if (item.model.startsWith("gpt-6-astra")) {
        const cached = Math.min(item.inputTokens, item.cachedInputTokens);
        const cacheWrite = Math.min(
          Math.max(0, item.inputTokens - cached),
          item.cacheWriteInputTokens,
        );
        const regular = Math.max(0, item.inputTokens - cached - cacheWrite);
        summary.estimatedCostUsd +=
          (regular * 10 + cached * 1 + cacheWrite * 12.5 + item.outputTokens * 50) /
          1_000_000;
      }
      summary.estimatedCostUsd += item.webSearchCalls * 0.01;
      return summary;
    },
    {
      requestCount: 0,
      textRequestCount: 0,
      imageRequestCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      webSearchCalls: 0,
      estimatedCostUsd: 0,
    },
  );
}

async function request<T>(body: object, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
      if (data?.error?.code === "missing_api_key") throw new MissingOpenAIApiKeyError();
      throw Object.assign(
        new Error(data?.error?.message || "AI 서버 연결 실패 (" + response.status + ")"),
        { code: data?.error?.code || response.status, status: response.status },
      );
    }
    return data.result as T;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("AI 생성 대기 시간이 초과됐습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function generateJsonWithSchema<T>(
  model: string,
  prompt: string,
  schema: unknown,
  options?: JsonOptions,
): Promise<T> {
  return request<T>(
    {
      action: options?.useWebSearch ? "research" : "json",
      model,
      prompt,
      schema,
      referenceImages: options?.referenceImages ?? [],
    },
    options?.useWebSearch ? 180_000 : 120_000,
  );
}

export function generateJsonWithSchemaTracked<T>(
  model: string,
  prompt: string,
  schema: unknown,
  options?: JsonOptions,
): Promise<TrackedResult<T>> {
  return request<TrackedResult<T>>(
    {
      action: options?.useWebSearch ? "research" : "json",
      model,
      prompt,
      schema,
      referenceImages: options?.referenceImages ?? [],
      includeUsage: true,
    },
    options?.useWebSearch ? 180_000 : 120_000,
  ).then((result) => ({
    value: result.value,
    usage: result.usage ?? zeroUsage(model, "text"),
  }));
}

export function generateImage(
  prompt: string,
  modelType: ModelType,
  aspectRatio: ImageAspect,
  referenceImages?: string[],
  opts?: GenerateImageOptions,
): Promise<string | null> {
  return request<string>(
    {
      action: "image",
      model: opts?.modelOverride || modelType,
      prompt,
      aspectRatio,
      referenceImages: referenceImages ?? [],
      quality: opts?.quality ?? (modelType === ModelType.PAID ? "high" : "medium"),
      imageSize: opts?.imageSize ?? "2K",
      allowText: opts?.allowText ?? true,
      background: opts?.background ?? "opaque",
    },
    210_000,
  );
}

export function generateImageTracked(
  prompt: string,
  modelType: ModelType,
  aspectRatio: ImageAspect,
  referenceImages?: string[],
  opts?: GenerateImageOptions,
): Promise<TrackedResult<string | null>> {
  const model = opts?.modelOverride || modelType;
  return request<TrackedResult<string | null>>(
    {
      action: "image",
      model,
      prompt,
      aspectRatio,
      referenceImages: referenceImages ?? [],
      quality: opts?.quality ?? (modelType === ModelType.PAID ? "high" : "medium"),
      imageSize: opts?.imageSize ?? "2K",
      allowText: opts?.allowText ?? true,
      background: opts?.background ?? "opaque",
      includeUsage: true,
    },
    210_000,
  ).then((result) => ({
    value: result.value,
    usage: result.usage ?? zeroUsage(String(model), "image"),
  }));
}
