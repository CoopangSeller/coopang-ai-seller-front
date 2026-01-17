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
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        className={[
          "w-full px-4 py-3 rounded-lg border outline-none focus:ring-2",
          errorText
            ? "border-red-300 focus:ring-red-400"
            : "border-slate-200 focus:ring-blue-500",
        ].join(" ")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
      />
      {errorText ? (
        <div className="text-xs text-red-600">{errorText}</div>
      ) : helperText ? (
        <div className="text-xs text-slate-500">{helperText}</div>
      ) : null}
    </div>
  );
};
