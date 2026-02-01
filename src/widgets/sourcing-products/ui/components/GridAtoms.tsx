import React from "react";
import { SourcingProductRow } from "@/entities/sourcing-product";

export function SlimButton(props: {
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

export function OpBadge({ op }: { op: SourcingProductRow["op"] }) {
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

export function CellPopover(props: {
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

export function UrlIcon({ url }: { url: string }) {
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

export function ImageIcon({ url }: { url: string }) {
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
