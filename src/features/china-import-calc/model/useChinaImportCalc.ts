import { useMemo, useState } from "react";
import { ChinaImportCalcInputs } from "@/entities/china-import-calc/";
import { computeChinaImportCalc } from "./calc";
import { clamp, parseNumber } from "../lib/format";

type FieldKey =
  | "fxRateKrwPerCny"
  | "forwardingFeeRatePercent"
  | "unitCostCny"
  | "qty"
  | "sizeW"
  | "sizeD"
  | "sizeH"
  | "inspectionPackPerUnitKrw"
  | "barcodePerUnitKrw"
  | "boxPalletTotalKrw"
  | "cbmRateKrw"
  | "customsBrokerKrw"
  | "containerWorkKrw"
  | "blIssueKrw"
  | "ftaIssueKrw"
  | "domesticShippingKrw"
  | "milkRunKrw";

export type ChinaImportCalcFormState = Record<FieldKey, string>;

const DEFAULTS: ChinaImportCalcFormState = {
  fxRateKrwPerCny: "210.9",
  forwardingFeeRatePercent: "3",
  unitCostCny: "5.65",
  qty: "20",
  sizeW: "22",
  sizeD: "8",
  sizeH: "14",
  inspectionPackPerUnitKrw: "200",
  barcodePerUnitKrw: "100",
  boxPalletTotalKrw: "0",
  cbmRateKrw: "80000",
  customsBrokerKrw: "30000",
  containerWorkKrw: "30000",
  blIssueKrw: "30000",
  ftaIssueKrw: "30000",
  domesticShippingKrw: "",
  milkRunKrw: "100000",
};

export function useChinaImportCalc() {
  const [form, setForm] = useState<ChinaImportCalcFormState>(DEFAULTS);

  const inputs: ChinaImportCalcInputs = useMemo(() => {
    const fxRateKrwPerCny = parseNumber(form.fxRateKrwPerCny);
    const forwardingFeeRate = clamp(parseNumber(form.forwardingFeeRatePercent) / 100, 0, 1);
    const unitCostCny = parseNumber(form.unitCostCny);
    const qty = Math.max(0, Math.floor(parseNumber(form.qty)));

    const sizeW = parseNumber(form.sizeW);
    const sizeD = parseNumber(form.sizeD);
    const sizeH = parseNumber(form.sizeH);

    return {
      fxRateKrwPerCny,
      forwardingFeeRate,
      unitCostCny,
      qty,
      sizeCm: { w: sizeW, d: sizeD, h: sizeH },

      inspectionPackPerUnitKrw: parseNumber(form.inspectionPackPerUnitKrw),
      barcodePerUnitKrw: parseNumber(form.barcodePerUnitKrw),
      boxPalletTotalKrw: parseNumber(form.boxPalletTotalKrw),
      cbmRateKrw: parseNumber(form.cbmRateKrw),

      customsBrokerKrw: parseNumber(form.customsBrokerKrw),
      containerWorkKrw: parseNumber(form.containerWorkKrw),
      blIssueKrw: parseNumber(form.blIssueKrw),
      ftaIssueKrw: parseNumber(form.ftaIssueKrw),

      domesticShippingKrw: parseNumber(form.domesticShippingKrw),
      milkRunKrw: parseNumber(form.milkRunKrw),
    };
  }, [form]);

  const computed = useMemo(() => computeChinaImportCalc(inputs), [inputs]);

  const setField = (key: FieldKey, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const reset = () => setForm(DEFAULTS);

  return { form, inputs, computed, setField, reset };
}
