export type ChinaImportCalcInputs = {
  /** 구매대행 환율 (배대지 환율) */
  fxRateKrwPerCny: number; // C4

  /** 배대지 수수료(%) 0~1 */
  forwardingFeeRate: number; // E4

  /** 원가(위안) */
  unitCostCny: number; // C5

  /** 수량 */
  qty: number; // C6

  /** 제품 크기(cm) */
  sizeCm: { w: number; d: number; h: number }; // C7,D7,E7

  /** 제품당 검수 및 포장 비용(원) */
  inspectionPackPerUnitKrw: number; // C9

  /** 제품당 바코드 부착 비용(원) */
  barcodePerUnitKrw: number; // E9

  /** 박스 및 팔레트 총 비용(원) */
  boxPalletTotalKrw: number; // G9

  /** CBM당 요금(원) */
  cbmRateKrw: number; // I9

  /** 사업자 통관 수수료(세관비용)(원) */
  customsBrokerKrw: number; // C11

  /** 컨테이너 작업비(원) */
  containerWorkKrw: number; // E11

  /** BL 발생비(원) */
  blIssueKrw: number; // G11

  /** 원산지증명서(FTA) 발행(원) */
  ftaIssueKrw: number; // I11

  /** 국내 배송비용(원) (보수적으로 박스 x 5000원) */
  domesticShippingKrw: number; // C14

  /** 밀크런 비용(원) */
  milkRunKrw: number; // E14
};

export type ChinaImportCalcComputed = {
  /** 중국 내륙 배송비(위안) */
  inlandShippingCny: number; // E6

  /** 전체 제품 검수 및 포장 비용(원) */
  inspectionPackTotalKrw: number; // C10

  /** 전체 제품 바코드 부착 비용(원) */
  barcodeTotalKrw: number; // E10

  /** 제품 구매 비용(원) */
  productPurchaseKrw: number; // C13

  /** CBM 요금(원) */
  cbmFeeKrw: number; // E13

  /** 통관완료 총 비용(원) */
  customsDoneTotalKrw: number; // G13

  /** 부가세(원) */
  vatKrw: number; // G14

  /** 전체 비용(원) */
  totalKrw: number; // C15

  /** 개당 원가(원) */
  unitCostKrw: number; // E15

  /** 배수(배율) */
  multiple: number; // G15

  /** 참고: 보수적 국내배송(박스수*5000) 계산용 박스 수 */
  estimatedBoxCount: number;
};
