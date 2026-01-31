import React, { useState } from "react";
import { DetailShotKey, PageLength, ProductInfo } from "../../model/types";

type Props = {
  info: ProductInfo;
  setInfo: React.Dispatch<React.SetStateAction<ProductInfo>>;

  finalCuts: Record<DetailShotKey, string | null>;
  onUploadFinalCut: (key: DetailShotKey, dataUrl: string) => void;
  onClearFinalCut: (key: DetailShotKey) => void;

  /** 사용자가 추가로 넣고 싶은 이미지들(상세 생성 참고) */
  extraImages: string[];
  onAddExtraImages: (dataUrls: string[]) => void;
  onRemoveExtraImage: (index: number) => void;

  /** 사용자가 추가로 넣고 싶은 프롬프트(상세 기획/생성에 반영) */
  finalExtraPrompt: string;
  onChangeFinalExtraPrompt: (v: string) => void;

  onNext: () => void;
  canPlan: boolean;
};

const CUT_TABS: Array<{ key: DetailShotKey; label: string }> = [
  { key: "cutout", label: "누끼컷" },
  { key: "lifestyle", label: "활용컷" },
  { key: "model", label: "모델컷" },
];

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function filesToDataUrls(files: FileList): Promise<string[]> {
  const arr = Array.from(files);
  const out: string[] = [];
  for (const f of arr) out.push(await fileToDataUrl(f));
  return out;
}

const Step3FinalComposeCard: React.FC<Props> = ({
  info,
  setInfo,
  finalCuts,
  onUploadFinalCut,
  onClearFinalCut,
  extraImages,
  onAddExtraImages,
  onRemoveExtraImage,
  finalExtraPrompt,
  onChangeFinalExtraPrompt,
  onNext,
  canPlan,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black flex items-center justify-center">
            3
          </div>
          <div className="text-lg font-extrabold text-slate-900">
            최종 이미지 + 상세페이지 길이
          </div>
        </div>

        <div
          className={[
            "text-xs font-black px-2 py-1 rounded-full border",
            open
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-slate-50 text-slate-600 border-slate-200",
          ].join(" ")}
        >
          {open ? "접기" : "펼치기"}
        </div>
      </button>

      {open && (
        <div className="mt-6 space-y-8">
          {/* Final cut slots */}
          <div className="space-y-3">
            <div className="text-sm font-extrabold text-slate-900">
              최종 컷 선택(또는 업로드)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CUT_TABS.map((t) => {
                const picked = finalCuts[t.key];
                return (
                  <div
                    key={t.key}
                    className="rounded-2xl border border-slate-200 overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="text-sm font-extrabold text-slate-900">
                        {t.label}
                      </div>
                      {picked && (
                        <button
                          type="button"
                          onClick={() => onClearFinalCut(t.key)}
                          className="text-xs font-black text-slate-600 hover:text-slate-900"
                        >
                          제거
                        </button>
                      )}
                    </div>

                    <div className="aspect-square bg-slate-100 flex items-center justify-center">
                      {picked ? (
                        <img
                          src={picked}
                          alt={`final-${t.key}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-xs text-slate-500 px-4 text-center">
                          선택된 최종 컷이 없습니다.
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-2">
                      {/* 버튼형 업로드 */}
                      <label className="block">
                        <span className="block text-xs font-bold text-slate-600 mb-2">
                          파일 업로드(대체/추가)
                        </span>

                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const input = e.currentTarget; // ✅ 먼저 잡아두기
                              const f = input.files?.[0];
                              if (!f) return;

                              const dataUrl = await fileToDataUrl(f);
                              onUploadFinalCut(t.key, dataUrl);

                              input.value = ""; // ✅ await 이후에도 안전
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <div className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition text-xs font-extrabold text-slate-800 text-center">
                            이미지 선택하기
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-xs text-slate-500">
              * Step2에서 “최종으로 선택”한 컷을 그대로 쓰거나, 여기서 직접
              업로드할 수 있습니다.
            </div>
          </div>

          {/* Extra images (multi) */}
          <div className="space-y-3">
            <div className="text-sm font-extrabold text-slate-900">
              추가로 넣고 싶은 이미지(선택)
            </div>
            <div className="text-xs text-slate-500">
              * 사용자가 직접 보정/촬영한 이미지도 추가로 넣을 수 있습니다. 상세
              이미지 생성 시 참고됩니다.
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <label className="inline-block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const input = e.currentTarget; // ✅ await 전에 캡처
                    const files = input.files;
                    if (!files || files.length === 0) return;

                    const dataUrls = await filesToDataUrls(files);
                    onAddExtraImages(dataUrls);

                    input.value = ""; // ✅ 안전
                  }}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-extrabold text-sm hover:bg-slate-950 cursor-pointer">
                  + 이미지 추가
                </span>
              </label>

              <span className="text-xs font-bold text-slate-600">
                현재 {extraImages.length}개
              </span>
            </div>

            {extraImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {extraImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 overflow-hidden bg-white"
                  >
                    <div className="aspect-square bg-slate-100">
                      <img
                        src={img}
                        alt={`extra-${idx}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => onRemoveExtraImage(idx)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-extrabold text-xs hover:bg-slate-50"
                      >
                        제거
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extra prompt */}
          <div className="space-y-2">
            <label className="text-sm font-extrabold text-slate-900">
              추가 요청 프롬프트(선택)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 전체 톤은 따뜻하게, 기능 강조는 과장 없이, 신뢰감 있는 문장으로. 가격은 딜 섹션에서만 1회 노출."
              value={finalExtraPrompt}
              onChange={(e) => onChangeFinalExtraPrompt(e.target.value)}
            />
          </div>

          {/* Page length */}
          <div className="space-y-4">
            <label className="block text-sm font-extrabold text-slate-900">
              상세페이지 길이
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.values(PageLength).map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() =>
                    setInfo({ ...info, pageLength: len as PageLength })
                  }
                  className={[
                    "px-4 py-3 rounded-xl border text-sm font-extrabold transition-all",
                    info.pageLength === len
                      ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-400",
                  ].join(" ")}
                >
                  {len === PageLength.AUTO
                    ? "AI 추천"
                    : `${len}장 (${len === "5" ? "Short" : len === "7" ? "Standard" : "Long"})`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3FinalComposeCard;
