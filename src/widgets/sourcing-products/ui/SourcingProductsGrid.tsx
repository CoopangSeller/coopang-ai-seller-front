import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SourcingProductRow } from "@/entities/sourcing-product";
import { chinaImportCalcApi } from "@/entities/china-import-calc";
import {
  isServerRow,
  markDeleted,
  markEdited,
} from "@/features/sourcing-products/edit-row";
import { ExcelButtons } from "@/features/sourcing-products/excel-io";
import { IconButton } from "@/shared/ui/icon/IconButton";
import { Modal } from "@/shared/ui";
import { ROUTES } from "@/shared/config/routerPaths";
import { toastStore } from "@/shared/model/toastStore";
import { ChinaImportCalcSheet } from "@/widgets/china-import-calc";
import { SourcingProductsTable } from "./components/SourcingProductsTable";
import { RowDetailPanel } from "./components/RowDetailPanel";

function clampFxRate(v?: number) {
  if (v == null || Number.isNaN(v)) return undefined;
  if (!Number.isFinite(v)) return undefined;
  if (v <= 0) return undefined;
  if (v > 10_000) return 10_000;
  return v;
}

type ChinaCalcSummary = {
  qty: number;
  totalKrw: number;
  unitCostKrw: number;
  multiple: number;
};

type Props = {
  /** 좌상단: 조회 조건 패널(외부에서 주입) */
  queryPanel?: React.ReactNode;

  rows: SourcingProductRow[];
  allRows: SourcingProductRow[];
  setAllRows: (rows: SourcingProductRow[]) => void;

  onSave: () => void;

  loadedCount: number;
  hasNext: boolean;
  onLoadMore: () => void;
  loadingMore?: boolean;

  serverLoading?: boolean;
  savedSeq?: number;

  fxRateKrwPerCny: number;
  setFxRateKrwPerCny: (v: number) => void;
};

export function SourcingProductsGrid(props: Props) {
  const nav = useNavigate();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isMdUp, setIsMdUp] = useState(false);

  // 중국사입계산 입력 모달
  const [importCalcModalOpen, setImportCalcModalOpen] = useState(false);
  const [importCalcSourcingId, setImportCalcSourcingId] = useState<
    string | null
  >(null);
  const [chinaCalcSummaryById, setChinaCalcSummaryById] = useState<
    Record<string, ChinaCalcSummary>
  >({});

  // 저장 완료 후 체크 해제
  useEffect(() => {
    if (props.savedSeq == null) return;
    setCheckedIds(new Set());
  }, [props.savedSeq]);

  // 반응형(테이블 UX용)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsMdUp(mq.matches);
    onChange();

    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return props.allRows.find((r) => r.id === selectedId) ?? null;
  }, [props.allRows, selectedId]);

  // 선택된 row가 삭제되면 선택 해제
  useEffect(() => {
    if (!selectedId) return;
    const exist = props.allRows.some((r) => r.id === selectedId);
    if (!exist) setSelectedId(null);
  }, [props.allRows, selectedId]);

  const allChecked = useMemo(() => {
    if (props.rows.length === 0) return false;
    return props.rows.every((r) => checkedIds.has(r.id));
  }, [checkedIds, props.rows]);

  const toggleCheckAll = (next: boolean) => {
    if (!next) {
      setCheckedIds(new Set());
      return;
    }
    const s = new Set<string>();
    for (const r of props.rows) s.add(r.id);
    setCheckedIds(s);
  };

  const toggleCheck = (id: string, next: boolean) => {
    setCheckedIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(id);
      else s.delete(id);
      return s;
    });
  };

  /**
   * ✅ RowDetailPanel 같은 "필드 단위 업데이트"에서 사용
   */
  const updateField = <K extends keyof SourcingProductRow>(
    rowId: string,
    field: K,
    value: SourcingProductRow[K],
  ) => {
    props.setAllRows(
      props.allRows.map((r) => {
        if (r.id !== rowId) return r;
        const next = { ...r, [field]: value } as SourcingProductRow;
        return markEdited(r, next);
      }),
    );
  };

  /**
   * ✅ SourcingProductsTable이 요구하는 "patch 업데이트" 시그니처
   * (id: string, patch: Partial<SourcingProductRow>) => void
   */
  const updatePatch = (rowId: string, patch: Partial<SourcingProductRow>) => {
    props.setAllRows(
      props.allRows.map((r) => {
        if (r.id !== rowId) return r;
        const next = { ...r, ...patch } as SourcingProductRow;
        return markEdited(r, next);
      }),
    );
  };

  const addRow = () => {
    const nowIso = new Date().toISOString();
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `tmp_${Math.random().toString(16).slice(2)}`;

    const next: SourcingProductRow = {
      id,
      createdAt: nowIso,
      op: "create",
      keyword: "",
      vendor: "",
      refProduct: "",
      url1688: "",
      imageUrl: "",
      coupangCategory: "",
      productName: "",
      feeRate: undefined,
      costCny: undefined,
      costKrw: undefined,
      salePriceKrw: undefined,
      shippingKrw: 3000,
    };

    props.setAllRows([next, ...props.allRows]);
    setSelectedId(id);
  };

  const deleteAction = () => {
    const targets = new Set<string>();
    if (checkedIds.size > 0) {
      for (const id of checkedIds) targets.add(id);
    } else if (selected) {
      targets.add(selected.id);
    }

    if (targets.size === 0) return;

    const nextRows: SourcingProductRow[] = [];
    for (const r of props.allRows) {
      if (!targets.has(r.id)) {
        nextRows.push(r);
        continue;
      }

      // 신규(create) 행이면 즉시 제거
      if (r.op === "create" && !r.serverId) {
        continue;
      }

      // 서버 row는 delete 마킹
      nextRows.push(markDeleted(r));
    }

    props.setAllRows(nextRows);
    setCheckedIds(new Set());
    if (selectedId && targets.has(selectedId)) setSelectedId(null);
  };

  const goPlanning = () => {
    const name = (selected?.productName ?? "").trim();
    if (!name) {
      toastStore.push({
        type: "error",
        title: "상품명이 필요합니다",
        message: "기획하기를 사용하려면 상품명을 먼저 입력하세요.",
      });
      return;
    }
    nav(`${ROUTES.PLANNING_DETAIL_PAGE}?name=${encodeURIComponent(name)}`);
  };

  const openChinaImportCalc = async () => {
    const serverId = selected?.serverId ?? null;
    if (!serverId) {
      toastStore.push({
        type: "error",
        title: "저장된 소싱이 필요합니다",
        message:
          "중국사입계산은 서버에 저장된 소싱 항목에서만 확인할 수 있습니다.",
      });
      return;
    }

    try {
      const res = await chinaImportCalcApi.get(serverId);
      const c = res?.chinaImportCalc;

      const qty = Number(c?.qty ?? 0);
      const totalKrw = Number(c?.totalKrw ?? 0);
      const unitCostKrw = Number(c?.unitCostKrw ?? 0);
      const multiple = Number(c?.multiple ?? 0);

      const hasMeaningful =
        (qty && qty > 0) ||
        (totalKrw && totalKrw > 0) ||
        (unitCostKrw && unitCostKrw > 0);

      if (hasMeaningful) {
        setChinaCalcSummaryById((prev) => ({
          ...prev,
          [serverId]: { qty, totalKrw, unitCostKrw, multiple },
        }));
        return;
      }

      setImportCalcSourcingId(serverId);
      setImportCalcModalOpen(true);
    } catch (e: any) {
      const status = e?.status;
      if (status === 404) {
        setImportCalcSourcingId(serverId);
        setImportCalcModalOpen(true);
        return;
      }

      toastStore.push({
        type: "error",
        title: "중국사입계산 조회 실패",
        message: e?.message ?? "요청 중 오류가 발생했습니다.",
      });
    }
  };

  return (
    <div className="relative p-4 pb-24">
      {props.serverLoading ? (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            <span className="text-sm font-bold text-slate-700">처리 중...</span>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] lg:grid-rows-[auto_minmax(0,1fr)]">
        {/* 조회 조건 */}
        <div className="lg:col-start-1 lg:row-start-1">
          {props.queryPanel ?? null}
        </div>

        {/* 목록 */}
        <div className="min-h-0 lg:col-start-1 lg:row-start-2">
          <div className="flex flex-wrap items-end gap-3">
            <div className="mr-auto">
              <div className="text-sm font-extrabold text-slate-900">
                소싱 목록
              </div>
              <div className="mt-1 text-xs text-slate-500">
                KPI는 목록에서 비교하고, 상세 입력은 선택한 행의 우측 패널에서
                편집하세요.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ExcelButtons
                rows={props.allRows}
                onImport={(rows) => props.setAllRows(rows)}
              />

              <IconButton title="행 추가" onClick={addRow}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </IconButton>

              <IconButton
                title="행 삭제"
                onClick={deleteAction}
                disabled={!selected && checkedIds.size === 0}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 11v6M14 11v6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 7l1 14h10l1-14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 7V4h6v3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="mr-auto">
                <div className="text-xs text-slate-600">
                  총{" "}
                  <span className="font-extrabold text-slate-900">
                    {props.loadedCount.toLocaleString()}건
                  </span>{" "}
                  조회
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs font-extrabold text-slate-900">
                  환율(원/위안)
                </div>
                <input
                  className={[
                    "h-10 w-[120px] rounded-2xl px-3 text-sm font-extrabold tabular-nums",
                    "border border-slate-200 bg-white text-right",
                    "outline-none focus:border-slate-300",
                  ].join(" ")}
                  value={String(props.fxRateKrwPerCny ?? "")}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const cleaned = raw.replace(/[^\d.\-]/g, "");
                    const n = Number(cleaned);
                    if (!Number.isFinite(n)) return;
                    const c = clampFxRate(n);
                    if (c == null) return;
                    props.setFxRateKrwPerCny(c);
                  }}
                  inputMode="decimal"
                />
              </div>

              <button
                type="button"
                onClick={props.onLoadMore}
                disabled={
                  !props.hasNext || props.loadingMore || props.serverLoading
                }
                className={[
                  "group inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-extrabold transition",
                  "border border-slate-200 bg-white text-slate-900 shadow-sm",
                  "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm",
                ].join(" ")}
              >
                {props.loadingMore ? (
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5v12m0 0 6-6m-6 6-6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                더 보기
              </button>
            </div>
          </div>

          <div className="mt-4 min-h-0">
            <SourcingProductsTable
              rows={props.rows}
              selectedId={selectedId}
              setSelectedId={(id) => setSelectedId(id)}
              checkedIds={checkedIds}
              allChecked={allChecked}
              toggleCheckAll={toggleCheckAll}
              toggleCheck={toggleCheck}
              isMdUp={isMdUp}
              updateCell={updatePatch}
              onRowDoubleClick={(id) => setSelectedId(id)}
              onRowEnter={(id) => setSelectedId(id)}
            />
          </div>
        </div>

        {/* 상세 */}
        <div className="lg:col-start-2 lg:row-span-2 lg:sticky lg:top-24 lg:max-h-[calc(100vh-140px)] lg:overflow-hidden">
          <RowDetailPanel
            row={selected}
            fxRateKrwPerCny={props.fxRateKrwPerCny}
            updateCell={updatePatch}
            onSave={props.onSave}
            saving={props.serverLoading}
            onPlan={goPlanning}
            onCheckChinaCalc={openChinaImportCalc}
            onReservePlan={() => {
              const kw = (selected?.keyword ?? "").trim();
              const name = (selected?.productName ?? "").trim();
              const img = (selected?.imageUrl ?? "").trim();
              if (!kw || !name || !img) {
                toastStore.push({
                  type: "error",
                  title: "필수값이 부족합니다",
                  message:
                    "기획 예약은 이미지/상품명/키워드가 모두 필요합니다.",
                });
                return;
              }
              toastStore.push({
                type: "info",
                title: "준비중",
                message:
                  "기획 예약 기능은 추후 배치/AI 연동 단계에서 제공됩니다.",
              });
            }}
            chinaCalcSummary={
              selected?.serverId
                ? (chinaCalcSummaryById[selected.serverId] ?? null)
                : null
            }
          />
        </div>
      </div>

      <Modal
        open={importCalcModalOpen}
        onClose={() => setImportCalcModalOpen(false)}
        title="중국 사입 원가 계산 입력"
        description="저장된 계산 데이터가 없습니다. 값을 입력 후 저장하세요."
        widthClassName="max-w-[1180px]"
      >
        <ChinaImportCalcSheet
          productSourcingId={importCalcSourcingId}
          hideSourcingPicker
          onClose={() => setImportCalcModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
