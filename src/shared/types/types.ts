// src/shared/types/types.ts

export enum PageLength {
  AUTO = "auto",
  SHORT = "5",
  STANDARD = "7",
  LONG = "9",
}

export enum ModelType {
  FREE = "gemini-2.5-flash-image",
  PAID = "gemini-3-pro-image-preview",
}

export type DetailShotKey = "cutout" | "lifestyle" | "model";

export interface Pricing {
  originalPrice: string; // "39,900" 등 문자열로 유지
  salePrice: string; // "29,900" 등 문자열로 유지
}

export interface ProductShotConfig {
  key: DetailShotKey;
  label: string;
  referenceImages?: string[]; // base64 dataUrl
  prompt?: string; // 탭별 의도 입력
}

export interface DetailImageSegment {
  id: string;
  title: string;
  logicalSections: string[];
  keyMessage: string;
  visualPrompt: string;
  imageUrl?: string;
  isGenerating?: boolean;

  // 재생성/되돌리기 확장 여지
  history?: Array<{
    keyMessage: string;
    visualPrompt: string;
    imageUrl?: string;
    createdAt: number;
  }>;
}

export interface ProductInfo {
  name: string;
  category: string;

  // legacy (있던 필드 유지)
  price: string;

  // USP/특징
  features: string;

  // 타겟
  targetGender: string[];
  targetAge: string[];

  // 길이
  pageLength: PageLength;

  // 공통 레퍼런스
  referenceImages?: string[]; // base64 dataUrl

  // ✅ 가격 구조화
  pricing?: Pricing;

  // ✅ Step2 컷 탭 상태
  shots: Record<DetailShotKey, ProductShotConfig>;
}

export interface ThumbnailConfig {
  productName: string;
  features: string;
  style: "Clean" | "Lifestyle" | "Creative";
  hasPerson: boolean;
  textPosition: "top" | "center" | "bottom";
  referenceImages?: string[];
}
