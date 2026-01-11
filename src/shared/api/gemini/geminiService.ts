
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PageLength, DetailImageSegment, ProductInfo, ModelType } from "../../types/types";

// Helper to get GoogleGenAI instance
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const planDetailPage = async (info: ProductInfo): Promise<DetailImageSegment[]> => {
  const ai = getAI();
  const prompt = `
    당신은 한국의 이커머스(스마트스토어, 쿠팡) 상세페이지 기획 전문가입니다.
    다음 상품 정보를 바탕으로 '팔리는 논리(Winning Logic)'가 적용된 상세페이지 섹션을 기획하세요.

    상품명: ${info.name}
    카테고리: ${info.category}
    가격: ${info.price}
    특징: ${info.features}
    타겟: 성별(${info.targetGender.join(', ')}), 연령(${info.targetAge.join(', ')})
    목표 길이: ${info.pageLength === PageLength.AUTO ? 'AI 추천 (5~9장)' : info.pageLength + '장'}

    [기획 논리 구조 가이드]
    - Hook: 시선을 사로잡는 강력한 문제 제기 또는 혜택
    - Solution: 상품이 어떻게 문제를 해결하는지 제시
    - Clarity/Proof: 실제 사용 데이터, 스펙 비교, 리뷰 증명
    - Detail: 상품의 디테일한 장점 및 디자인
    - Trust/Service: 브랜드 스토리, AS 정책, 배송 안내

    [필수 제약 사항]
    1. KeyMessage는 무조건 자연스러운 '한국어'여야 합니다. 
    2. 영어 헤드라인(Premium, Best, Choice 등)은 지양하고 친근하면서도 설득력 있는 한글 구어체를 사용하세요.
    3. visualPrompt는 이미지 생성 모델이 이해하기 쉽도록 구체적인 묘사를 포함하세요 (예: "A professional studio photo of a minimalist water bottle on a marble table with soft morning light").
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
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
            visualPrompt: { type: Type.STRING }
          },
          required: ["id", "title", "logicalSections", "keyMessage", "visualPrompt"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("JSON Parsing Error", e);
    return [];
  }
};

export const generateImage = async (
  prompt: string,
  modelType: ModelType,
  aspectRatio: "9:16" | "1:1",
  referenceImages?: string[]
): Promise<string | null> => {
  const ai = getAI();
  
  // Handle paid key selection if necessary
  if (modelType === ModelType.PAID) {
    const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio?.openSelectKey();
    }
  }

  const parts: any[] = [{ text: `${prompt}. High-quality ecommerce product photography. Clean background. Professional lighting.` }];
  
  // ✅ 여러 장 첨부
  if (referenceImages?.length) {
    for (const dataUrl of referenceImages) {
      if (!dataUrl) continue;

      // data:image/png;base64,AAAA...
      const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
      if (!match) continue;

      const mimeType = match[1] || "image/png";
      const base64 = match[2];

      parts.push({
        inlineData: {
          data: base64,
          mimeType,
        },
      });
    }
  }


  try {
    const response = await ai.models.generateContent({
      model: modelType,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio,
          ...(modelType === ModelType.PAID ? { imageSize: "1K" } : {})
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found") && modelType === ModelType.PAID) {
       await (window as any).aistudio?.openSelectKey();
    }
    throw error;
  }
};
