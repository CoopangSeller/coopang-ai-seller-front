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

function clampLine(s: string, max: number) {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

// 메타 텍스트(라벨) 출력 방지용
function metaBanText() {
  return [
    "절대 금지(메타 라벨): 'Key Message', 'KEY MESSAGE', '키메시지', '키 메시지', '핵심메시지', '핵심 메시지' 라는 글자를 이미지에 출력하지 마세요.",
    "필드명/라벨(UI 문구)도 출력하지 마세요. 자연스러운 마케팅 카피만 허용.",
  ].join(" ");
}

function layoutRulesText() {
  return [
    "레이아웃 규칙:",
    "- 모든 텍스트는 서로 겹치면 안 됩니다(텍스트 겹침 금지).",
    "- 텍스트가 제품/모델/핵심 영역을 가리지 않도록 안전 여백을 확보하세요.",
    "- 이미지 70~80% / 텍스트 20~30% 비율로, 이미지 중심(상업용)으로 구성하세요.",
    "- 문구는 짧고 굵게, 1~2초 내에 이해되게.",
  ].join(" ");
}

function themeRulesText() {
  return [
    "테마 통일:",
    "- 전체 컷은 동일한 톤/테마 컬러로 통일하세요(2~3개 색상: 메인/서브/강조).",
    "- 배지/아이콘/구분선/칩 등은 테마 컬러에 맞춰 일관성 유지.",
    "- 가독성을 위해 기본 텍스트는 진한 색(차콜/블랙) + 밝은 배경을 우선.",
    "- 밝은 글자(흰색)는 사진 위에 떠다니지 않게, 반드시 진한 단색 바/칩 위에만 사용.",
  ].join(" ");
}

function typographyRulesText() {
  return [
    "타이포 규칙:",
    "- 출력 텍스트는 한국어(한글)만 사용.",
    "- 깨진 글자/랜덤 영문/워터마크/의미불명 글자 금지.",
    "- 깔끔한 산세리프 한글 폰트 느낌, 선명하고 또렷하게.",
  ].join(" ");
}

function templateLayoutPrompt(seg: DetailImageSegment) {
  switch (seg.template) {
    case "HERO":
      return `
Hero layout:
- Large product hero centered
- One bold headline only
- Minimal text, premium lighting
- First-screen stopping power
`;

    case "PROBLEM":
      return `
Problem layout:
- Situation-based image
- One short problem statement
- Slight tension, realistic context
`;

    case "CORE_BENEFIT":
      return `
Core benefit layout:
- Product + benefit visual metaphor
- Headline + 1~2 benefit chips
`;

    case "PROOF_COMPARE":
      return `
Comparison layout:
- Left: 기존 제품 (X)
- Right: 이 제품 (✓)
- Simple 2-column grid
`;

    case "DETAIL":
      return `
Detail layout:
- Close-up shots (material, texture)
- Small callouts allowed
`;

    case "HOW_TO":
      return `
How-to layout:
- Step-by-step visual (1-2-3)
- Icons + short captions
`;

    case "TRUST":
      return `
Trust layout:
- Delivery / AS / Exchange icons
- Clean reassurance tone
`;

    case "CTA":
      return `
CTA layout:
- Package 구성 강조
- 구매 망설임 제거 문구
`;
  }
}

function buildPlanPrompt(info: ProductInfo) {
  const usp = normalizeUSP(info.features);

  return `
당신은 한국 이커머스(쿠팡) 전용 상세페이지를 기획하는
15년차 쿠팡 MD이자 전환율 중심 콘텐츠 설계 전문가입니다.

아래 상품 정보를 바탕으로,
쿠팡 모바일 환경에서 실제로 잘 팔리는
세로형(9:16) 상세페이지 섹션 기획안을 작성하세요.

[상품 정보]
- 상품명: ${info.name}
- 카테고리: ${info.category}
- ${pricingBlock(info)}
- 타겟 고객: 성별(${safeJoin(info.targetGender)}), 연령(${safeJoin(info.targetAge)})
- 목표 상세페이지 길이: ${lengthLabel(info.pageLength)}

[USP / 핵심 특징 (사용자 입력)]
${usp || "(미입력)"}

[쿠팡 MD 기획 논리 (반드시 반영)]
1) 첫 화면에서 스크롤을 멈추게 하는 명확한 맥락 제시
2) “그래서 이 제품이 필요한 이유”를 즉시 이해 가능하게 구성
3) 비교/수치/구조를 활용한 납득 가능한 근거 제시
4) 실사용 기준의 디테일과 사용 장면 설명
5) 배송/교환/신뢰 요소로 구매 불안 제거
6) 마지막에 구매를 망설일 이유를 제거하는 마무리

[섹션 구성 규칙 — 쿠팡 전용]
- 반드시 아래 순서를 지켜 섹션을 생성하세요 (각 1회):
  HERO → PROBLEM → CORE_BENEFIT → PROOF_COMPARE → DETAIL → HOW_TO → TRUST → CTA
- 각 섹션은 “쿠팡 모바일 스크롤 흐름” 기준으로
  한 장씩 명확한 역할을 가져야 합니다.
- 섹션 성격에 맞지 않는 정보 혼합 금지.

[섹션별 텍스트 밀도 규칙 — 쿠팡 기준]
- HERO:
  - 헤드라인 1줄만 허용
  - 보조 설명 없음 또는 1줄
- PROBLEM:
  - 질문 또는 문제 제기 1줄
- CORE_BENEFIT:
  - 헤드라인 1줄 + 보조 포인트 최대 2개
- PROOF_COMPARE:
  - 비교용 짧은 문구만 사용
- DETAIL / HOW_TO:
  - 설명 카드 형식, 각 문구는 매우 짧게
- TRUST:
  - 안심/신뢰 메시지 위주, 과장 금지
- CTA:
  - 행동 유도 문구 1개, 감성 과잉 금지


[가격 노출 정책 — 쿠팡 기준]
- 가격은 상세페이지 전체에서 최대 1회만 언급
- 반복 가격 노출, 모든 섹션 가격 언급 금지
- 가격 노출은 아래 중 하나일 때만 허용:
  A) 구성/혜택/가성비를 설명하는 섹션
  B) 한정 할인/프로모션 성격의 섹션
- 가격 정보가 없으면 가격 언급을 절대 하지 마세요.

[출력 규칙 — 매우 중요]
- 결과는 JSON 배열로만 출력합니다.
- 각 섹션은 반드시 아래 필드를 포함해야 합니다:
  id, template, title, logicalSections, keyMessage, visualPrompt

[필드별 작성 규칙]
- title:
  - 이미지에 실제로 노출될 수 있는 “헤드라인 후보”
  - 1줄, 짧고 직관적인 한국어 문장

- logicalSections:
  - 보조 설명 문구 후보
  - 최대 3~4개, 각 문장은 짧게

- keyMessage는 내부 기획용 "섹션 의도 태그"입니다.
- keyMessage는 이미지에 출력될 문구가 아닙니다.
- keyMessage는 이미지 생성 프롬프트에 직접 사용되지 않습니다.
- 시각적 강조, 텍스트 표현은 visualPrompt에만 반영하세요.
- keyMessage:
  - ⚠️ 내부 기획용 “섹션 연출 방향 키워드”
  - 이미지에 출력될 문구가 아닙니다
  - 디자이너/이미지 모델이 연출을 이해하기 위한 주제 설명입니다
  - 예: “첫인상에서 신뢰를 주는 구조”, “비교를 통해 차이를 인식시키는 장면”
  - 자연스러운 한국어로 작성하되,
    광고 문구처럼 쓰지 말고 ‘연출 의도 설명’에 가깝게 작성하세요
  - 내부 기획 및 연출 의도 설명용 메타 정보입니다.
  - 이미지에 글자, 문장, 키워드 형태로 출력되면 실패입니다.
  - 절대로 시각적 텍스트로 변환하지 마세요.

- visualPrompt:
  - 이미지 생성 모델이 이해할 수 있도록
    구도 / 배경 / 피사체 / 조명 / 분위기 / 금지 요소를 구체적으로 설명
  - 텍스트 문구를 직접 지정하지 마세요
  - 쿠팡 모바일 상세 이미지(상업용) 기준의 현실적인 연출을 우선합니다

- 모든 섹션은 세로형 9:16 비율을 기준으로 기획하세요.
`.trim();
}

export const planDetailPage = async (info: ProductInfo): Promise<DetailImageSegment[]> => {
  const ai = getAI();
  const prompt = buildPlanPrompt(info);

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    // 현재 프로젝트 스타일 유지: contents에 문자열 prompt 직접 전달
    contents: prompt,
    config: {
      responseMimeType: "application/json",
responseSchema: {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      template: {
        type: Type.STRING,
        enum: [
          "HERO",
          "PROBLEM",
          "CORE_BENEFIT",
          "PROOF_COMPARE",
          "DETAIL",
          "HOW_TO",
          "TRUST",
          "CTA",
        ],
      },
      title: { type: Type.STRING },
      keyMessage: { type: Type.STRING },
      logicalSections: { type: Type.ARRAY, items: { type: Type.STRING } },
      visualPrompt: { type: Type.STRING },
    },
    required: ["id", "template", "title", "keyMessage", "logicalSections", "visualPrompt"],
        },
      },
    },
  });
const TEMPLATE_ORDER = [
  "HERO",
  "PROBLEM",
  "CORE_BENEFIT",
  "PROOF_COMPARE",
  "DETAIL",
  "HOW_TO",
  "TRUST",
  "CTA",
] as const;

type SegmentTemplate = (typeof TEMPLATE_ORDER)[number];

function isTemplate(x: any): x is SegmentTemplate {
  return TEMPLATE_ORDER.includes(x);
}

function normalizeTemplate(x: any, fallbackIndex: number): SegmentTemplate {
  if (isTemplate(x)) return x;
  // 누락/이상값이면 시퀀스 기반으로 강제
  return TEMPLATE_ORDER[Math.min(Math.max(fallbackIndex, 0), TEMPLATE_ORDER.length - 1)];
}

function clampLines(arr: any, maxItems: number, maxChars: number) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((v) => clampLine(String(v ?? ""), maxChars))
    .filter(Boolean)
    .slice(0, maxItems);
}

// (선택) AI가 순서를 섞어도 MD 시퀀스로 정렬 + 누락 채움
function enforceTemplateSequence(items: DetailImageSegment[]) {
  const byTemplate = new Map<SegmentTemplate, DetailImageSegment>();

  for (let i = 0; i < items.length; i++) {
    const t = normalizeTemplate((items[i] as any).template, i);
    if (!byTemplate.has(t)) byTemplate.set(t, { ...items[i], template: t } as any);
  }

  const out: DetailImageSegment[] = [];
  for (let i = 0; i < TEMPLATE_ORDER.length; i++) {
    const t = TEMPLATE_ORDER[i];
    const seg = byTemplate.get(t);
    if (seg) out.push(seg);
  }

  // 누락 템플릿이 있다면 “더미 섹션”으로라도 채워서 UI/생성 루프 안정화
  for (let i = 0; i < TEMPLATE_ORDER.length; i++) {
    const t = TEMPLATE_ORDER[i];
    if (!out.find((x: any) => x.template === t)) {
      out.push({
        id: `s${i + 1}`,
        template: t as any,
        title: "",
        keyMessage: "",
        logicalSections: [],
        visualPrompt: "",
      } as any);
    }
  }

  return out;
}

try {
  const raw = JSON.parse(response.text || "[]") as any[];

  const normalized: DetailImageSegment[] = (raw || []).map((s, idx) => {
    const template = normalizeTemplate(s?.template, idx);

    return {
      id: String(s?.id || `s${idx + 1}`),
      template, // ✅ 핵심
      title: clampLine(String(s?.title || ""), 32),
      keyMessage: clampLine(String(s?.keyMessage || ""), 22),
      logicalSections: clampLines(s?.logicalSections, 4, 44),
      visualPrompt: String(s?.visualPrompt || "").trim(),
    } as any;
  });

  // ✅ MD 시퀀스 고정(정렬 + 누락 채움)
  return enforceTemplateSequence(normalized);
} catch (e) {
  console.error("JSON Parsing Error", e);
  return [];
}

};

// === image generation ===

function dataUrlToInlineData(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1] || "image/png";
  const base64 = match[2];
  return { inlineData: { data: base64, mimeType } };
}

function buildImagePartsBase(prompt: string, referenceImages?: string[]) {
  const parts: any[] = [
    {
      text: [
        prompt,
        "High-quality ecommerce product photography.",
        "Clean composition, professional lighting, realistic materials.",
        "No duplicated products. No distorted shapes. No broken anatomy.",
        "No brand logos. No watermark.",
      ].join(" "),
    },
  ];

  if (referenceImages?.length) {
    for (const dataUrl of referenceImages) {
      if (!dataUrl) continue;
      const inline = dataUrlToInlineData(dataUrl);
      if (!inline) continue;
      parts.push(inline);
    }
  }

  return parts;
}

type GenerateImageOptions = {
  allowText?: boolean; // Step2: false, Step3: true
  imageSize?: "1K" | "2K" | "4K";
  segmentData?: DetailImageSegment; // Step3에서만 사용
};

function buildStep3TextGuidance(seg: DetailImageSegment) {
  const headline = clampLine(seg.title || "", 30);
  const sub = (seg.logicalSections || []).filter(Boolean).slice(0, 2).map((x) => clampLine(x, 40));
  const theme = clampLine(seg.keyMessage || "", 22);

  return [
    "이 이미지는 쿠팡 모바일용 '상업용 상세 컷'입니다. 텍스트 렌더링을 허용합니다.",
    metaBanText(),
    layoutRulesText(),
    themeRulesText(),
    typographyRulesText(),
    "",
    headline ? `헤드라인(굵게, 한 줄): "${headline}"` : "",
    sub.length ? `서브(1~2줄): "${sub.join(" / ")}"` : "",
    "",
    theme
      ? [
          "테마(내부 주제, 절대 그대로 출력 금지):",
          `- "${theme}" 문구를 이미지에 그대로 출력하지 말고, 의미만 반영해 연출/구도/소품/상황으로 표현하세요.`,
        ].join(" ")
      : "",
    "",
    "주의: 'Key Message' 같은 라벨이나 '키메시지'라는 글자를 이미지에 출력하면 실패입니다.",
  ]
    .filter(Boolean)
    .join(" ");
}

export const generateImage = async (
  prompt: string,
  modelType: ModelType,
  aspectRatio: "9:16" | "1:1",
  referenceImages?: string[],
  opts?: GenerateImageOptions,
): Promise<string | null> => {
  const ai = getAI();

  if (modelType === ModelType.PAID) {
    const hasKey = await (window as any).aistudio?.hasSelectedApiKey?.();
    if (!hasKey) await (window as any).aistudio?.openSelectKey?.();
  }

  const allowText = opts?.allowText ?? false;
  const imageSize = opts?.imageSize ?? "2K";
  const seg = opts?.segmentData;

  const parts = buildImagePartsBase(prompt, referenceImages);

  // Step3일 때만 텍스트 지시를 추가로 붙인다(라벨 출력 유도 방지 위해 자연어로만)
  if (allowText && seg) {
    parts.push({ text: buildStep3TextGuidance(seg) });
  } else if (!allowText) {
    parts.push({
      text: [
        "IMPORTANT: Do not generate any readable text, letters, numbers, captions, labels, or logos in the image.",
      ].join(" "),
    });
  }

  parts.push({
  text: templateLayoutPrompt(seg),
});

  try {
    const response = await ai.models.generateContent({
      model: modelType,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio,
          // 기존 동작 유지: PAID는 기본 1K (필요 시 opts로 2K/4K)
          ...(modelType === ModelType.PAID ? { imageSize } : {}),
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if ((part as any).inlineData?.data) {
        return `data:image/png;base64,${(part as any).inlineData.data}`;
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
