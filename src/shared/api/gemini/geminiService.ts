// src/shared/api/gemini/geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { ModelType } from "@/shared/types";
import { toastStore } from "@/shared/model/toastStore";
import { MissingGeminiApiKeyError } from "@/shared/lib/async";

export type ImageAspect = "9:16" | "1:1";

export type GenerateImageOptions = {
  /**
   * true: 이미지 안에 텍스트 포함 가능(프롬프트로 통제)
   * false: 텍스트 금지(강한 네거티브 프롬프트 추가)
   */
  allowText?: boolean;
  imageSize?: string;
  modelOverride?: string; // ✅ 추가
};


const MISSING_KEY_TOAST_ONCE = "aiclub:missing-gemini-key-toast-once";

function promptMissingGeminiKeyOnce() {
  try {
    if (sessionStorage.getItem(MISSING_KEY_TOAST_ONCE) === "1") return;
    sessionStorage.setItem(MISSING_KEY_TOAST_ONCE, "1");
  } catch {}

  toastStore.push({
    type: "error",
    title: "Gemini API 키 필요",
    message:
      "Gemini API 키가 설정되어 있지 않아 생성 기능을 사용할 수 없습니다. " +
      "환경변수 VITE_GEMINI_API_KEY를 설정하거나(권장), 키 선택/연동 화면에서 키를 등록해 주세요.",
    durationMs: 6000,
  });

  (window as any).aistudio?.openSelectKey?.();
}

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  if (!apiKey) {
    promptMissingGeminiKeyOnce();
    throw new MissingGeminiApiKeyError();
  }

  return new GoogleGenAI({ apiKey });
};


function normalizeRefs(referenceImages?: string[]) {
  const out: string[] = [];
  for (const dataUrl of referenceImages ?? []) {
    if (!dataUrl) continue;
    const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!match) continue;
    out.push(dataUrl);
  }
  return out;
}

function buildImageParts(prompt: string, referenceImages?: string[]) {
  const parts: any[] = [
    {
      text: [
        prompt,
        "High-quality ecommerce product photography.",
        "Clean composition, professional lighting, realistic materials.",
        "No duplicated products. No distorted shapes. No broken anatomy.",
      ].join(" "),
    },
  ];

  const refs = normalizeRefs(referenceImages);
  for (const dataUrl of refs) {
    const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!match) continue;
    const mimeType = match[1] || "image/png";
    const base64 = match[2];

    parts.push({
      inlineData: { data: base64, mimeType },
    });
  }

  return parts;
}

/**
 * JSON 응답이 필요한 “텍스트 생성” 공통 함수
 * (쿠팡 상세페이지 기획은 widgets에서 프롬프트를 만들어서 여기로 넘김)
 */
export async function generateJsonWithSchema<T>(
  model: string,
  prompt: string,
  schema: any,
): Promise<T> {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const text = response.text || "null";
  return JSON.parse(text) as T;
}

/**
 * 이미지 생성 공통 함수 (Coupang-specific prompt는 widgets에서 구성)
 */
export async function generateImage(
  prompt: string,
  modelType: ModelType,
  aspectRatio: ImageAspect,
  referenceImages?: string[],
  opts?: GenerateImageOptions,
): Promise<string | null> {
  const ai = getAI();

  if (modelType === ModelType.PAID) {
    const hasKey = await (window as any).aistudio?.hasSelectedApiKey?.();
    if (!hasKey) await (window as any).aistudio?.openSelectKey?.();
  }

  const allowText = opts?.allowText ?? true;
  const imageSize = opts?.imageSize ?? "2K";

  // ✅ 최종 모델명 결정: opts.modelOverride > modelType
  const modelName = opts?.modelOverride || modelType;

  const negativeText = allowText
    ? ""
    : [
        "IMPORTANT: DO NOT render any text, letters, numbers, captions, labels, subtitles, watermarks.",
        "If any text appears, it is a failure.",
      ].join(" ");

  const qualityHint =
    imageSize === "4K"
      ? "ultra-high resolution, 4K, hyper-detailed, professional studio lighting"
      : imageSize === "2K"
      ? "high resolution, 2K, sharp details, commercial photography quality"
      : "standard resolution, clean details";

  const parts = buildImageParts(
    [`(${qualityHint})`, prompt, negativeText].filter(Boolean).join("\n\n"),
    referenceImages,
  );

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio,
          ...(modelType === ModelType.PAID ? { imageSize } : {}),
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    if (
      error.message?.includes?.("Requested entity was not found") &&
      modelType === ModelType.PAID
    ) {
      await (window as any).aistudio?.openSelectKey?.();
    }
    throw error;
  }
}


// schema 작성에 Type을 쓰고 싶으면 widgets에서도 import 가능하게 export
export { Type };
