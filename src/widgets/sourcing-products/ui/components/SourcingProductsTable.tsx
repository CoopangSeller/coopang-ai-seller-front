import React from "react";
import { calcDerived, SourcingProductRow } from "@/entities/sourcing-product";
import { CellPopover, ImageIcon, OpBadge, UrlIcon } from "./GridAtoms";
import {
  CategorySelect,
  DeferredCommitInput,
  FeePercentInput,
  MoneyInput,
  MAX_URL_LEN,
} from "./GridInputs";

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
}) {
  const {
    rows,
    selectedId,
    setSelectedId,
    checkedIds,
    allChecked,
    toggleCheckAll,
    toggleCheck,
    isMdUp,
    updateCell,
  } = props;

  const thCls =
    "sticky top-0 z-20 px-2 py-2 text-left text-[11px] font-extrabold tracking-wide " +
    "text-slate-600 bg-slate-50 whitespace-nowrap border border-slate-200";

  const tdBase =
    "px-2 py-1 align-middle text-xs text-slate-900 border border-slate-200";

  const lossTint = "bg-rose-50/60";

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
  const W_KEYWORD = 224;
  const W_VENDOR = 160;
  const W_REF = 176;

  const B = 1;
  const LEFT_CHECK = 0;
  const LEFT_STATUS = W_CHECK + B * 1;
  const LEFT_NO = LEFT_STATUS + W_STATUS + B * 1;
  const LEFT_KEYWORD = LEFT_NO + W_NO + B * 1;
  const LEFT_VENDOR = LEFT_KEYWORD + W_KEYWORD + B * 1;

  // ✅ 선택 강조(은은한 파란색)
  const selectedRowBg = "bg-blue-50/60";
  // ✅ sticky는 항상 불투명. 선택 시에도 불투명한 파란 배경으로.
  const stickyBg = (isSelected: boolean) =>
    isSelected ? selectedRowBg : "bg-white";
  const headBg = "bg-slate-50";

  return (
    <div className="mt-4 overflow-auto rounded-2xl border border-slate-200">
      <table className="min-w-[2000px] w-full table-fixed border-collapse">
        <colgroup>
          <col style={{ width: W_CHECK }} />
          <col style={{ width: W_STATUS }} />
          <col style={{ width: W_NO }} />
          <col style={{ width: W_KEYWORD }} />
          <col style={{ width: W_VENDOR }} />
          <col style={{ width: W_REF }} />

          <col style={{ width: 220 }} />
          <col style={{ width: 240 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 240 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 140 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 140 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 140 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 220 }} />
          <col style={{ width: 260 }} />
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

            <th className={`${thCls} ${headBg}`}>참고 상품</th>

            {[
              "1688 URL",
              "이미지",
              "원가(위안)",
              "원가(원)",
              "쿠팡 카테고리",
              "운임(원)",
              "판매가(원)",
              "수수료(%)",
              "판매수수료(원)",
              "부가세",
              "그로스마진",
              "그로스마진율",
              "최소 광고 수익률",
              "상품명",
            ].map((h) => (
              <th key={h} className={`${thCls} ${headBg}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const d = calcDerived(r);
            const isSelected = r.id === selectedId;

            const sale = r.salePriceKrw ?? null;
            const gm = d.grossMargin ?? null;
            const roas =
              sale != null && gm != null && gm > 0 ? sale / gm : null;
            const roasPct = roas != null ? Math.round(roas * 100) : null;

            const recommended =
              r.costCny != null ? (r.costCny <= 10 ? 350 : 300) : null;
            const over =
              roasPct != null && recommended != null
                ? roasPct > recommended
                : false;

            const isLoss = d.grossMargin != null && d.grossMargin < 0;

            const hover = !isSelected ? "hover:bg-slate-50" : "";
            const rowBg = isSelected ? selectedRowBg : "";

            return (
              <tr
                key={r.id}
                onMouseDown={(e) => {
                  const t = e.target as HTMLElement;
                  if (t.closest("input, textarea, select, button")) return;
                  setSelectedId(r.id);
                }}
                className={[
                  "cursor-pointer",
                  hover,
                  rowBg,
                  r.op === "delete" ? "opacity-60" : "",
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
                  {isLoss && (
                    <span className="absolute left-0 top-0 h-full w-[2px] bg-rose-300" />
                  )}
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={checkedIds.has(r.id)}
                      onChange={(e) => toggleCheck(r.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
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
                  <span className="tabular-nums">{r.no ?? ""}</span>
                </td>

                {/* KEYWORD */}
                <td
                  className={[tdBase, stickyCls, stickyBg(isSelected)].join(
                    " ",
                  )}
                  style={stickyStyle(LEFT_KEYWORD)}
                >
                  <CellPopover title="키워드" value={r.keyword}>
                    <DeferredCommitInput
                      className={inputBase}
                      dataRow={r.id}
                      dataCol="keyword"
                      value={r.keyword}
                      onCommit={(next) => updateCell(r.id, { keyword: next })}
                      placeholder="키워드"
                      maxLen={80}
                    />
                  </CellPopover>
                </td>

                {/* VENDOR (sticky boundary) */}
                <td
                  className={[
                    tdBase,
                    stickyCls,
                    stickyBg(isSelected),
                    stickyRightDivider,
                  ].join(" ")}
                  style={stickyStyle(LEFT_VENDOR)}
                >
                  <CellPopover title="도매처" value={r.vendor}>
                    <DeferredCommitInput
                      className={inputBase}
                      dataRow={r.id}
                      dataCol="vendor"
                      value={r.vendor}
                      onCommit={(next) => updateCell(r.id, { vendor: next })}
                      placeholder="도매처"
                      maxLen={60}
                    />
                  </CellPopover>
                </td>

                {/* REF (non-sticky) */}
                <td className={tdBase}>
                  <CellPopover title="참고 상품" value={r.refProduct}>
                    <DeferredCommitInput
                      className={inputBase}
                      dataRow={r.id}
                      dataCol="refProduct"
                      value={r.refProduct}
                      onCommit={(next) =>
                        updateCell(r.id, { refProduct: next })
                      }
                      placeholder="참고 상품"
                      maxLen={120}
                    />
                  </CellPopover>
                </td>

                {/* URL */}
                <td className={`${tdBase} ${isLoss ? lossTint : ""}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <UrlIcon url={r.url1688} />
                    <div className="min-w-0 flex-1">
                      <CellPopover title="1688 URL" value={r.url1688}>
                        <DeferredCommitInput
                          className={inputBase}
                          dataRow={r.id}
                          dataCol="url1688"
                          value={r.url1688}
                          onCommit={(next) =>
                            updateCell(r.id, { url1688: next })
                          }
                          placeholder="https://..."
                          maxLen={MAX_URL_LEN}
                        />
                      </CellPopover>
                    </div>
                  </div>
                </td>

                {/* IMAGE */}
                <td className={`${tdBase} ${isLoss ? lossTint : ""}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon url={r.imageUrl} />
                    <div className="min-w-0 flex-1">
                      <CellPopover
                        title="이미지 URL"
                        value={r.imageUrl}
                        widthClassName="w-[520px]"
                      >
                        <DeferredCommitInput
                          className={inputBase}
                          dataRow={r.id}
                          dataCol="imageUrl"
                          value={r.imageUrl}
                          onCommit={(next) =>
                            updateCell(r.id, { imageUrl: next })
                          }
                          placeholder="이미지 URL"
                          maxLen={MAX_URL_LEN}
                        />
                      </CellPopover>
                    </div>
                  </div>
                </td>

                {/* COST CNY */}
                <td
                  className={`${tdBase} ${isLoss ? lossTint : ""} text-right`}
                >
                  <MoneyInput
                    prefix="¥"
                    value={r.costCny}
                    onChange={(v) => updateCell(r.id, { costCny: v })}
                    placeholder="0"
                  />
                </td>

                {/* COST KRW */}
                <td
                  className={`${tdBase} ${isLoss ? lossTint : ""} text-right`}
                >
                  <MoneyInput
                    prefix="₩"
                    value={r.costKrw}
                    onChange={(v) => updateCell(r.id, { costKrw: v })}
                    placeholder="0"
                  />
                </td>

                {/* CATEGORY */}
                <td className={`${tdBase} ${isLoss ? lossTint : ""}`}>
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
                  />
                </td>

                {/* SHIPPING */}
                <td
                  className={`${tdBase} ${isLoss ? lossTint : ""} text-right`}
                >
                  <MoneyInput
                    prefix="₩"
                    value={r.shippingKrw}
                    onChange={(v) => updateCell(r.id, { shippingKrw: v })}
                    placeholder="3000"
                  />
                </td>

                {/* SALE */}
                <td
                  className={`${tdBase} ${isLoss ? lossTint : ""} text-right`}
                >
                  <MoneyInput
                    prefix="₩"
                    value={r.salePriceKrw}
                    onChange={(v) => updateCell(r.id, { salePriceKrw: v })}
                    placeholder="0"
                  />
                </td>

                {/* FEE */}
                <td
                  className={`${tdBase} ${isLoss ? lossTint : ""} text-right`}
                >
                  <FeePercentInput
                    feeRate={r.feeRate}
                    onChange={(v) => updateCell(r.id, { feeRate: v })}
                  />
                </td>

                {/* FEE AMOUNT */}
                <td
                  className={`${tdBase} ${isLoss ? lossTint : ""} text-right tabular-nums`}
                >
                  {d.feeAmount == null
                    ? "–"
                    : Math.round(d.feeAmount).toLocaleString()}
                </td>

                {/* VAT */}
                <td
                  className={`${tdBase} ${isLoss ? lossTint : ""} text-right tabular-nums`}
                >
                  {d.vat == null ? "–" : Math.round(d.vat).toLocaleString()}
                </td>

                {/* GROSS MARGIN */}
                <td
                  className={[
                    `${tdBase} ${isLoss ? lossTint : ""}`,
                    "text-right tabular-nums",
                    d.grossMargin != null && d.grossMargin < 0
                      ? "text-rose-700 font-bold"
                      : "",
                  ].join(" ")}
                >
                  {d.grossMargin == null
                    ? "–"
                    : Math.round(d.grossMargin).toLocaleString()}
                </td>

                {/* GROSS MARGIN RATE */}
                <td
                  className={`${tdBase} ${isLoss ? lossTint : ""} text-right tabular-nums`}
                >
                  {d.grossMarginRate == null
                    ? "–"
                    : `${(d.grossMarginRate * 100).toFixed(0)}%`}
                </td>

                {/* MIN AD ROI */}
                <td
                  className={`${tdBase} ${isLoss ? lossTint : ""} text-right`}
                >
                  <div className="flex flex-col items-end leading-tight">
                    <div
                      className={
                        over
                          ? "font-extrabold text-rose-700"
                          : "font-extrabold text-slate-900"
                      }
                    >
                      {roasPct != null ? `${roasPct}%` : "–"}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {roasPct == null
                        ? gm == null
                          ? "값 입력 필요"
                          : gm <= 0
                            ? "마진≤0: 산정 불가"
                            : "값 입력 필요"
                        : recommended == null
                          ? "추천: 원가(위안) 입력"
                          : `추천: ≤ ${recommended}% (${(r.costCny ?? 0) <= 10 ? "위안≤10" : "위안>10"})`}
                    </div>
                  </div>
                </td>

                {/* PRODUCT NAME */}
                <td className={tdBase}>
                  <DeferredCommitInput
                    className={inputBase}
                    dataRow={r.id}
                    dataCol="productName"
                    value={r.productName}
                    onCommit={(next) => updateCell(r.id, { productName: next })}
                    placeholder="상품명"
                    maxLen={160}
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
