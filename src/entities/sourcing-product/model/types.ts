export type RowOp = "none" | "create" | "update" | "delete";

export type SourcingProductRow = {
  id: string;              // client uuid (서버 붙으면 serverId 별도)
  serverId?: string;
  createdAt: string;       // ISO
  op: RowOp;

  no?: number;

  keyword: string;
  vendor: string;          // 도매처(=참고 상품)
  refProduct: string;      // 참고 상품(원본 유지 원하면 분리)
  url1688: string;
  imageUrl: string;

  costCny?: number;
  costKrw?: number;

  coupangCategory: string;

  salePriceKrw?: number;
  feeRate?: number;        // 0~1 (엑셀은 %처럼 보이지만 실제 값은 0.108)
  productName: string;

  shippingKrw?: number;    // 엑셀 시트에 I열 3000 값이 있어 운임으로 취급(확장)
};

export type SourcingQuery = {
  createdFrom?: string; // YYYY-MM-DD
  createdTo?: string;
  keyword?: string;
  vendor?: string;
};
