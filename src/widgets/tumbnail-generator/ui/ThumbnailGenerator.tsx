import React, { useState } from "react";
import { ReferenceImageUpload } from "@/features/reference-image-upload";
import { ThumbnailConfig, ModelType } from "@/shared/types/types";
import { generateImage } from "@/shared/api/gemini/geminiService";

const ThumbnailGenerator: React.FC = () => {
  const [config, setConfig] = useState<ThumbnailConfig>({
    productName: "",
    features: "",
    style: "Clean",
    hasPerson: false,
    textPosition: "bottom",
    referenceImages: [],
  });

  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modelType, setModelType] = useState<ModelType>(ModelType.FREE);

  const handleGenerate = async () => {
    if (!config.productName) return;
    setLoading(true);
    try {
      const prompt = `A professional ecommerce thumbnail for ${
        config.productName
      }. 
      Style: ${config.style}. ${config.features}. 
      ${
        config.hasPerson
          ? "Including a professional human model showcasing the product."
          : "Product focused shot."
      }
      Clean commercial look, studio lighting.`;

      const imageUrl = await generateImage(
        prompt,
        modelType,
        "1:1",
        config.referenceImages
      );
      setResultImage(imageUrl);
    } catch (e) {
      alert("썸네일 생성 중 오류가 발생했습니다.");
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 space-y-6 h-fit">
        <h2 className="text-2xl font-bold text-slate-800">썸네일 제작 설정</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              상품명
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 갤럭시 버즈 프로 3"
              value={config.productName}
              onChange={(e) =>
                setConfig({ ...config, productName: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              강조하고 싶은 특징
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 가죽 케이스 장착, 은은한 무드등 효과"
              value={config.features}
              onChange={(e) =>
                setConfig({ ...config, features: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              스타일 선택
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Clean", "Lifestyle", "Creative"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setConfig({ ...config, style: s })}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    config.style === s
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  {s === "Clean"
                    ? "깔끔한"
                    : s === "Lifestyle"
                    ? "라이프스타일"
                    : "창의적인"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="person"
              checked={config.hasPerson}
              onChange={(e) =>
                setConfig({ ...config, hasPerson: e.target.checked })
              }
              className="w-5 h-5 rounded text-blue-600"
            />
            <label
              htmlFor="person"
              className="text-sm font-medium text-slate-700"
            >
              인물 모델 포함 여부
            </label>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-sm font-semibold text-slate-700">
              모델 등급 선택
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={modelType === ModelType.FREE}
                  onChange={() => setModelType(ModelType.FREE)}
                  className="text-blue-600"
                />
                <span className="text-sm">무료 (Flash)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={modelType === ModelType.PAID}
                  onChange={() => setModelType(ModelType.PAID)}
                  className="text-blue-600"
                />
                <span className="text-sm font-bold text-blue-700">
                  유료 (Nanobanana Pro)
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <ReferenceImageUpload
              value={config.referenceImages ?? []}
              onChange={(imgs) =>
                setConfig((prev) => ({ ...prev, referenceImages: imgs }))
              }
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !config.productName}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {loading ? "생성 중..." : "썸네일 생성하기"}
        </button>
      </div>

      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative w-full max-w-[500px] aspect-square bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-white flex items-center justify-center">
          {resultImage ? (
            <img
              src={resultImage}
              alt="Generated Thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-slate-300">
              <div className="w-20 h-20 mb-4 border-4 border-dashed border-slate-200 rounded-full flex items-center justify-center">
                <span className="text-4xl">+</span>
              </div>
              <p className="font-medium text-slate-400">
                설정 후 생성을 눌러주세요
              </p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {resultImage && (
          <a
            href={resultImage}
            download={`${config.productName}_thumbnail.png`}
            className="px-8 py-3 bg-slate-800 text-white font-bold rounded-full hover:bg-slate-900 transition-all flex items-center gap-2"
          >
            <span>다운로드 하기</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default ThumbnailGenerator;
