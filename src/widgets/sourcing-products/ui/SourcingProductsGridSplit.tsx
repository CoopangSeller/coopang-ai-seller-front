import React, { useRef, useEffect } from "react";
import { SourcingProductRow } from "@/entities/sourcing-product";

type Props = {
  rows: SourcingProductRow[];
};

export function SourcingProductsGridSplit({ rows }: Props) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // 세로 스크롤 동기화
  useEffect(() => {
    const l = leftRef.current;
    const r = rightRef.current;
    if (!l || !r) return;

    const sync = (from: HTMLElement, to: HTMLElement) => {
      to.scrollTop = from.scrollTop;
    };

    const onLeft = () => sync(l, r);
    const onRight = () => sync(r, l);

    l.addEventListener("scroll", onLeft);
    r.addEventListener("scroll", onRight);

    return () => {
      l.removeEventListener("scroll", onLeft);
      r.removeEventListener("scroll", onRight);
    };
  }, []);

  return (
    <div className="flex border border-slate-200 rounded-2xl overflow-hidden">
      {/* LEFT FIXED */}
      <div
        ref={leftRef}
        className="w-[520px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white"
      >
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold">
              <th className="p-2 w-10">✓</th>
              <th className="p-2 w-16">상태</th>
              <th className="p-2 w-12">No</th>
              <th className="p-2 w-48">키워드</th>
              <th className="p-2 w-32">도매처</th>
              <th className="p-2 w-32">참고 상품</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 text-center">□</td>
                <td className="p-2">{r.op === "create" ? "NEW" : ""}</td>
                <td className="p-2">{r.no}</td>
                <td className="p-2 truncate">{r.keyword}</td>
                <td className="p-2 truncate">{r.vendor}</td>
                <td className="p-2 truncate">{r.refProduct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RIGHT SCROLL */}
      <div ref={rightRef} className="flex-1 overflow-auto">
        <table className="min-w-[1400px] table-fixed border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold">
              <th className="p-2 w-240">1688 URL</th>
              <th className="p-2 w-200">이미지</th>
              <th className="p-2 w-120">원가(위안)</th>
              <th className="p-2 w-120">원가(원)</th>
              <th className="p-2 w-200">쿠팡 카테고리</th>
              <th className="p-2 w-120">판매가</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 truncate">{r.url1688}</td>
                <td className="p-2 truncate">{r.imageUrl}</td>
                <td className="p-2 text-right">{r.costCny}</td>
                <td className="p-2 text-right">{r.costKrw}</td>
                <td className="p-2">{r.coupangCategory}</td>
                <td className="p-2 text-right">{r.salePriceKrw}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
