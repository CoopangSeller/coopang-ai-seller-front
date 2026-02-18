import { authHttp } from "@/entities/session";
import { withTimeout } from "@/shared/lib/async/withTimeout";
import { calcDerived } from "../model/calc";
import type { SourcingProductRow, SourcingQuery } from "../model/types";

type ProductSourcingSummaryDto = {
  from?: string;
  to?: string;
  keyword?: string;
};

type ProductSourcingSummary = {
  id: string | number;
  userId?: string | number;
  keyword?: string;
  referenceProduct?: string;
  sourceUrl?: string;
  imageUrl?: string;
  name?: string;
  costCny?: number;
  costKrw?: number;
  coupangCategory?: string;
  wingLogisticsCategory?: string;
  salePriceKrw?: number;
  feeRatePercent?: number;
  feeAmountKrw?: number;
  vatKrw?: number;
  grossMarginKrw?: number;
  grossMarginRatePercent?: number;
  minAdRoiPercent?: number;
  createAt?: string;
  updateAt?: string;
};

// ✅ 서버 실제 응답 (2026-02 기준)
type ProductSourcingSummaryCursorServerResponse = {
  productSourcingList: {
    summaryList?: ProductSourcingSummary[];
    nextCursorCreatedAt?: string | null;
    nextCursorId?: string | number | null;
    hasNext?: boolean;
  };
};

export type ProductSourcingSummaryCursorResponse = {
  items: ProductSourcingSummary[];
  nextCursor: { createdAt: string; id: string } | null;
  hasNext: boolean;
};

export type GetSummaryCursorParams = {
  from: string;
  to: string;
  keyword?: string;
  size?: number;
  cursorCreatedAt?: string;
  cursorId?: string | number;
};

type ProductSourcingUpsertCommand = {
  id?: string | null;
  keyword?: string | null;
  sourceUrl?: string | null;
  referenceProduct?: string;
  name?: string;
  imageUrl?: string;
  costCny?: number;
  costKrw?: number;
  coupangCategory?: string;
  wingLogisticsCategory?: string;
  salePriceKrw?: number;
  feeRatePercent?: number;
  feeAmountKrw?: number;
  vatKrw?: number;
  grossMarginKrw?: number;
  grossMarginRatePercent?: number;
  minAdRoiPercent?: number;
};

type ProductSourcingBulkSaveCommand = {
  upserts: ProductSourcingUpsertCommand[];
  deleteIds?: string[];
};

type ProductSourcing = ProductSourcingSummary;
type ProductSourcingCommandResponse = { productSourcingList: ProductSourcing[] };

const DEFAULT_TIMEOUT_MS = 20_000;

export const productSourcingApi = {
  // ✅ cursor paging 버전
  async getSummaryCursor(params: GetSummaryCursorParams) {
    const qs = new URLSearchParams();

    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    if (params.keyword) qs.set("keyword", params.keyword);

    qs.set("size", String(params.size ?? 20));
    if (params.cursorCreatedAt) qs.set("cursorCreatedAt", params.cursorCreatedAt);
    if (params.cursorId != null) qs.set("cursorId", String(params.cursorId));

    const raw = await authHttp<ProductSourcingSummaryCursorServerResponse>(
      `/product/sourcing?${qs.toString()}`,
      {
        method: "GET",
        errorToastTitle: "목록 조회 실패",
        showGlobalLoading: false
      },
    );

    const list = raw?.productSourcingList;
    const items = Array.isArray(list?.summaryList) ? list.summaryList : [];

    const nextCreatedAt = list?.nextCursorCreatedAt ?? null;
    const nextId = list?.nextCursorId ?? null;

    return {
      items,
      nextCursor:
        nextCreatedAt && nextId != null
          ? { createdAt: nextCreatedAt, id: String(nextId) }
          : null,
      hasNext: Boolean(list?.hasNext),
    } satisfies ProductSourcingSummaryCursorResponse;
  },

  async bulkSave(command: ProductSourcingBulkSaveCommand, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return withTimeout(
      () =>
        authHttp<ProductSourcingCommandResponse>("/product/sourcing/bulk", {
          method: "POST",
          body: JSON.stringify(command),
          errorToastTitle: "저장 실패",
          showGlobalLoading: false
        }),
      timeoutMs,
    );
  },
};

function ymdLocalToInstant(ymd: string, hh: number, mm: number, ss: number) {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  const dt = new Date(y, m - 1, d, hh, mm, ss, 0); // ✅ 로컬 타임존 기준
  return dt.toISOString(); // ✅ UTC Instant (Z)
}

export function queryToServerCondition(q: SourcingQuery): ProductSourcingSummaryDto {
  return {
    from: q.createdFrom ? ymdLocalToInstant(q.createdFrom, 0, 0, 0) : undefined,
    to: q.createdTo ? ymdLocalToInstant(q.createdTo, 23, 59, 59) : undefined,
    keyword: q.keyword,
  };
}

export function serverSummaryToRow(s: ProductSourcingSummary): SourcingProductRow {
  return {
    // ✅ 서버 행은 id 하나만 존재한다고 가정 → row.id도 서버 id로 통일
    // (삭제/선택/merge 안정화 + "서버에서 가져온 행인데 바로 삭제" 버그 방지)
    id: String(s.id),
    serverId: String(s.id),

    createdAt: (s.createAt ?? s.updateAt) ?? new Date().toISOString(),
    op: "none",

    keyword: s.keyword ?? "",
    vendor: s.referenceProduct ?? "",
    refProduct: s.referenceProduct ?? "",
    url1688: s.sourceUrl ?? "",
    imageUrl: s.imageUrl ?? "",

    costCny: s.costCny ?? undefined,
    costKrw: s.costKrw ?? undefined,

    coupangCategory: s.coupangCategory ?? "",
    salePriceKrw: s.salePriceKrw ?? undefined,

    // 서버는 % 단위(예: 10.8)일 가능성이 높음 → 프론트는 0~1로 저장
    feeRate: typeof s.feeRatePercent === "number" ? s.feeRatePercent / 100 : 0.108,

    productName: s.name ?? "",
    shippingKrw: 3000,
  };
}

export function rowsToBulkCommand(rows: SourcingProductRow[]): ProductSourcingBulkSaveCommand | null {
  const upserts: ProductSourcingUpsertCommand[] = [];
  const deleteIds: string[] = [];

  for (const r of rows) {
    if (r.op === "delete") {
      if (r.serverId) deleteIds.push(r.serverId);
      continue;
    }
    if (r.op !== "create" && r.op !== "update") continue;

    const d = calcDerived(r);

    upserts.push({
      id: r.op === "create" ? null : (r.serverId ?? null),

      keyword: r.keyword ?? "",
      name: r.productName || undefined,
      sourceUrl: r.url1688 || undefined,
      referenceProduct: r.refProduct || undefined,
      imageUrl: r.imageUrl || undefined,

      costCny: r.costCny ?? undefined,
      costKrw: r.costKrw ?? undefined,

      coupangCategory: r.coupangCategory || undefined,
      wingLogisticsCategory: r.vendor || undefined,

      salePriceKrw: r.salePriceKrw ?? undefined,

      feeRatePercent: typeof r.feeRate === "number" ? r.feeRate * 100 : undefined,
      feeAmountKrw: d.feeAmount ?? undefined,
      vatKrw: d.vat ?? undefined,
      grossMarginKrw: d.grossMargin ?? undefined,
      grossMarginRatePercent:
        typeof d.grossMarginRate === "number" ? d.grossMarginRate * 100 : undefined,
      minAdRoiPercent: typeof d.minAdRoi === "number" ? d.minAdRoi * 100 : undefined,
    });
  }

  if (upserts.length === 0 && deleteIds.length === 0) return null;
  return { upserts, deleteIds: deleteIds.length ? deleteIds : undefined };
}
