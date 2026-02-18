export type ChinaImportCalc = {
  id?: string;

  productSourcingId: string;
  userId: string;

  fxRateKrwPerCny?: number;
  forwardingFeeRate?: number;
  unitCostCny?: number;
  qty?: number;

  sizeWCm?: number;
  sizeDCm?: number;
  sizeHCm?: number;

  inspectionPackPerUnitKrw?: number;
  barcodePerUnitKrw?: number;
  boxPalletTotalKrw?: number;
  cbmRateKrw?: number;

  customsBrokerKrw?: number;
  containerWorkKrw?: number;
  blIssueKrw?: number;
  ftaIssueKrw?: number;

  domesticShippingKrw?: number;
  milkRunKrw?: number;

  inlandShippingCny?: number;
  inspectionPackTotalKrw?: number;
  barcodeTotalKrw?: number;
  productPurchaseKrw?: number;
  cbmFeeKrw?: number;
  customsDoneTotalKrw?: number;
  vatKrw?: number;
  totalKrw?: number;
  unitCostKrw?: number;
  multiple?: number;
  estimatedBoxCount?: number;
};

export type ChinaImportCalcResponse = {
  chinaImportCalc: ChinaImportCalc;
};

export type UpsertCommand = {
  fxRateKrwPerCny?: number;
  forwardingFeeRate?: number;
  unitCostCny?: number;
  qty?: number;

  sizeWCm?: number;
  sizeDCm?: number;
  sizeHCm?: number;

  inspectionPackPerUnitKrw?: number;
  barcodePerUnitKrw?: number;
  boxPalletTotalKrw?: number;
  cbmRateKrw?: number;

  customsBrokerKrw?: number;
  containerWorkKrw?: number;
  blIssueKrw?: number;
  ftaIssueKrw?: number;

  domesticShippingKrw?: number;
  milkRunKrw?: number;

  inlandShippingCny?: number;
  inspectionPackTotalKrw?: number;
  barcodeTotalKrw?: number;
  productPurchaseKrw?: number;
  cbmFeeKrw?: number;
  customsDoneTotalKrw?: number;
  vatKrw?: number;
  totalKrw?: number;
  unitCostKrw?: number;
  multiple?: number;
  estimatedBoxCount?: number;
};

// OpenAPI의 AuthorizedUser(스프링독스 노출용)
export type AuthorizedUser = {
  userId: string;
  roles?: string[];
  profileIds?: string[];
};
