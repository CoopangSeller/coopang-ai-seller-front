import { useEffect, useMemo, useRef, useState } from "react";
import { useDraft } from "@/features/draft";
import { STORAGE_KEYS } from "@/shared/config/storageKeys";
import type { SourcingProductRow, SourcingQuery } from "@/entities/sourcing-product";
import {
  productSourcingApi,
  rowsToBulkCommand,
  serverSummaryToRow,
} from "@/entities/sourcing-product";
import { toastStore } from "@/shared/model/toastStore";

type DraftShape = {
  rows: SourcingProductRow[];
  /** 원/위안 환율 (소싱 화면에서 원가(원) 자동계산용) */
  fxRateKrwPerCny: number;
};

const DEFAULT: DraftShape = { rows: [], fxRateKrwPerCny: 190 };

const PAGE_SIZE = 20;
type Cursor = { createdAt: string; id: string } | null;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function formatYmdLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parseYmdToLocalDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function getDefaultQuery(): SourcingQuery {
  const now = new Date();
  const to = formatYmdLocal(now);

  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 7);
  const from = formatYmdLocal(fromDate);

  return { createdFrom: from, createdTo: to } as SourcingQuery;
}

// 서버 응답을 row로 바꾸고, serverId 기준으로 중복 방지 merge
function mergeByServerId(prev: SourcingProductRow[], next: SourcingProductRow[]) {
  const map = new Map<string, SourcingProductRow>();
  for (const r of prev) {
    const key = r.serverId ?? `local:${r.id}`;
    map.set(key, r);
  }
  for (const r of next) {
    const key = r.serverId ?? `local:${r.id}`;
    if (!map.has(key)) map.set(key, r);
  }
  return Array.from(map.values());
}

function buildServerCondition(query: SourcingQuery) {
  const base = getDefaultQuery();

  const createdFrom = (query as any).createdFrom ?? (base as any).createdFrom;
  const createdTo = (query as any).createdTo ?? (base as any).createdTo;

  const fromLocal = startOfDayLocal(parseYmdToLocalDate(createdFrom));
  const toLocal = endOfDayLocal(parseYmdToLocalDate(createdTo));

  return {
    from: fromLocal.toISOString(),
    to: toLocal.toISOString(),
    keyword: (query as any).keyword ?? undefined,
  };
}

export function useSourcingProducts() {
  const draft = useDraft<DraftShape>(STORAGE_KEYS.SOURCING_PRODUCTS_DRAFT, DEFAULT);

  const [query, setQuery] = useState<SourcingQuery>(() => getDefaultQuery());

  const [serverLoading, setServerLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [hasNext, setHasNext] = useState(false);
  const [cursor, setCursor] = useState<Cursor>(null);

  // ✅ 저장 완료 후 체크 해제 트리거
  const [savedSeq, setSavedSeq] = useState(0);

  const loadMoreLock = useRef(false);

  const filtered = useMemo(() => {
    const rows = draft.state.rows;

    return rows.filter((r) => {
      if ((query as any).keyword && !r.keyword.includes((query as any).keyword)) return false;
      if ((query as any).vendor && !r.vendor.includes((query as any).vendor)) return false;

      const created = r.createdAt?.slice(0, 10) ?? "";
      if ((query as any).createdFrom && created < (query as any).createdFrom) return false;
      if ((query as any).createdTo && created > (query as any).createdTo) return false;

      return true;
    });
  }, [draft.state.rows, query]);

  async function fetchPage(mode: "reset" | "append") {
    const condition = buildServerCondition(query);

    const res = await productSourcingApi.getSummaryCursor({
      ...condition,
      size: PAGE_SIZE,
      cursorCreatedAt: mode === "append" ? cursor?.createdAt : undefined,
      cursorId: mode === "append" ? cursor?.id : undefined,
    });

    const rows = (res.items ?? []).map(serverSummaryToRow);

    draft.setState((prev) => {
      const merged = mode === "append" ? mergeByServerId(prev.rows, rows) : rows;
      return { ...prev, rows: merged };
    });

    setHasNext(Boolean(res.hasNext));
    setCursor(res.nextCursor ?? null);

    return rows.length;
  }

  async function search() {
    setServerLoading(true);
    try {
      setCursor(null);
      setHasNext(false);

      const count = await fetchPage("reset");
      toastStore.push({ type: "success", title: "불러오기 완료", message: `${count}건` });
    } catch {
      // authHttp 토스트
    } finally {
      setServerLoading(false);
    }
  }

  async function loadMore() {
    if (!hasNext) return;
    if (loadMoreLock.current) return;

    loadMoreLock.current = true;
    setLoadingMore(true);
    try {
      await fetchPage("append");
    } catch {
      // authHttp 토스트
    } finally {
      setLoadingMore(false);
      loadMoreLock.current = false;
    }
  }

  async function saveToServer() {
    const cmd = rowsToBulkCommand(draft.state.rows);
    if (!cmd) {
      toastStore.push({ type: "info", title: "저장할 변경사항이 없습니다.", message: "" });
      return;
    }

    setServerLoading(true);
    try {
      // ✅ 저장 성공(200)만 확인
      await productSourcingApi.bulkSave(cmd);

      // ✅ 현재 조회 조건으로 재조회
      setCursor(null);
      setHasNext(false);
      const count = await fetchPage("reset");

      // ✅ 체크 해제 트리거
      setSavedSeq((x) => x + 1);

      toastStore.push({ type: "success", title: "저장 완료", message: `${count}건 재조회` });
    } catch {
      // authHttp 토스트
    } finally {
      setServerLoading(false);
    }
  }

  function resetQuery() {
    setQuery(getDefaultQuery());
  }

  useEffect(() => {
    // ✅ React 18 StrictMode(dev)에서 mount effect가 2회 실행될 수 있음.
    // 페이지 진입 시 자동 조회는 "한 번"만 수행하도록 모듈 스코프 가드 사용.
    if (draft.state.rows.length > 0) return;
    if (autoSearchedOnce) return;
    autoSearchedOnce = true;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    query,
    setQuery,
    resetQuery,

    rows: filtered,
    loadedCount: filtered.length,

    hasNext,
    loadMore,
    loadingMore,

    allRows: draft.state.rows,
    setAllRows: (rows: SourcingProductRow[]) => draft.setState((prev) => ({ ...prev, rows })),

    fxRateKrwPerCny: draft.state.fxRateKrwPerCny,
    setFxRateKrwPerCny: (v: number) =>
      draft.setState((prev) => ({ ...prev, fxRateKrwPerCny: v })),

    saveToServer,
    search,

    serverLoading,
    savedSeq,

    clearDraft: draft.clear,
  };
}

// eslint-disable-next-line no-var
var autoSearchedOnce = false;
