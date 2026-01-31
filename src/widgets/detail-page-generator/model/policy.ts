import { withTimeout, retryOnce, TimeoutError} from "@/shared/lib/async";
import { runWithConcurrency } from "@/shared/lib/async/runWithConcurrency";
import { isModelOverloadedError } from "@/shared/api/gemini/lib/isModelOverloadedError";
import { planDetailPage, generateDetailSectionImage } from "../api/detailPlannerGemini";
import type { DetailImageSegment, ProductInfo } from "./types";
import { ModelType } from "@/shared/types/geminiModel.ts/types";
import type React from "react";

/** Timeout 에러 판별(문자열 비교 금지) */
export const isTimeoutError = (e: unknown): e is TimeoutError =>
  e instanceof TimeoutError;

/** 모델/정책 상수(한 곳에서만 관리) */
export const MODELS = {
  PLAN_PRIMARY: "gemini-3-pro-preview",
  PLAN_FALLBACK: "gemini-2.5-pro",
  IMAGE_PRIMARY: "gemini-3-pro-image-preview",
  IMAGE_FALLBACK: "gemini-2.5-flash-image",
} as const;

/**
 * 기획 정책
 * - 1차 모델로 기획
 * - Timeout이면 fallback 모델로 1회 재시도
 */
export async function planWithPolicy(args: {
  info: ProductInfo;
  maxPlanMs: number;
}) {
  const { info, maxPlanMs } = args;

  try {
    return await withTimeout(() => planDetailPage(info, MODELS.PLAN_PRIMARY), maxPlanMs);
  } catch (e) {
    if (!isTimeoutError(e)) throw e;

    return await withTimeout(
      () => planDetailPage(info, MODELS.PLAN_FALLBACK),
      Math.min(maxPlanMs, 30_000),
    );
  }
}

/**
 * 이미지 생성 정책(세그먼트 1개)
 * - primary(2K + 고급 모델) + timeout
 * - overload 등은 1회 retry(단, timeout은 retry 제외)
 * - timeout이면 fallback(1024 + 경량 모델)로 1회
 */
export async function imageWithPolicy(args: {
  info: ProductInfo;
  seg: DetailImageSegment;
  modelType: ModelType;
  referenceImages?: string[];
  primaryTimeoutMs?: number;
  fallbackTimeoutMs?: number;
}) {
  const {
    info,
    seg,
    modelType,
    referenceImages,
    primaryTimeoutMs = 75_000,
    fallbackTimeoutMs = 45_000,
  } = args;

  const primaryRun = () =>
    generateDetailSectionImage({
      info,
      seg,
      modelType,
      referenceImages,
      imageSize: "2K",
      allowText: true,
      overrideModel: modelType === ModelType.PAID ? MODELS.IMAGE_PRIMARY : undefined,
    });

  const fallbackRun = () =>
    generateDetailSectionImage({
      info,
      seg,
      modelType,
      referenceImages,
      imageSize: "1024",
      allowText: true,
      overrideModel: MODELS.IMAGE_FALLBACK,
    });

  try {
    return await retryOnce(
      () => withTimeout(() => primaryRun(), primaryTimeoutMs),
      {
        // timeout은 retry하지 말고 바로 fallback로 넘긴다
        shouldRetry: (e) => !isTimeoutError(e) && isModelOverloadedError(e),
      },
    );
  } catch (e) {
    // overload는 여기서 그대로 throw(UX에서 안내), timeout만 fallback
    if (isModelOverloadedError(e)) throw e;
    if (!isTimeoutError(e)) throw e;

    return await withTimeout(() => fallbackRun(), fallbackTimeoutMs);
  }
}

/**
 * 전체 섹션 이미지 생성(오케스트레이터)
 * - segmentsToUse: “기획 결과 배열”을 그대로 사용해 state 동기화 문제를 회피
 * - runId + planRunIdRef로 중단 시 늦게 온 응답이 state를 덮어쓰지 않도록 방지
 * - index 대신 id 매칭으로 안전하게 업데이트
 */
export async function generateAllSections(args: {
  segmentsToUse: DetailImageSegment[];
  runId: number;
  planRunIdRef: React.MutableRefObject<number>;
  setSegments: React.Dispatch<React.SetStateAction<DetailImageSegment[]>>;
  info: ProductInfo;
  modelType: ModelType;
  buildRefList: () => string[];
  concurrency?: number;
}) {
  const {
    segmentsToUse,
    runId,
    planRunIdRef,
    setSegments,
    info,
    modelType,
    buildRefList,
    concurrency = 4,
  } = args;

  const refList = buildRefList();
  const refs = refList.length ? refList : info.referenceImages;

  const safeSetSegments = (
    updater: (prev: DetailImageSegment[]) => DetailImageSegment[],
  ) => {
    if (runId !== planRunIdRef.current) return;
    setSegments(updater);
  };

  const tasks = segmentsToUse.map((seg) => async () => {
    if (runId !== planRunIdRef.current) {
      return { id: seg.id, skipped: true as const, url: null as string | null };
    }

    const url = await imageWithPolicy({
      info,
      seg,
      modelType,
      referenceImages: refs,
    });

    return { id: seg.id, skipped: false as const, url: url ?? null };
  });

  await runWithConcurrency(tasks, concurrency, (i, r) => {
    if (runId !== planRunIdRef.current) return;

    const segId = segmentsToUse[i]?.id;

    if (r.status === "fulfilled") {
      const { id, skipped, url } = r.value;
      if (skipped) return;

      safeSetSegments((prev) => {
        const idx = prev.findIndex((s) => s.id === id);
        if (idx === -1) return prev;

        const next = [...prev];
        next[idx] = {
          ...next[idx],
          imageUrl: url ?? next[idx].imageUrl,
          isGenerating: false,
        };
        return next;
      });
    } else {
      console.error("Generation error for segment", segId ?? i, r.reason);
      if (!segId) return;

      safeSetSegments((prev) => {
        const idx = prev.findIndex((s) => s.id === segId);
        if (idx === -1) return prev;

        const next = [...prev];
        next[idx] = { ...next[idx], isGenerating: false };
        return next;
      });
    }
  });
}
