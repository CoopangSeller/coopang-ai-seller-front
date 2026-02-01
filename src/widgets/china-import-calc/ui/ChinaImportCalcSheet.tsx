import React from "react";
import { useChinaImportCalc } from "@/features/china-import-calc/model/useChinaImportCalc";
import {
  formatDecimal,
  formatNumber,
} from "@/features/china-import-calc/lib/format";

type CellProps = {
  className?: string;
  /** Allow empty cells (e.g. spacing cells) */
  children?: React.ReactNode;
  colSpan?: number;
};
const Th: React.FC<CellProps> = ({ className = "", children, colSpan }) => (
  <th
    colSpan={colSpan}
    className={`border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 ${className}`}
  >
    {children ?? null}
  </th>
);

const Td: React.FC<CellProps> = ({ className = "", children, colSpan }) => (
  <td
    colSpan={colSpan}
    className={`border border-slate-300 px-3 py-2 text-sm ${className}`}
  >
    {children ?? null}
  </td>
);

type InputCellProps = {
  value: string;
  onChange: (v: string) => void;
  align?: "left" | "right" | "center";
  suffix?: string;
  placeholder?: string;
};
const InputCell: React.FC<InputCellProps> = ({
  value,
  onChange,
  align = "right",
  suffix,
  placeholder,
}) => {
  const alignCls =
    align === "left"
      ? "text-left"
      : align === "center"
        ? "text-center"
        : "text-right";
  return (
    <div className={`flex items-center gap-2 ${alignCls}`}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-transparent outline-none ${alignCls} font-semibold text-slate-900 placeholder:text-slate-400`}
        inputMode="decimal"
      />
      {suffix ? (
        <span className="shrink-0 text-xs font-semibold text-slate-600">
          {suffix}
        </span>
      ) : null}
    </div>
  );
};

const Output: React.FC<{
  value: string;
  align?: "left" | "right" | "center";
}> = ({ value, align = "right" }) => {
  const alignCls =
    align === "left"
      ? "text-left"
      : align === "center"
        ? "text-center"
        : "text-right";
  return (
    <div className={`${alignCls} font-semibold text-slate-900 tabular-nums`}>
      {value}
    </div>
  );
};

export const ChinaImportCalcSheet: React.FC = () => {
  const s = useChinaImportCalc();

  const c = s.computed;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-black text-slate-900">
            중국 사입 원가 계산기
          </div>
          <div className="mt-1 text-sm font-medium text-slate-600">
            * 빨간색(입력) 항목만 수정하면 나머지는 Excel 수식과 동일하게 자동
            계산됩니다.
          </div>
        </div>

        <button
          onClick={s.reset}
          className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          초기화
        </button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[980px] border-collapse">
          <colgroup>
            <col style={{ width: "28%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>

          {/* 구매 정보 입력 */}
          <thead>
            <tr>
              <Th
                colSpan={6}
                className="bg-slate-50 text-center text-base font-black"
              >
                구매 정보 입력
              </Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td className="bg-emerald-50 font-semibold text-slate-800">
                구매대행 환율 (배대지 환율)
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.fxRateKrwPerCny}
                  onChange={(v) => s.setField("fxRateKrwPerCny", v)}
                />
              </Td>

              <Td className="bg-emerald-50 font-semibold text-slate-800">
                배대지 수수료 (%)
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.forwardingFeeRatePercent}
                  onChange={(v) => s.setField("forwardingFeeRatePercent", v)}
                  suffix="%"
                />
              </Td>

              <Td colSpan={2} className="bg-white" />
            </tr>

            <tr>
              <Td className="bg-emerald-50 font-semibold text-slate-800">
                원가 (위안)
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.unitCostCny}
                  onChange={(v) => s.setField("unitCostCny", v)}
                />
              </Td>

              <Td colSpan={4} className="bg-white" />
            </tr>

            <tr>
              <Td className="bg-emerald-50 font-semibold text-slate-800">
                수량
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.qty}
                  onChange={(v) => s.setField("qty", v)}
                />
              </Td>

              <Td className="bg-emerald-50 font-semibold text-slate-800">
                중국 내륙 배송비 (위안) (보수적으로 1 박스당 25위안)
              </Td>
              <Td className="bg-emerald-50">
                <Output value={formatDecimal(c.inlandShippingCny, 8)} />
              </Td>

              <Td className="bg-emerald-50 font-semibold text-slate-800">
                예상 박스 수
              </Td>
              <Td className="bg-emerald-50">
                <Output value={formatDecimal(c.estimatedBoxCount, 4)} />
              </Td>
            </tr>

            <tr>
              <Td className="bg-emerald-50 font-semibold text-slate-800">
                제품 당 가로 세로 높이 (cm)
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.sizeW}
                  onChange={(v) => s.setField("sizeW", v)}
                />
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.sizeD}
                  onChange={(v) => s.setField("sizeD", v)}
                />
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.sizeH}
                  onChange={(v) => s.setField("sizeH", v)}
                />
              </Td>
              <Td colSpan={2} className="bg-white" />
            </tr>
          </tbody>

          {/* 배대지 및 통관 정보 입력 */}
          <thead>
            <tr>
              <Th
                colSpan={6}
                className="bg-slate-50 text-center text-base font-black"
              >
                배대지 및 통관 정보 입력
              </Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td className="bg-emerald-50 font-semibold text-slate-800">
                제품당 검수 및 포장 비용
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.inspectionPackPerUnitKrw}
                  onChange={(v) => s.setField("inspectionPackPerUnitKrw", v)}
                />
              </Td>

              <Td className="bg-emerald-50 font-semibold text-slate-800">
                제품당 바코드 부착 비용
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.barcodePerUnitKrw}
                  onChange={(v) => s.setField("barcodePerUnitKrw", v)}
                />
              </Td>

              <Td className="bg-emerald-50 font-semibold text-slate-800">
                박스 및 팔레트 총 비용
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.boxPalletTotalKrw}
                  onChange={(v) => s.setField("boxPalletTotalKrw", v)}
                />
              </Td>
            </tr>

            <tr>
              <Td className="bg-emerald-50 font-semibold text-slate-800">
                전체 제품 검수 및 포장 비용
              </Td>
              <Td className="bg-emerald-50">
                <Output value={formatNumber(c.inspectionPackTotalKrw)} />
              </Td>

              <Td className="bg-emerald-50 font-semibold text-slate-800">
                전체 제품 바코드 부착 비용
              </Td>
              <Td className="bg-emerald-50">
                <Output value={formatNumber(c.barcodeTotalKrw)} />
              </Td>

              <Td className="bg-emerald-50 font-semibold text-slate-800">
                CBM당 요금
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.cbmRateKrw}
                  onChange={(v) => s.setField("cbmRateKrw", v)}
                />
              </Td>
            </tr>

            <tr>
              <Td className="bg-emerald-50 font-semibold text-slate-800">
                사업자 통관 수수료 (세관비용)
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.customsBrokerKrw}
                  onChange={(v) => s.setField("customsBrokerKrw", v)}
                />
              </Td>

              <Td className="bg-emerald-50 font-semibold text-slate-800">
                컨테이너 작업비
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.containerWorkKrw}
                  onChange={(v) => s.setField("containerWorkKrw", v)}
                />
              </Td>

              <Td className="bg-emerald-50 font-semibold text-slate-800">
                BL 발생비
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.blIssueKrw}
                  onChange={(v) => s.setField("blIssueKrw", v)}
                />
              </Td>
            </tr>

            <tr>
              <Td className="bg-emerald-50 font-semibold text-slate-800">
                원산지증명서(FTA) 발행
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.ftaIssueKrw}
                  onChange={(v) => s.setField("ftaIssueKrw", v)}
                />
              </Td>

              <Td colSpan={4} className="bg-white" />
            </tr>
          </tbody>

          {/* 통관 후 정보 입력 */}
          <thead>
            <tr>
              <Th
                colSpan={6}
                className="bg-slate-50 text-center text-base font-black"
              >
                통관 후 정보 입력
              </Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td className="bg-emerald-50 font-semibold text-slate-800">
                제품 구매 비용
              </Td>
              <Td className="bg-emerald-50">
                <Output value={formatDecimal(c.productPurchaseKrw, 4)} />
              </Td>

              <Td className="bg-emerald-50 font-semibold text-slate-800">
                CBM 요금
              </Td>
              <Td className="bg-emerald-50">
                <Output value={formatDecimal(c.cbmFeeKrw, 1)} />
              </Td>

              <Td className="bg-emerald-50 font-semibold text-slate-800">
                통관완료 총 비용
              </Td>
              <Td className="bg-emerald-50">
                <Output value={formatDecimal(c.customsDoneTotalKrw, 3)} />
              </Td>
            </tr>

            <tr>
              <Td className="bg-emerald-50 font-semibold text-slate-800">
                국내 배송비용 (보수적으로 박스×5000원)
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.domesticShippingKrw}
                  onChange={(v) => s.setField("domesticShippingKrw", v)}
                  placeholder={formatNumber(
                    Math.round(c.estimatedBoxCount) * 5000,
                  )}
                />
              </Td>

              <Td className="bg-emerald-50 font-semibold text-slate-800">
                밀크런 비용
              </Td>
              <Td className="bg-rose-50">
                <InputCell
                  value={s.form.milkRunKrw}
                  onChange={(v) => s.setField("milkRunKrw", v)}
                />
              </Td>

              <Td className="bg-emerald-50 font-semibold text-slate-800">
                부가세
              </Td>
              <Td className="bg-emerald-50">
                <Output value={formatNumber(Math.round(c.vatKrw))} />
              </Td>
            </tr>

            <tr>
              <Td className="bg-yellow-200 font-black text-slate-900">
                전체 비용
              </Td>
              <Td className="bg-yellow-200">
                <Output value={formatNumber(Math.round(c.totalKrw))} />
              </Td>

              <Td className="bg-yellow-200 font-black text-slate-900">
                개당 원가
              </Td>
              <Td className="bg-yellow-200">
                <Output value={formatNumber(Math.round(c.unitCostKrw))} />
              </Td>

              <Td className="bg-yellow-200 font-black text-slate-900">배수</Td>
              <Td className="bg-yellow-200">
                <Output
                  value={formatNumber(c.multiple, { maximumFractionDigits: 2 })}
                />
              </Td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs font-medium text-slate-500">
        * 단위: 환율/위안/원 단위를 혼용합니다. 입력값은 원본 엑셀과 동일한
        의미로 계산됩니다.
      </div>
    </div>
  );
};
