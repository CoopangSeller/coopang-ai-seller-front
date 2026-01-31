import React, { useMemo, useState } from "react";
import { ReferenceImageUpload } from "@/features/file/image-upload";
import { ModelType } from "@/shared/types";
import { generateImage } from "@/shared/api/gemini/geminiService";

import { useDraft } from "@/features/draft/model/useDraft";
import { STORAGE_KEYS } from "@/shared/config/storageKeys";

type ThumbnailConfig = {
  productName: string;
  features: string;
  style: UiStyle;
  hasPerson: boolean;
  textPosition: "top" | "middle" | "bottom";
  referenceImages: string[];
};

/**
 * Gemini 썸네일 전용 프롬프트 구조
 * - 추상 스타일 제거
 * - 구도/조명/배경 고정
 * - 텍스트 생성 허용 (썸네일용 짧은 헤드라인)
 */

type UiStyle = "Studio" | "UseCase" | "PremiumDark" | "Infographic" | "FlatLay";

const UI_STYLE_LABEL: Record<UiStyle, string> = {
  Studio: "스튜디오(정석)",
  UseCase: "사용 장면(미니멀)",
  PremiumDark: "프리미엄(다크)",
  Infographic: "광고형(텍스트 강조)",
  FlatLay: "플랫레이(탑뷰)",
};

function normalizeWhitespace(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function featuresToDirectives(featuresRaw: string) {
  const f = normalizeWhitespace(featuresRaw || "");
  if (!f) return "";

  const parts = f
    .split(/[,/|\n]+/g)
    .map((x) => normalizeWhitespace(x))
    .filter(Boolean)
    .slice(0, 6);

  if (parts.length === 0) return "";

  return `Key features to visually emphasize: ${parts.join(", ")}.`;
}

function styleBlock(style: UiStyle) {
  const common = [
    "Commercial ecommerce thumbnail photography.",
    "High sharpness, clean edges, realistic materials.",
    "High contrast, eye-catching but not surreal.",
  ];

  const blocks: Record<UiStyle, string[]> = {
    Studio: [
      "Pure white seamless studio background.",
      "Soft studio lighting with subtle shadow.",
      "Centered hero product composition, 50mm look.",
    ],
    UseCase: [
      "Minimal tidy lifestyle scene.",
      "Natural daylight with soft fill light.",
      "Product is clearly dominant in the frame.",
    ],
    PremiumDark: [
      "Premium dark gradient background.",
      "Rim light and crisp highlights.",
      "Luxury advertising style lighting.",
    ],
    Infographic: [
      "Clean simple background or light gradient.",
      "Composition suitable for advertising text overlay.",
      "High clarity and strong product separation.",
    ],
    FlatLay: [
      "Top-down flat lay composition.",
      "Neatly arranged, minimal props (max one).",
      "Even lighting, clean layout.",
    ],
  };

  return [...common, ...blocks[style]].join(" ");
}

function personBlock(hasPerson: boolean) {
  if (!hasPerson) {
    return [
      "Product-only hero shot.",
      "Single product focus.",
      "No extra hands or unnecessary objects.",
    ].join(" ");
  }

  return [
    "Include one professional adult model.",
    "The model supports the product, product remains the main focus.",
    "Natural pose, clean styling, ecommerce advertising style.",
  ].join(" ");
}

function buildGeminiPrompt(params: {
  productName: string;
  features: string;
  style: UiStyle;
  hasPerson: boolean;
  hasReferenceImages: boolean;
}) {
  const { productName, features, style, hasPerson, hasReferenceImages } =
    params;

  const guardrails = [
    "No duplicated products.",
    "No broken anatomy.",
    "No distorted shapes.",
    "No low-resolution artifacts.",
    "Square 1:1 thumbnail.",
  ].join(" ");

  const referenceHint = hasReferenceImages
    ? "Match the product shape, color, and details accurately based on the reference images."
    : "";

  const featureDirectives = featuresToDirectives(features);

  const base = `Create a professional ecommerce thumbnail image for: ${productName}.`;
  const composition =
    "Main goal: maximize click-through rate and product clarity.";
  const textGuidance =
    "Include short, bold, readable advertising text suitable for a shopping thumbnail.";

  const blocks = [
    base,
    composition,
    textGuidance,
    styleBlock(style),
    personBlock(hasPerson),
    featureDirectives,
    referenceHint,
    guardrails,
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeWhitespace(blocks);
}

type ThumbnailDraft = {
  config: Omit<ThumbnailConfig, "style"> & { style: UiStyle };
  modelType: ModelType;
  resultImage: string | null;
};

const initialDraft: ThumbnailDraft = {
  config: {
    productName: "",
    features: "",
    style: "Studio",
    hasPerson: false,
    textPosition: "bottom",
    referenceImages: [],
  },
  modelType: ModelType.FREE,
  resultImage: null,
};

function sanitizeDraftForStorage(d: ThumbnailDraft): ThumbnailDraft {
  const refs: unknown = (d.config as any)?.referenceImages;
  const safeRefs = Array.isArray(refs)
    ? refs.filter((x) => typeof x === "string")
    : [];

  return {
    ...d,
    config: {
      ...d.config,
      referenceImages: safeRefs as any,
    },
  };
}

const ThumbnailGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // ✅ localStorage draft
  const {
    state: draft,
    setState: setDraft,
    clear,
  } = useDraft<ThumbnailDraft>(STORAGE_KEYS.THUMBNAIL_DRAFT, initialDraft, {
    version: 1,
    ttlMs: 7 * 24 * 60 * 60 * 1000,
    debounceMs: 400,
  });

  const config = draft.config;
  const modelType = draft.modelType;
  const resultImage = draft.resultImage;

  const setConfig: React.Dispatch<
    React.SetStateAction<Omit<ThumbnailConfig, "style"> & { style: UiStyle }>
  > = (updater) => {
    setDraft((prev) => {
      const nextConfig =
        typeof updater === "function" ? (updater as any)(prev.config) : updater;

      return sanitizeDraftForStorage({
        ...prev,
        config: nextConfig,
      });
    });
  };

  const setModelType = (m: ModelType) =>
    setDraft((prev) => ({ ...prev, modelType: m }));

  const setResultImage = (url: string | null) =>
    setDraft((prev) => ({ ...prev, resultImage: url }));

  const resetAll = () => {
    clear();
    setDraft(initialDraft);
  };

  const promptPreview = useMemo(() => {
    return buildGeminiPrompt({
      productName: config.productName,
      features: config.features,
      style: config.style,
      hasPerson: config.hasPerson,
      hasReferenceImages: (config.referenceImages?.length ?? 0) > 0,
    });
  }, [config]);

  const handleGenerate = async () => {
    if (!config.productName) return;

    setLoading(true);
    try {
      const imageUrl = await generateImage(
        promptPreview,
        modelType,
        "1:1",
        config.referenceImages,
      );

      setResultImage(imageUrl);
    } catch (e) {
      alert("썸네일 생성 중 오류가 발생했습니다.");
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 space-y-6 h-fit">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">
            썸네일 제작 설정
          </h2>
          <button
            type="button"
            onClick={resetAll}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-all border border-slate-200 bg-white"
          >
            입력 초기화
          </button>
        </div>

        {/* 상품명 */}
        <div>
          <label className="text-sm font-semibold text-slate-700">상품명</label>
          <input
            className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 갤럭시 버즈 프로 3"
            value={config.productName}
            onChange={(e) =>
              setConfig((p) => ({ ...p, productName: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            강조하고 싶은 특징
          </label>
          <input
            className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 가죽 케이스 장착, 은은한 무드등 효과"
            value={config.features}
            onChange={(e) =>
              setConfig((p) => ({ ...p, features: e.target.value }))
            }
          />
        </div>

        {/* 스타일 */}
        <div>
          <label className="text-sm font-semibold text-slate-700">스타일</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {(Object.keys(UI_STYLE_LABEL) as UiStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => setConfig((p) => ({ ...p, style: s }))}
                className={`py-2 rounded-lg border text-sm font-medium ${
                  config.style === s
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-600"
                }`}
              >
                {UI_STYLE_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* 인물 */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.hasPerson}
            onChange={(e) =>
              setConfig((p) => ({ ...p, hasPerson: e.target.checked }))
            }
          />
          <span className="text-sm">인물 포함</span>
        </label>

        {/* 모델 */}
        <div>
          <label className="text-sm font-semibold text-slate-700">
            모델 등급
          </label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={modelType === ModelType.FREE}
                onChange={() => setModelType(ModelType.FREE)}
              />
              무료
            </label>
            <label className="flex items-center gap-2 font-bold text-blue-700">
              <input
                type="radio"
                checked={modelType === ModelType.PAID}
                onChange={() => setModelType(ModelType.PAID)}
              />
              Pro
            </label>
          </div>
        </div>

        <ReferenceImageUpload
          value={config.referenceImages ?? []}
          onChange={(imgs) =>
            setConfig((prev) => ({ ...prev, referenceImages: imgs }))
          }
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !config.productName}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "생성 중..." : "썸네일 생성하기"}
        </button>
      </div>

      {/* 결과 */}
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative w-full max-w-[500px] aspect-square bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-white flex items-center justify-center">
          {resultImage ? (
            <img
              src={resultImage}
              alt="Generated Thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <p className="text-slate-400">이미지가 여기에 생성됩니다</p>
          )}

          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThumbnailGenerator;
