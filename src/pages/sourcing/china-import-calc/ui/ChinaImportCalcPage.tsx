import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ChinaImportCalcSheet } from "@/widgets/china-import-calc";

export const ChinaImportCalcPage: React.FC = () => {
  const [sp] = useSearchParams();
  const [, setSp] = useSearchParams();

  const productSourcingId = useMemo(() => {
    const v = sp.get("productSourcingId");
    return v && v.trim().length > 0 ? v.trim() : null;
  }, [sp]);

  return (
    <div className="w-full">
      <ChinaImportCalcSheet
        productSourcingId={productSourcingId}
        onChangeProductSourcingId={(id) => {
          const next = new URLSearchParams(sp);
          if (!id) next.delete("productSourcingId");
          else next.set("productSourcingId", id);
          setSp(next, { replace: true });
        }}
      />
    </div>
  );
};
