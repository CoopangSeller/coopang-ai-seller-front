import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calcDerived, SourcingProductRow } from "@/entities/sourcing-product";
import { markDeleted, markEdited } from "@/features/sourcing-products/edit-row";
import { ExcelButtons } from "@/features/sourcing-products/excel-io";
import { formatKrw, parseNumber } from "@/shared/lib/format/numberFormat";
import {
  feeRateToUiPercent,
  uiPercentToFeeRate,
} from "@/shared/lib/format/percentFormat";
import { COUPANG_CATEGORIES } from "@/shared/config/coupangCategories";

function SlimButton(props: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  kind?: "primary" | "ghost" | "dark";
}) {
  const { kind = "ghost", disabled } = props;
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={disabled}
      className={[
        "h-9 rounded-2xl px-4 text-sm font-bold transition",
        "shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
        kind === "primary"
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : kind === "dark"
            ? "bg-slate-900 text-white hover:bg-slate-950"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {props.children}
    </button>
  );
}

function OpBadge({ op }: { op: SourcingProductRow["op"] }) {
  if (!op || op === "none") return null;
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold border";
  if (op === "create")
    return (
      <span
        className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}
      >
        NEW
      </span>
    );
  if (op === "update")
    return (
      <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>
        EDIT
      </span>
    );
  if (op === "delete")
    return (
      <span className={`${base} border-rose-200 bg-rose-50 text-rose-700`}>
        DEL
      </span>
    );
  return null;
}

function CellPopover(props: {
  title: string;
  value: string;
  children: React.ReactNode;
}) {
  const { title, value } = props;
  if (!value) return <>{props.children}</>;
  return (
    <div className="relative group">
      {props.children}
      <div className="pointer-events-none absolute left-0 top-9 z-30 hidden w-[420px] rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-xl group-hover:block">
        <div className="font-extrabold text-slate-900">{title}</div>
        <div className="mt-2 break-all text-slate-700">{value}</div>
      </div>
    </div>
  );
}

function UrlIcon({ url }: { url: string }) {
  if (!url) return <span className="inline-block w-8" />;
  return (
    <button
      type="button"
      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
      onClick={(e) => {
        e.stopPropagation();
        window.open(url, "_blank", "noopener,noreferrer");
      }}
      title="새 탭으로 열기"
    >
      🔗
    </button>
  );
}

function ImageIcon({ url }: { url: string }) {
  if (!url) return <span className="inline-block w-8" />;
  return (
    <div className="relative group inline-flex">
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
        onClick={(e) => e.stopPropagation()}
        title="미리보기"
      >
        🖼️
      </button>
      <div className="pointer-events-none absolute left-0 top-9 z-30 hidden w-[360px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl group-hover:block">
        <div className="text-xs font-extrabold text-slate-900">
          이미지 미리보기
        </div>
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <img
            src={url}
            alt="preview"
            className="h-[180px] w-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="px-3 py-2 text-xs text-slate-500 break-all">
            {url}
          </div>
        </div>
      </div>
    </div>
  );
}

function MoneyInput(props: {
  value?: number;
  onChange: (v?: number) => void;
  placeholder?: string;
  prefix?: "₩" | "¥";
}) {
  const { value, onChange, placeholder, prefix } = props;
  const [focused, setFocused] = useState(false);

  const display = focused
    ? value == null
      ? ""
      : String(value)
    : prefix === "¥"
      ? value == null
        ? ""
        : `¥ ${String(value)}`
      : formatKrw(value);

  return (
    <input
      className={[
        "h-8 w-full rounded-xl px-2 text-xs outline-none text-right tabular-nums",
        "border border-transparent focus:border-slate-200",
        "focus:bg-white focus:ring-4 focus:ring-blue-500/10",
        "text-slate-900 placeholder:text-slate-400",
      ].join(" ")}
      value={display}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(parseNumber(e.target.value))}
      placeholder={placeholder}
      inputMode="numeric"
    />
  );
}

function FeePercentInput(props: {
  feeRate?: number; // 내부 0.108
  onChange: (v?: number) => void;
}) {
  const [focused, setFocused] = useState(false);

  const display = focused
    ? props.feeRate == null
      ? ""
      : String(Math.round(props.feeRate * 1000) / 10) // 10.8
    : feeRateToUiPercent(props.feeRate); // 10.8

  return (
    <div className="relative">
      <input
        className={[
          "h-8 w-full rounded-xl px-2 pr-7 text-xs outline-none text-right tabular-nums",
          "border border-transparent focus:border-slate-200",
          "focus:bg-white focus:ring-4 focus:ring-blue-500/10",
          "text-slate-900 placeholder:text-slate-400",
        ].join(" ")}
        value={display}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => props.onChange(uiPercentToFeeRate(e.target.value))}
        placeholder="10.8"
        inputMode="decimal"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
        %
      </span>
    </div>
  );
}

function CategorySelect(props: {
  value: string;
  onSelect: (name: string, feePercent?: number) => void;
}) {
  return (
    <select
      className={[
        "h-8 w-full rounded-xl px-2 text-xs outline-none",
        "border border-slate-200 bg-white",
        "focus:ring-4 focus:ring-blue-500/10",
        "text-slate-900",
      ].join(" ")}
      value={props.value}
      onChange={(e) => {
        const name = e.target.value;
        const found = COUPANG_CATEGORIES.find((c) => c.name === name);
        props.onSelect(name, found?.feePercent);
      }}
    >
      <option value="">카테고리 선택</option>
      {COUPANG_CATEGORIES.map((c) => (
        <option key={c.name} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

export function SourcingProductsGrid(props: {
  rows: SourcingProductRow[];
  allRows: SourcingProductRow[];
  setAllRows: (rows: SourcingProductRow[]) => void;
  onSave: () => void;
}) {
  const nav = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

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

    // 삭제 대상: 체크 > 선택행
    const targets =
      checked.length > 0 ? checked : selected ? [selected.id] : [];
    if (targets.length === 0) return;

    const nextSelected =
      selectNeighborAfterRemoval(targets[targets.length - 1]!) ?? null;

    props.setAllRows(
      props.allRows
        // 1) 로컬행(serverId 없음)은 즉시 제거
        .filter((r) => !(targets.includes(r.id) && !r.serverId))
        // 2) 서버행(serverId 있음)은 delete 플래그
        .map((r) => {
          if (!targets.includes(r.id)) return r;
          if (!r.serverId) return r; // 이미 filter에서 제거됨
          return markDeleted(r);
        }),
    );

    // 체크 상태 정리
    setCheckedIds((prev) => {
      const s = new Set(prev);
      targets.forEach((id) => s.delete(id));
      return s;
    });

    // 포커스(선택) 이동
    setSelectedId(nextSelected);
  }

  function goPlanning() {
    if (!selected) return;
    nav("/planning/detail-page", { state: { sourcingRowId: selected.id } });
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

  // table styles (dense & modern)
  const thCls =
    "sticky top-0 z-10 px-2 py-2 text-left text-[11px] font-extrabold tracking-wide " +
    "text-slate-600 bg-slate-50 border-b border-slate-200 border-r border-slate-200 last:border-r-0 whitespace-nowrap";

  const tdBase =
    "px-2 py-1 align-middle text-xs text-slate-900 " +
    "border-b border-slate-200 border-r border-slate-200 last:border-r-0";

  const inputBase =
    "h-8 w-full rounded-xl px-2 text-xs outline-none " +
    "border border-transparent focus:border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 " +
    "placeholder:text-slate-400 text-slate-900";

  const ellipsisInput = `${inputBase} truncate`;

  return (
    <div className="p-4">
      {/* Header / Actions */}
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
          {/* Excel */}
          <ExcelButtons
            rows={props.allRows}
            onImport={(rows) => props.setAllRows(rows)}
          />

          {/* Grid Actions */}
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

      {/* Table */}
      <div className="mt-4 overflow-auto rounded-2xl border border-slate-200">
        <table className="min-w-[1680px] w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {/* check */}
              <th className={`${thCls} w-10`}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => toggleCheckAll(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </th>

              {[
                "상태",
                "No",
                "키워드",
                "도매처",
                "참고 상품",
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
                <th key={h} className={thCls}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {props.rows.map((r) => {
              const d = calcDerived(r);
              const isSelected = r.id === selectedId;

              // min ad roas = sale / grossMargin
              const sale = r.salePriceKrw ?? 0;
              const gm = d.grossMargin ?? 0;
              const roas = gm > 0 && sale > 0 ? sale / gm : null;
              const roasPct = roas ? Math.round(roas * 100) : null;

              const recommended =
                r.costCny != null ? (r.costCny <= 10 ? 350 : 300) : null;
              const over =
                roasPct != null && recommended != null
                  ? roasPct > recommended
                  : false;

              const negativeTint = (d.grossMargin ?? 0) < 0 ? "bg-rose-50" : "";
              const selectedTint = isSelected ? "bg-blue-50/60" : "";
              const hover = !isSelected ? "hover:bg-slate-50" : "";

              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={[
                    "cursor-pointer",
                    negativeTint,
                    selectedTint,
                    hover,
                    r.op === "delete" ? "opacity-60" : "",
                  ].join(" ")}
                >
                  {/* check */}
                  <td className={`${tdBase} w-10 text-center`}>
                    <input
                      type="checkbox"
                      checked={checkedIds.has(r.id)}
                      onChange={(e) => toggleCheck(r.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </td>

                  <td className={`${tdBase} w-16`}>
                    <OpBadge op={r.op} />
                  </td>

                  {/* No */}
                  <td className={`${tdBase} w-10`}>
                    <span className="tabular-nums">{r.no ?? ""}</span>
                  </td>

                  <td className={tdBase}>
                    <input
                      className={`${inputBase} w-40`}
                      value={r.keyword}
                      onChange={(e) =>
                        updateCell(r.id, { keyword: e.target.value })
                      }
                      placeholder="키워드"
                    />
                  </td>

                  <td className={tdBase}>
                    <input
                      className={`${inputBase} w-28`}
                      value={r.vendor}
                      onChange={(e) =>
                        updateCell(r.id, {
                          vendor: e.target.value,
                        })
                      }
                      placeholder="도매처"
                    />
                  </td>

                  <td className={tdBase}>
                    <input
                      className={`${inputBase} w-28`}
                      value={r.refProduct}
                      onChange={(e) =>
                        updateCell(r.id, { refProduct: e.target.value })
                      }
                      placeholder="도매팩/1688"
                    />
                  </td>

                  {/* URL */}
                  <td className={tdBase}>
                    <div className="flex items-center gap-2">
                      <UrlIcon url={r.url1688} />
                      <CellPopover title="1688 URL" value={r.url1688}>
                        <input
                          className={`${ellipsisInput} w-40`}
                          value={r.url1688}
                          onChange={(e) =>
                            updateCell(r.id, { url1688: e.target.value })
                          }
                          placeholder="https://..."
                        />
                      </CellPopover>
                    </div>
                  </td>

                  {/* Image */}
                  <td className={tdBase}>
                    <div className="flex items-center gap-2">
                      <ImageIcon url={r.imageUrl} />
                      <CellPopover title="이미지 URL" value={r.imageUrl}>
                        <input
                          className={`${ellipsisInput} w-44`}
                          value={r.imageUrl}
                          onChange={(e) =>
                            updateCell(r.id, { imageUrl: e.target.value })
                          }
                          placeholder="이미지 URL"
                        />
                      </CellPopover>
                    </div>
                  </td>

                  {/* cost cny */}
                  <td className={`${tdBase} text-right w-24`}>
                    <MoneyInput
                      prefix="¥"
                      value={r.costCny}
                      onChange={(v) => updateCell(r.id, { costCny: v })}
                      placeholder="0"
                    />
                  </td>

                  {/* cost krw */}
                  <td className={`${tdBase} text-right w-28`}>
                    <MoneyInput
                      prefix="₩"
                      value={r.costKrw}
                      onChange={(v) => updateCell(r.id, { costKrw: v })}
                      placeholder="0"
                    />
                  </td>

                  {/* category */}
                  <td className={`${tdBase} w-44`}>
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

                  {/* shipping */}
                  <td className={`${tdBase} text-right w-24`}>
                    <MoneyInput
                      prefix="₩"
                      value={r.shippingKrw}
                      onChange={(v) => updateCell(r.id, { shippingKrw: v })}
                      placeholder="3000"
                    />
                  </td>

                  {/* sale */}
                  <td className={`${tdBase} text-right w-28`}>
                    <MoneyInput
                      prefix="₩"
                      value={r.salePriceKrw}
                      onChange={(v) => updateCell(r.id, { salePriceKrw: v })}
                      placeholder="0"
                    />
                  </td>

                  {/* fee percent */}
                  <td className={`${tdBase} text-right w-24`}>
                    <FeePercentInput
                      feeRate={r.feeRate}
                      onChange={(v) => updateCell(r.id, { feeRate: v })}
                    />
                  </td>

                  {/* derived */}
                  <td className={`${tdBase} text-right tabular-nums`}>
                    {Math.round(d.feeAmount ?? 0).toLocaleString()}
                  </td>

                  <td className={`${tdBase} text-right tabular-nums`}>
                    {Math.round(d.vat ?? 0).toLocaleString()}
                  </td>

                  <td
                    className={[
                      tdBase,
                      "text-right tabular-nums",
                      (d.grossMargin ?? 0) < 0 ? "text-rose-700 font-bold" : "",
                    ].join(" ")}
                  >
                    {Math.round(d.grossMargin ?? 0).toLocaleString()}
                  </td>

                  <td className={`${tdBase} text-right tabular-nums`}>
                    {((d.grossMarginRate ?? 0) * 100).toFixed(0)}%
                  </td>

                  {/* min ad roas */}
                  <td className={`${tdBase} text-right w-28`}>
                    <div className="flex flex-col items-end leading-tight">
                      <div
                        className={
                          over
                            ? "font-extrabold text-rose-700"
                            : "font-extrabold text-slate-900"
                        }
                      >
                        {roasPct != null ? `${roasPct}%` : "-"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {roasPct == null
                          ? gm <= 0
                            ? "마진≤0: 산정 불가"
                            : "값 입력 필요"
                          : recommended == null
                            ? "추천: 원가(위안) 입력"
                            : `추천: ≤ ${recommended}% (${(r.costCny ?? 0) <= 10 ? "위안≤10" : "위안>10"})`}
                      </div>
                    </div>
                  </td>

                  {/* productName */}
                  <td className={tdBase}>
                    <input
                      className={`${inputBase} w-44`}
                      value={r.productName}
                      onChange={(e) =>
                        updateCell(r.id, { productName: e.target.value })
                      }
                      placeholder="상품명"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom right save */}
      <div className="mt-4 flex justify-end">
        <SlimButton kind="primary" onClick={props.onSave}>
          저장
        </SlimButton>
      </div>
    </div>
  );
}
