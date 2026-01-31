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


export interface DetailImageSegment {
  id: string;
  template: SegmentTemplate;   // ✅ 추가
  title: string; // 실제로 “표시될 수 있는” 헤드라인 후보
  logicalSections: string[]; // 서브카피/아이콘 설명 후보
  keyMessage: string; // 내부 주제(Theme) 용도로도 활용 (단, 메타 문자열 방지 로직 있음)
  visualPrompt: string; // 인정 프롬프트(이미지 연출/구도)

  imageUrl?: string;
  isGenerating?: boolean;

  promptOverride?: string;

  history?: Array<{
    keyMessage: string;
    title: string;
    logicalSections: string[];
    visualPrompt: string;
    imageUrl?: string;
    createdAt: number;
  }>;

  // ✅ 추가: redo 스택
  future?: Array<{
    keyMessage: string;
    title: string;
    logicalSections: string[];
    visualPrompt: string;
    imageUrl?: string;
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