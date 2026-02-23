import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  calcDerived,
  type SourcingProductRow,
  formatRoiPercent,
} from "@/entities/sourcing-product";
import { CategorySelect } from "./GridInputs";
import { toastStore } from "@/shared/model/toastStore";

type ImportCalcSummary = {
  qty: number;
  totalKrw: number;
  unitCostKrw: number;
  multiple: number;
} | null;

type Props = {
  row: SourcingProductRow | null;
  fxRateKrwPerCny: number;
  updateCell: (id: string, patch: Partial<SourcingProductRow>) => void;
  onSave: () => void;
  saving?: boolean;

  onPlan: (row: SourcingProductRow) => void;
  onCheckChinaCalc: (row: SourcingProductRow) => void;
  onReservePlan: (row: SourcingProductRow) => void;
  chinaCalcSummary?: ImportCalcSummary;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-black text-slate-600">{children}</div>;
}

function Thumb({ url }: { url?: string }) {
  const src = (url ?? "").trim();
  if (!src) {
    return (
      <div className="h-16 w-16 rounded-2xl border border-slate-200 bg-slate-100" />
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="h-16 w-16 rounded-2xl border border-slate-200 bg-white object-cover"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

function formatNumber(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return "-";
  return Math.round(v).toLocaleString();
}

function safeMoney(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v.toLocaleString() : "-";
}

function toNumString(v: unknown) {
  if (v == null) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  if (typeof v === "string") return v; // ✅ BigDecimal 문자열 그대로 표시
  return "";
}

function parseNumberOrUndef(raw: string) {
  if (raw.trim() === "") return undefined;

  const normalized = raw.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4",
        "text-sm font-semibold text-slate-900 outline-none",
        "focus:border-slate-400",
      )}
    />
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  step = "1",
}: {
  value: number | null | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      value={toNumString(value)}
      placeholder={placeholder}
      onChange={(e) => onChange(parseNumberOrUndef(e.target.value))}
      className={cn(
        "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4",
        "text-sm font-semibold text-slate-900 outline-none",
        "focus:border-slate-400",
      )}
    />
  );
}

export const RowDetailPanel: React.FC<Props> = ({
  row,
  fxRateKrwPerCny,
  updateCell,
  onSave,
  saving,
  onPlan,
  onCheckChinaCalc,
  onReservePlan,
  chinaCalcSummary,
}) => {
  const derived = useMemo(() => (row ? calcDerived(row) : null), [row]);

  const patch = (p: Partial<SourcingProductRow>) => {
    if (!row) return;
    updateCell(row.id, p);
  };

  const setField = <K extends keyof SourcingProductRow>(
    key: K,
    value: SourcingProductRow[K],
  ) => patch({ [key]: value } as Partial<SourcingProductRow>);

  // ✅ 위안 입력/환율 변경 시 원가(원) 자동 동기화
  useEffect(() => {
    if (!row) return;
    if (row.costCny == null) return;
    if (!Number.isFinite(row.costCny)) return;

    const nextKrw = Math.round(row.costCny * fxRateKrwPerCny);
    if (row.costKrw === nextKrw) return;
    updateCell(row.id, { costKrw: nextKrw });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.id, row?.costCny, fxRateKrwPerCny]);

  // ✅ 트렌디 팝오버 (outside click / ESC / animation / caret)
  const [planMenuOpen, setPlanMenuOpen] = useState(false);
  const planBtnRef = useRef<HTMLButtonElement | null>(null);
  const planMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!planMenuOpen) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (planBtnRef.current?.contains(t)) return;
      if (planMenuRef.current?.contains(t)) return;
      setPlanMenuOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlanMenuOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [planMenuOpen]);

  if (!row) {
    return (
      <div className="h-full rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-sm font-black text-slate-900">소싱 상세</div>
        <div className="mt-2 text-sm font-semibold text-slate-500">
          왼쪽 목록에서 행을 선택하면 상세 편집이 여기에 표시됩니다.
        </div>
      </div>
    );
  }

  const sale = row.salePriceKrw ?? null;
  const gm = derived?.grossMargin ?? null;
  const gmRate = derived?.grossMarginRate ?? null;
  const minRoi = derived?.minAdRoi ?? null;

  function KpiCard({
    label,
    value,
    suffix,
  }: {
    label: string;
    value: string;
    suffix?: string;
  }) {
    const full = suffix ? `${value}${suffix}` : value;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="text-[11px] font-black text-slate-600">{label}</div>

        {/* 값은 한 줄 고정 + 줄임표 + hover로 전체값 */}
        <div
          className="mt-1 text-lg font-black text-slate-900 tabular-nums overflow-hidden text-ellipsis whitespace-nowrap"
          title={full}
        >
          {value}
        </div>

        {/* 단위는 아래로 내려서 가로폭 확보 */}
        {suffix ? (
          <div className="mt-0.5 text-[11px] font-extrabold text-slate-500">
            {suffix}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto rounded-3xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-base font-black text-slate-900">
                소싱 상세
              </div>
              {row.op === "create" ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700">
                  신규
                </span>
              ) : null}
              {row.op === "update" ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700">
                  수정됨
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-500">
              위안 입력 시 원가(원)은 환율({fxRateKrwPerCny})로 자동 반영됩니다.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onCheckChinaCalc(row)}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 hover:bg-slate-50"
            >
              중국사입계산 확인
            </button>

            {/* ✅ Planning popover */}
            <div className="relative">
              <button
                ref={planBtnRef}
                type="button"
                onClick={() => setPlanMenuOpen((v) => !v)}
                className={cn(
                  "h-10 rounded-2xl px-4 text-sm font-black transition",
                  "border border-slate-200 bg-white text-slate-900 shadow-sm",
                  "hover:-translate-y-[1px] hover:shadow-md active:translate-y-0",
                  "focus:outline-none focus:ring-2 focus:ring-slate-300",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  기획
                  <svg
                    className={cn(
                      "h-4 w-4 transition",
                      planMenuOpen ? "rotate-180" : "rotate-0",
                    )}
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>

              {planMenuOpen ? (
                <div
                  ref={planMenuRef}
                  className={cn(
                    "absolute right-0 z-50 mt-2 w-56 origin-top-right",
                    "animate-[popoverIn_120ms_ease-out]",
                  )}
                >
                  {/* caret */}
                  <div className="absolute right-6 top-[-6px] h-3 w-3 rotate-45 border border-slate-200 bg-white shadow-sm" />

                  <div
                    className={cn(
                      "overflow-hidden rounded-2xl border border-slate-200 bg-white",
                      "shadow-[0_18px_50px_-18px_rgba(15,23,42,0.45)]",
                      "backdrop-blur supports-[backdrop-filter]:bg-white/90",
                    )}
                  >
                    <div className="px-3 py-2 text-[11px] font-extrabold tracking-wide text-slate-500">
                      기획 메뉴
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPlanMenuOpen(false);
                        onPlan(row);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2.5 text-left",
                        "text-sm font-bold text-slate-900 transition",
                        "hover:bg-slate-50 active:bg-slate-100",
                      )}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M4 20h4l10-10a2 2 0 0 0 0-3l-1-1a2 2 0 0 0-3 0L4 16v4Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M13 7l4 4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <div className="flex flex-col">
                        <span>기획하기</span>
                        <span className="text-xs font-medium text-slate-500">
                          상세페이지 기획으로 이동
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const hasImage = !!(row.imageUrl ?? "").trim();
                        const hasName = !!(row.productName ?? "").trim();
                        const hasKeyword = !!(row.keyword ?? "").trim();
                        if (!hasImage || !hasName || !hasKeyword) {
                          toastStore.push({
                            type: "info",
                            title: "필수 정보 필요",
                            message:
                              "기획 예약을 위해 이미지/상품명/키워드가 필요합니다. 값을 입력해주세요.",
                          });
                          return;
                        }
                        setPlanMenuOpen(false);
                        onReservePlan(row);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2.5 text-left",
                        "text-sm font-bold text-slate-900 transition",
                        "hover:bg-slate-50 active:bg-slate-100",
                      )}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M6 7h12a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a2 2 0 0 1 2-2Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8 12h8M8 16h6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <div className="flex flex-col">
                        <span>기획 예약</span>
                        <span className="text-xs font-medium text-slate-500">
                          배치/AI 연동 (추후)
                        </span>
                      </div>
                    </button>

                    <div className="px-3 py-2">
                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        이미지·상품명·키워드가 있어야 예약이 가능합니다.
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-5">
            <div className="text-xs font-black text-blue-700">판매가</div>
            <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
              {formatNumber(sale)}원
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-500">
              부가세/수수료 포함
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-5">
            <div className="text-xs font-black text-emerald-700">마진</div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {formatNumber(gm)}원
              </div>
              <div className="text-xs font-black text-slate-600 tabular-nums">
                {gmRate == null ? "-" : `${Math.round(gmRate * 100)}%`}
              </div>
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-500">
              최소 ROI {formatRoiPercent(minRoi)}
            </div>
          </div>
        </div>

        {/* China import calc summary */}
        {/* China import calc summary */}
        <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-black text-slate-700">
            중국 사입 계산 요약
          </div>

          {chinaCalcSummary ? (
            <div className="mt-2 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
              <KpiCard
                label="수량"
                value={formatNumber(chinaCalcSummary.qty)}
              />
              <KpiCard
                label="전체 비용"
                value={formatNumber(chinaCalcSummary.totalKrw)}
                suffix="원"
              />
              <KpiCard
                label="개당 원가"
                value={formatNumber(chinaCalcSummary.unitCostKrw)}
                suffix="원"
              />
              <KpiCard
                label="배수"
                value={
                  Number.isFinite(chinaCalcSummary.multiple)
                    ? chinaCalcSummary.multiple.toFixed(2)
                    : "-"
                }
              />
            </div>
          ) : (
            <div className="mt-2 text-sm font-semibold text-slate-500">
              아직 불러온 데이터가 없습니다. "중국사입계산 확인"을 눌러
              확인하세요.
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-slate-200 pt-5">
          <div className="text-sm font-black text-slate-900">기본 정보</div>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <Thumb url={row.imageUrl} />
              </div>
              <div className="flex-1">
                <Label>이미지 URL</Label>
                <TextInput
                  value={row.imageUrl ?? ""}
                  onChange={(v) => setField("imageUrl", v)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label>키워드</Label>
                <TextInput
                  value={row.keyword ?? ""}
                  onChange={(v) => setField("keyword", v)}
                  placeholder="예: 대용량 필통"
                />
              </div>
              <div>
                <Label>도매처</Label>
                <TextInput
                  value={row.vendor ?? ""}
                  onChange={(v) => setField("vendor", v)}
                  placeholder="예: 1688"
                />
              </div>
            </div>

            <div>
              <Label>상품명</Label>
              <TextInput
                value={row.productName ?? ""}
                onChange={(v) => setField("productName", v)}
                placeholder="예: 포켓형 대용량 코듀로이 필통"
              />
            </div>

            <div>
              <Label>쿠팡 카테고리</Label>
              <div className="mt-1">
                <CategorySelect
                  value={row.coupangCategory ?? ""}
                  onSelect={(name, feePercent) => {
                    updateCell(row.id, {
                      coupangCategory: name,
                      ...(feePercent != null
                        ? { feeRate: feePercent / 100 }
                        : {}),
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-5">
          <div className="text-sm font-black text-slate-900">가격/비용</div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label>원가(위안)</Label>
              <NumberInput
                value={row.costCny}
                step="0.01"
                onChange={(v) => {
                  // 빈값 -> undefined (NaN 방지)
                  if (v == null) {
                    updateCell(row.id, {
                      costCny: undefined,
                      costKrw: undefined,
                    });
                    return;
                  }
                  const krw = Math.round(v * fxRateKrwPerCny);
                  updateCell(row.id, { costCny: v, costKrw: krw });
                }}
              />
            </div>

            <div>
              <Label>원가(원)</Label>
              <NumberInput
                value={row.costKrw}
                step="1"
                onChange={(v) => updateCell(row.id, { costKrw: v })}
              />
            </div>

            <div>
              <Label>운임(원)</Label>
              <NumberInput
                value={row.shippingKrw}
                step="1"
                onChange={(v) => updateCell(row.id, { shippingKrw: v })}
              />
            </div>

            <div>
              <Label>판매가(원)</Label>
              <NumberInput
                value={row.salePriceKrw}
                step="1"
                onChange={(v) => updateCell(row.id, { salePriceKrw: v })}
              />
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
            원가(원):{" "}
            <span className="font-black text-slate-900">
              {safeMoney(row.costKrw)}
            </span>{" "}
            · 운임(원):{" "}
            <span className="font-black text-slate-900">
              {safeMoney(row.shippingKrw)}
            </span>{" "}
            · 수수료율:{" "}
            <span className="font-black text-slate-900">
              {row.feeRate == null
                ? "-"
                : `${Math.round(row.feeRate * 1000) / 10}%`}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Bottom Action Bar */}
      <div className="sticky bottom-0 mt-6 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3">
        <button
          type="button"
          onClick={onSave}
          disabled={!row || saving}
          className={cn(
            "h-11 w-full rounded-2xl text-sm font-extrabold transition",
            "bg-blue-600 text-white shadow-sm",
            "hover:bg-blue-700 active:scale-[0.99]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
};
