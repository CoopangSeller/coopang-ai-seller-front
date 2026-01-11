
export enum PageLength {
  AUTO = 'auto',
  SHORT = '5',
  STANDARD = '7',
  LONG = '9'
}

export enum ModelType {
  FREE = 'gemini-2.5-flash-image',
  PAID = 'gemini-3-pro-image-preview'
}

export interface DetailImageSegment {
  id: string;
  title: string;
  logicalSections: string[];
  keyMessage: string;
  visualPrompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface ProductInfo {
  name: string;
  category: string;
  price: string;
  features: string;
  targetGender: string[];
  targetAge: string[];
  pageLength: PageLength;
  referenceImage?: string; // base64
}

export interface ThumbnailConfig {
  productName: string;
  features: string;
  style: 'Clean' | 'Lifestyle' | 'Creative';
  hasPerson: boolean;
  textPosition: 'top' | 'center' | 'bottom';
  referenceImage?: string;
}
