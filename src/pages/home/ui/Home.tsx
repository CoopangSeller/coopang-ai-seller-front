import React, { useState } from "react";
import { DetailPlanner } from "@/widgets/detail-page-generator";
import ThumbnailGenerator from "@/widgets/tumbnail-generator";
import { Footer } from "@/widgets/layout/";

type Tab = "detail" | "thumbnail";

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("detail");

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-sky-400 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
              S
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">
                AI Sync Club
              </h1>
              <p className="text-[10px] font-bold text-blue-500 tracking-widest uppercase mt-1">
                Winning Logic Builder
              </p>
            </div>
          </div>

          <nav className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab("detail")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "detail"
                  ? "bg-white text-blue-600 shadow-md ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              상세페이지 제작
            </button>
            <button
              onClick={() => setActiveTab("thumbnail")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "thumbnail"
                  ? "bg-white text-blue-600 shadow-md ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              썸네일 제작
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-blue-50 to-transparent pt-12 pb-6 px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
          {activeTab === "detail"
            ? "팔리는 상세페이지, AI로 1분 만에."
            : "시선을 끄는 썸네일, AI로 한 번에."}
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto font-medium">
          {activeTab === "detail"
            ? "상품 정보만 입력하면 전문 기획자의 판매 논리가 적용된 고퀄리티 세로 상세페이지를 일괄 생성합니다."
            : "클릭을 부르는 고품질 1:1 썸네일을 다양한 스타일로 제작하고 이미지를 편집하세요."}
        </p>
      </div>

      {/* Main */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        {activeTab === "detail" ? <DetailPlanner /> : <ThumbnailGenerator />}
      </main>

      <Footer />
    </div>
  );
};

export default Home;
