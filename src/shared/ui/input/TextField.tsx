import React from "react";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  size?: "sm" | "md";
};

export const TextField: React.FC<Props> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  helperText,
  errorText,
  disabled,
  size = "md",
}) => {
  const isError = Boolean(errorText);

  const sizeCls =
    size === "sm"
      ? "h-9 px-3 text-sm rounded-xl" // ✅ compact
      : "h-11 px-4 text-base rounded-2xl"; // ✅ default

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          className={[
            "w-full",
            sizeCls,
            "bg-white text-slate-900 placeholder:text-slate-400",
            "border shadow-sm transition",
            "focus:outline-none focus:ring-4",
            isError
              ? "border-red-300 focus:ring-red-500/20 focus:border-red-400"
              : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500",
            disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "",
            type === "date" ? "appearance-none" : "",
          ].join(" ")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          autoComplete={autoComplete}
          disabled={disabled}
        />
      </div>

      {isError ? (
        <div className="text-xs text-red-600">{errorText}</div>
      ) : helperText ? (
        <div className="text-xs text-slate-500">{helperText}</div>
      ) : null}
    </div>
  );
};
