import React from "react";
import { QueryBar } from "@/features/sourcing-products/query-bar";
import {
  SourcingProductsGrid,
  useSourcingProducts,
} from "@/widgets/sourcing-products";

const ProductSourcingPage: React.FC = () => {
  const s = useSourcingProducts();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="w-full px-6 py-6">
        <div className="mb-4 flex items-end gap-3">
          <div>
            <div className="text-xl font-extrabold text-slate-900">
              상품 소싱
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <SourcingProductsGrid
            queryPanel={
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <QueryBar
                  value={s.query}
                  onChange={s.setQuery}
                  onSearch={() => {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    s.search();
                  }}
                  onReset={s.resetQuery}
                />
              </div>
            }
            rows={s.rows}
            allRows={s.allRows}
            setAllRows={s.setAllRows}
            loadedCount={s.loadedCount}
            hasNext={s.hasNext}
            onLoadMore={s.loadMore}
            loadingMore={s.loadingMore}
            serverLoading={s.serverLoading}
            savedSeq={s.savedSeq}
            fxRateKrwPerCny={s.fxRateKrwPerCny}
            setFxRateKrwPerCny={s.setFxRateKrwPerCny}
            onSave={() => {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              s.saveToServer();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductSourcingPage;
