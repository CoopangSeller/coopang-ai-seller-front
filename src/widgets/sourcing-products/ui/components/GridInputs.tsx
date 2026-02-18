import React, { useRef, useState } from "react";
import { COUPANG_CATEGORIES } from "@/shared/config/coupangCategories";
import { formatKrw } from "@/shared/lib/format/numberFormat";
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
  onFocus?: () => void; // ✅ 추가
}) {
  const { value, onCommit, placeholder, maxLen = MAX_URL_LEN } = props;

  const composingRef = useRef(false);
  const lastCommittedRef = useRef(value);

  // 외부값 변경 시 DOM 입력을 새로 만들어 동기화 (uncontrolled 유지)
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
      onFocus={props.onFocus} // ✅ 선택 이동 트리거
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={() => {
        composingRef.current = false;
      }}
      onInput={(e) => {
        // 입력 중 길이 제한만 수행 (state 갱신 금지)
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

function normalizeDecimalInput(next: string) {
  // 허용: 숫자, 앞쪽 -, 한 개의 .
  let s = next.replace(/[^\d.-]/g, "");

  // '-'는 맨 앞 하나만
  const minus = s.startsWith("-") ? "-" : "";
  s = s.replace(/-/g, "");
  s = minus + s;

  // '.'는 첫 번째만 허용
  const firstDot = s.indexOf(".");
  if (firstDot >= 0) {
    const before = s.slice(0, firstDot + 1);
    const after = s.slice(firstDot + 1).replace(/\./g, "");
    s = before + after;
  }

  return s;
}

function tryParseDecimal(s: string): number | undefined {
  if (s === "" || s === "-" || s === "." || s === "-.") return undefined;
  if (s.endsWith(".")) return undefined; // "12." 입력중 상태 유지
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export function MoneyInput(props: {
  value?: number;
  onChange: (v?: number) => void;
  placeholder?: string;
  prefix?: "₩" | "¥";
  onFocus?: () => void;
}) {
  const { value, onChange, placeholder, prefix } = props;

  const composingRef = useRef(false);
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState<string>(value == null ? "" : String(value));
  const lastCommittedRef = useRef<number | undefined>(value);

  const display = focused
    ? raw
    : prefix === "¥"
      ? value == null
        ? ""
        : `¥ ${String(value)}`
      : formatKrw(value);

  const commit = () => {
    let s = raw.trim();
    s = normalizeDecimalInput(s);

    // "12." -> "12"
    if (s.endsWith(".")) s = s.slice(0, -1);
    if (s === "-" || s === "." || s === "-.") s = "";

    if (s === "") {
      lastCommittedRef.current = undefined;
      onChange(undefined);
      return;
    }

    const n = Number(s);
    if (!Number.isFinite(n)) return;

    lastCommittedRef.current = n;
    onChange(n);
  };

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
      onFocus={() => {
        props.onFocus?.();
        setFocused(true);
        setRaw(value == null ? "" : String(value));
      }}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={() => {
        composingRef.current = false;
      }}
      onChange={(e) => {
        if (!focused) return;
        const next = normalizeDecimalInput(e.target.value);
        setRaw(next);

        // 입력 중 parse 가능한 경우는 즉시 반영(원가원 자동계산도 즉시 반응)
        const n = tryParseDecimal(next);
        if (n === undefined) return;
        if (lastCommittedRef.current === n) return;
        lastCommittedRef.current = n;
        onChange(n);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (!composingRef.current) {
            commit();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setRaw(value == null ? "" : String(value));
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
      onBlur={() => {
        setFocused(false);
        if (composingRef.current) return;
        commit();
      }}
      placeholder={placeholder}
      inputMode="decimal"
    />
  );
}

export function FeePercentInput(props: {
  feeRate?: number; // 내부 0.108
  onChange: (v?: number) => void;
  onFocus?: () => void; // ✅ 추가
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
        onFocus={() => {
          props.onFocus?.();
          setFocused(true);
        }}
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
  onFocus?: () => void; // ✅ 추가
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
      onFocus={props.onFocus}
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
