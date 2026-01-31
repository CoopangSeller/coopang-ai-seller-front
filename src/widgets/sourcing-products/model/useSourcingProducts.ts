import { useMemo, useState } from "react";
import { useDraft } from "@/features/draft";
import { STORAGE_KEYS } from "@/shared/config/storageKeys";
import { SourcingProductRow, SourcingQuery } from "@/entities/sourcing-product";

type DraftShape = { rows: SourcingProductRow[] };
const DEFAULT: DraftShape = { rows: [] };

const DEFAULT_QUERY: SourcingQuery = {};

export function useSourcingProducts() {
  const draft = useDraft<DraftShape>(STORAGE_KEYS.SOURCING_PRODUCTS_DRAFT, DEFAULT);
  // draft: { state, setState, clear }

  const [query, setQuery] = useState<SourcingQuery>(DEFAULT_QUERY);

  const filtered = useMemo(() => {
    // delete는 숨김 정책 유지 (서버 붙으면 UI 토글 옵션으로 변경 가능)
    const rows = draft.state.rows.filter((r) => r.op !== "delete");

    return rows.filter((r) => {
      if (query.keyword && !r.keyword.includes(query.keyword)) return false;
      if (query.vendor && !r.vendor.includes(query.vendor)) return false;

      const created = r.createdAt?.slice(0, 10) ?? "";
      if (query.createdFrom && created < query.createdFrom) return false;
      if (query.createdTo && created > query.createdTo) return false;

      return true;
    });
  }, [draft.state.rows, query]);

  function save() {
    // ✅ 같은 참조 저장 방지: 새 객체로 set (persist 트리거/리렌더 안정)
    draft.setState((prev) => ({ ...prev }));
  }

  function resetQuery() {
    setQuery(DEFAULT_QUERY);
  }

  return {
    query,
    setQuery,
    resetQuery,

    rows: filtered,
    allRows: draft.state.rows,

    setAllRows: (rows: SourcingProductRow[]) =>
      draft.setState((prev) => ({ ...prev, rows })),

    save,
    clearDraft: draft.clear,
  };
}
