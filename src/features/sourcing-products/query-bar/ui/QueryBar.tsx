import React from "react";
import { TextField } from "@/shared/ui";

type QueryValue = {
  createdFrom?: string;
  createdTo?: string;
  keyword?: string;
  vendor?: string;
};

type Props = {
  value: QueryValue;
  onChange: (v: QueryValue) => void;
  onSearch: () => void;
  onReset?: () => void;
};

function SlimButton(props: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  kind?: "primary" | "ghost";
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
          ? "bg-slate-900 text-white hover:bg-slate-950"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {props.children}
    </button>
  );
}

export function QueryBar(props: Props) {
  const v = props.value;

  return (
    <div className="flex flex-col gap-3">
      {/* Top row: title + actions (compact) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <div className="text-sm font-extrabold text-slate-900">조회 조건</div>
          <div className="mt-0.5 text-xs text-slate-500">
            기간/키워드/도매처로 필터링합니다.
          </div>
        </div>

        {props.onReset ? (
          <SlimButton kind="ghost" onClick={props.onReset}>
            초기화
          </SlimButton>
        ) : null}

        <SlimButton kind="primary" onClick={props.onSearch}>
          조회
        </SlimButton>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <TextField
          size="sm"
          label="생성일(From)"
          type="date"
          value={v.createdFrom ?? ""}
          onChange={(val) =>
            props.onChange({ ...v, createdFrom: val || undefined })
          }
        />
        <TextField
          size="sm"
          label="생성일(To)"
          type="date"
          value={v.createdTo ?? ""}
          onChange={(val) =>
            props.onChange({ ...v, createdTo: val || undefined })
          }
        />
        <TextField
          size="sm"
          label="키워드"
          value={v.keyword ?? ""}
          onChange={(val) =>
            props.onChange({ ...v, keyword: val || undefined })
          }
          placeholder="예: 천혜향, 키링, 스텐 텀블러"
        />
        <TextField
          size="sm"
          label="도매처"
          value={v.vendor ?? ""}
          onChange={(val) => props.onChange({ ...v, vendor: val || undefined })}
          placeholder="예: 1688, 도매매, 사입처명"
        />
      </div>
    </div>
  );
}
