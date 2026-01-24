// src/widgets/detail-page-generator/ui/Step1Input.tsx

import React, { useState } from "react";
import {
  DetailShotKey,
  ModelType,
  PageLength,
  ProductInfo,
  Pricing,
} from "@/shared/types/types";
import { ReferenceImageUpload } from "@/features/file/image-upload";

type Props = {
  info: ProductInfo;
  setInfo: React.Dispatch<React.SetStateAction<ProductInfo>>;

  modelType: ModelType;
  onChangeModelType: (m: ModelType) => void;

  cutTab: DetailShotKey;
  onChangeCutTab: (t: DetailShotKey) => void;

  cutPreviews: Record<DetailShotKey, string[]>;
  generatingCut: boolean;
  onGenerateCut: (key: DetailShotKey) => Promise<void>;
  onPickFinalCut: (key: DetailShotKey, imageDataUrl: string) => void;

  finalCuts: Record<DetailShotKey, string | null>;
  onUploadFinalCut: (key: DetailShotKey, dataUrl: string) => void;
  onClearFinalCut: (key: DetailShotKey) => void;

  competitorUrl: string;
  setCompetitorUrl: (v: string) => void;
  competitorPaste: string;
  setCompetitorPaste: (v: string) => void;
  uspLoading: boolean;
  onSuggestUSP: () => Promise<void>;

  onNext: () => void;
};

const CUT_TABS: Array<{ key: DetailShotKey; label: string; desc: string }> = [
  { key: "cutout", label: "누끼컷", desc: "배경 깨끗한 제품 단독 컷" },
  { key: "lifestyle", label: "활용컷", desc: "사용 장면/상황 연출 컷" },
  { key: "model", label: "모델컷", desc: "사람 착용/사용 컷" },
];

function normalizeWhitespace(s: string) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const Step1Input: React.FC<Props> = ({
  info,
  setInfo,

  modelType,
  onChangeModelType,

  cutTab,
  onChangeCutTab,
  cutPreviews,
  generatingCut,
  onGenerateCut,
  onPickFinalCut,

  finalCuts,
  onUploadFinalCut,
  onClearFinalCut,

  competitorUrl,
  setCompetitorUrl,
  competitorPaste,
  setCompetitorPaste,
  uspLoading,
  onSuggestUSP,

  onNext,
}) => {
  const [open1, setOpen1] = useState(true);
  const [open2, setOpen2] = useState(true);
  const [open3, setOpen3] = useState(true);

  const toggleSelection = (
    field: "targetGender" | "targetAge",
    value: string,
  ) =>
    setInfo((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));

  const currentShot = info.shots[cutTab];

  const canPlan =
    normalizeWhitespace(info.name).length > 0 &&
    normalizeWhitespace(info.category).length > 0;

  const finalReady =
    !!finalCuts.cutout || !!finalCuts.lifestyle || !!finalCuts.model;

  const renderCardHeader = (
    n: 1 | 2 | 3,
    title: string,
    open: boolean,
    onToggle: () => void,
  ) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black flex items-center justify-center">
          {n}
        </div>
        <div className="text-lg font-extrabold text-slate-900">{title}</div>
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
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100">
        {renderCardHeader(1, "상품 정보 입력", open1, () =>
          setOpen1((v) => !v),
        )}

        {open1 && (
          <div className="mt-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  상품명
                </label>
                <input
                  type="text"
                  placeholder="예: 초경량 티타늄 텀블러"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={info.name}
                  onChange={(e) => setInfo({ ...info, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  카테고리
                </label>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={info.category}
                  onChange={(e) =>
                    setInfo({ ...info, category: e.target.value })
                  }
                >
                  <option value="">선택해주세요</option>
                  <option value="패션">패션/의류</option>
                  <option value="식품">식품</option>
                  <option value="리빙">리빙/가구</option>
                  <option value="디지털">디지털/가전</option>
                  <option value="뷰티">뷰티</option>
                  <option value="기타">기타</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-700">
                가격 정보 (선택)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">
                    정상가
                  </label>
                  <input
                    type="text"
                    placeholder="예: 39,900"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={info.pricing?.originalPrice ?? ""}
                    onChange={(e) =>
                      setInfo((p) => ({
                        ...p,
                        pricing: {
                          ...(p.pricing as Pricing),
                          originalPrice: e.target.value,
                          salePrice: p.pricing?.salePrice ?? "",
                        },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">
                    할인가
                  </label>
                  <input
                    type="text"
                    placeholder="예: 29,900"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={info.pricing?.salePrice ?? ""}
                    onChange={(e) =>
                      setInfo((p) => ({
                        ...p,
                        pricing: {
                          ...(p.pricing as Pricing),
                          originalPrice: p.pricing?.originalPrice ?? "",
                          salePrice: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500">
                * 가격은 최대 1회만 노출되도록 기획안에서 제어합니다.
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                핵심 특징 (USP)
              </label>
              <textarea
                rows={4}
                placeholder="상품의 가장 큰 장점들을 적어주세요."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={info.features}
                onChange={(e) => setInfo({ ...info, features: e.target.value })}
              />

              <div className="mt-4 p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="text-sm font-extrabold text-slate-800">
                  USP 자동 작성 (쿠팡 참고 상품)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="쿠팡 참고 상품 URL (선택)"
                    value={competitorUrl}
                    onChange={(e) => setCompetitorUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={onSuggestUSP}
                    disabled={uspLoading}
                    className="px-4 py-3 rounded-lg font-extrabold bg-slate-900 text-white hover:bg-slate-950 disabled:opacity-50"
                  >
                    {uspLoading ? "분석 중..." : "AI로 USP 작성하기"}
                  </button>
                </div>

                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder={[
                    "쿠팡 페이지에서 보이는 소구점/스펙/후기 키워드 등을 아래에 붙여넣고 실행하세요.",
                  ].join("\n")}
                  value={competitorPaste}
                  onChange={(e) => setCompetitorPaste(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                타겟 설정
              </label>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {["남성", "여성", "전체"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleSelection("targetGender", g)}
                      className={`px-4 py-2 rounded-full border text-sm transition-all ${
                        info.targetGender.includes(g)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {["10대", "20대", "30대", "40대", "50대", "60대+"].map(
                    (age) => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => toggleSelection("targetAge", age)}
                        className={`px-4 py-2 rounded-full border text-sm transition-all ${
                          info.targetAge.includes(age)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400"
                        }`}
                      >
                        {age}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100">
        {renderCardHeader(2, "AI 컷 준비 (누끼/활용/모델)", open2, () =>
          setOpen2((v) => !v),
        )}

        {open2 && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              {CUT_TABS.map((t) => {
                const active = t.key === cutTab;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => onChangeCutTab(t.key)}
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
                {CUT_TABS.find((x) => x.key === cutTab)?.label}
              </span>
              <span className="ml-2">
                {CUT_TABS.find((x) => x.key === cutTab)?.desc}
              </span>
            </div>

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
                  onClick={() => onChangeModelType(ModelType.FREE)}
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
                  onClick={() => onChangeModelType(ModelType.PAID)}
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

            <div className="space-y-3">
              <div className="text-sm font-extrabold text-slate-900">
                레퍼런스 이미지 (탭별)
              </div>
              <ReferenceImageUpload
                value={currentShot.referenceImages ?? []}
                onChange={(imgs) =>
                  setInfo((prev) => ({
                    ...prev,
                    shots: {
                      ...prev.shots,
                      [cutTab]: {
                        ...prev.shots[cutTab],
                        referenceImages: imgs,
                      },
                    },
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-extrabold text-slate-900">
                의도 입력 (탭별)
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  cutTab === "cutout"
                    ? "예: 배경 완전 흰색, 제품 정면 3/4 각도, 가장자리 깨끗하게"
                    : cutTab === "lifestyle"
                      ? "예: 주방 테이블 위 사용 장면, 자연광, 소품 1개 이내"
                      : "예: 성인 모델 1명 착용, 제품이 주인공, 과한 포즈 금지"
                }
                value={currentShot.prompt ?? ""}
                onChange={(e) =>
                  setInfo((prev) => ({
                    ...prev,
                    shots: {
                      ...prev.shots,
                      [cutTab]: {
                        ...prev.shots[cutTab],
                        prompt: e.target.value,
                      },
                    },
                  }))
                }
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onGenerateCut(cutTab)}
                disabled={generatingCut}
                className="px-5 py-3 rounded-xl bg-blue-600 text-white font-extrabold hover:bg-blue-700 disabled:opacity-50"
              >
                {generatingCut ? "생성 중..." : "미리 생성하기"}
              </button>

              <div className="text-xs text-slate-500 flex items-center">
                * 생성된 이미지는 다운로드 후 Step3에 넣을 수 있습니다.
              </div>
            </div>

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

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100">
        {renderCardHeader(3, "최종 이미지 + 상세페이지 길이", open3, () =>
          setOpen3((v) => !v),
        )}

        {open3 && (
          <div className="mt-6 space-y-8">
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
                        <label className="block text-xs font-bold text-slate-600">
                          파일 업로드(직접 작업한 이미지 포함)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const dataUrl = await fileToDataUrl(f);
                            onUploadFinalCut(t.key, dataUrl);
                            e.currentTarget.value = "";
                          }}
                          className="block w-full text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-slate-500">
                * Step2에서 만든 이미지를 선택하거나, 여기서 직접 업로드할 수
                있습니다.
              </div>
            </div>

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
                    className={`px-4 py-3 rounded-xl border text-sm font-extrabold transition-all ${
                      info.pageLength === len
                        ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100"
                        : "bg-white text-slate-700 border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    {len === PageLength.AUTO
                      ? "AI 추천"
                      : `${len}장 (${
                          len === "5"
                            ? "Short"
                            : len === "7"
                              ? "Standard"
                              : "Long"
                        })`}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onNext}
              disabled={!canPlan || !finalReady}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              기획안 생성하기
            </button>

            {!finalReady && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                Step3에서 최종 컷(누끼/활용/모델 중 최소 1개)을 선택하거나
                업로드해야 합니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step1Input;
