import { SourcingProductRow } from "./types";

type Num = number | null;

export function calcDerived(row: SourcingProductRow) {
  const sale: Num = row.salePriceKrw ?? null;
  const cost: Num = row.costKrw ?? null;
  const ship: Num = row.shippingKrw ?? null;
  const feeRate: Num = row.feeRate ?? null; // 0.108 형태

  const feeAmount: Num =
    sale == null || feeRate == null ? null : sale * feeRate;

  // 엑셀: (sale/1.1*0.1) - ((fee/1.1*0.1) + (ship/1.1*0.1) + (cost/1.1*0.1))
  const vat: Num =
    sale == null || feeAmount == null || ship == null || cost == null
      ? null
      : sale / 1.1 * 0.1 -
        (feeAmount / 1.1 * 0.1 + ship / 1.1 * 0.1 + cost / 1.1 * 0.1);

  const grossMargin: Num =
    sale == null ||
    cost == null ||
    ship == null ||
    feeAmount == null ||
    vat == null
      ? null
      : sale - cost - ship - feeAmount - vat;

  const grossMarginRate: Num =
    grossMargin == null || sale == null || sale <= 0 ? null : grossMargin / sale;

  // 최소 광고 수익률(=최소 ROAS) : 1 / 마진율 (마진율>0일 때만)
  const minAdRoi: Num =
    grossMarginRate == null || grossMarginRate <= 0 ? null : 1 / grossMarginRate;

  return { feeAmount, vat, grossMargin, grossMarginRate, minAdRoi };
}
