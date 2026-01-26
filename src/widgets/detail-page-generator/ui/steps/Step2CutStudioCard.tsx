import React, { useMemo, useState } from "react";
import { DetailShotKey, ModelType, ProductInfo } from "@/shared/types/types";
import { ReferenceImageUpload } from "@/features/file/image-upload";

type Props = {
  info: ProductInfo;
  setInfo: React.Dispatch<React.SetStateAction<ProductInfo>>;

  modelType: ModelType;
  setModelType: (m: ModelType) => void;

  cutTab: DetailShotKey;
  setCutTab: (t: DetailShotKey) => void;

  cutPreviews: Record<DetailShotKey, string[]>;
  generatingCut: boolean;
  onGenerateCut: (key: DetailShotKey) => Promise<void>;
  onPickFinalCut: (key: DetailShotKey, imageDataUrl: string) => void;
};

const CUT_TABS: Array<{ key: DetailShotKey; label: string; desc: string }> = [
  { key: "cutout", label: "누끼컷", desc: "배경 깨끗한 제품 단독 컷" },
  { key: "lifestyle", label: "활용컷", desc: "사용 장면/상황 연출 컷" },
  { key: "model", label: "모델컷", desc: "사람 착용/사용 컷" },
];

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const Step2CutStudioCard: React.FC<Props> = ({
  info,
  setInfo,
  modelType,
  setModelType,
  cutTab,
  setCutTab,
  cutPreviews,
  generatingCut,
  onGenerateCut,
  onPickFinalCut,
}) => {
  const [open, setOpen] = useState(false);

  const currentShot = info.shots[cutTab];

  const tabMeta = useMemo(
    () => CUT_TABS.find((t) => t.key === cutTab),
    [cutTab],
  );

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black flex items-center justify-center">
            2
          </div>
          <div className="text-lg font-extrabold text-slate-900">
            AI 컷 준비 (누끼/활용/모델)
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
        <div className="mt-6 space-y-6">
          {/* 탭 */}
          <div className="flex flex-wrap gap-2">
            {CUT_TABS.map((t) => {
              const active = t.key === cutTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setCutTab(t.key)}
                  className={[
                    "px-4 py-2 rounded-xl border text-sm font-extrabold transition",
                    active
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                  title={t.desc}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="text-sm text-slate-600">
            <span className="font-extrabold text-slate-900">
              {tabMeta?.label}
            </span>
            <span className="ml-2">{tabMeta?.desc}</span>
          </div>

          {/* 모델 선택 */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                이미지 생성 모델
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                무료(Flash) / 유료(Pro)
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModelType(ModelType.FREE)}
                className={[
                  "px-3 py-2 rounded-lg border text-xs font-black transition",
                  modelType === ModelType.FREE
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-700 border-slate-200",
                ].join(" ")}
              >
                무료
              </button>

              <button
                type="button"
                onClick={() => setModelType(ModelType.PAID)}
                className={[
                  "px-3 py-2 rounded-lg border text-xs font-black transition",
                  modelType === ModelType.PAID
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-700 border-slate-200",
                ].join(" ")}
              >
                Pro
              </button>
            </div>
          </div>

          {/* 레퍼런스 업로드 */}
          <div className="space-y-3">
            <ReferenceImageUpload
              value={currentShot.referenceImages ?? []}
              onChange={(imgs) =>
                setInfo((prev) => ({
                  ...prev,
                  shots: {
                    ...prev.shots,
                    [cutTab]: { ...prev.shots[cutTab], referenceImages: imgs },
                  },
                }))
              }
            />
          </div>

          {/* 의도 프롬프트 */}
          <div className="space-y-2">
            <label className="text-sm font-extrabold text-slate-900">
              의도 입력 (탭별)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                cutTab === "cutout"
                  ? "예: 배경 완전 흰색, 제품 정면 3/4 각도, 로고/텍스트 생성 금지, 가장자리 깨끗하게"
                  : cutTab === "lifestyle"
                    ? "예: 주방 테이블 위 사용 장면, 자연광, 소품 1개 이내, 제품이 주인공"
                    : "예: 성인 모델 1명 착용, 과장된 포즈 금지, 제품이 더 돋보이게"
              }
              value={currentShot.prompt ?? ""}
              onChange={(e) =>
                setInfo((prev) => ({
                  ...prev,
                  shots: {
                    ...prev.shots,
                    [cutTab]: { ...prev.shots[cutTab], prompt: e.target.value },
                  },
                }))
              }
            />
          </div>

          {/* 미리 생성 */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onGenerateCut(cutTab)}
              disabled={generatingCut}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white font-extrabold hover:bg-blue-700 disabled:opacity-50"
            >
              {generatingCut ? "생성 중..." : "미리 생성하기(3장)"}
            </button>

            <div className="text-xs text-slate-500 flex items-center">
              * 생성 후 다운로드 / Step3에서 최종 컷으로 선택
            </div>
          </div>

          {/* 미리보기 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(cutPreviews[cutTab] ?? []).map((img, idx) => (
              <div
                key={`${cutTab}-${idx}`}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="aspect-square bg-slate-100">
                  <img
                    src={img}
                    alt={`${cutTab}-preview-${idx}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadDataUrl(
                        img,
                        `${info.name || "cut"}_${cutTab}_${idx + 1}.png`,
                      )
                    }
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-extrabold text-xs hover:bg-slate-50"
                  >
                    다운로드
                  </button>

                  <button
                    type="button"
                    onClick={() => onPickFinalCut(cutTab, img)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-950"
                  >
                    최종으로 선택
                  </button>
                </div>
              </div>
            ))}

            {(cutPreviews[cutTab] ?? []).length === 0 && (
              <div className="col-span-full text-sm text-slate-500">
                아직 미리 생성된 이미지가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2CutStudioCard;
