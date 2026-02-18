import React, { useMemo } from "react";
import {
  calcDerived,
  formatRoiPercent,
  type SourcingProductRow,
} from "@/entities/sourcing-product";
import { OpBadge } from "./GridAtoms";
import { CategorySelect, DeferredCommitInput, MoneyInput } from "./GridInputs";

function isEditableElement(el: Element | null) {
  return !!el?.closest("input, textarea, select, button, a");
}

export function SourcingProductsTable(props: {
  rows: SourcingProductRow[];

  selectedId: string | null;
  setSelectedId: (id: string) => void;

  checkedIds: Set<string>;
  toggleCheck: (id: string, next: boolean) => void;

  allChecked: boolean;
  toggleCheckAll: (next: boolean) => void;

  isMdUp: boolean;

  updateCell: (id: string, patch: Partial<SourcingProductRow>) => void;

  onRowDoubleClick: (id: string) => void;
  onRowEnter: (id: string) => void;
}) {
  const {
    rows,
    selectedId,
    setSelectedId,
    checkedIds,
    toggleCheck,
    allChecked,
    toggleCheckAll,
    isMdUp,
    updateCell,
  } = props;

  const thCls =
    "sticky top-0 z-20 px-2 py-2 text-left text-[11px] font-extrabold tracking-wide " +
    "text-slate-600 bg-slate-50 whitespace-nowrap border border-slate-200";

  const tdBase =
    "px-2 py-1 align-middle text-xs text-slate-900 border border-slate-200";

  const inputBase =
    "h-8 w-full rounded-xl px-2 text-xs outline-none " +
    "border border-transparent focus:border-slate-200 focus:bg-white " +
    "placeholder:text-slate-400 text-slate-900";

  const stickyCell = "sticky z-30 overflow-hidden";
  const stickyHead = "sticky z-40 overflow-hidden";
  const stickyRightDivider = "shadow-[8px_0_12px_-10px_rgba(0,0,0,0.35)]";

  const stickyCls = isMdUp ? stickyCell : "";
  const stickyHeadCls = isMdUp ? stickyHead : "";
  const stickyStyle = (left: number) => (isMdUp ? { left } : undefined);

  const W_CHECK = 40;
  const W_STATUS = 64;
  const W_NO = 48;
  const W_IMAGE = 76;
  const W_KEYWORD = 220;
  const W_VENDOR = 160;

  const B = 1;
  const LEFT_CHECK = 0;
  const LEFT_STATUS = W_CHECK + B * 1;
  const LEFT_NO = LEFT_STATUS + W_STATUS + B * 1;
  const LEFT_IMAGE = LEFT_NO + W_NO + B * 1;
  const LEFT_KEYWORD = LEFT_IMAGE + W_IMAGE + B * 1;
  const LEFT_VENDOR = LEFT_KEYWORD + W_KEYWORD + B * 1;

  // ✅ 선택 강조
  const selectedRowBg = "bg-blue-50/60";
  const selectedStickyBg = "bg-blue-50"; // opaque
  const headBg = "bg-slate-50";

  const stickyBg = (isSelected: boolean) =>
    isSelected ? selectedStickyBg : "bg-white";

  const derivedById = useMemo(() => {
    const m = new Map<string, ReturnType<typeof calcDerived>>();
    rows.forEach((r) => m.set(r.id, calcDerived(r)));
    return m;
  }, [rows]);

  return (
    <div className="mt-4 overflow-auto rounded-2xl border border-slate-200">
      <table className="min-w-[1520px] w-full table-fixed border-collapse">
        <colgroup>
          <col style={{ width: W_CHECK }} />
          <col style={{ width: W_STATUS }} />
          <col style={{ width: W_NO }} />
          <col style={{ width: W_IMAGE }} />
          <col style={{ width: W_KEYWORD }} />
          <col style={{ width: W_VENDOR }} />

          <col style={{ width: 260 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 140 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 140 }} />
          <col style={{ width: 220 }} />
        </colgroup>

        <thead>
          <tr>
            <th
              className={`${thCls} ${stickyHeadCls} ${headBg}`}
              style={{ left: LEFT_CHECK }}
            >
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => toggleCheckAll(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-slate-300"
              />
            </th>

            <th
              className={`${thCls} ${stickyHeadCls} ${headBg}`}
              style={{ left: LEFT_STATUS }}
            >
              상태
            </th>

            <th
              className={`${thCls} ${stickyHeadCls} ${headBg}`}
              style={{ left: LEFT_NO }}
            >
              No
            </th>

            <th
              className={`${thCls} ${stickyHeadCls} ${headBg}`}
              style={{ left: LEFT_IMAGE }}
            >
              이미지
            </th>

            <th
              className={`${thCls} ${stickyHeadCls} ${headBg}`}
              style={{ left: LEFT_KEYWORD }}
            >
              키워드
            </th>

            <th
              className={`${thCls} ${stickyHeadCls} ${headBg} ${stickyRightDivider}`}
              style={{ left: LEFT_VENDOR }}
            >
              도매처
            </th>

            <th className={`${thCls} ${headBg}`}>상품명</th>
            <th className={`${thCls} ${headBg}`}>원가(위안)</th>
            <th className={`${thCls} ${headBg}`}>원가(원)</th>
            <th className={`${thCls} ${headBg}`}>판매가(원)</th>
            <th className={`${thCls} ${headBg}`}>마진(원)</th>
            <th className={`${thCls} ${headBg}`}>마진율</th>
            <th className={`${thCls} ${headBg}`}>최소 ROI</th>
            <th className={`${thCls} ${headBg}`}>쿠팡 카테고리</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, idx) => {
            const d = derivedById.get(r.id)!;
            const isSelected = r.id === selectedId;
            const isLoss = d.grossMargin != null && d.grossMargin < 0;

            const sale = r.salePriceKrw ?? null;
            const gm = d.grossMargin ?? null;
            const minRoiPct =
              sale != null && gm != null && gm > 0
                ? Math.round((sale / gm) * 100)
                : null;

            const hover = !isSelected ? "hover:bg-slate-50" : "";
            const rowBg = isSelected ? selectedRowBg : "";

            const focusRow = () => setSelectedId(r.id);

            return (
              <tr
                key={r.id}
                tabIndex={0}
                onMouseDown={(e) => {
                  const t = e.target as HTMLElement;
                  if (t.closest("input, textarea, select, button")) return;
                  setSelectedId(r.id);
                  (e.currentTarget as HTMLTableRowElement).focus();
                }}
                onDoubleClick={() => props.onRowDoubleClick(r.id)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  if (isEditableElement(document.activeElement)) return;
                  e.preventDefault();
                  props.onRowEnter(r.id);
                }}
                className={[
                  "cursor-pointer outline-none",
                  hover,
                  rowBg,
                  r.op === "delete" ? "opacity-60" : "",
                  "focus:ring-2 focus:ring-slate-300 focus:ring-inset",
                ].join(" ")}
              >
                {/* CHECK */}
                <td
                  className={[
                    tdBase,
                    stickyCls,
                    stickyBg(isSelected),
                    "relative",
                  ].join(" ")}
                  style={stickyStyle(LEFT_CHECK)}
                >
                  {isLoss ? (
                    <span className="absolute left-0 top-0 h-full w-[2px] bg-rose-300" />
                  ) : null}
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={checkedIds.has(r.id)}
                      onChange={(e) => toggleCheck(r.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={focusRow}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </div>
                </td>

                {/* STATUS */}
                <td
                  className={[tdBase, stickyCls, stickyBg(isSelected)].join(
                    " ",
                  )}
                  style={stickyStyle(LEFT_STATUS)}
                >
                  <OpBadge op={r.op} />
                </td>

                {/* NO */}
                <td
                  className={[tdBase, stickyCls, stickyBg(isSelected)].join(
                    " ",
                  )}
                  style={stickyStyle(LEFT_NO)}
                >
                  <span className="tabular-nums">{r.no ?? idx + 1}</span>
                </td>

                {/* IMAGE */}
                <td
                  className={[tdBase, stickyCls, stickyBg(isSelected)].join(
                    " ",
                  )}
                  style={stickyStyle(LEFT_IMAGE)}
                >
                  <div className="flex items-center justify-center">
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded-xl object-cover border border-slate-200 bg-white"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-100" />
                    )}
                  </div>
                </td>

                {/* KEYWORD */}
                <td
                  className={[tdBase, stickyCls, stickyBg(isSelected)].join(
                    " ",
                  )}
                  style={stickyStyle(LEFT_KEYWORD)}
                >
                  <DeferredCommitInput
                    className={inputBase}
                    dataRow={r.id}
                    dataCol="keyword"
                    value={r.keyword}
                    onCommit={(next) => updateCell(r.id, { keyword: next })}
                    onFocus={focusRow}
                    placeholder="키워드"
                    maxLen={80}
                  />
                </td>

                {/* VENDOR */}
                <td
                  className={[
                    tdBase,
                    stickyCls,
                    stickyBg(isSelected),
                    stickyRightDivider,
                  ].join(" ")}
                  style={stickyStyle(LEFT_VENDOR)}
                >
                  <DeferredCommitInput
                    className={inputBase}
                    dataRow={r.id}
                    dataCol="vendor"
                    value={r.vendor}
                    onCommit={(next) => updateCell(r.id, { vendor: next })}
                    onFocus={focusRow}
                    placeholder="도매처"
                    maxLen={60}
                  />
                </td>

                {/* PRODUCT NAME */}
                <td className={tdBase}>
                  <DeferredCommitInput
                    className={inputBase}
                    dataRow={r.id}
                    dataCol="productName"
                    value={r.productName}
                    onCommit={(next) => updateCell(r.id, { productName: next })}
                    onFocus={focusRow}
                    placeholder="상품명"
                    maxLen={160}
                  />
                </td>

                {/* COST CNY */}
                <td className={`${tdBase} text-right`}>
                  <MoneyInput
                    prefix="¥"
                    value={r.costCny}
                    onChange={(v) => updateCell(r.id, { costCny: v })}
                    onFocus={focusRow}
                    placeholder="0"
                  />
                </td>

                {/* COST KRW */}
                <td className={`${tdBase} text-right`}>
                  <MoneyInput
                    prefix="₩"
                    value={r.costKrw}
                    onChange={(v) => updateCell(r.id, { costKrw: v })}
                    onFocus={focusRow}
                    placeholder="0"
                  />
                </td>

                {/* SALE */}
                <td className={`${tdBase} text-right`}>
                  <MoneyInput
                    prefix="₩"
                    value={r.salePriceKrw}
                    onChange={(v) => updateCell(r.id, { salePriceKrw: v })}
                    onFocus={focusRow}
                    placeholder="0"
                  />
                </td>

                {/* GROSS MARGIN */}
                <td
                  className={[
                    tdBase,
                    "text-right tabular-nums",
                    d.grossMargin != null && d.grossMargin < 0
                      ? "text-rose-700 font-black"
                      : "",
                  ].join(" ")}
                >
                  {d.grossMargin == null
                    ? "–"
                    : Math.round(d.grossMargin).toLocaleString()}
                </td>

                {/* GROSS MARGIN RATE */}
                <td className={`${tdBase} text-right tabular-nums`}>
                  {d.grossMarginRate == null
                    ? "–"
                    : `${Math.round(d.grossMarginRate * 100)}%`}
                </td>

                {/* MIN AD ROI */}
                <td className={`${tdBase} text-right tabular-nums`}>
                  {minRoiPct == null ? "–" : formatRoiPercent(minRoiPct)}
                </td>

                {/* CATEGORY */}
                <td className={tdBase}>
                  <CategorySelect
                    value={r.coupangCategory ?? ""}
                    onSelect={(name, feePercent) => {
                      updateCell(r.id, {
                        coupangCategory: name,
                        ...(feePercent != null
                          ? { feeRate: feePercent / 100 }
                          : {}),
                      });
                    }}
                    onFocus={focusRow}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
