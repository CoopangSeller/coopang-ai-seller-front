import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chinaImportCalcApi } from "@/entities/china-import-calc";
import { useChinaImportCalc } from "@/features/china-import-calc/model/useChinaImportCalc";
import { applyCalcToForm } from "@/features/china-import-calc/lib/applyCalcToForm";
import { toUpsertCommand } from "@/features/china-import-calc/lib/toUpsertCommand";
import { formatNumber } from "@/features/china-import-calc/lib/format";
import { toastStore } from "@/shared/model/toastStore";
import { Modal } from "@/shared/ui";
import { SourcingPickerModal } from "@/features/sourcing-products/picker";
import type { SourcingProductRow } from "@/entities/sourcing-product";

type Props = {
  /** 소싱 ID 없이도 진입 가능. 있으면 원격 저장/조회 활성화 */
  productSourcingId?: string | null;
  /** 불러오기에서 선택한 소싱 ID를 상위(페이지/URL)로 반영하고 싶을 때 */
  onChangeProductSourcingId?: (id: string | null) => void;
  /** 모달 내 사용 등에서 "소싱에서 불러오기" 기능을 숨김 */
  hideSourcingPicker?: boolean;
  /** 모달 내에서 사용 시 닫기 버튼 노출 */
  onClose?: () => void;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-end justify-between gap-2">
        <div className="text-xs font-black text-slate-700">{label}</div>
        {hint ? (
          <div className="text-[11px] font-semibold text-slate-500">{hint}</div>
        ) : null}
      </div>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Input({
  value,
  onChange,
  suffix,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="decimal"
        className={cn(
          "h-11 w-full rounded-2xl border px-4 pr-14 text-sm font-bold",
          "border-rose-200 bg-rose-50 text-slate-900",
          "outline-none focus:border-rose-300",
          "placeholder:text-slate-400",
        )}
      />
      {suffix ? (
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">
          {suffix}
        </div>
      ) : null}
    </div>
  );
}

function ReadonlyValue({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-black text-slate-600">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <div className="text-lg font-black text-slate-900 tabular-nums">
          {value}
        </div>
        {suffix ? (
          <div className="text-xs font-bold text-slate-500">{suffix}</div>
        ) : null}
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-slate-900">{title}</div>
          {description ? (
            <div className="mt-1 text-xs font-semibold text-slate-500">
              {description}
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export const ChinaImportCalcSheet: React.FC<Props> = ({
  productSourcingId,
  onChangeProductSourcingId,
  hideSourcingPicker,
  onClose,
}) => {
  const nav = useNavigate();
  const s = useChinaImportCalc();
  const c = s.computed;

  const enabled = useMemo(
    () => !!productSourcingId && productSourcingId.trim().length > 0,
    [productSourcingId],
  );

  const [remoteLoading, setRemoteLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [calcMissingOpen, setCalcMissingOpen] = useState(false);

  const onLoadById = async (id: string) => {
    setRemoteLoading(true);
    try {
      const res = await chinaImportCalcApi.get(id);
      applyCalcToForm(res.chinaImportCalc, s.setField);
      toastStore.push?.({
        type: "success",
        title: "불러오기 완료",
        message: "저장된 중국 사입 계산서를 불러왔습니다.",
      });
      return true;
    } catch (e: any) {
      if (e?.status === 404 || e?.response?.status === 404) {
        toastStore.push?.({
          type: "info",
          title: "데이터 없음",
          message:
            "저장된 중국 사입 계산기 데이터가 없습니다. 값을 입력 후 저장하세요.",
        });
        setCalcMissingOpen(true);
        return false;
      }
      toastStore.push?.({
        type: "error",
        title: "불러오기 실패",
        message: e?.message ?? "불러오기에 실패했습니다.",
      });
      return false;
    } finally {
      setRemoteLoading(false);
    }
  };

  const onPickSourcing = async (row: SourcingProductRow) => {
    const id = row.serverId ?? row.id;
    onChangeProductSourcingId?.(id);
    setPickerOpen(false);

    // URL 반영(페이지 단독 사용 시)
    if (!onChangeProductSourcingId) {
      nav(`/sourcing/china-calc?productSourcingId=${encodeURIComponent(id)}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    onLoadById(id);
  };

  const onSave = async () => {
    if (!enabled || !productSourcingId) return;
    setRemoteLoading(true);
    try {
      const cmd = toUpsertCommand(s.form, s.computed);
      await chinaImportCalcApi.upsert(productSourcingId, cmd);
      toastStore.push?.({
        type: "success",
        title: "저장 완료",
        message: "중국 사입 계산서를 저장했습니다.",
      });
    } catch (e: any) {
      toastStore.push?.({
        type: "error",
        title: "저장 실패",
        message: e?.message ?? "저장에 실패했습니다.",
      });
    } finally {
      setRemoteLoading(false);
    }
  };

  // ✅ "배대지 및 통관" 값은 자주 바뀌지 않으므로, 초기화는 구매 입력(빨간 입력)만 리셋한다.
  const onResetInputsOnly = () => {
    // useChinaImportCalc의 DEFAULTS 기반 reset은 전체를 리셋하지만,
    // 요구사항은 "배대지/통관 정보"가 유지되어도 된다는 것이므로
    // 여기서는 구매+상품 입력만 기본값으로 되돌린다.
    // (세부 기본값은 hook DEFAULTS와 동일)
    s.setField("unitCostCny", "5.65");
    s.setField("qty", "20");
    s.setField("sizeW", "22");
    s.setField("sizeD", "8");
    s.setField("sizeH", "14");
    s.setField("domesticShippingKrw", "");
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xl font-black text-slate-900">
            중국 사입 원가 계산기
          </div>
          <div className="mt-1 text-sm font-medium text-slate-600">
            빨간 입력값만 수정하면 나머지는 자동 계산됩니다.
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-500">
            {enabled ? (
              <>
                연결된 소싱 ID:{" "}
                <span className="font-mono">{productSourcingId}</span>
              </>
            ) : (
              <>
                소싱 ID 없이도 계산은 가능합니다. 저장/불러오기는 소싱 선택 후
                활성화됩니다.
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!hideSourcingPicker ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"
            >
              불러오기
            </button>
          ) : null}

          <button
            type="button"
            onClick={onSave}
            disabled={!enabled || remoteLoading}
            className="h-10 rounded-2xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {remoteLoading ? "저장중..." : "저장"}
          </button>

          <button
            type="button"
            onClick={onResetInputsOnly}
            className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"
          >
            초기화
          </button>

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"
            >
              닫기
            </button>
          ) : null}
        </div>
      </div>

      {/* 상단 요약 */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <ReadonlyValue
          label="예상 박스 수"
          value={formatNumber(c.estimatedBoxCount)}
          suffix="box"
        />
        <ReadonlyValue
          label="전체 비용"
          value={formatNumber(c.totalKrw)}
          suffix="원"
        />
        <ReadonlyValue
          label="개당 원가"
          value={formatNumber(c.unitCostKrw)}
          suffix="원"
        />
        <ReadonlyValue label="배수" value={formatNumber(c.multiple)} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="구매 정보 입력" description="필수 입력 영역(빨간색)">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="환율(원/위안)">
              <Input
                value={s.form.fxRateKrwPerCny}
                onChange={(v) => s.setField("fxRateKrwPerCny", v)}
              />
            </Field>
            <Field label="배대지 수수료" hint="%">
              <Input
                value={s.form.forwardingFeeRatePercent}
                onChange={(v) => s.setField("forwardingFeeRatePercent", v)}
                suffix="%"
              />
            </Field>
            <Field label="원가(위안)">
              <Input
                value={s.form.unitCostCny}
                onChange={(v) => s.setField("unitCostCny", v)}
              />
            </Field>
            <Field label="수량">
              <Input
                value={s.form.qty}
                onChange={(v) => s.setField("qty", v)}
              />
            </Field>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-black text-slate-700">
              제품 크기(cm)
            </div>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <Field label="가로">
                <Input
                  value={s.form.sizeW}
                  onChange={(v) => s.setField("sizeW", v)}
                />
              </Field>
              <Field label="세로">
                <Input
                  value={s.form.sizeD}
                  onChange={(v) => s.setField("sizeD", v)}
                />
              </Field>
              <Field label="높이">
                <Input
                  value={s.form.sizeH}
                  onChange={(v) => s.setField("sizeH", v)}
                />
              </Field>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-slate-500">
              크기 기준으로 박스 수/내륙 배송비(위안)가 계산됩니다.
            </div>
          </div>
        </Section>

        <Section
          title="배대지 및 통관 정보"
          description="자주 바뀌지 않는 값(초기화해도 유지되는 것을 권장)"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="검수/포장(제품당)" hint="원">
              <Input
                value={s.form.inspectionPackPerUnitKrw}
                onChange={(v) => s.setField("inspectionPackPerUnitKrw", v)}
                suffix="원"
              />
            </Field>
            <Field label="바코드 부착(제품당)" hint="원">
              <Input
                value={s.form.barcodePerUnitKrw}
                onChange={(v) => s.setField("barcodePerUnitKrw", v)}
                suffix="원"
              />
            </Field>

            <Field label="박스/팔레트 총비용" hint="원">
              <Input
                value={s.form.boxPalletTotalKrw}
                onChange={(v) => s.setField("boxPalletTotalKrw", v)}
                suffix="원"
              />
            </Field>
            <Field label="CBM당 요금" hint="원">
              <Input
                value={s.form.cbmRateKrw}
                onChange={(v) => s.setField("cbmRateKrw", v)}
                suffix="원"
              />
            </Field>

            <Field label="통관 수수료" hint="원">
              <Input
                value={s.form.customsBrokerKrw}
                onChange={(v) => s.setField("customsBrokerKrw", v)}
                suffix="원"
              />
            </Field>
            <Field label="컨테이너 작업비" hint="원">
              <Input
                value={s.form.containerWorkKrw}
                onChange={(v) => s.setField("containerWorkKrw", v)}
                suffix="원"
              />
            </Field>

            <Field label="BL 발생비" hint="원">
              <Input
                value={s.form.blIssueKrw}
                onChange={(v) => s.setField("blIssueKrw", v)}
                suffix="원"
              />
            </Field>
            <Field label="원산지증명서(FTA)" hint="원">
              <Input
                value={s.form.ftaIssueKrw}
                onChange={(v) => s.setField("ftaIssueKrw", v)}
                suffix="원"
              />
            </Field>
          </div>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="통관 후 정보" description="필요한 경우에만 입력">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="국내 운임" hint="원">
              <Input
                value={s.form.domesticShippingKrw}
                onChange={(v) => s.setField("domesticShippingKrw", v)}
                suffix="원"
                placeholder="필요 시 입력"
              />
            </Field>
            <Field label="밀크런" hint="원">
              <Input
                value={s.form.milkRunKrw}
                onChange={(v) => s.setField("milkRunKrw", v)}
                suffix="원"
              />
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ReadonlyValue
              label="중국 내륙 배송비"
              value={formatNumber(c.inlandShippingCny)}
              suffix="위안"
            />
            <ReadonlyValue
              label="통관완료 총비용"
              value={formatNumber(c.customsDoneTotalKrw)}
              suffix="원"
            />
            <ReadonlyValue
              label="부가세"
              value={formatNumber(c.vatKrw)}
              suffix="원"
            />
            <ReadonlyValue
              label="CBM 요금"
              value={formatNumber(c.cbmFeeKrw)}
              suffix="원"
            />
          </div>
        </Section>

        <Section
          title="검수/바코드 비용 요약"
          description="수량 기준 자동 계산"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ReadonlyValue
              label="검수/포장 총비용"
              value={formatNumber(c.inspectionPackTotalKrw)}
              suffix="원"
            />
            <ReadonlyValue
              label="바코드 부착 총비용"
              value={formatNumber(c.barcodeTotalKrw)}
              suffix="원"
            />
            <ReadonlyValue
              label="제품 구매 비용"
              value={formatNumber(c.productPurchaseKrw)}
              suffix="원"
            />
            <ReadonlyValue label="내륙/수수료 포함" value="자동" />
          </div>
        </Section>
      </div>

      {/* 불러오기: 소싱 선택 모달 */}
      <SourcingPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={onPickSourcing}
      />

      {/* 데이터 없음 안내(가벼운 모달) */}
      <Modal
        open={calcMissingOpen}
        onClose={() => setCalcMissingOpen(false)}
        title="중국 사입 계산 데이터가 없습니다"
        description="이 소싱 항목에 저장된 계산기 데이터가 없습니다. 값을 입력 후 저장하면 다음부터 자동으로 불러옵니다."
        widthClassName="max-w-[760px]"
      >
        <div className="flex justify-end">
          <button
            type="button"
            className="h-10 rounded-2xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
            onClick={() => setCalcMissingOpen(false)}
          >
            확인
          </button>
        </div>
      </Modal>
    </div>
  );
};
