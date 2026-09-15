import { ModelType } from "@/shared/types";
import {
  generateImageTracked,
  generateImage,
  generateJsonWithSchemaTracked,
  TrackedResult,
  Type,
} from "@/shared/api/openai/openaiService";
import {
  DesignStyle,
  DesignStyleId,
  DetailImageSegment,
  DetailPlan,
  PageLength,
  ProductInfo,
  ProductResearch,
  ResearchSource,
  SegmentLayout,
  SegmentTemplate,
  SegmentTone,
  SellingPoint,
} from "../model/types";

export const DESIGN_STYLES: DesignStyle[] = [
  {
    id: "catalog",
    name: "프리미엄 카탈로그",
    description: "백화점 선물 카탈로그처럼 정돈되고 선명한 구성",
    background: "#F7F3EA",
    surface: "#FFFDF8",
    text: "#201C18",
    accent: "#8A2E26",
    muted: "#786F65",
  },
  {
    id: "heritage",
    name: "모던 헤리티지",
    description: "명절의 결을 절제된 색과 여백으로 표현",
    background: "#EEE8DD",
    surface: "#F8F4EC",
    text: "#17251F",
    accent: "#365B46",
    muted: "#6B756E",
  },
  {
    id: "natural",
    name: "클린 내추럴",
    description: "식감과 소재가 돋보이는 밝고 담백한 구성",
    background: "#F2F1EB",
    surface: "#FFFFFF",
    text: "#20231D",
    accent: "#66733E",
    muted: "#74786A",
  },
];

const cleanLine = (value: unknown, max = 80) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max).trimEnd() : text;
};

const asLines = (value: unknown, max = 3) =>
  (Array.isArray(value) ? value : [])
    .map((item) => cleanLine(item, 52))
    .filter(Boolean)
    .slice(0, max);

const productKindLabel = (info: ProductInfo) =>
  info.productKind === "living" ? "생활용품" : info.productKind === "other" ? "기타" : "식품";

const chosenLength = (length: PageLength) =>
  length === PageLength.AUTO ? "AI가 정보량에 따라 5·7·9개 중 선택" : `정확히 ${length}개`;

const researchSchema = {
  type: Type.OBJECT,
  properties: {
    categoryLabel: { type: Type.STRING },
    summary: { type: Type.STRING },
    seasonalCue: { type: Type.STRING },
    recommendedRecipient: { type: Type.STRING },
    customerQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    photoRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
    sellingPoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          evidenceLevel: { type: Type.STRING },
          sourceUrls: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
  },
};

function researchPrompt(info: ProductInfo) {
  const videoTranscript = (info.videoTranscript ?? "").trim().slice(0, 24000);
  return `
당신은 한국 이커머스 식품·생활용품 상품 조사 담당자입니다.
웹 검색으로 아래 상품을 조사하고, 판매자가 승인할 수 있는 소구점 후보를 만드세요.

[상품]
- 상품명: ${info.name}
- 분류: ${productKindLabel(info)} / ${info.category || "세부 카테고리 미입력"}
- 판매자가 아는 내용: ${info.features.trim() || "없음"}
- 공급사/참고 URL: ${info.sourceUrl?.trim() || "없음"}

[공급사 영상 자막]
${videoTranscript || "없음"}

[검색 기준]
- 공식 기관, 생산자·제조사, 공신력 있는 자료를 사실 확인의 우선 근거로 사용하세요.
- 오픈마켓, 블로그, 영상, 후기는 고객이 쓰는 표현·궁금증·구매 장애 요인을 파악하는 데만 사용하세요.
- 유튜브도 검색해 실제 사용·섭취 맥락과 자주 묻는 질문을 파악하세요.
- 영상 자막이 있으면 상품 특징, 고객이 이해하기 쉬운 표현, 생산·사용·섭취 장면을 추출해 소구점 후보에 반영하세요.
- 영상 자막은 공급사 제공 마케팅 자료입니다. 자막만으로 수치·인증·효능을 확정하지 말고, 웹 근거로 교차 확인되지 않으면 seller_check로 표시하세요.
- 첨부 사진이 있다면 상품 정체성과 사진 역할을 분석하되, 보이지 않는 사양은 추측하지 마세요.

[안전 기준]
- 당도, 등급, 원산지, 중량, 인증, 유기농, 수확일, 판매 순위, 의학·건강 효과는 근거가 없으면 절대 확정하지 마세요.
- '아삭한 식감', '풍부한 과즙' 같은 보편적 감각 표현은 general로 표시할 수 있습니다.
- 판매자 입력으로 확인된 내용은 confirmed, 보편적 특성은 general, 추가 증빙이 필요한 내용은 seller_check로 표시하세요.
- 가상 브랜드, 가상 패키지, 그릿마켓 로고, 가격·할인·쿠폰 문구를 만들지 마세요.

[출력]
- 소구점 5~8개. 서로 중복하지 마세요.
- sourceUrls에는 실제 검색 결과 URL만 넣으세요. 없으면 빈 배열입니다.
- seasonalCue는 상품명/입력에 추석·설·새해가 있으면 해당 명절, 없으면 '이번 명절'입니다.
- recommendedRecipient는 가장 설득력 있는 선물 대상을 짧게 제안하세요.
- photoRoles는 첨부 사진 각각의 역할 또는 필요한 사진을 짧게 제안하세요.
`.trim();
}

const matchSourceIds = (urls: unknown, sources: ResearchSource[]) => {
  const items = Array.isArray(urls) ? urls.map(String) : [];
  return sources
    .filter((source) =>
      items.some((url) => {
        if (url === source.url) return true;
        try {
          return new URL(url).hostname === new URL(source.url).hostname;
        } catch {
          return false;
        }
      }),
    )
    .map((source) => source.id);
};

export async function researchDetailProductTracked(
  info: ProductInfo,
  model: string,
  referenceImages: string[],
): Promise<TrackedResult<ProductResearch>> {
  const tracked = await generateJsonWithSchemaTracked<{
    research: any;
    sources: ResearchSource[];
  }>(model, researchPrompt(info), researchSchema, {
    useWebSearch: true,
    referenceImages: referenceImages.slice(0, 5),
  });
  const response = tracked.value;
  const raw = response?.research ?? {};
  const sources = Array.isArray(response?.sources) ? response.sources : [];
  const points: SellingPoint[] = (Array.isArray(raw.sellingPoints) ? raw.sellingPoints : [])
    .slice(0, 8)
    .map((point: any, index: number) => ({
      id: cleanLine(point.id, 30) || `point-${index + 1}`,
      title: cleanLine(point.title, 28),
      description: cleanLine(point.description, 110),
      evidenceLevel: ["confirmed", "general", "seller_check"].includes(point.evidenceLevel)
        ? point.evidenceLevel
        : "seller_check",
      decision: "pending",
      sourceIds: matchSourceIds(point.sourceUrls, sources),
    }))
    .filter((point: SellingPoint) => point.title);

  return {
    value: {
      categoryLabel: cleanLine(raw.categoryLabel, 40) || info.category,
      summary: cleanLine(raw.summary, 180),
      seasonalCue: cleanLine(raw.seasonalCue, 20) || "이번 명절",
      recommendedRecipient: cleanLine(raw.recommendedRecipient, 36) || "고마운 분",
      customerQuestions: asLines(raw.customerQuestions, 5),
      photoRoles: asLines(raw.photoRoles, 5),
      sellingPoints: points,
      sources,
    },
    usage: tracked.usage,
  };
}

export async function researchDetailProduct(
  info: ProductInfo,
  model: string,
  referenceImages: string[],
): Promise<ProductResearch> {
  return (await researchDetailProductTracked(info, model, referenceImages)).value;
}

const planSchema = {
  type: Type.OBJECT,
  properties: {
    recommendedLength: { type: Type.STRING },
    recommendedStyle: { type: Type.STRING },
    strategyNote: { type: Type.STRING },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          template: { type: Type.STRING },
          title: { type: Type.STRING },
          logicalSections: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyMessage: { type: Type.STRING },
          visualPrompt: { type: Type.STRING },
          layout: { type: Type.STRING },
          tone: { type: Type.STRING },
        },
      },
    },
  },
};

function planPrompt(info: ProductInfo, research: ProductResearch) {
  const approved = research.sellingPoints
    .filter((point) => point.decision === "approved")
    .map((point) => `- ${point.title}: ${point.description} [${point.evidenceLevel}]`)
    .join("\n");

  return `
당신은 구매전환을 설계하는 한국 이커머스 크리에이티브 디렉터입니다.
아래에서 판매자가 승인한 소구점만 사용해 모바일 상세페이지 기획안을 만드세요.

[상품]
- 상품명: ${info.name}
- 분류: ${productKindLabel(info)} / ${research.categoryLabel}
- 섹션 수: ${chosenLength(info.pageLength)}
- 명절 표현: ${research.seasonalCue}
- 추천 선물 대상: ${research.recommendedRecipient}

[승인된 소구점]
${approved || "- 승인된 소구점 없음"}

[구매자 질문]
${research.customerQuestions.map((item) => `- ${item}`).join("\n") || "- 없음"}

[전환 구조]
Hook → 구매 이유 → 구체적 장점 → 확인 가능한 근거/디테일 → 사용·섭취 장면 → 안심 → 추천형 CTA
- 기본 7개 흐름은 HERO, PROBLEM, CORE_BENEFIT, PROOF_COMPARE 또는 DETAIL, DETAIL, TRUST, CTA입니다.
- 5개라면 중복을 합치고, 9개라면 STORY·PROOF_SPEC·HOW_TO 중 필요한 내용을 추가하세요.
- 각 섹션은 한 화면에서 한 가지 메시지만 전달하세요.

[카피]
- 직관적이고 신뢰감 있게. HERO만 조금 더 강하게 쓰세요.
- 제목 10~24자, 보조문구 1~3개, 보조문구는 각 32자 이내.
- 입증 못 하는 수치·인증·최상급·건강 효능을 만들지 마세요.
- 가격, 할인, 쿠폰, 배송, 교환, 판매자 브랜드 '그릿마켓'은 쓰지 마세요.
- CTA는 '${research.seasonalCue} 선물로 준비해보세요'처럼 자연스러운 추천형 문장으로 끝내세요.

[디자인]
- 프리미엄 카탈로그(catalog), 모던 헤리티지(heritage), 클린 내추럴(natural) 중 하나를 추천하세요.
- 모든 섹션은 하나의 고정된 산세리프 폰트 패밀리와 제목·본문 크기 체계를 공유해야 합니다.
- 고정된 타이포그래피·그리드·여백 위에서 상품별 색과 사진 분위기만 달라져야 합니다.
- 촌스러운 금테, 복주머니, 한복, 과한 전통 문양, 과한 그라데이션과 아이콘을 피하세요.
- 식품은 질감·신선함·섭취 장면, 생활용품은 구조·사용성·디테일을 강조하세요.
- visualPrompt에는 사진 장면, 구도, 조명, 소품, 여백 위치만 씁니다. 이미지 안 텍스트 지시는 금지합니다.
- layout은 top/center/bottom, tone은 light/deep/accent 중 하나입니다.
`.trim();
}

const templates: SegmentTemplate[] = [
  "HERO",
  "PROBLEM",
  "CORE_BENEFIT",
  "PROOF_COMPARE",
  "PROOF_SPEC",
  "DETAIL",
  "HOW_TO",
  "TRUST",
  "CTA",
  "STORY",
];
const layouts: SegmentLayout[] = ["top", "center", "bottom"];
const tones: SegmentTone[] = ["light", "deep", "accent"];

export async function planDetailPageTracked(
  info: ProductInfo,
  research: ProductResearch,
  model: string,
  referenceImages: string[] = [],
): Promise<TrackedResult<DetailPlan>> {
  const tracked = await generateJsonWithSchemaTracked<any>(
    model,
    planPrompt(info, research),
    planSchema,
    { referenceImages: referenceImages.slice(0, 5) },
  );
  const raw = tracked.value;
  const requested = info.pageLength === PageLength.AUTO ? undefined : Number(info.pageLength);
  const rawSegments = Array.isArray(raw?.segments) ? raw.segments : [];
  const segments: DetailImageSegment[] = rawSegments
    .slice(0, requested ?? 9)
    .map((segment: any, index: number) => {
      const template = templates.includes(segment.template) ? segment.template : "DETAIL";
      return {
        id: `${template.toLowerCase()}-${index + 1}`,
        template,
        title: cleanLine(segment.title, 34),
        logicalSections: asLines(segment.logicalSections, 3),
        keyMessage: cleanLine(segment.keyMessage, 34),
        visualPrompt: cleanLine(segment.visualPrompt, 500),
        layout: layouts.includes(segment.layout) ? segment.layout : index === 0 ? "bottom" : "top",
        tone: tones.includes(segment.tone) ? segment.tone : index % 3 === 0 ? "deep" : "light",
      };
    });

  return {
    value: {
      recommendedLength: ["5", "7", "9"].includes(raw?.recommendedLength)
        ? raw.recommendedLength
        : String(segments.length || 7),
      recommendedStyle: ["catalog", "heritage", "natural"].includes(raw?.recommendedStyle)
        ? raw.recommendedStyle
        : "catalog",
      strategyNote: cleanLine(raw?.strategyNote, 180),
      segments,
    },
    usage: tracked.usage,
  };
}

export async function planDetailPage(
  info: ProductInfo,
  research: ProductResearch,
  model: string,
  referenceImages: string[] = [],
): Promise<DetailPlan> {
  return (await planDetailPageTracked(info, research, model, referenceImages)).value;
}

function sectionImagePrompt(
  info: ProductInfo,
  research: ProductResearch,
  segment: DetailImageSegment,
  styleId: DesignStyleId,
  hasReferences: boolean,
) {
  const style = DESIGN_STYLES.find((item) => item.id === styleId) ?? DESIGN_STYLES[0];
  const approved = research.sellingPoints
    .filter((point) => point.decision === "approved")
    .map((point) => point.title)
    .join(", ");
  return [
    "Create the photography/background layer for one premium Korean ecommerce mobile detail section.",
    "Vertical 9:16 composition. Photorealistic commercial product photography, refined editorial art direction.",
    "",
    "[ABSOLUTE OUTPUT RULE]",
    "NO text, NO letters, NO numbers, NO captions, NO labels added by you, NO watermark.",
    "Leave intentional clean negative space for the app to overlay Korean typography later.",
    "",
    "[PRODUCT]",
    `Product: ${info.name}`,
    `Category: ${productKindLabel(info)} / ${research.categoryLabel}`,
    hasReferences
      ? "Use the reference product exactly. Preserve its real shape, color, material, genuine package and genuine logo. Never redesign it."
      : "No product reference is provided. Create only a realistic, unbranded category-product scene. Never invent a package, brand, logo, certification, or printed label.",
    "Single coherent product scene. Do not add fictional accessories or claims.",
    "",
    "[SECTION INTENT]",
    `Section role: ${segment.template}`,
    `Marketing focus: ${segment.keyMessage}`,
    `Approved themes for context only: ${approved || "general product value"}`,
    `Scene direction: ${segment.visualPrompt}`,
    `Copy placement: ${segment.layout || "top"}; reserve uncluttered space there.`,
    "",
    "[ART DIRECTION]",
    `Style: ${style.name} — ${style.description}`,
    `Palette cue: background ${style.background}, accent ${style.accent}. Natural color fidelity.`,
    info.productKind === "living"
      ? "Emphasize structure, usability, material detail and a believable use context."
      : "Emphasize appetizing texture, freshness cues, natural ingredients and an elegant serving or gift context.",
    research.seasonalCue
      ? "Use only subtle contemporary Korean holiday cues such as restrained textile or paper texture. No gold frames, hanbok, pouches, lanterns, or kitschy holiday props."
      : "",
    segment.regenNonce ? `Composition variation seed: ${segment.regenNonce}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateDetailSectionImage(args: {
  info: ProductInfo;
  research: ProductResearch;
  segment: DetailImageSegment;
  styleId: DesignStyleId;
  modelType: ModelType;
  referenceImages?: string[];
}): Promise<string | null> {
  const refs = args.referenceImages?.slice(0, 5) ?? [];
  return generateImage(
    sectionImagePrompt(args.info, args.research, args.segment, args.styleId, refs.length > 0),
    args.modelType,
    "9:16",
    refs,
    { allowText: false, imageSize: "2K" },
  );
}

export async function generateDetailSectionImageTracked(args: {
  info: ProductInfo;
  research: ProductResearch;
  segment: DetailImageSegment;
  styleId: DesignStyleId;
  modelType: ModelType;
  referenceImages?: string[];
}): Promise<TrackedResult<string | null>> {
  const refs = args.referenceImages?.slice(0, 5) ?? [];
  return generateImageTracked(
    sectionImagePrompt(args.info, args.research, args.segment, args.styleId, refs.length > 0),
    args.modelType,
    "9:16",
    refs,
    { allowText: false, imageSize: "2K" },
  );
}

export async function cleanupProductImage(
  image: string,
  modelType: ModelType,
): Promise<string | null> {
  return generateImage(
    [
      "Create a clean transparent-background ecommerce product cutout from this exact reference photo.",
      "Preserve the genuine product or genuine package exactly: shape, proportions, colors, materials, printed label and existing real logo.",
      "Remove only the background, hands, table, shadows that obscure the outline, and unrelated surrounding objects or text.",
      "Center the product, keep its full outline, correct exposure gently, and add natural sharpness.",
      "Do not redesign, retouch away product details, invent packaging, add a brand, add props, or add text.",
    ].join("\n"),
    modelType,
    "1:1",
    [image],
    {
      allowText: false,
      imageSize: "2K",
      quality: "medium",
      background: "transparent",
    },
  );
}

export async function cleanupProductImageTracked(
  image: string,
  modelType: ModelType,
): Promise<TrackedResult<string | null>> {
  return generateImageTracked(
    [
      "Create a clean transparent-background ecommerce product cutout from this exact reference photo.",
      "Preserve the genuine product or genuine package exactly: shape, proportions, colors, materials, printed label and existing real logo.",
      "Remove only the background, hands, table, shadows that obscure the outline, and unrelated surrounding objects or text.",
      "Center the product, keep its full outline, correct exposure gently, and add natural sharpness.",
      "Do not redesign, retouch away product details, invent packaging, add a brand, add props, or add text.",
    ].join("\n"),
    modelType,
    "1:1",
    [image],
    {
      allowText: false,
      imageSize: "2K",
      quality: "medium",
      background: "transparent",
    },
  );
}
