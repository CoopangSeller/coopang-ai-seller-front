import type { ChinaImportCalc } from "@/entities/china-import-calc";

export function applyCalcToForm(
  calc: ChinaImportCalc,
  setField: (k: any, v: string) => void,
) {
  if (calc.fxRateKrwPerCny != null) setField("fxRateKrwPerCny", String(calc.fxRateKrwPerCny));
  if (calc.forwardingFeeRate != null) setField("forwardingFeeRatePercent", String(calc.forwardingFeeRate * 100));
  if (calc.unitCostCny != null) setField("unitCostCny", String(calc.unitCostCny));
  if (calc.qty != null) setField("qty", String(calc.qty));

  if (calc.sizeWCm != null) setField("sizeW", String(calc.sizeWCm));
  if (calc.sizeDCm != null) setField("sizeD", String(calc.sizeDCm));
  if (calc.sizeHCm != null) setField("sizeH", String(calc.sizeHCm));

  if (calc.inspectionPackPerUnitKrw != null) setField("inspectionPackPerUnitKrw", String(calc.inspectionPackPerUnitKrw));
  if (calc.barcodePerUnitKrw != null) setField("barcodePerUnitKrw", String(calc.barcodePerUnitKrw));
  if (calc.boxPalletTotalKrw != null) setField("boxPalletTotalKrw", String(calc.boxPalletTotalKrw));
  if (calc.cbmRateKrw != null) setField("cbmRateKrw", String(calc.cbmRateKrw));

  if (calc.customsBrokerKrw != null) setField("customsBrokerKrw", String(calc.customsBrokerKrw));
  if (calc.containerWorkKrw != null) setField("containerWorkKrw", String(calc.containerWorkKrw));
  if (calc.blIssueKrw != null) setField("blIssueKrw", String(calc.blIssueKrw));
  if (calc.ftaIssueKrw != null) setField("ftaIssueKrw", String(calc.ftaIssueKrw));

  if (calc.domesticShippingKrw != null) setField("domesticShippingKrw", String(calc.domesticShippingKrw));
  if (calc.milkRunKrw != null) setField("milkRunKrw", String(calc.milkRunKrw));
}
