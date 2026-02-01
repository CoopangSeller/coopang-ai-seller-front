export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",

  // 소싱
  SOURCING_PRODUCTS: "/sourcing/products",
  SOURCING_CHINA_CALC: "/sourcing/china-calc",

  // 기획
  PLANNING_DETAIL_PAGE: "/planning/detail-page",
  PLANNING_DETAIL_PAGE_SCHEDULED: "/planning/detail-page-scheduled",
  PLANNING_THUMBNAIL: "/planning/thumbnail",
  PLANNING_THUMBNAIL_SCHEDULED: "/planning/thumbnail-scheduled",
  PLANNING_TAG_GENERATOR: "/planning/tag-generator",

  // 상품
  PRODUCTS_MANAGE: "/products/manage",
  PRODUCTS_DETAIL_PAGES: "/products/detail-pages",
  PRODUCTS_THUMBNAILS: "/products/thumbnails",

  // 마이페이지
  MY_PASSWORD: "/my/password",
} as const;

export const ROUTE_LABEL: Record<string, string> = {
  [ROUTES.HOME]: "홈",

  [ROUTES.SOURCING_PRODUCTS]: "상품 소싱",
  [ROUTES.SOURCING_CHINA_CALC]: "중국 사입 계산",

  [ROUTES.PLANNING_DETAIL_PAGE]: "상세페이지 생성",
  [ROUTES.PLANNING_DETAIL_PAGE_SCHEDULED]: "상세페이지 예약 생성",
  [ROUTES.PLANNING_THUMBNAIL]: "썸네일 생성",
  [ROUTES.PLANNING_THUMBNAIL_SCHEDULED]: "썸네일 예약 생성",
  [ROUTES.PLANNING_TAG_GENERATOR]: "태그 생성",

  [ROUTES.PRODUCTS_MANAGE]: "등록 상품 관리",
  [ROUTES.PRODUCTS_DETAIL_PAGES]: "상세페이지 조회",
  [ROUTES.PRODUCTS_THUMBNAILS]: "썸네일 조회",

  [ROUTES.MY_PASSWORD]: "비밀번호 변경",
};
