import React, { useRef, useState } from "react";
import { COUPANG_CATEGORIES } from "@/shared/config/coupangCategories";
import { formatKrw, parseNumber } from "@/shared/lib/format/numberFormat";
import {
  feeRateToUiPercent,
  uiPercentToFeeRate,
} from "@/shared/lib/format/percentFormat";

export const MAX_URL_LEN = 600;

function clampText(s: string, maxLen: number) {
  if (maxLen <= 0) return s;
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen);
}

/**
 * ✅ IME + 테이블 리렌더에 가장 강한 방식
 * - 입력 중에는 React state(allRows)를 갱신하지 않음 (uncontrolled)
 * - blur 또는 Enter에서만 commit
 * - composition 중 commit 금지
 */
export function DeferredCommitInput(props: {
  value: string;
  onCommit: (next: string) => void;
  placeholder?: string;
  maxLen?: number;
  className?: string;
  dataRow?: string;
  dataCol?: string;
}) {
  const { value, onCommit, placeholder, maxLen = MAX_URL_LEN } = props;

  const composingRef = useRef(false);
  const lastCommittedRef = useRef(value);

  const key = `${props.dataRow ?? ""}:${props.dataCol ?? ""}:${value}`;

  const clampInPlace = (el: HTMLInputElement) => {
    if (maxLen <= 0) return;
    if (el.value.length > maxLen) el.value = el.value.slice(0, maxLen);
  };

  const commit = (el: HTMLInputElement) => {
    clampInPlace(el);
    const next = clampText(el.value, maxLen);
    if (next === lastCommittedRef.current) return;
    lastCommittedRef.current = next;
    onCommit(next);
  };

  return (
    <input
      key={key}
      className={[props.className ?? "", "truncate"].join(" ")}
      defaultValue={value}
      placeholder={placeholder}
      maxLength={maxLen}
      data-row={props.dataRow}
      data-col={props.dataCol}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={() => {
        composingRef.current = false;
      }}
      onInput={(e) => {
        clampInPlace(e.currentTarget);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (!composingRef.current) {
            commit(e.currentTarget);
            e.currentTarget.blur();
          }
        }
        if (e.key === "Escape") {
          e.preventDefault();
          e.currentTarget.value = lastCommittedRef.current;
          e.currentTarget.blur();
        }
      }}
      onBlur={(e) => {
        if (composingRef.current) return;
        commit(e.currentTarget);
      }}
    />
  );
}

export function MoneyInput(props: {
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
        "border border-transparent focus:border-slate-200 focus:bg-white",
        "text-slate-900 placeholder:text-slate-400",
      ].join(" ")}
      value={display}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(parseNumber(e.target.value))}
      placeholder={placeholder}
      inputMode="numeric"
    />
  );
}

export function FeePercentInput(props: {
  feeRate?: number; // 내부 0.108
  onChange: (v?: number) => void;
}) {
  const [focused, setFocused] = useState(false);

  const display = focused
    ? props.feeRate == null
      ? ""
      : String(Math.round(props.feeRate * 1000) / 10)
    : feeRateToUiPercent(props.feeRate);

  return (
    <div
      className="relative"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        className={[
          "h-8 w-full rounded-xl px-2 pr-7 text-xs outline-none text-right tabular-nums",
          "border border-transparent focus:border-slate-200 focus:bg-white",
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

export function CategorySelect(props: {
  value: string;
  onSelect: (name: string, feePercent?: number) => void;
}) {
  return (
    <select
      className={[
        "h-8 w-full rounded-xl px-2 text-xs outline-none",
        "border border-slate-200 bg-white",
        "text-slate-900",
      ].join(" ")}
      value={props.value}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
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
