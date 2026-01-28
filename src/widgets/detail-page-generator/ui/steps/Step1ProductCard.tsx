import React, { useState } from "react";
import { ProductInfo, Pricing } from "@/shared/types/types";

type Props = {
  info: ProductInfo;
  setInfo: React.Dispatch<React.SetStateAction<ProductInfo>>;

  competitorUrl: string;
  setCompetitorUrl: (v: string) => void;
  competitorPaste: string;
  setCompetitorPaste: (v: string) => void;

  uspLoading: boolean;
  onSuggestUSP: () => Promise<void>;

  resetAll: () => void;
};

function normalizeWhitespace(s: string) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

const Step1ProductCard: React.FC<Props> = ({ info, setInfo, resetAll }) => {
  const [open, setOpen] = useState(true);

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

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black flex items-center justify-center">
              1
            </div>
            <div className="text-lg font-extrabold text-slate-900">
              상품 정보 입력
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

        <button
          type="button"
          onClick={resetAll}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-extrabold text-xs hover:bg-slate-50"
          title="드래프트/선택/프리뷰 모두 초기화"
        >
          입력 초기화
        </button>
      </div>

      {open && (
        <div className="mt-6 space-y-8">
          {/* 상품명/카테고리 */}
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
                onChange={(e) => setInfo({ ...info, category: e.target.value })}
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

          {/* USP */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              핵심 특징 (USP)
            </label>
            <textarea
              rows={4}
              placeholder="상품의 가장 큰 장점들을 적어주세요. (예: 24시간 보온 보냉, 150g의 가벼운 무게...)"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              value={info.features}
              onChange={(e) => setInfo({ ...info, features: e.target.value })}
            />
          </div>

          {/* 타겟 */}
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
                    className={[
                      "px-4 py-2 rounded-full border text-sm transition-all",
                      info.targetGender.includes(g)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400",
                    ].join(" ")}
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
                      className={[
                        "px-4 py-2 rounded-full border text-sm transition-all",
                        info.targetAge.includes(age)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400",
                      ].join(" ")}
                    >
                      {age}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* 공통 레퍼런스 */}
          <div className="text-xs text-slate-500">
            * 공통 레퍼런스(상세 생성에 참고되는 이미지)는 Step3에서 추가 업로드
            가능합니다.
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1ProductCard;
