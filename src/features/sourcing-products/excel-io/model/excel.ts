import * as XLSX from "xlsx";
import { SourcingProductRow } from "@/entities/sourcing-product";

const SHEET_NAME = "시트1";

export function importRowsFromXlsx(file: File): Promise<SourcingProductRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const data = new Uint8Array(reader.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });

      const ws = wb.Sheets[SHEET_NAME] ?? wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

      // 헤더가 "키워드" 등으로 잡히는 구조를 가정
      const mapped: SourcingProductRow[] = rows
        .filter(r => r["키워드"] || r["판매가"])
        .map((r, idx) => ({
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          op: "create",
          no: r["No."] || idx + 1,
          keyword: String(r["키워드"] ?? ""),
          vendor: String(r["참고 상품"] ?? ""),
          refProduct: String(r["참고 상품"] ?? ""),
          url1688: String(r["1688 URL"] ?? ""),
          imageUrl: String(r["이미지"] ?? ""),
          costCny: r["원가"] === "위안" ? undefined : Number(r["원가"] || 0),
          costKrw: Number(r["원가.1"] || r["원가(원)"] || 0), // 케이스마다 키가 달라질 수 있음
          coupangCategory: String(r["쿠팡 카테고리\n(드롭다운)"] ?? ""),
          wingLogisticsCategory: String(r["입출고 및 배송 카테고리\n(윙 로그인 후 클릭)"] ?? ""),
          salePriceKrw: Number(r["판매가"] || 0),
          feeRate: typeof r["수수료(%)"] === "number" ? r["수수료(%)"] : undefined,
          productName: String(r["상품명"] ?? ""),
          shippingKrw: Number(r["입출고 및 배송 카테고리\n(윙 로그인 후 클릭)"] || 3000), // 엑셀 구조상 I열 값이 운임으로 쓰이는 케이스가 있어 확장
        }));

      resolve(mapped);
    };
    reader.readAsArrayBuffer(file);
  });
}

export function exportRowsToXlsx(rows: SourcingProductRow[]) {
  const aoa = [
    ["No.", "키워드", "참고 상품", "1688 URL", "이미지", "원가(원)", "운임", "판매가", "수수료(%)", "상품명"],
    ...rows
      .filter(r => r.op !== "delete")
      .map(r => [
        r.no ?? "",
        r.keyword,
        r.vendor,
        r.url1688,
        r.imageUrl,
        r.costKrw ?? "",
        r.shippingKrw ?? "",
        r.salePriceKrw ?? "",
        r.feeRate ?? "",
        r.productName,
      ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);

  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sourcing-products.xlsx";
  a.click();
  URL.revokeObjectURL(a.href);
}
