import React, { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import {
  ProductInfo,
  PageLength,
  DetailImageSegment,
  ModelType,
} from "@/shared/types/types";
import Step1Input from "./Step1Input";
import {
  planDetailPage,
  generateImage,
} from "@/shared/api/gemini/geminiService";

const DetailPlanner: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [modelType, setModelType] = useState<ModelType>(ModelType.FREE);

  const [info, setInfo] = useState<ProductInfo>({
    name: "",
    category: "",
    price: "",
    features: "",
    targetGender: ["전체"],
    targetAge: ["30대"],
    pageLength: PageLength.STANDARD,
    referenceImages: [],
  });

  const [segments, setSegments] = useState<DetailImageSegment[]>([]);

  // Step3 캡처 대상 refs
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 다운로드 진행 상태
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({
    current: 0,
    total: 0,
    phase: "idle" as "idle" | "capture" | "zip" | "done",
  });

  // UI 프레임 양보(멈춘 느낌 방지)
  const nextFrame = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handlePlan = async () => {
    setLoading(true);
    try {
      const result = await planDetailPage(info);
      setSegments(result);
      setStep(2);
    } catch (e) {
      alert("기획안 생성 중 오류가 발생했습니다.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    setLoading(true);
    setStep(3);

    const updatedSegments = [...segments];

    for (let i = 0; i < updatedSegments.length; i++) {
      try {
        updatedSegments[i] = { ...updatedSegments[i], isGenerating: true };
        setSegments([...updatedSegments]);

        const imageUrl = await generateImage(
          updatedSegments[i].visualPrompt,
          modelType,
          "9:16",
          info.referenceImages
        );

        updatedSegments[i] = {
          ...updatedSegments[i],
          imageUrl: imageUrl ?? undefined,
          isGenerating: false,
        };
        setSegments([...updatedSegments]);
      } catch (e) {
        console.error("Generation error for segment", i, e);
        updatedSegments[i] = { ...updatedSegments[i], isGenerating: false };
        setSegments([...updatedSegments]);
      }
    }

    setLoading(false);
  };

  const updateSegment = (
    index: number,
    field: keyof DetailImageSegment,
    value: string
  ) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setSegments(newSegments);
  };

  // -----------------------
  // ZIP 다운로드(한방에)
  // -----------------------
  const downloadZip = async (format: "webp" | "jpg") => {
    const scale = 2; // 선명도/속도 밸런스 (더 빠르게: 1.5)
    const webpQuality = 0.9; // 더 빠르게/저용량: 0.85
    const jpgQuality = 0.95;

    const zip = new JSZip();
    const folderName = info.name?.trim()
      ? info.name.trim().replace(/[\\/:*?"<>|]/g, "_")
      : "detail_pages";
    const folder = zip.folder(folderName) ?? zip;

    try {
      setDownloading(true);

      // 캡처 대상만 추림(이미지가 생성된 페이지)
      const targets = pageRefs.current
        .map((node, i) => ({ node, i }))
        .filter((x) => x.node && segments[x.i]?.imageUrl);

      setDownloadProgress({
        current: 0,
        total: targets.length,
        phase: "capture",
      });

      // 렌더 안정화
      await nextFrame();
      await sleep(30);

      for (let k = 0; k < targets.length; k++) {
        const { node, i } = targets[k];
        if (!node) continue;

        setDownloadProgress((p) => ({
          ...p,
          current: k + 1,
          phase: "capture",
        }));

        // UI 반응성 유지
        await nextFrame();

        let dataUrl: string;
        if (format === "webp") {
          const canvas = await htmlToImage.toCanvas(node, {
            pixelRatio: scale,
            backgroundColor: "#ffffff",
          });
          dataUrl = canvas.toDataURL("image/webp", webpQuality);
        } else {
          dataUrl = await htmlToImage.toJpeg(node, {
            pixelRatio: scale,
            quality: jpgQuality,
            backgroundColor: "#ffffff",
          });
        }

        const blob = await (await fetch(dataUrl)).blob();
        const ext = format === "webp" ? "webp" : "jpg";
        const fileName = `detail_${String(i + 1).padStart(2, "0")}.${ext}`;
        folder.file(fileName, blob);
      }

      setDownloadProgress((p) => ({ ...p, phase: "zip" }));
      await nextFrame();

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      saveAs(zipBlob, `${folderName}_${format}.zip`);

      setDownloadProgress((p) => ({ ...p, phase: "done" }));
      await sleep(200);
    } catch (e) {
      console.error(e);
      alert("ZIP 생성/다운로드 중 오류가 발생했습니다.");
    } finally {
      setDownloading(false);
      setDownloadProgress({ current: 0, total: 0, phase: "idle" });
    }
  };

  return (
    <div className="w-full">
      {step === 1 && (
        <Step1Input info={info} setInfo={setInfo} onNext={handlePlan} />
      )}

      {step === 2 && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">
              2단계: 기획안 검토 및 수정
            </h2>

            <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-xs text-slate-500 mb-1 font-semibold">
                  모델 선택
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModelType(ModelType.FREE)}
                    className={`px-3 py-1 rounded-md text-xs border transition-all ${
                      modelType === ModelType.FREE
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    무료 (Flash)
                  </button>
                  <button
                    onClick={() => setModelType(ModelType.PAID)}
                    className={`px-3 py-1 rounded-md text-xs border transition-all ${
                      modelType === ModelType.PAID
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    유료 (Nanobanana Pro)
                  </button>
                </div>
              </div>

              <button
                onClick={handleGenerateAll}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
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
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      {seg.logicalSections?.join(" | ") || "기획 전략"}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800">
                      {seg.title}
                    </h3>
                  </div>
                  <span className="text-slate-400 font-mono">#0{idx + 1}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">
                    한글 카피 (Key Message)
                  </label>
                  <input
                    className="w-full p-3 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium"
                    value={seg.keyMessage}
                    onChange={(e) =>
                      updateSegment(idx, "keyMessage", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">
                    이미지 생성 프롬프트 (Visual Prompt)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full p-3 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700 italic"
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
      )}

      {step === 3 && (
        <div className="max-w-2xl mx-auto space-y-10 pb-20">
          <div className="sticky top-4 z-50 flex justify-between items-center bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-blue-50 mb-8">
            <h2 className="text-lg font-bold text-slate-800">
              결과물 미리보기
            </h2>

            <div className="flex gap-2 flex-wrap justify-end">
              <button
                disabled={downloading}
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                기획안으로 돌아가기
              </button>

              <button
                disabled={downloading}
                onClick={() => downloadZip("webp")}
                className="px-6 py-2 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? "ZIP 생성 중..." : "ZIP 저장 (WebP)"}
              </button>

              <button
                disabled={downloading}
                onClick={() => downloadZip("jpg")}
                className="px-6 py-2 text-sm bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? "ZIP 생성 중..." : "ZIP 저장 (JPG)"}
              </button>
            </div>
          </div>

          <div className="flex flex-col shadow-2xl rounded-2xl overflow-hidden bg-slate-200">
            {segments.map((seg, idx) => (
              <div
                key={seg.id || idx}
                ref={(el) => (pageRefs.current[idx] = el)}
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
                      <p className="text-white text-3xl font-bold leading-tight drop-shadow-lg whitespace-pre-line">
                        {seg.keyMessage}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    {seg.isGenerating ? (
                      <>
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium animate-pulse">
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

          {/* 다운로드 진행 오버레이 */}
          {downloading && (
            <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800">
                    다운로드 준비 중
                  </h3>
                  <span className="text-xs text-slate-500">
                    {downloadProgress.phase === "capture"
                      ? "캡처/인코딩"
                      : downloadProgress.phase === "zip"
                      ? "압축 중"
                      : "완료"}
                  </span>
                </div>

                <div className="text-sm text-slate-600">
                  {downloadProgress.total > 0 ? (
                    <>
                      {downloadProgress.current} / {downloadProgress.total}{" "}
                      페이지 처리 중...
                    </>
                  ) : (
                    <>대상 페이지를 준비 중...</>
                  )}
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-3 bg-blue-600 rounded-full transition-all"
                    style={{
                      width:
                        downloadProgress.total > 0
                          ? `${Math.round(
                              (downloadProgress.current /
                                downloadProgress.total) *
                                100
                            )}%`
                          : "10%",
                    }}
                  />
                </div>

                <div className="text-xs text-slate-500">
                  페이지 수가 많거나 고해상도일수록 시간이 더 걸립니다.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-4 max-w-sm text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-xl font-bold text-slate-800">
              AI가 열심히 작업 중입니다
            </h3>
            <p className="text-slate-500">
              최상의 팔리는 논리를 구성하고 있습니다. 잠시만 기다려주세요!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailPlanner;
