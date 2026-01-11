import React, { useState } from "react";

type ExportFormat = "webp" | "jpg";

type Props = {
  disabled?: boolean;
  onExport: (format: ExportFormat) => void;
};

const ExportButtons: React.FC<Props> = ({ disabled, onExport }) => {
  const [format, setFormat] = useState<ExportFormat>("jpg");

  return (
    <div className="flex items-center gap-2">
      <select
        value={format}
        disabled={disabled}
        onChange={(e) => setFormat(e.target.value as ExportFormat)}
        className="
    h-10 px-4 pr-10 rounded-xl border border-slate-200 bg-white
    text-sm font-bold text-slate-800 shadow-sm
    focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400
    appearance-none
    disabled:opacity-50 disabled:cursor-not-allowed
  "
      >
        <option value="webp">WebP</option>
        <option value="jpg">JPG</option>
      </select>

      {/* caret icon */}
      <div className="relative">
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          ▼
        </div>
      </div>

      {/* Action */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onExport(format)}
        className="px-6 py-2 text-sm bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ZIP 저장
      </button>
    </div>
  );
};

export default ExportButtons;
