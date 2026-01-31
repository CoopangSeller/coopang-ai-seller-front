import React from "react";
import { QueryBar } from "@/features/sourcing-products/query-bar";
import { SourcingProductsGrid } from "@/widgets/sourcing-products";
import { useSourcingProducts } from "@/widgets/sourcing-products/model/useSourcingProducts";

const ProductSourcingPage: React.FC = () => {
  const s = useSourcingProducts();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="mx-auto w-full max-w-[1560px] px-6 py-6">
        {/* Header */}
        <div className="mb-4 flex items-end gap-3">
          <div>
            <div className="text-xl font-extrabold text-slate-900">
              상품 소싱
            </div>
            <div className="mt-1 text-sm text-slate-500">
              엑셀처럼 입력하고 업로드/다운로드로 관리하세요.
            </div>
          </div>
        </div>

        {/* Query (compact) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <QueryBar
            value={s.query}
            onChange={s.setQuery}
            onSearch={() => {
              /* 로컬 필터라 no-op, 서버 붙으면 호출 */
            }}
            onReset={s.resetQuery}
          />
        </div>

        {/* Grid (primary) */}
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <SourcingProductsGrid
            rows={s.rows}
            allRows={s.allRows}
            setAllRows={s.setAllRows}
            onSave={s.save}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductSourcingPage;
