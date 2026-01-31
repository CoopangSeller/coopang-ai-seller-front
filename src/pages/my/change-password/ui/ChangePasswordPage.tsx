import React from "react";

const ChangePasswordPage: React.FC = () => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-xl font-black text-slate-900">비밀번호 변경</div>
      <div className="mt-2 text-sm text-slate-600 font-medium">
        추후: API 연동 시 비밀번호 변경 폼 + 검증 + 토스트 처리
      </div>
    </div>
  );
};

export default ChangePasswordPage;
