// src/widgets/detail-page-generator/ui/ResultPreview.tsx
import React, { useMemo } from "react";
import {
  ExportButtons,
  ExportProgressOverlay,
} from "@/features/file/file-export";
import { DetailImageSegment } from "../../model/types";

type Props = {
  name: string;
  segments: DetailImageSegment[];
  pageRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;

  downloading: boolean;
  progress: any;
  exportZip: any;

  onBack: () => void;

  updateSegment: (
    index: number,
    field: keyof DetailImageSegment,
    value: string,
  ) => void;

  onRegenerateOne: (index: number) => void;
  onUndoOne: (index: number) => void;
  onRedoOne: (index: number) => void;
};

// ✅ 가장 최신이 history[0]에 들어오는 구조(너가 unshift로 넣고 있음) 기준
function getPrevUrl(seg: DetailImageSegment) {
  return seg.history?.find((h) => !!h.imageUrl)?.imageUrl;
}
function getNextUrl(seg: DetailImageSegment) {
  return seg.future?.find((f) => !!f.imageUrl)?.imageUrl;
}

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
  const includeFn = useMemo(
    () => (i: number) => !!segments[i]?.imageUrl,
    [segments],
  );

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 px-4">
      {/* 상단 고정 헤더 */}
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
                shouldInclude: includeFn,
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
          const hasRedo = (seg.future?.length ?? 0) > 0;

          const prevUrl = seg.imageUrl ? getPrevUrl(seg) : undefined;
          const nextUrl = seg.imageUrl ? getNextUrl(seg) : undefined;

          return (
            <div
              key={seg.id || idx}
              className="rounded-2xl overflow-visible border border-slate-200 bg-white shadow-xl"
            >
              {/* ✅ 프리뷰 무대(캡처 밖) */}
              <div className="relative bg-slate-100 rounded-2xl overflow-visible">
                {/* ✅ 9:16 무대: 좌/우 peek는 무대 바깥으로 */}
                <div className="relative aspect-[9/16] rounded-2xl overflow-visible">
                  {/* 좌 peek (이전) - 캡처 밖 */}
                  {prevUrl && (
                    <div className="absolute inset-y-0 -left-24 w-24 md:-left-32 md:w-32 lg:-left-40 lg:w-40 z-0 pointer-events-none">
                      <div className="relative h-full rounded-2xl overflow-hidden border border-slate-200 shadow bg-white">
                        <img
                          src={prevUrl}
                          alt=""
                          className="w-full h-full object-cover opacity-35 blur-[1px] scale-[1.02]"
                          crossOrigin="anonymous"
                        />
                        <div className="absolute inset-0 bg-white/40" />
                      </div>
                    </div>
                  )}

                  {/* 우 peek (다음) - 캡처 밖 */}
                  {nextUrl && (
                    <div className="absolute inset-y-0 -right-24 w-24 md:-right-32 md:w-32 lg:-right-40 lg:w-40 z-0 pointer-events-none">
                      <div className="relative h-full rounded-2xl overflow-hidden border border-slate-200 shadow bg-white">
                        <img
                          src={nextUrl}
                          alt=""
                          className="w-full h-full object-cover opacity-35 blur-[1px] scale-[1.02]"
                          crossOrigin="anonymous"
                        />
                        <div className="absolute inset-0 bg-white/40" />
                      </div>
                    </div>
                  )}

                  {/* ✅ 캡처 대상: 딱 이 박스만 저장됨 */}
                  <div
                    ref={(el) => {
                      pageRefs.current[idx] = el;
                    }}
                    className="relative z-10 aspect-[9/16] rounded-2xl overflow-hidden bg-slate-100"
                  >
                    {seg.imageUrl ? (
                      <img
                        src={seg.imageUrl}
                        alt={seg.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
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
                      </div>
                    )}
                  </div>

                  {/* ✅ 로딩 오버레이(캡처 제외) */}
                  {seg.isGenerating && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none rounded-2xl">
                      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-white text-sm font-black tracking-tight">
                        AI가 이미지를 만들고 있어요
                      </p>
                    </div>
                  )}

                  {/* ✅ undo/redo 버튼(캡처 제외) */}
                  <div className="absolute inset-0 z-40 pointer-events-none">
                    <div className="absolute inset-y-0 left-0 flex items-center px-2 pointer-events-auto">
                      <button
                        type="button"
                        aria-label="되돌리기"
                        disabled={seg.isGenerating || !hasUndo}
                        onClick={() => onUndoOne(idx)}
                        className="
                          h-10 w-10 rounded-full
                          bg-white/90 text-slate-900
                          backdrop-blur border border-slate-200 shadow
                          hover:bg-black hover:text-white
                          transition-colors duration-150
                          disabled:opacity-40 disabled:cursor-not-allowed
                          flex items-center justify-center font-black
                        "
                      >
                        {"<"}
                      </button>
                    </div>

                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-auto">
                      <button
                        type="button"
                        aria-label="앞으로"
                        disabled={seg.isGenerating || !hasRedo}
                        onClick={() => onRedoOne(idx)}
                        className="
                          h-10 w-10 rounded-full
                          bg-white/90 text-slate-900
                          backdrop-blur border border-slate-200 shadow
                          hover:bg-black hover:text-white
                          transition-colors duration-150
                          disabled:opacity-40 disabled:cursor-not-allowed
                          flex items-center justify-center font-black
                        "
                      >
                        {">"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 컨트롤 영역(캡처/ZIP 제외) */}
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
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이 섹션만 재생성
                    </button>
                  </div>
                </div>

                {/* keyMessage -> title 같이 변경(너의 현재 구현 유지) */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600">
                    이 섹션 테마 (keyMessage)
                  </label>
                  <input
                    type="text"
                    className="
                      w-full px-3 py-2 rounded-xl
                      border border-slate-200 bg-slate-50
                      focus:bg-white focus:ring-2 focus:ring-blue-500
                      outline-none text-sm text-slate-800
                    "
                    value={seg.keyMessage}
                    onChange={(e) => {
                      updateSegment(idx, "keyMessage", e.target.value);
                      updateSegment(idx, "title", e.target.value);
                    }}
                  />
                  <div className="text-[11px] text-slate-500">
                    * keyMessage는 이미지에 직접 출력되지 않는 내부 테마입니다.
                    (재생성 눌렀을 때만 반영)
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
                    onChange={(e) => {
                      updateSegment(idx, "promptOverride", e.target.value);
                      updateSegment(idx, "logicalSections", e.target.value);
                    }}
                  />
                  <div className="text-[11px] text-slate-500">
                    * 보완 프롬프트는 재생성 시에만 덧붙여 반영됩니다.
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
