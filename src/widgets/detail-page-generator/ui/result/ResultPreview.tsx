import React from "react";
import {
  ExportButtons,
  ExportProgressOverlay,
} from "@/features/file/file-export";
import { DetailImageSegment } from "@/shared/types/types";

type Props = {
  name: string;
  segments: DetailImageSegment[];
  pageRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;

  downloading: boolean;
  progress: any;
  exportZip: any;

  onBack: () => void;

  // ✅ 신규
  updateSegment: (
    index: number,
    field: keyof DetailImageSegment,
    value: string,
  ) => void;
  onRegenerateOne: (index: number) => void;
  onUndoOne: (index: number) => void;
  onRedoOne: (index: number) => void;
};

const ResultPreview: React.FC<Props> = ({
  name,
  segments,
  pageRefs,
  downloading,
  progress,
  exportZip,
  onBack,
  updateSegment,
  onRegenerateOne,
  onUndoOne,
  onRedoOne,
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-20">
      <div className="sticky top-4 z-50 flex flex-wrap gap-2 justify-between items-center bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-blue-50 mb-8">
        <h2 className="text-lg font-black text-slate-800">결과물 미리보기</h2>

        <div className="flex gap-2 flex-wrap justify-end">
          <button
            type="button"
            disabled={downloading}
            onClick={onBack}
            className="px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            기획안으로 돌아가기
          </button>

          <ExportButtons
            disabled={downloading}
            onExport={(format: any) =>
              exportZip(format, {
                nodes: pageRefs.current,
                shouldInclude: (i: number) => !!segments[i]?.imageUrl,
                baseName: name || "detail_pages",
                scale: 2,
                webpQuality: 0.9,
                jpgQuality: 0.95,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-10">
        {segments.map((seg, idx) => {
          const hasUndo = (seg.history?.length ?? 0) > 0;

          return (
            <div
              key={seg.id || idx}
              className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl"
            >
              {/* ✅ 캡처 영역: 이미지(9:16)만 */}
              <div
                ref={(el) => {
                  pageRefs.current[idx] = el;
                }}
                className="relative aspect-[9/16] bg-slate-100 flex items-center justify-center overflow-hidden"
              >
                {seg.imageUrl ? (
                  <img
                    src={seg.imageUrl}
                    alt={seg.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    {seg.isGenerating ? (
                      <>
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-500 font-semibold animate-pulse">
                          이미지 생성 중... ({idx + 1}/{segments.length})
                        </p>
                      </>
                    ) : (
                      <p className="text-slate-400">이미지가 없습니다.</p>
                    )}
                  </div>
                )}
              </div>

              {/* ✅ 컨트롤 영역: 캡처/ZIP에 포함되지 않음 */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-500">
                      #{String(idx + 1).padStart(2, "0")} · {seg.template}
                    </div>
                    <div className="text-sm font-black text-slate-900 truncate">
                      {seg.title}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={seg.isGenerating}
                      onClick={() => onRegenerateOne(idx)}
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 disabled:opacity-50"
                    >
                      이 섹션만 재생성
                    </button>

                    <button
                      type="button"
                      disabled={!hasUndo || seg.isGenerating}
                      onClick={() => onUndoOne(idx)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-black text-xs hover:bg-slate-50 disabled:opacity-50"
                    >
                      되돌리기
                    </button>

                    <button
                      type="button"
                      disabled={!seg.future?.length}
                      onClick={() => onRedoOne(idx)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-black text-xs hover:bg-slate-50 disabled:opacity-50"
                    >
                      앞으로
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600">
                    이 섹션만 보완 프롬프트(선택)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800"
                    placeholder="예: 제품은 더 크게, 배경은 더 미니멀, 아이콘은 3개만, 텍스트는 짧고 굵게, 테마 컬러는 블루 톤 유지"
                    value={seg.promptOverride ?? ""}
                    onChange={(e) =>
                      updateSegment(idx, "promptOverride", e.target.value)
                    }
                  />
                  <div className="text-[11px] text-slate-500">
                    * 여기 입력은 기획 원본(visualPrompt)을 바꾸지 않고, 재생성
                    시에만 덧붙여 반영됩니다.
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-500">
        * ZIP 저장은 여러 장을 한 번에 내려받기 위한 방식입니다.
      </div>

      <ExportProgressOverlay open={downloading} progress={progress} />
    </div>
  );
};

export default ResultPreview;
