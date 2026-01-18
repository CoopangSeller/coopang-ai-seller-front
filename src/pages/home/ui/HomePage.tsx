import React, { useEffect, useState } from "react";
import { DetailPlanner } from "@/widgets/detail-page-generator";
import ThumbnailGenerator from "@/widgets/tumbnail-generator";
import { Header, AppMenuKey, Footer } from "@/widgets/layout/";
import { session, useSession } from "@/entities/session/model/sessionStore";
import { useNavigate } from "react-router-dom";

import { lsGet, lsSet } from "@/shared/lib/storage/storage";
import { STORAGE_KEYS } from "@/shared/config/storageKyes";
import { pushRecentPage } from "@/features/recent-pages/model/recentPages";

function tabLabel(tab: AppMenuKey) {
  if (tab === "detail") return "상세페이지 제작";
  if (tab === "thumbnail") return "썸네일 제작";
  return String(tab);
}

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppMenuKey>(() => {
    const saved = lsGet<AppMenuKey>(STORAGE_KEYS.HOME_ACTIVE_TAB);
    return saved ?? "detail";
  });

  const nav = useNavigate();

  const { accessToken, username } = useSession();
  const isAuthed = !!accessToken;

  const onLogout = () => {
    session.clear();
    nav("/");
  };

  // ✅ 탭 변경 기록 + 마지막 탭 저장
  useEffect(() => {
    lsSet(STORAGE_KEYS.HOME_ACTIVE_TAB, activeTab);
    pushRecentPage(activeTab, tabLabel(activeTab));
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header
        isAuthed={isAuthed}
        welcomeText={`${username ?? "게스트"}님 환영합니다`}
        active={activeTab}
        onSelect={setActiveTab}
        onLogout={onLogout}
        brandTag="AI SELLER TOOLKIT"
      />

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

export default HomePage;
