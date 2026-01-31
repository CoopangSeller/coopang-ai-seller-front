import React from "react";

const ThumbnailGalleryPage: React.FC = () => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-xl font-black text-slate-900">썸네일 조회</div>
      <div className="mt-2 text-sm text-slate-600 font-medium">
        추후: 생성 썸네일 히스토리/버전/다운로드
      </div>
    </div>
  );
};

export default ThumbnailGalleryPage;
