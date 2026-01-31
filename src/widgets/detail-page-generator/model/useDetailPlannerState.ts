import { useEffect, useMemo, useRef, useState } from "react";
import { ModelType } from "@/shared/types/geminiModel.ts/types";
import { DetailImageSegment, DetailShotKey, PageLength, ProductInfo,} from "../model/types"
import { buildCutPrompt } from "../lib/cutPrompts";
import { useZipExport } from "@/features/file/file-export";
import { useDraft } from "@/features/draft/model/useDraft";
import { generateImage } from "@/shared/api/gemini/geminiService";
import { isModelOverloadedError } from "@/shared/api/gemini/lib/isModelOverloadedError";
import { planWithPolicy, generateAllSections, imageWithPolicy, isTimeoutError } from "./policy";
import { STORAGE_KEYS } from "@/shared/config/storageKeys";

/** draft 저장 키 */
const DRAFT_KEY = STORAGE_KEYS.DETAIL_PLANNER_DRAFT;

/** 최종컷 우선순위 키 */
const SHOT_KEYS: DetailShotKey[] = ["cutout", "lifestyle", "model"];

/** 기획 최대 대기 시간 */
const MAX_PLAN_MS = 48_000;

/** USP 입력 정규화 */
function normalizeUsp(s: string) {
  return (s ?? "").trim();
}

/** undo/redo용 스냅샷 생성(세그먼트 핵심 필드만) */
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
  /** Step 상태 */
  const [step, setStep] = useState<1 | 2 | 3>(1);

  /** 전체 파이프라인 로딩(기획+전체생성) */
  const [isPlanning, setIsPlanning] = useState(false);

  /** 실행 식별자(취소/재실행 시 이전 결과 무효화) */
  const planRunIdRef = useRef(0);

  /** 모델 타입 선택 */
  const [modelType, setModelType] = useState<ModelType>(ModelType.FREE);

  /** 컷 탭 선택 */
  const [cutTab, setCutTab] = useState<DetailShotKey>("cutout");

  /** 컷 생성 중 여부 */
  const [generatingCut, setGeneratingCut] = useState(false);

  /** 컷 미리보기(키별 3장) */
  const [cutPreviews, setCutPreviews] = useState<Record<DetailShotKey, string[]>>({
    cutout: [],
    lifestyle: [],
    model: [],
  });

  /** 최종 선택된 컷(키별 1장) */
  const [finalCuts, setFinalCuts] = useState<Record<DetailShotKey, string | null>>({
    cutout: null,
    lifestyle: null,
    model: null,
  });

  /** Step3: 사용자가 추가 업로드하는 이미지들 */
  const [extraImages, setExtraImages] = useState<string[]>([]);

  /** Step3: 사용자 추가 프롬프트(기획/생성에 반영) */
  const [finalExtraPrompt, setFinalExtraPrompt] = useState("");

  /** (UI에서 사용 중일 수 있어 유지) 경쟁사 URL/붙여넣기, 로딩 */
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorPaste, setCompetitorPaste] = useState("");
  const [uspLoading, setUspLoading] = useState(false);

  /** 초기 ProductInfo */
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

  /** draft 기반 info 상태 */
  const { state: info, setState: setInfo, clear: clearInfoDraft } = useDraft<ProductInfo>(
    DRAFT_KEY,
    initialInfo,
    { version: 2 },
  );

  /** USP 정규화 */
  const normalizedUSP = useMemo(() => normalizeUsp(info.features), [info.features]);

  /** 상세 세그먼트 상태 */
  const [segments, setSegments] = useState<DetailImageSegment[]>([]);

  /**
   * 최신 segments 접근용 ref
   * - regenerateOne에서 “setState로 읽기” 같은 위험한 패턴 제거용
   */
  const segmentsRef = useRef<DetailImageSegment[]>([]);
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  /** 캡처 대상 ref 목록(Export용) */
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  /** ZIP Export 상태 */
  const { downloading, progress, exportZip } = useZipExport();

  /**
   * 기획 가능 조건
   * - name/category 입력
   * - 최종컷 최소 1개 필요
   */
  const canPlan = useMemo(() => {
    const hasBasics = (info.name ?? "").trim() && (info.category ?? "").trim();
    const hasAnyFinal = !!finalCuts.cutout || !!finalCuts.lifestyle || !!finalCuts.model;
    return Boolean(hasBasics && hasAnyFinal);
  }, [info.name, info.category, finalCuts]);

  /** 최종 컷 선택(미리보기에서 택1) */
  const onPickFinalCut = (key: DetailShotKey, imageDataUrl: string) => {
    setFinalCuts((p) => ({ ...p, [key]: imageDataUrl }));
  };

  /** 최종 컷 직접 업로드 */
  const onUploadFinalCut = (key: DetailShotKey, dataUrl: string) => {
    setFinalCuts((p) => ({ ...p, [key]: dataUrl }));
  };

  /** 최종 컷 제거 */
  const onClearFinalCut = (key: DetailShotKey) => {
    setFinalCuts((p) => ({ ...p, [key]: null }));
  };

  /** Step3 추가 이미지 추가(최대 24장) */
  const onAddExtraImages = (dataUrls: string[]) => {
    setExtraImages((prev) => [...prev, ...dataUrls].slice(0, 24));
  };

  /** Step3 추가 이미지 제거 */
  const onRemoveExtraImage = (index: number) => {
    setExtraImages((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Step3 추가 프롬프트 변경
   * - info에도 반영하여 기획/생성 prompt에 포함되게 함
   */
  const onChangeFinalExtraPrompt = (v: string) => {
    setFinalExtraPrompt(v);
    setInfo((p) => ({ ...p, detailExtraPrompt: v }));
  };

  /**
   * 컷 이미지 3장 생성(누끼컷/활용컷/모델컷)
   * - 현재는 단순 3회 호출
   */
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

  /**
   * 공용 레퍼런스 구성(전체 생성/단일 재생성 동일 규칙)
   * - 최종컷 우선(최대 3장)
   * - extra 최대 2장
   * - 부족하면 info.referenceImages로 채움
   */
  const buildRefList = () => {
    const refList: string[] = [];

    for (const k of SHOT_KEYS) if (finalCuts[k]) refList.push(finalCuts[k]!);

    if (extraImages.length) refList.push(...extraImages.slice(0, 2));

    if (info.referenceImages?.length && refList.length < 3) {
      refList.push(...info.referenceImages.slice(0, 3 - refList.length));
    }

    return refList;
  };

  /**
   * 진행 중인 전체 생성 취소
   * - runId를 증가시켜 “이전 요청 결과”를 모두 무효화
   */
  const cancelPlanning = () => {
    planRunIdRef.current++;
    setIsPlanning(false);
    setStep(1);
  };

  /** 전체 초기화(드래프트/컷/세그먼트/스텝) */
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

  /**
   * Step2(기획안 리뷰) 없이:
   * - 기획 생성 → 곧바로 전체 이미지 생성 → Step3 진입
   * - runId로 “취소/재실행” 시 이전 결과 무효화
   */
  const handlePlanAndGenerateAll = async () => {
    if (isPlanning) return;

    const runId = ++planRunIdRef.current;

    setIsPlanning(true);
    setStep(3);

    try {
      const planned = await planWithPolicy({ info, maxPlanMs: MAX_PLAN_MS });

      if (runId !== planRunIdRef.current) return;

      // placeholder 먼저 깔아두고 생성 시작
      setSegments(planned.map((s) => ({ ...s, isGenerating: true })));

      // 이미지 생성시에는 로딩 사라짐
      setIsPlanning(false);

      await generateAllSections({
        segmentsToUse: planned,
        runId,
        planRunIdRef,
        setSegments,
        info,
        modelType,
        buildRefList,
        concurrency: 4,
      });

      if (runId !== planRunIdRef.current) return;
    } catch (e: unknown) {
      if (runId !== planRunIdRef.current) return;

      if (isModelOverloadedError(e)) {
        alert(
          "현재 AI 서버가 혼잡하여 기획을 생성하지 못했습니다.\n\n" +
            "입력 문제는 아니며, 잠시 후 다시 시도해주세요.",
        );
      } else if (isTimeoutError(e)) {
        alert(
          "기획 생성이 너무 오래 걸리고 있습니다.\n\n" +
            "AI 서버 혼잡으로 인한 현상이며,\n" +
            "잠시 후 다시 시도해주세요.",
        );
      } else {
        alert("상세페이지 생성 중 오류가 발생했습니다.");
      }

      setStep(1);
    } finally {
      // 새 실행이 이미 시작된 경우 로딩을 끄지 않도록 가드
      if (runId === planRunIdRef.current) setIsPlanning(false);
    }
  };

  /** 세그먼트 필드 직접 수정(텍스트 수정 등) */
  const updateSegment = (index: number, field: keyof DetailImageSegment, value: string) => {
    setSegments((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value } as DetailImageSegment;
      return next;
    });
  };

  /**
   * 섹션 1개 재생성
   * - promptOverride가 있으면 visualPrompt 뒤에만 덧붙여 보완
   * - 성공 시 history에 이전 상태 저장(undo)
   * - imageWithPolicy를 재사용(모델/타임아웃/폴백 일관성)
   */
  const regenerateOne = async (index: number) => {
    setSegments((prev) => {
      const next = [...prev];
      const cur = next[index];

      const history = Array.isArray(cur.history) ? [...cur.history] : [];
      history.unshift(snapshot(cur));

      next[index] = {
        ...cur,
        isGenerating: true,
        history: history.slice(0, 10),
        future: [],
      };
      return next;
    });

    try {
      const refList = buildRefList();
      const refs = refList.length ? refList : info.referenceImages;

      const seg = segmentsRef.current[index];
      if (!seg) throw new Error("Invalid segment index");

      const override = (seg.promptOverride || "").trim();
      const mergedSeg: DetailImageSegment = override
        ? { ...seg, visualPrompt: `${seg.visualPrompt}\n\n[보완 요청]\n${override}` }
        : seg;

      const imageUrl = await imageWithPolicy({
        info,
        seg: mergedSeg,
        modelType,
        referenceImages: refs,
      });

      setSegments((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          imageUrl: (imageUrl ?? next[index].imageUrl) || next[index].imageUrl,
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

  /** 섹션 1개 되돌리기(undo): history에서 복원 */
  const undoOne = (index: number) => {
    setSegments((prev) => {
      const next = [...prev];
      const cur = next[index];

      const history = Array.isArray(cur.history) ? [...cur.history] : [];
      if (!history.length) return prev;

      const future = Array.isArray(cur.future) ? [...cur.future] : [];
      future.unshift(snapshot(cur));

      const last = history.shift()!;
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

  /** 섹션 1개 앞으로 돌리기(redo): future에서 복원 */
  const redoOne = (index: number) => {
    setSegments((prev) => {
      const next = [...prev];
      const cur = next[index];

      const future = Array.isArray(cur.future) ? [...cur.future] : [];
      if (!future.length) return prev;

      const history = Array.isArray(cur.history) ? [...cur.history] : [];
      history.unshift(snapshot(cur));

      const nextSnap = future.shift()!;
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

    handlePlanAndGenerateAll,
    updateSegment,

    regenerateOne,
    undoOne,
    redoOne,

    canPlan,
    resetAll,
    cancelPlanning,
  };
}
