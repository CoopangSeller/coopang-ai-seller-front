import React from "react";

const DetailPageScheduledPage: React.FC = () => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-xl font-black text-slate-900">
        상세페이지 예약 생성
      </div>
      <div className="mt-2 text-sm text-slate-600 font-medium">
        서버 없음(클라이언트 단독) 기준: 예약은 localStorage 큐 + 브라우저 실행
        시 처리 방식으로 설계 예정
      </div>
    </div>
  );
};

export default DetailPageScheduledPage;
