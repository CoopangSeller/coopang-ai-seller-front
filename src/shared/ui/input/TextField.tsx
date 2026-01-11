import React from "react";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
};

const TextField: React.FC<Props> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none
                   focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
      />
    </div>
  );
};

export default TextField;
