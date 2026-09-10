import { withTimeout, TimeoutError} from "@/shared/lib/async";
import { runWithConcurrency } from "@/shared/lib/async/runWithConcurrency";
import { planDetailPage, generateDetailSectionImage } from "../api/detailPlannerGemini";
import type { DetailImageSegment, ProductInfo } from "./types";
import { ModelType } from "@/shared/types";
import type React from "react";

/** Timeout 에러 판별(문자열 비교 금지) */
export const isTimeoutError = (e: unknown): e is TimeoutError =>
  e instanceof TimeoutError;

/** 모델/정책 상수(한 곳에서만 관리) */
export const MODELS = {
  PLAN_PRIMARY: "gpt-6-astra",
  PLAN_FALLBACK: "gpt-4.1",
  IMAGE_PRIMARY: "gpt-image-2.5-sunburst",
  IMAGE_FALLBACK: "gpt-image-2.5-flare",
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
 * - 선택한 모델로 생성하며 API 계층에서 시간 제한을 처리합니다.
 * - 이미지 중복 과금을 피하기 위해 자동 재요청하지 않습니다.
 */
export async function imageWithPolicy(args: {
  info: ProductInfo;
  seg: DetailImageSegment;
  modelType: ModelType;
  referenceImages?: string[];
}) {
  const {
    info,
    seg,
    modelType,
    referenceImages,
  } = args;

  return generateDetailSectionImage({
    info, seg, modelType, referenceImages, imageSize: "2K", allowText: true,
    overrideModel: modelType === ModelType.PAID ? MODELS.IMAGE_PRIMARY : MODELS.IMAGE_FALLBACK,
  });
}


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
