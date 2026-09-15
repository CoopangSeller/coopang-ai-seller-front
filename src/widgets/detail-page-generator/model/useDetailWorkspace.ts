import { useMemo, useRef, useState } from "react";
import { ModelType } from "@/shared/types";
import { toastStore } from "@/shared/model/toastStore";
import { runWithConcurrency } from "@/shared/lib/async/runWithConcurrency";
import { useZipExport } from "@/features/file/file-export";
import { useDraft } from "@/features/draft/model/useDraft";
import { STORAGE_KEYS } from "@/shared/config/storageKeys";
import {
  AiUsage,
  summarizeAiUsage,
} from "@/shared/api/openai/openaiService";
import {
  cleanupProductImageTracked,
  generateDetailSectionImageTracked,
  planDetailPageTracked,
  researchDetailProductTracked,
} from "../api/detailPlannerGemini";
import {
  DesignStyleId,
  DetailImageSegment,
  PageLength,
  ProductInfo,
  ProductResearch,
  ReviewDecision,
  SegmentTone,
} from "./types";

export type WorkspacePhase = "input" | "research" | "plan" | "result";
export type BusyJob = "research" | "plan" | "generate" | null;

export interface ProductPhoto {
  id: string;
  original: string;
  cleaned?: string;
  selected: "original" | "cleaned";
  cleaning?: boolean;
}

const initialInfo: ProductInfo = {
  name: "",
  category: "",
  productKind: "food",
  sourceUrl: "",
  videoTranscript: "",
  price: "",
  features: "",
  targetGender: ["전체"],
  targetAge: ["전체"],
  pageLength: PageLength.STANDARD,
  referenceImages: [],
  shots: {
    cutout: { key: "cutout", label: "누끼컷", referenceImages: [] },
    lifestyle: { key: "lifestyle", label: "활용컷", referenceImages: [] },
    model: { key: "model", label: "모델컷", referenceImages: [] },
  },
  detailExtraPrompt: "",
};

const readCompactImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxEdge = 1000;
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("이미지를 처리할 수 없습니다."));
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.76));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

const snapshot = (segment: DetailImageSegment) => ({
  keyMessage: segment.keyMessage,
  title: segment.title,
  logicalSections: segment.logicalSections,
  visualPrompt: segment.visualPrompt,
  imageUrl: segment.imageUrl,
  promptOverride: segment.promptOverride,
  edits: segment.edits,
  layout: segment.layout,
  tone: segment.tone,
  createdAt: Date.now(),
});

export function useDetailWorkspace() {
  const [phase, setPhase] = useState<WorkspacePhase>("input");
  const [busy, setBusy] = useState<BusyJob>(null);
  const { state: info, setState: setInfo, clear: clearInfoDraft } = useDraft<ProductInfo>(
    STORAGE_KEYS.DETAIL_PLANNER_DRAFT,
    initialInfo,
    { version: 4 },
  );
  const [photos, setPhotos] = useState<ProductPhoto[]>([]);
  const [research, setResearch] = useState<ProductResearch | null>(null);
  const [segments, setSegments] = useState<DetailImageSegment[]>([]);
  const [styleId, setStyleId] = useState<DesignStyleId>("catalog");
  const [modelType, setModelType] = useState<ModelType>(ModelType.PAID);
  const [selectedSegment, setSelectedSegment] = useState(0);
  const [sampleApproved, setSampleApproved] = useState(false);
  const [usage, setUsage] = useState<AiUsage[]>([]);
  const generationId = useRef(0);
  const regenerationTokens = useRef<Record<string, string>>({});
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const longPageRef = useRef<HTMLDivElement | null>(null);
  const exportState = useZipExport();

  const selectedImages = useMemo(
    () =>
      photos.map((photo) =>
        photo.selected === "cleaned" && photo.cleaned ? photo.cleaned : photo.original,
      ),
    [photos],
  );
  const usageSummary = useMemo(() => summarizeAiUsage(usage), [usage]);
  const sampleReady = Boolean(segments[0]?.imageUrl);
  const generationDone = segments.filter((segment) => segment.imageUrl).length;

  const recordUsage = (item: AiUsage) => setUsage((items) => [...items, item]);

  const canResearch = Boolean(info.name.trim());
  const pointsDecided = Boolean(
    research &&
      research.sellingPoints.length > 0 &&
      research.sellingPoints.every((point) => point.decision !== "pending") &&
      research.sellingPoints.some((point) => point.decision === "approved"),
  );

  const addPhotoFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - photos.length;
    const accepted = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remaining);
    if (!accepted.length) {
      toastStore.push({
        type: "error",
        title: "사진은 최대 5장",
        message: "기존 사진을 지운 뒤 다시 올려줘.",
        durationMs: 3500,
      });
      return;
    }
    try {
      const images = await Promise.all(accepted.map(readCompactImage));
      setPhotos((current) => [
        ...current,
        ...images.map((original) => ({
          id: crypto.randomUUID(),
          original,
          selected: "original" as const,
        })),
      ]);
    } catch {
      toastStore.push({
        type: "error",
        title: "사진 처리 실패",
        message: "JPG, PNG 또는 WebP 파일인지 확인해줘.",
        durationMs: 4000,
      });
    }
  };

  const removePhoto = (id: string) => setPhotos((items) => items.filter((item) => item.id !== id));

  const cleanupPhoto = async (id: string) => {
    const photo = photos.find((item) => item.id === id);
    if (!photo || photo.cleaning) return;
    setPhotos((items) => items.map((item) => (item.id === id ? { ...item, cleaning: true } : item)));
    try {
      const result = await cleanupProductImageTracked(photo.original, modelType);
      recordUsage(result.usage);
      const cleaned = result.value;
      if (!cleaned) throw new Error("빈 이미지");
      setPhotos((items) =>
        items.map((item) =>
          item.id === id ? { ...item, cleaned, selected: "cleaned", cleaning: false } : item,
        ),
      );
    } catch (error: any) {
      setPhotos((items) => items.map((item) => (item.id === id ? { ...item, cleaning: false } : item)));
      toastStore.push({
        type: "error",
        title: "상품 정리 실패",
        message: error?.message || "잠시 후 다시 시도해줘.",
        durationMs: 4500,
      });
    }
  };

  const selectPhotoVersion = (id: string, selected: "original" | "cleaned") =>
    setPhotos((items) =>
      items.map((item) =>
        item.id === id && (selected === "original" || item.cleaned) ? { ...item, selected } : item,
      ),
    );

  const runResearch = async () => {
    if (!canResearch || busy) return;
    setBusy("research");
    try {
      const result = await researchDetailProductTracked(info, "gpt-6-astra", selectedImages);
      recordUsage(result.usage);
      if (!result.value.sellingPoints.length) throw new Error("확인할 소구점을 찾지 못했어.");
      setResearch(result.value);
      setSegments([]);
      setSampleApproved(false);
      setPhase("research");
    } catch (error: any) {
      toastStore.push({
        type: "error",
        title: "상품 조사 실패",
        message: error?.message || "상품명이나 연결 상태를 확인해줘.",
        durationMs: 5500,
      });
    } finally {
      setBusy(null);
    }
  };

  const updateResearch = (patch: Partial<ProductResearch>) =>
    setResearch((current) => (current ? { ...current, ...patch } : current));

  const updateSellingPoint = (
    id: string,
    patch: { decision?: ReviewDecision; title?: string; description?: string },
  ) =>
    setResearch((current) =>
      current
        ? {
            ...current,
            sellingPoints: current.sellingPoints.map((point) =>
              point.id === id ? { ...point, ...patch } : point,
            ),
          }
        : current,
    );

  const runPlan = async () => {
    if (!research || !pointsDecided || busy) return;
    setBusy("plan");
    try {
      const result = await planDetailPageTracked(info, research, "gpt-6-astra", selectedImages);
      recordUsage(result.usage);
      const plan = result.value;
      if (!plan.segments.length) throw new Error("기획 섹션을 만들지 못했어.");
      setSegments(plan.segments);
      setStyleId(plan.recommendedStyle);
      setSampleApproved(false);
      setSelectedSegment(0);
      setPhase("plan");
      if (info.pageLength === PageLength.AUTO) {
        setInfo((current) => ({ ...current, pageLength: plan.recommendedLength as PageLength }));
      }
    } catch (error: any) {
      toastStore.push({
        type: "error",
        title: "판매 기획 실패",
        message: error?.message || "잠시 후 다시 시도해줘.",
        durationMs: 5500,
      });
    } finally {
      setBusy(null);
    }
  };

  const updateSegment = (index: number, patch: Partial<DetailImageSegment>) =>
    setSegments((items) =>
      items.map((segment, currentIndex) =>
        currentIndex === index ? { ...segment, ...patch } : segment,
      ),
    );

  const moveSegment = (index: number, direction: -1 | 1) => {
    setSegments((items) => {
      const destination = index + direction;
      if (destination < 0 || destination >= items.length) return items;
      const next = [...items];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
    setSelectedSegment((current) => Math.max(0, Math.min(segments.length - 1, current + direction)));
  };

  const deleteSegment = (index: number) => {
    if (segments.length <= 1) return;
    setSegments((items) => items.filter((_, currentIndex) => currentIndex !== index));
    setSelectedSegment((current) => Math.max(0, Math.min(current, segments.length - 2)));
  };

  const addSegment = () => {
    const next: DetailImageSegment = {
      id: `detail-${Date.now()}`,
      template: "DETAIL",
      title: "상품의 매력을 더 보여주세요",
      logicalSections: ["보조 문구를 입력하세요"],
      keyMessage: "추가 상품 정보",
      visualPrompt: "Clean product detail scene with generous negative space",
      layout: "top",
      tone: "light",
    };
    setSegments((items) => [...items, next]);
    setSelectedSegment(segments.length);
  };

  const chooseStyle = (nextStyle: DesignStyleId) => {
    if (nextStyle === styleId) return;
    setStyleId(nextStyle);
    setSampleApproved(false);
    setSegments((items) =>
      items.map((item) => ({
        ...item,
        imageUrl: undefined,
        isGenerating: false,
        history: [],
        future: [],
      })),
    );
  };

  const generateSample = async () => {
    if (!research || !segments.length || busy) return;
    const runId = ++generationId.current;
    const sample = segments[0];
    setBusy("generate");
    setPhase("result");
    setSampleApproved(false);
    setSelectedSegment(0);
    setSegments((items) =>
      items.map((item, index) => ({
        ...item,
        imageUrl: undefined,
        isGenerating: index === 0,
        history: [],
        future: [],
      })),
    );
    try {
      const result = await generateDetailSectionImageTracked({
        info,
        research,
        segment: sample,
        styleId,
        modelType,
        referenceImages: selectedImages,
      });
      if (generationId.current !== runId) return;
      recordUsage(result.usage);
      if (!result.value) throw new Error("대표 시안을 만들지 못했어.");
      setSegments((items) =>
        items.map((item) =>
          item.id === sample.id
            ? { ...item, imageUrl: result.value ?? undefined, isGenerating: false }
            : item,
        ),
      );
    } catch (error: any) {
      if (generationId.current !== runId) return;
      setSegments((items) =>
        items.map((item) => (item.id === sample.id ? { ...item, isGenerating: false } : item)),
      );
      toastStore.push({
        type: "error",
        title: "대표 시안 생성 실패",
        message: error?.message || "잠시 후 다시 시도해줘.",
        durationMs: 5000,
      });
    } finally {
      if (generationId.current === runId) setBusy(null);
    }
  };

  const generateRemaining = async () => {
    if (!research || !sampleReady || segments.length <= 1 || busy) return;
    const targets = segments.slice(1).filter((segment) => !segment.imageUrl);
    if (!targets.length) {
      setSampleApproved(true);
      return;
    }
    const runId = ++generationId.current;
    setSampleApproved(true);
    setBusy("generate");
    setSegments((items) =>
      items.map((item) =>
        targets.some((target) => target.id === item.id) ? { ...item, isGenerating: true } : item,
      ),
    );
    const tasks = targets.map((segment) => async () => ({
      id: segment.id,
      result: await generateDetailSectionImageTracked({
        info,
        research,
        segment,
        styleId,
        modelType,
        referenceImages: selectedImages,
      }),
    }));
    let failures = 0;
    await runWithConcurrency(tasks, 2, (_index, result) => {
      if (generationId.current !== runId) return;
      if (result.status === "fulfilled") recordUsage(result.value.result.usage);
      if (result.status === "fulfilled" && result.value.result.value) {
        setSegments((items) =>
          items.map((item) =>
            item.id === result.value.id
              ? { ...item, imageUrl: result.value.result.value ?? undefined, isGenerating: false }
              : item,
          ),
        );
      } else {
        failures += 1;
        const failedId =
          result.status === "fulfilled" ? result.value.id : targets[_index]?.id;
        setSegments((items) =>
          items.map((item) => (item.id === failedId ? { ...item, isGenerating: false } : item)),
        );
      }
    });
    if (generationId.current === runId) {
      setBusy(null);
      if (failures) {
        toastStore.push({
          type: "error",
          title: `${failures}개 섹션 생성 실패`,
          message: "실패한 섹션의 ‘사진 다시 만들기’를 눌러줘.",
          durationMs: 5000,
        });
      }
    }
  };

  const regenerateSegment = async (index: number) => {
    if (!research) return;
    const current = segments[index];
    if (!current || current.isGenerating) return;
    const token = crypto.randomUUID();
    regenerationTokens.current[current.id] = token;
    const varied = { ...current, regenNonce: token };
    setSegments((items) =>
      items.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              isGenerating: true,
              history: [snapshot(item), ...(item.history ?? [])].slice(0, 8),
              future: [],
            }
          : item,
      ),
    );
    try {
      const result = await generateDetailSectionImageTracked({
        info,
        research,
        segment: varied,
        styleId,
        modelType,
        referenceImages: selectedImages,
      });
      const imageUrl = result.value;
      recordUsage(result.usage);
      if (!imageUrl || regenerationTokens.current[current.id] !== token) return;
      setSegments((items) =>
        items.map((item) =>
          item.id === current.id ? { ...item, imageUrl, isGenerating: false } : item,
        ),
      );
    } catch (error: any) {
      if (regenerationTokens.current[current.id] !== token) return;
      setSegments((items) =>
        items.map((item) => (item.id === current.id ? { ...item, isGenerating: false } : item)),
      );
      toastStore.push({
        type: "error",
        title: "사진 재생성 실패",
        message: error?.message || "잠시 후 다시 시도해줘.",
        durationMs: 4500,
      });
    }
  };

  const undoSegment = (index: number) =>
    setSegments((items) =>
      items.map((item, currentIndex) => {
        if (currentIndex !== index || !item.history?.length) return item;
        const [previous, ...history] = item.history;
        return {
          ...item,
          ...previous,
          history,
          future: [snapshot(item), ...(item.future ?? [])].slice(0, 8),
        };
      }),
    );

  const redoSegment = (index: number) =>
    setSegments((items) =>
      items.map((item, currentIndex) => {
        if (currentIndex !== index || !item.future?.length) return item;
        const [futureItem, ...future] = item.future;
        return {
          ...item,
          ...futureItem,
          future,
          history: [snapshot(item), ...(item.history ?? [])].slice(0, 8),
        };
      }),
    );

  const cycleSegmentTone = (index: number) => {
    const order: SegmentTone[] = ["light", "deep", "accent"];
    const current = segments[index]?.tone ?? "light";
    updateSegment(index, { tone: order[(order.indexOf(current) + 1) % order.length] });
  };

  const reset = () => {
    generationId.current += 1;
    setInfo(initialInfo);
    setPhotos([]);
    setResearch(null);
    setSegments([]);
    setStyleId("catalog");
    setSampleApproved(false);
    setUsage([]);
    setPhase("input");
    setBusy(null);
    setSelectedSegment(0);
    clearInfoDraft();
  };

  return {
    phase,
    setPhase,
    busy,
    info,
    setInfo,
    photos,
    addPhotoFiles,
    removePhoto,
    cleanupPhoto,
    selectPhotoVersion,
    research,
    updateResearch,
    updateSellingPoint,
    segments,
    updateSegment,
    moveSegment,
    deleteSegment,
    addSegment,
    styleId,
    setStyleId: chooseStyle,
    modelType,
    setModelType,
    selectedSegment,
    setSelectedSegment,
    selectedImages,
    canResearch,
    pointsDecided,
    sampleReady,
    sampleApproved,
    generationDone,
    usageSummary,
    runResearch,
    runPlan,
    generateSample,
    generateRemaining,
    regenerateSegment,
    undoSegment,
    redoSegment,
    cycleSegmentTone,
    pageRefs,
    longPageRef,
    exportState,
    reset,
  };
}
