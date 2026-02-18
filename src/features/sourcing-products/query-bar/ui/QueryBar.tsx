import React from "react";
import type { SourcingQuery } from "@/entities/sourcing-product";

function ymdToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function QueryBar(props: {
  value: SourcingQuery;
  onChange: (q: SourcingQuery) => void;
  onSearch: () => void;
  onReset: () => void;
}) {
  const q: any = props.value ?? {};

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 작성일 From */}
      <div className="flex items-center gap-2">
        <div className="text-xs font-extrabold text-slate-700">작성일</div>
        <input
          type="date"
          className={[
            "h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900",
            "outline-none focus:border-slate-300",
          ].join(" ")}
          value={q.createdFrom ?? ""}
          onChange={(e) =>
            props.onChange({
              ...q,
              createdFrom: e.target.value,
            } as SourcingQuery)
          }
        />
        <span className="text-xs text-slate-400">~</span>
        {/* 작성일 To */}
        <input
          type="date"
          className={[
            "h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900",
            "outline-none focus:border-slate-300",
          ].join(" ")}
          value={q.createdTo ?? ""}
          max={ymdToday()}
          onChange={(e) =>
            props.onChange({ ...q, createdTo: e.target.value } as SourcingQuery)
          }
        />
      </div>

      {/* 키워드 */}
      <input
        className={[
          "h-10 w-[220px] rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900",
          "outline-none focus:border-slate-300",
        ].join(" ")}
        value={q.keyword ?? ""}
        placeholder="키워드"
        onChange={(e) =>
          props.onChange({ ...q, keyword: e.target.value } as SourcingQuery)
        }
      />

      {/* 도매처 */}
      <input
        className={[
          "h-10 w-[220px] rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900",
          "outline-none focus:border-slate-300",
        ].join(" ")}
        value={q.vendor ?? ""}
        placeholder="도매처"
        onChange={(e) =>
          props.onChange({ ...q, vendor: e.target.value } as SourcingQuery)
        }
      />

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={props.onReset}
          className={[
            "h-10 rounded-2xl px-4 text-sm font-extrabold",
            "border border-slate-200 bg-white text-slate-900 shadow-sm",
            "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
          ].join(" ")}
        >
          초기화
        </button>
        <button
          type="button"
          onClick={props.onSearch}
          className={[
            "h-10 rounded-2xl px-4 text-sm font-extrabold",
            "bg-slate-900 text-white shadow-sm",
            "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
          ].join(" ")}
        >
          조회
        </button>
      </div>
    </div>
  );
}
