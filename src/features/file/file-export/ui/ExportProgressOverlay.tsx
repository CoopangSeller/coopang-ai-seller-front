import React from "react";
import { ExportProgress } from "../lib/types";

type Props = {
  open: boolean;
  progress: ExportProgress;
};

const ExportProgressOverlay: React.FC<Props> = ({ open, progress }) => {
  if (!open) return null;

  const label =
    progress.phase === "capture"
      ? "캡처/인코딩"
      : progress.phase === "zip"
      ? "압축 중"
      : "완료";

  const pct =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 10;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">
            다운로드 준비 중
          </h3>
          <span className="text-xs text-slate-500">{label}</span>
        </div>

        <div className="text-sm text-slate-600">
          {progress.total > 0
            ? `${progress.current} / ${progress.total} 페이지 처리 중...`
            : "대상 페이지를 준비 중..."}
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-3 bg-blue-600 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="text-xs text-slate-500">
          페이지 수가 많거나 고해상도일수록 시간이 더 걸립니다.
        </div>
      </div>
    </div>
  );
};

export default ExportProgressOverlay;
