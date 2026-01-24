import React from "react";
import { DetailImageSegment, ModelType } from "@/shared/types/types";

type Props = {
  segments: DetailImageSegment[];
  updateSegment: (
    index: number,
    field: keyof DetailImageSegment,
    value: string,
  ) => void;

  onBack: () => void;
  onGenerateAll: () => void;
};

const PlanReview: React.FC<Props> = ({
  segments,
  updateSegment,
  onBack,
  onGenerateAll,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-black text-slate-800">
          4단계: 기획안 검토 및 수정
        </h2>

        <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-extrabold text-sm hover:bg-slate-50"
          >
            입력으로 돌아가기
          </button>

          <button
            type="button"
            onClick={onGenerateAll}
            className="px-6 py-2 bg-blue-600 text-white font-black rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            이미지 일괄 생성 시작
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {segments.map((seg, idx) => (
          <div
            key={seg.id || idx}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                  {seg.logicalSections?.join(" | ") || "기획 전략"}
                </span>
                <h3 className="text-lg font-black text-slate-800">
                  {seg.title}
                </h3>
              </div>
              <span className="text-slate-400 font-mono">#0{idx + 1}</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-extrabold text-slate-600">
                한글 카피 (Key Message)
              </label>
              <input
                className="w-full p-3 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-semibold"
                value={seg.keyMessage}
                onChange={(e) =>
                  updateSegment(idx, "keyMessage", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-extrabold text-slate-600">
                이미지 생성 프롬프트 (Visual Prompt)
              </label>
              <textarea
                rows={2}
                className="w-full p-3 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700"
                value={seg.visualPrompt}
                onChange={(e) =>
                  updateSegment(idx, "visualPrompt", e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanReview;
