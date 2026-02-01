import React, { useEffect, useMemo, useState } from "react";
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

const MAX_URL_LEN = 600;

function clampText(s: string, maxLen: number) {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen);
}

function ellipsisMiddle(s: string, head = 28, tail = 14) {
  if (!s) return "";
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(s.length - tail)}`;
}

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
  widthClassName?: string;
}) {
  const { title, value } = props;
  if (!value) return <>{props.children}</>;
  return (
    <div className="relative group">
      {props.children}
      <div
        className={[
          "pointer-events-none absolute left-0 top-9 z-30 hidden",
          props.widthClassName ?? "w-[420px]",
          "rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-xl group-hover:block",
        ].join(" ")}
      >
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
          <div className="break-all px-3 py-2 text-xs text-slate-500">
            {url}
          </div>
        </div>
      </div>
    </div>
  );
}

function EllipsisInput(props: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  maxLen?: number;
  className?: string;
  dataRow?: string;
  dataCol?: string;
}) {
  const { value, onChange, placeholder, maxLen = MAX_URL_LEN } = props;
  const [focused, setFocused] = useState(false);

  const display = focused ? value : ellipsisMiddle(value);

  return (
    <input
      className={props.className}
      value={display}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(clampText(e.target.value, maxLen))}
      placeholder={placeholder}
      maxLength={maxLen}
      data-row={props.dataRow}
      data-col={props.dataCol}
    />
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

  useEffect(() => {
    if (!selectedId) return;
    requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-row="${selectedId}"][data-col="keyword"]`,
      ) as HTMLInputElement | null;
      el?.focus();
      el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
  }, [selectedId]);

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

  function updateCell(id: string, patch: Partial<SourcingProductRow>) {
    props.setAllRows(
      props.allRows.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        return markEdited(r, next);
      }),
    );
  }

  // border-collapse 기준으로 테이블/셀 스타일 재정의 (겹침 방지 핵심)
  const thCls =
    "sticky top-0 z-20 px-2 py-2 text-left text-[11px] font-extrabold tracking-wide " +
    "text-slate-600 bg-slate-50 whitespace-nowrap border border-slate-200";

  const tdBase =
    "px-2 py-1 align-middle text-xs text-slate-900 border border-slate-200";

  const lossTint = "bg-rose-50/60";

  const inputBase =
    "h-8 w-full rounded-xl px-2 text-xs outline-none " +
    "border border-transparent focus:border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 " +
    "placeholder:text-slate-400 text-slate-900";

  const ellipsisInput = `${inputBase}`;

  // 고정 영역은 항상 불투명 배경(겹침 비침 방지)
  const stickyCell = "sticky z-30 overflow-hidden bg-white";
  const stickyHead = "sticky z-40 bg-slate-50 overflow-hidden";
  // 고정 영역과 스크롤 영역 경계(시각적 분리)
  const stickyRightDivider = "shadow-[8px_0_12px_-10px_rgba(0,0,0,0.35)]";

  const stickyCls = isMdUp ? stickyCell : "";
  const stickyHeadCls = isMdUp ? stickyHead : "";
  const stickyStyle = (left: number) => (isMdUp ? { left } : undefined);

  // Freeze widths (px): 반드시 colgroup과 일치
  const W_CHECK = 40;
  const W_STATUS = 64;
  const W_NO = 48;
  const W_KEYWORD = 224;
  const W_VENDOR = 160;
  const W_REF = 176;

  // border-collapse에서 보더(1px) 누적 오차를 방지하기 위해,
  // sticky left는 "폭 누적" + "보더 1px * 컬럼 개수"로 보정.
  const B = 1;

  const LEFT_CHECK = 0;
  const LEFT_STATUS = W_CHECK + B * 1; // check border
  const LEFT_NO = LEFT_STATUS + W_STATUS + B * 1;
  const LEFT_KEYWORD = LEFT_NO + W_NO + B * 1;
  const LEFT_VENDOR = LEFT_KEYWORD + W_KEYWORD + B * 1;
  const LEFT_REF = LEFT_VENDOR + W_VENDOR + B * 1;

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
                className={`${thCls} ${stickyHeadCls}`}
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
                className={`${thCls} ${stickyHeadCls}`}
                style={{ left: LEFT_STATUS }}
              >
                상태
              </th>
              <th
                className={`${thCls} ${stickyHeadCls}`}
                style={{ left: LEFT_NO }}
              >
                No
              </th>
              <th
                className={`${thCls} ${stickyHeadCls}`}
                style={{ left: LEFT_KEYWORD }}
              >
                키워드
              </th>
              <th
                className={`${thCls} ${stickyHeadCls}`}
                style={{ left: LEFT_VENDOR }}
              >
                도매처
              </th>
              <th className={`${thCls}`}>참고 상품</th>

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

              const isLoss = d.grossMargin != null && d.grossMargin < 0;

              // ring 제거 (sticky+table에서 외곽선 깨짐)
              const negativeLine = "";
              const negativeBorder = "";

              // 선택도 ring 대신 배경만 (원하면 유지 가능하지만 ring은 추천 X)
              const selectedBorder = isSelected ? "bg-blue-50/60" : "";

              const hover = !isSelected ? "hover:bg-slate-50" : "";

              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={[
                    "cursor-pointer",
                    hover,
                    negativeLine,
                    negativeBorder,
                    selectedBorder,
                    r.op === "delete" ? "opacity-60" : "",
                  ].join(" ")}
                >
                  <td
                    className={`${tdBase} ${stickyCell} relative`}
                    style={{ left: LEFT_CHECK }}
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

                  <td
                    className={`${tdBase} ${stickyCls}`}
                    style={stickyStyle(LEFT_STATUS)}
                  >
                    <OpBadge op={r.op} />
                  </td>

                  <td
                    className={`${tdBase} ${stickyCls}`}
                    style={stickyStyle(LEFT_NO)}
                  >
                    <span className="tabular-nums">{r.no ?? ""}</span>
                  </td>

                  <td
                    className={`${tdBase} ${stickyCls}`}
                    style={stickyStyle(LEFT_KEYWORD)}
                  >
                    <CellPopover title="키워드" value={r.keyword}>
                      <EllipsisInput
                        className={ellipsisInput}
                        dataRow={r.id}
                        dataCol="keyword"
                        value={r.keyword}
                        onChange={(next) => updateCell(r.id, { keyword: next })}
                        placeholder="키워드"
                        maxLen={80}
                      />
                    </CellPopover>
                  </td>

                  <td
                    className={`${tdBase} ${stickyCls}`}
                    style={stickyStyle(LEFT_VENDOR)}
                  >
                    <CellPopover title="도매처" value={r.vendor}>
                      <EllipsisInput
                        className={ellipsisInput}
                        value={r.vendor}
                        onChange={(next) => updateCell(r.id, { vendor: next })}
                        placeholder="도매처"
                        maxLen={60}
                      />
                    </CellPopover>
                  </td>

                  <td className={`${tdBase}`} style={{ left: LEFT_REF }}>
                    <CellPopover title="참고 상품" value={r.refProduct}>
                      <EllipsisInput
                        className={ellipsisInput}
                        value={r.refProduct}
                        onChange={(next) =>
                          updateCell(r.id, { refProduct: next })
                        }
                        placeholder="참고 상품"
                        maxLen={120}
                      />
                    </CellPopover>
                  </td>

                  <td className={`${tdBase} ${isLoss ? lossTint : ""}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <UrlIcon url={r.url1688} />
                      <div className="min-w-0 flex-1">
                        <CellPopover title="1688 URL" value={r.url1688}>
                          <EllipsisInput
                            className={ellipsisInput}
                            value={r.url1688}
                            onChange={(next) =>
                              updateCell(r.id, { url1688: next })
                            }
                            placeholder="https://..."
                            maxLen={MAX_URL_LEN}
                          />
                        </CellPopover>
                      </div>
                    </div>
                  </td>

                  <td className={`${tdBase} ${isLoss ? lossTint : ""}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <ImageIcon url={r.imageUrl} />
                      <div className="min-w-0 flex-1">
                        <CellPopover
                          title="이미지 URL"
                          value={r.imageUrl}
                          widthClassName="w-[520px]"
                        >
                          <EllipsisInput
                            className={ellipsisInput}
                            value={r.imageUrl}
                            onChange={(next) =>
                              updateCell(r.id, { imageUrl: next })
                            }
                            placeholder="이미지 URL"
                            maxLen={MAX_URL_LEN}
                          />
                        </CellPopover>
                      </div>
                    </div>
                  </td>

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

                  <td
                    className={`${tdBase} ${isLoss ? lossTint : ""} text-right`}
                  >
                    <FeePercentInput
                      feeRate={r.feeRate}
                      onChange={(v) => updateCell(r.id, { feeRate: v })}
                    />
                  </td>

                  <td
                    className={`${tdBase} ${isLoss ? lossTint : ""} text-right tabular-nums`}
                  >
                    {Math.round(d.feeAmount ?? 0).toLocaleString()}
                  </td>

                  <td
                    className={`${tdBase} ${isLoss ? lossTint : ""} text-right tabular-nums`}
                  >
                    {Math.round(d.vat ?? 0).toLocaleString()}
                  </td>

                  <td
                    className={[
                      `${tdBase} ${isLoss ? lossTint : ""}`,
                      "text-right tabular-nums",
                      (d.grossMargin ?? 0) < 0 ? "text-rose-700 font-bold" : "",
                    ].join(" ")}
                  >
                    {Math.round(d.grossMargin ?? 0).toLocaleString()}
                  </td>

                  <td
                    className={`${tdBase} ${isLoss ? lossTint : ""} text-right tabular-nums`}
                  >
                    {((d.grossMarginRate ?? 0) * 100).toFixed(0)}%
                  </td>

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

                  <td className={tdBase}>
                    <EllipsisInput
                      className={ellipsisInput}
                      value={r.productName}
                      onChange={(next) =>
                        updateCell(r.id, { productName: next })
                      }
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

      <div className="mt-4 flex justify-end">
        <SlimButton kind="primary" onClick={props.onSave}>
          저장
        </SlimButton>
      </div>
    </div>
  );
}
