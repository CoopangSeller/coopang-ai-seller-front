// src/widgets/detail-page-generator/model/useDetailPlannerState.ts
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DetailImageSegment,
  DetailShotKey,
  ModelType,
  PageLength,
  ProductInfo,
} from "@/shared/types/types";
import { planDetailPage, generateDetailSectionImage } from "../api/detailPlannerGemini";
import { heuristicUspFromPaste, tryServerCrawl } from "../lib/usp";
import { buildCutPrompt } from "../lib/cutPrompts";
import { useZipExport } from "@/features/file/file-export";
import { useDraft } from "@/features/draft/model/useDraft";
import { generateImage } from "@/shared/api/gemini/geminiService";
import { withTimeout } from "@/shared/lib/async/withTimeout";
import { isModelOverloadedError } from "@/shared/api/gemini/lib/isModelOverloadedError";

const DRAFT_KEY = "detail-planner:v2";
const SHOT_KEYS: DetailShotKey[] = ["cutout", "lifestyle", "model"];
const MAX_PLAN_MS = 120000; // 120초 까지만 기획안 작성 대기

function normalizeUsp(s: string) {
  return (s ?? "").trim();
}

function snapshot(seg: DetailImageSegment) {
  return {
    keyMessage: seg.keyMessage,
    title: seg.title,
    logicalSections: seg.logicalSections,
    visualPrompt: seg.visualPrompt,
    imageUrl: seg.imageUrl,
    createdAt: Date.now(),
  };
}

export function useDetailPlannerState() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPlanning, setIsPlanning] = useState(false);
  const planRunIdRef = useRef(0); // ✅ 요청 식별자

  const [modelType, setModelType] = useState<ModelType>(ModelType.FREE);

  const [cutTab, setCutTab] = useState<DetailShotKey>("cutout");
  const [generatingCut, setGeneratingCut] = useState(false);

  const [cutPreviews, setCutPreviews] = useState<Record<DetailShotKey, string[]>>({
    cutout: [],
    lifestyle: [],
    model: [],
  });

  const [finalCuts, setFinalCuts] = useState<Record<DetailShotKey, string | null>>({
    cutout: null,
    lifestyle: null,
    model: null,
  });

  // Step3: 사용자가 추가 업로드하는 이미지들
  const [extraImages, setExtraImages] = useState<string[]>([]);

  // Step3: 사용자 추가 프롬프트
  const [finalExtraPrompt, setFinalExtraPrompt] = useState("");

  // USP 입력 보조
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorPaste, setCompetitorPaste] = useState("");
  const [uspLoading, setUspLoading] = useState(false);

  const initialInfo: ProductInfo = useMemo(
    () => ({
      name: "",
      category: "",
      price: "",
      features: "",
      targetGender: ["전체"],
      targetAge: ["30대"],
      pageLength: PageLength.STANDARD,
      referenceImages: [],
      pricing: { originalPrice: "", salePrice: "" },
      shots: {
        cutout: { key: "cutout", label: "누끼컷", referenceImages: [], prompt: "" },
        lifestyle: { key: "lifestyle", label: "활용컷", referenceImages: [], prompt: "" },
        model: { key: "model", label: "모델컷", referenceImages: [], prompt: "" },
      },
      detailExtraPrompt: "",
    }),
    [],
  );

  const { state: info, setState: setInfo, clear: clearInfoDraft } = useDraft<ProductInfo>(
    DRAFT_KEY,
    initialInfo,
    { version: 2 },
  );

  const normalizedUSP = useMemo(() => normalizeUsp(info.features), [info.features]);
  const [segments, setSegments] = useState<DetailImageSegment[]>([]);
  // ✅ 추가
  const segmentsRef = useRef<DetailImageSegment[]>([]);
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { downloading, progress, exportZip } = useZipExport();

  // canPlan: name/category + finalCuts 최소 1개
  const canPlan = useMemo(() => {
    const hasBasics = (info.name ?? "").trim() && (info.category ?? "").trim();
    const hasAnyFinal = !!finalCuts.cutout || !!finalCuts.lifestyle || !!finalCuts.model;
    return Boolean(hasBasics && hasAnyFinal);
  }, [info.name, info.category, finalCuts]);

  const onPickFinalCut = (key: DetailShotKey, imageDataUrl: string) => {
    setFinalCuts((p) => ({ ...p, [key]: imageDataUrl }));
  };

  const onUploadFinalCut = (key: DetailShotKey, dataUrl: string) => {
    setFinalCuts((p) => ({ ...p, [key]: dataUrl }));
  };

  const onClearFinalCut = (key: DetailShotKey) => {
    setFinalCuts((p) => ({ ...p, [key]: null }));
  };

  const onAddExtraImages = (dataUrls: string[]) => {
    setExtraImages((prev) => [...prev, ...dataUrls].slice(0, 24));
  };

  const onRemoveExtraImage = (index: number) => {
    setExtraImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onChangeFinalExtraPrompt = (v: string) => {
    setFinalExtraPrompt(v);
    // info에도 반영(기획안 prompt에 포함되도록)
    setInfo((p) => ({ ...p, detailExtraPrompt: v }));
  };

  const onGenerateCut = async (key: DetailShotKey) => {
    setGeneratingCut(true);
    try {
      const shot = info.shots[key];

      const prompt = buildCutPrompt({
        shot: key,
        productName: info.name,
        category: info.category,
        usp: normalizedUSP,
        intent: shot.prompt || "",
      });

      const refs = shot.referenceImages?.length ? shot.referenceImages : info.referenceImages;

      const imgs: string[] = [];
      for (let i = 0; i < 3; i++) {
        const url = await generateImage(prompt, modelType, "1:1", refs, {
          allowText: false,
          imageSize: "2K",
        });
        if (url) imgs.push(url);
      }

      setCutPreviews((p) => ({ ...p, [key]: imgs }));
    } catch (e) {
      console.error(e);
      alert("컷 미리 생성 중 오류가 발생했습니다.");
    } finally {
      setGeneratingCut(false);
    }
  };

  const onSuggestUSP = async () => {
    setUspLoading(true);
    try {
      let text = competitorPaste?.trim();

      if ((!text || text.length < 30) && competitorUrl.trim()) {
        const crawled = await tryServerCrawl(competitorUrl.trim());
        if (crawled) text = crawled;
      }

      const suggested = heuristicUspFromPaste(text || "");
      if (!suggested) {
        alert("붙여넣은 텍스트(또는 서버 크롤링 결과)가 부족합니다.");
        return;
      }

      setInfo((p) => ({ ...p, features: suggested }));
    } finally {
      setUspLoading(false);
    }
  };

  const cancelPlanning = () => {
    planRunIdRef.current++;     // 진행 중 요청 무효화
    setIsPlanning(false);       // 오버레이 끄기
    setStep(1);                 // Step1로 복귀 
  };

  const resetAll = () => {
    clearInfoDraft();
    setInfo(initialInfo);

    setCutPreviews({ cutout: [], lifestyle: [], model: [] });
    setFinalCuts({ cutout: null, lifestyle: null, model: null });
    setExtraImages([]);
    setFinalExtraPrompt("");

    setCompetitorUrl("");
    setCompetitorPaste("");
    setSegments([]);
    setStep(1);
  };

  const handlePlan = async () => {
    setIsPlanning(true);
    try {
      const result = await planDetailPage(info);
      setSegments(result);
      setStep(2);
    } catch (e) {
      console.error(e);
      alert("기획안 생성 중 오류가 발생했습니다.");
    } finally {
      setIsPlanning(false);
    }
  };

    /**
   * ✅ Step2(기획안 리뷰) 없이: 기획안 생성 → 곧바로 전체 이미지 생성 → Step3로 진입
   */
  const handlePlanAndGenerateAll = async () => {
    if (isPlanning) return;

    const runId = ++planRunIdRef.current;
    setIsPlanning(true);
    setStep(3);

    try {
      const planned = await withTimeout(
        planDetailPage(info),
        MAX_PLAN_MS
      );
      
      // ❗ 중단 후 늦게 온 응답 무시
      if (runId !== planRunIdRef.current) return;

      // 기획안 끝나면 로딩 종료
      setIsPlanning(false);
    
      // placeholder 먼저 깔아두고 생성 시작(섹션 자리부터 보이게)
      setSegments(planned.map((s) => ({ ...s, isGenerating: true })));

      await generateAllSections(planned);
    } catch (e: any) {
      if (runId !== planRunIdRef.current) return;

        setIsPlanning(false);

      if (isModelOverloadedError(e)) {
        alert(
          "현재 AI 서버가 혼잡하여 기획을 생성하지 못했습니다.\n\n" +
          "입력 문제는 아니며, 잠시 후 다시 시도해주세요."
        );
      } else if (e.message === "TIMEOUT") {
        alert(
          "기획 생성이 너무 오래 걸리고 있습니다.\n\n" +
          "AI 서버 혼잡으로 인한 현상이며,\n" +
          "잠시 후 다시 시도해주세요."
        );
      } else {
        alert("상세페이지 생성 중 오류가 발생했습니다.");
      }

      setStep(1);
    } finally {
      setIsPlanning(false);
    }
  };


const HISTORY_LIMIT = 10;
const VERSIONED_FIELDS: Array<keyof DetailImageSegment> = ["keyMessage"];

const updateSegment = (
  index: number,
  field: keyof DetailImageSegment,
  value: string,
) => {
  setSegments((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], [field]: value } as DetailImageSegment;
    return next;
  });
};

  // ✅ 공용 레퍼런스 구성 (handleGenerateAll과 섹션 재생성에서 동일 사용)
  const buildRefList = () => {
    const refList: string[] = [];

    // 최종컷 우선(과도 혼합 방지)
    for (const k of SHOT_KEYS) if (finalCuts[k]) refList.push(finalCuts[k]!);

    // extra 최대 2
    if (extraImages.length) refList.push(...extraImages.slice(0, 2));

    // 공통 referenceImages는 부족할 때만 채움(최대 3)
    if (info.referenceImages?.length && refList.length < 3) {
      refList.push(...info.referenceImages.slice(0, 3 - refList.length));
    }

    return refList;
  };

  /**
   * API 요청 동시 요청으로 이미지 전체 생성 속도 증가 시키기
   */
  const runWithConcurrency = async <T,>(
    tasks: Array<() => Promise<T>>,
    limit: number,
    onSettled?: (i: number, r: PromiseSettledResult<T>) => void,
  ) => {
    const results: PromiseSettledResult<T>[] = new Array(tasks.length);
    let next = 0;

    const worker = async () => {
      while (true) {
        const i = next++;
        if (i >= tasks.length) return;
        try {
          const v = await tasks[i]();
          const r: PromiseFulfilledResult<T> = { status: "fulfilled", value: v };
          results[i] = r;
          onSettled?.(i, r);
        } catch (e) {
          const r: PromiseRejectedResult = { status: "rejected", reason: e };
          results[i] = r;
          onSettled?.(i, r);
        }
      }
    };

    await Promise.all(Array.from({ length: limit }, worker));
    return results;
  };

  /**
   * ✅ 내부 실행 함수: 주어진 segments로 전체 이미지 생성
   * - React state 반영 타이밍 이슈(방금 setSegments 했는데 segments가 아직 이전값인 문제)를 피하려고
   *   segments를 인자로 받는다.
   */
  const generateAllSections = async (segmentsToUse: DetailImageSegment[]) => {
    const refList = buildRefList();
    const refs = refList.length ? refList : info.referenceImages;

    const tasks = segmentsToUse.map((seg) => async () => {
      const imageUrl = await generateDetailSectionImage(info, seg, modelType, refs);
      return imageUrl ?? null;
    });

    const CONCURRENCY = 4;

    await runWithConcurrency(tasks, CONCURRENCY, (i, r) => {
      if (r.status === "fulfilled") {
        const url = r.value;
        setSegments((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], imageUrl: url ?? next[i].imageUrl, isGenerating: false };
          return next;
        });
      } else {
        console.error("Generation error for segment", i, r.reason);
        setSegments((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], isGenerating: false };
          return next;
        });
      }
    });
  };

  // const handleGenerateAll = async () => {
  //   setIsPlanning(true);
  //   setStep(3);

  //   // 시작 시 generating 표시
  //   setSegments((prev) => prev.map((s) => ({ ...s, isGenerating: true })));

  //   await generateAllSections(segments);

  //   setIsPlanning(false);
  // };

  /**
   * ✅ 섹션 1개만 재생성
   * - seg.promptOverride가 있으면 visualPrompt 뒤에만 덧붙여 보완
   * - 생성 성공 시 기존 imageUrl을 history에 저장 (undo용)
   */
  const regenerateOne = async (index: number) => {
      // generating + history push + future clear
    setSegments((prev) => {
        const next = [...prev];
        const cur = next[index];

      const history = Array.isArray(cur.history) ? [...cur.history] : [];
      history.unshift(snapshot(cur));

      next[index] = {
        ...cur,
        isGenerating: true,
        history: history.slice(0, 10),
          future: [], // ✅ 새 생성은 redo 분기 끊기
      };
      return next;
    });

  try {
      const refList = buildRefList();

      // 가장 안전: prev 기반으로 seg를 읽기
      let segForGen: DetailImageSegment | null = null;
      setSegments((prev) => {
        segForGen = prev[index];
        return prev;
      });
      const seg = segForGen ?? segments[index];

      const override = (seg.promptOverride || "").trim();
      const mergedSeg: DetailImageSegment = override
        ? { ...seg, visualPrompt: `${seg.visualPrompt}\n\n[보완 요청]\n${override}` }
        : seg;

    const imageUrl = await generateDetailSectionImage(
      info,
      mergedSeg,
      modelType,
        refList.length ? refList : info.referenceImages,
    );
    console.log('hiih')

    setSegments((prev) => {
      const next = [...prev];
      next[index] = {
          ...next[index],
          imageUrl: imageUrl ?? next[index].imageUrl,
        isGenerating: false,
      };
      return next;
    });
  } catch (e) {
      console.error("regenerateOne error", e);
    setSegments((prev) => {
      const next = [...prev];
        next[index] = { ...next[index], isGenerating: false };
      return next;
    });
  }
};




  /**
   * ✅ 섹션 1개 되돌리기(undo)
   * - history에서 가장 최근 url 꺼내 복원
   */
  const undoOne = (index: number) => {
    setSegments((prev) => {
      const next = [...prev];
      const cur = next[index];

      const history = Array.isArray(cur.history) ? [...cur.history] : [];
      if (!history.length) return prev;

      const future = Array.isArray(cur.future) ? [...cur.future] : [];
      future.unshift(snapshot(cur)); // ✅ 현재 상태를 redo 스택으로

      const last = history.shift()!; // 가장 최근 과거 스냅샷

      next[index] = {
        ...cur,
        keyMessage: last.keyMessage,
        title: last.title,
        logicalSections: last.logicalSections,
        visualPrompt: last.visualPrompt,
        imageUrl: last.imageUrl,
        history,
        future: future.slice(0, 10),
      };
      return next;
    });
  };

  /**
   * ✅ 섹션 1개 앞으로 돌리기(undo)
   * - future 가장 최근 url 꺼내 복원
   */
  const redoOne = (index: number) => {
    setSegments((prev) => {
      const next = [...prev];
      const cur = next[index];

      const future = Array.isArray(cur.future) ? [...cur.future] : [];
      if (!future.length) return prev;

      const history = Array.isArray(cur.history) ? [...cur.history] : [];
      history.unshift(snapshot(cur)); // ✅ 현재 상태를 undo 스택으로

      const nextSnap = future.shift()!; // 가장 최근 redo 스냅샷

      next[index] = {
        ...cur,
        keyMessage: nextSnap.keyMessage,
        title: nextSnap.title,
        logicalSections: nextSnap.logicalSections,
        visualPrompt: nextSnap.visualPrompt,
        imageUrl: nextSnap.imageUrl,
        history: history.slice(0, 10),
        future,
      };
      return next;
    });
  };

  return {
    step,
    setStep,
    isPlanning,
    setIsPlanning,
    downloading,
    progress,
    exportZip,
    modelType,
    setModelType,
    info,
    setInfo,
    cutTab,
    setCutTab,
    generatingCut,
    cutPreviews,
    finalCuts,
    competitorUrl,
    setCompetitorUrl,
    competitorPaste,
    setCompetitorPaste,
    uspLoading,
    segments,
    pageRefs,
    extraImages,
    onAddExtraImages,
    onRemoveExtraImage,
    finalExtraPrompt,
    onChangeFinalExtraPrompt,
    onGenerateCut,
    onPickFinalCut,
    onUploadFinalCut,
    onClearFinalCut,

    onSuggestUSP,
    handlePlan,
    handlePlanAndGenerateAll,
    updateSegment,
    // handleGenerateAll,

    // ✅ 신규 기능 노출
    regenerateOne,
    undoOne,
    redoOne,

    canPlan,
    resetAll,
    cancelPlanning,
  };
}
