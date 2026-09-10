// src/widgets/detail-page-generator/api/detailPlannerGemini.ts
import { ModelType } from "@/shared/types";
import { DetailImageSegment, PageLength, ProductInfo } from "../model/types";
import {
  generateImage,
  generateJsonWithSchema,
  Type,
} from "@/shared/api/openai/openaiService";

function safeJoin(arr?: string[]) {
  return (arr ?? []).filter(Boolean).join(", ");
}

function clampLine(input: string, maxChars: number) {
  const t = (input || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > maxChars ? t.slice(0, maxChars).trimEnd() + "…" : t;
}

function normalizeUSP(features: string) {
  const raw = (features ?? "").trim();
  if (!raw) return "";
  return raw.length > 1200 ? raw.slice(0, 1200) : raw;
}

function lengthLabel(len: PageLength) {
  if (len === PageLength.AUTO) return "AI 추천 (5~9장)";
  return `${len}장`;
}

/**
 * ✅ 쿠팡 전용 기획 프롬프트
 * - keyMessage는 “섹션 테마 토큰” (렌더링 텍스트 아님)
 * - visualPrompt에는 “텍스트 생성 금지” 같은 문구를 넣지 않음 (이미지 단계에서 통제)
 */
function buildCoupangPlanPrompt(info: ProductInfo) {
  const usp = normalizeUSP(info.features);

  return `
당신은 쿠팡 모바일 상세페이지(9:16) 기획 전문가입니다.
아래 상품 정보를 바탕으로, “쿠팡에서 실제로 팔리는 구조(Winning Logic)”로 섹션을 기획하세요.

[상품 정보]
- 상품명: ${info.name}
- 카테고리: ${info.category}
- 타겟: 성별(${safeJoin(info.targetGender)}), 연령(${safeJoin(info.targetAge)})
- 목표 길이: ${lengthLabel(info.pageLength)}

[USP/핵심 특징(사용자 입력)]
${usp || "(미입력)"}

[USP 사용 원칙]
- USP는 '복사해서 쓰는 문구'가 아니라 기획 재료입니다. 표현을 재구성하세요.
- HERO/CORE_BENEFIT/PROOF_COMPARE에서만 적극 활용하세요.
- TRUST/CTA에서는 USP를 직접 언급하지 마세요.
- 동일 표현 반복 금지(섹션 간 중복 최소화).
- USP가 미입력이라면 임의로 USP를 만들어내지 말고, 상품명/카테고리 기반의 보편 니즈만 사용하세요.

[기획 논리 구조(권장 흐름)]
1) Hook: 문제/욕구를 한 문장으로 찌르기
2) Benefit: 얻는 결과/이득을 즉시 제시
3) Proof: 스펙/수치/비교/후기 근거
4) Detail: 디테일/재질/사용법/구성
5) Trust: 배송/AS/교환/신뢰 정보
6) CTA: 망설임 해소 + 구매 유도

[섹션 구성 규칙 — 쿠팡 고정 템플릿]
- 반드시 아래 순서를 지켜 섹션을 생성:
  HERO → PROBLEM → CORE_BENEFIT → PROOF_COMPARE → DETAIL → HOW_TO → TRUST → CTA
- 각 템플릿은 1회씩만 사용
- 템플릿 성격에 맞지 않는 내용 배치 금지

[섹션별 텍스트 밀도 — 쿠팡 기준]
- HERO: 헤드라인 1줄(필수) + 보조 0~1줄
- PROBLEM: 질문/문제제기 1줄
- CORE_BENEFIT: 헤드라인 1줄 + 보조 포인트 최대 2개
- PROOF_COMPARE: 비교 라벨(기존/이 제품) + 짧은 근거 1줄 수준
- DETAIL/HOW_TO: 카드형 3개(각 6~10자) 중심, 문장 길게 금지
- TRUST: 안심/신뢰 메시지 위주(과장 금지)
- CTA: 행동 유도 1줄(감성 과잉 금지)

[visualPrompt 작성 가이드]
- 각 섹션은 서로 다른 장면/상황/오브젝트로 구분되게 작성
- 배경은 '흰 배경 스튜디오'만 반복하지 말고 섹션 목적에 맞게 변주
- PROOF_COMPARE는 '두 개의 비교 대상'이 한 화면에 보이게
- DETAIL/HOW_TO는 '3개의 아이콘형 오브젝트/소품'이 한 화면에 보이게
- TRUST는 포장/배송/교환을 연상시키는 오브젝트(박스, 완충재, 송장 등) 중심

[출력 규칙]
- 결과는 JSON 배열로만 출력
- 각 아이템 필드(반드시 포함): id, title, logicalSections, keyMessage, visualPrompt
- title: 이미지에 렌더링될 헤드라인(짧고 굵게)
- logicalSections: 보조 포인트(짧게, 최대 3~4개)
- keyMessage: “섹션 테마 토큰(내부용)” 입니다.
  - 짧은 한국어 구(6~14자)
  - 이미지에 그대로 출력될 문장처럼 쓰지 말 것(예: “완벽한 밀착!” 같은 카피형 금지)
  - 느낌표/감탄사/광고성 수식어(최고, 완벽, 혁신 등) 금지
  - 예: “좁은 병 세척”, “선물용 고급 포장”, “중대과 크기”, “첫인상 임팩트”
- visualPrompt: 사진/구도/조명/소품/피사체를 구체적으로(텍스트 지시 문구 금지)
- 세로 9:16 구도를 전제로 작성
- JSON 외의 텍스트(설명, 주석, 마크다운 코드펜스) 금지
- id는 반드시 아래 템플릿 중 하나:
  "HERO"|"PROBLEM"|"CORE_BENEFIT"|"PROOF_COMPARE"|"DETAIL"|"HOW_TO"|"TRUST"|"CTA"
- logicalSections는 문자열 배열이며, 각 요소는 6~14자 권장
- title은 8~18자 권장(쿠팡 모바일 헤드라인 길이)
- visualPrompt는 1~3문장, '장면 묘사'만 작성(텍스트/문구/자막/레이아웃 지시 금지)
`.trim();
}

/**
 * ✅ plan 결과 최소 정규화
 */
function normalizePlannedSegments(raw: any): DetailImageSegment[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((s, idx) => {
    const id = String(s?.id || `s${idx + 1}`);
    const title = clampLine(String(s?.title || ""), 32);
    const keyMessage = clampLine(String(s?.keyMessage || ""), 14); // 내부 토큰이므로 더 짧게
    const logicalSections = Array.isArray(s?.logicalSections)
      ? s.logicalSections
          .map((x: any) => clampLine(String(x || ""), 44))
          .filter(Boolean)
          .slice(0, 4)
      : [];

    return {
      id,
      template: id as any, // id가 템플릿 키(HERO...)로 들어오므로 그대로 매핑
      title,
      keyMessage,
      logicalSections,
      visualPrompt: String(s?.visualPrompt || "").trim(),
    } as DetailImageSegment;
  });
}

function normalizeLogicalSections(v: unknown): string[] {
  if (Array.isArray(v))
    return v
      .filter((x) => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);

  if (typeof v === "string") {
    const trimmed = v.trim();

    // JSON 배열 문자열도 지원: '["a","b"]'
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((x) => typeof x === "string")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      } catch {}
    }

    return trimmed
      .split(/\r?\n|,/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * ✅ KeyMessage 미출력(테마 전용) + 쿠팡 상업용 레이아웃 룰 포함
 * - 헤더/서브카피는 seg.edits를 우선 사용하고 “렌더링 텍스트 고정”
 * - seg.edits.visualRequest는 “비주얼 지시” 블록에만 삽입(렌더링 텍스트 금지)
 */
function buildCoupangSectionImagePrompt(info: ProductInfo, seg: DetailImageSegment) {
  const themeToken = (seg.keyMessage || "").trim();

  const headerText = clampLine(
    (seg.edits?.headerText ?? seg.title ?? "").trim(),
    64,
  );

  const rawSubcopy = (
    seg.edits?.subcopyText ??
    (Array.isArray(seg.logicalSections) ? seg.logicalSections.join("\n") : "")
  ).trim();

  const bullets = normalizeLogicalSections(rawSubcopy).slice(0, 3);

  // ✅ 비주얼 지시(렌더링 텍스트로 사용 금지)
  const visualRequest = (
    seg.edits?.visualRequest ??
    (seg.promptOverride || "")
  ).trim();

  const identityLock = [
    "[REFERENCE IMAGE LOCK (HIGHEST PRIORITY)]",
    "- Match the product in the reference images EXACTLY.",
    "- Do NOT change: shape/silhouette, proportions, color, material, texture, label/logo placement, number of parts, openings/closures.",
    "- Do NOT redesign the product. Do NOT generate a different model/variant.",
    "- Do NOT add/remove accessories unless they are clearly present in the reference images.",
    "- Single product only (no duplicates).",
    "- Keep the product as the main subject and unobstructed.",
    "",
    "[PRODUCT CONSISTENCY]",
    "- Keep the product consistent and realistic. Do not invent new parts.",
  ].join("\n");

  const themeHint = themeToken
    ? [
        `Theme token (DO NOT PRINT THIS TEXT): "${themeToken}"`,
        "Use it only to decide composition, props, scene, and emphasis.",
      ].join("\n")
    : "Use the intended section theme only to decide composition and emphasis (do not print it).";

  // ✅ 재생성 변이 토큰(렌더링 금지)
  const variationToken = (seg.regenNonce || "").trim();
  const variationHint = variationToken
    ? [
        `Variation token (DO NOT PRINT THIS TEXT): "${variationToken}"`,
        "- Use it to create a different composition/camera angle/prop arrangement while keeping the product identity locked.",
        "- Do NOT change the product. Only vary the scene/layout within the same section intent.",
      ].join("\n")
    : "";

  // ✅ 헤더/서브카피는 모델이 재작성하지 못하게 “렌더링 텍스트 고정”
  const textPack = [
    "[TEXT TO RENDER (KOREAN) — RENDER EXACTLY AS GIVEN]",
    headerText
      ? `- Headline (bold, 1 line): "${headerText}"`
      : "- Headline: (none)",
    bullets.length
      ? `- Sub points (max 2~3): ${bullets
          .map((b) => `"${clampLine(b, 28)}"`)
          .join(", ")}`
      : "- Sub points: (none)",
    "",
    "[STRICT TEXT LOCK]",
    "- Render the Korean texts EXACTLY. Do NOT paraphrase, rewrite, re-order, or add/remove words.",
    "- Keep punctuation/spacing as-is. Do NOT translate to English.",
    "- Never render/print the theme token (keyMessage) or variation token.",
    "- Do not invent extra sentences at the bottom (no white footer captions).",
    "- No random english letters, no watermarks, no fake brand logos.",
  ].join("\n");

  const layoutRules = [
    "[COUPANG MOBILE COMMERCIAL LAYOUT RULES]",
    "- 9:16 vertical detail-section image for Coupang mobile.",
    "- Photo : Text ratio ≈ 70~80% photo / 20~30% text.",
    "- Text must NOT overlap each other and must NOT cover product 핵심 영역.",
    "- Keep safe margins. Use clean grid alignment, consistent spacing, stable line-height.",
    "- Use 2~3 consistent theme colors across chips/icons/dividers (minimal, trustworthy).",
    "- Overall tone: clean, premium, readable, minimal decoration.",
  ].join("\n");

  const productContext = [
    "[PRODUCT CONTEXT]",
    info.name ? `- Product: ${info.name}` : "",
    info.category ? `- Category: ${info.category}` : "",
    info.detailExtraPrompt?.trim()
      ? `- Extra direction: ${info.detailExtraPrompt.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const visualBlock = [
    "Visual direction (photo/scene):",
    seg.visualPrompt?.trim() || "(none)",
    visualRequest ? "[VISUAL REQUEST (DO NOT RENDER AS TEXT)]" : "",
    visualRequest || "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "Create a single high-conversion Coupang mobile detail-section image.",
    "Professional commercial photography + clean editorial design (Korean e-commerce).",
    "",
    identityLock,
    "",
    themeHint,
    variationHint,
    "",
    layoutRules,
    "",
    productContext,
    "",
    visualBlock,
    "",
    textPack,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * 기획안 구성
 */
export async function planDetailPage(
  info: ProductInfo,
  model: string,
): Promise<DetailImageSegment[]> {
  const prompt = buildCoupangPlanPrompt(info);

  const schema = {
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
  };

  const raw = await generateJsonWithSchema<any[]>(model, prompt, schema);

  return normalizePlannedSegments(raw);
}

/**
 * 섹션별 이미지 생성
 */
export async function generateDetailSectionImage(args: {
  info: ProductInfo;
  seg: DetailImageSegment;
  modelType: ModelType;
  referenceImages?: string[];
  overrideModel?: string;
  imageSize?: string;
  allowText?: boolean;
}): Promise<string | null> {
  const prompt = buildCoupangSectionImagePrompt(args.info, args.seg);

  const url = await generateImage(prompt, args.modelType, "9:16", args.referenceImages, {
    allowText: args.allowText ?? true,
    imageSize: args.imageSize ?? "2K",
    modelOverride: args.overrideModel,
  });

  return url ?? null;
}
