// src/widgets/detail-page-generator/model/useDetailPlannerState.ts
import { useMemo, useRef, useState } from "react";
import {
  DetailImageSegment,
  DetailShotKey,
  ModelType,
  PageLength,
  ProductInfo,
} from "@/shared/types/types";
import { planDetailPage, generateDetailSectionImage } from "../api/detailPlannerGemini";
import { heuristicUspFromPaste, tryServerCrawl } from "../lib/usp";
import { buildCutPrompt } from "../lib/prompts";
import { useZipExport } from "@/features/file/file-export";
import { useDraft } from "@/features/draft/model/useDraft";
import { generateImage } from "@/shared/api/gemini/geminiService";

const DRAFT_KEY = "detail-planner:v2";
const SHOT_KEYS: DetailShotKey[] = ["cutout", "lifestyle", "model"];

function normalizeUsp(s: string) {
  return (s ?? "").trim();
}

export function useDetailPlannerState() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

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
        const url = await generateImage(prompt, modelType, "1:1", refs, { allowText: false, imageSize: "2K" });
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
    setLoading(true);
    try {
      const result = await planDetailPage(info);
      setSegments(result);
      setStep(2);
    } catch (e) {
      console.error(e);
      alert("기획안 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const updateSegment = (index: number, field: keyof DetailImageSegment, value: string) => {
    setSegments((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value } as DetailImageSegment;
      return next;
    });
  };

  const handleGenerateAll = async () => {
    setLoading(true);
    setStep(3);

    const updatedSegments = [...segments];

    for (let i = 0; i < updatedSegments.length; i++) {
      try {
        updatedSegments[i] = { ...updatedSegments[i], isGenerating: true };
        setSegments([...updatedSegments]);

        // 참고 이미지: 최종컷 + extraImages(최대 2) + 공통 referenceImages(보정)
        const refList: string[] = [];
        for (const k of SHOT_KEYS) if (finalCuts[k]) refList.push(finalCuts[k]!);
        if (extraImages.length) refList.push(...extraImages.slice(0, 2));
        if (info.referenceImages?.length && refList.length < 3) {
          refList.push(...info.referenceImages.slice(0, 3 - refList.length));
        }

        // ✅ 쿠팡 섹션 이미지 생성(allowText=true, keyMessage는 절대 렌더링하지 않도록 prompt에서 통제)
        const imageUrl = await generateDetailSectionImage(
          info,
          updatedSegments[i],
          modelType,
          refList.length ? refList : info.referenceImages,
        );

        updatedSegments[i] = {
          ...updatedSegments[i],
          imageUrl: imageUrl ?? undefined,
          isGenerating: false,
        };
        setSegments([...updatedSegments]);
      } catch (e) {
        console.error("Generation error for segment", i, e);
        updatedSegments[i] = { ...updatedSegments[i], isGenerating: false };
        setSegments([...updatedSegments]);
      }
    }

    setLoading(false);
  };

  return {
    step,
    setStep,
    loading,
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
    updateSegment,
    handleGenerateAll,

    canPlan,
    resetAll,
  };
}
