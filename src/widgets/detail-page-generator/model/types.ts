export enum PageLength {
  AUTO = "auto",
  SHORT = "5",
  STANDARD = "7",
  LONG = "9",
}

export type ProductKind = "food" | "living" | "other";
export type ReviewDecision = "pending" | "approved" | "excluded";
export type EvidenceLevel = "confirmed" | "general" | "seller_check";

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  kind: "official" | "market" | "video" | "article" | "other";
}

export interface SellingPoint {
  id: string;
  title: string;
  description: string;
  evidenceLevel: EvidenceLevel;
  decision: ReviewDecision;
  sourceIds: string[];
}

export interface ProductResearch {
  categoryLabel: string;
  summary: string;
  seasonalCue: string;
  recommendedRecipient: string;
  customerQuestions: string[];
  photoRoles: string[];
  sellingPoints: SellingPoint[];
  sources: ResearchSource[];
}

export type DesignStyleId = "catalog" | "heritage" | "natural";

export interface DesignStyle {
  id: DesignStyleId;
  name: string;
  description: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
  muted: string;
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
  | "CTA"
  | "STORY";

export type SegmentLayout = "top" | "center" | "bottom";
export type SegmentTone = "light" | "deep" | "accent";

export type SegmentEdits = {
  headerText?: string;
  subcopyText?: string;
  visualRequest?: string;
};

export interface SegmentSnapshot {
  keyMessage: string;
  title: string;
  logicalSections: string[];
  visualPrompt: string;
  imageUrl?: string;
  promptOverride?: string;
  edits?: SegmentEdits;
  layout?: SegmentLayout;
  tone?: SegmentTone;
  createdAt: number;
}

export interface DetailImageSegment {
  id: string;
  template: SegmentTemplate;
  title: string;
  logicalSections: string[];
  keyMessage: string;
  visualPrompt: string;
  layout?: SegmentLayout;
  tone?: SegmentTone;
  edits?: SegmentEdits;
  imageUrl?: string;
  isGenerating?: boolean;
  promptOverride?: string;
  regenNonce?: string;
  history?: SegmentSnapshot[];
  future?: SegmentSnapshot[];
}

export interface DetailPlan {
  recommendedLength: "5" | "7" | "9";
  recommendedStyle: DesignStyleId;
  strategyNote: string;
  segments: DetailImageSegment[];
}

// 이전 저장본과 기존 보조 모듈이 깨지지 않도록 컷 관련 타입은 유지한다.
export type DetailShotKey = "cutout" | "lifestyle" | "model";
export interface ProductShotConfig {
  key: DetailShotKey;
  label: string;
  referenceImages?: string[];
  prompt?: string;
}

export interface ProductInfo {
  name: string;
  category: string;
  productKind?: ProductKind;
  sourceUrl?: string;
  videoTranscript?: string;
  price: string;
  features: string;
  targetGender: string[];
  targetAge: string[];
  pageLength: PageLength;
  referenceImages: string[];
  shots: Record<DetailShotKey, ProductShotConfig>;
  detailExtraPrompt: string;
  pricing?: { originalPrice: string; salePrice: string };
}
