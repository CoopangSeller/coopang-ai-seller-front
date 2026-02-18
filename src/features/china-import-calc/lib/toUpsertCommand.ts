import type { UpsertCommand } from "@/entities/china-import-calc";

/**
 * 기존 useChinaImportCalc의 form/computed 구조를 UpsertCommand로 변환한다.
 * - 서버 스키마: forwardingFeeRate (0~1)
 * - 기존 폼: forwardingFeeRatePercent (%) 로 보이므로 변환 필요
 */
export function toUpsertCommand(form: any, computed: any): UpsertCommand {
  const percent = Number(form.forwardingFeeRatePercent || 0);
  const forwardingFeeRate = Number.isFinite(percent) ? percent / 100 : 0;

  return {
    // inputs
    fxRateKrwPerCny: num(form.fxRateKrwPerCny),
    forwardingFeeRate,
    unitCostCny: num(form.unitCostCny),
    qty: int(form.qty),

    sizeWCm: num(form.sizeW),
    sizeDCm: num(form.sizeD),
    sizeHCm: num(form.sizeH),

    inspectionPackPerUnitKrw: int64(form.inspectionPackPerUnitKrw),
    barcodePerUnitKrw: int64(form.barcodePerUnitKrw),
    boxPalletTotalKrw: int64(form.boxPalletTotalKrw),
    cbmRateKrw: int64(form.cbmRateKrw),

    customsBrokerKrw: int64(form.customsBrokerKrw),
    containerWorkKrw: int64(form.containerWorkKrw),
    blIssueKrw: int64(form.blIssueKrw),
    ftaIssueKrw: int64(form.ftaIssueKrw),

    domesticShippingKrw: int64(form.domesticShippingKrw),
    milkRunKrw: int64(form.milkRunKrw),

    // computed snapshot
    inlandShippingCny: num(computed.inlandShippingCny),
    inspectionPackTotalKrw: int64(computed.inspectionPackTotalKrw),
    barcodeTotalKrw: int64(computed.barcodeTotalKrw),
    productPurchaseKrw: int64(computed.productPurchaseKrw),
    cbmFeeKrw: int64(computed.cbmFeeKrw),
    customsDoneTotalKrw: int64(computed.customsDoneTotalKrw),
    vatKrw: int64(computed.vatKrw),
    totalKrw: int64(computed.totalKrw),
    unitCostKrw: int64(computed.unitCostKrw),
    multiple: num(computed.multiple),
    estimatedBoxCount: int(computed.estimatedBoxCount),
  };
}

function num(v: any): number | undefined {
  const n = typeof v === "string" ? Number(v.replaceAll(",", "")) : Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function int(v: any): number | undefined {
  const n = num(v);
  return n == null ? undefined : Math.trunc(n);
}
function int64(v: any): number | undefined {
  // TS에서는 number로 처리. 서버는 long(int64)이지만 JSON number로 전송.
  const n = num(v);
  return n == null ? undefined : Math.trunc(n);
}
