import React from "react";

export function IconButton(props: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={props.title}
      aria-label={props.title}
      onClick={props.onClick}
      disabled={props.disabled}
      className={[
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
        "border border-slate-200 bg-white text-slate-800 shadow-sm",
        "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm",
        props.className ?? "",
      ].join(" ")}
    >
      {props.children}
    </button>
  );
}
