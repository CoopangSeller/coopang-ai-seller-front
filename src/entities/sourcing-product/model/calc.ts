import { SourcingProductRow } from "./types";

export function calcDerived(row: SourcingProductRow) {
  const sale = row.salePriceKrw ?? 0;
  const cost = row.costKrw ?? 0;
  const ship = row.shippingKrw ?? 0;
  const feeRate = row.feeRate ?? 0; // 0.108 형태
  const feeAmount = sale * feeRate;

  // 엑셀: (sale/1.1*0.1) - ((fee/1.1*0.1) + (ship/1.1*0.1) + (cost/1.1*0.1))
  const vat = (sale / 1.1 * 0.1) - ((feeAmount / 1.1 * 0.1) + (ship / 1.1 * 0.1) + (cost / 1.1 * 0.1));

  const grossMargin = sale - cost - ship - feeAmount - vat;
  const grossMarginRate = sale > 0 ? grossMargin / sale : 0;
  const minAdRoi = grossMarginRate > 0 ? 1 / grossMarginRate : 0;

  return { feeAmount, vat, grossMargin, grossMarginRate, minAdRoi };
}
