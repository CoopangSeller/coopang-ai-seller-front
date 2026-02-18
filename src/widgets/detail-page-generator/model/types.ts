export enum PageLength {
  AUTO = "auto",
  SHORT = "5",
  STANDARD = "7",
  LONG = "9",
}

export type DetailShotKey = "cutout" | "lifestyle" | "model";

export interface ProductShotConfig {
  key: DetailShotKey;
  label: string;
  referenceImages?: string[]; // base64 dataUrl
  prompt?: string; // 탭별 의도 입력
}

export type SegmentTemplate =
  | "HERO"
  | "PROBLEM"
  | "CORE_BENEFIT"
  | "PROOF_COMPARE"
  | "PROOF_SPEC"
  | "DETAIL"
  | "HOW_TO"
  | "TRUST"
  | "CTA";

/**
 * 섹션 재생성 시 사용자 편집값(입력 분리)
 * - header/subcopy는 렌더링 텍스트로 고정
 * - visualRequest는 비주얼 지시로만 사용(렌더링 텍스트 금지)
 */
export type SegmentEdits = {
  headerText?: string;
  subcopyText?: string;
  visualRequest?: string;
};

export interface DetailImageSegment {
  id: string;
  template: SegmentTemplate; // ✅ 추가
  title: string; // 실제로 “표시될 수 있는” 헤드라인 후보
  logicalSections: string[]; // 서브카피/아이콘 설명 후보
  keyMessage: string; // 내부 주제(Theme) 용도로도 활용 (단, 메타 문자열 방지 로직 있음)
  visualPrompt: string; // 인정 프롬프트(이미지 연출/구도)

  /**
   * 섹션 재생성 시 사용자 편집값(입력 분리)
   * - header/subcopy는 렌더링 텍스트로 고정
   * - visualRequest는 비주얼 지시로만 사용(렌더링 텍스트 금지)
   */
  edits?: SegmentEdits;

  imageUrl?: string;
  isGenerating?: boolean;

  /** (legacy) 섹션별 보완 요청(비주얼 지시 전용) */
  promptOverride?: string;

  /**
   * 재생성 시 동일 결과를 피하기 위한 변이 토큰(렌더링 금지)
   * - regenerateOne에서 매번 새 값으로 세팅
   */
  regenNonce?: string;

  history?: Array<{
    keyMessage: string;
    title: string;
    logicalSections: string[];
    visualPrompt: string;
    imageUrl?: string;
    promptOverride?: string;
    edits?: SegmentEdits;
    createdAt: number;
  }>;

  // ✅ 추가: redo 스택
  future?: Array<{
    keyMessage: string;
    title: string;
    logicalSections: string[];
    visualPrompt: string;
    imageUrl?: string;
    promptOverride?: string;
    edits?: SegmentEdits;
    createdAt: number;
  }>;
}

export interface ProductInfo {
  name: string;
  category: string;
  price: string;
  features: string;

  targetGender: string[];
  targetAge: string[];

  pageLength: PageLength;

  referenceImages: string[]; // base64 dataUrl or url

  shots: Record<DetailShotKey, ProductShotConfig>;

  /**
   * Step3에서 사용자 추가 요청(상세 기획/생성에 반영)
   * - 기존 상태/드래프트와 맞추기 위해 필수 필드로 둠(빈 문자열 가능)
   */
  detailExtraPrompt: string;
}
