import React from "react";

const RegisteredProductsPage: React.FC = () => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-xl font-black text-slate-900">등록 상품 관리</div>
      <div className="mt-2 text-sm text-slate-600 font-medium">
        추후: 등록 상품 목록/태그/상태/연결된 상세·썸네일 자산 관리
      </div>
    </div>
  );
};

export default RegisteredProductsPage;
