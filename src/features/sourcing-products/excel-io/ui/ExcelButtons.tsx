import React, { useRef } from "react";
import { importRowsFromXlsx, exportRowsToXlsx } from "../model/excel";
import { SourcingProductRow } from "@/entities/sourcing-product";

function IconAction(props: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={props.title}
      aria-label={props.title}
      onClick={props.onClick}
      className={[
        "group relative inline-flex h-10 w-10 items-center justify-center rounded-2xl",
        "border border-slate-200 bg-white shadow-sm transition",
        "hover:-translate-y-0.5 hover:shadow-md",
      ].join(" ")}
    >
      {props.children}
    </button>
  );
}

function ExcelFileIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      className={className}
    >
      {/* 파일 외곽 */}
      <path
        d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* 접힌 모서리 */}
      <path
        d="M14 2v4h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* X 표시 */}
      <path
        d="M9 11l6 6M15 11l-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowOverlay({
  direction,
  className,
}: {
  direction: "up" | "down";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      className={className}
    >
      {direction === "up" ? (
        <path
          d="M12 19V5m0 0 4 4m-4-4-4 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M12 5v14m0 0 4-4m-4 4-4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function ExcelButtons(props: {
  rows: SourcingProductRow[];
  onImport: (rows: SourcingProductRow[]) => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const rows = await importRowsFromXlsx(f);
          props.onImport(rows);
          e.currentTarget.value = "";
        }}
      />

      {/* 업로드 */}
      <IconAction
        title="엑셀 업로드 (.xlsx)"
        onClick={() => ref.current?.click()}
      >
        <div className="relative">
          <ExcelFileIcon className="text-emerald-600 group-hover:text-emerald-700" />
          <ArrowOverlay
            direction="up"
            className="absolute -bottom-1 -right-1 text-emerald-600"
          />
        </div>
      </IconAction>

      {/* 다운로드 */}
      <IconAction
        title="엑셀 다운로드 (.xlsx)"
        onClick={() => exportRowsToXlsx(props.rows)}
      >
        <div className="relative">
          <ExcelFileIcon className="text-blue-600 group-hover:text-blue-700" />
          <ArrowOverlay
            direction="down"
            className="absolute -bottom-1 -right-1 text-blue-600"
          />
        </div>
      </IconAction>
    </div>
  );
}
