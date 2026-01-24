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
};

const ResultPreview: React.FC<Props> = ({
  name,
  segments,
  pageRefs,
  downloading,
  progress,
  exportZip,
  onBack,
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

      <div className="flex flex-col shadow-2xl rounded-2xl overflow-hidden bg-slate-200">
        {segments.map((seg, idx) => (
          <div
            key={seg.id || idx}
            ref={(el) => {
              pageRefs.current[idx] = el;
            }}
            className="relative aspect-[9/16] bg-slate-100 border-b border-slate-200 flex flex-col items-center justify-center overflow-hidden"
          >
            {seg.imageUrl ? (
              <>
                <img
                  src={seg.imageUrl}
                  alt={seg.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-12 text-center">
                  <p className="text-white text-3xl font-black leading-tight drop-shadow-lg whitespace-pre-line">
                    {seg.keyMessage}
                  </p>
                </div>
              </>
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
        ))}
      </div>

      <div className="text-xs text-slate-500">
        * ZIP 저장은 여러 장을 한 번에 내려받기 위한 방식입니다.
      </div>

      <ExportProgressOverlay open={downloading} progress={progress} />
    </div>
  );
};

export default ResultPreview;
