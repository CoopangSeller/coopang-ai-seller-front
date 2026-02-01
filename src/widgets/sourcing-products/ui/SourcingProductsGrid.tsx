import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SourcingProductRow } from "@/entities/sourcing-product";
import { markDeleted, markEdited } from "@/features/sourcing-products/edit-row";
import { ExcelButtons } from "@/features/sourcing-products/excel-io";
import { SlimButton } from "./components/GridAtoms";
import { SourcingProductsTable } from "./components/SourcingProductsTable";

export function SourcingProductsGrid(props: {
  rows: SourcingProductRow[];
  allRows: SourcingProductRow[];
  setAllRows: (rows: SourcingProductRow[]) => void;
  onSave: () => void;
}) {
  const nav = useNavigate();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isMdUp, setIsMdUp] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)"); // md
    const onChange = () => setIsMdUp(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const selected = useMemo(
    () => props.allRows.find((r) => r.id === selectedId) ?? null,
    [props.allRows, selectedId],
  );

  const visibleIds = useMemo(() => props.rows.map((r) => r.id), [props.rows]);

  const allChecked = useMemo(() => {
    if (visibleIds.length === 0) return false;
    for (const id of visibleIds) if (!checkedIds.has(id)) return false;
    return true;
  }, [visibleIds, checkedIds]);

  function toggleCheck(id: string, next: boolean) {
    setCheckedIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(id);
      else s.delete(id);
      return s;
    });
  }

  function toggleCheckAll(next: boolean) {
    setCheckedIds((prev) => {
      const s = new Set(prev);
      if (next) visibleIds.forEach((id) => s.add(id));
      else visibleIds.forEach((id) => s.delete(id));
      return s;
    });
  }

  function selectNeighborAfterRemoval(targetId: string) {
    const list = props.rows;
    const idx = list.findIndex((r) => r.id === targetId);
    if (idx < 0) return null;
    return list[idx + 1]?.id ?? list[idx - 1]?.id ?? null;
  }

  function updateCell(id: string, patch: Partial<SourcingProductRow>) {
    props.setAllRows(
      props.allRows.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        return markEdited(r, next);
      }),
    );
  }

  function addRow() {
    const now = new Date().toISOString();
    const row: SourcingProductRow = {
      id: crypto.randomUUID(),
      createdAt: now,
      op: "create",

      keyword: "",
      vendor: "",
      refProduct: "",
      url1688: "",
      imageUrl: "",

      costCny: undefined,
      costKrw: undefined,

      coupangCategory: "",
      salePriceKrw: undefined,
      feeRate: 0.108,

      productName: "",
      shippingKrw: 3000,
    };

    props.setAllRows([row, ...props.allRows]);
    setSelectedId(row.id);
  }

  function deleteAction() {
    const checked = Array.from(checkedIds).filter((id) =>
      visibleIds.includes(id),
    );
    const targets =
      checked.length > 0 ? checked : selected ? [selected.id] : [];
    if (targets.length === 0) return;

    const nextSelected =
      selectNeighborAfterRemoval(targets[targets.length - 1]!) ?? null;

    props.setAllRows(
      props.allRows
        .filter((r) => !(targets.includes(r.id) && !r.serverId))
        .map((r) => {
          if (!targets.includes(r.id)) return r;
          if (!r.serverId) return r;
          return markDeleted(r);
        }),
    );

    setCheckedIds((prev) => {
      const s = new Set(prev);
      targets.forEach((id) => s.delete(id));
      return s;
    });

    setSelectedId(nextSelected);
  }

  function goPlanning() {
    if (!selected) return;
    nav("/planning/detail-page", { state: { sourcingRowId: selected.id } });
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <div className="text-sm font-extrabold text-slate-900">
            소싱 그리드
          </div>
          <div className="mt-1 text-xs text-slate-500">
            신규/수정/삭제는 플래그(op)로 관리되며, 서버 연동 시 변경분만
            동기화됩니다.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExcelButtons
            rows={props.allRows}
            onImport={(rows) => props.setAllRows(rows)}
          />
          <SlimButton kind="ghost" onClick={addRow}>
            행추가
          </SlimButton>
          <SlimButton
            kind="ghost"
            onClick={deleteAction}
            disabled={!selected && checkedIds.size === 0}
          >
            행삭제
          </SlimButton>
          <SlimButton kind="dark" onClick={goPlanning} disabled={!selected}>
            선택 행으로 기획 이동
          </SlimButton>
        </div>
      </div>

      {/* ✅ 헤더 체크박스는 테이블 헤더 좌상단 셀에 들어가야 해서,
          테이블 컴포넌트가 렌더한 헤더 첫 칸을 "비워두는" 대신,
          아래처럼 오버레이로 올리지 않고, 간단히 테이블 내부에서 렌더하도록
          하고 싶으면 SourcingProductsTable에서 첫 th에 렌더하면 됨.
          지금은 기존 UX 유지 위해 테이블 내부 체크박스 사용을 권장. */}

      <SourcingProductsTable
        rows={props.rows}
        selectedId={selectedId}
        setSelectedId={(id) => setSelectedId(id)}
        checkedIds={checkedIds}
        allChecked={allChecked}
        toggleCheckAll={toggleCheckAll}
        toggleCheck={toggleCheck}
        isMdUp={isMdUp}
        updateCell={updateCell}
      />

      {/* ✅ 헤더 좌상단 All 체크는 Table 내부 첫 th에서 렌더하는 게 구조상 맞음.
          현재 SourcingProductsTable은 "빈 th"로 두었으니, 아래처럼 간단히 안내:
          - 아래 코드를 SourcingProductsTable의 첫 th에 옮겨 붙이면 됨.
          여기서는 파일 수를 늘리지 않기 위해, 바로 table 쪽 수정 권장. */}

      <div className="mt-4 flex justify-end">
        <SlimButton kind="primary" onClick={props.onSave}>
          저장
        </SlimButton>
      </div>
    </div>
  );
}
