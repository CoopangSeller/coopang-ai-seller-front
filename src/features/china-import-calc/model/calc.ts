import { ChinaImportCalcComputed, ChinaImportCalcInputs } from "@/entities/china-import-calc";

/**
 * ⚠️ Excel 수식(원본 시트: '중국 사입 원가 계산기')를 그대로 TS로 이식.
 *
 * - E6  = C6/((60*50*40)/(C7*D7*E7))*25
 * - C10 = C6*C9
 * - E10 = C6*E9
 * - C13 = C5*C6*C4*(1+E4)+C4*E6*(1+E4)
 * - E13 = C6*C7*D7*E7/1000000*I9
 * - G13 = C13+C10+E10+C11+E11+G11+I11+E13
 * - G14 = G13*0.1+E14*0.1+C14*0.1
 * - C15 = G13+C14+E14+G14
 * - E15 = C15/C6
 * - G15 = E15/C5
 */
export function computeChinaImportCalc(i: ChinaImportCalcInputs): ChinaImportCalcComputed {
  const safeQty = Math.max(0, i.qty || 0);

  // Excel 상수: 박스(60*50*40cm) 가정
  const cartonVolumeCm3 = 60 * 50 * 40;
  const productVolumeCm3 = Math.max(0, (i.sizeCm?.w || 0) * (i.sizeCm?.d || 0) * (i.sizeCm?.h || 0));

  // 박스당 적재 가능 개수 = cartonVolume / productVolume (단순 부피기준, Excel 동일)
  const unitsPerCarton = productVolumeCm3 > 0 ? cartonVolumeCm3 / productVolumeCm3 : 0;

  // 박스 수 = 수량 / (박스당 적재 개수)
  const estimatedBoxCount = unitsPerCarton > 0 ? safeQty / unitsPerCarton : 0;

  // E6 중국 내륙 배송비(위안): (박스 수) * 25
  const inlandShippingCny = estimatedBoxCount * 25;

  // C10 / E10
  const inspectionPackTotalKrw = safeQty * (i.inspectionPackPerUnitKrw || 0);
  const barcodeTotalKrw = safeQty * (i.barcodePerUnitKrw || 0);

  // C13 제품 구매 비용(원)
  const feeFactor = 1 + (i.forwardingFeeRate || 0);
  const productPurchaseKrw =
    (i.unitCostCny || 0) * safeQty * (i.fxRateKrwPerCny || 0) * feeFactor +
    (i.fxRateKrwPerCny || 0) * inlandShippingCny * feeFactor;

  // E13 CBM 요금(원): 수량*부피(m^3)*CBM당 요금
  const cbmFeeKrw = (safeQty * productVolumeCm3) / 1_000_000 * (i.cbmRateKrw || 0);

  // G13 통관완료 총 비용(원)
  const customsDoneTotalKrw =
    productPurchaseKrw +
    inspectionPackTotalKrw +
    barcodeTotalKrw +
    (i.customsBrokerKrw || 0) +
    (i.containerWorkKrw || 0) +
    (i.blIssueKrw || 0) +
    (i.ftaIssueKrw || 0) +
    cbmFeeKrw;

  // G14 부가세(원)
  const vatKrw = customsDoneTotalKrw * 0.1 + (i.milkRunKrw || 0) * 0.1 + (i.domesticShippingKrw || 0) * 0.1;

  // C15 전체 비용(원)
  const totalKrw = customsDoneTotalKrw + (i.domesticShippingKrw || 0) + (i.milkRunKrw || 0) + vatKrw;

  // E15 개당 원가(원)
  const unitCostKrw = safeQty > 0 ? totalKrw / safeQty : 0;

  // G15 배수
  const multiple = (i.unitCostCny || 0) > 0 ? unitCostKrw / (i.unitCostCny || 0) : 0;

  return {
    inlandShippingCny,
    inspectionPackTotalKrw,
    barcodeTotalKrw,
    productPurchaseKrw,
    cbmFeeKrw,
    customsDoneTotalKrw,
    vatKrw,
    totalKrw,
    unitCostKrw,
    multiple,
    estimatedBoxCount,
  };
}
