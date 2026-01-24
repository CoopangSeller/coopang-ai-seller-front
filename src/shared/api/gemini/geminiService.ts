// src/shared/api/gemini/geminiService.ts

import { GoogleGenAI, Type } from "@google/genai";
import {
  DetailImageSegment,
  ModelType,
  PageLength,
  ProductInfo,
} from "@/shared/types/types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

function safeJoin(arr?: string[]) {
  return (arr ?? []).filter(Boolean).join(", ");
}

function normalizeUSP(features: string) {
  const raw = (features ?? "").trim();
  if (!raw) return "";
  return raw.length > 1200 ? raw.slice(0, 1200) : raw;
}

function pricingBlock(info: ProductInfo) {
  const o = info.pricing?.originalPrice?.trim() ?? "";
  const s = info.pricing?.salePrice?.trim() ?? "";
  if (!o && !s) return "가격 정보: (미입력)";
  return `가격 정보: 정상가(${o || "미입력"}), 할인가(${s || "미입력"})`;
}

function lengthLabel(len: PageLength) {
  if (len === PageLength.AUTO) return "AI 추천 (5~9장)";
  return `${len}장`;
}

function buildPlanPrompt(info: ProductInfo) {
  const usp = normalizeUSP(info.features);

  return `
당신은 한국 이커머스(쿠팡/스마트스토어) 상세페이지 기획 전문가입니다.
아래 상품 정보를 바탕으로, "팔리는 논리(Winning Logic)"가 적용된 세로형 상세페이지 섹션을 기획하세요.

[상품 정보]
- 상품명: ${info.name}
- 카테고리: ${info.category}
- ${pricingBlock(info)}
- 타겟: 성별(${safeJoin(info.targetGender)}), 연령(${safeJoin(info.targetAge)})
- 목표 길이: ${lengthLabel(info.pageLength)}

[USP/핵심 특징(사용자 입력)]
${usp || "(미입력)"}

[기획 논리 구조(권장 흐름)]
1) Hook: 문제/욕구를 한 문장으로 찌르기
2) Benefit: 얻는 결과/이득을 즉시 제시
3) Proof: 스펙/수치/비교/후기 근거
4) Detail: 디테일/재질/사용법/구성
5) Trust: 배송/AS/교환/브랜드 신뢰
6) CTA: 망설임 해소 + 구매 유도

[가격 노출 정책(중요)]
- 가격을 "모든 섹션에 반복 노출"하지 마세요.
- 가격은 최대 1회만 노출하세요.
- 가격이 노출되는 경우는 아래 중 하나일 때만:
  A) "혜택/구성/가성비"를 명확히 설명하는 섹션 1개
  B) "기간 한정/할인" 같은 프로모션 섹션 1개
- 가격 정보가 미입력이라면 가격을 절대 언급하지 마세요.

[출력 규칙]
- 결과는 JSON 배열로만 출력합니다.
- 각 아이템은 다음 필드를 반드시 포함:
  id, title, logicalSections, keyMessage, visualPrompt
- keyMessage는 자연스러운 "한국어"여야 하며, 과장/효능 단정 표현은 금지.
- visualPrompt는 이미지 생성 모델이 이해하기 쉽게 구체적으로 작성:
  (구도/조명/배경/소품/피사체/금지 요소 포함)
- visualPrompt에서 "텍스트 생성"은 지양(이미지 내 글자 생성 금지).
- 세로 상세페이지 9:16 기준의 구도를 우선합니다.
`.trim();
}

export const planDetailPage = async (
info: ProductInfo, p0? : any,
): Promise<DetailImageSegment[]> => {
  const ai = getAI();
  const prompt = buildPlanPrompt(info);

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            logicalSections: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyMessage: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
          },
          required: ["id", "title", "logicalSections", "keyMessage", "visualPrompt"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("JSON Parsing Error", e);
    return [];
  }
};

function buildImageParts(prompt: string, referenceImages?: string[]) {
  const parts: any[] = [
    {
      text: [
        prompt,
        "High-quality ecommerce product photography.",
        "Clean composition, professional lighting, realistic materials.",
        "No duplicated products. No distorted shapes. No broken anatomy.",
        "No readable text or logos generated in the image.",
      ].join(" "),
    },
  ];

  if (referenceImages?.length) {
    for (const dataUrl of referenceImages) {
      if (!dataUrl) continue;
      const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
      if (!match) continue;

      const mimeType = match[1] || "image/png";
      const base64 = match[2];

      parts.push({
        inlineData: { data: base64, mimeType },
      });
    }
  }

  return parts;
}

export const generateImage = async (
  prompt: string,
  modelType: ModelType,
  aspectRatio: "9:16" | "1:1",
  referenceImages?: string[],
): Promise<string | null> => {
  const ai = getAI();

  if (modelType === ModelType.PAID) {
    const hasKey = await (window as any).aistudio?.hasSelectedApiKey?.();
    if (!hasKey) await (window as any).aistudio?.openSelectKey?.();
  }

  const parts = buildImageParts(prompt, referenceImages);

  try {
    const response = await ai.models.generateContent({
      model: modelType,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio,
          ...(modelType === ModelType.PAID ? { imageSize: "1K" } : {}),
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
};
