// src/shared/ui/button/Button.tsx
import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  full?: boolean;
  variant?: Variant;
  size?: Size;
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "text-white bg-blue-600 hover:bg-blue-700 shadow-sm",
  secondary: "text-white bg-slate-800 hover:bg-slate-900 shadow-sm",
  // ✅ ghost도 '안 보이는' 문제 방지: 얕은 배경 + 보더
  ghost:
    "text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200",
  danger: "text-white bg-rose-600 hover:bg-rose-700 shadow-sm",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-xl",
  md: "h-11 px-5 text-sm rounded-2xl",
};

const Button: React.FC<Props> = ({
  full,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  return (
    <button
      {...props}
      className={[
        full ? "w-full" : "",
        "inline-flex items-center justify-center font-bold transition active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        SIZE_CLASS[size],
        VARIANT_CLASS[variant],
        className,
      ].join(" ")}
    />
  );
};

export default Button;
